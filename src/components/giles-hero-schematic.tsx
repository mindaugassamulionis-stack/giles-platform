'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useVatDisplayStore } from '../store/vat-display';
import { assetUrl } from '../lib/api';
import type { AppLocale } from '../i18n/routing';
import { formatEurAmount } from '../lib/format';

export type HeroPartId =
    | 'burner'
    | 'boiler'
    | 'bunker'
    | 'trv'
    | 'ctrl'
    | 'p1'
    | 'mix'
    | 'vessel'
    | 'ufh'
    | 'safety';

interface HeroPartLocaleCopy {
    shortLabel: string;
    title: string;
    specPill: string;
    description: string;
}

interface HeroPartDefinition {
    id: HeroPartId;
    num: string;
    primary: boolean;
    sku: string;
    priceNetEur: number;
    priceGrossEur: number;
    stockKaunas: number;
    href: string;
    imageUrl: string;
    copy: Record<AppLocale, HeroPartLocaleCopy>;
}

export const HERO_SCHEMATIC_PARTS: HeroPartDefinition[] = [
    {
        id: 'burner',
        num: '01',
        primary: true,
        sku: 'MPB-NANI-35',
        priceNetEur: 1942.15,
        priceGrossEur: 2350.0,
        stockKaunas: 6,
        href: '/products?q=MPB',
        imageUrl: '/images/products/giles-studio-01-mpb-nani-35-50.webp',
        copy: {
            lt: { shortLabel: 'Degiklis', title: 'Granulių degiklis Megatherm MPB NANI 35', specPill: '8–35 kW · CNC flanšas', description: 'Montuojamas vietoje kuro pakrovimo durelių su automatiniu sraigtiniu tiektuvu ir savaime išsivalančiomis ardelėmis (8–35 kW).' },
            en: { shortLabel: 'Burner', title: 'Megatherm MPB NANI 35 Pellet Burner', specPill: '8–35 kW · CNC flange', description: 'Mounts directly into the boiler loading door with an automatic screw feeder and self-cleaning grate bars (8–35 kW).' },
            pl: { shortLabel: 'Palnik', title: 'Palnik peletowy Megatherm MPB NANI 35', specPill: '8–35 kW · Flansza CNC', description: 'Montowany w miejsce drzwiczek załadunkowych z automatycznym podajnikiem ślimakowym i samoczyszczącym rusztem (8–35 kW).' },
            ru: { shortLabel: 'Горелка', title: 'Пеллетная горелка Megatherm MPB NANI 35', specPill: '8–35 кВт · ЧПУ фланец', description: 'Монтируется взамен загрузочной дверцы котла с автоматическим шнековым податчиком и самоочищающимися колосниками (8–35 кВт).' },
        },
    },
    {
        id: 'boiler',
        num: '02',
        primary: true,
        sku: 'KAT-25KW-GI',
        priceNetEur: 1446.28,
        priceGrossEur: 1750.0,
        stockKaunas: 4,
        href: '/products?category=%C5%A0ildymo%20katilai%20ir%20krosnel%C4%97s',
        imageUrl: '/images/products/giles-studio-25-katri-25kw-pellet-boiler.webp',
        copy: {
            lt: { shortLabel: 'Katilas', title: 'Gilės katilas KaTRI 25 kW', specPill: '25 kW · P265GH 6 mm', description: 'Plieninis katilas iš 6 mm P265GH katilinio plieno su vandens marškiniais ir degimo kamera granulių degikliui. Dūmtraukis Ø160 mm.' },
            en: { shortLabel: 'Boiler', title: 'Gilės KaTRI 25 kW Steel Boiler', specPill: '25 kW · P265GH 6 mm', description: 'Boiler made of 6 mm P265GH pressure steel with water jacket and combustion chamber for pellet burner. Flue outlet Ø160 mm.' },
            pl: { shortLabel: 'Kocioł', title: 'Kocioł stalowy Gilės KaTRI 25 kW', specPill: '25 kW · P265GH 6 mm', description: 'Kocioł ze stali kotłowej P265GH 6 mm z płaszczem wodnym i komorą spalania pod palnik peletowy. Czopuch Ø160 mm.' },
            ru: { shortLabel: 'Котел', title: 'Стальной котел Gilės KaTRI 25 кВт', specPill: '25 кВт · P265GH 6 мм', description: 'Котел из котловой стали P265GH 6 мм с водяной рубашкой и камерой сгорания для пеллетной горелки. Дымоход Ø160 мм.' },
        },
    },
    {
        id: 'bunker',
        num: '03',
        primary: true,
        sku: 'ZV 100',
        priceNetEur: 238.84,
        priceGrossEur: 289.0,
        stockKaunas: 9,
        href: '/products?q=ZV+100',
        imageUrl: '/images/products/giles-studio-27-centrometal-cas-1001-buffer.webp',
        copy: {
            lt: { shortLabel: 'Bunkeris', title: 'Granulių bunkeris 300 L su sraigtu L = 2,0 m', specPill: '300 L · 5–7 d. autonomija', description: 'Cinkuotas 300 L granulių bunkeris su 2,0 m sraigtiniu tiektuvu. Sraigtą suka atskiras variklis, valdomas ecoMAX.' },
            en: { shortLabel: 'Hopper', title: '300 L Pellet Hopper with 2.0 m Auger', specPill: '300 L · 5–7 d. autonomy', description: 'Galvanized 300 L pellet storage hopper with 2.0 m screw auger driven by a dedicated motor controlled by ecoMAX.' },
            pl: { shortLabel: 'Zasobnik', title: 'Zasobnik peletu 300 L z podajnikiem 2,0 m', specPill: '300 L · 5–7 dni pracy', description: 'Ocynkowany zasobnik 300 L z podajnikiem ślimakowym 2,0 m napędzanym silnikiem sterowanym przez ecoMAX.' },
            ru: { shortLabel: 'Бункер', title: 'Пеллетный бункер 300 Л со шнеком 2,0 м', specPill: '300 Л · 5–7 дн. автономии', description: 'Оцинкованный бункер 300 Л со шнековым транспортером 2,0 м и приводом под управлением контроллера ecoMAX.' },
        },
    },
    {
        id: 'trv',
        num: '04',
        primary: true,
        sku: '013G2990',
        priceNetEur: 20.58,
        priceGrossEur: 24.9,
        stockKaunas: 42,
        href: '/products?q=013G2990',
        imageUrl: '/images/products/013g2990.webp',
        copy: {
            lt: { shortLabel: 'Radiatoriai', title: 'Termostatinė galvutė Danfoss RA 2990 / IMI Heimeier', specPill: 'RA Click · DN15–DN25', description: 'Palaiko tikslią nustatytą kambario temperatūrą kiekviename radiatoriuje atskirai ir subalansuoja srautą.' },
            en: { shortLabel: 'Radiators', title: 'Danfoss RA 2990 / IMI Heimeier Thermostatic Head', specPill: 'RA Click · DN15–DN25', description: 'Maintains exact individual room temperatures across radiators with automatic hydronic flow balancing.' },
            pl: { shortLabel: 'Grzejniki', title: 'Głowica termostatyczna Danfoss RA 2990 / IMI Heimeier', specPill: 'RA Click · DN15–DN25', description: 'Utrzymuje zadaną temperaturę w każdym pomieszczeniu osobno i równoważy przepływ przez grzejniki.' },
            ru: { shortLabel: 'Радиаторы', title: 'Термоголовка Danfoss RA 2990 / IMI Heimeier', specPill: 'RA Click · DN15–DN25', description: 'Поддерживает заданную температуру в каждой комнате отдельно и балансирует расход через радиаторы.' },
        },
    },
    {
        id: 'ctrl',
        num: '05',
        primary: true,
        sku: 'ECOMAX-920I',
        priceNetEur: 318.18,
        priceGrossEur: 385.0,
        stockKaunas: 8,
        href: '/products?category=Automatika',
        imageUrl: '/images/products/giles-studio-30-ecomax-920i-automation.webp',
        copy: {
            lt: { shortLabel: 'ecoMAX', title: 'Valdiklis ecoMAX 920i su interneto moduliu', specPill: 'Wi-Fi · Fuzzy Logic', description: 'Valdo degiklį, sraigtą ir siurblius, moduliuoja galią pagal padavimo temperatūrą, valdomas telefonu.' },
            en: { shortLabel: 'ecoMAX', title: 'ecoMAX 920i Controller with Internet Module', specPill: 'Wi-Fi · Fuzzy Logic', description: 'Controls the burner, screw feeder, and pumps, modulating output by supply temperature with smartphone access.' },
            pl: { shortLabel: 'ecoMAX', title: 'Sterownik ecoMAX 920i z modułem internetowym', specPill: 'Wi-Fi · Fuzzy Logic', description: 'Steruje palnikiem, podajnikiem i pompami, moduluje moc według temperatury zasilania z aplikacją mobilną.' },
            ru: { shortLabel: 'ecoMAX', title: 'Контроллер ecoMAX 920i с интернет-модулем', specPill: 'Wi-Fi · Fuzzy Logic', description: 'Управляет горелкой, шнеком и насосами, модулирует мощность по температуре подачи с доступом со смартфона.' },
        },
    },
    {
        id: 'p1',
        num: '06',
        primary: false,
        sku: '2217972',
        priceNetEur: 177.59,
        priceGrossEur: 214.88,
        stockKaunas: 7,
        href: '/products?q=Wilo',
        imageUrl: '/images/products/giles-studio-06-megatherm-burner-kit.webp',
        copy: {
            lt: { shortLabel: 'Siurblys P1', title: 'Cirkuliacinis siurblys Wilo Para 25/6 (P1)', specPill: 'DN25 · Δp-v / Δp-c', description: 'Katilo ir radiatorių kontūro elektroninis cirkuliacinis siurblys P1, parenkamas pagal hidraulinį darbo tašką.' },
            en: { shortLabel: 'Pump P1', title: 'Wilo Para 25/6 Circulation Pump (P1)', specPill: 'DN25 · Δp-v / Δp-c', description: 'Primary boiler and radiator circuit electronic circulation pump P1 sized to the hydraulic duty point.' },
            pl: { shortLabel: 'Pompa P1', title: 'Pompa obiegowa Wilo Para 25/6 (P1)', specPill: 'DN25 · Δp-v / Δp-c', description: 'Elektroniczna pompa obiegowa P1 obiegu kotłowego i grzejnikowego dobierana według punktu pracy.' },
            ru: { shortLabel: 'Насос P1', title: 'Циркуляционный насос Wilo Para 25/6 (P1)', specPill: 'DN25 · Δp-v / Δp-c', description: 'Электронный циркуляционный насос P1 котлового и радиаторного контура по рабочей точке.' },
        },
    },
    {
        id: 'mix',
        num: '07',
        primary: false,
        sku: '1776603',
        priceNetEur: 89.26,
        priceGrossEur: 108.0,
        stockKaunas: 14,
        href: '/products?q=Teplomix',
        imageUrl: '/images/products/013g2990.webp',
        copy: {
            lt: { shortLabel: 'Teplomix 61 °C', title: 'HERZ Teplomix DN25 61 °C antikondensacinis vožtuvas', specPill: 'DN25 · ≥ 61 °C grįžtamas', description: 'Termostatinis trieigis vožtuvas: į katilą grįžta ne šaltesnis nei 61 °C vanduo, todėl nesikaupia kondensatas ir derva.' },
            en: { shortLabel: 'Teplomix 61 °C', title: 'HERZ Teplomix DN25 61 °C Anticondensation Valve', specPill: 'DN25 · ≥ 61 °C return', description: 'Thermostatic 3-way bypass valve ensuring boiler return water stays ≥ 61 °C to prevent condensation and tar.' },
            pl: { shortLabel: 'Teplomix 61 °C', title: 'Zawór antykondensacyjny HERZ Teplomix DN25 61 °C', specPill: 'DN25 · powrót ≥ 61 °C', description: 'Termostatyczny zawór trójdrogowy utrzymujący temperaturę powrotu do kotła ≥ 61 °C bez kondensacji i smoły.' },
            ru: { shortLabel: 'Teplomix 61 °C', title: 'Антиконденсационный клапан HERZ Teplomix DN25 61 °C', specPill: 'DN25 · обратка ≥ 61 °C', description: 'Термостатический трехходовой клапан поддерживает обратку в котел не ниже 61 °C, защищая от конденсата и дегтя.' },
        },
    },
    {
        id: 'vessel',
        num: '08',
        primary: false,
        sku: '7101003',
        priceNetEur: 78.51,
        priceGrossEur: 95.0,
        stockKaunas: 18,
        href: '/products?q=Statico',
        imageUrl: '/images/products/giles-studio-27-centrometal-cas-1001-buffer.webp',
        copy: {
            lt: { shortLabel: 'Statico indas', title: 'Plėtimosi indas IMI Pneumatex Statico SD 35', specPill: '35 L · EN 12828', description: 'Kompensuoja šildymo sistemos vandens tūrio plėtimąsi ir palaiko stabilų statinį slėgį pagal EN 12828.' },
            en: { shortLabel: 'Statico vessel', title: 'IMI Pneumatex Statico SD 35 Expansion Vessel', specPill: '35 L · EN 12828', description: 'Compensates thermal water expansion and maintains stable system pressure in compliance with EN 12828.' },
            pl: { shortLabel: 'Naczynie Statico', title: 'Naczynie wzbiorcze IMI Pneumatex Statico SD 35', specPill: '35 L · EN 12828', description: 'Kompensuje rozszerzalność cieplną wody w instalacji i stabilizuje ciśnienie zgodnie z normą EN 12828.' },
            ru: { shortLabel: 'Бак Statico', title: 'Расширительный бак IMI Pneumatex Statico SD 35', specPill: '35 Л · EN 12828', description: 'Компенсирует тепловое расширение воды в системе отопления и держит давление по стандарту EN 12828.' },
        },
    },
    {
        id: 'ufh',
        num: '09',
        primary: false,
        sku: '9330-08.800',
        priceNetEur: 285.12,
        priceGrossEur: 345.0,
        stockKaunas: 9,
        href: '/products?q=Dynacon',
        imageUrl: '/images/products/013g2990.webp',
        copy: {
            lt: { shortLabel: 'Grindinis', title: 'Kolektorius IMI Dynacon Eclipse 8 kontūrų su maišymo mazgu', specPill: '8 kont. · P2 · 40 °C', description: 'Grindinio šildymo kolektorius su AFC srauto ribotuvais, trieigiu pamaišymo vožtuvu ir siurbliu P2 (35–45 °C).' },
            en: { shortLabel: 'Underfloor', title: 'IMI Dynacon Eclipse 8-Loop Manifold with Mixing Group', specPill: '8 loops · P2 · 40 °C', description: 'Underfloor heating manifold with automatic AFC flow limiters, 3-way mixing valve, and pump P2 (35–45 °C).' },
            pl: { shortLabel: 'Podłogówka', title: 'Rozdzielacz IMI Dynacon Eclipse 8-obwodowy z grupą mieszającą', specPill: '8 obw. · P2 · 40 °C', description: 'Rozdzielacz ogrzewania podłogowego z regulacją przepływu AFC, zaworem mieszającym i pompą P2 (35–45 °C).' },
            ru: { shortLabel: 'Теплый пол', title: 'Коллектор IMI Dynacon Eclipse на 8 контуров со смесителем', specPill: '8 конт. · P2 · 40 °C', description: 'Коллектор теплого пола с автоматическими ограничителями расхода AFC, трехходовым клапаном и насосом P2 (35–45 °C).' },
        },
    },
    {
        id: 'safety',
        num: '10',
        primary: false,
        sku: '5363019',
        priceNetEur: 34.71,
        priceGrossEur: 42.0,
        stockKaunas: 15,
        href: '/products?q=5363019',
        imageUrl: '/images/products/013g2990.webp',
        copy: {
            lt: { shortLabel: '3 bar vožtuvas', title: 'Apsauginis vožtuvas 3 bar (katilo apsaugos grupė)', specPill: '3,0 bar · DN15', description: 'Montuojamas tiesiai katilo padavime be jokios uždaromosios armatūros tarp katilo ir apsauginio vožtuvo.' },
            en: { shortLabel: '3 bar relief valve', title: '3 bar Safety Relief Valve (Boiler Safety Group)', specPill: '3.0 bar · DN15', description: 'Mounted directly on the boiler supply header with no shut-off valves between the boiler and safety valve.' },
            pl: { shortLabel: 'Zawór 3 bar', title: 'Zawór bezpieczeństwa 3 bar (grupa bezpieczeństwa)', specPill: '3,0 bar · DN15', description: 'Montowany bezpośrednio na zasilaniu kotła bez armatury odcinającej pomiędzy kotłem a zaworem.' },
            ru: { shortLabel: 'Клапан 3 бар', title: 'Предохранительный клапан 3 бар (группа безопасности)', specPill: '3,0 бар · DN15', description: 'Устанавливается на подаче котла без запорной арматуры между котлом и предохранительным клапаном.' },
        },
    },
];

