import type { AppLocale } from '../i18n/routing';

export * from './heat-load';
export * from './scientific-calculators';

export type HydronicHeatSourceId =
    | 'megatherm_pellet'
    | 'giles_boiler'
    | 'haier_r290'
    | 'haier_electric';

export type HydronicEnergyClass = 'A++' | 'A+' | 'B' | 'C' | 'D';

export type HydronicPipeDn = 'DN15' | 'DN20' | 'DN25' | 'DN32' | 'DN40' | 'DN50';

export const STATICO_VESSEL_SIZES_L = [8, 12, 18, 25, 35, 50, 80, 100, 140, 200, 300] as const;

export const BUFFER_TANK_SIZES_L = [
    100, 150, 200, 300, 400, 500, 750, 800, 1000, 1500, 2000, 3000,
] as const;

export const STANDARD_KVS_VALUES = [
    0.25, 0.4, 0.63, 1.0, 1.6, 2.5, 4.0, 6.3, 10.0, 16.0, 25.0, 40.0,
] as const;

export const HYDRONIC_PIPE_SPECS: ReadonlyArray<{
    dn: HydronicPipeDn;
    internalDiameterMm: number;
    threadLabel: string;
}> = [
    { dn: 'DN15', internalDiameterMm: 16.0, threadLabel: 'G 1/2" (DN15)' },
    { dn: 'DN20', internalDiameterMm: 21.6, threadLabel: 'G 3/4" (DN20)' },
    { dn: 'DN25', internalDiameterMm: 27.2, threadLabel: 'G 1" (DN25)' },
    { dn: 'DN32', internalDiameterMm: 35.9, threadLabel: 'G 1 1/4" (DN32)' },
    { dn: 'DN40', internalDiameterMm: 41.8, threadLabel: 'G 1 1/2" (DN40)' },
    { dn: 'DN50', internalDiameterMm: 53.0, threadLabel: 'G 2" (DN50)' },
];

export interface PumpCurveSpec {
    shortCode: '25/4' | '25/6' | '25/8' | '32/10';
    model: string;
    hMaxM: number;
    qMaxM3h: number;
    sku: string;
    unitGrossEur: number;
}

export const PUMP_CURVE_MODELS: ReadonlyArray<PumpCurveSpec> = [
    {
        shortCode: '25/4',
        model: 'Wilo Para 25/4',
        hMaxM: 4.0,
        qMaxM3h: 3.0,
        sku: '2217972',
        unitGrossEur: 228.69,
    },
    {
        shortCode: '25/6',
        model: 'Wilo Para 25/6',
        hMaxM: 6.0,
        qMaxM3h: 3.5,
        sku: '2217972',
        unitGrossEur: 260.0,
    },
    {
        shortCode: '25/8',
        model: 'Wilo Para 25/8',
        hMaxM: 8.0,
        qMaxM3h: 4.0,
        sku: '2217972',
        unitGrossEur: 318.0,
    },
    {
        shortCode: '32/10',
        model: 'Wilo Para 32/10',
        hMaxM: 10.0,
        qMaxM3h: 6.0,
        sku: '2217972',
        unitGrossEur: 602.58,
    },
];

export interface HeatSourceEngineeringSpec {
    id: HydronicHeatSourceId;
    shortLabel: Record<AppLocale, string>;
    fullName: Record<AppLocale, string>;
    specNote: Record<AppLocale, string>;
    minKw: number;
    maxKw: number;
    defaultT1C: number;
    defaultDeltaTK: number;
    bufferLitersPerKw: number;
    internalPressureDropKpa: number;
    isSolidFuel: boolean;
    iconType: 'flame' | 'fan' | 'bolt';
    sku: string;
    stockQuantity: number;
    unitGrossEur: number;
}

