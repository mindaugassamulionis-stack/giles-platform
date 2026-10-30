'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { SlidersHorizontal, X, ChevronDown, Check, Search } from 'lucide-react';
import { useLocale } from 'next-intl';
import { usePathname } from 'next/navigation';
import { assetUrl } from '../lib/api';
import { resolveBrandLogo } from '../lib/product-visuals';
import { CATALOG_SUBTYPE_OPTIONS, CATALOG_SPEC_OPTIONS } from '../lib/catalog-filter-options';
import { useStorefrontConfig } from './storefront-config-provider';
import { filterBrandsByQuery } from './catalog-faceted-filters';
import { resolveAppLocale } from '../i18n/storefront-ui-copy';
import type { AppLocale } from '../i18n/routing';
import { localizeCategoryLabel, localizeSubtypeLabel } from '../lib/product-i18n';

interface FilterDrawerProps {
    locale?: string;
    categories: Array<{ id: string; name: string; slug?: string; productCount?: number }>;
    brands: Array<{ id: string; name: string; slug?: string; count?: number; productCount?: number }>;
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
    totalFound?: number;
    enableDeepSubtypeSpecFilters?: boolean;
}

const FILTER_DRAWER_COPY: Record<
    AppLocale,
    {
        triggerLabel: (brandsCount: number) => string;
        dialogAria: string;
        headerTitle: string;
        headerSubtitle: (brandsCount: number, resultsCount: number) => string;
        closeAria: string;
        activeFiltersTitle: (count: number) => string;
        clearAll: string;
        chipBrandPrefix: string;
        chipCategoryPrefix: string;
        chipSubtypePrefix: string;
        chipSpecPrefix: string;
        headingCategory: string;
        allCategories: string;
        headingBrand: (count: number) => string;
        searchBrandPlaceholder: (count: number) => string;
        searchBrandAria: (count: number) => string;
        clearBrandSearchAria: string;
        allBrands: string;
        headingSubtype: string;
        allSubtypes: string;
        headingSpec: string;
        headingPrice: string;
        allPrices: string;
        priceUnder50: string;
        price50to200: string;
        price200to1000: string;
        priceOver1000: string;
        minPricePlaceholder: string;
        minPriceAria: string;
        maxPricePlaceholder: string;
        maxPriceAria: string;
        inStockOnly: string;
        applyPriceRange: string;
        sortHeading: string;
        sortDefault: string;
        sortCode: string;
        sortPriceUp: string;
        sortPriceDown: string;
        clearFiltersWithCount: (count: number) => string;
        showResultsWithCount: (count: number) => string;
    }
