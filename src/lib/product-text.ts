// Product text hygiene helpers (W118-A2 finding 13, extended W120-A1).

// Stored descriptions from the old generator can end with a junk tail such as
// "SKU: 0381-01.000," (trailing comma included). Strip only that tail.
const TRAILING_SKU_TAIL = /\s*\(?\s*SKU:\s*[A-Z0-9][A-Z0-9.\-]*\s*\)?[.,]?\s*$/i;

// The same generator also injects a redundant manufacturer-code parenthetical
// mid-string: "(IMI Heimeier, gamintojo kodas SKU: 0381-01.000, EAN: 477…)".
// On short hooks the 160-char render slice cuts inside it, leaving a visible
// "…gamintojo kodas SKU: 0381-01.000," tail (W119-V1 P2-14). Only that exact
// parenthetical is removed; plain "(SKU: GI-1, DN15)" mentions stay.
const EMBEDDED_CODE_PARENTHETICAL = /\s*\([^()]*\bgamintojo kodas SKU:\s*[A-Z0-9][A-Z0-9.\-]*[^()]*\)/gi;

export function stripLegacySkuTail(text: string): string {
    return text.replace(EMBEDDED_CODE_PARENTHETICAL, '').replace(TRAILING_SKU_TAIL, '').trim();
}

// lt-LT renders decimal values with a comma ("Kvs 1,01"). Only a decimal point
// directly preceded by "letter + space" is rewritten, so SKU codes (0381-01.000),
// ranges (8–35 kW) and thread sizes (M30×1.5, Rp 3/8) survive byte-for-byte.
export function formatLtDecimalCommas(text: string): string {
    return text.replace(/([A-Za-z]) (\d+)\.(\d+)/g, '$1 $2,$3');
}
