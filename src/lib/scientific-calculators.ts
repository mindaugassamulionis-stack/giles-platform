/**
 * W35-A1: 5-in-1 ŠVOK Engineering Calculators Engine
 * Scientifically grounded thermodynamic & hydronic equations according to:
 *  1. LST EN 12831 & STR 2.01.02:2016 (Pastato šilumos nuostoliai, katilo ir boilerio parinkimas)
 *  2. LST EN 12828 (Plėtimosi indo tūrio V_n ir pradinio slėgio P_0 skaičiavimas pagal Boyle–Mariotte dėsnį)
 *  3. Hidraulinė K_v / Δp ir darbinio greičio v ≤ 0,75 m/s lygtis (Balansinio vožtuvo ir DN parinkimas)
 *  4. LST EN 1264 (Grindinio šildymo vamzdžio ilgio, kontūrų skaičiaus, rotametro l/min ir kolektoriaus parinkimas)
 *  5. Radiatorių mazgų ir termostatikos komplektavimo skaičiavimas (ΔT = 15 K, AFC / Kv vožtuvai, H-blokai, Eurokonusai)
 */

export type CalculatorToolId = 'boiler' | 'vessel' | 'valve' | 'manifold' | 'radiator';

export function formatInstrumentalAgentName(name: string): string {
    const trimmed = (name || 'Vytautas').trim();
    if (/as$/i.test(trimmed)) return trimmed.replace(/as$/i, 'u');
    if (/is$/i.test(trimmed)) return trimmed.replace(/is$/i, 'iu');
    if (/us$/i.test(trimmed)) return trimmed.replace(/us$/i, 'umi');
    if (/ė$/i.test(trimmed)) return trimmed.replace(/ė$/i, 'e');
    return trimmed;
}

export interface ScientificCalculatorTab {
    id: CalculatorToolId;
    stepNum: string;
    shortTitleLt: string;
    titleLt: string;
    standardBadge: string;
    summaryLt: string;
    catalogCategoryHint: string;
}

export const SCIENTIFIC_CALCULATOR_TABS: ScientificCalculatorTab[] = [
    {
        id: 'boiler',
        stepNum: '01',
        shortTitleLt: 'Katilas ir boileris',
        titleLt: 'Katilo ir boilerio parinkimas pagal būsto plotą',
        standardBadge: 'Šilumos galia (kW) ir tūris (l)',
        summaryLt: 'Pasirinkite namo plotą, apšiltinimo klasę ir žmonių skaičių – vizualiai matysite reikiamą katilo galią (kW) ir boilerio talpą.',
        catalogCategoryHint: 'Katilai ir vandens šildytuvai',
    },
    {
        id: 'vessel',
        stepNum: '02',
        shortTitleLt: 'Plėtimosi indas',
        titleLt: 'Plėtimosi indo tūrio ir slėgio parinkimas',
        standardBadge: 'Indo tūris (l) ir slėgis (bar)',
        summaryLt: 'Vizualiai parinkite tinkamą IMI Pneumatex Statico plėtimosi indą ir oro pagalvės slėgį pagal pastato aukštį.',
        catalogCategoryHint: 'Plėtimosi indai ir slėgio palaikymas',
    },
    {
        id: 'valve',
        stepNum: '03',
        shortTitleLt: 'Vamzdynas ir vožtuvai',
        titleLt: 'Vamzdyno skersmens (DN) ir balansinio vožtuvo parinkimas',
        standardBadge: 'Skersmuo DN15–DN50 ir Kvs',
        summaryLt: 'Sužinokite tinkamą vamzdžio ir IMI TA STAD balansinio vožtuvo skersmenį, kad vanduo tekėtų tyliai be triukšmo.',
        catalogCategoryHint: 'Balansiniai ir reguliavimo vožtuvai',
    },
    {
        id: 'manifold',
        stepNum: '04',
        shortTitleLt: 'Grindų kolektorius',
        titleLt: 'Grindinio šildymo kolektoriaus ir kontūrų parinkimas',
        standardBadge: '2–12 kontūrų ir pavaros',
        summaryLt: 'Vizualiai matykite, kiek kontūrų (2–12), kiek metrų vamzdžio ir kokio IMI Heimeier kolektoriaus reikia jūsų grindims.',
        catalogCategoryHint: 'Grindinis šildymas ir kolektoriai',
    },
    {
        id: 'radiator',
        stepNum: '05',
        shortTitleLt: 'Radiatoriaus mazgas',
        titleLt: 'Radiatorių pajungimo mazgų ir termostatikos komplektavimas',
        standardBadge: 'Apatinis VK 50 mm ir šoninis',
        summaryLt: 'Pasirinkite radiatorių skaičių ir pajungimo būdą – gausite pilną termostatinių galvučių, vožtuvų ir jungčių sąrašą.',
        catalogCategoryHint: 'Termostatinės galvutės ir vožtuvai',
    },
];

