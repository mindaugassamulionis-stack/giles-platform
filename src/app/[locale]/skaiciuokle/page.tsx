import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { getLocale } from 'next-intl/server';
import { GilesCadCalculatorsWorkbench } from '../../../components/scientific-calculators-hub';
import { getCalculatorPageJsonLd } from '../../../lib/calculator-marketing';
import { escapeJsonLdForScript } from '../../../lib/jsonld';
import { resolveAppLocale } from '../../../i18n/storefront-ui-copy';

export const dynamic = 'force-dynamic';

const SKAICIUOKLE_META = {
    lt: {
        title: 'Katilinių, granulių degiklių ir hidraulinių mazgų skaičiuoklės | GILĖS INŽINERIJA',
        description:
            'Tikslus katilinių, granulių degiklių, šilumos siurblių ir hidraulinių mazgų parinkimas pagal EN 12831 standartą su tiesioginiu įrangos komplektavimu iš Kauno sandėlio.',
    },
    en: {
        title: 'Boiler Room, Pellet Burner & Hydronic Node Calculators | GILĖS INŽINERIJA',
        description:
            'Precision boiler room, pellet burner, heat pump, and hydronic node sizing per EN 12831 with direct equipment selection from our Kaunas warehouse.',
    },
    pl: {
        title: 'Kalkulatory kotłowni, palników pelletowych i węzłów hydraulicznych | GILĖS INŽINERIJA',
        description:
            'Precyzyjny dobór kotłowni, palników pelletowych, pomp ciepła i węzłów hydraulicznych wg EN 12831 z bezpośrednim doborem urządzeń z magazynu w Kownie.',
    },
    ru: {
        title: 'Калькуляторы котельных, пеллетных горелок и гидравлических узлов | GILĖS INŽINERIJA',
        description:
            'Точный расчет котельных, пеллетных горелок, тепловых насосов и гидравлических узлов по стандарту EN 12831 с прямым подбором оборудования со склада в Каунасе.',
    },
} as const;

export async function generateMetadata({
    params,
}: {
    params?: Promise<{ locale?: string }>;
}): Promise<Metadata> {
    const resolved = params ? await params : undefined;
    const rawLocale = resolved?.locale || (await getLocale().catch(() => 'lt')) || 'lt';
    const loc = resolveAppLocale(rawLocale);

    return {
        title: SKAICIUOKLE_META[loc].title,
        description: SKAICIUOKLE_META[loc].description,
    };
}

export default async function GilesSkaiciuoklePage({
    params,
    searchParams,
}: {
    params?: Promise<{ locale?: string }>;
    searchParams?: Promise<{ tab?: string }>;
}) {
    const resolvedParams = params ? await params : undefined;
    const rawLocale = resolvedParams?.locale || (await getLocale().catch(() => 'lt')) || 'lt';
    const locale = resolveAppLocale(rawLocale);
    const sp = searchParams ? await searchParams : {};
    const nonce = (await headers()).get('x-nonce') ?? undefined;
    const calcJsonLd = getCalculatorPageJsonLd();

    return (
        <main className="min-h-screen bg-[#F5F3EE] text-[#11161B]">
            <script
                type="application/ld+json"
                nonce={nonce}
                dangerouslySetInnerHTML={{
                    __html: escapeJsonLdForScript(JSON.stringify(calcJsonLd)),
                }}
            />
            <GilesCadCalculatorsWorkbench initialTab={sp?.tab || 'boiler'} locale={locale} />
        </main>
    );
}
