import type { ListingProduct } from './catalog-listing';
import {
    getGilesCatalogSnapshot,
    getCatalogOverridesMtime,
    type RawSnapshotProduct,
} from './giles-catalog-snapshot';

export type GilesCatalogProduct = ListingProduct;

export interface CatalogSearchIndex {
    builtAt: number;
    overridesMtime: number;
    totalProducts: number;
    products: GilesCatalogProduct[];
    rawById: Map<string, RawSnapshotProduct>;
    byIdOrSlug: Map<string, GilesCatalogProduct>;
    byCategory: Map<string, GilesCatalogProduct[]>;
    byBrand: Map<string, GilesCatalogProduct[]>;
    invertedTokenIndex: Map<string, Set<number>>;
    searchHaystacksLower: string[];
    normalizedSkus: string[];
}

let cachedIndex: CatalogSearchIndex | null = null;
let cachedIndexSnapshotRef: unknown = null;

const DIACRITIC_MAP: Record<string, string> = {
    ą: 'a', č: 'c', ę: 'e', ė: 'e', į: 'i', š: 's', ų: 'u', ū: 'u', ž: 'z',
    Ą: 'a', Č: 'c', Ę: 'e', Ė: 'e', Į: 'i', Š: 's', Ų: 'u', Ū: 'u', Ž: 'z',
    ł: 'l', Ł: 'l',
};

export function normalizeSearchToken(input: string): string {
    return (input || '')
        .replace(/[ąčęėįšųūžĄČĘĖĮŠŲŪŽłŁ]/g, (ch) => DIACRITIC_MAP[ch] || ch)
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();
}

export function normalizeAlnumCode(code: string): string {
    return normalizeSearchToken(code).replace(/[^a-z0-9]/g, '');
}

export function stemLithuanianHvacToken(word: string): string {
    return word
        .replace(/(degikliai|degiklis|degikliu|degikliams)$/i, 'degikl')
        .replace(/(katilai|katilas|katilu|katilams|katilines|katiline)$/i, 'katil')
        .replace(/(siurbliai|siurblys|siurbliu|siurbliams)$/i, 'siurbl')
        .replace(/(radiatoriai|radiatorius|radiatoriu)$/i, 'radiator')
        .replace(/(boileriai|boileris|boileriu)$/i, 'boiler')
        .replace(/(voztuvai|voztuvas|voztuvu)$/i, 'voztuv')
        .replace(/(kolektoriai|kolektorius|kolektoriu)$/i, 'kolektor')
        .replace(/(galvutes|galvute)$/i, 'galvut');
}

function extractIndexTokens(text: string): string[] {
    const norm = normalizeSearchToken(text);
    const rawTokens = norm.split(/[^a-z0-9.+-]+/).filter((t) => t.length >= 2);
    const out = new Set<string>();

    for (const tok of rawTokens) {
        out.add(tok);
        const alnum = tok.replace(/[^a-z0-9]/g, '');
        if (alnum.length >= 2) {
            out.add(alnum);
            const stemmed = stemLithuanianHvacToken(alnum);
            if (stemmed.length >= 2) {
                out.add(stemmed);
            }
            const maxPrefix = Math.min(alnum.length, 8);
            for (let len = 3; len <= maxPrefix; len++) {
                out.add(alnum.slice(0, len));
            }
        }
    }
    return Array.from(out);
}

function addCategoryBucket(
    map: Map<string, GilesCatalogProduct[]>,
    key: string | null | undefined,
    product: GilesCatalogProduct,
): void {
    if (!key) return;
    const norm = normalizeSearchToken(key);
    if (!norm) return;
    let bucket = map.get(norm);
    if (!bucket) {
        bucket = [];
        map.set(norm, bucket);
    }
    bucket.push(product);

    const rawLower = key.trim().toLowerCase();
    if (rawLower && rawLower !== norm) {
        let rawBucket = map.get(rawLower);
        if (!rawBucket) {
            rawBucket = [];
            map.set(rawLower, rawBucket);
        }
        rawBucket.push(product);
    }
}

export function invalidateCatalogSearchIndex(): void {
    cachedIndex = null;
    cachedIndexSnapshotRef = null;
}

