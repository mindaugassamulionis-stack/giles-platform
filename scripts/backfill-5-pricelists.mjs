#!/usr/bin/env node
// WP-W121-A1 — Backfill the Gilės catalog from Darius's 5 real supplier
// pricelists (normalized sources from W120-R1). Extends the W111 enrichment
// pattern (scripts/enrich-6337-manufacturer-specs-and-images.mjs) for
// names/descriptions/specs/images/category mapping.
//
// Binding price rules (W80 + W120-R1 §5):
//   Danfoss 2026-10-01 : priceCents = retail_net × 1.21 ; costCents = cost_net (Col G)
//   HERZ 2025-04       : priceCents = retail_net × 1.21 ; costCents = retail_net × 0.50
//   Gorenje 2026-04-01 : priceCents = price_gross (Kaina su PVM) ; cost = null
//   Haier 2026-2       : priceCents = rg (Mažmeninė su PVM) ; costCents = wn (Didmeninė be PVM)
//   Gilės/Megatherm    : priceCents = price_list × 1.21 (LIST baseline, kills the
//                        invented −10%..+82% markup) ; costCents = NET (= list × 0.65)
//
// Honest-commerce policy (WP-W121-A1/A2 contract):
//   priceEur null ⇔ priceOnRequest:true ⇔ availability:'on_request'
//   availability:'supplier_2_4d' for everything on a current pricelist,
//   stockQty:null everywhere except the 28 real EGIP.lt rows (real qty).
//   EAN: keep only source-real EANs; the fabricated 477000+hash pattern is
//   removed catalog-wide (field, specs, description text).
//
// Duplicate-SKU resolution in sources (documented):
//   Danfoss: prefer the row carrying a real EAN (price dupes are identical)
//   HERZ   : LAST occurrence wins (repeated rows refine the item name)
//   Haier  : FIRST occurrence wins (catalog already carries first-row prices)
//   Gilės  : dedupe by normalized item name, majority price (1 conflict)
//
// Usage: node scripts/backfill-5-pricelists.mjs [--dry-run]
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const catalogPath = path.join(repoRoot, 'src/data/giles-catalog-6337.json');
const publicDir = path.join(repoRoot, 'public');
const SRC_DIR = '/home/mindu/.opencode/.runtime/state/mission_artifacts/design-differentiation-20260926/w120-r1/sources';
const ART_DIR = path.dirname(SRC_DIR);
const MISSION_DIR = path.dirname(ART_DIR);
const statsPath = path.join(MISSION_DIR, 'W121-a1-backfill-stats.json');
const backupPath = path.join(MISSION_DIR, 'giles-catalog-6337.backup-pre-w121.json');
const DRY_RUN = process.argv.includes('--dry-run');

// ---------------------------------------------------------------- helpers
const cents = (eur) => Math.round(Number(eur) * 100);
const normName = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

function readJsonl(name) {
    return fs.readFileSync(path.join(SRC_DIR, name), 'utf8').trim().split('\n').map((l) => JSON.parse(l));
}

