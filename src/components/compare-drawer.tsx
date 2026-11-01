'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Scale, X, ShoppingCart, Trash2, CheckCircle2 } from 'lucide-react';
import { useLocale } from 'next-intl';
import {
    useCompareStore,
    useCompareHydration,
    extractCompareTechnicalSpecs,
    filterDiffOnlyCompareRows,
    MAX_COMPARE_ITEMS,
    type CompareItem,
    type CompareMatrixRow,
} from '../store/compare';
import { useCartStore } from '../store/cart';
import { useVatDisplayStore } from '../store/vat-display';
import { assetUrl } from '../lib/api';
import { resolveProductImageUrl } from '../lib/product-visuals';
import { resolveProductBrandInfo } from '../lib/v3-description';
import { resolveAppLocale } from '../i18n/storefront-ui-copy';
import type { AppLocale } from '../i18n/routing';
import { formatEurAmount } from '../lib/format';
import { PRICE_REQUEST_COPY } from '../lib/w121-honest-commerce';
import { PriceRequestCta } from './price-request-cta';

export const COMPARE_DRAWER_I18N: Record<
    AppLocale,
    {
        floatingBarTitle: (count: number) => string;
        openMatrixBtn: string;
        clearBtn: string;
        drawerTitle: string;
        drawerSubtitle: (count: number) => string;
        closeAria: string;
        diffOnlyLabel: string;
        vatGross: string;
        vatNet: string;
        addToCart: string;
        removeAria: string;
        rowBrand: string;
        rowSku: string;
        rowCategory: string;
        rowPowerKw: string;
        rowConnectionDn: string;
        rowFuelRefrigerant: string;
        rowWarranty: string;
        rowApvaStatus: string;
        rowWarehouseStock: string;
        noDiffMessage: string;
    }
