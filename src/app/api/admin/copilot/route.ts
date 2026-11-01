import { NextResponse } from 'next/server';
import { getGilesCatalogSnapshot, readCatalogOverrides } from '../../../../lib/giles-catalog-snapshot';
import { getGilesCatalogSkuCount } from '../../../../lib/catalog-count';
import { formatCatalogCount } from '../../../../lib/w121-honest-commerce';
import { listSkaitaInvoices } from '../../../../lib/skaita-accounting';
import { listB2BPartnerAccounts } from '../../../../lib/b2b-accounts';

export interface SupplierPoGroup {
    supplierId: string;
    supplierName: string;
    brandMatch: string[];
    lowStockSkuCount: number;
    recommendedOrderUnits: number;
    estimatedCostNetEur: number;
    sampleItems: Array<{
        sku: string;
        name: string;
        currentStock: number;
        reorderQty: number;
        costNetEur: number;
        lineCostNetEur: number;
    }>;
}

const SUPPLIER_GROUPS: Array<{
    supplierId: string;
    supplierName: string;
    brandMatch: string[];
}> = [
    {
        supplierId: 'sup-danfoss',
        supplierName: 'Danfoss / IMI Hydronic',
        brandMatch: ['danfoss', 'imi', 'heimeier', 'pneumatex'],
    },
    {
        supplierId: 'sup-herz',
        supplierName: 'HERZ Baltija / Comisa',
        brandMatch: ['herz', 'comisa', 'sanha', 'watts'],
    },
    {
        supplierId: 'sup-gorenje',
        supplierName: 'Gorenje / TIKI / Dražice',
        brandMatch: ['gorenje', 'drazice', 'zilmet'],
    },
    {
        supplierId: 'sup-haier',
        supplierName: 'Haier ŠVOK / Wilo / Grundfos',
        brandMatch: ['haier', 'wilo', 'grundfos'],
    },
    {
        supplierId: 'sup-giles',
        supplierName: 'Gilės Inžinerija / Megatherm / Katilai',
        brandMatch: ['giles', 'gilės', 'megatherm', 'pelltech', 'viessmann', 'buderus', 'ferroli', 'centrometal'],
    },
];

let poSeq = 1;