interface StoryStepDef {
    num: string;
    parts: HeroPartId[];
    flows: string[];
    title: Record<AppLocale, string>;
    caption: Record<AppLocale, string>;
}

const STORY_STEPS: StoryStepDef[] = [
    {
        num: '01',
        parts: ['bunker', 'burner'],
        flows: ['fuel'],
        title: { lt: 'Kuras', en: 'Fuel feed', pl: 'Paliwo', ru: 'Подача топлива' },
        caption: {
            lt: 'Sraigtas tiekia 6–8 mm granules iš 300 L bunkerio į degiklį. Pilno bunkerio užtenka 5–7 dienoms.',
            en: 'The 2.0 m screw auger feeds 6–8 mm pellets from the 300 L hopper into the burner for 5–7 days of autonomous run.',
            pl: 'Podajnik ślimakowy 2,0 m podaje pelet 6–8 mm z zasobnika 300 L do palnika (5–7 dni pracy bez dosypywania).',
            ru: 'Шнековый податчик 2,0 м подает пеллеты 6–8 мм из бункера 300 Л в горелку (5–7 дней автономной работы).',
        },
    },
    {
        num: '02',
        parts: ['burner', 'boiler', 'ctrl'],
        flows: ['sig', 'fuel'],
        title: { lt: 'Degimas', en: 'Combustion', pl: 'Spalanie', ru: 'Горение' },
        caption: {
            lt: 'ecoMAX uždega degiklį ir moduliuoja jo galią nuo 8 iki 35 kW, kad padavimas laikytųsi nustatytos temperatūros.',
            en: 'ecoMAX ignites the burner and modulates output from 8 to 35 kW to hold the target supply water temperature.',
            pl: 'Sterownik ecoMAX rozpala palnik i moduluje moc od 8 do 35 kW, utrzymując zadaną temperaturę zasilania.',
            ru: 'Контроллер ecoMAX разжигает горелку и модулирует мощность от 8 до 35 кВт для поддержания температуры подачи.',
        },
    },
    {
        num: '03',
        parts: ['mix', 'safety', 'vessel'],
        flows: ['byp', 'ret-b', 'sup-main', 'prot'],
        title: { lt: 'Apsauga 61 °C', en: '61 °C Protection', pl: 'Ochrona 61 °C', ru: 'Защита 61 °C' },
        caption: {
            lt: 'Teplomix maišo karštą padavimą į grįžtamą vandenį: į katilą grįžta ≥ 61 °C vanduo ir nesikaupia kondensatas. 3 bar vožtuvas ir Statico saugo nuo viršslėgio.',
            en: 'Teplomix blends hot supply into return water so boiler return stays ≥ 61 °C without condensation. The 3 bar valve and Statico vessel protect against overpressure.',
            pl: 'Zawór Teplomix podmieszuje gorące zasilanie do powrotu (≥ 61 °C), chroniąc kocioł przed kondensacją, a zawór 3 bar i naczynie Statico stabilizują ciśnienie.',
            ru: 'Клапан Teplomix подмешивает горячую подачу в обратку (≥ 61 °C) без конденсата, а клапан 3 бар и бак Statico защищают от избыточного давления.',
        },
    },
    {
        num: '04',
        parts: ['p1', 'trv', 'ufh'],
        flows: ['sup-main', 'rad', 'ufh', 'ret-rad', 'ret-ufh', 'ret-b'],
        title: { lt: 'Šiluma namams', en: 'Heat distribution', pl: 'Ciepło dla domu', ru: 'Тепло в дом' },
        caption: {
            lt: 'Siurblys P1 tiekia 80 °C vandenį radiatoriams. Maišymo mazgas su siurbliu P2 paruošia 40 °C grindiniam šildymui. Atvėsęs 60 °C vanduo grįžta į katilą.',
            en: 'Pump P1 delivers 80 °C water to radiators while mixing group P2 prepares 40 °C for underfloor heating. Cooled 60 °C water returns to the boiler.',
            pl: 'Pompa P1 tłoczy wodę 80 °C na grzejniki, a grupa mieszająca z pompą P2 przygotowuje 40 °C na podłogówkę. Schłodzona woda 60 °C wraca do kotła.',
            ru: 'Насос P1 подает воду 80 °C в радиаторы, а смесительный узел с насосом P2 готовит 40 °C для теплого пола. Остывшая вода 60 °C возвращается в котел.',
        },
    },
];

