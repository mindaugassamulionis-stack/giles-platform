'use client';

import React, { useState } from 'react';
import type { AppLocale } from '../i18n/routing';

export const CAD_ENGINEERING_FAMILIES = [
    'valve_actuator',
    'pellet_burner_boiler',
    'heat_pump',
    'buffer_tank_boiler',
    'radiator_convector',
    'underfloor_manifold',
    'spare_part_sensor',
] as const;

export type CadEngineeringFamily = (typeof CAD_ENGINEERING_FAMILIES)[number];

export interface CadCalloutPin {
    pinNumber: '01' | '02' | '03' | '04' | '05' | '06';
    code: string;
    title: string;
    materialOrSpec: string;
    engineeringNote: string;
    sparePartStatus: string;
    x: number;
    y: number;
    targetX: number;
    targetY: number;
}

export interface CadDimensionLine {
    id: string;
    label: string;
    x1: number;
    y1: number;
    x2: number;
    y2: number;
}

export interface ProductCadBlueprintSpec {
    family: CadEngineeringFamily;
    familyBadge: string;
    title: string;
    scaleNote: string;
    standardRef: string;
    viewBox: '0 0 760 320';
    tabCrossSectionLabel: string;
    tabHydraulicWiringLabel: string;
    flowLegendSupply: string;
    flowLegendReturn: string;
    flowLegendControl: string;
    hydraulicRuleBanner: string;
    sparePartsFooterNote: string;
    dimensions: CadDimensionLine[];
    callouts: CadCalloutPin[];
}

export function detectProductCadFamily(input: {
    sku?: string | null;
    name?: string | null;
    categoryName?: string | null;
    subCategoryName?: string | null;
    brandName?: string | null;
}): CadEngineeringFamily {
    const sku = (input.sku || '').toLowerCase();
    const text = `${input.sku || ''} ${input.name || ''} ${input.categoryName || ''} ${input.subCategoryName || ''} ${input.brandName || ''}`.toLowerCase();

    // 7. Spare parts, igniters, sensors, grates, fans
    if (
        text.includes('tenas') ||
        text.includes('uždegimo') ||
        text.includes('uzdegimo') ||
        text.includes('ardel') ||
        text.includes('davikl') ||
        text.includes('jutikl') ||
        text.includes('ntc') ||
        text.includes('pt1000') ||
        text.includes('stb') ||
        text.includes('fotodavikl') ||
        text.includes('ventiliator') ||
        text.includes('tarpin') ||
        text.includes('atsargin')
    ) {
        return 'spare_part_sensor';
    }

    // 3. Heat pumps (R290 / R32 / Super Aqua / Monoblokas / Split)
    if (
        text.includes('šilumos siurbl') ||
        text.includes('silumos siurbl') ||
        text.includes('r290') ||
        text.includes('r32') ||
        text.includes('super aqua') ||
        text.includes('monoblok') ||
        sku.startsWith('aw0') ||
        sku.startsWith('au0')
    ) {
        return 'heat_pump';
    }

    // 6. Underfloor heating manifolds & PEX/PE-RT pipes
    if (
        text.includes('kolektor') ||
        text.includes('rotametr') ||
        text.includes('grindin') ||
        text.includes('pex') ||
        text.includes('pe-rt') ||
        text.includes('pe-xa') ||
        text.includes('eurokonus') ||
        text.includes('dynacon')
    ) {
        return 'underfloor_manifold';
    }

    // 5. Radiators & convectors
    if (
        text.includes('radiator') ||
        text.includes('konvektor') ||
        text.includes('ferroli pol') ||
        sku.startsWith('pol.') ||
        text.includes('tipas 22') ||
        text.includes('tipas 11') ||
        text.includes('tipas 33') ||
        text.includes('rankšluosč')
    ) {
        return 'radiator_convector';
    }

    // 4. Buffer tanks, DHW cylinders & expansion vessels
    if (
        text.includes('akumuliacin') ||
        text.includes('boiler') ||
        text.includes('vandens šildytuv') ||
        text.includes('vandens sildytuv') ||
        text.includes('tiki') ||
        text.includes('dražice') ||
        text.includes('drazice') ||
        text.includes('pneumatex') ||
        text.includes('statico') ||
        text.includes('aquapresso') ||
        text.includes('plėtimosi ind') ||
        text.includes('pletimosi ind') ||
        sku.startsWith('zv-') ||
        sku.startsWith('zv ')
    ) {
        return 'buffer_tank_boiler';
    }

    // 1. Valves, actuators, thermostatic heads, balancing valves
    if (
        text.includes('pavar') ||
        text.includes('vožtuv') ||
        text.includes('voztuv') ||
        text.includes('galvut') ||
        text.includes('termostat') ||
        text.includes('ab-qm') ||
        text.includes('abn-a5') ||
        text.includes('ra-n') ||
        text.includes('ra-g') ||
        text.includes('eclipse') ||
        text.includes('vekolux') ||
        text.includes('multilux') ||
        text.includes('stad') ||
        text.includes('stap') ||
        text.includes('balansin') ||
        sku.startsWith('082f') ||
        sku.startsWith('013g') ||
        sku.startsWith('003l') ||
        sku.startsWith('003z')
    ) {
        return 'valve_actuator';
    }

    // 2. Pellet burners & solid-fuel / biomass boilers
    if (
        text.includes('degikl') ||
        text.includes('katil') ||
        text.includes('megatherm') ||
        text.includes('mpb') ||
        text.includes('pelltech') ||
        text.includes('verner') ||
        text.includes('ponast') ||
        text.includes('thermostal') ||
        text.includes('katri') ||
        text.includes('granul')
    ) {
        return 'pellet_burner_boiler';
    }

    return 'valve_actuator';
}

const UI_CHROME_BY_LOCALE: Record<
    AppLocale,
    {
        scalePrefix: string;
        tabCrossSection: string;
        tabHydraulicWiring: string;
        flowSupply: string;
        flowReturn: string;
        flowControl: string;
        pinSelectPrompt: string;
        materialLabel: string;
        spareStatusLabel: string;
        spareFooter: string;
    }
> = {
    lt: {
        scalePrefix: 'CAD M 1:5 · ISO 128',
        tabCrossSection: '1. Mazgo pjūvis (CAD M 1:5)',
        tabHydraulicWiring: '2. Hidraulinė / elektrinė pajungimo schema',
        flowSupply: 'Tiekimas (T1 / srautas)',
        flowReturn: 'Grįžtamas (T2 / Δp)',
        flowControl: '230V / 24V / NTC valdymas',
        pinSelectPrompt: 'Pasirinkite mazgo poziciją [01–06] brėžinyje arba sąraše:',
        materialLabel: 'Medžiaga / Specifikacija:',
        spareStatusLabel: 'Atsarginė dalis Kaune:',
        spareFooter:
            'Visos [01–06] mazgo dalys, adapteriai ir tarpinės palaikomos Eigulių g. 21, Kauno sandėlyje (10+ m. serviso garantija).',
    },
    en: {
        scalePrefix: 'CAD Scale 1:5 · ISO 128',
        tabCrossSection: '1. Assembly Cross-Section (CAD 1:5)',
        tabHydraulicWiring: '2. Hydraulic / Electrical Connection Schematic',
        flowSupply: 'Supply flow (T1 / Kv)',
        flowReturn: 'Return line (T2 / Δp)',
        flowControl: '230V / 24V / NTC control',
        pinSelectPrompt: 'Select assembly callout pin [01–06] on blueprint or list:',
        materialLabel: 'Material / Spec:',
        spareStatusLabel: 'Kaunas warehouse stock:',
        spareFooter:
            'All [01–06] sub-assemblies, adapters, and gaskets stocked at Eigulių St. 21, Kaunas warehouse (10+ yr service support).',
    },
    pl: {
        scalePrefix: 'CAD Skala 1:5 · ISO 128',
        tabCrossSection: '1. Przekrój węzła (CAD M 1:5)',
        tabHydraulicWiring: '2. Schemat hydrauliczny i elektryczny',
        flowSupply: 'Zasilanie (T1 / Kv)',
        flowReturn: 'Powrót (T2 / Δp)',
        flowControl: 'Sterowanie 230V / 24V / NTC',
        pinSelectPrompt: 'Wybierz pozycję węzła [01–06] na rysunku lub liście:',
        materialLabel: 'Materiał / Specyfikacja:',
        spareStatusLabel: 'Magazyn Kowno:',
        spareFooter:
            'Wszystkie podzespoły [01–06], adaptery i uszczelki dostępne z magazynu w Kownie, ul. Eigulių 21 (10+ lat wsparcia).',
    },
    ru: {
        scalePrefix: 'CAD М 1:5 · ISO 128',
        tabCrossSection: '1. Разрез узла (CAD М 1:5)',
        tabHydraulicWiring: '2. Гидравлическая / электрическая схема подключения',
        flowSupply: 'Подача (T1 / Kv)',
        flowReturn: 'Обратка (T2 / Δp)',
        flowControl: 'Управление 230V / 24V / NTC',
        pinSelectPrompt: 'Выберите позицию узла [01–06] на чертеже или в списке:',
        materialLabel: 'Материал / Спецификация:',
        spareStatusLabel: 'Склад в Каунасе:',
        spareFooter:
            'Все узлы [01–06], адаптеры и прокладки поддерживаются на складе в Каунасе, ул. Эйгулю 21 (10+ лет сервиса).',
    },
};