export const HYDRONIC_HEAT_SOURCES: Record<HydronicHeatSourceId, HeatSourceEngineeringSpec> = {
    megatherm_pellet: {
        id: 'megatherm_pellet',
        shortLabel: {
            lt: 'MPB NANI 35',
            en: 'MPB NANI 35',
            pl: 'MPB NANI 35',
            ru: 'MPB NANI 35',
        },
        fullName: {
            lt: 'Megatherm granulių degiklis MPB NANI 8–35 kW + sraigtas',
            en: 'Megatherm MPB NANI 8–35 kW Pellet Burner + Auger',
            pl: 'Palnik pelletowy Megatherm MPB NANI 8–35 kW + podajnik',
            ru: 'Пеллетная горелка Megatherm MPB NANI 8–35 кВт + шнек',
        },
        specNote: {
            lt: 'Granulės · 8–35 kW',
            en: 'Pellets · 8–35 kW',
            pl: 'Pellet · 8–35 kW',
            ru: 'Пеллеты · 8–35 кВт',
        },
        minKw: 8,
        maxKw: 35,
        defaultT1C: 80,
        defaultDeltaTK: 15,
        bufferLitersPerKw: 50,
        internalPressureDropKpa: 2,
        isSolidFuel: true,
        iconType: 'flame',
        sku: 'MPB-NANI-35',
        stockQuantity: 6,
        unitGrossEur: 2350.0,
    },
    giles_boiler: {
        id: 'giles_boiler',
        shortLabel: {
            lt: 'KaTRI 25 kW',
            en: 'KaTRI 25 kW',
            pl: 'KaTRI 25 kW',
            ru: 'KaTRI 25 кВт',
        },
        fullName: {
            lt: 'Gilės katilas KaTRI 25 kW (6 mm P265GH) + HERZ Teplomix',
            en: 'Gilės KaTRI 25 kW Boiler (6 mm P265GH) + HERZ Teplomix',
            pl: 'Kocioł stalowy Gilės KaTRI 25 kW (6 mm P265GH) + HERZ Teplomix',
            ru: 'Стальной котел Gilės KaTRI 25 кВт (6 мм P265GH) + HERZ Teplomix',
        },
        specNote: {
            lt: '6 mm P265GH · 8–25 kW',
            en: '6 mm P265GH · 8–25 kW',
            pl: '6 mm P265GH · 8–25 kW',
            ru: '6 мм P265GH · 8–25 кВт',
        },
        minKw: 8,
        maxKw: 25,
        defaultT1C: 80,
        defaultDeltaTK: 15,
        bufferLitersPerKw: 50,
        internalPressureDropKpa: 3,
        isSolidFuel: true,
        iconType: 'flame',
        sku: 'KaTRI3850020',
        stockQuantity: 4,
        unitGrossEur: 1750.0,
    },
    haier_r290: {
        id: 'haier_r290',
        shortLabel: {
            lt: 'Haier R290',
            en: 'Haier R290',
            pl: 'Haier R290',
            ru: 'Haier R290',
        },
        fullName: {
            lt: 'Haier R290 šilumos siurblys Super Aqua Monoblock (+75 °C)',
            en: 'Haier R290 Super Aqua Monoblock Heat Pump (+75 °C)',
            pl: 'Pompa ciepła Haier R290 Super Aqua Monoblock (+75 °C)',
            ru: 'Тепловой насос Haier R290 Super Aqua Monoblock (+75 °C)',
        },
        specNote: {
            lt: 'Šilumos siurblys · 4–16 kW',
            en: 'Heat Pump · 4–16 kW',
            pl: 'Pompa ciepła · 4–16 kW',
            ru: 'Тепловой насос · 4–16 кВт',
        },
        minKw: 4,
        maxKw: 16,
        defaultT1C: 55,
        defaultDeltaTK: 8,
        bufferLitersPerKw: 20,
        internalPressureDropKpa: 25,
        isSolidFuel: false,
        iconType: 'fan',
        sku: 'AW082HUGHA',
        stockQuantity: 5,
        unitGrossEur: 3430.0,
    },
    haier_electric: {
        id: 'haier_electric',
        shortLabel: {
            lt: 'Haier ES',
            en: 'Haier ES',
            pl: 'Haier ES',
            ru: 'Haier ES',
        },
        fullName: {
            lt: 'Haier ES elektrinis katilas / boileris + IMI Pneumatex',
            en: 'Haier ES Electric Heating Unit + IMI Pneumatex',
            pl: 'Jednostka elektryczna Haier ES + IMI Pneumatex',
            ru: 'Электрический узел Haier ES + IMI Pneumatex',
        },
        specNote: {
            lt: 'Elektra · 3–24 kW',
            en: 'Electric · 3–24 kW',
            pl: 'Elektryczny · 3–24 kW',
            ru: 'Электрокотел · 3–24 кВт',
        },
        minKw: 3,
        maxKw: 24,
        defaultT1C: 70,
        defaultDeltaTK: 15,
        bufferLitersPerKw: 0,
        internalPressureDropKpa: 5,
        isSolidFuel: false,
        iconType: 'bolt',
        sku: 'ES50V-TF7(EU)',
        stockQuantity: 9,
        unitGrossEur: 308.0,
    },
};

export const ENERGY_CLASS_WM2: Record<HydronicEnergyClass, number> = {
    'A++': 35,
    'A+': 42,
    B: 60,
    C: 75,
    D: 100,
};

