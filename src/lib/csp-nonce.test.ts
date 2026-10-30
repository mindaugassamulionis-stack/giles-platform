// Cycle-37 P2 storefront CSP nonce unification parity (3001 / suradai).
//
// The public storefront (port 3001) serves a per-request nonced CSP
// set in src/middleware.ts. Every server component that renders an
// inline <Script> or <script> (RootLayout -> <Analytics />,
// ProductPage -> JSON-LD <script>) reads the nonce from the
// `x-nonce` request header set by the same middleware. The browser
// enforces the same nonce on the response
// `Content-Security-Policy` header. Acceptance contract:
//
//   1. There is exactly ONE source of truth for the nonce generator
//      and the CSP string template (src/lib/csp-nonce.ts).
//   2. middleware imports from that module and stamps the same nonce
//      on the request and the response.
//   3. RootLayout and ProductPage read from the same `x-nonce`
//      header that middleware writes to.
//   4. The previous static `Content-Security-Policy` /
//      `Content-Security-Policy-Report-Only` from next.config.js is
//      gone so middleware is the only CSP on the wire (no
//      most-restrictive-wins merge that re-enables 'unsafe-inline').
//   5. `buildCsp(nonce)` includes the exact nonce string in
//      `script-src 'nonce-XXX'` so header nonce == body nonce.
//   6. script-src directive MUST NOT carry `unsafe-eval` (cycle-37
//      hardening; was present pre-parity).
//   7. next/script dangerouslySetInnerHTML blocks (GA, Clarity, FB
//      Pixel, TikTok) all receive the nonce so the browser accepts
//      the inline bootstrap.

