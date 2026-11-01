// W121-A2: server-side live catalog SKU count for the dynamic count mandate
// (hero/footer/category headers/SEO must never hardcode 6337 again).
// W121-F1: live in-stock count for honest admin summaries (never 3659 again).
import { getGilesCatalogProducts } from './giles-catalog-snapshot';
import { resolveHonestAvailability } from './w121-honest-commerce';

export function getGilesCatalogSkuCount(): number | null {
    try {
        return getGilesCatalogProducts().length;
    } catch {
        return null;
    }
}

export function getGilesCatalogInStockCount(): number | null {
    try {
        return getGilesCatalogProducts().filter(
            (p) => resolveHonestAvailability(p) === 'in_stock',
        ).length;
    } catch {
        return null;
    }
}
