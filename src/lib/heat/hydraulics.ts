// Montuotojų režimas: hidraulinio mazgo skaičiavimai su TEISINGOMIS formulėmis.
// Kiekviena funkcija grąžina ir formulę su įstatytomis reikšmėmis – ji rodoma protokole ir PDF.
// W126-A1: perkelta iš skaiciuokle-v2 paketo src-reference/hydraulics.ts (28 priėmimo vektoriai).
// Workbencho EN 12828 indas lieka src/lib/heat-load-calc.ts calcEn12828ExpansionVessel (sujungta: p0 min 0,5 bar abiejuose).

const r = (n: number, d = 0) => Math.round(n * 10 ** d) / 10 ** d;

/** Vandens plėtimosi koeficientas e nuo 10 °C iki t_max (iš tankio lentelės). */
export function expansionCoeff(tMax: number): number {
  const rho: [number, number][] = [[10, 999.7], [30, 995.7], [40, 992.2], [50, 988.0], [60, 983.2], [70, 977.8], [80, 971.8], [90, 965.3]];
  const hi = rho.find(([t]) => t >= tMax) ?? rho[rho.length - 1];
  const lo = [...rho].reverse().find(([t]) => t <= tMax) ?? rho[0];
  const rhoT = hi[0] === lo[0] ? lo[1] : lo[1] + ((tMax - lo[0]) / (hi[0] - lo[0])) * (hi[1] - lo[1]);
  return 999.7 / rhoT - 1;
}

/**
 * Išsiplėtimo indas pagal EN 12828: Vn = (Ve + Vwr) × (pe + 1) / (pe − p0)  [slėgiai – manometriniai, +1 bar → absoliutiniai]
 * Ve = e × Vs; Vwr = max(0,005 × Vs; 3 l); p0 = H/10 + 0,2 bar (min 0,5); pe = psv − 0,5 bar (psv ≤ 5 bar), kitaip 0,9 × psv.
 */
export function expansionVessel(i: { system_l: number; t_max_c: number; static_h_m: number; psv_bar: number }) {
  const e = expansionCoeff(i.t_max_c);
  const Ve = e * i.system_l;
  const Vwr = Math.max(0.005 * i.system_l, 3);
  const p0 = Math.max(i.static_h_m / 10 + 0.2, 0.5);
  const pe = i.psv_bar <= 5 ? i.psv_bar - 0.5 : 0.9 * i.psv_bar;
  if (pe <= p0) throw new Error('Apsauginio vožtuvo slėgis per mažas šiam pastato aukščiui');
  const Vn = ((Ve + Vwr) * (pe + 1)) / (pe - p0);
  const sizes = [8, 12, 18, 25, 35, 50, 80, 100, 140, 200, 250, 300, 400, 500];
  return {
    Vn: r(Vn, 1), size_l: sizes.find((s) => s >= Vn) ?? null, p0: r(p0, 1), fill_bar: r(p0 + 0.3, 1), pe: r(pe, 1), e: r(e, 4),
    formula: `Vn = (${r(Ve, 1)} + ${r(Vwr, 1)}) × (${r(pe, 1)} + 1) / (${r(pe, 1)} − ${r(p0, 1)}) = ${r(Vn, 1)} l`,
  };
}

/**
 * Akumuliacinė talpa:
 *  - rankinio kūrenimo kieto kuro katilas: EN 303-5  Vsp = 15 × Tb × QN × (1 − 0,3 × QH / Qmin)  [l], ne mažiau 300 l;
 *  - automatinis granulių degiklis / katilas: rekomendacija 20 l/kW ciklams mažinti (ne privaloma);
 *  - šilumos siurblys: gamintojo minimalus sistemos tūris (min_volume_l), kitaip 10 l/kW;
 *  - elektrinis katilas: nereikia.
 */
