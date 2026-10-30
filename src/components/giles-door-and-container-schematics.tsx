'use client';

import { useState } from 'react';
import type { AppLocale } from '../i18n/routing';

interface DoorLocaleCopy {
    headerTitle: string;
    beforeBtn: string;
    afterBtn: string;
    flowBtn: string;
    svgAria: string;
    stateBeforeLabel: string;
    stateAfterLabel: string;
    callC1: string;
    callC2: string;
    callA1: string;
    callA2: string;
    callB1: string;
    callB2: string;
    bottomBeforeWarn: string;
    bottomAfterOk: string;
    m1Label: string;
    m1Before: string;
    m1After: string;
    m2Label: string;
    m2Before: string;
    m2After: string;
    m3Label: string;
    m3Before: string;
    m3After: string;
}

const DOOR_I18N: Record<AppLocale, DoorLocaleCopy> = {
    lt: {
        headerTitle: 'Katilo durelių modifikacija · šoninis pjūvis',
        beforeBtn: 'Prieš perdarymą',
        afterBtn: 'Po perdarymo (MPB)',
        flowBtn: '● Srautas',
        svgAria: 'Katilo šoninis pjūvis prieš ir po modifikacijos su CNC flanšu, granulių degikliu, sraigtu ir bunkeriu',
        stateBeforeLabel: 'PRIEŠ · RANKINIS KROVIMAS',
        stateAfterLabel: 'PO · AUTOMATINIS DARBAS',
        callC1: 'Iki 30 % šilumos',
        callC2: 'išeina į kaminą be moduliacijos',
        callA1: 'Krovimo durelės',
        callA2: 'rankinis krovimas kas 4–6 val.',
        callB1: 'Malkos ar anglys',
        callB2: 'dūmai, suodžiai, budėjimas žiemą',
        bottomBeforeWarn: 'Namuose +25 °C vakare, +16 °C ryte',
        bottomAfterOk: '6–10 d. autonomija · +21,5 °C ±0,3 °C · ecoMAX valdymas telefonu',
        m1Label: 'Kuro krovimas',
        m1Before: 'kas 4–6 val.',
        m1After: 'kas 6–10 d.',
        m2Label: 'Temperatūra',
        m2Before: '+25 .. +16 °C',
        m2After: '+21,5 ±0,3 °C',
        m3Label: 'Degimas',
        m3Before: 'rankinis režimas',
        m3After: 'automatinis 8–35 kW',
    },
    en: {
        headerTitle: 'Boiler Door Retrofit · Side Cross-Section',
        beforeBtn: 'Before retrofit',
        afterBtn: 'After retrofit (MPB)',
        flowBtn: '● Flow',
        svgAria: 'Boiler side cross-section before and after modification with CNC flange, pellet burner, auger, and hopper',
        stateBeforeLabel: 'BEFORE · MANUAL LOADING',
        stateAfterLabel: 'AFTER · AUTOMATIC OPERATION',
        callC1: 'Up to 30% heat lost',
        callC2: 'escapes up chimney without modulation',
        callA1: 'Loading door',
        callA2: 'manual stoking every 4–6 hrs',
        callB1: 'Firewood or coal',
        callB2: 'smoke, soot, constant tending',
        bottomBeforeWarn: 'Indoors +25 °C in evening, +16 °C by morning',
        bottomAfterOk: '6–10 d. autonomy · +21.5 °C ±0.3 °C · ecoMAX smartphone control',
        m1Label: 'Manual labor / Loading',
        m1Before: 'every 4–6 hrs',
        m1After: 'every 6–10 days',
        m2Label: 'Temperature stability',
        m2Before: '+25 °C .. +16 °C',
        m2After: '+21.5 °C ±0.3 °C',
        m3Label: 'Fuel consumption & firing',
        m3Before: 'manual, unmodulated',
        m3After: 'automatic, modulated',
    },
    pl: {
        headerTitle: 'Modyfikacja drzwiczek kotła · przekrój boczny',
        beforeBtn: 'Przed przeróbką',
        afterBtn: 'Po przeróbce (MPB)',
        flowBtn: '● Przepływ',
        svgAria: 'Przekrój boczny kotła przed i po modyfikacji z flanszą CNC, palnikiem peletowym, podajnikiem i zasobnikiem',
        stateBeforeLabel: 'PRZED · ZAŁADUNEK RĘCZNY',
        stateAfterLabel: 'PO · PRACA AUTOMATYCZNA',
        callC1: 'Do 30% strat ciepła',
        callC2: 'ucieka w komin bez modulacji',
        callA1: 'Drzwiczki załadunkowe',
        callA2: 'ręczny załadunek co 4–6 godz.',
        callB1: 'Drewno lub węgiel',
        callB2: 'dym, sadza, dozór zimą',
        bottomBeforeWarn: 'W domu +25 °C wieczorem, +16 °C rano',
        bottomAfterOk: '6–10 dni autonomii · +21,5 °C ±0,3 °C · sterowanie ecoMAX w telefonie',
        m1Label: 'Praca ręczna / Załadunek',
        m1Before: 'co 4–6 godz.',
        m1After: 'co 6–10 dni',
        m2Label: 'Stabilność temperatury',
        m2Before: '+25 °C .. +16 °C',
        m2After: '+21,5 °C ±0,3 °C',
        m3Label: 'Zużycie paliwa i spalanie',
        m3Before: 'ręczne, bez modulacji',
        m3After: 'automatyczne, modulowane',
    },
    ru: {
        headerTitle: 'Модификация дверцы котла · боковой разрез',
        beforeBtn: 'До переделки',
        afterBtn: 'После переделки (MPB)',
        flowBtn: '● Поток',
        svgAria: 'Боковой разрез котла до и после модификации с ЧПУ-фланцем, пеллетной горелкой, шнеком и бункером',
        stateBeforeLabel: 'ДО · РУЧНАЯ ЗАГРУЗКА',
        stateAfterLabel: 'ПОСЛЕ · АВТОМАТИЧЕСКАЯ РАБОТА',
        callC1: 'До 30 % тепла',
        callC2: 'уходит в дымоход без модуляции',
        callA1: 'Загрузочная дверца',
        callA2: 'ручная загрузка каждые 4–6 ч',
        callB1: 'Дрова или уголь',
        callB2: 'дым, сажа, дежурство зимой',
        bottomBeforeWarn: 'Дома +25 °C вечером, +16 °C утром',
        bottomAfterOk: '6–10 дн. автономии · +21,5 °C ±0,3 °C · управление ecoMAX со смартфона',
        m1Label: 'Ручной труд / Загрузка',
        m1Before: 'каждые 4–6 ч',
        m1After: 'раз в 6–10 дн.',
        m2Label: 'Стабильность температуры',
        m2Before: '+25 °C .. +16 °C',
        m2After: '+21,5 °C ±0,3 °C',
        m3Label: 'Расход топлива и горение',
        m3Before: 'ручное, без модуляции',
        m3After: 'автоматическое, модулируемое',
    },
};

