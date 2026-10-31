import { db } from '@platform/database';
import { stores } from '@platform/database/schema/stores';
import { legalPolicies } from '@platform/database/schema/compliance';
import { storefrontPages } from '@platform/database/schema/storefront-pages';
import { storefrontSettings } from '@platform/database/schema/storefront-settings';
import { and, desc, eq, type InferSelectModel } from 'drizzle-orm';
import { resolveStoreIdOrThrow } from './store-identity';

export type Store = InferSelectModel<typeof stores>;

const CONTENT_CACHE_TTL_MS = 60 * 1000;
const contentTtlCache = new Map<string, { expiresAt: number; value: unknown }>();

export const getStore = async (): Promise<Store | null> => {
    const storeId = await resolveStoreIdOrThrow();
    const cacheKey = `store:${storeId}`;
    const now = Date.now();
    const hit = contentTtlCache.get(cacheKey);
    if (hit && hit.expiresAt > now) return hit.value as Store | null;
    const [store] = await db.select().from(stores).where(eq(stores.id, storeId)).limit(1);
    const result = store || null;
    contentTtlCache.set(cacheKey, { expiresAt: now + CONTENT_CACHE_TTL_MS, value: result });
    return result;
};

export const getLegalPolicy = async (type: string) => {
    const storeId = await resolveStoreIdOrThrow();
    const [policy] = await db
        .select()
        .from(legalPolicies)
        .where(
            and(
                eq(legalPolicies.storeId, storeId),
                eq(legalPolicies.type, type),
                eq(legalPolicies.isActive, 'true')
            )
        )
        .orderBy(desc(legalPolicies.effectiveAt))
        .limit(1);
    return policy || null;
};

export const getStorefrontPage = async (slug: string) => {
    const storeId = await resolveStoreIdOrThrow();
    const [page] = await db
        .select()
        .from(storefrontPages)
        .where(and(eq(storefrontPages.storeId, storeId), eq(storefrontPages.slug, slug)))
        .orderBy(desc(storefrontPages.updatedAt))
        .limit(1);
    return page || null;
};

export const getStorefrontSettings = async () => {
    const storeId = await resolveStoreIdOrThrow();
    const rows = await db
        .select()
        .from(storefrontSettings)
        .where(eq(storefrontSettings.storeId, storeId))
        .orderBy(desc(storefrontSettings.updatedAt));
    const settings: Record<string, any> = {};
    for (const row of rows) {
        settings[row.key] = row.content || {};
    }
    return { storeId, settings };
};
