'use client';

import { usePathname } from 'next/navigation';
import { useLocale } from 'next-intl';
import { useVatDisplayStore } from '../store/vat-display';
import { NAVBAR_UI_COPY, resolveAppLocale } from '../i18n/storefront-ui-copy';
import { clsx } from 'clsx';

export function VatToggle({
    className,
    variant = 'light',
}: {
    className?: string;
    variant?: 'light' | 'dark';
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
    const copy = NAVBAR_UI_COPY[locale];

    const showNet = useVatDisplayStore((s) => s.showNet);
    const setShowNet = useVatDisplayStore((s) => s.setShowNet);
    const isDark = variant === 'dark';

    return (
        <div
            data-testid="vat-mode-toggle"
            role="group"
            aria-label={copy.vatGroupAria}
            className={clsx(
                'inline-flex items-center gap-1 rounded-xs p-0.5',
                isDark
                    ? 'bg-[#1B232C] border border-[#2C3742]'
                    : 'bg-[#E7E3DB] border border-[#D5CFC3]',
                className,
            )}
        >
            <button
                type="button"
                onClick={() => setShowNet(false)}
                aria-pressed={!showNet}
                className={clsx(
                    'px-2 py-0.5 rounded-xs text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer',
                    !showNet
                        ? isDark
                            ? 'bg-[#FF8A3D] text-[#11161B]'
                            : 'bg-[#11161B] text-white'
                        : isDark
                          ? 'text-[#C9D0D8] hover:text-white'
                          : 'text-[#5B6470] hover:text-[#11161B]',
                )}
            >
                {copy.vatGross}
            </button>
            <button
                type="button"
                onClick={() => setShowNet(true)}
                aria-pressed={showNet}
                className={clsx(
                    'px-2 py-0.5 rounded-xs text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer',
                    showNet
                        ? isDark
                            ? 'bg-[#FF8A3D] text-[#11161B]'
                            : 'bg-[#11161B] text-white'
                        : isDark
                          ? 'text-[#C9D0D8] hover:text-white'
                          : 'text-[#5B6470] hover:text-[#11161B]',
                )}
            >
                {copy.vatNet}
            </button>
        </div>
    );
}
