import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import {
    buildCsp,
    createCspNonce,
    CSP_HEADER,
    NONCE_REQUEST_HEADER,
} from './lib/csp-nonce';
import { resolveLegacySeoRedirect } from './lib/domain-routing';
import { routing } from './i18n/routing';

// i18n routing (mission platform-os-i18n-en-lt-20260925): locale-prefixed URLs
// (/lt/... , /en/... , /pl/... , /ru/...) composed under the Next basePath. Merged INTO this
// middleware — never a competing middleware file (audit §5).
const handleI18nRouting = createMiddleware(routing);

// Simple in-memory rate limiting for demo/MVP
// In production, use Redis (e.g., Upstash)
const rateLimit = new Map();
const aiBotRateLimit = new Map<string, { count: number; resetTime: number }>();

export const AI_BOT_RATE_LIMIT_MAX = 30;
export const AI_BOT_RATE_LIMIT_WINDOW_MS = 60 * 1000;

export const SCRAPER_BOT_UA_RE =
    /(SemrushBot|AhrefsBot|MJ12bot|DotBot|BLEXBot|DataForSeoBot|Bytespider|PetalBot|CCBot)/i;

export const AI_SEARCH_BOT_UA_RE =
    /(GPTBot|OAI-SearchBot|ChatGPT-User|ClaudeBot|Claude-SearchBot|Claude-User|anthropic-ai|PerplexityBot|Perplexity-User|Google-Extended|Googlebot|Bingbot|Applebot)/i;

const FACET_FILTER_PARAMS = [
    'brand',
    'spec',
    'subtype',
    'price',
    'minPrice',
    'maxPrice',
    'inStock',
    'sort',
    'q',
    'category',
] as const;

export function resetAiBotRateLimit() {
    aiBotRateLimit.clear();
}

function countFacetParams(request: NextRequest): number {
    let count = 0;
    for (const key of FACET_FILTER_PARAMS) {
        const val = request.nextUrl.searchParams.get(key);
        if (val && val.trim() !== '') {
            count += 1;
        }
    }
    return count;
}

function stampAiBotHeaders(
    response: NextResponse,
    info: { remaining: number; noindexFacet: boolean },
) {
    response.headers.set('X-AI-Bot-RateLimit', '30/60s');
    response.headers.set('X-RateLimit-Limit', String(AI_BOT_RATE_LIMIT_MAX));
    response.headers.set('X-RateLimit-Remaining', String(info.remaining));
    response.headers.set('X-RateLimit-Window', '60s');
    if (info.noindexFacet) {
        response.headers.set('X-Robots-Tag', 'noindex, nofollow');
    }
}

