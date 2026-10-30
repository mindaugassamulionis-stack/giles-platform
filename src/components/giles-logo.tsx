'use client';

import { usePathname } from 'next/navigation';
import { assetUrl } from '../lib/api';
import { resolveAppLocale } from '../i18n/storefront-ui-copy';
import { GILES_PATENTED_MARK_TRANSPARENT_PATH } from '../lib/giles-masterpiece-data';

const LOGO_COPY = {
    lt: {
        tagline: 'ŠILUMOS INŽINERIJA · NUO 2011 M.',
        fullAlt: 'UAB Gilės inžinerija patentuotas logotipas',
        markAlt: 'UAB Gilės inžinerija patentuotas giliuko ženklas',
    },
    en: {
        tagline: 'HEATING ENGINEERING · SINCE 2011',
        fullAlt: 'UAB Gilės inžinerija patented logo',
        markAlt: 'UAB Gilės inžinerija patented acorn mark',
    },
    pl: {
        tagline: 'INŻYNIERIA CIEPLNA · OD 2011 R.',
        fullAlt: 'Opatentowane logo UAB Gilės inžinerija',
        markAlt: 'Opatentowany znak żołędzia UAB Gilės inžinerija',
    },
    ru: {
        tagline: 'ТЕПЛОИНЖЕНЕРИЯ · С 2011 Г.',
        fullAlt: 'Запатентованный логотип UAB Gilės inžinerija',
        markAlt: 'Запатентованный знак желудя UAB Gilės inžinerija',
    },
} as const;

export function GilesBrandLogo({
    variant = 'light',
    locale: localeProp,
}: {
    variant?: 'light' | 'dark';
    locale?: string;
}) {
    const pathname = usePathname() || '';
    const match = pathname.match(/^\/(lt|en|pl|ru)(?=\/|$)/i);
    const activeLocale = resolveAppLocale(localeProp || (match ? match[1] : 'lt'));
    const copy = LOGO_COPY[activeLocale] || LOGO_COPY.lt;
    const isDark = variant === 'dark';

    return (
        <span
            data-testid="giles-patented-logo"
            data-variant={variant}
            className="inline-flex items-center gap-2 sm:gap-2.5 whitespace-nowrap bg-transparent overflow-hidden"
        >
            <img
                src={assetUrl(GILES_PATENTED_MARK_TRANSPARENT_PATH)}
                alt={copy.markAlt}
                width={44}
                height={44}
                className="h-9 w-9 xl:h-11 xl:w-11 object-contain bg-transparent shrink-0"
            />
            <span className="flex flex-col leading-none">
                <span className="text-sm xl:text-base font-extrabold tracking-tight">
                    <span className={isDark ? 'text-[#F5F3EE]' : 'text-[#11161B]'}>GILĖS</span>{' '}
                    <span className={isDark ? 'text-[#A9C83E]' : 'text-[#5E8C1E]'}>INŽINERIJA</span>
                </span>
                <span
                    className={
                        isDark
                            ? 'hidden sm:inline text-[10px] xl:text-xs font-semibold mt-0.5 text-[#A3ADB8]'
                            : 'hidden sm:inline text-[10px] xl:text-xs font-semibold mt-0.5 text-[#5A6570]'
                    }
                >
                    {copy.tagline}
                </span>
            </span>
        </span>
    );
}
