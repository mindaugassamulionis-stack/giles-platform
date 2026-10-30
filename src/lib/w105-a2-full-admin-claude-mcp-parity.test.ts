import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import * as mcpRoute from '../app/api/mcp/route';
import * as adminProductsRoute from '../app/api/admin/products/route';
import { resetMcpSecurityDatabase } from './mcp-store-server';
import { resetB2BPricingEngineState } from './b2b-pricing-engine';
import { resetSuppliersAndAgentsStore, getAiAgentsList, getSuppliersList } from './suppliers-and-agents-store';
import {
    resetCatalogOverrides,
    getGilesCatalogSnapshot,
    findGilesSnapshotProductBySlugOrId,
    getCatalogProductOverride,
} from './giles-catalog-snapshot';
import { MCP_STORE_TOOLS, MCP_STORE_RESOURCES } from './mcp-store-catalog';

describe('WP-W105-A2: Full Admin & External Claude MCP Parity (32 Tools, 10 Resources, Internal AI Agents, Suppliers & Full Product CRUD)', () => {
    const repoRoot = path.resolve(__dirname, '../..');

    beforeEach(() => {
        resetMcpSecurityDatabase();
        resetB2BPricingEngineState();
        resetSuppliersAndAgentsStore();
        resetCatalogOverrides();
    });

    afterEach(() => {
        resetMcpSecurityDatabase();
        resetB2BPricingEngineState();
        resetSuppliersAndAgentsStore();
        resetCatalogOverrides();
    });

    it('1) exposes 32 MCP tools and 10 MCP resources including admin_ai_agents_manage, admin_suppliers_pricelist_manage, products_full_crud_manage', () => {
        expect(MCP_STORE_TOOLS).toHaveLength(32);
        expect(MCP_STORE_RESOURCES).toHaveLength(10);

        const toolNames = MCP_STORE_TOOLS.map((t) => t.name);
        expect(toolNames).toContain('admin_ai_agents_manage');
        expect(toolNames).toContain('admin_suppliers_pricelist_manage');
        expect(toolNames).toContain('products_full_crud_manage');

        const agentsTool = MCP_STORE_TOOLS.find((t) => t.name === 'admin_ai_agents_manage');
        const suppliersTool = MCP_STORE_TOOLS.find((t) => t.name === 'admin_suppliers_pricelist_manage');
        const productsCrudTool = MCP_STORE_TOOLS.find((t) => t.name === 'products_full_crud_manage');

        expect(agentsTool?.scopeCategory).toBe('admin');
        expect(suppliersTool?.scopeCategory).toBe('admin');
        expect(productsCrudTool?.scopeCategory).toBe('write');

        const resourceUris = MCP_STORE_RESOURCES.map((r) => r.uri);
        expect(resourceUris).toContain('giles://admin/ai-agents-and-logs');
        expect(resourceUris).toContain('giles://admin/suppliers-and-pricelists');
    });

    it('2) allows Darius external Claude agent to control all internal store AI agents and logs via admin_ai_agents_manage and giles://admin/ai-agents-and-logs', async () => {
        const keyRes = await mcpRoute.PUT(
            new Request('http://localhost/api/mcp', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'generate_key',
                    name: 'Darius Claude Full Admin',
                    scope: 'full_admin',
                }),
            }),
        );
        const { rawKey } = await keyRes.json();

        const callMcp = async (method: string, params: Record<string, unknown> = {}) => {
            const res = await mcpRoute.POST(
                new Request('http://localhost/api/mcp', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${rawKey}`,
                    },
                    body: JSON.stringify({
                        jsonrpc: '2.0',
                        id: Date.now(),
                        method,
                        params,
                    }),
                }),
            );
            return res.json();
        };

        // 1. list_agents_and_logs
        const listRes = await callMcp('tools/call', {
            name: 'admin_ai_agents_manage',
            arguments: { op: 'list_agents_and_logs' },
        });
        const listPayload = listRes.result.structuredContent;
        expect(listPayload.ok).toBe(true);
        expect(listPayload.agents.length).toBeGreaterThanOrEqual(6);
        expect(listPayload.logs.all.length).toBeGreaterThan(0);
        expect(Array.isArray(listPayload.logs.unanswered)).toBe(true);

        // 2. toggle_agent (turn vytautas-consultant OFF -> disabled, then ON -> autonomous)
        const offRes = await callMcp('tools/call', {
            name: 'admin_ai_agents_manage',
            arguments: {
                op: 'toggle_agent',
                agentId: 'vytautas-consultant',
                executionMode: 'disabled',
            },
        });
        expect(offRes.result.structuredContent.ok).toBe(true);
        expect(offRes.result.structuredContent.agent.executionMode).toBe('disabled');
        expect(offRes.result.structuredContent.agent.status).toBe('DISABLED');

        const onRes = await callMcp('tools/call', {
            name: 'admin_ai_agents_manage',
            arguments: {
                op: 'toggle_agent',
                agentId: 'vytautas-consultant',
                executionMode: 'autonomous',
            },
        });
        expect(onRes.result.structuredContent.agent.executionMode).toBe('autonomous');
        expect(onRes.result.structuredContent.agent.status).toBe('ACTIVE');

        // 3. update_agent_config
        const cfgRes = await callMcp('tools/call', {
            name: 'admin_ai_agents_manage',
            arguments: {
                op: 'update_agent_config',
                agentId: 'pricing-margin-guard',
                guardrailMinMarginPct: 18,
                modelId: 'claude-sonnet-4-20250514',
                temperature: 0.15,
                systemPrompt: 'Saugok >=18% maržos grindis visoms Danfoss ir HERZ pozicijoms.',
            },
        });
        expect(cfgRes.result.structuredContent.ok).toBe(true);
        expect(cfgRes.result.structuredContent.agent.guardrailMinMarginPct).toBe(18);
        expect(cfgRes.result.structuredContent.agent.systemPrompt).toContain('>=18%');

        // 4. register_byo_agent
        const byoRes = await callMcp('tools/call', {
            name: 'admin_ai_agents_manage',
            arguments: {
                op: 'register_byo_agent',
                id: 'darius-claude-copilot',
                name: 'Dariaus Išorinis Claude Parduotuvės Agentas',
                provider: 'Anthropic Claude',
                modelId: 'claude-sonnet-4-20250514',
                executionMode: 'autonomous',
                guardrailMinMarginPct: 16,
                systemPrompt: 'Valdyk Gilės Inžinerijos katalogą ir B2B pasiūlymus.',
            },
        });
        expect(byoRes.result.structuredContent.ok).toBe(true);
        expect(getAiAgentsList().some((a) => a.id === 'darius-claude-copilot')).toBe(true);

        // 5. run_agent_now
        const runRes = await callMcp('tools/call', {
            name: 'admin_ai_agents_manage',
            arguments: {
                op: 'run_agent_now',
                agentId: 'vytautas-consultant',
            },
        });
        expect(runRes.result.structuredContent.ok).toBe(true);
        expect(runRes.result.structuredContent.logEntry.agentId).toBe('vytautas-consultant');

        // 6. resolve_log_entry
        const resolveRes = await callMcp('tools/call', {
            name: 'admin_ai_agents_manage',
            arguments: {
                op: 'resolve_log_entry',
                logId: 'LOG-1002',
                engineerReply: 'Paruoštas dvigubas CNC P265GH flanšas Kalvis 320 kW katilui su ecoMAX 860P kaskada.',
                resolvedBy: 'Darius Šauklys (per Claude MCP)',
            },
        });
        expect(resolveRes.result.structuredContent.ok).toBe(true);
        expect(resolveRes.result.structuredContent.logEntry.status).toBe('ATSAKYTA');

        // 7. Read giles://admin/ai-agents-and-logs resource
        const resRead = await callMcp('resources/read', {
            uri: 'giles://admin/ai-agents-and-logs',
        });
        const resourceJson = JSON.parse(resRead.result.contents[0].text);
        expect(resourceJson.agents.length).toBeGreaterThanOrEqual(7);
        expect(Array.isArray(resourceJson.logs)).toBe(true);
    });

    it('3) allows Darius Claude agent to manage suppliers & pricelist imports via admin_suppliers_pricelist_manage and giles://admin/suppliers-and-pricelists', async () => {
        const keyRes = await mcpRoute.PUT(
            new Request('http://localhost/api/mcp', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'generate_key',
                    name: 'Darius Suppliers MCP',
                    scope: 'full_admin',
                }),
            }),
        );
        const { rawKey } = await keyRes.json();

        const callMcp = async (method: string, params: Record<string, unknown> = {}) => {
            const res = await mcpRoute.POST(
                new Request('http://localhost/api/mcp', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${rawKey}`,
                    },
                    body: JSON.stringify({
                        jsonrpc: '2.0',
                        id: Date.now(),
                        method,
                        params,
                    }),
                }),
            );
            return res.json();
        };

        // 1. list_suppliers
        const listRes = await callMcp('tools/call', {
            name: 'admin_suppliers_pricelist_manage',
            arguments: { op: 'list_suppliers' },
        });
        expect(listRes.result.structuredContent.ok).toBe(true);
        expect(listRes.result.structuredContent.suppliers.length).toBeGreaterThanOrEqual(5);

        // 2. upsert_supplier
        const upsertRes = await callMcp('tools/call', {
            name: 'admin_suppliers_pricelist_manage',
            arguments: {
                op: 'upsert_supplier',
                id: 'esbe-hydronics',
                name: '6. ESBE AB (Švedija)',
                dealerDiscountPct: 42,
                targetMarginPct: 25,
                leadTimeDays: '2–3 d. d. (Kauno sandėlis)',
                enabled: true,
            },
        });
        expect(upsertRes.result.structuredContent.ok).toBe(true);
        expect(upsertRes.result.structuredContent.supplier.dealerDiscountPct).toBe(42);
        expect(getSuppliersList().some((s) => s.id === 'esbe-hydronics')).toBe(true);

        // 3. import_pricelist_rows
        const importRes = await callMcp('tools/call', {
            name: 'admin_suppliers_pricelist_manage',
            arguments: {
                op: 'import_pricelist_rows',
                supplierId: 'esbe-hydronics',
                rows: [
                    {
                        sku: 'ESBE-VRG131-DN25',
                        name: 'ESBE VRG131 3-eigis pamaišymo vožtuvas DN25 Kvs 10',
                        basePriceEur: 95,
                        stockQuantity: 14,
                        category: 'Pamaišymo vožtuvai ir pavaros',
                    },
                ],
            },
        });
        const impPayload = importRes.result.structuredContent;
        expect(impPayload.ok).toBe(true);
        expect(impPayload.importedCount).toBe(1);
        expect(impPayload.items[0].marginPct).toBeGreaterThanOrEqual(15);

        const liveProduct = findGilesSnapshotProductBySlugOrId('ESBE-VRG131-DN25');
        expect(liveProduct).not.toBeNull();
        expect(liveProduct?.name).toContain('ESBE VRG131');

        // 4. Read giles://admin/suppliers-and-pricelists resource
        const resRead = await callMcp('resources/read', {
            uri: 'giles://admin/suppliers-and-pricelists',
        });
        const resourceJson = JSON.parse(resRead.result.contents[0].text);
        expect(resourceJson.suppliers.length).toBeGreaterThanOrEqual(6);
    });

    it('4) allows full product CRUD (description, kitContents, compatibilityNote, specs, bulk price adjust, visibility toggle) via products_full_crud_manage and Admin API', async () => {
        const keyRes = await mcpRoute.PUT(
            new Request('http://localhost/api/mcp', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'generate_key',
                    name: 'Darius Product CRUD MCP',
                    scope: 'operator_safe',
                }),
            }),
        );
        const { rawKey } = await keyRes.json();

        const callMcp = async (method: string, params: Record<string, unknown> = {}) => {
            const res = await mcpRoute.POST(
                new Request('http://localhost/api/mcp', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${rawKey}`,
                    },
                    body: JSON.stringify({
                        jsonrpc: '2.0',
                        id: Date.now(),
                        method,
                        params,
                    }),
                }),
            );
            return res.json();
        };

        // 1. upsert_product_full on existing SKU 013G2990
        const upsertRes = await callMcp('tools/call', {
            name: 'products_full_crud_manage',
            arguments: {
                op: 'upsert_product_full',
                sku: '013G2990',
                title: 'Termostatinė galvutė Danfoss RA 2990 su dujiniu silfonu (RA Click)',
                description: 'Originali Danfoss RA 2990 termostatinė galvutė su greitaeigiu dujiniu jutikliu ir RA Click tvirtinimu.',
                brand: 'Danfoss',
                category: 'Radiatorių armatūra ir termogalvutės',
                subcategory: 'Termostatinės galvutės',
                price: 27.9,
                costEur: 14.5,
                promoPriceEur: 24.9,
                stock: 42,
                inStock: true,
                published: true,
                weightKg: 0.22,
                deliveryClass: 'locker_30kg',
                apvaEligible: false,
                compatibleBoilers: ['Danfoss RA-N 15', 'Danfoss RA-N 20', 'Purmo VK'],
                kitContents: [
                    '1× Termostatinė galvutė Danfoss RA 2990 (013G2990)',
                    '1× RA Click fiksavimo žiedas (23 mm)',
                    '1× Montavimo ir temperatūros ribojimo instrukcija LT',
                ],
                compatibilityNote: 'Tinka visiems Danfoss RA-N / RA-G vožtuvams su RA Click (23 mm) kakliuku be adapterio.',
                specs: {
                    Jungtis: 'RA Click (23 mm)',
                    Reguliavimo_ribos: '+5…+26 °C',
                    Jutiklio_tipas: 'Dujinis silfonas',
                },
            },
        });
        expect(upsertRes.result.structuredContent.ok).toBe(true);

        const ovr = getCatalogProductOverride('013G2990');
        expect(ovr?.description).toContain('Originali Danfoss RA 2990');
        expect(ovr?.kitContents).toHaveLength(3);
        expect(ovr?.compatibilityNote).toContain('RA Click (23 mm)');
        expect(ovr?.specs?.Jungtis).toBe('RA Click (23 mm)');
        expect(ovr?.compatibleBoilers).toContain('Danfoss RA-N 15');

        const pdpProduct = findGilesSnapshotProductBySlugOrId('013G2990');
        expect(pdpProduct?.price).toBe(24.9);
        expect(pdpProduct?.stockQuantity).toBe(42);
        expect(pdpProduct?.description).toContain('Originali Danfoss RA 2990');

        // 2. toggle_product_visibility -> unpublish and republish
        const hideRes = await callMcp('tools/call', {
            name: 'products_full_crud_manage',
            arguments: {
                op: 'toggle_product_visibility',
                sku: '013G2990',
                published: false,
            },
        });
        expect(hideRes.result.structuredContent.ok).toBe(true);
        expect(hideRes.result.structuredContent.published).toBe(false);
        expect(
            getGilesCatalogSnapshot().products.some((p) => p.sku === '013G2990'),
        ).toBe(false);

        const showRes = await callMcp('tools/call', {
            name: 'products_full_crud_manage',
            arguments: {
                op: 'toggle_product_visibility',
                sku: '013G2990',
                published: true,
            },
        });
        expect(showRes.result.structuredContent.published).toBe(true);
        expect(
            getGilesCatalogSnapshot().products.some((p) => p.sku === '013G2990'),
        ).toBe(true);

        // 3. bulk_brand_or_category_price_adjust
        const bulkRes = await callMcp('tools/call', {
            name: 'products_full_crud_manage',
            arguments: {
                op: 'bulk_brand_or_category_price_adjust',
                brand: 'gorenje',
                deltaPct: 5,
            },
        });
        expect(bulkRes.result.structuredContent.ok).toBe(true);
        expect(bulkRes.result.structuredContent.minMarginFloorPct).toBe(15);

        // 4. PATCH /api/admin/products also persists kitContents, compatibilityNote, specs, description
        const adminPatchRes = await adminProductsRoute.PATCH(
            new Request('http://localhost/api/admin/products', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sku: 'MPB-NANI-35',
                    description: 'Megatherm MPB NANI 35 kW degiklis su judančiais ardeliais.',
                    compatibilityNote: 'Tinka Viadrus U22, U26, Kalvis 2-16, 2-20, Atmos ir Stropuva katilams.',
                    kitContents: [
                        '1× Degiklis MPB NANI 35 kW',
                        '1× Padavimo šnekas 2,0 m',
                        '1× Valdiklis su katilo ir boilerio jutikliais',
                    ],
                    specs: {
                        Galia: '8–35 kW',
                        Ardeliai: 'Judantys CrNi 1.4841',
                    },
                    compatibleBoilers: ['Viadrus U22', 'Kalvis 2-16'],
                }),
            }),
        );
        const adminPatchData = await adminPatchRes.json();
        expect(adminPatchData.ok).toBe(true);
        expect(adminPatchData.product.compatibilityNote).toContain('Viadrus U22');
        expect(adminPatchData.product.kitContents).toHaveLength(3);

        // 5. Verify Admin Product CRUD component contains inputs for description, compatibilityNote, and kitContents
        const crudUiSrc = fs.readFileSync(
            path.join(repoRoot, 'src/components/giles-admin-product-crud.tsx'),
            'utf8',
        );
        expect(crudUiSrc).toContain('Prekės techninis aprašymas');
        expect(crudUiSrc).toContain('Suderinamumo pastaba (sriegis / katilai / pavaros)');
        expect(crudUiSrc).toContain('Kas įeina į komplektą (eilutėmis)');
    });
});
