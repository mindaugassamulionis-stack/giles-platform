// Skaičiuoklės užklausa (lead): validacija ir URL būsena. Bendra klientui ir serveriui.
// Siuntimas į serverį – atskiras S5 slice (POST /api/leads reikalauja security signoff); čia tik grynos funkcijos.
// W126-A1: perkelta iš skaiciuokle-v2 paketo src-reference/lead.ts.
import type { HeatInput } from './heat-calc';

export interface HeatLead {
  type: 'heating-calc';
  phone: string;
  name?: string;
  city?: string;
  email?: string;
  call_time: 'morning' | 'afternoon' | 'any';
  visit: boolean;
  chosen: 'hp_aw' | 'pellet_boiler' | 'conversion' | null;
  input: HeatInput; // viskas, ką įvedė vartotojas – inžinierius mato tą patį
  result: { design_kw: number; hp_kw: number; annual_mwh: number; current_cost: number | null; options: { id: string; device_sku: string | null; kw: number | null; net_capex: number; grant: number }[] };
  config_version: string; // heat-config version + lea data_date, pvz. "2026-11|2026-10-26"
  page_url: string; // su ?plotas=…, kad būtų galima atkurti
  utm?: Record<string, string>;
  website?: string; // honeypot – turi būti tuščias
}

const PHONE = /^\+?[0-9 ()-]{8,20}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function validateLead(l: Partial<HeatLead>, msg = { phone: 'Įveskite telefono numerį, pvz., +370 600 00000', email: 'Patikrinkite el. pašto adresą' }) {
  const e: Partial<Record<keyof HeatLead, string>> = {};
  if (!l.phone || !PHONE.test(l.phone.trim())) e.phone = msg.phone;
  if (l.email && !EMAIL.test(l.email.trim())) e.email = msg.email;
  return e;
}

/** Serveryje: atmesti, jei užpildytas honeypot arba užklausa siunčiama < 3 s nuo puslapio atidarymo. */
export function isSpam(l: Partial<HeatLead>, msSincePageLoad: number) {
  return !!l.website || msSincePageLoad < 3000;
}

/** URL būsena: tie patys parametrai visur (puslapis, PDF, CRM nuoroda). Žr. heat-config.lt.json › url_params. */
/* eslint-disable @typescript-eslint/no-explicit-any */
export function toQuery(i: HeatInput, cfg: any): string {
  const p = new URLSearchParams();
  p.set('plotas', String(i.area_m2));
  p.set('bukle', i.building_class);
  p.set('dabar', cfg.current_heating.find((c: any) => c.id === i.current)?.slug ?? i.current);
  if (i.emitters) p.set('prietaisai', i.emitters);
  if (i.people) p.set('zmones', String(i.people));
  if (i.ceiling_m) p.set('lubos', String(i.ceiling_m));
  if (i.big_city_dh_zone) p.set('cst', '1');
  return p.toString();
}

/** Neteisingos / nežinomos reikšmės → numatytosios (cfg.defaults), be klaidos. */
export function fromQuery(q: URLSearchParams, cfg: any): HeatInput {
  const d = cfg.defaults;
  const n = (k: string, min: number, max: number, def: number) => { const v = Number(q.get(k)); return Number.isFinite(v) && v >= min && v <= max ? v : def; };
  const cls = q.get('bukle'); const cur = q.get('dabar'); const em = q.get('prietaisai');
  return {
    area_m2: n('plotas', cfg.area_limits.min, cfg.area_limits.max, d.area_m2),
    building_class: cfg.building_classes.some((c: any) => c.id === cls) ? cls! : d.building_class,
    current: cfg.current_heating.find((c: any) => c.slug === cur || c.id === cur)?.id ?? d.current,
    emitters: cfg.emitters.some((e: any) => e.id === em) ? em! : d.emitters,
    people: n('zmones', 1, 8, d.people),
    ceiling_m: n('lubos', 2.2, 4, d.ceiling_m),
    big_city_dh_zone: q.get('cst') === '1',
  };
}