export interface CalculatorBuildingPreset {
    id: string;
    title: Record<AppLocale, string>;
    subtitle: Record<AppLocale, string>;
    areaM2: number;
    energyClass: HydronicEnergyClass;
    heatSource: HydronicHeatSourceId;
    ufhSharePct: number;
    staticHeightM: number;
    systemVolumeL: number;
    supplyTempC: number;
    deltaTK: number;
    pipeSpacingCm: 10 | 15 | 20;
    leaderLengthM: number;
}

export const CALCULATOR_BUILDING_PRESETS: ReadonlyArray<CalculatorBuildingPreset> = [
    {
        id: 'new_app_140',
        title: {
            lt: 'Naujas A++ namas (140 m²)',
            en: 'New A++ House (140 m²)',
            pl: 'Nowy dom A++ (140 m²)',
            ru: 'Новый дом A++ (140 м²)',
        },
        subtitle: {
            lt: 'A++ · 140 m² · 100 % grindinis · ŠS R290',
            en: 'A++ · 140 m² · 100% UFH · R290 Heat Pump',
            pl: 'A++ · 140 m² · 100% podłogówka · PC R290',
            ru: 'A++ · 140 м² · 100% теплый пол · ТН R290',
        },
        areaM2: 140,
        energyClass: 'A++',
        heatSource: 'haier_r290',
        ufhSharePct: 100,
        staticHeightM: 6,
        systemVolumeL: 180,
        supplyTempC: 45,
        deltaTK: 8,
        pipeSpacingCm: 15,
        leaderLengthM: 6,
    },
    {
        id: 'renovated_180',
        title: {
            lt: 'Renovuotas namas (180 m²)',
            en: 'Renovated House (180 m²)',
            pl: 'Dom po termomodernizacji (180 m²)',
            ru: 'Реновированный дом (180 м²)',
        },
        subtitle: {
            lt: 'B klasė · 180 m² · 50 % grindinis · MPB NANI 35',
            en: 'Class B · 180 m² · 50% UFH · MPB NANI 35',
            pl: 'Klasa B · 180 m² · 50% podłogówka · MPB NANI 35',
            ru: 'Класс B · 180 м² · 50% теплый пол · MPB NANI 35',
        },
        areaM2: 180,
        energyClass: 'B',
        heatSource: 'megatherm_pellet',
        ufhSharePct: 50,
        staticHeightM: 8,
        systemVolumeL: 220,
        supplyTempC: 80,
        deltaTK: 15,
        pipeSpacingCm: 15,
        leaderLengthM: 6,
    },
    {
        id: 'old_conversion_220',
        title: {
            lt: 'Senas namas katilo perdarymui (220 m²)',
            en: 'Older House for Boiler Conversion (220 m²)',
            pl: 'Starszy dom do modernizacji kotła (220 m²)',
            ru: 'Старый дом для модернизации котла (220 м²)',
        },
        subtitle: {
            lt: 'D klasė · 220 m² · Radiatoriai · KaTRI 25 + Teplomix',
            en: 'Class D · 220 m² · Radiators · KaTRI 25 + Teplomix',
            pl: 'Klasa D · 220 m² · Grzejniki · KaTRI 25 + Teplomix',
            ru: 'Класс D · 220 м² · Радиаторы · KaTRI 25 + Teplomix',
        },
        areaM2: 220,
        energyClass: 'D',
        heatSource: 'giles_boiler',
        ufhSharePct: 0,
        staticHeightM: 8,
        systemVolumeL: 320,
        supplyTempC: 80,
        deltaTK: 15,
        pipeSpacingCm: 15,
        leaderLengthM: 6,
    },
    {
        id: 'industrial_workshop_450',
        title: {
            lt: 'Gamybinės dirbtuvės / angaras (450 m²)',
            en: 'Production Workshop / Hangar (450 m²)',
            pl: 'Warsztat produkcyjny / hala (450 m²)',
            ru: 'Производственный цех / ангар (450 м²)',
        },
        subtitle: {
            lt: 'C klasė · 450 m² · Pramoninis kontūras · H = 6 m',
            en: 'Class C · 450 m² · Industrial Loop · H = 6 m',
            pl: 'Klasa C · 450 m² · Obieg przemysłowy · H = 6 m',
            ru: 'Класс C · 450 м² · Промышленный контур · H = 6 м',
        },
        areaM2: 450,
        energyClass: 'C',
        heatSource: 'megatherm_pellet',
        ufhSharePct: 100,
        staticHeightM: 6,
        systemVolumeL: 520,
        supplyTempC: 70,
        deltaTK: 15,
        pipeSpacingCm: 20,
        leaderLengthM: 10,
    },
];

