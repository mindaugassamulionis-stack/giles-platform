// W124-A1 (F1.1): vedlio kainų šaltinis. Pirmiausia gyvas 13 531 SKU katalogas
// (giles-catalog-snapshot), prireikus – papildomas Gilės komponentų sąrašas
// (vedlys-components.lt.json). Klientui tokios eilutės žymimos „prielaida“.
import rulesJson from '../data/vedlys-rules.lt.json';
import componentsJson from '../data/vedlys-components.lt.json';
import { getGilesCatalogProducts } from './giles-catalog-snapshot';
import type { Rules } from './vedlys-calc';

export interface WizardLineMeta {
    sku: string;
    label: string;
    price: number;
    priceSource: string;
    availability: 'in_stock' | 'supplier_2_4d' | 'on_request' | 'site';
    href?: string;
}

export interface WizardCatalog {
    rules: Rules;
    prices: Record<string, number>;
    lines: Record<string, WizardLineMeta>;
    assumptions: string[];
}

let cached: WizardCatalog | null = null;

export function getVedlysWizardCatalog(): WizardCatalog {
    if (cached) return cached;
    const rules = rulesJson as unknown as Rules;
    const lines: Record<string, WizardLineMeta> = {};
    const prices: Record<string, number> = {};
    const assumptions: string[] = [];

    // 1. Gyvas katalogas: degikliai ir priedai su tikra kaina bei likučiu.
    for (const p of getGilesCatalogProducts()) {
        const sku = (p.sku ?? '').toUpperCase();
        if (!sku) continue;
        const known =
            rules.burners.some((b) => b.sku === sku) ||
            sku === 'AUTOMATIC-CLEANING-SYSTEM-NANI-35';
        if (!known || prices[sku] != null) continue;
        const price = p.priceEur ?? (typeof p.price === 'number' ? p.price : null);
        if (price == null) continue;
        prices[sku] = price;
        lines[sku] = {
            sku,
            label: p.name ?? sku,
            price,
            priceSource: 'catalog',
            availability: p.availability ?? 'supplier_2_4d',
            href: p.slug ? `/lt/products/${p.slug}` : undefined,
        };
    }

    // 2. Papildomi Gilės komponentai, kurių kataloge dar nėra.
    for (const c of componentsJson.components) {
        if (prices[c.sku] != null) continue;
        prices[c.sku] = c.gross_eur;
        lines[c.sku] = {
            sku: c.sku,
            label: c.label,
            price: c.gross_eur,
            priceSource: c.price_source,
            availability: 'site',
        };
        if (c.price_source === 'assumption') assumptions.push(c.sku);
    }

    cached = { rules, prices, lines, assumptions };
    return cached;
}

export function invalidateVedlysWizardCatalogCache(): void {
    cached = null;
}
