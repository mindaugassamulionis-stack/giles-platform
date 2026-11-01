// W123-A1: supplier CSV import wizard logic: delimiter detection, column
// mapping and a margin-guarded dry-run. Apply lives in /api/admin/products.

export type CsvDelimiter = ';' | ',' | '\t' | '|';

export interface CsvColumnMapping {
    sku: number | null;
    name: number | null;
    price: number | null;
    stock: number | null;
    brand: number | null;
}

export interface CsvCatalogLookupRow {
    sku: string;
    name: string;
    priceGrossEur: number;
    costPriceEur: number;
}

export interface CsvDryRunDelta {
    sku: string;
    name: string;
    matched: boolean;
    currentPriceGrossEur: number | null;
    newPriceGrossEur: number;
    deltaPct: number | null;
    marginPct: number;
    marginBlocked: boolean;
    newStock: number | null;
    brand: string;
}

export interface CsvDryRunResult {
    ok: boolean;
    error?: string;
    rowsParsed: number;
    matchedCount: number;
    newCount: number;
    blockedCount: number;
    deltas: CsvDryRunDelta[];
}

export const CSV_MARGIN_FLOOR_PCT = 15;
export const CSV_VAT_RATE = 1.21;

export function detectCsvDelimiter(text: string): CsvDelimiter {
    const firstLines = text.split(/\r?\n/).filter((l) => l.trim()).slice(0, 5);
    const counts: Record<CsvDelimiter, number> = { ';': 0, ',': 0, '\t': 0, '|': 0 };
    for (const line of firstLines) {
        for (const ch of line) {
            if (ch === ';') counts[';']++;
            else if (ch === ',') counts[',']++;
            else if (ch === '\t') counts['\t']++;
            else if (ch === '|') counts['|']++;
        }
    }
    const best = (Object.entries(counts) as Array<[CsvDelimiter, number]>).sort(
        (a, b) => b[1] - a[1],
    )[0];
    return best[1] > 0 ? best[0] : ';';
}

