'use client';

import { useState } from 'react';
import type { AppLocale } from '../i18n/routing';
import {
    PUMP_CURVE_MODELS,
    calcPumpHeadAtFlow,
    type HydronicNode6In1Result,
} from '../lib/heat-load-calc';

export type GilesCadTabId = 'boiler' | 'buffer' | 'vessel' | 'valve' | 'manifold' | 'pump';

const TAB_INDEX_TO_ID: ReadonlyArray<GilesCadTabId> = [
    'boiler',
    'buffer',
    'vessel',
    'valve',
    'manifold',
    'pump',
];

interface SchematicCopy {
    panelTitle: string;
    panelHint: string;
    flowBtnLabel: string;
    svgAria: string;
    legendSupply: string;
    legendReturn: string;
    legendStandard: string;
    sourceHeader: string;
    loadOk: (pct: number) => string;
    loadUndersized: string;
    teplomixLabel: string;
    bufferTitle: (volL: number) => string;
    bufferSub: (lPerKw: number, kw: number) => string;
    bufferNotNeeded: string;
    bufferNotNeededSub: string;
    pumpTitle: (code: string) => string;
    vesselTitle: (volL: number) => string;
    vesselSub: (pfBar: string) => string;
    vesselErrorSub: string;
    radiatorsLabel: (kw: string) => string;
    radiatorsSub: (flowLh: number, dn: string, kvs: string) => string;
    ufhCollectorTitle: (kw: string, loops: number) => string;
    ufhCollectorSub: (loopLenM: number, fluxWm2: number, pumpCode: string) => string;
    ufhSummaryLine: (loops: number, loopLenM: number, fluxWm2: number) => string;
    balancingNodeLabel: (dn: string, kvs: string) => string;
    chartTitle: string;
    chartAria: string;
    chartAxisQ: string;
    chartAxisH: string;
    chartOperatingPoint: (qM3h: string, hM: string) => string;
    chartLegendPump: string;
    chartLegendSystem: string;
}

