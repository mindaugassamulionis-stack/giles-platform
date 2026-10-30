'use client';

import React, { useState } from 'react';
import type { AppLocale } from '../../i18n/routing';
import type { IndustrialModel } from '../../lib/pramonei-v2/types';
import { formatInt } from '../../lib/pramonei-v2/format';

type DrawingViewId = 'plan' | 'section' | 'pid';

const DRAWINGS_I18N: Record<
    AppLocale,
    {
        heading: string;
        lead: string;
        statusBadge: (rev: string) => string;
        downloadBtn: string;
        tablistAria: string;
        tabs: Record<DrawingViewId, { label: string; subSingle: string; subDual: string }>;
        metas: Record<DrawingViewId, { titleSingle: string; titleDual: string; sub: string }>;
        svgAria: Record<DrawingViewId, string>;
        legend: {
            supply: string;
            returnLine: string;
            flue: string;
            firewall: string;
            behindSection: string;
            control: string;
        };
        positionsTitle: string;
        techSpecsTitle: string;
        ctaForModel: (code: string) => string;
        onRequestTitle: string;
        onRequestText: string;
        onRequestCta: string;
        chimneyCalc: string;
        noScalePid: string;
        plantHeatExchanger: string;
        intoBoiler: string;
        titleBlockPlan: string;
        titleBlockSection: string;
        titleBlockPid: string;
        module1: string;
        module2: string;
    }
