'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Heart, Scale, ShieldCheck } from 'lucide-react';
import { useCartStore } from '../../store/cart';
import { useWishlistStore, useWishlistHydration } from '../../store/wishlist';
import { useCompareStore, useCompareHydration } from '../../store/compare';
import { isProductEligibleForApvaSubsidy } from '../apva-subsidy-widget';
import { formatEur } from '../../lib/conversion';
import type { CatalogProduct } from '../../lib/catalog';
import { useLocale } from 'next-intl';
import { resolvePurchasability } from '../../lib/purchasable';
import { trackEvent } from '../analytics';
import { resolveAppLocale } from '../../i18n/storefront-ui-copy';
import type { AppLocale } from '../../i18n/routing';
import { localizeProductTitle } from '../../lib/product-i18n';

const PURCHASE_COPY: Record<
    AppLocale,
    {
        quantityAria: string;
        decreaseAria: string;
        increaseAria: string;
        soldOut: string;
        addedToCart: string;
        addToCartWithPrice: (priceStr: string) => string;
        buyNow: string;
        supplierAvailabilityNote: string;
    }
> = {
    lt: {
        quantityAria: 'Kiekis',
        decreaseAria: 'Sumažinti kiekį',
        increaseAria: 'Padidinti kiekį',
        soldOut: 'Išparduota',
        addedToCart: '✓ Pridėta į krepšelį',
        addToCartWithPrice: (p) => `Į krepšelį – ${p}`,
        buyNow: 'Pirkti dabar',
        supplierAvailabilityNote: 'Užsakoma iš tiekėjo sandėlio (pristatymas 2–4 d. d.)',
    },
    en: {
        quantityAria: 'Quantity',
        decreaseAria: 'Decrease quantity',
        increaseAria: 'Increase quantity',
        soldOut: 'Out of stock',
        addedToCart: '✓ Added to cart',
        addToCartWithPrice: (p) => `Add to cart – ${p}`,
        buyNow: 'Buy now',
        supplierAvailabilityNote: 'Shipped from central warehouse (delivery 2–4 bus. days)',
    },
    pl: {
        quantityAria: 'Ilość',
        decreaseAria: 'Zmniejsz ilość',
        increaseAria: 'Zwiększ ilość',
        soldOut: 'Wyprzedane',
        addedToCart: '✓ Dodano do koszyka',
        addToCartWithPrice: (p) => `Do koszyka – ${p}`,
        buyNow: 'Kup teraz',
        supplierAvailabilityNote: 'Wysyłka z magazynu centralnego (dostawa 2–4 dni rob.)',
    },
    ru: {
        quantityAria: 'Количество',
        decreaseAria: 'Уменьшить количество',
        increaseAria: 'Увеличить количество',
        soldOut: 'Распродано',
        addedToCart: '✓ Добавлено в корзину',
        addToCartWithPrice: (p) => `В корзину – ${p}`,
        buyNow: 'Купить сейчас',
        supplierAvailabilityNote: 'Поставка с центрального склада (доставка 2–4 раб. дн.)',
    },
};

