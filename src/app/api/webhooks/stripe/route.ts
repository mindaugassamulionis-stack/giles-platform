import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { db } from '@platform/database';
import { paymentEvents } from '@platform/database/schema/orders';
import { applyStorefrontPaymentSuccess } from '@platform/database/services/storefront-webhook';
import { and, eq, inArray, isNull, lt, or } from 'drizzle-orm';

// Placeholder only: keeps the Stripe client constructor happy when no
// credentials exist yet; real config must come from CredentialManager.
// Real requests are rejected downstream by the 'placeholder' check.
const STRIPE_UNCONFIGURED_PLACEHOLDER = '<STRIPE_TEST_KEY_PLACEHOLDER>';

// WP-SEC-RESIDUAL (SEC-PAY-06): configuration is re-read per request —
// CredentialManager owns the short TTL cache, so a rotated webhook secret or
// key is picked up without a process restart. No module-level forever-cache.
async function getStripeConfig(): Promise<{ stripe: Stripe; webhookSecret: string }> {
    const { CredentialManager } = await import('@platform/database/services/credential-manager');
    const creds = await CredentialManager.getCredentials('stripe');
    const secretKey = creds.secretKey || '';
    const webhookSecret = creds.webhookSecret || '';
    const stripe = new Stripe(secretKey || STRIPE_UNCONFIGURED_PLACEHOLDER, creds.apiVersion ? { apiVersion: creds.apiVersion as any } : {});
    return { stripe, webhookSecret };
}

// WP-SEC-RESIDUAL (SEC-PAY-04): consumer-namespaced event completion records.
// The shared payment_events surface is written by multiple consumers
// (PaymentService and each storefront route); each consumer tracks its own
// processed marker so one consumer's completion can never suppress another
// consumer's required work.
const CONSUMER = 'suradai';
const eventKey = (id: string) => `${CONSUMER}:${id}`;

const STALE_PROCESSING_AFTER_MS = 10 * 60 * 1000;

export async function POST(request: NextRequest) {
    const { stripe, webhookSecret: endpointSecret } = await getStripeConfig();
    if (!endpointSecret) {
        console.error('[StripeWebhook] Missing STRIPE_WEBHOOK_SECRET');
        return NextResponse.json({ error: 'Webhook misconfigured' }, { status: 500 });
    }

    const body = await request.text();
    const sig = request.headers.get('stripe-signature');

    if (!sig) {
        return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
    }

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
    } catch (err: any) {
        console.error(`Webhook Error: ${err.message}`);
        return NextResponse.json({ error: 'Webhook Error: Invalid signature' }, { status: 400 });
    }

    try {
        const paymentIntent = event.type.startsWith('payment_intent')
            ? (event.data.object as Stripe.PaymentIntent)
            : null;

        // Ensure a row exists for idempotency
        await db.insert(paymentEvents).values({
            stripeEventId: eventKey(event.id),
            eventType: event.type,
            amount: paymentIntent?.amount,
            currency: paymentIntent?.currency,
            rawPayload: event as any,
            status: 'received',
        }).onConflictDoNothing();

        // Claim processing lease (prevents double-processing on retries/concurrency)
        const staleBefore = new Date(Date.now() - STALE_PROCESSING_AFTER_MS);
        const claimed = await db.update(paymentEvents).set({
            status: 'processing',
            processedAt: new Date(), // "last attempt" timestamp; overwritten on success
            rawPayload: event as any,
            eventType: event.type,
            amount: paymentIntent?.amount,
            currency: paymentIntent?.currency,
        }).where(and(
            eq(paymentEvents.stripeEventId, eventKey(event.id)),
            or(
                inArray(paymentEvents.status, ['received', 'failed']),
                and(
                    eq(paymentEvents.status, 'processing'),
                    or(isNull(paymentEvents.processedAt), lt(paymentEvents.processedAt, staleBefore))
                )
            )
        )).returning({ id: paymentEvents.id });

        if (claimed.length === 0) {
            const [current] = await db.select({ status: paymentEvents.status })
                .from(paymentEvents)
                .where(eq(paymentEvents.stripeEventId, eventKey(event.id)))
                .limit(1);

            if (current?.status === 'processed') {
                return NextResponse.json({ received: true, duplicate: true });
            }

            // Another worker/process is handling it; acknowledge to stop retries.
            return NextResponse.json({ received: true, processing: true });
        }

        // Process inside a transaction so order state + stock changes are atomic-ish.
        const applied = await db.transaction(async (tx: any) => {
            let result: { orderId?: string; transitioned?: boolean } | undefined;

            if (event.type === 'payment_intent.succeeded') {
                // WP-SEC-RESIDUAL (SEC-PAY-04): canonical shared handler —
                // binding validation (amount/currency vs order total) and the
                // monotonic pending→paid marker with exactly-once stock
                // deduction. Late/duplicate deliveries can never reset an
                // advanced fulfillment status or re-deduct stock.
                // W13-B1: `transitioned` reports whether THIS delivery did
                // the pending→paid flip — the exactly-once gate for the paid
                // side effects fired after the commit below.
                result = await applyStorefrontPaymentSuccess(tx, paymentIntent);
            }

            await tx.update(paymentEvents).set({
                status: 'processed',
                processedAt: new Date(),
                orderId: result?.orderId,
            }).where(eq(paymentEvents.stripeEventId, eventKey(event.id)));

            return result;
        });

        // W13-B1: fire the paid consumers (order-confirmation email +
        // auto-label attempt) only when THIS delivery transitioned the
        // order, strictly AFTER the commit. Their failures are logged and
        // swallowed — the processed event must still return 200 (a resend
        // on replay would be a bug).
        if (applied?.transitioned && applied.orderId) {
            try {
                const { dispatchOrderPaidSideEffects } = await import('@platform/database/services/order-paid-dispatch');
                await dispatchOrderPaidSideEffects(applied.orderId);
            } catch (e) {
                console.error('[StripeWebhook] Paid side-effect dispatch failed (order stays paid):', e);
            }
        }
    } catch (dbError) {
        console.error('Database Error in Webhook:', dbError);
        try {
            await db.update(paymentEvents).set({
                status: 'failed',
                processedAt: new Date(),
            }).where(eq(paymentEvents.stripeEventId, eventKey(event.id)));
        } catch (e) {
            console.error('[StripeWebhook] Failed to mark payment event as failed:', e);
        }

        // Return 500 so Stripe retries.
        return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
    }

    return NextResponse.json({ received: true });
}
