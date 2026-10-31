// Store-aware brand name for customer-facing titles (W118-A2 finding 3).
// Store identity is fail-closed since WP-W119-A2 (STORE_SLUG=giles-inzinierija);
// this mask stays as armor so a foreign store name can never leak into titles.
export const FALLBACK_BRAND_NAME = 'GILĖS INŽINERIJA';

const NON_GILES_BRAND = /suradai|fill\.lt/i;

export function resolveBrandName(rawStoreName: string | null | undefined): string {
    const raw = (rawStoreName ?? '').trim();
    if (!raw || NON_GILES_BRAND.test(raw)) return FALLBACK_BRAND_NAME;
    return raw;
}

export async function getBrandName(): Promise<string> {
    try {
        const { getStore } = await import('./storefront-content');
        const store = await getStore();
        return resolveBrandName(store?.name);
    } catch {
        return FALLBACK_BRAND_NAME;
    }
}

export function withBrandSuffix(title: string, brand: string): string {
    return `${title} | ${brand}`;
}
