// W23-S1 / G1 (P0): honest purchasability for a B2B catalog whose supplier
// import leaves stock unknown on ~100% of rows.
//
// Data reality (W19-B1 prod import, products-import-pipeline.ts
// `stock = item.stockQty ?? 0`): the supplier CSV has NO stock column, so
// every stored `stock=0` is a pipeline placeholder, not inventory. A real
// "imported zero" cannot exist until a supplier stock feed does (UX plan §6
// open question 2 — S1 assumption: confirmation flow).
//
// Semantics (UX plan P4 + R6: never fake availability claims):
// - stock NULL/undefined = UNKNOWN → purchasable + confirmation note
//   (LT: "Kiekio patvirtinimas užsakymo metu").
// - stock > 0 = purchasable, no note.
// - stock === 0 = UNKNOWN (placeholder) → purchasable + note, UNLESS
//   STOREFRONT_TRUST_VARIANT_STOCK=1 (set only when a real stock feed lands)
//   in which case 0 is a true imported zero and the ONLY state that may
//   disable purchase / render "Išparduota".
export interface Purchasability {
    soldOut: boolean;
    stockKnown: boolean;
    availabilityNote: string | null;
}

export const STOCK_UNKNOWN_NOTE_LT = 'Kiekio patvirtinimas užsakymo metu';

function trustVariantStock(): boolean {
    return process.env.STOREFRONT_TRUST_VARIANT_STOCK === '1';
}

export function resolvePurchasability(stock: number | null | undefined): Purchasability {
    if (typeof stock !== 'number') {
        return { soldOut: false, stockKnown: false, availabilityNote: STOCK_UNKNOWN_NOTE_LT };
    }
    if (stock > 0) {
        return { soldOut: false, stockKnown: true, availabilityNote: null };
    }
    if (trustVariantStock()) {
        return { soldOut: true, stockKnown: true, availabilityNote: null };
    }
    return { soldOut: false, stockKnown: false, availabilityNote: STOCK_UNKNOWN_NOTE_LT };
}
