import type { Metadata } from 'next';
import Link from 'next/link';
import { PackageSearch, Wrench, X, Check } from 'lucide-react';
import {
    getCategoryCatalogCounts,
    listCatalogBrands,
    searchCatalogProductsPaged,
    toBrandSlug,
    resolveCategoryAliasNames,
    getDynamicCategorySubcategories,
    getDynamicCatalogBrands,
    getDynamicCategoryFacets,
    shouldShowBoilerCompatibilityBar,
    getBoilerCompatibilityCounts,
    BOILER_SYSTEM_GROUPS,
    LITHUANIAN_BOILER_SYSTEM_MODELS,
    getBoilerSystemModelById,
    getBoilerSystemGroupById,
    resolveBoilerCompatibilityPassport,
    CATALOG_ACTIVE_BRAND_DIRECTORY,
    CATALOG_SUBTYPE_OPTIONS,
    CATALOG_SPEC_OPTIONS,
    type BoilerSystemGroupId,
} from '../../../lib/catalog-listing';
import { ProductGridClient } from '../../../components/product-grid-client';
import { LocalizedVytautasConsultButton } from '../../../components/product-card';
import { FilterDrawer } from '../../../components/filter-drawer';
import { VatToggle } from '../../../components/vat-toggle';
import { BoilerCompatibilitySelector } from '../../../components/boiler-compatibility-selector';
import { assetUrl } from '../../../lib/api';
import { getLocale } from 'next-intl/server';
import { getStorefrontRuntimeConfig } from '@platform/database';
import { STOREFRONT_STOCK_COPY, resolveAppLocale } from '../../../i18n/storefront-ui-copy';
import { getGilesCatalogSkuCount } from '../../../lib/catalog-count';
import { formatCatalogCount } from '../../../lib/w121-honest-commerce';
import type { AppLocale } from '../../../i18n/routing';
import {
    localizeCategoryLabel,
    localizeSubtypeLabel,
} from '../../../lib/product-i18n';

export const dynamic = 'force-dynamic';

const CATALOG_PAGE_COPY: Record<
    AppLocale,
    {
        metaTitle: string;
        metaDescription: string;
        defaultHeading: string;
        brandCatalogSuffix: (brandName: string) => string;
        breadcrumbAria: string;
        breadcrumbHome: string;
        breadcrumbStore: string;
        categoryStripAria: string;
        compatBannerAria: string;
        compatBannerLabel: string;
        solidFuelBoilerAlt: string;
        filterRailAria: string;
        subcategoryHeading: string;
        filterByBrand: string;
        allBrandsShort: string;
        powerAndSpecHeading: string;
        fuelAndSystemHeading: string;
        priceAndAvailabilityHeading: string;
        priceUnder50: string;
        price50to200: string;
        price200to1000: string;
        priceOver1000: string;
        inStockOnly: string;
        clearFilters: string;
        clearShort: string;
        foundPrefix: string;
        foundSuffix: string;
        pageShort: string;
        sortLabel: string;
        sortPopular: string;
        sortPriceAsc: string;
        sortPriceDesc: string;
        sortCodeAsc: string;
        aiSelectionBadge: (agentName: string, count: number) => string;
        aiSearchNote: (query: string, agentName: string) => string;
        aiGroupNote: (heading: string, count: number) => string;
        aiConsultPrompt: (heading: string, query: string | undefined, count: number) => string;
        aiConsultTitle: (heading: string) => string;
        aiConsultSummary: (count: number) => string;
        prevPage: string;
        nextPage: string;
        emptyHeading: string;
        emptyBody: string;
        askEngineer: string;
        b2bHeading: string;
        b2bBody: string;
        b2bConsultCta: string;
        b2bCta: string;
    }
