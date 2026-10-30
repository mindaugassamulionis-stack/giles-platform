import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';
import {
    BOILER_SYSTEM_GROUPS,
    LITHUANIAN_BOILER_SYSTEM_MODELS,
    getBoilerSystemModelById,
    getBoilerSystemGroupById,
    resolveBoilerCompatibilityPassport,
    filterProductsByBoilerCompatibility,
    type BoilerSystemGroupId,
} from './lithuanian-boiler-compatibility';
import {
    searchCatalogProductsPaged,
    getBoilerCompatibilityCounts,
    shouldShowBoilerCompatibilityBar,
} from './catalog-listing';
import {
    splitBoilerModelLabel,
    TOP_BOILER_QUICK_PICKS,
} from '../components/boiler-compatibility-selector';

const repoRoot = path.resolve(__dirname, '../..');

describe('W103-A2: 25-Model Lithuanian Old & New Boiler / Heat Pump Compatibility Matrix & Passport', () => {
    it('1) Defines 4 structured groups covering all 25 popular Lithuanian boiler and heat pump models in LT, EN, PL, RU', () => {
        expect(BOILER_SYSTEM_GROUPS).toHaveLength(4);

        const expectedGroups: Array<{ id: BoilerSystemGroupId; count: number; expectedIds: string[] }> = [
            {
                id: 'kieto_kuro_seni',
                count: 8,
                expectedIds: [
                    'viadrus-u22-u26',
                    'kalvis-2-serija',
                    'atmos-vigas',
                    'stropuva-zvake',
                    'vienybe-atrama-umega',
                    'defro-moderator-sas',
                    'buderus-bosch-dakon',
                    'tisco-kamen-pramoniniai',
                ],
            },
            {
                id: 'granuliniai_degikliai',
                count: 6,
                expectedIds: [
                    'megatherm-mpb',
                    'verner-v25-a251',
                    'ponast-kp',
                    'thermostal-attack',
                    'kostrzewa-pellasx-kipi',
                    'biokaitra-opop-burnpell',
                ],
            },
            {
                id: 'silumos_siurbliai',
                count: 6,
                expectedIds: [
                    'haier-super-aqua-r290',
                    'haier-hydro-split',
                    'panasonic-aquarea',
                    'daikin-mitsubishi',
                    'nibe-ctc-vaillant',
                    'gree-midea-samsung',
                ],
            },
            {
                id: 'dujiniai_elektriniai_mazgai',
                count: 5,
                expectedIds: [
                    'viessmann-vitodens-bosch',
                    'vaillant-protherm-baxi',
                    'haier-es-kospell-elektra',
                    'radiatorine-sistema-dn15',
                    'grindinio-sildymo-sistema',
                ],
            },
        ];

        expect(LITHUANIAN_BOILER_SYSTEM_MODELS).toHaveLength(25);

        for (const expectedGroup of expectedGroups) {
            const group = getBoilerSystemGroupById(expectedGroup.id);
            expect(group, `Missing group ${expectedGroup.id}`).toBeDefined();
            expect(group?.models).toHaveLength(expectedGroup.count);

            for (const loc of ['lt', 'en', 'pl', 'ru'] as const) {
                expect(group?.title[loc].length).toBeGreaterThan(8);
                expect(group?.shortTabLabel[loc].length).toBeGreaterThan(5);
                expect(group?.subtitle[loc].length).toBeGreaterThan(10);
                expect(group?.title[loc]).not.toContain('—');
                expect(group?.subtitle[loc]).not.toContain('—');
            }

            const actualIds = group?.models.map((m) => m.id) ?? [];
            expect(actualIds).toEqual(expectedGroup.expectedIds);
        }
    });

    it('2) Every one of the 25 models has a complete Engineering Compatibility Passport with zero em-dashes', () => {
        for (const model of LITHUANIAN_BOILER_SYSTEM_MODELS) {
            const found = getBoilerSystemModelById(model.id);
            expect(found).toBeDefined();
            expect(found?.id).toBe(model.id);

            for (const loc of ['lt', 'en', 'pl', 'ru'] as const) {
                expect(model.labels[loc].length).toBeGreaterThan(5);
                expect(model.shortChipLabels[loc].length).toBeGreaterThan(3);
                expect(model.labels[loc]).not.toContain('—');

                const passport = resolveBoilerCompatibilityPassport(model.id, loc);
                expect(passport, `Missing passport for ${model.id} (${loc})`).toBeDefined();
                expect(passport?.modelTitle.length).toBeGreaterThan(5);
                expect(passport?.marketShareNote.length).toBeGreaterThan(15);
                expect(passport?.conversionOrUpgradeSummary.length).toBeGreaterThan(20);
                expect(passport?.recommendedSpecs.burnerKw.length).toBeGreaterThan(3);
                expect(passport?.recommendedSpecs.bufferTankLiters.length).toBeGreaterThan(3);
                expect(passport?.recommendedSpecs.anticondensationValve.length).toBeGreaterThan(3);
                expect(passport?.recommendedSpecs.flueOrConnection.length).toBeGreaterThan(3);
                expect(passport?.recommendedSpecs.typicalSpareParts.length).toBeGreaterThan(3);
                expect(passport?.vytautasPrompt.length).toBeGreaterThan(15);

                // Anti-slop R-02: zero em-dashes anywhere in passport text
                const combined = [
                    passport?.modelTitle,
                    passport?.marketShareNote,
                    passport?.conversionOrUpgradeSummary,
                    passport?.recommendedSpecs.burnerKw,
                    passport?.recommendedSpecs.bufferTankLiters,
                    passport?.recommendedSpecs.anticondensationValve,
                    passport?.recommendedSpecs.flueOrConnection,
                    passport?.recommendedSpecs.typicalSpareParts,
                    passport?.vytautasPrompt,
                ].join(' ');
                expect(combined).not.toContain('—');
            }

            expect(model.passport.matchingKeywords.length).toBeGreaterThan(0);
            expect(model.passport.matchingCategories.length).toBeGreaterThan(0);
            expect(model.passport.matchingSkus.length).toBeGreaterThan(0);
        }
    });

    it('3) All 25 boiler/system profiles return > 0 compatible products from the 6,337-SKU catalog via searchCatalogProductsPaged({ boiler })', async () => {
        const counts = getBoilerCompatibilityCounts();
        expect(Object.keys(counts)).toHaveLength(25);

        for (const model of LITHUANIAN_BOILER_SYSTEM_MODELS) {
            const count = counts[model.id];
            expect(
                count,
                `Expected boiler profile "${model.id}" to match > 0 products in getBoilerCompatibilityCounts()`,
            ).toBeGreaterThan(0);

            const paged = await searchCatalogProductsPaged({
                boiler: model.id,
                page: 1,
                pageSize: 24,
            });
            expect(
                paged.total,
                `Expected searchCatalogProductsPaged({ boiler: "${model.id}" }).total > 0`,
            ).toBeGreaterThan(0);
            expect(paged.total).toBe(count);
            expect(paged.items.length).toBeGreaterThan(0);

            const directFiltered = filterProductsByBoilerCompatibility(paged.items, model.id);
            expect(directFiltered.length).toBe(paged.items.length);
        }
    });

    it('4) Preserves shouldShowBoilerCompatibilityBar behavior and wires boiler-compatibility-selector & boiler-compatibility-passport in products/page.tsx', () => {
        expect(shouldShowBoilerCompatibilityBar(undefined)).toBe(true);
        expect(shouldShowBoilerCompatibilityBar('Granulių degikliai')).toBe(true);
        expect(shouldShowBoilerCompatibilityBar('Radiatoriai ir šildymo prietaisai')).toBe(false);
        expect(shouldShowBoilerCompatibilityBar('Radiatoriai ir šildymo prietaisai', 'radiatorine-sistema-dn15')).toBe(true);

        const productsPageSrc = fs.readFileSync(
            path.join(repoRoot, 'src/app/[locale]/products/page.tsx'),
            'utf8',
        );
        const selectorCompPath = path.join(repoRoot, 'src/components/boiler-compatibility-selector.tsx');
        expect(fs.existsSync(selectorCompPath)).toBe(true);
        const selectorCompSrc = fs.readFileSync(selectorCompPath, 'utf8');
        const combinedSrc = `${productsPageSrc}\n${selectorCompSrc}`;

        expect(productsPageSrc).toContain('BoilerCompatibilitySelector');
        expect(productsPageSrc).toContain('giles-boiler-compatibility-bar');
        expect(productsPageSrc).toContain('data-testid="boiler-compatibility-passport"');
        expect(productsPageSrc).toContain('resolveBoilerCompatibilityPassport');

        // Anti-dump regression checks: no duplicate headings or unspaced alt-text concatenation in products/page.tsx
        expect(productsPageSrc).not.toContain(
            'Filtruoti pagal jūsų esamą arba planuojamą katilą / šilumos sistemą (25 populiariausi modeliai Lietuvoje):',
        );
        expect(productsPageSrc).not.toContain('alt="Megatherm MPB"');
        expect(productsPageSrc).not.toContain('alt="Haier R290"');

        // Dedicated collapsible selector component checks
        expect(selectorCompSrc).toContain('data-testid="boiler-compatibility-selector"');
        expect(selectorCompSrc).toContain('data-testid="boiler-selector-expand-toggle"');
        expect(selectorCompSrc).toContain('data-testid="boiler-compatibility-dropdown"');
        expect(selectorCompSrc).toContain('boiler-group-tab-');
        expect(selectorCompSrc).toContain('boiler-model-chip-');
        expect(selectorCompSrc).toContain('Katilo / sistemos suderinamumo filtras:');
        expect(selectorCompSrc).toContain('Visi 25 katilų ir sistemų modeliai (pagal 4 grupes) ▾');
        expect(selectorCompSrc).toContain('Suskleisti modelių sąrašą ▴');
        expect(selectorCompSrc).toContain('Greita paieška tarp 25 modelių...');
        expect(selectorCompSrc).toContain('Pasirinktas katilas:');
        expect(combinedSrc).toContain('BOILER_SYSTEM_GROUPS');

        // Verify quick-picks and model label splitter
        expect(TOP_BOILER_QUICK_PICKS.length).toBeGreaterThanOrEqual(5);
        for (const qp of TOP_BOILER_QUICK_PICKS) {
            expect(getBoilerSystemModelById(qp.id)).toBeDefined();
        }
        const splitViadrus = splitBoilerModelLabel(
            'Viadrus U22 / U26 / Hercules (Ketiniai 4–10 sekc.)',
        );
        expect(splitViadrus.modelName).toBe('Viadrus U22 / U26 / Hercules');
        expect(splitViadrus.subtitle).toBe('Ketiniai 4–10 sekc.');
    });
});
