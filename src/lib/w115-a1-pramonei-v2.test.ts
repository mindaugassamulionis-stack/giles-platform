import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';
import {
    INDUSTRIAL_MODELS_FILE,
    ROI_CONFIG,
    PRAMONEI_PROJECTS,
    getPramoneiContent,
    getLocalizedIndustrialModels,
    getIndustrialModelBySlug,
    getLocalizedProjects,
} from './pramonei-v2/data';
import { isEstimate, isPublishable } from './pramonei-v2/types';
import { formatDecimal, formatEur, formatInt, priceLabel, withVat } from './pramonei-v2/format';
import { candidateModels, computeRoi } from './pramonei-v2/roi';
import { validateModels } from './pramonei-v2/validate';

const repoRoot = path.resolve(__dirname, '../..');

type RoiVector = [number, string, string, string, number, number, number, number, number | null];

const STAGING_VECTORS: RoiVector[] = [
    [1200, 'gas', 'chips', 'GK-750', 91200, 31800, 9540, 49860, 26],
    [250, 'gas', 'chips', 'GK-250', 19000, 6625, 3927, 8448, 67],
    [600, 'gas', 'chips', 'GK-500', 45600, 15900, 6975, 22725, 41],
    [2500, 'gas', 'chips', 'GK-2000', 190000, 66250, 16200, 107550, 26],
    [4500, 'lpg_oil', 'chips', 'GK-2500', 488250, 119250, 20970, 348030, 10],
    [1200, 'gas', 'pellets', 'GK-750', 91200, 57600, 9540, 24060, 54],
    [300, 'district', 'pellets', 'GK-250', 26400, 14400, 3927, 8073, 70],
];

const PRODUCTION_VECTORS: RoiVector[] = [
    [1200, 'gas', 'chips', 'GK-1000', 91200, 31800, 11700, 47700, 35],
    [2500, 'gas', 'chips', 'GK-2500', 190000, 66250, 20970, 102780, 33],
    [1200, 'gas', 'pellets', 'GK-1000', 91200, 57600, 11700, 21900, 76],
];

