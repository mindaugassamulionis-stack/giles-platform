'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Minus, Plus, ShoppingCart, ArrowLeft, Check, CheckCircle2, ChevronDown, Star, Heart, Package } from "lucide-react";
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCartStore, useCartHydration } from '../store/cart';
import { useWishlistStore, useWishlistHydration } from '../store/wishlist';
import { useStoreContext } from '../context/store-context';
import { useTranslations } from 'next-intl';
import { assetUrl } from '../lib/api';

interface ProductDetailClientProps {
    product: {
        id: string;
        name: string;
        description: string | null;
        categoryName: string;
        brandName?: string;
        brandVerified?: boolean;
        price: number;
        inStock: boolean;
        sku: string;
        ingredients?: string;
        usage?: string;
        images?: string[];
        attributes?: Record<string, any>;
        variants?: {
            id: string;
            price: number;
            stock: number;
            sku: string;
            image?: string;
            attributes?: Record<string, any>;
        }[];
    };
}

export function ProductDetailClient({ product }: ProductDetailClientProps) {
    const t = useTranslations();
    // State
    const [quantity, setQuantity] = useState(1);
    const [added, setAdded] = useState(false);
    const [selectedImage, setSelectedImage] = useState(0);
    const [activeVariant, setActiveVariant] = useState(product.variants?.[0] || product);
    const [openAccordion, setOpenAccordion] = useState<string | null>('ingredients');

    // Cart Store
    const addItem = useCartStore((state) => state.addItem);
    const openCart = useCartStore((state) => state.openCart);
    const hydrated = useCartHydration();

    // Wishlist Store
    const toggleWishlist = useWishlistStore((state) => state.toggleItem);
    const hasWishlist = useWishlistStore((state) => state.hasItem);
    const wishlistHydrated = useWishlistHydration();
    const isLoved = wishlistHydrated && hasWishlist(product.id);
    const { setPageContext } = useStoreContext();

    // Effect: Update Active Variant on Product Change
    useEffect(() => {
        if (product.variants?.length) {
            setActiveVariant(product.variants[0]);
        } else {
            setActiveVariant(product);
        }
        setQuantity(1);
        setSelectedImage(0);

        // Pixel: ViewContent
        const w = window as any;
        if (w.fbq) {
            w.fbq('track', 'ViewContent', {
                content_ids: [product.sku],
                content_type: 'product',
                value: product.price,
                currency: 'EUR'
            });
        }
        if (w.ttq) {
            w.ttq.track('ViewContent', {
                content_id: product.sku,
                content_name: product.name,
                quantity: 1,
                price: product.price,
                value: product.price,
                currency: 'EUR'
            });
        }
    }, [product.id]);

    // Effect: Set Context
    useEffect(() => {
        setPageContext('product', {
            id: product.id,
            name: product.name,
            price: product.price,
            inStock: product.inStock
        });
        return () => setPageContext('other');
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [product.id]);

    const handleAddToCart = () => {
        const uniqueId = activeVariant.id !== product.id ? activeVariant.id : product.id;
        const price = (activeVariant as any).price || product.price;
        const sku = (activeVariant as any).sku || product.sku;

        addItem({
            id: uniqueId,
            productId: product.id,
            variantId: activeVariant.id !== product.id ? activeVariant.id : undefined,
            name: product.name,
            price: price,
            sku: sku,
            quantity,
            image: (activeVariant as any).image || product.images?.[0],
        });

        // Pixel: AddToCart
        const w = window as any;
        if (w.fbq) {
            w.fbq('track', 'AddToCart', {
                content_ids: [sku],
                content_type: 'product',
                value: price,
                currency: 'EUR'
            });
        }
        if (w.ttq) {
            w.ttq.track('AddToCart', {
                content_id: sku,
                content_name: product.name,
                quantity: quantity,
                price: price,
                value: price,
                currency: 'EUR'
            });
        }

        setAdded(true);
        setTimeout(() => setAdded(false), 2000);
        openCart();
    };

    // Helpers
    const getVariantLabel = (v: any) => {
        if (v.attributes?.flavor) return v.attributes.flavor;
        if (v.attributes?.size) return v.attributes.size;
        if (v.attributes?.weight) return v.attributes.weight;
        return v.sku;
    };

    const currentPrice = (activeVariant as any).price || product.price;
    const currentSku = (activeVariant as any).sku || product.sku;
    const variantStock = (activeVariant as any).stock;
    const currentStock = variantStock !== undefined ? variantStock : (product.inStock ? 100 : 0);
    const isAvailable = currentStock > 0;

    const displayImages = product.images && product.images.length > 0 ? product.images : undefined;

    return (
        <div className="bg-white min-h-screen">
            <div className="flex flex-col lg:flex-row">

                {/* LEFT: Visuals (Sticky) */}
                <div className="w-full lg:w-1/2 lg:h-screen lg:sticky lg:top-0 bg-zinc-50 flex flex-col p-6 lg:p-12 relative overflow-hidden">
                    {/* Background Pattern */}
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, black 1px, transparent 0)', backgroundSize: '40px 40px' }} />

                    {/* Main Image */}
                    <div className="flex-1 flex items-center justify-center relative">
                        <div className="relative w-full aspect-square max-w-lg mx-auto">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={selectedImage}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className="relative w-full h-full"
                                >
                                    {displayImages ? (
                                        <Image
                                            src={assetUrl(displayImages[selectedImage])}
                                            alt={product.name}
                                            fill
                                            className="object-contain drop-shadow-2xl"
                                            priority
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-zinc-200">
                                            <Package className="w-24 h-24" strokeWidth={1} aria-hidden="true" />
                                        </div>
                                    )}
                                </motion.div>
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Thumbnails */}
                    {displayImages && displayImages.length > 1 && (
                        <div className="flex justify-center gap-3 mt-6 pb-4">
                            {displayImages.map((img, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setSelectedImage(idx)}
                                    className={`relative w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${selectedImage === idx
                                        ? 'border-zinc-900 shadow-lg scale-105'
                                        : 'border-zinc-200 hover:border-zinc-400 opacity-70 hover:opacity-100'
                                        }`}
                                >
                                    <Image
                                        src={assetUrl(img)}
                                        alt={`${product.name} - Image ${idx + 1}`}
                                        fill
                                        className="object-contain p-1 bg-white"
                                        sizes="64px"
                                    />
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Back Button (Mobile only) */}
                    <Link href="/products" className="absolute top-4 left-4 lg:hidden p-2.5 bg-white/90 rounded-full shadow-md backdrop-blur-sm hover:bg-white transition-colors">
                        <ArrowLeft className="w-5 h-5 text-zinc-900" />
                    </Link>
                </div>


                {/* RIGHT: Content (Scrollable) */}
                <div className="w-full lg:w-1/2 min-h-screen bg-white">
                    <div className="max-w-2xl mx-auto px-6 py-12 lg:py-24 lg:px-12">

                        {/* Breadcrumbs / Metadata */}
                        <div className="flex items-center gap-3 text-sm font-medium tracking-wide text-zinc-400 mb-8 font-mono uppercase">
                            <Link href="/products" className="hover:text-zinc-900 transition-colors">{t('nav.products')}</Link>
                            <span>/</span>
                            <span>{product.categoryName}</span>
                        </div>

                        {/* Title & Brand */}
                        <div className="mb-8">
                            {product.brandName && (
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="text-sm font-bold tracking-widest uppercase text-amber-500">{product.brandName}</span>
                                    {product.brandVerified && <CheckCircle2 className="w-4 h-4 text-amber-500" />}
                                </div>
                            )}
                            <h1 className="text-4xl lg:text-5xl font-bold tracking-tight text-zinc-900 font-display leading-[1.1]">
                                {product.name}
                            </h1>
                        </div>

                        {/* Price & Rating */}
                        <div className="flex items-end gap-6 mb-10 pb-8 border-b border-zinc-100">
                            <div className="text-3xl font-light tracking-tight text-zinc-900">
                                {currentPrice.toFixed(2)} €
                            </div>
                            <div className="flex items-center gap-1 mb-1.5">
                                {[1, 2, 3, 4, 5].map(i => <Star key={i} className="w-4 h-4 fill-zinc-900 text-zinc-900" />)}
                                <span className="text-sm text-zinc-500 ml-2">{t('productDetail.reviewsCount')}</span>
                            </div>
                        </div>

                        {/* Description */}
                        {product.description && (
                            <div className="prose prose-lg text-zinc-600 mb-10 leading-relaxed">
                                <p>{product.description}</p>
                            </div>
                        )}

                        {/* Variant Selector */}
                        {product.variants && product.variants.length > 1 && (
                            <div className="mb-8">
                                <label className="block text-sm font-medium text-zinc-700 mb-3 uppercase tracking-wide font-mono">
                                    Pasirinkimas ({product.variants.length})
                                </label>
                                <div className="flex flex-wrap gap-3">
                                    {product.variants.map((v: any) => {
                                        const isActive = activeVariant.id === v.id;
                                        return (
                                            <button
                                                key={v.id}
                                                onClick={() => {
                                                    setActiveVariant(v);
                                                    if (v.image && product.images) {
                                                        const imgIndex = product.images.indexOf(v.image);
                                                        if (imgIndex !== -1) setSelectedImage(imgIndex);
                                                    }
                                                }}
                                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all border ${isActive
                                                    ? 'bg-zinc-900 text-white border-zinc-900 shadow-md'
                                                    : 'bg-white text-zinc-600 border-zinc-200 hover:border-zinc-400 hover:bg-zinc-50'
                                                    }`}
                                            >
                                                {getVariantLabel(v)}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Purchase Actions */}
                        <div className="bg-zinc-50/50 rounded-2xl p-6 mb-12 border border-zinc-100">
                            {isAvailable ? (
                                <div className="flex flex-col gap-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-[var(--data-ok)] flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-[var(--data-ok)]" />
                                            {t('productDetail.inStock')}
                                        </span>
                                        <span className="text-xs text-zinc-400 font-mono">{currentSku}</span>
                                    </div>

                                    <div className="flex gap-4">
                                        <div className="flex items-center bg-white border border-zinc-200 rounded-xl">
                                            <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-12 h-12 flex items-center justify-center hover:bg-zinc-50 rounded-l-xl transition-colors"><Minus className="w-4 h-4" /></button>
                                            <span className="w-12 text-center font-medium font-mono text-lg">{quantity}</span>
                                            <button onClick={() => setQuantity(quantity + 1)} className="w-12 h-12 flex items-center justify-center hover:bg-zinc-50 rounded-r-xl transition-colors"><Plus className="w-4 h-4" /></button>
                                        </div>

                                        <motion.button
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={handleAddToCart}
                                            disabled={added}
                                            className="flex-1 bg-zinc-900 text-white font-bold rounded-xl flex items-center justify-center gap-3 hover:bg-zinc-800 transition-colors shadow-xl shadow-zinc-900/10"
                                        >
                                            {added ? (
                                                <>
                                                    <Check className="w-5 h-5" />
                                                    <span>{t('product.added')}</span>
                                                </>
                                            ) : (
                                                <>
                                                    <ShoppingCart className="w-5 h-5" />
                                                    <span>Add - {(currentPrice * quantity).toFixed(2)} €</span>
                                                </>
                                            )}
                                        </motion.button>

                                        <button
                                            onClick={() => toggleWishlist({
                                                id: product.id,
                                                name: product.name,
                                                price: product.price,
                                                image: product.images?.[0],
                                                sku: product.sku,
                                                categoryName: product.categoryName
                                            })}
                                            className={`w-14 h-14 rounded-[2px] flex items-center justify-center border transition-all ${isLoved
                                                ? 'bg-red-50 border-red-200 text-red-500'
                                                : 'bg-white border-zinc-200 text-zinc-400 hover:border-zinc-400 hover:text-zinc-600'
                                                }`}
                                        >
                                            <Heart className={`w-6 h-6 ${isLoved ? 'fill-current' : ''}`} />
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-4">
                                    <span className="text-zinc-400 font-medium">{t('productDetail.outOfStock')}</span>
                                </div>
                            )}
                        </div>

                        {/* Accordions / Deep Dive */}
                        <div className="space-y-4">
                            {/* Ingredients */}
                            {(product.ingredients || product.attributes?.ingredients) && (
                                <div className="border border-zinc-200 rounded-xl overflow-hidden">
                                    <button
                                        onClick={() => setOpenAccordion(openAccordion === 'ingredients' ? null : 'ingredients')}
                                        className="w-full flex items-center justify-between p-4 bg-white hover:bg-zinc-50 transition-colors text-left text-zinc-900 font-medium"
                                    >
                                        <span>{t('productDetail.ingredients')}</span>
                                        <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform ${openAccordion === 'ingredients' ? 'rotate-180' : ''}`} />
                                    </button>
                                    <AnimatePresence>
                                        {openAccordion === 'ingredients' && (
                                            <motion.div
                                                initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="p-4 bg-zinc-50/50 border-t border-zinc-100 text-sm text-zinc-600 leading-relaxed">
                                                    {product.attributes?.ingredients || product.ingredients}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            )}

                            {/* Usage */}
                            {(product.usage || product.attributes?.usage) && (
                                <div className="border border-zinc-200 rounded-xl overflow-hidden">
                                    <button
                                        onClick={() => setOpenAccordion(openAccordion === 'usage' ? null : 'usage')}
                                        className="w-full flex items-center justify-between p-4 bg-white hover:bg-zinc-50 transition-colors text-left text-zinc-900 font-medium"
                                    >
                                        <span>{t('product.howToUse')}</span>
                                        <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform ${openAccordion === 'usage' ? 'rotate-180' : ''}`} />
                                    </button>
                                    <AnimatePresence>
                                        {openAccordion === 'usage' && (
                                            <motion.div
                                                initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="p-4 bg-zinc-50/50 border-t border-zinc-100 text-sm text-zinc-600 leading-relaxed">
                                                    {product.attributes?.usage || product.usage}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            )}
                        </div>

                        {/* Footer / Trust */}
                        <div className="mt-16 pt-8 border-t border-zinc-100 grid grid-cols-2 gap-8">
                            <div>
                                <h4 className="font-bold text-zinc-900 mb-2">{t('productDetail.scienceBacked')}</h4>
                                <p className="text-xs text-zinc-500">{t('productDetail.scienceDesc')}</p>
                            </div>
                            <div>
                                <h4 className="font-bold text-zinc-900 mb-2">{t('productDetail.premiumSourcing')}</h4>
                                <p className="text-xs text-zinc-500">{t('productDetail.sourcingDesc')}</p>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}
