// W22-D1 T6: RFQ v1 — pure parts (validation, topics, reference, rate limit).
//
// Scope (plan §6 T6): no-auth submit with honeypot + fixed-window rate limit,
// static supplier-verified topic list only (no invented services), reference
// number on confirmation. No new DB tables (W22-D1 boundary: no migrations).

import { z } from 'zod';

export interface RfqTopic {
    id: string;
    labelLt: string;
    labelEn: string;
}

// Supplier-verified topics ONLY (plan §6 T6 + B1 positioning): these map to
// what the supplier actually quotes. Adding a topic requires supplier proof.
export const RFQ_TOPICS: RfqTopic[] = [
    { id: 'objekto-projektas', labelLt: 'Daugiabučio / objekto projektas', labelEn: 'Apartment building / site project' },
    { id: 'automatika', labelLt: 'Automatika ir reguliavimas', labelEn: 'Controls and regulation' },
    { id: 'sildymo-sistema', labelLt: 'Šildymo sistema (katilas, radiatoriai, vamzdynai)', labelEn: 'Heating system (boiler, radiators, piping)' },
    { id: 'atsargines-dalys', labelLt: 'Atsarginės dalys pagal kodą', labelEn: 'Spare parts by code' },
    { id: 'kita', labelLt: 'Kita', labelEn: 'Other' },
];

const topicIds = RFQ_TOPICS.map((t) => t.id) as [string, ...string[]];

let counter = 0;
/** Human-readable confirmation reference: RFQ-<compact-time>-<rand>. */
export function buildRfqReference(now: Date = new Date()): string {
    const compact = now.getTime().toString(36).toUpperCase().slice(-8);
    // Random suffix: same-ms submissions still differ.
    const rand = Math.random().toString(36).toUpperCase().slice(2, 6);
    counter = (counter + 1) % 1296;
    const seq = counter.toString(36).toUpperCase().padStart(1, '0');
    return `RFQ-${compact}-${rand}${seq}`;
}

export const RfqInputSchema = z.object({
    topic: z.enum(topicIds),
    contact: z.string().trim().min(3).max(200).email('blogas el. paštas'),
    company: z.string().trim().max(200).optional().default(''),
    message: z.string().trim().min(10, 'per trumpas užklausos tekstas').max(4000),
    // Honeypot: bots fill hidden fields; humans never see it. Non-empty → reject.
    honeypot: z.string().max(0).optional().default(''),
    // SKU/context prefill from PDP or the calculator.
    contextSku: z.string().trim().max(64).optional().default(''),
});

export type RfqInput = z.infer<typeof RfqInputSchema>;

export type RfqValidation =
    | { ok: true; value: RfqInput & { reference: string } }
    | { ok: false; error: string };

