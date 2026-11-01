// LEA katilų keitimo kompensacija – pagal oficialius įkainius (src/data/heat/lea-2026.lt.json).
// Grynos funkcijos: tos pačios klientui, serveriui ir Vytauto AI.
// W126-A1: perkelta iš skaiciuokle-v2 paketo src-reference/lea.ts (28 priėmimo vektoriai qa/heat-calc.test.ts).

export type LeaType = 'bio' | 'hp_aw' | 'hp_aw_dhw' | 'hp_gw' | 'hp_gw_dhw' | 'hp_aa';

export interface LeaData {
  max_share: number;
  next_call: string;
  rates_eur_per_kw_incl_vat: Record<LeaType, { max_kw: number | null; rate: number }[]>;
  eligibility: {
    buildings: Record<'house' | 'apartment', { water: LeaType[]; air: LeaType[] }>;
    installed_from: { water: string; air: string };
  };
}

export function leaRate(lea: LeaData, type: LeaType, kw: number): number {
  const bands = lea.rates_eur_per_kw_incl_vat[type];
  const band = bands.find((b) => b.max_kw === null || kw <= b.max_kw);
  if (!band) throw new Error(`Nėra LEA įkainio ${type} ${kw} kW`);
  return band.rate;
}

/** Didžiausia kompensacija eurais (suapvalinta iki euro centų žemyn). */
export function leaGrant(lea: LeaData, type: LeaType, kw: number): number {
  return Math.floor(leaRate(lea, type, kw) * kw * lea.max_share * 100) / 100;
}

export interface EligibilityInput {
  building: 'house' | 'apartment';
  oldSystem: 'inefficient' | 'air-heating' | 'not-eligible'; // iš heat-config current_heating[].lea_old
  inBigCityDhZone: boolean; // 5 didžiųjų miestų CŠT zona
  type: LeaType;
}

export interface Eligibility {
  eligible: boolean;
  reasons: string[]; // kodėl ne (rodyti vartotojui)
  checks: { label: string; ok: boolean }[]; // kontrolinis sąrašas puslapyje
}

export function leaEligibility(lea: LeaData, i: EligibilityInput): Eligibility {
  const reasons: string[] = [];
  const oldOk = i.oldSystem !== 'not-eligible';
  if (!oldOk) reasons.push('Keičiamas įrenginys turi būti neefektyvus biokuro ar iškastinio kuro katilas, krosnis ar židinys (elektrinis šildymas ir nauji namai – nefinansuojami).');
  const allowed = oldOk ? lea.eligibility.buildings[i.building][i.oldSystem === 'air-heating' ? 'air' : 'water'] : [];
  const typeOk = allowed.includes(i.type);
  if (oldOk && !typeOk) reasons.push('Šiam pastatui ir senai sistemai toks naujas įrenginys nefinansuojamas.');
  const zoneOk = !(i.type === 'bio' && i.inBigCityDhZone);
  if (!zoneOk) reasons.push('Biokuro katilams parama netaikoma 5 didžiųjų miestų CŠT zonose.');
  return {
    eligible: oldOk && typeOk && zoneOk,
    reasons,
    checks: [
      { label: 'Keičiate neefektyvų kieto kuro, dujų ar skysto kuro katilą, krosnį ar židinį', ok: oldOk },
      { label: 'Naujas įrenginys – šilumos siurblys arba 5 klasės biokuro katilas', ok: typeOk },
      { label: 'Biokuro katilas ne 5 didžiųjų miestų CŠT zonoje', ok: zoneOk },
      { label: 'Paraiška teikiama tik įrengus naują įrenginį', ok: true },
      { label: 'Įrenginį išlaikysite 5 metus', ok: true },
    ],
  };
}

/** Patarimas dėl galios juostos: ar mažesnis TINKAMAS modelis gautų daugiau paramos. Niekada nesiūlo per mažo įrenginio. */
export function bandTip(lea: LeaData, type: LeaType, requiredKw: number, chosenKw: number, availableKw: number[]) {
  const chosen = leaGrant(lea, type, chosenKw);
  const better = availableKw
    .filter((kw) => kw >= requiredKw && kw < chosenKw)
    .map((kw) => ({ kw, grant: leaGrant(lea, type, kw) }))
    .filter((x) => x.grant > chosen)
    .sort((a, b) => b.grant - a.grant)[0];
  return better ? { kw: better.kw, grant: better.grant, diff: Math.round((better.grant - chosen) * 100) / 100 } : null;
}
