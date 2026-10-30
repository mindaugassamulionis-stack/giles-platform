import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
    rho,
    nu,
    calcEn12828ExpansionVessel,
    calcDarcyPipeFriction,
    pickDarcyPipeDn,
    calcUfhLoopsWithLeader,
    calcPumpOperatingPoint,
    calcHydronicNode6In1,
    CALCULATOR_BUILDING_PRESETS,
    STATICO_VESSEL_SIZES_L,
    PUMP_CURVE_MODELS,
    calcHeatLoadBand,
    HEAT_COEFFICIENTS,
    CLIMATE_ZONES,
} from './heat-load-calc';

describe('W91-A2: Unified 6-in-1 Hydronic Calculator Engine (EN 12828, Darcy-Weisbach, UFH Leader, Pump Q-H)', () => {
    it('maintains backward compatibility with heat-load band exports', () => {
        expect(HEAT_COEFFICIENTS.length).toBeGreaterThanOrEqual(4);
        expect(CLIMATE_ZONES.length).toBeGreaterThanOrEqual(4);
        const band = calcHeatLoadBand({
            areaM2: 140,
            ceilingHeightM: 2.5,
            era: HEAT_COEFFICIENTS[0].id,
            zoneId: CLIMATE_ZONES[0].id,
        });
        expect(band).not.toBeNull();
        expect(band!.kwHigh).toBeGreaterThan(band!.kwLow);
    });

    it('computes Kell water density rho(T) accurately across 4..95 °C', () => {
        const rho4 = rho(4);
        const rho10 = rho(10);
        const rho80 = rho(80);
        const rho90 = rho(90);

        expect(rho4).toBeCloseTo(1000, 1);
        expect(rho10).toBeGreaterThan(999.5);
        expect(rho10).toBeLessThan(1000);
        expect(rho80).toBeGreaterThan(971);
        expect(rho80).toBeLessThan(973);
        expect(rho90).toBeGreaterThan(964.5);
        expect(rho90).toBeLessThan(966);
        expect(nu(70)).toBeLessThan(nu(20));
    });

    it('computes EN 12828 expansion vessel volume with Vs = Vsys + Vb, 90 °C solid-fuel safety temperature, and Vwr reserve', () => {
        const solidFuelVessel = calcEn12828ExpansionVessel({
            systemVolumeL: 220,
            bufferVolumeL: 500,
            supplyTempC: 75,
            isSolidFuel: true,
            staticHeightM: 8,
            safetyValveBar: 3.0,
        });

        // Total volume Vs = 220 + 500 = 720 L
        expect(solidFuelVessel.totalSystemVolumeL).toBe(720);
        // Solid fuel forces Tmax = max(75, 90) = 90 °C
        expect(solidFuelVessel.maxTempC).toBe(90);
        // Expansion coeff e = rho(10) / rho(90) - 1 ≈ 0.0358
        expect(solidFuelVessel.expansionCoeff).toBeCloseTo(rho(10) / rho(90) - 1, 4);
        // Ve = 720 * e ≈ 25.79 L
        expect(solidFuelVessel.expansionVolumeL).toBeCloseTo(720 * (rho(10) / rho(90) - 1), 1);
        // Vwr = max(0.005 * 720, 3) = 3.6 L
        expect(solidFuelVessel.waterReserveL).toBeCloseTo(3.6, 2);
        // P0 = 8 / 10 + 0.2 = 1.0 bar, Pe = 3.0 - 0.5 = 2.5 bar
        expect(solidFuelVessel.prechargeBar).toBeCloseTo(1.0, 2);
        expect(solidFuelVessel.maxWorkingBar).toBeCloseTo(2.5, 2);
        expect(solidFuelVessel.coldFillBar).toBeCloseTo(1.3, 2);
        // Vn = (Ve + Vwr) * (2.5 + 1) / (2.5 - 1.0) ≈ 68.58 L -> Statico 80 L
        expect(solidFuelVessel.nominalVolumeL).toBeGreaterThan(60);
        expect(solidFuelVessel.standardVesselL).toBe(80);
        expect(STATICO_VESSEL_SIZES_L).toContain(solidFuelVessel.standardVesselL);

        const heatPumpVessel = calcEn12828ExpansionVessel({
            systemVolumeL: 180,
            bufferVolumeL: 200,
            supplyTempC: 55,
            isSolidFuel: false,
            staticHeightM: 6,
            safetyValveBar: 3.0,
        });
        expect(heatPumpVessel.maxTempC).toBe(55);
        expect(heatPumpVessel.totalSystemVolumeL).toBe(380);
        expect(heatPumpVessel.standardVesselL).toBeLessThan(solidFuelVessel.standardVesselL);
    });

    it('sizes hydronic pipe DN15..DN50 via Darcy-Weisbach so friction loss R <= 150 Pa/m and velocity v <= 0.8 m/s', () => {
        const lowFlow = pickDarcyPipeDn(300, 70);
        expect(lowFlow.dn).toBe('DN15');
        expect(lowFlow.frictionPaPerM).toBeLessThanOrEqual(150);
        expect(lowFlow.velocityMs).toBeLessThanOrEqual(0.8);

        // At 450 l/h DN15 exceeds 150 Pa/m even though v < 0.8 m/s, so Darcy-Weisbach upgrades to DN20
        const steppedFlow = pickDarcyPipeDn(450, 70);
        expect(steppedFlow.dn).toBe('DN20');
        expect(steppedFlow.frictionPaPerM).toBeLessThanOrEqual(150);

        const medFlow = pickDarcyPipeDn(1000, 70);
        expect(medFlow.dn).toBe('DN25');
        expect(medFlow.frictionPaPerM).toBeLessThanOrEqual(150);
        expect(medFlow.velocityMs).toBeLessThanOrEqual(0.8);

        const highFlow = pickDarcyPipeDn(3600, 70);
        expect(['DN32', 'DN40', 'DN50']).toContain(highFlow.dn);
        expect(highFlow.frictionPaPerM).toBeLessThanOrEqual(150);
        expect(highFlow.velocityMs).toBeLessThanOrEqual(0.8);

        const directDarcy = calcDarcyPipeFriction(1000, 21.6, 70);
        expect(directDarcy.Reynolds).toBeGreaterThan(2300);
        expect(directDarcy.frictionPaPerM).toBeGreaterThan(10);
    });

    it('computes UFH loops accounting for supply + return leader length 2 * Ll', () => {
        const withShortLeader = calcUfhLoopsWithLeader({
            heatedAreaM2: 140,
            ufhSharePct: 100,
            spacingCm: 15,
            maxLoopLengthM: 100,
            leaderLengthM: 2,
            ufhPowerKw: 6.5,
            ufhSupplyTempC: 40,
        });
        const withLongLeader = calcUfhLoopsWithLeader({
            heatedAreaM2: 140,
            ufhSharePct: 100,
            spacingCm: 15,
            maxLoopLengthM: 100,
            leaderLengthM: 15,
            ufhPowerKw: 6.5,
            ufhSupplyTempC: 40,
        });

        expect(withShortLeader.effectiveLoopMaxM).toBe(96);
        expect(withLongLeader.effectiveLoopMaxM).toBe(70);
        expect(withLongLeader.nLoops).toBeGreaterThanOrEqual(withShortLeader.nLoops);
        expect(withLongLeader.totalPipeLengthM).toBeGreaterThan(withShortLeader.floorPipeLengthM);
        expect(withShortLeader.nLoops).toBeGreaterThanOrEqual(2);
        expect(withShortLeader.nLoops).toBeLessThanOrEqual(12);
    });

    it('computes pump operating point (Q_op, H_op) and selects from Wilo Para 25/4, 25/6, 25/8 curves', () => {
        expect(PUMP_CURVE_MODELS.slice(0, 3).map((p) => p.model)).toEqual([
            'Wilo Para 25/4',
            'Wilo Para 25/6',
            'Wilo Para 25/8',
        ]);

        const pumpRes = calcPumpOperatingPoint({
            flowLh: 1150,
            pipeFrictionPaPerM: 95,
            longestCircuitLengthM: 60,
            sourcePressureDropKpa: 3,
            balancingValveDpKpa: 10,
            emitterDpKpa: 8,
            meanWaterTempC: 72.5,
        });

        expect(pumpRes.flowM3h).toBeCloseTo(1.15, 2);
        expect(pumpRes.headM).toBeGreaterThan(2.0);
        expect(pumpRes.selectedPump.model).toMatch(/Wilo Para/);
    });

    it('exports 4 localized building presets and computes full 6-in-1 node state', () => {
        expect(CALCULATOR_BUILDING_PRESETS).toHaveLength(4);
        expect(CALCULATOR_BUILDING_PRESETS.map((p) => p.title.lt)).toEqual([
            'Naujas A++ namas (140 m²)',
            'Renovuotas namas (180 m²)',
            'Senas namas katilo perdarymui (220 m²)',
            'Gamybinės dirbtuvės / angaras (450 m²)',
        ]);

        const state = calcHydronicNode6In1({
            areaM2: 180,
            energyClass: 'B',
            powerReservePct: 15,
            heatSource: 'megatherm_pellet',
            supplyTempC: 80,
            deltaTK: 15,
            systemVolumeL: 220,
            staticHeightM: 8,
            safetyValveBar: 3.0,
            balancingDpKpa: 10,
            longestCircuitM: 60,
            ufhSharePct: 50,
            pipeSpacingCm: 15,
            maxLoopLengthM: 100,
            leaderLengthM: 6,
            ufhSupplyTempC: 40,
        });

        expect(state.recommendedPowerKw).toBeGreaterThan(10);
        expect(state.bufferVolumeL).toBeGreaterThanOrEqual(500);
        expect(state.vessel.standardVesselL).toBeGreaterThanOrEqual(50);
        expect(state.mainPipe.dn).toMatch(/^DN/);
        expect(state.ufh.nLoops).toBeGreaterThanOrEqual(2);
        expect(state.pump.selectedPump.shortCode).toMatch(/25\/[468]|32\/10/);
    });

    it('renders GilesLiveHydronicSchematic (live-hydronic-schematic) and GilesPumpQhChart (pump-qh-chart) and wires 4 presets into scientific-calculators-hub.tsx across lt, en, pl, ru', () => {
        const repoRoot = join(__dirname, '../..');
        const schemPath = join(repoRoot, 'src/components/giles-live-hydronic-schematic.tsx');
        const hubPath = join(repoRoot, 'src/components/scientific-calculators-hub.tsx');

        expect(existsSync(schemPath)).toBe(true);
        const schemSrc = readFileSync(schemPath, 'utf8');
        const hubSrc = readFileSync(hubPath, 'utf8');

        expect(schemSrc).toContain('data-testid="live-hydronic-schematic"');
        expect(schemSrc).toContain('viewBox="0 0 900 360"');
        expect(schemSrc).toContain('data-testid="pump-qh-chart"');
        expect(schemSrc).toContain('viewBox="0 0 640 270"');
        expect(schemSrc).toContain('Teplomix 61 °C');
        expect(schemSrc).toContain('Wilo Para 25/4');
        expect(schemSrc).toContain('Wilo Para 25/6');
        expect(schemSrc).toContain('Wilo Para 25/8');

        expect(hubSrc).toContain('GilesLiveHydronicSchematic');
        expect(hubSrc).toContain('GilesPumpQhChart');
        expect(hubSrc).toContain('data-testid="calculator-building-presets"');
        expect(hubSrc).toContain('calcHydronicNode6In1');
    });
});
