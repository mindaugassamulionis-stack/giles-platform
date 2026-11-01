// W124-A2: server-side mirror of the admin margin guardrail (W123-S3 R2).
// bulk_edit_apply / csv_import_apply must enforce the same floor the client
// preview enforces; price-on-request rows (no known cost) are exempt.
import { computeMarginPct, BULK_MARGIN_FLOOR_PCT, BULK_VAT_RATE } from './admin-bulk-edit';

export interface BulkEditApplyEdit {
    sku: string;
    priceGrossEur?: number;
    stockQuantity?: number;
    category?: string;
}

export interface CsvImportApplyRow {
    sku: string;
    name?: string;
    priceGrossEur: number;
    stockQuantity?: number;
    brandName?: string;
    ean?: string;
    category?: string;
}

export interface CatalogCostIndexEntry {
    name: string;
    costPriceEur: number | null;
    inCatalog: boolean;
}

export interface MarginFloorRejection {
    sku: string;
    name: string;
    priceGrossEur: number;
    marginPct: number;
    floorPct: number;
    blockReason: string;
}

// Same default-cost share as create_product and the CSV dry-run (65% of net).
const CSV_NEW_PRODUCT_COST_NET_SHARE = 0.65;

export function resolveMarginFloorPct(env: NodeJS.ProcessEnv = process.env): number {
    const raw = (env.BULK_MARGIN_FLOOR_PCT || '').trim();
    const parsed = Number(raw);
    return raw !== '' && Number.isFinite(parsed) && parsed >= 0
        ? parsed
        : BULK_MARGIN_FLOOR_PCT;
}

// Must stay identical to normalizeCode in src/app/api/admin/products/route.ts.
export function normalizeSkuCode(code: string): string {
    return (code || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function round2(value: number): number {
    return Math.round(value * 100) / 100;
}

function rejectIfBelowFloor(
    sku: string,
    name: string,
    priceGrossEur: number,
    costPriceEur: number,
    floorPct: number,
): MarginFloorRejection | null {
    const marginPct = computeMarginPct(priceGrossEur, costPriceEur);
    if (marginPct >= floorPct) return null;
    return {
        sku,
        name,
        priceGrossEur,
        marginPct,
        floorPct,
        blockReason: `Apsaugiklis: marža po keitimo ${marginPct.toFixed(1)}% < ${floorPct}% minimumo`,
    };
}

export function enforceBulkEditMarginFloor(
    edits: BulkEditApplyEdit[],
    catalogCosts: Map<string, CatalogCostIndexEntry>,
    floorPct: number,
): { applicable: BulkEditApplyEdit[]; rejected: MarginFloorRejection[] } {
    const applicable: BulkEditApplyEdit[] = [];
    const rejected: MarginFloorRejection[] = [];
    for (const edit of edits) {
        const sku = String(edit?.sku || '').trim();
        if (!sku) continue;
        if (edit.priceGrossEur == null || !Number.isFinite(Number(edit.priceGrossEur))) {
            applicable.push(edit);
            continue;
        }
        const price = Math.max(0.01, round2(Number(edit.priceGrossEur)));
        const entry = catalogCosts.get(normalizeSkuCode(sku));
        if (!entry || entry.costPriceEur == null) {
            applicable.push(edit);
            continue;
        }
        const rejection = rejectIfBelowFloor(sku, entry.name || sku, price, entry.costPriceEur, floorPct);
        if (rejection) rejected.push(rejection);
        else applicable.push(edit);
    }
    return { applicable, rejected };
}

export function enforceCsvImportMarginFloor(
    rows: CsvImportApplyRow[],
    catalogCosts: Map<string, CatalogCostIndexEntry>,
    floorPct: number,
): { applicable: CsvImportApplyRow[]; rejected: MarginFloorRejection[] } {
    const applicable: CsvImportApplyRow[] = [];
    const rejected: MarginFloorRejection[] = [];
    for (const row of rows) {
        const sku = String(row?.sku || '').trim();
        if (!sku) continue;
        const price = Math.max(0.01, round2(Number(row.priceGrossEur || 0)));
        const entry = catalogCosts.get(normalizeSkuCode(sku));
        const cost =
            entry?.costPriceEur != null
                ? entry.costPriceEur
                : (price / BULK_VAT_RATE) * CSV_NEW_PRODUCT_COST_NET_SHARE;
        const rejection = rejectIfBelowFloor(
            sku,
            String(row.name || entry?.name || sku),
            price,
            cost,
            floorPct,
        );
        if (rejection) rejected.push(rejection);
        else applicable.push(row);
    }
    return { applicable, rejected };
}

export function buildCatalogCostIndex(
    snap: {
        allProductsIncludingHidden?: Array<{ id: string; sku: string; name: string; nameLt: string | null }>;
        products?: Array<{ id: string; sku: string; name: string; nameLt: string | null }>;
        rawById: Map<string, { ean?: string | null; costCents?: number | null }>;
    },
    store: {
        overrides: Record<string, { costPriceEur?: number | null; costEur?: number | null }>;
        customProducts: Array<{ sku: string; name: string; costPriceEur?: number | null }>;
    },
): Map<string, CatalogCostIndexEntry> {
    const index = new Map<string, CatalogCostIndexEntry>();
    for (const cp of store.customProducts) {
        const key = normalizeSkuCode(cp.sku);
        if (!key) continue;
        index.set(key, {
            name: cp.name,
            costPriceEur: cp.costPriceEur != null ? Number(cp.costPriceEur) : null,
            inCatalog: true,
        });
    }
    const allList = snap.allProductsIncludingHidden || snap.products || [];
    for (const p of allList) {
        const key = normalizeSkuCode(p.sku);
        if (!key) continue;
        const override =
            store.overrides[key] || store.overrides[p.sku] || store.overrides[p.id];
        const overrideCost =
            override?.costPriceEur != null
                ? Number(override.costPriceEur)
                : override?.costEur != null
                  ? Number(override.costEur)
                  : null;
        const raw = snap.rawById.get(p.id);
        const rawCost =
            raw?.costCents != null && raw.costCents > 0 ? raw.costCents / 100 : null;
        const entry: CatalogCostIndexEntry = {
            name: p.nameLt || p.name || p.sku,
            costPriceEur: overrideCost ?? index.get(key)?.costPriceEur ?? rawCost,
            inCatalog: true,
        };
        index.set(key, entry);
        const normEan = normalizeSkuCode(raw?.ean || '');
        if (normEan && !index.has(normEan)) index.set(normEan, entry);
    }
    return index;
}
