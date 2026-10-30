import type { IndustrialModel, ModelsFile } from './types';

export interface ValidationReport {
    errors: string[];
    conflicts: string[];
    assumptions: string[];
    missing: string[];
}

export function validateModels(file: ModelsFile): ValidationReport {
    const r: ValidationReport = { errors: [], conflicts: [], assumptions: [], missing: [] };
    const slugs = new Set<string>();
    const codes = new Set<string>();
    for (const m of file.models) {
        if (slugs.has(m.slug)) r.errors.push(`Dubliuotas slug: ${m.slug}`);
        if (codes.has(m.code)) r.errors.push(`Dubliuotas kodas: ${m.code}`);
        slugs.add(m.slug);
        codes.add(m.code);
        if (!/^[a-z0-9-]+$/.test(m.slug)) r.errors.push(`Netinkamas slug: ${m.slug}`);
        if (!m.power_kw.value?.nominal) r.errors.push(`${m.code}: nėra vardinės galios`);
        if (
            m.segment === 'buy' &&
            m.price_net_eur.value === null &&
            m.price_net_eur.source !== 'owner-input'
        ) {
            r.errors.push(`${m.code}: pirkimo modelis be kainos ir be owner-input žymės`);
        }
        for (const [key, v] of Object.entries(m) as [string, unknown][]) {
            if (!v || typeof v !== 'object' || !('source' in (v as object))) continue;
            const s = v as { source: string; note?: string; value: unknown };
            if (s.note?.includes('KONFLIKTAS')) r.conflicts.push(`${m.code}.${key}: ${s.note}`);
            if (s.source === 'assumption') {
                r.assumptions.push(`${m.code}.${key}${s.note ? ' – ' + s.note : ''}`);
            }
            if (s.source === 'owner-input') r.missing.push(`${m.code}.${key}`);
        }
    }
    return r;
}

export type { IndustrialModel };
