import { describe, test, expect } from 'vitest';
import { detectCountry, isGermanCustomer } from './geo';

// BGB §356a geo-detection: German customers must receive the compliant
// "Kündigen" cancellation flow. Detection precedence:
//   1. platform geo (Vercel request.geo.country)
//   2. x-vercel-ip-country header
//   3. cf-ipcountry header (Cloudflare)
//   4. accept-language region subtag
//   5. null (unknown)

function h(entries: Record<string, string>): Headers {
    return new Headers(entries);
}

describe('detectCountry', () => {
    test('prefers platform geo.country over headers', () => {
        const headers = h({ 'x-vercel-ip-country': 'FR', 'cf-ipcountry': 'US' });
        expect(detectCountry(headers, { country: 'DE' })).toBe('DE');
    });

    test('falls back to x-vercel-ip-country when no geo', () => {
        const headers = h({ 'x-vercel-ip-country': 'de' });
        expect(detectCountry(headers)).toBe('DE');
    });

    test('falls back to cf-ipcountry when vercel header absent', () => {
        const headers = h({ 'cf-ipcountry': 'DE' });
        expect(detectCountry(headers)).toBe('DE');
    });

    test('derives country from accept-language region subtag', () => {
        const headers = h({ 'accept-language': 'de-DE,de;q=0.9,en;q=0.8' });
        expect(detectCountry(headers)).toBe('DE');
    });

    test('does not treat bare language (no region) as a country', () => {
        const headers = h({ 'accept-language': 'de,en;q=0.8' });
        expect(detectCountry(headers)).toBeNull();
    });

    test('returns null when nothing is detectable', () => {
        expect(detectCountry(h({}))).toBeNull();
    });

    test('normalizes to uppercase ISO-3166 alpha-2', () => {
        expect(detectCountry(h({ 'x-vercel-ip-country': 'lt' }))).toBe('LT');
    });
});

describe('isGermanCustomer', () => {
    test('true for DE', () => {
        expect(isGermanCustomer('DE')).toBe(true);
    });

    test('case-insensitive', () => {
        expect(isGermanCustomer('de')).toBe(true);
    });

    test('false for other countries', () => {
        expect(isGermanCustomer('LT')).toBe(false);
        expect(isGermanCustomer('FR')).toBe(false);
    });

    test('false for null/undefined', () => {
        expect(isGermanCustomer(null)).toBe(false);
        expect(isGermanCustomer(undefined)).toBe(false);
    });
});
