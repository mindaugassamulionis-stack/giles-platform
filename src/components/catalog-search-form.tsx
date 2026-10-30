'use client';

import { useState } from 'react';
import { Search, Wrench } from 'lucide-react';
import { useLocale } from 'next-intl';
import { assetUrl } from '../lib/api';
import { normalizeMultiSkuPaste } from '../lib/v3-description';
import {
    recordSearchQuery,
    openVytautasWithContext,
} from '../lib/customer-journey-tracker';

export function CatalogSearchForm({
    defaultQuery = '',
    placeholder,
    searchLabel,
    brand,
    category,
    price,
    sort,
    inStock,
}: {
    defaultQuery?: string;
    placeholder: string;
    searchLabel: string;
    brand?: string;
    category?: string;
    price?: string;
    sort?: string;
    inStock?: string;
}) {
    const [value, setValue] = useState(defaultQuery);
    const locale = useLocale();

    function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
        const text = e.clipboardData?.getData('text');
        if (text && /[\r\n;\t]/.test(text)) {
            e.preventDefault();
            setValue(normalizeMultiSkuPaste(text));
        }
    }

    function handleSubmit() {
        const trimmed = value.trim();
        if (trimmed.length >= 2) {
            recordSearchQuery(trimmed);
        }
    }

    function handleAskVytautas() {
        const trimmed = value.trim();
        if (trimmed.length >= 2) {
            recordSearchQuery(trimmed);
        }
        const promptText = trimmed.length >= 2
            ? `Ieškau: ${trimmed}. Ką rekomenduojate išsirinkti ir kokie priedai būtini pilnam sumontavimui?`
            : 'Padėkite išsirinkti ir sukomplektuoti ŠVOK įrangą iš katalogo.';
        openVytautasWithContext({
            prompt: promptText,
            title: trimmed ? `Katalogo paieška: ${trimmed}` : 'Katalogo konsultacija',
            summary: promptText,
            autoSend: true,
        });
    }

    const actionPath = locale === 'en' ? '/en/products' : '/lt/products';

    return (
        <form
            action={assetUrl(actionPath)}
            method="get"
            onSubmit={handleSubmit}
            className="w-full"
            role="search"
        >
            {brand ? <input type="hidden" name="brand" value={brand} /> : null}
            {category ? <input type="hidden" name="category" value={category} /> : null}
            {price ? <input type="hidden" name="price" value={price} /> : null}
            {sort ? <input type="hidden" name="sort" value={sort} /> : null}
            {inStock ? <input type="hidden" name="inStock" value={inStock} /> : null}
            <div className="flex flex-col sm:flex-row gap-2">
                <div className="flex flex-1 gap-1.5">
                    <div className="relative group flex-1 min-w-0">
                        <Search
                            className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                            aria-hidden="true"
                        />
                        <input
                            type="search"
                            name="q"
                            placeholder={placeholder}
                            value={value}
                            onChange={(e) => setValue(e.target.value)}
                            onPaste={handlePaste}
                            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-sm text-stone-900 placeholder:text-slate-600 focus:outline-none focus:border-[var(--primary)] transition-colors text-xs sm:text-sm"
                        />
                    </div>
                    <button
                        type="submit"
                        aria-label={searchLabel}
                        className="px-3.5 py-2 bg-[var(--brand-accent)] hover:bg-[var(--brand-accent-hover)] text-white font-bold text-xs sm:text-sm rounded-sm transition-colors shrink-0 cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--primary)]"
                    >
                        Ieškoti
                    </button>
                </div>
                <button
                    type="button"
                    onClick={handleAskVytautas}
                    className="bg-transparent p-0 border-0 shrink-0 cursor-pointer"
                >
                    <span className="px-3 py-2 bg-white border border-stone-900 hover:bg-stone-100 text-stone-900 text-xs font-semibold rounded-sm transition-colors flex items-center justify-center gap-1.5">
                        <Wrench className="w-3.5 h-3.5 text-[var(--primary)] shrink-0" aria-hidden="true" />
                        <span>Klausti inžinieriaus Vytauto (AI)</span>
                    </span>
                </button>
            </div>
        </form>
    );
}
