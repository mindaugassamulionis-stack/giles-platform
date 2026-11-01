// WP-W121-A1 acceptance tests: 5-pricelist backfill into giles-catalog-6337.json.
// Binding rules (W80/W120): Danfoss price=retail_net×1.21, cost=cost_net (Col G);
// HERZ price=retail_net×1.21, cost=retail_net×0.50; Gorenje price=gross as-is;
// Haier price=rg (ret gross), cost=wn (wholesale net); Gilės/Megatherm
// price=price_list×1.21 (LIST baseline — kills the invented −10%..+82% markup),
// cost=NET (list×0.65). Honest stock: only EGIP 28 rows keep real qty;
// everything else supplier_2_4d with stockQty null; no-source old-site rows
// go on_request with priceEur null. Zero fabricated 477000… EANs.
import { describe, expect, it } from 'vitest';
import fs from 'fs';
import path from 'path';
import { getGilesCatalogProducts } from './giles-catalog-snapshot';

const repoRoot = process.cwd();
const catalogPath = path.join(repoRoot, 'src/data/giles-catalog-6337.json');
const raw = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const products: any[] = raw.products;
const bySku = new Map<string, any>();
for (const p of products) bySku.set(String(p.sku), p);

const SRC = '/home/mindu/.opencode/.runtime/state/mission_artifacts/design-differentiation-20260926/w120-r1/sources';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function jsonl(name: string): any[] {
    return fs.readFileSync(path.join(SRC, name), 'utf8').trim().split('\n').map((l) => JSON.parse(l));
}
const danfossSrc = jsonl('danfoss.jsonl');
const herzSrc = jsonl('herz.jsonl');
const gorenjeSrc = jsonl('gorenje.jsonl');
const haierSrc = jsonl('haier.jsonl');
const gilesSrc = jsonl('giles2025.jsonl');

const SYNTH_EAN = /^477000\d{7}$/;
const cents = (eur: number) => Math.round(eur * 100);
const near = (a: number | null | undefined, b: number) => a != null && Math.abs(a - b) <= 1;

// W120-R1 §4: the 6 Haier PDF rows without an exact catalog SKU exist under
// importer alias SKUs; 4 carry the PDF price verbatim (checked below against
// W120-r1-missing-haier.csv), 2 are duplicate-code variants (-ACC).
const HAIER_ALIAS: Record<string, { sku: string; price: number; cost: number }> = {
    'AB282MNERA R410A 8.0': { sku: 'AB282MNERA-4W', price: 572, cost: 284 },
    'Sąsaja IGU02': { sku: 'IGU02', price: 79, cost: 39 },
    'WR-KIT WK-B': { sku: 'WK-B', price: 52, cost: 26 },
    'Sieniniamskondicionieriams FILTR3M': { sku: 'FILTR', price: 21, cost: 10 },
};
// W120-R1 §5: these two keep their first PDF-row price; the second PDF rows
// live as ATW-A01-ACC / YR-E27-ACC (importer duplicate-code variants).
const HAIER_DUPLICATE_SKUS = new Set(['ATW-A01', 'YR-E27']);

// W120-R1 audit artifacts carry the model→catalog-SKU matching for the two
// alias-matched suppliers (Gorenje 63, Haier 458).
function pricecheckRows(name: string): string[][] {
    const text = fs.readFileSync(path.join(path.dirname(SRC), name), 'utf8');
    const lines = text.trim().split('\n');
    const rows: string[][] = [];
    for (let i = 1; i < lines.length; i++) {
        const cols: string[] = [];
        let cur = '';
        let inQ = false;
        for (const ch of lines[i]) {
            if (ch === '"') inQ = !inQ;
            else if (ch === ',' && !inQ) { cols.push(cur); cur = ''; }
            else cur += ch;
        }
        cols.push(cur);
        rows.push(cols);
    }
    return rows;
}

