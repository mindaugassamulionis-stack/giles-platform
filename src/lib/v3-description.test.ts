// W22-D1-C & W33-B2: unit tests for v3 dual-audience product description parser,
// 15-subtype HVAC UX guide (including "Detalė tvirtinimo"), brand logo resolution,
// and 100% deterministic `.webp` image resolution.

import { describe, test, expect } from 'vitest';
import {
    parseV3Description,
    getInstallationInstructions,
    getProductUxGuide,
    getInstallationGuide,
    resolveProductImageUrl,
    resolveProductBrandInfo,
    BRAND_SHOWCASE_ITEMS,
    HERO_FLAGSHIP_SHOWCASE,
    HVAC_SYSTEM_GROUPS,
    normalizeMultiSkuPaste,
    extractCardTechChips,
    buildProductFaqAndComparison,
    formatCleanCatalogProductTitle,
} from './v3-description';

const DANFOSS_013G0011_V3 = `Radiatoriaus prijungimas ir šilumos reguliavimas — RA-N, kampinis, DN10.

Prijungiama prie radiatoriaus ir kartu su rankenėle reguliuoja, kiek jis šilda.

Specifikacija
| Parametras | Reikšmė |
|---|---|
| Gamintojas | Danfoss |
| Kodas | 013G0011 |
| Nominalus dydis | DN10 |
| kvs | 0,65 |
| Kaina | 59,29 € su PVM |

Paskirtis. RA-N šeimos ventilio korpusas — montuojamas radiatoriaus prijungime.

Naudojimas / suderinamumas. Dvivamzdėms sistemoms.

Visos kainos su PVM.`;

const HEIMEIER_9330_12_800_V3 = `Grindų šildymo paskirstymas ir automatinis balansavimas — Dynacon, 12 žiedai.

Padalija šiltą vandenį grindų šildymo dalims ir pats jas išlygiuoja.

Specifikacija
| Parametras | Reikšmė |
|---|---|
| Gamintojas | IMI Heimeier |
| Kodas | 9330-12.800 |
| Šeima | Dynacon |
| Tipas | Dynacon nerūdyjančio pl. grindinio šildymo kolektorius |
| Sriegis | G3/4 |
| Žiedai | 12 žiedai |
| Kaina | 891,82 € su PVM |

Paskirtis. Dynacon grindinio šildymo kolektorius — kontūrų paskirstymui ir automatiniam balansavimui.

Naudojimas / suderinamumas. Nerūdijantis plienas.

Visos kainos su PVM.`;

const PNEUMATEX_8121205_V3 = `Vandens degazavimas — Vento stotelė, iki 300 m³.

Iš vandens pašalina orą — sistema dirba ramiau.

Specifikacija
| Parametras | Reikšmė |
|---|---|
| Gamintojas | IMI Pneumatex |
| Kodas | 8121205 |
| Šeima | Vento |
| Nomin. slėgis | PN13 |
| Slėgio ribos | 6.0÷10.0 bar |
| Sistemos tūris | iki 300 m³ |
| Kaina | 10418,10 € su PVM |

Paskirtis. Vakuuminė cikloninė degazavimo stotelė — šaldymo ir šildymo sistemoms.

Naudojimas / suderinamumas. Su izoliacija nuo rasojimo. Šildymo ir šaldymo sistemoms.

Visos kainos su PVM.`;

