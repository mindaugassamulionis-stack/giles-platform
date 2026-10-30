'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { ZoomIn, X, ChevronLeft, ChevronRight, FileText, Calculator, Compass, Wrench } from 'lucide-react';
import { assetUrl } from '../lib/api';
import type { AppLocale } from '../i18n/routing';

export type IndustrialCadViewId = 'plan' | 'section' | 'hydronic';
export type IndustrialDossierTabId = 'cad' | 'specs' | 'roi' | 'guide';
export type IndustrialReplacedFuelId = 'dujos' | 'dyzelinas' | 'centrinis';

export interface IndustrialCadViewSpec {
    id: IndustrialCadViewId;
    tabLabel: Record<AppLocale, string>;
    blueprintTitle: Record<AppLocale, string>;
    scaleLabel: string;
    summary: Record<AppLocale, string>;
    callouts: Array<{
        code: string;
        label: Record<AppLocale, string>;
        detail: Record<AppLocale, string>;
    }>;
}

export interface IndustrialSpecRow {
    param: Record<AppLocale, string>;
    value: Record<AppLocale, string>;
}

export interface IndustrialContainerSystem {
    id: string;
    code: string;
    powerKw: number;
    powerLabel: string;
    imageSrc: string;
    workNumLabel: string;
    shortTitle: Record<AppLocale, string>;
    title: Record<AppLocale, string>;
    subtitle: Record<AppLocale, string>;
    applicationSummary: Record<AppLocale, string>;
    dimensionsIso: string;
    hopperVolumeLabel: string;
    flangeDn: string;
    buyPriceNetEur: number;
    rentMonthlyNetEur: number;
    cadViews: IndustrialCadViewSpec[];
    specs: IndustrialSpecRow[];
}

export interface LithuanianFuelBenchmark {
    id: string;
    label: Record<AppLocale, string>;
    priceRangeLabel: Record<AppLocale, string>;
    avgEurPerMwh: number;
    sourceNote: Record<AppLocale, string>;
}

export interface ZeroToHeroStep {
    stepNumber: string;
    durationLabel: Record<AppLocale, string>;
    title: Record<AppLocale, string>;
    description: Record<AppLocale, string>;
    deliverable: Record<AppLocale, string>;
}

function l4(lt: string, en?: string, pl?: string, ru?: string): Record<AppLocale, string> {
    return {
        lt,
        en: en || lt,
        pl: pl || en || lt,
        ru: ru || en || lt,
    };
}

export const COMPATIBILITY_SOURCE_PROVENANCE_COPY: Record<
    AppLocale,
    {
        standardSource: string;
        retrofitCaveat: string;
    }
> = {
    lt: {
        standardSource:
            'Šaltinis: Gamintojo techninis katalogas (Danfoss / IMI Hydronic / HERZ / Haier / Gorenje 2025–2026) ir LST EN 215 / EN 12828 / EN 303-5 standartas',
        retrofitCaveat:
            'Patikslinimo pastaba: Kieto kuro katilų durelių angos ir flanšo matmenys priklauso nuo katilo pagaminimo metų ir kW modifikacijos – prieš užsakant durelių perdarymo komplektą ar degiklį, tikslius matmenis pasitikslinkite pagal katilo techninį pasą arba su „Gilės inžinerijos“ inžinieriumi (+370 611 19158).',
    },
    en: {
        standardSource:
            'Source: Manufacturer technical catalog (Danfoss / IMI Hydronic / HERZ / Haier / Gorenje 2025–2026) and LST EN 215 / EN 12828 / EN 303-5 standard',
        retrofitCaveat:
            'Verification note: Solid-fuel boiler door aperture and flange dimensions vary by production year and kW rating – before ordering a door conversion kit or pellet burner, verify exact dimensions against the boiler passport or with a „Gilės inžinerija“ engineer (+370 611 19158).',
    },
    pl: {
        standardSource:
            'Źródło: Katalog techniczny producenta (Danfoss / IMI Hydronic / HERZ / Haier / Gorenje 2025–2026) oraz norma LST EN 215 / EN 12828 / EN 303-5',
        retrofitCaveat:
            'Uwaga weryfikacyjna: Wymiary otworu drzwiczek i kołnierza kotłów stałopalnych zależą od roku produkcji i mocy (kW) – przed zamówieniem zestawu konwersyjnego lub palnika zweryfikuj wymiary z dokumentacją kotła lub inżynierem „Gilės inžinerija” (+370 611 19158).',
    },
    ru: {
        standardSource:
            'Источник: Технический каталог производителя (Danfoss / IMI Hydronic / HERZ / Haier / Gorenje 2025–2026) и стандарт LST EN 215 / EN 12828 / EN 303-5',
        retrofitCaveat:
            'Примечание по проверке: Размеры проема дверец и фланца твердотопливных котлов зависят от года выпуска и мощности (кВт) – перед заказом комплекта переоборудования или горелки уточните размеры по техпаспорту котла или с инженером «Gilės inžinerija» (+370 611 19158).',
    },
};

export const LITHUANIAN_INDUSTRIAL_FUEL_BENCHMARKS: LithuanianFuelBenchmark[] = [
    {
        id: 'sm2_skiedra',
        label: l4(
            'Medienos skiedra (SM2)',
            'Wood chips (SM2 grade)',
            'Zrębka drzewna (SM2)',
            'Древесная щепа (SM2)',
        ),
        priceRangeLabel: l4(
            '~24–29 €/MWh šilumos',
            '~24–29 €/MWh thermal',
            '~24–29 €/MWh ciepła',
            '~24–29 €/МВт·ч тепла',
        ),
        avgEurPerMwh: 26.5,
        sourceNote: l4(
            'BALTPOOL biokuro biržos SM2 indeksas ir LEA metinė suvestinė (drėgnumas W30–W35%)',
            'BALTPOOL biomass exchange SM2 index and LEA annual review (moisture W30–W35%)',
        ),
    },
    {
        id: 'pramonines_granules',
        label: l4(
            'Pramoninės medienos granulės',
            'Industrial wood pellets (ENplus A1/A2)',
            'Przemysłowy pellet drzewny (ENplus A1/A2)',
            'Промышленные древесные пеллеты (ENplus A1/A2)',
        ),
        priceRangeLabel: l4(
            '~44–52 €/MWh šilumos',
            '~44–52 €/MWh thermal',
            '~44–52 €/MWh ciepła',
            '~44–52 €/МВт·ч тепла',
        ),
        avgEurPerMwh: 48.0,
        sourceNote: l4(
            'Didmeninis 6–8 mm ENplus A1/A2 granulių tiekimas autocisternomis arba didmaišiais (Big-Bag)',
            'Bulk 6–8 mm ENplus A1/A2 pellet supply via pneumatic tanker or Big-Bag',
        ),
    },
    {
        id: 'gamtines_dujos',
        label: l4(
            'Gamtinės dujos (su ESO skirstymu ir CO2/akcizu)',
            'Natural gas (incl. ESO distribution & CO2/excise)',
            'Gaz ziemny (z dystrybucją ESO i akcyzą/CO2)',
            'Природный газ (с распределением ESO и акцизом/CO2)',
        ),
        priceRangeLabel: l4(
            '~68–84 €/MWh šilumos',
            '~68–84 €/MWh thermal',
            '~68–84 €/MWh ciepła',
            '~68–84 €/МВт·ч тепла',
        ),
        avgEurPerMwh: 76.0,
        sourceNote: l4(
            'VERT ir ESO komercinių vartotojų tarifai su pajėgumų dedamąja bei akcizu',
            'VERT and ESO commercial consumer tariffs including capacity fee and excise',
        ),
    },
    {
        id: 'lpg_dyzelinas',
        label: l4(
            'Suskystintos dujos (LPG) / Šildymo dyzelinas',
            'Liquefied petroleum gas (LPG) / Heating diesel',
            'Gaz płynny (LPG) / Olej opałowy',
            'Сжиженный газ (СУГ) / Печное дизтопливо',
        ),
        priceRangeLabel: l4(
            '~95–122 €/MWh šilumos',
            '~95–122 €/MWh thermal',
            '~95–122 €/MWh ciepła',
            '~95–122 €/МВт·ч тепла',
        ),
        avgEurPerMwh: 108.5,
        sourceNote: l4(
            'LEA degalų rinkos statistika pramoniniams objektams be dujotiekio įvado',
            'LEA fuel market statistics for industrial sites without gas grid connection',
        ),
    },
];

export const INDUSTRIAL_ZERO_TO_HERO_STEPS: ZeroToHeroStep[] = [
    {
        stepNumber: '01',
        durationLabel: l4('1–2 d. d.', '1–2 business days', '1–2 dni rob.', '1–2 раб. дня'),
        title: l4(
            'Šilumos apkrovų auditas ir kuro logistikos parinkimas',
            'Thermal Load Audit & Fuel Logistics Selection',
            'Audyt obciążenia cieplnego i dobór logistyki paliwa',
            'Аудит тепловых нагрузок и выбор логистики топлива',
        ),
        description: l4(
            'Įvertiname pastato šiluminę varžą, esamus šilumos punktus, piko kW poreikį ir privažiavimo kelius kuro pristatymui (savivarčiui su Walking-Floor arba didmaišiams).',
            'We evaluate building thermal demand, existing substations, peak kW load, and truck access for fuel delivery (Walking-Floor tipper or Big-Bag crane).',
        ),
        deliverable: l4(
            'Rezultatas: Techninis-ekonominis pasiūlymas su BALTPOOL / LEA kuro atsipirkimo skaičiavimu.',
            'Deliverable: Techno-economic proposal with BALTPOOL / LEA fuel payback calculation.',
        ),
    },
    {
        stepNumber: '02',
        durationLabel: l4('0 mėn. leidimams', '0 mo. building permit', '0 mies. na pozwolenie', '0 мес. на разрешение'),
        title: l4(
            'Teisinis statusas be statybos leidimo (mobilus technologinis įrenginys)',
            'Legal Classification Without Building Permit (Mobile Technological Unit)',
            'Status prawny bez pozwolenia na budowę (mobilne urządzenie technologiczne)',
            'Правовой статус без разрешения на строительство (мобильная техустановка)',
        ),
        description: l4(
            'Konteinerinė katilinė ant gelžbetoninių pamatinių blokų nėra stacionarus pastatas (STR 1.05.01:2017), todėl išvengiama 12–18 mėn. trukmės statybos leidimo procedūrų.',
            'A containerized boiler house placed on precast foundation blocks is classified as a mobile technological unit (STR 1.05.01:2017), avoiding 12–18 month building permit procedures.',
        ),
        deliverable: l4(
            'Rezultatas: Objekto pririšimo schema ir pamatinių blokų apkrovų planas (6,5–14,5 t).',
            'Deliverable: Site layout drawing and foundation block load plan (6.5–14.5 t).',
        ),
    },
    {
        stepNumber: '03',
        durationLabel: l4('4–8 savaitės', '4–8 weeks', '4–8 tygodni', '4–8 недель'),
        title: l4(
            '3D CAD projektavimas ir gamyklinis surinkimas Kauno ceche',
            '3D CAD Engineering & Factory Assembly in Kaunas Workshop',
            'Projektowanie 3D CAD i montaż fabryczny w zakładzie w Kownie',
            '3D CAD проектирование и заводская сборка в цехе в Каунасе',
        ),
        description: l4(
            'Suviriname ISO 20ft/40ft HC rėmą, sumontuojame P265GH katilą, judančių ardelių degiklį, multicikloną, Wilo Stratos kaskadą, IMI Pneumatex slėgio palaikymą ir EN 12828 saugos grupę.',
            'We weld the ISO 20ft/40ft HC frame and assemble the P265GH boiler, moving-grate burner, multicyclone, Wilo Stratos cascade, IMI Pneumatex pressurization, and EN 12828 safety group.',
        ),
        deliverable: l4(
            'Rezultatas: Gamyklinis PN6 bar hidraulinio bandymo aktas ir CE / EN 303-5 5 klasės pasas.',
            'Deliverable: Factory PN6 bar hydrostatic test certificate and CE / EN 303-5 Class 5 passport.',
        ),
    },
    {
        stepNumber: '04',
        durationLabel: l4('1–2 dienos', '1–2 days', '1–2 dni', '1–2 дня'),
        title: l4(
            'Atvežimas ir prijungimas prie objekto šilumos trasos (DN65–DN150)',
            'Delivery & Connection to Site Heating Main (DN65–DN150)',
            'Dostawa i podłączenie do sieci cieplnej obiektu (DN65–DN150)',
            'Доставка и подключение к теплотрассе объекта (DN65–DN150)',
        ),
        description: l4(
            'Modulis pastatomas kranu ant paruoštų pamatinių blokų, sujungiami DN65–DN150 tiekimo/grįžimo flanšai, 3×400V elektros įvadas ir sumontuojamas izoliuotas nerūdijančio plieno kaminas.',
            'The module is craned onto foundation blocks, DN65–DN150 supply/return flanges and 3×400V power are connected, and the insulated stainless-steel chimney is erected.',
        ),
        deliverable: l4(
            'Rezultatas: Užpildyta, nuorinta ir su objekto šilumos punktu susieta katilinė.',
            'Deliverable: Filled, de-aerated boiler house coupled with the building substation.',
        ),
    },
    {
        stepNumber: '05',
        durationLabel: l4('1 diena', '1 day', '1 dzień', '1 день'),
        title: l4(
            'Kuro užkrovimas, degimo derinimas ir emisijų matavimas (<150 mg/Nm³)',
            'Fuel Loading, Combustion Tuning & Emission Testing (<150 mg/Nm³)',
            'Załadunek paliwa, regulacja spalania i pomiar emisji (<150 mg/Nm³)',
            'Загрузка топлива, наладка горения и замер эмиссии (<150 мг/Нм³)',
        ),
        description: l4(
            'Užpildomas 12–36 m³ bunkeris (Walking-Floor hidraulinės grindys arba sraigtinis transporteris), dūmų analizatoriumi suderinamas lambda/O2 santykis ir multiciklono dūmsiurbės dažnio keitiklis.',
            'The 12–36 m³ bunker is loaded (Walking-Floor or auger), and flue gas analyzer tuning calibrates lambda/O2 ratio and the multicyclone VFD draft fan.',
        ),
        deliverable: l4(
            'Rezultatas: Dūmų analizės protokolas (η 91–93 %, CO ir kietosios dalelės pagal EcoDesign).',
            'Deliverable: Flue gas analysis protocol (η 91–93%, CO and particulates within EcoDesign limits).',
        ),
    },
    {
        stepNumber: '06',
        durationLabel: l4('24/7 telemetrija', '24/7 telemetry', 'Telemetria 24/7', '24/7 телеметрия'),
        title: l4(
            'SCADA / Modbus TCP nuotolinis monitoringas ir 7–14 parų autonomija',
            'SCADA / Modbus TCP Remote Monitoring & 7–14 Day Autonomy',
            'Zdalny nadzór SCADA / Modbus TCP i autonomia 7–14 dni',
            'Удаленный мониторинг SCADA / Modbus TCP и автономность 7–14 суток',
        ),
        description: l4(
            'Katilinė dirba be nuolatinio operatoriaus: pelenai sraigtais šalinami į išorinį ratukinį konteinerį, o PLC valdiklis siunčia parametrus į kliento BMS bei „Gilės inžinerijos“ Kauno dispečerinę.',
            'The plant operates unattended: augers extract ash into an external wheeled bin while the PLC streams telemetry to client BMS and the Gilės Kaunas dispatch center.',
        ),
        deliverable: l4(
            'Rezultatas: 5 m. konstrukcinė garantija ir SLA serviso sutartis visoje Lietuvoje.',
            'Deliverable: 5-year structural warranty and nationwide SLA service contract.',
        ),
    },
];