function stdUp<T extends number>(arr: ReadonlyArray<T>, value: number): T {
    for (let i = 0; i < arr.length; i++) {
        if (arr[i] >= value - 1e-9) return arr[i];
    }
    return arr[arr.length - 1];
}

function round1(n: number): number {
    return Math.round(n * 10) / 10;
}

function round2(n: number): number {
    return Math.round(n * 100) / 100;
}

/**
 * Kell's water density equation rho(T) in kg/m³ for T in °C.
 */
export function rho(T: number): number {
    return (
        1000 *
        (1 -
            ((T + 288.9414) / (508929.2 * (T + 68.12963))) *
                Math.pow(T - 3.9863, 2))
    );
}

/**
 * Water kinematic viscosity nu(T) in m²/s for T in °C.
 */
export function nu(T: number): number {
    return 1.78e-6 / (1 + 0.0337 * T + 0.000221 * T * T);
}

export interface En12828VesselCalcInput {
    systemVolumeL: number;
    bufferVolumeL: number;
    supplyTempC: number;
    isSolidFuel: boolean;
    staticHeightM: number;
    safetyValveBar: number;
}

export interface En12828VesselCalcResult {
    systemVolumeL: number;
    bufferVolumeL: number;
    totalSystemVolumeL: number;
    maxTempC: number;
    expansionCoeff: number;
    expansionVolumeL: number;
    waterReserveL: number;
    prechargeBar: number;
    maxWorkingBar: number;
    coldFillBar: number;
    pressureValid: boolean;
    nominalVolumeL: number;
    standardVesselL: number;
    naiveVolumeL: number;
}

/**
 * EN 12828 Expansion Vessel Calculation using Kell's water density formula,
 * automatic buffer volume addition (Vs = Vsys + Vb), 90 °C solid-fuel safety temperature,
 * and mandatory water reserve Vwr = max(0.005 * Vs, 3 L).
 */
export function calcEn12828ExpansionVessel(
    input: En12828VesselCalcInput,
): En12828VesselCalcResult {
    const Vsys = Math.max(20, Number(input.systemVolumeL) || 220);
    const Vb = Math.max(0, Number(input.bufferVolumeL) || 0);
    const Vs = Vsys + Vb;

    const T1 = Math.max(30, Number(input.supplyTempC) || 80);
    const Tmax = input.isSolidFuel ? Math.max(T1, 90) : T1;

    const e = rho(10) / rho(Tmax) - 1;
    const Ve = Vs * e;
    const Vwr = Math.max(0.005 * Vs, 3);

    const H = Math.min(Math.max(Number(input.staticHeightM) || 8, 2), 40);
    const Psv = Math.max(2.5, Number(input.safetyValveBar) || 3.0);

    const P0 = H / 10 + 0.2;
    const Pe = Psv <= 5 ? Psv - 0.5 : 0.9 * Psv;
    const Pf = P0 + 0.3;
    const okP = Pe - P0 > 0.1;

    const Vn = okP ? ((Ve + Vwr) * (Pe + 1)) / (Pe - P0) : (Ve + Vwr) * 4;
    const Vns = stdUp(STATICO_VESSEL_SIZES_L, Vn);
    const naive = Ve / Math.max(0.15, 1 - P0 / Psv);

    return {
        systemVolumeL: Math.round(Vsys),
        bufferVolumeL: Math.round(Vb),
        totalSystemVolumeL: Math.round(Vs),
        maxTempC: Tmax,
        expansionCoeff: Number(e.toFixed(4)),
        expansionVolumeL: round1(Ve),
        waterReserveL: round1(Vwr),
        prechargeBar: round2(P0),
        maxWorkingBar: round2(Pe),
        coldFillBar: round2(Pf),
        pressureValid: okP,
        nominalVolumeL: round1(Vn),
        standardVesselL: Vns,
        naiveVolumeL: round1(naive),
    };
}

export interface DarcyPipeResult {
    dn: HydronicPipeDn;
    internalDiameterMm: number;
    threadLabel: string;
    frictionPaPerM: number;
    velocityMs: number;
    Reynolds: number;
}

/**
 * Darcy-Weisbach friction loss R (Pa/m) and velocity v (m/s) for flow in l/h and internal diameter in mm.
 */
