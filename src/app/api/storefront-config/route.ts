import { NextRequest, NextResponse } from 'next/server';
import { getStorefrontRuntimeConfig } from '@platform/database';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const requestedStoreId =
            searchParams.get('storeId') ||
            request.headers.get('x-store-id') ||
            request.cookies.get('suradai_store_id')?.value ||
            process.env.NEXT_PUBLIC_STORE_ID ||
            process.env.STORE_ID ||
            process.env.STORE_SLUG ||
            'suradai';

        const config = await getStorefrontRuntimeConfig(requestedStoreId, {
            includeSecretApiKey: false,
        });

        return NextResponse.json({
            ok: true,
            storeId: config.storeId,
            storeKey: config.storeKey,
            storeSlug: config.storeSlug,
            storeName: config.storeName,
            domain: config.domain,
            features: config.features,
            featureModules: config.featureModules,
            persona: config.persona,
            llm: {
                enabled: config.llm.enabled,
                provider: config.llm.provider,
                model: config.llm.model,
                hasApiKey: config.llm.hasApiKey,
                thinkingEnabled: config.llm.thinkingEnabled,
            },
            enabledFeaturesCount: config.enabledFeaturesCount,
            totalFeaturesCount: config.totalFeaturesCount,
        });
    } catch (error) {
        console.error('[/api/storefront-config] GET error:', error);
        return NextResponse.json(
            { ok: false, error: 'Failed to load storefront runtime config' },
            { status: 500 },
        );
    }
}
