// W39-A1: AI-SEO Comparison & Symptom Diagnostic Hub data source
// Grounded in W38-R1 15 Reddit HVAC pain points & Image 1 ChatGPT/Perplexity referral strategy.

import { HVAC_SYSTEM_GROUPS } from './v3-description';
import {
    EXTENDED_SYMPTOM_DIAGNOSTICS,
    EXTENDED_HVAC_COMPARISON_GUIDES,
} from './hvac-comparisons-extended';

export type SymptomDiagnosticCategory =
    | 'radiatoriai'
    | 'grindinis'
    | 'katiline'
    | 'silumos-siurbliai'
    | 'balansavimas'
    | 'montavimas';

export interface SymptomRecommendedItem {
    sku: string;
    brand: string;
    name: string;
    roleLabel: string;
    priceEstimateLabel: string;
    catalogHref: string;
}

export interface SymptomDiagnosticCard {
    id: string;
    category?: SymptomDiagnosticCategory;
    badge: string;
    symptomTitle: string;
    shortSymptom: string;
    redditContext: string;
    causePlain: string;
    fiveMinFixSteps: string[];
    mistakeWarning: string;
    recommendedProducts: SymptomRecommendedItem[];
    calculatorHref: string;
    calculatorLabel: string;
    catalogQueryHref: string;
    relatedGuideSlug: string;
}

export type SymptomDiagnosticItem = SymptomDiagnosticCard;

export interface HvacComparisonRow {
    criterion: string;
    optionAValue: string;
    optionBValue: string;
    winnerOrRule: string;
}

export interface HvacComparisonGuide {
    slug: string;
    badge: string;
    title: string;
    questionHook: string;
    aiDirectAnswer: string;
    optionA: {
        name: string;
        brand: string;
        representativeSku: string;
        summary: string;
        bestFor: string;
        catalogHref: string;
    };
    optionB: {
        name: string;
        brand: string;
        representativeSku: string;
        summary: string;
        bestFor: string;
        catalogHref: string;
    };
    comparisonRows: HvacComparisonRow[];
    diagnosticChecklist: string[];
    recommendedSkus: SymptomRecommendedItem[];
    calculatorTab: 'boiler' | 'vessel' | 'valve' | 'manifold' | 'radiator';
    calculatorLabel: string;
    faqItems: Array<{ question: string; answer: string }>;
}

export const SYMPTOM_DIAGNOSTICS: SymptomDiagnosticCard[] = [
    {
        id: 'whistling-radiator',
        category: 'radiatoriai',
        badge: 'Radiatoriai · Slėgio perkritis virš 25 kPa',
        symptomTitle: 'Ūžia arba švilpia radiatoriaus vožtuvas',
        shortSymptom: 'Švilpimas ir ūžesys vamzdžiuose prisisukus termostatinei galvutei',
        redditContext: 'r/Plumbing & r/tado: „Whistling noise when TRV partially closes – Δp too high“',
        causePlain:
            'Kai kituose kambariuose termostatinės galvutės užsidaro, cirkuliacinis siurblys visą slėgį nukreipia į likusį pusiau pravirą vožtuvą. Slėgio perkritis viršija Δp > 20–25 kPa (arba sumaišytas padavimo ir grįžimo vamzdis), todėl vandens srautas švilpia pro siaurą plyšį.',
        fiveMinFixSteps: [
            'Patikrinkite, ar šylančio radiatoriaus viršus įkaista pirmiau nei apačia (jei pirmiausia kaista apačia – sumaišytas padavimas/grįžimas ir vožtuvas kalena).',
            'Jei kryptis teisinga, pakeiskite paprastą vožtuvo įdėklą į automatinį srauto ribotuvą IMI Heimeier Eclipse AFC (10–150 l/h), kuris pats sugeria slėgio šuolius iki 60 kPa.',
            'Didesnėse sistemose ant katilinės šakos sumontuokite IMI TA STAD arba Danfoss ASV-PV balansinį vožtuvą.',
        ],
        mistakeWarning:
            'Keičiant vien termostatinę galvutę (rankenėlę), švilpimas neišnyks – triukšmą kelia vandens greitis žalvariniame vožtuvo korpuse.',
        recommendedProducts: [
            {
                sku: '3933-02.000',
                brand: 'IMI Heimeier',
                name: 'IMI Heimeier Eclipse DN15 tiesus termostatinis vožtuvas su AFC (10–150 l/h)',
                roleLabel: 'Automatinis l/h ribotuvas tylai',
                priceEstimateLabel: 'nuo ~24,50 €',
                catalogHref: '/products?q=3933-02.000',
            },
            {
                sku: '52-151-014',
                brand: 'IMI TA',
                name: 'IMI TA STAD DN15 balansinis srauto vožtuvas su matavimo nipeliais',
                roleLabel: 'Šakos / stovo balansavimas',
                priceEstimateLabel: 'nuo ~46,00 €',
                catalogHref: '/products?q=52-151-014',
            },
        ],
        calculatorHref: '/skaiciuokle?tab=valve',
        calculatorLabel: 'Skaičiuoti srautą ir vamzdžio greitį (v ≤ 0,75 m/s)',
        catalogQueryHref: '/products?q=Eclipse',
        relatedGuideSlug: 'heimeier-eclipse-afc-vs-standartinis-voztuvas',
    },
    {
        id: 'cold-farthest-radiator',
        category: 'grindinis',
        badge: 'Grindinis šildymas · Hidraulinis trumpasis jungimas',
        symptomTitle: 'Tolimiausias grindų kontūras arba radiatorius lieka šaltas',
        shortSymptom: 'Artimiausias kontūras karštas, o tolimas kambarys ar 0,5 l/min kilpa neįšyla',
        redditContext: 'r/DIYUK: „Furthest radiators still not warming up / UFH loop stuck at 0.5 L/min“',
        causePlain:
            'Hidraulinis trumpasis jungimas: karštas vanduo teka mažiausio pasipriešinimo keliu per arčiausiai katilo esančius radiatorius arba trumpus vonios grindų kontūrus (30 m) ir grįžta į katilą, todėl tolimoms šakoms (arba >90 m kontūrams) nebelieka srauto.',
        fiveMinFixSteps: [
            'Nuorinkite šaltą radiatorių arba grindinio šildymo kontūrą (uždarykite kitus kolektoriaus kontūrus ir praplaukite vieną šaltą kilpą).',
            'Grindiniam šildymui rinkitės IMI Heimeier Dynacon Eclipse kolektorių – jame nustatomas tikslus l/h srautas kiekvienam kontūrui ir jis automatiškai išsilaiko.',
            'Radiatorinėje sistemoje aprišimus subalansuokite IMI TA STAD vožtuvu ant stovo arba Eclipse vožtuvais ant artimiausių radiatorių.',
        ],
        mistakeWarning:
            'Cirkuliacinio siurblio perjungimas į maksimalų greitį be balansavimo tik sukels ūžimą pirmuose radiatoriuose ir padidins elektros sąnaudas.',
        recommendedProducts: [
            {
                sku: '9330-06.800',
                brand: 'IMI Heimeier',
                name: 'IMI Heimeier Dynacon Eclipse 6 kontūrų kolektorius su AFC srauto ribotuvais',
                roleLabel: 'Savaime balansuojantis kolektorius',
                priceEstimateLabel: 'nuo ~310,00 €',
                catalogHref: '/products?q=9330-06.800',
            },
            {
                sku: '52-151-020',
                brand: 'IMI TA',
                name: 'IMI TA STAD DN20 balansinis vožtuvas aukšto / atšakos balansavimui',
                roleLabel: 'Tikslus Kv ir Δp balansavimas',
                priceEstimateLabel: 'nuo ~52,00 €',
                catalogHref: '/products?q=52-151-020',
            },
        ],
        calculatorHref: '/skaiciuokle?tab=manifold',
        calculatorLabel: 'Skaičiuoti grindų kontūrus ir balansavimą',
        catalogQueryHref: '/products?q=Dynacon',
        relatedGuideSlug: 'dynacon-eclipse-vs-standartinis-kolektorius',
    },
    {
        id: 'boiler-pressure-drop-3bar',
        category: 'katiline',
        badge: 'Katilinė ir slėgis · Membranos ir P₀ diagnostika',
        symptomTitle: 'Krenta katilo slėgis (iki 0 bar) arba šylant šoka iki 3 bar',
        shortSymptom: 'Katilui šylant laša 3 bar apsauginis vožtuvas, o atvėsus slėgis nukrenta iki 0',
        redditContext: 'r/Plumbing: „Boiler keeps over-pressurizing to 3 bar and tripping PRV, then drops to 0“',
        causePlain:
            'Vanduo šildamas nuo 10 °C iki 80 °C plečiasi ~4%. Kai plėtimosi indo membrana plyšta arba išsileidžia oro pagalvė (P₀), visas indas užsipildo vandeniu. Šylant slėgis iškart šoka iki 3 bar ir išmeta vandenį pro apsauginį vožtuvą, o atvėsus katilas sustoja dėl 0 bar klaidos.',
        fiveMinFixSteps: [
            'Pastuksenkite per plėtimosi indą ir trumpai spustelėkite oro nipelį: jei iš nipelio pasirodo vanduo – membrana plyšusi, indą būtina keisti.',
            'Jei bėga tik oras, atjunkite indą nuo vandens slėgio (0 bar vandens pusėje!) ir pripūskite P₀ = H_stat / 10 + 0,2 bar (pvz., 1,0–1,2 bar dviaukščiui namui).',
            'Keisdami indą į IMI Pneumatex Statico SD, būtinai sumontuokite DLV aptarnavimo čiaupą patogiai patikrai ateityje.',
        ],
        mistakeWarning:
            'Niekada nematuokite plėtimosi indo oro slėgio P₀ neišleidę slėgio iš vandens pusės – manometras tiesiog parodys katilo vandens slėgį!',
        recommendedProducts: [
            {
                sku: '7101003',
                brand: 'IMI Pneumatex',
                name: 'IMI Pneumatex Statico SD 25.3 plėtimosi indas šildymui (Airproof butilo membrana)',
                roleLabel: 'Šveicariška Airproof membrana',
                priceEstimateLabel: 'nuo ~68,00 €',
                catalogHref: '/products?q=7101003',
            },
            {
                sku: '7111017',
                brand: 'IMI Pneumatex',
                name: 'IMI Pneumatex Aquapresso AD 18.10 plėtimosi indas geriamam vandeniui (PN10)',
                roleLabel: 'Boileriams ir karštam vandeniui',
                priceEstimateLabel: 'nuo ~95,00 €',
                catalogHref: '/products?q=7111017',
            },
        ],
        calculatorHref: '/skaiciuokle?tab=vessel',
        calculatorLabel: 'Skaičiuoti plėtimosi indo litražą ir P₀ (EN 12828)',
        catalogQueryHref: '/products?q=Statico',
        relatedGuideSlug: 'pneumatex-statico-vs-aquapresso-pletimosi-indai',
    },
    {
        id: 'radiator-hot-on-zero',
        category: 'radiatoriai',
        badge: 'Radiatoriai · Štoko eiga ir užkalkėjimas',
        symptomTitle: 'Radiatorius kaista net pasukus galvutę ant „0“ (arba šaltas po vasaros)',
        shortSymptom: 'Užsukus termostatinę galvutę iki galo, radiatorius vis tiek lieka karštas arba neatsidaro rudenį',
        redditContext: 'r/DIYUK: „Radiator on 0 but still hot?! / TRV pin stuck after summer“',
        causePlain:
            'Užkalkėjusi vožtuvo adatėlė (štokas) po vasaros arba galvutė buvo uždėta pasukta į „0“ padėtį (nepilnai užsifiksavo ant kakliuko), arba nupirkta netinkamo lizdo galvutė (pvz., M30×1,5 užsukta ant Danfoss RTD/RA vožtuvo su kita štoko eiga).',
        fiveMinFixSteps: [
            'Nuimkite termostatinę galvutę (prieš nuimdami pasukite į „5“) ir moneta ar plokščiu įrankiu paspauskite metalinę adatėlę 2–3 mm į vidų – ji turi spyruokliuoti atgal.',
            'Jei adatėlė vaikšto laisvai, uždėkite galvutę pasuktą į „5“ padėtį iki pilno spragtelėjimo/užveržimo ir tik tada sukite į „0“.',
            'Jei senos galvutės skysčio kapsulė išsiliejusi, pakeiskite į tikslią Danfoss Redia (RA Click) arba IMI Heimeier K (M30×1,5) galvutę.',
        ],
        mistakeWarning:
            'Niekada netraukite įstrigusios vožtuvo adatėlės replėmis į save! Ištraukę štoką pažeisite riebokšlį ir iš šildymo sistemos ims veržtis karštas vanduo.',
        recommendedProducts: [
            {
                sku: '013G2990',
                brand: 'Danfoss',
                name: 'Danfoss RA 2990 greito reagavimo dujinė termostatinė galvutė su RA Click (23 mm) jungtimi',
                roleLabel: 'Danfoss RA Click vožtuvams (013G2990)',
                priceEstimateLabel: '41,26 € su PVM',
                catalogHref: '/products?q=013G2990',
            },
            {
                sku: '3712-02.000',
                brand: 'IMI Heimeier',
                name: 'IMI Heimeier K-galvutė ir M30×1,5 termostatinis mazgas',
                roleLabel: 'Standartiniam M30×1,5 sriegiui',
                priceEstimateLabel: 'nuo ~19,50 €',
                catalogHref: '/products?q=3712-02.000',
            },
        ],
        calculatorHref: '/skaiciuokle?tab=radiator',
        calculatorLabel: 'Atidaryti radiatoriaus mazgo parinkimo vedlį',
        catalogQueryHref: '/products?q=Termostatin%C4%97+galvut%C4%97',
        relatedGuideSlug: 'danfoss-ra-click-vs-m30x15-galvutes',
    },
    {
        id: 'trv-thread-23mm-vs-30mm',
        category: 'montavimas',
        badge: 'Jungtys ir montavimas · Jungties geometrijos matavimas',
        symptomTitle: 'Nežinau, kokia galvutė tinka mano vožtuvui (23 mm ar 30 mm)',
        shortSymptom: 'Kaip atskirti Danfoss RA Click (23 mm) lizdą nuo standartinio M30×1,5 sriegio',
        redditContext: 'r/Plumbing: „Already bought and returned two TRVs – M30x1.5 vs Danfoss RA 23mm“',
        causePlain:
            'Lietuvoje populiariausi du fiziškai nesuderinami standartai: Danfoss RA vožtuvai turi ~23 mm lygų kakliuką su grioveliu („Click“ užspaudimas be sriegio), o IMI Heimeier, Oventrop, Honeywell ir Kermi vožtuvai turi 30 mm išorinį sriegį (M30×1,5 veržlė).',
        fiveMinFixSteps: [
            'Nuimkite seną galvutę ir liniuote arba slankmačiu pamatuokite vožtuvo kakliuko skersmenį.',
            'Jei matote ~23 mm kakliuką su žiediniu grioveliu ir be sriegio – rinkitės Danfoss RA Click galvutes (pvz., 013G2970).',
            'Jei matote ~30 mm sriegį, ant kurio sukasi metalinė veržlė – rinkitės M30×1,5 galvutes (IMI Heimeier K, Danfoss Redia M30).',
        ],
        mistakeWarning:
            'Net jei M30×1,5 veržlė užsisuka ant seno nestandartinio vožtuvo, 1–2 mm štoko eigos skirtumas neleis vožtuvui pilnai užsidaryti.',
        recommendedProducts: [
            {
                sku: '013G2990',
                brand: 'Danfoss',
                name: 'Danfoss RA 2990 (41,26 €) + RA-N 15 (013G0014 – 27,95 €) / vienvamzdei RA-G 15 (013G1675 – 48,04 €)',
                roleLabel: '23 mm Click jungtis (be sriegio)',
                priceEstimateLabel: '41,26 € / 48,04 € su PVM',
                catalogHref: '/products?brand=Danfoss&category=Termostatin%C4%97s+galvut%C4%97s+ir+vo%C5%BEtuvai',
            },
            {
                sku: '3933-02.000',
                brand: 'IMI Heimeier',
                name: 'IMI Heimeier M30×1,5 termostatinė įranga (30 mm sriegis)',
                roleLabel: '30 mm M30×1,5 srieginė veržlė',
                priceEstimateLabel: 'nuo ~24,50 €',
                catalogHref: '/products?brand=IMI+Heimeier&category=Termostatin%C4%97s+galvut%C4%97s+ir+vo%C5%BEtuvai',
            },
        ],
        calculatorHref: '/skaiciuokle?tab=radiator',
        calculatorLabel: 'Sukomplektuoti derantį vožtuvą + galvutę',
        catalogQueryHref: '/products?brand=Danfoss&category=Termostatin%C4%97s+galvut%C4%97s+ir+vo%C5%BEtuvai',
        relatedGuideSlug: 'danfoss-ra-click-vs-m30x15-galvutes',
    },
    {
        id: 'manifold-actuator-230v-vs-24v',
        category: 'grindinis',
        badge: 'Grindinis šildymas · Pavaros įtampos ir NC/NO logika',
        symptomTitle: 'Kurią terminę pavarą rinktis kolektoriui: 230V ar 24V (NC ar NO)?',
        shortSymptom: 'Kaip nesudeginti pavaros ir nesupainioti NC (normaliai uždaryta) su NO',
        redditContext: 'r/Plumbing & r/homeassistant: „UFH manifold actuator doesn\'t close – 24V vs 230V NC/NO“',
        causePlain:
            '24V pavaros prijungimas prie 230V valdiklio per kelias sekundes sudegina vaško kaitinimo elementą, o 230V pavara nuo 24V signalo tiesiog neatsidaro. Be to, nupirkus NO (normaliai atvirą) vietoj NC (normaliai uždarytos), kambarys kais tada, kai termostatas išjungtas!',
        fiveMinFixSteps: [
            'Atidarykite kolektoriaus komutacinę dėžutę (valdiklį) ir patikrinkite išėjimo įtampą: 230V AC ar 24V AC/DC.',
            '95% gyvenamųjų namų šildymo valdiklių naudoja NC (Normally Closed – be įtampos uždaryta) logiką.',
            'Pasitikrinkite kolektoriaus sriegį: IMI Heimeier EMO T (M30×1,5) tinka daugumai kolektorių, o Danfoss TWA turi atskirus RA ir M30×1,5 modelius.',
        ],
        mistakeWarning:
            'Tikrindami pavarą atminkite: vaško elementas šyla ir pilnai atsidaro per 3–4 minutes, todėl įjungus įtampą ji nesuveikia akimirksniu.',
        recommendedProducts: [
            {
                sku: '1833-00.500',
                brand: 'IMI Heimeier',
                name: 'IMI Heimeier EMO T 230V NC elektroterminė pavara (M30×1,5)',
                roleLabel: '230V NC M30×1,5 standartas',
                priceEstimateLabel: 'nuo ~28,00 €',
                catalogHref: '/products?category=Katilin%C4%97s+automatika+ir+pavaros',
            },
            {
                sku: '088U0240',
                brand: 'Danfoss',
                name: 'Danfoss Icon / TWA automatikos ir pavarų sprendimai kolektoriams',
                roleLabel: 'Danfoss 24V / 230V automatika',
                priceEstimateLabel: 'nuo ~26,00 €',
                catalogHref: '/products?category=Katilin%C4%97s+automatika+ir+pavaros',
            },
        ],
        calculatorHref: '/skaiciuokle?tab=manifold',
        calculatorLabel: 'Skaičiuoti kolektorių ir pavarų komplektą',
        catalogQueryHref: '/products?category=Katilin%C4%97s+automatika+ir+pavaros',
        relatedGuideSlug: '230v-vs-24v-nc-no-termines-pavaros',
    },
    ...EXTENDED_SYMPTOM_DIAGNOSTICS,
];

