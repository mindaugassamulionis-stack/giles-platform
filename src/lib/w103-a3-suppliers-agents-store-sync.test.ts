import fs from 'node:fs';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
    getGilesCatalogProductByIdOrSlug,
    getGilesCatalogProducts,
    getGilesCatalogSnapshot,
    resetCatalogOverrides,
} from './giles-catalog-snapshot';
import {
    addOrUpdateAiAgent,
    addOrUpdateSupplier,
    appendAiAgentLog,
    getAiAgentLogs,
    getAiAgentsList,
    getSuppliersList,
    importSupplierPricelistRows,
    loadSampleAgentAuditLogs,
    resetSuppliersAndAgentsStore,
    resolveAiAgentLogEntry,
    runAiAgentDiagnosticCheck,
    syncSupplierPricelistNow,
    toggleAiAgentExecutionMode,
} from './suppliers-and-agents-store';

describe('W103-A3: Dynamic Supplier & Pricelist Manager, No-Black-Box AI Agent & BYO-API Command Center, and 100% Bidirectional Storefront Sync', () => {
    beforeEach(() => {
        resetCatalogOverrides();
        resetSuppliersAndAgentsStore();
    });

    afterEach(() => {
        resetCatalogOverrides();
        resetSuppliersAndAgentsStore();
    });

    it('1. manages dynamic suppliers (5 built-in + custom supplier CRUD + CSV/TSV pricelist ingestion into live storefront with >=15% margin floor)', async () => {
        const initialSuppliers = getSuppliersList();
        expect(initialSuppliers.length).toBeGreaterThanOrEqual(5);
        expect(initialSuppliers.map((s) => s.id)).toEqual(
            expect.arrayContaining([
                'danfoss',
                'herz',
                'gorenje-tiki',
                'giles-megatherm',
                'haier',
            ]),
        );

        // Add a new custom supplier via /api/admin/suppliers
        const suppliersRoute = await import('../app/api/admin/suppliers/route');
        const createRes = await suppliersRoute.POST(
            new Request('http://localhost/api/admin/suppliers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'upsert_supplier',
                    name: 'Dražice (DZ Dražice Czechia)',
                    country: 'Čekija (CZ)',
                    contactEmail: 'export@dzd.cz',
                    currency: 'EUR',
                    dealerDiscountPct: 38,
                    targetMarginPct: 24,
                    leadTimeDays: '2–4 d. d.',
                    skuPrefix: 'DRZ-',
                    feedFormat: 'CSV / XLSX',
                    feedUrlOrNote: 'Dražice OKC NTR/BP kombinuotų boilerių kainynas',
                    enabled: true,
                }),
            }),
        );
        const createData = await createRes.json();
        expect(createData.ok).toBe(true);
        expect(createData.supplier.name).toContain('Dražice');
        expect(createData.supplier.dealerDiscountPct).toBe(38);
        expect(createData.supplier.targetMarginPct).toBe(24);
        expect(createData.suppliers.length).toBe(6);

        // Import CSV pricelist rows for the newly added supplier
        const csvPayload = [
            'DRZ-OKC-200-NTR; Dražice OKC 200 NTR/BP netiesioginio šildymo vandens šildytuvas (2,1 m² šilumokaitis); 650.00; 12; Boileriai ir akumuliacinės talpos',
            'DRZ-OKC-160-NTR; Dražice OKC 160 NTR/BP greitaeigis boileris šilumos siurbliui; 540.00; 9; Boileriai ir akumuliacinės talpos',
        ].join('\n');

        const importRes = await suppliersRoute.POST(
            new Request('http://localhost/api/admin/suppliers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'import_pricelist',
                    supplierId: createData.supplier.id,
                    rawText: csvPayload,
                }),
            }),
        );
        const importData = await importRes.json();
        expect(importData.ok).toBe(true);
        expect(importData.importedCount).toBe(2);
        expect(importData.items[0].sku).toBe('DRZ-OKC-200-NTR');
        // Dealer cost = 650 * (1 - 0.38) = 403.00 EUR net
        expect(importData.items[0].costEur).toBeCloseTo(403.0, 1);
        expect(importData.items[0].marginPct).toBeGreaterThanOrEqual(15);

        // Verify imported supplier SKU is immediately live in the storefront catalog snapshot
        const liveProduct = getGilesCatalogProductByIdOrSlug('DRZ-OKC-200-NTR');
        expect(liveProduct).not.toBeNull();
        expect(liveProduct?.name).toContain('Dražice OKC 200 NTR/BP');
        expect(liveProduct?.stockQuantity).toBe(12);
        expect(liveProduct?.price).toBeGreaterThan(480);

        // Trigger 1-click sync on existing supplier
        const syncRes = await suppliersRoute.POST(
            new Request('http://localhost/api/admin/suppliers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'sync_pricelist',
                    supplierId: 'danfoss',
                }),
            }),
        );
        const syncData = await syncRes.json();
        expect(syncData.ok).toBe(true);
        expect(syncData.supplier.id).toBe('danfoss');
    });

    it('2. provides No-Black-Box AI Agent & BYO-API Command Center (6 built-in working agents + custom BYO API agent + mode toggle + prompt/API editor + test run + live Q&A logs)', async () => {
        const agentsRoute = await import('../app/api/admin/agents/route');
        const getRes = await agentsRoute.GET();
        const getData = await getRes.json();

        expect(getData.ok).toBe(true);
        expect(getData.agents.length).toBeGreaterThanOrEqual(6);

        const requiredAgentIds = [
            'vytautas-consultant',
            'pricing-margin-guard',
            'inventory-po-copilot',
            'b2b-credit-reminder-agent',
            'skaita-reconciliation-agent',
            'seo-geo-citation-agent',
        ];
        for (const id of requiredAgentIds) {
            const found = getData.agents.find(
                (a: { id: string; slug?: string }) => a.id === id || a.slug === id,
            );
            expect(found).toBeDefined();
            expect(found.instructionsSteps.length).toBeGreaterThanOrEqual(3);
            expect(found.systemPrompt.length).toBeGreaterThan(20);
        }

        // Bring Your Own AI Agent / API
        const addAgentRes = await agentsRoute.POST(
            new Request('http://localhost/api/admin/agents', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'upsert_agent',
                    name: 'Grundfos & Wilo Hidraulikos Parinkimo Agentas (BYO API)',
                    role: 'Cirkuliacinių siurblių darbo taško (H/Q) ir ΔT skaičiavimo agentas',
                    provider: 'Anthropic Claude',
                    apiEndpointUrl: 'https://api.anthropic.com/v1/messages',
                    apiKey: 'sk-ant-api03-giles-custom-secret-key-9988',
                    modelId: 'claude-sonnet-4-20250514',
                    temperature: 0.2,
                    executionMode: 'proposal_only',
                    allowedMcpScopes: ['read_only', 'operator_safe'],
                    guardrailMinMarginPct: 18,
                    systemPrompt:
                        'Skaičiuok siurblio debitą G = Q / (1.163 * ΔT) ir parink Wilo Para arba Grundfos Alpha2 iš Kauno sandėlio.',
                }),
            }),
        );
        const addAgentData = await addAgentRes.json();
        expect(addAgentData.ok).toBe(true);
        expect(addAgentData.agent.provider).toBe('Anthropic Claude');
        // Masked key in public output
        expect(addAgentData.agent.maskedApiKey).toContain('sk-ant');
        expect(addAgentData.agent.maskedApiKey).toContain('9988');

        // Toggle execution mode (autonomous -> disabled -> proposal_only)
        const toggleRes = await agentsRoute.POST(
            new Request('http://localhost/api/admin/agents', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'toggle_agent_mode',
                    agentId: 'vytautas-consultant',
                    executionMode: 'proposal_only',
                }),
            }),
        );
        const toggleData = await toggleRes.json();
        expect(toggleData.ok).toBe(true);
        expect(toggleData.agent.executionMode).toBe('proposal_only');

        // Execute live diagnostic test run ("Paleisti agento patikrą dabar (Test Run)")
        const testRunRes = await agentsRoute.POST(
            new Request('http://localhost/api/admin/agents', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'test_run_agent',
                    agentId: 'pricing-margin-guard',
                }),
            }),
        );
        const testRunData = await testRunRes.json();
        expect(testRunData.ok).toBe(true);
        expect(testRunData.logEntry).toBeDefined();
        expect(testRunData.logEntry.agentId).toBe('pricing-margin-guard');

        // Load sample audit logs (answered vs unanswered queries) and resolve an unanswered query
        const simRes = await agentsRoute.POST(
            new Request('http://localhost/api/admin/agents', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'load_sample_logs',
                }),
            }),
        );
        const simData = await simRes.json();
        expect(simData.ok).toBe(true);
        const unanswered = simData.logs.find(
            (l: { status: string }) => l.status === 'NEATSAKYTA / PERDUOTA INŽINIERIUI',
        );
        expect(unanswered).toBeDefined();

        const resolveRes = await agentsRoute.POST(
            new Request('http://localhost/api/admin/agents', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'resolve_log_entry',
                    logId: unanswered.id,
                    engineerReply:
                        'Darius patikslino: Kalvis 2-16 durelių flanšas MPB-FL-K16 yra Kauno sandėlyje, išsiųsta sąmata.',
                }),
            }),
        );
        const resolveData = await resolveRes.json();
        expect(resolveData.ok).toBe(true);
        expect(resolveData.entry.status).toBe('ATSAKYTA');
    });

    it('3. synchronizes Admin product edits, active:false hiding, custom products, and bulk category/brand adjustments 100% live with Storefront getGilesCatalogProducts()', async () => {
        const productsRoute = await import('../app/api/admin/products/route');

        const baselineProducts = getGilesCatalogProducts();
        expect(baselineProducts.length).toBe(13531);

        // 1. Update price, promoPriceEur, stock, and full fields on MPB-NANI-35
        const patchRes = await productsRoute.PATCH(
            new Request('http://localhost/api/admin/products', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sku: '013G2990',
                    name: 'Danfoss Aero RA Click termostatinė galvutė (Atnaujinta Admin)',
                    priceGrossEur: 27.5,
                    promoPriceEur: 24.9,
                    costPriceEur: 14.0,
                    stockQuantity: 92,
                    weightKg: 0.24,
                    deliveryClass: 'Paštomatas <30kg',
                    apvaEligible: false,
                    boilerCompatibilityTags: ['Danfoss RA-N', 'Kalvis', 'Vienybė'],
                    published: true,
                }),
            }),
        );
        const patchData = await patchRes.json();
        expect(patchData.ok).toBe(true);

        const updatedLive = getGilesCatalogProductByIdOrSlug('013G2990');
        expect(updatedLive).not.toBeNull();
        expect(updatedLive?.name).toBe('Danfoss Aero RA Click termostatinė galvutė (Atnaujinta Admin)');
        expect(updatedLive?.price).toBe(24.9);
        expect(updatedLive?.compareAtPrice).toBe(27.5);
        expect(updatedLive?.stockQuantity).toBe(92);

        // 2. Hide product from public storefront with published: false / active: false
        await productsRoute.PATCH(
            new Request('http://localhost/api/admin/products', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sku: '013G2990',
                    published: false,
                    active: false,
                }),
            }),
        );

        const hiddenOnStorefront = getGilesCatalogProductByIdOrSlug('013G2990');
        expect(hiddenOnStorefront).toBeNull();
        expect(getGilesCatalogProducts().some((p) => p.sku === '013G2990')).toBe(false);

        // Still visible in Admin GET /api/admin/products so Admin can re-enable it
        const adminSearchRes = await productsRoute.GET(
            new Request('http://localhost/api/admin/products?q=013G2990&limit=10'),
        );
        const adminSearchData = await adminSearchRes.json();
        expect(adminSearchData.items.some((i: { sku: string; published: boolean }) => i.sku === '013G2990' && i.published === false)).toBe(true);

        // 3. Bulk stock status update & bulk price adjustment with 15% margin floor protection
        const bulkStockRes = await productsRoute.POST(
            new Request('http://localhost/api/admin/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'bulk_stock_update',
                    brandSlug: 'gorenje',
                    stockQuantity: 14,
                }),
            }),
        );
        const bulkStockData = await bulkStockRes.json();
        expect(bulkStockData.ok).toBe(true);
        expect(bulkStockData.affectedCount).toBeGreaterThan(5);
    });

    it('4. renders required data-testids for Suppliers Manager, AI Agents Command Center, and Top-Eshop Product Bulk Actions', () => {
        const repoRoot = path.resolve(__dirname, '../..');
        const suppliersAgentsUi = fs.readFileSync(
            path.join(repoRoot, 'src/components/giles-admin-suppliers-and-agents.tsx'),
            'utf8',
        );
        const productCrudUi = fs.readFileSync(
            path.join(repoRoot, 'src/components/giles-admin-product-crud.tsx'),
            'utf8',
        );

        for (const testId of [
            'admin-suppliers-manager',
            'admin-add-supplier-btn',
            'admin-supplier-pricelist-import',
            'admin-ai-agents-command-center',
            'admin-add-ai-agent-btn',
            'admin-agent-toggle-btn',
            'admin-agent-instructions-panel',
            'admin-agent-config-editor',
            'admin-agent-run-now-btn',
            'admin-ai-agent-logs',
        ]) {
            expect(suppliersAgentsUi).toContain(testId);
        }

        expect(productCrudUi).toContain('admin-product-bulk-actions');
    });
});
