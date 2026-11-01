// W123-A1: bulk editor diff / undo / margin guardrail for the admin product table.
// Margin floor mirrors the shop rule used across the admin: net = gross / VAT, margin >= 15%.

export type BulkEditOperation =
    | { kind: 'price_percent'; percent: number }
    | { kind: 'price_set'; priceGrossEur: number }
    | { kind: 'availability'; stockQuantity: number }
    | { kind: 'category'; category: string };

export interface BulkEditRowInput {
    sku: string;
    name: string;
    priceGrossEur: number;
    costPriceEur: number;
    stockQuantity: number;
    category?: string;
}

export type BulkEditField = 'priceGrossEur' | 'stockQuantity' | 'category';

export interface BulkEditDiff {
    sku: string;
    name: string;
    field: BulkEditField;
    before: number | string;
    after: number | string;
    marginBeforePct: number;
    marginAfterPct: number;
    blocked: boolean;
    blockReason: string;
}

export interface BulkEditPreview {
    diffs: BulkEditDiff[];
    applicableCount: number;
    blockedCount: number;
}

export interface BulkEditUndoItem {
    sku: string;
    priceGrossEur?: number;
    stockQuantity?: number;
    category?: string;
}

export const BULK_MARGIN_FLOOR_PCT = 15;
export const BULK_VAT_RATE = 1.21;

export function computeMarginPct(priceGrossEur: number, costPriceEur: number, vatRate = BULK_VAT_RATE): number {
    const net = priceGrossEur > 0 ? priceGrossEur / vatRate : 0;
    if (net <= 0) return 0;
    return Math.round(((net - costPriceEur) / net) * 1000) / 10;
}

function round2(value: number): number {
    return Math.round(value * 100) / 100;
}

export function computeBulkEditPreview(
    rows: BulkEditRowInput[],
    selectedSkus: string[],
    op: BulkEditOperation,
    opts?: { marginFloorPct?: number },
): BulkEditPreview {
    const floor = opts?.marginFloorPct ?? BULK_MARGIN_FLOOR_PCT;
    const selected = new Set(selectedSkus);
    const diffs: BulkEditDiff[] = [];

    for (const row of rows) {
        if (!selected.has(row.sku)) continue;
        const marginBefore = computeMarginPct(row.priceGrossEur, row.costPriceEur);

        if (op.kind === 'price_percent' || op.kind === 'price_set') {
            const after =
                op.kind === 'price_set'
                    ? round2(Math.max(0.01, op.priceGrossEur))
                    : round2(Math.max(0.01, row.priceGrossEur * (1 + op.percent / 100)));
            const marginAfter = computeMarginPct(after, row.costPriceEur);
            const blocked = marginAfter < floor;
            diffs.push({
                sku: row.sku,
                name: row.name,
                field: 'priceGrossEur',
                before: row.priceGrossEur,
                after,
                marginBeforePct: marginBefore,
                marginAfterPct: marginAfter,
                blocked,
                blockReason: blocked
                    ? `Apsaugiklis: marža po keitimo ${marginAfter.toFixed(1)}% < ${floor}% minimumo`
                    : '',
            });
        } else if (op.kind === 'availability') {
            diffs.push({
                sku: row.sku,
                name: row.name,
                field: 'stockQuantity',
                before: row.stockQuantity,
                after: Math.max(0, Math.round(op.stockQuantity)),
                marginBeforePct: marginBefore,
                marginAfterPct: marginBefore,
                blocked: false,
                blockReason: '',
            });
        } else {
            diffs.push({
                sku: row.sku,
                name: row.name,
                field: 'category',
                before: row.category || '',
                after: op.category,
                marginBeforePct: marginBefore,
                marginAfterPct: marginBefore,
                blocked: false,
                blockReason: '',
            });
        }
    }

    return {
        diffs,
        applicableCount: diffs.filter((d) => !d.blocked).length,
        blockedCount: diffs.filter((d) => d.blocked).length,
    };
}

export function buildUndoPayload(diffs: BulkEditDiff[]): BulkEditUndoItem[] {
    return diffs
        .filter((d) => !d.blocked)
        .map((d) =>
            d.field === 'priceGrossEur'
                ? { sku: d.sku, priceGrossEur: Number(d.before) }
                : d.field === 'stockQuantity'
                  ? { sku: d.sku, stockQuantity: Number(d.before) }
                  : { sku: d.sku, category: String(d.before) },
        );
}
