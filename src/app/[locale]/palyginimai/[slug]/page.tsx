import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import { Link } from '../../../../i18n/navigation';
import {
    ArrowLeft,
    Calculator,
    CheckCircle2,
    ClipboardCheck,
    HelpCircle,
    ShieldCheck,
    BookOpen,
} from 'lucide-react';
import {
    HVAC_COMPARISON_GUIDES,
    getComparisonGuideBySlug,
} from '../../../../lib/hvac-comparisons-data';
import { VytautasDiagnosticConsultButton } from '../../../../components/symptom-diagnostic-finder';
import { searchCatalogProductsPaged, type ListingProduct } from '../../../../lib/catalog-listing';
import { resolveBrandLogo, resolveProductImageUrl } from '../../../../lib/product-visuals';
import { assetUrl } from '../../../../lib/api';
import { formatEur } from '../../../../lib/format';
import { escapeJsonLdForScript } from '../../../../lib/jsonld';
import { getBrandName, withBrandSuffix } from '../../../../lib/brand';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ locale: string; slug: string }> };

const cleanDash = (s: string) => s.replace(/\u2014/g, '–').replace(/[\u00A9\u00AE\u2122]/g, '');

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const brand = await getBrandName();
    const guide = getComparisonGuideBySlug(slug);
    if (!guide) return { title: withBrandSuffix('Palyginimas nerastas', brand) };
    return {
        title: withBrandSuffix(`${cleanDash(guide.title)} ŠVOK palyginimai`, brand),
        description: cleanDash(guide.aiDirectAnswer).slice(0, 160),
    };
}

