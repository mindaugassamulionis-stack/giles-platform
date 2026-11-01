import fs from 'node:fs';
import path from 'node:path';
import {
    getGilesCatalogSnapshot,
    getGilesSnapshotBrands,
    readCatalogOverrides,
    saveCatalogOverrides,
    upsertCatalogProductOverride,
    findGilesSnapshotProductBySlugOrId,
    type CatalogProductOverride,
    type CustomCatalogProductRecord,
} from './giles-catalog-snapshot';
import { toBrandSlug, clearCatalogListingCache } from './catalog-listing';
import {
    getSuppliersList,
    addOrUpdateSupplier,
    importSupplierPricelistRows,
    getAiAgentsList,
    addOrUpdateAiAgent,
    toggleAiAgentExecutionMode,
    runAiAgentDiagnosticCheck,
    getAiAgentLogs,
    resolveAiAgentLogEntry,
    type AiAgentExecutionMode,
    type AiAgentProvider,
} from './suppliers-and-agents-store';
import {
    listSkaitaInvoices,
    createAutonomousSkaitaInvoice,
    convertProformaToGileInvoice,
    reconcileSepaBankStatement,
    importSkaitaStockRows,
} from './skaita-accounting';
import {
    listB2BPartnerAccounts,
    approveOrRejectB2BPartnerAccount,
    type B2BDiscountTierLabel,
} from './b2b-accounts';
import {
    addB2BCustomerNote,
    calculateB2BCartPricing,
    calculateB2BLineItemPrice,
    createCustomCommercialOffer,
    createManualB2BCustomer,
    createMarketingCampaign,
    deleteB2BCustomerNote,
    deleteB2BCustomerProject,
    getB2BCrmAnalyticsSnapshot,
    getB2BCustomer360,
    getCustomerCreditLedger,
    getGrantedDiscountsSummary,
    recordB2BInvoiceOrPayment,
    runAutoCreditRemindersSweep,
    sendB2BCreditReminder,
    updateB2BCreditTerms,
    updateB2BCustomerCrmProfile,
    upsertB2BCustomerProject,
    upsertCustomerPricingRule,
    type B2BCreditReminderType,
    type B2BCustomerNoteTag,
    type B2BCustomerProjectStatus,
    type B2BCustomerTierSegment,
    type B2BPaymentDeferralDays,
    type B2BSkuPriceOverride,
} from './b2b-pricing-engine';
import { runVytautasMultiTurnEngine } from './vytautas-engine';
import {
    GILES_COMPANY_IDENTITY,
    HERO_SCHEMATIC_HOTSPOTS,
} from './giles-masterpiece-data';
import {
    calculateBoilerAndHeatLoss,
    calculateExpansionVessel,
    calculateHydraulicValve,
    calculateRadiatorNode,
    type EnergyClassId,
    type LtClimateZoneId,
} from './scientific-calculators';
import { calculateApvaSubsidyEstimate } from '../components/apva-subsidy-widget';
import {
    detectProductCadFamily,
    getProductCadBlueprintSpec,
} from '../components/pdp-cad-exploded-schematic';
import type { McpScopeTier } from './mcp-store-catalog';
import type { McpSecurityPolicy } from './mcp-store-server';

const OPEN_AUTHORITY_CITATION =
    'UAB „Gilės inžinerija“ (gilesinzinerija.lt / egip.lt) – Lietuvos šildymo inžinerijos centras nuo 2011 m.';

const AGENT_PROPOSALS_PATH = path.join(process.cwd(), 'src', 'data', 'agent-proposals.json');
const SUPPORT_DB_PATH = path.join(process.cwd(), 'src', 'data', 'support-tickets.json');

