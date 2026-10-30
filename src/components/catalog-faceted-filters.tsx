'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, X, ChevronDown, Check, SlidersHorizontal } from 'lucide-react';
import { useLocale } from 'next-intl';
import { usePathname } from 'next/navigation';
import {
    CATALOG_SUBTYPE_OPTIONS,
    CATALOG_SPEC_OPTIONS,
    type CatalogSubtypeOption,
    type CatalogSpecOption,
} from '../lib/catalog-filter-options';
import { resolveAppLocale } from '../i18n/storefront-ui-copy';
import type { AppLocale } from '../i18n/routing';
import { localizeCategoryLabel, localizeSubtypeLabel } from '../lib/product-i18n';

export interface FacetCategoryItem {
    id: string;
    name: string;
    slug?: string;
    productCount?: number;
}

export interface FacetBrandItem {
    id: string;
    name: string;
    slug?: string;
    count?: number;
    productCount?: number;
}

export interface CatalogFacetedFiltersProps {
    locale?: string;
    categories: FacetCategoryItem[];
    brands: FacetBrandItem[];
    subtypes?: CatalogSubtypeOption[];
    specs?: CatalogSpecOption[];
    selectedCategory?: string;
    selectedBrand?: string;
    selectedSubtype?: string;
    selectedSpec?: string;
    selectedPrice?: string;
    selectedSort?: string;
    minPrice?: string;
    maxPrice?: string;
    inStock?: string;
    searchParams: Record<string, string | undefined>;
    activeFilterCount: number;
    hasActiveFilters: boolean;
    totalCatalogCount: number;
    enableDeepSubtypeSpecFilters?: boolean;
}

const FACETED_FILTERS_COPY: Record<
    AppLocale,
    {
        sidebarAria: string;
        sidebarTitle: string;
        clearAll: string;
        headingCategory: string;
        allCategories: string;
        collapse: string;
        expandCategories: (n: number) => string;
        headingBrand: string;
        searchBrandPlaceholder: (n: number) => string;
        searchBrandAria: (n: number) => string;
        clearBrandSearchAria: string;
        allBrands: string;
        noBrandsFound: (q: string) => string;
        expandBrands: (n: number) => string;
        headingSubtype: string;
        expandSubtypes: (n: number) => string;
        headingSpec: string;
        expandSpecs: (n: number) => string;
        headingPrice: string;
        priceUnder50: string;
        price50to200: string;
        price200to1000: string;
        priceFrom1000: string;
        sortCheapest: string;
        sortMostExpensive: string;
        inStockWithPrice: string;
    }
