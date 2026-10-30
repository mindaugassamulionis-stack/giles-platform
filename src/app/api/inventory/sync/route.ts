import { NextResponse } from 'next/server';
import {
    getGilesCatalogSnapshot,
    type GilesStockSource,
} from '../../../../lib/giles-catalog-snapshot';

export interface InventorySyncRowInput {
    sku: string;
    stockQuantity?: number;
    stock?: number;
    qty?: number;
    stockUnit?: string;
    stockSource?: GilesStockSource | string;
    costNetEur?: number;
    retailGrossEur?: number;
}

function buildSourceBreakdown() {
    const snap = getGilesCatalogSnapshot();
    const breakdownBySource: Record<
        string,
        { productCount: number; totalUnits: number }
    > = {
        'Skaita SQL · Kauno sandėlis (Eigulių g. 21, LT-51418 Kaunas)': {
            productCount: 0,
            totalUnits: 0,
        },
        'EGIP.lt PrestaShop bazė': {
            productCount: 0,
            totalUnits: 0,
        },
        'Gamybos sandėlis Kaune': {
            productCount: 0,
            totalUnits: 0,
        },
        'Tiekėjo centrinis sandėlis (2–4 d. d.)': {
            productCount: 0,
            totalUnits: 0,
        },
    };

    let totalPhysicalUnitsKaunas = 0;
    let totalSupplierUnits = 0;

    for (const p of snap.products) {
        const src =
            p.stockSource || 'Skaita SQL · Kauno sandėlis (Eigulių g. 21, LT-51418 Kaunas)';
        const qty = p.stockQuantity ?? p.stock ?? 0;
        if (!breakdownBySource[src]) {
            breakdownBySource[src] = { productCount: 0, totalUnits: 0 };
        }
        breakdownBySource[src]!.productCount += 1;
        breakdownBySource[src]!.totalUnits += qty;

        if (src.includes('Tiekėjo')) {
            totalSupplierUnits += qty;
        } else {
            totalPhysicalUnitsKaunas += qty;
        }
    }

    const egipLiveInventory = snap.products
        .filter((p) => (p.stockSource || '').includes('EGIP.lt'))
        .map((p) => ({
            sku: p.sku,
            title: p.nameLt || p.name,
            stockQuantity: p.stockQuantity ?? p.stock ?? 0,
            stockUnit: p.stockUnit || 'vnt.',
            stockSource: p.stockSource,
            priceEur: p.price,
        }));

    return {
        totalProducts: snap.products.length,
        lastSyncedAt: snap.generatedAt,
        warehousePrimary: 'Eigulių g. 21, LT-51418 Kaunas (UAB „Gilės inžinerija“)',
        totalPhysicalUnitsKaunas,
        totalSupplierUnits,
        breakdownBySource,
        egipLiveInventory,
    };
}

function parseSkaitaStockCsv(csvText: string): InventorySyncRowInput[] {
    const lines = csvText
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean);
    if (lines.length === 0) return [];

    const out: InventorySyncRowInput[] = [];
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i]!;
        const sep = line.includes(';') ? ';' : ',';
        const cols = line.split(sep).map((c) => c.trim().replace(/^"|"$/g, ''));
        if (cols.length < 2) continue;
        if (
            i === 0 &&
            /kodas|sku|preke|likutis|kiekis/i.test(cols[0]! + ' ' + cols[1]!)
        ) {
            continue;
        }
        const sku = cols[0]!;
        const qtyNum = Number.parseFloat((cols[1] || '0').replace(',', '.'));
        if (!sku || Number.isNaN(qtyNum)) continue;
        out.push({
            sku,
            stockQuantity: Math.max(0, Math.round(qtyNum)),
            stockUnit: cols[2] || 'vnt.',
            stockSource:
                cols[3] || 'Skaita SQL · Kauno sandėlis (Eigulių g. 21, LT-51418 Kaunas)',
        });
    }
    return out;
}

export async function GET() {
    const summary = buildSourceBreakdown();
    const snap = getGilesCatalogSnapshot();

    return NextResponse.json({
        ok: true,
        ...summary,
        architecture: {
            erpPrimary:
                'Prototechnika „Skaita“ SQL („Faktiniai vertybių likučiai“ Excel/CSV/JSON tiltas)',
            prestaShopSync:
                'bumslangis.serveriai.lt (79.98.29.20) · gilesinz_presta ps_stock_available (EGIP.lt)',
            wooCommerceSync:
                'bumslangis.serveriai.lt (79.98.29.20) · gilesinz_wp1 / vernerkatilai.lt / ponast.lt',
        },
        sampleItems: snap.products.slice(0, 12).map((p) => ({
            id: p.id,
            sku: p.sku,
            title: p.nameLt || p.name,
            brandName: p.brandName,
            stockQuantity: p.stockQuantity ?? p.stock ?? 0,
            stockUnit: p.stockUnit || 'vnt.',
            stockSource: p.stockSource,
            lastSyncedAt: p.lastSyncedAt,
        })),
    });
}

