
'use client';

import Script from 'next/script';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

type Props = {
    gaId?: string;
    clarityId?: string;
    fbPixelId?: string;
    tiktokPixelId?: string;
    // Per-request CSP nonce read from the `x-nonce` request header
    // (stamped by src/middleware.ts). Every inline next/script
    // dangerouslySetInnerHTML block MUST carry it so the browser accepts
    // the inline bootstrap under the nonced script-src CSP.
    nonce?: string;
};

declare global {
    interface Window {
        gtag?: any;
        fbq?: any;
        _fbq?: any;
        ttq?: any;
        TiktokAnalyticsObject?: any;
        __SURADAI_PIXELS__?: {
            gaId?: string;
            fbPixelId?: string;
            tiktokPixelId?: string;
        };
    }
}

export interface TrackEventItem {
    sku: string;
    name: string;
    price: number;
    quantity: number;
}

export interface TrackEventPayload {
    content_ids?: string[];
    content_name?: string;
    content_type?: 'product' | 'product_group';
    value?: number;
    price?: number;
    currency?: string;
    num_items?: number;
    quantity?: number;
    order_id?: string;
    items?: TrackEventItem[];
}

export function getConfiguredPixelIds(overrides?: {
    gaId?: string;
    fbPixelId?: string;
    tiktokPixelId?: string;
}) {
    const winCfg = typeof window !== 'undefined' ? window.__SURADAI_PIXELS__ : undefined;
    const gaId = (overrides?.gaId ?? winCfg?.gaId ?? process.env.NEXT_PUBLIC_GA_ID ?? '').trim();
    const fbPixelId = (overrides?.fbPixelId ?? winCfg?.fbPixelId ?? process.env.NEXT_PUBLIC_FB_PIXEL_ID ?? '').trim();
    const tiktokPixelId = (overrides?.tiktokPixelId ?? winCfg?.tiktokPixelId ?? process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID ?? '').trim();
    return {
        gaId: gaId || undefined,
        fbPixelId: fbPixelId || undefined,
        tiktokPixelId: tiktokPixelId || undefined,
    };
}

