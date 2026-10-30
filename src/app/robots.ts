// SEO & GEO: robots.txt
// Served at /robots.txt

import { resolvePublicSiteOrigin } from '../lib/domain-routing';
import { AI_SEARCH_CRAWLERS } from '../lib/seo-geo-authority';

const ALLOWED_PUBLIC_PATHS = [
    '/',
    '/llms.txt',
    '/llms-full.txt',
    '/api/mcp',
    '/lt/',
    '/en/',
    '/pl/',
    '/ru/',
];

const DISALLOWED_PATHS = [
    '/api/admin',
    '/api/admin/',
    '/checkout',
    '/checkout/',
    '/cart',
    '/account/',
    '/*?*brand=',
    '/*?*spec=',
    '/*?*subtype=',
    '/*?*price=',
    '/*?*inStock=',
    '/*?*sort=',
];

const BLOCKED_SEO_SCRAPER_BOTS = [
    'SemrushBot',
    'AhrefsBot',
    'MJ12bot',
    'DotBot',
    'BLEXBot',
    'DataForSeoBot',
    'Bytespider',
    'PetalBot',
    'CCBot',
];

export default function robots() {
    const baseUrl = resolvePublicSiteOrigin().replace(/\/$/, '');
    return {
        rules: [
            {
                userAgent: '*',
                allow: ALLOWED_PUBLIC_PATHS,
                disallow: DISALLOWED_PATHS,
            },
            {
                userAgent: 'Googlebot',
                allow: ALLOWED_PUBLIC_PATHS,
                disallow: DISALLOWED_PATHS,
            },
            {
                userAgent: [...AI_SEARCH_CRAWLERS],
                allow: ALLOWED_PUBLIC_PATHS,
                disallow: DISALLOWED_PATHS,
            },
            {
                userAgent: BLOCKED_SEO_SCRAPER_BOTS,
                disallow: '/',
            },
        ],
        sitemap: `${baseUrl}/sitemap.xml`,
    };
}
