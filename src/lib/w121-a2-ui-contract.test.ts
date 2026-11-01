// WP-W121-A2 UI contract tests: honest price-on-request + availability +
// dynamic catalog count against the field contract from WP-W121-A1
// (priceEur: number | null, priceOnRequest?: true,
//  availability?: 'in_stock' | 'supplier_2_4d' | 'on_request',
//  stockQty?: number | null). UI must be null-safe on legacy rows.
import { describe, expect, it } from 'vitest';
import {
    isPriceOnRequestProduct,
    resolveHonestAvailability,
    honestAvailabilityLabel,
    matchesPriceFilter,
    formatCatalogCount,
    PRICE_REQUEST_COPY,
    type HonestCommerceSource,
} from './w121-honest-commerce';
import { formatShortStockBadge, searchGilesSnapshotPaged, getGilesCatalogProducts } from './giles-catalog-snapshot';

const legacyRow: HonestCommerceSource = {
    // Old snapshot row: no contract fields at all.
    priceCents: 1299,
    stock: 4,
    stockQuantity: 4,
    stockSource: 'Skaita SQL · Kauno sandėlis (Eigulių g. 21, LT-51418 Kaunas)',
};

describe('W121-A2 price-on-request', () => {
    it('flags priceOnRequest rows, null-price rows and zero-price rows', () => {
        expect(isPriceOnRequestProduct({ ...legacyRow, priceOnRequest: true } as HonestCommerceSource)).toBe(true);
        expect(isPriceOnRequestProduct({ ...legacyRow, priceCents: null } as HonestCommerceSource)).toBe(true);
        expect(isPriceOnRequestProduct({ ...legacyRow, priceEur: null } as HonestCommerceSource)).toBe(true);
        expect(isPriceOnRequestProduct({ ...legacyRow, priceCents: 0 } as HonestCommerceSource)).toBe(true);
    });

    it('keeps priced rows purchasable and is null-safe on legacy rows', () => {
        expect(isPriceOnRequestProduct(legacyRow)).toBe(false);
        expect(isPriceOnRequestProduct({} as HonestCommerceSource)).toBe(true);
    });

    it('localizes the price-request label and CTA in LT/EN/PL/RU', () => {
        expect(PRICE_REQUEST_COPY.lt.onRequestLabel).toBe('Kaina pagal užklausą');
        expect(PRICE_REQUEST_COPY.lt.cta).toBe('Gauti kainą per 15 min.');
        expect(PRICE_REQUEST_COPY.lt.addToRequest).toBe('Įtraukti į užklausą');
        for (const loc of ['en', 'pl', 'ru'] as const) {
            expect(PRICE_REQUEST_COPY[loc].onRequestLabel.length).toBeGreaterThan(3);
            expect(PRICE_REQUEST_COPY[loc].cta.length).toBeGreaterThan(3);
        }
        // LT diacritics present in customer-facing text.
        expect(PRICE_REQUEST_COPY.lt.cta).toMatch(/[\u0105\u010D\u0119\u0117\u012F\u0161\u0173\u016B\u017E]/);
    });
});