const UI_LABELS: Record<
    AppLocale,
    {
        headerTitle: string;
        modePartsBtn: string;
        modeStoryBtn: string;
        flowBtn: string;
        svgAria: string;
        augerSvg: string;
        radiatorsSvg: string;
        ufhSvg: string;
        legendT1: string;
        legendT2: string;
        legendFuel: string;
        legendCtrl: string;
        alsoInNode: string;
        stockPrefix: string;
        stockUnit: string;
        vatGross: string;
        vatNet: string;
        viewProductCta: string;
        configureKitCta: string;
        prevStep: string;
        nextStep: string;
        pauseStory: string;
        playStory: string;
    }
> = {
    lt: {
        headerTitle: 'Mazgo schema · Granulinė katilinė 25 kW · Rev 4.2',
        modePartsBtn: 'Elementai (10)',
        modeStoryBtn: 'Kaip veikia (4 žingsniai)',
        flowBtn: '● Srautas',
        svgAria: 'Granulinės katilinės 25 kW mazgo schema su 10 interaktyvių elementų ir srautų animacija',
        augerSvg: 'Sraigtas L = 2,0 m',
        radiatorsSvg: 'Radiatoriai',
        ufhSvg: 'Grindinis · Dynacon',
        legendT1: 'Padavimas T1 80 °C',
        legendT2: 'Grįžtamas T2 60 °C',
        legendFuel: 'Kuras',
        legendCtrl: 'Valdymas',
        alsoInNode: 'Mazge taip pat:',
        stockPrefix: 'Kaune:',
        stockUnit: 'vnt.',
        vatGross: 'su PVM',
        vatNet: 'be PVM',
        viewProductCta: 'Žiūrėti prekę',
        configureKitCta: 'Parinkti komplektą',
        prevStep: 'Ankstesnis žingsnis',
        nextStep: 'Kitas žingsnis',
        pauseStory: 'Pristabdyti',
        playStory: 'Paleisti',
    },
    en: {
        headerTitle: 'Assembly Schematic · 25 kW Pellet Boiler Plant · Rev 4.2',
        modePartsBtn: 'Components (10)',
        modeStoryBtn: 'How it works (4 steps)',
        flowBtn: '● Flow',
        svgAria: '25 kW pellet boiler room CAD schematic with 10 interactive components and animated flows',
        augerSvg: 'Auger L = 2.0 m',
        radiatorsSvg: 'Radiators',
        ufhSvg: 'Underfloor · Dynacon',
        legendT1: 'Supply T1 80 °C',
        legendT2: 'Return T2 60 °C',
        legendFuel: 'Pellet feed',
        legendCtrl: 'Control',
        alsoInNode: 'Also in assembly:',
        stockPrefix: 'Kaunas stock:',
        stockUnit: 'pcs',
        vatGross: 'incl. VAT',
        vatNet: 'excl. VAT',
        viewProductCta: 'View product',
        configureKitCta: 'Configure kit',
        prevStep: 'Previous step',
        nextStep: 'Next step',
        pauseStory: 'Pause',
        playStory: 'Play',
    },
    pl: {
        headerTitle: 'Schemat węzła · Kotłownia peletowa 25 kW · Rev 4.2',
        modePartsBtn: 'Elementy (10)',
        modeStoryBtn: 'Jak działa (4 kroki)',
        flowBtn: '● Przepływ',
        svgAria: 'Schemat CAD kotłowni peletowej 25 kW z 10 interaktywnymi elementami i animacją przepływu',
        augerSvg: 'Podajnik L = 2,0 m',
        radiatorsSvg: 'Grzejniki',
        ufhSvg: 'Podłogówka · Dynacon',
        legendT1: 'Zasilanie T1 80 °C',
        legendT2: 'Powrót T2 60 °C',
        legendFuel: 'Paliwo',
        legendCtrl: 'Sterowanie',
        alsoInNode: 'W węźle również:',
        stockPrefix: 'Kowno:',
        stockUnit: 'szt.',
        vatGross: 'z VAT',
        vatNet: 'netto',
        viewProductCta: 'Zobacz produkt',
        configureKitCta: 'Dobierz zestaw',
        prevStep: 'Poprzedni krok',
        nextStep: 'Następny krok',
        pauseStory: 'Wstrzymaj',
        playStory: 'Odtwórz',
    },
    ru: {
        headerTitle: 'Схема узла · Пеллетная котельная 25 кВт · Rev 4.2',
        modePartsBtn: 'Элементы (10)',
        modeStoryBtn: 'Как работает (4 шага)',
        flowBtn: '● Поток',
        svgAria: 'CAD-схема пеллетной котельной 25 кВт с 10 интерактивными узлами и анимацией потоков',
        augerSvg: 'Шнек L = 2,0 м',
        radiatorsSvg: 'Радиаторы',
        ufhSvg: 'Теплый пол · Dynacon',
        legendT1: 'Подача T1 80 °C',
        legendT2: 'Обратка T2 60 °C',
        legendFuel: 'Топливо',
        legendCtrl: 'Управление',
        alsoInNode: 'Также в узле:',
        stockPrefix: 'В Каунасе:',
        stockUnit: 'шт.',
        vatGross: 'с НДС',
        vatNet: 'без НДС',
        viewProductCta: 'Смотреть товар',
        configureKitCta: 'Подобрать комплект',
        prevStep: 'Предыдущий шаг',
        nextStep: 'Следующий шаг',
        pauseStory: 'Пауза',
        playStory: 'Пуск',
    },
};