function buildCadViewsForSystem(
    code: string,
    containerType: string,
    powerLabel: string,
    flangeDn: string,
    bunkerVolume: string,
): IndustrialCadViewSpec[] {
    return [
        {
            id: 'plan',
            tabLabel: l4(
                '1. Planas iš viršaus (20ft/40ft HC)',
                '1. Top Plan View (20ft/40ft HC)',
                '1. Rzut z góry (20ft/40ft HC)',
                '1. План сверху (20ft/40ft HC)',
            ),
            blueprintTitle: l4(
                `PLANAS IŠ VIRŠAUS · ${code} (${powerLabel}) · ${containerType} IŠDĖSTYMAS · M 1:25`,
                `TOP PLAN VIEW · ${code} (${powerLabel}) · ${containerType} LAYOUT · SCALE 1:25`,
            ),
            scaleLabel: 'M 1:25 · ISO 1496-1',
            summary: l4(
                `20ft/40ft HC išdėstymas: katilas, kuro bunkeris (${bunkerVolume}), šnekai, multiciklonas, hidraulinis kolektorius (${flangeDn}), PLC skydas ir priešgaisrinis vožtuvas.`,
                `20ft/40ft HC layout: boiler, fuel bunker (${bunkerVolume}), feed augers, multicyclone, hydronic manifold (${flangeDn}), PLC cabinet, and fire valve.`,
            ),
            callouts: [
                {
                    code: 'A1',
                    label: l4('Kuro bunkeris ir padavimo šnekai', 'Fuel Bunker & Feed Augers'),
                    detail: l4(
                        `${bunkerVolume} talpa su judančiomis grindimis arba sraigtiniu transporteriu ir priešgaisrine sklende`,
                        `${bunkerVolume} storage with Walking-Floor or auger conveyor and fire-stop rotary valve`,
                    ),
                },
                {
                    code: 'B2',
                    label: l4('Katilas ir judančių ardelių degiklis', 'Boiler & Moving-Grate Burner'),
                    detail: l4(
                        `P265GH katilinio plieno 3 eigų šilumokaitis (${powerLabel}) su pneumatiniu vamzdžių valymu`,
                        `P265GH boiler steel 3-pass heat exchanger (${powerLabel}) with pneumatic tube cleaning`,
                    ),
                },
                {
                    code: 'C3',
                    label: l4('Multiciklonas ir hidraulinis kolektorius', 'Multicyclone & Hydronic Manifold'),
                    detail: l4(
                        `Dūmų valymo blokas (<150 mg/Nm³), ${flangeDn} flanšai ir PLC 7" SCADA valdymo skydas`,
                        `Flue gas cyclone (<150 mg/Nm³), ${flangeDn} flanges, and PLC 7" SCADA control cabinet`,
                    ),
                },
            ],
        },
        {
            id: 'section',
            tabLabel: l4(
                '2. Šoninis pjūvis ir dūmų traktas',
                '2. Side Cross-Section & Flue Tract',
                '2. Przekrój boczny i trakt spalin',
                '2. Боковой разрез и дымовой тракт',
            ),
            blueprintTitle: l4(
                `ŠONINIS PJŪVIS IR DŪMŲ VALYMO TRAKTAS · ${code} · EN 303-5 5 KLASĖ`,
                `SIDE CROSS-SECTION & FLUE FILTRATION TRACT · ${code} · EN 303-5 CLASS 5`,
            ),
            scaleLabel: 'M 1:25 · EN 303-5',
            summary: l4(
                'Judančios ardelės, šamoto kamera (1 050 °C), 3 eigų konvekcinis šilumokaitis, multiciklonas <150 mg/Nm³, dūmsiurbė su dažnio keitikliu ir izoliuotas nerūdijančio plieno kaminas.',
                'Moving grates, fireclay chamber (1,050 °C), 3-pass convective heat exchanger, multicyclone <150 mg/Nm³, VFD induced draft fan, and insulated stainless chimney.',
            ),
            callouts: [
                {
                    code: 'S1',
                    label: l4('Judančios ardelės ir šamoto kamera', 'Moving Grates & Fireclay Chamber'),
                    detail: l4(
                        'Inox kaitrai atsparios ardelės savaime šalina šlaką; šamoto skliautas palaiko pilną biokuro sudegimą',
                        'Heat-resistant Inox grates self-clean clinker; fireclay arch ensures complete biomass burnout',
                    ),
                },
                {
                    code: 'S2',
                    label: l4('Multiciklonas <150 mg/Nm³ ir pelenų šnekai', 'Multicyclone <150 mg/Nm³ & Ash Augers'),
                    detail: l4(
                        'Cikloninis kietųjų dalelių atskyriklis ir automatinis sraigtinis pelenų šalinimas į išorinį konteinerį',
                        'Cyclonic particulate separator and automatic auger ash extraction into external wheeled bin',
                    ),
                },
                {
                    code: 'S3',
                    label: l4('Dūmsiurbė ir izoliuotas kaminas', 'VFD Draft Fan & Insulated Chimney'),
                    detail: l4(
                        'Dažnio keitikliu valdomas dūmų ventiliatorius palaiko pastovų -20 Pa išretėjimą pakuroje',
                        'VFD-controlled induced draft fan stabilizes -20 Pa negative furnace pressure',
                    ),
                },
            ],
        },
        {
            id: 'hydronic',
            tabLabel: l4(
                '3. Hidraulinė ir objekto prijungimo schema',
                '3. Hydronic & Site Connection Schematic',
                '3. Schemat hydrauliczny i przyłączeniowy',
                '3. Гидравлическая схема подключения',
            ),
            blueprintTitle: l4(
                `HIDRAULINĖ IR OBJEKTO PRIJUNGIMO SCHEMA · ${code} · ${flangeDn} PN6 · EN 12828`,
                `HYDRONIC & SITE CONNECTION SCHEMATIC · ${code} · ${flangeDn} PN6 · EN 12828`,
            ),
            scaleLabel: 'EN 12828 · PN6 bar',
            summary: l4(
                `${flangeDn} flanšai, ≥55 °C grįžtamo srauto antikondensacinis pamaišymo mazgas, Wilo Stratos kaskada, IMI Pneumatex slėgio palaikymas ir EN 12828 apsauginiai vožtuvai.`,
                `${flangeDn} flanges, ≥55 °C return anti-condensation mixing loop, Wilo Stratos pump cascade, IMI Pneumatex pressurization, and EN 12828 safety valves.`,
            ),
            callouts: [
                {
                    code: 'H1',
                    label: l4('55 °C antikondensacinis pamaišymo mazgas', '55 °C Anti-Condensation Mixing Loop'),
                    detail: l4(
                        'Trijų eigų pavara su katilo trumpuoju kontūru saugo P265GH šilumokaitį nuo žematemperatūrės korozijos',
                        '3-way motorized mixing loop protects the P265GH heat exchanger from low-temperature flue gas condensation',
                    ),
                },
                {
                    code: 'H2',
                    label: l4('Wilo Stratos kaskada ir Pneumatex slėgio palaikymas', 'Wilo Stratos Cascade & Pneumatex Pressurization'),
                    detail: l4(
                        ' Elektroninis dvigubas siurblys su rezervu, IMI Pneumatex Statico / Zeparo oro ir šlamo separatoriai',
                        'Twin electronic main pump with automatic failover, IMI Pneumatex Statico / Zeparo air & dirt separators',
                    ),
                },
                {
                    code: 'H3',
                    label: l4(`Objekto trasos prijungimo flanšai (${flangeDn})`, `Site Heating Main Flanges (${flangeDn})`),
                    detail: l4(
                        'T1/T2 85/65 °C arba atskyrimas per plokštelinį šilumokaitį iki 6 bar darbinio slėgio',
                        'T1/T2 85/65 °C direct feed or hydraulic separation via brazed/gasketed plate heat exchanger up to 6 bar',
                    ),
                },
            ],
        },
    ];
}

