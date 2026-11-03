import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import * as b2bAccountsRoute from '../app/api/b2b/accounts/route';
import * as mcpRoute from '../app/api/mcp/route';
import { LOCAL_ADMIN_TRUST_ENV } from './admin-host-trust';
import {
    registerB2BPartnerAccount,
    resetB2BAccountsCache,
} from './b2b-accounts';
import { resetMcpSecurityDatabase } from './mcp-store-server';

function loopbackMcpPutGenerateKeyReq(): Request {
    return new Request('http://127.0.0.1:3088/api/mcp', {
        method: 'PUT',
        headers: { host: '127.0.0.1:3088', 'Content-Type': 'application/json' },
        body: JSON.stringify({
            action: 'generate_key',
            name: 'LAN Attacker Key',
            scope: 'full_admin',
        }),
    });
}

function loopbackB2BPatchApproveReq(accountId: string): Request {
    return new Request('http://127.0.0.1:3088/api/b2b/accounts', {
        method: 'PATCH',
        headers: { host: '127.0.0.1:3088', 'Content-Type': 'application/json' },
        body: JSON.stringify({
            action: 'approve',
            accountId,
            defaultDiscountPercent: 52,
        }),
    });
}

function evilMcpPutGenerateKeyReq(): Request {
    return new Request('http://127.0.0.1:3088/api/mcp', {
        method: 'PUT',
        headers: {
            host: 'evil.example.com',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            action: 'generate_key',
            name: 'Evil Key',
            scope: 'full_admin',
        }),
    });
}

function evilB2BPatchApproveReq(accountId: string): Request {
    return new Request('http://127.0.0.1:3088/api/b2b/accounts', {
        method: 'PATCH',
        headers: {
            host: 'evil.example.com',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            action: 'approve',
            accountId,
            defaultDiscountPercent: 52,
        }),
    });
}

function registerTestPartner(): string {
    const created = registerB2BPartnerAccount({
        companyName: 'UAB F5 Partneris',
        companyCode: '305556688',
        contactPerson: 'Tomas',
        email: 'tomas@f5.lt',
        phone: '+370 612 34568',
        password: 'SecretF5Password!',
    });
    return created.id;
}

describe('WP-W127-F5: /api/mcp & /api/b2b/accounts loopback-Host admin trust requires GILES_TRUST_LOCAL_ADMIN=1', () => {
    beforeEach(() => {
        delete process.env[LOCAL_ADMIN_TRUST_ENV];
        resetMcpSecurityDatabase();
        resetB2BAccountsCache([]);
    });

    afterEach(() => {
        delete process.env[LOCAL_ADMIN_TRUST_ENV];
        resetMcpSecurityDatabase();
        resetB2BAccountsCache([]);
    });

    it('[F5.1] flag unset: anonymous loopback-Host PUT /api/mcp generate_key -> 401, not trusted-local', async () => {
        const res = await mcpRoute.PUT(loopbackMcpPutGenerateKeyReq());
        expect(res.status).toBe(401);
        const body = await res.json();
        expect(body.ok).toBe(false);
    });

    it('[F5.2] flag unset: anonymous loopback-Host PATCH /api/b2b/accounts approve -> 401', async () => {
        const accountId = registerTestPartner();
        const res = await b2bAccountsRoute.PATCH(loopbackB2BPatchApproveReq(accountId));
        expect(res.status).toBe(401);
        const body = await res.json();
        expect(body.ok).toBe(false);
    });

    it('[F5.3] flag unset: anonymous loopback-Host GET /api/mcp key listing -> 401', async () => {
        const res = await mcpRoute.GET(
            new Request('http://127.0.0.1:3088/api/mcp', {
                method: 'GET',
                headers: { host: '127.0.0.1:3088' },
            }),
        );
        expect(res.status).toBe(401);
    });

    it('[F5.4] flag set: local operator path preserved — PUT generate_key 200, PATCH approve 200, GET 200', async () => {
        process.env[LOCAL_ADMIN_TRUST_ENV] = '1';
        const accountId = registerTestPartner();

        const putRes = await mcpRoute.PUT(loopbackMcpPutGenerateKeyReq());
        expect(putRes.status).toBe(200);
        const putBody = await putRes.json();
        expect(putBody.ok).toBe(true);
        expect(typeof putBody.rawKey).toBe('string');

        const patchRes = await b2bAccountsRoute.PATCH(
            loopbackB2BPatchApproveReq(accountId),
        );
        expect(patchRes.status).toBe(200);
        const patchBody = await patchRes.json();
        expect(patchBody.ok).toBe(true);

        const getRes = await mcpRoute.GET(
            new Request('http://127.0.0.1:3088/api/mcp', {
                method: 'GET',
                headers: { host: '127.0.0.1:3088' },
            }),
        );
        expect(getRes.status).toBe(200);
    });

    it('[F5.5] evil-host vectors stay 401 regardless of the flag (unset and set)', async () => {
        const accountId = registerTestPartner();
        delete process.env[LOCAL_ADMIN_TRUST_ENV];
        expect((await mcpRoute.PUT(evilMcpPutGenerateKeyReq())).status).toBe(401);
        expect(
            (await b2bAccountsRoute.PATCH(evilB2BPatchApproveReq(accountId))).status,
        ).toBe(401);
        process.env[LOCAL_ADMIN_TRUST_ENV] = '1';
        expect((await mcpRoute.PUT(evilMcpPutGenerateKeyReq())).status).toBe(401);
        expect(
            (await b2bAccountsRoute.PATCH(evilB2BPatchApproveReq(accountId))).status,
        ).toBe(401);
    });

    it('[F5.6] flag unset: anonymous Tier-0 public MCP tools/call on loopback Host stays 200 (public scope not host-gated)', async () => {
        const jsonRpc = (toolName: string, args: Record<string, unknown>) =>
            new Request('http://127.0.0.1:3088/api/mcp', {
                method: 'POST',
                headers: {
                    host: '127.0.0.1:3088',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    id: 201,
                    method: 'tools/call',
                    params: { name: toolName, arguments: args },
                }),
            });

        const searchRes = await mcpRoute.POST(
            jsonRpc('public_catalog_expert_search', { query: '082F1152', locale: 'lt' }),
        );
        expect(searchRes.status).toBe(200);
        const searchPayload = (await searchRes.json()).result.structuredContent;
        expect(searchPayload.ok).toBe(true);
        expect(searchPayload.accessTier).toBe('public_discovery');

        const calcRes = await mcpRoute.POST(
            jsonRpc('public_hydronic_calculator_run', {
                calculatorType: 'heat_loss',
                areaM2: 150,
                powerKw: 18,
                energyClass: 'B',
            }),
        );
        expect(calcRes.status).toBe(200);
        const calcPayload = (await calcRes.json()).result.structuredContent;
        expect(calcPayload.ok).toBe(true);
        expect(calcPayload.calculatorType).toBe('heat_loss');
    });
});
