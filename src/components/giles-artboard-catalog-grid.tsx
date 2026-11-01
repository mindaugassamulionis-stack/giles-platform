'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Check, Heart, Scale } from 'lucide-react';
import { useLocale } from 'next-intl';
import { useCartStore } from '../store/cart';
import { useWishlistStore, useWishlistHydration } from '../store/wishlist';
import { useCompareStore, useCompareHydration } from '../store/compare';
import { useVatDisplayStore } from '../store/vat-display';
import { assetUrl } from '../lib/api';
import { STOREFRONT_STOCK_COPY, resolveAppLocale } from '../i18n/storefront-ui-copy';
import { useStorefrontConfig } from './storefront-config-provider';
import { formatCatalogCount } from '../lib/w121-honest-commerce';
import type { AppLocale } from '../i18n/routing';

export type CatalogFilterGroupId =
    | 'all'
    | 'burners'
    | 'boilers_hp'
    | 'tanks'
    | 'radiators'
    | 'thermostatics'
    | 'underfloor'
    | 'spares';

export interface ArtboardCatalogCellItem {
    id: string;
    slug?: string | null;
    sku: string;
    filterGroup?: CatalogFilterGroupId;
    categoryTag: string;
    title: string;
    specs: [string, string, string];
    priceGrossEur: number;
    imageUrl: string;
}

export const ARTBOARD_1_FLAGSHIP_CELLS: ArtboardCatalogCellItem[] = [
    {
        id: 'mpb-nani-35',
        slug: 'mpb-nani-35',
        sku: 'MPB-NANI-35',
        filterGroup: 'burners',
        categoryTag: 'Granulių degikliai',
        title: 'Granulių degiklio komplektas Megatherm MPB NANI 8–35 kW su sraigtu',
        specs: ['5–35 kW', 'A+', 'Ø90 mm'],
        priceGrossEur: 2350.0,
        imageUrl: '/images/products/giles-studio-01-mpb-nani-35-50.webp',
    },
    {
        id: 'kat-25kw-gi',
        slug: 'kat-25kw-gi',
        sku: 'KAT-25KW-GI',
        filterGroup: 'boilers_hp',
        categoryTag: 'Kieto kuro katilai',
        title: 'Plieninis kieto kuro ir granulių katilas KaTRI 25 kW (6 mm plienas)',
        specs: ['25 kW', 'A+', '6 mm P265GH'],
        priceGrossEur: 1750.0,
        imageUrl: '/images/products/giles-studio-25-katri-25kw-pellet-boiler.webp',
    },
    {
        id: 'zv-100-gorenje',
        slug: 'zv-100',
        sku: 'ZV 100',
        filterGroup: 'tanks',
        categoryTag: 'Akumuliacinės talpos',
        title: 'Kombinuotas vandens šildytuvas ir akumuliacinė talpa Gorenje ZV 100 L',
        specs: ['100 L', 'PN6 bar', 'G 3/4"'],
        priceGrossEur: 289.0,
        imageUrl: '/images/products/giles-studio-27-centrometal-cas-1001-buffer.webp',
    },
    {
        id: 'haier-r290-aw082',
        slug: 'aw082hugha',
        sku: 'AW082HUGHA',
        filterGroup: 'boilers_hp',
        categoryTag: 'Šilumos siurbliai',
        title: 'Oras–vanduo šilumos siurblys Haier Super Aqua Monoblock R290 8 kW',
        specs: ['8,0 kW', 'A+++', 'R290 iki +75 °C'],
        priceGrossEur: 3490.0,
        imageUrl: '/images/products/giles-studio-21-haier-super-aqua-r290.webp',
    },
    {
        id: 'pelltech-pv30b',
        slug: 'pv-30b',
        sku: 'PV-30B',
        filterGroup: 'burners',
        categoryTag: 'Granulių degikliai',
        title: 'Granulių degiklis Pelltech PV 30b su savaiminiu ardelių valymu',
        specs: ['10–30 kW', 'A+', 'Auto-valymas'],
        priceGrossEur: 2190.0,
        imageUrl: '/images/products/giles-studio-05-pelltech-pv20a-kit.webp',
    },
    {
        id: 'herz-teplomix-dn25',
        slug: '1776603',
        sku: '1776603',
        filterGroup: 'spares',
        categoryTag: 'Katilinės armatūra',
        title: 'Termostatinis grįžtamo srauto pamaišymo vožtuvas HERZ Teplomix DN25',
        specs: ['DN25 (1")', '55–61 °C', 'Kvs 11,0'],
        priceGrossEur: 94.0,
        imageUrl: '/images/products/giles-studio-29-solar-ssv-station-kit.webp',
    },
    {
        id: 'imi-dynacon-8',
        slug: '9330-08.800',
        sku: '9330-08.800',
        filterGroup: 'underfloor',
        categoryTag: 'Grindinis šildymas',
        title: 'Grindinio šildymo kolektorius IMI Heimeier Dynacon Eclipse 8 kontūrų',
        specs: ['8 kontūrai', 'AFC l/h', 'DN25 Inox'],
        priceGrossEur: 318.0,
        imageUrl: '/images/products/9330-08.800.webp',
    },
    {
        id: 'danfoss-ra-2990',
        slug: '013g2990',
        sku: '013G2990',
        filterGroup: 'thermostatics',
        categoryTag: 'Termostatika ir vožtuvai',
        title: 'Termostatinė radiatoriaus galvutė Danfoss RA 2990 su dujiniu jutikliu',
        specs: ['RA Click', '5–26 °C', 'EN 215'],
        priceGrossEur: 24.9,
        imageUrl: '/images/products/013g2990.webp',
    },
    {
        id: 'ferroli-pol-500-10s',
        slug: 'pol-500-10s',
        sku: 'POL-500-10S',
        filterGroup: 'radiators',
        categoryTag: 'Radiatoriai ir šildymo prietaisai',
        title: 'Sekcijinis aliumininis radiatorius Ferroli POL 500 – 10 sekcijų komplektas (1200 W)',
        specs: ['500 mm', '1200 W', 'PN16 bar'],
        priceGrossEur: 130.3,
        imageUrl: '/images/products/0381-01.000.webp',
    },
];

