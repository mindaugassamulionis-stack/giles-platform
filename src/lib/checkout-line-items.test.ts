/**
 * W23-S1 / G1 cart path (P0): checkout line resolution must not re-block
 * unknown-stock items and must price from variants.priceGross.
 *
 * Bug: api/checkout/route.ts resolved every line via
 * `innerJoin(offers, eq(offers.ean, variants.ean))` — with ean 100% empty
 * (a) the inner join returned no row so items were silently DROPPED from the
 * order, and (b) had a row existed, `itemData.stockQty < item.quantity`
 * (stockQty null → 0) would 400 "Out of stock". Either way the cart path
 * blocked every purchase of the supplier catalog.
 *
 * Contract under test (extracted to lib so the route stays thin):
 * - price/stock/sku/name resolve from variants + products; offers is a
 *   LEFT join used only for supplier grouping.
 * - price = variants.priceGross / 100 (cents → EUR), matching the PDP.
 * - NULL stock (unknown) passes the stock check; only a numeric
 *   stock < quantity blocks.
 * - productId fallback picks the cheapest priceGross variant.
 * - supplier: offers.supplierId, else STOREFRONT_FALLBACK_SUPPLIER (name),
 *   else explicit supplier_unresolved error (no silent drops / fake 500s).
 */
import { describe, expect, it, beforeAll, afterAll, vi } from 'vitest';
import path from 'path';
import { eq } from 'drizzle-orm';
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
    suppliers,
    offers,
} from '@platform/database/schema';
import { resolveCheckoutLineItems } from './checkout-line-items';

const RUN = `g1c${Date.now().toString(36)}`;
const DRIZZLE_DIR = path.resolve(process.cwd(), 'packages/database/drizzle');

