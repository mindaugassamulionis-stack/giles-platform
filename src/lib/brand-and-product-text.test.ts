import { describe, expect, it } from 'vitest';
import { FALLBACK_BRAND_NAME, resolveBrandName, withBrandSuffix } from './brand';
import { formatLtDecimalCommas, stripLegacySkuTail } from './product-text';
import { localizeSpecValue } from './product-i18n';

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

describe('lib/product-text embedded manufacturer-code parenthetical (W120-A1, P2-14)', () => {
    it('removes the "(…, gamintojo kodas SKU: <code>, EAN: <n>)" parenthetical mid-string', () => {
        const legacy =
            'Grįžtamo srauto vožtuvas Raditec, kampinis, DN 10 (Rp 3/8), Kvs 1.01, PN 10, nikeliuotas žalvaris – 0381-01.000 ' +
            '(IMI Heimeier, gamintojo kodas SKU: 0381-01.000, EAN: 4770005546033) – IMI Heimeier Vekolux / Regulux inžinerinis komponentas';
        expect(stripLegacySkuTail(legacy)).toBe(
            'Grįžtamo srauto vožtuvas Raditec, kampinis, DN 10 (Rp 3/8), Kvs 1.01, PN 10, nikeliuotas žalvaris – 0381-01.000 – IMI Heimeier Vekolux / Regulux inžinerinis komponentas',
        );
    });

    it('also removes the parenthetical without an EAN part', () => {
        expect(stripLegacySkuTail('Vožtuvas DN15 (gamintojo kodas SKU: GI-1) tinka katilams.')).toBe(
            'Vožtuvas DN15 tinka katilams.',
        );
    });

    it('keeps the trailing-tail behavior and legitimate SKU mentions intact', () => {
        expect(stripLegacySkuTail('Vožtuvas DN15. SKU: 0381-01.000,')).toBe('Vožtuvas DN15.');
        expect(stripLegacySkuTail('Originali dalis (SKU: GI-1, DN15) tinka katilams.')).toBe(
            'Originali dalis (SKU: GI-1, DN15) tinka katilams.',
        );
    });
});

describe('lib/product-text LT decimal commas (W120-A1, P2-14)', () => {
    it('converts letter-prefixed decimal points to commas ("Kvs 1.01" → "Kvs 1,01")', () => {
        expect(formatLtDecimalCommas('Kvs 1.01')).toBe('Kvs 1,01');
        expect(formatLtDecimalCommas('vardinis režimas PN10 · Kvs 1.01; konstrukcija')).toBe(
            'vardinis režimas PN10 · Kvs 1,01; konstrukcija',
        );
        expect(formatLtDecimalCommas('DN 20 / Kvs 685.60, flanšinis')).toBe('DN 20 / Kvs 685,60, flanšinis');
    });

    it('never rewrites SKU codes, ranges or thread sizes', () => {
        expect(formatLtDecimalCommas('0381-01.000')).toBe('0381-01.000');
        expect(formatLtDecimalCommas('8–35 kW')).toBe('8–35 kW');
        expect(formatLtDecimalCommas('DN 10 (Rp 3/8) M30×1.5')).toBe('DN 10 (Rp 3/8) M30×1.5');
        expect(formatLtDecimalCommas('LST EN 215 / KEYMARK')).toBe('LST EN 215 / KEYMARK');
    });

    it('leaves already-comma decimals untouched', () => {
        expect(formatLtDecimalCommas('Kvs 1,36')).toBe('Kvs 1,36');
    });
});

describe('lib/product-i18n LT spec values render decimal commas (W120-A1, P2-14)', () => {
    it('converts "PN10 · Kvs 1.01" to "PN10 · Kvs 1,01" in lt-LT', () => {
        expect(localizeSpecValue('PN10 · Kvs 1.01', 'lt')).toBe('PN10 · Kvs 1,01');
    });

    it('keeps SKU codes intact in lt-LT spec values', () => {
        expect(localizeSpecValue('0381-01.000', 'lt')).toBe('0381-01.000');
    });

    it('does not touch non-LT locales', () => {
        expect(localizeSpecValue('Kvs 1.01', 'en')).not.toBe('Kvs 1,01');
    });
});
