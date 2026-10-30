/**
 * W23-S1 / G4 + G2/G3 (P0): listing price source + code-first search.
 *
 * G4: products/page.tsx priced cards via `leftJoin(offers, eq(offers.ean,
 * variants.ean))` — with the supplier import leaving ean 100% empty the join
 * never matched, so every listing/search card rendered 0.00 € while the PDP
 * (variants.priceGross) showed the real price. Contract: listing price comes
 * from variants.priceGross (cheapest variant), never from the offers EAN join.
 *
 * G2/G3: search matched ONLY titleEn (`ilike(products.titleEn, …)`) —
 * q=013G0011 (SKU) → 0 results, q=atvamzdis (LT) → 0 results. Contract:
 * q matches sku (exact, pinned top) OR titleLt OR titleEn OR brand
 * (case-insensitive), with existing category/brand filters intact.
 */
import { describe, expect, it, beforeAll, vi } from 'vitest';
import path from 'path';
import { migrate } from 'drizzle-orm/pglite/migrator';

vi.hoisted(() => {
    process.env.TEST_DB = 'pglite';
});

import { db } from '@platform/database';
import {
    stores,
    categories,
    products,
    variants,
    productStores,
    brands,
} from '@platform/database/schema';
import {
    searchCatalogProducts,
    listCatalogBrands,
    getCategoryCatalogCounts,
    getPopularProductPreviews,
} from './catalog-listing';

const RUN = `g234${Date.now().toString(36)}`;
const DRIZZLE_DIR = path.resolve(process.cwd(), 'packages/database/drizzle');

