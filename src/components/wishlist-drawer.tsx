'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { Heart, X, ShoppingCart, Trash2, CheckCircle2 } from 'lucide-react';
import { useLocale } from 'next-intl';
import { useWishlistStore, useWishlistHydration, type WishlistItem } from '../store/wishlist';
import { useCartStore } from '../store/cart';
import { useVatDisplayStore } from '../store/vat-display';
import { assetUrl } from '../lib/api';
import { resolveAppLocale } from '../i18n/storefront-ui-copy';
import type { AppLocale } from '../i18n/routing';
import { formatEurAmount } from '../lib/format';
import { PRICE_REQUEST_COPY } from '../lib/w121-honest-commerce';
import { PriceRequestCta } from './price-request-cta';

export const WISHLIST_DRAWER_I18N: Record<
    AppLocale,
    {
        title: string;
        subtitle: (count: number) => string;
        closeAria: string;
        emptyTitle: string;
        emptyDesc: string;
        browseCatalog: string;
        skuLabel: string;
        inStockBadge: string;
        vatGross: string;
        vatNet: string;
        addToCart: string;
        removeItem: string;
        moveAllToCart: string;
        clearAll: string;
    }
> = {
    lt: {
        title: 'Įsimintos prekės',
        subtitle: (c) => `${c} ${c === 1 ? 'prekė' : 'prekės (-ių)'} sąraše`,
        closeAria: 'Uždaryti įsimintų prekių sąrašą',
        emptyTitle: 'Įsimintų prekių sąrašas tuščias',
        emptyDesc:
            'Paspauskite širdelės simbolį (♡) ant bet kurio katilo, granulių degiklio, radiatoriaus ar vožtuvo kortelės, kad išsaugotumėte palyginimui arba sąmatai.',
        browseCatalog: 'Peržiūrėti katalogą',
        skuLabel: 'Kodas:',
        inStockBadge: 'Sandėlyje Kaune / Vilniuje',
        vatGross: 'su PVM',
        vatNet: 'be PVM',
        addToCart: 'Į krepšelį',
        removeItem: 'Pašalinti',
        moveAllToCart: 'Perkelti visas į krepšelį',
        clearAll: 'Išvalyti sąrašą',
    },
    en: {
        title: 'Saved Items',
        subtitle: (c) => `${c} ${c === 1 ? 'item' : 'items'} saved`,
        closeAria: 'Close saved items drawer',
        emptyTitle: 'No saved items yet',
        emptyDesc:
            'Click the heart icon (♡) on any boiler, pellet burner, radiator, or hydronic valve card to save items for comparison or project estimation.',
        browseCatalog: 'Browse Catalog',
        skuLabel: 'SKU:',
        inStockBadge: 'In stock in Kaunas / Vilnius',
        vatGross: 'incl. VAT',
        vatNet: 'excl. VAT',
        addToCart: 'Add to cart',
        removeItem: 'Remove',
        moveAllToCart: 'Add all to cart',
        clearAll: 'Clear list',
    },
    pl: {
        title: 'Zapisane produkty',
        subtitle: (c) => `${c} ${c === 1 ? 'produkt' : 'produktów'} na liście`,
        closeAria: 'Zamknij listę zapisanych produktów',
        emptyTitle: 'Lista zapisanych produktów jest pusta',
        emptyDesc:
            'Kliknij ikonę serca (♡) przy dowolnym kotle, palniku peletowym, grzejniku lub zaworze, aby zapisać go do kosztorysu.',
        browseCatalog: 'Przejdź do katalogu',
        skuLabel: 'Kod:',
        inStockBadge: 'W magazynie Kowno / Wilno',
        vatGross: 'z VAT',
        vatNet: 'bez VAT',
        addToCart: 'Do koszyka',
        removeItem: 'Usuń',
        moveAllToCart: 'Przenieś wszystkie do koszyka',
        clearAll: 'Wyczyść listę',
    },
    ru: {
        title: 'Избранные товары',
        subtitle: (c) => `${c} поз. в списке`,
        closeAria: 'Закрыть избранное',
        emptyTitle: 'Список избранных товаров пуст',
        emptyDesc:
            'Нажмите на значок сердечка (♡) на карточке котла, пеллетной горелки, радиатора или клапана, чтобы сохранить товар для сметы.',
        browseCatalog: 'Перейти в каталог',
        skuLabel: 'Артикул:',
        inStockBadge: 'На складе в Каунасе / Вильнюсе',
        vatGross: 'с НДС',
        vatNet: 'без НДС',
        addToCart: 'В корзину',
        removeItem: 'Удалить',
        moveAllToCart: 'Перенести все в корзину',
        clearAll: 'Очистить список',
    },
};

