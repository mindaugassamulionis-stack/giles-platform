/**
 * W23-S1 / G1 (P0): stock-empty/NULL must NOT disable purchase.
 *
 * Bug: product-purchase.tsx computed `soldOut = product.stock <= 0` while
 * catalog.ts coerced NULL stock to 0 (`r.stock ?? 0`) — with 100% of the
 * supplier catalog imported stock-empty, EVERY product rendered
 * "Išparduota" with a disabled add-to-cart (live probe W22-C1: 6x per PDP).
 *
 * Contract under test (P4 honest availability):
 * - NULL/undefined stock = UNKNOWN = purchasable + confirmation note
 *   (LT: "Kiekio patvirtinimas užsakymo metu"), never "Išparduota".
 * - explicit imported stock=0 = sold out (only this may block purchase).
 * - stock>0 = purchasable without note.
 * - getCatalogProduct/getStoreCatalog must PRESERVE null stock (not coerce
 *   to 0) so the PDP can distinguish unknown from zero.
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
import { getCatalogProduct } from './catalog';
import { resolvePurchasability, STOCK_UNKNOWN_NOTE_LT } from './purchasable';

const RUN = `g1${Date.now().toString(36)}`;
const DRIZZLE_DIR = path.resolve(process.cwd(), 'packages/database/drizzle');

describe('W23-S1/G1: purchasability resolution (unknown stock is purchasable)', () => {
    it('resolvePurchasability(null) → purchasable + confirmation note, not sold out', () => {
        const p = resolvePurchasability(null);
        expect(p.soldOut).toBe(false);
        expect(p.stockKnown).toBe(false);
        expect(p.availabilityNote).toBe(STOCK_UNKNOWN_NOTE_LT);
        expect(p.availabilityNote).toBe('Kiekio patvirtinimas užsakymo metu');
    });

    it('resolvePurchasability(undefined) → purchasable + note (wishlist/store items carry no stock)', () => {
        const p = resolvePurchasability(undefined);
        expect(p.soldOut).toBe(false);
        expect(p.availabilityNote).toBe(STOCK_UNKNOWN_NOTE_LT);
    });

    it('resolvePurchasability(0) default → purchasable + note: stored zero is the import placeholder (CSV has no stock column), not inventory', () => {
        const p = resolvePurchasability(0);
        expect(p.soldOut).toBe(false);
        expect(p.stockKnown).toBe(false);
        expect(p.availabilityNote).toBe(STOCK_UNKNOWN_NOTE_LT);
    });

    it('resolvePurchasability(0) with STOREFRONT_TRUST_VARIANT_STOCK=1 → sold out (true imported zero may block)', () => {
        process.env.STOREFRONT_TRUST_VARIANT_STOCK = '1';
        try {
            const p = resolvePurchasability(0);
            expect(p.soldOut).toBe(true);
            expect(p.stockKnown).toBe(true);
            expect(p.availabilityNote).toBeNull();
        } finally {
            delete process.env.STOREFRONT_TRUST_VARIANT_STOCK;
        }
    });

    it('resolvePurchasability(5) → purchasable, no note', () => {
        const p = resolvePurchasability(5);
        expect(p.soldOut).toBe(false);
        expect(p.availabilityNote).toBeNull();
    });

    describe('catalog rows preserve the null-stock distinction (pglite)', () => {
        let store: { id: string; slug: string };
        let productNull: { id: string };
        let productZero: { id: string };

        beforeAll(async () => {
            await migrate(db, { migrationsFolder: DRIZZLE_DIR });

            [store] = await db.insert(stores).values({
                name: `G1 Store ${RUN}`,
                slug: `g1-store-${RUN}`,
                storeKey: `g1_store_${RUN}`,
            }).returning();

            const [category] = await db.insert(categories).values({
                name: `G1 Cat ${RUN}`,
                slug: `g1-cat-${RUN}`,
                path: `root/g1-cat-${RUN}`,
            }).returning();

            [productNull] = await db.insert(products).values({
                titleEn: `G1 Null Product ${RUN}`,
                titleLt: `G1 Null Produktas ${RUN}`,
                status: 'published',
                categoryId: category.id,
            }).returning();
            [productZero] = await db.insert(products).values({
                titleEn: `G1 Zero Product ${RUN}`,
                titleLt: `G1 Zero Produktas ${RUN}`,
                status: 'published',
                categoryId: category.id,
            }).returning();

            // stock explicitly NULL (supplier import leaves stock unknown)
            await db.insert(variants).values({
                productId: productNull.id,
                sku: `G1-NULL-${RUN}`,
                priceGross: 2043,
                stock: null,
            });
            await db.insert(variants).values({
                productId: productZero.id,
                sku: `G1-ZERO-${RUN}`,
                priceGross: 999,
                stock: 0,
            });

            await db.insert(productStores).values([
                { productId: productNull.id, storeId: store.id, isActive: true },
                { productId: productZero.id, storeId: store.id, isActive: true },
            ]);

            process.env.STORE_SLUG = store.slug;
        }, 120_000);

        it('published+priced product with stock NULL resolves purchasable=true on the PDP catalog', async () => {
            const product = await getCatalogProduct(productNull.id);
            expect(product).not.toBeNull();
            // THE regression: mapCatalogRow used to coerce null → 0 → "Išparduota".
            expect(product!.stock).toBeNull();
            const purch = resolvePurchasability(product!.stock);
            expect(purch.soldOut).toBe(false);
            expect(purch.availabilityNote).toBe(STOCK_UNKNOWN_NOTE_LT);
        });

        it('explicit stock=0 (placeholder) stays purchasable by default end to end', async () => {
            const product = await getCatalogProduct(productZero.id);
            expect(product!.stock).toBe(0);
            expect(resolvePurchasability(product!.stock).soldOut).toBe(false);
        });
    });
});
