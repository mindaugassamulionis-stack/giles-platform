import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { NextRequest } from 'next/server';
import robots from '../src/app/robots';
import auraRobots from '../../storefront-aura/src/app/robots';
import {
    middleware as suradaiMiddleware,
    resetAiBotRateLimit,
} from '../src/middleware';
import {
    middleware as auraMiddleware,
    resetAuraAiBotRateLimit,
} from '../../storefront-aura/src/middleware';
import { generateMetadata } from '../src/app/[locale]/products/page';

const REPO_ROOT = path.resolve(__dirname, '../../..');

const AI_SEARCH_BOTS = [
    'GPTBot',
    'OAI-SearchBot',
    'ChatGPT-User',
    'ClaudeBot',
    'Claude-SearchBot',
    'Claude-User',
    'PerplexityBot',
] as const;

const BLOCKED_SCRAPER_BOTS = [
    'SemrushBot',
    'AhrefsBot',
    'MJ12bot',
    'DotBot',
    'BLEXBot',
    'DataForSeoBot',
    'Bytespider',
    'PetalBot',
    'CCBot',
] as const;

test('1. Caddyfile allows AI Search Bots, blocks SEO scraper User-Agents with 403, and logs on 92-5-163-199.sslip.io', () => {
    const caddyfile = fs.readFileSync(path.join(REPO_ROOT, 'Caddyfile'), 'utf8');
    const scraperBlockMatch = caddyfile.match(/@scraper_bots\s*\{[\s\S]*?\}/);
    assert.ok(scraperBlockMatch, 'Caddyfile must define @scraper_bots matcher block');
    const scraperBlock = scraperBlockMatch[0];

    assert.match(
        scraperBlock,
        /header_regexp\s+User-Agent\s+\(\?i\)\(SemrushBot\|AhrefsBot\|MJ12bot\|DotBot\|BLEXBot\|DataForSeoBot\|Bytespider\|PetalBot\|CCBot\)/,
        'Caddyfile @scraper_bots must match blocked SEO/bulk scrapers',
    );
    for (const aiBot of AI_SEARCH_BOTS) {
        assert.ok(
            !scraperBlock.includes(aiBot),
            `Caddyfile @scraper_bots must NOT block AI Search Bot ${aiBot}`,
        );
    }
    assert.match(
        caddyfile,
        /handle\s+@scraper_bots\s*\{\s*respond\s+403\s*\}/,
        'Caddyfile must return 403 for @scraper_bots at edge',
    );
    assert.match(
        caddyfile,
        /92-5-163-199\.sslip\.io,\s*92\.5\.163\.199\.nip\.io\s*\{[\s\S]*?log\s*\{[\s\S]*?output\s+stdout[\s\S]*?format\s+console[\s\S]*?\}[\s\S]*?import\s+platform_routes/,
        'Caddyfile sslip.io/nip.io block must log stdout console and import platform_routes',
    );
});

test('2. middleware.ts allows AI Search Bots with 30 req/60s rate limit, blocks SEO scrapers with 403, and aligns robots.txt + Sitemap across all storefronts', async () => {
    resetAiBotRateLimit();
    resetAuraAiBotRateLimit();

    for (const aiBot of AI_SEARCH_BOTS) {
        const req = new NextRequest('https://92-5-163-199.sslip.io/lt/products', {
            headers: {
                'user-agent': `Mozilla/5.0 (compatible; ${aiBot}/1.0)`,
                'x-forwarded-for': '203.0.113.10',
            },
        });
        const suradaiRes = suradaiMiddleware(req);
        assert.notEqual(suradaiRes.status, 403, `suradai middleware must allow ${aiBot}`);
        assert.notEqual(suradaiRes.status, 429, `suradai middleware must allow ${aiBot} under rate limit`);
        assert.equal(
            suradaiRes.headers.get('X-AI-Bot-RateLimit'),
            '30/60s',
            `suradai middleware must attach X-AI-Bot-RateLimit: 30/60s for ${aiBot}`,
        );

        const auraRes = await auraMiddleware(req);
        assert.notEqual(auraRes.status, 403, `aura middleware must allow ${aiBot}`);
        assert.equal(
            auraRes.headers.get('X-AI-Bot-RateLimit'),
            '30/60s',
            `aura middleware must attach X-AI-Bot-RateLimit: 30/60s for ${aiBot}`,
        );
    }

    // Verify 30 requests / 60s rate limit enforcement on 31st request
    resetAiBotRateLimit();
    for (let i = 1; i <= 30; i += 1) {
        const req = new NextRequest('https://92-5-163-199.sslip.io/lt/products', {
            headers: {
                'user-agent': 'Mozilla/5.0 (compatible; GPTBot/1.4; +https://openai.com/gptbot)',
                'x-forwarded-for': '198.51.100.77',
            },
        });
        const res = suradaiMiddleware(req);
        assert.notEqual(res.status, 429, `request #${i} must pass under 30/60s limit`);
    }
    const burstExceedReq = new NextRequest('https://92-5-163-199.sslip.io/lt/products', {
        headers: {
            'user-agent': 'Mozilla/5.0 (compatible; GPTBot/1.4; +https://openai.com/gptbot)',
            'x-forwarded-for': '198.51.100.77',
        },
    });
    const burstExceedRes = suradaiMiddleware(burstExceedReq);
    assert.equal(burstExceedRes.status, 429, '31st request in 60s window must return 429');
    assert.equal(burstExceedRes.headers.get('Retry-After'), '60');
    assert.equal(burstExceedRes.headers.get('X-RateLimit-Limit'), '30');
    assert.equal(burstExceedRes.headers.get('X-RateLimit-Window'), '60s');

    // Verify multi-facet spider-trap protection for AI bots on /products
    resetAiBotRateLimit();
    const trapReq = new NextRequest(
        'https://92-5-163-199.sslip.io/lt/products?brand=Ferroli&spec=DN20&q=52-153-032',
        {
            headers: {
                'user-agent': 'Mozilla/5.0 (compatible; GPTBot/1.4; +https://openai.com/gptbot)',
                'x-forwarded-for': '198.51.100.88',
            },
        },
    );
    const trapRes = suradaiMiddleware(trapReq);
    assert.equal(trapRes.status, 429, '3+ combined facet filters for AI bot must return 429');
    assert.equal(trapRes.headers.get('X-Robots-Tag'), 'noindex, nofollow');

    // Verify SEO Scrapers are blocked with 403 in both storefronts
    for (const scraper of BLOCKED_SCRAPER_BOTS) {
        const scraperReq = new NextRequest('https://92-5-163-199.sslip.io/lt/products', {
            headers: {
                'user-agent': `Mozilla/5.0 (compatible; ${scraper}/2.0)`,
            },
        });
        const suradaiScraperRes = suradaiMiddleware(scraperReq);
        assert.equal(suradaiScraperRes.status, 403, `suradai middleware must return 403 for ${scraper}`);

        const auraScraperRes = await auraMiddleware(scraperReq);
        assert.equal(auraScraperRes.status, 403, `aura middleware must return 403 for ${scraper}`);
    }

    // Verify Suradai (FILL.LT) and Aura robots.ts policies + Sitemap
    for (const [storeName, cfg, expectedSitemap] of [
        ['suradai', robots(), 'https://fill.lt/suradai/sitemap.xml'],
        ['aura', auraRobots(), 'https://92-5-163-199.sslip.io/aurora/sitemap.xml'],
    ] as const) {
        assert.ok(Array.isArray(cfg.rules), `${storeName} robots.ts rules must be an array`);
        assert.equal(cfg.sitemap, expectedSitemap, `${storeName} robots.ts must set Sitemap`);

        const aiAllowRule = cfg.rules.find(
            (r) => Array.isArray(r.userAgent) && r.userAgent.includes('GPTBot'),
        );
        assert.ok(aiAllowRule, `${storeName} robots.ts must include AI Search Bot allow rule`);
        assert.equal(aiAllowRule.allow, '/');
        assert.equal(aiAllowRule.crawlDelay, 2);
        for (const aiBot of AI_SEARCH_BOTS) {
            assert.ok(
                (aiAllowRule.userAgent as string[]).includes(aiBot),
                `${storeName} robots.ts AI allow rule must include ${aiBot}`,
            );
        }

        const scraperDisallowRule = cfg.rules.find(
            (r) => Array.isArray(r.userAgent) && r.userAgent.includes('SemrushBot'),
        );
        assert.ok(scraperDisallowRule, `${storeName} robots.ts must include SEO scraper disallow rule`);
        assert.equal(scraperDisallowRule.disallow, '/');
        for (const scraper of BLOCKED_SCRAPER_BOTS) {
            assert.ok(
                (scraperDisallowRule.userAgent as string[]).includes(scraper),
                `${storeName} robots.ts scraper disallow rule must include ${scraper}`,
            );
        }

        const wildcardRule = cfg.rules.find((r) => r.userAgent === '*');
        assert.ok(wildcardRule && Array.isArray(wildcardRule.disallow), `${storeName} robots.ts must include wildcard disallow array`);
        for (const pattern of [
            '/api/',
            '/checkout',
            '/cart',
            '/*?*brand=',
            '/*?*spec=',
            '/*?*subtype=',
            '/*?*price=',
            '/*?*inStock=',
            '/*?*sort=',
            '/*?*q=',
        ]) {
            assert.ok(
                wildcardRule.disallow.includes(pattern),
                `${storeName} robots.ts wildcard disallow must contain ${pattern}`,
            );
        }
    }

    // Verify all 6 Vite storefronts have public/robots.txt and public/sitemap.xml
    for (const [dir, slug] of [
        ['storefront-ai1.lt', 'ai1'],
        ['storefront-hyper-retail', 'hyper-retail'],
        ['storefront-suradai.lt', 'shop'],
        ['storefront-puosk', 'puosk-klasika'],
        ['storefront-tamsu', 'tamsu'],
        ['storefront-puosk-luxury', 'puosk'],
    ] as const) {
        const robotsTxt = fs.readFileSync(path.join(REPO_ROOT, 'apps', dir, 'public/robots.txt'), 'utf8');
        const sitemapXml = fs.readFileSync(path.join(REPO_ROOT, 'apps', dir, 'public/sitemap.xml'), 'utf8');
        for (const aiBot of AI_SEARCH_BOTS) {
            assert.match(robotsTxt, new RegExp(`User-agent:\\s*${aiBot}`), `${dir}/public/robots.txt must list ${aiBot}`);
        }
        for (const scraper of BLOCKED_SCRAPER_BOTS) {
            assert.match(robotsTxt, new RegExp(`User-agent:\\s*${scraper}`), `${dir}/public/robots.txt must list ${scraper}`);
        }
        assert.match(
            robotsTxt,
            new RegExp(`Sitemap:\\s*https://92-5-163-199\\.sslip\\.io/${slug}/sitemap\\.xml`),
            `${dir}/public/robots.txt must include Sitemap for /${slug}/sitemap.xml`,
        );
        assert.match(sitemapXml, /<urlset/, `${dir}/public/sitemap.xml must be valid urlset XML`);
    }
});

test('3. products/page.tsx, category-tabs.tsx, and filter-drawer.tsx guard getPopularProductPreviews, prefix locale, strip q on facets, add rel="nofollow", and set noindex metadata', async () => {
    const pageSrc = fs.readFileSync(
        path.join(REPO_ROOT, 'apps/storefront-suradai/src/app/[locale]/products/page.tsx'),
        'utf8',
    );
    const categoryTabsSrc = fs.readFileSync(
        path.join(REPO_ROOT, 'apps/storefront-suradai/src/components/category-tabs.tsx'),
        'utf8',
    );
    const filterDrawerSrc = fs.readFileSync(
        path.join(REPO_ROOT, 'apps/storefront-suradai/src/components/filter-drawer.tsx'),
        'utf8',
    );

    const hasActiveIdx = pageSrc.indexOf('const hasActiveFilters =');
    const promiseAllIdx = pageSrc.indexOf('await Promise.all([');
    assert.ok(hasActiveIdx > 0 && promiseAllIdx > hasActiveIdx, 'hasActiveFilters must be computed BEFORE Promise.all');
    assert.match(
        pageSrc,
        /hasActiveFilters\s*\?\s*Promise\.resolve\(\[\]\)\s*:\s*getPopularProductPreviews\(12\)/,
        'getPopularProductPreviews(12) must be guarded behind !hasActiveFilters',
    );
    assert.match(
        pageSrc,
        /return\s+`\/\$\{locale\}\/products\$\{qs\s*\?\s*`\?\$\{qs\}`\s*:\s*''\}`/,
        'buildQuery in products/page.tsx must return /${locale}/products...',
    );
    assert.match(
        pageSrc,
        /delete\s+merged\.q/,
        'buildQuery in products/page.tsx must strip q when switching facet filters',
    );

    const unfilteredMeta = await generateMetadata({ searchParams: Promise.resolve({}) });
    assert.equal(unfilteredMeta.robots, undefined, 'unfiltered /products must allow indexing');

    const filteredMeta = await generateMetadata({
        searchParams: Promise.resolve({ brand: 'Ferroli', q: '52-153-032' }),
    });
    assert.deepEqual(
        filteredMeta.robots,
        { index: false, follow: false },
        'filtered /products?... must set robots index:false, follow:false',
    );

    assert.match(pageSrc, /rel="nofollow"/, 'products/page.tsx must include rel="nofollow" on facet links');
    assert.match(categoryTabsSrc, /rel="nofollow"/, 'category-tabs.tsx must include rel="nofollow"');
    assert.match(categoryTabsSrc, /`\/\$\{locale\}\/products/, 'category-tabs.tsx must prefix locale');
    assert.match(filterDrawerSrc, /rel="nofollow"/, 'filter-drawer.tsx must include rel="nofollow"');
    assert.match(filterDrawerSrc, /`\/\$\{locale \|\| 'lt'\}\/products/, 'filter-drawer.tsx must prefix locale');
});

test('4. catalog-listing.ts removes unused getStoreScopedProductIds in searchCatalogProductsPaged, uses COUNT(*) OVER(), and caches popular/filter/category/brand/storeId', () => {
    const listingSrc = fs.readFileSync(
        path.join(REPO_ROOT, 'apps/storefront-suradai/src/lib/catalog-listing.ts'),
        'utf8',
    );
    const pagedFnStart = listingSrc.indexOf('export async function searchCatalogProductsPaged');
    const pagedFnEnd = listingSrc.indexOf('export async function searchCatalogProducts(');
    const pagedBody = listingSrc.slice(pagedFnStart, pagedFnEnd);

    assert.ok(!pagedBody.includes('getStoreScopedProductIds'), 'searchCatalogProductsPaged must not call getStoreScopedProductIds()');
    const storeIdCalls = pagedBody.match(/storeIdOrThrow\(\)/g) || [];
    assert.equal(storeIdCalls.length, 1, 'searchCatalogProductsPaged must call storeIdOrThrow() only once');
    assert.match(pagedBody, /COUNT\(\*\)\s+OVER\(\)::int\s+AS\s+total_count/i, 'searchCatalogProductsPaged must use COUNT(*) OVER()::int AS total_count');

    assert.match(listingSrc, /STORE_ID_TTL_MS\s*=\s*5\s*\*\s*60\s*\*\s*1000/, 'storeIdOrThrow must have 5-minute TTL cache');
    assert.match(listingSrc, /CATALOG_TTL_MS\s*=\s*60\s*\*\s*1000/, 'catalog metadata/previews must have 60-second TTL cache');
    for (const fnName of [
        'getPopularProductPreviews',
        'getStoreFilterMetadata',
        'getCategorySummaries',
        'getBrandSummaries',
    ]) {
        assert.match(listingSrc, new RegExp(`export async function ${fnName}`), `${fnName} must be exported in catalog-listing.ts`);
    }
});

test('5. storefront-feature-config.ts caches getStorefrontRuntimeConfig and resolveStoreRow for 30s with write invalidation', () => {
    const configSrc = fs.readFileSync(
        path.join(REPO_ROOT, 'packages/database/src/services/storefront-feature-config.ts'),
        'utf8',
    );
    assert.match(configSrc, /RUNTIME_CONFIG_TTL_MS\s*=\s*30\s*\*\s*1000/, '30-second TTL constant must exist');
    assert.match(configSrc, /runtimeConfigTtlCache\.get\(/, 'getStorefrontRuntimeConfig must read from runtimeConfigTtlCache');
    assert.match(configSrc, /storeRowTtlCache\.get\(/, 'resolveStoreRow must read from storeRowTtlCache');
    assert.match(configSrc, /export async function saveStorefrontRuntimeConfig/, 'saveStorefrontRuntimeConfig must exist');
    assert.match(configSrc, /export async function resetStorefrontRuntimeConfig/, 'resetStorefrontRuntimeConfig must exist');
    assert.match(configSrc, /clearStorefrontRuntimeConfigCache\(/, 'write paths must clear runtime config cache');
});

test('6. 0006_w61_perf_indexes.sql and Drizzle schema files define all 7 performance indexes', () => {
    const sqlPath = path.join(REPO_ROOT, 'packages/database/drizzle/0006_w61_perf_indexes.sql');
    assert.ok(fs.existsSync(sqlPath), '0006_w61_perf_indexes.sql must exist');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');

    const expectedIndexes = [
        'idx_product_stores_store_active_product',
        'idx_products_status_brand_created',
        'idx_products_status_category_created',
        'idx_variants_product_price_sort',
        'idx_variants_sku_norm',
        'idx_event_outbox_pending_created',
        'idx_jobs_pending_created',
    ];
    for (const idxName of expectedIndexes) {
        assert.match(
            sqlContent,
            new RegExp(`CREATE INDEX IF NOT EXISTS\\s+${idxName}\\b`),
            `0006_w61_perf_indexes.sql must define ${idxName}`,
        );
    }

    const productStoresSchema = fs.readFileSync(
        path.join(REPO_ROOT, 'packages/database/src/schema/product-stores.ts'),
        'utf8',
    );
    assert.match(productStoresSchema, /idx_product_stores_store_active_product/);

    const catalogSchema = fs.readFileSync(
        path.join(REPO_ROOT, 'packages/database/src/schema/catalog.ts'),
        'utf8',
    );
    assert.match(catalogSchema, /idx_products_status_brand_created/);
    assert.match(catalogSchema, /idx_products_status_category_created/);
    assert.match(catalogSchema, /idx_variants_product_price_sort/);

    const eventsSchema = fs.readFileSync(
        path.join(REPO_ROOT, 'packages/database/src/schema/events.ts'),
        'utf8',
    );
    assert.match(eventsSchema, /idx_event_outbox_pending_created/);

    const jobsSchema = fs.readFileSync(
        path.join(REPO_ROOT, 'packages/database/src/schema/jobs.ts'),
        'utf8',
    );
    assert.match(jobsSchema, /idx_jobs_pending_created/);
});
