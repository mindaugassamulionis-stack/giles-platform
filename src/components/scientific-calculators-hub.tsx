'use client';

import { useEffect, useMemo, useState } from 'react';
import NextLink from 'next/link';
import { usePathname as useNextPathname } from 'next/navigation';
import { useLocale } from 'next-intl';
import { Link } from '../i18n/navigation';
import { resolveAppLocale } from '../i18n/storefront-ui-copy';
import type { AppLocale } from '../i18n/routing';
import {
    Flame,
    Gauge,
    GitBranch,
    Layers,
    Thermometer,
    CheckCircle2,
    FileText,
} from 'lucide-react';
import { apiUrl, assetUrl } from '../lib/api';
import { resolveProductImageUrl, resolveBrandLogo } from '../lib/product-visuals';
import {
    BoilerHouseVisual,
    ExpansionVesselVisual,
    UnderfloorManifoldVisual,
    RadiatorNodeVisual,
    HydraulicPipeVisual,
} from './calculator-visual-diagrams';
import {
    SCIENTIFIC_CALCULATOR_TABS,
    ENERGY_CLASS_SPECS,
    calculateBoilerAndHeatLoss,
    calculateExpansionVessel,
    calculateHydraulicValve,
    calculateUnderfloorManifold,
    calculateRadiatorNode,
    type CalculatorToolId,
    type EnergyClassId,
    type LtClimateZoneId,
    type VentilationTypeId,
    type DhwModeId,
    type EmitterTypeId,
    type MaxFlowTempC,
    type GlycolPercent,
    type SafetyValveBar,
    type PipeSpacingCm,
    type RadiatorConnectionType,
    type RadiatorControlType,
    type RadiatorHeadType,
} from '../lib/scientific-calculators';
import type { CalculatorRecommendedProduct } from '../lib/scientific-calculators-catalog';
import { CALCULATOR_MARKETING_BY_TOOL } from '../lib/calculator-marketing';
import {
    recordCalculatorRun,
    recordSelectedVariant,
    openVytautasWithContext,
} from '../lib/customer-journey-tracker';
import { useStorefrontConfig } from './storefront-config-provider';
import { useCartStore } from '../store/cart';
import { useVatDisplayStore } from '../store/vat-display';
import {
    CALCULATOR_BUILDING_PRESETS,
    calcHydronicNode6In1,
    type HydronicEnergyClass,
    type HydronicHeatSourceId,
} from '../lib/heat-load-calc';
import {
    GilesLiveHydronicSchematic,
    GilesPumpQhChart,
} from './giles-live-hydronic-schematic';
import { ApvaSubsidyWidget } from './apva-subsidy-widget';

export interface ScientificCalculatorsHubProps {
    initialTab?: CalculatorToolId;
    initialRecommendationsByTool?: Partial<Record<CalculatorToolId, CalculatorRecommendedProduct[]>>;
}

const cleanDash = (s: string) => s.replace(/\u2014/g, '–').replace(/[\u00A9\u00AE\u2122]/g, '');

export function formatInstrumentalAgentName(name: string): string {
    const trimmed = (name || 'Vytautas').trim();
    if (/as$/i.test(trimmed)) return trimmed.replace(/as$/i, 'u');
    if (/is$/i.test(trimmed)) return trimmed.replace(/is$/i, 'iu');
    if (/us$/i.test(trimmed)) return trimmed.replace(/us$/i, 'umi');
    if (/ė$/i.test(trimmed)) return trimmed.replace(/ė$/i, 'e');
    return trimmed;
}

const TAB_PREVIEW_SKUS: Record<CalculatorToolId, { sku: string; title: string; brand: string }> = {
    boiler: { sku: '7895122', title: 'IMI Pneumatex Zeparo ZUC 22', brand: 'IMI Pneumatex' },
    vessel: { sku: '7101003', title: 'IMI Pneumatex Statico SD 25.3', brand: 'IMI Pneumatex' },
    valve: { sku: '52-151-020', title: 'IMI TA STAD DN20 balansinis vožtuvas', brand: 'IMI TA' },
    manifold: { sku: '9330-06.800', title: 'IMI Heimeier Dynacon Eclipse 6 kont.', brand: 'IMI Heimeier' },
    radiator: { sku: '013G2970', title: 'Danfoss Redia RA Click galvutė', brand: 'Danfoss' },
};

const FALLBACK_RECOMMENDATIONS: CalculatorRecommendedProduct[] = [
    {
        id: '7101003',
        sku: '7101003',
        title: 'IMI Pneumatex Statico SD 25.3 plėtimosi indas',
        brand: 'IMI Pneumatex',
        brandLogoUrl: resolveBrandLogo('IMI Pneumatex').logoPath,
        brandOrigin: 'Šveicarija',
        priceEur: 84.0,
        imageUrl: resolveProductImageUrl({ sku: '7101003', title: 'Statico SD 25.3', brand: 'IMI Pneumatex' }),
        categoryName: 'Plėtimosi indai',
        roleLabel: '1. Sistemos plėtimosi indas',
        matchReason: 'Šveicariška Airproof butilo membrana stabiliai palaiko katilinės slėgį.',
        recommendedQty: 1,
    },
    {
        id: '7895122',
        sku: '7895122',
        title: 'IMI Pneumatex Zeparo ZUC 22 mikroburbulų separatorius',
        brand: 'IMI Pneumatex',
        brandLogoUrl: resolveBrandLogo('IMI Pneumatex').logoPath,
        brandOrigin: 'Šveicarija',
        priceEur: 142.0,
        imageUrl: resolveProductImageUrl({ sku: '7895122', title: 'Zeparo ZUC 22', brand: 'IMI Pneumatex' }),
        categoryName: 'Oro ir purvo atskyrikliai',
        roleLabel: '2. Oro ir purvo atskyriklis',
        matchReason: 'Šalina mikroburbuliukus ir magnetitą iš katilo kontūro.',
        recommendedQty: 1,
    },
    {
        id: '9330-06.800',
        sku: '9330-06.800',
        title: 'IMI Heimeier Dynacon Eclipse 6 kontūrų kolektorius',
        brand: 'IMI Heimeier',
        brandLogoUrl: resolveBrandLogo('IMI Heimeier').logoPath,
        brandOrigin: 'Vokietija',
        priceEur: 268.0,
        imageUrl: resolveProductImageUrl({ sku: '9330-06.800', title: 'Dynacon Eclipse', brand: 'IMI Heimeier' }),
        categoryName: 'Grindinis šildymas',
        roleLabel: '3. Automatinis kolektorius su AFC',
        matchReason: 'Automatiškai palaiko nustatytą srautą (l/h) be rankinio balansavimo.',
        recommendedQty: 1,
    },
    {
        id: '013G2970',
        sku: '013G2970',
        title: 'Danfoss Redia RA Click termostatinė galvutė',
        brand: 'Danfoss',
        brandLogoUrl: resolveBrandLogo('Danfoss').logoPath,
        brandOrigin: 'Danija',
        priceEur: 24.5,
        imageUrl: resolveProductImageUrl({ sku: '013G2970', title: 'Danfoss Redia', brand: 'Danfoss' }),
        categoryName: 'Termostatinės galvutės',
        roleLabel: '4. Skystinė termostatinė galvutė',
        matchReason: 'Greitaeigis skystinis jutiklis tiksliai palaiko kambario temperatūrą.',
        recommendedQty: 4,
    },
];