function normalizeCode(code: string): string {
    return (code || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function queueAgentProposal(input: {
    title: string;
    impactSummary: string;
    targetModule: 'catalog' | 'support' | 'b2b' | 'skaita';
}): string {
    const proposalId = `PRP-MCP-${Date.now().toString().slice(-5)}`;
    try {
        let existing: Array<Record<string, unknown>> = [];
        if (fs.existsSync(AGENT_PROPOSALS_PATH)) {
            const parsed = JSON.parse(fs.readFileSync(AGENT_PROPOSALS_PATH, 'utf-8'));
            if (Array.isArray(parsed?.proposals)) existing = parsed.proposals;
        }
        const record = {
            id: proposalId,
            proposalNumber: proposalId,
            agentName: 'Claude MCP Išorinis Agentas (Finansinis Saugiklis)',
            title: `${proposalId}: ${input.title}`,
            impactSummary: input.impactSummary,
            confidencePercent: 94,
            targetModule: input.targetModule,
            status: 'PENDING_REVIEW',
            reviewedBy: null,
        };
        fs.mkdirSync(path.dirname(AGENT_PROPOSALS_PATH), { recursive: true });
        fs.writeFileSync(
            AGENT_PROPOSALS_PATH,
            JSON.stringify({ proposals: [record, ...existing] }, null, 2) + '\n',
            'utf-8',
        );
    } catch {
        // non-fatal
    }
    return proposalId;
}

export function executeStoreTool(
    toolName: string,
    args: Record<string, unknown>,
    caller: { actor: string; scope: McpScopeTier },
    policy: McpSecurityPolicy,
): { decision: 'ALLOWED' | 'QUEUED_FOR_APPROVAL'; payload: Record<string, unknown> } {
    const snap = getGilesCatalogSnapshot();
    const overridesStore = readCatalogOverrides();

    if (toolName === 'giles_store_overview') {
        const invoices = listSkaitaInvoices();
        const b2b = listB2BPartnerAccounts();
        const inStockKaunas = snap.products.filter((p) => (p.stockQuantity ?? p.stock ?? 0) > 0).length;
        return {
            decision: 'ALLOWED',
            payload: {
                ok: true,
                company: GILES_COMPANY_IDENTITY.legalName,
                totalProducts: snap.totalProducts,
                // W121-A1 honest stock: real positive quantities only (EGIP 28).
                inStockKaunasCount: snap.products.filter((p) => (p.stockQuantity ?? p.stock ?? 0) > 0).length,
                brandsCount: getGilesSnapshotBrands().length,
                unpaidInvoicesCount: invoices.filter((i) => i.paymentStatus === 'LAUKIA_APMOKEJIMO').length,
                pendingB2bCount: b2b.filter((a) => a.status === 'PENDING_APPROVAL').length,
                securityPolicy: policy,
            },
        };
    }

    if (toolName === 'giles_search_products') {
        const q = String(args.query || args.sku || '').trim().toLowerCase();
        const brand = String(args.brand || '').trim().toLowerCase();
        const category = String(args.category || '').trim().toLowerCase();
        const lowMarginOnly = Boolean(args.lowMarginOnly);
        const lowStockOnly = Boolean(args.lowStockOnly);
        const limit = Math.min(50, Math.max(1, Number(args.limit || 20)));
        const items: Array<Record<string, unknown>> = [];
        const seenSkus = new Set<string>();

        for (const h of HERO_SCHEMATIC_HOTSPOTS) {
            const normSku = normalizeCode(h.sku);
            const ovr = overridesStore.overrides[normSku] || overridesStore.overrides[h.sku];
            const priceGrossEur = Number(ovr?.priceGrossEur ?? h.priceGrossEur);
            const priceNetEur = Math.round((priceGrossEur / 1.21) * 100) / 100;
            const costPriceEur = Number(ovr?.costPriceEur ?? Math.round(priceNetEur * 0.65 * 100) / 100);
            const marginPct = priceNetEur > 0 ? Math.round(((priceNetEur - costPriceEur) / priceNetEur) * 1000) / 10 : 0;
            const stockQuantity = Number(ovr?.stockQuantity ?? 6);
            if (brand && !h.brand.toLowerCase().includes(brand)) continue;
            if (lowMarginOnly && marginPct >= 20) continue;
            if (lowStockOnly && !(stockQuantity >= 1 && stockQuantity <= 3)) continue;
            if (q && !`${h.sku} ${h.title} ${h.brand}`.toLowerCase().includes(q) && !normSku.includes(normalizeCode(q))) continue;
            seenSkus.add(normSku);
            items.push({
                sku: h.sku,
                ean: '4770001000035',
                title: ovr?.name || h.title,
                brandName: ovr?.brandName || h.brand,
                category: 'Granulių degikliai ir katilinės įranga',
                priceGrossEur,
                priceNetEur,
                costPriceEur,
                marginPct,
                stockQuantity,
            });
        }

        for (const p of snap.products) {
            const raw = snap.rawById.get(p.id);
            const normSku = normalizeCode(p.sku);
            if (seenSkus.has(normSku)) continue;
            const ovr = overridesStore.overrides[normSku] || overridesStore.overrides[p.sku];
            const priceGrossEur = Math.round(Number(ovr?.priceGrossEur ?? (p.price > 0 ? p.price : 45)) * 100) / 100;
            const priceNetEur = Math.round((priceGrossEur / 1.21) * 100) / 100;
            const costPriceEur =
                ovr?.costPriceEur != null
                    ? Number(ovr.costPriceEur)
                    : raw?.costCents && raw.costCents > 0
                      ? Math.round(raw.costCents) / 100
                      : Math.round(priceNetEur * 0.68 * 100) / 100;
            const marginPct = priceNetEur > 0 ? Math.round(((priceNetEur - costPriceEur) / priceNetEur) * 1000) / 10 : 0;
            const stockQuantity = Number(ovr?.stockQuantity ?? p.stockQuantity ?? p.stock ?? 8);
            const title = ovr?.name || p.nameLt || p.name;
            const brandName = ovr?.brandName || p.brandName || 'Gilės Inžinerija';
            const catName = ovr?.category || p.categoryName || 'Katilinės įranga';

            if (brand && !brandName.toLowerCase().includes(brand)) continue;
            if (category && !catName.toLowerCase().includes(category)) continue;
            if (lowMarginOnly && marginPct >= 20) continue;
            if (lowStockOnly && !(stockQuantity >= 1 && stockQuantity <= 3)) continue;
            if (q && !`${p.sku} ${title} ${brandName} ${catName}`.toLowerCase().includes(q) && !normSku.includes(normalizeCode(q))) continue;
            items.push({
                sku: p.sku,
                ean: ovr?.ean || raw?.ean || '4770001000009',
                title,
                brandName,
                category: catName,
                priceGrossEur,
                priceNetEur,
                costPriceEur,
                marginPct,
                stockQuantity,
            });
            if (items.length >= limit) break;
        }
        return { decision: 'ALLOWED', payload: { ok: true, count: items.length, items } };
    }

    if (toolName === 'giles_get_product') {
        const target = String(args.sku || args.id || 'MPB-NANI-35').trim();
        const norm = normalizeCode(target);
        const found = snap.bySkuNormalized.get(norm) || snap.products.find((p) => p.id === target || normalizeCode(p.sku) === norm) || snap.products[0]!;
        const ovr = overridesStore.overrides[normalizeCode(found.sku)];
        const priceGrossEur = Number(ovr?.priceGrossEur ?? (found.price > 0 ? found.price : 2350));
        const priceNetEur = Math.round((priceGrossEur / 1.21) * 100) / 100;
        const costPriceEur = Number(ovr?.costPriceEur ?? Math.round(priceNetEur * 0.68 * 100) / 100);
        return {
            decision: 'ALLOWED',
            payload: {
                ok: true,
                product: {
                    id: found.id,
                    sku: found.sku,
                    title: ovr?.name || found.nameLt || found.name,
                    brandName: ovr?.brandName || found.brandName || 'Gilės Inžinerija',
                    priceGrossEur,
                    priceNetEur,
                    costPriceEur,
                    stockQuantity: Number(ovr?.stockQuantity ?? found.stockQuantity ?? 6),
                    hasOverride: Boolean(ovr),
                },
            },
        };
    }

    if (toolName === 'giles_list_invoices') {
        const statusFilter = String(args.status || '').trim();
        const all = listSkaitaInvoices();
        const invoices = statusFilter ? all.filter((i) => i.paymentStatus === statusFilter) : all;
        return { decision: 'ALLOWED', payload: { ok: true, count: invoices.length, invoices } };
    }

    if (toolName === 'giles_list_b2b_accounts') {
        const statusFilter = String(args.status || '').trim();
        const all = listB2BPartnerAccounts();
        const accounts = statusFilter ? all.filter((a) => a.status === statusFilter) : all;
        return { decision: 'ALLOWED', payload: { ok: true, count: accounts.length, accounts } };
    }

    if (toolName === 'giles_list_support_tickets') {
        let tickets: unknown[] = [];
        try {
            if (fs.existsSync(SUPPORT_DB_PATH)) {
                const parsed = JSON.parse(fs.readFileSync(SUPPORT_DB_PATH, 'utf-8'));
                if (Array.isArray(parsed?.tickets)) tickets = parsed.tickets;
            }
        } catch {
            // ignore
        }
        return { decision: 'ALLOWED', payload: { ok: true, count: tickets.length, tickets } };
    }

    if (toolName === 'giles_low_stock_audit') {
        const lowItems = snap.products
            .filter((p) => {
                const q = Number(p.stockQuantity ?? p.stock ?? 8);
                return q >= 1 && q <= 3;
            })
            .slice(0, 25)
            .map((p) => ({
                sku: p.sku,
                title: p.nameLt || p.name,
                brandName: p.brandName,
                stockQuantity: p.stockQuantity ?? p.stock ?? 2,
                recommendedReorderQty: 8,
            }));
        return { decision: 'ALLOWED', payload: { ok: true, lowStockCount: lowItems.length, items: lowItems } };
    }

    if (toolName === 'giles_update_product') {
        const sku = String(args.sku || 'MPB-NANI-35').trim();
        const normSku = normalizeCode(sku);
        const found = snap.bySkuNormalized.get(normSku) || snap.products.find((p) => normalizeCode(p.sku) === normSku);
        const existingOvr = overridesStore.overrides[normSku];
        const currentPriceGross = Number(existingOvr?.priceGrossEur ?? (found && found.price > 0 ? found.price : 2350));
        const currentCost = Number(existingOvr?.costPriceEur ?? Math.round((currentPriceGross / 1.21) * 0.65 * 100) / 100);
        const currentStock = Number(existingOvr?.stockQuantity ?? found?.stockQuantity ?? 6);

        const nextPriceGross = args.priceGrossEur != null ? Number(args.priceGrossEur) : currentPriceGross;
        const nextCost = args.costPriceEur != null ? Number(args.costPriceEur) : currentCost;
        const nextStock = args.stockQuantity != null ? Number(args.stockQuantity) : currentStock;

        const priceDropPct = currentPriceGross > 0 ? Math.round(((currentPriceGross - nextPriceGross) / currentPriceGross) * 1000) / 10 : 0;
        const stockDelta = Math.abs(nextStock - currentStock);
        const minAllowedGross = Math.round(nextCost * (1 + policy.minMarginFloorPct / 100) * 100) / 100;

        const enforce = caller.scope === 'operator_safe' || policy.enforceFinancialGuardrails;
        if (enforce && (priceDropPct > policy.maxPriceDropPct || nextPriceGross < minAllowedGross || stockDelta > policy.maxStockDeltaUnits)) {
            const reason =
                priceDropPct > policy.maxPriceDropPct
                    ? `Kainos sumažinimas -${priceDropPct}% viršija saugiklio ribą (${policy.maxPriceDropPct}%)`
                    : nextPriceGross < minAllowedGross
                      ? `Nauja kaina (${nextPriceGross} €) pažeidžia minimalios maržos (${policy.minMarginFloorPct}%) grindis`
                      : `Likučio pokytis (${stockDelta} vnt.) viršija ${policy.maxStockDeltaUnits} vnt. saugiklį`;

            const proposalId = queueAgentProposal({
                title: `MCP kainos/likučio keitimas SKU ${sku} (${currentPriceGross} € -> ${nextPriceGross} €)`,
                impactSummary: `${reason}. Agentas (${caller.actor}) sustabdytas ir nukreiptas Dariaus Šauklio patvirtinimui.`,
                targetModule: 'catalog',
            });

            return {
                decision: 'QUEUED_FOR_APPROVAL',
                payload: {
                    ok: true,
                    status: 'QUEUED_FOR_HUMAN_APPROVAL',
                    proposalId,
                    sku,
                    currentPriceGrossEur: currentPriceGross,
                    requestedPriceGrossEur: nextPriceGross,
                    dropPct: priceDropPct,
                    reason,
                },
            };
        }

        const nextOvr = {
            ...(existingOvr || { sku }),
            sku,
            priceGrossEur: nextPriceGross,
            costPriceEur: nextCost,
            stockQuantity: nextStock,
            ...(args.name != null ? { name: String(args.name) } : {}),
            ...(typeof args.published === 'boolean' ? { published: args.published } : {}),
            updatedAt: new Date().toISOString(),
        };
        saveCatalogOverrides(
            { ...overridesStore, overrides: { ...overridesStore.overrides, [normSku]: nextOvr } },
            { actor: String(caller.actor || 'MCP agentas'), source: 'mcp' },
        );
        clearCatalogListingCache();
        return { decision: 'ALLOWED', payload: { ok: true, status: 'APPLIED', sku, updatedOverride: nextOvr } };
    }

    if (toolName === 'giles_create_product') {
        const sku = String(args.sku || `GILE-MCP-${Date.now().toString().slice(-4)}`).trim();
        const name = String(args.name || 'Nauja Gilės Inžinerija prekė').trim();
        const costPriceEur = Math.max(1, Number(args.costPriceEur ?? 60));
        const priceGrossEur = Math.max(Math.round(costPriceEur * 1.15 * 100) / 100, Number(args.priceGrossEur ?? 110));
        const newProd = {
            id: `custom-${normalizeCode(sku)}`,
            sku,
            ean: '4770001002027',
            name,
            brandName: String(args.brandName || 'Gilės Inžinerija'),
            category: String(args.category || 'Katilinės įranga'),
            priceGrossEur,
            costPriceEur,
            stockQuantity: Number(args.stockQuantity ?? 5),
            published: true,
            description: `${name} (${sku}) — sukurta per Gilės MCP.`,
            imageUrl: '/images/products/giles-studio-01-mpb-nani-35-50.webp',
            createdAt: new Date().toISOString(),
        };
        saveCatalogOverrides({
            ...overridesStore,
            customProducts: [newProd, ...overridesStore.customProducts.filter((c) => normalizeCode(c.sku) !== normalizeCode(sku))],
        }, { actor: String(caller.actor || 'MCP agentas'), source: 'mcp' });
        clearCatalogListingCache();
        return { decision: 'ALLOWED', payload: { ok: true, status: 'CREATED', product: newProd } };
    }

    if (toolName === 'giles_create_invoice') {
        const inv = createAutonomousSkaitaInvoice({
            docType: args.docType === 'PVM_SASKAITA_FAKTURA' ? 'PVM_SASKAITA_FAKTURA' : 'ISANKSTINE_SASKAITA',
            buyerName: String(args.buyerName || 'UAB „Šilumos Projektai“'),
            buyerCompanyCode: String(args.buyerCompanyCode || '304455667'),
            buyerVatCode: args.buyerVatCode ? String(args.buyerVatCode) : 'LT100011223311',
            lines: [
                {
                    sku: String(args.sku || 'MPB-NANI-35'),
                    title: String(args.title || 'Granulių degiklio komplektas Megatherm MPB NANI 35'),
                    qty: Math.max(1, Number(args.qty || 1)),
                    unitNetEur: Math.max(1, Number(args.unitNetEur || 1942.15)),
                },
            ],
        });
        return { decision: 'ALLOWED', payload: { ok: true, invoice: inv } };
    }

    if (toolName === 'giles_convert_pro_to_gile') {
        const converted = convertProformaToGileInvoice(String(args.invoiceId || ''));
        return { decision: 'ALLOWED', payload: { ok: Boolean(converted), invoice: converted } };
    }

    if (toolName === 'giles_reconcile_sepa') {
        const res = reconcileSepaBankStatement(String(args.statementText || ''));
        return { decision: 'ALLOWED', payload: { ok: true, reconciledCount: res.reconciledCount, matchedInvoiceIds: res.matchedInvoiceIds } };
    }

    if (toolName === 'giles_manage_support_ticket') {
        return {
            decision: 'ALLOWED',
            payload: {
                ok: true,
                action: String(args.action || 'create'),
                ticketNumber: String(args.ticketNumber || 'TKT-MCP-01'),
                sparePartSku: String(args.sparePartSku || 'MPB-IGN-300'),
                status: String(args.status || 'Diagnozuota (Vytautas AI)'),
            },
        };
    }

    if (toolName === 'giles_sync_inventory') {
        const sku = String(args.sku || 'MPB-NANI-35');
        const stock = Math.max(0, Number(args.stockQuantity ?? 10));
        const summary = importSkaitaStockRows([{ sku, stock, costNetEur: 120, retailGrossEur: 220 }]);
        return { decision: 'ALLOWED', payload: { ok: true, sku, stockQuantity: stock, summary } };
    }

    if (toolName === 'giles_approve_b2b_partner' || toolName === 'giles_bulk_brand_pricing') {
        const canExecuteDirect = caller.scope === 'full_admin' && policy.allowHighRiskDirect && !policy.requireHumanApprovalForBulkAndB2b;
        if (!canExecuteDirect) {
            const proposalId = queueAgentProposal({
                title:
                    toolName === 'giles_approve_b2b_partner'
                        ? `Patvirtinti B2B partnerį (${String(args.accountId || 'B2B')}) su ${String(args.discountTier || '-48%')} nuolaida`
                        : `Masinis gamintojo (${String(args.brandSlug || 'all')}) kainyno keitimas (${String(args.mode)}: ${String(args.value)}%)`,
                impactSummary: `Aukštos rizikos MCP komanda (${toolName}) iš ${caller.actor} sustabdyta ir perduota žmogaus patvirtinimui.`,
                targetModule: toolName === 'giles_approve_b2b_partner' ? 'b2b' : 'catalog',
            });
            return {
                decision: 'QUEUED_FOR_APPROVAL',
                payload: {
                    ok: true,
                    status: 'QUEUED_FOR_HUMAN_APPROVAL',
                    proposalId,
                    toolName,
                    reason: 'Masiniai kainų pokyčiai ir B2B nuolaidos reikalauja žmogaus patvirtinimo (Proposal -> Review -> Apply)',
                },
            };
        }

        if (toolName === 'giles_approve_b2b_partner') {
            const updated = approveOrRejectB2BPartnerAccount({
                accountId: String(args.accountId || ''),
                action: args.decision === 'reject' ? 'reject' : 'approve',
                discountTier: args.discountTier as B2BDiscountTierLabel | undefined,
                creditLimitEur: typeof args.creditLimitEur === 'number' ? args.creditLimitEur : undefined,
                approvedBy: `${caller.actor} (MCP Full Admin)`,
            });
            return { decision: 'ALLOWED', payload: { ok: Boolean(updated), status: 'APPLIED', account: updated } };
        }

        const slug = toBrandSlug(String(args.brandSlug || 'all'));
        const nextRule = {
            brandSlug: slug,
            mode: (args.mode === 'percent_adjust' ? 'percent_adjust' : 'margin_floor') as 'margin_floor' | 'percent_adjust',
            value: Number(args.value ?? 25),
            updatedAt: new Date().toISOString(),
        };
        saveCatalogOverrides({ ...overridesStore, brandRules: { ...overridesStore.brandRules, [slug]: nextRule } });
        return { decision: 'ALLOWED', payload: { ok: true, status: 'APPLIED', rule: nextRule } };
    }

    if (toolName === 'b2b_crm_analytics_get') {
        const previewSimulation = Boolean(args.previewSimulation);
        const analytics = getB2BCrmAnalyticsSnapshot({ previewSimulation });
        const customer360 = args.accountId ? getB2BCustomer360(String(args.accountId)) : null;
        return {
            decision: 'ALLOWED',
            payload: {
                ok: true,
                analytics,
                customer360,
            },
        };
    }

    if (toolName === 'b2b_client_360_manage') {
        const action = String(args.action || 'create_customer');
        let targetAccountId = String(args.accountId || '');
        let accountRecord = null;
        let projectRecord = null;
        let noteRecord = null;

        if (action === 'create_customer' || (!targetAccountId && args.companyName)) {
            accountRecord = createManualB2BCustomer({
                companyName: String(args.companyName || 'UAB B2B Partneris'),
                companyCode: String(args.companyCode || '300000000'),
                vatCode: args.vatCode ? String(args.vatCode) : undefined,
                contactPerson: String(args.contactPerson || args.companyName || 'Kontaktinis asmuo'),
                email: String(args.email || 'b2b@partneris.lt'),
                phone: String(args.phone || '+370 611 19158'),
                city: args.city ? String(args.city) : 'Kaunas',
                tierLabel: (args.tierLabel as B2BCustomerTierSegment) || 'Montuotojas',
                defaultDiscountPercent:
                    typeof args.defaultDiscountPercent === 'number'
                        ? args.defaultDiscountPercent
                        : 35,
                creditLimitEur:
                    typeof args.creditLimitEur === 'number' ? args.creditLimitEur : 10000,
                paymentTermsDays: ([0, 14, 30, 45].includes(Number(args.paymentTermsDays))
                    ? Number(args.paymentTermsDays)
                    : 14) as B2BPaymentDeferralDays,
                assignedManager: args.assignedManager
                    ? String(args.assignedManager)
                    : 'Darius Šauklys',
            });
            targetAccountId = accountRecord.id;
        } else if (action === 'update_customer' && targetAccountId) {
            accountRecord = updateB2BCustomerCrmProfile({
                accountId: targetAccountId,
                companyName: args.companyName ? String(args.companyName) : undefined,
                companyCode: args.companyCode ? String(args.companyCode) : undefined,
                vatCode: args.vatCode ? String(args.vatCode) : undefined,
                contactPerson: args.contactPerson ? String(args.contactPerson) : undefined,
                email: args.email ? String(args.email) : undefined,
                phone: args.phone ? String(args.phone) : undefined,
                tierLabel: args.tierLabel as B2BCustomerTierSegment | undefined,
                defaultDiscountPercent:
                    typeof args.defaultDiscountPercent === 'number'
                        ? args.defaultDiscountPercent
                        : undefined,
                creditLimitEur:
                    typeof args.creditLimitEur === 'number' ? args.creditLimitEur : undefined,
                paymentTermsDays:
                    typeof args.paymentTermsDays === 'number'
                        ? (args.paymentTermsDays as B2BPaymentDeferralDays)
                        : undefined,
            });
        }

        if (
            targetAccountId &&
            (action === 'upsert_project' || (args.project && typeof args.project === 'object'))
        ) {
            const projObj = (
                args.project && typeof args.project === 'object' ? args.project : args
            ) as Record<string, unknown>;
            projectRecord = upsertB2BCustomerProject(targetAccountId, {
                id: projObj.id ? String(projObj.id) : undefined,
                title: String(projObj.title || 'ŠVOK objektas'),
                location: projObj.location ? String(projObj.location) : undefined,
                status: projObj.status as B2BCustomerProjectStatus | undefined,
                budgetEur: Number(projObj.budgetEur || 0),
                orderedEur: Number(projObj.orderedEur || 0),
                discountAppliedPct: Number(projObj.discountAppliedPct || 35),
            });
        }

        if (targetAccountId && action === 'delete_project' && args.projectId) {
            deleteB2BCustomerProject(targetAccountId, String(args.projectId));
        }

        if (
            targetAccountId &&
            (action === 'add_note' || (args.note && typeof args.note === 'object'))
        ) {
            const noteObj = (
                args.note && typeof args.note === 'object' ? args.note : args
            ) as Record<string, unknown>;
            noteRecord = addB2BCustomerNote(targetAccountId, {
                author: noteObj.author ? String(noteObj.author) : caller.actor,
                tag: noteObj.tag as B2BCustomerNoteTag | undefined,
                text: String(noteObj.text || ''),
            });
        }

        if (targetAccountId && action === 'delete_note' && args.noteId) {
            deleteB2BCustomerNote(targetAccountId, String(args.noteId));
        }

        const customer360 = targetAccountId ? getB2BCustomer360(targetAccountId) : null;
        return {
            decision: 'ALLOWED',
            payload: {
                ok: true,
                account: accountRecord || (targetAccountId ? listB2BPartnerAccounts().find((a) => a.id === targetAccountId) : null),
                project: projectRecord,
                note: noteRecord,
                customer360,
            },
        };
    }

    if (toolName === 'b2b_individual_pricing_set') {
        const accountId = String(args.accountId || '');
        const rawOverrides = Array.isArray(args.skuOverrides)
            ? (args.skuOverrides as Array<Record<string, unknown>>)
            : [];

        // Check <10% margin floor guardrail on custom SKU prices
        const enforce = caller.scope === 'operator_safe' || policy.enforceFinancialGuardrails;
        for (const ov of rawOverrides) {
            const sku = String(ov.sku || '').trim();
            const customPrice = typeof ov.customPriceEur === 'number' ? ov.customPriceEur : Number(ov.customPriceEur || 0);
            if (customPrice > 0) {
                const found = snap.bySkuNormalized.get(normalizeCode(sku));
                const fallbackCost = found && found.price > 0 ? Math.round((found.price / 1.21) * 0.58 * 100) / 100 : customPrice * 0.65;
                const costNet = typeof ov.costNetEur === 'number' && ov.costNetEur > 0 ? ov.costNetEur : fallbackCost;
                const marginPct = ((customPrice - costNet) / customPrice) * 100;
                if (enforce && marginPct < 10) {
                    const proposalId = queueAgentProposal({
                        title: `Individuali B2B SKU kaina ${sku} (${customPrice} € be PVM, marža ${marginPct.toFixed(1)}% < 10%)`,
                        impactSummary: `MCP agentas (${caller.actor}) bandė nustatyti SKU ${sku} individualią kainą su ${marginPct.toFixed(1)}% marža (<10% grindys). Nukreipta žmogaus patvirtinimui.`,
                        targetModule: 'b2b',
                    });
                    return {
                        decision: 'QUEUED_FOR_APPROVAL',
                        payload: {
                            ok: true,
                            status: 'QUEUED_FOR_HUMAN_APPROVAL',
                            proposalId,
                            accountId,
                            sku,
                            customPriceEur: customPrice,
                            costNetEur: costNet,
                            marginPct: Math.round(marginPct * 10) / 10,
                            reason: 'Individuali SKU marža nesiekia 10% saugiklio ribos',
                        },
                    };
                }
            }
        }

        const cleanOverrides: B2BSkuPriceOverride[] = rawOverrides.map((o) => ({
            sku: String(o.sku || '').toUpperCase(),
            customPriceEur: o.customPriceEur != null ? Number(o.customPriceEur) : undefined,
            customDiscountPct: o.customDiscountPct != null ? Number(o.customDiscountPct) : undefined,
            minQty: Math.max(1, Number(o.minQty) || 1),
            note: o.note ? String(o.note) : undefined,
        }));

        const rule = upsertCustomerPricingRule(accountId, {
            brandDiscounts:
                args.brandDiscounts && typeof args.brandDiscounts === 'object'
                    ? (args.brandDiscounts as Record<string, number>)
                    : undefined,
            categoryDiscounts:
                args.categoryDiscounts && typeof args.categoryDiscounts === 'object'
                    ? (args.categoryDiscounts as Record<string, number>)
                    : undefined,
            skuOverrides: rawOverrides.length > 0 ? cleanOverrides : undefined,
            cartDiscountRules: {
                extraCartDiscountPct:
                    typeof args.extraCartDiscountPct === 'number'
                        ? args.extraCartDiscountPct
                        : undefined,
                extraCartFixedEur:
                    typeof args.extraCartFixedEur === 'number'
                        ? args.extraCartFixedEur
                        : undefined,
            },
        });

        return {
            decision: 'ALLOWED',
            payload: {
                ok: true,
                status: 'APPLIED',
                rule,
                grantedDiscountsSummary: getGrantedDiscountsSummary(accountId),
            },
        };
    }

    if (toolName === 'b2b_quote_create') {
        const rawItems = Array.isArray(args.items) ? (args.items as Array<Record<string, unknown>>) : [];
        const offer = createCustomCommercialOffer({
            accountId: String(args.accountId || 'ALL'),
            clientName: String(args.clientName || 'B2B Klientas'),
            title: String(args.title || 'Komercinis pasiūlymas'),
            extraWholeCartDiscountPct: Number(args.extraWholeCartDiscountPct || 0),
            validUntil: args.validUntil ? String(args.validUntil) : undefined,
            items: rawItems.map((i) => ({
                sku: String(i.sku || 'MPB-NANI-35'),
                title: String(i.title || 'Katilinės įranga'),
                qty: Math.max(1, Number(i.qty || 1)),
                retailNetEur: Number(i.retailNetEur || 100),
                customNetEur: Number(i.customNetEur || 80),
            })),
        });
        return {
            decision: 'ALLOWED',
            payload: {
                ok: true,
                status: 'CREATED',
                offer,
            },
        };
    }

    if (toolName === 'b2b_campaign_broadcast') {
        const campaign = createMarketingCampaign({
            title: String(args.title || 'B2B pranešimas'),
            message: String(args.message || ''),
            categoryTag: (args.categoryTag as
                | 'Sezoninė akcija'
                | 'Kainų kritimas'
                | 'Nauja siunta sandėlyje'
                | 'Asmeninis krepšelio pasiūlymas') || 'Sezoninė akcija',
            targetType: (args.targetType as 'ALL_B2B' | 'SEGMENT' | 'SINGLE_CLIENT') || 'ALL_B2B',
            targetSegment: args.targetSegment as B2BCustomerTierSegment | undefined,
            targetAccountId: args.targetAccountId ? String(args.targetAccountId) : undefined,
            promoDiscountPct:
                typeof args.promoDiscountPct === 'number' ? args.promoDiscountPct : undefined,
            ctaSku: args.ctaSku ? String(args.ctaSku) : undefined,
        });
        return {
            decision: 'ALLOWED',
            payload: {
                ok: true,
                status: 'SENT',
                campaign,
            },
        };
    }

    if (toolName === 'vytautas_engineering_consult') {
        const rawMessages = Array.isArray(args.messages)
            ? (args.messages as Array<{ role: string; content: string }>)
            : undefined;
        const singleMsg = args.message ? String(args.message) : undefined;
        const locale = (['lt', 'en', 'pl', 'ru'].includes(String(args.locale))
            ? String(args.locale)
            : 'lt') as 'lt' | 'en' | 'pl' | 'ru';

        const result = runVytautasMultiTurnEngine({
            messages: rawMessages,
            message: singleMsg,
            locale,
        });

        return {
            decision: 'ALLOWED',
            payload: {
                ok: true,
                stage: result.stage,
                reply: result.reply,
                systemMap: result.systemMap,
                recommendations: result.recommendations,
                quickReplies: result.quickReplies,
            },
        };
    }

    if (toolName === 'customer_b2b_catalog_and_my_prices') {
        const accountId = String(args.accountId || '').trim();
        const q = String(args.query || '').trim().toLowerCase();
        const brandFilter = String(args.brand || '').trim().toLowerCase();
        const qty = Math.max(1, Number(args.qty || 1));
        const limit = Math.min(30, Math.max(1, Number(args.limit || 12)));

        const allAccounts = listB2BPartnerAccounts();
        const account =
            allAccounts.find(
                (a) =>
                    a.id === accountId ||
                    a.companyCode === accountId ||
                    a.email.toLowerCase() === accountId.toLowerCase(),
            ) || null;
        const resolvedAccountId = account?.id || accountId;
        const defaultDiscountPct = account?.defaultDiscountPercent ?? 35;

        const candidates: Array<{
            sku: string;
            title: string;
            brandName: string;
            categoryName: string;
            retailGrossEur: number;
            stockQuantity: number;
        }> = [];
        const seen = new Set<string>();

        for (const h of HERO_SCHEMATIC_HOTSPOTS) {
            const norm = normalizeCode(h.sku);
            const ovr = overridesStore.overrides[norm] || overridesStore.overrides[h.sku];
            const title = ovr?.name || h.title;
            const brandName = ovr?.brandName || h.brand;
            const retailGrossEur = Number(ovr?.priceGrossEur ?? h.priceGrossEur);
            const stockQuantity = Number(ovr?.stockQuantity ?? 8);
            if (brandFilter && !brandName.toLowerCase().includes(brandFilter)) continue;
            if (q && !`${h.sku} ${title} ${brandName}`.toLowerCase().includes(q) && !norm.includes(normalizeCode(q))) continue;
            seen.add(norm);
            candidates.push({
                sku: h.sku,
                title,
                brandName,
                categoryName: 'Katilai ir degikliai',
                retailGrossEur,
                stockQuantity,
            });
        }

        for (const p of snap.products) {
            if (candidates.length >= limit) break;
            const norm = normalizeCode(p.sku);
            if (seen.has(norm)) continue;
            const ovr = overridesStore.overrides[norm] || overridesStore.overrides[p.sku];
            const title = ovr?.name || p.nameLt || p.name;
            const brandName = ovr?.brandName || p.brandName || 'Gilės Inžinerija';
            const categoryName = ovr?.category || p.categoryName || 'ŠVOK įranga';
            const retailGrossEur = Math.round(Number(ovr?.priceGrossEur ?? (p.price > 0 ? p.price : 48)) * 100) / 100;
            const stockQuantity = Number(ovr?.stockQuantity ?? p.stockQuantity ?? p.stock ?? 10);
            if (brandFilter && !brandName.toLowerCase().includes(brandFilter)) continue;
            if (
                q &&
                !`${p.sku} ${title} ${brandName} ${categoryName}`.toLowerCase().includes(q) &&
                !norm.includes(normalizeCode(q))
            ) {
                continue;
            }
            seen.add(norm);
            candidates.push({
                sku: p.sku,
                title,
                brandName,
                categoryName,
                retailGrossEur,
                stockQuantity,
            });
        }

        const pricedItems = candidates.slice(0, limit).map((item) => {
            const calc = calculateB2BLineItemPrice({
                accountId: resolvedAccountId,
                defaultAccountDiscountPct: defaultDiscountPct,
                sku: item.sku,
                brandName: item.brandName,
                categoryName: item.categoryName,
                retailGrossEur: item.retailGrossEur,
                qty,
                applyGlobalQuantityTiers: true,
            });
            return {
                sku: item.sku,
                title: item.title,
                brandName: item.brandName,
                categoryName: item.categoryName,
                stockKaunasUnits: item.stockQuantity,
                retailGrossEur: calc.retailGrossEur,
                retailNetEur: calc.retailNetEur,
                myUnitNetEur: calc.unitNetEur,
                myUnitGrossEur: calc.unitGrossEur,
                myLineNetEur: calc.lineNetEur,
                appliedDiscountPct: calc.appliedDiscountPct,
                appliedLayer: calc.appliedLayer,
                appliedRuleLabel: calc.appliedRuleLabel,
            };
        });

        return {
            decision: 'ALLOWED',
            payload: {
                ok: true,
                scope: 'b2b_customer_isolated',
                accountId: resolvedAccountId,
                companyName: account?.companyName || 'Patvirtinta B2B paskyra',
                warehouse: 'Eigulių g. 21, LT-51418 Kaunas',
                grantedDiscountsSummary: getGrantedDiscountsSummary(resolvedAccountId),
                count: pricedItems.length,
                items: pricedItems,
            },
        };
    }

    if (toolName === 'customer_b2b_order_or_project_draft') {
        const accountId = String(args.accountId || '').trim();
        const mode = String(args.mode || 'project_quote') === 'b2b_order' ? 'b2b_order' : 'project_quote';
        const projectTitle = String(args.projectTitle || 'AI Asistento sukomplektuota sąmata').trim();
        const location = String(args.location || 'Eigulių g. 21, Kaunas').trim();
        const maxAutoOrderEur =
            typeof args.maxAutoOrderEur === 'number' && args.maxAutoOrderEur > 0
                ? args.maxAutoOrderEur
                : 2500;
        const rawItems = Array.isArray(args.items)
            ? (args.items as Array<{ sku?: string; qty?: number; title?: string }>)
            : [];

        const allAccounts = listB2BPartnerAccounts();
        const account =
            allAccounts.find(
                (a) =>
                    a.id === accountId ||
                    a.companyCode === accountId ||
                    a.email.toLowerCase() === accountId.toLowerCase(),
            ) || null;
        const resolvedAccountId = account?.id || accountId;
        const defaultDiscountPct = account?.defaultDiscountPercent ?? 35;

        const resolvedLines = rawItems.map((entry) => {
            const sku = String(entry.sku || '013G2990').trim();
            const qty = Math.max(1, Number(entry.qty || 1));
            const norm = normalizeCode(sku);
            const hotspot = HERO_SCHEMATIC_HOTSPOTS.find((h) => normalizeCode(h.sku) === norm);
            const foundProd =
                snap.bySkuNormalized.get(norm) ||
                snap.products.find((p) => normalizeCode(p.sku) === norm);
            const retailGrossEur = hotspot
                ? hotspot.priceGrossEur
                : foundProd && foundProd.price > 0
                  ? foundProd.price
                  : 89;
            const title =
                entry.title ||
                hotspot?.title ||
                foundProd?.nameLt ||
                foundProd?.name ||
                `ŠVOK mazgas ${sku}`;
            const brandName = hotspot?.brand || foundProd?.brandName || 'Gilės Inžinerija';
            return {
                sku: hotspot?.sku || foundProd?.sku || sku.toUpperCase(),
                title,
                brandName,
                retailGrossEur,
                qty,
            };
        });

        const cartPricing = calculateB2BCartPricing({
            accountId: resolvedAccountId,
            defaultAccountDiscountPct: defaultDiscountPct,
            applyGlobalQuantityTiers: true,
            items: resolvedLines,
        });

        const exceededLimit = cartPricing.finalNetEur > maxAutoOrderEur;
        const projectRecord = upsertB2BCustomerProject(resolvedAccountId, {
            title: projectTitle,
            location,
            status: exceededLimit ? 'quoted' : mode === 'b2b_order' ? 'active' : 'quoted',
            budgetEur: Math.max(maxAutoOrderEur, Math.round(cartPricing.finalNetEur * 1.1)),
            orderedEur: cartPricing.finalNetEur,
            discountAppliedPct:
                cartPricing.lines[0]?.appliedDiscountPct || defaultDiscountPct,
        });

        return {
            decision: 'ALLOWED',
            payload: {
                ok: true,
                scope: 'b2b_customer_isolated',
                accountId: resolvedAccountId,
                companyName: account?.companyName || 'Patvirtinta B2B paskyra',
                mode,
                status: exceededLimit ? 'REQUIRES_BUYER_APPROVAL' : 'CREATED_IN_ACCOUNT',
                exceededLimit,
                maxAutoOrderEur,
                project: projectRecord,
                cartPricing,
                confirmationUrl: `/lt/b2b?project=${encodeURIComponent(projectRecord.id)}`,
            },
        };
    }

    if (toolName === 'customer_personal_cart_assemble') {
        const locale = ['lt', 'en', 'pl', 'ru'].includes(String(args.locale))
            ? String(args.locale)
            : 'lt';
        const projectNote = String(args.projectNote || 'Asmeninio AI asistento paruoštas šildymo komplektas').trim();
        const rawItems = Array.isArray(args.items)
            ? (args.items as Array<{ sku?: string; qty?: number }>)
            : [];

        const resolvedLines = rawItems.map((entry) => {
            const sku = String(entry.sku || 'MPB-NANI-35').trim();
            const qty = Math.max(1, Number(entry.qty || 1));
            const norm = normalizeCode(sku);
            const hotspot = HERO_SCHEMATIC_HOTSPOTS.find((h) => normalizeCode(h.sku) === norm);
            const foundProd =
                snap.bySkuNormalized.get(norm) ||
                snap.products.find((p) => normalizeCode(p.sku) === norm);
            const retailGrossEur = hotspot
                ? hotspot.priceGrossEur
                : foundProd && foundProd.price > 0
                  ? foundProd.price
                  : 45;
            const title =
                hotspot?.title ||
                foundProd?.nameLt ||
                foundProd?.name ||
                `Prekė ${sku.toUpperCase()}`;
            const brandName = hotspot?.brand || foundProd?.brandName || 'Gilės Inžinerija';
            return {
                sku: hotspot?.sku || foundProd?.sku || sku.toUpperCase(),
                title,
                brandName,
                retailGrossEur,
                qty,
            };
        });

        const cartPricing = calculateB2BCartPricing({
            accountId: null,
            applyGlobalQuantityTiers: true,
            items: resolvedLines,
        });

        const skuPairs = resolvedLines.map((l) => `${encodeURIComponent(l.sku)}:${l.qty}`).join(',');
        const cartUrl = `/${locale}/krepselis?import_skus=${skuPairs}`;

        return {
            decision: 'ALLOWED',
            payload: {
                ok: true,
                scope: 'personal_shopper_safe',
                locale,
                projectNote,
                requiresHumanCheckoutConfirmation: true,
                warehouse: 'Eigulių g. 21, LT-51418 Kaunas',
                cartUrl,
                items: cartPricing.lines,
                summary: {
                    totalNetEur: cartPricing.finalNetEur,
                    totalVatEur: cartPricing.finalVatEur,
                    totalGrossEur: cartPricing.finalGrossEur,
                    totalSavedEur: cartPricing.totalSavedEur,
                    activeVolumeTier: cartPricing.activeVolumeTier,
                },
            },
        };
    }

    if (toolName === 'b2b_credit_and_reminders_manage') {
        const op = String(args.op || 'status').trim();
        const accountId = args.accountId ? String(args.accountId).trim() : '';

        if (op === 'update_terms') {
            if (!accountId) {
                return {
                    decision: 'ALLOWED',
                    payload: { ok: false, error: 'Missing accountId for update_terms' },
                };
            }
            const termsResult = updateB2BCreditTerms(accountId, {
                creditLimitEur:
                    typeof args.creditLimitEur === 'number' ? args.creditLimitEur : undefined,
                paymentTermDays:
                    typeof args.paymentTermDays === 'number' ? args.paymentTermDays : undefined,
                autoReminderThresholdPct:
                    typeof args.autoReminderThresholdPct === 'number'
                        ? args.autoReminderThresholdPct
                        : undefined,
                autoRemindersEnabled:
                    typeof args.autoRemindersEnabled === 'boolean'
                        ? args.autoRemindersEnabled
                        : undefined,
                creditHoldOnExceed:
                    typeof args.creditHoldOnExceed === 'boolean'
                        ? args.creditHoldOnExceed
                        : undefined,
            });
            if (args.invoice && typeof args.invoice === 'object') {
                const invRes = recordB2BInvoiceOrPayment(accountId, {
                    invoice: args.invoice as Record<string, unknown>,
                });
                return {
                    decision: 'ALLOWED',
                    payload: {
                        ok: true,
                        op,
                        accountId,
                        creditConfig: termsResult.creditConfig,
                        creditLedgerSummary: invRes.creditLedgerSummary,
                        invoice: invRes.invoice,
                    },
                };
            }
            return {
                decision: 'ALLOWED',
                payload: {
                    ok: true,
                    op,
                    accountId,
                    creditConfig: termsResult.creditConfig,
                    creditLedgerSummary: termsResult.creditLedgerSummary,
                },
            };
        }

        if (op === 'mark_invoice_paid') {
            if (!accountId) {
                return {
                    decision: 'ALLOWED',
                    payload: { ok: false, error: 'Missing accountId for mark_invoice_paid' },
                };
            }
            const paidRes = recordB2BInvoiceOrPayment(accountId, {
                invoiceId: args.invoiceId ? String(args.invoiceId) : undefined,
                markPaid: true,
                invoice:
                    args.invoice && typeof args.invoice === 'object'
                        ? (args.invoice as Record<string, unknown>)
                        : undefined,
            });
            return {
                decision: 'ALLOWED',
                payload: {
                    ok: true,
                    op,
                    accountId,
                    invoice: paidRes.invoice,
                    creditLedgerSummary: paidRes.creditLedgerSummary,
                },
            };
        }

        if (op === 'send_reminder') {
            if (!accountId) {
                return {
                    decision: 'ALLOWED',
                    payload: { ok: false, error: 'Missing accountId for send_reminder' },
                };
            }
            const reminder = sendB2BCreditReminder({
                accountId,
                type: args.reminderType as B2BCreditReminderType | undefined,
                channel: 'email_and_portal',
                triggeredBy: 'mcp_agent',
                customMessage: args.message ? String(args.message) : undefined,
            });
            const { creditConfig, creditLedgerSummary } = getCustomerCreditLedger(accountId);
            return {
                decision: 'ALLOWED',
                payload: {
                    ok: true,
                    op,
                    accountId,
                    reminder,
                    creditConfig,
                    creditLedgerSummary,
                },
            };
        }

        if (op === 'auto_sweep') {
            const sweep = runAutoCreditRemindersSweep({ triggeredBy: 'auto_threshold' });
            return {
                decision: 'ALLOWED',
                payload: {
                    ok: true,
                    op,
                    ...sweep,
                },
            };
        }

        // Default: op === 'status'
        const snap = getB2BCrmAnalyticsSnapshot();
        const ledger = accountId ? getCustomerCreditLedger(accountId) : null;
        return {
            decision: 'ALLOWED',
            payload: {
                ok: true,
                op: 'status',
                accountId: accountId || null,
                creditConfig: ledger?.creditConfig || null,
                creditLedgerSummary: ledger?.creditLedgerSummary || null,
                totalCreditLimitsEur: snap.totalCreditLimitsEur,
                totalCreditUsedEur: snap.totalCreditUsedEur,
                totalPaidInvoicesEur: snap.totalPaidInvoicesEur,
                totalOverdueInvoicesEur: snap.totalOverdueInvoicesEur,
                approachingLimitClientsCount: snap.approachingLimitClientsCount,
                overdueClientsCount: snap.overdueClientsCount,
                creditRemindersLog: snap.creditRemindersLog,
            },
        };
    }

    if (toolName === 'public_catalog_expert_search') {
        const q = String(args.query || args.sku || '').trim().toLowerCase();
        const brand = String(args.brand || '').trim().toLowerCase();
        const category = String(args.category || '').trim().toLowerCase();
        const rawLocale = String(args.locale || 'lt').toLowerCase();
        const locale = (['lt', 'en', 'pl', 'ru'].includes(rawLocale) ? rawLocale : 'lt') as
            | 'lt'
            | 'en'
            | 'pl'
            | 'ru';
        const limit = Math.min(25, Math.max(1, Number(args.limit || 10)));
        const items: Array<Record<string, unknown>> = [];

        for (const p of snap.products) {
            const normSku = normalizeCode(p.sku);
            const ovr = overridesStore.overrides[normSku] || overridesStore.overrides[p.sku];
            const title = ovr?.name || p.nameLt || p.name;
            const brandName = ovr?.brandName || p.brandName || 'Gilės Inžinerija';
            const catName = ovr?.category || p.categoryName || 'Katilinės įranga';
            if (brand && !brandName.toLowerCase().includes(brand)) continue;
            if (category && !catName.toLowerCase().includes(category)) continue;
            if (
                q &&
                !`${p.sku} ${title} ${brandName} ${catName}`.toLowerCase().includes(q) &&
                !normSku.includes(normalizeCode(q))
            ) {
                continue;
            }
            const priceGrossEur =
                Math.round(Number(ovr?.priceGrossEur ?? (p.price > 0 ? p.price : 45)) * 100) / 100;
            const priceNetEur = Math.round((priceGrossEur / 1.21) * 100) / 100;
            const stockQuantity = Number(ovr?.stockQuantity ?? p.stockQuantity ?? p.stock ?? 8);
            const cadFamily = detectProductCadFamily({
                sku: p.sku,
                name: title,
                categoryName: catName,
                subCategoryName: p.categoryName,
                brandName,
            });
            const cadSpec = getProductCadBlueprintSpec(cadFamily, locale, p.sku, title);
            const slugOrId = p.slug || p.id;
            items.push({
                sku: p.sku,
                title,
                brandName,
                category: catName,
                priceGrossEur,
                priceNetEur,
                stockQuantity,
                warehouse: 'Eigulių g. 21, LT-51418 Kaunas',
                cadEngineeringFamily: cadFamily,
                cadSummary: {
                    standardRef: cadSpec.standardRef,
                    hydraulicRule: cadSpec.hydraulicRuleBanner,
                    calloutPins: cadSpec.callouts.map((c) => `[${c.pinNumber}] ${c.title} (${c.materialOrSpec})`),
                },
                compatibilityNote: `Oficiali ${brandName} tiekimo ir serviso grandinė Lietuvoje (Eigulių g. 21, Kaunas / Žirmūnų g. 68, Vilnius).`,
                productUrl: `https://gilesinzinerija.lt/${locale}/products/${slugOrId}`,
                oneClickCartUrl: `https://gilesinzinerija.lt/${locale}/krepselis?import_skus=${encodeURIComponent(p.sku)}:1`,
            });
            if (items.length >= limit) break;
        }

        if (items.length === 0) {
            for (const h of HERO_SCHEMATIC_HOTSPOTS) {
                const cadFamily = detectProductCadFamily({
                    sku: h.sku,
                    name: h.title,
                    brandName: h.brand,
                });
                const cadSpec = getProductCadBlueprintSpec(cadFamily, locale, h.sku, h.title);
                items.push({
                    sku: h.sku,
                    title: h.title,
                    brandName: h.brand,
                    category: 'Granulių degikliai ir katilinės įranga',
                    priceGrossEur: h.priceGrossEur,
                    priceNetEur: Math.round((h.priceGrossEur / 1.21) * 100) / 100,
                    stockQuantity: 6,
                    warehouse: 'Eigulių g. 21, LT-51418 Kaunas',
                    cadEngineeringFamily: cadFamily,
                    cadSummary: {
                        standardRef: cadSpec.standardRef,
                        hydraulicRule: cadSpec.hydraulicRuleBanner,
                        calloutPins: cadSpec.callouts.map((c) => `[${c.pinNumber}] ${c.title}`),
                    },
                    compatibilityNote: 'Tinka katilinės modernizavimui',
                    productUrl: `https://gilesinzinerija.lt/${locale}/products?q=${encodeURIComponent(h.sku)}`,
                    oneClickCartUrl: `https://gilesinzinerija.lt/${locale}/krepselis?import_skus=${encodeURIComponent(h.sku)}:1`,
                });
                if (items.length >= limit) break;
            }
        }

        return {
            decision: 'ALLOWED',
            payload: {
                ok: true,
                accessTier: 'public_discovery',
                scope: 'public_read',
                authorityCitation: OPEN_AUTHORITY_CITATION,
                warehouse: 'Eigulių g. 21, LT-51418 Kaunas',
                totalCatalogSkus: snap.totalProducts || 6337,
                query: q || 'all',
                itemsCount: items.length,
                items,
            },
        };
    }

    if (toolName === 'public_hydronic_calculator_run') {
        const calcType = String(args.calculatorType || 'heat_loss').trim();
        const rawLocale = String(args.locale || 'lt').toLowerCase();
        const locale = ['lt', 'en', 'pl', 'ru'].includes(rawLocale) ? rawLocale : 'lt';
        const areaM2 = Number(args.areaM2 || 150);
        const powerKw = Number(args.powerKw || 18);
        const energyClass = (args.energyClass ? String(args.energyClass) : 'B') as EnergyClassId;
        const climateZone = (args.climateZone ? String(args.climateZone) : 'vidurio') as LtClimateZoneId;

        if (calcType === 'expansion_vessel') {
            const vesselOut = calculateExpansionVessel({
                systemPowerKw: powerKw,
                emitterType: 'panel_radiators',
                maxFlowTempC: '70',
                glycolPercent: 0,
                staticHeightM: Number(args.staticHeightM || 7),
                safetyValveBar: 3.0,
            });
            const recommendedSkus = [
                {
                    sku: 'STATICO-SD-35',
                    title: `Plėtimosi indas IMI Pneumatex Statico ${vesselOut.standardVesselLiters} L (PN6)`,
                    qty: 1,
                    priceGrossEur: 118,
                    productUrl: `https://gilesinzinerija.lt/${locale}/products?q=Statico`,
                },
                {
                    sku: 'ZEPARO-ZUKM-25',
                    title: 'Magnetinis šlamo ir oro separatorius IMI Pneumatex Zeparo DN25',
                    qty: 1,
                    priceGrossEur: 145,
                    productUrl: `https://gilesinzinerija.lt/${locale}/products?q=Zeparo`,
                },
            ];
            return {
                decision: 'ALLOWED',
                payload: {
                    ok: true,
                    accessTier: 'public_discovery',
                    calculatorType: calcType,
                    standardCitation: 'LST EN 12828 (Boyle-Mariotte plėtimosi indo lygtis)',
                    authorityCitation: OPEN_AUTHORITY_CITATION,
                    engineeringCalculation: vesselOut,
                    recommendedSkus,
                    preAssembledCartUrl: `https://gilesinzinerija.lt/${locale}/krepselis?import_skus=STATICO-SD-35:1,ZEPARO-ZUKM-25:1`,
                },
            };
        }

        if (calcType === 'buffer_tank') {
            const recommendedVolumeL = Math.max(200, Math.ceil((powerKw * 45) / 100) * 100);
            const recommendedSkus = [
                {
                    sku: 'ZV-100',
                    title: `Akumuliacinė talpa / kombinuotas šildytuvas Gorenje Tiki ZV (${recommendedVolumeL} L mazgui)`,
                    qty: 1,
                    priceGrossEur: 289,
                    productUrl: `https://gilesinzinerija.lt/${locale}/products?q=ZV+100`,
                },
                {
                    sku: 'TV-55C-DN25',
                    title: 'Termostatinis 55 °C antikondensacinis katilo pamaišymo vožtuvas DN25',
                    qty: 1,
                    priceGrossEur: 94,
                    productUrl: `https://gilesinzinerija.lt/${locale}/products?q=pamaisymo+voztuvas`,
                },
            ];
            return {
                decision: 'ALLOWED',
                payload: {
                    ok: true,
                    accessTier: 'public_discovery',
                    calculatorType: calcType,
                    standardCitation: 'LST EN 303-5 · V_buferio = 15 × T_deg × Q_nom × (1 − 0,3 × (Q_H / Q_min))',
                    authorityCitation: OPEN_AUTHORITY_CITATION,
                    engineeringCalculation: {
                        boilerNominalPowerKw: powerKw,
                        specificStorageLitersPerKw: 45,
                        recommendedBufferVolumeLiters: recommendedVolumeL,
                        minimumAnticondensationTempC: 55,
                    },
                    recommendedSkus,
                    preAssembledCartUrl: `https://gilesinzinerija.lt/${locale}/krepselis?import_skus=ZV-100:1,013G2990:2`,
                },
            };
        }

        if (calcType === 'pump_qh') {
            const valveOut = calculateHydraulicValve({
                branchPowerKw: powerKw,
                deltaTK: 15,
                targetDpKpa: 10,
            });
            const recommendedSkus = [
                {
                    sku: '082F1152',
                    title: 'Pavara Danfoss ABN-A5 230V 5mm NC su adapteriu AB-QM (VA41)',
                    qty: 1,
                    priceGrossEur: 49.49,
                    productUrl: `https://gilesinzinerija.lt/${locale}/products/pavara-abn-a5-230v-5mm-nc-su-adapteriu-ab-qm-va41-082f1152`,
                },
                {
                    sku: 'STAD-DN25',
                    title: `Balansinis vožtuvas IMI TA STAD ${valveOut.recommendedDn} (Kvs ≥ ${valveOut.requiredKv})`,
                    qty: 1,
                    priceGrossEur: 68.0,
                    productUrl: `https://gilesinzinerija.lt/${locale}/products?q=STAD`,
                },
            ];
            return {
                decision: 'ALLOWED',
                payload: {
                    ok: true,
                    accessTier: 'public_discovery',
                    calculatorType: calcType,
                    standardCitation: 'Darcy-Weisbach & Hidraulinė K_v / Δp lygtis (v ≤ 0,75 m/s)',
                    authorityCitation: OPEN_AUTHORITY_CITATION,
                    engineeringCalculation: valveOut,
                    recommendedSkus,
                    preAssembledCartUrl: `https://gilesinzinerija.lt/${locale}/krepselis?import_skus=082F1152:1,013G2990:2`,
                },
            };
        }

        if (calcType === 'radiator_sections') {
            const radCount = Number(args.radiatorCount || Math.max(4, Math.round(areaM2 / 18)));
            const radOut = calculateRadiatorNode({
                radiatorCount: radCount,
                connectionType: 'bottom_vk_50mm',
                controlType: 'afc_dynamic',
                headType: 'liquid_click_or_m30',
            });
            const recommendedSkus = [
                {
                    sku: 'POL./80-500',
                    title: 'Aliumininis radiatorius Ferroli POL 500 (PN16, 500 mm tarp ašių)',
                    qty: radCount * 10,
                    priceGrossEur: 13.03,
                    productUrl: `https://gilesinzinerija.lt/${locale}/products?q=POL.%2F80-500`,
                },
                {
                    sku: '013G2990',
                    title: 'Termostatinė galvutė Danfoss RA 2990 su dujiniu silfonu',
                    qty: radOut.headsCount,
                    priceGrossEur: 26.8,
                    productUrl: `https://gilesinzinerija.lt/${locale}/products?q=013G2990`,
                },
            ];
            return {
                decision: 'ALLOWED',
                payload: {
                    ok: true,
                    accessTier: 'public_discovery',
                    calculatorType: calcType,
                    standardCitation: 'LST EN 442 · Radiatorių mazgų ir Kvs / AFC balansavimo skaičiavimas',
                    authorityCitation: OPEN_AUTHORITY_CITATION,
                    engineeringCalculation: radOut,
                    recommendedSkus,
                    preAssembledCartUrl: `https://gilesinzinerija.lt/${locale}/krepselis?import_skus=POL./80-500:${radCount * 10},013G2990:${radOut.headsCount}`,
                },
            };
        }

        if (calcType === 'apva_subsidy') {
            const apvaOut = calculateApvaSubsidyEstimate({
                replacedBoilerType: 'fossil_coal_wood',
                newDeviceType: 'heat_pump_air_water',
                powerKw: Math.max(6, Math.min(25, powerKw)),
                devicePriceEur: 3490,
            });
            const recommendedSkus = [
                {
                    sku: apvaOut.recommendedSku || 'AW082HUGHA',
                    title: apvaOut.recommendedModelTitle,
                    qty: 1,
                    priceGrossEur: apvaOut.devicePriceEur,
                    productUrl: `https://gilesinzinerija.lt/${locale}/products?q=${encodeURIComponent(apvaOut.recommendedSku || 'AW082HUGHA')}`,
                },
            ];
            return {
                decision: 'ALLOWED',
                payload: {
                    ok: true,
                    accessTier: 'public_discovery',
                    calculatorType: calcType,
                    standardCitation: 'APVA / LEA valstybės paramos fiksuotų įkainių skaičiuoklė (EU 2015/1189 & 813/2013)',
                    authorityCitation: OPEN_AUTHORITY_CITATION,
                    engineeringCalculation: apvaOut,
                    recommendedSkus,
                    preAssembledCartUrl: `https://gilesinzinerija.lt/${locale}/krepselis?import_skus=${encodeURIComponent(apvaOut.recommendedSku || 'AW082HUGHA')}:1`,
                },
            };
        }

        // Default: heat_loss
        const heatLossOut = calculateBoilerAndHeatLoss({
            areaM2,
            energyClass,
            climateZone,
            indoorTempC: 21,
            ceilingHeightM: 2.7,
            ventilationType: 'rekuperacija_85',
            occupants: 4,
            dhwMode: 'boileris',
        });
        const recommendedSkus = [
            {
                sku: 'MPB-NANI-35',
                title: 'Granulių degiklio komplektas Megatherm MPB NANI 8–35 kW su sraigtu',
                qty: 1,
                priceGrossEur: 2350,
                productUrl: `https://gilesinzinerija.lt/${locale}/products?q=MPB-NANI-35`,
            },
            {
                sku: 'ZV-100',
                title: 'Kombinuotas vandens šildytuvas Gorenje Tiki ZV 100 L',
                qty: 1,
                priceGrossEur: 289,
                productUrl: `https://gilesinzinerija.lt/${locale}/products?q=ZV-100`,
            },
        ];
        return {
            decision: 'ALLOWED',
            payload: {
                ok: true,
                accessTier: 'public_discovery',
                calculatorType: 'heat_loss',
                standardCitation: 'LST EN 12831 / STR 2.01.02:2016 pastato projektinių šilumos nuostolių skaičiavimas',
                authorityCitation: OPEN_AUTHORITY_CITATION,
                engineeringCalculation: heatLossOut,
                recommendedSkus,
                preAssembledCartUrl: `https://gilesinzinerija.lt/${locale}/krepselis?import_skus=MPB-NANI-35:1,ZV-100:1`,
            },
        };
    }

    if (toolName === 'public_boiler_compatibility_lookup') {
        const rawModel = String(args.boilerModel || 'Viadrus U22').trim();
        const modelLower = rawModel.toLowerCase();
        const rawLocale = String(args.locale || 'lt').toLowerCase();
        const locale = ['lt', 'en', 'pl', 'ru'].includes(rawLocale) ? rawLocale : 'lt';

        const isHeatPump = modelLower.includes('haier') || modelLower.includes('r290') || modelLower.includes('r32');
        const isCandleBoiler = modelLower.includes('stropuva') || modelLower.includes('žvakė') || modelLower.includes('zvake');
        const isGasification = modelLower.includes('atmos') || modelLower.includes('vigass');

        const compatibleBurner = isHeatPump
            ? {
                  sku: 'AW082HUGHA',
                  title: 'Oras–vanduo šilumos siurblys Haier Super Aqua Monoblock R290 8–16 kW',
                  powerRangeKw: '8–16 kW (SCOP 4,85, tiekimas iki +75 °C)',
                  flangeMm: 'G 1" (DN25) hidraulinis monobloko prijungimas',
                  priceGrossEur: 3490,
                  productUrl: `https://gilesinzinerija.lt/${locale}/products?q=AW082HUGHA`,
              }
            : {
                  sku: 'MPB-NANI-35',
                  title: 'Granulių degiklio komplektas Megatherm MPB NANI 8–35 kW su judančiais ardeliais ir šneku',
                  powerRangeKw: '8–35 kW (5 klasė EN 303-5, EcoDesign)',
                  flangeMm: 'CNC P265GH flanšas Ø90–140 mm su keramine tarpine',
                  priceGrossEur: 2350,
                  productUrl: `https://gilesinzinerija.lt/${locale}/products?q=MPB-NANI-35`,
              };

        const doorConversionKit = {
            sku: 'CNC-FLANS-P265GH',
            title: isCandleBoiler
                ? `Apatinės pakuros CNC P265GH perėjimo flanšas katilui ${rawModel} su šamotine atrama`
                : isGasification
                  ? `Viršutinės kameros CNC P265GH durelių adapteris katilui ${rawModel} (be suvirinimo)`
                  : `Originalus CNC 6 mm P265GH durelių perėjimo komplektas katilui ${rawModel}`,
            steelSpec: '6 mm katilinis plienas P265GH + 1260 °C keraminė virvė',
            priceGrossEur: 145,
            productUrl: `https://gilesinzinerija.lt/${locale}/vedlys`,
        };

        const bufferTank = {
            sku: 'ZV-100',
            title: 'Akumuliacinė ir kombinuota vandens šildymo talpa Gorenje Tiki ZV 100–200 L',
            volumeLiters: 100,
            priceGrossEur: 289,
            productUrl: `https://gilesinzinerija.lt/${locale}/products?q=ZV-100`,
        };

        const safetyGroup = {
            sku: 'STATICO-ZEPARO-KIT',
            title: 'EN 12828 katilinės saugos grupė (3 bar) + IMI Pneumatex Statico indas + Zeparo magnetas',
            standard: 'LST EN 12828 · PN6 / 3,0 bar',
            priceGrossEur: 168,
            productUrl: `https://gilesinzinerija.lt/${locale}/products?q=Pneumatex`,
        };

        const spareParts = [
            {
                sku: 'TENAS-KER-300W',
                title: 'Keraminis uždegimo tenas 300W (1050 °C, 60 s uždegimas)',
                priceGrossEur: 38,
                productUrl: `https://gilesinzinerija.lt/${locale}/products?q=tenas`,
            },
            {
                sku: 'ARDELIAI-MPB-CRNI',
                title: 'Karščiui atsparūs judantys ardeliai 1.4841 (iki 1150 °C)',
                priceGrossEur: 64,
                productUrl: `https://gilesinzinerija.lt/${locale}/products?q=ardeliai`,
            },
            {
                sku: '082F1152',
                title: 'Pavara Danfoss ABN-A5 230V 5mm NC su adapteriu AB-QM (VA41)',
                priceGrossEur: 49.49,
                productUrl: `https://gilesinzinerija.lt/${locale}/products/pavara-abn-a5-230v-5mm-nc-su-adapteriu-ab-qm-va41-082f1152`,
            },
        ];

        return {
            decision: 'ALLOWED',
            payload: {
                ok: true,
                accessTier: 'public_discovery',
                scope: 'public_read',
                boilerModel: rawModel,
                authorityCitation: OPEN_AUTHORITY_CITATION,
                warehouse: 'Eigulių g. 21, LT-51418 Kaunas',
                engineeringVerdict: `${rawModel} pilnai suderinamas su UAB „Gilės inžinerija“ modernizavimo ir hidrauliniu mazgu (visi komponentai ir atsarginės dalys palaikomi Kauno sandėlyje).`,
                compatibleBurner,
                doorConversionKit,
                bufferTank,
                safetyGroup,
                spareParts,
                preAssembledCartUrl: `https://gilesinzinerija.lt/${locale}/krepselis?import_skus=${encodeURIComponent(compatibleBurner.sku)}:1,ZV-100:1,082F1152:1`,
            },
        };
    }

    if (toolName === 'admin_ai_agents_manage') {
        const op = String(args.op || 'list_agents_and_logs');

        if (op === 'list_agents_and_logs') {
            const agents = getAiAgentsList();
            const allLogs = getAiAgentLogs('all');
            const answeredLogs = getAiAgentLogs('vytautas_answered');
            const unansweredLogs = getAiAgentLogs('unanswered');
            const appliedActions = getAiAgentLogs('pricing_inventory');
            return {
                decision: 'ALLOWED',
                payload: {
                    ok: true,
                    op,
                    totalAgents: agents.length,
                    agents,
                    logs: {
                        all: allLogs,
                        answered: answeredLogs,
                        unanswered: unansweredLogs,
                        applied_actions: appliedActions,
                    },
                },
            };
        }

        if (op === 'toggle_agent') {
            const agentId = String(args.agentId || 'vytautas-consultant').trim();
            const rawMode = args.executionMode ? String(args.executionMode) : undefined;
            const validMode =
                rawMode === 'autonomous' || rawMode === 'proposal_only' || rawMode === 'disabled'
                    ? (rawMode as AiAgentExecutionMode)
                    : undefined;
            const updated = toggleAiAgentExecutionMode(agentId, validMode);
            if (!updated) {
                return {
                    decision: 'ALLOWED',
                    payload: { ok: false, error: `Agent not found: ${agentId}` },
                };
            }
            return {
                decision: 'ALLOWED',
                payload: {
                    ok: true,
                    op,
                    agent: updated,
                },
            };
        }

        if (op === 'update_agent_config' || op === 'register_byo_agent') {
            const agentId = args.id
                ? String(args.id).trim()
                : args.agentId
                  ? String(args.agentId).trim()
                  : undefined;
            const existing = agentId
                ? getAiAgentsList().find((a) => a.id === agentId || a.slug === agentId)
                : undefined;
            const rawMode = args.executionMode ? String(args.executionMode) : undefined;
            const validMode =
                rawMode === 'autonomous' || rawMode === 'proposal_only' || rawMode === 'disabled'
                    ? (rawMode as AiAgentExecutionMode)
                    : existing?.executionMode;

            const updated = addOrUpdateAiAgent({
                id: existing?.id || agentId,
                name: args.name ? String(args.name) : existing?.name || agentId || 'BYO AI Agentas',
                role: args.role ? String(args.role) : existing?.role,
                description: args.description ? String(args.description) : existing?.description,
                provider: (args.provider ? String(args.provider) : existing?.provider) as
                    | AiAgentProvider
                    | undefined,
                apiEndpointUrl: args.apiEndpointUrl
                    ? String(args.apiEndpointUrl)
                    : existing?.apiEndpointUrl,
                apiKey: args.apiKey ? String(args.apiKey) : undefined,
                modelId: args.modelId ? String(args.modelId) : existing?.modelId,
                temperature:
                    args.temperature != null ? Number(args.temperature) : existing?.temperature,
                executionMode: validMode,
                allowedMcpScopes: Array.isArray(args.allowedMcpScopes)
                    ? args.allowedMcpScopes.map(String)
                    : existing?.allowedMcpScopes,
                guardrailMinMarginPct:
                    args.guardrailMinMarginPct != null
                        ? Math.max(15, Number(args.guardrailMinMarginPct))
                        : existing?.guardrailMinMarginPct,
                systemPrompt: args.systemPrompt
                    ? String(args.systemPrompt)
                    : existing?.systemPrompt,
                instructionsSummary: args.instructionsSummary
                    ? String(args.instructionsSummary)
                    : existing?.instructionsSummary,
                instructionsSteps: Array.isArray(args.instructionsSteps)
                    ? args.instructionsSteps.map(String)
                    : existing?.instructionsSteps,
            });
            return {
                decision: 'ALLOWED',
                payload: {
                    ok: true,
                    op,
                    agent: updated,
                },
            };
        }

        if (op === 'run_agent_now') {
            const agentId = String(args.agentId || 'vytautas-consultant').trim();
            const runResult = runAiAgentDiagnosticCheck(agentId);
            return {
                decision: 'ALLOWED',
                payload: {
                    ok: true,
                    op,
                    agent: runResult.agent,
                    logEntry: runResult.logEntry,
                },
            };
        }

        if (op === 'resolve_log_entry') {
            const logId = String(args.logId || 'LOG-1002').trim();
            const engineerReply = String(
                args.engineerReply || args.note || 'Išspręsta inžinieriaus Dariaus Šauklio.',
            ).trim();
            const resolvedBy = args.resolvedBy
                ? String(args.resolvedBy)
                : `Darius Šauklys (${caller.actor})`;
            const entry = resolveAiAgentLogEntry({
                logId,
                engineerReply,
                resolvedBy,
            });
            return {
                decision: 'ALLOWED',
                payload: {
                    ok: Boolean(entry),
                    op,
                    logEntry: entry,
                },
            };
        }

        return {
            decision: 'ALLOWED',
            payload: { ok: false, error: `Unsupported admin_ai_agents_manage op: ${op}` },
        };
    }

    if (toolName === 'admin_suppliers_pricelist_manage') {
        const op = String(args.op || 'list_suppliers');

        if (op === 'list_suppliers') {
            const suppliers = getSuppliersList();
            return {
                decision: 'ALLOWED',
                payload: {
                    ok: true,
                    op,
                    totalSuppliers: suppliers.length,
                    suppliers,
                },
            };
        }

        if (op === 'upsert_supplier') {
            const supplier = addOrUpdateSupplier({
                id: args.id ? String(args.id) : args.supplierId ? String(args.supplierId) : undefined,
                name: String(args.name || args.id || 'Naujas tiekėjas'),
                country: args.country ? String(args.country) : undefined,
                contactEmail: args.contactEmail ? String(args.contactEmail) : undefined,
                currency: args.currency ? String(args.currency) : undefined,
                dealerDiscountPct:
                    args.dealerDiscountPct != null ? Number(args.dealerDiscountPct) : undefined,
                targetMarginPct:
                    args.targetMarginPct != null
                        ? Math.max(15, Number(args.targetMarginPct))
                        : undefined,
                leadTimeDays: args.leadTimeDays ? String(args.leadTimeDays) : undefined,
                skuPrefix: args.skuPrefix ? String(args.skuPrefix) : undefined,
                feedFormat: args.feedFormat ? String(args.feedFormat) : undefined,
                feedUrlOrNote: args.feedUrlOrNote ? String(args.feedUrlOrNote) : undefined,
                sourceFile: args.sourceFile ? String(args.sourceFile) : undefined,
                enabled: typeof args.enabled === 'boolean' ? args.enabled : undefined,
            });
            return {
                decision: 'ALLOWED',
                payload: {
                    ok: true,
                    op,
                    supplier,
                },
            };
        }

        if (op === 'import_pricelist_rows') {
            const supplierId = String(args.supplierId || args.id || 'danfoss').trim();
            const rawRows = Array.isArray(args.rows)
                ? (args.rows as Array<Record<string, unknown>>).map((r) => ({
                      sku: String(r.sku || '').trim(),
                      name: String(r.name || r.title || r.sku || '').trim(),
                      basePriceEur: Number(r.basePriceEur ?? r.price ?? 100),
                      stockQuantity:
                          r.stockQuantity != null || r.stock != null
                              ? Number(r.stockQuantity ?? r.stock)
                              : 10,
                      category: r.category ? String(r.category) : undefined,
                      ean: r.ean ? String(r.ean) : undefined,
                  }))
                : undefined;

            const result = importSupplierPricelistRows({
                supplierId,
                rawText: args.rawText ? String(args.rawText) : undefined,
                rows: rawRows,
            });
            return {
                decision: 'ALLOWED',
                payload: {
                    ok: true,
                    op,
                    supplier: result.supplier,
                    importedCount: result.importedCount,
                    items: result.items,
                    minMarginFloorPct: 15,
                },
            };
        }

        return {
            decision: 'ALLOWED',
            payload: { ok: false, error: `Unsupported admin_suppliers_pricelist_manage op: ${op}` },
        };
    }

    if (toolName === 'products_full_crud_manage') {
        const op = String(args.op || 'upsert_product_full');

        if (op === 'upsert_product_full') {
            const sku = String(args.sku || '').trim();
            if (!sku) {
                return {
                    decision: 'ALLOWED',
                    payload: { ok: false, error: 'sku is required for upsert_product_full' },
                };
            }
            const normSku = normalizeCode(sku);
            const title =
                args.title != null
                    ? String(args.title)
                    : args.name != null
                      ? String(args.name)
                      : undefined;
            const description =
                args.description != null
                    ? String(args.description)
                    : args.descriptionLt != null
                      ? String(args.descriptionLt)
                      : undefined;
            const brand =
                args.brand != null
                    ? String(args.brand)
                    : args.brandName != null
                      ? String(args.brandName)
                      : undefined;
            const category = args.category != null ? String(args.category) : undefined;
            const subcategory = args.subcategory != null ? String(args.subcategory) : undefined;
            const price =
                args.price != null
                    ? Number(args.price)
                    : args.priceGrossEur != null
                      ? Number(args.priceGrossEur)
                      : undefined;
            const costEur =
                args.costEur != null
                    ? Number(args.costEur)
                    : args.costPriceEur != null
                      ? Number(args.costPriceEur)
                      : undefined;
            const promoPriceEur =
                args.promoPriceEur != null ? Number(args.promoPriceEur) : undefined;
            const stock =
                args.stock != null
                    ? Number(args.stock)
                    : args.stockQuantity != null
                      ? Number(args.stockQuantity)
                      : undefined;
            const inStock = typeof args.inStock === 'boolean' ? args.inStock : undefined;
            const published =
                typeof args.published === 'boolean'
                    ? args.published
                    : typeof args.active === 'boolean'
                      ? args.active
                      : undefined;
            const weightKg = args.weightKg != null ? Number(args.weightKg) : undefined;
            const deliveryClass =
                args.deliveryClass != null ? String(args.deliveryClass) : undefined;
            const apvaEligible =
                typeof args.apvaEligible === 'boolean' ? args.apvaEligible : undefined;
            const compatibleBoilers = Array.isArray(args.compatibleBoilers)
                ? args.compatibleBoilers.map(String)
                : Array.isArray(args.boilerCompatibilityTags)
                  ? args.boilerCompatibilityTags.map(String)
                  : undefined;
            const kitContents = Array.isArray(args.kitContents)
                ? args.kitContents.map(String)
                : undefined;
            const compatibilityNote =
                args.compatibilityNote != null ? String(args.compatibilityNote) : undefined;
            const specs =
                args.specs && typeof args.specs === 'object' && !Array.isArray(args.specs)
                    ? Object.fromEntries(
                          Object.entries(args.specs as Record<string, unknown>).map(([k, v]) => [
                              String(k),
                              String(v ?? ''),
                          ]),
                      )
                    : undefined;
            const image =
                args.image != null
                    ? String(args.image)
                    : args.imageUrl != null
                      ? String(args.imageUrl)
                      : undefined;

            const override = upsertCatalogProductOverride({
                sku,
                ...(title !== undefined ? { title, name: title } : {}),
                ...(description !== undefined ? { description, descriptionLt: description } : {}),
                ...(brand !== undefined ? { brand, brandName: brand } : {}),
                ...(category !== undefined ? { category } : {}),
                ...(subcategory !== undefined ? { subcategory } : {}),
                ...(price !== undefined ? { price, priceGrossEur: price } : {}),
                ...(costEur !== undefined ? { costEur, costPriceEur: costEur } : {}),
                ...(promoPriceEur !== undefined ? { promoPriceEur } : {}),
                ...(stock !== undefined ? { stock, stockQuantity: stock } : {}),
                ...(inStock !== undefined ? { inStock } : {}),
                ...(published !== undefined ? { published, active: published } : {}),
                ...(weightKg !== undefined ? { weightKg } : {}),
                ...(deliveryClass !== undefined ? { deliveryClass } : {}),
                ...(apvaEligible !== undefined ? { apvaEligible } : {}),
                ...(compatibleBoilers !== undefined
                    ? { compatibleBoilers, boilerCompatibilityTags: compatibleBoilers }
                    : {}),
                ...(kitContents !== undefined ? { kitContents } : {}),
                ...(compatibilityNote !== undefined ? { compatibilityNote } : {}),
                ...(specs !== undefined ? { specs } : {}),
                ...(image !== undefined ? { image, imageUrl: image } : {}),
            });

            // Ensure new custom SKU is also registered in customProducts if not in base snapshot
            const snapCheck = getGilesCatalogSnapshot();
            if (!snapCheck.bySkuNormalized.has(normSku)) {
                const currentStore = readCatalogOverrides();
                const filteredCustom = currentStore.customProducts.filter(
                    (cp) => normalizeCode(cp.sku) !== normSku,
                );
                const newCustom: CustomCatalogProductRecord = {
                    id: `custom-${normSku}`,
                    sku,
                    ean: String(args.ean || '4770001002027'),
                    name: override.name || title || sku,
                    brandName: override.brandName || brand || 'Gilės Inžinerija',
                    category: override.category || category || 'Katilinės įranga',
                    priceGrossEur: override.priceGrossEur ?? price ?? 120,
                    costPriceEur: override.costPriceEur ?? costEur ?? 75,
                    stockQuantity: override.stockQuantity ?? stock ?? 10,
                    published: override.published !== false,
                    description:
                        override.description ||
                        description ||
                        `${override.name || sku} – UAB „Gilės inžinerija“ katalogo pozicija.`,
                    imageUrl:
                        override.imageUrl ||
                        image ||
                        '/images/products/giles-studio-01-mpb-nani-35-50.webp',
                    createdAt: new Date().toISOString(),
                };
                saveCatalogOverrides({
                    ...currentStore,
                    customProducts: [newCustom, ...filteredCustom],
                });
            }

            clearCatalogListingCache();
            const liveProduct = findGilesSnapshotProductBySlugOrId(sku);
            return {
                decision: 'ALLOWED',
                payload: {
                    ok: true,
                    op,
                    sku,
                    override,
                    liveProduct,
                },
            };
        }

        if (op === 'toggle_product_visibility') {
            const sku = String(args.sku || '').trim();
            if (!sku) {
                return {
                    decision: 'ALLOWED',
                    payload: { ok: false, error: 'sku is required for toggle_product_visibility' },
                };
            }
            const published = args.published !== undefined ? Boolean(args.published) : false;
            const override = upsertCatalogProductOverride({
                sku,
                published,
                active: published,
            });
            clearCatalogListingCache();
            return {
                decision: 'ALLOWED',
                payload: {
                    ok: true,
                    op,
                    sku,
                    published,
                    override,
                },
            };
        }

        if (op === 'bulk_brand_or_category_price_adjust') {
            const brandRaw = String(args.brand || args.brandSlug || args.category || 'all').trim();
            const brandSlug = toBrandSlug(brandRaw);
            const deltaPct = Number(args.deltaPct ?? args.value ?? 0);
            const minMarginFloorPct = Math.max(15, Number(policy?.minMarginFloorPct ?? 15));

            const currentStore = readCatalogOverrides();
            const nextBrandRules = {
                ...currentStore.brandRules,
                [brandSlug]: {
                    brandSlug,
                    mode: 'percent_adjust' as const,
                    value: deltaPct,
                    updatedAt: new Date().toISOString(),
                },
            };
            saveCatalogOverrides({
                ...currentStore,
                brandRules: nextBrandRules,
            });
            clearCatalogListingCache();
            const refreshedSnap = getGilesCatalogSnapshot();
            return {
                decision: 'ALLOWED',
                payload: {
                    ok: true,
                    op,
                    brandSlug,
                    deltaPct,
                    minMarginFloorPct,
                    rule: nextBrandRules[brandSlug],
                    totalCatalogProducts: refreshedSnap.totalProducts,
                },
            };
        }

        return {
            decision: 'ALLOWED',
            payload: { ok: false, error: `Unsupported products_full_crud_manage op: ${op}` },
        };
    }

    return { decision: 'ALLOWED', payload: { ok: false, error: `Unknown tool: ${toolName}` } };
}