> = {
    lt: {
        heading: 'Kaip sukomplektuota katilinė',
        lead: 'Trys principinės schemos: planas, pjūvis su dūmų traktu ir hidraulika. Spauskite poziciją sąraše – ji pažymima brėžinyje.',
        statusBadge: (rev) => `Principinė schema · Rev ${rev}`,
        downloadBtn: 'Užklausti PDF / DWG',
        tablistAria: 'Brėžinio vaizdas',
        tabs: {
            plan: {
                label: 'Planas',
                subSingle: 'ISO 20ft HC, mastelis',
                subDual: '2 × 40ft HC, mastelis',
            },
            section: {
                label: 'Pjūvis A–A ir dūmų traktas',
                subSingle: 'Nuo kuro iki kamino',
                subDual: 'Nuo kuro iki kamino',
            },
            pid: {
                label: 'Hidraulinė schema',
                subSingle: 'Prijungimas prie objekto',
                subDual: 'Prijungimas prie objekto',
            },
        },
        metas: {
            plan: {
                titleSingle: 'Planas · 20ft HC konteinerinis modulis',
                titleDual: 'Planas · du 40ft HC moduliai šalia',
                sub: 'Gabaritai pagal ISO konteinerių standartą. Vidaus išdėstymas – principinis.',
            },
            section: {
                titleSingle: 'Pjūvis A–A ir dūmų traktas',
                titleDual: 'Pjūvis A–A ir dūmų traktas',
                sub: 'Pjūvis per pagrindinį modulį. Punktyru – įranga už pjūvio plokštumos.',
            },
            pid: {
                titleSingle: 'Hidraulinė ir prijungimo schema',
                titleDual: 'Hidraulinė ir prijungimo schema',
                sub: 'Principinė, be mastelio.',
            },
        },
        svgAria: {
            plan: 'Planas: kuro sandėlis, priešgaisrinė pertvara, katilas, dūmų valymas, kaminas ir hidraulinis mazgas',
            section:
                'Pjūvis A–A: kuro sandėlis, priešgaisrinė pertvara, sraigtas, pakura su judančiomis ardelėmis, trijų eigų šilumokaitis, dūmų valymas ir kaminas',
            pid: 'Hidraulinė schema: katilas, antikondensacinis mazgas, hidraulinis kolektorius, dviguba siurblių grupė, plėtimosi indas, purvo separatorius ir prijungimo flanšai',
        },
        legend: {
            supply: 'Tiekimas',
            returnLine: 'Grąžinimas',
            flue: 'Dūmai',
            firewall: 'Priešgaisrinė pertvara',
            behindSection: 'Už pjūvio plokštumos',
            control: 'Valdymas',
        },
        positionsTitle: 'Pozicijos šiame vaizde',
        techSpecsTitle: 'Techniniai duomenys',
        ctaForModel: (code) => `Gauti pasiūlymą ${code}`,
        onRequestTitle: 'Brėžiniai pagal užklausą',
        onRequestText:
            'Šio modelio DWG / PDF išplanavimo ir hidraulinio prijungimo brėžinius parengiame pagal jūsų objekto galios, kuro ir katilinės aikštelės sąlygas.',
        onRequestCta: 'Užklausti šio modelio brėžinių',
        chimneyCalc: 'H pagal sklaidos skaičiavimą',
        noScalePid: 'Schema be mastelio · supaprastinti P&ID simboliai',
        plantHeatExchanger: 'Objektas / plokštelinis šilumokaitis',
        intoBoiler: '≥ 55 °C į katilą',
        titleBlockPlan: 'Planas · principinė schema · mm',
        titleBlockSection: 'Pjūvis A–A · principinė schema',
        titleBlockPid: 'Hidraulinė schema',
        module1: 'MODULIS 1 · 40ft HC',
        module2: 'MODULIS 2 · 40ft HC',
    },
    en: {
        heading: 'How the Boiler Plant Is Configured',
        lead: 'Three schematic views: plan layout, section A–A with flue gas path, and P&ID hydronics. Click any item in the list to highlight it in the drawing.',
        statusBadge: (rev) => `Schematic · Rev ${rev}`,
        downloadBtn: 'Request PDF / DWG',
        tablistAria: 'Schematic view',
        tabs: {
            plan: {
                label: 'Plan View',
                subSingle: 'ISO 20ft HC, to scale',
                subDual: '2 × 40ft HC, to scale',
            },
            section: {
                label: 'Section A–A & Flue Path',
                subSingle: 'From bunker to chimney',
                subDual: 'From bunker to chimney',
            },
            pid: {
                label: 'Hydronic P&ID',
                subSingle: 'Site connection manifold',
                subDual: 'Site connection manifold',
            },
        },
        metas: {
            plan: {
                titleSingle: 'Plan View · 20ft HC Container Module',
                titleDual: 'Plan View · Twin 40ft HC Modules Side-by-Side',
                sub: 'Dimensions per ISO container standard. Internal arrangement is schematic.',
            },
            section: {
                titleSingle: 'Section A–A & Flue Gas Path',
                titleDual: 'Section A–A & Flue Gas Path',
                sub: 'Longitudinal section through Module 1. Dashed lines denote equipment behind section plane.',
            },
            pid: {
                titleSingle: 'Hydronic & Connection Schematic',
                titleDual: 'Hydronic & Connection Schematic',
                sub: 'Principal P&ID schematic, not to scale.',
            },
        },
        svgAria: {
            plan: 'Plan view: fuel storage bunker, fire partition, boiler, flue filtration, chimney, and hydronic manifold',
            section:
                'Section A–A: fuel bunker, fire partition, auger, moving-grate combustion chamber, 3-pass heat exchanger, flue filtration, and chimney',
            pid: 'Hydronic P&ID: boiler, anti-condensation loop, hydraulic header, twin pump group, expansion vessel, dirt separator, and connection flanges',
        },
        legend: {
            supply: 'Supply',
            returnLine: 'Return',
            flue: 'Flue gas',
            firewall: 'Fire partition',
            behindSection: 'Behind section plane',
            control: 'Controls',
        },
        positionsTitle: 'Positions in This View',
        techSpecsTitle: 'Technical Data',
        ctaForModel: (code) => `Request Quote for ${code}`,
        onRequestTitle: 'Schematics Upon Request',
        onRequestText:
            'We prepare project-specific DWG / PDF layout and hydronic connection drawings tailored to your site thermal load, fuel logistics, and foundation layout.',
        onRequestCta: 'Request Schematics for This Model',
        chimneyCalc: 'H per dispersion calculation',
        noScalePid: 'Not to scale · simplified P&ID symbols',
        plantHeatExchanger: 'Facility / Plate Heat Exchanger',
        intoBoiler: '≥ 55 °C return to boiler',
        titleBlockPlan: 'Plan · schematic · mm',
        titleBlockSection: 'Section A–A · schematic',
        titleBlockPid: 'Hydronic P&ID',
        module1: 'MODULE 1 · 40ft HC',
        module2: 'MODULE 2 · 40ft HC',
    },
    pl: {
        heading: 'Jak skompletowana jest kotłownia',
        lead: 'Trzy schematy zasadnicze: rzut, przekrój z traktem spalin oraz hydraulika. Kliknij pozycję na liście, aby podświetlić ją na rysunku.',
        statusBadge: (rev) => `Schemat zasadniczy · Rev ${rev}`,
        downloadBtn: 'Zapytaj o PDF / DWG',
        tablistAria: 'Widok schematu',
        tabs: {
            plan: {
                label: 'Rzut (Plan)',
                subSingle: 'ISO 20ft HC, skala',
                subDual: '2 × 40ft HC, skala',
            },
            section: {
                label: 'Przekrój A–A i trakt spalin',
                subSingle: 'Od paliwa do komina',
                subDual: 'Od paliwa do komina',
            },
            pid: {
                label: 'Schemat hydrauliczny',
                subSingle: 'Podłączenie do obiektu',
                subDual: 'Podłączenie do obiektu',
            },
        },
        metas: {
            plan: {
                titleSingle: 'Rzut · moduł kontenerowy 20ft HC',
                titleDual: 'Rzut · dwa moduły 40ft HC obok siebie',
                sub: 'Gabaryty wg normy kontenerów ISO. Układ wewnętrzny zasadniczy.',
            },
            section: {
                titleSingle: 'Przekrój A–A i trakt spalin',
                titleDual: 'Przekrój A–A i trakt spalin',
                sub: 'Przekrój przez moduł 1. Linią przerywaną – urządzenia za płaszczyzną przekroju.',
            },
            pid: {
                titleSingle: 'Schemat hydrauliczny i przyłączeniowy',
                titleDual: 'Schemat hydrauliczny i przyłączeniowy',
                sub: 'Schemat zasadniczy, bez skali.',
            },
        },
        svgAria: {
            plan: 'Rzut: magazyn paliwa, przegroda ppoż., kocioł, odpylanie spalin, komin i węzeł hydrauliczny',
            section:
                'Przekrój A–A: magazyn paliwa, przegroda ppoż., podajnik ślimakowy, komora z ruchomym rusztem, wymiennik 3-ciągowy, odpylanie i komin',
            pid: 'Schemat hydrauliczny: kocioł, układ antykondensacyjny, sprzęgło hydrauliczne, podwójna grupa pompowa, naczynie wzbiorcze, separator i kołnierze',
        },
        legend: {
            supply: 'Zasilanie',
            returnLine: 'Powrót',
            flue: 'Spaliny',
            firewall: 'Przegroda ppoż.',
            behindSection: 'Za płaszczyzną przekroju',
            control: 'Sterowanie',
        },
        positionsTitle: 'Pozycje w tym widoku',
        techSpecsTitle: 'Dane techniczne',
        ctaForModel: (code) => `Otrzymaj ofertę ${code}`,
        onRequestTitle: 'Rysunki na zapytanie',
        onRequestText:
            'Rysunki wykonawcze DWG / PDF układu i podłączenia hydraulicznego przygotowujemy pod konkretne parametry obiektu.',
        onRequestCta: 'Poproś o rysunki tego modelu',
        chimneyCalc: 'H wg obliczeń rozprzestrzeniania',
        noScalePid: 'Schemat bez skali · uproszczone symbole P&ID',
        plantHeatExchanger: 'Obiekt / wymiennik płytowy',
        intoBoiler: '≥ 55 °C do kotła',
        titleBlockPlan: 'Rzut · schemat zasadniczy · mm',
        titleBlockSection: 'Przekrój A–A · schemat zasadniczy',
        titleBlockPid: 'Schemat hydrauliczny',
        module1: 'MODUŁ 1 · 40ft HC',
        module2: 'MODUŁ 2 · 40ft HC',
    },
    ru: {
        heading: 'Как скомплектована котельная',
        lead: 'Три принципиальные схемы: план, разрез с дымовым трактом и гидравлика. Нажмите на позицию в списке – она выделится на чертеже.',
        statusBadge: (rev) => `Принципиальная схема · Rev ${rev}`,
        downloadBtn: 'Запросить PDF / DWG',
        tablistAria: 'Вид чертежа',
        tabs: {
            plan: {
                label: 'План',
                subSingle: 'ISO 20ft HC, масштаб',
                subDual: '2 × 40ft HC, масштаб',
            },
            section: {
                label: 'Разрез A–A и дымовой тракт',
                subSingle: 'От склада до дымовой трубы',
                subDual: 'От склада до дымовой трубы',
            },
            pid: {
                label: 'Гидравлическая схема',
                subSingle: 'Подключение к объекту',
                subDual: 'Подключение к объекту',
            },
        },
        metas: {
            plan: {
                titleSingle: 'План · контейнерный модуль 20ft HC',
                titleDual: 'План · два модуля 40ft HC рядом',
                sub: 'Габариты по стандарту контейнеров ISO. Внутренняя компоновка – принципиальная.',
            },
            section: {
                titleSingle: 'Разрез A–A и дымовой тракт',
                titleDual: 'Разрез A–A и дымовой тракт',
                sub: 'Разрез через модуль 1. Пунктиром – оборудование за плоскостью разреза.',
            },
            pid: {
                titleSingle: 'Гидравлическая схема подключения',
                titleDual: 'Гидравлическая схема подключения',
                sub: 'Принципиальная схема, без масштаба.',
            },
        },
        svgAria: {
            plan: 'План: склад топлива, противопожарная перегородка, котел, очистка дымовых газов, дымовая труба и гидравлический узел',
            section:
                'Разрез A–A: склад топлива, противопожарная перегородка, шнек, топка с подвижными колосниками, трехходовой теплообменник, очистка дыма и труба',
            pid: 'Гидравлическая схема: котел, антиконденсационный узел, гидравлический коллектор, сдвоенная насосная группа, расширительный бак, сепаратор и фланцы',
        },
        legend: {
            supply: 'Подача',
            returnLine: 'Обратка',
            flue: 'Дымовые газы',
            firewall: 'Противопожарная перегородка',
            behindSection: 'За плоскостью разреза',
            control: 'Управление',
        },
        positionsTitle: 'Позиции на этом виде',
        techSpecsTitle: 'Технические данные',
        ctaForModel: (code) => `Получить предложение ${code}`,
        onRequestTitle: 'Чертежи по запросу',
        onRequestText:
            'Чертежи DWG / PDF компоновки и гидравлического подключения этой модели подготавливаем под параметры вашего объекта.',
        onRequestCta: 'Запросить чертежи этой модели',
        chimneyCalc: 'H по расчету рассеивания',
        noScalePid: 'Схема без масштаба · упрощенные символы P&ID',
        plantHeatExchanger: 'Объект / пластинчатый теплообменник',
        intoBoiler: '≥ 55 °C в котел',
        titleBlockPlan: 'План · принципиальная схема · мм',
        titleBlockSection: 'Разрез A–A · принципиальная схема',
        titleBlockPid: 'Гидравлическая схема',
        module1: 'МОДУЛЬ 1 · 40ft HC',
        module2: 'МОДУЛЬ 2 · 40ft HC',
    },
};

const ALL_TAGS = [
    'K1',
    'K2',
    'F1',
    'B',
    'B1',
    'B2',
    'B3',
    'D1',
    'D2',
    'D3',
    'D4',
    'H1',
    'H2',
    'H3',
    'H4',
    'H5',
    'H6',
    'H7',
    'E1',
] as const;

