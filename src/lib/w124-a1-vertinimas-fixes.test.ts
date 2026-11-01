// W124-A1: savininko vertinimo 2026-11-1 priėmimo testai (lib dalis).
// QA spec'ai (qa/vedlys.spec.ts, qa/regresija.spec.ts) – e2e; čia jų logikos branduolys.
import { describe, it, expect } from 'vitest';
import rulesJson from '../data/vedlys-rules.lt.json';
import componentsJson from '../data/vedlys-components.lt.json';
import kitsJson from '../data/inzinerija-v2/kits.lt.json';
import contentLt from '../data/inzinerija-v2/inzinerija-content.lt.json';
import modelsJson from '../data/pramonei-v2/industrial-models.lt.json';
import {
    resolveBoiler,
    designKw,
    pickBurner,
    buildKit,
    seasonCost,
    autonomyDays,
    type Rules,
} from './vedlys-calc';
import { getVedlysWizardCatalog } from './vedlys-catalog';
import { fmtEurKit, netFromGrossLines, kitCodeToWizardConfig, boilerSlugForBurner } from './vedlys-wizard';
import { validateServiceRequest } from './inzinerija-v2/service-request';
import { buildSeoGeoKnowledgeGraph } from './seo-geo-authority';
import { calculateBoilerRentalDeal } from './instant-deal-config';
import { DEAL_COPY } from '../components/instant-deal-drawer';

const rules = rulesJson as unknown as Rules;

describe('F2: vedlys-calc (savininko referencinė logika)', () => {
    it('180 m² senas namas → 20 kW', () => {
        expect(designKw(rules, 180, 'senas')).toBe(20);
    });

    it('aliasai iš ?boiler= resolveinami', () => {
        for (const [alias, slug] of [
            ['viadrus-u22', 'viadrus'],
            ['kalvis', 'kalvis'],
            ['atmos', 'atmos'],
            ['buderus-s111', 'buderus-dakon'],
            ['stropuva', 'stropuva'],
            ['pramoniniai', 'pramoniniai'],
        ] as const) {
            expect(resolveBoiler(rules, alias)?.slug).toBe(slug);
        }
    });

    it('Kalvis + 1500 m² → per mažas katilas (ne laisvas krepšelio mygtukas)', () => {
        const kw = designKw(rules, 1500, 'senas');
        const pick = pickBurner(rules, 'kalvis', kw, new Set(['MPB-NANI-35']));
        expect(pick.ok).toBe(false);
        if (!pick.ok) expect(pick.reason).toBe('boiler-too-small');
    });

    it('pramoninis katilas → rfq-only su redirect į pramonei', () => {
        const pick = pickBurner(rules, 'pramoniniai', 120);
        expect(pick.ok).toBe(false);
        if (!pick.ok) {
            expect(pick.reason).toBe('rfq-only');
            expect(pick.redirect).toContain('pramonei');
        }
    });

    it('180 m² Viadrus → MPB NANI 35 (8–35 kW katalogo diapazonas)', () => {
        const pick = pickBurner(rules, 'viadrus', 20, new Set(['MPB-NANI-35', 'MPB-NANI-50']));
        expect(pick.ok).toBe(true);
        if (pick.ok) expect(pick.burner.sku).toBe('MPB-NANI-35');
    });

    it('autonomija skaičiuojama, ne fiksuota „6–10 d.“', () => {
        const a = autonomyDays(rules, 350, 180, 'senas');
        expect(a.avg).toBeGreaterThan(0);
        expect(a.cold).toBeGreaterThan(0);
        expect(a.cold).toBeLessThanOrEqual(a.avg);
    });

    it('sąžiningas sutaupymas: malkų kaina gali būti didesnė už granules (neigiamas saving)', () => {
        const sc = seasonCost(rules, 180, 'senas', 'malkos', 2279);
        expect(sc.before).toBeGreaterThan(0);
        expect(sc.after).toBeGreaterThan(0);
        expect(typeof sc.saving).toBe('number');
        expect(sc.paybackYears === null || sc.paybackYears > 0).toBe(true);
    });
});

