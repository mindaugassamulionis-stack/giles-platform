/**
 * Geo-detection for geo-legal UI injection (BGB §356a).
 *
 * German customers are legally entitled to a compliant "Kündigen" (cancel)
 * flow. We detect the customer's country from platform geo signals / edge
 * headers and, for DE, inject the compliant cancellation UI. Non-DE users
 * are unaffected.
 *
 * Pure functions — no framework coupling — so they are unit-testable.
 */

export type PlatformGeo = { country?: string } | undefined;

/**
 * Resolve an ISO-3166 alpha-2 country code from available signals.
 * Precedence: platform geo → x-vercel-ip-country → cf-ipcountry →
 * accept-language region subtag → null.
 */
export function detectCountry(headers: Headers, geo?: PlatformGeo): string | null {
    const fromGeo = geo?.country;
    if (fromGeo && fromGeo.trim()) {
        return fromGeo.trim().toUpperCase();
    }

    const vercel = headers.get('x-vercel-ip-country');
    if (vercel && vercel.trim()) {
        return vercel.trim().toUpperCase();
    }

    const cloudflare = headers.get('cf-ipcountry');
    if (cloudflare && cloudflare.trim()) {
        return cloudflare.trim().toUpperCase();
    }

    const acceptLanguage = headers.get('accept-language');
    const region = parseAcceptLanguageRegion(acceptLanguage);
    if (region) {
        return region;
    }

    return null;
}

/**
 * Extract a country from the first `lang-REGION` tag in an Accept-Language
 * header (e.g. "de-DE" → "DE"). A bare language ("de") is NOT a country.
 */
function parseAcceptLanguageRegion(acceptLanguage: string | null): string | null {
    if (!acceptLanguage) return null;
    for (const part of acceptLanguage.split(',')) {
        const tag = part.split(';')[0]?.trim();
        if (!tag) continue;
        const segments = tag.split('-');
        if (segments.length >= 2) {
            const region = segments[1]?.trim();
            if (region && /^[A-Za-z]{2}$/.test(region)) {
                return region.toUpperCase();
            }
        }
    }
    return null;
}

/** Countries subject to the BGB §356a cancellation-button requirement. */
const GERMAN_JURISDICTION = new Set(['DE']);

/** True when the compliant German cancellation flow must be shown. */
export function isGermanCustomer(country: string | null | undefined): boolean {
    if (!country) return false;
    return GERMAN_JURISDICTION.has(country.trim().toUpperCase());
}
