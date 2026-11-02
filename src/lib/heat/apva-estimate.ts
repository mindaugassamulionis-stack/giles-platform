// APVA / LEA kompensacijos estimatorius – serveriui saugi gryna logika.
// W126-F3: perkelta iš 'use client' apva-subsidy-widget, nes MCP maršrutas
// (mcp-store-tools-exec) per RSC ribą gaudavo client-reference proxy vietoj
// funkcijos ir tools/call apva_subsidy grąžindavo 500.
import { leaGrant, leaRate, type LeaData, type LeaType } from './lea';
import lea2026Json from '../../data/heat/lea-2026.lt.json';

const LEA_2026 = lea2026Json as unknown as LeaData;

export type ApvaReplacedBoilerType =
    | 'fossil_coal_wood'
    | 'old_biomass'
    | 'fossil_gas_oil';

export type ApvaNewDeviceType =
    | 'heat_pump_air_water'
    | 'ecodesign_pellet_boiler';

export type ApvaPowerStepKw = 6 | 8 | 10 | 12 | 15 | 20 | 25;

export const APVA_POWER_STEPS_KW: ApvaPowerStepKw[] = [6, 8, 10, 12, 15, 20, 25];

export interface ApvaSubsidyCalculationInput {
    replacedBoilerType: ApvaReplacedBoilerType;
    newDeviceType: ApvaNewDeviceType;
    powerKw: number;
    devicePriceEur: number;
}

export interface ApvaSubsidyCalculationResult {
    powerKw: number;
    devicePriceEur: number;
    fixedRatePerKwEur: number;
    estimatedGrantEur: number;
    netCustomerInvestmentEur: number;
    subsidySharePercent: number;
    recommendedSku: string;
    recommendedModelTitle: string;
    scopOrEfficiencyLabel: string;
    ecodesignRegulation: string;
}

export function calculateApvaSubsidyEstimate(
    input: ApvaSubsidyCalculationInput,
): ApvaSubsidyCalculationResult {
    const cleanKw = Math.max(4, Math.min(35, Number(input.powerKw) || 8));
    const cleanPrice = Math.max(500, Number(input.devicePriceEur) || 3430);

    // W126-A1: LEA (VšĮ Lietuvos energetikos agentūra) oficialūs juostiniai įkainiai iš
    // src/data/heat/lea-2026.lt.json – nebenaudojami apytiksliai „415 €/kW × 65 %“.
    // kompensacija = fiksuotasis įkainis (€/kW su PVM) × Prated (kW) × 50 %, bet ne daugiau įrangos kainos.
    const isHeatPump = input.newDeviceType === 'heat_pump_air_water';
    const leaType: LeaType = isHeatPump ? 'hp_aw' : 'bio';

    const fixedRatePerKwEur = leaRate(LEA_2026, leaType, cleanKw);
    const estimatedGrantEur =
        Math.floor(Math.min(leaGrant(LEA_2026, leaType, cleanKw), cleanPrice) * 100) / 100;
    const netCustomerInvestmentEur =
        Math.max(0, Math.round((cleanPrice - estimatedGrantEur) * 100) / 100);
    const subsidySharePercent = Math.min(
        50,
        Math.max(10, Math.round((estimatedGrantEur / cleanPrice) * 100)),
    );

    const recommendedSku = isHeatPump ? 'AW082HUGHA' : cleanKw >= 20 ? 'KAT-25KW-GI' : 'MPB-NANI-35';
    const recommendedModelTitle = isHeatPump
        ? `Haier Super Aqua Monoblock R290 ${cleanKw <= 10 ? '8,0' : '12,0'} kW (A+++)`
        : cleanKw >= 20
          ? 'Plieninis granulinis / kieto kuro katilas KaTRI 25 kW + MPB NANI (5 kl. EcoDesign)'
          : 'Granulių degiklio ir 5 kl. katilo komplektas Megatherm MPB NANI (8–35 kW)';

    const scopOrEfficiencyLabel = isHeatPump
        ? 'SCOP = 4,85 (prie +35 °C) · ηs = 189 % (A+++)'
        : 'Naudingumo koeficientas η = 91,4 % · ηs ≥ 79 % (5 klasė pagal EN 303-5)';

    const ecodesignRegulation = isHeatPump
        ? 'ES reglamentas Nr. 813/2013 (EcoDesign Oras–Vanduo A+++)'
        : 'ES reglamentas Nr. 2015/1189 ir EN 303-5:2021 (5 klasės EcoDesign biokuro katilas)';

    return {
        powerKw: cleanKw,
        devicePriceEur: cleanPrice,
        fixedRatePerKwEur,
        estimatedGrantEur,
        netCustomerInvestmentEur,
        subsidySharePercent,
        recommendedSku,
        recommendedModelTitle,
        scopOrEfficiencyLabel,
        ecodesignRegulation,
    };
}