> = {
    lt: {
        metaTitle: 'El. parduotuvė ({count} pozicijos) | GILĖS INŽINERIJA',
        metaDescription:
            'UAB „Gilės inžinerija“ el. parduotuvė: katilai, granulių degikliai, šilumos siurbliai Haier, Danfoss, HERZ, Gorenje ir atsarginės dalys.',
        defaultHeading: 'Katilai, granulių degikliai ir šildymo sistemų komponentai',
        brandCatalogSuffix: (brandName) => `${brandName} katalogas`,
        breadcrumbAria: 'Kelias',
        breadcrumbHome: 'Pradžia',
        breadcrumbStore: 'El. parduotuvė',
        categoryStripAria: 'Katalogo kategorijų juosta',
        compatBannerAria: 'Filtruoti pagal jūsų esamą katilą ar sistemą',
        compatBannerLabel: 'Filtruoti pagal jūsų esamą katilą ar sistemą:',
        solidFuelBoilerAlt: 'Kieto kuro katilas',
        filterRailAria: 'Inžineriniai filtrai',
        subcategoryHeading: 'Tikslus prekės tipas / Subkategorija',
        filterByBrand: 'Filtruoti pagal gamintoją',
        allBrandsShort: 'Visi',
        powerAndSpecHeading: 'Galia ir parametras',
        fuelAndSystemHeading: 'Kuras ir sistema',
        priceAndAvailabilityHeading: 'Kaina ir prieinamumas',
        priceUnder50: 'Iki 50 €',
        price50to200: '50–200 €',
        price200to1000: '200–1000 €',
        priceOver1000: 'Virš 1000 €',
        inStockOnly: 'Tik turimos sandėlyje',
        clearFilters: 'Išvalyti filtrus',
        clearShort: 'Išvalyti',
        foundPrefix: 'Rasta:',
        foundSuffix: 'prekės (-ių)',
        pageShort: 'psl.',
        sortLabel: 'Rikiuoti:',
        sortPopular: 'Populiariausios',
        sortPriceAsc: 'Kaina ↑',
        sortPriceDesc: 'Kaina ↓',
        sortCodeAsc: 'Kodas A–Z',
        aiSelectionBadge: (agentName, count) => `${agentName} inžinerinė atranka (${count} poz.)`,
        aiSearchNote: (query, agentName) =>
            `Ieškote pagal užklausą „${query}“. Pasikonsultuokite su ${agentName} dėl tikslaus suderinamumo.`,
        aiGroupNote: (heading, count) => `Peržiūrite grupę „${heading}“ (${count} prekių).`,
        aiConsultPrompt: (heading, query, count) =>
            `Peržiūriu katalogo atranką: ${heading}${query ? ` (paieška: ${query})` : ''} (${count} prekių). Padėk išsirinkti tiksliai tinkančius mazgus ir patikrink suderinamumą.`,
        aiConsultTitle: (heading) => `Katalogo atranka: ${heading}`,
        aiConsultSummary: (count) => `${count} poz.`,
        prevPage: 'Ankstesnis',
        nextPage: 'Kitas',
        emptyHeading: 'Pagal pasirinktus filtrus prekių nėra',
        emptyBody:
            'Pakeiskite filtrus arba paklauskite inžinieriaus – pasiūlysime tikslų analogą iš {count} pozicijų.',
        askEngineer: 'Užklausti inžinieriaus',
        b2bHeading: 'Komplektuojate visą katilinę ar šildymo sistemą?',
        b2bBody:
            'Atsiųskite sąrašą arba pasitarkite su inžinieriumi – parinksime tarpusavyje suderintus mazgus ir pateiksime komplekto pasiūlymą. Montuotojams ir rangovams – B2B projektų portalas.',
        b2bConsultCta: 'Klausti inžinieriaus Vytauto',
        b2bCta: 'Montuotojų B2B portalas',
    },
    en: {
        metaTitle: 'Online Store ({count} items) | GILĖS INŽINERIJA',
        metaDescription:
            'UAB „Gilės inžinerija“ engineering store: boilers, pellet burners, Haier heat pumps, Danfoss, HERZ, Gorenje & spare parts.',
        defaultHeading: 'Boilers, Pellet Burners & Heating System Components',
        brandCatalogSuffix: (brandName) => `${brandName} catalog`,
        breadcrumbAria: 'Breadcrumb',
        breadcrumbHome: 'Home',
        breadcrumbStore: 'Online Store',
        categoryStripAria: 'Catalog category bar',
        compatBannerAria: 'Filter by boiler or system',
        compatBannerLabel: 'Filter by boiler or system:',
        solidFuelBoilerAlt: 'Solid fuel boiler',
        filterRailAria: 'Engineering filters',
        subcategoryHeading: 'Product type / Subcategory',
        filterByBrand: 'Filter by manufacturer',
        allBrandsShort: 'All',
        powerAndSpecHeading: 'Power & technical spec',
        fuelAndSystemHeading: 'Fuel & heating system',
        priceAndAvailabilityHeading: 'Price & availability',
        priceUnder50: 'Up to 50 €',
        price50to200: '50–200 €',
        price200to1000: '200–1000 €',
        priceOver1000: 'Over 1000 €',
        inStockOnly: 'In stock only',
        clearFilters: 'Clear filters',
        clearShort: 'Clear',
        foundPrefix: 'Found:',
        foundSuffix: 'products',
        pageShort: 'p.',
        sortLabel: 'Sort:',
        sortPopular: 'Most popular',
        sortPriceAsc: 'Price ↑',
        sortPriceDesc: 'Price ↓',
        sortCodeAsc: 'SKU A–Z',
        aiSelectionBadge: (agentName, count) => `${agentName} engineering selection (${count} items)`,
        aiSearchNote: (query, agentName) =>
            `Searching for "${query}". Consult ${agentName} to verify exact thread and boiler compatibility.`,
        aiGroupNote: (heading, count) => `Viewing group "${heading}" (${count} items).`,
        aiConsultPrompt: (heading, query, count) =>
            `Viewing catalog selection: ${heading}${query ? ` (search: ${query})` : ''} (${count} items). Help me choose compatible components.`,
        aiConsultTitle: (heading) => `Catalog selection: ${heading}`,
        aiConsultSummary: (count) => `${count} items`,
        prevPage: 'Previous',
        nextPage: 'Next',
        emptyHeading: 'No products match the selected filters',
        emptyBody:
            'Adjust the filters or ask our engineer – we will select an exact match from {count} stocked items.',
        askEngineer: 'Ask an engineer',
        b2bHeading: 'Assembling a complete boiler room or heating system?',
        b2bBody:
            'Send us your list or consult our engineer – we will select mutually compatible assemblies and prepare a complete package quote. For installers and contractors – B2B project portal.',
        b2bConsultCta: 'Ask engineer Vytautas',
        b2bCta: 'Installer B2B portal',
    },
    pl: {
        metaTitle: 'Sklep internetowy ({count} pozycji) | GILĖS INŽINERIJA',
        metaDescription:
            'Sklep inżynieryjny UAB „Gilės inžinerija“: kotły, palniki pelletowe, pompy ciepła Haier, Danfoss, HERZ, Gorenje i części zamienne.',
        defaultHeading: 'Kotły, palniki pelletowe i komponenty systemów grzewczych',
        brandCatalogSuffix: (brandName) => `Katalog ${brandName}`,
        breadcrumbAria: 'Ścieżka nawigacji',
        breadcrumbHome: 'Start',
        breadcrumbStore: 'Sklep internetowy',
        categoryStripAria: 'Pasek kategorii katalogu',
        compatBannerAria: 'Filtruj wg kotła lub systemu',
        compatBannerLabel: 'Filtruj wg kotła lub systemu:',
        solidFuelBoilerAlt: 'Kocioł na paliwo stałe',
        filterRailAria: 'Filtry inżynieryjne',
        subcategoryHeading: 'Typ produktu / Podkategoria',
        filterByBrand: 'Filtruj wg producenta',
        allBrandsShort: 'Wszystkie',
        powerAndSpecHeading: 'Moc i parametr',
        fuelAndSystemHeading: 'Paliwo i system',
        priceAndAvailabilityHeading: 'Cena i dostępność',
        priceUnder50: 'Do 50 €',
        price50to200: '50–200 €',
        price200to1000: '200–1000 €',
        priceOver1000: 'Powyżej 1000 €',
        inStockOnly: 'Tylko dostępne w magazynie',
        clearFilters: 'Wyczyść filtry',
        clearShort: 'Wyczyść',
        foundPrefix: 'Znaleziono:',
        foundSuffix: 'produktów',
        pageShort: 'str.',
        sortLabel: 'Sortuj:',
        sortPopular: 'Najpopularniejsze',
        sortPriceAsc: 'Cena ↑',
        sortPriceDesc: 'Cena ↓',
        sortCodeAsc: 'Kod A–Z',
        aiSelectionBadge: (agentName, count) => `Dobór inżynieryjny ${agentName} (${count} poz.)`,
        aiSearchNote: (query, agentName) =>
            `Szukasz „${query}”. Skonsultuj się z ${agentName} w sprawie dokładnej kompatybilności.`,
        aiGroupNote: (heading, count) => `Przeglądasz grupę „${heading}” (${count} produktów).`,
        aiConsultPrompt: (heading, query, count) =>
            `Przeglądam katalog: ${heading}${query ? ` (szukaj: ${query})` : ''} (${count} produktów). Pomóż dobrać kompatybilne elementy.`,
        aiConsultTitle: (heading) => `Dobór z katalogu: ${heading}`,
        aiConsultSummary: (count) => `${count} poz.`,
        prevPage: 'Poprzednia',
        nextPage: 'Następna',
        emptyHeading: 'Brak produktów spełniających wybrane filtry',
        emptyBody:
            'Zmień filtry lub zapytaj inżyniera – dobierzemy dokładny odpowiednik z {count} pozycji.',
        askEngineer: 'Zapytaj inżyniera',
        b2bHeading: 'Kompletujesz całą kotłownię lub system grzewczy?',
        b2bBody:
            'Prześlij listę lub skonsultuj się z inżynierem – dobierzemy wzajemnie dopasowane podzespoły i przygotujemy ofertę zestawu. Dla instalatorów i wykonawców – portal projektowy B2B.',
        b2bConsultCta: 'Zapytaj inżyniera Vytautasa',
        b2bCta: 'Portal B2B instalatorów',
    },
    ru: {
        metaTitle: 'Интернет-магазин ({count} позиций) | GILĖS INŽINERIJA',
        metaDescription:
            'Инженерный магазин UAB „Gilės inžinerija“: котлы, пеллетные горелки, тепловые насосы Haier, Danfoss, HERZ, Gorenje и запчасти.',
        defaultHeading: 'Котлы, пеллетные горелки и компоненты систем отопления',
        brandCatalogSuffix: (brandName) => `Каталог ${brandName}`,
        breadcrumbAria: 'Навигационная цепочка',
        breadcrumbHome: 'Главная',
        breadcrumbStore: 'Интернет-магазин',
        categoryStripAria: 'Полоса категорий каталога',
        compatBannerAria: 'Фильтр по котлу или системе',
        compatBannerLabel: 'Фильтр по котлу или системе:',
        solidFuelBoilerAlt: 'Твердотопливный котел',
        filterRailAria: 'Инженерные фильтры',
        subcategoryHeading: 'Точный тип товара / Подкатегория',
        filterByBrand: 'Фильтр по производителю',
        allBrandsShort: 'Все',
        powerAndSpecHeading: 'Мощность и параметр',
        fuelAndSystemHeading: 'Топливо и система',
        priceAndAvailabilityHeading: 'Цена и наличие',
        priceUnder50: 'До 50 €',
        price50to200: '50–200 €',
        price200to1000: '200–1000 €',
        priceOver1000: 'Свыше 1000 €',
        inStockOnly: 'Только в наличии на складе',
        clearFilters: 'Сбросить фильтры',
        clearShort: 'Сбросить',
        foundPrefix: 'Найдено:',
        foundSuffix: 'товаров',
        pageShort: 'стр.',
        sortLabel: 'Сортировка:',
        sortPopular: 'Популярные',
        sortPriceAsc: 'Цена ↑',
        sortPriceDesc: 'Цена ↓',
        sortCodeAsc: 'Артикул A–Z',
        aiSelectionBadge: (agentName, count) => `Инженерный подбор ${agentName} (${count} поз.)`,
        aiSearchNote: (query, agentName) =>
            `Поиск по запросу «${query}». Проконсультируйтесь с ${agentName} для проверки совместимости.`,
        aiGroupNote: (heading, count) => `Просмотр группы «${heading}» (${count} товаров).`,
        aiConsultPrompt: (heading, query, count) =>
            `Просматриваю каталог: ${heading}${query ? ` (поиск: ${query})` : ''} (${count} товаров). Помоги подобрать совместимые узлы.`,
        aiConsultTitle: (heading) => `Подбор каталога: ${heading}`,
        aiConsultSummary: (count) => `${count} поз.`,
        prevPage: 'Назад',
        nextPage: 'Далее',
        emptyHeading: 'По выбранным фильтрам товаров не найдено',
        emptyBody:
            'Измените параметры фильтрации или задайте вопрос инженеру – подберем точный аналог из {count} позиций.',
        askEngineer: 'Спросить инженера',
        b2bHeading: 'Комплектуете всю котельную или систему отопления?',
        b2bBody:
            'Отправьте список или проконсультируйтесь с инженером – подберем совместимые узлы и подготовим предложение на комплект. Для монтажников и подрядчиков – проектный B2B портал.',
        b2bConsultCta: 'Спросить инженера Витаутаса',
        b2bCta: 'B2B портал монтажников',
    },
};

export async function generateMetadata({
    params,
    searchParams,
}: {
    params?: Promise<{ locale?: string }>;
    searchParams?: Promise<Record<string, string | undefined>>;
}): Promise<Metadata> {
    const resolvedRouteParams = params ? await params : undefined;
    const locale = resolveAppLocale(resolvedRouteParams?.locale);
    const copy = CATALOG_PAGE_COPY[locale];
    const catalogCountLabel = formatCatalogCount(getGilesCatalogSkuCount() ?? 6337, locale);
    const sp = (await searchParams) || {};
    const hasActiveFilters = Boolean(
        sp.category ||
            sp.q ||
            sp.brand ||
            sp.boiler ||
            sp.sub ||
            sp.subtype ||
            sp.spec ||
            sp.price ||
            sp.minPrice ||
            sp.maxPrice ||
            sp.inStock === '1' ||
            sp.inStock === 'true' ||
            sp.sort,
    );
    return {
        title: copy.metaTitle.replaceAll('{count}', catalogCountLabel),
        description: copy.metaDescription,
        robots: hasActiveFilters ? { index: false, follow: false } : undefined,
    };
}

