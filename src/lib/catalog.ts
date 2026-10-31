// Storefront catalog data access (R2 conversion redesign + W33-B2 visual engineering upgrade).
// Store-scoped via product_stores junction; prices from the canonical
// variants table (priceGross cents) so displayed price === checkout price.
import { products, variants, categories, productStores, brands } from '@platform/database/schema';
import { and, asc, desc, eq, inArray, or, sql } from 'drizzle-orm';
import { db } from '@platform/database';
import { resolveStoreIdOrThrow } from './store-identity';
import { resolveProductImageUrl, EXACT_PHOTO_SKUS } from './product-visuals';
import { inferProductBrandName } from './v3-description';
import {
    shouldUseGilesSnapshot,
    findGilesSnapshotProductBySlugOrId,
    getGilesSnapshotPopularProducts,
} from './giles-catalog-snapshot';

export interface CatalogProduct {
    id: string;
    slug?: string;
    canonicalUrl?: string | null;
    variantId: string;
    sku: string;
    name: string;
    description: string;
    price: number; // EUR gross
    priceCents: number | null; // W22-D1 T4: gross cents for the su/be-PVM display
    vatRate: number | null; // W22-D1 T4: display math input
    compareAtPrice: number | null;
    stock: number | null; // null = unknown supplier stock (see lib/purchasable)
    stockQuantity?: number | null;
    stockUnit?: string | null;
    stockSource?: string | null;
    lastSyncedAt?: string | null;
    category: string;
    categoryId: string | null;
    brand?: string;
    ean?: string | null;
    image: string; // Always resolved to a real /images/products/*.webp or /manufacturer-assets/*.webp path
    seriesImageUrl?: string;
    specs?: Record<string, string>;
    technicalSpecs?: Record<string, string>;
}

export function buildProductSlug(title: string, sku: string): string {
    const map: Record<string, string> = {
        ą: 'a', č: 'c', ę: 'e', ė: 'e', į: 'i', š: 's', ų: 'u', ū: 'u', ž: 'z',
        Ą: 'a', Č: 'c', Ę: 'e', Ė: 'e', Į: 'i', Š: 's', Ų: 'u', Ū: 'u', Ž: 'z',
    };
    const baseSlug = (title || 'preke')
        .replace(/[ąčęėįšųūžĄČĘĖĮŠŲŪŽ]/g, (ch) => map[ch] || ch)
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .slice(0, 60)
        .replace(/^-+|-+$/g, '');
    const skuSlug = (sku || '')
        .toLowerCase()
        .replace(/[^a-z0-9._-]+/g, '-')
        .replace(/^-+|-+$/g, '');
    return skuSlug ? `${baseSlug || 'preke'}-${skuSlug}` : (baseSlug || 'preke');
}

const EXACT_SKU_LOWER_LIST = Array.from(EXACT_PHOTO_SKUS)
    .map((s) => s.toLowerCase())
    .filter((v, i, a) => a.indexOf(v) === i);

const STORE_ID_CACHE_TTL_MS = 5 * 60 * 1000;
const storeIdCache = new Map<string, { expiresAt: number; value: string }>();

export function clearStoreIdCache(): void {
    storeIdCache.clear();
}

export async function storeIdOrThrow(): Promise<string> {
    const envSlug = process.env.STORE_SLUG || '';
    const envStoreId = process.env.STORE_ID || '';
    const cacheKey = `${envSlug}|${envStoreId}`;
    const now = Date.now();
    const cached = storeIdCache.get(cacheKey);
    if (cached && cached.expiresAt > now) {
        return cached.value;
    }

    // Single fail-closed resolver (WP-W119-A2): env unset or unknown slug
    // throws StoreIdentityError — no foreign store is ever returned.
    const sid = await resolveStoreIdOrThrow();
    storeIdCache.set(cacheKey, { expiresAt: now + STORE_ID_CACHE_TTL_MS, value: sid });
    return sid;
}

export async function getStoreScopedProductIds(): Promise<string[]> {
    try {
        const sid = await storeIdOrThrow();
        const rows = await db.select({ id: productStores.productId })
            .from(productStores)
            .where(and(
                eq(productStores.storeId, sid),
                eq(productStores.isActive, true),
            ));
        return rows.map((r: any) => r.id);
    } catch (error) {
        console.error('[catalog] getStoreScopedProductIds failed:', error);
        return [];
    }
}

