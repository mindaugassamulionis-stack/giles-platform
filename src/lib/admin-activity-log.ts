import fs from 'fs';
import path from 'path';
import { readJsonAtomic, writeJsonAtomic } from './transactional-store';

// W123-A1: chatter-style audit log for product/price mutations, shared by the
// admin UI route and the MCP tool path through saveCatalogOverrides.

export interface AdminActivityEntry {
    ts: string;
    actor: string;
    entity: string;
    sku: string;
    field: string;
    before: unknown;
    after: unknown;
    source: string;
}

export interface AdminAuditContext {
    actor?: string;
    source?: string;
}

export const ACTIVITY_LOG_MAX_ENTRIES = 500;
export const ACTIVITY_LOG_PANEL_LIMIT = 200;

const ACTIVITY_LOG_CANDIDATES = [
    path.resolve(process.cwd(), 'src/data/activity-log.json'),
    path.resolve(__dirname, '../data/activity-log.json'),
];

export function resolveActivityLogPath(explicit?: string): string {
    if (explicit) return path.resolve(explicit);
    if (process.env.VITEST) {
        return `/tmp/giles-activity-log-vitest-${process.pid}-${process.env.VITEST_POOL_ID || process.env.VITEST_WORKER_ID || '0'}.json`;
    }
    return (
        ACTIVITY_LOG_CANDIDATES.find((p) => fs.existsSync(p)) ||
        path.resolve(process.cwd(), 'src/data/activity-log.json')
    );
}

export function readActivityLog(opts?: { filePath?: string }): AdminActivityEntry[] {
    const entries = readJsonAtomic<AdminActivityEntry[]>(resolveActivityLogPath(opts?.filePath), []);
    return Array.isArray(entries) ? entries : [];
}

export function appendActivityEntries(
    newEntries: AdminActivityEntry[],
    opts?: { filePath?: string },
): AdminActivityEntry[] {
    if (!newEntries.length) return readActivityLog(opts);
    const filePath = resolveActivityLogPath(opts?.filePath);
    const current = readJsonAtomic<AdminActivityEntry[]>(filePath, []);
    const merged = [...(Array.isArray(current) ? current : []), ...newEntries].slice(
        -ACTIVITY_LOG_MAX_ENTRIES,
    );
    return writeJsonAtomic<AdminActivityEntry[]>(filePath, merged);
}

export function filterActivityLog(
    entries: AdminActivityEntry[],
    filter: { sku?: string; actor?: string; source?: string; limit?: number },
): AdminActivityEntry[] {
    const sku = (filter.sku || '').trim().toLowerCase();
    const actor = (filter.actor || '').trim().toLowerCase();
    const source = (filter.source || '').trim().toLowerCase();
    const limit = filter.limit ?? ACTIVITY_LOG_PANEL_LIMIT;
    const filtered = entries.filter((e) => {
        if (sku && !String(e.sku || '').toLowerCase().includes(sku)) return false;
        if (actor && !String(e.actor || '').toLowerCase().includes(actor)) return false;
        if (source && !String(e.source || '').toLowerCase().includes(source)) return false;
        return true;
    });
    return filtered.slice(-limit).reverse();
}

// Minimal structural types: keeps the diff pure without importing the snapshot module (no cycle).
interface OverrideLike {
    sku?: string;
    priceGrossEur?: number;
    price?: number;
    costPriceEur?: number;
    costEur?: number;
    stockQuantity?: number;
    stock?: number;
    published?: boolean;
    active?: boolean;
    name?: string;
    title?: string;
    category?: string;
}

interface OverrideStoreLike {
    overrides: Record<string, OverrideLike>;
    customProducts: Array<OverrideLike & { id?: string }>;
}

function overridePrice(ovr: OverrideLike | undefined): number | undefined {
    if (!ovr) return undefined;
    if (ovr.priceGrossEur != null) return ovr.priceGrossEur;
    if (ovr.price != null) return ovr.price;
    return undefined;
}

function overrideStock(ovr: OverrideLike | undefined): number | undefined {
    if (!ovr) return undefined;
    if (ovr.stockQuantity != null) return ovr.stockQuantity;
    if (ovr.stock != null) return ovr.stock;
    return undefined;
}

function overridePublished(ovr: OverrideLike | undefined): boolean | undefined {
    if (!ovr) return undefined;
    if (ovr.published != null) return ovr.published;
    if (ovr.active != null) return ovr.active;
    return undefined;
}

function overrideName(ovr: OverrideLike | undefined): string | undefined {
    if (!ovr) return undefined;
    return ovr.name ?? ovr.title;
}

export function diffOverrideStores(
    prev: OverrideStoreLike,
    next: OverrideStoreLike,
    ctx?: AdminAuditContext,
): AdminActivityEntry[] {
    const actor = ctx?.actor || 'Admin OS';
    const source = ctx?.source || 'admin';
    const ts = new Date().toISOString();
    const entries: AdminActivityEntry[] = [];

    const push = (sku: string, field: string, before: unknown, after: unknown) => {
        entries.push({ ts, actor, entity: 'product', sku, field, before, after, source });
    };

    for (const [key, nextOvr] of Object.entries(next.overrides || {})) {
        const prevOvr = (prev.overrides || {})[key];
        const sku = nextOvr?.sku || prevOvr?.sku || key;
        if (!prevOvr) {
            push(sku, 'created', null, overridePrice(nextOvr) ?? null);
            continue;
        }
        const fields: Array<[string, (o: OverrideLike | undefined) => unknown]> = [
            ['priceGrossEur', overridePrice],
            ['costPriceEur', (o) => (o ? o.costPriceEur ?? o.costEur ?? undefined : undefined)],
            ['stockQuantity', overrideStock],
            ['published', overridePublished],
            ['name', overrideName],
            ['category', (o) => o?.category],
        ];
        for (const [field, read] of fields) {
            const before = read(prevOvr);
            const after = read(nextOvr);
            if (after === undefined) continue;
            if (String(before) !== String(after)) {
                push(sku, field, before ?? null, after);
            }
        }
    }

    const prevCustomSkus = new Set((prev.customProducts || []).map((c) => String(c.sku || '').toLowerCase()));
    for (const prod of next.customProducts || []) {
        if (!prevCustomSkus.has(String(prod.sku || '').toLowerCase())) {
            entries.push({
                ts,
                actor,
                entity: 'product',
                sku: String(prod.sku || ''),
                field: 'created',
                before: null,
                after: prod.priceGrossEur ?? null,
                source,
            });
        }
    }

    return entries;
}
