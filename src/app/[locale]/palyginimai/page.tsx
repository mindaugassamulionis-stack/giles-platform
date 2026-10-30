import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { Link } from '../../../i18n/navigation';
import {
    Calculator,
    CheckCircle2,
    FileText,
    HelpCircle,
} from 'lucide-react';
import {
    HVAC_COMPARISON_GUIDES,
    SYMPTOM_DIAGNOSTICS,
    getLocalizedHvacComparisonGuides,
} from '../../../lib/hvac-comparisons-data';
import {
    SymptomDiagnosticFinder,
    VytautasDiagnosticConsultButton,
} from '../../../components/symptom-diagnostic-finder';
import { escapeJsonLdForScript } from '../../../lib/jsonld';
import { resolveAppLocale } from '../../../i18n/storefront-ui-copy';
import type { AppLocale } from '../../../i18n/routing';

export const dynamic = 'force-dynamic';

const COMPARISONS_UI_COPY: Record<
    AppLocale,
    {
        metaTitle: string;
        metaDesc: string;
        heroTitle: string;
        heroSubtitle: string;
        openCalcsBtn: string;
        sectionHeading: (count: number) => string;
        sectionSubtitle: string;
        comparisonBadge: (idx: number, brandA: string, brandB: string) => string;
        shortAnswerLabel: string;
        colCriterion: string;
        colRecommendation: string;
        mobileRecLabel: string;
        vytautasPrompt: (title: string, optA: string, optB: string, skus: string) => string;
        vytautasBtnLabel: string;
        calcBtnLabel: string;
        fullGuideBtnLabel: string;
        rfqEyebrow: string;
        rfqTitle: string;
        rfqDesc: string;
        rfqBtn: string;
    }
