import fs from 'node:fs';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import {
    DARIUS_ADMIN_DEFAULT_HASH,
    DARIUS_ADMIN_PROFILE,
    authenticateAdminCredentials,
    changeAdminPassword,
    hashAdminPassword,
    resetAdminAuthOverrides,
    verifyAdminSessionToken,
} from './admin-auth-store';
import { GET, POST } from '../app/api/admin/auth/route';

const repoRoot = path.resolve(__dirname, '../..');
const adminAuthJsonPath = path.join(repoRoot, 'src/data/admin-auth.json');
const initialPw = ['987', 'Gile'].join('');

describe('W108-A1: Darius Admin OS Authentication & Self-Service Password Change', () => {
    beforeEach(() => {
        resetAdminAuthOverrides();
    });

    afterEach(() => {
        resetAdminAuthOverrides();
    });

    it('1) stores SHA-256 hash (no plaintext password in src/lib/admin-auth-store.ts) and authenticates darius@gilesinzinerija.com with initial password (200 OK)', async () => {
        const storeSource = fs.readFileSync(
            path.join(repoRoot, 'src/lib/admin-auth-store.ts'),
            'utf8',
        );
        expect(storeSource).not.toContain(initialPw);
        expect(DARIUS_ADMIN_DEFAULT_HASH).toBe(hashAdminPassword(initialPw));
        expect(DARIUS_ADMIN_PROFILE.email).toBe('darius@gilesinzinerija.com');
        expect(DARIUS_ADMIN_PROFILE.aliases).toContain('darius@gilesinzinerija.lt');
        expect(DARIUS_ADMIN_PROFILE.fullRole).toContain('Vykdantysis direktorius');

        const req = new NextRequest('http://127.0.0.1:3088/api/admin/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'login',
                email: 'darius@gilesinzinerija.com',
                password: initialPw,
            }),
        });

        const res = await POST(req);
        expect(res.status).toBe(200);
        const body = await res.json();
        expect(body.ok).toBe(true);
        expect(body.user.email).toBe('darius@gilesinzinerija.com');
        expect(body.user.name).toBe('Darius Šauklys');
        expect(body.user.role).toBe('Super Admin');
        expect(typeof body.sessionToken).toBe('string');
        expect(verifyAdminSessionToken(body.sessionToken)).toBe(true);

        const setCookie = res.headers.get('set-cookie') || '';
        expect(setCookie).toContain('giles_admin_session=');
    });

    it('2) authenticates darius@gilesinzinerija.lt alias seamlessly (case-insensitive, 200 OK)', async () => {
        const req = new NextRequest('http://127.0.0.1:3088/api/admin/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'login',
                email: 'Darius@GilesInzinerija.lt',
                password: initialPw,
            }),
        });

        const res = await POST(req);
        expect(res.status).toBe(200);
        const body = await res.json();
        expect(body.ok).toBe(true);
        expect(body.user.email).toBe('darius@gilesinzinerija.com');
        expect(body.user.loginEmail).toBe('darius@gilesinzinerija.lt');
    });

    it('3) rejects invalid password or unknown email with 401 Unauthorized', async () => {
        const wrongPwReq = new NextRequest('http://127.0.0.1:3088/api/admin/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'login',
                email: 'darius@gilesinzinerija.com',
                password: 'WrongPassword123',
            }),
        });
        const wrongPwRes = await POST(wrongPwReq);
        expect(wrongPwRes.status).toBe(401);
        const wrongPwBody = await wrongPwRes.json();
        expect(wrongPwBody.ok).toBe(false);

        const wrongEmailReq = new NextRequest('http://127.0.0.1:3088/api/admin/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'login',
                email: 'hacker@example.com',
                password: initialPw,
            }),
        });
        const wrongEmailRes = await POST(wrongEmailReq);
        expect(wrongEmailRes.status).toBe(401);
    });

    it('4) changes password via POST /api/admin/auth (action: change_password), rejects old password (401), accepts new password (200), and restores clean disk state', async () => {
        const newPw = 'NaujasGiles2026!';

        const changeReq = new NextRequest('http://127.0.0.1:3088/api/admin/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'change_password',
                email: 'darius@gilesinzinerija.com',
                currentPassword: initialPw,
                newPassword: newPw,
            }),
        });
        const changeRes = await POST(changeReq);
        expect(changeRes.status).toBe(200);
        const changeBody = await changeRes.json();
        expect(changeBody.ok).toBe(true);
        expect(changeBody.message).toBe('Slaptažodis sėkmingai pakeistas');

        // Persisted in src/data/admin-auth.json as SHA-256 hash, never plaintext
        const rawDisk = fs.readFileSync(adminAuthJsonPath, 'utf8');
        expect(rawDisk).not.toContain(newPw);
        expect(rawDisk).toContain(hashAdminPassword(newPw));

        // Old password now fails with 401
        const oldLoginReq = new NextRequest('http://127.0.0.1:3088/api/admin/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'login',
                email: 'darius@gilesinzinerija.com',
                password: initialPw,
            }),
        });
        const oldLoginRes = await POST(oldLoginReq);
        expect(oldLoginRes.status).toBe(401);

        // New password succeeds with 200 OK
        const newLoginReq = new NextRequest('http://127.0.0.1:3088/api/admin/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'login',
                email: 'darius@gilesinzinerija.com',
                password: newPw,
            }),
        });
        const newLoginRes = await POST(newLoginReq);
        expect(newLoginRes.status).toBe(200);

        // Resetting restores clean {} on disk and restores default password
        resetAdminAuthOverrides();
        expect(fs.readFileSync(adminAuthJsonPath, 'utf8').trim()).toBe('{}');
        expect(
            authenticateAdminCredentials('darius@gilesinzinerija.com', initialPw).ok,
        ).toBe(true);
    });

    it('5) wires GilesAdminAuthBar into /[locale]/admin with login gate, password change modal, and logout controls', () => {
        const authBarSource = fs.readFileSync(
            path.join(repoRoot, 'src/components/giles-admin-auth-bar.tsx'),
            'utf8',
        );
        const adminPageSource = fs.readFileSync(
            path.join(repoRoot, 'src/app/[locale]/admin/page.tsx'),
            'utf8',
        );

        expect(authBarSource).toContain('admin-auth-bar');
        expect(authBarSource).toContain('admin-login-gate');
        expect(authBarSource).toContain('admin-login-modal');
        expect(authBarSource).toContain('admin-login-email');
        expect(authBarSource).toContain('admin-login-password');
        expect(authBarSource).toContain('admin-login-submit-btn');
        expect(authBarSource).toContain('admin-change-password-btn');
        expect(authBarSource).toContain('admin-change-password-modal');
        expect(authBarSource).toContain('admin-logout-btn');
        expect(adminPageSource).toContain('GilesAdminAuthBar');
    });
});
