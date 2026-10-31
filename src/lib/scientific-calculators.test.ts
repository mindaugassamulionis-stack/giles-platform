import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
    calculateBoilerAndHeatLoss,
    calculateExpansionVessel,
    calculateHydraulicValve,
    calculateUnderfloorManifold,
    calculateRadiatorNode,
    SCIENTIFIC_CALCULATOR_TABS,
} from './scientific-calculators';

describe('W35-A1: 5-in-1 ŠVOK Scientific Engineering Calculators', () => {
    it('exports 5 distinct calculator tab metadata descriptors with standards citations', () => {
        expect(SCIENTIFIC_CALCULATOR_TABS).toHaveLength(5);
        const ids = SCIENTIFIC_CALCULATOR_TABS.map((t) => t.id);
        expect(ids).toEqual(['boiler', 'vessel', 'valve', 'manifold', 'radiator']);
        for (const tab of SCIENTIFIC_CALCULATOR_TABS) {
            expect(tab.titleLt.length).toBeGreaterThan(10);
            expect(tab.standardBadge.length).toBeGreaterThan(3);
        }
    });

    describe('1. calculateBoilerAndHeatLoss (LST EN 12831 / STR 2.01.02:2016)', () => {
        it('calculates design heat loss, DHW reserve, boiler kW, cylinder volume and annual MWh accurately', () => {
            const res = calculateBoilerAndHeatLoss({
                areaM2: 140,
                energyClass: 'A+',
                climateZone: 'vidurio',
                indoorTempC: 21,
                ceilingHeightM: 2.7,
                ventilationType: 'rekuperacija_85',
                occupants: 4,
                dhwMode: 'boileris',
            });

            // T_i = 21, T_e = -21 (vidurio) => deltaT = 42 K
            expect(res.deltaT).toBe(42);
            expect(res.outdoorDesignTempC).toBe(-21);
            // Base q_STR for A+ = 28 W/m²
            // Φ_HL = 140 * 28 * (42/40) * (2.7/2.7) * 0.82 / 1000 = 3.375 kW
            expect(res.designHeatLossKw).toBeCloseTo(3.38, 1);
            expect(res.transmissionLossKw + res.ventilationLossKw).toBeCloseTo(res.designHeatLossKw, 2);
            // 4 occupants * 0.35 kW = 1.4 kW reserve
            expect(res.dhwPowerReserveKw).toBeCloseTo(1.4, 2);
            // recommendedBoilerKw = ceil((3.38 * 1.15 + 1.4) * 2) / 2 = 5.5 kW
            expect(res.recommendedBoilerKw).toBeGreaterThanOrEqual(5);
            // 4 * 50 L = 200 L cylinder
            expect(res.recommendedCylinderLiters).toBe(200);
            expect(res.annualEnergyMwh).toBeGreaterThan(6);
            expect(res.formulaCitation).toContain('LST EN 12831');
            expect(res.formulaCitation).toContain('STR 2.01.02:2016');
            expect(res.substitutedFormula).toContain('140 m²');
        });

        it('enforces >= 24 kW minimum boiler power when instant DHW (momentinis) is selected', () => {
            const instant = calculateBoilerAndHeatLoss({
                areaM2: 100,
                energyClass: 'A++',
                climateZone: 'pajuris',
                indoorTempC: 21,
                ceilingHeightM: 2.7,
                ventilationType: 'rekuperacija_85',
                occupants: 3,
                dhwMode: 'momentinis',
            });
            expect(instant.recommendedBoilerKw).toBeGreaterThanOrEqual(24);
            expect(instant.recommendedCylinderLiters).toBe(0);
        });

        it('scales heat loss higher for older C/D_E class buildings in Rytų LT (-23 °C) with natural ventilation', () => {
            const modern = calculateBoilerAndHeatLoss({
                areaM2: 150,
                energyClass: 'A++',
                climateZone: 'pajuris',
                indoorTempC: 20,
                ceilingHeightM: 2.6,
                ventilationType: 'rekuperacija_85',
                occupants: 4,
                dhwMode: 'be_kv',
            });
            const older = calculateBoilerAndHeatLoss({
                areaM2: 150,
                energyClass: 'D_E',
                climateZone: 'rytu',
                indoorTempC: 22,
                ceilingHeightM: 3.0,
                ventilationType: 'naturali',
                occupants: 4,
                dhwMode: 'be_kv',
            });
            expect(older.designHeatLossKw).toBeGreaterThan(modern.designHeatLossKw * 4);
            expect(older.recommendedBoilerKw).toBeGreaterThan(20);
        });
    });

    describe('2. calculateExpansionVessel (LST EN 12828 Boyle–Mariotte)', () => {
        it('computes system water volume, expansion volume, P_0 precharge, and standard IMI Pneumatex Statico size', () => {
            const res = calculateExpansionVessel({
                systemPowerKw: 20,
                emitterType: 'underfloor',
                customWaterVolumeL: 0,
                maxFlowTempC: '60',
                glycolPercent: 0,
                staticHeightM: 7,
                safetyValveBar: 3.0,
            });

            // 20 kW * 13.5 l/kW = 270 L
            expect(res.systemVolumeL).toBeCloseTo(270, 1);
            // 60 °C -> e = 0.0171
            expect(res.expansionCoeff).toBeCloseTo(0.0171, 4);
            // V_e = 270 * 0.0171 = 4.617 L
            expect(res.expansionVolumeL).toBeCloseTo(4.62, 1);
            // V_v = max(0.005 * 270, 3.0) = 3.0 L
            expect(res.waterReserveL).toBeCloseTo(3.0, 1);
            // P_0 = max(1.0, 7/10 + 0.2) = 1.0 bar
            expect(res.prechargeBar).toBeCloseTo(1.0, 2);
            // P_e = 3.0 - 0.5 = 2.5 bar
            expect(res.maxWorkingBar).toBeCloseTo(2.5, 2);
            // V_n = (4.617 + 3.0) * (2.5 + 1) / (2.5 - 1.0) = 7.617 * 3.5 / 1.5 = 17.77 L -> standard 18 L
            expect(res.minVesselVolumeL).toBeCloseTo(17.77, 1);
            expect(res.standardVesselLiters).toBe(18);
            expect(res.formulaCitation).toContain('LST EN 12828');
        });

        it('increases expansion volume when glycol is present and static height increases P_0', () => {
            const glycolRes = calculateExpansionVessel({
                systemPowerKw: 35,
                emitterType: 'cast_iron_buffer',
                customWaterVolumeL: 0,
                maxFlowTempC: '80',
                glycolPercent: 30,
                staticHeightM: 12,
                safetyValveBar: 3.0,
            });
            // P_0 = 12/10 + 0.2 = 1.4 bar
            expect(glycolRes.prechargeBar).toBeCloseTo(1.4, 2);
            expect(glycolRes.standardVesselLiters).toBeGreaterThanOrEqual(80);
        });
    });

    describe('3. calculateHydraulicValve (Kv, flow rate & silent DN selection)', () => {
        it('calculates mass flow (l/h), required Kv (m³/h), and selects DN keeping velocity <= 0.75 m/s', () => {
            const res = calculateHydraulicValve({
                branchPowerKw: 12,
                deltaTK: 15,
                targetDpKpa: 10,
            });

            // flowLh = (12 * 860) / 15 = 688 l/h
            expect(res.flowLh).toBeCloseTo(688, 0);
            expect(res.flowLmin).toBeCloseTo(11.47, 1);
            // Kv = (0.688) / sqrt(10 / 100) = 0.688 / 0.3162277 = 2.175 m³/h
            expect(res.requiredKv).toBeCloseTo(2.18, 1);
            expect(res.recommendedDn).toBe('DN20');
            expect(res.waterVelocityMs).toBeLessThanOrEqual(0.75);
            expect(res.formulaCitation).toContain('K_v');
        });

        it('selects larger DN (DN32/DN40/DN50) for high power and narrow deltaT', () => {
            const highFlow = calculateHydraulicValve({
                branchPowerKw: 45,
                deltaTK: 10,
                targetDpKpa: 10,
            });
            expect(['DN32', 'DN40', 'DN50']).toContain(highFlow.recommendedDn);
            expect(highFlow.waterVelocityMs).toBeLessThanOrEqual(0.75);
        });
    });

    describe('4. calculateUnderfloorManifold (LST EN 1264)', () => {
        it('calculates pipe length with 7% reserve, loop count, manifold ports, and rotameter l/min setting', () => {
            const res = calculateUnderfloorManifold({
                floorAreaM2: 85,
                pipeSpacingCm: 15,
                specificLoadWm2: 50,
                maxLoopLengthM: 80,
            });

            // 85 m² * 6.7 m/m² * 1.07 = 609.365 m -> ceil 610 m
            expect(res.totalPipeLengthM).toBeGreaterThanOrEqual(609);
            // 610 / 80 = 7.625 -> 8 loops
            expect(res.recommendedLoops).toBe(8);
            expect(res.manifoldsNeeded).toBe(1);
            expect(res.actuatorsCount).toBe(8);
            expect(res.euroconusCount).toBe(16);
            expect(res.flowPerLoopLmin).toBeGreaterThan(1.0);
            expect(res.formulaCitation).toContain('LST EN 1264');
        });

        it('indicates 2 manifolds needed when raw loop count exceeds 12 ports', () => {
            const large = calculateUnderfloorManifold({
                floorAreaM2: 220,
                pipeSpacingCm: 15,
                specificLoadWm2: 55,
                maxLoopLengthM: 80,
            });
            expect(large.rawLoops).toBeGreaterThan(12);
            expect(large.manifoldsNeeded).toBeGreaterThanOrEqual(2);
            expect(large.recommendedLoops).toBeLessThanOrEqual(12);
        });
    });

    describe('5. calculateRadiatorNode (Radiatorių mazgų komplektavimo vedlys)', () => {
        it('calculates complete kit quantities for bottom VK 50mm connection with AFC dynamic Eclipse valves', () => {
            const res = calculateRadiatorNode({
                radiatorCount: 7,
                connectionType: 'bottom_vk_50mm',
                controlType: 'afc_dynamic',
                headType: 'liquid_click_or_m30',
            });

            expect(res.headsCount).toBe(7);
            expect(res.valvesCount).toBe(7);
            expect(res.hBlocksCount).toBe(7);
            expect(res.euroconusCount).toBe(14);
            expect(res.totalSystemFlowLh).toBeCloseTo(7 * 68.8, 1);
            expect(res.formulaCitation).toContain('ΔT_15K');
        });
    });

    describe('6. Storefront UI & API Wiring (/skaiciuokle, /api/calculator-recommendations, Homepage)', () => {
        const srcDir = join(__dirname, '..');

        it('wires ScientificCalculatorsHub and 5 interactive SVG diagrams into /tools/silumos-skaiciuokle/page.tsx and /skaiciuokle/page.tsx with live catalog recommendations', () => {
            const toolPage = readFileSync(join(srcDir, 'app/[locale]/tools/silumos-skaiciuokle/page.tsx'), 'utf8');
            const hubComp = readFileSync(join(srcDir, 'components/scientific-calculators-hub.tsx'), 'utf8');
            const diagComp = readFileSync(join(srcDir, 'components/calculator-visual-diagrams.tsx'), 'utf8');
            const apiRoute = readFileSync(join(srcDir, 'app/api/calculator-recommendations/route.ts'), 'utf8');
            const homePage = readFileSync(join(srcDir, 'app/[locale]/page.tsx'), 'utf8');

            expect(toolPage).toContain('ScientificCalculatorsHub');
            expect(toolPage).toContain('getCalculatorRecommendations');
            expect(toolPage).toContain('Interaktyvus ŠVOK įrangos parinkimo vedlys');
            expect(hubComp).toContain('/api/calculator-recommendations');
            expect(hubComp).toContain('BoilerHouseVisual');
            expect(hubComp).toContain('ExpansionVesselVisual');
            expect(hubComp).toContain('UnderfloorManifoldVisual');
            expect(hubComp).toContain('RadiatorNodeVisual');
            expect(hubComp).toContain('HydraulicPipeVisual');
            expect(hubComp).toContain('Ką tai reiškia paprastai?');
            expect(hubComp).not.toContain('MOKSLINIS PAGRINDIMAS IR FIZIKINĖ FORMULĖ');
            expect(hubComp).toContain('Atidaryti prekę');
            expect(diagComp).toContain('visual-diagram-boiler');
            expect(diagComp).toContain('visual-diagram-vessel');
            expect(diagComp).toContain('visual-diagram-manifold');
            expect(diagComp).toContain('visual-diagram-radiator');
            expect(diagComp).toContain('visual-diagram-valve');
            expect(apiRoute).toContain('getCalculatorRecommendations');
            expect(homePage).toContain('/skaiciuokle?tab=boiler');
            expect(homePage).toContain('/skaiciuokle?tab=vessel');
            expect(homePage).toContain('/skaiciuokle?tab=valve');
            expect(homePage).toContain('/skaiciuokle?tab=manifold');
            expect(homePage).toContain('/skaiciuokle?tab=radiator');

            const navbar =
                readFileSync(join(srcDir, 'components/navbar.tsx'), 'utf8') +
                '\n' +
                readFileSync(join(srcDir, 'i18n/storefront-ui-copy.ts'), 'utf8');
            const productCard = readFileSync(join(srcDir, 'components/product-card.tsx'), 'utf8');
            const popularProducts = readFileSync(join(srcDir, 'components/popular-products.tsx'), 'utf8');
            const pdpPage = readFileSync(join(srcDir, 'app/[locale]/products/[id]/page.tsx'), 'utf8');

            expect(navbar).toContain('Skaičiuoklės');
            expect(navbar).not.toContain('5 Mokslinės skaičiuoklės');
            expect(productCard).not.toContain('be PVM (21%)');
            expect(popularProducts).not.toContain('be PVM (21%)');
            expect(pdpPage).not.toContain('be PVM · 21% PVM');

            // W38-A1: Marketing banners, comparison tables, and JSON-LD on calculators and PDPs
            const calcMarketing = readFileSync(join(srcDir, 'lib/calculator-marketing.ts'), 'utf8');
            const widgetComp = readFileSync(join(srcDir, 'components/vytautas-assistant-widget.tsx'), 'utf8');
            expect(calcMarketing).toContain('CALCULATOR_MARKETING_BY_TOOL');
            expect(calcMarketing).toContain('Palyginimas: kurį variantą rinktis jūsų atveju?');
            expect(hubComp).toContain('Dažniausia klaida perkant iš akies');
            expect(hubComp).toContain('Kam skirta ši skaičiuoklė ir ką sužinosite?');
            expect(hubComp).toContain('Kaip gauti rezultatą per 30 sekundžių?');
            expect(widgetComp).toContain('Konsultantas Vytautas');
            expect(widgetComp).toContain('stopPropagation');
            expect(widgetComp).toContain('Ką šiandien renkame?');
            expect(widgetComp).not.toContain('AI + RAG');
            expect(pdpPage).toContain('buildProductFaqAndComparison');
        });

        it('W40-A1: wires customer-journey-tracker, structured CalculatorComparisonRow product refs, Vytautas live context bar, and Instant AI Search advisor', () => {
            const trackerFile = readFileSync(join(srcDir, 'lib/customer-journey-tracker.ts'), 'utf8');
            const calcMarketing = readFileSync(join(srcDir, 'lib/calculator-marketing.ts'), 'utf8');
            const widgetComp = readFileSync(join(srcDir, 'components/vytautas-assistant-widget.tsx'), 'utf8');
            const searchOverlay = readFileSync(join(srcDir, 'components/search-overlay.tsx'), 'utf8');
            const catalogSearchForm = readFileSync(join(srcDir, 'components/catalog-search-form.tsx'), 'utf8');

            expect(trackerFile).toContain('giles_customer_journey_v1');
            expect(trackerFile).toContain('giles:journey-update');
            expect(trackerFile).toContain('giles:open-vytautas');
            expect(trackerFile).toContain('openVytautasWithContext');
            expect(trackerFile).toContain('recordSearchQuery');
            expect(trackerFile).toContain('recordCalculatorRun');
            expect(trackerFile).toContain('recordViewedProduct');
            expect(trackerFile).toContain('recordSelectedVariant');

            expect(calcMarketing).toContain('recommendedProducts');
            expect(calcMarketing).toContain('vytautasPrompt');
            expect(calcMarketing).not.toMatch(/[❌🎯⚡]/u);

            expect(widgetComp).toContain('vytautas-active-context-bar');
            expect(widgetComp).toContain('Jūsų paieškos ir skaičiavimų atmintis (Vytautas mato, ką renkate)');
            expect(widgetComp).toContain('journeyContext');

            expect(searchOverlay).toContain('Vytautas: Greitas paieškos patarimas ir patikslinimas');
            expect(searchOverlay).toContain('Klausti Vytauto patarimo pagal šią paiešką →');
            expect(catalogSearchForm).toContain('Klausti inžinieriaus Vytauto (AI)');

            // W47-A1: Zero truncation on calculator selector tabs + instrumental grammar ("su konsultantu Vytautu") + PDP datasheet link
            const hubComp = readFileSync(join(srcDir, 'components/scientific-calculators-hub.tsx'), 'utf8');
            const toolPage = readFileSync(join(srcDir, 'app/[locale]/tools/silumos-skaiciuokle/page.tsx'), 'utf8');
            expect(hubComp).toContain('formatInstrumentalAgentName');
            expect(hubComp).not.toContain('truncate');
            expect(toolPage).toContain("formatInstrumentalAgentName('Vytautas')");
            expect(SCIENTIFIC_CALCULATOR_TABS.map((t) => t.shortTitleLt)).toEqual([
                'Katilas ir boileris',
                'Plėtimosi indas',
                'Vamzdynas ir vožtuvai',
                'Grindų kolektorius',
                'Radiatoriaus mazgas',
            ]);
            expect(SCIENTIFIC_CALCULATOR_TABS.map((t) => t.standardBadge)).toEqual([
                'Šilumos galia (kW) ir tūris (l)',
                'Indo tūris (l) ir slėgis (bar)',
                'Skersmuo DN15–DN50 ir Kvs',
                '2–12 kontūrų ir pavaros',
                'Apatinis VK 50 mm ir šoninis',
            ]);

            const pdpPage = readFileSync(join(srcDir, 'app/[locale]/products/[id]/page.tsx'), 'utf8');
            const datasheetPage = readFileSync(join(srcDir, 'app/[locale]/products/[id]/datasheet/page.tsx'), 'utf8');
            expect(pdpPage).toContain('data-testid="pdp-datasheet-link"');
            expect(pdpPage).toContain('Atsisiųsti techninį pasą (PDF / Spausdinti)');
            expect(datasheetPage).toContain('Gilės Inžinerija · Techninis gaminio pasas');
            expect(datasheetPage).toContain('2D Inžinerinė matmenų ir prijungimo schema');
        });
    });
});