export function getCatalogSearchIndex(): CatalogSearchIndex {
    const snap = getGilesCatalogSnapshot();
    const currentMtime = getCatalogOverridesMtime();

    if (
        cachedIndex &&
        cachedIndexSnapshotRef === snap &&
        cachedIndex.overridesMtime === currentMtime
    ) {
        return cachedIndex;
    }

    const byIdOrSlug = new Map<string, GilesCatalogProduct>();
    const byCategory = new Map<string, GilesCatalogProduct[]>();
    const byBrand = new Map<string, GilesCatalogProduct[]>();
    const invertedTokenIndex = new Map<string, Set<number>>();
    const searchHaystacksLower: string[] = new Array(snap.products.length);
    const normalizedSkus: string[] = new Array(snap.products.length);

    for (let idx = 0; idx < snap.products.length; idx++) {
        const p = snap.products[idx];
        const raw = snap.rawById.get(p.id);

        const idLower = p.id.toLowerCase();
        const slugLower = (p.slug || '').toLowerCase();
        const skuLower = p.sku.toLowerCase();
        const normSku = normalizeAlnumCode(p.sku);
        normalizedSkus[idx] = normSku;

        byIdOrSlug.set(idLower, p);
        if (slugLower) {
            byIdOrSlug.set(slugLower, p);
        }
        if (skuLower && !byIdOrSlug.has(skuLower)) {
            byIdOrSlug.set(skuLower, p);
        }
        if (normSku && !byIdOrSlug.has(normSku)) {
            byIdOrSlug.set(normSku, p);
        }
        if (raw?.ean) {
            const normEan = normalizeAlnumCode(raw.ean);
            if (normEan && !byIdOrSlug.has(normEan)) {
                byIdOrSlug.set(normEan, p);
            }
        }

        addCategoryBucket(byCategory, p.categoryName, p);
        addCategoryBucket(byCategory, p.categorySlug, p);
        addCategoryBucket(byCategory, raw?.categoryId, p);

        const brandSlug = normalizeSearchToken(p.brandName || '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
        addCategoryBucket(byBrand, p.brandName, p);
        addCategoryBucket(byBrand, brandSlug, p);
        addCategoryBucket(byBrand, raw?.brandId, p);

        const fullHaystack = `${p.sku} ${p.name} ${p.nameLt || ''} ${p.brandName || ''} ${p.categoryName || ''} ${raw?.descriptionLt || ''} ${raw?.ean || ''}`.toLowerCase();
        searchHaystacksLower[idx] = fullHaystack;

        const indexableText = `${p.sku} ${p.name} ${p.nameLt || ''} ${p.brandName || ''} ${p.categoryName || ''} ${raw?.ean || ''}`;
        const tokens = extractIndexTokens(indexableText);
        for (const token of tokens) {
            let set = invertedTokenIndex.get(token);
            if (!set) {
                set = new Set<number>();
                invertedTokenIndex.set(token, set);
            }
            set.add(idx);
        }
    }

    cachedIndex = {
        builtAt: Date.now(),
        overridesMtime: currentMtime,
        totalProducts: snap.products.length,
        products: snap.products,
        rawById: snap.rawById,
        byIdOrSlug,
        byCategory,
        byBrand,
        invertedTokenIndex,
        searchHaystacksLower,
        normalizedSkus,
    };
    cachedIndexSnapshotRef = snap;
    return cachedIndex;
}

export function lookupCatalogProductO1(slugOrIdOrSku: string): GilesCatalogProduct | undefined {
    const rawKey = decodeURIComponent(slugOrIdOrSku || '').trim().toLowerCase();
    if (!rawKey) return undefined;
    const index = getCatalogSearchIndex();
    const direct = index.byIdOrSlug.get(rawKey) || index.byIdOrSlug.get(normalizeAlnumCode(rawKey));
    if (direct) return direct;

    for (const p of index.products) {
        if ((p.slug || '').toLowerCase().endsWith(`-${rawKey}`)) {
            index.byIdOrSlug.set(rawKey, p);
            return p;
        }
    }
    return undefined;
}

export function queryInvertedCandidateIndices(rawQuery: string): Set<number> | null {
    const trimmed = (rawQuery || '').trim();
    if (!trimmed) return null;

    const index = getCatalogSearchIndex();
    const groups = trimmed
        .toLowerCase()
        .split(/\s*\/\s*|\s+ir\s+|\s+or\s+/)
        .map((g) => g.trim())
        .filter(Boolean);

    if (groups.length === 0) return null;

    const unionIndices = new Set<number>();

    for (const group of groups) {
        const rawTokens = normalizeSearchToken(group)
            .split(/[\s,;()]+/)
            .map((t) => stemLithuanianHvacToken(t.replace(/[^a-z0-9]/g, '')))
            .filter((t) => t.length >= 2);

        if (rawTokens.length === 0) continue;

        let groupSet: Set<number> | null = null;
        for (const tok of rawTokens) {
            const lookupKey = tok.length > 8 ? tok.slice(0, 8) : tok;
            const postings = index.invertedTokenIndex.get(tok) || index.invertedTokenIndex.get(lookupKey);
            if (!postings || postings.size === 0) {
                groupSet = new Set<number>();
                break;
            }
            if (groupSet === null) {
                groupSet = new Set<number>(postings);
            } else {
                const nextIntersection = new Set<number>();
                for (const id of groupSet) {
                    if (postings.has(id)) {
                        nextIntersection.add(id);
                    }
                }
                groupSet = nextIntersection;
                if (groupSet.size === 0) break;
            }
        }

        if (groupSet) {
            for (const idx of groupSet) {
                unionIndices.add(idx);
            }
        }
    }

    return unionIndices;
}

export function searchCatalogIndex(params: {
    q?: string;
    category?: string;
    brand?: string;
}): GilesCatalogProduct[] {
    const index = getCatalogSearchIndex();
    const q = (params.q || '').trim();
    const category = (params.category || '').trim();
    const brand = (params.brand || '').trim();

    if (!q && !category && !brand) {
        return index.products;
    }

    let basePool: GilesCatalogProduct[] | null = null;
    if (brand && brand.toLowerCase() !== 'visi') {
        const bNorm = normalizeSearchToken(brand).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
        basePool = index.byBrand.get(bNorm) || index.byBrand.get(brand.toLowerCase()) || [];
    }

    if (category && category.toLowerCase() !== 'visi') {
        const cNorm = normalizeSearchToken(category);
        const catPool = index.byCategory.get(cNorm) || index.byCategory.get(category.toLowerCase()) || [];
        if (basePool === null) {
            basePool = catPool;
        } else {
            const catSet = new Set(catPool.map((p) => p.id));
            basePool = basePool.filter((p) => catSet.has(p.id));
        }
    }

    if (!q) {
        return basePool ?? index.products;
    }

    const candidateIndices = queryInvertedCandidateIndices(q);
    if (!candidateIndices || candidateIndices.size === 0) {
        return [];
    }

    const allowedIds = basePool ? new Set(basePool.map((p) => p.id)) : null;
    const results: GilesCatalogProduct[] = [];
    for (const idx of candidateIndices) {
        const p = index.products[idx];
        if (p && (!allowedIds || allowedIds.has(p.id))) {
            results.push(p);
        }
    }
    return results;
}
