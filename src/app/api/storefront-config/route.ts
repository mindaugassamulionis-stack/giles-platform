import { NextRequest, NextResponse } from 'next/server';
import { getStorefrontRuntimeConfig } from '@platform/database';
import { StoreIdentityError, resolveStoreIdOrThrow } from '../../../lib/store-identity';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        // Explicit preview overrides only; otherwise the once-resolved server
        // identity (STORE_SLUG/STORE_ID) — never a foreign default.
        const requestedStoreId =
            searchParams.get('storeId') ||
            request.headers.get('x-store-id') ||
            (await resolveStoreIdOrThrow());

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
        if (error instanceof StoreIdentityError) {
            console.error('[/api/storefront-config] store identity not configured:', error.message);
            return NextResponse.json(
                { ok: false, error: 'store identity not configured' },
                { status: 500 },
            );
        }
        console.error('[/api/storefront-config] GET error:', error);
        return NextResponse.json(
            { ok: false, error: 'Failed to load storefront runtime config' },
            { status: 500 },
        );
    }
}
