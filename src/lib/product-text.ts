// Product text hygiene helpers (W118-A2 finding 13).

// Stored descriptions from the old generator can end with a junk tail such as
// "SKU: 0381-01.000," (trailing comma included). Strip only that tail.
const TRAILING_SKU_TAIL = /\s*\(?\s*SKU:\s*[A-Z0-9][A-Z0-9.\-]*\s*\)?[.,]?\s*$/i;

export function stripLegacySkuTail(text: string): string {
    return text.replace(TRAILING_SKU_TAIL, '').trim();
}