function round1(n: number): number {
    return Math.round(n * 10) / 10;
}

function round2(n: number): number {
    return Math.round(n * 100) / 100;
}

// ============================================================================
// 1. BOILER & BUILDING HEAT LOSS (LST EN 12831 / STR 2.01.02:2016)
// ============================================================================

export type EnergyClassId = 'A++' | 'A+' | 'A' | 'B' | 'C' | 'D_E';
export type LtClimateZoneId = 'pajuris' | 'vidurio' | 'rytu';
export type VentilationTypeId = 'rekuperacija_85' | 'rekuperacija_70' | 'naturali';
export type DhwModeId = 'boileris' | 'momentinis' | 'be_kv';

export const ENERGY_CLASS_SPECS: Record<EnergyClassId, { labelLt: string; qWm2At40K: number; descriptionLt: string }> = {
    'A++': {
        labelLt: 'A++ klasė (po 2021 m., pasyvus / NZEB)',
        qWm2At40K: 22,
        descriptionLt: 'Aukščiausia sandarumo klasė (n₅₀ ≤ 0,6 h⁻¹), trigubo stiklo paketai, ~22 W/m² prie ΔT=40 K.',
    },
    'A+': {
        labelLt: 'A+ klasė (2018–2021 m. statyba)',
        qWm2At40K: 28,
        descriptionLt: 'Šiuolaikinė šiltinta statyba su rekuperacija, ~28 W/m² prie ΔT=40 K.',
    },
    A: {
        labelLt: 'A klasė (2016–2018 m. statyba)',
        qWm2At40K: 36,
        descriptionLt: 'Gera atitvarų šiluminė varža, ~36 W/m² prie ΔT=40 K.',
    },
    B: {
        labelLt: 'B klasė (2006–2016 m. arba renovuotas)',
        qWm2At40K: 50,
        descriptionLt: 'Vidutiniškai apšiltintas namas arba kokybiškai renovuotas pastatas, ~50 W/m².',
    },
    C: {
        labelLt: 'C klasė (1993–2005 m. dalinai šiltintas)',
        qWm2At40K: 70,
        descriptionLt: 'Senesnės statybos pastatas su baziniu apšiltinimu, ~70 W/m².',
    },
    D_E: {
        labelLt: 'D / E / F klasė (iki 1993 m., nerenovuotas)',
        qWm2At40K: 100,
        descriptionLt: 'Neapšiltintos sienos, dideli šilumos nuostoliai per atitvaras, ~100 W/m².',
    },
};

export const LT_CLIMATE_ZONES: Record<LtClimateZoneId, { labelLt: string; outdoorTempC: number; citiesLt: string }> = {
    pajuris: {
        labelLt: 'I zona · Pajūris (T_e = −19 °C)',
        outdoorTempC: -19,
        citiesLt: 'Klaipėda, Palanga, Neringa, Kretinga, Šilutė',
    },
    vidurio: {
        labelLt: 'II zona · Vidurio Lietuva (T_e = −21 °C)',
        outdoorTempC: -21,
        citiesLt: 'Kaunas, Šiauliai, Panevėžys, Alytus, Marijampolė',
    },
    rytu: {
        labelLt: 'III zona · Rytų Lietuva (T_e = −23 °C)',
        outdoorTempC: -23,
        citiesLt: 'Vilnius, Utena, Ignalina, Švenčionys, Druskininkai',
    },
};

export const VENTILATION_SPECS: Record<VentilationTypeId, { labelLt: string; factor: number; ventShare: number }> = {
    rekuperacija_85: {
        labelLt: 'Rekuperacija (rotacinis / plokštelinis η ≥ 85 %)',
        factor: 0.82,
        ventShare: 0.16,
    },
    rekuperacija_70: {
        labelLt: 'Rekuperacija (standartinis η ≈ 70 %)',
        factor: 0.90,
        ventShare: 0.22,
    },
    naturali: {
        labelLt: 'Natūrali trauka / mikroventiliacija (be rekuperacijos)',
        factor: 1.08,
        ventShare: 0.32,
    },
};

