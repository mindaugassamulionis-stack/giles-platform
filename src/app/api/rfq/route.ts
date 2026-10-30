import { NextResponse } from 'next/server';
import { validateRfqInput, RfqRateLimiter, rfqRateKey, getRfqTrustedProxyHops } from '../../../lib/rfq';

// W22-D1 T6: RFQ v1 endpoint — no-auth submit (plan §6 T6).
// Abuse floor: honeypot (bots fill hidden fields) + fixed-window rate limit
// (5 req/min per key, in-memory single-instance floor — Redis is W23 infra)
// + instance-wide backstop (60/min) so key spray cannot unlock unlimited
// submits (W22-D1 SECFIX F1).
// Storage v1: structured log only (no new DB tables in W22-D1 boundary);
// the caller gets a reference number for the confirmation screen.

const limiter = new RfqRateLimiter({ limit: 5, windowMs: 60_000, globalLimit: 60 });

export async function POST(request: Request) {
    // W22-D1 SECFIX F1: key from trusted sources ONLY. XFF is honored solely
    // via rightmost-untrusted-hop extraction when RFQ_TRUSTED_PROXY_HOPS
    // declares the appending proxy chain (set 1 behind the VPS nginx). App
    // Router hides the socket peer, so without that env the app fails closed
    // to one shared key + the instance-wide cap — an XFF flip can never
    // rotate the key (review P8 bypass dead).
    const key = rfqRateKey({
        xff: request.headers.get('x-forwarded-for'),
        trustedProxyHops: getRfqTrustedProxyHops(),
    });

    if (!limiter.take(key)) {
        return NextResponse.json(
            { ok: false, error: 'rate_limited' },
            { status: 429, headers: { 'Retry-After': '60' } },
        );
    }
    limiter.prune();

    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 });
    }

    const result = validateRfqInput(body);
    if (!result.ok) {
        // Honeypot hits return the same shape as other validation errors —
        // no signal to the bot that the trap worked.
        return NextResponse.json({ ok: false, error: 'validation_failed', detail: result.error }, { status: 400 });
    }

    const { reference } = result.value;
    // Storage v1: structured log line (grep-able ops trail until the W23
    // persistence slice lands).
    console.log(JSON.stringify({
        event: 'rfq_received',
        reference,
        topic: result.value.topic,
        contact: result.value.contact,
        company: result.value.company,
        contextSku: result.value.contextSku,
        messageLength: result.value.message.length,
        at: new Date().toISOString(),
    }));

    return NextResponse.json({ ok: true, reference }, { status: 201 });
}
