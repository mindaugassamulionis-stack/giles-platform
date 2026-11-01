// W23-S1 / G4 + G2/G3 (P0) & W33-B2: store-scoped catalog listing with
// code-first search, variants.priceGross pricing, exact-photo flagship sorting,
// and 100% deterministic `.webp` image + brand resolution.

import { products, variants, categories, brands, productStores } from '@platform/database/schema';
import { and, asc, desc, eq, inArray, sql, type SQL } from 'drizzle-orm';
import { db } from '@platform/database';
import { storeIdOrThrow as resolveCatalogStoreId, buildProductSlug } from './catalog';
import { parseSkuQuery, type ParsedSkuQuery } from './sku-code';
import { resolveProductImageUrl, EXACT_PHOTO_SKUS, isExactPhotoSku } from './product-visuals';
import { inferProductBrandName, formatCleanCatalogProductTitle } from './v3-description';
import {
    shouldUseGilesSnapshot,
    searchGilesSnapshotPaged,
    getGilesSnapshotBrands,
    getGilesSnapshotCategories,
    getGilesSnapshotPopularProducts,
} from './giles-catalog-snapshot';
import {
    getCatalogSearchIndex,
    invalidateCatalogSearchIndex,
    searchCatalogIndex,
} from './catalog-search-index';

export {
    getCatalogSearchIndex,
    invalidateCatalogSearchIndex,
    searchCatalogIndex,
};

const STORE_ID_TTL_MS = 5 * 60 * 1000;
const CATALOG_TTL_MS = 60 * 1000;
const storeIdMemoryCache = new Map<string, { expiresAt: number; value: string }>();
const catalogTtlCache = new Map<string, { expiresAt: number; value: unknown }>();

export function clearCatalogListingCache(): void {
    storeIdMemoryCache.clear();
    catalogTtlCache.clear();
    invalidateCatalogSearchIndex();
}

export function toBrandSlug(name: string): string {
    return name
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[łŁ]/g, 'l')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

export const CATALOG_ACTIVE_BRAND_DIRECTORY: Array<{
    id: string;
    name: string;
    slug: string;
    isVerified: boolean;
    productCount: number;
}> = [
    { id: 'd76a5a20-f5cb-56e9-b6cf-1df9dc015469', name: 'Gilės Inžinerija', slug: 'giles-inzinerija', isVerified: true, productCount: 25 },
    { id: '3daf3df0-f3d2-400f-8a41-76669e4701c4', name: 'IMI Pneumatex', slug: 'imi-pneumatex', isVerified: true, productCount: 865 },
    { id: 'bd39e29f-95dd-550b-b99f-0b74009b6925', name: 'Comisa', slug: 'comisa', isVerified: true, productCount: 769 },
    { id: '9ace0bbc-cae4-48d7-b62c-bc73b22d3126', name: 'IMI Heimeier', slug: 'imi-heimeier', isVerified: true, productCount: 679 },
    { id: '94ebcafd-8a3d-43f4-aab2-888fa636ac8d', name: 'Danfoss', slug: 'danfoss', isVerified: true, productCount: 640 },
    { id: '62b285ea-9c5e-4b1c-a889-7ab4932727ac', name: 'IMI TA', slug: 'imi-ta', isVerified: true, productCount: 553 },
    { id: '88a4e910-2026-4a1e-9b00-000000002026', name: 'Haier', slug: 'haier', isVerified: true, productCount: 465 },
    { id: 'b10c3c58-fca7-5eb4-b67d-a533bb6871b6', name: 'Viessmann', slug: 'viessmann', isVerified: true, productCount: 366 },
    { id: '500218e3-cb3a-5d52-b010-eef8c1723ce1', name: 'Wilo', slug: 'wilo', isVerified: true, productCount: 290 },
    { id: 'a99b5920-2527-5ef1-8d67-19932fae581d', name: 'SANHA', slug: 'sanha', isVerified: true, productCount: 272 },
    { id: '1905b217-a3b5-53bc-a99f-4d32792e6e2c', name: 'Watts', slug: 'watts', isVerified: true, productCount: 186 },
    { id: 'bdb9041d-43ea-54b3-960c-7e56bb6e7c08', name: 'FV-Plast', slug: 'fv-plast', isVerified: true, productCount: 179 },
    { id: '1ebc1d9d-dfbf-5c53-8d80-6043117a1bb6', name: 'Wavin', slug: 'wavin', isVerified: true, productCount: 179 },
    { id: 'f93d76c1-a7e8-5a5d-9298-a2d8fbe34bf0', name: 'Centrometal', slug: 'centrometal', isVerified: true, productCount: 150 },
    { id: '33aa365c-14a0-5eb4-95e3-a9fb827b3e74', name: 'Dražice', slug: 'drazice', isVerified: true, productCount: 143 },
    { id: '729587ba-1f89-5992-8b60-ef705ab6abd4', name: 'Buderus', slug: 'buderus', isVerified: true, productCount: 122 },
    { id: '89d211c3-c0f4-5bf9-b859-f3abf1f4ca84', name: 'Thermawool', slug: 'thermawool', isVerified: true, productCount: 120 },
    { id: '44e3e121-07fd-5619-ba2b-f37d4bc74a7c', name: 'HERZ', slug: 'herz', isVerified: true, productCount: 62 },
    { id: 'b530bcea-bfb3-5850-a354-e3f9d32a738d', name: 'Gorenje', slug: 'gorenje', isVerified: true, productCount: 63 },
    { id: 'dc7d5152-ccc4-5f1e-8ff5-4a044d8b3041', name: 'Rotex', slug: 'rotex', isVerified: true, productCount: 44 },
    { id: 'e0269c03-4759-5b30-a220-8ff57a51b797', name: 'Grundfos', slug: 'grundfos', isVerified: true, productCount: 43 },
    { id: 'f6a3e8dd-b790-40db-83c2-050dac6be219', name: 'Ferroli', slug: 'ferroli', isVerified: true, productCount: 30 },
    { id: 'b7ea3ad4-7997-534d-8efc-dc1611a7e28a', name: 'Thermaflex', slug: 'thermaflex', isVerified: true, productCount: 28 },
    { id: 'bf3f482a-62a1-52e5-afa8-1dd606285893', name: 'Ferro', slug: 'ferro', isVerified: true, productCount: 24 },
    { id: '70463db1-b12d-57af-8fe2-915e08de9b27', name: 'Zilmet', slug: 'zilmet', isVerified: true, productCount: 21 },
    { id: '6b4a93a1-bbfc-5bd6-b76b-46031efae408', name: 'Junkers', slug: 'junkers', isVerified: true, productCount: 16 },
    { id: '511204fe-1ce4-55d8-81c0-afc024751bbe', name: 'Megatherm', slug: 'megatherm', isVerified: true, productCount: 2 },
    { id: '0ccacc49-3a00-5cec-b358-e532272b92b6', name: 'Pelltech', slug: 'pelltech', isVerified: true, productCount: 1 },
];

export async function storeIdOrThrow(): Promise<string> {
    const key = `${process.env.STORE_SLUG || ''}|${process.env.STORE_ID || ''}`;
    const now = Date.now();
    const cached = storeIdMemoryCache.get(key);
    if (cached && cached.expiresAt > now) {
        return cached.value;
    }
    const sid = await resolveCatalogStoreId();
    storeIdMemoryCache.set(key, { expiresAt: now + STORE_ID_TTL_MS, value: sid });
    return sid;
}

const EXACT_SKU_LOWER_LIST = Array.from(EXACT_PHOTO_SKUS)
    .map((s) => s.toLowerCase())
    .filter((v, i, a) => a.indexOf(v) === i);

export interface ListingProduct {
    id: string;
    slug?: string | null;
    name: string;
    nameLt: string | null;
    categoryName: string | null;
    categorySlug: string | null;
    brandName: string | null;
    brandVerified: boolean | null;
    createdAt: Date | string | null;
    price: number; // EUR gross, cheapest variant (variants.priceGross / 100)
    compareAtPrice: number | null;
    stock: number | null; // null = unknown supplier stock (purchasable, see lib/purchasable)
    stockQuantity?: number | null;
    stockUnit?: string | null;
    stockSource?: string | null;
    lastSyncedAt?: string | null;
    sku: string;
    imageUrl: string | undefined;
    seriesImageUrl?: string;
    seriesBadge?: string;
    technicalCallout?: string;
    ean?: string | null;
    description?: string | null;
    specs?: Record<string, string>;
    technicalSpecs?: Record<string, string>;
    exactSkuMatch: boolean;
    /** W22-D1 T4: cheapest-variant gross cents + VAT rate for the su/be-PVM display. */
    priceCents: number | null;
    vatRate: number | null;
    /** W121-A1 honest-commerce contract (optional on legacy rows). */
    priceEur?: number | null;
    priceOnRequest?: true;
    availability?: 'in_stock' | 'supplier_2_4d' | 'on_request';
    stockQty?: number | null;
}

export interface ListingFilters {
    categoryId?: string;
    category?: string;
    q?: string;
    brandId?: string;
    brand?: string;
    boiler?: string;
    sub?: string;
    subtype?: string;
    spec?: string;
    priceRange?: string;
    minPrice?: number;
    maxPrice?: number;
    inStock?: boolean;
    sortBy?: string;
    /** W22-D1: SQL-side pagination (48/page on the listing page). */
    page?: number;
    pageSize?: number;
}

import {
    BOILER_SYSTEM_GROUPS,
    LITHUANIAN_BOILER_SYSTEM_MODELS,
    LITHUANIAN_BOILER_PROFILES,
    getBoilerSystemModelById,
    getBoilerSystemGroupById,
    resolveBoilerCompatibilityPassport,
    filterProductsByBoilerCompatibility,
    doesProductMatchBoilerSystem,
    getBoilerExcludedRegex,
    type BoilerSystemGroupId,
    type BoilerSystemGroup,
    type LithuanianBoilerSystemModel,
    type ResolvedEngineeringCompatibilityPassport,
} from './lithuanian-boiler-compatibility';
export {
    BOILER_SYSTEM_GROUPS,
    LITHUANIAN_BOILER_SYSTEM_MODELS,
    LITHUANIAN_BOILER_PROFILES,
    getBoilerSystemModelById,
    getBoilerSystemGroupById,
    resolveBoilerCompatibilityPassport,
    filterProductsByBoilerCompatibility,
    doesProductMatchBoilerSystem,
    getBoilerExcludedRegex,
    type BoilerSystemGroupId,
    type BoilerSystemGroup,
    type LithuanianBoilerSystemModel,
    type ResolvedEngineeringCompatibilityPassport,
};

import {
    CATALOG_SUBTYPE_OPTIONS,
    CATALOG_SPEC_OPTIONS,
    type CatalogSubtypeOption,
    type CatalogSpecOption,
} from './catalog-filter-options';
export {
    CATALOG_SUBTYPE_OPTIONS,
    CATALOG_SPEC_OPTIONS,
    type CatalogSubtypeOption,
    type CatalogSpecOption,
};

export type CatalogSearchParams = ListingFilters;

export interface PagedListing {
    items: ListingProduct[];
    total: number;
    page: number;
    pageSize: number | null;
    pageCount: number;
}

interface RawProductRow {
    id: string;
    slug?: string | null;
    name: string | null;
    nameLt: string | null;
    categoryName: string | null;
    categorySlug: string | null;
    brandName: string | null;
    brandVerified: boolean | null;
    createdAt: Date | null;
}

const rawSelect = {
    id: products.id,
    slug: products.slug,
    name: products.titleEn,
    nameLt: products.titleLt,
    categoryName: categories.name,
    categorySlug: categories.slug,
    brandName: brands.name,
    brandVerified: brands.isVerified,
    createdAt: products.createdAt,
};

function rawQuery() {
    return db.select(rawSelect)
        .from(products)
        .innerJoin(categories, eq(products.categoryId, categories.id))
        .leftJoin(brands, eq(products.brandId, brands.id));
}

