// W126-A1 (S1): generuoja src/data/heat/catalog-prices.lt.json iš gyvo katalogo
// (src/data/giles-catalog-6337.json). Vienintelis SKU kainos šaltinis skaiciuoklei,
// masterpiece komplektams ir darbastalio BOM – kad visur rodytų tą pačią kainą.
// Paleisti: node scripts/gen-heat-catalog-prices.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const catalogPath = path.join(root, 'src/data/giles-catalog-6337.json');
const outPath = path.join(root, 'src/data/heat/catalog-prices.lt.json');

const SKUS = [
  'MPB-NANI-35', 'MPB-NANI-50', 'MPB-80-PRO', 'MPB-150-PRO', 'MPB-300-PRO',
  'DEGKMPL140MG20', 'DEGKMPL140PV20',
  'AW082HUGHA', 'KATRI3850020', 'ZV 100', '1776603', '013G2990',
  '7101003', '52-151-014', '52-151-020', '0270132', '4248084', '5363019', '065B0774',
  '9330-08.800', '88.04.120', '2217972', '0675-05.000',
];

const raw = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
const products = raw.products ?? raw;
const found = {};
for (const p of products) {
  const sku = (p.sku ?? '').toUpperCase();
  if (!SKUS.includes(sku) || found[sku]) continue;
  const price = p.priceEur ?? (typeof p.priceCents === 'number' ? p.priceCents / 100 : null);
  found[sku] = {
    sku,
    price: price && price > 0 ? price : null, // null → kaina pagal užklausą (on_request)
    availability: p.availability ?? 'supplier_2_4d',
    name: p.name ?? sku,
    slug: p.slug ?? null,
  };
}
const missing = SKUS.filter((s) => !found[s]);
if (missing.length) throw new Error(`Kataloge nerasti SKU: ${missing.join(', ')}`);

const payload = {
  _about: 'Katalogo kainos su PVM (šešėlis iš giles-catalog-6337.json, generuota scripts/gen-heat-catalog-prices.mjs). price = null → „Kaina pagal užklausą“ (on_request). Neredaguoti ranka – generuoti iš naujo.',
  generated: new Date().toISOString().slice(0, 10),
  prices: Object.fromEntries(SKUS.map((s) => [s, found[s]])),
};
fs.writeFileSync(outPath, JSON.stringify(payload, null, 2) + '\n', 'utf8');
console.log(`OK: ${SKUS.length} SKU → ${path.relative(root, outPath)}`);
