import fs from 'fs';
import path from 'path';
import type { CatalogProduct } from './catalog';

function buildProductSlug(title: string, sku: string): string {
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
import {
    CATALOG_ACTIVE_BRAND_DIRECTORY,
    CATALOG_SUBTYPE_OPTIONS,
    CATALOG_SPEC_OPTIONS,
    resolveCategoryAliasNames,
    resolveCatalogSubcategoryRegex,
    resolveCatalogSpecRegex,
    toBrandSlug,
    type ListingFilters,
    type ListingProduct,
    type PagedListing,
} from './catalog-listing';
import { parseSkuQuery } from './sku-code';
import { matchesPriceFilter } from './w121-honest-commerce';
import { resolveProductImageUrl, isExactPhotoSku } from './product-visuals';
import {
    resolveProductSeriesVisual,
    PRODUCT_VISUAL_SERIES_RULES,
    type ResolvedProductSeriesVisual,
} from './product-visual-resolver';
import {
    readJsonAtomic,
    writeJsonAtomic,
    withFileTransaction,
} from './transactional-store';
import {
    getCatalogSearchIndex,
    invalidateCatalogSearchIndex,
    lookupCatalogProductO1,
    queryInvertedCandidateIndices,
    normalizeSearchToken,
} from './catalog-search-index';
import { inferProductBrandName, formatCleanCatalogProductTitle } from './v3-description';
import { diffOverrideStores, appendActivityEntries } from './admin-activity-log';
import {
    resolveB2BDiscountForBrand,
    type B2BQuickOrderResolvedRow,
} from './giles-masterpiece-data';

export {
    readJsonAtomic,
    writeJsonAtomic,
    withFileTransaction,
    resolveProductSeriesVisual,
    PRODUCT_VISUAL_SERIES_RULES,
    type ResolvedProductSeriesVisual,
};

export interface RawSnapshotProduct {
    id: string;
    slug?: string | null;
    name: string | null;
    nameLt: string | null;
    description?: string | null;
    descriptionLt?: string | null;
    createdAt?: string | null;
    categoryId?: string | null;
    categoryName: string | null;
    categorySlug: string | null;
    brandId?: string | null;
    brandName: string | null;
    brandVerified?: boolean | null;
    variantId?: string | null;
    sku: string | null;
    ean?: string | null;
    priceCents: number | null;
    // W121-A1 field contract (UI reads null-safely; rows may predate these).
    priceEur?: number | null;
    priceOnRequest?: true;
    availability?: 'in_stock' | 'supplier_2_4d' | 'on_request';
    costCents?: number | null;
    compareAtCents?: number | null;
    stock: number | null;
    stockQuantity?: number | null;
    stockQty?: number | null;
    stockUnit?: string | null;
    stockSource?: string | null;
    lastSyncedAt?: string | null;
    vatRate: number | null;
    image?: string | null;
    rawImageUrl?: string | null;
    specs?: Record<string, string> | null;
    technicalSpecs?: Record<string, string> | null;
}

export type GilesStockSource =
    | 'Skaita SQL · Kauno sandėlis (Eigulių g. 21, LT-51418 Kaunas)'
    | 'EGIP.lt PrestaShop bazė'
    | 'Gamybos sandėlis Kaune'
    | 'Tiekėjo centrinis sandėlis (2–4 d. d.)';

export function formatShortStockBadge(product: {
    stock?: number | null;
    stockQuantity?: number | null;
    stockQty?: number | null;
    stockUnit?: string | null;
    stockSource?: string | null;
}): { shortLabel: string; mobileLabel: string; isLocalKaunas: boolean } {
    // W121-A2: honest badge — a numeric qty appears only when the row carries
    // a real positive stockQty; unknown stock never gets a fabricated number.
    const qtySource =
        typeof product.stockQty === 'number' && product.stockQty > 0
            ? product.stockQty
            : typeof product.stockQuantity === 'number' && product.stockQuantity > 0
              ? product.stockQuantity
              : typeof product.stock === 'number' && product.stock > 0
                ? product.stock
                : null;
    const unit = product.stockUnit || 'vnt.';
    const src = product.stockSource || '';
    const withQty = (label: string) => (qtySource != null ? `${label}: ${qtySource} ${unit}` : label);

    if (src.includes('EGIP.lt')) {
        return {
            shortLabel: withQty('Sandėlyje · Kaunas (EGIP.lt)'),
            mobileLabel: qtySource != null ? `Kaune: ${qtySource} ${unit}` : 'Sandėlyje · Kaunas',
            isLocalKaunas: true,
        };
    }
    if (src.includes('Gamybos')) {
        return {
            shortLabel: withQty('Sandėlyje · Kaunas (Gamyba)'),
            mobileLabel: qtySource != null ? `Kaune: ${qtySource} ${unit}` : 'Sandėlyje · Kaunas',
            isLocalKaunas: true,
        };
    }
    if (src.includes('Tiekėjo')) {
        return {
            shortLabel: 'Tiekėjo sandėlyje · 2–4 d. d.',
            mobileLabel: 'Tiekėjo sandėlyje',
            isLocalKaunas: false,
        };
    }
    return {
        shortLabel: withQty('Sandėlyje · Kaunas'),
        mobileLabel: qtySource != null ? `Kaune: ${qtySource} ${unit}` : 'Sandėlyje · Kaunas',
        isLocalKaunas: true,
    };
}

export interface GilesCatalogSnapshot {
    generatedAt: string;
    totalProducts: number;
    products: ListingProduct[];
    allProductsIncludingHidden?: ListingProduct[];
    rawById: Map<string, RawSnapshotProduct>;
    bySlug: Map<string, ListingProduct>;
    bySkuNormalized: Map<string, ListingProduct>;
}

export interface CatalogProductOverride {
    sku: string;
    name?: string;
    title?: string;
    ean?: string;
    category?: string;
    subcategory?: string;
    brandName?: string;
    brand?: string;
    priceGrossEur?: number;
    price?: number;
    promoPriceEur?: number;
    costPriceEur?: number;
    costEur?: number;
    stockQuantity?: number;
    stock?: number;
    inStock?: boolean;
    published?: boolean;
    active?: boolean;
    descriptionLt?: string;
    description?: string;
    imageUrl?: string;
    image?: string;
    weightKg?: number;
    deliveryClass?: 'locker_30kg' | 'pallet_freight' | 'Paštomatas <30kg' | 'Paletinis' | string;
    apvaEligible?: boolean;
    boilerCompatibilityTags?: string[];
    compatibleBoilers?: string[];
    kitContents?: string[];
    compatibilityNote?: string;
    specs?: Record<string, string>;
    updatedAt?: string;
}

export interface CustomCatalogProductRecord {
    id: string;
    sku: string;
    ean: string;
    name: string;
    brandName: string;
    category: string;
    priceGrossEur: number;
    costPriceEur: number;
    stockQuantity: number;
    published: boolean;
    description: string;
    imageUrl: string;
    createdAt: string;
}

export interface CatalogBrandPricingRule {
    brandSlug: string;
    mode: 'margin_floor' | 'percent_adjust';
    value: number;
    updatedAt: string;
}

export interface CatalogOverridesStore {
    overrides: Record<string, CatalogProductOverride>;
    customProducts: CustomCatalogProductRecord[];
    brandRules: Record<string, CatalogBrandPricingRule>;
}

const OVERRIDES_CANDIDATES = [
    path.resolve(process.cwd(), 'src/data/catalog-overrides.json'),
    path.resolve(__dirname, '../data/catalog-overrides.json'),
    '/home/mindu/Desktop/giles/giles-platform/src/data/catalog-overrides.json',
];

function resolveOverridesPath(): string {
    if (process.env.VITEST) {
        return `/tmp/giles-catalog-overrides-vitest-${process.pid}-${process.env.VITEST_POOL_ID || process.env.VITEST_WORKER_ID || '0'}.json`;
    }
    return (
        OVERRIDES_CANDIDATES.find((p) => fs.existsSync(p)) ||
        path.resolve(process.cwd(), 'src/data/catalog-overrides.json')
    );
}

let cachedSnapshot: GilesCatalogSnapshot | null = null;
let cachedOverridesMtime = -1;
let memoryOverridesStore: CatalogOverridesStore | null = null;

function normalizeCode(code: string): string {
    return (code || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function invalidateGilesCatalogSnapshotCache(): void {
    cachedSnapshot = null;
    invalidateCatalogSearchIndex();
}

export function getCatalogOverridesMtime(): number {
    const filePath = resolveOverridesPath();
    try {
        if (fs.existsSync(filePath)) {
            return fs.statSync(filePath).mtimeMs;
        }
    } catch {
        // ignore
    }
    return cachedOverridesMtime;
}

export function readCatalogOverrides(): CatalogOverridesStore {
    const filePath = resolveOverridesPath();
    const emptyFallback: CatalogOverridesStore = {
        overrides: {},
        customProducts: [],
        brandRules: {},
    };
    try {
        if (fs.existsSync(filePath)) {
            const stat = fs.statSync(filePath);
            if (memoryOverridesStore && stat.mtimeMs === cachedOverridesMtime) {
                return memoryOverridesStore;
            }
            const parsed = readJsonAtomic<Partial<CatalogOverridesStore>>(filePath, emptyFallback);
            memoryOverridesStore = {
                overrides: parsed.overrides && typeof parsed.overrides === 'object' ? parsed.overrides : {},
                customProducts: Array.isArray(parsed.customProducts) ? parsed.customProducts : [],
                brandRules: parsed.brandRules && typeof parsed.brandRules === 'object' ? parsed.brandRules : {},
            };
            cachedOverridesMtime = stat.mtimeMs;
            return memoryOverridesStore;
        }
    } catch {
        // fallback to memory store
    }
    if (!memoryOverridesStore) {
        memoryOverridesStore = emptyFallback;
    }
    return memoryOverridesStore;
}

export function saveCatalogOverrides(
    store: CatalogOverridesStore,
    audit?: { actor?: string; source?: string },
): CatalogOverridesStore {
    const previousStore = memoryOverridesStore;
    memoryOverridesStore = store;
    cachedSnapshot = null;
    invalidateCatalogSearchIndex();
    const filePath = resolveOverridesPath();
    try {
        writeJsonAtomic<CatalogOverridesStore>(filePath, store);
        if (fs.existsSync(filePath)) {
            cachedOverridesMtime = fs.statSync(filePath).mtimeMs;
        }
    } catch {
        // ignore read-only fs errors
    }
    // W123-A1: chatter-style audit trail. Both the admin UI route and the MCP
    // tool path commit through here, so the diff covers every product/price mutation.
    try {
        const diff = diffOverrideStores(
            previousStore ?? { overrides: {}, customProducts: [], brandRules: {} },
            store,
            audit,
        );
        if (diff.length) {
            appendActivityEntries(diff);
        }
    } catch {
        // Audit must never break a catalog save.
    }
    return store;
}

export function resetCatalogOverrides(): CatalogOverridesStore {
    return saveCatalogOverrides({
        overrides: {},
        customProducts: [],
        brandRules: {},
    });
}

export function getCatalogProductOverride(skuOrId: string): CatalogProductOverride | undefined {
    const key = String(skuOrId || '').trim();
    if (!key) return undefined;
    const store = readCatalogOverrides();
    const norm = normalizeCode(key);
    return store.overrides[norm] || store.overrides[key];
}

export function upsertCatalogProductOverride(
    input: Partial<CatalogProductOverride> & { sku: string },
): CatalogProductOverride {
    const sku = String(input.sku || '').trim();
    const normSku = normalizeCode(sku);
    const store = readCatalogOverrides();
    const existing = store.overrides[normSku] || store.overrides[sku] || { sku };

    const resolvedName = input.name ?? input.title ?? existing.name ?? existing.title;
    const resolvedBrand = input.brandName ?? input.brand ?? existing.brandName ?? existing.brand;
    const resolvedDesc =
        input.descriptionLt ?? input.description ?? existing.descriptionLt ?? existing.description;
    const resolvedPrice =
        input.priceGrossEur != null
            ? Number(input.priceGrossEur)
            : input.price != null
              ? Number(input.price)
              : existing.priceGrossEur ?? existing.price;
    const resolvedCost =
        input.costPriceEur != null
            ? Number(input.costPriceEur)
            : input.costEur != null
              ? Number(input.costEur)
              : existing.costPriceEur ?? existing.costEur;
    const resolvedStock =
        input.stockQuantity != null
            ? Number(input.stockQuantity)
            : input.stock != null
              ? Number(input.stock)
              : existing.stockQuantity ?? existing.stock;
    const resolvedPublished =
        typeof input.published === 'boolean'
            ? input.published
            : typeof input.active === 'boolean'
              ? input.active
              : existing.published;
    const resolvedBoilers =
        input.compatibleBoilers ??
        input.boilerCompatibilityTags ??
        existing.compatibleBoilers ??
        existing.boilerCompatibilityTags;
    const resolvedImage = input.imageUrl ?? input.image ?? existing.imageUrl ?? existing.image;

    const merged: CatalogProductOverride = {
        ...existing,
        ...input,
        sku,
        ...(resolvedName != null ? { name: resolvedName, title: resolvedName } : {}),
        ...(resolvedBrand != null ? { brandName: resolvedBrand, brand: resolvedBrand } : {}),
        ...(resolvedDesc != null ? { descriptionLt: resolvedDesc, description: resolvedDesc } : {}),
        ...(resolvedPrice != null
            ? {
                  priceGrossEur: Math.max(0.01, Math.round(resolvedPrice * 100) / 100),
                  price: Math.max(0.01, Math.round(resolvedPrice * 100) / 100),
              }
            : {}),
        ...(resolvedCost != null
            ? {
                  costPriceEur: Math.max(0, Math.round(resolvedCost * 100) / 100),
                  costEur: Math.max(0, Math.round(resolvedCost * 100) / 100),
              }
            : {}),
        ...(resolvedStock != null
            ? {
                  stockQuantity: Math.max(0, Math.round(resolvedStock)),
                  stock: Math.max(0, Math.round(resolvedStock)),
              }
            : {}),
        ...(typeof resolvedPublished === 'boolean'
            ? { published: resolvedPublished, active: resolvedPublished }
            : {}),
        ...(resolvedBoilers != null
            ? {
                  compatibleBoilers: resolvedBoilers,
                  boilerCompatibilityTags: resolvedBoilers,
              }
            : {}),
        ...(resolvedImage != null ? { imageUrl: resolvedImage, image: resolvedImage } : {}),
        updatedAt: new Date().toISOString(),
    };

    const nextOverrides = {
        ...store.overrides,
        [normSku]: merged,
    };

    saveCatalogOverrides({
        ...store,
        overrides: nextOverrides,
    });
    return merged;
}

let baseParsedCache: {
    generatedAt: string;
    totalProducts: number;
    products: RawSnapshotProduct[];
} | null = null;

export function getGilesCatalogSnapshot(): GilesCatalogSnapshot {
    if (cachedSnapshot && cachedOverridesMtime === -1) {
        return cachedSnapshot;
    }
    const filePath = resolveOverridesPath();
    try {
        if (fs.existsSync(filePath)) {
            const mtime = fs.statSync(filePath).mtimeMs;
            if (cachedOverridesMtime !== -1 && mtime !== cachedOverridesMtime) {
                cachedSnapshot = null;
                memoryOverridesStore = null;
            }
        }
    } catch {
        // ignore
    }

    if (cachedSnapshot) return cachedSnapshot;

    const candidates = [
        path.resolve(process.cwd(), 'src/data/giles-catalog-6337.json'),
        path.resolve(__dirname, '../data/giles-catalog-6337.json'),
        '/home/mindu/Desktop/giles/giles-platform/src/data/giles-catalog-6337.json',
    ];
    const snapshotPath = candidates.find((p) => fs.existsSync(p));
    if (!snapshotPath) {
        return {
            generatedAt: new Date().toISOString(),
            totalProducts: 0,
            products: [],
            rawById: new Map(),
            bySlug: new Map(),
            bySkuNormalized: new Map(),
        };
    }

    if (!baseParsedCache) {
        baseParsedCache = JSON.parse(fs.readFileSync(snapshotPath, 'utf8')) as {
            generatedAt: string;
            totalProducts: number;
            products: RawSnapshotProduct[];
        };
    }
    const parsed = baseParsedCache;
    const overridesStore = readCatalogOverrides();

    const rawById = new Map<string, RawSnapshotProduct>();
    const bySlug = new Map<string, ListingProduct>();
    const bySkuNormalized = new Map<string, ListingProduct>();

    const customRawProducts: RawSnapshotProduct[] = (overridesStore.customProducts || [])
        .filter((cp) => cp.published !== false)
        .map((cp) => ({
            id: cp.id,
            slug: buildProductSlug(cp.name, cp.sku),
            name: cp.name,
            nameLt: cp.name,
            descriptionLt: cp.description,
            createdAt: cp.createdAt,
            categoryId: toBrandSlug(cp.category || 'Katilinės įranga'),
            categoryName: cp.category || 'Katilinės įranga',
            categorySlug: toBrandSlug(cp.category || 'Katilinės įranga'),
            brandId: toBrandSlug(cp.brandName || 'Gilės Inžinerija'),
            brandName: cp.brandName || 'Gilės Inžinerija',
            brandVerified: true,
            variantId: cp.id,
            sku: cp.sku,
            ean: cp.ean || '4770001000009',
            priceCents: Math.round(Number(cp.priceGrossEur || 0) * 100),
            costCents: Math.round(Number(cp.costPriceEur || 0) * 100),
            compareAtCents: null,
            stock: Number(cp.stockQuantity ?? 10),
            stockQuantity: Number(cp.stockQuantity ?? 10),
            stockUnit: 'vnt.',
            stockSource: 'Skaita SQL · Kauno sandėlis (Eigulių g. 21, LT-51418 Kaunas)',
            lastSyncedAt: cp.createdAt,
            vatRate: 21,
            rawImageUrl: cp.imageUrl || '/images/products/giles-studio-01-mpb-nani-35-50.webp',
        }));

    const combinedRaw = [...customRawProducts, ...(parsed.products || [])];

    const CONVECTOR_AND_RADIATOR_SKU_ENRICHMENTS: Record<
        string,
        { name: string; brandName: string; descriptionLt: string }
    > = {
        '50-004-110': {
            name: 'Grindinis įleidžiamas vandeninis konvektorius Gilės GK-90/260-1200 (Cu-Al šilumokaitis, 90×260×1200 mm, G1/2", 680 W)',
            brandName: 'Gilės Inžinerija',
            descriptionLt:
                'Grindinis įleidžiamas vandeninis konvektorius vitrininiams langams su vario-aliuminio šilumokaičiu ir anoduoto aliuminio grotelėmis.',
        },
        '50-007-615': {
            name: 'Grindinis įleidžiamas vandeninis konvektorius su EC ventiliatoriumi Gilės GKF-90/260-1600 (24V DC, 90×260×1600 mm, 1850 W)',
            brandName: 'Gilės Inžinerija',
            descriptionLt:
                'Priverstinės konvekcijos grindinis vandeninis konvektorius su tylia 24V DC EC tangencine turbina.',
        },
        '50-003-620': {
            name: 'Vandeninis konvektorius – fancoil šildymo ir vėsinimo prietaisas Ferroli Top Fan 20 (1,95 kW, 2 vamzdžių sistema)',
            brandName: 'Ferroli',
            descriptionLt:
                'Sieninis vandeninis konvektorius (fancoil) žematemperatūriams šilumos siurbliams ir kondensaciniams katilams.',
        },
        '50-003-615': {
            name: 'Danfoss RA-N 15 ir RLV-K radiatoriaus termostatinio vožtuvo, apatinio binoklio H-bloko 50 mm ir Aero termogalvutės komplektas DN15',
            brandName: 'Danfoss',
            descriptionLt:
                'Danfoss radiatoriaus apatinio ir šoninio pajungimo termostatinis komplektas RA-N 15 / RLV-K su RA Click galvute.',
        },
        '50-001-615': {
            name: 'HERZ De Luxe radiatoriaus apatinio pajungimo mazgas H-blokas 50 mm su termostatine galvute M28×1,5 DN15',
            brandName: 'HERZ',
            descriptionLt:
                'HERZ De Luxe radiatoriaus apatinio pajungimo mazgas 50 mm ir termostatinis vožtuvas.',
        },
    };

    const items: ListingProduct[] = [];
    const allItemsIncludingHidden: ListingProduct[] = [];
    for (const rawBaseItem of combinedRaw) {
        const baseSku = rawBaseItem.sku || `SKU-${String(rawBaseItem.id).slice(0, 8)}`;
        const enrichedMeta = CONVECTOR_AND_RADIATOR_SKU_ENRICHMENTS[baseSku];
        const baseR: RawSnapshotProduct = enrichedMeta
            ? {
                  ...rawBaseItem,
                  name: enrichedMeta.name,
                  nameLt: enrichedMeta.name,
                  brandName: enrichedMeta.brandName,
                  description: enrichedMeta.descriptionLt,
                  descriptionLt: enrichedMeta.descriptionLt,
              }
            : rawBaseItem;
        const sku = baseR.sku || `SKU-${String(baseR.id).slice(0, 8)}`;
        const normSku = normalizeCode(sku);
        const override =
            overridesStore.overrides[normSku] ||
            overridesStore.overrides[sku] ||
            overridesStore.overrides[baseR.id];

        const isHiddenOnStorefront =
            Boolean(override) &&
            (override?.published === false || override?.active === false);

        const resolvedOverrideName = override?.name ?? override?.title;
        const resolvedOverrideBrand = override?.brandName ?? override?.brand;
        const resolvedOverrideDesc = override?.descriptionLt ?? override?.description;
        const resolvedRegularGrossEur =
            override?.priceGrossEur != null
                ? Number(override.priceGrossEur)
                : override?.price != null
                  ? Number(override.price)
                  : null;
        const resolvedPromoGrossEur =
            override?.promoPriceEur != null && Number(override.promoPriceEur) > 0
                ? Number(override.promoPriceEur)
                : null;
        const resolvedEffectiveGrossEur =
            resolvedPromoGrossEur != null ? resolvedPromoGrossEur : resolvedRegularGrossEur;
        const resolvedCostEur =
            override?.costPriceEur != null
                ? Number(override.costPriceEur)
                : override?.costEur != null
                  ? Number(override.costEur)
                  : null;
        const resolvedOverrideStock =
            override?.stockQuantity != null
                ? Number(override.stockQuantity)
                : override?.stock != null
                  ? Number(override.stock)
                  : override?.inStock === false
                    ? 0
                    : null;

        const r: RawSnapshotProduct = override
            ? {
                  ...baseR,
                  name: resolvedOverrideName ?? baseR.name,
                  nameLt: resolvedOverrideName ?? baseR.nameLt,
                  ean: override.ean ?? baseR.ean,
                  categoryName: override.category ?? baseR.categoryName,
                  categorySlug: override.category
                      ? toBrandSlug(override.category)
                      : baseR.categorySlug,
                  brandName: resolvedOverrideBrand ?? baseR.brandName,
                  description: resolvedOverrideDesc ?? baseR.description,
                  descriptionLt: resolvedOverrideDesc ?? baseR.descriptionLt,
                  rawImageUrl: override.imageUrl ?? override.image ?? baseR.rawImageUrl,
                  priceCents:
                      resolvedEffectiveGrossEur != null
                          ? Math.round(resolvedEffectiveGrossEur * 100)
                          : baseR.priceCents,
                  compareAtCents:
                      resolvedPromoGrossEur != null && resolvedRegularGrossEur != null
                          ? Math.round(resolvedRegularGrossEur * 100)
                          : baseR.compareAtCents,
                  costCents:
                      resolvedCostEur != null
                          ? Math.round(resolvedCostEur * 100)
                          : baseR.costCents,
                  stock:
                      resolvedOverrideStock != null
                          ? resolvedOverrideStock
                          : baseR.stock,
                  stockQuantity:
                      resolvedOverrideStock != null
                          ? resolvedOverrideStock
                          : baseR.stockQuantity,
              }
            : baseR;

        const rawTitle = r.nameLt || r.name || '';
        const resolvedBrand =
            r.brandName ||
            inferProductBrandName({
                brand: r.brandName,
                title: rawTitle,
                sku,
            });
        const brandSlug = toBrandSlug(resolvedBrand);
        const brandRule =
            overridesStore.brandRules[brandSlug] || overridesStore.brandRules['all'];

        let priceCents = r.priceCents != null ? Number(r.priceCents) : null;
        if (
            brandRule &&
            priceCents != null &&
            (!override || (override.priceGrossEur == null && override.price == null && override.promoPriceEur == null))
        ) {
            const baseGross = priceCents / 100;
            const baseNet = baseGross / 1.21;
            const costEur =
                r.costCents != null && r.costCents > 0
                    ? r.costCents / 100
                    : Math.round(baseNet * 0.68 * 100) / 100;
            if (brandRule.mode === 'margin_floor') {
                const marginRatio = Math.min(0.85, Math.max(0.15, brandRule.value / 100));
                const minNet = costEur / (1 - marginRatio);
                const minGross = Math.round(minNet * 1.21 * 100) / 100;
                if (minGross > baseGross) {
                    priceCents = Math.round(minGross * 100);
                }
            } else if (brandRule.mode === 'percent_adjust') {
                const minNet15 = costEur / (1 - 0.15);
                const minGross15 = Math.round(minNet15 * 1.21 * 100) / 100;
                const adjustedGross = Math.max(
                    minGross15,
                    Math.round(baseGross * (1 + brandRule.value / 100) * 100) / 100,
                );
                priceCents = Math.round(adjustedGross * 100);
            }
        }

        rawById.set(r.id, { ...r, priceCents });
        const cleanTitle = resolvedOverrideName
            ? resolvedOverrideName
            : formatCleanCatalogProductTitle(rawTitle, sku, resolvedBrand);
        const baseImageUrl = resolveProductImageUrl({
            sku,
            title: cleanTitle,
            brand: resolvedBrand,
            category: r.categoryName,
            imageUrl: r.image || r.rawImageUrl || undefined,
        });
        const seriesVisual = resolveProductSeriesVisual({
            sku,
            title: cleanTitle,
            brand: resolvedBrand,
            category: r.categoryName,
            imageUrl: r.image || r.rawImageUrl || baseImageUrl,
        });
        const resolvedImageUrl =
            override?.imageUrl ||
            override?.image ||
            r.image ||
            r.rawImageUrl ||
            baseImageUrl ||
            seriesVisual.image;
        const resolvedSlug =
            typeof r.slug === 'string' && r.slug.trim()
                ? r.slug.trim()
                : buildProductSlug(rawTitle, sku);
        const compareAtCents = r.compareAtCents != null ? Number(r.compareAtCents) : null;

        // W121-A2: unknown stock stays null — never fabricate a placeholder qty.
        const resolvedStockQty =
            r.stockQuantity != null
                ? Number(r.stockQuantity)
                : r.stock != null
                  ? Number(r.stock)
                  : null;
        const resolvedStockUnit = r.stockUnit || 'vnt.';
        const resolvedStockSource =
            r.stockSource || 'Skaita SQL · Kauno sandėlis (Eigulių g. 21, LT-51418 Kaunas)';
        const resolvedSyncedAt = r.lastSyncedAt || parsed.generatedAt || 'Aktyvus katalogas';
        const resolvedSpecs = override?.specs || r.specs || r.technicalSpecs || undefined;
        const resolvedDescText = r.description || r.descriptionLt || undefined;

        const item: ListingProduct = {
            id: r.id,
            slug: resolvedSlug,
            name: cleanTitle,
            nameLt: cleanTitle,
            categoryName: r.categoryName,
            categorySlug: r.categorySlug,
            brandName: resolvedBrand,
            brandVerified: r.brandVerified ?? true,
            createdAt: r.createdAt ?? null,
            price: priceCents != null ? priceCents / 100 : 0,
            compareAtPrice: compareAtCents != null ? compareAtCents / 100 : null,
            stock: resolvedStockQty,
            stockQuantity: resolvedStockQty,
            stockUnit: resolvedStockUnit,
            stockSource: resolvedStockSource,
            lastSyncedAt: resolvedSyncedAt,
            sku,
            ean: r.ean ?? null,
            description: resolvedDescText,
            imageUrl: resolvedImageUrl,
            seriesImageUrl: r.image || r.rawImageUrl || seriesVisual.image || resolvedImageUrl,
            seriesBadge: seriesVisual.seriesBadge,
            technicalCallout: seriesVisual.technicalCallout,
            specs: resolvedSpecs,
            technicalSpecs: resolvedSpecs,
            exactSkuMatch: false,
            priceCents,
            vatRate: r.vatRate == null ? 21 : Number(r.vatRate),
            // W121-A1 contract passthrough (null-safe on legacy rows).
            priceEur: r.priceEur != null ? Number(r.priceEur) : priceCents != null ? priceCents / 100 : null,
            priceOnRequest: r.priceOnRequest === true ? true : undefined,
            availability:
                r.availability === 'in_stock' || r.availability === 'supplier_2_4d' || r.availability === 'on_request'
                    ? r.availability
                    : undefined,
            stockQty: r.stockQty != null ? Number(r.stockQty) : resolvedStockQty,
        };

        allItemsIncludingHidden.push(item);

        if (isHiddenOnStorefront) {
            continue;
        }

        bySlug.set(resolvedSlug.toLowerCase(), item);
        bySlug.set(r.id.toLowerCase(), item);
        if (normSku && !bySkuNormalized.has(normSku)) {
            bySkuNormalized.set(normSku, item);
        }
        if (r.ean) {
            const normEan = normalizeCode(r.ean);
            if (normEan && !bySkuNormalized.has(normEan)) {
                bySkuNormalized.set(normEan, item);
            }
        }
        items.push(item);
    }

    items.sort((a, b) => {
        const aPriority = isExactPhotoSku(a.sku)
            ? 0
            : a.imageUrl && !a.imageUrl.includes('family-')
              ? 1
              : 2;
        const bPriority = isExactPhotoSku(b.sku)
            ? 0
            : b.imageUrl && !b.imageUrl.includes('family-')
              ? 1
              : 2;
        if (aPriority !== bPriority) return aPriority - bPriority;
        return 0;
    });

    cachedSnapshot = {
        generatedAt: parsed.generatedAt,
        totalProducts: items.length,
        products: items,
        allProductsIncludingHidden: allItemsIncludingHidden,
        rawById,
        bySlug,
        bySkuNormalized,
    };
    return cachedSnapshot;
}

export function getGilesCatalogProducts(): ListingProduct[] {
    return getGilesCatalogSnapshot().products;
}

export function shouldUseGilesSnapshot(): boolean {
    if (process.env.TEST_DB === 'pglite' || process.env.PGLITE_TEST_DB) {
        return false;
    }
    const snap = getGilesCatalogSnapshot();
    return snap.products.length >= 6000;
}

function priceBucketCents(priceRange?: string): { min?: number; max?: number } | null {
    switch (priceRange) {
        case 'under-50':
            return { max: 5000 };
        case '50-200':
            return { min: 5000, max: 20000 };
        case '200-1000':
            return { min: 20000, max: 100000 };
        case '1000-plus':
            return { min: 100000 };
        case 'under-20':
            return { max: 2000 };
        case '20-50':
            return { min: 2000, max: 5000 };
        case '50-plus':
            return { min: 5000 };
        default:
            return null;
    }
}

// W121-A1: cached search haystack per snapshot product — the 13,531-SKU
// catalog made per-query haystack rebuilds (long LT descriptions lowercased
// every call) the dominant search cost. WeakMap keyed by the snapshot item so
// a snapshot rebuild garbage-collects stale entries automatically.
const searchHaystackCache = new WeakMap<ListingProduct, string>();
function getSearchHaystack(
    p: ListingProduct,
    rawById: Map<string, RawSnapshotProduct>,
): string {
    let hay = searchHaystackCache.get(p);
    if (hay === undefined) {
        const raw = rawById.get(p.id);
        hay = `${p.sku} ${p.name} ${p.nameLt || ''} ${p.brandName || ''} ${p.categoryName || ''} ${raw?.descriptionLt || ''} ${raw?.ean || ''}`.toLowerCase();
        searchHaystackCache.set(p, hay);
    }
    return hay;
}

// W121-A1: lowercase category name cache — avoids re-lowercasing every
// product's category on every filtered query over the 13,531-SKU catalog.
const catNameLowerCache = new WeakMap<ListingProduct, string>();
function getCatNameLower(p: ListingProduct): string {
    let v = catNameLowerCache.get(p);
    if (v === undefined) {
        v = (p.categoryName || '').toLowerCase().trim();
        catNameLowerCache.set(p, v);
    }
    return v;
}

const catSlugLowerCache = new WeakMap<ListingProduct, string>();
function getCatSlugLower(p: ListingProduct): string {
    let v = catSlugLowerCache.get(p);
    if (v === undefined) {
        v = (p.categorySlug || '').toLowerCase().trim();
        catSlugLowerCache.set(p, v);
    }
    return v;
}

const catIdLowerCache = new WeakMap<RawSnapshotProduct, string>();
function getCatIdLower(raw: RawSnapshotProduct | undefined): string {
    if (!raw) return '';
    let v = catIdLowerCache.get(raw);
    if (v === undefined) {
        v = (raw.categoryId || '').toLowerCase();
        catIdLowerCache.set(raw, v);
    }
    return v;
}

// W121-A2: same lowercase cache pattern for the brand filter branch.
const brandNameLowerCache = new WeakMap<ListingProduct, string>();
function getBrandNameLower(p: ListingProduct): string {
    let v = brandNameLowerCache.get(p);
    if (v === undefined) {
        v = (p.brandName || '').toLowerCase().trim();
        brandNameLowerCache.set(p, v);
    }
    return v;
}

const brandSlugCache = new WeakMap<ListingProduct, string>();
function getBrandSlugCached(p: ListingProduct): string {
    let v = brandSlugCache.get(p);
    if (v === undefined) {
        v = toBrandSlug(p.brandName || '');
        brandSlugCache.set(p, v);
    }
    return v;
}

const brandIdLowerCache = new WeakMap<RawSnapshotProduct, string>();
function getBrandIdLower(raw: RawSnapshotProduct | undefined): string {
    if (!raw) return '';
    let v = brandIdLowerCache.get(raw);
    if (v === undefined) {
        v = (raw.brandId || '').toLowerCase();
        brandIdLowerCache.set(raw, v);
    }
    return v;
}

// W121-A1: repeat-query memo for searchGilesSnapshotPaged — bounded LRU-ish
// (keeps the newest 64 distinct queries), tied to the cached snapshot and the
// catalog-overrides mtime so any data change invalidates it.
const searchQueryMemo: {
    snapRef: GilesCatalogSnapshot | null;
    overridesMtime: number;
    map: Map<string, PagedListing>;
} = { snapRef: null, overridesMtime: -1, map: new Map() };
function stableFilterKey(filters: ListingFilters): string {
    const keys = Object.keys(filters).filter((k) => {
        const v = (filters as Record<string, unknown>)[k];
        return v !== undefined && v !== null && v !== '';
    });
    keys.sort();
    return keys.map((k) => `${k}=${String((filters as Record<string, unknown>)[k])}`).join('&');
}

export function searchGilesSnapshotPaged(filters: ListingFilters = {}): PagedListing {
    const snap = getGilesCatalogSnapshot();
    // W121-A1: memoize identical repeat queries (storefront page-1 category
    // views repeat constantly). Invalidated with the snapshot or overrides.
    const overridesMtime = getCatalogOverridesMtime();
    if (
        searchQueryMemo.snapRef !== snap ||
        searchQueryMemo.overridesMtime !== overridesMtime
    ) {
        searchQueryMemo.snapRef = snap;
        searchQueryMemo.overridesMtime = overridesMtime;
        searchQueryMemo.map.clear();
    }
    const memoKey = stableFilterKey(filters);
    const memoized = searchQueryMemo.map.get(memoKey);
    if (memoized) return memoized;

    const index = getCatalogSearchIndex();
    const rawById = snap.rawById;
    const parsedQ = parseSkuQuery(filters.q ?? '');
    const pinCodes = new Set(parsedQ.codes.map((c) => normalizeCode(c)));

    const activeCategory = (filters.category ?? filters.categoryId ?? '').trim();
    const resolvedCategoryNames =
        activeCategory && activeCategory !== 'visi'
            ? resolveCategoryAliasNames(activeCategory).map((n) => n.toLowerCase().trim())
            : [];
    const activeCatLower = activeCategory.toLowerCase();

    const activeBrand = (filters.brand ?? filters.brandId ?? '').trim();
    const activeBrandSlug = activeBrand && activeBrand.toLowerCase() !== 'visi' ? toBrandSlug(activeBrand) : '';
    const canonicalBrandLower = activeBrandSlug
        ? (
              CATALOG_ACTIVE_BRAND_DIRECTORY.find((b) => b.slug === activeBrandSlug)?.name || activeBrand
          )
              .toLowerCase()
              .trim()
        : '';

    const activeSubtype = (filters.sub ?? filters.subtype ?? '').trim().toLowerCase();
    const subtypeRegex =
        activeSubtype && activeSubtype !== 'all'
            ? new RegExp(resolveCatalogSubcategoryRegex(activeCategory, activeSubtype), 'i')
            : null;

    const activeSpec = (filters.spec ?? '').trim();
    const specRegex = activeSpec
        ? new RegExp(resolveCatalogSpecRegex(activeCategory, activeSpec), 'i')
        : null;

    const bucket = priceBucketCents(filters.priceRange);
    const minCents =
        filters.minPrice != null && Number.isFinite(filters.minPrice) && filters.minPrice > 0
            ? Math.round(filters.minPrice * 100)
            : bucket?.min;
    const maxCents =
        filters.maxPrice != null && Number.isFinite(filters.maxPrice) && filters.maxPrice > 0
            ? Math.round(filters.maxPrice * 100)
            : bucket?.max;

    const queryLower = parsedQ.rawQuery.toLowerCase();

    // Narrow candidate pool via O(1) category/brand slices or inverted token index when possible
    let candidateProducts: ListingProduct[] = snap.products;
    if (activeBrandSlug) {
        const directBrandSlice =
            index.byBrand.get(activeBrandSlug) ||
            index.byBrand.get(canonicalBrandLower) ||
            index.byBrand.get(activeBrand.toLowerCase());
        if (directBrandSlice && directBrandSlice.length > 0) {
            candidateProducts = directBrandSlice;
        }
    } else if (resolvedCategoryNames.length > 0) {
        const catUnion: ListingProduct[] = [];
        const seenIds = new Set<string>();
        const keysToTry = [activeCatLower, normalizeSearchToken(activeCatLower), ...resolvedCategoryNames];
        for (const k of keysToTry) {
            const slice = index.byCategory.get(k) || index.byCategory.get(normalizeSearchToken(k));
            if (slice) {
                for (const item of slice) {
                    if (!seenIds.has(item.id)) {
                        seenIds.add(item.id);
                        catUnion.push(item);
                    }
                }
            }
        }
        if (catUnion.length > 0) {
            candidateProducts = catUnion;
        }
    } else if (queryLower) {
        const invertedIndices = queryInvertedCandidateIndices(queryLower);
        if (invertedIndices && invertedIndices.size > 0) {
            const fromIndex: ListingProduct[] = [];
            for (const i of invertedIndices) {
                const prod = index.products[i];
                if (prod) fromIndex.push(prod);
            }
            if (fromIndex.length > 0) {
                candidateProducts = fromIndex;
            }
        }
    }

    const matched: ListingProduct[] = [];
    const rawForHay = rawById;
    // W121-A2 perf: Set lookups + the W121-A1 lowercase caches keep the
    // category slice under 5 ms on the 13.5k-SKU snapshot.
    const resolvedCategoryNameSet = new Set(resolvedCategoryNames);
    const hasPinCodes = pinCodes.size > 0;
    const activeBrandLower = activeBrand.toLowerCase();
    for (const p of candidateProducts) {
        const raw = rawById.get(p.id);
        if (resolvedCategoryNameSet.size > 0) {
            const cName = getCatNameLower(p);
            const cSlug = getCatSlugLower(p);
            const cId = getCatIdLower(raw);
            if (
                cId !== activeCatLower &&
                cSlug !== activeCatLower &&
                !resolvedCategoryNameSet.has(cName)
            ) {
                continue;
            }
        }

        if (activeBrandSlug) {
            const bName = getBrandNameLower(p);
            const bSlug = getBrandSlugCached(p);
            const bId = getBrandIdLower(raw);
            if (
                bId !== activeBrandLower &&
                bSlug !== activeBrandSlug &&
                bName !== canonicalBrandLower &&
                !bName.includes(canonicalBrandLower)
            ) {
                continue;
            }
        }

        const isExactCandidate = queryLower || pinCodes.size > 0;
        const normSku = isExactCandidate ? normalizeCode(p.sku) : '';
        const isExact = pinCodes.size > 0 && pinCodes.has(normSku);

        if (queryLower) {
            const hay = getSearchHaystack(p, rawForHay);
            const codeMatch =
                isExact ||
                parsedQ.codes.some((c) => normSku.includes(normalizeCode(c)));
            if (!codeMatch && !hay.includes(queryLower)) {
                const rawParts = queryLower
                    .split(/\s*\/\s*|\s+ir\s+|\s+or\s+/)
                    .map((s) => s.trim())
                    .filter(Boolean);
                const stemWord = (w: string) =>
                    w
                        .replace(/(degikliai|degiklis|degikliu)$/i, 'degikl')
                        .replace(/(katilai|katilas|katilu)$/i, 'katil')
                        .replace(/(siurbliai|siurblys|siurbliu)$/i, 'siurbl')
                        .replace(/(radiatoriai|radiatorius|radiatoriu)$/i, 'radiator')
                        .replace(/(boileriai|boileris|boileriu)$/i, 'boiler');
                const matchesPart = (part: string) => {
                    if (hay.includes(part)) return true;
                    const tokens = part
                        .split(/[\s,;()]+/)
                        .map((t) => stemWord(t.trim()))
                        .filter((t) => t.length >= 2);
                    return tokens.length > 0 && tokens.every((tok) => hay.includes(tok));
                };
                if (!rawParts.some(matchesPart)) {
                    continue;
                }
            }
        }

        if (subtypeRegex || specRegex) {
            const hay = `${p.nameLt || ''} ${p.name || ''} ${p.sku} ${p.brandName || ''}`;
            if (subtypeRegex && !subtypeRegex.test(hay)) continue;
            if (specRegex && !specRegex.test(hay)) continue;
        }

        if (!matchesPriceFilter(p, minCents, maxCents)) continue;
        if (filters.inStock && p.stock != null && p.stock < 0) continue;

        matched.push(isExact ? { ...p, exactSkuMatch: true } : p);
    }

    if (pinCodes.size > 0 || filters.sortBy) {
        matched.sort((a, b) => {
            if (a.exactSkuMatch !== b.exactSkuMatch) return a.exactSkuMatch ? -1 : 1;
            if (filters.sortBy === 'code-asc' || filters.sortBy === 'code_asc') {
                return a.sku.localeCompare(b.sku);
            }
            if (filters.sortBy === 'price-asc' || filters.sortBy === 'price_asc') {
                const pa = a.priceCents ?? Number.MAX_SAFE_INTEGER;
                const pb = b.priceCents ?? Number.MAX_SAFE_INTEGER;
                return pa - pb;
            }
            if (filters.sortBy === 'price-desc' || filters.sortBy === 'price_desc') {
                const pa = a.priceCents ?? -1;
                const pb = b.priceCents ?? -1;
                return pb - pa;
            }
            return 0;
        });
    }

    const total = matched.length;
    const pageSize = filters.pageSize && filters.pageSize > 0 ? filters.pageSize : null;
    const page = Math.max(1, filters.page ?? 1);
    const items = pageSize
        ? matched.slice((page - 1) * pageSize, (page - 1) * pageSize + pageSize)
        : matched;

    const result: PagedListing = {
        items,
        total,
        page: pageSize ? page : 1,
        pageSize,
        pageCount: pageSize ? Math.ceil(total / pageSize) : 1,
    };
    if (searchQueryMemo.map.size >= 64) {
        const oldest = searchQueryMemo.map.keys().next().value;
        if (oldest !== undefined) searchQueryMemo.map.delete(oldest);
    }
    searchQueryMemo.map.set(memoKey, result);
    return result;
}

export function getGilesSnapshotBrands(): Array<{
    id: string;
    name: string;
    slug: string;
    isVerified: boolean;
    productCount: number;
}> {
    const snap = getGilesCatalogSnapshot();
    if (snap.products.length === 0) return [...CATALOG_ACTIVE_BRAND_DIRECTORY];

    const counts = new Map<string, { id: string; name: string; slug: string; count: number }>();
    for (const p of snap.products) {
        const bName = p.brandName || 'Gilės Inžinerija';
        const slug = toBrandSlug(bName);
        const raw = snap.rawById.get(p.id);
        const existing = counts.get(slug);
        if (existing) {
            existing.count++;
        } else {
            const dirEntry = CATALOG_ACTIVE_BRAND_DIRECTORY.find((d) => d.slug === slug);
            counts.set(slug, {
                id: raw?.brandId || dirEntry?.id || slug,
                name: dirEntry?.name || bName,
                slug,
                count: 1,
            });
        }
    }

    return Array.from(counts.values())
        .map((b) => ({
            id: b.id,
            name: b.name,
            slug: b.slug,
            isVerified: true,
            productCount: b.count,
        }))
        .sort((a, b) => {
            const aGiles = a.slug === 'giles-inzinerija' ? 0 : 1;
            const bGiles = b.slug === 'giles-inzinerija' ? 0 : 1;
            if (aGiles !== bGiles) return aGiles - bGiles;
            return b.productCount - a.productCount;
        });
}

export function getGilesSnapshotCategories(): Array<{
    id: string;
    name: string;
    slug: string;
    productCount: number;
}> {
    const snap = getGilesCatalogSnapshot();
    const counts = new Map<string, { id: string; name: string; slug: string; productCount: number }>();
    for (const p of snap.products) {
        const cName = p.categoryName || 'Katilinės įranga';
        const cSlug = p.categorySlug || toBrandSlug(cName);
        const raw = snap.rawById.get(p.id);
        const existing = counts.get(cSlug);
        if (existing) {
            existing.productCount++;
        } else {
            counts.set(cSlug, {
                id: raw?.categoryId || cSlug,
                name: cName,
                slug: cSlug,
                productCount: 1,
            });
        }
    }
    return Array.from(counts.values()).sort((a, b) => b.productCount - a.productCount);
}

export function getGilesSnapshotPopularProducts(limit = 12): ListingProduct[] {
    const brandsToPick = [
        { brand: 'giles-inzinerija', count: 3 },
        { brand: 'megatherm', count: 2 },
        { brand: 'haier', count: 2 },
        { brand: 'danfoss', count: 2 },
        { brand: 'imi-heimeier', count: 2 },
        { brand: 'gorenje', count: 1 },
    ];
    const picked = new Set<string>();
    const result: ListingProduct[] = [];

    for (const { brand, count } of brandsToPick) {
        const pool = searchGilesSnapshotPaged({ brand, page: 1, pageSize: 20 }).items;
        let added = 0;
        for (const item of pool) {
            if (added >= count) break;
            if (!picked.has(item.id) && item.price > 0) {
                picked.add(item.id);
                result.push(item);
                added++;
            }
        }
    }

    if (result.length < limit) {
        const fallback = searchGilesSnapshotPaged({ page: 1, pageSize: limit * 2 }).items;
        for (const item of fallback) {
            if (result.length >= limit) break;
            if (!picked.has(item.id) && item.price > 0) {
                picked.add(item.id);
                result.push(item);
            }
        }
    }
    return result.slice(0, limit);
}

export function findGilesSnapshotProductBySlugOrId(slugOrId: string): CatalogProduct | null {
    const snap = getGilesCatalogSnapshot();
    const found = lookupCatalogProductO1(slugOrId);
    if (!found) return null;

    const raw = snap.rawById.get(found.id);
    const resolvedSpecs = found.specs || found.technicalSpecs || raw?.specs || raw?.technicalSpecs || undefined;
    return {
        id: found.id,
        slug: found.slug || buildProductSlug(found.name, found.sku),
        canonicalUrl: null,
        variantId: raw?.variantId || found.id,
        sku: found.sku,
        ean: found.ean || raw?.ean || null,
        name: found.nameLt || found.name,
        description:
            found.description ||
            raw?.description ||
            raw?.descriptionLt ||
            `${found.nameLt || found.name} (${found.brandName || 'Gilės Inžinerija'}, SKU: ${found.sku}).`,
        price: found.price,
        priceCents: found.priceCents,
        // W121-A1 contract passthrough (null-safe on legacy rows).
        priceEur: found.priceEur != null ? found.priceEur : found.priceCents != null ? found.priceCents / 100 : null,
        priceOnRequest: found.priceOnRequest === true ? true : undefined,
        availability: found.availability,
        vatRate: found.vatRate,
        compareAtPrice: found.compareAtPrice,
        stock: found.stock,
        stockQuantity: found.stockQuantity ?? found.stock ?? null,
        stockUnit: found.stockUnit || 'vnt.',
        stockSource:
            found.stockSource || 'Skaita SQL · Kauno sandėlis (Eigulių g. 21, LT-51418 Kaunas)',
        lastSyncedAt: found.lastSyncedAt || snap.generatedAt,
        category: found.categoryName || 'Katilinės įranga',
        categoryId: raw?.categoryId || null,
        brand: found.brandName || 'Gilės Inžinerija',
        image: found.imageUrl || '/images/products/family-ferroli-boiler.webp',
        seriesImageUrl: found.seriesImageUrl || found.imageUrl || '/images/products/family-ferroli-boiler.webp',
        specs: resolvedSpecs,
        technicalSpecs: resolvedSpecs,
    };
}

export function getGilesCatalogProductByIdOrSlug(slugOrId: string): CatalogProduct | null {
    return findGilesSnapshotProductBySlugOrId(slugOrId);
}

export function resolveB2BQuickOrderRows(
    inputs: Array<{ code: string; qty: number }>,
): B2BQuickOrderResolvedRow[] {
    const snap = getGilesCatalogSnapshot();

    return inputs
        .filter((row) => row.code && row.code.trim().length > 0)
        .map((row) => {
            const rawCode = row.code.trim();
            const norm = rawCode.toLowerCase().replace(/[^a-z0-9]/g, '');
            const qty = Math.max(1, Number(row.qty) || 1);

            let matched = snap.bySkuNormalized.get(norm);
            if (!matched) {
                matched = snap.products.find(
                    (p) =>
                        p.sku.toLowerCase().includes(rawCode.toLowerCase()) ||
                        (p.nameLt || p.name).toLowerCase().includes(rawCode.toLowerCase()),
                );
            }

            if (!matched) {
                return {
                    inputCode: rawCode,
                    qty,
                    found: false,
                    productId: `custom-${norm}`,
                    sku: rawCode.toUpperCase(),
                    ean: '—',
                    title: `Prekė pagal kodą „${rawCode}“ (tikslinama su inžinieriumi Dariumi)`,
                    brandName: 'Užklausa',
                    stockLabel: 'Tikslinama · 1–3 d. d.',
                    retailGrossUnitEur: 100,
                    retailNetUnitEur: 82.64,
                    discountPercent: 35,
                    dealerNetUnitEur: 53.72,
                    dealerGrossUnitEur: 65.0,
                    lineTotalNetEur: Math.round(53.72 * qty * 100) / 100,
                    lineTotalGrossEur: Math.round(65.0 * qty * 100) / 100,
                    lineMarginEur: Math.round((82.64 - 53.72) * qty * 100) / 100,
                };
            }

            const raw = snap.rawById.get(matched.id);
            const retailGrossUnitEur = matched.price > 0 ? matched.price : 120;
            const retailNetUnitEur = Math.round((retailGrossUnitEur / 1.21) * 100) / 100;
            const discountPercent = resolveB2BDiscountForBrand(matched.brandName);
            const dealerNetUnitEur =
                Math.round(retailNetUnitEur * (1 - discountPercent / 100) * 100) / 100;
            const dealerGrossUnitEur = Math.round(dealerNetUnitEur * 1.21 * 100) / 100;
            const lineTotalNetEur = Math.round(dealerNetUnitEur * qty * 100) / 100;
            const lineTotalGrossEur = Math.round(dealerGrossUnitEur * qty * 100) / 100;
            const lineMarginEur =
                Math.round((retailNetUnitEur - dealerNetUnitEur) * qty * 100) / 100;

            return {
                inputCode: rawCode,
                qty,
                found: true,
                productId: matched.id,
                sku: matched.sku,
                ean: raw?.ean || '—',
                title: matched.nameLt || matched.name,
                brandName: matched.brandName || 'Gilės Inžinerija',
                stockLabel: formatShortStockBadge(matched).shortLabel,
                retailGrossUnitEur,
                retailNetUnitEur,
                discountPercent,
                dealerNetUnitEur,
                dealerGrossUnitEur,
                lineTotalNetEur,
                lineTotalGrossEur,
                lineMarginEur,
                imageUrl: matched.imageUrl,
            };
        });
}