async function attachVariantData(
    rows: RawProductRow[],
    exactSkuIds: Set<string>,
): Promise<ListingProduct[]> {
    if (rows.length === 0) return [];
    const variantRows = await db.select({
        productId: variants.productId,
        sku: variants.sku,
        priceGross: variants.priceGross,
        compareAtPrice: variants.compareAtPrice,
        stock: variants.stock,
        images: variants.images,
        attributes: variants.attributes,
        vatRate: variants.vatRate,
    })
        .from(variants)
        .where(inArray(variants.productId, rows.map((r) => r.id)));

    const bestByProduct = new Map<string, { sku: string; priceGross: number | null; compareAtPrice: number | null; stock: number | null; imageUrl?: string; vatRate: number | null }>();
    for (const v of variantRows) {
        const current = bestByProduct.get(v.productId);
        const price = v.priceGross != null ? Number(v.priceGross) : null;
        const better = !current
            || (price != null && (current.priceGross == null || price < current.priceGross));
        if (better) {
            const images = Array.isArray(v.images) ? v.images : [];
            const mainImg = images.find((img: any) => img?.slot === 'main') || images[0];
            const attrs = v.attributes && typeof v.attributes === 'object' ? (v.attributes as Record<string, any>) : {};
            const seriesImg = typeof attrs.seriesImageUrl === 'string' && attrs.seriesImageUrl
                ? attrs.seriesImageUrl
                : typeof attrs.ui_fallback_image === 'string' && attrs.ui_fallback_image
                    ? attrs.ui_fallback_image
                    : undefined;
            bestByProduct.set(v.productId, {
                sku: v.sku,
                priceGross: price,
                compareAtPrice: v.compareAtPrice != null ? Number(v.compareAtPrice) : null,
                stock: v.stock == null ? null : Number(v.stock),
                imageUrl: mainImg?.url || seriesImg,
                vatRate: v.vatRate == null ? null : Number(v.vatRate),
            });
        }
    }

    return rows.map((p) => {
        const best = bestByProduct.get(p.id);
        const sku = best?.sku || `SKU-${p.id.slice(0, 8)}`;
        const rawTitle = p.nameLt || p.name || '';
        const resolvedBrand = p.brandName || inferProductBrandName({
            brand: p.brandName,
            title: rawTitle,
            sku,
        });
        const cleanTitle = formatCleanCatalogProductTitle(rawTitle, sku, resolvedBrand);
        const resolvedImg = resolveProductImageUrl({
            sku,
            title: cleanTitle,
            brand: resolvedBrand,
            category: p.categoryName,
            imageUrl: best?.imageUrl,
            seriesImageUrl: best?.imageUrl,
        });
        const resolvedSlug = typeof p.slug === 'string' && p.slug.trim()
            ? p.slug.trim()
            : buildProductSlug(rawTitle, sku);
        return {
            id: p.id,
            slug: resolvedSlug,
            name: cleanTitle,
            nameLt: cleanTitle,
            categoryName: p.categoryName,
            categorySlug: p.categorySlug,
            brandName: resolvedBrand,
            brandVerified: p.brandVerified,
            createdAt: p.createdAt,
            price: best?.priceGross != null ? best.priceGross / 100 : 0,
            compareAtPrice: best?.compareAtPrice != null ? best.compareAtPrice / 100 : null,
            stock: best?.stock ?? null,
            sku,
            imageUrl: resolvedImg,
            seriesImageUrl: best?.imageUrl || resolvedImg,
            exactSkuMatch: exactSkuIds.has(p.id),
            priceCents: best?.priceGross ?? null,
            vatRate: best?.vatRate ?? null,
        };
    });
}

async function exactSkuProductIds(parsed: ParsedSkuQuery): Promise<Set<string>> {
    if (parsed.codes.length === 0) return new Set();
    const codeList = sql.join(parsed.codes.map((code) => sql`${code.toLowerCase()}`), sql`, `);
    const rows = await db.select({ productId: variants.productId })
        .from(variants)
        .where(sql`regexp_replace(lower(${variants.sku}), '[^a-z0-9]', '', 'g') in (${codeList})`);
    return new Set(rows.map((r: any) => r.productId));
}

function priceBucketCents(priceRange?: string): { min?: number; max?: number } | null {
    switch (priceRange) {
        case 'under-50': return { max: 5000 };
        case '50-200': return { min: 5000, max: 20000 };
        case '200-1000': return { min: 20000, max: 100000 };
        case '1000-plus': return { min: 100000 };
        case 'under-20': return { max: 2000 };
        case '20-50': return { min: 2000, max: 5000 };
        case '50-plus': return { min: 5000 };
        default: return null;
    }
}

function rowsOf(result: unknown): any[] {
    const r = result as any;
    return Array.isArray(r) ? r : (r?.rows ?? []);
}

export const CATEGORY_QUERY_ALIASES: Record<string, string[]> = {
    'boilers-radiators': [
        'Katilai ir katilinės įranga',
        'Šildymo katilai ir krosnelės',
        'Degikliai ir priedai',
        'Radiatoriai ir konvektoriai',
        'Akumuliacinės talpos ir boileriai',
    ],
    'expansion-tanks': [
        'Akumuliacinės talpos ir boileriai',
        'Plėtimosi indai ir slėgio palaikymas',
    ],
    collectors: [
        'Grindinis šildymas ir kolektoriai',
        'Katilinės automatika ir pavaros',
    ],
    'thermostatic-calling': [
        'Termostatinės galvutės ir vožtuvai',
        'Balansiniai ir reguliavimo vožtuvai',
    ],
    'thermostatic-valves': [
        'Termostatinės galvutės ir vožtuvai',
        'Balansiniai ir reguliavimo vožtuvai',
    ],
    'granulių degikliai': ['Degikliai ir priedai', 'Granulių degikliai'],
    'degikliai ir priedai': ['Degikliai ir priedai', 'Granulių degikliai'],
    'katilai ir šilumos siurbliai': [
        'Katilai ir katilinės įranga',
        'Šildymo katilai ir krosnelės',
        'Katilai ir šilumos siurbliai',
    ],
    'šildymo katilai ir krosnelės': [
        'Katilai ir katilinės įranga',
        'Šildymo katilai ir krosnelės',
        'Katilai ir šilumos siurbliai',
    ],
    'katilai ir katilinės įranga': [
        'Katilai ir katilinės įranga',
        'Šildymo katilai ir krosnelės',
        'Katilai ir šilumos siurbliai',
    ],
    'akumuliacinės talpos ir boileriai': [
        'Akumuliacinės talpos ir boileriai',
        'Vandens šildytuvai ir akumuliacinės talpos',
        'Plėtimosi indai ir slėgio palaikymas',
    ],
    'vandens šildytuvai ir akumuliacinės talpos': [
        'Akumuliacinės talpos ir boileriai',
        'Vandens šildytuvai ir akumuliacinės talpos',
        'Plėtimosi indai ir slėgio palaikymas',
    ],
    'radiatoriai ir šildymo prietaisai': [
        'Radiatoriai ir konvektoriai',
        'Radiatoriai ir šildymo prietaisai',
    ],
    'radiatoriai ir konvektoriai': [
        'Radiatoriai ir konvektoriai',
        'Radiatoriai ir šildymo prietaisai',
    ],
    'termostatika ir vožtuvai': [
        'Termostatinės galvutės ir vožtuvai',
        'Balansiniai ir reguliavimo vožtuvai',
        'Oro atskyrikliai ir nuorintuvai',
        'Termostatika ir vožtuvai',
    ],
    'termostatinės galvutės ir vožtuvai': [
        'Termostatinės galvutės ir vožtuvai',
        'Balansiniai ir reguliavimo vožtuvai',
        'Oro atskyrikliai ir nuorintuvai',
        'Termostatika ir vožtuvai',
    ],
    'grindinis šildymas': [
        'Grindinis šildymas ir kolektoriai',
        'Grindinis šildymas',
    ],
    'grindinis šildymas ir kolektoriai': [
        'Grindinis šildymas ir kolektoriai',
        'Grindinis šildymas',
    ],
    'atsarginės dalys': [
        'Katilinės automatika ir pavaros',
        'Degikliai ir priedai',
        'Vamzdynų jungtys ir armatūra',
        'Atsarginės dalys',
    ],
    'katilinės automatika ir pavaros': [
        'Katilinės automatika ir pavaros',
        'Degikliai ir priedai',
        'Atsarginės dalys',
    ],
};

export function resolveCategoryAliasNames(categoryInput: string): string[] {
    const trimmed = (categoryInput || '').trim();
    if (!trimmed) return [];
    const aliasMatches = CATEGORY_QUERY_ALIASES[trimmed.toLowerCase()];
    if (aliasMatches && aliasMatches.length > 0) {
        return [trimmed, ...aliasMatches];
    }
    return [trimmed];
}

