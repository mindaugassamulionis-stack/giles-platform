// W126-A1: skaiciuokle-v2 priėmimo vektoriai (28) – perkelti iš paketo
// /home/mindu/Downloads/skaiciuokle-v2-paketas/qa/heat-calc.test.ts (ten 28/28 PASSED per tsx).
// Vektoriai niekada nekeičiami kartu su implementacija – jie fiksuoja klientui matomus skaičius.
import { describe, expect, it } from 'vitest';
import heatConfigJson from '../data/heat/heat-config.lt.json';
import devicesJson from '../data/heat/devices.lt.json';
import leaJson from '../data/heat/lea-2026.lt.json';
import { heatDemand, compare, type HeatInput } from './heat/heat-calc';
import { leaGrant, leaEligibility, bandTip, type LeaData } from './heat/lea';
import {
    expansionVessel,
    bufferTank,
    flow,
    kvValue,
    ufhLoops,
    expansionCoeff,
} from './heat/hydraulics';
import { toQuery, fromQuery } from './heat/lead';
import { calculateApvaSubsidyEstimate } from '../components/apva-subsidy-widget';
import { getGilesCatalogProducts } from './giles-catalog-snapshot';
import catalogPricesJson from '../data/heat/catalog-prices.lt.json';
import kitsJson from '../data/inzinerija-v2/kits.lt.json';
import { computeBoilerConversionBundle } from './giles-masterpiece-data';
import fs from 'node:fs';
import path from 'node:path';
import namuiContentJson from '../data/heat/skaiciuokle-content.lt.json';
import { LT_MARKET_STANDARDS_CHUNKS } from './vytautas-lt-market-rag';

/* eslint-disable @typescript-eslint/no-explicit-any */
const cfg: any = heatConfigJson;
const dev: any = devicesJson;
const lea = leaJson as unknown as LeaData;

describe('W126-A1 vektoriai 1–10: LEA kompensacija (oficialūs įkainiai)', () => {
    it('1. LEA oficialus pavyzdys: 20 kW biokuro katilas = 1 662 €', () => {
        expect(leaGrant(lea, 'bio', 20)).toBe(1662);
    });
    it('2. LEA ŠS oras–vanduo 8 kW = 2 365,52 € (ne 415×8×0,65 = 2 269 €)', () => {
        expect(leaGrant(lea, 'hp_aw', 8)).toBe(2365.52);
    });
    it('3. LEA ŠS 7 kW gauna daugiau nei 8 kW (juostos šuolis)', () => {
        expect(leaGrant(lea, 'hp_aw', 7)).toBeGreaterThan(leaGrant(lea, 'hp_aw', 8));
    });
    it('4. LEA biokuras 15 kW > 16 kW', () => {
        expect(leaGrant(lea, 'bio', 15)).toBeGreaterThan(leaGrant(lea, 'bio', 16));
    });
    it('5. LEA oras–oras 5 kW = 790,25 €', () => {
        expect(leaGrant(lea, 'hp_aa', 5)).toBe(790.25);
    });
    it('6. LEA: elektrinis šildymas netinka', () => {
        expect(
            leaEligibility(lea, {
                building: 'house',
                oldSystem: 'not-eligible',
                inBigCityDhZone: false,
                type: 'hp_aw',
            }).eligible,
        ).toBe(false);
    });
    it('7. LEA: biokuras CŠT zonoje netinka', () => {
        expect(
            leaEligibility(lea, {
                building: 'house',
                oldSystem: 'inefficient',
                inBigCityDhZone: true,
                type: 'bio',
            }).eligible,
        ).toBe(false);
    });
    it('8. LEA: krosnis → oras–oras tinka name', () => {
        expect(
            leaEligibility(lea, {
                building: 'house',
                oldSystem: 'air-heating',
                inBigCityDhZone: false,
                type: 'hp_aa',
            }).eligible,
        ).toBe(true);
    });
    it('9. LEA: butas – biokuras netinka', () => {
        expect(
            leaEligibility(lea, {
                building: 'apartment',
                oldSystem: 'inefficient',
                inBigCityDhZone: false,
                type: 'bio',
            }).eligible,
        ).toBe(false);
    });
    it('10. LEA patarimas: reikia 6,5 kW, parinktas 8 kW → 7 kW gautų daugiau', () => {
        const tip = bandTip(lea, 'hp_aw', 6.5, 8, [6, 7, 8, 10]);
        expect(tip?.kw).toBe(7);
    });
});