const SCHEMATIC_COPY: Record<AppLocale, SchematicCopy> = {
    lt: {
        panelTitle: 'Hidraulinė mazgo schema',
        panelHint: 'Užveskite arba paspauskite mazgo elementą',
        flowBtnLabel: '● Srautas',
        svgAria: 'Hidraulinė mazgo schema su apskaičiuotais parametrais',
        legendSupply: 'Padavimas T1',
        legendReturn: 'Grįžtamas T2',
        legendStandard: 'EN 12828 · Darcy–Weisbach',
        sourceHeader: '[01] ŠILUMOS ŠALTINIS',
        loadOk: (pct) => `${pct} % galios`,
        loadUndersized: 'per maža galia',
        teplomixLabel: 'HERZ Teplomix 61 °C',
        bufferTitle: (volL) => `[02] Akumuliacinė talpa ${volL} L`,
        bufferSub: (lPerKw, kw) => `${lPerKw} L/kW × ${kw.toFixed(1).replace('.', ',')} kW`,
        bufferNotNeeded: 'nebūtina',
        bufferNotNeededSub: 'Šiam šilumos šaltiniui talpa nebūtina',
        pumpTitle: (code) => `[06] Siurblys P1 ${code}`,
        vesselTitle: (volL) => `[03] Statico ${volL} L`,
        vesselSub: (pfBar) => `EN 12828 · užpildyti ${pfBar} bar`,
        vesselErrorSub: 'Per mažas apsauginio vožtuvo slėgis',
        radiatorsLabel: (kw) => `Radiatoriai · ${kw} kW`,
        radiatorsSub: (flowLh, dn, kvs) => `${flowLh} l/h · ${dn} · Kvs ${kvs}`,
        ufhCollectorTitle: (kw, loops) => `[05] IMI Dynacon · ${loops} kont. (${kw} kW)`,
        ufhCollectorSub: (loopLenM, fluxWm2, pumpCode) =>
            `${loopLenM} m kontūras · ${fluxWm2} W/m² · P2 ${pumpCode}`,
        ufhSummaryLine: (loops, loopLenM, fluxWm2) =>
            `[05] IMI Dynacon · ${loops} kont. · ${loopLenM} m · ${fluxWm2} W/m²`,
        balancingNodeLabel: (dn, kvs) => `[04] ${dn} · Kvs ${kvs}`,
        chartTitle: 'Siurblių Q–H charakteristikos ir sistemos pasipriešinimo kreivė',
        chartAria: 'Siurblių Q–H kreivės ir hidraulinis darbo taškas',
        chartAxisQ: 'Q, m³/h',
        chartAxisH: 'H, m v. st.',
        chartOperatingPoint: (qM3h, hM) => `Darbo taškas: ${qM3h} m³/h · ${hM} m v. st.`,
        chartLegendPump: 'Wilo Para 25/4, Wilo Para 25/6, Wilo Para 25/8',
        chartLegendSystem: 'Sistemos pasipriešinimo parabolė H(Q)',
    },
    en: {
        panelTitle: 'Live Hydronic Node Schematic',
        panelHint: 'Hover or click a component node to switch tab',
        flowBtnLabel: '● Flow',
        svgAria: 'Live hydronic node schematic with calculated parameters',
        legendSupply: 'Supply T1',
        legendReturn: 'Return T2',
        legendStandard: 'EN 12828 · Darcy–Weisbach',
        sourceHeader: '[01] HEAT SOURCE',
        loadOk: (pct) => `${pct}% capacity`,
        loadUndersized: 'undersized source',
        teplomixLabel: 'HERZ Teplomix 61 °C',
        bufferTitle: (volL) => `[02] Buffer Tank ${volL} L`,
        bufferSub: (lPerKw, kw) => `${lPerKw} L/kW × ${kw.toFixed(1)} kW`,
        bufferNotNeeded: 'not required',
        bufferNotNeededSub: 'No buffer tank required for this heat source',
        pumpTitle: (code) => `[06] Pump P1 ${code}`,
        vesselTitle: (volL) => `[03] Statico ${volL} L`,
        vesselSub: (pfBar) => `EN 12828 · cold fill ${pfBar} bar`,
        vesselErrorSub: 'Safety valve pressure too low for static height',
        radiatorsLabel: (kw) => `Radiators · ${kw} kW`,
        radiatorsSub: (flowLh, dn, kvs) => `${flowLh} l/h · ${dn} · Kvs ${kvs}`,
        ufhCollectorTitle: (kw, loops) => `[05] IMI Dynacon · ${loops} loops (${kw} kW)`,
        ufhCollectorSub: (loopLenM, fluxWm2, pumpCode) =>
            `${loopLenM} m/loop · ${fluxWm2} W/m² · P2 ${pumpCode}`,
        ufhSummaryLine: (loops, loopLenM, fluxWm2) =>
            `[05] IMI Dynacon · ${loops} loops · ${loopLenM} m · ${fluxWm2} W/m²`,
        balancingNodeLabel: (dn, kvs) => `[04] ${dn} · Kvs ${kvs}`,
        chartTitle: 'Pump Q–H Performance Curves & System Resistance Parabola',
        chartAria: 'Pump Q–H curves and hydraulic operating point',
        chartAxisQ: 'Q, m³/h',
        chartAxisH: 'H, m WC',
        chartOperatingPoint: (qM3h, hM) => `Operating point: ${qM3h} m³/h · ${hM} m WC`,
        chartLegendPump: 'Wilo Para 25/4, Wilo Para 25/6, Wilo Para 25/8',
        chartLegendSystem: 'System resistance parabola H(Q)',
    },
    pl: {
        panelTitle: 'Schemat hydrauliczny węzła',
        panelHint: 'Najedź lub kliknij element węzła, aby przełączyć kartę',
        flowBtnLabel: '● Przepływ',
        svgAria: 'Schemat hydrauliczny węzła z obliczonymi parametrami',
        legendSupply: 'Zasilanie T1',
        legendReturn: 'Powrót T2',
        legendStandard: 'EN 12828 · Darcy–Weisbach',
        sourceHeader: '[01] ŹRÓDŁO CIEPŁA',
        loadOk: (pct) => `${pct}% mocy`,
        loadUndersized: 'zbyt mała moc',
        teplomixLabel: 'HERZ Teplomix 61 °C',
        bufferTitle: (volL) => `[02] Bufor ciepła ${volL} L`,
        bufferSub: (lPerKw, kw) => `${lPerKw} L/kW × ${kw.toFixed(1).replace('.', ',')} kW`,
        bufferNotNeeded: 'niewymagany',
        bufferNotNeededSub: 'Bufor ciepła nie jest wymagany dla tego źródła',
        pumpTitle: (code) => `[06] Pompa P1 ${code}`,
        vesselTitle: (volL) => `[03] Statico ${volL} L`,
        vesselSub: (pfBar) => `EN 12828 · ciśnienie wstępne ${pfBar} bar`,
        vesselErrorSub: 'Zbyt niskie ciśnienie zaworu bezpieczeństwa',
        radiatorsLabel: (kw) => `Grzejniki · ${kw} kW`,
        radiatorsSub: (flowLh, dn, kvs) => `${flowLh} l/h · ${dn} · Kvs ${kvs}`,
        ufhCollectorTitle: (kw, loops) => `[05] IMI Dynacon · ${loops} obw. (${kw} kW)`,
        ufhCollectorSub: (loopLenM, fluxWm2, pumpCode) =>
            `${loopLenM} m pętla · ${fluxWm2} W/m² · P2 ${pumpCode}`,
        ufhSummaryLine: (loops, loopLenM, fluxWm2) =>
            `[05] IMI Dynacon · ${loops} obw. · ${loopLenM} m · ${fluxWm2} W/m²`,
        balancingNodeLabel: (dn, kvs) => `[04] ${dn} · Kvs ${kvs}`,
        chartTitle: 'Charakterystyki Q–H pomp i parabola oporów instalacji',
        chartAria: 'Krzywe Q–H pomp obiegowych i punkt pracy',
        chartAxisQ: 'Q, m³/h',
        chartAxisH: 'H, m sł. w.',
        chartOperatingPoint: (qM3h, hM) => `Punkt pracy: ${qM3h} m³/h · ${hM} m sł. w.`,
        chartLegendPump: 'Wilo Para 25/4, Wilo Para 25/6, Wilo Para 25/8',
        chartLegendSystem: 'Parabola oporów instalacji H(Q)',
    },
    ru: {
        panelTitle: 'Гидравлическая схема узла',
        panelHint: 'Наведите или нажмите на элемент узла для переключения вкладки',
        flowBtnLabel: '● Поток',
        svgAria: 'Гидравлическая схема узла с расчетными параметрами',
        legendSupply: 'Подача T1',
        legendReturn: 'Обратка T2',
        legendStandard: 'EN 12828 · Дарси–Вейсбах',
        sourceHeader: '[01] ИСТОЧНИК ТЕПЛА',
        loadOk: (pct) => `${pct}% мощности`,
        loadUndersized: 'малая мощность',
        teplomixLabel: 'HERZ Teplomix 61 °C',
        bufferTitle: (volL) => `[02] Буферный бак ${volL} л`,
        bufferSub: (lPerKw, kw) => `${lPerKw} л/кВт × ${kw.toFixed(1).replace('.', ',')} кВт`,
        bufferNotNeeded: 'не требуется',
        bufferNotNeededSub: 'Для данного источника тепла буфер не требуется',
        pumpTitle: (code) => `[06] Насос P1 ${code}`,
        vesselTitle: (volL) => `[03] Statico ${volL} л`,
        vesselSub: (pfBar) => `EN 12828 · давление заполнения ${pfBar} бар`,
        vesselErrorSub: 'Слишком низкое давление предохранительного клапана',
        radiatorsLabel: (kw) => `Радиаторы · ${kw} кВт`,
        radiatorsSub: (flowLh, dn, kvs) => `${flowLh} л/ч · ${dn} · Kvs ${kvs}`,
        ufhCollectorTitle: (kw, loops) => `[05] IMI Dynacon · ${loops} конт. (${kw} кВт)`,
        ufhCollectorSub: (loopLenM, fluxWm2, pumpCode) =>
            `${loopLenM} м контур · ${fluxWm2} Вт/м² · P2 ${pumpCode}`,
        ufhSummaryLine: (loops, loopLenM, fluxWm2) =>
            `[05] IMI Dynacon · ${loops} конт. · ${loopLenM} м · ${fluxWm2} Вт/м²`,
        balancingNodeLabel: (dn, kvs) => `[04] ${dn} · Kvs ${kvs}`,
        chartTitle: 'Характеристики насосов Q–H и кривая сопротивления системы',
        chartAria: 'Кривые насосов Q–H и рабочая точка',
        chartAxisQ: 'Q, м³/ч',
        chartAxisH: 'H, м вод. ст.',
        chartOperatingPoint: (qM3h, hM) => `Рабочая точка: ${qM3h} м³/ч · ${hM} м вод. ст.`,
        chartLegendPump: 'Wilo Para 25/4, Wilo Para 25/6, Wilo Para 25/8',
        chartLegendSystem: 'Парабола сопротивления системы H(Q)',
    },
};

