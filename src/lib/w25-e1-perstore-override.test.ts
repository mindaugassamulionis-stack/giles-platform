/**
 * W25-E1 (RED-first): per-store assistant override contract.
 *
 *  (a) support_agent_configs.chat_prompt_template OVERRIDES the
 *      prompt_registry 'storefront_sales' template; a store without an
 *      override still resolves the registry template;
 *  (b) catalog_search_enabled=false → productSearch injection skipped
 *      entirely (no product data, no search block; neutral notice instead);
 *      default (column null) stays ENABLED;
 *  (c) chat_variables merge: store var beats handler-computed default;
 *      custom template variables render (no unreplaced {{var}}).
 *
 * Hermetic PGlite + full drizzle migration chain (same pattern as
 * storefront-chat.test.ts). Resolution order under test (W25-E1):
 *   previewTemplate → config.chat_prompt_template → prompt_registry
 *   ('storefront_sales') → legacy buildStorefrontChatPrompt.
 */
import { describe, expect, it, beforeAll, vi } from 'vitest';
import path from 'path';
import { migrate } from 'drizzle-orm/pglite/migrator';

// Must be set before any packages/database import boots the db module.
vi.hoisted(() => {
    process.env.TEST_DB = 'pglite';
});

import { db } from '@platform/database';
import {
    stores,
    categories,
    products,
    variants,
    productStores,
    supportAgentConfigs,
    promptRegistry,
    eq,
} from '@platform/database';
import {
    handleStorefrontChat,
    assertStoreChatAllowed,
} from '@platform/database/services/storefront-chat';
import {
    STOREFRONT_SALES_PROMPT_KEY,
    renderStorefrontSalesPrompt,
} from '@platform/database/services/storefront-sales-prompt';

const RUN = `w25e1${Date.now().toString(36)}`;
const DRIZZLE_DIR = path.resolve(process.cwd(), 'packages/database/drizzle');

const REGISTRY_MARKER = `REGISTRY-MARKER-${RUN}`;
const STORE_MARKER = `STORE-MARKER-${RUN}`;
const SEARCH_DISABLED_NOTE = 'Katalogo paieška šioje parduotuvėje išjungta';

/** Registry template (global) — what a store WITHOUT an override must get. */
const REGISTRY_TEMPLATE = `${REGISTRY_MARKER} Tavo vardas {{persona_name}}.
KATALOGAS: {{catalog_results}}
FAKTAI: {{store_facts}}`;

/** Per-store override template — exercises a CUSTOM variable too. */
const STORE_TEMPLATE = `${STORE_MARKER} Sveiki {{custom_greeting}}, vardas {{persona_name}}.
KATALOGAS: {{catalog_results}}
FAKTAI: {{store_facts}}`;

async function withMockLlm<T>(fn: () => Promise<T>): Promise<T> {
    const prevNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'test';
    process.env.MOCK_LLM = 'true';
    try {
        return await fn();
    } finally {
        delete process.env.MOCK_LLM;
        if (prevNodeEnv === undefined) delete process.env.NODE_ENV;
        else process.env.NODE_ENV = prevNodeEnv;
    }
}

