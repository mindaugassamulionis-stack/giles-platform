'use client';

import Link from 'next/link';
import { Heart, Check, Copy, Scale } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useCartStore } from '../store/cart';
import { useVatDisplayStore } from '../store/vat-display';
import { useWishlistStore, useWishlistHydration } from '../store/wishlist';
import { useCompareStore, useCompareHydration } from '../store/compare';
import { useLocale } from 'next-intl';
import { usePathname } from 'next/navigation';
import { resolvePurchasability } from '../lib/purchasable';
import {
    isPriceOnRequestProduct,
    resolveHonestAvailability,
    honestAvailabilityLabel,
} from '../lib/w121-honest-commerce';
import { PriceRequestCta } from './price-request-cta';
import { assetUrl } from '../lib/api';
import { resolveProductImageUrl, formatCleanCatalogProductTitle } from '../lib/product-visuals';
import { resolveProductBrandInfo, extractCardTechChips } from '../lib/v3-description';
import { PriceDisplay } from './price-display';
import { STOREFRONT_STOCK_COPY, resolveAppLocale } from '../i18n/storefront-ui-copy';
import type { AppLocale } from '../i18n/routing';
import {
    localizeProductTitle,
    localizeCategoryLabel,
    localizeTechChip,
} from '../lib/product-i18n';
import { openVytautasWithContext, recordSearchQuery } from '../lib/customer-journey-tracker';
import { useStorefrontConfig } from './storefront-config-provider';

export { extractCardTechChips };

const cleanDash = (s: string) => s.replace(/\u2014/g, '–').replace(/[\u00A9\u00AE\u2122]/g, '');

const PRODUCT_CARD_COPY: Record<
    AppLocale,
    {
        soldOut: string;
        exactCode: string;
        wishlistAria: string;
        purposeSrLabel: string;
        threadSrLabel: string;
        defaultStandardChip: string;
        addToCartAria: string;
        b2bRateLabel: string;
        consultAgent: (agentName: string) => string;
    }
> = {
    lt: {
        soldOut: 'Išparduota',
        exactCode: 'Tikslus kodas',
        wishlistAria: 'Įsiminti prekę',
        purposeSrLabel: 'Paskirtis / Mazgas:',
        threadSrLabel: 'Sriegis / Standartas:',
        defaultStandardChip: 'EN / ISO standartas',
        addToCartAria: 'Į krepšelį',
        b2bRateLabel: 'Komplektuojantiems ir B2B – projekto kaina',
        consultAgent: (agentName) => `Pasikonsultuoti su ${agentName}`,
    },
    en: {
        soldOut: 'Out of stock',
        exactCode: 'Exact SKU',
        wishlistAria: 'Save to wishlist',
        purposeSrLabel: 'Application / Node:',
        threadSrLabel: 'Thread / Standard:',
        defaultStandardChip: 'EN / ISO Standard',
        addToCartAria: 'Add to cart',
        b2bRateLabel: 'Project & B2B package pricing available',
        consultAgent: (agentName) => `Consult ${agentName}`,
    },
    pl: {
        soldOut: 'Wyprzedane',
        exactCode: 'Dokładny kod',
        wishlistAria: 'Dodaj do ulubionych',
        purposeSrLabel: 'Przeznaczenie / Węzeł:',
        threadSrLabel: 'Gwint / Standard:',
        defaultStandardChip: 'Standard EN / ISO',
        addToCartAria: 'Dodaj do koszyka',
        b2bRateLabel: 'Wycena zestawu i ceny projektowe B2B',
        consultAgent: (agentName) => `Skonsultuj z ${agentName}`,
    },
    ru: {
        soldOut: 'Распродано',
        exactCode: 'Точный код',
        wishlistAria: 'В избранное',
        purposeSrLabel: 'Назначение / Узел:',
        threadSrLabel: 'Резьба / Стандарт:',
        defaultStandardChip: 'Стандарт EN / ISO',
        addToCartAria: 'В корзину',
        b2bRateLabel: 'Комплектное предложение и проектный тариф B2B',
        consultAgent: (agentName) => `Консультация с ${agentName}`,
    },
};