> = {
    lt: {
        floatingBarTitle: (c) => `Palyginti 2–4 prekes (${c}/${MAX_COMPARE_ITEMS})`,
        openMatrixBtn: 'Atidaryti palyginimo lentelę',
        clearBtn: 'Išvalyti',
        drawerTitle: 'Techninis prekių palyginimas (2–4 SKU)',
        drawerSubtitle: (c) =>
            `Pasirinkta ${c} iš ${MAX_COMPARE_ITEMS} prekių · Eigulių g. 21, Kaunas`,
        closeAria: 'Uždaryti palyginimo lentelę',
        diffOnlyLabel: 'Rodyti tik besiskiriančius parametrus',
        vatGross: 'Su PVM',
        vatNet: 'Be PVM',
        addToCart: 'Į krepšelį',
        removeAria: 'Pašalinti iš palyginimo',
        rowBrand: 'Gamintojas',
        rowSku: 'Gamintojo kodas (SKU)',
        rowCategory: 'Kategorija ir mazgas',
        rowPowerKw: 'Šiluminė galia / tūris (kW / L)',
        rowConnectionDn: 'Matmenys / Pajungimas (DN / mm)',
        rowFuelRefrigerant: 'Šaltnešis / Kuras / Terpė',
        rowWarranty: 'Garantija (24–60 mėn.)',
        rowApvaStatus: 'APVA / LEA paramos tinkamumas',
        rowWarehouseStock: 'Likutis Kauno sandėlyje',
        noDiffMessage:
            'Visų pasirinktų prekių techniniai parametrai sutampa. Išjunkite filtrą, kad matytumėte visas eilutes.',
    },
    en: {
        floatingBarTitle: (c) => `Compare 2–4 products (${c}/${MAX_COMPARE_ITEMS})`,
        openMatrixBtn: 'Open comparison matrix',
        clearBtn: 'Clear',
        drawerTitle: 'Side-by-Side Technical SKU Comparison (2–4 SKUs)',
        drawerSubtitle: (c) =>
            `${c} of ${MAX_COMPARE_ITEMS} products selected · Eigulių g. 21, Kaunas`,
        closeAria: 'Close comparison drawer',
        diffOnlyLabel: 'Show differing parameters only (Rodyti tik besiskiriančius parametrus)',
        vatGross: 'Incl. VAT',
        vatNet: 'Excl. VAT',
        addToCart: 'Add to cart',
        removeAria: 'Remove from comparison',
        rowBrand: 'Manufacturer',
        rowSku: 'Manufacturer SKU',
        rowCategory: 'Category & Subcategory',
        rowPowerKw: 'Thermal Power / Volume (kW / L)',
        rowConnectionDn: 'Dimensions / Connection (DN / mm)',
        rowFuelRefrigerant: 'Refrigerant / Fuel / Medium',
        rowWarranty: 'Warranty (24–60 mos.)',
        rowApvaStatus: 'APVA / LEA Subsidy Eligibility',
        rowWarehouseStock: 'Kaunas Warehouse Stock',
        noDiffMessage:
            'All technical parameters match across selected items. Disable the filter to view all rows.',
    },
    pl: {
        floatingBarTitle: (c) => `Porównaj 2–4 produkty (${c}/${MAX_COMPARE_ITEMS})`,
        openMatrixBtn: 'Otwórz tabelę porównawczą',
        clearBtn: 'Wyczyść',
        drawerTitle: 'Porównanie parametrów technicznych (2–4 SKU)',
        drawerSubtitle: (c) =>
            `Wybrano ${c} z ${MAX_COMPARE_ITEMS} produktów · Eigulių g. 21, Kaunas`,
        closeAria: 'Zamknij porównywarkę',
        diffOnlyLabel: 'Pokaż tylko różniące się parametry (Rodyti tik besiskiriančius parametrus)',
        vatGross: 'Z VAT',
        vatNet: 'Bez VAT',
        addToCart: 'Do koszyka',
        removeAria: 'Usuń z porównania',
        rowBrand: 'Producent',
        rowSku: 'Kod producenta (SKU)',
        rowCategory: 'Kategoria i podkategoria',
        rowPowerKw: 'Moc grzewcza / Pojemność (kW / L)',
        rowConnectionDn: 'Wymiary / Przyłącze (DN / mm)',
        rowFuelRefrigerant: 'Czynnik / Paliwo',
        rowWarranty: 'Gwarancja (24–60 mies.)',
        rowApvaStatus: 'Kwalifikacja do dotacji APVA / LEA',
        rowWarehouseStock: 'Stan w magazynie Kowno',
        noDiffMessage:
            'Wszystkie parametry techniczne wybranych produktów są identyczne.',
    },
    ru: {
        floatingBarTitle: (c) => `Сравнить 2–4 товара (${c}/${MAX_COMPARE_ITEMS})`,
        openMatrixBtn: 'Открыть таблицу сравнения',
        clearBtn: 'Очистить',
        drawerTitle: 'Техническое сравнение товаров (2–4 SKU)',
        drawerSubtitle: (c) =>
            `Выбрано ${c} из ${MAX_COMPARE_ITEMS} поз. · Eigulių g. 21, Kaunas`,
        closeAria: 'Закрыть таблицу сравнения',
        diffOnlyLabel: 'Показать только отличающиеся параметры (Rodyti tik besiskiriančius parametrus)',
        vatGross: 'С НДС',
        vatNet: 'Без НДС',
        addToCart: 'В корзину',
        removeAria: 'Удалить из сравнения',
        rowBrand: 'Производитель',
        rowSku: 'Артикул (SKU)',
        rowCategory: 'Категория и узел',
        rowPowerKw: 'Тепловая мощность / Объем (кВт / л)',
        rowConnectionDn: 'Размеры / Подключение (DN / мм)',
        rowFuelRefrigerant: 'Хладагент / Топливо',
        rowWarranty: 'Гарантия (24–60 мес.)',
        rowApvaStatus: 'Подходит для субсидии APVA / LEA',
        rowWarehouseStock: 'Остаток на складе в Каунасе',
        noDiffMessage:
            'Все технические параметры выбранных товаров совпадают.',
    },
};

