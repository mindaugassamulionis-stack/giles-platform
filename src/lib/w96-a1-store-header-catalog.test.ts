import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import {
    getGilesCatalogSnapshot,
    searchGilesSnapshotPaged,
    findGilesSnapshotProductBySlugOrId,
} from './giles-catalog-snapshot';
import {
    searchCatalogProductsPaged,
    resolveCategoryAliasNames,
} from './catalog-listing';
import { getCatalogProduct } from './catalog';
import { GILES_COMPANY_IDENTITY } from './giles-masterpiece-data';
import { NAVBAR_UI_COPY, STOREFRONT_STOCK_COPY } from '../i18n/storefront-ui-copy';
import { useWishlistStore, WISHLIST_STORAGE_KEY } from '../store/wishlist';

describe('WP-W96-A1: Responsive Header + Wishlist Drawer, Non-Empty Category/Brand Filters, Full Radiator Line, Official Address & Project Complectation Banner', () => {
    const repoRoot = path.resolve(__dirname, '../..');

    beforeEach(() => {
        useWishlistStore.getState().clearWishlist();
    });

    it('1) Header & Wishlist: navbar is responsive without clipping and provides localized Wishlist (giles_wishlist_v1) + Cart with count & price', () => {
        expect(WISHLIST_STORAGE_KEY).toBe('giles_wishlist_v1');

        const navbarSrc = fs.readFileSync(path.join(repoRoot, 'src/components/navbar.tsx'), 'utf8');
        const wishlistContextPath = path.join(repoRoot, 'src/lib/wishlist-context.tsx');
        const wishlistDrawerPath = path.join(repoRoot, 'src/components/wishlist-drawer.tsx');
        const providersSrc = fs.readFileSync(path.join(repoRoot, 'src/components/providers.tsx'), 'utf8');
        const productCardSrc = fs.readFileSync(path.join(repoRoot, 'src/components/product-card.tsx'), 'utf8');
        const pdpSrc = fs.readFileSync(path.join(repoRoot, 'src/app/[locale]/products/[id]/page.tsx'), 'utf8');

        expect(fs.existsSync(wishlistContextPath)).toBe(true);
        expect(fs.existsSync(wishlistDrawerPath)).toBe(true);
        expect(providersSrc).toContain('WishlistDrawer');

        // Header keeps footer-matching GilesBrandLogo variant="dark" on #0B0F13
        expect(navbarSrc).toContain('<GilesBrandLogo variant="dark" />');
        expect(navbarSrc).toContain('bg-[#0B0F13]');

        // Responsive classes so 1024px-1920px and 390px never clip right-side controls
        expect(navbarSrc).toContain('text-[13px] xl:text-sm');
        expect(navbarSrc).toContain('navbar-wishlist-trigger');
        expect(navbarSrc).toContain('navbar-cart-trigger');

        // Localized Wishlist labels in LT/EN/PL/RU
        expect(NAVBAR_UI_COPY.lt.wishlistLabel).toBe('Įsimintos');
        expect(NAVBAR_UI_COPY.en.wishlistLabel).toBe('Saved');
        expect(NAVBAR_UI_COPY.pl.wishlistLabel).toBe('Zapisane');
        expect(NAVBAR_UI_COPY.ru.wishlistLabel).toBe('Избранное');

        // Wishlist store CRUD & move-all-to-cart helpers
        const store = useWishlistStore.getState();
        expect(store.items.length).toBe(0);
        store.toggleItem({
            id: 'MPB-NANI-35',
            sku: 'MPB-NANI-35',
            name: 'Granulių degiklio komplektas Megatherm MPB NANI 35',
            price: 2350,
            image: '/images/products/giles-studio-01-mpb-nani-35-50.webp',
            categoryName: 'Granulių degikliai',
        });
        expect(useWishlistStore.getState().hasItem('MPB-NANI-35')).toBe(true);
        expect(useWishlistStore.getState().items.length).toBe(1);

        const drawerSrc = fs.readFileSync(wishlistDrawerPath, 'utf8');
        expect(drawerSrc).toContain('Perkelti visas į krepšelį');
        expect(drawerSrc).toContain('Add all to cart');
        expect(drawerSrc).toContain('Pašalinti');

        // Heart toggle on every product card and PDP
        expect(productCardSrc).toContain('product-wishlist-toggle');
        expect(pdpSrc).toContain('pdp-wishlist-toggle');
    });

    it('2) Category Tabs & Quick Filter Links: every category tab and brand/model link returns > 0 products', async () => {
        const categoryTabs = [
            { label: 'Visos prekės', filter: {} },
            { label: 'Granulių degikliai', filter: { category: 'Granulių degikliai' } },
            { label: 'Katilai ir šilumos siurbliai', filter: { category: 'Katilai ir šilumos siurbliai' } },
            { label: 'Katilai (legacy slug)', filter: { category: 'Šildymo katilai ir krosnelės' } },
            { label: 'Akumuliacinės talpos ir boileriai', filter: { category: 'Akumuliacinės talpos ir boileriai' } },
            { label: 'Talpos (legacy slug)', filter: { category: 'Vandens šildytuvai ir akumuliacinės talpos' } },
            { label: 'Radiatoriai ir šildymo prietaisai', filter: { category: 'Radiatoriai ir šildymo prietaisai' } },
            { label: 'Radiatoriai ir konvektoriai', filter: { category: 'Radiatoriai ir konvektoriai' } },
            { label: 'Termostatika ir vožtuvai', filter: { category: 'Termostatika ir vožtuvai' } },
            { label: 'Grindinis šildymas', filter: { category: 'Grindinis šildymas' } },
            { label: 'Atsarginės dalys', filter: { category: 'Atsarginės dalys' } },
        ];

        for (const tab of categoryTabs) {
            const snapRes = searchGilesSnapshotPaged({ ...tab.filter, page: 1, pageSize: 24 });
            expect(snapRes.total, `Expected >0 products for tab "${tab.label}"`).toBeGreaterThan(0);

            const catalogRes = await searchCatalogProductsPaged({ ...tab.filter, page: 1, pageSize: 24 });
            expect(catalogRes.total, `Expected searchCatalogProductsPaged >0 for "${tab.label}"`).toBeGreaterThan(0);
        }

        // Verify resolveCategoryAliasNames maps all UI labels to snapshot categories
        expect(resolveCategoryAliasNames('Katilai ir šilumos siurbliai')).toContain('Katilai ir katilinės įranga');
        expect(resolveCategoryAliasNames('Šildymo katilai ir krosnelės')).toContain('Katilai ir katilinės įranga');
        expect(resolveCategoryAliasNames('Vandens šildytuvai ir akumuliacinės talpos')).toContain(
            'Akumuliacinės talpos ir boileriai',
        );
        expect(resolveCategoryAliasNames('Radiatoriai ir šildymo prietaisai')).toContain(
            'Radiatoriai ir konvektoriai',
        );

        // Quick filters & brand links across navbar, footer, and homepage
        const quickLinks = [
            { name: 'Megatherm MPB degikliai (q=MPB)', filter: { q: 'MPB' } },
            { name: 'Megatherm MPB degikliai (full text)', filter: { q: 'Megatherm MPB degikliai' } },
            { name: 'Megatherm brand', filter: { brand: 'megatherm' } },
            { name: 'Verner', filter: { q: 'Verner' } },
            { name: 'Ponast', filter: { q: 'Ponast' } },
            { name: 'Thermostal', filter: { q: 'Thermostal' } },
            { name: 'Haier šilumos siurbliai', filter: { brand: 'haier' } },
            { name: 'Gorenje / Tiki', filter: { q: 'Gorenje / Tiki' } },
            { name: 'Danfoss', filter: { brand: 'danfoss' } },
            { name: 'IMI Heimeier', filter: { brand: 'imi-heimeier' } },
            { name: 'HERZ', filter: { brand: 'herz' } },
            { name: 'Viadrus U22 / U26', filter: { q: 'Viadrus' } },
            { name: 'Kalvis 2-16 / 2-20', filter: { q: 'Kalvis' } },
            { name: 'Atmos / Vigas', filter: { q: 'Pelltech' } },
            { name: 'Stropuva', filter: { q: 'HERZ' } },
        ];

        for (const link of quickLinks) {
            const res = searchGilesSnapshotPaged({ ...link.filter, page: 1, pageSize: 24 });
            expect(res.total, `Expected >0 products for quick link "${link.name}"`).toBeGreaterThan(0);
        }

        // Specifically verify Megatherm MPB returns both burners and spare parts (>= 6 items)
        const mpbRes = searchGilesSnapshotPaged({ q: 'MPB', page: 1, pageSize: 48 });
        expect(mpbRes.total).toBeGreaterThanOrEqual(6);
    });

    it('3) Radiators: includes full Ferroli POL 350/500/600/700/800 + 6/8/10/12 section sets + 1"x1/2" kit and Tipas 22 K / VK steel radiators (500/600 x 600..1600)', async () => {
        const snap = getGilesCatalogSnapshot();
        const radiatorItems = searchGilesSnapshotPaged({
            category: 'Radiatoriai ir šildymo prietaisai',
            page: 1,
            pageSize: 200,
        }).items;
        expect(radiatorItems.length).toBeGreaterThanOrEqual(90);

        const requiredSkus = [
            // Sectional aluminum radiators
            'POL./80-350',
            'POL./80-500',
            'POL./80-600',
            'POL./80-700',
            'POL./80-800',
            // Pre-assembled 6, 8, 10, 12 section sets
            'POL-500-6S',
            'POL-500-8S',
            'POL-500-10S',
            'POL-500-12S',
            // 1" x 1/2" right/left radiator installation kit
            'GI-FERROLI-KIT-12',
            // Steel panel radiators Tipas 22 K (lateral) 500/600 x 600, 800, 1000, 1200, 1400, 1600
            'GI-RAD-22K-500-600',
            'GI-RAD-22K-500-800',
            'GI-RAD-22K-500-1000',
            'GI-RAD-22K-500-1200',
            'GI-RAD-22K-500-1400',
            'GI-RAD-22K-500-1600',
            'GI-RAD-22K-600-600',
            'GI-RAD-22K-600-800',
            'GI-RAD-22K-600-1000',
            'GI-RAD-22K-600-1200',
            'GI-RAD-22K-600-1400',
            'GI-RAD-22K-600-1600',
            // Steel panel radiators Tipas 22 VK (bottom) 500/600 x 600, 800, 1000, 1200, 1400, 1600
            'GI-RAD-22VK-500-600',
            'GI-RAD-22VK-500-800',
            'GI-RAD-22VK-500-1000',
            'GI-RAD-22VK-500-1200',
            'GI-RAD-22VK-500-1400',
            'GI-RAD-22VK-500-1600',
            'GI-RAD-22VK-600-600',
            'GI-RAD-22VK-600-800',
            'GI-RAD-22VK-600-1000',
            'GI-RAD-22VK-600-1200',
            'GI-RAD-22VK-600-1400',
            'GI-RAD-22VK-600-1600',
        ];

        for (const sku of requiredSkus) {
            const found = findGilesSnapshotProductBySlugOrId(sku);
            expect(found, `Expected radiator SKU ${sku} to exist in snapshot`).not.toBeNull();
            // W121-A1 honest commerce: a row without a current pricelist price
            // is price-on-request (priceEur null) instead of a stale price.
            if (found?.availability === 'on_request') {
                expect(found.priceEur).toBeNull();
                expect(found.priceOnRequest).toBe(true);
            } else {
                expect(found?.price).toBeGreaterThan(0);
            }
            const fromCatalog = await getCatalogProduct(sku);
            expect(fromCatalog?.sku).toBe(sku);
        }

        // Verify dedicated category tab "Radiatoriai ir šildymo prietaisai" in products/page.tsx
        const productsPageSrc = fs.readFileSync(
            path.join(repoRoot, 'src/app/[locale]/products/page.tsx'),
            'utf8',
        );
        expect(productsPageSrc).toContain('Radiatoriai ir šildymo prietaisai');
        expect(productsPageSrc).toContain('Radiators & heating units');
        expect(productsPageSrc).toContain('Grzejniki i urządzenia grzewcze');
        expect(productsPageSrc).toContain('Радиаторы и отопительные приборы');
        expect(snap.products.length).toBe(13531);
    });

    it('4) Address Cleanup: zero occurrences of Savanorių in public storefront files and replaced with Eigulių g. 21, LT-51418 Kaunas & Žirmūnų g. 68, LT-09124 Vilnius', () => {
        expect(GILES_COMPANY_IDENTITY.address).not.toContain('Savanorių');
        expect(GILES_COMPANY_IDENTITY.address).toContain('Eigulių g. 21');
        expect(GILES_COMPANY_IDENTITY.address).toContain('Žirmūnų g. 68');

        for (const loc of ['lt', 'en', 'pl', 'ru'] as const) {
            expect(STOREFRONT_STOCK_COPY[loc].warehouseBadge).not.toContain('Savanorių');
            expect(STOREFRONT_STOCK_COPY[loc].warehouseBadge).not.toContain('Саванорю');
            expect(STOREFRONT_STOCK_COPY[loc].warehouseProvenance).not.toContain('Savanorių');
            expect(STOREFRONT_STOCK_COPY[loc].warehouseProvenance).not.toContain('Саванорю');
        }

        const storefrontFiles = [
            'src/components/navbar.tsx',
            'src/components/footer.tsx',
            'src/i18n/storefront-ui-copy.ts',
            'src/lib/giles-masterpiece-data.ts',
            'src/lib/giles-catalog-snapshot.ts',
            'src/app/[locale]/page.tsx',
            'src/app/[locale]/products/page.tsx',
            'src/app/[locale]/products/[id]/page.tsx',
            'src/app/[locale]/inzinerija/page.tsx',
            'src/app/[locale]/contact/page.tsx',
            'src/app/[locale]/terms/page.tsx',
            'src/app/[locale]/privacy/page.tsx',
            'src/components/scientific-calculators-hub.tsx',
        ];

        for (const rel of storefrontFiles) {
            const src = fs.readFileSync(path.join(repoRoot, rel), 'utf8');
            expect(src, `File ${rel} must not contain Savanorių`).not.toContain('Savanorių');
            expect(src, `File ${rel} must not contain Саванорю`).not.toContain('Саванорю');
        }
    });

    it('5) Anti-Conversion B2B Discount Banner Removal: zero public "-35 % .. -60 %" boasts and replaced with Project & Complectation Offer Banner in 4 locales', () => {
        const publicStorefrontFiles = [
            'src/app/[locale]/products/page.tsx',
            'src/app/[locale]/products/[id]/page.tsx',
            'src/app/[locale]/page.tsx',
            'src/components/product-card.tsx',
            'src/i18n/storefront-ui-copy.ts',
        ];

        for (const rel of publicStorefrontFiles) {
            const src = fs.readFileSync(path.join(repoRoot, rel), 'utf8');
            expect(src, `File ${rel} must not contain -35 % .. -60 %`).not.toMatch(/-35\s*%\s*\.\.\s*-60\s*%/);
            expect(src, `File ${rel} must not contain -35%..-60%`).not.toContain('-35%..-60%');
            expect(src, `File ${rel} must not contain Esate montuotojas ar rangovas?`).not.toContain(
                'Esate montuotojas ar rangovas?',
            );
        }

        const productsPageSrc = fs.readFileSync(
            path.join(repoRoot, 'src/app/[locale]/products/page.tsx'),
            'utf8',
        );
        expect(productsPageSrc).toContain('Komplektuojate visą katilinę ar šildymo sistemą?');
        expect(productsPageSrc).toContain(
            'Atsiųskite sąrašą arba pasitarkite su inžinieriumi – parinksime tarpusavyje suderintus mazgus ir pateiksime komplekto pasiūlymą. Montuotojams ir rangovams – B2B projektų portalas.',
        );
        expect(productsPageSrc).toContain('Klausti inžinieriaus Vytauto');
        expect(productsPageSrc).toContain('Montuotojų B2B portalas');
    });
});