> = {
    lt: {
        triggerLabel: (n) => `Filtrai ir gamintojai (${n})`,
        dialogAria: 'Filtrai ir gamintojai',
        headerTitle: 'Inžineriniai filtrai',
        headerSubtitle: (b, r) => `${b} gamintojai · ${r} poz.`,
        closeAria: 'Uždaryti filtrus',
        activeFiltersTitle: (n) => `Aktyvūs filtrai (${n})`,
        clearAll: 'Išvalyti visus',
        chipBrandPrefix: 'Gamintojas',
        chipCategoryPrefix: 'Kategorija',
        chipSubtypePrefix: 'Potipis',
        chipSpecPrefix: 'Parametras',
        headingCategory: 'Sistemos kategorija',
        allCategories: 'Visos kategorijos',
        headingBrand: (n) => `Gamintojas (Prekės ženklas) (${n})`,
        searchBrandPlaceholder: (n) => `Ieškoti iš ${n} gamintojų...`,
        searchBrandAria: (n) => `Ieškoti iš ${n} gamintojų`,
        clearBrandSearchAria: 'Išvalyti gamintojo paiešką',
        allBrands: 'Visi gamintojai',
        headingSubtype: 'Mazgo potipis',
        allSubtypes: 'Visi mazgo potipiai',
        headingSpec: 'Techninis parametras (DN / Sriegis)',
        headingPrice: 'Kaina ir likutis (€)',
        allPrices: 'Visos kainos',
        priceUnder50: 'Iki 50 €',
        price50to200: '50–200 €',
        price200to1000: '200–1000 €',
        priceOver1000: 'Nuo 1000 €',
        minPricePlaceholder: 'Nuo €',
        minPriceAria: 'Kaina nuo €',
        maxPricePlaceholder: 'Iki €',
        maxPriceAria: 'Kaina iki €',
        inStockOnly: 'Tik prekyboje esančios pozicijos',
        applyPriceRange: 'Taikyti kainos intervalą',
        sortHeading: 'Rikiavimas',
        sortDefault: 'Populiariausios viršuje',
        sortCode: 'Pagal kodą (A–Z)',
        sortPriceUp: 'Kaina: nuo mažiausios ↑',
        sortPriceDown: 'Kaina: nuo didžiausios ↓',
        clearFiltersWithCount: (n) => `Išvalyti filtrus (${n})`,
        showResultsWithCount: (n) => `Rodyti rezultatus (${n} poz.)`,
    },
    en: {
        triggerLabel: (n) => `Filters & brands (${n})`,
        dialogAria: 'Filters and manufacturers',
        headerTitle: 'Engineering filters',
        headerSubtitle: (b, r) => `${b} brands · ${r} items`,
        closeAria: 'Close filters',
        activeFiltersTitle: (n) => `Active filters (${n})`,
        clearAll: 'Clear all',
        chipBrandPrefix: 'Brand',
        chipCategoryPrefix: 'Category',
        chipSubtypePrefix: 'Subtype',
        chipSpecPrefix: 'Parameter',
        headingCategory: 'System category',
        allCategories: 'All categories',
        headingBrand: (n) => `Manufacturer / Brand (${n})`,
        searchBrandPlaceholder: (n) => `Search ${n} manufacturers...`,
        searchBrandAria: (n) => `Search ${n} manufacturers`,
        clearBrandSearchAria: 'Clear manufacturer search',
        allBrands: 'All manufacturers',
        headingSubtype: 'Component subtype',
        allSubtypes: 'All component subtypes',
        headingSpec: 'Technical spec (DN / Thread)',
        headingPrice: 'Price & stock (€)',
        allPrices: 'All prices',
        priceUnder50: 'Up to 50 €',
        price50to200: '50–200 €',
        price200to1000: '200–1000 €',
        priceOver1000: 'From 1000 €',
        minPricePlaceholder: 'Min €',
        minPriceAria: 'Minimum price €',
        maxPricePlaceholder: 'Max €',
        maxPriceAria: 'Maximum price €',
        inStockOnly: 'In-stock items only',
        applyPriceRange: 'Apply price range',
        sortHeading: 'Sort order',
        sortDefault: 'Most popular first',
        sortCode: 'By SKU code (A–Z)',
        sortPriceUp: 'Price: low to high ↑',
        sortPriceDown: 'Price: high to low ↓',
        clearFiltersWithCount: (n) => `Clear filters (${n})`,
        showResultsWithCount: (n) => `Show results (${n} items)`,
    },
    pl: {
        triggerLabel: (n) => `Filtry i marki (${n})`,
        dialogAria: 'Filtry i producenci',
        headerTitle: 'Filtry inżynieryjne',
        headerSubtitle: (b, r) => `${b} marek · ${r} poz.`,
        closeAria: 'Zamknij filtry',
        activeFiltersTitle: (n) => `Aktywne filtry (${n})`,
        clearAll: 'Wyczyść wszystkie',
        chipBrandPrefix: 'Producent',
        chipCategoryPrefix: 'Kategoria',
        chipSubtypePrefix: 'Podtyp',
        chipSpecPrefix: 'Parametr',
        headingCategory: 'Kategoria systemu',
        allCategories: 'Wszystkie kategorie',
        headingBrand: (n) => `Producent / Marka (${n})`,
        searchBrandPlaceholder: (n) => `Szukaj wśród ${n} marek...`,
        searchBrandAria: (n) => `Szukaj wśród ${n} marek`,
        clearBrandSearchAria: 'Wyczyść wyszukiwanie marki',
        allBrands: 'Wszyscy producenci',
        headingSubtype: 'Podtyp elementu',
        allSubtypes: 'Wszystkie podtypy elementów',
        headingSpec: 'Parametr techniczny (DN / Gwint)',
        headingPrice: 'Cena i stan (€)',
        allPrices: 'Wszystkie ceny',
        priceUnder50: 'Do 50 €',
        price50to200: '50–200 €',
        price200to1000: '200–1000 €',
        priceOver1000: 'Od 1000 €',
        minPricePlaceholder: 'Od €',
        minPriceAria: 'Cena od €',
        maxPricePlaceholder: 'Do €',
        maxPriceAria: 'Cena do €',
        inStockOnly: 'Tylko pozycje dostępne w magazynie',
        applyPriceRange: 'Zastosuj zakres cen',
        sortHeading: 'Sortowanie',
        sortDefault: 'Najpopularniejsze',
        sortCode: 'Według kodu SKU (A–Z)',
        sortPriceUp: 'Cena: od najniższej ↑',
        sortPriceDown: 'Cena: od najwyższej ↓',
        clearFiltersWithCount: (n) => `Wyczyść filtry (${n})`,
        showResultsWithCount: (n) => `Pokaż wyniki (${n} poz.)`,
    },
    ru: {
        triggerLabel: (n) => `Фильтры и бренды (${n})`,
        dialogAria: 'Фильтры и производители',
        headerTitle: 'Инженерные фильтры',
        headerSubtitle: (b, r) => `${b} брендов · ${r} поз.`,
        closeAria: 'Закрыть фильтры',
        activeFiltersTitle: (n) => `Активные фильтры (${n})`,
        clearAll: 'Сбросить все',
        chipBrandPrefix: 'Бренд',
        chipCategoryPrefix: 'Категория',
        chipSubtypePrefix: 'Подтип',
        chipSpecPrefix: 'Параметр',
        headingCategory: 'Категория системы',
        allCategories: 'Все категории',
        headingBrand: (n) => `Производитель / Бренд (${n})`,
        searchBrandPlaceholder: (n) => `Поиск среди ${n} брендов...`,
        searchBrandAria: (n) => `Поиск среди ${n} брендов`,
        clearBrandSearchAria: 'Очистить поиск бренда',
        allBrands: 'Все производители',
        headingSubtype: 'Подтип узла',
        allSubtypes: 'Все подтипы узлов',
        headingSpec: 'Тех. параметр (DN / Резьба)',
        headingPrice: 'Цена и наличие (€)',
        allPrices: 'Все цены',
        priceUnder50: 'До 50 €',
        price50to200: '50–200 €',
        price200to1000: '200–1000 €',
        priceOver1000: 'От 1000 €',
        minPricePlaceholder: 'От €',
        minPriceAria: 'Цена от €',
        maxPricePlaceholder: 'До €',
        maxPriceAria: 'Цена до €',
        inStockOnly: 'Только позиции в наличии на складе',
        applyPriceRange: 'Применить диапазон цен',
        sortHeading: 'Сортировка',
        sortDefault: 'Популярные сверху',
        sortCode: 'По артикулу SKU (A–Z)',
        sortPriceUp: 'Цена: по возрастанию ↑',
        sortPriceDown: 'Цена: по убыванию ↓',
        clearFiltersWithCount: (n) => `Сбросить фильтры (${n})`,
        showResultsWithCount: (n) => `Показать результаты (${n} поз.)`,
    },
};

