'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import {
    ShoppingCart,
    Search,
    Menu,
    X,
    MessageSquare,
    Heart,
    Sun,
    Moon,
} from 'lucide-react';
import { clsx } from 'clsx';
import { EmailLink } from './email';
import { useCartStore, useCartHydration } from '../store/cart';
import { useWishlistStore, useWishlistHydration } from '../store/wishlist';
import { useSearchStore } from '../store/search';
import { useVatDisplayStore } from '../store/vat-display';
import { GilesBrandLogo } from './giles-logo';
import { assetUrl } from '../lib/api';
import { GILES_PATENTED_MARK_TRANSPARENT_PATH } from '../lib/giles-masterpiece-data';
import { locales, type AppLocale } from '../i18n/routing';
import { NAVBAR_UI_COPY, resolveAppLocale } from '../i18n/storefront-ui-copy';
import { formatEurAmount } from '../lib/format';
import { useStorefrontConfig } from './storefront-config-provider';
import { formatCatalogCount } from '../lib/w121-honest-commerce';

export const HEADER_THEME_STORAGE_KEY = 'giles_header_theme_v1';
export type HeaderThemeMode = 'light' | 'dark';

const HEADER_THEME_COPY: Record<
    AppLocale,
    { light: string; dark: string; groupAria: string }
> = {
    lt: {
        light: 'Šviesus',
        dark: 'Tamsus',
        groupAria: 'Antraštės fonas: Šviesus / Tamsus',
    },
    en: {
        light: 'Light',
        dark: 'Dark',
        groupAria: 'Header background: Light / Dark',
    },
    pl: {
        light: 'Jasny',
        dark: 'Ciemny',
        groupAria: 'Tło nagłówka: Jasny / Ciemny',
    },
    ru: {
        light: 'Светлый',
        dark: 'Темный',
        groupAria: 'Фон шапки: Светлый / Темный',
    },
};

type StorefrontSettings = {
    branding?: { name?: string };
    navigation?: { links?: { label: string; labelEn?: string; href: string }[] };
};

