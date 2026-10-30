import { NextRequest, NextResponse } from 'next/server';
import { generateA6ShippingLabel } from '../../../../lib/baltic-carriers-and-payments';

export async function GET(req: NextRequest) {
    const sp = req.nextUrl.searchParams;
    const orderId = sp.get('orderId') || 'GILE-0001';
    const carrier = sp.get('carrier') || 'omniva';
    const terminalCode = sp.get('terminalCode') || undefined;
    const recipientName = sp.get('recipientName') || undefined;
    const recipientPhone = sp.get('recipientPhone') || undefined;
    const weightKg = sp.get('weightKg') ? Number(sp.get('weightKg')) : undefined;
    const format = (sp.get('format') || 'html').toLowerCase();

    const label = generateA6ShippingLabel({
        orderId,
        carrier,
        terminalCode,
        recipientName,
        recipientPhone,
        weightKg,
    });

    if (format === 'json') {
        return NextResponse.json({ ok: true, label });
    }
    if (format === 'svg') {
        return new NextResponse(label.svg, {
            status: 200,
            headers: {
                'Content-Type': 'image/svg+xml; charset=utf-8',
                'Cache-Control': 'no-store',
            },
        });
    }

    return new NextResponse(label.html, {
        status: 200,
        headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': 'no-store',
        },
    });
}

export async function POST(req: NextRequest) {
    try {
        const body = (await req.json()) as {
            orderId?: string;
            carrier?: string;
            terminalCode?: string;
            recipientName?: string;
            recipientPhone?: string;
            weightKg?: number;
        };

        const label = generateA6ShippingLabel({
            orderId: body?.orderId || 'GILE-0001',
            carrier: body?.carrier || 'omniva',
            terminalCode: body?.terminalCode,
            recipientName: body?.recipientName,
            recipientPhone: body?.recipientPhone,
            weightKg: body?.weightKg,
        });

        return NextResponse.json({
            ok: true,
            label,
        });
    } catch {
        return NextResponse.json(
            { ok: false, error: 'Failed to generate A6 shipping label' },
            { status: 400 },
        );
    }
}
