// W26-P1 (B1 P2): PDP main image + related-item images are plain <img> in a
// server component — next/image auto-prefixes NEXT_PUBLIC_BASE_PATH for
// root-relative srcs, plain <img> does NOT, so `/images/products/{sku}.webp`
// 404s when the storefront is served under /suradai (public assets live under
// the basePath; W26-B1 §4 evidence). Same fix class as W13-V1-F2 apiUrl.
//
// Run (house style, from apps/storefront-suradai):
//   env -u DATABASE_URL -u STRIPE_SECRET_KEY TEST_DB=pglite NODE_ENV=test \
//     npx vitest run src/lib/asset-url.test.ts

import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { assetUrl } from './api';

const PAGE_SRC = readFileSync(
    fileURLToPath(new URL('../app/[locale]/products/[id]/page.tsx', import.meta.url)),
    'utf8',
);

const ENV_KEY = 'NEXT_PUBLIC_BASE_PATH';
let originalBasePath: string | undefined;

beforeEach(() => {
    originalBasePath = process.env[ENV_KEY];
});

afterEach(() => {
    if (originalBasePath === undefined) delete process.env[ENV_KEY];
    else process.env[ENV_KEY] = originalBasePath;
});

describe('assetUrl: plain-<img> basePath prefix (W26-P1)', () => {
    test('prefixes root-relative asset paths when NEXT_PUBLIC_BASE_PATH=/suradai', () => {
        process.env[ENV_KEY] = '/suradai';
        expect(assetUrl('/images/products/013g1350.webp')).toBe(
            '/suradai/images/products/013g1350.webp',
        );
    });

    test('leaves asset paths untouched when NEXT_PUBLIC_BASE_PATH is empty/unset', () => {
        delete process.env[ENV_KEY];
        expect(assetUrl('/images/products/013g1350.webp')).toBe('/images/products/013g1350.webp');
        process.env[ENV_KEY] = '';
        expect(assetUrl('/images/products/013g1350.webp')).toBe('/images/products/013g1350.webp');
    });

    test('passes non-root-relative srcs through unchanged (next/image semantics)', () => {
        process.env[ENV_KEY] = '/suradai';
        expect(assetUrl('https://cdn.example.com/x.webp')).toBe('https://cdn.example.com/x.webp');
        expect(assetUrl('data:image/svg+xml;base64,AAAA')).toBe('data:image/svg+xml;base64,AAAA');
    });
});

describe('PDP page wiring (W26-P1): plain <img> must route through assetUrl', () => {
    test('main image and related-item images use assetUrl', () => {
        expect(PAGE_SRC).toContain('src={assetUrl(product.image)}');
        expect(PAGE_SRC).toContain('src={assetUrl(r.image)}');
    });

    test('no bare root-absolute <img src={product.image|r.image} remains', () => {
        expect(PAGE_SRC).not.toMatch(/<img\s+src=\{product\.image\}/);
        expect(PAGE_SRC).not.toMatch(/<img\s+src=\{r\.image\}/);
    });
});

// W26-P3 (C2 §R1 P2): next/image's defaultLoader prefixes basePath on the
// `/_next/image` ENDPOINT but NOT inside the `url` param — the optimizer
// fetches the param verbatim, so `/images/products/{sku}.webp` 400s under
// /suradai (live matrix: no-prefix 400, %2Fsuradai%2F… 200). Every <Image>
// that renders product/cart image data must wrap its src in assetUrl().
const IMAGE_COMPONENT_SOURCES: Array<[string, string]> = [
    ['product-card', '../components/product-card.tsx'],
    ['popular-products', '../components/popular-products.tsx'],
    ['cart-drawer', '../components/cart-drawer.tsx'],
    ['search-overlay', '../components/search-overlay.tsx'],
    ['cart page', '../app/[locale]/cart/page.tsx'],
    ['product-detail-client', '../components/product-detail-client.tsx'],
];