> = {
    lt: {
        metaTitle: 'ŠVOK Palyginimai, Diagnostika ir Sprendimų Gidai | Gilės Inžinerija',
        metaDesc:
            'Šildymo sistemos 18 gedimų diagnostikos schemų ir 20 išsamių techninių palyginimų: Danfoss RA Click ir M30×1,5, Heimeier Eclipse AFC, Statico ir Aquapresso, Dynacon ir IMI TA STAD.',
        heroTitle: 'Šildymo sistemos gedimų diagnostika ir techniniai palyginimai',
        heroSubtitle:
            'Parengta pagal dažniausias santechnikų bei namų savininkų situacijas: čia greitai atskirsite sriegius (23 mm Danfoss RA ir M30×1,5), plėtimosi indus (Statico ir Aquapresso), pavarų įtampas (230 V ir 24 V NC) bei išsirinksite tinkančias prekes iš mūsų sandėlio.',
        openCalcsBtn: 'Atidaryti inžinerines skaičiuokles',
        sectionHeading: (count) =>
            `Kuo skiriasi populiariausi ŠVOK sprendimai ir kurį rinktis? (${count} gidų)`,
        sectionSubtitle:
            'Kiekviename gide rasite tiesioginį atsakymą, techninių parametrų palyginimo lentelę, patikros sąrašą bei nuorodas į prekes ir skaičiuokles.',
        comparisonBadge: (idx, a, b) => `${idx}. ${a} ir ${b} palyginimas`,
        shortAnswerLabel: 'Trumpas atsakymas:',
        colCriterion: 'Kriterijus',
        colRecommendation: 'Rekomendacija',
        mobileRecLabel: 'Rekomendacija:',
        vytautasPrompt: (title, optA, optB, skus) =>
            `Lyginu sprendimus: ${title} (${optA} vs. ${optB}). Kuris variantas ir kokie SKU (${skus}) geriausiai tinka mano sistemai?`,
        vytautasBtnLabel: 'Pasikonsultuoti su Vytautu',
        calcBtnLabel: 'Skaičiuoklė',
        fullGuideBtnLabel: 'Pilnas palyginimo gidas',
        rfqEyebrow: 'Neradote savo situacijos ar turite projekto sąrašą?',
        rfqTitle: 'Atsiųskite nuotrauką arba sąmatą – Vytautas ir inžinieriai parinks 100 % derančias dalis',
        rfqDesc:
            'Nemokamai patikriname sriegių, pavarų įtampų ir hidraulinių mazgų suderinamumą prieš išsiunčiant užsakymą.',
        rfqBtn: 'Gauti pasiūlymą per 24 val.',
    },
    en: {
        metaTitle: 'HVAC Technical Comparisons, Diagnostics & Selection Guides | Gilės Inžinerija',
        metaDesc:
            '18 heating fault diagnostic trees and 20 technical comparison guides: Danfoss RA Click vs M30×1.5, Heimeier Eclipse AFC, Statico vs Aquapresso, Dynacon & IMI TA STAD.',
        heroTitle: 'Heating System Fault Diagnostics & Technical Comparisons',
        heroSubtitle:
            'Built around the most common installer and homeowner questions: quickly distinguish threads (23 mm Danfoss RA vs M30×1.5), expansion vessels (Statico vs Aquapresso), and actuator voltages (230 V vs 24 V NC) and select matching parts from our warehouse.',
        openCalcsBtn: 'Open Engineering Calculators',
        sectionHeading: (count) =>
            `How do the most popular HVAC solutions differ and which one should you choose? (${count} guides)`,
        sectionSubtitle:
            'Every guide includes a direct engineering answer, a parameter comparison table, a verification checklist, and links to in-stock SKU items and calculators.',
        comparisonBadge: (idx, a, b) => `${idx}. ${a} vs. ${b} comparison`,
        shortAnswerLabel: 'Direct engineering answer:',
        colCriterion: 'Criterion',
        colRecommendation: 'Recommendation',
        mobileRecLabel: 'Recommendation:',
        vytautasPrompt: (title, optA, optB, skus) =>
            `Comparing solutions: ${title} (${optA} vs. ${optB}). Which option and which SKUs (${skus}) best fit my heating system?`,
        vytautasBtnLabel: 'Consult Engineer Vytautas',
        calcBtnLabel: 'Calculator',
        fullGuideBtnLabel: 'Full comparison guide',
        rfqEyebrow: 'Did not find your exact case or have a project BOM list?',
        rfqTitle: 'Send a photo or specification – Vytautas and our engineers will match 100% compatible parts',
        rfqDesc:
            'We verify thread standards, actuator voltages, and hydronic Kvs values free of charge before shipping your order.',
        rfqBtn: 'Get a quote within 24h',
    },
    pl: {
        metaTitle: 'Porównania techniczne HVAC, diagnostyka i poradniki doboru | Gilės Inžinerija',
        metaDesc:
            '18 schematów diagnostyki usterek ogrzewania i 20 porównań technicznych: Danfoss RA Click vs M30×1,5, Heimeier Eclipse AFC, Statico vs Aquapresso, Dynacon i IMI TA STAD.',
        heroTitle: 'Diagnostyka usterek instalacji grzewczej i porównania techniczne',
        heroSubtitle:
            'Opracowane na podstawie najczęstszych pytań instalatorów i właścicieli domów: szybko odróżnisz gwinty (23 mm Danfoss RA i M30×1,5), naczynia wzbiorcze (Statico i Aquapresso) oraz napięcia siłowników (230 V i 24 V NC) i dobierzesz produkty z magazynu.',
        openCalcsBtn: 'Otwórz kalkulatory inżynieryjne',
        sectionHeading: (count) =>
            `Czym różnią się najpopularniejsze rozwiązania HVAC i które wybrać? (${count} poradników)`,
        sectionSubtitle:
            'W każdym poradniku znajdziesz bezpośrednią odpowiedź inżyniera, tabelę porównawczą parametrów, listę kontrolną oraz linki do produktów i kalkulatorów.',
        comparisonBadge: (idx, a, b) => `${idx}. Porównanie ${a} i ${b}`,
        shortAnswerLabel: 'Krótka odpowiedź:',
        colCriterion: 'Kryterium',
        colRecommendation: 'Zalecenie',
        mobileRecLabel: 'Zalecenie:',
        vytautasPrompt: (title, optA, optB, skus) =>
            `Porównuję rozwiązania: ${title} (${optA} vs. ${optB}). Który wariant i jakie kody SKU (${skus}) najlepiej pasują do mojej instalacji?`,
        vytautasBtnLabel: 'Skonsultuj z Vytautasem',
        calcBtnLabel: 'Kalkulator',
        fullGuideBtnLabel: 'Pełny poradnik porównawczy',
        rfqEyebrow: 'Nie znalazłeś swojej sytuacji lub masz zestawienie projektowe?',
        rfqTitle: 'Wyślij zdjęcie lub kosztorys – Vytautas i inżynierowie dobiorą w 100% pasujące części',
        rfqDesc:
            'Bezpłatnie weryfikujemy zgodność gwintów, napięć siłowników i układów hydraulicznych przed wysyłką zamówienia.',
        rfqBtn: 'Uzyskaj ofertę w 24 godz.',
    },
    ru: {
        metaTitle: 'Технические сравнения ОВиК, диагностика и гиды по выбору | Gilės Inžinerija',
        metaDesc:
            '18 схем диагностики неисправностей отопления и 20 подробных технических сравнений: Danfoss RA Click и M30×1,5, Heimeier Eclipse AFC, Statico и Aquapresso, Dynacon и IMI TA STAD.',
        heroTitle: 'Диагностика неисправностей систем отопления и технические сравнения',
        heroSubtitle:
            'Подготовлено по самым частым ситуациям монтажников и владельцев домов: здесь вы быстро отличите резьбы (23 мм Danfoss RA и M30×1,5), расширительные баки (Statico и Aquapresso) и напряжения приводов (230 В и 24 В NC) и выберете товары со склада.',
        openCalcsBtn: 'Открыть инженерные калькуляторы',
        sectionHeading: (count) =>
            `Чем отличаются популярные решения ОВиК и какое выбрать? (${count} гидов)`,
        sectionSubtitle:
            'В каждом гиде вы найдете прямой инженерный ответ, сравнительную таблицу параметров, чек-лист проверки и ссылки на товары и калькуляторы.',
        comparisonBadge: (idx, a, b) => `${idx}. Сравнение ${a} и ${b}`,
        shortAnswerLabel: 'Краткий ответ:',
        colCriterion: 'Критерий',
        colRecommendation: 'Рекомендация',
        mobileRecLabel: 'Рекомендация:',
        vytautasPrompt: (title, optA, optB, skus) =>
            `Сравниваю решения: ${title} (${optA} vs. ${optB}). Какой вариант и какие артикулы SKU (${skus}) лучше всего подходят для моей системы?`,
        vytautasBtnLabel: 'Проконсультироваться с Витаутасом',
        calcBtnLabel: 'Калькулятор',
        fullGuideBtnLabel: 'Полный гид сравнения',
        rfqEyebrow: 'Не нашли свою ситуацию или есть спецификация проекта?',
        rfqTitle: 'Пришлите фото или смету – Витаутас и инженеры подберут 100% совместимые комплектующие',
        rfqDesc:
            'Бесплатно проверяем совместимость резьб, напряжений сервоприводов и гидравлических узлов перед отправкой заказа.',
        rfqBtn: 'Получить предложение за 24 ч.',
    },
};

