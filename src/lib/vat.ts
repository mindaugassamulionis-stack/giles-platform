// W22-D1 T4: su/be PVM display math (DESIGN.md v3 price block).
//
// Canonical price stays variants.priceGross (cents, incl. VAT) — JSON-LD and
// checkout always use gross. The Be-PVM toggle is a DISPLAY transform only:
// net = round(gross / (1 + vat/100)), labelled "be PVM", persisted per
// browser session (sessionStorage), anonymous default = su PVM.

export const DEFAULT_VAT_RATE = 21; // LT standard rate (variants.vatRate default)

/** Divisor for net math: 21 → 1.21. Invalid rates fall back to 1 (no change). */
export function vatFraction(vatRate: number | null | undefined): number {
    if (vatRate == null || !Number.isFinite(vatRate) || vatRate < 0 || vatRate > 100) return 1;
    return 1 + vatRate / 100;
}

/**
 * Net price in cents from gross cents. Null/undefined gross → 0 (unpriced
 * items render "Kaina pagal užklausą", never 0.00 €); invalid VAT keeps gross.
 */
export function netFromGrossCents(
    grossCents: number | null | undefined,
    vatRate: number | null | undefined,
): number {
    if (grossCents == null || !Number.isFinite(grossCents)) return 0;
    return Math.round(grossCents / vatFraction(vatRate));
}

/** Display pair for UI: always gross (canonical) + net when toggled. */
export function priceDisplayPair(
    grossCents: number | null | undefined,
    vatRate: number | null | undefined,
): { grossCents: number; netCents: number } {
    const gross = grossCents == null || !Number.isFinite(grossCents) ? 0 : Math.round(grossCents);
    return { grossCents: gross, netCents: netFromGrossCents(gross, vatRate) };
}
