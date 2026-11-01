// Šildymo skaičiavimai (namams) – galia, metinis poreikis, sprendimų palyginimas, 10 m. išlaidos.
// Visi skaičiai – iš data/heat/heat-config.lt.json, devices.lt.json, lea-2026.lt.json. Jokių „įkaltų“ reikšmių komponentuose.
// W126-A1: perkelta iš skaiciuokle-v2 paketo src-reference/heat-calc.ts (28 priėmimo vektoriai).

import { leaEligibility, leaGrant, bandTip, type LeaData, type LeaType } from './lea';

export interface HeatInput {
  area_m2: number;
  building_class: string; // heat-config building_classes[].id
  current: string; // heat-config current_heating[].id
  emitters?: string; // ufh | mixed | rad
  ceiling_m?: number;
  people?: number;
  building_type?: 'house' | 'apartment';
  big_city_dh_zone?: boolean;
  prices?: Partial<{ fuel_now_eur_mwh: number; electricity_eur_mwh: number; pellets_eur_mwh: number }>; // „Mano kainos“
}

/* eslint-disable @typescript-eslint/no-explicit-any */
const r1 = (n: number) => Math.round(n * 10) / 10;
const r0 = (n: number) => Math.round(n);

export function heatDemand(cfg: any, i: HeatInput) {
  const cls = cfg.building_classes.find((c: any) => c.id === i.building_class);
  if (!cls) throw new Error('Nežinoma pastato klasė ' + i.building_class);
  const area = Math.min(Math.max(i.area_m2, cfg.area_limits.min), cfg.area_limits.max);
  const h = (i.ceiling_m ?? cfg.ceiling_ref_m) / cfg.ceiling_ref_m;
  const people = i.people ?? 3;
  const designRaw = (area * cls.q_w_m2 * h * (1 + cfg.sizing_reserve)) / 1000;
  const design_kw = r1(designRaw);
  const dhwRaw = people * cfg.dhw.kw_per_person_hp; // apvalinti tik galutinį rezultatą
  const space_mwh = (area * cls.e_kwh_m2a * h) / 1000;
  const dhw_mwh = people * cfg.dhw.mwh_per_person_year;
  return {
    design_kw,
    hp_kw: r1(designRaw + dhwRaw),
    annual_mwh: r1(space_mwh + dhw_mwh),
    q_w_m2: cls.q_w_m2,
    clamped: area !== i.area_m2,
    b2b: i.area_m2 > cfg.area_limits.b2b_above,
  };
}

function pick(devices: any[], kw: number) {
  return devices.find((d) => d.kw >= kw) ?? null; // mažiausias tinkamas
}

export interface Option {
  id: string;
  label: string;
  available: boolean;
  why_not?: string;
  device?: { sku: string | null; label: string; kw: number };
  capex: number; // įrenginys + montavimas, su PVM
  grant: number; // LEA, €
  grant_eligible: boolean;
  grant_reasons: string[];
  net_capex: number;
  annual_cost: number; // kuras/elektra + aptarnavimas
  saving_year: number | null; // lyginant su dabartiniu
  payback_years: number | null;
  tco: number; // net_capex + metai × annual_cost
  band_tip: { kw: number; grant: number; diff: number } | null;
  refuel_days: number | null; // granulių bunkerio autonomija vidutiniškai, d.
}