const PAGE_SIZE = 48;

const cleanDash = (s: string) => s.replace(/\u2014/g, '–');

const HORIZONTAL_CATEGORY_STRIP: Array<{
    labels: Record<AppLocale, string>;
    category?: string;
    q?: string;
}> = [
    {
        labels: {
            lt: 'Visos {count} prekės',
            en: 'All {count} products',
            pl: 'Wszystkie {count} produktów',
            ru: 'Все {count} товаров',
        },
        category: undefined,
        q: undefined,
    },
    {
        labels: {
            lt: 'Granulių degikliai',
            en: 'Pellet burners',
            pl: 'Palniki pelletowe',
            ru: 'Пеллетные горелки',
        },
        category: 'Degikliai ir priedai',
        q: undefined,
    },
    {
        labels: {
            lt: 'Katilai ir šilumos siurbliai',
            en: 'Boilers & heat pumps',
            pl: 'Kotły i pompy ciepła',
            ru: 'Котлы и тепловые насосы',
        },
        category: 'Katilai ir katilinės įranga',
        q: undefined,
    },
    {
        labels: {
            lt: 'Akumuliacinės talpos ir boileriai',
            en: 'Buffer tanks & water heaters',
            pl: 'Bufory ciepła i bojlery',
            ru: 'Буферные емкости и бойлеры',
        },
        category: 'Akumuliacinės talpos ir boileriai',
        q: undefined,
    },
    {
        labels: {
            lt: 'Radiatoriai ir šildymo prietaisai',
            en: 'Radiators & heating units',
            pl: 'Grzejniki i urządzenia grzewcze',
            ru: 'Радиаторы и отопительные приборы',
        },
        category: 'Radiatoriai ir konvektoriai',
        q: undefined,
    },
    {
        labels: {
            lt: 'Termostatika ir vožtuvai',
            en: 'Thermostatics & valves',
            pl: 'Termostatyka i zawory',
            ru: 'Термостатика и клапаны',
        },
        category: 'Termostatinės galvutės ir vožtuvai',
        q: undefined,
    },
    {
        labels: {
            lt: 'Grindinis šildymas',
            en: 'Underfloor heating',
            pl: 'Ogrzewanie podłogowe',
            ru: 'Теплый пол',
        },
        category: 'Grindinis šildymas ir kolektoriai',
        q: undefined,
    },
    {
        labels: {
            lt: 'Atsarginės dalys',
            en: 'Spare parts',
            pl: 'Części zamienne',
            ru: 'Запчасти',
        },
        category: 'Katilinės automatika ir pavaros',
        q: undefined,
    },
];

const BOILER_COMPATIBILITY_FILTERS: Array<{
    labels: Record<AppLocale, string>;
    q?: string;
    brand?: string;
    clear?: boolean;
}> = [
    {
        labels: {
            lt: 'Viadrus U22 / U26',
            en: 'Viadrus U22 / U26',
            pl: 'Viadrus U22 / U26',
            ru: 'Viadrus U22 / U26',
        },
        q: 'MPB',
    },
    {
        labels: {
            lt: 'Kalvis 2-16 / 2-20',
            en: 'Kalvis 2-16 / 2-20',
            pl: 'Kalvis 2-16 / 2-20',
            ru: 'Kalvis 2-16 / 2-20',
        },
        q: 'degiklis',
    },
    {
        labels: {
            lt: 'Atmos / Vigas',
            en: 'Atmos / Vigas',
            pl: 'Atmos / Vigas',
            ru: 'Atmos / Vigas',
        },
        q: 'Pelltech',
    },
    {
        labels: {
            lt: 'Stropuva',
            en: 'Stropuva',
            pl: 'Stropuva',
            ru: 'Stropuva',
        },
        q: 'HERZ',
    },
    {
        labels: {
            lt: 'Megatherm MPB degikliai',
            en: 'Megatherm MPB burners',
            pl: 'Palniki Megatherm MPB',
            ru: 'Горелки Megatherm MPB',
        },
        q: 'MPB',
    },
    {
        labels: {
            lt: 'Haier šilumos siurbliai',
            en: 'Haier heat pumps',
            pl: 'Pompy ciepła Haier',
            ru: 'Тепловые насосы Haier',
        },
        brand: 'haier',
    },
    {
        labels: {
            lt: 'Visi modeliai',
            en: 'All models',
            pl: 'Wszystkie modele',
            ru: 'Все модели',
        },
        clear: true,
    },
];

const POWER_AND_SPEC_CHIPS: Array<{
    labels: Record<AppLocale, string>;
    q?: string;
    spec?: string;
}> = [
    {
        labels: {
            lt: 'iki 35 kW',
            en: 'up to 35 kW',
            pl: 'do 35 kW',
            ru: 'до 35 кВт',
        },
        q: '25 kW',
    },
    {
        labels: {
            lt: '35–100 kW',
            en: '35–100 kW',
            pl: '35–100 kW',
            ru: '35–100 кВт',
        },
        q: '50 kW',
    },
    {
        labels: {
            lt: 'virš 100 kW',
            en: 'over 100 kW',
            pl: 'powyżej 100 kW',
            ru: 'свыше 100 кВт',
        },
        q: '150 kW',
    },
    {
        labels: { lt: 'DN15', en: 'DN15', pl: 'DN15', ru: 'DN15' },
        spec: 'dn15',
    },
    {
        labels: { lt: 'DN20', en: 'DN20', pl: 'DN20', ru: 'DN20' },
        spec: 'dn20',
    },
    {
        labels: { lt: 'DN25', en: 'DN25', pl: 'DN25', ru: 'DN25' },
        spec: 'dn25',
    },
    {
        labels: { lt: 'M30×1,5', en: 'M30×1.5', pl: 'M30×1,5', ru: 'M30×1,5' },
        spec: 'm30x1-5',
    },
    {
        labels: { lt: 'RA Click', en: 'RA Click', pl: 'RA Click', ru: 'RA Click' },
        spec: 'ra-click',
    },
];

const FUEL_SYSTEM_OPTIONS: Array<{
    labels: Record<AppLocale, string>;
    q?: string;
    category?: string;
    brand?: string;
}> = [
    {
        labels: {
            lt: 'Granulės (degikliai)',
            en: 'Pellets (burners)',
            pl: 'Pellet (palniki)',
            ru: 'Пеллеты (горелки)',
        },
        q: 'granul',
    },
    {
        labels: {
            lt: 'Malkos ir biokuras',
            en: 'Wood & biomass',
            pl: 'Drewno i biomasa',
            ru: 'Дрова и биотопливо',
        },
        category: 'Šildymo katilai ir krosnelės',
    },
    {
        labels: {
            lt: 'Oras–vanduo R290',
            en: 'Air-to-water R290',
            pl: 'Powietrze–woda R290',
            ru: 'Воздух–вода R290',
        },
        brand: 'haier',
    },
    {
        labels: {
            lt: 'Boileriai ir talpos',
            en: 'Boilers & tanks',
            pl: 'Bojlery i zasobniki',
            ru: 'Бойлеры и баки',
        },
        category: 'Vandens šildytuvai ir akumuliacinės talpos',
    },
    {
        labels: {
            lt: 'Hidraulika ir vožtuvai',
            en: 'Hydronics & valves',
            pl: 'Hydraulika i zawory',
            ru: 'Гидравлика и клапаны',
        },
        category: 'Balansiniai ir reguliavimo vožtuvai',
    },
];

