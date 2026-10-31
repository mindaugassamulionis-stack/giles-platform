/**
 * WP-W119-A2: single fail-closed Gilės store identity.
 *
 * The Gilės app must never fall back to any Suradai/foreign store. Identity is
 * resolved ONCE server-side from STORE_SLUG (recommended, e.g.
 * 'giles-inzinierija') or STORE_ID; when neither resolves, every caller throws
 * StoreIdentityError instead of silently rendering another store's data.
 * Shared package defaults (storefront-feature-config.ts) are bypassed by
 * always passing the resolved UUID explicitly.
 */
import { db } from '@platform/database';
import { stores } from '@platform/database/schema/stores';
import { eq } from 'drizzle-orm';

export class StoreIdentityError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'StoreIdentityError';
    }
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const STORE_IDENTITY_TTL_MS = 60 * 1000;

type StoreRow = typeof stores.$inferSelect;

const identityCache = new Map<
    string,
    { expiresAt: number; storeId: string; store: StoreRow | null }
>();

export function clearStoreIdentityCache(): void {
    identityCache.clear();
}

/**
 * Resolves the active store id. STORE_ID (uuid) wins and is returned verbatim
 * (no DB row required); otherwise STORE_SLUG is looked up in the stores table.
 * Unset env or an unknown slug throws — there is no default store.
 */
export async function resolveStoreIdOrThrow(): Promise<string> {
    const envStoreId = (process.env.STORE_ID || '').trim();
    if (envStoreId) {
        if (!UUID_REGEX.test(envStoreId)) {
            throw new StoreIdentityError(
                `STORE_ID "${envStoreId}" is not a valid store UUID. Fix the deployment env.`,
            );
        }
        return envStoreId;
    }

    const envSlug = (process.env.STORE_SLUG || '').trim();
    if (!envSlug) {
        throw new StoreIdentityError(
            'Store identity not configured. Set STORE_SLUG (recommended, e.g. giles-inzinierija) or STORE_ID for this deployment.',
        );
    }

    const cacheKey = `slug:${envSlug}`;
    const now = Date.now();
    const hit = identityCache.get(cacheKey);
    if (hit && hit.expiresAt > now) return hit.storeId;

    const [store] = await db.select().from(stores).where(eq(stores.slug, envSlug)).limit(1);
    if (!store) {
        throw new StoreIdentityError(
            `STORE_SLUG "${envSlug}" matches no store row. Create the store or fix STORE_SLUG.`,
        );
    }
    identityCache.set(cacheKey, { expiresAt: now + STORE_IDENTITY_TTL_MS, storeId: store.id, store });
    return store.id;
}

export interface StoreIdentity {
    storeId: string;
    storeSlug: string;
    storeName: string;
    storeKey: string | null;
    domain: string | null;
}

/**
 * Full identity for SSR injection and runtime-config callers. Stricter than
 * resolveStoreIdOrThrow: the store row must exist even under STORE_ID, because
 * features/persona are row-driven.
 */
export async function getStoreIdentity(): Promise<StoreIdentity> {
    const storeId = await resolveStoreIdOrThrow();

    const byIdKey = `id:${storeId}`;
    const now = Date.now();
    const hit = identityCache.get(byIdKey);
    const store =
        hit && hit.expiresAt > now
            ? hit.store
            : ((await db.select().from(stores).where(eq(stores.id, storeId)).limit(1))[0] ??
              null);
    if (!store) {
        throw new StoreIdentityError(
            `Configured store identity "${storeId}" matches no store row. Create the store record or fix STORE_ID/STORE_SLUG.`,
        );
    }
    if (!hit || hit.expiresAt <= now) {
        identityCache.set(byIdKey, { expiresAt: now + STORE_IDENTITY_TTL_MS, storeId, store });
    }
    return {
        storeId: store.id,
        storeSlug: store.slug,
        storeName: store.name,
        storeKey: store.storeKey || null,
        domain: store.domain || null,
    };
}

/** Startup gate used by src/instrumentation.ts — boots die without identity. */
export async function assertStoreIdentity(): Promise<StoreIdentity> {
    return getStoreIdentity();
}