describe('W126-A1 vektoriai 11–28', () => {
    it('11. LEA patarimas nesiūlo per mažo įrenginio', () => {
        expect(bandTip(lea, 'hp_aw', 7.5, 8, [6, 7, 8, 10])).toBeNull();
    });

    it('12. 180 m², renovuotas (C), 2,7 m, 3 žm. → 13,9 kW, 14,6 kW su karštu vandeniu, 22,2 MWh', () => {
        const d = heatDemand(cfg, { area_m2: 180, building_class: 'c', current: 'wood' } as HeatInput);
        expect([d.design_kw, d.hp_kw, d.annual_mwh]).toEqual([13.9, 14.6, 22.2]);
    });
    it('13. 120 m², A++ → 4,0 kW', () => {
        expect(
            heatDemand(cfg, { area_m2: 120, building_class: 'app', current: 'none' } as HeatInput).design_kw,
        ).toBe(4);
    });
    it('14. Lubos 3,2 m didina galią proporcingai', () => {
        expect(
            heatDemand(cfg, {
                area_m2: 100,
                building_class: 'old',
                current: 'wood',
                ceiling_m: 3.24,
            } as HeatInput).design_kw,
        ).toBe(13.2);
    });
    it('15. > 400 m² – B2B žyma', () => {
        expect(
            heatDemand(cfg, { area_m2: 450, building_class: 'c', current: 'gas' } as HeatInput).b2b,
        ).toBe(true);
    });

    it('16. Malkos → ŠS: sąžiningas sutaupymas ir parama', () => {
        const r = compare(cfg, dev, lea, {
            area_m2: 180,
            building_class: 'c',
            current: 'wood',
            emitters: 'mixed',
        } as HeatInput);
        expect(r.current_cost).toBe(1540); // 22,2 / 0,6 × 40 + 60
        const hp = r.options.find((o) => o.id === 'hp_aw')!;
        expect(hp.device?.kw).toBe(16); // 14,6 kW → 16 kW modelis
        expect(hp.grant).toBe(Math.round(473.14 * 16 * 0.5));
        expect(hp.annual_cost).toBe(1456); // 22,2 / 3,9 × 240 + 90
        const pb = r.options.find((o) => o.id === 'pellet_boiler')!;
        expect(pb.saving_year!).toBeLessThan(0); // granulės brangesnės už malkas
        expect(pb.payback_years).toBeNull();
        expect(r.options.find((o) => o.id === 'conversion')!.available).toBe(true);
    });
    it('17. Dujos → perdarymas negalimas', () => {
        const r = compare(cfg, dev, lea, { area_m2: 150, building_class: 'b', current: 'gas' } as HeatInput);
        expect(r.options.find((o) => o.id === 'conversion')!.available).toBe(false);
    });
    it('18. Elektra → ŠS: didelis sutaupymas, LEA netaikoma', () => {
        const r = compare(cfg, dev, lea, {
            area_m2: 150,
            building_class: 'b',
            current: 'electric',
            emitters: 'ufh',
        } as HeatInput);
        const hp = r.options.find((o) => o.id === 'hp_aw')!;
        expect(hp.grant).toBe(0);
        expect(hp.grant_eligible).toBe(false);
        expect(hp.saving_year!).toBeGreaterThan(2000);
    });
    it('19. Mano kainos keičia rezultatą', () => {
        const a = compare(cfg, dev, lea, { area_m2: 180, building_class: 'c', current: 'gas' } as HeatInput);
        const b = compare(cfg, dev, lea, {
            area_m2: 180,
            building_class: 'c',
            current: 'gas',
            prices: { fuel_now_eur_mwh: 95 },
        } as HeatInput);
        expect(b.current_cost!).toBeGreaterThan(a.current_cost!);
    });

    it('20. Plėtimosi koef. 80 °C ≈ 0,0287', () => {
        expect(Math.abs(expansionCoeff(80) - 0.0287)).toBeLessThan(0.0005);
    });
    it('21. Išsiplėtimo indas EN 12828: 970 l, 80 °C, 8 m, 3 bar → ~76 l → 80 l', () => {
        const v = expansionVessel({ system_l: 970, t_max_c: 80, static_h_m: 8, psv_bar: 3 });
        expect(v.Vn).toBeGreaterThan(74);
        expect(v.Vn).toBeLessThan(79);
        expect(v.size_l).toBe(80);
        expect(v.p0).toBe(1);
    });
    it('22. Talpa: rankinis 25 kW, QH 13,9 → EN 303-5 1 250 l', () => {
        const b = bufferTank({ source: 'manual_solid', qn_kw: 25, qh_kw: 13.9 });
        expect(b.V).toBe(1250);
        expect(b.mandatory).toBe(true);
    });
    it('23. Talpa: granulės 35 kW → 700 l rekomendacija, neprivaloma', () => {
        const b = bufferTank({ source: 'pellet', qn_kw: 35, qh_kw: 13.9 });
        expect(b.V).toBe(700);
        expect(b.mandatory).toBe(false);
    });
    it('24. Srautas 12,4 kW ΔT15 = 711 l/h', () => {
        expect(flow(12.4, 15).G_lh).toBe(711);
    });
    it('25. Kv 0,71 m³/h @ 0,1 bar = 2,25 → DN20', () => {
        const k = kvValue(0.71);
        expect(k.Kv).toBe(2.25);
        expect(k.dn).toBe('DN20');
    });
    it('26. Grindinis 90 m², 15 cm, pievadas 6 m → 7 kont. ≤ 100 m', () => {
        const u = ufhLoops({ area_m2: 90, spacing_m: 0.15, leader_m: 6 });
        expect(u.loops).toBe(7);
        expect(u.loop_m).toBeLessThanOrEqual(100);
    });

    it('27. URL: į ir iš parametrų – tas pats įvesties rinkinys', () => {
        const i = {
            area_m2: 140,
            building_class: 'b',
            current: 'gas',
            emitters: 'ufh',
            people: 4,
            ceiling_m: 2.7,
            big_city_dh_zone: false,
        } as HeatInput;
        const q = toQuery(i, cfg);
        expect(q).toMatch(/dabar=dujos/);
        expect(fromQuery(new URLSearchParams(q), cfg)).toEqual(i);
    });
    it('28. URL: šiukšlės → numatytosios reikšmės', () => {
        const r = fromQuery(new URLSearchParams('plotas=99999&bukle=x&dabar=<script>'), cfg);
        expect([r.area_m2, r.building_class, r.current]).toEqual([160, 'c', 'wood']);
    });
});