describe('W121-A2 honest availability badges', () => {
    it('uses the availability field verbatim when present', () => {
        expect(resolveHonestAvailability({ ...legacyRow, availability: 'in_stock' })).toBe('in_stock');
        expect(resolveHonestAvailability({ ...legacyRow, availability: 'supplier_2_4d' })).toBe('supplier_2_4d');
        expect(resolveHonestAvailability({ ...legacyRow, availability: 'on_request' })).toBe('on_request');
    });

    it('derives supplier_2_4d from Tiekėjo stockSource on legacy rows', () => {
        expect(
            resolveHonestAvailability({
                priceCents: 999,
                stock: null,
                stockQuantity: null,
                stockSource: 'Tiekėjo centrinis sandėlis (2–4 d. d.)',
            }),
        ).toBe('supplier_2_4d');
    });

    it('derives in_stock only from a real positive stock qty on legacy rows', () => {
        expect(resolveHonestAvailability(legacyRow)).toBe('in_stock');
        expect(
            resolveHonestAvailability({ priceCents: 999, stock: 0, stockQuantity: 0, stockSource: null }),
        ).toBe('on_request');
        expect(
            resolveHonestAvailability({ priceCents: 999, stock: null, stockQuantity: null, stockSource: null }),
        ).toBe('on_request');
    });

    it('prints the exact honest badge labels per locale', () => {
        expect(honestAvailabilityLabel('in_stock', 'lt')).toBe('Sandėlyje · Kaunas');
        expect(honestAvailabilityLabel('supplier_2_4d', 'lt')).toBe('Tiekėjo sandėlyje · 2–4 d. d.');
        expect(honestAvailabilityLabel('on_request', 'lt')).toBe('Pagal užklausą');
        expect(honestAvailabilityLabel('in_stock', 'pl')).toContain('Kowno');
        expect(honestAvailabilityLabel('in_stock', 'ru')).toContain('Каунас');
        expect(honestAvailabilityLabel('in_stock', 'en')).toBe('In stock · Kaunas');
    });

    it('never fabricates a numeric stock qty when stockQty is null', () => {
        const badge = formatShortStockBadge({ stock: null, stockQuantity: null, stockSource: null });
        expect(badge.shortLabel).not.toMatch(/\d/);
        expect(badge.mobileLabel).not.toMatch(/\d/);
        const egipBadge = formatShortStockBadge({
            stock: null,
            stockQuantity: null,
            stockSource: 'EGIP.lt PrestaShop bazė',
        });
        expect(egipBadge.shortLabel).toBe('Sandėlyje · Kaunas (EGIP.lt)');
        const supplier = formatShortStockBadge({
            stock: null,
            stockQuantity: null,
            stockSource: 'Tiekėjo centrinis sandėlis (2–4 d. d.)',
        });
        expect(supplier.shortLabel).toBe('Tiekėjo sandėlyje · 2–4 d. d.');
        expect(supplier.shortLabel).not.toMatch(/\d+\s*vnt/);
    });

    it('may print a real qty only when stockQty is a real positive number', () => {
        const badge = formatShortStockBadge({
            stock: 12,
            stockQuantity: 12,
            stockSource: 'EGIP.lt PrestaShop bazė',
        });
        expect(badge.shortLabel).toContain('12');
    });
});

describe('W121-A2 price filter behavior with priceless rows', () => {
    it('excludes priceless rows only when a price bound is active', () => {
        const priceless = { priceCents: null, priceOnRequest: true } as HonestCommerceSource;
        const priced = { priceCents: 4999 } as HonestCommerceSource;
        expect(matchesPriceFilter(priceless, 1000, null)).toBe(false);
        expect(matchesPriceFilter(priceless, null, 10000)).toBe(false);
        expect(matchesPriceFilter(priced, 1000, null)).toBe(true);
        // No filter active: priceless rows stay visible.
        expect(matchesPriceFilter(priceless, null, null)).toBe(true);
        expect(matchesPriceFilter(priced, null, null)).toBe(true);
    });

    it('keeps the live snapshot search slice under 5 ms for a category query', () => {
        const products = getGilesCatalogProducts();
        expect(products.length).toBeGreaterThan(1000);
        const category = products[0].categoryName || 'Katilinės automatika ir pavaros';
        // Warm-up builds the search index once.
        searchGilesSnapshotPaged({ category, pageSize: 48 });
        const runs = 10;
        const t0 = performance.now();
        for (let i = 0; i < runs; i++) {
            const page = searchGilesSnapshotPaged({ category, page: 1, pageSize: 48 });
            expect(page.items.length).toBeGreaterThan(0);
        }
        const avgMs = (performance.now() - t0) / runs;
        expect(avgMs).toBeLessThan(5);
    });
});

describe('W121-A2 dynamic catalog count', () => {
    it('formats the live SKU count per locale (lt-LT grouping)', () => {
        const live = getGilesCatalogProducts().length;
        expect(live).toBeGreaterThan(1000);
        expect(formatCatalogCount(live, 'lt')).toBe(
            new Intl.NumberFormat('lt-LT').format(live).replace(/[\u00A0\u202F]/g, ' '),
        );
        expect(formatCatalogCount(live, 'en')).toBe(new Intl.NumberFormat('en-US').format(live));
        expect(formatCatalogCount(6337, 'lt')).toBe('6 337');
        expect(formatCatalogCount(6337, 'en')).toBe('6,337');
    });
});
