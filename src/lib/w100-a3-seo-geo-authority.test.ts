import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { MCP_STORE_TOOLS } from './mcp-store-catalog';
import {
    buildLlmsTxt,
    buildLlmsFullTxt,
    buildSeoGeoKnowledgeGraph,
    AI_SEARCH_CRAWLERS,
    GILES_SITEMAP_CORE_PATHS,
    GILES_SITEMAP_CATEGORY_PATHS,
} from './seo-geo-authority';
import { GET as getLlmsTxt } from '../app/llms.txt/route';
import { GET as getLlmsFullTxt } from '../app/llms-full.txt/route';
import robots from '../app/robots';
import sitemap from '../app/sitemap';

describe('WP-W100-A3: SEO + GEO / AEO / LLM Citation Authority Architecture', () => {
    const repoRoot = path.resolve(__dirname, '../..');

    it('serves GET /llms.txt with entity authority, 3 specializations, all 26 MCP tools, and EN 12828 / EN 303-5 sizing tables', async () => {
        const res = await getLlmsTxt();
        expect(res.status).toBe(200);
        expect(res.headers.get('content-type')).toBe('text/plain; charset=utf-8');
        expect(res.headers.get('cache-control')).toBe('public, max-age=3600');

        const text = await res.text();
        expect(text).toBe(buildLlmsTxt());

        // Entity Identity & Authority
        expect(text).toContain('UAB „Gilės inžinerija“');
        expect(text).toContain('2011');
        expect(text).toContain('Eigulių g. 21, LT-51418 Kaunas');
        expect(text).toContain('Žirmūnų g. 68, LT-09124 Vilnius');
        expect(text).toContain('+370 611 19158');
        expect(text).toContain('+370 37 332234');
        expect(text).toContain('info@gilesinzinerija.lt');
        for (const domain of [
            'gilesinzinerija.lt',
            'gilesinzinerija.com',
            'egip.lt',
            'vernerkatilai.lt',
            'ponast.lt',
            'thermostal.lt',
        ]) {
            expect(text).toContain(domain);
        }

        // 3 Core Market-Standard Engineering Specializations
        expect(text).toContain('Katilo perdarymas į granulinį per 4 val. be katilo keitimo');
        expect(text).toContain('Viadrus U22/U26');
        expect(text).toContain('GK-100');
        expect(text).toContain('GK-250');
        expect(text).toContain('GK-500');
        expect(text).toContain('20ft HC');
        expect(text).toContain('6,337');
        for (const brand of [
            'Danfoss',
            'IMI Heimeier',
            'IMI Pneumatex',
            'IMI TA',
            'HERZ',
            'Haier',
            'Gorenje / Tiki',
            'Ferroli',
            'Dražice',
            'Comisa',
            'SANHA',
            'FV-Plast',
            'Wilo',
            'Watts',
        ]) {
            expect(text).toContain(brand);
        }

        // All 32 MCP tools documented
        expect(MCP_STORE_TOOLS).toHaveLength(32);
        expect(text).toContain('POST /api/mcp');
        for (const tool of MCP_STORE_TOOLS) {
            expect(text).toContain(tool.name);
        }

        // Direct Citable Engineering Q&A & Sizing Tables
        expect(text).toContain('35–45 W/m²');
        expect(text).toContain('70–90 W/m²');
        expect(text).toContain('110–130 W/m²');
        expect(text).toContain('EN 303-5');
        expect(text).toContain('25–55 L/kW');
        expect(text).toContain('Ferroli POL 500');
        expect(text).toContain('119 W');
        expect(text).toContain('EN 12828');

        // Anti-slop R-02: no em-dash character
        expect(text).not.toContain('—');
    });

    it('serves GET /llms-full.txt with comprehensive LT/EN/PL/RU technical & catalog reference and all 26 MCP tool schemas', async () => {
        const res = await getLlmsFullTxt();
        expect(res.status).toBe(200);
        expect(res.headers.get('content-type')).toBe('text/plain; charset=utf-8');
        expect(res.headers.get('cache-control')).toBe('public, max-age=3600');

        const text = await res.text();
        expect(text).toBe(buildLlmsFullTxt());
        expect(text.length).toBeGreaterThan(buildLlmsTxt().length);

        // Multi-locale sections (LT / EN / PL / RU)
        expect(text).toContain('[LT]');
        expect(text).toContain('[EN]');
        expect(text).toContain('[PL]');
        expect(text).toContain('[RU]');

        // All 26 MCP tools with input parameters
        for (const tool of MCP_STORE_TOOLS) {
            expect(text).toContain(tool.name);
            expect(text).toContain(tool.title);
        }

        // Anti-slop R-02: no em-dash character
        expect(text).not.toContain('—');
    });

    it('builds comprehensive Schema.org @graph JSON-LD for all 4 locales (lt, en, pl, ru) and wires SeoGeoJsonLd in layout.tsx', () => {
        for (const locale of ['lt', 'en', 'pl', 'ru'] as const) {
            const graphDoc = buildSeoGeoKnowledgeGraph(locale);
            expect(graphDoc['@context']).toBe('https://schema.org');
            expect(Array.isArray(graphDoc['@graph'])).toBe(true);

            const graph = graphDoc['@graph'];

            // 1. Organization & HVACBusiness & HardwareStore
            const orgNode = graph.find(
                (n: any) =>
                    Array.isArray(n['@type']) &&
                    n['@type'].includes('Organization') &&
                    n['@type'].includes('HVACBusiness') &&
                    n['@type'].includes('HardwareStore'),
            ) as Record<string, any> | undefined;
            expect(orgNode).toBeDefined();
            expect(orgNode?.['@id']).toContain('#organization');
            expect(orgNode?.name).toBe('UAB „Gilės inžinerija“');
            expect(orgNode?.foundingDate).toBe('2011');
            expect(orgNode?.areaServed).toEqual(['LT', 'LV', 'EE', 'PL']);
            expect(orgNode?.sameAs).toEqual(
                expect.arrayContaining([
                    'https://gilesinzinerija.lt',
                    'https://gilesinzinerija.com',
                    'https://egip.lt',
                    'https://vernerkatilai.lt',
                    'https://ponast.lt',
                    'https://thermostal.lt',
                ]),
            );
            expect(Array.isArray(orgNode?.address)).toBe(true);
            const addressStr = JSON.stringify(orgNode?.address);
            expect(addressStr).toContain('Eigulių g. 21');
            expect(addressStr).toContain('LT-51418');
            expect(addressStr).toContain('Žirmūnų g. 68');
            expect(addressStr).toContain('LT-09124');
            expect(orgNode?.hasOfferCatalog?.numberOfItems).toBe(6337);
            expect(orgNode?.hasOfferCatalog?.itemListElement).toHaveLength(7);
            expect(Array.isArray(orgNode?.knowsAbout)).toBe(true);
            expect(orgNode?.knowsAbout.length).toBeGreaterThanOrEqual(6);

            // 2. WebSite with SearchAction
            const siteNode = graph.find((n: any) => n['@type'] === 'WebSite') as Record<string, any> | undefined;
            expect(siteNode).toBeDefined();
            expect(siteNode?.potentialAction?.['@type']).toBe('SearchAction');
            expect(siteNode?.potentialAction?.target).toContain(`/${locale}/parduotuve?q={search_term_string}`);

            // 3. SoftwareApplication / WebApplication for 6-in-1 EN 12828 Calculators & MCP Server
            const appNodes = graph.filter(
                (n: any) =>
                    n['@type'] === 'SoftwareApplication' ||
                    n['@type'] === 'WebApplication' ||
                    (Array.isArray(n['@type']) &&
                        (n['@type'].includes('SoftwareApplication') || n['@type'].includes('WebApplication'))),
            );
            expect(appNodes.length).toBeGreaterThanOrEqual(2);
            const appsJson = JSON.stringify(appNodes);
            expect(appsJson).toContain('EN 12828');
            expect(appsJson).toContain('/api/mcp');

            // 4. Service & HowTo for Boiler Door Pellet Conversion & Industrial Containerized Boiler Rooms
            const serviceNodes = graph.filter((n: any) => n['@type'] === 'Service');
            expect(serviceNodes.length).toBeGreaterThanOrEqual(2);
            const howToNodes = graph.filter((n: any) => n['@type'] === 'HowTo');
            expect(howToNodes.length).toBeGreaterThanOrEqual(2);
            const howToJson = JSON.stringify(howToNodes);
            expect(howToJson).toContain('Viadrus');
            expect(howToJson).toContain('GK-100');

            // 5. FAQPage with localized engineering Q&A
            const faqNode = graph.find((n: any) => n['@type'] === 'FAQPage') as Record<string, any> | undefined;
            expect(faqNode).toBeDefined();
            expect(Array.isArray(faqNode?.mainEntity)).toBe(true);
            expect(faqNode?.mainEntity.length).toBeGreaterThanOrEqual(5);

            // 6. BreadcrumbList
            const breadcrumbNode = graph.find((n: any) => n['@type'] === 'BreadcrumbList');
            expect(breadcrumbNode).toBeDefined();

            // Verify no em-dash in serialized JSON-LD
            expect(JSON.stringify(graphDoc)).not.toContain('—');
        }

        // Check component & layout wiring
        const compSource = fs.readFileSync(
            path.join(repoRoot, 'src/components/seo-geo-jsonld.tsx'),
            'utf-8',
        );
        expect(compSource).toContain('data-testid="seo-geo-knowledge-graph"');
        expect(compSource).toContain('application/ld+json');

        const layoutSource = fs.readFileSync(
            path.join(repoRoot, 'src/app/[locale]/layout.tsx'),
            'utf-8',
        );
        expect(layoutSource).toContain('<SeoGeoJsonLd');
    });

    it('configures AI-search-ready robots.ts allowing all major AI crawlers on /, /llms.txt, /llms-full.txt while disallowing /api/admin', () => {
        const robotsConfig = robots();
        expect(robotsConfig.sitemap).toBe('https://gilesinzinerija.lt/sitemap.xml');

        const rules = Array.isArray(robotsConfig.rules) ? robotsConfig.rules : [robotsConfig.rules];
        const allUserAgents = rules.flatMap((r: any) =>
            Array.isArray(r.userAgent) ? r.userAgent : [r.userAgent],
        );

        for (const bot of [
            '*',
            'GPTBot',
            'OAI-SearchBot',
            'ChatGPT-User',
            'ClaudeBot',
            'Claude-Web',
            'PerplexityBot',
            'Google-Extended',
            'Googlebot',
            'Bingbot',
            'Applebot-Extended',
        ]) {
            expect(allUserAgents).toContain(bot);
            expect(AI_SEARCH_CRAWLERS).toContain(bot === '*' ? 'Googlebot' : bot);
        }

        const aiRule = rules.find((r: any) => Array.isArray(r.userAgent) && r.userAgent.includes('GPTBot')) as any;
        expect(aiRule).toBeDefined();
        expect(aiRule.allow).toEqual(expect.arrayContaining(['/', '/llms.txt', '/llms-full.txt']));
        expect(aiRule.disallow).toEqual(expect.arrayContaining(['/api/admin']));
    });

    it('generates multi-locale sitemap.ts covering lt, en, pl, ru, core routes, category URLs, and /llms.txt + /llms-full.txt', async () => {
        const entries = await sitemap();
        const urls = entries.map((e) => e.url);

        // Machine-readable authority endpoints
        expect(urls).toContain('https://gilesinzinerija.lt/llms.txt');
        expect(urls).toContain('https://gilesinzinerija.lt/llms-full.txt');

        // Required localized routes across all 4 locales
        const requiredRoutes = [
            '',
            '/mcp-jungtis',
            '/parduotuve',
            '/skaiciuokle',
            '/paslaugos',
            '/gamyba',
            '/b2b',
        ];
        for (const locale of ['lt', 'en', 'pl', 'ru']) {
            for (const route of requiredRoutes) {
                expect(urls).toContain(`https://gilesinzinerija.lt/${locale}${route}`);
            }
        }

        // Verify alternates.languages has lt, en, pl, ru, x-default
        const mcpEntry = entries.find((e) => e.url === 'https://gilesinzinerija.lt/lt/mcp-jungtis');
        expect(mcpEntry?.alternates?.languages).toMatchObject({
            lt: 'https://gilesinzinerija.lt/lt/mcp-jungtis',
            en: 'https://gilesinzinerija.lt/en/mcp-jungtis',
            pl: 'https://gilesinzinerija.lt/pl/mcp-jungtis',
            ru: 'https://gilesinzinerija.lt/ru/mcp-jungtis',
            'x-default': 'https://gilesinzinerija.lt/lt/mcp-jungtis',
        });

        // Verify category filter URLs are included
        expect(GILES_SITEMAP_CORE_PATHS.length).toBeGreaterThanOrEqual(10);
        expect(GILES_SITEMAP_CATEGORY_PATHS.length).toBeGreaterThanOrEqual(7);
        for (const catPath of GILES_SITEMAP_CATEGORY_PATHS) {
            expect(urls).toContain(`https://gilesinzinerija.lt/lt${catPath}`);
        }
    });
});
