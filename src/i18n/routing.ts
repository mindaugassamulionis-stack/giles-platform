import { defineRouting } from 'next-intl/routing';
import { createNavigation } from 'next-intl/navigation';

export const locales = ['lt', 'en', 'pl', 'ru'] as const;
export const defaultLocale = 'lt' as const;

/** URL is the single source of truth for storefront locale (audit §5). */
export const routing = defineRouting({
    locales: [...locales],
    defaultLocale,
    localePrefix: 'always',
});

export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);

export type AppLocale = (typeof locales)[number];
