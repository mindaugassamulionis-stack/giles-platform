import { NextRequest, NextResponse } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('next-intl/middleware', () => ({
    default: () => () => NextResponse.next(),
}));
vi.mock('../i18n/routing', () => ({
    routing: { locales: ['lt', 'en'], defaultLocale: 'lt', localePrefix: 'always' },
}));

import { middleware, hasValidAdminSessionOrToken } from '../middleware';
import * as adminAuthRoute from '../app/api/admin/auth/route';
import { LOCAL_ADMIN_TRUST_ENV } from './admin-host-trust';
import {
    ADMIN_SESSION_COOKIE_NAME,
    createAdminSessionToken,
    resetAdminAuthOverrides,
    resetAdminLoginRateLimit,
} from './admin-auth-store';

function loopbackAgentsReq(): NextRequest {
    return new NextRequest('http://127.0.0.1:3088/api/admin/agents', {
        method: 'GET',
        headers: { host: '127.0.0.1:3088' },
    });
}

function loopbackResetReq(): NextRequest {
    return new NextRequest('http://127.0.0.1:3088/api/admin/auth', {
        method: 'POST',
        headers: { host: '127.0.0.1:3088', 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset_default' }),
    });
}

function evilAgentsReq(): NextRequest {
    return new NextRequest('http://127.0.0.1:3088/api/admin/agents', {
        method: 'GET',
        headers: { host: 'evil.example.com' },
    });
}

function evilResetReq(): NextRequest {
    return new NextRequest('http://127.0.0.1:3088/api/admin/auth', {
        method: 'POST',
        headers: { host: 'evil.example.com', 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset_default' }),
    });
}

describe('WP-W127-F4 (S7 finding F-2): loopback-Host admin trust requires GILES_TRUST_LOCAL_ADMIN=1', () => {
    beforeEach(() => {
        delete process.env[LOCAL_ADMIN_TRUST_ENV];
        resetAdminAuthOverrides();
        if (typeof resetAdminLoginRateLimit === 'function') {
            resetAdminLoginRateLimit();
        }
    });

    afterEach(() => {
        delete process.env[LOCAL_ADMIN_TRUST_ENV];
        resetAdminAuthOverrides();
        if (typeof resetAdminLoginRateLimit === 'function') {
            resetAdminLoginRateLimit();
        }
    });

    it('[F-2.1] flag unset: anonymous loopback-Host GET /api/admin/agents through middleware -> 401, not trusted-local', async () => {
        const res = await middleware(loopbackAgentsReq());
        expect(res.status).toBe(401);
    });

    it('[F-2.2] flag unset: anonymous loopback-Host POST /api/admin/auth {"action":"reset_default"} -> 401', async () => {
        const res = await adminAuthRoute.POST(loopbackResetReq());
        expect(res.status).toBe(401);
        const body = await res.json();
        expect(body.ok).toBe(false);
    });

    it('[F-2.3] flag unset: spoofed x-forwarded-host: 127.0.0.1 (real Host evil) on /api/admin/agents -> 401', async () => {
        const req = new NextRequest('http://127.0.0.1:3088/api/admin/agents', {
            method: 'GET',
            headers: {
                host: 'evil.example.com',
                'x-forwarded-host': '127.0.0.1:3088',
            },
        });
        const res = await middleware(req);
        expect(res.status).toBe(401);
    });

    it('[F-2.4] flag unset: hasValidAdminSessionOrToken rejects loopback Host + x-giles-internal-test: 1 header values alone', async () => {
        const req = new NextRequest('http://127.0.0.1:3088/api/admin/agents', {
            method: 'GET',
            headers: {
                host: '127.0.0.1:3088',
                'x-giles-internal-test': '1',
            },
        });
        expect(await hasValidAdminSessionOrToken(req)).toBe(false);
    });

    it('[F-2.5] flag set: local operator flow preserved — loopback middleware agents passes and reset_default succeeds (200)', async () => {
        process.env[LOCAL_ADMIN_TRUST_ENV] = '1';
        const agentsRes = await middleware(loopbackAgentsReq());
        expect(agentsRes.status).not.toBe(401);
        const resetRes = await adminAuthRoute.POST(loopbackResetReq());
        expect(resetRes.status).toBe(200);
        const body = await resetRes.json();
        expect(body.ok).toBe(true);
    });

    it('[F-2.6] evil-host vectors stay 401 regardless of the flag (unset and set)', async () => {
        delete process.env[LOCAL_ADMIN_TRUST_ENV];
        expect((await middleware(evilAgentsReq())).status).toBe(401);
        expect((await adminAuthRoute.POST(evilResetReq())).status).toBe(401);
        process.env[LOCAL_ADMIN_TRUST_ENV] = '1';
        expect((await middleware(evilAgentsReq())).status).toBe(401);
        expect((await adminAuthRoute.POST(evilResetReq())).status).toBe(401);
    });

    it('[F-2.7] x-enforce-admin-auth: 1 keeps forcing 401 for anonymous loopback even with the flag set', async () => {
        process.env[LOCAL_ADMIN_TRUST_ENV] = '1';
        const req = new NextRequest('http://127.0.0.1:3088/api/admin/agents', {
            method: 'GET',
            headers: {
                host: '127.0.0.1:3088',
                'x-enforce-admin-auth': '1',
            },
        });
        const res = await middleware(req);
        expect(res.status).toBe(401);
    });

    it('[F-2.8] valid Darius session cookie still passes with the flag unset (loopback treated as external, real sessions unaffected)', async () => {
        const token = createAdminSessionToken('darius@gilesinzinerija.com');
        const agentsReq = new NextRequest('http://127.0.0.1:3088/api/admin/agents', {
            method: 'GET',
            headers: {
                host: '127.0.0.1:3088',
                cookie: `${ADMIN_SESSION_COOKIE_NAME}=${token}`,
            },
        });
        expect(await hasValidAdminSessionOrToken(agentsReq)).toBe(true);
        const agentsRes = await middleware(agentsReq);
        expect(agentsRes.status).not.toBe(401);

        const resetReq = new NextRequest('http://127.0.0.1:3088/api/admin/auth', {
            method: 'POST',
            headers: {
                host: '127.0.0.1:3088',
                'Content-Type': 'application/json',
                cookie: `${ADMIN_SESSION_COOKIE_NAME}=${token}`,
            },
            body: JSON.stringify({ action: 'reset_default' }),
        });
        const resetRes = await adminAuthRoute.POST(resetReq);
        expect(resetRes.status).toBe(200);
    });

    it('[F-2.9] anonymous Darius login on loopback Host stays 200 with the flag unset (login is not host-gated)', async () => {
        const initialPw = ['987', 'Gile'].join('');
        const req = new NextRequest('http://127.0.0.1:3088/api/admin/auth', {
            method: 'POST',
            headers: { host: '127.0.0.1:3088', 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'login',
                email: 'darius@gilesinzinerija.com',
                password: initialPw,
            }),
        });
        const res = await adminAuthRoute.POST(req);
        expect(res.status).toBe(200);
        const body = await res.json();
        expect(body.ok).toBe(true);
        expect(JSON.stringify(body)).not.toContain(initialPw);
    });
});
