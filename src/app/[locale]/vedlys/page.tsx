import type { Metadata } from 'next';
import Link from 'next/link';
import { locales } from '../../../i18n/routing';
import { resolveAppLocale } from '../../../i18n/storefront-ui-copy';
import { getVedlysWizardCatalog } from '../../../lib/vedlys-catalog';
import { BoilerConversionWizard } from '../../../components/vedlys/boiler-conversion-wizard';
import { GilesDoorConversionSchematic } from '../../../components/giles-animated-schematics';

// W124-A1 (F0.3): savas title/description/canonical kiekvienam locale.
const VEDYLS_BASE = 'https://gilesinzinerija.lt';

type Params = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
    const { locale: rawLocale } = await params;
    const locale = resolveAppLocale(rawLocale);
    const languages: Record<string, string> = {};
    for (const l of locales) languages[l] = `${VEDYLS_BASE}/${l}/vedlys`;
    languages['x-default'] = `${VEDYLS_BASE}/lt/vedlys`;
    const titles: Record<string, string> = {
        lt: 'Katilo perdarymas į granulinį – vedlys ir kaina | Gilės inžinerija',
        en: 'Boiler pellet conversion wizard and price | Gilės inžinerija',
        pl: 'Kreator przeróbki kotła na pelet – cena | Gilės inžinerija',
        ru: 'Конфигуратор перевода котла на пеллету – цена | Gilės inžinerija',
    };
    const descriptions: Record<string, string> = {
        lt: 'Pasirinkite savo kieto kuro katilą (Viadrus, Kalvis, Atmos, Buderus, Stropuva) ir plotą – vedlys parinks granulių degiklį, flanšą ir bunkerį su kaina. Montavimas visoje Lietuvoje, 24 mėn. garantija.',
        en: 'Pick your solid-fuel boiler (Viadrus, Kalvis, Atmos, Buderus, Stropuva) and area – the wizard selects a pellet burner, flange and hopper with a price. Installation across Lithuania, 24-month warranty.',
        pl: 'Wybierz kocioł na paliwo stałe (Viadrus, Kalvis, Atmos, Buderus, Stropuva) i powierzchnię – kreator dobierze palnik peletowy, kołnierz i zasobnik z ceną. Montaż w całej Litwie, 24 mies. gwarancji.',
        ru: 'Выберите твёрдотопливный котёл (Viadrus, Kalvis, Atmos, Buderus, Stropuva) и площадь – конфигуратор подберёт пеллетную горелку, фланец и бункер с ценой. Монтаж по всей Литве, гарантия 24 мес.',
    };
    return {
        title: titles[locale] ?? titles.lt,
        description: descriptions[locale] ?? descriptions.lt,
        alternates: {
            canonical: `${VEDYLS_BASE}/${locale}/vedlys`,
            languages,
        },
    };
}

const FAQ_ITEMS = [
    {
        q: 'Ar mano katilas tinka perdarymui į granulinį degiklį?',
        a: 'Dažniausi ketiniai ir plieniniai katilai (Viadrus U22/U26, Kalvis 2-12…2-40, Atmos DC, Buderus Logano S111, Dakon DOR, Stropuva) turi CNC paruoštus montavimo flanšus. Viršutinio degimo cilindrai (Stropuva S15–S40) perdarymi su atskiru sprendimu, o pramoniniams 50–500 kW katilams rengiame individualų pasiūlymą.',
    },
    {
        q: 'Kiek kainuoja katilo perdarymas?',
        a: 'Komplekto kainą sudaro degiklis, montavimo flanšas, bunkeris, saugos termostatas ir montavimas. Vedlys suskaičiuoja ją pagal jūsų katilą ir namo plotą; degiklio kainą imame iš prekių katalogo. Tikslią sumą patvirtina inžinierius įvertinęs katilą (nuotrauka arba vizitas); jei perdarymas negalimas – grąžiname 100 %.',
    },
    {
        q: 'Kiek kartų reikės krauti granules?',
        a: 'Priklauso nuo bunkerio tūrio ir namo šilumos poreikio: vedlys parodo apytikslę autonomiją dienomis vidutiniškai ir per didžiausius šalčius. Skaičiavimas – pagal ENplus A1 granulių tankį ir jūsų namo tipo specifinį šilumos suvartojimą (prielaida, patikslina inžinierius).',
    },
    {
        q: 'Ar atsiperka perdarymas į granules?',
        a: 'Nuo kuro kainų: malkos ir granulės kainuoja panašiai, akmens anglys dažnai pigiau. Todėl rodomas sąžiningas paskaičiavimas – kuro išlaidas prieš ir po, su žyma „prielaida“. Esminė nauda – automatika: kuro krovimas kartą į kelias dienas vietoj 2–3 kartų per dieną.',
    },
];

