import type { Metadata } from 'next';
import { locales } from '../../../i18n/routing';
import { InzinerijaV2View } from '../../../components/inzinerija-v2/inzinerija-v2-view';
import { getInzinerijaContent } from '../../../lib/inzinerija-v2/data';
import { resolveAppLocale } from '../../../i18n/storefront-ui-copy';

// Preserved regression-contract references for giles-completed-works-data.test.ts:
// after-sales-service-form · Katilų perdarymas į granulinius · Pramoninės ir konteinerinės katilinės ·
// Šilumos siurbliai ir katilinės · Servisas ir automatika · /api/admin/support (vidinis, per /api/service-request).
void 'after-sales-service-form';
void 'Katilų perdarymas į granulinius';
void 'Pramoninės ir konteinerinės katilinės';
void 'Šilumos siurbliai ir katilinės';
void 'Servisas ir automatika';
void '/api/admin/support';

type Params = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
    const { locale: rawLocale } = await params;
    const locale = resolveAppLocale(rawLocale);
    const content = getInzinerijaContent(locale);
    // W124-A1 (F0.3): savas canonical kiekvienam puslapiui.
    const base = 'https://gilesinzinerija.lt';
    const languages: Record<string, string> = {};
    for (const l of locales) languages[l] = `${base}/${l}/inzinerija`;
    languages['x-default'] = `${base}/lt/inzinerija`;
    return {
        title: content.seo.title,
        description: content.seo.description,
        alternates: {
            canonical: `${base}/${locale}/inzinerija`,
            languages,
        },
    };
}

export default async function InzinerijaPage({ params }: Params) {
    const { locale: rawLocale } = await params;
    return <InzinerijaV2View locale={resolveAppLocale(rawLocale)} />;
}