export interface BoilerCalcInput {
    areaM2: number;
    energyClass: EnergyClassId;
    climateZone: LtClimateZoneId;
    indoorTempC: number;
    ceilingHeightM: number;
    ventilationType: VentilationTypeId;
    occupants: number;
    dhwMode: DhwModeId;
}

export interface BoilerCalcOutput {
    deltaT: number;
    outdoorDesignTempC: number;
    specificLossWm2: number;
    transmissionLossKw: number;
    ventilationLossKw: number;
    designHeatLossKw: number;
    dhwPowerReserveKw: number;
    recommendedBoilerKw: number;
    recommendedCylinderLiters: number;
    annualEnergyMwh: number;
    formulaCitation: string;
    substitutedFormula: string;
}

const STANDARD_CYLINDER_VOLUMES = [80, 100, 120, 150, 200, 300];

export function calculateBoilerAndHeatLoss(input: BoilerCalcInput): BoilerCalcOutput {
    const area = Math.min(Math.max(Number(input.areaM2) || 140, 20), 1000);
    const indoor = Math.min(Math.max(Number(input.indoorTempC) || 21, 18), 24);
    const height = Math.min(Math.max(Number(input.ceilingHeightM) || 2.7, 2.4), 4.5);
    const occupants = Math.min(Math.max(Math.round(Number(input.occupants) || 4), 1), 10);

    const energySpec = ENERGY_CLASS_SPECS[input.energyClass] ?? ENERGY_CLASS_SPECS['A+'];
    const zoneSpec = LT_CLIMATE_ZONES[input.climateZone] ?? LT_CLIMATE_ZONES.vidurio;
    const ventSpec = VENTILATION_SPECS[input.ventilationType] ?? VENTILATION_SPECS.rekuperacija_85;

    const deltaT = indoor - zoneSpec.outdoorTempC; // e.g., 21 - (-21) = 42 K
    const heightFactor = height / 2.7;
    const effectiveWm2 = energySpec.qWm2At40K * (deltaT / 40) * heightFactor * ventSpec.factor;

    const rawHeatLossKw = (area * effectiveWm2) / 1000;
    const designHeatLossKw = round2(rawHeatLossKw);
    const ventilationLossKw = round2(designHeatLossKw * ventSpec.ventShare);
    const transmissionLossKw = round2(designHeatLossKw - ventilationLossKw);

    let dhwPowerReserveKw = 0;
    let recommendedBoilerKw = 0;
    let recommendedCylinderLiters = 0;

    if (input.dhwMode === 'boileris') {
        dhwPowerReserveKw = round2(occupants * 0.35);
        const rawWithSafety = designHeatLossKw * 1.15 + dhwPowerReserveKw;
        recommendedBoilerKw = Math.ceil(rawWithSafety * 2) / 2;
        const neededLiters = occupants * 50;
        recommendedCylinderLiters =
            STANDARD_CYLINDER_VOLUMES.find((v) => v >= neededLiters) ??
            STANDARD_CYLINDER_VOLUMES[STANDARD_CYLINDER_VOLUMES.length - 1];
    } else if (input.dhwMode === 'momentinis') {
        const rawHeatingBoiler = Math.ceil(designHeatLossKw * 1.15 * 2) / 2;
        recommendedBoilerKw = Math.max(24, rawHeatingBoiler);
        dhwPowerReserveKw = round2(Math.max(0, 24 - designHeatLossKw * 1.15));
        recommendedCylinderLiters = 0;
    } else {
        dhwPowerReserveKw = 0;
        recommendedBoilerKw = Math.ceil(designHeatLossKw * 1.15 * 2) / 2;
        recommendedCylinderLiters = 0;
    }

    const annualEnergyMwh = round2((designHeatLossKw * 2150) / 1000);

    const formulaCitation =
        'Φ_HL = Φ_T + Φ_V = A · q_STR · ((T_i − T_e)/40) · f_h · f_vėd (LST EN 12831 / STR 2.01.02:2016)';
    const substitutedFormula =
        `Φ_HL = ${area} m² × ${energySpec.qWm2At40K} W/m² × (${deltaT} K / 40 K) × ${(heightFactor).toFixed(2)} × ${ventSpec.factor.toFixed(2)} = ${designHeatLossKw.toFixed(2)} kW → Q_katilo = ${recommendedBoilerKw.toFixed(1)} kW`;

    return {
        deltaT,
        outdoorDesignTempC: zoneSpec.outdoorTempC,
        specificLossWm2: round1(effectiveWm2),
        transmissionLossKw,
        ventilationLossKw,
        designHeatLossKw,
        dhwPowerReserveKw,
        recommendedBoilerKw,
        recommendedCylinderLiters,
        annualEnergyMwh,
        formulaCitation,
        substitutedFormula,
    };
}