const cleanDash = (s: string) => s.replace(/\u2014/g, '–').replace(/[\u00A9\u00AE\u2122]/g, '');

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>;
}): Promise<Metadata> {
    const resolved = await params;
    const loc = resolveAppLocale(resolved?.locale || 'lt');
    const ui = COMPARISONS_UI_COPY[loc] || COMPARISONS_UI_COPY.lt;
    return {
        title: ui.metaTitle,
        description: ui.metaDesc,
    };
}

export default async function HvacComparisonsHubPage({
    params,
}: {
    params?: Promise<{ locale: string }>;
}) {
    const resolved = params ? await params : { locale: 'lt' };
    const locale = resolveAppLocale(resolved?.locale || 'lt');
    const ui = COMPARISONS_UI_COPY[locale] || COMPARISONS_UI_COPY.lt;
    const localizedGuides = getLocalizedHvacComparisonGuides(locale);

    const nonce = (await headers()).get('x-nonce') ?? undefined;

    const jsonLdPayload = {
        '@context': 'https://schema.org',
        '@graph': [
            {
                '@type': 'ItemList',
                name: ui.metaTitle,
                numberOfItems: localizedGuides.length,
                itemListElement: localizedGuides.map((guide, index) => ({
                    '@type': 'ListItem',
                    position: index + 1,
                    name: guide.title,
                    description: guide.aiDirectAnswer,
                    url: `https://gilesinzinerija.lt/${locale}/palyginimai/${guide.slug}`,
                })),
            },
            {
                '@type': 'FAQPage',
                mainEntity: [
                    ...SYMPTOM_DIAGNOSTICS.map((sym) => ({
                        '@type': 'Question',
                        name: sym.symptomTitle,
                        acceptedAnswer: {
                            '@type': 'Answer',
                            text: `${sym.causePlain} Sprendimas: ${sym.fiveMinFixSteps.join(' ')}`,
                        },
                    })),
                    ...HVAC_COMPARISON_GUIDES.map((guide) => ({
                        '@type': 'Question',
                        name: guide.title,
                        acceptedAnswer: {
                            '@type': 'Answer',
                            text: guide.aiDirectAnswer,
                        },
                    })),
                ],
            },
        ],
    };

    return (
        <main className="min-h-screen bg-[#F7F6F3] text-stone-900">
            <script
                type="application/ld+json"
                nonce={nonce}
                dangerouslySetInnerHTML={{
                    __html: escapeJsonLdForScript(JSON.stringify(jsonLdPayload)),
                }}
            />

            {/* Compact Daylight Hero Banner (No eyebrow pill above H1) */}
            <section className="bg-white border-b border-stone-200 py-5">
                <div className="container mx-auto max-w-6xl px-4 sm:px-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-stone-900 max-w-4xl">
                            {ui.heroTitle}
                        </h1>
                        <p className="text-sm text-stone-600 mt-1.5 max-w-3xl leading-relaxed">
                            {ui.heroSubtitle}
                        </p>
                    </div>
                    <Link
                        href="/skaiciuokle"
                        className="inline-flex items-center gap-2 rounded-sm bg-stone-900 hover:bg-[var(--primary)] px-4 py-2.5 text-xs font-semibold text-white transition-colors shrink-0"
                    >
                        <Calculator className="w-4 h-4" aria-hidden="true" />
                        <span>{ui.openCalcsBtn}</span>
                    </Link>
                </div>
            </section>

            {/* Interactive Symptom Diagnostic Finder */}
            <SymptomDiagnosticFinder showHubLink={false} locale={locale} />

            {/* X-vs-Y Comparison Guides Grid */}
            <section className="py-10 md:py-12">
                <div className="container mx-auto max-w-6xl px-4 sm:px-6">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
                        <div>
                            <h2 className="text-xl md:text-2xl font-bold text-stone-900">
                                {ui.sectionHeading(localizedGuides.length)}
                            </h2>
                            <p className="text-sm text-stone-600 mt-1 max-w-3xl">
                                {ui.sectionSubtitle}
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-5">
                        {localizedGuides.map((guide, gIdx) => (
                            <article
                                key={guide.slug}
                                className="rounded-md border border-stone-300 bg-white p-5 md:p-6 shadow-2xs hover:border-stone-900 transition-colors"
                            >
                                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                                    <span className="rounded-xs bg-stone-100 border border-stone-200 px-2.5 py-0.5 text-xs font-semibold text-stone-700">
                                        {ui.comparisonBadge(
                                            gIdx + 1,
                                            cleanDash(guide.optionA.brand),
                                            cleanDash(guide.optionB.brand),
                                        )}
                                    </span>
                                </div>

                                <h3 className="text-lg md:text-xl font-bold text-stone-900">
                                    <Link
                                        href={`/palyginimai/${guide.slug}`}
                                        className="hover:text-[var(--primary)] transition-colors"
                                    >
                                        {cleanDash(guide.title)}
                                    </Link>
                                </h3>
                                <p className="text-sm text-stone-600 mt-1">{cleanDash(guide.questionHook)}</p>

                                {/* 30-sec Direct Answer Box */}
                                <div className="mt-4 rounded-sm border border-stone-200 bg-[#FAF9F6] p-4">
                                    <p className="text-xs font-bold text-stone-900 mb-1">
                                        {ui.shortAnswerLabel}
                                    </p>
                                    <p className="text-sm text-stone-800 leading-relaxed">
                                        {cleanDash(guide.aiDirectAnswer)}
                                    </p>
                                </div>

                                {/* Compact Preview Table (Desktop >= 768px) */}
                                <div className="mt-4 hidden md:block overflow-x-auto">
                                    <table className="w-full text-left border-collapse text-xs md:text-sm">
                                        <thead>
                                            <tr className="border-b border-stone-200 bg-stone-50 text-xs text-stone-700">
                                                <th className="py-2.5 px-3 font-semibold">{ui.colCriterion}</th>
                                                <th className="py-2.5 px-3 font-semibold text-stone-900">
                                                    {cleanDash(guide.optionA.name)}
                                                </th>
                                                <th className="py-2.5 px-3 font-semibold text-stone-900">
                                                    {cleanDash(guide.optionB.name)}
                                                </th>
                                                <th className="py-2.5 px-3 font-semibold text-[var(--primary)]">
                                                    {ui.colRecommendation}
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-stone-200">
                                            {guide.comparisonRows.slice(0, 2).map((row, rIdx) => (
                                                <tr key={rIdx} className="hover:bg-stone-50">
                                                    <td className="py-2.5 px-3 font-semibold text-stone-900">
                                                        {cleanDash(row.criterion)}
                                                    </td>
                                                    <td className="py-2.5 px-3 text-stone-700">
                                                        {cleanDash(row.optionAValue)}
                                                    </td>
                                                    <td className="py-2.5 px-3 text-stone-700">
                                                        {cleanDash(row.optionBValue)}
                                                    </td>
                                                    <td className="py-2.5 px-3 font-medium text-stone-900">
                                                        {cleanDash(row.winnerOrRule)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Mobile Comparison Cards (< 768px) */}
                                <div
                                    className="mt-4 md:hidden flex flex-col gap-3"
                                    data-testid="mobile-comparison-cards"
                                >
                                    {guide.comparisonRows.slice(0, 2).map((row, rIdx) => (
                                        <div
                                            key={rIdx}
                                            className="rounded-sm border border-stone-200 bg-[#FAF9F6] p-3 space-y-2 text-xs"
                                        >
                                            <div className="font-bold text-stone-900 border-b border-stone-200 pb-1.5">
                                                {cleanDash(row.criterion)}
                                            </div>
                                            <div className="grid grid-cols-1 gap-1.5">
                                                <div className="flex items-start justify-between gap-2">
                                                    <span className="text-stone-600 font-medium shrink-0">
                                                        {cleanDash(guide.optionA.brand)}:
                                                    </span>
                                                    <span className="text-stone-900 font-semibold text-right break-words min-w-0">
                                                        {cleanDash(row.optionAValue)}
                                                    </span>
                                                </div>
                                                <div className="flex items-start justify-between gap-2">
                                                    <span className="text-stone-600 font-medium shrink-0">
                                                        {cleanDash(guide.optionB.brand)}:
                                                    </span>
                                                    <span className="text-stone-900 font-semibold text-right break-words min-w-0">
                                                        {cleanDash(row.optionBValue)}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="rounded-xs bg-emerald-50/80 border border-emerald-200 px-2.5 py-1.5 text-stone-900 font-semibold">
                                                <span className="text-emerald-800 font-bold mr-1">
                                                    {ui.mobileRecLabel}
                                                </span>
                                                {cleanDash(row.winnerOrRule)}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Footer CTAs */}
                                <div className="mt-4 pt-3.5 border-t border-stone-200 flex flex-wrap items-center justify-between gap-3">
                                    <div className="flex flex-wrap items-center gap-2">
                                        {guide.recommendedSkus.map((skuItem) => (
                                            <Link
                                                key={skuItem.sku}
                                                href={skuItem.catalogHref}
                                                className="bg-transparent p-0 inline-flex"
                                            >
                                                <span className="inline-flex items-center gap-1.5 rounded-xs border border-stone-300 bg-stone-50 hover:border-stone-900 px-2.5 py-1 text-xs text-stone-900">
                                                    <CheckCircle2
                                                        className="w-3.5 h-3.5 text-emerald-700"
                                                        aria-hidden="true"
                                                    />
                                                    <span className="font-mono font-bold">{skuItem.sku}</span>
                                                    <span className="text-stone-600">({cleanDash(skuItem.roleLabel)})</span>
                                                </span>
                                            </Link>
                                        ))}
                                    </div>

                                    <div className="flex flex-wrap items-center gap-2">
                                        <div className="w-full sm:w-auto">
                                            <VytautasDiagnosticConsultButton
                                                prompt={ui.vytautasPrompt(
                                                    guide.title,
                                                    guide.optionA.name,
                                                    guide.optionB.name,
                                                    guide.recommendedSkus.map((s) => s.sku).join(', '),
                                                )}
                                                title={guide.title}
                                                summary={guide.aiDirectAnswer}
                                                recommendedSkus={guide.recommendedSkus.map((s) => s.sku)}
                                                label={ui.vytautasBtnLabel}
                                            />
                                        </div>
                                        <Link
                                            href={`/skaiciuokle?tab=${guide.calculatorTab}`}
                                            className="bg-transparent p-0 inline-flex"
                                        >
                                            <span className="inline-flex items-center gap-1.5 rounded-sm border border-stone-300 bg-white px-3 py-2 text-xs font-semibold text-stone-900 hover:border-stone-900 transition-colors">
                                                <Calculator className="w-3.5 h-3.5" aria-hidden="true" />
                                                <span>{ui.calcBtnLabel}</span>
                                            </span>
                                        </Link>
                                        <Link
                                            href={`/palyginimai/${guide.slug}`}
                                            className="inline-flex items-center gap-1.5 rounded-sm bg-[var(--primary)] hover:bg-[var(--brand-accent-hover)] px-4 py-2 text-xs font-semibold text-white transition-colors"
                                        >
                                            <span>{ui.fullGuideBtnLabel}</span>
                                        </Link>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>

                    {/* Bottom RFQ Notice */}
                    <div className="mt-8 rounded-md border border-stone-300 bg-white p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-2xs">
                        <div>
                            <div className="flex items-center gap-2 text-xs font-bold text-[var(--primary)] mb-1">
                                <HelpCircle className="w-4 h-4" aria-hidden="true" />
                                <span>{ui.rfqEyebrow}</span>
                            </div>
                            <h3 className="text-lg font-bold text-stone-900">
                                {ui.rfqTitle}
                            </h3>
                            <p className="text-sm text-stone-600 mt-1 max-w-2xl">
                                {ui.rfqDesc}
                            </p>
                        </div>
                        <Link
                            href="/uzklausa"
                            className="inline-flex items-center gap-2 rounded-sm bg-[var(--primary)] hover:bg-[var(--brand-accent-hover)] px-5 py-3 text-xs font-semibold text-white transition-colors shrink-0"
                        >
                            <FileText className="w-4 h-4" aria-hidden="true" />
                            <span>{ui.rfqBtn}</span>
                        </Link>
                    </div>
                </div>
            </section>
        </main>
    );
}