export function Navbar(_props: { settings?: StorefrontSettings }) {
    const openSearch = useSearchStore((state) => state.openSearch);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [headerTheme, setHeaderTheme] = useState<HeaderThemeMode>('light');
    const rawPathname = usePathname() || '/lt';
    const intlLocale = useLocale();
    const t = useTranslations();

    useEffect(() => {
        try {
            const saved = window.localStorage.getItem(HEADER_THEME_STORAGE_KEY);
            if (saved === 'light' || saved === 'dark') {
                setHeaderTheme(saved);
            }
        } catch {
            // Keep default warm cream ('light') header when storage is unavailable.
        }
    }, []);

    const selectHeaderTheme = (nextTheme: HeaderThemeMode) => {
        setHeaderTheme(nextTheme);
        try {
            window.localStorage.setItem(HEADER_THEME_STORAGE_KEY, nextTheme);
        } catch {
            // Ignore storage write errors in private mode.
        }
    };

    const showNet = useVatDisplayStore((s) => s.showNet);
    const setShowNet = useVatDisplayStore((s) => s.setShowNet);

    const urlLocaleMatch = rawPathname.match(/^\/(lt|en|pl|ru)(?=\/|$)/i);
    const locale = resolveAppLocale(urlLocaleMatch ? urlLocaleMatch[1] : intlLocale);
    const copy = NAVBAR_UI_COPY[locale];
    const themeCopy = HEADER_THEME_COPY[locale];
    const isDark = headerTheme === 'dark';

    const subpath = rawPathname.replace(/^\/(lt|en|pl|ru)(?=\/|$)/i, '') || '';

    const openCart = useCartStore((state) => state.openCart);
    const hydrated = useCartHydration();
    const itemCount = useCartStore((state) =>
        state.items.reduce((sum, item) => sum + item.quantity, 0),
    );
    const cartSubtotal = useCartStore((state) =>
        state.items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    );

    const openWishlist = useWishlistStore((state) => state.openWishlist);
    const wishlistHydrated = useWishlistHydration();
    const wishlistCount = useWishlistStore((state) => state.items.length);

    const displayedCartAmount = showNet ? cartSubtotal / 1.21 : cartSubtotal;
    const formattedCartPrice = `${formatEurAmount(hydrated ? displayedCartAmount : 0)} €`;

    const catalogSkuCount = useStorefrontConfig().catalog?.skuCount ?? 0;
    const audienceLinks = [
        { href: `/${locale}`, subpath: '', label: copy.audienceHouseholds },
        { href: `/${locale}/vedlys`, subpath: '/vedlys', label: copy.audienceWizard },
        { href: `/${locale}/pramonei`, subpath: '/pramonei', label: copy.audienceIndustrial },
        {
            href: `/${locale}/products`,
            subpath: '/products',
            label: copy.audienceStore.replace(
                '{count}',
                formatCatalogCount(catalogSkuCount, locale),
            ),
        },
        { href: `/${locale}/b2b`, subpath: '/b2b', label: copy.audienceB2b },
    ];

    const mainNavLinks = [
        { href: `/${locale}/products`, subpath: '/products', label: copy.navStore },
        { href: `/${locale}/vedlys`, subpath: '/vedlys', label: copy.navSolutions },
        { href: `/${locale}/pramonei`, subpath: '/pramonei', label: copy.navIndustrial },
        { href: `/${locale}/inzinerija`, subpath: '/inzinerija', label: locale === 'en' ? 'Engineering' : locale === 'pl' ? 'Inżynieria' : locale === 'ru' ? 'Инженерия' : 'Inžinerija' },
        { href: `/${locale}/paketai`, subpath: '/paketai', label: copy.navPackages },
        { href: `/${locale}/skaiciuokle`, subpath: '/skaiciuokle', label: copy.navCalculators },
        { href: `/${locale}/b2b`, subpath: '/b2b', label: copy.navB2b },
    ];

    const triggerVytautasAssistant = () => {
        if (typeof window !== 'undefined') {
            const btn = document.querySelector<HTMLButtonElement>(
                '[data-testid="vytautas-floating-trigger"], [aria-label*="Vytaut"]',
            );
            if (btn) {
                btn.click();
                return;
            }
        }
        openSearch();
    };

    return (
        <header
            data-header-theme={headerTheme}
            className={clsx(
                'sticky top-0 left-0 right-0 z-40 w-full max-w-full overflow-x-clip border-b transition-colors',
                isDark
                    ? 'bg-[#0B0F13] border-[#232D37] text-[#F5F3EE]'
                    : 'bg-[#F5F3EE] border-[#DED8CC] text-[#11161B]',
            )}
        >
            <img
                src={assetUrl(GILES_PATENTED_MARK_TRANSPARENT_PATH)}
                alt=""
                aria-hidden="true"
                width={44}
                height={44}
                className="hidden"
            />
            <div
                data-testid="navbar-utility-bar"
                className="bg-[#11161B] border-b border-[#2C3742] text-[#C9D0D8] text-xs"
            >
                <div className="mx-auto max-w-7xl px-1.5 sm:px-6 py-1.5 flex items-center justify-between gap-2 sm:gap-4 overflow-x-auto no-scrollbar">
                    <div className="hidden xl:flex items-center gap-3.5 shrink-0">
                        {audienceLinks.map((item) => {
                            const active =
                                item.subpath === ''
                                    ? subpath === '' || subpath === '/'
                                    : subpath === item.subpath ||
                                      subpath.startsWith(`${item.subpath}/`);
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={clsx(
                                        'whitespace-nowrap transition-colors py-0.5 shrink-0',
                                        active
                                            ? 'text-[#FF8A3D] font-bold'
                                            : 'text-[#C9D0D8] hover:text-white',
                                    )}
                                >
                                    {item.label}
                                </Link>
                            );
                        })}
                    </div>

                    <div className="hidden lg:flex xl:hidden items-center gap-3 shrink-0">
                        <a
                            href="tel:+37061119158"
                            className="font-semibold text-white hover:text-[#FF8A3D] whitespace-nowrap shrink-0"
                        >
                            +370 611 19158
                        </a>
                        <EmailLink
                            email="info@gilesinzinerija.lt"
                            className="text-[#C9D0D8] hover:text-white whitespace-nowrap shrink-0"
                        />
                    </div>

                    <div className="flex items-center gap-1 sm:gap-2 shrink-0 ml-auto">
                        <a
                            href="tel:+37061119158"
                            className="hidden xl:inline font-semibold text-white hover:text-[#FF8A3D] whitespace-nowrap shrink-0"
                        >
                            +370 611 19158
                        </a>

                        <div
                            data-testid="navbar-theme-toggle"
                            data-theme-glyphs="☀/☾"
                            role="group"
                            aria-label={themeCopy.groupAria}
                            className="inline-flex items-center gap-0.5 rounded-xs p-0.5 bg-[#1B232C] border border-[#2C3742] shrink-0"
                        >
                            <button
                                type="button"
                                data-testid="navbar-theme-light"
                                onClick={() => selectHeaderTheme('light')}
                                aria-pressed={!isDark}
                                className={clsx(
                                    'inline-flex items-center gap-1 px-1 sm:px-2 py-0.5 rounded-xs text-[10px] sm:text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer shrink-0',
                                    !isDark
                                        ? 'bg-[#F5F3EE] text-[#11161B]'
                                        : 'text-[#C9D0D8] hover:text-white',
                                )}
                            >
                                <Sun className="hidden sm:inline-block w-3 h-3 shrink-0" aria-hidden="true" />
                                <span>{themeCopy.light}</span>
                            </button>
                            <button
                                type="button"
                                data-testid="navbar-theme-dark"
                                onClick={() => selectHeaderTheme('dark')}
                                aria-pressed={isDark}
                                className={clsx(
                                    'inline-flex items-center gap-1 px-1 sm:px-2 py-0.5 rounded-xs text-[10px] sm:text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer shrink-0',
                                    isDark
                                        ? 'bg-[#FF8A3D] text-[#11161B]'
                                        : 'text-[#C9D0D8] hover:text-white',
                                )}
                            >
                                <Moon className="hidden sm:inline-block w-3 h-3 shrink-0" aria-hidden="true" />
                                <span>{themeCopy.dark}</span>
                            </button>
                        </div>

                        <div
                            data-testid="locale-switcher"
                            role="group"
                            aria-label={copy.localeSwitcherAria}
                            className="inline-flex items-center border border-[#2C3742] bg-[#1B232C] p-0.5 rounded-xs shrink-0"
                        >
                            {locales.map((code) => {
                                const isCurrent = locale === code;
                                const isAdminPath = subpath === '/admin' || subpath.startsWith('/admin/');
                                const targetHref = isAdminPath ? `/${code}` : `/${code}${subpath}`;
                                return (
                                    <Link
                                        key={code}
                                        href={targetHref}
                                        data-testid={`locale-switch-${code}`}
                                        aria-current={isCurrent ? 'page' : undefined}
                                        className={clsx(
                                            'px-1 sm:px-1.5 py-0.5 text-[10px] sm:text-xs font-bold uppercase whitespace-nowrap rounded-xs transition-colors shrink-0',
                                            isCurrent
                                                ? 'bg-[#C2410C] text-white'
                                                : 'text-[#C9D0D8] hover:text-white',
                                        )}
                                    >
                                        {code.toUpperCase()}
                                    </Link>
                                );
                            })}
                        </div>

                        <div
                            data-testid="vat-mode-toggle"
                            role="group"
                            aria-label={copy.vatGroupAria}
                            className="inline-flex items-center gap-0.5 rounded-xs p-0.5 bg-[#1B232C] border border-[#2C3742] shrink-0"
                        >
                            <button
                                type="button"
                                onClick={() => setShowNet(false)}
                                aria-pressed={!showNet}
                                className={clsx(
                                    'px-1 sm:px-2 py-0.5 rounded-xs text-[10px] sm:text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer shrink-0',
                                    !showNet
                                        ? 'bg-[#FF8A3D] text-[#11161B]'
                                        : 'text-[#C9D0D8] hover:text-white',
                                )}
                            >
                                {copy.vatGross}
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowNet(true)}
                                aria-pressed={showNet}
                                className={clsx(
                                    'px-1 sm:px-2 py-0.5 rounded-xs text-[10px] sm:text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer shrink-0',
                                    showNet
                                        ? 'bg-[#FF8A3D] text-[#11161B]'
                                        : 'text-[#C9D0D8] hover:text-white',
                                )}
                            >
                                {copy.vatNet}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div
                data-testid="navbar-main-row"
                className="mx-auto max-w-7xl px-2 sm:px-4 xl:px-6 py-2.5 flex items-center justify-between gap-1.5 sm:gap-3"
            >
                <Link
                    href={`/${locale}`}
                    aria-label={copy.homeAria}
                    className="shrink-0 whitespace-nowrap flex items-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#C2410C]"
                >
                    {isDark ? (
                        <GilesBrandLogo variant="dark" />
                    ) : (
                        <GilesBrandLogo variant="light" />
                    )}
                </Link>

                <div className="flex items-center gap-1 sm:gap-2 xl:gap-2.5 shrink-0">
                    <button
                        type="button"
                        onClick={openSearch}
                        data-testid="navbar-search-trigger"
                        className={clsx(
                            'hidden lg:inline-flex items-center gap-2 h-9 w-56 xl:w-80 px-3 rounded-lg border bg-transparent text-xs whitespace-nowrap transition-colors cursor-pointer overflow-hidden shrink-0',
                            isDark
                                ? 'border-[#2C3742] hover:border-[#FF8A3D] text-[#C9D0D8] hover:text-white'
                                : 'border-[#CFC8B9] hover:border-[#C2410C] text-[#4A545E] hover:text-[#11161B]',
                        )}
                        aria-label={copy.searchAria}
                    >
                        <Search
                            className={clsx(
                                'w-3.5 h-3.5 shrink-0',
                                isDark ? 'text-[#C9D0D8]' : 'text-[#5A6570]',
                            )}
                        />
                        <span className="truncate">{copy.searchPlaceholder}</span>
                    </button>

                    <button
                        type="button"
                        onClick={openSearch}
                        className={clsx(
                            'lg:hidden inline-flex h-9 w-9 items-center justify-center rounded-lg border bg-transparent shrink-0',
                            isDark
                                ? 'border-[#2C3742] text-[#F5F3EE]'
                                : 'border-[#CFC8B9] text-[#11161B]',
                        )}
                        aria-label={copy.searchAria}
                    >
                        <Search className="w-4 h-4" />
                    </button>

                    <button
                        type="button"
                        onClick={triggerVytautasAssistant}
                        data-testid="navbar-vytautas-trigger"
                        className={clsx(
                            'hidden sm:inline-flex items-center gap-1.5 h-9 px-2.5 xl:px-3 rounded-lg border bg-transparent text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer shrink-0',
                            isDark
                                ? 'border-[#2C3742] hover:border-[#FF8A3D] text-[#F5F3EE]'
                                : 'border-[#CFC8B9] hover:border-[#C2410C] text-[#11161B]',
                        )}
                    >
                        <MessageSquare
                            className={clsx(
                                'w-3.5 h-3.5 shrink-0',
                                isDark ? 'text-[#FF8A3D]' : 'text-[#C2410C]',
                            )}
                        />
                        <span className="hidden lg:inline">{copy.askVytautas}</span>
                        <span className="lg:hidden">Vytautas AI</span>
                    </button>

                    <button
                        type="button"
                        onClick={openWishlist}
                        data-testid="navbar-wishlist-trigger"
                        aria-label={copy.wishlistAria}
                        className={clsx(
                            'relative inline-flex items-center gap-1.5 h-9 px-1.5 sm:px-2 xl:px-2.5 rounded-lg border bg-transparent text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer shrink-0',
                            isDark
                                ? 'border-[#2C3742] text-[#F5F3EE] hover:border-[#FF8A3D]'
                                : 'border-[#CFC8B9] text-[#11161B] hover:border-[#C2410C]',
                        )}
                    >
                        <Heart
                            className={clsx(
                                'w-3.5 h-3.5 shrink-0',
                                wishlistHydrated && wishlistCount > 0
                                    ? 'text-[#C2410C] fill-[#C2410C]'
                                    : isDark
                                      ? 'text-[#F5F3EE]'
                                      : 'text-[#11161B]',
                            )}
                        />
                        <span className="hidden lg:inline">{copy.wishlistLabel}</span>
                        <span
                            data-testid="navbar-wishlist-count"
                            className={clsx(
                                'px-1.5 py-0.5 text-[11px] font-bold rounded-sm tabular-nums',
                                wishlistHydrated && wishlistCount > 0
                                    ? 'bg-[#C2410C] text-white'
                                    : isDark
                                      ? 'bg-[#1B232C] text-[#C9D0D8]'
                                      : 'bg-[#E7E3DB] text-[#11161B]',
                            )}
                        >
                            {wishlistHydrated ? (wishlistCount > 99 ? '99+' : wishlistCount) : 0}
                        </span>
                    </button>

                    <button
                        type="button"
                        onClick={openCart}
                        data-testid="navbar-cart-trigger"
                        className={clsx(
                            'relative inline-flex items-center gap-1.5 h-9 px-1.5 sm:px-2 xl:px-2.5 rounded-lg border bg-transparent text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer shrink-0',
                            isDark
                                ? 'border-[#2C3742] text-[#F5F3EE] hover:border-[#FF8A3D]'
                                : 'border-[#CFC8B9] text-[#11161B] hover:border-[#C2410C]',
                        )}
                        aria-label={copy.cartLabel}
                    >
                        <ShoppingCart
                            className={clsx(
                                'w-3.5 h-3.5 shrink-0',
                                isDark ? 'text-[#FF8A3D]' : 'text-[#C2410C]',
                            )}
                        />
                        <span className="hidden md:inline">{copy.cartLabel}</span>
                        <span
                            data-testid="navbar-cart-count"
                            className={clsx(
                                'px-1.5 py-0.5 text-[11px] font-bold rounded-sm tabular-nums',
                                hydrated && itemCount > 0
                                    ? 'bg-[#C2410C] text-white'
                                    : isDark
                                      ? 'bg-[#1B232C] text-[#C9D0D8]'
                                      : 'bg-[#E7E3DB] text-[#11161B]',
                            )}
                        >
                            {hydrated ? (itemCount > 99 ? '99+' : itemCount) : 0}
                        </span>
                        <span
                            data-testid="navbar-cart-price"
                            className={clsx(
                                'hidden lg:inline text-[11px] font-bold tabular-nums',
                                isDark ? 'text-[#C9D0D8]' : 'text-[#4A545E]',
                            )}
                        >
                            {formattedCartPrice}
                        </span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className={clsx(
                            'lg:hidden flex shrink-0 h-9 w-9 items-center justify-center rounded-lg border bg-transparent',
                            isDark
                                ? 'border-[#2C3742] text-[#F5F3EE]'
                                : 'border-[#CFC8B9] text-[#11161B]',
                        )}
                        aria-label={copy.mainMenuAria}
                        aria-expanded={mobileMenuOpen}
                    >
                        {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
                    </button>
                </div>
            </div>

            <div
                data-testid="navbar-desktop-nav-row"
                className={clsx(
                    'hidden lg:block border-t',
                    isDark ? 'border-[#1B232C] bg-[#0B0F13]' : 'border-[#E5E0D5] bg-[#F5F3EE]',
                )}
            >
                <div className="mx-auto max-w-7xl px-3 sm:px-6 py-1.5 flex items-center justify-between gap-4">
                    <nav
                        aria-label={copy.mainMenuAria}
                        className={clsx(
                            'flex items-center gap-5 xl:gap-7 text-[13px] xl:text-sm font-semibold min-w-0',
                            isDark ? 'text-[#C9D0D8]' : 'text-[#11161B]',
                        )}
                    >
                        {mainNavLinks.map((link) => {
                            const active =
                                subpath === link.subpath ||
                                subpath.startsWith(`${link.subpath}/`) ||
                                (link.subpath === '/pramonei' &&
                                    (subpath === '/gamyba' || subpath.startsWith('/gamyba/')));
                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    aria-current={active ? 'page' : undefined}
                                    className={clsx(
                                        'whitespace-nowrap py-1 transition-colors shrink-0',
                                        active
                                            ? isDark
                                                ? 'text-[#FF8A3D] font-bold'
                                                : 'text-[#C2410C] font-bold'
                                            : isDark
                                              ? 'text-[#F5F3EE] hover:text-[#FF8A3D]'
                                              : 'text-[#11161B] hover:text-[#C2410C]',
                                    )}
                                >
                                    {link.label}
                                </Link>
                            );
                        })}
                    </nav>
                </div>
            </div>

            {mobileMenuOpen && (
                <div
                    className={clsx(
                        'border-t px-4 py-3 lg:hidden space-y-2',
                        isDark
                            ? 'border-[#232D37] bg-[#0B0F13] text-[#F5F3EE]'
                            : 'border-[#DED8CC] bg-[#F5F3EE] text-[#11161B]',
                    )}
                >
                    <div className="flex flex-col text-sm">
                        {mainNavLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                onClick={() => setMobileMenuOpen(false)}
                                className={clsx(
                                    'py-2.5 border-b font-semibold whitespace-nowrap',
                                    isDark
                                        ? 'border-[#232D37] hover:text-[#FF8A3D]'
                                        : 'border-[#DED8CC] hover:text-[#C2410C]',
                                )}
                            >
                                {link.label}
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </header>
    );
}
