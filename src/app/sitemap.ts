import type { MetadataRoute } from 'next';
import { db, storefrontPages } from '@platform/database';
import { eq } from 'drizzle-orm';
import { HVAC_COMPARISON_GUIDES, SYMPTOM_DIAGNOSTICS } from '../lib/hvac-comparisons-data';
import { resolvePublicSiteOrigin } from '../lib/domain-routing';
import { getStoreIdentity } from '../lib/store-identity';
import {
    SUPPORTED_SEO_LOCALES,
    GILES_SITEMAP_CORE_PATHS,
    GILES_SITEMAP_CATEGORY_PATHS,
} from '../lib/seo-geo-authority';

const defaultLocale = 'lt';
const locales = SUPPORTED_SEO_LOCALES;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = resolvePublicSiteOrigin().replace(/\/$/, '');
    let resolvedStoreId: string | undefined;
    try {
        resolvedStoreId = (await getStoreIdentity()).storeId;
    } catch {
        // Sitemap stays buildable without a configured store identity.
        resolvedStoreId = undefined;
    }

    const alternatesFor = (path: string) => {
        const languages: Record<string, string> = {};
        for (const l of locales) {
            languages[l] = `${baseUrl}/${l}${path}`;
        }
        languages['x-default'] = `${baseUrl}/${defaultLocale}${path}`;
        return { languages };
    };

    const machineReadableRoutes: MetadataRoute.Sitemap = [
        {
            url: `${baseUrl}/llms.txt`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 1.0,
        },
        {
            url: `${baseUrl}/llms-full.txt`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.95,
        },
    ];

    const staticPages: MetadataRoute.Sitemap = locales.flatMap((locale) =>
        GILES_SITEMAP_CORE_PATHS.map((path) => ({
            url: `${baseUrl}/${locale}${path}`,
            lastModified: new Date(),
            changeFrequency: 'weekly' as const,
            priority:
                path === ''
                    ? 1.0
                    : path === '/parduotuve' ||
                        path === '/skaiciuokle' ||
                        path === '/mcp-jungtis' ||
                        path === '/paslaugos' ||
                        path === '/gamyba' ||
                        path === '/b2b'
                      ? 0.95
                      : 0.8,
            alternates: alternatesFor(path),
        })),
    );

    const categoryRoutes: MetadataRoute.Sitemap = locales.flatMap((locale) =>
        GILES_SITEMAP_CATEGORY_PATHS.map((catPath) => ({
            url: `${baseUrl}/${locale}${catPath}`,
            lastModified: new Date(),
            changeFrequency: 'daily' as const,
            priority: 0.9,
            alternates: alternatesFor(catPath),
        })),
    );

    const comparisonGuideRoutes: MetadataRoute.Sitemap = locales.flatMap((locale) =>
        HVAC_COMPARISON_GUIDES.map((guide) => ({
            url: `${baseUrl}/${locale}/palyginimai/${guide.slug}`,
            lastModified: new Date(),
            changeFrequency: 'weekly' as const,
            priority: 0.85,
            alternates: alternatesFor(`/palyginimai/${guide.slug}`),
        })),
    );

    const symptomDiagnosticRoutes: MetadataRoute.Sitemap = locales.flatMap((locale) =>
        SYMPTOM_DIAGNOSTICS.map((sym) => ({
            url: `${baseUrl}/${locale}/palyginimai?symptom=${encodeURIComponent(sym.id)}`,
            lastModified: new Date(),
            changeFrequency: 'weekly' as const,
            priority: 0.8,
            alternates: alternatesFor(`/palyginimai?symptom=${encodeURIComponent(sym.id)}`),
        })),
    );

    let pageRows: Array<{ slug: string; updatedAt: Date | null }> = [];
    if (resolvedStoreId) {
        try {
            pageRows = await db
                .select({ slug: storefrontPages.slug, updatedAt: storefrontPages.updatedAt })
                .from(storefrontPages)
                .where(eq(storefrontPages.storeId, resolvedStoreId));
        } catch {
            pageRows = [];
        }
    }

    const pageRoutes: MetadataRoute.Sitemap = locales.flatMap((locale) =>
        pageRows.map((page) => ({
            url: `${baseUrl}/${locale}/pages/${page.slug}`,
            lastModified: page.updatedAt || new Date(),
            changeFrequency: 'weekly' as const,
            priority: 0.6,
            alternates: alternatesFor(`/pages/${page.slug}`),
        })),
    );

    return [
        ...machineReadableRoutes,
        ...staticPages,
        ...categoryRoutes,
        ...comparisonGuideRoutes,
        ...symptomDiagnosticRoutes,
        ...pageRoutes,
    ];
}