export async function searchCatalogProductsPaged(filters: ListingFilters = {}): Promise<PagedListing> {
    if (shouldUseGilesSnapshot()) {
        const activeBoiler = (filters.boiler ?? '').trim();
        if (activeBoiler && activeBoiler !== 'all' && activeBoiler !== 'visi') {
            const unpaged = searchGilesSnapshotPaged({
                ...filters,
                page: 1,
                pageSize: undefined,
            });
            const boilerMatched = filterProductsByBoilerCompatibility(unpaged.items, activeBoiler);
            const total = boilerMatched.length;
            const pageSize = filters.pageSize && filters.pageSize > 0 ? filters.pageSize : null;
            const page = Math.max(1, filters.page ?? 1);
            const items = pageSize
                ? boilerMatched.slice((page - 1) * pageSize, (page - 1) * pageSize + pageSize)
                : boilerMatched;
            return {
                items,
                total,
                page: pageSize ? page : 1,
                pageSize,
                pageCount: pageSize ? Math.ceil(total / pageSize) : 1,
            };
        }
        return searchGilesSnapshotPaged(filters);
    }
    try {
        const storeId = await storeIdOrThrow();
        const parsed = parseSkuQuery(filters.q ?? '');
        const pinIds = await exactSkuProductIds(parsed);

        const conditions: SQL[] = [
            sql`p.status = 'published'`,
            sql`ps.store_id = ${storeId} and ps.is_active = true`,
            sql`coalesce(v.sku, '') not ilike 'SUR-DEMO-%'`,
            sql`coalesce(v.sku, '') not ilike 'W16D1-%'`,
        ];

        const activeCategory = (filters.category ?? filters.categoryId ?? '').trim();
        if (activeCategory && activeCategory !== 'visi') {
            const resolvedNames = resolveCategoryAliasNames(activeCategory);
            const nameConditions = resolvedNames.map(
                (name) => sql`lower(trim(c.name)) = lower(trim(${name}))`,
            );
            conditions.push(sql`(
                c.id::text = ${activeCategory}
                or lower(trim(c.slug)) = lower(trim(${activeCategory}))
                or (${sql.join(nameConditions, sql` or `)})
            )`);
        }

        const activeBrand = (filters.brand ?? filters.brandId ?? '').trim();
        if (activeBrand && activeBrand.toLowerCase() !== 'visi') {
            const normalizedSlug = toBrandSlug(activeBrand);
            const canonicalBrand =
                CATALOG_ACTIVE_BRAND_DIRECTORY.find((b) => b.slug === normalizedSlug)?.name || activeBrand;
            const brandTerm = `%${canonicalBrand}%`;
            conditions.push(sql`(
                b.id::text = ${activeBrand}
                or lower(trim(coalesce(b.name, ''))) = lower(trim(${activeBrand}))
                or lower(trim(coalesce(b.name, ''))) = lower(trim(${canonicalBrand}))
                or translate(lower(regexp_replace(coalesce(b.name, ''), '[^a-zA-Z0-9ąčęėįšųūžĄČĘĖĮŠŲŪŽ]+', '-', 'g')), 'ąčęėįšųūž', 'aceeisuuz') = ${normalizedSlug}
                or b.name ilike ${brandTerm}
            )`);
        }

        if (parsed.rawQuery) {
            const term = `%${parsed.rawQuery}%`;
            const codeMatches: SQL[] = parsed.codes.map(
                (code) => sql`regexp_replace(lower(vs.sku), '[^a-z0-9]', '', 'g') ilike ${`%${code.toLowerCase()}%`}`,
            );
            conditions.push(sql`(
                exists (select 1 from variants vs where vs.product_id = p.id and (vs.sku ilike ${term}${codeMatches.length ? sql` or (${sql.join(codeMatches, sql` or `)})` : sql``}))
                or p.title_en ilike ${term}
                or p.title_lt ilike ${term}
                or b.name ilike ${term}
                or c.name ilike ${term}
            )`);
        }

        const activeSubtype = (filters.sub ?? filters.subtype ?? '').trim().toLowerCase();
        if (activeSubtype && activeSubtype !== 'all') {
            const pattern = resolveCatalogSubcategoryRegex(activeCategory, activeSubtype);
            conditions.push(sql`(
                coalesce(p.title_lt, '') ~* ${pattern}
                or coalesce(p.title_en, '') ~* ${pattern}
                or coalesce(p.description_lt, '') ~* ${pattern}
                or coalesce(v.sku, '') ~* ${pattern}
                or coalesce(b.name, '') ~* ${pattern}
            )`);
        }

        const activeSpec = (filters.spec ?? '').trim();
        if (activeSpec) {
            const pattern = resolveCatalogSpecRegex(activeCategory, activeSpec);
            conditions.push(sql`(
                coalesce(p.title_lt, '') ~* ${pattern}
                or coalesce(p.title_en, '') ~* ${pattern}
                or coalesce(p.description_lt, '') ~* ${pattern}
                or coalesce(v.sku, '') ~* ${pattern}
                or coalesce(b.name, '') ~* ${pattern}
            )`);
        }

        const activeBoiler = (filters.boiler ?? '').trim();
        if (activeBoiler && activeBoiler !== 'all' && activeBoiler !== 'visi') {
            const boilerModel = getBoilerSystemModelById(activeBoiler);
            if (boilerModel) {
                const pattern = boilerModel.passport.sqlRegex;
                conditions.push(sql`(
                    coalesce(p.title_lt, '') ~* ${pattern}
                    or coalesce(p.title_en, '') ~* ${pattern}
                    or coalesce(p.description_lt, '') ~* ${pattern}
                    or coalesce(v.sku, '') ~* ${pattern}
                    or coalesce(b.name, '') ~* ${pattern}
                )`);
                const excludedPattern = getBoilerExcludedRegex(boilerModel);
                if (excludedPattern) {
                    conditions.push(sql`not (
                        coalesce(p.title_lt, '') ~* ${excludedPattern}
                        or coalesce(p.title_en, '') ~* ${excludedPattern}
                        or coalesce(p.description_lt, '') ~* ${excludedPattern}
                        or coalesce(v.sku, '') ~* ${excludedPattern}
                    )`);
                }
            }
        }

        const bucket = priceBucketCents(filters.priceRange);
        if (bucket) {
            if (bucket.min != null) conditions.push(sql`v.price_gross >= ${bucket.min}`);
            if (bucket.max != null) conditions.push(sql`v.price_gross <= ${bucket.max}`);
        }
        if (filters.minPrice != null && Number.isFinite(filters.minPrice) && filters.minPrice > 0) {
            conditions.push(sql`v.price_gross >= ${Math.round(filters.minPrice * 100)}`);
        }
        if (filters.maxPrice != null && Number.isFinite(filters.maxPrice) && filters.maxPrice > 0) {
            conditions.push(sql`v.price_gross <= ${Math.round(filters.maxPrice * 100)}`);
        }
        if (filters.inStock) {
            conditions.push(sql`(v.stock is null or v.stock >= 0)`);
        }

        const exactSkuSqlList = sql.join(EXACT_SKU_LOWER_LIST.map((s) => sql`${s}`), sql`, `);
        const photoPriority = sql`case
            when lower(coalesce(v.sku, '')) in (${exactSkuSqlList}) then 0
            when jsonb_typeof(v.images) = 'array'
                 and jsonb_array_length(v.images) > 0
                 and (v.images->0->>'url') like '/images/products/%'
                 and (v.images->0->>'url') not like '%family-%' then 1
            else 2
        end`;

        const pinCase = pinIds.size > 0
            ? sql`case when p.id in (${sql.join([...pinIds].map((id) => sql`${id}`), sql`, `)}) then 0 else 1 end, `
            : sql``;
        const criterion: SQL =
            filters.sortBy === 'code-asc' || filters.sortBy === 'code_asc' ? sql`v.sku asc`
            : filters.sortBy === 'price-asc' || filters.sortBy === 'price_asc' ? sql`v.price_gross asc nulls last`
            : filters.sortBy === 'price-desc' || filters.sortBy === 'price_desc' ? sql`v.price_gross desc nulls last`
            : filters.sortBy === 'newest' ? sql`p.created_at desc, ${photoPriority} asc`
            : sql`${photoPriority} asc, p.created_at desc`;

        const pageSize = filters.pageSize && filters.pageSize > 0 ? filters.pageSize : null;
        const page = Math.max(1, filters.page ?? 1);
        const limitClause = pageSize
            ? sql` limit ${pageSize} offset ${(page - 1) * pageSize}`
            : sql``;

        const base = sql`
            from product_stores ps
            inner join products p on p.id = ps.product_id
            inner join categories c on c.id = p.category_id
            left join brands b on b.id = p.brand_id
            left join lateral (
                select vs.sku, vs.price_gross, vs.compare_at_price, vs.stock, vs.images, vs.attributes, vs.vat_rate
                from variants vs
                where vs.product_id = p.id
                order by (vs.price_gross is null), vs.price_gross asc
                limit 1
            ) v on true
            where ${sql.join(conditions, sql` and `)}`;

        const rowsResult = await db.execute(sql`
            select p.id, p.slug, p.title_en as name, p.title_lt as name_lt, p.created_at,
                   c.name as category_name, c.slug as category_slug,
                   b.name as brand_name, b.is_verified as brand_verified,
                   v.sku, v.price_gross, v.compare_at_price, v.stock, v.images, v.attributes, v.vat_rate,
                   COUNT(*) OVER()::int AS total_count
            ${base}
            order by ${pinCase}${criterion}, p.id desc
            ${limitClause}`);

        const rows = rowsOf(rowsResult);
        let total = 0;
        if (rows.length > 0) {
            total = Number(rows[0]?.total_count ?? rows.length);
        } else if (page > 1) {
            const countResult = await db.execute(sql`select count(*)::int as total ${base}`);
            total = Number(rowsOf(countResult)[0]?.total ?? 0);
        }

        const items: ListingProduct[] = rows.map((r: any) => {
            const sku = r.sku || `SKU-${String(r.id).slice(0, 8)}`;
            const rawTitle = r.name_lt || r.name || '';
            const attrs = r.attributes && typeof r.attributes === 'object' ? (r.attributes as Record<string, any>) : {};
            const seriesImageUrl = typeof attrs.seriesImageUrl === 'string' && attrs.seriesImageUrl
                ? attrs.seriesImageUrl
                : typeof attrs.ui_fallback_image === 'string' && attrs.ui_fallback_image
                    ? attrs.ui_fallback_image
                    : undefined;
            const rawImageUrl = (Array.isArray(r.images) && r.images[0]?.url) || seriesImageUrl || undefined;
            const resolvedBrand = r.brand_name || inferProductBrandName({
                brand: r.brand_name,
                title: rawTitle,
                sku,
            });
            const cleanTitle = formatCleanCatalogProductTitle(rawTitle, sku, resolvedBrand);
            const resolvedImageUrl = resolveProductImageUrl({
                sku,
                title: cleanTitle,
                brand: resolvedBrand,
                category: r.category_name,
                imageUrl: rawImageUrl,
            });

            const resolvedSlug = typeof r.slug === 'string' && r.slug.trim()
                ? r.slug.trim()
                : buildProductSlug(rawTitle, sku);

            return {
                id: r.id,
                slug: resolvedSlug,
                name: cleanTitle,
                nameLt: cleanTitle,
                categoryName: r.category_name,
                categorySlug: r.category_slug,
                brandName: resolvedBrand,
                brandVerified: r.brand_verified,
                createdAt: r.created_at,
                price: r.price_gross != null ? Number(r.price_gross) / 100 : 0,
                compareAtPrice: r.compare_at_price != null ? Number(r.compare_at_price) / 100 : null,
                stock: r.stock == null ? null : Number(r.stock),
                sku,
                imageUrl: resolvedImageUrl,
                exactSkuMatch: pinIds.has(r.id),
                priceCents: r.price_gross != null ? Number(r.price_gross) : null,
                vatRate: r.vat_rate == null ? null : Number(r.vat_rate),
            };
        });

        return {
            items,
            total,
            page: pageSize ? page : 1,
            pageSize,
            pageCount: pageSize ? Math.ceil(total / pageSize) : 1,
        };
    } catch (error) {
        console.error('[catalog-listing] searchCatalogProductsPaged failed:', error);
        return { items: [], total: 0, page: 1, pageSize: filters.pageSize ?? null, pageCount: 0 };
    }
}

export async function searchCatalogProducts(filters: ListingFilters = {}): Promise<ListingProduct[]> {
    const paged = await searchCatalogProductsPaged(filters);
    return paged.items;
}

export async function getBrandCatalogTiles(): Promise<Array<{ id: string; name: string; slug: string; isVerified: boolean; productCount: number }>> {
    if (shouldUseGilesSnapshot()) {
        return getGilesSnapshotBrands();
    }
    try {
        const sid = await storeIdOrThrow();
        const cacheKey = `brands:${sid}`;
        const now = Date.now();
        const cached = catalogTtlCache.get(cacheKey);
        if (cached && cached.expiresAt > now) {
            return cached.value as Array<{ id: string; name: string; slug: string; isVerified: boolean; productCount: number }>;
        }
        const rows = await db.select({
            id: brands.id,
            name: brands.name,
            isVerified: brands.isVerified,
            productCount: sql<number>`count(*)::int`,
        })
            .from(products)
            .innerJoin(productStores, eq(productStores.productId, products.id))
            .innerJoin(brands, eq(products.brandId, brands.id))
            .where(and(
                eq(products.status, 'published'),
                eq(productStores.isActive, true),
                eq(productStores.storeId, sid),
            ))
            .groupBy(brands.id, brands.name, brands.isVerified)
            .orderBy(desc(sql`count(*)`));
        const mapped: Array<{ id: string; name: string; slug: string; isVerified: boolean; productCount: number }> = rows.map((r: any) => ({
            id: r.id,
            name: r.name,
            slug: toBrandSlug(String(r.name || '')),
            isVerified: Boolean(r.isVerified),
            productCount: Number(r.productCount),
        }));
        const result = (mapped.length > 0 ? mapped : [...CATALOG_ACTIVE_BRAND_DIRECTORY]).sort(
            (a: { slug: string; productCount: number }, b: { slug: string; productCount: number }) => {
                const aGiles = a.slug === 'giles-inzinerija' ? 0 : 1;
                const bGiles = b.slug === 'giles-inzinerija' ? 0 : 1;
                if (aGiles !== bGiles) return aGiles - bGiles;
                return b.productCount - a.productCount;
            },
        );
        catalogTtlCache.set(cacheKey, { expiresAt: now + CATALOG_TTL_MS, value: result });
        return result;
    } catch (error) {
        console.error('[catalog-listing] getBrandCatalogTiles failed:', error);
        return [...CATALOG_ACTIVE_BRAND_DIRECTORY];
    }
}

export async function getBrandSummaries(): Promise<Array<{ id: string; name: string; slug: string; isVerified: boolean; productCount: number }>> {
    return getBrandCatalogTiles();
}

