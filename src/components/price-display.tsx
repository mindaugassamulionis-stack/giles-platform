'use client';

import { usePathname } from 'next/navigation';
import { useLocale } from 'next-intl';
import { useVatDisplayStore } from '../store/vat-display';
import { priceDisplayPair } from '../lib/vat';
import { formatEurAmount } from '../lib/format';
import { resolveAppLocale } from '../i18n/storefront-ui-copy';
import type { AppLocale } from '../i18n/routing';
import { clsx } from 'clsx';

function eur(cents: number): string {
    return `${formatEurAmount(cents / 100)} €`;
}

const PRICE_DISPLAY_COPY: Record<
    AppLocale,
    { gross: string; net: string; onRequest: string }
> = {
    lt: { gross: 'su PVM', net: 'be PVM', onRequest: 'Kaina pagal užklausą' },
    en: { gross: 'Incl. VAT', net: 'Excl. VAT', onRequest: 'Price on request' },
    pl: { gross: 'z VAT', net: 'bez VAT', onRequest: 'Cena na zapytanie' },
    ru: { gross: 'с НДС', net: 'без НДС', onRequest: 'Цена по запросу' },
};

export function PriceDisplay({
    priceCents,
    vatRate,
    compareAtCents,
    size = 'md',
    className,
}: {
    priceCents: number | null | undefined;
    vatRate?: number | null;
    compareAtCents?: number | null;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}) {
    const rawPathname = usePathname() || '';
    let intlLocale = 'lt';
    try {
        intlLocale = useLocale() || 'lt';
    } catch {
        intlLocale = 'lt';
    }
    const urlLocaleMatch = rawPathname.match(/^\/(lt|en|pl|ru)(?=\/|$)/i);
    const locale = resolveAppLocale(urlLocaleMatch ? urlLocaleMatch[1] : intlLocale);
    const copy = PRICE_DISPLAY_COPY[locale];

    const showNet = useVatDisplayStore((s) => s.showNet);

    if (priceCents == null || priceCents <= 0) {
        return (
            <span className={clsx('font-semibold text-foreground', className)} data-unpriced="true">
                {copy.onRequest}
            </span>
        );
    }

    const { grossCents, netCents } = priceDisplayPair(priceCents, vatRate);
    const sizeCls = size === 'lg' ? 'text-3xl' : size === 'sm' ? 'text-sm' : 'text-lg';

    return (
        <span className={clsx('inline-flex items-baseline gap-2', className)}>
            <span className={clsx('font-bold text-foreground tabular-nums', sizeCls)}>
                {eur(showNet ? netCents : grossCents)}
            </span>
            <span className="text-xs text-muted-foreground">
                {showNet ? copy.net : copy.gross}
            </span>
            {compareAtCents != null && compareAtCents > grossCents && (
                <>
                    <s className="text-sm text-muted-foreground line-through tabular-nums">{eur(compareAtCents)}</s>
                    <span className="rounded-[2px] bg-[var(--accent)] px-1.5 py-0.5 text-xs font-bold text-[var(--accent-foreground)]">
                        -{Math.round((1 - grossCents / compareAtCents) * 100)}%
                    </span>
                </>
            )}
        </span>
    );
}
