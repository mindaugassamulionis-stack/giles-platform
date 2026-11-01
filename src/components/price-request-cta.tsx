'use client';

import { useLocale } from 'next-intl';
import { usePathname } from 'next/navigation';
import { MessageSquare } from 'lucide-react';
import { resolveAppLocale } from '../i18n/storefront-ui-copy';
import type { AppLocale } from '../i18n/routing';
import { PRICE_REQUEST_COPY } from '../lib/w121-honest-commerce';
import { openVytautasWithContext } from '../lib/customer-journey-tracker';

// W121-A2: single CTA for priceless catalog rows — opens the existing
// Vytautas handoff prefilled with the SKU (15-minute quote promise).
export function PriceRequestCta({
    sku,
    title,
    compact = false,
    testId = 'price-request-cta',
}: {
    sku: string;
    title?: string;
    compact?: boolean;
    testId?: string;
}) {
    const intlLocale = useLocale();
    const rawPathname = usePathname() || '';
    const urlLocaleMatch = rawPathname.match(/^\/(lt|en|pl|ru)(?=\/|$)/i);
    const locale: AppLocale = resolveAppLocale(urlLocaleMatch ? urlLocaleMatch[1] : intlLocale);
    const copy = PRICE_REQUEST_COPY[locale];

    return (
        <button
            type="button"
            data-testid={testId}
            onClick={() =>
                openVytautasWithContext({
                    sku,
                    title,
                    prompt: copy.chatPrompt(sku, title),
                    summary: copy.chatPrompt(sku, title),
                    autoSend: true,
                })
            }
            className={`inline-flex items-center justify-center gap-2 rounded-sm border-2 border-[var(--brand-accent)] bg-white font-bold text-[var(--brand-accent)] transition-colors duration-150 hover:bg-[var(--brand-accent)] hover:text-[var(--primary-foreground)] cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--ring)] ${
                compact ? 'px-3 py-2 text-xs min-h-[44px]' : 'px-6 py-3 text-sm min-h-[44px] w-full sm:w-auto'
            }`}
        >
            <MessageSquare className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{copy.cta}</span>
        </button>
    );
}