// PDP purchase panel: quantity stepper + add-to-cart + sticky mobile bar.
export function ProductPurchase({ product }: { product: CatalogProduct }) {
    const intlLocale = useLocale();
    const rawPathname = usePathname() || '';
    const urlLocaleMatch = rawPathname.match(/^\/(lt|en|pl|ru)(?=\/|$)/i);
    const locale = resolveAppLocale(urlLocaleMatch ? urlLocaleMatch[1] : intlLocale);
    const copy = PURCHASE_COPY[locale];

    const [qty, setQty] = useState(1);
    const [added, setAdded] = useState(false);
    const { addItem, openCart } = useCartStore();
    const toggleWishlist = useWishlistStore((s) => s.toggleItem);
    const hasWishlist = useWishlistStore((s) => s.hasItem);
    const wishlistHydrated = useWishlistHydration();
    const isSaved = wishlistHydrated && hasWishlist(product.id);
    const toggleCompare = useCompareStore((s) => s.toggleCompareItem);
    const hasCompare = useCompareStore((s) => s.hasItem);
    const openCompare = useCompareStore((s) => s.openCompare);
    const compareCount = useCompareStore((s) => s.items.length);
    const compareHydrated = useCompareHydration();
    const isCompared = compareHydrated && hasCompare(product.id);
    const isApvaEligible = isProductEligibleForApvaSubsidy({
        name: product.name,
        category: product.category,
        sku: product.sku,
        description: product.description,
    });
    const router = useRouter();

    const unitPriceEur = product.priceCents != null ? product.priceCents / 100 : product.price;
    const localizedName = localizeProductTitle(product.name, locale);

    useEffect(() => {
        trackEvent('ViewContent', {
            content_ids: [product.sku || product.id],
            content_name: localizedName,
            content_type: 'product',
            value: unitPriceEur,
            price: unitPriceEur,
            currency: 'EUR',
        });
    }, [product.id, product.sku, localizedName, unitPriceEur]);

    function add() {
        addItem({
            id: product.variantId,
            productId: product.id,
            variantId: product.variantId,
            name: localizedName,
            price: product.price,
            sku: product.sku,
            image: product.image,
            quantity: qty,
        });
        openCart();
        trackEvent('AddToCart', {
            content_ids: [product.sku || product.id],
            content_name: localizedName,
            content_type: 'product',
            value: unitPriceEur * qty,
            price: unitPriceEur,
            currency: 'EUR',
            num_items: qty,
            quantity: qty,
        });
        setAdded(true);
        setTimeout(() => setAdded(false), 1800);
    }

    const { soldOut, availabilityNote } = resolvePurchasability(product.stock);
    const localizedAvailabilityNote = availabilityNote
        ? locale === 'lt'
            ? availabilityNote
            : copy.supplierAvailabilityNote
        : null;

    return (
        <>
            <div className="flex flex-wrap items-center gap-4 mt-6">
                <div
                    className="flex items-center rounded-sm border border-stone-300 bg-white"
                    role="group"
                    aria-label={copy.quantityAria}
                >
                    <button
                        type="button"
                        onClick={() => setQty((q) => Math.max(1, q - 1))}
                        className="px-4 py-2 text-lg font-bold hover:text-[var(--primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--ring)] rounded-l-sm"
                        aria-label={copy.decreaseAria}
                    >
                        −
                    </button>
                    <span aria-live="polite" className="min-w-[2.5rem] text-center font-semibold tabular-nums">
                        {qty}
                    </span>
                    <button
                        type="button"
                        onClick={() => setQty((q) => Math.min(999, q + 1))}
                        className="px-4 py-2 text-lg font-bold hover:text-[var(--primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--ring)] rounded-r-sm"
                        aria-label={copy.increaseAria}
                    >
                        +
                    </button>
                </div>
                <button
                    type="button"
                    onClick={add}
                    disabled={soldOut}
                    className="flex-1 min-w-[180px] rounded-sm bg-[var(--brand-accent)] px-8 py-3 text-base font-bold text-[var(--primary-foreground)] transition-colors duration-150 hover:bg-[var(--brand-accent-hover)] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--ring)]"
                >
                    {soldOut
                        ? copy.soldOut
                        : added
                          ? copy.addedToCart
                          : copy.addToCartWithPrice(formatEur(product.price * qty))}
                </button>
                <button
                    type="button"
                    onClick={() => {
                        add();
                        router.push(`/${locale}/cart`);
                    }}
                    disabled={soldOut}
                    className="rounded-sm border-2 border-[var(--brand-accent)] px-6 py-3 text-base font-bold text-[var(--brand-accent)] transition-colors duration-150 hover:bg-[var(--brand-accent)] hover:text-[var(--primary-foreground)] disabled:opacity-40 hidden md:inline-flex"
                >
                    {copy.buyNow}
                </button>
                <button
                    type="button"
                    data-testid="pdp-wishlist-toggle"
                    onClick={() =>
                        toggleWishlist({
                            id: product.id,
                            sku: product.sku,
                            name: localizedName,
                            price: product.price,
                            image: product.image,
                            categoryName: product.category,
                        })
                    }
                    aria-pressed={isSaved}
                    aria-label={
                        locale === 'en'
                            ? 'Save to wishlist'
                            : locale === 'pl'
                              ? 'Zapisz produkt'
                              : locale === 'ru'
                                ? 'В избранное'
                                : 'Įsiminti prekę'
                    }
                    className={`inline-flex items-center justify-center gap-2 rounded-sm border px-4 py-3 text-sm font-bold transition-colors cursor-pointer ${
                        isSaved
                            ? 'border-[#C2410C] bg-[#FBEADF] text-[#C2410C]'
                            : 'border-stone-300 bg-white text-[#11161B] hover:border-[#C2410C] hover:text-[#C2410C]'
                    }`}
                >
                    <Heart className={`h-4 w-4 shrink-0 ${isSaved ? 'fill-current' : ''}`} />
                    <span>
                        {isSaved
                            ? locale === 'en'
                                ? 'Saved'
                                : locale === 'pl'
                                  ? 'Zapisano'
                                  : locale === 'ru'
                                    ? 'Сохранено'
                                    : 'Įsiminta'
                            : locale === 'en'
                              ? 'Save'
                              : locale === 'pl'
                                ? 'Zapisz'
                                : locale === 'ru'
                                  ? 'В избранное'
                                  : 'Įsiminti'}
                    </span>
                </button>
                <button
                    type="button"
                    data-testid="product-compare-toggle"
                    onClick={() =>
                        toggleCompare({
                            id: product.id,
                            slug: product.slug,
                            sku: product.sku,
                            name: localizedName,
                            brand: product.brand,
                            price: product.price,
                            image: product.image,
                            categoryName: product.category,
                            stockQty: product.stockQuantity ?? product.stock,
                        })
                    }
                    aria-pressed={isCompared}
                    className={`inline-flex items-center justify-center gap-2 rounded-sm border px-4 py-3 text-sm font-bold transition-colors cursor-pointer ${
                        isCompared
                            ? 'border-[#C2410C] bg-[#FBEADF] text-[#C2410C]'
                            : 'border-stone-300 bg-white text-[#11161B] hover:border-[#C2410C] hover:text-[#C2410C]'
                    }`}
                >
                    <Scale className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>
                        {isCompared
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
                                  : 'Palyginti'}
                    </span>
                </button>
            </div>

            {isCompared && (
                <div
                    data-testid="pdp-compare-inline-status"
                    className="mt-3 flex flex-wrap items-center justify-between gap-2 border border-[#157A3B]/40 bg-[#E3F1E8] px-3.5 py-2 text-xs font-bold text-[#0F5A2B] rounded-none"
                >
                    <span>
                        {locale === 'en'
                            ? `Added to comparison (${compareCount}/4 SKU)`
                            : locale === 'pl'
                              ? `Dodano do porównania (${compareCount}/4 SKU)`
                              : locale === 'ru'
                                ? `Добавлено к сравнению (${compareCount}/4 SKU)`
                                : `Pridėta į palyginimą (${compareCount}/4 SKU)`}
                    </span>
                    <button
                        type="button"
                        onClick={openCompare}
                        className="underline font-extrabold text-[#11161B] hover:text-[#C2410C] cursor-pointer"
                    >
                        {locale === 'en'
                            ? 'Open comparison matrix'
                            : locale === 'pl'
                              ? 'Otwórz tabelę porównawczą'
                              : locale === 'ru'
                                ? 'Открыть таблицу сравнения'
                                : 'Atidaryti palyginimo lentelę'}
                    </button>
                </div>
            )}

            {isApvaEligible && (
                <div
                    data-testid="pdp-apva-badge"
                    className="mt-4 flex items-center gap-2.5 border border-[#157A3B]/40 bg-[#E3F1E8] px-3.5 py-2.5 text-xs font-bold text-[#0F5A2B] rounded-none"
                >
                    <ShieldCheck className="h-4 w-4 shrink-0 text-[#157A3B]" aria-hidden="true" />
                    <span>
                        {locale === 'en'
                            ? 'Eligible for APVA State Grant · EcoDesign / A+++ VAT invoice with SCOP & kW parameters (Tinka APVA paramai · EcoDesign / A+++ sąskaita su SCOP ir kW duomenimis)'
                            : locale === 'pl'
                              ? 'Kwalifikuje się do dotacji APVA · Faktura EcoDesign / A+++ z danymi SCOP i kW (Tinka APVA paramai · EcoDesign / A+++ sąskaita su SCOP ir kW duomenimis)'
                              : locale === 'ru'
                                ? 'Подходит для субсидии APVA · Счет EcoDesign / A+++ с данными SCOP и кВт (Tinka APVA paramai · EcoDesign / A+++ sąskaita su SCOP ir kW duomenimis)'
                                : 'Tinka APVA paramai · EcoDesign / A+++ sąskaita su SCOP ir kW duomenimis'}
                    </span>
                </div>
            )}

            {localizedAvailabilityNote && (
                <p className="mt-3 text-sm text-[var(--text-secondary)]" role="note">
                    {localizedAvailabilityNote}
                </p>
            )}

            {/* Sticky mobile add-to-cart bar */}
            <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--border)] bg-[var(--surface-card)] p-3 md:hidden">
                <div className="flex items-center gap-3">
                    <div className="flex items-center rounded-sm border border-[var(--border)]">
                        <button
                            type="button"
                            onClick={() => setQty((q) => Math.max(1, q - 1))}
                            className="px-3.5 py-2 text-lg font-bold"
                            aria-label={copy.decreaseAria}
                        >
                            −
                        </button>
                        <span className="min-w-[2rem] text-center font-semibold tabular-nums">
                            {qty}
                        </span>
                        <button
                            type="button"
                            onClick={() => setQty((q) => Math.min(999, q + 1))}
                            className="px-3.5 py-2 text-lg font-bold"
                            aria-label={copy.increaseAria}
                        >
                            +
                        </button>
                    </div>
                    <button
                        type="button"
                        onClick={add}
                        disabled={soldOut}
                        className="flex-1 rounded-sm bg-[var(--brand-accent)] px-4 py-3 text-sm font-bold text-[var(--primary-foreground)] disabled:opacity-40"
                    >
                        {soldOut
                            ? copy.soldOut
                            : copy.addToCartWithPrice(formatEur(product.price * qty))}
                    </button>
                </div>
            </div>
        </>
    );
}
