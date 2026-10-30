import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { Providers } from '../../components/providers';
import { Navbar } from '../../components/navbar';
import { Footer } from '../../components/footer';
import { VytautasAssistantWidget } from '../../components/vytautas-assistant-widget';
import { getStore, getStorefrontSettings } from '../../lib/storefront-content';
import { getStorefrontRuntimeConfig } from '@platform/database';
import { Analytics } from '../../components/analytics';
import { SeoGeoJsonLd } from '../../components/seo-geo-jsonld';
import { routing, locales } from '../../i18n/routing';

// F-DEPLOY-1 (WP3B-SHELL-FIX): html lang and body moved to the ROOT layout
// (app/layout.tsx) — Next 15.5.21 drops the document shell when the root
// layout is a pass-through. Fonts + globals.css also live there now.
// This layout renders the locale-aware app chrome INSIDE the root body.
// (No angle brackets in comments — i18n gate false-positive guard, WP3B2.)

// Prevent build-time SSG from opening DB connections (workspace builds run in parallel).
export const dynamic = 'force-dynamic';

export function generateStaticParams() {
    return routing.locales.map((locale: string) => ({ locale }));
}

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>;
}): Promise<Metadata> {
    const { locale } = await params;
    const store = await getStore();
    const storefront = await getStorefrontSettings();
    const seo = storefront.settings?.seo || {};
    const isEn = locale.startsWith('en');
    const rawTitle = (isEn ? seo.titleEn : seo.titleLt) || 'GILĖS INŽINERIJA ir EGIP.LT – Katilinės, granulių degikliai ir 6 337 ŠVOK pozicijos Kaune';
    const title = rawTitle.replace(/SURADAI\.LT/gi, 'GILĖS INŽINERIJA').replace(/FILL\.LT/gi, 'GILĖS INŽINERIJA');
    const description = (isEn ? seo.descriptionEn : seo.descriptionLt) || 'UAB „Gilės inžinerija“ (Kaunas, nuo 1995 m.) ir EGIP.lt el. parduotuvė: granulių degikliai, katilo perdarymo vedlys, konteinerinės katilinės 100 kW – 2,5 MW, Haier, Danfoss, HERZ, Gorenje ir IMI Hydronic įranga.';
    const base = store?.domain && !/suradai\.lt/i.test(store.domain) ? `https://${store.domain}` : 'https://gilesinzinerija.lt';
    // hreflang alternates (audit §5): every locale + x-default → default locale
    const languages: Record<string, string> = {};
    for (const l of locales) languages[l] = `${base}/${l}`;
    languages['x-default'] = `${base}/lt`;
    return {
        title,
        description,
        metadataBase: new URL(base),
        alternates: {
            canonical: `${base}/${locale}`,
            languages,
        },
        openGraph: {
            title,
            description,
            images: seo.ogImage ? [seo.ogImage] : undefined,
        },
    };
}

export default async function LocaleLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    if (!hasLocale(routing.locales, locale)) notFound();
    const t = await getTranslations();

    const store = await getStore();
    const storefront = await getStorefrontSettings();
    const rawRuntimeConfig = await getStorefrontRuntimeConfig(store?.id || process.env.STORE_SLUG || 'suradai');
    const runtimeConfig = {
        ...rawRuntimeConfig,
        storeName:
            !rawRuntimeConfig?.storeName || /suradai\.lt|fill\.lt/i.test(rawRuntimeConfig.storeName)
                ? 'Gilės Inžinerija'
                : rawRuntimeConfig.storeName,
        domain:
            !rawRuntimeConfig?.domain || /suradai\.lt|fill\.lt/i.test(rawRuntimeConfig.domain)
                ? 'gilesinzinerija.lt'
                : rawRuntimeConfig.domain,
    };
    const settings = (store?.settings || {}) as Record<string, any>;
    const storefrontSettings = storefront.settings || {};
    const maintenanceMode = Boolean(settings.maintenanceMode);
    const maintenanceMessage = settings.maintenanceMessage || t('common.maintenanceDefault');

    // Nonce stamped by src/middleware.ts on the `x-nonce` request header
    // (single source: src/lib/csp-nonce.ts). Forwarded to <Analytics /> so
    // every inline next/script block is accepted by the per-request CSP.
    const nonce = (await headers()).get('x-nonce') ?? undefined;

    return (
        <>
            <SeoGeoJsonLd locale={locale} nonce={nonce} />
            {/* WP3B: NextIntlClientProvider must wrap <Providers/> — global
                components rendered by Providers (CartDrawer, SearchOverlay,
                CookieConsent) call useTranslations() and need
                the client context; previously only {children} were covered. */}
            <NextIntlClientProvider>
                <Providers initialRuntimeConfig={runtimeConfig}>
                    <Navbar settings={storefrontSettings} />
                    <main className="flex-grow">
                        {maintenanceMode ? (
                            <div className="max-w-2xl mx-auto py-24 px-6 text-center">
                                <h1 className="text-3xl font-semibold mb-4">{t('common.maintenance')}</h1>
                                <p className="text-muted-foreground">{maintenanceMessage}</p>
                            </div>
                        ) : (
                            children
                        )}
                    </main>
                    <Footer settings={storefrontSettings} />
                    <VytautasAssistantWidget />
                    <Suspense fallback={null}>
                        <Analytics
                            gaId={settings.googleAnalyticsId || process.env.NEXT_PUBLIC_GA_ID}
                            clarityId={settings.microsoftClarityId || process.env.NEXT_PUBLIC_CLARITY_ID}
                            fbPixelId={settings.facebookPixelId || process.env.NEXT_PUBLIC_FB_PIXEL_ID}
                            tiktokPixelId={settings.tiktokPixelId || process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID}
                            nonce={nonce}
                        />
                    </Suspense>
                </Providers>
            </NextIntlClientProvider>
        </>
    );
}
