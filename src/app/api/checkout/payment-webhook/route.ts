import { NextRequest, NextResponse } from 'next/server';
import {
    verifyMontonioWebhookJwt,
    verifyPayseraCallback,
    verifyStripeWebhookSignature,
    recordPaidWebhookOrder,
} from '../../../../lib/baltic-carriers-and-payments';
import { updateSkaitaInvoiceStatus } from '../../../../lib/skaita-accounting';

export async function POST(req: NextRequest) {
    try {
        const rawBody = await req.text();
        let parsedBody: Record<string, unknown> = {};
        if (rawBody.trim().startsWith('{')) {
            try {
                parsedBody = JSON.parse(rawBody) as Record<string, unknown>;
            } catch {
                return NextResponse.json(
                    { ok: false, error: 'Malformed JSON body' },
                    { status: 400 },
                );
            }
        } else if (rawBody.includes('=')) {
            const params = new URLSearchParams(rawBody);
            for (const [k, v] of params.entries()) {
                parsedBody[k] = v;
            }
        }

        const stripeSigHeader = req.headers.get('stripe-signature') || '';
        const providerRaw = String(
            parsedBody.provider ||
                req.nextUrl.searchParams.get('provider') ||
                (stripeSigHeader ? 'stripe' : 'montonio'),
        )
            .trim()
            .toLowerCase();

        if (providerRaw === 'montonio') {
            const orderToken = String(
                parsedBody.orderToken ||
                    parsedBody.order_token ||
                    parsedBody.token ||
                    req.nextUrl.searchParams.get('order-token') ||
                    '',
            ).trim();

            const verification = verifyMontonioWebhookJwt(orderToken);
            if (!verification.valid || !verification.payload) {
                return NextResponse.json(
                    {
                        ok: false,
                        provider: 'montonio',
                        error: verification.error || 'Invalid Montonio webhook JWT signature',
                    },
                    { status: 401 },
                );
            }

            const orderId = String(verification.payload.merchantReference || '').trim();
            const paymentStatus = String(
                verification.payload.paymentStatus || parsedBody.paymentStatus || 'PAID',
            )
                .trim()
                .toUpperCase();

            if (paymentStatus === 'PAID' && orderId) {
                const updatedInvoice = updateSkaitaInvoiceStatus(orderId, 'APMOKETA_PAVEDIMU');
                recordPaidWebhookOrder({
                    orderId,
                    provider: 'montonio',
                    amountEur: verification.payload.grandTotal,
                    paidAt: new Date().toISOString(),
                });
                return NextResponse.json({
                    ok: true,
                    provider: 'montonio',
                    orderId,
                    status: 'paid',
                    invoiceUpdated: Boolean(updatedInvoice),
                });
            }

            return NextResponse.json({
                ok: true,
                provider: 'montonio',
                orderId,
                status: paymentStatus.toLowerCase(),
            });
        }

        if (providerRaw === 'paysera') {
            const verification = verifyPayseraCallback({
                data: String(parsedBody.data || req.nextUrl.searchParams.get('data') || ''),
                ss1: String(parsedBody.ss1 || req.nextUrl.searchParams.get('ss1') || ''),
                ss2: String(parsedBody.ss2 || req.nextUrl.searchParams.get('ss2') || ''),
                sign: String(parsedBody.sign || req.nextUrl.searchParams.get('sign') || ''),
            });

            if (!verification.valid || !verification.params) {
                return NextResponse.json(
                    {
                        ok: false,
                        provider: 'paysera',
                        error: verification.error || 'Invalid Paysera callback signature',
                    },
                    { status: 401 },
                );
            }

            const orderId = String(verification.params.orderid || '').trim();
            const status = String(verification.params.status || '1').trim();
            const amountCents = Number(verification.params.amount || 0);

            if ((status === '1' || status === 'PAID') && orderId) {
                const updatedInvoice = updateSkaitaInvoiceStatus(orderId, 'APMOKETA_PAVEDIMU');
                recordPaidWebhookOrder({
                    orderId,
                    provider: 'paysera',
                    amountEur: amountCents > 0 ? amountCents / 100 : undefined,
                    paidAt: new Date().toISOString(),
                });
                return NextResponse.json({
                    ok: true,
                    provider: 'paysera',
                    orderId,
                    status: 'paid',
                    invoiceUpdated: Boolean(updatedInvoice),
                });
            }

            return NextResponse.json({
                ok: true,
                provider: 'paysera',
                orderId,
                status,
            });
        }

        if (providerRaw === 'stripe') {
            const sig =
                stripeSigHeader ||
                String(parsedBody.stripeSignature || parsedBody.signature || '');
            const payloadToVerify =
                typeof parsedBody.rawPayload === 'string' ? parsedBody.rawPayload : rawBody;

            const verification = verifyStripeWebhookSignature(payloadToVerify, sig);
            if (!verification.valid) {
                return NextResponse.json(
                    {
                        ok: false,
                        provider: 'stripe',
                        error: verification.error || 'Invalid Stripe webhook signature',
                    },
                    { status: 401 },
                );
            }

            const eventObj =
                typeof parsedBody.rawPayload === 'string'
                    ? (JSON.parse(parsedBody.rawPayload) as Record<string, any>)
                    : (parsedBody as Record<string, any>);
            const eventType = String(eventObj.type || '');
            const sessionObj = eventObj?.data?.object || {};
            const orderId = String(
                sessionObj.client_reference_id ||
                    sessionObj?.metadata?.orderId ||
                    eventObj.orderId ||
                    '',
            ).trim();
            const isPaid =
                eventType === 'checkout.session.completed' ||
                eventType === 'payment_intent.succeeded' ||
                sessionObj.payment_status === 'paid';

            if (isPaid && orderId) {
                const updatedInvoice = updateSkaitaInvoiceStatus(orderId, 'APMOKETA_PAVEDIMU');
                recordPaidWebhookOrder({
                    orderId,
                    provider: 'stripe',
                    paidAt: new Date().toISOString(),
                });
                return NextResponse.json({
                    ok: true,
                    provider: 'stripe',
                    orderId,
                    status: 'paid',
                    invoiceUpdated: Boolean(updatedInvoice),
                });
            }

            return NextResponse.json({
                ok: true,
                provider: 'stripe',
                orderId,
                status: isPaid ? 'paid' : 'received',
            });
        }

        return NextResponse.json(
            { ok: false, error: `Unsupported payment provider: ${providerRaw}` },
            { status: 400 },
        );
    } catch {
        return NextResponse.json(
            { ok: false, error: 'Payment webhook processing failed' },
            { status: 500 },
        );
    }
}
