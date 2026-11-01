import { describe, it, expect } from 'vitest';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {
    getGilesCatalogSnapshot,
    searchGilesSnapshotPaged,
    getGilesSnapshotBrands,
    getGilesSnapshotCategories,
    findGilesSnapshotProductBySlugOrId,
    resolveB2BQuickOrderRows,
} from './giles-catalog-snapshot';
import {
    GILES_LOGO_CONCEPTS,
    GILES_PATENTED_LOGO_PATH,
    GILES_PATENTED_MARK_TRANSPARENT_PATH,
    GILES_PATENTED_FULL_LIGHT_PATH,
    GILES_PATENTED_FULL_DARK_PATH,
    GILES_COMPANY_IDENTITY,
    BOILER_CONVERSION_MODELS,
    computeBoilerConversionBundle,
    INDUSTRIAL_BOILER_MODULES,
    computeIndustrialBoilerRoi,
    GILES_SUPPLIER_PRICELISTS,
    HERO_SCHEMATIC_HOTSPOTS,
} from './giles-masterpiece-data';
import {
    registerB2BPartnerAccount,
    approveOrRejectB2BPartnerAccount,
    canAccessB2BWholesale,
    listB2BPartnerAccounts,
    resetB2BAccountsCache,
} from './b2b-accounts';
import {
    createAutonomousSkaitaInvoice,
    exportSkaitaSalesCsv,
    exportVmiIsaf12Xml,
    importSkaitaStockRows,
    sumaZodziaisLt,
    resetSkaitaInvoices,
} from './skaita-accounting';
import {
    PRODUCTION_PRIMARY_ORIGIN,
    GILES_DOMAIN_PORTFOLIO,
    resolvePublicSiteOrigin,
    resolveLegacySeoRedirect,
} from './domain-routing';

