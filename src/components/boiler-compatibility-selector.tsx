'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Wrench, Search } from 'lucide-react';
import {
    BOILER_SYSTEM_GROUPS,
    LITHUANIAN_BOILER_SYSTEM_MODELS,
    type BoilerCompatLocale,
    type BoilerSystemGroupId,
} from '../lib/lithuanian-boiler-compatibility';
import { COMPATIBILITY_SOURCE_PROVENANCE_COPY } from './industrial-containers-hub';
import { assetUrl } from '../lib/api';

export interface BoilerQuickPickItem {
    id: string;
    label: Record<BoilerCompatLocale, string>;
}

export const TOP_BOILER_QUICK_PICKS: BoilerQuickPickItem[] = [
    {
        id: 'viadrus-u22-u26',
        label: {
            lt: 'Viadrus U22/U26',
            en: 'Viadrus U22/U26',
            pl: 'Viadrus U22/U26',
            ru: 'Viadrus U22/U26',
        },
    },
    {
        id: 'kalvis-2-serija',
        label: {
            lt: 'Kalvis 2-16/20',
            en: 'Kalvis 2-16/20',
            pl: 'Kalvis 2-16/20',
            ru: 'Kalvis 2-16/20',
        },
    },
    {
        id: 'atmos-vigas',
        label: {
            lt: 'Atmos / Vigas',
            en: 'Atmos / Vigas',
            pl: 'Atmos / Vigas',
            ru: 'Atmos / Vigas',
        },
    },
    {
        id: 'stropuva-zvake',
        label: {
            lt: 'Stropuva',
            en: 'Stropuva',
            pl: 'Stropuva',
            ru: 'Stropuva',
        },
    },
    {
        id: 'megatherm-mpb',
        label: {
            lt: 'Megatherm MPB',
            en: 'Megatherm MPB',
            pl: 'Megatherm MPB',
            ru: 'Megatherm MPB',
        },
    },
    {
        id: 'haier-super-aqua-r290',
        label: {
            lt: 'Haier R290',
            en: 'Haier R290',
            pl: 'Haier R290',
            ru: 'Haier R290',
        },
    },
];

const COMPACT_GROUP_TAB_LABELS: Record<BoilerSystemGroupId, Record<BoilerCompatLocale, string>> = {
    kieto_kuro_seni: {
        lt: '1. Kieto kuro katilai (8)',
        en: '1. Solid fuel boilers (8)',
        pl: '1. Kotły stałopalne (8)',
        ru: '1. Твердотопливные (8)',
    },
    granuliniai_degikliai: {
        lt: '2. Granuliniai degikliai (6)',
        en: '2. Pellet burners (6)',
        pl: '2. Palniki pelletowe (6)',
        ru: '2. Пеллетные горелки (6)',
    },
    silumos_siurbliai: {
        lt: '3. Šilumos siurbliai (6)',
        en: '3. Heat pumps (6)',
        pl: '3. Pompy ciepła (6)',
        ru: '3. Тепловые насосы (6)',
    },
    dujiniai_elektriniai_mazgai: {
        lt: '4. Dujiniai ir šildymo mazgai (5)',
        en: '4. Gas & heating units (5)',
        pl: '4. Gazowe i układy (5)',
        ru: '4. Газовые и узлы (5)',
    },
};

export function splitBoilerModelLabel(fullLabel: string): { modelName: string; subtitle: string } {
    const match = fullLabel.match(/^(.+?)\s*\(([^)]+)\)\s*$/);
    if (!match) {
        return { modelName: fullLabel.trim(), subtitle: '' };
    }
    return {
        modelName: match[1].trim(),
        subtitle: match[2].trim(),
    };
}

function buildSelectorQueryUrl(
    current: Record<string, string | undefined>,
    overrides: Record<string, string | undefined>,
    locale: string,
): string {
    const merged: Record<string, string | undefined> = { ...current, ...overrides };
    if (!('page' in overrides)) {
        delete merged.page;
    }
    if ('category' in overrides) {
        if (!('sub' in overrides)) delete merged.sub;
        if (!('subtype' in overrides)) delete merged.subtype;
        if (!('spec' in overrides)) delete merged.spec;
    }
    if (merged.sub === 'all') {
        delete merged.sub;
    }
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(merged)) {
        if (value && value.trim()) {
            search.set(key, value.trim());
        }
    }
    const qs = search.toString();
    return `/${locale}/products${qs ? `?${qs}` : ''}`;
}