export function calcDarcyPipeFriction(
    flowLh: number,
    internalDiameterMm: number,
    meanWaterTempC: number,
): { frictionPaPerM: number; velocityMs: number; Reynolds: number } {
    const G = Math.max(1, Number(flowLh) || 100);
    const d = Math.max(8, Number(internalDiameterMm) || 16) / 1000;
    const T = Math.min(Math.max(Number(meanWaterTempC) || 70, 20), 95);

    const areaM2 = (Math.PI * d * d) / 4;
    const v = G / 3.6e6 / areaM2;
    const Re = (v * d) / nu(T);
    const lambda = Re < 2300 ? 64 / Math.max(Re, 1) : 0.316 / Math.pow(Re, 0.25);
    const R = ((lambda / d) * rho(T) * v * v) / 2;

    return {
        frictionPaPerM: round1(R),
        velocityMs: round2(v),
        Reynolds: Math.round(Re),
    };
}

/**
 * Selects the smallest DN (DN15..DN50) satisfying both R <= 150 Pa/m and v <= 0.8 m/s.
 */
export function pickDarcyPipeDn(flowLh: number, meanWaterTempC = 70): DarcyPipeResult {
    for (const spec of HYDRONIC_PIPE_SPECS) {
        const res = calcDarcyPipeFriction(flowLh, spec.internalDiameterMm, meanWaterTempC);
        if (res.frictionPaPerM <= 150 && res.velocityMs <= 0.8) {
            return {
                dn: spec.dn,
                internalDiameterMm: spec.internalDiameterMm,
                threadLabel: spec.threadLabel,
                ...res,
            };
        }
    }
    const largest = HYDRONIC_PIPE_SPECS[HYDRONIC_PIPE_SPECS.length - 1];
    const fallback = calcDarcyPipeFriction(flowLh, largest.internalDiameterMm, meanWaterTempC);
    return {
        dn: largest.dn,
        internalDiameterMm: largest.internalDiameterMm,
        threadLabel: largest.threadLabel,
        ...fallback,
    };
}

export interface UfhLoopsWithLeaderInput {
    heatedAreaM2: number;
    ufhSharePct: number;
    spacingCm: number;
    maxLoopLengthM?: number;
    leaderLengthM: number;
    ufhPowerKw: number;
    ufhSupplyTempC?: number;
}

export interface UfhLoopsWithLeaderResult {
    hasUfh: boolean;
    ufhAreaM2: number;
    floorPipeLengthM: number;
    effectiveLoopMaxM: number;
    rawLoops: number;
    nLoops: number;
    manifoldsCount: number;
    totalPipeLengthM: number;
    singleLoopLengthM: number;
    specificHeatFluxWm2: number;
    ufhFlowLh: number;
    loopFlowLh: number;
    loopPressureDropKpa: number;
    secondaryPumpHeadM: number;
    secondaryPump: PumpCurveSpec;
    ufhSupplyTempC: number;
    ufhReturnTempC: number;
}

export function calcPumpHeadAtFlow(pump: PumpCurveSpec, flowM3h: number): number {
    return pump.hMaxM * (1 - Math.pow(flowM3h / pump.qMaxM3h, 2));
}

export function selectPumpForOperatingPoint(flowM3h: number, headM: number): PumpCurveSpec {
    for (const pump of PUMP_CURVE_MODELS) {
        if (calcPumpHeadAtFlow(pump, flowM3h) >= headM) {
            return pump;
        }
    }
    return PUMP_CURVE_MODELS[PUMP_CURVE_MODELS.length - 1];
}

/**
 * Underfloor heating loop sizing accounting for supply + return leader length 2 * Ll
 * (effectiveLoopMax = Lmax - 2 * Ll).
 */