export function trackEvent(
    eventName: 'ViewContent' | 'AddToCart' | 'Purchase',
    payload: TrackEventPayload,
    pixelOverrides?: { gaId?: string; fbPixelId?: string; tiktokPixelId?: string },
): boolean {
    if (typeof window === 'undefined') return false;
    const { gaId, fbPixelId, tiktokPixelId } = getConfiguredPixelIds(pixelOverrides);
    if (!gaId && !fbPixelId && !tiktokPixelId) {
        return false;
    }

    const currency = payload.currency || 'EUR';
    const value = Number(payload.value ?? 0);
    const contentIds = payload.content_ids || (payload.items ? payload.items.map((i) => i.sku) : []);
    const primarySku = contentIds[0] || '';
    const contentName = payload.content_name || payload.items?.[0]?.name || primarySku;
    const qty = Number(payload.num_items ?? payload.quantity ?? (payload.items?.reduce((s, i) => s + i.quantity, 0) || 1));
    const unitPrice = Number(payload.price ?? (qty > 0 ? value / qty : value));

    let fired = false;

    if (fbPixelId && typeof window.fbq === 'function') {
        if (eventName === 'ViewContent') {
            window.fbq('track', 'ViewContent', {
                content_ids: contentIds,
                content_name: contentName,
                content_type: payload.content_type || 'product',
                value,
                currency,
            });
            fired = true;
        } else if (eventName === 'AddToCart') {
            window.fbq('track', 'AddToCart', {
                content_ids: contentIds,
                content_name: contentName,
                content_type: payload.content_type || 'product',
                value,
                currency,
                num_items: qty,
            });
            fired = true;
        } else if (eventName === 'Purchase') {
            window.fbq(
                'track',
                'Purchase',
                {
                    content_ids: contentIds,
                    content_type: payload.content_type || 'product',
                    value,
                    currency,
                    order_id: payload.order_id,
                    num_items: qty,
                    contents: (payload.items || []).map((item) => ({
                        id: item.sku,
                        quantity: item.quantity,
                        item_price: item.price,
                    })),
                },
                payload.order_id ? { eventID: `purchase-${payload.order_id}` } : undefined,
            );
            fired = true;
        }
    }

    if (tiktokPixelId && window.ttq && typeof window.ttq.track === 'function') {
        if (eventName === 'ViewContent') {
            window.ttq.track('ViewContent', {
                content_id: primarySku,
                content_ids: contentIds,
                content_name: contentName,
                content_type: payload.content_type || 'product',
                quantity: 1,
                price: value,
                value,
                currency,
            });
            fired = true;
        } else if (eventName === 'AddToCart') {
            window.ttq.track('AddToCart', {
                content_id: primarySku,
                content_ids: contentIds,
                content_name: contentName,
                content_type: payload.content_type || 'product',
                quantity: qty,
                price: unitPrice,
                value,
                currency,
            });
            fired = true;
        } else if (eventName === 'Purchase') {
            window.ttq.track('CompletePayment', {
                content_id: payload.order_id || primarySku,
                content_ids: contentIds,
                content_type: payload.content_type || 'product',
                quantity: qty,
                price: value,
                value,
                currency,
                contents: (payload.items || []).map((item) => ({
                    content_id: item.sku,
                    content_name: item.name,
                    quantity: item.quantity,
                    price: item.price,
                })),
                event_id: payload.order_id ? `purchase-${payload.order_id}` : undefined,
            });
            fired = true;
        }
    }

    if (gaId && typeof window.gtag === 'function') {
        const gaItems =
            payload.items && payload.items.length > 0
                ? payload.items.map((item) => ({
                      item_id: item.sku,
                      item_name: item.name,
                      price: item.price,
                      quantity: item.quantity,
                  }))
                : [
                      {
                          item_id: primarySku,
                          item_name: contentName,
                          price: unitPrice,
                          quantity: qty,
                      },
                  ];
        if (eventName === 'ViewContent') {
            window.gtag('event', 'view_item', {
                currency,
                value,
                items: gaItems,
            });
            fired = true;
        } else if (eventName === 'AddToCart') {
            window.gtag('event', 'add_to_cart', {
                currency,
                value,
                items: gaItems,
            });
            fired = true;
        } else if (eventName === 'Purchase') {
            window.gtag('event', 'purchase', {
                transaction_id: payload.order_id,
                value,
                currency,
                items: gaItems,
            });
            fired = true;
        }
    }

    return fired;
}