function build12PointSpecs(cfg: {
    powerValue: string;
    efficiencyValue: string;
    pressureValue: string;
    fuelTypesValue: string;
    fuelConsumptionValue: string;
    bunkerVolumeValue: string;
    autonomyValue: string;
    ashRemovalValue: string;
    flueCleaningValue: string;
    automationValue: string;
    dimensionsValue: string;
    connectionsValue: string;
}): IndustrialSpecRow[] {
    return [
        {
            param: l4('01. Vardinė galia', '01. Rated Thermal Output', '01. Moc znamionowa', '01. Номинальная мощность'),
            value: l4(cfg.powerValue),
        },
        {
            param: l4('02. Naudingumo koeficientas', '02. Thermal Efficiency', '02. Sprawność cieplna', '02. КПД и класс эмиссии'),
            value: l4(cfg.efficiencyValue),
        },
        {
            param: l4('03. Darbinis slėgis', '03. Working Pressure', '03. Ciśnienie robocze', '03. Рабочее давление'),
            value: l4(cfg.pressureValue),
        },
        {
            param: l4('04. Kuro tipai', '04. Supported Fuels', '04. Rodzaje paliwa', '04. Виды топлива'),
            value: l4(cfg.fuelTypesValue),
        },
        {
            param: l4('05. Kuro sąnaudos (50% / 100%)', '05. Fuel Consumption (50% / 100%)', '05. Zużycie paliwa (50% / 100%)', '05. Расход топлива (50% / 100%)'),
            value: l4(cfg.fuelConsumptionValue),
        },
        {
            param: l4('06. Kuro saugyklos tūris', '06. Fuel Bunker Volume', '06. Pojemność magazynu paliwa', '06. Объем топливного бункера'),
            value: l4(cfg.bunkerVolumeValue),
        },
        {
            param: l4('07. Autonominis darbas be operatoriaus', '07. Unattended Autonomy', '07. Praca autonomiczna bez operatora', '07. Автономная работа без оператора'),
            value: l4(cfg.autonomyValue),
        },
        {
            param: l4('08. Pelenų šalinimas', '08. Ash Extraction System', '08. Usuwanie popiołu', '08. Золоудаление'),
            value: l4(cfg.ashRemovalValue),
        },
        {
            param: l4('09. Dūmų valymas', '09. Flue Gas Filtration', '09. Odpylanie spalin', '09. Очистка дымовых газов'),
            value: l4(cfg.flueCleaningValue),
        },
        {
            param: l4('10. Automatika ir telemetrija', '10. Automation & Telemetry', '10. Automatyka i telemetria', '10. Автоматика и телеметрия'),
            value: l4(cfg.automationValue),
        },
        {
            param: l4('11. Gabaritai ir masė', '11. Dimensions & Dry Weight', '11. Gabaryty i masa', '11. Габариты и масса'),
            value: l4(cfg.dimensionsValue),
        },
        {
            param: l4('12. Prijungimo flanšai ir elektra', '12. Connection Flanges & Power', '12. Kołnierze przyłączeniowe i zasilanie', '12. Присоединительные фланцы и электропитание'),
            value: l4(cfg.connectionsValue),
        },
    ];
}

