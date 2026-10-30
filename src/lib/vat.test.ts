/**
 * W22-D1 T4: su/be PVM display math.
 * Contract: net = round(gross / (1 + vat/100)) in cents; gross stays the
 * canonical JSON-LD/checkout price; UI labels come from one helper so cards,
 * PDP and cart header never disagree. Anonymous default = su PVM.
 */
import { describe, expect, it } from 'vitest';
import {
    netFromGrossCents,
    vatFraction,
    DEFAULT_VAT_RATE,
} from './vat';

describe('W22-D1 T4: VAT display math', () => {
    it('net = gross / (1 + VAT/100), rounded to cents', () => {
        expect(netFromGrossCents(2043, 21)).toBe(1688); // 2043/1.21 = 1688.43
        expect(netFromGrossCents(1210, 21)).toBe(1000);
        expect(netFromGrossCents(1000, 0)).toBe(1000);
        expect(netFromGrossCents(1090, 9)).toBe(1000);
    });

    it('null/undefined gross or invalid VAT falls back to gross (never NaN)', () => {
        expect(netFromGrossCents(null, 21)).toBe(0);
        expect(netFromGrossCents(undefined, 21)).toBe(0);
        expect(netFromGrossCents(1000, NaN)).toBe(1000);
    });

    it('vatFraction returns the divisor for display math', () => {
        expect(vatFraction(21)).toBeCloseTo(1.21, 10);
        expect(vatFraction(9)).toBeCloseTo(1.09, 10);
        expect(vatFraction(0)).toBe(1);
    });

    it('DEFAULT_VAT_RATE is the LT standard 21%', () => {
        expect(DEFAULT_VAT_RATE).toBe(21);
    });
});
