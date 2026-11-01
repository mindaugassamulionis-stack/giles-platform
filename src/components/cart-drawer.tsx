'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Minus, Plus, ShoppingBag, ArrowRight, Trash2, Package, PartyPopper } from 'lucide-react';
import { useCartStore, useCartHydration } from '../store/cart';
import { useLocale } from 'next-intl';
import { assetUrl } from '../lib/api';
import { useStorefrontConfig } from './storefront-config-provider';
import { formatCatalogCount } from '../lib/w121-honest-commerce';
import { resolveAppLocale } from '../i18n/storefront-ui-copy';
import type { AppLocale } from '../i18n/routing';

const CART_DRAWER_I18N: Record<
    AppLocale,
    {
        title: string;
        itemCountLabel: (count: number) => string;
        closeAria: string;
        addMore: string;
        forFreeShipping: string;
        freeShippingWon: string;
        empty: string;
        emptyDesc: string;
        start: string;
        subtotal: string;
        shipping: string;
        freeShipping: string;
        total: string;
        buyNow: string;
        viewCart: string;
        decreaseQtyAria: string;
        increaseQtyAria: string;
        removeItemAria: string;
    }
> = {
    lt: {
        title: 'Krepšelis',
        itemCountLabel: (c) => `${c} ${c === 1 ? 'prekė' : 'prekės'}`,
        closeAria: 'Uždaryti krepšelį',
        addMore: 'Pridėkite dar už',
        forFreeShipping: 'nemokamam pristatymui!',
        freeShippingWon: 'Sveikiname! Jums priklauso nemokamas pristatymas!',
        empty: 'Jūsų krepšelis tuščias',
        emptyDesc: 'Pasirinkite katilus, degiklius ar katilinės armatūrą iš {count} pozicijų katalogo.',
        start: 'Pradėti apsipirkimą',
        subtotal: 'Tarpinė suma',
        shipping: 'Pristatymas',
        freeShipping: 'Nemokamas',
        total: 'Iš viso (su PVM)',
        buyNow: 'Pereiti prie apmokėjimo',
        viewCart: 'Peržiūrėti pilną krepšelį',
        decreaseQtyAria: 'Sumažinti kiekį',
        increaseQtyAria: 'Padidinti kiekį',
        removeItemAria: 'Pašalinti prekę',
    },
    en: {
        title: 'Your Cart',
        itemCountLabel: (c) => `${c} ${c === 1 ? 'item' : 'items'}`,
        closeAria: 'Close cart',
        addMore: 'Add',
        forFreeShipping: 'more for free shipping!',
        freeShippingWon: 'Congratulations! You qualify for free shipping!',
        empty: 'Your cart is empty',
        emptyDesc: 'Browse boilers, pellet burners, and hydronic components from our {count}-item catalog.',
        start: 'Browse Catalog',
        subtotal: 'Subtotal',
        shipping: 'Shipping',
        freeShipping: 'Free',
        total: 'Total (incl. VAT)',
        buyNow: 'Proceed to Checkout',
        viewCart: 'View full cart',
        decreaseQtyAria: 'Decrease quantity',
        increaseQtyAria: 'Increase quantity',
        removeItemAria: 'Remove item',
    },
    pl: {
        title: 'Twój koszyk',
        itemCountLabel: (c) => `${c} ${c === 1 ? 'produkt' : c >= 2 && c <= 4 ? 'produkty' : 'produktów'}`,
        closeAria: 'Zamknij koszyk',
        addMore: 'Dodaj jeszcze za',
        forFreeShipping: 'do darmowej dostawy!',
        freeShippingWon: 'Gratulacje! Masz darmową dostawę!',
        empty: 'Twój koszyk jest pusty',
        emptyDesc: 'Wybierz kotły, palniki peletowe lub armaturę z katalogu {count} produktów.',
        start: 'Przejdź do katalogu',
        subtotal: 'Suma częściowa',
        shipping: 'Dostawa',
        freeShipping: 'Bezpłatna',
        total: 'Razem (z VAT)',
        buyNow: 'Przejdź do kasy',
        viewCart: 'Zobacz pełny koszyk',
        decreaseQtyAria: 'Zmniejsz ilość',
        increaseQtyAria: 'Zwiększ ilość',
        removeItemAria: 'Usuń produkt',
    },
    ru: {
        title: 'Ваша корзина',
        itemCountLabel: (c) => `${c} шт.`,
        closeAria: 'Закрыть корзину',
        addMore: 'Добавьте еще на',
        forFreeShipping: 'до бесплатной доставки!',
        freeShippingWon: 'Поздравляем! Бесплатная доставка активирована!',
        empty: 'Ваша корзина пуста',
        emptyDesc: 'Выберите котлы, пеллетные горелки или арматуру из каталога на {count} позиций.',
        start: 'Перейти в каталог',
        subtotal: 'Промежуточный итог',
        shipping: 'Доставка',
        freeShipping: 'Бесплатно',
        total: 'Итого (с НДС)',
        buyNow: 'Перейти к оформлению',
        viewCart: 'Открыть полную корзину',
        decreaseQtyAria: 'Уменьшить количество',
        increaseQtyAria: 'Увеличить количество',
        removeItemAria: 'Удалить товар',
    },
};

