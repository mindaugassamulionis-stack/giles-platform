// W13-V1-F2 (V1R-E2): the suradai checkout UI must call its OWN basePath
// route — in prod the storefront is served under /suradai, so a hard-coded
// root-absolute fetch('/api/checkout') resolves against the origin root and
// 404s (live evidence: recheck-e-ui.json — POST https://92.5.163.199/api/checkout
// → 404), leaving checkout dead even with the V1-F1 route fix deployed.
// Route-level tests cannot see this class; this guard asserts the CLIENT-side
// URL construction.
//
// Run (house style, from apps/storefront-suradai):
//   env -u DATABASE_URL -u STRIPE_SECRET_KEY TEST_DB=pglite NODE_ENV=test \
//     node --import tsx --test __tests__/w13-v1-f2-checkout-client-path.test.ts

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { apiUrl } from '../src/lib/api';

process.env.NEXT_PUBLIC_BASE_PATH = '/suradai';

const PAGE_SRC = readFileSync(
    fileURLToPath(new URL('../src/app/[locale]/checkout/page.tsx', import.meta.url)),
    'utf8',
);

test('apiUrl prefixes the build-time basePath', () => {
    assert.equal(apiUrl('/api/checkout'), '/suradai/api/checkout',
        'client URL must include the storefront basePath');
    assert.equal(apiUrl('/api/checkout'.slice(0, 0) + '/api/shipping/methods'), '/suradai/api/shipping/methods');
});

test('suradai checkout page routes /api/checkout through apiUrl (no root-absolute fetch)', () => {
    assert.match(PAGE_SRC, /apiUrl\(['"`]\/api\/checkout['"`]\)/,
        "checkout page must call fetch(apiUrl('/api/checkout'), …)");
    assert.doesNotMatch(PAGE_SRC, /fetch\(\s*['"`]\/api\/checkout['"`]/,
        'root-absolute fetch(\'/api/checkout\') is the V1R-E2 404 root cause — must not exist');
});

test('no other root-absolute /api fetch remains on the checkout page', () => {
    const offenders = PAGE_SRC.match(/fetch\(\s*['"`](\/api\/[^'"`]*)['"`]/g) || [];
    assert.deepEqual(offenders, [],
        `root-absolute fetch(es) on the checkout page bypass the basePath: ${offenders.join(', ')}`);
});