export const HVAC_COMPARISON_GUIDES: HvacComparisonGuide[] = [
    {
        slug: 'danfoss-ra-click-vs-m30x15-galvutes',
        badge: '01 · TERMOSTATINIŲ GALVUČIŲ JUNGTYS',
        title: 'Danfoss RA Click (23 mm) vs. M30×1,5 (Heimeier): kuri termostatinė galvutė tinka jūsų vožtuvui?',
        questionHook: 'Kaip per 10 sekundžių atskirti Danfoss RA 23 mm lizdą nuo M30×1,5 sriegio ir nepirkti netinkančios galvutės?',
        aiDirectAnswer:
            'M30×1,5 standartas naudoja 30 mm skersmens srieginę metalinę veržlę (1,5 mm žingsnis), kuri tinka IMI Heimeier, Oventrop, Honeywell ir Kermi vožtuvams. Danfoss RA standartas naudoja 23 mm lygų kakliuką su žiediniu grioveliu („Click“ arba varžtelio fiksacija be sriegio). Šie lizdai tarpusavyje nesuderinami be specialaus adapterio.',
        optionA: {
            name: 'Danfoss RA Click (23 mm)',
            brand: 'Danfoss',
            representativeSku: '013G2970',
            summary: 'Greito užspaudimo („Click“) 23 mm lizdas su dujiniu/skystiniu greito reagavimo jutikliu.',
            bestFor: 'Esamiems Danfoss RA-N, RA-FN ir RA-DV radiatoriniams vožtuvams.',
            catalogHref: '/products?brand=Danfoss&category=Termostatin%C4%97s+galvut%C4%97s+ir+vo%C5%BEtuvai',
        },
        optionB: {
            name: 'Standartas M30×1,5 (30 mm sriegis)',
            brand: 'IMI Heimeier',
            representativeSku: '3712-02.000',
            summary: ' Srieginė metalinė M30×1,5 veržlė (11,5 mm uždarymo matmuo) su skystiniu jutikliu.',
            bestFor: 'IMI Heimeier Eclipse / V-exact II, Oventrop, Honeywell bei apatinio pajungimo VK radiatoriams su M30×1,5 įdėklu.',
            catalogHref: '/products?brand=IMI+Heimeier&category=Termostatin%C4%97s+galvut%C4%97s+ir+vo%C5%BEtuvai',
        },
        comparisonRows: [
            {
                criterion: 'Vožtuvo kakliuko skersmuo',
                optionAValue: '~23 mm lygus kakliukas su grioveliu',
                optionBValue: '30 mm išorinis sriegis (1,5 mm žingsnis)',
                winnerOrRule: 'Pamatuokite liniuote nuėmę seną galvutę',
            },
            {
                criterion: 'Tvirtinimo būdas',
                optionAValue: 'Užspaudžiamas „Click“ žiedas (be raktų)',
                optionBValue: 'Užsukama metalinė veržlė (M30×1,5)',
                winnerOrRule: 'Montuokite nustatę galvutę į „5“ padėtį',
            },
            {
                criterion: 'Suderinamumas su vožtuvais',
                optionAValue: 'Danfoss RA-N, RA-FN, RA-DV',
                optionBValue: 'IMI Heimeier, Oventrop, Honeywell, Kermi, Purmo M30',
                winnerOrRule: 'Suderinama 1:1 pagal gamintojo standartą',
            },
            {
                criterion: 'Jutiklio technologija',
                optionAValue: 'Danfoss Redia / RA 2000 greita reakcija (~15 min)',
                optionBValue: 'Heimeier K skysčio kapsulė (histerezė <0,2 K)',
                winnerOrRule: 'Abu atitinka EN 215 A klasės tikslumą',
            },
        ],
        diagnosticChecklist: [
            'Prieš nuimdami seną termostatinę galvutę, pasukite ją į maksimalią padėtį „5“.',
            'Pamatuokite vožtuvo kakliuką: 23 mm su grioveliu = Danfoss RA; 30 mm sriegis = M30×1,5.',
            'Paspauskite vožtuvo adatėlę moneta (2–3 mm eiga) – ji turi laisvai grįžti atgal.',
        ],
        recommendedSkus: [
            {
                sku: '013G2970',
                brand: 'Danfoss',
                name: 'Danfoss Redia / RA 2000 termostatinė galvutė (RA Click 23 mm)',
                roleLabel: '23 mm Danfoss RA lizdui',
                priceEstimateLabel: 'nuo ~21,90 €',
                catalogHref: '/products?q=013G2970',
            },
            {
                sku: '3933-02.000',
                brand: 'IMI Heimeier',
                name: 'IMI Heimeier Eclipse DN15 vožtuvas su M30×1,5 sriegiu',
                roleLabel: '30 mm M30×1,5 standartui',
                priceEstimateLabel: 'nuo ~24,50 €',
                catalogHref: '/products?q=3933-02.000',
            },
        ],
        calculatorTab: 'radiator',
        calculatorLabel: 'Sukomplektuoti radiatoriaus mazgą be sriegio klaidų',
        faqItems: [
            {
                question: 'Ar galima M30×1,5 galvutę uždėti ant Danfoss RA 23 mm vožtuvo?',
                answer: 'Tiesiogiai uždėti negalima, nes 30 mm veržlė neturi ant ko užsisukti ant 23 mm kakliuko. Geriausias sprendimas – rinktis originalią Danfoss RA Click galvutę (pvz., 013G2970).',
            },
            {
                question: 'Kodėl uždėjus naują galvutę radiatorius vis tiek šyla ant „0“?',
                answer: 'Dažniausiai galvutė buvo uždėta pasukta į „0“ (todėl nepilnai užsifiksavo ant griovelio) arba vožtuvo štoko uždarymo matmuo neatitinka galvutės standarto.',
            },
        ],
    },
    {
        slug: 'heimeier-eclipse-afc-vs-standartinis-voztuvas',
        badge: '02 · AUTOMATINIS SRAUTO RIBOJIMAS (AFC)',
        title: 'IMI Heimeier Eclipse AFC vs. standartinis vožtuvas: kaip išvengti ūžiančių ir šaltų radiatorių?',
        questionHook: 'Kodėl renovuojant šildymą paprastas Kv vožtuvas pradeda švilpti ir kuo pranašesnis automatinis AFC vožtuvas?',
        aiDirectAnswer:
            'IMI Heimeier Eclipse su AFC (Automatic Flow Control) technologija turi integruotą slėgio reguliavimo membraną, todėl reikiamas srautas nustatomas tiesiogiai litrais per valandą (10–150 l/h) ir neviršijamas net slėgiui šoktelėjus iki 60 kPa. Standartinis Kv vožtuvas (pvz., Danfoss RA-N) riboja tik angos plotą, todėl reikalauja vamzdyno skaičiavimų.',
        optionA: {
            name: 'IMI Heimeier Eclipse (AFC)',
            brand: 'IMI Heimeier',
            representativeSku: '3933-02.000',
            summary: 'Automatinis srauto ribotuvas (10–150 l/h), palaikantis pastovų srautą nepriklausomai nuo slėgio svyravimų.',
            bestFor: 'Renovacijai (kai nežinomi vamzdžių ilgiai), švilpiantiems radiatoriams ir greitam balansavimui pagal radiatoriaus galią (W).',
            catalogHref: '/products?q=Eclipse',
        },
        optionB: {
            name: 'Standartinis Kv vožtuvas (RA-N / V-exact II)',
            brand: 'Danfoss',
            representativeSku: '013G5012',
            summary: 'Klasikinis termostatinis vožtuvas su išankstinio Kv pralaidumo nustatymo skale (1–7 / N).',
            bestFor: 'Naujos statybos objektams su pilnu hidrauliniu projektu ir pastovaus slėgio cirkuliaciniu siurbliu.',
            catalogHref: '/products?q=RA-N',
        },
        comparisonRows: [
            {
                criterion: 'Nustatymo principas',
                optionAValue: 'Tiesiogiai litrais per valandą (10–150 l/h pagal radiatoriaus kW)',
                optionBValue: 'Sąlyginė Kv skalė (reikia žinoti šakos slėgio nuostolius Δp)',
                winnerOrRule: 'Eclipse AFC sutaupo iki 70% derinimo laiko',
            },
            {
                criterion: 'Reakcija, kai užsidaro kiti radiatoriai',
                optionAValue: 'Membrana automatiškai prislopina perteklinį slėgį iki 60 kPa',
                optionBValue: 'Srautas ir greitis per vožtuvą išauga, gali atsirasti švilpimas',
                winnerOrRule: 'Eclipse AFC garantuoja tylų darbą',
            },
            {
                criterion: 'Tinkamumas renovacijai (paslėpti vamzdžiai)',
                optionAValue: 'Idealu – nereikia žinoti vamzdžių ilgio ir skersmens sienose',
                optionBValue: 'Sudėtinga tiksliai apskaičiuoti be hidraulinio projekto',
                winnerOrRule: 'Renovacijai rinkitės IMI Heimeier Eclipse',
            },
        ],
        diagnosticChecklist: [
            'Padalinkite radiatoriaus galią (W) iš 17,5 (kai ΔT=15 K) – gausite tikslų l/h skaičių Eclipse žiedui.',
            'Įsitikinkite, kad vožtuvas montuojamas ant padavimo vamzdžio pagal rodyklę ant korpuso.',
            'Sujunkite su bet kuria M30×1,5 termostatine galvute (pvz., Heimeier K).',
        ],
        recommendedSkus: [
            {
                sku: '3933-02.000',
                brand: 'IMI Heimeier',
                name: 'IMI Heimeier Eclipse DN15 tiesus termostatinis vožtuvas (AFC 10–150 l/h)',
                roleLabel: 'Automatinis l/h ribojimas',
                priceEstimateLabel: 'nuo ~24,50 €',
                catalogHref: '/products?q=3933-02.000',
            },
            {
                sku: '3934-02.000',
                brand: 'IMI Heimeier',
                name: 'IMI Heimeier Eclipse DN15 kampinis termostatinis vožtuvas',
                roleLabel: 'Kampiniam radiatoriaus pajungimui',
                priceEstimateLabel: 'nuo ~24,50 €',
                catalogHref: '/products?q=3934-02.000',
            },
        ],
        calculatorTab: 'valve',
        calculatorLabel: 'Apskaičiuoti reikiamą srautą (l/h) ir Kv',
        faqItems: [
            {
                question: 'Kaip nustatyti IMI Heimeier Eclipse vožtuvą be brėžinių?',
                answer: 'Užtenka žinoti radiatoriaus galią vatais. Pavyzdžiui, 1000 W radiatoriui (kai ΔT = 15 °C) reikia ~57 l/h srauto – ant Eclipse skalės tiesiog pasukite skaičių 6 (60 l/h).',
            },
            {
                question: 'Ar Eclipse vožtuvas pašalina radiatorių švilpimą?',
                answer: 'Taip, integruotas slėgio reguliatorius neleidžia srautui viršyti nustatytos ribos net iki 60 kPa slėgio perkričio, todėl švilpimas išnyksta.',
            },
        ],
    },
    {
        slug: 'pneumatex-statico-vs-aquapresso-pletimosi-indai',
        badge: '03 · PLĖTIMOSI INDAI (ŠILDYMUI VS BOILERIUI)',
        title: 'IMI Pneumatex Statico (šildymui) vs. Aquapresso (geriamam vandeniui ir boileriams): kuo skiriasi?',
        questionHook: 'Kodėl šildymo plėtimosi indo negalima montuoti prie karšto vandens boilerio ir kaip išsirinkti teisingą?',
        aiDirectAnswer:
            'IMI Pneumatex Statico (PN3/PN6, iki 3–6 bar) yra skirtas uždaroms šildymo sistemoms (radiatoriams, grindiniam šildymui, šilumos siurbliams), kur vanduo bedeguonis. IMI Pneumatex Aquapresso (PN10, iki 10 bar) turi nerūdijančio plieno / žalvario srautinį įvadą ir higieninę maistinę Airproof butilo membraną, todėl yra privalomas geriamojo karšto vandens boileriams.',
        optionA: {
            name: 'IMI Pneumatex Statico SD / SU (PN3 / PN6)',
            brand: 'IMI Pneumatex',
            representativeSku: '7101003',
            summary: 'Šildymo sistemų plėtimosi indas su šveicariška Airproof butilo membrana, išlaikančia oro slėgį dešimtmečiais.',
            bestFor: 'Katilams, šilumos siurbliams, radiatorinėms ir grindinio šildymo sistemoms (1,5–3,0 bar).',
            catalogHref: '/products?q=Statico',
        },
        optionB: {
            name: 'IMI Pneumatex Aquapresso AD / ADF (PN10)',
            brand: 'IMI Pneumatex',
            representativeSku: '7111002',
            summary: 'Geriamojo vandens ir boilerių plėtimosi indas (10 bar) su antikorozine jungtimi ir higienine membrana.',
            bestFor: 'Buitinio karšto vandens šildytuvams (boileriams), hidroforams ir vandentiekio sistemoms (4–10 bar).',
            catalogHref: '/products?q=Aquapresso',
        },
        comparisonRows: [
            {
                criterion: 'Maksimalus darbinis slėgis',
                optionAValue: 'PN3 (3 bar) arba PN6 (6 bar)',
                optionBValue: 'PN10 (10 bar – atlaiko miestų vandentiekio šuolius)',
                winnerOrRule: 'Boileriui visada privalomas PN10 (Aquapresso)',
            },
            {
                criterion: 'Higieninis sertifikatas ir antikorozija',
                optionAValue: 'Skirtas techniniam bedeguoniui šildymo vandeniui',
                optionBValue: 'Maistinė membrana + nerūdijantis srauto įvadas prieš legioneles',
                winnerOrRule: 'Statico ant boilerio surūdys per 1–2 metus',
            },
            {
                criterion: 'Pradinis gamyklinis oro slėgis (P₀)',
                optionAValue: '1,5 bar (koreguojama pagal namo aukštį H/10 + 0,2 bar)',
                optionBValue: '3,0–4,0 bar (0,2 bar mažiau nei įvado slėgio reduktorius)',
                winnerOrRule: 'Matuokite P₀ tik atjungę vandens slėgį!',
            },
        ],
        diagnosticChecklist: [
            'Šildymo kontūrui ant grįžtamojo vamzdžio prie katilo rinkitės Statico SD (tūris ~10–12% sistemos vandens).',
            'Karšto vandens boilerio šalto vandens įvadui (už atbulinio vožtuvo) rinkitės Aquapresso AD (tūris ~6–8% boilerio talpos).',
            'Prieš montuojant nustatykite P₀ slėgį dar neprijungę indo prie vandens.',
        ],
        recommendedSkus: [
            {
                sku: '7101003',
                brand: 'IMI Pneumatex',
                name: 'IMI Pneumatex Statico SD 25.3 plėtimosi indas šildymo sistemai',
                roleLabel: 'Šildymo sistemai (PN3)',
                priceEstimateLabel: 'nuo ~68,00 €',
                catalogHref: '/products?q=7101003',
            },
            {
                sku: '7111002',
                brand: 'IMI Pneumatex',
                name: 'IMI Pneumatex Aquapresso AD 18.10 plėtimosi indas boileriui (PN10)',
                roleLabel: 'Geriamam vandeniui (PN10)',
                priceEstimateLabel: 'nuo ~95,00 €',
                catalogHref: '/products?q=7111002',
            },
        ],
        calculatorTab: 'vessel',
        calculatorLabel: 'Skaičiuoti plėtimosi indo tūrį (L) ir P₀ slėgį',
        faqItems: [
            {
                question: 'Kas nutiks, jei prie boilerio sumontuosiu šildymo plėtimosi indą Statico?',
                answer: 'Vandentiekio vandenyje yra ištirpusio deguonies, o slėgis siekia 4–6 bar. Šildymo indo (3 bar) apsauginis vožtuvas arba membrana neatlaikys slėgio, o plieninis flanšas surūdys ir nudažys karštą vandenį.',
            },
            {
                question: 'Kaip patikrinti, ar plėtimosi indas dar veikia?',
                answer: 'Spustelėkite oro nipelį: jei pasirodo vanduo, membrana plyšusi. Jei bėga oras, užsukite vandens čiaupą, išleiskite vandens slėgį iš indo iki 0 bar ir manometru patikrinkite P₀.',
            },
        ],
    },
    {
        slug: 'dynacon-eclipse-vs-standartinis-kolektorius',
        badge: '04 · GRINDINIO ŠILDYMO KOLEKTORIAI',
        title: 'IMI Heimeier Dynacon Eclipse vs. paprastas kolektorius: kodėl verta rinktis automatinį srauto palaikymą?',
        questionHook: 'Kodėl ant paprasto kolektoriaus pasukus vieną rotametrą išsibalansuoja visi kaimyniniai kontūrai?',
        aiDirectAnswer:
            'Klasikiniame grindinio šildymo kolektoriuje su rotametrais vieno kontūro priveržimas pakeičia slėgį ir srautą visuose kituose kontūruose, todėl balansavimas trunka valandas. IMI Heimeier Dynacon Eclipse turi integruotus AFC automatinius srauto ribotuvus (30–300 l/h): kiekvienam kontūrui nustatote tikslų srautą vieną kartą ir jis išlieka pastovus.',
        optionA: {
            name: 'IMI Heimeier Dynacon Eclipse (AFC)',
            brand: 'IMI Heimeier',
            representativeSku: '9330-06.800',
            summary: 'Nerūdijančio plieno grindinio šildymo kolektorius su automatiniais AFC srauto ribotuvais (30–300 l/h).',
            bestFor: 'Namams su kambario termostatais ir pavaromis, kur kontūrai nuolat atsidaro/užsidaro ir reikalingas tolygus šildymas.',
            catalogHref: '/products?q=Dynacon',
        },
        optionB: {
            name: 'Standartinis kolektorius su rotametrais',
            brand: 'Danfoss',
            representativeSku: '013G3368',
            summary: 'Klasikinis paskirstymo kolektorius su stikliniais srauto indikatoriais (l/min) ir rankiniais ventiliais.',
            bestFor: 'Paprastoms vieno režimo sistemoms, kur kontūrai sureguliuojami vieną kartą paleidimo metu.',
            catalogHref: '/products?q=kolektorius',
        },
        comparisonRows: [
            {
                criterion: 'Hidraulinis balansavimas',
                optionAValue: 'Automatinis (AFC kasetė pati palaiko nustatytą l/h srautą)',
                optionBValue: 'Rankinis (reguliuojant vieną kilpą, kinta kitų kilpų srautas)',
                winnerOrRule: 'Dynacon Eclipse sutaupo 3–4 val. derinimo darbo',
            },
            {
                criterion: 'Darbas su zoninėmis termopavaromis',
                optionAValue: 'Užsidarius daliai kambarių, likę kontūrai negauna perteklinio srauto',
                optionBValue: 'Atvirose kilpose srautas išauga, gali švilpti vožtuvai',
                winnerOrRule: 'Zoninei automatikai pranašesnis Dynacon Eclipse',
            },
            {
                criterion: 'Ilgaamžiškumas ir nuosėdos',
                optionAValue: 'Srauto reguliatorius neužsineša kaip skaidrūs rotametrų stikliukai',
                optionBValue: 'Po kelerių metų rotametrų stikliukai gali apsinešti magnetitu',
                winnerOrRule: 'Vokiškas nerūdijančio plieno korpusas',
            },
        ],
        diagnosticChecklist: [
            'Suskaičiuokite kontūrus: vienas 16×2 mm PEX kontūras neturi viršyti 80–90 m ilgio (pagal LST EN 1264).',
            'Kiekvienam kontūrui ant Dynacon Eclipse žiedo nustatykite srautą (l/h) pagal kambario plotą.',
            'Jei sistemoje yra ir radiatoriai (70 °C), prieš kolektorių sumontuokite 35–45 °C pamaišymo mazgą.',
        ],
        recommendedSkus: [
            {
                sku: '9330-06.800',
                brand: 'IMI Heimeier',
                name: 'IMI Heimeier Dynacon Eclipse 6 kontūrų kolektorius su AFC',
                roleLabel: '6 kontūrų (~60–90 m²)',
                priceEstimateLabel: 'nuo ~310,00 €',
                catalogHref: '/products?q=9330-06.800',
            },
            {
                sku: '9330-08.800',
                brand: 'IMI Heimeier',
                name: 'IMI Heimeier Dynacon Eclipse 8 kontūrų kolektorius su AFC',
                roleLabel: '8 kontūrų (~80–120 m²)',
                priceEstimateLabel: 'nuo ~385,00 €',
                catalogHref: '/products?q=9330-08.800',
            },
        ],
        calculatorTab: 'manifold',
        calculatorLabel: 'Skaičiuoti kolektoriaus kontūrų skaičių ir srautus',
        faqItems: [
            {
                question: 'Kodėl mano grindinio šildymo rotametras rodo tik 0,5 l/min ir grindys šaltos?',
                answer: 'Dažniausios priežastys: kontūre likęs oro kamštis, kontūro vamzdis paklotas ilgesnis nei 100 m arba trumpesni vonios kontūrai neatbalansuoti ir nuima visą siurblio srautą.',
            },
            {
                question: 'Ar Dynacon Eclipse kolektoriui tinka standartinės M30×1,5 pavaros?',
                answer: 'Taip, ant grįžtamojo kolektoriaus vožtuvų yra standartinis M30×1,5 sriegis, kuriam tiesiogiai tinka IMI Heimeier EMO T ir kitos M30×1,5 pavaros.',
            },
        ],
    },
    {
        slug: '230v-vs-24v-nc-no-termines-pavaros',
        badge: '05 · ELEKTROTERMINĖS PAVAROS (230V VS 24V)',
        title: '230 V vs. 24 V ir NC vs. NO terminės pavaros (EMO T / TWA): kaip nesuklysti jungiant prie kolektoriaus?',
        questionHook: 'Kaip pagal komutacinę dėžutę ir kolektoriaus sriegį išsirinkti teisingą terminę pavarą?',
        aiDirectAnswer:
            'Terminės pavaros įtampa (230 V AC arba 24 V AC/DC) privalo 1:1 atitikti grindinio šildymo valdiklio (komutacinės dėžutės) išėjimo įtampą: 24 V pavara, įjungta į 230 V tinklą, sudega per kelias sekundes. NC (Normally Closed – normaliai uždaryta) be įtampos laiko kontūrą uždarytą (naudojama 95% sistemų), o NO be įtampos laiko atvirą.',
        optionA: {
            name: '230 V NC terminė pavara (EMO T / TWA 230V)',
            brand: 'IMI Heimeier',
            representativeSku: '1833-00.500',
            summary: 'Standartinė 230 V AC normaliai uždaryta (NC) pavara tiesioginiam jungimui prie 230 V termostatų ir komutacinių dėžučių.',
            bestFor: 'Klasikinėms laidinėms 230 V grindinio šildymo valdymo dėžutėms ir tiesioginiams 230 V kambario termostatams.',
            catalogHref: '/products?category=Katilin%C4%97s+automatika+ir+pavaros',
        },
        optionB: {
            name: '24 V NC terminė pavara (Danfoss TWA / EMO T 24V)',
            brand: 'Danfoss',
            representativeSku: '088U0240',
            summary: 'Žemos įtampos 24 V AC/DC NC pavara zoninių namų valdikliams (Danfoss Icon 24V, KNX, Loxone).',
            bestFor: 'Zoninių namų automatikos valdikliams su 24 V transformatoriumi ir drėgnoms zonoms.',
            catalogHref: '/products?category=Katilin%C4%97s+automatika+ir+pavaros',
        },
        comparisonRows: [
            {
                criterion: 'Maitinimo įtampa',
                optionAValue: '230 V AC (tiesiai iš 230 V valdiklio relės)',
                optionBValue: '24 V AC/DC (reikalingas 24 V valdiklis / transformatorius)',
                winnerOrRule: 'Patikrinkite lipduką ant komutacinės dėžutės',
            },
            {
                criterion: 'Darbo logika (NC vs NO)',
                optionAValue: 'NC = be įtampos uždaryta (95% visų namų sistemų)',
                optionBValue: 'NO = be įtampos atidaryta (tik specifinei automatikai)',
                winnerOrRule: 'Rinkitės NC, jei projekte nenurodyta kitaip',
            },
            {
                criterion: 'Jungties sriegis ant kolektoriaus',
                optionAValue: 'M30×1,5 (Heimeier, Oventrop, Watts, Kan-Therm)',
                optionBValue: 'Danfoss RA Click (23 mm) arba M30×1,5 (pagal TWA kodą)',
                winnerOrRule: 'Danfoss kolektoriui – RA, Heimeier – M30×1,5',
            },
        ],
        diagnosticChecklist: [
            'Prieš pirkdami patikrinkite 3 parametrus: įtampą (230V ar 24V), būseną (NC ar NO) ir sriegį (M30×1,5 ar RA).',
            'Įjungus įtampą vaško elementas šyla 3–4 minutes – nelaukite momentinio spragtelėjimo.',
            'Prieš užsukdami pavarą įsitikinkite, kad kolektoriaus vožtuvo adatėlė spaudosi laisvai.',
        ],
        recommendedSkus: [
            {
                sku: '1833-00.500',
                brand: 'IMI Heimeier',
                name: 'IMI Heimeier EMO T 230V NC elektroterminė pavara (M30×1,5)',
                roleLabel: '230V NC · M30×1,5',
                priceEstimateLabel: 'nuo ~28,00 €',
                catalogHref: '/products?category=Katilin%C4%97s+automatika+ir+pavaros',
            },
            {
                sku: '088U0240',
                brand: 'Danfoss',
                name: 'Danfoss Icon / TWA 24V-230V grindinio šildymo automatika',
                roleLabel: 'Danfoss automatika',
                priceEstimateLabel: 'nuo ~26,00 €',
                catalogHref: '/products?q=088U0240',
            },
        ],
        calculatorTab: 'manifold',
        calculatorLabel: 'Parinkti kolektorių ir pavarų skaičių',
        faqItems: [
            {
                question: 'Ką reiškia NC ir NO ant terminės pavaros?',
                answer: 'NC (Normally Closed) reiškia, kad dingus elektrai arba termostatui išjungus šildymą pavara spyruokle užspaudžia vožtuvą. NO (Normally Open) be elektros laiko vožtuvą atvirą.',
            },
            {
                question: 'Kodėl nauja terminė pavara įjungus į rozetę nejuda?',
                answer: 'Elektroterminės pavaros viduje yra PTC kaitinamas vaško kapsulės elementas – pilnas atsidarymas trunka 3–4 minutes ir vyksta visiškai tyliai.',
            },
        ],
    },
    {
        slug: 'stad-vs-ta-modulator-balansiniai-voztuvai',
        badge: '06 · HIDRAULINIS BALANSAVIMAS (STAD VS AUTOMATINIS)',
        title: 'IMI TA STAD vs. TA-Modulator / Danfoss ASV: rankinis ar automatinis hidraulinis balansavimas?',
        questionHook: 'Kada pakanka klasikinio IMI TA STAD balansinio vožtuvo, o kada būtinas automatinis slėgio perkričio reguliatorius?',
        aiDirectAnswer:
            'IMI TA STAD (DN15–DN50) yra precizinis rankinis stovų ir šakų balansinis vožtuvas su 4 apsisukimų skaitmenine rankenėle, „Memory stop“ fiksavimu ir matavimo nipeliais pastovaus režimo atšakoms. Automatiniai vožtuvai (TA-Modulator / PIBCV, Danfoss ASV-PV) dinamiškai palaiko pastovų slėgio perkritį Δp, kai sistemoje dirba kintamo srauto termostatiniai vožtuvai.',
        optionA: {
            name: 'IMI TA STAD (DN15–DN50)',
            brand: 'IMI TA',
            representativeSku: '52-151-014',
            summary: 'Švediškas AMETAL lydinio balansinis vožtuvas su P/T matavimo nipeliais ir tikslia Kv nustatymo skale.',
            bestFor: 'Katilinės šakoms, aukštų stovams, šilumos siurblių kontūrams ir boilerio šakų balansavimui.',
            catalogHref: '/products?q=STAD',
        },
        optionB: {
            name: 'IMI TA-Modulator / TBV-C / Danfoss ASV',
            brand: 'IMI TA',
            representativeSku: '52-133-215',
            summary: 'Kombinuotas automatinis balansinis ir reguliavimo vožtuvas (PIBCV), nepriklausomas nuo slėgio svyravimų.',
            bestFor: 'Daugiabučių stovams, komercinėms ŠVOK sistemoms ir šakoms su moduliuojančiomis pavaromis.',
            catalogHref: '/products?q=52-133-215',
        },
        comparisonRows: [
            {
                criterion: 'Reguliavimo tipas',
                optionAValue: 'Statinis tikslus Kv fiksavimas su matavimo atvamzdžiais',
                optionBValue: 'Dinaminis automatinis Δp ir srauto palaikymas',
                winnerOrRule: 'STAD – stovams/katilinei; PIBCV – dinaminėms zonoms',
            },
            {
                criterion: 'Korpuso medžiaga (AMETAL)',
                optionAValue: 'Cinko išplovimui atsparus švediškas AMETAL lydinys',
                optionBValue: 'AMETAL korpusas su nerūdijančio plieno šerdimi',
                winnerOrRule: 'Abu tarnauja 25+ metų be pratekėjimų',
            },
            {
                criterion: 'Parinkimas šilumos siurbliui (ΔT = 5 K)',
                optionAValue: 'Lengvai parenkamas DN20–DN32 mažam pasipriešinimui (Δp = 3–8 kPa)',
                optionBValue: 'Tikslus srauto ribojimas su pavara',
                winnerOrRule: 'Šilumos siurblio šakai rinkitės 1 dimensija didesnį DN',
            },
        ],
        diagnosticChecklist: [
            'Šilumos siurbliui (ΔT = 5 K) srautas yra 3 kartus didesnis nei katilui (ΔT = 15 K) – nepirkite per siauro DN15 vožtuvo 10 kW šakai!',
            'Pasinaudokite mūsų balansinio vožtuvo skaičiuokle, kad vamzdžio greitis neviršytų v ≤ 0,75 m/s.',
            'Užfiksavę STAD nustatymą, užveržkite vidinį „Memory stop“ varžtelį.',
        ],
        recommendedSkus: [
            {
                sku: '52-151-014',
                brand: 'IMI TA',
                name: 'IMI TA STAD DN15 balansinis vožtuvas su matavimo nipeliais',
                roleLabel: 'DN15 (iki ~150–400 l/h)',
                priceEstimateLabel: 'nuo ~46,00 €',
                catalogHref: '/products?q=52-151-014',
            },
            {
                sku: '52-151-025',
                brand: 'IMI TA',
                name: 'IMI TA STAD DN25 balansinis vožtuvas šilumos siurblio / aukšto šakai',
                roleLabel: 'DN25 (dideliam srautui)',
                priceEstimateLabel: 'nuo ~68,00 €',
                catalogHref: '/products?q=52-151-025',
            },
        ],
        calculatorTab: 'valve',
        calculatorLabel: 'Skaičiuoti STAD vožtuvo DN, Kv ir nustatymo apsisukimus',
        faqItems: [
            {
                question: 'Kodėl šilumos siurbliui reikia didesnio DN balansinio vožtuvo nei dujiniam katilui?',
                answer: 'Šilumos siurblys dirba su mažu temperatūrų skirtumu (ΔT = 5 K), todėl tai pačiai 10 kW galiai perpumpuoti reikia 1720 l/h vandens (dujiniam katilui prie ΔT = 15 K užtenka 573 l/h).',
            },
            {
                question: 'Kuo IMI TA STAD pranašesnis už paprastą rutulinį čiaupą?',
                answer: 'Rutulinis čiaupas skirtas tik atidaryti/uždaryti – pusiau pasuktas jis kavitaciniu būdu dyla ir negali būti tiksliai atstatytas. STAD turi 4 pilnų apsisukimų skalę ir „Memory stop“ atmintį.',
            },
        ],
    },
    {
        slug: 'zeparo-mikroburbulu-separatorius-vs-paprastas-nuorintuvas',
        badge: '07 · ORO IR MAGNETITO ŠALINIMAS (ZEPARO)',
        title: 'IMI Pneumatex Zeparo (mikroburbuliukų ir magnetito atskyriklis) vs. įprastas plūdinis nuorintuvas',
        questionHook: 'Kodėl nuorinus radiatorius po savaitės jie vėl burbuliuoja, o paprasti automatiniai nuorintuvai pradeda lašėti?',
        aiDirectAnswer:
            'Įprastas plūdinis automatinis nuorintuvas pašalina tik vamzdyno viršuje susikaupusius stambius oro burbulus ir dažnai užsikemša juodu magnetito šlamu (Fe₃O₄). IMI Pneumatex Zeparo su Helistill įdėklu ir magnetu montuojamas tiesiai į srautą: jis ištraukia karštame vandenyje ištirpusius mikroburbuliukus ir sugaudo magnetitą prieš jam pasiekiant siurblį.',
        optionA: {
            name: 'IMI Pneumatex Zeparo (ZUV / ZUKM / ZUD)',
            brand: 'IMI Pneumatex',
            representativeSku: '7895122',
            summary: 'Šveicariškas mikroburbuliukų ir magnetinio šlamo separatorius su neužsikemšančiu „ sauso“ tipo vožtuvu.',
            bestFor: 'Montavimui ant katilo / šilumos siurblio padavimo ir grįžimo linijų cirkuliacinių siurblių bei šilumokaičių apsaugai.',
            catalogHref: '/products?q=Zeparo',
        },
        optionB: {
            name: 'Paprastas plūdinis nuorintuvas (3/8"–1/2")',
            brand: 'IMI Heimeier',
            representativeSku: '7101001',
            summary: 'Taškinis automatinis oro išleidėjas aukščiausiems vamzdyno taškams ir kolektoriams.',
            bestFor: 'Grindinio šildymo kolektorių galams ir katilo apsauginės grupės viršutiniam taškui.',
            catalogHref: '/products?category=Oro+atskyrikliai+ir+nuorintuvai',
        },
        comparisonRows: [
            {
                criterion: 'Pašalinamas oras',
                optionAValue: 'Laisvas oras + ištirpę mikroburbuliukai (vakuuminė absorbcija)',
                optionBValue: 'Tik stambūs laisvo oro kamščiai aukščiausiame taške',
                winnerOrRule: 'Zeparo išvalo sistemą per kelias dienas be rankinio nuorinimo',
            },
            {
                criterion: 'Apsauga nuo juodo magnetito šlamo (Fe₃O₄)',
                optionAValue: 'Helistill žiedai + neodimio magnetas nusodina geležies oksidą',
                optionBValue: 'Šlamas patenka po plūde ir sukelia nuorintuvo lašėjimą',
                winnerOrRule: 'Zeparo prailgina siurblių ir vožtuvų tarnavimo laiką',
            },
            {
                criterion: 'Montavimo vieta',
                optionAValue: 'Oro separatorius – ant karščiausio padavimo; šlamo – ant grįžimo',
                optionBValue: 'Tik pačiame aukščiausiame stovo ar kolektoriaus taške',
                winnerOrRule: 'Šiuolaikinėje katilinėje būtinas srautinis separatorius',
            },
        ],
        diagnosticChecklist: [
            'Oro separatorių (Zeparo ZUV) montuokite karščiausioje sistemos vietoje – iškart už katilo ant padavimo linijos.',
            'Šlamo ir magnetito separatorių montuokite ant grįžtamosios linijos prieš katilą arba šilumos siurblį.',
            'Kartą per šildymo sezoną trumpam atidarykite apatinį išleidimo čiaupą susikaupusiam magnetitui nuleisti.',
        ],
        recommendedSkus: [
            {
                sku: '7895122',
                brand: 'IMI Pneumatex',
                name: 'IMI Pneumatex Zeparo automatinis oro ir mikroburbuliukų atskyriklis',
                roleLabel: 'Šveicariškas Helistill separatorius',
                priceEstimateLabel: 'nuo ~34,00 €',
                catalogHref: '/products?q=7895122',
            },
            {
                sku: '3933-02.000',
                brand: 'IMI Heimeier',
                name: 'IMI Heimeier Eclipse DN15 vožtuvas (apsaugotas nuo šlamo)',
                roleLabel: 'Tyliam radiatorių darbui',
                priceEstimateLabel: 'nuo ~24,50 €',
                catalogHref: '/products?q=3933-02.000',
            },
        ],
        calculatorTab: 'boiler',
        calculatorLabel: 'Apskaičiuoti katilinės galią ir apsaugos mazgus',
        faqItems: [
            {
                question: 'Kodėl iš radiatoriaus išleidžiamas vanduo yra juodos spalvos?',
                answer: 'Juoda spalva yra magnetitas (Fe₃O₄) – geležies oksido mikrodalelės, susidarančios plieniniuose radiatoriuose dėl vandenyje likusio deguonies. Magnetinis separatorius Zeparo jį sugaudo.',
            },
            {
                question: 'Kodėl krenta katilo slėgis, nors po vamzdžiais nesimato balų?',
                answer: 'Dažnai nežymiai laša užsinešęs plūdinis nuorintuvas ant karšto vamzdžio – vanduo iškart išgaruoja, todėl grindys lieka sausos, bet slėgis kas savaitę nukrenta.',
            },
        ],
    },
    {
        slug: 'apatinis-vk-50mm-binoklis-vs-soninis-radiatoriaus-pajungimas',
        badge: '08 · RADIATORIŲ PAJUNGIMO MAZGAI (VK 50 MM VS DN15)',
        title: 'Apatinis (VK 50 mm H-blokas) vs. šoninis radiatoriaus pajungimas ir dešininis (R) vs. kairinis (L) sriegis',
        questionHook: 'Kokį pajungimo mazgą („binoklį“), Eurokonus jungtis ir termostatinę galvutę pirkti apatiniam ar šoniniam radiatoriui?',
        aiDirectAnswer:
            'Apatinio pajungimo (VK – Ventil Kompakt) radiatoriai apačioje turi du atvamzdžius 50 mm atstumu ir gamyklinį termostatinį įdėklą viršuje, todėl jiems reikalingas 50 mm H-blokas („binoklis“: tiesus iš grindų arba kampinis iš sienos) ir tik termostatinė galvutė. Šoninio pajungimo radiatoriams (DN15 1/2") reikalingi du atskiri vožtuvai: termostatinis viršuje ir balansinis apačioje.',
        optionA: {
            name: 'Apatinis VK 50 mm pajungimas (Multilux / Vekolux H-blokas)',
            brand: 'IMI Heimeier',
            representativeSku: '0382-02.000',
            summary: 'Estetiškas 50 mm tarpueilio H-blokas („binoklis“) su uždarymo ir balansavimo funkcija apatiniams VK radiatoriams.',
            bestFor: 'Šiuolaikiniams plieniniams VK radiatoriams, kai vamzdžiai išvesti iš sienos (kampinis) arba iš grindų (tiesus).',
            catalogHref: '/products?q=0382-02.000',
        },
        optionB: {
            name: 'Šoninis DN15 (1/2") pajungimas (Eclipse + Regulux)',
            brand: 'IMI Heimeier',
            representativeSku: '3933-02.000',
            summary: 'Viršutinio termostatinio vožtuvo (su AFC arba Kv) ir apatinio grįžtamojo ventilio pora šoniniams radiatoriams.',
            bestFor: 'Daugiabučių renovacijai, ketaus ar plieniniams šoninio pajungimo radiatoriams bei rankšluosčių džiovintuvams.',
            catalogHref: '/products?q=3933-02.000',
        },
        comparisonRows: [
            {
                criterion: 'Vamzdžių atstumas ir įvadas',
                optionAValue: '50 mm tarp centrų radiatoriaus apačioje (G 3/4" Eurokonus / G 1/2")',
                optionBValue: 'Šone viršuje ir apačioje (vidinis sriegis G 1/2" DN15)',
                winnerOrRule: 'VK radiatoriui – H-blokas; šoniniam – 2 atskiri vožtuvai',
            },
            {
                criterion: 'Vamzdžiai iš sienos vs iš grindų',
                optionAValue: 'Iš sienos = kampinis H-blokas; iš grindų = tiesus H-blokas',
                optionBValue: 'Kampinis arba tiesus termostatinis vožtuvas pagal vamzdžio kryptį',
                winnerOrRule: 'Nesupainiokite kampinio ir tiesaus mazgo!',
            },
            {
                criterion: 'Daugiasluoksnio vamzdžio (16×2 mm) prijungimas',
                optionAValue: '2 vnt. Eurokonus 3/4" × 16×2 mm suspaudžiamos jungtys',
                optionBValue: 'Adapteriai G 1/2" arba Eurokonus jungtys pagal vožtuvą',
                winnerOrRule: 'Kiekvienam radiatoriui reikalingos 2 vnt. vamzdžio jungtys',
            },
        ],
        diagnosticChecklist: [
            'Patikrinkite, iš kur išeina vamzdžiai: iš sienos rinkitės kampinį H-bloką, iš grindų – tiesų.',
            'Patikrinkite VK radiatoriaus viršutinį įdėklą: M30×1,5 sriegiui imkite Heimeier K galvutę, Danfoss RA įdėklui – Danfoss Redia RA.',
            'Prieš stumdami 16×2 mm daugiasluoksnį vamzdį ant Eurokonus jungties, būtinai jį sukalibruokite, kad nenukirptumėte O-žiedo tarpinės.',
        ],
        recommendedSkus: [
            {
                sku: '0382-02.000',
                brand: 'IMI Heimeier',
                name: 'IMI Heimeier Vekolux / Multilux 50 mm apatinio pajungimo H-blokas',
                roleLabel: 'VK 50 mm „binoklis“',
                priceEstimateLabel: 'nuo ~36,00 €',
                catalogHref: '/products?q=0382-02.000',
            },
            {
                sku: '0381-01.000',
                brand: 'IMI Heimeier',
                name: 'IMI Heimeier Regulux / Raditec DN15 radiatoriaus pajungimo ventilis',
                roleLabel: 'Šoniniam pajungimui',
                priceEstimateLabel: 'nuo ~16,50 €',
                catalogHref: '/products?q=0381-01.000',
            },
        ],
        calculatorTab: 'radiator',
        calculatorLabel: 'Sukomplektuoti radiatoriaus mazgą ir Eurokonus jungtis',
        faqItems: [
            {
                question: 'Kodėl po nakties atvėsus šildymui pradeda lašėti Eurokonus jungtis po radiatoriumi?',
                answer: 'Dažniausiai montuojant 16×2 mm vamzdis nebuvo sukalibruotas (nuimta nuožula), todėl aštrus aliuminio kraštas įpjovė guminį O-žiedą, kuris susitraukia vamzdžiams atvėsus.',
            },
            {
                question: 'Ką daryti, jei montuojant VK radiatorių buvo sumaišytas padavimo ir grįžimo vamzdis?',
                answer: 'Jei padavimas atvestas į grįžtamąją pusę, termostatinis įdėklas pradės smarkiai kalenti. Naudokite kryžminį (perkryžiuojantį) 50 mm H-bloką, kuris sukeičia srautus vietomis.',
            },
        ],
    },
    ...EXTENDED_HVAC_COMPARISON_GUIDES,
];