describe('W126-A1 S1: ta pati SKU kaina visuose puslapiuose', () => {
    it('catalog-prices.lt.json atitinka gyvą 13 531 SKU katalogą', () => {
        const live = new Map<string, number | null>();
        for (const p of getGilesCatalogProducts()) {
            const sku = (p.sku ?? '').toUpperCase();
            if (!live.has(sku)) live.set(sku, p.priceEur ?? null);
        }
        for (const [sku, meta] of Object.entries((catalogPricesJson as any).prices)) {
            expect(live.has(sku), sku).toBe(true);
            expect((meta as any).price, sku).toBe(live.get(sku) ?? null);
        }
    });
    it('MPB-NANI-35 = 1 294,70 € (katalogas), ne 2 350 / 1 590', () => {
        expect((catalogPricesJson as any).prices['MPB-NANI-35'].price).toBe(1294.7);
    });
    it('„Link lyderių“ komplektas (kits.lt.json) = katalogo DEGKMPL140MG20 kainai', () => {
        const kit = kitsJson.kits.find((k) => k.code === 'GILES-LINK-LYDERIU-35')!;
        expect(kit.price_eur_incl_vat).toBe((catalogPricesJson as any).prices['DEGKMPL140MG20'].price);
    });
    it('Vytauto RAG kopija cituoja DEGKMPL140MG20 su katalogo kaina', () => {
        const all = LT_MARKET_STANDARDS_CHUNKS.map((c) => JSON.stringify(c)).join('\n');
        expect(all).toContain('degkmpl140mg20');
        expect(all).not.toContain('degkmpl140mg20", 2150,00');
    });
    it('masterpiece komplekto degiklis MPB-NANI-35 kainuoja kaip kataloge (1294,70)', () => {
        const bundle = computeBoilerConversionBundle({
            boilerModelId: 'viadrus-u22',
            areaM2: 160,
            powerKw: 12,
            hopperId: 'hopper_350',
            wifiModule: false,
            includeInstallation: true,
        });
        expect(bundle.burnerSku).toBe('MPB-NANI-35');
        const burner = bundle.items.find((i) => i.sku === 'MPB-NANI-35')!;
        expect(burner.grossEur).toBe(1294.7);
    });
});

