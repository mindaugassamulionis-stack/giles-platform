/**
 * W22-D1 T6: RFQ v1 pure parts.
 * Contract: reference generator (unique-ish, sortable prefix), static
 * supplier-verified topic list, zod validation (honeypot must be empty;
 * contact + message required), fixed-window rate limiter (per key).
 */
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import {
    buildRfqReference,
    RFQ_TOPICS,
    validateRfqInput,
    RfqRateLimiter,
    rfqRateKey,
    getRfqTrustedProxyHops,
} from './rfq';

describe('W22-D1 T6: RFQ reference generator', () => {
    it('format: RFQ-<compact base36 time>-<random base36 upper>', () => {
        const ref = buildRfqReference();
        expect(ref).toMatch(/^RFQ-[A-Z0-9]{6,12}-[A-Z0-9]{4,10}$/);
    });

    it('two calls within the same ms still differ (random suffix)', () => {
        const a = buildRfqReference();
        const b = buildRfqReference();
        expect(a).not.toBe(b);
    });
});

describe('W22-D1 T6: RFQ topics', () => {
    it('carries only supplier-verified topics (no invented services)', () => {
        expect(RFQ_TOPICS.length).toBeGreaterThanOrEqual(3);
        for (const topic of RFQ_TOPICS) {
            expect(topic.id).toMatch(/^[a-z0-9-]+$/);
            expect(topic.labelLt.length).toBeGreaterThan(0);
            expect(topic.labelEn.length).toBeGreaterThan(0);
        }
    });
});

describe('W22-D1 T6: RFQ validation', () => {
    const valid = {
        topic: RFQ_TOPICS[0].id,
        contact: 'montuotojas@imone.lt',
        message: 'Reikia 12 vnt. 88.20.411 ir siurblio grupės katilui Viessmann.',
        company: 'UAB Montuotojas',
        honeypot: '',
    };

    it('accepts a valid submission and echoes a reference', () => {
        const res = validateRfqInput(valid);
        expect(res.ok).toBe(true);
        if (res.ok) expect(res.value.reference).toMatch(/^RFQ-/);
    });

    it('rejects a filled honeypot', () => {
        const res = validateRfqInput({ ...valid, honeypot: 'http://spam.example' });
        expect(res.ok).toBe(false);
    });

    it('rejects a bad email', () => {
        const res = validateRfqInput({ ...valid, contact: 'not-an-email' });
        expect(res.ok).toBe(false);
    });

    it('rejects an unknown topic', () => {
        const res = validateRfqInput({ ...valid, topic: 'nuoma-drone' });
        expect(res.ok).toBe(false);
    });

    it('rejects an empty message', () => {
        const res = validateRfqInput({ ...valid, message: '' });
        expect(res.ok).toBe(false);
    });
});

describe('W22-D1 T6: RFQ rate limiter (fixed window)', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2011-05-03T10:00:00Z'));
    });
    afterEach(() => vi.useRealTimers());

    it('allows up to the limit then blocks within the same window', () => {
        const limiter = new RfqRateLimiter({ limit: 3, windowMs: 60_000 });
        expect(limiter.take('1.2.3.4')).toBe(true);
        expect(limiter.take('1.2.3.4')).toBe(true);
        expect(limiter.take('1.2.3.4')).toBe(true);
        expect(limiter.take('1.2.3.4')).toBe(false);
    });

    it('keys are independent', () => {
        const limiter = new RfqRateLimiter({ limit: 1, windowMs: 60_000 });
        expect(limiter.take('1.1.1.1')).toBe(true);
        expect(limiter.take('2.2.2.2')).toBe(true);
    });

    it('window expiry resets the counter', () => {
        const limiter = new RfqRateLimiter({ limit: 1, windowMs: 60_000 });
        expect(limiter.take('1.2.3.4')).toBe(true);
        expect(limiter.take('1.2.3.4')).toBe(false);
        vi.advanceTimersByTime(61_000);
        expect(limiter.take('1.2.3.4')).toBe(true);
    });
});