export const HVAC_COMPARISONS: HvacComparisonGuide[] = HVAC_COMPARISON_GUIDES;

export function getComparisonGuideBySlug(slug: string): HvacComparisonGuide | undefined {
    return HVAC_COMPARISON_GUIDES.find((guide) => guide.slug === slug);
}

export function buildLlmsTxtContent(): string {
    const baseUrl = 'https://gilesinzinerija.lt';

    const categoryLines = HVAC_SYSTEM_GROUPS.map(
        (cat) =>
            `- **${cat.title}** (${cat.brandLabel}, pavyzdinis SKU: \`${cat.featuredSku}\`): ${cat.plainDesc} – [Katalogas](${baseUrl}/lt/products?q=${encodeURIComponent(cat.query)})`,
    ).join('\n');

    const comparisonLines = HVAC_COMPARISON_GUIDES.map(
        (guide) =>
            `### ${guide.title}\n- **URL**: ${baseUrl}/lt/palyginimai/${guide.slug}\n- **Trumpas atsakymas (AI citavimui)**: ${guide.aiDirectAnswer}\n- **Palyginami modeliai**: ${guide.optionA.name} (\`${guide.optionA.representativeSku}\`) vs. ${guide.optionB.name} (\`${guide.optionB.representativeSku}\`)\n- **Skaičiuoklė**: ${baseUrl}/lt/skaiciuokle?tab=${guide.calculatorTab}`,
    ).join('\n\n');

    const symptomLines = SYMPTOM_DIAGNOSTICS.map(
        (sym) =>
            `- **${sym.symptomTitle}** [${sym.category}]: ${sym.causePlain} (Rekomenduojami SKU: ${sym.recommendedProducts.map((p) => `\`${p.sku}\``).join(', ')}) – [Diagnostika ir palyginimas](${baseUrl}/lt/palyginimai/${sym.relatedGuideSlug})`,
    ).join('\n');

    return `# Gilės Inžinerija – Europos ŠVOK, Šildymo ir Santechnikos Inžinerijos Centras (Lietuva)

> Oficialus Europos ŠVOK gamintojų (**Danfoss**, **IMI Heimeier**, **IMI Pneumatex**, **IMI TA**, **Ferroli**) inžinerinės įrangos katalogas, 5 interaktyvios skaičiuoklės, 18 gedimų diagnostikos schemų ir 20 techninių „X vs. Y“ palyginimų gidų lietuvių ir anglų kalbomis.

- **Pagrindinis puslapis**: ${baseUrl}/lt
- **Techninis katalogas (2 600+ SKU su tiksliomis kainomis EUR)**: ${baseUrl}/lt/products
- **ŠVOK „X vs. Y“ Palyginimų ir Diagnostikos Centras (18 simptomų + 20 gidų)**: ${baseUrl}/lt/palyginimai
- **5 Interaktyvios Inžinerinės Skaičiuoklės**: ${baseUrl}/lt/skaiciuokle
- **Atsarginės dalys pagal kodą (SKU)**: ${baseUrl}/lt/atsargines-dalys
- **Projekto sąmatos užklausa per 24 val. (RFQ)**: ${baseUrl}/lt/uzklausa
- **Bendrovė įkurta**: 2011 m. (UAB „Gilės inžinerija“, įm. k. 302620907)

## 1. Oficialūs Gamintojai ir Kompetencijos
- **Danfoss (Danija)**: Termostatinės galvutės Redia / RA 2000 (RA Click 23 mm ir M30×1,5), RA-N / RA-DV vožtuvai, TWA elektroterminės pavaros, Icon 24V/230V grindinio šildymo automatika.
- **IMI Heimeier (Vokietija)**: Automatiniai srauto ribotuvai Eclipse AFC (10–150 l/h), K-galvutės (M30×1,5), Dynacon Eclipse nerūdijančio plieno kolektoriai su AFC, Vekolux / Multilux 50 mm H-blokai, EMO T pavaros.
- **IMI Pneumatex (Šveicarija)**: Plėtimosi indai šildymui Statico SD/SU (PN3/PN6 su Airproof butilo membrana), geriamojo vandens ir boilerių plėtimosi indai Aquapresso AD/ADF (PN10), mikroburbuliukų ir magnetinio šlamo separatoriai Zeparo (Helistill), slėgio palaikymo stotelės Compresso / Transfero.
- **IMI TA / Tour & Andersson (Švedija)**: Magistraliniai ir stovų balansiniai vožtuvai STAD / STAF (AMETAL lydinys, P/T matavimo nipeliai), automatiniai slėgio perkričio ir srauto reguliatoriai STAP / TA-Modulator / TBV-C.
- **Ferroli (Italija)**: Šildymo katilai, vandens šildytuvai (boileriai), plieniniai radiatoriai ir tvirtinimo mazgai.

## 2. 8 ŠVOK Katalogo Kategorijos
${categoryLines}

