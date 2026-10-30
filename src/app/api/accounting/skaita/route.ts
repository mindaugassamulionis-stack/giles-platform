import { NextResponse } from 'next/server';
import {
    listSkaitaInvoices,
    createAutonomousSkaitaInvoice,
    updateSkaitaInvoiceStatus,
    convertProformaToGileInvoice,
    reconcileSepaBankStatement,
    exportSkaitaSalesCsv,
    exportSkaitaWriteoffActCsv,
    exportVmiIsaf12Xml,
    importSkaitaStockRows,
    type SkaitaPaymentStatus,
} from '../../../../lib/skaita-accounting';
import { GILES_COMPANY_IDENTITY } from '../../../../lib/giles-masterpiece-data';

export async function GET(req: Request) {
    const url = new URL(req.url);
    const format = url.searchParams.get('format');
    const invoices = listSkaitaInvoices();

    if (format === 'skaita_csv') {
        const csv = exportSkaitaSalesCsv(invoices);
        return new NextResponse(csv, {
            status: 200,
            headers: {
                'Content-Type': 'text/csv; charset=utf-8',
                'Content-Disposition': 'attachment; filename="skaita_pardavimai.csv"',
            },
        });
    }

    if (format === 'isaf_xml') {
        const xml = exportVmiIsaf12Xml(invoices);
        return new NextResponse(xml, {
            status: 200,
            headers: {
                'Content-Type': 'application/xml; charset=utf-8',
                'Content-Disposition': 'attachment; filename="vmi_isaf12_302620907.xml"',
            },
        });
    }

    if (format === 'writeoff_csv') {
        const csv = exportSkaitaWriteoffActCsv(invoices);
        return new NextResponse(csv, {
            status: 200,
            headers: {
                'Content-Type': 'text/csv; charset=utf-8',
                'Content-Disposition': 'attachment; filename="skaita_likuciu_nurasymo_aktas.csv"',
            },
        });
    }

    return NextResponse.json({
        ok: true,
        company: GILES_COMPANY_IDENTITY,
        erpSystem: 'UAB „Prototechnika“ – „Skaita“ (SQL DB izoliuota, dvikryptis Excel/CSV ir VMI i.SAF 1.2 tiltas)',
        invoices,
        skaitaCsvPreview: exportSkaitaSalesCsv(invoices),
        isafXmlPreview: exportVmiIsaf12Xml(invoices),
        writeoffCsvPreview: exportSkaitaWriteoffActCsv(invoices),
    });
}

