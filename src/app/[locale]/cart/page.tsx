'use client';

import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { useCartStore, useCartHydration } from '../../../store/cart';
import { Minus, Plus, X, ShoppingBag, ArrowLeft } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { assetUrl } from '../../../lib/api';

export default function CartPage() {
    const t = useTranslations();
    const { items, removeItem, updateQuantity, getSubtotal, getShipping, getTotal, clearCart } = useCartStore();
    const hydrated = useCartHydration();

    const subtotal = hydrated ? getSubtotal() : 0;
    const shipping = hydrated ? getShipping() : 0;
    const total = hydrated ? getTotal() : 0;

    if (!hydrated) {
        return (
            <div className="container mx-auto px-4 py-8" aria-busy="true">
                <div>
                    <div className="h-10 w-48 bg-[var(--muted)] rounded mb-8" />
                    <div className="grid gap-8 lg:grid-cols-3">
                        <div className="lg:col-span-2 space-y-4">
                            {[1, 2].map(i => (
                                <div key={i} className="h-24 bg-[var(--muted)] rounded" />
                            ))}
                        </div>
                        <div className="h-64 bg-[var(--muted)] rounded" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold tracking-tight">{t('cartPage.title')}</h1>
                {items.length > 0 && (
                    <button
                        onClick={clearCart}
                        className="text-sm text-muted-foreground hover:text-destructive transition-colors"
                    >
                        {t('cartPage.clear')}
                    </button>
                )}
            </div>

            {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed py-20 text-center">
                    <ShoppingBag className="w-16 h-16 text-muted-foreground/30 mb-4" />
                    <p className="mb-6 text-muted-foreground text-lg">{t('cart.emptyCart')}</p>
                    <Link
                        href="/products"
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-8 text-sm font-medium text-primary-foreground shadow transition-all hover:bg-primary/90 hover:shadow-md"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        {t('cartPage.browse')}
                    </Link>
                </div>
            ) : (
                <div className="grid gap-8 lg:grid-cols-3">
                    {/* Cart Items */}
                    <div className="lg:col-span-2 space-y-4">
                        {items.map(item => (
                            <div
                                key={item.id}
                                className="flex gap-4 p-4 bg-card rounded-xl border border-border hover:border-primary/20 transition-colors"
                            >
                                <div className="flex h-24 w-24 items-center justify-center rounded-lg bg-muted text-3xl shrink-0 overflow-hidden relative">
                                    {item.image ? (
                                        <Image
                                            src={assetUrl(item.image)}
                                            alt={item.name}
                                            fill
                                            className="object-cover"
                                            sizes="96px"
                                        />
                                    ) : (
                                        <span>📦</span>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <Link
                                        href={`/products/${item.id}`}
                                        className="font-semibold hover:text-primary transition-colors line-clamp-1"
                                    >
                                        {item.name}
                                    </Link>
                                    <p className="text-sm text-muted-foreground mt-1">SKU: {item.sku}</p>
                                    <p className="text-sm text-muted-foreground">
                                        {item.price.toFixed(2)} € / vnt.
                                    </p>
                                </div>
                                <div className="flex flex-col items-end justify-between">
                                    <button
                                        onClick={() => removeItem(item.id)}
                                        className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                                        aria-label={t('cartPage.removeItem')}
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center border rounded-lg bg-background">
                                            <button
                                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                className="p-2 hover:bg-muted transition-colors rounded-l-lg"
                                                aria-label={t('cartPage.decrease')}
                                            >
                                                <Minus className="w-4 h-4" />
                                            </button>
                                            <span className="px-4 font-medium min-w-[40px] text-center">
                                                {item.quantity}
                                            </span>
                                            <button
                                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                className="p-2 hover:bg-muted transition-colors rounded-r-lg"
                                                aria-label={t('cartPage.increase')}
                                            >
                                                <Plus className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <p className="font-bold text-lg min-w-[80px] text-right">
                                            {(item.price * item.quantity).toFixed(2)} €
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Order Summary */}
                    <div className="h-fit rounded-2xl border border-border bg-card p-6 shadow-sm lg:sticky lg:top-24">
                        <h2 className="mb-6 text-xl font-semibold">{t('cartPage.summary')}</h2>

                        <div className="space-y-3 mb-4">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">{t('cartPage.subtotal')}</span>
                                <span className="font-medium">{subtotal.toFixed(2)} €</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">{t('checkoutPage.shipping')}</span>
                                <span className={shipping === 0 ? 'text-emerald-600 font-medium' : 'font-medium'}>
                                    {shipping === 0 ? 'Nemokamas' : `${shipping.toFixed(2)} €`}
                                </span>
                            </div>
                        </div>

                        {shipping > 0 && (
                            <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg">
                                <p className="text-xs text-emerald-700 dark:text-emerald-400">
                                    {t('cartPage.freeShipProgress')} <strong>{subtotal.toFixed(2)} €</strong>
                                </p>
                            </div>
                        )}

                        <div className="flex justify-between border-t border-border pt-4 text-xl font-bold">
                            <span>{t('cartPage.total')}</span>
                            <span>{total.toFixed(2)} €</span>
                        </div>

                        <Link
                            href="/checkout"
                            className="mt-6 w-full inline-flex h-12 items-center justify-center rounded-xl bg-primary text-base font-semibold text-primary-foreground shadow transition-all hover:bg-primary/90 hover:shadow-lg"
                        >
                            {t('cartPage.continue')}
                        </Link>

                        <p className="mt-4 text-center text-xs text-muted-foreground">
                            Tęsdami sutinkate su{' '}
                            <Link href="/legal/terms" className="underline hover:text-primary">
                                {t('cartPage.terms')}
                            </Link>
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