export function ScientificCalculatorsHub({
    initialTab = 'boiler',
    initialRecommendationsByTool = {},
}: ScientificCalculatorsHubProps) {
    const { features, persona } = useStorefrontConfig();
    const agentName = persona.agentName || 'Vytautas';
    const instrumentalAgentName = formatInstrumentalAgentName(agentName);
    const [activeTab, setActiveTab] = useState<CalculatorToolId>(initialTab);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const sp = new URLSearchParams(window.location.search);
        const tabParam = sp.get('tab') as CalculatorToolId | null;
        if (tabParam && SCIENTIFIC_CALCULATOR_TABS.some((t) => t.id === tabParam)) {
            setActiveTab(tabParam);
        }
    }, []);

    // Calculator 1 state: Boiler & Building Heat Loss
    const [areaM2, setAreaM2] = useState<number>(140);
    const [energyClass, setEnergyClass] = useState<EnergyClassId>('A+');
    const [climateZone, setClimateZone] = useState<LtClimateZoneId>('vidurio');
    const [indoorTempC, setIndoorTempC] = useState<number>(21);
    const [ceilingHeightM, setCeilingHeightM] = useState<number>(2.7);
    const [ventilationType, setVentilationType] = useState<VentilationTypeId>('rekuperacija_85');
    const [occupants, setOccupants] = useState<number>(4);
    const [dhwMode, setDhwMode] = useState<DhwModeId>('boileris');

    const boilerResult = useMemo(
        () =>
            calculateBoilerAndHeatLoss({
                areaM2,
                energyClass,
                climateZone,
                indoorTempC,
                ceilingHeightM,
                ventilationType,
                occupants,
                dhwMode,
            }),
        [areaM2, energyClass, climateZone, indoorTempC, ceilingHeightM, ventilationType, occupants, dhwMode],
    );

    // Calculator 2 state: Expansion Vessel
    const [vesselPowerKw, setVesselPowerKw] = useState<number>(18);
    const [emitterType, setEmitterType] = useState<EmitterTypeId>('underfloor');
    const [maxFlowTempC, setMaxFlowTempC] = useState<MaxFlowTempC>('60');
    const [glycolPercent, setGlycolPercent] = useState<GlycolPercent>(0);
    const [staticHeightM, setStaticHeightM] = useState<number>(7);
    const [safetyValveBar, setSafetyValveBar] = useState<SafetyValveBar>(3.0);

    const vesselResult = useMemo(
        () =>
            calculateExpansionVessel({
                systemPowerKw: vesselPowerKw,
                emitterType,
                maxFlowTempC,
                glycolPercent,
                staticHeightM,
                safetyValveBar,
            }),
        [vesselPowerKw, emitterType, maxFlowTempC, glycolPercent, staticHeightM, safetyValveBar],
    );

    // Calculator 3 state: Hydraulic Balancing Valve Kv & DN
    const [branchPowerKw, setBranchPowerKw] = useState<number>(12);
    const [deltaTK, setDeltaTK] = useState<5 | 10 | 15 | 20>(15);
    const [targetDpKpa, setTargetDpKpa] = useState<number>(10);

    const valveResult = useMemo(
        () =>
            calculateHydraulicValve({
                branchPowerKw,
                deltaTK,
                targetDpKpa,
            }),
        [branchPowerKw, deltaTK, targetDpKpa],
    );

    // Calculator 4 state: Underfloor Heating Manifold & Loops
    const [floorAreaM2, setFloorAreaM2] = useState<number>(85);
    const [pipeSpacingCm, setPipeSpacingCm] = useState<PipeSpacingCm>(15);
    const [specificLoadWm2, setSpecificLoadWm2] = useState<number>(50);
    const [maxLoopLengthM, setMaxLoopLengthM] = useState<number>(80);

    const manifoldResult = useMemo(
        () =>
            calculateUnderfloorManifold({
                floorAreaM2,
                pipeSpacingCm,
                specificLoadWm2,
                maxLoopLengthM,
            }),
        [floorAreaM2, pipeSpacingCm, specificLoadWm2, maxLoopLengthM],
    );

    // Calculator 5 state: Radiator Node & Thermostatic Kit Wizard
    const [radiatorCount, setRadiatorCount] = useState<number>(6);
    const [connectionType, setConnectionType] = useState<RadiatorConnectionType>('bottom_vk_50mm');
    const [controlType, setControlType] = useState<RadiatorControlType>('afc_dynamic');
    const [headType, setHeadType] = useState<RadiatorHeadType>('liquid_click_or_m30');

    const radiatorResult = useMemo(
        () =>
            calculateRadiatorNode({
                radiatorCount,
                connectionType,
                controlType,
                headType,
            }),
        [radiatorCount, connectionType, controlType, headType],
    );

    // Live Catalog Recommendations Fetcher
    const [recommendations, setRecommendations] = useState<CalculatorRecommendedProduct[]>(
        () => initialRecommendationsByTool[initialTab] ?? [],
    );
    const [loadingRecs, setLoadingRecs] = useState<boolean>(false);

    const queryString = useMemo(() => {
        const sp = new URLSearchParams();
        sp.set('tool', activeTab);
        if (activeTab === 'boiler') {
            sp.set('kw', String(boilerResult.recommendedBoilerKw));
            sp.set('liters', String(boilerResult.recommendedCylinderLiters || 25));
        } else if (activeTab === 'vessel') {
            sp.set('liters', String(vesselResult.standardVesselLiters));
            sp.set('kw', String(vesselPowerKw));
        } else if (activeTab === 'valve') {
            sp.set('dn', valveResult.recommendedDn);
            sp.set('kv', String(valveResult.requiredKv));
        } else if (activeTab === 'manifold') {
            sp.set('loops', String(manifoldResult.recommendedLoops));
        } else if (activeTab === 'radiator') {
            sp.set('radiators', String(radiatorCount));
            sp.set('connection', connectionType);
            sp.set('control', controlType);
        }
        return sp.toString();
    }, [
        activeTab,
        boilerResult.recommendedBoilerKw,
        boilerResult.recommendedCylinderLiters,
        vesselResult.standardVesselLiters,
        vesselPowerKw,
        valveResult.recommendedDn,
        valveResult.requiredKv,
        manifoldResult.recommendedLoops,
        radiatorCount,
        connectionType,
        controlType,
    ]);

    useEffect(() => {
        const preloaded = initialRecommendationsByTool[activeTab];
        if (preloaded && preloaded.length > 0 && recommendations.length === 0) {
            setRecommendations(preloaded);
        }

        let cancelled = false;
        const timer = setTimeout(async () => {
            setLoadingRecs(true);
            try {
                const res = await fetch(apiUrl(`/api/calculator-recommendations?${queryString}`));
                if (!res.ok) return;
                const data = await res.json();
                if (!cancelled && Array.isArray(data.items) && data.items.length > 0) {
                    setRecommendations(data.items);
                }
            } catch {
                // Keep existing SSR / cached recommendations on transient network error
            } finally {
                if (!cancelled) setLoadingRecs(false);
            }
        }, 180);

        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, [queryString, activeTab, initialRecommendationsByTool]);

    const activeTabMeta =
        SCIENTIFIC_CALCULATOR_TABS.find((t) => t.id === activeTab) ?? SCIENTIFIC_CALCULATOR_TABS[0];
    const activeMarketing =
        CALCULATOR_MARKETING_BY_TOOL[activeTab] ?? CALCULATOR_MARKETING_BY_TOOL.boiler;

    const getTabIcon = (id: CalculatorToolId) => {
        switch (id) {
            case 'boiler':
                return <Flame className="w-4 h-4 shrink-0" aria-hidden="true" />;
            case 'vessel':
                return <Gauge className="w-4 h-4 shrink-0" aria-hidden="true" />;
            case 'valve':
                return <GitBranch className="w-4 h-4 shrink-0" aria-hidden="true" />;
            case 'manifold':
                return <Layers className="w-4 h-4 shrink-0" aria-hidden="true" />;
            case 'radiator':
                return <Thermometer className="w-4 h-4 shrink-0" aria-hidden="true" />;
        }
    };

    const rfqSpecString = useMemo(() => {
        const skus = recommendations.map((r) => `${r.sku} (${r.recommendedQty} vnt.)`).join(', ');
        if (activeTab === 'boiler') {
            return `EN12831 Katilas ${boilerResult.recommendedBoilerKw} kW + Boileris ${boilerResult.recommendedCylinderLiters} l | SKUs: ${skus}`;
        }
        if (activeTab === 'vessel') {
            return `EN12828 Plėtimosi indas Statico ${vesselResult.standardVesselLiters} l (P0=${vesselResult.prechargeBar} bar) | SKUs: ${skus}`;
        }
        if (activeTab === 'valve') {
            return `Balansinis vožtuvas ${valveResult.recommendedDn} Kv=${valveResult.requiredKv} m3/h (${valveResult.flowLh} l/h) | SKUs: ${skus}`;
        }
        if (activeTab === 'manifold') {
            return `EN1264 Kolektorius ${manifoldResult.recommendedLoops} kontūrų (${manifoldResult.totalPipeLengthM} m vamzdžio) | SKUs: ${skus}`;
        }
        return `Radiatorių mazgai ${radiatorCount} vnt. (${radiatorResult.recommendedSeriesLabel}) | SKUs: ${skus}`;
    }, [
        activeTab,
        recommendations,
        boilerResult,
        vesselResult,
        valveResult,
        manifoldResult,
        radiatorCount,
        radiatorResult,
    ]);

    useEffect(() => {
        const inputsSummary =
            activeTab === 'boiler'
                ? `${areaM2} m², ${energyClass}, ${occupants} žm.`
                : activeTab === 'vessel'
                  ? `${vesselPowerKw} kW, H=${staticHeightM} m, Tmax=${maxFlowTempC}°C`
                  : activeTab === 'valve'
                    ? `${branchPowerKw} kW, dT=${deltaTK}K, dp=${targetDpKpa} kPa`
                    : activeTab === 'manifold'
                      ? `${floorAreaM2} m², žingsnis ${pipeSpacingCm} cm`
                      : `${radiatorCount} rad., ${connectionType}`;
        const resultSummary =
            activeTab === 'boiler'
                ? `${boilerResult.recommendedBoilerKw.toFixed(1)} kW katilas + ${boilerResult.recommendedCylinderLiters} l boileris`
                : activeTab === 'vessel'
                  ? `${vesselResult.standardVesselLiters} l Statico indas (P0=${vesselResult.prechargeBar.toFixed(1)} bar)`
                  : activeTab === 'valve'
                    ? `${valveResult.recommendedDn} (Kv=${valveResult.requiredKv.toFixed(2)}, v=${valveResult.waterVelocityMs.toFixed(2)} m/s)`
                    : activeTab === 'manifold'
                      ? `${manifoldResult.recommendedLoops} kontūrų kolektorius (${manifoldResult.totalPipeLengthM} m vamzdžio)`
                      : `${radiatorCount} radiatorių mazgai (${radiatorResult.recommendedSeriesLabel})`;
        recordCalculatorRun({
            tab: activeTab,
            labelLt: activeTabMeta.shortTitleLt,
            inputsSummary,
            resultSummary,
            recommendedSkus: recommendations.map((r) => r.sku),
        });
    }, [
        activeTab,
        activeTabMeta.shortTitleLt,
        areaM2,
        energyClass,
        occupants,
        boilerResult.recommendedBoilerKw,
        boilerResult.recommendedCylinderLiters,
        vesselPowerKw,
        staticHeightM,
        maxFlowTempC,
        vesselResult.standardVesselLiters,
        vesselResult.prechargeBar,
        branchPowerKw,
        deltaTK,
        targetDpKpa,
        valveResult.recommendedDn,
        valveResult.requiredKv,
        valveResult.waterVelocityMs,
        floorAreaM2,
        pipeSpacingCm,
        manifoldResult.recommendedLoops,
        manifoldResult.totalPipeLengthM,
        radiatorCount,
        connectionType,
        radiatorResult.recommendedSeriesLabel,
        recommendations,
    ]);

    const pillBtn = (active: boolean) =>
        `px-3 py-2 rounded-sm border text-xs font-semibold transition-colors cursor-pointer text-left ${
            active
                ? 'border-[var(--primary)] bg-[var(--primary)] text-white'
                : 'border-stone-300 bg-white text-stone-800 hover:border-stone-500'
        }`;

    const cardBtn = (active: boolean) =>
        `p-2.5 rounded-sm border text-left transition-colors cursor-pointer ${
            active
                ? 'border-[var(--primary)] bg-red-50/60 text-stone-900 ring-1 ring-[var(--primary)]'
                : 'border-stone-300 bg-white text-stone-800 hover:border-stone-500'
        }`;

    const stepCardCls = 'rounded-md border border-stone-200 bg-[var(--surface-paper)] p-4 space-y-3.5';
    const labelCls = 'block text-xs font-semibold text-stone-800 mb-1.5';

    return (
        <div className="space-y-6">
            {/* 5-in-1 Interactive Equipment Selector Tabs (Daylight, Sentence Case, Zero Truncation) */}
            <div
                role="tablist"
                aria-label="Interaktyvios ŠVOK įrangos skaičiuoklės"
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 items-stretch"
            >
                {SCIENTIFIC_CALCULATOR_TABS.map((tab, idx) => {
                    const isSelected = tab.id === activeTab;
                    const preview = TAB_PREVIEW_SKUS[tab.id];
                    const thumbUrl = assetUrl(
                        resolveProductImageUrl({
                            sku: preview.sku,
                            title: preview.title,
                            brand: preview.brand,
                        }),
                    );
                    return (
                        <button
                            key={tab.id}
                            role="tab"
                            type="button"
                            aria-selected={isSelected}
                            onClick={() => {
                                setActiveTab(tab.id);
                                if (initialRecommendationsByTool[tab.id]?.length) {
                                    setRecommendations(initialRecommendationsByTool[tab.id]!);
                                }
                            }}
                            className={`text-left rounded-md border p-3 transition-colors duration-150 flex items-start gap-2.5 cursor-pointer ${
                                isSelected
                                    ? 'border-[var(--primary)] border-b-2 bg-white text-stone-900 shadow-xs'
                                    : 'border-stone-300 bg-white text-stone-700 hover:border-stone-500'
                            }`}
                        >
                            <div className="w-9 h-9 rounded-xs border border-stone-200 bg-white p-1 flex items-center justify-center shrink-0 mt-0.5">
                                <img
                                    src={thumbUrl}
                                    alt={preview.title}
                                    className="max-h-full max-w-full object-contain"
                                />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-start gap-1.5 mb-0.5">
                                    <span
                                        className={`inline-flex items-start gap-1 text-xs font-bold leading-snug ${
                                            isSelected ? 'text-[var(--primary)]' : 'text-stone-900'
                                        }`}
                                    >
                                        <span className="mt-0.5 shrink-0">{getTabIcon(tab.id)}</span>
                                        <span>{`${idx + 1}. ${tab.shortTitleLt}`}</span>
                                    </span>
                                </div>
                                <span className="block text-[11px] text-stone-500 leading-snug">
                                    {cleanDash(tab.standardBadge)}
                                </span>
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* Main 2-Column Workspace: Left = 3 Step-Grouped Pill Configurators, Right = Result Hero + Store Products */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* LEFT COLUMN: Step-Grouped Visual Configurator (5 cols) */}
                <section
                    aria-label={activeTabMeta.titleLt}
                    className="lg:col-span-5 rounded-md border border-stone-300 bg-white p-5 space-y-4 shadow-2xs"
                >
                    <div className="border-b border-stone-200 pb-3">
                        <h2 className="text-lg font-bold text-stone-900">
                            {cleanDash(activeTabMeta.titleLt)}
                        </h2>
                        <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                            {cleanDash(activeTabMeta.summaryLt)}
                        </p>
                    </div>

                    {/* TAB 1 INPUTS: BOILER & HEAT LOSS */}
                    {activeTab === 'boiler' && (
                        <div className="space-y-4">
                            {/* Step 1 */}
                            <div className={stepCardCls}>
                                <h3 className="text-sm font-bold text-stone-900">
                                    1. Pastato plotas ir šiltinimas
                                </h3>

                                <div>
                                    <div className="flex justify-between items-baseline mb-1.5">
                                        <label htmlFor="calc-area" className="text-xs font-semibold text-stone-800">
                                            Šildomas plotas
                                        </label>
                                        <span className="text-base font-bold text-[var(--primary)] tabular-nums">
                                            {areaM2} m²
                                        </span>
                                    </div>
                                    <input
                                        id="calc-area"
                                        type="range"
                                        min={30}
                                        max={500}
                                        step={5}
                                        value={areaM2}
                                        onChange={(e) => setAreaM2(Number(e.target.value))}
                                        className="w-full accent-[var(--primary)]"
                                    />
                                    <div className="mt-2 flex flex-wrap gap-1.5">
                                        {[80, 120, 140, 180, 240].map((preset) => (
                                            <button
                                                key={preset}
                                                type="button"
                                                onClick={() => setAreaM2(preset)}
                                                className={pillBtn(areaM2 === preset)}
                                            >
                                                {preset} m²
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <span className={labelCls}>Pastato šiltinimo klasė</span>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        {(
                                            [
                                                { id: 'A++', title: 'A++ / A+ (Nauja statyba)', desc: 'Po 2018 m., sandarus namas' },
                                                { id: 'A+', title: 'A+ klasė (2018–2021 m.)', desc: 'Šiuolaikinė šiltinta statyba' },
                                                { id: 'B', title: 'B / C (2006–2016 m.)', desc: 'Vidutiniškai šiltintas / renovacija' },
                                                { id: 'C', title: 'Renovacija (1993–2005 m.)', desc: 'Dalinai šiltintas pastatas' },
                                                { id: 'D_E', title: 'Senas namas (iki 1993 m.)', desc: 'Neapšiltintos sienos' },
                                            ] as { id: EnergyClassId; title: string; desc: string }[]
                                        ).map((item) => {
                                            const isAct = energyClass === item.id;
                                            return (
                                                <button
                                                    key={item.id}
                                                    type="button"
                                                    onClick={() => setEnergyClass(item.id)}
                                                    className={cardBtn(isAct)}
                                                >
                                                    <div className="text-xs font-bold text-stone-900">{item.title}</div>
                                                    <div className="text-[11px] text-stone-600 mt-0.5">{item.desc}</div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <p className="mt-1.5 text-[11px] text-stone-600">
                                        {cleanDash(ENERGY_CLASS_SPECS[energyClass].descriptionLt)}
                                    </p>
                                </div>

                                <div>
                                    <span className={labelCls}>Lubų aukštis</span>
                                    <div className="grid grid-cols-4 gap-1.5">
                                        {[
                                            { val: 2.5, label: '2,5 m' },
                                            { val: 2.7, label: '2,7 m' },
                                            { val: 3.0, label: '3,0 m' },
                                            { val: 3.5, label: '3,5 m' },
                                        ].map((h) => (
                                            <button
                                                key={h.val}
                                                type="button"
                                                onClick={() => setCeilingHeightM(h.val)}
                                                className={`${pillBtn(ceilingHeightM === h.val)} text-center`}
                                            >
                                                {h.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Step 2 */}
                            <div className={stepCardCls}>
                                <h3 className="text-sm font-bold text-stone-900">
                                    2. Šildymo sąlygos
                                </h3>

                                <div>
                                    <span className={labelCls}>Lietuvos klimato zona</span>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                                        {(
                                            [
                                                { id: 'pajuris', label: 'Pajūris (-19 °C)' },
                                                { id: 'vidurio', label: 'Vidurio LT (-21 °C)' },
                                                { id: 'rytu', label: 'Rytų LT (-23 °C)' },
                                            ] as { id: LtClimateZoneId; label: string }[]
                                        ).map((z) => (
                                            <button
                                                key={z.id}
                                                type="button"
                                                onClick={() => setClimateZone(z.id)}
                                                className={`${pillBtn(climateZone === z.id)} text-center`}
                                            >
                                                {z.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <span className={labelCls}>Kambario temperatūra</span>
                                    <div className="grid grid-cols-5 gap-1.5">
                                        {[19, 20, 21, 22, 23].map((tVal) => (
                                            <button
                                                key={tVal}
                                                type="button"
                                                onClick={() => setIndoorTempC(tVal)}
                                                className={`${pillBtn(indoorTempC === tVal)} text-center`}
                                            >
                                                {tVal} °C
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <span className={labelCls}>Vėdinimo tipas</span>
                                    <div className="grid grid-cols-1 gap-1.5">
                                        {(
                                            [
                                                { id: 'rekuperacija_85', title: 'Rekuperatorius su šilumos grąža (virš 80 %)' },
                                                { id: 'rekuperacija_70', title: 'Standartinė rekuperacija (apie 70 %)' },
                                                { id: 'naturali', title: 'Natūralus vėdinimas (be rekuperatoriaus)' },
                                            ] as { id: VentilationTypeId; title: string }[]
                                        ).map((v) => (
                                            <button
                                                key={v.id}
                                                type="button"
                                                onClick={() => setVentilationType(v.id)}
                                                className={pillBtn(ventilationType === v.id)}
                                            >
                                                {v.title}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Step 3 */}
                            <div className={stepCardCls}>
                                <h3 className="text-sm font-bold text-stone-900">
                                    3. Karšto vandens poreikis
                                </h3>

                                <div>
                                    <span className={labelCls}>Karšto vandens ruošimas</span>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                                        {(
                                            [
                                                { id: 'boileris', label: 'Su boileriu' },
                                                { id: 'momentinis', label: 'Momentinis katilas' },
                                                { id: 'be_kv', label: 'Tik šildymas' },
                                            ] as { id: DhwModeId; label: string }[]
                                        ).map((m) => (
                                            <button
                                                key={m.id}
                                                type="button"
                                                onClick={() => setDhwMode(m.id)}
                                                className={`${pillBtn(dhwMode === m.id)} text-center`}
                                            >
                                                {m.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <span className={labelCls}>Gyventojų skaičius</span>
                                    <div className="grid grid-cols-4 gap-1.5">
                                        {[
                                            { val: 2, label: '1–2 asm.' },
                                            { val: 4, label: '3–4 asm.' },
                                            { val: 6, label: '5–6 asm.' },
                                            { val: 8, label: '7–8 asm.' },
                                        ].map((occ) => (
                                            <button
                                                key={occ.val}
                                                type="button"
                                                onClick={() => setOccupants(occ.val)}
                                                className={`${pillBtn(occupants === occ.val)} text-center`}
                                            >
                                                {occ.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB 2 INPUTS: EXPANSION VESSEL */}
                    {activeTab === 'vessel' && (
                        <div className="space-y-4">
                            <div className={stepCardCls}>
                                <h3 className="text-sm font-bold text-stone-900">
                                    1. Šildymo sistemos galia ir prietaisai
                                </h3>
                                <div>
                                    <div className="flex justify-between items-baseline mb-1.5">
                                        <label htmlFor="vessel-kw" className="text-xs font-semibold text-stone-800">
                                            Katilo arba šilumos siurblio galia
                                        </label>
                                        <span className="text-base font-bold text-[var(--primary)] tabular-nums">
                                            {vesselPowerKw} kW
                                        </span>
                                    </div>
                                    <input
                                        id="vessel-kw"
                                        type="range"
                                        min={5}
                                        max={120}
                                        step={1}
                                        value={vesselPowerKw}
                                        onChange={(e) => setVesselPowerKw(Number(e.target.value))}
                                        className="w-full accent-[var(--primary)]"
                                    />
                                </div>

                                <div>
                                    <span className={labelCls}>Šildymo prietaisų tipas</span>
                                    <div className="grid grid-cols-1 gap-1.5">
                                        {(
                                            [
                                                { id: 'underfloor', label: 'Grindinis šildymas (~13,5 l/kW)' },
                                                { id: 'panel_radiators', label: 'Plieniniai plokštiniai radiatoriai (~10,5 l/kW)' },
                                                { id: 'cast_iron_buffer', label: 'Ketiniai radiatoriai arba akumuliacinė talpa (~18 l/kW)' },
                                            ] as { id: EmitterTypeId; label: string }[]
                                        ).map((em) => (
                                            <button
                                                key={em.id}
                                                type="button"
                                                onClick={() => setEmitterType(em.id)}
                                                className={pillBtn(emitterType === em.id)}
                                            >
                                                {em.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className={stepCardCls}>
                                <h3 className="text-sm font-bold text-stone-900">
                                    2. Temperatūra ir šilumnešis
                                </h3>
                                <div>
                                    <span className={labelCls}>Maksimali vandens temperatūra</span>
                                    <div className="grid grid-cols-5 gap-1.5">
                                        {(['45', '60', '70', '80', '90'] as MaxFlowTempC[]).map((tVal) => (
                                            <button
                                                key={tVal}
                                                type="button"
                                                onClick={() => setMaxFlowTempC(tVal)}
                                                className={`${pillBtn(maxFlowTempC === tVal)} text-center`}
                                            >
                                                {tVal} °C
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <span className={labelCls}>Glikolio (neužšąlančio skysčio) kiekis</span>
                                    <div className="grid grid-cols-4 gap-1.5">
                                        {([0, 20, 30, 40] as GlycolPercent[]).map((gl) => (
                                            <button
                                                key={gl}
                                                type="button"
                                                onClick={() => setGlycolPercent(gl)}
                                                className={`${pillBtn(glycolPercent === gl)} text-center`}
                                            >
                                                {gl === 0 ? 'Tik vanduo' : `${gl} %`}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className={stepCardCls}>
                                <h3 className="text-sm font-bold text-stone-900">
                                    3. Pastato aukštis ir apsauginis vožtuvas
                                </h3>
                                <div>
                                    <span className={labelCls}>Pastato aukštis (nuo katilo iki viršutinio taško)</span>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                                        {[
                                            { val: 4, label: '4 m (1 a.)' },
                                            { val: 7, label: '7 m (2 a.)' },
                                            { val: 10, label: '10 m (3 a.)' },
                                            { val: 15, label: '15 m' },
                                        ].map((h) => (
                                            <button
                                                key={h.val}
                                                type="button"
                                                onClick={() => setStaticHeightM(h.val)}
                                                className={`${pillBtn(staticHeightM === h.val)} text-center`}
                                            >
                                                {h.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <span className={labelCls}>Apsauginio vožtuvo slėgis</span>
                                    <div className="grid grid-cols-3 gap-1.5">
                                        {([3.0, 4.0, 6.0] as SafetyValveBar[]).map((sv) => (
                                            <button
                                                key={sv}
                                                type="button"
                                                onClick={() => setSafetyValveBar(sv)}
                                                className={`${pillBtn(safetyValveBar === sv)} text-center`}
                                            >
                                                {sv.toFixed(1).replace('.', ',')} bar
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB 3 INPUTS: HYDRAULIC BALANCING VALVE Kv & DN */}
                    {activeTab === 'valve' && (
                        <div className="space-y-4">
                            <div className={stepCardCls}>
                                <h3 className="text-sm font-bold text-stone-900">
                                    1. Šakos arba stovo šiluminė galia
                                </h3>
                                <div>
                                    <div className="flex justify-between items-baseline mb-1.5">
                                        <label htmlFor="valve-kw" className="text-xs font-semibold text-stone-800">
                                            Kontūro galia
                                        </label>
                                        <span className="text-base font-bold text-[var(--primary)] tabular-nums">
                                            {branchPowerKw} kW
                                        </span>
                                    </div>
                                    <input
                                        id="valve-kw"
                                        type="range"
                                        min={1}
                                        max={100}
                                        step={1}
                                        value={branchPowerKw}
                                        onChange={(e) => setBranchPowerKw(Number(e.target.value))}
                                        className="w-full accent-[var(--primary)]"
                                    />
                                </div>
                            </div>

                            <div className={stepCardCls}>
                                <h3 className="text-sm font-bold text-stone-900">
                                    2. Temperatūrų skirtumas (tiekimas ir grįžimas)
                                </h3>
                                <div className="grid grid-cols-2 gap-2">
                                    {(
                                        [
                                            { val: 5, title: '5 °C skirtumas', desc: 'Grindinio šildymo kolektoriai' },
                                            { val: 10, title: '10 °C skirtumas', desc: 'Šilumos siurblio kontūrai' },
                                            { val: 15, title: '15 °C skirtumas', desc: 'Standartiniai radiatoriai' },
                                            { val: 20, title: '20 °C skirtumas', desc: 'Katilinės magistralės' },
                                        ] as { val: 5 | 10 | 15 | 20; title: string; desc: string }[]
                                    ).map((dt) => (
                                        <button
                                            key={dt.val}
                                            type="button"
                                            onClick={() => setDeltaTK(dt.val)}
                                            className={cardBtn(deltaTK === dt.val)}
                                        >
                                            <div className="text-xs font-bold text-stone-900">{dt.title}</div>
                                            <div className="text-[11px] text-stone-600 mt-0.5">{dt.desc}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className={stepCardCls}>
                                <h3 className="text-sm font-bold text-stone-900">
                                    3. Slėgio nuostolis ant balansinio vožtuvo
                                </h3>
                                <div>
                                    <div className="flex justify-between items-baseline mb-1.5">
                                        <label htmlFor="valve-dp" className="text-xs font-semibold text-stone-800">
                                            Projektinis nuostolis
                                        </label>
                                        <span className="text-sm font-bold text-[var(--primary)] tabular-nums">
                                            {targetDpKpa} kPa
                                        </span>
                                    </div>
                                    <input
                                        id="valve-dp"
                                        type="range"
                                        min={3}
                                        max={30}
                                        step={1}
                                        value={targetDpKpa}
                                        onChange={(e) => setTargetDpKpa(Number(e.target.value))}
                                        className="w-full accent-[var(--primary)]"
                                    />
                                    <p className="mt-1.5 text-[11px] text-stone-600">
                                        Rekomenduojama 5–15 kPa tiksliam matavimui be triukšmo.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB 4 INPUTS: UNDERFLOOR MANIFOLD */}
                    {activeTab === 'manifold' && (
                        <div className="space-y-4">
                            <div className={stepCardCls}>
                                <h3 className="text-sm font-bold text-stone-900">
                                    1. Grindinio šildymo plotas
                                </h3>
                                <div>
                                    <div className="flex justify-between items-baseline mb-1.5">
                                        <label htmlFor="ufh-area" className="text-xs font-semibold text-stone-800">
                                            Šildomų grindų plotas
                                        </label>
                                        <span className="text-base font-bold text-[var(--primary)] tabular-nums">
                                            {floorAreaM2} m²
                                        </span>
                                    </div>
                                    <input
                                        id="ufh-area"
                                        type="range"
                                        min={15}
                                        max={240}
                                        step={5}
                                        value={floorAreaM2}
                                        onChange={(e) => setFloorAreaM2(Number(e.target.value))}
                                        className="w-full accent-[var(--primary)]"
                                    />
                                </div>
                            </div>

                            <div className={stepCardCls}>
                                <h3 className="text-sm font-bold text-stone-900">
                                    2. Vamzdžio klojimo žingsnis
                                </h3>
                                <div className="grid grid-cols-1 gap-1.5">
                                    {(
                                        [
                                            { val: 10, label: '10 cm – vonios ir vitrinų zonos (~10 m/m²)' },
                                            { val: 15, label: '15 cm – gyvenamosios patalpos (~6,7 m/m²)' },
                                            { val: 20, label: '20 cm – miegamieji ir pagalbinės patalpos (~5 m/m²)' },
                                        ] as { val: PipeSpacingCm; label: string }[]
                                    ).map((sp) => (
                                        <button
                                            key={sp.val}
                                            type="button"
                                            onClick={() => setPipeSpacingCm(sp.val)}
                                            className={pillBtn(pipeSpacingCm === sp.val)}
                                        >
                                            {sp.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className={stepCardCls}>
                                <h3 className="text-sm font-bold text-stone-900">
                                    3. Šilumos apkrova ir kontūro ilgis
                                </h3>
                                <div>
                                    <span className={labelCls}>Grindų šilumos galia</span>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                                        {[40, 50, 65, 80].map((wVal) => (
                                            <button
                                                key={wVal}
                                                type="button"
                                                onClick={() => setSpecificLoadWm2(wVal)}
                                                className={`${pillBtn(specificLoadWm2 === wVal)} text-center`}
                                            >
                                                {wVal} W/m²
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <span className={labelCls}>Maksimalus vieno kontūro ilgis</span>
                                    <div className="grid grid-cols-3 gap-1.5">
                                        {[70, 80, 90].map((lenVal) => (
                                            <button
                                                key={lenVal}
                                                type="button"
                                                onClick={() => setMaxLoopLengthM(lenVal)}
                                                className={`${pillBtn(maxLoopLengthM === lenVal)} text-center`}
                                            >
                                                {lenVal} m
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB 5 INPUTS: RADIATOR NODE WIZARD */}
                    {activeTab === 'radiator' && (
                        <div className="space-y-4">
                            <div className={stepCardCls}>
                                <h3 className="text-sm font-bold text-stone-900">
                                    1. Radiatorių skaičius
                                </h3>
                                <div>
                                    <div className="flex justify-between items-baseline mb-1.5">
                                        <label htmlFor="rad-count" className="text-xs font-semibold text-stone-800">
                                            Komplektuojami radiatoriai
                                        </label>
                                        <span className="text-base font-bold text-[var(--primary)] tabular-nums">
                                            {radiatorCount} vnt.
                                        </span>
                                    </div>
                                    <input
                                        id="rad-count"
                                        type="range"
                                        min={1}
                                        max={25}
                                        step={1}
                                        value={radiatorCount}
                                        onChange={(e) => setRadiatorCount(Number(e.target.value))}
                                        className="w-full accent-[var(--primary)]"
                                    />
                                </div>
                            </div>

                            <div className={stepCardCls}>
                                <h3 className="text-sm font-bold text-stone-900">
                                    2. Vamzdžių pajungimo būdas
                                </h3>
                                <div className="grid grid-cols-1 gap-1.5">
                                    {(
                                        [
                                            { id: 'bottom_vk_50mm', label: 'Apatinis 50 mm pajungimas (per H-bloką Multilux / RLV-K)' },
                                            { id: 'side_dn15_angle', label: 'Šoninis kampinis DN15 (1/2") pajungimas' },
                                            { id: 'side_dn15_straight', label: 'Šoninis tiesus DN15 (1/2") pajungimas' },
                                        ] as { id: RadiatorConnectionType; label: string }[]
                                    ).map((conn) => (
                                        <button
                                            key={conn.id}
                                            type="button"
                                            onClick={() => setConnectionType(conn.id)}
                                            className={pillBtn(connectionType === conn.id)}
                                        >
                                            {conn.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className={stepCardCls}>
                                <h3 className="text-sm font-bold text-stone-900">
                                    3. Balansavimas ir termostatinė galvutė
                                </h3>
                                <div>
                                    <span className={labelCls}>Srauto balansavimas</span>
                                    <div className="grid grid-cols-1 gap-1.5">
                                        {(
                                            [
                                                { id: 'afc_dynamic', label: 'Automatinis srauto ribojimas AFC (Heimeier Eclipse / RA-DV)' },
                                                { id: 'standard_kv', label: 'Standartinis Kv nustatymas (Danfoss RA-N / V-exact II)' },
                                            ] as { id: RadiatorControlType; label: string }[]
                                        ).map((ctrl) => (
                                            <button
                                                key={ctrl.id}
                                                type="button"
                                                onClick={() => setControlType(ctrl.id)}
                                                className={pillBtn(controlType === ctrl.id)}
                                            >
                                                {ctrl.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <span className={labelCls}>Galvutės valdymas</span>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                        {(
                                            [
                                                { id: 'liquid_click_or_m30', label: 'Mechaninė skystinė (K-galvutė / Redia)' },
                                                { id: 'electronic_smart', label: 'Programuojama elektroninė' },
                                            ] as { id: RadiatorHeadType; label: string }[]
                                        ).map((hd) => (
                                            <button
                                                key={hd.id}
                                                type="button"
                                                onClick={() => setHeadType(hd.id)}
                                                className={pillBtn(headType === hd.id)}
                                            >
                                                {hd.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </section>

                {/* RIGHT COLUMN: Result Hero + Matching Physical Store Products + Visual Diagram + Comparison Table (7 cols) */}
                <section className="lg:col-span-7 space-y-4">
                    {/* 1. HERO RESULT CARD */}
                    <div className="rounded-md border-2 border-[var(--primary)] bg-white p-4 space-y-3 shadow-xs">
                        <div className="flex flex-wrap items-start justify-between gap-2 border-b border-stone-200 pb-2.5">
                            <div>
                                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 mb-0.5">
                                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                                    Apskaičiuota rekomendacija su atsarga
                                </span>
                                <h3 className="text-lg sm:text-xl font-bold text-stone-900 leading-snug">
                                    {activeTab === 'boiler' && (
                                        <>
                                            Jūsų namui rekomenduojama:{' '}
                                            <span className="text-[var(--primary)]">{boilerResult.recommendedBoilerKw.toFixed(1).replace('.', ',')} kW</span>{' '}
                                            šilumos šaltinis
                                            {boilerResult.recommendedCylinderLiters > 0
                                                ? <> ir <span className="text-[var(--secondary)]">{boilerResult.recommendedCylinderLiters} l</span> boileris</>
                                                : ' (momentinis ruošimas)'}
                                        </>
                                    )}
                                    {activeTab === 'vessel' && (
                                        <>
                                            Jūsų sistemai rekomenduojama:{' '}
                                            <span className="text-[var(--primary)]">{vesselResult.standardVesselLiters} l</span> plėtimosi indas (oro slėgis{' '}
                                            <span className="text-[var(--secondary)]">{vesselResult.prechargeBar.toFixed(1).replace('.', ',')} bar</span>)
                                        </>
                                    )}
                                    {activeTab === 'valve' && (
                                        <>
                                            Tyliam darbui rekomenduojama:{' '}
                                            <span className="text-[var(--primary)]">{valveResult.recommendedDn}</span> balansinis vožtuvas (Kv{' '}
                                            <span className="text-[var(--secondary)]">{valveResult.requiredKv.toFixed(2).replace('.', ',')} m³/h</span>)
                                        </>
                                    )}
                                    {activeTab === 'manifold' && (
                                        <>
                                            Jūsų grindims rekomenduojama:{' '}
                                            <span className="text-[var(--primary)]">{manifoldResult.recommendedLoops} kontūrų</span> kolektorius ir{' '}
                                            <span className="text-[var(--secondary)]">{manifoldResult.totalPipeLengthM} m</span> vamzdžio
                                        </>
                                    )}
                                    {activeTab === 'radiator' && (
                                        <>
                                            Komplektas {radiatorCount} radiatoriams:{' '}
                                            <span className="text-[var(--primary)]">{radiatorResult.headsCount} galvutės</span> +{' '}
                                            <span className="text-[var(--secondary)]">{radiatorResult.valvesCount} vožtuvai</span>
                                        </>
                                    )}
                                </h3>
                            </div>
                        </div>

                        {/* Metric Grid for Tab 1: Boiler */}
                        {activeTab === 'boiler' && (
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                                <div className="rounded-sm border border-stone-200 bg-[var(--surface-paper)] p-3">
                                    <p className="text-xs text-stone-600">Rekomenduojamas katilas</p>
                                    <p className="text-xl font-bold text-[var(--primary)] mt-0.5 tabular-nums">
                                        {boilerResult.recommendedBoilerKw.toFixed(1)} kW
                                    </p>
                                    <p className="text-[11px] text-stone-500">su 15 % atsarga</p>
                                </div>
                                <div className="rounded-sm border border-stone-200 bg-[var(--surface-paper)] p-3">
                                    <p className="text-xs text-stone-600">Namo šilumos poreikis</p>
                                    <p className="text-xl font-bold text-stone-900 mt-0.5 tabular-nums">
                                        {boilerResult.designHeatLossKw.toFixed(2)} kW
                                    </p>
                                    <p className="text-[11px] text-stone-500">
                                        Sienos {boilerResult.transmissionLossKw} + vėdinimas {boilerResult.ventilationLossKw}
                                    </p>
                                </div>
                                <div className="rounded-sm border border-stone-200 bg-[var(--surface-paper)] p-3">
                                    <p className="text-xs text-stone-600">Rekomenduojamas boileris</p>
                                    <p className="text-xl font-bold text-[var(--secondary)] mt-0.5 tabular-nums">
                                        {boilerResult.recommendedCylinderLiters > 0
                                            ? `${boilerResult.recommendedCylinderLiters} l`
                                            : 'Momentinis'}
                                    </p>
                                    <p className="text-[11px] text-stone-500">{occupants} asm. šeimai</p>
                                </div>
                                <div className="rounded-sm border border-stone-200 bg-[var(--surface-paper)] p-3">
                                    <p className="text-xs text-stone-600">Metinis poreikis</p>
                                    <p className="text-xl font-bold text-stone-900 mt-0.5 tabular-nums">
                                        {boilerResult.annualEnergyMwh.toFixed(1)} MWh
                                    </p>
                                    <p className="text-[11px] text-stone-500">Lauke iki {boilerResult.outdoorDesignTempC} °C</p>
                                </div>
                            </div>
                        )}

                        {/* Metric Grid for Tab 2: Expansion Vessel */}
                        {activeTab === 'vessel' && (
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                                <div className="rounded-sm border border-stone-200 bg-[var(--surface-paper)] p-3">
                                    <p className="text-xs text-stone-600">Rekomenduojamas indas</p>
                                    <p className="text-xl font-bold text-[var(--primary)] mt-0.5 tabular-nums">
                                        {vesselResult.standardVesselLiters} l
                                    </p>
                                    <p className="text-[11px] text-stone-500">min. {vesselResult.minVesselVolumeL.toFixed(1)} l</p>
                                </div>
                                <div className="rounded-sm border border-stone-200 bg-[var(--surface-paper)] p-3">
                                    <p className="text-xs text-stone-600">Oro pagalvės slėgis</p>
                                    <p className="text-xl font-bold text-[var(--secondary)] mt-0.5 tabular-nums">
                                        {vesselResult.prechargeBar.toFixed(1)} bar
                                    </p>
                                    <p className="text-[11px] text-stone-500">Darbinis iki {vesselResult.maxWorkingBar.toFixed(1)} bar</p>
                                </div>
                                <div className="rounded-sm border border-stone-200 bg-[var(--surface-paper)] p-3">
                                    <p className="text-xs text-stone-600">Vandens kiekis</p>
                                    <p className="text-xl font-bold text-stone-900 mt-0.5 tabular-nums">
                                        {vesselResult.systemVolumeL.toFixed(0)} l
                                    </p>
                                    <p className="text-[11px] text-stone-500">Sistemos tūris</p>
                                </div>
                                <div className="rounded-sm border border-stone-200 bg-[var(--surface-paper)] p-3">
                                    <p className="text-xs text-stone-600">Vandens išsiplėtimas</p>
                                    <p className="text-xl font-bold text-stone-900 mt-0.5 tabular-nums">
                                        {(vesselResult.expansionVolumeL + vesselResult.waterReserveL).toFixed(1)} l
                                    </p>
                                    <p className="text-[11px] text-stone-500">Su atsarga</p>
                                </div>
                            </div>
                        )}

                        {/* Metric Grid for Tab 3: Valve */}
                        {activeTab === 'valve' && (
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                                <div className="rounded-sm border border-stone-200 bg-[var(--surface-paper)] p-3">
                                    <p className="text-xs text-stone-600">Rekomenduojamas DN</p>
                                    <p className="text-xl font-bold text-[var(--primary)] mt-0.5">{valveResult.recommendedDn}</p>
                                    <p className="text-[11px] text-stone-500">{valveResult.recommendedThreadLabel}</p>
                                </div>
                                <div className="rounded-sm border border-stone-200 bg-[var(--surface-paper)] p-3">
                                    <p className="text-xs text-stone-600">Pralaidumas Kv</p>
                                    <p className="text-xl font-bold text-[var(--secondary)] mt-0.5 tabular-nums">
                                        {valveResult.requiredKv.toFixed(2)} m³/h
                                    </p>
                                    <p className="text-[11px] text-stone-500">prie {targetDpKpa} kPa</p>
                                </div>
                                <div className="rounded-sm border border-stone-200 bg-[var(--surface-paper)] p-3">
                                    <p className="text-xs text-stone-600">Vandens srautas</p>
                                    <p className="text-xl font-bold text-stone-900 mt-0.5 tabular-nums">
                                        {valveResult.flowLh.toFixed(0)} l/h
                                    </p>
                                    <p className="text-[11px] text-stone-500">{valveResult.flowLmin.toFixed(1)} l/min</p>
                                </div>
                                <div className="rounded-sm border border-stone-200 bg-[var(--surface-paper)] p-3">
                                    <p className="text-xs text-stone-600">Greitis vamzdyje</p>
                                    <p className="text-xl font-bold text-emerald-700 mt-0.5 tabular-nums">
                                        {valveResult.waterVelocityMs.toFixed(2)} m/s
                                    </p>
                                    <p className="text-[11px] text-stone-500">Norma iki 0,75 m/s</p>
                                </div>
                            </div>
                        )}

                        {/* Metric Grid for Tab 4: Manifold */}
                        {activeTab === 'manifold' && (
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                                <div className="rounded-sm border border-stone-200 bg-[var(--surface-paper)] p-3">
                                    <p className="text-xs text-stone-600">Kolektoriaus kontūrai</p>
                                    <p className="text-xl font-bold text-[var(--primary)] mt-0.5 tabular-nums">
                                        {manifoldResult.recommendedLoops} kont.
                                    </p>
                                    <p className="text-[11px] text-stone-500">
                                        {manifoldResult.manifoldsNeeded > 1 ? `${manifoldResult.manifoldsNeeded} kolektoriai` : '1 kolektorius'}
                                    </p>
                                </div>
                                <div className="rounded-sm border border-stone-200 bg-[var(--surface-paper)] p-3">
                                    <p className="text-xs text-stone-600">Vamzdžio ilgis</p>
                                    <p className="text-xl font-bold text-[var(--secondary)] mt-0.5 tabular-nums">
                                        {manifoldResult.totalPipeLengthM} m
                                    </p>
                                    <p className="text-[11px] text-stone-500">su 7 % atsarga</p>
                                </div>
                                <div className="rounded-sm border border-stone-200 bg-[var(--surface-paper)] p-3">
                                    <p className="text-xs text-stone-600">Rotametro srautas</p>
                                    <p className="text-xl font-bold text-stone-900 mt-0.5 tabular-nums">
                                        {manifoldResult.flowPerLoopLmin.toFixed(2)} l/min
                                    </p>
                                    <p className="text-[11px] text-stone-500">Iš viso {manifoldResult.totalFlowLmin.toFixed(1)} l/min</p>
                                </div>
                                <div className="rounded-sm border border-stone-200 bg-[var(--surface-paper)] p-3">
                                    <p className="text-xs text-stone-600">Pavaros ir jungtys</p>
                                    <p className="text-xl font-bold text-stone-900 mt-0.5 tabular-nums">
                                        {manifoldResult.actuatorsCount} + {manifoldResult.euroconusCount}
                                    </p>
                                    <p className="text-[11px] text-stone-500">Galia {manifoldResult.totalThermalPowerKw} kW</p>
                                </div>
                            </div>
                        )}

                        {/* Metric Grid for Tab 5: Radiator */}
                        {activeTab === 'radiator' && (
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                                <div className="rounded-sm border border-stone-200 bg-[var(--surface-paper)] p-3">
                                    <p className="text-xs text-stone-600">Galvutės ir vožtuvai</p>
                                    <p className="text-xl font-bold text-[var(--primary)] mt-0.5 tabular-nums">
                                        {radiatorResult.headsCount} + {radiatorResult.valvesCount}
                                    </p>
                                    <p className="text-[11px] text-stone-500">
                                        {controlType === 'afc_dynamic' ? 'AFC Eclipse serija' : 'Standartinė Kv serija'}
                                    </p>
                                </div>
                                <div className="rounded-sm border border-stone-200 bg-[var(--surface-paper)] p-3">
                                    <p className="text-xs text-stone-600">
                                        {radiatorResult.hBlocksCount > 0 ? 'H-blokai 50 mm' : 'Grįžtami vožtuvai'}
                                    </p>
                                    <p className="text-xl font-bold text-[var(--secondary)] mt-0.5 tabular-nums">
                                        {radiatorResult.hBlocksCount > 0
                                            ? `${radiatorResult.hBlocksCount} vnt.`
                                            : `${radiatorResult.returnDetentorsCount} vnt.`}
                                    </p>
                                    <p className="text-[11px] text-stone-500">
                                        {radiatorResult.hBlocksCount > 0 ? 'Multilux / RLV-K' : 'Regulux / RLV-S'}
                                    </p>
                                </div>
                                <div className="rounded-sm border border-stone-200 bg-[var(--surface-paper)] p-3">
                                    <p className="text-xs text-stone-600">Eurokonuso jungtys</p>
                                    <p className="text-xl font-bold text-stone-900 mt-0.5 tabular-nums">
                                        {radiatorResult.euroconusCount} vnt.
                                    </p>
                                    <p className="text-[11px] text-stone-500">Po 2 vnt. radiatoriui</p>
                                </div>
                                <div className="rounded-sm border border-stone-200 bg-[var(--surface-paper)] p-3">
                                    <p className="text-xs text-stone-600">Bendras srautas</p>
                                    <p className="text-xl font-bold text-stone-900 mt-0.5 tabular-nums">
                                        {radiatorResult.totalSystemFlowLh.toFixed(0)} l/h
                                    </p>
                                    <p className="text-[11px] text-stone-500">Po ~69 l/h radiatoriui</p>
                                </div>
                            </div>
                        )}

                        {/* Human-Friendly "Ką tai reiškia paprastai?" Summary Card */}
                        <div className="rounded-sm border border-stone-200 bg-stone-50 p-3.5">
                            <p className="text-xs font-bold text-stone-800 mb-1">
                                Ką tai reiškia paprastai?
                            </p>
                            <p className="text-xs sm:text-sm text-stone-700 leading-relaxed">
                                {activeTab === 'boiler' &&
                                    `Jūsų ${areaM2} m² (${energyClass} klasės) būstui net ir šalčiausią žiemą (${boilerResult.outdoorDesignTempC} °C) užteks ${boilerResult.recommendedBoilerKw.toFixed(1)} kW šilumos šaltinio${boilerResult.recommendedCylinderLiters > 0 ? ` ir ${boilerResult.recommendedCylinderLiters} l greitaeigio boilerio (${occupants} asm. šeimai)` : ''}.`}
                                {activeTab === 'vessel' &&
                                    `Šildant vandenį iki ${maxFlowTempC} °C, jūsų sistemoje (~${vesselResult.systemVolumeL.toFixed(0)} l) vanduo išsiplės apie ${(vesselResult.expansionVolumeL + vesselResult.waterReserveL).toFixed(1)} l. Kad apsauginis vožtuvas nespjaudytų vandens, rinkitės ${vesselResult.standardVesselLiters} l IMI Pneumatex Statico indą su ${vesselResult.prechargeBar.toFixed(1)} bar oro slėgiu.`}
                                {activeTab === 'valve' &&
                                    `Norint perduoti ${branchPowerKw} kW šilumos be vamzdžių ūžimo, rinkitės ${valveResult.recommendedDn} (${valveResult.recommendedThreadLabel}) skersmens IMI TA STAD balansinį vožtuvą – vanduo tekės tyliai (${valveResult.waterVelocityMs.toFixed(2)} m/s).`}
                                {activeTab === 'manifold' &&
                                    `${floorAreaM2} m² grindims (vamzdžio žingsnis ${pipeSpacingCm} cm) reikės ${manifoldResult.recommendedLoops} kontūrų kolektoriaus, ~${manifoldResult.totalPipeLengthM} m PE-Xa vamzdžio, ${manifoldResult.actuatorsCount} terminių pavarų ir ${manifoldResult.euroconusCount} Eurokonuso jungčių.`}
                                {activeTab === 'radiator' &&
                                    `${radiatorCount} radiatoriams sukomplektuoti reikės ${radiatorResult.headsCount} termostatinių galvučių, ${radiatorResult.valvesCount} vožtuvų${radiatorResult.hBlocksCount > 0 ? `, ${radiatorResult.hBlocksCount} apatinių 50 mm H-blokų` : ` ir ${radiatorResult.returnDetentorsCount} grįžtamųjų vožtuvų`} bei ${radiatorResult.euroconusCount} Eurokonuso jungčių.`}
                            </p>
                        </div>
                    </div>

                    {/* 2. LIVE MATCHED CATALOG PRODUCTS GRID (Immediately below Hero Result) */}
                    {(features.calculatorsPhysicalBinding || true) && (
                        <div id="calculator-live-catalog-grid" className="rounded-md border border-stone-300 bg-white p-4 space-y-3.5 shadow-2xs">
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-200 pb-2.5">
                                <div>
                                    <h3 className="text-base sm:text-lg font-bold text-stone-900">
                                        Jūsų skaičiavimui tinkančios prekės ir mazgai
                                    </h3>
                                    <p className="text-xs text-stone-600">
                                        Tiesioginis parinkimas iš Gilės Inžinerija katalogo pagal apskaičiuotus parametrus
                                    </p>
                                </div>
                                {loadingRecs && (
                                    <span className="text-xs text-stone-500">
                                        Atnaujinamas parinkimas...
                                    </span>
                                )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {(recommendations.length > 0 ? recommendations : FALLBACK_RECOMMENDATIONS).map((item) => (
                                    <article
                                        key={`${activeTab}-${item.id}`}
                                        className="rounded-md border border-stone-300 bg-white p-3.5 flex flex-col justify-between hover:border-stone-900 transition-colors duration-150"
                                    >
                                        <div>
                                            <div className="flex items-center justify-between gap-2 mb-2.5">
                                                <span className="text-[11px] px-2 py-0.5 rounded-xs bg-stone-100 text-stone-800 border border-stone-200 font-semibold">
                                                    {cleanDash(item.roleLabel)}
                                                </span>
                                                <span className="text-xs font-bold text-[var(--primary)] whitespace-nowrap">
                                                    Kiekis: {item.recommendedQty} vnt.
                                                </span>
                                            </div>

                                            <div className="flex gap-3 items-center mb-2.5">
                                                <Link
                                                    href={`/products/${item.id}`}
                                                    className="w-20 h-20 shrink-0 rounded-sm border border-stone-200 bg-white p-1.5 flex items-center justify-center overflow-hidden"
                                                >
                                                    <img
                                                        src={assetUrl(item.imageUrl)}
                                                        alt={cleanDash(item.title)}
                                                        className="max-w-full max-h-full object-contain"
                                                    />
                                                </Link>
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <img
                                                            src={assetUrl(item.brandLogoUrl)}
                                                            alt={item.brand}
                                                            className="h-4 w-auto object-contain"
                                                        />
                                                        <span className="font-mono text-[11px] text-stone-700">
                                                            SKU: {item.sku}
                                                        </span>
                                                    </div>
                                                    <Link
                                                        href={`/products/${item.id}`}
                                                        className="text-sm font-bold text-stone-900 hover:text-[var(--primary)] line-clamp-2 leading-snug"
                                                    >
                                                        {cleanDash(item.title)}
                                                    </Link>
                                                </div>
                                            </div>

                                            <p className="text-xs text-stone-600 leading-relaxed mb-3">
                                                {cleanDash(item.matchReason)}
                                            </p>
                                        </div>

                                        <div className="pt-2.5 border-t border-stone-200 flex items-center justify-between gap-2">
                                            <span className="text-base font-bold text-stone-900 tabular-nums">
                                                {item.priceEur.toFixed(2).replace('.', ',')} €
                                            </span>
                                            <Link
                                                href={`/products/${item.id}`}
                                                className="inline-flex items-center gap-1 rounded-sm bg-[var(--primary)] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[var(--brand-accent-hover)] transition-colors"
                                            >
                                                <span>Atidaryti prekę</span>
                                            </Link>
                                        </div>
                                    </article>
                                ))}
                            </div>

                            <div className="pt-3 border-t border-stone-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                                <Link
                                    href={`/uzklausa?kodas=${encodeURIComponent(rfqSpecString)}`}
                                    className="inline-flex items-center justify-center gap-2 rounded-sm bg-[var(--secondary)] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[var(--brand-secondary-hover)] transition-colors"
                                >
                                    <FileText className="w-4 h-4 shrink-0" aria-hidden="true" />
                                    <span>Perduoti šį skaičiavimą į sąmatos užklausą (RFQ)</span>
                                </Link>
                                <Link
                                    href={`/products?category=${encodeURIComponent(activeTabMeta.catalogCategoryHint)}`}
                                    className="inline-flex items-center justify-center rounded-sm border border-stone-300 bg-white px-4 py-2.5 text-xs font-semibold text-stone-900 hover:border-stone-900 transition-colors"
                                >
                                    <span>Visos kategorijos prekės</span>
                                </Link>
                            </div>
                        </div>
                    )}

                    {/* 3. INTERACTIVE VISUAL SVG DIAGRAM */}
                    {activeTab === 'boiler' && (
                        <BoilerHouseVisual
                            areaM2={areaM2}
                            energyClass={energyClass}
                            indoorTempC={indoorTempC}
                            occupants={occupants}
                            recommendedBoilerKw={boilerResult.recommendedBoilerKw}
                            recommendedCylinderLiters={boilerResult.recommendedCylinderLiters}
                        />
                    )}
                    {activeTab === 'vessel' && (
                        <ExpansionVesselVisual
                            systemVolumeL={vesselResult.systemVolumeL}
                            standardVesselLiters={vesselResult.standardVesselLiters}
                            prechargeBar={vesselResult.prechargeBar}
                            staticHeightM={staticHeightM}
                            maxFlowTempC={maxFlowTempC}
                        />
                    )}
                    {activeTab === 'manifold' && (
                        <UnderfloorManifoldVisual
                            floorAreaM2={floorAreaM2}
                            pipeSpacingCm={pipeSpacingCm}
                            recommendedLoops={manifoldResult.recommendedLoops}
                            flowPerLoopLmin={manifoldResult.flowPerLoopLmin}
                        />
                    )}
                    {activeTab === 'radiator' && (
                        <RadiatorNodeVisual
                            radiatorCount={radiatorCount}
                            connectionType={connectionType}
                            controlType={controlType}
                        />
                    )}
                    {activeTab === 'valve' && (
                        <HydraulicPipeVisual
                            recommendedDn={valveResult.recommendedDn}
                            waterVelocityMs={valveResult.waterVelocityMs}
                            flowLh={valveResult.flowLh}
                            requiredKv={valveResult.requiredKv}
                        />
                    )}

                    {/* 4. VISUAL COMPARISON TABLE */}
                    <div className="rounded-md border border-stone-300 bg-white overflow-hidden shadow-2xs">
                        <div className="bg-stone-100 text-stone-900 px-5 py-3.5 border-b border-stone-200">
                            <h3 className="text-base sm:text-lg font-bold text-stone-900">
                                {cleanDash(activeMarketing.comparisonTitle)}
                            </h3>
                            <p className="text-xs text-stone-600 mt-0.5">
                                {cleanDash(activeMarketing.comparisonSubtitle)}
                            </p>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse text-left text-xs sm:text-sm">
                                <thead>
                                    <tr className="border-b border-stone-200 bg-stone-50 text-xs text-stone-700">
                                        <th scope="col" className="px-4 py-3 font-semibold">Variantas</th>
                                        <th scope="col" className="px-4 py-3 font-semibold">Kada rinktis jūsų atveju?</th>
                                        <th scope="col" className="px-4 py-3 font-semibold">Praktinė nauda</th>
                                        <th scope="col" className="px-4 py-3 font-semibold">Rekomenduojamos prekės</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-stone-200">
                                    {activeMarketing.comparisonRows.map((row) => (
                                        <tr key={row.variant} className="hover:bg-stone-50/80 align-top">
                                            <th scope="row" className="px-4 py-3 font-bold text-stone-900">
                                                {cleanDash(row.variant)}
                                            </th>
                                            <td className="px-4 py-3 text-stone-700 leading-relaxed">
                                                {cleanDash(row.whenToChoose)}
                                            </td>
                                            <td className="px-4 py-3 text-stone-700 leading-relaxed">
                                                {cleanDash(row.keyAdvantage)}
                                            </td>
                                            <td className="px-4 py-3 space-y-2">
                                                <p className="text-xs font-semibold text-stone-900">
                                                    {cleanDash(row.recommendedModels)}
                                                </p>
                                                {features.calculatorsPhysicalBinding && Array.isArray(row.recommendedProducts) && row.recommendedProducts.length > 0 && (
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {row.recommendedProducts.map((prod) => (
                                                            <Link
                                                                key={`${row.variant}-${prod.sku}`}
                                                                href={prod.href || `/products?q=${encodeURIComponent(prod.searchQuery || prod.sku)}`}
                                                                className="inline-flex items-center gap-1 rounded-xs border border-stone-300 bg-stone-50 hover:border-stone-900 px-2 py-1 text-xs font-semibold text-stone-800 transition-colors"
                                                            >
                                                                <span>{cleanDash(prod.label || prod.name)}</span>
                                                                <span className="font-mono text-[11px] text-stone-500">({prod.sku})</span>
                                                            </Link>
                                                        ))}
                                                    </div>
                                                )}
                                                {features.calculatorsPhysicalBinding && features.vytautasWidget && (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            recordSelectedVariant({
                                                                source: 'calculator',
                                                                title: row.variant,
                                                                summary: `${row.whenToChoose} – ${row.recommendedModels}`,
                                                                recommendedSkus: row.recommendedProducts?.map((p) => p.sku) ?? [],
                                                            });
                                                            openVytautasWithContext({
                                                                prompt: row.vytautasPrompt || `Domina variantas: ${row.variant} (${row.recommendedModels}). Padėk sukomplektuoti prekes pagal mano skaičiavimą.`,
                                                                title: row.variant,
                                                                summary: row.recommendedModels,
                                                                recommendedSkus: row.recommendedProducts?.map((p) => p.sku) ?? [],
                                                                autoSend: true,
                                                            });
                                                            const el = document.getElementById('calculator-live-catalog-grid');
                                                            if (el && typeof el.scrollIntoView === 'function') {
                                                                el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                                            }
                                                        }}
                                                        className="inline-flex items-center gap-1.5 rounded-xs bg-stone-900 hover:bg-[var(--primary)] px-2.5 py-1.5 text-xs font-semibold text-white transition-colors cursor-pointer"
                                                    >
                                                        <span>{`Pasirinkti šį variantą su konsultantu ${instrumentalAgentName}`}</span>
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* 5. PRACTICAL GUIDANCE SUMMARY (3 scannable columns) */}
                    <section
                        aria-label="Kodėl verta naudoti šią skaičiuoklę ir kaip išvengti klaidų"
                        className="rounded-md border border-stone-300 bg-white overflow-hidden shadow-2xs"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-stone-200">
                            <div className="p-4 bg-stone-50/70">
                                <p className="text-xs font-bold text-[var(--primary)] mb-1.5">
                                    Dažniausia klaida perkant iš akies
                                </p>
                                <p className="text-xs text-stone-700 leading-relaxed">
                                    {cleanDash(activeMarketing.commonMistake)}
                                </p>
                            </div>
                            <div className="p-4">
                                <p className="text-xs font-bold text-stone-900 mb-1.5">
                                    Kam skirta ši skaičiuoklė ir ką sužinosite?
                                </p>
                                <p className="text-xs text-stone-700 leading-relaxed">
                                    {cleanDash(activeMarketing.whoAndWhat)}
                                </p>
                            </div>
                            <div className="p-4 bg-stone-50/70">
                                <p className="text-xs font-bold text-stone-900 mb-1.5">
                                    Kaip gauti rezultatą per 30 sekundžių?
                                </p>
                                <ul className="space-y-1 text-xs text-stone-700 leading-snug">
                                    {activeMarketing.threeSteps.map((stepText) => (
                                        <li key={stepText}>
                                            {cleanDash(stepText)}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </section>
                </section>
            </div>

            <ApvaSubsidyWidget />
        </div>
    );
}

export type GilesCadTabId =
    | 'boiler'
    | 'buffer'
    | 'vessel'
    | 'valve'
    | 'manifold'
    | 'pump';

interface CadBomItem {
    id: string;
    sku: string;
    title: Record<AppLocale, string>;
    brand: string;
    role: Record<AppLocale, string>;
    qty: number;
    unitGrossEur: number;
    stockQuantity: number;
    stockSource: string;
    imageUrl: string;
}

const CAD_WORKBENCH_TABS: Array<{
    id: GilesCadTabId;
    label: Record<AppLocale, string>;
    shortSpec: Record<AppLocale, string>;
    formulaText: string;
    previewImg: string;
    previewSku: string;
    previewStockQty: number;
}> = [
    {
        id: 'boiler',
        label: {
            lt: '01 / Katilinės ir ŠS galia (kW + sąmata)',
            en: '01 / Boiler & Heat Pump Power (kW + BOM)',
            pl: '01 / Moc kotłowni i pompy ciepła (kW + zestaw)',
            ru: '01 / Мощность котельной и ТН (кВт + смета)',
        },
        shortSpec: {
            lt: 'Q = A × q × ΔT · 8–150 kW',
            en: 'Q = A × q × ΔT · 8–150 kW',
            pl: 'Q = A × q × ΔT · 8–150 kW',
            ru: 'Q = A × q × ΔT · 8–150 кВт',
        },
        formulaText: 'Q = A × q × ΔT',
        previewImg: '/images/products/giles-studio-01-mpb-nani-35-50.webp',
        previewSku: 'MPB-NANI-35',
        previewStockQty: 6,
    },
    {
        id: 'buffer',
        label: {
            lt: '02 / Akumuliacinė talpa (Gorenje ZV / 50 L/kW)',
            en: '02 / Buffer Tank Volume (Gorenje ZV / 50 L/kW)',
            pl: '02 / Bufor ciepła (Gorenje ZV / 50 L/kW)',
            ru: '02 / Буферная емкость (Gorenje ZV / 50 л/кВт)',
        },
        shortSpec: {
            lt: 'V_buf = P_kW × 50 L/kW · EN 303-5',
            en: 'V_buf = P_kW × 50 L/kW · EN 303-5',
            pl: 'V_buf = P_kW × 50 L/kW · EN 303-5',
            ru: 'V_buf = P_kW × 50 л/кВт · EN 303-5',
        },
        formulaText: 'V_buf = P_kW × 50 L/kW',
        previewImg: '/images/products/giles-studio-27-centrometal-cas-1001-buffer.webp',
        previewSku: 'ZV 100',
        previewStockQty: 12,
    },
    {
        id: 'vessel',
        label: {
            lt: '03 / Plėtimosi indas (IMI Pneumatex Statico)',
            en: '03 / Expansion Vessel (IMI Pneumatex Statico)',
            pl: '03 / Naczynie wzbiorcze (IMI Pneumatex Statico)',
            ru: '03 / Расширительный бак (IMI Pneumatex Statico)',
        },
        shortSpec: {
            lt: 'V_n = V_s × e / (1 - P_0/P_max)',
            en: 'V_n = V_s × e / (1 - P_0/P_max)',
            pl: 'V_n = V_s × e / (1 - P_0/P_max)',
            ru: 'V_n = V_s × e / (1 - P_0/P_max)',
        },
        formulaText: 'V_n = V_s × e / (1 - P_0/P_max)',
        previewImg: '/images/products/7101003.webp',
        previewSku: '7101003',
        previewStockQty: 18,
    },
    {
        id: 'valve',
        label: {
            lt: '04 / Hidraulinis balansavimas (Danfoss / IMI Kvs)',
            en: '04 / Hydronic Balancing (Danfoss / IMI Kvs)',
            pl: '04 / Równoważenie hydrauliczne (Danfoss / IMI Kvs)',
            ru: '04 / Гидравлическая балансировка (Danfoss / IMI Kvs)',
        },
        shortSpec: {
            lt: 'K_v = G / √ΔP · DN15–DN50',
            en: 'K_v = G / √ΔP · DN15–DN50',
            pl: 'K_v = G / √ΔP · DN15–DN50',
            ru: 'K_v = G / √ΔP · DN15–DN50',
        },
        formulaText: 'K_v = G / √ΔP (Q = A × q × ΔT)',
        previewImg: '/images/products/52-151-014.webp',
        previewSku: '52-151-020',
        previewStockQty: 22,
    },
    {
        id: 'manifold',
        label: {
            lt: '05 / Grindinio šildymo kontūrai (Comisa PEX)',
            en: '05 / Underfloor Heating Loops (Comisa PEX)',
            pl: '05 / Ogrzewanie podłogowe (Comisa PEX)',
            ru: '05 / Контуры теплого пола (Comisa PEX)',
        },
        shortSpec: {
            lt: '2–12 kontūrų · Dynacon AFC',
            en: '2–12 loops · Dynacon AFC',
            pl: '2–12 obwodów · Dynacon AFC',
            ru: '2–12 контуров · Dynacon AFC',
        },
        formulaText: 'L_vamzd = A_grind × (100 / S_cm) × 1,10',
        previewImg: '/images/products/9330-08.800.webp',
        previewSku: '9330-08.800',
        previewStockQty: 9,
    },
    {
        id: 'pump',
        label: {
            lt: '06 / Cirkuliacinis siurblys (Wilo / Grundfos ΔT)',
            en: '06 / Circulation Pump (Wilo / Grundfos ΔT)',
            pl: '06 / Pompa obiegowa (Wilo / Grundfos ΔT)',
            ru: '06 / Циркуляционный насос (Wilo / Grundfos ΔT)',
        },
        shortSpec: {
            lt: 'G = Q × 860 / ΔT · H_m (m v. st.)',
            en: 'G = Q × 860 / ΔT · H_m (m WC)',
            pl: 'G = Q × 860 / ΔT · H_m (m sł. w.)',
            ru: 'G = Q × 860 / ΔT · H_m (м вод. ст.)',
        },
        formulaText: 'G = (Q_kW × 860) / ΔT_K',
        previewImg: '/images/products/giles-stratos-40-1-6-pn6-10-f4ef4954.webp',
        previewSku: '2217972',
        previewStockQty: 7,
    },
];

const WORKBENCH_COPY: Record<
    AppLocale,
    {
        eyebrow: string;
        h1: string;
        subtitle: string;
        vatGross: string;
        vatNet: string;
        vatGroupAria: string;
        wizardBtn: string;
        tabsAria: string;
        stockInKaunas: (qty: number) => string;
        paramsHeading: string;
        paramsSubtitle: string;
        areaLabel: string;
        energyClassLabel: string;
        heatSourceLabel: string;
        heatSources: {
            megatherm_pellet: string;
            giles_boiler: string;
            haier_r290: string;
            haier_electric: string;
        };
        sysVolumeLabel: string;
        opPressureLabel: string;
        deltaTLabel: string;
        deltaTOptions: {
            dt5: string;
            dt7: string;
            dt15: string;
            dt20: string;
        };
        safetyValvePipeLabel: string;
        safetyValveOptions: {
            p3_15: string;
            p3_10: string;
            p6_20: string;
        };
        supportTitle: string;
        supportDesc: string;
        protocolHeader: string;
        reqPowerLabel: string;
        bufferVesselLabel: string;
        flowKvsLabel: string;
        ufhPumpLabel: string;
        loopsShort: string;
        headUnit: string;
        schematicTitle: string;
        schematicAria: string;
        svgSourceTitle: string;
        svgAreaPrefix: string;
        svgBufferTitle: string;
        svgManifoldTitle: string;
        svgPumpPrefix: string;
        bomHeading: string;
        bomSubheading: string;
        addKitBtn: (formattedTotal: string) => string;
        kitAddedToast: string;
        openProductBtn: string;
        thRoleItem: string;
        thSkuStock: string;
        thQty: string;
        thTotal: (isNet: boolean) => string;
        qtyUnit: string;
        totalBomFooter: (grossStr: string, netValStr: string) => string;
        presetsLabel: string;
        ufhShareLabel: string;
        staticHeightLabel: string;
        leaderLengthLabel: string;
        bufferNotNeededShort: string;
        noUfhShort: string;
    }
> = {
    lt: {
        eyebrow: 'INŽINERINIS PROJEKTAVIMO DARBASTALIS · EN 12831 / STR 2.09.02',
        h1: 'Katilinių, granulių degiklių ir hidraulinių mazgų skaičiuoklės',
        subtitle:
            'Tikslus katilinių, granulių degiklių, šilumos siurblių ir hidraulinių mazgų parinkimas pagal EN 12831 standartą su tiesioginiu įrangos komplektavimu iš Kauno sandėlio.',
        vatGross: 'Su PVM',
        vatNet: 'Be PVM',
        vatGroupAria: 'Kainų rodymas',
        wizardBtn: 'Katilo perdarymo vedlys',
        tabsAria: 'Gilės Inžinerija skaičiuoklių mazgai',
        stockInKaunas: (qty: number) => `Sandėlyje Kaune: ${qty} vnt.`,
        paramsHeading: '01. Pastato ir hidraulinio mazgo parametrai',
        paramsSubtitle:
            'Nustatykite pastato plotą, energinę klasę, šilumos šaltinį ir sistemos slėgį.',
        areaLabel: 'Pastato plotas m²',
        energyClassLabel: 'Energinė klasė (A++ .. D pagal STR 2.09.02)',
        heatSourceLabel: 'Šilumos šaltinis ir katilinės mazgas',
        heatSources: {
            megatherm_pellet: 'Megatherm granulių degiklis MPB NANI 8–35 kW + sraigtas',
            giles_boiler: 'Gilės katilas KaTRI 25 kW (6 mm P265GH) + HERZ Teplomix',
            haier_r290: 'Haier R290 šilumos siurblys Super Aqua Monoblock (+75 °C)',
            haier_electric: 'Haier ES elektrinis katilas / boileris + IMI Pneumatex',
        },
        sysVolumeLabel: 'Sistemos tūris L (be talpos)',
        opPressureLabel: 'Statinis aukštis H (m)',
        deltaTLabel: 'Perkritis ΔT (K)',
        deltaTOptions: {
            dt5: 'ΔT = 5 K (Šilumos siurblys)',
            dt7: 'ΔT = 8 K (ŠS / grindinis)',
            dt15: 'ΔT = 15 K (Katilas / radiatoriai)',
            dt20: 'ΔT = 20 K (Aukštatemperatūris)',
        },
        safetyValvePipeLabel: 'Apsauginis P_sv / žingsnis',
        safetyValveOptions: {
            p3_15: '3,0 bar · žingsnis 15 cm',
            p3_10: '3,0 bar · žingsnis 10 cm',
            p6_20: '6,0 bar · žingsnis 20 cm',
        },
        supportTitle: 'Tiesioginė inžinieriaus Dariaus patikra · Eigulių g. 21, LT-51418 Kaunas',
        supportDesc:
            'Reikia nestandartinės katilinės schemos ar B2B montuotojo kainos? Skambinkite +370 611 19158 arba atidarykite Vytauto konsultaciją.',
        protocolHeader: 'MAZGO SKAIČIAVIMO PROTOKOLAS · EN 12831',
        reqPowerLabel: 'Skaičiuotinė galia P_kW',
        bufferVesselLabel: 'Akumuliacinė / indas',
        flowKvsLabel: 'Srautas G ir Kvs',
        ufhPumpLabel: 'Kontūrai ir siurblys',
        loopsShort: 'kont.',
        headUnit: 'm v. st.',
        schematicTitle: 'Hidraulinė mazgo schema · Skaičiavimo parametrai',
        schematicAria: 'Gilės Inžinerija hidraulinio mazgo schema',
        svgSourceTitle: '[01] ŠILUMOS ŠALTINIS',
        svgAreaPrefix: 'Plotas',
        svgBufferTitle: '[02–03] TALPA IR INDAS',
        svgManifoldTitle: '[04–06] KOLEKTORIUS IR KVS',
        svgPumpPrefix: 'H_siurb',
        bomHeading: 'Automatiškai parinkta Gilės Kauno sandėlio mazgo sąmata',
        bomSubheading:
            'Tikslūs gamintojų SKU kodai ir realūs UAB „Gilės inžinerija“ Kauno sandėlio (Eigulių g. 21, LT-51418 Kaunas) likučiai.',
        addKitBtn: (formattedTotal: string) => `+ Įtraukti mazgą į krepšelį (${formattedTotal})`,
        kitAddedToast: 'Mazgas įtrauktas į krepšelį',
        openProductBtn: 'Atidaryti prekę',
        thRoleItem: 'Mazgo rolė / Prekė',
        thSkuStock: 'SKU ir likutis',
        thQty: 'Kiekis',
        thTotal: (isNet: boolean) => `Suma (${isNet ? 'be PVM' : 'su PVM'})`,
        qtyUnit: 'vnt.',
        totalBomFooter: (grossStr: string, netValStr: string) =>
            `Viso mazgo sąmata (${grossStr} · ${netValStr} € be PVM)`,
        presetsLabel: 'Tipiniai pastatų ruošiniai (EN 12831):',
        ufhShareLabel: 'Grindinio šildymo dalis (%)',
        staticHeightLabel: 'Statinis aukštis H (m)',
        leaderLengthLabel: 'Pievadas iki kolektoriaus L_l (m)',
        bufferNotNeededShort: 'nebūtina',
        noUfhShort: '0 kont.',
    },
    en: {
        eyebrow: 'ENGINEERING DESIGN WORKBENCH · EN 12831',
        h1: 'Boiler Room, Pellet Burner & Hydronic Node Calculators',
        subtitle:
            'Precision boiler room, pellet burner, heat pump, and hydronic node sizing per EN 12831 with direct equipment selection from our Kaunas warehouse.',
        vatGross: 'Incl. VAT',
        vatNet: 'Excl. VAT',
        vatGroupAria: 'Price display mode',
        wizardBtn: '4-Step Boiler Wizard',
        tabsAria: 'Gilės Inžinerija engineering calculator nodes',
        stockInKaunas: (qty: number) => `In stock in Kaunas: ${qty} pcs`,
        paramsHeading: '01. Architectural & System Parameters',
        paramsSubtitle:
            'Adjust heated building area, energy class, primary heat source, and operating pressure.',
        areaLabel: 'Heated Building Area (m²)',
        energyClassLabel: 'Building Energy Class (A++ .. D)',
        heatSourceLabel: 'Primary Heat Source & Node',
        heatSources: {
            megatherm_pellet: 'Megatherm MPB NANI 8–35 kW Pellet Burner + Auger',
            giles_boiler: 'Gilės KaTRI 25 kW Boiler (6 mm P265GH) + HERZ Teplomix',
            haier_r290: 'Haier R290 Super Aqua Monoblock Heat Pump (+75 °C)',
            haier_electric: 'Haier ES Electric Heating Unit + IMI Pneumatex',
        },
        sysVolumeLabel: 'System Volume (L, excl. buffer)',
        opPressureLabel: 'Static Height H (m)',
        deltaTLabel: 'Temp. Delta ΔT (K)',
        deltaTOptions: {
            dt5: 'ΔT = 5 K (Heat pump)',
            dt7: 'ΔT = 8 K (HP / underfloor)',
            dt15: 'ΔT = 15 K (Boiler / radiators)',
            dt20: 'ΔT = 20 K (High-temp circuit)',
        },
        safetyValvePipeLabel: 'Safety Valve P_sv / Pipe Spacing',
        safetyValveOptions: {
            p3_15: '3.0 bar · spacing 15 cm',
            p3_10: '3.0 bar · spacing 10 cm',
            p6_20: '6.0 bar · spacing 20 cm',
        },
        supportTitle: 'Direct Engineering Support · Eigulių St. 21, LT-51418 Kaunas',
        supportDesc:
            'Need a custom boiler room schematic or B2B contractor pricing? Call +370 611 19158 or ask Vytautas AI.',
        protocolHeader: 'NODE SIZING PROTOCOL · EN 12831',
        reqPowerLabel: 'Required Power P_kW',
        bufferVesselLabel: 'Buffer / Vessel',
        flowKvsLabel: 'Flow G & Kvs',
        ufhPumpLabel: 'UFH Loops & Pump',
        loopsShort: 'loops',
        headUnit: 'm WC',
        schematicTitle: 'Hydronic Node Schematic · Live Sizing Parameters',
        schematicAria: 'Gilės Inžinerija hydronic node schematic',
        svgSourceTitle: '[01] HEAT SOURCE',
        svgAreaPrefix: 'Area',
        svgBufferTitle: '[02–03] BUFFER & VESSEL',
        svgManifoldTitle: '[04–06] MANIFOLD & KVS',
        svgPumpPrefix: 'H_pump',
        bomHeading: 'Auto-Matched Gilės Kaunas Warehouse Bill of Materials',
        bomSubheading:
            'Exact manufacturer SKU codes and live stock quantities in our Kaunas warehouse (Eigulių St. 21, LT-51418 Kaunas).',
        addKitBtn: (formattedTotal: string) => `+ Add kit to cart (${formattedTotal})`,
        kitAddedToast: 'Kit added to cart',
        openProductBtn: 'View product',
        thRoleItem: 'Node Role / Product',
        thSkuStock: 'SKU & Stock',
        thQty: 'Quantity',
        thTotal: (isNet: boolean) => `Total (${isNet ? 'excl. VAT' : 'incl. VAT'})`,
        qtyUnit: 'pcs',
        totalBomFooter: (grossStr: string, netValStr: string) =>
            `Total node kit (${grossStr} · ${netValStr} € excl. VAT)`,
        presetsLabel: 'Quick Building Presets (EN 12831):',
        ufhShareLabel: 'Underfloor Heating Share (%)',
        staticHeightLabel: 'Static Height H (m)',
        leaderLengthLabel: 'Collector Leader Length L_l (m)',
        bufferNotNeededShort: 'not req.',
        noUfhShort: '0 loops',
    },
    pl: {
        eyebrow: 'INŻYNIERYJNY PULPIT PROJEKTOWY · EN 12831',
        h1: 'Kalkulatory kotłowni, palników pelletowych i węzłów hydraulicznych',
        subtitle:
            'Precyzyjny dobór kotłowni, palników pelletowych, pomp ciepła i węzłów hydraulicznych wg EN 12831 z bezpośrednim doborem urządzeń z magazynu w Kownie.',
        vatGross: 'Z VAT',
        vatNet: 'Bez VAT',
        vatGroupAria: 'Tryb wyświetlania cen',
        wizardBtn: 'Kreator modernizacji kotła',
        tabsAria: 'Węzły kalkulatorów inżynieryjnych Gilės Inžinerija',
        stockInKaunas: (qty: number) => `W magazynie w Kownie: ${qty} szt.`,
        paramsHeading: '01. Parametry budynku i węzła hydraulicznego',
        paramsSubtitle:
            'Ustaw ogrzewaną powierzchnię, klasę energetyczną, źródło ciepła oraz ciśnienie robocze.',
        areaLabel: 'Powierzchnia budynku (m²)',
        energyClassLabel: 'Klasa energetyczna budynku (A++ .. D)',
        heatSourceLabel: 'Główne źródło ciepła i węzeł',
        heatSources: {
            megatherm_pellet: 'Palnik pelletowy Megatherm MPB NANI 8–35 kW + podajnik',
            giles_boiler: 'Kocioł stalowy Gilės KaTRI 25 kW (6 mm P265GH) + HERZ Teplomix',
            haier_r290: 'Pompa ciepła Haier R290 Super Aqua Monoblock (+75 °C)',
            haier_electric: 'Jednostka elektryczna Haier ES + IMI Pneumatex',
        },
        sysVolumeLabel: 'Pojemność zładu (L, bez bufora)',
        opPressureLabel: 'Wysokość statyczna H (m)',
        deltaTLabel: 'Różnica temp. ΔT (K)',
        deltaTOptions: {
            dt5: 'ΔT = 5 K (Pompa ciepła)',
            dt7: 'ΔT = 8 K (PC / podłogówka)',
            dt15: 'ΔT = 15 K (Kocioł / grzejniki)',
            dt20: 'ΔT = 20 K (Obieg wysokotemperaturowy)',
        },
        safetyValvePipeLabel: 'Zawór bezp. P_sv / rozstaw rur',
        safetyValveOptions: {
            p3_15: '3,0 bar · rozstaw 15 cm',
            p3_10: '3,0 bar · rozstaw 10 cm',
            p6_20: '6,0 bar · rozstaw 20 cm',
        },
        supportTitle: 'Bezpośrednie wsparcie inżyniera Dariusa · Eigulių g. 21, LT-51418 Kowno',
        supportDesc:
            'Potrzebujesz indywidualnego schematu kotłowni lub cen hurtowych B2B? Zadzwoń +370 611 19158 lub zapytaj Vytautasa AI.',
        protocolHeader: 'PROTOKÓŁ OBLICZEŃ WĘZŁA · EN 12831',
        reqPowerLabel: 'Wymagana moc P_kW',
        bufferVesselLabel: 'Bufor / naczynie',
        flowKvsLabel: 'Przepływ G i Kvs',
        ufhPumpLabel: 'Obwody i pompa',
        loopsShort: 'obw.',
        headUnit: 'm sł. w.',
        schematicTitle: 'Schemat hydrauliczny węzła · Parametry obliczeniowe',
        schematicAria: 'Schemat hydrauliczny węzła Gilės Inžinerija',
        svgSourceTitle: '[01] ŹRÓDŁO CIEPŁA',
        svgAreaPrefix: 'Powierzchnia',
        svgBufferTitle: '[02–03] BUFOR I NACZYNIE',
        svgManifoldTitle: '[04–06] ROZDZIELACZ I KVS',
        svgPumpPrefix: 'H_pompy',
        bomHeading: 'Automatycznie dobrany zestaw urządzeń z magazynu w Kownie',
        bomSubheading:
            'Dokładne kody producentów SKU i rzeczywiste stany magazynowe w Kownie (Eigulių g. 21, LT-51418 Kaunas).',
        addKitBtn: (formattedTotal: string) => `+ Dodaj zestaw do koszyka (${formattedTotal})`,
        kitAddedToast: 'Zestaw dodany do koszyka',
        openProductBtn: 'Otwórz produkt',
        thRoleItem: 'Rola w węźle / Produkt',
        thSkuStock: 'SKU i stan magazynowy',
        thQty: 'Ilość',
        thTotal: (isNet: boolean) => `Suma (${isNet ? 'bez VAT' : 'z VAT'})`,
        qtyUnit: 'szt.',
        totalBomFooter: (grossStr: string, netValStr: string) =>
            `Kosztorys całego węzła (${grossStr} · ${netValStr} € bez VAT)`,
        presetsLabel: 'Typowe profile budynków (EN 12831):',
        ufhShareLabel: 'Udział ogrzewania podłogowego (%)',
        staticHeightLabel: 'Wysokość statyczna H (m)',
        leaderLengthLabel: 'Podejście do rozdzielacza L_l (m)',
        bufferNotNeededShort: 'niewymagany',
        noUfhShort: '0 obw.',
    },
    ru: {
        eyebrow: 'ИНЖЕНЕРНЫЙ РАСЧЕТНЫЙ СТЕНД · EN 12831',
        h1: 'Калькуляторы котельных, пеллетных горелок и гидравлических узлов',
        subtitle:
            'Точный расчет котельных, пеллетных горелок, тепловых насосов и гидравлических узлов по стандарту EN 12831 с прямым подбором оборудования со склада в Каунасе.',
        vatGross: 'С НДС',
        vatNet: 'Без НДС',
        vatGroupAria: 'Режим отображения цен',
        wizardBtn: 'Мастер модернизации котла',
        tabsAria: 'Инженерные узлы калькуляторов Gilės Inžinerija',
        stockInKaunas: (qty: number) => `На складе в Каунасе: ${qty} шт.`,
        paramsHeading: '01. Параметры здания и гидравлического узла',
        paramsSubtitle:
            'Задайте отапливаемую площадь, класс энергоэффективности, источник тепла и рабочее давление.',
        areaLabel: 'Площадь здания (м²)',
        energyClassLabel: 'Класс энергоэффективности (A++ .. D)',
        heatSourceLabel: 'Источник тепла и котельный узел',
        heatSources: {
            megatherm_pellet: 'Пеллетная горелка Megatherm MPB NANI 8–35 кВт + шнек',
            giles_boiler: 'Стальной котел Gilės KaTRI 25 кВт (6 мм P265GH) + HERZ Teplomix',
            haier_r290: 'Тепловой насос Haier R290 Super Aqua Monoblock (+75 °C)',
            haier_electric: 'Электрический узел Haier ES + IMI Pneumatex',
        },
        sysVolumeLabel: 'Объем системы (л, без буфера)',
        opPressureLabel: 'Статическая высота H (м)',
        deltaTLabel: 'Перепад темп. ΔT (K)',
        deltaTOptions: {
            dt5: 'ΔT = 5 K (Тепловой насос)',
            dt7: 'ΔT = 8 K (ТН / теплый пол)',
            dt15: 'ΔT = 15 K (Котел / радиаторы)',
            dt20: 'ΔT = 20 K (Высокотемпературный)',
        },
        safetyValvePipeLabel: 'Клапан P_sv / шаг трубы',
        safetyValveOptions: {
            p3_15: '3,0 бар · шаг 15 см',
            p3_10: '3,0 бар · шаг 10 см',
            p6_20: '6,0 бар · шаг 20 см',
        },
        supportTitle: 'Прямая проверка инженера Дарюса · ул. Эйгулю 21, LT-51418 Каунас',
        supportDesc:
            'Нужна нестандартная схема котельной или оптовая цена B2B? Звоните +370 611 19158 или откройте консультацию Витаутаса.',
        protocolHeader: 'ПРОТОКОЛ РАСЧЕТА УЗЛА · EN 12831',
        reqPowerLabel: 'Расчетная мощность P_kW',
        bufferVesselLabel: 'Буфер / расш. бак',
        flowKvsLabel: 'Расход G и Kvs',
        ufhPumpLabel: 'Контуры и насос',
        loopsShort: 'конт.',
        headUnit: 'м вод. ст.',
        schematicTitle: 'Гидравлическая схема узла · Параметры расчета',
        schematicAria: 'Гидравлическая схема узла Gilės Inžinerija',
        svgSourceTitle: '[01] ИСТОЧНИК ТЕПЛА',
        svgAreaPrefix: 'Площадь',
        svgBufferTitle: '[02–03] БУФЕР И БАК',
        svgManifoldTitle: '[04–06] КОЛЛЕКТОР И KVS',
        svgPumpPrefix: 'H_нас',
        bomHeading: 'Автоматически подобранная смета узла со склада в Каунасе',
        bomSubheading:
            'Точные артикулы SKU производителей и реальные остатки на складе в Каунасе (ул. Эйгулю 21, LT-51418 Каунас).',
        addKitBtn: (formattedTotal: string) => `+ Добавить узел в корзину (${formattedTotal})`,
        kitAddedToast: 'Узел добавлен в корзину',
        openProductBtn: 'Открыть товар',
        thRoleItem: 'Роль в узле / Товар',
        thSkuStock: 'SKU и остаток',
        thQty: 'Кол-во',
        thTotal: (isNet: boolean) => `Сумма (${isNet ? 'без НДС' : 'с НДС'})`,
        qtyUnit: 'шт.',
        totalBomFooter: (grossStr: string, netValStr: string) =>
            `Итого смета узла (${grossStr} · ${netValStr} € без НДС)`,
        presetsLabel: 'Типовые профили зданий (EN 12831):',
        ufhShareLabel: 'Доля теплого пола (%)',
        staticHeightLabel: 'Статическая высота H (м)',
        leaderLengthLabel: 'Подводка к коллектору L_l (м)',
        bufferNotNeededShort: 'не треб.',
        noUfhShort: '0 конт.',
    },
};

export function GilesCadCalculatorsWorkbench({
    initialTab = 'boiler',
    locale = 'lt',
}: {
    initialTab?: string;
    locale?: string;
}) {
    const rawPathname = useNextPathname() || '';
    const intlLocale = useLocale();
    const urlMatch = rawPathname.match(/^\/(lt|en|pl|ru)(?=\/|$)/i);
    const loc: AppLocale = resolveAppLocale(urlMatch ? urlMatch[1] : locale || intlLocale);
    const copy = WORKBENCH_COPY[loc];
    const addItem = useCartStore((s) => s.addItem);
    const openCart = useCartStore((s) => s.openCart);
    const { showNet, setShowNet } = useVatDisplayStore();

    const mapInitialTab = (raw?: string): GilesCadTabId => {
        const clean = (raw || 'boiler').toLowerCase();
        if (clean === 'buffer') return 'buffer';
        if (clean === 'vessel') return 'vessel';
        if (clean === 'valve') return 'valve';
        if (clean === 'manifold') return 'manifold';
        if (clean === 'pump' || clean === 'radiator') return 'pump';
        return 'boiler';
    };

    const [activeTab, setActiveTab] = useState<GilesCadTabId>(() => mapInitialTab(initialTab));
    const [activePresetId, setActivePresetId] = useState<string | null>('renovated_180');
    const [areaM2, setAreaM2] = useState<number>(180);
    const [energyClass, setEnergyClass] = useState<HydronicEnergyClass>('B');
    const [heatSource, setHeatSource] = useState<HydronicHeatSourceId>('megatherm_pellet');
    const [systemVolumeL, setSystemVolumeL] = useState<number>(220);
    const [staticHeightM, setStaticHeightM] = useState<number>(8);
    const [maxPressureBar, setMaxPressureBar] = useState<number>(3.0);
    const [deltaTK, setDeltaTK] = useState<number>(15);
    const [pipeSpacingCm, setPipeSpacingCm] = useState<number>(15);
    const [ufhSharePct, setUfhSharePct] = useState<number>(50);
    const [leaderLengthM, setLeaderLengthM] = useState<number>(6);
    const [addedNodeToast, setAddedNodeToast] = useState<boolean>(false);

    const calc = useMemo(
        () =>
            calcHydronicNode6In1({
                areaM2,
                energyClass,
                powerReservePct: 15,
                heatSource,
                deltaTK,
                systemVolumeL,
                staticHeightM,
                safetyValveBar: maxPressureBar,
                balancingDpKpa: 10,
                longestCircuitM: 60,
                ufhSharePct,
                pipeSpacingCm,
                maxLoopLengthM: 100,
                leaderLengthM,
                ufhSupplyTempC: 40,
            }),
        [
            areaM2,
            energyClass,
            heatSource,
            deltaTK,
            systemVolumeL,
            staticHeightM,
            maxPressureBar,
            ufhSharePct,
            pipeSpacingCm,
            leaderLengthM,
        ],
    );

    const specificLossWm2 = calc.specificLossWm2;
    const calculatedPowerKw = calc.recommendedPowerKw;
    const bufferVolumeL = calc.bufferVolumeL;
    const vesselNominalL = calc.vessel.standardVesselL;
    const staticPressureBar = calc.vessel.prechargeBar;
    const flowLh = calc.totalFlowLh;
    const kvRequired = calc.mainKv;
    const recommendedDn = calc.mainPipe.dn;
    const underfloorLoops = calc.ufh.hasUfh ? calc.ufh.nLoops : 0;
    const underfloorPipeM = calc.ufh.totalPipeLengthM;
    const pumpHeadM = calc.pump.headM;

    const applyBuildingPreset = (presetId: string) => {
        const preset = CALCULATOR_BUILDING_PRESETS.find((p) => p.id === presetId);
        if (!preset) return;
        setActivePresetId(preset.id);
        setAreaM2(preset.areaM2);
        setEnergyClass(preset.energyClass);
        setHeatSource(preset.heatSource);
        setUfhSharePct(preset.ufhSharePct);
        setStaticHeightM(preset.staticHeightM);
        setSystemVolumeL(preset.systemVolumeL);
        setDeltaTK(preset.deltaTK);
        setPipeSpacingCm(preset.pipeSpacingCm);
        setLeaderLengthM(preset.leaderLengthM);
    };

    const tabLiveBadges: Record<GilesCadTabId, string> = {
        boiler: `01 / ${calculatedPowerKw} kW`,
        buffer: `02 / ${bufferVolumeL > 0 ? `${bufferVolumeL} L` : copy.bufferNotNeededShort}`,
        vessel: `03 / ${vesselNominalL} L`,
        valve: `04 / ${recommendedDn} · Kv ${kvRequired}`,
        manifold: `05 / ${underfloorLoops > 0 ? `${underfloorLoops} ${copy.loopsShort}` : copy.noUfhShort}`,
        pump: `06 / ${calc.pump.selectedPump.shortCode}`,
    };

    const activeBomItems: CadBomItem[] = useMemo(() => {
        if (activeTab === 'boiler') {
            if (heatSource === 'haier_r290') {
                return [
                    {
                        id: 'aw082hugha',
                        sku: 'AW082HUGHA',
                        title: {
                            lt: 'Oras–vanduo šilumos siurblys Haier Super Aqua Monoblock R290 8 kW',
                            en: 'Haier Super Aqua Monoblock R290 8 kW Air-to-Water Heat Pump',
                            pl: 'Pompa ciepła powietrze–woda Haier Super Aqua Monoblock R290 8 kW',
                            ru: 'Тепловой насос воздух–вода Haier Super Aqua Monoblock R290 8 кВт',
                        },
                        brand: 'Haier',
                        role: {
                            lt: '01. Pagrindinis R290 šilumos šaltinis',
                            en: '01. Primary R290 Heat Source',
                            pl: '01. Główne źródło ciepła R290',
                            ru: '01. Основной источник тепла R290',
                        },
                        qty: 1,
                        unitGrossEur: 3430.0,
                        stockQuantity: 5,
                        stockSource: 'Kauno sandėlis (Eigulių g. 21, LT-51418 Kaunas)',
                        imageUrl: '/images/products/giles-studio-21-haier-super-aqua-r290.webp',
                    },
                    {
                        id: 'zv-100',
                        sku: 'ZV 100',
                        title: {
                            lt: 'Akumuliacinė talpa Gorenje ZV 100 L šilumos siurbliui',
                            en: 'Gorenje ZV 100 L Buffer Tank for Heat Pump',
                            pl: 'Bufor ciepła Gorenje ZV 100 L do pompy ciepła',
                            ru: 'Буферная емкость Gorenje ZV 100 л для теплового насоса',
                        },
                        brand: 'Gorenje',
                        role: {
                            lt: '02. Hidraulinis akumuliatorius',
                            en: '02. Hydraulic Buffer Tank',
                            pl: '02. Akumulator hydrauliczny',
                            ru: '02. Гидравлический буферный бак',
                        },
                        qty: 1,
                        unitGrossEur: 289.0,
                        stockQuantity: 12,
                        stockSource: 'Kauno sandėlis (Eigulių g. 21, LT-51418 Kaunas)',
                        imageUrl: '/images/products/giles-studio-27-centrometal-cas-1001-buffer.webp',
                    },
                    {
                        id: '7895122',
                        sku: '7895122',
                        title: {
                            lt: 'IMI Pneumatex Zeparo ZUC 22 mikroburbulų ir purvo separatorius',
                            en: 'IMI Pneumatex Zeparo ZUC 22 Microbubble & Dirt Separator',
                            pl: 'Separator mikropęcherzy i zanieczyszczeń IMI Pneumatex Zeparo ZUC 22',
                            ru: 'Сепаратор микропузырьков и шлама IMI Pneumatex Zeparo ZUC 22',
                        },
                        brand: 'IMI Pneumatex',
                        role: {
                            lt: '03. Šilumokaičio apsauga',
                            en: '03. Heat Exchanger Protection',
                            pl: '03. Ochrona wymiennika ciepła',
                            ru: '03. Защита теплообменника',
                        },
                        qty: 1,
                        unitGrossEur: 142.0,
                        stockQuantity: 14,
                        stockSource: 'Kauno sandėlis (Eigulių g. 21, LT-51418 Kaunas)',
                        imageUrl: '/images/products/7101003.webp',
                    },
                ];
            }
            if (heatSource === 'haier_electric') {
                return [
                    {
                        id: 'es50v-tf7',
                        sku: 'ES50V-TF7(EU)',
                        title: {
                            lt: 'Haier TF7 dviejų bakų elektrinis šildymo mazgas ir vandens šildytuvas',
                            en: 'Haier TF7 Dual-Tank Electric Heating & DHW Unit',
                            pl: 'Elektryczny moduł grzewczy i podgrzewacz wody Haier TF7',
                            ru: 'Электрический отопительный модуль и водонагреватель Haier TF7',
                        },
                        brand: 'Haier',
                        role: {
                            lt: '01. Elektrinis šilumos mazgas',
                            en: '01. Electric Thermal Unit',
                            pl: '01. Elektryczny węzeł cieplny',
                            ru: '01. Электрический тепловой узел',
                        },
                        qty: 1,
                        unitGrossEur: 308.0,
                        stockQuantity: 9,
                        stockSource: 'Kauno sandėlis (Eigulių g. 21, LT-51418 Kaunas)',
                        imageUrl: '/images/products/haier-2026-es50v-tf7-eu.webp',
                    },
                    {
                        id: '7101003',
                        sku: '7101003',
                        title: {
                            lt: 'IMI Pneumatex Statico SD 25.3 plėtimosi indas (3 bar)',
                            en: 'IMI Pneumatex Statico SD 25.3 Expansion Vessel (3 bar)',
                            pl: 'Naczynie wzbiorcze IMI Pneumatex Statico SD 25.3 (3 bar)',
                            ru: 'Расширительный бак IMI Pneumatex Statico SD 25.3 (3 бар)',
                        },
                        brand: 'IMI Pneumatex',
                        role: {
                            lt: '02. Slėgio kompensavimas',
                            en: '02. Pressure Compensation',
                            pl: '02. Kompensacja ciśnienia',
                            ru: '02. Компенсация давления',
                        },
                        qty: 1,
                        unitGrossEur: 84.0,
                        stockQuantity: 18,
                        stockSource: 'Kauno sandėlis (Eigulių g. 21, LT-51418 Kaunas)',
                        imageUrl: '/images/products/7101003.webp',
                    },
                    {
                        id: '013g2990',
                        sku: '013G2990',
                        title: {
                            lt: 'Danfoss RA 2990 termostatinė galvutė su dujiniu jutikliu',
                            en: 'Danfoss RA 2990 Gas-Bellows Thermostatic Head',
                            pl: 'Głowica termostatyczna Danfoss RA 2990 z czujnikiem gazowym',
                            ru: 'Термостатическая головка Danfoss RA 2990 с газовым сильфоном',
                        },
                        brand: 'Danfoss',
                        role: {
                            lt: '03. Kontūrų termostatika',
                            en: '03. Loop Thermostatic Control',
                            pl: '03. Regulacja termostatyczna obwodów',
                            ru: '03. Термостатика контуров',
                        },
                        qty: 4,
                        unitGrossEur: 24.9,
                        stockQuantity: 48,
                        stockSource: 'Kauno sandėlis (Eigulių g. 21, LT-51418 Kaunas)',
                        imageUrl: '/images/products/013g2990.webp',
                    },
                ];
            }
            return [
                {
                    id: 'mpb-nani-35',
                    sku: 'MPB-NANI-35',
                    title: {
                        lt: 'Granulių degiklio komplektas Megatherm MPB NANI 8–35 kW su sraigtu',
                        en: 'Megatherm MPB NANI 8–35 kW Pellet Burner Kit with Auger',
                        pl: 'Zestaw palnika pelletowego Megatherm MPB NANI 8–35 kW z podajnikiem',
                        ru: 'Комплект пеллетной горелки Megatherm MPB NANI 8–35 кВт со шнеком',
                    },
                    brand: 'Megatherm',
                    role: {
                        lt: '01. Automatinis granulių degiklis',
                        en: '01. Automatic Pellet Burner',
                        pl: '01. Automatyczny palnik pelletowy',
                        ru: '01. Автоматическая пеллетная горелка',
                    },
                    qty: 1,
                    unitGrossEur: 2350.0,
                    stockQuantity: 6,
                    stockSource: 'Kauno sandėlis (Eigulių g. 21, LT-51418 Kaunas)',
                    imageUrl: '/images/products/giles-studio-01-mpb-nani-35-50.webp',
                },
                {
                    id: 'kat-25kw-gi',
                    sku: 'KaTRI3850020',
                    title: {
                        lt: 'Plieninis kieto kuro ir granulių katilas KaTRI 25 kW (6 mm P265GH)',
                        en: 'KaTRI 25 kW Steel Solid-Fuel & Pellet Boiler (6 mm P265GH)',
                        pl: 'Kocioł stalowy na paliwo stałe i pellet KaTRI 25 kW (6 mm P265GH)',
                        ru: 'Стальной твердотопливный и пеллетный котел KaTRI 25 кВт (6 мм P265GH)',
                    },
                    brand: 'Gilės Inžinerija',
                    role: {
                        lt: '02. Katilo korpusas (6 mm plienas)',
                        en: '02. Boiler Body (6 mm steel)',
                        pl: '02. Korpus kotła (stal 6 mm)',
                        ru: '02. Корпус котла (сталь 6 мм)',
                    },
                    qty: 1,
                    unitGrossEur: 1750.0,
                    stockQuantity: 4,
                    stockSource: 'Kauno sandėlis (Eigulių g. 21, LT-51418 Kaunas)',
                    imageUrl: '/images/products/giles-studio-25-katri-25kw-pellet-boiler.webp',
                },
                {
                    id: 'herz-1776603',
                    sku: '1776603',
                    title: {
                        lt: 'Termostatinis grįžtamo srauto pamaišymo vožtuvas HERZ Teplomix DN25',
                        en: 'HERZ Teplomix DN25 Return Anticondensation Mixing Valve',
                        pl: 'Termostatyczny zawór mieszający powrotu HERZ Teplomix DN25',
                        ru: 'Термостатический смесительный клапан обратки HERZ Teplomix DN25',
                    },
                    brand: 'HERZ',
                    role: {
                        lt: '03. Apsauga nuo kondensato (55–61 °C)',
                        en: '03. Anticondensation Valve (55–61 °C)',
                        pl: '03. Ochrona przed kondensacją (55–61 °C)',
                        ru: '03. Защита от конденсата (55–61 °C)',
                    },
                    qty: 1,
                    unitGrossEur: 94.0,
                    stockQuantity: 34,
                    stockSource: 'Kauno sandėlis (Eigulių g. 21, LT-51418 Kaunas)',
                    imageUrl: '/images/products/giles-studio-29-solar-ssv-station-kit.webp',
                },
            ];
        }
        if (activeTab === 'buffer') {
            return [
                {
                    id: 'zv-100',
                    sku: 'ZV 100',
                    title: {
                        lt: 'Akumuliacinė talpa Gorenje ZV 100 L (PN6 bar, G 3/4")',
                        en: 'Gorenje ZV 100 L Hydronic Buffer Tank (PN6 bar, G 3/4")',
                        pl: 'Zbiornik buforowy Gorenje ZV 100 L (PN6 bar, G 3/4")',
                        ru: 'Буферная емкость Gorenje ZV 100 л (PN6 бар, G 3/4")',
                    },
                    brand: 'Gorenje',
                    role: {
                        lt: '01. Akumuliacinė talpa (50 L/kW)',
                        en: '01. Hydronic Buffer Tank (50 L/kW)',
                        pl: '01. Zbiornik buforowy (50 L/kW)',
                        ru: '01. Буферная емкость (50 л/кВт)',
                    },
                    qty: Math.max(1, Math.round(bufferVolumeL / 500)),
                    unitGrossEur: 289.0,
                    stockQuantity: 12,
                    stockSource: 'Kauno sandėlis (Eigulių g. 21, LT-51418 Kaunas)',
                    imageUrl: '/images/products/giles-studio-27-centrometal-cas-1001-buffer.webp',
                },
                {
                    id: 'herz-1776603',
                    sku: '1776603',
                    title: {
                        lt: 'HERZ Teplomix DN25 (1") 55–61 °C katilo įkrovimo vožtuvas',
                        en: 'HERZ Teplomix DN25 (1") 55–61 °C Boiler Loading Valve',
                        pl: 'Zawór ładowania bufora HERZ Teplomix DN25 (1") 55–61 °C',
                        ru: 'Клапан загрузки буфера HERZ Teplomix DN25 (1") 55–61 °C',
                    },
                    brand: 'HERZ',
                    role: {
                        lt: '02. Akumuliacinės talpos įkrovimo mazgas',
                        en: '02. Buffer Tank Charging Valve',
                        pl: '02. Węzeł ładowania bufora ciepła',
                        ru: '02. Узел загрузки буферной емкости',
                    },
                    qty: 1,
                    unitGrossEur: 94.0,
                    stockQuantity: 34,
                    stockSource: 'Kauno sandėlis (Eigulių g. 21, LT-51418 Kaunas)',
                    imageUrl: '/images/products/giles-studio-29-solar-ssv-station-kit.webp',
                },
            ];
        }
        if (activeTab === 'vessel') {
            return [
                {
                    id: '7101003',
                    sku: '7101003',
                    title: {
                        lt: `IMI Pneumatex Statico SD ${vesselNominalL}.3 plėtimosi indas su Airproof membrana`,
                        en: `IMI Pneumatex Statico SD ${vesselNominalL}.3 Expansion Vessel with Airproof Bladder`,
                        pl: `Naczynie wzbiorcze IMI Pneumatex Statico SD ${vesselNominalL}.3 z membraną Airproof`,
                        ru: `Расширительный бак IMI Pneumatex Statico SD ${vesselNominalL}.3 с мембраной Airproof`,
                    },
                    brand: 'IMI Pneumatex',
                    role: {
                        lt: `01. Plėtimosi indas (${vesselNominalL} L · EN 12828)`,
                        en: `01. Expansion Vessel (${vesselNominalL} L · EN 12828)`,
                        pl: `01. Naczynie wzbiorcze (${vesselNominalL} L · EN 12828)`,
                        ru: `01. Расширительный бак (${vesselNominalL} л · EN 12828)`,
                    },
                    qty: 1,
                    unitGrossEur: 84.0,
                    stockQuantity: 18,
                    stockSource: 'Kauno sandėlis (Eigulių g. 21, LT-51418 Kaunas)',
                    imageUrl: '/images/products/7101003.webp',
                },
                {
                    id: '5363019',
                    sku: '5363019',
                    title: {
                        lt: 'IMI Pneumatex DSV 25 apsauginis slėgio vožtuvas',
                        en: 'IMI Pneumatex DSV 25 Safety Relief Valve',
                        pl: 'Zawór bezpieczeństwa IMI Pneumatex DSV 25',
                        ru: 'Предохранительный клапан IMI Pneumatex DSV 25',
                    },
                    brand: 'IMI Pneumatex',
                    role: {
                        lt: '02. Apsauginis vožtuvas (3,0 bar)',
                        en: '02. Safety Relief Valve (3.0 bar)',
                        pl: '02. Zawór bezpieczeństwa (3,0 bar)',
                        ru: '02. Предохранительный клапан (3,0 бар)',
                    },
                    qty: 1,
                    unitGrossEur: 68.5,
                    stockQuantity: 15,
                    stockSource: 'Kauno sandėlis (Eigulių g. 21, LT-51418 Kaunas)',
                    imageUrl: '/images/products/7111020.webp',
                },
            ];
        }
        if (activeTab === 'valve') {
            return [
                {
                    id: '52-151-020',
                    sku: '52-151-020',
                    title: {
                        lt: `IMI TA STAD ${recommendedDn} precizinis balansinis vožtuvas su matavimo nipeliais`,
                        en: `IMI TA STAD ${recommendedDn} Precision Balancing Valve with Test Points`,
                        pl: `Precyzyjny zawór równoważący IMI TA STAD ${recommendedDn} z króćcami pomiarowymi`,
                        ru: `Балансировочный клапан IMI TA STAD ${recommendedDn} с измерительными ниппелями`,
                    },
                    brand: 'IMI TA',
                    role: {
                        lt: `01. Magistralės balansavimas (${recommendedDn})`,
                        en: `01. Branch Balancing (${recommendedDn})`,
                        pl: `01. Równoważenie gałęzi (${recommendedDn})`,
                        ru: `01. Балансировка ветки (${recommendedDn})`,
                    },
                    qty: 1,
                    unitGrossEur: 76.4,
                    stockQuantity: 22,
                    stockSource: 'Kauno sandėlis (Eigulių g. 21, LT-51418 Kaunas)',
                    imageUrl: '/images/products/52-151-014.webp',
                },
                {
                    id: '065b0774',
                    sku: '065B0774',
                    title: {
                        lt: 'Danfoss bronzinis reguliavimo vožtuvas ΔPmaks 20 bar (VG 2)',
                        en: 'Danfoss Bronze Control Valve ΔPmax 20 bar (VG 2)',
                        pl: 'Brązowy zawór regulacyjny Danfoss ΔPmaks 20 bar (VG 2)',
                        ru: 'Бронзовый регулирующий клапан Danfoss ΔPмакс 20 бар (VG 2)',
                    },
                    brand: 'Danfoss',
                    role: {
                        lt: '02. Diferencinio slėgio palaikymas',
                        en: '02. Differential Pressure Control',
                        pl: '02. Utrzymanie ciśnienia różnicowego',
                        ru: '02. Поддержание перепада давления',
                    },
                    qty: 1,
                    unitGrossEur: 124.0,
                    stockQuantity: 11,
                    stockSource: 'Kauno sandėlis (Eigulių g. 21, LT-51418 Kaunas)',
                    imageUrl: '/images/products/giles-8826005-e1409650886687-b0fa6b47.webp',
                },
            ];
        }
        if (activeTab === 'manifold') {
            return [
                {
                    id: '9330-08.800',
                    sku: '9330-08.800',
                    title: {
                        lt: `IMI Heimeier Dynacon Eclipse ${underfloorLoops} kontūrų nerūdijančio plieno kolektorius`,
                        en: `IMI Heimeier Dynacon Eclipse ${underfloorLoops}-Loop Stainless Manifold`,
                        pl: `Rozdzielacz ze stali nierdzewnej IMI Heimeier Dynacon Eclipse (${underfloorLoops} obw.)`,
                        ru: `Коллектор из нержавеющей стали IMI Heimeier Dynacon Eclipse (${underfloorLoops} конт.)`,
                    },
                    brand: 'IMI Heimeier',
                    role: {
                        lt: '01. Automatinis AFC kolektorius (l/h)',
                        en: '01. Automatic AFC Manifold (l/h)',
                        pl: '01. Automatyczny rozdzielacz AFC (l/h)',
                        ru: '01. Автоматический коллектор AFC (л/ч)',
                    },
                    qty: 1,
                    unitGrossEur: 318.0,
                    stockQuantity: 9,
                    stockSource: 'Kauno sandėlis (Eigulių g. 21, LT-51418 Kaunas)',
                    imageUrl: '/images/products/9330-08.800.webp',
                },
                {
                    id: '88.04.120',
                    sku: '88.04.120',
                    title: {
                        lt: 'Comisa PEX/AL/PEX 16×2 mm presuojama jungtis ir kontūro armatūra',
                        en: 'Comisa PEX/AL/PEX 16×2 mm Press Fitting & Loop Set',
                        pl: 'Złączka zaprasowywana i zestaw obwodu Comisa PEX/AL/PEX 16×2 mm',
                        ru: 'Пресс-фитинг и арматура контура Comisa PEX/AL/PEX 16×2 мм',
                    },
                    brand: 'Comisa',
                    role: {
                        lt: `02. Jungčių komplektas (${underfloorLoops * 2} vnt.)`,
                        en: `02. Euroconus Fitting Set (${underfloorLoops * 2} pcs)`,
                        pl: `02. Zestaw złączek Euroconus (${underfloorLoops * 2} szt.)`,
                        ru: `02. Комплект евроконусов (${underfloorLoops * 2} шт.)`,
                    },
                    qty: underfloorLoops * 2,
                    unitGrossEur: 5.92,
                    stockQuantity: 64,
                    stockSource: 'Kauno sandėlis (Eigulių g. 21, LT-51418 Kaunas)',
                    imageUrl: '/images/products/giles-241-e1411971950854-591c2498.webp',
                },
            ];
        }
        return [
            {
                id: '2217972',
                sku: '2217972',
                title: {
                    lt: `${calc.pump.selectedPump.model} / Stratos PICO elektroninis cirkuliacinis siurblys (PWM / Δp-v)`,
                    en: `${calc.pump.selectedPump.model} / Stratos PICO Electronic Circulation Pump (PWM / Δp-v)`,
                    pl: `${calc.pump.selectedPump.model} / Stratos PICO elektroniczna pompa obiegowa (PWM / Δp-v)`,
                    ru: `${calc.pump.selectedPump.model} / Stratos PICO электронный циркуляционный насос (PWM / Δp-v)`,
                },
                brand: 'Wilo',
                role: {
                    lt: `01. Cirkuliacinis siurblys (${flowLh} l/h, H=${pumpHeadM} m)`,
                    en: `01. Circulation Pump (${flowLh} l/h, H=${pumpHeadM} m)`,
                    pl: `01. Pompa obiegowa (${flowLh} l/h, H=${pumpHeadM} m)`,
                    ru: `01. Циркуляционный насос (${flowLh} л/ч, H=${pumpHeadM} м)`,
                },
                qty: 1,
                unitGrossEur: 248.0,
                stockQuantity: 7,
                stockSource: 'Kauno sandėlis (Eigulių g. 21, LT-51418 Kaunas)',
                imageUrl: '/images/products/giles-stratos-40-1-6-pn6-10-f4ef4954.webp',
            },
            {
                id: '0675-05.000',
                sku: '0675-05.000',
                title: {
                    lt: 'IMI Heimeier Dlobo D uždarymo kranas su drenažu',
                    en: 'IMI Heimeier Dlobo D Shut-Off Ball Valve with Drain',
                    pl: 'Kurek kulowy odcinający IMI Heimeier Dlobo D ze spustem',
                    ru: 'Шаровой запорный кран IMI Heimeier Dlobo D с дренажем',
                },
                brand: 'IMI Heimeier',
                role: {
                    lt: '02. Siurblio mazgo atjungimo armatūra',
                    en: '02. Pump Isolation Valve Pair',
                    pl: '02. Armatura odcinająca grupy pompowej',
                    ru: '02. Запорная арматура насосного узла',
                },
                qty: 2,
                unitGrossEur: 38.5,
                stockQuantity: 24,
                stockSource: 'Kauno sandėlis (Eigulių g. 21, LT-51418 Kaunas)',
                imageUrl: '/images/products/0601-02.350.webp',
            },
        ];
    }, [
        activeTab,
        heatSource,
        bufferVolumeL,
        vesselNominalL,
        recommendedDn,
        underfloorLoops,
        flowLh,
        pumpHeadM,
        calc.pump.selectedPump.model,
    ]);

    const totalBomGrossEur = useMemo(
        () =>
            Math.round(
                activeBomItems.reduce((sum, item) => sum + item.unitGrossEur * item.qty, 0) * 100,
            ) / 100,
        [activeBomItems],
    );
    const totalBomNetEur = Math.round((totalBomGrossEur / 1.21) * 100) / 100;

    const formatMoney = (gross: number) => {
        const v = showNet ? gross / 1.21 : gross;
        return `${v.toFixed(2).replace('.', ',')} €`;
    };

    const handleAddWholeNodeToCart = () => {
        for (const item of activeBomItems) {
            addItem({
                id: item.id,
                productId: item.id,
                name: item.title[loc],
                price: item.unitGrossEur,
                sku: item.sku,
                quantity: item.qty,
                image: assetUrl(item.imageUrl),
            });
        }
        setAddedNodeToast(true);
        openCart();
        setTimeout(() => setAddedNodeToast(false), 3000);
    };

    return (
        <div
            data-testid="giles-cad-calculators-workbench"
            className="min-h-screen bg-[#F5F3EE] text-[#11161B]"
        >
            <style>{`#cookie-consent-banner { display: none !important; }`}</style>
            {/* 1. Dark Graphite Architectural Header (#11161B with #2C3742 border) */}
            <section className="bg-[#11161B] text-[#F5F3EE] border-b border-[#2C3742] pt-5 pb-0">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 space-y-4">
                    <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
                        <div className="space-y-1.5 max-w-3xl">
                            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white leading-tight">
                                {copy.h1}
                            </h1>
                            <p className="text-xs sm:text-sm text-[#C9D0D8] leading-relaxed">
                                <strong className="text-[#FF8A3D]">{copy.eyebrow}</strong> –{' '}
                                {copy.subtitle}
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                            <div
                                role="group"
                                aria-label={copy.vatGroupAria}
                                className="inline-flex border border-[#2C3742] bg-[#192028] p-0.5 rounded-none"
                            >
                                <button
                                    type="button"
                                    onClick={() => setShowNet(false)}
                                    aria-pressed={!showNet}
                                    className={`px-3 py-1.5 text-xs font-bold cursor-pointer whitespace-nowrap rounded-none bg-transparent transition-colors ${
                                        !showNet
                                            ? 'border border-[#FF8A3D] text-[#FF8A3D]'
                                            : 'text-[#C9D0D8]'
                                    }`}
                                >
                                    {copy.vatGross}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowNet(true)}
                                    aria-pressed={showNet}
                                    className={`px-3 py-1.5 text-xs font-bold cursor-pointer whitespace-nowrap rounded-none bg-transparent transition-colors ${
                                        showNet
                                            ? 'border border-[#FF8A3D] text-[#FF8A3D]'
                                            : 'text-[#C9D0D8]'
                                    }`}
                                >
                                    {copy.vatNet}
                                </button>
                            </div>

                            <NextLink
                                href={`/${loc}/vedlys`}
                                className="inline-flex items-center border border-[#2C3742] bg-transparent hover:border-[#FF8A3D] px-3.5 py-2 text-xs font-bold text-[#F5F3EE] rounded-none whitespace-nowrap transition-colors"
                            >
                                {copy.wizardBtn}
                            </NextLink>
                        </div>
                    </div>

                    {/* 6 Horizontal Architectural Workbench Tabs */}
                    <div
                        role="tablist"
                        aria-label={copy.tabsAria}
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 border-t border-l border-[#2C3742] bg-[#192028]"
                    >
                        {CAD_WORKBENCH_TABS.map((tab) => {
                            const isSelected = activeTab === tab.id;
                            return (
                                <div
                                    key={tab.id}
                                    role="tab"
                                    tabIndex={0}
                                    aria-selected={isSelected}
                                    onClick={() => setActiveTab(tab.id)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault();
                                            setActiveTab(tab.id);
                                        }
                                    }}
                                    className={`text-left px-3.5 py-3 rounded-none border-r border-b border-[#2C3742] transition-colors cursor-pointer ${
                                        isSelected
                                            ? 'bg-[#C2410C] text-white'
                                            : 'bg-[#192028] text-[#C9D0D8] hover:bg-[#222B35] hover:text-white'
                                    }`}
                                >
                                    <span className="block text-xs font-bold leading-snug">
                                        {tab.label[loc]}
                                    </span>
                                    <span
                                        className={`block text-xs mt-1 font-extrabold tabular-nums ${
                                            isSelected ? 'text-white' : 'text-[#FF8A3D]'
                                        }`}
                                    >
                                        {tabLiveBadges[tab.id]}
                                    </span>
                                    <span
                                        className={`block text-xs mt-0.5 tabular-nums ${
                                            isSelected ? 'text-white' : 'text-[#9BA6B2]'
                                        }`}
                                    >
                                        {tab.shortSpec[loc]}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 space-y-6">
                {/* 4 Quick Building Presets (EN 12831) */}
                <div
                    data-testid="calculator-building-presets"
                    role="group"
                    aria-label={copy.presetsLabel}
                    className="space-y-2"
                >
                    <span className="block text-xs font-extrabold text-[#11161B]">
                        {copy.presetsLabel}
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border-t border-l border-[#E2DDD3] bg-white">
                        {CALCULATOR_BUILDING_PRESETS.map((preset) => {
                            const isActive = activePresetId === preset.id;
                            return (
                                <div
                                    key={preset.id}
                                    data-testid={`building-preset-${preset.id}`}
                                    tabIndex={0}
                                    aria-pressed={isActive}
                                    onClick={() => applyBuildingPreset(preset.id)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault();
                                            applyBuildingPreset(preset.id);
                                        }
                                    }}
                                    className={`text-left px-3.5 py-2.5 border-r border-b border-[#E2DDD3] rounded-none cursor-pointer transition-colors ${
                                        isActive
                                            ? 'bg-[#FBEADF] border-l-4 border-l-[#C2410C]'
                                            : 'bg-white hover:bg-[#FAF8F5]'
                                    }`}
                                >
                                    <span className="block text-xs font-extrabold text-[#11161B] leading-snug">
                                        {preset.title[loc]}
                                    </span>
                                    <span className="block text-xs text-[#5B6470] mt-0.5 tabular-nums">
                                        {preset.subtitle[loc]}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Above-the-Fold 6-Cell Gilės Studio Equipment Strip (ensures >= 6 product images above fold) */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 border-t border-l border-[#E2DDD3] bg-white">
                    {CAD_WORKBENCH_TABS.map((tab) => {
                        const isSelected = activeTab === tab.id;
                        return (
                            <div
                                key={`strip-${tab.id}`}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2.5 p-2.5 text-left border-r border-b border-[#E2DDD3] rounded-none transition-colors cursor-pointer ${
                                    isSelected ? 'bg-[#FBEADF]' : 'bg-white hover:bg-[#FAF8F5]'
                                }`}
                            >
                                <div className="h-12 w-12 bg-[#EEEBE4] p-1.5 flex items-center justify-center shrink-0 rounded-none">
                                    <img
                                        src={assetUrl(tab.previewImg)}
                                        alt={tab.label[loc]}
                                        className="max-h-full max-w-full object-contain mix-blend-multiply"
                                    />
                                </div>
                                <div className="min-w-0">
                                    <span className="block text-xs font-extrabold text-[#11161B] leading-tight">
                                        {tab.previewSku}
                                    </span>
                                    <span className="block text-xs font-semibold text-[#157A3B] mt-0.5 leading-tight">
                                        {copy.stockInKaunas(tab.previewStockQty)}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* 2. 2-Column Flush Hairline CAD Engineering Workspace */}
                <div className="grid grid-cols-1 lg:grid-cols-12 border-t border-l border-[#E2DDD3] bg-[#F5F3EE]">
                    {/* Left Column: Architectural Parameter Inputs */}
                    <div className="lg:col-span-5 border-r border-b border-[#E2DDD3] bg-white p-6 rounded-none space-y-5">
                        <div className="border-b border-[#E2DDD3] pb-3">
                            <h2 className="text-base sm:text-lg font-extrabold text-[#11161B]">
                                {copy.paramsHeading}
                            </h2>
                            <p className="text-xs text-[#5B6470] mt-0.5">
                                {copy.paramsSubtitle}
                            </p>
                        </div>

                        {/* Parameter 1: Pastato plotas m2 */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs font-bold text-[#11161B]">
                                <label htmlFor="cad-area-range">
                                    {copy.areaLabel}
                                </label>
                                <span className="tabular-nums text-sm font-extrabold text-[#C2410C]">
                                    {areaM2} m²
                                </span>
                            </div>
                            <input
                                id="cad-area-range"
                                type="range"
                                min={50}
                                max={600}
                                step={10}
                                value={areaM2}
                                onChange={(e) => setAreaM2(Number(e.target.value))}
                                className="w-full accent-[#C2410C] cursor-pointer"
                            />
                            <div className="grid grid-cols-5 border-t border-l border-[#E2DDD3]">
                                {[80, 120, 160, 240, 400].map((preset) => (
                                    <button
                                        key={preset}
                                        type="button"
                                        onClick={() => setAreaM2(preset)}
                                        className={`py-2 text-xs font-bold border-r border-b rounded-none bg-transparent whitespace-nowrap cursor-pointer transition-colors ${
                                            areaM2 === preset
                                                ? 'border-[#C2410C] text-[#C2410C] font-extrabold'
                                                : 'border-[#E2DDD3] text-[#11161B] hover:border-[#11161B]'
                                        }`}
                                    >
                                        {preset} m²
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Parameter 2: Energinė klasė A++..D */}
                        <div className="space-y-2">
                            <span className="block text-xs font-bold text-[#11161B]">
                                {copy.energyClassLabel}
                            </span>
                            <div className="grid grid-cols-5 border-t border-l border-[#E2DDD3]">
                                {(['A++', 'A+', 'B', 'C', 'D'] as const).map((cls) => (
                                    <button
                                        key={cls}
                                        type="button"
                                        onClick={() => setEnergyClass(cls)}
                                        className={`py-2 text-xs font-bold border-r border-b rounded-none bg-transparent whitespace-nowrap cursor-pointer transition-colors ${
                                            energyClass === cls
                                                ? 'border-[#C2410C] text-[#C2410C] font-extrabold'
                                                : 'border-[#E2DDD3] text-[#11161B] hover:border-[#11161B]'
                                        }`}
                                    >
                                        {cls}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Parameter 3: Šilumos šaltinis */}
                        <div className="space-y-2">
                            <span className="block text-xs font-bold text-[#11161B]">
                                {copy.heatSourceLabel}
                            </span>
                            <div className="grid grid-cols-1 border-t border-l border-[#E2DDD3]">
                                {(
                                    [
                                        'megatherm_pellet',
                                        'giles_boiler',
                                        'haier_r290',
                                        'haier_electric',
                                    ] as const
                                ).map((srcId) => (
                                    <div
                                        key={srcId}
                                        role="radio"
                                        tabIndex={0}
                                        aria-checked={heatSource === srcId}
                                        onClick={() => setHeatSource(srcId)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === ' ') {
                                                e.preventDefault();
                                                setHeatSource(srcId);
                                            }
                                        }}
                                        className={`px-3.5 py-2.5 text-left text-xs font-bold border-r border-b border-[#E2DDD3] rounded-none cursor-pointer transition-colors ${
                                            heatSource === srcId
                                                ? 'bg-[#11161B] text-white border-l-4 border-l-[#C2410C]'
                                                : 'bg-white text-[#11161B] hover:bg-[#FAF8F5]'
                                        }`}
                                    >
                                        {copy.heatSources[srcId]}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Parameter 4: Sistemos tūris L, Statinis aukštis H (m), ΔT, žingsnis, grindinio dalis, pievadas */}
                        <div className="grid grid-cols-2 border-t border-l border-[#E2DDD3]">
                            <div className="border-r border-b border-[#E2DDD3] p-3 bg-[#F5F3EE]">
                                <label
                                    htmlFor="cad-vol-input"
                                    className="block text-xs font-bold text-[#11161B]"
                                >
                                    {copy.sysVolumeLabel}
                                </label>
                                <input
                                    id="cad-vol-input"
                                    type="number"
                                    min={50}
                                    max={2500}
                                    value={systemVolumeL}
                                    onChange={(e) => {
                                        setActivePresetId(null);
                                        setSystemVolumeL(
                                            Math.max(50, Number(e.target.value) || 200),
                                        );
                                    }}
                                    className="mt-1.5 w-full border border-[#D5CFC3] bg-white px-2.5 py-1.5 text-xs font-bold text-[#11161B] rounded-none tabular-nums"
                                />
                            </div>
                            <div className="border-r border-b border-[#E2DDD3] p-3 bg-[#F5F3EE]">
                                <label
                                    htmlFor="cad-pressure-input"
                                    className="block text-xs font-bold text-[#11161B]"
                                >
                                    {copy.opPressureLabel}
                                </label>
                                <input
                                    id="cad-pressure-input"
                                    type="number"
                                    step={0.5}
                                    min={2}
                                    max={40}
                                    value={staticHeightM}
                                    onChange={(e) => {
                                        setActivePresetId(null);
                                        setStaticHeightM(
                                            Math.min(40, Math.max(2, Number(e.target.value) || 8)),
                                        );
                                    }}
                                    className="mt-1.5 w-full border border-[#D5CFC3] bg-white px-2.5 py-1.5 text-xs font-bold text-[#11161B] rounded-none tabular-nums"
                                />
                            </div>
                            <div className="border-r border-b border-[#E2DDD3] p-3 bg-[#F5F3EE]">
                                <label
                                    htmlFor="cad-dt-select"
                                    className="block text-xs font-bold text-[#11161B]"
                                >
                                    {copy.deltaTLabel}
                                </label>
                                <select
                                    id="cad-dt-select"
                                    value={deltaTK}
                                    onChange={(e) => {
                                        setActivePresetId(null);
                                        setDeltaTK(Number(e.target.value));
                                    }}
                                    className="mt-1.5 w-full border border-[#D5CFC3] bg-white px-2 py-1.5 text-xs font-bold text-[#11161B] rounded-none"
                                >
                                    <option value={5}>{copy.deltaTOptions.dt5}</option>
                                    <option value={8}>{copy.deltaTOptions.dt7}</option>
                                    <option value={15}>{copy.deltaTOptions.dt15}</option>
                                    <option value={20}>{copy.deltaTOptions.dt20}</option>
                                </select>
                            </div>
                            <div className="border-r border-b border-[#E2DDD3] p-3 bg-[#F5F3EE]">
                                <label
                                    htmlFor="cad-pmax-select"
                                    className="block text-xs font-bold text-[#11161B]"
                                >
                                    {copy.safetyValvePipeLabel}
                                </label>
                                <select
                                    id="cad-pmax-select"
                                    value={`${maxPressureBar}-${pipeSpacingCm}`}
                                    onChange={(e) => {
                                        setActivePresetId(null);
                                        const [pStr, sStr] = e.target.value.split('-');
                                        setMaxPressureBar(Number(pStr) || 3.0);
                                        setPipeSpacingCm(Number(sStr) || 15);
                                    }}
                                    className="mt-1.5 w-full border border-[#D5CFC3] bg-white px-2 py-1.5 text-xs font-bold text-[#11161B] rounded-none"
                                >
                                    <option value="3-15">{copy.safetyValveOptions.p3_15}</option>
                                    <option value="3-10">{copy.safetyValveOptions.p3_10}</option>
                                    <option value="6-20">{copy.safetyValveOptions.p6_20}</option>
                                </select>
                            </div>
                            <div className="border-r border-b border-[#E2DDD3] p-3 bg-[#F5F3EE]">
                                <label
                                    htmlFor="cad-ufh-share"
                                    className="block text-xs font-bold text-[#11161B]"
                                >
                                    {copy.ufhShareLabel}:{' '}
                                    <strong className="text-[#C2410C]">{ufhSharePct} %</strong>
                                </label>
                                <input
                                    id="cad-ufh-share"
                                    type="range"
                                    min={0}
                                    max={100}
                                    step={10}
                                    value={ufhSharePct}
                                    onChange={(e) => {
                                        setActivePresetId(null);
                                        setUfhSharePct(Number(e.target.value));
                                    }}
                                    className="mt-2 w-full accent-[#C2410C] cursor-pointer"
                                />
                            </div>
                            <div className="border-r border-b border-[#E2DDD3] p-3 bg-[#F5F3EE]">
                                <label
                                    htmlFor="cad-leader-input"
                                    className="block text-xs font-bold text-[#11161B]"
                                >
                                    {copy.leaderLengthLabel}
                                </label>
                                <input
                                    id="cad-leader-input"
                                    type="number"
                                    min={0}
                                    max={30}
                                    step={1}
                                    value={leaderLengthM}
                                    onChange={(e) => {
                                        setActivePresetId(null);
                                        setLeaderLengthM(
                                            Math.min(30, Math.max(0, Number(e.target.value) || 0)),
                                        );
                                    }}
                                    className="mt-1.5 w-full border border-[#D5CFC3] bg-white px-2.5 py-1.5 text-xs font-bold text-[#11161B] rounded-none tabular-nums"
                                />
                            </div>
                        </div>

                        {/* Quick Engineer Consultation Callout */}
                        <div className="border border-[#E2DDD3] bg-[#FBEADF] p-3.5 rounded-none space-y-1.5">
                            <span className="block text-xs font-extrabold text-[#5A1F05]">
                                {copy.supportTitle}
                            </span>
                            <p className="text-xs text-[#6E2A0A] leading-relaxed">
                                {copy.supportDesc}
                            </p>
                        </div>
                    </div>

                    {/* Right Column: Dark CAD Blueprint & Formula Readout Panel (#11161B) */}
                    <div className="lg:col-span-7 border-r border-b border-[#E2DDD3] bg-[#11161B] text-[#F5F3EE] p-6 rounded-none space-y-5">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#2C3742] pb-3">
                            <div>
                                <span className="text-xs font-extrabold text-[#FF8A3D] block">
                                    {copy.protocolHeader}
                                </span>
                                <h3 className="text-base sm:text-lg font-bold text-white mt-0.5">
                                    {CAD_WORKBENCH_TABS.find((t) => t.id === activeTab)?.label[loc]}
                                </h3>
                            </div>
                            <span className="border border-[#2C3742] bg-[#192028] px-2.5 py-1 text-xs font-semibold text-[#C9D0D8] rounded-none tabular-nums">
                                Q = A × q × ΔT · V_buf = P_kW × 50 L/kW
                            </span>
                        </div>

                        {/* 4 Key Calculated Engineering Readout Cells */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 border-t border-l border-[#2C3742]">
                            <div className="border-r border-b border-[#2C3742] bg-[#192028] p-3 rounded-none">
                                <span className="block text-xs text-[#C9D0D8]">
                                    {copy.reqPowerLabel}
                                </span>
                                <span className="block text-lg sm:text-xl font-extrabold text-[#FF8A3D] tabular-nums mt-0.5">
                                    {calculatedPowerKw} kW
                                </span>
                                <span className="block text-xs text-[#9BA6B2] tabular-nums">
                                    {specificLossWm2} W/m² · {areaM2} m²
                                </span>
                            </div>
                            <div className="border-r border-b border-[#2C3742] bg-[#192028] p-3 rounded-none">
                                <span className="block text-xs text-[#C9D0D8]">
                                    {copy.bufferVesselLabel}
                                </span>
                                <span className="block text-lg sm:text-xl font-extrabold text-white tabular-nums mt-0.5">
                                    {bufferVolumeL} L / {vesselNominalL} L
                                </span>
                                <span className="block text-xs text-[#9BA6B2] tabular-nums">
                                    P0 = {staticPressureBar.toFixed(1)} bar
                                </span>
                            </div>
                            <div className="border-r border-b border-[#2C3742] bg-[#192028] p-3 rounded-none">
                                <span className="block text-xs text-[#C9D0D8]">
                                    {copy.flowKvsLabel}
                                </span>
                                <span className="block text-lg sm:text-xl font-extrabold text-[#38BDF8] tabular-nums mt-0.5">
                                    {flowLh} l/h
                                </span>
                                <span className="block text-xs text-[#9BA6B2] tabular-nums">
                                    {recommendedDn} · Kv {kvRequired}
                                </span>
                            </div>
                            <div className="border-r border-b border-[#2C3742] bg-[#192028] p-3 rounded-none">
                                <span className="block text-xs text-[#C9D0D8]">
                                    {copy.ufhPumpLabel}
                                </span>
                                <span className="block text-lg sm:text-xl font-extrabold text-white tabular-nums mt-0.5">
                                    {underfloorLoops} {copy.loopsShort} ({underfloorPipeM} m)
                                </span>
                                <span className="block text-xs text-[#9BA6B2] tabular-nums">
                                    H = {pumpHeadM} {copy.headUnit}
                                </span>
                            </div>
                        </div>

                        {/* Procedurally-Redrawn Live Animated Hydronic Schematic + Interactive SVG Pump Q-H Chart */}
                        <GilesLiveHydronicSchematic
                            calc={calc}
                            activeTab={activeTab}
                            onSelectTab={(nextTab) => setActiveTab(nextTab)}
                            locale={loc}
                        />

                        <GilesPumpQhChart calc={calc} locale={loc} />

                        {/* Auto-Matched Gilės Warehouse BOM Table */}
                        <div className="space-y-3">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <div>
                                    <h4 className="text-sm font-extrabold text-white">
                                        {copy.bomHeading}
                                    </h4>
                                    <p className="text-xs text-[#C9D0D8]">
                                        {copy.bomSubheading}
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={handleAddWholeNodeToCart}
                                    className="inline-flex items-center gap-2 border border-[#FF8A3D] bg-[#C2410C] hover:bg-[#9A3412] px-4 py-2.5 text-xs font-bold text-white rounded-none cursor-pointer whitespace-nowrap transition-colors"
                                >
                                    <span>
                                        {addedNodeToast
                                            ? copy.kitAddedToast
                                            : copy.addKitBtn(formatMoney(totalBomGrossEur))}
                                    </span>
                                </button>
                            </div>

                            {/* Mobile stacked BOM cards (<640px) so swipe_tables = 0 */}
                            <div className="sm:hidden border-t border-l border-[#2C3742]">
                                {activeBomItems.map((item) => (
                                    <div
                                        key={`mob-${item.sku}`}
                                        className="border-r border-b border-[#2C3742] bg-[#192028] p-3.5 space-y-2 rounded-none"
                                    >
                                        <div className="flex items-center justify-between gap-2 text-xs">
                                            <span className="font-bold text-[#FF8A3D] tabular-nums">
                                                SKU: {item.sku}
                                            </span>
                                            <span className="font-semibold text-[#4ADE80] tabular-nums">
                                                {copy.stockInKaunas(item.stockQuantity)}
                                            </span>
                                        </div>
                                        <p className="text-xs font-bold text-white leading-snug">
                                            {item.title[loc]}
                                        </p>
                                        <div className="flex items-center justify-between gap-2 pt-1">
                                            <span className="text-xs text-[#C9D0D8] tabular-nums">
                                                {item.qty} {copy.qtyUnit} × {formatMoney(item.unitGrossEur)}
                                            </span>
                                            <NextLink
                                                href={`/${loc}/products?q=${encodeURIComponent(item.sku)}`}
                                                className="border border-[#2C3742] bg-[#11161B] px-2.5 py-1 text-xs font-bold text-white rounded-none"
                                            >
                                                {copy.openProductBtn}
                                            </NextLink>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Desktop BOM Table (sm:block) */}
                            <div className="hidden sm:block border border-[#2C3742] bg-[#192028] rounded-none">
                                <table className="w-full border-collapse text-left text-xs">
                                    <thead>
                                        <tr className="border-b border-[#2C3742] bg-[#11161B] text-[#C9D0D8]">
                                            <th className="py-2.5 px-3 font-bold">{copy.thRoleItem}</th>
                                            <th className="py-2.5 px-3 font-bold">{copy.thSkuStock}</th>
                                            <th className="py-2.5 px-3 font-bold">{copy.thQty}</th>
                                            <th className="py-2.5 px-3 font-bold text-right">
                                                {copy.thTotal(showNet)}
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#2C3742]">
                                        {activeBomItems.map((item) => {
                                            const lineGross = item.unitGrossEur * item.qty;
                                            return (
                                                <tr key={item.sku} className="hover:bg-[#222B35]">
                                                    <td className="py-2.5 px-3">
                                                        <span className="block text-xs font-bold text-[#FF8A3D]">
                                                            {item.role[loc]}
                                                        </span>
                                                        <NextLink
                                                            href={`/${loc}/products?q=${encodeURIComponent(item.sku)}`}
                                                            className="font-bold text-white hover:text-[#FF8A3D] leading-snug"
                                                        >
                                                            {item.title[loc]}
                                                        </NextLink>
                                                    </td>
                                                    <td className="py-2.5 px-3">
                                                        <span className="block font-bold text-white tabular-nums">
                                                            {item.sku}
                                                        </span>
                                                        <span className="block text-xs font-semibold text-[#4ADE80] tabular-nums">
                                                            {copy.stockInKaunas(item.stockQuantity)}
                                                        </span>
                                                    </td>
                                                    <td className="py-2.5 px-3 font-bold text-white tabular-nums whitespace-nowrap">
                                                        {item.qty} {copy.qtyUnit}
                                                    </td>
                                                    <td className="py-2.5 px-3 text-right font-extrabold text-white tabular-nums whitespace-nowrap">
                                                        {formatMoney(lineGross)}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                    <tfoot>
                                        <tr className="border-t border-[#2C3742] bg-[#11161B]">
                                            <td colSpan={3} className="py-3 px-3 font-bold text-[#C9D0D8]">
                                                {copy.totalBomFooter(
                                                    formatMoney(totalBomGrossEur),
                                                    totalBomNetEur.toFixed(2).replace('.', ','),
                                                )}
                                            </td>
                                            <td className="py-3 px-3 text-right font-extrabold text-[#FF8A3D] text-sm tabular-nums whitespace-nowrap">
                                                {formatMoney(totalBomGrossEur)}
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <ApvaSubsidyWidget locale={loc} />
        </div>
    );
}