describe('F1.1: vedlio kainos tik iš katalogo', () => {
    const catalog = getVedlysWizardCatalog();

    it('MPB-NANI-35 kaina iš gyvo katalogo (1 294,70 €), ne iš kodo', () => {
        expect(catalog.prices['MPB-NANI-35']).toBe(1294.7);
        expect(catalog.lines['MPB-NANI-35']?.priceSource).toBe('catalog');
    });

    it('visos bunkerių apimtys – atskiri SKU su kaina (200/350/500/1000)', () => {
        for (const l of [200, 350, 500, 1000]) {
            expect(catalog.prices[`GI-BNK-${l}`], `GI-BNK-${l}`).toBeGreaterThan(0);
        }
        expect(catalog.prices['GI-BNK-800']).toBeUndefined();
    });

    it('kataloge neturintys komponentai žymimi prielaida/pagal svetainę', () => {
        expect(catalog.assumptions.length).toBeGreaterThan(0);
        for (const c of componentsJson.components) {
            if (c.price_source === 'assumption') expect(catalog.assumptions).toContain(c.sku);
        }
    });

    it('NANI 35 komplekte nėra dvigubo įkainio: be GI-AUGER ir GI-CTRL (jau su sraigtu ir valdikliu)', () => {
        const kit = buildKit(rules, {
            boiler: 'viadrus',
            area_m2: 180,
            building: 'senas',
            fuel_now: 'malkos',
            bunker_l: 350,
            wifi: true,
            install: true,
        }, catalog.prices);
        expect(kit.ok).toBe(true);
        if (!kit.ok) return;
        const skus = kit.lines.map((l) => l.sku);
        expect(skus).toContain('MPB-NANI-35');
        expect(skus).not.toContain('GI-AUGER-2000');
        expect(skus).not.toContain('GI-CTRL-TOUCH');
        // NANI 35 nesivalo pats → valymo sistema būtina, jei rašome „savaime išsivalantis“
        expect(skus).toContain('AUTOMATIC-CLEANING-SYSTEM-NANI-35');
        expect(skus).toContain('FL-VIA-U22');
        expect(skus).toContain('GI-BNK-350');
        expect(skus).toContain('GI-SAFE-STB95');
        expect(skus).toContain('GI-WIFI-NET');
        expect(skus).toContain('GI-SERV-INSTALL');
        const sum = Math.round(kit.lines.reduce((s, l) => s + l.price * l.qty, 0) * 100) / 100;
        expect(kit.total).toBe(sum);
    });
});

describe('F0.5/F1.2: komplektų kodai → vedlio konfigūracija', () => {
    it('visi konversijos komplektai iš kits.lt.json turi ?kit= žemėlapį', () => {
        const catalog = getVedlysWizardCatalog();
        const conversionKits = kitsJson.kits.filter((k) => k.code !== 'PONAST-KP08-SET');
        expect(conversionKits.length).toBe(3);
        for (const k of conversionKits) {
            const cfg = kitCodeToWizardConfig(k.code);
            expect(cfg, k.code).not.toBeNull();
            if (cfg) {
                // Megatherm komplektai – su katalogo kaina; Pelltech (PV20a) – RFQ kelias,
                // nes kataloge SKU dar nėra (assumption → „Pagal užklausą“).
                expect(resolveBoiler(rules, cfg.boilerSlug)?.burners).toContain(cfg.burnerSku);
                if (k.code !== 'GILES-NORD-KOMFORTUI-20') {
                    expect(catalog.prices[cfg.burnerSku], `${k.code} → ${cfg.burnerSku}`).toBeDefined();
                } else {
                    expect(catalog.prices['PELLTECH-PV20A']).toBeUndefined();
                }
            }
        }
    });

    it('nekonversijos komplektas (PONAST) negrąžina konfigūracijos', () => {
        expect(kitCodeToWizardConfig('PONAST-KP08-SET')).toBeNull();
    });

    it('boilerSlugForBurner parenka pirma suderinamą katilą', () => {
        expect(boilerSlugForBurner(rules, 'PELLTECH-PV20A')).toBe('viadrus');
        expect(boilerSlugForBurner(rules, 'MPB-NANI-50')).toBe('viadrus');
    });
});

describe('F3.3: PVM nuo neto eilutėmis', () => {
    it('neto suma pagal eilutes ≠ suapvalintos sumos / 1.21', () => {
        const lines = [
            { price: 100.0, quantity: 1 },
            { price: 100.0, quantity: 1 },
            { price: 100.0, quantity: 1 },
        ];
        const perLine = netFromGrossLines(lines);
        const naive = Math.round((lines.reduce((s, l) => s + l.price, 0) / 1.21) * 100) / 100;
        expect(perLine).toBe(247.92); // 3 × 82,64
        expect(naive).toBe(247.93); // 300 / 1,21
        expect(perLine).not.toBe(naive);
    });

    it('formatavimas: tūkstančių skyriklis, be centų sveikai sumai', () => {
        expect(fmtEurKit(3025)).toBe('3\u00A0025 €');
        expect(fmtEurKit(1294.7)).toBe('1\u00A0294,70 €');
        expect(fmtEurKit(2150)).not.toMatch(/,\d{2}/);
    });
});