export function parseCsvRows(text: string, delimiter: string): string[][] {
    const rows: string[][] = [];
    let cell = '';
    let row: string[] = [];
    let inQuotes = false;

    const endCell = () => {
        row.push(cell.trim());
        cell = '';
    };
    const endRow = () => {
        endCell();
        if (row.length > 1 || (row[0] && row[0].length > 0)) rows.push(row);
        row = [];
    };

    for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        if (ch === '"') {
            if (inQuotes && text[i + 1] === '"') {
                cell += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (!inQuotes && ch === delimiter) {
            endCell();
        } else if (!inQuotes && (ch === '\n' || ch === '\r')) {
            if (ch === '\r' && text[i + 1] === '\n') i++;
            endRow();
        } else {
            cell += ch;
        }
    }
    if (cell.length > 0 || row.length > 0) endRow();

    return rows;
}

const HEADER_SYNONYMS: Record<keyof CsvColumnMapping, string[]> = {
    sku: ['sku', 'kodas', 'code', 'itemcode', 'prekeskodas', 'artikulas', 'article'],
    name: ['name', 'pavadinimas', 'title', 'pavadinimai', 'description', 'aprasymas'],
    price: ['price', 'kaina', 'priceeur', 'pricegross', 'kainaevr', 'bazinekaina', 'baseprice', 'netto'],
    stock: ['stock', 'likutis', 'qty', 'quantity', 'kiekis', 'available', 'laisvaslikutis'],
    brand: ['brand', 'gamintojas', 'manufacturer', 'maker', 'produce'],
};

function normalizeHeader(header: string): string {
    return header.toLowerCase().replace(/[^a-ząčęėįšųūž0-9]/g, '');
}

export function guessCsvColumnMapping(header: string[]): CsvColumnMapping {
    const mapping: CsvColumnMapping = { sku: null, name: null, price: null, stock: null, brand: null };
    const used = new Set<number>();
    for (const role of Object.keys(HEADER_SYNONYMS) as Array<keyof CsvColumnMapping>) {
        for (let i = 0; i < header.length; i++) {
            if (used.has(i)) continue;
            const norm = normalizeHeader(header[i] || '');
            if (norm && HEADER_SYNONYMS[role].some((syn) => norm === syn || norm.includes(syn))) {
                mapping[role] = i;
                used.add(i);
                break;
            }
        }
    }
    return mapping;
}

function round2(value: number): number {
    return Math.round(value * 100) / 100;
}

export function computeCsvMarginPct(priceGrossEur: number, costPriceEur: number): number {
    const net = priceGrossEur > 0 ? priceGrossEur / CSV_VAT_RATE : 0;
    if (net <= 0) return 0;
    return Math.round(((net - costPriceEur) / net) * 1000) / 10;
}

export function dryRunCsvImport(
    rows: string[][],
    mapping: CsvColumnMapping,
    catalogBySku: Map<string, CsvCatalogLookupRow>,
    opts?: { marginFloorPct?: number },
): CsvDryRunResult {
    const empty: CsvDryRunResult = {
        ok: false,
        rowsParsed: 0,
        matchedCount: 0,
        newCount: 0,
        blockedCount: 0,
        deltas: [],
    };
    if (mapping.sku == null) {
        return { ...empty, error: 'Nepavyko nustatyti SKU stulpelio: patikslinkite stulpelių susiejimą' };
    }
    const skuCol = mapping.sku;
    const dataRows = rows.slice(1).filter((r) => (r[skuCol] || '').trim().length > 0);
    if (!dataRows.length) {
        return { ...empty, error: 'CSV eilučių su SKU kodais nerasta' };
    }

    const floor = opts?.marginFloorPct ?? CSV_MARGIN_FLOOR_PCT;
    const deltas: CsvDryRunDelta[] = [];
    let matchedCount = 0;
    let newCount = 0;
    let blockedCount = 0;

    for (const row of dataRows) {
        const sku = (row[skuCol] || '').trim();
        const name = mapping.name != null ? (row[mapping.name] || '').trim() : sku;
        const price = mapping.price != null ? Number(String(row[mapping.price] || '').replace(',', '.')) : NaN;
        const stock = mapping.stock != null ? Math.max(0, Math.round(Number(row[mapping.stock]))) : null;
        const brand = mapping.brand != null ? (row[mapping.brand] || '').trim() : '';

        const key = sku.toLowerCase().replace(/[^a-z0-9]/g, '');
        const existing = catalogBySku.get(key);
        if (!existing) {
            newCount++;
            // New rows use the same default cost rule as create_product (65% of net), so
            // the previewed margin is honest instead of a fabricated healthy number.
            const defaultCost = (price / CSV_VAT_RATE) * 0.65;
            const marginPct =
                Number.isFinite(price) && price > 0 ? computeCsvMarginPct(price, defaultCost) : 0;
            const blocked = Number.isFinite(price) && price > 0 && marginPct < floor;
            if (blocked) blockedCount++;
            deltas.push({
                sku,
                name: name || sku,
                matched: false,
                currentPriceGrossEur: null,
                newPriceGrossEur: Number.isFinite(price) ? round2(price) : 0,
                deltaPct: null,
                marginPct,
                marginBlocked: blocked,
                newStock: Number.isFinite(stock as number) ? stock : null,
                brand,
            });
            continue;
        }

        matchedCount++;
        const newPrice = Number.isFinite(price) && price > 0 ? round2(price) : existing.priceGrossEur;
        const deltaPct =
            existing.priceGrossEur > 0 && Number.isFinite(price) && price > 0
                ? Math.round(((newPrice - existing.priceGrossEur) / existing.priceGrossEur) * 1000) / 10
                : null;
        const marginPct = computeCsvMarginPct(newPrice, existing.costPriceEur);
        const blocked = marginPct < floor;
        if (blocked) blockedCount++;
        deltas.push({
            sku,
            name: existing.name || name,
            matched: true,
            currentPriceGrossEur: existing.priceGrossEur,
            newPriceGrossEur: newPrice,
            deltaPct,
            marginPct,
            marginBlocked: blocked,
            newStock: Number.isFinite(stock as number) ? stock : null,
            brand,
        });
    }

    return {
        ok: true,
        rowsParsed: dataRows.length,
        matchedCount,
        newCount,
        blockedCount,
        deltas,
    };
}
