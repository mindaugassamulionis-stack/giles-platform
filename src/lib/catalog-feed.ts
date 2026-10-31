import { sql } from 'drizzle-orm';
import { db } from '@platform/database';
import { storeIdOrThrow, buildProductSlug } from './catalog';
import {
    formatCleanCatalogProductTitle,
    inferProductBrandName,
    parseV3Description,
} from './v3-description';
import { PRODUCTION_PRIMARY_DOMAIN } from './domain-routing';

export const SHARED_IMAGE_LIMIT = 3;

export interface RawFeedProductRow {
    id: string;
    slug?: string | null;
    canonical_url?: string | null;
    title_lt?: string | null;
    title_en?: string | null;
    description_lt?: string | null;
    description_en?: string | null;
    brand?: string | null;
    category?: string | null;
    sku: string;
    ean?: string | null;
    price_gross_cents: number | null;
    compare_at_cents?: number | null;
    stock?: number | null;
    track_inventory?: boolean | null;
    allow_backorder?: boolean | null;
    inventory_status?: string | null;
    images?: Array<{ url?: string; slot?: string; type?: string; source_url?: string; sha256?: string }> | null;
    main_image_shared_by: number;
    store_domain?: string | null;
}

export interface CatalogFeedItem {
    id: string;
    mpn: string;
    product_id: string;
    slug: string;
    title: string;
    description: string;
    availability: 'in stock' | 'out of stock';
    condition: 'new';
    price: string;
    link: string;
    image_link: string;
    brand: string;
    category?: string;
    price_gross_cents: number;
    main_image_shared_by: number;
    ad_ready: true;
}

export function evaluateAdReadiness(row: RawFeedProductRow): { adReady: boolean; reasons: string[] } {
    const reasons: string[] = [];
    const images = Array.isArray(row.images)
        ? row.images.filter((img) => img && typeof img === 'object' && typeof img.url === 'string' && img.url.trim().length > 0)
        : [];
    const sharedBy = Number(row.main_image_shared_by ?? 0);

    if (images.length === 0) {
        reasons.push('no product image');
    } else if (sharedBy > SHARED_IMAGE_LIMIT) {
        reasons.push(`main image is shared by ${sharedBy} products (a family picture, not this item)`);
    }

    const priceCents = Number(row.price_gross_cents ?? 0);
    if (!Number.isFinite(priceCents) || priceCents <= 0) {
        reasons.push('no price');
    }

    const slug = (row.slug || '').trim();
    if (!slug) {
        reasons.push('no product URL (slug empty)');
    }

    const stock = Number(row.stock ?? 0);
    if (row.track_inventory && stock <= 0) {
        if (row.inventory_status === 'in_stock') {
            reasons.push(`stock ${row.stock} (inventory_status says ${row.inventory_status}: the stock data contradicts itself)`);
        } else {
            reasons.push('out of stock');
        }
    }

    const compareAt = Number(row.compare_at_cents ?? 0);
    if (compareAt > 0 && compareAt > priceCents) {
        reasons.push('has an old price: a discount may be shown only with the lowest price of the previous 30 days (Omnibus)');
    }

    return { adReady: reasons.length === 0, reasons };
}

export function isAdReadyFeedRow(row: RawFeedProductRow): boolean {
    return evaluateAdReadiness(row).adReady;
}

