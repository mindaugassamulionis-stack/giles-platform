/**
 * WP-W118-A1 (audit P0-2, 2026-10-31): catalog scope must be OWNERSHIP-based,
 * not SKU-blacklist-based.
 *
 * Bug: `catalogScope` rejected test products by hardcoded SKU patterns
 * (`SUR-DEMO-%`, `W16D1-%`) — a blacklist that lags behind every new test
 * seed (`SKU-REALITY-suradai-lt-*` leaked through onto Gilės PDP related
 * products).
 *
 * Contract under test:
 *  1. A published product bound to the ACTIVE store via product_stores
 *     (is_active=true) is catalog-visible regardless of its SKU — the
 *     blacklist is gone; visibility is ownership + junction state only.
 *  2. A test-SKU product whose product_stores row is is_active=false is
 *     hidden even without any blacklist (DB unpublish works).
 *  3. A product bound only to ANOTHER store stays hidden (ownership).
 *  4. LIVE (only with DATABASE_URL exported): 0 active test-SKU products
 *     remain in the store scope the Gilės preview serves (Suradai.lt ids).
 *
 * Hermetic PGlite + full drizzle migration chain (see catalog-scope.test.ts).
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
import { getStoreCatalog } from './catalog';

const RUN = `w118${Date.now().toString(36)}`;
const DRIZZLE_DIR = path.resolve(process.cwd(), 'packages/database/drizzle');

// Store identity the Gilės app serves (WP-W119-A2: single fail-closed
// identity resolved from STORE_SLUG — no foreign Suradai store ids remain
// anywhere in src/).
const gilesPreviewStoreIds = async (): Promise<string[]> => {
    const { resolveStoreIdOrThrow } = await import('./store-identity');
    try {
        return [await resolveStoreIdOrThrow()];
    } catch {
        return [];
    }
};

describe('WP-W118-A1: catalogScope is ownership-based, not SKU-blacklist-based', () => {
    let storeA: { id: string; slug: string };
    let storeB: { id: string };
    let realityActive: { id: string };
    let surDemoActive: { id: string };
    let realityDeactivated: { id: string };
    let foreignProduct: { id: string };

    beforeAll(async () => {
        await migrate(db, { migrationsFolder: DRIZZLE_DIR });

        [storeA] = await db.insert(stores).values({
            name: `W118 Store A ${RUN}`,
            slug: `w118-a-${RUN}`,
            storeKey: `store_w118_a_${RUN}`,
        }).returning();
        [storeB] = await db.insert(stores).values({
            name: `W118 Store B ${RUN}`,
            slug: `w118-b-${RUN}`,
            storeKey: `store_w118_b_${RUN}`,
        }).returning();

        const [category] = await db.insert(categories).values({
            name: `W118 Cat ${RUN}`,
            slug: `w118-cat-${RUN}`,
            path: `root/w118-cat-${RUN}`,
        }).returning();

        const mkProduct = async (title: string) =>
            (await db.insert(products).values({
                titleEn: title,
                status: 'published',
                categoryId: category.id,
            }).returning())[0];

        const mkVariant = async (productId: string, sku: string) => {
            await db.insert(variants).values({
                productId,
                sku,
                ean: `EAN${sku}`,
                priceGross: 1000,
                stock: 3,
            });
        };

        // 1) The exact leaked SKU family: active + published + OWNED by the
        //    active store. Post-refactor it MUST be catalog-visible (no
        //    blacklist); the live DB keeps it hidden via is_active=false.
        realityActive = await mkProduct(`Reality Widget ${RUN}`);
        await mkVariant(realityActive.id, `SKU-REALITY-suradai-lt-${RUN}-1`);
        await db.insert(productStores).values({
            productId: realityActive.id,
            storeId: storeA.id,
            isActive: true,
        });

        // 2) Legacy blacklisted family, same ownership rules.
        surDemoActive = await mkProduct(`Sur Demo ${RUN}`);
        await mkVariant(surDemoActive.id, `SUR-DEMO-${RUN}-1`);
        await db.insert(productStores).values({
            productId: surDemoActive.id,
            storeId: storeA.id,
            isActive: true,
        });

        // 3) Test SKU with the junction row DEACTIVATED (the production
        //    remediation) -> hidden without any blacklist.
        realityDeactivated = await mkProduct(`Reality Widget Off ${RUN}`);
        await mkVariant(realityDeactivated.id, `SKU-REALITY-suradai-lt-${RUN}-2`);
        await db.insert(productStores).values({
            productId: realityDeactivated.id,
            storeId: storeA.id,
            isActive: false,
        });

        // 4) Foreign-store product -> hidden by ownership.
        foreignProduct = await mkProduct(`Foreign Product ${RUN}`);
        await mkVariant(foreignProduct.id, `W118-FOREIGN-${RUN}`);
        await db.insert(productStores).values({
            productId: foreignProduct.id,
            storeId: storeB.id,
            isActive: true,
        });

        process.env.STORE_SLUG = storeA.slug;
    }, 120_000);

    it('shows an owned+published+active product regardless of SKU pattern (blacklist removed)', async () => {
        const skus = (await getStoreCatalog()).map((p) => p.sku);
        expect(skus).toContain(`SKU-REALITY-suradai-lt-${RUN}-1`);
        expect(skus).toContain(`SUR-DEMO-${RUN}-1`);
    });

    it('hides a test-SKU product once its product_stores row is is_active=false (DB unpublish, no blacklist)', async () => {
        const ids = (await getStoreCatalog()).map((p) => p.id);
        expect(ids).not.toContain(realityDeactivated.id);
    });

    it('hides products bound only to another store (ownership scoping)', async () => {
        const ids = (await getStoreCatalog()).map((p) => p.id);
        expect(ids).not.toContain(foreignProduct.id);
    });

    it.skipIf(!process.env.DATABASE_URL)(
        'LIVE: 0 active test-SKU (SKU-REALITY-%|SUR-DEMO-%|W16D1-%) products in the Gilės store scope',
        async () => {
            const { default: postgres } = await import('postgres');
            const previewStoreIds = await gilesPreviewStoreIds();
            const sql = postgres(process.env.DATABASE_URL as string, { max: 1 });
            try {
                const rows = await sql`
                    SELECT ps.store_id, COUNT(*)::int AS n
                    FROM variants v
                    JOIN products p ON p.id = v.product_id
                    JOIN product_stores ps ON ps.product_id = p.id
                    WHERE ps.store_id IN ${sql(previewStoreIds)}
                      AND ps.is_active = true
                      AND p.status = 'published'
                      AND (v.sku ILIKE 'SKU-REALITY-%' OR v.sku ILIKE 'SUR-DEMO-%' OR v.sku ILIKE 'W16D1-%')
                    GROUP BY ps.store_id
                `;
                expect(rows).toEqual([]);
            } finally {
                await sql.end({ timeout: 5 });
            }
        },
    );
});
