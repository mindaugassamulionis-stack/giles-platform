import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';

import {
    loadSavedViews,
    persistSavedViews,
    saveSavedView,
    deleteSavedView,
    setDefaultSavedView,
    applySavedView,
    defaultSavedView,
    type AdminSavedView,
    type AdminProductFilters,
} from './admin-saved-views';
import {
    computeBulkEditPreview,
    buildUndoPayload,
    computeMarginPct,
    type BulkEditRowInput,
} from './admin-bulk-edit';
import {
    appendActivityEntries,
    readActivityLog,
    filterActivityLog,
    diffOverrideStores,
    resolveActivityLogPath,
    type AdminActivityEntry,
} from './admin-activity-log';
import {
    detectCsvDelimiter,
    parseCsvRows,
    guessCsvColumnMapping,
    dryRunCsvImport,
    type CsvColumnMapping,
} from './admin-csv-import';

// In-memory localStorage double for saved-view persistence tests.
class MemoryStorage {
    private map = new Map<string, string>();
    getItem(k: string): string | null {
        return this.map.has(k) ? (this.map.get(k) as string) : null;
    }
    setItem(k: string, v: string): void {
        this.map.set(k, v);
    }
}

const BASE_FILTERS: AdminProductFilters = {
    query: '',
    brand: 'danfoss',
    stock: 'low',
    priceMin: null,
    priceMax: 500,
};

describe('W123-A1 saved views (module 6 product table)', () => {
    test('save → load roundtrip through storage', () => {
        const storage = new MemoryStorage();
        const step1 = saveSavedView([], 'Žemos maržos Danfoss', BASE_FILTERS);
        expect(step1.ok).toBe(true);
        persistSavedViews(step1.views, storage);
        const loaded = loadSavedViews(storage);
        expect(loaded).toHaveLength(1);
        expect(loaded[0].name).toBe('Žemos maržos Danfoss');
        expect(loaded[0].filters.brand).toBe('danfoss');
        expect(loaded[0].filters.priceMax).toBe(500);
    });

    test('rejects empty and duplicate names', () => {
        const first = saveSavedView([], 'Vardinis', BASE_FILTERS);
        expect(first.ok).toBe(true);
        expect(saveSavedView([], '', BASE_FILTERS).ok).toBe(false);
        const dup = saveSavedView(first.views, 'Vardinis', BASE_FILTERS);
        expect(dup.ok).toBe(false);
        expect(dup.views).toHaveLength(1);
    });

    test('delete, set default, apply', () => {
        let views: AdminSavedView[] = [];
        views = saveSavedView(views, 'A', { ...BASE_FILTERS, brand: 'herz' }).views;
        views = saveSavedView(views, 'B', { ...BASE_FILTERS, brand: 'haier' }).views;
        const idA = views.find((v) => v.name === 'A')?.id as string;
        const idB = views.find((v) => v.name === 'B')?.id as string;

        views = setDefaultSavedView(views, idA);
        expect(defaultSavedView(views)?.name).toBe('A');
        // Setting a new default clears the previous one.
        views = setDefaultSavedView(views, idB);
        expect(defaultSavedView(views)?.name).toBe('B');
        expect(views.filter((v) => v.isDefault)).toHaveLength(1);

        const applied = applySavedView(views, idA);
        expect(applied?.brand).toBe('herz');

        views = deleteSavedView(views, idA);
        expect(views).toHaveLength(1);
        expect(applySavedView(views, idA)).toBeNull();
    });

    test('loadSavedViews survives corrupted storage payload', () => {
        const storage = new MemoryStorage();
        storage.setItem('giles-admin-product-views-v1', '{not json');
        expect(loadSavedViews(storage)).toEqual([]);
    });
});