export function GilesHeroAnimatedSchematic({ locale }: { locale: AppLocale }) {
    const ui = UI_LABELS[locale];
    const showNet = useVatDisplayStore((s) => s.showNet);
    const [mode, setMode] = useState<'parts' | 'story'>('parts');
    const [selectedPartId, setSelectedPartId] = useState<HeroPartId>('burner');
    const [flowActive, setFlowActive] = useState(true);
    const [storyStep, setStoryStep] = useState(0);
    const [storyPlaying, setStoryPlaying] = useState(true);

    useEffect(() => {
        if (mode !== 'story' || !storyPlaying) return;
        const timer = setInterval(() => {
            setStoryStep((prev) => (prev + 1) % STORY_STEPS.length);
        }, 6000);
        return () => clearInterval(timer);
    }, [mode, storyPlaying]);

    const currentPart = HERO_SCHEMATIC_PARTS.find((p) => p.id === selectedPartId) || HERO_SCHEMATIC_PARTS[0]!;
    const partCopy = currentPart.copy[locale];
    const activeStory = STORY_STEPS[storyStep] || STORY_STEPS[0]!;

    const isPartHighlighted = (id: HeroPartId) =>
        mode === 'story' ? activeStory.parts.includes(id) : selectedPartId === id;
    const isFlowLit = (fKey: string) => (mode === 'story' ? activeStory.flows.includes(fKey) : true);
    const partClass = (id: HeroPartId, extra = '') =>
        `part ${extra} ${isPartHighlighted(id) ? 'on part-active lit' : ''}`.trim();
    const balClass = (id: HeroPartId) =>
        `bal ${isPartHighlighted(id) ? 'on part-active lit' : ''}`.trim();
    const pipeClass = (cls: string, fKey: string) =>
        `pipe ${cls} ${isFlowLit(fKey) ? 'lit' : ''}`.trim();
    const flowClass = (cls: string, fKey: string) =>
        `flow ${cls} ${isFlowLit(fKey) ? 'lit' : ''}`.trim();

    const handleSelectPart = (id: HeroPartId) => {
        if (mode === 'story') setMode('parts');
        setSelectedPartId(id);
    };

    const formattedPrice = `${formatEurAmount(showNet ? currentPart.priceNetEur : currentPart.priceGrossEur)} € ${showNet ? ui.vatNet : ui.vatGross}`;

    const primaryParts = HERO_SCHEMATIC_PARTS.filter((p) => p.primary);
    const secondaryParts = HERO_SCHEMATIC_PARTS.filter((p) => !p.primary);

    return (
        <div
            data-testid="hero-boiler-schematic"
            className="rounded-xl border border-[#232D38] bg-[#0C1117] text-[#ECEFF2] overflow-hidden"
        >
            <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5 border-b border-[#1C2530] text-xs">
                <span className="text-[#F26B21] font-semibold">{ui.headerTitle}</span>
                <div className="flex flex-wrap items-center gap-2">
                    <div
                        data-testid="hero-schematic-mode"
                        role="group"
                        aria-label={ui.headerTitle}
                        className="inline-flex rounded-xs border border-[#2A3440] overflow-hidden"
                    >
                        <button
                            type="button"
                            data-mode="parts"
                            aria-pressed={mode === 'parts'}
                            onClick={() => setMode('parts')}
                            className={`px-2.5 py-1 text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                                mode === 'parts'
                                    ? 'bg-[#F26B21] text-[#0C1117]'
                                    : 'bg-transparent text-[#A6AFB9] hover:text-white'
                            }`}
                        >
                            {ui.modePartsBtn}
                        </button>
                        <button
                            type="button"
                            data-mode="story"
                            aria-pressed={mode === 'story'}
                            onClick={() => {
                                setMode('story');
                                setStoryStep(0);
                                setStoryPlaying(true);
                            }}
                            className={`px-2.5 py-1 text-xs font-semibold whitespace-nowrap border-l border-[#2A3440] cursor-pointer transition-colors ${
                                mode === 'story'
                                    ? 'bg-[#F26B21] text-[#0C1117]'
                                    : 'bg-transparent text-[#A6AFB9] hover:text-white'
                            }`}
                        >
                            {ui.modeStoryBtn}
                        </button>
                    </div>
                    <button
                        type="button"
                        data-testid="hero-flow-toggle"
                        aria-pressed={flowActive}
                        onClick={() => setFlowActive((v) => !v)}
                        className={`px-2.5 py-1 rounded-xs border text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                            flowActive
                                ? 'border-[#F26B21] text-[#F26B21]'
                                : 'border-[#2A3440] text-[#A6AFB9]'
                        }`}
                    >
                        {ui.flowBtn}
                    </button>
                </div>
            </div>

            <div className="relative w-full bg-[#0C1117] px-2 pt-2">
                <svg
                    id="hero-svg"
                    viewBox="0 0 800 430"
                    role="img"
                    aria-label={ui.svgAria}
                    className={`w-full h-auto block ${mode === 'story' ? 'story story-on' : ''} ${
                        !flowActive ? 'paused noflow' : ''
                    }`}
                >
                    <defs>
                        <pattern id="g20" width="20" height="20" patternUnits="userSpaceOnUse">
                            <path d="M20 0H0V20" fill="none" stroke="#131B24" strokeWidth="1" />
                        </pattern>
                        <pattern id="g100" width="100" height="100" patternUnits="userSpaceOnUse">
                            <rect width="100" height="100" fill="#0C1117" />
                            <rect width="100" height="100" fill="url(#g20)" />
                            <path d="M100 0H0V100" fill="none" stroke="#18222D" strokeWidth="1" />
                        </pattern>
                        <pattern id="pel" width="8" height="8" patternUnits="userSpaceOnUse">
                            <rect width="8" height="8" fill="#2E2410" />
                            <circle cx="2" cy="2" r="1.3" fill="#E8B04B" opacity="0.55" />
                            <circle cx="6" cy="6" r="1.3" fill="#E8B04B" opacity="0.38" />
                        </pattern>
                        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                            <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#F26B21" floodOpacity="0.55" />
                        </filter>
                        <marker id="arr" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                            <path d="M0 0L8 4L0 8z" fill="#7A8796" />
                        </marker>
                        <linearGradient id="h-ufh" x1="0" y1="229" x2="0" y2="297" gradientUnits="userSpaceOnUse">
                            <stop offset="0" stopColor="#F26B21" />
                            <stop offset="1" stopColor="#3FA9F5" />
                        </linearGradient>
                        <clipPath id="h-bclip">
                            <path d="M50 110H150V230L112 290H88L50 230Z" />
                        </clipPath>
                    </defs>

                    <rect width="800" height="430" fill="url(#g100)" />

                    <g className="lbl-x">
                        <path className="dimline" d="M50 392V408M452 392V408" />
                        <path className="dimline" d="M50 400H452" markerStart="url(#arr)" markerEnd="url(#arr)" />
                        <rect x="200" y="392" width="102" height="16" fill="#0C1117" />
                        <text className="dimtx" x="251" y="404" textAnchor="middle">1 450 mm × 680 mm × 1 280 mm</text>
                        <path className="dimline" d="M22 110H38M22 340H38" />
                        <path className="dimline" d="M30 110V340" markerStart="url(#arr)" markerEnd="url(#arr)" />
                        <rect x="22" y="194" width="16" height="62" fill="#0C1117" />
                        <text className="dimtx" transform="translate(34 225) rotate(-90)" textAnchor="middle">1 280 mm</text>
                    </g>

                    <g className={partClass('boiler')} data-part="boiler" onClick={() => handleSelectPart('boiler')}>
                        <rect className="d-o2" x="420" y="30" width="20" height="70" />
                        <path className="fluegas" d="M424 24c3-4-3-8 0-12M430 24c3-4-3-8 0-12M436 24c3-4-3-8 0-12" />
                    </g>
                    <text className="d-t2 lbl-x" x="448" y="58">Ø160</text>

                    <g className={partClass('bunker')} data-part="bunker" onClick={() => handleSelectPart('bunker')}>
                        <g clipPath="url(#h-bclip)">
                            <rect x="40" y="150" width="120" height="150" fill="url(#pel)" />
                        </g>
                        <path className="d-o" style={{ fill: 'none' }} d="M50 110H150V230L112 290H88L50 230Z" />
                        <path className="d-lvl" d="M50 150H150" />
                        <text className="d-tb" x="100" y="135" textAnchor="middle">300 L</text>
                        <path d="M104 292L240 240" stroke="#C9D3DC" strokeWidth="13" fill="none" />
                        <path d="M104 292L240 240" stroke="#111821" strokeWidth="10" fill="none" />
                        <path d="M104 292L240 240" stroke="#6F7D8C" strokeWidth="9" strokeDasharray="1.5 5" fill="none" />
                        <rect className="d-o2" x="86" y="290" width="28" height="16" rx="2" />
                        <text className="d-t3" x="100" y="302" textAnchor="middle">M</text>
                    </g>
                    <text className="d-t2 lbl-x" x="128" y="330">{ui.augerSvg}</text>

                    <g className={partClass('boiler')} data-part="boiler" onClick={() => handleSelectPart('boiler')}>
                        <rect className="d-o" x="322" y="110" width="130" height="230" rx="6" />
                        <rect className="d-jacket" x="334" y="186" width="106" height="142" rx="3" />
                        <rect className="d-chamber" x="346" y="200" width="82" height="96" rx="4" />
                        <path className="flame d-flame" d="M387 286c-15 0-21-11-17-22 3-8 9-11 8-20 8 5 11 13 10 19 3-3 4-7 3-12 8 7 12 16 10 23-2 8-8 12-14 12z" />
                        <path className="flame2 d-flame2" d="M387 284c-6 0-9-5-7-10 1-3 4-5 4-9 4 3 5 7 4 10 2-1 2-3 2-5 3 4 4 7 3 10-1 3-3 4-6 4z" />
                        <text className="d-tb" x="387" y="318" textAnchor="middle">25 kW</text>
                        <rect className="d-o2" x="420" y="100" width="20" height="10" />
                    </g>

                    <g className={partClass('burner')} data-part="burner" onClick={() => handleSelectPart('burner')}>
                        <rect className="d-o2" x="236" y="222" width="64" height="40" rx="4" />
                        <rect className="d-o2" x="300" y="234" width="46" height="16" />
                        <circle className="d-o" cx="258" cy="242" r="10" />
                        <path d="M258 242v-8M258 242l7 4M258 242l-7 4" stroke="#C9D3DC" strokeWidth="1.4" />
                    </g>

                    <g className={partClass('ctrl')} data-part="ctrl" onClick={() => handleSelectPart('ctrl')}>
                        <rect className="d-o" x="352" y="128" width="70" height="44" rx="3" style={{ fill: '#0A0E13' }} />
                        <rect x="358" y="134" width="42" height="18" rx="2" fill="#0F2A3D" />
                        <text x="379" y="147" textAnchor="middle" fill="#8FD3FF" fontSize="11" fontWeight="600">62°C</text>
                        <circle cx="411" cy="139" r="3" fill="none" stroke="#6F7D8C" />
                        <circle cx="411" cy="150" r="3" fill="none" stroke="#6F7D8C" />
                        <path d="M358 162H400" stroke="#2C3640" />
                        <path className="sig" d="M352 164H290V222" />
                    </g>

                    <path className={pipeClass('sup', 'sup-main')} data-f="sup-main" d="M452 130H610" />
                    <path className={pipeClass('sup', 'rad')} data-f="rad" d="M610 130V80H652" />
                    <path className={pipeClass('sup', 'byp')} data-f="byp" d="M520 130V318" />
                    <path className={pipeClass('sup', 'ufh')} data-f="ufh" d="M610 130V214" />
                    <path className={pipeClass('mix', 'ufh')} data-f="ufh" d="M622 226H664" />
                    <path className={pipeClass('ret', 'ret-rad')} data-f="ret-rad" d="M772 112H784V330H532" />
                    <path className={pipeClass('ret', 'ret-b')} data-f="ret-b" d="M508 330H452" />
                    <path className={pipeClass('ret', 'ret-ufh')} data-f="ret-ufh" d="M664 300H610V330" />
                    <path className={pipeClass('ret', 'ret-ufh')} data-f="ret-ufh" d="M610 300V238" />
                    <path className={pipeClass('sup', 'prot')} data-f="prot" d="M468 130V114" />
                    <path className={pipeClass('ret', 'prot')} data-f="prot" d="M480 330V350" />
                    <path className={pipeClass('sup bar', 'ufh')} data-f="ufh" d="M664 226H764" />
                    <path className={pipeClass('ret bar', 'ret-ufh')} data-f="ret-ufh" d="M664 300H764" />

                    <g className={partClass('ufh')} data-part="ufh" onClick={() => handleSelectPart('ufh')}>
                        <rect x="664" y="232" width="100" height="62" fill="#0C1117" opacity="0" />
                        <path className="loop" stroke="url(#h-ufh)" d="M672 229V238H684V248H672V258H684V268H672V278H684V297" />
                        <path className="loop" stroke="url(#h-ufh)" d="M696 229V238H708V248H696V258H708V268H696V278H708V297" />
                        <path className="loop" stroke="url(#h-ufh)" d="M720 229V238H732V248H720V258H732V268H720V278H732V297" />
                        <path className="loop" stroke="url(#h-ufh)" d="M744 229V238H756V248H744V258H756V268H744V278H756V297" />
                    </g>

                    <g className="flows">
                        <path className={flowClass('f', 'fuel')} data-f="fuel" d="M104 292L240 240" />
                        <path className={flowClass('g', 'sig')} data-f="sig" d="M352 164H290V222" />
                        <path className={flowClass('', 'sup-main')} data-f="sup-main" d="M452 130H610" />
                        <path className={flowClass('', 'rad')} data-f="rad" d="M610 130V80H652" />
                        <path className={flowClass('', 'byp')} data-f="byp" d="M520 130V318" />
                        <path className={flowClass('', 'ufh')} data-f="ufh" d="M610 130V214" />
                        <path className={flowClass('', 'ufh')} data-f="ufh" d="M622 226H764" />
                        <path className={flowClass('r c', 'ret-rad')} data-f="ret-rad" d="M772 112H784V330H532" />
                        <path className={flowClass('r c', 'ret-b')} data-f="ret-b" d="M508 330H452" />
                        <path className={flowClass('r c', 'ret-ufh')} data-f="ret-ufh" d="M764 300H610V330" />
                    </g>

                    <circle className="node" cx="520" cy="130" r="3" />
                    <circle className="node" cx="610" cy="130" r="3" />
                    <circle className="node" cx="610" cy="300" r="3" />
                    <circle className="node" cx="610" cy="330" r="3" />

                    <g className={partClass('safety')} data-part="safety" onClick={() => handleSelectPart('safety')}>
                        <rect x="456" y="88" width="24" height="28" fill="#0C1117" opacity="0" />
                        <path className="valve" d="M462 114H474L468 104Z" />
                        <path d="M468 104l-4-3 8-3-8-3 8-3-4-2" fill="none" stroke="#C9D3DC" strokeWidth="1.2" />
                    </g>
                    <text className="d-t2 lbl-x" x="468" y="82" textAnchor="middle">3 bar</text>
                    <circle cx="496" cy="130" r="4.5" fill="#0C1117" stroke="#F26B21" strokeWidth="1.4" />
                    <g className="tag s lbl-x">
                        <rect x="500" y="100" width="58" height="18" rx="3" />
                        <text x="529" y="113" textAnchor="middle">T1 80 °C</text>
                    </g>

                    <g className={partClass('p1')} data-part="p1" onClick={() => handleSelectPart('p1')}>
                        <circle className="pumpc" cx="560" cy="130" r="11" />
                        <path className="pumpt" d="M555 123L568 130L555 137Z" />
                        <text className="d-t2" x="560" y="158" textAnchor="middle">P1</text>
                    </g>

                    <g className={partClass('mix')} data-part="mix" onClick={() => handleSelectPart('mix')}>
                        <path className="valve" d="M508 324L520 330L508 336ZM532 324L520 330L532 336ZM514 318L520 330L526 318Z" />
                        <rect className="valve" x="516" y="338" width="8" height="8" />
                        <text className="d-t2" x="540" y="356">Teplomix 61 °C</text>
                    </g>

                    <g className={partClass('vessel')} data-part="vessel" onClick={() => handleSelectPart('vessel')}>
                        <rect className="d-o2" x="466" y="350" width="28" height="40" rx="14" />
                        <path d="M466 370H494" stroke="#6F7D8C" strokeWidth="1" />
                        <text className="d-t2" x="502" y="382">Statico</text>
                    </g>

                    <g className="tag r lbl-x">
                        <rect x="650" y="338" width="58" height="18" rx="3" />
                        <text x="679" y="351" textAnchor="middle">T2 60 °C</text>
                    </g>

                    <g className={partClass('ufh')} data-part="ufh" onClick={() => handleSelectPart('ufh')}>
                        <path className="valve" d="M604 214L610 226L616 214ZM604 238L610 226L616 238ZM622 220L610 226L622 232Z" />
                        <rect className="valve" x="590" y="222" width="8" height="8" />
                        <path d="M598 226H604" stroke="#C9D3DC" strokeWidth="1.2" />
                        <circle className="pumpc" cx="642" cy="226" r="9" />
                        <path className="pumpt" d="M638 220L648 226L638 232Z" />
                        <text className="d-t2" x="642" y="256" textAnchor="middle">P2</text>
                        <text className="d-t2" x="714" y="320" textAnchor="middle">{ui.ufhSvg}</text>
                    </g>

                    <g className="tag s lbl-x">
                        <rect x="620" y="190" width="42" height="16" rx="3" />
                        <text x="641" y="202" textAnchor="middle">40 °C</text>
                    </g>

                    <g className={partClass('trv')} data-part="trv" onClick={() => handleSelectPart('trv')}>
                        <rect className="d-o2" x="652" y="62" width="120" height="50" rx="3" />
                        <path d="M664 66V108M676 66V108M688 66V108M700 66V108M712 66V108M724 66V108M736 66V108M748 66V108M760 66V108" stroke="#2C3846" strokeWidth="1.2" />
                        <path className="valve" d="M634 74L640 80L634 86ZM646 74L640 80L646 86Z" />
                        <path d="M640 73V76" stroke="#C9D3DC" strokeWidth="1.4" />
                        <circle cx="640" cy="66" r="7" fill="#E8EDF2" stroke="#9AA6B2" strokeWidth="1" />
                        <text className="d-t2" x="712" y="52" textAnchor="middle">{ui.radiatorsSvg}</text>
                    </g>

                    <g className={balClass('burner')} data-part="burner" onClick={() => handleSelectPart('burner')}>
                        <path d="M268 208V222" /><circle cx="268" cy="198" r="10" /><text x="268" y="202" textAnchor="middle">1</text>
                    </g>
                    <g className={balClass('boiler')} data-part="boiler" onClick={() => handleSelectPart('boiler')}>
                        <path d="M387 356V340" /><circle cx="387" cy="366" r="10" /><text x="387" y="370" textAnchor="middle">2</text>
                    </g>
                    <g className={balClass('bunker')} data-part="bunker" onClick={() => handleSelectPart('bunker')}>
                        <path d="M100 100V110" /><circle cx="100" cy="90" r="10" /><text x="100" y="94" textAnchor="middle">3</text>
                    </g>
                    <g className={balClass('trv')} data-part="trv" onClick={() => handleSelectPart('trv')}>
                        <path d="M640 50V59" /><circle cx="640" cy="40" r="10" /><text x="640" y="44" textAnchor="middle">4</text>
                    </g>
                    <g className={balClass('ctrl')} data-part="ctrl" onClick={() => handleSelectPart('ctrl')}>
                        <path d="M316 140H352" /><circle cx="306" cy="140" r="10" /><text x="306" y="144" textAnchor="middle">5</text>
                    </g>
                </svg>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-3.5 py-2 border-t border-[#1C2530] text-xs text-[#93A1B0]">
                <span className="inline-flex items-center gap-1.5">
                    <span className="inline-block w-4 h-0.5 bg-[#F26B21]" />
                    {ui.legendT1}
                </span>
                <span className="inline-flex items-center gap-1.5">
                    <span className="inline-block w-4 h-0.5 bg-[#3FA9F5]" />
                    {ui.legendT2}
                </span>
                <span className="inline-flex items-center gap-1.5">
                    <span className="inline-block w-4 h-0.5 bg-[#E8B04B]" />
                    {ui.legendFuel}
                </span>
                <span className="inline-flex items-center gap-1.5">
                    <span className="inline-block w-4 h-0.5 bg-[#6FCF97]" />
                    {ui.legendCtrl}
                </span>
                <span className="ml-auto text-[#7A8796]">P265GH 6 mm · Rev 4.2</span>
            </div>

            {mode === 'parts' ? (
                <div>
                    <div className="flex flex-wrap items-center gap-1.5 px-3.5 py-2.5 border-t border-[#1C2530]">
                        {primaryParts.map((part, idx) => {
                            const active = selectedPartId === part.id;
                            const c = part.copy[locale];
                            return (
                                <button
                                    key={part.id}
                                    type="button"
                                    data-testid={`schematic-hotspot-${part.num}`}
                                    data-part={part.id}
                                    aria-pressed={active}
                                    onClick={() => handleSelectPart(part.id)}
                                    className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xs border text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                                        active
                                            ? 'border-[#F26B21] bg-[#141C26] text-white'
                                            : 'border-[#232D38] bg-[#111821] text-[#C9D3DC] hover:border-[#4A5766]'
                                    }`}
                                >
                                    <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-[#F26B21] text-[#0C1117] text-[10px] font-bold">
                                        {idx + 1}
                                    </span>
                                    <span>{c.shortLabel}</span>
                                </button>
                            );
                        })}
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 px-3.5 py-2 border-t border-[#1C2530]">
                        <span className="text-xs text-[#7A8796] mr-1">{ui.alsoInNode}</span>
                        {secondaryParts.map((part) => {
                            const active = selectedPartId === part.id;
                            return (
                                <button
                                    key={part.id}
                                    type="button"
                                    data-part={part.id}
                                    aria-pressed={active}
                                    onClick={() => handleSelectPart(part.id)}
                                    className={`px-2.5 py-1 rounded-xs border text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                                        active
                                            ? 'border-[#F26B21] text-[#FFB35C] bg-[#141C26]'
                                            : 'border-[#232D38] text-[#C9D3DC] bg-[#111821] hover:border-[#4A5766]'
                                    }`}
                                >
                                    {part.copy[locale].shortLabel}
                                </button>
                            );
                        })}
                    </div>

                    <div
                        data-testid="schematic-selected-bar"
                        className="border-t border-[#1C2530] bg-[#101720] p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                        <div className="flex items-start gap-3 min-w-0">
                            <span className="h-12 w-12 shrink-0 rounded-xs bg-[#EEEBE4] p-1 flex items-center justify-center overflow-hidden">
                                <img
                                    src={assetUrl(currentPart.imageUrl)}
                                    alt={partCopy.title}
                                    className="max-h-full max-w-full object-contain mix-blend-multiply"
                                />
                            </span>
                            <div className="space-y-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-2 text-xs">
                                    <span className="font-mono font-bold text-[#F26B21]">
                                        {currentPart.num} / 10 · SKU {currentPart.sku}
                                    </span>
                                    <span className="border border-[#2A3440] bg-[#141B22] px-1.5 py-0.5 text-xs font-semibold text-[#C9D3DC]">
                                        {partCopy.specPill}
                                    </span>
                                    <span className="font-bold text-white tabular-nums">{formattedPrice}</span>
                                    <span className="text-xs text-[#6FCF97] font-semibold">
                                        {ui.stockPrefix} {currentPart.stockKaunas} {ui.stockUnit}
                                    </span>
                                </div>
                                <h3 className="text-sm sm:text-base font-extrabold text-white leading-snug break-words">
                                    {partCopy.title}
                                </h3>
                                <p className="text-xs text-[#A6AFB9] leading-relaxed">{partCopy.description}</p>
                            </div>
                        </div>
                        <div className="flex sm:flex-col items-center sm:items-end gap-2 shrink-0">
                            <Link
                                href={`/${locale}${currentPart.href}`}
                                className="px-3 py-1.5 rounded-xs bg-[#C8430F] hover:bg-[#A8370B] text-xs font-bold text-white whitespace-nowrap transition-colors"
                            >
                                {ui.viewProductCta}
                            </Link>
                            <Link
                                href={`/${locale}/vedlys`}
                                className="text-xs text-[#A6AFB9] hover:text-white whitespace-nowrap"
                            >
                                {ui.configureKitCta}
                            </Link>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="border-t border-[#1C2530] bg-[#101720] p-4 space-y-3">
                    <div className="flex flex-wrap gap-2">
                        {STORY_STEPS.map((st, idx) => {
                            const isCurrent = idx === storyStep;
                            const isDone = idx < storyStep;
                            return (
                                <button
                                    key={st.num}
                                    type="button"
                                    aria-current={isCurrent ? 'step' : undefined}
                                    onClick={() => {
                                        setStoryStep(idx);
                                        setStoryPlaying(false);
                                    }}
                                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xs border text-xs font-bold whitespace-nowrap cursor-pointer transition-colors ${
                                        isCurrent
                                            ? 'border-[#F26B21] bg-[#141C26] text-white'
                                            : isDone
                                              ? 'border-[#F26B21]/60 bg-[#111821] text-[#C9D3DC]'
                                              : 'border-[#2A3440] bg-[#0C1117] text-[#93A1B0]'
                                    }`}
                                >
                                    <span className="text-[#F26B21] tabular-nums">{st.num}</span>
                                    <span>{st.title[locale]}</span>
                                </button>
                            );
                        })}
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                        <p className="text-xs sm:text-sm text-[#C9D3DC] leading-relaxed">
                            {activeStory.caption[locale]}
                        </p>
                        <div className="flex items-center gap-1.5 shrink-0">
                            <button
                                type="button"
                                aria-label={ui.prevStep}
                                onClick={() => {
                                    setStoryStep((s) => (s + STORY_STEPS.length - 1) % STORY_STEPS.length);
                                    setStoryPlaying(false);
                                }}
                                className="px-2.5 py-1.5 rounded-xs border border-[#2A3440] bg-[#0C1117] hover:border-[#F26B21] text-xs font-semibold text-[#C9D3DC] whitespace-nowrap cursor-pointer"
                            >
                                ‹
                            </button>
                            <button
                                type="button"
                                aria-label={storyPlaying ? ui.pauseStory : ui.playStory}
                                onClick={() => setStoryPlaying((p) => !p)}
                                className="px-3 py-1.5 rounded-xs border border-[#2A3440] bg-[#0C1117] hover:border-[#F26B21] text-xs font-semibold text-[#F26B21] whitespace-nowrap cursor-pointer"
                            >
                                {storyPlaying ? ui.pauseStory : ui.playStory}
                            </button>
                            <button
                                type="button"
                                aria-label={ui.nextStep}
                                onClick={() => {
                                    setStoryStep((s) => (s + 1) % STORY_STEPS.length);
                                    setStoryPlaying(false);
                                }}
                                className="px-2.5 py-1.5 rounded-xs border border-[#2A3440] bg-[#0C1117] hover:border-[#F26B21] text-xs font-semibold text-[#C9D3DC] whitespace-nowrap cursor-pointer"
                            >
                                ›
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
