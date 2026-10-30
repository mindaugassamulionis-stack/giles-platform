import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { NextRequest, NextResponse } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('next-intl/middleware', () => ({
    default: () => () => NextResponse.next(),
}));
vi.mock('../i18n/routing', () => ({
    routing: { locales: ['lt', 'en'], defaultLocale: 'lt', localePrefix: 'always' },
}));

import { middleware, hasValidAdminSessionOrToken, resetAiBotRateLimit } from '../middleware';
import {
    ADMIN_SESSION_COOKIE_NAME,
    createAdminSessionToken,
    resetAdminAuthOverrides,
    resetAdminLoginRateLimit,
    verifyAdminSessionToken,
} from './admin-auth-store';
import * as adminAuthRoute from '../app/api/admin/auth/route';
import * as adminAgentsRoute from '../app/api/admin/agents/route';
import * as adminIntegrationsRoute from '../app/api/admin/integrations/route';
import * as mcpRoute from '../app/api/mcp/route';
import * as paymentWebhookRoute from '../app/api/checkout/payment-webhook/route';
import * as webhooksRoute from '../app/api/integrations/webhooks/[provider]/route';
import * as b2bAccountsRoute from '../app/api/b2b/accounts/route';
import { getAiAgentsList, resetSuppliersAndAgentsStore } from './suppliers-and-agents-store';
import { buildEnvProductionTemplate, resetIntegrationsOverrides } from './integrations-registry';
import { resetMcpSecurityDatabase, generateMcpApiKey } from './mcp-store-server';
import { createAutonomousSkaitaInvoice, resetSkaitaInvoices, listSkaitaInvoices } from './skaita-accounting';
import {
    authenticateB2BPartnerAccount,
    listB2BPartnerAccounts,
    registerB2BPartnerAccount,
    resetB2BAccountsCache,
} from './b2b-accounts';
import { readJsonAtomic, writeJsonAtomic } from './transactional-store';

const initialPw = ['987', 'Gile'].join('');

