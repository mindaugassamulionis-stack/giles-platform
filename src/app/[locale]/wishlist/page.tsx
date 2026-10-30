'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ShoppingBag, ArrowRight, Heart } from 'lucide-react';
import { useWishlistStore, useWishlistHydration } from '../../../store/wishlist';
import { ProductCard } from '../../../components/product-card';
import { useTranslations } from 'next-intl';

export default function WishlistPage() {
    const t = useTranslations();
    const { items } = useWishlistStore();
    const hydrated = useWishlistHydration();

    if (!hydrated) return null;

    return (
        <div className="min-h-screen bg-zinc-50 pt-32 pb-12">
            <div className="container mx-auto px-4 sm:px-6">
                <div className="max-w-4xl mx-auto">
                    {/* Header */}
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center">
                            <Heart className="w-6 h-6 text-red-500 fill-current" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold font-display text-zinc-900">{t('wishlistPage.title')}</h1>
                            <p className="text-zinc-500">{items.length} {items.length === 1 ? 'prekė' : 'prekės'} sąraše</p>
                        </div>
                    </div>

                    {/* Content */}
                    {items.length === 0 ? (
                        <div className="bg-white rounded-3xl p-12 text-center border border-zinc-100 shadow-sm">
                            <div className="w-24 h-24 bg-zinc-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Heart className="w-10 h-10 text-zinc-300" />
                            </div>
                            <h2 className="text-2xl font-bold text-zinc-900 mb-3">{t('wishlistPage.empty')}</h2>
                            <p className="text-zinc-500 mb-8 max-w-sm mx-auto">
                                {t('wishlistPage.emptyDesc')}
                            </p>
                            <Link
                                href="/products"
                                className="inline-flex h-12 items-center justify-center rounded-full bg-zinc-900 px-8 text-sm font-bold text-white shadow transition-all hover:bg-zinc-800 hover:shadow-lg gap-2"
                            >
                                <ShoppingBag className="w-4 h-4" />
                                {t('wishlistPage.browse')}
                            </Link>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {items.map((item, idx) => (
                                <ProductCard
                                    key={item.id}
                                    index={idx}
                                    product={{
                                        id: item.id,
                                        name: item.name,
                                        price: item.price,
                                        imageUrl: item.image,
                                        categoryName: item.categoryName,
                                        sku: item.sku,
                                        inStock: true, // Optimistic
                                    }}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