function fmtNum(val: number, decimals: number, locale: AppLocale): string {
    const fixed = Number(val).toFixed(decimals);
    return locale === 'en' ? fixed : fixed.replace('.', ',');
}

function fmtKvs(kvs: number, locale: AppLocale): string {
    return fmtNum(kvs, kvs < 1 ? 2 : 1, locale);
}

function renderSvgTag(
    x: number,
    y: number,
    text: string,
    variant: 's' | 'r' | 'n',
    center = false,
) {
    const width = Math.ceil(text.length * 6.5 + 16);
    const rxPos = center ? x - width / 2 : x;
    const stroke = variant === 's' ? '#F26B21' : variant === 'r' ? '#3FA9F5' : '#4A5766';
    const fillText = variant === 's' ? '#F26B21' : variant === 'r' ? '#3FA9F5' : '#D5DDE5';
    return (
        <g className={`tag ${variant}`}>
            <rect
                x={rxPos}
                y={y}
                width={width}
                height={18}
                rx={3}
                fill="#0C1117"
                stroke={stroke}
                strokeWidth={1}
            />
            <text
                x={rxPos + width / 2}
                y={y + 13}
                textAnchor="middle"
                fill={fillText}
                fontSize={10.5}
                fontWeight={600}
            >
                {text}
            </text>
        </g>
    );
}

export interface GilesLiveHydronicSchematicProps {
    calc: HydronicNode6In1Result;
    activeTab: GilesCadTabId;
    onSelectTab: (tab: GilesCadTabId) => void;
    locale?: AppLocale;
}