function cleanFeedDescription(rawDesc: string, cleanTitle: string, brand: string, sku: string): string {
    const parsed = parseV3Description(rawDesc || '');
    const parts = [parsed.hook, parsed.plainLayer, parsed.purpose]
        .map((s) => (s || '').trim())
        .filter(Boolean);
    const combined = parts.length > 0 ? parts.join(' ') : (rawDesc || '').trim();
    const cleaned = combined
        .replace(/###\s*[^\n]+/g, ' ')
        .replace(/\|[^\n]+\|/g, ' ')
        .replace(/\*\*([^*]+)\*\*/g, '$1')
        .replace(/\u2014/g, '–')
        .replace(/\s+/g, ' ')
        .trim();
    if (cleaned.length >= 20) {
        return cleaned.slice(0, 700);
    }
    return `${cleanTitle} (${brand}, gamintojo kodas ${sku}) – originali ŠVOK inžinerinė įranga su 24 mėn. garantija ir pristatymu Lietuvoje.`.slice(0, 700);
}

export function resolveFeedDomain(storeDomain?: string | null): string {
    const cleaned = (storeDomain || process.env.STORE_PUBLIC_DOMAIN || '').trim().replace(/^https?:\/\//, '').replace(/\/+$/, '');
    if (!cleaned || /^suradai\.lt$/i.test(cleaned) || /^(127\.0\.0\.1|localhost)(:\d+)?$/i.test(cleaned)) {
        return PRODUCTION_PRIMARY_DOMAIN;
    }
    return cleaned;
}

export function resolveFeedImageLink(imageUrl: string, storeDomain?: string | null): string {
    const trimmed = (imageUrl || '').trim();
    if (/^https?:\/\//i.test(trimmed)) {
        return trimmed;
    }
    const domain = resolveFeedDomain(storeDomain);
    const normalizedPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
    return `https://${domain}${normalizedPath}`;
}

export function mapRowToCatalogFeedItem(row: RawFeedProductRow, defaultDomain?: string): CatalogFeedItem {
    const sku = (row.sku || row.id || '').trim();
    const rawTitle = (row.title_lt || row.title_en || sku).trim();
    const rawDesc = (row.description_lt || row.description_en || '').trim();
    const resolvedBrand = inferProductBrandName({
        brand: row.brand,
        title: rawTitle,
        sku,
        description: rawDesc,
    });
    const cleanTitle = formatCleanCatalogProductTitle(rawTitle, sku, resolvedBrand);
    const slug = (row.slug || '').trim() || buildProductSlug(cleanTitle, sku);
    const domain = resolveFeedDomain(row.store_domain || defaultDomain);
    const primaryImageUrl = (Array.isArray(row.images) && row.images[0]?.url) || `/images/products/${sku.toLowerCase()}.webp`;
    const priceCents = Math.max(0, Number(row.price_gross_cents ?? 0));
    const priceEurFormatted = `${(priceCents / 100).toFixed(2)} EUR`;

    const stock = Number(row.stock ?? 0);
    const isAvailable = stock > 0 || (!row.track_inventory && row.allow_backorder !== false);

    return {
        id: sku || row.id,
        mpn: sku || row.id,
        product_id: row.id,
        slug,
        title: cleanTitle,
        description: cleanFeedDescription(rawDesc, cleanTitle, resolvedBrand, sku),
        availability: isAvailable ? 'in stock' : 'out of stock',
        condition: 'new',
        price: priceEurFormatted,
        link: `https://${domain}/lt/products/${slug}`,
        image_link: resolveFeedImageLink(primaryImageUrl, domain),
        brand: resolvedBrand,
        category: row.category || 'Šildymo ir santechnikos įranga',
        price_gross_cents: priceCents,
        main_image_shared_by: Number(row.main_image_shared_by ?? 1),
        ad_ready: true,
    };
}

export function buildCatalogFeedItems(rows: RawFeedProductRow[], defaultDomain?: string): CatalogFeedItem[] {
    return rows
        .filter(isAdReadyFeedRow)
        .map((row) => mapRowToCatalogFeedItem(row, defaultDomain));
}

function escapeXml(value: string): string {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

export function formatCatalogFeedXml(items: CatalogFeedItem[], storeDomain?: string | null): string {
    const domain = resolveFeedDomain(storeDomain);
    const itemXml = items
        .map(
            (item) => `    <item>
      <g:id>${escapeXml(item.id)}</g:id>
      <g:mpn>${escapeXml(item.mpn)}</g:mpn>
      <title>${escapeXml(item.title)}</title>
      <g:title>${escapeXml(item.title)}</g:title>
      <description>${escapeXml(item.description)}</description>
      <g:description>${escapeXml(item.description)}</g:description>
      <link>${escapeXml(item.link)}</link>
      <g:link>${escapeXml(item.link)}</g:link>
      <g:image_link>${escapeXml(item.image_link)}</g:image_link>
      <g:availability>${escapeXml(item.availability)}</g:availability>
      <g:condition>${escapeXml(item.condition)}</g:condition>
      <g:price>${escapeXml(item.price)}</g:price>
      <g:brand>${escapeXml(item.brand)}</g:brand>
    </item>`,
        )
        .join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>Gilės Inžinerija – Šildymo, santechnikos ir inžinerinių sistemų centras</title>
    <link>https://${escapeXml(domain)}/lt</link>
    <description>Oficialus Danfoss, IMI Heimeier, IMI Pneumatex, IMI TA ir Ferroli inžinerinės įrangos katalogas</description>
${itemXml}
  </channel>
</rss>`;
}

function rowsOf(result: unknown): any[] {
    const r = result as any;
    return Array.isArray(r) ? r : (r?.rows ?? []);
}

export async function queryAdReadyFeedRows(limit = 500): Promise<RawFeedProductRow[]> {
    try {
        const sid = await storeIdOrThrow();
        const result = await db.execute(sql`
            with scoped as (
                select
                    p.id,
                    p.slug,
                    p.canonical_url,
                    p.title_lt,
                    p.title_en,
                    p.description_lt,
                    p.description_en,
                    b.name as brand,
                    c.name as category,
                    v.sku,
                    v.ean,
                    v.price_gross as price_gross_cents,
                    v.compare_at_price as compare_at_cents,
                    v.stock,
                    v.track_inventory,
                    v.allow_backorder,
                    v.inventory_status,
                    v.images::jsonb as images,
                    v.images::jsonb->0->>'url' as primary_image_url,
                    s.domain as store_domain
                from products p
                join stores s on s.id::text = p.store_id::text
                join variants v on v.product_id = p.id
                left join brands b on b.id = p.brand_id
                left join categories c on c.id = p.category_id
                where p.store_id::text = ${sid}
                  and p.status = 'published'
                  and coalesce(v.sku, '') not ilike 'SUR-DEMO-%'
                  and coalesce(v.sku, '') not ilike 'W16D1-%'
            ),
            img as (
                select primary_image_url as url, count(*)::int as n
                from scoped
                where coalesce(primary_image_url, '') <> ''
                group by 1
            )
            select
                scoped.id,
                scoped.slug,
                scoped.canonical_url,
                scoped.title_lt,
                scoped.title_en,
                scoped.description_lt,
                scoped.description_en,
                scoped.brand,
                scoped.category,
                scoped.sku,
                scoped.ean,
                scoped.price_gross_cents,
                scoped.compare_at_cents,
                scoped.stock,
                scoped.track_inventory,
                scoped.allow_backorder,
                scoped.inventory_status,
                scoped.images,
                coalesce(img.n, 0)::int as main_image_shared_by,
                scoped.store_domain
            from scoped
            left join img on img.url = scoped.primary_image_url
            where coalesce(scoped.primary_image_url, '') <> ''
              and coalesce(img.n, 0) between 1 and ${SHARED_IMAGE_LIMIT}
              and coalesce(scoped.price_gross_cents, 0) > 0
              and coalesce(nullif(trim(scoped.slug), ''), '') <> ''
              and not (coalesce(scoped.track_inventory, true) = true and coalesce(scoped.stock, 0) <= 0)
              and not (coalesce(scoped.compare_at_cents, 0) > coalesce(scoped.price_gross_cents, 0))
            order by img.n asc, scoped.price_gross_cents desc nulls last
            limit ${limit}
        `);
        return rowsOf(result) as RawFeedProductRow[];
    } catch (error) {
        console.error('[feed] queryAdReadyFeedRows failed:', error);
        return [];
    }
}
