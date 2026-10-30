'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { X, Shield, Cookie, SlidersHorizontal } from 'lucide-react';
import { useLocale } from 'next-intl';
import { Link, type AppLocale } from '@/i18n/routing';
import { resolveAppLocale } from '../i18n/storefront-ui-copy';

interface ConsentState {
    essential: boolean;
    functional: boolean;
    analytics: boolean;
    marketing: boolean;
}

const COOKIE_I18N: Record<
    AppLocale,
    {
        dialogAria: string;
        title: string;
        description: string;
        acceptAll: string;
        customize: string;
        essentialOnly: string;
        essential: string;
        essentialDesc: string;
        functional: string;
        functionalDesc: string;
        analytics: string;
        analyticsDesc: string;
        marketing: string;
        marketingDesc: string;
        saveSettings: string;
        alwaysActive: string;
        privacyPolicy: string;
        cookiePolicy: string;
        closeAria: string;
    }
> = {
    lt: {
        dialogAria: 'Slapukų nustatymai',
        title: 'Privatumo ir slapukų nustatymai',
        description:
            'Vertiname jūsų privatumą. Naudojame slapukus sklandžiam el. parduotuvės, krepšelio ir skaičiuoklių veikimui užtikrinti.',
        acceptAll: 'Priimti visus',
        customize: 'Pasirinkti',
        essentialOnly: 'Tik būtini',
        essential: 'Būtini slapukai',
        essentialDesc: 'Reikalingi pagrindiniam svetainės ir krepšelio veikimui',
        functional: 'Funkciniai slapukai',
        functionalDesc: 'Įsimena jūsų kalbą, PVM režimą ir pasirinkimus',
        analytics: 'Analitiniai slapukai',
        analyticsDesc: 'Padeda tobulinti el. parduotuvę ir paiešką',
        marketing: 'Rinkodaros slapukai',
        marketingDesc: 'Aktualūs pasiūlymai ir techninės naujienos',
        saveSettings: 'Išsaugoti nustatymus',
        alwaysActive: 'Visada aktyvūs',
        privacyPolicy: 'Privatumo politika',
        cookiePolicy: 'Slapukų politika',
        closeAria: 'Uždaryti',
    },
    en: {
        dialogAria: 'Cookie settings',
        title: 'Privacy & Cookie Settings',
        description:
            'We value your privacy. We use cookies to ensure smooth operation of the online store, shopping cart, and engineering calculators.',
        acceptAll: 'Accept All',
        customize: 'Customize',
        essentialOnly: 'Essential Only',
        essential: 'Essential Cookies',
        essentialDesc: 'Required for core website and shopping cart operation',
        functional: 'Functional Cookies',
        functionalDesc: 'Remember your language, VAT display mode, and preferences',
        analytics: 'Analytics Cookies',
        analyticsDesc: 'Help us improve catalog search and site performance',
        marketing: 'Marketing Cookies',
        marketingDesc: 'Relevant product offers and engineering updates',
        saveSettings: 'Save Settings',
        alwaysActive: 'Always Active',
        privacyPolicy: 'Privacy Policy',
        cookiePolicy: 'Cookie Policy',
        closeAria: 'Close',
    },
    pl: {
        dialogAria: 'Ustawienia plików cookie',
        title: 'Ustawienia prywatności i plików cookie',
        description:
            'Szanujemy Twoją prywatność. Używamy plików cookie, aby zapewnić prawidłowe działanie sklepu, koszyka i kalkulatorów inżynieryjnych.',
        acceptAll: 'Akceptuj wszystkie',
        customize: 'Dostosuj',
        essentialOnly: 'Tylko niezbędne',
        essential: 'Niezbędne pliki cookie',
        essentialDesc: 'Wymagane do podstawowego działania strony i koszyka',
        functional: 'Funkcjonalne pliki cookie',
        functionalDesc: 'Zapamiętują język, tryb VAT i Twoje preferencje',
        analytics: 'Analityczne pliki cookie',
        analyticsDesc: 'Pomagają ulepszać wyszukiwarkę i działanie sklepu',
        marketing: 'Marketingowe pliki cookie',
        marketingDesc: 'Dopasowane oferty techniczne i informacje',
        saveSettings: 'Zapisz ustawienia',
        alwaysActive: 'Zawsze aktywne',
        privacyPolicy: 'Polityka prywatności',
        cookiePolicy: 'Polityka cookies',
        closeAria: 'Zamknij',
    },
    ru: {
        dialogAria: 'Настройки файлов cookie',
        title: 'Настройки конфиденциальности и cookie',
        description:
            'Мы ценим вашу конфиденциальность и используем файлы cookie для корректной работы интернет-магазина, корзины и инженерных калькуляторов.',
        acceptAll: 'Принять все',
        customize: 'Настроить',
        essentialOnly: 'Только необходимые',
        essential: 'Необходимые файлы cookie',
        essentialDesc: 'Требуются для базовой работы сайта и корзины',
        functional: 'Функциональные файлы cookie',
        functionalDesc: 'Запоминают выбранный язык, режим НДС и настройки',
        analytics: 'Аналитические файлы cookie',
        analyticsDesc: 'Помогают улучшать каталог и поиск товаров',
        marketing: 'Маркетинговые файлы cookie',
        marketingDesc: 'Актуальные технические предложения и обзоры',
        saveSettings: 'Сохранить настройки',
        alwaysActive: 'Всегда активны',
        privacyPolicy: 'Политика конфиденциальности',
        cookiePolicy: 'Политика cookie',
        closeAria: 'Закрыть',
    },
};