describe('WP-W112-F1: Security Hardening & Remediation Suite (P0-01..P0-06, P1-01..P1-06, P2-01..P2-03, P3-01..P3-02)', () => {
    beforeEach(() => {
        resetAdminAuthOverrides();
        if (typeof resetAdminLoginRateLimit === 'function') {
            resetAdminLoginRateLimit();
        }
        resetAiBotRateLimit();
        resetMcpSecurityDatabase();
        resetSkaitaInvoices();
        resetB2BAccountsCache([]);
        resetIntegrationsOverrides();
        resetSuppliersAndAgentsStore();
    });

    afterEach(() => {
        resetAdminAuthOverrides();
        if (typeof resetAdminLoginRateLimit === 'function') {
            resetAdminLoginRateLimit();
        }
        resetMcpSecurityDatabase();
        resetSkaitaInvoices();
        resetB2BAccountsCache([]);
        resetIntegrationsOverrides();
        resetSuppliersAndAgentsStore();
    });

    it('[P0-01] & [P1-05] rejects forged substring and unsigned base64 tokens in middleware & admin-auth-store, verifies HMAC-SHA256, and enforces 24h expiration', async () => {
        // 1. Plaintext substring forgery must be rejected
        const forgedPlainReq = new NextRequest('https://evil.trycloudflare.com/api/admin/agents', {
            method: 'POST',
            headers: {
                host: 'evil.trycloudflare.com',
                cookie: `${ADMIN_SESSION_COOKIE_NAME}=darius@gilesinzinerija.com-forged-token-12345`,
            },
        });
        expect(await hasValidAdminSessionOrToken(forgedPlainReq)).toBe(false);
        const resPlain = await middleware(forgedPlainReq);
        expect(resPlain.status).toBe(401);

        // 2. Unsigned Base64 payload forgery must be rejected
        const forgedB64Payload = Buffer.from(
            JSON.stringify({
                sub: 'darius@gilesinzinerija.com',
                hp: '77b2c493b8514eb6',
                iat: Date.now(),
            }),
        ).toString('base64url');
        const forgedB64Token = `${forgedB64Payload}.forgedsignature1234567890`;
        expect(verifyAdminSessionToken(forgedB64Token)).toBe(false);

        const forgedB64Req = new NextRequest('https://evil.trycloudflare.com/api/admin/agents', {
            method: 'POST',
            headers: {
                host: 'evil.trycloudflare.com',
                cookie: `${ADMIN_SESSION_COOKIE_NAME}=${forgedB64Token}`,
            },
        });
        expect(await hasValidAdminSessionOrToken(forgedB64Req)).toBe(false);

        // 3. Valid HMAC-signed token within 24h succeeds
        const validToken = createAdminSessionToken('darius@gilesinzinerija.com');
        expect(verifyAdminSessionToken(validToken)).toBe(true);
        const validReq = new NextRequest('https://evil.trycloudflare.com/api/admin/agents', {
            method: 'POST',
            headers: {
                host: 'evil.trycloudflare.com',
                cookie: `${ADMIN_SESSION_COOKIE_NAME}=${validToken}`,
            },
        });
        expect(await hasValidAdminSessionOrToken(validReq)).toBe(true);

        // 4. Expired token (>24h old) is rejected even with valid HMAC signature
        const expiredIat = Date.now() - 25 * 60 * 60 * 1000;
        const expiredToken = createAdminSessionToken('darius@gilesinzinerija.com', expiredIat);
        expect(verifyAdminSessionToken(expiredToken)).toBe(false);

        const expiredReq = new NextRequest('https://evil.trycloudflare.com/api/admin/agents', {
            method: 'GET',
            headers: {
                host: 'evil.trycloudflare.com',
                cookie: `${ADMIN_SESSION_COOKIE_NAME}=${expiredToken}`,
            },
        });
        expect(await hasValidAdminSessionOrToken(expiredReq)).toBe(false);
    });

    it('[P0-02] & [P1-03] blocks unauthenticated external-host GET/POST on /api/admin/*, /api/accounting/skaita, and /api/inventory/sync, and masks secrets in agents & integrations', async () => {
        // 1. External GET /api/admin/agents without session -> 401
        const extAdminGet = new NextRequest('https://evil.trycloudflare.com/api/admin/agents', {
            method: 'GET',
            headers: { host: 'evil.trycloudflare.com' },
        });
        const extAdminRes = await middleware(extAdminGet);
        expect(extAdminRes.status).toBe(401);

        // 2. External GET /api/accounting/skaita without session -> 401
        const extSkaitaGet = new NextRequest(
            'https://evil.trycloudflare.com/api/accounting/skaita?format=isaf_xml',
            {
                method: 'GET',
                headers: { host: 'evil.trycloudflare.com' },
            },
        );
        const extSkaitaRes = await middleware(extSkaitaGet);
        expect(extSkaitaRes.status).toBe(401);

        // 3. External POST /api/inventory/sync without session -> 401
        const extInvPost = new NextRequest('https://evil.trycloudflare.com/api/inventory/sync', {
            method: 'POST',
            headers: { host: 'evil.trycloudflare.com' },
        });
        const extInvRes = await middleware(extInvPost);
        expect(extInvRes.status).toBe(401);

        // 4. GET /api/admin/agents and getAiAgentsList() never expose raw apiKey
        const agentsList = getAiAgentsList();
        for (const ag of agentsList) {
            expect(ag.maskedApiKey).toContain('•••');
            expect(ag.apiKey).toContain('•••');
            expect(ag.apiKey).not.toBe('xai-giles-env-vytautas-live-9021');
        }
        const routeRes = await adminAgentsRoute.GET();
        const routeBody = await routeRes.json();
        for (const ag of routeBody.agents) {
            expect(String(ag.apiKey || ag.maskedApiKey)).toContain('•••');
            expect(ag.apiKey).not.toBe('xai-giles-env-vytautas-live-9021');
        }

        // 5. buildEnvProductionTemplate masks configured secrets
        await adminIntegrationsRoute.PATCH(
            new Request('http://127.0.0.1:3088/api/admin/integrations', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    integrationId: 'montonio',
                    enabled: true,
                    environment: 'production',
                    values: {
                        MONTONIO_ACCESS_KEY: 'MONT_SUPER_SECRET_ACCESS_KEY',
                        MONTONIO_SECRET_KEY: 'MONT_SUPER_SECRET_PRIVATE_KEY',
                    },
                }),
            }),
        );
        const snippet = buildEnvProductionTemplate();
        expect(snippet).not.toContain('MONT_SUPER_SECRET_ACCESS_KEY');
        expect(snippet).not.toContain('MONT_SUPER_SECRET_PRIVATE_KEY');
        expect(snippet).toContain('•••');
    });

    it('[P0-03], [P0-04] & [P1-04] hardens /api/mcp: external PUT/DELETE require admin auth, GET redacts keyHash, operator_safe blocked from admin tools, anonymous blocked from b2b/admin resources, playground header blocked on external host', async () => {
        // 1. External PUT /api/mcp without admin session -> 401
        const extPutRes = await mcpRoute.PUT(
            new Request('http://127.0.0.1:3088/api/mcp', {
                method: 'PUT',
                headers: {
                    'x-forwarded-host': 'evil.trycloudflare.com',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'generate_key',
                    name: 'Attacker Key',
                    scope: 'full_admin',
                }),
            }),
        );
        expect(extPutRes.status).toBe(401);

        // 2. External DELETE /api/mcp without admin session -> 401
        const extDelRes = await mcpRoute.DELETE(
            new Request('http://127.0.0.1:3088/api/mcp?keyId=test', {
                method: 'DELETE',
                headers: {
                    'x-forwarded-host': 'evil.trycloudflare.com',
                },
            }),
        );
        expect(extDelRes.status).toBe(401);

        // 3. Generate operator_safe key locally and check GET /api/mcp redacts keyHash
        const { rawKey: opKey } = generateMcpApiKey({
            name: 'Operator Key',
            scope: 'operator_safe',
        });
        const mcpGetRes = await mcpRoute.GET(new Request('http://127.0.0.1:3088/api/mcp'));
        const mcpGetBody = await mcpGetRes.json();
        expect(mcpGetBody.keys.length).toBe(1);
        expect(mcpGetBody.keys[0].keyHash).toBeUndefined();

        // 4. operator_safe key blocked from calling admin scope tool (admin_ai_agents_manage) -> 403 / -32003
        const opAdminToolRes = await mcpRoute.POST(
            new Request('http://127.0.0.1:3088/api/mcp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${opKey}`,
                },
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    id: 101,
                    method: 'tools/call',
                    params: {
                        name: 'admin_ai_agents_manage',
                        arguments: { op: 'list_agents_and_logs' },
                    },
                }),
            }),
        );
        expect(opAdminToolRes.status).toBe(403);
        const opAdminToolBody = await opAdminToolRes.json();
        expect(opAdminToolBody.error.code).toBe(-32003);

        // 5. Anonymous caller blocked from reading giles://admin/* and giles://b2b/* resources -> 401 / -32001
        for (const protectedUri of [
            'giles://admin/ai-agents-and-logs',
            'giles://b2b/crm-analytics',
            'giles://skaita/invoices',
        ]) {
            const anonReadRes = await mcpRoute.POST(
                new Request('http://127.0.0.1:3088/api/mcp', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        jsonrpc: '2.0',
                        id: 102,
                        method: 'resources/read',
                        params: { uri: protectedUri },
                    }),
                }),
            );
            expect(anonReadRes.status).toBe(401);
            const anonReadBody = await anonReadRes.json();
            expect(anonReadBody.error.code).toBe(-32001);
        }

        // 6. Spoofed x-giles-admin-playground: 1 from external x-forwarded-host does NOT grant admin scope
        const spoofedPlaygroundRes = await mcpRoute.POST(
            new Request('http://127.0.0.1:3088/api/mcp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-forwarded-host': 'evil.trycloudflare.com',
                    'x-giles-admin-playground': '1',
                    'x-giles-playground-scope': 'full_admin',
                },
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    id: 103,
                    method: 'tools/call',
                    params: {
                        name: 'admin_ai_agents_manage',
                        arguments: { op: 'list_agents_and_logs' },
                    },
                }),
            }),
        );
        expect(spoofedPlaygroundRes.status).toBe(401);
    });

    it('[P0-05] & [P1-01] enforces brute-force rate limit (5 failed attempts -> 429) on POST /api/admin/auth login and blocks unauthenticated external reset_default', async () => {
        // 1. Unauthenticated external reset_default -> 401
        const extResetReq = new NextRequest('http://127.0.0.1:3088/api/admin/auth', {
            method: 'POST',
            headers: {
                'x-forwarded-host': 'evil.trycloudflare.com',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ action: 'reset_default' }),
        });
        const extResetRes = await adminAuthRoute.POST(extResetReq);
        expect(extResetRes.status).toBe(401);

        // 2. 5 failed login attempts return 401, 6th returns 429 Too Many Requests
        for (let i = 1; i <= 5; i++) {
            const failReq = new NextRequest('http://127.0.0.1:3088/api/admin/auth', {
                method: 'POST',
                headers: {
                    'x-forwarded-for': '203.0.113.77',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'login',
                    email: 'darius@gilesinzinerija.com',
                    password: `wrong-pass-${i}`,
                }),
            });
            const failRes = await adminAuthRoute.POST(failReq);
            expect(failRes.status).toBe(401);
        }

        const sixthReq = new NextRequest('http://127.0.0.1:3088/api/admin/auth', {
            method: 'POST',
            headers: {
                'x-forwarded-for': '203.0.113.77',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'login',
                email: 'darius@gilesinzinerija.com',
                password: initialPw,
            }),
        });
        const sixthRes = await adminAuthRoute.POST(sixthReq);
        expect(sixthRes.status).toBe(429);
    });

    it('[P0-06] & [P1-06] rejects forged webhook signatures (e.g. "123456") with 401 and does not mark Skaita invoices paid', async () => {
        const inv = createAutonomousSkaitaInvoice({
            docType: 'ISANKSTINE_SASKAITA',
            buyerName: 'UAB Test Buyer',
            buyerCompanyCode: '300112233',
            lines: [
                {
                    sku: 'MPB-NANI-35',
                    title: 'Granulių degiklis MPB NANI 35',
                    qty: 1,
                    unitNetEur: 1500,
                },
            ],
        });

        const payload = JSON.stringify({
            orderNumber: inv.proformaNumber,
            paymentStatus: 'PAID',
        });

        // 1. Forged 6-char signature "123456" -> 401 Unauthorized, invoice stays LAUKIA_APMOKEJIMO
        const badRes = await webhooksRoute.POST(
            new Request('http://127.0.0.1:3088/api/integrations/webhooks/stripe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-webhook-signature': '123456',
                },
                body: payload,
            }),
            { params: Promise.resolve({ provider: 'stripe' }) },
        );
        expect(badRes.status).toBe(401);
        const stillUnpaid = listSkaitaInvoices().find((i) => i.id === inv.id);
        expect(stillUnpaid?.paymentStatus).toBe('LAUKIA_APMOKEJIMO');

        // 2. Valid HMAC-SHA256 signature -> 200 OK, invoice marked APMOKETA_PAVEDIMU
        const validSig = crypto
            .createHmac('sha256', 'giles-webhook-default-verify')
            .update(payload)
            .digest('hex');
        const goodRes = await webhooksRoute.POST(
            new Request('http://127.0.0.1:3088/api/integrations/webhooks/stripe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-webhook-signature': validSig,
                },
                body: payload,
            }),
            { params: Promise.resolve({ provider: 'stripe' }) },
        );
        expect(goodRes.status).toBe(200);
        const goodBody = await goodRes.json();
        expect(goodBody.signatureVerified).toBe(true);
        expect(goodBody.invoiceUpdated).toBe(true);
    });

    it('[P1-02] strips plaintext password from B2B accounts responses, uses constant-time auth, and requires admin session for external approve/reject', async () => {
        const created = registerB2BPartnerAccount({
            companyName: 'UAB Šilumos Partneris',
            companyCode: '305556677',
            contactPerson: 'Tomas',
            email: 'tomas@partneris.lt',
            phone: '+370 612 34567',
            password: 'SecretB2BPassword!',
        });

        // 1. GET /api/b2b/accounts never leaks plaintext password
        const getRes = await b2bAccountsRoute.GET();
        const getBody = await getRes.json();
        expect(getBody.accounts.length).toBe(1);
        expect(getBody.accounts[0].password).toBeUndefined();

        // 2. Constant-time authentication works for valid password and rejects invalid password
        expect(
            authenticateB2BPartnerAccount({
                email: 'tomas@partneris.lt',
                password: 'WrongPassword',
            }),
        ).toBeNull();
        const authOk = authenticateB2BPartnerAccount({
            email: 'tomas@partneris.lt',
            password: 'SecretB2BPassword!',
        });
        expect(authOk).not.toBeNull();
        expect(authOk?.password).toBeUndefined();

        // 3. External-host approve without admin session -> 401
        const extApproveRes = await b2bAccountsRoute.POST(
            new Request('http://127.0.0.1:3088/api/b2b/accounts', {
                method: 'POST',
                headers: {
                    'x-forwarded-host': 'evil.trycloudflare.com',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'approve',
                    accountId: created.id,
                    defaultDiscountPercent: 52,
                }),
            }),
        );
        expect(extApproveRes.status).toBe(401);
    });

    it('[P2-01..P2-03] & [P3-01..P3-02] blocks path traversal & prototype pollution in transactional-store, escapes < in SeoGeoJsonLd, sets HSTS & Permissions-Policy headers, and removes static JWT from w110 test', async () => {
        // 1. Path traversal outside process.cwd() and /tmp is rejected in transactional-store
        expect(() => readJsonAtomic('/etc/passwd', {})).toThrow();
        expect(() => writeJsonAtomic('/etc/evil.json', { a: 1 })).toThrow();

        // 2. Prototype pollution keys stripped in transactional-store
        const tmpFile = path.join('/tmp', `giles-sec-test-${Date.now()}.json`);
        const rawPolluted = JSON.parse(
            '{"safe":"ok","__proto__":{"polluted":true},"constructor":{"prototype":{"polluted":true}}}',
        );
        writeJsonAtomic(tmpFile, rawPolluted);
        const loaded = readJsonAtomic<Record<string, unknown>>(tmpFile, {});
        expect(loaded.safe).toBe('ok');
        expect(Object.prototype.hasOwnProperty.call(loaded, '__proto__')).toBe(false);
        expect(Object.prototype.hasOwnProperty.call(loaded, 'constructor')).toBe(false);
        if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);

        // 3. SeoGeoJsonLd escapes < as \u003c
        const seoSrc = fs.readFileSync(
            path.join(process.cwd(), 'src/components/seo-geo-jsonld.tsx'),
            'utf8',
        );
        expect(seoSrc).toContain('\\u003c');

        // 4. HSTS & Permissions-Policy stamped by middleware
        const localApiReq = new NextRequest('http://127.0.0.1:3088/api/health', {
            method: 'GET',
            headers: { host: '127.0.0.1:3088' },
        });
        const localApiRes = await middleware(localApiReq);
        expect(localApiRes.headers.get('Strict-Transport-Security')).toContain('max-age=31536000');
        expect(localApiRes.headers.get('Permissions-Policy')).toContain('camera=()');

        // 5. w110 test file has no literal eyJhbGciOiJIUzI1NiJ9.eyJ static JWT string
        const w110Src = fs.readFileSync(
            path.join(process.cwd(), 'src/lib/w110-a2-payments-carriers-security.test.ts'),
            'utf8',
        );
        expect(w110Src).not.toContain('eyJhbGciOiJIUzI1NiJ9.eyJ');
    });

    it('[P0-03 Test 3C] & [P1-06 Test 11B] blocks unauthenticated external GET /api/mcp and rejects fallback webhook secrets on external hosts in POST /api/checkout/payment-webhook', async () => {
        // 1. Vector 3C: GET /api/mcp from external host without admin auth -> 401
        const extMcpGetRes = await mcpRoute.GET(
            new Request('http://127.0.0.1:3088/api/mcp', {
                method: 'GET',
                headers: {
                    'x-forwarded-host': 'evil.trycloudflare.com',
                },
            }),
        );
        expect(extMcpGetRes.status).toBe(401);
        const extMcpGetBody = await extMcpGetRes.json();
        expect(extMcpGetBody.ok).toBe(false);

        // Localhost GET /api/mcp still returns 200
        const localMcpGetRes = await mcpRoute.GET(
            new Request('http://127.0.0.1:3088/api/mcp', {
                method: 'GET',
                headers: {
                    host: '127.0.0.1:3088',
                },
            }),
        );
        expect(localMcpGetRes.status).toBe(200);

        // 2. Vector 11B: POST /api/checkout/payment-webhook from external host when webhook secret is unset or fallback -> 401
        const extStripeWebhookRes = await paymentWebhookRoute.POST(
            new NextRequest('http://127.0.0.1:3088/api/checkout/payment-webhook', {
                method: 'POST',
                headers: {
                    'x-forwarded-host': 'evil.trycloudflare.com',
                    'stripe-signature': 't=1793363000,v1=1234',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ id: 'evt_1' }),
            }),
        );
        expect(extStripeWebhookRes.status).toBe(401);
        const extStripeWebhookBody = await extStripeWebhookRes.json();
        expect(extStripeWebhookBody.ok).toBe(false);
        expect(extStripeWebhookBody.error).toBe('Webhook secret not configured for external host');

        const extMontonioWebhookRes = await paymentWebhookRoute.POST(
            new NextRequest('http://127.0.0.1:3088/api/checkout/payment-webhook', {
                method: 'POST',
                headers: {
                    'x-forwarded-host': 'evil.trycloudflare.com',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ provider: 'montonio', orderToken: 'tok_1' }),
            }),
        );
        expect(extMontonioWebhookRes.status).toBe(401);
        const extMontonioWebhookBody = await extMontonioWebhookRes.json();
        expect(extMontonioWebhookBody.error).toBe('Webhook secret not configured for external host');

        const extPayseraWebhookRes = await paymentWebhookRoute.POST(
            new NextRequest('http://127.0.0.1:3088/api/checkout/payment-webhook', {
                method: 'POST',
                headers: {
                    'x-forwarded-host': 'evil.trycloudflare.com',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ provider: 'paysera', data: 'abc', ss1: 'def' }),
            }),
        );
        expect(extPayseraWebhookRes.status).toBe(401);
        const extPayseraWebhookBody = await extPayseraWebhookRes.json();
        expect(extPayseraWebhookBody.error).toBe('Webhook secret not configured for external host');
    });
});
