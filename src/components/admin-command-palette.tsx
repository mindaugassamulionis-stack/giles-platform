'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Search, CornerDownLeft, ArrowUp, ArrowDown, Pin, PinOff } from 'lucide-react';
import { assetUrl } from '../lib/api';

// W123-A1: cmdk-pattern command palette, custom lightweight React (no new deps).

export interface AdminPaletteTabDef {
    id: string;
    label: string;
}

interface AdminPaletteProduct {
    sku: string;
    name: string;
    brandName: string;
}

interface AdminPaletteAccount {
    id: string;
    companyName: string;
    status: string;
    contactPerson: string;
}

interface AdminPaletteInvoice {
    id: string;
    invoiceNumber: string;
    buyerName: string;
    totalGrossEur: number;
}

interface PaletteItem {
    id: string;
    kind: 'tab' | 'product' | 'b2b' | 'invoice' | 'action';
    title: string;
    subtitle: string;
    haystack: string;
    perform: () => void;
}

const RECENT_KEY = 'giles-admin-palette-recent-v1';
const PINNED_KEY = 'giles-admin-palette-pinned-v1';
const RECENT_LIMIT = 8;

function readIdList(key: string): string[] {
    try {
        const raw = window.localStorage.getItem(key);
        const parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed.filter((v) => typeof v === 'string') : [];
    } catch {
        return [];
    }
}

function writeIdList(key: string, ids: string[]): void {
    try {
        window.localStorage.setItem(key, JSON.stringify(ids.slice(0, 24)));
    } catch {
        // ignore quota errors
    }
}

// Subsequence fuzzy score: higher is better, null means no match.
function fuzzyScore(query: string, text: string): number | null {
    const q = query.toLowerCase().trim();
    const t = text.toLowerCase();
    if (!q) return 1;
    const direct = t.indexOf(q);
    if (direct >= 0) return 1000 - direct;
    let qi = 0;
    let score = 0;
    let streak = 0;
    for (let ti = 0; ti < t.length && qi < q.length; ti++) {
        if (t[ti] === q[qi]) {
            qi++;
            streak++;
            score += 10 + streak * 2;
        } else {
            streak = 0;
        }
    }
    return qi === q.length ? score : null;
}

