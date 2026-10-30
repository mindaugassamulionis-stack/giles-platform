import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { z } from 'zod';
import { db } from '@platform/database';
import { orders, orderLegs, orderLineItems } from '@platform/database/schema/orders';
import { randomUUID } from 'crypto';
import { resolveCheckoutLineItems } from '../../../lib/checkout-line-items';
import ltCheckoutMessages from '../../../../messages/lt/checkout.json';
import enCheckoutMessages from '../../../../messages/en/checkout.json';

// W13-V1-F1 (V1-E1): no-key graceful degradation. When Stripe credentials
// are absent the API must answer 503 (service temporarily unavailable class)
// with GENERIC localized copy — never a 500, never the env-var name, never
// internal config detail in body or console.
const SUPPORTED_LOCALES = ['lt', 'en'] as const;
type StorefrontLocale = (typeof SUPPORTED_LOCALES)[number];
const PAYMENT_UNAVAILABLE_COPY: Record<StorefrontLocale, string> = {
    lt: (ltCheckoutMessages as Record<string, string>).paymentUnavailable,
    en: (enCheckoutMessages as Record<string, string>).paymentUnavailable,
};
function resolveLocale(request: NextRequest, bodyLocale: unknown): StorefrontLocale {
    const referer = request.headers.get('referer') || '';
    const candidates = [
        typeof bodyLocale === 'string' ? bodyLocale.toLowerCase() : '',
        request.cookies.get('NEXT_LOCALE')?.value?.toLowerCase() ?? '',
        referer.match(/\/(lt|en)(?=\/|\?|#|$)/i)?.[1]?.toLowerCase() ?? '',
        (request.headers.get('accept-language') || '').toLowerCase().match(/\b(lt|en)\b/)?.[1] ?? '',
    ];
    for (const c of candidates) {
        if ((SUPPORTED_LOCALES as readonly string[]).includes(c)) return c as StorefrontLocale;
    }
    return 'lt';
}

// Placeholder only: keeps the Stripe client constructor happy when no
// credentials exist yet; real config must come from CredentialManager.
// Real requests are rejected downstream by the 'placeholder' check.
const STRIPE_UNCONFIGURED_PLACEHOLDER = '<STRIPE_TEST_KEY_PLACEHOLDER>';

// W2-04 / W2-14: structured logger that explicitly redacts
// email / phone / shippingAddress before any console output. Keeps a
// single source of truth for log shape so the platform log aggregator
// can rely on {requestId, code, ctx} and never receives raw PII.
const REDACTED_KEYS = new Set(['email', 'phone', 'shippingAddress', 'customerEmail', 'recipientPhone']);
function redact(value: unknown): unknown {
    if (Array.isArray(value)) return value.map(redact);
    if (value && typeof value === 'object') {
        const out: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
            out[k] = REDACTED_KEYS.has(k) ? '[redacted]' : redact(v);
        }
        return out;
    }
    return value;
}
function logError(requestId: string, code: string, ctx: Record<string, unknown> = {}): void {
    console.error(JSON.stringify({ requestId, code, ctx: redact(ctx) }));
}
function newRequestId(): string {
    try { return randomUUID(); } catch { return Math.random().toString(36).slice(2); }
}

// W2-02 (GATE-05 successor): zod-validated item shape. Quantity is
// bounded to a positive integer in [1, 9999] so fractional, negative,
// zero, and absurdly large values are rejected at the edge. Exactly
// one of `variantId` or `id` is required; the schema below accepts
// either, and the route picks the matching lookup path.
const MAX_QTY_PER_ITEM = 9999;
const checkoutItemSchema = z
    .object({
        variantId: z.string().min(1).max(128),
        id: z.string().min(1).max(128),
        quantity: z.number().int().positive().max(MAX_QTY_PER_ITEM),
    })
    .refine((item) => item.variantId || item.id, {
        message: 'variantId or id is required',
    });
const checkoutBodySchema = z.object({
    items: z.array(checkoutItemSchema).min(1).max(50),
});

let _stripe: Stripe | null = null;
let _stripeKey = '';

async function getStripe(): Promise<{ stripe: Stripe; secretKey: string }> {
    if (_stripe && _stripeKey) return { stripe: _stripe, secretKey: _stripeKey };
    const { CredentialManager } = await import('@platform/database/services/credential-manager');
    const creds = await CredentialManager.getCredentials('stripe');
    _stripeKey = creds.secretKey || '';
    _stripe = new Stripe(_stripeKey || STRIPE_UNCONFIGURED_PLACEHOLDER, creds.apiVersion ? { apiVersion: creds.apiVersion as any } : {});
    return { stripe: _stripe, secretKey: _stripeKey };
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        // W13-V1-F1 (V1-E1): locale for the localized generic error copy is
        // resolved from body.locale > NEXT_LOCALE cookie > referer path >
        // Accept-Language > storefront default (lt).
        const locale = resolveLocale(request, body?.locale);
        const { stripe, secretKey: stripeSecretKey } = await getStripe();
        if (!stripeSecretKey || stripeSecretKey.includes('placeholder')) {
            logError(newRequestId(), 'checkout_payment_unavailable', { locale });
            return NextResponse.json(
                { error: PAYMENT_UNAVAILABLE_COPY[locale] },
                { status: 503 }
            );
        }

        const { email, shippingAddress } = body;
        // W2-02: validate the items array shape before any DB work.
        // Rejects fractional / negative / zero / oversize quantities and
        // unknown extra fields. The ZodError carries the offending path
        // so the client can map it to a form field.
        const parsed = checkoutBodySchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { error: 'Invalid order payload', issues: parsed.error.flatten() },
                { status: 400 },
            );
        }
        const { items } = parsed.data;
        if (!items || items.length === 0) {
            return NextResponse.json(
                { error: 'No items in cart' },
                { status: 400 }
            );
        }

        // [SECURITY] Recalculate totals server-side & prepare order data.
        // W23-S1/G1: line resolution lives in lib/checkout-line-items.ts —
        // prices from variants.priceGross (never the dead EAN join), unknown
        // stock passes (B2B confirmation flow), explicit supplier errors.
        const resolution = await resolveCheckoutLineItems(items);
        if (!resolution.ok) {
            return NextResponse.json(
                { error: resolution.error },
                { status: resolution.status }
            );
        }
        const { supplierGroups, subtotal: calculatedSubtotal } = resolution;

        const TAX_RATE = 0.21; // 21% Standard VAT
        const FREE_SHIPPING_THRESHOLD = 50;
        const FLAT_SHIPPING_RATE = 3.99;

        const shippingCost = calculatedSubtotal >= FREE_SHIPPING_THRESHOLD ? 0 : FLAT_SHIPPING_RATE;
        const total = calculatedSubtotal + shippingCost;

        // Calculate Tax (Inclusive) -> Tax = Price - (Price / 1.21)
        const taxAmount = calculatedSubtotal - (calculatedSubtotal / (1 + TAX_RATE));
        const netAmount = calculatedSubtotal - taxAmount;

        const amountInCents = Math.round(total * 100);

        if (amountInCents === 0) {
            return NextResponse.json({ error: 'Invalid total amount' }, { status: 400 });
        }

        // Create PaymentIntent
        const paymentIntent = await stripe.paymentIntents.create({
            amount: amountInCents,
            currency: 'eur',
            automatic_payment_methods: { enabled: true },
            metadata: {
                email: email || 'guest',
                store: 'suradai',
                order_id: 'pending',
                tax_amount: taxAmount.toFixed(2), // Compliance: Log Tax
                net_amount: netAmount.toFixed(2),
                shipping_cost: shippingCost.toFixed(2),
                tax_rate: (TAX_RATE * 100) + '%',
            },
            description: `Gilės Inžinerija Order (${items.length} items)`,
        });

        let createdOrderId: string | null = null;

        // 📝 INTEGRITY: Create Persistent Order in DB
        await db.transaction(async (tx: any) => {
            // 1. Create Order
            const [newOrder] = await tx.insert(orders).values({
                customerEmail: email || 'guest',
                status: 'pending',
                subtotal: calculatedSubtotal.toString(),
                shippingCost: shippingCost.toString(),
                total: total.toString(),
                paymentIntentId: paymentIntent.id,
                shippingAddress: shippingAddress || {}, // Store address
            }).returning();

            createdOrderId = newOrder.id;

            // 2. Create Order Legs (per supplier)
            for (const [supplierId, groupItems] of Object.entries(supplierGroups)) {
                // Assert groupItems is array to fix TS error
                const items = groupItems as any[];
                const legCost = items.reduce((sum, i) => sum + i.total, 0);

                const [newLeg] = await tx.insert(orderLegs).values({
                    orderId: newOrder.id,
                    supplierId: supplierId,
                    supplierIdempotencyKey: randomUUID(), // Unique key for this leg
                    cost: legCost.toString(),
                    status: 'pending'
                }).returning();

                // 3. Create Line Items (lib ResolvedLineItem shape)
                for (const item of items) {
                    await tx.insert(orderLineItems).values({
                        orderId: newOrder.id,
                        orderLegId: newLeg.id,
                        offerId: item.offerId,
                        ean: item.ean || 'Unknown',
                        sku: item.sku,
                        title: item.name || item.sku, // title NOT NULL
                        quantity: item.quantity,
                        unitPrice: item.price.toString(),
                        totalPrice: item.total.toString(),
                    });
                }
            }

            // Update PaymentIntent with Order ID (Optional but good for tracking)
            // await stripe.paymentIntents.update(paymentIntent.id, { metadata: { db_order_id: newOrder.id }});
        });

        // Best-effort: link DB order to Stripe for reconciliation/debugging.
        if (createdOrderId) {
            try {
                await stripe.paymentIntents.update(paymentIntent.id, {
                    metadata: {
                        email: email || 'guest',
                        store: 'suradai',
                        db_order_id: createdOrderId,
                    }
                });
            } catch (e) {
                console.warn('[Checkout] Failed to update Stripe metadata:', e);
            }
        }

        return NextResponse.json({
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id,
            amount: amountInCents,
            total: total.toFixed(2),
        });

    } catch (error: any) {
        const requestId = newRequestId();
        // W2-04 / W2-14: never dump the raw Error (it carries the full
        // request body including email / phone / shippingAddress) and
        // never propagate `error.message` to the client.
        logError(requestId, 'checkout_failed', { status: 'error', message: String(error?.message || error).slice(0, 200) });
        return NextResponse.json(
            { error: 'internal_error', requestId },
            { status: 500 }
        );
    }
}