export async function POST(req: Request) {
    try {
        const body = await req.json().catch(() => ({}));
        const snap = getGilesCatalogSnapshot();
        const syncedAt = new Date().toISOString();
        const defaultSource: string =
            typeof body.source === 'string' && body.source.trim()
                ? body.source.trim()
                : 'Skaita SQL · Kauno sandėlis (Eigulių g. 21, LT-51418 Kaunas)';

        let incomingRows: InventorySyncRowInput[] = [];
        if (Array.isArray(body.rows) && body.rows.length > 0) {
            incomingRows = body.rows;
        } else if (typeof body.csv === 'string' && body.csv.trim()) {
            incomingRows = parseSkaitaStockCsv(body.csv);
        } else {
            incomingRows = [
                {
                    sku: '013G2990',
                    stockQuantity: 48,
                    stockUnit: 'vnt.',
                    stockSource: 'Skaita SQL · Kauno sandėlis (Eigulių g. 21, LT-51418 Kaunas)',
                },
                {
                    sku: 'KatM39833425',
                    stockQuantity: 36,
                    stockUnit: 'vnt.',
                    stockSource: 'EGIP.lt PrestaShop bazė',
                },
                {
                    sku: 'MPB-NANI-35',
                    stockQuantity: 6,
                    stockUnit: 'vnt.',
                    stockSource: 'Gamybos sandėlis Kaune',
                },
                {
                    sku: 'ZV 100',
                    stockQuantity: 12,
                    stockUnit: 'vnt.',
                    stockSource: 'Skaita SQL · Kauno sandėlis (Eigulių g. 21, LT-51418 Kaunas)',
                },
            ];
        }

        const updatedItems: Array<{
            sku: string;
            title: string;
            previousQuantity: number;
            stockQuantity: number;
            stockUnit: string;
            stockSource: string;
            lastSyncedAt: string;
        }> = [];

        for (const row of incomingRows) {
            const rawSku = String(row.sku || '').trim();
            if (!rawSku) continue;
            const norm = rawSku.toLowerCase().replace(/[^a-z0-9]/g, '');
            const newQty = Math.max(
                0,
                Math.round(
                    Number(
                        row.stockQuantity ?? row.stock ?? row.qty ?? 0,
                    ) || 0,
                ),
            );
            const unit = (row.stockUnit || 'vnt.').trim();
            const src = (row.stockSource || defaultSource).trim();

            const matched =
                snap.bySkuNormalized.get(norm) ||
                snap.products.find(
                    (p) =>
                        p.sku.toLowerCase() === rawSku.toLowerCase() ||
                        p.sku.toLowerCase().includes(rawSku.toLowerCase()),
                );

            if (matched) {
                const prev = matched.stockQuantity ?? matched.stock ?? 0;
                matched.stock = newQty;
                matched.stockQuantity = newQty;
                matched.stockUnit = unit;
                matched.stockSource = src;
                matched.lastSyncedAt = syncedAt;
                if (
                    typeof row.retailGrossEur === 'number' &&
                    row.retailGrossEur > 0
                ) {
                    matched.price = row.retailGrossEur;
                    matched.priceCents = Math.round(row.retailGrossEur * 100);
                }

                const rawRecord = snap.rawById.get(matched.id);
                if (rawRecord) {
                    rawRecord.stock = newQty;
                    rawRecord.stockQuantity = newQty;
                    rawRecord.stockUnit = unit;
                    rawRecord.stockSource = src;
                    rawRecord.lastSyncedAt = syncedAt;
                }

                updatedItems.push({
                    sku: matched.sku,
                    title: matched.nameLt || matched.name,
                    previousQuantity: prev,
                    stockQuantity: newQty,
                    stockUnit: unit,
                    stockSource: src,
                    lastSyncedAt: syncedAt,
                });
            }
        }

        const summary = buildSourceBreakdown();
        return NextResponse.json({
            ok: true,
            source: defaultSource,
            syncedAt,
            processedRows: incomingRows.length,
            updatedCount: updatedItems.length,
            updatedItems,
            ...summary,
        });
    } catch {
        return NextResponse.json(
            {
                ok: false,
                error: 'Nepavyko sinchronizuoti sandėlio likučių',
            },
            { status: 400 },
        );
    }
}
