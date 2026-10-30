import { NextResponse } from 'next/server';
import {
    addOrUpdateSupplier,
    getSuppliersList,
    importSupplierPricelistRows,
    resetSuppliersAndAgentsStore,
    syncSupplierPricelistNow,
} from '../../../../lib/suppliers-and-agents-store';

export async function GET() {
    const suppliers = getSuppliersList();
    return NextResponse.json({
        ok: true,
        suppliers,
        totalSuppliers: suppliers.length,
    });
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const action = String(body.action || 'upsert_supplier');

        if (action === 'reset_suppliers') {
            resetSuppliersAndAgentsStore();
            const suppliers = getSuppliersList();
            return NextResponse.json({
                ok: true,
                reset: true,
                suppliers,
            });
        }

        if (action === 'upsert_supplier') {
            const supplier = addOrUpdateSupplier({
                id: body.id,
                name: String(body.name || 'Naujas ŠVOK Tiekėjas'),
                country: body.country,
                contactEmail: body.contactEmail,
                currency: body.currency,
                dealerDiscountPct: body.dealerDiscountPct,
                targetMarginPct: body.targetMarginPct,
                leadTimeDays: body.leadTimeDays,
                skuPrefix: body.skuPrefix,
                feedFormat: body.feedFormat,
                feedUrlOrNote: body.feedUrlOrNote,
                sourceFile: body.sourceFile,
                enabled: body.enabled,
            });
            const suppliers = getSuppliersList();
            return NextResponse.json({
                ok: true,
                action: 'upsert_supplier',
                supplier,
                suppliers,
            });
        }

        if (action === 'import_pricelist') {
            const supplierId = String(body.supplierId || 'danfoss');
            const result = importSupplierPricelistRows({
                supplierId,
                rawText: body.rawText,
                rows: body.rows,
            });
            return NextResponse.json({
                ok: true,
                action: 'import_pricelist',
                supplier: result.supplier,
                importedCount: result.importedCount,
                items: result.items,
                suppliers: getSuppliersList(),
            });
        }

        if (action === 'sync_pricelist') {
            const supplierId = String(body.supplierId || 'danfoss');
            const supplier = syncSupplierPricelistNow(supplierId);
            return NextResponse.json({
                ok: true,
                action: 'sync_pricelist',
                supplier,
                suppliers: getSuppliersList(),
            });
        }

        return NextResponse.json(
            { ok: false, error: `Nežinomas tiekėjų valdymo veiksmas: ${action}` },
            { status: 400 },
        );
    } catch {
        return NextResponse.json(
            { ok: false, error: 'Nepavyko apdoroti tiekėjo arba kainoraščio veiksmo' },
            { status: 400 },
        );
    }
}

export async function PATCH(req: Request) {
    return POST(req);
}