> = {
    lt: {
        sidebarAria: 'Inžineriniai filtrai',
        sidebarTitle: 'Inžineriniai filtrai',
        clearAll: 'Išvalyti visus',
        headingCategory: 'Sistemos kategorija',
        allCategories: 'Visos kategorijos',
        collapse: '− Glausti',
        expandCategories: (n) => `+ Visos kategorijos (${n})`,
        headingBrand: 'Gamintojas / Prekės ženklas',
        searchBrandPlaceholder: (n) => `Ieškoti iš ${n} gamintojų...`,
        searchBrandAria: (n) => `Ieškoti iš ${n} gamintojų`,
        clearBrandSearchAria: 'Išvalyti gamintojo paiešką',
        allBrands: 'Visi gamintojai',
        noBrandsFound: (q) => `Pagal „${q}“ gamintojų nerasta.`,
        expandBrands: (n) => `+ Visi ${n} gamintojai`,
        headingSubtype: 'Mazgo potipis',
        expandSubtypes: (n) => `+ Visi potipiai (${n})`,
        headingSpec: 'Techninis parametras (DN / Sriegis)',
        expandSpecs: (n) => `+ Visi parametrai (${n})`,
        headingPrice: 'Kaina ir likutis (€)',
        priceUnder50: 'Iki 50',
        price50to200: '50–200',
        price200to1000: '200–1000',
        priceFrom1000: 'Nuo 1000',
        sortCheapest: 'Kaina ↑ pigiausi',
        sortMostExpensive: 'Kaina ↓ brangiausi',
        inStockWithPrice: 'Su kaina sandėlyje',
    },
    en: {
        sidebarAria: 'Engineering filters',
        sidebarTitle: 'Engineering filters',
        clearAll: 'Clear all',
        headingCategory: 'System category',
        allCategories: 'All categories',
        collapse: '− Collapse',
        expandCategories: (n) => `+ All categories (${n})`,
        headingBrand: 'Manufacturer / Brand',
        searchBrandPlaceholder: (n) => `Search ${n} manufacturers...`,
        searchBrandAria: (n) => `Search ${n} manufacturers`,
        clearBrandSearchAria: 'Clear manufacturer search',
        allBrands: 'All manufacturers',
        noBrandsFound: (q) => `No manufacturers found for "${q}".`,
        expandBrands: (n) => `+ All ${n} manufacturers`,
        headingSubtype: 'Component subtype',
        expandSubtypes: (n) => `+ All subtypes (${n})`,
        headingSpec: 'Technical spec (DN / Thread)',
        expandSpecs: (n) => `+ All parameters (${n})`,
        headingPrice: 'Price & stock (€)',
        priceUnder50: 'Up to 50',
        price50to200: '50–200',
        price200to1000: '200–1000',
        priceFrom1000: 'From 1000',
        sortCheapest: 'Price ↑ lowest',
        sortMostExpensive: 'Price ↓ highest',
        inStockWithPrice: 'Priced & in stock',
    },
    pl: {
        sidebarAria: 'Filtry inżynieryjne',
        sidebarTitle: 'Filtry inżynieryjne',
        clearAll: 'Wyczyść wszystkie',
        headingCategory: 'Kategoria systemu',
        allCategories: 'Wszystkie kategorie',
        collapse: '− Zwiń',
        expandCategories: (n) => `+ Wszystkie kategorie (${n})`,
        headingBrand: 'Producent / Marka',
        searchBrandPlaceholder: (n) => `Szukaj wśród ${n} marek...`,
        searchBrandAria: (n) => `Szukaj wśród ${n} marek`,
        clearBrandSearchAria: 'Wyczyść wyszukiwanie marki',
        allBrands: 'Wszyscy producenci',
        noBrandsFound: (q) => `Brak producentów dla „${q}”.`,
        expandBrands: (n) => `+ Wszyscy producenci (${n})`,
        headingSubtype: 'Podtyp elementu',
        expandSubtypes: (n) => `+ Wszystkie podtypy (${n})`,
        headingSpec: 'Parametr techniczny (DN / Gwint)',
        expandSpecs: (n) => `+ Wszystkie parametry (${n})`,
        headingPrice: 'Cena i stan (€)',
        priceUnder50: 'Do 50',
        price50to200: '50–200',
        price200to1000: '200–1000',
        priceFrom1000: 'Od 1000',
        sortCheapest: 'Cena ↑ najtańsze',
        sortMostExpensive: 'Cena ↓ najdroższe',
        inStockWithPrice: 'Z ceną w magazynie',
    },
    ru: {
        sidebarAria: 'Инженерные фильтры',
        sidebarTitle: 'Инженерные фильтры',
        clearAll: 'Сбросить все',
        headingCategory: 'Категория системы',
        allCategories: 'Все категории',
        collapse: '− Свернуть',
        expandCategories: (n) => `+ Все категории (${n})`,
        headingBrand: 'Производитель / Бренд',
        searchBrandPlaceholder: (n) => `Поиск среди ${n} брендов...`,
        searchBrandAria: (n) => `Поиск среди ${n} брендов`,
        clearBrandSearchAria: 'Очистить поиск бренда',
        allBrands: 'Все производители',
        noBrandsFound: (q) => `По запросу «${q}» бренды не найдены.`,
        expandBrands: (n) => `+ Все производители (${n})`,
        headingSubtype: 'Подтип узла',
        expandSubtypes: (n) => `+ Все подтипы (${n})`,
        headingSpec: 'Тех. параметр (DN / Резьба)',
        expandSpecs: (n) => `+ Все параметры (${n})`,
        headingPrice: 'Цена и наличие (€)',
        priceUnder50: 'До 50',
        price50to200: '50–200',
        price200to1000: '200–1000',
        priceFrom1000: 'От 1000',
        sortCheapest: 'Цена ↑ дешевле',
        sortMostExpensive: 'Цена ↓ дороже',
        inStockWithPrice: 'С ценой в наличии',
    },
};

function normalizeForSearch(value: string): string {
    return value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[łŁ]/g, 'l')
        .toLowerCase()
        .trim();
}

export function filterBrandsByQuery<T extends { name: string; slug?: string }>(
    brands: T[],
    query: string,
): T[] {
    const q = normalizeForSearch(query);
    if (!q) return brands;
    return brands.filter((b) => {
        const nameNorm = normalizeForSearch(b.name);
        const slugNorm = normalizeForSearch(b.slug || '');
        return nameNorm.includes(q) || slugNorm.includes(q);
    });
}

export function isBrandItemActive(
    b: { id: string; name: string; slug?: string },
    selectedBrand?: string,
): boolean {
    if (!selectedBrand) return false;
    const sel = normalizeForSearch(selectedBrand);
    return (
        sel === normalizeForSearch(b.id) ||
        sel === normalizeForSearch(b.slug || '') ||
        sel === normalizeForSearch(b.name)
    );
}