// ============================================================================
// 2. EXPANSION VESSEL & P_0 PRECHARGE (LST EN 12828)
// ============================================================================

export type EmitterTypeId = 'underfloor' | 'panel_radiators' | 'cast_iron_buffer';
export type MaxFlowTempC = '45' | '60' | '70' | '80' | '90';
export type GlycolPercent = 0 | 20 | 30 | 40;
export type SafetyValveBar = 3.0 | 4.0 | 6.0;

export const EMITTER_WATER_CONTENT: Record<EmitterTypeId, { labelLt: string; litersPerKw: number }> = {
    underfloor: {
        labelLt: 'Grindinis šildymas (PE-Xa / PE-RT vamzdynas)',
        litersPerKw: 13.5,
    },
    panel_radiators: {
        labelLt: 'Plieniniai plokštiniai radiatoriai (22 / 33 tipas)',
        litersPerKw: 10.5,
    },
    cast_iron_buffer: {
        labelLt: 'Ketaus radiatoriai arba sistema su akumuliacine talpa',
        litersPerKw: 18.0,
    },
};

export const WATER_EXPANSION_COEFFS: Record<MaxFlowTempC, number> = {
    '45': 0.0102,
    '60': 0.0171,
    '70': 0.0228,
    '80': 0.0290,
    '90': 0.0359,
};

export const GLYCOL_MULTIPLIERS: Record<GlycolPercent, number> = {
    0: 1.0,
    20: 1.15,
    30: 1.22,
    40: 1.30,
};

const STANDARD_STATICO_LITERS = [8, 12, 18, 25, 35, 50, 80, 100, 140, 200, 300];

export interface ExpansionVesselInput {
    systemPowerKw: number;
    emitterType: EmitterTypeId;
    customWaterVolumeL?: number;
    maxFlowTempC: MaxFlowTempC;
    glycolPercent: GlycolPercent;
    staticHeightM: number;
    safetyValveBar: SafetyValveBar;
}

export interface ExpansionVesselOutput {
    systemVolumeL: number;
    expansionCoeff: number;
    expansionVolumeL: number;
    waterReserveL: number;
    prechargeBar: number;
    maxWorkingBar: number;
    minVesselVolumeL: number;
    standardVesselLiters: number;
    formulaCitation: string;
    substitutedFormula: string;
}

