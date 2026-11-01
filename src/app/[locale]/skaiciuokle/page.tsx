import type { Metadata } from 'next';
import { locales } from '../../../i18n/routing';
import { resolveAppLocale } from '../../../i18n/storefront-ui-copy';
import { SkaiciuokleNamui } from '../../../components/skaiciuokle-namui';
import { escapeJsonLdForScript } from '../../../lib/jsonld';
import { leaGrant, type LeaData } from '../../../lib/heat/lea';
import heatConfigJson from '../../../data/heat/heat-config.lt.json';
import leaJson from '../../../data/heat/lea-2026.lt.json';
import contentJson from '../../../data/heat/skaiciuokle-content.lt.json';

/* eslint-disable @typescript-eslint/no-explicit-any */
export const dynamic = 'force-dynamic';

const BASE = 'https://gilesinzinerija.lt';
const cfg: any = heatConfigJson;
const lea = leaJson as unknown as LeaData;
const content = contentJson as any;

type Params = { params: Promise<{ locale: string }> };

// W126-A1 (S7-lite): savas title/description/canonical kiekvienam locale.
const TITLES: Record<string, string> = {
    lt: content.seo.home.title,
    en: 'Heating calculator: power, cost and LEA grant | Gilės inžinerija',
    pl: 'Kalkulator ogrzewania: moc, koszty i dotacja LEA | Gilės inžinerija',
    ru: 'Калькулятор отопления: мощность, цена и субсидия LEA | Gilės inžinerija',
};
const DESCRIPTIONS: Record<string, string> = {
    lt: content.seo.home.description,
    en: 'Find out what size heat pump or pellet boiler your home needs, what heating will cost per year, and what LEA grant you can get. Calculated by Gilės engineers since 2011.',
    pl: 'Sprawdź, jakiej mocy pompy ciepła lub kotła pelletowego wymaga Twój dom, ile kosztuje ogrzewanie rocznie i jaką dotację LEA możesz otrzymać. Obliczają inżynierowie Gilės od 2011 r.',
    ru: 'Узнайте, какой мощности тепловой насос или пеллетный котел нужен вашему дому, сколько стоит отопление в год и какую субсидию LEA вы можете получить. Считают инженеры Gilės с 2011 г.',
};

export async function generateMetadata({ params }: Params): Promise<Metadata> {
    const { locale: rawLocale } = await params;
    const locale = resolveAppLocale(rawLocale);
    const languages: Record<string, string> = {};
    for (const l of locales) languages[l] = `${BASE}/${l}/skaiciuokle`;
    languages['x-default'] = `${BASE}/lt/skaiciuokle`;
    return {
        title: TITLES[locale] ?? TITLES.lt,
        description: DESCRIPTIONS[locale] ?? DESCRIPTIONS.lt,
        alternates: {
            canonical: `${BASE}/${locale}/skaiciuokle`,
            languages,
        },
    };
}

// FAQ skaičiai generuojami iš branduolio (leaGrant) – content JSON testuojamas prieš jį (w126).
function buildFaqJsonLd() {
    const grantHp8 = Math.floor(leaGrant(lea, 'hp_aw', 8)).toLocaleString('lt-LT');
    const grantBio20 = Math.floor(leaGrant(lea, 'bio', 20)).toLocaleString('lt-LT');
    return {
        '@type': 'FAQPage',
        mainEntity: (content.faq as { q: string; a: string }[]).map((f) => ({
            '@type': 'Question',
            name: f.q,
            acceptedAnswer: {
                '@type': 'Answer',
                text: f.a.replace('2 365 €', `${grantHp8} €`).replace('1 662 €', `${grantBio20} €`),
            },
        })),
    };
}

export default async function SkaiciuoklePage() {
    const initialInput = { ...cfg.defaults } as any;
    const jsonLd = {
        '@context': 'https://schema.org',
        '@graph': [
            {
                '@type': 'WebApplication',
                name: 'Gilės inžinerija šildymo skaičiuoklė (galia, išlaidos, LEA kompensacija)',
                applicationCategory: 'UtilitiesApplication',
                operatingSystem: 'Web',
                offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
            },
            buildFaqJsonLd(),
        ],
    };
    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: escapeJsonLdForScript(JSON.stringify(jsonLd)) }}
            />
            <SkaiciuokleNamui initialInput={initialInput} />
        </>
    );
}
