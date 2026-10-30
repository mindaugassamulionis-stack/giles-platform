// W22-D1 T3: šilumos poreikio orientacinė skaičiuoklė (/tools/silumos-skaiciuokle).
//
// Static, source-cited coefficient table — a band simplification of
// LT STR 2.01.02:2016 / LST EN 12831 specific heat-loss ranges by building
// era, multiplied by climate-zone design temperatures. The tool ALWAYS
// returns a band with the mandatory orientational disclaimer; it links only
// to in-shop categories and can prefill an RFQ. It never replaces a project.

export interface HeatCoefficientRow {
    id: string;
    labelLt: string;
    labelEn: string;
    /** Specific heat-loss band, W/m² of heated floor area (2.5 m ceilings). */
    wPerM2Low: number;
    wPerM2High: number;
    source: string;
}

export interface ClimateZone {
    id: string;
    labelLt: string;
    labelEn: string;
    multiplier: number;
    source: string;
}

// Band simplification: per-era W/m² ranges cited from LT STR 2.01.02:2016 /
// LST EN 12831 method overview publicly reproduced by SST/Statybos sekcija
// design guides. Orientational tool only — verifier: keep sources listed.
export const HEAT_COEFFICIENTS: HeatCoefficientRow[] = [
    {
        id: 'pre-1993',
        labelLt: 'Iki 1993 m. (sovietinis/ Senos statybos)',
        labelEn: 'Before 1993 (Soviet-era stock)',
        wPerM2Low: 100,
        wPerM2High: 130,
        source: 'LT STR 2.01.02:2016 / LST EN 12831 ribų supaprastinimas',
    },
    {
        id: '1993-2005',
        labelLt: '1993–2005 m.',
        labelEn: '1993–2005',
        wPerM2Low: 80,
        wPerM2High: 110,
        source: 'LT STR 2.01.02:2016 / LST EN 12831 ribų supaprastinimas',
    },
    {
        id: '2006-2015',
        labelLt: '2006–2015 m. (STR 2.01.01:2004 era)',
        labelEn: '2006–2015 (STR 2.01.01:2004 era)',
        wPerM2Low: 60,
        wPerM2High: 90,
        source: 'LT STR 2.01.02:2016 / LST EN 12831 ribų supaprastinimas',
    },
    {
        id: '2016-plus',
        labelLt: 'Nuo 2016 m. (A/A+ klasės tendencija)',
        labelEn: '2016+ (A/A+ class trend)',
        wPerM2Low: 40,
        wPerM2High: 70,
        source: 'LT STR 2.01.02:2016 / LST EN 12831 ribų supaprastinimas',
    },
];

// LT design outdoor temperatures run roughly −20…−27 °C from coastal zone 1
// to eastern zone 4; multiplier reflects the design-temperature ratio vs the
// band midpoint (cited per LST EN 12831 Annex LT zone table).
export const CLIMATE_ZONES: ClimateZone[] = [
    {
        id: 'zone-1',
        labelLt: 'I zona (pakrantė: Klaipėda, Kretinga)',
        labelEn: 'Zone 1 (coast: Klaipėda, Kretinga)',
        multiplier: 1.0,
        source: 'LST EN 12831 LT priedas — projektinės lauko temperatūros zonos',
    },
    {
        id: 'zone-2',
        labelLt: 'II zona (vidurio Lietuva: Kaunas, Šiauliai)',
        labelEn: 'Zone 2 (central LT: Kaunas, Šiauliai)',
        multiplier: 1.05,
        source: 'LST EN 12831 LT priedas — projektinės lauko temperatūros zonos',
    },
    {
        id: 'zone-3',
        labelLt: 'III zona (rytų Lietuva: Vilnius, Utena)',
        labelEn: 'Zone 3 (eastern LT: Vilnius, Utena)',
        multiplier: 1.1,
        source: 'LST EN 12831 LT priedas — projektinės lauko temperatūros zonos',
    },
    {
        id: 'zone-4',
        labelLt: 'IV zona (šiaurės rytų kraštas: Zarasai)',
        labelEn: 'Zone 4 (NE edge: Zarasai)',
        multiplier: 1.15,
        source: 'LST EN 12831 LT priedas — projektinės lauko temperatūros zonos',
    },
];

export const DISCALIMER_ORIENTATIONAL = {
    lt: 'Orientacinis įvertinimas pagal supaprastintą LT STR 2.01.02:2016 / LST EN 12831 ribų metodiką. Jis nepakeičia projekto ir nėra pirkimo pagrindimas — galutinį įrenginių parinkimą atlieka projektuotojas.',
    en: 'Indicative estimate using a simplified LT STR 2.01.02:2016 / LST EN 12831 band method. It does not replace a design and must not be the sole basis for purchasing — final equipment selection belongs to the designer.',
} as const;

export interface HeatLoadInput {
    areaM2: number;
    ceilingHeightM: number;
    era: string;
    zoneId: string;
}

export interface HeatLoadBand {
    kwLow: number;
    kwHigh: number;
    /** The coefficient row used — for the source-cited table on the page. */
    coefficient: HeatCoefficientRow;
    zone: ClimateZone;
    disclaimerLt: string;
}

const REFERENCE_HEIGHT_M = 2.5;

/**
 * kW band = (W/m² band) × area × (height / 2.5) × zone multiplier / 1000.
 * Invalid input → null (never invent numbers).
 */
export function calcHeatLoadBand(input: HeatLoadInput): HeatLoadBand | null {
    const { areaM2, ceilingHeightM, era, zoneId } = input;
    if (!Number.isFinite(areaM2) || areaM2 <= 0) return null;
    if (!Number.isFinite(ceilingHeightM) || ceilingHeightM <= 0) return null;

    const coefficient = HEAT_COEFFICIENTS.find((c) => c.id === era);
    const zone = CLIMATE_ZONES.find((z) => z.id === zoneId);
    if (!coefficient || !zone) return null;

    const scale = areaM2 * (ceilingHeightM / REFERENCE_HEIGHT_M) * zone.multiplier;
    return {
        kwLow: (coefficient.wPerM2Low * scale) / 1000,
        kwHigh: (coefficient.wPerM2High * scale) / 1000,
        coefficient,
        zone,
        disclaimerLt: DISCALIMER_ORIENTATIONAL.lt,
    };
}
