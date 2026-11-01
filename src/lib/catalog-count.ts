// W121-A2: server-side live catalog SKU count for the dynamic count mandate
// (hero/footer/category headers/SEO must never hardcode 6337 again).
import { getGilesCatalogProducts } from './giles-catalog-snapshot';

export function getGilesCatalogSkuCount(): number | null {
    try {
        return getGilesCatalogProducts().length;
    } catch {
        return null;
    }
}