export function getProductCadBlueprintSpec(
    family: CadEngineeringFamily,
    locale: AppLocale = 'lt',
    sku = 'SKU',
    _productTitle = '',
): ProductCadBlueprintSpec {
    const chrome = UI_CHROME_BY_LOCALE[locale] || UI_CHROME_BY_LOCALE.lt;

    if (family === 'valve_actuator') {
        return {
            family,
            familyBadge:
                locale === 'lt'
                    ? 'VOŽTUVŲ IR PAVARŲ MAZGAS · EN 215 / EN 12828'
                    : locale === 'en'
                      ? 'VALVE & ACTUATOR ASSEMBLY · EN 215 / EN 12828'
                      : locale === 'pl'
                        ? 'WĘZEŁ ZAWORU I SIŁOWNIKA · EN 215 / EN 12828'
                        : 'УЗЕЛ КЛАПАНА И ПРИВОДА · EN 215 / EN 12828',
            title: `CAD · ${sku} · CW617N / VA41 M30×1,5 / 5 mm`,
            scaleNote: chrome.scalePrefix,
            standardRef: 'LST EN 215 · EN 12828 · PN16 / DN15–DN32',
            viewBox: '0 0 760 320',
            tabCrossSectionLabel: chrome.tabCrossSection,
            tabHydraulicWiringLabel: chrome.tabHydraulicWiring,
            flowLegendSupply: chrome.flowSupply,
            flowLegendReturn: chrome.flowReturn,
            flowLegendControl: chrome.flowControl,
            hydraulicRuleBanner:
                'Tiesaus vamzdžio taisyklė: ≥ 5×DN prieš balansinį vožtuvą (P1) ir ≥ 2×DN už vožtuvo (P2) stabiliai Δp matavimo charakteristikai.',
            sparePartsFooterNote: chrome.spareFooter,
            dimensions: [
                { id: 'dim-stroke', label: 'Eiga H = 5,0 mm', x1: 378, y1: 48, x2: 378, y2: 112 },
                { id: 'dim-thread', label: 'VA41 / M30×1,5 / RA-Click', x1: 310, y1: 126, x2: 450, y2: 126 },
                { id: 'dim-body', label: 'L = 82 mm · DN15–DN25 (CW617N)', x1: 215, y1: 274, x2: 545, y2: 274 },
                { id: 'dim-upstream', label: '5×DN prieš / 2×DN už', x1: 58, y1: 205, x2: 202, y2: 205 },
            ],
            callouts: [
                {
                    pinNumber: '01',
                    code: 'CW617N / AMETAL',
                    title: 'Vožtuvo korpusas (CW617N / AMETAL)',
                    materialOrSpec: 'Karštai štampuotas žalvaris CW617N / DZR AMETAL-C, PN16, T_max 120 °C',
                    engineeringNote: 'Montuoti tik pagal srauto rodyklę ant korpuso (5×DN prieš vožtuvą, 2×DN už vožtuvo).',
                    sparePartStatus: 'Sandėlyje Kaune (pilnas mazgas)',
                    x: 245,
                    y: 222,
                    targetX: 295,
                    targetY: 202,
                },
                {
                    pinNumber: '02',
                    code: 'Kvs / Δp KŪGIS',
                    title: 'Reguliavimo kūgis ir EPDM diafragma',
                    materialOrSpec: 'Kvs išankstinio nustatymo žiedas (1–7 / 10–100%) + EPDM dvigubas O-žiedas',
                    engineeringNote: 'Palaiko pastovų srautą nepriklausomai nuo slėgio svyravimų (AB-QM / Eclipse AFC).',
                    sparePartStatus: 'Keičiamas vožtuvo įdėklas sandėlyje',
                    x: 380,
                    y: 235,
                    targetX: 380,
                    targetY: 198,
                },
                {
                    pinNumber: '03',
                    code: 'ŠTOKAS 5 mm',
                    title: 'Nerūdijančio plieno štokas (5 mm eiga)',
                    materialOrSpec: 'AISI 303 štokas, linijinė eiga 4,5–5,0 mm, spyruoklinis NC/NO grąžinimas',
                    engineeringNote: 'Prieš uždedant pavarą patikrinkite, ar štokas laisvai pasispaudžia 5 mm be strigimo.',
                    sparePartStatus: 'Sandėlyje Kaune (riebokšlio mazgas)',
                    x: 446,
                    y: 148,
                    targetX: 392,
                    targetY: 152,
                },
                {
                    pinNumber: '04',
                    code: 'VA41 / M30×1,5',
                    title: 'Tvirtinimo adapteris (VA41 / M30×1,5 / RA-Click)',
                    materialOrSpec: 'Srieginė veržlė M30×1,5 mm arba Danfoss VA41 / RA-Click greito fiksavimo žiedas',
                    engineeringNote: 'Užveržti ranka (maks. 1,5 Nm) be santechninių replių, kad nepažeistumėte kakliuko.',
                    sparePartStatus: 'Sandėlyje Kaune (VA41 / M30 adapteriai)',
                    x: 286,
                    y: 132,
                    targetX: 356,
                    targetY: 132,
                },
                {
                    pinNumber: '05',
                    code: '230V / 24V NC/NO',
                    title: 'Termoelektrinė / motorinė pavara (ABN-A5)',
                    materialOrSpec: '230V AC arba 24V AC/DC, 2 W, IP54, eigos indikatorius, 5 mm eiga',
                    engineeringNote: 'NC (normaliai uždara) atsidaro per ~180 s padavus įtampą iš kolektoriaus valdiklio.',
                    sparePartStatus: 'Sandėlyje Kaune (082F1152 / 013G2990)',
                    x: 380,
                    y: 54,
                    targetX: 380,
                    targetY: 82,
                },
                {
                    pinNumber: '06',
                    code: 'P1 / P2 ADATINIAI',
                    title: 'Slėgio perkryčio matavimo nipeliai (P1 / P2)',
                    materialOrSpec: '2× savisandarinantys adatiniai matavimo taškai Δp ir srauto patikrai',
                    engineeringNote: 'Naudojami diferencinio slėgio (kPa) matavimui paleidimo–derinimo metu.',
                    sparePartStatus: 'Sandėlyje Kaune (P1/P2 matavimo nipeliai)',
                    x: 530,
                    y: 222,
                    targetX: 465,
                    targetY: 198,
                },
            ],
        };
    }

    if (family === 'pellet_burner_boiler') {
        return {
            family,
            familyBadge:
                locale === 'lt'
                    ? 'GRANULIŲ DEGIKLIO IR KATILO MAZGAS · EN 303-5 KLASĖ 5'
                    : 'PELLET BURNER & BOILER ASSEMBLY · EN 303-5 CLASS 5',
            title: `CAD · ${sku} · CNC P265GH / Šnekas 60° / 55 °C`,
            scaleNote: chrome.scalePrefix,
            standardRef: 'LST EN 303-5 (5 klasė) · EcoDesign 2015/1189 · P265GH 6 mm',
            viewBox: '0 0 760 320',
            tabCrossSectionLabel: chrome.tabCrossSection,
            tabHydraulicWiringLabel: chrome.tabHydraulicWiring,
            flowLegendSupply: chrome.flowSupply,
            flowLegendReturn: chrome.flowReturn,
            flowLegendControl: chrome.flowControl,
            hydraulicRuleBanner:
                'Antikondensacinė apsauga: grįžtamo srauto temperatūra į katilą T_grįžt ≥ 55 °C, kuro padavimo šnekas montuojamas 45–60° kampu su poliuretano gofra.',
            sparePartsFooterNote: chrome.spareFooter,
            dimensions: [
                { id: 'dim-flange', label: 'CNC P265GH flanšas Ø90–180 mm', x1: 278, y1: 118, x2: 278, y2: 242 },
                { id: 'dim-auger', label: 'Šnekas L = 1500–2000 mm (60°)', x1: 48, y1: 72, x2: 215, y2: 158 },
                { id: 'dim-chamber', label: 'Degimo kamera L_min = 380 mm', x1: 310, y1: 274, x2: 640, y2: 274 },
            ],
            callouts: [
                {
                    pinNumber: '01',
                    code: 'CNC P265GH FLANŠAS',
                    title: 'Modifikuotas katilo durelių flanšas (CNC P265GH)',
                    materialOrSpec: '6 mm katilinis plienas P265GH + keraminė virvė 12×12 mm (1260 °C)',
                    engineeringNote: 'Tvirtinamas prie esamų Viadrus U22 / Kalvis / Atmos katilo durelių be suvirinimo.',
                    sparePartStatus: 'Sandėlyje Kaune (CNC durelių plokštės)',
                    x: 278,
                    y: 102,
                    targetX: 278,
                    targetY: 165,
                },
                {
                    pinNumber: '02',
                    code: 'ARDELIAI CrNi',
                    title: 'Judančių ardelių degimo kamera (Inox CrNi)',
                    materialOrSpec: 'Karščiui atsparus plienas 1.4841 (iki 1150 °C) su mechaniniu šlako nustūmimu',
                    engineeringNote: 'Degiklio tūta turi įlįsti į katilo pakurą bent 15–25 mm už durelių izoliacijos.',
                    sparePartStatus: 'Sandėlyje Kaune (atsarginiai ardeliai)',
                    x: 382,
                    y: 192,
                    targetX: 355,
                    targetY: 185,
                },
                {
                    pinNumber: '03',
                    code: 'TENAS 300W KERAM.',
                    title: 'Keraminis uždegimo tenas ir fotodaviklis',
                    materialOrSpec: '230V AC 300–400 W Si3N4/Al2O3 keraminis elementas, įkaitimas iki 1050 °C per 60 s',
                    engineeringNote: 'Tarpas tarp teno ir ardelių ≥ 5 mm, kad pelenai neužblokuotų oro srauto.',
                    sparePartStatus: 'Sandėlyje Kaune (keraminiai tenai)',
                    x: 222,
                    y: 235,
                    targetX: 292,
                    targetY: 196,
                },
                {
                    pinNumber: '04',
                    code: 'VENTILIATORIUS PWM',
                    title: 'Pirminio ir antrinio oro ventiliatorius (PWM)',
                    materialOrSpec: 'Moduliuojamas Hall jutiklio ventiliatorius su atbuline oro sklende',
                    engineeringNote: 'Automatiškai prapučia degimo kamerą prieš ir po kiekvieno darbo ciklo.',
                    sparePartStatus: 'Sandėlyje Kaune (PWM ventiliatoriai)',
                    x: 158,
                    y: 198,
                    targetX: 215,
                    targetY: 185,
                },
                {
                    pinNumber: '05',
                    code: 'ŠNEKAS 60° + GOFRA',
                    title: 'Kuro padavimo sraigtas (šnekas 60°) ir PU gofra',
                    materialOrSpec: 'Cinkuotas plienas Ø60/75 mm + savaime gęstanti poliuretano žarna Ø60 mm (85 °C)',
                    engineeringNote: 'Priešgaisrinis termovamzdis nutraukia granulių kelią atgalinio dūmo atveju.',
                    sparePartStatus: 'Sandėlyje Kaune (šnekai ir PU gofros)',
                    x: 118,
                    y: 78,
                    targetX: 165,
                    targetY: 122,
                },
                {
                    pinNumber: '06',
                    code: '55 °C PAMAIŠYMAS',
                    title: '55 °C antikondensacinis kontūras ir katilo šilumokaitis',
                    materialOrSpec: 'Termostatinis 3-eigis pamaišymo vožtuvas (55–60 °C) + STB 95 °C apsauga',
                    engineeringNote: 'Saugo katilo plienines / ketaus sieneles nuo žematemperatūrinės dervų korozijos.',
                    sparePartStatus: 'Sandėlyje Kaune (55 °C pamaišymo mazgai)',
                    x: 565,
                    y: 228,
                    targetX: 520,
                    targetY: 215,
                },
            ],
        };
    }

    if (family === 'heat_pump') {
        return {
            family,
            familyBadge:
                locale === 'lt'
                    ? 'ORAS–VANDUO ŠILUMOS SIURBLIO MAZGAS · R290 / R32 A+++'
                    : 'AIR-TO-WATER HEAT PUMP HYDRONIC NODE · R290 / R32 A+++',
            title: `CAD · ${sku} · R290 Monoblokas / Zeparo / ZV buferis`,
            scaleNote: chrome.scalePrefix,
            standardRef: 'EU 813/2013 A+++ · R290 (GWP=3) · SCOP ≥ 4,85 · EN 12828',
            viewBox: '0 0 760 320',
            tabCrossSectionLabel: chrome.tabCrossSection,
            tabHydraulicWiringLabel: chrome.tabHydraulicWiring,
            flowLegendSupply: chrome.flowSupply,
            flowLegendReturn: chrome.flowReturn,
            flowLegendControl: chrome.flowControl,
            hydraulicRuleBanner:
                'Monobloko apsauga: privalomas magnetinis purvo ir oro separatorius (Zeparo), neužšąlanti išleidimo sklendė bei ≥ 50–100 L akumuliacinė talpa (ZV) atitirpinimo (Defrost) ciklui.',
            sparePartsFooterNote: chrome.spareFooter,
            dimensions: [
                { id: 'dim-unit', label: 'Išorinis blokas + antivibracinės atramos H = 400 mm', x1: 62, y1: 268, x2: 268, y2: 268 },
                { id: 'dim-pipes', label: 'Izoliuotos linijos DN25 (1") EPDM 19 mm', x1: 275, y1: 142, x2: 455, y2: 142 },
                { id: 'dim-buffer', label: 'ZV buferis 100–200 L + 3-eigis KVS', x1: 485, y1: 268, x2: 685, y2: 268 },
            ],
            callouts: [
                {
                    pinNumber: '01',
                    code: 'R290 KOMPRESORIUS',
                    title: 'R290 DC Inverter kompresorius ir garintuvas',
                    materialOrSpec: 'Propano šaltnešis R290 (GWP=3), tiekimas iki +75 °C prie −25 °C lauko temperatūros',
                    engineeringNote: 'Išorinis blokas statomas ant 400 mm rėmo su kondensato nuvedimu žemiau įšalo ribos.',
                    sparePartStatus: 'Sandėlyje Kaune (Haier Super Aqua R290)',
                    x: 155,
                    y: 95,
                    targetX: 165,
                    targetY: 155,
                },
                {
                    pinNumber: '02',
                    code: 'ANTIVIBRACINĖ BAZĖ',
                    title: 'Antivibracinės gumos atramos ir kondensato vonelė',
                    materialOrSpec: 'SBR antivibraciniai blokai + savireguliuojantis 40 W šildymo kabelis',
                    engineeringNote: 'Slopina žemo dažnio kompresoriaus vibraciją ir neleidžia užšalti drenažui.',
                    sparePartStatus: 'Sandėlyje Kaune (atramos ir kabeliai)',
                    x: 155,
                    y: 245,
                    targetX: 165,
                    targetY: 225,
                },
                {
                    pinNumber: '03',
                    code: 'DN25 EPDM LINIJOS',
                    title: 'Izoliuotos hidraulinės linijos ir Anti-Freeze vožtuvas',
                    materialOrSpec: 'G 1" (DN25) su 19 mm EPDM izoliacija + 2× termostatiniai išleidimo vožtuvai (+3 °C)',
                    engineeringNote: 'Dingus elektrai prie minusinės temperatūros apsaugo plokštelinį šilumokaitį.',
                    sparePartStatus: 'Sandėlyje Kaune (Anti-Freeze vožtuvai)',
                    x: 345,
                    y: 118,
                    targetX: 345,
                    targetY: 165,
                },
                {
                    pinNumber: '04',
                    code: 'ZEPARO MAGNETAS',
                    title: 'Magnetinis šlamo ir mikoro-burbuliukų separatorius (Zeparo)',
                    materialOrSpec: 'IMI Pneumatex Zeparo G 1" su neodimio magnetu ant grįžtamo vamzdžio',
                    engineeringNote: 'Sulaiko magnetitą (Fe3O4), kuris kitaip užkemša DC cirkuliacinį siurblį ir šilumokaitį.',
                    sparePartStatus: 'Sandėlyje Kaune (IMI Zeparo DN25)',
                    x: 418,
                    y: 235,
                    targetX: 418,
                    targetY: 198,
                },
                {
                    pinNumber: '05',
                    code: '3-EIGIS ŠV / KV',
                    title: 'Motorizuotas 3-eigis vožtuvas (Šildymas / Boileris)',
                    materialOrSpec: 'DN25 Kvs 8,0 m³/h su 230V SPDT pavara greitam perjungimui į karšto vandens ruošimą',
                    engineeringNote: 'Valdomas tiesiogiai iš šilumos siurblio vidinio valdiklio plokštės.',
                    sparePartStatus: 'Sandėlyje Kaune (3-eigiai vožtuvai)',
                    x: 505,
                    y: 108,
                    targetX: 505,
                    targetY: 148,
                },
                {
                    pinNumber: '06',
                    code: 'ZV BUFERIS 100 L',
                    title: 'Hidraulinio atskyrimo akumuliacinė talpa (ZV)',
                    materialOrSpec: 'Plieninė talpa S235JR 100–200 L su 50 mm PU izoliacija ir NTC jutiklio gilze',
                    engineeringNote: 'Užtikrina minimalų 15–25 l/min srautą atitirpinimo (Defrost) metu net uždarius kolektorių.',
                    sparePartStatus: 'Sandėlyje Kaune (Gorenje ZV 100 / Dražice)',
                    x: 615,
                    y: 175,
                    targetX: 600,
                    targetY: 185,
                },
            ],
        };
    }

    if (family === 'buffer_tank_boiler') {
        return {
            family,
            familyBadge:
                locale === 'lt'
                    ? 'AKUMULIACINĖS TALPOS IR BOILERIO PJŪVIS · EN 12828 / EN 12897'
                    : 'BUFFER TANK & DHW CYLINDER CUTAWAY · EN 12828 / EN 12897',
            title: `CAD · ${sku} · S235JR / PU 50–80 mm / Gyvatukai / NTC`,
            scaleNote: chrome.scalePrefix,
            standardRef: 'LST EN 12828 · EN 12897 · PN6 / PN10 · S235JR',
            viewBox: '0 0 760 320',
            tabCrossSectionLabel: chrome.tabCrossSection,
            tabHydraulicWiringLabel: chrome.tabHydraulicWiring,
            flowLegendSupply: chrome.flowSupply,
            flowLegendReturn: chrome.flowReturn,
            flowLegendControl: chrome.flowControl,
            hydraulicRuleBanner:
                'EN 12828 sauga: tarp boilerio / akumuliacinės talpos ir apsauginio vožtuvo (3 bar šildymui / 6 bar geriamam vandeniui) bei Statico plėtimosi indo draudžiama montuoti uždaromąją armatūrą.',
            sparePartsFooterNote: chrome.spareFooter,
            dimensions: [
                { id: 'dim-height', label: 'Aukštis H = 950–1950 mm', x1: 235, y1: 42, x2: 235, y2: 268 },
                { id: 'dim-dia', label: 'Ø 500–850 mm (PU 50–80 mm)', x1: 295, y1: 282, x2: 465, y2: 282 },
                { id: 'dim-coil', label: 'Gyvatukas S = 1,45–2,1 m² (G 1")', x1: 495, y1: 135, x2: 635, y2: 135 },
            ],
            callouts: [
                {
                    pinNumber: '01',
                    code: 'S235JR INDAS',
                    title: 'Slėginis plieno indas (S235JR / Emalis)',
                    materialOrSpec: 'Lakštinis plienas S235JR (3–4 mm), išbandytas 1,5×PN hidrauliniu slėgiu',
                    engineeringNote: 'Akumuliacinėms talpoms – juodas plienas; ŠV boileriams – titano emalis + 850 °C degimas.',
                    sparePartStatus: 'Sandėlyje Kaune (Gorenje ZV / Dražice)',
                    x: 315,
                    y: 78,
                    targetX: 345,
                    targetY: 95,
                },
                {
                    pinNumber: '02',
                    code: 'PU 50–80 mm',
                    title: 'Aukšto tankio PU šilumos izoliacija (50–80 mm)',
                    materialOrSpec: 'Freono neturintis kietas poliuretanas (λ = 0,022 W/m·K), B klasės nuostoliai',
                    engineeringNote: 'Sumažina paros šilumos nuostolius iki < 1,2 kWh/24h.',
                    sparePartStatus: 'Sandėlyje Kaune (izoliaciniai kevalai)',
                    x: 272,
                    y: 165,
                    targetX: 302,
                    targetY: 165,
                },
                {
                    pinNumber: '03',
                    code: 'GYVATUKAI S1/S2',
                    title: 'Spiraliniai šilumokaičiai (gyvatukai)',
                    materialOrSpec: 'Padidinto ploto spiralinis vamzdis S = 1,45–2,5 m² šilumos siurbliui arba katilui',
                    engineeringNote: 'Karštas katilo srautas jungiamas į viršutinį gyvatuko įvadą, grįžtamas – į apatinį.',
                    sparePartStatus: 'Sandėlyje Kaune (flanšiniai šilumokaičiai)',
                    x: 445,
                    y: 195,
                    targetX: 405,
                    targetY: 195,
                },
                {
                    pinNumber: '04',
                    code: 'MG ANODAS + TENAS',
                    title: 'Magnio anodas ir elektrinio teno flanšas (G 6/4")',
                    materialOrSpec: 'Katodinės apsaugos Mg anodas Ø26×400 mm + 2,0–6,0 kW rezervinio teno lizdas',
                    engineeringNote: 'Magnio anodo būklę tikrinti kas 18–24 mėn., kad išliktų indo korozijos garantija.',
                    sparePartStatus: 'Sandėlyje Kaune (Mg anodai ir tenai)',
                    x: 380,
                    y: 52,
                    targetX: 380,
                    targetY: 75,
                },
                {
                    pinNumber: '05',
                    code: 'NTC GILZĖS 1/2"',
                    title: 'Panardinamos jutiklių gilzės (NTC 10kΩ / PT1000)',
                    materialOrSpec: '2–3× žalvarinės gilzės G 1/2" Ø8 mm viršutinės ir apatinės zonos temperatūrai',
                    engineeringNote: 'Į gilzę įspausti šiluminės pastos, kad valdiklis matytų tikslią vandens temperatūrą.',
                    sparePartStatus: 'Sandėlyje Kaune (žalvarinės gilzės ir NTC)',
                    x: 472,
                    y: 122,
                    targetX: 425,
                    targetY: 122,
                },
                {
                    pinNumber: '06',
                    code: 'EN 12828 SAUGA',
                    title: 'EN 12828 saugos grupė ir Statico plėtimosi indas',
                    materialOrSpec: 'Nuorintojas, manometras, 3/6 bar apsauginis vožtuvas ir IMI Pneumatex indas',
                    engineeringNote: 'Oro pagalvės slėgis P0 = H_stat/10 + 0,2 bar nustatomas prieš užpildant sistemą.',
                    sparePartStatus: 'Sandėlyje Kaune (Pneumatex Statico / Aquapresso)',
                    x: 565,
                    y: 235,
                    targetX: 455,
                    targetY: 235,
                },
            ],
        };
    }

    if (family === 'radiator_convector') {
        return {
            family,
            familyBadge:
                locale === 'lt'
                    ? 'RADIATORIAUS IR KONVEKTORIAUS MAZGAS · EN 442'
                    : 'RADIATOR & CONVECTOR CONNECTION BLUEPRINT · EN 442',
            title: `CAD · ${sku} · Ašių tarpas L=350/500/600 mm · 50 mm VK / G 1/2"`,
            scaleNote: chrome.scalePrefix,
            standardRef: 'LST EN 442 · PN10 / PN16 · ΔT = 50 K / 30 K',
            viewBox: '0 0 760 320',
            tabCrossSectionLabel: chrome.tabCrossSection,
            tabHydraulicWiringLabel: chrome.tabHydraulicWiring,
            flowLegendSupply: chrome.flowSupply,
            flowLegendReturn: chrome.flowReturn,
            flowLegendControl: chrome.flowControl,
            hydraulicRuleBanner:
                'Vienvamzdė vs dvivamzdė sistema: sovietiniame stoviniame name su „permyčka“ privalomas Danfoss RA-G (Kvs ≥ 2,3), dvivamzdėje – RA-N arba Heimeier Eclipse AFC.',
            sparePartsFooterNote: chrome.spareFooter,
            dimensions: [
                { id: 'dim-axis', label: 'Ašių tarpas L = 350 / 500 / 600 mm', x1: 162, y1: 78, x2: 162, y2: 228 },
                { id: 'dim-vk', label: 'Apatinis VK = 50 mm (G 3/4" Eurokonusas)', x1: 492, y1: 268, x2: 562, y2: 268 },
                { id: 'dim-width', label: 'Sekcijos gylis B = 80–100 mm (EN 442)', x1: 225, y1: 268, x2: 465, y2: 268 },
            ],
            callouts: [
                {
                    pinNumber: '01',
                    code: 'KONVEKCINĖS BRIAUNOS',
                    title: 'Konvekcinės plokštės ir vandens kanalai (EN 442)',
                    materialOrSpec: 'Lieto aliuminio sekcijos (POL 500) arba šalto valcavimo plienas 1,25 mm (Tipas 22)',
                    engineeringNote: 'Užtikrina 70% konvekcinį ir 30% spindulinį šilumos atidavimą net prie 55/45 °C režimo.',
                    sparePartStatus: 'Sandėlyje Kaune (Ferroli POL / plieniniai)',
                    x: 345,
                    y: 145,
                    targetX: 345,
                    targetY: 145,
                },
                {
                    pinNumber: '02',
                    code: 'G 1"×1/2" ŠONINIS',
                    title: 'Šoninio pajungimo redukcinės aklės (G 1"×1/2" D/K)',
                    materialOrSpec: 'Dešininis (D) arba kairinis (K) sriegis su silikoninėmis tarpinėmis',
                    engineeringNote: 'Tiekiamas karštas vanduo visada jungiamas į viršutinę 1/2" atšaką, grįžtamas – į apatinę.',
                    sparePartStatus: 'Sandėlyje Kaune (montavimo komplektai 1/2")',
                    x: 205,
                    y: 84,
                    targetX: 235,
                    targetY: 84,
                },
                {
                    pinNumber: '03',
                    code: 'NUORINTOJAS + AKLĖ',
                    title: 'Viršutinis Majevskio nuorintojas ir aklė (1/2")',
                    materialOrSpec: 'Nikaliuotas žalvaris G 1/2" su O-žiedo sandarinimu be pakulų',
                    engineeringNote: 'Montuojamas priešingoje viršutinėje radiatoriaus pusėje nei tiekimo vamzdis.',
                    sparePartStatus: 'Sandėlyje Kaune (nuorintojai ir aklės)',
                    x: 495,
                    y: 78,
                    targetX: 468,
                    targetY: 84,
                },
                {
                    pinNumber: '04',
                    code: '50 mm VK H-BLOKAS',
                    title: 'Apatinis 50 mm VK mazgas (Multilux / RLV-K)',
                    materialOrSpec: '50 mm centrų atstumas, G 3/4" Eurokonusai ir integruota termostatinė įdėklas',
                    engineeringNote: 'Tiesus H-blokas grindiniam įvadui arba kampinis H-blokas vamzdžiams iš sienos.',
                    sparePartStatus: 'Sandėlyje Kaune (Danfoss RLV-K / Vekolux)',
                    x: 535,
                    y: 232,
                    targetX: 452,
                    targetY: 228,
                },
                {
                    pinNumber: '05',
                    code: 'RA 2990 / K-GALVA',
                    title: 'Termostatinė galvutė (RA-Click / M30×1,5)',
                    materialOrSpec: 'Dujinis arba skystinis silfonas, diapazonas 7–28 °C, užšalimo apsauga (*)',
                    engineeringNote: 'Montuoti horizontaliai, kad kylančio šilto oro srovė nuo vamzdžio neiškraipytų matavimo.',
                    sparePartStatus: 'Sandėlyje Kaune (013G2990 / Heimeier K)',
                    x: 575,
                    y: 155,
                    targetX: 482,
                    targetY: 165,
                },
                {
                    pinNumber: '06',
                    code: 'LAIKIKLIAI L=110 mm',
                    title: 'Sieniniai ankeriniai laikikliai ir atstumas nuo palangės',
                    materialOrSpec: 'Grūdinto plieno kronšteinai su plastikiniais amortizatoriais (2–4 vnt.)',
                    engineeringNote: 'Minimalus tarpas nuo grindų ≥ 100 mm, nuo palangės ≥ 100 mm, nuo sienos ≥ 30 mm.',
                    sparePartStatus: 'Sandėlyje Kaune (tvirtinimo kronšteinai)',
                    x: 215,
                    y: 228,
                    targetX: 255,
                    targetY: 220,
                },
            ],
        };
    }

    if (family === 'underfloor_manifold') {
        return {
            family,
            familyBadge:
                locale === 'lt'
                    ? 'GRINDINIO ŠILDYMO KOLEKTORIAUS MAZGAS · LST EN 1264'
                    : 'UNDERFLOOR HEATING MANIFOLD ASSEMBLY · LST EN 1264',
            title: `CAD · ${sku} · Rotametrai 0–5 l/min · M30×1,5 · 3/4" × 16×2.0 mm`,
            scaleNote: chrome.scalePrefix,
            standardRef: 'LST EN 1264 · G 1" kolektorius · Eurokonusas 3/4" × 16×2,0 mm',
            viewBox: '0 0 760 320',
            tabCrossSectionLabel: chrome.tabCrossSection,
            tabHydraulicWiringLabel: chrome.tabHydraulicWiring,
            flowLegendSupply: chrome.flowSupply,
            flowLegendReturn: chrome.flowReturn,
            flowLegendControl: chrome.flowControl,
            hydraulicRuleBanner:
                'EN 1264 balansavimas: vieno 16×2,0 mm kontūro ilgis L ≤ 80–100 m (ΔT = 5 K), srautas nustatomas rotametru (0,5–3,5 l/min) pagal kilpos ilgį.',
            sparePartsFooterNote: chrome.spareFooter,
            dimensions: [
                { id: 'dim-pitch', label: 'Atšakų žingsnis 50 mm · 2–12 kontūrų (G 1")', x1: 215, y1: 52, x2: 535, y2: 52 },
                { id: 'dim-euro', label: 'Eurokonusai 3/4" × 16×2.0 mm (PEX-a / PE-RT)', x1: 215, y1: 274, x2: 535, y2: 274 },
                { id: 'dim-bars', label: 'Tarpas tarp sijų H = 210 mm', x1: 635, y1: 95, x2: 635, y2: 205 },
            ],
            callouts: [
                {
                    pinNumber: '01',
                    code: 'ROTAMETRAI 0–5 l/min',
                    title: 'Tiekiama sija su srauto matuokliais (rotametrai 0–5 l/min)',
                    materialOrSpec: 'Nerūdijančio plieno AISI 304 arba žalvario G 1" sija su skaidriais 0–5 l/min rotametrais',
                    engineeringNote: 'Srautas l/min reguliuojamas sukant rotametro žiedą, kol plūdė pasiekia projektinę vertę.',
                    sparePartStatus: 'Sandėlyje Kaune (atsarginiai rotametrai)',
                    x: 295,
                    y: 72,
                    targetX: 295,
                    targetY: 98,
                },
                {
                    pinNumber: '02',
                    code: 'M30×1,5 PAVAROS',
                    title: 'Grįžtama sija su termoelektrinėmis pavaromis (M30×1,5)',
                    materialOrSpec: 'Termostatiniai vožtuvai M30×1,5 mm + 230V / 24V NC pavaros kiekvienam kambario kontūrui',
                    engineeringNote: 'Kambario termostatui davus signalą, pavara atidaro arba uždaro konkrečią grindų kilpą.',
                    sparePartStatus: 'Sandėlyje Kaune (M30×1,5 NC pavaros)',
                    x: 425,
                    y: 165,
                    targetX: 415,
                    targetY: 192,
                },
                {
                    pinNumber: '03',
                    code: '3/4" × 16×2.0 mm',
                    title: 'Eurokonusinės jungtys (3/4" × 16×2.0 mm)',
                    materialOrSpec: 'Suspaudžiamas žiedas, įvorė su EPDM O-žiedu vamzdžiams 16×2,0 mm arba 17×2,0 mm',
                    engineeringNote: 'Prieš montuojant vamzdį sukalibruoti ir nuimti vidinę briauną kalibratoriumi.',
                    sparePartStatus: 'Sandėlyje Kaune (Comisa / Heimeier Eurokonusai)',
                    x: 345,
                    y: 248,
                    targetX: 355,
                    targetY: 222,
                },
                {
                    pinNumber: '04',
                    code: 'NUORINTOJAS + DRENAŽAS',
                    title: 'Automatinis nuorintojas ir pildymo / išleidimo kranas',
                    materialOrSpec: 'Galiniai mazgai G 1" su automatiniu oro išleidėju ir pasukamu G 3/4" žarnos antgaliu',
                    engineeringNote: 'Kiekvienas kontūras pildomas ir nuorinamas po vieną, uždarius kitas kilpas.',
                    sparePartStatus: 'Sandėlyje Kaune (kolektoriaus galiniai mazgai)',
                    x: 585,
                    y: 112,
                    targetX: 552,
                    targetY: 102,
                },
                {
                    pinNumber: '05',
                    code: 'PAMAIŠYMO MAZGAS',
                    title: 'Cirkuliacinis pamaišymo mazgas (35–45 °C)',
                    materialOrSpec: 'Termostatinė galvutė su kapiliariniu jutikliu (20–50 °C) + A klasės cirkuliacinis siurblys',
                    engineeringNote: 'Apriboja į betono išlyginamąjį sluoksnį patenkančio vandens temperatūrą iki ≤ 45 °C.',
                    sparePartStatus: 'Sandėlyje Kaune (pamaišymo mazgai)',
                    x: 135,
                    y: 152,
                    targetX: 185,
                    targetY: 152,
                },
                {
                    pinNumber: '06',
                    code: 'KRONŠTEINAI + SPINTELĖ',
                    title: 'Garsą slopinantys laikikliai ir kolektoriaus spintelė',
                    materialOrSpec: 'Cinkuoto plieno laikikliai su EPDM vibracijos tarpinėmis (gylis 110–160 mm)',
                    engineeringNote: 'Tiekimo sija montuojama viršuje, grįžtama – apačioje su 210 mm tarpu tarp ašių.',
                    sparePartStatus: 'Sandėlyje Kaune (potinkinės ir virštinkinės spintelės)',
                    x: 585,
                    y: 215,
                    targetX: 552,
                    targetY: 198,
                },
            ],
        };
    }

    // 7. spare_part_sensor
    return {
        family: 'spare_part_sensor',
        familyBadge:
            locale === 'lt'
                ? 'ATSARGINĖS DALIES IR JUTIKLIO MONTAVIMO SCHEMA · SERVISAS'
                : 'SPARE PART & SENSOR MOUNTING SCHEMATIC · OEM SERVICE',
        title: `CAD · ${sku} · G 3/8" / M14 · 230V AC L/N/PE · NTC 10kΩ / PT1000`,
        scaleNote: chrome.scalePrefix,
        standardRef: 'EN 60730 · IP40–IP65 · 230V AC / NTC 10kΩ / PT1000',
        viewBox: '0 0 760 320',
        tabCrossSectionLabel: chrome.tabCrossSection,
        tabHydraulicWiringLabel: chrome.tabHydraulicWiring,
        flowLegendSupply: chrome.flowSupply,
        flowLegendReturn: chrome.flowReturn,
        flowLegendControl: chrome.flowControl,
        hydraulicRuleBanner:
            'Serviso taisyklė: keičiant uždegimo teną ar NTC / PT1000 jutiklį, privaloma atjungti 230V AC maitinimą ir palikti ≥ 5 mm oro tarpą aplink kaitinimo zoną.',
        sparePartsFooterNote: chrome.spareFooter,
        dimensions: [
            { id: 'dim-thread-sp', label: 'Tvirtinimas G 3/8" / M14×1,5 / Ø6–12 mm', x1: 235, y1: 112, x2: 235, y2: 215 },
            { id: 'dim-hot-zone', label: 'Darbinė zona L = 95–155 mm (iki 1050 °C)', x1: 265, y1: 268, x2: 495, y2: 268 },
            { id: 'dim-cable', label: '230V AC L/N/PE arba NTC 10kΩ / PT1000', x1: 525, y1: 268, x2: 705, y2: 268 },
        ],
        callouts: [
            {
                pinNumber: '01',
                code: 'DARBINIS ELEMENTAS',
                title: 'Kaitinimo / matavimo darbinis antgalis (Si3N4 / PT1000)',
                materialOrSpec: 'Keraminis tenas 300–400 W (1050 °C) arba nerūdijančio plieno AISI 316 jutiklio kapsulė',
                engineeringNote: 'Neliesti kaitinimo elemento riebaluotais pirštais ir neįremti į metalinį korpusą.',
                sparePartStatus: 'Sandėlyje Kaune (originali OEM dalis)',
                x: 415,
                y: 122,
                targetX: 395,
                targetY: 162,
            },
            {
                pinNumber: '02',
                code: 'G 3/8" / M14 SRIEGIS',
                title: 'Tvirtinimo įvorė ir srieginis flanšas (G 3/8" / M14)',
                materialOrSpec: 'Žalvarinis arba AISI 304 lizdas G 3/8", G 1/2" arba M14×1,5 mm su fiksavimo varžtu',
                engineeringNote: 'Fiksavimo varžtą priveržti tolygiai, kad nesuskaldytumėte keraminės šerdies.',
                sparePartStatus: 'Sandėlyje Kaune (įvorės ir laikikliai)',
                x: 245,
                y: 95,
                targetX: 255,
                targetY: 152,
            },
            {
                pinNumber: '03',
                code: 'ORO TARPAS ≥ 5 mm',
                title: 'Konvekcinio oro prapūtimo kanalas (≥ 5 mm tarpas)',
                materialOrSpec: 'Priverstinės oro cirkuliacijos žiedinis kanalas šilumos perdavimui į granules',
                engineeringNote: 'Užsikimšus oro skylutėms pelenais, tenas perkaista – išvalyti kiekvieno serviso metu.',
                sparePartStatus: 'Sandėlyje Kaune (apsauginiai vamzdeliai)',
                x: 345,
                y: 235,
                targetX: 345,
                targetY: 188,
            },
            {
                pinNumber: '04',
                code: 'TERMOIZOLIACIJA',
                title: 'Aukštatemperatūrė stiklo audinio / silikono izoliacija',
                materialOrSpec: 'Karščiui atsparus laido apvalkalas (iki +450 °C) + keraminė tarpinė',
                engineeringNote: 'Laidai negali liestis prie įkaitusio degiklio kaklo ar katilo durelių.',
                sparePartStatus: 'Sandėlyje Kaune (karščiui atsparūs laidai)',
                x: 515,
                y: 112,
                targetX: 505,
                targetY: 162,
            },
            {
                pinNumber: '05',
                code: '230V AC L/N/PE',
                title: 'Jėgos kaladėlė (230V AC L/N/PE) ir saugiklis',
                materialOrSpec: '230V AC 50 Hz, greito suveikimo saugiklis F 3,15 A / 6,3 A valdiklio plokštėje',
                engineeringNote: 'Prieš jungiant naują teną, multimetru patikrinti varžą (R ≈ 130–175 Ω 300–400 W tenui).',
                sparePartStatus: 'Sandėlyje Kaune (valdiklių kaladėlės ir saugikliai)',
                x: 645,
                y: 122,
                targetX: 625,
                targetY: 152,
            },
            {
                pinNumber: '06',
                code: 'NTC 10kΩ / PT1000',
                title: 'Valdiklio signalinis įėjimas (NTC 10kΩ / PT1000 / STB)',
                materialOrSpec: 'NTC 10 kΩ (prie 25 °C) arba PT1000 (1000 Ω prie 0 °C) + avarinis STB 95 °C termostatas',
                engineeringNote: 'Jutiklio laidus vesti atskirai nuo 230V jėgos kabelių, kad išvengtumėte elektromagnetinių trikdžių.',
                sparePartStatus: 'Sandėlyje Kaune (NTC 10kΩ / PT1000 / STB)',
                x: 645,
                y: 225,
                targetX: 625,
                targetY: 195,
            },
        ],
    };
}

