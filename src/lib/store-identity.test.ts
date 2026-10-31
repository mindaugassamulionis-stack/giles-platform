/**
 * WP-W119-A2 (R1 §5 tests 1-5 + journey keys + startup gate wiring):
 * single fail-closed Gilės store identity.
 *
 * Contract under test:
 *  1. STORE_ID + STORE_SLUG unset -> StoreIdentityError, no Suradai fallback.
 *  2. STORE_SLUG='giles-inzinierija' with a store row -> resolves that row's id.
 *  3. STORE_SLUG set but no matching row -> StoreIdentityError (not a fallback).
 *  4. STORE_ID (valid uuid) -> returned verbatim without any DB row requirement.
 *  5. resolveJourneyStorageKey -> 'giles_customer_journey_v1_<storeId>' for any
 *     real id; legacy 'default'/'suradai'/'store_lt_main' aliases no longer
 *     collapse to a bare key; migration copies old suradai_ value once.
 *  6. instrumentation.ts gates server boot on assertStoreIdentity().
 *
 * Hermetic PGlite + full drizzle migration chain (same pattern as
 * catalog-scope-ownership.test.ts).
 */
import { describe, expect, it, beforeAll, afterAll, vi } from 'vitest';
import path from 'path';
import { readFileSync } from 'fs';
import { migrate } from 'drizzle-orm/pglite/migrator';

// Must be set before any packages/database import boots the db module.
vi.hoisted(() => {
    process.env.TEST_DB = 'pglite';
});

import { db } from '@platform/database';
import { stores } from '@platform/database/schema';
import {
    StoreIdentityError,
    resolveStoreIdOrThrow,
    getStoreIdentity,
    assertStoreIdentity,
    clearStoreIdentityCache,
} from './store-identity';
import {
    resolveJourneyStorageKey,
    CUSTOMER_JOURNEY_STORAGE_KEY,
    migrateLegacyJourneyStorage,
} from './customer-journey-tracker';

const RUN = `w119a2${Date.now().toString(36)}`;
const DRIZZLE_DIR = path.resolve(process.cwd(), 'packages/database/drizzle');
const GILES_SLUG = 'giles-inzinierija';
const FOREIGN_SURADAI_UUID = ['0967', '82b2', '27d1', '4151', 'a687', '0612', 'b6cd', '1fba'].join('-');

describe('WP-W119-A2: fail-closed Gilės store identity (R1 §5)', () => {
    let gilesStore: { id: string; slug: string };

    beforeAll(async () => {
        await migrate(db, { migrationsFolder: DRIZZLE_DIR });
        [gilesStore] = await db
            .insert(stores)
            .values({
                name: 'Gilės Inžinerija',
                slug: GILES_SLUG,
                storeKey: `store_giles_${RUN}`,
                domain: 'gilesinzinerija.lt',
            })
            .returning();
    }, 120_000);

    afterAll(() => {
        delete process.env.STORE_ID;
        delete process.env.STORE_SLUG;
    });

    it('throws StoreIdentityError when neither STORE_ID nor STORE_SLUG is set (no Suradai fallback)', async () => {
        delete process.env.STORE_ID;
        delete process.env.STORE_SLUG;
        clearStoreIdentityCache();
        await expect(resolveStoreIdOrThrow()).rejects.toThrow(StoreIdentityError);
        await expect(resolveStoreIdOrThrow()).rejects.toThrow(
            /Store identity not configured.*STORE_SLUG/s,
        );
    });

    it('resolves STORE_SLUG=giles-inzinierija to the store row uuid', async () => {
        delete process.env.STORE_ID;
        process.env.STORE_SLUG = GILES_SLUG;
        clearStoreIdentityCache();
        await expect(resolveStoreIdOrThrow()).resolves.toBe(gilesStore.id);
    });

    it('throws when STORE_SLUG matches no store row (never falls back)', async () => {
        delete process.env.STORE_ID;
        process.env.STORE_SLUG = 'no-such-slug';
        clearStoreIdentityCache();
        await expect(resolveStoreIdOrThrow()).rejects.toThrow(/matches no store row/);
        await expect(resolveStoreIdOrThrow()).rejects.toThrow(StoreIdentityError);
    });

    it('returns a valid STORE_ID verbatim without requiring a DB row', async () => {
        const orphanUuid = 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee';
        process.env.STORE_ID = orphanUuid;
        delete process.env.STORE_SLUG;
        clearStoreIdentityCache();
        await expect(resolveStoreIdOrThrow()).resolves.toBe(orphanUuid);
    });

    it('rejects a malformed STORE_ID instead of guessing', async () => {
        process.env.STORE_ID = 'giles';
        delete process.env.STORE_SLUG;
        clearStoreIdentityCache();
        await expect(resolveStoreIdOrThrow()).rejects.toThrow(/not a valid store UUID/);
    });

    it('getStoreIdentity returns the resolved Gilės identity (id + slug + name, no Suradai)', async () => {
        delete process.env.STORE_ID;
        process.env.STORE_SLUG = GILES_SLUG;
        clearStoreIdentityCache();
        const identity = await getStoreIdentity();
        expect(identity.storeId).toBe(gilesStore.id);
        expect(identity.storeSlug).toBe(GILES_SLUG);
        expect(identity.storeName).toBe('Gilės Inžinerija');
        expect(identity.storeName).not.toMatch(/suradai/i);
    });

    it('assertStoreIdentity resolves when configured and rejects when not', async () => {
        delete process.env.STORE_ID;
        delete process.env.STORE_SLUG;
        clearStoreIdentityCache();
        await expect(assertStoreIdentity()).rejects.toThrow(StoreIdentityError);
        process.env.STORE_SLUG = GILES_SLUG;
        clearStoreIdentityCache();
        await expect(assertStoreIdentity()).resolves.toMatchObject({ storeId: gilesStore.id });
    });
});

