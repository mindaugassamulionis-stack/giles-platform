// Nuomos sandorio konfigūratoriaus ir Momentinio sandorio stalčiaus skaičiavimai.
// Grynos funkcijos be React, kad Vitest galėtų importuoti tiesiogiai.

export interface RentalPowerOption {
    code: 'GK-150M' | 'GK-300M' | 'GK-500M';
    kW: number;
    label: string;
    sub: string;
    baseNetEurMonth: number;
}

export const BOILER_RENTAL_POWER_OPTIONS: RentalPowerOption[] = [
    { code: 'GK-150M', kW: 150, label: 'GK-150M', sub: '150 kW ant priekabos', baseNetEurMonth: 1450 },
    { code: 'GK-300M', kW: 300, label: 'GK-300M', sub: '300 kW konteineris', baseNetEurMonth: 2200 },
    { code: 'GK-500M', kW: 500, label: 'GK-500M', sub: '500 kW avarinė ir pramoninė katilinė', baseNetEurMonth: 3500 },
];

export interface RentalTerm {
    id: 'emergency' | 'monthly' | 'season';
    label: string;
    sub: string;
    months: number;
    monthsMin: number;
    monthsMax: number;
    discountPct: number;
}

export const BOILER_RENTAL_TERMS: RentalTerm[] = [
    { id: 'emergency', label: 'Skubi avarinė nuoma', sub: '7–14 d.', months: 0.5, monthsMin: 0.5, monthsMax: 0.5, discountPct: 0 },
    { id: 'monthly', label: 'Mėnesinė nuoma', sub: '1–12 mėn.', months: 1, monthsMin: 1, monthsMax: 12, discountPct: 0 },
    { id: 'season', label: 'Viso šildymo sezono nuoma', sub: '4–7 mėn. su -25% nuolaida', months: 5, monthsMin: 4, monthsMax: 7, discountPct: 25 },
];

export interface RentalAddon {
    id: 'hoses' | 'delivery' | 'pellets';
    label: string;
    netEur: number;
}

export const BOILER_RENTAL_ADDONS: RentalAddon[] = [
    { id: 'hoses', label: 'Lanksčios izoliuotos šilumos trasos DN65/DN80 (2×15 m) – vienkartinis mokestis', netEur: 390 },
    { id: 'delivery', label: 'Atvežimas su fiskaru (manipuliatoriumi) ir pajungimas per 24 val. – vienkartinis mokestis', netEur: 650 },
    { id: 'pellets', label: 'Granulių tiekimas su kuro apskaita pagal faktinį MWh skaitiklį', netEur: 0 },
];

export interface RentalDealInput {
    powerCode: RentalPowerOption['code'];
    termId: RentalTerm['id'];
    /** W124-A1 (F3.2): pasirinkti mėnesiai tarpo ribose; be reikšmės – termino numatytoji. */
    months?: number;
    addons: { hoses?: boolean; delivery?: boolean; pellets?: boolean };
}

export interface RentalDeal {
    sku: string;
    powerCode: RentalPowerOption['code'];
    powerKw: number;
    powerLabel: string;
    termLabel: string;
    termSub: string;
    months: number;
    discountPct: number;
    addons: RentalAddon[];
    monthlyNetEur: number;
    addonsNetEur: number;
    totalNetEur: number;
    totalGrossEur: number;
    vatEur: number;
    title: string;
}

export function calculateBoilerRentalDeal(input: RentalDealInput): RentalDeal {
    const power = BOILER_RENTAL_POWER_OPTIONS.find((p) => p.code === input.powerCode) ?? BOILER_RENTAL_POWER_OPTIONS[2];
    const term = BOILER_RENTAL_TERMS.find((t) => t.id === input.termId) ?? BOILER_RENTAL_TERMS[1];
    const addons = BOILER_RENTAL_ADDONS.filter((a) => input.addons[a.id]);
    // W124-A1 (F3.2): mėnesiai apribojami termino rėžais (1–12 mėnesinei, 4–7 sezono).
    const months = term.monthsMin === term.monthsMax
        ? term.months
        : Math.min(term.monthsMax, Math.max(term.monthsMin, input.months ?? term.months));
    const monthly = Math.round(power.baseNetEurMonth * (1 - term.discountPct / 100));
    const addonsNet = addons.reduce((s, a) => s + a.netEur, 0);
    const totalNet = Math.round(monthly * months + addonsNet);
    const vat = Math.round(totalNet * 0.21);
    return {
        sku: `RENT-${power.code}-${term.id.toUpperCase()}`,
        powerCode: power.code,
        powerKw: power.kW,
        powerLabel: `${power.label} (${power.sub})`,
        termLabel: term.label,
        termSub: term.sub,
        months,
        discountPct: term.discountPct,
        addons,
        monthlyNetEur: monthly,
        addonsNetEur: addonsNet,
        totalNetEur: totalNet,
        totalGrossEur: totalNet + vat,
        vatEur: vat,
        title: `Mobilios katilinės ${power.label} nuoma, ${term.label.toLowerCase()}`,
    };
}

export function buildProformaRef(cartQty: number): string {
    const n = Math.floor(Date.now() / 1000) % 100000 + cartQty * 7;
    return `PRO-${new Date().getFullYear()}-${String(n).padStart(5, '0')}`;
}

export function buildDealRef(): string {
    const n = Math.floor(Date.now() / 1000) % 100000;
    return `GILE-DEAL-${new Date().getFullYear()}-${String(n).padStart(5, '0')}`;
}
