/**
 * W20-A1 regression (P2): getCatalogProduct must resolve ANY published,
 * store-scoped product by id — not only products inside the getStoreCatalog()
 * limit(100) window.
 *
 * Bug: catalog.ts getCatalogProduct() did `getStoreCatalog().find(p => p.id === id)`
 * over a `.limit(100)` query. With >100 active products the 101st+ PDPs render
 * "Prekė nerasta" (HTTP 200) although the products are published, junction-bound
 * and listed. Hermetic PGlite + full drizzle migration chain (same conventions
 * as catalog-scope.test.ts).
 */
import { describe, expect, it, beforeAll, vi } from 'vitest';
import path from 'path';
import { migrate } from 'drizzle-orm/pglite/migrator';

// Must be set before any packages/database import boots the db module.
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
} from '@platform/database/schema';
import { getStoreScopedProductIds, getStoreCatalog, getCatalogProduct } from './catalog';

const RUN = `win${Date.now().toString(36)}`;
const DRIZZLE_DIR = path.resolve(process.cwd(), 'packages/database/drizzle');
const TOTAL = 101; // one product beyond the limit(100) window

describe('W20-A1: getCatalogProduct resolves beyond the first-100 window (P2)', () => {
    let store: { id: string; slug: string };
    let target: { id: string; titleEn: string };

    beforeAll(async () => {
        await migrate(db, { migrationsFolder: DRIZZLE_DIR });

        [store] = await db.insert(stores).values({
            name: `Window Store ${RUN}`,
            slug: `window-store-${RUN}`,
            storeKey: `store_window_${RUN}`,
        }).returning();

        const [category] = await db.insert(categories).values({
            name: `Window Cat ${RUN}`,
            slug: `window-cat-${RUN}`,
            path: `root/window-cat-${RUN}`,
        }).returning();

        // 100 filler products created "now" + 1 target created in the past:
        // orderBy(desc(products.createdAt)) ranks the target 101st — beyond
        // the limit(100) window.
        const fillers = Array.from({ length: TOTAL - 1 }, (_, i) => ({
            titleEn: `Window Filler ${i} ${RUN}`,
            status: 'published',
            categoryId: category.id,
        }));
        const inserted = await db.insert(products).values([
            ...fillers,
            {
                titleEn: `Window Target ${RUN}`,
                status: 'published',
                categoryId: category.id,
                createdAt: new Date('2020-01-01T00:00:00Z'),
            },
        ]).returning();
        target = inserted[inserted.length - 1];

        await db.insert(variants).values(inserted.map((p: { id: string }, i: number) => ({
            productId: p.id,
            sku: `WIN-${RUN}-${i}`,
            ean: `EAN${RUN}${i}`,
            priceGross: 1000 + i,
            stock: 5,
        })));

        await db.insert(productStores).values(inserted.map((p: { id: string }) => ({
            productId: p.id,
            storeId: store.id,
            isActive: true,
        })));

        // The active storefront identity is this store.
        process.env.STORE_SLUG = store.slug;
    }, 120_000);

    it('seeds a published, store-scoped product ranked beyond the first 100', async () => {
        const ids = await getStoreScopedProductIds();
        expect(ids).toContain(target.id);
        const windowIds = new Set((await getStoreCatalog()).map((p) => p.id));
        expect(windowIds.size).toBe(100);
        expect(windowIds.has(target.id)).toBe(false); // precondition: beyond window
    });

    it('resolves the beyond-window product by id on the PDP', async () => {
        const product = await getCatalogProduct(target.id);
        expect(product).not.toBeNull();
        expect(product?.id).toBe(target.id);
        expect(product?.name).toContain('Window Target');
    });

    it('every store-scoped product id resolves via getCatalogProduct (no window 404s)', async () => {
        const ids = await getStoreScopedProductIds();
        expect(ids.length).toBe(TOTAL);
        for (const id of ids) {
            const product = await getCatalogProduct(id);
            expect(product, `scoped id ${id} must resolve on the PDP`).not.toBeNull();
        }
    });
});
