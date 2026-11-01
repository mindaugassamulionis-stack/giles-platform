import { NextRequest, NextResponse } from 'next/server';
import {
    parseQuickOrderPadText,
    resolveQuickOrderLines,
    toQuickOrderCartItems,
} from '../../../lib/quick-order-pad';

/**
 * W123-A2 quick order pad endpoint: parses pasted `SKU qty` lines and
 * resolves each against the existing catalog search index (O(1) SKU lookup).
 * Returns per-line rows plus cart-ready items; the client owns cart mutation.
 */
export async function POST(request: NextRequest) {
    try {
        const body = (await request.json()) as { text?: unknown };
        const text = typeof body.text === 'string' ? body.text : '';
        if (text.length > 20000) {
            return NextResponse.json({ error: 'Per ilgas įvestis' }, { status: 400 });
        }

        const parsed = parseQuickOrderPadText(text);
        const rows = resolveQuickOrderLines(parsed);
        return NextResponse.json({
            rows: rows.map((row) => ({
                sku: row.sku,
                qty: row.qty,
                status: row.status,
                truncated: undefined,
                product: row.product
                    ? {
                          id: row.product.id,
                          slug: row.product.slug,
                          name: row.product.nameLt || row.product.name,
                          price: row.product.price,
                          imageUrl: row.product.imageUrl,
                          brandName: row.product.brandName,
                          availability: row.product.availability ?? null,
                      }
                    : null,
            })),
            cartItems: toQuickOrderCartItems(rows),
            truncated: parsed.truncated,
        });
    } catch (error) {
        console.error('[api/quick-order] resolve failed:', error);
        return NextResponse.json({ error: 'Nepavyko apdoroti užsakymo' }, { status: 500 });
    }
}