export function isCategoryItemActive(
    cat: { id: string; name: string; slug?: string },
    selectedCategory?: string,
): boolean {
    if (!selectedCategory) return false;
    const sel = normalizeForSearch(selectedCategory);
    return (
        sel === normalizeForSearch(cat.id) ||
        sel === normalizeForSearch(cat.slug || '') ||
        sel === normalizeForSearch(cat.name)
    );
}

export function getVisibleCategoryFacetItems<
    T extends { id: string; name: string; slug?: string },
>(
    categories: T[],
    showAllCategories: boolean,
    selectedCategory?: string,
    defaultLimit = 4,
): T[] {
    if (showAllCategories || categories.length <= defaultLimit) {
        return categories;
    }
    const topSlice = categories.slice(0, defaultLimit);
    if (selectedCategory) {
        const activeInRest = categories
            .slice(defaultLimit)
            .find((cat) => isCategoryItemActive(cat, selectedCategory));
        if (activeInRest) {
            return [...topSlice, activeInRest];
        }
    }
    return topSlice;
}

export const PINNED_TOP_BRAND_SLUGS = [
    'giles-inzinerija',
    'comisa',
    'imi-pneumatex',
    'imi-heimeier',
    'danfoss',
    'haier',
];

export function getVisibleBrandFacetItems<
    T extends { id: string; name: string; slug?: string },
>(
    brands: T[],
    query: string,
    showAllBrands: boolean,
    selectedBrand?: string,
    defaultLimit = 8,
): T[] {
    const filtered = filterBrandsByQuery(brands, query);
    if (query.trim().length > 0 || showAllBrands || filtered.length <= defaultLimit) {
        return filtered;
    }
    const prioritized: T[] = [];
    for (const pinnedSlug of PINNED_TOP_BRAND_SLUGS) {
        if (prioritized.length >= defaultLimit) break;
        const match = filtered.find(
            (b) =>
                normalizeForSearch(b.slug || '') === pinnedSlug ||
                normalizeForSearch(b.name) === pinnedSlug.replace(/-/g, ' '),
        );
        if (match && !prioritized.includes(match)) {
            prioritized.push(match);
        }
    }
    for (const item of filtered) {
        if (prioritized.length >= defaultLimit) break;
        if (!prioritized.includes(item)) {
            prioritized.push(item);
        }
    }
    if (selectedBrand) {
        const activeInRest = filtered.find(
            (b) => isBrandItemActive(b, selectedBrand) && !prioritized.includes(b),
        );
        if (activeInRest) {
            return [...prioritized, activeInRest];
        }
    }
    return prioritized;
}

const DEFAULT_TOP_SUBTYPE_KEYS = [
    'voztuvai',
    'kolektoriai',
    'katilai-boileriai',
    'pletimosi-indai',
    'balansiniai',
    'pavaros',
];

export function getVisibleSubtypeFacetItems(
    subtypes: CatalogSubtypeOption[],
    showAllSubtypes: boolean,
    selectedSubtype?: string,
    defaultLimit = 6,
): CatalogSubtypeOption[] {
    const source = subtypes.length > 0 ? subtypes : CATALOG_SUBTYPE_OPTIONS;
    if (showAllSubtypes || source.length <= defaultLimit) {
        return source;
    }
    const prioritized: CatalogSubtypeOption[] = [];
    for (const key of DEFAULT_TOP_SUBTYPE_KEYS) {
        const found = source.find((s) => s.key === key);
        if (found && prioritized.length < defaultLimit) {
            prioritized.push(found);
        }
    }
    for (const item of source) {
        if (prioritized.length >= defaultLimit) break;
        if (!prioritized.some((p) => p.key === item.key)) {
            prioritized.push(item);
        }
    }
    if (selectedSubtype) {
        const activeInRest = source.find(
            (s) =>
                s.key.toLowerCase() === selectedSubtype.toLowerCase() &&
                !prioritized.some((p) => p.key === s.key),
        );
        if (activeInRest) {
            return [...prioritized, activeInRest];
        }
    }
    return prioritized;
}

export function getVisibleSpecFacetItems(
    specs: CatalogSpecOption[],
    showAllSpecs: boolean,
    selectedSpec?: string,
    defaultLimit = 8,
): CatalogSpecOption[] {
    const source = specs.length > 0 ? specs : CATALOG_SPEC_OPTIONS;
    if (showAllSpecs || source.length <= defaultLimit) {
        return source;
    }
    const topSlice = source.slice(0, defaultLimit);
    if (selectedSpec) {
        const activeInRest = source
            .slice(defaultLimit)
            .find(
                (specOpt) =>
                    specOpt.key.toLowerCase() === selectedSpec.toLowerCase() ||
                    specOpt.label.toLowerCase() === selectedSpec.toLowerCase(),
            );
        if (activeInRest) {
            return [...topSlice, activeInRest];
        }
    }
    return topSlice;
}