export async function listCatalogBrands(_storeId?: string): Promise<Array<{ id: string; name: string; slug: string; count: number; isVerified: boolean }>> {
    const tiles = await getBrandCatalogTiles();
    return tiles.map((t) => ({
        id: t.id,
        name: t.name,
        slug: t.slug,
        count: t.productCount,
        isVerified: t.isVerified,
    }));
}

export async function getCategoryCatalogCounts(): Promise<Array<{ id: string; name: string; slug: string; productCount: number }>> {
    if (shouldUseGilesSnapshot()) {
        return getGilesSnapshotCategories();
    }
    try {
        const sid = await storeIdOrThrow();
        const cacheKey = `categories:${sid}`;
        const now = Date.now();
        const cached = catalogTtlCache.get(cacheKey);
        if (cached && cached.expiresAt > now) {
            return cached.value as Array<{ id: string; name: string; slug: string; productCount: number }>;
        }
        const rows = await db.select({
            id: categories.id,
            name: categories.name,
            slug: categories.slug,
            productCount: sql<number>`count(*)::int`,
        })
            .from(products)
            .innerJoin(productStores, eq(productStores.productId, products.id))
            .innerJoin(categories, eq(products.categoryId, categories.id))
            .where(and(
                eq(products.status, 'published'),
                eq(productStores.isActive, true),
                eq(productStores.storeId, sid),
            ))
            .groupBy(categories.id, categories.name, categories.slug, categories.sortOrder)
            .orderBy(asc(categories.sortOrder), desc(sql`count(*)`));
        const result = rows.map((r: any) => ({
            id: r.id,
            name: r.name,
            slug: r.slug,
            productCount: Number(r.productCount),
        }));
        catalogTtlCache.set(cacheKey, { expiresAt: now + CATALOG_TTL_MS, value: result });
        return result;
    } catch (error) {
        console.error('[catalog-listing] getCategoryCatalogCounts failed:', error);
        return [];
    }
}

export async function getCategorySummaries(): Promise<Array<{ id: string; name: string; slug: string; productCount: number }>> {
    return getCategoryCatalogCounts();
}

export async function getStoreFilterMetadata(_storeId?: string): Promise<{
    categories: Array<{ id: string; name: string; slug: string; productCount: number }>;
    brands: Array<{ id: string; name: string; slug: string; count: number; isVerified: boolean }>;
}> {
    const sid = _storeId || (await storeIdOrThrow());
    const cacheKey = `filterMeta:${sid}`;
    const now = Date.now();
    const cached = catalogTtlCache.get(cacheKey);
    if (cached && cached.expiresAt > now) {
        return cached.value as {
            categories: Array<{ id: string; name: string; slug: string; productCount: number }>;
            brands: Array<{ id: string; name: string; slug: string; count: number; isVerified: boolean }>;
        };
    }
    const [categoriesList, brandsList] = await Promise.all([
        getCategorySummaries(),
        listCatalogBrands(sid),
    ]);
    const result = { categories: categoriesList, brands: brandsList };
    catalogTtlCache.set(cacheKey, { expiresAt: now + CATALOG_TTL_MS, value: result });
    return result;
}

export async function getPopularProductPreviews(limit = 12, _storeId?: string): Promise<ListingProduct[]> {
    if (shouldUseGilesSnapshot()) {
        return getGilesSnapshotPopularProducts(limit);
    }
    try {
        const sid = _storeId || (await storeIdOrThrow());
        const cacheKey = `popular:${sid}:${limit}`;
        const now = Date.now();
        const cached = catalogTtlCache.get(cacheKey);
        if (cached && cached.expiresAt > now) {
            return cached.value as ListingProduct[];
        }
        // Fetch a broad pool of flagship products across all brands so we can
        // curate a balanced showcase (3 Danfoss, 3 IMI Heimeier, 3 IMI Pneumatex,
        // 2 IMI TA, 1 Ferroli) with 100% real manufacturer photos and zero spare brackets/boxes.
        const [danfossRes, heimeierRes, pneumatexRes, taRes, ferroliRes, fallbackRes] = await Promise.all([
            searchCatalogProductsPaged({ brand: 'Danfoss', page: 1, pageSize: 12 }),
            searchCatalogProductsPaged({ brand: 'IMI Heimeier', page: 1, pageSize: 12 }),
            searchCatalogProductsPaged({ brand: 'IMI Pneumatex', page: 1, pageSize: 12 }),
            searchCatalogProductsPaged({ brand: 'IMI TA', page: 1, pageSize: 12 }),
            searchCatalogProductsPaged({ brand: 'Ferroli', page: 1, pageSize: 8 }),
            searchCatalogProductsPaged({ page: 1, pageSize: Math.max(limit * 3, 36) }),
        ]);

        const isCleanFlagship = (item: ListingProduct): boolean => {
            const titleLower = `${item.nameLt || ''} ${item.name || ''}`.toLowerCase();
            if (/montavimo dėž|detalė tvirtinimo|laikiklis|tarpinė|kamštis|aklė/i.test(titleLower)) {
                return false;
            }
            return true;
        };

        const pickFromPool = (pool: ListingProduct[], count: number, pickedIds: Set<string>): ListingProduct[] => {
            const sorted = [...pool]
                .filter((p) => !pickedIds.has(p.id) && isCleanFlagship(p))
                .sort((a, b) => {
                    const aExact = isExactPhotoSku(a.sku) ? 0 : 1;
                    const bExact = isExactPhotoSku(b.sku) ? 0 : 1;
                    if (aExact !== bExact) return aExact - bExact;
                    return 0;
                });
            const selected = sorted.slice(0, count);
            for (const s of selected) pickedIds.add(s.id);
            return selected;
        };

        const pickedIds = new Set<string>();
        const curated: ListingProduct[] = [
            ...pickFromPool(danfossRes.items, 3, pickedIds),
            ...pickFromPool(heimeierRes.items, 3, pickedIds),
            ...pickFromPool(pneumatexRes.items, 3, pickedIds),
            ...pickFromPool(taRes.items, 2, pickedIds),
            ...pickFromPool(ferroliRes.items, 1, pickedIds),
        ];

        if (curated.length < limit) {
            const remaining = pickFromPool(fallbackRes.items, limit - curated.length, pickedIds);
            curated.push(...remaining);
        }
        if (curated.length < limit) {
            for (const item of fallbackRes.items) {
                if (curated.length >= limit) break;
                if (!pickedIds.has(item.id)) {
                    pickedIds.add(item.id);
                    curated.push(item);
                }
            }
        }

        const result = curated.slice(0, limit);
        catalogTtlCache.set(cacheKey, { expiresAt: now + CATALOG_TTL_MS, value: result });
        return result;
    } catch (error) {
        console.error('[catalog-listing] getPopularProductPreviews failed:', error);
        return [];
    }
}

export type CatalogFilterLocale = 'lt' | 'en' | 'pl' | 'ru';

export type CanonicalCategoryGroupKey =
    | 'all'
    | 'radiators'
    | 'boilers'
    | 'burners'
    | 'tanks'
    | 'thermostatics'
    | 'underfloor'
    | 'spares';

export interface DynamicCategorySubcategoryDef {
    slug: string;
    labels: Record<CatalogFilterLocale, string>;
    sqlRegex: string;
}

export interface DynamicCategorySubcategoryItem extends DynamicCategorySubcategoryDef {
    label: string;
    count: number;
}

export interface DynamicCategoryFacetChipDef {
    key: string;
    spec: string;
    labels: Record<CatalogFilterLocale, string>;
    sqlRegex: string;
}

export interface DynamicCategoryFacetChipItem extends DynamicCategoryFacetChipDef {
    label: string;
    count: number;
}

export interface DynamicCategoryFacetGroup {
    groupKey: CanonicalCategoryGroupKey;
    groupHeading: string;
    groupHeadings: Record<CatalogFilterLocale, string>;
    chips: DynamicCategoryFacetChipItem[];
}

export function resolveCanonicalCategoryGroupKey(category?: string): CanonicalCategoryGroupKey {
    const raw = (category || '').trim().toLowerCase();
    if (!raw || raw === 'visi' || raw === 'all') return 'all';
    if (raw.includes('radiator') || raw.includes('konvekt') || raw.includes('šildymo prietais')) {
        return 'radiators';
    }
    if (raw.includes('degikl')) {
        return 'burners';
    }
    if (
        raw.includes('katil') &&
        !raw.includes('automatik') &&
        !raw.includes('atsargin')
    ) {
        return 'boilers';
    }
    if (
        raw.includes('akumuliac') ||
        raw.includes('boiler') ||
        raw.includes('vandens šildytuv') ||
        raw.includes('plėtimosi') ||
        raw.includes('pletimosi') ||
        raw === 'expansion-tanks'
    ) {
        return 'tanks';
    }
    if (
        raw.includes('termostat') ||
        raw.includes('vožtuv') ||
        raw.includes('voztuv') ||
        raw.includes('balansin') ||
        raw.includes('oro atskyrikl')
    ) {
        return 'thermostatics';
    }
    if (raw.includes('grindin') || raw.includes('kolektor') || raw === 'collectors') {
        return 'underfloor';
    }
    if (
        raw.includes('atsargin') ||
        raw.includes('automatik') ||
        raw.includes('vamzdyn')
    ) {
        return 'spares';
    }
    return 'all';
}

export function shouldShowBoilerCompatibilityBar(
    category?: string,
    activeBoiler?: string,
): boolean {
    if (activeBoiler && activeBoiler.trim() && activeBoiler !== 'all' && activeBoiler !== 'visi') {
        return true;
    }
    const group = resolveCanonicalCategoryGroupKey(category);
    return group === 'all' || group === 'burners' || group === 'boilers' || group === 'spares';
}

export function getBoilerCompatibilityCounts(
    extraFilters: ListingFilters = {},
): Record<string, number> {
    const baseUnpaged = searchGilesSnapshotPaged({
        ...extraFilters,
        boiler: undefined,
        page: 1,
        pageSize: undefined,
    });
    const counts: Record<string, number> = {};
    for (const model of LITHUANIAN_BOILER_SYSTEM_MODELS) {
        counts[model.id] = filterProductsByBoilerCompatibility(baseUnpaged.items, model.id).length;
    }
    return counts;
}

export const DYNAMIC_CATEGORY_SUBCATEGORY_DEFINITIONS: Record<
    CanonicalCategoryGroupKey,
    DynamicCategorySubcategoryDef[]
