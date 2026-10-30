'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, ArrowRight, FileText, ShoppingBag, Sparkles, Wrench } from 'lucide-react';
import Link from 'next/link';
import { useSearchStore } from '../store/search';
import { useTranslations } from 'next-intl';
import { assetUrl } from '../lib/api';
import { apiUrl } from '../lib/api';
import {
    resolveProductImageUrl,
    resolveBrandLogo,
    formatCleanCatalogProductTitle,
} from '../lib/product-visuals';
import {
    recordSearchQuery,
    openVytautasWithContext,
} from '../lib/customer-journey-tracker';
import { useStorefrontConfig } from './storefront-config-provider';

interface SearchResult {
    id: string;
    name: string;
    price: number;
    image: string | null;
    brand: string | null;
    sku: string;
}

const SUGGESTIONS = ['Danfoss', 'Heimeier', 'Statico', 'Zeparo', 'DN15', 'kolektorius'];

export interface InstantSearchAdvisorHint {
    summary: string;
    chips: Array<{ label: string; query: string }>;
}

export function buildInstantVytautasSearchGuidance(
    rawQuery: string,
    resultCount: number,
    agentName = 'Vytautas',
): InstantSearchAdvisorHint {
    const q = rawQuery.trim();
    const lower = q.toLowerCase();

    if (/kolekt|grind|dynacon|pavar|rotametr|eurokon/i.test(lower)) {
        return {
            summary: `Pagal paiešką „${q}“ ${agentName} atrinko grindinio šildymo kolektorius ir priedus (${resultCount} poz.). Patikslinkite kontūrų skaičių arba pasirinkite reikiamą mazgo dalį:`,
            chips: [
                { label: '4–6 kontūrai', query: 'Dynacon Eclipse 6' },
                { label: '8–12 kontūrų', query: 'Dynacon Eclipse 8' },
                { label: 'Pavaros 230V', query: 'EMO T 230V' },
                { label: 'Eurokonusai 3/4"', query: 'Eurokonusas' },
            ],
        };
    }

    if (/galvut|vožtuv|voztuv|radiator|click|m30|eclipse|multilux|rlv|ra-n/i.test(lower)) {
        return {
            summary: `Pagal paiešką „${q}“ ${agentName} atrinko radiatorių termostatiką (${resultCount} poz.). Pasirinkite savo vožtuvo jungties standartą arba pajungimo tipą:`,
            chips: [
                { label: 'Danfoss RA Click (23 mm)', query: '013G2970' },
                { label: 'Heimeier M30×1,5', query: '6000-00.500' },
                { label: 'Eclipse AFC', query: '3933-02.000' },
                { label: 'Apatinis VK H-blokas', query: 'Multilux' },
            ],
        };
    }

    if (/indas|indo|pneumatex|statico|aquapresso|slėg|sleg|zeparo/i.test(lower)) {
        return {
            summary: `Pagal paiešką „${q}“ ${agentName} atrinko slėgio palaikymo ir nuorinimo įrangą (${resultCount} poz.). Pasirinkite paskirtį (šildymui ar geriamam vandeniui):`,
            chips: [
                { label: 'Šildymui (Statico)', query: 'Statico SD' },
                { label: 'Boileriui (Aquapresso)', query: 'Aquapresso' },
                { label: 'DLV atjungimo vožtuvas', query: 'DLV' },
                { label: 'Tvirtinimo konsolės', query: 'Statico konsolė' },
            ],
        };
    }

    return {
        summary: `Pagal paiešką „${q}“ ${agentName} rado ${resultCount} inžinerines pozicijas kataloge. Pasirinkite gamintoją arba tęskite komplektavimą su konsultantu:`,
        chips: [
            { label: 'Danfoss', query: 'Danfoss' },
            { label: 'IMI Heimeier', query: 'Heimeier' },
            { label: 'IMI Pneumatex', query: 'Pneumatex' },
            { label: 'IMI TA', query: 'IMI TA STAD' },
        ],
    };
}