export function calcUfhLoopsWithLeader(
    input: UfhLoopsWithLeaderInput,
): UfhLoopsWithLeaderResult {
    const sh = Math.min(Math.max(Number(input.ufhSharePct) ?? 50, 0), 100) / 100;
    const Tu = Number(input.ufhSupplyTempC) || 40;
    const dTu = 7;
    const Tur = Tu - dTu;

    if (sh <= 0) {
        return {
            hasUfh: false,
            ufhAreaM2: 0,
            floorPipeLengthM: 0,
            effectiveLoopMaxM: 88,
            rawLoops: 0,
            nLoops: 0,
            manifoldsCount: 0,
            totalPipeLengthM: 0,
            singleLoopLengthM: 0,
            specificHeatFluxWm2: 0,
            ufhFlowLh: 0,
            loopFlowLh: 0,
            loopPressureDropKpa: 0,
            secondaryPumpHeadM: 0,
            secondaryPump: PUMP_CURVE_MODELS[0],
            ufhSupplyTempC: Tu,
            ufhReturnTempC: Tur,
        };
    }

    const A = Math.max(20, Number(input.heatedAreaM2) || 160);
    const Au = A * sh;
    const spacingM = Math.max(0.1, (Number(input.spacingCm) || 15) / 100);
    const Lmax = Math.max(60, Number(input.maxLoopLengthM) || 100);
    const Ll = Math.min(Math.max(Number(input.leaderLengthM) ?? 6, 0), 30);

    const Lf = Au / spacingM;
    const effectiveLoopMaxM = Math.max(10, Lmax - 2 * Ll);
    const rawLoops = Math.max(1, Math.ceil(Lf / effectiveLoopMaxM));
    const nLoops = Math.max(2, Math.min(12, rawLoops));
    const manifoldsCount = Math.max(1, Math.ceil(rawLoops / 12));

    const Lt = Lf + nLoops * 2 * Ll;
    const Ll1 = Lt / nLoops;
    const Pufh = Math.max(0.5, Number(input.ufhPowerKw) || (Au * 45) / 1000);
    const qu = (Pufh * 1000) / Au;
    const Gu = (Pufh * 860) / dTu;
    const Gl = Gu / nLoops;

    const loopDarcy = calcDarcyPipeFriction(Gl, 12, (Tu + Tur) / 2);
    const dpLoop = (loopDarcy.frictionPaPerM * Ll1 * 1.2) / 1000;
    const dpManifold = 3;
    const H2 = (dpLoop + dpManifold) / ((rho(Tu) * 9.81) / 1000);
    const pump2 = selectPumpForOperatingPoint(Gu / 1000, H2);

    return {
        hasUfh: true,
        ufhAreaM2: Math.round(Au),
        floorPipeLengthM: Math.round(Lf),
        effectiveLoopMaxM: Math.round(effectiveLoopMaxM),
        rawLoops,
        nLoops,
        manifoldsCount,
        totalPipeLengthM: Math.round(Lt),
        singleLoopLengthM: Math.round(Ll1),
        specificHeatFluxWm2: Math.round(qu),
        ufhFlowLh: Math.round(Gu),
        loopFlowLh: Math.round(Gl),
        loopPressureDropKpa: round1(dpLoop),
        secondaryPumpHeadM: round2(H2),
        secondaryPump: pump2,
        ufhSupplyTempC: Tu,
        ufhReturnTempC: Tur,
    };
}

export interface PumpOperatingPointInput {
    flowLh: number;
    pipeFrictionPaPerM: number;
    longestCircuitLengthM: number;
    sourcePressureDropKpa: number;
    balancingValveDpKpa: number;
    emitterDpKpa?: number;
    meanWaterTempC: number;
}

export interface PumpOperatingPointResult {
    flowLh: number;
    flowM3h: number;
    dpPipeKpa: number;
    dpSourceKpa: number;
    dpValveKpa: number;
    dpEmitterKpa: number;
    dpTotalKpa: number;
    headM: number;
    selectedPump: PumpCurveSpec;
}

export function calcPumpOperatingPoint(
    input: PumpOperatingPointInput,
): PumpOperatingPointResult {
    const flowLh = Math.max(50, Number(input.flowLh) || 500);
    const flowM3h = round2(flowLh / 1000);
    const Lc = Math.max(5, Number(input.longestCircuitLengthM) || 60);
    const dpPipe = (input.pipeFrictionPaPerM * Lc * 1.3) / 1000;
    const dpSrc = Math.max(1, Number(input.sourcePressureDropKpa) || 3);
    const dpValve = Math.max(2, Number(input.balancingValveDpKpa) || 10);
    const dpEm = Number(input.emitterDpKpa ?? 8);
    const dpTot = dpPipe + dpSrc + dpValve + dpEm;

    const Tm = Math.min(Math.max(Number(input.meanWaterTempC) || 70, 20), 95);
    const H1 = dpTot / ((rho(Tm) * 9.81) / 1000);
    const selectedPump = selectPumpForOperatingPoint(flowM3h, H1);

    return {
        flowLh: Math.round(flowLh),
        flowM3h,
        dpPipeKpa: round1(dpPipe),
        dpSourceKpa: round1(dpSrc),
        dpValveKpa: round1(dpValve),
        dpEmitterKpa: round1(dpEm),
        dpTotalKpa: round1(dpTot),
        headM: round2(H1),
        selectedPump,
    };
}