> = {
    radiators: [
        {
            slug: 'all',
            labels: {
                lt: 'Visi radiatoriai ir konvektoriai',
                en: 'All radiators & convectors',
                pl: 'Wszystkie grzejniki i konwektory',
                ru: 'Все радиаторы и конвекторы',
            },
            sqlRegex: '.*',
        },
        {
            slug: 'plieniniai-soniniai',
            labels: {
                lt: 'Plieniniai radiatoriai (šoninis pajungimas Tipas 22 K)',
                en: 'Steel panel radiators (lateral connection Type 22 K)',
                pl: 'Grzejniki stalowe płytowe (podłączenie boczne Typ 22 K)',
                ru: 'Стальные панельные радиаторы (боковое подключение Тип 22 K)',
            },
            sqlRegex: '(22\\s*K\\b|GI-RAD-22K|šoninio pajungimo)',
        },
        {
            slug: 'plieniniai-apatiniai',
            labels: {
                lt: 'Plieniniai radiatoriai (apatinis pajungimas Tipas 22 VK)',
                en: 'Steel panel radiators (bottom connection Type 22 VK)',
                pl: 'Grzejniki stalowe płytowe (podłączenie dolne Typ 22 VK)',
                ru: 'Стальные панельные радиаторы (нижнее подключение Тип 22 VK)',
            },
            sqlRegex: '(22\\s*VK\\b|GI-RAD-22VK|apatinio pajungimo.*radiatorius)',
        },
        {
            slug: 'aliumininiai-sekcijiniai',
            labels: {
                lt: 'Aliumininiai sekcijiniai radiatoriai (Ferroli POL)',
                en: 'Sectional aluminum radiators (Ferroli POL)',
                pl: 'Grzejniki aluminiowe członowe (Ferroli POL)',
                ru: 'Алюминиевые секционные радиаторы (Ferroli POL)',
            },
            sqlRegex: '(Sekcijinis aliumininis|Aliuminio lydinio radiatorius|^POL[./-])',
        },
        {
            slug: 'konvektoriai',
            labels: {
                lt: 'Konvektoriai ir šildymo prietaisai',
                en: 'Convectors & fan-coil heating units',
                pl: 'Konwektory i klimakonwektory grzewcze',
                ru: 'Конвекторы и фанкойлы отопления',
            },
            sqlRegex: '(konvekt|fancoil|fan-coil|Top Fan|^190[567]-|^196[12]-|^50-004-110|^50-007-615|^50-003-620)',
        },
        {
            slug: 'radiatoriu-priedai',
            labels: {
                lt: 'Radiatorių montavimo komplektai, laikikliai ir aklės',
                en: 'Radiator mounting kits, brackets & plugs',
                pl: 'Zestawy montażowe grzejników, uchwyty i korki',
                ru: 'Монтажные комплекты радиаторов, кронштейны и заглушки',
            },
            sqlRegex: '(^GI-FERROLI|montavimo komplektas|kamščių ir perėjimų|Metalinis nipelis|Paranitine tarpinė|Metalinė aklė|Metalinis kamštis|Laikiklis aliuminiam)',
        },
        {
            slug: 'radiatoriu-termostatika',
            labels: {
                lt: 'Radiatorių vožtuvai, binokliai ir termogalvutės',
                en: 'Radiator valves, H-blocks & thermostatic heads',
                pl: 'Zawory grzejnikowe, bloki H i głowice termostatyczne',
                ru: 'Радиаторные клапаны, узлы нижнего подключения и термоголовки',
            },
            sqlRegex: '(Vekolux|Vekotec|Multilux|TRIM|RADITRIM|TRV-2|RVO-1|UNION|E-Z paskirstytojas|krypties keitiklis|Design-Edition|4002-|RA-N|De Luxe)',
        },
    ],
    boilers: [
        {
            slug: 'all',
            labels: {
                lt: 'Visi katilai ir šilumos siurbliai',
                en: 'All boilers & heat pumps',
                pl: 'Wszystkie kotły i pompy ciepła',
                ru: 'Все котлы и тепловые насосы',
            },
            sqlRegex: '.*',
        },
        {
            slug: 'silumos-siurbliai',
            labels: {
                lt: 'Šilumos siurbliai Oras–Vanduo (Haier R290 / R32)',
                en: 'Air-to-Water Heat Pumps (Haier R290 / R32)',
                pl: 'Pompy ciepła Powietrze–Woda (Haier R290 / R32)',
                ru: 'Тепловые насосы Воздух–Вода (Haier R290 / R32)',
            },
            sqlRegex: '(šilumos siurbl|silumos siurbl|Super Aqua|R290|AW0|ATW-|AU0|HU1|monoblok)',
        },
        {
            slug: 'granuliniai-katilai',
            labels: {
                lt: 'Granuliniai ir biokuro katilai',
                en: 'Pellet & biomass boilers',
                pl: 'Kotły pelletowe i na biomasę',
                ru: 'Пеллетные и биомассовые котлы',
            },
            sqlRegex: '(granul.*katil|biokur|Centrometal|Ponast|Verner A|PelTec|BioTec|CentroPelet)',
        },
        {
            slug: 'kieto-kuro-katilai',
            labels: {
                lt: 'Kieto kuro katilai',
                en: 'Solid fuel boilers',
                pl: 'Kotły na paliwo stałe',
                ru: 'Твердотопливные котлы',
            },
            sqlRegex: '(kieto kuro|malk|piroliz|Logano S111|Verner V|Thermostal PLB|Eko-CK|Bio-CK)',
        },
        {
            slug: 'elektriniai-katilai',
            labels: {
                lt: 'Elektriniai šildymo katilai (Haier ES)',
                en: 'Electric heating boilers (Haier ES)',
                pl: 'Kotły elektryczne (Haier ES)',
                ru: 'Электрические котлы отопления (Haier ES)',
            },
            sqlRegex: '(elektrin.*katil|elektrin.*šildymo|Vitotron|Tronic|E-Tech|tenas|kaitinimo)',
        },
        {
            slug: 'kondicionieriai',
            labels: {
                lt: 'Oro kondicionieriai – šilumos siurbliai (Nordic Split)',
                en: 'Air conditioners – heat pumps (Nordic Split)',
                pl: 'Klimatyzatory – pompy ciepła (Nordic Split)',
                ru: 'Кондиционеры – тепловые насосы (Nordic Split)',
            },
            sqlRegex: '(kondicionier|MRV|VRF|Split|Jade|Tundra|Flexis|Pearl|Revive|AS0|AS1|AD0|AB0|AC0|1U|2U|3U|4U|5U)',
        },
    ],
    burners: [
        {
            slug: 'all',
            labels: {
                lt: 'Visi granulių degikliai ir priedai',
                en: 'All pellet burners & accessories',
                pl: 'Wszystkie palniki pelletowe i akcesoria',
                ru: 'Все пеллетные горелки и принадлежности',
            },
            sqlRegex: '.*',
        },
        {
            slug: 'megatherm-mpb',
            labels: {
                lt: 'Megatherm MPB granulių degikliai',
                en: 'Megatherm MPB pellet burners',
                pl: 'Palniki pelletowe Megatherm MPB',
                ru: 'Пеллетные горелки Megatherm MPB',
            },
            sqlRegex: '(Megatherm|MPB|degkmpl)',
        },
        {
            slug: 'verner-ponast-thermostal',
            labels: {
                lt: 'Verner, Ponast ir Thermostal įranga',
                en: 'Verner, Ponast & Thermostal burner equipment',
                pl: 'Urządzenia Verner, Ponast i Thermostal',
                ru: 'Оборудование Verner, Ponast и Thermostal',
            },
            sqlRegex: '(Verner|Ponast|Thermostal|Pelltech|Centrometal.*degiklis|CPPL)',
        },
        {
            slug: 'bunkeriai-sraigtai',
            labels: {
                lt: 'Granulių bunkeriai ir padavimo sraigtai',
                en: 'Pellet hoppers & feed augers',
                pl: 'Zasobniki pelletu i podajniki ślimakowe',
                ru: 'Бункеры для пеллет и шнеки подачи',
            },
            sqlRegex: '(bunker|sraigt|talpa granul|CPSP|CPPT|CentroPelet)',
        },
        {
            slug: 'degikliu-automatika',
            labels: {
                lt: 'Degiklių valdikliai ir priedai',
                en: 'Burner controllers & accessories',
                pl: 'Sterowniki i akcesoria do palników',
                ru: 'Контроллеры и принадлежности горелок',
            },
            sqlRegex: '(valdikl|reguliavim|CPREG|tenas|purkštuk|išvalym|montavim|durel|turbulizat|jungtis)',
        },
    ],
    tanks: [
        {
            slug: 'all',
            labels: {
                lt: 'Visos akumuliacinės talpos ir boileriai',
                en: 'All buffer tanks & water heaters',
                pl: 'Wszystkie bufory ciepła i bojlery',
                ru: 'Все буферные емкости и бойлеры',
            },
            sqlRegex: '.*',
        },
        {
            slug: 'akumuliacines-talpos',
            labels: {
                lt: 'Akumuliacinės (buferinės) talpos (Gorenje ZV)',
                en: 'Buffer storage tanks (Gorenje ZV)',
                pl: 'Zbiorniki akumulacyjne / buforowe (Gorenje ZV)',
                ru: 'Аккумулирующие (буферные) емкости (Gorenje ZV)',
            },
            sqlRegex: '(akumuliacin|buferin|ZV\\s*\\d|CAS\\s|NAD|UKV)',
        },
        {
            slug: 'boileriai-kombinuoti',
            labels: {
                lt: 'Karšto vandens boileriai (netiesioginiai / kombinuoti)',
                en: 'DHW cylinders (indirect / combined)',
                pl: 'Bojlery CWU (pośrednie / kombinowane)',
                ru: 'Бойлеры косвенного и комбинированного нагрева',
            },
            sqlRegex: '(OKC\\b|OKCE\\b|Comboil|NTR|kombinuot|netiesiog|šilumokai|GV\\d)',
        },
        {
            slug: 'boileriai-su-ss',
            labels: {
                lt: 'Boileriai su šilumos siurbliu (Haier HP R290)',
                en: 'Heat pump water heaters (Haier HP R290)',
                pl: 'Bojlery z pompą ciepła (Haier HP R290)',
                ru: 'Бойлеры с тепловым насосом (Haier HP R290)',
            },
            sqlRegex: '(šilumos siurbl|HP\\d|R290|M5|M7|M8|Haier)',
        },
        {
            slug: 'elektriniai-boileriai',
            labels: {
                lt: 'Elektriniai vandens šildytuvai (Gorenje / Tiki)',
                en: 'Electric water heaters (Gorenje / Tiki)',
                pl: 'Elektryczne podgrzewacze wody (Gorenje / Tiki)',
                ru: 'Электрические водонагреватели (Gorenje / Tiki)',
            },
            sqlRegex: '(elektrinis vandens|OKHE|OKCEV|TGR|GT\\s*\\d|ES\\d+V|Gorenje)',
        },
        {
            slug: 'pletimosi-indai',
            labels: {
                lt: 'Pletimosi indai ir membraniniai bakai (Pneumatex)',
                en: 'Expansion vessels & membrane tanks (Pneumatex)',
                pl: 'Naczynia wzbiorcze i przeponowe (Pneumatex)',
                ru: 'Расширительные баки и мембранные емкости (Pneumatex)',
            },
            sqlRegex: '(plėtimosi|pletimosi|Statico|Aquapresso|Zilmet|membran|Pneumatex)',
        },
    ],
    thermostatics: [
        {
            slug: 'all',
            labels: {
                lt: 'Visa termostatika ir vožtuvai',
                en: 'All thermostatics & valves',
                pl: 'Cała termostatyka i zawory',
                ru: 'Вся термостатика и клапаны',
            },
            sqlRegex: '.*',
        },
        {
            slug: 'termostatiniai-voztuvai',
            labels: {
                lt: 'Termostatiniai radiatorių vožtuvai (RA-N / Eclipse)',
                en: 'Thermostatic radiator valves (RA-N / Eclipse)',
                pl: 'Zawory termostatyczne grzejnikowe (RA-N / Eclipse)',
                ru: 'Термостатические радиаторные клапаны (RA-N / Eclipse)',
            },
            sqlRegex: '(RA-N|RA-DV|Eclipse|V-exact|Calypso|termostatinis vožtuv|termostatinis voztuv|013G0|393|2244-|9175-)',
        },
        {
            slug: 'termogalvutes',
            labels: {
                lt: 'Termostatinės galvutės (Aero / K / elektroninės)',
                en: 'Thermostatic heads (Aero / K / electronic)',
                pl: 'Głowice termostatyczne (Aero / K / elektroniczne)',
                ru: 'Термостатические головки (Aero / K / электронные)',
            },
            sqlRegex: '(galvut|Aero|RA 2000|Redia|K-galvut|DX|Mistral|013G2|013G5|6000-|7002-|9724-)',
        },
        {
            slug: 'apatinio-pajungimo-mazgai',
            labels: {
                lt: 'Apatinio pajungimo mazgai (Vekolux / H-blokai)',
                en: 'Bottom connection H-blocks (Vekolux / Multilux)',
                pl: 'Zestawy przyłączeniowe dolne (Vekolux / bloki H)',
                ru: 'Узлы нижнего подключения (Vekolux / H-блоки)',
            },
            sqlRegex: '(Vekolux|Multilux|Raditec|RLV|Regulux|H-blok|0382-|053)',
        },
        {
            slug: 'balansiniai-voztuvai',
            labels: {
                lt: 'Balansiniai ir reguliavimo vožtuvai (IMI TA)',
                en: 'Balancing & control valves (IMI TA)',
                pl: 'Zawory równoważące i regulacyjne (IMI TA)',
                ru: 'Балансировочные и регулирующие клапаны (IMI TA)',
            },
            sqlRegex: '(STAD|STAF|TBV|TA-Modulator|TA-Compact|ASV|AB-QM|Leno|MSV|balans|52-|IMI TA)',
        },
        {
            slug: 'oro-ir-purvo-separatoriai',
            labels: {
                lt: 'Oro nuorintojai ir purvo separatoriai (Zeparo)',
                en: 'Air vents & dirt separators (Zeparo)',
                pl: 'Odpowietrzniki i separatory zanieczyszczeń (Zeparo)',
                ru: 'Воздухоотводчики и сепараторы шлама (Zeparo)',
            },
            sqlRegex: '(Zeparo|nuorint|separator|atskyrikl|purv|filtr|helistill)',
        },
        {
            slug: 'pamaisymo-ir-apsaugos',
            labels: {
                lt: 'Pamaišymo vožtuvai, pavaros ir apsaugos grupės',
                en: 'Mixing valves, actuators & safety groups',
                pl: 'Zawory mieszające, siłowniki i grupy bezpieczeństwa',
                ru: 'Смесительные клапаны, приводы и группы безопасности',
            },
            sqlRegex: '(maišymo|maisymo|TA Mix|trieig|ketureig|apsaug|diferencin|Hydrolux|slėgio|pavar|AVTB|VG)',
        },
    ],
    underfloor: [
        {
            slug: 'all',
            labels: {
                lt: 'Visas grindinis šildymas',
                en: 'All underfloor heating',
                pl: 'Całe ogrzewanie podłogowe',
                ru: 'Весь теплый пол',
            },
            sqlRegex: '.*',
        },
        {
            slug: 'kolektoriai-spinteles',
            labels: {
                lt: 'Kolektoriai ir spintelės (2–12 kontūrų)',
                en: 'Manifolds & cabinets (2–12 loops)',
                pl: 'Rozdzielacze i szafki (2–12 obwodów)',
                ru: 'Коллекторы и шкафы (2–12 контуров)',
            },
            sqlRegex: '(kolektor|Dynacon|Dynalux|Multibox|spintel|dėžut|FHM|šakotuv)',
        },
        {
            slug: 'pavaros-termostatai',
            labels: {
                lt: 'Termoelektrinės pavaros ir kambario termostatai',
                en: 'Thermal actuators & room thermostats',
                pl: 'Siłowniki termoelektryczne i termostaty pokojowe',
                ru: 'Термоэлектрические приводы и комнатные термостаты',
            },
            sqlRegex: '(pavar|termostat|valdikl|modul|EMO|TWA|Icon|230V|24V|RTL|AFC)',
        },
        {
            slug: 'vamzdziai-jungtys',
            labels: {
                lt: 'Daugiasluoksniai / PEX vamzdžiai ir presuojamos jungtys',
                en: 'Multilayer / PEX pipes & press fittings',
                pl: 'Rury wielowarstwowe / PEX i złączki zaprasowywane',
                ru: 'Многослойные / PEX трубы и пресс-фитинги',
            },
            sqlRegex: '(vamzd|jungt|eurokonus|kanalas|alkūn|adapter|antgal|srieg|PEX|Comisa|16|20)',
        },
    ],
    spares: [
        {
            slug: 'all',
            labels: {
                lt: 'Visos atsarginės dalys',
                en: 'All spare parts',
                pl: 'Wszystkie części zamienne',
                ru: 'Все запасные части',
            },
            sqlRegex: '.*',
        },
        {
            slug: 'uzdegimo-tenai',
            labels: {
                lt: 'Uždegimo elementai (keraminiai ir metaliniai tenai)',
                en: 'Ignition elements (ceramic & metal igniters)',
                pl: 'Zapalarki (ceramiczne i metalowe)',
                ru: 'ТЭНы розжига (керамические и металлические)',
            },
            sqlRegex: '(tenas|uždegim|uzdegim|keramin|kvarc|KatGr|KatM|KatF|EGIP-GLI)',
        },
        {
            slug: 'ardeliai-kamera',
            labels: {
                lt: 'Ardeliai, degiklio žiedai ir kameros dalys',
                en: 'Grates, burner rings & chamber parts',
                pl: 'Ruszty, pierścienie palnika i części komory',
                ru: 'Колосники, кольца горелки и детали камеры',
            },
            sqlRegex: '(ardel|degikl|kamer|durel|CPDV|CPPL|purkštuk|turbulizat|šlak)',
        },
        {
            slug: 'davikliai-termostatai',
            labels: {
                lt: 'Davikliai, STB termostatai ir fotodiodai',
                en: 'Sensors, STB thermostats & photodiodes',
                pl: 'Czujniki, termostaty STB i fotodiody',
                ru: 'Датчики, термостаты STB и фотодиоды',
            },
            sqlRegex: '(davikl|jutikl|termostat|STB|fotodiod|valdikl|automatik|reguliator|zond)',
        },
        {
            slug: 'ventiliatoriai-pavaros',
            labels: {
                lt: 'Ventiliatoriai, reduktoriai ir varikliai',
                en: 'Fans, gearboxes & drive motors',
                pl: 'Wentylatory, motoreduktory i silniki',
                ru: 'Вентиляторы, редукторы и приводы',
            },
            sqlRegex: '(ventiliator|pavar|reduktor|varikl|sraigt|EMO|ABN|AMV|ARA)',
        },
        {
            slug: 'tarpines-boileriu-dalys',
            labels: {
                lt: 'Tarpinės, anodai ir kitos atsarginės dalys',
                en: 'Gaskets, anodes & fitting spare parts',
                pl: 'Uszczelki, anody i pozostałe części zamienne',
                ru: 'Прокладки, аноды и прочие запчасти',
            },
            sqlRegex: '(tarpin|anod|jungt|izoliac|alkūn|redukc|mova|trišak|nipelis|veržl|flanš)',
        },
    ],
    all: [
        {
            slug: 'all',
            labels: {
                lt: 'Visos prekės',
                en: 'All products',
                pl: 'Wszystkie produkty',
                ru: 'Все товары',
            },
            sqlRegex: '.*',
        },
        {
            slug: 'megatherm-mpb',
            labels: {
                lt: 'Megatherm MPB granulių degikliai',
                en: 'Megatherm MPB pellet burners',
                pl: 'Palniki pelletowe Megatherm MPB',
                ru: 'Пеллетные горелки Megatherm MPB',
            },
            sqlRegex: '(Megatherm|MPB|degkmpl)',
        },
        {
            slug: 'silumos-siurbliai',
            labels: {
                lt: 'Šilumos siurbliai Oras–Vanduo (Haier R290 / R32)',
                en: 'Air-to-Water Heat Pumps (Haier R290 / R32)',
                pl: 'Pompy ciepła Powietrze–Woda (Haier R290 / R32)',
                ru: 'Тепловые насосы Воздух–Вода (Haier R290 / R32)',
            },
            sqlRegex: '(šilumos siurbl|silumos siurbl|Super Aqua|R290|AW0|ATW-)',
        },
        {
            slug: 'plieniniai-soniniai',
            labels: {
                lt: 'Plieniniai radiatoriai (Tipas 22 K / VK)',
                en: 'Steel panel radiators (Type 22 K / VK)',
                pl: 'Grzejniki stalowe płytowe (Typ 22 K / VK)',
                ru: 'Стальные панельные радиаторы (Тип 22 K / VK)',
            },
            sqlRegex: '(GI-RAD-22|Plieninis plokštinis radiatorius)',
        },
        {
            slug: 'aliumininiai-sekcijiniai',
            labels: {
                lt: 'Aliumininiai sekcijiniai radiatoriai (Ferroli POL)',
                en: 'Sectional aluminum radiators (Ferroli POL)',
                pl: 'Grzejniki aluminiowe członowe (Ferroli POL)',
                ru: 'Алюминиевые секционные радиаторы (Ferroli POL)',
            },
            sqlRegex: '(Sekcijinis aliumininis|Aliuminio lydinio radiatorius|^POL[./-])',
        },
        {
            slug: 'konvektoriai',
            labels: {
                lt: 'Konvektoriai ir šildymo prietaisai',
                en: 'Convectors & fan-coil heating units',
                pl: 'Konwektory i klimakonwektory grzewcze',
                ru: 'Конвекторы и фанкойлы отопления',
            },
            sqlRegex: '(konvekt|fancoil|fan-coil|Top Fan|^190[567]-|^196[12]-|^50-004-110|^50-007-615|^50-003-620)',
        },
        {
            slug: 'kolektoriai-spinteles',
            labels: {
                lt: 'Kolektoriai ir spintelės (2–12 kontūrų)',
                en: 'Manifolds & cabinets (2–12 loops)',
                pl: 'Rozdzielacze i szafki (2–12 obwodów)',
                ru: 'Коллекторы и шкафы (2–12 контуров)',
            },
            sqlRegex: '(kolektor|Dynacon|Dynalux|Multibox)',
        },
        {
            slug: 'uzdegimo-tenai',
            labels: {
                lt: 'Uždegimo elementai (keraminiai ir metaliniai tenai)',
                en: 'Ignition elements (ceramic & metal igniters)',
                pl: 'Zapalarki (ceramiczne i metalowe)',
                ru: 'ТЭНы розжига (керамические и металлические)',
            },
            sqlRegex: '(tenas|uždegim|uzdegim|keramin|kvarc|KatGr|KatM|KatF|EGIP-GLI)',
        },
    ],
};

