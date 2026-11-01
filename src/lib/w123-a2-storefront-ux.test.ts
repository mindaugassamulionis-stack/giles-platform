/**
 * W123-A2 storefront conversion tests: Grainger quick order pad (G1/G2),
 * McMaster facet-URL SEO landing pages (M2), Senukai/McMaster trust strip (S1/M3).
 *
 * Sources: W123-r3-competitor-teardown.md + W123-r3-top10-patterns.json
 * (ranks 2, 3, 9 of the TOP-10 copy-list).
 *
 * Facet/trust tests read the real 13,531-SKU snapshot so the ">0 products per
 * landing page" and live-count contracts are proven against shipped data.
 */
import { describe, expect, it } from 'vitest';
import {
    parseQuickOrderPadText,
    QUICK_ORDER_MAX_LINES,
    resolveQuickOrderLines,
    toQuickOrderCartItems,
    type QuickOrderLookup,
} from './quick-order-pad';
import {
    FACET_LANDING_MAX_PAGES,
    FACET_LANDING_TOP_CATEGORIES,
    FACET_LANDING_BRANDS_PER_CATEGORY,
    getFacetLandingCombos,
    resolveFacetLanding,
    getFacetLandingCombosForCategory,
    buildFacetLandingSitemapEntries,
    facetLandingHeading,
    facetLandingIntro,
} from './facet-landing';
import { buildTrustStripText, getTrustStripCounts } from './trust-strip';
import { getGilesCatalogSkuCount, getGilesCatalogInStockCount } from './catalog-count';

const fakeProduct = (over: Partial<Parameters<QuickOrderLookup>[0] extends never ? never : any>) => ({
    id: 'p1',
    slug: 'test-product',
    name: 'Test product',
    nameLt: 'Testinis produktas',
    price: 10,
    sku: 'TEST-1',
    brandName: 'Danfoss',
    categoryName: 'Katilai ir katilinės įranga',
    ...over,
});

describe('W123-A2 quick order pad parser (Grainger G2: paste SKU+qty from Excel)', () => {
    it('parses SKU<TAB>qty lines from pasted Excel content', () => {
        const { lines, truncated } = parseQuickOrderPadText('MPB-NANI-35\t2\nGIL-100\t10');
        expect(truncated).toBe(false);
        expect(lines).toEqual([
            { input: 'MPB-NANI-35\t2', sku: 'MPB-NANI-35', qty: 2 },
            { input: 'GIL-100\t10', sku: 'GIL-100', qty: 10 },
        ]);
    });

    it('parses "SKU qty" with one or more spaces and comma separators', () => {
        const { lines } = parseQuickOrderPadText('ABC-1 3\nDEF-2   5\nGHI-3,7');
        expect(lines).toEqual([
            { input: 'ABC-1 3', sku: 'ABC-1', qty: 3 },
            { input: 'DEF-2   5', sku: 'DEF-2', qty: 5 },
            { input: 'GHI-3,7', sku: 'GHI-3', qty: 7 },
        ]);
    });

    it('treats a bare SKU line as quantity 1', () => {
        const { lines } = parseQuickOrderPadText('MPB-NANI-35');
        expect(lines).toEqual([{ input: 'MPB-NANI-35', sku: 'MPB-NANI-35', qty: 1 }]);
    });

    it('skips blank and whitespace-only lines and tolerates CRLF', () => {
        const { lines } = parseQuickOrderPadText('A-1\t2\r\n\r\n   \r\nB-2\t4\n');
        expect(lines).toEqual([
            { input: 'A-1\t2', sku: 'A-1', qty: 2 },
            { input: 'B-2\t4', sku: 'B-2', qty: 4 },
        ]);
    });

    it('marks non-positive, fractional, and non-numeric quantities as invalid_qty', () => {
        const { lines } = parseQuickOrderPadText('A-1 0\nB-2 -3\nC-3 1.5\nD-4 x\nE-5 2');
        expect(lines).toEqual([
            { input: 'A-1 0', error: 'invalid_qty' },
            { input: 'B-2 -3', error: 'invalid_qty' },
            { input: 'C-3 1.5', error: 'invalid_qty' },
            { input: 'D-4 x', error: 'invalid_qty' },
            { input: 'E-5 2', sku: 'E-5', qty: 2 },
        ]);
    });

    it('dedupes repeated SKUs by summing their quantities', () => {
        const { lines } = parseQuickOrderPadText('A-1\t2\nA-1\t3\nB-2\t1');
        expect(lines).toEqual([
            { input: 'A-1\t2', sku: 'A-1', qty: 5 },
            { input: 'B-2\t1', sku: 'B-2', qty: 1 },
        ]);
    });

    it(`caps input at ${QUICK_ORDER_MAX_LINES} lines and reports truncation`, () => {
        const text = Array.from({ length: QUICK_ORDER_MAX_LINES + 50 }, (_, i) => `SKU-${i}\t1`).join('\n');
        const { lines, truncated } = parseQuickOrderPadText(text);
        expect(truncated).toBe(true);
        expect(lines).toHaveLength(QUICK_ORDER_MAX_LINES);
    });

    it('keeps uppercase/case-insensitive SKU resolution order stable', () => {
        const { lines } = parseQuickOrderPadText('abc-9\t1');
        expect(lines[0]).toMatchObject({ sku: 'abc-9', qty: 1 });
    });
});

