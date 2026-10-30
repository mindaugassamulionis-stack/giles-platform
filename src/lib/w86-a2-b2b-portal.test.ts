import { describe, it, expect, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import * as b2bAccounts from './b2b-accounts';
import * as b2bRoute from '../app/api/b2b/accounts/route';

describe('WP-W88-A1: B2B Portal Zero-Fake-Data Auth Gate, 4-Language Support & 6 Interactive Sidebar Views', () => {
    const repoRoot = path.resolve(__dirname, '../..');
    const portalClientPath = path.join(repoRoot, 'src/components/b2b-portal-client.tsx');
    const portalViewsPath = path.join(repoRoot, 'src/components/b2b-portal-views.tsx');

    afterEach(() => {
        b2bAccounts.resetB2BAccountsCache([]);
    });

    it('starts b2b-accounts.json clean as an empty array [] and removes all fake seed companies/orders/dates', () => {
        b2bAccounts.resetB2BAccountsCache([]);
        expect(b2bAccounts.listB2BPartnerAccounts()).toEqual([]);

        const clientSrc = fs.readFileSync(portalClientPath, 'utf8');
        const viewsSrc = fs.existsSync(portalViewsPath)
            ? fs.readFileSync(portalViewsPath, 'utf8')
            : '';
        const src = `${clientSrc}\n${viewsSrc}`;
        expect(src).not.toContain('1. Registracijos vartai');
        expect(src).not.toContain('2. Laukia patvirtinimo');
        expect(src).not.toContain('3. Patvirtintas B2B');
        expect(src).not.toContain('b2b-mode-unauth-btn');
        expect(src).not.toContain('b2b-mode-pending-btn');
        expect(src).not.toContain('b2b-mode-approved-btn');
        expect(src).not.toContain('Greitas prisijungimas testavimui');
        expect(src).not.toContain('PVM sąskaitos (Skaita)');
    });

    it('enforces real B2B registration, approval, and login via POST /api/b2b/accounts action="login"', async () => {
        b2bAccounts.resetB2BAccountsCache([]);

        const registered = b2bAccounts.registerB2BPartnerAccount({
            companyName: 'UAB „Gilės inžinerija“ B2B Test',
            companyCode: '302620907',
            vatCode: 'LT100006119810',
            contactPerson: 'Darius Šauklys',
            email: 'b2b-partner@gilesinzinerija.lt',
            phone: '+370 611 19158',
            activityType: 'ŠVOK montuotojas',
            city: 'Kaunas',
            password: 'gile2026',
        });

        b2bAccounts.approveOrRejectB2BPartnerAccount({
            accountId: registered.id,
            action: 'approve',
            discountTier: 'Pro montuotojas Danfoss -48% / HERZ -50% / Haier -40%',
            defaultDiscountPercent: 45,
            approvedBy: 'Darius Šauklys (Admin)',
        });

        const loginSuccessReq = new Request('http://localhost/api/b2b/accounts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'login',
                email: 'b2b-partner@gilesinzinerija.lt',
                password: 'gile2026',
            }),
        });
        const resOk = await b2bRoute.POST(loginSuccessReq);
        const dataOk = await resOk.json();
        expect(resOk.status).toBe(200);
        expect(dataOk.ok).toBe(true);
        expect(dataOk.account.email).toBe('b2b-partner@gilesinzinerija.lt');
        expect(dataOk.account.status).toBe('APPROVED');

        const loginFailReq = new Request('http://localhost/api/b2b/accounts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'login',
                email: 'nonexistent-partner@example.com',
                password: 'wrong',
            }),
        });
        const resFail = await b2bRoute.POST(loginFailReq);
        const dataFail = await resFail.json();
        expect(resFail.status).toBe(401);
        expect(dataFail.ok).toBe(false);
    });

    it('renders customer-ready auth gate, pending refresh, logout, 4 languages (lt/en/pl/ru), and all 6 interactive sidebar views in modular <350-line files', () => {
        expect(fs.existsSync(portalClientPath)).toBe(true);
        expect(fs.existsSync(portalViewsPath)).toBe(true);

        const clientSrc = fs.readFileSync(portalClientPath, 'utf8');
        const viewsSrc = fs.readFileSync(portalViewsPath, 'utf8');
        expect(clientSrc.split('\n').length).toBeLessThan(350);
        expect(viewsSrc.split('\n').length).toBeLessThan(350);

        const src = `${clientSrc}\n${viewsSrc}`;

        const requiredTestIds = [
            'b2b-auth-gate',
            'b2b-login-email',
            'b2b-login-password',
            'b2b-login-submit',
            'b2b-register-form',
            'b2b-pending-screen',
            'b2b-approved-workspace',
            'b2b-logout-btn',
            'b2b-nav-overview',
            'b2b-nav-quick_order',
            'b2b-nav-orders',
            'b2b-nav-invoices',
            'b2b-nav-projects',
            'b2b-nav-pricelists',
            'b2b-view-overview',
            'b2b-view-quick_order',
            'b2b-view-orders',
            'b2b-repeat-order-btn',
            'b2b-view-invoices',
            'b2b-view-projects',
            'b2b-view-pricelists',
        ];

        for (const tid of requiredTestIds) {
            expect(src).toContain(tid);
        }

        expect(src).toContain('info@gilesinzinerija.lt');
        expect(src).toContain('+370 611 19158');
        expect(src).toContain('en:');
        expect(src).toContain('pl:');
        expect(src).toContain('ru:');
    });
});