export function GilesLiveHydronicSchematic({
    calc,
    activeTab,
    onSelectTab,
    locale = 'lt',
}: GilesLiveHydronicSchematicProps) {
    const [flowActive, setFlowActive] = useState<boolean>(true);
    const [hoveredNodeKey, setHoveredNodeKey] = useState<string | null>(null);
    const copy = SCHEMATIC_COPY[locale] ?? SCHEMATIC_COPY.lt;

    const hasBuf = calc.bufferVolumeL > 0;
    const hasR = calc.hasRadiators;
    const hasU = calc.hasUfh;
    const isSolid = calc.sourceSpec.isSolidFuel;
    const endS = hasU ? 560 : 520;
    const startR = hasR ? 800 : 560;

    const ufhLoopsCount = hasU ? Math.min(Math.max(1, calc.ufh.nLoops), 12) : 0;
    const ufhStep = ufhLoopsCount > 0 ? 150 / ufhLoopsCount : 150;
    const ufhW = Math.min(10, ufhStep - 4);

    const radiatorFinsPath = (() => {
        let d = '';
        for (let x = 612; x < 760; x += 12) {
            d += `M${x} 48V80`;
        }
        return d;
    })();

    const tooltips: Record<string, [string, string]> = {
        src: [
            `${calc.sourceSpec.shortLabel[locale]} · ${fmtNum(calc.recommendedPowerKw, 1, locale)} kW`,
            `${copy.loadOk(calc.sourceLoadPct)} · ${calc.sourceSpec.minKw}–${calc.sourceSpec.maxKw} kW`,
        ],
        buf: hasBuf
            ? [
                  copy.bufferTitle(calc.bufferVolumeL),
                  copy.bufferSub(calc.sourceSpec.bufferLitersPerKw, calc.recommendedPowerKw),
              ]
            : [copy.bufferTitle(0), copy.bufferNotNeededSub],
        vessel: calc.vessel.pressureValid
            ? [
                  copy.vesselTitle(calc.vessel.standardVesselL),
                  copy.vesselSub(fmtNum(calc.vessel.coldFillBar, 1, locale)),
              ]
            : [copy.vesselTitle(calc.vessel.standardVesselL), copy.vesselErrorSub],
        rad: [
            copy.radiatorsLabel(fmtNum(calc.radiatorPowerKw, 1, locale)),
            copy.radiatorsSub(
                calc.radiatorFlowLh,
                calc.radiatorPipe.dn,
                fmtKvs(calc.radiatorKvs, locale),
            ),
        ],
        ufh: [
            copy.ufhCollectorTitle(fmtNum(calc.ufhPowerKw, 1, locale), calc.ufh.nLoops),
            copy.ufhCollectorSub(
                calc.ufh.singleLoopLengthM,
                calc.ufh.specificHeatFluxWm2,
                calc.ufh.secondaryPump.shortCode,
            ),
        ],
        p1: [
            copy.pumpTitle(calc.pump.selectedPump.shortCode),
            `${calc.totalFlowLh} l/h · ${ calc.mainPipe.dn } · Kvs ${fmtKvs(calc.mainKvs, locale)} · H ${fmtNum(calc.pump.headM, 1, locale)} m`,
        ],
    };

    const handleTabSelect = (tabIdx: number) => {
        const mapped = TAB_INDEX_TO_ID[tabIdx] ?? 'boiler';
        onSelectTab(mapped);
    };

    const activeTooltip = hoveredNodeKey ? tooltips[hoveredNodeKey] : null;

    return (
        <div
            data-testid="live-hydronic-schematic"
            className="relative border border-[#2C3742] bg-[#0C1117] text-[#ECEFF2] rounded-none overflow-hidden"
        >
            {/* Header Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 border-b border-[#1C2530] text-xs text-[#93A1B0]">
                <div className="flex flex-wrap items-center gap-3">
                    <span className="font-bold text-[#F26B21]">{copy.panelTitle}</span>
                    <span className="text-[#93A1B0]">{copy.panelHint}</span>
                </div>
                <button
                    type="button"
                    data-testid="calculator-flow-toggle"
                    aria-pressed={flowActive}
                    onClick={() => setFlowActive((prev) => !prev)}
                    className={`px-2.5 py-1 text-xs font-bold border rounded-none cursor-pointer transition-colors ${
                        flowActive
                            ? 'border-[#F26B21] text-[#F26B21] bg-[#141C26]'
                            : 'border-[#2A3440] text-[#93A1B0] bg-transparent'
                    }`}
                >
                    {copy.flowBtnLabel}
                </button>
            </div>

            {/* Interactive Procedurally-Redrawn SVG Schematic */}
            <div className="overflow-x-auto">
                <svg
                    id="k-svg"
                    viewBox="0 0 900 360"
                    role="img"
                    aria-label={copy.svgAria}
                    className={`block w-full h-auto min-w-[640px] ${
                        flowActive ? '' : 'noflow paused'
                    }`}
                >
                    <defs>
                        <pattern
                            id="k-g20"
                            width="20"
                            height="20"
                            patternUnits="userSpaceOnUse"
                        >
                            <path
                                d="M20 0H0V20"
                                fill="none"
                                stroke="#131B24"
                                strokeWidth="1"
                            />
                        </pattern>
                        <pattern
                            id="k-g100"
                            width="100"
                            height="100"
                            patternUnits="userSpaceOnUse"
                        >
                            <rect width="100" height="100" fill="#0C1117" />
                            <rect width="100" height="100" fill="url(#k-g20)" />
                            <path
                                d="M100 0H0V100"
                                fill="none"
                                stroke="#18222D"
                                strokeWidth="1"
                            />
                        </pattern>
                        <linearGradient id="k-strat" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0" stopColor="#5A2A12" />
                            <stop offset="0.5" stopColor="#2A2230" />
                            <stop offset="1" stopColor="#12304A" />
                        </linearGradient>
                        <linearGradient
                            id="k-ufh"
                            x1="0"
                            y1="153"
                            x2="0"
                            y2="227"
                            gradientUnits="userSpaceOnUse"
                        >
                            <stop offset="0" stopColor="#F26B21" />
                            <stop offset="1" stopColor="#3FA9F5" />
                        </linearGradient>
                        <filter id="k-glow" x="-20%" y="-20%" width="140%" height="140%">
                            <feDropShadow
                                dx="0"
                                dy="0"
                                stdDeviation="3"
                                floodColor="#F26B21"
                                floodOpacity="0.55"
                            />
                        </filter>
                        <style>{`
                            #k-svg .pipe { fill: none; stroke-width: 3; stroke-linejoin: miter; transition: opacity .3s; }
                            #k-svg .sup { stroke: #F26B21; }
                            #k-svg .ret { stroke: #3FA9F5; }
                            #k-svg .mix { stroke: #F7A267; }
                            #k-svg .bar { stroke-width: 6; }
                            #k-svg .loop { fill: none; stroke-width: 1.6; }
                            #k-svg .flow { fill: none; stroke: #FFE6D4; stroke-width: 1.6; stroke-dasharray: 2 14; animation: kFlow 1.1s linear infinite; transition: opacity .3s; }
                            #k-svg .flow.r { stroke: #D6EEFF; }
                            #k-svg.noflow .flow, #k-svg.paused .flow { animation: none; opacity: 0; }
                            @keyframes kFlow { to { stroke-dashoffset: -16; } }
                            #k-svg .d-flame { fill: #F26B21; opacity: .92; transform-box: fill-box; transform-origin: 50% 100%; animation: kFlick 1.6s ease-in-out infinite; }
                            @keyframes kFlick { 0%, 100% { transform: scale(1, 1); } 50% { transform: scale(.94, 1.06); } }
                            #k-svg .part { cursor: pointer; outline: none; transition: opacity .3s; }
                            #k-svg .part.on { filter: url(#k-glow); }
                            @media (prefers-reduced-motion: reduce) {
                                #k-svg .flow { animation: none; opacity: 0; }
                                #k-svg .d-flame { animation: none; }
                            }
                        `}</style>
                    </defs>

                    {/* 20-unit / 100-unit CAD Grid Background */}
                    <rect width="900" height="360" fill="url(#k-g100)" />

                    {/* Static Hydraulic Pipes */}
                    <path
                        className="pipe sup"
                        d={hasBuf ? 'M170 110H268' : 'M170 110H330'}
                    />
                    <path className="pipe sup" d={`M328 110H${endS}`} />
                    <path className="pipe ret" d={`M${startR} 270H328`} />
                    <path
                        className="pipe ret"
                        d={hasBuf ? 'M268 270H170' : 'M330 270H170'}
                    />
                    {isSolid && <path className="pipe sup" d="M226 110V258" />}
                    <path className="pipe sup" d="M196 110V94" />
                    <path className="pipe ret" d="M380 270V288" />

                    {hasR && (
                        <>
                            <path className="pipe sup" d="M520 110V60H600" />
                            <path className="pipe ret" d="M760 84H800V270" />
                        </>
                    )}

                    {hasU && (
                        <>
                            <path className="pipe sup" d="M560 110V138" />
                            <path className="pipe mix" d="M572 150H610" />
                            <path className="pipe ret" d="M610 230H560V270" />
                            <path className="pipe ret" d="M560 230V162" />
                            <path className="pipe sup bar" d="M610 150H770" />
                            <path className="pipe ret bar" d="M610 230H770" />
                        </>
                    )}

                    {/* Animated Flow Overlay Paths */}
                    <g className="flows">
                        <path className="flow" d={`M170 110H${endS}`} />
                        <path className="flow r" d={`M${startR} 270H170`} />
                        {hasR && (
                            <>
                                <path className="flow" d="M520 110V60H600" />
                                <path className="flow r" d="M760 84H800V270" />
                            </>
                        )}
                        {hasU && (
                            <>
                                <path className="flow" d="M560 110V138" />
                                <path className="flow" d="M572 150H770" />
                                <path className="flow r" d="M770 230H560V270" />
                            </>
                        )}
                        {isSolid && <path className="flow" d="M226 110V258" />}
                    </g>

                    {/* [01] Heat Source Node (Tab 0) */}
                    <g
                        data-testid="schematic-node-boiler"
                        data-tab="0"
                        tabIndex={0}
                        aria-label={copy.sourceHeader}
                        className={`part ${activeTab === 'boiler' ? 'on' : ''}`}
                        onClick={() => handleTabSelect(0)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                handleTabSelect(0);
                            }
                        }}
                        onMouseEnter={() => setHoveredNodeKey('src')}
                        onMouseLeave={() => setHoveredNodeKey(null)}
                        onFocus={() => setHoveredNodeKey('src')}
                        onBlur={() => setHoveredNodeKey(null)}
                    >
                        <rect
                            x={30}
                            y={80}
                            width={140}
                            height={220}
                            rx={6}
                            fill="#111821"
                            stroke={activeTab === 'boiler' ? '#FFB35C' : '#B9C4CF'}
                            strokeWidth={1.6}
                        />
                        <text
                            x={100}
                            y={104}
                            textAnchor="middle"
                            fill="#93A1B0"
                            fontSize={10}
                            fontWeight={700}
                        >
                            {copy.sourceHeader}
                        </text>
                        <g transform="translate(82 128) scale(1.5)">
                            {calc.sourceSpec.iconType === 'flame' && (
                                <path
                                    className="d-flame"
                                    d="M12 21c-4 0-6-3-5-6.5 1-2.5 3-3 2.5-6 3 1.5 4 4 3.5 6 1-1 1.5-2.5 1-4 3 2.5 4 5.5 3.5 7.5-.5 2-2.5 3-5.5 3z"
                                    fill="#F26B21"
                                />
                            )}
                            {calc.sourceSpec.iconType === 'fan' && (
                                <>
                                    <circle
                                        cx={12}
                                        cy={12}
                                        r={9}
                                        fill="none"
                                        stroke="#3FA9F5"
                                        strokeWidth={1.6}
                                    />
                                    <path
                                        d="M12 12c0-4 2-6 4-5s0 4-4 5zm0 0c4 0 6 2 5 4s-4 0-5-4zm0 0c0 4-2 6-4 5s0-4 4-5zm0 0c-4 0-6-2-5-4s4 0 5 4z"
                                        fill="#3FA9F5"
                                    />
                                </>
                            )}
                            {calc.sourceSpec.iconType === 'bolt' && (
                                <path
                                    d="M13 2L5 13h6l-1 9 8-12h-6z"
                                    fill="#E8B04B"
                                />
                            )}
                        </g>
                        <text
                            x={100}
                            y={196}
                            textAnchor="middle"
                            fill="#E6ECF1"
                            fontSize={13}
                            fontWeight={700}
                        >
                            {calc.sourceSpec.shortLabel[locale]}
                        </text>
                        <text
                            x={100}
                            y={228}
                            textAnchor="middle"
                            fill="#F26B21"
                            fontSize={20}
                            fontWeight={700}
                        >
                            {fmtNum(calc.recommendedPowerKw, 1, locale)} kW
                        </text>
                        <text
                            x={100}
                            y={252}
                            textAnchor="middle"
                            fill={calc.sourceLoadRatio > 1 ? '#FF7A6E' : '#93A1B0'}
                            fontSize={11}
                        >
                            {calc.sourceLoadRatio > 1
                                ? copy.loadUndersized
                                : copy.loadOk(calc.sourceLoadPct)}
                        </text>
                    </g>

                    {/* Safety Relief Valve on Supply Line */}
                    <path
                        d="M190 94H202L196 84Z"
                        fill="#0C1117"
                        stroke="#C9D3DC"
                        strokeWidth={1.4}
                        strokeLinejoin="round"
                    />
                    <path
                        d="M196 84l-4-3 8-3-8-3 4-2"
                        fill="none"
                        stroke="#C9D3DC"
                        strokeWidth={1.2}
                    />
                    <text
                        x={196}
                        y={64}
                        textAnchor="middle"
                        fill="#93A1B0"
                        fontSize={11}
                    >
                        {fmtNum(calc.vessel.maxWorkingBar + 0.5, 1, locale)} bar
                    </text>

                    {/* HERZ Teplomix 61 °C Anticondensation Return Protection Loop (Solid Fuel Only) */}
                    {isSolid && (
                        <g data-testid="schematic-node-teplomix">
                            <path
                                d="M214 264L226 270L214 276ZM238 264L226 270L238 276ZM220 258L226 270L232 258Z"
                                fill="#0C1117"
                                stroke="#FFB35C"
                                strokeWidth={1.4}
                                strokeLinejoin="round"
                            />
                            <text
                                x={218}
                                y={298}
                                textAnchor="middle"
                                fill="#FFB35C"
                                fontSize={11}
                                fontWeight={700}
                            >
                                {copy.teplomixLabel}
                            </text>
                            <circle cx={226} cy={110} r={3} fill="#C9D3DC" />
                        </g>
                    )}

                    {/* [02] Thermally-Stratified Buffer Tank Node (Tab 1) */}
                    <g
                        data-testid="schematic-node-buffer"
                        data-tab="1"
                        tabIndex={0}
                        aria-label={copy.bufferTitle(calc.bufferVolumeL)}
                        className={`part ${activeTab === 'buffer' ? 'on' : ''}`}
                        onClick={() => handleTabSelect(1)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                handleTabSelect(1);
                            }
                        }}
                        onMouseEnter={() => setHoveredNodeKey('buf')}
                        onMouseLeave={() => setHoveredNodeKey(null)}
                        onFocus={() => setHoveredNodeKey('buf')}
                        onBlur={() => setHoveredNodeKey(null)}
                    >
                        {hasBuf ? (
                            <>
                                <rect
                                    x={268}
                                    y={78}
                                    width={60}
                                    height={224}
                                    rx={30}
                                    fill="url(#k-strat)"
                                    stroke={activeTab === 'buffer' ? '#FFB35C' : '#B9C4CF'}
                                    strokeWidth={1.6}
                                />
                                {[120, 190, 260].map((cy) => (
                                    <circle
                                        key={cy}
                                        cx={334}
                                        cy={cy}
                                        r={3}
                                        fill="#0C1117"
                                        stroke="#93A1B0"
                                    />
                                ))}
                                {renderSvgTag(
                                    298,
                                    48,
                                    `[02] ${calc.bufferVolumeL} L`,
                                    'n',
                                    true,
                                )}
                            </>
                        ) : (
                            <>
                                <rect
                                    x={268}
                                    y={78}
                                    width={60}
                                    height={224}
                                    rx={30}
                                    fill="#0C1117"
                                    fillOpacity={0}
                                    stroke="#3A4654"
                                    strokeDasharray="5 4"
                                />
                                <text
                                    x={298}
                                    y={194}
                                    textAnchor="middle"
                                    fill="#7A8796"
                                    fontSize={10}
                                >
                                    {copy.bufferNotNeeded}
                                </text>
                            </>
                        )}
                    </g>

                    {/* [06] Primary Circulation Pump P1 Node (Tab 5) */}
                    <g
                        data-testid="schematic-node-pump"
                        data-tab="5"
                        tabIndex={0}
                        aria-label={copy.pumpTitle(calc.pump.selectedPump.shortCode)}
                        className={`part ${activeTab === 'pump' ? 'on' : ''}`}
                        onClick={() => handleTabSelect(5)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                handleTabSelect(5);
                            }
                        }}
                        onMouseEnter={() => setHoveredNodeKey('p1')}
                        onMouseLeave={() => setHoveredNodeKey(null)}
                        onFocus={() => setHoveredNodeKey('p1')}
                        onBlur={() => setHoveredNodeKey(null)}
                    >
                        <circle
                            cx={380}
                            cy={110}
                            r={12}
                            fill="#0C1117"
                            stroke={activeTab === 'pump' ? '#FFB35C' : '#C9D3DC'}
                            strokeWidth={1.6}
                        />
                        <path d="M374 102L389 110L374 118Z" fill="#C9D3DC" />
                        {renderSvgTag(380, 48, `${calc.totalFlowLh} l/h`, 's', true)}
                        <text
                            x={380}
                            y={142}
                            textAnchor="middle"
                            fill="#E6ECF1"
                            fontSize={11}
                            fontWeight={700}
                        >
                            [06] P1 {calc.pump.selectedPump.shortCode}
                        </text>
                        <text
                            x={380}
                            y={156}
                            textAnchor="middle"
                            fill="#93A1B0"
                            fontSize={10}
                        >
                            H {fmtNum(calc.pump.headM, 1, locale)} m
                        </text>
                    </g>

                    {/* [03] Expansion Vessel Statico Node (Tab 2) */}
                    <g
                        data-testid="schematic-node-vessel"
                        data-tab="2"
                        tabIndex={0}
                        aria-label={copy.vesselTitle(calc.vessel.standardVesselL)}
                        className={`part ${activeTab === 'vessel' ? 'on' : ''}`}
                        onClick={() => handleTabSelect(2)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                handleTabSelect(2);
                            }
                        }}
                        onMouseEnter={() => setHoveredNodeKey('vessel')}
                        onMouseLeave={() => setHoveredNodeKey(null)}
                        onFocus={() => setHoveredNodeKey('vessel')}
                        onBlur={() => setHoveredNodeKey(null)}
                    >
                        <rect
                            x={366}
                            y={288}
                            width={28}
                            height={48}
                            rx={14}
                            fill="#18212C"
                            stroke={activeTab === 'vessel' ? '#FFB35C' : '#B9C4CF'}
                            strokeWidth={1.4}
                        />
                        <path d="M366 312H394" stroke="#6F7D8C" />
                        <text
                            x={402}
                            y={310}
                            fill="#E6ECF1"
                            fontSize={12}
                            fontWeight={700}
                        >
                            [03] Statico{' '}
                            {calc.vessel.pressureValid
                                ? `${calc.vessel.standardVesselL} L`
                                : '!'}
                        </text>
                        <text x={402} y={326} fill="#93A1B0" fontSize={10}>
                            P0 {fmtNum(calc.vessel.prechargeBar, 1, locale)} bar
                        </text>
                    </g>

                    {/* Main Supply T1 / Return T2 & [04] Balancing Valve Tag */}
                    {renderSvgTag(430, 82, `T1 ${calc.supplyTempC} °C`, 's')}
                    {renderSvgTag(430, 278, `T2 ${calc.returnTempC} °C`, 'r')}
                    <g
                        data-testid="schematic-node-valve"
                        data-tab="3"
                        tabIndex={0}
                        aria-label={copy.balancingNodeLabel(
                            calc.mainPipe.dn,
                            fmtKvs(calc.mainKvs, locale),
                        )}
                        className={`part ${activeTab === 'valve' ? 'on' : ''}`}
                        onClick={() => handleTabSelect(3)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                handleTabSelect(3);
                            }
                        }}
                        onMouseEnter={() => setHoveredNodeKey('rad')}
                        onMouseLeave={() => setHoveredNodeKey(null)}
                    >
                        {renderSvgTag(
                            430,
                            242,
                            copy.balancingNodeLabel(
                                calc.mainPipe.dn,
                                fmtKvs(calc.mainKvs, locale),
                            ),
                            'n',
                        )}
                    </g>

                    {/* [04] Radiator Branch (Shown when UFH share < 100%) */}
                    {hasR && (
                        <>
                            <circle cx={520} cy={110} r={3} fill="#C9D3DC" />
                            <g
                                data-tab="3"
                                tabIndex={0}
                                aria-label={copy.radiatorsLabel(
                                    fmtNum(calc.radiatorPowerKw, 1, locale),
                                )}
                                className={`part ${activeTab === 'valve' ? 'on' : ''}`}
                                onClick={() => handleTabSelect(3)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        handleTabSelect(3);
                                    }
                                }}
                                onMouseEnter={() => setHoveredNodeKey('rad')}
                                onMouseLeave={() => setHoveredNodeKey(null)}
                            >
                                <rect
                                    x={600}
                                    y={44}
                                    width={160}
                                    height={40}
                                    rx={3}
                                    fill="#18212C"
                                    stroke={activeTab === 'valve' ? '#FFB35C' : '#B9C4CF'}
                                    strokeWidth={1.4}
                                />
                                <path
                                    d={radiatorFinsPath}
                                    stroke="#2C3846"
                                    strokeWidth={1.2}
                                />
                                <path
                                    d="M794 148L800 160L806 148ZM794 172L800 160L806 172Z"
                                    fill="#0C1117"
                                    stroke="#C9D3DC"
                                    strokeWidth={1.4}
                                    strokeLinejoin="round"
                                />
                                <path d="M806 160H812" stroke="#C9D3DC" strokeWidth={1.2} />
                                {renderSvgTag(
                                    814,
                                    151,
                                    `Kvs ${fmtKvs(calc.radiatorKvs, locale)}`,
                                    'n',
                                )}
                                <text
                                    x={680}
                                    y={32}
                                    textAnchor="middle"
                                    fill="#93A1B0"
                                    fontSize={11}
                                >
                                    {copy.radiatorsLabel(
                                        fmtNum(calc.radiatorPowerKw, 1, locale),
                                    )}
                                </text>
                            </g>
                        </>
                    )}

                    {/* [05] Underfloor Heating Manifold & Dynamic Serpentine Loops (Tab 4) */}
                    {hasU && (
                        <>
                            <circle cx={560} cy={110} r={3} fill="#C9D3DC" />
                            <circle cx={560} cy={230} r={3} fill="#C9D3DC" />
                            <g
                                data-testid="schematic-node-ufh"
                                data-tab="4"
                                tabIndex={0}
                                aria-label={copy.ufhCollectorTitle(
                                    fmtNum(calc.ufhPowerKw, 1, locale),
                                    calc.ufh.nLoops,
                                )}
                                className={`part ${activeTab === 'manifold' ? 'on' : ''}`}
                                onClick={() => handleTabSelect(4)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        handleTabSelect(4);
                                    }
                                }}
                                onMouseEnter={() => setHoveredNodeKey('ufh')}
                                onMouseLeave={() => setHoveredNodeKey(null)}
                                onFocus={() => setHoveredNodeKey('ufh')}
                                onBlur={() => setHoveredNodeKey(null)}
                            >
                                <path
                                    d="M554 138L560 150L566 138ZM554 162L560 150L566 162ZM572 144L560 150L572 156Z"
                                    fill="#0C1117"
                                    stroke={activeTab === 'manifold' ? '#FFB35C' : '#C9D3DC'}
                                    strokeWidth={1.4}
                                    strokeLinejoin="round"
                                />
                                <circle
                                    cx={590}
                                    cy={150}
                                    r={9}
                                    fill="#0C1117"
                                    stroke={activeTab === 'manifold' ? '#FFB35C' : '#C9D3DC'}
                                    strokeWidth={1.6}
                                />
                                <path d="M586 144L596 150L586 156Z" fill="#C9D3DC" />
                                {renderSvgTag(
                                    574,
                                    120,
                                    `${calc.ufh.ufhSupplyTempC} °C`,
                                    's',
                                )}
                                {Array.from({ length: ufhLoopsCount }).map((_, idx) => {
                                    const x0 =
                                        616 + idx * ufhStep + (ufhStep - ufhW) / 2;
                                    let d = `M${x0.toFixed(1)} 153`;
                                    for (let yy = 163, kk = 0; yy <= 217; yy += 9, kk++) {
                                        const hx = kk % 2 ? x0 : x0 + ufhW;
                                        d += `V${yy}H${hx.toFixed(1)}`;
                                    }
                                    d += 'V227';
                                    return (
                                        <path
                                            key={idx}
                                            className="loop"
                                            stroke="url(#k-ufh)"
                                            d={d}
                                        />
                                    );
                                })}
                                <text
                                    x={690}
                                    y={252}
                                    textAnchor="middle"
                                    fill="#E6ECF1"
                                    fontSize={11}
                                    fontWeight={700}
                                >
                                    {copy.ufhSummaryLine(
                                        calc.ufh.nLoops,
                                        calc.ufh.singleLoopLengthM,
                                        calc.ufh.specificHeatFluxWm2,
                                    )}
                                </text>
                                <text
                                    x={590}
                                    y={178}
                                    textAnchor="middle"
                                    fill="#93A1B0"
                                    fontSize={10}
                                >
                                    P2
                                </text>
                            </g>
                        </>
                    )}
                </svg>
            </div>

            {/* Active Node Tooltip Readout */}
            {activeTooltip && (
                <div className="px-4 py-2 bg-[#101720] border-t border-[#1C2530] flex flex-wrap items-center justify-between gap-2 text-xs">
                    <strong className="text-[#F26B21]">{activeTooltip[0]}</strong>
                    <span className="text-[#C9D3DC] tabular-nums">{activeTooltip[1]}</span>
                </div>
            )}

            {/* Legend Footer */}
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 border-t border-[#1C2530] text-xs text-[#93A1B0]">
                <div className="flex flex-wrap items-center gap-4">
                    <span className="inline-flex items-center gap-2">
                        <span className="inline-block w-5 h-1 bg-[#F26B21]" />
                        {copy.legendSupply}
                    </span>
                    <span className="inline-flex items-center gap-2">
                        <span className="inline-block w-5 h-1 bg-[#3FA9F5]" />
                        {copy.legendReturn}
                    </span>
                </div>
                <span className="text-[#7A8796] font-semibold">{copy.legendStandard}</span>
            </div>
        </div>
    );
}