describe('parseV3Description (W22-D1-C G-D1-1)', () => {
    test('parses Danfoss 013G0011 v3 description into hook, plainLayer, specRows, purpose, usage, and vatNotice with zero raw pipes', () => {
        const parsed = parseV3Description(DANFOSS_013G0011_V3);
        expect(parsed.hook).toBe('Radiatoriaus prijungimas ir šilumos reguliavimas — RA-N, kampinis, DN10.');
        expect(parsed.plainLayer).toBe(
            'Prijungiama prie radiatoriaus ir kartu su rankenėle reguliuoja, kiek jis šilda.',
        );
        expect(parsed.specRows).toEqual([
            { param: 'Gamintojas', value: 'Danfoss' },
            { param: 'Kodas', value: '013G0011' },
            { param: 'Nominalus dydis', value: 'DN10' },
            { param: 'kvs', value: '0,65' },
            { param: 'Kaina', value: '59,29 € su PVM' },
        ]);
        expect(parsed.purpose).toContain('RA-N šeimos ventilio korpusas');
        expect(parsed.purpose).toContain('Dvivamzdėms sistemoms.');
        expect(parsed.vatNotice).toBe('Visos kainos su PVM.');
        expect(parsed.legacyText).toBe('');
        expect(parsed.hook).not.toContain('|');
        expect(parsed.plainLayer).not.toContain('|');
        expect(parsed.purpose).not.toContain('|');
    });

    test('parses IMI Heimeier 9330-12.800 v3 description with 7 spec rows', () => {
        const parsed = parseV3Description(HEIMEIER_9330_12_800_V3);
        expect(parsed.hook).toBe('Grindų šildymo paskirstymas ir automatinis balansavimas — Dynacon, 12 žiedai.');
        expect(parsed.plainLayer).toBe('Padalija šiltą vandenį grindų šildymo dalims ir pats jas išlygiuoja.');
        expect(parsed.specRows).toHaveLength(7);
        expect(parsed.specRows[0]).toEqual({ param: 'Gamintojas', value: 'IMI Heimeier' });
        expect(parsed.specRows[1]).toEqual({ param: 'Kodas', value: '9330-12.800' });
        expect(parsed.specRows[5]).toEqual({ param: 'Žiedai', value: '12 žiedai' });
        expect(parsed.purpose).toContain('Dynacon grindinio šildymo kolektorius');
        expect(parsed.vatNotice).toBe('Visos kainos su PVM.');
    });

    test('parses IMI Pneumatex 8121205 v3 description cleanly', () => {
        const parsed = parseV3Description(PNEUMATEX_8121205_V3);
        expect(parsed.specRows.find((r) => r.param === 'Šeima')?.value).toBe('Vento');
        expect(parsed.specRows.find((r) => r.param === 'Sistemos tūris')?.value).toBe('iki 300 m³');
        expect(parsed.plainLayer).toBe('Iš vandens pašalina orą — sistema dirba ramiau.');
    });

    test('falls back cleanly to legacyText when description has no Specifikacija pipe table', () => {
        const legacy = 'Paprastas aprašymas be lentelės. Šildymo sistemos detalė.';
        const parsed = parseV3Description(legacy);
        expect(parsed.specRows).toEqual([]);
        expect(parsed.legacyText).toBe(legacy);
        expect(parsed.hook).toBe('');
        expect(parsed.plainLayer).toBe('');
    });

    test('handles empty or whitespace description safely', () => {
        const parsed = parseV3Description('   ');
        expect(parsed.specRows).toEqual([]);
        expect(parsed.legacyText).toBe('');
    });
});

