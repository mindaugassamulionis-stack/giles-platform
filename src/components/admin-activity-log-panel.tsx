'use client';

import { useCallback, useEffect, useState } from 'react';
import { History } from 'lucide-react';
import { assetUrl } from '../lib/api';

// W123-A1: chatter-style audit panel for module 6. Reads the shared
// activity-log.json feed written by saveCatalogOverrides (admin + MCP paths).

interface AdminActivityEntry {
    ts: string;
    actor: string;
    entity: string;
    sku: string;
    field: string;
    before: unknown;
    after: unknown;
    source: string;
}

function formatValue(value: unknown): string {
    if (value === null || value === undefined) return '–';
    if (typeof value === 'number') return Number.isInteger(value) ? String(value) : value.toFixed(2);
    if (typeof value === 'boolean') return value ? 'TAIP' : 'NE';
    return String(value).slice(0, 40);
}

function formatTime(ts: string): string {
    try {
        return new Date(ts).toLocaleString('lt-LT', {
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        });
    } catch {
        return ts;
    }
}

export function AdminActivityLogPanel({ refreshKey }: { refreshKey: number }) {
    const [entries, setEntries] = useState<AdminActivityEntry[]>([]);
    const [skuFilter, setSkuFilter] = useState('');
    const [actorFilter, setActorFilter] = useState('');
    const [sourceFilter, setSourceFilter] = useState('');
    const [expanded, setExpanded] = useState(false);

    const fetchLog = useCallback(async () => {
        try {
            const params = new URLSearchParams({ activity: '1', limit: '200' });
            if (skuFilter.trim()) params.set('sku', skuFilter.trim());
            if (actorFilter.trim()) params.set('actor', actorFilter.trim());
            if (sourceFilter.trim()) params.set('source', sourceFilter.trim());
            const res = await fetch(assetUrl(`/api/admin/products?${params.toString()}`));
            const data = await res.json();
            if (data?.ok && Array.isArray(data.entries)) {
                setEntries(data.entries);
            }
        } catch {
            // keep previous entries on network failure
        }
    }, [skuFilter, actorFilter, sourceFilter]);

    useEffect(() => {
        fetchLog();
    }, [fetchLog, refreshKey]);

    return (
        <div
            data-testid="admin-activity-log"
            className="rounded-2xl border border-[#E2DDD3] bg-white p-4 space-y-3 text-xs"
        >
            <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <History className="w-4 h-4 text-[#C2410C]" />
                    <h4 className="text-sm font-extrabold text-[#11161B]">
                        Veiksmų žurnalas (paskutiniai {entries.length})
                    </h4>
                </div>
                <button
                    type="button"
                    onClick={() => setExpanded((prev) => !prev)}
                    className="h-8 px-3 rounded-lg bg-transparent border border-[#D5CFC3] hover:border-[#11161B] text-[#11161B] font-semibold cursor-pointer"
                >
                    {expanded ? 'Suskleisti' : 'Išskleisti filtrus'}
                </button>
            </div>

            {expanded && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                        type="text"
                        value={skuFilter}
                        onChange={(e) => setSkuFilter(e.target.value)}
                        placeholder="Filtruoti pagal SKU..."
                        aria-label="Filtruoti pagal SKU"
                        className="h-9 px-2.5 rounded-lg border border-[#D5CFC3] bg-[#FAF9F6] font-mono"
                    />
                    <input
                        type="text"
                        value={actorFilter}
                        onChange={(e) => setActorFilter(e.target.value)}
                        placeholder="Filtruoti pagal autorių..."
                        aria-label="Filtruoti pagal autorių"
                        className="h-9 px-2.5 rounded-lg border border-[#D5CFC3] bg-[#FAF9F6]"
                    />
                    <select
                        value={sourceFilter}
                        onChange={(e) => setSourceFilter(e.target.value)}
                        aria-label="Filtruoti pagal šaltinį"
                        className="h-9 px-2.5 rounded-lg border border-[#D5CFC3] bg-[#FAF9F6] font-semibold"
                    >
                        <option value="">Visi šaltiniai</option>
                        <option value="admin">Admin OS langas</option>
                        <option value="admin-bulk">Masinis redagavimas</option>
                        <option value="csv-import">CSV importas</option>
                        <option value="mcp">MCP agentas</option>
                    </select>
                </div>
            )}

            {entries.length === 0 ? (
                <p className="text-[#5B6470] py-3">
                    Žurnalo įrašų dar nėra. Pakeitimai prekių kainoms, likučiams ir būsenai
                    atsiras čia iškart po pirmo išsaugojimo (ir iš MCP kelio).
                </p>
            ) : (
                <div className="space-y-1.5 max-h-72 overflow-y-auto" data-testid="admin-activity-log-rows">
                    {entries.map((entry, i) => (
                        <div
                            key={`${entry.ts}-${entry.sku}-${entry.field}-${i}`}
                            className="rounded-lg border border-[#E2DDD3] bg-[#FAF9F6] px-3 py-2 flex flex-wrap items-center gap-x-3 gap-y-1"
                        >
                            <span className="font-mono text-[11px] text-[#5B6470] shrink-0">
                                {formatTime(entry.ts)}
                            </span>
                            <span className="font-mono font-bold text-[#C2410C] shrink-0">
                                {entry.sku || entry.entity}
                            </span>
                            <span className="text-[#11161B] font-semibold shrink-0">{entry.field}</span>
                            <span className="text-[#5B6470] shrink-0">
                                {formatValue(entry.before)} → {formatValue(entry.after)}
                            </span>
                            <span className="ml-auto flex items-center gap-2 shrink-0">
                                <span className="px-2 py-0.5 rounded-full bg-[#EDE9E0] text-[#5B6470] font-bold text-[10px]">
                                    {entry.source}
                                </span>
                                <span className="text-[#5B6470] text-[11px]">{entry.actor}</span>
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