export interface BoilerCompatibilitySelectorProps {
    locale: BoilerCompatLocale;
    selectedBoiler?: string;
    activeGroupId: BoilerSystemGroupId;
    boilerCounts: Record<string, number>;
    currentParams: Record<string, string | undefined>;
    selectedBoilerLabel?: string;
    selectedBoilerCount?: number;
}

export function BoilerCompatibilitySelector({
    locale,
    selectedBoiler,
    activeGroupId,
    boilerCounts,
    currentParams,
    selectedBoilerLabel,
    selectedBoilerCount,
}: BoilerCompatibilitySelectorProps) {
    const router = useRouter();
    const [isExpanded, setIsExpanded] = useState(false);
    const [currentGroupId, setCurrentGroupId] = useState<BoilerSystemGroupId>(activeGroupId);
    const [searchFilter, setSearchFilter] = useState('');

    useEffect(() => {
        setCurrentGroupId(activeGroupId);
    }, [activeGroupId]);

    useEffect(() => {
        if (!isExpanded) return;
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsExpanded(false);
            }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [isExpanded]);

    const activeGroup = useMemo(
        () =>
            BOILER_SYSTEM_GROUPS.find((grp) => grp.id === currentGroupId) ||
            BOILER_SYSTEM_GROUPS[0],
        [currentGroupId],
    );

    const visibleModels = useMemo(() => {
        const q = searchFilter.trim().toLowerCase();
        if (!q) {
            return activeGroup.models;
        }
        return LITHUANIAN_BOILER_SYSTEM_MODELS.filter((mdl) => {
            const fullText = `${mdl.labels[locale]} ${mdl.shortChipLabels[locale]} ${mdl.id}`.toLowerCase();
            return fullText.includes(q);
        });
    }, [activeGroup, locale, searchFilter]);

    const selectedModelObj = useMemo(
        () =>
            selectedBoiler
                ? LITHUANIAN_BOILER_SYSTEM_MODELS.find((m) => m.id === selectedBoiler)
                : undefined,
        [selectedBoiler],
    );

    const resolvedSelectedShortName =
        selectedModelObj?.shortChipLabels[locale] ||
        selectedBoilerLabel ||
        selectedBoiler ||
        '';
    const resolvedSelectedCount =
        typeof selectedBoilerCount === 'number'
            ? selectedBoilerCount
            : selectedBoiler
              ? (boilerCounts[selectedBoiler] ?? 0)
              : 0;

    const resetHref = buildSelectorQueryUrl(
        currentParams,
        { boiler: undefined, boilerGroup: undefined },
        locale,
    );

    return (
        <div
            data-testid="boiler-compatibility-selector"
            className="mx-auto max-w-7xl px-4 sm:px-6"
        >
            {/* Compact Collapsed Single-Row Bar (~56px height on desktop) */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2 min-w-0">
                    <div
                        aria-hidden="true"
                        className="hidden xl:flex items-center gap-1 mr-0.5 shrink-0"
                    >
                        <img
                            src={assetUrl('/images/products/giles-studio-01-mpb-nani-35-50.webp')}
                            alt=""
                            className="h-6 w-6 bg-white border border-[#D5CFC3] p-0.5 object-contain"
                        />
                        <img
                            src={assetUrl('/images/products/giles-studio-06-megatherm-burner-kit.webp')}
                            alt=""
                            className="h-6 w-6 bg-white border border-[#D5CFC3] p-0.5 object-contain"
                        />
                        <img
                            src={assetUrl('/images/products/giles-studio-21-haier-super-aqua-r290.webp')}
                            alt=""
                            className="h-6 w-6 bg-white border border-[#D5CFC3] p-0.5 object-contain"
                        />
                    </div>

                    <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-extrabold text-[#5A1F05] whitespace-nowrap">
                        <Wrench className="w-4 h-4 text-[#C2410C] shrink-0" aria-hidden="true" />
                        <span>
                            {locale === 'lt'
                                ? 'Katilo / sistemos suderinamumo filtras:'
                                : locale === 'en'
                                  ? 'Boiler / system compatibility filter:'
                                  : locale === 'pl'
                                    ? 'Filtr kompatybilności kotła / systemu:'
                                    : 'Фильтр совместимости котла / системы:'}
                        </span>
                    </span>

                    {selectedBoiler ? (
                        <div className="flex flex-wrap items-center gap-2">
                            <span
                                data-testid="boiler-active-badge"
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-extrabold text-[#11161B] border border-[#11161B] bg-transparent rounded-none whitespace-nowrap"
                            >
                                <span>
                                    {selectedModelObj?.verificationStatus === 'PATVIRTINTA_GAMINTOJO'
                                        ? locale === 'lt'
                                            ? `Pasirinktas katilas: ${resolvedSelectedShortName} · ${resolvedSelectedCount} poz. (Gamintojo dokumentu patvirtintas suderinamumas)`
                                            : `Selected boiler: ${resolvedSelectedShortName} · ${resolvedSelectedCount} items (Manufacturer-confirmed)`
                                        : locale === 'lt'
                                          ? `Pasirinktas katilas: ${resolvedSelectedShortName} · ${resolvedSelectedCount} poz. · Tipinis parinkimas (suderinamumą su konkrečiu katilo modeliu pasitikslinkite su mūsų inžinieriumi +370 611 19158)`
                                          : `Selected boiler: ${resolvedSelectedShortName} · ${resolvedSelectedCount} items · Verify compatibility with our engineer (+370 611 19158)`}
                                </span>
                            </span>
                            <Link
                                href={resetHref}
                                rel="nofollow"
                                data-testid="boiler-selector-clear"
                                className="inline-flex items-center px-2.5 py-1 text-xs font-extrabold text-[#C2410C] border border-[#C2410C] bg-transparent hover:underline rounded-none whitespace-nowrap"
                            >
                                {locale === 'lt' ? '✕ Visi katilai' : '✕ All boilers'}
                            </Link>
                        </div>
                    ) : (
                        <div
                            className={`${
                                isExpanded ? 'hidden lg:flex' : 'flex'
                            } flex-wrap items-center gap-2`}
                        >
                            {TOP_BOILER_QUICK_PICKS.map((item) => {
                                const mdl = LITHUANIAN_BOILER_SYSTEM_MODELS.find(
                                    (m) => m.id === item.id,
                                );
                                const quickHref = buildSelectorQueryUrl(
                                    currentParams,
                                    {
                                        boiler: item.id,
                                        boilerGroup: mdl?.groupId || 'kieto_kuro_seni',
                                        category: undefined,
                                        sub: undefined,
                                        subtype: undefined,
                                    },
                                    locale,
                                );
                                return (
                                    <Link
                                        key={item.id}
                                        href={quickHref}
                                        rel="nofollow"
                                        data-testid={`boiler-quick-pick-${item.id}`}
                                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold whitespace-nowrap rounded-none border border-[#D5CFC3] bg-transparent text-[#5A1F05] hover:border-[#C2410C] hover:text-[#C2410C] transition-colors"
                                    >
                                        <span>{item.label[locale]}</span>
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Right side: Interactive Expand/Collapse Toggle Button */}
                <div className="flex items-center gap-2 shrink-0">
                    <button
                        type="button"
                        data-testid="boiler-selector-expand-toggle"
                        aria-expanded={isExpanded}
                        aria-controls="boiler-selector-expanded-panel"
                        onClick={() => setIsExpanded((prev) => !prev)}
                        className="inline-flex items-center justify-center px-3 py-1.5 text-xs font-extrabold text-[#11161B] border border-[#11161B] bg-transparent hover:border-[#C2410C] hover:text-[#C2410C] rounded-none transition-colors cursor-pointer whitespace-nowrap"
                    >
                        {isExpanded
                            ? locale === 'lt'
                                ? 'Suskleisti modelių sąrašą ▴'
                                : 'Collapse model list ▴'
                            : selectedBoiler
                              ? locale === 'lt'
                                  ? 'Keisti katilo modelį ▾'
                                  : 'Change boiler model ▾'
                              : locale === 'lt'
                                ? 'Visi 25 katilų ir sistemų modeliai (pagal 4 grupes) ▾'
                                : 'All 25 boiler & system models (by 4 groups) ▾'}
                    </button>
                </div>
            </div>

            {/* Smart Expanded Panel (4 Group Tabs + Quick Search / Select + Active Group Model Grid) */}
            {isExpanded && (
                <div
                    id="boiler-selector-expanded-panel"
                    data-testid="boiler-selector-expanded-panel"
                    className="border-t border-[#D5CFC3] pt-2.5 mt-2 space-y-2"
                >
                    {/* Top Row: 4 Interactive Group Switcher Tabs + Quick Search / Dropdown */}
                    <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-2">
                        <div
                            role="tablist"
                            aria-label="Katilų ir šildymo sistemų grupės"
                            className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-1.5"
                        >
                            {BOILER_SYSTEM_GROUPS.map((grp) => {
                                const isActiveTab = !searchFilter.trim() && activeGroup.id === grp.id;
                                return (
                                    <button
                                        key={grp.id}
                                        type="button"
                                        role="tab"
                                        aria-selected={isActiveTab}
                                        data-testid={`boiler-group-tab-${grp.id}`}
                                        onClick={() => {
                                            setCurrentGroupId(grp.id);
                                            setSearchFilter('');
                                        }}
                                        className={`inline-flex items-center justify-start px-2 py-1.5 text-[11px] sm:text-xs font-extrabold whitespace-nowrap truncate rounded-none border bg-transparent transition-colors cursor-pointer ${
                                            isActiveTab
                                                ? 'border-[#11161B] text-[#11161B] underline underline-offset-4'
                                                : 'border-[#D5CFC3] text-[#5A1F05] hover:border-[#C2410C] hover:text-[#C2410C]'
                                        }`}
                                    >
                                        {COMPACT_GROUP_TAB_LABELS[grp.id][locale]}
                                    </button>
                                );
                            })}
                        </div>

                        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-1.5 sm:gap-2">
                            <div className="relative flex items-center min-w-0">
                                <Search
                                    className="w-3.5 h-3.5 text-[#5A1F05] absolute left-2 pointer-events-none"
                                    aria-hidden="true"
                                />
                                <input
                                    type="search"
                                    value={searchFilter}
                                    onChange={(e) => setSearchFilter(e.target.value)}
                                    data-testid="boiler-model-search-input"
                                    placeholder={
                                        locale === 'lt'
                                            ? 'Greita paieška tarp 25 modelių...'
                                            : 'Quick search across 25 models...'
                                    }
                                    aria-label={
                                        locale === 'lt'
                                            ? 'Greita paieška tarp 25 modelių...'
                                            : 'Quick search across 25 models...'
                                    }
                                    className="h-8 pl-7 pr-2 w-full sm:w-60 border border-[#11161B] bg-transparent text-xs font-bold text-[#11161B] placeholder:text-[#6E2A0A] rounded-none"
                                />
                            </div>

                            <select
                                id="boiler-quick-select"
                                name="boiler"
                                value={selectedBoiler || ''}
                                data-testid="boiler-compatibility-dropdown"
                                aria-label={
                                    locale === 'lt'
                                        ? 'Greita paieška tarp 25 modelių...'
                                        : 'Select from all 25 boiler / system models'
                                }
                                onChange={(e) => {
                                    const val = e.target.value;
                                    const mdl = LITHUANIAN_BOILER_SYSTEM_MODELS.find(
                                        (m) => m.id === val,
                                    );
                                    const targetUrl = buildSelectorQueryUrl(
                                        currentParams,
                                        {
                                            boiler: val || undefined,
                                            boilerGroup: mdl?.groupId || undefined,
                                            category: undefined,
                                            sub: undefined,
                                            subtype: undefined,
                                        },
                                        locale,
                                    );
                                    router.push(targetUrl);
                                }}
                                className="h-8 w-full sm:w-auto sm:max-w-[240px] border border-[#11161B] bg-transparent px-2 text-xs font-bold text-[#11161B] rounded-none"
                            >
                                <option value="">
                                    {locale === 'lt'
                                        ? 'Greita paieška tarp 25 modelių...'
                                        : 'Select from 25 models...'}
                                </option>
                                {BOILER_SYSTEM_GROUPS.map((grp) => (
                                    <optgroup key={grp.id} label={grp.shortTabLabel[locale]}>
                                        {grp.models.map((mdl) => (
                                            <option key={mdl.id} value={mdl.id}>
                                                {mdl.labels[locale]} ({boilerCounts[mdl.id] ?? 0} poz.)
                                            </option>
                                        ))}
                                    </optgroup>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Active Group Description + Responsive 4-Column Model Grid */}
                    <div className="space-y-1.5">
                        <p className="hidden sm:block text-xs font-semibold text-[#5A1F05]">
                            {searchFilter.trim()
                                ? locale === 'lt'
                                    ? `Paieškos rezultatai tarp 25 katilų ir šildymo sistemų modelių (${visibleModels.length}):`
                                    : `Search results across 25 models (${visibleModels.length}):`
                                : `${activeGroup.title[locale]} – ${activeGroup.subtitle[locale]}`}
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                            {visibleModels.map((mdl) => {
                                const isSelected = selectedBoiler === mdl.id;
                                const { modelName, subtitle } = splitBoilerModelLabel(
                                    mdl.labels[locale],
                                );
                                const modelCount = boilerCounts[mdl.id] ?? 0;
                                const chipHref = buildSelectorQueryUrl(
                                    currentParams,
                                    {
                                        boiler: isSelected ? undefined : mdl.id,
                                        boilerGroup: mdl.groupId,
                                        category: undefined,
                                        sub: undefined,
                                        subtype: undefined,
                                    },
                                    locale,
                                );
                                return (
                                    <Link
                                        key={mdl.id}
                                        href={chipHref}
                                        rel="nofollow"
                                        data-testid={`boiler-model-chip-${mdl.id}`}
                                        onClick={() => setIsExpanded(false)}
                                        className={`flex flex-col justify-between p-2.5 rounded-none border bg-transparent transition-colors ${
                                            isSelected
                                                ? 'border-2 border-[#11161B] text-[#11161B]'
                                                : 'border-[#D5CFC3] text-[#11161B] hover:border-[#C2410C]'
                                        }`}
                                    >
                                        <span className="text-xs font-extrabold text-[#11161B] leading-snug">
                                            {modelName}
                                        </span>
                                        <span className="flex items-center justify-between gap-2 mt-1 text-[11px] text-[#5A1F05]">
                                            <span className="truncate">
                                                {subtitle || mdl.shortChipLabels[locale]}
                                            </span>
                                            <span className="font-extrabold text-[#C2410C] shrink-0 tabular-nums">
                                                ({modelCount} poz.)
                                            </span>
                                        </span>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
            {/* Source Provenance & Verification Note (req_261030064151_1270 & req_261030072802_61e2) */}
            <div
                data-testid="compatibility-source-provenance"
                className={`${
                    isExpanded || Boolean(selectedBoiler) ? 'block' : 'hidden'
                } border-t border-[#D5CFC3] pt-2 mt-2 text-xs text-[#5A1F05] space-y-1`}
            >
                <p className="font-bold text-[#11161B]">
                    {selectedModelObj?.verificationStatus === 'PATVIRTINTA_GAMINTOJO'
                        ? 'Gamintojo dokumentu patvirtintas suderinamumas'
                        : 'Tipinis parinkimas (suderinamumą su konkrečiu katilo modeliu pasitikslinkite su mūsų inžinieriumi +370 611 19158)'}
                </p>
                <p>
                    {locale === 'lt'
                        ? 'Šaltinis: Gamintojo techninis katalogas (Danfoss / IMI Hydronic / HERZ / Haier / Gorenje 2025–2026) ir LST EN 215 / EN 12828 / EN 303-5 standartas'
                        : COMPATIBILITY_SOURCE_PROVENANCE_COPY[locale].standardSource}
                </p>
                <p>
                    {locale === 'lt'
                        ? 'Patikslinimo pastaba: Kieto kuro katilų durelių angos ir flanšo matmenys priklauso nuo katilo pagaminimo metų ir kW modifikacijos – prieš užsakant durelių perdarymo komplektą ar degiklį, tikslius matmenis pasitikslinkite pagal katilo techninį pasą arba su „Gilės inžinerijos“ inžinieriumi (+370 611 19158).'
                        : COMPATIBILITY_SOURCE_PROVENANCE_COPY[locale].retrofitCaveat}
                </p>
            </div>
        </div>
    );
}