export interface GilesPumpQhChartProps {
    calc: HydronicNode6In1Result;
    locale?: AppLocale;
}

export function GilesPumpQhChart({ calc, locale = 'lt' }: GilesPumpQhChartProps) {
    const copy = SCHEMATIC_COPY[locale] ?? SCHEMATIC_COPY.lt;
    const W = 640;
    const H = 270;
    const l = 44;
    const rg = 16;
    const t = 28;
    const b = 36;
    const qmax = 4;
    const hmax = 10;

    const X = (q: number) => l + ((W - l - rg) * q) / qmax;
    const Y = (h: number) => H - b - ((H - b - t) * h) / hmax;

    const qOp = calc.pump.flowM3h;
    const hOp = calc.pump.headM;
    const kSys = hOp / Math.max(qOp * qOp, 1e-6);

    const sysPath = (() => {
        let sd = '';
        for (let j = 0; j <= 40; j++) {
            const qx = (qmax * j) / 40;
            const hx = kSys * qx * qx;
            if (hx > hmax) {
                sd += `L${X(Math.sqrt(hmax / kSys)).toFixed(1)} ${Y(hmax).toFixed(1)}`;
                break;
            }
            sd += `${j ? 'L' : 'M'}${X(qx).toFixed(1)} ${Y(hx).toFixed(1)}`;
        }
        return sd;
    })();

    const Qd = Math.min(qOp, qmax);
    const Hd = Math.min(hOp, hmax);
    const labelX = X(Qd) + 12 > W - 230 ? X(Qd) - 12 : X(Qd) + 12;
    const labelAnchor = X(Qd) + 12 > W - 230 ? 'end' : 'start';

    return (
        <div
            data-testid="pump-qh-chart"
            className="border border-[#2C3742] bg-[#0C1117] p-3.5 rounded-none space-y-2"
        >
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="font-bold text-[#F5F3EE]">{copy.chartTitle}</span>
                <div className="flex flex-wrap items-center gap-4 text-[#93A1B0]">
                    <span className="inline-flex items-center gap-1.5">
                        <span className="inline-block w-4 h-0.5 bg-[#F26B21]" />
                        {copy.chartLegendPump}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                        <span className="inline-block w-4 h-0.5 bg-[#3FA9F5]" />
                        {copy.chartLegendSystem}
                    </span>
                </div>
            </div>

            <svg
                viewBox="0 0 640 270"
                role="img"
                aria-label={copy.chartAria}
                className="block w-full h-auto"
            >
                {/* Horizontal H Grid Lines */}
                {[0, 2, 4, 6, 8, 10].map((h) => (
                    <g key={`h-${h}`}>
                        <line
                            x1={l}
                            x2={W - rg}
                            y1={Y(h)}
                            y2={Y(h)}
                            stroke="#1C2530"
                            strokeWidth={1}
                        />
                        <text
                            x={l - 6}
                            y={Y(h) + 3.5}
                            textAnchor="end"
                            fill="#808A95"
                            fontSize={10.5}
                        >
                            {h}
                        </text>
                    </g>
                ))}

                {/* Vertical Q Grid Lines */}
                {[0, 1, 2, 3, 4].map((q) => (
                    <g key={`q-${q}`}>
                        <line
                            x1={X(q)}
                            x2={X(q)}
                            y1={t}
                            y2={H - b}
                            stroke="#1C2530"
                            strokeWidth={1}
                        />
                        <text
                            x={X(q)}
                            y={H - b + 15}
                            textAnchor="middle"
                            fill="#808A95"
                            fontSize={10.5}
                        >
                            {q}
                        </text>
                    </g>
                ))}

                {/* Axes */}
                <line
                    x1={l}
                    x2={W - rg}
                    y1={H - b}
                    y2={H - b}
                    stroke="#4A5766"
                    strokeWidth={1}
                />
                <line
                    x1={l}
                    x2={l}
                    y1={t}
                    y2={H - b}
                    stroke="#4A5766"
                    strokeWidth={1}
                />
                <text
                    x={W - rg}
                    y={H - 4}
                    textAnchor="end"
                    fill="#93A1B0"
                    fontSize={10.5}
                    fontWeight={600}
                >
                    {copy.chartAxisQ}
                </text>
                <text
                    x={l + 10}
                    y={16}
                    textAnchor="start"
                    fill="#93A1B0"
                    fontSize={10.5}
                    fontWeight={600}
                >
                    {copy.chartAxisH}
                </text>

                {/* 3 Standard Pump Curves: Wilo Para 25/4, 25/6, 25/8 */}
                {PUMP_CURVE_MODELS.slice(0, 3).map((pump) => {
                    const steps = 32;
                    const qe = Math.min(pump.qMaxM3h, qmax);
                    let d = '';
                    for (let i = 0; i <= steps; i++) {
                        const qq = (qe * i) / steps;
                        const hh = Math.max(0, calcPumpHeadAtFlow(pump, qq));
                        d += `${i ? 'L' : 'M'}${X(qq).toFixed(1)} ${Y(hh).toFixed(1)}`;
                    }
                    const isSelected =
                        calc.pump.selectedPump.shortCode === pump.shortCode;
                    return (
                        <g key={pump.shortCode}>
                            <path
                                d={d}
                                fill="none"
                                stroke={isSelected ? '#F26B21' : '#4A5766'}
                                strokeWidth={isSelected ? 2.5 : 1.5}
                            />
                            <text
                                x={X(0) + 8}
                                y={Y(pump.hMaxM) - 5}
                                fill={isSelected ? '#FFB35C' : '#93A1B0'}
                                fontSize={11}
                                fontWeight={600}
                            >
                                {pump.model}
                            </text>
                        </g>
                    );
                })}

                {/* System Resistance Parabola H(Q) = H_op * (Q / Q_op)^2 */}
                <path
                    d={sysPath}
                    fill="none"
                    stroke="#3FA9F5"
                    strokeWidth={2}
                    strokeDasharray="5 4"
                />

                {/* Operating Point (Q_op, H_op) */}
                <circle
                    cx={X(Qd)}
                    cy={Y(Hd)}
                    r={6}
                    fill="#F26B21"
                    stroke="#0C1117"
                    strokeWidth={2}
                />
                <text
                    x={labelX}
                    y={Y(Hd) + 18}
                    textAnchor={labelAnchor}
                    fill="#ECEFF2"
                    fontSize={11}
                    fontWeight={700}
                >
                    {copy.chartOperatingPoint(
                        fmtNum(qOp, 2, locale),
                        fmtNum(hOp, 1, locale),
                    )}
                </text>
            </svg>
        </div>
    );
}
