import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { locales } from '../../../../i18n/routing';
import { resolveAppLocale } from '../../../../i18n/storefront-ui-copy';
import {
    INDUSTRIAL_MODELS_FILE,
    getIndustrialModelBySlug,
} from '../../../../lib/pramonei-v2/data';
import { formatModelPower } from '../../../../lib/pramonei-v2/format';
import { ModelPassportView } from '../../../../components/pramonei-v2/model-passport-view';

export function generateStaticParams() {
    return locales.flatMap((locale) =>
        INDUSTRIAL_MODELS_FILE.models.map((m) => ({
            locale,
            slug: m.slug,
        })),
    );
}

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
    const { locale: rawLocale, slug } = await params;
    const locale = resolveAppLocale(rawLocale);
    const model = getIndustrialModelBySlug(slug, locale);
    if (!model) return {};

    const powerStr = formatModelPower(model, locale);
    const title = `${model.code} ${powerStr} – ${model.kind} | Gilės inžinerija`;
    const dimsStr = model.dimensions.value?.label ?? '';
    const fuelStr = model.fuel_storage.value?.type ?? '';
    const description = `${model.code} (${powerStr}) – ${model.kind}. ${fuelStr ? `Kuras: ${fuelStr}. ` : ''}${dimsStr ? `Gabaritai: ${dimsStr}. ` : ''}UAB „Gilės inžinerija“, Kaunas.`;

    const base = 'https://gilesinzinerija.lt';
    const languages: Record<string, string> = {};
    for (const l of locales) {
        languages[l] = `${base}/${l}/pramonei/${model.slug}`;
    }
    languages['x-default'] = `${base}/lt/pramonei/${model.slug}`;

    return {
        title,
        description,
        alternates: {
            canonical: `${base}/${locale}/pramonei/${model.slug}`,
            languages,
        },
        openGraph: {
            title,
            description,
            images: [model.image ?? '/studio-assets/projects/giles-darbas-08.webp'],
        },
    };
}

export default async function PramoneiModelPassportPage({
    params,
}: {
    params: Promise<{ locale: string; slug: string }>;
}) {
    const { locale: rawLocale, slug } = await params;
    const locale = resolveAppLocale(rawLocale);
    const model = getIndustrialModelBySlug(slug, locale);
    if (!model) {
        notFound();
    }

    return <ModelPassportView model={model} locale={locale} />;
}