export function Analytics({ gaId, clarityId, fbPixelId, tiktokPixelId, nonce }: Props) {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [consent, setConsent] = useState<{ marketing: boolean }>({ marketing: false });
    const cleanGaId = gaId?.trim() || undefined;
    const cleanClarityId = clarityId?.trim() || undefined;
    const cleanFbPixelId = fbPixelId?.trim() || undefined;
    const cleanTiktokPixelId = tiktokPixelId?.trim() || undefined;

    useEffect(() => {
        if (typeof window !== 'undefined') {
            window.__SURADAI_PIXELS__ = {
                gaId: cleanGaId,
                fbPixelId: cleanFbPixelId,
                tiktokPixelId: cleanTiktokPixelId,
            };
        }
    }, [cleanGaId, cleanFbPixelId, cleanTiktokPixelId]);

    useEffect(() => {
        // 1. Initial Check
        const checkConsent = () => {
            const saved = localStorage.getItem('cookie_consent');
            if (saved) {
                const parsed = JSON.parse(saved);
                setConsent({ marketing: parsed.marketing });
            }
        };
        checkConsent();

        // 2. Listen for Updates (from CookieConsent component)
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'cookie_consent') checkConsent();
        };
        window.addEventListener('storage', handleStorageChange);

        // 3. Custom Event for immediate reactivity within same window
        const handleCustomEvent = () => checkConsent();
        window.addEventListener('cookie_consent_updated', handleCustomEvent);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('cookie_consent_updated', handleCustomEvent);
        };
    }, []);

    // Google Analytics Pageview Tracking (Respects Consent implicitly via script injection below)
    useEffect(() => {
        if (!consent.marketing) return;

        if (pathname && window.gtag && cleanGaId) {
            window.gtag('config', cleanGaId, {
                page_path: pathname + searchParams.toString(),
            });
        }
        // Facebook PageView
        if (cleanFbPixelId && window.fbq) {
            window.fbq('track', 'PageView', {}, { eventID: 'pv-' + pathname }); // Basic dedupe
        }
        // TikTok PageView
        if (cleanTiktokPixelId && window.ttq) {
            window.ttq.page();
        }
    }, [pathname, searchParams, cleanGaId, cleanFbPixelId, cleanTiktokPixelId, consent.marketing]);

    if (!cleanGaId && !cleanClarityId && !cleanFbPixelId && !cleanTiktokPixelId) {
        return null;
    }

    return (
        <>
            {/* Google Analytics 4 */}
            {cleanGaId && consent.marketing && (
                <>
                    <Script
                        strategy="afterInteractive"
                        src={`https://www.googletagmanager.com/gtag/js?id=${cleanGaId}`}
                    />
                    <Script
                        id="google-analytics"
                        strategy="afterInteractive"
                        nonce={nonce}
                        dangerouslySetInnerHTML={{
                            __html: `
                                window.dataLayer = window.dataLayer || [];
                                function gtag(){dataLayer.push(arguments);}
                                gtag('js', new Date());
                                gtag('config', '${cleanGaId}', {
                                    page_path: window.location.pathname,
                                });
                            `,
                        }}
                    />
                </>
            )}

            {/* Microsoft Clarity (Functional/Analytics usually, but grouping under marketing for strictness) */}
            {cleanClarityId && consent.marketing && (
                <Script
                    id="microsoft-clarity"
                    strategy="afterInteractive"
                    nonce={nonce}
                    dangerouslySetInnerHTML={{
                        __html: `
                            (function(c,l,a,r,i,t,y){
                                c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                                t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                                y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
                            })(window, document, "clarity", "script", "${cleanClarityId}");
                        `,
                    }}
                />
            )}

            {/* Facebook Pixel */}
            {cleanFbPixelId && consent.marketing && (
                <Script
                    id="facebook-pixel"
                    strategy="afterInteractive"
                    nonce={nonce}
                    dangerouslySetInnerHTML={{
                        __html: `
                            !function(f,b,e,v,n,t,s)
                            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                            n.queue=[];t=b.createElement(e);t.async=!0;
                            t.src=v;s=b.getElementsByTagName(e)[0];
                            s.parentNode.insertBefore(t,s)}(window, document,'script',
                            'https://connect.facebook.net/en_US/fbevents.js');
                            fbq('init', '${cleanFbPixelId}');
                            fbq('track', 'PageView');
                        `,
                    }}
                />
            )}
            {cleanFbPixelId && consent.marketing && (
                <noscript>
                    <img height="1" width="1" style={{ display: 'none' }}
                        src={`https://www.facebook.com/tr?id=${cleanFbPixelId}&ev=PageView&noscript=1`}
                    />
                </noscript>
            )}

            {/* TikTok Pixel */}
            {cleanTiktokPixelId && consent.marketing && (
                <Script
                    id="tiktok-pixel"
                    strategy="afterInteractive"
                    nonce={nonce}
                    dangerouslySetInnerHTML={{
                        __html: `
                            !function (w, d, t) {
                            w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var o=document.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};
                            ttq.load('${cleanTiktokPixelId}');
                            ttq.page();
                            }(window, document, 'ttq');
                        `,
                    }}
                />
            )}
        </>
    );
}
