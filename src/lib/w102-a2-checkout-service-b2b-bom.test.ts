import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import {
    evaluateCheckoutDeliveryOptions,
    calculateDeliveryCostEur,
} from '../components/conversion/checkout-form';
import { evaluateCartCompatibilityRecommendations } from '../components/cart-client';
import {
    parseAndMatchBulkBomLines,
    computeClientSafeQuoteSummary,
} from '../components/b2b-bom-and-client-quote';
import * as supportRoute from '../app/api/admin/support/route';
import { vitestDataFile } from './giles-data-paths';

describe('WP-W102-A2: Smart Checkout Delivery (P05), Cart Compatibility Guard (P02), Public Orders/S-N/RMA Portal (P06) & B2B Bulk BOM + Client Quote (P09/P10)', () => {
    const repoRoot = path.resolve(__dirname, '../..');
    const checkoutFormPath = path.join(repoRoot, 'src/components/conversion/checkout-form.tsx');
    const cartClientPath = path.join(repoRoot, 'src/components/cart-client.tsx');
    const ordersPagePath = path.join(repoRoot, 'src/app/[locale]/orders/page.tsx');
    const b2bBomComponentPath = path.join(
        repoRoot,
        'src/components/b2b-bom-and-client-quote.tsx',
    );
    const b2bViewsPath = path.join(repoRoot, 'src/components/b2b-portal-views.tsx');
    const b2bClientPath = path.join(repoRoot, 'src/components/b2b-portal-client.tsx');

    it('P05: evaluates heavy cart items (>30 kg), disables parcel locker for boilers/tanks/radiators, and computes pickup/locker/freight rates', () => {
        const lightCart = [
            { sku: '013G0014', name: 'Danfoss RA-N 15 termostatinis vožtuvas', price: 18.5, quantity: 4 },
        ];
        const lightEval = evaluateCheckoutDeliveryOptions(lightCart);
        expect(lightEval.isHeavyCart).toBe(false);
        expect(lightEval.estimatedWeightKg).toBeLessThanOrEqual(30);
        expect(lightEval.lockerDisabled).toBe(false);
        expect(calculateDeliveryCostEur('pickup', 74, false)).toBe(0);
        expect(calculateDeliveryCostEur('locker', 74, false)).toBe(3.49);
        expect(calculateDeliveryCostEur('locker', 155, false)).toBe(0);

        const heavyCart = [
            { sku: 'ZV-100', name: 'Katilas Gilės ZV 100 su automatiniu valymu', price: 4890, quantity: 1 },
        ];
        const heavyEval = evaluateCheckoutDeliveryOptions(heavyCart);
        expect(heavyEval.isHeavyCart).toBe(true);
        expect(heavyEval.estimatedWeightKg).toBeGreaterThan(30);
        expect(heavyEval.lockerDisabled).toBe(true);
        expect(heavyEval.heavyReason).toContain('30 kg');
        expect(calculateDeliveryCostEur('freight', 350, true)).toBe(29.0);
        expect(calculateDeliveryCostEur('freight', 650, true)).toBe(0);

        const checkoutSrc = fs.readFileSync(checkoutFormPath, 'utf8');
        expect(checkoutSrc).toContain('checkout-delivery-selector');
        expect(checkoutSrc).toContain('delivery-method-pickup');
        expect(checkoutSrc).toContain('delivery-method-locker');
        expect(checkoutSrc).toContain('delivery-method-freight');
        expect(checkoutSrc).toContain('Atsiėmimas Kauno sandėlyje (Eigulių g. 21, LT-51418 Kaunas)');
        expect(checkoutSrc).toContain('Paštomatas Omniva / DPD / LP Express');
        expect(checkoutSrc).toContain('Kurjeris / Sunkiasvoris transportas su hidrauliniu liftu');
        expect(checkoutSrc).toContain('Bankinis pavedimas / Išankstinė sąskaita');
        expect(checkoutSrc).toContain('El. bankininkystė Montonio / Paysera');
        expect(checkoutSrc).toContain('B2B Mokėjimo atidėjimas pagal sutartį');
        expect(checkoutSrc).not.toContain('—');
        expect(checkoutSrc).not.toContain('🛒');
        expect(checkoutSrc).not.toContain('rounded-full');
    });

    it('P02: detects missing radiator valves / mounting kits or boiler safety groups in CartClient', () => {
        const radiatorOnly = [
            { sku: 'POL./80-500', name: 'Aliumininis radiatorius Fondital Calidor Super 500/80' },
        ];
        const radRecs = evaluateCartCompatibilityRecommendations(radiatorOnly);
        expect(radRecs.length).toBeGreaterThanOrEqual(2);
        const recommendedSkus = radRecs.map((r) => r.sku);
        expect(
            recommendedSkus.some((s) =>
                ['013G0014', '3933-02.000', '0382-02.000'].includes(s),
            ),
        ).toBe(true);
        expect(recommendedSkus).toContain('GI-FERROLI-001');

        const radiatorWithValveAndKit = [
            { sku: 'POL./80-500', name: 'Aliumininis radiatorius Fondital Calidor Super 500/80' },
            { sku: '013G0014', name: 'Danfoss RA-N 15 vožtuvas' },
            { sku: 'GI-FERROLI-001', name: 'Radiatoriaus montavimo komplektas' },
        ];
        expect(evaluateCartCompatibilityRecommendations(radiatorWithValveAndKit)).toHaveLength(0);

        const boilerOnly = [
            { sku: 'MPB-NANI-35', name: 'Granulių degiklio komplektas Megatherm MPB NANI 35' },
        ];
        const boilerRecs = evaluateCartCompatibilityRecommendations(boilerOnly);
        expect(boilerRecs.length).toBeGreaterThanOrEqual(1);

        const cartSrc = fs.readFileSync(cartClientPath, 'utf8');
        expect(cartSrc).toContain('cart-compatibility-guard');
        expect(cartSrc).toContain('+ Pridėti rekomenduojamą mazgą į krepšelį');
        expect(cartSrc).toContain('Inžinerinė suderinamumo patikra');
    });

    it('P06: replaces SURADAI placeholder in /[locale]/orders with 4-locale Order Lookup, S/N Warranty Passport & RMA Portal wired to /api/admin/support', async () => {
        const ordersSrc = fs.readFileSync(ordersPagePath, 'utf8');
        expect(ordersSrc).not.toContain('SURADAI');
        expect(ordersSrc).not.toContain('—');
        expect(ordersSrc).toContain('public-service-and-orders-portal');
        expect(ordersSrc).toContain('public-order-lookup-tab');
        expect(ordersSrc).toContain('public-sn-warranty-tab');
        expect(ordersSrc).toContain('public-rma-request-tab');
        expect(ordersSrc).toContain('Eigulių g. 21');
        expect(ordersSrc).toContain('Garantinis gedimas');
        expect(ordersSrc).toContain('Netiko sriegis / keitimas per 14 d.');
        expect(ordersSrc).toContain('Techninė konsultacija');
        expect(ordersSrc).toContain('/api/admin/support');
        expect(ordersSrc).toContain('lt:');
        expect(ordersSrc).toContain('en:');
        expect(ordersSrc).toContain('pl:');
        expect(ordersSrc).toContain('ru:');

        // W125-F1: maršrutas vitest metu rašo į /tmp kelią; gyvas failas lieka nepaliestas.
        const supportTicketsFile = vitestDataFile('support-db');
        const originalSupportJson = fs.existsSync(supportTicketsFile)
            ? fs.readFileSync(supportTicketsFile, 'utf8')
            : null;
        try {
            const rmaReq = new Request('http://localhost/api/admin/support', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: 'RMA / Garantinis gedimas: MPB-SN-2026-009',
                    ticketType: 'Garantinis gedimas',
                    serialNumber: 'MPB-SN-2026-009',
                    clientName: 'Jonas Kazlauskas',
                    clientPhone: '+370 612 34567',
                    sparePartSku: '013G0014',
                }),
            });
            const res = await supportRoute.POST(rmaReq);
            const data = await res.json();
            expect(res.status).toBe(200);
            expect(data.ok).toBe(true);
            expect(data.ticket.serialNumber).toBe('MPB-SN-2026-009');
        } finally {
            if (originalSupportJson !== null) {
                fs.writeFileSync(supportTicketsFile, originalSupportJson, 'utf8');
            }
        }
    });

    it('P09 & P10: parses multi-line B2B Bulk BOM paste, computes Client-Safe Quote with installer markup, and keeps b2b-portal-views.tsx < 345 lines', () => {
        expect(fs.existsSync(b2bBomComponentPath)).toBe(true);

        const pastedBom = '013G0014 8\nPOL./80-500 12\n013G2970 8';
        const matched = parseAndMatchBulkBomLines(pastedBom, null, 45);
        expect(matched).toHaveLength(3);
        expect(matched[0]?.sku).toBe('013G0014');
        expect(matched[0]?.qty).toBe(8);
        expect(matched[1]?.sku).toBe('POL./80-500');
        expect(matched[1]?.qty).toBe(12);
        expect(matched[2]?.sku).toBe('013G2970');
        expect(matched[2]?.qty).toBe(8);

        const quoteZero = computeClientSafeQuoteSummary(matched, 0, true);
        const quoteFifteen = computeClientSafeQuoteSummary(matched, 15, true);
        expect(quoteFifteen.clientTotalNetEur).toBeGreaterThan(quoteZero.clientTotalNetEur);
        expect(quoteFifteen.installerMarginNetEur).toBeGreaterThan(0);
        expect(quoteFifteen.hideB2BCost).toBe(true);

        const b2bBomSrc = fs.readFileSync(b2bBomComponentPath, 'utf8');
        const b2bViewsSrc = fs.readFileSync(b2bViewsPath, 'utf8');
        const b2bClientSrc = fs.readFileSync(b2bClientPath, 'utf8');

        expect(b2bViewsSrc.split('\n').length).toBeLessThan(345);
        expect(b2bClientSrc.split('\n').length).toBeLessThan(345);
        expect(b2bBomSrc).not.toContain('—');

        expect(b2bBomSrc).toContain('b2b-bulk-bom-paste');
        expect(b2bBomSrc).toContain('Atpažinti ir suskaičiuoti sąmatą');
        expect(b2bBomSrc).toContain('Įkelti viską į greitą užsakymą / sąmatą');
        expect(b2bBomSrc).toContain('b2b-client-quote-mode');
        expect(b2bBomSrc).toContain('Kliento režimas (Slėpti mano B2B savikainą)');
        expect(b2bBomSrc).toContain('Montuotojo antkainis klientui (%)');
        expect(b2bBomSrc).toContain('Spausdinti / Eksportuoti pasiūlymą klientui');
        expect(b2bViewsSrc).toContain('B2BBomAndClientQuote');
    });
});
