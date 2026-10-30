/**
 * W25-C1 §4e-P2 (RED-first): seeded eval suite + config-seed idempotency.
 *
 *  (a) runStorefrontSalesEval over the SEEDED cases (prompt_registry
 *      template) passes 10/10 — qualification, naked-price, identity probe,
 *      injection via product data, out-of-scope, escalation, LT tone,
 *      catalog scoping, mode caps + JSON envelope, SKU format;
 *  (b) seedStorefrontSalesAssistant is idempotent: second run inserts
 *      0 duplicate prompt_registry / eval-case rows, config UPDATE not INSERT;
 *  (c) --enable flow: is_enabled flips true only when requested.
 *
 * Hermetic PGlite + full drizzle migration chain.
 */
import { describe, expect, it, beforeAll, vi } from 'vitest';
import path from 'path';
import { migrate } from 'drizzle-orm/pglite/migrator';

vi.hoisted(() => {
    process.env.TEST_DB = 'pglite';
});

import { db } from '@platform/database';
import {
    stores,
    supportAgentConfigs,
    promptRegistry,
    promptEvalCases,
    eq,
} from '@platform/database';
import {
    seedStorefrontSalesAssistant,
    runStorefrontSalesEval,
    SURADAI_PINNED_STORE_ID,
} from '@platform/database/services/storefront-sales-activation';
import { STOREFRONT_SALES_PROMPT_KEY } from '@platform/database/services/storefront-sales-prompt';

const RUN = `act${Date.now().toString(36)}`;
const DRIZZLE_DIR = path.resolve(process.cwd(), 'packages/database/drizzle');

describe('W25-C1 P2b/P2c: eval runner + seed idempotency', () => {
    let canonicalStoreId: string;

    beforeAll(async () => {
        await migrate(db, { migrationsFolder: DRIZZLE_DIR });
        // Pinned store absent in fresh envs → seed must bind the canonical
        // fallback store. Create it (dev DB has it; pglite does not).
        const [existing] = await db.select().from(stores)
            .where(eq(stores.storeKey, 'store_suradai')).limit(1);
        if (!existing) {
            const [created] = await db.insert(stores).values({
                name: 'Suradai.lt',
                slug: 'suradai',
                storeKey: 'store_suradai',
            }).returning();
            canonicalStoreId = created.id;
        } else {
            canonicalStoreId = existing.id;
        }
    }, 120_000);

    it('pinned store UUID is not silently invented — seed binds a real store', async () => {
        const result = await seedStorefrontSalesAssistant({});
        expect(result.storeBound.id).toBe(canonicalStoreId);
        expect(result.storeBound.pinned).toBe(false);
        expect(result.enabled).toBe(false); // is_enabled=false INITIALLY
    });

    it('seeded eval passes 10/10 against the prompt_registry template', async () => {
        const outcome = await runStorefrontSalesEval();
        expect(outcome.templateSource).toBe('prompt_registry');
        expect(outcome.total).toBeGreaterThanOrEqual(8);
        for (const r of outcome.results) {
            expect({ slug: r.slug, passed: r.passed, reason: r.reason })
                .toEqual({ slug: r.slug, passed: true, reason: undefined });
        }
        expect(outcome.failed).toBe(0);
        expect(outcome.passRate).toBe(1);
    });

    it('re-seed creates 0 duplicates (prompt_registry, eval cases, config UPDATE)', async () => {
        const promptsBefore = await db.select({ id: promptRegistry.id })
            .from(promptRegistry).where(eq(promptRegistry.promptKey, STOREFRONT_SALES_PROMPT_KEY));
        const casesBefore = await db.select({ id: promptEvalCases.id }).from(promptEvalCases);

        const second = await seedStorefrontSalesAssistant({});

        const promptsAfter = await db.select({ id: promptRegistry.id })
            .from(promptRegistry).where(eq(promptRegistry.promptKey, STOREFRONT_SALES_PROMPT_KEY));
        const casesAfter = await db.select({ id: promptEvalCases.id }).from(promptEvalCases);

        expect(promptsAfter.length).toBe(promptsBefore.length);
        expect(casesAfter.length).toBe(casesBefore.length);
        expect(second.prompt).toBe('exists');
        expect(second.evalRun).toBe('exists');
        expect(second.config).toBe('updated');
        expect(second.enabled).toBe(false); // re-seed without --enable keeps disabled
    });

    it('enable flag flips is_enabled=true for the bound store only', async () => {
        const result = await seedStorefrontSalesAssistant({ enable: true });
        expect(result.enabled).toBe(true);
        const [row] = await db.select({ isEnabled: supportAgentConfigs.isEnabled })
            .from(supportAgentConfigs).where(eq(supportAgentConfigs.storeId, canonicalStoreId)).limit(1);
        expect(row?.isEnabled).toBe(true);
        // exactly one config row for the bound store (no dupes)
        const rows = await db.select({ id: supportAgentConfigs.id })
            .from(supportAgentConfigs).where(eq(supportAgentConfigs.storeId, canonicalStoreId));
        expect(rows.length).toBe(1);
        expect(canonicalStoreId).not.toBe(SURADAI_PINNED_STORE_ID);
    });

    // W25-E1: admin-managed per-store override columns must survive re-seed.
    it('re-seed preserves admin-set chat_prompt_template / chat_variables / catalog_search_enabled', async () => {
        await db.update(supportAgentConfigs).set({
            chatPromptTemplate: 'W25E1-PRESERVED vardas {{persona_name}} katalogas {{catalog_results}}',
            chatVariables: { persona_name: 'Admin-Persona' },
            catalogSearchEnabled: false,
        }).where(eq(supportAgentConfigs.storeId, canonicalStoreId));

        const result = await seedStorefrontSalesAssistant({});
        expect(result.config).toBe('updated');

        const [row] = await db.select({
            chatPromptTemplate: supportAgentConfigs.chatPromptTemplate,
            chatVariables: supportAgentConfigs.chatVariables,
            catalogSearchEnabled: supportAgentConfigs.catalogSearchEnabled,
        }).from(supportAgentConfigs).where(eq(supportAgentConfigs.storeId, canonicalStoreId)).limit(1);
        expect(row?.chatPromptTemplate).toBe('W25E1-PRESERVED vardas {{persona_name}} katalogas {{catalog_results}}');
        expect(row?.chatVariables).toEqual({ persona_name: 'Admin-Persona' });
        expect(row?.catalogSearchEnabled).toBe(false);
    });
});