export function LocalizedVytautasConsultButton({
    prompt,
    title,
    summary,
    searchQuery,
    resultCount,
    locale: propLocale,
}: {
    prompt: string;
    title: string;
    summary: string;
    searchQuery?: string;
    resultCount?: number;
    locale?: string;
}) {
    const intlLocale = useLocale();
    const rawPathname = usePathname() || '';
    const urlLocaleMatch = rawPathname.match(/^\/(lt|en|pl|ru)(?=\/|$)/i);
    const locale = resolveAppLocale(propLocale || (urlLocaleMatch ? urlLocaleMatch[1] : intlLocale));
    const { features, persona } = useStorefrontConfig();
    const agentName = persona.agentName || 'Vytautas';

    useEffect(() => {
        if (features.customerJourneyTracker && searchQuery && searchQuery.trim().length >= 2) {
            recordSearchQuery(searchQuery.trim(), resultCount);
        }
    }, [searchQuery, resultCount, features.customerJourneyTracker]);

    if (!features.vytautasWidget) return null;

    return (
        <button
            type="button"
            onClick={() =>
                openVytautasWithContext({
                    prompt,
                    title,
                    summary,
                    autoSend: true,
                })
            }
            className="inline-flex items-center justify-center gap-2 rounded-none bg-[#C2410C] hover:bg-[#9A3412] px-4 py-2 text-xs font-bold text-white transition-colors shrink-0 cursor-pointer whitespace-nowrap"
        >
            <span>{PRODUCT_CARD_COPY[locale].consultAgent(agentName)}</span>
        </button>
    );
}

export function LocalizedCopySkuButton({
    sku,
    locale: propLocale,
}: {
    sku: string;
    locale?: string;
}) {
    const intlLocale = useLocale();
    const rawPathname = usePathname() || '';
    const urlLocaleMatch = rawPathname.match(/^\/(lt|en|pl|ru)(?=\/|$)/i);
    const locale = resolveAppLocale(propLocale || (urlLocaleMatch ? urlLocaleMatch[1] : intlLocale));
    const stockCopy = STOREFRONT_STOCK_COPY[locale];
    const [copied, setCopied] = useState(false);

    const prefix =
        locale === 'en' ? 'SKU' : locale === 'pl' ? 'KOD' : locale === 'ru' ? 'АРТИКУЛ' : 'KODAS';

    async function handleCopy() {
        try {
            if (typeof navigator !== 'undefined' && navigator.clipboard) {
                await navigator.clipboard.writeText(sku);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
            }
        } catch {
            // Clipboard permission denied or unavailable; fail silently
        }
    }

    return (
        <button
            type="button"
            onClick={handleCopy}
            title={stockCopy.copySkuTitle}
            aria-label={`${stockCopy.copySkuTitle} ${sku}`}
            className="inline-flex min-h-[36px] items-center gap-2 rounded-[2px] border border-border bg-muted/60 px-2.5 py-1 font-mono text-sm font-semibold text-foreground transition-colors duration-150 hover:border-[var(--primary)] hover:text-[var(--primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--ring)]"
        >
            <span>
                {prefix}: {sku}
            </span>
            {copied ? (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-[var(--data-ok)]">
                    <Check className="h-3.5 w-3.5" aria-hidden="true" />
                    {stockCopy.copied}
                </span>
            ) : (
                <Copy className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
            )}
        </button>
    );
}

interface ProductCardProps {
    product: {
        id: string;
        slug?: string | null;
        name: string;
        price: number;
        imageUrl?: string;
        categoryName?: string | null;
        brandName?: string | null;
        inStock?: boolean;
        stock?: number | null;
        stockQuantity?: number | null;
        stockUnit?: string | null;
        stockSource?: string | null;
        lastSyncedAt?: string | null;
        sku?: string;
        isNew?: boolean;
        createdAt?: Date | string | null;
        priceCents?: number | null;
        vatRate?: number | null;
        exactSkuMatch?: boolean;
        /* W121-A1 contract fields (optional on legacy rows). */
        priceEur?: number | null;
        priceOnRequest?: true;
        availability?: 'in_stock' | 'supplier_2_4d' | 'on_request';
        stockQty?: number | null;
    };
    index?: number;
}