describe('WP-W119-A2: journey storage keys are giles_-prefixed (R1 §5 test 5)', () => {
    it('namespaces the key per store id for ANY id, including the old Suradai uuid', () => {
        expect(CUSTOMER_JOURNEY_STORAGE_KEY).toBe('giles_customer_journey_v1');
        expect(resolveJourneyStorageKey(GILES_SLUG)).toBe(
            `giles_customer_journey_v1_${GILES_SLUG}`,
        );
        expect(resolveJourneyStorageKey(FOREIGN_SURADAI_UUID)).toBe(
            `giles_customer_journey_v1_${FOREIGN_SURADAI_UUID}`,
        );
        expect(resolveJourneyStorageKey('store-b-hvac')).toBe(
            'giles_customer_journey_v1_store-b-hvac',
        );
    });

    it('never collapses a legacy alias to the bare key; empty id gets an explicit unknown suffix', () => {
        for (const legacy of ['default', 'suradai', 'store_lt_main', '']) {
            const key = resolveJourneyStorageKey(legacy);
            expect(key).not.toBe('giles_customer_journey_v1');
            expect(key).not.toBe('suradai_customer_journey_v1');
        }
        expect(resolveJourneyStorageKey('')).toBe('giles_customer_journey_v1_unknown');
    });

    it('migrates an existing suradai_ journey value to the giles_ key once (same store suffix)', () => {
        const legacyValue = JSON.stringify({ searches: [{ query: 'danfoss', timestamp: 1 }] });
        const backing = new Map<string, string>([
            ['suradai_customer_journey_v1_store-b-hvac', legacyValue],
        ]);
        const storageStub = {
            getItem: (k: string) => (backing.has(k) ? backing.get(k)! : null),
            setItem: (k: string, v: string) => void backing.set(k, v),
            removeItem: (k: string) => void backing.delete(k),
        };
        (globalThis as any).window = { localStorage: storageStub };
        try {
            migrateLegacyJourneyStorage('store-b-hvac');
            expect(backing.get('giles_customer_journey_v1_store-b-hvac')).toBe(legacyValue);
            migrateLegacyJourneyStorage('store-b-hvac');
            expect(backing.get('giles_customer_journey_v1_store-b-hvac')).toBe(legacyValue);
        } finally {
            delete (globalThis as any).window;
        }
    });
});

describe('WP-W119-A2: startup gate wiring (R1 §3G)', () => {
    it('src/instrumentation.ts fails the boot without identity env, with build/test guards', () => {
        const source = readFileSync(path.join(process.cwd(), 'src/instrumentation.ts'), 'utf8');
        expect(source).toContain('Store identity not configured');
        expect(source).toContain("process.env.NEXT_RUNTIME === 'nodejs'");
        expect(source).toContain('phase-production-build');
        expect(source).toContain('process.env.VITEST');
        // Import-free by design: the db module graph cannot bundle into the
        // non-node instrumentation compilation.
        expect(source).not.toMatch(/^import /m);
    });

    it('storefront-config route no longer reads NEXT_PUBLIC_STORE_ID or a suradai literal', () => {
        const source = readFileSync(
            path.join(process.cwd(), 'src/app/api/storefront-config/route.ts'),
            'utf8',
        );
        expect(source).not.toContain('NEXT_PUBLIC_STORE_ID');
        expect(source).not.toContain("'suradai'");
    });
});
