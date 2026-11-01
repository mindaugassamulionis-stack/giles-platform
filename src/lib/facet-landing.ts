/**
 * W123-A2 facet-URL SEO landing pages: McMaster-Carr M2 pattern from the
 * W123-r3 teardown. Each top category × top brand combo becomes a canonical
 * indexable page at /[locale]/parduotuve/<category-slug>/<brand-slug>,
 * resolved through the existing catalog search index (read-only).
 */
import type { MetadataRoute } from 'next';
import { getCatalogSearchIndex, searchCatalogIndex, type GilesCatalogProduct } from './catalog-search-index';
import { toBrandSlug } from './catalog-listing';
import { localizeCategoryLabel } from './product-i18n';
import { formatCatalogCount } from './w121-honest-commerce';
import type { AppLocale } from '../i18n/routing';

export const FACET_LANDING_MAX_PAGES = 56;
export const FACET_LANDING_TOP_CATEGORIES = 7;
export const FACET_LANDING_BRANDS_PER_CATEGORY = 8;
export const FACET_LANDING_PAGE_SIZE = 24;

export interface FacetLandingCombo {
    categoryName: string;
    categorySlug: string;
    brandName: string;
    brandSlug: string;
    productCount: number;
    inStockCount: number;
}

let cachedCombos: FacetLandingCombo[] | null = null;

/**
 * Top categories × their top brands by product count, every combo guaranteed
 * to hold more than zero products (empty combos are never emitted).
 */
interface FacetBrandCount {
    name: string;
    count: number;
    inStock: number;
}

interface FacetCategoryCount {
    name: string;
    count: number;
    brands: Map<string, FacetBrandCount>;
}

export function getFacetLandingCombos(): FacetLandingCombo[] {
    if (cachedCombos) return cachedCombos;

    const byCategory = new Map<string, FacetCategoryCount>();
    for (const p of getCatalogSearchIndex().products) {
        const cName = p.categoryName || 'Katilinės įranga';
        const bName = (p.brandName || '').trim();
        if (!bName) continue;
        let cat = byCategory.get(cName);
        if (!cat) {
            cat = { name: cName, count: 0, brands: new Map() };
            byCategory.set(cName, cat);
        }
        cat.count++;
        let brand = cat.brands.get(bName);
        if (!brand) {
            brand = { name: bName, count: 0, inStock: 0 };
            cat.brands.set(bName, brand);
        }
        brand.count++;
        if (p.availability === 'in_stock') brand.inStock++;
    }

    const combos: FacetLandingCombo[] = [];
    const topCategories = [...byCategory.values()]
        .sort((a, b) => b.count - a.count)
        .slice(0, FACET_LANDING_TOP_CATEGORIES);

    for (const cat of topCategories) {
        const topBrands = [...cat.brands.values()]
            .sort((a, b) => b.count - a.count)
            .slice(0, FACET_LANDING_BRANDS_PER_CATEGORY);
        for (const brand of topBrands) {
            if (brand.count <= 0) continue;
            combos.push({
                categoryName: cat.name,
                categorySlug: toBrandSlug(cat.name),
                brandName: brand.name,
                brandSlug: toBrandSlug(brand.name),
                productCount: brand.count,
                inStockCount: brand.inStock,
            });
            if (combos.length >= FACET_LANDING_MAX_PAGES) {
                cachedCombos = combos;
                return combos;
            }
        }
    }

    cachedCombos = combos;
    return combos;
}

export function resolveFacetLanding(
    categorySlug: string,
    brandSlug: string,
): { combo: FacetLandingCombo; products: GilesCatalogProduct[] } | null {
    const combo = getFacetLandingCombos().find(
        (c) => c.categorySlug === categorySlug && c.brandSlug === brandSlug,
    );
    if (!combo) return null;
    const products = searchCatalogIndex({
        category: combo.categoryName,
        brand: combo.brandName,
    });
    if (products.length === 0) return null;
    return { combo, products: products.slice(0, FACET_LANDING_PAGE_SIZE) };
}

/**
 * Brand chips for a category page ("Populiariausi gamintojai"), same category
 * name the listing filters use.
 */
export function getFacetLandingCombosForCategory(categoryName: string): FacetLandingCombo[] {
    const wanted = (categoryName || '').trim().toLowerCase();
    if (!wanted) return [];
    return getFacetLandingCombos().filter((c) => c.categoryName.toLowerCase() === wanted);
}

const LOCALIZED_CATEGORY = (combo: FacetLandingCombo, locale: AppLocale) =>
    localizeCategoryLabel(combo.categoryName, locale);

export function facetLandingHeading(combo: FacetLandingCombo, locale: AppLocale): string {
    const category = LOCALIZED_CATEGORY(combo, locale);
    switch (locale) {
        case 'en':
            return `${combo.brandName} ${category} – store | Gilės Inžinerija`;
        case 'pl':
            return `${combo.brandName} ${category} – sklep | Gilės Inžinerija`;
        case 'ru':
            return `${combo.brandName} ${category} – магазин | Gilės Inžinerija`;
        default:
            return `${combo.brandName} ${category} – parduotuvė | Gilės Inžinerija`;
    }
}

export function facetLandingIntro(combo: FacetLandingCombo, locale: AppLocale): string {
    const category = LOCALIZED_CATEGORY(combo, locale);
    const count = formatCatalogCount(combo.productCount, locale);
    const inStock = formatCatalogCount(combo.inStockCount, locale);
    switch (locale) {
        case 'en':
            return `${count} ${combo.brandName} ${category} items, ${inStock} of them stocked in our warehouse in Kaunas. The rest ship from the supplier's warehouse within 2–4 business days.`;
        case 'pl':
            return `${count} produktów ${combo.brandName} w kategorii ${category}, z czego ${inStock} mamy w magazynie w Kownie. Pozostałe wysyłamy z magazynu dostawcy w ciągu 2–4 dni roboczych.`;
        case 'ru':
            return `${count} товаров ${combo.brandName} в категории ${category}, из них ${inStock} есть на нашем складе в Каунасе. Остальные доставляются со склада поставщика за 2–4 рабочих дня.`;
        default:
            return `${count} prekių „${combo.brandName}“ kategorijoje ${category}, iš jų ${inStock} laikome savo sandėlyje Kaune. Kitas prekes atvežame iš tiekėjo sandėlio per 2–4 darbo dienas.`;
    }
}

/**
 * Sitemap rows for every facet landing combo, one URL per locale with full
 * 4-locale hreflang alternates and an x-default pointing to LT.
 */
export function buildFacetLandingSitemapEntries(
    baseUrl: string,
    locales: readonly AppLocale[],
): MetadataRoute.Sitemap {
    const origin = baseUrl.replace(/\/$/, '');
    const defaultLocale = locales.includes('lt') ? 'lt' : locales[0];
    return getFacetLandingCombos().flatMap((combo) => {
        const path = `/parduotuve/${combo.categorySlug}/${combo.brandSlug}`;
        const languages: Record<string, string> = {};
        for (const l of locales) {
            languages[l] = `${origin}/${l}${path}`;
        }
        languages['x-default'] = `${origin}/${defaultLocale}${path}`;
        return locales.map((locale) => ({
            url: `${origin}/${locale}${path}`,
            lastModified: new Date(),
            changeFrequency: 'weekly' as const,
            priority: 0.75,
            alternates: { languages },
        }));
    });
}
