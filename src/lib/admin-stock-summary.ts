// WP-W121-F1: honest admin catalog/stock summary. The admin overview used to
// hardcode "3 659 pozicijos sandėlyje"; build the line from live counts and
// omit the stock segment when the warehouse count is unknown.
import { formatCatalogCount } from './w121-honest-commerce';

export function formatAdminCatalogStockSummary(
    skuCount: number | null | undefined,
    inStockCount: number | null | undefined,
): string {
    const total = typeof skuCount === 'number' && skuCount > 0 ? skuCount : null;
    if (!total) return '';
    const inStock = typeof inStockCount === 'number' && inStockCount > 0 ? inStockCount : null;
    const positions = `${formatCatalogCount(total, 'lt')} pozicijos`;
    return inStock === null
        ? positions
        : `${positions} · ${formatCatalogCount(inStock, 'lt')} sandėlyje (Kaunas)`;
}