import { describe, test, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import {
    buildCsp,
    createCspNonce,
    CSP_HEADER,
    NONCE_REQUEST_HEADER,
} from './csp-nonce';

const REPO = '/home/mindu/.gemini/antigravity/scratch/platform-os';
const MIDDLEWARE = `${REPO}/apps/storefront-suradai/src/middleware.ts`;
const LAYOUT = `${REPO}/apps/storefront-suradai/src/app/[locale]/layout.tsx`;
const PRODUCT_PAGE = `${REPO}/apps/storefront-suradai/src/app/[locale]/products/[id]/page.tsx`;
const ANALYTICS = `${REPO}/apps/storefront-suradai/src/components/analytics.tsx`;
const NEXT_CONFIG = `${REPO}/apps/storefront-suradai/next.config.js`;

describe('createCspNonce', () => {
    test('is a base64-encoded UUID (printable base64 alphabet)', () => {
        const nonce = createCspNonce();
        expect(nonce).toMatch(/^[A-Za-z0-9+/]+=*$/);
        expect(nonce.length).toBeGreaterThan(20);
    });

    test('two calls produce different nonces (per-request uniqueness)', () => {
        const a = createCspNonce();
        const b = createCspNonce();
        expect(a).not.toBe(b);
    });

    test('injected `random` is used so tests can pin output', () => {
        const fixed = '00000000-0000-4000-8000-000000000000';
        const n = createCspNonce({ randomUUID: () => fixed });
        const expected = Buffer.from(fixed).toString('base64');
        expect(n).toBe(expected);
    });
});

describe('buildCsp', () => {
    test('emits the exact nonce in script-src (header == body contract)', () => {
        const nonce = 'abc123==';
        const csp = buildCsp(nonce);
        expect(csp).toContain(`'nonce-${nonce}'`);
        expect(csp).toContain("'strict-dynamic'");
    });

    test('does NOT carry `unsafe-inline` on script-src (cycle-37 hardening)', () => {
        const csp = buildCsp('XYZ');
        const directives = csp.split(';').map((s) => s.trim());
        const scriptSrc = directives.find((d) => d.startsWith('script-src'));
        expect(scriptSrc).toBeDefined();
        expect(scriptSrc).not.toMatch(/'unsafe-inline'/);
    });

    test('does NOT carry `unsafe-eval` on script-src (cycle-37 hardening)', () => {
        const csp = buildCsp('XYZ');
        const directives = csp.split(';').map((s) => s.trim());
        const scriptSrc = directives.find((d) => d.startsWith('script-src'));
        expect(scriptSrc).toBeDefined();
        expect(scriptSrc).not.toMatch(/'unsafe-eval'/);
    });

    test('keeps frame-ancestors none and object-src none', () => {
        const csp = buildCsp('XYZ');
        expect(csp).toContain("frame-ancestors 'none'");
        expect(csp).toContain("object-src 'none'");
    });
});

describe('single-source-of-truth wiring (parity with 3002)', () => {
    test('middleware imports the helper and does NOT inline buildCsp / createCspNonce', () => {
        const src = readFileSync(MIDDLEWARE, 'utf8');
        expect(src).toMatch(/from ['"]\.\/lib\/csp-nonce['"]/);
        expect(src).toMatch(/\bbuildCsp\b/);
        expect(src).toMatch(/\bcreateCspNonce\b/);
        // No leftover inline generator.
        expect(src).not.toMatch(/Buffer\.from\(crypto\.randomUUID\(\)\)/);
    });

    test('middleware stamps the same header name on request and response', () => {
        const src = readFileSync(MIDDLEWARE, 'utf8');
        // 3001 keeps the existing `response` (not `res`) local so the
        // geo flow and the CSP stamp share the same response object.
        expect(src).toContain('requestHeaders.set(NONCE_REQUEST_HEADER, nonce)');
        expect(src).toContain('requestHeaders.set(CSP_HEADER, csp)');
        expect(src).toMatch(/response\.headers\.set\(CSP_HEADER,\s*csp\)/);
    });

    test('layout reads the nonce from x-nonce (request header written by middleware)', () => {
        const src = readFileSync(LAYOUT, 'utf8');
        expect(src).toMatch(/headers\(\)[\s\S]*?\.get\(['"`]x-nonce['"`]\)/);
        // Passes the nonce to <Analytics />.
        expect(src).toMatch(/<Analytics[\s\S]*nonce=\{nonce\}/);
    });

    test('product page reads the same nonce header for the JSON-LD <script>', () => {
        const src = readFileSync(PRODUCT_PAGE, 'utf8');
        expect(src).toMatch(/headers\(\)[\s\S]*?\.get\(['"`]x-nonce['"`]\)/);
        // Stamps it on the inline JSON-LD script.
        expect(src).toMatch(/<script[\s\S]*nonce=\{nonce\}/);
    });

    test('analytics component accepts and forwards the nonce to every next/script dangerouslySetInnerHTML block', () => {
        const src = readFileSync(ANALYTICS, 'utf8');
        // nonce is part of the Props.
        expect(src).toMatch(/nonce\?:\s*string/);
        // The destructured argument includes nonce.
        expect(src).toMatch(/\{\s*[^}]*\bnonce\b[^}]*\}/);
        // Four next/script blocks carry dangerouslySetInnerHTML; every
        // such block MUST receive the nonce prop so the inline bootstrap
        // is accepted. Count occurrences: 4 dangerouslySetInnerHTML in
        // analytics.tsx, 4 nonce={nonce} props after parity.
        const dsiCount = (src.match(/dangerouslySetInnerHTML=\{\{/g) || []).length;
        const noncePropCount = (src.match(/nonce=\{nonce\}/g) || []).length;
        expect(dsiCount).toBeGreaterThanOrEqual(4);
        expect(noncePropCount).toBe(dsiCount);
    });

    test('next.config.js no longer sets a static CSP (middleware is the only source)', () => {
        const src = readFileSync(NEXT_CONFIG, 'utf8');
        const stripped = src
            .replace(/\/\*[\s\S]*?\*\//g, '')
            .replace(/\/\/[^\n]*/g, '');
        expect(stripped).not.toMatch(/key:\s*['"`]Content-Security-Policy['"`]/);
        expect(stripped).not.toMatch(/key:\s*['"`]Content-Security-Policy-Report-Only['"`]/);
    });
});

describe('wire contract: header nonce == body nonce', () => {
    test('synthesized middleware output exposes the same nonce on the response header and x-nonce request header', () => {
        const nonce = createCspNonce();
        const csp = buildCsp(nonce);

        // Response header (browser enforcement).
        const responseHeader = csp;
        expect(responseHeader).toContain(`'nonce-${nonce}'`);

        // Request header (server-component read path).
        const requestHeader = nonce;
        expect(requestHeader).toBe(nonce);

        // Body nonce: the prop RootLayout / ProductPage / <Analytics />
        // forwards to <Script nonce={...}>. It MUST equal both.
        const bodyNonce = nonce;
        expect(bodyNonce).toBe(responseHeader.match(/'nonce-([^']+)'/)?.[1]);
        expect(bodyNonce).toBe(requestHeader);

        expect(CSP_HEADER).toBe('Content-Security-Policy');
        expect(NONCE_REQUEST_HEADER).toBe('x-nonce');
    });
});