export interface HydronicNode6In1Input {
    areaM2: number;
    energyClass: HydronicEnergyClass;
    powerReservePct?: number;
    heatSource: HydronicHeatSourceId;
    supplyTempC?: number;
    deltaTK?: number;
    systemVolumeL: number;
    staticHeightM?: number;
    safetyValveBar: number;
    balancingDpKpa?: number;
    longestCircuitM?: number;
    ufhSharePct?: number;
    pipeSpacingCm: number;
    maxLoopLengthM?: number;
    leaderLengthM?: number;
    ufhSupplyTempC?: number;
}

export interface SourceComparisonRow {
    sourceId: HydronicHeatSourceId;
    spec: HeatSourceEngineeringSpec;
    loadRatio: number;
    loadPct: number;
    bufferVolumeL: number;
    status: 'ok' | 'undersized' | 'oversized';
}

export interface HydronicNode6In1Result {
    areaM2: number;
    energyClass: HydronicEnergyClass;
    specificLossWm2: number;
    powerReservePct: number;
    baseHeatLossKw: number;
    recommendedPowerKw: number;
    sourceSpec: HeatSourceEngineeringSpec;
    sourceLoadRatio: number;
    sourceLoadPct: number;
    supplyTempC: number;
    returnTempC: number;
    meanTempC: number;
    deltaTK: number;
    rawBufferVolumeL: number;
    bufferVolumeL: number;
    vessel: En12828VesselCalcResult;
    totalFlowLh: number;
    radiatorSharePct: number;
    ufhSharePct: number;
    hasRadiators: boolean;
    hasUfh: boolean;
    radiatorPowerKw: number;
    ufhPowerKw: number;
    radiatorFlowLh: number;
    ufhPrimaryFlowLh: number;
    mainPipe: DarcyPipeResult;
    radiatorPipe: DarcyPipeResult;
    ufhBranchPipe: DarcyPipeResult;
    balancingDpKpa: number;
    mainKv: number;
    mainKvs: number;
    actualDpAtKvsKpa: number;
    radiatorKv: number;
    radiatorKvs: number;
    ufhBranchKv: number;
    ufhBranchKvs: number;
    ufh: UfhLoopsWithLeaderResult;
    pump: PumpOperatingPointResult;
    sourceComparison: SourceComparisonRow[];
}