export function BoilerDrawings({
    model,
    locale,
    rfqHref = '#industrial-rfq',
}: {
    model: IndustrialModel;
    locale: AppLocale;
    rfqHref?: string;
}) {
    const [view, setView] = useState<DrawingViewId>('plan');
    const [highlighted, setHighlighted] = useState<string>('');
    const copy = DRAWINGS_I18N[locale];
    const drawing = model.drawing;

    if (!drawing) {
        return (
            <section
                id="breziniai"
                data-testid="drawings"
                className="bg-[#0E1216] text-[#F5F3EE] rounded-2xl border border-[#26313B] p-6 sm:p-8 space-y-4"
            >
                <div className="space-y-2 max-w-2xl">
                    <span className="text-xs font-bold tracking-wider uppercase text-[#FF8A3D] block">
                        {model.code} · {model.kind}
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-[#F5F3EE] text-balance">
                        {copy.onRequestTitle}
                    </h2>
                    <p className="text-sm sm:text-base text-[#C9D0D8] leading-relaxed">
                        {copy.onRequestText}
                    </p>
                </div>
                <div>
                    <a
                        href={rfqHref}
                        className="inline-flex items-center justify-center min-h-[44px] px-5 py-2.5 rounded-lg bg-[#C2410C] text-white font-bold text-sm hover:brightness-110 transition"
                    >
                        {copy.onRequestCta}
                    </a>
                </div>
            </section>
        );
    }

    const isDual = drawing.layout === 'side-by-side';
    const totalLengthMm = drawing.modules[0]?.lengthMm ?? 12192;
    const singleWidthMm = drawing.modules[0]?.widthMm ?? 2438;
    const totalWidthMm = isDual ? singleWidthMm * 2 : singleWidthMm;
    const heightMm = drawing.modules[0]?.heightMm ?? 2896;
    const fuelLengthMm = drawing.zones.find((z) => z.tag === 'K1')?.x1Mm ?? Math.round(totalLengthMm * 0.41);
    const boilerLengthMm = totalLengthMm - fuelLengthMm;
    const nominalKw = model.power_kw.value?.nominal ?? 2000;
    const flowM3h = Math.round(((nominalKw / (4.186 * (drawing.hydraulics.supplyC - drawing.hydraulics.returnC))) * 3.6) / 0.975);
    const fuelVol = model.fuel_storage.value?.volume_m3 ?? 36;

    const tagColors = (tag: string) => {
        const on = highlighted === tag;
        return {
            fill: on ? '#FF8A3D' : '#0B0F13',
            text: on ? '#0B0F13' : '#F5F3EE',
            stroke: on ? '#FF8A3D' : '#8E99A5',
        };
    };

    const visiblePositions = drawing.positions.filter((p) => p.views.includes(view));

    const viewTabs: Array<{ id: DrawingViewId; num: string; label: string; sub: string }> = [
        {
            id: 'plan',
            num: '1',
            label: copy.tabs.plan.label,
            sub: isDual ? copy.tabs.plan.subDual : copy.tabs.plan.subSingle,
        },
        {
            id: 'section',
            num: '2',
            label: copy.tabs.section.label,
            sub: isDual ? copy.tabs.section.subDual : copy.tabs.section.subSingle,
        },
        {
            id: 'pid',
            num: '3',
            label: copy.tabs.pid.label,
            sub: isDual ? copy.tabs.pid.subDual : copy.tabs.pid.subSingle,
        },
    ];

    const currentMeta = {
        title: isDual ? copy.metas[view].titleDual : copy.metas[view].titleSingle,
        sub: copy.metas[view].sub,
    };

    return (
        <section
            id="breziniai"
            data-testid="drawings"
            className="bg-[#0E1216] text-[#F5F3EE] rounded-2xl border border-[#26313B] p-5 sm:p-8 space-y-6"
        >
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div className="space-y-2 max-w-2xl">
                    <span className="text-xs font-bold tracking-wider uppercase text-[#FF8A3D] block">
                        {model.code} · {model.kind} · {formatInt(nominalKw)} kW
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-[#F5F3EE] leading-tight text-balance">
                        {copy.heading}
                    </h2>
                    <p className="text-sm sm:text-base text-[#C9D0D8] leading-relaxed">
                        {copy.lead}
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2.5">
                    <span className="min-h-[38px] px-3 inline-flex items-center rounded-lg border border-[#26313B] text-xs text-[#A3ADB8]">
                        {copy.statusBadge(drawing.rev)}
                    </span>
                    <a
                        href={rfqHref}
                        className="min-h-[44px] px-4 inline-flex items-center rounded-lg bg-[#F5F3EE] text-[#0E1216] font-bold text-sm hover:brightness-95 transition"
                    >
                        {copy.downloadBtn}
                    </a>
                </div>
            </div>

            <div
                role="tablist"
                aria-label={copy.tablistAria}
                className="grid grid-cols-1 md:grid-cols-3 gap-2 p-1.5 rounded-xl bg-[#151C23]"
            >
                {viewTabs.map((t) => {
                    const selected = view === t.id;
                    return (
                        <button
                            key={t.id}
                            type="button"
                            role="tab"
                            aria-selected={selected}
                            onClick={() => {
                                setView(t.id);
                                setHighlighted('');
                            }}
                            className={`min-h-[54px] px-3.5 py-2 rounded-lg text-left cursor-pointer flex items-center gap-3 transition ${
                                selected
                                    ? 'bg-[#F5F3EE] text-[#0E1216]'
                                    : 'bg-transparent text-[#F5F3EE] hover:bg-[#1C252E]'
                            }`}
                        >
                            <span
                                className={`w-7 h-7 rounded-full border flex items-center justify-center text-xs font-bold shrink-0 ${
                                    selected
                                        ? 'border-[#0E1216] text-[#0E1216]'
                                        : 'border-[#5B6470] text-[#F5F3EE]'
                                }`}
                            >
                                {t.num}
                            </span>
                            <span className="flex flex-col">
                                <span className="font-bold text-sm">{t.label}</span>
                                <span
                                    className={`text-xs ${
                                        selected ? 'text-[#5B6470]' : 'text-[#8E99A5]'
                                    }`}
                                >
                                    {t.sub}
                                </span>
                            </span>
                        </button>
                    );
                })}
            </div>

            <div className="flex flex-col rounded-xl bg-[#0A0E12] border border-[#26313B] overflow-hidden">
                <div className="flex flex-wrap justify-between items-baseline gap-2 px-5 py-3.5 border-b border-[#1C252E]">
                    <span className="font-bold text-sm text-[#F5F3EE]">{currentMeta.title}</span>
                    <span className="text-xs text-[#8E99A5]">{currentMeta.sub}</span>
                </div>

                <div className="overflow-x-auto bg-[#0A0E12]">
                    <div className="min-w-[860px] p-3">
                        {view === 'plan' && (
                            <svg
                                viewBox="0 0 1100 580"
                                width="100%"
                                role="img"
                                aria-label={copy.svgAria.plan}
                                className="block"
                            >
                                <defs>
                                    <pattern
                                        id="slat1"
                                        width="24"
                                        height="12"
                                        patternUnits="userSpaceOnUse"
                                    >
                                        <path d="M0 6H24" stroke="#26313B" strokeWidth="2" />
                                    </pattern>
                                    <pattern
                                        id="grate1"
                                        width="10"
                                        height="10"
                                        patternUnits="userSpaceOnUse"
                                        patternTransform="rotate(45)"
                                    >
                                        <path d="M0 5H10" stroke="#5A3A2A" strokeWidth="3" />
                                    </pattern>
                                    <pattern
                                        id="tube1"
                                        width="14"
                                        height="14"
                                        patternUnits="userSpaceOnUse"
                                    >
                                        <circle
                                            cx="7"
                                            cy="7"
                                            r="4"
                                            fill="none"
                                            stroke="#6B7884"
                                            strokeWidth="1.2"
                                        />
                                    </pattern>
                                    <marker
                                        id="mk1"
                                        markerWidth="8"
                                        markerHeight="8"
                                        refX="6"
                                        refY="3"
                                        orient="auto"
                                        markerUnits="userSpaceOnUse"
                                    >
                                        <path d="M0 0L6 3L0 6Z" fill="#B0B8C1" />
                                    </marker>
                                </defs>
                                <rect
                                    x="80"
                                    y="70"
                                    width="853.4"
                                    height="341.3"
                                    fill="#10161C"
                                    stroke="#C9D0D8"
                                    strokeWidth="2.5"
                                />
                                <rect
                                    x="85"
                                    y="75"
                                    width="843.4"
                                    height="331.3"
                                    fill="none"
                                    stroke="#3A4652"
                                    strokeWidth="1"
                                />
                                {isDual && (
                                    <>
                                        <path
                                            d="M80 240.7H933.4"
                                            stroke="#8E99A5"
                                            strokeWidth="1.2"
                                            strokeDasharray="16 4 3 4"
                                        />
                                        <text
                                            x="925"
                                            y="232"
                                            textAnchor="end"
                                            fontSize="12"
                                            fill="#6B7682"
                                        >
                                            {copy.module1}
                                        </text>
                                        <text
                                            x="925"
                                            y="402"
                                            textAnchor="end"
                                            fontSize="12"
                                            fill="#6B7682"
                                        >
                                            {copy.module2}
                                        </text>
                                    </>
                                )}

                                <rect
                                    x="90.5"
                                    y="80.5"
                                    width="329"
                                    height="320.3"
                                    fill="url(#slat1)"
                                    stroke="#8E99A5"
                                    strokeWidth="1.2"
                                />
                                <text
                                    x="255"
                                    y="252"
                                    textAnchor="middle"
                                    fontSize="26"
                                    fontWeight="800"
                                    fill="#3A4652"
                                >
                                    {fuelVol} m³
                                </text>
                                <path
                                    d="M170 278H330"
                                    stroke="#B0B8C1"
                                    strokeWidth="1.6"
                                    markerEnd="url(#mk1)"
                                />

                                <path
                                    d="M430 64V417"
                                    stroke="#F2555A"
                                    strokeWidth="3"
                                    strokeDasharray="10 6"
                                />

                                <rect
                                    x="402"
                                    y="143.5"
                                    width="77"
                                    height="21"
                                    fill="#3A4652"
                                    stroke="#8E99A5"
                                    strokeWidth="1"
                                />
                                <path
                                    d="M412 143.5l-6 21 M424 143.5l-6 21 M448 143.5l-6 21 M460 143.5l-6 21 M472 143.5l-6 21"
                                    stroke="#6B7884"
                                    strokeWidth="1.2"
                                />
                                <rect
                                    x="423"
                                    y="147"
                                    width="14"
                                    height="14"
                                    fill="#0B0F13"
                                    stroke="#F2555A"
                                    strokeWidth="1.5"
                                />
                                <path
                                    d="M423 147l14 14M437 147l-14 14"
                                    stroke="#F2555A"
                                    strokeWidth="1.5"
                                />

                                <rect
                                    x="479"
                                    y="91"
                                    width="301"
                                    height="129.5"
                                    rx="4"
                                    fill="#1A222B"
                                    stroke="#C9D0D8"
                                    strokeWidth="2"
                                />
                                <rect
                                    x="493"
                                    y="105"
                                    width="130"
                                    height="101"
                                    fill="url(#grate1)"
                                    stroke="#8A5A3C"
                                    strokeWidth="2"
                                />
                                <rect
                                    x="640"
                                    y="105"
                                    width="126"
                                    height="101"
                                    fill="url(#tube1)"
                                    stroke="#6B7884"
                                    strokeWidth="1"
                                />

                                <path
                                    d="M780 154H808V280"
                                    stroke="#3A4652"
                                    strokeWidth="16"
                                    fill="none"
                                />
                                <path
                                    d="M782 154H808V272"
                                    stroke="#B0B8C1"
                                    strokeWidth="1.5"
                                    strokeDasharray="6 5"
                                    fill="none"
                                    markerEnd="url(#mk1)"
                                />
                                <circle
                                    cx="808"
                                    cy="308"
                                    r="28"
                                    fill="#1A222B"
                                    stroke="#C9D0D8"
                                    strokeWidth="1.6"
                                />
                                <circle
                                    cx="808"
                                    cy="308"
                                    r="9"
                                    fill="none"
                                    stroke="#6B7884"
                                    strokeWidth="1.2"
                                />
                                <path
                                    d="M836 308H843 M885 308H890 M929 308H951.5"
                                    stroke="#3A4652"
                                    strokeWidth="12"
                                />
                                <rect
                                    x="843"
                                    y="282"
                                    width="42"
                                    height="52"
                                    fill="none"
                                    stroke="#C9D0D8"
                                    strokeWidth="1.4"
                                    strokeDasharray="5 4"
                                />
                                <circle
                                    cx="909.5"
                                    cy="308"
                                    r="19.6"
                                    fill="#1A222B"
                                    stroke="#C9D0D8"
                                    strokeWidth="1.6"
                                />
                                <path
                                    d="M909.5 308l10-8 M909.5 308l-12 3 M909.5 308l3 12"
                                    stroke="#8E99A5"
                                    strokeWidth="2"
                                />
                                <circle
                                    cx="972.5"
                                    cy="308"
                                    r="21"
                                    fill="#1A222B"
                                    stroke="#C9D0D8"
                                    strokeWidth="2"
                                />
                                <circle
                                    cx="972.5"
                                    cy="308"
                                    r="14"
                                    fill="none"
                                    stroke="#6B7884"
                                    strokeWidth="1.2"
                                />

                                <path
                                    d="M590 220.5V343"
                                    stroke="#5B9BD5"
                                    strokeWidth="4"
                                    fill="none"
                                />
                                <path
                                    d="M560 343H720V411"
                                    stroke="#5B9BD5"
                                    strokeWidth="4"
                                    fill="none"
                                />
                                <path
                                    d="M560 315V343"
                                    stroke="#5B9BD5"
                                    strokeWidth="2.5"
                                    fill="none"
                                />
                                <circle
                                    cx="560"
                                    cy="300"
                                    r="15"
                                    fill="#1A222B"
                                    stroke="#5B9BD5"
                                    strokeWidth="2"
                                />
                                <path
                                    d="M630 220.5V322H740V411"
                                    stroke="#FF8A3D"
                                    strokeWidth="4"
                                    fill="none"
                                />
                                <circle
                                    cx="690"
                                    cy="322"
                                    r="10"
                                    fill="#0B0F13"
                                    stroke="#FF8A3D"
                                    strokeWidth="2"
                                />
                                <path d="M686 316L696 322L686 328Z" fill="#FF8A3D" />
                                <path
                                    d="M712 405H728 M712 410H728 M732 405H748 M732 410H748"
                                    stroke="#C9D0D8"
                                    strokeWidth="2"
                                />

                                <rect
                                    x="479"
                                    y="371"
                                    width="56"
                                    height="28"
                                    fill="#0F2A18"
                                    stroke={highlighted === 'E1' ? '#FF8A3D' : '#3FB950'}
                                    strokeWidth="1.6"
                                />
                                <text
                                    x="507"
                                    y="389"
                                    textAnchor="middle"
                                    fontSize="12"
                                    fill="#3FB950"
                                >
                                    E1
                                </text>

                                <path
                                    d="M48 154H78 M935 154H965"
                                    stroke="#C9D0D8"
                                    strokeWidth="2.5"
                                />
                                <path
                                    d="M52 154V176 M961 154V176"
                                    stroke="#C9D0D8"
                                    strokeWidth="1.5"
                                    markerEnd="url(#mk1)"
                                />
                                <text x="40" y="150" fontSize="14" fontWeight="600" fill="#F5F3EE">
                                    A
                                </text>
                                <text x="968" y="150" fontSize="14" fontWeight="600" fill="#F5F3EE">
                                    A
                                </text>

                                <path
                                    d="M80 416V478 M430 416V452 M933.4 416V478"
                                    stroke="#6B7682"
                                    strokeWidth="1"
                                />
                                <path d="M80 446H933.4 M80 470H933.4" stroke="#8E99A5" strokeWidth="1" />
                                <path
                                    d="M76 450l8-8 M426 450l8-8 M929.4 450l8-8 M76 474l8-8 M929.4 474l8-8"
                                    stroke="#C9D0D8"
                                    strokeWidth="1.5"
                                />
                                <text x="255" y="440" textAnchor="middle" fontSize="12" fill="#C9D0D8">
                                    {formatInt(fuelLengthMm)}
                                </text>
                                <text
                                    x="681.7"
                                    y="440"
                                    textAnchor="middle"
                                    fontSize="12"
                                    fill="#C9D0D8"
                                >
                                    {formatInt(boilerLengthMm)}
                                </text>
                                <text
                                    x="506.7"
                                    y="464"
                                    textAnchor="middle"
                                    fontSize="12"
                                    fontWeight="600"
                                    fill="#F5F3EE"
                                >
                                    {formatInt(totalLengthMm)}
                                </text>

                                <path
                                    d="M938 70H1052 M938 240.7H1052 M938 411.3H1052"
                                    stroke="#6B7682"
                                    strokeWidth="1"
                                />
                                <path
                                    d="M1016 70V411.3 M1044 70V411.3"
                                    stroke="#8E99A5"
                                    strokeWidth="1"
                                />
                                <path
                                    d="M1012 74l8-8 M1012 415.3l8-8 M1040 74l8-8 M1040 244.7l8-8 M1040 415.3l8-8"
                                    stroke="#C9D0D8"
                                    strokeWidth="1.5"
                                />
                                <text
                                    transform="translate(1010 240.7) rotate(-90)"
                                    textAnchor="middle"
                                    fontSize="12"
                                    fontWeight="600"
                                    fill="#F5F3EE"
                                >
                                    {formatInt(totalWidthMm)}
                                </text>
                                {isDual && (
                                    <>
                                        <text
                                            transform="translate(1038 155.4) rotate(-90)"
                                            textAnchor="middle"
                                            fontSize="12"
                                            fill="#C9D0D8"
                                        >
                                            {formatInt(singleWidthMm)}
                                        </text>
                                        <text
                                            transform="translate(1038 326) rotate(-90)"
                                            textAnchor="middle"
                                            fontSize="12"
                                            fill="#C9D0D8"
                                        >
                                            {formatInt(singleWidthMm)}
                                        </text>
                                    </>
                                )}

                                <rect x="80" y="512" width="70" height="8" fill="#C9D0D8" />
                                <rect
                                    x="150"
                                    y="512"
                                    width="70"
                                    height="8"
                                    fill="none"
                                    stroke="#C9D0D8"
                                />
                                <rect x="220" y="512" width="210" height="8" fill="#C9D0D8" />
                                <text x="80" y="538" fontSize="12" fill="#8E99A5">
                                    0
                                </text>
                                <text x="146" y="538" fontSize="12" fill="#8E99A5">
                                    1
                                </text>
                                <text x="216" y="538" fontSize="12" fill="#8E99A5">
                                    2
                                </text>
                                <text x="418" y="538" fontSize="12" fill="#8E99A5">
                                    5 m
                                </text>

                                <rect
                                    x="700"
                                    y="500"
                                    width="360"
                                    height="60"
                                    fill="#0B0F13"
                                    stroke="#5B6470"
                                    strokeWidth="1"
                                />
                                <path
                                    d="M700 530H1060 M920 530V560 M990 530V560"
                                    stroke="#5B6470"
                                    strokeWidth="1"
                                />
                                <text
                                    x="712"
                                    y="520"
                                    fontSize="12"
                                    fontWeight="700"
                                    fill="#F5F3EE"
                                >
                                    GILĖS INŽINERIJA
                                </text>
                                <text
                                    x="1048"
                                    y="520"
                                    textAnchor="end"
                                    fontSize="12"
                                    fontWeight="600"
                                    fill="#FF8A3D"
                                >
                                    {model.code}
                                </text>
                                <text x="712" y="550" fontSize="12" fill="#C9D0D8">
                                    {copy.titleBlockPlan}
                                </text>
                                <text
                                    x="955"
                                    y="550"
                                    textAnchor="middle"
                                    fontSize="12"
                                    fill="#C9D0D8"
                                >
                                    Rev {drawing.rev}
                                </text>
                                <text
                                    x="1025"
                                    y="550"
                                    textAnchor="middle"
                                    fontSize="12"
                                    fill="#C9D0D8"
                                >
                                    1 / 3
                                </text>

                                {(
                                    [
                                        ['K1', 115, 100],
                                        ['K2', 455, 125],
                                        ['F1', 430, 48],
                                        ['B', 508, 118],
                                        ['D1', 808, 352],
                                        ['D2', 864, 352],
                                        ['D3', 909.5, 350],
                                        ['D4', 972.5, 350],
                                        ['H2', 605, 285],
                                        ['H3', 690, 295],
                                        ['H4', 560, 268],
                                        ['H7', 765, 390],
                                    ] as const
                                ).map(([tag, cx, cy]) => {
                                    const c = tagColors(tag);
                                    return (
                                        <g key={tag}>
                                            <circle
                                                cx={cx}
                                                cy={cy}
                                                r="12"
                                                fill={c.fill}
                                                stroke={c.stroke}
                                                strokeWidth="1.5"
                                            />
                                            <text
                                                x={cx}
                                                y={cy + 4}
                                                textAnchor="middle"
                                                fontSize="12"
                                                fontWeight="600"
                                                fill={c.text}
                                            >
                                                {tag}
                                            </text>
                                        </g>
                                    );
                                })}
                            </svg>
                        )}

                        {view === 'section' && (
                            <svg
                                viewBox="0 0 1100 600"
                                width="100%"
                                role="img"
                                aria-label={copy.svgAria.section}
                                className="block"
                            >
                                <defs>
                                    <pattern
                                        id="fuel2"
                                        width="9"
                                        height="9"
                                        patternUnits="userSpaceOnUse"
                                    >
                                        <circle cx="3" cy="3" r="1.4" fill="#7A5E3C" />
                                        <circle cx="7.5" cy="7" r="1.1" fill="#5E4A30" />
                                    </pattern>
                                    <pattern
                                        id="conc2"
                                        width="8"
                                        height="8"
                                        patternUnits="userSpaceOnUse"
                                        patternTransform="rotate(45)"
                                    >
                                        <path d="M0 4H8" stroke="#5B6470" strokeWidth="1" />
                                    </pattern>
                                    <pattern
                                        id="gnd2"
                                        width="10"
                                        height="10"
                                        patternUnits="userSpaceOnUse"
                                        patternTransform="rotate(-45)"
                                    >
                                        <path d="M0 5H10" stroke="#3A4652" strokeWidth="1" />
                                    </pattern>
                                    <marker
                                        id="mk2"
                                        markerWidth="8"
                                        markerHeight="8"
                                        refX="6"
                                        refY="3"
                                        orient="auto"
                                        markerUnits="userSpaceOnUse"
                                    >
                                        <path d="M0 0L6 3L0 6Z" fill="#B0B8C1" />
                                    </marker>
                                </defs>
                                <rect x="40" y="470" width="1020" height="12" fill="url(#gnd2)" />
                                <path d="M40 470H1060" stroke="#8E99A5" strokeWidth="1.5" />
                                <rect
                                    x="109.5"
                                    y="450.5"
                                    width="39"
                                    height="19.5"
                                    fill="url(#conc2)"
                                    stroke="#8E99A5"
                                    strokeWidth="1"
                                />
                                <rect
                                    x="467"
                                    y="450.5"
                                    width="39"
                                    height="19.5"
                                    fill="url(#conc2)"
                                    stroke="#8E99A5"
                                    strokeWidth="1"
                                />
                                <rect
                                    x="824.5"
                                    y="450.5"
                                    width="39"
                                    height="19.5"
                                    fill="url(#conc2)"
                                    stroke="#8E99A5"
                                    strokeWidth="1"
                                />

                                <rect
                                    x="90"
                                    y="262.3"
                                    width="792.5"
                                    height="188.2"
                                    fill="#10161C"
                                    stroke="#C9D0D8"
                                    strokeWidth="2.5"
                                />
                                <rect
                                    x="95"
                                    y="267.3"
                                    width="782.5"
                                    height="178.2"
                                    fill="none"
                                    stroke="#3A4652"
                                    strokeWidth="1"
                                />

                                <path
                                    d="M99.75 440.75H405.25V330L99.75 295Z"
                                    fill="url(#fuel2)"
                                    stroke="#8E99A5"
                                    strokeWidth="1"
                                />
                                <path
                                    d="M99.75 440.75H405.25"
                                    stroke="#C9D0D8"
                                    strokeWidth="3"
                                />
                                <path
                                    d="M150 428H290"
                                    stroke="#F5F3EE"
                                    strokeWidth="1.6"
                                    markerEnd="url(#mk2)"
                                />

                                <path
                                    d="M415 262V450.5"
                                    stroke="#F2555A"
                                    strokeWidth="3"
                                    strokeDasharray="10 6"
                                />
                                <path
                                    d="M395.5 427.75L476.75 388.75"
                                    stroke="#3A4652"
                                    strokeWidth="13"
                                    strokeLinecap="round"
                                />
                                <path
                                    d="M395.5 427.75L476.75 388.75"
                                    stroke="#6B7884"
                                    strokeWidth="13"
                                    strokeDasharray="3 5"
                                />
                                <rect
                                    x="408"
                                    y="411.4"
                                    width="14"
                                    height="14"
                                    fill="#0B0F13"
                                    stroke="#F2555A"
                                    strokeWidth="1.5"
                                />
                                <path
                                    d="M408 411.4l14 14M422 411.4l-14 14"
                                    stroke="#F2555A"
                                    strokeWidth="1.5"
                                />

                                <rect
                                    x="460.5"
                                    y="284.75"
                                    width="279.5"
                                    height="152.75"
                                    rx="4"
                                    fill="#1A222B"
                                    stroke="#C9D0D8"
                                    strokeWidth="2"
                                />
                                <rect
                                    x="473.5"
                                    y="299.5"
                                    width="130"
                                    height="125"
                                    fill="#22160F"
                                    stroke="#8A5A3C"
                                    strokeWidth="7"
                                />
                                <ellipse
                                    cx="538"
                                    cy="398"
                                    rx="48"
                                    ry="20"
                                    fill="#FF7A2A"
                                    opacity="0.35"
                                />
                                <path
                                    d="M482 392h12v4h12v4h12v4h12v4h12v4h12v4h12v4h12v4h8"
                                    stroke="#D9D4CA"
                                    strokeWidth="2.5"
                                    fill="none"
                                />
                                <text
                                    x="540"
                                    y="346"
                                    textAnchor="middle"
                                    fontSize="12"
                                    fill="#FFB27A"
                                >
                                    ≈ 1 050 °C
                                </text>
                                <rect x="520" y="428" width="80" height="7" fill="#3A4652" />
                                <path
                                    d="M618 300H730 M618 312H730 M618 324H730 M618 344H730 M618 356H730 M618 368H730 M618 388H730 M618 400H730 M618 412H730"
                                    stroke="#3A4652"
                                    strokeWidth="2"
                                />
                                <path
                                    d="M607 318H726V362H624V406H752"
                                    stroke="#B0B8C1"
                                    strokeWidth="1.6"
                                    strokeDasharray="6 5"
                                    fill="none"
                                    markerEnd="url(#mk2)"
                                />

                                <path
                                    d="M740 294.5H792V392L772 427.75H760L740 392Z"
                                    fill="none"
                                    stroke="#8E99A5"
                                    strokeWidth="1.3"
                                    strokeDasharray="5 4"
                                />
                                <rect
                                    x="798.5"
                                    y="307.5"
                                    width="39"
                                    height="123.5"
                                    fill="none"
                                    stroke="#8E99A5"
                                    strokeWidth="1.3"
                                    strokeDasharray="5 4"
                                />
                                <circle
                                    cx="860"
                                    cy="359.5"
                                    r="18"
                                    fill="none"
                                    stroke="#8E99A5"
                                    strokeWidth="1.3"
                                    strokeDasharray="5 4"
                                />
                                <path
                                    d="M766 294.5V280H818V303"
                                    stroke="#B0B8C1"
                                    strokeWidth="1.3"
                                    strokeDasharray="3 4"
                                    fill="none"
                                    markerEnd="url(#mk2)"
                                />
                                <path
                                    d="M837.5 359.5H840"
                                    stroke="#B0B8C1"
                                    strokeWidth="1.3"
                                    strokeDasharray="3 4"
                                />
                                <path d="M878 359.5H902.5" stroke="#3A4652" strokeWidth="12" />

                                <rect
                                    x="902.5"
                                    y="208"
                                    width="32.5"
                                    height="262"
                                    fill="#1A222B"
                                    stroke="#C9D0D8"
                                    strokeWidth="2"
                                />
                                <rect
                                    x="902.5"
                                    y="76"
                                    width="32.5"
                                    height="118"
                                    fill="#1A222B"
                                    stroke="#C9D0D8"
                                    strokeWidth="2"
                                />
                                <path
                                    d="M896 196l12 6-12 6 M941 196l-12 6 12 6"
                                    stroke="#0A0E12"
                                    strokeWidth="8"
                                />
                                <path
                                    d="M896 194L941 186 M896 210L941 202"
                                    stroke="#C9D0D8"
                                    strokeWidth="1.5"
                                />
                                <rect
                                    x="897"
                                    y="68"
                                    width="43.5"
                                    height="8"
                                    fill="#3A4652"
                                    stroke="#C9D0D8"
                                    strokeWidth="1"
                                />
                                <path
                                    d="M918.75 440V90"
                                    stroke="#B0B8C1"
                                    strokeWidth="1.6"
                                    strokeDasharray="6 5"
                                    markerEnd="url(#mk2)"
                                />

                                <path d="M944 470H998 M944 68H998" stroke="#6B7682" strokeWidth="1" />
                                <path d="M985 68V470" stroke="#8E99A5" strokeWidth="1" />
                                <path
                                    d="M981 72l8-8 M981 474l8-8"
                                    stroke="#C9D0D8"
                                    strokeWidth="1.5"
                                />
                                <text
                                    transform="translate(978 269) rotate(-90)"
                                    textAnchor="middle"
                                    fontSize="12"
                                    fontWeight="600"
                                    fill="#F5F3EE"
                                >
                                    {copy.chimneyCalc}
                                </text>

                                <path
                                    d="M90 455V512 M882.5 455V512"
                                    stroke="#6B7682"
                                    strokeWidth="1"
                                />
                                <path d="M90 505H882.5" stroke="#8E99A5" strokeWidth="1" />
                                <path
                                    d="M86 509l8-8 M878.5 509l8-8"
                                    stroke="#C9D0D8"
                                    strokeWidth="1.5"
                                />
                                <text
                                    x="486"
                                    y="499"
                                    textAnchor="middle"
                                    fontSize="12"
                                    fontWeight="600"
                                    fill="#F5F3EE"
                                >
                                    {formatInt(totalLengthMm)}
                                </text>
                                <path d="M86 262.3H48 M86 450.5H48" stroke="#6B7682" strokeWidth="1" />
                                <path d="M56 262.3V450.5" stroke="#8E99A5" strokeWidth="1" />
                                <path
                                    d="M52 266.3l8-8 M52 454.5l8-8"
                                    stroke="#C9D0D8"
                                    strokeWidth="1.5"
                                />
                                <text
                                    transform="translate(50 356.4) rotate(-90)"
                                    textAnchor="middle"
                                    fontSize="12"
                                    fontWeight="600"
                                    fill="#F5F3EE"
                                >
                                    {formatInt(heightMm)}
                                </text>

                                <rect x="90" y="545" width="65" height="8" fill="#C9D0D8" />
                                <rect
                                    x="155"
                                    y="545"
                                    width="65"
                                    height="8"
                                    fill="none"
                                    stroke="#C9D0D8"
                                />
                                <rect x="220" y="545" width="195" height="8" fill="#C9D0D8" />
                                <text x="90" y="571" fontSize="12" fill="#8E99A5">
                                    0
                                </text>
                                <text x="151" y="571" fontSize="12" fill="#8E99A5">
                                    1
                                </text>
                                <text x="216" y="571" fontSize="12" fill="#8E99A5">
                                    2
                                </text>
                                <text x="403" y="571" fontSize="12" fill="#8E99A5">
                                    5 m
                                </text>

                                <rect
                                    x="700"
                                    y="528"
                                    width="360"
                                    height="60"
                                    fill="#0B0F13"
                                    stroke="#5B6470"
                                    strokeWidth="1"
                                />
                                <path
                                    d="M700 558H1060 M920 558V588 M990 558V588"
                                    stroke="#5B6470"
                                    strokeWidth="1"
                                />
                                <text
                                    x="712"
                                    y="548"
                                    fontSize="12"
                                    fontWeight="700"
                                    fill="#F5F3EE"
                                >
                                    GILĖS INŽINERIJA
                                </text>
                                <text
                                    x="1048"
                                    y="548"
                                    textAnchor="end"
                                    fontSize="12"
                                    fontWeight="600"
                                    fill="#FF8A3D"
                                >
                                    {model.code}
                                </text>
                                <text x="712" y="578" fontSize="12" fill="#C9D0D8">
                                    {copy.titleBlockSection}
                                </text>
                                <text
                                    x="955"
                                    y="578"
                                    textAnchor="middle"
                                    fontSize="12"
                                    fill="#C9D0D8"
                                >
                                    Rev {drawing.rev}
                                </text>
                                <text
                                    x="1025"
                                    y="578"
                                    textAnchor="middle"
                                    fontSize="12"
                                    fill="#C9D0D8"
                                >
                                    2 / 3
                                </text>

                                <path
                                    d="M250 251V300 M540 251V299 M675 251V296 M766 251V280 M818 251V280 M460 442L520 432"
                                    stroke="#6B7682"
                                    strokeWidth="1"
                                />
                                {(
                                    [
                                        ['K1', 250, 240],
                                        ['F1', 415, 240],
                                        ['K2', 440, 372],
                                        ['B1', 540, 240],
                                        ['B2', 675, 240],
                                        ['B3', 450, 444],
                                        ['D1', 766, 240],
                                        ['D2', 818, 240],
                                        ['D3', 860, 408],
                                        ['D4', 954, 130],
                                    ] as const
                                ).map(([tag, cx, cy]) => {
                                    const c = tagColors(tag);
                                    return (
                                        <g key={tag}>
                                            <circle
                                                cx={cx}
                                                cy={cy}
                                                r="12"
                                                fill={c.fill}
                                                stroke={c.stroke}
                                                strokeWidth="1.5"
                                            />
                                            <text
                                                x={cx}
                                                y={cy + 4}
                                                textAnchor="middle"
                                                fontSize="12"
                                                fontWeight="600"
                                                fill={c.text}
                                            >
                                                {tag}
                                            </text>
                                        </g>
                                    );
                                })}
                            </svg>
                        )}

                        {view === 'pid' && (
                            <svg
                                viewBox="0 0 1100 580"
                                width="100%"
                                role="img"
                                aria-label={copy.svgAria.pid}
                                className="block"
                            >
                                <rect
                                    x="70"
                                    y="120"
                                    width="130"
                                    height="320"
                                    rx="6"
                                    fill="#1A222B"
                                    stroke="#C9D0D8"
                                    strokeWidth="2"
                                />
                                <text
                                    x="135"
                                    y="285"
                                    textAnchor="middle"
                                    fontSize="13"
                                    fill="#8E99A5"
                                >
                                    {formatInt(nominalKw)} kW
                                </text>

                                <path
                                    d="M200 170H520"
                                    stroke="#FF8A3D"
                                    strokeWidth="4"
                                    fill="none"
                                />
                                <path
                                    d="M570 170H640 M720 170H990"
                                    stroke="#FF8A3D"
                                    strokeWidth="4"
                                    fill="none"
                                />
                                <path
                                    d="M640 170V148H720V170 M640 170V192H720V170"
                                    stroke="#FF8A3D"
                                    strokeWidth="3"
                                    fill="none"
                                />
                                <path
                                    d="M200 390H520"
                                    stroke="#5B9BD5"
                                    strokeWidth="4"
                                    fill="none"
                                />
                                <path
                                    d="M570 390H990"
                                    stroke="#5B9BD5"
                                    strokeWidth="4"
                                    fill="none"
                                />
                                <path
                                    d="M400 170V390"
                                    stroke="#FF8A3D"
                                    strokeWidth="3"
                                    strokeDasharray="8 5"
                                    fill="none"
                                />
                                <path
                                    d="M640 390V470"
                                    stroke="#5B9BD5"
                                    strokeWidth="2.5"
                                    fill="none"
                                />

                                <path
                                    d="M222 162L238 178V162L222 178Z M222 382L238 398V382L222 398Z M912 162L928 178V162L912 178Z M912 382L928 398V382L912 398Z"
                                    fill="#0A0E12"
                                    stroke="#C9D0D8"
                                    strokeWidth="1.5"
                                />

                                <path d="M270 170V138" stroke="#FF8A3D" strokeWidth="2.5" />
                                <path
                                    d="M262 138H278L270 124Z"
                                    fill="#0A0E12"
                                    stroke="#C9D0D8"
                                    strokeWidth="1.5"
                                />
                                <path
                                    d="M270 124l-5-3 10-6-10-6 10-6-5-3"
                                    stroke="#C9D0D8"
                                    strokeWidth="1.5"
                                    fill="none"
                                />
                                <path d="M278 131H296" stroke="#C9D0D8" strokeWidth="1.5" />
                                <text x="300" y="135" fontSize="12" fill="#C9D0D8">
                                    {drawing.hydraulics.safetyValveBar ?? 6} bar
                                </text>
                                <path
                                    d="M330 170V146 M362 170V146"
                                    stroke="#C9D0D8"
                                    strokeWidth="1.2"
                                />
                                <circle
                                    cx="330"
                                    cy="134"
                                    r="12"
                                    fill="#0A0E12"
                                    stroke="#C9D0D8"
                                    strokeWidth="1.2"
                                />
                                <text
                                    x="330"
                                    y="138"
                                    textAnchor="middle"
                                    fontSize="10"
                                    fill="#C9D0D8"
                                >
                                    TI
                                </text>
                                <circle
                                    cx="362"
                                    cy="134"
                                    r="12"
                                    fill="#0A0E12"
                                    stroke="#C9D0D8"
                                    strokeWidth="1.2"
                                />
                                <text
                                    x="362"
                                    y="138"
                                    textAnchor="middle"
                                    fontSize="10"
                                    fill="#C9D0D8"
                                >
                                    PI
                                </text>

                                <circle
                                    cx="320"
                                    cy="390"
                                    r="13"
                                    fill="#0A0E12"
                                    stroke="#5B9BD5"
                                    strokeWidth="2"
                                />
                                <path d="M325 383L313 390L325 397Z" fill="#5B9BD5" />
                                <path
                                    d="M388 380L412 400V380L388 400Z"
                                    fill="#0A0E12"
                                    stroke="#C9D0D8"
                                    strokeWidth="1.5"
                                />
                                <path
                                    d="M400 390L392 374H408Z"
                                    fill="#0A0E12"
                                    stroke="#C9D0D8"
                                    strokeWidth="1.5"
                                />
                                <text x="250" y="420" fontSize="12" fill="#7FB3E3">
                                    {copy.intoBoiler}
                                </text>
                                <text x="430" y="160" fontSize="12" fill="#C9D0D8">
                                    DN{drawing.hydraulics.dn} PN{drawing.hydraulics.pn}
                                </text>

                                <rect
                                    x="520"
                                    y="130"
                                    width="50"
                                    height="300"
                                    rx="25"
                                    fill="#1A222B"
                                    stroke="#C9D0D8"
                                    strokeWidth="2"
                                />
                                <text
                                    x="545"
                                    y="452"
                                    textAnchor="middle"
                                    fontSize="12"
                                    fill="#8E99A5"
                                >
                                    DN{drawing.hydraulics.dn}
                                </text>

                                <circle
                                    cx="680"
                                    cy="148"
                                    r="12"
                                    fill="#0A0E12"
                                    stroke="#FF8A3D"
                                    strokeWidth="2"
                                />
                                <path d="M675 141L687 148L675 155Z" fill="#FF8A3D" />
                                <circle
                                    cx="680"
                                    cy="192"
                                    r="12"
                                    fill="#0A0E12"
                                    stroke="#FF8A3D"
                                    strokeWidth="2"
                                />
                                <path d="M675 185L687 192L675 199Z" fill="#FF8A3D" />
                                <text x="760" y="158" fontSize="12" fill="#C9D0D8">
                                    ≈ {flowM3h} m³/h · ~1,2 m/s
                                </text>
                                <text
                                    x="820"
                                    y="200"
                                    fontSize="12"
                                    fontWeight="600"
                                    fill="#FF8A3D"
                                >
                                    T1 {drawing.hydraulics.supplyC} °C
                                </text>
                                <path
                                    d="M880 165l10 5-10 5z M600 165l10 5-10 5z"
                                    fill="#FF8A3D"
                                />

                                <rect
                                    x="846"
                                    y="372"
                                    width="28"
                                    height="36"
                                    fill="#0A0E12"
                                    stroke="#C9D0D8"
                                    strokeWidth="1.5"
                                />
                                <path
                                    d="M852 380L860 394L868 380"
                                    stroke="#C9D0D8"
                                    strokeWidth="1.5"
                                    fill="none"
                                />
                                <text
                                    x="740"
                                    y="420"
                                    fontSize="12"
                                    fontWeight="600"
                                    fill="#7FB3E3"
                                >
                                    T2 {drawing.hydraulics.returnC} °C
                                </text>
                                <path
                                    d="M790 385l-10 5 10 5z M480 385l-10 5 10 5z"
                                    fill="#5B9BD5"
                                />

                                <path
                                    d="M632 426H648L640 438Z"
                                    fill="#0A0E12"
                                    stroke="#C9D0D8"
                                    strokeWidth="1.2"
                                />
                                <rect
                                    x="620"
                                    y="470"
                                    width="40"
                                    height="70"
                                    rx="20"
                                    fill="#1A222B"
                                    stroke="#5B9BD5"
                                    strokeWidth="2"
                                />

                                <path
                                    d="M956 156V184 M964 156V184 M956 376V404 M964 376V404"
                                    stroke="#C9D0D8"
                                    strokeWidth="2.5"
                                />
                                <rect
                                    x="990"
                                    y="130"
                                    width="70"
                                    height="300"
                                    fill="none"
                                    stroke="#6B7682"
                                    strokeWidth="1.2"
                                    strokeDasharray="6 5"
                                />
                                <text
                                    transform="translate(1030 280) rotate(-90)"
                                    textAnchor="middle"
                                    fontSize="12"
                                    fill="#A3ADB8"
                                >
                                    {copy.plantHeatExchanger}
                                </text>

                                <text x="80" y="560" fontSize="12" fill="#8E99A5">
                                    {copy.noScalePid}
                                </text>
                                <rect
                                    x="720"
                                    y="500"
                                    width="340"
                                    height="60"
                                    fill="#0B0F13"
                                    stroke="#5B6470"
                                    strokeWidth="1"
                                />
                                <path
                                    d="M720 530H1060 M920 530V560 M990 530V560"
                                    stroke="#5B6470"
                                    strokeWidth="1"
                                />
                                <text
                                    x="732"
                                    y="520"
                                    fontSize="12"
                                    fontWeight="700"
                                    fill="#F5F3EE"
                                >
                                    GILĖS INŽINERIJA
                                </text>
                                <text
                                    x="1048"
                                    y="520"
                                    textAnchor="end"
                                    fontSize="12"
                                    fontWeight="600"
                                    fill="#FF8A3D"
                                >
                                    {model.code}
                                </text>
                                <text x="732" y="550" fontSize="12" fill="#C9D0D8">
                                    {copy.titleBlockPid}
                                </text>
                                <text
                                    x="955"
                                    y="550"
                                    textAnchor="middle"
                                    fontSize="12"
                                    fill="#C9D0D8"
                                >
                                    Rev {drawing.rev}
                                </text>
                                <text
                                    x="1025"
                                    y="550"
                                    textAnchor="middle"
                                    fontSize="12"
                                    fill="#C9D0D8"
                                >
                                    3 / 3
                                </text>

                                {(
                                    [
                                        ['B', 135, 150],
                                        ['H6', 270, 96],
                                        ['H1', 440, 290],
                                        ['H2', 545, 280],
                                        ['H3', 680, 112],
                                        ['H4', 595, 505],
                                        ['H5', 860, 436],
                                        ['H7', 960, 280],
                                    ] as const
                                ).map(([tag, cx, cy]) => {
                                    const c = tagColors(tag);
                                    return (
                                        <g key={tag}>
                                            <circle
                                                cx={cx}
                                                cy={cy}
                                                r="12"
                                                fill={c.fill}
                                                stroke={c.stroke}
                                                strokeWidth="1.5"
                                            />
                                            <text
                                                x={cx}
                                                y={cy + 4}
                                                textAnchor="middle"
                                                fontSize="12"
                                                fontWeight="600"
                                                fill={c.text}
                                            >
                                                {tag}
                                            </text>
                                        </g>
                                    );
                                })}
                            </svg>
                        )}
                    </div>
                </div>

                <div className="flex flex-wrap gap-x-5 gap-y-2 px-5 py-3 border-t border-[#1C252E] text-xs text-[#A3ADB8]">
                    <span className="inline-flex items-center gap-2">
                        <span className="w-5 h-[3px] bg-[#FF8A3D] inline-block" />
                        {copy.legend.supply}
                    </span>
                    <span className="inline-flex items-center gap-2">
                        <span className="w-5 h-[3px] bg-[#5B9BD5] inline-block" />
                        {copy.legend.returnLine}
                    </span>
                    <span className="inline-flex items-center gap-2">
                        <span className="w-5 h-0 border-t-2 border-dashed border-[#B0B8C1] inline-block" />
                        {copy.legend.flue}
                    </span>
                    <span className="inline-flex items-center gap-2">
                        <span className="w-5 h-0 border-t-[3px] border-dashed border-[#F2555A] inline-block" />
                        {copy.legend.firewall}
                    </span>
                    <span className="inline-flex items-center gap-2">
                        <span className="w-5 h-0 border-t border-dashed border-[#8E99A5] inline-block" />
                        {copy.legend.behindSection}
                    </span>
                    <span className="inline-flex items-center gap-2">
                        <span className="w-3 h-3 border border-[#3FB950] inline-block" />
                        {copy.legend.control}
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                <div className="lg:col-span-7 space-y-2.5">
                    <span className="text-xs font-bold tracking-wider uppercase text-[#8E99A5] block">
                        {copy.positionsTitle}
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {visiblePositions.map((pos) => {
                            const active = highlighted === pos.tag;
                            return (
                                <button
                                    key={pos.tag}
                                    type="button"
                                    data-testid={`drawing-position-${pos.tag}`}
                                    aria-pressed={active}
                                    onClick={() =>
                                        setHighlighted((prev) => (prev === pos.tag ? '' : pos.tag))
                                    }
                                    className={`min-h-[48px] p-3 rounded-xl border text-left cursor-pointer flex items-start gap-3 transition ${
                                        active
                                            ? 'border-[#FF8A3D] bg-[#1F2933] text-[#F5F3EE]'
                                            : 'border-[#26313B] bg-[#151C23] text-[#F5F3EE] hover:border-[#FF8A3D]'
                                    }`}
                                >
                                    <span
                                        className={`min-w-[34px] h-[26px] px-1.5 rounded-full border border-[#FF8A3D] inline-flex items-center justify-center text-xs font-bold shrink-0 ${
                                            active
                                                ? 'bg-[#FF8A3D] text-[#0B0F13]'
                                                : 'bg-[#0B0F13] text-[#F5F3EE]'
                                        }`}
                                    >
                                        {pos.tag}
                                    </span>
                                    <span className="flex flex-col gap-0.5 min-w-0">
                                        <span className="font-semibold text-sm leading-snug">
                                            {pos.name}
                                        </span>
                                        <span className="text-xs text-[#8E99A5] leading-snug">
                                            {pos.spec}
                                        </span>
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="lg:col-span-5 space-y-2.5">
                    <span className="text-xs font-bold tracking-wider uppercase text-[#8E99A5] block">
                        {copy.techSpecsTitle}
                    </span>
                    <dl className="rounded-xl bg-[#151C23] border border-[#26313B] overflow-hidden divide-y divide-[#1F2933]">
                        {(drawing.techSpecs ?? []).map((row) => (
                            <div
                                key={row.k}
                                className="flex items-baseline justify-between gap-4 px-4 py-2.5 text-xs sm:text-sm"
                            >
                                <dt className="text-[#8E99A5]">{row.k}</dt>
                                <dd className="font-semibold text-[#F5F3EE] text-right">{row.v}</dd>
                            </div>
                        ))}
                    </dl>
                    <a
                        href={rfqHref}
                        className="w-full min-h-[48px] inline-flex items-center justify-center rounded-lg bg-[#C2410C] text-white font-bold text-sm hover:brightness-110 transition"
                    >
                        {copy.ctaForModel(model.code)}
                    </a>
                </div>
            </div>
        </section>
    );
}
void ALL_TAGS;
