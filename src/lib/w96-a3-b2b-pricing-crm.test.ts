import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import {
    calculateB2BLineItemPrice,
    calculateB2BCartPricing,
    getB2BPricingStore,
    upsertCustomerPricingRule,
    createManualB2BCustomer,
    updateB2BCustomerCrmProfile,
    createCustomCommercialOffer,
    createMarketingCampaign,
    deleteMarketingCampaign,
    getCampaignsForPartner,
    submitCartQuoteRequest,
    listCartQuoteRequests,
    updateGlobalSalesGrowthRules,
    resetB2BPricingEngineState,
    DEFAULT_CART_VOLUME_TIERS,
    DEFAULT_QUANTITY_TIERS,
} from './b2b-pricing-engine';
import { resetB2BAccountsCache, listB2BPartnerAccounts } from './b2b-accounts';
import * as adminB2BPricingRoute from '../app/api/admin/b2b-pricing/route';
import * as publicB2BRoute from '../app/api/b2b/route';

describe('WP-W96-A3: 3-Layer Individual B2B Pricing Engine, Admin Customer CRM, Marketing Broadcasts & Cart Sales Growth', () => {
    const repoRoot = path.resolve(__dirname, '../..');

    beforeEach(() => {
        resetB2BPricingEngineState();
    });

    afterEach(() => {
        resetB2BPricingEngineState();
    });

    it('starts with clean empty state on disk (zero fake accounts, zero fake campaigns, clean pricing rules)', () => {
        expect(listB2BPartnerAccounts()).toEqual([]);
        const store = getB2BPricingStore();
        expect(Object.keys(store.customerRules)).toHaveLength(0);
        expect(store.individualOffers).toEqual([]);
        expect(store.campaigns).toEqual([]);
        expect(store.cartQuoteRequests).toEqual([]);
        expect(store.globalVolumeTiers).toEqual(DEFAULT_CART_VOLUME_TIERS);
        expect(store.globalQuantityTiers).toEqual(DEFAULT_QUANTITY_TIERS);
    });

    it('calculates 3-Layer Individual Pricing: Layer 1 (Brand/Category), Layer 2 (SKU Override + minQty + <10% Margin Floor Warning), and Layer 3 (Whole-Cart + Volume Tiers)', () => {
        const customer = createManualB2BCustomer({
            companyName: 'UAB Šilumos Rangovas',
            companyCode: '305112233',
            vatCode: 'LT100012345612',
            contactPerson: 'Tomas Kazlauskas',
            email: 'tomas@silumosrangovas.lt',
            phone: '+370 612 34567',
            tierLabel: 'ŠVOK Rangovas',
            defaultDiscountPercent: 35,
            creditLimitEur: 25000,
            paymentTermsDays: 30,
            assignedManager: 'Darius Šauklys',
        });

        upsertCustomerPricingRule(customer.id, {
            brandDiscounts: {
                Danfoss: 48,
                Haier: 42,
                HERZ: 50,
            },
            categoryDiscounts: {
                'Šilumos siurbliai': 40,
            },
            skuOverrides: [
                {
                    sku: '013G2990',
                    customPriceEur: 12.5,
                    minQty: 5,
                    note: 'Projektinė Danfoss galvučių kaina perkant nuo 5 vnt.',
                },
                {
                    sku: 'MPB-NANI-35',
                    customPriceEur: 1320.0,
                    minQty: 1,
                    note: 'Spec. kaina arti savikainos (maržos įspėjimas <10%)',
                },
            ],
            cartDiscountRules: {
                extraCartDiscountPct: 4,
                extraCartFixedEur: 25,
                personalPromoCode: 'RANGOVAS-VIP',
                volumeTiers: [
                    { minCartEur: 1000, extraDiscountPct: 3, label: 'Krepšelis ≥ 1 000 € (-3%)' },
                    { minCartEur: 2500, extraDiscountPct: 5, label: 'Krepšelis ≥ 2 500 € (-5%)' },
                    { minCartEur: 5000, extraDiscountPct: 8, label: 'Krepšelis ≥ 5 000 € (-8%)' },
                ],
            },
        });

        // 1. Layer 1 Brand discount applies when qty < minQty for SKU override
        const danfossSmallQty = calculateB2BLineItemPrice({
            accountId: customer.id,
            sku: '013G2990',
            brandName: 'Danfoss',
            categoryName: 'Termostatinės galvutės',
            retailGrossEur: 24.2,
            costNetEur: 8.5,
            qty: 2,
        });
        expect(danfossSmallQty.appliedLayer).toBe('BRAND_DISCOUNT');
        expect(danfossSmallQty.appliedDiscountPct).toBe(48);
        expect(danfossSmallQty.marginBelowFloorWarning).toBe(false);

        // 2. Layer 2 Specific SKU fixed price override applies when qty >= minQty (5)
        const danfossBulkQty = calculateB2BLineItemPrice({
            accountId: customer.id,
            sku: '013G2990',
            brandName: 'Danfoss',
            categoryName: 'Termostatinės galvutės',
            retailGrossEur: 24.2,
            costNetEur: 10.5,
            qty: 10,
        });
        expect(danfossBulkQty.appliedLayer).toBe('SKU_OVERRIDE');
        expect(danfossBulkQty.unitNetEur).toBe(12.5);
        expect(danfossBulkQty.lineNetEur).toBe(125.0);

        // 3. Layer 2 Margin floor warning (<10%) triggers when customPriceEur is close to costNetEur
        const lowMarginBurner = calculateB2BLineItemPrice({
            accountId: customer.id,
            sku: 'MPB-NANI-35',
            brandName: 'Gilės / Megatherm',
            categoryName: 'Granulių degikliai',
            retailGrossEur: 2350.0,
            costNetEur: 1280.0,
            qty: 2,
        });
        expect(lowMarginBurner.appliedLayer).toBe('SKU_OVERRIDE');
        expect(lowMarginBurner.unitNetEur).toBe(1320.0);
        expect(lowMarginBurner.marginPct).toBeLessThan(10);
        expect(lowMarginBurner.marginBelowFloorWarning).toBe(true);

        // 4. Layer 3 Whole-cart + Volume tier calculation
        const cartResult = calculateB2BCartPricing({
            accountId: customer.id,
            items: [
                {
                    sku: '013G2990',
                    title: 'Danfoss RA 2990',
                    brandName: 'Danfoss',
                    retailGrossEur: 24.2,
                    costNetEur: 10.5,
                    qty: 10,
                },
                {
                    sku: 'MPB-NANI-35',
                    title: 'Megatherm MPB NANI 35',
                    brandName: 'Gilės / Megatherm',
                    retailGrossEur: 2350.0,
                    costNetEur: 1280.0,
                    qty: 2,
                },
            ],
        });

        // Line items subtotal net = 125 + 2640 = 2765 EUR (>= 2500 EUR volume tier -> 5% + 4% personal extra cart discount + 25 EUR fixed rebate)
        expect(cartResult.linesSubtotalNetEur).toBe(2765.0);
        expect(cartResult.activeVolumeTier?.minCartEur).toBe(2500);
        expect(cartResult.volumeDiscountPct).toBe(5);
        expect(cartResult.personalCartDiscountPct).toBe(4);
        expect(cartResult.extraCartFixedEur).toBe(25);
        expect(cartResult.finalNetEur).toBeLessThan(cartResult.linesSubtotalNetEur);
        expect(cartResult.totalSavedEur).toBeGreaterThan(1000);
    });

    it('manages Customer CRM profiles, Custom Commercial Offers (Komerciniai pasiūlymai), and Marketing Campaigns via /api/admin/b2b-pricing and /api/b2b', async () => {
        // 1. Create B2B customer via POST /api/admin/b2b-pricing
        const createCustomerRes = await adminB2BPricingRoute.POST(
            new Request('http://localhost/api/admin/b2b-pricing', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'create_customer',
                    companyName: 'UAB Kauno Montuotojai',
                    companyCode: '304998877',
                    vatCode: 'LT100009988711',
                    contactPerson: 'Mantas Vaitkus',
                    email: 'mantas@kaunomontuotojai.lt',
                    phone: '+370 699 11223',
                    tierLabel: 'Montuotojas',
                    defaultDiscountPercent: 38,
                    creditLimitEur: 15000,
                    paymentTermsDays: 14,
                    assignedManager: 'Darius Šauklys',
                }),
            }),
        );
        const createdData = await createCustomerRes.json();
        expect(createdData.ok).toBe(true);
        const accountId = createdData.account.id as string;
        expect(createdData.account.status).toBe('APPROVED');
        expect(createdData.account.paymentTermsDays).toBe(14);

        // 2. Update CRM credit limit, deferral (45 d.), and status via PATCH /api/admin/b2b-pricing
        const patchCrmRes = await adminB2BPricingRoute.PATCH(
            new Request('http://localhost/api/admin/b2b-pricing', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'update_customer_crm',
                    accountId,
                    creditLimitEur: 30000,
                    paymentTermsDays: 45,
                    tierLabel: 'Regioninis Dileris',
                    defaultDiscountPercent: 52,
                }),
            }),
        );
        const patchedCrmData = await patchCrmRes.json();
        expect(patchedCrmData.ok).toBe(true);
        expect(patchedCrmData.account.creditLimitEur).toBe(30000);
        expect(patchedCrmData.account.paymentTermsDays).toBe(45);

        // 3. Build Custom Commercial Offer (Komercinis pasiūlymas) via POST /api/admin/b2b-pricing
        const offerRes = await adminB2BPricingRoute.POST(
            new Request('http://localhost/api/admin/b2b-pricing', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'create_offer',
                    accountId,
                    clientName: 'UAB Kauno Montuotojai',
                    title: 'Haier R290 šilumos siurblių ir Danfoss mazgo sąmata',
                    extraWholeCartDiscountPct: 5,
                    validUntil: '2026-11-30',
                    items: [
                        {
                            sku: 'AW082HUGHA',
                            title: 'Haier Monoblock R290 8 kW',
                            qty: 2,
                            retailNetEur: 2800,
                            customNetEur: 1950,
                        },
                    ],
                }),
            }),
        );
        const offerData = await offerRes.json();
        expect(offerData.ok).toBe(true);
        expect(offerData.offer.offerNumber).toMatch(/^KP-\d{4}$/);
        expect(offerData.offer.finalNetEur).toBeCloseTo(3900 * 0.95, 2);

        // 4. Create targeted marketing broadcast campaign via POST /api/admin/b2b-pricing
        const campRes = await adminB2BPricingRoute.POST(
            new Request('http://localhost/api/admin/b2b-pricing', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'create_campaign',
                    title: 'Haier R290 šilumos siurbliai — papildoma -6% krepšelio akcija',
                    message: 'Visiems patvirtintiems partneriams taikoma papildoma nuolaida Haier R290 serijai.',
                    categoryTag: 'Sezoninė akcija',
                    targetType: 'SINGLE_CLIENT',
                    targetAccountId: accountId,
                    promoDiscountPct: 6,
                    ctaSku: 'AW082HUGHA',
                }),
            }),
        );
        const campData = await campRes.json();
        expect(campData.ok).toBe(true);
        expect(campData.campaigns.length).toBe(1);

        // 5. Partner fetches their B2B pricing profile, offers, and targeted campaigns via GET /api/b2b
        const partnerGetRes = await publicB2BRoute.GET(
            new Request(`http://localhost/api/b2b?accountId=${encodeURIComponent(accountId)}`),
        );
        const partnerGetData = await partnerGetRes.json();
        expect(partnerGetData.ok).toBe(true);
        expect(partnerGetData.campaigns.length).toBe(1);
        expect(partnerGetData.offers.length).toBe(1);

        // 6. Customer submits a Cart Quote Request („Prašyti individualios projekto / krepšelio nuolaidos“) via POST /api/b2b
        const quoteReqRes = await publicB2BRoute.POST(
            new Request('http://localhost/api/b2b', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'request_cart_quote',
                    customerName: 'Tadas Projektai',
                    companyName: 'UAB Katilinės Projektai',
                    phone: '+370 655 44332',
                    email: 'tadas@katilines.lt',
                    note: 'Perkame visą katilinės komplektą, prašome individualios krepšelio nuolaidos',
                    items: [
                        { sku: 'MPB-NANI-35', title: 'Megatherm MPB NANI 35', qty: 1, unitGrossEur: 2350 },
                        { sku: '013G2990', title: 'Danfoss RA 2990', qty: 12, unitGrossEur: 24.2 },
                    ],
                }),
            }),
        );
        const quoteReqData = await quoteReqRes.json();
        expect(quoteReqData.ok).toBe(true);
        expect(quoteReqData.quoteRequest.requestNumber).toMatch(/^KRP-\d{4}$/);
        expect(listCartQuoteRequests().length).toBe(1);

        // Delete campaign and reset
        deleteMarketingCampaign(campData.campaign.id);
        expect(getCampaignsForPartner(accountId)).toHaveLength(0);
    });

    it('wires Admin CRM 4 sub-views, B2B Portal individual pricing & notifications, and Cart Sales Growth tools in UI components', () => {
        const adminCrmSrc = fs.readFileSync(
            path.join(repoRoot, 'src/components/giles-admin-b2b-crm.tsx'),
            'utf8',
        );
        const adminOsSrc = fs.readFileSync(
            path.join(repoRoot, 'src/components/giles-admin-os.tsx'),
            'utf8',
        );
        const b2bClientSrc = fs.readFileSync(
            path.join(repoRoot, 'src/components/b2b-portal-client.tsx'),
            'utf8',
        );
        const b2bViewsSrc = fs.readFileSync(
            path.join(repoRoot, 'src/components/b2b-portal-views.tsx'),
            'utf8',
        );
        const cartClientSrc = fs.readFileSync(
            path.join(repoRoot, 'src/components/cart-client.tsx'),
            'utf8',
        );

        expect(adminOsSrc).toContain('GilesAdminB2BCrm');
        expect(adminCrmSrc).toContain('admin-b2b-subview-crm');
        expect(adminCrmSrc).toContain('admin-b2b-subview-pricing');
        expect(adminCrmSrc).toContain('admin-b2b-subview-offers');
        expect(adminCrmSrc).toContain('admin-b2b-subview-marketing');
        expect(adminCrmSrc).toContain('Krepšelio kainodaros simuliatorius');

        expect(b2bClientSrc.split('\n').length).toBeLessThan(350);
        expect(b2bViewsSrc.split('\n').length).toBeLessThan(350);
        expect(`${b2bClientSrc}\n${b2bViewsSrc}`).toContain('Mano individualios kainos');
        expect(`${b2bClientSrc}\n${b2bViewsSrc}`).toContain('b2b-individual-pricing-banner');
        expect(`${b2bClientSrc}\n${b2bViewsSrc}`).toContain('b2b-marketing-notifications');

        expect(cartClientSrc).toContain('cart-volume-progress-bar');
        expect(cartClientSrc).toContain('Papildoma krepšelio nuolaida');
        expect(cartClientSrc).toContain('Prašyti individualios projekto / krepšelio nuolaidos');
        expect(cartClientSrc).toContain('cart-request-custom-quote-btn');
    });

    it('WP-W97-A1: computes B2B customer purchaseStats, monthlyPurchases, grantedDiscountsSummary, and manages customer Projects (Objektai ir projektai) & Manager Notes (Pastabos) via API and UI', async () => {
        const customer = createManualB2BCustomer({
            companyName: 'UAB Projektų Inžinerija',
            companyCode: '306123456',
            vatCode: 'LT100016123456',
            contactPerson: 'Aidas Montuotojas',
            email: 'aidas@projektuinzinerija.lt',
            phone: '+370 611 99887',
            tierLabel: 'ŠVOK Rangovas',
            defaultDiscountPercent: 42,
            creditLimitEur: 35000,
            paymentTermsDays: 30,
            assignedManager: 'Darius Šauklys',
        });

        upsertCustomerPricingRule(customer.id, {
            brandDiscounts: { Danfoss: 48, Haier: 40 },
            categoryDiscounts: { Katilai: 38 },
            skuOverrides: [{ sku: 'MPB-NANI-35', customPriceEur: 1550, minQty: 1, note: 'Objekto kaina' }],
            cartDiscountRules: {
                extraCartDiscountPct: 5,
                extraCartFixedEur: 0,
                volumeTiers: DEFAULT_CART_VOLUME_TIERS,
            },
        });

        // 1. Add a customer project via POST /api/admin/b2b-pricing (action: upsert_project)
        const projRes = await adminB2BPricingRoute.POST(
            new Request('http://localhost/api/admin/b2b-pricing', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'upsert_project',
                    accountId: customer.id,
                    project: {
                        title: 'Kauno logistikos centro katilinė 250 kW',
                        location: 'Eigulių g. 21, LT-51418 Kaunas',
                        status: 'active',
                        budgetEur: 18500,
                        orderedEur: 12400,
                        discountAppliedPct: 44,
                    },
                }),
            }),
        );
        const projData = await projRes.json();
        expect(projData.ok).toBe(true);
        expect(projData.project.title).toBe('Kauno logistikos centro katilinė 250 kW');
        expect(projData.project.orderedEur).toBe(12400);

        // 2. Add a manager note via POST /api/admin/b2b-pricing (action: add_note)
        const noteRes = await adminB2BPricingRoute.POST(
            new Request('http://localhost/api/admin/b2b-pricing', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'add_note',
                    accountId: customer.id,
                    note: {
                        author: 'Darius Šauklys',
                        tag: 'kainodara',
                        text: 'Suderinta Danfoss -48% ir Haier -40% nuolaida Kauno objektui.',
                    },
                }),
            }),
        );
        const noteData = await noteRes.json();
        expect(noteData.ok).toBe(true);
        expect(noteData.note.tag).toBe('kainodara');

        // 3. Verify GET /api/admin/b2b-pricing returns full crmAnalytics with purchaseStats, grantedDiscountsSummary, projects, and notes
        const snapRes = await adminB2BPricingRoute.GET();
        const snapData = await snapRes.json();
        expect(snapData.ok).toBe(true);
        expect(snapData.crmAnalytics).toBeDefined();
        expect(snapData.crmAnalytics.totalCustomers).toBe(1);
        expect(snapData.crmAnalytics.totalPurchasedEur).toBeGreaterThanOrEqual(12400);
        expect(snapData.crmAnalytics.activeProjectsCount).toBe(1);
        expect(snapData.crmAnalytics.totalNotesCount).toBe(1);
        expect(snapData.crmAnalytics.monthlyHistory).toHaveLength(12);

        const c360 = snapData.crmAnalytics.customers[0];
        expect(c360.accountId).toBe(customer.id);
        expect(c360.purchaseStats.totalPurchasedEur).toBeGreaterThanOrEqual(12400);
        expect(c360.purchaseStats.totalDiscountsGrantedEur).toBeGreaterThan(0);
        expect(c360.grantedDiscountsSummary.activeBrandDiscounts.length).toBeGreaterThanOrEqual(2);
        expect(c360.grantedDiscountsSummary.skuOverridesCount).toBe(1);
        expect(c360.projects).toHaveLength(1);
        expect(c360.notes).toHaveLength(1);

        // 4. Delete project and note via PATCH /api/admin/b2b-pricing
        const delProjRes = await adminB2BPricingRoute.PATCH(
            new Request('http://localhost/api/admin/b2b-pricing', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'delete_project',
                    accountId: customer.id,
                    projectId: projData.project.id,
                }),
            }),
        );
        const delProjData = await delProjRes.json();
        expect(delProjData.ok).toBe(true);
        expect(delProjData.crmAnalytics.customers[0].projects).toHaveLength(0);

        const delNoteRes = await adminB2BPricingRoute.PATCH(
            new Request('http://localhost/api/admin/b2b-pricing', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'delete_note',
                    accountId: customer.id,
                    noteId: noteData.note.id,
                }),
            }),
        );
        const delNoteData = await delNoteRes.json();
        expect(delNoteData.ok).toBe(true);
        expect(delNoteData.crmAnalytics.customers[0].notes).toHaveLength(0);

        // 5. Verify UI component includes SVG charts, preview toggle, and 360° client drawer testids
        const adminCrmSrc = fs.readFileSync(
            path.join(repoRoot, 'src/components/giles-admin-b2b-crm.tsx'),
            'utf8',
        );
        expect(adminCrmSrc).toContain('b2b-crm-svg-monthly-chart');
        expect(adminCrmSrc).toContain('b2b-crm-svg-client-comparison-chart');
        expect(adminCrmSrc).toContain('b2b-crm-preview-simulation-toggle');
        expect(adminCrmSrc).toContain('b2b-client-360-drawer');
        expect(adminCrmSrc).not.toContain('Savanorių');
    });

    it('WP-W97-F1: enforces ui_slop_meter compliance on CookieConsent ("Priimti visus"), b2b-portal-client (<350 lines, #cookie-consent-banner hidden), and giles-admin-b2b-crm (transparent subview tabs & simulation toggle)', () => {
        const cookieSrc = fs.readFileSync(
            path.join(repoRoot, 'src/components/CookieConsent.tsx'),
            'utf8',
        );
        const b2bClientSrc = fs.readFileSync(
            path.join(repoRoot, 'src/components/b2b-portal-client.tsx'),
            'utf8',
        );
        const adminCrmSrc = fs.readFileSync(
            path.join(repoRoot, 'src/components/giles-admin-b2b-crm.tsx'),
            'utf8',
        );
        const adminPageSrc = fs.readFileSync(
            path.join(repoRoot, 'src/app/[locale]/admin/page.tsx'),
            'utf8',
        );

        expect(cookieSrc).toContain("acceptAll: 'Priimti visus'");
        expect(cookieSrc).not.toContain("acceptAll: 'Sutinku su visais'");
        expect(b2bClientSrc.split('\n').length).toBeLessThan(350);
        expect(b2bClientSrc).toContain('#cookie-consent-banner { display: none !important; }');
        expect(adminCrmSrc).toContain('bg-transparent border-[#C2410C] text-[#C2410C]');
        expect(adminPageSrc).toContain('bg-transparent');
    });

    it('WP-W99-A1: manages B2B Credit Limits, Payment Deferral (Atidėjimas), Paid/Unpaid/Overdue Invoices Ledger, and Auto/Manual Credit Reminders via API & UI', async () => {
        const customer = createManualB2BCustomer({
            companyName: 'UAB Kredito Inžinerija',
            companyCode: '308877665',
            vatCode: 'LT100018877665',
            contactPerson: 'Dainius Katilius',
            email: 'dainius@kreditoinzinerija.lt',
            phone: '+370 611 33445',
            tierLabel: 'ŠVOK Rangovas',
            defaultDiscountPercent: 40,
            creditLimitEur: 15000,
            paymentTermsDays: 30,
            assignedManager: 'Darius Šauklys',
        });

        // 1. Update credit terms & deferral via POST /api/admin/b2b-pricing (action: update_credit_terms)
        const termsRes = await adminB2BPricingRoute.POST(
            new Request('http://localhost/api/admin/b2b-pricing', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'update_credit_terms',
                    accountId: customer.id,
                    creditLimitEur: 20000,
                    paymentTermDays: 45,
                    autoReminderThresholdPct: 80,
                    autoDueSoonReminderDays: 3,
                    autoRemindersEnabled: true,
                    creditHoldOnExceed: true,
                }),
            }),
        );
        const termsData = await termsRes.json();
        expect(termsData.ok).toBe(true);
        const c360AfterTerms = termsData.crmAnalytics.customers.find(
            (c: { accountId: string }) => c.accountId === customer.id,
        );
        expect(c360AfterTerms.creditConfig.creditLimitEur).toBe(20000);
        expect(c360AfterTerms.creditConfig.paymentTermDays).toBe(45);
        expect(c360AfterTerms.creditConfig.autoReminderThresholdPct).toBe(80);
        expect(c360AfterTerms.creditLedgerSummary.creditStatus).toBe('HEALTHY');

        // 2. Record a paid invoice and an unpaid deferred invoice via action: record_invoice_or_payment
        await adminB2BPricingRoute.POST(
            new Request('http://localhost/api/admin/b2b-pricing', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'record_invoice_or_payment',
                    accountId: customer.id,
                    invoice: {
                        invoiceNumber: 'GILE-2026-0901',
                        issuedAt: '2026-09-10',
                        dueDate: '2026-10-10',
                        amountEur: 6500,
                        paidAmountEur: 6500,
                        status: 'paid',
                        paidAt: '2026-10-08',
                        projectTitle: 'Aleksoto katilinės mazgas',
                    },
                }),
            }),
        );

        const unpaidRes = await adminB2BPricingRoute.POST(
            new Request('http://localhost/api/admin/b2b-pricing', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'record_invoice_or_payment',
                    accountId: customer.id,
                    invoice: {
                        invoiceNumber: 'GILE-2026-1015',
                        issuedAt: '2026-10-15',
                        dueDate: '2026-11-29',
                        amountEur: 16800,
                        paidAmountEur: 0,
                        status: 'unpaid_deferred',
                        projectTitle: 'Eigulių g. 21 šilumos punktas',
                    },
                }),
            }),
        );
        const unpaidData = await unpaidRes.json();
        expect(unpaidData.ok).toBe(true);
        const c360Approaching = unpaidData.crmAnalytics.customers.find(
            (c: { accountId: string }) => c.accountId === customer.id,
        );
        // 16800 / 20000 = 84% (>= 80% threshold -> APPROACHING_LIMIT)
        expect(c360Approaching.creditLedgerSummary.creditUsedEur).toBe(16800);
        expect(c360Approaching.creditLedgerSummary.creditRemainingEur).toBe(3200);
        expect(c360Approaching.creditLedgerSummary.creditUtilizationPct).toBe(84);
        expect(c360Approaching.creditLedgerSummary.creditStatus).toBe('APPROACHING_LIMIT');
        expect(c360Approaching.creditLedgerSummary.paidInvoicesTotalEur).toBe(6500);
        expect(c360Approaching.creditLedgerSummary.paidInvoicesCount).toBe(1);
        expect(c360Approaching.creditLedgerSummary.unpaidInvoicesTotalEur).toBe(16800);
        expect(c360Approaching.creditLedgerSummary.unpaidInvoicesCount).toBe(1);

        // 3. Run auto credit reminders sweep and manual Darius reminder
        const sweepRes = await adminB2BPricingRoute.POST(
            new Request('http://localhost/api/admin/b2b-pricing', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'run_auto_credit_reminders_sweep',
                }),
            }),
        );
        const sweepData = await sweepRes.json();
        expect(sweepData.ok).toBe(true);
        expect(sweepData.creditRemindersLog.length).toBeGreaterThanOrEqual(1);
        expect(sweepData.creditRemindersLog[0].accountId).toBe(customer.id);
        expect(sweepData.creditRemindersLog[0].triggeredBy).toBe('auto_threshold');

        const manualReminderRes = await adminB2BPricingRoute.POST(
            new Request('http://localhost/api/admin/b2b-pricing', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'send_credit_reminder',
                    accountId: customer.id,
                    type: 'approaching_limit',
                    channel: 'email_and_portal',
                    triggeredBy: 'manual_darius',
                }),
            }),
        );
        const manualReminderData = await manualReminderRes.json();
        expect(manualReminderData.ok).toBe(true);
        expect(manualReminderData.reminder.triggeredBy).toBe('manual_darius');

        // 4. Mark the unpaid invoice as paid -> immediately frees up credit limit
        const targetInvoiceId = c360Approaching.creditLedgerSummary.invoices.find(
            (i: { invoiceNumber: string }) => i.invoiceNumber === 'GILE-2026-1015',
        ).id;
        const payRes = await adminB2BPricingRoute.POST(
            new Request('http://localhost/api/admin/b2b-pricing', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'record_invoice_or_payment',
                    accountId: customer.id,
                    invoiceId: targetInvoiceId,
                    markPaid: true,
                }),
            }),
        );
        const payData = await payRes.json();
        expect(payData.ok).toBe(true);
        const c360Paid = payData.crmAnalytics.customers.find(
            (c: { accountId: string }) => c.accountId === customer.id,
        );
        expect(c360Paid.creditLedgerSummary.creditUsedEur).toBe(0);
        expect(c360Paid.creditLedgerSummary.creditRemainingEur).toBe(20000);
        expect(c360Paid.creditLedgerSummary.creditStatus).toBe('HEALTHY');
        expect(c360Paid.creditLedgerSummary.paidInvoicesTotalEur).toBe(23300);
        expect(c360Paid.creditLedgerSummary.paidInvoicesCount).toBe(2);

        // 5. Verify UI testids in giles-admin-b2b-crm.tsx and b2b-customer-mcp-panel.tsx
        const adminCrmSrc = fs.readFileSync(
            path.join(repoRoot, 'src/components/giles-admin-b2b-crm.tsx'),
            'utf8',
        );
        const b2bMcpPanelSrc = fs.readFileSync(
            path.join(repoRoot, 'src/components/b2b-customer-mcp-panel.tsx'),
            'utf8',
        );
        expect(adminCrmSrc).toContain('b2b-crm-credit-overview');
        expect(adminCrmSrc).toContain('b2b-crm-auto-reminders-sweep-btn');
        expect(adminCrmSrc).toContain('b2b-client-credit-settings');
        expect(adminCrmSrc).toContain('b2b-client-invoices-ledger');
        expect(adminCrmSrc).toContain('b2b-mark-invoice-paid-btn');
        expect(adminCrmSrc).toContain('b2b-send-credit-reminder-btn');
        expect(adminCrmSrc).toContain('b2b-credit-reminders-log');
        expect(b2bMcpPanelSrc).toContain('b2b-portal-credit-status-card');
    });
});