export async function POST(req: Request) {
    try {
        const body = await req.json();

        if (body.action === 'import_skaita_stock') {
            const defaultRows = [
                { sku: '013G2990', stock: 48, costNetEur: 11.2, retailGrossEur: 24.9 },
                { sku: 'MPB-NANI-35', stock: 6, costNetEur: 1260.0, retailGrossEur: 2350.0 },
                { sku: 'ZV 100', stock: 12, costNetEur: 154.0, retailGrossEur: 288.0 },
                { sku: 'AW082HUGHA', stock: 5, costNetEur: 2450.0, retailGrossEur: 3890.0 },
                { sku: '1776603', stock: 34, costNetEur: 42.0, retailGrossEur: 74.5 },
            ];
            const rows = Array.isArray(body.rows) && body.rows.length > 0 ? body.rows : defaultRows;
            const summary = importSkaitaStockRows(rows);
            return NextResponse.json({
                ok: true,
                action: 'import_skaita_stock',
                summary,
            });
        }

        if (body.action === 'export_skaita_csv') {
            const invoices = listSkaitaInvoices();
            return NextResponse.json({
                ok: true,
                filename: 'skaita_pardavimai.csv',
                content: exportSkaitaSalesCsv(invoices),
            });
        }

        if (body.action === 'export_isaf_xml') {
            const invoices = listSkaitaInvoices();
            return NextResponse.json({
                ok: true,
                filename: 'vmi_isaf12_302620907.xml',
                content: exportVmiIsaf12Xml(invoices),
            });
        }

        if (body.action === 'export_writeoff_act') {
            const invoices = listSkaitaInvoices();
            return NextResponse.json({
                ok: true,
                filename: 'skaita_likuciu_nurasymo_aktas.csv',
                content: exportSkaitaWriteoffActCsv(invoices),
            });
        }

        if (body.action === 'convert_pro_to_gile') {
            const targetId = String(body.invoiceId || body.invoiceNumber || '');
            const converted = convertProformaToGileInvoice(targetId);
            if (!converted) {
                return NextResponse.json(
                    { ok: false, error: 'Išankstinė sąskaita nerasta' },
                    { status: 404 },
                );
            }
            const invoices = listSkaitaInvoices();
            return NextResponse.json({
                ok: true,
                action: 'convert_pro_to_gile',
                invoice: converted,
                invoices,
            });
        }

        if (body.action === 'reconcile_sepa') {
            const statementText = String(body.statementText || body.xml || body.csv || '');
            const result = reconcileSepaBankStatement(statementText);
            return NextResponse.json({
                ok: true,
                action: 'reconcile_sepa',
                reconciledCount: result.reconciledCount,
                matchedInvoiceIds: result.matchedInvoiceIds,
                invoices: result.invoices,
            });
        }

        const created = createAutonomousSkaitaInvoice({
            docType: body.docType || 'PVM_SASKAITA_FAKTURA',
            paymentStatus: body.paymentStatus || 'LAUKIA_APMOKEJIMO',
            paymentTermDays: Number(body.paymentTermDays || 14),
            buyerName: String(body.buyerName || 'UAB „Gilės inžinerija“ klientas'),
            buyerCompanyCode: String(body.buyerCompanyCode || '300000000'),
            buyerVatCode: String(body.buyerVatCode || 'LT100000000000'),
            buyerAddress: String(body.buyerAddress || 'Eigulių g. 21, LT-51418 Kaunas'),
            buyerEmail: String(body.buyerEmail || 'info@gilesinzinerija.lt'),
            warehouse: String(body.warehouse || 'KAUNAS_PAGRINDINIS'),
            lines:
                Array.isArray(body.lines) && body.lines.length > 0
                    ? body.lines
                    : [
                          {
                              sku: 'MPB-NANI-35',
                              ean: '4770001000351',
                              title: 'Granulių degiklio komplektas Megatherm MPB NANI 35 (8–35 kW)',
                              unit: 'kompl.',
                              qty: 1,
                              unitNetEur: 1942.15,
                              costNetEur: 1260.0,
                          },
                      ],
        });

        const invoices = listSkaitaInvoices();
        return NextResponse.json({
            ok: true,
            invoice: created,
            invoices,
            skaitaCsvPreview: exportSkaitaSalesCsv(invoices),
            isafXmlPreview: exportVmiIsaf12Xml(invoices),
        });
    } catch {
        return NextResponse.json(
            { ok: false, error: 'Nepavyko suformuoti buhalterinio dokumento' },
            { status: 400 },
        );
    }
}

export async function PATCH(req: Request) {
    try {
        const body = await req.json();

        if (body.action === 'convert_pro_to_gile') {
            const targetId = String(body.invoiceId || body.invoiceNumber || '');
            const converted = convertProformaToGileInvoice(targetId);
            if (!converted) {
                return NextResponse.json(
                    { ok: false, error: 'Išankstinė sąskaita nerasta' },
                    { status: 404 },
                );
            }
            return NextResponse.json({
                ok: true,
                invoice: converted,
                invoices: listSkaitaInvoices(),
            });
        }

        const targetId = String(body.invoiceId || body.invoiceNumber || '');
        const paymentStatus: SkaitaPaymentStatus =
            body.paymentStatus === 'APMOKETA_PAVEDIMU' || body.paymentStatus === 'ANULIUOTA'
                ? body.paymentStatus
                : 'LAUKIA_APMOKEJIMO';

        const updated = updateSkaitaInvoiceStatus(targetId, paymentStatus);
        if (!updated) {
            return NextResponse.json(
                { ok: false, error: 'Sąskaita nerasta' },
                { status: 404 },
            );
        }

        return NextResponse.json({
            ok: true,
            invoice: updated,
            invoices: listSkaitaInvoices(),
        });
    } catch {
        return NextResponse.json(
            { ok: false, error: 'Nepavyko atnaujinti sąskaitos būsenos' },
            { status: 400 },
        );
    }
}
