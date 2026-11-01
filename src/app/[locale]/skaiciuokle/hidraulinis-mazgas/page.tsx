import type { Metadata } from 'next';
import { locales } from '../../../../i18n/routing';
import { resolveAppLocale } from '../../../../i18n/storefront-ui-copy';
import { GilesCadCalculatorsWorkbench } from '../../../../components/scientific-calculators-hub';
import { getCalculatorPageJsonLd } from '../../../../lib/calculator-marketing';
import { escapeJsonLdForScript } from '../../../../lib/jsonld';
import contentJson from '../../../../data/heat/skaiciuokle-content.lt.json';

/* eslint-disable @typescript-eslint/no-explicit-any */
export const dynamic = 'force-dynamic';

const BASE = 'https://gilesinzinerija.lt';
const content = contentJson as any;

type Params = { params: Promise<{ locale: string }> };

// W126-A1 (S6/S7): darbastalis persikėlė į /skaiciuokle/hidraulinis-mazgas (Montuotojams).
const TITLES: Record<string, string> = {
    lt: content.seo.pro.title,
    en: 'Hydronic node calculator for installers: buffer, vessel, pump | Gilės inžinerija',
    pl: 'Kalkulator węzła hydraulicznego: bufor, naczynie, pompa | Gilės inžinerija',
    ru: 'Калькулятор гидравлического узла: буфер, бак, насос | Gilės inžinerija',
};
const DESCRIPTIONS: Record<string, string> = {
    lt: content.seo.pro.description,
    en: 'Buffer tank per EN 303-5, expansion vessel per EN 12828, flow, Kv, underfloor loops and the pump. Full BOM with Kaunas warehouse stock and a PDF protocol.',
    pl: 'Zbiornik buforowy wg EN 303-5, naczynie wzbiorcze wg EN 12828, przepływ, Kv, pętle podłogowe i pompa. Pełna specyfikacja ze stanem magazynu w Kownie.',
    ru: 'Буфер по EN 303-5, расширительный бак по EN 12828, расход, Kv, контуры теплого пола и насос. Полная комплектация со склада в Каунасе.',
};

export async function generateMetadata({ params }: Params): Promise<Metadata> {
    const { locale: rawLocale } = await params;
    const locale = resolveAppLocale(rawLocale);
    const languages: Record<string, string> = {};
    for (const l of locales) languages[l] = `${BASE}/${l}/skaiciuokle/hidraulinis-mazgas`;
    languages['x-default'] = `${BASE}/lt/skaiciuokle/hidraulinis-mazgas`;
    return {
        title: TITLES[locale] ?? TITLES.lt,
        description: DESCRIPTIONS[locale] ?? DESCRIPTIONS.lt,
        alternates: {
            canonical: `${BASE}/${locale}/skaiciuokle/hidraulinis-mazgas`,
            languages,
        },
    };
}

export default async function SkaiciuokleProPage() {
    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: escapeJsonLdForScript(JSON.stringify(getCalculatorPageJsonLd())) }}
            />
            <GilesCadCalculatorsWorkbench />
        </>
    );
}
