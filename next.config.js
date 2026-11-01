const path = require('path');
const dotenv = require('dotenv');
const createNextIntlPlugin = require('next-intl/plugin');

// next-intl request config (i18n-en-lt mission): src/i18n/request.ts
const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const repoRoot = __dirname;
dotenv.config({ path: path.join(repoRoot, '.env') });

// CSP note: a static `Content-Security-Policy` was previously emitted
// here in prod and a `Content-Security-Policy-Report-Only` always.
// Both were removed (parity with storefront-aura cycle-37 P2
// unification): the per-request nonced policy is set in
// src/middleware.ts (single source, shared helper src/lib/csp-nonce.ts).
// Two CSP headers would be most-restrictive-wins and re-enable
// 'unsafe-inline' / 'unsafe-eval' on the public surface, so middleware
// is the only CSP on the wire.

/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'standalone',
    // W125-F1: NEXT_DIST_DIR leidžia pastatyti izoliuotą buildą (pvz. .next-w125)
    // nepaliečiant .next, iš kurio tuo metu sukasi gamybinis serveris.
    distDir: process.env.NEXT_DIST_DIR || '.next',
    // WP2-SURADAI: pin the workspace root. A stray /home/mindu/package-lock.json
    // made Next infer /home/mindu as the root, so `next build` and `next start`
    // disagreed about where .next lives (build wrote it in the app dir, start
    // looked under /home/mindu) and the i18n gate flaked on "no production build".
    // MUST be the monorepo root (NOT __dirname): with output:'standalone' the
    // tracing root decides where server.js lands in the Docker image
    // (Dockerfile CMD: node apps/storefront-suradai/server.js). __dirname put
    // server.js at the image root and crash-looped platform_storefront on
    // 2026-09-27 (WP2-COMBINED-DEPLOY hotfix).
    outputFileTracingRoot: repoRoot,
    // PLATFORM-SEC R-13: never emit the X-Powered-By fingerprint.
    // headers() cannot REMOVE the built-in header; this flag is the
    // supported switch and holds under Next 15.
    poweredByHeader: false,
    // Path-prefix multi-store routing: caddy serves this app under
    // NEXT_PUBLIC_BASE_PATH (e.g. /suradai). Resolved at build time so
    // /_next/static asset URLs and server routes agree; the same value is
    // passed as a Docker build arg (see apps/storefront-suradai/Dockerfile).
    basePath: process.env.NEXT_PUBLIC_BASE_PATH || undefined,
    // Transpile database package
    transpilePackages: ['@platform/database'],

    // Handle ESM packages (Next 15: moved out of experimental)
    serverExternalPackages: ['uuid', 'pg', 'pg-native'],

    // Image optimization — serve WebP directly without single-core AVIF re-encoding stalls on 2000px .webp assets
    images: {
        domains: ['localhost', 'cdn.example.com'],
        formats: ['image/webp'],
        unoptimized: true,
    },

    // SEO headers
    async headers() {
        return [
            {
                source: '/:path*',
                headers: [
                    {
                        key: 'Strict-Transport-Security',
                        // Only enforced by browsers over HTTPS. Safe to set here for prod deployments.
                        value: 'max-age=31536000; includeSubDomains',
                    },
                    {
                        key: 'X-Frame-Options',
                        value: 'DENY',
                    },
                    {
                        key: 'X-Content-Type-Options',
                        value: 'nosniff',
                    },
                    {
                        key: 'Referrer-Policy',
                        value: 'strict-origin-when-cross-origin',
                    },
                    {
                        key: 'Permissions-Policy',
                        value: 'camera=(), microphone=(), geolocation=()',
                    },
                    // CSP is intentionally NOT set here. The per-request
                    // nonced policy is emitted by src/middleware.ts (see
                    // the comment at the top of this file). Two CSP
                    // headers would be most-restrictive-wins and re-enable
                    // 'unsafe-inline' / 'unsafe-eval' on the public
                    // surface.
                ],
            },
        ];
    },

    // Redirects for old URLs.
    // W118-A2 finding 8: non-canonical /contact and /privacy duplicate
    // /kontaktai and /privatumo-politika (both render the same content) —
    // 301 to the canonical routes. next.config redirects run before
    // src/middleware.ts, so no middleware change is needed.
    async redirects() {
        return [
            {
                source: '/:locale/contact',
                destination: '/:locale/kontaktai',
                statusCode: 301,
                locale: false,
            },
            {
                source: '/contact',
                destination: '/lt/kontaktai',
                statusCode: 301,
                locale: false,
            },
            {
                source: '/:locale/privacy',
                destination: '/:locale/privatumo-politika',
                statusCode: 301,
                locale: false,
            },
            {
                source: '/privacy',
                destination: '/lt/privatumo-politika',
                statusCode: 301,
                locale: false,
            },
        ];
    },

    webpack: (config, { isServer, webpack }) => {
        if (!isServer) {
            config.plugins.push(
                new webpack.NormalModuleReplacementPlugin(/^node:/, (resource) => {
                    resource.request = resource.request.replace(/^node:/, '');
                }),
            );
            config.resolve.fallback = {
                ...config.resolve.fallback,
                fs: false,
                path: false,
                crypto: false,
                net: false,
                tls: false,
                perf_hooks: false,
            };
        }
        config.resolve.alias = {
            ...config.resolve.alias,
            // Fix for ESM/CJS interop with uuid in Drizzle: resolve the CJS uuid@8.3.2
            // used by @platform/database, NOT the ESM-only uuid@13 hoisted via next.
            uuid: require.resolve('uuid', { paths: [path.join(repoRoot, 'packages/database')] }),
        };
        return config;
    },
};

module.exports = withNextIntl(nextConfig);
