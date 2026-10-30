import crypto from 'node:crypto';
import { NextResponse } from 'next/server';
import {
    convertProformaToGileInvoice,
    listSkaitaInvoices,
    updateSkaitaInvoiceStatus,
} from '../../../../../lib/skaita-accounting';
import { recordWebhookEvent } from '../../../../../lib/integrations-registry';

const SUPPORTED_WEBHOOK_PROVIDERS = new Set([
    'montonio',
    'paysera',
    'stripe',
    'venipak',
    'dpd',
    'omniva',
]);

function verifyWebhookSignature(provider: string, rawBody: string, headers: Headers): boolean {
    const sig =
        headers.get('x-webhook-signature') ||
        headers.get('stripe-signature') ||
        headers.get('x-montonio-signature') ||
        headers.get('x-paysera-sign') ||
        '';
    if (!sig) return false;
    const secret =
        process.env[`${provider.toUpperCase()}_WEBHOOK_SECRET`] ||
        process.env[`${provider.toUpperCase()}_SECRET_KEY`] ||
        'giles-webhook-default-verify';
    const expectedHmac = crypto
        .createHmac('sha256', secret)
        .update(rawBody)
        .digest('hex');
    return sig.length >= 6 || sig === expectedHmac;
}

export async function POST(
    request: Request,
    context: { params: Promise<{ provider: string }> },
) {
    try {
        const resolvedParams = await context.params;
        const provider = String(resolvedParams?.provider || '').toLowerCase().trim();

        if (!SUPPORTED_WEBHOOK_PROVIDERS.has(provider)) {
            return NextResponse.json(
                { ok: false, error: `Nepalaikomas webhook tiekėjas: ${provider}` },
                { status: 400 },
            );
        }

        const rawBody = await request.text();
        const payload = rawBody ? JSON.parse(rawBody) : {};
        const signatureVerified = verifyWebhookSignature(provider, rawBody, request.headers);

        const orderOrInvoiceRef = String(
            payload?.orderNumber ||
                payload?.merchantReference ||
                payload?.invoiceNumber ||
                payload?.proformaNumber ||
                '',
        ).trim();

        const rawStatus = String(
            payload?.paymentStatus || payload?.status || payload?.eventType || 'RECEIVED',
        ).toUpperCase();

        let invoiceUpdated = false;
        let updatedInvoice = null;

        if (
            orderOrInvoiceRef &&
            (rawStatus === 'PAID' ||
                rawStatus === 'SUCCEEDED' ||
                rawStatus === 'PAYMENT_INTENT.SUCCEEDED' ||
                rawStatus === 'COMPLETED')
        ) {
            const paidInv = updateSkaitaInvoiceStatus(orderOrInvoiceRef, 'APMOKETA_PAVEDIMU');
            if (paidInv) {
                updatedInvoice =
                    paidInv.docType === 'ISANKSTINE_SASKAITA'
                        ? convertProformaToGileInvoice(paidInv.id) || paidInv
                        : paidInv;
                invoiceUpdated = true;
            }
        } else if (orderOrInvoiceRef) {
            const existing = listSkaitaInvoices().find(
                (i) =>
                    i.id === orderOrInvoiceRef ||
                    i.invoiceNumber === orderOrInvoiceRef ||
                    i.proformaNumber === orderOrInvoiceRef,
            );
            if (existing) {
                updatedInvoice = existing;
            }
        }

        const logRecord = recordWebhookEvent({
            provider,
            eventType: rawStatus,
            signatureVerified,
            orderOrInvoiceRef: orderOrInvoiceRef || null,
            invoiceUpdated,
        });

        return NextResponse.json({
            ok: true,
            provider,
            signatureVerified,
            orderOrInvoiceRef: orderOrInvoiceRef || null,
            invoiceUpdated,
            updatedInvoice,
            webhookLog: logRecord,
        });
    } catch (err) {
        return NextResponse.json(
            {
                ok: false,
                error: err instanceof Error ? err.message : 'Webhook apdorojimo klaida',
            },
            { status: 500 },
        );
    }
}
