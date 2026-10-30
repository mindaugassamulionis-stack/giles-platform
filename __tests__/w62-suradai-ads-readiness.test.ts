import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { buildProductSlug } from '../src/lib/catalog';
import {
    SHARED_IMAGE_LIMIT,
    evaluateAdReadiness,
    isAdReadyFeedRow,
    buildCatalogFeedItems,
    formatCatalogFeedXml,
    resolveFeedDomain,
    type RawFeedProductRow,
} from '../src/lib/catalog-feed';
import { trackEvent, getConfiguredPixelIds } from '../src/components/analytics';
import {
    GILES_SYSTEM_PACKAGES,
    GILES_ENGINEERING_SERVICES,
    UNDERFLOOR_AREA_PRESETS,
    calculateHeatingSystemRecommendation,
    computePackageTotalEur,
    validateEngineeringLeadPayload,
} from '../src/lib/giles-packages-data';

const APP_ROOT = join(__dirname, '..');
const SRC_DIR = join(APP_ROOT, 'src');
const MESSAGES_DIR = join(APP_ROOT, 'messages');

describe('W62-A2: Suradai Video Ads & Catalog Ads Readiness Contract', () => {
    it('1) resolves product PDP routes by slug as well as id and sku, and links product cards via /${locale}/products/${product.slug || product.id}', () => {
        const slug = buildProductSlug('Termostatinė galvutė Danfoss RA 2990', '013G2990');
        assert.equal(slug, 'termostatine-galvute-danfoss-ra-2990-013g2990');

        const imiSlug = buildProductSlug('Balansinis vožtuvas IMI TA STAD-B DN20', '52-151-220');
        assert.equal(imiSlug, 'balansinis-voztuvas-imi-ta-stad-b-dn20-52-151-220');

        const catalogSrc = readFileSync(join(SRC_DIR, 'lib/catalog.ts'), 'utf8');
        assert.match(catalogSrc, /slug:\s*products\.slug/);
        assert.match(catalogSrc, /LOWER\(\$\{products\.slug\}\)\s*=\s*LOWER\(\$\{decodedId\}\)/);
        assert.match(catalogSrc, /LOWER\(\$\{variants\.sku\}\)\s*=\s*LOWER\(\$\{decodedId\}\)/);

        const catalogListingSrc = readFileSync(join(SRC_DIR, 'lib/catalog-listing.ts'), 'utf8');
        assert.match(catalogListingSrc, /p\.slug/);

        const cardSrc = readFileSync(join(SRC_DIR, 'components/product-card.tsx'), 'utf8');
        assert.match(cardSrc, /href=\{`\/\$\{locale\}\/products\/\$\{product\.slug \|\| product\.id\}`\}/);

        const popularSrc = readFileSync(join(SRC_DIR, 'components/popular-products.tsx'), 'utf8');
        assert.match(popularSrc, /href=\{`\/\$\{locale\}\/products\/\$\{product\.slug \|\| product\.id\}`\}/);

        const catalogViewSrc = readFileSync(join(SRC_DIR, 'components/conversion/catalog-view.tsx'), 'utf8');
        assert.match(catalogViewSrc, /href=\{`\/\$\{locale\}\/products\/\$\{p\.slug \|\| p\.id\}`\}/);
    });

    it('2) /api/feed and /api/feed/products.xml enforce strict ad_ready gates and include all 9 required TikTok/Meta fields in JSON and RSS 2.0 XML', () => {
        assert.equal(SHARED_IMAGE_LIMIT, 3);

        const validRow: RawFeedProductRow = {
            id: 'cef124fd-2b4d-433e-8b58-c8e68bc3da0e',
            slug: 'adapteris-danfoss-ra-ra-013g1350',
            title_lt: 'Adapteris Danfoss RA–RA (013G1350)',
            description_lt: 'Originalus Danfoss adapteris termostatiniams vožtuvams ir galvutėms.',
            brand: 'Danfoss',
            category: 'Termostatinės galvutės ir vožtuvai',
            sku: '013G1350',
            price_gross_cents: 4250,
            compare_at_cents: null,
            stock: 0,
            track_inventory: false,
            allow_backorder: true,
            inventory_status: 'backorder',
            images: [{ url: '/images/products/013g1350.webp', slot: 'main', type: 'image' }],
            main_image_shared_by: 1,
            store_domain: '92-5-163-199.sslip.io',
        };

        const sharedImageRow: RawFeedProductRow = {
            ...validRow,
            id: '00000000-0000-0000-0000-000000000002',
            sku: '7101003',
            slug: 'issiuntimo-indas-7101003',
            main_image_shared_by: 12,
        };

        const outOfStockTrackedRow: RawFeedProductRow = {
            ...validRow,
            id: '00000000-0000-0000-0000-000000000003',
            sku: '013G9999',
            slug: 'voztuvas-013g9999',
            track_inventory: true,
            stock: 0,
            inventory_status: 'out_of_stock',
        };

        const omnibusDiscountRow: RawFeedProductRow = {
            ...validRow,
            id: '00000000-0000-0000-0000-000000000004',
            sku: '013G8888',
            slug: 'voztuvas-013g8888',
            compare_at_cents: 5900,
        };

        const missingSlugRow: RawFeedProductRow = {
            ...validRow,
            id: '00000000-0000-0000-0000-000000000005',
            sku: '013G7777',
            slug: '',
        };

        assert.equal(isAdReadyFeedRow(validRow), true);
        assert.equal(isAdReadyFeedRow(sharedImageRow), false);
        assert.equal(isAdReadyFeedRow(outOfStockTrackedRow), false);
        assert.equal(isAdReadyFeedRow(omnibusDiscountRow), false);
        assert.equal(isAdReadyFeedRow(missingSlugRow), false);
        assert.match(evaluateAdReadiness(sharedImageRow).reasons[0], /shared by 12 products/);

        const items = buildCatalogFeedItems([
            validRow,
            sharedImageRow,
            outOfStockTrackedRow,
            omnibusDiscountRow,
            missingSlugRow,
        ]);

        assert.equal(items.length, 1);
        const item = items[0];

        const requiredFields = [
            'id',
            'title',
            'description',
            'availability',
            'condition',
            'price',
            'link',
            'image_link',
            'brand',
        ] as const;
        for (const field of requiredFields) {
            assert.ok(item[field], `Feed item missing required field: ${field}`);
        }

        assert.equal(item.id, '013G1350');
        assert.equal(item.availability, 'in stock');
        assert.equal(item.condition, 'new');
        assert.equal(item.price, '42.50 EUR');
        assert.equal(item.link, 'https://92-5-163-199.sslip.io/suradai/lt/products/adapteris-danfoss-ra-ra-013g1350');
        assert.equal(item.image_link, 'https://92-5-163-199.sslip.io/suradai/images/products/013g1350.webp');
        assert.equal(item.brand, 'Danfoss');
        assert.ok(item.main_image_shared_by <= 3);

        assert.equal(resolveFeedDomain(), 'fill.lt');
        const xml = formatCatalogFeedXml(items, '92-5-163-199.sslip.io');
        assert.match(xml, /<rss version="2\.0" xmlns:g="http:\/\/base\.google\.com\/ns\/1\.0">/);
        assert.match(xml, /<title>FILL\.LT – Šildymo, santechnikos ir inžinerinių sistemų centras<\/title>/);
        assert.match(xml, /<g:id>013G1350<\/g:id>/);
        assert.match(xml, /<g:availability>in stock<\/g:availability>/);
        assert.match(xml, /<g:condition>new<\/g:condition>/);
        assert.match(xml, /<g:price>42\.50 EUR<\/g:price>/);
        assert.match(xml, /<g:link>https:\/\/92-5-163-199\.sslip\.io\/suradai\/lt\/products\/adapteris-danfoss-ra-ra-013g1350<\/g:link>/);
        assert.match(xml, /<g:image_link>https:\/\/92-5-163-199\.sslip\.io\/suradai\/images\/products\/013g1350\.webp<\/g:image_link>/);
        assert.match(xml, /<g:brand>Danfoss<\/g:brand>/);

        const xmlRouteSrc = readFileSync(join(SRC_DIR, 'app/api/feed/products.xml/route.ts'), 'utf8');
        assert.match(xmlRouteSrc, /export[\s\S]*GET[\s\S]*from '\.\.\/route'/);
    });

    it('3) Analytics & trackEvent (ViewContent, AddToCart, Purchase) are wired in product-purchase.tsx and uzsakyma-gauta/page.tsx and are strict no-ops without pixel IDs', () => {
        const layoutSrc = readFileSync(join(SRC_DIR, 'app/[locale]/layout.tsx'), 'utf8');
        assert.match(layoutSrc, /NEXT_PUBLIC_FB_PIXEL_ID/);
        assert.match(layoutSrc, /NEXT_PUBLIC_TIKTOK_PIXEL_ID/);
        assert.match(layoutSrc, /NEXT_PUBLIC_GA_ID/);

        const purchasePanelSrc = readFileSync(join(SRC_DIR, 'components/conversion/product-purchase.tsx'), 'utf8');
        assert.match(purchasePanelSrc, /trackEvent\('ViewContent'/);
        assert.match(purchasePanelSrc, /trackEvent\('AddToCart'/);

        const orderReceivedSrc = readFileSync(join(SRC_DIR, 'app/[locale]/uzsakyma-gauta/page.tsx'), 'utf8');
        assert.match(orderReceivedSrc, /<PurchaseTracker/);

        const purchaseTrackerSrc = readFileSync(join(SRC_DIR, 'components/purchase-tracker.tsx'), 'utf8');
        assert.match(purchaseTrackerSrc, /trackEvent\('Purchase'/);

        const calls: Array<{ provider: string; args: any[] }> = [];
        const prevWindow = (globalThis as any).window;
        (globalThis as any).window = {
            fbq: (...args: any[]) => calls.push({ provider: 'fbq', args }),
            ttq: { track: (...args: any[]) => calls.push({ provider: 'ttq', args }) },
            gtag: (...args: any[]) => calls.push({ provider: 'gtag', args }),
            __SURADAI_PIXELS__: {},
        };

        try {
            // When no pixel IDs are configured, trackEvent MUST NOT fire any network/pixel call
            const emptyCfg = getConfiguredPixelIds({ gaId: '', fbPixelId: '', tiktokPixelId: '' });
            assert.equal(emptyCfg.gaId, undefined);
            assert.equal(emptyCfg.fbPixelId, undefined);
            assert.equal(emptyCfg.tiktokPixelId, undefined);

            const noOpResult = trackEvent(
                'ViewContent',
                {
                    content_ids: ['013G1350'],
                    content_name: 'Danfoss Adapteris',
                    content_type: 'product',
                    value: 42.5,
                    currency: 'EUR',
                },
                { gaId: '', fbPixelId: '', tiktokPixelId: '' },
            );
            assert.equal(noOpResult, false);
            assert.equal(calls.length, 0);

            // When pixel IDs ARE configured, all 3 events fire cleanly
            const pixelCfg = {
                fbPixelId: '1234567890',
                tiktokPixelId: 'TT_TEST_ID',
                gaId: 'G-TEST1234',
            };

            const vcResult = trackEvent(
                'ViewContent',
                {
                    content_ids: ['013G1350'],
                    content_name: 'Danfoss Adapteris',
                    content_type: 'product',
                    value: 42.5,
                    currency: 'EUR',
                },
                pixelCfg,
            );
            assert.equal(vcResult, true);
            assert.equal(calls.length, 3);
            assert.deepEqual(calls[0].args.slice(0, 2), ['track', 'ViewContent']);
            assert.equal(calls[1].args[0], 'ViewContent');
            assert.deepEqual(calls[2].args.slice(0, 2), ['event', 'view_item']);

            calls.length = 0;
            const atcResult = trackEvent(
                'AddToCart',
                {
                    content_ids: ['013G1350'],
                    content_name: 'Danfoss Adapteris',
                    content_type: 'product',
                    value: 85.0,
                    price: 42.5,
                    currency: 'EUR',
                    num_items: 2,
                },
                pixelCfg,
            );
            assert.equal(atcResult, true);
            assert.equal(calls.length, 3);
            assert.deepEqual(calls[0].args.slice(0, 2), ['track', 'AddToCart']);
            assert.equal(calls[0].args[2].num_items, 2);
            assert.equal(calls[1].args[0], 'AddToCart');
            assert.deepEqual(calls[2].args.slice(0, 2), ['event', 'add_to_cart']);

            calls.length = 0;
            const purchaseResult = trackEvent(
                'Purchase',
                {
                    order_id: 'ORD-2026-001',
                    content_ids: ['013G1350'],
                    content_type: 'product',
                    value: 85.0,
                    currency: 'EUR',
                    items: [{ sku: '013G1350', name: 'Danfoss Adapteris', price: 42.5, quantity: 2 }],
                },
                pixelCfg,
            );
            assert.equal(purchaseResult, true);
            assert.equal(calls.length, 3);
            assert.deepEqual(calls[0].args.slice(0, 2), ['track', 'Purchase']);
            assert.equal(calls[1].args[0], 'CompletePayment');
            assert.deepEqual(calls[2].args.slice(0, 2), ['event', 'purchase']);
        } finally {
            (globalThis as any).window = prevWindow;
        }
    });

    it('4) Legal pages (legalPrivacy.json, legalTerms.json, contactPage.json, and footer.tsx) use clean company placeholders and zero Šviesūs projektai references', () => {
        const privacyLt = readFileSync(join(MESSAGES_DIR, 'lt/legalPrivacy.json'), 'utf8');
        const termsLt = readFileSync(join(MESSAGES_DIR, 'lt/legalTerms.json'), 'utf8');
        const contactLt = readFileSync(join(MESSAGES_DIR, 'lt/contactPage.json'), 'utf8');
        const footerTsx = readFileSync(join(SRC_DIR, 'components/footer.tsx'), 'utf8');
        const privacyPageTsx = readFileSync(join(SRC_DIR, 'app/[locale]/privacy/page.tsx'), 'utf8');
        const termsPageTsx = readFileSync(join(SRC_DIR, 'app/[locale]/terms/page.tsx'), 'utf8');
        const contactPageTsx = readFileSync(join(SRC_DIR, 'app/[locale]/contact/page.tsx'), 'utf8');

        const requiredPlaceholders = [
            'UAB „[Įmonės pavadinimas]“',
            '[Įmonės kodas]',
            '[PVM mokėtojo kodas]',
            '[Gatve g. 00, LT-00000 Vilnius, Lietuva]',
            'info@fill.lt',
        ];

        for (const token of requiredPlaceholders) {
            assert.ok(privacyLt.includes(token), `legalPrivacy.json missing "${token}"`);
            assert.ok(termsLt.includes(token), `legalTerms.json missing "${token}"`);
            assert.ok(contactLt.includes(token), `contactPage.json missing "${token}"`);
            assert.ok(footerTsx.includes(token), `footer.tsx missing "${token}"`);
            assert.ok(privacyPageTsx.includes(token), `privacy/page.tsx missing "${token}"`);
            assert.ok(termsPageTsx.includes(token), `terms/page.tsx missing "${token}"`);
            assert.ok(contactPageTsx.includes(token), `contact/page.tsx missing "${token}"`);
        }

        const forbiddenTokens = ['Šviesūs projektai', '307595567', 'LT100019795414', 'Perkūnkiemio'];
        for (const bad of forbiddenTokens) {
            assert.ok(!privacyLt.includes(bad), `legalPrivacy.json must not contain "${bad}"`);
            assert.ok(!termsLt.includes(bad), `legalTerms.json must not contain "${bad}"`);
            assert.ok(!contactLt.includes(bad), `contactPage.json must not contain "${bad}"`);
            assert.ok(!footerTsx.includes(bad), `footer.tsx must not contain "${bad}"`);
            assert.ok(!privacyPageTsx.includes(bad), `privacy/page.tsx must not contain "${bad}"`);
            assert.ok(!termsPageTsx.includes(bad), `terms/page.tsx must not contain "${bad}"`);
            assert.ok(!contactPageTsx.includes(bad), `contact/page.tsx must not contain "${bad}"`);
        }

        assert.ok(footerTsx.includes('/legal/privacy'));
        assert.ok(footerTsx.includes('/legal/terms'));
        assert.ok(footerTsx.includes('/contact'));
        assert.ok(footerTsx.includes('/privatumo-politika'));
        assert.ok(footerTsx.includes('/pirkimo-taisykles'));
        assert.ok(footerTsx.includes('/kontaktai'));
    });

    it('5) W64-A3: Gilės Inžinerija 6 System Packages, 6 Engineering Services, HeatingSystemCalculator, and /api/engineering-lead are wired across /paketai, /inzinerija, header, footer, and homepage', async () => {
        const {
            GILES_SYSTEM_PACKAGES,
            GILES_ENGINEERING_SERVICES,
            UNDERFLOOR_AREA_PRESETS,
            calculateHeatingSystem,
            calculateHeatingSystemRecommendation,
            computePackageTotalEur,
            validateEngineeringLeadPayload,
        } = await import('../src/lib/giles-packages-data');

        assert.equal(GILES_SYSTEM_PACKAGES.length, 7, 'Must define all 7 Gilės Inžinerija & Haier/Gorenje system packages');
        assert.equal(GILES_ENGINEERING_SERVICES.length, 6, 'Must define all 6 Gilės Inžinerija engineering services');
        assert.deepEqual(
            UNDERFLOOR_AREA_PRESETS.map((p) => p.areaM2),
            [50, 100, 150, 200],
            'Underfloor heating presets must cover 50, 100, 150, and 200 m²',
        );

        for (const pkg of GILES_SYSTEM_PACKAGES) {
            assert.ok(pkg.components.length >= 3, `Package ${pkg.id} must have >= 3 real catalog components`);
            const total = computePackageTotalEur(pkg.components);
            assert.ok(total > 200, `Package ${pkg.id} total must be > 200 EUR`);
        }

        const calcPellet = calculateHeatingSystem({
            areaM2: 150,
            insulationClass: 'b_c',
            emitterType: 'underfloor',
            heatSource: 'pellet',
            occupants: '3_4',
        });
        assert.ok(calcPellet.requiredPowerKw > 8 && calcPellet.requiredPowerKw < 20);
        assert.equal(calcPellet.recommendedBoilerLiters, 200);
        assert.equal(calcPellet.recommendedBoilerSku, 'OKC200NTR');
        assert.ok(calcPellet.underfloorLoopsCount >= 6);
        assert.equal(calcPellet.recommendedPackageId, 'pkg-pellet-25kw');

        const calcSolidFuel = calculateHeatingSystemRecommendation({
            areaM2: 180,
            insulationClass: 'old_unrenovated',
            emitterType: 'radiators',
            heatSource: 'solid_fuel_buffer',
            occupants: '5_plus',
        });
        assert.ok(calcSolidFuel.recommendedBufferLiters >= 800);
        assert.equal(calcSolidFuel.recommendedBoilerLiters, 250);
        assert.equal(calcSolidFuel.recommendedPackageId, 'pkg-solid-fuel-buffer');

        const validLead = validateEngineeringLeadPayload({
            name: 'Jonas Kazlauskas',
            phone: '+37061234567',
            email: 'jonas@example.lt',
            city: 'Vilnius',
            serviceType: 'Katilinių ir granulių degiklių montavimas iki rakto',
            packageId: 'pkg-pellet-25kw',
            areaM2: 150,
            notes: 'Reikalingas montavimas su APVA dokumentais',
        });
        assert.equal(validLead.ok, true);

        const invalidLead = validateEngineeringLeadPayload({ name: 'J', phone: '' });
        assert.equal(invalidLead.ok, false);

        const calcComponentSrc = readFileSync(
            join(SRC_DIR, 'components/conversion/heating-system-calculator.tsx'),
            'utf8',
        );
        assert.match(calcComponentSrc, /useCart/);
        assert.match(calcComponentSrc, /\/api\/engineering-lead/);
        assert.match(calcComponentSrc, /Įdėti rekomenduojamą paketą į krepšelį/);
        assert.match(calcComponentSrc, /Užsakyti su projektavimu ir montavimu/);

        const paketaiPageSrc = readFileSync(join(SRC_DIR, 'app/[locale]/paketai/page.tsx'), 'utf8');
        assert.match(paketaiPageSrc, /GILES_SYSTEM_PACKAGES/);
        assert.match(paketaiPageSrc, /HeatingSystemCalculator/);
        assert.match(paketaiPageSrc, /useCart/);

        const inzinerijaPageSrc = readFileSync(join(SRC_DIR, 'app/[locale]/inzinerija/page.tsx'), 'utf8');
        assert.match(inzinerijaPageSrc, /GILES_ENGINEERING_SERVICES/);
        assert.match(inzinerijaPageSrc, /HeatingSystemCalculator/);
        assert.match(inzinerijaPageSrc, /\/api\/engineering-lead/);

        const headerSrc = readFileSync(join(SRC_DIR, 'components/header.tsx'), 'utf8');
        const navbarSrc = readFileSync(join(SRC_DIR, 'components/navbar.tsx'), 'utf8');
        const footerSrc = readFileSync(join(SRC_DIR, 'components/footer.tsx'), 'utf8');
        const homePageSrc = readFileSync(join(SRC_DIR, 'app/[locale]/page.tsx'), 'utf8');

        assert.match(headerSrc, /\/paketai/);
        assert.match(headerSrc, /\/inzinerija/);
        assert.match(navbarSrc, /\/paketai/);
        assert.match(navbarSrc, /\/inzinerija/);
        assert.match(footerSrc, /\/paketai/);
        assert.match(footerSrc, /\/inzinerija/);
        assert.match(homePageSrc, /\/paketai/);
        assert.match(homePageSrc, /\/inzinerija/);
        assert.match(homePageSrc, /HeatingSystemCalculator/);
    });

    it('6) W65-A1: 100% Gilės Inžinerija & EGIP price and product sync (504 LTL->EUR rows converted via ÷ 3.45280 and 33 rowspan Danfoss SKUs imported)', () => {
        const repoRoot = join(APP_ROOT, '../..');
        const w65GtPath = join(repoRoot, 'data/w65-danfoss-ferroli-ltl-ground-truth.json');
        const w65ScriptPath = join(repoRoot, 'scripts/w65-sync-100pct-giles-prices-and-products.mjs');
        const w65SqlPath = join(repoRoot, 'packages/database/drizzle/0009_w65_giles_100pct_price_and_product_sync.sql');

        assert.ok(existsSync(w65GtPath), 'data/w65-danfoss-ferroli-ltl-ground-truth.json must exist');
        assert.ok(existsSync(w65ScriptPath), 'scripts/w65-sync-100pct-giles-prices-and-products.mjs must exist');
        assert.ok(existsSync(w65SqlPath), '0009_w65_giles_100pct_price_and_product_sync.sql must exist');

        const w65Gt = JSON.parse(readFileSync(w65GtPath, 'utf8'));
        assert.equal(w65Gt.ltlToEurRate, 3.4528);
        assert.equal(w65Gt.summary.existingDanfossLtlRows, 491);
        assert.equal(w65Gt.summary.existingFerroliLtlRows, 13);
        assert.equal(w65Gt.summary.totalExistingLtlRowsToConvert, 504);
        assert.equal(w65Gt.summary.newRowspanDanfossSkusToImport, 33);

        const ra2990 = w65Gt.existingDanfossUpdates.find((x: { sku: string }) => x.sku === '013G2990');
        assert.ok(ra2990, '013G2990 must exist in existingDanfossUpdates');
        assert.equal(ra2990.priceGrossCents, 2523, '013G2990 must be 25.23 EUR (87.12 LTL / 3.45280)');
        assert.equal(ra2990.priceNetCents, 2085);

        const linkCc = w65Gt.existingDanfossUpdates.find((x: { sku: string }) => x.sku === '014G0150');
        assert.ok(linkCc, '014G0150 must exist in existingDanfossUpdates');
        assert.equal(linkCc.priceGrossCents, 53057, '014G0150 must be 530.57 EUR (1831.94 LTL / 3.45280)');

        const ferroliPol500 = w65Gt.existingFerroliUpdates.find((x: { sku: string }) => x.sku === 'POL./80-500');
        assert.ok(ferroliPol500, 'POL./80-500 must exist in existingFerroliUpdates');
        assert.equal(ferroliPol500.priceGrossCents, 1303, 'POL./80-500 must be 13.03 EUR (45.00 LTL / 3.45280)');

        const raxInox = w65Gt.newDanfossRowspanItems.find((x: { sku: string }) => x.sku === '013G6075');
        assert.ok(raxInox, '013G6075 rowspan SKU must exist in newDanfossRowspanItems');
        assert.equal(raxInox.priceGrossCents, 2874, '013G6075 must be 28.74 EUR (99.22 LTL / 3.45280)');

        const sqlContent = readFileSync(w65SqlPath, 'utf8');
        assert.match(sqlContent, /LTL_TO_EUR_3\.45280/);
        assert.match(sqlContent, /013G2990/);
        assert.match(sqlContent, /013G6075/);
        assert.match(sqlContent, /POL\.\/80-500/);
    });

    it('7) W66-A1/A3: studio-cleaned flyer images, 31 XML-valid brand SVGs (incl. Gilės Inžinerija, Megatherm, KaTRI), PDP pellet burner badge, and Vytautas 2-Stage Diagnostic Consultant + MOAT RAG + Card Images', async () => {
        const { resolveProductVisual, BRAND_LOGOS, resolveBrandLogo } = await import('../src/lib/brand-assets');
        const { getProductUxGuide } = await import('../src/lib/v3-description');
        const { assetUrl } = await import('../src/lib/api');
        const {
            evaluateVytautasTurn,
            stripRawUiEchoFromResponse,
            normalizeVytautasCardImages,
            VYTAUTAS_MOAT_RAG_KNOWLEDGE_BASE,
        } = await import('../src/lib/vytautas-consultant');

        // 1. All brand SVGs exist and contain no unescaped ampersands
        const brandsDir = join(APP_ROOT, 'public/images/brands');
        for (const info of Object.values(BRAND_LOGOS)) {
            const relFile = info.logoPath.replace(/^\/images\/brands\//, '');
            const svgPath = join(brandsDir, relFile);
            assert.ok(existsSync(svgPath), `Brand SVG missing: ${svgPath}`);
            const svgText = readFileSync(svgPath, 'utf8');
            assert.ok(!/\s&\s/.test(svgText), `Brand SVG ${relFile} contains raw unescaped "&"`);
        }
        assert.equal(resolveBrandLogo('UAB Gilės inžinerija').logoPath, '/images/brands/giles-inzinerija.svg');
        assert.equal(resolveBrandLogo('KaTRI').logoPath, '/images/brands/katri.svg');
        assert.equal(resolveBrandLogo('Megatherm').logoPath, '/images/brands/megatherm.svg');
        assert.ok(VYTAUTAS_MOAT_RAG_KNOWLEDGE_BASE.includes('KatF0033292'));
        assert.ok(VYTAUTAS_MOAT_RAG_KNOWLEDGE_BASE.includes('Link lyderių'));
        assert.ok(VYTAUTAS_MOAT_RAG_KNOWLEDGE_BASE.includes('Nord komfortui'));

        // 1b. Obfuscated Gilė code KatF0033292 / OEM 39833290 resolves directly in Vytautas
        const oemTurn = evaluateVytautasTurn({
            message: 'Reikia uždegimo teno KatF0033292 (arba 39833290)',
            history: [],
        });
        assert.equal(oemTurn.stage, 'recommendation');
        assert.equal(oemTurn.suggestedProducts[0].sku, 'KatF0033292');
        assert.equal(oemTurn.suggestedProducts[0].imageUrl, '/images/products/egip-katf0033292.webp');
        assert.ok(oemTurn.response.includes('39833290'));

        // 2. resolveProductVisual always resolves to kind="photo" and valid .webp
        const vis = resolveProductVisual({
            sku: 'degkmpl140mg20',
            title: 'Automatinis medienos granulių degiklio komplektas Megatherm 20 kW',
            brand: 'Megatherm',
            category: 'Katilinės automatika ir pavaros',
        });
        assert.equal(vis.kind, 'photo');
        assert.equal(vis.imageUrl, '/images/products/egip-degkmpl140mg20.webp');
        assert.equal(vis.brand.name, 'Megatherm');
        assert.equal(vis.brand.logoPath, '/images/brands/megatherm.svg');

        // 3. getProductUxGuide for degkmpl140mg20 returns pellet-burner-kit, NOT actuator-controller
        const ux = getProductUxGuide({
            title: 'Automatinis medienos granulių degiklio komplektas Megatherm 20 kW (degkmpl140mg20)',
            category: 'Katilinės automatika ir pavaros',
            brand: 'Megatherm',
            sku: 'degkmpl140mg20',
        });
        assert.equal(ux.subtypeId, 'pellet-burner-kit');
        assert.equal(ux.subtypeBadge, 'Granulių degiklių komplektai');

        // 4. assetUrl never double-prefixes /suradai/suradai/images/...
        const prevBase = process.env.NEXT_PUBLIC_BASE_PATH;
        process.env.NEXT_PUBLIC_BASE_PATH = '/suradai';
        try {
            assert.equal(
                assetUrl('/suradai/images/products/0382-02.000.webp'),
                '/suradai/images/products/0382-02.000.webp',
            );
            assert.equal(
                assetUrl('/images/products/0382-02.000.webp'),
                '/suradai/images/products/0382-02.000.webp',
            );
        } finally {
            if (prevBase === undefined) delete process.env.NEXT_PUBLIC_BASE_PATH;
            else process.env.NEXT_PUBLIC_BASE_PATH = prevBase;
        }

        // 5. Vytautas Stage 1 Diagnostic Discovery on vague radiator query
        const stage1Rad = evaluateVytautasTurn({
            message: 'Ieškau: „radiatorius“. Ką rekomenduojate išsirinkti ir kokie priedai būtini pilnam sumontavimui?',
            history: [],
        });
        assert.equal(stage1Rad.stage, 'discovery');
        assert.equal(stage1Rad.suggestedProducts.length, 0, 'Stage 1 must not dump random products before diagnosing');
        assert.equal(stage1Rad.systemMap.nodeLabel, 'Radiatorinis šildymas');
        assert.equal(stage1Rad.systemMap.stageLabel, '1/2 Poreikio diagnostika');
        assert.ok(stage1Rad.response.includes('Girdžiu.'));
        assert.ok(stage1Rad.response.includes('350 mm, 500 mm, 600 mm'));
        assert.ok(!/grindinio šildymo kolektori/i.test(stage1Rad.response), 'Must never ask about underfloor manifolds on radiator query');
        assert.ok(stage1Rad.quickReplies.length >= 3);

        // 6. Vytautas Stage 2 Recommendation when user answers diagnostic question
        const stage2Rad = evaluateVytautasTurn({
            message: 'Šoninis pajungimas DN15 (1/2") – reikia vožtuvo ir termostatinės galvos 18 m² kambariui',
            history: [{ role: 'user', content: 'radiatorius' }],
        });
        assert.equal(stage2Rad.stage, 'recommendation');
        assert.equal(stage2Rad.systemMap.stageLabel, '2/2 Tikslinis mazgo parinkimas');
        assert.ok(stage2Rad.suggestedProducts.length >= 3);
        for (const card of stage2Rad.suggestedProducts) {
            assert.ok(card.imageUrl?.startsWith('/images/products/') && card.imageUrl.endsWith('.webp'));
            assert.ok(card.brandLogoUrl?.startsWith('/images/brands/') && card.brandLogoUrl.endsWith('.svg'));
        }

        // 7. Echo stripping removes raw UI button echo
        const cleaned = stripRawUiEchoFromResponse(
            'Girdžiu. Matau Jūsų paiešką („radiatorius“) ir pasirinktą variantą („Paieška: radiatorius (Ieškau: radiatorius. Ką rekomenduojate išsirinkti ir kokie priedai būtini pilnam sumontavimui?)“).',
        );
        assert.ok(!cleaned.includes('ir pasirinktą variantą („Paieška:'));

        const normalizedCards = normalizeVytautasCardImages([
            {
                id: 'p1',
                sku: '0382-02.000',
                name: 'IMI Heimeier Vekolux DN15',
                price: 34.5,
                url: '/products/p1',
                image: '/suradai/images/products/0382-02.000.webp',
                imageUrl: '/suradai/images/products/0382-02.000.webp',
                brandName: 'IMI Heimeier',
                brandLogoUrl: '/suradai/images/brands/imi-heimeier.svg',
            },
        ]);
        assert.equal(normalizedCards[0].imageUrl, '/images/products/0382-02.000.webp');
        assert.equal(normalizedCards[0].brandLogoUrl, '/images/brands/imi-heimeier.svg');
    });

    it('8) W69-A1 & W74-A1: zero Gilės Inžinerija direct contacts or legacy info@suradai.lt (leaving only info@fill.lt and FILL.LT branding), and brand cards on page.tsx have overflow-hidden and non-overflowing badge layout', async () => {
        const { readdirSync, statSync } = await import('node:fs');

        function collectFiles(dir: string): string[] {
            const entries = readdirSync(dir);
            const files: string[] = [];
            for (const entry of entries) {
                const full = join(dir, entry);
                const st = statSync(full);
                if (st.isDirectory()) {
                    files.push(...collectFiles(full));
                } else if (/\.(ts|tsx|json)$/.test(entry)) {
                    files.push(full);
                }
            }
            return files;
        }

        const allFiles = [...collectFiles(SRC_DIR), ...collectFiles(MESSAGES_DIR)];
        const forbiddenContactPatterns = [
            /gilesinzinerija\.lt/i,
            /gilesinzinerija\.com/i,
            /darius@/i,
            /vidas@/i,
            /parduotuve@/i,
            /info@giles/i,
            /(?<![a-zA-ZąčęėįšųūžĄČĘĖĮŠŲŪŽ])Darius(?![a-zA-ZąčęėįšųūžĄČĘĖĮŠŲŪŽ])/,
            /(?<![a-zA-ZąčęėįšųūžĄČĘĖĮŠŲŪŽ])Vidas(?![a-zA-ZąčęėįšųūžĄČĘĖĮŠŲŪŽ])/,
            /693\s*97098/,
            /620\s*21229/,
            /656\s*75575/,
            /600\s*00000/,
            /208164/,
            /Savanorių\s+pr/i,
            /Žirmūnų\s+g\.\s*68/i,
            /uzklausa@suradai\.lt/i,
            /pagalba@suradai\.lt/i,
            /info@suradai\.lt/i,
        ];

        const violations: string[] = [];
        for (const file of allFiles) {
            const text = readFileSync(file, 'utf8');
            for (const rx of forbiddenContactPatterns) {
                if (rx.test(text)) {
                    violations.push(`${file.replace(APP_ROOT + '/', '')} matched ${rx}`);
                }
            }
        }
        assert.deepEqual(
            violations,
            [],
            `Expected 0 forbidden contact matches across src/ and messages/, found:\n${violations.join('\n')}`,
        );

        const engClientSrc = readFileSync(
            join(SRC_DIR, 'components/conversion/engineering-services-client.tsx'),
            'utf8',
        );
        assert.ok(
            engClientSrc.includes('info@fill.lt'),
            'engineering-services-client.tsx must show info@fill.lt as the single contact email',
        );
        assert.ok(
            engClientSrc.includes('FILL.LT'),
            'engineering-services-client.tsx must show FILL.LT branding',
        );

        const navbarSrc = readFileSync(join(SRC_DIR, 'components/navbar.tsx'), 'utf8');
        const footerSrc = readFileSync(join(SRC_DIR, 'components/footer.tsx'), 'utf8');
        assert.ok(navbarSrc.includes('FILL.LT'), 'navbar.tsx must display FILL.LT branding');
        assert.ok(footerSrc.includes('FILL.LT'), 'footer.tsx must display FILL.LT branding');
        assert.ok(footerSrc.includes('info@fill.lt'), 'footer.tsx must display info@fill.lt');

        const homePageSrc = readFileSync(join(SRC_DIR, 'app/[locale]/page.tsx'), 'utf8');
        assert.ok(
            homePageSrc.includes('Lietuva · Katilai ir ŠVOK įranga'),
            'First brand card (Gilės Inžinerija) on page.tsx must show "Lietuva · Katilai ir ŠVOK įranga"',
        );
        assert.ok(
            !homePageSrc.includes('Savanorių pr. 191A'),
            'page.tsx must not contain Savanorių pr. 191A',
        );

        // Verify both the first brand card and mapped BRAND_SHOWCASE_ITEMS cards have overflow-hidden and stacked/contained header layout
        const brandSectionIdx = homePageSrc.indexOf('Oficialūs Gilės Inžinerijos ir Europos gamintojai');
        assert.ok(brandSectionIdx !== -1, 'Brand showcase section must exist on page.tsx');
        const brandSectionSlice = homePageSrc.slice(brandSectionIdx, brandSectionIdx + 2600);
        const overflowHiddenMatches = brandSectionSlice.match(/overflow-hidden/g) || [];
        assert.ok(
            overflowHiddenMatches.length >= 2,
            `Both Gilės Inžinerija card and BRAND_SHOWCASE_ITEMS cards must include overflow-hidden (found ${overflowHiddenMatches.length})`,
        );
        assert.match(
            brandSectionSlice,
            /flex-col items-start/,
            'Brand card header must stack/contain logo and pozicijos badge without horizontal overflow',
        );
    });

    it('9) W70-A1: zero 2 595 / 5 822 / 302620907 / EGIP.lt / UAB „Gilės inžinerija“ leaks across src/ and messages/, all 20+ brands in catalog-listing & products/page.tsx without duplicate brand text, 12-brand homepage grid, and hover-zoom + image-zoom-lightbox modal on /paketai and /inzinerija', async () => {
        const { readdirSync, statSync } = await import('node:fs');

        function collectFiles(dir: string): string[] {
            const entries = readdirSync(dir);
            const files: string[] = [];
            for (const entry of entries) {
                const full = join(dir, entry);
                const st = statSync(full);
                if (st.isDirectory()) {
                    files.push(...collectFiles(full));
                } else if (/\.(ts|tsx|json)$/.test(entry)) {
                    files.push(full);
                }
            }
            return files;
        }

        const allFiles = [...collectFiles(SRC_DIR), ...collectFiles(MESSAGES_DIR)];
        const forbiddenW70Patterns = [
            /2\s*595/,
            /2,595/,
            /2595/,
            /5\s*822/,
            /5,822/,
            /5822/,
            /302620907/,
            /egip\.lt/i,
            /UAB\s*[„"“]?Gilės/i,
            /UAB\s*`Gilės/i,
            /Atrinkti Danfoss, IMI Heimeier, IMI Pneumatex, IMI TA ir Ferroli pagrindiniai mazgai/,
        ];

        const w70Violations: string[] = [];
        for (const file of allFiles) {
            const text = readFileSync(file, 'utf8');
            for (const rx of forbiddenW70Patterns) {
                if (rx.test(text)) {
                    w70Violations.push(`${file.replace(APP_ROOT + '/', '')} matched ${rx}`);
                }
            }
        }
        assert.deepEqual(
            w70Violations,
            [],
            `Expected 0 W70 forbidden count/supplier matches across src/ and messages/, found:\n${w70Violations.join('\n')}`,
        );

        // Verify popular-products.tsx shows 6 337 prekės and updated multi-brand subtitle
        const popularSrc = readFileSync(join(SRC_DIR, 'components/popular-products.tsx'), 'utf8');
        assert.ok(
            popularSrc.includes('Visas katalogas (6 337 prekės)'),
            'popular-products.tsx must show "Visas katalogas (6 337 prekės)"',
        );
        assert.ok(
            popularSrc.includes('Atrinkti Gilės Inžinerija, Comisa, Centrometal, Dražice, Viessmann, Wilo, Danfoss ir IMI pagrindiniai mazgai'),
            'popular-products.tsx must show updated flagship brand subtitle',
        );

        // Verify catalog-listing.ts exposes all 20+ brands with Gilės Inžinerija pinned first
        const { CATALOG_ACTIVE_BRAND_DIRECTORY, toBrandSlug } = await import('../src/lib/catalog-listing');
        assert.ok(Array.isArray(CATALOG_ACTIVE_BRAND_DIRECTORY), 'CATALOG_ACTIVE_BRAND_DIRECTORY must be exported');
        assert.ok(CATALOG_ACTIVE_BRAND_DIRECTORY.length >= 22, 'Must include at least 22 active brands');
        assert.equal(CATALOG_ACTIVE_BRAND_DIRECTORY[0].name, 'Gilės Inžinerija', 'Gilės Inžinerija must be pinned first');
        assert.equal(CATALOG_ACTIVE_BRAND_DIRECTORY[0].slug, 'giles-inzinerija');
        assert.equal(toBrandSlug('Gilės Inžinerija'), 'giles-inzinerija');
        assert.equal(toBrandSlug('Dražice'), 'drazice');

        const requiredBrands = [
            'Gilės Inžinerija',
            'Comisa',
            'Centrometal',
            'Viessmann',
            'Wilo',
            'Dražice',
            'SANHA',
            'Watts',
            'FV-Plast',
            'Wavin',
            'Danfoss',
            'IMI Heimeier',
            'IMI Pneumatex',
            'IMI TA',
            'Ferroli',
        ];
        for (const reqBrand of requiredBrands) {
            assert.ok(
                CATALOG_ACTIVE_BRAND_DIRECTORY.some((b: { name: string }) => b.name === reqBrand),
                `CATALOG_ACTIVE_BRAND_DIRECTORY missing ${reqBrand}`,
            );
        }

        // Verify products/page.tsx and filter-drawer.tsx use decorative alt="" on brand icon next to text label so "Danfoss Danfoss" never occurs
        const productsPageSrc = readFileSync(join(SRC_DIR, 'app/[locale]/products/page.tsx'), 'utf8');
        assert.ok(
            productsPageSrc.includes('brandsList.map'),
            'products/page.tsx must render all brands from brandsList in Filtruoti pagal gamintoją bar',
        );
        assert.ok(
            !productsPageSrc.includes('alt={bItem.name}'),
            'products/page.tsx must not set alt={bItem.name} next to visible brand name text',
        );

        const filterDrawerSrc = readFileSync(join(SRC_DIR, 'components/filter-drawer.tsx'), 'utf8');
        assert.ok(
            !filterDrawerSrc.includes('alt={b.name}'),
            'filter-drawer.tsx must not set alt={b.name} next to visible brand name text',
        );

        // Verify BRAND_SHOWCASE_ITEMS has the 11 European brands (+ Gilės Inžinerija card = 12 in 6-col grid on page.tsx)
        const { BRAND_SHOWCASE_ITEMS } = await import('../src/lib/v3-description');
        assert.equal(BRAND_SHOWCASE_ITEMS.length, 11, 'BRAND_SHOWCASE_ITEMS must have 11 brands (+ Gilės Inžinerija = 12 on homepage)');

        // Verify hover-zoom and interactive image-zoom-lightbox modal in system-packages-client.tsx & engineering-services-client.tsx
        const pkgClientSrc = readFileSync(
            join(SRC_DIR, 'components/conversion/system-packages-client.tsx'),
            'utf8',
        );
        const engClientSrc = readFileSync(
            join(SRC_DIR, 'components/conversion/engineering-services-client.tsx'),
            'utf8',
        );
        assert.match(pkgClientSrc, /group-hover:scale-110/);
        assert.match(pkgClientSrc, /cursor-zoom-in/);
        assert.match(pkgClientSrc, /data-testid="image-zoom-lightbox"/);
        assert.match(engClientSrc, /group-hover:scale-110/);
        assert.match(engClientSrc, /cursor-zoom-in/);
        assert.match(engClientSrc, /data-testid="image-zoom-lightbox"/);
    });

    it('10) W71-A1: zero <input type="tel"> in lead forms (tik El. paštas), exact data-testid attributes on package/service image zoom & lightbox close, and ui_slop_meter.py typography/layout/hero rules satisfied', () => {
        const engClientSrc = readFileSync(
            join(SRC_DIR, 'components/conversion/engineering-services-client.tsx'),
            'utf8',
        );
        const pkgClientSrc = readFileSync(
            join(SRC_DIR, 'components/conversion/system-packages-client.tsx'),
            'utf8',
        );
        const calcSrc = readFileSync(
            join(SRC_DIR, 'components/conversion/heating-system-calculator.tsx'),
            'utf8',
        );
        const vytautasWidgetSrc = readFileSync(
            join(SRC_DIR, 'components/vytautas-assistant-widget.tsx'),
            'utf8',
        );
        const contactPageSrc = readFileSync(
            join(SRC_DIR, 'app/[locale]/contact/page.tsx'),
            'utf8',
        );
        const engLeadRouteSrc = readFileSync(
            join(SRC_DIR, 'app/api/engineering-lead/route.ts'),
            'utf8',
        );

        // Defect 1: zero <input type="tel"> in lead forms, email-only ("tik El. paštas")
        assert.ok(!engClientSrc.includes('type="tel"'), 'engineering-services-client.tsx must not contain type="tel"');
        assert.ok(!pkgClientSrc.includes('type="tel"'), 'system-packages-client.tsx must not contain type="tel"');
        assert.ok(!calcSrc.includes('type="tel"'), 'heating-system-calculator.tsx must not contain type="tel"');
        assert.ok(!vytautasWidgetSrc.includes('type="tel"'), 'vytautas-assistant-widget.tsx must not contain type="tel"');
        assert.ok(!contactPageSrc.includes('type="tel"'), 'contact/page.tsx must not contain type="tel"');
        assert.ok(engClientSrc.includes('tik El. paštas'), 'engineering-services-client.tsx must state tik El. paštas');
        assert.ok(pkgClientSrc.includes('tik El. paštas'), 'system-packages-client.tsx must state tik El. paštas');

        const emailOnlyLead = validateEngineeringLeadPayload({
            name: 'Jonas Kazlauskas',
            email: 'jonas@example.lt',
            city: 'Vilnius',
            serviceType: 'Katilinių ir granulių degiklių montavimas iki rakto',
        });
        assert.equal(emailOnlyLead.ok, true, 'Email-only lead without phone must be valid');
        if (emailOnlyLead.ok) {
            assert.equal(emailOnlyLead.data.phone, '');
            assert.equal(emailOnlyLead.data.email, 'jonas@example.lt');
        }
        assert.match(engLeadRouteSrc, /customerEmail:\s*data\.email/);

        // Defect 2: exact data-testid attributes on package/service image zoom & lightbox close
        assert.match(pkgClientSrc, /data-testid=\{`package-image-zoom-\$\{pkg\.id\}`\}/);
        assert.match(pkgClientSrc, /data-testid="image-zoom-lightbox-close"/);
        assert.match(engClientSrc, /data-testid=\{`service-image-zoom-\$\{svc\.id\}`\}/);
        assert.match(engClientSrc, /data-testid="image-zoom-lightbox-close"/);

        // Defect 3: globals.css typography rules & zero text-[10px]/text-[11px] on audited surfaces
        const globalsCss = readFileSync(join(SRC_DIR, 'app/globals.css'), 'utf8');
        assert.match(globalsCss, /text-wrap:\s*balance/);
        assert.match(globalsCss, /text-wrap:\s*pretty/);
        assert.match(globalsCss, /max-width:\s*70ch/);

        const auditedTinyTextFiles = [
            'app/[locale]/page.tsx',
            'components/home-hero.tsx',
            'components/popular-products.tsx',
            'app/[locale]/products/page.tsx',
            'components/conversion/system-packages-client.tsx',
            'components/conversion/engineering-services-client.tsx',
            'components/category-tabs.tsx',
            'components/product-card.tsx',
        ];
        for (const rel of auditedTinyTextFiles) {
            const content = readFileSync(join(SRC_DIR, rel), 'utf8');
            assert.ok(!content.includes('text-[10px]'), `${rel} must not contain text-[10px]`);
            assert.ok(!content.includes('text-[11px]'), `${rel} must not contain text-[11px]`);
        }
    });

    it('11) W75-A1: Mobile Product Card Price/CTA Stacking, Compact Hero with 4 Visual Category Cards, Category Alias Resolution, 6-Section Homepage Order, Responsive Comparison Cards, and Inline Mobile Symptom Diagnostics Accordion', async () => {
        const popularSrc = readFileSync(join(SRC_DIR, 'components/popular-products.tsx'), 'utf8');
        const cardSrc = readFileSync(join(SRC_DIR, 'components/product-card.tsx'), 'utf8');
        const heroSrc = readFileSync(join(SRC_DIR, 'components/home-hero.tsx'), 'utf8');
        const pageSrc = readFileSync(join(SRC_DIR, 'app/[locale]/page.tsx'), 'utf8');
        const diagSrc = readFileSync(join(SRC_DIR, 'components/symptom-diagnostic-finder.tsx'), 'utf8');
        const palygHubSrc = readFileSync(join(SRC_DIR, 'app/[locale]/palyginimai/page.tsx'), 'utf8');
        const palygSlugSrc = readFileSync(join(SRC_DIR, 'app/[locale]/palyginimai/[slug]/page.tsx'), 'utf8');
        const pdpSrc = readFileSync(join(SRC_DIR, 'app/[locale]/products/[id]/page.tsx'), 'utf8');

        // 1. Mobile Product Card price/CTA stacking & un-nested <dl>
        assert.match(popularSrc, /flex-col\s+sm:flex-row/);
        assert.match(popularSrc, /w-full\s+sm:w-auto\s+min-h-\[38px\]/);
        assert.ok(!popularSrc.includes('dl className="rounded-xs border'), 'popular-products.tsx must flatten <dl> border to avoid nested-cards');

        assert.match(cardSrc, /flex-col\s+sm:flex-row/);
        assert.match(cardSrc, /w-full\s+sm:w-auto\s+min-h-\[38px\]/);
        assert.ok(!cardSrc.includes('dl className="rounded-xs border'), 'product-card.tsx must flatten <dl> border to avoid nested-cards');

        // 2. Hero 4 visual category cards & HydronicCutawayExplorer export
        const { HERO_QUICK_CATEGORIES, HydronicCutawayExplorer } = await import('../src/components/home-hero');
        assert.equal(typeof HydronicCutawayExplorer, 'function', 'HydronicCutawayExplorer must be exported from home-hero.tsx');
        assert.ok(Array.isArray(HERO_QUICK_CATEGORIES) && HERO_QUICK_CATEGORIES.length === 4, 'HERO_QUICK_CATEGORIES must have 4 visual category cards');
        assert.ok(heroSrc.includes('Katilai ir degikliai'));
        assert.ok(heroSrc.includes('Grindinis šildymas'));
        assert.ok(heroSrc.includes('Termostatika ir vožtuvai'));
        assert.ok(!heroSrc.includes('Greitas gamintojų ir sistemų pasirinkimas'), 'HomeHero must not render the 23-pill wall');

        // 3. Category aliases in catalog-listing.ts
        const { resolveCategoryAliasNames } = await import('../src/lib/catalog-listing');
        assert.ok(resolveCategoryAliasNames('boilers-radiators').includes('Šildymo katilai ir krosnelės'));
        assert.ok(resolveCategoryAliasNames('collectors').includes('Grindinis šildymas ir kolektoriai'));
        assert.ok(resolveCategoryAliasNames('thermostatic-Calling').includes('Termostatinės galvutės ir vožtuvai'));
        assert.ok(resolveCategoryAliasNames('thermostatic-valves').includes('Termostatinės galvutės ir vožtuvai'));

        // 4. Homepage 6-section order
        const heroPos = pageSrc.indexOf('<HomeHero');
        const popularPos = pageSrc.indexOf('<PopularProducts');
        const packagesPos = pageSrc.indexOf('GILES_SYSTEM_PACKAGES.map');
        const diagPos = pageSrc.indexOf('<SymptomDiagnosticFinder');
        const wizardsPos = pageSrc.indexOf('5 interaktyvūs parinkimo vedliai');
        const brandsPos = pageSrc.indexOf('Oficialūs Gilės Inžinerijos ir Europos gamintojai');
        assert.ok(heroPos !== -1 && popularPos > heroPos, 'Section 2 PopularProducts must follow Section 1 HomeHero');
        assert.ok(packagesPos > popularPos, 'Section 3 Sisteminiai paketai + Skaičiuoklė must follow Section 2 PopularProducts');
        assert.ok(diagPos > packagesPos, 'Section 4 SymptomDiagnosticFinder must follow Section 3 Sisteminiai paketai');
        assert.ok(wizardsPos > diagPos, 'Section 5 Techninio pasirinkimo matrica / 5 vedliai must follow Section 4 SymptomDiagnosticFinder');
        assert.ok(brandsPos > wizardsPos, 'Section 6 Oficialūs gamintojai must follow Section 5');

        // 5. SymptomDiagnosticFinder inline mobile accordion & tracking fix
        assert.ok(!diagSrc.includes('font-bold text-[var(--text-primary)] tracking-tight"'), 'symptom-diagnostic-heading must not use unconditional tracking-tight on mobile');
        assert.match(diagSrc, /md:tracking-tight/);
        assert.match(diagSrc, /showAllMobile/);
        assert.match(diagSrc, /lg:hidden/);

        // 6. Responsive table-to-card pattern on palyginimai & PDP
        assert.match(palygHubSrc, /data-testid="mobile-comparison-cards"/);
        assert.match(palygSlugSrc, /data-testid="mobile-comparison-cards"/);
        assert.match(pdpSrc, /data-testid="mobile-comparison-cards"/);
    });

    it('12) W75-A2: Top-of-the-Tops B2B Engineering Faceted Filter System (280px Left Faceted Sidebar, Live 27-Brand Search, Top-8 Toggle, Active Filter Chips, and Upgraded Mobile Slide-Over Filter Drawer)', async () => {
        const facetedPath = join(SRC_DIR, 'components/catalog-faceted-filters.tsx');
        assert.equal(existsSync(facetedPath), true, 'catalog-faceted-filters.tsx must exist');

        const facetedSrc = readFileSync(facetedPath, 'utf8');
        const productsPageSrc = readFileSync(join(SRC_DIR, 'app/[locale]/products/page.tsx'), 'utf8');
        const filterDrawerSrc = readFileSync(join(SRC_DIR, 'components/filter-drawer.tsx'), 'utf8');
        const categoryTabsSrc = readFileSync(join(SRC_DIR, 'components/category-tabs.tsx'), 'utf8');

        // 1. Desktop 280px Left Faceted Filter Sidebar & data-testids
        assert.match(productsPageSrc, /lg:grid\s+lg:grid-cols-\[280px_minmax\(0,1fr\)\]\s+lg:gap-7\s+lg:items-start/);
        assert.match(productsPageSrc, /<CatalogFacetedFilters/);
        assert.match(productsPageSrc, /data-testid="active-filter-bar"/);
        assert.match(facetedSrc, /data-testid="catalog-filter-sidebar"/);
        assert.match(facetedSrc, /data-testid="brand-facet-search"/);
        assert.match(facetedSrc, /placeholder="Ieškoti iš 28 gamintojų\.\.\."/);
        assert.match(facetedSrc, /data-testid="brand-facet-toggle"/);
        assert.ok(facetedSrc.includes('Inžineriniai filtrai'));
        assert.ok(facetedSrc.includes('Sistemos kategorija'));
        assert.ok(facetedSrc.includes('Mazgo potipis'));
        assert.ok(facetedSrc.includes('Techninis parametras'));
        assert.match(facetedSrc, /rel="nofollow"/);
        assert.ok(!facetedSrc.includes('alt={b.name}'), 'catalog-faceted-filters.tsx must not duplicate brand name in img alt');
        assert.ok(!facetedSrc.includes('text-[10px]') && !facetedSrc.includes('text-[11px]'), 'catalog-faceted-filters.tsx must have zero sub-12px classes');

        // 2. Live 28-brand search helper behavior (diacritic-insensitive)
        const { filterBrandsByQuery, getVisibleBrandFacetItems } = await import('../src/components/catalog-faceted-filters');
        const { CATALOG_ACTIVE_BRAND_DIRECTORY } = await import('../src/lib/catalog-listing');
        const all28 = CATALOG_ACTIVE_BRAND_DIRECTORY.map((b) => ({
            id: b.id,
            name: b.name,
            slug: b.slug,
            count: b.productCount,
        }));
        assert.equal(filterBrandsByQuery(all28, '').length, 28);
        const gilesMatches = filterBrandsByQuery(all28, 'giles');
        assert.equal(gilesMatches.length, 1);
        assert.equal(gilesMatches[0].name, 'Gilės Inžinerija');
        const haierMatches = filterBrandsByQuery(all28, 'haier');
        assert.equal(haierMatches.length, 1);
        assert.equal(haierMatches[0].name, 'Haier');
        const imiMatches = filterBrandsByQuery(all28, 'imi');
        assert.equal(imiMatches.length, 3);

        // Top 8 pinned by default + active brand always included when collapsed
        const collapsedDefault = getVisibleBrandFacetItems(all28, '', false, undefined);
        assert.equal(collapsedDefault.length, 8);
        const collapsedWithDeepActive = getVisibleBrandFacetItems(all28, '', false, 'ferroli');
        assert.equal(collapsedWithDeepActive.length, 9);
        assert.ok(collapsedWithDeepActive.some((b: { slug?: string }) => b.slug === 'ferroli'));
        const expandedAll = getVisibleBrandFacetItems(all28, '', true, undefined);
        assert.equal(expandedAll.length, 28);

        // 3. Mobile Filter & Sort Bar + Slide-Over Drawer with live 28-brand search
        assert.match(filterDrawerSrc, /data-testid="mobile-filter-drawer-trigger"/);
        assert.match(filterDrawerSrc, /data-testid="mobile-brand-facet-search"/);
        assert.match(filterDrawerSrc, /Ieškoti iš 28 gamintojų\.\.\./);
        assert.match(categoryTabsSrc, /lg:hidden/);
    });

    it('13) W76-A1: ui_slop_meter 5/5 route compliance — zero text_overlap in CatalogFacetedFilters, CookieConsent dialog role/id, and bg-transparent wrapper pattern on above-the-fold cards/tabs', async () => {
        const facetedSrc = readFileSync(join(SRC_DIR, 'components/catalog-faceted-filters.tsx'), 'utf8');
        const cookieSrc = readFileSync(join(SRC_DIR, 'components/CookieConsent.tsx'), 'utf8');
        const heroSrc = readFileSync(join(SRC_DIR, 'components/home-hero.tsx'), 'utf8');
        const searchFormSrc = readFileSync(join(SRC_DIR, 'components/catalog-search-form.tsx'), 'utf8');
        const vytautasSrc = readFileSync(join(SRC_DIR, 'components/vytautas-assistant-widget.tsx'), 'utf8');
        const diagSrc = readFileSync(join(SRC_DIR, 'components/symptom-diagnostic-finder.tsx'), 'utf8');

        // 1. FacetRowLink uses formatFacetLabel + break-words leading-snug pr-2 mr-1.5 instead of truncate block
        assert.ok(!facetedSrc.includes('<span className="truncate block">{label}</span>'), 'FacetRowLink must not use unwrapped truncate block next to count badge');
        assert.match(facetedSrc, /break-words\s+leading-snug\s+pr-2\s+mr-1\.5/);
        const { formatFacetLabel } = await import('../src/components/catalog-faceted-filters');
        assert.equal(typeof formatFacetLabel, 'function', 'formatFacetLabel must be exported from catalog-faceted-filters.tsx');
        for (const rawLabel of [
            'Termostatinės galvutės ir vožtuvai',
            'Balansiniai ir reguliavimo vožtuvai',
            'Plėtimosi indai ir slėgio palaikymas',
            'Grindinis šildymas ir kolektoriai',
        ]) {
            const formatted = formatFacetLabel(rawLabel);
            assert.ok(formatted.length <= 24, `Formatted facet label "${formatted}" must be <= 24 chars to prevent DOM Range overlap`);
        }

        // 2. CookieConsent has id="cookie-consent-banner" and role="dialog"
        assert.match(cookieSrc, /id="cookie-consent-banner"/);
        assert.match(cookieSrc, /role="dialog"/);

        // 3. Above-the-fold cards, tabs, and secondary triggers use bg-transparent on the <Link>/<button> node
        assert.match(heroSrc, /data-testid="hero-quick-categories"[\s\S]*?bg-transparent/);
        assert.match(searchFormSrc, /onClick=\{handleAskVytautas\}[\s\S]*?bg-transparent/);
        assert.match(vytautasSrc, /aria-label=\{`Atidaryti konsultantą \$\{agentName\}`\}[\s\S]*?bg-transparent/);
        assert.match(diagSrc, /role="tab"[\s\S]*?bg-transparent/);
    });

    it('14) W77-A1: SymptomDiagnosticFinder self-contained mobile accordion (< lg:) with zero h-full empty-box stretching, <=24px header-to-text flow, and 2-column desktop master-detail (>= lg:)', () => {
        const diagSrc = readFileSync(join(SRC_DIR, 'components/symptom-diagnostic-finder.tsx'), 'utf8');

        // 1. Must NOT put h-full on the symptom tab <button> or its inner <div> (root cause of 1530px empty white box on mobile)
        assert.ok(
            !diagSrc.includes('w-full h-full text-left bg-transparent'),
            'symptom tab <button> must not use h-full which stretches to 1530px when mobile-inline-diagnostic-panel opens',
        );
        assert.ok(
            !diagSrc.includes('w-full h-full rounded-md border'),
            'symptom tab inner <div> must not use h-full',
        );

        // 2. Desktop 2-column master-detail layout (lg:col-span-5 list + hidden lg:block lg:col-span-7 lg:sticky lg:top-24 detail panel)
        assert.match(diagSrc, /lg:grid\s+lg:grid-cols-12\s+lg:gap-6\s+items-start/);
        assert.match(diagSrc, /lg:col-span-5/);
        assert.match(diagSrc, /hidden\s+lg:block\s+lg:col-span-7\s+lg:sticky\s+lg:top-24/);

        // 3. Self-contained mobile accordion card with structured sections & scroll-mt-24 / 88px sticky header offset
        assert.match(diagSrc, /data-testid="mobile-inline-diagnostic-panel"/);
        assert.match(diagSrc, /rounded-xl\s+border\s+transition-colors/);
        assert.match(diagSrc, /scroll-mt-24/);
        assert.match(diagSrc, /window\.scrollY\s*\+\s*rect\.top\s*-\s*88/);
        assert.ok(diagSrc.includes('Diagnostikos atsakymas'));
        assert.ok(diagSrc.includes('1. Inžinerinė priežastis (Kodėl taip nutinka)'));
        assert.ok(diagSrc.includes('2. Patikra vietoje per 5 min.'));
        assert.ok(diagSrc.includes('3. Rekomenduojamas techninis sprendimas ir mazgai'));
    });

    it('15) W77-A2: Compact 5-section desktop filter sidebar with internal viewport scroll (max-h-[calc(100vh-5.5rem)] overflow-y-auto overscroll-contain) and all 5 sections open by default', async () => {
        const facetedSrc = readFileSync(join(SRC_DIR, 'components/catalog-faceted-filters.tsx'), 'utf8');

        // 1. Sticky sidebar has internal scroll container so bottom is never unreachable
        assert.match(facetedSrc, /max-h-\[calc\(100vh-5\.5rem\)\]/);
        assert.match(facetedSrc, /overflow-y-auto/);
        assert.match(facetedSrc, /overscroll-contain/);

        // 2. All 5 facet sections are open by default (categories, brands, subtypes, specs, price)
        assert.match(facetedSrc, /categories:\s*true/);
        assert.match(facetedSrc, /brands:\s*true/);
        assert.match(facetedSrc, /subtypes:\s*true/);
        assert.match(facetedSrc, /specs:\s*true/);
        assert.match(facetedSrc, /price:\s*true/);

        // 3. Top-4 category & Top-4 brand compaction + Top-6 subtype helper exports
        assert.match(facetedSrc, /data-testid="category-facet-toggle"/);
        assert.match(facetedSrc, /data-testid="brand-facet-toggle"/);
        assert.ok(facetedSrc.includes('Kaina ↑ pigiausi'));
        assert.ok(facetedSrc.includes('Kaina ↓ brangiausi'));
        assert.ok(facetedSrc.includes('Su kaina sandėlyje'));
        assert.ok(facetedSrc.includes('Kaina ir likutis (€)'));
        assert.ok(facetedSrc.includes("label: 'Iki 50'"));
        assert.ok(facetedSrc.includes("label: '50–200'"));
        assert.ok(facetedSrc.includes("label: '200–1000'"));
        assert.ok(facetedSrc.includes("label: 'Nuo 1000'"));
        assert.ok(!facetedSrc.includes("label: 'Iki 50 €'"));
        assert.ok(!facetedSrc.includes("label: '50–200 €'"));
        assert.ok(!facetedSrc.includes("label: '200–1000 €'"));
        assert.ok(!facetedSrc.includes("label: 'Nuo 1000 €'"));

        const {
            getVisibleCategoryFacetItems,
            getVisibleBrandFacetItems,
            getVisibleSubtypeFacetItems,
        } = await import('../src/components/catalog-faceted-filters');
        const { CATALOG_ACTIVE_BRAND_DIRECTORY, CATALOG_SUBTYPE_OPTIONS } = await import(
            '../src/lib/catalog-listing'
        );

        const sampleCategories = [
            { id: 'c1', name: 'Grindinis šildymas ir kolektoriai', slug: 'c1', productCount: 1120 },
            { id: 'c2', name: 'Plėtimosi indai ir slėgio palaikymas', slug: 'c2', productCount: 753 },
            { id: 'c3', name: 'Balansiniai ir reguliavimo vožtuvai', slug: 'c3', productCount: 689 },
            { id: 'c4', name: 'Termostatinės galvutės ir vožtuvai', slug: 'c4', productCount: 410 },
            { id: 'c5', name: 'Šildymo katilai ir krosnelės', slug: 'c5', productCount: 420 },
            { id: 'c6', name: 'Oro atskyrikliai ir nuorintuvai', slug: 'c6', productCount: 310 },
        ];
        assert.equal(getVisibleCategoryFacetItems(sampleCategories, false, undefined, 4).length, 4);
        assert.equal(getVisibleCategoryFacetItems(sampleCategories, false, 'c6', 4).length, 5);
        assert.equal(getVisibleCategoryFacetItems(sampleCategories, true, undefined, 4).length, 6);

        const all27 = CATALOG_ACTIVE_BRAND_DIRECTORY.map((b) => ({
            id: b.id,
            name: b.name,
            slug: b.slug,
            count: b.productCount,
        }));
        assert.equal(getVisibleBrandFacetItems(all27, '', false, undefined, 4).length, 4);
        assert.equal(getVisibleBrandFacetItems(all27, '', false, 'ferroli', 4).length, 5);

        const topSubtypes = getVisibleSubtypeFacetItems(CATALOG_SUBTYPE_OPTIONS, false, undefined, 6);
        assert.equal(topSubtypes.length, 6);
        const topSubtypesWithDeepActive = getVisibleSubtypeFacetItems(
            CATALOG_SUBTYPE_OPTIONS,
            false,
            'radiatoriai',
            6,
        );
        assert.equal(topSubtypesWithDeepActive.length, 7);
    });

    it('16) W79-A1: PDP ProductPurchase.add() calls openCart() right after addItem(...) and Navbar subscribes reactively to state.items.reduce(...)', () => {
        const purchaseSrc = readFileSync(
            join(SRC_DIR, 'components/conversion/product-purchase.tsx'),
            'utf8',
        );
        const navbarSrc = readFileSync(join(SRC_DIR, 'components/navbar.tsx'), 'utf8');

        assert.match(
            purchaseSrc,
            /const\s*\{\s*addItem\s*,\s*openCart\s*\}\s*=\s*useCartStore\(\);/,
            'product-purchase.tsx must destructure { addItem, openCart } from useCartStore()',
        );
        assert.match(
            purchaseSrc,
            /addItem\(\{[\s\S]*?\}\);\s*openCart\(\);/,
            'product-purchase.tsx must call openCart() inside add() right after addItem(...)',
        );

        assert.ok(
            !navbarSrc.includes('useCartStore((state) => state.getItemCount)'),
            'navbar.tsx must not subscribe to stable function reference state.getItemCount',
        );
        assert.match(
            navbarSrc,
            /const\s+itemCount\s*=\s*useCartStore\(\(state\)\s*=>\s*state\.items\.reduce\(\(sum,\s*item\)\s*=>\s*sum\s*\+\s*item\.quantity,\s*0\)\);/,
            'navbar.tsx must subscribe reactively to state.items.reduce((sum, item) => sum + item.quantity, 0)',
        );
    });

    it('17) W80-A1: Haier brand logo (haier.svg & brand-logos.ts), 17 Gorenje 2026 & Haier 2026 studio .webp images, 28 brands, and 6 337 catalog count', async () => {
        const { BRAND_LOGO_PATHS, resolveBrandLogo } = await import('../src/lib/brand-logos');
        const { CATALOG_ACTIVE_BRAND_DIRECTORY, resolveCategoryAliasNames } = await import('../src/lib/catalog-listing');

        assert.equal(BRAND_LOGO_PATHS.haier, '/images/brands/haier.svg');
        assert.equal(resolveBrandLogo('Haier').logoPath, '/images/brands/haier.svg');
        assert.equal(
            existsSync(join(APP_ROOT, 'public/images/brands/haier.svg')),
            true,
            'public/images/brands/haier.svg must exist',
        );
        assert.equal(
            existsSync(join(APP_ROOT, 'public/images/products/gorenje-2026-zv-25-s.webp')),
            true,
            'gorenje-2026-zv-25-s.webp must exist',
        );
        assert.equal(
            existsSync(join(APP_ROOT, 'public/images/products/haier-2026-au082fycra-hw.webp')),
            true,
            'haier-2026-au082fycra-hw.webp must exist',
        );
        assert.equal(CATALOG_ACTIVE_BRAND_DIRECTORY.length, 28, 'Must have 28 active brands including Haier');
        assert.ok(
            CATALOG_ACTIVE_BRAND_DIRECTORY.some((b) => b.slug === 'haier' && b.productCount === 465),
            'Haier must be in CATALOG_ACTIVE_BRAND_DIRECTORY with 465 products',
        );
        assert.ok(
            CATALOG_ACTIVE_BRAND_DIRECTORY.some((b) => b.slug === 'gorenje' && b.productCount === 63),
            'Gorenje must be in CATALOG_ACTIVE_BRAND_DIRECTORY with 63 products',
        );
        assert.ok(
            resolveCategoryAliasNames('expansion-tanks').includes('Akumuliacinės talpos ir boileriai'),
            'expansion-tanks alias must resolve to Akumuliacinės talpos ir boileriai',
        );
    });

    it('18) W80-A2: End-to-End Integration of Haier 2026, Gorenje ZV 2026, and Danfoss/HERZ 2026 across HeatingSystemCalculator, Vytautas AI Consultant & Widget, System Packages, Homepage Brand Grid, Catalog Facets, and Diagnostics/Comparisons', async () => {
        const {
            GILES_SYSTEM_PACKAGES,
            calculateHeatingSystemRecommendation,
        } = await import('../src/lib/giles-packages-data');
        const { BRAND_SHOWCASE_ITEMS } = await import('../src/lib/v3-description');
        const { PINNED_TOP_BRAND_SLUGS } = await import('../src/components/catalog-faceted-filters');
        const { SYMPTOM_DIAGNOSTICS, HVAC_COMPARISON_GUIDES } = await import('../src/lib/hvac-comparisons-data');
        const { retrieveVytautasRagContext } = await import('../src/lib/vytautas-consultant');

        // 1. HeatingSystemCalculator supports heat_pump_air_water, electric_boiler, and heat_pump_air_air
        const hpCalc = calculateHeatingSystemRecommendation({
            areaM2: 140,
            insulationClass: 'a_plus',
            emitterType: 'underfloor',
            heatSource: 'heat_pump_air_water',
            occupants: '3_4',
        });
        assert.ok(hpCalc.recommendedHeatSourceSku?.startsWith('AW') || hpCalc.recommendedHeatSourceSku?.startsWith('AU'));
        assert.ok(hpCalc.recommendedBufferSku?.startsWith('ZV '), `Expected Gorenje ZV buffer tank SKU, got ${hpCalc.recommendedBufferSku}`);
        assert.ok(hpCalc.recommendedBoilerSku === 'HP200M7C-F9' || hpCalc.recommendedBoilerSku === 'HP250M7C-F9' || hpCalc.recommendedBoilerSku === 'OKC200NTR');
        assert.equal(hpCalc.recommendedPackageId, 'pkg-heat-pump-haier');

        const elecCalc = calculateHeatingSystemRecommendation({
            areaM2: 100,
            insulationClass: 'b_c',
            emitterType: 'radiators',
            heatSource: 'electric_boiler',
            occupants: '1_2',
        });
        assert.ok(elecCalc.recommendedHeatSourceSku?.includes('ES'), `Expected Haier ES SKU for electric_boiler, got ${elecCalc.recommendedHeatSourceSku}`);

        const nordicCalc = calculateHeatingSystemRecommendation({
            areaM2: 80,
            insulationClass: 'a_plus',
            emitterType: 'radiators',
            heatSource: 'heat_pump_air_air',
            occupants: '1_2',
        });
        assert.ok(nordicCalc.recommendedHeatSourceModel?.includes('Haier'), `Expected Haier Nordic model, got ${nordicCalc.recommendedHeatSourceModel}`);

        // 2. 7th System Package for Haier R290 + Gorenje ZV 100
        const haierPkg = GILES_SYSTEM_PACKAGES.find((p) => p.id === 'pkg-heat-pump-haier');
        assert.ok(haierPkg, 'GILES_SYSTEM_PACKAGES must include pkg-heat-pump-haier');
        assert.ok(haierPkg.components.some((c) => c.brand === 'Haier'));
        assert.ok(haierPkg.components.some((c) => c.brand === 'Gorenje' && c.sku.startsWith('ZV')));

        // 3. Homepage 12-Brand Grid & Pinned Facets include Haier (465 poz.) and Gorenje (63 poz.)
        assert.ok(BRAND_SHOWCASE_ITEMS.some((b) => b.slug === 'haier' && b.productCountLabel === '465 poz.'));
        assert.ok(BRAND_SHOWCASE_ITEMS.some((b) => b.slug === 'gorenje' && b.productCountLabel === '63 poz.'));
        assert.ok(Array.isArray(PINNED_TOP_BRAND_SLUGS) && PINNED_TOP_BRAND_SLUGS.includes('haier'));

        // 4. Vytautas Assistant Widget quick-prompt button for Haier + Gorenje ZV
        const widgetSrc = readFileSync(join(SRC_DIR, 'components/vytautas-assistant-widget.tsx'), 'utf8');
        assert.ok(
            widgetSrc.includes('Haier šilumos siurblys + Gorenje ZV talpa namui'),
            'vytautas-assistant-widget.tsx must include quick prompt "Haier šilumos siurblys + Gorenje ZV talpa namui"',
        );

        // 5. Vytautas RAG candidate retrieval for Haier & Gorenje ZV
        const haierRag = await retrieveVytautasRagContext('Haier šilumos siurblys oras-vanduo R290 + Gorenje ZV 100 akumuliacinė talpa', []);
        assert.ok(
            haierRag.candidates.some((c) => c.brand === 'Haier'),
            'retrieveVytautasRagContext must return Haier candidates for heat pump query',
        );
        assert.ok(
            haierRag.candidates.some((c) => c.brand === 'Gorenje' && c.sku.startsWith('ZV')),
            'retrieveVytautasRagContext must return Gorenje ZV buffer tank candidates',
        );

        // 6. Diagnostics & Comparisons include Haier Super Aqua R290/R32, Gorenje ZV 50/100, and 2026 Danfoss prices
        const hpDiag = SYMPTOM_DIAGNOSTICS.find((d) => d.id === 'heat-pump-short-cycling-flow');
        assert.ok(hpDiag, 'heat-pump-short-cycling-flow diagnostic card must exist');
        assert.ok(
            hpDiag.causePlain.includes('Haier') || hpDiag.fiveMinFixSteps.join(' ').includes('Gorenje') || hpDiag.recommendedProducts.some((p) => p.sku.startsWith('ZV')),
            'heat-pump-short-cycling-flow must reference Haier / Gorenje ZV buffer tank',
        );
        const allCompText = JSON.stringify(HVAC_COMPARISON_GUIDES);
        assert.ok(allCompText.includes('Haier') && allCompText.includes('ZV 100'), 'HVAC_COMPARISON_GUIDES must reference Haier and Gorenje ZV 100');
    });
});