export function calculateExpansionVessel(input: ExpansionVesselInput): ExpansionVesselOutput {
    const powerKw = Math.min(Math.max(Number(input.systemPowerKw) || 18, 5), 500);
    const emitter = EMITTER_WATER_CONTENT[input.emitterType] ?? EMITTER_WATER_CONTENT.underfloor;
    const customVol = Number(input.customWaterVolumeL) || 0;
    const systemVolumeL = round1(customVol > 0 ? customVol : powerKw * emitter.litersPerKw);

    const baseE = WATER_EXPANSION_COEFFS[input.maxFlowTempC] ?? WATER_EXPANSION_COEFFS['60'];
    const glycolMult = GLYCOL_MULTIPLIERS[input.glycolPercent] ?? 1.0;
    const expansionCoeff = Number((baseE * glycolMult).toFixed(4));

    const expansionVolumeL = round2(systemVolumeL * expansionCoeff);
    const waterReserveL = round2(Math.max(0.005 * systemVolumeL, 3.0));

    const staticHeightM = Math.min(Math.max(Number(input.staticHeightM) || 7, 2), 30);
    const safetyValveBar = input.safetyValveBar || 3.0;

    const prechargeBar = round2(Math.max(1.0, staticHeightM / 10 + 0.2));
    const maxWorkingBar = round2(Math.max(prechargeBar + 0.5, safetyValveBar - 0.5));

    const pressureFactor = (maxWorkingBar + 1) / (maxWorkingBar - prechargeBar);
    const minVesselVolumeL = round2((expansionVolumeL + waterReserveL) * pressureFactor);

    const standardVesselLiters =
        STANDARD_STATICO_LITERS.find((v) => v >= minVesselVolumeL) ??
        STANDARD_STATICO_LITERS[STANDARD_STATICO_LITERS.length - 1];

    const formulaCitation =
        'V_n = (V_e + V_v) · (P_e + 1) / (P_e − P_0), kur P_0 = H_stat/10 + 0,2 bar (LST EN 12828)';
    const substitutedFormula =
        `V_n = (${expansionVolumeL.toFixed(2)} l + ${waterReserveL.toFixed(2)} l) × (${maxWorkingBar.toFixed(1)} + 1) / (${maxWorkingBar.toFixed(1)} − ${prechargeBar.toFixed(1)}) = ${minVesselVolumeL.toFixed(1)} l → Statico ${standardVesselLiters} l`;

    return {
        systemVolumeL,
        expansionCoeff,
        expansionVolumeL,
        waterReserveL,
        prechargeBar,
        maxWorkingBar,
        minVesselVolumeL,
        standardVesselLiters,
        formulaCitation,
        substitutedFormula,
    };
}

// ============================================================================
// 3. HYDRAULIC BALANCING VALVE Kv & DN SELECTION
// ============================================================================

export type NominalDn = 'DN15' | 'DN20' | 'DN25' | 'DN32' | 'DN40' | 'DN50';

const PIPE_DN_SPECS: Array<{ dn: NominalDn; internalDiaMm: number; threadLabel: string }> = [
    { dn: 'DN15', internalDiaMm: 16.0, threadLabel: 'G 1/2" (DN15)' },
    { dn: 'DN20', internalDiaMm: 21.6, threadLabel: 'G 3/4" (DN20)' },
    { dn: 'DN25', internalDiaMm: 27.2, threadLabel: 'G 1" (DN25)' },
    { dn: 'DN32', internalDiaMm: 35.9, threadLabel: 'G 1 1/4" (DN32)' },
    { dn: 'DN40', internalDiaMm: 41.8, threadLabel: 'G 1 1/2" (DN40)' },
    { dn: 'DN50', internalDiaMm: 53.0, threadLabel: 'G 2" (DN50)' },
];

export interface HydraulicValveInput {
    branchPowerKw: number;
    deltaTK: 5 | 10 | 15 | 20;
    targetDpKpa: number;
}

export interface HydraulicValveOutput {
    flowLh: number;
    flowLmin: number;
    requiredKv: number;
    recommendedDn: NominalDn;
    recommendedThreadLabel: string;
    waterVelocityMs: number;
    formulaCitation: string;
    substitutedFormula: string;
}

export function calculateHydraulicValve(input: HydraulicValveInput): HydraulicValveOutput {
    const powerKw = Math.min(Math.max(Number(input.branchPowerKw) || 12, 1), 250);
    const deltaT = [5, 10, 15, 20].includes(Number(input.deltaTK)) ? Number(input.deltaTK) : 15;
    const dpKpa = Math.min(Math.max(Number(input.targetDpKpa) || 10, 3), 30);

    // ṁ [l/h] = (Q [kW] * 860) / ΔT [K]
    const rawFlowLh = (powerKw * 860) / deltaT;
    const flowLh = round1(rawFlowLh);
    const flowLmin = round2(rawFlowLh / 60);

    // Kv = Q [m³/h] / sqrt(Δp [bar]), where Δp [bar] = dpKpa / 100
    const flowM3h = rawFlowLh / 1000;
    const dpBar = dpKpa / 100;
    const requiredKv = round2(flowM3h / Math.sqrt(dpBar));

    // Volumetric flow in m³/s
    const flowM3s = flowM3h / 3600;

    let chosen = PIPE_DN_SPECS[PIPE_DN_SPECS.length - 1];
    let velocityMs = 0;

    for (const spec of PIPE_DN_SPECS) {
        const dMeters = spec.internalDiaMm / 1000;
        const areaM2 = (Math.PI * dMeters * dMeters) / 4;
        const v = flowM3s / areaM2;
        if (v <= 0.75) {
            chosen = spec;
            velocityMs = v;
            break;
        }
    }

    if (velocityMs === 0) {
        const dMeters = chosen.internalDiaMm / 1000;
        const areaM2 = (Math.PI * dMeters * dMeters) / 4;
        velocityMs = flowM3s / areaM2;
    }

    const waterVelocityMs = round2(velocityMs);
    const formulaCitation =
        'ṁ = (Q · 860) / ΔT [l/h]; K_v = Q_m3h / √(Δp_bar); v = 4·Q / (π·d²) ≤ 0,75 m/s';
    const substitutedFormula =
        `ṁ = (${powerKw} kW × 860) / ${deltaT} K = ${flowLh} l/h; K_v = ${(flowM3h).toFixed(2)} / √${dpBar.toFixed(2)} = ${requiredKv.toFixed(2)} m³/h → ${chosen.dn} (v = ${waterVelocityMs} m/s)`;

    return {
        flowLh,
        flowLmin,
        requiredKv,
        recommendedDn: chosen.dn,
        recommendedThreadLabel: chosen.threadLabel,
        waterVelocityMs,
        formulaCitation,
        substitutedFormula,
    };
}

