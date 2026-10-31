/**
 * WP-W119-A2 (R1 §5 tests 6-7): /api/storefront-config is fail-closed and
 * single-identity.
 *
 *  6. STORE_SLUG=giles-inzinierija (seeded row) -> 200 { ok: true } with the
 *     resolved store id and storeName 'Gilės Inžinerija' (never /Suradai/).
 *  7. STORE_* unset -> HTTP 500 { ok: false } — never 200-with-Suradai.
 *
 * Hermetic PGlite + full drizzle migration chain (same pattern as
 * storefront-chat.test.ts).
 */
import { describe, expect, it, beforeAll, afterAll, vi } from 'vitest';
import path from 'path';
import { migrate } from 'drizzle-orm/pglite/migrator';

// Must be set before any packages/database import boots the db module.
vi.hoisted(() => {
    process.env.TEST_DB = 'pglite';
});

import { NextRequest } from 'next/server';
import { db } from '@platform/database';
import { stores } from '@platform/database/schema';
import { clearStorefrontRuntimeConfigCache } from '@platform/database/services/storefront-feature-config';
import { clearStoreIdentityCache } from './store-identity';
import { GET } from '../app/api/storefront-config/route';

const RUN = `w119r${Date.now().toString(36)}`;
const DRIZZLE_DIR = path.resolve(process.cwd(), 'packages/database/drizzle');
const GILES_SLUG = 'giles-inzinierija';

describe('WP-W119-A2: /api/storefront-config fail-closed identity (R1 §5 6-7)', () => {
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

    it('returns the resolved Gilės identity when STORE_SLUG is set', async () => {
        delete process.env.STORE_ID;
        process.env.STORE_SLUG = GILES_SLUG;
        clearStoreIdentityCache();
        clearStorefrontRuntimeConfigCache();

        const res = await GET(new NextRequest('http://localhost:3088/api/storefront-config'));
        expect(res.status).toBe(200);
        const body = await res.json();
        expect(body.ok).toBe(true);
        expect(body.storeId).toBe(gilesStore.id);
        expect(body.storeName).toBe('Gilės Inžinerija');
        expect(String(body.storeName)).not.toMatch(/suradai/i);
        expect(body.storeSlug).toBe(GILES_SLUG);
    });

    it('fails closed with HTTP 500 when store identity is not configured', async () => {
        delete process.env.STORE_ID;
        delete process.env.STORE_SLUG;
        clearStoreIdentityCache();
        clearStorefrontRuntimeConfigCache();

        const res = await GET(new NextRequest('http://localhost:3088/api/storefront-config'));
        expect(res.status).toBe(500);
        const body = await res.json();
        expect(body.ok).toBe(false);
    });
});