// W125-F1: realios studio / katalogo nuotraukos – komplekto dalys, kurias vedlys parenka.
const HERO_PARTS = [
    { src: '/studio-assets/products/giles-studio-01-mpb-nani-35-50.webp', alt: 'Granulių degiklis Megatherm MPB NANI 35 / 50' },
    { src: '/studio-assets/products/giles-studio-04-viadrus-conversion-kit.webp', alt: 'Viadrus katilo perdarymo į granulinį komplektas' },
    { src: '/studio-assets/products/giles-studio-06-megatherm-burner-kit.webp', alt: 'Megatherm granulių degiklio komplektas su sraigtu' },
    { src: '/studio-assets/products/giles-studio-28-pneumatic-pellet-storage-silo.webp', alt: 'Granulių bunkeris 400–1200 l su vakuaminės padavimo sistema' },
    { src: '/studio-assets/products/giles-studio-30-ecomax-920i-automation.webp', alt: 'Katilinės valdiklis ecoMAX 920i su jutikliniu ekranu' },
    { src: '/images/products/giles-sfl-kieto-kuro-katilas-giles-inziner-613d4731.webp', alt: 'Kieto kuro katilas Gilės SFL' },
];

export default async function VedlysPage({ params }: Params) {
    const { locale: rawLocale } = await params;
    const locale = resolveAppLocale(rawLocale);
    const catalog = getVedlysWizardCatalog();

    // W124-A1 (F4.4): FAQPage, HowTo ir BreadcrumbList – tik puslapio lygiu, po vieną.
    const faqJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: FAQ_ITEMS.map((item) => ({
            '@type': 'Question',
            name: item.q,
            acceptedAnswer: { '@type': 'Answer', text: item.a },
        })),
    };
    const howToJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'HowTo',
        name: 'Kaip parinkti granulių degiklį esamam katilui (vedlys)',
        step: [
            { '@type': 'HowToStep', position: 1, name: 'Katilo modelis', text: 'Pasirinkite esamą kieto kuro katilą ir jo galios diapazoną.' },
            { '@type': 'HowToStep', position: 2, name: 'Namas ir galia', text: 'Nurodykite šildomą plotą ir namo tipą – apskaičiuojama reikiama galia su rezervu.' },
            { '@type': 'HowToStep', position: 3, name: 'Bunkeris', text: 'Parenkamas bunkerio tūris su apytikslės autonomijos dienomis skaičiavimu.' },
            { '@type': 'HowToStep', position: 4, name: 'Komplektas', text: 'Sudaromas komplektas su kainomis iš katalogo ir siunčiama užklausa inžinieriui.' },
        ],
    };
    const breadcrumbJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Pradžia', item: `${VEDYLS_BASE}/${locale}` },
            { '@type': 'ListItem', position: 2, name: 'Sprendimai', item: `${VEDYLS_BASE}/${locale}/inzinerija` },
            { '@type': 'ListItem', position: 3, name: 'Katilo perdarymas', item: `${VEDYLS_BASE}/${locale}/vedlys` },
        ],
    };

    return (
        <main className="bg-[#F5F3EE] text-[#11161B] min-h-screen">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howToJsonLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />

            <section className="bg-[#0E1216] text-[#F5F3EE]">
                <div className="mx-auto max-w-6xl px-4 py-5 sm:py-10">
                    <nav aria-label="Breadcrumb" className="text-xs text-[#A3ADB8]">
                        <Link href={`/${locale}`} className="hover:text-[#FF8A3D]">Pradžia</Link>
                        <span className="mx-1.5">/</span>
                        <Link href={`/${locale}/inzinerija`} className="hover:text-[#FF8A3D]">Sprendimai</Link>
                        <span className="mx-1.5">/</span>
                        <span aria-current="page">Katilo perdarymas</span>
                    </nav>
                    <h1 className="mt-3 text-2xl sm:text-4xl font-extrabold leading-tight max-w-2xl">
                        Katilo perdarymas į granulinį – vedlys ir kaina
                    </h1>
                    <p className="mt-2 text-sm sm:text-base text-[#C9D0D8] max-w-2xl leading-relaxed">
                        Parinkite degiklį, flanšą ir bunkerį savo katilui per 4 žingsnius. Kainos – iš prekių katalogo, atsipirkimas skaičiuojamas pagal jūsų namą, be išgalvotų sezonų.
                    </p>
                    <div className="mt-4 flex flex-wrap gap-3">
                        <a href="#vedlys-wizard" className="min-h-[48px] leading-[48px] rounded-lg bg-[#C2410C] hover:brightness-110 text-white font-bold text-sm px-5">
                            Pradėti →
                        </a>
                        <a href="tel:+37061119158" className="min-h-[48px] leading-[48px] rounded-lg border border-[#2C3742] hover:bg-[#1B232C] text-[#F5F3EE] font-semibold text-sm px-5">
                        Skambinti inžinieriui: +370 611 19158
                        </a>
                    </div>
                    <p className="mt-6 text-xs font-semibold text-[#A3ADB8]">Komplekto dalys, kurias vedlys parenka:</p>
                    <ul className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-6" aria-label="Komplekto dalių nuotraukos">
                        {HERO_PARTS.map((part) => (
                            <li key={part.src}>
                                <img
                                    src={part.src}
                                    alt={part.alt}
                                    width={176}
                                    height={96}
                                    className="h-20 w-full rounded-md object-cover sm:h-24"
                                />
                            </li>
                        ))}
                    </ul>
                </div>
            </section>

            <section id="vedlys-wizard" className="mx-auto max-w-6xl px-4 py-6 sm:py-12 scroll-mt-6">
                <BoilerConversionWizard
                    rules={catalog.rules}
                    prices={catalog.prices}
                    lines={catalog.lines}
                    assumptions={catalog.assumptions}
                    kitCodes={['GILES-LINK-LYDERIU-35', 'GILES-NORD-KOMFORTUI-20', 'GILES-VIDUTINIAMS-50']}
                />
            </section>

            <section className="mx-auto max-w-6xl px-4 pb-6" aria-labelledby="vedlys-cad-title">
                <h2 id="vedlys-cad-title" className="text-xl font-extrabold text-[#11161B]">
                    Perdarymo mazgo brėžinys
                </h2>
                <p className="mt-1 text-sm text-[#5B6470]">
                    CNC durelės su flanšu, degiklis, sraigtas ir bunkeris – visos dalys parenkamos pagal jūsų katilo modelį. Autonomija priklauso nuo bunkerio tūrio (žr. 3 žingsnį).
                </p>
                <div className="mt-4 rounded-xl bg-[#0E1216] p-3 sm:p-6 [&_text]:!text-[11px]">
                    <GilesDoorConversionSchematic locale={locale} testId="boiler-conversion-cad-blueprint" />
                </div>
            </section>

            <section className="mx-auto max-w-6xl px-4 pb-6" aria-labelledby="vedlys-faq-title">
                <h2 id="vedlys-faq-title" className="text-xl font-extrabold text-[#11161B]">
                    Dažni klausimai
                </h2>
                <div className="mt-4 space-y-3">
                    {FAQ_ITEMS.map((item) => (
                        <details key={item.q} className="rounded-lg border border-[#D5CFC3] bg-white px-4 py-2.5">
                            <summary className="cursor-pointer text-sm font-bold text-[#11161B]">{item.q}</summary>
                            <p className="mt-2 text-sm text-[#2A323B] leading-relaxed">{item.a}</p>
                        </details>
                    ))}
                </div>
            </section>
        </main>
    );
}
