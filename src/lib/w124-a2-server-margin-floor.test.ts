// W124-A2: server-side margin floor for bulk_edit_apply / csv_import_apply
// (mirrors the client preview guardrail flagged in W123-S3 R2).
import { describe, test, expect, beforeEach, afterEach } from 'vitest';

import {
    resolveMarginFloorPct,
    enforceBulkEditMarginFloor,
    enforceCsvImportMarginFloor,
    buildCatalogCostIndex,
} from './admin-server-margin-floor';
import { readCatalogOverrides } from './giles-catalog-snapshot';
import { POST } from '../app/api/admin/products/route';

const norm = (sku: string) => sku.toLowerCase().replace(/[^a-z0-9]/g, '');

function adminPost(body: unknown): Promise<Response> {
    return POST(
        new Request('http://localhost/api/admin/products', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        }),
    );
}

// gross 121 -> net 100 at 21% VAT; cost 86 -> 14.0% margin, cost 85 -> 15.0%.
function costIndex(entries: Record<string, number | null>) {
    const map = new Map<string, { name: string; costPriceEur: number | null; inCatalog: boolean }>();
    for (const [sku, costPriceEur] of Object.entries(entries)) {
        map.set(sku, { name: `Prekė ${sku}`, costPriceEur, inCatalog: true });
    }
    return map;
}

describe('W124-A2 resolveMarginFloorPct (env BULK_MARGIN_FLOOR_PCT)', () => {
    afterEach(() => {
        delete process.env.BULK_MARGIN_FLOOR_PCT;
    });

    test('defaults to 15 when unset, empty or garbage', () => {
        expect(resolveMarginFloorPct({})).toBe(15);
        expect(resolveMarginFloorPct({ BULK_MARGIN_FLOOR_PCT: '' })).toBe(15);
        expect(resolveMarginFloorPct({ BULK_MARGIN_FLOOR_PCT: 'abc' })).toBe(15);
    });

    test('accepts valid overrides and rejects negatives', () => {
        expect(resolveMarginFloorPct({ BULK_MARGIN_FLOOR_PCT: '40' })).toBe(40);
        expect(resolveMarginFloorPct({ BULK_MARGIN_FLOOR_PCT: '2.5' })).toBe(2.5);
        expect(resolveMarginFloorPct({ BULK_MARGIN_FLOOR_PCT: '0' })).toBe(0);
        expect(resolveMarginFloorPct({ BULK_MARGIN_FLOOR_PCT: '-3' })).toBe(15);
    });
});

describe('W124-A2 enforceBulkEditMarginFloor', () => {
    test('rejects below-floor price rows with the preview blockReason shape', () => {
        const { applicable, rejected } = enforceBulkEditMarginFloor(
            [{ sku: 'SKU-1', priceGrossEur: 121 }],
            costIndex({ sku1: 86 }),
            15,
        );
        expect(applicable).toHaveLength(0);
        expect(rejected).toHaveLength(1);
        expect(rejected[0]).toMatchObject({
            sku: 'SKU-1',
            name: 'Prekė sku1',
            priceGrossEur: 121,
            marginPct: 14,
            floorPct: 15,
        });
        expect(rejected[0].blockReason).toBe(
            'Apsaugiklis: marža po keitimo 14.0% < 15% minimumo',
        );
    });

    test('applies at-floor and above-floor rows', () => {
        const { applicable, rejected } = enforceBulkEditMarginFloor(
            [
                { sku: 'SKU-1', priceGrossEur: 121 },
                { sku: 'SKU-2', priceGrossEur: 242 },
            ],
            costIndex({ sku1: 85, sku2: 86 }),
            15,
        );
        expect(rejected).toHaveLength(0);
        expect(applicable.map((e) => e.sku)).toEqual(['SKU-1', 'SKU-2']);
    });

    test('exempts price-on-request (null cost), unknown SKUs and non-price edits', () => {
        const { applicable, rejected } = enforceBulkEditMarginFloor(
            [
                { sku: 'NOCOST', priceGrossEur: 10 },
                { sku: 'UNKNOWN', priceGrossEur: 10 },
                { sku: 'SKU-1', stockQuantity: 5 },
                { sku: 'SKU-1', category: 'Katilinės įranga' },
            ],
            costIndex({ nocost: null, sku1: 86 }),
            15,
        );
        expect(rejected).toHaveLength(0);
        expect(applicable).toHaveLength(4);
    });

    test('mixed batch: valid rows still apply while floor-violating rows are rejected', () => {
        const { applicable, rejected } = enforceBulkEditMarginFloor(
            [
                { sku: 'GOOD', priceGrossEur: 121 },
                { sku: 'BAD', priceGrossEur: 100 },
            ],
            costIndex({ good: 85, bad: 86 }),
            15,
        );
        expect(applicable.map((e) => e.sku)).toEqual(['GOOD']);
        expect(rejected.map((r) => r.sku)).toEqual(['BAD']);
    });
});

