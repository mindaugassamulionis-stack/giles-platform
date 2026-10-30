import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';
import {
    LITHUANIAN_BOILER_SYSTEM_MODELS,
    doesProductMatchBoilerSystem,
    filterProductsByBoilerCompatibility,
    resolveBoilerCompatibilityPassport,
    resolvePdpEngineeringProfile,
} from './lithuanian-boiler-compatibility';
import { searchCatalogProductsPaged } from './catalog-listing';
import { evaluateCartCompatibilityRecommendations } from '../components/cart-client';

const repoRoot = path.resolve(__dirname, '../..');

describe('W105-A1: 100% Product Description, Subtype & Engineering Compatibility Truth', () => {
    it('1) Defect 1 Fix (Subtype 1A): Danfoss ABN-A5 230V NC actuator with VA41 adapter (082F1152) is classified as an electrothermal actuator, NEVER as an IMI TA AMETAL STAD/STAF balancing valve', () => {
        const abnA5Profile = resolvePdpEngineeringProfile(
            {
                sku: '082F1152',
                name: 'Pavara ABN A5 230V 5mm NC su adapteriu AB-QM (VA41) 082F1152',
                brand: 'Danfoss',
                category: 'Balansiniai ir reguliavimo vožtuvai',
            },
            'lt',
        );

        expect(abnA5Profile.subtypeCode).toBe('1A_actuator');
        expect(abnA5Profile.subtypeTitle).toContain('Elektroterminė');
        expect(abnA5Profile.subtypeTitle).toContain('pavara');
        expect(abnA5Profile.subtypeTitle).not.toContain('Hidraulinis balansinis ir srauto reguliavimo vožtuvas');

        const kitText = abnA5Profile.whatYouGet.join(' | ');
        expect(kitText).toContain('Danfoss ABN-A5');
        expect(kitText).toContain('VA41');
        expect(kitText).toContain('AB-QM');
        expect(kitText).toContain('2×0,75 mm²');
        // Must NEVER contain IMI TA manual balancing valve claims
        expect(kitText).not.toContain('AMETAL');
        expect(kitText).not.toContain('STAD');
        expect(kitText).not.toContain('STAF');
        expect(kitText).not.toContain('TBV-C');
        expect(kitText).not.toContain('Memory stop');

        const needAndCompat = `${abnA5Profile.whatYouNeed.join(' | ')} | ${abnA5Profile.compatibilityNote}`;
        expect(needAndCompat).toContain('Danfoss AB-QM');
        expect(needAndCompat).toContain('DN10–32');
        expect(needAndCompat).toMatch(/RA-Click.*M30×1,5|M30×1,5.*RA-Click/i);

        // Also test IMI Heimeier EMO T M30x1.5 and Danfoss TWA RA actuators
        const emoProfile = resolvePdpEngineeringProfile(
            {
                sku: '1807-00.500',
                name: 'Termoelektrinė pavara EMO T 230V NC M30x1.5',
                brand: 'IMI Heimeier',
                category: 'Katilinės automatika ir pavaros',
            },
            'lt',
        );
        expect(emoProfile.subtypeCode).toBe('1A_actuator');
        expect(emoProfile.whatYouGet.join(' ')).toContain('EMO T');
        expect(emoProfile.whatYouGet.join(' ')).toContain('M30×1,5');

        const twaRaProfile = resolvePdpEngineeringProfile(
            {
                sku: '088H3112',
                name: 'Termoelektrinė pavara Danfoss TWA-A NC 230V RA jungtis',
                brand: 'Danfoss',
                category: 'Katilinės automatika ir pavaros',
            },
            'lt',
        );
        expect(twaRaProfile.subtypeCode).toBe('1A_actuator');
        expect(twaRaProfile.whatYouGet.join(' ')).toContain('Danfoss TWA');
        expect(twaRaProfile.whatYouGet.join(' ')).toContain('RA-Click');

        const pdpPageSrc = fs.readFileSync(
            path.join(repoRoot, 'src/app/[locale]/products/[id]/page.tsx'),
            'utf8',
        );
        expect(pdpPageSrc).toContain('resolvePdpEngineeringProfile');
        expect(pdpPageSrc).toContain('data-testid="pdp-compatibility-note"');
    });

    it('2) Subtypes 1B & 1C: distinguishes PICV automatic balancing valves (Danfoss AB-QM vs IMI TA-Modulator) from manual balancing valves (IMI TA AMETAL STAD/STAF vs Danfoss MSV-BD)', () => {
        const abqmValve = resolvePdpEngineeringProfile(
            {
                sku: '003Z1212',
                name: 'Automatinis balansinis vožtuvas Danfoss AB-QM DN15',
                brand: 'Danfoss',
                category: 'Balansiniai ir reguliavimo vožtuvai',
            },
            'lt',
        );
        expect(abqmValve.subtypeCode).toBe('1B_picv_valve');
        expect(abqmValve.subtypeTitle).toContain('PICV');
        expect(abqmValve.whatYouGet.join(' ')).toContain('0–100 %');
        expect(abqmValve.whatYouGet.join(' ')).not.toContain('AMETAL');
        expect(abqmValve.compatibilityNote).toContain('ABN-A5');
        expect(abqmValve.compatibilityNote).toContain('NovoCon');

        const imiPicv = resolvePdpEngineeringProfile(
            {
                sku: '52-205-015',
                name: 'Vožtuvas TA-Modulator DN15',
                brand: 'IMI TA',
                category: 'Balansiniai ir reguliavimo vožtuvai',
            },
            'lt',
        );
        expect(imiPicv.subtypeCode).toBe('1B_picv_valve');
        expect(imiPicv.compatibilityNote).toContain('TA-Slider');

        const imiStad = resolvePdpEngineeringProfile(
            {
                sku: '52-151-020',
                name: 'Balansinis vožtuvas IMI TA STAD DN20',
                brand: 'IMI TA',
                category: 'Balansiniai ir reguliavimo vožtuvai',
            },
            'lt',
        );
        expect(imiStad.subtypeCode).toBe('1C_manual_balancing_valve');
        expect(imiStad.whatYouGet.join(' ')).toContain('AMETAL');
        expect(imiStad.whatYouGet.join(' ')).toContain('STAD');

        const danfossMsv = resolvePdpEngineeringProfile(
            {
                sku: '003Z4001',
                name: 'Rankinis balansinis vožtuvas Danfoss MSV-BD DN15',
                brand: 'Danfoss',
                category: 'Balansiniai ir reguliavimo vožtuvai',
            },
            'lt',
        );
        expect(danfossMsv.subtypeCode).toBe('1C_manual_balancing_valve');
        expect(danfossMsv.whatYouGet.join(' ')).toContain('Danfoss');
        expect(danfossMsv.whatYouGet.join(' ')).toContain('DZR');
        expect(danfossMsv.whatYouGet.join(' ')).not.toContain('AMETAL');
        expect(danfossMsv.whatYouGet.join(' ')).not.toContain('STAD');
    });

    it('3) Subtypes 1D & 1E: enforces 100% Thread & Brand Truth (Danfoss RA-Click 23 mm vs IMI Heimeier/HERZ M30x1.5; Lateral DN15 vs Bottom VK 50 mm H-block)', () => {
        const danfossRaN = resolvePdpEngineeringProfile(
            {
                sku: '013G0014',
                name: 'Termostatinis vožtuvas Danfoss RA-N 15 tiesus',
                brand: 'Danfoss',
                category: 'Termostatinės galvutės ir vožtuvai',
            },
            'lt',
        );
        expect(danfossRaN.subtypeCode).toBe('1D_thermostatic_valve');
        expect(danfossRaN.compatibilityNote).toContain('Danfoss RA-Click (23 mm)');
        expect(danfossRaN.compatibilityNote).toContain('netinka M30×1,5');

        const heimeierEclipse = resolvePdpEngineeringProfile(
            {
                sku: '3933-02.000',
                name: 'Termostatinis vožtuvas IMI Heimeier Eclipse DN15',
                brand: 'IMI Heimeier',
                category: 'Termostatinės galvutės ir vožtuvai',
            },
            'lt',
        );
        expect(heimeierEclipse.subtypeCode).toBe('1D_thermostatic_valve');
        expect(heimeierEclipse.compatibilityNote).toContain('M30×1,5');
        expect(heimeierEclipse.compatibilityNote).toContain('Heimeier K');

        const heimeierVekolux = resolvePdpEngineeringProfile(
            {
                sku: '0382-02.000',
                name: 'Apatinio pajungimo mazgas IMI Heimeier Vekolux G3/4 kampinis',
                brand: 'IMI Heimeier',
                category: 'Termostatinės galvutės ir vožtuvai',
            },
            'lt',
        );
        expect(heimeierVekolux.subtypeCode).toBe('1D_thermostatic_valve');
        expect(heimeierVekolux.subtypeTitle).toContain('50 mm');
        expect(heimeierVekolux.compatibilityNote).toContain('50 mm');

        const danfossRediaHead = resolvePdpEngineeringProfile(
            {
                sku: '013G2990',
                name: 'Termostatinė galvutė Danfoss Redia RA Click',
                brand: 'Danfoss',
                category: 'Termostatinės galvutės ir vožtuvai',
            },
            'lt',
        );
        expect(danfossRediaHead.subtypeCode).toBe('1E_thermostatic_head');
        expect(danfossRediaHead.compatibilityNote).toContain('Danfoss RA-Click');
        expect(danfossRediaHead.compatibilityNote).toContain('M30×1,5');

        const heimeierKHead = resolvePdpEngineeringProfile(
            {
                sku: '6000-00.500',
                name: 'Termostatinė galvutė IMI Heimeier K M30x1.5',
                brand: 'IMI Heimeier',
                category: 'Termostatinės galvutės ir vožtuvai',
            },
            'lt',
        );
        expect(heimeierKHead.subtypeCode).toBe('1E_thermostatic_head');
        expect(heimeierKHead.compatibilityNote).toContain('M30×1,5');
    });

    it('4) Subtypes 2, 3, 4, 5, 6, 7: strictly distinguishes expansion vessels vs Zeparo separators vs Transfero stations; burners vs boilers vs spare parts; R290 heat pumps vs Split ACs vs electric boilers; ZV buffer tanks (non-enameled heating water) vs enameled DHW boilers; Ferroli POL vs 22K vs 22VK radiators; manifolds vs pipes vs press fittings', () => {
        // Subtype 2: Statico vs Zeparo vs Transfero
        const statico = resolvePdpEngineeringProfile(
            {
                sku: '7101003',
                name: 'Išsiplėtimo indas IMI Pneumatex Statico SD 50.3',
                brand: 'IMI Pneumatex',
                category: 'Plėtimosi indai ir slėgio palaikymas',
            },
            'lt',
        );
        expect(statico.subtypeCode).toBe('2A_expansion_vessel');
        expect(statico.subtypeTitle).toContain('plėtimosi indas');

        const zeparo = resolvePdpEngineeringProfile(
            {
                sku: '7891125',
                name: 'Magnetinis šlamo ir oro atskyriklis IMI Pneumatex Zeparo ZUM 25',
                brand: 'IMI Pneumatex',
                category: 'Oro atskyrikliai ir nuorintuvai',
            },
            'lt',
        );
        expect(zeparo.subtypeCode).toBe('2B_air_dirt_separator');
        expect(zeparo.subtypeTitle).toContain('separatorius');
        expect(zeparo.whatYouGet.join(' ')).not.toContain('butilo membrana');

        const transfero = resolvePdpEngineeringProfile(
            {
                sku: '8111202',
                name: 'Slėgio palaikymo stotelė IMI Pneumatex Transfero TV 4.1',
                brand: 'IMI Pneumatex',
                category: 'Plėtimosi indai ir slėgio palaikymas',
            },
            'lt',
        );
        expect(transfero.subtypeCode).toBe('2C_pressurization_station');

        // Subtype 3: Burner vs Boiler vs Hopper vs Spare part (igniter/grate)
        const mpbBurner = resolvePdpEngineeringProfile(
            {
                sku: 'degkmpl28',
                name: 'Granulių degiklio komplektas Megatherm MPB 28 kW',
                brand: 'Megatherm',
                category: 'Degikliai ir priedai',
            },
            'lt',
        );
        expect(mpbBurner.subtypeCode).toBe('3A_pellet_burner');

        const pelletBoiler = resolvePdpEngineeringProfile(
            {
                sku: 'PELTEC-24',
                name: 'Granulinis katilas Centrometal PelTec 24 kW',
                brand: 'Centrometal',
                category: 'Katilai ir katilinės įranga',
            },
            'lt',
        );
        expect(pelletBoiler.subtypeCode).toBe('3B_solid_pellet_boiler');

        const igniterSpare = resolvePdpEngineeringProfile(
            {
                sku: 'KatGr',
                name: 'Keraminis granulių degiklio uždegimo tenas KatGr 300W',
                brand: 'Gilės Inžinerija',
                category: 'Degikliai ir priedai',
            },
            'lt',
        );
        expect(igniterSpare.subtypeCode).toBe('3D_burner_boiler_spare');
        expect(igniterSpare.whatYouGet.join(' ')).not.toContain('460 L granulių bunkeris');

        // Subtype 4: Air-to-Water vs Air-to-Air Split AC vs Electric Boiler
        const haierR290 = resolvePdpEngineeringProfile(
            {
                sku: 'AW082HVGHA',
                name: 'Šilumos siurblys Oras-Vanduo Haier Super Aqua Monoblokas R290 8 kW',
                brand: 'Haier',
                category: 'Katilai ir katilinės įranga',
            },
            'lt',
        );
        expect(haierR290.subtypeCode).toBe('4A_air_to_water_heat_pump');

        const haierNordicAc = resolvePdpEngineeringProfile(
            {
                sku: 'AS25S2SF1FA-BH',
                name: 'Oro kondicionierius – šilumos siurblys Haier Jade Nordic Split 2.6 kW',
                brand: 'Haier',
                category: 'Katilai ir katilinės įranga',
            },
            'lt',
        );
        expect(haierNordicAc.subtypeCode).toBe('4B_air_to_air_conditioner');
        expect(haierNordicAc.subtypeTitle).toContain('Split Oras–Oras');

        const electricBoiler = resolvePdpEngineeringProfile(
            {
                sku: 'Z015400',
                name: 'Elektrinis šildymo katilas Viessmann Vitotron 100 VMN3 8 kW',
                brand: 'Viessmann',
                category: 'Katilai ir katilinės įranga',
            },
            'lt',
        );
        expect(electricBoiler.subtypeCode).toBe('4C_electric_boiler');

        // Subtype 5: Buffer tank (Gorenje Tiki ZV - technical heating water, NO enamel) vs DHW Boiler (Dražice OKC / Haier HP - enameled with Mg anode for drinking hot water)
        const zvBuffer = resolvePdpEngineeringProfile(
            {
                sku: 'ZV200',
                name: 'Akumuliacinė talpa Gorenje Tiki ZV 200 L',
                brand: 'Gorenje',
                category: 'Akumuliacinės talpos ir boileriai',
            },
            'lt',
        );
        expect(zvBuffer.subtypeCode).toBe('5A_buffer_tank');
        expect(zvBuffer.compatibilityNote).toContain('techniniam');
        expect(zvBuffer.compatibilityNote).toMatch(/be emalės|neemaliuotas/i);
        expect(zvBuffer.whatYouGet.join(' ')).not.toContain('magnio anodas');

        const draziceBoiler = resolvePdpEngineeringProfile(
            {
                sku: 'OKC-160-NTR',
                name: 'Kombinuotas vandens šildytuvas boileris Dražice OKC 160 NTR',
                brand: 'Dražice',
                category: 'Akumuliacinės talpos ir boileriai',
            },
            'lt',
        );
        expect(draziceBoiler.subtypeCode).toBe('5B_dhw_boiler');
        expect(draziceBoiler.whatYouGet.join(' ')).toContain('magnio anod');
        expect(draziceBoiler.compatibilityNote).toContain('geriamam');

        // Subtype 6: Radiators (Ferroli POL G 1" vs Steel 22 K lateral vs Steel 22 VK bottom 50 mm)
        const ferroliPol = resolvePdpEngineeringProfile(
            {
                sku: 'POL./80-500',
                name: 'Aliumininis sekcijinis radiatorius Ferroli POL 500/80',
                brand: 'Ferroli',
                category: 'Radiatoriai ir konvektoriai',
            },
            'lt',
        );
        expect(ferroliPol.subtypeCode).toBe('6A_aluminum_radiator');
        expect(ferroliPol.compatibilityNote).toContain('G 1"');
        expect(ferroliPol.compatibilityNote).toContain('1"×1/2"');

        const rad22K = resolvePdpEngineeringProfile(
            {
                sku: 'GI-RAD-22K-600-1000',
                name: 'Plieninis radiatorius Tipas 22 K 600x1000 šoninis pajungimas',
                brand: 'Gilės Inžinerija',
                category: 'Radiatoriai ir konvektoriai',
            },
            'lt',
        );
        expect(rad22K.subtypeCode).toBe('6B_steel_radiator_k');
        expect(rad22K.whatYouGet.join(' ')).toContain('4×G 1/2"');
        expect(rad22K.whatYouGet.join(' ')).toContain('laikikliai');

        const rad22VK = resolvePdpEngineeringProfile(
            {
                sku: 'GI-RAD-22VK-600-1000',
                name: 'Plieninis radiatorius Tipas 22 VK 600x1000 apatinis pajungimas',
                brand: 'Gilės Inžinerija',
                category: 'Radiatoriai ir konvektoriai',
            },
            'lt',
        );
        expect(rad22VK.subtypeCode).toBe('6C_steel_radiator_vk');
        expect(rad22VK.compatibilityNote).toContain('VK 50 mm');
        expect(rad22VK.compatibilityNote).toContain('H-blok');

        // Subtype 7: Manifold vs Pipe vs Fitting
        const manifold = resolvePdpEngineeringProfile(
            {
                sku: '9680-06.500',
                name: 'Grindinio šildymo kolektorius IMI Heimeier Dynacon Eclipse 6 kontūrų',
                brand: 'IMI Heimeier',
                category: 'Grindinis šildymas ir kolektoriai',
            },
            'lt',
        );
        expect(manifold.subtypeCode).toBe('7A_ufh_manifold');

        const pexPipe = resolvePdpEngineeringProfile(
            {
                sku: 'COM-PEX-16X2',
                name: 'Daugiasluoksnis vamzdis Comisa PEX-AL-PEX 16x2.0 mm',
                brand: 'Comisa',
                category: 'Vamzdynai ir jungtys',
            },
            'lt',
        );
        expect(pexPipe.subtypeCode).toBe('7B_multilayer_pex_pipe');

        const pressFitting = resolvePdpEngineeringProfile(
            {
                sku: 'COM-PRESS-16-12',
                name: 'Presuojama jungtis alkūnė Comisa 16x2.0 - G1/2"',
                brand: 'Comisa',
                category: 'Vamzdynai ir jungtys',
            },
            'lt',
        );
        expect(pressFitting.subtypeCode).toBe('7C_press_threaded_fitting');
    });

    it('5) Renders custom description, kitContents, compatibilityNote, and specs overrides saved on product from Admin/MCP', () => {
        const customProfile = resolvePdpEngineeringProfile(
            {
                sku: '082F1152',
                name: 'Pavara ABN A5 230V 5mm NC su adapteriu AB-QM (VA41) 082F1152',
                brand: 'Danfoss',
                category: 'Balansiniai ir reguliavimo vožtuvai',
                description: 'Individualus inžinieriaus aprašymas: Danfoss ABN-A5 230V NC pavara su VA41 adapteriu.',
                kitContents: [
                    '1x Danfoss ABN-A5 230V NC pavara (082F1152)',
                    '1x VA41 greito fiksavimo žiedas AB-QM vožtuvams',
                    '1x 1,2 m halogenų neturintis kabelis',
                ],
                compatibilityNote: 'Tinka tik Danfoss AB-QM DN10–32 vožtuvams su VA41 kakleliu.',
                specs: [
                    { param: 'Eigos ilgis', value: '5,0 mm' },
                    { param: 'Adapterio tipas', value: 'VA41 (Danfoss AB-QM)' },
                ],
            },
            'lt',
        );

        expect(customProfile.descriptionHook).toContain(
            'Individualus inžinieriaus aprašymas: Danfoss ABN-A5 230V NC pavara su VA41 adapteriu.',
        );
        expect(customProfile.whatYouGet).toEqual([
            '1x Danfoss ABN-A5 230V NC pavara (082F1152)',
            '1x VA41 greito fiksavimo žiedas AB-QM vožtuvams',
            '1x 1,2 m halogenų neturintis kabelis',
        ]);
        expect(customProfile.compatibilityNote).toBe(
            'Tinka tik Danfoss AB-QM DN10–32 vožtuvams su VA41 kakleliu.',
        );
        expect(customProfile.specRows).toEqual(
            expect.arrayContaining([
                { param: 'Eigos ilgis', value: '5,0 mm' },
                { param: 'Adapterio tipas', value: 'VA41 (Danfoss AB-QM)' },
            ]),
        );
    });

    it('6) Strict Negative Exclusion in lithuanian-boiler-compatibility.ts & catalog-listing.ts: Heat pumps exclude pellet burners/grates/augers/igniters; Solid-fuel/pellet boilers exclude split ACs; Gas/electric boilers exclude pellet burners/grates/augers', async () => {
        const syntheticCatalog = [
            {
                sku: 'degkmpl28',
                name: 'Granulių degiklio komplektas Megatherm MPB 28 kW',
                nameLt: 'Granulių degiklio komplektas Megatherm MPB 28 kW',
                brandName: 'Megatherm',
                categoryName: 'Degikliai ir priedai',
            },
            {
                sku: 'KatGr',
                name: 'Keraminis granulių degiklio uždegimo tenas KatGr',
                nameLt: 'Keraminis granulių degiklio uždegimo tenas KatGr',
                brandName: 'Gilės Inžinerija',
                categoryName: 'Degikliai ir priedai',
            },
            {
                sku: 'ARD-VIADRUS',
                name: 'Ketinis katilo ardelis ir granulių šnekas sraigtas',
                nameLt: 'Ketinis katilo ardelis ir granulių šnekas sraigtas',
                brandName: 'Gilės Inžinerija',
                categoryName: 'Katilai ir katilinės įranga',
            },
            {
                sku: 'AS25-NORDIC',
                name: 'Oro kondicionierius split vidinis blokas Haier Jade Oras-Oras',
                nameLt: 'Oro kondicionierius split vidinis blokas Haier Jade Oras-Oras',
                brandName: 'Haier',
                categoryName: 'Katilai ir katilinės įranga',
            },
            {
                sku: 'ZV200',
                name: 'Akumuliacinė talpa Gorenje Tiki ZV 200 L',
                nameLt: 'Akumuliacinė talpa Gorenje Tiki ZV 200 L',
                brandName: 'Gorenje',
                categoryName: 'Akumuliacinės talpos ir boileriai',
            },
            {
                sku: '7891125',
                name: 'Magnetinis purvo separatorius IMI Pneumatex Zeparo ZUM 25 DN25',
                nameLt: 'Magnetinis purvo separatorius IMI Pneumatex Zeparo ZUM 25 DN25',
                brandName: 'IMI Pneumatex',
                categoryName: 'Oro atskyrikliai ir nuorintuvai',
            },
        ];

        // 6a) Every one of the 25 models defines an excludedRegex
        for (const model of LITHUANIAN_BOILER_SYSTEM_MODELS) {
            const passport = resolveBoilerCompatibilityPassport(model.id, 'lt');
            expect(passport?.excludedRegex, `Missing excludedRegex on ${model.id}`).toBeTruthy();
        }

        // 6b) Heat pumps (silumos_siurbliai) NEVER match pellet burners, fire grates, augers, igniters, or wood boilers
        const hpModels = [
            'haier-super-aqua-r290',
            'panasonic-aquarea',
            'daikin-mitsubishi',
            'nibe-ctc-vaillant',
            'gree-midea-samsung',
        ];
        for (const hpId of hpModels) {
            expect(doesProductMatchBoilerSystem(syntheticCatalog[0], hpId).matches).toBe(false);
            expect(doesProductMatchBoilerSystem(syntheticCatalog[1], hpId).matches).toBe(false);
            expect(doesProductMatchBoilerSystem(syntheticCatalog[2], hpId).matches).toBe(false);

            const paged = await searchCatalogProductsPaged({ boiler: hpId, page: 1, pageSize: 200 });
            expect(paged.items.length).toBeGreaterThan(0);
            for (const item of paged.items) {
                const hay = `${item.sku} ${item.name} ${item.nameLt || ''}`;
                expect(hay).not.toMatch(/granulių degikl|degkmpl|\bardel|uždegimo ten|katgr|katm|katf/i);
            }
        }

        // 6c) Solid-fuel & pellet boilers NEVER match split air conditioners
        const solidPelletModels = ['viadrus-u22-u26', 'kalvis-2-serija', 'megatherm-mpb', 'ponast-kp'];
        for (const boilerId of solidPelletModels) {
            expect(doesProductMatchBoilerSystem(syntheticCatalog[3], boilerId).matches).toBe(false);
            const filtered = filterProductsByBoilerCompatibility(syntheticCatalog, boilerId);
            expect(filtered.some((p) => p.sku === 'AS25-NORDIC')).toBe(false);
        }

        // 6d) Gas & electric boilers NEVER match pellet burners, fire grates, augers, or pellet igniters
        const gasElecModels = [
            'viessmann-vitodens-bosch',
            'vaillant-protherm-baxi',
            'haier-es-kospell-elektra',
        ];
        for (const geId of gasElecModels) {
            expect(doesProductMatchBoilerSystem(syntheticCatalog[0], geId).matches).toBe(false);
            expect(doesProductMatchBoilerSystem(syntheticCatalog[1], geId).matches).toBe(false);
            expect(doesProductMatchBoilerSystem(syntheticCatalog[2], geId).matches).toBe(false);
        }
    });

    it('7) Cart Compatibility Guard (cart-client.tsx): pairs Danfoss 013G0014 with RA-Click head 013G2990, IMI Heimeier 3933-02.000/0382-02.000 with M30x1.5 head 6000-00.500, Tipas 22 VK with VK 50 mm valve 0382-02.000, and Tipas 22 K / Ferroli POL with lateral DN15 valve 013G0014 / 3933-02.000', () => {
        // Danfoss valve in cart -> recommends Danfoss RA-Click head (013G2990)
        const danfossValveRecs = evaluateCartCompatibilityRecommendations([
            { sku: '013G0014', name: 'Termostatinis vožtuvas Danfoss RA-N 15' },
        ]);
        expect(danfossValveRecs.map((r) => r.sku)).toContain('013G2990');
        expect(danfossValveRecs.map((r) => r.sku)).not.toContain('6000-00.500');

        // IMI Heimeier lateral valve in cart -> recommends IMI Heimeier M30x1.5 head (6000-00.500)
        const heimeierLateralValveRecs = evaluateCartCompatibilityRecommendations([
            { sku: '3933-02.000', name: 'Termostatinis vožtuvas IMI Heimeier Eclipse DN15' },
        ]);
        expect(heimeierLateralValveRecs.map((r) => r.sku)).toContain('6000-00.500');
        expect(heimeierLateralValveRecs.map((r) => r.sku)).not.toContain('013G2990');

        // IMI Heimeier bottom valve in cart -> recommends IMI Heimeier M30x1.5 head (6000-00.500)
        const heimeierBottomValveRecs = evaluateCartCompatibilityRecommendations([
            { sku: '0382-02.000', name: 'Apatinio pajungimo mazgas IMI Heimeier Vekolux' },
        ]);
        expect(heimeierBottomValveRecs.map((r) => r.sku)).toContain('6000-00.500');

        // Tipas 22 VK bottom-connection radiator in cart -> recommends VK 50 mm bottom valve (0382-02.000)
        const rad22VkRecs = evaluateCartCompatibilityRecommendations([
            {
                sku: 'GI-RAD-22VK-600-1000',
                name: 'Plieninis radiatorius Tipas 22 VK 600x1000 apatinis pajungimas',
            },
        ]);
        expect(rad22VkRecs.map((r) => r.sku)).toContain('0382-02.000');
        expect(rad22VkRecs.map((r) => r.sku)).not.toContain('013G0014');

        // Tipas 22 K lateral radiator in cart -> recommends lateral DN15 valve (013G0014 / 3933-02.000)
        const rad22KRecs = evaluateCartCompatibilityRecommendations([
            {
                sku: 'GI-RAD-22K-600-1000',
                name: 'Plieninis radiatorius Tipas 22 K 600x1000 šoninis pajungimas',
            },
        ]);
        expect(rad22KRecs.map((r) => r.sku)).toContain('013G0014');
        const lateralRecText = JSON.stringify(rad22KRecs);
        expect(lateralRecText).toContain('3933-02.000');

        // Ferroli POL aluminum radiator in cart -> recommends lateral DN15 valve (013G0014 / 3933-02.000) AND mounting kit (GI-FERROLI-001)
        const ferroliPolRecs = evaluateCartCompatibilityRecommendations([
            {
                sku: 'POL./80-500',
                name: 'Aliumininis radiatorius Ferroli POL 500/80',
            },
        ]);
        expect(ferroliPolRecs.map((r) => r.sku)).toContain('013G0014');
        expect(ferroliPolRecs.map((r) => r.sku)).toContain('GI-FERROLI-001');
    });
});
