import type { Metadata } from 'next';
import { locales } from '../../../i18n/routing';
import { resolveAppLocale } from '../../../i18n/storefront-ui-copy';
import { getPramoneiContent } from '../../../lib/pramonei-v2/data';

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>;
}): Promise<Metadata> {
    const { locale: rawLocale } = await params;
    const locale = resolveAppLocale(rawLocale);
    const content = getPramoneiContent(locale);
    const base = 'https://gilesinzinerija.lt';
    const languages: Record<string, string> = {};
    for (const l of locales) {
        languages[l] = `${base}/${l}/pramonei`;
    }
    languages['x-default'] = `${base}/lt/pramonei`;

    return {
        title: content.seo.title,
        description: content.seo.description,
        alternates: {
            canonical: `${base}/${locale}/pramonei`,
            languages,
        },
        openGraph: {
            title: content.seo.title,
            description: content.seo.description,
            images: [content.seo.og_image],
        },
    };
}

export default function PramoneiLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