describe('W124-A2 enforceCsvImportMarginFloor', () => {
    test('rejects below-floor prices for existing SKUs, applies at-floor', () => {
        const result = enforceCsvImportMarginFloor(
            [
                { sku: 'SKU-1', name: 'A', priceGrossEur: 121 },
                { sku: 'SKU-2', name: 'B', priceGrossEur: 121 },
            ],
            costIndex({ sku1: 86, sku2: 85 }),
            15,
        );
        expect(result.applicable.map((r) => r.sku)).toEqual(['SKU-2']);
        expect(result.rejected).toHaveLength(1);
        expect(result.rejected[0].sku).toBe('SKU-1');
        expect(result.rejected[0].marginPct).toBe(14);
    });

    test('new SKUs use the 65%-of-net default cost rule (35% margin) like the dry-run', () => {
        const at15 = enforceCsvImportMarginFloor(
            [{ sku: 'BRANDNEW', name: 'Nauja', priceGrossEur: 121 }],
            costIndex({}),
            15,
        );
        expect(at15.rejected).toHaveLength(0);
        expect(at15.applicable).toHaveLength(1);

        const at40 = enforceCsvImportMarginFloor(
            [{ sku: 'BRANDNEW', name: 'Nauja', priceGrossEur: 121 }],
            costIndex({}),
            40,
        );
        expect(at40.applicable).toHaveLength(0);
        expect(at40.rejected[0].marginPct).toBe(35);
        expect(at40.rejected[0].floorPct).toBe(40);
    });

    test('exempts price-on-request rows (catalog cost null)', () => {
        const { applicable, rejected } = enforceCsvImportMarginFloor(
            [{ sku: 'NOCOST', name: 'A', priceGrossEur: 5 }],
            costIndex({ nocost: null }),
            15,
        );
        expect(rejected).toHaveLength(0);
        expect(applicable).toHaveLength(1);
    });
});

describe('W124-A2 buildCatalogCostIndex', () => {
    test('override cost wins, then override costEur, then raw costCents, else null; EAN alias added', () => {
        const snap = {
            allProductsIncludingHidden: [
                { id: 'p1', sku: 'A-1', name: 'Alpha', nameLt: null },
                { id: 'p2', sku: 'B-1', name: 'Beta', nameLt: 'Beta LT' },
                { id: 'p3', sku: 'C-1', name: 'Gamma', nameLt: null },
            ],
            rawById: new Map([
                ['p1', { ean: '4770001000001', costCents: 8600 }],
                ['p2', { ean: '4770001000002', costCents: null }],
                ['p3', { ean: null, costCents: 5000 }],
            ]),
        };
        const store = {
            overrides: {
                a1: { costPriceEur: 90 },
                b1: { costEur: 70 },
            },
            customProducts: [],
        };
        const index = buildCatalogCostIndex(snap as never, store as never);
        expect(index.get('a1')?.costPriceEur).toBe(90);
        expect(index.get('b1')?.costPriceEur).toBe(70);
        expect(index.get('c1')?.costPriceEur).toBe(50);
        expect(index.get('4770001000001')?.costPriceEur).toBe(90);
        expect(index.get('b1')?.name).toBe('Beta LT');
    });

    test('custom products contribute their stored cost even without raw entries', () => {
        const snap = {
            allProductsIncludingHidden: [],
            rawById: new Map(),
        };
        const store = {
            overrides: {},
            customProducts: [
                { sku: 'W124-CUST', name: 'Custom', costPriceEur: 65 },
            ],
        };
        const index = buildCatalogCostIndex(snap as never, store as never);
        expect(index.get('w124cust')).toMatchObject({ costPriceEur: 65, inCatalog: true });
    });
});