export function CompareDrawer() {
    const intlLocale = useLocale() || 'lt';
    const rawPathname = usePathname() || '';
    const urlMatch = rawPathname.match(/^\/(lt|en|pl|ru)(?=\/|$)/i);
    const locale = resolveAppLocale(urlMatch ? urlMatch[1] : intlLocale);
    const copy = COMPARE_DRAWER_I18N[locale];

    const items = useCompareStore((s) => s.items);
    const isOpen = useCompareStore((s) => s.isOpen);
    const diffOnly = useCompareStore((s) => s.diffOnly);
    const openCompare = useCompareStore((s) => s.openCompare);
    const closeCompare = useCompareStore((s) => s.closeCompare);
    const toggleDiffOnly = useCompareStore((s) => s.toggleDiffOnly);
    const removeCompareItem = useCompareStore((s) => s.removeCompareItem);
    const clearCompare = useCompareStore((s) => s.clearCompare);
    const hydrated = useCompareHydration();

    const addCartItem = useCartStore((s) => s.addItem);
    const openCart = useCartStore((s) => s.openCart);
    const { showNet, setShowNet } = useVatDisplayStore();
    const [floatingDismissed, setFloatingDismissed] = useState(false);

    useEffect(() => {
        setFloatingDismissed(false);
    }, [items]);

    useEffect(() => {
        if (items.length === 0 && !isOpen) return;
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                if (isOpen) {
                    closeCompare();
                } else {
                    setFloatingDismissed(true);
                }
            }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [isOpen, items.length, closeCompare]);

    if (!hydrated || items.length === 0) return null;

    const handleAddSingleToCart = (item: CompareItem) => {
        if (item.priceOnRequest === true || !(Number(item.price) > 0)) return;
        const resolvedImg = resolveProductImageUrl({
            sku: item.sku,
            title: item.name,
            brand: item.brand,
            category: item.categoryName,
            imageUrl: item.image,
        });
        addCartItem({
            id: item.id,
            productId: item.id,
            name: item.name,
            price: item.price,
            sku: item.sku || item.id,
            quantity: 1,
            image: resolvedImg,
        });
        closeCompare();
        openCart();
    };

    const extractedByItem = items.map((item) => {
        const brandInfo = resolveProductBrandInfo({
            brand: item.brand,
            title: item.name,
            sku: item.sku,
        });
        const specs = extractCompareTechnicalSpecs(item, locale);
        const image = resolveProductImageUrl({
            sku: item.sku,
            title: item.name,
            brand: brandInfo.name,
            category: item.categoryName,
            imageUrl: item.image,
        });
        return {
            item,
            brandName: item.brand || brandInfo.name,
            image,
            specs,
        };
    });

    const allMatrixRows: CompareMatrixRow[] = [
        {
            key: 'brand',
            label: copy.rowBrand,
            values: extractedByItem.map((e) => e.brandName),
        },
        {
            key: 'sku',
            label: copy.rowSku,
            values: extractedByItem.map((e) => e.item.sku || e.item.id),
        },
        {
            key: 'category',
            label: copy.rowCategory,
            values: extractedByItem.map(
                (e) =>
                    `${e.item.categoryName || 'ŠVOK įranga'} · ${e.specs.subCategoryLabel}`,
            ),
        },
        {
            key: 'powerKw',
            label: copy.rowPowerKw,
            values: extractedByItem.map((e) => e.specs.powerKw),
        },
        {
            key: 'connectionDn',
            label: copy.rowConnectionDn,
            values: extractedByItem.map((e) => e.specs.dimensionsOrConnection),
        },
        {
            key: 'fuelRefrigerant',
            label: copy.rowFuelRefrigerant,
            values: extractedByItem.map((e) => e.specs.fuelOrRefrigerant),
        },
        {
            key: 'warranty',
            label: copy.rowWarranty,
            values: extractedByItem.map((e) => e.specs.warranty),
        },
        {
            key: 'apva',
            label: copy.rowApvaStatus,
            values: extractedByItem.map((e) => e.specs.apvaEligibilityLabel),
        },
        {
            key: 'warehouseStock',
            label: copy.rowWarehouseStock,
            values: extractedByItem.map((e) => e.specs.stockWarehouseLabel),
        },
    ];

    const visibleMatrixRows = filterDiffOnlyCompareRows(allMatrixRows, diffOnly);

    return (
        <>
            {/* Floating Bottom-Left Comparison Bar Trigger when items.length > 0 */}
            {!floatingDismissed && (
                <div
                    data-testid="compare-floating-bar"
                    className="fixed bottom-20 md:bottom-4 left-3 right-3 sm:right-auto sm:left-4 z-40 flex flex-wrap items-center gap-2 border border-[#11161B] bg-[#11161B] text-[#F5F3EE] px-3.5 py-2.5 shadow-lg rounded-none max-w-[calc(100vw-1.5rem)]"
                >
                    <div className="flex items-center gap-2">
                        <Scale className="h-4 w-4 text-[#FF8A3D] shrink-0" aria-hidden="true" />
                        <span className="text-xs font-bold whitespace-nowrap">
                            {copy.floatingBarTitle(items.length)}
                        </span>
                    </div>

                    <div className="hidden sm:flex items-center gap-1">
                        {extractedByItem.map(({ item }) => (
                            <span
                                key={item.id}
                                className="inline-flex items-center gap-1 border border-[#2C3742] bg-[#1B232C] px-2 py-0.5 font-mono text-xs text-[#F5F3EE]"
                            >
                                <span>{item.sku || item.id}</span>
                                <button
                                    type="button"
                                    onClick={() => removeCompareItem(item.id)}
                                    aria-label={`${copy.removeAria} ${item.sku || item.name}`}
                                    className="text-[#A3ADB8] hover:text-white cursor-pointer"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </span>
                        ))}
                    </div>

                    <button
                        type="button"
                        onClick={openCompare}
                        className="bg-[#C2410C] hover:bg-[#9A3412] text-white px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer rounded-none whitespace-nowrap"
                    >
                        {copy.openMatrixBtn}
                    </button>

                    <button
                        type="button"
                        onClick={clearCompare}
                        className="border border-[#2C3742] bg-transparent hover:border-[#FF8A3D] text-[#C9D0D8] hover:text-white px-2.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer rounded-none"
                    >
                        {copy.clearBtn}
                    </button>
                </div>
            )}

            {/* Side-by-Side Comparison Modal / Drawer */}
            {isOpen && (
                <div
                    data-testid="compare-drawer"
                    role="dialog"
                    aria-modal="true"
                    aria-label={copy.drawerTitle}
                    className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
                >
                    <div
                        onClick={closeCompare}
                        className="fixed inset-0 bg-[#0B0F13]/75 transition-opacity"
                    />

                    <aside className="relative z-10 flex max-h-[92vh] w-full max-w-6xl flex-col bg-[#F5F3EE] text-[#11161B] border border-[#11161B] shadow-2xl overflow-hidden rounded-none">
                        {/* Header */}
                        <div className="flex flex-wrap items-center justify-between gap-3 bg-[#11161B] text-[#F5F3EE] px-5 py-4 border-b border-[#2C3742]">
                            <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center border border-[#2C3742] bg-[#1B232C] text-[#FF8A3D]">
                                    <Scale className="h-4 w-4" aria-hidden="true" />
                                </div>
                                <div>
                                    <h2 className="text-base sm:text-lg font-extrabold text-white leading-tight">
                                        {copy.drawerTitle}
                                    </h2>
                                    <p className="text-xs text-[#A3ADB8]">
                                        {copy.drawerSubtitle(items.length)}
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2.5">
                                {/* Diff-only interactive toggle */}
                                <button
                                    type="button"
                                    data-testid="compare-diff-only-toggle"
                                    aria-pressed={diffOnly}
                                    onClick={toggleDiffOnly}
                                    className={`inline-flex items-center gap-2 border px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer rounded-none ${
                                        diffOnly
                                            ? 'border-[#FF8A3D] bg-[#C2410C] text-white'
                                            : 'border-[#2C3742] bg-[#1B232C] text-[#F5F3EE] hover:border-[#FF8A3D]'
                                    }`}
                                >
                                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                                    <span>{copy.diffOnlyLabel}</span>
                                </button>

                                {/* Su PVM / Be PVM switcher */}
                                <div className="inline-flex border border-[#2C3742] bg-[#1B232C] p-0.5 rounded-none">
                                    <button
                                        type="button"
                                        onClick={() => setShowNet(false)}
                                        aria-pressed={!showNet}
                                        className={`px-2.5 py-1 text-xs font-bold cursor-pointer ${
                                            !showNet ? 'bg-[#C2410C] text-white' : 'text-[#C9D0D8]'
                                        }`}
                                    >
                                        {copy.vatGross}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowNet(true)}
                                        aria-pressed={showNet}
                                        className={`px-2.5 py-1 text-xs font-bold cursor-pointer ${
                                            showNet ? 'bg-[#C2410C] text-white' : 'text-[#C9D0D8]'
                                        }`}
                                    >
                                        {copy.vatNet}
                                    </button>
                                </div>

                                <button
                                    type="button"
                                    onClick={closeCompare}
                                    aria-label={copy.closeAria}
                                    data-testid="compare-drawer-close"
                                    className="flex h-9 w-9 items-center justify-center border border-[#2C3742] bg-[#1B232C] text-[#C9D0D8] hover:border-[#FF8A3D] hover:text-white transition-colors cursor-pointer"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        </div>

                        {/* Scrollable Matrix Content */}
                        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
                            {/* Product Columns Header Cards */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border-t border-l border-[#D5CFC3]">
                                {extractedByItem.map(({ item, brandName, image }) => {
                                    const priceless =
                                        item.priceOnRequest === true || !(Number(item.price) > 0);
                                    const gross = item.price > 0 ? item.price : 0;
                                    const net = gross / 1.21;
                                    const primaryVal = showNet ? net : gross;
                                    const secondaryVal = showNet ? gross : net;

                                    return (
                                        <div
                                            key={item.id}
                                            className="flex flex-col justify-between border-r border-b border-[#D5CFC3] bg-white p-4 space-y-3"
                                        >
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className="font-mono text-xs font-bold text-[#C2410C]">
                                                        {item.sku || item.id}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeCompareItem(item.id)}
                                                        aria-label={`${copy.removeAria} ${item.name}`}
                                                        className="inline-flex items-center gap-1 text-xs font-semibold text-[#5B6470] hover:text-[#B91C1C] cursor-pointer"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </button>
                                                </div>

                                                <div className="h-28 bg-[#EEEBE4] p-2.5 flex items-center justify-center">
                                                    <img
                                                        src={assetUrl(image)}
                                                        alt={item.name}
                                                        className="max-h-full max-w-full object-contain mix-blend-multiply"
                                                    />
                                                </div>

                                                <span className="block text-xs font-bold text-[#5B6470]">
                                                    {brandName}
                                                </span>

                                                <Link
                                                    href={`/${locale}/products/${item.slug || item.id}`}
                                                    onClick={closeCompare}
                                                    className="block text-xs sm:text-sm font-extrabold text-[#11161B] hover:text-[#C2410C] leading-snug line-clamp-2"
                                                >
                                                    {item.name}
                                                </Link>
                                            </div>

                                            <div className="pt-2.5 border-t border-[#E2DDD3] flex items-end justify-between gap-2">
                                                <div>
                                                    {priceless ? (
                                                        <span
                                                            className="block text-base font-extrabold text-[#11161B]"
                                                            data-testid={`compare-price-on-request-${item.sku || item.id}`}
                                                        >
                                                            {PRICE_REQUEST_COPY[locale].onRequestLabel}
                                                        </span>
                                                    ) : (
                                                        <>
                                                            <span className="block text-base font-extrabold text-[#11161B] tabular-nums">
                                                                {formatEurAmount(primaryVal)} €{' '}
                                                                <span className="text-xs font-semibold text-[#5B6470]">
                                                                    {showNet ? copy.vatNet : copy.vatGross}
                                                                </span>
                                                            </span>
                                                            <span className="block text-xs text-[#5B6470] tabular-nums">
                                                                {formatEurAmount(secondaryVal)} €{' '}
                                                                {showNet ? copy.vatGross : copy.vatNet}
                                                            </span>
                                                        </>
                                                    )}
                                                </div>

                                                {priceless ? (
                                                    <PriceRequestCta
                                                        sku={item.sku || item.id}
                                                        title={item.name}
                                                        compact
                                                        testId={`compare-request-price-${item.sku || item.id}`}
                                                    />
                                                ) : (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleAddSingleToCart(item)}
                                                        className="inline-flex items-center gap-1.5 bg-[#11161B] hover:bg-[#C2410C] text-white px-3 py-2 text-xs font-bold transition-colors cursor-pointer rounded-none shrink-0"
                                                    >
                                                        <ShoppingCart className="h-3.5 w-3.5" />
                                                        <span>{copy.addToCart}</span>
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Technical Specification Comparison Rows (Responsive Stacked on Mobile, Table on Desktop) */}
                            {visibleMatrixRows.length === 0 ? (
                                <div className="border border-[#D5CFC3] bg-white p-4 text-xs font-semibold text-[#5B6470]">
                                    {copy.noDiffMessage}
                                </div>
                            ) : (
                                <div className="border-t border-l border-[#D5CFC3] bg-white">
                                    {visibleMatrixRows.map((row) => {
                                        const isDiff =
                                            row.values.length > 1 &&
                                            new Set(row.values.map((v) => v.trim().toLowerCase())).size > 1;
                                        return (
                                            <div
                                                key={row.key}
                                                className={`border-r border-b border-[#D5CFC3] p-3.5 ${
                                                    isDiff ? 'bg-[#FAF8F5]' : 'bg-white'
                                                }`}
                                            >
                                                <div className="text-xs font-extrabold text-[#11161B] mb-2 flex items-center justify-between">
                                                    <span>{row.label}</span>
                                                    {isDiff && items.length > 1 && (
                                                        <span className="text-xs font-bold text-[#C2410C]">
                                                            Skiriasi parametras
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                                                    {row.values.map((val, colIdx) => {
                                                        const prod = extractedByItem[colIdx]?.item;
                                                        return (
                                                            <div
                                                                key={`${row.key}-${prod?.id || colIdx}`}
                                                                className="border border-[#E2DDD3] bg-white px-3 py-2 text-xs"
                                                            >
                                                                <span className="font-mono text-xs font-bold text-[#5B6470] block sm:hidden">
                                                                    {prod?.sku || prod?.name}:
                                                                </span>
                                                                <span
                                                                    className={
                                                                        row.key === 'sku'
                                                                            ? 'font-mono font-bold text-[#11161B]'
                                                                            : row.key === 'apva' &&
                                                                                val.includes('APVA')
                                                                              ? 'font-bold text-[#157A3B]'
                                                                              : 'font-semibold text-[#11161B]'
                                                                    }
                                                                >
                                                                    {val}
                                                                </span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </aside>
                </div>
            )}
        </>
    );
}