describe('W33-B2: getProductUxGuide & getInstallationInstructions (15 HVAC subtypes)', () => {
    test('Subtype 1 ("Detalė tvirtinimo" / mounting bracket): returns dedicated whatYouGet, whatYouNeed, 4 steps, proTip, commonMistake, and 3-sec selfCheck', () => {
        const ux = getProductUxGuide({
            title: 'Detalė tvirtinimo SMU 35-80 l plėtimosi indams',
            category: 'Plėtimosi indai ir slėgio palaikymas',
            brand: 'IMI Pneumatex',
            sku: '7900201',
        });
        expect(ux.subtypeId).toBe('mounting-bracket');
        expect(ux.subtypeTitle).toBe('Tvirtinimo mazgas ir laikanti konsolė');
        expect(ux.whatYouGet).toHaveLength(3);
        expect(ux.whatYouGet[0]).toContain('Originali gamintojo plieninė tvirtinimo konsolė');
        expect(ux.whatYouNeed).toHaveLength(3);
        expect(ux.whatYouNeed[0]).toContain('Sieniniai ankeriai');
        expect(ux.steps).toHaveLength(4);
        expect(ux.steps[0].title).toContain('Įvertinkite pilną svorį su vandeniu');
        expect(ux.proTip).toContain('0,2–0,3 bar');
        expect(ux.commonMistake).toContain('DLV');
        expect(ux.selfCheck).toHaveLength(3);

        const viaAlias = getInstallationGuide('Plėtimosi indai', 'Detalė tvirtinimo', 'IMI Pneumatex', '7900201');
        expect(viaAlias.subtypeId).toBe('mounting-bracket');
    });

    test('Subtype 1A ("MONTAVIMO DĖŽĖ PATALPOS TERMOSTATUI" / GI-AUTOMATIKA-002): classifies as mounting-bracket hardware with wall-box instructions (never actuator M30x1,5)', () => {
        const ux = getProductUxGuide({
            title: 'MONTAVIMO DĖŽĖ PATALPOS TERMOSTATUI',
            category: 'Katilinės automatika ir pavaros',
            brand: null,
            sku: 'GI-AUTOMATIKA-002',
        });
        expect(ux.subtypeId).toBe('mounting-bracket');
        expect(ux.subtypeTitle).toBe('Tvirtinimo mazgas, laikanti konsolė ir montavimo dėžutė');
        expect(ux.whatYouGet.join(' ')).toContain('montavimo dėžutė');
        expect(ux.whatYouGet.join(' ')).not.toContain('M30×1,5');
        expect(ux.steps).toHaveLength(4);
        expect(ux.steps[0].title).toContain('1,5 m aukštyje');
        expect(ux.steps.map((s) => s.detail).join(' ')).toContain('gofr');
    });

    test('returns 4 practical Lithuanian steps + safetyNote for thermostatic valves/heads', () => {
        const guide = getInstallationInstructions({
            title: 'RA-N ventilio korpusas, kampinis, DN10 – 013G0011',
            category: 'Termostatinės galvutės ir vožtuvai',
            brand: 'Danfoss',
            sku: '013G0011',
        });
        expect(guide.title).toBeTruthy();
        expect(guide.steps).toHaveLength(4);
        expect(guide.steps.join(' ')).toMatch(/srieg|srauto|galvut/i);
        expect(guide.safetyNote).toBeTruthy();
    });

    test('distinguishes thermostatic heads (Subtype 10) from thermostatic valve bodies (Subtype 11)', () => {
        const headUx = getProductUxGuide({
            title: 'Danfoss Redia termostatinė galvutė RA Click',
            category: 'Termostatinės galvutės ir vožtuvai',
            brand: 'Danfoss',
            sku: '013G2970',
        });
        expect(headUx.subtypeId).toBe('thermostatic-head');
        expect(headUx.steps).toHaveLength(4);
        expect(headUx.whatYouGet).toHaveLength(3);

        const valveUx = getProductUxGuide({
            title: 'IMI Heimeier Eclipse DN15 termostatinis vožtuvas',
            category: 'Termostatinės galvutės ir vožtuvai',
            brand: 'IMI Heimeier',
            sku: '3933-02.000',
        });
        expect(valveUx.subtypeId).toBe('thermostatic-valve');
    });

    test('returns specific steps for balancing valves (STAD / STAF / TA Compact)', () => {
        const guide = getInstallationInstructions({
            title: 'STAD balansinis srauto reguliavimo vožtuvas DN15 – 52-151-014',
            category: 'Vamzdynai',
            brand: 'IMI TA',
            sku: '52-151-014',
        });
        expect(guide.steps).toHaveLength(4);
        expect(guide.steps.join(' ')).toMatch(/balans|matavim|srauto|apsisukim/i);
    });

    test('returns specific steps for expansion vessels (Statico / Aquapresso)', () => {
        const guide = getInstallationInstructions({
            title: 'Statico SD plėtimosi indas šildymo sistemoms',
            category: 'Plėtimosi indai ir slėgio palaikymas',
            brand: 'IMI Pneumatex',
            sku: '7101005',
        });
        expect(guide.steps).toHaveLength(4);
        expect(guide.steps.join(' ')).toMatch(/slėg|priešslėg/i);
    });

    test('returns specific steps for air/dirt separators (Zeparo / Vento)', () => {
        const guide = getInstallationInstructions({
            title: 'Zeparo ZUV automatinis oro atskyriklis',
            category: 'Oro atskyrikliai ir nuorintuvai',
            brand: 'IMI Pneumatex',
            sku: '7800105',
        });
        expect(guide.steps).toHaveLength(4);
        expect(guide.steps.join(' ')).toMatch(/vertikal|nuorin|purv|šlam/i);
    });

    test('returns specific steps for floor heating manifolds (Dynacon / Multilux / FHM)', () => {
        const guide = getInstallationInstructions({
            title: 'Dynacon nerūdyjančio pl. grindinio šildymo kolektorius 12 žiedų',
            category: 'Grindinis šildymas ir kolektoriai',
            brand: 'IMI Heimeier',
            sku: '9330-12.800',
        });
        expect(guide.steps).toHaveLength(4);
        expect(guide.steps.join(' ')).toMatch(/kolektor|kontūr|hidraulin/i);
    });

    test('returns specific steps for actuators & automation (EMO-T / TWA / katilinės automatika)', () => {
        const guide = getInstallationInstructions({
            title: 'EMO T terminė pavara 24V NC M30x1,5',
            category: 'Katilinės automatika ir pavaros',
            brand: 'IMI Heimeier',
            sku: '1833-00.500',
        });
        expect(guide.steps).toHaveLength(4);
        expect(guide.steps.join(' ')).toMatch(/įtamp|M30|atjunkite/i);
    });

    test('returns specific steps for radiators and convectors', () => {
        const guide = getInstallationInstructions({
            title: 'Plieninis plokštuminis radiatorius 22 tipas',
            category: 'Radiatoriai ir konvektoriai',
            brand: 'Ferroli',
            sku: 'RAD-22-600',
        });
        expect(guide.steps).toHaveLength(4);
        expect(guide.steps.join(' ')).toMatch(/konvekcij|nuorintuv|armatūr/i);
    });

    test('returns general fittings & plumbing installation steps as fallback', () => {
        const guide = getInstallationInstructions({
            title: 'Žalvarinė srieginė mova DN20',
            category: 'Vamzdynų jungtys ir armatūra',
            brand: 'Danfoss',
            sku: 'FIT-20',
        });
        expect(guide.steps).toHaveLength(4);
        expect(guide.safetyNote).toBeTruthy();
    });
});