interface LocalizedGridItemTranslation {
    categoryTag: string;
    title: string;
    specs: [string, string, string];
}

const GRID_I18N: Record<
    AppLocale,
    {
        sectionAria: string;
        kicker: string;
        heading: string;
        subtitle: string;
        priceDisplayAria: string;
        vatGross: string;
        vatNet: string;
        openCatalogBtn: string;
        filterTabsAria: string;
        tabs: Record<CatalogFilterGroupId, string>;
        items: Record<string, LocalizedGridItemTranslation>;
    }
> = {
    lt: {
        sectionAria: '03 / El. parduotuvė – Katilai, degikliai ir katilinės armatūra ({count} pozicijos)',
        kicker: '03 / El. parduotuvė',
        heading: 'Katilai, degikliai ir katilinės armatūra ({count} pozicijos)',
        subtitle:
            'Tiesioginis tiekimas iš Kauno ir Vilniaus sandėlių. Visos kainos pateikiamos su PVM ir be PVM montuotojams.',
        priceDisplayAria: 'Kainų rodymas',
        vatGross: 'Su PVM',
        vatNet: 'Be PVM',
        openCatalogBtn: 'Atidaryti visą katalogą ({count})',
        filterTabsAria: 'Katalogo kategorijų filtrai',
        tabs: {
            all: 'Visos {count} prekės',
            burners: 'Granulių degikliai',
            boilers_hp: 'Katilai ir šilumos siurbliai',
            tanks: 'Akumuliacinės talpos ir boileriai',
            radiators: 'Radiatoriai ir šildymo prietaisai',
            thermostatics: 'Termostatika ir vožtuvai',
            underfloor: 'Grindinis šildymas',
            spares: 'Atsarginės dalys',
        },
        items: {
            'mpb-nani-35': {
                categoryTag: 'Granulių degikliai',
                title: 'Granulių degiklio komplektas Megatherm MPB NANI 8–35 kW su sraigtu',
                specs: ['5–35 kW', 'A+', 'Ø90 mm'],
            },
            'kat-25kw-gi': {
                categoryTag: 'Kieto kuro katilai',
                title: 'Plieninis kieto kuro ir granulių katilas KaTRI 25 kW (6 mm plienas)',
                specs: ['25 kW', 'A+', '6 mm P265GH'],
            },
            'zv-100-gorenje': {
                categoryTag: 'Akumuliacinės talpos',
                title: 'Kombinuotas vandens šildytuvas ir akumuliacinė talpa Gorenje ZV 100 L',
                specs: ['100 L', 'PN6 bar', 'G 3/4"'],
            },
            'haier-r290-aw082': {
                categoryTag: 'Šilumos siurbliai',
                title: 'Oras–vanduo šilumos siurblys Haier Super Aqua Monoblock R290 8 kW',
                specs: ['8,0 kW', 'A+++', 'R290 iki +75 °C'],
            },
            'pelltech-pv30b': {
                categoryTag: 'Granulių degikliai',
                title: 'Granulių degiklis Pelltech PV 30b su savaiminiu ardelių valymu',
                specs: ['10–30 kW', 'A+', 'Auto-valymas'],
            },
            'herz-teplomix-dn25': {
                categoryTag: 'Katilinės armatūra',
                title: 'Termostatinis grįžtamo srauto pamaišymo vožtuvas HERZ Teplomix DN25',
                specs: ['DN25 (1")', '55–61 °C', 'Kvs 11,0'],
            },
            'imi-dynacon-8': {
                categoryTag: 'Grindinis šildymas',
                title: 'Grindinio šildymo kolektorius IMI Heimeier Dynacon Eclipse 8 kontūrų',
                specs: ['8 kontūrai', 'AFC l/h', 'DN25 Inox'],
            },
            'danfoss-ra-2990': {
                categoryTag: 'Termostatika ir vožtuvai',
                title: 'Termostatinė radiatoriaus galvutė Danfoss RA 2990 su dujiniu jutikliu',
                specs: ['RA Click', '5–26 °C', 'EN 215'],
            },
        },
    },
    en: {
        sectionAria: '03 / Online Store – Boilers, Pellet Burners & Hydronic Components ({count} items)',
        kicker: '03 / Online Store',
        heading: 'Boilers, Pellet Burners & Hydronic Components ({count} items)',
        subtitle:
            'Direct supply from our Kaunas and Vilnius warehouses. Prices displayed including and excluding VAT for installers.',
        priceDisplayAria: 'Price display mode',
        vatGross: 'Incl. VAT',
        vatNet: 'Excl. VAT',
        openCatalogBtn: 'Open Full Catalog ({count})',
        filterTabsAria: 'Catalog category filters',
        tabs: {
            all: 'All {count} items',
            burners: 'Pellet Burners',
            boilers_hp: 'Boilers & Heat Pumps',
            tanks: 'Buffer Tanks & Cylinders',
            radiators: 'Radiators & Heating Units',
            thermostatics: 'Thermostatics & Valves',
            underfloor: 'Underfloor Heating',
            spares: 'Spare Parts & Fittings',
        },
        items: {
            'mpb-nani-35': {
                categoryTag: 'Pellet Burners',
                title: 'Megatherm MPB NANI 8–35 kW Pellet Burner Kit with Feed Auger',
                specs: ['5–35 kW', 'A+', 'Ø90 mm'],
            },
            'kat-25kw-gi': {
                categoryTag: 'Solid-Fuel Boilers',
                title: 'KaTRI 25 kW Steel Solid-Fuel & Pellet Boiler (6 mm P265GH Steel)',
                specs: ['25 kW', 'A+', '6 mm P265GH'],
            },
            'zv-100-gorenje': {
                categoryTag: 'Buffer Tanks & Cylinders',
                title: 'Gorenje ZV 100 L Combined Water Heater & Buffer Tank',
                specs: ['100 L', 'PN6 bar', 'G 3/4"'],
            },
            'haier-r290-aw082': {
                categoryTag: 'Heat Pumps',
                title: 'Haier Super Aqua Monoblock R290 8 kW Air-to-Water Heat Pump',
                specs: ['8.0 kW', 'A+++', 'R290 up to +75 °C'],
            },
            'pelltech-pv30b': {
                categoryTag: 'Pellet Burners',
                title: 'Pelltech PV 30b Pellet Burner with Self-Cleaning Grate',
                specs: ['10–30 kW', 'A+', 'Self-cleaning'],
            },
            'herz-teplomix-dn25': {
                categoryTag: 'Boiler Room Valves',
                title: 'HERZ Teplomix DN25 Thermostatic Return-Temperature Mixing Valve',
                specs: ['DN25 (1")', '55–61 °C', 'Kvs 11.0'],
            },
            'imi-dynacon-8': {
                categoryTag: 'Underfloor Heating',
                title: 'IMI Heimeier Dynacon Eclipse 8-Loop Underfloor Heating Manifold',
                specs: ['8 loops', 'AFC l/h', 'DN25 Inox'],
            },
            'danfoss-ra-2990': {
                categoryTag: 'Thermostatics & Valves',
                title: 'Danfoss RA 2990 Thermostatic Radiator Head with Gas-Filled Sensor',
                specs: ['RA Click', '5–26 °C', 'EN 215'],
            },
        },
    },
    pl: {
        sectionAria: '03 / Sklep internetowy – Kotły, palniki i armatura kotłowni ({count} pozycji)',
        kicker: '03 / Sklep internetowy',
        heading: 'Kotły, palniki i armatura kotłowni ({count} pozycji)',
        subtitle:
            'Bezpośrednia dostawa z magazynów w Kownie i Wilnie. Ceny podane z VAT oraz bez VAT dla instalatorów.',
        priceDisplayAria: 'Tryb wyświetlania cen',
        vatGross: 'Z VAT',
        vatNet: 'Bez VAT',
        openCatalogBtn: 'Otwórz pełny katalog ({count})',
        filterTabsAria: 'Filtry kategorii katalogu',
        tabs: {
            all: 'Wszystkie {count} produktów',
            burners: 'Palniki peletowe',
            boilers_hp: 'Kotły i pompy ciepła',
            tanks: 'Zbiorniki buforowe i bojlery',
            radiators: 'Grzejniki i urządzenia grzewcze',
            thermostatics: 'Termostatyka i zawory',
            underfloor: 'Ogrzewanie podłogowe',
            spares: 'Części zamienne',
        },
        items: {
            'mpb-nani-35': {
                categoryTag: 'Palniki peletowe',
                title: 'Zestaw palnika peletowego Megatherm MPB NANI 8–35 kW z podajnikiem',
                specs: ['5–35 kW', 'A+', 'Ø90 mm'],
            },
            'kat-25kw-gi': {
                categoryTag: 'Kotły stałopalne',
                title: 'Stalowy kocioł na paliwo stałe i pellet KaTRI 25 kW (stal 6 mm)',
                specs: ['25 kW', 'A+', '6 mm P265GH'],
            },
            'zv-100-gorenje': {
                categoryTag: 'Zbiorniki buforowe',
                title: 'Kombinowany ogrzewacz wody i zbiornik buforowy Gorenje ZV 100 L',
                specs: ['100 L', 'PN6 bar', 'G 3/4"'],
            },
            'haier-r290-aw082': {
                categoryTag: 'Pompy ciepła',
                title: 'Pompa ciepła powietrze–woda Haier Super Aqua Monoblock R290 8 kW',
                specs: ['8,0 kW', 'A+++', 'R290 do +75 °C'],
            },
            'pelltech-pv30b': {
                categoryTag: 'Palniki peletowe',
                title: 'Palnik peletowy Pelltech PV 30b z automatycznym czyszczeniem rusztu',
                specs: ['10–30 kW', 'A+', 'Samoczyszczenie'],
            },
            'herz-teplomix-dn25': {
                categoryTag: 'Armatura kotłowni',
                title: 'Termostatyczny zawór mieszający ochrony powrotu HERZ Teplomix DN25',
                specs: ['DN25 (1")', '55–61 °C', 'Kvs 11,0'],
            },
            'imi-dynacon-8': {
                categoryTag: 'Ogrzewanie podłogowe',
                title: 'Rozdzielacz ogrzewania podłogowego IMI Heimeier Dynacon Eclipse 8 obiegów',
                specs: ['8 obiegów', 'AFC l/h', 'DN25 Inox'],
            },
            'danfoss-ra-2990': {
                categoryTag: 'Termostatyka i zawory',
                title: 'Głowica termostatyczna grzejnikowa Danfoss RA 2990 z czujnikiem gazowym',
                specs: ['RA Click', '5–26 °C', 'EN 215'],
            },
        },
    },
    ru: {
        sectionAria: '03 / Интернет-магазин – Котлы, горелки и арматура котельных ({count} позиций)',
        kicker: '03 / Интернет-магазин',
        heading: 'Котлы, горелки и арматура котельных ({count} позиций)',
        subtitle:
            'Прямые поставки со складов в Каунасе и Вильнюсе. Цены указаны с НДС и без НДС для монтажников.',
        priceDisplayAria: 'Режим отображения цен',
        vatGross: 'С НДС',
        vatNet: 'Без НДС',
        openCatalogBtn: 'Открыть весь каталог ({count})',
        filterTabsAria: 'Фильтры категорий каталога',
        tabs: {
            all: 'Все {count} товаров',
            burners: 'Пеллетные горелки',
            boilers_hp: 'Котлы и тепловые насосы',
            tanks: 'Буферные емкости и бойлеры',
            radiators: 'Радиаторы и отопительные приборы',
            thermostatics: 'Термостатика и клапаны',
            underfloor: 'Теплый пол',
            spares: 'Запчасти и арматура',
        },
        items: {
            'mpb-nani-35': {
                categoryTag: 'Пеллетные горелки',
                title: 'Комплект пеллетной горелки Megatherm MPB NANI 8–35 кВт со шнеком',
                specs: ['5–35 кВт', 'A+', 'Ø90 мм'],
            },
            'kat-25kw-gi': {
                categoryTag: 'Твердотопливные котлы',
                title: 'Стальной твердотопливный и пеллетный котел KaTRI 25 кВт (сталь 6 мм)',
                specs: ['25 кВт', 'A+', '6 мм P265GH'],
            },
            'zv-100-gorenje': {
                categoryTag: 'Буферные емкости',
                title: 'Комбинированный водонагреватель и буферная емкость Gorenje ZV 100 л',
                specs: ['100 л', 'PN6 бар', 'G 3/4"'],
            },
            'haier-r290-aw082': {
                categoryTag: 'Тепловые насосы',
                title: 'Тепловой насос воздух–вода Haier Super Aqua Monoblock R290 8 кВт',
                specs: ['8,0 кВт', 'A+++', 'R290 до +75 °C'],
            },
            'pelltech-pv30b': {
                categoryTag: 'Пеллетные горелки',
                title: 'Пеллетная горелка Pelltech PV 30b с автоматической очисткой колосников',
                specs: ['10–30 кВт', 'A+', 'Автоочистка'],
            },
            'herz-teplomix-dn25': {
                categoryTag: 'Арматура котельной',
                title: 'Термостатический смесительный клапан обратки HERZ Teplomix DN25',
                specs: ['DN25 (1")', '55–61 °C', 'Kvs 11,0'],
            },
            'imi-dynacon-8': {
                categoryTag: 'Теплый пол',
                title: 'Коллектор теплого пола IMI Heimeier Dynacon Eclipse на 8 контуров',
                specs: ['8 контуров', 'AFC л/ч', 'DN25 Inox'],
            },
            'danfoss-ra-2990': {
                categoryTag: 'Термостатика и клапаны',
                title: 'Термостатическая головка Danfoss RA 2990 с газоконденсатным датчиком',
                specs: ['RA Click', '5–26 °C', 'EN 215'],
            },
        },
    },
};

