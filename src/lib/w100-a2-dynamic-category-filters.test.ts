import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';
import {
    getDynamicCategorySubcategories,
    getDynamicCatalogBrands,
    getDynamicCategoryFacets,
    shouldShowBoilerCompatibilityBar,
    searchCatalogProductsPaged,
} from './catalog-listing';
import { searchGilesSnapshotPaged } from './giles-catalog-snapshot';

const repoRoot = path.resolve(__dirname, '../..');

describe('W100-A2: Dynamic Category Subcategory Drill-Down, Context-Aware Brands & Technical Facets', () => {
    it('1) Radiatoriai ir šildymo prietaisai: returns all 7 required subcategories with live counts > 0 and filters accurately via ?sub=...', async () => {
        const subs = getDynamicCategorySubcategories(
            { category: 'Radiatoriai ir šildymo prietaisai' },
            'lt',
        );

        const expectedSlugsAndLabels: Array<{ slug: string; labelContains: string }> = [
            { slug: 'all', labelContains: 'Visi radiatoriai ir konvektoriai' },
            { slug: 'plieniniai-soniniai', labelContains: 'Plieniniai radiatoriai (šoninis pajungimas Tipas 22 K)' },
            { slug: 'plieniniai-apatiniai', labelContains: 'Plieniniai radiatoriai (apatinis pajungimas Tipas 22 VK)' },
            { slug: 'aliumininiai-sekcijiniai', labelContains: 'Aliumininiai sekcijiniai radiatoriai (Ferroli POL)' },
            { slug: 'konvektoriai', labelContains: 'Konvektoriai ir šildymo prietaisai' },
            { slug: 'radiatoriu-priedai', labelContains: 'Radiatorių montavimo komplektai, laikikliai ir aklės' },
            { slug: 'radiatoriu-termostatika', labelContains: 'Radiatorių vožtuvai, binokliai ir termogalvutės' },
        ];

        for (const req of expectedSlugsAndLabels) {
            const found = subs.find((s) => s.slug === req.slug);
            expect(found, `Missing radiator subcategory ${req.slug}`).toBeDefined();
            expect(found?.label).toContain(req.labelContains);
            expect(found?.count, `Subcategory ${req.slug} must have > 0 items`).toBeGreaterThan(0);

            if (req.slug !== 'all') {
                const filteredSnap = searchGilesSnapshotPaged({
                    category: 'Radiatoriai ir šildymo prietaisai',
                    sub: req.slug,
                    page: 1,
                    pageSize: 50,
                });
                expect(filteredSnap.total).toBe(found?.count);
                expect(filteredSnap.items.length).toBeGreaterThan(0);

                const filteredCatalog = await searchCatalogProductsPaged({
                    category: 'Radiatoriai ir šildymo prietaisai',
                    sub: req.slug,
                    page: 1,
                    pageSize: 50,
                });
                expect(filteredCatalog.total).toBe(found?.count);
            }
        }

        const allSub = subs.find((s) => s.slug === 'all');
        expect(allSub?.count).toBe(101);
    });

    it('2) All 7 Main Categories: every defined subcategory across all 7 categories returns > 0 products', async () => {
        const categorySpecs: Array<{
            category: string;
            requiredSubSlugs: string[];
        }> = [
            {
                category: 'Radiatoriai ir šildymo prietaisai',
                requiredSubSlugs: [
                    'all',
                    'plieniniai-soniniai',
                    'plieniniai-apatiniai',
                    'aliumininiai-sekcijiniai',
                    'konvektoriai',
                    'radiatoriu-priedai',
                    'radiatoriu-termostatika',
                ],
            },
            {
                category: 'Katilai ir šilumos siurbliai',
                requiredSubSlugs: [
                    'silumos-siurbliai',
                    'granuliniai-katilai',
                    'kieto-kuro-katilai',
                    'elektriniai-katilai',
                    'kondicionieriai',
                ],
            },
            {
                category: 'Granulių degikliai',
                requiredSubSlugs: [
                    'megatherm-mpb',
                    'verner-ponast-thermostal',
                    'bunkeriai-sraigtai',
                    'degikliu-automatika',
                ],
            },
            {
                category: 'Akumuliacinės talpos ir boileriai',
                requiredSubSlugs: [
                    'akumuliacines-talpos',
                    'boileriai-kombinuoti',
                    'boileriai-su-ss',
                    'elektriniai-boileriai',
                    'pletimosi-indai',
                ],
            },
            {
                category: 'Termostatika ir vožtuvai',
                requiredSubSlugs: [
                    'termostatiniai-voztuvai',
                    'termogalvutes',
                    'apatinio-pajungimo-mazgai',
                    'balansiniai-voztuvai',
                    'oro-ir-purvo-separatoriai',
                    'pamaisymo-ir-apsaugos',
                ],
            },
            {
                category: 'Grindinis šildymas',
                requiredSubSlugs: [
                    'kolektoriai-spinteles',
                    'pavaros-termostatai',
                    'vamzdziai-jungtys',
                ],
            },
            {
                category: 'Atsarginės dalys',
                requiredSubSlugs: [
                    'uzdegimo-tenai',
                    'ardeliai-kamera',
                    'davikliai-termostatai',
                    'ventiliatoriai-pavaros',
                    'tarpines-boileriu-dalys',
                ],
            },
        ];

        for (const group of categorySpecs) {
            const subs = getDynamicCategorySubcategories({ category: group.category }, 'lt');
            expect(subs.length).toBeGreaterThanOrEqual(group.requiredSubSlugs.length);

            for (const slug of group.requiredSubSlugs) {
                const subObj = subs.find((s) => s.slug === slug);
                expect(
                    subObj,
                    `Expected subcategory "${slug}" in category "${group.category}"`,
                ).toBeDefined();
                expect(
                    subObj?.count,
                    `Expected subcategory "${slug}" in "${group.category}" to have > 0 products`,
                ).toBeGreaterThan(0);

                if (slug !== 'all') {
                    const res = await searchCatalogProductsPaged({
                        category: group.category,
                        sub: slug,
                        page: 1,
                        pageSize: 24,
                    });
                    expect(
                        res.total,
                        `Expected searchCatalogProductsPaged({ category: "${group.category}", sub: "${slug}" }) > 0`,
                    ).toBeGreaterThan(0);
                    expect(res.total).toBe(subObj?.count);
                }
            }
        }
    });

    it('3) Dynamic Manufacturer List: calculates exact per-category & per-subcategory brand counts and excludes 0-count brands', () => {
        const radiatorBrands = getDynamicCatalogBrands({
            category: 'Radiatoriai ir šildymo prietaisai',
        });

        expect(radiatorBrands.length).toBeGreaterThanOrEqual(4);
        const brandNames = radiatorBrands.map((b) => b.name);
        expect(brandNames).toContain('Ferroli');
        expect(brandNames).toContain('Gilės Inžinerija');
        expect(brandNames).toContain('IMI Heimeier');
        expect(brandNames).toContain('Danfoss');
        expect(brandNames).toContain('HERZ');

        // Global brands with 0 radiators must NOT appear in the radiator brand facet
        expect(brandNames).not.toContain('IMI Pneumatex');
        expect(brandNames).not.toContain('Comisa');
        expect(brandNames).not.toContain('Wavin');

        // Sorted descending by count
        for (let i = 1; i < radiatorBrands.length; i++) {
            expect(radiatorBrands[i - 1].count).toBeGreaterThanOrEqual(radiatorBrands[i].count);
        }

        // Subcategory drill-down narrows brand list further
        const aluminumBrands = getDynamicCatalogBrands({
            category: 'Radiatoriai ir šildymo prietaisai',
            sub: 'aliumininiai-sekcijiniai',
        });
        expect(aluminumBrands.some((b) => b.name === 'Ferroli')).toBe(true);
    });

    it('4) Context-Aware Technical Facets & Boiler Compatibility Bar Visibility', () => {
        // Boiler compatibility bar shown ONLY on Visos prekės, Granulių degikliai, Katilai, or Atsarginės dalys
        expect(shouldShowBoilerCompatibilityBar(undefined)).toBe(true);
        expect(shouldShowBoilerCompatibilityBar('Granulių degikliai')).toBe(true);
        expect(shouldShowBoilerCompatibilityBar('Degikliai ir priedai')).toBe(true);
        expect(shouldShowBoilerCompatibilityBar('Katilai ir šilumos siurbliai')).toBe(true);
        expect(shouldShowBoilerCompatibilityBar('Katilai ir katilinės įranga')).toBe(true);
        expect(shouldShowBoilerCompatibilityBar('Atsarginės dalys')).toBe(true);
        expect(shouldShowBoilerCompatibilityBar('Katilinės automatika ir pavaros')).toBe(true);

        expect(shouldShowBoilerCompatibilityBar('Radiatoriai ir šildymo prietaisai')).toBe(false);
        expect(shouldShowBoilerCompatibilityBar('Radiatoriai ir konvektoriai')).toBe(false);
        expect(shouldShowBoilerCompatibilityBar('Akumuliacinės talpos ir boileriai')).toBe(false);
        expect(shouldShowBoilerCompatibilityBar('Grindinis šildymas')).toBe(false);
        expect(shouldShowBoilerCompatibilityBar('Grindinis šildymas ir kolektoriai')).toBe(false);
        expect(shouldShowBoilerCompatibilityBar('Termostatika ir vožtuvai')).toBe(false);

        // Radiatoriai facets
        const radFacets = getDynamicCategoryFacets('Radiatoriai ir šildymo prietaisai', 'lt');
        expect(radFacets.groupHeading).toContain('Radiatoriaus pajungimas ir matmenys');
        const radChipLabels = radFacets.chips.map((c) => c.label);
        expect(radChipLabels).toContain('Šoninis pajungimas (K / DN15)');
        expect(radChipLabels).toContain('Apatinis pajungimas (VK 50 mm)');
        expect(radChipLabels).toContain('Aukštis 350 mm');
        expect(radChipLabels).toContain('Aukštis 500 mm');
        expect(radChipLabels).toContain('Aukštis 600 mm');
        expect(radChipLabels).toContain('Aukštis 800 mm');
        expect(radChipLabels).toContain('Ilgis 600–1000 mm');
        expect(radChipLabels).toContain('Ilgis 1200–1600 mm');
        for (const chip of radFacets.chips) {
            expect(chip.count, `Radiator facet chip "${chip.label}" must match > 0 items`).toBeGreaterThan(0);
            const res = searchGilesSnapshotPaged({
                category: 'Radiatoriai ir šildymo prietaisai',
                spec: chip.spec,
            });
            expect(res.total).toBeGreaterThan(0);
        }

        // Akumuliacinės talpos ir boileriai facets
        const tankFacets = getDynamicCategoryFacets('Akumuliacinės talpos ir boileriai', 'lt');
        expect(tankFacets.groupHeading).toContain('Talpos tūris ir tipas');
        const tankChipLabels = tankFacets.chips.map((c) => c.label);
        expect(tankChipLabels).toContain('Iki 100 L');
        expect(tankChipLabels).toContain('100–200 L');
        expect(tankChipLabels).toContain('200–500 L');
        expect(tankChipLabels).toContain('Virš 500 L');
        expect(tankChipLabels).toContain('R290 su šilumos siurbliu');
        expect(tankChipLabels).toContain('Akumuliacinė ZV');
        for (const chip of tankFacets.chips) {
            expect(chip.count, `Tank facet chip "${chip.label}" must match > 0 items`).toBeGreaterThan(0);
        }

        // Grindinis šildymas facets
        const ufhFacets = getDynamicCategoryFacets('Grindinis šildymas', 'lt');
        expect(ufhFacets.groupHeading).toContain('Kontūrų skaičius ir diametras');
        const ufhChipLabels = ufhFacets.chips.map((c) => c.label);
        expect(ufhChipLabels).toContain('2–6 kontūrai');
        expect(ufhChipLabels).toContain('7–12 kontūrų');
        expect(ufhChipLabels).toContain('16 mm / 20 mm vamzdžiai');
        expect(ufhChipLabels).toContain('230V / 24V pavaros');
        expect(ufhChipLabels).toContain('M30×1,5');
        for (const chip of ufhFacets.chips) {
            expect(chip.count, `UFH facet chip "${chip.label}" must match > 0 items`).toBeGreaterThan(0);
        }
    });

    it('5) Storefront UI Wiring: products/page.tsx, parduotuve/page.tsx, and store-catalog-client.tsx expose required testids and localized copy across LT, EN, PL, RU', () => {
        const productsPageSrc = fs.readFileSync(
            path.join(repoRoot, 'src/app/[locale]/products/page.tsx'),
            'utf8',
        );
        expect(productsPageSrc).toContain('catalog-subcategory-bar');
        expect(productsPageSrc).toContain('catalog-dynamic-brands');
        expect(productsPageSrc).toContain('catalog-dynamic-facets');
        expect(productsPageSrc).toContain('shouldShowBoilerCompatibilityBar');
        expect(productsPageSrc).toContain('getDynamicCategorySubcategories');
        expect(productsPageSrc).toContain('getDynamicCatalogBrands');
        expect(productsPageSrc).toContain('getDynamicCategoryFacets');

        for (const loc of ['lt', 'en', 'pl', 'ru'] as const) {
            const subs = getDynamicCategorySubcategories(
                { category: 'Radiatoriai ir šildymo prietaisai' },
                loc,
            );
            expect(subs.length).toBe(7);
            expect(subs[0].label.length).toBeGreaterThan(3);
        }
    });
});