describe('W123-A1 bulk edit diff / undo / margin guardrail', () => {
    const rows: BulkEditRowInput[] = [
        { sku: 'SKU-A', name: 'Mazgas A', priceGrossEur: 121, costPriceEur: 50, stockQuantity: 4, category: 'Katilinės įranga' },
        { sku: 'SKU-B', name: 'Mazgas B', priceGrossEur: 121, costPriceEur: 80, stockQuantity: 2, category: 'Katilinės įranga' },
        { sku: 'SKU-C', name: 'Mazgas C', priceGrossEur: 100, costPriceEur: 40, stockQuantity: 9, category: 'Katilinės įranga' },
    ];

    test('price +5% keeps margin-healthy rows and blocks guardrail violators', () => {
        const preview = computeBulkEditPreview(rows, ['SKU-A', 'SKU-B'], { kind: 'price_percent', percent: 5 });
        expect(preview.diffs).toHaveLength(2);
        const a = preview.diffs.find((d) => d.sku === 'SKU-A') as NonNullable<typeof preview.diffs[0]>;
        const b = preview.diffs.find((d) => d.sku === 'SKU-B') as NonNullable<typeof preview.diffs[0]>;
        // A: net 100 → 105, cost 50 → margin ~52.4%, allowed.
        expect(a.blocked).toBe(false);
        expect(a.before).toBe(121);
        expect(a.after).toBeCloseTo(127.05, 2);
        // B: net 100 → 105, cost 80 → margin ~23.8% — still ≥15%, so +5% is fine too.
        expect(b.blocked).toBe(false);
        expect(preview.applicableCount).toBe(2);
        expect(preview.blockedCount).toBe(0);
    });

    test('price −15% drops margin below floor → row blocked and excluded from apply', () => {
        const preview = computeBulkEditPreview(rows, ['SKU-A', 'SKU-B'], { kind: 'price_percent', percent: -15 });
        const b = preview.diffs.find((d) => d.sku === 'SKU-B') as NonNullable<typeof preview.diffs[0]>;
        expect(b.blocked).toBe(true);
        expect(b.blockReason).toContain('marža');
        expect(b.marginAfterPct).toBeLessThan(15);
        expect(preview.blockedCount).toBe(1);
        expect(preview.applicableCount).toBe(1);
    });

    test('price_set honors the same 15% margin floor', () => {
        // Net of 60.5 € vs cost 50 € → ~17.4% margin, allowed.
        const ok = computeBulkEditPreview(rows, ['SKU-A'], { kind: 'price_set', priceGrossEur: 73.21 });
        expect(ok.diffs[0].blocked).toBe(false);
        // Net of 55 € vs cost 50 € → ~9% margin, blocked.
        const bad = computeBulkEditPreview(rows, ['SKU-A'], { kind: 'price_set', priceGrossEur: 66.55 });
        expect(bad.diffs[0].blocked).toBe(true);
        expect(bad.diffs[0].after).toBe(66.55);
    });

    test('availability and category ops never hit the margin guardrail', () => {
        const avail = computeBulkEditPreview(rows, ['SKU-A', 'SKU-B'], { kind: 'availability', stockQuantity: 0 });
        expect(avail.diffs.map((d) => d.field)).toEqual(['stockQuantity', 'stockQuantity']);
        expect(avail.diffs.every((d) => !d.blocked)).toBe(true);
        const cat = computeBulkEditPreview(rows, ['SKU-C'], { kind: 'category', category: 'ŠVOK sistemų mazgai' });
        expect(cat.diffs[0].field).toBe('category');
        expect(cat.diffs[0].after).toBe('ŠVOK sistemų mazgai');
    });

    test('undo payload restores before-values only for applied rows', () => {
        const preview = computeBulkEditPreview(rows, ['SKU-A', 'SKU-B'], { kind: 'price_percent', percent: -15 });
        const undo = buildUndoPayload(preview.diffs.filter((d) => !d.blocked));
        expect(undo).toHaveLength(1);
        expect(undo[0]).toEqual({ sku: 'SKU-A', priceGrossEur: 121 });
    });

    test('computeMarginPct matches the admin formula (net = gross / 1.21)', () => {
        expect(computeMarginPct(121, 50)).toBeCloseTo(50.0, 1);
        expect(computeMarginPct(0, 50)).toBe(0);
    });
});

