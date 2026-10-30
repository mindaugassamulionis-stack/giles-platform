// Per-request CSP nonce + policy builder.
//
// SINGLE SOURCE for the storefront-suradai CSP nonce cycle.
//
// History:
//   - next.config.js had a static `Content-Security-Policy`
//     (`'unsafe-inline' https:` no nonce) used as a prod-enforce
//     header + an always-on `Content-Security-Policy-Report-Only`.
//     That static policy and the per-request nonced policy (set by
//     src/middleware.ts) coexisted and merged under the browser's
//     most-restrictive-wins rule, which left `'unsafe-inline'` and
//     `'unsafe-eval'` script-src effective in prod and silently
//     defeated the cycle-37 hardening.
//   - This module is the single owner of: (a) nonce generation
//     (per-request base64 of a UUID), (b) the CSP string template.
//     Both middleware (producer) and any verifier / future consumer
//     read from it. The next.config static policy is removed so
//     middleware is the only header on the wire.
//
// Edge-runtime compatible: no Node-only APIs, no `Buffer` allocation
// outside the existing `Buffer.from(crypto.randomUUID())` call which
// Next.js edge runtime already supports.

/**
 * Generate a fresh per-request CSP nonce.
 *
 * Format: base64 of a UUIDv4 (16 random bytes -> 22-char base64). The
 * value is used both inside the CSP `script-src 'nonce-XXX' 'strict-dynamic'`
 * directive and stamped on the `x-nonce` request header so server
 * components (RootLayout, ProductPage) can read it via
 * `next/headers` and pass it to `<Script nonce={...}>` consumers.
 *
 * The function accepts an optional `random` injection point so tests
 * can pin the output without mocking globals.
 */
export function createCspNonce(
    random: { randomUUID: () => string } = globalThis.crypto,
): string {
    return Buffer.from(random.randomUUID()).toString('base64');
}

/**
 * Build the storefront Content-Security-Policy string for a given nonce.
 *
 * Design notes:
 *   - `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`: Next's
 *     inline bootstrap and our `next/script dangerouslySetInnerHTML`
 *     blocks carry the nonce; host-loaded scripts (Stripe js.stripe.com,
 *     GA googletagmanager.com, clarity.ms, facebook.net, TikTok)
 *     propagate via strict-dynamic without a static host allowlist.
 *   - `style-src 'self' 'unsafe-inline'`: React writes inline
 *     `style="..."` attributes which have no nonce mechanism; inline
 *     style attribute injection is materially lower risk than script
 *     injection. Mirrors the admin app and storefront-aura (3002).
 *   - `img-src 'self' data: blob: https:`: product images, hero
 *     backgrounds, CMS uploads.
 *   - `connect-src 'self' https://api.stripe.com https://api.x.ai
 *     https://api.openai.com`: storefront fetch targets.
 *   - `frame-src 'self' https://js.stripe.com https://hooks.stripe.com`:
 *     Stripe Elements / Checkout iframes.
 *   - `frame-ancestors 'none'`, `base-uri 'self'`, `form-action 'self'`,
 *     `object-src 'none'`: standard hardening.
 */
export function buildCsp(nonce: string): string {
    return [
        "default-src 'self'",
        `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: blob: https:",
        "font-src 'self' data:",
        "connect-src 'self' https://api.stripe.com https://api.x.ai https://api.openai.com",
        "frame-src 'self' https://js.stripe.com https://hooks.stripe.com",
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "object-src 'none'",
    ].join('; ');
}

/** Wire-level contract: header the browser enforces. */
export const CSP_HEADER = 'Content-Security-Policy';

/** Request-header key server components use to read the nonce. */
export const NONCE_REQUEST_HEADER = 'x-nonce';