function normName(s: string): string {
    return String(s).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function candidate(name: string): string {
    return normName(String(name).split('(')[0].split(',')[0]);
}
const gilesBrandRows = products.filter(
    (p) => p.brandName === 'Gilės Inžinerija' || p.brandName === 'Megatherm',
);
const gilesByNormSku = new Map<string, any>();
for (const p of gilesBrandRows) gilesByNormSku.set(normName(p.sku), p);

function resolveGilesRow(itemCandidate: string): any | undefined {
    if (gilesByNormSku.has(itemCandidate)) return gilesByNormSku.get(itemCandidate);
    for (const [k, v] of gilesByNormSku) {
        if (k.endsWith(` ${itemCandidate}`) || k.startsWith(`${itemCandidate} `)) return v;
    }
    return undefined;
}

// Dedupe the Gilės 2025 pricelist by candidate (text before "(" or ","),
// majority price across sheet duplicates.
function gilesDeduped(): Map<string, { list: number; net: number }> {
    const votes = new Map<string, Map<number, { n: number; net: number }>>();
    for (const r of gilesSrc) {
        const k = candidate(r.name);
        if (!votes.has(k)) votes.set(k, new Map());
        const list = Number(r.price_list_net_eur);
        const cur = votes.get(k)!;
        const prev = cur.get(list) || { n: 0, net: Number(r.net_cost_eur) };
        prev.n += 1;
        cur.set(list, prev);
    }
    const out = new Map<string, { list: number; net: number }>();
    for (const [k, perPrice] of votes) {
        let best: { list: number; n: number } | null = null;
        for (const [list, v] of perPrice) {
            if (!best || v.n > best.n || (v.n === best.n && list < best.list)) best = { list, n: v.n };
        }
        const winner = perPrice.get(best!.list)!;
        out.set(k, { list: best!.list, net: winner.net });
    }
    return out;
}

function parseNoSourceSkus(): string[] {
    const csv = fs.readFileSync(
        path.join(path.dirname(SRC), 'W120-r1-no-source-found.csv'),
        'utf8',
    );
    const lines = csv.trim().split('\n');
    const out: string[] = [];
    // Minimal quoted CSV reader for column `sku` (index 1).
    for (let i = 1; i < lines.length; i++) {
        const cols: string[] = [];
        let cur = '';
        let inQ = false;
        for (const ch of lines[i]) {
            if (ch === '"') inQ = !inQ;
            else if (ch === ',' && !inQ) {
                cols.push(cur);
                cur = '';
            } else cur += ch;
        }
        cols.push(cur);
        if (cols[1]) out.push(cols[1].trim());
    }
    return out;
}

describe('W121-A1 backfill: per-supplier completeness (COMPLETENESS 100%)', () => {
    it('catalog carries the exact backfilled totals', () => {
        // 6,337 + Danfoss 3,437 + HERZ 3,465 + Gilės 292 distinct items
        // (373 rows − sheet duplicates − 4 pre-matched) + Haier 0 (all 6
        // candidate rows pre-existed under alias SKUs) = 13,531.
        expect(products.length).toBe(13531);
        expect(raw.totalProducts).toBe(13531);
        expect(new Set(products.map((p) => p.sku)).size).toBe(13531);
        expect(new Set(products.map((p) => p.id)).size).toBe(13531);
    });

    it('Danfoss: all 3,857 unique pricelist SKUs in catalog, price=ColE×1.21, cost=ColG (±1 ct)', () => {
        const uniq = new Set(danfossSrc.map((r) => r.sku));
        expect(uniq.size).toBe(3857);
        for (const r of danfossSrc) {
            const row = bySku.get(r.sku);
            expect(row, `Danfoss SKU ${r.sku} missing from catalog`).toBeDefined();
            expect(near(row.priceCents, cents(Number(r.retail_net_eur) * 1.21))).toBe(true);
            expect(near(row.costCents, cents(Number(r.cost_net_eur)))).toBe(true);
        }
    });

    it('HERZ: all 3,525 unique pricelist SKUs in catalog, price=retail×1.21, cost=retail×0.50 (±1 ct)', () => {
        const uniq = new Set(herzSrc.map((r) => r.sku));
        expect(uniq.size).toBe(3525);
        // 4 SKUs repeat in the pricelist with a refined name/price — the
        // script rule is LAST occurrence wins; mirror it here.
        const lastBySku = new Map<string, any>();
        for (const r of herzSrc) lastBySku.set(r.sku, r);
        for (const r of herzSrc) {
            const row = bySku.get(r.sku);
            expect(row, `HERZ SKU ${r.sku} missing from catalog`).toBeDefined();
        }
        for (const [sku, r] of lastBySku) {
            const row = bySku.get(sku);
            expect(near(row.priceCents, cents(Number(r.retail_net_eur) * 1.21))).toBe(true);
            expect(near(row.costCents, cents(Number(r.retail_net_eur) * 0.5))).toBe(true);
        }
    });

    it('Gorenje: all 63 models in catalog at Kaina su PVM (±1 ct, W120 pricecheck)', () => {
        const uniq = new Set(gorenjeSrc.map((r) => r.sku));
        expect(uniq.size).toBe(63);
        const rows = pricecheckRows('W120-r1-pricecheck-gorenje.csv');
        expect(rows.length).toBe(63);
        for (const c of rows) {
            const row = bySku.get(c[0]);
            expect(row, `Gorenje catalog SKU ${c[0]} missing`).toBeDefined();
            expect(near(row.priceCents, cents(Number(c[3])))).toBe(true); // expected_price_eur
        }
    });

    it('Haier: 458 pricecheck SKUs price-exact + 4 alias rows; catalog Haier count 465', () => {
        const rows = pricecheckRows('W120-r1-pricecheck-haier.csv');
        expect(rows.length).toBe(458);
        for (const c of rows) {
            const row = bySku.get(c[0]);
            expect(row, `Haier catalog SKU ${c[0]} missing`).toBeDefined();
            if (HAIER_DUPLICATE_SKUS.has(c[0])) continue; // documented -ACC duplicate pairs
            expect(near(row.priceCents, cents(Number(c[3])))).toBe(true);
            expect(near(row.costCents, cents(Number(c[5])))).toBe(true);
        }
        // The duplicate pairs: first-row price on the plain SKU, second-row
        // price on the -ACC variant (both from the same PDF).
        expect(bySku.get('ATW-A01').priceCents).toBe(36200);
        expect(bySku.get('ATW-A01-ACC').priceCents).toBe(30300);
        expect(bySku.get('YR-E27').priceCents).toBe(11700);
        expect(bySku.get('YR-E27-ACC').priceCents).toBe(7700);
        for (const [model, a] of Object.entries(HAIER_ALIAS)) {
            const row = bySku.get(a.sku);
            expect(row, `Haier alias ${a.sku} (${model}) missing`).toBeDefined();
            expect(near(row.priceCents, cents(a.price))).toBe(true);
            expect(near(row.costCents, cents(a.cost))).toBe(true);
        }
        const haierRows = products.filter((p) => p.brandName === 'Haier');
        expect(haierRows.length).toBe(465); // 458 pricecheck + 6 alias/dup + 1 documented extra AB162MCFRA
    });

    it('Gilės/Megatherm 2025: all 373 pricelist rows resolve, price=LIST×1.21, cost=NET (±1 ct)', () => {
        const deduped = gilesDeduped();
        expect(gilesSrc.length).toBe(373);
        expect(deduped.size).toBe(296);
        for (const [k, v] of deduped) {
            const row = resolveGilesRow(k);
            expect(row, `Gilės 2025 item "${k}" unresolved`).toBeDefined();
            expect(near(row.priceCents, cents(v.list * 1.21))).toBe(true);
            expect(near(row.costCents, cents(v.net))).toBe(true);
        }
        // The 4 previously-mismatched rows now follow the pricelist exactly.
        expect(bySku.get('MPB-NANI-35').priceCents).toBe(cents(1070 * 1.21)); // 1294.70
        expect(bySku.get('MPB-NANI-35').costCents).toBe(69550);
        expect(bySku.get('MPB-NANI-50').priceCents).toBe(cents(1255 * 1.21)); // 1518.55
        expect(bySku.get('MPB-NANI-50').costCents).toBe(81575);
        expect(bySku.get('MPB-80-PRO').priceCents).toBe(cents(2145 * 1.21)); // 2595.45
        expect(bySku.get('MPB-80-PRO').costCents).toBe(139425);
        expect(bySku.get('MPB-150-PRO').priceCents).toBe(cents(4485 * 1.21)); // 5426.85
        expect(bySku.get('MPB-150-PRO').costCents).toBe(291525);
    });
});

describe('W121-A1 policy: EAN, stock, availability, price-on-request', () => {
    it('zero fabricated EANs anywhere (field, specs, description); real EANs = source Danfoss EANs', () => {
        const realSourceEans = new Set(
            danfossSrc.filter((r) => r.ean && String(r.ean).length === 13).map((r) => String(r.ean)),
        );
        let catalogEans = 0;
        for (const p of products) {
            if (p.ean != null && String(p.ean).length > 0) {
                expect(
                    SYNTH_EAN.test(String(p.ean)),
                    `fabricated EAN ${p.ean} on ${p.sku}`,
                ).toBe(false);
                if (/^\d{13}$/.test(String(p.ean))) catalogEans++;
            }
            const specEan = p.specs?.['EAN-13 kodas'];
            if (specEan) expect(SYNTH_EAN.test(String(specEan)), `fabricated spec EAN on ${p.sku}`).toBe(false);
            if (/EAN: 477000\d{7}/.test(String(p.description || ''))) {
                throw new Error(`fabricated EAN in description of ${p.sku}`);
            }
        }
        expect(catalogEans).toBe(realSourceEans.size);
        expect(realSourceEans.size).toBeGreaterThanOrEqual(418);
    });

    it('honest stock: only the 28 real EGIP rows keep a qty; everything else stockQty null', () => {
        let inStock = 0;
        let egip = 0;
        const allowed = new Set(['in_stock', 'supplier_2_4d', 'on_request']);
        for (const p of products) {
            expect(allowed.has(p.availability), `bad availability on ${p.sku}`).toBe(true);
            if (p.availability === 'in_stock') {
                inStock++;
                expect(String(p.stockSource)).toContain('EGIP.lt');
                expect(typeof p.stockQuantity).toBe('number');
                expect(p.stockQuantity).toBeGreaterThan(0);
            } else {
                expect(p.stockQuantity == null, `non-null stockQuantity on ${p.sku}`).toBe(true);
                expect(p.stock == null, `non-null stock on ${p.sku}`).toBe(true);
            }
            if (String(p.stockSource).includes('EGIP.lt')) egip++;
        }
        expect(egip).toBe(28);
        expect(inStock).toBe(28);
    });

    it('availability invariants: supplier_2_4d priced, on_request priceless and flagged', () => {
        let onRequest = 0;
        for (const p of products) {
            if (p.availability === 'supplier_2_4d') {
                expect(p.priceCents != null, `supplier_2_4d without price on ${p.sku}`).toBe(true);
            }
            if (p.availability === 'on_request') {
                onRequest++;
                expect(p.priceOnRequest).toBe(true);
                expect(p.priceCents).toBeNull();
            }
            if (p.priceOnRequest === true) {
                expect(p.priceCents, `priceOnRequest row ${p.sku} still priced`).toBeNull();
            }
        }
        expect(onRequest).toBeGreaterThanOrEqual(2500);
    });

    it('no-source-found old-site rows: none deleted, each priced-from-2025/26 pricelist or on_request', () => {
        const skus = parseNoSourceSkus();
        expect(skus.length).toBe(3032);
        let covered = 0;
        let onRequest = 0;
        for (const sku of skus) {
            const row = bySku.get(sku);
            expect(row, `no-source row ${sku} deleted`).toBeDefined();
            if (row.priceCents != null) covered++;
            else if (row.availability === 'on_request') onRequest++;
            else throw new Error(`no-source row ${sku} neither priced nor on_request`);
        }
        expect(covered + onRequest).toBe(3032);
        expect(onRequest).toBeGreaterThan(2000);
    });
});

describe('W121-A1 snapshot loads with the honest-commerce contract', () => {
    it('getGilesCatalogProducts() returns all 13,531 rows with contract fields flowing', () => {
        const listing = getGilesCatalogProducts();
        expect(listing.length).toBe(13531);
        const onReq = listing.find((p) => p.availability === 'on_request');
        expect(onReq).toBeDefined();
        expect(onReq!.priceEur).toBeNull();
        expect(onReq!.priceOnRequest).toBe(true);
        expect(onReq!.stockQty).toBeNull();
        const supplier = listing.find((p) => p.availability === 'supplier_2_4d');
        expect(supplier).toBeDefined();
        expect(supplier!.priceEur!).toBeGreaterThan(0);
        expect(supplier!.stockQty).toBeNull();
        const inStock = listing.find((p) => p.availability === 'in_stock');
        expect(inStock).toBeDefined();
        expect(typeof inStock!.stockQty).toBe('number');
    });
});
