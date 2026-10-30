import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import * as mcpRoute from '../app/api/mcp/route';
import { resetMcpSecurityDatabase } from './mcp-store-server';
import {
    resetB2BPricingEngineState,
    createManualB2BCustomer,
    upsertCustomerPricingRule,
} from './b2b-pricing-engine';
import { MCP_STORE_TOOLS } from './mcp-store-catalog';

describe('WP-W98-A1: Dual-Tier Customer AI & MCP Purchasing Bridge (B2B + Personal Shopper)', () => {
    const repoRoot = path.resolve(__dirname, '../..');

    beforeEach(() => {
        resetMcpSecurityDatabase();
        resetB2BPricingEngineState();
    });

    afterEach(() => {
        resetMcpSecurityDatabase();
        resetB2BPricingEngineState();
    });

    it('registers 32 standardized MCP tools including 3 customer-scoped purchasing tools, 3 Tier-0 open discovery tools, and b2b_credit_and_reminders_manage', () => {
        expect(MCP_STORE_TOOLS).toHaveLength(32);
        const toolNames = MCP_STORE_TOOLS.map((t) => t.name);
        expect(toolNames).toContain('customer_b2b_catalog_and_my_prices');
        expect(toolNames).toContain('customer_b2b_order_or_project_draft');
        expect(toolNames).toContain('customer_personal_cart_assemble');
        expect(toolNames).toContain('b2b_credit_and_reminders_manage');

        const b2bPricesTool = MCP_STORE_TOOLS.find((t) => t.name === 'customer_b2b_catalog_and_my_prices');
        const b2bOrderTool = MCP_STORE_TOOLS.find((t) => t.name === 'customer_b2b_order_or_project_draft');
        const personalCartTool = MCP_STORE_TOOLS.find((t) => t.name === 'customer_personal_cart_assemble');

        expect(b2bPricesTool?.scopeCategory).toBe('read');
        expect(b2bOrderTool?.scopeCategory).toBe('write');
        expect(personalCartTool?.scopeCategory).toBe('read');
    });

    it('executes customer_b2b_catalog_and_my_prices, customer_b2b_order_or_project_draft (with maxAutoOrderEur cap), and customer_personal_cart_assemble via JSON-RPC 2.0', async () => {
        const b2bCustomer = createManualB2BCustomer({
            companyName: 'UAB Kauno Montuotojai',
            companyCode: '305544332',
            vatCode: 'LT100015544332',
            contactPerson: 'Tomas Montuotojas',
            email: 'tomas@kaunomontuotojai.lt',
            phone: '+370 612 99887',
            tierLabel: 'ŠVOK Rangovas',
            defaultDiscountPercent: 40,
            creditLimitEur: 25000,
            paymentTermsDays: 30,
        });

        upsertCustomerPricingRule(b2bCustomer.id, {
            brandDiscounts: { Danfoss: 48, HERZ: 50 },
            skuOverrides: [
                { sku: '013G2990', customPriceEur: 13.5, costNetEur: 10.5, minQty: 1, note: 'Danfoss sutartinė kaina' },
            ],
            cartDiscountRules: {
                extraCartDiscountPct: 3,
            },
        });

        const keyRes = await mcpRoute.PUT(
            new Request('http://localhost/api/mcp', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'generate_key',
                    name: 'UAB Kauno Montuotojai B2B AI Agentas',
                    scope: 'operator_safe',
                }),
            }),
        );
        const keyData = await keyRes.json();
        const token = keyData.rawKey as string;

        const callMcp = async (name: string, args: Record<string, unknown>) => {
            const res = await mcpRoute.POST(
                new Request('http://localhost/api/mcp', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        jsonrpc: '2.0',
                        id: Date.now(),
                        method: 'tools/call',
                        params: { name, arguments: args },
                    }),
                }),
            );
            return res.json();
        };

        // 1. customer_b2b_catalog_and_my_prices
        const pricesRes = await callMcp('customer_b2b_catalog_and_my_prices', {
            accountId: b2bCustomer.id,
            query: '013G2990',
            qty: 10,
        });
        const pricesPayload = pricesRes.result.structuredContent;
        expect(pricesPayload.ok).toBe(true);
        expect(pricesPayload.accountId).toBe(b2bCustomer.id);
        expect(pricesPayload.companyName).toBe('UAB Kauno Montuotojai');
        expect(pricesPayload.warehouse).toContain('Eigulių g. 21');
        expect(pricesPayload.items.length).toBeGreaterThan(0);
        const danfossItem = pricesPayload.items.find((i: { sku: string }) => i.sku === '013G2990') || pricesPayload.items[0];
        expect(danfossItem.myUnitNetEur).toBe(13.5);
        expect(danfossItem.appliedLayer).toBe('SKU_OVERRIDE');

        // 2. customer_b2b_order_or_project_draft within maxAutoOrderEur cap
        const orderAllowedRes = await callMcp('customer_b2b_order_or_project_draft', {
            accountId: b2bCustomer.id,
            mode: 'project_quote',
            projectTitle: 'Aleksoto kotedžų katilinė',
            maxAutoOrderEur: 3000,
            items: [
                { sku: '013G2990', qty: 10 },
                { sku: 'ZV-100', qty: 2 },
            ],
        });
        const orderAllowedPayload = orderAllowedRes.result.structuredContent;
        expect(orderAllowedPayload.ok).toBe(true);
        expect(orderAllowedPayload.status).toBe('CREATED_IN_ACCOUNT');
        expect(orderAllowedPayload.project.title).toBe('Aleksoto kotedžų katilinė');
        expect(orderAllowedPayload.cartPricing.finalNetEur).toBeGreaterThan(0);

        // 3. customer_b2b_order_or_project_draft exceeding maxAutoOrderEur cap -> requires human confirmation
        const orderCappedRes = await callMcp('customer_b2b_order_or_project_draft', {
            accountId: b2bCustomer.id,
            mode: 'b2b_order',
            projectTitle: 'Didelis pramoninis užsakymas',
            maxAutoOrderEur: 500,
            items: [
                { sku: 'MPB-NANI-35', qty: 2 },
            ],
        });
        const orderCappedPayload = orderCappedRes.result.structuredContent;
        expect(orderCappedPayload.ok).toBe(true);
        expect(orderCappedPayload.status).toBe('REQUIRES_BUYER_APPROVAL');
        expect(orderCappedPayload.exceededLimit).toBe(true);

        // 4. customer_personal_cart_assemble (safe for personal shoppers)
        const personalRes = await callMcp('customer_personal_cart_assemble', {
            locale: 'lt',
            projectNote: '140 m2 namo katilinės atnaujinimas',
            items: [
                { sku: 'MPB-NANI-35', qty: 1 },
                { sku: '013G2990', qty: 6 },
            ],
        });
        const personalPayload = personalRes.result.structuredContent;
        expect(personalPayload.ok).toBe(true);
        expect(personalPayload.cartUrl).toContain('/lt/krepselis?import_skus=');
        expect(personalPayload.cartUrl).toContain('MPB-NANI-35:1');
        expect(personalPayload.cartUrl).toContain('013G2990:6');
        expect(personalPayload.requiresHumanCheckoutConfirmation).toBe(true);
        expect(personalPayload.items).toHaveLength(2);
    });

    it('delivers homepage marketing section, 4-locale /[locale]/mcp-jungtis page, B2B Customer MCP panel (<345 lines constraint), and cart import_skus support', () => {
        const showcasePath = path.join(repoRoot, 'src/components/giles-mcp-marketing-showcase.tsx');
        const mcpPagePath = path.join(repoRoot, 'src/app/[locale]/mcp-jungtis/page.tsx');
        const b2bMcpPanelPath = path.join(repoRoot, 'src/components/b2b-customer-mcp-panel.tsx');
        const b2bClientPath = path.join(repoRoot, 'src/components/b2b-portal-client.tsx');
        const b2bViewsPath = path.join(repoRoot, 'src/components/b2b-portal-views.tsx');
        const homePagePath = path.join(repoRoot, 'src/app/[locale]/page.tsx');
        const footerPath = path.join(repoRoot, 'src/components/footer.tsx');
        const cartClientPath = path.join(repoRoot, 'src/components/cart-client.tsx');

        expect(fs.existsSync(showcasePath)).toBe(true);
        expect(fs.existsSync(mcpPagePath)).toBe(true);
        expect(fs.existsSync(b2bMcpPanelPath)).toBe(true);

        const showcaseSrc = fs.readFileSync(showcasePath, 'utf8');
        const mcpPageSrc = fs.readFileSync(mcpPagePath, 'utf8');
        const b2bMcpPanelSrc = fs.readFileSync(b2bMcpPanelPath, 'utf8');
        const b2bClientSrc = fs.readFileSync(b2bClientPath, 'utf8');
        const b2bViewsSrc = fs.readFileSync(b2bViewsPath, 'utf8');
        const homePageSrc = fs.readFileSync(homePagePath, 'utf8');
        const footerSrc = fs.readFileSync(footerPath, 'utf8');
        const cartClientSrc = fs.readFileSync(cartClientPath, 'utf8');

        // Line count guardrails
        expect(b2bClientSrc.split('\n').length).toBeLessThan(345);
        expect(b2bViewsSrc.split('\n').length).toBeLessThan(345);

        // Zero em-dashes in new marketing files
        expect(showcaseSrc).not.toContain('—');
        expect(mcpPageSrc).not.toContain('—');
        expect(b2bMcpPanelSrc).not.toContain('—');

        // Required testids & wiring
        expect(showcaseSrc).toContain('giles-mcp-marketing-section');
        expect(homePageSrc).toContain('GilesMcpMarketingShowcase');
        expect(mcpPageSrc).toContain('mcp-jungtis-page');
        expect(footerSrc).toContain('/mcp-jungtis');
        expect(b2bMcpPanelSrc).toContain('b2b-customer-mcp-panel');
        expect(b2bMcpPanelSrc).toContain('giles_b2b_client_');
        expect(b2bViewsSrc).toContain('B2BCustomerMcpPanel');
        expect(cartClientSrc).toContain('import_skus');
    });
});
