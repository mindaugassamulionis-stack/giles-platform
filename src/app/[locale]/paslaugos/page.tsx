import type { Metadata } from 'next';
import { InzinerijaV2View } from '../../../components/inzinerija-v2/inzinerija-v2-view';
import { getInzinerijaContent } from '../../../lib/inzinerija-v2/data';
import { resolveAppLocale } from '../../../i18n/storefront-ui-copy';

// /paslaugos rodo tą patį Inžinerija v2 patyrimą (SPEC: URL keičiamas tik turinys).
type Params = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
    const { locale: rawLocale } = await params;
    const locale = resolveAppLocale(rawLocale);
    const content = getInzinerijaContent(locale);
    return {
        title: content.seo.title,
        description: content.seo.description,
        alternates: { canonical: `/${locale}/inzinerija` },
    };
}

export default async function PaslaugosPage({ params }: Params) {
    const { locale: rawLocale } = await params;
    return <InzinerijaV2View locale={resolveAppLocale(rawLocale)} />;
}
