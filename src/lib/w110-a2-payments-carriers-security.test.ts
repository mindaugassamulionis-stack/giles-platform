import fs from 'node:fs';
import path from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

vi.mock('next-intl/middleware', () => ({
    default: () => () => NextResponse.next(),
}));
vi.mock('../i18n/routing', () => ({
    routing: { locales: ['lt', 'en'], defaultLocale: 'lt', localePrefix: 'always' },
}));
import {
    BALTIC_PARCEL_TERMINALS,
    searchParcelTerminals,
    createMontonioOrderJwt,
    verifyMontonioWebhookJwt,
    createPayseraSignedPayload,
    verifyPayseraCallback,
    createStripeWebhookSignature,
    verifyStripeWebhookSignature,
    generateA6ShippingLabel,
    getPaidWebhookOrders,
    resetPaidWebhookOrders,
} from './baltic-carriers-and-payments';
import { POST as paymentWebhookPost } from '../app/api/checkout/payment-webhook/route';
import {
    GET as shippingLabelGet,
    POST as shippingLabelPost,
} from '../app/api/admin/shipping-label/route';
import { middleware } from '../middleware';
import {
    ADMIN_SESSION_COOKIE_NAME,
    createAdminSessionToken,
    resetAdminAuthOverrides,
} from './admin-auth-store';
import {
    createAutonomousSkaitaInvoice,
    listSkaitaInvoices,
    resetSkaitaInvoices,
} from './skaita-accounting';

const repoRoot = path.resolve(__dirname, '../..');

