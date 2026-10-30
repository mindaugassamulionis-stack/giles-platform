// W23-S1 / G1 cart path (P0): checkout line resolution extracted from
// api/checkout/route.ts so the purchase path cannot re-block unknown stock.
//
// Old behavior (route-local): lines resolved via
//   innerJoin(offers, eq(offers.ean, variants.ean))
// — with ean empty the inner join returned no row → item silently dropped
// (order total 0 → 400 "Invalid total amount"); and `stockQty < quantity`
// with stockQty null (0-coerced) → 400 "Out of stock". Both blocked every
// purchase of the supplier catalog.
//
// New contract:
// - price/stock/sku/name resolve from variants + products; offers is a LEFT
//   join used only for supplier grouping.
// - price = variants.priceGross / 100 (cents → EUR) — identical to the PDP.
// - NULL stock (unknown supplier stock) passes; only numeric stock <
//   quantity blocks (explicit imported zero included).
// - supplier: offers.supplierId, else STOREFRONT_FALLBACK_SUPPLIER (name),
//   else explicit 409 supplier_unresolved (never a silent drop).
import { db } from '@platform/database';
import { products, variants, offers, suppliers } from '@platform/database/schema';
import { and, asc, eq } from 'drizzle-orm';
import { resolvePurchasability } from './purchasable';

export interface CheckoutItemInput {
    id?: string;
    variantId?: string;
    quantity: number;
}

export interface ResolvedLineItem {
    variantId: string;
    productId: string;
    sku: string;
    name: string | null;
    price: number; // EUR gross (variants.priceGross / 100)
    quantity: number;
    total: number;
    offerId: string | null;
    supplierId: string;
    ean: string | null;
}

export type LineResolution =
    | {
        ok: true;
        lineItems: ResolvedLineItem[];
        supplierGroups: Record<string, ResolvedLineItem[]>;
        subtotal: number;
    }
    | { ok: false; status: number; error: string; detail?: string };

const lineSelect = {
    variantId: variants.id,
    productId: products.id,
    sku: variants.sku,
    name: products.titleEn,
    priceGross: variants.priceGross,
    stock: variants.stock,
    offerId: offers.id,
    supplierId: offers.supplierId,
    ean: variants.ean,
};

function lineQuery() {
    return db.select(lineSelect)
        .from(variants)
        .innerJoin(products, eq(products.id, variants.productId))
        .leftJoin(offers, eq(offers.ean, variants.ean));
}

async function fallbackSupplierId(): Promise<string | null> {
    const name = process.env.STOREFRONT_FALLBACK_SUPPLIER;
    if (!name) return null;
    const [row] = await db.select({ id: suppliers.id })
        .from(suppliers)
        .where(and(eq(suppliers.name, name), eq(suppliers.isActive, true)))
        .limit(1);
    return row?.id ?? null;
}

export async function resolveCheckoutLineItems(items: CheckoutItemInput[]): Promise<LineResolution> {
    const validLineItems: ResolvedLineItem[] = [];
    const supplierGroups: Record<string, ResolvedLineItem[]> = {};
    let calculatedSubtotal = 0;
    let unresolvedSupplier = false;

    const fallbackId = await fallbackSupplierId().catch(() => null);

    for (const item of items) {
        let row: any;

        if (item.variantId) {
            const rows = await lineQuery().where(eq(variants.id, item.variantId)).limit(1);
            row = rows[0];
        } else if (item.id) {
            // Fallback: cheapest variant (priceGross) of the product.
            const rows = await lineQuery()
                .where(eq(variants.productId, item.id))
                .orderBy(asc(variants.priceGross))
                .limit(1);
            row = rows[0];
        }

        if (!row) {
            return { ok: false, status: 400, error: 'item_not_found', detail: item.variantId || item.id };
        }

        // Stock check shares the storefront purchasability semantics:
        // - stock NULL or placeholder 0 = unknown supplier stock (B2B flow,
        //   see lib/purchasable) → do NOT block unless a trusted stock feed
        //   is enabled.
        // - numeric stock > 0 below the requested quantity blocks.
        const stock = row.stock != null && typeof row.stock === 'number' ? Number(row.stock) : null;
        const purch = resolvePurchasability(stock);
        if (purch.soldOut || (stock != null && stock > 0 && stock < item.quantity)) {
            return {
                ok: false,
                status: 400,
                error: `Out of stock: ${row.name ?? row.sku}`,
            };
        }

        const price = row.priceGross != null ? Number(row.priceGross) / 100 : 0;
        const quantity = item.quantity;
        const total = price * quantity;
        calculatedSubtotal += total;

        const supplierId = row.supplierId ?? fallbackId;
        if (!supplierId) unresolvedSupplier = true;

        const lineItem: ResolvedLineItem = {
            variantId: row.variantId,
            productId: row.productId,
            sku: row.sku,
            name: row.name,
            price,
            quantity,
            total,
            offerId: row.offerId ?? null,
            supplierId: supplierId ?? 'unresolved',
            ean: row.ean ?? null,
        };

        validLineItems.push(lineItem);
        if (supplierId) {
            (supplierGroups[supplierId] ??= []).push(lineItem);
        }
    }

    if (unresolvedSupplier) {
        // Order legs require a real supplier (order_legs.supplier_id NOT NULL
        // FK) — fail explicitly instead of dropping items or faking a 500.
        return {
            ok: false,
            status: 409,
            error: 'supplier_unresolved',
            detail: 'set STOREFRONT_FALLBACK_SUPPLIER to a supplier name',
        };
    }

    return { ok: true, lineItems: validLineItems, supplierGroups, subtotal: calculatedSubtotal };
}