describe('W123-A2 quick order resolution against catalog-search-index', () => {
    const lookup: QuickOrderLookup = (sku) => {
        if (sku === 'test-1') return fakeProduct({ priceOnRequest: true, price: 0 }) as any;
        if (sku === 'found-1') return fakeProduct({ id: 'p2', sku: 'FOUND-1', price: 25.5, nameLt: 'Rastas produktas' }) as any;
        return undefined;
    };

    it('resolves each line to rasta/nerasta/kaina-pagal-užklausą status', () => {
        const parsed = parseQuickOrderPadText('FOUND-1\t2\nNOPE-1\t1\nTEST-1\t5');
        const rows = resolveQuickOrderLines(parsed, lookup);
        expect(rows).toEqual([
            expect.objectContaining({ sku: 'FOUND-1', qty: 2, status: 'found' }),
            expect.objectContaining({ sku: 'NOPE-1', qty: 1, status: 'not_found' }),
            expect.objectContaining({ sku: 'TEST-1', qty: 5, status: 'price_on_request' }),
        ]);
    });

    it('maps found rows to cart items and never maps price-on-request rows', () => {
        const parsed = parseQuickOrderPadText('FOUND-1\t2\nNOPE-1\t1\nTEST-1\t5');
        const rows = resolveQuickOrderLines(parsed, lookup);
        const cartItems = toQuickOrderCartItems(rows);
        expect(cartItems).toEqual([
            {
                id: 'p2',
                productId: 'p2',
                name: 'Rastas produktas',
                price: 25.5,
                quantity: 2,
                sku: 'FOUND-1',
                image: undefined,
            },
        ]);
    });

    it('resolves a real snapshot SKU through the default catalog-search-index lookup', () => {
        const parsed = parseQuickOrderPadText('MPB-NANI-35\t1');
        const rows = resolveQuickOrderLines(parsed);
        expect(rows[0].status).toBe('found');
        expect(rows[0].product?.brandName).toBe('Megatherm');
    });
});

