'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ShoppingCart, Check } from 'lucide-react';
import { useCartStore } from '../store/cart';
import { useVatDisplayStore } from '../store/vat-display';
import { useTranslations, useLocale } from 'next-intl';
import { assetUrl } from '../lib/api';
import { resolveProductImageUrl, formatCleanCatalogProductTitle } from '../lib/product-visuals';
import { resolveProductBrandInfo, extractCardTechChips } from '../lib/v3-description';

interface Product {
    id: string;
    slug?: string | null;
    name: string;
    nameLt?: string | null;
    price: number;
    imageUrl?: string;
    categoryName?: string | null;
    brandName?: string | null;
    inStock?: boolean;
    stock?: number | null;
    sku?: string;
    priceCents?: number | null;
    vatRate?: number | null;
}

const cleanDash = (s: string) => s.replace(/\u2014/g, '–').replace(/[\u00A9\u00AE\u2122]/g, '');

export function PopularProducts({ products }: { products: Product[] }) {
    const t = useTranslations();
    const locale = useLocale();
    const showNet = useVatDisplayStore((s) => s.showNet);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [addedId, setAddedId] = useState<string | null>(null);
    const addItem = useCartStore((state) => state.addItem);
    const openCart = useCartStore((state) => state.openCart);

    const handleCopySku = (productId: string, sku: string | undefined, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!sku) return;
        if (typeof navigator !== 'undefined' && navigator.clipboard) {
            navigator.clipboard.writeText(sku).catch(() => {});
        }
        setCopiedId(productId);
        setTimeout(() => setCopiedId((prev) => (prev === productId ? null : prev)), 1200);
    };

    const handleQuickAdd = (product: Product, resolvedImage: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const displayTitle = formatCleanCatalogProductTitle(
            product.nameLt || product.name,
            product.sku,
            product.brandName,
        );
        setAddedId(product.id);
        addItem({
            id: product.id,
            productId: product.id,
            name: displayTitle,
            price: product.price,
            sku: product.sku || `SKU-${product.id.slice(0, 8)}`,
            quantity: 1,
            image: resolvedImage,
        });
        setTimeout(() => {
            setAddedId((prev) => (prev === product.id ? null : prev));
            openCart();
        }, 300);
    };

    if (products.length === 0) return null;

    return (
        <section className="py-6 md:py-8 bg-[#F5F3EE] border-b border-[#E2DDD3]">
            <div className="container mx-auto max-w-7xl px-4 sm:px-6">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-5">
                    <div>
                        <span className="text-xs font-semibold text-[#C2410C] block mb-1">
                            EGIP.lt el. parduotuvė · 6 337 pozicijos sandėlyje
                        </span>
                        <h2 className="text-xl md:text-2xl font-extrabold text-[#11161B]">
                            Populiariausios ŠVOK prekės, degikliai ir mazgai
                        </h2>
                        <p className="text-xs sm:text-sm text-[#5B6470] mt-0.5">
                            Gilės Inžinerija, Megatherm, Haier, Gorenje, Danfoss, IMI Hydronic, Comisa ir HERZ pagrindinė įranga
                        </p>
                    </div>

                    <Link
                        href={`/${locale}/products`}
                        className="inline-flex items-center rounded-sm border border-[#11161B] bg-transparent hover:border-[#C2410C] px-3.5 py-2 text-xs font-semibold text-[#11161B] transition-colors shrink-0 whitespace-nowrap"
                    >
                        Visas katalogas (6 337 prekės)
                    </Link>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
                    {products.slice(0, 12).map((product, idx) => {
                        const rawTitle = (product.nameLt || product.name || '').trim();
                        const brandInfo = resolveProductBrandInfo({
                            brand: product.brandName,
                            title: rawTitle,
                            sku: product.sku,
                        });
                        const displayTitle = formatCleanCatalogProductTitle(
                            rawTitle,
                            product.sku,
                            brandInfo.name,
                        );
                        const resolvedImage = resolveProductImageUrl({
                            sku: product.sku,
                            title: displayTitle,
                            brand: product.brandName,
                            category: product.categoryName,
                            imageUrl: product.imageUrl,
                        });
                        const techChips = extractCardTechChips(displayTitle, product.sku);
                        const specLine = techChips.length > 0 ? techChips.slice(0, 3).join(' · ') : 'EN / ISO standartas';
                        const nodePurpose = cleanDash(product.categoryName || brandInfo.name);
                        const grossVal = product.price > 0 ? product.price : 0;
                        const displayedPrice = showNet ? grossVal / 1.21 : grossVal;
                        const priceFormatted = `${displayedPrice.toFixed(2).replace('.', ',')} €`;
                        const isCopied = copiedId === product.id;
                        const isAdded = addedId === product.id;

                        return (
                            <div key={product.id} className="h-full bg-white rounded-md">
                                <Link
                                    href={`/${locale}/products/${product.slug || product.id}`}
                                    data-testid="b2b-spec-matrix-card"
                                    className="group flex flex-col justify-between h-full bg-transparent rounded-md border border-[#E2DDD3] overflow-hidden hover:border-[#11161B] transition-colors duration-150"
                                >
                                    <div>
                                        <div className="flex items-center justify-between gap-1.5 px-2.5 sm:px-3 py-1.5 bg-[#F5F3EE] border-b border-[#E2DDD3] overflow-hidden">
                                            <img
                                                src={assetUrl(brandInfo.logoPath)}
                                                alt={brandInfo.name}
                                                className="h-3.5 sm:h-4 max-w-[58px] sm:max-w-[92px] w-auto object-contain shrink-0"
                                            />
                                            {product.sku && (
                                                <button
                                                    type="button"
                                                    onClick={(e) => handleCopySku(product.id, product.sku, e)}
                                                    title="Kopijuoti gamintojo kodą"
                                                    aria-label={`Kopijuoti gamintojo kodą ${product.sku}`}
                                                    className={`${idx < 4 ? 'font-mono' : 'tabular-nums'} min-w-0 max-w-[78px] sm:max-w-none text-xs font-semibold text-[#11161B] bg-transparent px-1 py-0.5 rounded-xs truncate cursor-pointer transition-colors`}
                                                >
                                                    {isCopied ? 'Nukopijuota' : product.sku}
                                                </button>
                                            )}
                                        </div>

                                        <div className="relative h-32 sm:h-40 bg-[#EEEBE4] border-b border-[#E2DDD3] flex items-center justify-center p-2.5 sm:p-3 overflow-hidden">
                                            <img
                                                src={assetUrl(resolvedImage)}
                                                alt={displayTitle}
                                                className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-150"
                                            />
                                        </div>

                                        <div className="p-2.5 sm:p-4 pb-2 overflow-hidden">
                                            <h3 className="text-xs sm:text-sm font-bold text-[#11161B] mb-2 line-clamp-2 group-hover:text-[#C2410C] transition-colors duration-150 leading-snug min-h-[2.5rem]">
                                                {displayTitle}
                                            </h3>

                                            <dl className="border-t border-[#E2DDD3] pt-2 divide-y divide-[#E2DDD3] text-xs overflow-hidden">
                                                <div className="hidden sm:grid grid-cols-12 gap-1 py-1 items-center overflow-hidden">
                                                    <dt className="col-span-5 text-[#5B6470] font-medium truncate" title="Paskirtis / Mazgas">
                                                        Paskirtis / Mazgas
                                                    </dt>
                                                    <dd className="col-span-7 text-[#11161B] font-semibold text-right truncate">
                                                        {nodePurpose}
                                                    </dd>
                                                </div>
                                                <div className="flex items-center justify-between gap-1 py-1 overflow-hidden">
                                                    <dt className="text-[#5B6470] font-medium shrink-0" title="Sriegis / Standartas">
                                                        <span className="sm:hidden">Spec.</span>
                                                        <span className="hidden sm:inline">Sriegis / Standartas</span>
                                                    </dt>
                                                    <dd className="text-[#11161B] font-semibold tabular-nums text-right truncate min-w-0">
                                                        {specLine}
                                                    </dd>
                                                </div>
                                                <div className="flex items-center justify-between gap-1 py-1 overflow-hidden">
                                                    <dt className="text-[#5B6470] font-medium shrink-0">
                                                        Likutis
                                                    </dt>
                                                    <dd className="font-semibold text-right truncate min-w-0">
                                                        <span className="inline-flex items-center justify-end gap-1 text-[#157A3B]" title="Sandėlyje · 1–3 d. d.">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-[#157A3B] shrink-0" />
                                                            <span>Sandėlyje · 1–3 d. d.</span>
                                                        </span>
                                                    </dd>
                                                </div>
                                            </dl>
                                        </div>
                                    </div>

                                    <div className="px-2.5 sm:px-4 pb-2.5 sm:pb-3 pt-2 border-t border-[#E2DDD3] bg-[#F5F3EE] flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
                                        <div className="min-w-0 flex items-baseline justify-between sm:block gap-1">
                                            <span className="block text-base sm:text-lg font-extrabold text-[#11161B] tabular-nums leading-tight truncate">
                                                {priceFormatted}
                                            </span>
                                            <span className="block text-xs text-[#5B6470] shrink-0">
                                                {showNet ? 'be PVM' : 'su PVM'}
                                            </span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={(e) => handleQuickAdd(product, resolvedImage, e)}
                                            aria-label={t('common.addToCart')}
                                            className="w-full sm:w-auto min-h-[36px] sm:min-h-[34px] inline-flex items-center justify-center gap-1.5 rounded-xs bg-[#C2410C] hover:bg-[#9A3412] px-2.5 py-1.5 text-xs font-bold text-white whitespace-nowrap transition-colors duration-150 cursor-pointer shrink-0"
                                        >
                                            {isAdded ? (
                                                <>
                                                    <Check className="w-3.5 h-3.5 shrink-0" />
                                                    <span>Įdėta</span>
                                                </>
                                            ) : (
                                                <>
                                                    <ShoppingCart className="w-3.5 h-3.5 shrink-0" />
                                                    <span>{t('common.addToCart')}</span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </Link>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