describe('W123-A1 audit log (activity-log.json)', () => {
    let tmpDir: string;
    let logPath: string;

    beforeEach(() => {
        tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'w123-a1-audit-'));
        logPath = path.join(tmpDir, 'activity-log.json');
    });
    afterEach(() => {
        fs.rmSync(tmpDir, { recursive: true, force: true });
    });

    const entry = (over: Partial<AdminActivityEntry> = {}): AdminActivityEntry => ({
        ts: '2026-11-01T09:00:00.000Z',
        actor: 'Darius (Admin OS)',
        entity: 'product',
        sku: 'SKU-A',
        field: 'priceGrossEur',
        before: 121,
        after: 127.05,
        source: 'admin',
        ...over,
    });

    test('append → read roundtrip via transactional store', () => {
        appendActivityEntries([entry()], { filePath: logPath });
        const readBack = readActivityLog({ filePath: logPath });
        expect(readBack).toHaveLength(1);
        expect(readBack[0].sku).toBe('SKU-A');
        expect(readBack[0].source).toBe('admin');
        // File on disk is valid JSON array.
        expect(JSON.parse(fs.readFileSync(logPath, 'utf8'))).toHaveLength(1);
    });

    test('cap keeps only the newest entries', () => {
        const many = Array.from({ length: 520 }, (_, i) =>
            entry({ ts: new Date(Date.parse('2026-11-01T00:00:00Z') + i * 1000).toISOString(), sku: `SKU-${i}` }),
        );
        const capped = appendActivityEntries(many, { filePath: logPath });
        expect(capped).toHaveLength(500);
        const readBack = readActivityLog({ filePath: logPath });
        expect(readBack).toHaveLength(500);
        expect(readBack[readBack.length - 1].sku).toBe('SKU-519');
        expect(readBack[0].sku).toBe('SKU-20');
    });

    test('filterActivityLog narrows by sku/actor/source and limits rows', () => {
        const entries = [
            entry({ sku: 'SKU-A', source: 'admin', actor: 'Darius' }),
            entry({ sku: 'SKU-B', source: 'mcp', actor: 'Vytautas MCP' }),
            entry({ sku: 'SKU-A', source: 'csv-import', actor: 'Darius' }),
        ];
        expect(filterActivityLog(entries, { sku: 'SKU-A' })).toHaveLength(2);
        expect(filterActivityLog(entries, { source: 'mcp' })).toHaveLength(1);
        expect(filterActivityLog(entries, { actor: 'Darius' })).toHaveLength(2);
        expect(filterActivityLog(entries, { limit: 2 })).toHaveLength(2);
        expect(filterActivityLog(entries, { sku: 'sku-a' })).toHaveLength(2);
    });

    test('diffOverrideStores produces field-level before/after entries', () => {
        const prev = {
            overrides: {
                skua: { sku: 'SKU-A', priceGrossEur: 121, stockQuantity: 4, published: true },
            },
            customProducts: [],
            brandRules: {},
        };
        const next = {
            overrides: {
                skua: { sku: 'SKU-A', priceGrossEur: 127.05, stockQuantity: 4, published: false, category: 'Nauja kategorija' },
                skub: { sku: 'SKU-B', priceGrossEur: 99, costPriceEur: 40, stockQuantity: 2, published: true },
            },
            customProducts: [],
            brandRules: {},
        };
        const diffs = diffOverrideStores(prev, next, { actor: 'Darius', source: 'admin' });
        const priceDiff = diffs.find((d) => d.field === 'priceGrossEur' && d.sku === 'SKU-A');
        expect(priceDiff?.before).toBe(121);
        expect(priceDiff?.after).toBe(127.05);
        expect(priceDiff?.entity).toBe('product');
        expect(diffs.find((d) => d.sku === 'SKU-A' && d.field === 'published')?.after).toBe(false);
        expect(diffs.find((d) => d.sku === 'SKU-B' && d.field === 'created')).toBeDefined();
        // Unchanged stock must not appear.
        expect(diffs.find((d) => d.sku === 'SKU-A' && d.field === 'stockQuantity')).toBeUndefined();
        expect(diffs.every((d) => d.ts.length > 0 && d.actor === 'Darius' && d.source === 'admin')).toBe(true);
    });

    test('resolveActivityLogPath isolates under VITEST', () => {
        const prev = process.env.VITEST;
        process.env.VITEST = '1';
        try {
            expect(resolveActivityLogPath()).toContain('/tmp/');
        } finally {
            if (prev === undefined) delete process.env.VITEST;
            else process.env.VITEST = prev;
        }
    });
});