export function CartDrawer() {
    const intlLocale = useLocale() || 'lt';
    const rawPathname = usePathname() || '';
    const urlMatch = rawPathname.match(/^\/(lt|en|pl|ru)(?=\/|$)/i);
    const locale = resolveAppLocale(urlMatch ? urlMatch[1] : intlLocale);
    const copy = CART_DRAWER_I18N[locale];
    const { items, isOpen, closeCart, removeItem, updateQuantity, getSubtotal, getShipping, getTotal, getItemCount } = useCartStore();
    const hydrated = useCartHydration();

    if (!hydrated) return null;

    const freeShippingThreshold = 50;
    const subtotal = getSubtotal();
    const remainingForFreeShipping = freeShippingThreshold - subtotal;
    const progressPercentage = Math.min((subtotal / freeShippingThreshold) * 100, 100);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={closeCart}
                        className="fixed inset-0 bg-zinc-900/60 backdrop-blur-sm z-50"
                    />

                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 30, stiffness: 350 }}
                        className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col"
                    >
                        <div className="flex items-center justify-between p-5 border-b border-zinc-100">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center">
                                    <ShoppingBag className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h2 className="font-bold font-display text-lg">{copy.title}</h2>
                                    <p className="text-xs text-zinc-500">{copy.itemCountLabel(getItemCount())}</p>
                                </div>
                            </div>
                            <button
                                onClick={closeCart}
                                aria-label={copy.closeAria}
                                className="p-2 hover:bg-zinc-100 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5 text-zinc-400" />
                            </button>
                        </div>

                        {items.length > 0 && (
                            <div className="px-5 py-3 bg-emerald-50 border-b border-emerald-100">
                                {remainingForFreeShipping > 0 ? (
                                    <>
                                        <p className="text-sm text-emerald-700 mb-2">
                                            {copy.addMore} <span className="font-bold">{remainingForFreeShipping.toFixed(2)} €</span> {copy.forFreeShipping}
                                        </p>
                                        <div className="h-2 bg-emerald-100 rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${progressPercentage}%` }}
                                                className="h-full bg-emerald-500 rounded-full"
                                            />
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex items-center gap-2 text-emerald-700">
                                        <PartyPopper className="w-5 h-5" aria-hidden="true" />
                                        <p className="text-sm font-medium">{copy.freeShippingWon}</p>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="flex-1 overflow-y-auto">
                            {items.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-center p-8">
                                    <div className="w-24 h-24 bg-zinc-50 rounded-full flex items-center justify-center mb-6">
                                        <Package className="w-10 h-10 text-zinc-300" />
                                    </div>
                                    <h3 className="font-bold text-xl mb-2 text-zinc-900">{copy.empty}</h3>
                                    <p className="text-zinc-500 mb-8 max-w-[240px]">
                                        {copy.emptyDesc.replaceAll('{count}', formatCatalogCount(useStorefrontConfig().catalog?.skuCount ?? 0, locale))}
                                    </p>
                                    <Link
                                        href={`/${locale}/products`}
                                        onClick={closeCart}
                                        className="px-6 py-3 bg-zinc-900 text-white rounded-xl font-bold hover:bg-zinc-800 transition-colors flex items-center gap-2"
                                    >
                                        {copy.start} <ArrowRight className="w-4 h-4" />
                                    </Link>
                                </div>
                            ) : (
                                <div className="p-5 space-y-4">
                                    <AnimatePresence mode="popLayout">
                                        {items.map((item) => (
                                            <motion.div
                                                layout
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, x: 100, scale: 0.9 }}
                                                key={item.id}
                                                className="flex gap-4 p-4 bg-zinc-50 rounded-2xl group hover:bg-zinc-100 transition-colors"
                                            >
                                                <Link
                                                    href={`/${locale}/products/${item.productId}`}
                                                    onClick={closeCart}
                                                    className="w-20 h-20 bg-white rounded-xl flex items-center justify-center shrink-0 overflow-hidden relative border border-zinc-100 hover:border-zinc-300 transition-colors"
                                                >
                                                    {item.image ? (
                                                        <Image
                                                            src={assetUrl(item.image)}
                                                            alt={item.name}
                                                            fill
                                                            className="object-contain p-2"
                                                            sizes="80px"
                                                        />
                                                    ) : (
                                                        <Package className="w-8 h-8 text-zinc-300" />
                                                    )}
                                                </Link>

                                                <div className="flex-1 min-w-0 flex flex-col justify-between">
                                                    <div>
                                                        <Link
                                                            href={`/${locale}/products/${item.productId}`}
                                                            onClick={closeCart}
                                                            className="font-bold text-zinc-900 leading-tight hover:text-emerald-600 transition-colors line-clamp-2"
                                                        >
                                                            {item.name}
                                                        </Link>
                                                        <p className="text-xs text-zinc-400 mt-0.5 font-mono">{item.sku}</p>
                                                    </div>

                                                    <div className="flex items-center justify-between mt-2">
                                                        <div className="flex items-center bg-white rounded-lg border border-zinc-200 h-9">
                                                            <button
                                                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                                aria-label={copy.decreaseQtyAria}
                                                                className="w-9 h-full flex items-center justify-center hover:bg-zinc-50 rounded-l-lg transition-colors text-zinc-500 hover:text-zinc-900"
                                                            >
                                                                <Minus className="w-3 h-3" />
                                                            </button>
                                                            <span className="w-8 text-center text-sm font-bold text-zinc-900">{item.quantity}</span>
                                                            <button
                                                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                                aria-label={copy.increaseQtyAria}
                                                                className="w-9 h-full flex items-center justify-center hover:bg-zinc-50 rounded-r-lg transition-colors text-zinc-500 hover:text-zinc-900"
                                                            >
                                                                <Plus className="w-3 h-3" />
                                                            </button>
                                                        </div>

                                                        <div className="flex items-center gap-3">
                                                            <p className="font-bold text-zinc-900">
                                                                {(item.price * item.quantity).toFixed(2)} €
                                                            </p>
                                                            <button
                                                                onClick={() => removeItem(item.id)}
                                                                aria-label={copy.removeItemAria}
                                                                className="p-2 text-zinc-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </div>
                            )}
                        </div>

                        {items.length > 0 && (
                            <div className="border-t border-zinc-100 p-5 bg-white">
                                <div className="space-y-3 mb-5">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-zinc-500">{copy.subtotal}</span>
                                        <span className="font-medium text-zinc-900">{getSubtotal().toFixed(2)} €</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-zinc-500">{copy.shipping}</span>
                                        <span className={getShipping() === 0 ? 'text-emerald-600 font-medium' : 'text-zinc-900'}>
                                            {getShipping() === 0 ? copy.freeShipping : `${getShipping().toFixed(2)} €`}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-lg font-bold pt-3 border-t border-zinc-100">
                                        <span>{copy.total}</span>
                                        <span>{getTotal().toFixed(2)} €</span>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    {/* W121-A2: a cart holding price-on-request rows cannot
                                        complete standard checkout — route it to the RFQ form. */}
                                    {items.some((i) => i.priceOnRequest === true || i.price == null || i.price <= 0) ? (
                                        <Link
                                            href={`/${locale}/uzklausa?kodas=${encodeURIComponent(
                                                items
                                                    .filter((i) => i.priceOnRequest === true || i.price == null || i.price <= 0)
                                                    .map((i) => i.sku)
                                                    .join(','),
                                            )}`}
                                            onClick={closeCart}
                                            data-testid="cart-drawer-rfq-route"
                                            className="w-full py-4 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all hover:shadow-lg active:scale-[0.98] flex items-center justify-center gap-2"
                                        >
                                            {copy.buyNow}
                                        </Link>
                                    ) : (
                                    <Link
                                        href={`/${locale}/checkout`}
                                        onClick={() => {
                                            closeCart();
                                            const w = window as any;
                                            const total = getTotal();
                                            const contents = items.map((i) => ({
                                                id: i.sku,
                                                quantity: i.quantity,
                                                item_price: i.price,
                                            }));

                                            if (w.fbq) {
                                                w.fbq('track', 'InitiateCheckout', {
                                                    content_ids: items.map((i) => i.sku),
                                                    content_type: 'product',
                                                    value: total,
                                                    currency: 'EUR',
                                                    num_items: getItemCount(),
                                                    contents,
                                                });
                                            }
                                            if (w.ttq) {
                                                w.ttq.track('InitiateCheckout', {
                                                    contents: contents.map((c) => ({
                                                        content_id: c.id,
                                                        content_name: items.find((i) => i.sku === c.id)?.name,
                                                        quantity: c.quantity,
                                                        price: c.item_price,
                                                    })),
                                                    value: total,
                                                    currency: 'EUR',
                                                });
                                            }
                                        }}
                                        className="w-full py-4 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all hover:shadow-lg active:scale-[0.98] flex items-center justify-center gap-2"
                                    >
                                        {copy.buyNow} <ArrowRight className="w-4 h-4" />
                                    </Link>
                                    )}
                                    <Link
                                        href={`/${locale}/cart`}
                                        onClick={closeCart}
                                        className="w-full py-3 text-center text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors block"
                                    >
                                        {copy.viewCart}
                                    </Link>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