export function CookieConsent() {
    const [showBanner, setShowBanner] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);
    const intlLocale = useLocale() || 'lt';
    const rawPathname = usePathname() || '';
    const urlMatch = rawPathname.match(/^\/(lt|en|pl|ru)(?=\/|$)/i);
    const locale = resolveAppLocale(urlMatch ? urlMatch[1] : intlLocale);
    const copy = COOKIE_I18N[locale];
    const [consent, setConsent] = useState<ConsentState>({
        essential: true,
        functional: false,
        analytics: false,
        marketing: false,
    });

    useEffect(() => {
        const savedConsent = typeof window !== 'undefined' ? localStorage.getItem('cookie_consent') : null;
        if (!savedConsent) {
            setTimeout(() => {
                setShowBanner(true);
                setIsAnimating(true);
            }, 1500);
        } else {
            try {
                setConsent(JSON.parse(savedConsent));
            } catch {
                // ignore malformed storage
            }
        }
    }, []);

    const saveConsent = (newConsent: ConsentState) => {
        newConsent.essential = true;
        localStorage.setItem('cookie_consent', JSON.stringify(newConsent));
        localStorage.setItem('cookie_consent_date', new Date().toISOString());
        applyConsent(newConsent);
        setConsent(newConsent);
        window.dispatchEvent(new Event('cookie_consent_updated'));
        setIsAnimating(false);
        setTimeout(() => {
            setShowBanner(false);
            setShowSettings(false);
        }, 200);
    };

    const applyConsent = (state: ConsentState) => {
        if (state.analytics) console.log('[CONSENT] Analytics enabled');
        if (state.marketing) console.log('[CONSENT] Marketing enabled');
    };

    const acceptAll = () => saveConsent({ essential: true, functional: true, analytics: true, marketing: true });
    const acceptEssential = () => saveConsent({ essential: true, functional: false, analytics: false, marketing: false });

    if (!showBanner && !showSettings) return null;

    return (
        <>
            {showBanner && !showSettings && (
                <div
                    id="cookie-consent-banner"
                    role="dialog"
                    aria-label={copy.dialogAria}
                    data-testid="cookie-consent-bar"
                    className={`fixed bottom-0 left-0 right-0 z-[9990] p-2.5 transition-all duration-150 ease-out
                        ${isAnimating ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}`}
                >
                    <div className="max-w-6xl mx-auto">
                        <div className="bg-white text-stone-900 border border-stone-300 rounded-md shadow-lg px-4 py-3">
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                                <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                                    <div className="p-2 rounded-sm bg-stone-100 border border-stone-200 shrink-0">
                                        <Cookie className="w-4 h-4 text-stone-700" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-2 mb-0.5">
                                            <span className="text-sm font-bold text-stone-900">
                                                {copy.title}
                                            </span>
                                            <Link
                                                href="/privacy"
                                                className="text-xs text-stone-600 hover:text-stone-900 underline underline-offset-2 transition-colors"
                                            >
                                                {copy.privacyPolicy}
                                            </Link>
                                            <Link
                                                href="/cookies"
                                                className="text-xs text-stone-600 hover:text-stone-900 underline underline-offset-2 transition-colors"
                                            >
                                                {copy.cookiePolicy}
                                            </Link>
                                        </div>
                                        <p className="text-stone-600 text-xs leading-snug line-clamp-2">
                                            {copy.description}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-2 shrink-0">
                                    <button
                                        type="button"
                                        onClick={acceptAll}
                                        className="py-2 px-4 rounded-sm bg-[var(--primary)] hover:bg-[var(--brand-accent-hover)] text-white font-semibold text-xs transition-colors"
                                    >
                                        {copy.acceptAll}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowSettings(true)}
                                        className="py-2 px-3.5 rounded-sm bg-stone-100 hover:bg-stone-200 text-stone-800 font-medium text-xs border border-stone-300 inline-flex items-center gap-1.5 transition-colors"
                                    >
                                        <SlidersHorizontal className="w-3.5 h-3.5 text-stone-700" />
                                        {copy.customize}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={acceptEssential}
                                        className="py-2 px-3 rounded-sm text-stone-600 hover:text-stone-900 hover:bg-stone-100 font-medium text-xs transition-colors"
                                    >
                                        {copy.essentialOnly}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={acceptEssential}
                                        aria-label={copy.essentialOnly}
                                        className="p-1.5 rounded-sm text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showSettings && (
                <div
                    id="cookie-consent-modal"
                    role="dialog"
                    aria-modal="true"
                    aria-label={copy.dialogAria}
                    className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-stone-900/60"
                >
                    <div
                        className="relative w-full max-w-lg overflow-hidden rounded-md border border-stone-300 bg-white text-stone-900 shadow-xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="relative p-5 sm:p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2.5">
                                    <Shield className="w-5 h-5 text-[var(--primary)]" />
                                    <h3 className="text-lg font-bold text-stone-900">{copy.title}</h3>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setShowSettings(false)}
                                    aria-label={copy.closeAria}
                                    className="p-1.5 rounded-sm text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="space-y-3">
                                <div className="p-3.5 rounded-sm bg-stone-50 border border-stone-200">
                                    <div className="flex items-center justify-between gap-3">
                                        <div>
                                            <h4 className="font-semibold text-stone-900 text-xs">{copy.essential}</h4>
                                            <p className="text-xs text-stone-600 mt-0.5">{copy.essentialDesc}</p>
                                        </div>
                                        <div className="px-2.5 py-1 rounded-xs bg-stone-200 text-stone-800 text-xs font-semibold shrink-0">
                                            {copy.alwaysActive}
                                        </div>
                                    </div>
                                </div>

                                <label className="block p-3.5 rounded-sm bg-stone-50 border border-stone-200 cursor-pointer hover:border-stone-400 transition-colors">
                                    <div className="flex items-center justify-between gap-3">
                                        <div>
                                            <h4 className="font-semibold text-stone-900 text-xs">{copy.functional}</h4>
                                            <p className="text-xs text-stone-600 mt-0.5">{copy.functionalDesc}</p>
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={consent.functional}
                                            onChange={(e) => setConsent({ ...consent, functional: e.target.checked })}
                                            className="w-4 h-4 rounded-xs border border-stone-400 text-[var(--primary)]"
                                        />
                                    </div>
                                </label>

                                <label className="block p-3.5 rounded-sm bg-stone-50 border border-stone-200 cursor-pointer hover:border-stone-400 transition-colors">
                                    <div className="flex items-center justify-between gap-3">
                                        <div>
                                            <h4 className="font-semibold text-stone-900 text-xs">{copy.analytics}</h4>
                                            <p className="text-xs text-stone-600 mt-0.5">{copy.analyticsDesc}</p>
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={consent.analytics}
                                            onChange={(e) => setConsent({ ...consent, analytics: e.target.checked })}
                                            className="w-4 h-4 rounded-xs border border-stone-400 text-[var(--primary)]"
                                        />
                                    </div>
                                </label>

                                <label className="block p-3.5 rounded-sm bg-stone-50 border border-stone-200 cursor-pointer hover:border-stone-400 transition-colors">
                                    <div className="flex items-center justify-between gap-3">
                                        <div>
                                            <h4 className="font-semibold text-stone-900 text-xs">{copy.marketing}</h4>
                                            <p className="text-xs text-stone-600 mt-0.5">{copy.marketingDesc}</p>
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={consent.marketing}
                                            onChange={(e) => setConsent({ ...consent, marketing: e.target.checked })}
                                            className="w-4 h-4 rounded-xs border border-stone-400 text-[var(--primary)]"
                                        />
                                    </div>
                                </label>
                            </div>

                            <div className="flex items-center justify-between mt-4 pt-3 border-t border-stone-200 text-xs">
                                <div className="flex items-center gap-3">
                                    <Link href="/privacy" className="text-stone-600 hover:text-stone-900 underline underline-offset-2">
                                        {copy.privacyPolicy}
                                    </Link>
                                    <Link href="/cookies" className="text-stone-600 hover:text-stone-900 underline underline-offset-2">
                                        {copy.cookiePolicy}
                                    </Link>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => saveConsent(consent)}
                                        className="py-2 px-4 rounded-sm bg-stone-800 hover:bg-stone-900 text-white font-semibold text-xs transition-colors"
                                    >
                                        {copy.saveSettings}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={acceptAll}
                                        className="py-2 px-4 rounded-sm bg-[var(--primary)] hover:bg-[var(--brand-accent-hover)] text-white font-semibold text-xs transition-colors"
                                    >
                                        {copy.acceptAll}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