// ============================================================================
// 4. UNDERFLOOR HEATING MANIFOLD & LOOPS (LST EN 1264)
// ============================================================================

export type PipeSpacingCm = 10 | 15 | 20;

const PIPE_METERS_PER_M2: Record<PipeSpacingCm, number> = {
    10: 10.0,
    15: 6.7,
    20: 5.0,
};

export interface UnderfloorManifoldInput {
    floorAreaM2: number;
    pipeSpacingCm: PipeSpacingCm;
    specificLoadWm2: number;
    maxLoopLengthM: number;
}

export interface UnderfloorManifoldOutput {
    totalPipeLengthM: number;
    rawLoops: number;
    recommendedLoops: number;
    manifoldsNeeded: number;
    totalThermalPowerKw: number;
    totalFlowLmin: number;
    flowPerLoopLmin: number;
    actuatorsCount: number;
    euroconusCount: number;
    formulaCitation: string;
    substitutedFormula: string;
}

export function calculateUnderfloorManifold(input: UnderfloorManifoldInput): UnderfloorManifoldOutput {
    const area = Math.min(Math.max(Number(input.floorAreaM2) || 85, 10), 300);
    const spacing: PipeSpacingCm = [10, 15, 20].includes(Number(input.pipeSpacingCm))
        ? (Number(input.pipeSpacingCm) as PipeSpacingCm)
        : 15;
    const loadWm2 = Math.min(Math.max(Number(input.specificLoadWm2) || 50, 35), 85);
    const maxLoop = Math.min(Math.max(Number(input.maxLoopLengthM) || 80, 60), 100);

    const metersPerM2 = PIPE_METERS_PER_M2[spacing];
    const totalPipeLengthM = Math.ceil(area * metersPerM2 * 1.07);

    const rawLoops = Math.max(2, Math.ceil(totalPipeLengthM / maxLoop));
    const manifoldsNeeded = Math.ceil(rawLoops / 12);
    const loopsPerManifold = manifoldsNeeded === 1
        ? Math.min(Math.max(rawLoops, 2), 12)
        : Math.min(Math.max(Math.ceil(rawLoops / manifoldsNeeded), 2), 12);

    const totalThermalPowerKw = round2((area * loadWm2) / 1000);
    // ΔT = 5 K for underfloor heating according to EN 1264
    const totalFlowLh = (totalThermalPowerKw * 860) / 5;
    const totalFlowLmin = round2(totalFlowLh / 60);
    const flowPerLoopLmin = round2(totalFlowLmin / rawLoops);

    const actuatorsCount = rawLoops;
    const euroconusCount = rawLoops * 2;

    const formulaCitation =
        'L_vamzdžio = A · (100/s) · 1,07; N_kontūrų = ⌈L / L_max⌉; q_kontūro = (Q · 860) / (5 K · 60 · N) [l/min] (LST EN 1264)';
    const substitutedFormula =
        `L = ${area} m² × ${metersPerM2} m/m² × 1,07 = ${totalPipeLengthM} m → ${rawLoops} kontūr. (po ${flowPerLoopLmin.toFixed(2)} l/min ant rotametro)`;

    return {
        totalPipeLengthM,
        rawLoops,
        recommendedLoops: loopsPerManifold,
        manifoldsNeeded,
        totalThermalPowerKw,
        totalFlowLmin,
        flowPerLoopLmin,
        actuatorsCount,
        euroconusCount,
        formulaCitation,
        substitutedFormula,
    };
}