export function SearchOverlay() {
    const t = useTranslations();
    const { storeId, features, persona } = useStorefrontConfig();
    const agentName = persona.agentName || 'Vytautas';
    const { isOpen, closeSearch } = useSearchStore();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    // Auto-focus input
    useEffect(() => {
        if (isOpen && inputRef.current) {
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    // Debounced Search + Customer Journey Tracking
    useEffect(() => {
        const timer = setTimeout(async () => {
            const trimmed = query.trim();
            if (trimmed.length < 2) {
                setResults([]);
                return;
            }

            setIsLoading(true);
            try {
                const storeQuery = storeId && storeId !== 'default' ? `&storeId=${encodeURIComponent(storeId)}` : '';
                const res = await fetch(apiUrl(`/api/search?q=${encodeURIComponent(trimmed)}${storeQuery}`));
                const data = await res.json();
                const list: SearchResult[] = Array.isArray(data.results) ? data.results : [];
                setResults(list);
                if (features.customerJourneyTracker) {
                    recordSearchQuery(trimmed, list.length);
                }
            } catch (err) {
                console.error(err);
                if (features.customerJourneyTracker) {
                    recordSearchQuery(trimmed, 0);
                }
            } finally {
                setIsLoading(false);
            }
        }, 260);

        return () => clearTimeout(timer);
    }, [query, storeId, features.customerJourneyTracker]);

    const guidance =
        features.instantAiSearch && query.trim().length >= 2
            ? buildInstantVytautasSearchGuidance(query, results.length, agentName)
            : null;

    function handleConsultVytautas() {
        const q = query.trim();
        const promptText = q.length >= 2
            ? `Ieškau: ${q}. Ką rekomenduojate išsirinkti ir kokie priedai būtini pilnam sumontavimui?`
            : 'Padėkite išsirinkti ir sukomplektuoti ŠVOK įrangą pagal mano poreikį.';
        if (q.length >= 2) {
            recordSearchQuery(q, results.length);
        }
        closeSearch();
        openVytautasWithContext({
            prompt: promptText,
            title: q ? `Paieška: ${q}` : 'Paieškos konsultacija',
            summary: promptText,
            recommendedSkus: results.slice(0, 3).map((r) => r.sku).filter(Boolean),
            autoSend: true,
        });
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex flex-col md:flex-row">
                    {/* Left Panel (Search Input + Quick Tags + RFQ) */}
                    <motion.div
                        initial={{ opacity: 0, x: '-100%' }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: '-100%' }}
                        transition={{ duration: 0.15, ease: 'easeOut' }}
                        className="w-full md:w-1/2 bg-[var(--foreground)] text-white p-6 md:p-14 flex flex-col justify-center relative shrink-0"
                    >
                        <button
                            onClick={closeSearch}
                            aria-label={t('nav.search')}
                            className="absolute top-6 left-6 p-2.5 hover:bg-white/10 rounded-sm transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--ring)]"
                        >
                            <X className="w-6 h-6" />
                        </button>

                        <div className="max-w-md w-full mx-auto pt-8 md:pt-0">
                            <label className="text-sm font-mono text-[var(--secondary)] mb-3 block">
                                {t('search.title')}
                            </label>
                            <div className="relative border-b-2 border-white/20 focus-within:border-[var(--secondary)] transition-colors">
                                <Search className="absolute left-0 top-1/2 -translate-y-1/2 w-7 h-7 text-white/40" />
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder={t('search.placeholder')}
                                    aria-label={t('search.title')}
                                    className="w-full bg-transparent text-2xl md:text-4xl font-bold py-3.5 pl-11 pr-4 outline-none placeholder:text-white/25"
                                />
                            </div>

                            {/* Code/brand examples */}
                            <div className="mt-6 flex flex-wrap gap-2">
                                {SUGGESTIONS.map((tag) => (
                                    <button
                                        key={tag}
                                        type="button"
                                        onClick={() => setQuery(tag)}
                                        className="px-3.5 py-1.5 rounded-sm border border-white/15 font-mono text-xs md:text-sm hover:bg-white/10 hover:border-[var(--secondary)]/50 transition-colors duration-150"
                                    >
                                        {tag}
                                    </button>
                                ))}
                            </div>

                            {/* RFQ fallback */}
                            <div className="mt-8 p-5 bg-[var(--text-primary)] border border-[var(--secondary)]/30 rounded-md">
                                <div className="flex items-center gap-2.5 mb-1.5 text-[var(--secondary)]">
                                    <FileText className="w-4 h-4" />
                                    <span className="font-semibold text-sm">{t('search.needAdvice')}</span>
                                </div>
                                <p className="text-slate-300 text-xs md:text-sm mb-3">
                                    {t('search.aiDesc')}
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {features.vytautasWidget && (
                                        <button
                                            type="button"
                                            onClick={handleConsultVytautas}
                                            className="w-full py-2.5 px-3 bg-[var(--secondary)] text-white rounded-sm font-bold text-xs text-center hover:bg-[var(--brand-secondary-hover)] transition-colors duration-150 flex items-center justify-center gap-1.5"
                                        >
                                            <Wrench className="w-3.5 h-3.5" />
                                            <span>Klausti {agentName} gyvai →</span>
                                        </button>
                                    )}
                                    <Link
                                        href={query ? `/uzklausa?kodas=${encodeURIComponent(query)}` : '/uzklausa'}
                                        onClick={closeSearch}
                                        className="block w-full py-2.5 px-3 bg-[var(--primary)] text-white rounded-sm font-bold text-xs text-center hover:bg-[var(--brand-accent-hover)] transition-colors duration-150"
                                    >
                                        {t('search.askRfq')}
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Right Panel (Instant AI Search Advisor + Live Product Results) */}
                    <motion.div
                        initial={{ opacity: 0, x: '100%' }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: '100%' }}
                        transition={{ duration: 0.15, ease: 'easeOut' }}
                        className="flex-1 md:w-1/2 bg-card text-foreground p-6 md:p-12 overflow-y-auto"
                    >
                        <div className="max-w-lg w-full mx-auto space-y-6">
                            {/* Instant Vytautas AI Search Advisor Card */}
                            {guidance && (
                                <div
                                    data-testid="instant-vytautas-search-advisor"
                                    className="bg-[var(--muted)] border-2 border-[var(--secondary)] rounded-md p-4 shadow-sm space-y-3"
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider font-bold text-[var(--brand-secondary)]">
                                            <Sparkles className="w-3.5 h-3.5 text-[var(--secondary)] shrink-0" />
                                            {agentName === 'Vytautas'
                                                ? 'Vytautas: Greitas paieškos patarimas ir patikslinimas'
                                                : `${agentName}: Greitas paieškos patarimas ir patikslinimas`}
                                        </span>
                                        <span className="font-mono text-[10px] uppercase bg-[var(--foreground)] text-white px-2 py-0.5 rounded-xs font-bold">
                                            AI paieška
                                        </span>
                                    </div>
                                    <p className="text-xs text-[var(--foreground)] leading-relaxed">
                                        {guidance.summary}
                                    </p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {guidance.chips.map((chip) => (
                                            <button
                                                key={chip.label}
                                                type="button"
                                                onClick={() => setQuery(chip.query)}
                                                className="px-2.5 py-1 bg-[var(--surface-card)] border border-[var(--border)] hover:border-[var(--secondary)] hover:bg-[var(--surface-paper)] text-[var(--foreground)] rounded-xs font-mono text-[11px] font-semibold transition-colors"
                                            >
                                                {chip.label}
                                            </button>
                                        ))}
                                    </div>
                                    {features.vytautasWidget && (
                                        <button
                                            type="button"
                                            onClick={handleConsultVytautas}
                                            className="w-full py-2 px-3 bg-[var(--foreground)] hover:bg-[var(--primary)] text-white rounded-sm font-mono text-xs font-bold flex items-center justify-between transition-colors"
                                        >
                                            <span>
                                                {agentName === 'Vytautas'
                                                    ? 'Klausti Vytauto patarimo pagal šią paiešką →'
                                                    : `Tęsti pokalbį su ${agentName} →`}
                                            </span>
                                            <span className="text-[10px] text-[var(--secondary)] font-normal hidden sm:inline">
                                                Tęsti paiešką ir komplektavimą su {agentName} →
                                            </span>
                                        </button>
                                    )}
                                </div>
                            )}

                            {isLoading ? (
                                <div className="flex items-center justify-center py-16 text-sm text-[var(--muted-foreground)]" role="status" aria-live="polite">
                                    {t('common.loading')}
                                </div>
                            ) : results.length > 0 ? (
                                <div className="space-y-4">
                                    <h3 className="text-muted-foreground font-mono text-xs uppercase tracking-widest">
                                        {t('catalogPage.found')} {results.length} {t('catalogPage.results')}
                                    </h3>
                                    {results.map((product) => {
                                        const brandInfo = resolveBrandLogo(
                                            product.brand,
                                            product.name,
                                        );
                                        const cleanName = formatCleanCatalogProductTitle(
                                            product.name,
                                            product.sku,
                                            brandInfo.name,
                                        );
                                        const resolvedImg = resolveProductImageUrl({
                                            sku: product.sku,
                                            title: cleanName,
                                            brand: brandInfo.name,
                                            imageUrl: product.image,
                                        });
                                        return (
                                            <Link
                                                key={product.id}
                                                href={`/products/${product.id}`}
                                                onClick={closeSearch}
                                                className="flex items-center gap-4 p-3 rounded-sm border border-border bg-white hover:border-[var(--secondary)] transition-colors group"
                                            >
                                                <div className="w-16 h-16 bg-white rounded-[2px] flex items-center justify-center relative overflow-hidden shrink-0 border border-slate-200 p-1">
                                                    {resolvedImg ? (
                                                        <img
                                                            src={assetUrl(resolvedImg)}
                                                            alt={cleanName}
                                                            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-150"
                                                        />
                                                    ) : (
                                                        <ShoppingBag className="w-6 h-6 text-muted-foreground/40" />
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <img
                                                            src={assetUrl(brandInfo.logoPath)}
                                                            alt={brandInfo.name}
                                                            className="h-3.5 w-auto object-contain"
                                                        />
                                                        {product.sku && (
                                                            <span className="font-mono text-[10px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded-xs">
                                                                SKU: {product.sku}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <h4 className="text-sm font-display font-bold text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors duration-150 leading-snug">
                                                        {cleanName}
                                                    </h4>
                                                    <p className="font-mono text-sm font-extrabold text-[var(--foreground)] mt-0.5">
                                                        {product.price.toFixed(2)} €
                                                    </p>
                                                </div>
                                                <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-[var(--secondary)] group-hover:translate-x-0.5 transition-all duration-150 shrink-0" />
                                            </Link>
                                        );
                                    })}
                                </div>
                            ) : query.length > 1 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-center">
                                    <Search
                                        className="w-12 h-12 mb-3 text-muted-foreground/40"
                                        strokeWidth={1.5}
                                        aria-hidden="true"
                                    />
                                    <h3 className="text-lg font-display font-bold mb-1">
                                        {t('catalogPage.noResults')}
                                    </h3>
                                    <p className="text-muted-foreground text-sm max-w-xs mx-auto">
                                        {t('search.noResults')}
                                    </p>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
                                    <Search className="w-14 h-14 mb-4" strokeWidth={1.5} aria-hidden="true" />
                                    <p className="text-base font-medium">{t('search.startTyping')}</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