export function validateRfqInput(raw: unknown): RfqValidation {
    const parsed = RfqInputSchema.safeParse(raw);
    if (!parsed.success) {
        return { ok: false, error: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ') };
    }
    return { ok: true, value: { ...parsed.data, reference: buildRfqReference() } };
}

/**
 * Fixed-window in-memory rate limiter. Single-instance floor (plan §6 T6:
 * in-memory allowed as floor; Redis upgrade is W23 infra scope).
 *
 * W22-D1 SECFIX F1 hardening (security review §2 F1 — XFF key spoofing):
 * - `globalLimit`: optional instance-wide submit cap per window — a global
 *   backstop independent of per-key windows, so key spray cannot unlock
 *   unlimited submits (log-flooding/reference-spam bound).
 * - `maxKeys`: bound on the in-memory Map so key churn cannot grow memory
 *   unboundedly; oldest entries are evicted first (Map insertion order).
 */
const DEFAULT_MAX_KEYS = 10_000;

export class RfqRateLimiter {
    private hits = new Map<string, { count: number; windowStart: number }>();
    private global = { count: 0, windowStart: 0 };

    constructor(private readonly opts: {
        limit: number;
        windowMs: number;
        globalLimit?: number;
        maxKeys?: number;
    }) {}

    /** Number of tracked per-key windows (memory-bound observability). */
    get size(): number {
        return this.hits.size;
    }

    /** Returns true when the request is allowed; records the hit either way. */
    take(key: string, now: number = Date.now()): boolean {
        let keyCount: number;
        const entry = this.hits.get(key);
        if (!entry || now - entry.windowStart >= this.opts.windowMs) {
            this.hits.set(key, { count: 1, windowStart: now });
            keyCount = 1;
        } else {
            entry.count += 1;
            keyCount = entry.count;
        }
        this.evict(now, key);

        let globalOk = true;
        if (this.opts.globalLimit !== undefined) {
            if (now - this.global.windowStart >= this.opts.windowMs) {
                this.global = { count: 1, windowStart: now };
            } else {
                this.global.count += 1;
            }
            globalOk = this.global.count <= this.opts.globalLimit;
        }

        return keyCount <= this.opts.limit && globalOk;
    }

    /** Drop expired windows, then oldest entries, until `maxKeys` is honored. */
    private evict(now: number, keepKey?: string): void {
        const maxKeys = this.opts.maxKeys ?? DEFAULT_MAX_KEYS;
        if (this.hits.size <= maxKeys) return;
        for (const [key, entry] of this.hits) {
            if (now - entry.windowStart >= this.opts.windowMs) this.hits.delete(key);
        }
        for (const key of this.hits.keys()) {
            if (this.hits.size <= maxKeys) break;
            if (key === keepKey) continue;
            this.hits.delete(key);
        }
    }

    /** Prune expired windows (call opportunistically). */
    prune(now: number = Date.now()): void {
        for (const [key, entry] of this.hits) {
            if (now - entry.windowStart >= this.opts.windowMs) this.hits.delete(key);
        }
    }
}

// W22-D1 SECFIX F1 (security review §2 F1, live proof P8: one XFF flip fully
// bypassed the 5/min limit on the same connection). The limiter key must be
// derivable ONLY from sources the client cannot forge:
//
// - Default (no trusted proxy configured): the remote/socket address when the
//   runtime provides one, else ONE shared fail-closed key — never a request
//   header. Next.js App Router does not expose the socket peer, so a bare
//   `next start` deployment shares the fallback key + the instance-wide cap;
//   an abusive direct client can at worst slow the form down (fail closed),
//   never unlock unlimited submits.
// - With RFQ_TRUSTED_PROXY_HOPS=N (deployment declares "exactly N appending
//   proxies front the app; the port is not directly reachable"): each proxy
//   APPENDS the address it saw, so the client IP is the entry `hops` from the
//   RIGHT (rightmost-untrusted-hop). Client-supplied XFF values can only sit
//   further LEFT and can never rotate the key. Default nginx
//   `proxy_add_x_forwarded_for` appends the real client addr → set hops=1 on
//   the VPS.
/** Parse RFQ_TRUSTED_PROXY_HOPS: positive int → N; anything else → 0 (fail closed). */
export function getRfqTrustedProxyHops(raw: string | undefined = process.env.RFQ_TRUSTED_PROXY_HOPS): number {
    if (raw === undefined || raw.trim() === '') return 0;
    const n = Number(raw);
    return Number.isInteger(n) && n >= 1 ? n : 0;
}

const RATE_KEY_FALLBACK = 'unknown';

export interface RfqRateKeyInput {
    /** Raw `x-forwarded-for` header value (untrusted input). */
    xff?: string | null;
    /** Socket/remote peer address, when the runtime exposes one. */
    remoteAddr?: string | null;
    /** Trusted appending-proxy count (see getRfqTrustedProxyHops). */
    trustedProxyHops?: number;
}

/**
 * Derive the rate-limit key from trusted sources only (F1). Never keys on a
 * client-controlled header value unless rightmost-untrusted-hop extraction
 * under a configured trusted-proxy chain proves it safe.
 */
export function rfqRateKey(input: RfqRateKeyInput): string {
    const hops = input.trustedProxyHops ?? 0;
    if (hops >= 1) {
        const parts = (input.xff ?? '')
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);
        if (parts.length >= hops) return parts[parts.length - hops] ?? RATE_KEY_FALLBACK;
    }
    if (input.remoteAddr) return input.remoteAddr;
    return RATE_KEY_FALLBACK;
}