describe('W23-S1/G1 cart path: checkout line resolution (pglite)', () => {
    let store: { id: string; slug: string };
    let pNull: { id: string };
    let pZero: { id: string };
    let pMulti: { id: string };
    let vNull: { id: string };
    let vZero: { id: string };
    let vMultiCheap: { id: string };
    let fallbackSupplier: { id: string; name: string };

    beforeAll(async () => {
        await migrate(db, { migrationsFolder: DRIZZLE_DIR });

        [store] = await db.insert(stores).values({
            name: `G1C Store ${RUN}`,
            slug: `g1c-store-${RUN}`,
            storeKey: `g1c_store_${RUN}`,
        }).returning();

        [fallbackSupplier] = await db.insert(suppliers).values({
            name: `G1C Fallback Supplier ${RUN}`,
            integrationType: 'feed_csv',
        }).returning();

        const [category] = await db.insert(categories).values({
            name: `G1C Cat ${RUN}`,
            slug: `g1c-cat-${RUN}`,
            path: `root/g1c-cat-${RUN}`,
        }).returning();

        [pNull] = await db.insert(products).values({
            titleEn: `G1C Null Product ${RUN}`,
            titleLt: `G1C Null Produktas ${RUN}`,
            status: 'published',
            categoryId: category.id,
        }).returning();
        [pZero] = await db.insert(products).values({
            titleEn: `G1C Zero Product ${RUN}`,
            titleLt: `G1C Zero Produktas ${RUN}`,
            status: 'published',
            categoryId: category.id,
        }).returning();
        [pMulti] = await db.insert(products).values({
            titleEn: `G1C Multi Product ${RUN}`,
            titleLt: `G1C Multi Produktas ${RUN}`,
            status: 'published',
            categoryId: category.id,
        }).returning();

        const inserted = await db.insert(variants).values([
            { productId: pNull.id, sku: `G1C-NULL-${RUN}`, priceGross: 2043, stock: null },           // stock NULL
            { productId: pZero.id, sku: `G1C-ZERO-${RUN}`, priceGross: 999, stock: 0 },                // placeholder 0 (CSV has no stock column)
            { productId: pMulti.id, sku: `G1C-M-CHEAP-${RUN}`, priceGross: 1500, stock: null },
            { productId: pMulti.id, sku: `G1C-M-PRICY-${RUN}`, priceGross: 3500, stock: 10 },
        ]).returning();
        vNull = inserted.find((v: any) => v.sku === `G1C-NULL-${RUN}`)!;
        vZero = inserted.find((v: any) => v.sku === `G1C-ZERO-${RUN}`)!;
        vMultiCheap = inserted.find((v: any) => v.sku === `G1C-M-CHEAP-${RUN}`)!;

        await db.insert(productStores).values([
            { productId: pNull.id, storeId: store.id, isActive: true },
            { productId: pZero.id, storeId: store.id, isActive: true },
            { productId: pMulti.id, storeId: store.id, isActive: true },
        ]);

        process.env.STORE_SLUG = store.slug;
        process.env.STOREFRONT_FALLBACK_SUPPLIER = fallbackSupplier.name;
    }, 120_000);

    afterAll(() => {
        delete process.env.STOREFRONT_FALLBACK_SUPPLIER;
    });

    it('NULL-stock variant resolves (not dropped, not out-of-stock) and prices from priceGross', async () => {
        const res = await resolveCheckoutLineItems([{ variantId: vNull.id, quantity: 3 }]);
        expect(res.ok).toBe(true);
        if (!res.ok) return;
        expect(res.lineItems.length).toBe(1);
        expect(res.lineItems[0].price).toBe(20.43); // 2043 cents → EUR, same as PDP
        expect(res.subtotal).toBeCloseTo(61.29, 2);
    });

    it('placeholder stock=0 passes by default (unknown supplier stock, B2B confirmation flow)', async () => {
        const res = await resolveCheckoutLineItems([{ variantId: vZero.id, quantity: 1 }]);
        expect(res.ok).toBe(true);
        if (!res.ok) return;
        expect(res.lineItems[0].price).toBe(9.99);
    });

    it('trusted stock=0 (STOREFRONT_TRUST_VARIANT_STOCK=1) is blocked with Out of stock', async () => {
        process.env.STOREFRONT_TRUST_VARIANT_STOCK = '1';
        try {
            const res = await resolveCheckoutLineItems([{ variantId: vZero.id, quantity: 1 }]);
            expect(res.ok).toBe(false);
            if (res.ok) return;
            expect(res.status).toBe(400);
            expect(String(res.error)).toMatch(/out of stock/i);
        } finally {
            delete process.env.STOREFRONT_TRUST_VARIANT_STOCK;
        }
    });

    it('known stock>0 below quantity is blocked; sufficient stock passes', async () => {
        const [pricy] = await db.select().from(variants).where(eq(variants.sku, `G1C-M-PRICY-${RUN}`));
        const blocked = await resolveCheckoutLineItems([{ variantId: pricy.id, quantity: 9999 }]);
        expect(blocked.ok).toBe(false);
        if (!blocked.ok) expect(blocked.status).toBe(400);
        // NULL stock = unknown = allowed regardless of quantity
        const okRes = await resolveCheckoutLineItems([{ variantId: vMultiCheap.id, quantity: 9999 }]);
        expect(okRes.ok).toBe(true);
    });

    it('productId fallback picks the cheapest priceGross variant', async () => {
        const res = await resolveCheckoutLineItems([{ id: pMulti.id, quantity: 1 }]);
        expect(res.ok).toBe(true);
        if (!res.ok) return;
        expect(res.lineItems[0].sku).toBe(`G1C-M-CHEAP-${RUN}`);
        expect(res.lineItems[0].price).toBe(15.00);
    });

    it('supplier resolution: falls back to STOREFRONT_FALLBACK_SUPPLIER when no offer row exists', async () => {
        const res = await resolveCheckoutLineItems([{ variantId: vNull.id, quantity: 1 }]);
        expect(res.ok).toBe(true);
        if (!res.ok) return;
        const supplierIds = Object.keys(res.supplierGroups);
        expect(supplierIds).toEqual([fallbackSupplier.id]);
    });

    it('offers.supplierId wins when an EAN-matched offer exists', async () => {
        // Give the pricy variant an EAN + offer with a DIFFERENT price: price
        // must still come from variants.priceGross, supplier from the offer.
        const ean = `EAN${RUN}X1`;
        await db.update(variants).set({ ean }).where(eq(variants.sku, `G1C-M-PRICY-${RUN}`));
        const [offerSupplier] = await db.insert(suppliers).values({
            name: `G1C Offer Supplier ${RUN}`,
            integrationType: 'feed_csv',
        }).returning();
        await db.insert(offers).values({
            externalId: `EXT-${RUN}-X1`,
            ean,
            supplierId: offerSupplier.id,
            price: '9.99',
            stockQty: 100,
        });

        const [pricy] = await db.select().from(variants).where(eq(variants.sku, `G1C-M-PRICY-${RUN}`));
        const res = await resolveCheckoutLineItems([{ variantId: pricy.id, quantity: 1 }]);
        expect(res.ok).toBe(true);
        if (!res.ok) return;
        expect(res.lineItems[0].price).toBe(35.00); // priceGross 3500, NOT offers.price 9.99
        expect(Object.keys(res.supplierGroups)).toEqual([offerSupplier.id]);
    });

    it('no supplier resolvable and no fallback env → explicit error, never silent drop', async () => {
        const saved = process.env.STOREFRONT_FALLBACK_SUPPLIER;
        delete process.env.STOREFRONT_FALLBACK_SUPPLIER;
        try {
            const res = await resolveCheckoutLineItems([{ variantId: vNull.id, quantity: 1 }]);
            expect(res.ok).toBe(false);
            if (!res.ok) {
                expect(res.status).toBe(409);
                expect(res.error).toBe('supplier_unresolved');
            }
        } finally {
            process.env.STOREFRONT_FALLBACK_SUPPLIER = saved;
        }
    });
});