export function GilesDoorConversionSchematic({
    locale,
    testId = 'home-conversion-cad-blueprint',
    flangeCode = 'Ø90–140',
    powerKw,
    hopperLabel = '350 L',
}: {
    locale: AppLocale;
    testId?: 'home-conversion-cad-blueprint' | 'boiler-conversion-cad-blueprint';
    flangeCode?: string;
    powerKw?: number;
    hopperLabel?: string;
}) {
    const c = DOOR_I18N[locale];
    const [doorState, setDoorState] = useState<'before' | 'after'>('after');
    const [flowActive, setFlowActive] = useState(true);
    const isAfter = doorState === 'after';

    return (
        <div
            data-testid={testId}
            className="rounded-md border border-[#232D38] bg-[#0C1117] text-[#ECEFF2] overflow-hidden"
        >
            <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5 border-b border-[#1C2530] text-xs">
                <span className="text-[#F26B21] font-semibold">
                    {c.headerTitle} {powerKw ? `· ${powerKw} kW` : ''}
                </span>
                <div className="flex flex-wrap items-center gap-2">
                    <div
                        data-testid="door-conversion-toggle"
                        role="group"
                        aria-label={c.headerTitle}
                        className="inline-flex rounded-xs border border-[#2A3440] overflow-hidden"
                    >
                        <button
                            type="button"
                            data-door="before"
                            aria-pressed={!isAfter}
                            onClick={() => setDoorState('before')}
                            className={`px-2.5 py-1 text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                                !isAfter
                                    ? 'bg-[#F26B21] text-[#0C1117]'
                                    : 'bg-transparent text-[#A6AFB9] hover:text-white'
                            }`}
                        >
                            {c.beforeBtn}
                        </button>
                        <button
                            type="button"
                            data-door="after"
                            aria-pressed={isAfter}
                            onClick={() => setDoorState('after')}
                            className={`px-2.5 py-1 text-xs font-semibold whitespace-nowrap border-l border-[#2A3440] cursor-pointer transition-colors ${
                                isAfter
                                    ? 'bg-[#F26B21] text-[#0C1117]'
                                    : 'bg-transparent text-[#A6AFB9] hover:text-white'
                            }`}
                        >
                            {c.afterBtn}
                        </button>
                    </div>
                    <button
                        type="button"
                        data-testid="door-flow-toggle"
                        aria-pressed={flowActive}
                        onClick={() => setFlowActive((v) => !v)}
                        className={`px-2.5 py-1 rounded-xs border text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                            flowActive
                                ? 'border-[#F26B21] text-[#F26B21]'
                                : 'border-[#2A3440] text-[#A6AFB9]'
                        }`}
                    >
                        {c.flowBtn}
                    </button>
                </div>
            </div>

            <div className="relative w-full bg-[#0C1117] px-2 pt-2">
                <svg
                    id="door-svg"
                    data-state={doorState}
                    viewBox="0 0 800 360"
                    role="img"
                    aria-label={c.svgAria}
                    className={`w-full h-auto block ${!flowActive ? 'paused noflow' : ''}`}
                >
                    <defs>
                        <pattern id="door-g20" width="20" height="20" patternUnits="userSpaceOnUse">
                            <path d="M20 0H0V20" fill="none" stroke="#131B24" strokeWidth="1" />
                        </pattern>
                        <pattern id="door-g100" width="100" height="100" patternUnits="userSpaceOnUse">
                            <rect width="100" height="100" fill="#0C1117" />
                            <rect width="100" height="100" fill="url(#door-g20)" />
                            <path d="M100 0H0V100" fill="none" stroke="#18222D" strokeWidth="1" />
                        </pattern>
                        <pattern id="door-pel" width="8" height="8" patternUnits="userSpaceOnUse">
                            <rect width="8" height="8" fill="#2E2410" />
                            <circle cx="2" cy="2" r="1.3" fill="#E8B04B" opacity="0.55" />
                            <circle cx="6" cy="6" r="1.3" fill="#E8B04B" opacity="0.38" />
                        </pattern>
                        <pattern id="door-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                            <path d="M0 0V6" stroke="#3A4654" strokeWidth="1" />
                        </pattern>
                        <clipPath id="d-bclip">
                            <path d="M150 96H236V250L204 292H182L150 250Z" />
                        </clipPath>
                    </defs>

                    <rect width="800" height="360" fill="url(#door-g100)" />
                    <rect x="40" y="316" width="720" height="10" fill="url(#door-hatch)" />
                    <path className="d-ground" d="M40 316H760" />

                    <text
                        x="40"
                        y="40"
                        fill={isAfter ? '#F26B21' : '#93A1B0'}
                        fontSize="12"
                        fontWeight="700"
                    >
                        {isAfter ? c.stateAfterLabel : c.stateBeforeLabel}
                    </text>

                    <rect className="d-o" x="440" y="96" width="170" height="220" rx="4" />
                    <rect className="d-o2" x="566" y="50" width="22" height="46" />
                    <rect className="d-chamber" x="456" y="124" width="136" height="110" rx="3" />
                    <rect className="d-o2" x="430" y="252" width="10" height="48" />

                    <g className="layer l-before">
                        <path d="M570 44c4-5-4-10 0-16M577 44c4-5-4-10 0-16M584 44c4-5-4-10 0-16" fill="none" stroke="#5F6B78" strokeWidth="2.4" strokeLinecap="round" />
                        <rect className="d-o2" x="430" y="128" width="10" height="72" />
                        <circle cx="435" cy="136" r="2" fill="#7A8796" />
                        <circle cx="435" cy="192" r="2" fill="#7A8796" />
                        <path d="M424 158V170" stroke="#C9D3DC" strokeWidth="2" />
                        <path d="M458 228H590" stroke="#7A8796" strokeWidth="1.4" strokeDasharray="6 3" />
                        <rect x="470" y="208" width="52" height="14" rx="7" fill="#5A3B1E" stroke="#8A6236" />
                        <rect x="520" y="212" width="58" height="14" rx="7" fill="#5A3B1E" stroke="#8A6236" />
                        <rect x="492" y="196" width="48" height="13" rx="6.5" fill="#5A3B1E" stroke="#8A6236" />
                        <path className="flame d-flame" style={{ opacity: 0.5 }} d="M548 194c-8 0-11-6-9-12 2-4 5-6 4-11 5 3 6 7 6 10 1-2 2-4 1-6 4 4 6 8 5 12-1 4-4 7-7 7z" />
                        <g className="bal static"><path d="M314 92L562 72" /><circle cx="70" cy="88" r="10" /><text x="70" y="92" textAnchor="middle">c</text></g>
                        <text className="d-t" x="88" y="92" fontWeight="700">{c.callC1}</text>
                        <text className="d-t2" x="88" y="108">{c.callC2}</text>
                        <g className="bal static"><path d="M314 158L424 164" /><circle cx="70" cy="154" r="10" /><text x="70" y="158" textAnchor="middle">a</text></g>
                        <text className="d-t" x="88" y="158" fontWeight="700">{c.callA1}</text>
                        <text className="d-t2" x="88" y="174">{c.callA2}</text>
                        <g className="bal static"><path d="M314 220L468 214" /><circle cx="70" cy="216" r="10" /><text x="70" y="220" textAnchor="middle">b</text></g>
                        <text className="d-t" x="88" y="220" fontWeight="700">{c.callB1}</text>
                        <text className="d-t2" x="88" y="236">{c.callB2}</text>
                        <text className="d-tr" x="40" y="348">{c.bottomBeforeWarn}</text>
                    </g>

                    <g className="layer l-after">
                        <path className="fluegas" d="M570 44c3-4-3-8 0-12M577 44c3-4-3-8 0-12M584 44c3-4-3-8 0-12" opacity="0.6" />
                        <rect x="430" y="128" width="10" height="72" fill="#2A3440" stroke="#F26B21" strokeWidth="1.4" />
                        <circle cx="435" cy="134" r="1.8" fill="#C9D3DC" />
                        <circle cx="435" cy="164" r="1.8" fill="#C9D3DC" />
                        <circle cx="435" cy="194" r="1.8" fill="#C9D3DC" />
                        <text className="d-t3" x="450" y="116">{flangeCode}</text>
                        <rect className="d-o2" x="350" y="144" width="80" height="42" rx="4" />
                        <circle className="d-o" cx="376" cy="165" r="11" />
                        <path d="M376 165v-8M376 165l7 4M376 165l-7 4" stroke="#C9D3DC" strokeWidth="1.3" />
                        <rect className="d-o2" x="440" y="158" width="44" height="14" />
                        <rect className="d-o2" x="398" y="126" width="14" height="18" />
                        <path className="flame d-flame" d="M520 196c-14 0-20-10-16-21 3-8 9-11 8-20 8 5 11 13 10 19 3-3 4-7 3-12 8 7 12 16 10 23-2 8-8 11-15 11z" />
                        <path className="flame2 d-flame2" d="M520 194c-6 0-9-5-7-10 1-3 4-5 4-9 4 3 5 7 4 10 2-1 2-3 2-5 3 4 4 7 3 10-1 3-3 4-6 4z" />
                        <g clipPath="url(#d-bclip)">
                            <rect x="140" y="120" width="110" height="180" fill="url(#door-pel)" />
                        </g>
                        <path className="d-o" style={{ fill: 'none' }} d="M150 96H236V250L204 292H182L150 250Z" />
                        <path className="d-lvl" d="M150 120H236" />
                        <text className="d-tb" x="193" y="186" textAnchor="middle" fill="#F3E2BE">{hopperLabel}</text>
                        <path className="d-hid" d="M193 286L236 213" />
                        <path d="M236 213L300 104" stroke="#C9D3DC" strokeWidth="12" fill="none" />
                        <path d="M236 213L300 104" stroke="#111821" strokeWidth="9" fill="none" />
                        <path d="M236 213L300 104" stroke="#6F7D8C" strokeWidth="8" strokeDasharray="1.5 4" fill="none" />
                        <path d="M300 102C326 74 400 80 405 126" fill="none" stroke="#C9D3DC" strokeWidth="6" />
                        <path d="M300 102C326 74 400 80 405 126" fill="none" stroke="#111821" strokeWidth="3" />
                        <path className="flow f" d="M236 213L300 104" />
                        <g className="bal static"><path d="M435 104V128" /><circle cx="435" cy="94" r="9" /><text x="435" y="98" textAnchor="middle">1</text></g>
                        <g className="bal static"><path d="M390 202V186" /><circle cx="390" cy="212" r="9" /><text x="390" y="216" textAnchor="middle">2</text></g>
                        <g className="bal static"><path d="M290 160L272 152" /><circle cx="300" cy="164" r="9" /><text x="300" y="168" textAnchor="middle">3</text></g>
                        <g className="bal static"><path d="M193 80V96" /><circle cx="193" cy="70" r="9" /><text x="193" y="74" textAnchor="middle">4</text></g>
                        <g className="bal static"><path d="M410 276H430" /><circle cx="400" cy="276" r="9" /><text x="400" y="280" textAnchor="middle">5</text></g>
                        <text className="d-tg" x="40" y="348">{c.bottomAfterOk}</text>
                    </g>
                </svg>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 border-t border-[#1C2530] text-xs" aria-live="polite">
                <div className="p-2.5 border-b sm:border-b-0 sm:border-r border-[#1C2530] space-y-0.5 min-w-0">
                    <span className="block text-xs text-[#808A95]">{c.m1Label}</span>
                    <strong className={`block text-xs font-extrabold break-words ${isAfter ? 'text-[#6FCF97]' : 'text-[#FF7A6E]'}`}>
                        {isAfter ? c.m1After : c.m1Before}
                    </strong>
                </div>
                <div className="p-2.5 border-b sm:border-b-0 sm:border-r border-[#1C2530] space-y-0.5 min-w-0">
                    <span className="block text-xs text-[#808A95]">{c.m2Label}</span>
                    <strong className={`block text-xs font-extrabold break-words ${isAfter ? 'text-[#6FCF97]' : 'text-[#FF7A6E]'}`}>
                        {isAfter ? c.m2After : c.m2Before}
                    </strong>
                </div>
                <div className="p-2.5 space-y-0.5 min-w-0">
                    <span className="block text-xs text-[#808A95]">{c.m3Label}</span>
                    <strong className={`block text-xs font-extrabold break-words ${isAfter ? 'text-[#6FCF97]' : 'text-[#FF7A6E]'}`}>
                        {isAfter ? c.m3After : c.m3Before}
                    </strong>
                </div>
            </div>
        </div>
    );
}

export type ContainerZoneId = 'A' | 'B' | 'C' | 'D';
export type ContainerModelKw = '150' | '250' | '500';

interface ContainerLocaleCopy {
    headerTitle: string;
    flowBtn: string;
    svgAria: string;
    hatchLabel: string;
    walkingFloorLabel: string;
    t1Tag: string;
    t2Tag: string;
    bottomScale: string;
    zones: Record<ContainerZoneId, { title: string; sub: string; desc: string }>;
}

const CONTAINER_I18N: Record<AppLocale, ContainerLocaleCopy> = {
    lt: {
        headerTitle: 'Konteinerinės katilinės pjūvis · 20ft HC',
        flowBtn: '● Srautas',
        svgAria: '20 pėdų HC konteinerinės katilinės pjūvis su kuro sandėliu, katilu, multiciklonu ir SCADA hidraulika',
        hatchLabel: 'Užpildymo liukas',
        walkingFloorLabel: 'Judančios grindys 12–24 t',
        t1Tag: 'T1 85 °C',
        t2Tag: 'T2 65 °C',
        bottomScale: 'L = 6 058 mm · 20ft HC ISO · M 1:25 (A3)',
        zones: {
            A: { title: 'Kuro sandėlis', sub: 'Judančios grindys 12–24 t', desc: 'Judančios grindys 12–24 t. Kuras pristatomas mobiliais bunkeriais ir sraigtu automatiškai tiekiamas į degimo kamerą.' },
            B: { title: 'Katilas', sub: 'MPB PRO', desc: 'Pramoninis katilas su savaime išsivalančiu MPB PRO degikliu. Kuras: medienos granulės, skiedra, durpės arba dujos.' },
            C: { title: 'Multiciklonas', sub: 'Dūmų ventiliatorius, H=6,5 m', desc: 'Daugiapakopis multiciklonas sulaiko kietąsias daleles, dūmų ventiliatorius ir izoliuotas dūmtraukis H = 6,5 m.' },
            D: { title: 'Hidraulika ir SCADA', sub: 'Siurblys, vožtuvai, SCADA', desc: 'Cirkuliacinis siurblys, uždaromoji armatūra, T1 85 °C / T2 65 °C jungtys į objektą bei GSM / SCADA telemetrija.' },
        },
    },
    en: {
        headerTitle: 'Container Boiler Room Section · 20ft HC',
        flowBtn: '● Flow',
        svgAria: '20ft HC containerized boiler room cutaway with fuel bunker, boiler, multicyclone, and SCADA hydronics',
        hatchLabel: 'Filling hatch',
        walkingFloorLabel: 'Walking floor 12–24 t',
        t1Tag: 'T1 85 °C',
        t2Tag: 'T2 65 °C',
        bottomScale: 'L = 6,058 mm · 20ft HC ISO · Scale 1:25 (A3)',
        zones: {
            A: { title: 'Fuel store', sub: 'Walking floor 12–24 t', desc: 'Walking-floor 12–24 t bunker. Fuel is delivered in mobile hoppers and automatically fed by screw auger into the burner.' },
            B: { title: 'Boiler', sub: 'MPB PRO', desc: 'Industrial boiler with self-cleaning MPB PRO burner. Fuels: wood pellets, woodchips, peat, or natural gas.' },
            C: { title: 'Multicyclone', sub: 'Flue fan, H=6.5 m', desc: 'Multi-stage cyclone separator captures particulate matter with induced-draft fan and H = 6.5 m insulated chimney.' },
            D: { title: 'Hydronics & SCADA', sub: 'Pump, valves, SCADA', desc: 'Main circulation pump, shut-off valves, T1 85 °C / T2 65 °C flanged connections, and remote GSM / SCADA telemetry.' },
        },
    },
    pl: {
        headerTitle: 'Przekrój kotłowni kontenerowej · 20ft HC',
        flowBtn: '● Przepływ',
        svgAria: 'Przekrój kotłowni kontenerowej 20ft HC z magazynem paliwa, kotłem, multicyklonem i hydrauliką SCADA',
        hatchLabel: 'Właz zasypowy',
        walkingFloorLabel: 'Ruchoma podłoga 12–24 t',
        t1Tag: 'T1 85 °C',
        t2Tag: 'T2 65 °C',
        bottomScale: 'L = 6 058 mm · 20ft HC ISO · Skala 1:25 (A3)',
        zones: {
            A: { title: 'Magazyn paliwa', sub: 'Ruchoma podłoga 12–24 t', desc: 'Ruchoma podłoga 12–24 t. Paliwo dostarczane mobilnymi zasobnikami i automatycznie podawane ślimakiem do komory.' },
            B: { title: 'Kocioł', sub: 'MPB PRO', desc: 'Kocioł przemysłowy z samoczyszczącym palnikiem MPB PRO. Paliwo: pelet drzewny, zrębka, torf lub gaz.' },
            C: { title: 'Multicyklon', sub: 'Wentylator spalin, H=6,5 m', desc: 'Odpylacz multicyklonowy zatrzymuje cząstki stałe z wentylatorem wyciągowym i kominem H = 6,5 m.' },
            D: { title: 'Hydraulika i SCADA', sub: 'Pompa, zawory, SCADA', desc: 'Pompa obiegowa, armatura odcinająca, przyłącza T1 85 °C / T2 65 °C do obiektu oraz zdalny nadzór GSM / SCADA.' },
        },
    },
    ru: {
        headerTitle: 'Разрез контейнерной котельной · 20ft HC',
        flowBtn: '● Поток',
        svgAria: 'Разрез 20-футовой контейнерной котельной со складом топлива, котлом, мультициклоном и SCADA',
        hatchLabel: 'Загрузочный люк',
        walkingFloorLabel: 'Подвижный пол 12–24 т',
        t1Tag: 'T1 85 °C',
        t2Tag: 'T2 65 °C',
        bottomScale: 'L = 6 058 мм · 20ft HC ISO · М 1:25 (A3)',
        zones: {
            A: { title: 'Склад топлива', sub: 'Подвижный пол 12–24 т', desc: 'Подвижный пол 12–24 т. Топливо доставляется мобильными бункерами и шнеком автоматически подается в горелку.' },
            B: { title: 'Котел', sub: 'MPB PRO', desc: 'Промышленный котел с самоочищающейся горелкой MPB PRO. Топливо: древесные пеллеты, щепа, торф или газ.' },
            C: { title: 'Мультициклон', sub: 'Дымосос, H=6,5 м', desc: 'Мультициклон улавливает твердые частицы, дымосос и утепленная дымовая труба H = 6,5 м.' },
            D: { title: 'Гидравлика и SCADA', sub: 'Насос, арматура, SCADA', desc: 'Циркуляционный насос, запорная арматура, фланцы T1 85 °C / T2 65 °C к объекту и диспетчеризация GSM / SCADA.' },
        },
    },
};

export function GilesContainer20ftSchematic({
    locale,
    testId = 'home-container-cad-blueprint',
    selectedZoneId,
    onSelectZone,
}: {
    locale: AppLocale;
    testId?: 'home-container-cad-blueprint' | 'pramonei-container-cad-blueprint';
    selectedZoneId?: ContainerZoneId;
    onSelectZone?: (zone: ContainerZoneId) => void;
}) {
    const c = CONTAINER_I18N[locale];
    const [internalZone, setInternalZone] = useState<ContainerZoneId>('B');
    const [modelKw, setModelKw] = useState<ContainerModelKw>('250');
    const [flowActive, setFlowActive] = useState(true);

    const activeZone = selectedZoneId || internalZone;
    const handleZoneSelect = (z: ContainerZoneId) => {
        setInternalZone(z);
        onSelectZone?.(z);
    };

    const kwUnit = locale === 'ru' ? 'кВт' : 'kW';
    const zoneCopy = c.zones[activeZone];

    return (
        <div
            data-testid={testId}
            className="rounded-md border border-[#232D38] bg-[#0C1117] text-[#ECEFF2] overflow-hidden"
        >
            <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5 border-b border-[#1C2530] text-xs">
                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[#F26B21] font-semibold">{c.headerTitle}</span>
                    <span className="text-[#93A1B0] tabular-nums">6 058 × 2 438 × 2 896 mm</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <div
                        data-testid="container-model-switcher"
                        role="group"
                        aria-label="GK model"
                        className="inline-flex rounded-xs border border-[#2A3440] overflow-hidden"
                    >
                        {([
                            { kw: '150' as ContainerModelKw, code: 'GK-150' },
                            { kw: '250' as ContainerModelKw, code: 'GK-250' },
                            { kw: '500' as ContainerModelKw, code: 'GK-500' },
                        ]).map(({ kw, code }) => {
                            const active = modelKw === kw;
                            return (
                                <button
                                    key={kw}
                                    type="button"
                                    data-gk={kw}
                                    aria-pressed={active}
                                    onClick={() => {
                                        setModelKw(kw);
                                        handleZoneSelect('B');
                                    }}
                                    className={`px-2 py-1 text-xs font-semibold whitespace-nowrap border-l first:border-l-0 border-[#2A3440] cursor-pointer transition-colors ${
                                        active
                                            ? 'bg-[#F26B21] text-[#0C1117]'
                                            : 'bg-transparent text-[#A6AFB9] hover:text-white'
                                    }`}
                                >
                                    {code}
                                </button>
                            );
                        })}
                    </div>
                    <button
                        type="button"
                        data-testid="container-flow-toggle"
                        aria-pressed={flowActive}
                        onClick={() => setFlowActive((v) => !v)}
                        className={`px-2.5 py-1 rounded-xs border text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                            flowActive
                                ? 'border-[#F26B21] text-[#F26B21]'
                                : 'border-[#2A3440] text-[#A6AFB9]'
                        }`}
                    >
                        {c.flowBtn}
                    </button>
                </div>
            </div>

            <div className="relative w-full bg-[#0C1117] px-2 pt-2">
                <svg
                    id="ct-svg"
                    viewBox="0 0 900 470"
                    role="img"
                    aria-label={c.svgAria}
                    className={`w-full h-auto block ${!flowActive ? 'paused noflow' : ''}`}
                >
                    <defs>
                        <pattern id="ct-g20" width="20" height="20" patternUnits="userSpaceOnUse">
                            <path d="M20 0H0V20" fill="none" stroke="#131B24" strokeWidth="1" />
                        </pattern>
                        <pattern id="ct-g100" width="100" height="100" patternUnits="userSpaceOnUse">
                            <rect width="100" height="100" fill="#0C1117" />
                            <rect width="100" height="100" fill="url(#ct-g20)" />
                            <path d="M100 0H0V100" fill="none" stroke="#18222D" strokeWidth="1" />
                        </pattern>
                        <pattern id="chips" width="12" height="10" patternUnits="userSpaceOnUse">
                            <rect width="12" height="10" fill="#2B2210" />
                            <path d="M1 3l4-1M6 8l4-1M8 3l3 1" stroke="#E8B04B" strokeWidth="1.2" opacity="0.5" />
                        </pattern>
                        <pattern id="ct-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                            <path d="M0 0V6" stroke="#3A4654" strokeWidth="1" />
                        </pattern>
                    </defs>

                    <rect width="900" height="470" fill="url(#ct-g100)" />
                    <rect x="60" y="400" width="820" height="10" fill="url(#ct-hatch)" />
                    <path className="d-ground" d="M60 400H880" />
                    <rect className="d-o" x="120" y="110" width="606" height="290" rx="2" style={{ fill: '#0F151C' }} />
                    <path d="M120 120H726M120 390H726" stroke="#2A3440" strokeWidth="1" />
                    <path className="d-hid" d="M380 110V400M550 110V400M620 110V400" style={{ stroke: '#3A4654' }} />

                    <g
                        className={`part zone ${activeZone === 'A' ? 'on part-active' : ''}`}
                        data-zone="A"
                        onClick={() => handleZoneSelect('A')}
                    >
                        <rect x="121" y="121" width="258" height="268" fill="#0C1117" opacity="0" />
                        <path d="M130 382L130 250Q240 200 368 262L368 382Z" fill="url(#chips)" stroke="#E8B04B" strokeWidth="1" />
                        <rect x="130" y="382" width="238" height="10" fill="#18212C" stroke="#7A8796" />
                        <rect className="d-o2" x="196" y="104" width="80" height="6" />
                        <text className="d-t" x="249" y="300" textAnchor="middle" fill="#F3E2BE">{c.walkingFloorLabel}</text>
                    </g>
                    <text className="d-t2" x="236" y="96" textAnchor="middle">{c.hatchLabel}</text>

                    <path d="M350 384L392 318" stroke="#C9D3DC" strokeWidth="11" fill="none" />
                    <path d="M350 384L392 318" stroke="#111821" strokeWidth="8" fill="none" />
                    <path d="M350 384L392 318" stroke="#6F7D8C" strokeWidth="7" strokeDasharray="1.5 4" fill="none" />

                    <g
                        className={`part zone ${activeZone === 'B' ? 'on part-active' : ''}`}
                        data-zone="B"
                        onClick={() => handleZoneSelect('B')}
                    >
                        <rect className="d-o" x="404" y="170" width="132" height="222" rx="4" />
                        <rect className="d-chamber" x="420" y="270" width="100" height="90" rx="3" />
                        <path className="flame d-flame" d="M470 352c-14 0-20-10-16-21 3-8 9-11 8-20 8 5 11 13 10 19 3-3 4-7 3-12 8 7 12 16 10 23-2 8-8 11-15 11z" />
                        <rect className="d-o2" x="384" y="306" width="20" height="30" rx="2" />
                        <text className="d-tb" x="470" y="212" textAnchor="middle">{modelKw} {kwUnit}</text>
                        <text className="d-t3" x="470" y="228" textAnchor="middle">MPB PRO</text>
                    </g>

                    <path d="M520 170V150H568V160" fill="none" stroke="#8C99A8" strokeWidth="8" />
                    <path d="M520 170V150H568V160" fill="none" stroke="#18212C" strokeWidth="5" />

                    <g
                        className={`part zone ${activeZone === 'C' ? 'on part-active' : ''}`}
                        data-zone="C"
                        onClick={() => handleZoneSelect('C')}
                    >
                        <rect className="d-o2" x="560" y="160" width="48" height="110" rx="3" />
                        <path className="d-o2" d="M560 270L608 270L592 330H576Z" />
                        <rect className="d-o2" x="568" y="348" width="32" height="44" rx="2" />
                        <path d="M584 330V348" stroke="#6F7D8C" strokeWidth="2" />
                        <path d="M566 190c10 6 26 6 36 0M566 214c10 6 26 6 36 0M566 238c10 6 26 6 36 0" fill="none" stroke="#3A4654" />
                        <circle className="d-o" cx="584" cy="140" r="10" />
                        <path d="M584 140v-6M584 140l5 3M584 140l-5 3" stroke="#C9D3DC" strokeWidth="1.2" />
                        <rect className="d-o2" x="576" y="62" width="16" height="68" />
                        <rect className="d-o2" x="576" y="24" width="16" height="26" />
                    </g>
                    <path d="M572 62l6-6 8 8 6-6M572 50l6-6 8 8 6-6" fill="none" stroke="#C9D3DC" strokeWidth="1.2" />
                    <path className="fluegas" d="M580 18c3-4-3-8 0-12M588 18c3-4-3-8 0-12" />

                    <g
                        className={`part zone ${activeZone === 'D' ? 'on part-active' : ''}`}
                        data-zone="D"
                        onClick={() => handleZoneSelect('D')}
                    >
                        <rect x="621" y="121" width="104" height="268" fill="#0C1117" opacity="0" />
                        <rect className="d-o" x="652" y="132" width="58" height="76" rx="3" style={{ fill: '#0A0E13' }} />
                        <rect x="660" y="140" width="42" height="24" rx="2" fill="#0F2A3D" />
                        <text x="681" y="156" textAnchor="middle" fill="#8FD3FF" fontSize="10" fontWeight="600">SCADA</text>
                        <text className="d-t3" x="681" y="182" textAnchor="middle">GSM</text>
                        <path d="M700 110V86M694 92c4-4 8-4 12 0M690 86c6-6 14-6 20 0" fill="none" stroke="#C9D3DC" strokeWidth="1.2" />
                    </g>

                    <path className="pipe sup" d="M536 362H556" />
                    <path className="pipe sup" d="M556 362H612" strokeDasharray="6 4" />
                    <path className="pipe sup" d="M612 362H760" />
                    <path className="pipe ret" d="M760 380H612" />
                    <path className="pipe ret" d="M612 380H556" strokeDasharray="6 4" />
                    <path className="pipe ret" d="M556 380H536" />

                    <g className="flows">
                        <path className="flow f" d="M140 387H362" />
                        <path className="flow f" d="M350 384L392 318" />
                        <path className="flow k" d="M520 168V150H568" />
                        <path className="flow k" d="M584 128V24" />
                        <path className="flow" d="M536 362H760" />
                        <path className="flow r c" d="M760 380H536" />
                    </g>

                    <circle className="pumpc" cx="666" cy="362" r="10" />
                    <path className="pumpt" d="M661 356L673 362L661 368Z" />
                    <path className="valve" d="M690 356L698 362L690 368ZM706 356L698 362L706 368Z" />
                    <path d="M726 356V386M732 356V386" stroke="#C9D3DC" strokeWidth="1.4" />
                    <g className="tag s"><rect x="768" y="352" width="78" height="18" rx="3" /><text x="807" y="365" textAnchor="middle">{c.t1Tag}</text></g>
                    <g className="tag r"><rect x="768" y="374" width="78" height="18" rx="3" /><text x="807" y="387" textAnchor="middle">{c.t2Tag}</text></g>

                    <g className={`bal ${activeZone === 'A' ? 'on part-active' : ''}`} data-zone="A" onClick={() => handleZoneSelect('A')}>
                        <circle cx="140" cy="134" r="11" /><text x="140" y="138" textAnchor="middle">A</text>
                    </g>
                    <g className={`bal ${activeZone === 'B' ? 'on part-active' : ''}`} data-zone="B" onClick={() => handleZoneSelect('B')}>
                        <circle cx="400" cy="134" r="11" /><text x="400" y="138" textAnchor="middle">B</text>
                    </g>
                    <g className={`bal ${activeZone === 'C' ? 'on part-active' : ''}`} data-zone="C" onClick={() => handleZoneSelect('C')}>
                        <circle cx="548" cy="300" r="11" /><text x="548" y="304" textAnchor="middle">C</text>
                    </g>
                    <g className={`bal ${activeZone === 'D' ? 'on part-active' : ''}`} data-zone="D" onClick={() => handleZoneSelect('D')}>
                        <circle cx="640" cy="134" r="11" /><text x="640" y="138" textAnchor="middle">D</text>
                    </g>

                    <path className="dimline" d="M120 410V440M726 410V440" />
                    <path className="dimline" d="M120 432H726" />
                    <rect x="384" y="424" width="78" height="16" fill="#0C1117" />
                    <text className="dimtx" x="423" y="436" textAnchor="middle">6 058 mm</text>
                    <path className="dimline" d="M78 110H114M78 400H114" />
                    <path className="dimline" d="M88 110V400" />
                    <rect x="80" y="224" width="16" height="62" fill="#0C1117" />
                    <text className="dimtx" transform="translate(92 255) rotate(-90)" textAnchor="middle">2 896 mm</text>
                    <path className="dimline" d="M598 24H868" />
                    <path className="dimline" d="M860 24V400" />
                    <rect x="852" y="176" width="16" height="74" fill="#0C1117" />
                    <text className="dimtx" transform="translate(864 213) rotate(-90)" textAnchor="middle">H = 6,5 m</text>
                    <text className="d-t3" x="856" y="458" textAnchor="end">{c.bottomScale}</text>
                </svg>
            </div>

            <div
                data-testid="container-zone-selector"
                role="group"
                aria-label={c.headerTitle}
                className="flex flex-wrap items-center gap-1.5 px-3.5 py-2.5 border-t border-[#1C2530]"
            >
                {(['A', 'B', 'C', 'D'] as ContainerZoneId[]).map((zId) => {
                    const active = activeZone === zId;
                    const z = c.zones[zId];
                    return (
                        <button
                            key={zId}
                            type="button"
                            data-zone={zId}
                            aria-pressed={active}
                            onClick={() => handleZoneSelect(zId)}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xs border text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                                active
                                    ? 'border-[#F26B21] bg-[#141C26] text-white'
                                    : 'border-[#232D38] bg-[#111821] text-[#C9D3DC] hover:border-[#4A5766]'
                            }`}
                        >
                            <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-[#F26B21] text-[#0C1117] text-[10px] font-bold">
                                {zId}
                            </span>
                            <span>{z.title}</span>
                        </button>
                    );
                })}
            </div>

            <div className="p-3.5 border-t border-[#1C2530] bg-[#101720] text-xs text-[#C9D3DC] leading-relaxed" aria-live="polite">
                <strong className="text-white">
                    {activeZone} · {zoneCopy.title} ({activeZone === 'B' ? `GK-${modelKw} · ${modelKw} ${kwUnit}` : '20ft HC'}).{' '}
                </strong>
                {zoneCopy.desc}
            </div>
        </div>
    );
}