// ============================================================================
// 5. RADIATOR NODE & THERMOSTATIC KIT WIZARD
// ============================================================================

export type RadiatorConnectionType = 'bottom_vk_50mm' | 'side_dn15_angle' | 'side_dn15_straight';
export type RadiatorControlType = 'afc_dynamic' | 'standard_kv';
export type RadiatorHeadType = 'liquid_click_or_m30' | 'electronic_smart';

export interface RadiatorNodeInput {
    radiatorCount: number;
    connectionType: RadiatorConnectionType;
    controlType: RadiatorControlType;
    headType: RadiatorHeadType;
}

export interface RadiatorNodeOutput {
    headsCount: number;
    valvesCount: number;
    hBlocksCount: number;
    returnDetentorsCount: number;
    euroconusCount: number;
    designFlowPerRadiatorLh: number;
    totalSystemFlowLh: number;
    recommendedSeriesLabel: string;
    searchKeywords: string[];
    formulaCitation: string;
    substitutedFormula: string;
}

export function calculateRadiatorNode(input: RadiatorNodeInput): RadiatorNodeOutput {
    const count = Math.min(Math.max(Math.round(Number(input.radiatorCount) || 6), 1), 30);
    const isBottomVk = input.connectionType === 'bottom_vk_50mm';
    const isAfc = input.controlType === 'afc_dynamic';

    const headsCount = count;
    const valvesCount = count;
    const hBlocksCount = isBottomVk ? count : 0;
    const returnDetentorsCount = isBottomVk ? 0 : count;
    const euroconusCount = count * 2;

    // Standard 1.2 kW room radiator at ΔT = 15 K (70/55/20 °C or 55/40/20 °C) -> 68.8 l/h
    const designFlowPerRadiatorLh = 68.8;
    const totalSystemFlowLh = round1(count * designFlowPerRadiatorLh);

    let recommendedSeriesLabel = '';
    if (isAfc && isBottomVk) {
        recommendedSeriesLabel = 'IMI Heimeier Eclipse AFC / Multilux 50 mm + K-galvutė (M30×1,5) arba Danfoss RA-DV + RLV-K';
    } else if (isAfc) {
        recommendedSeriesLabel = 'IMI Heimeier Eclipse AFC DN15 + K-galvutė + Regulux atbulinis vožtuvas';
    } else if (isBottomVk) {
        recommendedSeriesLabel = 'Danfoss RLV-K 50 mm H-blokas + Redia RA Click galvutė + Eurokonusai G3/4';
    } else {
        recommendedSeriesLabel = 'Danfoss RA-N DN15 + Redia RA Click galvutė + RLV-S atbulinis vožtuvas';
    }

    const searchKeywords = isAfc
        ? ['Eclipse', 'K-galvutė', isBottomVk ? 'Multilux' : 'Regulux', 'Eurokonusas']
        : ['RA-N', 'Redia', isBottomVk ? 'RLV-K' : 'RLV-S', 'Eurokonusas'];

    const formulaCitation =
        'ṁ_rad = (Q_rad · 860) / ΔT_15K ≈ 68,8 l/h (1,2 kW radiatoriui); N_mazgų = N_rad × (1 galvutė + 1 vožtuvas + 2 Eurokonusai)';
    const substitutedFormula =
        `${count} rad. × 68,8 l/h = ${totalSystemFlowLh.toFixed(1)} l/h → ${headsCount} galv. + ${valvesCount} vošt. + ${isBottomVk ? `${hBlocksCount} H-blok.` : `${returnDetentorsCount} detent.`} + ${euroconusCount} Eurokon.`;

    return {
        headsCount,
        valvesCount,
        hBlocksCount,
        returnDetentorsCount,
        euroconusCount,
        designFlowPerRadiatorLh,
        totalSystemFlowLh,
        recommendedSeriesLabel,
        searchKeywords,
        formulaCitation,
        substitutedFormula,
    };
}