describe('W115-A1: Pramonei v2 Package Integration (Data, ROI, BoilerDrawings, Model Passports & 4-Locale UI)', () => {
    describe('1) ROI Calculator – Staging (SHOW_ASSUMPTIONS=true) & Production (SHOW_ASSUMPTIONS=false) vectors', () => {
        for (const [mwh, fuelId, bioId, code, now, bio, opex, net, pb] of STAGING_VECTORS) {
            it(`staging: ${mwh} MWh, ${fuelId} -> ${bioId} selects ${code}`, () => {
                const r = computeRoi(
                    { mwhPerYear: mwh, currentFuelId: fuelId, bioFuelId: bioId },
                    ROI_CONFIG,
                    INDUSTRIAL_MODELS_FILE.models,
                    { SHOW_ASSUMPTIONS: true },
                );
                expect(r.model.code).toBe(code);
                expect(r.nowEur).toBe(now);
                expect(r.bioEur).toBe(bio);
                expect(r.opexEur).toBe(opex);
                expect(r.netSavingEur).toBe(net);
                expect(r.paybackMonths).toBe(pb);
            });
        }

        for (const [mwh, fuelId, bioId, code, now, bio, opex, net, pb] of PRODUCTION_VECTORS) {
            it(`production: ${mwh} MWh, ${fuelId} -> ${bioId} selects ${code}`, () => {
                const r = computeRoi(
                    { mwhPerYear: mwh, currentFuelId: fuelId, bioFuelId: bioId },
                    ROI_CONFIG,
                    INDUSTRIAL_MODELS_FILE.models,
                    { SHOW_ASSUMPTIONS: false },
                );
                expect(r.model.code).toBe(code);
                expect(r.nowEur).toBe(now);
                expect(r.bioEur).toBe(bio);
                expect(r.opexEur).toBe(opex);
                expect(r.netSavingEur).toBe(net);
                expect(r.paybackMonths).toBe(pb);
            });
        }

        it('handles exceedsRange and non-positive payback edge cases', () => {
            const high = computeRoi(
                { mwhPerYear: 8000, currentFuelId: 'gas', bioFuelId: 'chips' },
                ROI_CONFIG,
                INDUSTRIAL_MODELS_FILE.models,
                { SHOW_ASSUMPTIONS: true },
            );
            expect(high.model.code).toBe('GK-2500');
            expect(high.exceedsRange).toBe(true);

            const cheapCfg = {
                ...ROI_CONFIG,
                current_fuels: [{ id: 'x', label: 'x', eur_per_mwh_heat: { min: 20, max: 20 } }],
            };
            const noPayback = computeRoi(
                { mwhPerYear: 600, currentFuelId: 'x', bioFuelId: 'chips' },
                cheapCfg,
                INDUSTRIAL_MODELS_FILE.models,
                { SHOW_ASSUMPTIONS: true },
            );
            expect(noPayback.paybackMonths).toBeNull();
        });
    });

    describe('2) Deterministic formatting & model validation (preventing React #418 hydration errors)', () => {
        it('formats integers, EUR prices, VAT, and decimals with deterministic NBSP', () => {
            expect(formatInt(78500)).toBe('78\u00A0500');
            expect(formatEur(78500)).toBe('78\u00A0500\u00A0€');
            expect(withVat(28500)).toBe(34485);
            expect(priceLabel(108000, { gross: true, estimate: true })).toBe('≈\u00A0130\u00A0680\u00A0€');
            expect(priceLabel(28500, { gross: true, estimate: false })).toBe('34\u00A0485\u00A0€');
            expect(formatDecimal(4.5, 1)).toBe('4,5');
        });

        it('validates all 13 industrial models with 0 structural errors and proper segment distribution (7 buy, 4 rent, 2 special)', () => {
            const report = validateModels(INDUSTRIAL_MODELS_FILE);
            expect(report.errors).toEqual([]);
            expect(INDUSTRIAL_MODELS_FILE.models).toHaveLength(13);

            const buyModels = INDUSTRIAL_MODELS_FILE.models.filter((m) => m.segment === 'buy');
            const rentModels = INDUSTRIAL_MODELS_FILE.models.filter((m) => m.segment === 'rent');
            const specialModels = INDUSTRIAL_MODELS_FILE.models.filter((m) => m.segment === 'special');
            expect(buyModels).toHaveLength(7);
            expect(rentModels).toHaveLength(4);
            expect(specialModels).toHaveLength(2);

            const gk750 = getIndustrialModelBySlug('gk-750', 'lt');
            expect(gk750).toBeDefined();
            expect(isEstimate(gk750!.price_net_eur)).toBe(true);
            expect(isPublishable(gk750!.price_net_eur, { SHOW_ASSUMPTIONS: false })).toBe(false);
            expect(isPublishable(gk750!.price_net_eur, { SHOW_ASSUMPTIONS: true })).toBe(true);
            expect(candidateModels(INDUSTRIAL_MODELS_FILE.models, { SHOW_ASSUMPTIONS: false })).toHaveLength(5);
            expect(candidateModels(INDUSTRIAL_MODELS_FILE.models, { SHOW_ASSUMPTIONS: true })).toHaveLength(7);
        });
    });

    describe('3) 4-Locale localization (LT, EN, PL, RU) & BoilerDrawings schematic geometry', () => {
        it('localizes content, models, and 6 projects across lt, en, pl, ru without Lithuanian leaks', () => {
            for (const locale of ['lt', 'en', 'pl', 'ru'] as const) {
                const content = getPramoneiContent(locale);
                const models = getLocalizedIndustrialModels(locale);
                const projects = getLocalizedProjects(locale);

                expect(content.hero.h1.length).toBeGreaterThan(10);
                expect(content.paths).toHaveLength(3);
                expect(content.assemblies.items).toHaveLength(5);
                expect(content.process.steps).toHaveLength(6);
                expect(content.documents.items).toHaveLength(6);
                expect(content.faq.items).toHaveLength(6);
                expect(models).toHaveLength(13);
                expect(projects).toHaveLength(6);

                if (locale !== 'lt') {
                    expect(content.hero.h1).not.toBe('Konteinerinės katilinės 100 kW – 2,5 MW');
                    expect(content.models_section.row_cta).not.toBe('Modelio pasas');
                    expect(content.roi.title).not.toContain('Kiek sutaupytumėte');
                }
            }
            expect(PRAMONEI_PROJECTS).toHaveLength(6);
        });

        it('provides 3-view BoilerDrawings data for GK-2000 and GK-500 with unified position tags (K1..E1) and true scale', () => {
            const gk2000 = getIndustrialModelBySlug('gk-2000', 'lt');
            const gk500 = getIndustrialModelBySlug('gk-500', 'lt');
            expect(gk2000?.drawing).toBeDefined();
            expect(gk500?.drawing).toBeDefined();

            expect(gk2000!.drawing!.modules[0].lengthMm).toBe(12192);
            expect(gk2000!.drawing!.modules[0].widthMm + gk2000!.drawing!.modules[1].widthMm).toBe(4876);
            const ratio =
                gk2000!.drawing!.modules[0].lengthMm /
                (gk2000!.drawing!.modules[0].widthMm + gk2000!.drawing!.modules[1].widthMm);
            expect(ratio).toBeCloseTo(2.5, 2);

            const tags = gk2000!.drawing!.positions.map((p) => p.tag);
            expect(tags).toContain('K1');
            expect(tags).toContain('D1');
            expect(tags).toContain('H1');
            expect(tags).toContain('E1');
        });
    });

    describe('4) Component & Route Wiring + Content Fixes compliance', () => {
        it('wires PramoneiV2View and BoilerDrawings with all required SPEC.md data-testid hooks and zero banned strings', () => {
            const viewSrc = fs.readFileSync(
                path.join(repoRoot, 'src/components/pramonei-v2/pramonei-v2-view.tsx'),
                'utf8',
            );
            const drawingsSrc = fs.readFileSync(
                path.join(repoRoot, 'src/components/pramonei-v2/boiler-drawings.tsx'),
                'utf8',
            );
            const passportSrc = fs.readFileSync(
                path.join(repoRoot, 'src/components/pramonei-v2/model-passport-view.tsx'),
                'utf8',
            );
            const slugPageSrc = fs.readFileSync(
                path.join(repoRoot, 'src/app/[locale]/pramonei/[slug]/page.tsx'),
                'utf8',
            );

            expect(viewSrc).toContain('data-testid="models-table"');
            expect(viewSrc).toContain('data-testid="price-head"');
            expect(viewSrc).toContain('data-testid="vat-net"');
            expect(viewSrc).toContain('data-testid="vat-gross"');
            expect(viewSrc).toContain('data-testid="roi-model"');
            expect(viewSrc).toContain('data-testid="roi-net"');
            expect(viewSrc).toContain('data-testid="roi-payback"');
            expect(viewSrc).toContain('data-testid="rfq-form"');
            expect(viewSrc).toContain('data-testid="rfq-success"');
            expect(viewSrc).not.toContain('\u2014');

            expect(drawingsSrc).toContain('data-testid="drawings"');
            expect(drawingsSrc).toContain('drawing-position-');
            expect(drawingsSrc).not.toContain('[__]');
            expect(drawingsSrc).not.toContain('\u2014');

            expect(passportSrc).toContain('BoilerDrawings');
            expect(slugPageSrc).toContain('ModelPassportView');

            const uiCopySrc = fs.readFileSync(
                path.join(repoRoot, 'src/i18n/storefront-ui-copy.ts'),
                'utf8',
            );
            expect(uiCopySrc).not.toContain('Patentuotas prekės ženklas');
            expect(uiCopySrc).not.toContain('Pramonei 150–500 kW');

            const layoutSrc = fs.readFileSync(
                path.join(repoRoot, 'src/app/[locale]/layout.tsx'),
                'utf8',
            );
            expect(layoutSrc).not.toContain('nuo 1995');
        });
    });
});
