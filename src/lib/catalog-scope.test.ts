/**
 * WP-FIX-CATALOG-SCOPE regression (P1): the /products listing must be store-scoped.
 *
 * Bug: products/page.tsx listed ALL published products (no product_stores
 * junction binding) while the PDP resolves through lib/catalog.ts
 * getStoreCatalog() (junction-scoped) — cross-store rows rendered as grid
 * links that 404'd ("Prekė nerasta").
 *
 * Contract under test: getStoreScopedProductIds() returns exactly the product
 * ids the PDP catalog can resolve for the active store, so every catalog link
 * lands on a 200 PDP. Hermetic PGlite + full drizzle migration chain.
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
import { getStoreScopedProductIds, getStoreCatalog } from './catalog';

const RUN = `scope${Date.now().toString(36)}`;
const DRIZZLE_DIR = path.resolve(process.cwd(), 'packages/database/drizzle');

describe('WP-FIX-CATALOG-SCOPE: catalog listing is store-scoped (P1)', () => {
    let storeA: { id: string; slug: string };
    let storeB: { id: string };
    let productA: { id: string };
    let productB: { id: string };

    beforeAll(async () => {
        await migrate(db, { migrationsFolder: DRIZZLE_DIR });

        [storeA] = await db.insert(stores).values({
            name: `Scope Store A ${RUN}`,
            slug: `scope-a-${RUN}`,
            storeKey: `store_scope_a_${RUN}`,
        }).returning();
        [storeB] = await db.insert(stores).values({
            name: `Scope Store B ${RUN}`,
            slug: `scope-b-${RUN}`,
            storeKey: `store_scope_b_${RUN}`,
        }).returning();

        const [category] = await db.insert(categories).values({
            name: `Scope Cat ${RUN}`,
            slug: `scope-cat-${RUN}`,
            path: `root/scope-cat-${RUN}`,
        }).returning();

        [productA] = await db.insert(products).values({
            titleEn: `Scope Product A ${RUN}`,
            titleLt: `Scope Produktas A ${RUN}`,
            descriptionEn: 'Store A product',
            descriptionLt: 'A parduotuvės prekė',
            status: 'published',
            categoryId: category.id,
        }).returning();
        [productB] = await db.insert(products).values({
            titleEn: `Scope Product B ${RUN}`,
            titleLt: `Scope Produktas B ${RUN}`,
            descriptionEn: 'Store B product',
            descriptionLt: 'B parduotuvės prekė',
            status: 'published',
            categoryId: category.id,
        }).returning();

        await db.insert(variants).values({
            productId: productA.id,
            sku: `SCOPE-A-${RUN}`,
            ean: `EA${RUN}A1`,
            priceGross: 1999,
            stock: 5,
        });
        await db.insert(variants).values({
            productId: productB.id,
            sku: `SCOPE-B-${RUN}`,
            ean: `EA${RUN}B1`,
            priceGross: 2999,
            stock: 5,
        });

        await db.insert(productStores).values({
            productId: productA.id,
            storeId: storeA.id,
            isActive: true,
        });
        await db.insert(productStores).values({
            productId: productB.id,
            storeId: storeB.id,
            isActive: true,
        });

        // The active storefront identity is store A.
        process.env.STORE_SLUG = storeA.slug;
    }, 120_000);

    it('exposes the scoped listing contract', () => {
        expect(typeof getStoreScopedProductIds).toBe('function');
    });

    it('excludes products bound only to other stores', async () => {
        const ids = await getStoreScopedProductIds();
        expect(ids).toContain(productA.id);
        expect(ids).not.toContain(productB.id);
    });

    it('every listing id resolves on the PDP catalog (no 404 catalog links)', async () => {
        const ids = await getStoreScopedProductIds();
        expect(ids.length).toBeGreaterThan(0);
        const catalogIds = new Set((await getStoreCatalog()).map((p) => p.id));
        for (const id of ids) {
            expect(catalogIds.has(id), `listing id ${id} must resolve on PDP`).toBe(true);
        }
    });
});