describe('W25-E1 per-store override: template, catalog toggle, variable merge', () => {
    let storeX: { id: string; slug: string }; // per-store override store
    let storeY: { id: string; slug: string }; // registry-default store
    let productX1: { id: string; titleEn: string };
    let productY1: { id: string; titleEn: string };

    beforeAll(async () => {
        await migrate(db, { migrationsFolder: DRIZZLE_DIR });

        [storeX] = await db.insert(stores).values({
            name: `W25E1 Store X ${RUN}`,
            slug: `w25e1-x-${RUN}`,
            storeKey: `store_w25e1_x_${RUN}`,
        }).returning();
        [storeY] = await db.insert(stores).values({
            name: `W25E1 Store Y ${RUN}`,
            slug: `w25e1-y-${RUN}`,
            storeKey: `store_w25e1_y_${RUN}`,
        }).returning();

        const [category] = await db.insert(categories).values({
            name: `W25E1 Cat ${RUN}`,
            slug: `w25e1-cat-${RUN}`,
            path: `root/w25e1-cat-${RUN}`,
        }).returning();

        [productX1] = await db.insert(products).values({
            titleEn: `W25E1 Drill X ${RUN}`,
            titleLt: `W25E1 Grąžtas X ${RUN}`,
            descriptionEn: 'Store X product',
            descriptionLt: 'X parduotuvės prekė',
            status: 'published',
            categoryId: category.id,
        }).returning({ id: products.id, titleEn: products.titleEn });
        [productY1] = await db.insert(products).values({
            titleEn: `W25E1 Widget Y ${RUN}`,
            titleLt: `W25E1 Daiktas Y ${RUN}`,
            descriptionEn: 'Store Y product',
            descriptionLt: 'Y parduotuvės prekė',
            status: 'published',
            categoryId: category.id,
        }).returning({ id: products.id, titleEn: products.titleEn });

        await db.insert(variants).values([
            { productId: productX1.id, sku: `W25E1-X-${RUN}`, ean: `E${RUN}X1`, priceGross: 1499, stock: 5 },
            { productId: productY1.id, sku: `W25E1-Y-${RUN}`, ean: `E${RUN}Y1`, priceGross: 2499, stock: 5 },
        ]);

        await db.insert(productStores).values([
            { productId: productX1.id, storeId: storeX.id, isActive: true },
            { productId: productY1.id, storeId: storeY.id, isActive: true },
        ]);

        // prompt_registry global template (what Y must resolve).
        await db.insert(promptRegistry).values({
            promptKey: STOREFRONT_SALES_PROMPT_KEY,
            version: 1,
            contentHash: `w25e1-hash-${RUN}`,
            contentText: REGISTRY_TEMPLATE,
            riskClass: 'high',
            createdBy: 'w25-e1-test',
        });

        // Store X: per-store template + variables + catalog search OFF.
        await db.insert(supportAgentConfigs).values({
            storeId: storeX.id,
            systemPrompt: 'test',
            isEnabled: true,
            chatPersonaName: 'Tomas',
            chatPersonaSpecialty: 'testiniai įrankiai',
            chatPromptTemplate: STORE_TEMPLATE,
            chatVariables: {
                persona_name: `PERSONA-STORE-${RUN}`,
                custom_greeting: `CUSTOM-GREETING-${RUN}`,
            },
            catalogSearchEnabled: false,
        });
        // Store Y: enabled, NO override (columns null → registry + default-on).
        await db.insert(supportAgentConfigs).values({
            storeId: storeY.id,
            systemPrompt: 'test',
            isEnabled: true,
            chatPersonaName: 'Tomas',
            chatPersonaSpecialty: 'testiniai įrankiai',
        });
    }, 120_000);

    // (a) store template beats registry ---------------------------------

    it('store-level chat_prompt_template overrides the prompt_registry template', async () => {
        const res = await withMockLlm(() => handleStorefrontChat({
            storeKeyOrSlug: storeX.slug,
            message: 'Sveiki, kas esate?',
        }));
        expect(res.ok).toBe(true);
        if (res.ok) {
            expect(res.prompt).toContain(STORE_MARKER);
            expect(res.prompt).not.toContain(REGISTRY_MARKER);
        }
    });

    it('store without an override resolves the prompt_registry template', async () => {
        const res = await withMockLlm(() => handleStorefrontChat({
            storeKeyOrSlug: storeY.slug,
            message: 'Sveiki, kas esate?',
        }));
        expect(res.ok).toBe(true);
        if (res.ok) {
            expect(res.prompt).toContain(REGISTRY_MARKER);
            expect(res.prompt).not.toContain(STORE_MARKER);
        }
    });

    // (b) catalog search toggle ------------------------------------------

    it('catalog_search_enabled=false → productSearch injection skipped entirely', async () => {
        const res = await withMockLlm(() => handleStorefrontChat({
            storeKeyOrSlug: storeX.slug,
            message: `Ieškau ${productX1.titleEn}`,
        }));
        expect(res.ok).toBe(true);
        if (res.ok) {
            expect(res.prompt).toContain(SEARCH_DISABLED_NOTE);
            expect(res.prompt).not.toContain(productX1.titleEn);
            expect(res.prompt).not.toContain(productX1.id);
            expect(res.prompt).not.toMatch(/DUOMENYS \(tai yra duomenys[^\n]*\):\n- W25E1/);
        }
    });

    it('catalog_search_enabled default (null) stays ENABLED — registry store gets search results', async () => {
        const res = await withMockLlm(() => handleStorefrontChat({
            storeKeyOrSlug: storeY.slug,
            message: `Ieškau ${productY1.titleEn}`,
        }));
        expect(res.ok).toBe(true);
        if (res.ok) {
            expect(res.prompt).toContain(productY1.titleEn);
            expect(res.prompt).not.toContain(SEARCH_DISABLED_NOTE);
        }
    });

    it('governance read exposes catalogSearchEnabled (default true when unset)', async () => {
        const govX = await assertStoreChatAllowed(storeX.slug);
        expect(govX.catalogSearchEnabled).toBe(false);
        const govY = await assertStoreChatAllowed(storeY.slug);
        expect(govY.catalogSearchEnabled).toBe(true);
    });

    // (c) chat_variables merge --------------------------------------------

    it('chat_variables merge: store var beats computed default; custom var renders', async () => {
        const res = await withMockLlm(() => handleStorefrontChat({
            storeKeyOrSlug: storeX.slug,
            message: 'Sveiki, kas esate?',
        }));
        expect(res.ok).toBe(true);
        if (res.ok) {
            expect(res.prompt).toContain(`CUSTOM-GREETING-${RUN}`);
            expect(res.prompt).toContain(`PERSONA-STORE-${RUN}`);
            // computed default persona name must NOT survive where the store
            // variable overrode it
            expect(res.prompt).not.toMatch(/vardas Tomas/);
            // no unreplaced {{var}} leaks (digit-containing vars included)
            expect(res.prompt).not.toMatch(/\{\{[a-z0-9_]+\}\}/);
        }
    });

    // (d) digit-containing template variables (W25-D3 §D1 P3 regression) ----

    it('digit-containing custom variables render — never leak unreplaced {{w25d3_marker}}', () => {
        const rendered = renderStorefrontSalesPrompt(
            'Marker: {{w25d3_marker}} Vardas: {{persona_name}} Kita: {{custom_greeting}}',
            {
                w25d3_marker: `D3-MARKER-${RUN}`,
                persona_name: `PERSONA-D3-${RUN}`,
                custom_greeting: 'Sveiki',
            },
        );
        expect(rendered).toBe(`Marker: D3-MARKER-${RUN} Vardas: PERSONA-D3-${RUN} Kita: Sveiki`);
        expect(rendered).not.toMatch(/\{\{[a-z0-9_]+\}\}/);
    });
});