describe('Gilės Inžinerija 2-in-1 Masterpiece Platform Engine', () => {
    it('loads all 13,531 active published products and 28 brands from the snapshot', () => {
        const snap = getGilesCatalogSnapshot();
        expect(snap.totalProducts).toBe(13531);
        expect(snap.products.length).toBe(13531);

        const brands = getGilesSnapshotBrands();
        expect(brands.length).toBe(28);
        expect(brands[0]?.slug).toBe('giles-inzinerija');

        const categories = getGilesSnapshotCategories();
        expect(categories.length).toBeGreaterThanOrEqual(8);
    });

    it('supports code-first SKU search, brand filtering, and pagination over 13,531 products', () => {
        const allPaged = searchGilesSnapshotPaged({ page: 1, pageSize: 48 });
        expect(allPaged.total).toBe(13531);
        expect(allPaged.items.length).toBe(48);

        const danfossPaged = searchGilesSnapshotPaged({ brand: 'danfoss', page: 1, pageSize: 24 });
        expect(danfossPaged.total).toBeGreaterThanOrEqual(600);
        expect(danfossPaged.items.every((p) => (p.brandName || '').toLowerCase().includes('danfoss'))).toBe(true);

        const haierPaged = searchGilesSnapshotPaged({ brand: 'haier', page: 1, pageSize: 24 });
        expect(haierPaged.total).toBe(465);

        const byCode = searchGilesSnapshotPaged({ q: '013G2990', page: 1, pageSize: 10 });
        expect(byCode.total).toBeGreaterThanOrEqual(1);
        expect(byCode.items[0]?.sku.toUpperCase()).toContain('013G2990');

        const firstItem = allPaged.items[0]!;
        const resolved = findGilesSnapshotProductBySlugOrId(firstItem.slug || firstItem.id);
        expect(resolved?.id).toBe(firstItem.id);
    });

    it('defines all 5 Gilės Inžinerija logo concepts (A, B, C, D, current)', () => {
        expect(GILES_LOGO_CONCEPTS.map((c) => c.id)).toEqual(['A', 'B', 'C', 'D', 'current']);
        for (const concept of GILES_LOGO_CONCEPTS) {
            expect(concept.label.length).toBeGreaterThan(2);
            expect(concept.shortLabel.length).toBeGreaterThan(1);
        }
    });

    it('computes accurate 4-step Boiler Conversion Wizard bundles (Su PVM & Be PVM)', () => {
        expect(BOILER_CONVERSION_MODELS.length).toBe(6);
        const bundle = computeBoilerConversionBundle({
            boilerModelId: 'viadrus-u22',
            areaM2: 180,
            powerKw: 25,
            hopperId: 'standard-350',
            wifiModule: true,
            includeInstallation: true,
        });
        expect(bundle.burnerTitle).toContain('MPB');
        expect(bundle.items.length).toBeGreaterThanOrEqual(5);
        expect(bundle.totalGrossEur).toBeGreaterThan(1500);
        expect(bundle.totalNetEur).toBeCloseTo(bundle.totalGrossEur / 1.21, 1);
    });

    it('computes Industrial Container Boiler Room (100 kW – 2.5 MW) ROI and payback months', () => {
        expect(INDUSTRIAL_BOILER_MODULES.map((m) => m.code)).toEqual([
            'GK-100',
            'GK-250',
            'GK-500',
            'GK-1000',
            'GK-2500',
        ]);
        const roi = computeIndustrialBoilerRoi({
            currentFuelId: 'lpg',
            annualHeatMwh: 1200,
            moduleCode: 'GK-500',
        });
        expect(roi.currentAnnualCostEur).toBeGreaterThan(roi.biomassAnnualCostEur);
        expect(roi.annualSavingsEur).toBeGreaterThan(20000);
        expect(roi.paybackMonths).toBeGreaterThan(6);
        expect(roi.paybackMonths).toBeLessThan(60);
    });

    it('resolves B2B installer bulk SKU rows with wholesale discounts across 5 supplier price lists', () => {
        expect(GILES_SUPPLIER_PRICELISTS.length).toBe(5);
        const rows = resolveB2BQuickOrderRows([
            { code: '013G2990', qty: 10 },
            { code: 'AW082HUGHA', qty: 1 },
            { code: 'ZV 100', qty: 2 },
        ]);
        expect(rows.length).toBe(3);
        expect(rows[0]?.found).toBe(true);
        expect(rows[0]?.dealerNetUnitEur).toBeLessThan(rows[0]?.retailNetUnitEur || 999999);
        expect(rows[0]?.discountPercent).toBeGreaterThanOrEqual(35);
    });

    it('locks the patented original UAB Gilės inžinerija logo and Darius direct contact phone (+370 611 19158)', () => {
        expect(GILES_PATENTED_LOGO_PATH).toBe('/studio-assets/logos/logo-current-original.png');
        expect(GILES_COMPANY_IDENTITY.phoneDarius).toBe('+370 611 19158');
        expect(GILES_COMPANY_IDENTITY.phoneService).toBe('+370 693 97098');
        expect(GILES_COMPANY_IDENTITY.phoneLandline).toBe('+370 37 332234');
        expect(GILES_COMPANY_IDENTITY.emailGeneral).toBe('info@gilesinzinerija.lt');
        expect(HERO_SCHEMATIC_HOTSPOTS.length).toBe(5);
    });

    it('enforces B2B registration gate: new partners start as PENDING_APPROVAL and unlock wholesale only after Admin approval', () => {
        resetB2BAccountsCache([]);
        const initialAccounts = listB2BPartnerAccounts();
        expect(initialAccounts.length).toBe(0);

        const created = registerB2BPartnerAccount({
            companyName: 'UAB „Gilės inžinerija“ B2B Test',
            companyCode: '302620907',
            vatCode: 'LT100006119810',
            contactPerson: 'Darius Šauklys',
            email: `partneris.${Date.now()}@gilesinzinerija.lt`,
            phone: '+370 611 19158',
            activityType: 'ŠVOK montuotojas',
            city: 'Kaunas',
        });

        expect(created.status).toBe('PENDING_APPROVAL');
        expect(canAccessB2BWholesale(created)).toBe(false);

        const approved = approveOrRejectB2BPartnerAccount({
            accountId: created.id,
            action: 'approve',
            discountTier: 'Pro montuotojas Danfoss -48% / HERZ -50% / Haier -40%',
            defaultDiscountPercent: 45,
            approvedBy: 'Darius Šauklys (Admin)',
        });

        expect(approved?.status).toBe('APPROVED');
        expect(approved?.defaultDiscountPercent).toBe(45);
        expect(canAccessB2BWholesale(approved!)).toBe(true);
        resetB2BAccountsCache([]);
    });

    it('generates sequential GILE-XXXX VAT invoices, Prototechnika Skaita CSV exports, VMI i.SAF 1.2 XML, and reconciles Skaita stock imports', () => {
        resetSkaitaInvoices();
        const inv = createAutonomousSkaitaInvoice({
            docType: 'PVM_SASKAITA_FAKTURA',
            buyerName: 'UAB „Gilės inžinerija“ Partneris',
            buyerCompanyCode: '302620907',
            buyerVatCode: 'LT100006119810',
            buyerAddress: 'Eigulių g. 21, LT-51418 Kaunas',
            buyerEmail: 'info@gilesinzinerija.lt',
            warehouse: 'KAUNAS_PAGRINDINIS',
            lines: [
                {
                    sku: 'MPB-NANI-35',
                    ean: '4770001000351',
                    title: 'Granulių degiklio komplektas Megatherm MPB NANI 35 (8–35 kW)',
                    unit: 'vnt.',
                    qty: 1,
                    unitNetEur: 1942.15,
                    costNetEur: 1280.0,
                },
                {
                    sku: '013G2990',
                    ean: '5702420049113',
                    title: 'Danfoss RA 2990 termostatinė galvutė',
                    unit: 'vnt.',
                    qty: 4,
                    unitNetEur: 18.5,
                    costNetEur: 11.2,
                },
            ],
        });

        expect(inv.invoiceNumber).toMatch(/^GILE-\d{4}$/);
        expect(inv.sellerCompanyCode).toBe('302620907');
        expect(inv.sellerVatCode).toBe('LT100006119810');
        expect(inv.vatRatePercent).toBe(21);
        expect(inv.totalNetEur).toBeCloseTo(2016.15, 2);
        expect(inv.vatAmountEur).toBeCloseTo(423.39, 2);
        expect(inv.totalGrossEur).toBeCloseTo(2439.54, 2);
        expect(inv.amountInWordsLt).toContain('eur');
        expect(sumaZodziaisLt(2439.54)).toContain('54 ct');

        const csv = exportSkaitaSalesCsv([inv]);
        expect(csv).toContain('Dokumento_Nr;Data;Pirkejo_Pavadinimas;Imones_Kodas;PVM_Kodas;Prekes_Kodas_SKU;EAN;Prekes_Pavadinimas;Vnt;Kiekis;Kaina_Be_PVM;PVM_Proc;PVM_Suma;Suma_Su_PVM;Savikaina_Be_PVM;Sandelis');
        expect(csv).toContain(inv.invoiceNumber);
        expect(csv).toContain('MPB-NANI-35');

        const xml = exportVmiIsaf12Xml([inv]);
        expect(xml).toContain('<iSAFFile');
        expect(xml).toContain('<FileVersion>i.SAF1.2</FileVersion>');
        expect(xml).toContain('<RegistrationNumber>302620907</RegistrationNumber>');
        expect(xml).toContain('<SalesInvoices>');
        expect(xml).toContain(`<InvoiceNo>${inv.invoiceNumber}</InvoiceNo>`);
        expect(xml).toContain('<TaxPercentage>21</TaxPercentage>');

        const syncResult = importSkaitaStockRows([
            { sku: '013G2990', stock: 42, costNetEur: 10.8, retailGrossEur: 24.9 },
            { sku: 'ZV 100', stock: 9, costNetEur: 165.0, retailGrossEur: 269.0 },
        ]);
        expect(syncResult.processedRows).toBe(2);
        expect(syncResult.matchedCatalogSkus).toBeGreaterThanOrEqual(1);
        resetSkaitaInvoices();
    });

    it('natively adapts the patented Gilės logo, high-contrast CAD blueprints, and #EEEBE4 studio product images', () => {
        expect(GILES_PATENTED_MARK_TRANSPARENT_PATH).toBe(
            '/studio-assets/logos/giles-patented-mark-transparent.png',
        );
        expect(GILES_PATENTED_FULL_LIGHT_PATH).toBe(
            '/studio-assets/logos/giles-patented-full-light.png',
        );
        expect(GILES_PATENTED_FULL_DARK_PATH).toBe(
            '/studio-assets/logos/giles-patented-full-dark.png',
        );

        const repoRoot = path.resolve(__dirname, '../..');
        expect(
            fs.existsSync(path.join(repoRoot, 'public', GILES_PATENTED_MARK_TRANSPARENT_PATH)),
        ).toBe(true);

        const logoComponentSrc = fs.readFileSync(
            path.join(repoRoot, 'src/components/giles-logo.tsx'),
            'utf8',
        );
        expect(logoComponentSrc).toContain('GILES_PATENTED_MARK_TRANSPARENT_PATH');
        expect(logoComponentSrc).not.toContain('bg-white border border-[#E2DDD3]');
        expect(logoComponentSrc).toContain('ŠILUMOS INŽINERIJA · NUO 2011 M.');

        const heroSrc = fs.readFileSync(
            path.join(repoRoot, 'src/components/home-hero.tsx'),
            'utf8',
        );
        expect(heroSrc).toContain('1 450 mm × 680 mm × 1 280 mm');
        expect(heroSrc).toContain('T1 80 °C');
        expect(heroSrc).toContain('T2 60 °C');

        const homePageSrc = fs.readFileSync(
            path.join(repoRoot, 'src/app/[locale]/page.tsx'),
            'utf8',
        );
        expect(homePageSrc).toContain('SENAS KATILAS');
        expect(homePageSrc).toContain('KONTEINERINĖS KATILINĖS PJŪVIS');
        expect(homePageSrc).toContain('[ZONA A]');
        expect(homePageSrc).toContain('[ZONA D]');

        const pramoneiSrc = fs.readFileSync(
            path.join(repoRoot, 'src/app/[locale]/pramonei/page.tsx'),
            'utf8',
        );
        expect(pramoneiSrc).toContain('KONTEINERINĖS KATILINĖS PJŪVIS');
        expect(pramoneiSrc).toContain('6 058 × 2 438 × 2 896 mm');

        const vedlysSrc = fs.readFileSync(
            path.join(repoRoot, 'src/app/[locale]/vedlys/page.tsx'),
            'utf8',
        );
        expect(vedlysSrc).toContain('boiler-conversion-cad-blueprint');

        const pdpSrc = fs.readFileSync(
            path.join(repoRoot, 'src/app/[locale]/products/[id]/page.tsx'),
            'utf8',
        );
        expect(pdpSrc).toContain('pdp-exploded-cad-blueprint');
        expect(pdpSrc).toContain('mix-blend-multiply');

        const gridSrc = fs.readFileSync(
            path.join(repoRoot, 'src/components/giles-artboard-catalog-grid.tsx'),
            'utf8',
        );
        expect(gridSrc).toContain('mix-blend-multiply');

        const cardSrc = fs.readFileSync(
            path.join(repoRoot, 'src/components/product-card.tsx'),
            'utf8',
        );
        expect(cardSrc).toContain('mix-blend-multiply');
    });

    it('manages Tech Support, After-Sales Service Tickets, Vytautas AI diagnosis, Spare-Part reservation, Warranty S/N Registry, and RMA via /api/admin/support', async () => {
        const supportRoute = await import('../app/api/admin/support/route');
        await supportRoute.PATCH(
            new Request('http://localhost/api/admin/support', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'reset_db' }),
            }),
        );

        const getRes = await supportRoute.GET();
        const getData = await getRes.json();

        expect(getData.ok).toBe(true);
        expect(Array.isArray(getData.tickets)).toBe(true);
        expect(getData.tickets.length).toBe(0);
        expect(Array.isArray(getData.warrantyRegistry)).toBe(true);
        expect(Array.isArray(getData.rmaQueue)).toBe(true);

        // Create a new Tech Support / RMA ticket dynamically
        const createReq = new Request('http://localhost/api/admin/support', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: 'Pelltech PV20a degiklio fotosensoriaus valymas ir patikra',
                ticketType: 'Pogarantinis servisas',
                priority: 'VIDUTINIS',
                serialNumber: 'PV20A-SN-1120',
                clientName: 'UAB „Gilės inžinerija“ Servisas',
                clientPhone: '+370 611 19158',
                assignedTechnician: 'Darius (+370 611 19158)',
                sparePartSku: 'MPB-PHOTO-01',
            }),
        });
        const createRes = await supportRoute.POST(createReq);
        const createData = await createRes.json();
        expect(createData.ok).toBe(true);
        expect(createData.ticket.ticketNumber).toMatch(/^TKT-\d{4}$/);
        expect(createData.ticket.vytautasDiagnosis).toContain('MPB-PHOTO-01');

        // Reserve spare part and generate Skaita service invoice
        const reserveReq = new Request('http://localhost/api/admin/support', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'reserve_part',
                ticketNumber: createData.ticket.ticketNumber,
                status: 'Detalė rezervuota',
                assignedTechnician: 'Vidas (+370 656 77679)',
            }),
        });
        const reserveRes = await supportRoute.PATCH(reserveReq);
        const reserveData = await reserveRes.json();
        expect(reserveData.ok).toBe(true);
        expect(reserveData.ticket.status).toBe('Detalė rezervuota');
        expect(reserveData.ticket.reservedPartFlag).toBe(true);
        expect(reserveData.ticket.serviceInvoiceNumber).toMatch(/^GILE-\d{4}$/);

        await supportRoute.PATCH(
            new Request('http://localhost/api/admin/support', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'reset_db' }),
            }),
        );
        resetSkaitaInvoices();
    });

    it('manages Platform-OS 6 Active AI Agents and Proposal -> Review -> Apply governance queue via /api/admin/agents', async () => {
        const agentsRoute = await import('../app/api/admin/agents/route');
        const getRes = await agentsRoute.GET();
        const getData = await getRes.json();

        expect(getData.ok).toBe(true);
        expect(Array.isArray(getData.agents)).toBe(true);
        expect(getData.agents.length).toBe(6);
        expect(Array.isArray(getData.proposals)).toBe(true);
        expect(getData.proposals.length).toBeGreaterThanOrEqual(2);

        const applyReq = new Request('http://localhost/api/admin/agents', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                proposalId: 'PRP-01',
                action: 'apply',
                reviewedBy: 'Darius Šauklys',
            }),
        });
        const applyRes = await agentsRoute.POST(applyReq);
        const applyData = await applyRes.json();
        expect(applyData.ok).toBe(true);
        expect(applyData.proposal.status).toBe('APPLIED');
    });

    it('renders all 8 modules and required data-testids in GilesAdminOs (src/components/giles-admin-os.tsx and src/app/[locale]/admin/page.tsx)', () => {
        const repoRoot = path.resolve(__dirname, '../..');
        const adminComponentPath = path.join(repoRoot, 'src/components/giles-admin-os.tsx');
        const adminPagePath = path.join(repoRoot, 'src/app/[locale]/admin/page.tsx');

        expect(fs.existsSync(adminComponentPath)).toBe(true);
        expect(fs.existsSync(adminPagePath)).toBe(true);

        const combinedSrc =
            fs.readFileSync(adminComponentPath, 'utf8') +
            '\n' +
            fs.readFileSync(adminPagePath, 'utf8') +
            '\n' +
            fs.readFileSync(
                path.join(repoRoot, 'src/components/giles-admin-product-crud.tsx'),
                'utf8',
            ) +
            '\n' +
            fs.readFileSync(
                path.join(repoRoot, 'src/components/giles-admin-invoice-builder.tsx'),
                'utf8',
            ) +
            '\n' +
            fs.readFileSync(
                path.join(repoRoot, 'src/components/giles-admin-integrations.tsx'),
                'utf8',
            );

        const requiredTestIds = [
            'giles-admin-panel',
            'admin-tab-overview',
            'admin-tab-support',
            'support-tickets-panel',
            'support-reserve-part-btn',
            'create-support-ticket-form',
            'warranty-registry-panel',
            'admin-tab-orders',
            'admin-tab-b2b',
            'admin-b2b-approvals',
            'admin-tab-skaita',
            'invoice-print-preview',
            'skaita-export-excel-btn',
            'skaita-export-isaf-btn',
            'skaita-import-stock-btn',
            'admin-tab-catalog',
            'admin-tab-projects',
            'admin-tab-agents',
            'admin-tab-integrations',
            'admin-integrations-hub',
            'export-env-template-btn',
            'agent-proposals-queue',
            'admin-catalog-crud',
            'admin-create-product-btn',
            'admin-create-product-form',
            'admin-bulk-brand-rule',
            'admin-save-product-btn',
            'admin-multiline-invoice-builder',
            'invoice-catalog-search',
            'convert-pro-to-gile-btn',
            'sepa-bank-reconciliation',
            'admin-ai-copilot-bar',
            'admin-low-stock-po-generator',
        ];

        for (const tid of requiredTestIds) {
            expect(combinedSrc).toContain(tid);
        }
    });

    it('W86-A1: declutters /lt/products dark header, provides traceable stockQuantity & stockSource via /api/inventory/sync across 13,531 products, and renders the bespoke Gilės CAD Calculators Workbench on /[locale]/skaiciuokle', async () => {
        const repoRoot = path.resolve(__dirname, '../..');

        // 1. Owner Item A: /lt/products dark header decluttered
        const productsPageSrc = fs.readFileSync(
            path.join(repoRoot, 'src/app/[locale]/products/page.tsx'),
            'utf8',
        );
        const headerMatch = productsPageSrc.match(
            /<section[\s\S]*?data-testid="giles-catalog-dark-header"[\s\S]*?<\/section>/,
        );
        expect(headerMatch).not.toBeNull();
        const darkHeaderHtml = headerMatch![0];
        expect(darkHeaderHtml).not.toContain('CatalogSearchForm');
        expect(darkHeaderHtml).not.toContain('Prekė, SKU kodas ar gamintojas');
        expect(darkHeaderHtml).not.toContain('Klausti inžinieriaus Vytauto');
        expect(darkHeaderHtml).not.toContain('Katilo vedlys');
        const storeUiCopySrc = fs.readFileSync(
            path.join(repoRoot, 'src/i18n/storefront-ui-copy.ts'),
            'utf8',
        );
        // W121-A2: the badge count is templated ({count}) and rendered live.
        expect(`${darkHeaderHtml}\n${storeUiCopySrc}`).toContain(
            'Sandėlis: Eigulių g. 21, LT-51418 Kaunas · {count} poz.',
        );

        // 2. Owner Item B (W121-A1 honest stock): availability + provenance on
        // every row; numeric qty only on the 28 real EGIP.lt rows.
        const snap = getGilesCatalogSnapshot();
        expect(snap.products.length).toBe(13531);
        const withHonestMeta = snap.products.filter(
            (p) =>
                (p.availability === 'in_stock' ||
                    p.availability === 'supplier_2_4d' ||
                    p.availability === 'on_request') &&
                p.stockUnit === 'vnt.' &&
                typeof p.stockSource === 'string' &&
                p.stockSource.length > 0 &&
                typeof p.lastSyncedAt === 'string',
        );
        expect(withHonestMeta.length).toBe(13531);
        const withRealQty = snap.products.filter(
            (p) => typeof p.stockQuantity === 'number' && p.stockQuantity > 0,
        );
        expect(withRealQty.length).toBe(28);

        // Verify live EGIP.lt ps_stock_available exact stock quantities
        const igniter425 = snap.products.find((p) => p.sku === 'KatM39833425');
        expect(igniter425?.stockQuantity).toBe(36);
        expect(igniter425?.stockSource).toBe('EGIP.lt PrestaShop bazė');

        const syncRoute = await import('../app/api/inventory/sync/route');
        const getSyncRes = await syncRoute.GET();
        const getSyncData = await getSyncRes.json();
        expect(getSyncData.ok).toBe(true);
        expect(getSyncData.totalProducts).toBe(13531);
        expect(getSyncData.breakdownBySource).toBeDefined();

        const postSyncReq = new Request('http://localhost/api/inventory/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                source: 'Skaita SQL · Kauno sandėlis (Eigulių g. 21, LT-51418 Kaunas)',
                rows: [{ sku: '013G2990', stockQuantity: 54, stockUnit: 'vnt.' }],
            }),
        });
        const postSyncRes = await syncRoute.POST(postSyncReq);
        const postSyncData = await postSyncRes.json();
        expect(postSyncData.ok).toBe(true);
        expect(postSyncData.updatedCount).toBeGreaterThanOrEqual(1);

        // 3. Owner Item C: Bespoke Gilės CAD Calculators Workbench on /[locale]/skaiciuokle
        const skaiciuoklePageSrc = fs.readFileSync(
            path.join(repoRoot, 'src/app/[locale]/skaiciuokle/page.tsx'),
            'utf8',
        );
        const hubSrc = fs.readFileSync(
            path.join(repoRoot, 'src/components/scientific-calculators-hub.tsx'),
            'utf8',
        );
        const combinedCalcSrc = `${skaiciuoklePageSrc}\n${hubSrc}`;
        expect(combinedCalcSrc).toContain('giles-cad-calculators-workbench');
        expect(combinedCalcSrc).toContain(
            'INŽINERINIS PROJEKTAVIMO DARBASTALIS · EN 12831 / STR 2.09.02',
        );
        expect(combinedCalcSrc).toContain(
            'Katilinių, granulių degiklių ir hidraulinių mazgų skaičiuoklės',
        );
        expect(combinedCalcSrc).toContain('01 / Katilinės ir ŠS galia (kW + sąmata)');
        expect(combinedCalcSrc).toContain('02 / Akumuliacinė talpa (Gorenje ZV / 50 L/kW)');
        expect(combinedCalcSrc).toContain('03 / Plėtimosi indas (IMI Pneumatex Statico)');
        expect(combinedCalcSrc).toContain('04 / Hidraulinis balansavimas (Danfoss / IMI Kvs)');
        expect(combinedCalcSrc).toContain('05 / Grindinio šildymo kontūrai (Comisa PEX)');
        expect(combinedCalcSrc).toContain('06 / Cirkuliacinis siurblys (Wilo / Grundfos ΔT)');
        expect(combinedCalcSrc).toContain('MAZGO SKAIČIAVIMO PROTOKOLAS · EN 12831');
        expect(combinedCalcSrc).toContain('+ Įtraukti mazgą į krepšelį');
    });

    it('W91-A1: integrates Animated Schematics #1, #2, and #3 with CAD animations, Srautas pause toggles, interactive modes, and 4-locale (lt, en, pl, ru) coverage', () => {
        const repoRoot = path.resolve(__dirname, '../..');
        const globalsCss = fs.readFileSync(path.join(repoRoot, 'src/app/globals.css'), 'utf8');
        expect(globalsCss).toContain('@keyframes flow');
        expect(globalsCss).toContain('@keyframes flick');
        expect(globalsCss).toContain('.paused .flow');

        const heroSchemPath = path.join(repoRoot, 'src/components/giles-hero-schematic.tsx');
        const doorContainerPath = path.join(repoRoot, 'src/components/giles-door-and-container-schematics.tsx');
        const barrelPath = path.join(repoRoot, 'src/components/giles-animated-schematics.tsx');
        expect(fs.existsSync(heroSchemPath)).toBe(true);
        expect(fs.existsSync(doorContainerPath)).toBe(true);
        expect(fs.existsSync(barrelPath)).toBe(true);

        const heroSchemSrc = fs.readFileSync(heroSchemPath, 'utf8');
        const doorContainerSrc = fs.readFileSync(doorContainerPath, 'utf8');
        const barrelSrc = fs.readFileSync(barrelPath, 'utf8');

        expect(heroSchemSrc).toContain('hero-boiler-schematic');
        expect(heroSchemSrc).toContain('hero-schematic-mode');
        expect(heroSchemSrc).toContain('hero-flow-toggle');
        expect(heroSchemSrc).toContain('viewBox="0 0 800 430"');
        expect(heroSchemSrc).toContain('MPB-NANI-35');
        expect(heroSchemSrc).toContain('Teplomix');
        expect(heroSchemSrc).toContain('Statico');
        expect(heroSchemSrc).toContain('Dynacon');

        expect(doorContainerSrc).toContain('door-conversion-toggle');
        expect(doorContainerSrc).toContain('viewBox="0 0 800 360"');
        expect(doorContainerSrc).toContain('container-model-switcher');
        expect(doorContainerSrc).toContain('container-zone-selector');
        expect(doorContainerSrc).toContain('viewBox="0 0 900 470"');
        expect(doorContainerSrc).toContain('GK-150');
        expect(doorContainerSrc).toContain('GK-250');
        expect(doorContainerSrc).toContain('GK-500');

        expect(barrelSrc).toContain('GilesHeroAnimatedSchematic');
        expect(barrelSrc).toContain('GilesDoorConversionSchematic');
        expect(barrelSrc).toContain('GilesContainer20ftSchematic');

        const homeHeroSrc = fs.readFileSync(path.join(repoRoot, 'src/components/home-hero.tsx'), 'utf8');
        const homePageSrc = fs.readFileSync(path.join(repoRoot, 'src/app/[locale]/page.tsx'), 'utf8');
        const vedlysSrc = fs.readFileSync(path.join(repoRoot, 'src/app/[locale]/vedlys/page.tsx'), 'utf8');
        const pramoneiSrc = fs.readFileSync(path.join(repoRoot, 'src/app/[locale]/pramonei/page.tsx'), 'utf8');

        expect(homeHeroSrc).toContain('GilesHeroAnimatedSchematic');
        expect(homePageSrc).toContain('GilesDoorConversionSchematic');
        expect(homePageSrc).toContain('GilesContainer20ftSchematic');
        expect(vedlysSrc).toContain('GilesDoorConversionSchematic');
        expect(pramoneiSrc).toContain('GilesContainer20ftSchematic');
    });

    it('W92-A1: persists Admin Product CRUD (inline edit, create product, bulk brand margin rule, AI enrichment) to catalog-overrides.json and reflects immediately in live catalog snapshot', async () => {
        const productsRoute = await import('../app/api/admin/products/route');

        await productsRoute.PATCH(
            new Request('http://localhost/api/admin/products', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'reset_overrides' }),
            }),
        );

        const getRes = await productsRoute.GET(
            new Request('http://localhost/api/admin/products?q=013G2990&limit=10'),
        );
        const getData = await getRes.json();
        expect(getData.ok).toBe(true);
        expect(getData.items.length).toBeGreaterThanOrEqual(1);
        const targetSku = getData.items[0].sku;

        // 1. Inline edit override
        const patchRes = await productsRoute.PATCH(
            new Request('http://localhost/api/admin/products', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sku: targetSku,
                    priceGrossEur: 29.99,
                    costPriceEur: 14.5,
                    stockQuantity: 77,
                    published: true,
                }),
            }),
        );
        const patchData = await patchRes.json();
        expect(patchData.ok).toBe(true);
        expect(patchData.product.priceGrossEur).toBe(29.99);
        expect(patchData.product.stockQuantity).toBe(77);

        const liveItem = findGilesSnapshotProductBySlugOrId(targetSku);
        expect(liveItem?.price).toBe(29.99);
        expect(liveItem?.stockQuantity).toBe(77);

        // 2. Create brand-new product
        const createRes = await productsRoute.POST(
            new Request('http://localhost/api/admin/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'create_product',
                    sku: 'GILE-NEW-2027-TEST',
                    ean: '4770001992027',
                    name: 'Gilės Inžinerija Išmanusis Katilinės Valdiklis GILE-PRO 2027',
                    brandName: 'Gilės Inžinerija',
                    category: 'Katilinės automatika',
                    priceGrossEur: 349.0,
                    costPriceEur: 195.0,
                    stockQuantity: 15,
                }),
            }),
        );
        const createData = await createRes.json();
        expect(createData.ok).toBe(true);
        const createdLive = findGilesSnapshotProductBySlugOrId('GILE-NEW-2027-TEST');
        expect(createdLive).not.toBeNull();
        expect(createdLive?.price).toBe(349.0);
        expect(createdLive?.stockQuantity).toBe(15);

        // 3. Bulk brand pricing rule
        const bulkRes = await productsRoute.POST(
            new Request('http://localhost/api/admin/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'bulk_brand_rule',
                    brandSlug: 'danfoss',
                    mode: 'margin_floor',
                    value: 28,
                }),
            }),
        );
        const bulkData = await bulkRes.json();
        expect(bulkData.ok).toBe(true);
        expect(bulkData.affectedCount).toBeGreaterThan(100);

        // 4. AI technical spec + 4-locale enrichment
        const aiRes = await productsRoute.POST(
            new Request('http://localhost/api/admin/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'ai_enrich_product',
                    sku: 'MPB-NANI-35',
                    name: 'Granulių degiklis Megatherm MPB NANI 35',
                    brandName: 'Gilės Inžinerija',
                }),
            }),
        );
        const aiData = await aiRes.json();
        expect(aiData.ok).toBe(true);
        expect(aiData.enrichment.descriptionLt.length).toBeGreaterThan(30);
        expect(aiData.enrichment.translations.en.length).toBeGreaterThan(15);
        expect(aiData.enrichment.translations.pl.length).toBeGreaterThan(15);
        expect(aiData.enrichment.translations.ru.length).toBeGreaterThan(15);

        // Clean up overrides so catalog-overrides.json remains clean
        await productsRoute.PATCH(
            new Request('http://localhost/api/admin/products', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'reset_overrides' }),
            }),
        );
    });

    it('W92-A1: supports Multi-Line Invoices, PRO -> GILE conversion, payment status lifecycle, and SEPA camt.053/CSV bank statement reconciliation in /api/accounting/skaita', async () => {
        resetSkaitaInvoices();
        const skaitaRoute = await import('../app/api/accounting/skaita/route');

        // 1. Create a multi-line Proforma invoice (PRO-XXXX)
        const proRes = await skaitaRoute.POST(
            new Request('http://localhost/api/accounting/skaita', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    docType: 'ISANKSTINE_SASKAITA',
                    buyerName: 'UAB „Šilumos Mazgas“',
                    buyerCompanyCode: '304455667',
                    buyerVatCode: 'LT100009988711',
                    buyerAddress: 'Pramonės pr. 15, Kaunas',
                    buyerEmail: 'buhalterija@silumosmazgas.lt',
                    paymentTermDays: 10,
                    lines: [
                        {
                            sku: 'MPB-NANI-35',
                            title: 'Granulių degiklio komplektas Megatherm MPB NANI 35',
                            unit: 'kompl.',
                            qty: 1,
                            unitNetEur: 1942.15,
                            discountPercent: 10,
                        },
                        {
                            sku: 'SERV-MONT-01',
                            title: 'Katilo montavimo ir paleidimo-derinimo darbai',
                            unit: 'vnt.',
                            qty: 1,
                            unitNetEur: 350.0,
                            discountPercent: 0,
                        },
                    ],
                }),
            }),
        );
        const proData = await proRes.json();
        expect(proData.ok).toBe(true);
        expect(proData.invoice.proformaNumber).toMatch(/^PRO-\d{4}$/);
        expect(proData.invoice.lines.length).toBe(2);
        expect(proData.invoice.paymentStatus).toBe('LAUKIA_APMOKEJIMO');

        // 2. Toggle payment status via PATCH
        const statusRes = await skaitaRoute.PATCH(
            new Request('http://localhost/api/accounting/skaita', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'update_status',
                    invoiceId: proData.invoice.id,
                    paymentStatus: 'APMOKETA_PAVEDIMU',
                }),
            }),
        );
        const statusData = await statusRes.json();
        expect(statusData.ok).toBe(true);
        expect(statusData.invoice.paymentStatus).toBe('APMOKETA_PAVEDIMU');

        // 3. Convert PRO -> GILE VAT invoice
        const convRes = await skaitaRoute.POST(
            new Request('http://localhost/api/accounting/skaita', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'convert_pro_to_gile',
                    invoiceId: proData.invoice.id,
                }),
            }),
        );
        const convData = await convRes.json();
        expect(convData.ok).toBe(true);
        expect(convData.invoice.docType).toBe('PVM_SASKAITA_FAKTURA');
        expect(convData.invoice.invoiceNumber).toMatch(/^GILE-\d{4}$/);

        // 4. Create second unpaid Proforma and reconcile via SEPA camt.053 / CSV bank statement
        const pro2Res = await skaitaRoute.POST(
            new Request('http://localhost/api/accounting/skaita', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    docType: 'ISANKSTINE_SASKAITA',
                    buyerName: 'UAB „Kauno Inžinerija“',
                    buyerCompanyCode: '305566778',
                    buyerVatCode: 'LT100011223311',
                    lines: [
                        {
                            sku: '013G2990',
                            title: 'Danfoss RA 2990 termostatinė galvutė',
                            unit: 'vnt.',
                            qty: 10,
                            unitNetEur: 18.5,
                        },
                    ],
                }),
            }),
        );
        const pro2Data = await pro2Res.json();
        const pro2No = pro2Data.invoice.proformaNumber;
        const pro2Gross = pro2Data.invoice.totalGrossEur;

        const sepaXml = `<BkToCstmrStmt><Stmt><Ntry><Amt Ccy="EUR">${pro2Gross.toFixed(2)}</Amt><NtryDtls><TxDtls><RltdPties><Dbtr><Nm>UAB Kauno Inzinerija</Nm></Dbtr></RltdPties><RmtInf><Ustrd>Apmokejimas pagal isankstine saskaita ${pro2No}</Ustrd></RmtInf></TxDtls></NtryDtls></Ntry></Stmt></BkToCstmrStmt>`;
        const sepaRes = await skaitaRoute.POST(
            new Request('http://localhost/api/accounting/skaita', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'reconcile_sepa',
                    statementText: sepaXml,
                }),
            }),
        );
        const sepaData = await sepaRes.json();
        expect(sepaData.ok).toBe(true);
        expect(sepaData.reconciledCount).toBeGreaterThanOrEqual(1);
        const reconciledInv = sepaData.invoices.find(
            (i: { id: string }) => i.id === pro2Data.invoice.id,
        );
        expect(reconciledInv.paymentStatus).toBe('APMOKETA_PAVEDIMU');
        expect(reconciledInv.docType).toBe('PVM_SASKAITA_FAKTURA');
        expect(reconciledInv.invoiceNumber).toMatch(/^GILE-\d{4}$/);

        resetSkaitaInvoices();
    });

    it('W92-A1: operates 2026/2027 Admin AI Copilot and Automated Low-Stock Supplier Purchase Order (PO) Generator via /api/admin/copilot', async () => {
        const copilotRoute = await import('../app/api/admin/copilot/route');
        const getRes = await copilotRoute.GET();
        const getData = await getRes.json();

        expect(getData.ok).toBe(true);
        expect(Array.isArray(getData.supplierPurchaseOrders)).toBe(true);
        expect(getData.supplierPurchaseOrders.length).toBeGreaterThanOrEqual(3);

        const postRes = await copilotRoute.POST(
            new Request('http://localhost/api/admin/copilot', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    commandId: 'generate_low_stock_po',
                    supplierName: 'Danfoss',
                }),
            }),
        );
        const postData = await postRes.json();
        expect(postData.ok).toBe(true);
        expect(postData.answer.length).toBeGreaterThan(20);
        expect(postData.generatedPo?.poNumber).toMatch(/^PO-GILE-\d{4}$/);
        expect(postData.generatedPo?.csvContent).toContain('PO_Nr;Tiekejas;SKU');
    });

    it('W92-A2: manages all 14 Plug-and-Play Integrations via /api/admin/integrations and processes signed webhooks via /api/integrations/webhooks/[provider]', async () => {
        resetSkaitaInvoices();
        const integrationsRoute = await import('../app/api/admin/integrations/route');
        const webhooksRoute = await import('../app/api/integrations/webhooks/[provider]/route');

        // Reset clean config first
        await integrationsRoute.PATCH(
            new Request('http://localhost/api/admin/integrations', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'reset_config' }),
            }),
        );

        // 1. GET /api/admin/integrations returns 14 connectors across 5 categories (5 ACTIVE by default, 9 READY_FOR_KEYS)
        const getRes = await integrationsRoute.GET();
        const getData = await getRes.json();
        expect(getData.ok).toBe(true);
        expect(getData.summary.totalCount).toBe(14);
        expect(getData.summary.activeOutOfBoxCount).toBe(5);
        expect(getData.summary.readyForKeysCount).toBe(9);
        expect(getData.integrations.length).toBe(14);

        const montonio = getData.integrations.find((i: { id: string }) => i.id === 'montonio');
        expect(montonio.webhookUrl).toBe('/api/integrations/webhooks/montonio');
        expect(montonio.readinessStatus).toBe('READY_FOR_KEYS');

        // 2. PATCH /api/admin/integrations saves keys & environment for montonio
        const patchRes = await integrationsRoute.PATCH(
            new Request('http://localhost/api/admin/integrations', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    integrationId: 'montonio',
                    enabled: true,
                    environment: 'production',
                    values: {
                        MONTONIO_ACCESS_KEY: 'MONT_LIVE_ACCESS_TEST_KEY',
                        MONTONIO_SECRET_KEY: 'MONT_LIVE_SECRET_TEST_KEY',
                        MONTONIO_ENV: 'production',
                    },
                }),
            }),
        );
        const patchData = await patchRes.json();
        expect(patchData.ok).toBe(true);
        const updatedMontonio = patchData.integrations.find(
            (i: { id: string }) => i.id === 'montonio',
        );
        expect(updatedMontonio.readinessStatus).toBe('CONFIGURED');
        expect(updatedMontonio.environment).toBe('production');
        expect(patchData.envProductionSnippet).toContain('MONTONIO_ACCESS_KEY=');

        // 3. POST /api/admin/integrations test_connection returns diagnostic receipt
        const testRes = await integrationsRoute.POST(
            new Request('http://localhost/api/admin/integrations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'test_connection',
                    integrationId: 'montonio',
                }),
            }),
        );
        const testData = await testRes.json();
        expect(testData.ok).toBe(true);
        expect(testData.diagnostic.integrationId).toBe('montonio');
        expect(testData.diagnostic.passed).toBe(true);

        // 4. Create an unpaid proforma invoice and trigger POST /api/integrations/webhooks/montonio
        const inv = createAutonomousSkaitaInvoice({
            docType: 'ISANKSTINE_SASKAITA',
            buyerName: 'UAB „Montonio Pirkėjas“',
            buyerCompanyCode: '306677889',
            buyerVatCode: 'LT100015566711',
            lines: [
                {
                    sku: 'MPB-NANI-35',
                    title: 'Granulių degiklio komplektas Megatherm MPB NANI 35',
                    qty: 1,
                    unitNetEur: 1942.15,
                },
            ],
        });
        expect(inv.paymentStatus).toBe('LAUKIA_APMOKEJIMO');

        const webhookPayload = JSON.stringify({
            orderNumber: inv.proformaNumber,
            merchantReference: inv.invoiceNumber,
            paymentStatus: 'PAID',
            grandTotal: inv.totalGrossEur,
            currency: 'EUR',
            transactionId: 'MONT-TX-998877',
        });

        const validWebhookHmac = crypto
            .createHmac('sha256', 'giles-webhook-default-verify')
            .update(webhookPayload)
            .digest('hex');

        const whRes = await webhooksRoute.POST(
            new Request('http://localhost/api/integrations/webhooks/montonio', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-webhook-signature': validWebhookHmac,
                },
                body: webhookPayload,
            }),
            { params: Promise.resolve({ provider: 'montonio' }) },
        );
        const whData = await whRes.json();
        expect(whData.ok).toBe(true);
        expect(whData.provider).toBe('montonio');
        expect(whData.invoiceUpdated).toBe(true);
        expect(whData.updatedInvoice.paymentStatus).toBe('APMOKETA_PAVEDIMU');

        // Clean up config file back to {} with zero fake secrets
        await integrationsRoute.PATCH(
            new Request('http://localhost/api/admin/integrations', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'reset_config' }),
            }),
        );
        resetSkaitaInvoices();
    });

    it('W93-A1: enforces 5-layer security guardrails, RBAC scopes, and financial circuit breaker on MCP JSON-RPC 2.0 server (/api/mcp)', async () => {
        const mcpRoute = await import('../app/api/mcp/route');
        const agentsRoute = await import('../app/api/admin/agents/route');

        // Reset clean MCP security store and proposals first
        await mcpRoute.PUT(
            new Request('http://localhost/api/mcp', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'reset_security' }),
            }),
        );

        // 1. Invalid Bearer token on POST /api/mcp rejection (401 / -32001), while anonymous tools/list returns 200 (Tier-0 Open Public Discovery)
        const anonListRes = await mcpRoute.POST(
            new Request('http://localhost/api/mcp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    id: 1,
                    method: 'tools/list',
                }),
            }),
        );
        expect(anonListRes.status).toBe(200);

        const unauthRes = await mcpRoute.POST(
            new Request('http://localhost/api/mcp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: 'Bearer invalid_token',
                },
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    id: 1,
                    method: 'tools/call',
                    params: { name: 'giles_update_product', arguments: { sku: 'MPB-NANI-35' } },
                }),
            }),
        );
        expect(unauthRes.status).toBe(401);
        const unauthData = await unauthRes.json();
        expect(unauthData.error.code).toBe(-32001);

        // 2. Generate read_only and operator_safe API keys
        const roKeyRes = await mcpRoute.PUT(
            new Request('http://localhost/api/mcp', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'generate_key',
                    name: 'Test Read-Only Claude Key',
                    scope: 'read_only',
                }),
            }),
        );
        const roKeyData = await roKeyRes.json();
        expect(roKeyData.ok).toBe(true);
        expect(roKeyData.rawKey).toMatch(/^giles_mcp_live_/);
        expect(roKeyData.keyRecord.keyHash).toHaveLength(64);

        const opKeyRes = await mcpRoute.PUT(
            new Request('http://localhost/api/mcp', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'generate_key',
                    name: 'Dariaus Claude Desktop (Operator Safe)',
                    scope: 'operator_safe',
                }),
            }),
        );
        const opKeyData = await opKeyRes.json();
        expect(opKeyData.ok).toBe(true);
        const opToken = opKeyData.rawKey as string;

        // 3. initialize + tools/list (22 tools) + resources/list (8 resources) + prompts/list (4 prompts)
        const initRes = await mcpRoute.POST(
            new Request('http://localhost/api/mcp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${opToken}`,
                },
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    id: 2,
                    method: 'initialize',
                    params: { protocolVersion: '2025-03-26' },
                }),
            }),
        );
        const initData = await initRes.json();
        expect(initData.result.serverInfo.name).toBe('giles-inzinerija-mcp');

        const toolsRes = await mcpRoute.POST(
            new Request('http://localhost/api/mcp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${opToken}`,
                },
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    id: 3,
                    method: 'tools/list',
                }),
            }),
        );
        const toolsData = await toolsRes.json();
        expect(toolsData.result.tools.length).toBe(32);

        const resListRes = await mcpRoute.POST(
            new Request('http://localhost/api/mcp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${opToken}`,
                },
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    id: 4,
                    method: 'resources/list',
                }),
            }),
        );
        const resListData = await resListRes.json();
        expect(resListData.result.resources.length).toBe(10);

        const promptsRes = await mcpRoute.POST(
            new Request('http://localhost/api/mcp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${opToken}`,
                },
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    id: 5,
                    method: 'prompts/list',
                }),
            }),
        );
        const promptsData = await promptsRes.json();
        expect(promptsData.result.prompts.length).toBe(4);

        // 4. read_only key blocked from giles_update_product (-32003)
        const roBlockedRes = await mcpRoute.POST(
            new Request('http://localhost/api/mcp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${roKeyData.rawKey}`,
                },
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    id: 6,
                    method: 'tools/call',
                    params: {
                        name: 'giles_update_product',
                        arguments: {
                            sku: 'MPB-NANI-35',
                            priceGrossEur: 2290,
                        },
                    },
                }),
            }),
        );
        const roBlockedData = await roBlockedRes.json();
        expect(roBlockedData.error.code).toBe(-32003);

        // 5. operator_safe key executes giles_store_overview & giles_search_products
        const overviewRes = await mcpRoute.POST(
            new Request('http://localhost/api/mcp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${opToken}`,
                },
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    id: 7,
                    method: 'tools/call',
                    params: {
                        name: 'giles_store_overview',
                        arguments: {},
                    },
                }),
            }),
        );
        const overviewData = await overviewRes.json();
        expect(overviewData.result.structuredContent.totalProducts).toBe(13531);

        const searchRes = await mcpRoute.POST(
            new Request('http://localhost/api/mcp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${opToken}`,
                },
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    id: 8,
                    method: 'tools/call',
                    params: {
                        name: 'giles_search_products',
                        arguments: { query: 'MPB-NANI-35', limit: 5 },
                    },
                }),
            }),
        );
        const searchData = await searchRes.json();
        expect(searchData.result.structuredContent.items.length).toBeGreaterThanOrEqual(1);

        // 6. operator_safe key triggers Financial Circuit Breaker (QUEUED_FOR_HUMAN_APPROVAL) when dropping price > 20%
        const cbRes = await mcpRoute.POST(
            new Request('http://localhost/api/mcp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${opToken}`,
                },
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    id: 9,
                    method: 'tools/call',
                    params: {
                        name: 'giles_update_product',
                        arguments: {
                            sku: 'MPB-NANI-35',
                            // W121-A1: pricelist price is now 1,294.70 EUR —
                            // 900 EUR is a >20 % drop and must queue for human approval.
                            priceGrossEur: 900,
                        },
                    },
                }),
            }),
        );
        const cbData = await cbRes.json();
        expect(cbData.result.structuredContent.status).toBe('QUEUED_FOR_HUMAN_APPROVAL');
        expect(cbData.result.structuredContent.proposalId).toMatch(/^PRP-MCP-/);

        // Verify proposal is visible in /api/admin/agents
        const agentsRes = await agentsRoute.GET();
        const agentsData = await agentsRes.json();
        const foundProposal = agentsData.proposals.find(
            (p: { id: string }) => p.id === cbData.result.structuredContent.proposalId,
        );
        expect(foundProposal).toBeDefined();

        // Clean up security store and proposals so JSON stores remain clean
        await mcpRoute.PUT(
            new Request('http://localhost/api/mcp', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'reset_security' }),
            }),
        );

        const repoRoot = path.resolve(__dirname, '../..');
        const mcpComponentSrc = fs.readFileSync(
            path.join(repoRoot, 'src/components/giles-admin-mcp.tsx'),
            'utf8',
        );
        const adminPageSrc = fs.readFileSync(
            path.join(repoRoot, 'src/app/[locale]/admin/page.tsx'),
            'utf8',
        );
        expect(adminPageSrc).toContain('admin-tab-mcp');
        for (const tid of [
            'admin-mcp-hub',
            'mcp-security-policy',
            'mcp-keys-manager',
            'mcp-generate-key-btn',
            'mcp-claude-config',
            'mcp-playground',
            'mcp-test-circuit-breaker-btn',
            'mcp-audit-log',
        ]) {
            expect(mcpComponentSrc).toContain(tid);
        }
    });

    it('resolves dynamic production origin, 12 Gilės Inžinerija domains, MX 79.98.29.20 safety, and legacy PrestaShop/WordPress 301 SEO redirects (WP-W94-A1)', () => {
        expect(PRODUCTION_PRIMARY_ORIGIN).toBe('https://gilesinzinerija.lt');

        // 1. Dynamic origin resolution: never leaks 127.0.0.1:3088 or localhost:3088 as public origin
        expect(resolvePublicSiteOrigin()).toBe('https://gilesinzinerija.lt');
        expect(resolvePublicSiteOrigin('127.0.0.1:3088')).toBe('https://gilesinzinerija.lt');
        expect(resolvePublicSiteOrigin('http://localhost:3088/lt/admin')).toBe('https://gilesinzinerija.lt');
        expect(resolvePublicSiteOrigin(new Request('http://127.0.0.1:3088/lt/admin'))).toBe(
            'https://gilesinzinerija.lt',
        );
        expect(
            resolvePublicSiteOrigin({
                headers: {
                    'x-forwarded-host': 'egip.lt',
                    'x-forwarded-proto': 'https',
                },
            }),
        ).toBe('https://egip.lt');
        expect(
            resolvePublicSiteOrigin({
                headers: {
                    host: 'vernerkatilai.lt',
                },
            }),
        ).toBe('https://vernerkatilai.lt');
        expect(resolvePublicSiteOrigin('ponast.lt')).toBe('https://ponast.lt');

        // 2. All 12 Gilės Inžinerija domains registered with MX 79.98.29.20 and ERP protection
        expect(GILES_DOMAIN_PORTFOLIO.length).toBe(12);
        const domainNames = GILES_DOMAIN_PORTFOLIO.map((d) => d.domain);
        for (const expectedDomain of [
            'gilesinzinerija.lt',
            'gilesinzinerija.com',
            'egip.lt',
            'vernerkatilai.lt',
            'ponast.lt',
            'ponast-verner.lt',
            'thermostal.lt',
            'thermostal.eu',
            'gilesgrupe.lt',
            'saukliai.lt',
            'gilesservisas.lt',
            'vernerbaltic.lt',
        ]) {
            expect(domainNames).toContain(expectedDomain);
        }

        const primaryDomain = GILES_DOMAIN_PORTFOLIO.find((d) => d.domain === 'gilesinzinerija.lt');
        expect(primaryDomain?.role).toBe('PRIMARY_CANONICAL');
        expect(primaryDomain?.mxProtectionRule).toContain('79.98.29.20');

        const erpDomain = GILES_DOMAIN_PORTFOLIO.find((d) => d.domain === 'gilesservisas.lt');
        expect(erpDomain?.role).toBe('PROTECTED_DO_NOT_TOUCH');

        // 3. Secondary brand domain entrypoint routing
        expect(resolveLegacySeoRedirect('/', undefined, 'egip.lt')).toBe('/lt/products');
        expect(resolveLegacySeoRedirect('/lt', undefined, 'www.egip.lt')).toBe('/lt/products');
        expect(resolveLegacySeoRedirect('/', undefined, 'vernerkatilai.lt')).toBe('/lt/products?q=Verner');
        expect(resolveLegacySeoRedirect('/', undefined, 'ponast.lt')).toBe('/lt/products?q=Ponast');
        expect(resolveLegacySeoRedirect('/', undefined, 'ponast-verner.lt')).toBe('/lt/pramonei');
        expect(resolveLegacySeoRedirect('/', undefined, 'thermostal.lt')).toBe('/lt/products?q=Thermostal');
        expect(resolveLegacySeoRedirect('/', undefined, 'thermostal.eu')).toBe('/lt/products?q=Thermostal');
        expect(resolveLegacySeoRedirect('/', undefined, 'gilesgrupe.lt')).toBe('/lt');
        expect(resolveLegacySeoRedirect('/', undefined, 'gilesservisas.lt')).toBeNull();

        // 4. Legacy WordPress (gilesinzinerija.com) 301 SEO redirects
        expect(resolveLegacySeoRedirect('/apie-mus/', undefined, 'gilesinzinerija.com')).toBe('/lt/apie-mus');
        expect(resolveLegacySeoRedirect('/paslaugos/', undefined, 'gilesinzinerija.com')).toBe('/lt/inzinerija');
        expect(resolveLegacySeoRedirect('/atlikti-darbai/', undefined, 'gilesinzinerija.com')).toBe('/lt/projektai');
        expect(resolveLegacySeoRedirect('/kontaktai/', undefined, 'gilesinzinerija.com')).toBe('/lt/uzklausa');
        expect(resolveLegacySeoRedirect('/granuliu-degikliai/', undefined, 'gilesinzinerija.com')).toBe('/lt/konversija');
        expect(resolveLegacySeoRedirect('/konteinerines-katilines/', undefined, 'gilesinzinerija.com')).toBe('/lt/pramonei');
        expect(resolveLegacySeoRedirect('/katilu-nuoma/', undefined, 'gilesinzinerija.com')).toBe('/lt/pramonei');

        // 5. Legacy PrestaShop (egip.lt) 301 SEO redirects
        expect(
            resolveLegacySeoRedirect(
                '/index.php',
                new URLSearchParams('id_product=125&controller=product'),
                'egip.lt',
            ),
        ).toBe('/lt/products');
        expect(resolveLegacySeoRedirect('/lt/3-katilai', undefined, 'egip.lt')).toBe('/lt/products?q=Katilai');
        expect(resolveLegacySeoRedirect('/lt/12-katilai', undefined, 'egip.lt')).toBe('/lt/products?q=Katilai');
        expect(resolveLegacySeoRedirect('/lt/4-degikliai', undefined, 'egip.lt')).toBe('/lt/products?q=Degikliai');
        expect(resolveLegacySeoRedirect('/lt/15-degikliai', undefined, 'egip.lt')).toBe('/lt/products?q=Degikliai');
        expect(resolveLegacySeoRedirect('/lt/5-boileriai', undefined, 'egip.lt')).toBe('/lt/products?q=Boileriai');
        expect(resolveLegacySeoRedirect('/lt/content/4-apie-mus', undefined, 'egip.lt')).toBe('/lt/apie-mus');

        // 6. Verify UI & config files contain zero hardcoded 127.0.0.1:3088 in production snippets and expose required testids
        const repoRoot = path.resolve(__dirname, '../..');
        const mcpUiSrc = fs.readFileSync(path.join(repoRoot, 'src/components/giles-admin-mcp.tsx'), 'utf8');
        const integrationsUiSrc = fs.readFileSync(
            path.join(repoRoot, 'src/components/giles-admin-integrations.tsx'),
            'utf8',
        );
        expect(mcpUiSrc).toContain('mcp-origin-mode-toggle');
        expect(mcpUiSrc).not.toContain('127.0.0.1:3088');
        expect(integrationsUiSrc).toContain('admin-domains-cutover-panel');
        expect(integrationsUiSrc).toContain('79.98.29.20');

        const caddyfileSrc = fs.readFileSync(
            path.join(repoRoot, 'deploy/Caddyfile.giles-prod'),
            'utf8',
        );
        const composeSrc = fs.readFileSync(
            path.join(repoRoot, 'deploy/docker-compose.giles-prod.yml'),
            'utf8',
        );
        const cutoverScriptSrc = fs.readFileSync(
            path.join(repoRoot, 'deploy/cutover-domains-check.sh'),
            'utf8',
        );
        expect(caddyfileSrc).toContain('gilesinzinerija.lt');
        expect(caddyfileSrc).toContain('egip.lt');
        expect(caddyfileSrc).toContain('vernerkatilai.lt');
        expect(composeSrc).toContain('https://gilesinzinerija.lt');
        expect(cutoverScriptSrc).toContain('79.98.29.20');
    });

    it('W95-A1: unifies header and footer brand logo + title lockup with identical patented acorn mark img and footer color palette', () => {
        const repoRoot = path.resolve(__dirname, '../..');
        const logoSrc = fs.readFileSync(
            path.join(repoRoot, 'src/components/giles-logo.tsx'),
            'utf8',
        );
        const navbarSrc = fs.readFileSync(
            path.join(repoRoot, 'src/components/navbar.tsx'),
            'utf8',
        );
        const footerSrc = fs.readFileSync(
            path.join(repoRoot, 'src/components/footer.tsx'),
            'utf8',
        );
        const brandSvgSrc = fs.readFileSync(
            path.join(repoRoot, 'public/images/brands/giles-inzinerija.svg'),
            'utf8',
        );

        // Single patented acorn mark image and localized markAlt across all viewports
        expect(logoSrc).toContain('GILES_PATENTED_MARK_TRANSPARENT_PATH');
        expect(logoSrc).toContain("markAlt: 'UAB Gilės inžinerija patented acorn mark'");
        expect(logoSrc).toContain("tagline: 'HEATING ENGINEERING · SINCE 2011'");
        expect(logoSrc).toContain("tagline: 'ŠILUMOS INŽINERIJA · NUO 2011 M.'");
        expect(logoSrc).not.toContain('GILES_PATENTED_FULL_LIGHT_PATH');
        expect(logoSrc).not.toContain('#8C3061');
        expect(logoSrc).not.toMatch(/brightness|invert|sepia|mix-blend-/);

        // Exact light (#11161B / #5E8C1E / #5A6570) and dark (#F5F3EE / #A9C83E / #A3ADB8) brand lockup tokens
        expect(logoSrc).toContain('text-[#11161B]');
        expect(logoSrc).toContain('text-[#5E8C1E]');
        expect(logoSrc).toContain('text-[#5A6570]');
        expect(logoSrc).toContain('text-[#F5F3EE]');
        expect(logoSrc).toContain('text-[#A9C83E]');
        expect(logoSrc).toContain('text-[#A3ADB8]');

        // Header (navbar.tsx) defaults to warm cream #F5F3EE (variant="light") with dark toggle (#0B0F13, variant="dark"); footer uses variant="dark"
        expect(navbarSrc).toContain('<GilesBrandLogo variant="light" />');
        expect(navbarSrc).toContain('<GilesBrandLogo variant="dark" />');
        expect(footerSrc).toContain('<GilesBrandLogo variant="dark" />');
        expect(navbarSrc).toContain('bg-[#F5F3EE]');
        expect(navbarSrc).toContain('bg-[#0B0F13]');
        expect(footerSrc).toContain('bg-[#0B0F13]');

        // Secondary B2B/Admin brand badge SVG also free of #8C3061 mismatch
        expect(brandSvgSrc).not.toContain('#8C3061');
        expect(brandSvgSrc).toContain('#A9C83E');
    });
});