const FILTER_GROUP_ORDER: CatalogFilterGroupId[] = [
    'all',
    'burners',
    'boilers_hp',
    'tanks',
    'radiators',
    'thermostatics',
    'underfloor',
    'spares',
];

export function GilesArtboardCatalogGrid({
    items = ARTBOARD_1_FLAGSHIP_CELLS,
    locale: propLocale,
}: {
    items?: ArtboardCatalogCellItem[];
    locale?: AppLocale;
}) {
    const intlLocale = useLocale() || 'lt';
    const rawPathname = usePathname() || '';
    const urlMatch = rawPathname.match(/^\/(lt|en|pl|ru)(?=\/|$)/i);
    const locale = resolveAppLocale(propLocale || (urlMatch ? urlMatch[1] : intlLocale));
    const hdr = GRID_I18N[locale];
    // W121-A2: live SKU count replaces the hardcoded catalog size.
    const catalogCountLabel = formatCatalogCount(
        useStorefrontConfig().catalog?.skuCount ?? 0,
        locale,
    );
    const sectionAria = hdr.sectionAria.replaceAll('{count}', catalogCountLabel);
    const heading = hdr.heading.replaceAll('{count}', catalogCountLabel);
    const openCatalogBtn = hdr.openCatalogBtn.replaceAll('{count}', catalogCountLabel);
    const tabAllLabel = hdr.tabs.all.replaceAll('{count}', catalogCountLabel);
    const stockCopy = STOREFRONT_STOCK_COPY[locale];
    const { showNet, setShowNet } = useVatDisplayStore();
    const [addedId, setAddedId] = useState<string | null>(null);
    const [activeFilter, setActiveFilter] = useState<CatalogFilterGroupId>('all');
    const addItem = useCartStore((state) => state.addItem);
    const openCart = useCartStore((state) => state.openCart);
    const toggleWishlist = useWishlistStore((state) => state.toggleItem);
    const hasWishlist = useWishlistStore((state) => state.hasItem);
    const wishlistHydrated = useWishlistHydration();
    const toggleCompare = useCompareStore((state) => state.toggleCompareItem);
    const hasCompare = useCompareStore((state) => state.hasItem);
    const compareHydrated = useCompareHydration();

    const visibleItems =
        activeFilter === 'all'
            ? items.slice(0, 8)
            : items.filter((item) => item.filterGroup === activeFilter);

    const handleAdd = (item: ArtboardCatalogCellItem, localizedTitle: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setAddedId(item.id);
        addItem({
            id: item.id,
            productId: item.id,
            name: localizedTitle,
            price: item.priceGrossEur,
            sku: item.sku,
            quantity: 1,
            image: item.imageUrl,
        });
        setTimeout(() => {
            setAddedId((prev) => (prev === item.id ? null : prev));
            openCart();
        }, 350);
    };

    return (
        <section
            data-testid="home-artboard-eshop-grid"
            aria-label={sectionAria}
            className="py-12 md:py-16 bg-[#F5F3EE] border-b border-[#E2DDD3]"
        >
            <div className="mx-auto max-w-7xl px-4 sm:px-6 space-y-6">
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
                    <div className="space-y-1.5 max-w-2xl">
                        <span className="tabular-nums text-xs font-bold text-[#C2410C] block">
                            {hdr.kicker}
                        </span>
                        <h2 className="text-2xl md:text-4xl font-extrabold text-[#11161B] leading-tight">
                            {heading}
                        </h2>
                        <p className="text-sm text-[#5B6470]">
                            {hdr.subtitle}
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 shrink-0">
                        <div
                            role="group"
                            aria-label={hdr.priceDisplayAria}
                            className="inline-flex border border-[#D5CFC3] bg-[#EEEBE4] p-0.5 rounded-none"
                        >
                            <button
                                type="button"
                                onClick={() => setShowNet(false)}
                                aria-pressed={!showNet}
                                className={`px-3 py-1.5 text-xs font-bold cursor-pointer whitespace-nowrap transition-colors ${
                                    !showNet
                                        ? 'bg-[#11161B] text-white'
                                        : 'bg-transparent text-[#11161B]'
                                }`}
                            >
                                {hdr.vatGross}
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowNet(true)}
                                aria-pressed={showNet}
                                className={`px-3 py-1.5 text-xs font-bold cursor-pointer whitespace-nowrap transition-colors ${
                                    showNet
                                        ? 'bg-[#11161B] text-white'
                                        : 'bg-transparent text-[#11161B]'
                                }`}
                            >
                                {hdr.vatNet}
                            </button>
                        </div>

                        <Link
                            href={`/${locale}/products`}
                            className="inline-flex items-center border border-[#11161B] bg-[#11161B] hover:bg-[#C2410C] hover:border-[#C2410C] px-4 py-2 text-xs font-bold text-white whitespace-nowrap transition-colors rounded-none"
                        >
                            {openCatalogBtn}
                        </Link>
                    </div>
                </div>

                <div
                    role="tablist"
                    aria-label={hdr.filterTabsAria}
                    className="flex flex-wrap gap-1.5"
                >
                    {FILTER_GROUP_ORDER.map((groupId) => {
                        const selected = activeFilter === groupId;
                        return (
                            <button
                                key={groupId}
                                type="button"
                                role="tab"
                                aria-selected={selected}
                                onClick={() => setActiveFilter(groupId)}
                                className={`border px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer whitespace-nowrap rounded-none ${
                                    selected
                                        ? 'border-[#11161B] bg-[#11161B] text-white'
                                        : 'border-[#D5CFC3] bg-white text-[#11161B] hover:border-[#11161B]'
                                }`}
                            >
                                {groupId === 'all' ? tabAllLabel : hdr.tabs[groupId]}
                            </button>
                        );
                    })}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border-t border-l border-[#E2DDD3]">
                    {visibleItems.map((item, idx) => {
                        const itemTranslation = hdr.items[item.id];
                        const localizedCategory = itemTranslation?.categoryTag || item.categoryTag;
                        const localizedTitle = itemTranslation?.title || item.title;
                        const localizedSpecs = itemTranslation?.specs || item.specs;

                        const displayedEur = showNet
                            ? item.priceGrossEur / 1.21
                            : item.priceGrossEur;
                        const formattedPrice = `${displayedEur
                            .toFixed(2)
                            .replace('.', ',')
                            .replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} €`;
                        const secondaryEur = showNet
                            ? item.priceGrossEur
                            : item.priceGrossEur / 1.21;
                        const secondaryFormatted = `${secondaryEur
                            .toFixed(2)
                            .replace('.', ',')
                            .replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} € ${showNet ? stockCopy.vatGrossShort : stockCopy.vatNetShort}`;
                        const isAdded = addedId === item.id;
                        const isCompared = compareHydrated && hasCompare(item.id);
                        const compareBtnLabel = isCompared
                            ? locale === 'en'
                                ? 'Comparing'
                                : locale === 'pl'
                                  ? 'W porównaniu'
                                  : locale === 'ru'
                                    ? 'В сравнении'
                                    : 'Lyginama'
                            : locale === 'en'
                              ? 'Compare'
                              : locale === 'pl'
                                ? 'Porównaj'
                                : locale === 'ru'
                                  ? 'Сравнить'
                                  : 'Palyginti';

                        return (
                            <article
                                key={item.id}
                                data-testid="artboard-hairline-cell"
                                className="flex flex-col justify-between border-r border-b border-[#E2DDD3] bg-[#FFFFFF] p-5 rounded-none transition-colors hover:bg-[#FAF8F5]"
                            >
                                <div className="space-y-3">
                                    <div className="flex items-center justify-end gap-2 text-xs">
                                        <span
                                            className={`${idx < 4 ? 'font-mono' : 'tabular-nums'} font-bold text-[#5B6470]`}
                                        >
                                            {item.sku}
                                        </span>
                                    </div>

                                    <div className="relative aspect-square bg-[#EEEBE4] p-4 flex items-center justify-center overflow-hidden rounded-none">
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                toggleWishlist({
                                                    id: item.id,
                                                    sku: item.sku,
                                                    name: localizedTitle,
                                                    price: item.priceGrossEur,
                                                    image: item.imageUrl,
                                                    categoryName: localizedCategory,
                                                });
                                            }}
                                            aria-label="Įsiminti prekę"
                                            aria-pressed={wishlistHydrated && hasWishlist(item.id)}
                                            className={`absolute top-2 right-2 z-10 flex h-8 w-8 items-center justify-center border border-[#D5CFC3] bg-white/95 rounded-none transition-colors cursor-pointer ${
                                                wishlistHydrated && hasWishlist(item.id)
                                                    ? 'text-[#C2410C] border-[#C2410C]'
                                                    : 'text-[#5B6470] hover:text-[#C2410C] hover:border-[#C2410C]'
                                            }`}
                                        >
                                            <Heart
                                                className={`w-4 h-4 ${
                                                    wishlistHydrated && hasWishlist(item.id)
                                                        ? 'fill-current'
                                                        : ''
                                                }`}
                                            />
                                        </button>
                                        <Link
                                            href={`/${locale}/products?q=${encodeURIComponent(item.sku)}`}
                                            className="flex h-full w-full items-center justify-center"
                                        >
                                            <img
                                                src={assetUrl(item.imageUrl)}
                                                alt={localizedTitle}
                                                className="max-h-full max-w-full object-contain mix-blend-multiply transition-transform duration-150 hover:scale-105"
                                            />
                                        </Link>
                                    </div>

                                    <div className="space-y-2 pt-1">
                                        <span className="block text-xs font-bold text-[#C2410C]">
                                            {localizedCategory}
                                        </span>
                                        <Link
                                            href={`/${locale}/products?q=${encodeURIComponent(item.sku)}`}
                                            className="block text-sm font-extrabold text-[#11161B] hover:text-[#C2410C] leading-snug min-h-[2.5rem]"
                                        >
                                            {localizedTitle}
                                        </Link>
                                        <div className="flex flex-wrap gap-1.5 pt-0.5">
                                            {localizedSpecs.map((spec) => (
                                                <span
                                                    key={spec}
                                                    className="border border-[#E2DDD3] bg-[#F5F3EE] px-2 py-0.5 text-xs font-semibold text-[#2A323B] rounded-none"
                                                >
                                                    {spec}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-5 pt-3.5 border-t border-[#E2DDD3] flex items-end justify-between gap-2">
                                    <div>
                                        <span className="block text-lg font-extrabold text-[#11161B] tabular-nums leading-none">
                                            {formattedPrice}
                                        </span>
                                        <span className="block text-xs text-[#5B6470] mt-1 tabular-nums">
                                            {secondaryFormatted}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1.5 shrink-0">
                                        <button
                                            type="button"
                                            data-testid="product-compare-toggle"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                toggleCompare({
                                                    id: item.id,
                                                    slug: item.slug,
                                                    sku: item.sku,
                                                    name: localizedTitle,
                                                    price: item.priceGrossEur,
                                                    image: item.imageUrl,
                                                    categoryName: localizedCategory,
                                                    specs: [...localizedSpecs],
                                                });
                                            }}
                                            aria-pressed={isCompared}
                                            aria-label={`${compareBtnLabel}: ${localizedTitle}`}
                                            className={`inline-flex items-center justify-center gap-1 border px-2.5 py-2.5 text-xs font-bold whitespace-nowrap cursor-pointer transition-colors rounded-none ${
                                                isCompared
                                                    ? 'border-[#C2410C] bg-[#FBEADF] text-[#C2410C]'
                                                    : 'border-[#D5CFC3] bg-white text-[#11161B] hover:border-[#11161B]'
                                            }`}
                                        >
                                            <Scale className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                                            <span>{compareBtnLabel}</span>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={(e) => handleAdd(item, localizedTitle, e)}
                                            className="inline-flex items-center justify-center gap-1 rounded-none bg-[#11161B] hover:bg-[#C2410C] px-3.5 py-2.5 text-xs font-bold text-white whitespace-nowrap cursor-pointer transition-colors"
                                        >
                                            {isAdded ? (
                                                <>
                                                    <Check className="w-3.5 h-3.5 shrink-0" />
                                                    <span>{stockCopy.added}</span>
                                                </>
                                            ) : (
                                                <span>{stockCopy.addToCart}</span>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </article>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