export const DYNAMIC_CATEGORY_FACET_DEFINITIONS: Record<
    CanonicalCategoryGroupKey,
    {
        groupHeadings: Record<CatalogFilterLocale, string>;
        chips: DynamicCategoryFacetChipDef[];
    }
> = {
    radiators: {
        groupHeadings: {
            lt: 'Radiatoriaus pajungimas ir matmenys',
            en: 'Radiator connection & dimensions',
            pl: 'Podłączenie i wymiary grzejnika',
            ru: 'Подключение и размеры радиатора',
        },
        chips: [
            {
                key: 'soninis-k-dn15',
                spec: 'soninis-k-dn15',
                labels: {
                    lt: 'Šoninis pajungimas (K / DN15)',
                    en: 'Lateral connection (K / DN15)',
                    pl: 'Podłączenie boczne (K / DN15)',
                    ru: 'Боковое подключение (K / DN15)',
                },
                sqlRegex: '(22\\s*K\\b|GI-RAD-22K|šoninio|DN15|G1/2|Rp1/2)',
            },
            {
                key: 'apatinis-vk-50mm',
                spec: 'apatinis-vk-50mm',
                labels: {
                    lt: 'Apatinis pajungimas (VK 50 mm)',
                    en: 'Bottom connection (VK 50 mm)',
                    pl: 'Podłączenie dolne (VK 50 mm)',
                    ru: 'Нижнее подключение (VK 50 мм)',
                },
                sqlRegex: '(22\\s*VK\\b|GI-RAD-22VK|apatinio|50\\s*mm|Vekolux|Vekotec|Multilux)',
            },
            {
                key: 'aukstis-350',
                spec: 'aukstis-350',
                labels: {
                    lt: 'Aukštis 350 mm',
                    en: 'Height 350 mm',
                    pl: 'Wysokość 350 mm',
                    ru: 'Высота 350 мм',
                },
                sqlRegex: '(350\\s*mm|POL\\./80-350|POL\\./80-300|POL 350)',
            },
            {
                key: 'aukstis-500',
                spec: 'aukstis-500',
                labels: {
                    lt: 'Aukštis 500 mm',
                    en: 'Height 500 mm',
                    pl: 'Wysokość 500 mm',
                    ru: 'Высота 500 мм',
                },
                sqlRegex: '(500\\s*mm|500×|GI-RAD-22V?K-500|POL-500|POL\\./80-500)',
            },
            {
                key: 'aukstis-600',
                spec: 'aukstis-600',
                labels: {
                    lt: 'Aukštis 600 mm',
                    en: 'Height 600 mm',
                    pl: 'Wysokość 600 mm',
                    ru: 'Высота 600 мм',
                },
                sqlRegex: '(600\\s*mm|600×|GI-RAD-22V?K-600|POL\\./80-600|POL 600)',
            },
            {
                key: 'aukstis-800',
                spec: 'aukstis-800',
                labels: {
                    lt: 'Aukštis 800 mm',
                    en: 'Height 800 mm',
                    pl: 'Wysokość 800 mm',
                    ru: 'Высота 800 мм',
                },
                sqlRegex: '(800\\s*mm|POL\\./80-800|POL 800|POL\\./80-700)',
            },
            {
                key: 'ilgis-600-1000',
                spec: 'ilgis-600-1000',
                labels: {
                    lt: 'Ilgis 600–1000 mm',
                    en: 'Length 600–1000 mm',
                    pl: 'Długość 600–1000 mm',
                    ru: 'Длина 600–1000 мм',
                },
                sqlRegex: '(×(600|800|1000)\\s*mm|L=(480|640|800|960)\\s*mm|-(600|800|1000)$)',
            },
            {
                key: 'ilgis-1200-1600',
                spec: 'ilgis-1200-1600',
                labels: {
                    lt: 'Ilgis 1200–1600 mm',
                    en: 'Length 1200–1600 mm',
                    pl: 'Długość 1200–1600 mm',
                    ru: 'Длина 1200–1600 мм',
                },
                sqlRegex: '(×(1200|1400|1600)\\s*mm|-(1200|1400|1600)$)',
            },
        ],
    },
    tanks: {
        groupHeadings: {
            lt: 'Talpos tūris ir tipas',
            en: 'Tank volume & type',
            pl: 'Pojemność i typ zbiornika',
            ru: 'Объем и тип емкости',
        },
        chips: [
            {
                key: 'iki-100l',
                spec: 'iki-100l',
                labels: {
                    lt: 'Iki 100 L',
                    en: 'Up to 100 L',
                    pl: 'Do 100 L',
                    ru: 'До 100 л',
                },
                sqlRegex: '(\\b(5|8|10|12|15|18|25|30|35|50|80|100)\\s*(L|l|ltr)\\b|ES(10|15|30|50|80)V|OKHE\\s*(80|100)|OKCE?V?\\s*100|GT\\s*(5|10|15)|TGR\\s*(30|50|80|100))',
            },
            {
                key: '100-200l',
                spec: '100-200l',
                labels: {
                    lt: '100–200 L',
                    en: '100–200 L',
                    pl: '100–200 L',
                    ru: '100–200 л',
                },
                sqlRegex: '(\\b(100|120|125|140|150|160|200)\\s*(L|l|ltr)\\b|OKCE?\\s*(125|160|200)|ZV\\s*(150|200)|GV120|GV200|100|150|200)',
            },
            {
                key: '200-500l',
                spec: '200-500l',
                labels: {
                    lt: '200–500 L',
                    en: '200–500 L',
                    pl: '200–500 L',
                    ru: '200–500 л',
                },
                sqlRegex: '(\\b(200|250|300|400|500)\\s*(L|l|ltr)\\b|OKCE?\\s*(250|300|400|500)|ZV\\s*(200|300|500)|300|400|500)',
            },
            {
                key: 'virs-500l',
                spec: 'virs-500l',
                labels: {
                    lt: 'Virš 500 L',
                    en: 'Over 500 L',
                    pl: 'Powyżej 500 L',
                    ru: 'Свыше 500 л',
                },
                sqlRegex: '(\\b(600|750|800|1000|1500|2000)\\s*(L|l|ltr)\\b|CAS\\s*(501|801|1001)|NAD|ZV\\s*1000|600|800|1000)',
            },
            {
                key: 'r290-ss',
                spec: 'r290-ss',
                labels: {
                    lt: 'R290 su šilumos siurbliu',
                    en: 'R290 with heat pump',
                    pl: 'R290 z pompą ciepła',
                    ru: 'R290 с тепловым насосом',
                },
                sqlRegex: '(R290|šilumos siurbl|HP|M5|M7|M8|Haier)',
            },
            {
                key: 'akumuliacine-zv',
                spec: 'akumuliacine-zv',
                labels: {
                    lt: 'Akumuliacinė ZV',
                    en: 'Buffer tank ZV',
                    pl: 'Bufor ZV',
                    ru: 'Буферная емкость ZV',
                },
                sqlRegex: '(ZV|akumuliacin|buferin|CAS)',
            },
        ],
    },
    underfloor: {
        groupHeadings: {
            lt: 'Kontūrų skaičius ir diametras',
            en: 'Loop count & pipe diameter',
            pl: 'Liczba obwodów i średnica',
            ru: 'Количество контуров и диаметр',
        },
        chips: [
            {
                key: '2-6-konturai',
                spec: '2-6-konturai',
                labels: {
                    lt: '2–6 kontūrai',
                    en: '2–6 loops',
                    pl: '2–6 obwodów',
                    ru: '2–6 контуров',
                },
                sqlRegex: '(\\b([23456])\\s*(žied|atšak|kontūr|zied|atsak)|\\(([23456])\\)|0[23456]\\b|[23456]\\+[23456])',
            },
            {
                key: '7-12-konturu',
                spec: '7-12-konturu',
                labels: {
                    lt: '7–12 kontūrų',
                    en: '7–12 loops',
                    pl: '7–12 obwodów',
                    ru: '7–12 контуров',
                },
                sqlRegex: '(\\b(7|8|9|10|11|12)\\s*(žied|atšak|kontūr|zied|atsak)|\\((7|8|9|10|11|12)\\)|(7|8|9|10|11|12)\\+(7|8|9|10|11|12)|-(07|08|09|10|11|12)\\.)',
            },
            {
                key: '16-20-vamzdziai',
                spec: '16-20-vamzdziai',
                labels: {
                    lt: '16 mm / 20 mm vamzdžiai',
                    en: '16 mm / 20 mm pipes',
                    pl: 'Rury 16 mm / 20 mm',
                    ru: 'Трубы 16 мм / 20 мм',
                },
                sqlRegex: '(16|20|G3/4|eurokonus|vamzd|kanalas|PEX)',
            },
            {
                key: '230v-24v-pavaros',
                spec: '230v-24v-pavaros',
                labels: {
                    lt: '230V / 24V pavaros',
                    en: '230V / 24V actuators',
                    pl: 'Siłowniki 230V / 24V',
                    ru: 'Приводы 230В / 24В',
                },
                sqlRegex: '(230\\s*V|24\\s*V|pavar|EMO|modulis|termostat)',
            },
            {
                key: 'm30x1-5',
                spec: 'm30x1-5',
                labels: {
                    lt: 'M30×1,5',
                    en: 'M30×1.5',
                    pl: 'M30×1,5',
                    ru: 'M30×1,5',
                },
                sqlRegex: '(M30|Heimeier|Dynacon|Dynalux|Multibox|HERZ)',
            },
        ],
    },
    thermostatics: {
        groupHeadings: {
            lt: 'Sriegis, DN ir jungtis',
            en: 'Thread, DN & connection',
            pl: 'Gwint, DN i przyłącze',
            ru: 'Резьба, DN и соединение',
        },
        chips: [
            {
                key: 'DN15',
                spec: 'DN15',
                labels: { lt: 'DN15 (1/2")', en: 'DN15 (1/2")', pl: 'DN15 (1/2")', ru: 'DN15 (1/2")' },
                sqlRegex: '(dn\\s*15|1/2"|g\\s*1/2|r\\s*1/2|52-151-014|3933-02|013g0013)',
            },
            {
                key: 'DN20',
                spec: 'DN20',
                labels: { lt: 'DN20 (3/4")', en: 'DN20 (3/4")', pl: 'DN20 (3/4")', ru: 'DN20 (3/4")' },
                sqlRegex: '(dn\\s*20|3/4"|g\\s*3/4|r\\s*3/4|52-151-020|3933-03)',
            },
            {
                key: 'DN25',
                spec: 'DN25',
                labels: { lt: 'DN25 (1")', en: 'DN25 (1")', pl: 'DN25 (1")', ru: 'DN25 (1")' },
                sqlRegex: '(dn\\s*25|\\b1"|g\\s*1\\b|52-151-025)',
            },
            {
                key: 'M30x1.5',
                spec: 'M30x1.5',
                labels: { lt: 'M30×1,5', en: 'M30×1.5', pl: 'M30×1,5', ru: 'M30×1,5' },
                sqlRegex: '(m30|30\\s*x\\s*1[,.]5|heimeier|eclipse|emo|dynacon|6000-|3712-|3933-|1833-)',
            },
            {
                key: 'RA-Click',
                spec: 'RA-Click',
                labels: { lt: 'RA Click', en: 'RA Click', pl: 'RA Click', ru: 'RA Click' },
                sqlRegex: '(ra\\s*click|ra-n|ra-dv|ra\\s*2000|redia|23\\s*mm|013g)',
            },
        ],
    },
    boilers: {
        groupHeadings: {
            lt: 'Galia ir šilumos šaltinis',
            en: 'Power & heat source',
            pl: 'Moc i źródło ciepła',
            ru: 'Мощность и источник тепла',
        },
        chips: [
            {
                key: 'iki-10kw',
                spec: 'iki-10kw',
                labels: { lt: 'iki 10 kW', en: 'up to 10 kW', pl: 'do 10 kW', ru: 'до 10 кВт' },
                sqlRegex: '(\\b([23456789]|10)([.,]\\d+)?\\s*kW|AW0[468]|ATW-A0)',
            },
            {
                key: '12-25kw',
                spec: '12-25kw',
                labels: { lt: '12–25 kW', en: '12–25 kW', pl: '12–25 kW', ru: '12–25 кВт' },
                sqlRegex: '(\\b(1[2-9]|2[0-5])([.,]\\d+)?\\s*kW|25\\s*kW|AW1[246])',
            },
            {
                key: 'virs-30kw',
                spec: 'virs-30kw',
                labels: { lt: 'virš 30 kW', en: 'over 30 kW', pl: 'powyżej 30 kW', ru: 'свыше 30 кВт' },
                sqlRegex: '(\\b([3-9]\\d|\\d{3})\\s*kW|48\\s*kW|50\\s*kW)',
            },
            {
                key: 'r290-propanas',
                spec: 'r290-propanas',
                labels: { lt: 'R290 (propanas)', en: 'R290 (propane)', pl: 'R290 (propan)', ru: 'R290 (пропан)' },
                sqlRegex: '(R290|Super Aqua)',
            },
            {
                key: 'r32-split',
                spec: 'r32-split',
                labels: { lt: 'R32 Split / VRF', en: 'R32 Split / VRF', pl: 'R32 Split / VRF', ru: 'R32 Split / VRF' },
                sqlRegex: '(R32|MRV|Split)',
            },
        ],
    },
    burners: {
        groupHeadings: {
            lt: 'Degiklio galia ir tipas',
            en: 'Burner power & type',
            pl: 'Moc i typ palnika',
            ru: 'Мощность и тип горелки',
        },
        chips: [
            {
                key: 'iki-35kw',
                spec: 'iki-35kw',
                labels: { lt: '8–35 kW', en: '8–35 kW', pl: '8–35 kW', ru: '8–35 кВт' },
                sqlRegex: '(35\\s*kW|NANI 35|20\\s*kW|14-35|CPPL 14|CPPL 20-35)',
            },
            {
                key: '35-100kw',
                spec: '35-100kw',
                labels: { lt: '40–100 kW', en: '40–100 kW', pl: '40–100 kW', ru: '40–100 кВт' },
                sqlRegex: '(50\\s*kW|80\\s*kW|NANI 50|MPB 80|40/50|CPPL 90)',
            },
            {
                key: 'virs-100kw',
                spec: 'virs-100kw',
                labels: { lt: '150–300 kW', en: '150–300 kW', pl: '150–300 kW', ru: '150–300 кВт' },
                sqlRegex: '(150|300|MPB 150|MPB 300|CentroPelet)',
            },
            {
                key: 'su-sraigtu',
                spec: 'su-sraigtu',
                labels: { lt: 'Su padavimo sraigtu', en: 'With feed auger', pl: 'Z podajnikiem ślimakowym', ru: 'Со шнеком подачи' },
                sqlRegex: '(sraigt|CPPT|komplektas)',
            },
        ],
    },
    spares: {
        groupHeadings: {
            lt: 'Atsarginės dalies parametras',
            en: 'Spare part parameter',
            pl: 'Parametr części zamiennej',
            ru: 'Параметр запчасти',
        },
        chips: [
            {
                key: 'tenas-3-8',
                spec: 'tenas-3-8',
                labels: { lt: '3/8" uždegimo tenas', en: '3/8" igniter', pl: 'Zapalarka 3/8"', ru: 'ТЭН розжига 3/8"' },
                sqlRegex: '(tenas|3/8|KatGr|KatM|KatF|EGIP-GLI)',
            },
            {
                key: '230v-pavara',
                spec: '230v-pavara',
                labels: { lt: '230V pavara / valdiklis', en: '230V actuator / controller', pl: 'Siłownik / sterownik 230V', ru: 'Привод / контроллер 230В' },
                sqlRegex: '(230\\s*V|230v|pavar|EMO|ABN)',
            },
            {
                key: 'DN15',
                spec: 'DN15',
                labels: { lt: 'DN15 (1/2")', en: 'DN15 (1/2")', pl: 'DN15 (1/2")', ru: 'DN15 (1/2")' },
                sqlRegex: '(dn\\s*15|1/2"|g\\s*1/2)',
            },
            {
                key: 'DN20',
                spec: 'DN20',
                labels: { lt: 'DN20 (3/4")', en: 'DN20 (3/4")', pl: 'DN20 (3/4")', ru: 'DN20 (3/4")' },
                sqlRegex: '(dn\\s*20|3/4"|g\\s*3/4)',
            },
            {
                key: 'DN25',
                spec: 'DN25',
                labels: { lt: 'DN25 (1")', en: 'DN25 (1")', pl: 'DN25 (1")', ru: 'DN25 (1")' },
                sqlRegex: '(dn\\s*25|\\b1")',
            },
        ],
    },
    all: {
        groupHeadings: {
            lt: 'Galia ir parametras',
            en: 'Power & technical spec',
            pl: 'Moc i parametr',
            ru: 'Мощность и параметр',
        },
        chips: [
            {
                key: 'iki-35kw',
                spec: 'iki-35kw',
                labels: { lt: 'iki 35 kW', en: 'up to 35 kW', pl: 'do 35 kW', ru: 'до 35 кВт' },
                sqlRegex: '(25\\s*kW|35\\s*kW|NANI 35)',
            },
            {
                key: '35-100kw',
                spec: '35-100kw',
                labels: { lt: '35–100 kW', en: '35–100 kW', pl: '35–100 kW', ru: '35–100 кВт' },
                sqlRegex: '(50\\s*kW|80\\s*kW|NANI 50)',
            },
            {
                key: 'virs-100kw',
                spec: 'virs-100kw',
                labels: { lt: 'virš 100 kW', en: 'over 100 kW', pl: 'powyżej 100 kW', ru: 'свыше 100 кВт' },
                sqlRegex: '(150\\s*kW|300\\s*kW|MPB 150)',
            },
            {
                key: 'DN15',
                spec: 'DN15',
                labels: { lt: 'DN15', en: 'DN15', pl: 'DN15', ru: 'DN15' },
                sqlRegex: '(dn\\s*15|1/2"|g\\s*1/2|r\\s*1/2|52-151-014|3933-02|013g0013)',
            },
            {
                key: 'DN20',
                spec: 'DN20',
                labels: { lt: 'DN20', en: 'DN20', pl: 'DN20', ru: 'DN20' },
                sqlRegex: '(dn\\s*20|3/4"|g\\s*3/4|r\\s*3/4|52-151-020|3933-03)',
            },
            {
                key: 'DN25',
                spec: 'DN25',
                labels: { lt: 'DN25', en: 'DN25', pl: 'DN25', ru: 'DN25' },
                sqlRegex: '(dn\\s*25|\\b1"|g\\s*1\\b|52-151-025)',
            },
            {
                key: 'M30x1.5',
                spec: 'M30x1.5',
                labels: { lt: 'M30×1,5', en: 'M30×1.5', pl: 'M30×1,5', ru: 'M30×1,5' },
                sqlRegex: '(m30|30\\s*x\\s*1[,.]5|heimeier|eclipse|emo|dynacon|6000-|3712-|3933-|1833-)',
            },
            {
                key: 'RA-Click',
                spec: 'RA-Click',
                labels: { lt: 'RA Click', en: 'RA Click', pl: 'RA Click', ru: 'RA Click' },
                sqlRegex: '(ra\\s*click|ra-n|ra-dv|ra\\s*2000|redia|23\\s*mm|013g)',
            },
        ],
    },
};

