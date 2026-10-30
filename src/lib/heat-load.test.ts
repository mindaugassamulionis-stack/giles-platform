/**
 * W22-D1 T3: šilumos poreikio orientacinė skaičiuoklė.
 * Contract: static, source-cited coefficient table (LT STR 2.01.02:2016 /
 * LST EN 12831 band simplification); output is a kW BAND with the mandatory
 * disclaimer; result scales linearly with area and ceiling height; climate
 * zone multiplies the band. Orientational only — never a single exact kW.
 */
import { describe, expect, it } from 'vitest';
import {
    HEAT_COEFFICIENTS,
    CLIMATE_ZONES,
    calcHeatLoadBand,
    DISCALIMER_ORIENTATIONAL,
} from './heat-load';

describe('W22-D1 T3: heat load band calculator', () => {
    it('coefficient table is non-empty and every era carries a low/high W/m² band + source', () => {
        expect(HEAT_COEFFICIENTS.length).toBeGreaterThanOrEqual(3);
        for (const row of HEAT_COEFFICIENTS) {
            expect(row.wPerM2Low).toBeGreaterThan(0);
            expect(row.wPerM2High).toBeGreaterThan(row.wPerM2Low);
            expect(row.source.length).toBeGreaterThan(0);
        }
    });

    it('climate zones carry a multiplier and a source', () => {
        expect(CLIMATE_ZONES.length).toBeGreaterThanOrEqual(2);
        for (const z of CLIMATE_ZONES) expect(z.source.length).toBeGreaterThan(0);
    });

    it('returns a band (low < high) scaled by area, height and zone', () => {
        const band = calcHeatLoadBand({ areaM2: 100, ceilingHeightM: 2.5, era: HEAT_COEFFICIENTS[0].id, zoneId: CLIMATE_ZONES[0].id });
        expect(band.kwLow).toBeGreaterThan(0);
        expect(band.kwHigh).toBeGreaterThan(band.kwLow);
        // 100 m² × 2.5 m at first era band, zone 1.0 → exact table math
        expect(band.kwLow).toBeCloseTo((HEAT_COEFFICIENTS[0].wPerM2Low * 100) / 1000, 5);
    });

    it('scales linearly with area', () => {
        const a = calcHeatLoadBand({ areaM2: 50, ceilingHeightM: 2.5, era: HEAT_COEFFICIENTS[0].id, zoneId: CLIMATE_ZONES[0].id });
        const b = calcHeatLoadBand({ areaM2: 100, ceilingHeightM: 2.5, era: HEAT_COEFFICIENTS[0].id, zoneId: CLIMATE_ZONES[0].id });
        expect(b.kwLow).toBeCloseTo(a.kwLow * 2, 5);
        expect(b.kwHigh).toBeCloseTo(a.kwHigh * 2, 5);
    });

    it('taller ceilings increase the band (height/2.5 factor)', () => {
        const low = calcHeatLoadBand({ areaM2: 100, ceilingHeightM: 2.5, era: HEAT_COEFFICIENTS[0].id, zoneId: CLIMATE_ZONES[0].id });
        const tall = calcHeatLoadBand({ areaM2: 100, ceilingHeightM: 3.0, era: HEAT_COEFFICIENTS[0].id, zoneId: CLIMATE_ZONES[0].id });
        expect(tall.kwLow).toBeCloseTo(low.kwLow * (3.0 / 2.5), 5);
    });

    it('colder zone multiplies the band', () => {
        const base = calcHeatLoadBand({ areaM2: 100, ceilingHeightM: 2.5, era: HEAT_COEFFICIENTS[0].id, zoneId: CLIMATE_ZONES[0].id });
        const cold = calcHeatLoadBand({ areaM2: 100, ceilingHeightM: 2.5, era: HEAT_COEFFICIENTS[0].id, zoneId: CLIMATE_ZONES[CLIMATE_ZONES.length - 1].id });
        expect(cold.kwLow).toBeGreaterThan(base.kwLow);
    });

    it('mandatory orientational disclaimer constant exists', () => {
        expect(DISCALIMER_ORIENTATIONAL.lt).toMatch(/orientacinis/i);
        expect(DISCALIMER_ORIENTATIONAL.lt).toMatch(/nepakeičia projekto/i);
        expect(DISCALIMER_ORIENTATIONAL.en.length).toBeGreaterThan(0);
    });

    it('invalid era/zone/area returns null instead of inventing numbers', () => {
        expect(calcHeatLoadBand({ areaM2: -5, ceilingHeightM: 2.5, era: 'x', zoneId: 'x' })).toBeNull();
        expect(calcHeatLoadBand({ areaM2: 100, ceilingHeightM: 0, era: HEAT_COEFFICIENTS[0].id, zoneId: CLIMATE_ZONES[0].id })).toBeNull();
    });
});
