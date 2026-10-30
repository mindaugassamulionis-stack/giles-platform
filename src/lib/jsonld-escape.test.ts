// C-INJ-05: JSON-LD XSS escape for product schema.
//
// The product page renders <script type="application/ld+json"> with
// user-controlled product fields (name, description, brand.name).
// JSON.stringify alone does NOT escape "</script>" or ">" so a
// product name like `</script><img src=x onerror=alert(1)>` breaks
// out of the script context.
//
// Fix: pass the serialised payload through `escapeJsonLdForScript`
// which replaces `<` / `>` with their unicode-escape form and also
// escapes U+2028 / U+2029 line/paragraph separators that JS would
// otherwise treat as line terminators inside a script element.
//
// Acceptance (C-INJ-05 brief §7.1):
//   (a) `</script><script>alert(1)</script>` seed is escaped in the
//       rendered HTML source, console clean, JSON-LD still parses
//       back to the same logical string.
//   (b) non-lossy: legitimate product names containing `<` or `>`
//       round-trip byte-for-byte through `JSON.parse` after escape.
//   (c) suradai and aura apply the same escape in the same way
//       (structural equivalence — both files use the helper, not the
//       lossy `replace(/[<>]/g, '')` from the W2-08 attempt).

import { describe, test, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { escapeJsonLdForScript } from './jsonld';

const AURA_PAGE =
    `${process.env.HOME}/.gemini/antigravity/scratch/platform-os/apps/storefront-aura/src/app/[locale]/products/[id]/page.tsx`;
const SURADAI_PAGE =
    `${process.env.HOME}/.gemini/antigravity/scratch/platform-os/apps/storefront-suradai/src/app/[locale]/products/[id]/page.tsx`;
const AURA_HELPER =
    '/home/mindu/.gemini/antigravity/scratch/platform-os/apps/storefront-aura/src/lib/jsonld.ts';
const SURADAI_HELPER =
    '/home/mindu/.gemini/antigravity/scratch/platform-os/apps/storefront-suradai/src/lib/jsonld.ts';

describe('escapeJsonLdForScript', () => {
    test('escapes `<` to \\u003c so </script> cannot close the script context', () => {
        const input = JSON.stringify({ name: '</script><script>alert(1)</script>' });
        const out = escapeJsonLdForScript(input);
        expect(out).not.toMatch(/<\/script/i);
        expect(out).toContain('\\u003c/script\\u003e');
    });

    test('escapes `>` to \\u003e', () => {
        const out = escapeJsonLdForScript(JSON.stringify({ x: 'A > B' }));
        expect(out).toContain('\\u003e');
    });

    test('escapes U+2028 line separator (valid in JSON, illegal in JS source)', () => {
        const input = JSON.stringify({ x: 'a\u2028b' });
        const out = escapeJsonLdForScript(input);
        expect(out).toContain('\\u2028');
    });

    test('escapes U+2029 paragraph separator', () => {
        const input = JSON.stringify({ x: 'a\u2029b' });
        const out = escapeJsonLdForScript(input);
        expect(out).toContain('\\u2029');
    });

    test('non-lossy: legitimate product name with `<` / `>` round-trips', () => {
        const product = { name: 'A < B > C', description: 'x & "y"' };
        const escaped = escapeJsonLdForScript(JSON.stringify(product));
        const parsed = JSON.parse(escaped);
        expect(parsed.name).toBe('A < B > C');
        expect(parsed.description).toBe('x & "y"');
    });

    test('does not mangle JSON structure (keys, numbers, booleans)', () => {
        const product = {
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: 'Real <Product>',
            price: 12.5,
            inStock: true,
        };
        const escaped = escapeJsonLdForScript(JSON.stringify(product));
        const parsed = JSON.parse(escaped);
        expect(parsed['@context']).toBe('https://schema.org');
        expect(parsed['@type']).toBe('Product');
        expect(parsed.name).toBe('Real <Product>');
        expect(parsed.price).toBe(12.5);
        expect(parsed.inStock).toBe(true);
    });

    test('input is non-empty string (defensive)', () => {
        // Even if a future caller passes an empty payload, the helper must not throw.
        expect(escapeJsonLdForScript('')).toBe('');
    });
});

describe('C-INJ-05: both storefront product pages use the shared escape', () => {
    test('aura product page calls escapeJsonLdForScript on the JSON-LD payload', () => {
        const src = readFileSync(AURA_PAGE, 'utf8');
        expect(src).toContain('escapeJsonLdForScript');
        // Must NOT regress to the lossy strip approach.
        expect(src).not.toMatch(/stripScriptBreakers/);
    });

    test('suradai product page calls escapeJsonLdForScript on the JSON-LD payload', () => {
        const src = readFileSync(SURADAI_PAGE, 'utf8');
        expect(src).toContain('escapeJsonLdForScript');
        expect(src).not.toMatch(/stripScriptBreakers/);
    });

    test('aura helper module exports the same escape contract', () => {
        const src = readFileSync(AURA_HELPER, 'utf8');
        expect(src).toMatch(/export function escapeJsonLdForScript/);
        expect(src).toMatch(/\\u003c/);
        expect(src).toMatch(/\\u003e/);
        expect(src).toMatch(/\\u2028/);
        expect(src).toMatch(/\\u2029/);
    });

    test('suradai helper module exports the same escape contract', () => {
        const src = readFileSync(SURADAI_HELPER, 'utf8');
        expect(src).toMatch(/export function escapeJsonLdForScript/);
        expect(src).toMatch(/\\u003c/);
        expect(src).toMatch(/\\u003e/);
        expect(src).toMatch(/\\u2028/);
        expect(src).toMatch(/\\u2029/);
    });
});
