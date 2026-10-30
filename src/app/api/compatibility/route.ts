import { NextRequest, NextResponse } from 'next/server';
import { findCompatibleCatalogProducts } from '@platform/database/services/product-compatibility-rag';
import { resolveChatStore } from '@platform/database/services/storefront-chat';

export const runtime = 'nodejs';

async function resolveCompatibilityRequest(params: {
    productId?: string | null;
    sku?: string | null;
    q?: string | null;
    limit?: number;
}) {
    const storeSlug = process.env.STORE_SLUG || 'suradai';
    const store = await resolveChatStore(storeSlug);
    if (!store) {
        return NextResponse.json(
            { error: `Store "${storeSlug}" not found` },
            { status: 404 },
        );
    }

    const result = await findCompatibleCatalogProducts({
        storeId: store.id,
        productId: params.productId ?? null,
        sku: params.sku ?? null,
        query: params.q ?? null,
        limit: params.limit ?? 6,
    });

    return NextResponse.json({
        focalProduct: result.focalProduct,
        compatibleProducts: result.compatibleProducts,
        bundleExplanation: result.bundleExplanation,
        installationSteps: result.installationSteps,
        vytautasPitch: result.vytautasPitch,
        queryAttributes: result.queryAttributes,
    });
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const productId = searchParams.get('productId');
        const sku = searchParams.get('sku');
        const q = searchParams.get('q');
        const limitRaw = searchParams.get('limit');
        const limit = limitRaw ? Number(limitRaw) : 6;

        return await resolveCompatibilityRequest({
            productId,
            sku,
            q,
            limit: Number.isFinite(limit) ? limit : 6,
        });
    } catch (error) {
        console.error('[api/compatibility] GET error:', error);
        return NextResponse.json(
            { error: 'Failed to resolve product compatibility' },
            { status: 500 },
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json().catch(() => ({}));
        const productId = typeof body.productId === 'string' ? body.productId : null;
        const sku = typeof body.sku === 'string' ? body.sku : null;
        const q = typeof body.q === 'string'
            ? body.q
            : typeof body.query === 'string'
                ? body.query
                : null;
        const limit = typeof body.limit === 'number' ? body.limit : 6;

        return await resolveCompatibilityRequest({ productId, sku, q, limit });
    } catch (error) {
        console.error('[api/compatibility] POST error:', error);
        return NextResponse.json(
            { error: 'Failed to resolve product compatibility' },
            { status: 500 },
        );
    }
}