export function ProductCard({ product, index = 0 }: ProductCardProps) {
    const intlLocale = useLocale();
    const rawPathname = usePathname() || '';
    const urlLocaleMatch = rawPathname.match(/^\/(lt|en|pl|ru)(?=\/|$)/i);
    const locale = resolveAppLocale(urlLocaleMatch ? urlLocaleMatch[1] : intlLocale);
    const stockCopy = STOREFRONT_STOCK_COPY[locale];
    const cardCopy = PRODUCT_CARD_COPY[locale];
    const showNet = useVatDisplayStore((s) => s.showNet);
    const [isAdding, setIsAdding] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [copiedSku, setCopiedSku] = useState(false);
    const addItem = useCartStore((state) => state.addItem);
    const openCart = useCartStore((state) => state.openCart);

    const toggleWishlist = useWishlistStore((state) => state.toggleItem);
    const hasWishlist = useWishlistStore((state) => state.hasItem);
    const hydrated = useWishlistHydration();
    const isLoved = hydrated && hasWishlist(product.id);

    const toggleCompare = useCompareStore((state) => state.toggleCompareItem);
    const hasCompare = useCompareStore((state) => state.hasItem);
    const compareHydrated = useCompareHydration();
    const isCompared = compareHydrated && hasCompare(product.id);
    const compareLabel = isCompared
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

    const purch = resolvePurchasability(product.stock ?? (product.inStock ? 1 : undefined));
    // W121-A2: honest availability badge - never a fabricated qty fallback.
    const availabilityKind = resolveHonestAvailability(product);
    const stockLabel = honestAvailabilityLabel(availabilityKind, locale);
    const stockDotColor = availabilityKind === 'in_stock' ? 'bg-[#157A3B]' : 'bg-[#5B6470]';
    const stockTextColor = availabilityKind === 'in_stock' ? 'text-[#157A3B]' : 'text-[#5B6470]';
    const realStockQty =
        typeof product.stockQty === 'number' && product.stockQty > 0
            ? product.stockQty
            : typeof product.stockQuantity === 'number' && product.stockQuantity > 0
              ? product.stockQuantity
              : typeof product.stock === 'number' && product.stock > 0
                ? product.stock
                : null;
    const resolvedImage = resolveProductImageUrl({
        sku: product.sku,
        title: product.name,
        brand: product.brandName,
        category: product.categoryName,
        imageUrl: product.imageUrl,
    });
    const brandInfo = resolveProductBrandInfo({
        brand: product.brandName,
        title: product.name,
        sku: product.sku,
    });
    const cleanTitleLt = formatCleanCatalogProductTitle(
        product.name || '',
        product.sku,
        brandInfo.name,
    );
    const cleanTitle = localizeProductTitle(cleanTitleLt, locale);
    const rawTechChips = extractCardTechChips(cleanTitleLt, product.sku);
    const techChips = rawTechChips.map((chip) => localizeTechChip(chip, locale));
    const specLine = techChips.length > 0 ? techChips.join(' · ') : cardCopy.defaultStandardChip;
    const nodePurpose = cleanDash(
        localizeCategoryLabel(product.categoryName || brandInfo.name, locale),
    );
    const grossPrice =
        product.priceCents != null && product.priceCents > 0
            ? product.priceCents / 100
            : product.price;
    const displayedPrice = showNet ? grossPrice / 1.21 : grossPrice;
    const priceOnRequest = isPriceOnRequestProduct(product);
    const formattedPrice =
        !priceOnRequest && grossPrice > 0
            ? `${displayedPrice
                  .toFixed(2)
                  .replace('.', ',')
                  .replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} €`
            : null;

    const handleCopySku = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!product.sku) return;
        if (typeof navigator !== 'undefined' && navigator.clipboard) {
            navigator.clipboard.writeText(product.sku).catch(() => {});
        }
        setCopiedSku(true);
        setTimeout(() => setCopiedSku(false), 1200);
    };

    const handleQuickAdd = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (priceOnRequest) return;

        setIsAdding(true);
        addItem({
            id: product.id,
            productId: product.id,
            name: cleanTitle,
            price: product.price,
            sku: product.sku || `SKU-${product.id.slice(0, 8)}`,
            quantity: 1,
            image: resolvedImage,
        });

        setTimeout(() => {
            setIsAdding(false);
            openCart();
        }, 400);
    };

    return (
        <article
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            data-testid="b2b-spec-matrix-card"
            className="group flex flex-col justify-between h-full border-r border-b border-[#E2DDD3] bg-[#FFFFFF] p-4 sm:p-5 rounded-none transition-colors duration-150 hover:bg-[#FAF8F5]"
        >
            <div className="space-y-2.5">
                {/* Top Row: Stock Dot on Left + SKU Copy Button on Right */}
                <div className="flex items-center justify-between gap-2 text-xs">
                    {purch.soldOut ? (
                        <span className="font-bold text-[#B91C1C] truncate">
                            {cardCopy.soldOut}
                        </span>
                    ) : (
                        <span
                            title={`${stockLabel}${product.stockSource ? ` · ${product.stockSource}` : ''}`}
                            className={`inline-flex items-center gap-1.5 font-semibold ${stockTextColor} max-w-[64%] overflow-hidden whitespace-nowrap`}
                        >
                            <span className={`w-2 h-2 rounded-full ${stockDotColor} shrink-0`} />
                            <span className="sm:hidden">{stockLabel}</span>
                            <span className="hidden sm:inline">{stockLabel}</span>
                        </span>
                    )}

                    {product.sku && (
                        <button
                            type="button"
                            onClick={handleCopySku}
                            title={stockCopy.copySkuTitle}
                            aria-label={`${stockCopy.copySkuTitle} ${product.sku}`}
                            className={`${index < 3 ? 'font-mono' : 'tabular-nums'} min-w-0 max-w-[110px] sm:max-w-[150px] text-xs font-bold text-[#5B6470] hover:text-[#11161B] bg-transparent px-1 py-0.5 rounded-none truncate cursor-pointer transition-colors shrink-0`}
                        >
                            {copiedSku ? stockCopy.copied : product.sku}
                        </button>
                    )}
                </div>

                {/* Center: Square #EEEBE4 Studio Well (Artboard #4) */}
                <div className="relative h-36 sm:h-44 bg-[#EEEBE4] p-3.5 flex items-center justify-center overflow-hidden rounded-none">
                    <span className="pointer-events-none absolute left-2.5 top-2.5 z-10 bg-[#FFFFFF] px-2 py-0.5 text-xs font-bold text-[#11161B] rounded-none max-w-[70%] truncate">
                        {brandInfo.name}
                    </span>

                    {product.exactSkuMatch && (
                        <span className="pointer-events-none absolute left-2.5 bottom-2.5 z-10 bg-[#11161B] px-2 py-0.5 text-xs font-bold text-white rounded-none">
                            {cardCopy.exactCode}
                        </span>
                    )}

                    <button
                        type="button"
                        data-testid="product-wishlist-toggle"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            toggleWishlist({
                                id: product.id,
                                name: cleanTitle,
                                price: product.price,
                                image: resolvedImage,
                                sku: product.sku,
                                categoryName: nodePurpose,
                                priceOnRequest: priceOnRequest || undefined,
                            });
                        }}
                        aria-label={cardCopy.wishlistAria}
                        aria-pressed={isLoved}
                        className={`absolute top-2 right-2 z-10 flex h-8 w-8 items-center justify-center border border-[#D5CFC3] bg-white/95 rounded-none transition-colors duration-150 cursor-pointer ${
                            isLoved
                                ? 'text-[#C2410C] border-[#C2410C]'
                                : 'text-[#5B6470] hover:text-[#C2410C] hover:border-[#C2410C]'
                        }`}
                    >
                        <Heart className={`w-4 h-4 ${isLoved ? 'fill-current' : ''}`} />
                    </button>

                    <Link
                        href={`/${locale}/products/${product.slug || product.id}`}
                        aria-label={cleanTitle}
                        className="flex h-full w-full items-center justify-center bg-transparent"
                    >
                        <img
                            src={assetUrl(resolvedImage)}
                            alt={cleanTitle}
                            className={`max-h-full max-w-full object-contain mix-blend-multiply transition-transform duration-150 ${
                                isHovered ? 'scale-105' : 'scale-100'
                            }`}
                        />
                    </Link>
                </div>

                {/* Category Purpose + Product Title + Technical Spec Pills */}
                <div className="space-y-1.5 pt-0.5">
                    <div className="flex items-center justify-between gap-1 text-xs text-[#5B6470]">
                        <span className="sr-only">{cardCopy.purposeSrLabel}</span>
                        <span className="font-semibold text-[#C2410C] truncate">
                            {nodePurpose}
                        </span>
                    </div>

                    <Link
                        href={`/${locale}/products/${product.slug || product.id}`}
                        className="block text-xs sm:text-sm font-bold text-[#11161B] group-hover:text-[#C2410C] leading-snug line-clamp-2 min-h-[2.5rem] transition-colors"
                    >
                        {cleanTitle}
                    </Link>

                    <div className="flex flex-wrap gap-1 pt-0.5">
                        <span className="sr-only">{cardCopy.threadSrLabel}</span>
                        {(techChips.length > 0 ? techChips.slice(0, 3) : [specLine]).map((chip) => (
                            <span
                                key={chip}
                                className="bg-[#F5F3EE] border border-[#E2DDD3] px-2 py-0.5 text-xs font-medium text-[#2A323B] rounded-none truncate max-w-full"
                            >
                                {chip}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            {/* Bottom Row: Su/Be PVM Price + B2B Montuotojo Kaina Badge + Sharp '+ Į krepšelį' Button */}
            <div className="mt-3.5 pt-3 border-t border-[#E2DDD3] flex flex-col gap-2">
                <div className="flex items-end justify-between gap-2">
                    <div className="min-w-0">
                        {formattedPrice ? (
                            <div className="flex items-baseline gap-1.5 flex-wrap">
                                <span className="text-base sm:text-lg font-extrabold text-[#11161B] tabular-nums leading-none">
                                    {formattedPrice}
                                </span>
                                <span className="text-xs text-[#5B6470]">
                                    {showNet ? stockCopy.vatNetShort : stockCopy.vatGrossShort}
                                </span>
                            </div>
                        ) : (
                            <PriceDisplay
                                priceCents={
                                    product.priceCents ??
                                    (product.price > 0 ? Math.round(product.price * 100) : null)
                                }
                                vatRate={product.vatRate}
                                size="sm"
                            />
                        )}
                        <span
                            title={stockCopy.b2bInstallerDiscount}
                            className="block text-xs font-semibold text-[#8A2F07] mt-1 leading-tight"
                        >
                            {cardCopy.b2bRateLabel}
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
                                    id: product.id,
                                    slug: product.slug,
                                    sku: product.sku,
                                    name: cleanTitle,
                                    brand: brandInfo.name,
                                    price: grossPrice,
                                    image: resolvedImage,
                                    categoryName: nodePurpose,
                                    stockQty: realStockQty,
                                    specs: techChips,
                                    priceOnRequest: priceOnRequest || undefined,
                                });
                            }}
                            aria-pressed={isCompared}
                            aria-label={`${compareLabel}: ${cleanTitle}`}
                            className={`inline-flex items-center justify-center gap-1 border px-2 py-1.5 text-xs font-bold whitespace-nowrap transition-colors duration-150 rounded-none cursor-pointer ${
                                isCompared
                                    ? 'border-[#C2410C] bg-[#FBEADF] text-[#C2410C]'
                                    : 'border-[#D5CFC3] bg-white text-[#11161B] hover:border-[#11161B]'
                            }`}
                        >
                            <Scale className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                            <span>{compareLabel}</span>
                        </button>

                        {priceOnRequest ? (
                            <PriceRequestCta
                                sku={product.sku || `SKU-${product.id.slice(0, 8)}`}
                                title={cleanTitle}
                                compact
                                testId="product-card-price-request-cta"
                            />
                        ) : (
                            <button
                                type="button"
                                onClick={handleQuickAdd}
                                disabled={purch.soldOut || isAdding}
                                aria-label={cardCopy.addToCartAria}
                                className={`inline-flex items-center justify-center gap-1 rounded-none px-2.5 py-1.5 text-xs font-bold whitespace-nowrap transition-colors duration-150 disabled:cursor-not-allowed shrink-0 ${
                                    purch.soldOut
                                        ? 'bg-transparent border border-[#D5CFC3] text-[#5B6470]'
                                        : 'bg-[#11161B] hover:bg-[#C2410C] text-white cursor-pointer'
                                }`}
                            >
                                {isAdding ? (
                                    <>
                                        <Check className="w-3.5 h-3.5 shrink-0" />
                                        <span>{stockCopy.added}</span>
                                    </>
                                ) : purch.soldOut ? (
                                    <span>{cardCopy.soldOut}</span>
                                ) : (
                                    <span>{stockCopy.addToCart}</span>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </article>
    );
}