describe('W124-A2 server actions enforce the floor (route-level)', () => {
    beforeEach(async () => {
        await adminPost({ action: 'reset_overrides' });
    });
    afterEach(() => {
        delete process.env.BULK_MARGIN_FLOOR_PCT;
    });

    test('bulk_edit_apply rejects below-floor row and applies at-floor row', async () => {
        await adminPost({
            action: 'create_product',
            sku: 'W124-A2-T1',
            name: 'Maržos testas 1',
            priceGrossEur: 121,
            costPriceEur: 65,
        });

        const rejectedRes = await adminPost({
            action: 'bulk_edit_apply',
            edits: [{ sku: 'W124-A2-T1', priceGrossEur: 92 }],
        });
        const rejectedData = await rejectedRes.json();
        expect(rejectedData.ok).toBe(true);
        expect(rejectedData.appliedCount).toBe(0);
        expect(rejectedData.rejectedCount).toBe(1);
        expect(rejectedData.rejected[0]).toMatchObject({ sku: 'W124-A2-T1', marginPct: 14.5 });
        expect(rejectedData.rejected[0].blockReason).toContain('Apsaugiklis');
        // Below-floor row must not be written: no override created for the custom SKU.
        expect(readCatalogOverrides().overrides[norm('W124-A2-T1')]).toBeUndefined();

        const appliedRes = await adminPost({
            action: 'bulk_edit_apply',
            edits: [{ sku: 'W124-A2-T1', priceGrossEur: 93 }],
        });
        const appliedData = await appliedRes.json();
        expect(appliedData.appliedCount).toBe(1);
        expect(appliedData.rejectedCount).toBe(0);
        expect(readCatalogOverrides().overrides[norm('W124-A2-T1')]?.priceGrossEur).toBe(93);
    });

    test('csv_import_apply rejects below-floor updates, still creates healthy new SKUs', async () => {
        await adminPost({
            action: 'create_product',
            sku: 'W124-A2-T2',
            name: 'Maržos testas 2',
            priceGrossEur: 121,
            costPriceEur: 65,
        });

        const rejectedRes = await adminPost({
            action: 'csv_import_apply',
            rows: [{ sku: 'W124-A2-T2', name: 'Maržos testas 2', priceGrossEur: 92, stockQuantity: 3 }],
        });
        const rejectedData = await rejectedRes.json();
        expect(rejectedData.ok).toBe(true);
        expect(rejectedData.updatedCount).toBe(0);
        expect(rejectedData.rejectedCount).toBe(1);
        expect(rejectedData.rejected[0].sku).toBe('W124-A2-T2');
        expect(readCatalogOverrides().overrides[norm('W124-A2-T2')]).toBeUndefined();

        const appliedRes = await adminPost({
            action: 'csv_import_apply',
            rows: [
                { sku: 'W124-A2-T2', name: 'Maržos testas 2', priceGrossEur: 93, stockQuantity: 3 },
                { sku: 'W124-A2-NEW', name: 'Nauja iš CSV', priceGrossEur: 121, stockQuantity: 1 },
            ],
        });
        const appliedData = await appliedRes.json();
        expect(appliedData.updatedCount).toBe(1);
        expect(appliedData.createdCount).toBe(1);
        expect(appliedData.rejectedCount).toBe(0);
        expect(readCatalogOverrides().overrides[norm('W124-A2-T2')]?.priceGrossEur).toBe(93);
    });

    test('BULK_MARGIN_FLOOR_PCT env raises and lowers the server-side floor', async () => {
        process.env.BULK_MARGIN_FLOOR_PCT = '40';
        const raised = await adminPost({
            action: 'csv_import_apply',
            rows: [{ sku: 'W124-A2-HIGH', name: 'Aukšta riba', priceGrossEur: 121, stockQuantity: 1 }],
        });
        const raisedData = await raised.json();
        expect(raisedData.createdCount).toBe(0);
        expect(raisedData.rejectedCount).toBe(1);
        expect(raisedData.rejected[0].floorPct).toBe(40);

        process.env.BULK_MARGIN_FLOOR_PCT = '5';
        await adminPost({
            action: 'create_product',
            sku: 'W124-A2-T3',
            name: 'Maržos testas 3',
            priceGrossEur: 121,
            costPriceEur: 65,
        });
        const lowered = await adminPost({
            action: 'bulk_edit_apply',
            edits: [{ sku: 'W124-A2-T3', priceGrossEur: 92 }],
        });
        const loweredData = await lowered.json();
        expect(loweredData.appliedCount).toBe(1);
        expect(loweredData.rejectedCount).toBe(0);
    });
});