export function WishlistDrawer() {
    const intlLocale = useLocale() || 'lt';
    const rawPathname = usePathname() || '';
    const urlMatch = rawPathname.match(/^\/(lt|en|pl|ru)(?=\/|$)/i);
    const locale = resolveAppLocale(urlMatch ? urlMatch[1] : intlLocale);
    const copy = WISHLIST_DRAWER_I18N[locale];

    const items = useWishlistStore((s) => s.items);
    const isOpen = useWishlistStore((s) => s.isOpen);
    const closeWishlist = useWishlistStore((s) => s.closeWishlist);
    const removeItem = useWishlistStore((s) => s.removeItem);
    const clearWishlist = useWishlistStore((s) => s.clearWishlist);
    const hydrated = useWishlistHydration();

    const addCartItem = useCartStore((s) => s.addItem);
    const openCart = useCartStore((s) => s.openCart);
    const showNet = useVatDisplayStore((s) => s.showNet);

    useEffect(() => {
        if (!isOpen) return;
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') closeWishlist();
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [isOpen, closeWishlist]);

    if (!hydrated || !isOpen) return null;

    const handleAddSingle = (item: WishlistItem) => {
        addCartItem({
            id: item.id,
            productId: item.id,
            name: item.name,
            price: item.price,
            sku: item.sku || item.id,
            quantity: 1,
            image: item.image,
            priceOnRequest: item.priceOnRequest,
        });
        closeWishlist();
        openCart();
    };

    const handleMoveAllToCart = () => {
        for (const item of items) {
            addCartItem({
                id: item.id,
                productId: item.id,
                name: item.name,
                price: item.price,
                sku: item.sku || item.id,
                quantity: 1,
                image: item.image,
                priceOnRequest: item.priceOnRequest,
            });
        }
        closeWishlist();
        openCart();
    };

    return (
        <div
            data-testid="wishlist-drawer"
            role="dialog"
            aria-modal="true"
            aria-label={copy.title}
            className="fixed inset-0 z-50 flex justify-end"
        >
            <div
                onClick={closeWishlist}
                className="fixed inset-0 bg-[#0B0F13]/70 transition-opacity"
            />

            <aside className="relative z-10 flex h-full w-full max-w-md flex-col bg-[#F5F3EE] text-[#11161B] border-l border-[#2C3742] shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between bg-[#11161B] text-[#F5F3EE] px-5 py-4 border-b border-[#2C3742]">
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center border border-[#2C3742] bg-[#1B232C] text-[#FF8A3D]">
                            <Heart className="h-4 w-4 fill-current" />
                        </div>
                        <div>
                            <h2 className="text-base font-extrabold text-white leading-tight">
                                {copy.title}
                            </h2>
                            <p className="text-xs text-[#A3ADB8]">{copy.subtitle(items.length)}</p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={closeWishlist}
                        aria-label={copy.closeAria}
                        data-testid="wishlist-drawer-close"
                        className="flex h-9 w-9 items-center justify-center border border-[#2C3742] bg-[#1B232C] text-[#C9D0D8] hover:border-[#FF8A3D] hover:text-white transition-colors cursor-pointer"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {items.length === 0 ? (
                        <div className="border border-[#E2DDD3] bg-white p-8 text-center space-y-3 my-6">
                            <div className="mx-auto flex h-12 w-12 items-center justify-center bg-[#EEEBE4] text-[#5B6470]">
                                <Heart className="h-6 w-6" />
                            </div>
                            <h3 className="text-base font-extrabold text-[#11161B]">
                                {copy.emptyTitle}
                            </h3>
                            <p className="text-xs text-[#5B6470] leading-relaxed">
                                {copy.emptyDesc}
                            </p>
                            <div className="pt-2">
                                <Link
                                    href={`/${locale}/products`}
                                    onClick={closeWishlist}
                                    className="inline-flex h-10 items-center justify-center bg-[#11161B] hover:bg-[#C2410C] px-5 text-xs font-bold text-white transition-colors"
                                >
                                    {copy.browseCatalog}
                                </Link>
                            </div>
                        </div>
                    ) : (
                        items.map((item) => {
                            const priceless = item.priceOnRequest === true || !(Number(item.price) > 0);
                            const unitGross = Number(item.price || 0);
                            const displayedPrice = showNet ? unitGross / 1.21 : unitGross;
                            const formattedPrice = priceless
                                ? PRICE_REQUEST_COPY[locale].onRequestLabel
                                : `${formatEurAmount(displayedPrice)} €`;

                            return (
                                <div
                                    key={item.id}
                                    data-testid={`wishlist-drawer-item-${item.sku || item.id}`}
                                    className="border border-[#E2DDD3] bg-white p-3.5 flex gap-3.5 items-start"
                                >
                                    <Link
                                        href={`/${locale}/products/${encodeURIComponent(item.sku || item.id)}`}
                                        onClick={closeWishlist}
                                        className="h-20 w-20 shrink-0 bg-[#EEEBE4] border border-[#E2DDD3] p-2 flex items-center justify-center"
                                    >
                                        {item.image ? (
                                            <img
                                                src={assetUrl(item.image)}
                                                alt={item.name}
                                                className="max-h-full max-w-full object-contain mix-blend-multiply"
                                            />
                                        ) : (
                                            <Heart className="h-6 w-6 text-[#5B6470]" />
                                        )}
                                    </Link>

                                    <div className="min-w-0 flex-1 space-y-1.5">
                                        <div className="flex items-center justify-between gap-2 text-[11px] text-[#5B6470]">
                                            <span className="font-mono font-bold text-[#11161B] truncate">
                                                {copy.skuLabel} {item.sku || item.id}
                                            </span>
                                            <span className="inline-flex items-center gap-1 font-semibold text-[#157A3B] shrink-0">
                                                <CheckCircle2 className="h-3 w-3" />
                                                <span>{item.stockStatus || copy.inStockBadge}</span>
                                            </span>
                                        </div>

                                        <Link
                                            href={`/${locale}/products/${encodeURIComponent(item.sku || item.id)}`}
                                            onClick={closeWishlist}
                                            className="block text-xs font-bold text-[#11161B] hover:text-[#C2410C] line-clamp-2 leading-snug"
                                        >
                                            {item.name}
                                        </Link>

                                        <div className="flex items-center justify-between gap-2 pt-1">
                                            <div>
                                                <span className="text-sm font-extrabold text-[#11161B] tabular-nums">
                                                    {formattedPrice}
                                                </span>{' '}
                                                <span className="text-[11px] text-[#5B6470]">
                                                    {showNet ? copy.vatNet : copy.vatGross}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-1.5">
                                                {priceless ? (
                                                    <PriceRequestCta
                                                        sku={item.sku || item.id}
                                                        title={item.name}
                                                        compact
                                                        testId={`wishlist-request-price-${item.sku || item.id}`}
                                                    />
                                                ) : (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleAddSingle(item)}
                                                        data-testid={`wishlist-add-to-cart-${item.sku || item.id}`}
                                                        className="inline-flex items-center gap-1 bg-[#11161B] hover:bg-[#C2410C] px-2.5 py-1.5 text-xs font-bold text-white transition-colors cursor-pointer"
                                                    >
                                                        <ShoppingCart className="h-3 w-3" />
                                                        <span>{copy.addToCart}</span>
                                                    </button>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={() => removeItem(item.id)}
                                                    aria-label={`${copy.removeItem} ${item.name}`}
                                                    title={copy.removeItem}
                                                    data-testid={`wishlist-remove-${item.sku || item.id}`}
                                                    className="inline-flex h-7 w-7 items-center justify-center border border-[#D5CFC3] bg-white text-[#5B6470] hover:border-[#B91C1C] hover:text-[#B91C1C] transition-colors cursor-pointer"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Footer */}
                {items.length > 0 && (
                    <div className="border-t border-[#E2DDD3] bg-white p-4 space-y-2">
                        <button
                            type="button"
                            onClick={handleMoveAllToCart}
                            data-testid="wishlist-move-all-to-cart"
                            className="w-full inline-flex h-11 items-center justify-center gap-2 bg-[#C2410C] hover:bg-[#9A3412] px-4 text-xs sm:text-sm font-bold text-white transition-colors cursor-pointer"
                        >
                            <ShoppingCart className="h-4 w-4" />
                            <span>{copy.moveAllToCart}</span>
                        </button>
                        <div className="flex items-center justify-between pt-1">
                            <Link
                                href={`/${locale}/wishlist`}
                                onClick={closeWishlist}
                                className="text-xs font-bold text-[#11161B] hover:text-[#C2410C] underline underline-offset-2"
                            >
                                {copy.title} ({items.length})
                            </Link>
                            <button
                                type="button"
                                onClick={clearWishlist}
                                className="text-xs font-semibold text-[#5B6470] hover:text-[#B91C1C] cursor-pointer"
                            >
                                {copy.clearAll}
                            </button>
                        </div>
                    </div>
                )}
            </aside>
        </div>
    );
}