describe('F0.1/F3.6: service-request priima conversion ir quote', () => {
    it('conversion: tuščias vardas leidžiamas, telefonas privalomas', () => {
        const errors = validateServiceRequest({
            urgency: 'plan',
            type: 'conversion',
            name: '',
            phone: '+370 600 00000',
            city: 'Kaunas',
            source_page: 'vedlys',
        });
        expect(Object.keys(errors)).toHaveLength(0);
    });

    it('conversion: neteisingas telefonas → aiški klaida', () => {
        const errors = validateServiceRequest({
            urgency: 'plan',
            type: 'conversion',
            name: '',
            phone: 'abc',
            source_page: 'vedlys',
        });
        expect(errors.phone).toContain('Įveskite telefono numerį');
    });

    it('quote: vardas ir telefonas privalomi', () => {
        const errors = validateServiceRequest({
            urgency: 'plan',
            type: 'quote',
            name: 'A',
            phone: '+370 600 00000',
            source_page: 'inzinerija',
        });
        expect(errors.name).toBeTruthy();
        expect(errors.phone).toBeUndefined();
    });
});

describe('F3.5: patikimumo juostos žodžiai', () => {
    it('skaičius apibūdina katalogą, ne sandėlio likutį', () => {
        const trust = contentLt.trust;
        const countItem = trust.find((t) => t.value === '{count} prekės');
        expect(countItem?.label).toMatch(/kataloge/);
        expect(countItem?.label).not.toMatch(/sandėliuose/);
    });
});

describe('F4.4: globalus JSON-LD graph – tik Organization + WebSite', () => {
    it('be SoftwareApplication / Service / HowTo / FAQPage / BreadcrumbList globaliai', () => {
        for (const locale of ['lt', 'en'] as const) {
            const graph = buildSeoGeoKnowledgeGraph(locale)['@graph'] as Array<Record<string, unknown>>;
            const typeStrings = graph.map((n) => JSON.stringify(n['@type']));
            const all = typeStrings.join(',');
            expect(graph.some((n) => n['@type'] === 'WebSite')).toBe(true);
            expect(all).toContain('Organization');
            expect(all).not.toContain('SoftwareApplication');
            expect(all).not.toContain('WebApplication');
            expect(all).not.toContain('Service');
            expect(all).not.toContain('HowTo');
            expect(all).not.toContain('FAQPage');
            expect(all).not.toContain('BreadcrumbList');
        }
    });
});

describe('F3.2: nuomos konfigūratorius', () => {
    it('mėnesiai 1–12: 3 mėn. GK-500M → 10 500 € neto', () => {
        const deal = calculateBoilerRentalDeal({
            powerCode: 'GK-500M',
            termId: 'monthly',
            months: 3,
            addons: {},
        });
        expect(deal.totalNetEur).toBe(10500);
    });

    it('sezonui parenkamas 5 mėn. su nuolaida, avariinei – 0,5', () => {
        const season = calculateBoilerRentalDeal({ powerCode: 'GK-500M', termId: 'season', months: 5, addons: {} });
        expect(season.discountPct).toBe(25);
        expect(season.totalNetEur).toBe(13125);
        const emergency = calculateBoilerRentalDeal({ powerCode: 'GK-150M', termId: 'emergency', addons: {} });
        expect(emergency.months).toBe(0.5);
    });

    it('copy be rizikingų pažadų ir be „inžinieriaus (AI)“', () => {
        const lt = JSON.stringify(DEAL_COPY.lt);
        expect(lt).not.toMatch(/15 sekund/i);
        expect(lt).not.toMatch(/per 15 min/i);
        expect(lt).not.toContain('PRO-...');
        expect(lt).not.toMatch(/vyr\. inžinier\w* Vytaut/i);
        for (const loc of ['en', 'pl', 'ru'] as const) {
            expect(JSON.stringify(DEAL_COPY[loc])).not.toMatch(/chief engineer Vytautas/i);
        }
    });
});

describe('F3.11: gabaritai vienu formatu (mm)', () => {
    it('visi matmenų labeliai – milimetrais', () => {
        const list = (modelsJson as { models?: Array<{ code: string; dimensions?: { value?: { label?: string } | null } }> }).models ?? [];
        for (const m of list) {
            const label = m.dimensions?.value?.label;
            if (!label || !label.includes('×')) continue; // „2–3 konteinerių blokas“ – ne matmenys
            expect(`${m.code}: ${label}`).toMatch(/\d[\d\s]* × \d[\d\s]* × \d[\d\s]* mm/);
        }
    });
});

describe('F0.2: vedlio taisyklėse nėra įkaltų skaičių', () => {
    it('rules JSON be fiksuotų sezonų / temperatūrų / „sandėlyje“ pažadų', () => {
        const text = JSON.stringify(rulesJson);
        expect(text).not.toContain('1,5–2 šildymo sezonai');
        expect(text).not.toContain('21,5');
        expect(text).not.toMatch(/Visos dalys sandėlyje/);
        // kuro kainos – owner-input, tad copy turi „prielaida“ žymą
        expect(JSON.stringify(rulesJson.copy)).toContain('prielaida');
    });
});