export function calcHydronicNode6In1(
    input: HydronicNode6In1Input,
): HydronicNode6In1Result {
    const areaM2 = Math.min(Math.max(Number(input.areaM2) || 160, 40), 600);
    const energyClass: HydronicEnergyClass = ENERGY_CLASS_WM2[input.energyClass]
        ? input.energyClass
        : 'A+';
    const qWm2 = ENERGY_CLASS_WM2[energyClass];
    const reservePct = Number(input.powerReservePct ?? 15);
    const reserveFrac = reservePct / 100;

    const sourceSpec =
        HYDRONIC_HEAT_SOURCES[input.heatSource] ?? HYDRONIC_HEAT_SOURCES.megatherm_pellet;

    const baseHeatLossKw = round2((areaM2 * qWm2) / 1000);
    const recommendedPowerKw = round1(baseHeatLossKw * (1 + reserveFrac));
    const sourceLoadRatio = recommendedPowerKw / sourceSpec.maxKw;
    const sourceLoadPct = Math.round(sourceLoadRatio * 100);

    const supplyTempC = Number(input.supplyTempC) || sourceSpec.defaultT1C;
    const deltaTK = Math.max(5, Number(input.deltaTK) || sourceSpec.defaultDeltaTK);
    const returnTempC = supplyTempC - deltaTK;
    const meanTempC = (supplyTempC + returnTempC) / 2;

    const rawBufferVolumeL = Math.round(recommendedPowerKw * sourceSpec.bufferLitersPerKw);
    const bufferVolumeL =
        sourceSpec.bufferLitersPerKw > 0
            ? stdUp(BUFFER_TANK_SIZES_L, rawBufferVolumeL)
            : 0;

    const vessel = calcEn12828ExpansionVessel({
        systemVolumeL: input.systemVolumeL,
        bufferVolumeL,
        supplyTempC,
        isSolidFuel: sourceSpec.isSolidFuel,
        staticHeightM: input.staticHeightM ?? 8,
        safetyValveBar: input.safetyValveBar,
    });

    const totalFlowLh = Math.round((recommendedPowerKw * 860) / deltaTK);
    const ufhSharePct = Math.min(Math.max(Number(input.ufhSharePct ?? 50), 0), 100);
    const radiatorSharePct = 100 - ufhSharePct;
    const sh = ufhSharePct / 100;
    const hasRadiators = sh < 1;
    const hasUfh = sh > 0;

    const radiatorPowerKw = round1(recommendedPowerKw * (1 - sh));
    const ufhPowerKw = round1(recommendedPowerKw * sh);
    const radiatorFlowLh = Math.round((radiatorPowerKw * 860) / deltaTK);
    const ufhPrimaryFlowLh = Math.round((ufhPowerKw * 860) / deltaTK);

    const mainPipe = pickDarcyPipeDn(totalFlowLh, meanTempC);
    const radiatorPipe = pickDarcyPipeDn(Math.max(100, radiatorFlowLh), meanTempC);
    const ufhBranchPipe = pickDarcyPipeDn(Math.max(100, ufhPrimaryFlowLh), meanTempC);

    const balancingDpKpa = Math.max(5, Number(input.balancingDpKpa) || 10);
    const calcKv = (flowLh: number) =>
        round2(flowLh / 1000 / Math.sqrt(balancingDpKpa / 100));

    const mainKv = calcKv(totalFlowLh);
    const mainKvs = stdUp(STANDARD_KVS_VALUES, mainKv);
    const actualDpAtKvsKpa = round1(Math.pow(totalFlowLh / 1000 / mainKvs, 2) * 100);

    const radiatorKv = hasRadiators ? calcKv(radiatorFlowLh) : 0;
    const radiatorKvs = hasRadiators ? stdUp(STANDARD_KVS_VALUES, radiatorKv) : 0;
    const ufhBranchKv = hasUfh ? calcKv(ufhPrimaryFlowLh) : 0;
    const ufhBranchKvs = hasUfh ? stdUp(STANDARD_KVS_VALUES, ufhBranchKv) : 0;

    const ufh = calcUfhLoopsWithLeader({
        heatedAreaM2: areaM2,
        ufhSharePct,
        spacingCm: input.pipeSpacingCm,
        maxLoopLengthM: input.maxLoopLengthM ?? 100,
        leaderLengthM: input.leaderLengthM ?? 6,
        ufhPowerKw,
        ufhSupplyTempC: input.ufhSupplyTempC ?? 40,
    });

    const pump = calcPumpOperatingPoint({
        flowLh: totalFlowLh,
        pipeFrictionPaPerM: mainPipe.frictionPaPerM,
        longestCircuitLengthM: input.longestCircuitM ?? 60,
        sourcePressureDropKpa: sourceSpec.internalPressureDropKpa,
        balancingValveDpKpa: balancingDpKpa,
        emitterDpKpa: 8,
        meanWaterTempC: meanTempC,
    });

    const sourceComparison: SourceComparisonRow[] = (
        Object.keys(HYDRONIC_HEAT_SOURCES) as HydronicHeatSourceId[]
    ).map((srcKey) => {
        const spec = HYDRONIC_HEAT_SOURCES[srcKey];
        const ratio = recommendedPowerKw / spec.maxKw;
        const bufL =
            spec.bufferLitersPerKw > 0
                ? stdUp(BUFFER_TANK_SIZES_L, recommendedPowerKw * spec.bufferLitersPerKw)
                : 0;
        const status: 'ok' | 'undersized' | 'oversized' =
            ratio > 1 ? 'undersized' : ratio < 0.3 ? 'oversized' : 'ok';
        return {
            sourceId: srcKey,
            spec,
            loadRatio: ratio,
            loadPct: Math.round(ratio * 100),
            bufferVolumeL: bufL,
            status,
        };
    });

    return {
        areaM2,
        energyClass,
        specificLossWm2: qWm2,
        powerReservePct: reservePct,
        baseHeatLossKw,
        recommendedPowerKw,
        sourceSpec,
        sourceLoadRatio,
        sourceLoadPct,
        supplyTempC,
        returnTempC,
        meanTempC,
        deltaTK,
        rawBufferVolumeL,
        bufferVolumeL,
        vessel,
        totalFlowLh,
        radiatorSharePct,
        ufhSharePct,
        hasRadiators,
        hasUfh,
        radiatorPowerKw,
        ufhPowerKw,
        radiatorFlowLh,
        ufhPrimaryFlowLh,
        mainPipe,
        radiatorPipe,
        ufhBranchPipe,
        balancingDpKpa,
        mainKv,
        mainKvs,
        actualDpAtKvsKpa,
        radiatorKv,
        radiatorKvs,
        ufhBranchKv,
        ufhBranchKvs,
        ufh,
        pump,
        sourceComparison,
    };
}
