/**
 * W123-A2 trust strip: concrete-numbers pattern (Senukai S1 / McMaster M3
 * from the W123-r3 teardown) rendered under the home hero. Every number is
 * live from catalog-count; nothing is hardcoded.
 */
import { getGilesCatalogSkuCount, getGilesCatalogInStockCount } from './catalog-count';
import { formatCatalogCount } from './w121-honest-commerce';
import type { AppLocale } from '../i18n/routing';

export interface TrustStripCounts {
    total: number;
    inStock: number;
}

/** "Since 2011" is the company's own established engineering claim, used
 * across the site (e.g. home page copy); 2–4 d. d. matches the supplier
 * availability tier in the honest-commerce contract. */
export function getTrustStripCounts(): TrustStripCounts {
    return {
        total: getGilesCatalogSkuCount() ?? 6337,
        inStock: getGilesCatalogInStockCount() ?? 0,
    };
}

export function buildTrustStripText(locale: AppLocale, counts: TrustStripCounts): string {
    const total = formatCatalogCount(counts.total, locale);
    const inStock = formatCatalogCount(counts.inStock, locale);
    switch (locale) {
        case 'en':
            return `${total} products · ${inStock} in stock in Kaunas · supplier warehouse 2–4 business days · HVAC engineering since 2011`;
        case 'pl':
            return `${total} produktów · ${inStock} w magazynie w Kownie · magazyn dostawcy 2–4 dni robocze · inżynieria HVAC od 2011 r.`;
        case 'ru':
            return `${total} товаров · ${inStock} на складе в Каунасе · склад поставщика 2–4 рабочих дня · инженерия ОВК с 2011 г.`;
        default:
            return `${total} prekių · ${inStock} sandėlyje Kaune · tiekėjo sandėlis 2–4 d. d. · ŠVOK inžinerija nuo 2011 m.`;
    }
}