describe('W23-S1: catalog listing + code-first search (pglite)', () => {
    let store: { id: string; slug: string };
    let brandDanfoss: { id: string; name: string };
    let brandImi: { id: string; name: string };
    let catValves: { id: string };
    let catOther: { id: string };
    let pSku: { id: string };      // sku RA-N013G0011, LT title w/ atvamzdis
    let pLt: { id: string };       // sku different, LT title w/ atvamzdis
    let pEn: { id: string };       // EN title valve
    let pOtherStore: { id: string };

    beforeAll(async () => {
        await migrate(db, { migrationsFolder: DRIZZLE_DIR });

        [store] = await db.insert(stores).values({
            name: `G234 Store ${RUN}`,
            slug: `g234-store-${RUN}`,
            storeKey: `g234_store_${RUN}`,
        }).returning();
        const [storeB] = await db.insert(stores).values({
            name: `G234 StoreB ${RUN}`,
            slug: `g234-storeb-${RUN}`,
            storeKey: `g234_storeb_${RUN}`,
        }).returning();

        [brandDanfoss] = await db.insert(brands).values({
            name: `Danfoss ${RUN}`,
            isVerified: true,
        }).returning();
        [brandImi] = await db.insert(brands).values({
            name: `IMI TA ${RUN}`,
            isVerified: true,
        }).returning();

        [catValves] = await db.insert(categories).values({
            name: `Vožtuvai ${RUN}`,
            slug: `voztuvai-${RUN}`,
            path: `root/voztuvai-${RUN}`,
        }).returning();
        [catOther] = await db.insert(categories).values({
            name: `Kita ${RUN}`,
            slug: `kita-${RUN}`,
            path: `root/kita-${RUN}`,
        }).returning();

        [pSku] = await db.insert(products).values({
            titleEn: `Angle valve DN15 ${RUN}`,
            titleLt: `Kampinis atvamzdis DN15 kvs 0.90 ${RUN}`,
            status: 'published',
            categoryId: catValves.id,
            brandId: brandDanfoss.id,
        }).returning();
        [pLt] = await db.insert(products).values({
            titleEn: `Straight radiator pipe ${RUN}`,
            titleLt: `Tiesus atvamzdis DN20 ${RUN}`,
            status: 'published',
            categoryId: catValves.id,
            brandId: brandImi.id,
        }).returning();
        [pEn] = await db.insert(products).values({
            titleEn: `Radiator valve angle EN ${RUN}`,
            titleLt: `Radiatoriaus vožtuvas ${RUN}`,
            status: 'published',
            categoryId: catOther.id,
            brandId: brandDanfoss.id,
        }).returning();
        [pOtherStore] = await db.insert(products).values({
            titleEn: `Other store valve ${RUN}`,
            titleLt: `Kitos parduotuvės atvamzdis ${RUN}`,
            status: 'published',
            categoryId: catOther.id,
        }).returning();

        // Cheapest-variant pricing must ignore offers entirely.
        await db.insert(variants).values([
            { productId: pSku.id, sku: `RA-N013G0011-${RUN}`, priceGross: 2043, stock: null as unknown as undefined },
            { productId: pSku.id, sku: `RA-N013G0011-ALT-${RUN}`, priceGross: 1899 },
            { productId: pLt.id, sku: `IMI-50-131-${RUN}`, priceGross: 1529 },
            { productId: pEn.id, sku: `EN-VALVE-${RUN}`, priceGross: 2500 },
            { productId: pOtherStore.id, sku: `OTHER-VALVE-${RUN}`, priceGross: 1111 },
        ]);

        await db.insert(productStores).values([
            { productId: pSku.id, storeId: store.id, isActive: true },
            { productId: pLt.id, storeId: store.id, isActive: true },
            { productId: pEn.id, storeId: store.id, isActive: true },
            { productId: pOtherStore.id, storeId: storeB.id, isActive: true },
        ]);

        process.env.STORE_SLUG = store.slug;
    }, 120_000);

    it('G4: listing price comes from cheapest variants.priceGross, not the offers EAN join', async () => {
        const rows = await searchCatalogProducts({});
        const sku = rows.find((r: any) => r.id === pSku.id);
        expect(sku).toBeDefined();
        expect(sku!.price).toBe(18.99); // 1899 cents, cheapest variant
        expect(sku!.sku).toBe(`RA-N013G0011-ALT-${RUN}`);
        const lt = rows.find((r: any) => r.id === pLt.id);
        expect(lt!.price).toBe(15.29);
    });

    it('G4: every priced store product lists with price > 0', async () => {
        const rows = await searchCatalogProducts({});
        expect(rows.length).toBe(3);
        for (const r of rows) expect(r.price).toBeGreaterThan(0);
    });

    it('G2: q=SKU (case-insensitive substring) finds the product', async () => {
        const rows = await searchCatalogProducts({ q: `ra-n013g0011-${RUN}`.toUpperCase() });
        expect(rows.length).toBeGreaterThanOrEqual(1);
        expect(rows.some((r: any) => r.id === pSku.id)).toBe(true);
    });

    it('G2: exact SKU hit is pinned to the top with exactSkuMatch=true', async () => {
        // pLt's title does NOT contain the exact sku; pSku does. Exact hit first.
        const rows = await searchCatalogProducts({ q: `RA-N013G0011-${RUN}` });
        expect(rows.length).toBeGreaterThanOrEqual(1);
        expect(rows[0].exactSkuMatch).toBe(true);
        expect(rows[0].id).toBe(pSku.id);
    });

    it('G3: q matches titleLt (atvamzdis)', async () => {
        const rows = await searchCatalogProducts({ q: 'atvamzdis' });
        // store-scoped: pSku + pLt (pOtherStore excluded)
        expect(rows.some((r: any) => r.id === pSku.id)).toBe(true);
        expect(rows.some((r: any) => r.id === pLt.id)).toBe(true);
        expect(rows.some((r: any) => r.id === pOtherStore.id)).toBe(false);
    });

    it('G3: q matches brand name', async () => {
        const rows = await searchCatalogProducts({ q: `danfoss ${RUN}` });
        expect(rows.some((r: any) => r.id === pSku.id)).toBe(true);
        expect(rows.some((r: any) => r.id === pLt.id)).toBe(false);
    });

    it('no regression: q still matches titleEn (valve)', async () => {
        const rows = await searchCatalogProducts({ q: 'valve' });
        expect(rows.some((r: any) => r.id === pEn.id)).toBe(true);
    });

    it('store scope holds under search (cross-store rows never leak)', async () => {
        const rows = await searchCatalogProducts({ q: RUN });
        expect(rows.some((r: any) => r.id === pOtherStore.id)).toBe(false);
    });

    it('existing filters keep working: brandId restricts results', async () => {
        const rows = await searchCatalogProducts({ brandId: brandImi.id });
        expect(rows.length).toBe(1);
        expect(rows[0].id).toBe(pLt.id);
    });

    it('existing filters keep working: categoryId restricts results', async () => {
        const rows = await searchCatalogProducts({ categoryId: catValves.id });
        expect(rows.length).toBe(2);
        expect(rows.some((r: any) => r.id === pSku.id)).toBe(true);
        expect(rows.some((r: any) => r.id === pLt.id)).toBe(true);
    });

    it('existing filters keep working: priceRange filters on variants.priceGross', async () => {
        const rows = await searchCatalogProducts({ priceRange: 'under-20' });
        // 18.99 and 15.29 pass, 25.00 excluded
        expect(rows.some((r: any) => r.id === pSku.id)).toBe(true);
        expect(rows.some((r: any) => r.id === pLt.id)).toBe(true);
        expect(rows.some((r: any) => r.id === pEn.id)).toBe(false);
    });

    it('sort=price-asc orders by price (SKU pin still first when q is exact)', async () => {
        const rows = await searchCatalogProducts({ sortBy: 'price-asc' });
        const prices = rows.map((r: any) => r.price);
        expect([...prices].sort((a: number, b: number) => a - b)).toEqual(prices);
    });

    it('W34-A1: filters.brand matches by canonical brand name (case-insensitive) and returns resolved imageUrl + brandName', async () => {
        const rows = await searchCatalogProducts({ brand: `danfoss ${RUN}` });
        expect(rows.length).toBe(2);
        expect(rows.some((r: any) => r.id === pSku.id)).toBe(true);
        expect(rows.some((r: any) => r.id === pEn.id)).toBe(true);
        for (const r of rows) {
            expect(r.imageUrl).toMatch(/^\/images\/products\/.+\.webp$/);
            expect(r.brandName).toBeTruthy();
        }
    });

    it('W34-A1: filters.category matches by exact category name or slug as well as UUID', async () => {
        const byName = await searchCatalogProducts({ category: `Vožtuvai ${RUN}` });
        expect(byName.length).toBe(2);
        const bySlug = await searchCatalogProducts({ category: `voztuvai-${RUN}` });
        expect(bySlug.length).toBe(2);
    });

    it('W34-A1: listCatalogBrands and getCategoryCatalogCounts return store-scoped counts, and getPopularProductPreviews returns curated flagship items', async () => {
        const brandCounts = await listCatalogBrands();
        expect(brandCounts.length).toBeGreaterThanOrEqual(2);
        const danfossRow = brandCounts.find((b) => b.id === brandDanfoss.id);
        expect(danfossRow?.count).toBe(2);

        const catCounts = await getCategoryCatalogCounts();
        expect(catCounts.length).toBe(2);

        const previews = await getPopularProductPreviews(12);
        expect(previews.length).toBe(3);
        expect(previews.every((p) => p.imageUrl?.endsWith('.webp'))).toBe(true);
    });
});