function buildQuery(
    current: Record<string, string | undefined>,
    overrides: Record<string, string | undefined>,
    locale = 'lt',
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
    if (
        ('brand' in overrides ||
            'category' in overrides ||
            'sub' in overrides ||
            'subtype' in overrides ||
            'spec' in overrides) &&
        !('q' in overrides)
    ) {
        delete merged.q;
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

function buildPageUrl(
    params: Record<string, string | undefined>,
    page: number,
    locale = 'lt',
): string {
    return buildQuery(params, { page: page > 1 ? String(page) : undefined }, locale);
}

export default async function ProductsPage({
    params,
    searchParams,
}: {
    params?: Promise<{ locale?: string }>;
    searchParams: Promise<{
        category?: string;
        q?: string;
        brand?: string;
        boiler?: string;
        boilerGroup?: string;
        sub?: string;
        subtype?: string;
        spec?: string;
        price?: string;
        minPrice?: string;
        maxPrice?: string;
        inStock?: string;
        sort?: string;
        page?: string;
        storeId?: string;
    }>;
}) {
    const resolvedRouteParams = params ? await params : undefined;
    const rawLocale = resolvedRouteParams?.locale || (await getLocale().catch(() => 'lt')) || 'lt';
    const locale = resolveAppLocale(rawLocale);
    const copy = CATALOG_PAGE_COPY[locale];
    const stockCopy = STOREFRONT_STOCK_COPY[locale];
    // W121-A2: live count replaces every hardcoded 6337 in page copy.
    const catalogCount = getGilesCatalogSkuCount() ?? 6337;
    const catalogCountLabel = formatCatalogCount(catalogCount, locale);
    const warehouseBadge = stockCopy.warehouseBadge.replaceAll('{count}', catalogCountLabel);
    const withCount = (s: string) => s.replaceAll('{count}', catalogCountLabel);
    const sp = await searchParams;
    const runtimeConfig = await getStorefrontRuntimeConfig(sp.storeId);
    const showDeepSubtypeSpecFilters = runtimeConfig.features.deepSubtypeSpecFilters;
    const agentName = runtimeConfig.persona.agentName || 'Vytautas';
    const category = typeof sp.category === 'string' && sp.category.trim() ? sp.category.trim() : undefined;
    const searchQuery = typeof sp.q === 'string' && sp.q.trim() ? sp.q.trim() : undefined;
    const brand = typeof sp.brand === 'string' && sp.brand.trim() ? sp.brand.trim() : undefined;
    const rawBoiler = typeof sp.boiler === 'string' && sp.boiler.trim() ? sp.boiler.trim() : undefined;
    const selectedBoiler =
        rawBoiler && rawBoiler !== 'all' && rawBoiler !== 'visi' && getBoilerSystemModelById(rawBoiler)
            ? getBoilerSystemModelById(rawBoiler)!.id
            : undefined;
    const rawBoilerGroup =
        typeof sp.boilerGroup === 'string' && sp.boilerGroup.trim() ? sp.boilerGroup.trim() : undefined;
    const activeBoilerPassport = resolveBoilerCompatibilityPassport(selectedBoiler, locale);
    const activeBoilerGroupId: BoilerSystemGroupId = (
        activeBoilerPassport?.groupId ||
        getBoilerSystemGroupById(rawBoilerGroup)?.id ||
        'kieto_kuro_seni'
    ) as BoilerSystemGroupId;
    const activeBoilerGroup =
        getBoilerSystemGroupById(activeBoilerGroupId) || BOILER_SYSTEM_GROUPS[0];
    const subParam = typeof sp.sub === 'string' && sp.sub.trim() ? sp.sub.trim() : undefined;
    const subtypeParam = typeof sp.subtype === 'string' && sp.subtype.trim() ? sp.subtype.trim() : undefined;
    const subtype = subParam && subParam !== 'all' ? subParam : subtypeParam && subtypeParam !== 'all' ? subtypeParam : undefined;
    const spec = typeof sp.spec === 'string' && sp.spec.trim() ? sp.spec.trim() : undefined;
    const selectedPrice = typeof sp.price === 'string' && sp.price.trim() ? sp.price.trim() : undefined;
    const minPriceStr = typeof sp.minPrice === 'string' && sp.minPrice.trim() ? sp.minPrice.trim() : undefined;
    const maxPriceStr = typeof sp.maxPrice === 'string' && sp.maxPrice.trim() ? sp.maxPrice.trim() : undefined;
    const inStockStr = typeof sp.inStock === 'string' && sp.inStock.trim() ? sp.inStock.trim() : undefined;
    const selectedSort = typeof sp.sort === 'string' && sp.sort.trim() ? sp.sort.trim() : undefined;
    const currentPage = Math.max(1, Number.parseInt(sp.page ?? '1', 10) || 1);

    const parsedMinPrice = minPriceStr ? Number.parseFloat(minPriceStr) : undefined;
    const parsedMaxPrice = maxPriceStr ? Number.parseFloat(maxPriceStr) : undefined;
    const parsedInStock = inStockStr === '1' || inStockStr === 'true';

    let activeFilterCount = 0;
    if (category) activeFilterCount++;
    if (brand) activeFilterCount++;
    if (selectedBoiler) activeFilterCount++;
    if (subtype) activeFilterCount++;
    if (spec) activeFilterCount++;
    if (selectedPrice || minPriceStr || maxPriceStr) activeFilterCount++;
    if (parsedInStock) activeFilterCount++;
    if (selectedSort) activeFilterCount++;

    const hasActiveFilters = activeFilterCount > 0 || Boolean(searchQuery);

    const resolvedParams: Record<string, string | undefined> = {
        category,
        q: searchQuery,
        brand,
        boiler: selectedBoiler,
        boilerGroup: rawBoilerGroup,
        sub: subtype,
        spec,
        price: selectedPrice,
        minPrice: minPriceStr,
        maxPrice: maxPriceStr,
        inStock: inStockStr,
        sort: selectedSort,
        page: sp.page,
    };

    const [categoriesList, brandsList, listing] = await Promise.all([
        getCategoryCatalogCounts(),
        listCatalogBrands(),
        searchCatalogProductsPaged({
            category,
            categoryId: category,
            q: searchQuery,
            brand,
            brandId: brand,
            boiler: selectedBoiler,
            sub: subtype,
            subtype,
            spec,
            priceRange: selectedPrice,
            minPrice: parsedMinPrice,
            maxPrice: parsedMaxPrice,
            inStock: parsedInStock,
            sortBy: selectedSort,
            page: currentPage,
            pageSize: PAGE_SIZE,
        }),
    ]);
    const productsList = listing.items;
    const totalFound = listing.total;
    const pageCount = listing.pageCount;

    const boilerCounts = getBoilerCompatibilityCounts();

    const dynamicSubcategories = getDynamicCategorySubcategories(
        {
            category,
            categoryId: category,
            q: searchQuery,
            brand,
            brandId: brand,
            boiler: selectedBoiler,
            spec,
            priceRange: selectedPrice,
            minPrice: parsedMinPrice,
            maxPrice: parsedMaxPrice,
            inStock: parsedInStock,
        },
        locale,
    );

    const dynamicBrands = getDynamicCatalogBrands({
        category,
        categoryId: category,
        sub: subtype,
        subtype,
        q: searchQuery,
        boiler: selectedBoiler,
        spec,
        priceRange: selectedPrice,
        minPrice: parsedMinPrice,
        maxPrice: parsedMaxPrice,
        inStock: parsedInStock,
    });

    const dynamicFacetGroup = getDynamicCategoryFacets(category, locale, {
        sub: subtype,
        subtype,
        brand,
        brandId: brand,
        boiler: selectedBoiler,
        q: searchQuery,
        priceRange: selectedPrice,
        minPrice: parsedMinPrice,
        maxPrice: parsedMaxPrice,
        inStock: parsedInStock,
    });

    const showBoilerBar = shouldShowBoilerCompatibilityBar(category, selectedBoiler);

    const rawBrands = brandsList.map((bItem) => ({
        id: bItem.id,
        name: bItem.name,
        slug: bItem.slug,
        count: bItem.count,
    }));

    const facetBrands =
        dynamicBrands.length > 0
            ? dynamicBrands
            : rawBrands.filter((b) => b.slug !== 'generic-brand').length >= 10
              ? rawBrands
              : CATALOG_ACTIVE_BRAND_DIRECTORY.map((b) => ({
                    id: b.id,
                    name: b.name,
                    slug: b.slug,
                    count: b.productCount,
                }));

    const FALLBACK_HVAC_CATEGORIES = [
        { id: 'cat-ufh', name: 'Grindinis šildymas ir kolektoriai', slug: 'grindinis-sildymas-ir-kolektoriai', productCount: 1120 },
        { id: 'cat-vessels', name: 'Plėtimosi indai ir slėgio palaikymas', slug: 'pletimosi-indai-ir-slegio-palaikymas', productCount: 753 },
        { id: 'cat-balancing', name: 'Balansiniai ir reguliavimo vožtuvai', slug: 'balansiniai-ir-reguliavimo-voztuvai', productCount: 689 },
        { id: 'cat-thermostatic', name: 'Termostatinės galvutės ir vožtuvai', slug: 'termostatines-galvutes-ir-voztuvai', productCount: 410 },
        { id: 'cat-boilers', name: 'Šildymo katilai ir krosnelės', slug: 'sildymo-katilai-ir-krosneles', productCount: 420 },
        { id: 'cat-dhw', name: 'Vandens šildytuvai ir akumuliacinės talpos', slug: 'vandens-sildytuvai-ir-akumuliacines-talpos', productCount: 380 },
        { id: 'cat-air', name: 'Oro atskyrikliai ir nuorintuvai', slug: 'oro-atskyrikliai-ir-nuorintuvai', productCount: 310 },
    ];

    const facetCategories =
        categoriesList.filter((c) => !/reality|widget|test/i.test(c.name)).length >= 4
            ? categoriesList
            : FALLBACK_HVAC_CATEGORIES;

    const resolvedCategoryAliases = category ? resolveCategoryAliasNames(category) : [];
    const matchedCategoryObj = category
        ? facetCategories.find(
              (c) =>
                  c.id === category ||
                  c.slug.toLowerCase() === category.toLowerCase() ||
                  resolvedCategoryAliases.some(
                      (aliasName) => c.name.trim().toLowerCase() === aliasName.trim().toLowerCase(),
                  ),
          )
        : undefined;
    const matchedBrandObj = brand
        ? facetBrands.find(
              (b) =>
                  b.id === brand ||
                  b.slug === toBrandSlug(brand) ||
                  b.name.trim().toLowerCase() === brand.toLowerCase(),
          )
        : undefined;
    const matchedSubtypeObj = subtype
        ? dynamicSubcategories.find((s) => s.slug.toLowerCase() === subtype.toLowerCase()) ||
          CATALOG_SUBTYPE_OPTIONS.find((s) => s.key.toLowerCase() === subtype.toLowerCase())
        : undefined;
    const matchedSpecObj = spec
        ? dynamicFacetGroup.chips.find(
              (s) =>
                  s.key.toLowerCase() === spec.toLowerCase() ||
                  s.spec.toLowerCase() === spec.toLowerCase() ||
                  s.label.toLowerCase() === spec.toLowerCase(),
          ) ||
          CATALOG_SPEC_OPTIONS.find(
              (s) =>
                  s.key.toLowerCase() === spec.toLowerCase() ||
                  s.label.toLowerCase() === spec.toLowerCase(),
          )
        : undefined;

    const localizedMatchedCategoryName = matchedCategoryObj?.name
        ? localizeCategoryLabel(matchedCategoryObj.name, locale)
        : undefined;

    const activeHeading = localizedMatchedCategoryName
        ? matchedBrandObj?.name
            ? `${localizedMatchedCategoryName} – ${matchedBrandObj.name}`
            : localizedMatchedCategoryName
        : matchedBrandObj?.name
          ? copy.brandCatalogSuffix(matchedBrandObj.name)
          : copy.defaultHeading;

    return (
        <div className="min-h-screen bg-[#F5F3EE] text-[#11161B] overflow-x-hidden">
            {/* 1. Dark Graphite Architectural Catalog Header (#11161B) from Artboard #4 */}
            <section
                data-testid="giles-catalog-dark-header"
                className="bg-[#11161B] text-[#F5F3EE] border-b border-[#2C3742] py-3.5"
            >
                <div className="mx-auto max-w-7xl px-4 sm:px-6 space-y-2.5">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                        <div className="space-y-0.5 min-w-0">
                            <nav
                                aria-label={copy.breadcrumbAria}
                                className="flex flex-wrap items-center gap-1.5 text-xs text-[#A3ADB8]"
                            >
                                <Link href={`/${locale}`} className="hover:text-[#FF8A3D]">
                                    {copy.breadcrumbHome}
                                </Link>
                                <span aria-hidden="true">/</span>
                                <span className="text-[#FF8A3D] font-semibold">
                                    {copy.breadcrumbStore}
                                </span>
                                {(matchedCategoryObj || matchedBrandObj) && (
                                    <>
                                        <span aria-hidden="true">/</span>
                                        <span className="text-white font-semibold truncate">
                                            {cleanDash(activeHeading)}
                                        </span>
                                    </>
                                )}
                            </nav>

                            <h1 className="text-lg sm:text-2xl font-extrabold text-white leading-tight">
                                {cleanDash(activeHeading)}
                            </h1>
                        </div>

                        <div className="inline-flex items-center gap-2 border border-[#2C3742] bg-[#192028] px-3 py-1.5 text-xs font-semibold text-[#C9D0D8] rounded-none shrink-0">
                            <span className="h-2 w-2 rounded-full bg-[#157A3B] shrink-0" aria-hidden="true" />
                            <span>{warehouseBadge}</span>
                        </div>
                    </div>

                    {/* Horizontal Category Strip */}
                    <div
                        aria-label={copy.categoryStripAria}
                        className="flex flex-wrap items-center gap-1.5 pt-0.5"
                    >
                        {HORIZONTAL_CATEGORY_STRIP.map((tab) => {
                            const isAll = !tab.category && !tab.q;
                            const isActive = isAll
                                ? !category && !searchQuery && !brand
                                : (tab.category &&
                                      category?.toLowerCase() === tab.category.toLowerCase()) ||
                                  (tab.q && searchQuery?.toLowerCase() === tab.q.toLowerCase());
                            const href = isAll
                                ? `/${locale}/products`
                                : buildQuery(
                                      resolvedParams,
                                      {
                                          category: tab.category,
                                          q: tab.q,
                                          brand: undefined,
                                      },
                                      locale,
                                  );
                            const tabLabel = withCount(tab.labels[locale]);
                            return (
                                <Link
                                    key={tab.labels.lt}
                                    href={href}
                                    rel="nofollow"
                                    className={`inline-flex items-center px-2.5 py-1 text-xs font-bold whitespace-nowrap rounded-none border bg-transparent transition-colors ${
                                        isActive
                                            ? 'border-[#FF8A3D] text-[#FF8A3D]'
                                            : 'border-[#2C3742] text-[#C9D0D8] hover:border-[#FF8A3D] hover:text-white'
                                    }`}
                                >
                                    {tabLabel}
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* 2. Signature „Gilės“ 4-Group Lithuanian Boiler & System Compatibility Selector (25 models) */}
            {showBoilerBar && (
                <section
                    data-testid="giles-boiler-compatibility-bar"
                    aria-label={copy.compatBannerAria}
                    className="bg-[#FBEADF] border-b border-[#E2DDD3] border-l-4 border-l-[#C2410C] rounded-none py-2.5"
                >
                    <BoilerCompatibilitySelector
                        locale={locale}
                        selectedBoiler={selectedBoiler}
                        activeGroupId={activeBoilerGroup.id}
                        boilerCounts={boilerCounts}
                        currentParams={resolvedParams}
                        selectedBoilerLabel={activeBoilerPassport?.shortChipLabel}
                        selectedBoilerCount={totalFound}
                    />
                </section>
            )}

            {/* 3. Architectural Left Filter Rail (260px, sharp border-r border-[#E2DDD3] flush rail) + Flush Hairline Product Matrix */}
            <div className="mx-auto max-w-7xl px-4 sm:px-6 py-4 sm:py-6">
                <div className="lg:grid lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-6 lg:items-start">
                    {/* Sharp 260px Architectural Left Filter Rail */}
                    <aside
                        data-testid="giles-architectural-filter-rail"
                        aria-label={copy.filterRailAria}
                        className="hidden lg:block border-r border-[#E2DDD3] pr-5 rounded-none space-y-5"
                    >
                        {/* Tikslus prekės tipas / Subkategorija */}
                        {dynamicSubcategories.length > 0 && (
                            <div
                                data-testid="catalog-sidebar-subcategories"
                                className="pb-4 border-b border-[#E2DDD3] space-y-2.5"
                            >
                                <div className="flex items-center justify-between gap-2">
                                    <h2 className="text-sm font-extrabold text-[#11161B]">
                                        {copy.subcategoryHeading}
                                    </h2>
                                    {subtype && (
                                        <Link
                                            href={buildQuery(
                                                resolvedParams,
                                                { sub: undefined, subtype: undefined },
                                                locale,
                                            )}
                                            rel="nofollow"
                                            className="text-xs font-bold text-[#C2410C] hover:underline whitespace-nowrap"
                                        >
                                            {copy.allBrandsShort}
                                        </Link>
                                    )}
                                </div>
                                <ul className="space-y-1">
                                    {dynamicSubcategories.map((subItem) => {
                                        const isAllSub = subItem.slug === 'all';
                                        const active = isAllSub
                                            ? !subtype
                                            : subtype?.toLowerCase() === subItem.slug.toLowerCase();
                                        const href = buildQuery(
                                            resolvedParams,
                                            {
                                                sub: isAllSub || active ? undefined : subItem.slug,
                                                subtype: undefined,
                                            },
                                            locale,
                                        );
                                        return (
                                            <li key={subItem.slug}>
                                                <Link
                                                    href={href}
                                                    rel="nofollow"
                                                    className={`flex items-start justify-between gap-2 py-1 text-xs transition-colors ${
                                                        active
                                                            ? 'font-extrabold text-[#C2410C]'
                                                            : 'font-medium text-[#11161B] hover:text-[#C2410C]'
                                                    }`}
                                                >
                                                    <span className="flex items-start gap-2 min-w-0">
                                                        <span
                                                            className={`mt-0.5 w-3.5 h-3.5 border flex items-center justify-center shrink-0 rounded-none ${
                                                                active
                                                                    ? 'border-[#11161B] bg-[#11161B] text-white'
                                                                    : 'border-[#D5CFC3] bg-white'
                                                            }`}
                                                        >
                                                            {active && <Check className="w-2.5 h-2.5" />}
                                                        </span>
                                                        <span className="leading-snug">{subItem.label}</span>
                                                    </span>
                                                    <span className="text-xs text-[#5B6470] tabular-nums shrink-0 whitespace-nowrap">
                                                        · {subItem.count} poz. ({copy.inStockOnly.split(' ')[0]})
                                                    </span>
                                                </Link>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
                        )}

                        {/* Gamintojas (Dynamic per active category/subcategory) */}
                        <div
                            data-testid="catalog-dynamic-brands"
                            className="pb-4 border-b border-[#E2DDD3] space-y-2.5"
                        >
                            <div className="flex items-center justify-between gap-2">
                                <h2 className="text-sm font-extrabold text-[#11161B]">
                                    {copy.filterByBrand}
                                </h2>
                                {brand && (
                                    <Link
                                        href={buildQuery(resolvedParams, { brand: undefined }, locale)}
                                        rel="nofollow"
                                        className="text-xs font-bold text-[#C2410C] hover:underline whitespace-nowrap"
                                    >
                                        {copy.allBrandsShort}
                                    </Link>
                                )}
                            </div>
                            <ul className="space-y-1">
                                {facetBrands.slice(0, 12).map((bItem) => {
                                    const active = Boolean(
                                        brand &&
                                            (brand.toLowerCase() === bItem.slug.toLowerCase() ||
                                                brand.toLowerCase() === bItem.name.toLowerCase() ||
                                                brand === bItem.id),
                                    );
                                    return (
                                        <li key={bItem.id || bItem.slug}>
                                            <Link
                                                href={buildQuery(
                                                    resolvedParams,
                                                    { brand: active ? undefined : bItem.slug },
                                                    locale,
                                                )}
                                                rel="nofollow"
                                                className={`flex items-center justify-between gap-2 py-1 text-xs transition-colors ${
                                                    active
                                                        ? 'font-extrabold text-[#C2410C]'
                                                        : 'font-medium text-[#11161B] hover:text-[#C2410C]'
                                                }`}
                                            >
                                                <span className="flex items-center gap-2 min-w-0">
                                                    <span
                                                        className={`w-3.5 h-3.5 border flex items-center justify-center shrink-0 rounded-none ${
                                                            active
                                                                ? 'border-[#11161B] bg-[#11161B] text-white'
                                                                : 'border-[#D5CFC3] bg-white'
                                                        }`}
                                                    >
                                                        {active && <Check className="w-2.5 h-2.5" />}
                                                    </span>
                                                    <span className="truncate">{bItem.name}</span>
                                                </span>
                                                <span className="text-xs text-[#5B6470] tabular-nums shrink-0">
                                                    {bItem.count}
                                                </span>
                                            </Link>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>

                        {/* Parametrai pagal kategoriją */}
                        {dynamicFacetGroup.chips.length > 0 && (
                            <div
                                data-testid="catalog-dynamic-facets"
                                className="pb-4 border-b border-[#E2DDD3] space-y-2.5"
                            >
                                <h2 className="text-sm font-extrabold text-[#11161B]">
                                    {dynamicFacetGroup.groupHeading}
                                </h2>
                                <div className="flex flex-wrap gap-1.5">
                                    {dynamicFacetGroup.chips.map((chip) => {
                                        const isActive =
                                            spec?.toLowerCase() === chip.spec.toLowerCase() ||
                                            spec?.toLowerCase() === chip.key.toLowerCase();
                                        const href = buildQuery(
                                            resolvedParams,
                                            { spec: isActive ? undefined : chip.spec },
                                            locale,
                                        );
                                        return (
                                            <Link
                                                key={chip.key}
                                                href={href}
                                                rel="nofollow"
                                                className={`px-2.5 py-1 text-xs font-semibold border rounded-none whitespace-nowrap transition-colors ${
                                                    isActive
                                                        ? 'border-[#11161B] bg-[#11161B] text-white'
                                                        : 'border-[#D5CFC3] bg-white text-[#11161B] hover:border-[#11161B]'
                                                }`}
                                            >
                                                {chip.label}{' '}
                                                <span
                                                    className={`tabular-nums ${
                                                        isActive ? 'text-[#C9D0D8]' : 'text-[#5B6470]'
                                                    }`}
                                                >
                                                    ({chip.count})
                                                </span>
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Kuras ir sistema (tik katilų, degiklių ar bendrame rodinyje) */}
                        {showBoilerBar && (
                            <div className="pb-4 border-b border-[#E2DDD3] space-y-2.5">
                                <h2 className="text-sm font-extrabold text-[#11161B]">
                                    {copy.fuelAndSystemHeading}
                                </h2>
                                <ul className="space-y-1.5">
                                    {FUEL_SYSTEM_OPTIONS.map((opt) => {
                                        const active =
                                            (opt.q &&
                                                searchQuery?.toLowerCase() === opt.q.toLowerCase()) ||
                                            (opt.category &&
                                                category?.toLowerCase() ===
                                                    opt.category.toLowerCase()) ||
                                            (opt.brand &&
                                                brand?.toLowerCase() === opt.brand.toLowerCase());
                                        const href = buildQuery(
                                            resolvedParams,
                                            {
                                                q: opt.q ? (active ? undefined : opt.q) : undefined,
                                                category: opt.category
                                                    ? active
                                                        ? undefined
                                                        : opt.category
                                                    : undefined,
                                                brand: opt.brand
                                                    ? active
                                                        ? undefined
                                                        : opt.brand
                                                    : undefined,
                                            },
                                            locale,
                                        );
                                        return (
                                            <li key={opt.labels.lt}>
                                                <Link
                                                    href={href}
                                                    rel="nofollow"
                                                    className={`flex items-center gap-2 py-0.5 text-xs transition-colors ${
                                                        active
                                                            ? 'font-extrabold text-[#C2410C]'
                                                            : 'font-medium text-[#11161B] hover:text-[#C2410C]'
                                                    }`}
                                                >
                                                    <span
                                                        className={`w-3.5 h-3.5 border flex items-center justify-center shrink-0 rounded-none ${
                                                            active
                                                                ? 'border-[#11161B] bg-[#11161B] text-white'
                                                                : 'border-[#D5CFC3] bg-white'
                                                        }`}
                                                    >
                                                        {active && <Check className="w-2.5 h-2.5" />}
                                                    </span>
                                                    <span className="leading-snug">{opt.labels[locale]}</span>
                                                </Link>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
                        )}

                        {/* Kaina ir likutis */}
                        <div className="space-y-3">
                            <h2 className="text-sm font-extrabold text-[#11161B]">
                                {copy.priceAndAvailabilityHeading}
                            </h2>
                            <div className="grid grid-cols-2 gap-1.5">
                                {[
                                    { key: 'under-50', label: copy.priceUnder50 },
                                    { key: '50-200', label: copy.price50to200 },
                                    { key: '200-1000', label: copy.price200to1000 },
                                    { key: '1000-plus', label: copy.priceOver1000 },
                                ].map((pOpt) => {
                                    const active = selectedPrice === pOpt.key;
                                    return (
                                        <Link
                                            key={pOpt.key}
                                            href={buildQuery(
                                                resolvedParams,
                                                { price: active ? undefined : pOpt.key },
                                                locale,
                                            )}
                                            rel="nofollow"
                                            className={`px-2 py-1 text-xs font-semibold border rounded-none text-center whitespace-nowrap transition-colors ${
                                                active
                                                    ? 'border-[#11161B] bg-[#11161B] text-white'
                                                    : 'border-[#D5CFC3] bg-white text-[#11161B] hover:border-[#11161B]'
                                            }`}
                                        >
                                            {pOpt.label}
                                        </Link>
                                    );
                                })}
                            </div>

                            <Link
                                href={buildQuery(
                                    resolvedParams,
                                    { inStock: parsedInStock ? undefined : '1' },
                                    locale,
                                )}
                                rel="nofollow"
                                className="flex items-center justify-between gap-2 pt-1 text-xs font-bold text-[#11161B] hover:text-[#C2410C]"
                            >
                                <span>{copy.inStockOnly}</span>
                                <span
                                    className={`w-4 h-4 border flex items-center justify-center rounded-none ${
                                        parsedInStock
                                            ? 'border-[#11161B] bg-[#11161B] text-white'
                                            : 'border-[#D5CFC3] bg-white'
                                    }`}
                                >
                                    {parsedInStock && <Check className="w-3 h-3" />}
                                </span>
                            </Link>

                            {hasActiveFilters && (
                                <Link
                                    href={`/${locale}/products`}
                                    rel="nofollow"
                                    className="inline-block pt-1 text-xs font-extrabold text-[#C2410C] hover:underline"
                                >
                                    {copy.clearFilters}
                                </Link>
                            )}
                        </div>
                    </aside>

                    {/* Right Main Product Matrix Column */}
                    <div className="min-w-0 flex-1 space-y-3">
                        {/* Mobile Filter Drawer + Desktop Count / VAT / Sort Bar */}
                        <div
                            data-testid="active-filter-bar"
                            className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#E2DDD3]"
                        >
                            <div className="flex flex-wrap items-center gap-2 min-w-0">
                                <div className="lg:hidden">
                                    <FilterDrawer
                                        locale={locale}
                                        categories={facetCategories}
                                        brands={facetBrands}
                                        selectedCategory={category}
                                        selectedBrand={brand}
                                        selectedSubtype={subtype}
                                        selectedSpec={spec}
                                        selectedPrice={selectedPrice}
                                        selectedSort={selectedSort}
                                        minPrice={minPriceStr}
                                        maxPrice={maxPriceStr}
                                        inStock={inStockStr}
                                        searchParams={resolvedParams}
                                        activeFilterCount={activeFilterCount}
                                        totalFound={totalFound}
                                        enableDeepSubtypeSpecFilters={showDeepSubtypeSpecFilters}
                                    />
                                </div>

                                <span className="text-xs sm:text-sm text-[#5B6470] tabular-nums whitespace-nowrap">
                                    {copy.foundPrefix}{' '}
                                    <strong className="font-extrabold text-[#11161B]">{totalFound}</strong>{' '}
                                    {copy.foundSuffix}
                                    {pageCount > 1 && (
                                        <span>
                                            {' '}
                                            · {copy.pageShort} {currentPage}/{pageCount}
                                        </span>
                                    )}
                                </span>

                                {hasActiveFilters && (
                                    <div className="flex flex-wrap items-center gap-1.5">
                                        {brand && (
                                            <Link
                                                href={buildQuery(resolvedParams, { brand: undefined }, locale)}
                                                rel="nofollow"
                                                className="inline-flex items-center gap-1 border border-[#11161B] bg-white px-2 py-0.5 text-xs font-bold text-[#11161B] rounded-none whitespace-nowrap"
                                            >
                                                <span>{matchedBrandObj?.name || brand}</span>
                                                <X className="w-3 h-3" aria-hidden="true" />
                                            </Link>
                                        )}
                                        {category && (
                                            <Link
                                                href={buildQuery(resolvedParams, { category: undefined }, locale)}
                                                rel="nofollow"
                                                className="inline-flex items-center gap-1 border border-[#11161B] bg-white px-2 py-0.5 text-xs font-bold text-[#11161B] rounded-none whitespace-nowrap"
                                            >
                                                <span>
                                                    {localizeCategoryLabel(
                                                        matchedCategoryObj?.name || category,
                                                        locale,
                                                    )}
                                                </span>
                                                <X className="w-3 h-3" aria-hidden="true" />
                                            </Link>
                                        )}
                                        {subtype && (
                                            <Link
                                                href={buildQuery(
                                                    resolvedParams,
                                                    { sub: undefined, subtype: undefined },
                                                    locale,
                                                )}
                                                rel="nofollow"
                                                className="inline-flex items-center gap-1 border border-[#11161B] bg-white px-2 py-0.5 text-xs font-bold text-[#11161B] rounded-none whitespace-nowrap"
                                            >
                                                <span>
                                                    {localizeSubtypeLabel(
                                                        matchedSubtypeObj?.label || subtype,
                                                        locale,
                                                    )}
                                                </span>
                                                <X className="w-3 h-3" aria-hidden="true" />
                                            </Link>
                                        )}
                                        {spec && (
                                            <Link
                                                href={buildQuery(resolvedParams, { spec: undefined }, locale)}
                                                rel="nofollow"
                                                className="inline-flex items-center gap-1 border border-[#11161B] bg-white px-2 py-0.5 text-xs font-bold text-[#11161B] rounded-none whitespace-nowrap"
                                            >
                                                <span>{matchedSpecObj?.label || spec}</span>
                                                <X className="w-3 h-3" aria-hidden="true" />
                                            </Link>
                                        )}
                                        {selectedBoiler && activeBoilerPassport && (
                                            <Link
                                                href={buildQuery(
                                                    resolvedParams,
                                                    { boiler: undefined, boilerGroup: undefined },
                                                    locale,
                                                )}
                                                rel="nofollow"
                                                className="inline-flex items-center gap-1 border border-[#11161B] bg-white px-2 py-0.5 text-xs font-bold text-[#11161B] rounded-none whitespace-nowrap"
                                            >
                                                <span>{activeBoilerPassport.shortChipLabel}</span>
                                                <X className="w-3 h-3" aria-hidden="true" />
                                            </Link>
                                        )}
                                        {searchQuery && (
                                            <Link
                                                href={buildQuery(resolvedParams, { q: undefined }, locale)}
                                                rel="nofollow"
                                                className="inline-flex items-center gap-1 border border-[#11161B] bg-white px-2 py-0.5 text-xs font-bold text-[#11161B] rounded-none whitespace-nowrap"
                                            >
                                                <span>„{searchQuery}“</span>
                                                <X className="w-3 h-3" aria-hidden="true" />
                                            </Link>
                                        )}
                                        <Link
                                            href={`/${locale}/products`}
                                            rel="nofollow"
                                            className="text-xs font-bold text-[#C2410C] hover:underline whitespace-nowrap"
                                        >
                                            {copy.clearShort}
                                        </Link>
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-wrap items-center gap-2 min-w-0 max-w-full">
                                <VatToggle />
                                <div className="flex flex-wrap items-center gap-1 text-xs min-w-0">
                                    <span className="text-[#5B6470] hidden sm:inline">
                                        {copy.sortLabel}
                                    </span>
                                    <Link
                                        href={buildQuery(resolvedParams, { sort: undefined }, locale)}
                                        rel="nofollow"
                                        className={`px-2 py-0.5 border rounded-none bg-transparent whitespace-nowrap ${
                                            !selectedSort
                                                ? 'border-[#11161B] text-[#11161B] font-extrabold'
                                                : 'border-[#D5CFC3] text-[#5B6470]'
                                        }`}
                                    >
                                        {copy.sortPopular}
                                    </Link>
                                    <Link
                                        href={buildQuery(resolvedParams, { sort: 'price-asc' }, locale)}
                                        rel="nofollow"
                                        className={`px-2 py-0.5 border rounded-none bg-transparent whitespace-nowrap ${
                                            selectedSort === 'price-asc'
                                                ? 'border-[#11161B] text-[#11161B] font-extrabold'
                                                : 'border-[#D5CFC3] text-[#5B6470]'
                                        }`}
                                    >
                                        {copy.sortPriceAsc}
                                    </Link>
                                    <Link
                                        href={buildQuery(resolvedParams, { sort: 'price-desc' }, locale)}
                                        rel="nofollow"
                                        className={`px-2 py-0.5 border rounded-none bg-transparent whitespace-nowrap ${
                                            selectedSort === 'price-desc'
                                                ? 'border-[#11161B] text-[#11161B] font-extrabold'
                                                : 'border-[#D5CFC3] text-[#5B6470]'
                                        }`}
                                    >
                                        {copy.sortPriceDesc}
                                    </Link>
                                    <Link
                                        href={buildQuery(resolvedParams, { sort: 'code-asc' }, locale)}
                                        rel="nofollow"
                                        className={`px-2 py-0.5 border rounded-none bg-transparent whitespace-nowrap hidden sm:inline-flex ${
                                            selectedSort === 'code-asc'
                                                ? 'border-[#11161B] text-[#11161B] font-extrabold'
                                                : 'border-[#D5CFC3] text-[#5B6470]'
                                        }`}
                                    >
                                        {copy.sortCodeAsc}
                                    </Link>
                                </div>
                            </div>
                        </div>

                        {/* Katilo / sistemos suderinamumo pasas (Engineering Compatibility Passport Card) */}
                        {activeBoilerPassport && (
                            <section
                                data-testid="boiler-compatibility-passport"
                                aria-label="Katilo / sistemos suderinamumo pasas"
                                className="border-2 border-[#11161B] bg-white p-4 rounded-none space-y-3"
                            >
                                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-3 pb-3 border-b border-[#E2DDD3]">
                                    <div className="space-y-1">
                                        <span className="text-xs font-extrabold text-[#C2410C] block">
                                            Katilo / sistemos suderinamumo pasas · {activeBoilerPassport.groupTitle}
                                        </span>
                                        <span className="inline-block border border-[#11161B] bg-[#F5F3EE] px-2.5 py-0.5 text-xs font-extrabold text-[#11161B]">
                                            {activeBoilerPassport.verificationBadgeLabel}
                                        </span>
                                        <h2 className="text-base sm:text-lg font-extrabold text-[#11161B]">
                                            {activeBoilerPassport.modelTitle}
                                        </h2>
                                        <p className="text-xs text-[#5B6470]">
                                            {activeBoilerPassport.marketShareNote}
                                        </p>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                                        <LocalizedVytautasConsultButton
                                            locale={locale}
                                            prompt={activeBoilerPassport.vytautasPrompt}
                                            title={activeBoilerPassport.modelTitle}
                                            summary={`${totalFound} poz.`}
                                            searchQuery={activeBoilerPassport.shortChipLabel}
                                            resultCount={totalFound}
                                        />
                                        <Link
                                            href={buildQuery(
                                                resolvedParams,
                                                { boiler: undefined, boilerGroup: undefined },
                                                locale,
                                            )}
                                            rel="nofollow"
                                            className="inline-flex h-10 items-center px-3 border border-[#D5CFC3] bg-transparent text-xs font-bold text-[#11161B] hover:border-[#11161B] rounded-none whitespace-nowrap"
                                        >
                                            {copy.clearShort}
                                        </Link>
                                    </div>
                                </div>

                                <p className="text-xs sm:text-sm font-semibold text-[#11161B] leading-relaxed">
                                    {activeBoilerPassport.conversionOrUpgradeSummary}
                                </p>

                                <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-[#E2DDD3] text-xs">
                                    <div>
                                        <dt className="font-bold text-[#5B6470]">
                                            Rekomenduojamas degiklis / mazgas
                                        </dt>
                                        <dd className="font-extrabold text-[#11161B] mt-0.5">
                                            {activeBoilerPassport.recommendedSpecs.burnerKw}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className="font-bold text-[#5B6470]">
                                            Rekomenduojama akumuliacinė talpa
                                        </dt>
                                        <dd className="font-extrabold text-[#11161B] mt-0.5">
                                            {activeBoilerPassport.recommendedSpecs.bufferTankLiters}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className="font-bold text-[#5B6470]">
                                            Apsauginis / pamaišymo mazgas
                                        </dt>
                                        <dd className="font-extrabold text-[#11161B] mt-0.5">
                                            {activeBoilerPassport.recommendedSpecs.anticondensationValve} (
                                            {activeBoilerPassport.recommendedSpecs.flueOrConnection})
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className="font-bold text-[#5B6470]">
                                            Dažniausiai keičiamos dalys
                                        </dt>
                                        <dd className="font-extrabold text-[#11161B] mt-0.5">
                                            {activeBoilerPassport.recommendedSpecs.typicalSpareParts}
                                        </dd>
                                    </div>
                                </dl>
                            </section>
                        )}

                        {/* Dynamic Subcategory / Product-Type Drill-Down Bar above product grid */}
                        {dynamicSubcategories.length > 0 && (
                            <section
                                data-testid="catalog-subcategory-bar"
                                aria-label={copy.subcategoryHeading}
                                className="border border-[#E2DDD3] bg-white p-3 rounded-none space-y-2"
                            >
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-xs font-extrabold text-[#11161B]">
                                        {copy.subcategoryHeading}
                                    </span>
                                    {subtype && (
                                        <Link
                                            href={buildQuery(
                                                resolvedParams,
                                                { sub: undefined, subtype: undefined },
                                                locale,
                                            )}
                                            rel="nofollow"
                                            className="text-xs font-bold text-[#C2410C] hover:underline whitespace-nowrap"
                                        >
                                            {copy.clearShort}
                                        </Link>
                                    )}
                                </div>
                                <div className="flex flex-wrap items-center gap-1.5">
                                    {dynamicSubcategories.map((subItem) => {
                                        const isAllSub = subItem.slug === 'all';
                                        const active = isAllSub
                                            ? !subtype
                                            : subtype?.toLowerCase() === subItem.slug.toLowerCase();
                                        const href = buildQuery(
                                            resolvedParams,
                                            {
                                                sub: isAllSub || active ? undefined : subItem.slug,
                                                subtype: undefined,
                                            },
                                            locale,
                                        );
                                        return (
                                            <Link
                                                key={subItem.slug}
                                                href={href}
                                                rel="nofollow"
                                                data-testid={`subcategory-chip-${subItem.slug}`}
                                                className={`inline-flex items-center gap-1 px-2 py-1 text-[11px] sm:text-xs font-bold whitespace-nowrap rounded-none border transition-colors ${
                                                    active
                                                        ? 'border-[#11161B] bg-[#11161B] text-white'
                                                        : 'border-[#D5CFC3] bg-[#F5F3EE] text-[#11161B] hover:border-[#C2410C] hover:text-[#C2410C]'
                                                }`}
                                            >
                                                <span>{subItem.label}</span>
                                                <span
                                                    className={`tabular-nums font-semibold shrink-0 ${
                                                        active ? 'text-[#FF8A3D]' : 'text-[#5B6470]'
                                                    }`}
                                                >
                                                    ({subItem.count})
                                                </span>
                                            </Link>
                                        );
                                    })}
                                </div>
                            </section>
                        )}

                        {runtimeConfig.features.instantAiSearch && (searchQuery || category || subtype || spec) && (
                            <div className="border border-[#E2DDD3] bg-white p-3.5 rounded-none flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                                <div>
                                    <span className="text-xs font-extrabold text-[#C2410C] block">
                                        {copy.aiSelectionBadge(agentName, totalFound)}
                                    </span>
                                    <p className="text-xs text-[#2A323B] mt-0.5">
                                        {searchQuery
                                            ? copy.aiSearchNote(searchQuery, agentName)
                                            : copy.aiGroupNote(activeHeading, totalFound)}
                                    </p>
                                </div>
                                <LocalizedVytautasConsultButton
                                    locale={locale}
                                    prompt={copy.aiConsultPrompt(activeHeading, searchQuery, totalFound)}
                                    title={copy.aiConsultTitle(activeHeading)}
                                    summary={copy.aiConsultSummary(totalFound)}
                                    searchQuery={searchQuery}
                                    resultCount={totalFound}
                                />
                            </div>
                        )}

                        {/* Flush Hairline Product Matrix */}
                        <main>
                            {productsList.length > 0 ? (
                                <>
                                    <ProductGridClient products={productsList} />

                                    {pageCount > 1 && (
                                        <nav
                                            aria-label="pagination"
                                            className="mt-8 flex items-center justify-center gap-1.5 text-sm"
                                        >
                                            {currentPage > 1 && (
                                                <Link
                                                    href={buildPageUrl(resolvedParams, currentPage - 1, locale)}
                                                    className="px-4 py-2 border border-[#D5CFC3] bg-white rounded-none hover:border-[#11161B] font-semibold whitespace-nowrap"
                                                    rel="prev nofollow"
                                                >
                                                    {copy.prevPage}
                                                </Link>
                                            )}
                                            {Array.from({ length: pageCount }, (_, i) => i + 1)
                                                .filter(
                                                    (p) =>
                                                        p === 1 ||
                                                        p === pageCount ||
                                                        Math.abs(p - currentPage) <= 1,
                                                )
                                                .map((p, idx, arr) => (
                                                    <span key={p} className="flex items-center gap-1.5">
                                                        {idx > 0 && arr[idx - 1] !== p - 1 && (
                                                            <span aria-hidden="true">…</span>
                                                        )}
                                                        <Link
                                                            href={buildPageUrl(resolvedParams, p, locale)}
                                                            rel="nofollow"
                                                            aria-current={p === currentPage ? 'page' : undefined}
                                                            className={`min-w-[38px] px-3 py-2 text-center border rounded-none transition-colors ${
                                                                p === currentPage
                                                                    ? 'border-[#11161B] bg-[#11161B] text-white font-bold'
                                                                    : 'border-[#D5CFC3] bg-white hover:border-[#11161B]'
                                                            }`}
                                                        >
                                                            {p}
                                                        </Link>
                                                    </span>
                                                ))}
                                            {currentPage < pageCount && (
                                                <Link
                                                    href={buildPageUrl(resolvedParams, currentPage + 1, locale)}
                                                    className="px-4 py-2 border border-[#D5CFC3] bg-white rounded-none hover:border-[#11161B] font-semibold whitespace-nowrap"
                                                    rel="next nofollow"
                                                >
                                                    {copy.nextPage}
                                                </Link>
                                            )}
                                        </nav>
                                    )}
                                </>
                            ) : (
                                <div className="py-14 px-6 text-center bg-white rounded-none border border-[#E2DDD3] space-y-3">
                                    <PackageSearch
                                        className="w-10 h-10 text-[#5B6470] mx-auto"
                                        strokeWidth={1.5}
                                        aria-hidden="true"
                                    />
                                    <h3 className="text-lg font-extrabold text-[#11161B]">
                                        {copy.emptyHeading}
                                    </h3>
                                    <p className="text-[#5B6470] text-sm max-w-md mx-auto">
                                        {withCount(copy.emptyBody)}
                                    </p>
                                    <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                                        <Link
                                            href={`/${locale}/products`}
                                            rel="nofollow"
                                            className="inline-flex h-11 items-center justify-center rounded-none bg-[#11161B] px-6 text-xs font-bold text-white hover:bg-[#C2410C] whitespace-nowrap"
                                        >
                                            {copy.clearFilters}
                                        </Link>
                                        <Link
                                            href={`/${locale}/uzklausa`}
                                            className="inline-flex h-11 items-center justify-center rounded-none border border-[#11161B] bg-white px-6 text-xs font-bold text-[#11161B] whitespace-nowrap"
                                        >
                                            {copy.askEngineer}
                                        </Link>
                                    </div>
                                </div>
                            )}
                        </main>

                        {/* Bottom Project & Complectation Offer Strip (Artboard #4 #FBEADF) */}
                        <div
                            data-testid="catalog-project-complectation-banner"
                            className="mt-6 rounded-none border border-[#E2DDD3] bg-[#FBEADF] p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                        >
                            <div>
                                <span className="text-base font-extrabold text-[#5A1F05] block">
                                    {copy.b2bHeading}
                                </span>
                                <p className="text-xs sm:text-sm text-[#6E2A0A] mt-0.5 max-w-3xl">
                                    {copy.b2bBody}
                                </p>
                            </div>
                            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                                <Link
                                    href={`/${locale}/uzklausa`}
                                    className="inline-flex items-center justify-center rounded-none bg-[#C2410C] hover:bg-[#9A3412] px-4 py-3 text-xs font-bold text-white whitespace-nowrap transition-colors"
                                >
                                    {copy.b2bConsultCta}
                                </Link>
                                <Link
                                    href={`/${locale}/b2b`}
                                    className="inline-flex items-center justify-center rounded-none bg-[#11161B] hover:bg-[#C2410C] px-4 py-3 text-xs font-bold text-white whitespace-nowrap transition-colors"
                                >
                                    {copy.b2bCta}
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