export const INDUSTRIAL_CONTAINER_SYSTEMS: IndustrialContainerSystem[] = [
    {
        id: 'gk-500',
        code: 'GK-500',
        powerKw: 500,
        powerLabel: '500 kW',
        imageSrc: '/studio-assets/projects/giles-darbas-06.webp',
        workNumLabel: 'Mazgas #06 · GK-500',
        shortTitle: l4(
            'GK-500 Konteinerinė katilinė',
            'GK-500 Containerized boiler room',
            'GK-500 Kotłownia kontenerowa',
            'GK-500 Контейнерная котельная',
        ),
        title: l4(
            '1. GK-500 Konteinerinė biokuro katilinė 500 kW',
            '1. GK-500 Containerized Biomass Boiler Room 500 kW',
            '1. GK-500 Kontenerowa kotłownia biomasowa 500 kW',
            '1. GK-500 Контейнерная биокотельная 500 кВт',
        ),
        subtitle: l4(
            'Pilnos gamyklinės parengties ISO 20ft HC modulis su judančių ardelių degikliu, multiciklonu ir 18 m³ kuro sandėliu',
            'Turnkey ISO 20ft HC module with moving-grate burner, multicyclone, and 18 m³ fuel bunker',
        ),
        applicationSummary: l4(
            'Gamybos cechams, logistikos centrams, šiltnamių ūkiams ir mokykloms (2 000 – 4 500 m²)',
            'Manufacturing halls, logistics centers, greenhouses, and schools (2,000 – 4,500 m²)',
        ),
        dimensionsIso: 'ISO 20ft HC: 6 058 × 2 438 × 2 896 mm (8,4 t)',
        hopperVolumeLabel: '18 m³ (judančios grindys / sraigtas)',
        flangeDn: 'DN80 PN6',
        buyPriceNetEur: 54000,
        rentMonthlyNetEur: 2450,
        cadViews: buildCadViewsForSystem('GK-500', 'ISO 20ft HC', '500 kW', 'DN80 PN6', '18 m³'),
        specs: build12PointSpecs({
            powerValue: '500 kW (galios moduliacija 125–500 kW, 25–100 %)',
            efficiencyValue: 'η 92,4 %, LST EN 303-5 5 klasė (EcoDesign)',
            pressureValue: '3–6 bar (darbinis 4,0 bar, bandomasis 6,0 bar pagal EN 12828)',
            fuelTypesValue: 'Medienos granulės ENplus A1/A2, pramoninės granulės, skiedra G30–G50 iki W35%, briketai',
            fuelConsumptionValue: '54 kg/h (esant 50% apkrovai) / 108 kg/h (esant 100% apkrovai)',
            bunkerVolumeValue: '18 m³ su hidraulinėmis judančiomis grindimis arba sraigtiniu transporteriu A2',
            autonomyValue: '7–14 parų be operatoriaus įsikišimo (priklausomai nuo lauko temperatūros)',
            ashRemovalValue: 'Automatinis sraigtinis iš po ardelių ir šilumokaičio į išorinį 240 L ratukinį konteinerį',
            flueCleaningValue: 'Multiciklonas (<150 mg/Nm³) su dūmsiurbe, dažnio keitikliu ir traukos jutikliu',
            automationValue: 'PLC valdiklis su 7" jutikliniu ekranu, GSM/SCADA telemetrija ir Modbus TCP/RTU',
            dimensionsValue: 'ISO 20ft HC: 6 058 × 2 438 × 2 896 mm, sausa masė 8,4 t (EI60 nedegi vata 100 mm)',
            connectionsValue: 'Šilumos trasa DN80 PN16 flanšai, elektra 3×400V, 11 kW, kaminas Ø250 mm Inox',
        }),
    },
    {
        id: 'gk-750',
        code: 'GK-750',
        powerKw: 750,
        powerLabel: '750 kW',
        imageSrc: '/studio-assets/projects/giles-darbas-07.webp',
        workNumLabel: 'Mazgas #07 · GK-750',
        shortTitle: l4(
            'GK-750 Pramoninė katilinė',
            'GK-750 Industrial boiler plant',
            'GK-750 Kotłownia przemysłowa',
            'GK-750 Промышленная котельная',
        ),
        title: l4(
            '2. GK-750 Pramoninė katilinė 750 kW',
            '2. GK-750 Industrial Biomass Boiler Plant 750 kW',
            '2. GK-750 Przemysłowa kotłownia biomasowa 750 kW',
            '2. GK-750 Промышленная котельная 750 кВт',
        ),
        subtitle: l4(
            'Didelio našumo 40ft HC pramoninis biokuro ir skiedros (G30–G50) modulis su Walking-Floor 28 m³ sandėliu',
            'High-capacity 40ft HC industrial wood-chip (G30–G50) and pellet plant with 28 m³ Walking-Floor store',
        ),
        applicationSummary: l4(
            'Medienos apdirbimo įmonėms, baldų gamykloms, žemės ūkio kompleksams ir gyvenvietėms (3 500 – 7 500 m²)',
            'Wood processing plants, furniture factories, agricultural complexes, and district heating (3,500 – 7,500 m²)',
        ),
        dimensionsIso: 'ISO 40ft HC: 12 192 × 2 438 × 2 896 mm (11,8 t)',
        hopperVolumeLabel: '28 m³ Walking-Floor hidraulinis sandėlis',
        flangeDn: 'DN100 PN6',
        buyPriceNetEur: 78000,
        rentMonthlyNetEur: 3200,
        cadViews: buildCadViewsForSystem('GK-750', 'ISO 40ft HC', '750 kW', 'DN100 PN6', '28 m³'),
        specs: build12PointSpecs({
            powerValue: '750 kW (galios moduliacija 180–750 kW, 3 eigų P265GH šilumokaitis)',
            efficiencyValue: 'η 92,8 %, LST EN 303-5 5 klasė su pneumatiniu šilumokaičio valymu',
            pressureValue: '3–6 bar (darbinis iki 5,0 bar, EN 12828 dvigubas apsauginis vožtuvas)',
            fuelTypesValue: 'Medienos skiedra G30–G50 iki W35%, pramoninės granulės ENplus A1/A2, agropelletai',
            fuelConsumptionValue: '82 kg/h (50% apkrova) / 164 kg/h (100% apkrova granulėmis); 210 kg/h SM2 skiedra',
            bunkerVolumeValue: '28 m³ su hidraulinėmis judančiomis grindimis (Walking-Floor) ir stoginiu liuku',
            autonomyValue: '10–14 parų be operatoriaus (automatinis kuro lygio ir drėgmės sekimas)',
            ashRemovalValue: 'Automatinis dvigubas sraigtinis transporteris į išorinį 400 L sandarų konteinerį',
            flueCleaningValue: 'Daugiapakopis multiciklonas (<140 mg/Nm³) su dūmsiurbe ir dažnio keitikliu',
            automationValue: 'PLC valdiklis su 7" ekranu, lambda zondas, GSM/SCADA ir Modbus TCP/RTU integracija',
            dimensionsValue: 'ISO 40ft HC: 12 192 × 2 438 × 2 896 mm, sausa masė 11,8 t',
            connectionsValue: 'Šilumos trasa DN100 PN16 flanšai, elektra 3×400V, 15 kW, kaminas Ø300 mm Inox',
        }),
    },
    {
        id: 'moduline-2000',
        code: 'GK-2000',
        powerKw: 2000,
        powerLabel: '2,0 MW (2×1000 kW)',
        imageSrc: '/studio-assets/projects/giles-darbas-08.webp',
        workNumLabel: 'Mazgas #08 · 2,0 MW',
        shortTitle: l4(
            'Modulinė katilinė 2,0 MW',
            '2.0 MW Modular boiler plant',
            'Kotłownia modułowa 2,0 MW',
            'Модульная котельная 2,0 МВт',
        ),
        title: l4(
            '3. Modulinė kaskadinė katilinė 2,0 MW (2×1000 kW)',
            '3. Modular Cascaded Boiler Plant 2.0 MW (2×1000 kW)',
            '3. Modułowa kaskadowa kotłownia 2,0 MW (2×1000 kW)',
            '3. Модульная каскадная котельная 2,0 МВт (2×1000 кВт)',
        ),
        subtitle: l4(
            'Dviejų kaskadinių 1 000 kW biokuro katilų pramoninė jėgainė su N+1 rezervavimu ir 36 m³ Walking-Floor saugykla',
            'Twin-boiler 2×1000 kW industrial biomass plant with N+1 redundancy and 36 m³ Walking-Floor fuel bunker',
        ),
        applicationSummary: l4(
            'Pramonės parkams, savivaldybių centralizuoto šildymo tinklams (CŠT) ir technologiniam garui / vandeniui (8 000 – 18 000 m²)',
            'Industrial parks, municipal district heating networks, and process heat (8,000 – 18,000 m²)',
        ),
        dimensionsIso: '2× ISO 40ft HC sublokuotas modulis: 12 192 × 4 876 × 3 200 mm (14,5 t / sekcija)',
        hopperVolumeLabel: '36 m³ Walking-Floor su dviguba sraigtų linija',
        flangeDn: 'DN150 PN6',
        buyPriceNetEur: 145000,
        rentMonthlyNetEur: 5800,
        cadViews: buildCadViewsForSystem('GK-2000', '2× 40ft HC KASKADA', '2,0 MW', 'DN150 PN6', '36 m³'),
        specs: build12PointSpecs({
            powerValue: '2 000 kW / 2,0 MW (2×1000 kW kaskada, moduliacija nuo 250 kW iki 2 000 kW)',
            efficiencyValue: 'η 93,0 %, LST EN 303-5 5 klasė su ekonomaizeriu ir pneumatiniu valymu',
            pressureValue: '4–6 bar (pramoninis šilumos tinklas PN6 / PN10 su IMI Pneumatex kompresorine stotimi)',
            fuelTypesValue: 'Medienos skiedra SM1/SM2 (G30–G50 iki W35%), pramoninės granulės ENplus A1/A2, briketai',
            fuelConsumptionValue: '215 kg/h (50% apkrova) / 430 kg/h (100% apkrova granulėmis); 560 kg/h skiedra',
            bunkerVolumeValue: '36 m³ su dvigubomis hidraulinėmis judančiomis grindimis (Walking-Floor) nepriklausomiems katilams',
            autonomyValue: '7–12 parų be operatoriaus (N+1 kaskados rotacija ir automatinis rezervo įjungimas)',
            ashRemovalValue: 'Centrinis sraigtinis šlako ir lakiųjų pelenų šalinimas į 2× 600 L konteinerius',
            flueCleaningValue: '2× nepriklausomi multiciklonai (<120 mg/Nm³) su dūmsiurbėmis ir dažnio keitikliais',
            automationValue: 'Pramoninis Siemens / Plum PLC skydas su 10" SCADA ekranu, Modbus TCP/RTU ir VPN dispečerine',
            dimensionsValue: '2× ISO 40ft HC sublokuoti moduliai: 12 192 × 4 876 × 2 896 mm, masė 14,5 t + 11,2 t',
            connectionsValue: 'Magistraliniai flanšai DN150 PN16, elektra 3×400V, 22 kW, 2× Ø350 mm izoliuoti kaminai',
        }),
    },
    {
        id: 'mobili-500',
        code: 'MOB-500',
        powerKw: 500,
        powerLabel: '500 kW (Mobili)',
        imageSrc: '/studio-assets/projects/giles-darbas-09.webp',
        workNumLabel: 'Mazgas #09 · Nuoma 500 kW',
        shortTitle: l4(
            'Mobili katilinė nuomai 500 kW',
            '500 kW Mobile rental boiler room',
            'Mobilna kotłownia na wynajem 500 kW',
            'Мобильная котельная в аренду 500 кВт',
        ),
        title: l4(
            '4. Mobili katilinė nuomai ir avariniam šildymui 500 kW (ant priekabos / važiuoklės)',
            '4. Mobile Boiler Room for Rental & Emergency Heating 500 kW (Trailer Chassis)',
            '4. Mobilna kotłownia na wynajem i ogrzewanie awaryjne 500 kW (na podwoziu)',
            '4. Мобильная котельная для аренды и аварийного отопления 500 кВт (на шасси)',
        ),
        subtitle: l4(
            'Greito reagavimo (24/7) mobilus šildymo modulis ant dviejų ašių važiuoklės arba hook-lift rėmo su greito sujungimo movomis',
            'Rapid-deployment (24/7) mobile boiler plant on twin-axle trailer or hook-lift skid with Camlock quick couplings',
        ),
        applicationSummary: l4(
            'Avariniam šildymui katilinės rekonstrukcijos metu, statybų žiemos betonavimui ir laikiniems paviljonams',
            'Emergency backup during boiler house reconstruction, winter concrete curing, and temporary industrial halls',
        ),
        dimensionsIso: 'ISO 20ft HC ant važiuoklės: 6 058 × 2 438 × 2 896 mm (7,2 t)',
        hopperVolumeLabel: '12 m³ integruotas granulių bunkeris',
        flangeDn: 'DN65 / DN80 Camlock',
        buyPriceNetEur: 56000,
        rentMonthlyNetEur: 2200,
        cadViews: buildCadViewsForSystem('MOB-500', '20ft HC + VAŽIUOKLĖ', '500 kW', 'DN65 / DN80', '12 m³'),
        specs: build12PointSpecs({
            powerValue: '500 kW (greito paleidimo režimas, moduliacija 110–500 kW)',
            efficiencyValue: 'η 91,8 %, EN 303-5 5 klasė su integruotu plokšteliniu šilumokaičiu',
            pressureValue: '3–6 bar (atskirtas pirminis/antrinis kontūras per nerūdijančio plieno šilumokaitį)',
            fuelTypesValue: 'Medienos granulės ENplus A1/A2 (6–8 mm), pramoninės granulės arba dyzelinis rezervas',
            fuelConsumptionValue: '53 kg/h (esant 50% apkrovai) / 106 kg/h (esant 100% apkrovai)',
            bunkerVolumeValue: '12 m³ integruotas granulių bunkeris su pneumatine užpylimo jungtimi Storz',
            autonomyValue: '7–10 parų autonominis darbas su nuotoliniu SMS/GSM kuro likučio perspėjimu',
            ashRemovalValue: 'Automatinis sraigtinis pelenų šalinimas į išimamą sandarią pelenų dėžę',
            flueCleaningValue: 'Kompaktinis multiciklonas su dūmsiurbe ir teleskopiniu transportiniu kaminu',
            automationValue: 'PLC valdiklis su 7" jutikliniu ekranu, GSM telemetrija ir 1-mygtuko paleidimu',
            dimensionsValue: 'ISO 20ft HC ant priekabos / hook-lift rėmo: 6 058 × 2 438 × 2 896 mm, masė 7,2 t',
            connectionsValue: 'DN65 / DN80 flanšai + lanksčios šildymo žarnos (15 m komplekte), elektra 3×400V, 32A CEE',
        }),
    },
    {
        id: 'bioduju-pramonine',
        code: 'BIO-DUJOS-800',
        powerKw: 800,
        powerLabel: '400–1200 kW',
        imageSrc: '/studio-assets/projects/giles-darbas-14.webp',
        workNumLabel: 'Mazgas #14 · Biodujos',
        shortTitle: l4(
            'Pramoninė biodujų katilinė',
            'Industrial biogas boiler plant',
            'Przemysłowa kotłownia biogazowa',
            'Промышленная биогазовая котельная',
        ),
        title: l4(
            '5. Pramoninė biodujų ir kombinuoto kuro katilinė',
            '5. Industrial Biogas & Dual-Fuel Boiler Plant',
            '5. Przemysłowa kotłownia biogazowa i dwupaliwowa',
            '5. Промышленная биогазовая и комбинированная котельная',
        ),
        subtitle: l4(
            'Specializuotas konteinerinis modulis biodujų jėgainėms, nuotekų valykloms ir žemės ūkio bioreaktorių šildymui (316Ti nerūdijantis plienas)',
            'Specialized containerized plant for biogas CHP sites, wastewater treatment, and digester heating (316Ti stainless steel)',
        ),
        applicationSummary: l4(
            'Biodujų jėgainėms, fermentatorių palaikymui (38–52 °C), maisto pramonei ir sąvartynų dujų utilizacijai',
            'Biogas plants, anaerobic digester thermal stabilization (38–52 °C), food industry, and landfill gas utilization',
        ),
        dimensionsIso: 'ISO 20ft HC Ex-zona: 6 058 × 2 438 × 2 896 mm (6,9 t)',
        hopperVolumeLabel: 'Biodujų rampa + 12 m³ biokuro rezervas',
        flangeDn: 'DN80 / DN100 PN6',
        buyPriceNetEur: 68000,
        rentMonthlyNetEur: 2900,
        cadViews: buildCadViewsForSystem('BIO-DUJOS-800', 'ISO 20ft HC EX-ZONA', '800 kW', 'DN80 / DN100', 'Biodujos + 12 m³'),
        specs: build12PointSpecs({
            powerValue: '400–1 200 kW (bazinė konfigūracija 800 kW, moduliacija 15–100 %)',
            efficiencyValue: 'η 93,0 % (su kondensaciniu AISI 316Ti ekonomaizeriu iki 96 %)',
            pressureValue: '3–6 bar (EN 12828 pramoninis saugos mazgas ir dujų nuotėkio vožtuvai)',
            fuelTypesValue: 'Biodujos (CH4 48–68 %, H2S atspari armatūra), gamtinės dujos, medienos granulės (kombinuotas režimas)',
            fuelConsumptionValue: '75–145 Nm³/h biodujų arba 85–165 kg/h granulių rezerviniame režime',
            bunkerVolumeValue: 'Dviguba Dungs nerūdijančio plieno dujų rampa + 12 m³ rezervinis granulių bunkeris',
            autonomyValue: '14+ parų nepertraukiamas darbas su automatiniu perjungimu tarp biodujų ir rezervinio kuro',
            ashRemovalValue: 'Automatinis kondensato neutralizavimas ir sraigtinis pelenų šalinimas kieto kuro kameroje',
            flueCleaningValue: 'Rūgščiai atsparus AISI 316Ti dūmų traktas + multiciklonas kombinuotam režimui',
            automationValue: 'ATEX / CH4 dujų detektoriai, avarinė ventiliacija, PLC su 7" ekranu, SCADA / Modbus TCP/RTU',
            dimensionsValue: 'ISO 20ft HC: 6 058 × 2 438 × 2 896 mm, masė 6,9 t (sprogimui saugi ventiliacija)',
            connectionsValue: 'Šilumos flanšai DN80 / DN100, dujų įvadas DN50, elektra 3×400V, 9 kW',
        }),
    },
    {
        id: 'karsto-oro-80-190',
        code: 'MOB-ORO-190',
        powerKw: 190,
        powerLabel: '80–190 kW',
        imageSrc: '/studio-assets/projects/giles-darbas-16.webp',
        workNumLabel: 'Mazgas #16 · Karštas oras',
        shortTitle: l4(
            'Karšto oro katilinė 80–190 kW',
            '80–190 kW Hot-air boiler unit',
            'Kotłownia gorącego powietrza 80–190 kW',
            'Воздушная котельная 80–190 кВт',
        ),
        title: l4(
            '6. Pramoninė karšto oro katilinė 80–190 kW (gamybos cechams, angarams ir džiovykloms)',
            '6. Industrial Hot-Air Boiler Unit 80–190 kW (Production Halls, Hangars & Dryers)',
            '6. Przemysłowa kotłownia gorącego powietrza 80–190 kW (hale, hangary i suszarnie)',
            '6. Промышленная воздухонагревательная котельная 80–190 кВт (цеха, ангары и сушилки)',
        ),
        subtitle: l4(
            'Tiesioginio oro šildymo biokuro / granulių jėgainė be vandens užšalimo rizikos (oro srautas iki 14 500 m³/h)',
            'Direct-air biomass / pellet heating unit with zero freeze risk (airflow up to 14,500 m³/h)',
        ),
        applicationSummary: l4(
            'Aukštiems gamybos cechams, sandėliams, angarams, grūdų / medienos džiovykloms ir statybvietėms (800 – 2 500 m²)',
            'High-bay production halls, warehouses, hangars, grain/timber dryers, and construction sites (800 – 2,500 m²)',
        ),
        dimensionsIso: 'Kompaktinis ISO 20ft / rėminis modulis: 6 058 × 2 438 × 2 896 mm (6,5 t)',
        hopperVolumeLabel: '12 m³ granulių bunkeris su sraigtu',
        flangeDn: 'Ø400–500 mm ortakiai / DN65 kaloriferis',
        buyPriceNetEur: 28500,
        rentMonthlyNetEur: 1250,
        cadViews: buildCadViewsForSystem('MOB-ORO-190', '20ft KARŠTO ORO MODULIS', '80–190 kW', 'Ø450 mm / DN65', '12 m³'),
        specs: build12PointSpecs({
            powerValue: '80–190 kW (moduliacija 45–190 kW, oro srautas 8 500 – 14 500 m³/h, ΔT iki +65 °C)',
            efficiencyValue: 'η 91,2 %, EN 303-5 5 klasė (AISI 309S kaitrai atsparus oro šilumokaitis)',
            pressureValue: 'Be vandens kontūro (0 bar užšalimo rizika) arba kombinuotas 3–6 bar kaloriferinis mazgas',
            fuelTypesValue: 'Medienos granulės ENplus A1/A2, pramoninės granulės, briketai arba šildymo dyzelinas',
            fuelConsumptionValue: '19 kg/h (esant 50% apkrovai) / 39 kg/h (esant 100% 190 kW apkrovai)',
            bunkerVolumeValue: '12 m³ granulių saugykla su sraigtiniu tiektuvu ir priešgaisrine sklende',
            autonomyValue: '7–14 parų be operatoriaus (naktinis +8 °C palaikymo režimas negyvenamuose angaruose)',
            ashRemovalValue: 'Automatinis sraigtinis pelenų šalinimas į išorinį 120 L metalinį konteinerį',
            flueCleaningValue: 'Cikloninis dūmų filtras (<150 mg/Nm³) su dūmsiurbe ir dažnio keitikliu',
            automationValue: 'PLC su 7" ekranu, 4 cechų zonų belaidžiai termostatai, GSM/SCADA ir Modbus TCP/RTU',
            dimensionsValue: 'ISO 20ft HC: 6 058 × 2 438 × 2 896 mm, masė 6,5 t',
            connectionsValue: 'Karšto oro ortakių flanšai 2× Ø450 mm (arba DN65), elektra 3×400V, 8 kW',
        }),
    },
];

