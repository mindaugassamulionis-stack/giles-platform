import type { Metadata } from 'next';
import Link from 'next/link';
import { Boxes, ArrowRight } from 'lucide-react';
import { getBrandCatalogTiles, searchCatalogProductsPaged } from '../../../lib/catalog-listing';
import { ProductGridClient } from '../../../components/product-grid-client';
import { assetUrl } from '../../../lib/api';
import { resolveBrandLogo } from '../../../lib/product-visuals';
import { getTranslations } from 'next-intl/server';
import { getBrandName, withBrandSuffix } from '../../../lib/brand';

// W22-D1 T2 & W34-A1: brand-group entry to spare parts with official manufacturer
// SVG brand logos, live product counts, and curated flagship preview cards with real .webp photos.
export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
    return {
        title: withBrandSuffix('Atsarginės dalys pagal gamintoją', await getBrandName()),
        description: 'Atsarginės dalys pagal gamintojų grupes: Danfoss, IMI Heimeier, IMI Pneumatex, IMI TA, Ferroli. Originalios dalys pagal gamintojo kodą.',
    };
}

export default async function PartsPage() {
    const t = await getTranslations();
    const [brands, sampleParts] = await Promise.all([
        getBrandCatalogTiles(),
        searchCatalogProductsPaged({ page: 1, pageSize: 12 }),
    ]);

    return (
        <main className="min-h-screen bg-[#F0F4F8] text-[#0B192C]">
            <div className="bg-[#0B192C] text-white border-b border-slate-800 pt-28 pb-10 mb-10">
                <div className="h-1 w-full bg-gradient-to-r from-[#DC2626] via-[#F97316] to-[#0284C7] mb-6" />
                <div className="container mx-auto px-4 max-w-6xl">
                    <p className="font-mono text-[#38BDF8] text-xs tracking-[0.25em] uppercase mb-3 font-bold">
                        {t('partsPage.kicker')}
                    </p>
                    <h1 className="font-display text-4xl md:text-5xl font-extrabold tracking-tight mb-4 text-white">
                        {t('partsPage.title')}
                    </h1>
                    <p className="text-slate-300 text-lg max-w-2xl">
                        {t('partsPage.subtitle')}
                    </p>
                </div>
            </div>

            <div className="container mx-auto px-4 pb-16 max-w-6xl">

                {brands.length === 0 ? (
                    <div className="border border-border rounded-[2px] bg-card p-12 text-center">
                        <Boxes className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" strokeWidth={1.5} aria-hidden="true" />
                        <p className="text-muted-foreground">{t('partsPage.empty')}</p>
                        <Link
                            href="/products"
                            className="mt-6 inline-flex h-12 items-center justify-center rounded-[2px] border-2 border-[var(--primary)] px-8 text-sm font-bold text-[var(--primary)] transition-colors duration-150 hover:bg-[var(--primary)] hover:text-white"
                        >
                            {t('partsPage.browseCatalog')}
                        </Link>
                    </div>
                ) : (
                    <>
                        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-14">
                            {brands.map((brand) => {
                                const brandInfo = resolveBrandLogo(brand.name);
                                return (
                                    <li key={brand.id}>
                                        <Link
                                            href={`/products?brand=${encodeURIComponent(brand.name)}&sort=code-asc`}
                                            className="group flex h-full flex-col justify-between gap-5 rounded-[2px] border border-border bg-card p-6 hover:border-[var(--primary)] transition-colors duration-150"
                                        >
                                            <div>
                                                <div className="flex items-center justify-between gap-3 mb-4">
                                                    <div className="inline-flex h-10 items-center rounded-[2px] border border-border bg-white px-3 py-1.5">
                                                        <img
                                                            src={assetUrl(brandInfo.logoPath)}
                                                            alt={brand.name}
                                                            className="h-6 w-auto object-contain"
                                                        />
                                                    </div>
                                                    {brand.isVerified && (
                                                        <span
                                                            title={t('partsPage.verified')}
                                                            className="font-mono text-[10px] uppercase tracking-wide border border-[var(--data-ok)]/50 text-[var(--data-ok)] px-2 py-0.5 rounded-[2px]"
                                                        >
                                                            ✓ Oficialus
                                                        </span>
                                                    )}
                                                </div>
                                                <span className="block font-display text-xl font-bold text-foreground group-hover:text-[var(--primary)] transition-colors duration-150">
                                                    {brand.name}
                                                </span>
                                                <p className="mt-1 font-mono text-xs text-muted-foreground">
                                                    {brandInfo.origin}
                                                </p>
                                                {brandInfo.specialty && (
                                                    <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                                                        {brandInfo.specialty}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="pt-3 border-t border-border/60 flex items-center justify-between font-mono text-sm">
                                                <span className="font-bold text-[var(--primary)]">
                                                    {brand.productCount} {t('partsPage.productsWord')}
                                                </span>
                                                <ArrowRight className="w-4 h-4 text-[var(--primary)]" aria-hidden="true" />
                                            </div>
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>

                        {sampleParts.items.length > 0 && (
                            <div className="pt-8 border-t border-border">
                                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
                                    <div>
                                        <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--primary)] font-bold">
                                            DAŽNIAUSIAI UŽSAKOMI MAZGAI IR DALYS PAGAL KODĄ
                                        </p>
                                        <h2 className="font-display text-2xl font-bold text-foreground mt-1">
                                            Populiariausios atsarginės dalys ir armatūra su gamintojų nuotraukomis
                                        </h2>
                                    </div>
                                    <Link
                                        href="/products"
                                        className="font-mono text-xs uppercase tracking-wider text-[var(--primary)] font-bold hover:underline"
                                    >
                                        Atidaryti visas 6 337 pozicijas →
                                    </Link>
                                </div>
                                <ProductGridClient products={sampleParts.items} />
                            </div>
                        )}
                    </>
                )}
            </div>
        </main>
    );
}