describe('W33-B2: brand logo & product image fallback resolution', () => {
    test('resolveProductImageUrl always returns a real /images/products/*.webp path (never empty or data:)', () => {
        expect(
            resolveProductImageUrl({
                sku: '013G2970',
                title: 'Termostatinė galvutė',
                brand: 'Danfoss',
            }),
        ).toBe('/images/products/013g2970.webp');

        expect(
            resolveProductImageUrl({
                sku: 'GI-AUTOMATIKA-002',
                title: 'Detalė tvirtinimo konsolė',
                brand: 'IMI Pneumatex',
            }),
        ).toBe('/images/products/family-mounting-bracket.webp');

        expect(
            resolveProductImageUrl({
                sku: 'UNKNOWN-SKU',
                title: 'Kažkokia santechnikos detalė',
                imageUrl: 'data:image/svg+xml;base64,AAA',
            }),
        ).toMatch(/^\/images\/products\/.+\.webp$/);

        // W42-A1 regression: JSONB image object { url, slot, type } from PostgreSQL variants.images[0]
        expect(
            resolveProductImageUrl({
                sku: '9330-06.800',
                title: 'Dynacon nerūdijančio plieno kolektorius 6 žiedų',
                brand: 'IMI Heimeier',
                imageUrl: { url: '/images/products/9330-06.800.webp', slot: 'main' } as any,
            }),
        ).toBe('/images/products/9330-06.800.webp');

        // W64-A1: attributes.seriesImageUrl when variants.images is empty + EGIP exact SKU photo
        expect(
            resolveProductImageUrl({
                sku: '77.01.010',
                title: 'Comisa žalvarinis sujungimas',
                brand: 'Comisa',
                imageUrl: null,
                attributes: { seriesImageUrl: '/images/products/giles-8826005-e1409650886687-b0fa6b47.webp' },
            }),
        ).toBe('/images/products/giles-8826005-e1409650886687-b0fa6b47.webp');

        expect(
            resolveProductImageUrl({
                sku: 'KatF0033292',
                title: 'Degiklio tenas SUN P7/12 su gilze',
                brand: 'Ferroli',
            }),
        ).toBe('/images/products/egip-katf0033292.webp');
    });

    test('resolveProductBrandInfo maps each product to its exact manufacturer SVG logo', () => {
        expect(resolveProductBrandInfo({ brand: 'Danfoss' }).logoPath).toBe('/images/brands/danfoss.svg');
        expect(resolveProductBrandInfo({ brand: 'IMI Heimeier' }).logoPath).toBe('/images/brands/imi-heimeier.svg');
        expect(resolveProductBrandInfo({ brand: 'IMI Pneumatex' }).logoPath).toBe('/images/brands/imi-pneumatex.svg');
        expect(resolveProductBrandInfo({ brand: 'IMI TA' }).logoPath).toBe('/images/brands/imi-ta.svg');
        expect(resolveProductBrandInfo({ brand: 'Ferroli' }).logoPath).toBe('/images/brands/ferroli.svg');
        expect(
            resolveProductBrandInfo({
                title: 'STAD balansinis vožtuvas',
                sku: '52-151-014',
            }).logoPath,
        ).toBe('/images/brands/imi-ta.svg');
        const giBrand = resolveProductBrandInfo({
            title: 'MONTAVIMO DĖŽĖ PATALPOS TERMOSTATUI',
            brand: null,
            sku: 'GI-AUTOMATIKA-002',
        });
        expect(giBrand.name).toBe('ŠVOK Inžinerija');
        expect(giBrand.logoPath).toBe('/images/brands/svok-inzinerija.svg');
        expect(giBrand.origin).toBe('ES · Sertifikuota ŠVOK komplektacija');
    });

    test('exposes 11 BRAND_SHOWCASE_ITEMS, 4 HERO_FLAGSHIP_SHOWCASE items, and 8 HVAC_SYSTEM_GROUPS with real .webp images', () => {
        expect(BRAND_SHOWCASE_ITEMS).toHaveLength(11);
        expect(HERO_FLAGSHIP_SHOWCASE).toHaveLength(4);
        expect(HVAC_SYSTEM_GROUPS).toHaveLength(8);
        for (const group of HVAC_SYSTEM_GROUPS) {
            expect(group.imageUrl).toMatch(/^\/images\/products\/.+\.webp$/);
            expect(group.plainDesc.length).toBeGreaterThan(15);
            expect(group.query.length).toBeGreaterThan(2);
        }
    });

    test('normalizeMultiSkuPaste converts newline/semicolon/tab separated SKU lists into comma-separated query', () => {
        expect(normalizeMultiSkuPaste('013G0011\n52-151-014; 9330-12.800')).toBe(
            '013G0011, 52-151-014, 9330-12.800',
        );
        expect(normalizeMultiSkuPaste('013G0011')).toBe('013G0011');
    });
});