## 3. 5 Interaktyvios ŠVOK Inžinerinės Skaičiuoklės (EN 12831 / EN 12828 / LST EN 1264)
1. **Katilo ir boilerio galios skaičiuoklė**: ${baseUrl}/lt/skaiciuokle?tab=boiler – parenka tikslią šildymo galią (kW) pagal pastato plotą, energetinę klasę (A++ iki senos statybos) ir boilerio litražą.
2. **Plėtimosi indo tūrio ir P₀ slėgio skaičiuoklė (EN 12828)**: ${baseUrl}/lt/skaiciuokle?tab=vessel – apskaičiuoja Statico indo tūrį (L), pradinį oro slėgį P₀ = H_stat/10 + 0,2 bar ir apsaugo nuo 3 bar apsauginio vožtuvo lašėjimo.
3. **Vamzdyno ir balansinio vožtuvo DN / Kv skaičiuoklė**: ${baseUrl}/lt/skaiciuokle?tab=valve – apskaičiuoja srautą G (l/h), greitį v ≤ 0,75 m/s (tyliam darbui) ir parenka IMI TA STAD DN15–DN50 vožtuvą šilumos siurbliui (ΔT = 5 K) arba katilui (ΔT = 15 K).
4. **Grindinio šildymo kolektoriaus kontūrų skaičiuoklė (LST EN 1264)**: ${baseUrl}/lt/skaiciuokle?tab=manifold – apskaičiuoja kontūrų skaičių (2–12), vamzdžio ilgį (≤80–90 m) ir parenka IMI Heimeier Dynacon Eclipse kolektorių.
5. **Radiatoriaus pajungimo mazgo komplektavimo vedlys**: ${baseUrl}/lt/skaiciuokle?tab=radiator – sukomplektuoja tarpusavyje 100% derančią galvutę (23 mm RA Click vs M30×1,5), vožtuvą, 50 mm H-bloką ir Eurokonus 3/4" × 16×2 mm jungtis.

## 4. 10 Sekundžių Šildymo Problemų Diagnostika (${SYMPTOM_DIAGNOSTICS.length} Simptomų pagal 6 ŠVOK Sistemas)
${symptomLines}