export function middleware(request: NextRequest) {
    const userAgent = request.headers.get('user-agent') || '';
    if (SCRAPER_BOT_UA_RE.test(userAgent)) {
        return new NextResponse('Forbidden', { status: 403 });
    }

    let aiBotRateInfo: { remaining: number; noindexFacet: boolean } | null = null;
    const aiBotMatch = userAgent.match(AI_SEARCH_BOT_UA_RE);
    if (aiBotMatch) {
        const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';
        const botFamily = aiBotMatch[1].toLowerCase();
        const botKey = `${ip}:${botFamily}`;
        const now = Date.now();
        const existing = aiBotRateLimit.get(botKey);
        const current =
            !existing || now > existing.resetTime
                ? { count: 1, resetTime: now + AI_BOT_RATE_LIMIT_WINDOW_MS }
                : { count: existing.count + 1, resetTime: existing.resetTime };
        aiBotRateLimit.set(botKey, current);

        if (current.count > AI_BOT_RATE_LIMIT_MAX) {
            return new NextResponse('Too Many Requests', {
                status: 429,
                headers: {
                    'Retry-After': '60',
                    'X-AI-Bot-RateLimit': '30/60s',
                    'X-RateLimit-Limit': String(AI_BOT_RATE_LIMIT_MAX),
                    'X-RateLimit-Remaining': '0',
                    'X-RateLimit-Window': '60s',
                },
            });
        }

        const isProductsPath = /\/products\/?$/.test(request.nextUrl.pathname);
        const facetCount = isProductsPath ? countFacetParams(request) : 0;
        if (facetCount >= 3) {
            return new NextResponse('Too Many Requests: Multi-facet crawl trap blocked', {
                status: 429,
                headers: {
                    'Retry-After': '60',
                    'X-Robots-Tag': 'noindex, nofollow',
                    'X-AI-Bot-RateLimit': '30/60s',
                    'X-RateLimit-Limit': String(AI_BOT_RATE_LIMIT_MAX),
                    'X-RateLimit-Remaining': String(Math.max(0, AI_BOT_RATE_LIMIT_MAX - current.count)),
                    'X-RateLimit-Window': '60s',
                },
            });
        }

        aiBotRateInfo = {
            remaining: Math.max(0, AI_BOT_RATE_LIMIT_MAX - current.count),
            noindexFacet: facetCount >= 1,
        };
    }

    // 1. Security Headers
    const requestHeaders = new Headers(request.headers);

    // 1a. Per-request CSP nonce (single source: ./lib/csp-nonce).
    // Canonical Next.js pattern (mirrors apps/admin and
    // storefront-suradai): carry the CSP on the REQUEST headers (Next
    // extracts the nonce and nonces its own inline bootstrap scripts;
    // server components read it via `x-nonce`) AND on the RESPONSE
    // headers (what the browser enforces). middleware is the only CSP
    // on the wire — a second static CSP would be most-restrictive-wins
    // and re-enable 'unsafe-inline'.
    const nonce = createCspNonce();
    const csp = buildCsp(nonce);
    // request.headers is mutable in middleware; next-intl's handler copies
    // request headers onto its NextResponse.next(), so the nonce survives
    // locale rewrites and reaches server components via `x-nonce`.
    request.headers.set(NONCE_REQUEST_HEADER, nonce);
    requestHeaders.set(NONCE_REQUEST_HEADER, nonce);
    requestHeaders.set(CSP_HEADER, csp);

    // 2. Rate Limiting (API routes only) — API stays locale-unprefixed,
    //    handled BEFORE i18n routing so endpoints are never redirected.
    if (request.nextUrl.pathname.startsWith('/api/')) {
        const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';
        const now = Date.now();
        const windowMs = 60 * 1000; // 1 minute
        const limit = 100; // 100 requests per minute

        const rateData = rateLimit.get(ip) || { count: 0, resetTime: now + windowMs };

        if (now > rateData.resetTime) {
            rateData.count = 1;
            rateData.resetTime = now + windowMs;
        } else {
            rateData.count += 1;
        }

        rateLimit.set(ip, rateData);

        if (rateData.count > limit) {
            return new NextResponse(JSON.stringify({ error: 'Too many requests' }), {
                status: 429,
                headers: {
                    'Content-Type': 'application/json',
                    [CSP_HEADER]: csp,
                },
            });
        }

        const apiResponse = NextResponse.next({ request: { headers: requestHeaders } });
        stampSecurityHeaders(apiResponse, csp);
        if (aiBotRateInfo) {
            stampAiBotHeaders(apiResponse, aiBotRateInfo);
        }
        return apiResponse;
    }

    if (
        request.nextUrl.pathname === '/robots.txt' ||
        request.nextUrl.pathname === '/sitemap.xml' ||
        request.nextUrl.pathname === '/llms.txt' ||
        request.nextUrl.pathname.endsWith('/robots.txt') ||
        request.nextUrl.pathname.endsWith('/sitemap.xml') ||
        request.nextUrl.pathname.endsWith('/llms.txt')
    ) {
        const seoResponse = NextResponse.next({ request: { headers: requestHeaders } });
        stampSecurityHeaders(seoResponse, csp);
        if (aiBotRateInfo) {
            stampAiBotHeaders(seoResponse, aiBotRateInfo);
        }
        return seoResponse;
    }

    // 2b. Multi-domain entrypoint & legacy PrestaShop/WordPress 301 SEO redirects
    const hostHeader =
        request.headers.get('x-forwarded-host')?.split(',')[0]?.trim() ||
        request.headers.get('host') ||
        '';
    const legacyRedirectTarget = resolveLegacySeoRedirect(
        request.nextUrl.pathname,
        request.nextUrl.searchParams,
        hostHeader,
    );
    if (legacyRedirectTarget) {
        const currentPathAndQuery = `${request.nextUrl.pathname}${request.nextUrl.search}`;
        if (legacyRedirectTarget !== currentPathAndQuery) {
            const redirectUrl = new URL(legacyRedirectTarget, request.url);
            const redirectResponse = NextResponse.redirect(redirectUrl, 301);
            stampSecurityHeaders(redirectResponse, csp);
            if (aiBotRateInfo) {
                stampAiBotHeaders(redirectResponse, aiBotRateInfo);
            }
            return redirectResponse;
        }
    }

    // 3. Locale routing: /aurora → /aurora/lt (redirect), matched locales
    //    rewrite internally. localePrefix 'always' + defaultLocale 'lt'.
    const response = handleI18nRouting(request);
    stampSecurityHeaders(response, csp);
    if (aiBotRateInfo) {
        stampAiBotHeaders(response, aiBotRateInfo);
    }
    return response;
}

function stampSecurityHeaders(response: NextResponse, csp: string) {
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set(CSP_HEADER, csp);
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
