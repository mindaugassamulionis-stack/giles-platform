'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useCartStore } from '../../store/cart';
import { useTranslations, useLocale } from 'next-intl';
import { formatEur } from '../../lib/conversion';
import type { CatalogProduct } from '../../lib/catalog';
import { resolvePurchasability } from '../../lib/purchasable';
import { assetUrl } from '../../lib/api';
import { resolveProductImageUrl } from '../../lib/product-visuals';
import { resolveProductBrandInfo } from '../../lib/v3-description';

// R2 conversion catalog + W33-B2 visual overhaul: 100% real .webp equipment
// photos and official manufacturer SVG brand logos on every catalog card.
export function CatalogView({ products }: { products: CatalogProduct[] }) {
    const t = useTranslations();
    const locale = useLocale();
    const [query, setQuery] = useState('');
    const [category, setCategory] = useState<string>('visi');
    const [addedId, setAddedId] = useState<string | null>(null);
    const addItem = useCartStore((s) => s.addItem);
    const openCart = useCartStore((s) => s.openCart);

    const categories = useMemo(
        () => ['visi', ...Array.from(new Set(products.map((p) => p.category)))],
        [products],
    );

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        return products.filter((p) => {
            const matchesCategory = category === 'visi' || p.category === category;
            const matchesQuery =
                !q ||
                p.sku.toLowerCase().includes(q) ||
                p.name.toLowerCase().includes(q) ||
                p.description.toLowerCase().includes(q) ||
                p.category.toLowerCase().includes(q) ||
                (p.brand ?? '').toLowerCase().includes(q);
            return matchesCategory && matchesQuery;
        });
    }, [products, query, category]);

    function handleAdd(p: CatalogProduct, resolvedImg: string) {
        addItem({
            id: p.variantId,
            productId: p.id,
            variantId: p.variantId,
            name: p.name,
            price: p.price,
            sku: p.sku,
            image: resolvedImg,
        });
        setAddedId(p.variantId);
        setTimeout(() => setAddedId((cur) => (cur === p.variantId ? null : cur)), 1600);
    }

    return (
        <section id="katalogas" aria-label={t('catalog.label')} className="container mx-auto px-4 py-16 md:py-24">
            <div className="mb-10">
                <p className="font-mono text-xs uppercase tracking-[0.25em] text-[var(--primary)] mb-2">{t('home.labStripKicker')}</p>
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <h2 className="font-display text-3xl md:text-4xl font-bold">{t('catalog.title')}</h2>
                    <div className="relative w-full md:max-w-xs">
                        <input
                            type="search"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder={t('catalog.searchPlaceholder')}
                            aria-label={t('catalog.searchLabel')}
                            className="w-full rounded-[2px] border border-border bg-card px-5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[var(--ring)]"
                        />
                    </div>
                </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-10" role="tablist" aria-label={t('catalog.categoriesLabel')}>
                {categories.map((c) => (
                    <button
                        key={c}
                        role="tab"
                        aria-selected={category === c}
                        onClick={() => setCategory(c)}
                        className={`rounded-[2px] px-4 py-1.5 text-sm font-semibold transition-colors duration-150 ${
                            category === c
                                ? 'bg-[var(--accent)] text-[var(--accent-foreground)]'
                                : 'bg-muted text-muted-foreground hover:bg-[var(--accent)]/10 hover:text-[var(--accent)]'
                        }`}
                    >
                        {c === 'visi' ? t('catalog.all') : c}
                    </button>
                ))}
            </div>

            {filtered.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                    <p className="text-lg mb-2">{t('catalog.empty')}</p>
                    <p className="text-sm">{t('catalog.emptyHint')}</p>
                </div>
            ) : (
                <ul className="grid grid-cols-1 gap-6 md:gap-8 sm:grid-cols-2 lg:grid-cols-3">
                    {filtered.map((p) => {
                        const purch = resolvePurchasability(p.stock);
                        const resolvedImg = resolveProductImageUrl({
                            sku: p.sku,
                            title: p.name,
                            brand: p.brand,
                            category: p.category,
                            imageUrl: p.image,
                        });
                        const brandInfo = resolveProductBrandInfo({
                            brand: p.brand,
                            title: p.name,
                            sku: p.sku,
                            description: p.description,
                        });
                        return (
                            <li key={p.id} className="group flex flex-col rounded-[2px] border border-border bg-card overflow-hidden transition-all duration-150 hover:border-[var(--primary)]/50">
                                <Link href={`/${locale}/products/${p.slug || p.id}`} className="relative block aspect-square overflow-hidden bg-muted/60 p-6" tabIndex={-1} aria-hidden="true">
                                    <div className="absolute top-3 left-3 z-10 flex items-center gap-2 rounded-[2px] border border-border bg-card/95 px-2 py-1">
                                        <img
                                            src={assetUrl(brandInfo.logoPath)}
                                            alt={brandInfo.name}
                                            className="h-5 w-auto object-contain"
                                        />
                                    </div>
                                    <span className="absolute top-3 right-3 z-10 font-mono text-[11px] font-semibold bg-card/95 border border-border px-2 py-0.5 rounded-[2px] text-foreground">
                                        {p.sku}
                                    </span>
                                    <img
                                        src={assetUrl(resolvedImg)}
                                        alt={p.name}
                                        className="h-full w-full object-contain transition-transform duration-150 group-hover:scale-105"
                                    />
                                </Link>
                                <div className="flex flex-col flex-grow p-4">
                                    <div className="flex items-center justify-between gap-2 mb-1">
                                        <span className="font-mono text-xs uppercase tracking-wide text-muted-foreground">{p.category}</span>
                                        <span className="font-mono text-[11px] font-medium text-[var(--primary)]">{brandInfo.name}</span>
                                    </div>
                                    <Link href={`/${locale}/products/${p.slug || p.id}`} className="font-display font-semibold leading-snug hover:text-[var(--accent)]">
                                        {p.name}
                                    </Link>
                                    <p className="mt-1 font-mono text-[11px] text-muted-foreground">
                                        {brandInfo.origin}
                                    </p>
                                    <div className="mt-2 flex items-baseline gap-2 flex-wrap">
                                        <span className="text-lg font-bold font-mono">{formatEur(p.price)}</span>
                                        {p.compareAtPrice && p.compareAtPrice > p.price && (
                                            <>
                                                <s className="text-sm text-muted-foreground line-through font-mono">{formatEur(p.compareAtPrice)}</s>
                                                <span className="rounded-[2px] bg-[var(--accent)] px-1.5 py-0.5 text-[11px] font-bold text-[var(--accent-foreground)]">
                                                    -{Math.round((1 - p.price / p.compareAtPrice) * 100)}%
                                                </span>
                                            </>
                                        )}
                                    </div>
                                    <div className="mt-3 min-h-[20px] text-xs">
                                        {purch.soldOut ? (
                                            <span className="text-[var(--data-error)]">{t('common.outOfStock')}</span>
                                        ) : purch.stockKnown && p.stock != null && p.stock > 0 ? (
                                            p.stock <= 5 ? (
                                                <span className="text-[var(--data-warn)]">{t('catalog.lowStock').replace('{count}', String(p.stock))}</span>
                                            ) : (
                                                <span className="text-[var(--data-ok)]">{t('catalog.inStock')}</span>
                                            )
                                        ) : (
                                            <span className="text-muted-foreground" role="note">{purch.availabilityNote}</span>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => handleAdd(p, resolvedImg)}
                                        disabled={purch.soldOut}
                                        className="mt-3 w-full rounded-[2px] bg-[var(--accent)] px-4 py-2.5 text-sm font-bold text-[var(--accent-foreground)] transition-colors duration-150 hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                        {addedId === p.variantId ? t('common.added') : t('common.addToCart')}
                                    </button>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}

            <button
                onClick={openCart}
                className="sr-only"
                aria-hidden="true"
                tabIndex={-1}
            >
                {t('catalog.openCart')}
            </button>
        </section>
    );
}