export interface PdpCadExplodedSchematicProps {
    sku: string;
    productTitle: string;
    categoryName?: string | null;
    subCategoryName?: string | null;
    brandName?: string | null;
    locale?: AppLocale;
}

export function PdpCadExplodedSchematic({
    sku,
    productTitle,
    categoryName,
    subCategoryName,
    brandName,
    locale = 'lt',
}: PdpCadExplodedSchematicProps) {
    const family = detectProductCadFamily({
        sku,
        name: productTitle,
        categoryName,
        subCategoryName,
        brandName,
    });
    const spec = getProductCadBlueprintSpec(family, locale, sku, productTitle);
    const chrome = UI_CHROME_BY_LOCALE[locale] || UI_CHROME_BY_LOCALE.lt;

    const [activeTab, setActiveTab] = useState<'cross_section' | 'hydraulic_wiring'>('cross_section');
    const [activePinIndex, setActivePinIndex] = useState<number>(0);

    const activeCallout = spec.callouts[activePinIndex] || spec.callouts[0]!;

    return (
        <div
            data-testid="pdp-cad-blueprint"
            className="border border-[#2C3742] bg-[#11161B] text-[#F5F3EE] p-4 space-y-3"
        >
            {/* Top CAD Title Block & View Switcher */}
            <div
                data-testid="pdp-exploded-cad-blueprint"
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#2C3742] pb-3"
            >
                <div className="space-y-0.5">
                    <span className="tabular-nums text-xs font-bold text-[#FF8A3D] block">
                        {spec.familyBadge}
                    </span>
                    <div className="flex flex-wrap items-center gap-2">
                        <strong className="font-mono text-xs sm:text-sm font-extrabold text-white">
                            {spec.title}
                        </strong>
                        <span className="font-mono text-xs text-[#C9D0D8] border border-[#2C3742] bg-[#1B232C] px-2 py-0.5">
                            {spec.scaleNote}
                        </span>
                    </div>
                </div>

                <div className="flex flex-wrap gap-1.5" role="tablist" aria-label={spec.title}>
                    <button
                        type="button"
                        role="tab"
                        aria-selected={activeTab === 'cross_section'}
                        data-testid="pdp-cad-tab-cross-section"
                        onClick={() => setActiveTab('cross_section')}
                        className={`min-h-[44px] px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer ${
                            activeTab === 'cross_section'
                                ? 'bg-[#C2410C] text-white border border-[#FF8A3D]'
                                : 'bg-[#1B232C] text-[#C9D0D8] border border-[#2C3742] hover:text-white'
                        }`}
                    >
                        {spec.tabCrossSectionLabel}
                    </button>
                    <button
                        type="button"
                        role="tab"
                        aria-selected={activeTab === 'hydraulic_wiring'}
                        data-testid="pdp-cad-tab-hydraulic-wiring"
                        onClick={() => setActiveTab('hydraulic_wiring')}
                        className={`min-h-[44px] px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer ${
                            activeTab === 'hydraulic_wiring'
                                ? 'bg-[#C2410C] text-white border border-[#FF8A3D]'
                                : 'bg-[#1B232C] text-[#C9D0D8] border border-[#2C3742] hover:text-white'
                        }`}
                    >
                        {spec.tabHydraulicWiringLabel}
                    </button>
                </div>
            </div>

            {/* Flow & Signal Legend Strip */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#C9D0D8] font-mono">
                <div className="flex flex-wrap items-center gap-4">
                    <span className="inline-flex items-center gap-1.5">
                        <span className="inline-block w-3 h-0.5 bg-[#FF8A3D]" />
                        {spec.flowLegendSupply}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                        <span className="inline-block w-3 h-0.5 bg-[#38BDF8]" />
                        {spec.flowLegendReturn}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                        <span className="inline-block w-3 h-0.5 bg-[#4ADE80]" />
                        {spec.flowLegendControl}
                    </span>
                </div>
                <span className="text-[#A3ADB8]">{spec.standardRef}</span>
            </div>

            {/* Multi-Layer Interactive Technical SVG Blueprint */}
            <div className="border border-[#2C3742] bg-[#0B0F13] p-2">
                <svg
                    viewBox="0 0 760 320"
                    role="img"
                    aria-label={`${spec.title} – ${
                        activeTab === 'cross_section'
                            ? spec.tabCrossSectionLabel
                            : spec.tabHydraulicWiringLabel
                    }`}
                    className="w-full h-auto block select-none"
                >
                    <defs>
                        <marker
                            id="cad-arrow-orange"
                            viewBox="0 0 10 10"
                            refX="6"
                            refY="5"
                            markerWidth="5"
                            markerHeight="5"
                            orient="auto-start-reverse"
                        >
                            <path d="M 0 1 L 10 5 L 0 9 z" fill="#FF8A3D" />
                        </marker>
                        <marker
                            id="cad-arrow-cyan"
                            viewBox="0 0 10 10"
                            refX="6"
                            refY="5"
                            markerWidth="5"
                            markerHeight="5"
                            orient="auto-start-reverse"
                        >
                            <path d="M 0 1 L 10 5 L 0 9 z" fill="#38BDF8" />
                        </marker>
                        <marker
                            id="cad-arrow-dim"
                            viewBox="0 0 10 10"
                            refX="6"
                            refY="5"
                            markerWidth="4.5"
                            markerHeight="4.5"
                            orient="auto-start-reverse"
                        >
                            <path d="M 0 1 L 10 5 L 0 9 z" fill="#94A3B8" />
                        </marker>
                    </defs>

                    {/* Precision CAD Frame & Centerlines */}
                    <rect
                        x="8"
                        y="8"
                        width="744"
                        height="304"
                        fill="none"
                        stroke="#2C3742"
                        strokeWidth="1.5"
                    />
                    <line
                        x1="28"
                        y1="165"
                        x2="732"
                        y2="165"
                        stroke="#334155"
                        strokeWidth="1"
                        strokeDasharray="6 3"
                    />
                    <line
                        x1="380"
                        y1="20"
                        x2="380"
                        y2="295"
                        stroke="#334155"
                        strokeWidth="1"
                        strokeDasharray="6 3"
                    />

                    {/* VIEW 1: Cross-Section Assembly Cutaway */}
                    {activeTab === 'cross_section' && (
                        <g data-testid={`cad-svg-cross-section-${family}`}>
                            {family === 'valve_actuator' && (
                                <g>
                                    {/* Straight pipe upstream 5xDN and downstream 2xDN */}
                                    <rect x="44" y="182" width="166" height="36" fill="#16202A" stroke="#64748B" strokeWidth="1.5" strokeDasharray="4 2" />
                                    <rect x="550" y="182" width="160" height="36" fill="#16202A" stroke="#64748B" strokeWidth="1.5" strokeDasharray="4 2" />
                                    {/* Brass CW617N Valve Body Cutaway */}
                                    <path
                                        d="M 210 172 L 325 172 L 340 132 L 420 132 L 435 172 L 550 172 L 550 228 L 435 228 L 415 248 L 345 248 L 325 228 L 210 228 Z"
                                        fill="#1E2936"
                                        stroke="#F5F3EE"
                                        strokeWidth="2.2"
                                    />
                                    {/* Internal flow partition & throttling seat */}
                                    <path
                                        d="M 290 228 L 345 190 L 415 190 L 470 172"
                                        fill="none"
                                        stroke="#94A3B8"
                                        strokeWidth="2"
                                    />
                                    {/* Flow cone & EPDM diaphragm */}
                                    <polygon
                                        points="356,188 404,188 394,214 366,214"
                                        fill="#FF8A3D"
                                        stroke="#F5F3EE"
                                        strokeWidth="1.5"
                                    />
                                    {/* Stainless Spindle Stem (5 mm stroke) */}
                                    <rect x="375" y="96" width="10" height="92" fill="#E2E8F0" stroke="#475569" strokeWidth="1.2" />
                                    {/* VA41 / M30x1.5 Adapter Collar */}
                                    <rect x="336" y="118" width="88" height="22" rx="2" fill="#253344" stroke="#38BDF8" strokeWidth="2" />
                                    {/* ABN-A5 230V Actuator Housing */}
                                    <rect x="322" y="42" width="116" height="74" rx="4" fill="#1B232C" stroke="#4ADE80" strokeWidth="2.2" />
                                    <line x1="336" y1="68" x2="424" y2="68" stroke="#4ADE80" strokeWidth="1.5" />
                                    <text x="380" y="60" textAnchor="middle" fill="#4ADE80" fontSize="10" fontWeight="700">
                                        ABN-A5 230V NC · IP54
                                    </text>
                                    {/* P1 / P2 Test Points */}
                                    <line x1="275" y1="172" x2="255" y2="146" stroke="#38BDF8" strokeWidth="2" />
                                    <circle cx="255" cy="146" r="4" fill="#38BDF8" />
                                    <text x="242" y="138" fill="#38BDF8" fontSize="10" fontWeight="700">P1 (+)</text>
                                    <line x1="485" y1="172" x2="505" y2="146" stroke="#38BDF8" strokeWidth="2" />
                                    <circle cx="505" cy="146" r="4" fill="#38BDF8" />
                                    <text x="512" y="138" fill="#38BDF8" fontSize="10" fontWeight="700">P2 (-)</text>
                                    {/* Animated Flow Path */}
                                    <path
                                        d="M 60 200 L 340 200 L 380 182 L 420 200 L 690 200"
                                        fill="none"
                                        stroke="#FF8A3D"
                                        strokeWidth="2.4"
                                        strokeDasharray="8 5"
                                        markerEnd="url(#cad-arrow-orange)"
                                    />
                                </g>
                            )}

                            {family === 'pellet_burner_boiler' && (
                                <g>
                                    {/* Pellet Hopper & 60 deg Feed Auger */}
                                    <line x1="56" y1="54" x2="215" y2="155" stroke="#38BDF8" strokeWidth="12" />
                                    <line x1="56" y1="54" x2="215" y2="155" stroke="#F5F3EE" strokeWidth="2" strokeDasharray="6 4" />
                                    {/* Burner Housing & PWM Fan */}
                                    <rect x="148" y="150" width="122" height="76" fill="#1E2936" stroke="#4ADE80" strokeWidth="2" />
                                    <circle cx="185" cy="188" r="22" fill="#0F172A" stroke="#38BDF8" strokeWidth="1.8" />
                                    {/* CNC P265GH Door Mounting Flange */}
                                    <rect x="270" y="114" width="16" height="142" fill="#FF8A3D" stroke="#F5F3EE" strokeWidth="1.8" />
                                    {/* CrNi Combustion Tube, Ceramic Igniter & Moving Grate */}
                                    <rect x="286" y="156" width="118" height="58" fill="#253344" stroke="#F5F3EE" strokeWidth="2" />
                                    <line x1="286" y1="198" x2="365" y2="198" stroke="#FF8A3D" strokeWidth="3" />
                                    {/* Flame Plume inside Boiler Chamber */}
                                    <path
                                        d="M 404 166 Q 475 148 518 182 Q 475 216 404 202 Z"
                                        fill="#C2410C"
                                        stroke="#FF8A3D"
                                        strokeWidth="1.8"
                                    />
                                    {/* Boiler Water Jacket & Heat Exchanger Passes */}
                                    <rect x="286" y="64" width="370" height="196" fill="none" stroke="#94A3B8" strokeWidth="2.4" />
                                    <rect x="330" y="82" width="290" height="18" fill="#1E2936" stroke="#38BDF8" strokeWidth="1.5" />
                                    <rect x="330" y="112" width="290" height="18" fill="#1E2936" stroke="#FF8A3D" strokeWidth="1.5" />
                                    {/* 55 C Anticondensation Loop */}
                                    <path
                                        d="M 656 92 L 705 92 L 705 236 L 656 236"
                                        fill="none"
                                        stroke="#FF8A3D"
                                        strokeWidth="2.4"
                                        strokeDasharray="6 3"
                                    />
                                    <circle cx="705" cy="165" r="14" fill="#1E2936" stroke="#4ADE80" strokeWidth="2" />
                                    <text x="705" y="169" textAnchor="middle" fill="#4ADE80" fontSize="9" fontWeight="700">55°C</text>
                                </g>
                            )}

                            {family === 'heat_pump' && (
                                <g>
                                    {/* Outdoor R290 Monoblock Unit */}
                                    <rect x="68" y="72" width="185" height="148" fill="#1E2936" stroke="#F5F3EE" strokeWidth="2.2" />
                                    <circle cx="132" cy="146" r="44" fill="#0F172A" stroke="#38BDF8" strokeWidth="2" />
                                    <line x1="100" y1="146" x2="164" y2="146" stroke="#38BDF8" strokeWidth="1.5" />
                                    <line x1="132" y1="114" x2="132" y2="178" stroke="#38BDF8" strokeWidth="1.5" />
                                    <rect x="192" y="92" width="44" height="108" fill="#253344" stroke="#FF8A3D" strokeWidth="1.8" />
                                    {/* Anti-vibration Base Frame */}
                                    <rect x="62" y="220" width="197" height="18" fill="#334155" stroke="#94A3B8" strokeWidth="1.5" />
                                    {/* Insulated Supply & Return Lines DN25 */}
                                    <line x1="253" y1="125" x2="555" y2="125" stroke="#FF8A3D" strokeWidth="3" strokeDasharray="8 4" />
                                    <line x1="555" y1="198" x2="253" y2="198" stroke="#38BDF8" strokeWidth="3" strokeDasharray="8 4" />
                                    {/* 3-Way Diverter Valve */}
                                    <polygon points="490,115 520,115 505,140" fill="#1E2936" stroke="#4ADE80" strokeWidth="2" />
                                    {/* Zeparo Magnetic Dirt Separator */}
                                    <rect x="398" y="178" width="40" height="44" rx="4" fill="#1E2936" stroke="#38BDF8" strokeWidth="2" />
                                    <text x="418" y="204" textAnchor="middle" fill="#38BDF8" fontSize="9" fontWeight="700">Fe3O4</text>
                                    {/* ZV Buffer Tank Hydraulic Separation */}
                                    <rect x="555" y="78" width="122" height="168" rx="18" fill="#1E2936" stroke="#F5F3EE" strokeWidth="2.2" />
                                    <text x="616" y="166" textAnchor="middle" fill="#FF8A3D" fontSize="11" fontWeight="700">ZV 100–200 L</text>
                                </g>
                            )}

                            {family === 'buffer_tank_boiler' && (
                                <g>
                                    {/* Outer PU 50-80mm Insulation Shell */}
                                    <rect x="288" y="42" width="184" height="226" rx="28" fill="#1E2936" stroke="#94A3B8" strokeWidth="2" />
                                    {/* Inner S235JR Steel Pressure Vessel */}
                                    <rect x="308" y="56" width="144" height="198" rx="20" fill="#0F172A" stroke="#F5F3EE" strokeWidth="2.2" />
                                    {/* Magnesium Anode Rod at Top */}
                                    <rect x="376" y="56" width="8" height="62" fill="#4ADE80" />
                                    {/* Upper & Lower Spiral Heat Exchanger Coils */}
                                    <path
                                        d="M 326 118 C 360 104, 400 104, 434 118 C 400 132, 360 132, 326 146 C 360 160, 400 160, 434 174 C 400 188, 360 188, 326 202 C 360 216, 400 216, 434 230"
                                        fill="none"
                                        stroke="#FF8A3D"
                                        strokeWidth="3"
                                    />
                                    {/* NTC Sensor Immersion Pockets */}
                                    <rect x="416" y="118" width="36" height="6" fill="#38BDF8" />
                                    <rect x="416" y="188" width="36" height="6" fill="#38BDF8" />
                                    {/* EN 12828 Statico Expansion Vessel Connection */}
                                    <line x1="452" y1="235" x2="545" y2="235" stroke="#38BDF8" strokeWidth="2.4" />
                                    <rect x="545" y="182" width="68" height="84" rx="14" fill="#1E2936" stroke="#38BDF8" strokeWidth="2" />
                                    <text x="579" y="226" textAnchor="middle" fill="#38BDF8" fontSize="10" fontWeight="700">Statico</text>
                                </g>
                            )}

                            {family === 'radiator_convector' && (
                                <g>
                                    {/* Radiator Panel Outer Frame & Vertical Convection Channels */}
                                    <rect x="225" y="68" width="248" height="172" rx="4" fill="#1E2936" stroke="#F5F3EE" strokeWidth="2.2" />
                                    {[255, 285, 315, 345, 375, 405, 435].map((xPos) => (
                                        <line
                                            key={xPos}
                                            x1={xPos}
                                            y1="78"
                                            x2={xPos}
                                            y2="230"
                                            stroke="#475569"
                                            strokeWidth="4"
                                        />
                                    ))}
                                    {/* Top Horizontal Collector & Bottom Collector */}
                                    <line x1="232" y1="84" x2="466" y2="84" stroke="#FF8A3D" strokeWidth="4" />
                                    <line x1="232" y1="224" x2="466" y2="224" stroke="#38BDF8" strokeWidth="4" />
                                    {/* Bottom 50 mm VK H-Block Connection */}
                                    <line x1="436" y1="240" x2="436" y2="272" stroke="#FF8A3D" strokeWidth="3" />
                                    <line x1="458" y1="240" x2="458" y2="272" stroke="#38BDF8" strokeWidth="3" />
                                    <rect x="428" y="246" width="38" height="18" fill="#253344" stroke="#F5F3EE" strokeWidth="1.5" />
                                    {/* Thermostatic Head RA 2990 / K-head */}
                                    <rect x="473" y="152" width="42" height="24" rx="3" fill="#1B232C" stroke="#4ADE80" strokeWidth="2" />
                                </g>
                            )}

                            {family === 'underfloor_manifold' && (
                                <g>
                                    {/* Mixing Pump Unit on Left */}
                                    <rect x="148" y="86" width="48" height="132" fill="#1E2936" stroke="#4ADE80" strokeWidth="2" />
                                    <circle cx="172" cy="152" r="18" fill="#0F172A" stroke="#FF8A3D" strokeWidth="2" />
                                    {/* Supply Manifold Bar (Top) with Flowmeters 0-5 l/min */}
                                    <rect x="206" y="88" width="356" height="26" fill="#1E2936" stroke="#FF8A3D" strokeWidth="2.2" />
                                    {/* Return Manifold Bar (Bottom) with M30x1.5 Actuators */}
                                    <rect x="206" y="186" width="356" height="26" fill="#1E2936" stroke="#38BDF8" strokeWidth="2.2" />
                                    {[240, 285, 330, 375, 420, 465, 510].map((xLoop) => (
                                        <g key={xLoop}>
                                            {/* Top Rotameter Sight Glass */}
                                            <rect x={xLoop - 6} y="66" width="12" height="22" fill="#0F172A" stroke="#38BDF8" strokeWidth="1.4" />
                                            {/* Bottom M30x1.5 Electrothermal Actuator */}
                                            <rect x={xLoop - 8} y="162" width="16" height="24" fill="#253344" stroke="#4ADE80" strokeWidth="1.4" />
                                            {/* Eurokonus 3/4 x 16x2.0 Pipe Loops */}
                                            <line x1={xLoop} y1="114" x2={xLoop} y2="256" stroke="#FF8A3D" strokeWidth="2" strokeDasharray="4 2" />
                                            <line x1={xLoop + 10} y1="212" x2={xLoop + 10} y2="256" stroke="#38BDF8" strokeWidth="2" />
                                        </g>
                                    ))}
                                </g>
                            )}

                            {family === 'spare_part_sensor' && (
                                <g>
                                    {/* G 3/8 / M14 Threaded Mounting Sleeve */}
                                    <rect x="220" y="132" width="66" height="60" fill="#253344" stroke="#38BDF8" strokeWidth="2.2" />
                                    {/* Ceramic / Stainless Heating & Sensing Element */}
                                    <rect x="286" y="146" width="204" height="32" rx="4" fill="#1E2936" stroke="#FF8A3D" strokeWidth="2.2" />
                                    <line x1="302" y1="162" x2="474" y2="162" stroke="#FF8A3D" strokeWidth="3" strokeDasharray="8 4" />
                                    {/* High-Temp Braided Leads to Controller Terminal Block */}
                                    <path d="M 490 154 L 598 154" stroke="#FF8A3D" strokeWidth="2.4" />
                                    <path d="M 490 170 L 598 192" stroke="#4ADE80" strokeWidth="2.4" />
                                    {/* Controller Terminal Block (230V AC L/N/PE + NTC 10k / PT1000) */}
                                    <rect x="598" y="124" width="92" height="92" fill="#1E2936" stroke="#4ADE80" strokeWidth="2" />
                                    <text x="644" y="148" textAnchor="middle" fill="#FF8A3D" fontSize="10" fontWeight="700">230V L/N/PE</text>
                                    <text x="644" y="196" textAnchor="middle" fill="#4ADE80" fontSize="10" fontWeight="700">NTC / PT1000</text>
                                </g>
                            )}
                        </g>
                    )}

                    {/* VIEW 2: Hydraulic & Electrical Connection Schematic */}
                    {activeTab === 'hydraulic_wiring' && (
                        <g data-testid={`cad-svg-hydraulic-wiring-${family}`}>
                            {/* Primary Heat Source / Supply Bus */}
                            <rect x="48" y="64" width="160" height="192" fill="#1E2936" stroke="#FF8A3D" strokeWidth="2" />
                            <text x="128" y="102" textAnchor="middle" fill="#FF8A3D" fontSize="11" fontWeight="800">
                                T1 TIEKIMAS / ŠALTINIS
                            </text>
                            <text x="128" y="124" textAnchor="middle" fill="#F5F3EE" fontSize="10">
                                EN 12828 · PN6–PN16
                            </text>
                            <text x="128" y="218" textAnchor="middle" fill="#38BDF8" fontSize="11" fontWeight="800">
                                T2 GRĮŽTAMAS SRAUTAS
                            </text>

                            {/* Hydraulic Supply Line */}
                            <line
                                x1="208"
                                y1="108"
                                x2="532"
                                y2="108"
                                stroke="#FF8A3D"
                                strokeWidth="3"
                                markerEnd="url(#cad-arrow-orange)"
                            />
                            {/* Hydraulic Return Line */}
                            <line
                                x1="532"
                                y1="216"
                                x2="208"
                                y2="216"
                                stroke="#38BDF8"
                                strokeWidth="3"
                                markerEnd="url(#cad-arrow-cyan)"
                            />

                            {/* Central Engineered Node Box */}
                            <rect x="302" y="82" width="156" height="156" fill="#1B232C" stroke="#F5F3EE" strokeWidth="2.2" />
                            <text x="380" y="148" textAnchor="middle" fill="#FF8A3D" fontSize="11" fontWeight="800">
                                {sku}
                            </text>
                            <text x="380" y="168" textAnchor="middle" fill="#F5F3EE" fontSize="10">
                                {spec.standardRef}
                            </text>
                            <text x="380" y="190" textAnchor="middle" fill="#4ADE80" fontSize="10" fontWeight="700">
                                Δp / Kvs / NTC patikra
                            </text>

                            {/* Right Side Electrical & Controller Terminal Block */}
                            <rect x="536" y="64" width="176" height="192" fill="#1E2936" stroke="#4ADE80" strokeWidth="2" />
                            <text x="624" y="98" textAnchor="middle" fill="#4ADE80" fontSize="11" fontWeight="800">
                                AUTOMATIKOS KALADĖLĖ
                            </text>
                            <text x="624" y="124" textAnchor="middle" fill="#F5F3EE" fontSize="10">
                                230V AC 50Hz L / N / PE
                            </text>
                            <text x="624" y="148" textAnchor="middle" fill="#38BDF8" fontSize="10">
                                24V AC/DC · 0–10V PWM
                            </text>
                            <text x="624" y="172" textAnchor="middle" fill="#FF8A3D" fontSize="10">
                                NTC 10kΩ / PT1000 / STB 95°C
                            </text>
                            <line
                                x1="458"
                                y1="160"
                                x2="536"
                                y2="160"
                                stroke="#4ADE80"
                                strokeWidth="2.2"
                                strokeDasharray="6 3"
                            />
                        </g>
                    )}

                    {/* CAD Dimension Lines & Interactive Numbered Callout Pins [01..06] on Cross-Section View */}
                    {activeTab === 'cross_section' && (
                        <>
                            {spec.dimensions.map((dim) => (
                                <g key={dim.id}>
                                    <line
                                        x1={dim.x1}
                                        y1={dim.y1}
                                        x2={dim.x2}
                                        y2={dim.y2}
                                        stroke="#94A3B8"
                                        strokeWidth="1.2"
                                        markerStart="url(#cad-arrow-dim)"
                                        markerEnd="url(#cad-arrow-dim)"
                                    />
                                    <rect
                                        x={(dim.x1 + dim.x2) / 2 - 68}
                                        y={(dim.y1 + dim.y2) / 2 - 9}
                                        width="136"
                                        height="16"
                                        fill="#0B0F13"
                                    />
                                    <text
                                        x={(dim.x1 + dim.x2) / 2}
                                        y={(dim.y1 + dim.y2) / 2 + 3}
                                        textAnchor="middle"
                                        fill="#C9D0D8"
                                        fontSize="9.5"
                                        fontWeight="700"
                                    >
                                        {dim.label}
                                    </text>
                                </g>
                            ))}

                            {spec.callouts.map((pin, idx) => {
                                const isSelected = idx === activePinIndex;
                                return (
                                    <g
                                        key={pin.pinNumber}
                                        data-testid={`pdp-cad-pin-${pin.pinNumber}`}
                                        onClick={() => setActivePinIndex(idx)}
                                        onMouseEnter={() => setActivePinIndex(idx)}
                                        className="cursor-pointer"
                                    >
                                        <line
                                            x1={pin.x}
                                            y1={pin.y}
                                            x2={pin.targetX}
                                            y2={pin.targetY}
                                            stroke={isSelected ? '#FF8A3D' : '#94A3B8'}
                                            strokeWidth={isSelected ? '2.2' : '1.4'}
                                            strokeDasharray={isSelected ? undefined : '3 2'}
                                        />
                                        <circle
                                            cx={pin.targetX}
                                            cy={pin.targetY}
                                            r={isSelected ? 5 : 3.5}
                                            fill={isSelected ? '#FF8A3D' : '#38BDF8'}
                                        />
                                        <rect
                                            x={pin.x - 16}
                                            y={pin.y - 12}
                                            width="32"
                                            height="22"
                                            rx="2"
                                            fill={isSelected ? '#C2410C' : '#1B232C'}
                                            stroke={isSelected ? '#FFFFFF' : '#FF8A3D'}
                                            strokeWidth={isSelected ? '2' : '1.4'}
                                        />
                                        <text
                                            x={pin.x}
                                            y={pin.y + 3}
                                            textAnchor="middle"
                                            fill="#FFFFFF"
                                            fontSize="10.5"
                                            fontWeight="800"
                                        >
                                            {pin.pinNumber}
                                        </text>
                                    </g>
                                );
                            })}
                        </>
                    )}
                </svg>
            </div>

            {/* Interactive Part Selector Strip [01..06] + Selected Sub-Assembly Detail */}
            <div className="space-y-2.5">
                <span className="text-xs font-bold text-[#C9D0D8] block">
                    {chrome.pinSelectPrompt}
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                    {spec.callouts.map((pin, idx) => {
                        const isSelected = idx === activePinIndex;
                        return (
                            <button
                                key={pin.pinNumber}
                                type="button"
                                data-testid={`pdp-cad-selector-${pin.pinNumber}`}
                                onClick={() => setActivePinIndex(idx)}
                                className={`min-h-[44px] px-2.5 py-2 text-left transition-colors cursor-pointer border ${
                                    isSelected
                                        ? 'bg-[#1B232C] border-[#FF8A3D] text-white'
                                        : 'bg-[#0B0F13] border-[#2C3742] text-[#C9D0D8] hover:border-[#64748B]'
                                }`}
                            >
                                <span className="font-mono text-xs font-extrabold text-[#FF8A3D] block">
                                    [{pin.pinNumber}]
                                </span>
                                <span className="text-xs font-semibold line-clamp-1">
                                    {pin.title}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* Active Sub-Assembly Inspector Panel */}
                <div
                    data-testid="pdp-cad-active-pin-detail"
                    className="border border-[#2C3742] bg-[#1B232C] p-3.5 space-y-1.5 text-xs"
                >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <strong className="text-sm font-extrabold text-white">
                            [{activeCallout.pinNumber}] {activeCallout.title}
                        </strong>
                        <span className="font-mono text-xs font-bold text-[#4ADE80]">
                            {chrome.spareStatusLabel} {activeCallout.sparePartStatus}
                        </span>
                    </div>
                    <p className="text-[#C9D0D8]">
                        <strong className="text-white">{chrome.materialLabel}</strong>{' '}
                        {activeCallout.materialOrSpec}
                    </p>
                    <p className="text-[#FF8A3D] font-medium">
                        {activeCallout.engineeringNote}
                    </p>
                </div>
            </div>

            {/* Hydraulic / Mounting Rule & Kaunas Spare-Part Guarantee */}
            <div className="border-t border-[#2C3742] pt-2.5 space-y-1 text-xs text-[#C9D0D8]">
                <p className="font-medium text-[#F5F3EE]">{spec.hydraulicRuleBanner}</p>
                <p className="text-[#A3ADB8]">{spec.sparePartsFooterNote}</p>
            </div>
        </div>
    );
}
