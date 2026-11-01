/**
 * W123-A2 quick order pad: Grainger Copy&Paste pattern (G1/G2) from the
 * W123-r3 competitor teardown. Installers paste Excel purchasing lists as
 * `SKU<TAB>qty` / `SKU qty` lines; each line resolves against the existing
 * catalog-search-index and lands in the existing cart store.
 */
import { lookupCatalogProductO1, type GilesCatalogProduct } from './catalog-search-index';

export const QUICK_ORDER_MAX_LINES = 200;

export type ParsedQuickOrderLine =
    | { input: string; sku: string; qty: number }
    | { input: string; error: 'invalid_qty' };

export interface ParsedQuickOrderInput {
    lines: ParsedQuickOrderLine[];
    truncated: boolean;
}

export type QuickOrderLookup = (sku: string) => GilesCatalogProduct | undefined;

export type QuickOrderRowStatus = 'found' | 'not_found' | 'price_on_request' | 'invalid_qty';

export interface QuickOrderRow {
    input: string;
    sku: string;
    qty: number;
    status: QuickOrderRowStatus;
    product?: GilesCatalogProduct;
}

export interface QuickOrderCartItem {
    id: string;
    productId: string;
    name: string;
    price: number;
    quantity: number;
    sku: string;
    image?: string;
}

const QTY_PATTERN = /^\d+$/;

/**
 * Parse pasted order text. Splitting happens on the first separator run
 * (tab(s), comma or whitespace) so SKUs with dashes stay intact; a line with
 * only a SKU defaults to quantity 1. Repeated SKUs are merged by summing
 * quantities, and input is capped at QUICK_ORDER_MAX_LINES unique SKUs.
 */
export function parseQuickOrderPadText(text: string): ParsedQuickOrderInput {
    const rawLines = (text || '').replace(/\r\n?/g, '\n').split('\n');
    const bySku = new Map<string, { input: string; sku: string; qty: number }>();
    const ordered: ParsedQuickOrderLine[] = [];
    let truncated = false;

    for (const rawLine of rawLines) {
        if (ordered.length >= QUICK_ORDER_MAX_LINES) {
            truncated = true;
            break;
        }
        const input = rawLine.trim();
        if (!input) continue;

        const split = input.match(/^(\S+)[\t, ]+(.*)$/);
        const sku = split ? split[1] : input;
        const qtyToken = split ? split[2].trim() : '1';

        if (!QTY_PATTERN.test(qtyToken) || Number.parseInt(qtyToken, 10) <= 0) {
            ordered.push({ input, error: 'invalid_qty' });
            continue;
        }

        const qty = Number.parseInt(qtyToken, 10);
        const key = sku.toLowerCase();
        const existing = bySku.get(key);
        if (existing) {
            existing.qty += qty;
        } else {
            const line = { input, sku, qty };
            bySku.set(key, line);
            ordered.push(line);
        }
    }

    return { lines: ordered, truncated };
}

/**
 * Resolve parsed lines against the catalog. Found rows keep the product;
 * W121-A1 price-on-request rows surface as their own status because the cart
 * store refuses them (RFQ flow instead).
 */
export function resolveQuickOrderLines(
    parsed: ParsedQuickOrderInput,
    lookup: QuickOrderLookup = lookupCatalogProductO1,
): QuickOrderRow[] {
    return parsed.lines.map((line) => {
        if ('error' in line) {
            return { input: line.input, sku: line.input.split(/[\t, ]+/)[0] || line.input, qty: 1, status: 'invalid_qty' };
        }
        const product = lookup(line.sku.toLowerCase());
        if (!product) {
            return { input: line.input, sku: line.sku, qty: line.qty, status: 'not_found' };
        }
        if (product.priceOnRequest === true || product.price == null || product.price <= 0) {
            return { input: line.input, sku: line.sku, qty: line.qty, status: 'price_on_request', product };
        }
        return { input: line.input, sku: line.sku, qty: line.qty, status: 'found', product };
    });
}

/**
 * Map resolved rows to the cart store item shape. Only 'found' rows qualify:
 * price-on-request rows go through the RFQ flow, not the standard cart.
 */
export function toQuickOrderCartItems(rows: QuickOrderRow[]): QuickOrderCartItem[] {
    return rows
        .filter((row) => row.status === 'found' && row.product)
        .map((row) => ({
            id: row.product!.id,
            productId: row.product!.id,
            name: row.product!.nameLt || row.product!.name,
            price: row.product!.price,
            quantity: row.qty,
            sku: row.product!.sku || row.sku,
            image: row.product!.imageUrl,
        }));
}
