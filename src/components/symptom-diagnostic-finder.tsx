'use client';

import { useState, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { useLocale } from 'next-intl';
import { Link } from '../i18n/navigation';
import {
    AlertTriangle,
    Calculator,
    CheckCircle2,
    Wrench,
    ShieldCheck,
    Search,
} from 'lucide-react';
import {
    SYMPTOM_DIAGNOSTICS,
    type SymptomDiagnosticCard,
    type SymptomDiagnosticCategory,
} from '../lib/hvac-comparisons-data';
import { getLocalizedSymptomDiagnostics } from '../lib/symptom-diagnostics-i18n';
import { resolveProductImageUrl, resolveBrandLogo } from '../lib/product-visuals';
import { assetUrl } from '../lib/api';
import { resolveAppLocale } from '../i18n/storefront-ui-copy';
import type { AppLocale } from '../i18n/routing';
import { openVytautasWithContext, recordDiagnosticSymptom } from '../lib/customer-journey-tracker';
import { useStorefrontConfig } from './storefront-config-provider';

const cleanDash = (s: string) => s.replace(/\u2014/g, '–').replace(/[\u00A9\u00AE\u2122]/g, '');

export function VytautasDiagnosticConsultButton({
    prompt,
    title,
    summary,
    recommendedSkus,
    label,
}: {
    prompt: string;
    title: string;
    summary: string;
    recommendedSkus?: string[];
    label?: string;
}) {
    const { features, persona } = useStorefrontConfig();
    if (!features.vytautasWidget) return null;
    const agentName = persona.agentName || 'Vytautas';
    const instrumentalAgentName = agentName === 'Vytautas' ? 'Vytautu' : agentName;
    const genitiveAgentName = agentName === 'Vytautas' ? 'Vytauto' : agentName;
    const rawLabel = label
        ? label
              .replace(/inžinieriaus\s+(?:Vytauto|Vytautu|Vytautas)/g, `inžinieriaus ${genitiveAgentName}`)
              .replace(/su\s+konsultantu\s+(?:Vytauto|Vytautu|Vytautas)/g, `su konsultantu ${instrumentalAgentName}`)
        : `Klausti inžinieriaus ${genitiveAgentName} (AI) – pasikonsultuoti dėl šios situacijos`;
    const resolvedLabel = cleanDash(rawLabel)
        .replace(/su konsultantu Vytautas/g, 'su konsultantu Vytautu')
        .replace(/su Vytautas/g, 'su Vytautu')
        .replace(/\s*[\u2192\u279C\u27A1]\s*$/, '');

    return (
        <button
            type="button"
            onClick={() =>
                openVytautasWithContext({
                    prompt: cleanDash(prompt),
                    title: cleanDash(title),
                    summary: cleanDash(summary),
                    recommendedSkus,
                    autoSend: true,
                })
            }
            className="w-full bg-transparent p-0 border-0 cursor-pointer"
        >
            <span className="w-full inline-flex items-center justify-center rounded-sm border border-stone-300 bg-stone-50 hover:border-stone-900 hover:bg-stone-100 px-4 py-2.5 text-xs font-semibold text-stone-900 transition-colors">
                {resolvedLabel}
            </span>
        </button>
    );
}

const SVG_I18N: Record<
    AppLocale,
    {
        sectionLabel: string;
        faultAndFixLabel: string;
        flowAria: string;
        flowFaultHp: string;
        flowFaultPipe: string;
        flowFaultDp: string;
        flowDn15: string;
        flowNarrow: string;
        flowHpNeed: string;
        flowPumpPush: string;
        flowFixHp: string;
        flowFixPipe: string;
        flowFixDp: string;
        flowAfcInsert: string;
        flowFreeFlow: string;
        flowSteadyFlow: string;
        flowStableCop: string;
        flowAutoDamp: string;
        balAria: string;
        balFaultUfh: string;
        balFaultRiser: string;
        balFaultLoop: string;
        balCold: string;
        balBlackGlass: string;
        balShortReturn: string;
        balFixRiser: string;
        balFixUfh: string;
        balAfcScale: string;
        balEvenFlow: string;
        vesAria: string;
        vesFaultDhw: string;
        vesFaultPrv: string;
        vesFaultAir: string;
        vesWater100: string;
        vesHot6Bar: string;
        vesHot3Bar: string;
        vesRust: string;
        vesCold0Bar: string;
        vesNoExpand: string;
        vesFixDhw: string;
        vesFixHeat: string;
        vesAirCushion: string;
        vesWater: string;
        vesAirproof: string;
        vesPn10Flange: string;
        vesStable15Bar: string;
        vesHoldsAir: string;
        extra1Aria: string;
        extra1FaultSludge: string;
        extra1FaultPocket: string;
        extra1FaultMag: string;
        extra1FaultAir: string;
        extra1FaultPliers: string;
        extra1FixRemote: string;
        extra1FixZeparo: string;
        extra1FixPress: string;
        extra1Curtain: string;
        extra1Seal: string;
        extra1SludgeBottom: string;
        extra1ScalePin: string;
        extra1Capillary: string;
        extra1Stroke: string;
        extra1RealTemp: string;
        extra1FlatPress: string;
        extra1Cyclonic: string;
        extra1RediaHead: string;
        extra2Aria: string;
        extra2WallH: string;
        extra2Uncalib: string;
        extra2RaClick: string;
        extra2SharpEdge: string;
        extra2Dia23: string;
        extra2NightLeak: string;
        extra2SmoothNeck: string;
        extra2StraightNoFit: string;
        extra2SnapClick: string;
        extra2FloorH: string;
        extra2FixCalib: string;
        extra2M30: string;
        extra2Chamfer: string;
        extra2Dia30: string;
        extra2IntactOrings: string;
        extra2ExtThread: string;
        extra2Vekolux: string;
        extra2MetalNut: string;
        extra3Aria: string;
        extra3Fault65C: string;
        extra3230VNc: string;
        extra3Boiler70: string;
        extra3230VCtrl: string;
        extra3NoMix: string;
        extra3DirectMains: string;
        extra3Tiles32: string;
        extra3Shock: string;
        extra3NcClosed: string;
        extra3En1264: string;
        extra324VBurns: string;
        extra3TowelCool: string;
        extra3Nc95: string;
        extra3FixMix: string;
        extra324VNc: string;
        extra324VCtrl: string;
        extra3CapSensor: string;
        extra3LowVolt: string;
        extra3Safe38: string;
        extra3Open34Min: string;
        extra3ExactLimit: string;
        extra3WaxTime: string;
        extra3SingleLoopRtl: string;
        extra3ThreadM30: string;
    }
> = {
    lt: {
        sectionLabel: 'Inžinerinė mazgo pjūvio schema',
        faultAndFixLabel: 'Gedimo vieta ir sprendimas',
        flowAria: 'Srauto greičio, taktavimų ir slėgio perkričio sprendimas',
        flowFaultHp: 'Gedimas: užsmaugtas ΔT = 5 K srautas',
        flowFaultPipe: 'Gedimas: v > 1,0 m/s ir Δp šuoliai',
        flowFaultDp: 'Gedimas: per didelis slėgio skirtumas',
        flowDn15: 'DN15 vožtuvas praleidžia tik ~550 l/h',
        flowNarrow: 'Siauras plyšys: vandens greitis virš 2,0 m/s',
        flowHpNeed: 'Šilumos siurbliui prie 10 kW reikia ~1720 l/h',
        flowPumpPush: 'Siurblys spaudžia pusiau uždarytą vožtuvą',
        flowFixHp: 'Sprendimas: Gorenje ZV 50/100 + STAD DN25',
        flowFixPipe: 'Sprendimas: TA-Modulator / STAD',
        flowFixDp: 'Sprendimas: Heimeier Eclipse AFC',
        flowAfcInsert: 'AFC įdėklas',
        flowFreeFlow: 'Laisvas 1720 l/h srautas be taktavimų',
        flowSteadyFlow: 'Pastovus srautas ir greitis v ≤ 0,75 m/s',
        flowStableCop: 'Stabilus kompresoriaus darbas ir aukštas COP',
        flowAutoDamp: 'Vožtuvas automatiškai slopina perteklinį slėgį',
        balAria: 'Nesubalansuota sistema ir automatinis balansavimas',
        balFaultUfh: 'Gedimas: užsikirtę rotametrai ir štokas',
        balFaultRiser: 'Gedimas: 1 aukštas atima 80 % srauto',
        balFaultLoop: 'Gedimas: pirmas kontūras atima srautą',
        balCold: 'Šalta',
        balBlackGlass: 'Pajuodavęs stikliukas ir prikepusi adatėlė',
        balShortReturn: 'Vanduo grįžta per arčiausią kontūrą / 1 aukštą',
        balFixRiser: 'Sprendimas: IMI TA STAD su Memory stop',
        balFixUfh: 'Sprendimas: Dynacon Eclipse AFC',
        balAfcScale: 'AFC l/h skalė be gendančių rotametrų',
        balEvenFlow: 'Vienodas projektinis srautas visose šakose',
        vesAria: 'Plėtimosi indo membranos ir slėgio diagnostika',
        vesFaultDhw: 'Gedimas: PN3 indas ant boilerio / smūgis',
        vesFaultPrv: 'Gedimas: kalkės 3 bar vožtuve / per mažas V',
        vesFaultAir: 'Gedimas: inde nebėra oro pagalvės',
        vesWater100: '100% vanduo',
        vesHot6Bar: 'Šylant: >6 bar ir hidrosmūgiai',
        vesHot3Bar: 'Šylant: 3,0 bar (vožtuvas laša)',
        vesRust: 'Rūdys ir plyšusi EPDM pūslė',
        vesCold0Bar: 'Atvėsus: 0,0 bar (katilas stoja)',
        vesNoExpand: 'Vanduo neturi kur plėstis šildymo metu',
        vesFixDhw: 'Sprendimas: Aquapresso AD (PN10)',
        vesFixHeat: 'Sprendimas: Statico SD plėtimosi indas',
        vesAirCushion: 'Oro pagalvė',
        vesWater: 'Vanduo',
        vesAirproof: 'Airproof butilo membrana',
        vesPn10Flange: 'PN10 higieninis flanšas',
        vesStable15Bar: 'Stabilus 1,5 bar darbinis slėgis',
        vesHoldsAir: 'Laiko oro slėgį iki 10 kartų ilgiau',
        extra1Aria: 'Vožtuvo, nuotolinio jutiklio ir Zeparo separatoriaus schema',
        extra1FaultSludge: 'Gedimas: magnetito šlamas ir kalenimas',
        extra1FaultPocket: 'Gedimas: +25 °C šilumos kišenė nišoje',
        extra1FaultMag: 'Gedimas: 5–20 µm magnetitas praeina Y-filtrą',
        extra1FaultAir: 'Gedimas: mikroburbulai ir šlapias ventilis',
        extra1FaultPliers: 'Draudžiama: traukti adatėlę replėmis',
        extra1FixRemote: 'Sprendimas: 2 m kapiliarinis jutiklis',
        extra1FixZeparo: 'Sprendimas: IMI Pneumatex Zeparo ZUKM/ZUV',
        extra1FixPress: 'Teisinga: 2–3 mm statmenas paspaudimas',
        extra1Curtain: 'Užuolaida sulaiko šilumą prie galvutės',
        extra1Seal: 'Pažeidžiamas srautas arba riebokšlis',
        extra1SludgeBottom: 'Fe₃O₄ dumblas nusėda dugne ir ant rotoriaus',
        extra1ScalePin: 'Užkalkėjusi adatėlė arba oro mikroburbulai',
        extra1Capillary: 'Kapiliaras 2 m',
        extra1Stroke: 'Eiga: 2–3 mm',
        extra1RealTemp: 'Matuoja tikrąją kambario oro temperatūrą',
        extra1FlatPress: 'Spausti plokščiu paviršiumi, dėti ant „5“',
        extra1Cyclonic: 'Cikloninis magnetinis ir mikroburbulų valymas',
        extra1RediaHead: 'Danfoss Redia arba IMI Heimeier K-galvutė',
        extra2Aria: 'Jungties matavimas 23 mm RA Click, M30x1,5 ir Eurokonus 16x2',
        extra2WallH: 'Vamzdžiai iš sienos: kampinis H-blokas',
        extra2Uncalib: 'Gedimas: nekalibruotas 16×2 mm vamzdis',
        extra2RaClick: 'Danfoss RA Click: 23 mm kakliukas',
        extra2SharpEdge: 'Aštri briauna įpjauna O-žiedą',
        extra2Dia23: 'Skersmuo 23 mm',
        extra2NightLeak: 'Atvėsus naktį pradeda lašėti',
        extra2SmoothNeck: 'Lygus kaklelis su grioveliu',
        extra2StraightNoFit: 'Tiesus H-blokas netinka vamzdžiams iš sienos',
        extra2SnapClick: 'Užsifiksuoja paspaudimu be veržliarakčio',
        extra2FloorH: 'Vamzdžiai iš grindų: tiesus H-blokas',
        extra2FixCalib: 'Sprendimas: kalibravimas + G 3/4" Eurokonus',
        extra2M30: 'Standartas M30×1,5: 30 mm sriegis',
        extra2Chamfer: '45° vidinė nuožula',
        extra2Dia30: 'Skersmuo 30 mm',
        extra2IntactOrings: 'Sveiki 2 EPDM O-žiedai',
        extra2ExtThread: 'Išorinis metrinis sriegis',
        extra2Vekolux: 'Vekolux 50 mm H-blokas + Heimeier Eurokonus',
        extra2MetalNut: 'Užsukama metalinė veržlė (Heimeier K / Eclipse)',
        extra3Aria: 'Pavaros įtampos 230V ir 24V NC bei pamaišymo mazgo schema',
        extra3Fault65C: 'Gedimas: +65 °C katilo vanduo į grindis',
        extra3230VNc: '230 V NC pavara (tiesioginis tinklas)',
        extra3Boiler70: 'Katilas +70 °C',
        extra3230VCtrl: '230 V valdiklis',
        extra3NoMix: 'Be pamaišymo',
        extra3DirectMains: 'Tiesioginė įtampa',
        extra3Tiles32: 'Plytelės >32 °C',
        extra3Shock: 'Terminis šokas',
        extra3NcClosed: 'NC (uždaryta)',
        extra3En1264: 'Pagal LST EN 1264 grindys neturi viršyti +29 °C',
        extra324VBurns: '24 V pavara ant 230 V tinklo perdega iškart',
        extra3TowelCool: 'Gyvatukas ant +35 °C kolektoriaus lieka drungnas',
        extra3Nc95: 'NC = be įtampos uždaryta (95 % sistemų)',
        extra3FixMix: 'Sprendimas: 20–50 °C pamaišymas / RTL',
        extra324VNc: '24 V NC pavara (su transformatoriumi)',
        extra324VCtrl: '24 V valdiklis',
        extra3CapSensor: 'Kapiliarinis jutiklis',
        extra3LowVolt: 'Žema įtampa',
        extra3Safe38: 'Saugūs +38 °C',
        extra3Open34Min: 'Atidarymas 3–4 min.',
        extra3ExactLimit: 'Tikslus padavimo ribojimas į grindų kontūrus',
        extra3WaxTime: 'Pilnas vaško elemento atsidarymas trunka 3–4 min.',
        extra3SingleLoopRtl: 'Vienai vonios kilpai tinka Multilux RTL ribotuvas',
        extra3ThreadM30: 'Sriegis M30×1,5 arba Danfoss RA Click',
    },
    en: {
        sectionLabel: 'Engineering Node Cross-Section Schematic',
        faultAndFixLabel: 'Fault Location & Solution',
        flowAria: 'Flow velocity, short-cycling, and differential pressure solution',
        flowFaultHp: 'Fault: throttled ΔT = 5 K flow',
        flowFaultPipe: 'Fault: v > 1.0 m/s & Δp spikes',
        flowFaultDp: 'Fault: excessive differential pressure',
        flowDn15: 'DN15 valve passes only ~550 l/h',
        flowNarrow: 'Narrow gap: water velocity > 2.0 m/s',
        flowHpNeed: '10 kW heat pump requires ~1,720 l/h',
        flowPumpPush: 'Pump forces flow against half-closed valve',
        flowFixHp: 'Solution: Gorenje ZV 50/100 + STAD DN25',
        flowFixPipe: 'Solution: TA-Modulator / STAD',
        flowFixDp: 'Solution: Heimeier Eclipse AFC',
        flowAfcInsert: 'AFC cartridge',
        flowFreeFlow: 'Unrestricted 1,720 l/h flow without cycling',
        flowSteadyFlow: 'Steady flow & velocity v ≤ 0.75 m/s',
        flowStableCop: 'Stable compressor run & high COP',
        flowAutoDamp: 'Valve automatically absorbs excess Δp',
        balAria: 'Unbalanced system and automatic hydronic balancing',
        balFaultUfh: 'Fault: stuck rotameters & valve pin',
        balFaultRiser: 'Fault: ground floor takes 80% of flow',
        balFaultLoop: 'Fault: first loop starves distant loops',
        balCold: 'Cold',
        balBlackGlass: 'Blackened sight glass & seized pin',
        balShortReturn: 'Water short-circuits via nearest loop / floor',
        balFixRiser: 'Solution: IMI TA STAD with Memory stop',
        balFixUfh: 'Solution: Dynacon Eclipse AFC',
        balAfcScale: 'AFC l/h dial without clogging sight glasses',
        balEvenFlow: 'Equal design flow across all branches',
        vesAria: 'Expansion vessel bladder and pre-charge diagnostics',
        vesFaultDhw: 'Fault: PN3 vessel on DHW cylinder / hammer',
        vesFaultPrv: 'Fault: scale in 3 bar PRV / undersized V',
        vesFaultAir: 'Fault: lost air cushion in vessel',
        vesWater100: '100% water',
        vesHot6Bar: 'Heating: >6 bar & water hammer',
        vesHot3Bar: 'Heating: 3.0 bar (PRV drips)',
        vesRust: 'Corrosion & ruptured EPDM bladder',
        vesCold0Bar: 'Cooled: 0.0 bar (boiler lock-out)',
        vesNoExpand: 'No expansion volume when water heats up',
        vesFixDhw: 'Solution: Aquapresso AD (PN10)',
        vesFixHeat: 'Solution: Statico SD expansion vessel',
        vesAirCushion: 'Air cushion',
        vesWater: 'Water',
        vesAirproof: 'Airproof butyl membrane',
        vesPn10Flange: 'PN10 hygienic stainless flange',
        vesStable15Bar: 'Stable 1.5 bar operating pressure',
        vesHoldsAir: 'Retains air pre-charge up to 10× longer',
        extra1Aria: 'Valve pin, remote capillary sensor, and Zeparo separator schematic',
        extra1FaultSludge: 'Fault: magnetite sludge & chattering',
        extra1FaultPocket: 'Fault: +25 °C heat pocket in niche',
        extra1FaultMag: 'Fault: 5–20 µm magnetite passes Y-strainer',
        extra1FaultAir: 'Fault: microbubbles & weeping air vent',
        extra1FaultPliers: 'Do not pull pin outward with pliers',
        extra1FixRemote: 'Solution: 2 m remote capillary sensor',
        extra1FixZeparo: 'Solution: IMI Pneumatex Zeparo ZUKM/ZUV',
        extra1FixPress: 'Correct: press pin 2–3 mm straight inward',
        extra1Curtain: 'Curtain traps warm air around head',
        extra1Seal: 'Damages flow path or gland seal',
        extra1SludgeBottom: 'Fe₃O₄ sludge settles in bottom & pump rotor',
        extra1ScalePin: 'Calcified pin or entrained microbubbles',
        extra1Capillary: '2 m capillary',
        extra1Stroke: 'Stroke: 2–3 mm',
        extra1RealTemp: 'Measures true room air temperature on wall',
        extra1FlatPress: 'Press with flat surface, mount set to "5"',
        extra1Cyclonic: 'Cyclonic magnetic & microbubble separation',
        extra1RediaHead: 'Danfoss Redia or IMI Heimeier K-head',
        extra2Aria: 'Connection measurement: 23 mm RA Click, M30x1.5, and Eurokonus 16x2',
        extra2WallH: 'Pipes from wall: angled H-block',
        extra2Uncalib: 'Fault: unchamfered 16×2 mm pipe',
        extra2RaClick: 'Danfoss RA Click: 23 mm collar',
        extra2SharpEdge: 'Sharp edge slices EPDM O-ring',
        extra2Dia23: 'Diameter 23 mm',
        extra2NightLeak: 'Weeps overnight when pipes cool down',
        extra2SmoothNeck: 'Smooth neck with groove',
        extra2StraightNoFit: 'Straight H-block collides with wall pipes',
        extra2SnapClick: 'Tool-free snap-click lock',
        extra2FloorH: 'Pipes from floor: straight H-block',
        extra2FixCalib: 'Solution: calibration + G 3/4" Eurokonus',
        extra2M30: 'Standard M30×1.5: 30 mm thread',
        extra2Chamfer: '45° inner chamfer',
        extra2Dia30: 'Diameter 30 mm',
        extra2IntactOrings: 'Intact dual EPDM O-rings',
        extra2ExtThread: 'External metric thread',
        extra2Vekolux: 'Vekolux 50 mm H-block + Heimeier Eurokonus',
        extra2MetalNut: 'Threaded metal nut (Heimeier K / Eclipse)',
        extra3Aria: 'Actuator voltage 230V vs 24V NC and mixing unit schematic',
        extra3Fault65C: 'Fault: +65 °C boiler water into floor',
        extra3230VNc: '230 V NC actuator (direct mains)',
        extra3Boiler70: 'Boiler +70 °C',
        extra3230VCtrl: '230 V controller',
        extra3NoMix: 'No mixing valve',
        extra3DirectMains: 'Mains voltage',
        extra3Tiles32: 'Tiles >32 °C',
        extra3Shock: 'Thermal shock',
        extra3NcClosed: 'NC (closed)',
        extra3En1264: 'Per EN 1264 floor surface must not exceed +29 °C',
        extra324VBurns: '24 V actuator on 230 V mains burns out immediately',
        extra3TowelCool: 'Towel rail on +35 °C manifold stays lukewarm',
        extra3Nc95: 'NC = closed when de-energized (95% of systems)',
        extra3FixMix: 'Solution: 20–50 °C mixing / RTL limiter',
        extra324VNc: '24 V NC actuator (with transformer)',
        extra324VCtrl: '24 V controller',
        extra3CapSensor: 'Capillary sensor',
        extra3LowVolt: 'Low voltage',
        extra3Safe38: 'Safe +38 °C',
        extra3Open34Min: 'Opens in 3–4 min',
        extra3ExactLimit: 'Precise supply limit into floor loops',
        extra3WaxTime: 'Full wax element opening takes 3–4 minutes',
        extra3SingleLoopRtl: 'Use Multilux RTL limiter for single bathroom loop',
        extra3ThreadM30: 'M30×1.5 thread or Danfoss RA Click',
    },
    pl: {
        sectionLabel: 'Schemat inżynieryjny przekroju węzła',
        faultAndFixLabel: 'Miejsce usterki i rozwiązanie',
        flowAria: 'Rozwiązanie problemu prędkości przepływu, taktowania i różnicy ciśnień',
        flowFaultHp: 'Usterka: zdławiony przepływ ΔT = 5 K',
        flowFaultPipe: 'Usterka: v > 1,0 m/s i skoki Δp',
        flowFaultDp: 'Usterka: zbyt duża różnica ciśnień',
        flowDn15: 'Zawór DN15 przepuszcza tylko ~550 l/h',
        flowNarrow: 'Wąska szczelina: prędkość wody > 2,0 m/s',
        flowHpNeed: 'Pompa ciepła 10 kW wymaga ~1720 l/h',
        flowPumpPush: 'Pompa tłoczy w przymknięty zawór',
        flowFixHp: 'Rozwiązanie: Gorenje ZV 50/100 + STAD DN25',
        flowFixPipe: 'Rozwiązanie: TA-Modulator / STAD',
        flowFixDp: 'Rozwiązanie: Heimeier Eclipse AFC',
        flowAfcInsert: 'Wkładka AFC',
        flowFreeFlow: 'Swobodny przepływ 1720 l/h bez taktowania',
        flowSteadyFlow: 'Stały przepływ i prędkość v ≤ 0,75 m/s',
        flowStableCop: 'Stabilna praca sprężarki i wysoki COP',
        flowAutoDamp: 'Zawór automatycznie tłumi nadmiar ciśnienia',
        balAria: 'Niezrównoważona instalacja i automatyczne równoważenie',
        balFaultUfh: 'Usterka: zablokowane rotametry i iglica',
        balFaultRiser: 'Usterka: parter zabiera 80% przepływu',
        balFaultLoop: 'Usterka: pierwsza pętla zabiera przepływ',
        balCold: 'Zimno',
        balBlackGlass: 'Poczerniałe szkiełko i zapieczona iglica',
        balShortReturn: 'Woda wraca przez najbliższą pętlę / parter',
        balFixRiser: 'Rozwiązanie: IMI TA STAD z Memory stop',
        balFixUfh: 'Rozwiązanie: Dynacon Eclipse AFC',
        balAfcScale: 'Skala AFC l/h bez awaryjnych rotametrów',
        balEvenFlow: 'Równy przepływ projektowy we wszystkich gałęziach',
        vesAria: 'Diagnostyka membrany i ciśnienia naczynia wzbiorczego',
        vesFaultDhw: 'Usterka: naczynie PN3 przy bojlerze / uderzenia',
        vesFaultPrv: 'Usterka: kamień w zaworze 3 bar / za małe V',
        vesFaultAir: 'Usterka: brak poduszki powietrznej w naczyniu',
        vesWater100: '100% woda',
        vesHot6Bar: 'Grzanie: >6 bar i uderzenia wodne',
        vesHot3Bar: 'Grzanie: 3,0 bar (zawór kapie)',
        vesRust: 'Korozja i pęknięta membrana EPDM',
        vesCold0Bar: 'Po ostygnięciu: 0,0 bar (kocioł staje)',
        vesNoExpand: 'Woda nie ma gdzie się rozszerzać podczas grzania',
        vesFixDhw: 'Rozwiązanie: Aquapresso AD (PN10)',
        vesFixHeat: 'Rozwiązanie: naczynie wzbiorcze Statico SD',
        vesAirCushion: 'Poduszka pow.',
        vesWater: 'Woda',
        vesAirproof: 'Membrana butylowa Airproof',
        vesPn10Flange: 'Higieniczny kołnierz PN10',
        vesStable15Bar: 'Stabilne ciśnienie robocze 1,5 bar',
        vesHoldsAir: 'Utrzymuje ciśnienie powietrza do 10× dłużej',
        extra1Aria: 'Schemat zaworu, czujnika zdalnego i separatora Zeparo',
        extra1FaultSludge: 'Usterka: szlam magnetytowy i stukanie',
        extra1FaultPocket: 'Usterka: kieszeń cieplna +25 °C we wnęce',
        extra1FaultMag: 'Usterka: magnetyt 5–20 µm przechodzi filtr Y',
        extra1FaultAir: 'Usterka: mikropęcherzyki i cieknący odpowietrznik',
        extra1FaultPliers: 'Zabronione: wyciąganie iglicy kombinerkami',
        extra1FixRemote: 'Rozwiązanie: czujnik kapilarny 2 m',
        extra1FixZeparo: 'Rozwiązanie: IMI Pneumatex Zeparo ZUKM/ZUV',
        extra1FixPress: 'Prawidłowo: wciśnięcie iglicy o 2–3 mm',
        extra1Curtain: 'Zasłona zatrzymuje ciepło przy głowicy',
        extra1Seal: 'Uszkodzenie przepływu lub dławicy',
        extra1SludgeBottom: 'Szlam Fe₃O₄ osadza się na dole i na wirniku',
        extra1ScalePin: 'Zakamieniona iglica lub mikropęcherzyki powietrza',
        extra1Capillary: 'Kapilara 2 m',
        extra1Stroke: 'Skok: 2–3 mm',
        extra1RealTemp: 'Mierzy rzeczywistą temperaturę w pokoju',
        extra1FlatPress: 'Wcisnąć płaskim narzędziem, zakładać na „5”',
        extra1Cyclonic: 'Cyklonowe czyszczenie magnetyczne i odpowietrzanie',
        extra1RediaHead: 'Głowica Danfoss Redia lub IMI Heimeier K',
        extra2Aria: 'Pomiar przyłącza 23 mm RA Click, M30x1,5 i Eurokonus 16x2',
        extra2WallH: 'Rury ze ściany: kątowy blok H',
        extra2Uncalib: 'Usterka: nieskalibrowana rura 16×2 mm',
        extra2RaClick: 'Danfoss RA Click: szyjka 23 mm',
        extra2SharpEdge: 'Ostra krawędź nacina O-ring',
        extra2Dia23: 'Średnica 23 mm',
        extra2NightLeak: 'Po ostygnięciu w nocy zaczyna kapać',
        extra2SmoothNeck: 'Gładka szyjka z rowkiem',
        extra2StraightNoFit: 'Prosty blok H nie pasuje do rur ze ściany',
        extra2SnapClick: 'Zatrzask Click bez użycia klucza',
        extra2FloorH: 'Rury z podłogi: prosty blok H',
        extra2FixCalib: 'Rozwiązanie: kalibracja + G 3/4" Eurokonus',
        extra2M30: 'Standard M30×1,5: gwint 30 mm',
        extra2Chamfer: 'Fazowanie wewnętrzne 45°',
        extra2Dia30: 'Średnica 30 mm',
        extra2IntactOrings: 'Nienaruszone 2 O-ringi EPDM',
        extra2ExtThread: 'Zewnętrzny gwint metryczny',
        extra2Vekolux: 'Blok H Vekolux 50 mm + Eurokonus Heimeier',
        extra2MetalNut: 'Nakrętka metalowa (Heimeier K / Eclipse)',
        extra3Aria: 'Schemat napięcia siłownika 230V i 24V NC oraz układu mieszającego',
        extra3Fault65C: 'Usterka: woda +65 °C z kotła w podłogę',
        extra3230VNc: 'Siłownik 230 V NC (sieć 230 V)',
        extra3Boiler70: 'Kocioł +70 °C',
        extra3230VCtrl: 'Sterownik 230 V',
        extra3NoMix: 'Bez podmieszania',
        extra3DirectMains: 'Napięcie sieciowe',
        extra3Tiles32: 'Płytki >32 °C',
        extra3Shock: 'Szok termiczny',
        extra3NcClosed: 'NC (zamknięty)',
        extra3En1264: 'Wg EN 1264 podłoga nie powinna przekraczać +29 °C',
        extra324VBurns: 'Siłownik 24 V podłączony pod 230 V przepala się od razu',
        extra3TowelCool: 'Grzejnik łazienkowy na rozdzielaczu +35 °C jest letni',
        extra3Nc95: 'NC = bez napięcia zamknięty (95% instalacji)',
        extra3FixMix: 'Rozwiązanie: podmieszanie 20–50 °C / RTL',
        extra324VNc: 'Siłownik 24 V NC (z transformatorem)',
        extra324VCtrl: 'Sterownik 24 V',
        extra3CapSensor: 'Czujnik kapilarny',
        extra3LowVolt: 'Niskie napięcie',
        extra3Safe38: 'Bezpieczne +38 °C',
        extra3Open34Min: 'Otwarcie 3–4 min',
        extra3ExactLimit: 'Dokładne ograniczenie temperatury w pętle',
        extra3WaxTime: 'Pełne otwarcie elementu woskowego trwa 3–4 min',
        extra3SingleLoopRtl: 'Dla pojedynczej pętli łazienkowej pasuje Multilux RTL',
        extra3ThreadM30: 'Gwint M30×1,5 lub Danfoss RA Click',
    },
    ru: {
        sectionLabel: 'Инженерная схема разреза узла',
        faultAndFixLabel: 'Место неисправности и решение',
        flowAria: 'Решение по скорости потока, тактованию и перепаду давления',
        flowFaultHp: 'Неисправность: зажат поток ΔT = 5 K',
        flowFaultPipe: 'Неисправность: v > 1,0 м/с и скачки Δp',
        flowFaultDp: 'Неисправность: избыточный перепад давления',
        flowDn15: 'Клапан DN15 пропускает лишь ~550 л/ч',
        flowNarrow: 'Узкая щель: скорость воды свыше 2,0 м/с',
        flowHpNeed: 'Тепловому насосу 10 кВт нужно ~1720 л/ч',
        flowPumpPush: 'Насос давит в полуприкрытый клапан',
        flowFixHp: 'Решение: Gorenje ZV 50/100 + STAD DN25',
        flowFixPipe: 'Решение: TA-Modulator / STAD',
        flowFixDp: 'Решение: Heimeier Eclipse AFC',
        flowAfcInsert: 'Вставка AFC',
        flowFreeFlow: 'Свободный поток 1720 л/ч без тактования',
        flowSteadyFlow: 'Постоянный расход и скорость v ≤ 0,75 м/с',
        flowStableCop: 'Стабильная работа компрессора и высокий COP',
        flowAutoDamp: 'Клапан автоматически гасит избыточный напор',
        balAria: 'Несбалансированная система и автоматическая балансировка',
        balFaultUfh: 'Неисправность: заклинившие ротаметры и шток',
        balFaultRiser: 'Неисправность: 1 этаж забирает 80% потока',
        balFaultLoop: 'Неисправность: ближний контур забирает поток',
        balCold: 'Холодно',
        balBlackGlass: 'Почерневшая колба и залипший шток',
        balShortReturn: 'Вода возвращается через ближний контур / 1 этаж',
        balFixRiser: 'Решение: IMI TA STAD с Memory stop',
        balFixUfh: 'Решение: Dynacon Eclipse AFC',
        balAfcScale: 'Шкала AFC л/ч без засоряющихся ротаметров',
        balEvenFlow: 'Равный расчетный поток во всех ветках',
        vesAria: 'Диагностика мембраны и давления расширительного бака',
        vesFaultDhw: 'Неисправность: бак PN3 на бойлере / гидроудар',
        vesFaultPrv: 'Неисправность: накипь в клапане 3 бар / малый V',
        vesFaultAir: 'Неисправность: в баке нет воздушной подушки',
        vesWater100: '100% вода',
        vesHot6Bar: 'При нагреве: >6 бар и гидроудары',
        vesHot3Bar: 'При нагреве: 3,0 бар (клапан капает)',
        vesRust: 'Коррозия и порванная мембрана EPDM',
        vesCold0Bar: 'Остыл: 0,0 бар (котел встает)',
        vesNoExpand: 'Воде некуда расширяться при нагреве',
        vesFixDhw: 'Решение: Aquapresso AD (PN10)',
        vesFixHeat: 'Решение: расширительный бак Statico SD',
        vesAirCushion: 'Воздух',
        vesWater: 'Вода',
        vesAirproof: 'Бутиловая мембрана Airproof',
        vesPn10Flange: 'Гигиенический фланец PN10',
        vesStable15Bar: 'Стабильное рабочее давление 1,5 бар',
        vesHoldsAir: 'Держит давление воздуха до 10 раз дольше',
        extra1Aria: 'Схема клапана, выносного датчика и сепаратора Zeparo',
        extra1FaultSludge: 'Неисправность: магнетитовый шлам и стук',
        extra1FaultPocket: 'Неисправность: тепловой карман +25 °C в нише',
        extra1FaultMag: 'Неисправность: магнетит 5–20 мкм проходит Y-фильтр',
        extra1FaultAir: 'Неисправность: микропузырьки и текущий воздушник',
        extra1FaultPliers: 'Запрещено: тянуть шток плоскогубцами',
        extra1FixRemote: 'Решение: капиллярный датчик 2 м',
        extra1FixZeparo: 'Решение: IMI Pneumatex Zeparo ZUKM/ZUV',
        extra1FixPress: 'Правильно: нажатие штока на 2–3 мм',
        extra1Curtain: 'Штора удерживает тепло у термоголовки',
        extra1Seal: 'Повреждение потока или сальника штока',
        extra1SludgeBottom: 'Шлам Fe₃O₄ оседает внизу и на роторе насоса',
        extra1ScalePin: 'Закисший шток или микропузырьки воздуха',
        extra1Capillary: 'Капилляр 2 м',
        extra1Stroke: 'Ход: 2–3 мм',
        extra1RealTemp: 'Измеряет реальную температуру воздуха в комнате',
        extra1FlatPress: 'Нажать плоским предметом, ставить на «5»',
        extra1Cyclonic: 'Циклонная магнитная и микропузырьковая очистка',
        extra1RediaHead: 'Головка Danfoss Redia или IMI Heimeier K',
        extra2Aria: 'Измерение соединения 23 мм RA Click, M30x1,5 и Евроконус 16x2',
        extra2WallH: 'Трубы из стены: угловой H-блок',
        extra2Uncalib: 'Неисправность: некалиброванная труба 16×2 мм',
        extra2RaClick: 'Danfoss RA Click: шейка 23 мм',
        extra2SharpEdge: 'Острый край подрезает O-кольцо',
        extra2Dia23: 'Диаметр 23 мм',
        extra2NightLeak: 'Ночью при остывании начинает капать',
        extra2SmoothNeck: 'Гладкая шейка с канавкой',
        extra2StraightNoFit: 'Прямой H-блок не подходит для труб из стены',
        extra2SnapClick: 'Фиксация защелкой без ключа',
        extra2FloorH: 'Трубы из пола: прямой H-блок',
        extra2FixCalib: 'Решение: калибровка + G 3/4" Евроконус',
        extra2M30: 'Стандарт M30×1,5: резьба 30 мм',
        extra2Chamfer: 'Внутренняя фаска 45°',
        extra2Dia30: 'Диаметр 30 мм',
        extra2IntactOrings: 'Целые 2 кольца EPDM',
        extra2ExtThread: 'Наружная метрическая резьба',
        extra2Vekolux: 'H-блок Vekolux 50 мм + Евроконус Heimeier',
        extra2MetalNut: 'Накидная гайка (Heimeier K / Eclipse)',
        extra3Aria: 'Схема напряжения привода 230В и 24В NC и смесительного узла',
        extra3Fault65C: 'Неисправность: вода +65 °C из котла в пол',
        extra3230VNc: 'Привод 230 В NC (сеть 230 В)',
        extra3Boiler70: 'Котел +70 °C',
        extra3230VCtrl: 'Контроллер 230 В',
        extra3NoMix: 'Без подмеса',
        extra3DirectMains: 'Сетевое питание',
        extra3Tiles32: 'Плитка >32 °C',
        extra3Shock: 'Термошок',
        extra3NcClosed: 'NC (закрыт)',
        extra3En1264: 'По EN 1264 температура пола не должна превышать +29 °C',
        extra324VBurns: 'Привод 24 В от сети 230 В сгорает мгновенно',
        extra3TowelCool: 'Полотенцесушитель от коллектора +35 °C еле теплый',
        extra3Nc95: 'NC = без питания закрыт (95% систем)',
        extra3FixMix: 'Решение: подмес 20–50 °C / узел RTL',
        extra324VNc: 'Привод 24 В NC (с трансформатором)',
        extra324VCtrl: 'Контроллер 24 В',
        extra3CapSensor: 'Капиллярный датчик',
        extra3LowVolt: 'Низкое напряжение',
        extra3Safe38: 'Безопасные +38 °C',
        extra3Open34Min: 'Открытие 3–4 мин.',
        extra3ExactLimit: 'Точное ограничение подачи в контуры пола',
        extra3WaxTime: 'Полное открытие воскового элемента занимает 3–4 мин.',
        extra3SingleLoopRtl: 'Для одной петли санузла подходит узел Multilux RTL',
        extra3ThreadM30: 'Резьба M30×1,5 или Danfoss RA Click',
    },
};

export function DiagnosticBlueprintSvg({
    symptomId,
    locale = 'lt',
}: {
    symptomId: string;
    locale?: AppLocale;
}) {
    const s = SVG_I18N[locale] || SVG_I18N.lt;
    const isFlowArchetype =
        symptomId === 'whistling-radiator' ||
        symptomId === 'heat-pump-short-cycling-flow' ||
        symptomId === 'pipe-velocity-noise-dp-spikes';

    const isBalanceArchetype =
        symptomId === 'cold-farthest-radiator' ||
        symptomId === 'ufh-flowmeters-black-stuck' ||
        symptomId === 'second-floor-cold-riser-imbalance';

    const isVesselArchetype =
        symptomId === 'boiler-pressure-drop-3bar' ||
        symptomId === 'dhw-boiler-vessel-water-hammer' ||
        symptomId === 'prv-dripping-precharge-error';

    return (
        <div
            data-testid={`diagnostic-blueprint-${symptomId}`}
            className="rounded-sm bg-[var(--surface-paper)] p-3"
        >
            <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs font-semibold text-stone-700">
                    {s.sectionLabel}
                </span>
                <span className="text-xs text-stone-500">
                    {s.faultAndFixLabel}
                </span>
            </div>

            {isFlowArchetype && (
                <svg viewBox="0 0 540 160" className="w-full h-auto rounded-xs bg-white" role="img" aria-label={s.flowAria}>
                    <rect x="12" y="12" width="248" height="136" rx="4" fill="var(--surface-paper)" stroke="var(--primary)" strokeWidth="1.5" />
                    <text x="22" y="30" fill="var(--primary)" fontSize="10.5" fontWeight="700">
                        {symptomId === 'heat-pump-short-cycling-flow'
                            ? s.flowFaultHp
                            : symptomId === 'pipe-velocity-noise-dp-spikes'
                              ? s.flowFaultPipe
                              : s.flowFaultDp}
                    </text>
                    <line x1="26" y1="76" x2="105" y2="76" stroke="var(--foreground)" strokeWidth="6" />
                    <polygon points="105,58 145,71 145,81 105,94" fill="var(--border-subtle)" stroke="var(--foreground)" strokeWidth="1.5" />
                    <path d="M 146 74 Q 170 56 192 76 T 238 76" fill="none" stroke="var(--primary)" strokeWidth="2.5" strokeDasharray="4 2" />
                    <text x="22" y="118" fill="var(--foreground)" fontSize="9.5" fontWeight="600">
                        {symptomId === 'heat-pump-short-cycling-flow' ? s.flowDn15 : s.flowNarrow}
                    </text>
                    <text x="22" y="134" fill="var(--muted-foreground)" fontSize="9">
                        {symptomId === 'heat-pump-short-cycling-flow' ? s.flowHpNeed : s.flowPumpPush}
                    </text>

                    <rect x="280" y="12" width="248" height="136" rx="4" fill="var(--surface-paper)" stroke="var(--data-ok)" strokeWidth="1.5" />
                    <text x="290" y="30" fill="var(--data-ok)" fontSize="10.5" fontWeight="700">
                        {symptomId === 'heat-pump-short-cycling-flow'
                            ? s.flowFixHp
                            : symptomId === 'pipe-velocity-noise-dp-spikes'
                              ? s.flowFixPipe
                              : s.flowFixDp}
                    </text>
                    <rect x="345" y="54" width="76" height="44" rx="4" fill="var(--card)" stroke="var(--foreground)" strokeWidth="1.8" />
                    <line x1="296" y1="76" x2="345" y2="76" stroke="var(--foreground)" strokeWidth="5" />
                    <line x1="421" y1="76" x2="508" y2="76" stroke="var(--data-ok)" strokeWidth="5" />
                    <text x="383" y="79" textAnchor="middle" fill="var(--data-ok)" fontSize="9.5" fontWeight="700">
                        {symptomId === 'heat-pump-short-cycling-flow'
                            ? 'Kv 8.7–14'
                            : symptomId === 'pipe-velocity-noise-dp-spikes'
                              ? 'PIBCV Δp'
                              : s.flowAfcInsert}
                    </text>
                    <text x="290" y="118" fill="var(--foreground)" fontSize="9.5" fontWeight="600">
                        {symptomId === 'heat-pump-short-cycling-flow' ? s.flowFreeFlow : s.flowSteadyFlow}
                    </text>
                    <text x="290" y="134" fill="var(--muted-foreground)" fontSize="9">
                        {symptomId === 'heat-pump-short-cycling-flow' ? s.flowStableCop : s.flowAutoDamp}
                    </text>
                </svg>
            )}

            {isBalanceArchetype && (
                <svg viewBox="0 0 540 160" className="w-full h-auto rounded-xs bg-white" role="img" aria-label={s.balAria}>
                    <rect x="12" y="12" width="248" height="136" rx="4" fill="var(--surface-paper)" stroke="var(--primary)" strokeWidth="1.5" />
                    <text x="22" y="30" fill="var(--primary)" fontSize="10.5" fontWeight="700">
                        {symptomId === 'ufh-flowmeters-black-stuck'
                            ? s.balFaultUfh
                            : symptomId === 'second-floor-cold-riser-imbalance'
                              ? s.balFaultRiser
                              : s.balFaultLoop}
                    </text>
                    <line x1="24" y1="48" x2="236" y2="48" stroke="var(--primary)" strokeWidth="3" />
                    <line x1="24" y1="102" x2="236" y2="102" stroke="var(--brand-secondary)" strokeWidth="3" />
                    <rect x="44" y="56" width="34" height="38" fill="var(--surface-subtle)" stroke="var(--primary)" strokeWidth="1.5" />
                    <rect x="114" y="56" width="34" height="38" fill="var(--muted)" stroke="var(--data-warn)" strokeWidth="1.5" />
                    <rect x="184" y="56" width="34" height="38" fill="var(--surface-subtle)" stroke="var(--border)" strokeWidth="1.5" />
                    <text x="61" y="79" textAnchor="middle" fill="var(--primary)" fontSize="9" fontWeight="700">80%</text>
                    <text x="201" y="79" textAnchor="middle" fill="var(--muted-foreground)" fontSize="9" fontWeight="700">{s.balCold}</text>
                    <text x="22" y="132" fill="var(--muted-foreground)" fontSize="9">
                        {symptomId === 'ufh-flowmeters-black-stuck' ? s.balBlackGlass : s.balShortReturn}
                    </text>

                    <rect x="280" y="12" width="248" height="136" rx="4" fill="var(--surface-paper)" stroke="var(--data-ok)" strokeWidth="1.5" />
                    <text x="290" y="30" fill="var(--data-ok)" fontSize="10.5" fontWeight="700">
                        {symptomId === 'second-floor-cold-riser-imbalance' ? s.balFixRiser : s.balFixUfh}
                    </text>
                    <line x1="292" y1="48" x2="508" y2="48" stroke="var(--data-ok)" strokeWidth="3" />
                    <line x1="292" y1="102" x2="508" y2="102" stroke="var(--brand-secondary)" strokeWidth="3" />
                    {[312, 382, 452].map((xPos, i) => (
                        <g key={i}>
                            <rect x={xPos} y="56" width="34" height="38" fill="var(--surface-card)" stroke="var(--data-ok)" strokeWidth="1.5" />
                            <text x={xPos + 17} y="79" textAnchor="middle" fill="var(--data-ok)" fontSize="9" fontWeight="700">100%</text>
                        </g>
                    ))}
                    <text x="290" y="132" fill="var(--muted-foreground)" fontSize="9">
                        {symptomId === 'ufh-flowmeters-black-stuck' ? s.balAfcScale : s.balEvenFlow}
                    </text>
                </svg>
            )}

            {isVesselArchetype && (
                <svg viewBox="0 0 540 160" className="w-full h-auto rounded-xs bg-white" role="img" aria-label={s.vesAria}>
                    <rect x="12" y="12" width="248" height="136" rx="4" fill="var(--surface-paper)" stroke="var(--primary)" strokeWidth="1.5" />
                    <text x="22" y="30" fill="var(--primary)" fontSize="10.5" fontWeight="700">
                        {symptomId === 'dhw-boiler-vessel-water-hammer'
                            ? s.vesFaultDhw
                            : symptomId === 'prv-dripping-precharge-error'
                              ? s.vesFaultPrv
                              : s.vesFaultAir}
                    </text>
                    <rect x="34" y="42" width="64" height="82" rx="20" fill="var(--surface-subtle)" stroke="var(--primary)" strokeWidth="2" />
                    <text x="66" y="86" textAnchor="middle" fill="var(--foreground)" fontSize="9" fontWeight="700">{s.vesWater100}</text>
                    <text x="112" y="66" fill="var(--primary)" fontSize="9.5" fontWeight="600">
                        {symptomId === 'dhw-boiler-vessel-water-hammer' ? s.vesHot6Bar : s.vesHot3Bar}
                    </text>
                    <text x="112" y="86" fill="var(--foreground)" fontSize="9.5">
                        {symptomId === 'dhw-boiler-vessel-water-hammer' ? s.vesRust : s.vesCold0Bar}
                    </text>
                    <text x="22" y="136" fill="var(--muted-foreground)" fontSize="9">{s.vesNoExpand}</text>

                    <rect x="280" y="12" width="248" height="136" rx="4" fill="var(--surface-paper)" stroke="var(--data-ok)" strokeWidth="1.5" />
                    <text x="290" y="30" fill="var(--data-ok)" fontSize="10.5" fontWeight="700">
                        {symptomId === 'dhw-boiler-vessel-water-hammer' ? s.vesFixDhw : s.vesFixHeat}
                    </text>
                    <rect x="302" y="42" width="64" height="82" rx="20" fill="var(--card)" stroke="var(--data-ok)" strokeWidth="2" />
                    <path d="M 304 84 Q 334 92 364 84" fill="none" stroke="var(--foreground)" strokeWidth="2" />
                    <text x="334" y="66" textAnchor="middle" fill="var(--data-ok)" fontSize="8.5" fontWeight="700">{s.vesAirCushion}</text>
                    <text x="334" y="108" textAnchor="middle" fill="var(--brand-secondary)" fontSize="8.5" fontWeight="700">{s.vesWater}</text>
                    <text x="378" y="68" fill="var(--foreground)" fontSize="9.5" fontWeight="600">{s.vesAirproof}</text>
                    <text x="378" y="88" fill="var(--muted-foreground)" fontSize="9">
                        {symptomId === 'dhw-boiler-vessel-water-hammer' ? s.vesPn10Flange : s.vesStable15Bar}
                    </text>
                    <text x="290" y="136" fill="var(--data-ok)" fontSize="9" fontWeight="600">{s.vesHoldsAir}</text>
                </svg>
            )}

            {!isFlowArchetype && !isBalanceArchetype && !isVesselArchetype && (
                <DiagnosticBlueprintExtraSvg symptomId={symptomId} locale={locale} />
            )}
        </div>
    );
}

function DiagnosticBlueprintExtraSvg({
    symptomId,
    locale = 'lt',
}: {
    symptomId: string;
    locale?: AppLocale;
}) {
    const s = SVG_I18N[locale] || SVG_I18N.lt;
    if (
        symptomId === 'radiator-hot-on-zero' ||
        symptomId === 'radiator-bottom-cold-or-banging' ||
        symptomId === 'trv-behind-curtain-remote-sensor' ||
        symptomId === 'magnetite-sludge-filter-clog' ||
        symptomId === 'air-gurgling-leaking-vent'
    ) {
        const leftTitle =
            symptomId === 'radiator-bottom-cold-or-banging'
                ? s.extra1FaultSludge
                : symptomId === 'trv-behind-curtain-remote-sensor'
                  ? s.extra1FaultPocket
                  : symptomId === 'magnetite-sludge-filter-clog'
                    ? s.extra1FaultMag
                    : symptomId === 'air-gurgling-leaking-vent'
                      ? s.extra1FaultAir
                      : s.extra1FaultPliers;
        const rightTitle =
            symptomId === 'trv-behind-curtain-remote-sensor'
                ? s.extra1FixRemote
                : symptomId === 'radiator-bottom-cold-or-banging' ||
                    symptomId === 'magnetite-sludge-filter-clog' ||
                    symptomId === 'air-gurgling-leaking-vent'
                  ? s.extra1FixZeparo
                  : s.extra1FixPress;
        return (
            <svg viewBox="0 0 540 160" className="w-full h-auto rounded-xs bg-white" role="img" aria-label={s.extra1Aria}>
                <rect x="12" y="12" width="248" height="136" rx="4" fill="var(--surface-paper)" stroke="var(--primary)" strokeWidth="1.5" />
                <text x="22" y="30" fill="var(--primary)" fontSize="10.5" fontWeight="700">{leftTitle}</text>
                <rect x="36" y="62" width="76" height="34" fill="var(--border-subtle)" stroke="var(--foreground)" strokeWidth="1.5" />
                <rect x="112" y="73" width="34" height="12" fill="var(--data-warn)" />
                <line x1="152" y1="79" x2="210" y2="79" stroke="var(--primary)" strokeWidth="2.5" />
                <text x="22" y="118" fill="var(--primary)" fontSize="9.5" fontWeight="600">
                    {symptomId === 'trv-behind-curtain-remote-sensor' ? s.extra1Curtain : s.extra1Seal}
                </text>
                <text x="22" y="134" fill="var(--muted-foreground)" fontSize="9">
                    {symptomId === 'magnetite-sludge-filter-clog' || symptomId === 'radiator-bottom-cold-or-banging'
                        ? s.extra1SludgeBottom
                        : s.extra1ScalePin}
                </text>

                <rect x="280" y="12" width="248" height="136" rx="4" fill="var(--surface-paper)" stroke="var(--data-ok)" strokeWidth="1.5" />
                <text x="290" y="30" fill="var(--data-ok)" fontSize="10.5" fontWeight="700">{rightTitle}</text>
                <rect x="304" y="62" width="76" height="34" fill="var(--card)" stroke="var(--foreground)" strokeWidth="1.5" />
                <rect x="380" y="73" width="26" height="12" fill="var(--data-ok)" />
                <rect x="414" y="56" width="10" height="46" rx="2" fill="var(--foreground)" />
                <text x="434" y="82" fill="var(--data-ok)" fontSize="9.5" fontWeight="700">
                    {symptomId === 'trv-behind-curtain-remote-sensor'
                        ? s.extra1Capillary
                        : symptomId === 'radiator-hot-on-zero'
                          ? s.extra1Stroke
                          : 'Helistill + Fe₃O₄'}
                </text>
                <text x="290" y="118" fill="var(--foreground)" fontSize="9.5" fontWeight="600">
                    {symptomId === 'trv-behind-curtain-remote-sensor'
                        ? s.extra1RealTemp
                        : symptomId === 'radiator-hot-on-zero'
                          ? s.extra1FlatPress
                          : s.extra1Cyclonic}
                </text>
                <text x="290" y="134" fill="var(--muted-foreground)" fontSize="9">
                    {symptomId === 'radiator-hot-on-zero' || symptomId === 'trv-behind-curtain-remote-sensor'
                        ? s.extra1RediaHead
                        : 'IMI Pneumatex Zeparo (7895122) + Heimeier'}
                </text>
            </svg>
        );
    }

    if (
        symptomId === 'trv-thread-23mm-vs-30mm' ||
        symptomId === 'eurokonus-cold-leak-calibration' ||
        symptomId === 'h-block-straight-vs-angled-vk'
    ) {
        const isEurokonus =
            symptomId === 'eurokonus-cold-leak-calibration' ||
            symptomId === 'h-block-straight-vs-angled-vk';
        return (
            <svg viewBox="0 0 540 160" className="w-full h-auto rounded-xs bg-white" role="img" aria-label={s.extra2Aria}>
                <rect x="12" y="12" width="248" height="136" rx="4" fill="var(--surface-paper)" stroke="var(--foreground)" strokeWidth="1.5" />
                <text x="22" y="30" fill="var(--foreground)" fontSize="10.5" fontWeight="700">
                    {symptomId === 'h-block-straight-vs-angled-vk'
                        ? s.extra2WallH
                        : isEurokonus
                          ? s.extra2Uncalib
                          : s.extra2RaClick}
                </text>
                <circle cx="82" cy="82" r="26" fill="var(--card)" stroke="var(--primary)" strokeWidth="2.5" />
                <circle cx="82" cy="82" r="5" fill="var(--foreground)" />
                <text x="122" y="74" fill="var(--foreground)" fontSize="9.5" fontWeight="700">
                    {symptomId === 'h-block-straight-vs-angled-vk'
                        ? '50 mm (0382-02.000)'
                        : isEurokonus
                          ? s.extra2SharpEdge
                          : s.extra2Dia23}
                </text>
                <text x="122" y="92" fill="var(--muted-foreground)" fontSize="9">
                    {isEurokonus ? s.extra2NightLeak : s.extra2SmoothNeck}
                </text>
                <text x="22" y="134" fill="var(--muted-foreground)" fontSize="9">
                    {isEurokonus ? s.extra2StraightNoFit : s.extra2SnapClick}
                </text>

                <rect x="280" y="12" width="248" height="136" rx="4" fill="var(--surface-paper)" stroke="var(--data-ok)" strokeWidth="1.5" />
                <text x="290" y="30" fill="var(--data-ok)" fontSize="10.5" fontWeight="700">
                    {symptomId === 'h-block-straight-vs-angled-vk'
                        ? s.extra2FloorH
                        : isEurokonus
                          ? s.extra2FixCalib
                          : s.extra2M30}
                </text>
                <circle cx="354" cy="82" r="32" fill="var(--card)" stroke="var(--data-ok)" strokeWidth="2.5" strokeDasharray="5 2" />
                <circle cx="354" cy="82" r="5" fill="var(--foreground)" />
                <text x="400" y="74" fill="var(--foreground)" fontSize="9.5" fontWeight="700">
                    {symptomId === 'h-block-straight-vs-angled-vk'
                        ? '50 mm (0382-01.000)'
                        : isEurokonus
                          ? s.extra2Chamfer
                          : s.extra2Dia30}
                </text>
                <text x="400" y="92" fill="var(--muted-foreground)" fontSize="9">
                    {isEurokonus ? s.extra2IntactOrings : s.extra2ExtThread}
                </text>
                <text x="290" y="134" fill="var(--muted-foreground)" fontSize="9">
                    {isEurokonus ? s.extra2Vekolux : s.extra2MetalNut}
                </text>
            </svg>
        );
    }

    return (
        <svg viewBox="0 0 540 160" className="w-full h-auto rounded-xs bg-white" role="img" aria-label={s.extra3Aria}>
            <rect x="12" y="12" width="248" height="136" rx="4" fill="var(--surface-paper)" stroke="var(--primary)" strokeWidth="1.5" />
            <text x="22" y="30" fill="var(--primary)" fontSize="10.5" fontWeight="700">
                {symptomId === 'ufh-tiles-overheating-mixing' ? s.extra3Fault65C : s.extra3230VNc}
            </text>
            <rect x="28" y="48" width="90" height="42" rx="3" fill="var(--card)" stroke="var(--foreground)" strokeWidth="1.5" />
            <text x="73" y="67" textAnchor="middle" fill="var(--foreground)" fontSize="9.5" fontWeight="700">
                {symptomId === 'ufh-tiles-overheating-mixing' ? s.extra3Boiler70 : s.extra3230VCtrl}
            </text>
            <text x="73" y="81" textAnchor="middle" fill="var(--muted-foreground)" fontSize="8.5">
                {symptomId === 'ufh-tiles-overheating-mixing' ? s.extra3NoMix : s.extra3DirectMains}
            </text>
            <line x1="118" y1="69" x2="156" y2="69" stroke="var(--primary)" strokeWidth="2.5" />
            <rect x="156" y="48" width="84" height="42" rx="3" fill="var(--card)" stroke="var(--primary)" strokeWidth="1.5" />
            <text x="198" y="67" textAnchor="middle" fill="var(--primary)" fontSize="9.5" fontWeight="700">
                {symptomId === 'ufh-tiles-overheating-mixing' ? s.extra3Tiles32 : 'EMO T 230 V'}
            </text>
            <text x="198" y="81" textAnchor="middle" fill="var(--muted-foreground)" fontSize="8.5">
                {symptomId === 'ufh-tiles-overheating-mixing' ? s.extra3Shock : s.extra3NcClosed}
            </text>
            <text x="22" y="116" fill="var(--primary)" fontSize="9" fontWeight="600">
                {symptomId === 'ufh-tiles-overheating-mixing' ? s.extra3En1264 : s.extra324VBurns}
            </text>
            <text x="22" y="134" fill="var(--muted-foreground)" fontSize="9">
                {symptomId === 'ufh-tiles-overheating-mixing' ? s.extra3TowelCool : s.extra3Nc95}
            </text>

            <rect x="280" y="12" width="248" height="136" rx="4" fill="var(--surface-paper)" stroke="var(--data-ok)" strokeWidth="1.5" />
            <text x="290" y="30" fill="var(--data-ok)" fontSize="10.5" fontWeight="700">
                {symptomId === 'ufh-tiles-overheating-mixing' ? s.extra3FixMix : s.extra324VNc}
            </text>
            <rect x="296" y="48" width="90" height="42" rx="3" fill="var(--card)" stroke="var(--foreground)" strokeWidth="1.5" />
            <text x="341" y="67" textAnchor="middle" fill="var(--foreground)" fontSize="9.5" fontWeight="700">
                {symptomId === 'ufh-tiles-overheating-mixing' ? 'Heimeier K 20–50°C' : s.extra324VCtrl}
            </text>
            <text x="341" y="81" textAnchor="middle" fill="var(--muted-foreground)" fontSize="8.5">
                {symptomId === 'ufh-tiles-overheating-mixing' ? s.extra3CapSensor : s.extra3LowVolt}
            </text>
            <line x1="386" y1="69" x2="424" y2="69" stroke="var(--data-ok)" strokeWidth="2.5" />
            <rect x="424" y="48" width="88" height="42" rx="3" fill="var(--card)" stroke="var(--data-ok)" strokeWidth="1.5" />
            <text x="468" y="67" textAnchor="middle" fill="var(--data-ok)" fontSize="9.5" fontWeight="700">
                {symptomId === 'ufh-tiles-overheating-mixing' ? s.extra3Safe38 : 'TWA / EMO 24 V'}
            </text>
            <text x="468" y="81" textAnchor="middle" fill="var(--muted-foreground)" fontSize="8.5">
                {symptomId === 'ufh-tiles-overheating-mixing' ? 'Dynacon / Multilux' : s.extra3Open34Min}
            </text>
            <text x="290" y="116" fill="var(--foreground)" fontSize="9" fontWeight="600">
                {symptomId === 'ufh-tiles-overheating-mixing' ? s.extra3ExactLimit : s.extra3WaxTime}
            </text>
            <text x="290" y="134" fill="var(--muted-foreground)" fontSize="9">
                {symptomId === 'ufh-tiles-overheating-mixing' ? s.extra3SingleLoopRtl : s.extra3ThreadM30}
            </text>
        </svg>
    );
}

type CategoryFilterKey =
    | 'all'
    | 'radiatoriai'
    | 'grindinis'
    | 'katiline'
    | 'silumos-siurbliai'
    | 'balansavimas-jungtys';

const FINDER_UI_COPY: Record<
    AppLocale,
    {
        heading: (count: number) => string;
        subtitle: string;
        allComparisonsBtn: string;
        filterGroupAria: string;
        searchPlaceholder: string;
        tablistAria: string;
        catAll: (count: number) => string;
        catRadiators: (count: number) => string;
        catUnderfloor: (count: number) => string;
        catBoiler: (count: number) => string;
        catHeatPumps: (count: number) => string;
        catBalancing: (count: number) => string;
        step3RecommendedTitle: string;
        viewInCatalog: string;
        readFullComparison: string;
        consultBtnLabel: (agent: string) => string;
        consultPrompt: (title: string, cause: string, skus: string) => string;
        consultTitlePrefix: string;
        situationBadge: (num: number) => string;
        step1CauseTitle: string;
        step2CheckTitle: string;
        commonMistakeLabel: string;
        showLessMobile: string;
        showAllMobile: (count: number) => string;
    }
> = {
    lt: {
        heading: (count) => `Šildymo sistemos gedimų diagnostika ir dalių parinkimas (${count} situacijų)`,
        subtitle:
            'Pasirinkite sistemos kategoriją arba įrašykite simptomą – iškart pamatysite inžinerinę priežastį, 5 min. patikros eigą ir tikslias detales iš sandėlio.',
        allComparisonsBtn: 'Visi 20 techninių palyginimų',
        filterGroupAria: 'Simptomų kategorijų filtrai',
        searchPlaceholder: 'Ieškoti pagal simptomą, pvz.: krenta slėgis, ūžia radiatorius, šaltos grindys...',
        tablistAria: 'Šildymo sistemos simptomai',
        catAll: (c) => `Visi simptomai (${c})`,
        catRadiators: (c) => `Radiatoriai (${c})`,
        catUnderfloor: (c) => `Grindinis šildymas (${c})`,
        catBoiler: (c) => `Katilinė ir slėgis (${c})`,
        catHeatPumps: (c) => `Šilumos siurbliai ir oro šalinimas (${c})`,
        catBalancing: (c) => `Balansavimas ir jungtys (${c})`,
        step3RecommendedTitle: '3. Rekomenduojamas techninis sprendimas ir mazgai',
        viewInCatalog: 'Žiūrėti kataloge',
        readFullComparison: 'Skaityti išsamų techninį mazgų palyginimą',
        consultBtnLabel: (agent) => `Klausti inžinieriaus ${agent} (AI) – pasikonsultuoti dėl šios situacijos`,
        consultPrompt: (title, cause, skus) =>
            `Susidūriau su problema: ${title}. Priežastis: ${cause}. Padėk išsirinkti tikslias detales (${skus}) ir patark dėl montavimo.`,
        consultTitlePrefix: 'Diagnostika:',
        situationBadge: (n) => `Situacija #${n} · Diagnostikos atsakymas`,
        step1CauseTitle: '1. Inžinerinė priežastis (Kodėl taip nutinka):',
        step2CheckTitle: '2. Patikra vietoje per 5 min.:',
        commonMistakeLabel: 'Dažniausia pirkėjų klaida:',
        showLessMobile: 'Rodyti tik 6 pagrindinius gedimų simptomus',
        showAllMobile: (c) => `Rodyti visas ${c} šildymo sistemos gedimų situacijas`,
    },
    en: {
        heading: (count) => `Heating System Fault Diagnostics & Part Selector (${count} cases)`,
        subtitle:
            'Select a system category or type a symptom – immediately view the root engineering cause, a 5-minute on-site check, and exact replacement parts from our warehouse.',
        allComparisonsBtn: 'All 20 Technical Comparisons',
        filterGroupAria: 'Symptom category filters',
        searchPlaceholder: 'Search by symptom, e.g.: pressure drops, whistling radiator, cold floor...',
        tablistAria: 'Heating system symptoms',
        catAll: (c) => `All symptoms (${c})`,
        catRadiators: (c) => `Radiators (${c})`,
        catUnderfloor: (c) => `Underfloor heating (${c})`,
        catBoiler: (c) => `Boiler room & pressure (${c})`,
        catHeatPumps: (c) => `Heat pumps & air elimination (${c})`,
        catBalancing: (c) => `Balancing & fittings (${c})`,
        step3RecommendedTitle: '3. Recommended Engineering Solution & Assemblies',
        viewInCatalog: 'View in catalog',
        readFullComparison: 'Read full technical assembly comparison',
        consultBtnLabel: (agent) => `Ask Engineer ${agent} (AI) – consult on this diagnostic case`,
        consultPrompt: (title, cause, skus) =>
            `I have this heating issue: ${title}. Root cause: ${cause}. Help me select the exact parts (${skus}) and advise on installation.`,
        consultTitlePrefix: 'Diagnostics:',
        situationBadge: (n) => `Case #${n} · Engineering Diagnostic Answer`,
        step1CauseTitle: '1. Root Engineering Cause (Why it happens):',
        step2CheckTitle: '2. 5-Minute On-Site Verification:',
        commonMistakeLabel: 'Most common buyer mistake:',
        showLessMobile: 'Show only 6 primary fault symptoms',
        showAllMobile: (c) => `Show all ${c} heating system fault cases`,
    },
    pl: {
        heading: (count) => `Diagnostyka usterek instalacji grzewczej i dobór części (${count} sytuacji)`,
        subtitle:
            'Wybierz kategorię układu lub wpisz objaw – od razu zobaczysz przyczynę inżynieryjną, 5-minutową kontrolę na miejscu oraz dokładne części z magazynu.',
        allComparisonsBtn: 'Wszystkie 20 porównań technicznych',
        filterGroupAria: 'Filtry kategorii objawów',
        searchPlaceholder: 'Szukaj wg objawu, np.: spadek ciśnienia, szum w grzejniku, zimna podłoga...',
        tablistAria: 'Objawy instalacji grzewczej',
        catAll: (c) => `Wszystkie objawy (${c})`,
        catRadiators: (c) => `Grzejniki (${c})`,
        catUnderfloor: (c) => `Ogrzewanie podłogowe (${c})`,
        catBoiler: (c) => `Kotłownia i ciśnienie (${c})`,
        catHeatPumps: (c) => `Pompy ciepła i odpowietrzanie (${c})`,
        catBalancing: (c) => `Równoważenie i złączki (${c})`,
        step3RecommendedTitle: '3. Zalecane rozwiązanie techniczne i podzespoły',
        viewInCatalog: 'Zobacz w katalogu',
        readFullComparison: 'Przeczytaj szczegółowe porównanie techniczne',
        consultBtnLabel: (agent) => `Zapytaj inżyniera ${agent} (AI) – skonsultuj tę sytuację`,
        consultPrompt: (title, cause, skus) =>
            `Mam problem z instalacją: ${title}. Przyczyna: ${cause}. Pomóż dobrać odpowiednie części (${skus}) i doradź w montażu.`,
        consultTitlePrefix: 'Diagnostyka:',
        situationBadge: (n) => `Sytuacja #${n} · Odpowiedź diagnostyczna`,
        step1CauseTitle: '1. Przyczyna inżynieryjna (Dlaczego tak się dzieje):',
        step2CheckTitle: '2. Kontrola na miejscu w 5 min:',
        commonMistakeLabel: 'Najczęstszy błąd kupujących:',
        showLessMobile: 'Pokaż tylko 6 głównych objawów usterek',
        showAllMobile: (c) => `Pokaż wszystkie ${c} sytuacji diagnostycznych`,
    },
    ru: {
        heading: (count) => `Диагностика неисправностей отопления и подбор деталей (${count} ситуаций)`,
        subtitle:
            'Выберите категорию системы или введите симптом – вы сразу увидите инженерную причину, 5-минутную проверку на месте и точные комплектующие со склада.',
        allComparisonsBtn: 'Все 20 технических сравнений',
        filterGroupAria: 'Фильтры категорий симптомов',
        searchPlaceholder: 'Поиск по симптому, напр.: падает давление, шумит радиатор, холодный пол...',
        tablistAria: 'Симптомы системы отопления',
        catAll: (c) => `Все симптомы (${c})`,
        catRadiators: (c) => `Радиаторы (${c})`,
        catUnderfloor: (c) => `Теплый пол (${c})`,
        catBoiler: (c) => `Котельная и давление (${c})`,
        catHeatPumps: (c) => `Тепловые насосы и отвод воздуха (${c})`,
        catBalancing: (c) => `Балансировка и соединения (${c})`,
        step3RecommendedTitle: '3. Рекомендуемое техническое решение и узлы',
        viewInCatalog: 'Смотреть в каталоге',
        readFullComparison: 'Читать подробное техническое сравнение узлов',
        consultBtnLabel: (agent) => `Спросить инженера ${agent} (AI) – проконсультироваться по ситуации`,
        consultPrompt: (title, cause, skus) =>
            `Столкнулся с проблемой: ${title}. Причина: ${cause}. Помогите подобрать точные детали (${skus}) и подскажите по монтажу.`,
        consultTitlePrefix: 'Диагностика:',
        situationBadge: (n) => `Ситуация #${n} · Инженерный ответ диагностики`,
        step1CauseTitle: '1. Инженерная причина (Почему так происходит):',
        step2CheckTitle: '2. Проверка на месте за 5 мин.:',
        commonMistakeLabel: 'Самая частая ошибка покупателей:',
        showLessMobile: 'Показать только 6 основных симптомов неисправностей',
        showAllMobile: (c) => `Показать все ${c} ситуаций неисправностей отопления`,
    },
};

interface SymptomDiagnosticFinderProps {
    showHubLink?: boolean;
    initialSymptomId?: string;
    locale?: string;
}

export function SymptomDiagnosticFinder({
    showHubLink = true,
    initialSymptomId,
    locale: propLocale,
}: SymptomDiagnosticFinderProps) {
    const rawPathname = usePathname() || '';
    let intlLocale = 'lt';
    try {
        intlLocale = useLocale() || 'lt';
    } catch {
        intlLocale = 'lt';
    }
    const urlMatch = rawPathname.match(/^\/(lt|en|pl|ru)(?=\/|$)/i);
    const locale = resolveAppLocale(propLocale || (urlMatch ? urlMatch[1] : intlLocale));
    const ui = FINDER_UI_COPY[locale];

    const localizedDiagnostics = useMemo(
        () => getLocalizedSymptomDiagnostics(SYMPTOM_DIAGNOSTICS, locale),
        [locale],
    );

    const categoryFilterPills: Array<{
        key: CategoryFilterKey;
        label: string;
        matches: (cat?: SymptomDiagnosticCategory) => boolean;
    }> = useMemo(
        () => [
            {
                key: 'all',
                label: ui.catAll(localizedDiagnostics.length),
                matches: () => true,
            },
            {
                key: 'radiatoriai',
                label: ui.catRadiators(localizedDiagnostics.filter((s) => s.category === 'radiatoriai').length),
                matches: (cat) => cat === 'radiatoriai',
            },
            {
                key: 'grindinis',
                label: ui.catUnderfloor(localizedDiagnostics.filter((s) => s.category === 'grindinis').length),
                matches: (cat) => cat === 'grindinis',
            },
            {
                key: 'katiline',
                label: ui.catBoiler(localizedDiagnostics.filter((s) => s.category === 'katiline').length),
                matches: (cat) => cat === 'katiline',
            },
            {
                key: 'silumos-siurbliai',
                label: ui.catHeatPumps(localizedDiagnostics.filter((s) => s.category === 'silumos-siurbliai').length),
                matches: (cat) => cat === 'silumos-siurbliai',
            },
            {
                key: 'balansavimas-jungtys',
                label: ui.catBalancing(
                    localizedDiagnostics.filter((s) => s.category === 'balansavimas' || s.category === 'montavimas')
                        .length,
                ),
                matches: (cat) => cat === 'balansavimas' || cat === 'montavimas',
            },
        ],
        [localizedDiagnostics, ui],
    );

    const { features, persona } = useStorefrontConfig();
    const agentName = persona.agentName || 'Vytautas';
    const genitiveAgentName = locale === 'lt' && agentName === 'Vytautas' ? 'Vytauto' : agentName;
    const [activeId, setActiveId] = useState<string>(
        initialSymptomId || SYMPTOM_DIAGNOSTICS[0]?.id || 'whistling-radiator',
    );
    const [activeCategory, setActiveCategory] = useState<CategoryFilterKey>('all');
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [showAllMobile, setShowAllMobile] = useState<boolean>(false);

    if (!features.cadDiagnosticsEnabled) {
        return null;
    }

    const normalizedQuery = searchQuery.trim().toLowerCase();
    const activeFilterDef =
        categoryFilterPills.find((p) => p.key === activeCategory) || categoryFilterPills[0];

    const filteredSymptoms = localizedDiagnostics.filter((item) => {
        if (!activeFilterDef.matches(item.category)) return false;
        if (!normalizedQuery) return true;
        const haystack = `${item.symptomTitle} ${item.shortSymptom} ${item.causePlain} ${item.recommendedProducts.map((p) => `${p.sku} ${p.name}`).join(' ')}`.toLowerCase();
        return haystack.includes(normalizedQuery);
    });

    const visibleSymptoms = filteredSymptoms.length > 0 ? filteredSymptoms : localizedDiagnostics;

    const activeSymptom: SymptomDiagnosticCard =
        visibleSymptoms.find((item) => item.id === activeId) ||
        localizedDiagnostics.find((item) => item.id === activeId) ||
        visibleSymptoms[0] ||
        localizedDiagnostics[0];

    const activeGlobalIdx = Math.max(
        0,
        localizedDiagnostics.findIndex((s) => s.id === activeSymptom.id),
    );

    const renderRecommendedProductsAndActions = (symptom: SymptomDiagnosticCard) => (
        <div className="space-y-3">
            <div className="flex items-center justify-between gap-2 border-b border-[var(--border-subtle)] pb-2">
                <h3 className="text-xs sm:text-sm font-bold text-stone-900 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-[var(--data-ok)] shrink-0" aria-hidden="true" />
                    <span>{ui.step3RecommendedTitle}</span>
                </h3>
                <Link
                    href={symptom.catalogQueryHref}
                    className="text-xs font-semibold text-[var(--brand-secondary)] hover:underline whitespace-nowrap shrink-0"
                >
                    {ui.viewInCatalog}
                </Link>
            </div>

            <div className="space-y-2.5">
                {symptom.recommendedProducts.map((prod) => {
                    const imgUrl = assetUrl(
                        resolveProductImageUrl({
                            sku: prod.sku,
                            title: prod.name,
                            brand: prod.brand,
                        }),
                    );
                    const brandLogo = resolveBrandLogo(prod.brand, prod.name);
                    return (
                        <Link
                            key={prod.sku}
                            href={prod.catalogHref}
                            className="group block bg-transparent p-0"
                        >
                            <div className="flex items-start sm:items-center gap-3 rounded-md border border-stone-200 bg-stone-50/60 p-2.5 sm:p-3 hover:border-stone-900 transition-colors">
                                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xs bg-white p-1.5 flex items-center justify-center shrink-0">
                                    <img
                                        src={imgUrl}
                                        alt={cleanDash(prod.name)}
                                        className="max-h-full max-w-full object-contain"
                                    />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center justify-between gap-1.5 mb-1">
                                        <img
                                            src={assetUrl(brandLogo.logoPath)}
                                            alt={brandLogo.name}
                                            className="h-4 w-auto object-contain shrink-0"
                                        />
                                        <span className="tabular-nums text-xs font-semibold text-stone-900 bg-white px-1.5 py-0.5 rounded-xs">
                                            SKU: {prod.sku}
                                        </span>
                                    </div>
                                    <p className="text-xs sm:text-sm font-bold text-stone-900 group-hover:text-[var(--brand-accent)] leading-snug break-words">
                                        {cleanDash(prod.name)}
                                    </p>
                                    <div className="flex flex-wrap items-center justify-between gap-1.5 mt-1.5">
                                        <span className="inline-flex items-center gap-1 text-xs text-[var(--data-ok)] font-medium">
                                            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                                            <span>{cleanDash(prod.roleLabel)}</span>
                                        </span>
                                        <span className="text-xs font-bold text-stone-900 tabular-nums shrink-0">
                                            {cleanDash(prod.priceEstimateLabel)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    );
                })}
            </div>

            <div className="pt-1 space-y-2">
                <Link
                    href={symptom.calculatorHref}
                    className="w-full block bg-transparent p-0"
                >
                    <span className="w-full inline-flex items-center justify-center gap-2 rounded-sm bg-[var(--brand-accent)] hover:bg-[var(--brand-accent-hover)] px-4 py-2.5 text-xs font-semibold text-[var(--primary-foreground)] transition-colors text-center">
                        <Calculator className="w-4 h-4 shrink-0" aria-hidden="true" />
                        <span>{cleanDash(symptom.calculatorLabel)}</span>
                    </span>
                </Link>

                <Link
                    href={`/palyginimai/${symptom.relatedGuideSlug}`}
                    className="w-full block bg-transparent p-0"
                >
                    <span className="w-full inline-flex items-center justify-center gap-2 rounded-sm border border-stone-300 bg-white hover:border-stone-900 px-4 py-2.5 text-xs font-semibold text-stone-900 transition-colors text-center">
                        <span>{ui.readFullComparison}</span>
                    </span>
                </Link>

                <VytautasDiagnosticConsultButton
                    prompt={ui.consultPrompt(
                        symptom.symptomTitle,
                        symptom.causePlain,
                        symptom.recommendedProducts.map((p) => p.sku).join(', '),
                    )}
                    title={`${ui.consultTitlePrefix} ${symptom.symptomTitle}`}
                    summary={symptom.shortSymptom}
                    recommendedSkus={symptom.recommendedProducts.map((p) => p.sku)}
                    label={ui.consultBtnLabel(genitiveAgentName)}
                />
            </div>
        </div>
    );

    const renderMobileAccordionContent = (symptom: SymptomDiagnosticCard, symptomNumber: number) => (
        <div className="space-y-3.5">
            <div className="space-y-1.5">
                <p className="text-sm leading-relaxed text-stone-800">
                    <strong className="font-bold text-[var(--primary)]">
                        {ui.situationBadge(symptomNumber)}.
                    </strong>{' '}
                    <strong className="font-bold text-stone-900">
                        {ui.step1CauseTitle}
                    </strong>{' '}
                    {cleanDash(symptom.causePlain)}
                </p>
            </div>

            <div className="space-y-1.5">
                <h3 className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                    <Wrench className="w-3.5 h-3.5 text-[var(--brand-secondary)] shrink-0" aria-hidden="true" />
                    <span>{ui.step2CheckTitle}</span>
                </h3>
                <ol className="space-y-1.5">
                    {symptom.fiveMinFixSteps.map((step, idx) => (
                        <li
                            key={idx}
                            className="flex items-start gap-2.5 rounded-sm bg-stone-50 px-2.5 py-2 text-xs text-stone-800 leading-relaxed"
                        >
                            <span className="w-5 h-5 rounded-xs bg-stone-900 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                                {idx + 1}
                            </span>
                            <span>{cleanDash(step)}</span>
                        </li>
                    ))}
                </ol>
            </div>

            <div className="rounded-sm bg-amber-50/80 px-3 py-2.5 flex items-start gap-2 text-xs text-stone-900 leading-relaxed">
                <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                    <strong className="font-bold text-amber-900 mr-1">
                        {ui.commonMistakeLabel}
                    </strong>
                    {cleanDash(symptom.mistakeWarning)}
                </div>
            </div>

            {renderRecommendedProductsAndActions(symptom)}

            <div className="pt-1">
                <DiagnosticBlueprintSvg symptomId={symptom.id} locale={locale} />
            </div>
        </div>
    );

    const renderDesktopDiagnosticPanelContent = (
        symptom: SymptomDiagnosticCard,
        symptomNumber: number,
    ) => (
        <div className="space-y-4">
            <div>
                <span className="inline-block text-xs font-semibold text-[var(--primary)] mb-1">
                    {ui.situationBadge(symptomNumber)}
                </span>
                <h3 className="text-lg md:text-xl font-bold text-stone-900">
                    {cleanDash(symptom.symptomTitle)}
                </h3>
                <div className="mt-3 rounded-sm bg-[var(--surface-paper)] p-3.5">
                    <p className="text-xs font-bold text-stone-900 mb-1">
                        {ui.step1CauseTitle}
                    </p>
                    <p className="text-sm text-stone-800 leading-relaxed">
                        {cleanDash(symptom.causePlain)}
                    </p>
                </div>
                <div className="mt-3">
                    <DiagnosticBlueprintSvg symptomId={symptom.id} locale={locale} />
                </div>
            </div>

            <div>
                <div className="flex items-center gap-2 mb-2">
                    <Wrench className="w-4 h-4 text-[var(--brand-secondary)]" aria-hidden="true" />
                    <h3 className="text-xs sm:text-sm font-bold text-stone-900">
                        {ui.step2CheckTitle}
                    </h3>
                </div>
                <ol className="space-y-2">
                    {symptom.fiveMinFixSteps.map((step, idx) => (
                        <li
                            key={idx}
                            className="flex items-start gap-3 rounded-sm bg-stone-50/80 p-3"
                        >
                            <span className="w-5 h-5 rounded-xs bg-stone-900 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                                {idx + 1}
                            </span>
                            <span className="text-xs md:text-sm text-stone-800 leading-relaxed">
                                {cleanDash(step)}
                            </span>
                        </li>
                    ))}
                </ol>
            </div>

            <div className="rounded-sm bg-amber-50/80 p-3.5 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" aria-hidden="true" />
                <div className="text-xs text-stone-900 leading-relaxed">
                    <strong className="font-bold text-amber-900 mr-1">
                        {ui.commonMistakeLabel}
                    </strong>
                    {cleanDash(symptom.mistakeWarning)}
                </div>
            </div>

            {renderRecommendedProductsAndActions(symptom)}
        </div>
    );

    return (
        <section
            aria-labelledby="symptom-diagnostic-heading"
            className="py-8 md:py-10 bg-[var(--surface-canvas)] text-[var(--text-primary)] border-b border-[var(--border)]"
        >
            <div className="container mx-auto max-w-6xl px-4 sm:px-6">
                {/* Daylight Header */}
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-5">
                    <div>
                        <h2
                            id="symptom-diagnostic-heading"
                            className="text-xl md:text-2xl font-bold text-[var(--text-primary)] md:tracking-tight"
                        >
                            {ui.heading(localizedDiagnostics.length)}
                        </h2>
                        <p className="text-sm text-[var(--text-secondary)] mt-1 max-w-3xl leading-relaxed">
                            {ui.subtitle}
                        </p>
                    </div>
                    {showHubLink && (
                        <Link
                            href="/palyginimai"
                            className="inline-flex items-center gap-2 rounded-sm bg-[var(--brand-accent)] hover:bg-[var(--brand-accent-hover)] px-4 py-2.5 text-xs font-semibold text-[var(--primary-foreground)] transition-colors shrink-0"
                        >
                            <span>{ui.allComparisonsBtn}</span>
                        </Link>
                    )}
                </div>

                {/* Category Filter Tabs + Symptom Search Input */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
                    <div
                        role="group"
                        aria-label={ui.filterGroupAria}
                        className="flex flex-wrap items-center gap-1.5"
                    >
                        {categoryFilterPills.map((pill) => {
                            const isActive = pill.key === activeCategory;
                            return (
                                <button
                                    key={pill.key}
                                    type="button"
                                    onClick={() => {
                                        setActiveCategory(pill.key);
                                        const firstInCat = localizedDiagnostics.find((s) =>
                                            pill.matches(s.category),
                                        );
                                        if (firstInCat) setActiveId(firstInCat.id);
                                    }}
                                    className="bg-transparent p-0 border-0 cursor-pointer"
                                >
                                    <span
                                        className={
                                            isActive
                                                ? 'inline-flex items-center rounded-sm bg-stone-900 text-white px-3 py-1.5 text-xs font-semibold transition-colors'
                                                : 'inline-flex items-center rounded-sm border border-stone-300 bg-white text-stone-700 hover:border-stone-900 hover:text-stone-900 px-3 py-1.5 text-xs font-semibold transition-colors'
                                        }
                                    >
                                        {pill.label}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    <div className="relative w-full md:w-96 shrink-0">
                        <Search
                            className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                            aria-hidden="true"
                        />
                        <input
                            type="search"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder={ui.searchPlaceholder}
                            aria-label={ui.searchPlaceholder}
                            className="w-full rounded-sm border border-slate-300 bg-white pl-8 pr-3 py-1.5 text-xs text-stone-900 placeholder:text-slate-600 focus:border-stone-900 focus:outline-none"
                        />
                    </div>
                </div>

                {/* 2-Column Desktop Workspace (lg:grid-cols-12) + Self-Contained Mobile Accordion (< lg:) */}
                <div className="lg:grid lg:grid-cols-12 lg:gap-6 items-start">
                    <div className="lg:col-span-5">
                        <div
                            role="tablist"
                            aria-label={ui.tablistAria}
                            className="grid grid-cols-1 gap-2.5"
                        >
                            {visibleSymptoms.map((item, vIdx) => {
                                const isSelected = item.id === activeSymptom.id;
                                const globalIdx = localizedDiagnostics.findIndex(
                                    (s) => s.id === item.id,
                                );
                                const symptomNumber = globalIdx >= 0 ? globalIdx + 1 : vIdx + 1;
                                const primaryProd = item.recommendedProducts[0];
                                const thumbUrl = primaryProd
                                    ? assetUrl(
                                          resolveProductImageUrl({
                                              sku: primaryProd.sku,
                                              title: primaryProd.name,
                                              brand: primaryProd.brand,
                                          }),
                                      )
                                    : null;
                                const hideOnCollapsedMobile =
                                    !showAllMobile &&
                                    activeCategory === 'all' &&
                                    !normalizedQuery &&
                                    vIdx >= 6 &&
                                    !isSelected;

                                return (
                                    <div
                                        key={item.id}
                                        data-symptom-card={item.id}
                                        className={`${
                                            hideOnCollapsedMobile ? 'hidden lg:block' : 'block'
                                        } scroll-mt-24 rounded-xl border transition-colors bg-white ${
                                            isSelected
                                                ? 'border-2 border-[var(--primary)] shadow-xs'
                                                : 'border-stone-300 hover:border-stone-500'
                                        }`}
                                    >
                                        <button
                                            type="button"
                                            role="tab"
                                            aria-selected={isSelected}
                                            onClick={(e) => {
                                                setActiveId(item.id);
                                                recordDiagnosticSymptom({
                                                    symptomId: item.id,
                                                    title: item.symptomTitle,
                                                    summary: item.shortSymptom,
                                                    recommendedSkus: item.recommendedProducts.map(
                                                        (p) => p.sku,
                                                    ),
                                                });
                                                if (
                                                    typeof window !== 'undefined' &&
                                                    window.innerWidth < 1024
                                                ) {
                                                    const cardEl =
                                                        (e.currentTarget.closest(
                                                            '[data-symptom-card]',
                                                        ) as HTMLElement | null) ?? e.currentTarget;
                                                    setTimeout(() => {
                                                        const rect = cardEl.getBoundingClientRect();
                                                        const targetScrollTop = Math.max(
                                                            0,
                                                            window.scrollY + rect.top - 88,
                                                        );
                                                        window.scrollTo({
                                                            top: targetScrollTop,
                                                            behavior: 'smooth',
                                                        });
                                                    }, 40);
                                                }
                                            }}
                                            className="w-full h-auto text-left bg-transparent p-0 border-0 cursor-pointer block"
                                        >
                                            <div className="w-full h-auto p-3.5 flex items-start gap-3">
                                                <span
                                                    className={`w-6 h-6 rounded-xs text-xs font-bold flex items-center justify-center shrink-0 mt-0.5 ${
                                                        isSelected
                                                            ? 'bg-[var(--primary)] text-white'
                                                            : 'bg-stone-100 text-stone-700'
                                                    }`}
                                                >
                                                    {symptomNumber}
                                                </span>
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-sm font-bold text-stone-900 leading-snug">
                                                        {cleanDash(item.symptomTitle)}
                                                    </p>
                                                    <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                                                        {cleanDash(item.shortSymptom)}
                                                    </p>
                                                </div>
                                                {thumbUrl && (
                                                    <div className="w-11 h-11 rounded-xs border border-stone-200 bg-white p-1 flex items-center justify-center shrink-0">
                                                        <img
                                                            src={thumbUrl}
                                                            alt={cleanDash(primaryProd.name)}
                                                            className="max-h-full max-w-full object-contain"
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </button>

                                        {/* Inline Mobile Accordion Diagnostic Solution Panel (< 1024px) */}
                                        {isSelected && (
                                            <div
                                                role="tabpanel"
                                                data-testid="mobile-inline-diagnostic-panel"
                                                className="lg:hidden border-t border-stone-200 px-3.5 pt-2.5 pb-4"
                                            >
                                                {renderMobileAccordionContent(item, symptomNumber)}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {activeCategory === 'all' &&
                            !normalizedQuery &&
                            visibleSymptoms.length > 6 && (
                                <button
                                    type="button"
                                    onClick={() => setShowAllMobile((prev) => !prev)}
                                    className="lg:hidden mt-3 w-full bg-transparent p-0 border-0 cursor-pointer block"
                                >
                                    <span className="w-full min-h-[44px] inline-flex items-center justify-center rounded-sm border border-stone-300 bg-white px-4 py-2.5 text-xs font-bold text-stone-900 hover:border-stone-900">
                                        {showAllMobile
                                            ? ui.showLessMobile
                                            : ui.showAllMobile(visibleSymptoms.length)}
                                    </span>
                                </button>
                            )}
                    </div>

                    {/* Desktop Master-Detail Diagnostic Output Panel (>= 1024px) */}
                    <div
                        role="tabpanel"
                        data-testid="desktop-diagnostic-panel"
                        className="hidden lg:block lg:col-span-7 lg:sticky lg:top-24 h-auto rounded-xl border border-stone-300 bg-white p-5 md:p-6 shadow-2xs"
                    >
                        {renderDesktopDiagnosticPanelContent(activeSymptom, activeGlobalIdx + 1)}
                    </div>
                </div>
            </div>
        </section>
    );
}
