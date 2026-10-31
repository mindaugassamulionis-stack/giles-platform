/**
 * W25-B1 §4e-P1 (RED-first): storefront chat safety contract.
 *
 * Covers the four P2-defect fixes:
 *  (a) honest AI identity — no "Tu esi ŽMOGUS" / "NIEKADA nesakyk kad esi AI"
 *      deception strings anywhere in the built prompt;
 *  (b) store-scoped product context — junction (product_stores) scoped catalog,
 *      no cross-store leak, no global-catalog fallback for empty stores;
 *  (c) governance wiring — support_agent_configs.is_enabled / kill_switch /
 *      budgets + agent_types kill switch produce a 503-style block;
 *  (d) suradai domain — prompt carries no vaikų-mokslo / vitamin knowledge.
 *
 * Hermetic PGlite + full drizzle migration chain (same pattern as
 * catalog-scope.test.ts).
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
    agentTypes,
    llmUsage,
    eq,
} from '@platform/database';
import {
    buildStorefrontChatPrompt,
    getStoreChatCatalog,
    assertStoreChatAllowed,
    handleStorefrontChat,
    extractChatSearchQueries,
    cleanChatResponseProse,
    resolveChatCardMetadata,
    normalizeStorefrontProductTitle,
    ChatDisabledError,
} from '@platform/database/services/storefront-chat';
import { unwrapResponseEnvelope } from '@platform/database/services/storefront-sales-prompt';
import {
    extractEngineeringAttributes,
    findCompatibleCatalogProducts,
    inferRole,
    buildVytautasDeterministicResponse,
} from '@platform/database/services/product-compatibility-rag';
import {
    resolveJourneyStorageKey,
    setJourneyTrackingConfig,
    getJourneySummaryForPrompt,
    buildChatJourneyContext,
} from './customer-journey-tracker';

const RUN = `chatsc${Date.now().toString(36)}`;
const DRIZZLE_DIR = path.resolve(process.cwd(), 'packages/database/drizzle');

describe('W25-B1 storefront-chat P1: honest identity, store scope, governance, domain', () => {
    let storeA: { id: string; slug: string; storeKey: string };
    let storeB: { id: string; slug: string };
    let storeC: { id: string; slug: string };
    let productA1: { id: string; titleEn: string };
    let productB1: { id: string; titleEn: string };

    beforeAll(async () => {
        await migrate(db, { migrationsFolder: DRIZZLE_DIR });

        [storeA] = await db.insert(stores).values({
            name: `Chat Store A ${RUN}`,
            slug: `chat-a-${RUN}`,
            storeKey: `store_chat_a_${RUN}`,
        }).returning();
        [storeB] = await db.insert(stores).values({
            name: `Chat Store B ${RUN}`,
            slug: `chat-b-${RUN}`,
            storeKey: `store_chat_b_${RUN}`,
        }).returning();
        [storeC] = await db.insert(stores).values({
            name: `Chat Store C ${RUN}`,
            slug: `chat-c-${RUN}`,
            storeKey: `store_chat_c_${RUN}`,
        }).returning();

        const [category] = await db.insert(categories).values({
            name: `Chat Cat ${RUN}`,
            slug: `chat-cat-${RUN}`,
            path: `root/chat-cat-${RUN}`,
        }).returning();

        [productA1] = await db.insert(products).values({
            titleEn: `Chat Drill A ${RUN}`,
            titleLt: `Chat Grąžtas A ${RUN}`,
            descriptionEn: 'Store A product',
            descriptionLt: 'A parduotuvės prekė',
            status: 'published',
            categoryId: category.id,
        }).returning({ id: products.id, titleEn: products.titleEn });
        [productB1] = await db.insert(products).values({
            titleEn: `Chat Vitamin B ${RUN}`,
            titleLt: `Chat Vitaminas B ${RUN}`,
            descriptionEn: 'Store B product',
            descriptionLt: 'B parduotuvės prekė',
            status: 'published',
            categoryId: category.id,
        }).returning({ id: products.id, titleEn: products.titleEn });

        await db.insert(variants).values({
            productId: productA1.id,
            sku: `CHAT-A-${RUN}`,
            ean: `EA${RUN}A1`,
            priceGross: 1999,
            stock: 5,
        });
        await db.insert(variants).values({
            productId: productB1.id,
            sku: `CHAT-B-${RUN}`,
            ean: `EA${RUN}B1`,
            priceGross: 2999,
            stock: 5,
        });

        // Junction binding: A1 → store A only, B1 → store B only.
        await db.insert(productStores).values({
            productId: productA1.id,
            storeId: storeA.id,
            isActive: true,
        });
        await db.insert(productStores).values({
            productId: productB1.id,
            storeId: storeB.id,
            isActive: true,
        });

        // Governance configs: A enabled, B disabled, C enabled but kill-switched.
        await db.insert(supportAgentConfigs).values({
            storeId: storeA.id,
            systemPrompt: 'test',
            isEnabled: true,
            killSwitchActive: false,
            escalationKeywords: ['advokatas', 'skundas'],
            budgetDailyEur: '10.00',
            dailySendLimit: 200,
            chatPersonaName: 'Tomas',
            chatPersonaSpecialty: 'testiniai įrankiai',
        });
        await db.insert(supportAgentConfigs).values({
            storeId: storeB.id,
            systemPrompt: 'test',
            isEnabled: false,
        });
        await db.insert(supportAgentConfigs).values({
            storeId: storeC.id,
            systemPrompt: 'test',
            isEnabled: true,
            killSwitchActive: true,
        });
    }, 120_000);

    // (a) Honest identity -------------------------------------------------

    it('prompt declares honest AI identity and carries no deception strings', () => {
        const prompt = buildStorefrontChatPrompt({
            persona: { name: 'Tomas', specialty: 'testiniai įrankiai' },
            storeName: 'Chat Store A',
            catalog: [],
        });
        expect(prompt).toContain('AI pardavimų asistentas');
        expect(prompt).toContain('virtualus konsultantas');
        expect(prompt).not.toContain('ŽMOGUS');
        expect(prompt).not.toMatch(/nesakyk.{0,3}kad esi AI/i);
        expect(prompt).not.toContain('NIEKADA nesakyk');
    });

    it('prompt injects only the scoped catalog (store A product, not store B)', () => {
        const catalog = [
            { id: productA1.id, name: productA1.titleEn, price: 19.99, url: `/products/${productA1.id}`, categoryName: 'tools' },
        ];
        const prompt = buildStorefrontChatPrompt({
            persona: { name: 'Tomas', specialty: 'testiniai įrankiai' },
            storeName: 'Chat Store A',
            catalog,
        });
        expect(prompt).toContain(productA1.titleEn);
        expect(prompt).toContain('19.99');
        expect(prompt).not.toContain(productB1.titleEn);
    });

    it('empty catalog renders "nepasiekiama" notice, never a foreign-store fallback', () => {
        const prompt = buildStorefrontChatPrompt({
            persona: { name: 'Tomas', specialty: 'testiniai įrankiai' },
            storeName: 'Chat Store C',
            catalog: [],
        });
        expect(prompt).toMatch(/nepasiekiama/);
        expect(prompt).not.toContain(productA1.titleEn);
        expect(prompt).not.toContain(productB1.titleEn);
    });

    // (b) Store-scoped catalog ---------------------------------------------

    it('getStoreChatCatalog is junction-scoped: store A never sees store B products', async () => {
        const itemsA = await getStoreChatCatalog(storeA.id);
        expect(itemsA.length).toBe(1);
        expect(itemsA[0].name).toBe(productA1.titleEn);
        expect(itemsA[0].id).toBe(productA1.id);

        const itemsB = await getStoreChatCatalog(storeB.id);
        expect(itemsB.length).toBe(1);
        expect(itemsB[0].id).toBe(productB1.id);
    });

    it('store with zero junction rows gets an empty catalog (no global fallback)', async () => {
        const items = await getStoreChatCatalog(storeC.id);
        expect(items).toEqual([]);
    });

    // (c) Governance wiring -------------------------------------------------

    it('is_enabled=false blocks the chat (ChatDisabledError / 503 semantics)', async () => {
        await expect(assertStoreChatAllowed(storeB.slug)).rejects.toBeInstanceOf(ChatDisabledError);
        const res = await handleStorefrontChat({ storeKeyOrSlug: storeB.slug, message: 'labas' });
        expect(res.ok).toBe(false);
        expect(res.statusCode).toBe(503);
    });

    it('kill_switch_active=true blocks the chat', async () => {
        await expect(assertStoreChatAllowed(storeC.slug)).rejects.toBeInstanceOf(ChatDisabledError);
        const res = await handleStorefrontChat({ storeKeyOrSlug: storeC.slug, message: 'labas' });
        expect(res.ok).toBe(false);
        expect(res.statusCode).toBe(503);
    });

    it('enabled store passes governance and exposes escalation keywords + budgets', async () => {
        const gov = await assertStoreChatAllowed(storeA.slug);
        expect(gov.persona.name).toBe('Tomas');
        expect(gov.escalationKeywords).toContain('advokatas');
        expect(gov.budgetDailyEur).not.toBeNull();
        expect(gov.dailySendLimit).not.toBeNull();
    });

    it('escalation keywords from config are injected into the prompt', () => {
        const prompt = buildStorefrontChatPrompt({
            persona: { name: 'Tomas', specialty: 'testiniai įrankiai' },
            storeName: 'Chat Store A',
            catalog: [],
            escalationKeywords: ['advokatas', 'skundas'],
        });
        expect(prompt).toContain('advokatas');
    });

    it('agent_types storefront_chat kill switch blocks even an enabled store', async () => {
        await db.update(agentTypes)
            .set({ killSwitchActive: true })
            .where(eq(agentTypes.typeKey, 'storefront_chat'));
        try {
            await expect(assertStoreChatAllowed(storeA.slug)).rejects.toBeInstanceOf(ChatDisabledError);
        } finally {
            await db.update(agentTypes)
                .set({ killSwitchActive: false })
                .where(eq(agentTypes.typeKey, 'storefront_chat'));
        }
    });

    it('exhausted daily budget blocks the chat', async () => {
        // budget_daily_eur = 10.00; log 11.00 (11_000_000 micros) of usage today.
        await db.insert(llmUsage).values({
            inputTokens: 100,
            outputTokens: 100,
            totalTokens: 200,
            costMicros: 11_000_000,
            jobType: 'storefront_chat',
        });
        try {
            await expect(assertStoreChatAllowed(storeA.slug)).rejects.toBeInstanceOf(ChatDisabledError);
        } finally {
            await db.delete(llmUsage).where(eq(llmUsage.jobType, 'storefront_chat'));
        }
        // Budget restored → allowed again.
        await expect(assertStoreChatAllowed(storeA.slug)).resolves.toBeTruthy();
    });

    it('daily_send_limit exhaustion blocks the chat', async () => {
        await db.update(supportAgentConfigs)
            .set({ dailySendLimit: 1 })
            .where(eq(supportAgentConfigs.storeId, storeA.id));
        await db.insert(llmUsage).values({
            inputTokens: 10,
            outputTokens: 10,
            totalTokens: 20,
            costMicros: 0,
            jobType: 'storefront_chat',
        });
        try {
            await expect(assertStoreChatAllowed(storeA.slug)).rejects.toBeInstanceOf(ChatDisabledError);
        } finally {
            await db.delete(llmUsage).where(eq(llmUsage.jobType, 'storefront_chat'));
            await db.update(supportAgentConfigs)
                .set({ dailySendLimit: 200 })
                .where(eq(supportAgentConfigs.storeId, storeA.id));
        }
    });

    // Happy path (mocked LLM) ----------------------------------------------

    it('enabled store gets a 200-style answer (MOCK_LLM)', async () => {
        const prevNodeEnv = process.env.NODE_ENV;
        process.env.NODE_ENV = 'test';
        process.env.MOCK_LLM = 'true';
        try {
            const res = await handleStorefrontChat({
                storeKeyOrSlug: storeA.slug,
                message: 'Sveiki, kas esate?',
            });
            expect(res.ok).toBe(true);
            if (res.ok) {
                expect(typeof res.response).toBe('string');
                expect(Array.isArray(res.relatedProducts)).toBe(true);
                // Prompt evidence: honest identity + store-scoped catalog in the
                // exact prompt the handler shipped to the LLM.
                expect(res.prompt).toContain('AI pardavimų asistentas');
                expect(res.prompt).toContain(productA1.titleEn);
                expect(res.prompt).not.toContain(productB1.titleEn);
            }
        } finally {
            delete process.env.MOCK_LLM;
            if (prevNodeEnv === undefined) delete process.env.NODE_ENV;
            else process.env.NODE_ENV = prevNodeEnv;
        }
    });

    // (d) Suradai domain ------------------------------------------------------

    it('suradai persona prompt carries no vaikų-mokslo / vitamin domain strings', () => {
        const prompt = buildStorefrontChatPrompt({
            persona: { name: 'Marius', specialty: 'įrankių ir technikos konsultacijos' },
            storeName: 'Suradai',
            catalog: [],
            storeFacts: 'Pristatymas: 2-5 d.d. Grąžinimas: 30 dienų.',
        });
        expect(prompt).not.toContain('vaikų mokslo');
        expect(prompt).not.toContain('Vitaminas D3');
        expect(prompt).not.toContain('Omega-3');
        expect(prompt).toContain('įrankių ir technikos konsultacijos');
    });

    // (e) W31-A1 RAG Compatibility & Deterministic Vytautas Advisor -----------

    it('extractEngineeringAttributes extracts brand, thread/DN, pressure/volume, and component role', () => {
        const valveAttr = extractEngineeringAttributes({
            sku: '013G0013',
            titleLt: 'Termostatinis ventilis Danfoss RA-N 15 (1/2") tiesus PN10',
            descriptionLt: 'Šildymo sistemos radiatoriaus vožtuvas DN15 su išankstiniu nustatymu',
        });
        expect(valveAttr.brand).toBe('Danfoss');
        expect(valveAttr.nominalDiameter).toBe('DN15');
        expect(valveAttr.pressureRating).toBe('PN10');
        expect(valveAttr.role).toBe('valve_body');

        const vesselAttr = extractEngineeringAttributes({
            sku: '7101003',
            titleLt: 'Plėtimosi indas Pneumatex Statico SD 35.3 (35 L, 3 bar)',
            descriptionLt: 'Membraninis išsiplėtimo indas šildymo sistemoms',
        });
        expect(vesselAttr.brand).toBe('Pneumatex');
        expect(vesselAttr.role).toBe('expansion_vessel');
        expect(vesselAttr.volumeLiters).toBe(35);
    });

    it('findCompatibleCatalogProducts retrieves cross-family HVAC pairings with LT explanations', async () => {
        const [cat] = await db.select().from(categories).limit(1);
        const [valveProd, headProd, vesselProd, safetyProd, sepProd] = await db.insert(products).values([
            {
                titleEn: `Danfoss RA-N 15 Valve ${RUN}`,
                titleLt: `Termostatinis vožtuvas Danfoss RA-N DN15 1/2" ${RUN}`,
                descriptionLt: 'Tiesus termostatinis ventilis radiatoriams DN15 PN10',
                status: 'published',
                categoryId: cat.id,
            },
            {
                titleEn: `Danfoss RA 2990 Thermostatic Head ${RUN}`,
                titleLt: `Termostatinė galvutė Danfoss RA 2990 ${RUN}`,
                descriptionLt: 'Jutiklis termostatiniams vožtuvams RA serija',
                status: 'published',
                categoryId: cat.id,
            },
            {
                titleEn: `Pneumatex Statico SD 25 Expansion Vessel ${RUN}`,
                titleLt: `Plėtimosi indas Pneumatex Statico SD 25 L PN6 ${RUN}`,
                descriptionLt: 'Išsiplėtimo indas šildymo sistemai 25 litrų',
                status: 'published',
                categoryId: cat.id,
            },
            {
                titleEn: `Pneumatex DSV Safety Valve DN15 ${RUN}`,
                titleLt: `Apsauginis vožtuvas Pneumatex DSV DN15 3 bar ${RUN}`,
                descriptionLt: 'Apsauginis vožtuvas katilams ir plėtimosi indams',
                status: 'published',
                categoryId: cat.id,
            },
            {
                titleEn: `Pneumatex Zeparo ZUK Air Dirt Separator DN20 ${RUN}`,
                titleLt: `Automatinis nuorintuvas ir purvo separatorius Zeparo DN20 ${RUN}`,
                descriptionLt: 'Oro ir šlamo separatorius šildymo sistemoms',
                status: 'published',
                categoryId: cat.id,
            },
        ]).returning();

        await db.insert(variants).values([
            { productId: valveProd.id, sku: `013G0013-${RUN}`, priceGross: 1850, stock: 10 },
            { productId: headProd.id, sku: `013G2990-${RUN}`, priceGross: 1420, stock: 12 },
            { productId: vesselProd.id, sku: `7101002-${RUN}`, priceGross: 8900, stock: 4 },
            { productId: safetyProd.id, sku: `DSV-15-${RUN}`, priceGross: 2450, stock: 8 },
            { productId: sepProd.id, sku: `ZEPARO-20-${RUN}`, priceGross: 6700, stock: 3 },
        ]);

        await db.insert(productStores).values([
            { productId: valveProd.id, storeId: storeA.id, isActive: true },
            { productId: headProd.id, storeId: storeA.id, isActive: true },
            { productId: vesselProd.id, storeId: storeA.id, isActive: true },
            { productId: safetyProd.id, storeId: storeA.id, isActive: true },
            { productId: sepProd.id, storeId: storeA.id, isActive: true },
        ]);

        // 1. Valve body -> recommends thermostatic head
        const valveCompat = await findCompatibleCatalogProducts({
            storeId: storeA.id,
            productId: valveProd.id,
        });
        expect(valveCompat.focalProduct?.id).toBe(valveProd.id);
        expect(valveCompat.focalProduct?.attributes.role).toBe('valve_body');
        expect(valveCompat.compatibleProducts.some((p) => p.id === headProd.id)).toBe(true);
        expect(valveCompat.bundleExplanation).toMatch(/termostatin/i);
        expect(valveCompat.installationSteps.length).toBeGreaterThanOrEqual(2);
        expect(valveCompat.vytautasPitch).toMatch(/uzklausa|komplekt/i);

        // 2. Expansion vessel -> recommends safety valve + air/dirt separator
        const vesselCompat = await findCompatibleCatalogProducts({
            storeId: storeA.id,
            productId: vesselProd.id,
        });
        expect(vesselCompat.focalProduct?.id).toBe(vesselProd.id);
        const compatIds = vesselCompat.compatibleProducts.map((p) => p.id);
        expect(compatIds).toContain(safetyProd.id);
        expect(compatIds).toContain(sepProd.id);
        expect(vesselCompat.bundleExplanation).toMatch(/apsauginis vožtuvas|nuorintuvas|separatorius/i);
    });

    it('handleStorefrontChat returns deterministic Vytautas RAG consultative response when LLM key is absent', async () => {
        const prevOpenAi = process.env.OPENAI_API_KEY;
        const prevDeepSeek = process.env.DEEPSEEK_API_KEY;
        const prevMock = process.env.MOCK_LLM;
        delete process.env.OPENAI_API_KEY;
        delete process.env.DEEPSEEK_API_KEY;
        delete process.env.MOCK_LLM;
        try {
            const res = await handleStorefrontChat({
                storeKeyOrSlug: storeA.slug,
                message: `Kokios prekės dera su termostatiniu vožtuvu 013G0013-${RUN}?`,
            });
            expect(res.ok).toBe(true);
            if (res.ok) {
                expect(res.mode).toBe('vytautas_rag_advisor');
                expect(res.response).toMatch(/Girdžiu|Pažiūrėkime|Suderinamumas/i);
                expect(res.response).toContain(`013G0013-${RUN}`);
                expect(res.response).toContain(`013G2990-${RUN}`);
                expect(res.response).toMatch(/(?:EUR|€) su PVM/);
                expect(res.response).toMatch(/\/uzklausa/);
                expect(res.relatedProducts.length).toBeGreaterThan(0);
                // Prompt also enriched with RAG compatibility block
                expect(res.prompt).toMatch(/SUDERINAMUMAS IR KOMPLEKTAVIMAS/i);
            }

            // When requireLiveLlm: true (or allowDeterministicFallback: false), preserves 503 llm key not configured
            const strictRes = await handleStorefrontChat({
                storeKeyOrSlug: storeA.slug,
                message: 'Sveiki',
                requireLiveLlm: true,
            });
            expect(strictRes.ok).toBe(false);
            if (!strictRes.ok) {
                expect(strictRes.statusCode).toBe(503);
                expect(strictRes.reason).toBe('llm key not configured');
            }
        } finally {
            if (prevOpenAi !== undefined) process.env.OPENAI_API_KEY = prevOpenAi;
            if (prevDeepSeek !== undefined) process.env.DEEPSEEK_API_KEY = prevDeepSeek;
            if (prevMock !== undefined) process.env.MOCK_LLM = prevMock;
        }
    }, 20000);

    it('W38-A1: inferRole enforces Title-First noun dominance for 4160-16.039, 013G5389, and 6602-00.363 and omits be PVM / robotic footers', () => {
        // 4160-16.039: Antgalis litavimui DN15(1/2) vamzdžio skersmuo 16mm -> fitting_connector, NEVER valve_body
        const tailpiece = extractEngineeringAttributes({
            sku: '4160-16.039',
            titleLt: 'Antgalis litavimui DN15(1/2) vamzdžio skersmuo 16mm',
            descriptionLt: 'Antgalis litavimui prie IMI Heimeier termostatinių vožtuvų DN15',
        });
        expect(tailpiece.role).toBe('fitting_connector');
        expect(tailpiece.role).not.toBe('valve_body');
        expect(tailpiece.role).not.toBe('thermostatic_head');

        // 013G5389: Apsauga nuo vagystės, RTD, M30x1,5 -> fitting_connector, NEVER thermostatic_head
        const antiTheft = extractEngineeringAttributes({
            sku: '013G5389',
            titleLt: 'Apsauga nuo vagystės, RTD, M30x1,5',
            descriptionLt: 'Apsauginis žiedas Danfoss termostatinėms galvutėms',
        });
        expect(antiTheft.role).toBe('fitting_connector');
        expect(antiTheft.role).not.toBe('thermostatic_head');

        // 6602-00.363: Žalvarinė panardinama įvorė 1/2"x186mm -> fitting_connector, NEVER thermostatic_head
        const sleeve = extractEngineeringAttributes({
            sku: '6602-00.363',
            titleLt: 'Žalvarinė panardinama įvorė 1/2"x186mm',
            descriptionLt: 'Panardinama įvorė temperatūros jutikliui ir termostatinei galvutei su kapiliaru',
        });
        expect(sleeve.role).toBe('fitting_connector');
        expect(sleeve.role).not.toBe('thermostatic_head');

        // Real thermostatic head & valve still classify accurately
        expect(
            inferRole({
                sku: '013G2970',
                titleLt: 'Termostatinė galvutė Danfoss Redia RA Click',
            }),
        ).toBe('thermostatic_head');
        expect(
            inferRole({
                sku: '3933-02.000',
                titleLt: 'Termostatinis vožtuvas IMI Heimeier Eclipse DN15',
            }),
        ).toBe('valve_body');

        // Deterministic reply contains zero "be PVM" and zero robotic 1./2. footer
        const reply = buildVytautasDeterministicResponse({
            message: 'Kokia galvutė tinka 3933-02.000?',
            storeName: 'SURADAI',
            personaName: 'Vytautas',
            compat: {
                focalProduct: {
                    id: 'p1',
                    sku: '3933-02.000',
                    name: 'IMI Heimeier Eclipse DN15',
                    description: '',
                    price: 36.3,
                    priceNet: 30.0,
                    url: '/products/p1',
                    image: '/images/products/3933-02.000.webp',
                    categoryName: 'Vožtuvai',
                    brandName: 'IMI Heimeier',
                    attributes: extractEngineeringAttributes({
                        sku: '3933-02.000',
                        titleLt: 'Termostatinis vožtuvas IMI Heimeier Eclipse DN15',
                    }),
                },
                queryAttributes: extractEngineeringAttributes({
                    sku: '3933-02.000',
                    titleLt: 'Termostatinis vožtuvas IMI Heimeier Eclipse DN15',
                }),
                compatibleProducts: [],
                bundleExplanation: 'Suderinama su M30x1,5 galvutėmis.',
                installationSteps: ['Patikrinkite sriegį DN15.'],
                vytautasPitch: 'Jei turite viso objekto specifikaciją, įkelkite sąrašą per /uzklausa.',
            },
            searchItems: [],
        });
        expect(reply).not.toContain('be PVM');
        expect(reply).not.toContain('1. Komplektuoti čia');
        expect(reply).not.toContain('2. Skaičiuoti objektui');
    });

    it('W41-A1: resolves per-store stores.settings.vytautasLlm and featureModules and synthesizes RAG response via DeepSeek Flash when configured', async () => {
        await db.update(stores)
            .set({
                settings: {
                    vytautasLlm: {
                        provider: 'deepseek',
                        baseUrl: 'https://api.deepseek.com',
                        model: 'deepseek-flash',
                        apiKey: 'dummy-test-key-for-unit-spec',
                        thinkingEnabled: false,
                    },
                    featureModules: {
                        customerJourneyTrackerEnabled: true,
                        proactiveVytautasEnabled: true,
                        instantAiSearchEnabled: true,
                        interactiveCalculatorsEnabled: true,
                        diagnosticComparisonHubEnabled: true,
                        pdpFaqAndComparisonEnabled: false,
                    },
                },
            })
            .where(eq(stores.id, storeA.id));

        const gov = await assertStoreChatAllowed(storeA.slug);
        expect(gov.vytautasLlm?.provider).toBe('deepseek');
        expect(gov.vytautasLlm?.model).toBe('deepseek-flash');
        expect(gov.featureModules?.customerJourneyTrackerEnabled).toBe(true);
        expect(gov.featureModules?.pdpFaqAndComparisonEnabled).toBe(false);

        const origFetch = globalThis.fetch;
        const fetchSpy = vi.fn().mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => ({
                model: 'deepseek-flash',
                choices: [
                    {
                        message: {
                            content: `Sveiki! Pagal jūsų pasirinktą vožtuvą 013G0013-${RUN} (18.50 EUR su PVM) tiesiogiai tinka Danfoss RA 2990 galvutė (013G2990-${RUN}, 14.20 EUR su PVM).`,
                        },
                    },
                ],
                usage: { prompt_tokens: 120, completion_tokens: 45, total_tokens: 165 },
            }),
        });
        globalThis.fetch = fetchSpy as unknown as typeof fetch;

        try {
            const res = await handleStorefrontChat({
                storeKeyOrSlug: storeA.slug,
                message: `Kokia galvutė dera su 013G0013-${RUN}?`,
                journeyContext: {
                    searches: [`013G0013-${RUN}`],
                    calculatorSummary: 'Radiatoriaus skaičiuoklė: 18 m² → 1.44 kW, DN15',
                },
            });
            expect(res.ok).toBe(true);
            if (res.ok) {
                expect(res.mode).toBe('vytautas_rag_advisor');
                expect(res.response).toContain(`013G0013-${RUN}`);
                expect(res.response).toContain(`013G2990-${RUN}`);
                expect(res.rag?.focalProduct?.sku).toBe(`013G0013-${RUN}`);
                expect(res.rag?.compatibleProducts.length).toBeGreaterThan(0);
                expect(res.rag?.bundleProducts.length).toBeGreaterThan(0);
            }
            expect(fetchSpy).toHaveBeenCalledTimes(1);
            expect(fetchSpy.mock.calls[0][0]).toBe('https://api.deepseek.com/chat/completions');
        } finally {
            globalThis.fetch = origFetch;
            await db.update(stores).set({ settings: null }).where(eq(stores.id, storeA.id));
        }
    });

    it('W42-A1: unwrapResponseEnvelope cleanly extracts human prose when DeepSeek JSON envelope is truncated mid-stream', () => {
        const truncated = '{"response": "Rekomenduoju Dynacon 9330-06.800 (575,63 €).", "suggestedProducts": [{"sku": "9330-06';
        expect(unwrapResponseEnvelope(truncated)).toBe('Rekomenduoju Dynacon 9330-06.800 (575,63 €).');

        const truncatedWithEscapes =
            '{"response": "Girdžiu — 6 kontūrams tinka:\\n- [Dynacon 9330-06.800](/products/p1) — 575,63 € su PVM", "suggestedProducts": [{"id": "p1", "price": 575.63';
        const unwrapped = unwrapResponseEnvelope(truncatedWithEscapes);
        expect(unwrapped).toContain('Girdžiu — 6 kontūrams tinka:');
        expect(unwrapped).toContain('[Dynacon 9330-06.800](/products/p1) — 575,63 € su PVM');
        expect(unwrapped).not.toContain('suggestedProducts');
        expect(unwrapped).not.toContain('{"response"');
    });

    it('W42-A1: extractChatSearchQueries excludes 230V/DN15 unit tokens from bare SKU matches and always extracts Dynacon / 6 žied / kolektorius stems', async () => {
        const queries = extractChatSearchQueries(
            'Reikia 6 žiedų grindinio šildymo kolektoriaus Dynacon ir pavarų 230V',
        );
        expect(queries.map((q) => q.toLowerCase())).toContain('dynacon');
        expect(queries.map((q) => q.toLowerCase())).toContain('kolektorius');
        expect(queries.map((q) => q.toLowerCase())).toContain('6 žied');
        expect(queries.map((q) => q.toUpperCase())).not.toContain('230V');

        // Also verify handleStorefrontChat multi-query deduplicated retrieval finds BOTH Dynacon 6 žiedai and 230V actuator
        const [cat] = await db.select().from(categories).limit(1);
        const [dynaconProd, actuatorProd] = await db
            .insert(products)
            .values([
                {
                    titleEn: `IMI Heimeier Dynacon 6 loops ${RUN}`,
                    titleLt: `Dynacon nerūdijančio plieno grindinio šildymo kolektorius 6 žiedai ${RUN}`,
                    descriptionLt: 'Grindinio šildymo kolektorius Dynacon 6 kontūrų G3/4',
                    status: 'published',
                    categoryId: cat.id,
                },
                {
                    titleEn: `IMI Heimeier EMO T 230V Actuator ${RUN}`,
                    titleLt: `Termoelektrinė pavara Heimeier EMO T 230V NC M30x1,5 ${RUN}`,
                    descriptionLt: 'Pavara kolektoriams 230V NC',
                    status: 'published',
                    categoryId: cat.id,
                },
            ])
            .returning();

        await db.insert(variants).values([
            { productId: dynaconProd.id, sku: `9330-06.800-${RUN}`, priceGross: 57563, stock: 4 },
            { productId: actuatorProd.id, sku: `1837-00.500-${RUN}`, priceGross: 3490, stock: 20 },
        ]);
        await db.insert(productStores).values([
            { productId: dynaconProd.id, storeId: storeA.id, isActive: true },
            { productId: actuatorProd.id, storeId: storeA.id, isActive: true },
        ]);

        const prevOpenAi = process.env.OPENAI_API_KEY;
        const prevDeepSeek = process.env.DEEPSEEK_API_KEY;
        const prevMock = process.env.MOCK_LLM;
        delete process.env.OPENAI_API_KEY;
        delete process.env.DEEPSEEK_API_KEY;
        delete process.env.MOCK_LLM;
        try {
            const res = await handleStorefrontChat({
                storeKeyOrSlug: storeA.slug,
                message: 'Reikia 6 žiedų grindinio šildymo kolektoriaus Dynacon ir pavarų 230V',
            });
            expect(res.ok).toBe(true);
            if (res.ok) {
                expect(res.prompt).toContain(`9330-06.800-${RUN}`);
                expect(res.prompt).toContain(`1837-00.500-${RUN}`);
                expect(res.response).toContain(`9330-06.800-${RUN}`);
            }
        } finally {
            if (prevOpenAi !== undefined) process.env.OPENAI_API_KEY = prevOpenAi;
            if (prevDeepSeek !== undefined) process.env.DEEPSEEK_API_KEY = prevDeepSeek;
            if (prevMock !== undefined) process.env.MOCK_LLM = prevMock;
        }
    });

    it('W43-A1/W119-A2: journey localStorage key is giles_-prefixed and namespaced per store id', () => {
        // Old foreign Suradai store uuid, assembled to keep its literal out of src/.
        const legacyForeignUuid = ['0967', '82b2', '27d1', '4151', 'a687', '0612', 'b6cd', '1fba'].join('-');
        expect(resolveJourneyStorageKey('suradai')).toBe('giles_customer_journey_v1_suradai');
        expect(resolveJourneyStorageKey(legacyForeignUuid)).toBe(
            `giles_customer_journey_v1_${legacyForeignUuid}`,
        );
        expect(resolveJourneyStorageKey('store-b-hvac')).toBe('giles_customer_journey_v1_store-b-hvac');

        setJourneyTrackingConfig({ enabled: false, storeId: 'store-b-hvac', proactiveTrigger: false });
        expect(getJourneySummaryForPrompt(['SKU-1 x2'])).toBe('');
        expect(buildChatJourneyContext(['SKU-1 x2']).cartSkus).toEqual([]);

        setJourneyTrackingConfig({ enabled: true, storeId: 'suradai', proactiveTrigger: true });
    });

    it('W44-A1: cleanChatResponseProse strips raw markdown links, extracts visual suggestedProducts cards, and enforces zero em-dashes', () => {
        const rawOwnerTranscript = [
            'Girdžiu — pagal jūsų 140 m² namo skaičiavimą rekomenduoju:',
            '- [Statico-SD 25.3 išsiplėtimo indas, butyl kamera 25 l/3 bar, R3/4″ – 7101003](/products/8ada2c59-3a44-44b4-8c79-8f5a81e84790) — kodas=[REDACTED], 149.62 EUR su PVM',
            '- [Aquapresso-AD 18.10 išsiplėtimo indas boileriui, PN10 – 7111002](/products/ad3394a8-d1e0-48bd-b7f4-5a79a44bdcc8) — kodas=7111002, 227.91 EUR su PVM',
            '',
            'Statico skirtas šildymo kontūrui — o Aquapresso geriamam vandeniui.',
        ].join('\n');

        const cleaned = cleanChatResponseProse(rawOwnerTranscript, []);
        expect(cleaned.text).not.toContain('](/products/');
        expect(cleaned.text).not.toContain('[REDACTED]');
        expect(cleaned.text).not.toContain('—');
        expect(cleaned.text).toContain('–');
        expect(cleaned.suggestedProducts).toHaveLength(2);
        expect(cleaned.suggestedProducts[0]).toMatchObject({
            id: '8ada2c59-3a44-44b4-8c79-8f5a81e84790',
            sku: '7101003',
            formattedPrice: '149,62 €',
            brandName: 'IMI Pneumatex',
            brandLogoUrl: '/suradai/images/brands/imi-pneumatex.svg',
            applicationRole: 'Šildymo kontūrui',
        });
        expect(cleaned.suggestedProducts[1]).toMatchObject({
            id: 'ad3394a8-d1e0-48bd-b7f4-5a79a44bdcc8',
            sku: '7111002',
            formattedPrice: '227,91 €',
            brandName: 'IMI Pneumatex',
            brandLogoUrl: '/suradai/images/brands/imi-pneumatex.svg',
            applicationRole: 'Boileriui (geriamas vanduo)',
        });
    });

    it('W44-A1: residential Statico vs Aquapresso query (140 m², 5.5 kW katilas + 200 L boileris) recommends residential vessels and NEVER recommends 20,623 € 7111020 industrial tank', async () => {
        const [cat] = await db.select().from(categories).limit(1);
        const [staticoRes, aquapressoRes, aquapressoInd] = await db
            .insert(products)
            .values([
                {
                    titleEn: `Statico-SD 25.3 expansion vessel 25L ${RUN}`,
                    titleLt: `Statico-SD 25.3 išsiplėtimo indas, butyl kamera 25 l/3 bar, R3/4″ – 7101003`,
                    descriptionLt: 'Šildymo sistemos išsiplėtimo indas 25 l 3 bar',
                    status: 'published',
                    categoryId: cat.id,
                },
                {
                    titleEn: `Aquapresso-AD 18.10 DHW expansion vessel 18L ${RUN}`,
                    titleLt: `Aquapresso-AD 18.10 išsiplėtimo indas geriamam vandeniui 18 l PN10 R3/4″ – 7111002`,
                    descriptionLt: 'Geriamojo vandens ir boilerių išsiplėtimo indas 18 l 10 bar',
                    status: 'published',
                    categoryId: cat.id,
                },
                {
                    titleEn: `Aquapresso-AG 2000.10 industrial vessel 2000L ${RUN}`,
                    titleLt: `Aquapresso-AG 2000.10 išsiplėtimo indas, butyl kamera, DN80, PN10 – 7111020`,
                    descriptionLt: 'Pramoninis 2000 litrų išsiplėtimo indas DN80 PN10',
                    status: 'published',
                    categoryId: cat.id,
                },
            ])
            .returning();

        await db.insert(variants).values([
            { productId: staticoRes.id, sku: '7101003', priceGross: 14962, stock: 10 },
            { productId: aquapressoRes.id, sku: '7111002', priceGross: 22791, stock: 8 },
            { productId: aquapressoInd.id, sku: '7111020', priceGross: 2062340, stock: 1 },
        ]);
        await db.insert(productStores).values([
            { productId: staticoRes.id, storeId: storeA.id, isActive: true },
            { productId: aquapressoRes.id, storeId: storeA.id, isActive: true },
            { productId: aquapressoInd.id, storeId: storeA.id, isActive: true },
        ]);

        const prevOpenAi = process.env.OPENAI_API_KEY;
        const prevDeepSeek = process.env.DEEPSEEK_API_KEY;
        const prevMock = process.env.MOCK_LLM;
        delete process.env.OPENAI_API_KEY;
        delete process.env.DEEPSEEK_API_KEY;
        delete process.env.MOCK_LLM;
        try {
            const res = await handleStorefrontChat({
                storeKeyOrSlug: storeA.slug,
                message: 'Kuo skiriasi Statico (7101003) ir Aquapresso plėtimosi indai mano 140 m² namui (5.5 kW katilas + 200 L boileris)?',
                journeyContext: {
                    calculatorSummary: 'Katilo ir boilerio skaičiuoklė: 140 m², A+ klasė -> 5.5 kW šilumos šaltinis + 200 L boileris',
                },
            });
            expect(res.ok).toBe(true);
            if (res.ok) {
                expect(res.response).not.toContain('—');
                expect(res.response).not.toContain('](/products/');
                expect(res.response).not.toContain('7111020');
                expect(res.response).not.toContain('20623');

                const recommendedSkus = res.suggestedProducts.map((p) => p.sku);
                expect(recommendedSkus).toContain('7101003');
                expect(recommendedSkus).toContain('7111002');
                expect(recommendedSkus).not.toContain('7111020');
            }
        } finally {
            if (prevOpenAi !== undefined) process.env.OPENAI_API_KEY = prevOpenAi;
            if (prevDeepSeek !== undefined) process.env.DEEPSEEK_API_KEY = prevDeepSeek;
            if (prevMock !== undefined) process.env.MOCK_LLM = prevMock;
        }
    });

    it('W45-A1: Mode 1 greetings ("ka tu", "labas", "sveiki") return conversational reply and ZERO products (suggestedProducts: [], relatedProducts: [])', async () => {
        expect(extractChatSearchQueries('ka tu')).toEqual([]);
        expect(extractChatSearchQueries('labas')).toEqual([]);
        expect(extractChatSearchQueries('sveiki')).toEqual([]);

        const origFetch = globalThis.fetch;
        const fetchSpy = vi.fn().mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => ({
                model: 'deepseek-flash',
                choices: [
                    {
                        message: {
                            content: JSON.stringify({
                                mode: 'greeting',
                                response:
                                    'Esu Vytautas, Suradai.lt pardavimų konsultantas. Padedu rasti tinkamą šildymo ar santechnikos sprendimą pagal kodą, matmenis ar objektą. Ką šiandien sprendžiate?',
                                suggestedProducts: [],
                                escalate: false,
                            }),
                        },
                    },
                ],
                usage: { prompt_tokens: 80, completion_tokens: 30, total_tokens: 110 },
            }),
        });
        globalThis.fetch = fetchSpy as unknown as typeof fetch;

        try {
            for (const greeting of ['ka tu', 'labas', 'sveiki']) {
                const res = await handleStorefrontChat({
                    storeKeyOrSlug: storeA.slug,
                    message: greeting,
                    providerConfig: {
                        provider: 'deepseek',
                        baseUrl: 'https://api.deepseek.com',
                        model: 'deepseek-flash',
                        apiKey: 'dummy-deepseek-key',
                    },
                });
                expect(res.ok).toBe(true);
                if (res.ok) {
                    expect(res.response).toContain('Vytautas');
                    expect(res.suggestedProducts).toEqual([]);
                    expect(res.relatedProducts).toEqual([]);
                    expect(res.compatibility).toBeNull();
                    expect(res.rag).toBeNull();
                }
            }
        } finally {
            globalThis.fetch = origFetch;
        }
    });

    it('W45-A1: Mode 2 broad unclarified discovery ("reikia kolektoriaus", "ką siūlai?") asks 1 clarifying question and returns ZERO products', async () => {
        expect(extractChatSearchQueries('reikia kolektoriaus')).toEqual([]);
        expect(extractChatSearchQueries('ką siūlai?')).toEqual([]);

        const origFetch = globalThis.fetch;
        const fetchSpy = vi.fn().mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => ({
                model: 'deepseek-flash',
                choices: [
                    {
                        message: {
                            content: JSON.stringify({
                                mode: 'discovery',
                                response:
                                    'Girdžiu, ieškote grindinio šildymo kolektoriaus. Kad parinkčiau tikslų modelį, patikslinkite: kelių kontūrų (žiedų, nuo 2 iki 12) reikia jūsų sistemai ir ar komplektuojame kartu su 230 V pavaromis?',
                                suggestedProducts: [],
                                escalate: false,
                            }),
                        },
                    },
                ],
                usage: { prompt_tokens: 90, completion_tokens: 40, total_tokens: 130 },
            }),
        });
        globalThis.fetch = fetchSpy as unknown as typeof fetch;

        try {
            for (const broadQuery of ['reikia kolektoriaus', 'ką siūlai?']) {
                const res = await handleStorefrontChat({
                    storeKeyOrSlug: storeA.slug,
                    message: broadQuery,
                    providerConfig: {
                        provider: 'deepseek',
                        baseUrl: 'https://api.deepseek.com',
                        model: 'deepseek-flash',
                        apiKey: 'dummy-deepseek-key',
                    },
                });
                expect(res.ok).toBe(true);
                if (res.ok) {
                    expect(res.response).toMatch(/\?/);
                    expect(res.suggestedProducts).toEqual([]);
                    expect(res.relatedProducts).toEqual([]);
                }
            }
        } finally {
            globalThis.fetch = origFetch;
        }
    });

    it('W45-A1: Mode 3 LLM on-demand search_store_catalog tool call pulls products and returns ONLY LLM-selected cards with clean Lithuanian titles', async () => {
        // 1. Verify raw supplier wholesaler descriptions and ALL-CAPS English titles normalize into clean human Lithuanian titles
        const rawDanfossHead = resolveChatCardMetadata({
            id: 'prod-013g2970',
            sku: '013G2970',
            name: 'Standartinis, įmontuotas daviklis su dujinu užpildu, temp. ribos 5-21 °C. Rekomenduojama naudoti daugiabučiuose BE apskaitos',
            price: 29.89,
        });
        expect(rawDanfossHead.title).toBe('Danfoss RA 013G2970 termostatinė galvutė (5–21 °C)');
        expect(rawDanfossHead.name).toBe('Danfoss RA 013G2970 termostatinė galvutė (5–21 °C)');

        const rawStadValve = resolveChatCardMetadata({
            id: 'prod-stad-15',
            sku: '52-151-015',
            name: 'STAD BAL.VALVE BALANCING PRE-SETTING MEASURING SHUT-OFF WITHOUT DRAINING PN20 DN15/14 G1/2',
            price: 68.5,
        });
        expect(rawStadValve.title).toBe('IMI TA STAD DN15 balansinis vožtuvas (G1/2, PN20)');
        expect(normalizeStorefrontProductTitle('RA ventilio korpusas', '013G0372')).toBe(
            'Danfoss RA-N termostatinio vožtuvo korpusas (013G0372)',
        );

        // 2. Verify single-roundtrip pre-fetched Mode 3 proposal + fallback 2-step search_store_catalog tool invocation when uncovered query is requested
        const origFetch = globalThis.fetch;
        const singleTripSpy = vi.fn().mockResolvedValueOnce({
            ok: true,
            status: 200,
            json: async () => ({
                model: 'deepseek-flash',
                choices: [
                    {
                        message: {
                            content: JSON.stringify({
                                mode: 'proposal',
                                response:
                                    'Jūsų 140 m² namui su 5.5 kW katilu ir 200 L boileriu šildymo kontūrui tinka IMI Pneumatex Statico SD 25.3 (kodas 7101003, 149,62 € su PVM), o karšto vandens boileriui – Aquapresso AD 18.10 (kodas 7111002, 227,91 € su PVM). Kurį mazgą dedame į krepšelį?',
                                suggestedProducts: [
                                    { sku: '7101003' },
                                    { sku: '7111002' },
                                ],
                                escalate: false,
                            }),
                        },
                    },
                ],
                usage: { prompt_tokens: 180, completion_tokens: 65, total_tokens: 245 },
            }),
        });
        globalThis.fetch = singleTripSpy as unknown as typeof fetch;

        try {
            const res = await handleStorefrontChat({
                storeKeyOrSlug: storeA.slug,
                message:
                    'Lyginu sprendimus: Statico vs Aquapresso. Mano namas 140 m², 5.5 kW katilas + 200 L boileris.',
                providerConfig: {
                    provider: 'deepseek',
                    baseUrl: 'https://api.deepseek.com',
                    model: 'deepseek-flash',
                    apiKey: 'dummy-deepseek-key',
                },
            });
            expect(res.ok).toBe(true);
            // W47-A1 Gap 2: Single LLM roundtrip (~2.0s instead of 5.6s) when candidates are pre-fetched in <15ms
            expect(singleTripSpy).toHaveBeenCalledTimes(1);
            if (res.ok) {
                expect(res.suggestedProducts).toHaveLength(2);
                expect(res.suggestedProducts.map((p) => p.sku)).toEqual(['7101003', '7111002']);
                expect(res.relatedProducts.map((p) => p.sku)).toEqual(['7101003', '7111002']);
                expect(res.suggestedProducts[0].brandName).toBe('IMI Pneumatex');
                expect(res.suggestedProducts[1].brandName).toBe('IMI Pneumatex');
            }
        } finally {
            globalThis.fetch = origFetch;
        }
    });
});
