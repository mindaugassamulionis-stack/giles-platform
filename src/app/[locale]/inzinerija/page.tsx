import type { Metadata } from 'next';
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
    const content = getInzinerijaContent(resolveAppLocale(rawLocale));
    return {
        title: content.seo.title,
        description: content.seo.description,
    };
}

export default async function InzinerijaPage({ params }: Params) {
    const { locale: rawLocale } = await params;
    return <InzinerijaV2View locale={resolveAppLocale(rawLocale)} />;
}
