import { NextRequest, NextResponse } from 'next/server';
import { db, resolveStoreRow } from '@platform/database';
import { products, variants, brands, offers, productStores } from '@platform/database/schema';
import { ilike, or, eq, and, asc, inArray, type SQL } from 'drizzle-orm';
import { resolveProductImageUrl, formatCleanCatalogProductTitle } from '../../../lib/product-visuals';
import { shouldUseGilesSnapshot, searchGilesSnapshotPaged } from '../../../lib/giles-catalog-snapshot';
import {
    tokenizeHvacSearchQuery,
    expandHvacSearchTokenSynonyms,
    matchesProductRecordForSearchToken,
    scoreProductRecordForSearchQuery,
} from '../../../lib/sku-code';

function buildTokenSqlPredicate(token: string): SQL | undefined {
    const lower = token.trim().toLowerCase();
    // Filter out bare 1-2 char generic tokens when longer multi-word synonyms exist
    const rawSynonyms = expandHvacSearchTokenSynonyms(token);
    const specificSynonyms =
        rawSynonyms.length > 1
            ? rawSynonyms.filter((s) => {
                  const sl = s.trim().toLowerCase();
                  if (/^\d{1,2}$/.test(sl)) return false;
                  if (sl === 't' || sl === 'sd') return false;
                  return true;
              })
            : rawSynonyms;
    const synonyms = specificSynonyms.length > 0 ? specificSynonyms : rawSynonyms;
    if (synonyms.length === 0) return undefined;

    const clauses: SQL[] = [];
    for (const syn of synonyms) {
        const likeTerm = `%${syn}%`;
        clauses.push(
            ilike(products.titleLt, likeTerm),
            ilike(products.titleEn, likeTerm),
            ilike(products.descriptionLt, likeTerm),
            ilike(brands.name, likeTerm),
            ilike(variants.sku, likeTerm),
        );
    }
    return or(...clauses);
}