// W22-D1 SECFIX F1 (security review .runtime/state/W22-D1-SECREVIEW.md §2 F1,
// live proof P8: 429 → one XFF header flip → 201). The limiter key must come
// from trusted sources only: XFF is honored ONLY via rightmost-untrusted-hop
// extraction when RFQ_TRUSTED_PROXY_HOPS declares the appending proxy chain;
// otherwise the remote address (or one shared fail-closed key) is used.
describe('W22-D1 SECFIX F1: rate-limit key derivation', () => {
    it('no trusted proxy: XFF ignored — rotating XFF keeps one key (P8 bypass dead)', () => {
        const keys = [
            rfqRateKey({ xff: '9.9.9.9', remoteAddr: '203.0.113.7', trustedProxyHops: 0 }),
            rfqRateKey({ xff: '8.8.8.8', remoteAddr: '203.0.113.7', trustedProxyHops: 0 }),
            rfqRateKey({ xff: null, remoteAddr: '203.0.113.7', trustedProxyHops: 0 }),
        ];
        expect(new Set(keys).size).toBe(1);
        expect(keys[0]).toBe('203.0.113.7');
    });

    it('no trusted proxy, no remote address: fail-closed to one shared key', () => {
        expect(rfqRateKey({ xff: '9.9.9.9', trustedProxyHops: 0 }))
            .toBe(rfqRateKey({ xff: '1.2.3.4', trustedProxyHops: 0 }));
    });

    it('combined with the limiter: same socket + rotating XFF still gets denied after the window limit', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2011-05-03T10:00:00Z'));
        try {
            const limiter = new RfqRateLimiter({ limit: 5, windowMs: 60_000 });
            const xffs = ['9.9.9.9', '8.8.8.8', '7.7.7.7', '6.6.6.6', '5.5.5.5', '4.4.4.4', '3.3.3.3'];
            const verdicts = xffs.map((xff) =>
                limiter.take(rfqRateKey({ xff, remoteAddr: '203.0.113.7', trustedProxyHops: 0 })),
            );
            expect(verdicts.slice(0, 5)).toEqual([true, true, true, true, true]);
            expect(verdicts[5]).toBe(false);
            expect(verdicts[6]).toBe(false);
        } finally {
            vi.useRealTimers();
        }
    });

    it('trusted proxy (hops=1): rightmost XFF entry (appended by nginx) keys; spoofed prefix cannot rotate', () => {
        const a = rfqRateKey({ xff: '9.9.9.9, 198.51.100.10', trustedProxyHops: 1 });
        const b = rfqRateKey({ xff: '8.8.8.8, 198.51.100.10', trustedProxyHops: 1 });
        expect(a).toBe('198.51.100.10');
        expect(b).toBe(a);
    });

    it('trusted proxy: distinct real clients get distinct keys (legit per-client limiting survives)', () => {
        const a = rfqRateKey({ xff: '198.51.100.10', trustedProxyHops: 1 });
        const b = rfqRateKey({ xff: '203.0.113.99', trustedProxyHops: 1 });
        expect(a).not.toBe(b);
    });

    it('trusted proxy: XFF shorter than the hop count falls back (cannot shrink the chain)', () => {
        expect(rfqRateKey({ xff: '9.9.9.9', trustedProxyHops: 2 })).toBe('unknown');
    });
});

describe('W22-D1 SECFIX F1: trusted-proxy env parsing', () => {
    it('RFQ_TRUSTED_PROXY_HOPS: positive int → hops; 0/negative/garbage/absent → 0 (fail closed)', () => {
        expect(getRfqTrustedProxyHops('1')).toBe(1);
        expect(getRfqTrustedProxyHops('3')).toBe(3);
        expect(getRfqTrustedProxyHops('0')).toBe(0);
        expect(getRfqTrustedProxyHops('-1')).toBe(0);
        expect(getRfqTrustedProxyHops('2.5')).toBe(0);
        expect(getRfqTrustedProxyHops('abc')).toBe(0);
        expect(getRfqTrustedProxyHops(undefined)).toBe(0);
    });
});

describe('W22-D1 SECFIX F1: instance-wide submit cap (global backstop)', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2011-05-03T10:00:00Z'));
    });
    afterEach(() => vi.useRealTimers());

    it('global backstop trips under distributed key spray within one window', () => {
        const limiter = new RfqRateLimiter({ limit: 5, windowMs: 60_000, globalLimit: 7 });
        const verdicts = Array.from({ length: 9 }, (_, i) => limiter.take(`198.51.100.${i}`));
        expect(verdicts.slice(0, 7).every(Boolean)).toBe(true);
        expect(verdicts[7]).toBe(false);
        expect(verdicts[8]).toBe(false);
    });

    it('global cap resets with the window', () => {
        const limiter = new RfqRateLimiter({ limit: 1, windowMs: 60_000, globalLimit: 2 });
        expect(limiter.take('a')).toBe(true);
        expect(limiter.take('b')).toBe(true);
        expect(limiter.take('c')).toBe(false);
        vi.advanceTimersByTime(61_000);
        expect(limiter.take('d')).toBe(true);
    });

    it('no globalLimit configured: per-key behavior unchanged (backward compat)', () => {
        const limiter = new RfqRateLimiter({ limit: 1, windowMs: 60_000 });
        expect(limiter.take('a')).toBe(true);
        expect(limiter.take('b')).toBe(true);
    });
});

describe('W22-D1 SECFIX F1: limiter map eviction (memory bound under key churn)', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2011-05-03T10:00:00Z'));
    });
    afterEach(() => vi.useRealTimers());

    it('evicts oldest keys once maxKeys is exceeded — map size stays bounded, newest key still limited', () => {
        const limiter = new RfqRateLimiter({ limit: 1, windowMs: 60_000, maxKeys: 3 });
        for (let i = 0; i < 9; i++) limiter.take(`198.51.100.${i}`);
        expect(limiter.size).toBeLessThanOrEqual(3);
        // Newest key survived eviction and is still rate limited.
        expect(limiter.take('198.51.100.8')).toBe(false);
    });
});
