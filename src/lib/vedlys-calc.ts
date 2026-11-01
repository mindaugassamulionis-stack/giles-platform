// Vedlio skaičiavimai – vienas šaltinis klientui ir serveriui. Jokių „hardcoded“ sezonų, autonomijų ar temperatūrų.
// Naudojimas: import rules from '../data/vedlys-rules.lt.json'; computeWizard(rules, input, catalogPrices)
// W124-A1 (F2/F1.1): integruota iš savininko vertinimo paketo 2026-11-01 (src-reference/vedlys-calc.ts).

export type Building = 'senas' | 'renovuotas' | 'naujas';
export type Fuel = 'malkos' | 'anglis';

export interface WizardInput {
  boiler: string; // slug arba alias iš ?boiler=
  area_m2: number;
  building: Building;
  fuel_now: Fuel;
  bunker_l: number;
  wifi: boolean;
  install: boolean;
}

export interface Rules {
  boilers: { slug: string; aliases: string[]; label: string; kind?: string; range_kw: [number, number]; flange_sku: string | null; burners: string[]; online_checkout?: boolean; redirect?: string; source?: string }[];
  burners: { sku: string; label: string; range_kw: [number, number]; includes?: string[]; self_cleaning: boolean; self_cleaning_addon_sku?: string; price_source?: string; source?: string }[];
  heat_load_w_per_m2: Record<Building, number> & { reserve: number };
  annual_heat_kwh_per_m2: Record<Building, number>;
  heating_season_hours: number;
  pellet: { bulk_density_kg_per_l: number; ncv_kwh_per_kg: number };
  efficiency: { manual_old: number; pellet_converted: number };
  fuels_eur_per_mwh: Record<Fuel | 'granules', { label?: string; mid: number; range?: number[] }>;
}

export type Prices = Record<string, number>; // SKU → kaina su PVM, € (iš katalogo)

export function resolveBoiler(rules: Rules, slug: string | null | undefined) {
  if (!slug) return null;
  const s = slug.toLowerCase();
  return rules.boilers.find((b) => b.slug === s || b.aliases.includes(s)) ?? null;
}

/** Reikalinga galia, kW (su rezervu), suapvalinta iki 1 kW. */
export function designKw(rules: Rules, area: number, building: Building): number {
  const w = rules.heat_load_w_per_m2[building];
  return Math.round((area * w * (1 + rules.heat_load_w_per_m2.reserve)) / 1000);
}

/** Degiklis turi tikti IR galiai, IR katilo diapazonui. null → derinys negalimas (rodyti klaidą / RFQ). */
export function pickBurner(rules: Rules, boilerSlug: string, kw: number, available?: Set<string>) {
  const b = resolveBoiler(rules, boilerSlug);
  if (!b) return { ok: false as const, reason: 'unknown-boiler' };
  if (b.online_checkout === false) return { ok: false as const, reason: 'rfq-only', redirect: b.redirect };
  if (kw > b.range_kw[1]) return { ok: false as const, reason: 'boiler-too-small', max: b.range_kw[1] };
  const fits = rules.burners
    .filter((x) => b.burners.includes(x.sku) && (!available || available.has(x.sku)) && x.range_kw[0] <= kw && kw <= x.range_kw[1])
    .sort((a, c) => a.range_kw[1] - c.range_kw[1]); // mažiausias tinkamas
  if (!fits.length) return { ok: false as const, reason: 'no-burner' };
  return { ok: true as const, boiler: b, burner: fits[0] };
}

/** Autonomija dienomis: vidutiniškai sezono metu ir per šalčius (projektinė apkrova). */
export function autonomyDays(rules: Rules, liters: number, area: number, building: Building) {
  const kg = liters * rules.pellet.bulk_density_kg_per_l;
  const fuelKwh = kg * rules.pellet.ncv_kwh_per_kg * rules.efficiency.pellet_converted; // naudinga šiluma
  const annual = area * rules.annual_heat_kwh_per_m2[building];
  const avgKw = annual / rules.heating_season_hours;
  const coldKw = (area * rules.heat_load_w_per_m2[building]) / 1000;
  return { avg: Math.max(1, Math.floor(fuelKwh / (avgKw * 24))), cold: Math.max(1, Math.floor(fuelKwh / (coldKw * 24))), kg: Math.round(kg) };
}

/** Kuro išlaidos per sezoną prieš / po ir atsipirkimas metais. Gali būti neigiamas sutaupymas – tai normalu, rodyti sąžiningai. */
export function seasonCost(rules: Rules, area: number, building: Building, fuelNow: Fuel, kitPrice: number) {
  const heatMwh = (area * rules.annual_heat_kwh_per_m2[building]) / 1000;
  const before = Math.round((heatMwh / rules.efficiency.manual_old) * rules.fuels_eur_per_mwh[fuelNow].mid);
  const after = Math.round((heatMwh / rules.efficiency.pellet_converted) * rules.fuels_eur_per_mwh.granules.mid);
  const saving = before - after;
  const paybackYears = saving > 0 ? Math.round((kitPrice / saving) * 10) / 10 : null;
  return { heatMwh: Math.round(heatMwh * 10) / 10, before, after, saving, paybackYears };
}

/** Komplekto eilutės ir suma. Kainos – tik iš katalogo (Prices). Trūksta SKU kainos → klaida, ne 0. */
export function buildKit(rules: Rules, input: WizardInput, prices: Prices) {
  const kw = designKw(rules, input.area_m2, input.building);
  const pick = pickBurner(rules, input.boiler, kw, new Set(Object.keys(prices))); // tik tie, kurie turi katalogo kainą
  if (!pick.ok) return { ok: false as const, kw, reason: pick.reason, ...(pick as { max?: number; redirect?: string }) };
  const lines: { sku: string; qty: number; price: number }[] = [];
  const add = (sku: string | null | undefined) => {
    if (!sku) return;
    const price = prices[sku];
    if (price == null) throw new Error(`Nėra katalogo kainos SKU ${sku}`);
    lines.push({ sku, qty: 1, price });
  };
  add(pick.burner.sku);
  if (!pick.burner.self_cleaning && pick.burner.self_cleaning_addon_sku) add(pick.burner.self_cleaning_addon_sku); // jei žadame „savaime išsivalantis“
  add(pick.boiler.flange_sku);
  add(`GI-BNK-${input.bunker_l}`);
  add('GI-SAFE-STB95');
  if (!pick.burner.includes?.includes('sraigtas')) add('GI-AUGER-2000');
  if (!pick.burner.includes?.includes('valdiklis')) add('GI-CTRL-TOUCH');
  if (input.wifi) add('GI-WIFI-NET');
  if (input.install) add('GI-SERV-INSTALL');
  const total = lines.reduce((s, l) => s + l.price * l.qty, 0);
  const totalRounded = Math.round(total * 100) / 100;
  return { ok: true as const, kw, burner: pick.burner, boiler: pick.boiler, lines, total: totalRounded, net: Math.round((totalRounded / 1.21) * 100) / 100 };
}