export function FilterDrawer({
    locale: propLocale,
    categories,
    brands,
    selectedCategory,
    selectedBrand,
    selectedSubtype,
    selectedSpec,
    selectedPrice,
    selectedSort,
    minPrice,
    maxPrice,
    inStock,
    searchParams,
    activeFilterCount,
    totalFound,
    enableDeepSubtypeSpecFilters,
}: FilterDrawerProps) {
    const intlLocale = useLocale();
    const pathname = usePathname() || '';
    const urlLocaleMatch = pathname.match(/^\/(lt|en|pl|ru)(?=\/|$)/i);
    const locale = resolveAppLocale(propLocale || (urlLocaleMatch ? urlLocaleMatch[1] : intlLocale));
    const copy = FILTER_DRAWER_COPY[locale];

    const { features } = useStorefrontConfig();
    const showDeepFilters = enableDeepSubtypeSpecFilters ?? features.deepSubtypeSpecFilters;
    const [isOpen, setIsOpen] = useState(false);
    const [brandQuery, setBrandQuery] = useState('');
    const [expandedSection, setExpandedSection] = useState<string | null>('brands');

    const toggleSection = (section: string) => {
        setExpandedSection(expandedSection === section ? null : section);
    };

    const buildUrl = (params: Record<string, string>) => {
        const newParams: Record<string, string | undefined> = { ...searchParams, ...params };
        delete newParams.page;
        if (
            ('brand' in params ||
                'category' in params ||
                'subtype' in params ||
                'spec' in params) &&
            !('q' in params)
        ) {
            delete newParams.q;
        }
        Object.keys(newParams).forEach((key) => {
            if (!newParams[key]) delete newParams[key];
        });
        const searchString = new URLSearchParams(newParams as Record<string, string>).toString();
        return `/${locale}/products${searchString ? `?${searchString}` : ''}`;
    };

    const isCategoryActive = (cat: { id: string; name: string; slug?: string }) => {
        if (!selectedCategory) return false;
        const sel = selectedCategory.trim().toLowerCase();
        return (
            sel === cat.id.toLowerCase() ||
            sel === (cat.slug ?? '').trim().toLowerCase() ||
            sel === cat.name.trim().toLowerCase()
        );
    };

    const isBrandActive = (b: { id: string; name: string; slug?: string }) => {
        if (!selectedBrand) return false;
        const sel = selectedBrand.trim().toLowerCase();
        return (
            sel === b.id.toLowerCase() ||
            sel === (b.slug ?? '').trim().toLowerCase() ||
            sel === b.name.trim().toLowerCase()
        );
    };

    const totalProductsCount =
        categories.reduce((sum, c) => sum + (c.productCount ?? 0), 0) || 6337;
    const displayResultsCount = typeof totalFound === 'number' ? totalFound : totalProductsCount;
    const totalBrandsCount = brands.length || 28;
    const filteredMobileBrands = filterBrandsByQuery(brands, brandQuery);
    const formAction = assetUrl(`/${locale}/products`);

    return (
        <>
            {/* Mobile Filter Button */}
            <button
                type="button"
                data-testid="mobile-filter-drawer-trigger"
                onClick={() => setIsOpen(true)}
                className="lg:hidden inline-flex items-center gap-2 px-3.5 py-2 min-h-[40px] bg-white rounded-sm border border-stone-300 shadow-2xs hover:border-stone-900 transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer"
            >
                <SlidersHorizontal className="w-4 h-4 text-stone-900 shrink-0" aria-hidden="true" />
                <span className="font-semibold text-xs sm:text-sm text-stone-900">
                    {copy.triggerLabel(totalBrandsCount)}
                </span>
                {activeFilterCount > 0 && (
                    <span className="ml-0.5 px-1.5 py-0.5 bg-[var(--primary)] text-white text-xs font-bold rounded-xs tabular-nums">
                        {activeFilterCount}
                    </span>
                )}
            </button>

            {/* Slide-Over Mobile Filter Drawer */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.15, ease: 'easeOut' }}
                            onClick={() => setIsOpen(false)}
                            className="lg:hidden fixed inset-0 bg-black/50 z-50"
                        />

                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ duration: 0.15, ease: 'easeOut' }}
                            role="dialog"
                            aria-modal="true"
                            aria-label={copy.dialogAria}
                            className="lg:hidden fixed right-0 top-0 bottom-0 w-[88%] max-w-sm bg-white z-50 shadow-2xl flex flex-col"
                        >
                            <div className="flex items-center justify-between p-4 border-b border-stone-200">
                                <div>
                                    <h2 className="text-base font-bold text-stone-900">
                                        {copy.headerTitle}
                                    </h2>
                                    <p className="text-xs text-stone-600">
                                        {copy.headerSubtitle(totalBrandsCount, displayResultsCount)}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    aria-label={copy.closeAria}
                                    onClick={() => setIsOpen(false)}
                                    className="p-2 hover:bg-stone-100 rounded-sm transition-colors duration-150 cursor-pointer"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                {/* 1. Aktyvūs filtrai */}
                                {activeFilterCount > 0 && (
                                    <div className="rounded-md border border-slate-200 bg-slate-50 p-3 space-y-2">
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="text-xs font-bold text-stone-900">
                                                {copy.activeFiltersTitle(activeFilterCount)}
                                            </span>
                                            <Link
                                                href={`/${locale}/products`}
                                                rel="nofollow"
                                                onClick={() => setIsOpen(false)}
                                                className="text-xs font-semibold text-[var(--primary)] hover:underline"
                                            >
                                                {copy.clearAll}
                                            </Link>
                                        </div>
                                        <div className="flex flex-wrap gap-1.5">
                                            {selectedBrand && (
                                                <Link
                                                    href={buildUrl({ brand: '' })}
                                                    rel="nofollow"
                                                    onClick={() => setIsOpen(false)}
                                                    className="inline-flex items-center gap-1 rounded-xs border border-stone-300 bg-white px-2 py-1 text-xs font-medium text-stone-900"
                                                >
                                                    <span>
                                                        {copy.chipBrandPrefix}: {selectedBrand}
                                                    </span>
                                                    <X className="w-3 h-3 text-stone-500" aria-hidden="true" />
                                                </Link>
                                            )}
                                            {selectedCategory && (
                                                <Link
                                                    href={buildUrl({ category: '' })}
                                                    rel="nofollow"
                                                    onClick={() => setIsOpen(false)}
                                                    className="inline-flex items-center gap-1 rounded-xs border border-stone-300 bg-white px-2 py-1 text-xs font-medium text-stone-900"
                                                >
                                                    <span>
                                                        {copy.chipCategoryPrefix}:{' '}
                                                        {localizeCategoryLabel(selectedCategory, locale)}
                                                    </span>
                                                    <X className="w-3 h-3 text-stone-500" aria-hidden="true" />
                                                </Link>
                                            )}
                                            {selectedSubtype && (
                                                <Link
                                                    href={buildUrl({ subtype: '' })}
                                                    rel="nofollow"
                                                    onClick={() => setIsOpen(false)}
                                                    className="inline-flex items-center gap-1 rounded-xs border border-stone-300 bg-white px-2 py-1 text-xs font-medium text-stone-900"
                                                >
                                                    <span>
                                                        {copy.chipSubtypePrefix}:{' '}
                                                        {localizeSubtypeLabel(selectedSubtype, locale)}
                                                    </span>
                                                    <X className="w-3 h-3 text-stone-500" aria-hidden="true" />
                                                </Link>
                                            )}
                                            {selectedSpec && (
                                                <Link
                                                    href={buildUrl({ spec: '' })}
                                                    rel="nofollow"
                                                    onClick={() => setIsOpen(false)}
                                                    className="inline-flex items-center gap-1 rounded-xs border border-stone-300 bg-white px-2 py-1 text-xs font-medium text-stone-900"
                                                >
                                                    <span>
                                                        {copy.chipSpecPrefix}: {selectedSpec}
                                                    </span>
                                                    <X className="w-3 h-3 text-stone-500" aria-hidden="true" />
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* 2. Sistemos kategorija */}
                                <MobileFilterSection
                                    title={copy.headingCategory}
                                    isOpen={expandedSection === 'categories'}
                                    onToggle={() => toggleSection('categories')}
                                >
                                    <FilterLink
                                        href={buildUrl({ category: '' })}
                                        active={!selectedCategory}
                                        onClick={() => setIsOpen(false)}
                                    >
                                        <span>{copy.allCategories}</span>
                                        {totalProductsCount > 0 && (
                                            <span className="text-xs opacity-75 tabular-nums">
                                                ({totalProductsCount})
                                            </span>
                                        )}
                                    </FilterLink>
                                    {categories.map((cat) => {
                                        const active = isCategoryActive(cat);
                                        return (
                                            <FilterLink
                                                key={cat.id}
                                                href={buildUrl({ category: active ? '' : cat.name })}
                                                active={active}
                                                onClick={() => setIsOpen(false)}
                                            >
                                                <span className="leading-snug pr-2">
                                                    {localizeCategoryLabel(cat.name, locale)}
                                                </span>
                                                {typeof cat.productCount === 'number' && (
                                                    <span
                                                        className={`text-xs shrink-0 tabular-nums ${
                                                            active ? 'text-stone-900 font-bold' : 'text-stone-500'
                                                        }`}
                                                    >
                                                        {cat.productCount}
                                                    </span>
                                                )}
                                            </FilterLink>
                                        );
                                    })}
                                </MobileFilterSection>

                                {/* 3. Gamintojas (Prekės ženklas) (28) with Live Instant Brand Search */}
                                <MobileFilterSection
                                    title={copy.headingBrand(totalBrandsCount)}
                                    isOpen={expandedSection === 'brands'}
                                    onToggle={() => toggleSection('brands')}
                                >
                                    <div className="relative mb-2">
                                        <Search
                                            className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
                                            aria-hidden="true"
                                        />
                                        <input
                                            type="search"
                                            data-testid="mobile-brand-facet-search"
                                            value={brandQuery}
                                            onChange={(e) => setBrandQuery(e.target.value)}
                                            placeholder={copy.searchBrandPlaceholder(totalBrandsCount)}
                                            aria-label={copy.searchBrandAria(totalBrandsCount)}
                                            className="w-full pl-8 pr-7 py-2 text-xs bg-slate-50 border border-slate-300 rounded-md text-stone-900 placeholder:text-slate-600 focus:outline-none focus:bg-white focus:border-[var(--primary)]"
                                        />
                                        {brandQuery && (
                                            <button
                                                type="button"
                                                onClick={() => setBrandQuery('')}
                                                aria-label={copy.clearBrandSearchAria}
                                                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-stone-900"
                                            >
                                                <X className="w-3.5 h-3.5" aria-hidden="true" />
                                            </button>
                                        )}
                                    </div>

                                    {!brandQuery.trim() && (
                                        <FilterLink
                                            href={buildUrl({ brand: '' })}
                                            active={!selectedBrand}
                                            onClick={() => setIsOpen(false)}
                                        >
                                            <span>{copy.allBrands}</span>
                                            {totalProductsCount > 0 && (
                                                <span className="text-xs opacity-75 tabular-nums">
                                                    ({totalProductsCount})
                                                </span>
                                            )}
                                        </FilterLink>
                                    )}

                                    {filteredMobileBrands.map((b) => {
                                        const active = isBrandActive(b);
                                        const brandInfo = resolveBrandLogo(b.name);
                                        const count = b.count ?? b.productCount;
                                        return (
                                            <FilterLink
                                                key={b.id || b.name}
                                                href={buildUrl({ brand: active ? '' : b.slug || b.name })}
                                                active={active}
                                                onClick={() => setIsOpen(false)}
                                            >
                                                <span className="flex items-center gap-2 min-w-0">
                                                    <span
                                                        aria-hidden="true"
                                                        className="inline-flex h-5 w-11 shrink-0 items-center justify-center rounded-xs bg-white px-1 border border-stone-200"
                                                    >
                                                        <img
                                                            src={assetUrl(brandInfo.logoPath)}
                                                            alt=""
                                                            aria-hidden="true"
                                                            className="h-3.5 w-auto object-contain"
                                                        />
                                                    </span>
                                                    <span className="truncate">{b.name}</span>
                                                </span>
                                                {typeof count === 'number' && (
                                                    <span
                                                        className={`text-xs tabular-nums ${
                                                            active ? 'text-stone-900 font-bold' : 'text-stone-500'
                                                        }`}
                                                    >
                                                        {count}
                                                    </span>
                                                )}
                                            </FilterLink>
                                        );
                                    })}
                                </MobileFilterSection>

                                {/* 4. Mazgo potipis */}
                                {showDeepFilters && (
                                    <MobileFilterSection
                                        title={copy.headingSubtype}
                                        isOpen={expandedSection === 'subtypes'}
                                        onToggle={() => toggleSection('subtypes')}
                                    >
                                        <FilterLink
                                            href={buildUrl({ subtype: '' })}
                                            active={!selectedSubtype}
                                            onClick={() => setIsOpen(false)}
                                        >
                                            <span>{copy.allSubtypes}</span>
                                        </FilterLink>
                                        {CATALOG_SUBTYPE_OPTIONS.map((sub) => {
                                            const active =
                                                selectedSubtype?.toLowerCase() === sub.key.toLowerCase();
                                            return (
                                                <FilterLink
                                                    key={sub.key}
                                                    href={buildUrl({ subtype: active ? '' : sub.key })}
                                                    active={active}
                                                    onClick={() => setIsOpen(false)}
                                                >
                                                    <span className="leading-snug pr-2">
                                                        {localizeSubtypeLabel(sub.label, locale)}
                                                    </span>
                                                </FilterLink>
                                            );
                                        })}
                                    </MobileFilterSection>
                                )}

                                {/* 5. Techninis parametras (DN / Sriegis) */}
                                {showDeepFilters && (
                                    <MobileFilterSection
                                        title={copy.headingSpec}
                                        isOpen={expandedSection === 'specs'}
                                        onToggle={() => toggleSection('specs')}
                                    >
                                        <div className="grid grid-cols-2 gap-1.5 pt-1">
                                            {CATALOG_SPEC_OPTIONS.map((spOpt) => {
                                                const active =
                                                    selectedSpec?.toLowerCase() === spOpt.key.toLowerCase() ||
                                                    selectedSpec?.toLowerCase() === spOpt.label.toLowerCase();
                                                return (
                                                    <Link
                                                        key={spOpt.key}
                                                        href={buildUrl({ spec: active ? '' : spOpt.key })}
                                                        rel="nofollow"
                                                        onClick={() => setIsOpen(false)}
                                                        className={`px-2.5 py-2 rounded-xs text-xs border transition-colors text-center ${
                                                            active
                                                                ? 'bg-[var(--primary)] border-[var(--primary)] text-white font-semibold'
                                                                : 'bg-white border-stone-300 text-stone-800 hover:border-stone-900'
                                                        }`}
                                                    >
                                                        {spOpt.label}
                                                    </Link>
                                                );
                                            })}
                                        </div>
                                    </MobileFilterSection>
                                )}

                                {/* 6. Kaina ir likutis (€) */}
                                <MobileFilterSection
                                    title={copy.headingPrice}
                                    isOpen={expandedSection === 'price'}
                                    onToggle={() => toggleSection('price')}
                                >
                                    <FilterLink
                                        href={buildUrl({ price: '' })}
                                        active={!selectedPrice}
                                        onClick={() => setIsOpen(false)}
                                    >
                                        {copy.allPrices}
                                    </FilterLink>
                                    <FilterLink
                                        href={buildUrl({ price: 'under-50' })}
                                        active={selectedPrice === 'under-50'}
                                        onClick={() => setIsOpen(false)}
                                    >
                                        {copy.priceUnder50}
                                    </FilterLink>
                                    <FilterLink
                                        href={buildUrl({ price: '50-200' })}
                                        active={selectedPrice === '50-200'}
                                        onClick={() => setIsOpen(false)}
                                    >
                                        {copy.price50to200}
                                    </FilterLink>
                                    <FilterLink
                                        href={buildUrl({ price: '200-1000' })}
                                        active={selectedPrice === '200-1000'}
                                        onClick={() => setIsOpen(false)}
                                    >
                                        {copy.price200to1000}
                                    </FilterLink>
                                    <FilterLink
                                        href={buildUrl({ price: '1000-plus' })}
                                        active={selectedPrice === '1000-plus'}
                                        onClick={() => setIsOpen(false)}
                                    >
                                        {copy.priceOver1000}
                                    </FilterLink>

                                    <form
                                        action={formAction}
                                        method="get"
                                        className="mt-2 pt-2 border-t border-stone-200 space-y-2"
                                    >
                                        {selectedBrand ? (
                                            <input type="hidden" name="brand" value={selectedBrand} />
                                        ) : null}
                                        {selectedCategory ? (
                                            <input type="hidden" name="category" value={selectedCategory} />
                                        ) : null}
                                        {selectedSubtype ? (
                                            <input type="hidden" name="subtype" value={selectedSubtype} />
                                        ) : null}
                                        {selectedSpec ? (
                                            <input type="hidden" name="spec" value={selectedSpec} />
                                        ) : null}
                                        {searchParams.q ? (
                                            <input type="hidden" name="q" value={searchParams.q} />
                                        ) : null}
                                        {selectedSort ? (
                                            <input type="hidden" name="sort" value={selectedSort} />
                                        ) : null}
                                        <div className="grid grid-cols-2 gap-2">
                                            <input
                                                type="number"
                                                name="minPrice"
                                                min="0"
                                                step="1"
                                                defaultValue={minPrice || ''}
                                                placeholder={copy.minPricePlaceholder}
                                                aria-label={copy.minPriceAria}
                                                className="w-full rounded-xs border border-stone-300 bg-white px-2.5 py-1.5 text-xs text-stone-900"
                                            />
                                            <input
                                                type="number"
                                                name="maxPrice"
                                                min="0"
                                                step="1"
                                                defaultValue={maxPrice || ''}
                                                placeholder={copy.maxPricePlaceholder}
                                                aria-label={copy.maxPriceAria}
                                                className="w-full rounded-xs border border-stone-300 bg-white px-2.5 py-1.5 text-xs text-stone-900"
                                            />
                                        </div>
                                        <label className="flex items-center gap-2 text-xs text-stone-800 cursor-pointer select-none">
                                            <input
                                                type="checkbox"
                                                name="inStock"
                                                value="1"
                                                defaultChecked={inStock === '1' || inStock === 'true'}
                                                className="rounded-xs border-stone-300 text-[var(--primary)]"
                                            />
                                            <span>{copy.inStockOnly}</span>
                                        </label>
                                        <button
                                            type="submit"
                                            className="w-full rounded-xs bg-stone-900 px-3 py-2 text-xs font-semibold text-white hover:bg-stone-800 transition-colors"
                                        >
                                            {copy.applyPriceRange}
                                        </button>
                                    </form>

                                    <div className="pt-2 border-t border-stone-200 mt-2 space-y-1">
                                        <p className="text-xs font-semibold text-stone-600 px-1">
                                            {copy.sortHeading}
                                        </p>
                                        <FilterLink
                                            href={buildUrl({ sort: '' })}
                                            active={!selectedSort}
                                            onClick={() => setIsOpen(false)}
                                        >
                                            {copy.sortDefault}
                                        </FilterLink>
                                        <FilterLink
                                            href={buildUrl({ sort: 'code-asc' })}
                                            active={selectedSort === 'code-asc'}
                                            onClick={() => setIsOpen(false)}
                                        >
                                            {copy.sortCode}
                                        </FilterLink>
                                        <FilterLink
                                            href={buildUrl({ sort: 'price-asc' })}
                                            active={selectedSort === 'price-asc'}
                                            onClick={() => setIsOpen(false)}
                                        >
                                            {copy.sortPriceUp}
                                        </FilterLink>
                                        <FilterLink
                                            href={buildUrl({ sort: 'price-desc' })}
                                            active={selectedSort === 'price-desc'}
                                            onClick={() => setIsOpen(false)}
                                        >
                                            {copy.sortPriceDown}
                                        </FilterLink>
                                    </div>
                                </MobileFilterSection>
                            </div>

                            <div className="p-4 border-t border-stone-200 bg-white space-y-2">
                                {activeFilterCount > 0 && (
                                    <Link
                                        href={`/${locale}/products`}
                                        rel="nofollow"
                                        onClick={() => setIsOpen(false)}
                                        className="block w-full text-center py-2 text-[var(--primary)] text-xs font-semibold hover:bg-stone-100 rounded-sm transition-colors duration-150"
                                    >
                                        {copy.clearFiltersWithCount(activeFilterCount)}
                                    </Link>
                                )}
                                <button
                                    type="button"
                                    onClick={() => setIsOpen(false)}
                                    className="w-full py-2.5 bg-[var(--primary)] text-white text-xs sm:text-sm font-bold rounded-sm hover:bg-[var(--brand-accent-hover)] transition-colors duration-150 cursor-pointer"
                                >
                                    {copy.showResultsWithCount(displayResultsCount)}
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}

function MobileFilterSection({
    title,
    isOpen,
    onToggle,
    children,
}: {
    title: string;
    isOpen: boolean;
    onToggle: () => void;
    children: React.ReactNode;
}) {
    return (
        <div className="border-b border-stone-200 pb-3">
            <button
                type="button"
                onClick={onToggle}
                className="w-full flex items-center justify-between py-1.5 text-sm font-semibold text-stone-900 cursor-pointer"
            >
                <span>{title}</span>
                <ChevronDown
                    className={`w-4 h-4 transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`}
                />
            </button>
            {isOpen && <div className="pt-2 flex flex-col gap-1">{children}</div>}
        </div>
    );
}

function FilterLink({
    href,
    active,
    children,
    onClick,
}: {
    href: string;
    active?: boolean;
    children: React.ReactNode;
    onClick?: () => void;
}) {
    return (
        <Link
            href={href}
            rel="nofollow"
            onClick={onClick}
            className={`flex items-center justify-between text-xs py-2 px-2.5 rounded-xs transition-colors duration-150 ${
                active
                    ? 'border-2 border-[var(--primary)] bg-transparent text-stone-900 font-bold'
                    : 'border border-transparent bg-transparent text-stone-700 hover:bg-stone-100 hover:text-stone-900'
            }`}
        >
            {children}
            {active && <Check className="w-3.5 h-3.5 shrink-0 text-[var(--primary)]" />}
        </Link>
    );
}