export function resolveCatalogSubcategoryRegex(category?: string, subInput?: string): string {
    const subLower = (subInput || '').trim().toLowerCase();
    if (!subLower || subLower === 'all') return '.*';

    const groupKey = resolveCanonicalCategoryGroupKey(category);
    const groupDefs = DYNAMIC_CATEGORY_SUBCATEGORY_DEFINITIONS[groupKey] || [];
    const direct = groupDefs.find((d) => d.slug.toLowerCase() === subLower);
    if (direct) return direct.sqlRegex;

    for (const list of Object.values(DYNAMIC_CATEGORY_SUBCATEGORY_DEFINITIONS)) {
        const found = list.find((d) => d.slug.toLowerCase() === subLower);
        if (found) return found.sqlRegex;
    }

    const legacy = CATALOG_SUBTYPE_OPTIONS.find((o) => o.key.toLowerCase() === subLower);
    if (legacy) return legacy.sqlRegex;

    return subInput || '.*';
}

export function resolveCatalogSpecRegex(category?: string, specInput?: string): string {
    const specLower = (specInput || '').trim().toLowerCase();
    if (!specLower) return '.*';

    const groupKey = resolveCanonicalCategoryGroupKey(category);
    const groupChips = DYNAMIC_CATEGORY_FACET_DEFINITIONS[groupKey]?.chips || [];
    const direct = groupChips.find(
        (c) =>
            c.key.toLowerCase() === specLower ||
            c.spec.toLowerCase() === specLower ||
            c.labels.lt.toLowerCase() === specLower,
    );
    if (direct) return direct.sqlRegex;

    for (const group of Object.values(DYNAMIC_CATEGORY_FACET_DEFINITIONS)) {
        const found = group.chips.find(
            (c) =>
                c.key.toLowerCase() === specLower ||
                c.spec.toLowerCase() === specLower ||
                c.labels.lt.toLowerCase() === specLower,
        );
        if (found) return found.sqlRegex;
    }

    const legacy = CATALOG_SPEC_OPTIONS.find(
        (o) =>
            o.key.toLowerCase() === specLower ||
            o.label.toLowerCase() === specLower ||
            o.key.toLowerCase().replace(/[^a-z0-9]/g, '-') === specLower.replace(/[^a-z0-9]/g, '-'),
    );
    if (legacy) return legacy.sqlRegex;

    return specInput || '.*';
}

