// W2-06: SEC-INJ-04 — stored XSS in CMS pages (suradai).
// Pre-fix: `apps/storefront-suradai/src/app/pages/[slug]/page.tsx:20`
// renders `page.content` via `dangerouslySetInnerHTML` without
// sanitization. An attacker who can publish a CMS page (storefront_pages
// table → status: published) gets stored XSS on every visit.
// Fix: server-side DOMPurify.sanitize(page.content, {ALLOWED_TAGS: [...]})
// before render, OR a server-rendered markdown/HTML pipeline that
// strips script contexts.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// apps/storefront-suradai/__tests__/security/foo.spec.ts
//   → up 2 → apps/storefront-suradai
const APP_ROOT = resolve(__dirname, '..', '..');
const PAGE_PATH = join(APP_ROOT, 'src', 'app', 'pages', '[slug]', 'page.tsx');
const source = readFileSync(PAGE_PATH, 'utf8');

test('W2-06: suradai page renders through a sanitizer', () => {
    const hasSanitize =
        /DOMPurify\.sanitize\(/.test(source) ||
        /sanitize\s*\(/.test(source) ||
        /sanitizeHtml\s*\(/.test(source) ||
        /function\s+sanitize\s*\(/.test(source) ||
        /function\s+sanitizeHtml\s*\(/.test(source) ||
        /from\s+['"`]isomorphic-dompurify['"`]/.test(source) ||
        /from\s+['"`]dompurify['"`]/.test(source);
    assert.equal(
        hasSanitize,
        true,
        'suradai page renders page.content without any sanitizer — stored XSS',
    );
});

test('W2-06: dangerouslySetInnerHTML only receives sanitized input', () => {
    const dangerousRaw = /dangerouslySetInnerHTML=\{\{\s*__html:\s*page\.content\s*\}\}/;
    assert.equal(
        dangerousRaw.test(source),
        false,
        'dangerouslySetInnerHTML still receives raw page.content',
    );
});
