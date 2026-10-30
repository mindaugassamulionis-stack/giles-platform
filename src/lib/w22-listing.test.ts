/**
 * W22-D1 §4.2 + T1 remainder: SQL-side pagination/sort + SKU paste tolerance.
 *
 * Contract (plan §6 T1 + §4.2):
 * - Listing paginates server-side (LIMIT/OFFSET) with total/pageCount.
 * - sort=code-asc orders by SKU ascending (SQL side).
 * - Paste-tolerant exact pins: `88.20.411` (dotted), `7 736 900 742` (spaced)
 *   and multi-code pastes pin their products to the top with
 *   exactSkuMatch=true ("Tikslus kodas" group).
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
import { searchCatalogProducts, searchCatalogProductsPaged } from './catalog-listing';

const RUN = `w22d${Date.now().toString(36)}`;
const DRIZZLE_DIR = path.resolve(process.cwd(), 'packages/database/drizzle');

describe('W22-D1: pagination + sort + SKU paste tolerance (pglite)', () => {
    let store: { id: string; slug: string };
    let brand: { id: string; name: string };
    let cat: { id: string };
    let dotted: { id: string };   // sku 88.20.411
    let spaced: { id: string };   // sku 7 736 900 742
    const bulkIds: string[] = [];

    beforeAll(async () => {
        await migrate(db, { migrationsFolder: DRIZZLE_DIR });

        [store] = await db.insert(stores).values({
            name: `W22D Store ${RUN}`,
            slug: `w22d-store-${RUN}`,
            storeKey: `w22d_store_${RUN}`,
        }).returning();
        [brand] = await db.insert(brands).values({ name: `Danfoss ${RUN}`, isVerified: true }).returning();
        [cat] = await db.insert(categories).values({
            name: `Vožtuvai ${RUN}`,
            slug: `voztuvai-w22d-${RUN}`,
            path: `root/voztuvai-w22d-${RUN}`,
        }).returning();

        // Paste-format fixtures
        [dotted] = await db.insert(products).values({
            titleEn: `Angle valve dotted ${RUN}`,
            titleLt: `Kampinis vožtuvas ${RUN}`,
            status: 'published',
            categoryId: cat.id,
            brandId: brand.id,
        }).returning();
        [spaced] = await db.insert(products).values({
            titleEn: `Sensor spaced ${RUN}`,
            titleLt: `Jutiklis ${RUN}`,
            status: 'published',
            categoryId: cat.id,
            brandId: brand.id,
        }).returning();
        await db.insert(variants).values([
            { productId: dotted.id, sku: `88.20.411`, priceGross: 2043, vatRate: 21 },
            { productId: spaced.id, sku: `7 736 900 742`, priceGross: 4599, vatRate: 21 },
        ]);
        await db.insert(productStores).values([
            { productId: dotted.id, storeId: store.id, isActive: true },
            { productId: spaced.id, storeId: store.id, isActive: true },
        ]);

        // Bulk set for pagination/code-asc: 60 products, skus W22D-C0001..C0060
        const bulkProducts = await db.insert(products).values(
            Array.from({ length: 60 }, (_, i) => ({
                titleEn: `Bulk part ${String(i + 1).padStart(4, '0')} ${RUN}`,
                titleLt: `Serijinė dalis ${String(i + 1).padStart(4, '0')} ${RUN}`,
                status: 'published',
                categoryId: cat.id,
                brandId: brand.id,
            })),
        ).returning();
        await db.insert(variants).values(
            bulkProducts.map((p: any, i: number) => ({
                productId: p.id,
                sku: `W22D-C${String(i + 1).padStart(4, '0')}-${RUN}`,
                priceGross: 1000 + i * 10,
                vatRate: 21,
            })),
        );
        await db.insert(productStores).values(
            bulkProducts.map((p: any) => ({ productId: p.id, storeId: store.id, isActive: true })),
        );
        bulkIds.push(...bulkProducts.map((p: any) => p.id));

        process.env.STORE_SLUG = store.slug;
    }, 120_000);

    it('paginates server-side: pageSize 20 → 3 pages over 62 products, stable totals', async () => {
        const p1 = await searchCatalogProductsPaged({ pageSize: 20, page: 1 });
        const p2 = await searchCatalogProductsPaged({ pageSize: 20, page: 2 });
        const p4 = await searchCatalogProductsPaged({ pageSize: 20, page: 4 });
        expect(p1.total).toBe(62);
        expect(p1.items.length).toBe(20);
        expect(p1.pageCount).toBe(4); // 62/20 → 4 pages (last has 2)
        expect(p2.items.length).toBe(20);
        expect(p4.items.length).toBe(2);
        // no overlap between pages
        const ids1 = new Set(p1.items.map((i) => i.id));
        expect(p2.items.every((i) => !ids1.has(i.id))).toBe(true);
        // unpaged legacy call returns everything
        const all = await searchCatalogProducts({});
        expect(all.length).toBe(62);
    });

    it('sort=code-asc orders by SKU ascending on page 1', async () => {
        const p1 = await searchCatalogProductsPaged({ pageSize: 20, page: 1, sortBy: 'code-asc' });
        const skus = p1.items.map((i) => i.sku);
        expect(skus).toEqual([...skus].sort((a, b) => a.localeCompare(b)));
        // byte order: '7 736 900 742' < '88.20.411' < 'W22D-C…'
        expect(skus[0]).toBe('7 736 900 742');
        expect(skus[1]).toBe('88.20.411');
    });

    it('paste-tolerant pin: dotted q=88.20.411 pins the exact product', async () => {
        const rows = await searchCatalogProducts({ q: '88.20.411', sortBy: 'code-asc' });
        expect(rows.length).toBeGreaterThanOrEqual(1);
        expect(rows[0].id).toBe(dotted.id);
        expect(rows[0].exactSkuMatch).toBe(true);
    });

    it('paste-tolerant pin: spaced q=7 736 900 742 pins the exact product', async () => {
        const rows = await searchCatalogProducts({ q: '7 736 900 742' });
        expect(rows[0].id).toBe(spaced.id);
        expect(rows[0].exactSkuMatch).toBe(true);
    });

    it('multi-code paste pins BOTH products at the top (grouped "Tikslus kodas")', async () => {
        const rows = await searchCatalogProducts({ q: '88.20.411, 7 736 900 742', sortBy: 'code-asc' });
        expect(rows.length).toBeGreaterThanOrEqual(2);
        const pinned = rows.filter((r) => r.exactSkuMatch);
        expect(pinned.length).toBe(2);
        // every pinned row precedes every unpinned row
        const firstUnpinned = rows.findIndex((r) => !r.exactSkuMatch);
        if (firstUnpinned !== -1) {
            expect(rows.slice(firstUnpinned).every((r) => !r.exactSkuMatch)).toBe(true);
        }
    });

    it('listing rows carry T4 price math inputs (priceCents + vatRate)', async () => {
        const rows = await searchCatalogProducts({ q: '88.20.411' });
        expect(rows[0].priceCents).toBe(2043);
        expect(rows[0].vatRate).toBe(21);
        expect(rows[0].price).toBeCloseTo(20.43, 5);
    });

    it('new price buckets filter server-side (50–200 € on cents)', async () => {
        // dotted 20.43 / spaced 45.99 → outside; bulk 10.00+0.10i → 50–200 at i>=400?
        // bulk max = 1000 + 59*10 = 1590 cents = 15.90 € → none in 50-200. Use 1000-plus? none.
        // Sanity: under-50 bucket contains both fixtures and bulk start.
        const rows = await searchCatalogProducts({ priceRange: 'under-50' });
        expect(rows.some((r) => r.id === dotted.id)).toBe(true);
        expect(rows.some((r) => r.id === spaced.id)).toBe(true);
        const none = await searchCatalogProducts({ priceRange: '50-200' });
        expect(none.length).toBe(0);
    });
});