describe('W123-A1 CSV import mapping + dry-run (module 3 suppliers)', () => {
    const csvLt = 'Kodas;Pavadinimas;Kaina;Likutis;Gamintojas\nSKU-A;Mazgas A;100;5;Danfoss\nSKU-NEW;Nauja prekė;80;3;HERZ';
    const csvEn = 'sku,name,price,stock,brand\nSKU-A,Mazgas A,110,7,Danfoss';

    test('detects delimiter automatically', () => {
        expect(detectCsvDelimiter(csvLt)).toBe(';');
        expect(detectCsvDelimiter(csvEn)).toBe(',');
        expect(detectCsvDelimiter('a\tb\tc')).toBe('\t');
    });

    test('parses rows and guesses LT + EN headers', () => {
        const rows = parseCsvRows(csvLt, ';');
        expect(rows).toHaveLength(3);
        expect(rows[0]).toEqual(['Kodas', 'Pavadinimas', 'Kaina', 'Likutis', 'Gamintojas']);
        const lt = guessCsvColumnMapping(['Kodas', 'Pavadinimas', 'Kaina', 'Likutis', 'Gamintojas']);
        expect(lt).toEqual({ sku: 0, name: 1, price: 2, stock: 3, brand: 4 } satisfies CsvColumnMapping);
        const en = guessCsvColumnMapping(['sku', 'name', 'price', 'stock', 'brand']);
        expect(en).toEqual({ sku: 0, name: 1, price: 2, stock: 3, brand: 4 } satisfies CsvColumnMapping);
    });

    test('dry-run: matched vs new counts, price delta, margin check', () => {
        const rows = parseCsvRows(csvLt, ';');
        const mapping = guessCsvColumnMapping(rows[0]);
        const catalog = new Map([
            ['skua', { sku: 'SKU-A', name: 'Mazgas A', priceGrossEur: 121, costPriceEur: 50 }],
        ]);
        const run = dryRunCsvImport(rows, mapping, catalog);
        expect(run.ok).toBe(true);
        expect(run.rowsParsed).toBe(2);
        expect(run.matchedCount).toBe(1);
        expect(run.newCount).toBe(1);
        const matched = run.deltas.find((d) => d.sku === 'SKU-A') as NonNullable<typeof run.deltas[0]>;
        // CSV price is treated as gross (su PVM): 100 € → net 82.64, cost 50 → ~39.5% margin.
        expect(matched.currentPriceGrossEur).toBe(121);
        expect(matched.newPriceGrossEur).toBe(100);
        expect(matched.deltaPct).toBeCloseTo(-17.4, 1);
        expect(matched.marginBlocked).toBe(false);
        const fresh = run.deltas.find((d) => d.sku === 'SKU-NEW') as NonNullable<typeof run.deltas[0]>;
        expect(fresh.matched).toBe(false);
        expect(fresh.currentPriceGrossEur).toBeNull();
    });

    test('dry-run flags margin violations below 15%', () => {
        const rows = parseCsvRows('sku;price\nSKU-A;70', ';');
        const mapping: CsvColumnMapping = { sku: 0, name: null, price: 1, stock: null, brand: null };
        const catalog = new Map([
            ['skua', { sku: 'SKU-A', name: 'Mazgas A', priceGrossEur: 121, costPriceEur: 68 }],
        ]);
        const run = dryRunCsvImport(rows, mapping, catalog);
        expect(run.deltas[0].marginBlocked).toBe(true);
        expect(run.deltas[0].marginPct).toBeLessThan(15);
    });

    test('edge cases: empty text and missing SKU mapping fail cleanly', () => {
        expect(dryRunCsvImport([], { sku: 0, name: null, price: null, stock: null, brand: null }, new Map()).ok).toBe(false);
        const noSku = parseCsvRows('name;price\nA;10', ';');
        const run = dryRunCsvImport(noSku, { sku: null, name: 0, price: 1, stock: null, brand: null }, new Map());
        expect(run.ok).toBe(false);
        expect(run.error).toContain('SKU');
    });

    test('quoted CSV cells parse without splitting on the delimiter inside quotes', () => {
        const rows = parseCsvRows('sku;name\nSKU-A;"Mazgas A; specialus";', ';');
        expect(rows[1][1]).toBe('Mazgas A; specialus');
    });
});