export async function getStoreScopeFilter() {
    const ids = await getStoreScopedProductIds();
    return ids.length > 0 ? inArray(products.id, ids) : sql`false`;
}

const catalogSelect = {
    id: products.id,
    slug: products.slug,
    canonicalUrl: products.canonicalUrl,
    variantId: variants.id,
    sku: variants.sku,
    name: products.titleLt,
    nameEn: products.titleEn,
    description: products.descriptionLt,
    descriptionEn: products.descriptionEn,
    priceGross: variants.priceGross,
    priceCents: variants.priceGross,
    vatRate: variants.vatRate,
    compareAtPrice: variants.compareAtPrice,
    stock: variants.stock,
    images: variants.images,
    attributes: variants.attributes,
    category: categories.name,
    categoryId: categories.id,
    brandName: brands.name,
};

function mapCatalogRow(r: any): CatalogProduct {
    const displayTitle = r.name || r.nameEn || '';
    const displayDesc = r.description || r.descriptionEn || '';
    const attrs = r.attributes && typeof r.attributes === 'object' ? (r.attributes as Record<string, any>) : {};
    const seriesImg = (typeof attrs.seriesImageUrl === 'string' && attrs.seriesImageUrl)
        || (typeof attrs.ui_fallback_image === 'string' && attrs.ui_fallback_image)
        || '';
    const rawImage = (Array.isArray(r.images) && r.images[0]?.url) || seriesImg || '';
    const resolvedBrand = inferProductBrandName({
        brand: r.brandName,
        title: displayTitle,
        sku: r.sku,
        description: displayDesc,
    });
    const resolvedImage = resolveProductImageUrl({
        sku: r.sku,
        title: displayTitle,
        brand: resolvedBrand,
        category: r.category || 'Termostatinės galvutės ir vožtuvai',
        imageUrl: rawImage,
        seriesImageUrl: seriesImg,
        attributes: attrs,
    });
    const resolvedSlug = typeof r.slug === 'string' && r.slug.trim()
        ? r.slug.trim()
        : buildProductSlug(displayTitle, r.sku);

    return {
        id: r.id,
        slug: resolvedSlug,
        canonicalUrl: r.canonicalUrl || null,
        variantId: r.variantId,
        sku: r.sku,
        name: displayTitle,
        description: displayDesc,
        price: r.priceGross != null ? Number(r.priceGross) / 100 : 0,
        priceCents: r.priceGross != null ? Number(r.priceGross) : null,
        vatRate: r.vatRate == null ? null : Number(r.vatRate),
        compareAtPrice: r.compareAtPrice != null ? Number(r.compareAtPrice) / 100 : null,
        stock: r.stock == null ? null : Number(r.stock),
        category: r.category || 'Prekės',
        categoryId: r.categoryId,
        brand: resolvedBrand,
        image: resolvedImage,
        seriesImageUrl: seriesImg || resolvedImage,
    };
}

function catalogScope(sid: string) {
    // WP-W118-A1 (audit P0-2): ownership scoping only. Visibility = bound to
    // THIS store via product_stores.is_active AND products.status='published'.
    // Test/demo products are kept out by unpublishing their junction rows
    // (seed scripts are guarded by packages/database/scripts/_seed-guard.ts),
    // not by a SKU blacklist that lags behind every new test seed.
    return and(
        eq(productStores.storeId, sid),
        eq(productStores.isActive, true),
        eq(products.status, 'published'),
    );
}

export async function getStoreCatalog(): Promise<CatalogProduct[]> {
    if (shouldUseGilesSnapshot()) {
        return getGilesSnapshotPopularProducts(100)
            .map((p) => findGilesSnapshotProductBySlugOrId(p.id))
            .filter((p): p is CatalogProduct => p !== null);
    }
    try {
        const sid = await storeIdOrThrow();
        const exactSkuSqlList = sql.join(EXACT_SKU_LOWER_LIST.map((s) => sql`${s}`), sql`, `);
        const flagshipPriority = sql<number>`CASE
            WHEN LOWER(${variants.sku}) IN (${exactSkuSqlList}) THEN 0
            WHEN jsonb_typeof(${variants.images}) = 'array'
                 AND jsonb_array_length(${variants.images}) > 0
                 AND (${variants.images}->0->>'url') LIKE '/images/products/%'
                 AND (${variants.images}->0->>'url') NOT LIKE '%family-%' THEN 1
            ELSE 2
        END`;

        const rows = await db.select(catalogSelect)
            .from(productStores)
            .innerJoin(products, eq(products.id, productStores.productId))
            .innerJoin(variants, eq(variants.productId, products.id))
            .leftJoin(categories, eq(products.categoryId, categories.id))
            .leftJoin(brands, eq(products.brandId, brands.id))
            .where(catalogScope(sid))
            .orderBy(flagshipPriority, asc(categories.sortOrder), desc(products.createdAt))
            .limit(100);

        return rows.map(mapCatalogRow);
    } catch (error) {
        console.error('[catalog] getStoreCatalog failed:', error);
        return [];
    }
}