export function AdminCommandPalette({
    tabs,
    onNavigateTab,
}: {
    tabs: AdminPaletteTabDef[];
    onNavigateTab: (tabId: string) => void;
}) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [activeIndex, setActiveIndex] = useState(0);
    const [recent, setRecent] = useState<string[]>([]);
    const [pinned, setPinned] = useState<string[]>([]);
    const [products, setProducts] = useState<AdminPaletteProduct[]>([]);
    const [accounts, setAccounts] = useState<AdminPaletteAccount[]>([]);
    const [invoices, setInvoices] = useState<AdminPaletteInvoice[]>([]);
    const [notice, setNotice] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setRecent(readIdList(RECENT_KEY));
        setPinned(readIdList(PINNED_KEY));
    }, []);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                setOpen((prev) => !prev);
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);

    useEffect(() => {
        if (open) {
            setQuery('');
            setActiveIndex(0);
            setNotice('');
            // Focus after the dialog mounts.
            setTimeout(() => inputRef.current?.focus(), 0);
            fetch(assetUrl('/api/b2b/accounts'))
                .then((r) => r.json())
                .then((d) => {
                    if (Array.isArray(d?.accounts)) setAccounts(d.accounts.slice(0, 30));
                })
                .catch(() => {});
            fetch(assetUrl('/api/accounting/skaita'))
                .then((r) => r.json())
                .then((d) => {
                    if (Array.isArray(d?.invoices)) setInvoices(d.invoices.slice(0, 20));
                })
                .catch(() => {});
        }
    }, [open]);

    useEffect(() => {
        if (!open || query.trim().length < 2) {
            setProducts([]);
            return;
        }
        const handle = setTimeout(() => {
            fetch(assetUrl(`/api/admin/products?q=${encodeURIComponent(query.trim())}&limit=8`))
                .then((r) => r.json())
                .then((d) => {
                    if (Array.isArray(d?.items)) setProducts(d.items);
                })
                .catch(() => {});
        }, 150);
        return () => clearTimeout(handle);
    }, [query, open]);

    const goProduct = useCallback(
        (sku: string) => {
            onNavigateTab('catalog');
            window.dispatchEvent(
                new CustomEvent('giles-admin:focus-product', { detail: { sku } }),
            );
        },
        [onNavigateTab],
    );

    const runReminderCheck = useCallback(async () => {
        try {
            const res = await fetch(assetUrl('/api/admin/copilot'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ commandId: 'unpaid_and_b2b_summary' }),
            });
            const data = await res.json();
            setNotice(
                data?.ok
                    ? 'Priminimų patikra paleista: nesumokėtos sąskaitos ir B2B santrauka paruoštos apatiniame kopiloto skydelyje.'
                    : 'Priminimų patikros nepavyko paleisti, bandykite dar kartą.',
            );
        } catch {
            setNotice('Priminimų patikros nepavyko paleisti (tinklo klaida).');
        }
    }, []);

    const scrollPricelistIntoView = useCallback(() => {
        onNavigateTab('catalog');
        setTimeout(() => {
            document
                .querySelector('[data-testid="admin-supplier-pricelist-import"]')
                ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 120);
    }, [onNavigateTab]);

    const items = useMemo<PaletteItem[]>(() => {
        const built: PaletteItem[] = [];

        for (const tab of tabs) {
            built.push({
                id: `tab:${tab.id}`,
                kind: 'tab',
                title: tab.label,
                subtitle: 'Admin OS modulis',
                haystack: `modulis ${tab.label}`,
                perform: () => onNavigateTab(tab.id),
            });
        }

        built.push(
            {
                id: 'action:reminder-check',
                kind: 'action',
                title: 'Paleisti priminimų patikrą',
                subtitle: 'Nesumokėtų sąskaitų ir B2B santrauka per AI kopilotą',
                haystack: 'priminimai remind nesumoketos b2b kopilotas',
                perform: () => {
                    void runReminderCheck();
                },
            },
            {
                id: 'action:new-quote',
                kind: 'action',
                title: 'Naujas komercinis pasiūlymas',
                subtitle: 'Atidaro sąskaitų išrašymo skyrių („Skaita“ ERP)',
                haystack: 'komercinis pasiulymas proforma saskaita quote invoice skaita',
                perform: () => onNavigateTab('skaita'),
            },
            {
                id: 'action:upload-pricelist',
                kind: 'action',
                title: 'Įkelti kainoraštį',
                subtitle: 'Tiekėjo kainoraščio importas (CSV) prekių kataloge',
                haystack: 'kainorastis importas csv upload pricelist tiekejas',
                perform: scrollPricelistIntoView,
            },
            {
                id: 'action:vytautas-log',
                kind: 'action',
                title: 'Vytauto pokalbių žurnalas',
                subtitle: 'AI agentų darbo ir pokalbių žurnalas',
                haystack: 'vytautas pokalbiu zurnalas agents ai log',
                perform: () => onNavigateTab('agents'),
            },
        );

        for (const p of products) {
            built.push({
                id: `product:${p.sku}`,
                kind: 'product',
                title: `${p.sku} · ${p.name}`,
                subtitle: `${p.brandName} · atidaryti prekių redaktoriuje`,
                haystack: `${p.sku} ${p.name} ${p.brandName}`,
                perform: () => goProduct(p.sku),
            });
        }

        for (const a of accounts) {
            built.push({
                id: `b2b:${a.id}`,
                kind: 'b2b',
                title: a.companyName,
                subtitle: `B2B paskyra · ${a.status === 'PENDING_APPROVAL' ? 'laukia patvirtinimo' : a.status} · ${a.contactPerson}`,
                haystack: `b2b ${a.companyName} ${a.contactPerson} ${a.status}`,
                perform: () => onNavigateTab('b2b'),
            });
        }

        for (const inv of invoices) {
            built.push({
                id: `invoice:${inv.id}`,
                kind: 'invoice',
                title: `${inv.invoiceNumber} · ${inv.buyerName}`,
                subtitle: `Sąskaita · ${Number(inv.totalGrossEur || 0).toFixed(2)} € su PVM`,
                haystack: `saskaita invoice ${inv.invoiceNumber} ${inv.buyerName}`,
                perform: () => onNavigateTab('skaita'),
            });
        }

        return built;
    }, [tabs, products, accounts, invoices, onNavigateTab, goProduct, runReminderCheck, scrollPricelistIntoView]);

    const ranked = useMemo(() => {
        const withScores = items
            .map((item) => ({ item, score: fuzzyScore(query, `${item.title} ${item.haystack}`) }))
            .filter((r): r is { item: PaletteItem; score: number } => r.score != null);
        withScores.sort((a, b) => b.score - a.score);
        const rankedItems = withScores.map((r) => r.item);
        // Empty query: pinned and recent first, then the module list.
        if (!query.trim()) {
            const pinnedSet = new Set(pinned);
            const recentOrder = new Map(recent.map((id, i) => [id, i]));
            return [...rankedItems].sort((a, b) => {
                const pa = pinnedSet.has(a.id) ? 1 : 0;
                const pb = pinnedSet.has(b.id) ? 1 : 0;
                if (pa !== pb) return pb - pa;
                const ra = recentOrder.has(a.id) ? recentOrder.get(a.id) as number : 999;
                const rb = recentOrder.has(b.id) ? recentOrder.get(b.id) as number : 999;
                if (ra !== rb) return ra - rb;
                return 0;
            });
        }
        return rankedItems;
    }, [items, query, pinned, recent]);

    useEffect(() => {
        setActiveIndex((prev) => Math.min(prev, Math.max(0, ranked.length - 1)));
    }, [ranked.length]);

    useEffect(() => {
        const el = listRef.current?.querySelector(`[data-palette-index="${activeIndex}"]`);
        el?.scrollIntoView({ block: 'nearest' });
    }, [activeIndex]);

    const rememberSelection = useCallback(
        (id: string) => {
            const nextRecent = [id, ...recent.filter((r) => r !== id)].slice(0, RECENT_LIMIT);
            setRecent(nextRecent);
            writeIdList(RECENT_KEY, nextRecent);
        },
        [recent],
    );

    const executeItem = useCallback(
        (item: PaletteItem) => {
            rememberSelection(item.id);
            item.perform();
            if (!item.id.startsWith('action:reminder-check')) {
                setOpen(false);
            }
        },
        [rememberSelection],
    );

    const onInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveIndex((prev) => (prev + 1) % Math.max(1, ranked.length));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveIndex((prev) => (prev - 1 + ranked.length) % Math.max(1, ranked.length));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            const item = ranked[activeIndex];
            if (item) executeItem(item);
        } else if (e.key === 'Escape') {
            e.preventDefault();
            setOpen(false);
        }
    };

    const togglePin = (id: string) => {
        const next = pinned.includes(id)
            ? pinned.filter((p) => p !== id)
            : [...pinned.filter((p) => p !== id), id];
        setPinned(next);
        writeIdList(PINNED_KEY, next);
    };

    const kindLabels: Record<PaletteItem['kind'], string> = {
        tab: 'Modulis',
        product: 'Prekė',
        b2b: 'B2B',
        invoice: 'Sąskaita',
        action: 'Veiksmas',
    };

    if (!open) {
        return (
            <button
                type="button"
                data-testid="admin-command-palette-trigger"
                onClick={() => setOpen(true)}
                className="h-10 px-3.5 rounded-lg bg-transparent border border-[#3A4652] hover:border-[#FF8A3D] text-[#C9D0D8] hover:text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors"
            >
                <Search className="w-3.5 h-3.5" />
                <span>Ieškoti (Ctrl+K)</span>
            </button>
        );
    }

    return (
        <div
            data-testid="admin-command-palette"
            role="dialog"
            aria-modal="true"
            aria-label="Admin paieška ir greitieji veiksmai"
            className="fixed inset-0 z-50 flex items-start justify-center bg-[#11161B]/60 p-4 pt-[8vh]"
            onClick={(e) => {
                if (e.target === e.currentTarget) setOpen(false);
            }}
        >
            <div className="w-full max-w-xl rounded-2xl border border-[#D5CFC3] bg-white shadow-xl overflow-hidden">
                <div className="flex items-center gap-2.5 border-b border-[#E2DDD3] px-4">
                    <Search className="w-4 h-4 text-[#5B6470] shrink-0" />
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={onInputKeyDown}
                        placeholder="Ieškoti modulių, prekių (SKU), B2B paskyrų, sąskaitų ar veiksmų..."
                        aria-label="Paieškos laukas"
                        className="w-full h-12 bg-transparent text-sm text-[#11161B] outline-none"
                    />
                    <button
                        type="button"
                        onClick={() => setOpen(false)}
                        className="h-7 px-2 rounded-md bg-transparent border border-[#D5CFC3] text-[#5B6470] text-xs font-semibold cursor-pointer"
                    >
                        Esc
                    </button>
                </div>

                {notice && (
                    <p className="px-4 py-2 text-xs font-semibold text-[#0F5A2B] bg-[#E3F1E8] border-b border-[#E2DDD3]">
                        {notice}
                    </p>
                )}

                <div ref={listRef} className="max-h-[52vh] overflow-y-auto py-1.5" data-testid="admin-command-palette-results">
                    {ranked.length === 0 ? (
                        <p className="px-4 py-6 text-xs text-[#5B6470]" data-testid="admin-command-palette-empty">
                            Rezultatų nėra. Bandykite SKU kodą, įmonės pavadinimą ar veiksmo pavadinimą.
                        </p>
                    ) : (
                        ranked.map((item, index) => (
                            <div
                                key={item.id}
                                data-palette-index={index}
                                className={`flex items-center gap-2.5 px-4 py-2 cursor-pointer ${
                                    index === activeIndex ? 'bg-[#FAF9F6]' : 'bg-transparent'
                                }`}
                                onMouseEnter={() => setActiveIndex(index)}
                                onClick={() => executeItem(item)}
                            >
                                <span className="w-16 shrink-0 text-[10px] font-bold uppercase tracking-wide text-[#5B6470]">
                                    {kindLabels[item.kind]}
                                </span>
                                <span className="min-w-0 flex-1">
                                    <span className="block text-xs font-bold text-[#11161B] truncate">
                                        {item.title}
                                    </span>
                                    <span className="block text-[11px] text-[#5B6470] truncate">
                                        {item.subtitle}
                                    </span>
                                </span>
                                <button
                                    type="button"
                                    aria-label={
                                        pinned.includes(item.id)
                                            ? `Atsegti ${item.title}`
                                            : `Prisegti ${item.title}`
                                    }
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        togglePin(item.id);
                                    }}
                                    className="h-7 w-7 shrink-0 inline-flex items-center justify-center rounded-md bg-transparent border border-transparent hover:border-[#D5CFC3] text-[#5B6470] hover:text-[#C2410C] cursor-pointer"
                                >
                                    {pinned.includes(item.id) ? (
                                        <PinOff className="w-3.5 h-3.5" />
                                    ) : (
                                        <Pin className="w-3.5 h-3.5" />
                                    )}
                                </button>
                                {index === activeIndex && (
                                    <CornerDownLeft className="w-3.5 h-3.5 text-[#C2410C] shrink-0" />
                                )}
                            </div>
                        ))
                    )}
                </div>

                <div className="flex items-center gap-4 border-t border-[#E2DDD3] px-4 py-2 text-[11px] text-[#5B6470]">
                    <span className="inline-flex items-center gap-1">
                        <ArrowUp className="w-3 h-3" />
                        <ArrowDown className="w-3 h-3" />
                        naršyti
                    </span>
                    <span className="inline-flex items-center gap-1">
                        <CornerDownLeft className="w-3 h-3" />
                        pasirinkti
                    </span>
                    <span>Esc uždaryti</span>
                </div>
            </div>
        </div>
    );
}