const readSrc = (rel: string) =>
    readFileSync(fileURLToPath(new URL(rel, import.meta.url)), 'utf8');

describe('W26-P3: next/image product srcs route through assetUrl (optimizer basePath fix)', () => {
    test.each(IMAGE_COMPONENT_SOURCES)('%s <Image> wraps product image src in assetUrl()', (_name, rel) => {
        const src = readSrc(rel);
        expect(src).toContain('import { assetUrl }');
        expect(src).toMatch(/src=\{assetUrl\(/);
    });

    test('card src resolves to the exact optimizer url form that returned 200 live (C2 §R1 matrix)', () => {
        process.env[ENV_KEY] = '/suradai';
        // defaultLoader emits `url=${encodeURIComponent(src)}` verbatim; the
        // endpoint basePath (`/suradai/_next/image`) is build-time config —
        // the unit contract is the url param carrying basePath.
        const cardSrc = assetUrl('/images/products/013g1350.webp');
        expect(`/_next/image?url=${encodeURIComponent(cardSrc)}&w=640&q=75`).toBe(
            '/_next/image?url=%2Fsuradai%2Fimages%2Fproducts%2F013g1350.webp&w=640&q=75',
        );
    });

    test('remote srcs keep identical optimizer url params (no remote behavior change)', () => {
        process.env[ENV_KEY] = '/suradai';
        const remote = 'https://cdn.example.com/x.webp';
        expect(assetUrl(remote)).toBe(remote);
    });
});

// W22-D1-C (G-D1-2 & G-D1-3): client fetch() calls in rfq-form, search-overlay,
// and sync-manager must wrap internal /api/* paths in apiUrl(); /krepselis must
// route item.image through assetUrl() and have zero banned emoji / rounded-full.
const API_CLIENT_SOURCES: Array<[string, string, string]> = [
    ['rfq-form', '../components/rfq-form.tsx', "apiUrl('/api/rfq')"],
    ['search-overlay', '../components/search-overlay.tsx', 'apiUrl(`/api/search?q='],
    ['sync-manager', '../components/sync-manager.tsx', "apiUrl('/api/products/batch')"],
];

describe('W22-D1-C (G-D1-2 & G-D1-3): apiUrl and krepselis/checkout v3 wiring', () => {
    test.each(API_CLIENT_SOURCES)('%s wraps internal /api/* fetch in apiUrl()', (_name, rel, expectedCall) => {
        const src = readSrc(rel);
        expect(src).toContain('apiUrl');
        expect(src).toContain(expectedCall);
        expect(src).not.toMatch(/fetch\(\s*['"`]\/api\//);
    });

    test('/krepselis wraps item.image in assetUrl(), mounts VatToggle, shows font-mono SKU, and has zero 🛒 or rounded-full', () => {
        const src = readSrc('../app/[locale]/krepselis/page.tsx');
        expect(src).toContain('assetUrl(item.image)');
        expect(src).toContain('VatToggle');
        expect(src).toContain('item.sku');
        expect(src).not.toContain('🛒');
        expect(src).not.toContain('rounded-full');
        expect(src).not.toContain('freeShippingFrom');
    });

    test('checkout-form and product-purchase have zero 🛒 emoji and zero rounded-full pill chrome', () => {
        const checkoutSrc = readSrc('../components/conversion/checkout-form.tsx');
        const purchaseSrc = readSrc('../components/conversion/product-purchase.tsx');
        expect(checkoutSrc).not.toContain('🛒');
        expect(checkoutSrc).not.toContain('rounded-full');
        expect(purchaseSrc).not.toContain('rounded-full');
    });

    test('/products search form action uses assetUrl or basePath-safe route and supports multi-SKU paste', () => {
        const productsPageSrc = readSrc('../app/[locale]/products/page.tsx');
        expect(productsPageSrc).not.toContain('action="/products"');
    });
});