function formatCount(n: number): string {
    return n >= 1000 ? `${Math.floor(n / 1000)} ${String(n % 1000).padStart(3, '0')}` : String(n);
}

const FACET_SHORT_LABELS: Record<string, string> = {
    'Termostatinės galvutės ir vožtuvai': 'Termostatinės galvutės',
    'Balansiniai ir reguliavimo vožtuvai': 'Balansiniai vožtuvai',
    'Plėtimosi indai ir slėgio palaikymas': 'Plėtimosi indai',
    'Grindinis šildymas ir kolektoriai': 'Grindinis šildymas',
    'Katilinės automatika ir pavaros': 'Katilinės automatika',
    'Vandens šildytuvai ir akumuliacinės talpos': 'Vandens šildytuvai',
    'Oro atskyrikliai ir nuorintuvai': 'Oro atskyrikliai',
    'Šildymo katilai ir krosnelės': 'Šildymo katilai',
    'Radiatoriai ir konvektoriai': 'Radiatoriai',
    'Vamzdžiai ir jungiamosios detalės': 'Vamzdžiai ir jungtys',
    'Siurbliai ir pamaišymo mazgai': 'Siurbliai ir mazgai',
    'Kolektoriai (šakotuvai)': 'Kolektoriai',
    'Terminės pavaros ir valdikliai': 'Terminės pavaros',
    'Spintelės ir laikikliai': 'Spintelės ir dėžės',
    'Termostatiniai vožtuvai': 'Termostatiniai vožtuvai',
    'Apatinio pajungimo H-blokai': 'Apatiniai H-blokai',
    'Tvirtinimo ir serviso mazgai (SMU / DLV)': 'Serviso mazgai SMU/DLV',
    'Nuorintuvai ir purvo separatoriai': 'Purvo separatoriai',
    'Katilai ir vandens šildytuvai': 'Katilai ir boileriai',
};

export function formatFacetLabel(label: string, locale = 'lt'): string {
    const loc = resolveAppLocale(locale);
    const trimmed = (label || '').trim();
    const shortLt = FACET_SHORT_LABELS[trimmed] || trimmed;
    const localized =
        loc === 'lt'
            ? shortLt
            : localizeSubtypeLabel(shortLt, loc) !== shortLt
              ? localizeSubtypeLabel(shortLt, loc)
              : localizeCategoryLabel(shortLt, loc);

    if (localized.length <= 28) {
        return localized;
    }
    const words = localized.split(/\s+/);
    let acc = '';
    for (const w of words) {
        const next = acc ? `${acc} ${w}` : w;
        if (next.length > 28) break;
        acc = next;
    }
    return acc || localized.slice(0, 28);
}

