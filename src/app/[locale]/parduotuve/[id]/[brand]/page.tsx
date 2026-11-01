import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import {
    resolveFacetLanding,
    getFacetLandingCombosForCategory,
    facetLandingHeading,
    facetLandingIntro,
} from '../../../../../lib/facet-landing';
import { ProductGridClient } from '../../../../../components/product-grid-client';
import { resolveAppLocale } from '../../../../../i18n/storefront-ui-copy';
import { resolvePublicSiteOrigin } from '../../../../../lib/domain-routing';
import type { AppLocale } from '../../../../../i18n/routing';

export const dynamic = 'force-dynamic';

interface Props {
    // `id` mirrors the sibling /parduotuve/[id] route's slug name (Next.js
    // requires identical slug names at the same segment depth); it carries
    // the facet landing category slug.
    params: Promise<{ locale: string; id: string; brand: string }>;
}

const LOCALES: AppLocale[] = ['lt', 'en', 'pl', 'ru'];

const PAGE_COPY: Record<AppLocale, { backToCategory: string; topBrands: string }> = {
    lt: { backToCategory: 'Grįžti į kategoriją', topBrands: 'Kiti gamintojai' },
    en: { backToCategory: 'Back to category', topBrands: 'Other manufacturers' },
    pl: { backToCategory: 'Wróć do kategorii', topBrands: 'Inni producenci' },
    ru: { backToCategory: 'Назад к категории', topBrands: 'Другие производители' },
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { locale, id: categorySlug, brand: brandSlug } = await params;
    const loc = resolveAppLocale(locale);
    const resolved = resolveFacetLanding(categorySlug, brandSlug);
    if (!resolved) {
        return { title: 'GILĖS INŽINERIJA' };
    }
    const origin = resolvePublicSiteOrigin().replace(/\/$/, '');
    const path = `/parduotuve/${categorySlug}/${brandSlug}`;
    const languages: Record<string, string> = {};
    for (const l of LOCALES) {
        languages[l] = `${origin}/${l}${path}`;
    }
    languages['x-default'] = `${origin}/lt${path}`;
    const title = facetLandingHeading(resolved.combo, loc);
    const description = facetLandingIntro(resolved.combo, loc).slice(0, 158);
    return {
        title,
        description,
        alternates: { canonical: `${origin}/${loc}${path}`, languages },
        openGraph: { title, description },
    };
}

export default async function FacetLandingPage({ params }: Props) {
    const { locale, id: categorySlug, brand: brandSlug } = await params;
    const loc = resolveAppLocale(locale);
    const copy = PAGE_COPY[loc];
    const resolved = resolveFacetLanding(categorySlug, brandSlug);
    if (!resolved) notFound();

    const { combo, products } = resolved;
    const otherBrands = getFacetLandingCombosForCategory(combo.categoryName).filter(
        (c) => c.brandSlug !== combo.brandSlug,
    );
    const categoryHref = `/${loc}/products?category=${encodeURIComponent(combo.categoryName)}`;

    return (
        <div className="min-h-screen bg-[#F5F3EE] text-[#11161B]">
            <section
                data-testid="facet-landing-header"
                className="bg-[#11161B] text-[#F5F3EE] border-b border-[#2C3742] py-3.5"
            >
                <div className="mx-auto max-w-7xl px-4 sm:px-6 space-y-1">
                    <nav aria-label="breadcrumb" className="flex flex-wrap items-center gap-1.5 text-xs text-[#A3ADB8]">
                        <Link href={`/${loc}`} className="hover:text-[#FF8A3D]">
                            {loc === 'en' ? 'Home' : loc === 'pl' ? 'Strona główna' : loc === 'ru' ? 'Главная' : 'Pradžia'}
                        </Link>
                        <span aria-hidden="true">/</span>
                        <Link href={`/${loc}/parduotuve`} className="hover:text-[#FF8A3D]">
                            {loc === 'en' ? 'Store' : loc === 'pl' ? 'Sklep' : loc === 'ru' ? 'Магазин' : 'Parduotuvė'}
                        </Link>
                        <span aria-hidden="true">/</span>
                        <span className="text-white font-semibold">{combo.brandName}</span>
                    </nav>
                    <h1 className="text-lg sm:text-2xl font-extrabold text-white leading-tight">
                        {facetLandingHeading(combo, loc)}
                    </h1>
                </div>
            </section>

            <main className="mx-auto max-w-7xl px-4 sm:px-6 py-5 sm:py-7 space-y-5">
                <div className="space-y-2 max-w-3xl">
                    <p className="text-sm text-[#2A323B] leading-relaxed" data-testid="facet-landing-intro">
                        {facetLandingIntro(combo, loc)}
                    </p>
                    <Link
                        href={categoryHref}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#C2410C] hover:underline"
                    >
                        <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
                        {copy.backToCategory}
                    </Link>
                </div>

                <div data-testid="facet-landing-products">
                    <ProductGridClient
                        products={products.map((p) => ({
                            ...p,
                            name: p.nameLt || p.name,
                            inStock: p.availability === 'in_stock',
                        }))}
                    />
                </div>

                {otherBrands.length > 0 && (
                    <section
                        data-testid="facet-landing-brand-chips"
                        className="border-t border-[#E2DDD3] pt-4 space-y-2.5"
                    >
                        <h2 className="text-sm font-extrabold text-[#11161B]">{copy.topBrands}</h2>
                        <div className="flex flex-wrap gap-1.5">
                            {otherBrands.map((c) => (
                                <Link
                                    key={c.brandSlug}
                                    href={`/${loc}/parduotuve/${c.categorySlug}/${c.brandSlug}`}
                                    className="px-2.5 py-1.5 min-h-[44px] inline-flex items-center text-xs font-semibold border rounded-none whitespace-nowrap transition-colors border-[#D5CFC3] bg-white text-[#11161B] hover:border-[#11161B]"
                                >
                                    {c.brandName}{' '}
                                    <span className="tabular-nums text-[#5B6470]">({c.productCount})</span>
                                </Link>
                            ))}
                        </div>
                    </section>
                )}
            </main>
        </div>
    );
}