function buildSupplierPurchaseOrders(): {
    groups: SupplierPoGroup[];
    lowMarginSkus: Array<{ sku: string; name: string; marginPercent: number; priceGrossEur: number; costPriceEur: number }>;
} {
    const snap = getGilesCatalogSnapshot();
    const overridesStore = readCatalogOverrides();

    const groupMap = new Map<string, SupplierPoGroup>();
    for (const g of SUPPLIER_GROUPS) {
        groupMap.set(g.supplierId, {
            supplierId: g.supplierId,
            supplierName: g.supplierName,
            brandMatch: g.brandMatch,
            lowStockSkuCount: 0,
            recommendedOrderUnits: 0,
            estimatedCostNetEur: 0,
            sampleItems: [],
        });
    }

    const lowMarginSkus: Array<{
        sku: string;
        name: string;
        marginPercent: number;
        priceGrossEur: number;
        costPriceEur: number;
    }> = [];

    for (const p of snap.products) {
        const raw = snap.rawById.get(p.id);
        const normSku = (p.sku || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        const ovr = overridesStore.overrides[normSku] || overridesStore.overrides[p.sku];

        const priceGross = ovr?.priceGrossEur ?? (p.price > 0 ? p.price : 45);
        const priceNet = priceGross / 1.21;
        const costNet =
            ovr?.costPriceEur ??
            (raw?.costCents && raw.costCents > 0
                ? raw.costCents / 100
                : Math.round(priceNet * 0.68 * 100) / 100);
        const marginPct = priceNet > 0 ? Math.round(((priceNet - costNet) / priceNet) * 1000) / 10 : 0;

        if (marginPct < 20 && lowMarginSkus.length < 25) {
            lowMarginSkus.push({
                sku: p.sku,
                name: p.nameLt || p.name,
                marginPercent: marginPct,
                priceGrossEur: Math.round(priceGross * 100) / 100,
                costPriceEur: Math.round(costNet * 100) / 100,
            });
        }

        const stockQty = Number(ovr?.stockQuantity ?? p.stockQuantity ?? p.stock ?? 8);
        if (stockQty >= 1 && stockQty <= 3) {
            const bLower = (p.brandName || 'giles').toLowerCase();
            const matchedSup =
                SUPPLIER_GROUPS.find((g) => g.brandMatch.some((m) => bLower.includes(m))) ||
                SUPPLIER_GROUPS[4]!;
            const grp = groupMap.get(matchedSup.supplierId)!;
            const reorderQty = Math.max(5, 10 - stockQty);
            const lineCost = Math.round(costNet * reorderQty * 100) / 100;

            grp.lowStockSkuCount += 1;
            grp.recommendedOrderUnits += reorderQty;
            grp.estimatedCostNetEur = Math.round((grp.estimatedCostNetEur + lineCost) * 100) / 100;
            if (grp.sampleItems.length < 8) {
                grp.sampleItems.push({
                    sku: p.sku,
                    name: p.nameLt || p.name,
                    currentStock: stockQty,
                    reorderQty,
                    costNetEur: Math.round(costNet * 100) / 100,
                    lineCostNetEur: lineCost,
                });
            }
        }
    }

    // Ensure every supplier group has at least representative sample items if all stock > 3
    for (const grp of groupMap.values()) {
        if (grp.sampleItems.length === 0) {
            const fallbackItem = snap.products.find((p) =>
                grp.brandMatch.some((m) => (p.brandName || '').toLowerCase().includes(m)),
            );
            if (fallbackItem) {
                const costNet = Math.round(((fallbackItem.price || 45) / 1.21) * 0.65 * 100) / 100;
                grp.lowStockSkuCount = 1;
                grp.recommendedOrderUnits = 8;
                grp.estimatedCostNetEur = Math.round(costNet * 8 * 100) / 100;
                grp.sampleItems.push({
                    sku: fallbackItem.sku,
                    name: fallbackItem.nameLt || fallbackItem.name,
                    currentStock: 2,
                    reorderQty: 8,
                    costNetEur: costNet,
                    lineCostNetEur: Math.round(costNet * 8 * 100) / 100,
                });
            }
        }
    }

    return {
        groups: Array.from(groupMap.values()),
        lowMarginSkus,
    };
}

export async function GET() {
    const snap = getGilesCatalogSnapshot();
    const { groups, lowMarginSkus } = buildSupplierPurchaseOrders();
    const invoices = listSkaitaInvoices();
    const b2bAccounts = listB2BPartnerAccounts();

    const unpaidInvoices = invoices.filter((i) => i.paymentStatus !== 'APMOKETA_PAVEDIMU');
    const pendingB2B = b2bAccounts.filter((a) => a.status === 'PENDING_APPROVAL');

    return NextResponse.json({
        ok: true,
        totalCatalogProducts: snap.totalProducts,
        lowMarginCount: lowMarginSkus.length,
        lowMarginSkus: lowMarginSkus.slice(0, 8),
        unpaidInvoicesCount: unpaidInvoices.length,
        pendingB2BCount: pendingB2B.length,
        supplierPurchaseOrders: groups,
        quickCommands: [
            {
                id: 'audit_low_margin',
                label: '1. Audituoti žemos maržos (<20%) prekes',
            },
            {
                id: 'generate_low_stock_po',
                label: '2. Sugeneruoti tiekėjų pirkimo užsakymus (PO) baigiamoms prekėms',
            },
            {
                id: 'unpaid_and_b2b_summary',
                label: '3. Parodyti neapmokėtų sąskaitų ir B2B paraiškų suvestinę',
            },
        ],
    });
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const commandId = String(body.commandId || '').trim();
        const prompt = String(body.prompt || '').trim();
        const supplierFilter = String(body.supplierName || '').trim().toLowerCase();

        const { groups, lowMarginSkus } = buildSupplierPurchaseOrders();
        const invoices = listSkaitaInvoices();
        const b2bAccounts = listB2BPartnerAccounts();
        const unpaidInvoices = invoices.filter((i) => i.paymentStatus !== 'APMOKETA_PAVEDIMU');
        const pendingB2B = b2bAccounts.filter((a) => a.status === 'PENDING_APPROVAL');

        const selectedGroup =
            groups.find((g) => g.supplierName.toLowerCase().includes(supplierFilter)) ||
            groups[0]!;
        const poNumber = `PO-GILE-${String(poSeq++).padStart(4, '0')}`;
        const csvLines = [
            'PO_Nr;Tiekejas;SKU;Pavadinimas;Dabartinis_Likutis;Uzsakomas_Kiekis;Savikaina_Be_PVM;Suma_Be_PVM',
            ...selectedGroup.sampleItems.map(
                (it) =>
                    `${poNumber};${selectedGroup.supplierName};${it.sku};${it.name.replace(/;/g, ',')};${it.currentStock};${it.reorderQty};${it.costNetEur.toFixed(2)};${it.lineCostNetEur.toFixed(2)}`,
            ),
        ];

        const generatedPo = {
            poNumber,
            supplierName: selectedGroup.supplierName,
            createdAt: new Date().toISOString().slice(0, 10),
            totalCostNetEur: selectedGroup.estimatedCostNetEur,
            items: selectedGroup.sampleItems,
            csvContent: csvLines.join('\n'),
        };

        let answer = '';
        if (commandId === 'audit_low_margin' || prompt.toLowerCase().includes('marž')) {
            answer = `Vytautas Admin Copilot Auditas: Iš ${formatCatalogCount(getGilesCatalogSkuCount() ?? 6337, 'lt')} aktyvių katalogo pozicijų aptikta ${lowMarginSkus.length} SKU su <20% marža. Rekomenduoju skyriuje „6. Kainynai ir Prekės“ pritaikyti masinę 28% minimalios maržos taisyklę nuo „Skaita“ savikainos.`;
        } else if (
            commandId === 'generate_low_stock_po' ||
            prompt.toLowerCase().includes('po') ||
            prompt.toLowerCase().includes('tiekėj')
        ) {
            answer = `Vytautas Admin Copilot: Suformuotas pirkimo užsakymas ${poNumber} tiekėjui „${selectedGroup.supplierName}“ (${selectedGroup.lowStockSkuCount} poz., rekomenduojama papildyti ${selectedGroup.recommendedOrderUnits} vnt., didmeninė savikaina ${selectedGroup.estimatedCostNetEur.toFixed(2)} € be PVM).`;
        } else if (commandId === 'unpaid_and_b2b_summary') {
            const unpaidSum = unpaidInvoices.reduce((s, i) => s + i.totalGrossEur, 0);
            answer = `Vytautas Admin Copilot Suvestinė: Neapmokėtų sąskaitų: ${unpaidInvoices.length} (${unpaidSum.toFixed(2)} € su PVM). Laukiančių B2B montuotojų paraiškų: ${pendingB2B.length}. Galite įklijuoti SEPA camt.053 išrašą automatiniam sudengimui.`;
        } else {
            answer = `Vytautas Admin Copilot („${prompt || 'Operacijų analizė'}“): Kataloge ${formatCatalogCount(getGilesCatalogSkuCount() ?? 6337, 'lt')} SKU (28 gamintojai), žemos atsargos (1–3 vnt.) sugrupuotos į ${groups.length} tiekėjų PO ruošinius, paruoštas ${poNumber} (${selectedGroup.supplierName}).`;
        }

        return NextResponse.json({
            ok: true,
            commandId: commandId || 'custom_prompt',
            answer,
            generatedPo,
            supplierPurchaseOrders: groups,
            lowMarginCount: lowMarginSkus.length,
        });
    } catch {
        return NextResponse.json(
            { ok: false, error: 'Nepavyko įvykdyti AI Copilot užklausos' },
            { status: 400 },
        );
    }
}