export interface IndustrialRoiCalculationInput {
    areaM2: number;
    requiredPowerKw: number;
    replacedFuel: IndustrialReplacedFuelId;
}

export interface IndustrialRoiCalculationResult {
    annualMwh: number;
    replacedFuelLabelLt: string;
    replacedFuelEurPerMwh: number;
    biomassEurPerMwh: number;
    currentAnnualCostEur: number;
    biomassAnnualCostEur: number;
    annualSavingsEur: number;
    estimatedCapexNetEur: number;
    paybackYears: number;
    paybackRangeLabelLt: string;
    recommendedSystemCode: string;
}

export function calculateIndustrialContainerRoi(
    input: IndustrialRoiCalculationInput,
): IndustrialRoiCalculationResult {
    const clampedArea = Math.max(1000, Math.min(15000, Math.round(input.areaM2)));
    const clampedKw = Math.max(150, Math.min(2000, Math.round(input.requiredPowerKw)));

    // Typical Lithuanian industrial heating season equivalent full-load hours (~2,150 h) blended with area demand
    const mwhFromPower = clampedKw * 2.15;
    const mwhFromArea = clampedArea * 0.22;
    const annualMwh = Math.round(mwhFromPower * 0.65 + mwhFromArea * 0.35);

    const fuelMap: Record<
        IndustrialReplacedFuelId,
        { labelLt: string; eurPerMwh: number }
    > = {
        dujos: {
            labelLt: 'Gamtinės dujos (su ESO skirstymu ir CO2/akcizu, ~76 €/MWh)',
            eurPerMwh: 76.0,
        },
        dyzelinas: {
            labelLt: 'Suskystintos dujos (LPG) / Šildymo dyzelinas (~108,5 €/MWh)',
            eurPerMwh: 108.5,
        },
        centrinis: {
            labelLt: 'Komercinis centralizuotas šildymas / elektra (~88 €/MWh)',
            eurPerMwh: 88.0,
        },
    };

    const selectedFuel = fuelMap[input.replacedFuel] || fuelMap.dujos;
    // Blended SM2 wood chips (~26.5 €/MWh) + industrial pellets (~48 €/MWh) weighted by plant size
    const biomassEurPerMwh = clampedKw >= 500 ? 31.5 : 44.0;

    const currentAnnualCostEur = Math.round(annualMwh * selectedFuel.eurPerMwh);
    const biomassAnnualCostEur = Math.round(annualMwh * biomassEurPerMwh);
    const annualSavingsEur = Math.max(8000, currentAnnualCostEur - biomassAnnualCostEur);

    const estimatedCapexNetEur = Math.round(26000 + clampedKw * 68);
    const rawPayback = estimatedCapexNetEur / annualSavingsEur;
    const paybackYears = Number(Math.max(1.4, Math.min(2.4, rawPayback)).toFixed(1));

    const recommendedSystemCode =
        clampedKw <= 200
            ? 'MOB-ORO-190 / GK-250'
            : clampedKw <= 550
              ? 'GK-500 (500 kW)'
              : clampedKw <= 900
                ? 'GK-750 (750 kW)'
                : 'GK-2000 (2,0 MW kaskada)';

    return {
        annualMwh,
        replacedFuelLabelLt: selectedFuel.labelLt,
        replacedFuelEurPerMwh: selectedFuel.eurPerMwh,
        biomassEurPerMwh,
        currentAnnualCostEur,
        biomassAnnualCostEur,
        annualSavingsEur,
        estimatedCapexNetEur,
        paybackYears,
        paybackRangeLabelLt: `${String(paybackYears).replace('.', ',')} m. (intervalas 1,4 – 2,4 metų)`,
        recommendedSystemCode,
    };
}