export function compare(cfg: any, devices: any, lea: LeaData, i: HeatInput) {
  const d = heatDemand(cfg, i);
  const cur = cfg.current_heating.find((c: any) => c.id === i.current);
  if (!cur) throw new Error('Nežinomas dabartinis šildymas ' + i.current);
  const em = cfg.emitters.find((e: any) => e.id === (i.emitters ?? 'mixed'));
  const elec = i.prices?.electricity_eur_mwh ?? cfg.solutions[0].electricity_eur_mwh;
  const pellets = i.prices?.pellets_eur_mwh ?? cfg.solutions[1].fuel_eur_mwh;
  const curFuel = i.prices?.fuel_now_eur_mwh ?? cur.fuel_eur_mwh;
  const current_cost = cur.fuel_eur_mwh == null ? null : r0((d.annual_mwh / cur.eff) * curFuel + cur.service_eur_year);
  const years = cfg.tco_years;
  const building = i.building_type ?? 'house';

  // LEA suma rodoma suapvalinta žemyn – niekada nežadame daugiau, nei priklauso.
  const make = (id: string, label: string, dev: any, capex: number, annual: number, leaType: LeaType | null, extra: Partial<Option> = {}): Option => {
    let grant = 0, grant_eligible = false, grant_reasons: string[] = ['LEA kompensacija šiam sprendimui netaikoma (nėra naujas 5 klasės katilas ar šilumos siurblys).'];
    let tip = null;
    if (leaType && dev) {
      const el = leaEligibility(lea, { building, oldSystem: cur.lea_old, inBigCityDhZone: !!i.big_city_dh_zone, type: leaType });
      grant_eligible = el.eligible; grant_reasons = el.reasons;
      grant = el.eligible ? Math.min(leaGrant(lea, leaType, dev.kw), capex) : 0;
      const pool = id === 'hp_aw' ? devices.hp_aw : devices.pellet_boiler;
      const req = id === 'hp_aw' ? d.hp_kw : d.design_kw;
      if (el.eligible) tip = bandTip(lea, leaType, req, dev.kw, pool.map((x: any) => x.kw));
    }
    const net_capex = r0(capex - grant);
    const saving = current_cost == null ? null : r0(current_cost - annual);
    const payback = saving && saving > 0 ? r1(net_capex / saving) : null;
    return {
      id, label, available: true,
      device: dev ? { sku: dev.sku, label: dev.label, kw: dev.kw } : undefined,
      capex: r0(capex), grant: Math.floor(grant), grant_eligible, grant_reasons, net_capex,
      annual_cost: r0(annual), saving_year: saving, payback_years: payback,
      tco: r0(net_capex + years * annual), band_tip: tip, refuel_days: null, ...extra,
    };
  };
  const na = (id: string, label: string, why: string): Option => ({ id, label, available: false, why_not: why, capex: 0, grant: 0, grant_eligible: false, grant_reasons: [], net_capex: 0, annual_cost: 0, saving_year: null, payback_years: null, tco: 0, band_tip: null, refuel_days: null });

  const out: Option[] = [];
  // 1. Šilumos siurblys oras–vanduo
  const s = cfg.solutions.find((x: any) => x.id === 'hp_aw');
  const hp = pick(devices.hp_aw, d.hp_kw);
  if (!hp) out.push(na('hp_aw', s.label, 'Reikalinga galia viršija namų modelius – parengsime individualų sprendimą.'));
  else out.push(make('hp_aw', s.label, hp, hp.ref_price_eur + s.install_eur, (d.annual_mwh / em.scop_aw) * elec + s.service_eur_year, hp.dhw_integrated ? 'hp_aw_dhw' : 'hp_aw'));
  // 2. Granulinis katilas 5 kl.
  const b = cfg.solutions.find((x: any) => x.id === 'pellet_boiler');
  const pb = pick(devices.pellet_boiler, d.design_kw);
  if (!pb) out.push(na('pellet_boiler', b.label, 'Reikalinga galia viršija namų modelius.'));
  else {
    const daily = (d.annual_mwh * 1000) / 200 / b.eff / b.pellet_kwh_per_kg; // kg/d. vidutiniškai (200 d. sezonas)
    out.push(make('pellet_boiler', b.label, pb, pb.ref_price_eur + b.install_eur, (d.annual_mwh / b.eff) * pellets + b.service_eur_year, 'bio', { refuel_days: Math.max(1, Math.floor((350 * b.pellet_kg_per_l) / daily)) }));
  }
  // 3. Perdarymas
  const c = cfg.solutions.find((x: any) => x.id === 'conversion');
  if (!cur.convertible) out.push(na('conversion', c.label, 'Tinka tik turint kieto kuro katilą su vandens sistema.'));
  else {
    const kit = devices.conversion.find((k: any) => k.kw >= d.design_kw && k.kw_min <= d.design_kw);
    if (!kit) out.push(na('conversion', c.label, 'Galia netinka perdarymo komplektams – reikia inžinieriaus įvertinimo.'));
    else {
      const daily = (d.annual_mwh * 1000) / 200 / c.eff / b.pellet_kwh_per_kg;
      out.push(make('conversion', c.label, kit, kit.ref_price_eur, (d.annual_mwh / c.eff) * pellets + c.service_eur_year, null, { refuel_days: Math.max(1, Math.floor((350 * b.pellet_kg_per_l) / daily)) }));
    }
  }
  const avail = out.filter((o) => o.available);
  const best = avail.length ? avail.reduce((a, o) => (o.tco < a.tco ? o : a)).id : null;
  return { demand: d, current_cost, current_label: cur.label, years, options: out, best };
}
