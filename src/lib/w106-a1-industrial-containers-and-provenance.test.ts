import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';
import {
    INDUSTRIAL_CONTAINER_SYSTEMS,
    LITHUANIAN_INDUSTRIAL_FUEL_BENCHMARKS,
    INDUSTRIAL_ZERO_TO_HERO_STEPS,
    calculateIndustrialContainerRoi,
} from '../components/industrial-containers-hub';
import { COMPATIBILITY_SOURCE_PROVENANCE_COPY } from './compatibility-provenance';
import {
    LITHUANIAN_BOILER_SYSTEM_MODELS,
    resolveBoilerCompatibilityPassport,
} from './lithuanian-boiler-compatibility';
import { evaluateCartCompatibilityRecommendations } from '../components/cart-client';

const repoRoot = path.resolve(__dirname, '../..');

describe('W106-A1: Industrial Container Boiler House Dossiers, Bright Lightbox & Compatibility Source Provenance', () => {
    it('1) defines all 6 industrial boiler house systems (GK-500, GK-750, Modulinė 2,0 MW, Mobili 500 kW, Pramoninė biodujų, Karšto oro 80–190 kW) with 3-view CAD blueprints and 12-point specs', () => {
        expect(INDUSTRIAL_CONTAINER_SYSTEMS).toHaveLength(6);

        const titlesLt = INDUSTRIAL_CONTAINER_SYSTEMS.map((m) => m.title.lt);
        expect(titlesLt[0]).toContain('GK-500');
        expect(titlesLt[0]).toContain('500 kW');
        expect(titlesLt[1]).toContain('GK-750');
        expect(titlesLt[1]).toContain('750 kW');
        expect(titlesLt[2]).toContain('Modulinė');
        expect(titlesLt[2]).toContain('2,0 MW');
        expect(titlesLt[3]).toContain('Mobili katilinė');
        expect(titlesLt[3]).toContain('500 kW');
        expect(titlesLt[4]).toContain('biodujų');
        expect(titlesLt[5]).toContain('karšto oro katilinė 80–190 kW');

        for (const sys of INDUSTRIAL_CONTAINER_SYSTEMS) {
            expect(sys.imageSrc).toMatch(/^\/studio-assets\/projects\/giles-darbas-\d+\.webp$/);
            expect(sys.cadViews).toHaveLength(3);
            expect(sys.cadViews.map((v) => v.id)).toEqual(['plan', 'section', 'hydronic']);
            expect(sys.specs).toHaveLength(12);

            const specParamsLt = sys.specs.map((s) => s.param.lt).join(' | ');
            expect(specParamsLt).toContain('Vardinė galia');
            expect(specParamsLt).toContain('Naudingumo koeficientas');
            expect(specParamsLt).toContain('Darbinis slėgis');
            expect(specParamsLt).toContain('Kuro tipai');
            expect(specParamsLt).toContain('Kuro sąnaudos');
            expect(specParamsLt).toContain('Kuro saugyklos tūris');
            expect(specParamsLt).toContain('Autonominis darbas');
            expect(specParamsLt).toContain('Pelenų šalinimas');
            expect(specParamsLt).toContain('Dūmų valymas');
            expect(specParamsLt).toContain('Automatika');
            expect(specParamsLt).toContain('Gabaritai');
            expect(specParamsLt).toContain('Prijungimo flanšai');
        }
    });

    it('2) provides official Lithuanian industrial heating fuel benchmarks (BALTPOOL / LEA / VERT) and interactive ROI calculation', () => {
        expect(LITHUANIAN_INDUSTRIAL_FUEL_BENCHMARKS).toHaveLength(4);
        const benchmarkSummary = LITHUANIAN_INDUSTRIAL_FUEL_BENCHMARKS.map(
            (b) => `${b.label.lt}: ${b.priceRangeLabel.lt}`,
        ).join(' | ');

        expect(benchmarkSummary).toContain('Medienos skiedra (SM2)');
        expect(benchmarkSummary).toContain('24–29 €/MWh');
        expect(benchmarkSummary).toContain('Pramoninės medienos granulės');
        expect(benchmarkSummary).toContain('44–52 €/MWh');
        expect(benchmarkSummary).toContain('Gamtinės dujos');
        expect(benchmarkSummary).toContain('68–84 €/MWh');
        expect(benchmarkSummary).toContain('Suskystintos dujos (LPG) / Šildymo dyzelinas');
        expect(benchmarkSummary).toContain('95–122 €/MWh');

        const roiGas = calculateIndustrialContainerRoi({
            areaM2: 4500,
            requiredPowerKw: 500,
            replacedFuel: 'dujos',
        });
        expect(roiGas.annualMwh).toBeGreaterThan(800);
        expect(roiGas.annualSavingsEur).toBeGreaterThan(25000);
        expect(roiGas.paybackYears).toBeGreaterThanOrEqual(1.2);
        expect(roiGas.paybackYears).toBeLessThanOrEqual(2.8);

        const roiDiesel = calculateIndustrialContainerRoi({
            areaM2: 6000,
            requiredPowerKw: 750,
            replacedFuel: 'dyzelinas',
        });
        expect(roiDiesel.annualSavingsEur).toBeGreaterThan(roiGas.annualSavingsEur);
    });

    it('3) provides the 6-step "From 0 to Hero" industrial boiler house implementation roadmap', () => {
        expect(INDUSTRIAL_ZERO_TO_HERO_STEPS).toHaveLength(6);
        const stepsText = INDUSTRIAL_ZERO_TO_HERO_STEPS.map(
            (s) => `${s.stepNumber} ${s.title.lt} ${s.description.lt} ${s.deliverable.lt}`,
        ).join(' ');

        expect(stepsText).toContain('statybos leidim');
        expect(stepsText).toContain('pamatinių blokų');
        expect(stepsText).toContain('SCADA');
        expect(stepsText).toContain('EN 12828');
        expect(stepsText).toContain('Walking-Floor');
    });

    it('4) wires IndustrialContainersHub & CompletedWorksGallery into /gamyba and /pramonei with bright clickable photos and Lightbox dossier modal', () => {
        const hubSrc = fs.readFileSync(
            path.join(repoRoot, 'src/components/industrial-containers-hub.tsx'),
            'utf8',
        );
        const gallerySrc = fs.readFileSync(
            path.join(repoRoot, 'src/components/completed-works-gallery.tsx'),
            'utf8',
        );
        const gamybaPageSrc = fs.readFileSync(
            path.join(repoRoot, 'src/app/[locale]/gamyba/page.tsx'),
            'utf8',
        );
        const pramoneiPageSrc = fs.readFileSync(
            path.join(repoRoot, 'src/app/[locale]/pramonei/page.tsx'),
            'utf8',
        );

        expect(hubSrc).toContain('data-testid="industrial-container-dossier"');
        expect(hubSrc).toContain('data-testid="industrial-container-dossier-modal"');
        expect(hubSrc).toContain('data-testid="industrial-cad-view-tabs"');
        expect(hubSrc).toContain('data-testid="industrial-specs-table"');
        expect(hubSrc).toContain('data-testid="industrial-roi-statistics"');
        expect(hubSrc).toContain('data-testid="industrial-zero-to-hero-guide"');
        expect(hubSrc).toContain('Padidinti nuotrauką ir techninį brėžinį');
        expect(hubSrc).toContain('brightness-105 contrast-105');
        expect(hubSrc).not.toContain('brightness-75');
        expect(hubSrc).not.toContain('\u2014');

        expect(gallerySrc).toContain('Padidinti nuotrauką ir techninį brėžinį');
        expect(gallerySrc).toContain('brightness-105 contrast-105');
        expect(gallerySrc).not.toContain('\u2014');

        expect(gamybaPageSrc).toMatch(/IndustrialContainersHub|pramonei\/page/);
        expect(pramoneiPageSrc).toContain('IndustrialContainersHub');
        expect(pramoneiPageSrc).toContain('CompletedWorksGallery');
        expect(pramoneiPageSrc).not.toContain('\u2014');
    });

    it('5) displays explicit source-provenance & "pasitikslinkite" caveats (req_261030064151_1270) in boiler-compatibility-selector.tsx and products/[id]/page.tsx', () => {
        const selectorSrc = fs.readFileSync(
            path.join(repoRoot, 'src/components/boiler-compatibility-selector.tsx'),
            'utf8',
        );
        const pdpSrc = fs.readFileSync(
            path.join(repoRoot, 'src/app/[locale]/products/[id]/page.tsx'),
            'utf8',
        );

        const expectedStandardSource =
            'Šaltinis: Gamintojo techninis katalogas (Danfoss / IMI Hydronic / HERZ / Haier / Gorenje 2025–2026) ir LST EN 215 / EN 12828 / EN 303-5 standartas';
        const expectedRetrofitCaveat =
            'Patikslinimo pastaba: Kieto kuro katilų durelių angos ir flanšo matmenys priklauso nuo katilo pagaminimo metų ir kW modifikacijos – prieš užsakant durelių perdarymo komplektą ar degiklį, tikslius matmenis pasitikslinkite pagal katilo techninį pasą arba su „Gilės inžinerijos“ inžinieriumi (+370 611 19158).';

        expect(COMPATIBILITY_SOURCE_PROVENANCE_COPY.lt.standardSource).toBe(expectedStandardSource);
        expect(COMPATIBILITY_SOURCE_PROVENANCE_COPY.lt.retrofitCaveat).toBe(expectedRetrofitCaveat);

        expect(selectorSrc).toContain('data-testid="compatibility-source-provenance"');
        expect(selectorSrc).toContain(expectedStandardSource);
        expect(selectorSrc).toContain(expectedRetrofitCaveat);
        expect(selectorSrc).not.toContain('\u2014');

        expect(pdpSrc).toContain('data-testid="compatibility-source-provenance"');
        expect(pdpSrc).toContain(expectedStandardSource);
        expect(pdpSrc).toContain(expectedRetrofitCaveat);

        // req_261030072802_61e2: strict PATVIRTINTA_GAMINTOJO (4 profiles) vs NEPATVIRTINTA_GAMINTOJO (21 profiles)
        const confirmedIds = LITHUANIAN_BOILER_SYSTEM_MODELS.filter(
            (m) => m.verificationStatus === 'PATVIRTINTA_GAMINTOJO',
        ).map((m) => m.id);
        expect(confirmedIds.sort()).toEqual(
            [
                'megatherm-mpb',
                'haier-super-aqua-r290',
                'haier-hydro-split',
                'haier-es-kospell-elektra',
            ].sort(),
        );

        const unconfirmedModels = LITHUANIAN_BOILER_SYSTEM_MODELS.filter(
            (m) => m.verificationStatus === 'NEPATVIRTINTA_GAMINTOJO',
        );
        expect(unconfirmedModels).toHaveLength(21);
        for (const m of unconfirmedModels) {
            const p = resolveBoilerCompatibilityPassport(m.id, 'lt');
            expect(p?.verificationStatus).toBe('NEPATVIRTINTA_GAMINTOJO');
            expect(p?.verificationBadgeLabel).toBe(
                'Tipinis parinkimas (suderinamumą su konkrečiu katilo modeliu pasitikslinkite su mūsų inžinieriumi +370 611 19158)',
            );
        }

        const cartSrc = fs.readFileSync(
            path.join(repoRoot, 'src/components/cart-client.tsx'),
            'utf8',
        );
        expect(cartSrc).toContain(
            'Suderinamumą pasitikslinkite su mūsų inžinieriumi (+370 611 19158) arba pagal įrenginio techninį pasą',
        );
        const crossBrandRecs = evaluateCartCompatibilityRecommendations([
            { sku: 'GI-RAD-22VK-600-1000', name: 'Plieninis radiatorius Tipas 22 VK 600x1000 apatinis pajungimas' },
        ]);
        expect(crossBrandRecs[0]?.verificationStatus).toBe('NEPATVIRTINTA_GAMINTOJO');
        expect(crossBrandRecs[0]?.verificationBadge).toContain(
            'Suderinamumą pasitikslinkite su mūsų inžinieriumi (+370 611 19158)',
        );
    });
});
