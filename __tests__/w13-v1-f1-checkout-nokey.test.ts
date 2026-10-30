// W13-V1-F1 (V1-E1 / P1): no-key checkout graceful degradation contract.
// Without STRIPE_SECRET_KEY the checkout API must return HTTP 503 with
// localized GENERIC copy — no env-var names, no internal config detail —
// on BOTH storefronts (this is the suradai twin).
//
// Run (house style, from apps/storefront-suradai):
//   env -u DATABASE_URL -u STRIPE_SECRET_KEY TEST_DB=pglite NODE_ENV=test \
//     node --import tsx --test __tests__/w13-v1-f1-checkout-nokey.test.ts

import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { NextRequest } from 'next/server';

import ltCheckout from '../messages/lt/checkout.json';
import enCheckout from '../messages/en/checkout.json';

(process.env as Record<string, string | undefined>).NODE_ENV = 'test';
process.env.TEST_DB = 'pglite';
delete process.env.STRIPE_SECRET_KEY;

const ORIGIN = 'http://localhost:3001';

let POST: (req: NextRequest) => Promise<Response>;

before(async () => {
    ({ POST } = await import('../src/app/api/checkout/route'));
});

const FORBIDDEN_DETAIL = /STRIPE|SECRET_KEY|not configured/i;

function mkReq(init: { locale?: string; cookie?: string; acceptLanguage?: string }): NextRequest {
    const headers: Record<string, string> = { 'content-type': 'application/json' };
    if (init.cookie) headers['cookie'] = init.cookie;
    if (init.acceptLanguage) headers['accept-language'] = init.acceptLanguage;
    const body: Record<string, unknown> = { items: [{ id: 'w13-v1-f1', quantity: 1 }], email: 'nokey@test.local' };
    if (init.locale) body.locale = init.locale;
    return new NextRequest(ORIGIN + '/api/checkout', { method: 'POST', headers, body: JSON.stringify(body) });
}

test('no-key checkout: 503 + localized generic copy, default storefront locale (lt)', async () => {
    const res = await POST(mkReq({}));
    const data = await res.json() as { error?: string };
    assert.equal(res.status, 503, `expected 503 service-unavailable class, got ${res.status}`);
    assert.ok(data.error, 'body must carry an error message');
    assert.equal(data.error, (ltCheckout as Record<string, string>).paymentUnavailable,
        'body copy must be the localized catalog copy (lt default)');
    assert.doesNotMatch(JSON.stringify(data), FORBIDDEN_DETAIL, 'body must not name env vars or internal config');
});

test('no-key checkout: en locale (body.locale) returns the en catalog copy', async () => {
    const res = await POST(mkReq({ locale: 'en' }));
    const data = await res.json() as { error?: string };
    assert.equal(res.status, 503);
    assert.equal(data.error, (enCheckout as Record<string, string>).paymentUnavailable);
    assert.doesNotMatch(JSON.stringify(data), FORBIDDEN_DETAIL);
});

test('no-key checkout: NEXT_LOCALE cookie selects the locale without body.locale', async () => {
    const res = await POST(mkReq({ cookie: 'NEXT_LOCALE=en' }));
    const data = await res.json() as { error?: string };
    assert.equal(res.status, 503);
    assert.equal(data.error, (enCheckout as Record<string, string>).paymentUnavailable);
});

test('no-key checkout: localized copy actually differs per locale', async () => {
    const lt = (ltCheckout as Record<string, string>).paymentUnavailable;
    const en = (enCheckout as Record<string, string>).paymentUnavailable;
    assert.ok(lt && en, 'both catalog copies must exist');
    assert.notEqual(lt, en, 'lt/en generic copy must be localized, not one shared string');
});