export function CatalogFacetedFilters({
    locale: propLocale,
    categories,
    brands,
    subtypes = CATALOG_SUBTYPE_OPTIONS,
    specs = CATALOG_SPEC_OPTIONS,
    selectedCategory,
    selectedBrand,
    selectedSubtype,
    selectedSpec,
    selectedPrice,
    selectedSort,
    inStock,
    searchParams,
    activeFilterCount,
    hasActiveFilters,
    totalCatalogCount,
    enableDeepSubtypeSpecFilters = true,
}: CatalogFacetedFiltersProps) {
    const intlLocale = useLocale();
    const pathname = usePathname() || '';
    const urlLocaleMatch = pathname.match(/^\/(lt|en|pl|ru)(?=\/|$)/i);
    const locale = resolveAppLocale(propLocale || (urlLocaleMatch ? urlLocaleMatch[1] : intlLocale));
    const copy = FACETED_FILTERS_COPY[locale];

    const [brandQuery, setBrandQuery] = useState('');
    const [showAllCategories, setShowAllCategories] = useState(false);
    const [showAllBrands, setShowAllBrands] = useState(false);
    const [showAllSubtypes, setShowAllSubtypes] = useState(false);
    const [showAllSpecs, setShowAllSpecs] = useState(false);
    const [openSections, setOpenSections] = useState<Record<string, boolean>>({
        categories: true,
        brands: true,
        subtypes: true,
        specs: true,
        price: true,
    });

    const toggleSection = (key: string) => {
        setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    const buildUrl = (overrides: Record<string, string>) => {
        const nextParams: Record<string, string | undefined> = {
            ...searchParams,
            ...overrides,
        };
        delete nextParams.page;
        if (
            ('brand' in overrides ||
                'category' in overrides ||
                'subtype' in overrides ||
                'spec' in overrides) &&
            !('q' in overrides)
        ) {
            delete nextParams.q;
        }
        for (const k of Object.keys(nextParams)) {
            if (!nextParams[k]) delete nextParams[k];
        }
        const qs = new URLSearchParams(nextParams as Record<string, string>).toString();
        return `/${locale}/products${qs ? `?${qs}` : ''}`;
    };

    const visibleCategories = getVisibleCategoryFacetItems(
        categories,
        showAllCategories,
        selectedCategory,
        4,
    );
    const visibleBrands = getVisibleBrandFacetItems(
        brands,
        brandQuery,
        showAllBrands,
        selectedBrand,
        6,
    );
    const allSubtypes = subtypes.length > 0 ? subtypes : CATALOG_SUBTYPE_OPTIONS;
    const visibleSubtypes = getVisibleSubtypeFacetItems(
        allSubtypes,
        showAllSubtypes,
        selectedSubtype,
        6,
    );
    const allSpecs = specs.length > 0 ? specs : CATALOG_SPEC_OPTIONS;
    const visibleSpecs = getVisibleSpecFacetItems(allSpecs, showAllSpecs, selectedSpec, 8);

    const totalBrandsCount = brands.length || 28;
    const isInStockOnly = inStock === '1' || inStock === 'true';
    const currentSort = selectedSort ?? searchParams.sort;

    return (
        <aside
            data-testid="catalog-filter-sidebar"
            aria-label={copy.sidebarAria}
            className="hidden lg:block sticky top-20 max-h-[calc(100vh-5.5rem)] overflow-y-auto overscroll-contain scrollbar-thin rounded-xl border border-slate-200 bg-white p-2.5 shadow-xs"
        >
            {/* 1. Sidebar Header */}
            <div className="flex items-center justify-between gap-2 pb-1 border-b border-slate-200">
                <div className="flex items-center gap-1.5 min-w-0">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-stone-900 shrink-0" aria-hidden="true" />
                    <h2 className="text-xs font-bold text-stone-900 truncate">
                        {copy.sidebarTitle}
                    </h2>
                    {activeFilterCount > 0 && (
                        <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold bg-[var(--primary)] text-white rounded-xs tabular-nums shrink-0">
                            {activeFilterCount}
                        </span>
                    )}
                </div>
                {hasActiveFilters && (
                    <Link
                        href={`/${locale}/products`}
                        rel="nofollow"
                        className="text-xs font-semibold text-[var(--primary)] hover:underline whitespace-nowrap shrink-0 bg-transparent"
                    >
                        {copy.clearAll}
                    </Link>
                )}
            </div>

            {/* 2. Facet 1: Sistemos kategorija */}
            <div className="py-1 border-b border-slate-200">
                <button
                    type="button"
                    onClick={() => toggleSection('categories')}
                    aria-expanded={openSections.categories}
                    className="w-full flex items-center justify-between gap-2 text-xs font-bold text-stone-900 cursor-pointer pb-0.5 bg-transparent"
                >
                    <span className="truncate">{copy.headingCategory}</span>
                    <ChevronDown
                        className={`w-3.5 h-3.5 text-slate-500 shrink-0 transition-transform duration-150 ${
                            openSections.categories ? 'rotate-180' : ''
                        }`}
                        aria-hidden="true"
                    />
                </button>
                {openSections.categories && (
                    <div className="space-y-0">
                        <FacetRowLink
                            href={buildUrl({ category: '' })}
                            active={!selectedCategory}
                            label={copy.allCategories}
                            locale={locale}
                            count={totalCatalogCount}
                        />
                        {visibleCategories.map((cat) => {
                            const active = isCategoryItemActive(cat, selectedCategory);
                            const locLabel = localizeCategoryLabel(cat.name, locale);
                            return (
                                <FacetRowLink
                                    key={cat.id}
                                    href={buildUrl({ category: active ? '' : cat.name })}
                                    active={active}
                                    label={locLabel}
                                    locale={locale}
                                    count={cat.productCount}
                                />
                            );
                        })}
                        {categories.length > 4 && (
                            <button
                                type="button"
                                data-testid="category-facet-toggle"
                                onClick={() => setShowAllCategories((prev) => !prev)}
                                className="w-full text-left px-1.5 py-[1px] text-xs font-semibold text-[var(--primary)] hover:bg-slate-50 rounded-sm transition-colors cursor-pointer whitespace-nowrap truncate bg-transparent"
                            >
                                {showAllCategories
                                    ? copy.collapse
                                    : copy.expandCategories(categories.length)}
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* 3. Facet 2: Gamintojas / Prekės ženklas */}
            <div className="py-1 border-b border-slate-200">
                <button
                    type="button"
                    onClick={() => toggleSection('brands')}
                    aria-expanded={openSections.brands}
                    className="w-full flex items-center justify-between gap-2 text-xs font-bold text-stone-900 cursor-pointer pb-0.5 bg-transparent"
                >
                    <span className="truncate">{copy.headingBrand}</span>
                    <span className="inline-flex items-center gap-1 shrink-0">
                        <span className="tabular-nums text-xs text-slate-600 bg-slate-100 px-1.5 py-0 rounded">
                            {totalBrandsCount}
                        </span>
                        <ChevronDown
                            className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-150 ${
                                openSections.brands ? 'rotate-180' : ''
                            }`}
                            aria-hidden="true"
                        />
                    </span>
                </button>

                {openSections.brands && (
                    <div className="space-y-1">
                        <div className="relative">
                            <Search
                                className="w-3.5 h-3.5 text-slate-500 absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none"
                                aria-hidden="true"
                            />
                            <input
                                type="search"
                                data-testid="brand-facet-search"
                                value={brandQuery}
                                onChange={(e) => setBrandQuery(e.target.value)}
                                placeholder={copy.searchBrandPlaceholder(totalBrandsCount)}
                                aria-label={copy.searchBrandAria(totalBrandsCount)}
                                className="w-full pl-7 pr-6 py-0.5 text-xs bg-slate-50 border border-slate-300 rounded-md text-stone-900 placeholder:text-slate-600 focus:outline-none focus:bg-white focus:border-[var(--primary)] transition-colors"
                            />
                            {brandQuery && (
                                <button
                                    type="button"
                                    onClick={() => setBrandQuery('')}
                                    aria-label={copy.clearBrandSearchAria}
                                    className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-stone-900 cursor-pointer bg-transparent"
                                >
                                    <X className="w-3.5 h-3.5" aria-hidden="true" />
                                </button>
                            )}
                        </div>

                        <div className="space-y-0">
                            {!brandQuery.trim() && (showAllBrands || Boolean(selectedBrand)) && (
                                <FacetRowLink
                                    href={buildUrl({ brand: '' })}
                                    active={!selectedBrand}
                                    label={copy.allBrands}
                                    locale={locale}
                                    count={totalCatalogCount}
                                />
                            )}

                            {visibleBrands.length > 0 ? (
                                visibleBrands.map((b) => {
                                    const active = isBrandItemActive(b, selectedBrand);
                                    const count = b.count ?? b.productCount;
                                    return (
                                        <FacetRowLink
                                            key={b.id || b.slug || b.name}
                                            href={buildUrl({
                                                brand: active ? '' : b.slug || b.name,
                                            })}
                                            active={active}
                                            label={b.name}
                                            locale={locale}
                                            count={count}
                                        />
                                    );
                                })
                            ) : (
                                <p className="text-xs text-slate-600 py-1 px-1">
                                    {copy.noBrandsFound(brandQuery)}
                                </p>
                            )}
                        </div>

                        {!brandQuery.trim() && brands.length > 4 && (
                            <button
                                type="button"
                                data-testid="brand-facet-toggle"
                                onClick={() => setShowAllBrands((prev) => !prev)}
                                className="w-full text-left px-1.5 py-[1px] text-xs font-semibold text-[var(--primary)] hover:bg-slate-50 rounded-sm transition-colors cursor-pointer whitespace-nowrap truncate bg-transparent"
                            >
                                {showAllBrands
                                    ? copy.collapse
                                    : copy.expandBrands(totalBrandsCount)}
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* 4. Facet 3: Mazgo potipis (Always Visible & Open by Default) */}
            {enableDeepSubtypeSpecFilters && (
                <div className="py-1 border-b border-slate-200">
                    <button
                        type="button"
                        onClick={() => toggleSection('subtypes')}
                        aria-expanded={openSections.subtypes}
                        className="w-full flex items-center justify-between gap-2 text-xs font-bold text-stone-900 cursor-pointer pb-0.5 bg-transparent"
                    >
                        <span className="truncate">{copy.headingSubtype}</span>
                        <ChevronDown
                            className={`w-3.5 h-3.5 text-slate-500 shrink-0 transition-transform duration-150 ${
                                openSections.subtypes ? 'rotate-180' : ''
                            }`}
                            aria-hidden="true"
                        />
                    </button>
                    {openSections.subtypes && (
                        <div className="space-y-0">
                            {visibleSubtypes.map((sub) => {
                                const active =
                                    Boolean(selectedSubtype) &&
                                    selectedSubtype?.toLowerCase() === sub.key.toLowerCase();
                                const locLabel = localizeSubtypeLabel(sub.label, locale);
                                return (
                                    <FacetRowLink
                                        key={sub.key}
                                        href={buildUrl({ subtype: active ? '' : sub.key })}
                                        active={active}
                                        label={locLabel}
                                        locale={locale}
                                    />
                                );
                            })}
                            {allSubtypes.length > 6 && (
                                <button
                                    type="button"
                                    data-testid="subtype-facet-toggle"
                                    onClick={() => setShowAllSubtypes((prev) => !prev)}
                                    className="w-full text-left px-1.5 py-[1px] text-xs font-semibold text-[var(--primary)] hover:bg-slate-50 rounded-sm transition-colors cursor-pointer whitespace-nowrap truncate bg-transparent"
                                >
                                    {showAllSubtypes
                                        ? copy.collapse
                                        : copy.expandSubtypes(allSubtypes.length)}
                                </button>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* 5. Facet 4: Techninis parametras (DN / Sriegis) */}
            {enableDeepSubtypeSpecFilters && (
                <div className="py-1 border-b border-slate-200">
                    <button
                        type="button"
                        onClick={() => toggleSection('specs')}
                        aria-expanded={openSections.specs}
                        className="w-full flex items-center justify-between gap-2 text-xs font-bold text-stone-900 cursor-pointer pb-0.5 bg-transparent"
                    >
                        <span className="truncate">{copy.headingSpec}</span>
                        <ChevronDown
                            className={`w-3.5 h-3.5 text-slate-500 shrink-0 transition-transform duration-150 ${
                                openSections.specs ? 'rotate-180' : ''
                            }`}
                            aria-hidden="true"
                        />
                    </button>
                    {openSections.specs && (
                        <div className="space-y-1">
                            <div className="grid grid-cols-2 gap-1">
                                {visibleSpecs.map((specOpt) => {
                                    const active =
                                        Boolean(selectedSpec) &&
                                        (selectedSpec?.toLowerCase() === specOpt.key.toLowerCase() ||
                                            selectedSpec?.toLowerCase() === specOpt.label.toLowerCase());
                                    return (
                                        <Link
                                            key={specOpt.key}
                                            href={buildUrl({ spec: active ? '' : specOpt.key })}
                                            rel="nofollow"
                                            title={specOpt.label}
                                            className={`flex items-center justify-between gap-1 px-2 py-[2px] rounded-sm text-xs leading-tight transition-colors whitespace-nowrap min-w-0 bg-transparent ${
                                                active
                                                    ? 'border border-[var(--primary)] text-stone-900 font-bold'
                                                    : 'border border-slate-200 text-stone-800 hover:border-stone-900'
                                            }`}
                                        >
                                            <span className="truncate">{specOpt.label}</span>
                                            {active && (
                                                <Check
                                                    className="w-3 h-3 text-[var(--primary)] shrink-0"
                                                    aria-hidden="true"
                                                />
                                            )}
                                        </Link>
                                    );
                                })}
                            </div>
                            {allSpecs.length > 8 && (
                                <button
                                    type="button"
                                    data-testid="spec-facet-toggle"
                                    onClick={() => setShowAllSpecs((prev) => !prev)}
                                    className="w-full text-left px-1.5 py-[1px] text-xs font-semibold text-[var(--primary)] hover:bg-slate-50 rounded-sm transition-colors cursor-pointer whitespace-nowrap truncate bg-transparent"
                                >
                                    {showAllSpecs
                                        ? copy.collapse
                                        : copy.expandSpecs(allSpecs.length)}
                                </button>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* 6. Facet 5: Kaina ir likutis */}
            <div className="pt-1">
                <button
                    type="button"
                    onClick={() => toggleSection('price')}
                    aria-expanded={openSections.price}
                    className="w-full flex items-center justify-between gap-2 text-xs font-bold text-stone-900 cursor-pointer pb-0.5 bg-transparent"
                >
                    <span className="truncate">{copy.headingPrice}</span>
                    <ChevronDown
                        className={`w-3.5 h-3.5 text-slate-500 shrink-0 transition-transform duration-150 ${
                            openSections.price ? 'rotate-180' : ''
                        }`}
                        aria-hidden="true"
                    />
                </button>
                {openSections.price && (
                    <div className="grid grid-cols-2 gap-1">
                        {[
                            { key: 'under-50', label: copy.priceUnder50 },
                            { key: '50-200', label: copy.price50to200 },
                            { key: '200-1000', label: copy.price200to1000 },
                            { key: '1000-plus', label: copy.priceFrom1000 },
                        ].map((pOpt) => {
                            const active = selectedPrice === pOpt.key;
                            return (
                                <Link
                                    key={pOpt.key}
                                    href={buildUrl({
                                        price: active ? '' : pOpt.key,
                                        minPrice: '',
                                        maxPrice: '',
                                    })}
                                    rel="nofollow"
                                    title={pOpt.label}
                                    className={`flex items-center justify-between gap-1 px-2 py-[2px] rounded-sm text-xs leading-tight transition-colors whitespace-nowrap min-w-0 bg-transparent ${
                                        active
                                            ? 'border border-[var(--primary)] text-stone-900 font-bold'
                                            : 'border border-slate-200 text-stone-800 hover:border-stone-900'
                                    }`}
                                >
                                    <span className="truncate">{pOpt.label}</span>
                                    {active && (
                                        <Check
                                            className="w-3 h-3 text-[var(--primary)] shrink-0"
                                            aria-hidden="true"
                                        />
                                    )}
                                </Link>
                            );
                        })}
                        <Link
                            href={buildUrl({
                                sort: currentSort === 'price-asc' ? '' : 'price-asc',
                            })}
                            rel="nofollow"
                            title={copy.sortCheapest}
                            className={`flex items-center justify-between gap-1 px-1.5 py-[2px] rounded-sm text-xs leading-tight transition-colors whitespace-nowrap min-w-0 bg-transparent ${
                                currentSort === 'price-asc'
                                    ? 'border border-[var(--primary)] text-stone-900 font-bold'
                                    : 'border border-slate-200 text-stone-800 hover:border-stone-900'
                            }`}
                        >
                            <span className="truncate">{copy.sortCheapest}</span>
                        </Link>
                        <Link
                            href={buildUrl({
                                sort: currentSort === 'price-desc' ? '' : 'price-desc',
                            })}
                            rel="nofollow"
                            title={copy.sortMostExpensive}
                            className={`flex items-center justify-between gap-1 px-1.5 py-[2px] rounded-sm text-xs leading-tight transition-colors whitespace-nowrap min-w-0 bg-transparent ${
                                currentSort === 'price-desc'
                                    ? 'border border-[var(--primary)] text-stone-900 font-bold'
                                    : 'border border-slate-200 text-stone-800 hover:border-stone-900'
                            }`}
                        >
                            <span className="truncate">{copy.sortMostExpensive}</span>
                        </Link>
                        <Link
                            href={buildUrl({ inStock: isInStockOnly ? '' : '1' })}
                            rel="nofollow"
                            title={copy.inStockWithPrice}
                            className={`col-span-2 flex items-center justify-between gap-1 px-2 py-[2px] rounded-sm text-xs leading-tight transition-colors whitespace-nowrap min-w-0 bg-transparent ${
                                isInStockOnly
                                    ? 'border border-[var(--primary)] text-stone-900 font-bold'
                                    : 'border border-slate-200 text-stone-800 hover:border-stone-900'
                            }`}
                        >
                            <span className="truncate">{copy.inStockWithPrice}</span>
                            {isInStockOnly && (
                                <Check
                                    className="w-3 h-3 text-[var(--primary)] shrink-0"
                                    aria-hidden="true"
                                />
                            )}
                        </Link>
                    </div>
                )}
            </div>
        </aside>
    );
}

function FacetRowLink({
    href,
    active,
    label,
    locale,
    count,
}: {
    href: string;
    active: boolean;
    label: string;
    locale?: string;
    count?: number;
}) {
    const displayLabel = formatFacetLabel(label, locale);
    return (
        <Link
            href={href}
            rel="nofollow"
            title={label}
            aria-label={label}
            className={`group flex items-center justify-between gap-1.5 px-1.5 py-[1px] rounded-sm text-xs transition-colors duration-150 min-w-0 bg-transparent ${
                active
                    ? 'text-stone-900 font-bold'
                    : 'text-stone-800 hover:bg-slate-100 hover:text-stone-900'
            }`}
        >
            <span className="flex items-center gap-1.5 min-w-0 flex-1">
                <span
                    aria-hidden="true"
                    className={`w-3.5 h-3.5 rounded-xs border flex items-center justify-center shrink-0 transition-colors ${
                        active
                            ? 'border-[var(--primary)] bg-[var(--primary)] text-white'
                            : 'border-slate-300 bg-white group-hover:border-stone-700'
                    }`}
                >
                    {active && <Check className="w-2.5 h-2.5 stroke-[2.5]" />}
                </span>
                <span className="min-w-0 flex-1 break-words leading-snug pr-2 mr-1.5">
                    {displayLabel}
                </span>
            </span>
            {typeof count === 'number' && (
                <span
                    className={`tabular-nums text-xs px-1.5 py-0 rounded shrink-0 ${
                        active
                            ? 'bg-red-50 text-stone-900 font-bold border border-red-200'
                            : 'text-slate-600 bg-slate-100'
                    }`}
                >
                    {formatCount(count)}
                </span>
            )}
        </Link>
    );
}