export async function getCatalogProduct(id: string): Promise<CatalogProduct | null> {
    if (shouldUseGilesSnapshot()) {
        const snapProd = findGilesSnapshotProductBySlugOrId(id);
        if (snapProd) return snapProd;
    }
    try {
        const sid = await storeIdOrThrow();
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
        if (isUuid) {
            const [row] = await db.select(catalogSelect)
                .from(productStores)
                .innerJoin(products, eq(products.id, productStores.productId))
                .innerJoin(variants, eq(variants.productId, products.id))
                .leftJoin(categories, eq(products.categoryId, categories.id))
                .leftJoin(brands, eq(products.brandId, brands.id))
                .where(and(catalogScope(sid), eq(products.id, id)))
                .limit(1);
            if (row) return mapCatalogRow(row);
            const prefix8 = id.slice(0, 8).toLowerCase();
            const [prefixRow] = await db.select(catalogSelect)
                .from(productStores)
                .innerJoin(products, eq(products.id, productStores.productId))
                .innerJoin(variants, eq(variants.productId, products.id))
                .leftJoin(categories, eq(products.categoryId, categories.id))
                .leftJoin(brands, eq(products.brandId, brands.id))
                .where(and(catalogScope(sid), sql`${products.id}::text ILIKE ${`${prefix8}-%`}`))
                .limit(1);
            if (prefixRow) return mapCatalogRow(prefixRow);
        }
        const decodedId = decodeURIComponent(id).trim();
        const [skuRow] = await db.select(catalogSelect)
            .from(productStores)
            .innerJoin(products, eq(products.id, productStores.productId))
            .innerJoin(variants, eq(variants.productId, products.id))
            .leftJoin(categories, eq(products.categoryId, categories.id))
            .leftJoin(brands, eq(products.brandId, brands.id))
            .where(
                and(
                    catalogScope(sid),
                    or(
                        sql`LOWER(${products.slug}) = LOWER(${decodedId})`,
                        sql`LOWER(${variants.sku}) = LOWER(${decodedId})`,
                    ),
                ),
            )
            .limit(1);
        if (skuRow) return mapCatalogRow(skuRow);

        if (decodedId.includes('-')) {
            const parts = decodedId.split('-').filter(Boolean);
            const suffixCandidates = [
                parts.slice(-1).join('-'),
                parts.slice(-2).join('-'),
                parts.slice(-3).join('-'),
            ].filter(Boolean);
            if (suffixCandidates.length > 0) {
                const candidateSql = sql.join(suffixCandidates.map((c) => sql`LOWER(${c})`), sql`, `);
                const [fallbackRow] = await db.select(catalogSelect)
                    .from(productStores)
                    .innerJoin(products, eq(products.id, productStores.productId))
                    .innerJoin(variants, eq(variants.productId, products.id))
                    .leftJoin(categories, eq(products.categoryId, categories.id))
                    .leftJoin(brands, eq(products.brandId, brands.id))
                    .where(and(catalogScope(sid), sql`LOWER(${variants.sku}) IN (${candidateSql})`))
                    .limit(1);
                if (fallbackRow) return mapCatalogRow(fallbackRow);
            }
        }
        return null;
    } catch (error) {
        console.error('[catalog] getCatalogProduct failed:', error);
        return null;
    }
}

export async function getRelatedProducts(product: CatalogProduct, limit = 4): Promise<CatalogProduct[]> {
    const catalog = await getStoreCatalog();
    const sameCategory = catalog.filter((p) => p.categoryId && p.categoryId === product.categoryId && p.id !== product.id);
    const others = catalog.filter((p) => p.id !== product.id && (!product.categoryId || p.categoryId !== product.categoryId));
    return [...sameCategory, ...others].slice(0, limit);
}