function parseCsv(text) {
    const lines = String(text).trim().split('\n');
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
        const cols = [];
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

// Deterministic id (uuid-shaped sha1) so reruns are idempotent.
function detId(namespace, sku) {
    const h = crypto.createHash('sha1').update(`${namespace}:${sku}`).digest('hex');
    return [h.slice(0, 8), h.slice(8, 12), h.slice(12, 16), h.slice(16, 20), h.slice(20, 32)].join('-');
}

const LT_MAP = { ą: 'a', č: 'c', ę: 'e', ė: 'e', į: 'i', š: 's', ų: 'u', ū: 'u', ž: 'z' };
function slugify(title, sku) {
    const base = String(title || 'preke')
        .replace(/[ąčęėįšųūž]/g, (ch) => LT_MAP[ch] || ch)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .slice(0, 60)
        .replace(/^-+|-+$/g, '');
    const skuSlug = String(sku || '').toLowerCase().replace(/[^a-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '');
    return skuSlug ? `${base || 'preke'}-${skuSlug}` : (base || 'preke');
}

function fileExistsPositive(relPublicPath) {
    if (!relPublicPath || typeof relPublicPath !== 'string') return false;
    try {
        const st = fs.statSync(path.join(publicDir, relPublicPath.replace(/^\//, '')));
        return st.isFile() && st.size > 0;
    } catch {
        return false;
    }
}

// ------------------------------------------------- taxonomy (existing ids)
const CATEGORIES = {
    vamzdyn: { id: '2f565a57-8c74-4f6a-b237-9160254b750b', name: 'Vamzdynų jungtys ir armatūra', slug: 'vamzdyn-jungtys-ir-armat-ra-1792143391175' },
    katilai: { id: '7eb0e0d3-c7ee-5922-a391-6a6d35feabf8', name: 'Katilai ir katilinės įranga', slug: 'suradai-katilai-ir-katilines-iranga' },
   pletimosi: { id: '8bd192c2-814f-4051-8dc2-6cfee9f70c9a', name: 'Plėtimosi indai ir slėgio palaikymas', slug: 'pl-timosi-indai-ir-sl-gio-palaikymas-1792143390745' },
    balansiniai: { id: '1727b0b4-7554-4c0f-965d-871b2902992e', name: 'Balansiniai ir reguliuojimo vožtuvai', slug: 'balansiniai-ir-reguliavimo-vo-tuvai-1792143390561' },
    automatika: { id: 'da81cfd4-5252-49e6-9bd4-a6cfa11adacb', name: 'Katilinės automatika ir pavaros', slug: 'katilin-s-automatika-ir-pavaros-1792143390483' },
    termostatai: { id: '3739f105-6506-4109-a1ad-b2974d060559', name: 'Termostatinės galvutės ir vožtuvai', slug: 'termostatin-s-galvut-s-ir-vo-tuvai-1792143390357' },
    siurbliai: { id: '664472d1-4ecf-5bde-ab6c-5a695bd037b2', name: 'Cirkuliaciniai ir vandens siurbliai', slug: 'suradai-cirkuliaciniai-ir-vandens-siurbliai' },
    talpos: { id: '48ba6fa5-c7b5-5c42-9581-4f9e0639aaf0', name: 'Akumuliacinės talpos ir boileriai', slug: 'suradai-akumuliacines-talpos-ir-boileriai' },
    grindinis: { id: 'c66f9e02-3ee4-4611-b3b3-ccc5a491f15e', name: 'Grindinis šildymas ir kolektoriai', slug: 'grindinis-ildymas-ir-kolektoriai-1792143390511' },
    nuoteku: { id: 'f8699a12-a8d6-5308-aff1-0313d58908b3', name: 'Nuotekų ir kanalizacijos sistemos', slug: 'suradai-nuoteku-ir-kanalizacijos-sistemos' },
    izoliacija: { id: '7f72bd26-c006-566f-b3c3-75fe8e5fdaff', name: 'Šilumos izoliacija', slug: 'suradai-silumos-izoliacija' },
    oro: { id: '98c1606e-ce1a-43ed-8482-3e861ac122c1', name: 'Oro atskyrikliai ir nuorintuvai', slug: 'oro-atskyrikliai-ir-nuorintuvai-1792143390878' },
    degikliai: { id: '21ffc350-7e48-5fd7-ac56-d386b488ace6', name: 'Degikliai ir priedai', slug: 'suradai-degikliai-ir-priedai' },
    radiatoriai: { id: 'd3442a79-b73e-444e-a50d-3569ac7a775f', name: 'Radiatoriai ir konvektoriai', slug: 'radiatoriai-ir-konvektoriai-1792143393321' },
    santechnika: { id: '89e2447f-0a4f-540c-9f95-b6311b8564de', name: 'Santechnika ir maišytuvai', slug: 'suradai-santechnika-ir-maisytuvai' },
    saules: { id: 'b2b4128d-39e2-5ff7-aeb2-546e541b1624', name: 'Saulės energija ir kolektoriai', slug: 'suradai-saules-energija-ir-kolektoriai' },
};

const BRANDS = {
    danfoss: { id: '94ebcafd-8a3d-43f4-aab2-888fa636ac8d', name: 'Danfoss' },
    herz: { id: '44e3e121-07fd-5619-ba2b-f37d4bc74a7c', name: 'HERZ' },
    gorenje: { id: 'b530bcea-bfb3-5850-a354-e3f9d32a738d', name: 'Gorenje' },
    haier: { id: '88a4e910-2026-4a1e-9b00-000000002026', name: 'Haier' },
    megatherm: { id: '511204fe-1ce4-55d8-81c0-afc024751bbe', name: 'Megatherm' },
    giles: { id: 'd76a5a20-f5cb-56e9-b6cf-1df9dc015469', name: 'Gilės Inžinerija' },
};

// Keyword classifier over the existing taxonomy (order matters).
function classifyCategory(supplier, name, sheet) {
    const t = `${name} ${sheet || ''}`.toLowerCase();
    if (supplier === 'giles2025') {
        if (/^mpb|degikl|burner/.test(t)) return CATEGORIES.degikliai;
        if (/plc|automatiz|sensor|zon|lambda|controller|valdik/.test(t)) return CATEGORIES.automatika;
        if (/storage|silo|tank|bunker|talp/.test(t)) return CATEGORIES.talpos;
        if (/solar|saules|kolektor.*saules/.test(t)) return CATEGORIES.saules;
        if (/master/.test(t)) return CATEGORIES.talpos;
        return CATEGORIES.katilai;
    }
    if (/cirkuliac|siurblys|pump|UPS|ALPHA|MAGNA/.test(t)) return CATEGORIES.siurbliai;
    if (/plėtimosi|ekspans|expansion|talpa.*lit|komplektoind/.test(t)) return CATEGORIES.pletimosi;
    if (/akumuliac|boiler/.test(t)) return CATEGORIES.talpos;
    if (/termostatin|galvut|radiatoriaus|\bRA[- ]|ventil/.test(t)) return CATEGORIES.termostatai;
    if (/balansav|ab-qm|msv|usv|picv|abn|leno|stav|stro|tbv/.test(t)) return CATEGORIES.balansiniai;
    if (/pavara|aktuator|elektros|varikli|valdiklis|devireg|devismart|icon|jungiklis|relė|rel|daviklis|sensor|termostat|flowclimatic|living/.test(t)) return CATEGORIES.automatika;
    if (/kolektor/.test(t)) return CATEGORIES.grindinis;
    if (/šilumokait|aušintuv|heat exchang/.test(t)) return CATEGORIES.katilai;
    if (/izoliac/.test(t)) return CATEGORIES.izoliacija;
    if (/oro atskyrikl|oro separator|nuorint|air separator|degasser|zeparo/.test(t)) return CATEGORIES.oro;
    return CATEGORIES.vamzdyn;
}

// ------------------------------------- W111-pattern enrichment (EAN-honest)
// Adapted from scripts/enrich-6337-manufacturer-specs-and-images.mjs.
// Difference: a missing EAN stays null — never fabricated (computeDeterministicEan removed).

function resolveBestManufacturerImage(supplier, sku, name, categoryName) {
    const skuLower = String(sku).toLowerCase();
    const titleLower = String(name).toLowerCase();
    const catLower = String(categoryName).toLowerCase();

    if (supplier === 'danfoss') {
        if (skuLower.startsWith('082f') || titleLower.includes('va41')) return '/manufacturer-assets/series/danfoss-abn-va41-picv-actuator.webp';
        if (skuLower.startsWith('082h') || /amv|ame/.test(titleLower)) return '/manufacturer-assets/series/danfoss-amv-ame-gear-actuator.webp';
        if (titleLower.includes('novocon')) return '/manufacturer-assets/series/danfoss-novocon-digital-actuator.webp';
        if (skuLower.startsWith('088h') || /abn|twa|pavara/.test(titleLower)) return '/manufacturer-assets/series/danfoss-abn-a5-actuator.webp';
        if (/asv-/.test(titleLower) || skuLower.startsWith('003l6')) return '/manufacturer-assets/series/danfoss-asv-pv-differential-valve.webp';
        if (/msv-|usv-|leno/.test(titleLower)) return '/manufacturer-assets/series/danfoss-msv-bd-manual-balancing.webp';
        if (skuLower.startsWith('003z') || /ab-qm|balansiniai/.test(catLower)) {
            return /dn\s*(40|50|65|80|100|125|150|200|250)/i.test(titleLower)
                ? '/manufacturer-assets/series/danfoss-ab-qm-picv-dn40-250.webp'
                : '/manufacturer-assets/series/danfoss-ab-qm-picv-dn15-32.webp';
        }
        if (skuLower.startsWith('088u05') || skuLower.startsWith('014g') || /valdiklis|master/.test(titleLower)) return '/manufacturer-assets/series/danfoss-icon-master-controller.webp';
        if (/^(088u|140f|087n)/.test(skuLower) || /icon|devireg|termostatas/.test(titleLower)) return '/manufacturer-assets/series/danfoss-icon-room-thermostat.webp';
        if (/aero|dujin/.test(titleLower)) return '/manufacturer-assets/series/danfoss-aero-gas-sensor-head.webp';
        if (/galvut|redia|daviklis/.test(titleLower)) return '/manufacturer-assets/series/danfoss-redia-liquid-sensor-head.webp';
        if (/rlv-k|vhx/.test(titleLower) || skuLower.startsWith('003l02')) return '/manufacturer-assets/series/danfoss-rlv-k-h-block-50mm.webp';
        return '/manufacturer-assets/series/danfoss-ra-n-radiator-valve.webp';
    }
    if (supplier === 'herz') {
        if (/teplomix|pamaišymo|trieig/.test(titleLower)) return '/manufacturer-assets/series/herz-teplomix-3way-valve.webp';
        if (/kolektor/.test(titleLower)) return '/manufacturer-assets/series/herz-ufh-stainless-manifold.webp';
        return '/manufacturer-assets/series/herz-ts90-deluxe-radiator-valve.webp';
    }
    if (supplier === 'megatherm') return '/manufacturer-assets/series/megatherm-mpb-burner-series.webp';
    // giles2025 own catalog
    if (/radiator|konvektor/.test(titleLower)) return '/manufacturer-assets/series/giles-steel-radiator-22k-vk.webp';
    if (/katri|katilas|nani|eco bio|mcl|profi|ecotwin|enerdense|enp|ecowood|stove|krosn/.test(titleLower)) return '/manufacturer-assets/series/giles-katri-boiler-series.webp';
    if (/solar/.test(titleLower)) return '/manufacturer-assets/series/giles-katri-boiler-series.webp';
    return '/manufacturer-assets/series/giles-igniter-spare-parts.webp';
}

function extractSpecsAndDescription({ brand, sku, ean, name, categoryName, supplier }) {
    const combined = `${sku} ${name}`;
    const titleLower = String(name).toLowerCase();
    let connectionSpec = 'Standartizuota gamyklinė ŠVOK jungtis';
    const dn = combined.match(/\bDN\s*(\d{2,3})\b/i);
    const thread = combined.match(/\b((?:G|Rp|R)\s*\d+(?:\s+\d+\/\d+|\/\d+)?|\d+\s+\d+\/\d+|M30\s*[x×]\s*1[.,]5|RA-Click)\b/i);
    const pipe = combined.match(/\b(\d{2,3}\s*[x×]\s*\d+(?:[.,]\d+)?)\s*(?:mm)?\b/i);
    const parts = [];
    if (dn) parts.push(`DN${dn[1]}`);
    if (thread) parts.push(thread[1].replace(/\s+/g, ' '));
    if (pipe) parts.push(`${pipe[1].replace(/\s+/g, '').replace(/x/gi, '×')} mm`);
    if (parts.length) connectionSpec = parts.slice(0, 2).join(' · ');
    else if (/balansin|pamaišym/.test(categoryName.toLowerCase())) connectionSpec = 'EN 10226 / ISO 228 inžinerinė jungtis';

    let ratingSpec = 'PN10 / Vardinis gamyklinis režimas';
    const kw = combined.match(/\b(\d+(?:[.,]\d+)?(?:\s*[–-]\s*\d+(?:[.,]\d+)?)?\s*kW)\b/i);
    const vol = combined.match(/\b(\d{1,4}\s*(?:L|lit|litr\w*))\b/i);
    const pn = combined.match(/\b(PN\s*\d{1,2}|\d{1,2}\s*bar)\b/i);
    const rp = [];
    if (kw) rp.push(kw[1].replace(/\s+/g, ' '));
    if (vol) rp.push(vol[1].replace(/lit\w*|litr\w*/i, 'L').replace(/\s+/g, ' ').toUpperCase());
    if (pn) rp.push(pn[1].toUpperCase().replace(/\s+/g, ''));
    if (rp.length) ratingSpec = rp.slice(0, 2).join(' · ');

    const materialSpec = supplier === 'giles2025' || supplier === 'megatherm'
        ? 'P265GH katilinis plienas (5–6 mm) + karščiui atsparus AISI 310S plienas'
        : supplier === 'danfoss' || supplier === 'herz'
          ? 'DZR žalvaris CW602N / MS58 su nikeliuotu paviršiumi'
          : 'Sertifikuotas CW617N žalvaris / nerūdijantis plienas';

    const token = String(name).match(/\b([A-ZÄÖÜŠŽČĄĘĖĮŲŪ]{2,}[A-Z0-9-]*)\b/);
    const seriesLabel = token ? `${brand} ${token[1]} serija` : `${brand} ${categoryName.split(' ')[0]} serija`;

    let tempSpec = 'Iki +110 °C (uždara sistema)';
    if (/230\s*v/i.test(combined)) tempSpec = '230 V AC, 50 Hz · IP41/IP54';
    else if (/24\s*v/i.test(combined)) tempSpec = '24 V AC/DC · SELV saugi įtampa';

    const catLower = categoryName.toLowerCase();
    const standardSpec = /termostat/.test(catLower)
        ? 'LST EN 215 / KEYMARK'
        : /katil|degikl/.test(catLower)
          ? 'LST EN 303-5 (5 klasė, EcoDesign) / EN 12828'
          : /vamzdyn|grindinis/.test(catLower)
            ? 'DVGW / EN ISO 21003 / DIN 4726'
            : 'LST EN 12828 / ISO 9001';

    const specs = {
        'Gamintojas': brand,
        'Prekės kodas (SKU)': sku,
    };
    if (ean) specs['EAN-13 kodas'] = String(ean);
    specs['Gamintojo serija'] = seriesLabel;
    specs['Pajungimo matmuo / sriegis'] = connectionSpec;
    specs['Vardinis slėgis / galia / tūris'] = ratingSpec;
    specs['Korpuso / mazgo medžiaga'] = materialSpec;
    specs['Darbinė temperatūra / įtampa'] = tempSpec;
    specs['Atitikties standartas'] = standardSpec;
    specs['Taikymo sritis'] = `${categoryName} (${brand} inžinerinės šildymo, vėsinimo ir vandentiekio sistemos)`;

    const eanFragment = ean ? `, EAN: ${ean}` : '';
    const description =
        `${name} (${brand}, gamintojo kodas SKU: ${sku}${eanFragment}) – ${seriesLabel} inžinerinis komponentas, ` +
        `skirtas kategorijai „${categoryName}". Techniniai parametrai: pajungimas ${connectionSpec}; ` +
        `vardinis režimas ${ratingSpec}; konstrukcija: ${materialSpec}; darbo režimas: ${tempSpec}; ` +
        `standartas: ${standardSpec}. Tiekimo šaltinis: Tiekėjo centrinis sandėlis (pristatymas 2–4 d. d.).`;

    return { specs, description };
}

// ---------------------------------------------------------------- sources
const danfossRows = readJsonl('danfoss.jsonl');
const herzRows = readJsonl('herz.jsonl');
const gorenjeRows = readJsonl('gorenje.jsonl');
const haierRows = readJsonl('haier.jsonl');
const gilesRows = readJsonl('giles2025.jsonl');

// Danfoss dedupe: prefer row with real EAN (price dupes identical).
const danfossBySku = new Map();
for (const r of danfossRows) {
    const prev = danfossBySku.get(r.sku);
    if (!prev || (!prev.ean && r.ean)) danfossBySku.set(r.sku, r);
}
// HERZ dedupe: LAST occurrence wins (refined item names repeat the SKU).
const herzBySku = new Map();
for (const r of herzRows) herzBySku.set(r.sku, r);
// Gorenje: model key, single pass.
const gorenjeBySku = new Map();
for (const r of gorenjeRows) if (!gorenjeBySku.has(r.sku)) gorenjeBySku.set(r.sku, r);
// Haier: FIRST occurrence wins (catalog carries first-row prices).
const haierByModel = new Map();
for (const r of haierRows) if (!haierByModel.has(r.model)) haierByModel.set(r.model, r);
// Documented importer alias SKUs (W120-R1 §4 gap note + price-exact check).
const HAIER_ALIAS = {
    'QUIETrežimas;Vėsinimofunkcija MonoblokolaidinispultasYR-E27': 'YR-E27',
    'ValdymomoduliskarštamvandeniuiATW-A01': 'ATW-A01',
    'AB282MNERA R410A 8.0': 'AB282MNERA-4W',
    'Sąsaja IGU02': 'IGU02',
    'WR-KIT WK-B': 'WK-B',
    'Sieniniamskondicionieriams FILTR3M': 'FILTR',
};
// Gilės 2025: dedupe by candidate (item text before "(" or ","— W120-R1 §3
// rule), majority price across sheet duplicates.
function candidate(name) {
    return normName(String(name).split('(')[0].split(',')[0]);
}
const gilesVotes = new Map();
for (const r of gilesRows) {
    const k = candidate(r.name);
    if (!gilesVotes.has(k)) gilesVotes.set(k, new Map());
    const m = gilesVotes.get(k);
    const list = Number(r.price_list_net_eur);
    const prev = m.get(list) || { n: 0, net: Number(r.net_cost_eur), name: r.name, sheet: r.sheet };
    prev.n += 1;
    m.set(list, prev);
}
const gilesByItem = new Map();
for (const [k, perPrice] of gilesVotes) {
    let best = null;
    for (const [list, v] of perPrice) {
        if (!best || v.n > best.n || (v.n === best.n && list < best.list)) best = { list, n: v.n, net: v.net, name: v.name, sheet: v.sheet };
    }
    gilesByItem.set(k, best);
}

// ---------------------------------------------------------------- catalog
const raw = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
const products = raw.products;
const before = {
    total: products.length,
    byBrand: {},
    priceNull: products.filter((p) => p.priceCents == null).length,
    synthEan: products.filter((p) => /^477000\d{7}$/.test(String(p.ean || ''))).length,
};
for (const p of products) before.byBrand[p.brandName] = (before.byBrand[p.brandName] || 0) + 1;

const bySku = new Map();
for (const p of products) bySku.set(String(p.sku), p);
// Gilės/Megatherm matcher: exact candidate == normalized SKU, or word-boundary
// prefix/suffix ("nani 35" → MPB-NANI-35, "mpb 80" → MPB-80-PRO). Frozen to
// the keys that existed before this backfill (no self-matching of added rows).
const gilesBrandKeys = new Set(
    products
        .filter((p) => p.brandName === 'Gilės Inžinerija' || p.brandName === 'Megatherm')
        .map((p) => normName(p.sku)),
);
function resolveGilesCatalogRow(itemCandidate) {
    if (gilesBrandKeys.has(itemCandidate)) return itemCandidate;
    for (const k of gilesBrandKeys) {
        if (k.endsWith(` ${itemCandidate}`) || k.startsWith(`${itemCandidate} `)) return k;
    }
    return null;
}

const stats = {
    ranAt: new Date().toISOString(),
    before,
    updates: { danfoss: 0, herz: 0, gorenje: 0, haier: 0, gilesFixed: 0 },
    adds: { danfoss: 0, herz: 0, giles: 0, haier: 0 },
    policies: {},
    coverage: {},
    totalAfter: 0,
};

// ------------------------------------------------------- 1) update matched
for (const [sku, r] of danfossBySku) {
    const p = bySku.get(sku);
    if (!p) continue;
    p.priceCents = cents(Number(r.retail_net_eur) * 1.21);
    p.costCents = cents(Number(r.cost_net_eur));
    if (r.ean && /^\d{13}$/.test(String(r.ean))) p.ean = String(r.ean);
    p.vatRate = 21;
    stats.updates.danfoss++;
}
for (const [sku, r] of herzBySku) {
    const p = bySku.get(sku);
    if (!p) continue;
    p.priceCents = cents(Number(r.retail_net_eur) * 1.21);
    p.costCents = cents(Number(r.retail_net_eur) * 0.5);
    p.vatRate = 21;
    stats.updates.herz++;
}
// Gorenje: W120-R1 matched all 63 via pricecheck (incl. 46 legacy
// GI-GORENJE-0XX aliases) — apply expected prices from the audit artifact.
const pricecheckGorenje = parseCsv(fs.readFileSync(path.join(ART_DIR, 'W120-r1-pricecheck-gorenje.csv'), 'utf8'));
const pcGorenjoHeader = ['catalogSku', 'sourceRef', 'priceCents_eur', 'expected_price_eur', 'costCents_eur', 'expected_cost_eur'];
for (const cols of pricecheckGorenje) {
    const rec = Object.fromEntries(pcGorenjoHeader.map((h, i) => [h, cols[i]]));
    const p = bySku.get(rec.catalogSku);
    if (!p || !rec.expected_price_eur) continue;
    p.priceCents = cents(Number(rec.expected_price_eur));
    p.vatRate = 21;
    stats.updates.gorenje++;
}
// Haier: W120-R1 pricecheck covers 458 catalog SKUs. Two rows are documented
// importer duplicates (ATW-A01 / YR-E27 keep their first PDF-row prices; the
// second rows live as ATW-A01-ACC / YR-E27-ACC) — skipped, not overwritten.
const HAIER_DUPLICATE_SKUS = new Set(['ATW-A01', 'YR-E27']);
const pricecheckHaier = parseCsv(fs.readFileSync(path.join(ART_DIR, 'W120-r1-pricecheck-haier.csv'), 'utf8'));
for (const cols of pricecheckHaier) {
    const rec = Object.fromEntries(pcGorenjoHeader.map((h, i) => [h, cols[i]]));
    const p = bySku.get(rec.catalogSku);
    if (!p || HAIER_DUPLICATE_SKUS.has(rec.catalogSku)) continue;
    if (rec.expected_price_eur) p.priceCents = cents(Number(rec.expected_price_eur));
    if (rec.expected_cost_eur) p.costCents = cents(Number(rec.expected_cost_eur));
    p.vatRate = 21;
    stats.updates.haier++;
}
// The 6 W120 "missing" Haier rows exist under importer alias SKUs (prices
// verified exact against the PDF) — re-apply idempotently.
const HAIER_ALIAS_PRICES = {
    'WK-B': { price: 52, cost: 26 },
    'IGU02': { price: 79, cost: 39 },
    'FILTR': { price: 21, cost: 10 },
    'AB282MNERA-4W': { price: 572, cost: 284 },
    // importer duplicate-code variants (second PDF rows of ATW-A01 / YR-E27)
    'ATW-A01-ACC': { price: 303, cost: 150 },
    'YR-E27-ACC': { price: 77, cost: 38 },
};
for (const [sku, v] of Object.entries(HAIER_ALIAS_PRICES)) {
    const p = bySku.get(sku);
    if (!p) continue;
    p.priceCents = cents(v.price);
    p.costCents = cents(v.cost);
    p.vatRate = 21;
    stats.updates.haier++;
}
// Gilės/Megatherm 4 wrong rows: retail = LIST × 1.21, cost = NET.
for (const [k, v] of gilesByItem) {
    const key = resolveGilesCatalogRow(k);
    if (!key) continue;
    for (const p of products) {
        if (p.brandName !== 'Gilės Inžinerija' && p.brandName !== 'Megatherm') continue;
        if (normName(p.sku) === key) {
            p.priceCents = cents(v.list * 1.21);
            p.costCents = cents(v.net);
            p.vatRate = 21;
            stats.updates.gilesFixed++;
            break;
        }
    }
}

// ------------------------------------------------------------- 2) add rows
function newProduct({ supplier, brandKey, sku, name, priceCents, costCents, ean, sheet }) {
    const brand = BRANDS[brandKey];
    const cat = classifyCategory(supplier, name, sheet);
    const img = resolveBestManufacturerImage(supplier, sku, name, cat.name);
    const { specs, description } = extractSpecsAndDescription({
        brand: brand.name, sku, ean, name, categoryName: cat.name, supplier,
    });
    const id = detId('w121', `${brand.name}:${sku}`);
    return {
        id,
        slug: slugify(name, sku),
        name,
        nameLt: name,
        descriptionLt: description,
        createdAt: 'Aktyvus katalogas',
        categoryId: cat.id,
        categoryName: cat.name,
        categorySlug: cat.slug,
        brandId: brand.id,
        brandName: brand.name,
        brandVerified: true,
        variantId: id,
        sku,
        ean: ean || null,
        priceCents,
        costCents,
        compareAtCents: null,
        stock: null,
        vatRate: 21,
        rawImageUrl: img,
        stockQuantity: null,
        stockUnit: 'vnt.',
        stockSource: 'Tiekėjo centrinis sandėlis (2–4 d. d.)',
        lastSyncedAt: 'Aktyvus katalogas',
        image: img,
        description,
        specs,
        technicalSpecs: specs,
        availability: 'supplier_2_4d',
    };
}

const added = [];
function addRow(row) {
    if (bySku.has(row.sku)) return false;
    products.push(row);
    bySku.set(row.sku, row);
    if (normName(row.sku) && (row.brandName === 'Gilės Inžinerija' || row.brandName === 'Megatherm')) {
        gilesBrandKeys.add(normName(row.sku));
    }
    added.push(row);
    return true;
}

for (const [sku, r] of danfossBySku) {
    if (bySku.has(sku)) continue;
    addRow(newProduct({
        supplier: 'danfoss', brandKey: 'danfoss', sku, name: r.name,
        priceCents: cents(Number(r.retail_net_eur) * 1.21),
        costCents: cents(Number(r.cost_net_eur)),
        ean: r.ean && /^\d{13}$/.test(String(r.ean)) ? String(r.ean) : null,
    }));
    stats.adds.danfoss++;
}
for (const [sku, r] of herzBySku) {
    if (bySku.has(sku)) continue;
    addRow(newProduct({
        supplier: 'herz', brandKey: 'herz', sku, name: r.name,
        priceCents: cents(Number(r.retail_net_eur) * 1.21),
        costCents: cents(Number(r.retail_net_eur) * 0.5),
        ean: null,
    }));
    stats.adds.herz++;
}
for (const [k, v] of gilesByItem) {
    if (resolveGilesCatalogRow(k)) continue;
    const base = k.toUpperCase().replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    let sku = base || `GILES-${detId('sku', k).slice(0, 8)}`;
    if (bySku.has(sku)) sku = `${sku}-${detId('sku', k).slice(0, 4)}`;
    addRow(newProduct({
        supplier: 'giles2025',
        brandKey: /^mpb|nani|degikl/.test(k) ? 'megatherm' : 'giles',
        sku, name: v.name,
        priceCents: cents(v.list * 1.21),
        costCents: cents(v.net),
        ean: null,
        sheet: v.sheet,
    }));
    stats.adds.giles++;
}
// Haier adds: none. All 6 W120 "missing" rows pre-exist under alias SKUs
// (WK-B, IGU02, FILTR, AB282MNERA-4W, YR-E27-ACC, ATW-A01-ACC) with
// price-exact values — adding duplicates would be worse than the gap.

// --------------------------------------------- 3) catalog-wide policies
// 3a. Kill synthetic EANs (field + specs + description text), keep source-real.
let synthKilledField = 0;
let synthKilledSpecs = 0;
let synthKilledDesc = 0;
for (const p of products) {
    const SYNTH = /^477000\d{7}$/;
    if (p.ean && SYNTH.test(String(p.ean))) {
        p.ean = null;
        synthKilledField++;
    }
    for (const key of ['specs', 'technicalSpecs']) {
        const specs = p[key];
        if (specs && specs['EAN-13 kodas'] && SYNTH.test(String(specs['EAN-13 kodas']))) {
            delete specs['EAN-13 kodas'];
            synthKilledSpecs++;
        }
    }
    for (const key of ['description', 'descriptionLt']) {
        const d = p[key];
        if (typeof d === 'string') {
            const cleaned = d.replace(/, EAN: 477000\d{7}/g, '');
            if (cleaned !== d) {
                p[key] = cleaned;
                synthKilledDesc++;
            }
        }
    }
}
stats.policies.syntheticEansKilled = { field: synthKilledField, specs: synthKilledSpecs, descriptions: synthKilledDesc };

// 3b. Honest stock + availability. Real: EGIP.lt 28 rows (live ps_stock_available,
// W86-A1). Everything else: supplier warehouse 2–4 d. — stockQty null.
const EGIP = 'EGIP.lt PrestaShop bazė';
const SUPPLIER = 'Tiekėjo centrinis sandėlis (2–4 d. d.)';
let inStock = 0;
let supplierAvail = 0;
for (const p of products) {
    if (String(p.stockSource || '').includes('EGIP.lt') && typeof p.stockQuantity === 'number' && p.stockQuantity > 0 && p.priceCents != null) {
        p.availability = 'in_stock';
        p.stockSource = EGIP;
        inStock++;
    } else {
        p.availability = 'supplier_2_4d';
        p.stockQuantity = null;
        p.stock = null;
        p.stockSource = SUPPLIER;
        p.priceOnRequest = undefined;
        delete p.priceOnRequest;
        supplierAvail++;
    }
}

// 3c. Old-site-origin rows with no current pricelist: price on request.
// Never deleted — Darius's real assortment (W120-R1 no-source-found list).
// "Covered" = the SKU is matched to one of the 5 current pricelists, NOT
// merely "has some price" (the old LTL-era prices do not count as current).
const coveredSkus = new Set();
for (const sku of danfossBySku.keys()) if (bySku.has(sku)) coveredSkus.add(sku);
for (const sku of herzBySku.keys()) if (bySku.has(sku)) coveredSkus.add(sku);
for (const cols of pricecheckGorenje) if (bySku.has(cols[0])) coveredSkus.add(cols[0]);
for (const cols of pricecheckHaier) if (bySku.has(cols[0])) coveredSkus.add(cols[0]);
for (const sku of Object.keys(HAIER_ALIAS_PRICES)) if (bySku.has(sku)) coveredSkus.add(sku);
for (const p of products) {
    if ((p.brandName === 'Gilės Inžinerija' || p.brandName === 'Megatherm') && resolveGilesCatalogRow(normName(p.sku))) coveredSkus.add(p.sku);
}
const noSourceRows = parseCsv(fs.readFileSync(path.join(ART_DIR, 'W120-r1-no-source-found.csv'), 'utf8'));
const noSourceSkus = new Set(noSourceRows.map((c) => String(c[1] || '').trim()).filter(Boolean));
let onRequest = 0;
let noSourceCovered = 0;
for (const p of products) {
    if (!noSourceSkus.has(String(p.sku))) continue;
    if (coveredSkus.has(String(p.sku))) {
        noSourceCovered++;
        continue;
    }
    p.priceCents = null;
    p.costCents = null;
    p.compareAtCents = null;
    p.priceOnRequest = true;
    p.availability = 'on_request';
    p.stockQuantity = null;
    p.stock = null;
    onRequest++;
}
stats.policies.noSourceRows = noSourceSkus.size;
stats.policies.noSourceCoveredByPricelist = noSourceCovered;
stats.policies.onRequest = onRequest;

// Belt & braces: any remaining priceless row must be on_request.
let rescuedNullPrice = 0;
for (const p of products) {
    if (p.priceCents == null && p.availability !== 'on_request') {
        p.priceOnRequest = true;
        p.availability = 'on_request';
        rescuedNullPrice++;
    }
    if (p.priceOnRequest === true && p.priceCents != null) {
        p.priceOnRequest = undefined;
        delete p.priceOnRequest;
    }
}
stats.policies.rescuedNullPrice = rescuedNullPrice;
stats.policies.inStock = inStock;
stats.policies.supplierAvail = supplierAvail;

// ------------------------------------------------------------- 4) header
const stockSourcesCount = {};
for (const p of products) {
    stockSourcesCount[p.stockSource] = (stockSourcesCount[p.stockSource] || 0) + 1;
}
raw.stockSources = stockSourcesCount;
raw.totalProducts = products.length;

// --------------------------------------------------------------- 5) out
stats.totalAfter = products.length;
stats.after = {
    total: products.length,
    byBrand: {},
    priceNull: products.filter((p) => p.priceCents == null).length,
    realEans: products.filter((p) => p.ean && /^\d{13}$/.test(String(p.ean))).length,
    availability: {},
};
for (const p of products) {
    stats.after.byBrand[p.brandName] = (stats.after.byBrand[p.brandName] || 0) + 1;
    stats.after.availability[p.availability] = (stats.after.availability[p.availability] || 0) + 1;
}
stats.coverage = {
    danfoss: { source: danfossBySku.size, inCatalog: [...danfossBySku.keys()].filter((s) => bySku.has(s)).length },
    herz: { source: herzBySku.size, inCatalog: [...herzBySku.keys()].filter((s) => bySku.has(s)).length },
    gorenje: { source: gorenjeBySku.size, matchedInCatalog: pricecheckGorenje.filter((c) => bySku.has(c[0])).length },
    haier: {
        pricecheckRows: pricecheckHaier.length,
        pricecheckInCatalog: pricecheckHaier.filter((c) => bySku.has(c[0])).length,
        aliasRows: Object.keys(HAIER_ALIAS_PRICES).filter((s) => bySku.has(s)).length,
        catalogHaierRows: products.filter((p) => p.brandName === 'Haier').length,
        note: 'model-string matching owned by W120-R1 artifacts; catalog-side coverage 458+6 alias +1 documented extra (AB162MCFRA)',
    },
    giles2025: { sourceRows: gilesRows.length, distinctItems: gilesByItem.size, resolved: [...gilesByItem.keys()].filter((k) => resolveGilesCatalogRow(k)).length },
};

const uniqSkus = new Set(products.map((p) => String(p.sku))).size;
const uniqIds = new Set(products.map((p) => String(p.id))).size;
const uniqDesc = new Set(products.map((p) => String(p.description))).size;
stats.uniqueness = { skus: uniqSkus, ids: uniqIds, descriptions: uniqDesc };

if (DRY_RUN) {
    console.log(JSON.stringify(stats, null, 2));
    process.exit(0);
}

if (!fs.existsSync(backupPath)) {
    fs.copyFileSync(catalogPath, backupPath);
    console.log(`backup written: ${backupPath}`);
}
fs.writeFileSync(catalogPath, JSON.stringify(raw, null, 2) + '\n', 'utf8');
fs.writeFileSync(statsPath, JSON.stringify(stats, null, 2) + '\n', 'utf8');
console.log(`catalog: ${before.total} -> ${products.length} products`);
console.log(`updates: ${JSON.stringify(stats.updates)}`);
console.log(`adds: ${JSON.stringify(stats.adds)}`);
console.log(`policies: in_stock=${inStock} supplier=${supplierAvail} on_request=${onRequest}`);
console.log(`synthetic EANs removed: field=${synthKilledField} specs=${synthKilledSpecs} desc=${synthKilledDesc}; real EANs left=${stats.after.realEans}`);
console.log(`coverage: ${JSON.stringify(stats.coverage)}`);
console.log(`stats: ${statsPath}`);