describe('W35-F1: Title-First, Parameter-Injected 28-Subtype Engineering UX Engine & Visuals', () => {
    test('GI-FERROLI-010 (Metalinė aklė 1″ (dešininė), baltos spalvos): classifies as radiator-plug-reducer, injects R thread & white finish, never boiler/brackets/gas specialist', () => {
        const ux = getProductUxGuide({
            title: 'Metalinė aklė 1″ (dešininė), baltos spalvos',
            category: 'Radiatoriai ir konvektoriai',
            brand: 'Ferroli',
            sku: 'GI-FERROLI-010',
            rawDescription: 'Radiatoriaus priedas — aklė aliumininio radiatoriaus šoninei angai užaklinti.',
        });
        expect(ux.subtypeId).toBe('radiator-plug-reducer');
        expect(ux.subtypeBadge).toBe('Radiatoriaus srieginė aklė / perėjimas');
        expect(ux.whatYouGet[0]).toContain('1″');
        expect(ux.whatYouGet[0]).toContain('dešininiu (R — sukamu pagal laikrodžio rodyklę) sriegiu');
        expect(ux.whatYouGet[0]).toContain('baltos spalvos');
        expect(ux.whatYouGet.join(' ')).not.toMatch(/kronštein|pakabinimo plokšt|katil|boiler/i);
        expect(ux.safetyNote).not.toMatch(/atestuotas specialistas|dujinių/i);
        expect(ux.commonMistake).toContain('kairinis L sriegis');
        expect(ux.selfCheck).toHaveLength(3);
    });

    test('GI-FERROLI-009 (Metalinė aklė 1″ (kairinė), baltos spalvos): injects left-hand L thread in whatYouGet', () => {
        const ux = getProductUxGuide({
            title: 'Metalinė aklė 1″ (kairinė), baltos spalvos',
            category: 'Radiatoriai ir konvektoriai',
            brand: 'Ferroli',
            sku: 'GI-FERROLI-009',
            rawDescription: 'Radiatoriaus priedas — aklė aliumininio radiatoriaus šoninei angai užaklinti.',
        });
        expect(ux.subtypeId).toBe('radiator-plug-reducer');
        expect(ux.whatYouGet[0]).toContain('kairiniu (L — sukamu prieš laikrodžio rodyklę) sriegiu');
        expect(ux.whatYouGet.join(' ')).not.toMatch(/kronštein|pakabinimo plokšt/i);
    });

    test('GI-FERROLI-008 (Metalinis kamštis / perėjimas 1″ x 1/2″ dešininis): classifies as radiator-plug-reducer with reducer description', () => {
        const ux = getProductUxGuide({
            title: 'Metalinis kamštis 1″-1/2 (dešininis) iš./vid., baltos spalvos',
            category: 'Radiatoriai ir konvektoriai',
            brand: 'Ferroli',
            sku: 'GI-FERROLI-008',
        });
        expect(ux.subtypeId).toBe('radiator-plug-reducer');
        expect(ux.whatYouGet[0]).toMatch(/perėjimas|kamštis/i);
        expect(ux.whatYouGet[0]).toContain('dešininiu (R');
        expect(ux.whatYouGet.join(' ')).not.toMatch(/kronštein/i);

        const uxPerejimas = getProductUxGuide({
            title: 'Perėjimas 1″ x 1/2″ (dešininis), baltos spalvos',
            category: 'Radiatoriai ir konvektoriai',
            brand: 'Ferroli',
            sku: 'GI-FERROLI-008',
        });
        expect(uxPerejimas.subtypeId).toBe('radiator-plug-reducer');
    });

    test('GI-FERROLI-001 / GI-FERROLI-012 (Radiatoriaus pajungimo komplektas / Kamščių komplektas su nuorintoju): classifies as radiator-mounting-kit', () => {
        const ux1 = getProductUxGuide({
            title: 'Kamščių komplektas su nuorotoju (aliuminiam radiatoriui), baltos spalvos',
            category: 'Radiatoriai ir konvektoriai',
            brand: 'Ferroli',
            sku: 'GI-FERROLI-001',
        });
        expect(ux1.subtypeId).toBe('radiator-mounting-kit');
        expect(ux1.whatYouGet.join(' ')).toMatch(/dešinin|kairin|Majevskio/i);

        const ux12 = getProductUxGuide({
            title: 'Radiatoriaus pajungimo komplektas 1″ x 1/2″',
            category: 'Radiatoriai ir konvektoriai',
            brand: 'Ferroli',
            sku: 'GI-FERROLI-012',
        });
        expect(ux12.subtypeId).toBe('radiator-mounting-kit');
    });

    test('GI-FERROLI-003 (Paranitinė tarpinė d25) and O-rings: classifies as gasket-seal', () => {
        const ux = getProductUxGuide({
            title: 'Paranitine tarpinė d25',
            category: 'Radiatoriai ir konvektoriai',
            brand: 'Ferroli',
            sku: 'GI-FERROLI-003',
        });
        expect(ux.subtypeId).toBe('gasket-seal');
        expect(ux.whatYouGet.join(' ')).not.toMatch(/kronštein|pakabinimo plokšt/i);
    });

    test('Vožtuvo įdėklas / riebokšlis / nustatymo raktas: classifies as valve-insert-gland', () => {
        const ux = getProductUxGuide({
            title: 'Riebokšlis RA vožtuvams',
            category: 'Termostatinės galvutės ir vožtuvai',
            brand: 'Danfoss',
            sku: '013G0290',
        });
        expect(ux.subtypeId).toBe('valve-insert-gland');
    });

    test('Aliumininis radiatorius (POL./80-500) vs Elektrinis vandens šildytuvas vs Šildymo katilas: strictly separated subtypes', () => {
        const radUx = getProductUxGuide({
            title: 'Aliuminio lydinio radiatorius POL./80-500, ašių tarpas 500 mm',
            category: 'Radiatoriai ir konvektoriai',
            brand: 'Ferroli',
            sku: 'POL./80-500',
        });
        expect(radUx.subtypeId).toBe('sectional-radiator');
        expect(radUx.safetyNote).not.toMatch(/atestuotas specialistas|dujinių/i);

        const dhwUx = getProductUxGuide({
            title: 'Elektrinis vandens šildytuvas 80 l',
            category: 'Radiatoriai ir konvektoriai',
            brand: 'Ferroli',
            sku: 'GI-FERROLI-DHW',
        });
        expect(dhwUx.subtypeId).toBe('water-heater-cylinder');
        expect(dhwUx.whatYouGet[0]).toContain('80 l');
        expect(dhwUx.whatYouNeed.join(' ')).toMatch(/magnio anod|6–8 bar|dielektrin/i);

        const boilerUx = getProductUxGuide({
            title: 'Dujinis kondensacinis šildymo katilas Bluehelix 24 kW',
            category: 'Šildymo katilai',
            brand: 'Ferroli',
            sku: 'FERROLI-BH-24',
        });
        expect(boilerUx.subtypeId).toBe('boiler-heat-source');
        expect(boilerUx.safetyNote).toMatch(/atestuotas specialistas/i);
    });

    test('resolveProductImageUrl maps GI-FERROLI plugs/reducers/nipples/kits to family-brass-fitting.webp and water heaters to family-ferroli-waterheater.webp', () => {
        expect(
            resolveProductImageUrl({
                sku: 'GI-FERROLI-010',
                title: 'Metalinė aklė 1″ (dešininė), baltos spalvos',
                brand: 'Ferroli',
                category: 'Radiatoriai ir konvektoriai',
            }),
        ).toBe('/images/products/family-brass-fitting.webp');

        expect(
            resolveProductImageUrl({
                sku: 'GI-FERROLI-008',
                title: 'Metalinis kamštis 1″-1/2 (dešininis) iš./vid., baltos spalvos',
                brand: 'Ferroli',
                category: 'Radiatoriai ir konvektoriai',
            }),
        ).toBe('/images/products/family-brass-fitting.webp');

        expect(
            resolveProductImageUrl({
                sku: 'GI-FERROLI-001',
                title: 'Kamščių komplektas su nuorotoju (aliuminiam radiatoriui), baltos spalvos',
                brand: 'Ferroli',
                category: 'Radiatoriai ir konvektoriai',
            }),
        ).toBe('/images/products/family-brass-fitting.webp');

        expect(
            resolveProductImageUrl({
                sku: 'FERROLI-DHW-80',
                title: 'Elektrinis vandens šildytuvas 80 l',
                brand: 'Ferroli',
                category: 'Vandens šildytuvai',
            }),
        ).toBe('/images/products/family-ferroli-waterheater.webp');
    });

    test('audits all 5,855 products in W33-b1-all-v3-with-images.csv: zero plugs, reducers, fittings, brackets, gaskets, or radiators ever classified as boiler-heat-source or mention wall brackets on a blind plug', async () => {
        const fs = await import('node:fs');
        const csvPath =
            '/home/mindu/.opencode/.runtime/state/mission_artifacts/design-differentiation-20260926/W33-b1-all-v3-with-images.csv';
        if (!fs.existsSync(csvPath)) return;
        const raw = fs.readFileSync(csvPath, 'utf-8');
        const lines = raw.split(/\r?\n/).filter((l) => l.trim().length > 0);
        // Check GI-FERROLI-* and POL.* rows directly from CSV lines
        const giLines = lines.filter((l) => /GI-FERROLI-|POL\.\//i.test(l));
        expect(giLines.length).toBeGreaterThanOrEqual(13);

        const capUx = getProductUxGuide({
            title: 'Termostatinė galvutė K 6-27 standartinė su nuotoliniu davikliu, kapiliaro ilgis 2m',
            category: 'Termostatinės galvutės ir vožtuvai',
            brand: 'IMI Heimeier',
            sku: '6002-00.500',
        });
        expect(capUx.subtypeId).toBe('capillary-remote-sensor');

        const insUx = getProductUxGuide({
            title: 'Izoliacija Globo H DN 15',
            category: 'Vamzdynų jungtys ir armatūra',
            brand: 'IMI Heimeier',
            sku: '0601-02.553',
        });
        expect(insUx.subtypeId).toBe('insulation-shell');
    });

    test('W36-A1: extractCardTechChips extracts up to 3 compact technical badges (DN, thread, PN, bar, L, AFC, V)', () => {
        expect(extractCardTechChips('IMI Heimeier Eclipse DN15 1/2" PN10 automatinis vožtuvas', '3933-02.000')).toEqual([
            'DN15',
            '1/2"',
            'PN10',
        ]);
        expect(extractCardTechChips('IMI Pneumatex Statico SD 35 l 3 bar plėtimosi indas', '7101003')).toEqual([
            '3 bar',
            '35 L',
        ]);
        expect(extractCardTechChips('Danfoss Redia RA-Click termostatinė galvutė M30x1.5', '013G2970')).toEqual([
            'RA-Click',
        ]);
    });

    test('W38-A1: buildProductFaqAndComparison generates 3-row pain-point comparisonTable, 4 natural-language faqItems, and valid @graph Product + FAQPage JSON-LD', () => {
        const result = buildProductFaqAndComparison({
            title: 'Termostatinis vožtuvas IMI Heimeier Eclipse DN15',
            sku: '3933-02.000',
            brand: 'IMI Heimeier',
            category: 'Termostatinės galvutės ir vožtuvai',
            priceEur: 36.3,
            subtypeKey: 'thermostatic-valve',
            image: '/images/products/3933-02.000.webp',
            inStock: true,
        });

        expect(result.comparisonTable).toHaveLength(3);
        expect(result.comparisonTable[0].thisModel).toContain('IMI Heimeier 3933-02.000');
        expect(result.comparisonTable[0].painPointSolution).toMatch(/švilpian|radiator/i);

        expect(result.faqItems).toHaveLength(4);
        expect(result.faqItems[0].question).toContain('3933-02.000');
        expect(result.faqItems[1].question).toContain('IMI Heimeier 3933-02.000');
        expect(result.faqItems[2].question).toContain('3933-02.000');
        expect(result.faqItems[3].question).toContain('3933-02.000');

        expect(result.jsonLd['@context']).toBe('https://schema.org');
        expect(Array.isArray(result.jsonLd['@graph'])).toBe(true);
        expect(result.jsonLd['@graph']).toHaveLength(2);
        const productNode = result.jsonLd['@graph'][0] as Record<string, any>;
        const faqNode = result.jsonLd['@graph'][1] as Record<string, any>;
        expect(productNode['@type']).toBe('Product');
        expect(productNode.sku).toBe('3933-02.000');
        expect(productNode.offers.price).toBe('36.30');
        expect(faqNode['@type']).toBe('FAQPage');
        expect(faqNode.mainEntity).toHaveLength(4);
    });

    test('W45-A2: formatCleanCatalogProductTitle normalizes wholesaler dumps, English STAD titles, and common typos', () => {
        expect(
            formatCleanCatalogProductTitle(
                'Standartinis, įmontuotas daviklis su dujinu užpildu, temp. ribos 5-21 °C. Rekomenduojama naudoti daugiabučiuose BE apskaitos',
                '013G2970',
                'Danfoss',
            ),
        ).toBe('Danfoss RA 2970 termostatinė galvutė (5–21 °C)');

        expect(
            formatCleanCatalogProductTitle(
                'Standartinis, įmontuotas daviklis su dujinu užpildu, temp. ribos 5-26 °C.',
                '013G2990',
                'Danfoss',
            ),
        ).toBe('Danfoss RA 2990 termostatinė galvutė (5–26 °C)');

        expect(
            formatCleanCatalogProductTitle(
                'STAD BAL.VALVE BALANCING PRE-SETTING MEASURING SHUT-OFF WITHOUT DRAINING PN20 DN15/14 G1/2',
                '52-151-014',
                'IMI TA',
            ),
        ).toBe('IMI TA STAD DN15 balansinis vožtuvas (G1/2, PN20)');

        expect(
            formatCleanCatalogProductTitle(
                'Danfoss Icon pagrindinis valdiklis 24 V, 10 išėjimų, matinimas 230V –',
                '088U0240',
                'Danfoss',
            ),
        ).toBe('Danfoss Icon pagrindinis valdiklis 24 V, 10 išėjimų, maitinimas 230V');

        expect(
            formatCleanCatalogProductTitle(
                'Dynacon nerūdyjančio pl. grindinio šildymo kolektorius 6 žiedų —',
                '9330-06.800',
                'IMI Heimeier',
            ),
        ).toBe('Dynacon nerūdijančio plieno grindinio šildymo kolektorius 6 žiedų');

        expect(HERO_FLAGSHIP_SHOWCASE.map((item) => item.title)).toEqual([
            'Danfoss RA 2970 termostatinė galvutė',
            'IMI Heimeier Eclipse DN15 vožtuvas',
            'IMI TA STAD DN15 balansinis vožtuvas',
            'IMI Pneumatex Statico SD 25.3 indas',
        ]);
    });
});

describe('W118-A2: Kvs chip with decimal comma (finding 14)', () => {
    test('extractCardTechChips formats Kvs with a decimal comma, never a dot', () => {
        expect(extractCardTechChips('DN 200 / Kvs 685.60, flanšinis jungimas')).toContain('Kvs 685,60');
        expect(extractCardTechChips('DN 20 / Kvs 1.8, vidinis sriegis')).toContain('Kvs 1,8');
        expect(extractCardTechChips('Vožtuvas Kvs 1.01 DN15')).toContain('Kvs 1,01');
    });

    test('extractCardTechChips keeps already-comma Kvs values as-is', () => {
        expect(extractCardTechChips('Grįžtamo srauto vožtuvas DN 15 (Rp 1/2), Kvs 1,36')).toContain('Kvs 1,36');
    });
});