export function bufferTank(i: { source: 'manual_solid' | 'pellet' | 'hp' | 'electric'; qn_kw: number; qh_kw: number; qmin_kw?: number; tb_h?: number; hp_min_volume_l?: number }) {
  const sizes = [0, 100, 150, 200, 300, 500, 750, 800, 1000, 1500, 2000];
  let v = 0, rule = '', mandatory = false;
  if (i.source === 'manual_solid') {
    const tb = i.tb_h ?? 4, qmin = i.qmin_kw ?? i.qn_kw;
    v = Math.max(15 * tb * i.qn_kw * (1 - (0.3 * i.qh_kw) / qmin), 300);
    rule = `EN 303-5: Vsp = 15 × ${tb} × ${i.qn_kw} × (1 − 0,3 × ${i.qh_kw} / ${qmin}) = ${r(v)} l`; mandatory = true;
  } else if (i.source === 'pellet') { v = 20 * i.qn_kw; rule = `Rekomendacija: 20 l/kW × ${i.qn_kw} kW = ${r(v)} l (nebūtina)`; }
  else if (i.source === 'hp') { v = i.hp_min_volume_l ?? 10 * i.qn_kw; rule = i.hp_min_volume_l ? `Gamintojo min. tūris: ${v} l` : `10 l/kW × ${i.qn_kw} kW = ${r(v)} l (tikslinti pagal gamintoją)`; }
  else { rule = 'Elektriniam katilui akumuliacinė talpa nereikalinga'; }
  return { V: r(v), size_l: v === 0 ? 0 : sizes.find((s) => s >= v) ?? null, mandatory, rule };
}

/** Srautas G = Q × 860 / ΔT  [l/h], Q – kW. */
export function flow(q_kw: number, dt_k: number) {
  const G = (q_kw * 860) / dt_k;
  return { G_lh: r(G), G_m3h: r(G / 1000, 2), formula: `G = ${q_kw} × 860 / ${dt_k} = ${r(G)} l/h` };
}

/** Balansavimo vožtuvo Kv = G / √Δp  [m³/h, bar]. Rekomenduojamas Δp 0,1 bar (10 kPa). */
export function kvValue(G_m3h: number, dp_bar = 0.1) {
  const kv = G_m3h / Math.sqrt(dp_bar);
  const dn: [string, number][] = [['DN15', 2.5], ['DN20', 5.7], ['DN25', 8.7], ['DN32', 14.2], ['DN40', 19.2], ['DN50', 33]];
  return { Kv: r(kv, 2), dn: (dn.find(([, kvs]) => kvs >= kv * 1.25) ?? dn[dn.length - 1])[0], formula: `Kv = ${G_m3h} / √${dp_bar} = ${r(kv, 2)}` };
}

/** Grindinio šildymo kontūrai: vamzdis = plotas / žingsnis + 2 × pievadas; kontūro ilgis ≤ max_loop_m (16 mm – 100 m). */
export function ufhLoops(i: { area_m2: number; spacing_m: number; leader_m: number; max_loop_m?: number }) {
  const max = i.max_loop_m ?? 100;
  let n = Math.max(1, Math.ceil((i.area_m2 / i.spacing_m) / (max - 2 * i.leader_m)));
  const loopLen = () => i.area_m2 / i.spacing_m / n + 2 * i.leader_m;
  while (loopLen() > max) n++;
  return { loops: n, loop_m: r(loopLen()), total_m: r(loopLen() * n), formula: `${i.area_m2} m² / ${i.spacing_m} m + 2 × ${i.leader_m} m × ${n} kont.` };
}

/** Siurblio aukštis (supaprastintas): H = (R × L × (1 + z) + Δp_fiks) / 9 810  [m v. st.]; R – Pa/m, z – vietinių pasipriešinimų dalis. */
export function pumpHead(i: { R_pa_m?: number; L_m: number; z?: number; dp_fixed_pa: number }) {
  const R = i.R_pa_m ?? 120, z = i.z ?? 0.3;
  const pa = R * i.L_m * (1 + z) + i.dp_fixed_pa;
  return { H_m: r(pa / 9810, 2), formula: `H = (${R} × ${i.L_m} × ${1 + z} + ${i.dp_fixed_pa}) / 9 810 = ${r(pa / 9810, 2)} m` };
}