export function getDynamicCategorySubcategories(
    filters: ListingFilters = {},
    locale: CatalogFilterLocale = 'lt',
): DynamicCategorySubcategoryItem[] {
    const groupKey = resolveCanonicalCategoryGroupKey(filters.category ?? filters.categoryId);
    const defs = DYNAMIC_CATEGORY_SUBCATEGORY_DEFINITIONS[groupKey] || DYNAMIC_CATEGORY_SUBCATEGORY_DEFINITIONS.all;
    const baseFilters: ListingFilters = {
        ...filters,
        sub: undefined,
        subtype: undefined,
        page: 1,
        pageSize: undefined,
    };
    const baseItems = filterProductsByBoilerCompatibility(
        searchGilesSnapshotPaged(baseFilters).items,
        filters.boiler,
    );
    const baseTotal = baseItems.length;

    const result: DynamicCategorySubcategoryItem[] = [];
    for (const def of defs) {
        if (def.slug === 'all') {
            result.push({
                ...def,
                label: def.labels[locale] || def.labels.lt,
                count: baseTotal,
            });
            continue;
        }
        const subItems = filterProductsByBoilerCompatibility(
            searchGilesSnapshotPaged({
                ...baseFilters,
                sub: def.slug,
            }).items,
            filters.boiler,
        );
        const subCount = subItems.length;
        if (subCount > 0) {
            result.push({
                ...def,
                label: def.labels[locale] || def.labels.lt,
                count: subCount,
            });
        }
    }
    return result;
}

export function getDynamicCatalogBrands(
    filters: ListingFilters = {},
): Array<{
    id: string;
    name: string;
    slug: string;
    count: number;
    productCount: number;
    isVerified: boolean;
}> {
    const scopedFilters: ListingFilters = {
        ...filters,
        brand: undefined,
        brandId: undefined,
        page: 1,
        pageSize: undefined,
    };
    const items = filterProductsByBoilerCompatibility(
        searchGilesSnapshotPaged(scopedFilters).items,
        filters.boiler,
    );
    const bySlug = new Map<
        string,
        { id: string; name: string; slug: string; count: number; isVerified: boolean }
    >();

    for (const p of items) {
        const bName = (p.brandName || 'Gilės Inžinerija').trim();
        const slug = toBrandSlug(bName);
        if (!slug || slug === 'generic-brand') continue;
        const existing = bySlug.get(slug);
        if (existing) {
            existing.count++;
        } else {
            const dirEntry = CATALOG_ACTIVE_BRAND_DIRECTORY.find((d) => d.slug === slug);
            bySlug.set(slug, {
                id: dirEntry?.id || slug,
                name: dirEntry?.name || bName,
                slug,
                count: 1,
                isVerified: true,
            });
        }
    }

    return Array.from(bySlug.values())
        .filter((b) => b.count > 0)
        .map((b) => ({
            ...b,
            productCount: b.count,
        }))
        .sort((a, b) => {
            if (b.count !== a.count) return b.count - a.count;
            return a.name.localeCompare(b.name, 'lt');
        });
}

export function getDynamicCategoryFacets(
    category?: string,
    locale: CatalogFilterLocale = 'lt',
    extraFilters: ListingFilters = {},
): DynamicCategoryFacetGroup {
    const groupKey = resolveCanonicalCategoryGroupKey(category);
    const def = DYNAMIC_CATEGORY_FACET_DEFINITIONS[groupKey] || DYNAMIC_CATEGORY_FACET_DEFINITIONS.all;
    const baseFilters: ListingFilters = {
        ...extraFilters,
        category,
        spec: undefined,
        page: 1,
        pageSize: undefined,
    };

    const chips: DynamicCategoryFacetChipItem[] = [];
    for (const chipDef of def.chips) {
        const count = filterProductsByBoilerCompatibility(
            searchGilesSnapshotPaged({
                ...baseFilters,
                spec: chipDef.spec,
            }).items,
            extraFilters.boiler,
        ).length;
        if (count > 0) {
            chips.push({
                ...chipDef,
                label: chipDef.labels[locale] || chipDef.labels.lt,
                count,
            });
        }
    }

    return {
        groupKey,
        groupHeading: def.groupHeadings[locale] || def.groupHeadings.lt,
        groupHeadings: def.groupHeadings,
        chips,
    };
}