describe('W110-A2: Cryptographic Payment Signers, 60+ Lithuanian Parcel Lockers, A6 Shipping Label & External-Host Admin Security', () => {
    beforeEach(() => {
        resetAdminAuthOverrides();
        resetPaidWebhookOrders();
    });

    it('1) provides 60+ real Lithuanian parcel terminals across Omniva, DPD Pickup, LP Express, and Venipak covering 15 Lithuanian cities', () => {
        expect(BALTIC_PARCEL_TERMINALS.length).toBeGreaterThanOrEqual(60);

        const carriers = new Set(BALTIC_PARCEL_TERMINALS.map((t) => t.carrier));
        expect(carriers.has('omniva')).toBe(true);
        expect(carriers.has('dpd')).toBe(true);
        expect(carriers.has('lp_express')).toBe(true);
        expect(carriers.has('venipak')).toBe(true);

        const requiredCities = [
            'Kaunas',
            'Vilnius',
            'Klaipėda',
            'Šiauliai',
            'Panevėžys',
            'Alytus',
            'Marijampolė',
            'Utena',
            'Telšiai',
            'Tauragė',
            'Druskininkai',
            'Mažeikiai',
            'Jonava',
            'Kėdainiai',
            'Kazlų Rūda',
        ];
        const terminalCities = new Set(BALTIC_PARCEL_TERMINALS.map((t) => t.city));
        for (const city of requiredCities) {
            expect(terminalCities.has(city)).toBe(true);
        }

        // Verify exact Kaunas terminals from audit spec
        const allText = BALTIC_PARCEL_TERMINALS.map(
            (t) => `${t.code} ${t.name} ${t.address} ${t.postalCode}`,
        ).join(' | ');
        expect(allText).toContain('Savanorių pr. 255');
        expect(allText).toContain('Karaliaus Mindaugo pr. 49');
        expect(allText).toContain('Islandijos pl. 32');
        expect(allText).toContain('Ukmergės g. 36');
        expect(allText).toContain('Draugystės g. 8C');

        // Verify terminal code prefixes
        expect(BALTIC_PARCEL_TERMINALS.some((t) => t.code.startsWith('LT-OMN-'))).toBe(true);
        expect(BALTIC_PARCEL_TERMINALS.some((t) => t.code.startsWith('LT-DPD-'))).toBe(true);
        expect(BALTIC_PARCEL_TERMINALS.some((t) => t.code.startsWith('LT-LP-'))).toBe(true);
        expect(BALTIC_PARCEL_TERMINALS.some((t) => t.code.startsWith('LT-VNP-'))).toBe(true);

        // Search filtering by carrier and query
        const kaunasOmniva = searchParcelTerminals('omniva', 'Savanorių');
        expect(kaunasOmniva.length).toBeGreaterThanOrEqual(1);
        expect(kaunasOmniva[0]?.carrier).toBe('omniva');
        expect(kaunasOmniva[0]?.city).toBe('Kaunas');

        const kazluRuda = searchParcelTerminals('all', 'Kazlų Rūda');
        expect(kazluRuda.length).toBeGreaterThanOrEqual(1);
        expect(kazluRuda[0]?.city).toBe('Kazlų Rūda');
    });

    it('2) signs and verifies Montonio v2 RFC 7519 HS256 JWT tokens and rejects tampered payloads', () => {
        const secretKey = 'montonio_live_secret_giles_2026';
        const token = createMontonioOrderJwt(
            {
                accessKey: 'montonio_access_giles',
                merchantReference: 'GILE-0001',
                grandTotal: 288.0,
                currency: 'EUR',
                notificationUrl: 'https://gilesinzinerija.lt/api/checkout/payment-webhook',
                returnUrl: 'https://gilesinzinerija.lt/lt/uzsakyma-gauta',
                lineItems: [{ name: 'Boileris Gorenje ZV 100', quantity: 1, finalPrice: 288.0 }],
            },
            secretKey,
        );

        const parts = token.split('.');
        expect(parts.length).toBe(3);

        const verified = verifyMontonioWebhookJwt(token, secretKey);
        expect(verified.valid).toBe(true);
        expect(verified.payload?.merchantReference).toBe('GILE-0001');
        expect(verified.payload?.grandTotal).toBe(288.0);
        expect(verified.payload?.currency).toBe('EUR');

        // Tamper payload
        const tamperedPayload = Buffer.from(
            JSON.stringify({ merchantReference: 'GILE-0001', grandTotal: 1.0, currency: 'EUR' }),
            'utf8',
        ).toString('base64url');
        const forgedToken = `${parts[0]}.${tamperedPayload}.${parts[2]}`;
        expect(verifyMontonioWebhookJwt(forgedToken, secretKey).valid).toBe(false);
        expect(verifyMontonioWebhookJwt(token, 'wrong_secret').valid).toBe(false);
    });

    it('3) signs and verifies Paysera WebToPay data + MD5/HMAC-SHA256 signatures and rejects forged callbacks', () => {
        const signPassword = 'paysera_sign_pw_giles_2026';
        const signed = createPayseraSignedPayload(
            {
                projectid: '194022',
                orderid: 'GILE-0002',
                amount: 235000,
                currency: 'EUR',
                callbackurl: 'https://gilesinzinerija.lt/api/checkout/payment-webhook',
                accepturl: 'https://gilesinzinerija.lt/lt/uzsakyma-gauta',
                cancelurl: 'https://gilesinzinerija.lt/lt/atsiskaitymas',
                status: '1',
            },
            signPassword,
        );

        expect(typeof signed.data).toBe('string');
        expect(signed.sign).toMatch(/^[a-f0-9]{32}$/);
        expect(signed.hmacSignature).toMatch(/^[a-f0-9]{64}$/);

        const verified = verifyPayseraCallback(
            { data: signed.data, ss1: signed.sign, ss2: signed.hmacSignature },
            signPassword,
        );
        expect(verified.valid).toBe(true);
        expect(verified.params?.orderid).toBe('GILE-0002');
        expect(verified.params?.amount).toBe('235000');

        const forged = verifyPayseraCallback(
            { data: signed.data, ss1: '00000000000000000000000000000000' },
            signPassword,
        );
        expect(forged.valid).toBe(false);
    });

    it('4) verifies Stripe HMAC-SHA256 webhook signatures with replay protection', () => {
        const webhookSecret = 'whsec_giles_stripe_secret_2026';
        const rawBody = JSON.stringify({
            id: 'evt_123',
            type: 'checkout.session.completed',
            data: { object: { client_reference_id: 'GILE-0003', payment_status: 'paid' } },
        });
        const nowSeconds = Math.floor(Date.now() / 1000);
        const sigHeader = createStripeWebhookSignature(rawBody, webhookSecret, nowSeconds);

        const validCheck = verifyStripeWebhookSignature(
            rawBody,
            sigHeader,
            webhookSecret,
            300,
            nowSeconds,
        );
        expect(validCheck.valid).toBe(true);

        // Replay attack (timestamp 20 minutes old > 300s tolerance)
        const oldSigHeader = createStripeWebhookSignature(
            rawBody,
            webhookSecret,
            nowSeconds - 1200,
        );
        const replayCheck = verifyStripeWebhookSignature(
            rawBody,
            oldSigHeader,
            webhookSecret,
            300,
            nowSeconds,
        );
        expect(replayCheck.valid).toBe(false);
        expect(replayCheck.error).toContain('timestamp');
    });

    it('5) POST /api/checkout/payment-webhook rejects forged signatures with 401 and marks invoice/order as paid on valid PAID webhook', async () => {
        resetSkaitaInvoices();
        const invoice = createAutonomousSkaitaInvoice({
            docType: 'PVM_SASKAITA_FAKTURA',
            paymentStatus: 'LAUKIA_APMOKEJIMO',
            buyerName: 'UAB Šilumos Mazgas',
            buyerCompanyCode: '304112233',
            lines: [
                {
                    sku: 'ZV 100',
                    title: 'Greitaeigis boileris Gorenje Tiki ZV 100',
                    qty: 1,
                    unitNetEur: 238.02,
                },
            ],
        });

        // 1. Forged Montonio webhook -> 401
        const badReq = new NextRequest('http://127.0.0.1:3088/api/checkout/payment-webhook', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                provider: 'montonio',
                orderToken: 'eyJhbGciOiJIUzI1NiJ9.eyJtZXJjaGFudFJlZmVyZW5jZSI6IkZBS0UifQ.forgedsig',
            }),
        });
        const badRes = await paymentWebhookPost(badReq);
        expect(badRes.status).toBe(401);

        // 2. Valid Montonio PAID webhook -> 200 & marks Skaita invoice as paid
        const secretKey = process.env.MONTONIO_SECRET_KEY || 'giles_montonio_default_secret_2026';
        const validToken = createMontonioOrderJwt(
            {
                accessKey: 'giles_montonio_access_key',
                merchantReference: invoice.invoiceNumber,
                grandTotal: invoice.totalGrossEur,
                currency: 'EUR',
                paymentStatus: 'PAID',
                notificationUrl: 'http://127.0.0.1:3088/api/checkout/payment-webhook',
                returnUrl: 'http://127.0.0.1:3088/lt/uzsakyma-gauta',
            },
            secretKey,
        );

        const goodReq = new NextRequest('http://127.0.0.1:3088/api/checkout/payment-webhook', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                provider: 'montonio',
                orderToken: validToken,
            }),
        });
        const goodRes = await paymentWebhookPost(goodReq);
        expect(goodRes.status).toBe(200);
        const goodBody = await goodRes.json();
        expect(goodBody.ok).toBe(true);
        expect(goodBody.status).toBe('paid');
        expect(goodBody.orderId).toBe(invoice.invoiceNumber);

        const updatedInvoice = listSkaitaInvoices().find(
            (i) => i.invoiceNumber === invoice.invoiceNumber,
        );
        expect(updatedInvoice?.paymentStatus).toBe('APMOKETA_PAVEDIMU');
        expect(getPaidWebhookOrders().some((o) => o.orderId === invoice.invoiceNumber)).toBe(true);
    });

    it('6) GET and POST /api/admin/shipping-label generate A6 (105x148mm) carrier shipping label with sender UAB Gilės inžinerija and Code-128 SVG barcode', async () => {
        const getReq = new NextRequest(
            'http://127.0.0.1:3088/api/admin/shipping-label?orderId=GILE-0042&carrier=omniva&terminalCode=LT-OMN-KAU-001',
        );
        const getRes = await shippingLabelGet(getReq);
        expect(getRes.status).toBe(200);
        const html = await getRes.text();
        expect(html).toContain('105mm');
        expect(html).toContain('148mm');
        expect(html).toContain('UAB „Gilės inžinerija“');
        expect(html).toContain('Eigulių g. 21, LT-51418 Kaunas');
        expect(html).toContain('LT-OMN-KAU-001');
        expect(html).toContain('<svg');

        const postReq = new NextRequest('http://127.0.0.1:3088/api/admin/shipping-label', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                orderId: 'GILE-0099',
                carrier: 'dpd',
                terminalCode: 'LT-DPD-KAU-001',
                recipientName: 'Jonas Kazlauskas',
                recipientPhone: '+37061234567',
                weightKg: 14.5,
            }),
        });
        const postRes = await shippingLabelPost(postReq);
        expect(postRes.status).toBe(200);
        const postBody = await postRes.json();
        expect(postBody.ok).toBe(true);
        expect(postBody.label.dimensionsMm).toBe('105x148');
        expect(postBody.label.sender).toContain('UAB „Gilės inžinerija“');
        expect(postBody.label.svg).toContain('<svg');
        expect(postBody.label.html).toContain('Jonas Kazlauskas');

        const direct = generateA6ShippingLabel({
            orderId: 'GILE-0100',
            carrier: 'lp_express',
            terminalCode: 'LT-LP-VLN-001',
            recipientName: 'Petras Petraitis',
            recipientPhone: '+37069911223',
            weightKg: 4.2,
        });
        expect(direct.trackingNumber).toMatch(/^LT/);
    });

    it('7) enforces external-host /api/admin/* session & Bearer token guard in middleware while keeping 127.0.0.1 and /api/admin/auth unblocked', async () => {
        // 1. External host POST to /api/admin/products without session -> 401
        const unauthExternalReq = new NextRequest(
            'https://preview-giles.trycloudflare.com/api/admin/products',
            {
                method: 'POST',
                headers: {
                    host: 'preview-giles.trycloudflare.com',
                    'content-type': 'application/json',
                },
                body: JSON.stringify({ action: 'delete', sku: 'ZV 100' }),
            },
        );
        const unauthExternalRes = middleware(unauthExternalReq);
        expect(unauthExternalRes.status).toBe(401);
        const unauthExternalBody = await unauthExternalRes.json();
        expect(unauthExternalBody).toEqual({
            ok: false,
            error: 'Unauthorized: Admin session required',
        });

        // 2. Request with x-enforce-admin-auth: 1 and no session -> 401
        const enforcedGetReq = new NextRequest(
            'https://gilesinzinerija.lt/api/admin/suppliers',
            {
                method: 'GET',
                headers: {
                    host: 'gilesinzinerija.lt',
                    'x-enforce-admin-auth': '1',
                },
            },
        );
        const enforcedGetRes = middleware(enforcedGetReq);
        expect(enforcedGetRes.status).toBe(401);

        // 3. External host POST to /api/admin/products WITH valid Bearer token -> allowed (not 401)
        const validToken = createAdminSessionToken('darius@gilesinzinerija.com');
        const authExternalReq = new NextRequest(
            'https://preview-giles.trycloudflare.com/api/admin/products',
            {
                method: 'POST',
                headers: {
                    host: 'preview-giles.trycloudflare.com',
                    authorization: `Bearer ${validToken}`,
                    'content-type': 'application/json',
                },
                body: JSON.stringify({ action: 'update' }),
            },
        );
        const authExternalRes = middleware(authExternalReq);
        expect(authExternalRes.status).not.toBe(401);

        // 4. External host POST with valid giles_admin_session cookie -> allowed (not 401)
        const cookieExternalReq = new NextRequest(
            'https://gilesinzinerija.lt/api/admin/b2b-pricing',
            {
                method: 'POST',
                headers: {
                    host: 'gilesinzinerija.lt',
                    cookie: `${ADMIN_SESSION_COOKIE_NAME}=${validToken}`,
                    'content-type': 'application/json',
                },
            },
        );
        const cookieExternalRes = middleware(cookieExternalReq);
        expect(cookieExternalRes.status).not.toBe(401);

        // 5. External host POST to /api/admin/auth (login endpoint) -> allowed (not 401)
        const loginExternalReq = new NextRequest(
            'https://preview-giles.trycloudflare.com/api/admin/auth',
            {
                method: 'POST',
                headers: {
                    host: 'preview-giles.trycloudflare.com',
                    'content-type': 'application/json',
                },
            },
        );
        const loginExternalRes = middleware(loginExternalReq);
        expect(loginExternalRes.status).not.toBe(401);

        // 6. Localhost 127.0.0.1 POST without session -> allowed for local headless checks
        const localReq = new NextRequest('http://127.0.0.1:3088/api/admin/products', {
            method: 'POST',
            headers: {
                host: '127.0.0.1:3088',
                'content-type': 'application/json',
            },
        });
        const localRes = middleware(localReq);
        expect(localRes.status).not.toBe(401);
    });

    it('8) wires checkout-terminal-picker into checkout-form.tsx and non-localhost auto-login gate in giles-admin-auth-bar.tsx', () => {
        const checkoutSource = fs.readFileSync(
            path.join(repoRoot, 'src/components/conversion/checkout-form.tsx'),
            'utf8',
        );
        expect(checkoutSource).toContain('checkout-terminal-picker');
        expect(checkoutSource).toContain('searchParcelTerminals');

        const authBarSource = fs.readFileSync(
            path.join(repoRoot, 'src/components/giles-admin-auth-bar.tsx'),
            'utf8',
        );
        expect(authBarSource).toContain("window.location.hostname !== '127.0.0.1'");
        expect(authBarSource).toContain("window.location.hostname !== 'localhost'");
        expect(authBarSource).toContain('admin-login-modal');
    });
});