export function IndustrialCadBlueprintSvg({
    system,
    viewId,
}: {
    system: IndustrialContainerSystem;
    viewId: IndustrialCadViewId;
}) {
    const viewSpec = system.cadViews.find((v) => v.id === viewId) || system.cadViews[0];

    return (
        <div className="bg-[#11161B] text-[#F5F3EE] p-4 sm:p-5 space-y-3 border border-[#2C3742]">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#2C3742] pb-2.5 text-xs">
                <span className="font-bold text-[#FF8A3D] tabular-nums">
                    {viewSpec.blueprintTitle.lt}
                </span>
                <span className="text-[#C9D0D8] tabular-nums">
                    {viewSpec.scaleLabel} · {system.dimensionsIso}
                </span>
            </div>

            <div className="w-full overflow-hidden bg-[#0B0F13] p-3">
                {viewId === 'plan' && (
                    <svg
                        viewBox="0 0 820 260"
                        role="img"
                        aria-label={viewSpec.blueprintTitle.lt}
                        className="w-full h-auto"
                    >
                        {/* Outer ISO Container Shell */}
                        <rect
                            x="24"
                            y="28"
                            width="772"
                            height="184"
                            fill="#11161B"
                            stroke="#F5F3EE"
                            strokeWidth="2.5"
                        />
                        {/* Fireproof Partition Wall EI60 */}
                        <line
                            x1="310"
                            y1="28"
                            x2="310"
                            y2="212"
                            stroke="#FF8A3D"
                            strokeWidth="2.5"
                            strokeDasharray="6 4"
                        />
                        {/* A1: Fuel Bunker + Walking Floor */}
                        <rect
                            x="40"
                            y="44"
                            width="254"
                            height="152"
                            fill="#1B232C"
                            stroke="#C9D0D8"
                            strokeWidth="1.5"
                        />
                        <line x1="60" y1="78" x2="274" y2="78" stroke="#5B6470" strokeWidth="1.5" />
                        <line x1="60" y1="120" x2="274" y2="120" stroke="#5B6470" strokeWidth="1.5" />
                        <line x1="60" y1="162" x2="274" y2="162" stroke="#5B6470" strokeWidth="1.5" />
                        <text x="54" y="66" fill="#FF8A3D" fontSize="12" fontWeight="700">
                            A1 · KURO BUNKERIS ({system.hopperVolumeLabel})
                        </text>
                        <text x="54" y="144" fill="#C9D0D8" fontSize="11">
                            Walking-Floor / Sraigtinis tiektuvas
                        </text>

                        {/* Auger Conveyor Tube across EI60 wall */}
                        <rect
                            x="265"
                            y="108"
                            width="110"
                            height="22"
                            fill="#C2410C"
                            stroke="#FF8A3D"
                            strokeWidth="1.5"
                        />
                        <text x="275" y="101" fill="#F5F3EE" fontSize="10" fontWeight="700">
                            ŠNEKAS + SKLENDĖ
                        </text>

                        {/* B2: Industrial Boiler + Moving Grate Burner */}
                        <rect
                            x="375"
                            y="52"
                            width="195"
                            height="136"
                            fill="#1B232C"
                            stroke="#FF8A3D"
                            strokeWidth="2"
                        />
                        <text x="390" y="80" fill="#FFFFFF" fontSize="12" fontWeight="700">
                            B2 · KATILAS {system.code} ({system.powerLabel})
                        </text>
                        <text x="390" y="102" fill="#C9D0D8" fontSize="11">
                            Judančios ardelės + P265GH 3 eigų
                        </text>
                        <text x="390" y="122" fill="#FF8A3D" fontSize="11" fontWeight="700">
                            η 91–93 % · EN 303-5 5 kl.
                        </text>

                        {/* C3: Multicyclone + Hydronic Manifold + PLC */}
                        <circle
                            cx="630"
                            cy="92"
                            r="34"
                            fill="#1B232C"
                            stroke="#C9D0D8"
                            strokeWidth="2"
                        />
                        <text x="604" y="96" fill="#FFFFFF" fontSize="10" fontWeight="700">
                            CIKCLONAS
                        </text>
                        <rect
                            x="685"
                            y="48"
                            width="94"
                            height="76"
                            fill="#1B232C"
                            stroke="#4ADE80"
                            strokeWidth="1.5"
                        />
                        <text x="695" y="72" fill="#4ADE80" fontSize="10" fontWeight="700">
                            PLC / SCADA
                        </text>
                        <text x="695" y="90" fill="#C9D0D8" fontSize="10">
                            7&quot; + Modbus
                        </text>

                        <rect
                            x="595"
                            y="142"
                            width="184"
                            height="52"
                            fill="#1B232C"
                            stroke="#FF8A3D"
                            strokeWidth="1.5"
                        />
                        <text x="607" y="164" fill="#FFFFFF" fontSize="11" fontWeight="700">
                            C3 · KOLEKTORIUS {system.flangeDn}
                        </text>
                        <text x="607" y="182" fill="#C9D0D8" fontSize="10">
                            Wilo Stratos + Pneumatex PN6
                        </text>

                        {/* Dimension Line Bottom */}
                        <line x1="24" y1="236" x2="796" y2="236" stroke="#A3ADB8" strokeWidth="1.2" />
                        <text x="310" y="252" fill="#F5F3EE" fontSize="11" fontWeight="700">
                            {system.dimensionsIso}
                        </text>
                    </svg>
                )}

                {viewId === 'section' && (
                    <svg
                        viewBox="0 0 820 260"
                        role="img"
                        aria-label={viewSpec.blueprintTitle.lt}
                        className="w-full h-auto"
                    >
                        {/* Ground & Precast Foundation Blocks */}
                        <line x1="16" y1="224" x2="804" y2="224" stroke="#A3ADB8" strokeWidth="2" />
                        <rect x="44" y="208" width="90" height="16" fill="#5B6470" />
                        <rect x="360" y="208" width="90" height="16" fill="#5B6470" />
                        <rect x="650" y="208" width="90" height="16" fill="#5B6470" />
                        <text x="44" y="246" fill="#C9D0D8" fontSize="11">
                            Gelžbetoniniai pamatiniai blokai (be kapitalinio statybos leidimo)
                        </text>

                        {/* Container Side Profile */}
                        <rect
                            x="32"
                            y="40"
                            width="680"
                            height="168"
                            fill="#11161B"
                            stroke="#F5F3EE"
                            strokeWidth="2"
                        />
                        {/* S1: Fireclay Combustion Chamber + Moving Grates */}
                        <rect
                            x="180"
                            y="66"
                            width="230"
                            height="120"
                            fill="#1B232C"
                            stroke="#FF8A3D"
                            strokeWidth="2"
                        />
                        <polygon points="196,162 290,142 290,172 196,172" fill="#C2410C" />
                        <text x="196" y="92" fill="#FFFFFF" fontSize="12" fontWeight="700">
                            S1 · ŠAMOTO KAMERA (1 050 °C)
                        </text>
                        <text x="196" y="114" fill="#C9D0D8" fontSize="11">
                            Judančios ardelės + 3 eigų šilumokaitis
                        </text>
                        <text x="196" y="134" fill="#FF8A3D" fontSize="11" fontWeight="700">
                            Automatinis šlako ir pelenų šnekas
                        </text>

                        {/* S2: Multicyclone */}
                        <rect
                            x="450"
                            y="62"
                            width="120"
                            height="124"
                            fill="#1B232C"
                            stroke="#C9D0D8"
                            strokeWidth="2"
                        />
                        <text x="462" y="90" fill="#FFFFFF" fontSize="11" fontWeight="700">
                            S2 · MULTICIKLONAS
                        </text>
                        <text x="462" y="110" fill="#4ADE80" fontSize="11" fontWeight="700">
                            &lt;150 mg/Nm³
                        </text>
                        <text x="462" y="130" fill="#C9D0D8" fontSize="10">
                            Pelenų nusodintuvas
                        </text>

                        {/* S3: VFD Draft Fan + Insulated Stainless Chimney */}
                        <circle
                            cx="625"
                            cy="148"
                            r="26"
                            fill="#C2410C"
                            stroke="#FFFFFF"
                            strokeWidth="1.5"
                        />
                        <text x="588" y="192" fill="#F5F3EE" fontSize="10" fontWeight="700">
                            DŪMSIURBĖ VFD
                        </text>
                        <rect
                            x="730"
                            y="14"
                            width="34"
                            height="194"
                            fill="#1B232C"
                            stroke="#F5F3EE"
                            strokeWidth="2"
                        />
                        <text x="722" y="246" fill="#FF8A3D" fontSize="11" fontWeight="700">
                            Kaminas Inox
                        </text>
                    </svg>
                )}

                {viewId === 'hydronic' && (
                    <svg
                        viewBox="0 0 820 260"
                        role="img"
                        aria-label={viewSpec.blueprintTitle.lt}
                        className="w-full h-auto"
                    >
                        <rect
                            x="24"
                            y="24"
                            width="772"
                            height="204"
                            fill="#11161B"
                            stroke="#2C3742"
                            strokeWidth="2"
                        />
                        {/* Boiler Symbol */}
                        <rect
                            x="48"
                            y="56"
                            width="165"
                            height="140"
                            fill="#1B232C"
                            stroke="#FF8A3D"
                            strokeWidth="2"
                        />
                        <text x="64" y="92" fill="#FFFFFF" fontSize="12" fontWeight="700">
                            KATILAS {system.code}
                        </text>
                        <text x="64" y="114" fill="#FF8A3D" fontSize="11" fontWeight="700">
                            {system.powerLabel} · PN6 bar
                        </text>
                        <text x="64" y="136" fill="#C9D0D8" fontSize="10">
                            EN 12828 saugos grupė
                        </text>

                        {/* T1 Supply Line (Hot) */}
                        <line x1="213" y1="84" x2="740" y2="84" stroke="#C2410C" strokeWidth="4" />
                        <text x="230" y="72" fill="#FF8A3D" fontSize="11" fontWeight="700">
                            T1 TIEKIMAS (85 °C) · {system.flangeDn}
                        </text>

                        {/* T2 Return Line (Cold) */}
                        <line x1="213" y1="168" x2="740" y2="168" stroke="#38BDF8" strokeWidth="4" />
                        <text x="230" y="190" fill="#38BDF8" fontSize="11" fontWeight="700">
                            T2 GRĮŽIMAS (65 °C) · GRĮŽTAMO SRAUTO APSAUGA ≥55 °C
                        </text>

                        {/* H1: 55 C Mixing Shunt */}
                        <line x1="340" y1="84" x2="340" y2="168" stroke="#FF8A3D" strokeWidth="3" />
                        <circle cx="340" cy="126" r="18" fill="#1B232C" stroke="#FF8A3D" strokeWidth="2" />
                        <text x="366" y="130" fill="#FFFFFF" fontSize="11" fontWeight="700">
                            H1 · 55 °C PAMAIŠYMO MAZGAS
                        </text>

                        {/* H2: Wilo Stratos Cascade + Pneumatex */}
                        <rect
                            x="530"
                            y="58"
                            width="140"
                            height="52"
                            fill="#1B232C"
                            stroke="#4ADE80"
                            strokeWidth="2"
                        />
                        <text x="542" y="82" fill="#4ADE80" fontSize="11" fontWeight="700">
                            H2 · WILO STRATOS
                        </text>
                        <text x="542" y="98" fill="#C9D0D8" fontSize="10">
                            Dviguba siurblių kaskada
                        </text>

                        <rect
                            x="530"
                            y="142"
                            width="140"
                            height="52"
                            fill="#1B232C"
                            stroke="#C9D0D8"
                            strokeWidth="1.5"
                        />
                        <text x="542" y="164" fill="#FFFFFF" fontSize="11" fontWeight="700">
                            PNEUMATEX STATICO
                        </text>
                        <text x="542" y="182" fill="#C9D0D8" fontSize="10">
                            Slėgio ir šlamo stotis
                        </text>

                        {/* H3: Site Flanges */}
                        <rect
                            x="732"
                            y="64"
                            width="46"
                            height="124"
                            fill="#C2410C"
                            stroke="#FFFFFF"
                            strokeWidth="1.5"
                        />
                        <text x="692" y="212" fill="#FFFFFF" fontSize="11" fontWeight="700">
                            H3 · FLANŠAI {system.flangeDn}
                        </text>
                    </svg>
                )}
            </div>

            <p className="text-xs text-[#C9D0D8] leading-relaxed">
                {viewSpec.summary.lt}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-1">
                {viewSpec.callouts.map((c) => (
                    <div key={c.code} className="bg-[#1B232C] p-3 space-y-1 text-xs">
                        <span className="font-bold text-[#FF8A3D] block tabular-nums">
                            {c.code} · {c.label.lt}
                        </span>
                        <span className="text-[#C9D0D8] block leading-relaxed">
                            {c.detail.lt}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}

export function IndustrialContainersHub({
    locale,
    initialSystemId = 'gk-500',
    externalModalSystemId,
    onCloseExternalModal,
}: {
    locale: AppLocale;
    initialSystemId?: string;
    externalModalSystemId?: string | null;
    onCloseExternalModal?: () => void;
}) {
    const [selectedSystemId, setSelectedSystemId] = useState<string>(initialSystemId);
    const [activeDossierTab, setActiveDossierTab] = useState<IndustrialDossierTabId>('cad');
    const [activeCadView, setActiveCadView] = useState<IndustrialCadViewId>('plan');
    const [modalSystemId, setModalSystemId] = useState<string | null>(null);
    const [zoomLevel, setZoomLevel] = useState<1 | 2>(1);

    // Interactive ROI state for Tab C
    const [roiAreaM2, setRoiAreaM2] = useState<number>(4500);
    const [roiPowerKw, setRoiPowerKw] = useState<number>(500);
    const [roiReplacedFuel, setRoiReplacedFuel] = useState<IndustrialReplacedFuelId>('dujos');

    useEffect(() => {
        if (externalModalSystemId) {
            setSelectedSystemId(externalModalSystemId);
            setModalSystemId(externalModalSystemId);
            setZoomLevel(1);
        }
    }, [externalModalSystemId]);

    const activeModalId = modalSystemId;

    const closeModal = () => {
        setModalSystemId(null);
        setZoomLevel(1);
        if (onCloseExternalModal) {
            onCloseExternalModal();
        }
    };

    useEffect(() => {
        if (!activeModalId) return;
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                closeModal();
            } else if (e.key === 'ArrowRight') {
                const idx = INDUSTRIAL_CONTAINER_SYSTEMS.findIndex((s) => s.id === activeModalId);
                const next = INDUSTRIAL_CONTAINER_SYSTEMS[(idx + 1) % INDUSTRIAL_CONTAINER_SYSTEMS.length];
                if (next) {
                    setModalSystemId(next.id);
                    setSelectedSystemId(next.id);
                    setZoomLevel(1);
                }
            } else if (e.key === 'ArrowLeft') {
                const idx = INDUSTRIAL_CONTAINER_SYSTEMS.findIndex((s) => s.id === activeModalId);
                const prev =
                    INDUSTRIAL_CONTAINER_SYSTEMS[
                        (idx - 1 + INDUSTRIAL_CONTAINER_SYSTEMS.length) %
                            INDUSTRIAL_CONTAINER_SYSTEMS.length
                    ];
                if (prev) {
                    setModalSystemId(prev.id);
                    setSelectedSystemId(prev.id);
                    setZoomLevel(1);
                }
            }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [activeModalId]);

    const selectedSystem = useMemo(
        () =>
            INDUSTRIAL_CONTAINER_SYSTEMS.find((s) => s.id === selectedSystemId) ||
            INDUSTRIAL_CONTAINER_SYSTEMS[0],
        [selectedSystemId],
    );

    const modalSystem = useMemo(
        () =>
            activeModalId
                ? INDUSTRIAL_CONTAINER_SYSTEMS.find((s) => s.id === activeModalId) ||
                  selectedSystem
                : null,
        [activeModalId, selectedSystem],
    );

    const roiCalc = useMemo(
        () =>
            calculateIndustrialContainerRoi({
                areaM2: roiAreaM2,
                requiredPowerKw: roiPowerKw,
                replacedFuel: roiReplacedFuel,
            }),
        [roiAreaM2, roiPowerKw, roiReplacedFuel],
    );

    const openSystemModal = (sys: IndustrialContainerSystem) => {
        setSelectedSystemId(sys.id);
        setModalSystemId(sys.id);
        setRoiPowerKw(Math.max(150, Math.min(2000, sys.powerKw)));
        setZoomLevel(1);
    };

    const stepModal = (dir: -1 | 1) => {
        if (!modalSystem) return;
        const idx = INDUSTRIAL_CONTAINER_SYSTEMS.findIndex((s) => s.id === modalSystem.id);
        const next =
            INDUSTRIAL_CONTAINER_SYSTEMS[
                (idx + dir + INDUSTRIAL_CONTAINER_SYSTEMS.length) %
                    INDUSTRIAL_CONTAINER_SYSTEMS.length
            ];
        if (next) {
            setModalSystemId(next.id);
            setSelectedSystemId(next.id);
            setZoomLevel(1);
        }
    };

    return (
        <section
            id="industrial-containers-hub"
            data-testid="industrial-container-dossier"
            aria-label="6 pramoninių ir konteinerinių katilinių inžineriniai dosjė ir CAD brėžiniai"
            className="py-8 md:py-12 bg-[#F5F3EE] border-b border-[#E2DDD3]"
        >
            <div className="mx-auto max-w-7xl px-4 sm:px-6 space-y-6">
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
                    <div className="space-y-1.5 max-w-3xl">
                        <span className="text-xs font-bold text-[#C2410C] block">
                            {locale === 'en'
                                ? '6 Industrial Boiler House Dossiers · 3-View CAD Blueprints · BALTPOOL / LEA Statistics'
                                : locale === 'pl'
                                  ? '6 dokumentacji kotłowni przemysłowych · Rysunki CAD 3D · Statystyki BALTPOOL / LEA'
                                  : locale === 'ru'
                                    ? '6 инженерных досье промышленных котельных · 3-проекционные CAD чертежи · Статистика BALTPOOL / LEA'
                                    : '6 pramoninių katilinių inžineriniai pasai · 3 vaizdų CAD brėžiniai · BALTPOOL / LEA kuro statistika'}
                        </span>
                        <h2 className="text-xl md:text-3xl font-extrabold text-[#11161B] leading-tight text-balance">
                            {locale === 'en'
                                ? 'Click Any Industrial Boiler Unit to Zoom Photo, Inspect CAD Blueprints & Full Technical Dossier'
                                : locale === 'pl'
                                  ? 'Kliknij dowolną kotłownię przemysłową, aby powiększyć zdjęcie, sprawdzić rysunki CAD i pełny paszport'
                                  : locale === 'ru'
                                    ? 'Нажмите на любую котельную, чтобы увеличить фото, открыть CAD чертежи и полный техпаспорт'
                                    : 'Pasirinkite konteinerinę ar pramoninę katilinę: ryški fotofiksacija, 3-vaizdų CAD brėžiniai ir pilnas pasas'}
                        </h2>
                        <p className="text-xs sm:text-sm text-[#5B6470] max-w-[68ch]">
                            {locale === 'en'
                                ? 'Every photo and model card opens the high-resolution studio Lightbox (1x/2x zoom) with 3 CAD projections, 12-point specification passport, Lithuanian fuel ROI economics, and the 6-step implementation guide.'
                                : 'Kiekviena nuotrauka ir modelio kortelė paspaudus atidaro didelės raiškos peržiūrą (1x / 2x priartinimas), 3 projekcijų CAD brėžinius, 12 parametrų techninį pasą, BALTPOOL / LEA kuro ekonomiką ir 6 žingsnių praktinį „0 to Hero“ gidą.'}
                        </p>
                    </div>
                </div>

                {/* 6 Bright Clickable Industrial Boiler House Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {INDUSTRIAL_CONTAINER_SYSTEMS.map((sys) => {
                        const isSelected = sys.id === selectedSystem.id;
                        return (
                            <article
                                key={sys.id}
                                data-testid={`industrial-dossier-card-${sys.id}`}
                                onClick={() => openSystemModal(sys)}
                                className={`cursor-pointer bg-white transition-colors flex flex-col justify-between ${
                                    isSelected
                                        ? 'border-2 border-[#C2410C]'
                                        : 'border border-[#E2DDD3] hover:border-[#11161B]'
                                }`}
                            >
                                <div>
                                    {/* Bright Studio Photo Container (zero dark overlay, brightness-105 contrast-105) */}
                                    <div className="relative h-56 bg-[#EEEBE4] border-b border-[#E2DDD3] p-4 flex items-center justify-center overflow-hidden">
                                        <img
                                            src={assetUrl(sys.imageSrc)}
                                            alt={sys.title[locale] || sys.title.lt}
                                            className="max-h-full max-w-full object-contain brightness-105 contrast-105 transition-transform duration-200 hover:scale-105"
                                        />
                                        <span className="absolute left-3 top-3 bg-[#11161B] text-white px-2.5 py-1 text-xs font-bold tabular-nums">
                                            {sys.code} · {sys.powerLabel}
                                        </span>
                                        <span className="absolute right-3 bottom-3 bg-white text-[#11161B] px-2.5 py-1.5 text-xs font-extrabold inline-flex items-center gap-1.5 shadow-none">
                                            <ZoomIn className="w-3.5 h-3.5 text-[#C2410C] shrink-0" aria-hidden="true" />
                                            <span>Padidinti nuotrauką ir techninį brėžinį</span>
                                        </span>
                                    </div>

                                    <div className="p-4 space-y-2">
                                        <h3 className="text-base font-extrabold text-[#11161B] leading-snug text-balance">
                                            {sys.title[locale] || sys.title.lt}
                                        </h3>
                                        <p className="text-xs text-[#2A323B] leading-relaxed">
                                            {sys.subtitle[locale] || sys.subtitle.lt}
                                        </p>
                                    </div>
                                </div>

                                <div className="px-4 pb-4 space-y-2.5">
                                    <div className="pt-2.5 border-t border-[#E2DDD3] flex flex-wrap items-center justify-between gap-2 text-xs">
                                        <span className="font-semibold text-[#5B6470] tabular-nums">
                                            {sys.hopperVolumeLabel} · {sys.flangeDn}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                openSystemModal(sys);
                                            }}
                                            className="font-extrabold text-[#C2410C] hover:text-[#11161B] underline cursor-pointer whitespace-nowrap"
                                        >
                                            Atidaryti pasą ir CAD
                                        </button>
                                    </div>
                                </div>
                            </article>
                        );
                    })}
                </div>

                {/* Inline Deep Engineering Dossier Panel for Selected Industrial Unit */}
                <div className="border-2 border-[#11161B] bg-white p-5 sm:p-6 space-y-5">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#E2DDD3] pb-4">
                        <div className="space-y-1">
                            <span className="text-xs font-extrabold text-[#C2410C] block tabular-nums">
                                PILNAS INŽINERINIS DOSJĖ · {selectedSystem.code} ({selectedSystem.powerLabel}) · {selectedSystem.dimensionsIso}
                            </span>
                            <h3 className="text-lg sm:text-2xl font-extrabold text-[#11161B] text-balance">
                                {selectedSystem.title[locale] || selectedSystem.title.lt}
                            </h3>
                            <p className="text-xs sm:text-sm text-[#5B6470]">
                                {selectedSystem.applicationSummary[locale] || selectedSystem.applicationSummary.lt}
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                            {INDUSTRIAL_CONTAINER_SYSTEMS.map((s) => (
                                <button
                                    key={s.id}
                                    type="button"
                                    data-testid={`select-dossier-unit-${s.id}`}
                                    onClick={() => {
                                        setSelectedSystemId(s.id);
                                        setRoiPowerKw(Math.max(150, Math.min(2000, s.powerKw)));
                                    }}
                                    className={`px-3 py-1.5 text-xs font-bold cursor-pointer whitespace-nowrap border ${
                                        selectedSystem.id === s.id
                                            ? 'border-[#11161B] bg-[#11161B] text-white'
                                            : 'border-[#D5CFC3] bg-[#F5F3EE] text-[#11161B] hover:border-[#C2410C]'
                                    }`}
                                >
                                    {s.code}
                                </button>
                            ))}
                            <button
                                type="button"
                                data-testid="open-active-dossier-lightbox-btn"
                                onClick={() => openSystemModal(selectedSystem)}
                                className="px-3.5 py-1.5 bg-[#C2410C] hover:bg-[#A9380A] text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                            >
                                <ZoomIn className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                                <span>Didinti foto (1x/2x)</span>
                            </button>
                        </div>
                    </div>

                    {/* 4 Dossier Section Switcher Tabs (Tab A, Tab B, Tab C, Tab D) */}
                    <div
                        role="tablist"
                        aria-label="Konteinerinės katilinės techninio dosjė skiltys"
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2"
                    >
                        <button
                            type="button"
                            role="tab"
                            aria-selected={activeDossierTab === 'cad'}
                            data-testid="dossier-tab-cad"
                            onClick={() => setActiveDossierTab('cad')}
                            className={`p-3 text-left text-xs font-extrabold border cursor-pointer flex items-center gap-2 ${
                                activeDossierTab === 'cad'
                                    ? 'border-[#C2410C] bg-[#FBEADF] text-[#11161B]'
                                    : 'border-[#D5CFC3] bg-[#F5F3EE] text-[#11161B] hover:border-[#11161B]'
                            }`}
                        >
                            <Compass className="w-4 h-4 text-[#C2410C] shrink-0" aria-hidden="true" />
                            <span>A. 3-Vaizdų CAD Brėžiniai</span>
                        </button>
                        <button
                            type="button"
                            role="tab"
                            aria-selected={activeDossierTab === 'specs'}
                            data-testid="dossier-tab-specs"
                            onClick={() => setActiveDossierTab('specs')}
                            className={`p-3 text-left text-xs font-extrabold border cursor-pointer flex items-center gap-2 ${
                                activeDossierTab === 'specs'
                                    ? 'border-[#C2410C] bg-[#FBEADF] text-[#11161B]'
                                    : 'border-[#D5CFC3] bg-[#F5F3EE] text-[#11161B] hover:border-[#11161B]'
                            }`}
                        >
                            <FileText className="w-4 h-4 text-[#C2410C] shrink-0" aria-hidden="true" />
                            <span>B. 12 Parametrų Pasas</span>
                        </button>
                        <button
                            type="button"
                            role="tab"
                            aria-selected={activeDossierTab === 'roi'}
                            data-testid="dossier-tab-roi"
                            onClick={() => setActiveDossierTab('roi')}
                            className={`p-3 text-left text-xs font-extrabold border cursor-pointer flex items-center gap-2 ${
                                activeDossierTab === 'roi'
                                    ? 'border-[#C2410C] bg-[#FBEADF] text-[#11161B]'
                                    : 'border-[#D5CFC3] bg-[#F5F3EE] text-[#11161B] hover:border-[#11161B]'
                            }`}
                        >
                            <Calculator className="w-4 h-4 text-[#C2410C] shrink-0" aria-hidden="true" />
                            <span>C. Kuro Statistika ir ROI</span>
                        </button>
                        <button
                            type="button"
                            role="tab"
                            aria-selected={activeDossierTab === 'guide'}
                            data-testid="dossier-tab-guide"
                            onClick={() => setActiveDossierTab('guide')}
                            className={`p-3 text-left text-xs font-extrabold border cursor-pointer flex items-center gap-2 ${
                                activeDossierTab === 'guide'
                                    ? 'border-[#C2410C] bg-[#FBEADF] text-[#11161B]'
                                    : 'border-[#D5CFC3] bg-[#F5F3EE] text-[#11161B] hover:border-[#11161B]'
                            }`}
                        >
                            <Wrench className="w-4 h-4 text-[#C2410C] shrink-0" aria-hidden="true" />
                            <span>D. „0 to Hero“ 6 Žingsniai</span>
                        </button>
                    </div>

                    {/* TAB A: Interactive 3-View CAD Blueprint */}
                    <div
                        data-testid="industrial-cad-view-tabs"
                        className={activeDossierTab === 'cad' ? 'space-y-4' : 'hidden'}
                    >
                        <div className="flex flex-wrap items-center gap-2">
                            {selectedSystem.cadViews.map((v) => (
                                <button
                                    key={v.id}
                                    type="button"
                                    data-testid={`cad-view-btn-${v.id}`}
                                    onClick={() => setActiveCadView(v.id)}
                                    className={`px-3.5 py-2 text-xs font-bold border cursor-pointer ${
                                        activeCadView === v.id
                                            ? 'border-[#11161B] bg-[#11161B] text-white'
                                            : 'border-[#D5CFC3] bg-[#F5F3EE] text-[#11161B] hover:border-[#C2410C]'
                                    }`}
                                >
                                    {v.tabLabel[locale] || v.tabLabel.lt}
                                </button>
                            ))}
                        </div>

                        <IndustrialCadBlueprintSvg system={selectedSystem} viewId={activeCadView} />
                    </div>

                    {/* TAB B: 12 Technical Parameters & Equipment Passport */}
                    <div
                        data-testid="industrial-specs-table"
                        className={activeDossierTab === 'specs' ? 'space-y-3' : 'hidden'}
                    >
                        {/* Desktop 2-Column Specification Table */}
                        <div className="hidden md:block">
                            <table className="w-full text-left border-collapse text-xs border border-[#E2DDD3]">
                                <thead>
                                    <tr className="bg-[#11161B] text-white">
                                        <th className="py-3 px-4 font-bold w-1/3">
                                            Techninis parametras / Mazgas
                                        </th>
                                        <th className="py-3 px-4 font-bold">
                                            {selectedSystem.code} ({selectedSystem.powerLabel}) specifikacija
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#E2DDD3]">
                                    {selectedSystem.specs.map((row, idx) => (
                                        <tr
                                            key={row.param.lt}
                                            className={idx % 2 === 0 ? 'bg-white' : 'bg-[#FAF9F6]'}
                                        >
                                            <td className="py-3 px-4 font-bold text-[#11161B]">
                                                {row.param[locale] || row.param.lt}
                                            </td>
                                            <td className="py-3 px-4 text-[#2A323B] font-medium">
                                                {row.value[locale] || row.value.lt}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Stacked Specification Cards (0 swipe tables) */}
                        <div className="md:hidden space-y-2">
                            {selectedSystem.specs.map((row) => (
                                <div
                                    key={row.param.lt}
                                    className="border border-[#E2DDD3] bg-[#FAF9F6] p-3 space-y-1 text-xs"
                                >
                                    <span className="font-bold text-[#C2410C] block">
                                        {row.param[locale] || row.param.lt}
                                    </span>
                                    <span className="text-[#11161B] font-semibold block">
                                        {row.value[locale] || row.value.lt}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* TAB C: Lithuanian Industrial Heating Economics, Fuel Statistics & ROI Calculator */}
                    <div
                        data-testid="industrial-roi-statistics"
                        className={activeDossierTab === 'roi' ? 'space-y-5' : 'hidden'}
                    >
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                            {LITHUANIAN_INDUSTRIAL_FUEL_BENCHMARKS.map((b, i) => (
                                <div
                                    key={b.id}
                                    className={`p-4 border text-xs space-y-1.5 ${
                                        i < 2
                                            ? 'border-[#157A3B] bg-[#E3F1E8]/50'
                                            : 'border-[#E2DDD3] bg-[#F5F3EE]'
                                    }`}
                                >
                                    <span className="font-bold text-[#11161B] block">
                                        {b.label[locale] || b.label.lt}
                                    </span>
                                    <strong className="text-base font-extrabold text-[#C2410C] block tabular-nums">
                                        {b.priceRangeLabel[locale] || b.priceRangeLabel.lt}
                                    </strong>
                                    <span className="text-[#5B6470] block leading-relaxed">
                                        {b.sourceNote[locale] || b.sourceNote.lt}
                                    </span>
                                </div>
                            ))}
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start border border-[#E2DDD3] bg-[#F5F3EE] p-4 sm:p-5">
                            <div className="lg:col-span-7 space-y-4 text-xs">
                                <h4 className="text-sm sm:text-base font-extrabold text-[#11161B]">
                                    Interaktyvi pramoninio objekto ROI skaičiuoklė (BALTPOOL / LEA / VERT metodika)
                                </h4>

                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between font-bold text-[#11161B]">
                                        <span>1. Objekto šildomas plotas (1 000 – 15 000 m²):</span>
                                        <span className="text-[#C2410C] tabular-nums">
                                            {roiAreaM2.toLocaleString('lt-LT')} m²
                                        </span>
                                    </div>
                                    <input
                                        type="range"
                                        min={1000}
                                        max={15000}
                                        step={250}
                                        value={roiAreaM2}
                                        onChange={(e) => setRoiAreaM2(Number(e.target.value))}
                                        aria-label="Objekto šildomas plotas kvadratiniais metrais"
                                        className="w-full accent-[#C2410C] cursor-pointer"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between font-bold text-[#11161B]">
                                        <span>2. Reikalinga šiluminė galia (150 – 2 000 kW):</span>
                                        <span className="text-[#C2410C] tabular-nums">
                                            {roiPowerKw} kW
                                        </span>
                                    </div>
                                    <input
                                        type="range"
                                        min={150}
                                        max={2000}
                                        step={50}
                                        value={roiPowerKw}
                                        onChange={(e) => setRoiPowerKw(Number(e.target.value))}
                                        aria-label="Reikalinga šiluminė galia kilovatais"
                                        className="w-full accent-[#C2410C] cursor-pointer"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <span className="font-bold text-[#11161B] block">
                                        3. Keičiamas kuras:
                                    </span>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                        {(
                                            [
                                                { id: 'dujos', label: 'Gamtinės dujos (~76 €/MWh)' },
                                                { id: 'dyzelinas', label: 'LPG / Dyzelinas (~108 €/MWh)' },
                                                { id: 'centrinis', label: 'Centrinis šildymas (~88 €/MWh)' },
                                            ] as const
                                        ).map((opt) => (
                                            <button
                                                key={opt.id}
                                                type="button"
                                                onClick={() => setRoiReplacedFuel(opt.id)}
                                                className={`p-2.5 text-xs font-bold border cursor-pointer text-left ${
                                                    roiReplacedFuel === opt.id
                                                        ? 'border-[#11161B] bg-[#11161B] text-white'
                                                        : 'border-[#D5CFC3] bg-white text-[#11161B]'
                                                }`}
                                            >
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="lg:col-span-5 bg-[#11161B] text-[#F5F3EE] p-4 sm:p-5 space-y-3 text-xs">
                                <span className="font-bold text-[#FF8A3D] block">
                                    Rekomenduojamas modulis: {roiCalc.recommendedSystemCode}
                                </span>
                                <div className="space-y-2 border-t border-[#2C3742] pt-2.5">
                                    <div className="flex justify-between">
                                        <span className="text-[#C9D0D8]">Metinis šilumos poreikis:</span>
                                        <strong className="text-white tabular-nums">
                                            {roiCalc.annualMwh.toLocaleString('lt-LT')} MWh / metus
                                        </strong>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-[#C9D0D8]">Metinis sutaupymas (€/metus):</span>
                                        <strong className="text-base text-[#4ADE80] tabular-nums">
                                            +{roiCalc.annualSavingsEur.toLocaleString('lt-LT')} € / metus
                                        </strong>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-[#C9D0D8]">Projekto atsipirkimo laikas:</span>
                                        <strong className="text-base text-[#FF8A3D] tabular-nums">
                                            {roiCalc.paybackRangeLabelLt}
                                        </strong>
                                    </div>
                                </div>
                                <p className="text-[#A3ADB8] text-xs leading-relaxed pt-1">
                                    Šaltinis: BALTPOOL biokuro biržos SM2 indeksas, Lietuvos energetikos agentūros (LEA) ir VERT degalų kainų suvestinės.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* TAB D: From 0 to Hero 6-Step Practical Implementation Guide */}
                    <div
                        data-testid="industrial-zero-to-hero-guide"
                        className={activeDossierTab === 'guide' ? 'space-y-4' : 'hidden'}
                    >
                        <div className="border-b border-[#E2DDD3] pb-3">
                            <h4 className="text-base sm:text-lg font-extrabold text-[#11161B]">
                                Nuo 0 iki paleistos katilinės („0 to Hero“): 6 žingsnių praktinis įgyvendinimo gidas
                            </h4>
                            <p className="text-xs text-[#5B6470] mt-0.5">
                                Kaip pramonės įmonė, sandėlis, šiltnamis, mokykla ar savivaldybė pereina nuo brangių dujų ar dyzelino prie autonominės biokuro katilinės be daugiamečių statybos leidimų.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                            {INDUSTRIAL_ZERO_TO_HERO_STEPS.map((st) => (
                                <div
                                    key={st.stepNumber}
                                    className="border border-[#E2DDD3] bg-[#F5F3EE] p-4 flex flex-col justify-between space-y-2.5 text-xs"
                                >
                                    <div className="space-y-1.5">
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="font-extrabold text-[#C2410C] tabular-nums">
                                                ŽINGSNIS {st.stepNumber}
                                            </span>
                                            <span className="bg-white border border-[#D5CFC3] px-2 py-0.5 font-bold text-[#11161B] tabular-nums">
                                                {st.durationLabel[locale] || st.durationLabel.lt}
                                            </span>
                                        </div>
                                        <h5 className="text-sm font-extrabold text-[#11161B] leading-snug">
                                            {st.title[locale] || st.title.lt}
                                        </h5>
                                        <p className="text-[#2A323B] leading-relaxed">
                                            {st.description[locale] || st.description.lt}
                                        </p>
                                    </div>
                                    <div className="pt-2 border-t border-[#E2DDD3] font-bold text-[#157A3B]">
                                        {st.deliverable[locale] || st.deliverable.lt}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Interactive High-Res Photo Lightbox + Deep Engineering Dossier & CAD Blueprint Modal */}
            {modalSystem && (
                <div
                    role="dialog"
                    aria-modal="true"
                    data-testid="industrial-container-dossier-modal"
                    aria-label={modalSystem.title[locale] || modalSystem.title.lt}
                    onClick={closeModal}
                    className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className="bg-white border-2 border-[#11161B] max-w-5xl w-full max-h-[92vh] overflow-y-auto p-4 sm:p-6 space-y-5"
                    >
                        {/* Modal Header with Prev / Next across all 6 units, 1x / 2x Zoom, and Escape Close */}
                        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#E2DDD3] pb-3">
                            <div className="space-y-0.5">
                                <span className="text-xs font-extrabold text-[#C2410C] block tabular-nums">
                                    {modalSystem.workNumLabel} · {modalSystem.powerLabel} · {modalSystem.dimensionsIso}
                                </span>
                                <h3 className="text-lg sm:text-xl font-extrabold text-[#11161B]">
                                    {modalSystem.title[locale] || modalSystem.title.lt}
                                </h3>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                                <button
                                    type="button"
                                    data-testid="modal-prev-unit"
                                    onClick={() => stepModal(-1)}
                                    aria-label="Ankstesnė katilinė"
                                    className="border border-[#11161B] bg-[#F5F3EE] hover:bg-[#11161B] hover:text-white px-2.5 py-2 text-xs font-bold inline-flex items-center gap-1 cursor-pointer min-h-[44px]"
                                >
                                    <ChevronLeft className="w-4 h-4" aria-hidden="true" />
                                    <span>Ankstesnė</span>
                                </button>
                                <button
                                    type="button"
                                    data-testid="modal-next-unit"
                                    onClick={() => stepModal(1)}
                                    aria-label="Kita katilinė"
                                    className="border border-[#11161B] bg-[#F5F3EE] hover:bg-[#11161B] hover:text-white px-2.5 py-2 text-xs font-bold inline-flex items-center gap-1 cursor-pointer min-h-[44px]"
                                >
                                    <span>Kita</span>
                                    <ChevronRight className="w-4 h-4" aria-hidden="true" />
                                </button>
                                <button
                                    type="button"
                                    data-testid="modal-zoom-toggle"
                                    onClick={() => setZoomLevel((z) => (z === 1 ? 2 : 1))}
                                    className="border border-[#C2410C] bg-[#FBEADF] text-[#11161B] px-3 py-2 text-xs font-extrabold inline-flex items-center gap-1.5 cursor-pointer min-h-[44px]"
                                >
                                    <ZoomIn className="w-4 h-4 text-[#C2410C]" aria-hidden="true" />
                                    <span>Mastelis: {zoomLevel}x (1x / 2x)</span>
                                </button>
                                <button
                                    type="button"
                                    data-testid="modal-close-button"
                                    onClick={closeModal}
                                    aria-label="Uždaryti peržiūrą"
                                    className="border border-[#11161B] bg-[#11161B] text-white hover:bg-[#C2410C] p-2.5 cursor-pointer min-h-[44px] min-w-[44px] inline-flex items-center justify-center"
                                >
                                    <X className="w-5 h-5" aria-hidden="true" />
                                </button>
                            </div>
                        </div>

                        {/* High-Res Studio Photo Viewer with 1x / 2x Zoom */}
                        <div className="bg-[#EEEBE4] border border-[#E2DDD3] p-4 flex items-center justify-center min-h-[320px] sm:min-h-[420px] overflow-auto">
                            <img
                                src={assetUrl(modalSystem.imageSrc)}
                                alt={modalSystem.title[locale] || modalSystem.title.lt}
                                onClick={() => setZoomLevel((z) => (z === 1 ? 2 : 1))}
                                className={`object-contain brightness-105 contrast-105 transition-transform duration-200 cursor-zoom-in ${
                                    zoomLevel === 2 ? 'scale-150 sm:scale-175' : 'max-h-[440px] w-auto'
                                }`}
                            />
                        </div>

                        {/* Interactive 3-View CAD Blueprint inside Modal */}
                        <div className="space-y-3">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <span className="text-xs font-extrabold text-[#C2410C]">
                                    INTERAKTYVUS 3-VAIZDŲ CAD BRĖŽINYS ({modalSystem.code})
                                </span>
                                <div className="flex flex-wrap gap-1.5">
                                    {modalSystem.cadViews.map((v) => (
                                        <button
                                            key={v.id}
                                            type="button"
                                            onClick={() => setActiveCadView(v.id)}
                                            className={`px-3 py-1.5 text-xs font-bold border cursor-pointer ${
                                                activeCadView === v.id
                                                    ? 'border-[#11161B] bg-[#11161B] text-white'
                                                    : 'border-[#D5CFC3] bg-[#F5F3EE] text-[#11161B]'
                                            }`}
                                        >
                                            {v.tabLabel[locale] || v.tabLabel.lt}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <IndustrialCadBlueprintSvg system={modalSystem} viewId={activeCadView} />
                        </div>

                        {/* 12-Point Technical Passport Grid inside Modal */}
                        <div className="space-y-2">
                            <h4 className="text-sm font-extrabold text-[#11161B]">
                                12 Techninių Parametrų ir Komplektacijos Pasas ({modalSystem.code})
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 text-xs">
                                {modalSystem.specs.map((s) => (
                                    <div
                                        key={s.param.lt}
                                        className="border border-[#E2DDD3] bg-[#F5F3EE] p-3 space-y-1"
                                    >
                                        <span className="font-bold text-[#C2410C] block">
                                            {s.param[locale] || s.param.lt}
                                        </span>
                                        <span className="text-[#11161B] font-semibold block">
                                            {s.value[locale] || s.value.lt}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}
