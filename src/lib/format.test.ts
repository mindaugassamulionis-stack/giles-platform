import { describe, expect, it } from 'vitest';
import { formatEur, formatEurAmount } from './format';

describe('lib/format eur formatting (W118-A2 audit: unified lt-LT price format)', () => {
    it('formats decimals with a comma and no space before it', () => {
        expect(formatEur(7.86)).toBe('7,86 €');
        expect(formatEur(6.5)).toBe('6,50 €');
    });

    it('groups thousands with a non-breaking space (lt-LT)', () => {
        expect(formatEur(2350)).toBe('2\u00A0350,00 €');
        expect(formatEur(130680)).toBe('130\u00A0680,00 €');
    });

    it('exposes the amount without the currency suffix for inline JSX', () => {
        expect(formatEurAmount(7.86)).toBe('7,86');
        expect(formatEurAmount(2350)).toBe('2\u00A0350,00');
    });
});