describe('W126-A1 B3: LEA widget inkariniai taškai', () => {
    it('ŠS oras–vanduo 8 kW @ 3 430 € → 2 365,52 € kompensacija', () => {
        const r = calculateApvaSubsidyEstimate({
            replacedBoilerType: 'fossil_coal_wood',
            newDeviceType: 'heat_pump_air_water',
            powerKw: 8,
            devicePriceEur: 3430,
        });
        expect(r.estimatedGrantEur).toBeCloseTo(2365.52, 2);
        expect(r.fixedRatePerKwEur).toBeCloseTo(591.38, 2);
        expect(r.subsidySharePercent).toBeLessThanOrEqual(50);
    });
    it('biokuro katilas 20 kW @ 2 850 € → 1 662,00 € (LEA oficialus pavyzdys)', () => {
        const r = calculateApvaSubsidyEstimate({
            replacedBoilerType: 'old_biomass',
            newDeviceType: 'ecodesign_pellet_boiler',
            powerKw: 20,
            devicePriceEur: 2850,
        });
        expect(r.estimatedGrantEur).toBeCloseTo(1662, 2);
        expect(r.fixedRatePerKwEur).toBeCloseTo(166.2, 2);
    });
    it('juostos šuolis: 7 kW siurblys gauna daugiau nei 8 kW', () => {
        const g7 = calculateApvaSubsidyEstimate({
            replacedBoilerType: 'fossil_coal_wood',
            newDeviceType: 'heat_pump_air_water',
            powerKw: 6,
            devicePriceEur: 3430,
        });
        // 6 kW dar ne 7 – patikriname juostos logiką per leaGrant
        expect(leaGrant(lea, 'hp_aw', 7)).toBeGreaterThan(leaGrant(lea, 'hp_aw', 8));
        expect(g7.estimatedGrantEur).toBeGreaterThan(0);
    });
});

describe('W126-A1 S7/S4: puslapio turinys ir draudžiami teiginiai', () => {
    const repoRoot = path.resolve(__dirname, '../..');
    const read = (rel: string) => fs.readFileSync(path.join(repoRoot, rel), 'utf8');

    it('FAQ skaičiai atitinka branduolį (faq atitinka branduolį)', () => {
        const faq = (namuiContentJson as any).faq as { q: string; a: string }[];
        const leaAnswer = faq.find((f) => f.q.includes('LEA kompensacija'))!.a;
        expect(leaAnswer).toContain('2 365'); // = floor(leaGrant(lea,'hp_aw',8)) = 2365
        expect(leaAnswer).toContain('1 662'); // = leaGrant(lea,'bio',20) = 1662
        expect(Math.floor(leaGrant(lea, 'hp_aw', 8))).toBe(2365);
        expect(leaGrant(lea, 'bio', 20)).toBe(1662);
    });

    it('Draudžiama APIENA: /lt/skaiciuokle šaltiniuose nėra banned sąrašo frazių', () => {
        const banned = (namuiContentJson as any).lea.banned as string[];
        const sources = [
            'src/components/skaiciuokle-namui.tsx',
            'src/components/apva-subsidy-widget.tsx',
            'src/app/[locale]/skaiciuokle/page.tsx',
            'src/data/heat/skaiciuokle-content.lt.json',
        ].map(read);
        // pats banned sąrašas yra data faile – jį išmeta
        const dataIdx = 3;
        for (let i = 0; i < sources.length; i++) {
            if (i === dataIdx) continue;
            for (const phrase of banned) {
                expect(sources[i], `${sources[i]} turi „${phrase}“`).not.toContain(phrase);
            }
        }
        // 'pagal EN 12831 standartą' draudžiama ir pro puslapyje
        const hub = read('src/components/scientific-calculators-hub.tsx');
        expect(hub).not.toContain('pagal EN 12831 standartą');
        expect(hub).not.toContain('DARBASTALIS');
        expect(hub).not.toContain('STR 2.09.02');
    });

    it('pro puslapis /skaiciuokle/hidraulinis-mazgas egzistuoja ir montuoja darbastalį', () => {
        const proPage = read('src/app/[locale]/skaiciuokle/hidraulinis-mazgas/page.tsx');
        expect(proPage).toContain('GilesCadCalculatorsWorkbench');
        expect(proPage).toContain("canonical: `${BASE}/${locale}/skaiciuokle/hidraulinis-mazgas`");
    });

    it('Namui puslapis: SSR rezultatas, sekcijos id, data-testid', () => {
        const page = read('src/app/[locale]/skaiciuokle/page.tsx');
        const comp = read('src/components/skaiciuokle-namui.tsx');
        expect(page).toContain('SkaiciuokleNamui');
        expect(page).toContain('FAQPage');
        expect(page).toContain('canonical');
        for (const sectionId of ['skaiciuokle', 'sprendimai', 'parama', 'uzklausa', 'prielaidos']) {
            expect(comp).toContain(`id="${sectionId}"`);
        }
        for (const tid of ['result-power', 'result-hp-power', 'result-annual', 'result-current-cost', 'option-card', 'option-best', 'lea-block', 'lea-check']) {
            expect(comp).toContain(`data-testid="${tid}"`);
        }
    });

    it('B13: darbastalio PVM perjungiklis – tik globalus useVatDisplayStore', () => {
        const hub = read('src/components/scientific-calculators-hub.tsx');
        expect(hub).toContain("from '../store/vat-display'");
        // nėra vietinio VAT state kintamojo
        expect(hub).not.toMatch(/const \[[a-zA-Z]*[Vv]at[a-zA-Z]*, set/);
    });
});
