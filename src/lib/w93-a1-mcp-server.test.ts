import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as mcpRoute from '../app/api/mcp/route';
import { resetMcpSecurityDatabase } from './mcp-store-server';
import { resetB2BPricingEngineState } from './b2b-pricing-engine';
import { MCP_STORE_TOOLS, MCP_STORE_RESOURCES, MCP_STORE_PROMPTS } from './mcp-store-catalog';

describe('WP-W93-A1 & WP-W97-A1: Standardized MCP Server (22 Tools, 8 Resources, 4 Prompts) & Dual Human + AI Agent B2B CRM Parity', () => {
    beforeEach(() => {
        resetMcpSecurityDatabase();
        resetB2BPricingEngineState();
    });

    afterEach(() => {
        resetMcpSecurityDatabase();
        resetB2BPricingEngineState();
    });

    it('exposes exactly 32 standardized MCP tools, 10 MCP resources, and 4 MCP prompts in catalog', () => {
        expect(MCP_STORE_TOOLS.length).toBe(32);
        expect(MCP_STORE_RESOURCES.length).toBe(10);
        expect(MCP_STORE_PROMPTS.length).toBe(4);

        const toolNames = MCP_STORE_TOOLS.map((t) => t.name);
        expect(toolNames).toContain('b2b_crm_analytics_get');
        expect(toolNames).toContain('b2b_client_360_manage');
        expect(toolNames).toContain('b2b_individual_pricing_set');
        expect(toolNames).toContain('b2b_quote_create');
        expect(toolNames).toContain('b2b_campaign_broadcast');
        expect(toolNames).toContain('vytautas_engineering_consult');
        expect(toolNames).toContain('b2b_credit_and_reminders_manage');

        const resourceUris = MCP_STORE_RESOURCES.map((r) => r.uri);
        expect(resourceUris).toContain('giles://b2b/crm-analytics');
        expect(resourceUris).toContain('giles://b2b/pricing-rules');
        expect(resourceUris).toContain('giles://b2b/campaigns');
    });

    it('executes all 6 new B2B CRM & Vytautas MCP tools and reads all 3 new B2B MCP resources over POST /api/mcp JSON-RPC 2.0', async () => {
        // Generate operator_safe key
        const opKeyRes = await mcpRoute.PUT(
            new Request('http://localhost/api/mcp', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'generate_key',
                    name: 'OpenCode B2B CRM Agent',
                    scope: 'operator_safe',
                }),
            }),
        );
        const opKeyData = await opKeyRes.json();
        const token = opKeyData.rawKey as string;

        const callMcp = async (method: string, params: Record<string, unknown> = {}) => {
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
                        method,
                        params,
                    }),
                }),
            );
            return res.json();
        };

        // 1. tools/list & resources/list
        const listTools = await callMcp('tools/list');
        expect(listTools.result.tools).toHaveLength(32);

        const listResources = await callMcp('resources/list');
        expect(listResources.result.resources).toHaveLength(10);

        // 2. b2b_client_360_manage: create customer + attach project + attach manager note
        const manageRes = await callMcp('tools/call', {
            name: 'b2b_client_360_manage',
            arguments: {
                action: 'create_customer',
                companyName: 'UAB MCP Šilumos Tinklai',
                companyCode: '307788990',
                vatCode: 'LT100017788990',
                contactPerson: 'Rokas Inžinierius',
                email: 'rokas@mcpsiluma.lt',
                phone: '+370 611 22334',
                tierLabel: 'ŠVOK Rangovas',
                defaultDiscountPercent: 40,
                creditLimitEur: 40000,
                paymentTermsDays: 30,
                project: {
                    title: 'Eigulių katilinės rekonstrukcija 150 kW',
                    location: 'Eigulių g. 21, LT-51418 Kaunas',
                    status: 'active',
                    budgetEur: 22000,
                    orderedEur: 14500,
                    discountAppliedPct: 42,
                },
                note: {
                    author: 'Darius Šauklys (MCP)',
                    tag: 'objektas',
                    text: 'Projektas patvirtintas, sukomplektuoti Danfoss ir Megatherm mazgai.',
                },
            },
        });
        const managePayload = manageRes.result.structuredContent;
        expect(managePayload.ok).toBe(true);
        const accountId = managePayload.account.id as string;
        expect(managePayload.customer360.projects).toHaveLength(1);
        expect(managePayload.customer360.notes).toHaveLength(1);

        // 3. b2b_individual_pricing_set: configure 3-layer pricing + verify <10% margin guardrail
        const pricingSafeRes = await callMcp('tools/call', {
            name: 'b2b_individual_pricing_set',
            arguments: {
                accountId,
                brandDiscounts: { Danfoss: 48, Haier: 42 },
                categoryDiscounts: { Katilai: 38 },
                skuOverrides: [
                    { sku: '013G2990', customPriceEur: 13.5, costNetEur: 10.5, minQty: 5, note: 'Danfoss objektinė kaina' },
                ],
                extraCartDiscountPct: 4,
            },
        });
        expect(pricingSafeRes.result.structuredContent.status).toBe('APPLIED');
        expect(pricingSafeRes.result.structuredContent.grantedDiscountsSummary.skuOverridesCount).toBe(1);

        const pricingRiskyRes = await callMcp('tools/call', {
            name: 'b2b_individual_pricing_set',
            arguments: {
                accountId,
                skuOverrides: [
                    { sku: 'MPB-NANI-35', customPriceEur: 1300, costNetEur: 1280, minQty: 1, note: 'Per žema marža (<10%)' },
                ],
            },
        });
        expect(pricingRiskyRes.result.structuredContent.status).toBe('QUEUED_FOR_HUMAN_APPROVAL');

        // 4. b2b_quote_create
        const quoteRes = await callMcp('tools/call', {
            name: 'b2b_quote_create',
            arguments: {
                accountId,
                clientName: 'UAB MCP Šilumos Tinklai',
                title: 'MCP Komercinis pasiūlymas katilinei',
                extraWholeCartDiscountPct: 5,
                items: [
                    { sku: 'MPB-NANI-35', title: 'Megatherm MPB NANI 35', qty: 1, retailNetEur: 1942.15, customNetEur: 1580 },
                ],
            },
        });
        expect(quoteRes.result.structuredContent.ok).toBe(true);
        expect(quoteRes.result.structuredContent.offer.offerNumber).toMatch(/^KP-\d{4}$/);

        // 5. b2b_campaign_broadcast
        const campRes = await callMcp('tools/call', {
            name: 'b2b_campaign_broadcast',
            arguments: {
                title: 'Danfoss termostatikos rudens akcija',
                message: 'Papildoma -5% nuolaida perkant Danfoss vožtuvų ir galvučių komplektus.',
                categoryTag: 'Sezoninė akcija',
                targetType: 'SINGLE_CLIENT',
                targetAccountId: accountId,
                promoDiscountPct: 5,
                ctaSku: '013G2990',
            },
        });
        expect(campRes.result.structuredContent.ok).toBe(true);
        expect(campRes.result.structuredContent.campaign.id).toMatch(/^camp-/);

        // 6. b2b_crm_analytics_get
        const analyticsRes = await callMcp('tools/call', {
            name: 'b2b_crm_analytics_get',
            arguments: { accountId },
        });
        const analyticsPayload = analyticsRes.result.structuredContent;
        expect(analyticsPayload.ok).toBe(true);
        expect(analyticsPayload.analytics.totalCustomers).toBe(1);
        expect(analyticsPayload.analytics.totalPurchasedEur).toBeGreaterThanOrEqual(14500);
        expect(analyticsPayload.customer360.accountId).toBe(accountId);

        // 7. vytautas_engineering_consult
        const vytautasRes = await callMcp('tools/call', {
            name: 'vytautas_engineering_consult',
            arguments: {
                messages: [
                    { role: 'user', content: 'Reikia šoninio radiatoriaus 500 mm aukščio dešinės pusės pajungimui' },
                ],
                locale: 'lt',
            },
        });
        const vytautasPayload = vytautasRes.result.structuredContent;
        expect(vytautasPayload.ok).toBe(true);
        expect(vytautasPayload.reply.length).toBeGreaterThan(20);
        expect(Array.isArray(vytautasPayload.recommendations)).toBe(true);

        // 8. resources/read for all 3 new B2B resources
        for (const uri of [
            'giles://b2b/crm-analytics',
            'giles://b2b/pricing-rules',
            'giles://b2b/campaigns',
        ]) {
            const rRead = await callMcp('resources/read', { uri });
            expect(rRead.result.contents[0].uri).toBe(uri);
            const parsed = JSON.parse(rRead.result.contents[0].text);
            expect(parsed).toBeDefined();
        }

        // 9. b2b_credit_and_reminders_manage: update_terms, status, send_reminder, mark_invoice_paid, auto_sweep
        const creditTermsRes = await callMcp('tools/call', {
            name: 'b2b_credit_and_reminders_manage',
            arguments: {
                op: 'update_terms',
                accountId,
                creditLimitEur: 18000,
                paymentTermDays: 30,
                autoReminderThresholdPct: 80,
                invoice: {
                    invoiceNumber: 'GILE-2026-1099',
                    issuedAt: '2026-10-01',
                    dueDate: '2026-10-31',
                    amountEur: 15000,
                    status: 'unpaid_deferred',
                    projectTitle: 'Eigulių katilinės rekonstrukcija 150 kW',
                },
            },
        });
        expect(creditTermsRes.result.structuredContent.ok).toBe(true);
        expect(creditTermsRes.result.structuredContent.creditLedgerSummary.creditUsedEur).toBe(15000);
        expect(creditTermsRes.result.structuredContent.creditLedgerSummary.creditStatus).toBe('APPROACHING_LIMIT');

        const creditStatusRes = await callMcp('tools/call', {
            name: 'b2b_credit_and_reminders_manage',
            arguments: {
                op: 'status',
                accountId,
            },
        });
        expect(creditStatusRes.result.structuredContent.ok).toBe(true);
        expect(creditStatusRes.result.structuredContent.creditLedgerSummary.creditUtilizationPct).toBeGreaterThanOrEqual(80);

        const creditSweepRes = await callMcp('tools/call', {
            name: 'b2b_credit_and_reminders_manage',
            arguments: {
                op: 'auto_sweep',
            },
        });
        expect(creditSweepRes.result.structuredContent.ok).toBe(true);
        expect(creditSweepRes.result.structuredContent.creditRemindersLog.length).toBeGreaterThanOrEqual(1);

        const invId = creditStatusRes.result.structuredContent.creditLedgerSummary.invoices[0].id as string;
        const markPaidRes = await callMcp('tools/call', {
            name: 'b2b_credit_and_reminders_manage',
            arguments: {
                op: 'mark_invoice_paid',
                accountId,
                invoiceId: invId,
            },
        });
        expect(markPaidRes.result.structuredContent.ok).toBe(true);
        expect(markPaidRes.result.structuredContent.creditLedgerSummary.creditUsedEur).toBe(0);
    });
});
