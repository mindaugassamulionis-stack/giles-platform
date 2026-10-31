import { describe, expect, it } from 'vitest';
import { FALLBACK_BRAND_NAME, resolveBrandName, withBrandSuffix } from './brand';
import { stripLegacySkuTail } from './product-text';

describe('lib/brand store-aware title suffix (W118-A2 finding 3)', () => {
    it('falls back to the Gilės brand when the store is the shared Suradai store', () => {
        expect(resolveBrandName('Suradai.lt')).toBe(FALLBACK_BRAND_NAME);
        expect(resolveBrandName('suradai')).toBe(FALLBACK_BRAND_NAME);
        expect(resolveBrandName('Fill.lt')).toBe(FALLBACK_BRAND_NAME);
    });

    it('keeps any other store brand untouched (works for any store id)', () => {
        expect(resolveBrandName('Aurora')).toBe('Aurora');
        expect(resolveBrandName('Gilės Inžinerija')).toBe('Gilės Inžinerija');
    });

    it('falls back on empty or missing store names', () => {
        expect(resolveBrandName(null)).toBe(FALLBACK_BRAND_NAME);
        expect(resolveBrandName('')).toBe(FALLBACK_BRAND_NAME);
        expect(resolveBrandName('   ')).toBe(FALLBACK_BRAND_NAME);
    });

    it('builds the title suffix', () => {
        expect(withBrandSuffix('Mokslas', FALLBACK_BRAND_NAME)).toBe(
            `Mokslas | ${FALLBACK_BRAND_NAME}`,
        );
    });
});

describe('lib/product-text legacy SKU tail strip (W118-A2 finding 13)', () => {
    it('strips a trailing "SKU: <code>," junk tail from stored descriptions', () => {
        expect(stripLegacySkuTail('Vožtuvas DN15. SKU: 0381-01.000,')).toBe('Vožtuvas DN15.');
        expect(stripLegacySkuTail('Vožtuvas DN15. SKU: 0381-01.000')).toBe('Vožtuvas DN15.');
        expect(stripLegacySkuTail('Vožtuvas DN15. (SKU: 0381-01.000)')).toBe('Vožtuvas DN15.');
    });

    it('keeps legitimate in-sentence SKU mentions', () => {
        expect(stripLegacySkuTail('Originali dalis (SKU: GI-1, DN15) tinka katilams.')).toBe(
            'Originali dalis (SKU: GI-1, DN15) tinka katilams.',
        );
    });

    it('returns clean text unchanged', () => {
        expect(stripLegacySkuTail('Grįžtamojo srauto valdymas DN 15.')).toBe(
            'Grįžtamojo srauto valdymas DN 15.',
        );
    });
});
