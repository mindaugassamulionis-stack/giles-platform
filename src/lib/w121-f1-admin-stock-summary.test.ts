// WP-W121-F1 regression: the admin overview line hardcoded "3 659 pozicijos
// sandėlyje" — a fabricated stock number. The summary must be built from the
// live catalog counts and omit the stock segment when stock is unknown.
import { describe, expect, it } from 'vitest';
import { formatAdminCatalogStockSummary } from './admin-stock-summary';

describe('formatAdminCatalogStockSummary', () => {
    it('formats total positions and in-stock count with Kaunas warehouse', () => {
        expect(formatAdminCatalogStockSummary(13531, 28)).toBe(
            '13 531 pozicijos · 28 sandėlyje (Kaunas)',
        );
    });

    it('omits the stock segment when in-stock count is unknown', () => {
        expect(formatAdminCatalogStockSummary(13531, null)).toBe('13 531 pozicijos');
    });

    it('returns empty string when the catalog count itself is unknown', () => {
        expect(formatAdminCatalogStockSummary(null, 28)).toBe('');
        expect(formatAdminCatalogStockSummary(null, null)).toBe('');
    });

    it('never emits the fabricated legacy number', () => {
        expect(formatAdminCatalogStockSummary(13531, 28)).not.toContain('3 659');
    });
});
