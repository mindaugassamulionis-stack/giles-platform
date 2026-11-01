// WP-W121-A2: honest price/availability UI contract against the catalog field
// contract from WP-W121-A1. Every helper is null-safe on legacy snapshot rows
// that predate the priceOnRequest/availability/stockQty fields.
import type { AppLocale } from '../i18n/routing';

export type CatalogAvailability = 'in_stock' | 'supplier_2_4d' | 'on_request';

export interface HonestCommerceSource {
    priceCents?: number | null;
    priceEur?: number | null;
    price?: number;
    priceOnRequest?: boolean | true;
    availability?: CatalogAvailability | null;
    stock?: number | null;
    stockQuantity?: number | null;
    stockQty?: number | null;
    stockSource?: string | null;
}

export function isPriceOnRequestProduct(p: HonestCommerceSource): boolean {
    if (p.priceOnRequest === true) return true;
    // priceEur is the authoritative W121-A1 price when present (null = no price).
    if (p.priceEur !== undefined) return !(p.priceEur != null && p.priceEur > 0);
    if (p.priceCents != null && p.priceCents > 0) return false;
    if (typeof p.price === 'number' && p.price > 0) return false;
    return true;
}

export function resolveHonestAvailability(p: HonestCommerceSource): CatalogAvailability {
    if (p.availability === 'in_stock' || p.availability === 'supplier_2_4d' || p.availability === 'on_request') {
        return p.availability;
    }
    if ((p.stockSource || '').includes('Tiekėjo')) return 'supplier_2_4d';
    const qty = p.stockQty ?? p.stockQuantity ?? p.stock;
    if (typeof qty === 'number' && qty > 0) return 'in_stock';
    return 'on_request';
}

export const HONEST_AVAILABILITY_COPY: Record<
    AppLocale,
    { inStock: string; supplier: string; onRequest: string }
> = {
    lt: { inStock: 'Sandėlyje · Kaunas', supplier: 'Tiekėjo sandėlyje · 2–4 d. d.', onRequest: 'Pagal užklausą' },
    en: { inStock: 'In stock · Kaunas', supplier: 'Supplier warehouse · 2–4 bus. days', onRequest: 'On request' },
    pl: { inStock: 'W magazynie · Kowno', supplier: 'Magazyn dostawcy · 2–4 dni rob.', onRequest: 'Na zapytanie' },
    ru: { inStock: 'В наличии · Каунас', supplier: 'Склад поставщика · 2–4 раб. дн.', onRequest: 'По запросу' },
};

export function honestAvailabilityLabel(kind: CatalogAvailability, locale: AppLocale): string {
    const copy = HONEST_AVAILABILITY_COPY[locale] || HONEST_AVAILABILITY_COPY.lt;
    if (kind === 'in_stock') return copy.inStock;
    if (kind === 'supplier_2_4d') return copy.supplier;
    return copy.onRequest;
}

export const PRICE_REQUEST_COPY: Record<
    AppLocale,
    { onRequestLabel: string; cta: string; addToRequest: string; chatPrompt: (sku: string, title?: string) => string }
> = {
    lt: {
        onRequestLabel: 'Kaina pagal užklausą',
        cta: 'Gauti kainą per 15 min.',
        addToRequest: 'Įtraukti į užklausą',
        chatPrompt: (sku, title) =>
            `Sveiki, ${title ? `domina ${title} (` : 'domintų prekė ('}SKU: ${sku}). Kokia dabartinė kaina ir terminas?`,
    },
    en: {
        onRequestLabel: 'Price on request',
        cta: 'Get the price in 15 min',
        addToRequest: 'Add to request',
        chatPrompt: (sku, title) =>
            `Hello, I am interested in ${title ? `${title} (` : 'an item ('}SKU: ${sku}). What is the current price and lead time?`,
    },
    pl: {
        onRequestLabel: 'Cena na zapytanie',
        cta: 'Otrzymaj cenę w 15 min',
        addToRequest: 'Dodaj do zapytania',
        chatPrompt: (sku, title) =>
            `Dzień dobry, interesuje mnie ${title ? `${title} (` : 'produkt ('}SKU: ${sku}). Jaka jest aktualna cena i termin dostawy?`,
    },
    ru: {
        onRequestLabel: 'Цена по запросу',
        cta: 'Узнать цену за 15 мин',
        addToRequest: 'Добавить в запрос',
        chatPrompt: (sku, title) =>
            `Здравствуйте, интересует ${title ? `${title} (` : 'товар ('}SKU: ${sku}). Какая текущая цена и срок поставки?`,
    },
};

// Price filter predicate shared by the snapshot search loop: priceless rows
// are excluded only while a price bound is active; unfiltered views keep them.
export function matchesPriceFilter(
    p: Pick<HonestCommerceSource, 'priceCents'>,
    minCents?: number | null,
    maxCents?: number | null,
): boolean {
    if (minCents == null && maxCents == null) return true;
    const cents = p.priceCents;
    if (cents == null) return false;
    if (minCents != null && cents < minCents) return false;
    if (maxCents != null && cents > maxCents) return false;
    return true;
}

export function formatCatalogCount(count: number, locale: AppLocale | 'lt' | string): string {
    const tag =
        locale === 'en' ? 'en-US' : locale === 'pl' ? 'pl-PL' : locale === 'ru' ? 'ru-RU' : 'lt-LT';
    // Normalize NBSP / narrow NBSP to a plain space so rendered copy matches
    // the site's existing "6 337" spacing byte-for-byte.
    return new Intl.NumberFormat(tag).format(count).replace(/[\u00A0\u202F]/g, ' ');
}