export default async function HvacComparisonDetailPage({ params }: Props) {
    const { slug } = await params;
    const guide = getComparisonGuideBySlug(slug);
    if (!guide) notFound();

    const nonce = (await headers()).get('x-nonce') ?? undefined;
    const brand = await getBrandName();

    const liveMatches: ListingProduct[] = [];
    const seenIds = new Set<string>();
    for (const rec of guide.recommendedSkus) {
        const res = await searchCatalogProductsPaged({ q: rec.sku, page: 1, pageSize: 2 }).catch(
            () => ({ items: [] as ListingProduct[] }),
        );
        for (const item of res.items) {
            if (!seenIds.has(item.id)) {
                seenIds.add(item.id);
                liveMatches.push(item);
            }
        }
    }

    const otherGuides = HVAC_COMPARISON_GUIDES.filter((g) => g.slug !== guide.slug).slice(0, 4);

    const jsonLdPayload = {
        '@context': 'https://schema.org',
        '@graph': [
            {
                '@type': 'Article',
                headline: guide.title,
                description: guide.aiDirectAnswer,
                author: {
                    '@type': 'Organization',
                    name: 'UAB „Gilės inžinerija“ ŠVOK Inžinerijos Centras',
                },
                publisher: {
                    '@type': 'Organization',
                    name: 'UAB „Gilės inžinerija“',
                },
            },
            {
                '@type': 'FAQPage',
                mainEntity: [
                    {
                        '@type': 'Question',
                        name: guide.title,
                        acceptedAnswer: {
                            '@type': 'Answer',
                            text: guide.aiDirectAnswer,
                        },
                    },
                    ...guide.faqItems.map((faq) => ({
                        '@type': 'Question',
                        name: faq.question,
                        acceptedAnswer: {
                            '@type': 'Answer',
                            text: faq.answer,
                        },
                    })),
                ],
            },
        ],
    };

    const brandLogoA = resolveBrandLogo(guide.optionA.brand, guide.optionA.name);
    const brandLogoB = resolveBrandLogo(guide.optionB.brand, guide.optionB.name);

    return (
        <main className="min-h-screen bg-[var(--background)] text-stone-900 pb-16">
            <script
                type="application/ld+json"
                nonce={nonce}
                dangerouslySetInnerHTML={{
                    __html: escapeJsonLdForScript(JSON.stringify(jsonLdPayload)),
                }}
            />

            {/* Daylight Header */}
            <section className="bg-white border-b border-stone-200 py-6">
                <div className="container mx-auto max-w-5xl px-4 sm:px-6">
                    <Link
                        href="/palyginimai"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--secondary)] hover:underline mb-3"
                    >
                        <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Visi ŠVOK palyginimai ir gedimų diagnostika</span>
                    </Link>

                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-stone-900 leading-tight">
                        {cleanDash(guide.title)}
                    </h1>
                    <p className="text-sm md:text-base text-stone-600 mt-2 max-w-3xl">
                        {cleanDash(guide.questionHook)}
                    </p>
                </div>
            </section>

            <div className="container mx-auto max-w-5xl px-4 sm:px-6 mt-6 space-y-6">
                {/* 30-sec Direct Answer Box */}
                <section
                    aria-label="Trumpas atsakymas"
                    className="rounded-md border-2 border-[var(--secondary)] bg-white p-5 md:p-6 shadow-2xs"
                >
                    <p className="text-xs font-bold text-[var(--secondary)] mb-1.5">
                        Trumpas atsakymas (30 sek. santrauka):
                    </p>
                    <p className="text-base text-stone-900 font-medium leading-relaxed">
                        {cleanDash(guide.aiDirectAnswer)}
                    </p>
                </section>

                {/* Option A vs Option B Cards */}
                <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="rounded-md border border-stone-300 bg-white p-5 flex flex-col justify-between">
                        <div>
                            <div className="flex items-center justify-between gap-2 mb-3">
                                <span className="rounded-xs bg-stone-900 text-white px-2.5 py-0.5 text-xs font-semibold">
                                    1 variantas: {brandLogoA.name}
                                </span>
                                <span className="font-mono text-xs text-stone-600">
                                    SKU: {guide.optionA.representativeSku}
                                </span>
                            </div>
                            <h2 className="text-lg font-bold text-stone-900">
                                {cleanDash(guide.optionA.name)}
                            </h2>
                            <p className="text-sm text-stone-600 mt-2 leading-relaxed">
                                {cleanDash(guide.optionA.summary)}
                            </p>
                            <div className="mt-3 rounded-sm bg-[#FAF9F6] border border-stone-200 p-3 text-xs text-stone-800">
                                <span className="font-bold text-stone-900 block mb-0.5">
                                    Kada rinktis šį variantą:
                                </span>
                                {cleanDash(guide.optionA.bestFor)}
                            </div>
                        </div>
                        <Link
                            href={guide.optionA.catalogHref}
                            className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-[var(--primary)] hover:underline"
                        >
                            <span>Žiūrėti {guide.optionA.brand} prekes kataloge</span>
                        </Link>
                    </div>

                    <div className="rounded-md border border-stone-300 bg-white p-5 flex flex-col justify-between">
                        <div>
                            <div className="flex items-center justify-between gap-2 mb-3">
                                <span className="rounded-xs bg-[var(--secondary)] text-white px-2.5 py-0.5 text-xs font-semibold">
                                    2 variantas: {brandLogoB.name}
                                </span>
                                <span className="font-mono text-xs text-stone-600">
                                    SKU: {guide.optionB.representativeSku}
                                </span>
                            </div>
                            <h2 className="text-lg font-bold text-stone-900">
                                {cleanDash(guide.optionB.name)}
                            </h2>
                            <p className="text-sm text-stone-600 mt-2 leading-relaxed">
                                {cleanDash(guide.optionB.summary)}
                            </p>
                            <div className="mt-3 rounded-sm bg-[#FAF9F6] border border-stone-200 p-3 text-xs text-stone-800">
                                <span className="font-bold text-stone-900 block mb-0.5">
                                    Kada rinktis šį variantą:
                                </span>
                                {cleanDash(guide.optionB.bestFor)}
                            </div>
                        </div>
                        <Link
                            href={guide.optionB.catalogHref}
                            className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-[var(--secondary)] hover:underline"
                        >
                            <span>Žiūrėti {guide.optionB.brand} prekes kataloge</span>
                        </Link>
                    </div>
                </section>

                {/* Full Side-by-Side Comparison Table */}
                <section className="rounded-md border border-stone-300 bg-white p-5 md:p-6">
                    <h2 className="text-lg md:text-xl font-bold text-stone-900 mb-4">
                        Techninių parametrų palyginimo lentelė
                    </h2>
                    <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs md:text-sm">
                            <thead>
                                <tr className="border-b-2 border-stone-300 bg-stone-50 text-xs text-stone-800">
                                    <th className="py-3 px-3.5 font-semibold">Techninis kriterijus</th>
                                    <th className="py-3 px-3.5 font-semibold">{cleanDash(guide.optionA.name)}</th>
                                    <th className="py-3 px-3.5 font-semibold">{cleanDash(guide.optionB.name)}</th>
                                    <th className="py-3 px-3.5 font-semibold text-[var(--primary)]">Praktinė taisyklė</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-200">
                                {guide.comparisonRows.map((row, idx) => (
                                    <tr key={idx} className="hover:bg-stone-50">
                                        <td className="py-3 px-3.5 font-bold text-stone-900">
                                            {cleanDash(row.criterion)}
                                        </td>
                                        <td className="py-3 px-3.5 text-stone-700">{cleanDash(row.optionAValue)}</td>
                                        <td className="py-3 px-3.5 text-stone-700">{cleanDash(row.optionBValue)}</td>
                                        <td className="py-3 px-3.5 font-semibold text-stone-900">
                                            {cleanDash(row.winnerOrRule)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div
                        className="md:hidden flex flex-col gap-3"
                        data-testid="mobile-comparison-cards"
                    >
                        {guide.comparisonRows.map((row, idx) => (
                            <div
                                key={idx}
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
                                    <span className="text-emerald-800 font-bold mr-1">Praktinė taisyklė:</span>
                                    {cleanDash(row.winnerOrRule)}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Step-by-Step Diagnostic Checklist */}
                <section className="rounded-md border border-stone-300 bg-white p-5 md:p-6">
                    <div className="flex items-center gap-2 text-xs font-bold text-[var(--secondary)] mb-1.5">
                        <ClipboardCheck className="w-4 h-4 text-[var(--primary)]" aria-hidden="true" />
                        <span>Meistro patikros sąrašas prieš perkant</span>
                    </div>
                    <h2 className="text-lg md:text-xl font-bold text-stone-900 mb-4">
                        3 žingsnių patikra, kad neapsirikite užsakydami
                    </h2>
                    <ol className="space-y-2.5">
                        {guide.diagnosticChecklist.map((step, idx) => (
                            <li
                                key={idx}
                                className="flex items-start gap-3 rounded-sm border border-stone-200 bg-[#FAF9F6] p-3.5"
                            >
                                <span className="w-6 h-6 rounded-xs bg-stone-900 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                                    {idx + 1}
                                </span>
                                <span className="text-sm text-stone-700 leading-relaxed">{cleanDash(step)}</span>
                            </li>
                        ))}
                    </ol>
                </section>

                {/* Recommended Catalog Products + Calculator Strip (Daylight) */}
                <section className="rounded-md border border-stone-300 bg-white p-5 md:p-6 shadow-2xs">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
                        <div>
                            <div className="flex items-center gap-2 text-xs font-bold text-emerald-700">
                                <ShieldCheck className="w-4 h-4" aria-hidden="true" />
                                <span>{`Rekomenduojamos prekės iš ${brand} sandėlio`}</span>
                            </div>
                            <h2 className="text-lg md:text-xl font-bold text-stone-900 mt-1">
                                Šiam sprendimui tinkanti sertifikuota įranga
                            </h2>
                        </div>
                        <div className="flex flex-wrap items-center gap-2.5">
                            <div className="w-full sm:w-auto">
                                <VytautasDiagnosticConsultButton
                                    prompt={`Skaitau techninį palyginimą: ${guide.title} (${guide.optionA.name} vs. ${guide.optionB.name}). Padėk pasirinkti tinkamą variantą ir sukomplektuoti prekes (${guide.recommendedSkus.map((s) => s.sku).join(', ')}).`}
                                    title={guide.title}
                                    summary={guide.aiDirectAnswer}
                                    recommendedSkus={guide.recommendedSkus.map((s) => s.sku)}
                                    label="Pasikonsultuoti su Vytautu"
                                />
                            </div>
                            <Link
                                href={`/skaiciuokle?tab=${guide.calculatorTab}`}
                                className="inline-flex items-center gap-2 rounded-sm bg-[var(--primary)] hover:bg-[var(--brand-accent-hover)] px-4 py-2.5 text-xs font-semibold text-white transition-colors shrink-0"
                            >
                                <Calculator className="w-4 h-4" aria-hidden="true" />
                                <span>{cleanDash(guide.calculatorLabel)}</span>
                            </Link>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {liveMatches.length > 0
                            ? liveMatches.map((prod) => {
                                  const imgUrl = assetUrl(
                                      prod.imageUrl ||
                                          resolveProductImageUrl({
                                              sku: prod.sku,
                                              title: prod.nameLt || prod.name,
                                              brand: prod.brandName,
                                          }),
                                  );
                                  const bLogo = resolveBrandLogo(prod.brandName, prod.nameLt || prod.name);
                                  return (
                                      <Link
                                          key={prod.id}
                                            href={`/products/${prod.slug || prod.id}`}
                                          className="group flex items-center gap-4 rounded-sm border border-stone-300 bg-[#FAF9F6] p-4 hover:border-stone-900 transition-colors"
                                      >
                                          <div className="w-16 h-16 rounded-xs border border-stone-200 bg-white p-1.5 flex items-center justify-center shrink-0">
                                              <img
                                                  src={imgUrl}
                                                  alt={cleanDash(prod.nameLt || prod.name)}
                                                  className="max-h-full max-w-full object-contain"
                                              />
                                          </div>
                                          <div className="min-w-0 flex-1">
                                              <div className="flex items-center justify-between gap-2 mb-1">
                                                  <img
                                                      src={assetUrl(bLogo.logoPath)}
                                                      alt={bLogo.name}
                                                      className="h-4 w-auto object-contain"
                                                  />
                                                  <span className="font-mono text-[11px] text-stone-600">
                                                      SKU: {prod.sku}
                                                  </span>
                                              </div>
                                              <p className="text-sm font-bold text-stone-900 group-hover:text-[var(--primary)] leading-snug mt-0.5">
                                                  {cleanDash(prod.nameLt || prod.name)}
                                              </p>
                                              <div className="flex items-center justify-between gap-2 mt-2">
                                                  <span className="text-xs font-bold text-stone-900 tabular-nums">
                                                      {prod.price > 0 ? formatEur(prod.price) : 'Pagal užklausą'}
                                                  </span>
                                                  <span className="text-xs font-semibold text-[var(--secondary)]">
                                                      Peržiūrėti prekę
                                                  </span>
                                              </div>
                                          </div>
                                      </Link>
                                  );
                              })
                            : guide.recommendedSkus.map((rec) => {
                                  const imgUrl = assetUrl(
                                      resolveProductImageUrl({
                                          sku: rec.sku,
                                          title: rec.name,
                                          brand: rec.brand,
                                      }),
                                  );
                                  const bLogo = resolveBrandLogo(rec.brand, rec.name);
                                  return (
                                      <Link
                                          key={rec.sku}
                                          href={rec.catalogHref}
                                          className="group flex items-center gap-4 rounded-sm border border-stone-300 bg-[#FAF9F6] p-4 hover:border-stone-900 transition-colors"
                                      >
                                          <div className="w-16 h-16 rounded-xs border border-stone-200 bg-white p-1.5 flex items-center justify-center shrink-0">
                                              <img
                                                  src={imgUrl}
                                                  alt={cleanDash(rec.name)}
                                                  className="max-h-full max-w-full object-contain"
                                              />
                                          </div>
                                          <div className="min-w-0 flex-1">
                                              <div className="flex items-center justify-between gap-2 mb-1">
                                                  <img
                                                      src={assetUrl(bLogo.logoPath)}
                                                      alt={bLogo.name}
                                                      className="h-4 w-auto object-contain"
                                                  />
                                                  <span className="font-mono text-[11px] text-stone-600">
                                                      SKU: {rec.sku}
                                                  </span>
                                              </div>
                                              <p className="text-sm font-bold text-stone-900 group-hover:text-[var(--primary)] leading-snug mt-0.5">
                                                  {cleanDash(rec.name)}
                                              </p>
                                              <div className="flex items-center justify-between gap-2 mt-2">
                                                  <span className="inline-flex items-center gap-1 text-xs text-emerald-700 font-medium">
                                                      <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                                                      {cleanDash(rec.roleLabel)}
                                                  </span>
                                                  <span className="text-xs font-bold text-stone-900 tabular-nums">
                                                      {cleanDash(rec.priceEstimateLabel)}
                                                  </span>
                                              </div>
                                          </div>
                                      </Link>
                                  );
                              })}
                    </div>
                </section>

                {/* FAQ Section */}
                <section className="rounded-md border border-stone-300 bg-white p-5 md:p-6">
                    <div className="flex items-center gap-2 text-xs font-bold text-[var(--secondary)] mb-1.5">
                        <HelpCircle className="w-4 h-4 text-[var(--primary)]" aria-hidden="true" />
                        <span>Dažniausiai užduodami klausimai (DUK)</span>
                    </div>
                    <h2 className="text-lg md:text-xl font-bold text-stone-900 mb-4">
                        Atsakymai į praktinius montavimo klausimus
                    </h2>
                    <div className="space-y-3">
                        {guide.faqItems.map((faq, idx) => (
                            <div
                                key={idx}
                                className="rounded-sm border border-stone-200 bg-[#FAF9F6] p-4"
                            >
                                <h3 className="text-sm md:text-base font-bold text-stone-900">
                                    {cleanDash(faq.question)}
                                </h3>
                                <p className="text-sm text-stone-700 mt-1.5 leading-relaxed">
                                    {cleanDash(faq.answer)}
                                </p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Related Comparisons */}
                <section className="rounded-md border border-stone-300 bg-white p-5 md:p-6">
                    <div className="flex items-center justify-between gap-2 mb-4">
                        <h2 className="text-lg font-bold text-stone-900 flex items-center gap-2">
                            <BookOpen className="w-4 h-4 text-[var(--secondary)]" aria-hidden="true" />
                            <span>Kiti ŠVOK techniniai palyginimai</span>
                        </h2>
                        <Link
                            href="/palyginimai"
                            className="text-xs font-semibold text-[var(--secondary)] hover:underline"
                        >
                            Visi {HVAC_COMPARISON_GUIDES.length} gidų
                        </Link>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {otherGuides.map((other) => (
                            <Link
                                key={other.slug}
                                href={`/palyginimai/${other.slug}`}
                                className="rounded-sm border border-stone-200 p-3.5 hover:border-stone-900 transition-colors"
                            >
                                <span className="text-xs font-semibold text-[var(--secondary)]">
                                    {cleanDash(other.optionA.brand)} ir {cleanDash(other.optionB.brand)}
                                </span>
                                <p className="text-sm font-bold text-stone-900 mt-1">
                                    {cleanDash(other.title)}
                                </p>
                            </Link>
                        ))}
                    </div>
                </section>
            </div>
        </main>
    );
}