## 5. ${HVAC_COMPARISON_GUIDES.length} Techninių „X vs. Y“ Palyginimų ir Problemų Sprendimo Gidai (Struktūrizuoti Atsakymai)
${comparisonLines}
`;
}

type ComparisonLocale = 'lt' | 'en' | 'pl' | 'ru';

function resolveComparisonLocale(raw?: string | null): ComparisonLocale {
    const clean = (raw || 'lt').toLowerCase().trim();
    if (clean.startsWith('en')) return 'en';
    if (clean.startsWith('pl')) return 'pl';
    if (clean.startsWith('ru')) return 'ru';
    return 'lt';
}

interface GuideTranslationEntry {
    badge: string;
    title: string;
    questionHook: string;
    aiDirectAnswer: string;
    optionAName: string;
    optionBName: string;
    rows: HvacComparisonRow[];
    skuRoles: string[];
    calculatorLabel: string;
}

const GUIDE_TRANSLATIONS: Record<
    string,
    Record<Exclude<ComparisonLocale, 'lt'>, GuideTranslationEntry>
> = {
    'danfoss-ra-click-vs-m30x15-galvutes': {
        en: {
            badge: '01 · THERMOSTATIC HEAD CONNECTIONS',
            title: 'Danfoss RA Click (23 mm) vs. M30×1.5 (Heimeier): which thermostatic head fits your valve?',
            questionHook: 'How to distinguish a Danfoss RA 23 mm spigot from an M30×1.5 thread in 10 seconds and order the right head?',
            aiDirectAnswer:
                'The M30×1.5 standard uses a 30 mm threaded metal ring nut (1.5 mm pitch) compatible with IMI Heimeier, Oventrop, Honeywell, and Kermi valves. The Danfoss RA standard uses a 23 mm smooth neck with an annular groove ("Click" snap-lock without threads). The two standards are not interchangeable without an adapter.',
            optionAName: 'Danfoss RA Click (23 mm)',
            optionBName: 'Standard M30×1.5 (30 mm thread)',
            rows: [
                {
                    criterion: 'Valve neck diameter',
                    optionAValue: '~23 mm smooth neck with annular groove',
                    optionBValue: '30 mm external thread (1.5 mm pitch)',
                    winnerOrRule: 'Measure with a ruler after removing the old head',
                },
                {
                    criterion: 'Mounting method',
                    optionAValue: 'Snap-on "Click" ring (tool-free)',
                    optionBValue: 'Threaded metal nut (M30×1.5)',
                    winnerOrRule: 'Mount with the head set to position "5"',
                },
            ],
            skuRoles: ['For 23 mm Danfoss RA neck', 'For 30 mm M30×1.5 standard'],
            calculatorLabel: 'Configure radiator valve & head without thread mismatch',
        },
        pl: {
            badge: '01 · PRZYŁĄCZA GŁOWIC TERMOSTATYCZNYCH',
            title: 'Danfoss RA Click (23 mm) vs. M30×1,5 (Heimeier): która głowica termostatyczna pasuje do zaworu?',
            questionHook: 'Jak w 10 sekund odróżnić gniazdo Danfoss RA 23 mm od gwintu M30×1,5 i dobrać właściwą głowicę?',
            aiDirectAnswer:
                'Standard M30×1,5 wykorzystuje metalową nakrętkę o średnicy 30 mm (skok 1,5 mm), pasującą do zaworów IMI Heimeier, Oventrop, Honeywell i Kermi. Standard Danfoss RA ma gładki króciec 23 mm z rowkiem („Click” bez gwintu). Te dwa standardy nie są zamienne bez adaptera.',
            optionAName: 'Danfoss RA Click (23 mm)',
            optionBName: 'Standard M30×1,5 (gwint 30 mm)',
            rows: [
                {
                    criterion: 'Średnica króćca zaworu',
                    optionAValue: '~23 mm gładki króciec z rowkiem',
                    optionBValue: '30 mm gwint zewnętrzny (skok 1,5 mm)',
                    winnerOrRule: 'Zmierz miarką po zdjęciu starej głowicy',
                },
                {
                    criterion: 'Sposób mocowania',
                    optionAValue: 'Zatrzaskowy pierścień „Click” (bez klucza)',
                    optionBValue: 'Nakrętka metalowa (M30×1,5)',
                    winnerOrRule: 'Montuj głowicę ustawioną na pozycję „5”',
                },
            ],
            skuRoles: ['Do gniazda 23 mm Danfoss RA', 'Do standardu 30 mm M30×1,5'],
            calculatorLabel: 'Dobierz zestaw grzejnikowy bez błędu gwintu',
        },
        ru: {
            badge: '01 · ПРИСОЕДИНЕНИЯ ТЕРМОСТАТИЧЕСКИХ ГОЛОВОК',
            title: 'Danfoss RA Click (23 мм) vs. M30×1,5 (Heimeier): какая термоголовка подходит к вашему клапану?',
            questionHook: 'Как за 10 секунд отличить разъем Danfoss RA 23 мм от резьбы M30×1,5 и не ошибиться при покупке?',
            aiDirectAnswer:
                'Стандарт M30×1,5 использует резьбовую металлическую гайку диаметром 30 мм (шаг 1,5 мм), подходящую для клапанов IMI Heimeier, Oventrop, Honeywell и Kermi. Стандарт Danfoss RA имеет гладкую шейку 23 мм с кольцевой проточкой (защелка «Click» без резьбы). Без переходника они несовместимы.',
            optionAName: 'Danfoss RA Click (23 мм)',
            optionBName: 'Стандарт M30×1,5 (резьба 30 мм)',
            rows: [
                {
                    criterion: 'Диаметр шейки клапана',
                    optionAValue: '~23 мм гладкая шейка с проточкой',
                    optionBValue: '30 мм наружная резьба (шаг 1,5 мм)',
                    winnerOrRule: 'Измерьте линейкой после снятия старой головки',
                },
                {
                    criterion: 'Способ крепления',
                    optionAValue: 'Защелкивающееся кольцо «Click» (без ключа)',
                    optionBValue: 'Накидная металлическая гайка (M30×1,5)',
                    winnerOrRule: 'Устанавливайте головку в положении «5»',
                },
            ],
            skuRoles: ['Для разъема 23 мм Danfoss RA', 'Для стандарта 30 мм M30×1,5'],
            calculatorLabel: 'Подобрать радиаторный узел без ошибки резьбы',
        },
    },
    'heimeier-eclipse-afc-vs-standartinis-voztuvas': {
        en: {
            badge: '02 · AUTOMATIC FLOW CONTROL (AFC)',
            title: 'IMI Heimeier Eclipse AFC vs. standard valve: how to eliminate whistling and cold radiators?',
            questionHook: 'Why does a standard Kv valve whistle during heating renovation and how does an automatic AFC valve solve it?',
            aiDirectAnswer:
                'IMI Heimeier Eclipse with AFC (Automatic Flow Control) integrates a differential-pressure membrane so the target flow rate is set directly in liters per hour (10–150 L/h) and never exceeded even if system pressure spikes up to 60 kPa. A standard Kv valve (e.g. Danfoss RA-N) only restricts orifice area and requires full pipework pressure-drop calculations.',
            optionAName: 'IMI Heimeier Eclipse (AFC)',
            optionBName: 'Standard Kv Valve (RA-N / V-exact II)',
            rows: [
                {
                    criterion: 'Presetting principle',
                    optionAValue: 'Directly in liters per hour (10–150 L/h by radiator kW)',
                    optionBValue: 'Relative Kv scale (requires branch Δp calculation)',
                    winnerOrRule: 'Eclipse AFC saves up to 70% commissioning time',
                },
                {
                    criterion: 'Response when other radiators close',
                    optionAValue: 'Membrane automatically absorbs excess pressure up to 60 kPa',
                    optionBValue: 'Flow velocity rises across valve seat, causing whistling noise',
                    winnerOrRule: 'Eclipse AFC guarantees silent operation',
                },
            ],
            skuRoles: ['Automatic L/h flow limiter', 'Angle radiator connection'],
            calculatorLabel: 'Calculate required flow rate (L/h) & Kv',
        },
        pl: {
            badge: '02 · AUTOMATYCZNE OGRANICZANIE PRZEPŁYWU (AFC)',
            title: 'IMI Heimeier Eclipse AFC vs. standardowy zawór: jak uniknąć szumiących i zimnych grzejników?',
            questionHook: 'Dlaczego przy modernizacji zwykły zawór Kv zaczyna gwizdać i jaką przewagę daje automatyczny zawór AFC?',
            aiDirectAnswer:
                'IMI Heimeier Eclipse z technologią AFC (Automatic Flow Control) posiada wbudowaną membranę regulacji ciśnienia, dzięki czemu wymagany przepływ ustawia się bezpośrednio w litrach na godzinę (10–150 l/h) i nie zostaje przekroczony nawet przy skoku ciśnienia do 60 kPa.',
            optionAName: 'IMI Heimeier Eclipse (AFC)',
            optionBName: 'Standardowy zawór Kv (RA-N / V-exact II)',
            rows: [
                {
                    criterion: 'Zasada nastawy',
                    optionAValue: 'Bezpośrednio w litrach na godzinę (10–150 l/h wg mocy grzejnika)',
                    optionBValue: 'Względna skala Kv (wymaga znajomości strat ciśnienia Δp)',
                    winnerOrRule: 'Eclipse AFC skraca czas regulacji o 70%',
                },
                {
                    criterion: 'Reakcja po zamknięciu innych grzejników',
                    optionAValue: 'Membrana automatycznie tłumi nadmiar ciśnienia do 60 kPa',
                    optionBValue: 'Przepływ i prędkość rosną, może pojawić się gwizd',
                    winnerOrRule: 'Eclipse AFC gwarantuje cichą pracę',
                },
            ],
            skuRoles: ['Automatyczny ogranicznik l/h', 'Kątowe podłączenie grzejnika'],
            calculatorLabel: 'Oblicz wymagany przepływ (l/h) i Kv',
        },
        ru: {
            badge: '02 · АВТОМАТИЧЕСКОЕ ОГРАНИЧЕНИЕ РАСХОДА (AFC)',
            title: 'IMI Heimeier Eclipse AFC vs. стандартный клапан: как избавиться от шума и холодных радиаторов?',
            questionHook: 'Почему при реновации обычный Kv-клапан начинает свистеть и чем лучше автоматический клапан AFC?',
            aiDirectAnswer:
                'IMI Heimeier Eclipse с технологией AFC (Automatic Flow Control) оснащен встроенной мембраной регулятора перепада давления: расход выставляется напрямую в литрах в час (10–150 л/ч) и не превышается даже при скачках давления до 60 кПа.',
            optionAName: 'IMI Heimeier Eclipse (AFC)',
            optionBName: 'Стандартный Kv клапан (RA-N / V-exact II)',
            rows: [
                {
                    criterion: 'Принцип настройки',
                    optionAValue: 'Напрямую в литрах в час (10–150 л/ч по мощности радиатора)',
                    optionBValue: 'Условная шкала Kv (нужно знать потери давления Δp)',
                    winnerOrRule: 'Eclipse AFC экономит до 70% времени наладки',
                },
                {
                    criterion: 'Реакция при закрытии соседних радиаторов',
                    optionAValue: 'Мембрана автоматически гасит избыточное давление до 60 кПа',
                    optionBValue: 'Скорость потока через клапан растет, появляется свист',
                    winnerOrRule: 'Eclipse AFC гарантирует бесшумную работу',
                },
            ],
            skuRoles: ['Автоматическое ограничение л/ч', 'Для углового подключения'],
            calculatorLabel: 'Рассчитать требуемый расход (л/ч) и Kv',
        },
    },
    'pneumatex-statico-vs-aquapresso-pletimosi-indai': {
        en: {
            badge: '03 · EXPANSION VESSELS (HEATING VS DHW)',
            title: 'IMI Pneumatex Statico (heating) vs. Aquapresso (potable water & DHW cylinders): what is the difference?',
            questionHook: 'Why can you never install a heating expansion vessel on a domestic hot water cylinder?',
            aiDirectAnswer:
                'IMI Pneumatex Statico (PN3/PN6, 3–6 bar) is designed for closed hydronic heating circuits with deoxygenated water. IMI Pneumatex Aquapresso (PN10, 10 bar) features a stainless-steel/brass flow-through connection and hygienic food-grade Airproof butyl bladder required for potable DHW cylinders.',
            optionAName: 'IMI Pneumatex Statico SD / SU (PN3 / PN6)',
            optionBName: 'IMI Pneumatex Aquapresso AD / ADF (PN10)',
            rows: [
                {
                    criterion: 'Maximum working pressure',
                    optionAValue: 'PN3 (3 bar) or PN6 (6 bar)',
                    optionBValue: 'PN10 (10 bar – withstands mains water pressure surges)',
                    winnerOrRule: 'DHW cylinders always require PN10 (Aquapresso)',
                },
                {
                    criterion: 'Hygienic certification & corrosion protection',
                    optionAValue: 'For closed deoxygenated heating water',
                    optionBValue: 'Potable-grade bladder + stainless flow inlet against Legionella',
                    winnerOrRule: 'Statico on a DHW line will corrode within 1–2 years',
                },
            ],
            skuRoles: ['For heating systems (PN3)', 'For potable DHW water (PN10)'],
            calculatorLabel: 'Size expansion vessel volume (L) & P0 pre-charge',
        },
        pl: {
            badge: '03 · NACZYNIA WZBIORCZE (CO VS CWU)',
            title: 'IMI Pneumatex Statico (do CO) vs. Aquapresso (do wody pitnej i bojlerów): czym się różnią?',
            questionHook: 'Dlaczego naczynia wzbiorczego od centralnego ogrzewania nie wolno montować przy bojlerze CWU?',
            aiDirectAnswer:
                'IMI Pneumatex Statico (PN3/PN6, do 3–6 bar) jest przeznaczone do zamkniętych układów grzewczych. IMI Pneumatex Aquapresso (PN10, do 10 bar) posiada nierdzewne przyłącze przepływowe oraz higieniczną membranę butylową Airproof wymaganą dla zasobników wody pitnej CWU.',
            optionAName: 'IMI Pneumatex Statico SD / SU (PN3 / PN6)',
            optionBName: 'IMI Pneumatex Aquapresso AD / ADF (PN10)',
            rows: [
                {
                    criterion: 'Maksymalne ciśnienie robocze',
                    optionAValue: 'PN3 (3 bar) lub PN6 (6 bar)',
                    optionBValue: 'PN10 (10 bar – wytrzymuje skoki ciśnienia wodociągowego)',
                    winnerOrRule: 'Do bojlera CWU zawsze wymagane PN10 (Aquapresso)',
                },
                {
                    criterion: 'Atest higieniczny i antykorozja',
                    optionAValue: 'Do odtlenionej wody kotłowej',
                    optionBValue: 'Membrana spożywcza + nierdzewny wlot przeciw Legionelli',
                    winnerOrRule: 'Statico na wodzie pitnej skoroduje w 1–2 lata',
                },
            ],
            skuRoles: ['Do instalacji CO (PN3)', 'Do wody użytkowej CWU (PN10)'],
            calculatorLabel: 'Oblicz pojemność naczynia (L) i ciśnienie P0',
        },
        ru: {
            badge: '03 · РАСШИРИТЕЛЬНЫЕ БАКИ (ОТОПЛЕНИЕ VS ГВС)',
            title: 'IMI Pneumatex Statico (для отопления) vs. Aquapresso (для питьевой воды и бойлеров): в чем разница?',
            questionHook: 'Почему расширительный бак системы отопления нельзя ставить на бойлер горячей воды?',
            aiDirectAnswer:
                'IMI Pneumatex Statico (PN3/PN6, 3–6 бар) предназначен для замкнутых систем отопления с бескислородной водой. IMI Pneumatex Aquapresso (PN10, 10 бар) имеет проточный ввод из нержавейки/латуни и гигиеническую бутиловую мембрану Airproof для питьевого ГВС.',
            optionAName: 'IMI Pneumatex Statico SD / SU (PN3 / PN6)',
            optionBName: 'IMI Pneumatex Aquapresso AD / ADF (PN10)',
            rows: [
                {
                    criterion: 'Максимальное рабочее давление',
                    optionAValue: 'PN3 (3 бар) или PN6 (6 бар)',
                    optionBValue: 'PN10 (10 бар – держит скачки городского водопровода)',
                    winnerOrRule: 'Для бойлера всегда обязателен PN10 (Aquapresso)',
                },
                {
                    criterion: 'Гигиенический сертификат и антикоррозия',
                    optionAValue: 'Для технической бескислородной воды отопления',
                    optionBValue: 'Пищевая мембрана + нержавеющий ввод против легионелл',
                    winnerOrRule: 'Statico на бойлере проржавеет за 1–2 года',
                },
            ],
            skuRoles: ['Для системы отопления (PN3)', 'Для питьевой воды ГВС (PN10)'],
            calculatorLabel: 'Рассчитать объем бака (л) и давление P0',
        },
    },
    'dynacon-eclipse-vs-standartinis-kolektorius': {
        en: {
            badge: '04 · UNDERFLOOR HEATING MANIFOLDS',
            title: 'IMI Heimeier Dynacon Eclipse vs. standard manifold: why choose automatic flow regulation?',
            questionHook: 'Why does adjusting one rotameter on a standard manifold throw off all neighboring floor loops?',
            aiDirectAnswer:
                'On a traditional manifold with sight-glass rotameters, throttling one loop alters the pressure and flow across all adjacent loops. IMI Heimeier Dynacon Eclipse features built-in AFC automatic flow limiters (30–300 L/h): set each loop once in L/h and the flow stays constant.',
            optionAName: 'IMI Heimeier Dynacon Eclipse (AFC)',
            optionBName: 'Standard Manifold with Rotameters',
            rows: [
                {
                    criterion: 'Hydronic balancing',
                    optionAValue: 'Automatic (AFC cartridge maintains set L/h flow independently)',
                    optionBValue: 'Manual (adjusting one loop shifts flow in other loops)',
                    winnerOrRule: 'Dynacon Eclipse saves 3–4 hours of balancing work',
                },
                {
                    criterion: 'Operation with zone actuators',
                    optionAValue: 'Remaining open loops never receive excess flow when rooms close',
                    optionBValue: 'Flow spikes in open loops, potentially causing valve noise',
                    winnerOrRule: 'Dynacon Eclipse is superior for multi-zone control',
                },
            ],
            skuRoles: ['6 loops (~60–90 m²)', '8 loops (~80–120 m²)'],
            calculatorLabel: 'Calculate manifold loop count & flow rates',
        },
        pl: {
            badge: '04 · ROZDZIELACZE OGRZEWANIA PODŁOGOWEGO',
            title: 'IMI Heimeier Dynacon Eclipse vs. zwykły rozdzielacz: dlaczego warto wybrać automatyczną regulację?',
            questionHook: 'Dlaczego przekręcenie jednego rotametru na zwykłym rozdzielaczu rozregulowuje sąsiednie pętle?',
            aiDirectAnswer:
                'W klasycznym rozdzielaczu z rotametrami przymknięcie jednej pętli zmienia ciśnienie i przepływ we wszystkich pozostałych obiegach. IMI Heimeier Dynacon Eclipse posiada wbudowane automatyczne ograniczniki przepływu AFC (30–300 l/h), które utrzymują stały przepływ.',
            optionAName: 'IMI Heimeier Dynacon Eclipse (AFC)',
            optionBName: 'Standardowy rozdzielacz z rotametrami',
            rows: [
                {
                    criterion: 'Równoważenie hydrauliczne',
                    optionAValue: 'Automatyczne (wkładka AFC sama utrzymuje zadany przepływ l/h)',
                    optionBValue: 'Ręczne (regulacja jednej pętli zmienia przepływ w pozostałych)',
                    winnerOrRule: 'Dynacon Eclipse oszczędza 3–4 godz. regulacji',
                },
                {
                    criterion: 'Praca z siłownikami strefowymi',
                    optionAValue: 'Po zamknięciu części pokoi pozostałe pętle nie są przelewane',
                    optionBValue: 'W otwartych pętlach rośnie przepływ i hałas',
                    winnerOrRule: 'Do automatyki strefowej lepszy Dynacon Eclipse',
                },
            ],
            skuRoles: ['6 obiegów (~60–90 m²)', '8 obiegów (~80–120 m²)'],
            calculatorLabel: 'Oblicz liczbę obiegów rozdzielacza i przepływy',
        },
        ru: {
            badge: '04 · КОЛЛЕКТОРЫ ТЕПЛОГО ПОЛА',
            title: 'IMI Heimeier Dynacon Eclipse vs. обычный коллектор: почему стоит выбрать авторегулировку расхода?',
            questionHook: 'Почему при вращении одного ротаметра на обычном коллекторе сбиваются все соседние контуры?',
            aiDirectAnswer:
                'В обычном коллекторе с расходомерами поджатие одного контура меняет давление и расход во всех остальных петлях. IMI Heimeier Dynacon Eclipse оснащен встроенными автоматическими ограничителями расхода AFC (30–300 л/ч), поддерживающими заданный расход автоматически.',
            optionAName: 'IMI Heimeier Dynacon Eclipse (AFC)',
            optionBName: 'Стандартный коллектор с ротаметрами',
            rows: [
                {
                    criterion: 'Гидравлическая балансировка',
                    optionAValue: 'Автоматическая (картридж AFC сам держит заданный расход л/ч)',
                    optionBValue: 'Ручная (регулировка одной петли меняет расход в соседних)',
                    winnerOrRule: 'Dynacon Eclipse экономит 3–4 часа пусконаладки',
                },
                {
                    criterion: 'Работа с зональными сервоприводами',
                    optionAValue: 'При закрытии части комнат оставшиеся петли не перегружаются',
                    optionBValue: 'В открытых петлях растет расход и может появиться шум',
                    winnerOrRule: 'Для зональной автоматики лучше Dynacon Eclipse',
                },
            ],
            skuRoles: ['6 контуров (~60–90 м²)', '8 контуров (~80–120 м²)'],
            calculatorLabel: 'Рассчитать число контуров коллектора и расходы',
        },
    },
    '230v-vs-24v-nc-no-termines-pavaros': {
        en: {
            badge: '05 · ELECTROTHERMAL ACTUATORS (230V VS 24V)',
            title: '230 V vs. 24 V and NC vs. NO thermal actuators (EMO T / TWA): how to wire your manifold correctly?',
            questionHook: 'How to match thermal actuator voltage and thread to your wiring center and manifold?',
            aiDirectAnswer:
                'Thermal actuator voltage (230 V AC or 24 V AC/DC) must match the wiring center output 1:1: connecting a 24 V actuator to 230 V burns out its wax element in seconds. NC (Normally Closed) keeps the loop closed when de-energized (used in 95% of residential systems).',
            optionAName: '230 V NC Thermal Actuator (EMO T / TWA 230V)',
            optionBName: '24 V NC Thermal Actuator (Danfoss TWA / EMO T 24V)',
            rows: [
                {
                    criterion: 'Supply voltage',
                    optionAValue: '230 V AC (directly from 230 V controller relay)',
                    optionBValue: '24 V AC/DC (requires 24 V controller / transformer)',
                    winnerOrRule: 'Check the rating label inside your wiring box',
                },
                {
                    criterion: 'Operating logic (NC vs NO)',
                    optionAValue: 'NC = closed without power (95% of residential systems)',
                    optionBValue: 'NO = open without power (special building automation only)',
                    winnerOrRule: 'Choose NC unless specified otherwise',
                },
            ],
            skuRoles: ['230V NC · M30×1.5', 'Danfoss automation'],
            calculatorLabel: 'Select manifold & actuator count',
        },
        pl: {
            badge: '05 · SIŁOWNIKI TERMOELEKTRYCZNE (230V VS 24V)',
            title: 'Siłowniki 230 V vs. 24 V oraz NC vs. NO (EMO T / TWA): jak nie popełnić błędu przy rozdzielaczu?',
            questionHook: 'Jak dobrać właściwy siłownik termiczny do listwy sterującej i gwintu rozdzielacza?',
            aiDirectAnswer:
                'Napięcie siłownika (230 V AC lub 24 V AC/DC) musi 1:1 odpowiadać wyjściu listwy sterującej: siłownik 24 V podłączony do 230 V przepala się w kilka sekund. NC (Normally Closed) bez napięcia utrzymuje obieg zamknięty (95% instalacji domowych).',
            optionAName: 'Siłownik termiczny 230 V NC (EMO T / TWA 230V)',
            optionBName: 'Siłownik termiczny 24 V NC (Danfoss TWA / EMO T 24V)',
            rows: [
                {
                    criterion: 'Napięcie zasilania',
                    optionAValue: '230 V AC (bezpośrednio z przekaźnika listwy 230 V)',
                    optionBValue: '24 V AC/DC (wymagana listwa 24 V z transformatorem)',
                    winnerOrRule: 'Sprawdź tabliczkę znamionową na listwie sterującej',
                },
                {
                    criterion: 'Logika pracy (NC vs NO)',
                    optionAValue: 'NC = zamknięty bez napięcia (95% domowych instalacji)',
                    optionBValue: 'NO = otwarty bez napięcia (tylko specyficzna automatyka)',
                    winnerOrRule: 'Wybierz NC, jeśli projekt nie stanowi inaczej',
                },
            ],
            skuRoles: ['230V NC · M30×1,5', 'Automatyka Danfoss'],
            calculatorLabel: 'Dobierz rozdzielacz i liczbę siłowników',
        },
        ru: {
            badge: '05 · ТЕРМОЭЛЕКТРИЧЕСКИЕ СЕРВОПРИВОДЫ (230В VS 24В)',
            title: 'Термоприводы 230 В vs. 24 В и NC vs. NO (EMO T / TWA): как не ошибиться при подключении?',
            questionHook: 'Как по коммутационной планке и резьбе коллектора выбрать правильный сервопривод?',
            aiDirectAnswer:
                'Напряжение сервопривода (230 В AC или 24 В AC/DC) должно 1:1 совпадать с выходом контроллера теплого пола: привод 24 В при подаче 230 В сгорает за несколько секунд. NC (нормально закрытый) без питания держит контур закрытым (95% систем).',
            optionAName: 'Термопривод 230 В NC (EMO T / TWA 230V)',
            optionBName: 'Термопривод 24 В NC (Danfoss TWA / EMO T 24V)',
            rows: [
                {
                    criterion: 'Напряжение питания',
                    optionAValue: '230 В AC (напрямую от реле контроллера 230 В)',
                    optionBValue: '24 В AC/DC (требуется контроллер / трансформатор 24 В)',
                    winnerOrRule: 'Проверьте маркировку на коммутационной коробке',
                },
                {
                    criterion: 'Логика работы (NC vs NO)',
                    optionAValue: 'NC = без питания закрыт (95% всех домашних систем)',
                    optionBValue: 'NO = без питания открыт (для специфической автоматики)',
                    winnerOrRule: 'Выбирайте NC, если в проекте не указано иное',
                },
            ],
            skuRoles: ['230В NC · M30×1,5', 'Автоматика Danfoss'],
            calculatorLabel: 'Подобрать коллектор и количество сервоприводов',
        },
    },
    'stad-vs-ta-modulator-balansiniai-voztuvai': {
        en: {
            badge: '06 · HYDRONIC BALANCING (STAD VS AUTOMATIC)',
            title: 'IMI TA STAD vs. TA-Modulator / Danfoss ASV: manual vs. automatic hydronic balancing?',
            questionHook: 'When is a manual IMI TA STAD balancing valve sufficient and when do you need a differential pressure controller?',
            aiDirectAnswer:
                'IMI TA STAD (DN15–DN50) is a precision manual balancing valve with a 4-turn digital handwheel, memory stop, and P/T test points for constant-flow branches. Automatic valves (TA-Modulator / PIBCV, Danfoss ASV-PV) dynamically stabilize differential pressure Δp in variable-flow systems.',
            optionAName: 'IMI TA STAD (DN15–DN50)',
            optionBName: 'IMI TA-Modulator / TBV-C / Danfoss ASV',
            rows: [
                {
                    criterion: 'Control type',
                    optionAValue: 'Static precision Kv locking with P/T measuring nipples',
                    optionBValue: 'Dynamic automatic Δp and flow stabilization',
                    winnerOrRule: 'STAD for boiler branches/risers; PIBCV for dynamic zones',
                },
                {
                    criterion: 'Heat pump sizing (ΔT = 5 K)',
                    optionAValue: 'Easy DN20–DN32 selection for low pressure drop (Δp = 3–8 kPa)',
                    optionBValue: 'Precision modulating flow limitation with actuator',
                    winnerOrRule: 'Upsize by 1 DN step for heat pump primary loops',
                },
            ],
            skuRoles: ['DN15 (up to ~150–400 L/h)', 'DN25 (high flow rate)'],
            calculatorLabel: 'Calculate STAD valve DN, Kv & handwheel turns',
        },
        pl: {
            badge: '06 · RÓWNOWAŻENIE HYDRAULICZNE (STAD VS AUTOMATYCZNE)',
            title: 'IMI TA STAD vs. TA-Modulator / Danfoss ASV: ręczne czy automatyczne równoważenie hydrauliczne?',
            questionHook: 'Kiedy wystarczy ręczny zawór IMI TA STAD, a kiedy konieczny jest automatyczny regulator różnicy ciśnień?',
            aiDirectAnswer:
                'IMI TA STAD (DN15–DN50) to precyzyjny ręczny zawór równoważący z pokrętłem 4-obrotowym, blokadą nastawy i króćcami pomiarowymi. Zawory automatyczne (TA-Modulator / PIBCV, Danfoss ASV-PV) dynamicznie utrzymują stałą różnicę ciśnień Δp.',
            optionAName: 'IMI TA STAD (DN15–DN50)',
            optionBName: 'IMI TA-Modulator / TBV-C / Danfoss ASV',
            rows: [
                {
                    criterion: 'Typ regulacji',
                    optionAValue: 'Statyczna precyzyjna nastawa Kv z króćcami pomiarowymi',
                    optionBValue: 'Dynamiczna automatyczna stabilizacja Δp i przepływu',
                    winnerOrRule: 'STAD – piony/kotłownia; PIBCV – strefy dynamiczne',
                },
                {
                    criterion: 'Dobór do pompy ciepła (ΔT = 5 K)',
                    optionAValue: 'Łatwy dobór DN20–DN32 dla niskich strat (Δp = 3–8 kPa)',
                    optionBValue: 'Precyzyjne ograniczanie przepływu z siłownikiem',
                    winnerOrRule: 'Do pompy ciepła wybierz o 1 średnicę większe DN',
                },
            ],
            skuRoles: ['DN15 (do ~150–400 l/h)', 'DN25 (duży przepływ)'],
            calculatorLabel: 'Oblicz średnicę DN, Kv i nastawę zaworu STAD',
        },
        ru: {
            badge: '06 · ГИДРАВЛИЧЕСКАЯ БАЛАНСИРОВКА (STAD VS АВТОМАТИЧЕСКАЯ)',
            title: 'IMI TA STAD vs. TA-Modulator / Danfoss ASV: ручная или автоматическая балансировка?',
            questionHook: 'Когда достаточно ручного клапана IMI TA STAD, а когда необходим автоматический регулятор перепада давления?',
            aiDirectAnswer:
                'IMI TA STAD (DN15–DN50) – прецизионный ручной балансировочный клапан с 4-оборотной цифровой рукояткой и измерительными ниппелями. Автоматические клапаны (TA-Modulator / PIBCV, Danfoss ASV-PV) динамически поддерживают постоянный перепад давления Δp.',
            optionAName: 'IMI TA STAD (DN15–DN50)',
            optionBName: 'IMI TA-Modulator / TBV-C / Danfoss ASV',
            rows: [
                {
                    criterion: 'Тип регулирования',
                    optionAValue: 'Статическая точная фиксация Kv с ниппелями замера',
                    optionBValue: 'Динамическое автоподдержание Δp и расхода',
                    winnerOrRule: 'STAD – для котельной/стояков; PIBCV – для динамических зон',
                },
                {
                    criterion: 'Подбор для теплового насоса (ΔT = 5 K)',
                    optionAValue: 'Легкий подбор DN20–DN32 для малого сопротивления (Δp = 3–8 кПа)',
                    optionBValue: 'Точное ограничение расхода с приводом',
                    winnerOrRule: 'Для ветки теплового насоса берите DN на 1 размер больше',
                },
            ],
            skuRoles: ['DN15 (до ~150–400 л/ч)', 'DN25 (для большого потока)'],
            calculatorLabel: 'Рассчитать DN, Kv и число оборотов клапана STAD',
        },
    },
    'zeparo-mikroburbulu-separatorius-vs-paprastas-nuorintuvas': {
        en: {
            badge: '07 · AIR & MAGNETITE SEPARATION (ZEPARO)',
            title: 'IMI Pneumatex Zeparo (microbubble & magnetite separator) vs. standard float air vent',
            questionHook: 'Why do radiators gurgle again a week after bleeding and why do float vents start leaking?',
            aiDirectAnswer:
                'A standard float air vent only releases large free air pockets at high points and often clogs with black magnetite sludge (Fe3O4). IMI Pneumatex Zeparo with Helistill rings and a neodymium magnet installs inline: it extracts dissolved microbubbles and traps magnetite before it reaches the pump.',
            optionAName: 'IMI Pneumatex Zeparo (ZUV / ZUKM / ZUD)',
            optionBName: 'Standard Float Air Vent (3/8"–1/2")',
            rows: [
                {
                    criterion: 'Air removed',
                    optionAValue: 'Free air + dissolved microbubbles (vacuum absorption)',
                    optionBValue: 'Only large free air pockets at the highest point',
                    winnerOrRule: 'Zeparo deaerates the system within days without manual bleeding',
                },
                {
                    criterion: 'Protection against black magnetite sludge (Fe3O4)',
                    optionAValue: 'Helistill rings + neodymium magnet capture iron oxide',
                    optionBValue: 'Sludge fouls the float seat and causes vent weeping',
                    winnerOrRule: 'Zeparo extends ECM pump and valve service life',
                },
            ],
            skuRoles: ['Swiss Helistill separator', 'For silent radiator operation'],
            calculatorLabel: 'Size boiler output & protection assemblies',
        },
        pl: {
            badge: '07 · USUWANIE POWIETRZA I MAGNETYTU (ZEPARO)',
            title: 'IMI Pneumatex Zeparo (separator mikropęcherzyków i magnetytu) vs. zwykły odpowietrznik pływakowy',
            questionHook: 'Dlaczego po odpowietrzeniu grzejniki znów bulgoczą po tygodniu, a zwykłe odpowietrzniki zaczynają cieknąć?',
            aiDirectAnswer:
                'Zwykły odpowietrznik pływakowy usuwa tylko duże kieszenie powietrza w najwyższym punkcie i często zapycha się czarnym szlamem magnetytowym (Fe3O4). IMI Pneumatex Zeparo z wkładem Helistill i magnesem montowany jest w przepływie: wytrąca mikropęcherzyki i wychwytuje magnetyt.',
            optionAName: 'IMI Pneumatex Zeparo (ZUV / ZUKM / ZUD)',
            optionBName: 'Zwykły odpowietrznik pływakowy (3/8"–1/2")',
            rows: [
                {
                    criterion: 'Usuwane powietrze',
                    optionAValue: 'Wolne powietrze + rozpuszczone mikropęcherzyki',
                    optionBValue: 'Tylko duże korki powietrzne w najwyższym punkcie',
                    winnerOrRule: 'Zeparo odpowietrza układ w kilka dni bez ręcznego spuszczania',
                },
                {
                    criterion: 'Ochrona przed czarnym szlamem magnetytowym (Fe3O4)',
                    optionAValue: 'Pierścienie Helistill + magnes neodymowy osadzają tlenki żelaza',
                    optionBValue: 'Szlam dostaje się pod pływak i powoduje wycieki',
                    winnerOrRule: 'Zeparo wydłuża żywotność pomp i zaworów',
                },
            ],
            skuRoles: ['Szwajcarski separator Helistill', 'Dla cichej pracy grzejników'],
            calculatorLabel: 'Oblicz moc kotłowni i układy ochronne',
        },
        ru: {
            badge: '07 · УДАЛЕНИЕ ВОЗДУХА И МАГНЕТИТА (ZEPARO)',
            title: 'IMI Pneumatex Zeparo (сепаратор микропузырьков и магнетита) vs. обычный поплавковый воздухоотводчик',
            questionHook: 'Почему после стравливания воздуха радиаторы снова бурлят через неделю, а поплавковые воздухоотводчики текут?',
            aiDirectAnswer:
                'Обычный поплавковый воздухоотводчик удаляет только крупные воздушные пробки в верхней точке и часто засоряется черным магнетитовым шламом (Fe3O4). IMI Pneumatex Zeparo с вставкой Helistill и магнитом монтируется в поток: он извлекает растворенные микропузырьки и улавливает магнетит.',
            optionAName: 'IMI Pneumatex Zeparo (ZUV / ZUKM / ZUD)',
            optionBName: 'Обычный поплавковый воздухоотводчик (3/8"–1/2")',
            rows: [
                {
                    criterion: 'Удаляемый воздух',
                    optionAValue: 'Свободный воздух + растворенные микропузырьки',
                    optionBValue: 'Только крупные воздушные пробки в верхней точке',
                    winnerOrRule: 'Zeparo очищает систему за несколько дней без ручного спуска',
                },
                {
                    criterion: 'Защита от черного магнетитового шлама (Fe3O4)',
                    optionAValue: 'Кольца Helistill + неодимовый магнит осаждают оксид железа',
                    optionBValue: 'Шлам попадает под поплавок и вызывает подтекание',
                    winnerOrRule: 'Zeparo продлевает срок службы насосов и клапанов',
                },
            ],
            skuRoles: ['Швейцарский сепаратор Helistill', 'Для тихой работы радиаторов'],
            calculatorLabel: 'Рассчитать мощность котельной и узлы защиты',
        },
    },
    'apatinis-vk-50mm-binoklis-vs-soninis-radiatoriaus-pajungimas': {
        en: {
            badge: '08 · RADIATOR CONNECTION ASSEMBLIES (VK 50 MM VS DN15)',
            title: 'Bottom (VK 50 mm H-block) vs. side radiator connection & wall (angle) vs. floor (straight) piping',
            questionHook: 'Which H-block valve, Eurokonus compression fittings, and thermostatic head fit a bottom or side radiator?',
            aiDirectAnswer:
                'Bottom-connection (VK – Ventil Kompakt) radiators have two bottom ports spaced 50 mm apart and a factory-installed upper valve insert, requiring a 50 mm H-block (straight from floor or angled from wall) plus a thermostatic head. Side-connection radiators (DN15 1/2") require two separate valves: a thermostatic supply valve on top and a lockshield return valve at the bottom.',
            optionAName: 'Bottom VK 50 mm Connection (Multilux / Vekolux H-block)',
            optionBName: 'Side DN15 (1/2") Connection (Eclipse + Regulux)',
            rows: [
                {
                    criterion: 'Pipe center distance & port thread',
                    optionAValue: '50 mm center-to-center at radiator bottom (G 3/4" Eurokonus / G 1/2")',
                    optionBValue: 'Side top and bottom ports (female thread G 1/2" DN15)',
                    winnerOrRule: 'VK radiator = 50 mm H-block; side radiator = 2 separate valves',
                },
                {
                    criterion: 'Pipes from wall vs. from floor',
                    optionAValue: 'From wall = angled H-block; from floor = straight H-block',
                    optionBValue: 'Angled or straight thermostatic valve matching pipe entry',
                    winnerOrRule: 'Do not mix up angled and straight H-blocks!',
                },
            ],
            skuRoles: ['VK 50 mm H-block', 'For side connection'],
            calculatorLabel: 'Configure radiator connection kit & Eurokonus fittings',
        },
        pl: {
            badge: '08 · ZESTAWY PRZYŁĄCZENIOWE GRZEJNIKÓW (VK 50 MM VS DN15)',
            title: 'Dolne (VK 50 mm H-blok) vs. boczne podłączenie grzejnika oraz wyjście ze ściany vs. z podłogi',
            questionHook: 'Jaki zawór podwójny („lornetkę”), złączki Eurokonus i głowicę kupić do grzejnika dolnego lub bocznego?',
            aiDirectAnswer:
                'Grzejniki dolnozasilane (VK – Ventil Kompakt) mają na dole dwa króćce w rozstawie 50 mm oraz fabryczną wkładkę zaworową u góry, dlatego wymagają bloku H 50 mm (prostego z podłogi lub kątowego ze ściany) i głowicy termostatycznej. Grzejniki boczne (DN15 1/2") wymagają dwóch osobnych zaworów.',
            optionAName: 'Dolne podłączenie VK 50 mm (Multilux / Vekolux H-blok)',
            optionBName: 'Boczne podłączenie DN15 (1/2") (Eclipse + Regulux)',
            rows: [
                {
                    criterion: 'Rozstaw rur i gwint przyłącza',
                    optionAValue: '50 mm w osiach od dołu grzejnika (G 3/4" Eurokonus / G 1/2")',
                    optionBValue: 'Z boku u góry i na dole (gwint wewnętrzny G 1/2" DN15)',
                    winnerOrRule: 'Grzejnik VK – H-blok; boczny – 2 osobne zawory',
                },
                {
                    criterion: 'Rury ze ściany vs z podłogi',
                    optionAValue: 'Ze ściany = kątowy H-blok; z podłogi = prosty H-blok',
                    optionBValue: 'Kątowy lub prosty zawór termostatyczny wg kierunku rury',
                    winnerOrRule: 'Nie pomyl zestawu kątowego z prostym!',
                },
            ],
            skuRoles: ['H-blok VK 50 mm', 'Do podłączenia bocznego'],
            calculatorLabel: 'Skompletuj zestaw grzejnikowy i złączki Eurokonus',
        },
        ru: {
            badge: '08 · УЗЛЫ ПОДКЛЮЧЕНИЯ РАДИАТОРОВ (VK 50 ММ VS DN15)',
            title: 'Нижнее (VK 50 мм Н-образный клапан «бинокль») vs. боковое подключение радиатора',
            questionHook: 'Какой узел нижнего подключения («бинокль»), фитинги Евроконус и термоголовку выбрать для радиатора?',
            aiDirectAnswer:
                'Радиаторы с нижним подключением (VK – Ventil Kompakt) имеют внизу два патрубка с межосевым расстоянием 50 мм и встроенную термовставку вверху, поэтому им нужен 50 мм Н-блок («бинокль»: прямой из пола или угловой из стены) и термоголовка. Радиаторам с боковым подключением (DN15 1/2") нужны два отдельных клапана.',
            optionAName: 'Нижнее подключение VK 50 мм (Multilux / Vekolux Н-блок)',
            optionBName: 'Боковое подключение DN15 (1/2") (Eclipse + Regulux)',
            rows: [
                {
                    criterion: 'Межосевое расстояние и резьба',
                    optionAValue: '50 мм между центрами снизу радиатора (G 3/4" Евроконус / G 1/2")',
                    optionBValue: 'Сбоку сверху и снизу (внутренняя резьба G 1/2" DN15)',
                    winnerOrRule: 'Для VK радиатора – Н-блок; для бокового – 2 отдельных клапана',
                },
                {
                    criterion: 'Трубы из стены vs из пола',
                    optionAValue: 'Из стены = угловой Н-блок; из пола = прямой Н-блок',
                    optionBValue: 'Угловой или прямой термоклапан по направлению трубы',
                    winnerOrRule: 'Не перепутайте угловой и прямой узел!',
                },
            ],
            skuRoles: ['Н-блок VK 50 мм «бинокль»', 'Для бокового подключения'],
            calculatorLabel: 'Скомплектовать радиаторный узел и фитинги Евроконус',
        },
    },
    'radiatoriaus-apacia-salta-magnetitas-vs-oras': {
        en: {
            badge: '09 · RADIATOR SLUDGE VS AIR POCKETS',
            title: 'Radiator cold at the bottom (magnetite sludge) vs. cold at the top (trapped air): diagnosis & fix',
            questionHook: 'How to tell by hand in 15 seconds whether your radiator is air-locked or choked with black magnetite sludge?',
            aiDirectAnswer:
                'If the top of the radiator is cold while the bottom is warm, free air has collected at the top – bleed it via the air vent. If the top is hot while the bottom center remains cold, black iron-oxide sludge (magnetite Fe3O4) has settled at the bottom – flush the radiator and install an IMI Pneumatex Zeparo magnetic separator.',
            optionAName: 'IMI Pneumatex Zeparo ZUKM / ZUVS Magnetic Separator',
            optionBName: 'IMI Heimeier Radiator Bleeding & Balancing Valve',
            rows: [
                {
                    criterion: 'Temperature symptom on radiator panel',
                    optionAValue: 'Bottom center cold, top hot, dark water when drained',
                    optionBValue: 'Top cold, gurgling sound, clear water',
                    winnerOrRule: 'Cold bottom = magnetite sludge; cold top = air pocket',
                },
                {
                    criterion: 'Permanent engineering solution',
                    optionAValue: 'Flush radiator + install inline magnetic dirt separator Zeparo',
                    optionBValue: 'Bleed radiator + install microbubble air separator on supply line',
                    winnerOrRule: 'Protect ECM pumps against magnetic iron oxide',
                },
            ],
            skuRoles: ['Magnetic dirt separator', 'AFC thermostatic valve'],
            calculatorLabel: 'Calculate system flow & separator sizing',
        },
        pl: {
            badge: '09 · SZLAM MAGNETYTOWY VS ZAPOWIETRZENIE GRZEJNIKA',
            title: 'Dół grzejnika zimny (szlam magnetytowy) vs. góra zimna (powietrze): diagnostyka i rozwiązanie',
            questionHook: 'Jak w 15 sekund dotykiem odróżnić zapowietrzony grzejnik od zamulonego czarnym magnetytem?',
            aiDirectAnswer:
                'Jeśli góra grzejnika jest zimna, a dół ciepły – w górnej części zebrało się powietrze, które należy odpowietrzyć. Jeśli góra jest gorąca, a dolny środek pozostaje zimny – na dnie osadził się czarny szlam magnetytowy (Fe3O4); należy wypłukać grzejnik i zamontować separator magnetyczny IMI Pneumatex Zeparo.',
            optionAName: 'Separator magnetyczny IMI Pneumatex Zeparo ZUKM / ZUVS',
            optionBName: 'Zawór odpowietrzający i równoważący IMI Heimeier',
            rows: [
                {
                    criterion: 'Objaw temperaturowy na płycie grzejnika',
                    optionAValue: 'Dół zimny, góra gorąca, czarna woda przy spuszczaniu',
                    optionBValue: 'Góra zimna, słychać bulgotanie, czysta woda',
                    winnerOrRule: 'Zimny dół = szlam magnetytowy; zimna góra = powietrze',
                },
                {
                    criterion: 'Trwałe rozwiązanie inżynieryjne',
                    optionAValue: 'Płukanie grzejnika + montaż separatora magnetycznego Zeparo',
                    optionBValue: 'Odpowietrzenie + separator mikropęcherzyków na zasilaniu',
                    winnerOrRule: 'Chroń pompy obiegowe przed tlenkiem żelaza',
                },
            ],
            skuRoles: ['Separator magnetyczny szlamu', 'Zawór termostatyczny AFC'],
            calculatorLabel: 'Oblicz przepływ i dobierz separator',
        },
        ru: {
            badge: '09 · МАГНЕТИТОВЫЙ ШЛАМ VS ВОЗДУХ В РАДИАТОРЕ',
            title: 'Низ радиатора холодный (магнетитовый шлам) vs. верх холодный (воздух): диагностика и решение',
            questionHook: 'Как за 15 секунд на ощупь отличить завоздушенный радиатор от забитого черным магнетитом?',
            aiDirectAnswer:
                'Если верх радиатора холодный, а низ теплый – вверху скопился воздух, стравите его краном Маевского. Если верх горячий, а нижняя середина холодная – на дне осел черный магнетитовый шлам (Fe3O4); промойте радиатор и установите магнитный сепаратор IMI Pneumatex Zeparo.',
            optionAName: 'Магнитный сепаратор шлама IMI Pneumatex Zeparo ZUKM / ZUVS',
            optionBName: 'Воздухоотводчик и балансировочный клапан IMI Heimeier',
            rows: [
                {
                    criterion: 'Температурный признак на панели радиатора',
                    optionAValue: 'Низ холодный, верх горячий, черная вода при сливе',
                    optionBValue: 'Верх холодный, слышно журчание, прозрачная вода',
                    winnerOrRule: 'Холодный низ = магнетит; холодный верх = воздух',
                },
                {
                    criterion: 'Долговечное инженерное решение',
                    optionAValue: 'Промывка радиатора + установка магнитного сепаратора Zeparo',
                    optionBValue: 'Развоздушивание + сепаратор микропузырьков на подаче',
                    winnerOrRule: 'Защитите насосы от магнитного оксида железа',
                },
            ],
            skuRoles: ['Магнитный сепаратор шлама', 'Термоклапан с AFC'],
            calculatorLabel: 'Рассчитать расход и подобрать сепаратор',
        },
    },
    'termostatine-galvute-su-nuotoliniu-jutikliu-vs-integruota': {
        en: {
            badge: '10 · ENCLOSED RADIATORS & REMOTE SENSORS',
            title: 'Thermostatic head with remote capillary sensor vs. built-in sensor behind curtains or sills',
            questionHook: 'Why does a radiator behind heavy curtains or a deep windowsill shut off while the room is still cold?',
            aiDirectAnswer:
                'A standard built-in sensor head measures the trapped warm air pocket right next to the valve under the windowsill, closing prematurely at 22 °C while the room is still 18 °C. A thermostatic head with a 2 m remote capillary bulb (or wall transmitter) measures true room temperature on an open wall.',
            optionAName: 'Head with 2 m Capillary Remote Sensor (Heimeier K / Danfoss)',
            optionBName: 'Standard Built-In Liquid/Gas Sensor Head',
            rows: [
                {
                    criterion: 'Temperature measurement point',
                    optionAValue: 'On open wall up to 2 m away from heat pocket',
                    optionBValue: 'Directly at radiator valve neck',
                    winnerOrRule: 'Use remote sensor whenever radiator is covered or vertical',
                },
                {
                    criterion: 'Vertical installation attitude',
                    optionAValue: 'Accurate in any valve orientation',
                    optionBValue: 'Must be mounted horizontally so rising heat does not fool sensor',
                    winnerOrRule: 'Vertical valve mounting requires a remote sensor',
                },
            ],
            skuRoles: ['Remote capillary sensor head', 'Standard horizontal head'],
            calculatorLabel: 'Configure radiator valve & sensor type',
        },
        pl: {
            badge: '10 · ZABUDOWANE GRZEJNIKI I CZUJNIKI WYNIESIONE',
            title: 'Głowica termostatyczna z czujnikiem wyniesionym (kapilarą) vs. z czujnikiem wbudowanym za zasłoną',
            questionHook: 'Dlaczego grzejnik za grubą zasłoną lub szerokim parapetem wyłącza się, gdy w pokoju jest jeszcze zimno?',
            aiDirectAnswer:
                'Standardowa głowica z wbudowanym czujnikiem mierzy temperaturę nagrzanej kieszeni powietrznej pod parapetem i zamyka zawór przy 22 °C, podczas gdy w pokoju jest 18 °C. Głowica z czujnikiem wyniesionym na kapilarze 2 m mierzy rzeczywistą temperaturę na ścianie.',
            optionAName: 'Głowica z kapilarą 2 m (Heimeier K / Danfoss)',
            optionBName: 'Standardowa głowica z czujnikiem wbudowanym',
            rows: [
                {
                    criterion: 'Punkt pomiaru temperatury',
                    optionAValue: 'Na odkrytej ścianie w odległości do 2 m od grzejnika',
                    optionBValue: 'Bezpośrednio przy króćcu zaworu grzejnikowego',
                    winnerOrRule: 'Przy zasłonach i wnękach wybierz czujnik wyniesiony',
                },
                {
                    criterion: 'Pionowy montaż głowicy',
                    optionAValue: 'Dokładny pomiar niezależnie od pozycji zaworu',
                    optionBValue: 'Wymaga montażu poziomego poza strumieniem ciepła',
                    winnerOrRule: 'Pionowa głowica wymaga czujnika wyniesionego',
                },
            ],
            skuRoles: ['Głowica z czujnikiem na kapilarze', 'Standardowa głowica pozioma'],
            calculatorLabel: 'Dobierz zawór i typ głowicy grzejnikowej',
        },
        ru: {
            badge: '10 · ЗАКРЫТЫЕ РАДИАТОРЫ И ВЫНОСНЫЕ ДАТЧИКИ',
            title: 'Термоголовка с выносным капиллярным датчиком vs. встроенный датчик за шторами или в нише',
            questionHook: 'Почему радиатор за плотными шторами или широким подоконником отключается, когда в комнате еще холодно?',
            aiDirectAnswer:
                'Обычная термоголовка со встроенным датчиком измеряет температуру нагретого воздушного кармана под подоконником и закрывает клапан при 22 °C, хотя в комнате всего 18 °C. Головка с выносным датчиком на капилляре 2 м измеряет реальную температуру на открытой стене.',
            optionAName: 'Головка с капилляром 2 м (Heimeier K / Danfoss)',
            optionBName: 'Стандартная головка со встроенным датчиком',
            rows: [
                {
                    criterion: 'Точка замера температуры',
                    optionAValue: 'На открытой стене на расстоянии до 2 м от ниши',
                    optionBValue: 'Непосредственно у шейки радиаторного клапана',
                    winnerOrRule: 'Для ниш и плотных штор выбирайте выносной датчик',
                },
                {
                    criterion: 'Вертикальная установка головки',
                    optionAValue: 'Точный замер при любой ориентации клапана',
                    optionBValue: 'Требует строго горизонтального монтажа',
                    winnerOrRule: 'Вертикальный монтаж требует выносного датчика',
                },
            ],
            skuRoles: ['Головка с выносным датчиком', 'Стандартная горизонтальная головка'],
            calculatorLabel: 'Подобрать клапан и тип термоголовки',
        },
    },
    'grindinio-sildymo-pamaisymo-mazgas-vs-rtl-voztuvas': {
        en: {
            badge: '11 · UNDERFLOOR MIXING PUMP GROUP VS RTL VALVE',
            title: 'Underfloor heating pump mixing unit (35–45 °C) vs. RTL return temperature limiter (Multibox)',
            questionHook: 'When can you connect a small bathroom floor loop with an RTL box and when do you need a pump mixing station?',
            aiDirectAnswer:
                'An RTL box (IMI Heimeier Multibox K-RTL) is suitable only for single small rooms up to 15–20 m² (1 loop max 80 m) fed from a radiator circuit. For multiple rooms or areas above 20 m², a dedicated thermostatic mixing valve and circulation pump group (35–45 °C supply) is mandatory so floor screed never overheats.',
            optionAName: 'Thermostatic Mixing Pump Group (35–45 °C)',
            optionBName: 'IMI Heimeier Multibox K-RTL (up to 15–20 m²)',
            rows: [
                {
                    criterion: 'Maximum heated floor area',
                    optionAValue: '20 m² to 250 m² (2 to 12 manifold loops)',
                    optionBValue: 'Up to 15–20 m² (1 loop, max pipe length 70–80 m)',
                    winnerOrRule: 'Multibox RTL for 1 bathroom; mixing group for 2+ loops',
                },
                {
                    criterion: 'Supply water temperature control',
                    optionAValue: 'Mixes supply down to safe 35–45 °C before entering floor',
                    optionBValue: 'Limits return temperature at loop exit (40–50 °C)',
                    winnerOrRule: 'Full floor areas require supply mixing protection',
                },
            ],
            skuRoles: ['Manifold with flowmeters', 'RTL box for single bathroom'],
            calculatorLabel: 'Size underfloor loops & mixing manifold',
        },
        pl: {
            badge: '11 · UKŁAD POMPOWO-MIESZAJĄCY VS ZAWÓR RTL',
            title: 'Grupa pompowo-mieszająca podłogówki (35–45 °C) vs. ogranicznik temperatury powrotu RTL (Multibox)',
            questionHook: 'Kiedy małą podłogówkę w łazience można podłączyć przez kasetę RTL, a kiedy konieczny jest układ pompowo-mieszający?',
            aiDirectAnswer:
                'Kaseta RTL (IMI Heimeier Multibox K-RTL) nadaje się wyłącznie do pojedynczych małych pomieszczeń do 15–20 m² (1 pętla maks. 80 m) wpiętych w obieg grzejnikowy. Powyżej 20 m² (2–12 pętli) konieczny jest rozdzielacz z grupą pompowo-mieszającą obniżającą zasilanie do 35–45 °C.',
            optionAName: 'Grupa pompowo-mieszająca (35–45 °C)',
            optionBName: 'IMI Heimeier Multibox K-RTL (do 15–20 m²)',
            rows: [
                {
                    criterion: 'Maksymalna powierzchnia podłogówki',
                    optionAValue: 'Od 20 m² do 250 m² (2 do 12 obiegów rozdzielacza)',
                    optionBValue: 'Do 15–20 m² (1 pętla do maks. 70–80 m rury)',
                    winnerOrRule: 'Multibox RTL do 1 łazienki; układ mieszający od 2 pętli',
                },
                {
                    criterion: 'Kontrola temperatury wody zasilającej',
                    optionAValue: 'Miesza zasilanie do bezpiecznych 35–45 °C przed wejściem w podłogę',
                    optionBValue: 'Ogranicza temperaturę powrotu na wyjściu pętli (40–50 °C)',
                    winnerOrRule: 'Większe powierzchnie wymagają podmieszania na zasilaniu',
                },
            ],
            skuRoles: ['Rozdzielacz z przepływomierzami', 'Kaseta RTL do łazienki'],
            calculatorLabel: 'Oblicz pętle podłogówki i dobierz rozdzielacz',
        },
        ru: {
            badge: '11 · НАСОСНО-СМЕСИТЕЛЬНЫЙ УЗЕЛ VS КЛАПАН RTL',
            title: 'Насосно-смесительный узел теплого пола (35–45 °C) vs. ограничитель обратки RTL (Multibox)',
            questionHook: 'Когда теплый пол в ванной можно подключить через бокс RTL, а когда обязателен насосно-смесительный узел?',
            aiDirectAnswer:
                'Бокс RTL (IMI Heimeier Multibox K-RTL) подходит только для одного небольшого помещения до 15–20 м² (1 петля до 80 м), подключенного к радиаторному контуру. При площади свыше 20 м² (2–12 контуров) обязателен коллектор с насосно-смесительным узлом, снижающим подачу до 35–45 °C.',
            optionAName: 'Насосно-смесительный узел (35–45 °C)',
            optionBName: 'IMI Heimeier Multibox K-RTL (до 15–20 м²)',
            rows: [
                {
                    criterion: 'Максимальная площадь теплого пола',
                    optionAValue: 'От 20 м² до 250 м² (от 2 до 12 контуров коллектора)',
                    optionBValue: 'До 15–20 м² (1 петля длиной не более 70–80 м)',
                    winnerOrRule: 'Multibox RTL – для 1 санузла; смесительный узел – от 2 контуров',
                },
                {
                    criterion: 'Контроль температуры подачи',
                    optionAValue: 'Снижает подачу до безопасных 35–45 °C перед входом в стяжку',
                    optionBValue: 'Ограничивает температуру обратки на выходе петли (40–50 °C)',
                    winnerOrRule: 'Для основных зон обязателен подмес на подаче',
                },
            ],
            skuRoles: ['Коллектор с расходомерами', 'Бокс RTL для санузла'],
            calculatorLabel: 'Рассчитать контуры теплого пола и коллектор',
        },
    },
    'grindinio-sildymo-kolektoriaus-nuorinimas-ir-rotametrai': {
        en: {
            badge: '12 · UNDERFLOOR MANIFOLD PURGING & ROTAMETERS',
            title: 'Purging an underfloor heating manifold loop-by-loop vs. automatic air vents',
            questionHook: 'Why stays an underfloor loop stuck at 0 L/min even with an automatic air vent on the manifold bar?',
            aiDirectAnswer:
                'A manifold end-cap air vent only bleeds air that reaches the header bar; it cannot push an airlock out of an 80-meter horizontal floor pipe. Airlocked loops must be purged one loop at a time using fill/drain valves with mains water pressure, then maintained with Dynacon Eclipse AFC.',
            optionAName: 'IMI Heimeier Dynacon Eclipse Manifold with Fill/Drain Kit',
            optionBName: 'Manifold Automatic End-Cap Air Vent 1/2"',
            rows: [
                {
                    criterion: 'Removing airlocks from 80 m floor loops',
                    optionAValue: 'Purge one loop at a time with all other loops closed',
                    optionBValue: 'Vents air only inside the top manifold header bar',
                    winnerOrRule: 'Initial commissioning requires loop-by-loop flushing',
                },
                {
                    criterion: 'Flowmeter visibility over time',
                    optionAValue: 'AFC cartridge regulates flow even if water darkens',
                    optionBValue: 'Sight glasses can cloud with magnetite without a separator',
                    winnerOrRule: 'Combine Dynacon Eclipse with a Zeparo separator',
                },
            ],
            skuRoles: ['Self-balancing manifold', 'Automatic manifold air vent'],
            calculatorLabel: 'Calculate underfloor loop lengths & flow rates',
        },
        pl: {
            badge: '12 · ODPOWIETRZANIE ROZDZIELACZA I ROTAMETRY',
            title: 'Odpowietrzanie rozdzielacza podłogówki pętla po pętli vs. odpowietrzniki automatyczne',
            questionHook: 'Dlaczego rotametr pokazuje 0 l/min, mimo że na belce rozdzielacza jest automatyczny odpowietrznik?',
            aiDirectAnswer:
                'Odpowietrznik na końcu belki rozdzielacza wypuszcza tylko powietrze, które dotrze do kolektora – nie wypchnie korka powietrznego z 80-metrowej poziomej pętli w posadzce. Zapowietrzone pętle należy przepłukać pojedynczo przy zamkniętych pozostałych obiegach.',
            optionAName: 'Rozdzielacz IMI Heimeier Dynacon Eclipse z zaworami spustowymi',
            optionBName: 'Automatyczny odpowietrznik belki rozdzielacza 1/2"',
            rows: [
                {
                    criterion: 'Usuwanie korków powietrznych z pętli 80 m',
                    optionAValue: 'Płukanie po jednej pętli przy zamkniętych pozostałych obiegach',
                    optionBValue: 'Usuwa powietrze wyłącznie z górnej belki rozdzielacza',
                    winnerOrRule: 'Uruchomienie wymaga płukania każdej pętli osobno',
                },
                {
                    criterion: 'Czytelność przepływu po latach',
                    optionAValue: 'Wkładka AFC utrzymuje przepływ nawet przy ciemnej wodzie',
                    optionBValue: 'Szkiełka rotametrów mogą zajść osadem bez separatora',
                    winnerOrRule: 'Połącz Dynacon Eclipse z separatorem Zeparo',
                },
            ],
            skuRoles: ['Rozdzielacz samobalansujący', 'Odpowietrznik rozdzielacza'],
            calculatorLabel: 'Oblicz długości pętli i przepływy podłogówki',
        },
        ru: {
            badge: '12 · РАЗВОЗДУШИВАНИЕ КОЛЛЕКТОРА И РОТАМЕТРЫ',
            title: 'Поконтурная прокачка коллектора теплого пола vs. автоматические воздухоотводчики',
            questionHook: 'Почему расходомер показывает 0 л/мин, хотя на коллекторе стоит автоматический воздухоотводчик?',
            aiDirectAnswer:
                'Воздухоотводчик на торце коллектора выпускает только воздух, дошедший до балки, но не может продавить воздушную пробку из 80-метровой горизонтальной петли в стяжке. Завоздушенные контуры необходимо прокачивать по одному при закрытых соседних петлях.',
            optionAName: 'Коллектор IMI Heimeier Dynacon Eclipse со сливной группой',
            optionBName: 'Автоматический воздухоотводчик коллектора 1/2"',
            rows: [
                {
                    criterion: 'Удаление воздушных пробок из петель 80 м',
                    optionAValue: 'Пролив по одному контуру при перекрытых остальных петлях',
                    optionBValue: 'Удаляет воздух только из самой балки коллектора',
                    winnerOrRule: 'Первичный запуск требует поконтурной прокачки',
                },
                {
                    criterion: 'Стабильность расхода через несколько лет',
                    optionAValue: 'Картридж AFC держит расход независимо от прозрачности колбы',
                    optionBValue: 'Стеклянные колбы ротаметров могут мутнеть без сепаратора',
                    winnerOrRule: 'Используйте Dynacon Eclipse вместе с сепаратором Zeparo',
                },
            ],
            skuRoles: ['Самобалансирующийся коллектор', 'Воздухоотводчик коллектора'],
            calculatorLabel: 'Рассчитать длины контуров и расходы теплого пола',
        },
    },
    'katilo-slegis-krenta-pletimosi-indo-patikra-vs-keitimas': {
        en: {
            badge: '13 · BOILER PRESSURE DROP & PRE-CHARGE P0',
            title: 'Boiler pressure drops or spikes to 3 bar: recharging the expansion vessel P0 vs. replacing the vessel',
            questionHook: 'How to test the Schrader valve on your expansion vessel and know whether to pump air or replace the tank?',
            aiDirectAnswer:
                'Briefly press the air Schrader valve on the expansion vessel: if water squirts out, the bladder is ruptured and the vessel must be replaced with an IMI Pneumatex Statico SD. If only air hisses out, isolate the vessel from system water (0 bar water side) and pump P0 = H_stat/10 + 0.2 bar.',
            optionAName: 'Replace with IMI Pneumatex Statico SD (Airproof butyl bladder)',
            optionBName: 'Recharge Air Cushion P0 via DLV Service Lockshield Valve',
            rows: [
                {
                    criterion: 'Schrader air nipple test result',
                    optionAValue: 'Water comes out of air nipple = ruptured bladder',
                    optionBValue: 'Dry air comes out, pressure below 0.8 bar = lost pre-charge',
                    winnerOrRule: 'Water at air valve means mandatory vessel replacement',
                },
                {
                    criterion: 'Correct P0 measurement condition',
                    optionAValue: 'Pre-set P0 before connecting new vessel to water pipe',
                    optionBValue: 'Close DLV service valve and drain water side to 0 bar first',
                    winnerOrRule: 'Never measure P0 while system water pressure is applied',
                },
            ],
            skuRoles: ['Statico SD 25.3 heating vessel', 'Statico SD 35.3 heating vessel'],
            calculatorLabel: 'Calculate exact expansion vessel L & P0 pressure',
        },
        pl: {
            badge: '13 · SPADEK CIŚNIENIA KOTŁA I CIŚNIENIE WSTĘPNE P0',
            title: 'Ciśnienie w kotle spada lub skacze do 3 bar: dopompowanie naczynia wzbiorczego P0 vs. wymiana',
            questionHook: 'Jak sprawdzić wentyl naczynia wzbiorczego i ocenić, czy wystarczy dopompować powietrze, czy wymienić naczynie?',
            aiDirectAnswer:
                'Naciśnij krótko wentyl powietrzny naczynia wzbiorczego: jeśli pojawi się woda, membrana jest pęknięta i naczynie należy wymienić na IMI Pneumatex Statico SD. Jeśli uchodzi suche powietrze, odetnij naczynie od wody (0 bar po stronie wodnej) i dopompuj P0 = H_stat/10 + 0,2 bar.',
            optionAName: 'Wymiana na IMI Pneumatex Statico SD (worek butylowy Airproof)',
            optionBName: 'Uzupełnienie poduszki powietrznej P0 przez zawór serwisowy DLV',
            rows: [
                {
                    criterion: 'Wynik testu wentyla powietrznego',
                    optionAValue: 'Z wentyla leci woda = pęknięta membrana',
                    optionBValue: 'Uchodzi powietrze, ciśnienie < 0,8 bar = utrata poduszki P0',
                    winnerOrRule: 'Woda w wentylu oznacza konieczność wymiany naczynia',
                },
                {
                    criterion: 'Warunek poprawnego pomiaru P0',
                    optionAValue: 'Ustaw P0 przed podłączeniem nowego naczynia do instalacji',
                    optionBValue: 'Zamknij zawór DLV i spuść ciśnienie wody do 0 bar',
                    winnerOrRule: 'Nigdy nie mierz P0 pod ciśnieniem wody z kotła',
                },
            ],
            skuRoles: ['Naczynie grzewcze Statico SD 25.3', 'Naczynie grzewcze Statico SD 35.3'],
            calculatorLabel: 'Oblicz pojemność naczynia (L) i ciśnienie P0',
        },
        ru: {
            badge: '13 · ПАДЕНИЕ ДАВЛЕНИЯ КОТЛА И ПРЕДНАКАЧКА P0',
            title: 'Падает давление котла или скачет до 3 бар: подкачка расширительного бака P0 vs. замена бака',
            questionHook: 'Как по золотнику расширительного бака понять – достаточно подкачать воздух или пора менять бак?',
            aiDirectAnswer:
                'Коротко нажмите на воздушный золотник бака: если брызнула вода – мембрана порвана, бак необходимо заменить на IMI Pneumatex Statico SD. Если идет сухой воздух – отключите бак от воды (0 бар со стороны воды) и накачайте P0 = H_stat/10 + 0,2 бар.',
            optionAName: 'Замена на IMI Pneumatex Statico SD (бутиловая мембрана Airproof)',
            optionBName: 'Подкачка воздушной подушки P0 через сервисный кран DLV',
            rows: [
                {
                    criterion: 'Результат проверки воздушного ниппеля',
                    optionAValue: 'Из ниппеля идет вода = мембрана порвана',
                    optionBValue: 'Идет воздух, давление < 0,8 бар = спустила подушка P0',
                    winnerOrRule: 'Вода из ниппеля означает обязательную замену бака',
                },
                {
                    criterion: 'Условие правильного замера P0',
                    optionAValue: 'Выставьте P0 до подключения нового бака к трубе',
                    optionBValue: 'Перекройте кран DLV и сбросьте давление воды до 0 бар',
                    winnerOrRule: 'Никогда не меряйте P0 под давлением воды котла',
                },
            ],
            skuRoles: ['Бак отопления Statico SD 25.3', 'Бак отопления Statico SD 35.3'],
            calculatorLabel: 'Рассчитать объем бака (л) и давление P0',
        },
    },
    'pletimosi-indas-boileriui-ir-hidrosmugio-slopinimas': {
        en: {
            badge: '14 · DHW CYLINDER EXPANSION & WATER HAMMER',
            title: 'DHW cylinder safety valve dripping (6–8 bar): Aquapresso potable expansion vessel vs. water hammer arrestor',
            questionHook: 'Why does the safety valve on your hot water cylinder drip every time water heats up?',
            aiDirectAnswer:
                'When cold potable water heats from 10 °C to 60 °C inside a 200 L cylinder with a check valve on the inlet, water volume expands by ~3–4 liters. Without a PN10 potable expansion vessel (IMI Pneumatex Aquapresso AD), pressure hits 6–8 bar and the safety valve discharges water.',
            optionAName: 'IMI Pneumatex Aquapresso AD (PN10 Potable Expansion Vessel)',
            optionBName: 'Inline Water Hammer Arrestor for Quick-Closing Taps',
            rows: [
                {
                    criterion: 'Primary function',
                    optionAValue: 'Absorbs thermal volume expansion during DHW cylinder heating',
                    optionBValue: 'Dampens momentary pressure spikes when solenoid/lever taps slam shut',
                    winnerOrRule: 'Dripping boiler relief valve requires Aquapresso AD (6–8% of cylinder L)',
                },
                {
                    criterion: 'Pre-charge pressure P0 setting',
                    optionAValue: '0.2 bar below cold water pressure reducing valve (e.g. 3.8 bar)',
                    optionBValue: 'Factory-charged compact damper near washing machine/tap manifold',
                    winnerOrRule: 'Set Aquapresso P0 to match cold water mains reducer',
                },
            ],
            skuRoles: ['Potable DHW vessel PN10', 'Cylinder safety group'],
            calculatorLabel: 'Size DHW expansion vessel volume',
        },
        pl: {
            badge: '14 · NACZYNIE DO BOJLERA CWU I UDERZENIA HYDRAULICZNE',
            title: 'Kapiący zawór bezpieczeństwa bojlera (6–8 bar): naczynie przeponowe Aquapresso vs. tłumik uderzeń',
            questionHook: 'Dlaczego zawór bezpieczeństwa przy bojlerze CWU kapie podczas każdego podgrzewania wody?',
            aiDirectAnswer:
                'Gdy zimna woda wodociągowa nagrzewa się od 10 °C do 60 °C w zasobniku 200 L za zaworem zwrotnym, jej objętość rośnie o ~3–4 litry. Bez naczynia wzbiorczego PN10 (IMI Pneumatex Aquapresso AD) ciśnienie rośnie do 6–8 bar i zawór bezpieczeństwa zrzuca wodę.',
            optionAName: 'IMI Pneumatex Aquapresso AD (naczynie do wody pitnej PN10)',
            optionBName: 'Tłumik uderzeń hydraulicznych przy bateriach i zaworach',
            rows: [
                {
                    criterion: 'Główna funkcja',
                    optionAValue: 'Przejmuje przyrost objętości wody podczas grzania bojlera CWU',
                    optionBValue: 'Tłumi chwilowe uderzenia przy szybkim zamknięciu baterii',
                    winnerOrRule: 'Kapiący zawór bojlera wymaga naczynia Aquapresso AD (6–8% poj.)',
                },
                {
                    criterion: 'Nastawa ciśnienia wstępnego P0',
                    optionAValue: 'O 0,2 bar niżej niż reduktor ciśnienia wody zimnej (np. 3,8 bar)',
                    optionBValue: 'Fabrycznie naładowany tłumik przy rozdzielaczu wodnym',
                    winnerOrRule: 'Dopasuj P0 Aquapresso do reduktora ciśnienia na wejściu',
                },
            ],
            skuRoles: ['Naczynie CWU PN10', 'Grupa bezpieczeństwa'],
            calculatorLabel: 'Oblicz pojemność naczynia do bojlera CWU',
        },
        ru: {
            badge: '14 · БАК ДЛЯ БОЙЛЕРА ГВС И ГАШЕНИЕ ГИДРОУДАРОВ',
            title: 'Капает предохранительный клапан бойлера (6–8 бар): бак Aquapresso PN10 vs. гаситель гидроударов',
            questionHook: 'Почему при каждом нагреве бойлера капает сбросной клапан 6–8 бар?',
            aiDirectAnswer:
                'При нагреве холодной воды от 10 °C до 60 °C в бойлере 200 л за обратным клапаном объем воды увеличивается на ~3–4 литра. Без расширительного бака PN10 (IMI Pneumatex Aquapresso AD) давление сразу растет до 6–8 бар и клапан сбрасывает воду.',
            optionAName: 'IMI Pneumatex Aquapresso AD (бак для питьевой воды PN10)',
            optionBName: 'Компенсатор гидроударов для быстрозапорных смесителей',
            rows: [
                {
                    criterion: 'Основная функция',
                    optionAValue: 'Принимает температурное расширение воды при нагреве бойлера',
                    optionBValue: 'Гасит секундный скачок давления при резком закрытии крана',
                    winnerOrRule: 'Течь клапана бойлера решает бак Aquapresso AD (6–8% объема)',
                },
                {
                    criterion: 'Настройка давления преднакачки P0',
                    optionAValue: 'На 0,2 бар ниже редуктора давления ХВС (напр., 3,8 бар)',
                    optionBValue: 'Заводская закачка у гребенки водоснабжения',
                    winnerOrRule: 'Настройте P0 Aquapresso по входному редуктору воды',
                },
            ],
            skuRoles: ['Питьевой бак ГВС PN10', 'Группа безопасности'],
            calculatorLabel: 'Рассчитать объем расширительного бака бойлера',
        },
    },
    'silumos-siurblio-taktavimas-srautas-dt5k-vs-dt15k': {
        en: {
            badge: '15 · HEAT PUMP SHORT-CYCLING & BUFFER VOLUME',
            title: 'Heat pump short-cycling & ΔT = 5 K flow rate vs. boiler ΔT = 15 K hydraulics',
            questionHook: 'Why does an air-to-water heat pump need 3× higher flow rate than a boiler and a Gorenje ZV 100 buffer tank?',
            aiDirectAnswer:
                'A heat pump operates at a narrow temperature delta (ΔT = 5 K), requiring 1,720 L/h of water flow for 10 kW (3× more than a boiler at ΔT = 15 K). Adding a 100 L buffer tank (Gorenje ZV 100) and DN25–DN32 piping prevents compressor short-cycling and supplies energy for defrost.',
            optionAName: 'Heat Pump Hydraulics (ΔT = 5 K + Gorenje ZV 100 Buffer)',
            optionBName: 'Boiler Hydraulics (ΔT = 15–20 K)',
            rows: [
                {
                    criterion: 'Required flow rate for 10 kW output',
                    optionAValue: '~1,720 L/h (requires DN25 / 1" primary piping)',
                    optionBValue: '~573 L/h (DN15–DN20 piping is sufficient)',
                    winnerOrRule: 'Never choke a heat pump with narrow DN15 primary pipes',
                },
                {
                    criterion: 'Defrost & anti-short-cycling buffer',
                    optionAValue: '10–15 L per kW (Gorenje ZV 100 for 8–10 kW heat pump)',
                    optionBValue: 'Not required for modulating gas boilers',
                    winnerOrRule: 'ZV 100 protects the compressor when room actuators close',
                },
            ],
            skuRoles: ['100 L heat pump buffer tank', 'DN25 high-flow balancing valve'],
            calculatorLabel: 'Calculate ΔT=5K flow rate & buffer volume',
        },
        pl: {
            badge: '15 · TAKTOWANIE POMPY CIEPŁA I PRZEPŁYW ΔT = 5 K',
            title: 'Taktowanie pompy ciepła i przepływ ΔT = 5 K vs. hydraulika kotłowa ΔT = 15 K',
            questionHook: 'Dlaczego pompa ciepła powietrze–woda wymaga 3× większego przepływu niż kocioł oraz bufora Gorenje ZV 100?',
            aiDirectAnswer:
                'Pompa ciepła pracuje przy małej różnicy temperatur (ΔT = 5 K), dlatego dla mocy 10 kW wymaga przepływu ~1 720 l/h (3× więcej niż kocioł przy ΔT = 15 K). Zbiornik buforowy 100 L (Gorenje ZV 100) oraz rury DN25–DN32 zapobiegają taktowaniu sprężarki i zapewniają energię do defrostu.',
            optionAName: 'Hydraulika pompy ciepła (ΔT = 5 K + bufor Gorenje ZV 100)',
            optionBName: 'Hydraulika kotła grzewczego (ΔT = 15–20 K)',
            rows: [
                {
                    criterion: 'Wymagany przepływ dla mocy 10 kW',
                    optionAValue: '~1 720 l/h (wymaga rur głównych DN25 / 1")',
                    optionBValue: '~573 l/h (wystarczają rury DN15–DN20)',
                    winnerOrRule: 'Nie dław pompy ciepła wąskimi rurami DN15',
                },
                {
                    criterion: 'Zład buforowy do odszraniania (defrost)',
                    optionAValue: '10–15 L na 1 kW (Gorenje ZV 100 dla pompy 8–10 kW)',
                    optionBValue: 'Niewymagany dla modulowanych kotłów gazowych',
                    winnerOrRule: 'Bufor ZV 100 chroni sprężarkę po zamknięciu siłowników',
                },
            ],
            skuRoles: ['Bufor 100 L do pompy ciepła', 'Zawór równoważący DN25'],
            calculatorLabel: 'Oblicz przepływ ΔT=5K i pojemność bufora',
        },
        ru: {
            badge: '15 · ТАКТОВАНИЕ ТЕПЛОВОГО НАСОСА И ПОТОК ΔT = 5 K',
            title: 'Тактование теплового насоса и расход ΔT = 5 K vs. котельная гидравлика ΔT = 15 K',
            questionHook: 'Почему тепловому насосу воздух–вода нужен в 3 раза больший проток, чем котлу, и буфер Gorenje ZV 100?',
            aiDirectAnswer:
                'Тепловой насос работает с малой дельтой температур (ΔT = 5 K), поэтому для передачи 10 кВт требуется проток ~1 720 л/ч (в 3 раза больше, чем котлу при ΔT = 15 K). Буферная емкость 100 л (Gorenje ZV 100) и трубы DN25–DN32 исключают тактование компрессора и дают тепло для оттайки.',
            optionAName: 'Гидравлика теплового насоса (ΔT = 5 K + буфер Gorenje ZV 100)',
            optionBName: 'Котельная гидравлика (ΔT = 15–20 K)',
            rows: [
                {
                    criterion: 'Требуемый расход воды на 10 кВт мощности',
                    optionAValue: '~1 720 л/ч (требуется магистраль DN25 / 1")',
                    optionBValue: '~573 л/ч (достаточно трубы DN15–DN20)',
                    winnerOrRule: 'Не зажимайте тепловой насос узкой трубой DN15',
                },
                {
                    criterion: 'Буферный объем для оттайки (defrost)',
                    optionAValue: '10–15 л на 1 кВт (Gorenje ZV 100 для ТН 8–10 кВт)',
                    optionBValue: 'Не требуется для модулируемых газовых котлов',
                    winnerOrRule: 'Буфер ZV 100 защищает компрессор при закрытии контуров',
                },
            ],
            skuRoles: ['Буфер 100 л для теплового насоса', 'Клапан балансировки DN25'],
            calculatorLabel: 'Рассчитать проток ΔT=5K и объем буфера',
        },
    },
    'magnetinis-slamo-separatorius-vs-tinklinis-y-filtras': {
        en: {
            badge: '16 · MAGNETIC DIRT SEPARATOR VS Y-STRAINER',
            title: 'Magnetic cyclonic dirt separator (Zeparo ZUKM) vs. standard brass mesh Y-strainer',
            questionHook: 'Why does a standard mesh Y-strainer fail to stop fine magnetite and choke heat pump flow?',
            aiDirectAnswer:
                'A brass mesh Y-strainer (400–500 micron screen) catches only coarse sand/hemp while letting 5–50 micron magnetic iron oxide pass straight into the wet-rotor ECM pump, and as its screen clogs it creates severe pressure drop. A cyclonic magnetic separator traps micro-magnetite with minimal hydraulic resistance.',
            optionAName: 'IMI Pneumatex Zeparo ZUKM / ZUVS Magnetic Separator',
            optionBName: 'Standard Brass Mesh Y-Strainer',
            rows: [
                {
                    criterion: 'Magnetite particle capture (5–50 microns)',
                    optionAValue: 'Neodymium magnet + cyclonic chamber captures fine Fe3O4',
                    optionBValue: 'Passes through 500 µm mesh directly into pump rotor',
                    winnerOrRule: 'ECM pumps and heat pumps require a magnetic separator',
                },
                {
                    criterion: 'Hydraulic pressure loss over time',
                    optionAValue: 'Constant low Δp – dirt settles into bottom collection bowl',
                    optionBValue: 'Mesh clogs in flow path and starves heat pump of flow',
                    winnerOrRule: 'Flush Zeparo in 10 seconds via bottom drain valve',
                },
            ],
            skuRoles: ['Cyclonic magnetic separator', 'High-flow STAD valve'],
            calculatorLabel: 'Calculate return-line velocity & Kv loss',
        },
        pl: {
            badge: '16 · SEPARATOR MAGNETYCZNY VS FILTR SIATKOWY Y',
            title: 'Magnetyczny separator szlamu (Zeparo ZUKM) vs. zwykły mosiężny filtr skośny Y',
            questionHook: 'Dlaczego zwykły filtr siatkowy Y przepuszcza drobny magnetyt i dławi przepływ pompy ciepła?',
            aiDirectAnswer:
                'Mosiężny filtr skośny Y (siatka 400–500 µm) zatrzymuje tylko gruby piasek, przepuszczając cząstki magnetytu (5–50 µm) prosto do wirnika pompy elektronicznej, a po zabrudzeniu blokuje przepływ. Separator magnetyczny Zeparo wychwytuje mikromagnetyt przy minimalnym oporze hydraulicznym.',
            optionAName: 'Separator magnetyczny IMI Pneumatex Zeparo ZUKM / ZUVS',
            optionBName: 'Standardowy mosiężny filtr siatkowy skośny Y',
            rows: [
                {
                    criterion: 'Wychwytywanie cząstek magnetytu (5–50 µm)',
                    optionAValue: 'Magnes neodymowy + komora cyklonowa zatrzymują Fe3O4',
                    optionBValue: 'Przenika przez siatkę 500 µm prosto do pompy ECM',
                    winnerOrRule: 'Pompy ciepła i pompy ECM wymagają separatora magnetycznego',
                },
                {
                    criterion: 'Strata ciśnienia w czasie eksploatacji',
                    optionAValue: 'Stały niski opór Δp – osad opada do dolnej komory',
                    optionBValue: 'Zatkana siatka dławi przepływ i powoduje błędy przepływu',
                    winnerOrRule: 'Opróżnianie Zeparo trwa 10 sekund zaworem spustowym',
                },
            ],
            skuRoles: ['Cyklonowy separator magnetyczny', 'Zawór równoważący STAD'],
            calculatorLabel: 'Oblicz prędkość przepływu i straty ciśnienia',
        },
        ru: {
            badge: '16 · МАГНИТНЫЙ СЕПАРАТОР ШЛАМА VS СЕТЧАТЫЙ Y-ФИЛЬТР',
            title: 'Магнитный сепаратор шлама (Zeparo ZUKM) vs. обычный сетчатый косой фильтр Y',
            questionHook: 'Почему обычный косой фильтр-грязевик пропускает мелкий магнетит и душит проток теплового насоса?',
            aiDirectAnswer:
                'Латунный косой фильтр Y (сетка 400–500 мкм) задерживает только крупный песок, пропуская микрочастицы магнетита (5–50 мкм) прямо в ротор электронного насоса, а при засорении перекрывает проток. Магнитный сепаратор Zeparo улавливает магнетит без потери напора.',
            optionAName: 'Магнитный сепаратор IMI Pneumatex Zeparo ZUKM / ZUVS',
            optionBName: 'Стандартный латунный сетчатый фильтр Y',
            rows: [
                {
                    criterion: 'Улавливание частиц магнетита (5–50 мкм)',
                    optionAValue: 'Неодимовый магнит + циклонная камера осаждают Fe3O4',
                    optionBValue: 'Проходит сквозь сетку 500 мкм в магнитный ротор насоса',
                    winnerOrRule: 'Для тепловых насосов и ЕСМ-насосов обязателен магнитный сепаратор',
                },
                {
                    criterion: 'Гидравлическое сопротивление со временем',
                    optionAValue: 'Постоянно низкий Δp – шлам оседает в нижней колбе',
                    optionBValue: 'Забитая сетка душит проток и вызывает ошибку датчика протока',
                    winnerOrRule: 'Сброс шлама из Zeparo занимает 10 секунд через дренаж',
                },
            ],
            skuRoles: ['Циклонный магнитный сепаратор', 'Балансировочный клапан STAD'],
            calculatorLabel: 'Рассчитать скорость потока и потери давления',
        },
    },
    'antras-aukstas-sala-stovu-balansavimas-stad-vs-rutulinis': {
        en: {
            badge: '17 · MULTI-FLOOR RISER BALANCING (STAD VS BALL VALVE)',
            title: 'Second floor stays cold: riser balancing with IMI TA STAD vs. throttling a ball valve',
            questionHook: 'Why does partially closing a ball valve on the first floor fail to balance heating risers?',
            aiDirectAnswer:
                'A quarter-turn ball valve is an shut-off device with a non-linear characteristic: throttling it creates cavitation noise, erodes the Teflon seal, and has no repeatable scale. An IMI TA STAD balancing valve provides 4 full turns of linear Kv adjustment, P/T measuring nipples, and a memory stop.',
            optionAName: 'IMI TA STAD Precision Riser Balancing Valve',
            optionBName: 'Quarter-Turn Shut-Off Ball Valve',
            rows: [
                {
                    criterion: 'Flow adjustment precision',
                    optionAValue: '4 full turns (40 graduation steps) + digital readout',
                    optionBValue: '90° lever – flow only changes in the last 15° of travel',
                    winnerOrRule: 'Use STAD on every floor branch or riser return',
                },
                {
                    criterion: 'Repeatability after maintenance shut-off',
                    optionAValue: 'Internal Memory Stop restores exact setting after closing',
                    optionBValue: 'Setting is lost whenever the lever is moved',
                    winnerOrRule: 'Memory Stop preserves multi-floor hydraulic balance',
                },
            ],
            skuRoles: ['DN20 riser balancing valve', 'Differential pressure controller'],
            calculatorLabel: 'Calculate riser flow & STAD setting turns',
        },
        pl: {
            badge: '17 · RÓWNOWAŻENIE PIONÓW (STAD VS ZAWÓR KULOWY)',
            title: 'Niedogrzane piętro: równoważenie pionów zaworem IMI TA STAD vs. przymykanie zaworu kulowego',
            questionHook: 'Dlaczego częściowe przymknięcie zaworu kulowego na parterze nie równoważy instalacji?',
            aiDirectAnswer:
                'Zawór kulowy służy wyłącznie do pracy otwórz/zamknij: przymknięty generuje szum kawitacyjny, niszczy uszczelnienie teflonowe i nie posiada skali nastaw. Zawór równoważący IMI TA STAD ma 4 pełne obroty liniowej charakterystyki Kv, króćce pomiarowe oraz pamięć nastawy Memory Stop.',
            optionAName: 'Precyzyjny zawór równoważący IMI TA STAD',
            optionBName: 'Zawór kulowy odcinający (dźwignia 90°)',
            rows: [
                {
                    criterion: 'Dokładność regulacji przepływu',
                    optionAValue: '4 pełne obroty (40 podziałek) + cyfrowa skala nastawy',
                    optionBValue: 'Dźwignia 90° – przepływ zmienia się dopiero w ostatnich 15°',
                    winnerOrRule: 'Na każdym odgałęzieniu kondygnacji montuj zawór STAD',
                },
                {
                    criterion: 'Powtarzalność po zamknięciu serwisowym',
                    optionAValue: 'Wewnętrzny Memory Stop przywraca dokładną nastawę',
                    optionBValue: 'Nastawa ginie przy każdym ruchu dźwignią',
                    winnerOrRule: 'Memory Stop chroni równowagę hydrauliczną budynku',
                },
            ],
            skuRoles: ['Zawór równoważący pionu DN20', 'Regulator różnicy ciśnień'],
            calculatorLabel: 'Oblicz przepływ pionu i nastawę zaworu STAD',
        },
        ru: {
            badge: '17 · БАЛАНСИРОВКА СТОЯКОВ И ЭТАЖЕЙ (STAD VS ШАРОВОЙ КРАН)',
            title: 'Холодный второй этаж: балансировка веток клапаном IMI TA STAD vs. поджатие шарового крана',
            questionHook: 'Почему полуприкрытый шаровой кран на первом этаже не решает проблему холодного второго этажа?',
            aiDirectAnswer:
                'Шаровой кран предназначен только для работы «открыто/закрыто»: в полуоткрытом положении он шумит из-за кавитации, режет фторопластовое седло и не имеет шкалы настройки. Балансировочный клапан IMI TA STAD имеет 4 полных оборота линейной шкалы Kv, ниппели замера и память настройки Memory Stop.',
            optionAName: 'Прецизионный балансировочный клапан IMI TA STAD',
            optionBName: 'Запорный шаровой кран (поворот 90°)',
            rows: [
                {
                    criterion: 'Точность регулировки расхода',
                    optionAValue: '4 полных оборота (40 делений) + цифровая шкала на рукоятке',
                    optionBValue: 'Рычаг 90° – расход меняется только в последних 15° хода',
                    winnerOrRule: 'На каждой поэтажной ветке устанавливайте клапан STAD',
                },
                {
                    criterion: 'Сохранение настройки после перекрытия',
                    optionAValue: 'Внутренний стопор Memory Stop возвращает точную настройку',
                    optionBValue: 'Настройка сбивается при любом повороте ручки',
                    winnerOrRule: 'Memory Stop сохраняет баланс этажей на десятилетия',
                },
            ],
            skuRoles: ['Клапан балансировки ветки DN20', 'Регулятор перепада давления'],
            calculatorLabel: 'Рассчитать расход ветки и настройку STAD',
        },
    },
    'eurokonus-16x2-vs-17x2-jungtys-ir-vamzdzio-kalibravimas': {
        en: {
            badge: '18 · EUROKONUS 16×2.0 FITTINGS & PIPE CALIBRATION',
            title: 'Eurokonus 3/4" × 16×2.0 vs. 17×2.0 compression fittings & why uncalibrated PEX pipe leaks when cold',
            questionHook: 'Why does a manifold Eurokonus joint stay dry when hot but start dripping overnight when the system cools?',
            aiDirectAnswer:
                'Multilayer PEX-AL-PEX 16×2.0 mm pipe cut with shears becomes slightly oval and has a sharp inner aluminum burr. Pushing it onto a 3/4" Eurokonus insert without a beveling calibrator slices the rubber O-ring, which then leaks whenever the pipe contracts during night setback.',
            optionAName: 'Comisa 3/4" × 16×2.0 Eurokonus with Beveled Pipe Calibration',
            optionBName: 'Uncalibrated Pipe Assembly / Mismatched Wall Thickness',
            rows: [
                {
                    criterion: 'Pipe wall dimension matching',
                    optionAValue: 'Exact 16×2.0 mm insert (12.0 mm inner bore)',
                    optionBValue: '16×2.2 or 17×2.0 insert mismatch causes loose grip or split pipe',
                    winnerOrRule: 'Match Eurokonus insert 1:1 to pipe outer diameter and wall thickness',
                },
                {
                    criterion: 'O-ring seal integrity during thermal cycling',
                    optionAValue: 'Calibrator chamfers inner edge so O-rings slide in intact',
                    optionBValue: 'Sharp aluminum edge nicks O-ring, causing cold-water weeping',
                    winnerOrRule: 'Always calibrate and bevel PEX-AL-PEX before inserting',
                },
            ],
            skuRoles: ['Eurokonus 16×2.0 – 3/4"', 'Comisa manifold with Eurokonus'],
            calculatorLabel: 'Calculate manifold loops & Eurokonus count',
        },
        pl: {
            badge: '18 · ZŁĄCZKI EUROKONUS 16×2.0 I KALIBRACJA RURY',
            title: 'Złączki Eurokonus 3/4" × 16×2.0 vs. 17×2.0 oraz dlaczego niekalibrowana rura PEX cieknie po ostygnięciu',
            questionHook: 'Dlaczego złączka Eurokonus przy rozdzielaczu jest sucha na gorąco, a zaczyna kapać w nocy po wychłodzeniu?',
            aiDirectAnswer:
                'Rura wielowarstwowa PEX-AL-PEX 16×2.0 mm ucięta nożycami ulega owalizacji i ma ostrą krawędź aluminium. Wciśnięcie jej na króciec Eurokonus 3/4" bez kalibratora z fazownikiem nacina gumowy O-ring, który zaczyna przepuszczać wodę po skurczeniu rury na zimno.',
            optionAName: 'Złączka Comisa 3/4" × 16×2.0 Eurokonus z kalibracją i fazowaniem',
            optionBName: 'Montaż bez kalibracji / niedopasowana grubość ścianki',
            rows: [
                {
                    criterion: 'Dopasowanie średnicy i ścianki rury',
                    optionAValue: 'Dokładna wkładka 16×2.0 mm (średnica wewnętrzna 12,0 mm)',
                    optionBValue: 'Niedopasowanie 16×2.2 lub 17×2.0 powoduje wyciek',
                    winnerOrRule: 'Dobieraj Eurokonus 1:1 do wymiaru rury',
                },
                {
                    criterion: 'Szczelność O-ringów przy cyklach grzania/chłodzenia',
                    optionAValue: 'Kalibrator fazuje krawędź, chroniąc uszczelki EPDM',
                    optionBValue: 'Ostra krawędź przecina O-ring – wyciek po ostygnięciu układu',
                    winnerOrRule: 'Zawsze kalibruj i fazuj rurę PEX-AL-PEX przed montażem',
                },
            ],
            skuRoles: ['Eurokonus 16×2.0 – 3/4"', 'Rozdzielacz Comisa Eurokonus'],
            calculatorLabel: 'Oblicz liczbę pętli i złączek Eurokonus',
        },
        ru: {
            badge: '18 · ЕВРОКОНУСЫ 16×2.0 И КАЛИБРОВКА ТРУБЫ',
            title: 'Фитинги Евроконус 3/4" × 16×2.0 vs. 17×2.0 и почему некалиброванная труба PEX течет при остывании',
            questionHook: 'Почему соединение Евроконус на коллекторе сухое на горячую, но начинает капать ночью при остывании?',
            aiDirectAnswer:
                'Металлопластиковая труба PEX-AL-PEX 16×2.0 мм после резки ножницами становится овальной и имеет острый внутренний край алюминия. Посадка на штуцер Евроконуса без калибратора со снятием фаски подрезает резиновое кольцо O-ring, которое начинает подтекать при температурном сжатии трубы.',
            optionAName: 'Comisa 3/4" × 16×2.0 Евроконус с калибровкой и фаской трубы',
            optionBName: 'Монтаж без калибратора / несовпадение толщины стенки',
            rows: [
                {
                    criterion: 'Соответствие диаметра и толщины стенки трубы',
                    optionAValue: 'Точный штуцер 16×2.0 мм (внутренний проход 12,0 мм)',
                    optionBValue: 'Несовпадение 16×2.2 или 17×2.0 ведет к срыву или течи',
                    winnerOrRule: 'Подбирайте Евроконус строго 1:1 под размер трубы',
                },
                {
                    criterion: 'Сохранность колец O-ring при термоциклах',
                    optionAValue: 'Калибратор снимает внутреннюю фаску и бережет кольца EPDM',
                    optionBValue: 'Острый край срезает O-ring – капли при ночном остывании',
                    winnerOrRule: 'Всегда калибруйте и снимайте фаску трубы перед сборкой',
                },
            ],
            skuRoles: ['Евроконус 16×2.0 – 3/4"', 'Коллектор Comisa Евроконус'],
            calculatorLabel: 'Рассчитать контуры и количество Евроконусов',
        },
    },
    'silumos-siurblio-pakeitimas-esamiems-radiatoriams-srautas': {
        en: {
            badge: '19 · R290 HEAT PUMP FOR EXISTING RADIATORS',
            title: 'High-temperature R290 heat pump (Haier Super Aqua up to +75 °C) vs. low-temperature R32 heat pump on radiators',
            questionHook: 'Can you heat an existing house with radiators using a heat pump without ripping up floors?',
            aiDirectAnswer:
                'Yes: a natural-refrigerant R290 propane heat pump (Haier Super Aqua AW082HUGHA / AW102HUGHA) delivers supply water up to +75 °C even in sub-zero frost, matching cast-iron and steel radiator requirements, provided radiator valves are upgraded to high-flow IMI Heimeier Eclipse AFC.',
            optionAName: 'Haier Super Aqua R290 Monoblock (up to +75 °C flow)',
            optionBName: 'Standard R32 Low-Temperature Heat Pump (up to +55 °C flow)',
            rows: [
                {
                    criterion: 'Maximum supply water temperature T1',
                    optionAValue: 'Up to +75 °C (compatible with existing radiator systems)',
                    optionBValue: 'Up to +55 °C (best suited for underfloor heating)',
                    winnerOrRule: 'For existing radiators choose R290 propane technology',
                },
                {
                    criterion: 'Required radiator valve upgrade',
                    optionAValue: 'IMI Heimeier Eclipse AFC set to ΔT = 5–7 K flow rate',
                    optionBValue: 'Requires oversized low-temperature convectors',
                    winnerOrRule: 'Balance radiator flows with Eclipse AFC + Gorenje ZV 100 buffer',
                },
            ],
            skuRoles: ['Haier R290 8 kW heat pump', '100 L buffer tank ZV 100'],
            calculatorLabel: 'Calculate heat pump kW output for your building',
        },
        pl: {
            badge: '19 · POMPA CIEPŁA R290 DO ISTNIEJĄCYCH GRZEJNIKÓW',
            title: 'Wysokotemperaturowa pompa ciepła R290 (Haier Super Aqua do +75 °C) vs. pompa R32 na grzejnikach',
            questionHook: 'Czy można ogrzać dom z istniejącymi grzejnikami pompą ciepła bez kucia posadzek?',
            aiDirectAnswer:
                'Tak: pompa ciepła na naturalny czynnik R290 propan (Haier Super Aqua AW082HUGHA / AW102HUGHA) osiąga temperaturę zasilania do +75 °C na mrozie, co odpowiada wymaganiom grzejników stalowych i żeliwnych, po zrównoważeniu przepływów zaworami IMI Heimeier Eclipse AFC.',
            optionAName: 'Haier Super Aqua R290 Monoblok (zasilanie do +75 °C)',
            optionBName: 'Standardowa niskotemperaturowa pompa R32 (do +55 °C)',
            rows: [
                {
                    criterion: 'Maksymalna temperatura wody zasilającej T1',
                    optionAValue: 'Do +75 °C (współpracuje z istniejącymi grzejnikami)',
                    optionBValue: 'Do +55 °C (optymalna do ogrzewania podłogowego)',
                    winnerOrRule: 'Do modernizacji z grzejnikami wybierz technologię R290',
                },
                {
                    criterion: 'Wymagana modernizacja armatury grzejnikowej',
                    optionAValue: 'Zawory IMI Heimeier Eclipse AFC ustawione pod ΔT = 5–7 K',
                    optionBValue: 'Wymaga przewymiarowania grzejników lub klimakonwektorów',
                    winnerOrRule: 'Połącz pompę R290 z zaworami Eclipse AFC i buforem ZV 100',
                },
            ],
            skuRoles: ['Pompa ciepła Haier R290 8 kW', 'Bufor 100 L Gorenje ZV 100'],
            calculatorLabel: 'Oblicz moc pompy ciepła kW dla budynku',
        },
        ru: {
            badge: '19 · ТЕПЛОВОЙ НАСОС R290 ДЛЯ СУЩЕСТВУЮЩИХ РАДИАТОРОВ',
            title: 'Высокотемпературный тепловой насос R290 (Haier Super Aqua до +75 °C) vs. низкотемпературный R32 на радиаторах',
            questionHook: 'Можно ли эффективно отапливать дом со старыми радиаторами тепловым насосом без вскрытия полов?',
            aiDirectAnswer:
                'Да: тепловой насос на природном пропане R290 (Haier Super Aqua AW082HUGHA / AW102HUGHA) выдает температуру подачи до +75 °C даже в мороз, что подходит для чугунных и стальных радиаторов при условии балансировки контуров клапанами IMI Heimeier Eclipse AFC.',
            optionAName: 'Моноблок Haier Super Aqua R290 (подача до +75 °C)',
            optionBName: 'Стандартный низкотемпературный ТН на R32 (до +55 °C)',
            rows: [
                {
                    criterion: 'Максимальная температура подачи T1',
                    optionAValue: 'До +75 °C (подходит для существующих радиаторов)',
                    optionBValue: 'До +55 °C (оптимален для водяного теплого пола)',
                    winnerOrRule: 'Для дома с радиаторами выбирайте пропан R290',
                },
                {
                    criterion: 'Требуемая подготовка радиаторной сети',
                    optionAValue: 'Клапаны IMI Heimeier Eclipse AFC, настроенные на поток ΔT = 5–7 K',
                    optionBValue: 'Требует замены радиаторов на низкотемпературные фанкойлы',
                    winnerOrRule: 'Дополните ТН R290 клапанами Eclipse AFC и буфером ZV 100',
                },
            ],
            skuRoles: ['Тепловой насос Haier R290 8 кВт', 'Буфер 100 л Gorenje ZV 100'],
            calculatorLabel: 'Рассчитать мощность теплового насоса (кВт) для дома',
        },
    },
    'danfoss-icon-termostatai-grindu-jutiklis-ir-kolektoriaus-spintele': {
        en: {
            badge: '20 · ROOM THERMOSTATS, FLOOR SENSORS & CABINETS',
            title: 'Room thermostat with floor temperature sensor (NTC) vs. air-only thermostat & manifold cabinet sizing',
            questionHook: 'When is a floor slab NTC sensor mandatory and how to size the manifold cabinet for your wiring center?',
            aiDirectAnswer:
                'A dual-sensor room thermostat (air + floor NTC probe in conduit) is mandatory for wood/parquet floors (limiting slab temperature to <= 27 °C) and bathrooms (keeping tiles warm at >= 24 °C even when air is warm). Size the manifold cabinet 100–150 mm wider when housing a multi-zone wiring controller.',
            optionAName: 'Digital Room Thermostat with Floor NTC Probe (Danfoss Icon / Watts)',
            optionBName: 'Standard Air-Only Room Thermostat',
            rows: [
                {
                    criterion: 'Parquet / hardwood floor protection (max 27 °C)',
                    optionAValue: 'Floor NTC sensor limits screed temperature to <= 27 °C',
                    optionBValue: 'Measures air only – sun or heat spikes can overheat wood',
                    winnerOrRule: 'Always install a floor sensor conduit for wood and bathroom tiles',
                },
                {
                    criterion: 'Manifold cabinet width selection',
                    optionAValue: 'Add +120 mm cabinet width for multi-zone wiring center',
                    optionBValue: 'Standard cabinet fits manifold bars only',
                    winnerOrRule: 'Choose a cabinet 1 size wider when installing zone automation',
                },
            ],
            skuRoles: ['Digital room thermostat 230V', '230V NC manifold actuator'],
            calculatorLabel: 'Size manifold loops, actuators & cabinet',
        },
        pl: {
            badge: '20 · TERMOSTATY POKOJOWE, CZUJNIK PODŁOGOWY I SZAFKA',
            title: 'Termostat pokojowy z czujnikiem temperatury podłogi (NTC) vs. termostat powietrzny i dobór szafki',
            questionHook: 'Kiedy czujnik podłogowy NTC w peszlu jest obowiązkowy i jak dobrać szerokość szafki pod listwę sterującą?',
            aiDirectAnswer:
                'Termostat z czujnikiem podłogowym NTC jest obowiązkowy przy podłogach drewnianych/panelach (ograniczenie temperatury posadzki <= 27 °C) oraz w łazienkach (utrzymanie ciepłych płytek >= 24 °C). Montując listwę sterującą w szafce rozdzielaczowej, wybierz szafkę o 100–150 mm szerszą.',
            optionAName: 'Termostat cyfrowy z czujnikiem podłogi NTC (Danfoss Icon / Watts)',
            optionBName: 'Standardowy termostat mierzący tylko temperaturę powietrza',
            rows: [
                {
                    criterion: 'Ochrona podłóg drewnianych i paneli (maks. 27 °C)',
                    optionAValue: 'Czujnik NTC pilnuje, by posadzka nie przekroczyła 27 °C',
                    optionBValue: 'Mierzy tylko powietrze – ryzyko przegrzania drewna',
                    winnerOrRule: 'Pod drewno i płytki w łazience zawsze układaj czujnik w peszlu',
                },
                {
                    criterion: 'Dobór szerokości szafki rozdzielaczowej',
                    optionAValue: 'Zapas +120 mm szerokości na listwę sterującą siłownikami',
                    optionBValue: 'Szafka podstawowa mieści wyłącznie sam rozdzielacz',
                    winnerOrRule: 'Z automatyką strefową wybierz szafkę o 1 rozmiar szerszą',
                },
            ],
            skuRoles: ['Cyfrowy termostat pokojowy 230V', 'Siłownik rozdzielacza 230V NC'],
            calculatorLabel: 'Dobierz rozdzielacz, siłowniki i szafkę',
        },
        ru: {
            badge: '20 · КОМНАТНЫЕ ТЕРМОСТАТЫ, ДАТЧИК ПОЛА И ШКАФ',
            title: 'Комнатный термостат с датчиком температуры пола (NTC) vs. воздушный термостат и подбор шкафа',
            questionHook: 'Когда обязателен датчик пола NTC в гофротрубке и какой запас ширины коллекторного шкафа нужен для автоматики?',
            aiDirectAnswer:
                'Термостат с двумя датчиками (воздух + датчик пола NTC в гофре) обязателен для паркета/ламината (ограничение нагрева стяжки <= 27 °C) и для санузлов (поддержание теплой плитки >= 24 °C). При размещении коммутационной планки в коллекторном шкафу выбирайте шкаф на 100–150 мм шире.',
            optionAName: 'Цифровой термостат с датчиком пола NTC (Danfoss Icon / Watts)',
            optionBName: 'Стандартный термостат только по температуре воздуха',
            rows: [
                {
                    criterion: 'Защита паркета и ламината от перегрева (макс. 27 °C)',
                    optionAValue: 'Датчик NTC ограничивает температуру стяжки <= 27 °C',
                    optionBValue: 'Измеряет только воздух – риск перегрева деревянного покрытия',
                    winnerOrRule: 'Для дерева и плитки в санузле всегда закладывайте датчик пола',
                },
                {
                    criterion: 'Выбор ширины коллекторного шкафа',
                    optionAValue: 'Запас +120 мм ширины под клеммную планку автоматики',
                    optionBValue: 'Базовый шкаф вмещает только сам коллектор с кранами',
                    winnerOrRule: 'При установке зональной автоматики берите шкаф на 1 типоразмер шире',
                },
            ],
            skuRoles: ['Цифровой комнатный термостат 230В', 'Сервопривод коллектора 230В NC'],
            calculatorLabel: 'Подобрать коллектор, приводы и шкаф',
        },
    },
};

export function getLocalizedHvacComparisonGuides(
    locale?: string | null,
): HvacComparisonGuide[] {
    const loc = resolveComparisonLocale(locale);
    if (loc === 'lt') return HVAC_COMPARISON_GUIDES;

    return HVAC_COMPARISON_GUIDES.map((guide) => {
        const tr = GUIDE_TRANSLATIONS[guide.slug]?.[loc];
        if (!tr) return guide;
        return {
            ...guide,
            badge: tr.badge,
            title: tr.title,
            questionHook: tr.questionHook,
            aiDirectAnswer: tr.aiDirectAnswer,
            optionA: {
                ...guide.optionA,
                name: tr.optionAName,
            },
            optionB: {
                ...guide.optionB,
                name: tr.optionBName,
            },
            comparisonRows: [
                ...tr.rows,
                ...guide.comparisonRows.slice(tr.rows.length),
            ],
            recommendedSkus: guide.recommendedSkus.map((skuItem, idx) => ({
                ...skuItem,
                roleLabel: tr.skuRoles[idx] || skuItem.roleLabel,
            })),
            calculatorLabel: tr.calculatorLabel,
        };
    });
}