describe('W123-A2 facet-URL SEO landing combos (McMaster M2)', () => {
    const combos = getFacetLandingCombos();

    it('produces combos with more than zero products, capped at 56 pages', () => {
        expect(combos.length).toBeGreaterThan(0);
        expect(combos.length).toBeLessThanOrEqual(FACET_LANDING_MAX_PAGES);
        for (const combo of combos) {
            expect(combo.productCount).toBeGreaterThan(0);
        }
    });

    it('covers at most 7 categories with at most 8 brands each', () => {
        const byCat = new Map<string, number>();
        for (const combo of combos) {
            byCat.set(combo.categorySlug, (byCat.get(combo.categorySlug) || 0) + 1);
        }
        expect(byCat.size).toBeLessThanOrEqual(FACET_LANDING_TOP_CATEGORIES);
        expect(byCat.size).toBeGreaterThan(0);
        for (const [cat, brandCount] of byCat) {
            expect(brandCount).toBeLessThanOrEqual(FACET_LANDING_BRANDS_PER_CATEGORY);
        }
    });

    it('uses clean ASCII slugs without diacritics', () => {
        for (const combo of combos) {
            expect(combo.categorySlug).toMatch(/^[a-z0-9-]+$/);
            expect(combo.brandSlug).toMatch(/^[a-z0-9-]+$/);
        }
    });

    it('resolves a combo page to products that all match its category and brand', () => {
        const combo = combos[0];
        const resolved = resolveFacetLanding(combo.categorySlug, combo.brandSlug);
        expect(resolved).not.toBeNull();
        expect(resolved!.products.length).toBeGreaterThan(0);
        for (const p of resolved!.products) {
            expect(p.categoryName).toBe(combo.categoryName);
            expect(p.brandName).toBe(combo.brandName);
        }
    });

    it('returns null for unknown combos', () => {
        expect(resolveFacetLanding('no-such-category', 'no-such-brand')).toBeNull();
    });

    it('serves category chip lists for the "Populiariausi gamintojai" block', () => {
        const chips = getFacetLandingCombosForCategory(combos[0].categoryName);
        expect(chips.length).toBeGreaterThan(0);
        for (const chip of chips) {
            expect(chip.productCount).toBeGreaterThan(0);
        }
    });

    it('builds localized headings and two-sentence intros without em dashes', () => {
        const locales = ['lt', 'en', 'pl', 'ru'] as const;
        for (const combo of combos.slice(0, 6)) {
            for (const locale of locales) {
                const heading = facetLandingHeading(combo, locale);
                const intro = facetLandingIntro(combo, locale);
                expect(heading).toContain(combo.brandName);
                expect(heading).not.toContain('\u2014');
                expect(intro).not.toContain('\u2014');
                expect((intro.match(/\./g) || []).length).toBeGreaterThanOrEqual(2);
            }
        }
    });

    it('builds sitemap entries with 4-locale hreflang alternates + x-default', () => {
        const baseUrl = 'https://giles.example';
        const entries = buildFacetLandingSitemapEntries(baseUrl, ['lt', 'en', 'pl', 'ru']);
        expect(entries.length).toBe(combos.length * 4);
        for (const entry of entries) {
            expect(entry.url).toContain('/parduotuve/');
            const langs = (entry.alternates?.languages ?? {}) as Record<string, string>;
            expect(Object.keys(langs)).toEqual(
                expect.arrayContaining(['lt', 'en', 'pl', 'ru', 'x-default']),
            );
            for (const url of Object.values(langs)) {
                expect(url.startsWith(baseUrl)).toBe(true);
            }
        }
    });
});

describe('W123-A2 trust strip with live counts (Senukai S1 / McMaster M3)', () => {
    it('renders the LT strip with the real catalog and in-stock counts', () => {
        const lt = buildTrustStripText('lt', { total: 13531, inStock: 28 });
        expect(lt).toContain('13 531');
        expect(lt).toContain('28');
        expect(lt).toContain('Kaune');
        expect(lt).toContain('2011');
    });

    it('localizes EN/PL/RU and contains no em dash in any locale', () => {
        for (const locale of ['lt', 'en', 'pl', 'ru'] as const) {
            const text = buildTrustStripText(locale, { total: 13531, inStock: 28 });
            expect(text.trim().length).toBeGreaterThan(10);
            expect(text).not.toContain('\u2014');
        }
        expect(buildTrustStripText('en', { total: 13531, inStock: 28 })).toMatch(/products/i);
    });

    it('sources counts from catalog-count (never hardcoded)', () => {
        const counts = getTrustStripCounts();
        expect(counts.total).toBe(getGilesCatalogSkuCount());
        expect(counts.total).toBeGreaterThan(1000);
        expect(counts.inStock).toBe(getGilesCatalogInStockCount());
    });
});