// W23-S1/S2 + W43-A1 + W47-A1 multi-word & synonym search support:
// - Tokenizes multi-word/hyphen queries into per-token AND predicates with Lithuanian HVAC stem/synonym expansion
// - Falls back to OR ranked by matched token count if strict AND returns 0 rows
// - Applies formatCleanCatalogProductTitle() to every returned item
export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');
    const requestedStoreId = searchParams.get('storeId');

    if (!query || query.trim().length < 2) {
        return NextResponse.json({ results: [] });
    }

    try {
        const trimmedQuery = query.trim();
        if (shouldUseGilesSnapshot()) {
            const paged = searchGilesSnapshotPaged({ q: trimmedQuery, page: 1, pageSize: 8 });
            return NextResponse.json({
                results: paged.items.map((p) => ({
                    id: p.id,
                    slug: p.slug,
                    name: p.nameLt || p.name,
                    price: p.price,
                    image: p.imageUrl,
                    brand: p.brandName,
                    sku: p.sku,
                    exactSkuMatch: p.exactSkuMatch,
                })),
            });
        }
        let storeProductIds: string[] = [];
        let catalogFallbackNote: string | null = null;

        if (requestedStoreId && requestedStoreId !== 'default') {
            const { store } = await resolveStoreRow(requestedStoreId);
            if (store) {
                const bound = await db
                    .select({ productId: productStores.productId })
                    .from(productStores)
                    .where(and(eq(productStores.storeId, store.id), eq(productStores.isActive, true)));
                storeProductIds = bound.map((b: { productId: string }) => b.productId);
                if (storeProductIds.length === 0) {
                    catalogFallbackNote = `Parduotuvė „${store.name}“ dar neturi priskirtų prekių – rodomas bendras platformos katalogas.`;
                }
            }
        }

        const tokens = tokenizeHvacSearchQuery(trimmedQuery);
        const tokenPredicates = tokens
            .map((t) => buildTokenSqlPredicate(t))
            .filter((p): p is SQL => Boolean(p));

        const fallbackContiguous = `%${trimmedQuery}%`;
        const strictPredicate =
            tokenPredicates.length > 0
                ? and(...tokenPredicates)
                : or(
                      ilike(products.titleEn, fallbackContiguous),
                      ilike(products.titleLt, fallbackContiguous),
                      ilike(products.descriptionLt, fallbackContiguous),
                      ilike(brands.name, fallbackContiguous),
                      ilike(variants.sku, fallbackContiguous),
                  );

        const runSelectQuery = async (searchPredicate: SQL | undefined, rowLimit = 24) =>
            db
                .selectDistinctOn([products.id], {
                    id: products.id,
                    name: products.titleLt,
                    nameEn: products.titleEn,
                    descriptionLt: products.descriptionLt,
                    priceGross: variants.priceGross,
                    image: variants.images,
                    attributes: variants.attributes,
                    sku: variants.sku,
                    brandName: brands.name,
                    supplierId: offers.supplierId,
                })
                .from(products)
                .leftJoin(variants, eq(products.id, variants.productId))
                .leftJoin(offers, eq(offers.ean, variants.ean))
                .leftJoin(brands, eq(products.brandId, brands.id))
                .where(
                    and(
                        eq(products.status, 'published'),
                        storeProductIds.length > 0 ? inArray(products.id, storeProductIds) : undefined,
                        searchPredicate,
                    ),
                )
                .orderBy(products.id, asc(variants.priceGross))
                .limit(rowLimit);

        let results = await runSelectQuery(strictPredicate, 60);

        // Fallback to OR across token predicates if strict AND returned 0 rows
        if (results.length === 0 && tokenPredicates.length > 1) {
            results = await runSelectQuery(or(...tokenPredicates), 60);
        }

        const formatted = results.map((p: any) => {
            const firstImg = Array.isArray(p.image) ? p.image[0] : p.image;
            const rawImgUrl =
                typeof firstImg === 'string'
                    ? firstImg
                    : firstImg && typeof firstImg === 'object' && typeof (firstImg as any).url === 'string'
                        ? (firstImg as any).url
                        : null;
            const rawTitle = p.name || p.nameEn || '';
            const cleanTitle = formatCleanCatalogProductTitle(rawTitle, p.sku, p.brandName);
            const score = scoreProductRecordForSearchQuery(
                {
                    titleLt: p.name,
                    titleEn: p.nameEn,
                    descriptionLt: p.descriptionLt,
                    sku: p.sku,
                    brandName: p.brandName,
                },
                trimmedQuery,
            );
            const lowerTitle = cleanTitle.toLowerCase();
            const isAccessoryPhrase = /\btinka\s+|zubeh[oö]r/i.test(cleanTitle);
            const titleTokenHits = tokens.filter((t) =>
                matchesProductRecordForSearchToken(
                    {
                        titleLt: cleanTitle,
                        sku: p.sku,
                        brandName: p.brandName,
                    },
                    t,
                ),
            ).length;
            const exactWordHits = tokens.filter((t) => {
                const tl = t.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                if (tl.length < 2) return false;
                return new RegExp(`(^|[^a-zA-ZąčęėįšųūžĄČĘĖĮŠŲŪŽ0-9])${tl}([^a-zA-ZąčęėįšųūžĄČĘĖĮŠŲŪŽ0-9]|$)`, 'i').test(cleanTitle);
            }).length;
            return {
                id: p.id,
                name: cleanTitle,
                price: p.priceGross != null ? Number(p.priceGross) / 100 : 0,
                image: resolveProductImageUrl({
                    sku: p.sku,
                    title: cleanTitle,
                    brand: p.brandName,
                    imageUrl: rawImgUrl,
                    attributes: p.attributes,
                }),
                brand: p.brandName,
                sku: p.sku,
                exactSkuMatch: p.sku ? p.sku.toLowerCase() === trimmedQuery.toLowerCase() : false,
                _matchedTokens: score.matchedTokens,
                _titlePriority: titleTokenHits * 4 + exactWordHits * 3 - (isAccessoryPhrase ? 5 : 0),
            };
        });

        // Sort: exact SKU match first, then highest number of matched query tokens, then primary title match
        formatted.sort((a: any, b: any) => {
            const exactDiff = Number(b.exactSkuMatch) - Number(a.exactSkuMatch);
            if (exactDiff !== 0) return exactDiff;
            const tokenDiff = (b._matchedTokens ?? 0) - (a._matchedTokens ?? 0);
            if (tokenDiff !== 0) return tokenDiff;
            return (b._titlePriority ?? 0) - (a._titlePriority ?? 0);
        });

        const finalResults = formatted
            .slice(0, 6)
            .map(({ _matchedTokens, _titlePriority, ...rest }: any) => rest);

        return NextResponse.json({
            results: finalResults,
            ...(catalogFallbackNote ? { catalogFallbackNote } : {}),
        });
    } catch (error) {
        console.error('Search API error:', error);
        return NextResponse.json({ error: 'Search failed' }, { status: 500 });
    }
}
