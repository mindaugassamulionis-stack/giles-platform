import type { Metadata } from 'next';
import { getLegalPolicy } from '@/lib/storefront-content';
import { getStorefrontRuntimeConfig } from '@platform/database';
import { sanitizeHtml } from '@/lib/sanitize-html';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { ShieldCheck, FileText, Wrench, CheckCircle2, ArrowRight, Calculator, Sparkles } from 'lucide-react';

export const metadata: Metadata = {
    title: 'Pirkimo–pardavimo ir garantijos taisyklės | Gilės Inžinerija',
    description:
        'Gilės Inžinerija pirkimo–pardavimo taisyklės: oficiali 24 mėn. gamintojo garantija Danfoss, IMI Heimeier, IMI Pneumatex, IMI TA ir Ferroli įrangai, PVM sąskaitos faktūros ir B2B projektų sąmatos.',
};

const TERMS_TRUST_CARDS = [
    {
        badge: '24 MĖN. OFICIALI GARANTIJA',
        title: '100 % originali Danfoss, IMI ir Ferroli įranga',
        description:
            'Visai Danfoss, IMI Heimeier, IMI Pneumatex, IMI TA ir Ferroli įrangai taikoma oficiali 24 mėnesių gamintojo garantija bei ES kokybės standartai (CE, LST EN).',
        icon: ShieldCheck,
        accent: 'border-[#DC2626]',
    },
    {
        badge: 'PVM SĄSKAITOS FAKTŪROS',
        title: 'Automatinis PVM sąskaitų išrašymas fiziniams ir įmonėms',
        description:
            'Kainos svetainėje aiškiai rodomos su 21 % PVM ir be PVM. Kiekvienam užsakymui išrašoma oficiali PVM sąskaita faktūra, tinkama tiek APVA paramai, tiek įmonės buhalterijai.',
        icon: FileText,
        accent: 'border-[#0284C7]',
    },
    {
        badge: 'B2B PROJEKTŲ SĄMATOS (RFQ)',
        title: 'Pilnas katilinės ir objekto sukomplektavimas per 1 d. d.',
        description:
            'Montuotojams, projektuotojams ir statytojams rengiame individualias B2B sąmatas su kiekinėmis nuolaidomis, rezervuojame pozicijas sandėlyje ir patikriname sriegių suderinamumą.',
        icon: Wrench,
        accent: 'border-[#0284C7]',
    },
];

export default async function TermsPage() {
    const t = await getTranslations();
    const [policy, runtimeConfig] = await Promise.all([
        getLegalPolicy('terms'),
        getStorefrontRuntimeConfig(),
    ]);
    const showTrustSummary = runtimeConfig.features.trustPolicySummaries;
    const effectiveDate = policy?.effectiveAt
        ? new Date(policy.effectiveAt).toISOString().slice(0, 10)
        : '2026-01-01';
    const version = policy?.version || '3.1 (B2C + B2B ŠVOK)';

    return (
        <div className="min-h-screen bg-[#F0F4F8] text-[#0B192C] pb-20">
            {/* Hero Banner */}
            <section className="bg-[#0B192C] text-white border-b border-slate-800 pt-24 pb-12">
                <div className="h-[3px] w-full bg-[#DC2626] mb-8" />
                <div className="container mx-auto px-4 max-w-6xl">
                    <div className="flex flex-wrap items-center gap-3 mb-4">
                        <span className="inline-flex items-center gap-1.5 rounded-sm bg-[#DC2626]/20 border border-[#DC2626]/50 px-3 py-1 font-mono text-xs font-bold uppercase tracking-wider text-white">
                            <ShieldCheck className="w-3.5 h-3.5 text-[#38BDF8]" aria-hidden="true" />
                            24 MĖN. GAMINTOJO GARANTIJA · PVM SĄSKAITOS
                        </span>
                        <span className="font-mono text-xs text-slate-300">
                            Įsigalioja: {effectiveDate} · Versija: {version}
                        </span>
                    </div>
                    <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-4">
                        {t('legalTerms.title')}
                    </h1>
                    <p className="text-slate-300 text-base md:text-lg max-w-3xl leading-relaxed">
                        Aiškios ir sąžiningos pirkimo–pardavimo sąlygos namų šeimininkams, statytojams bei profesionaliems ŠVOK montuotojams.
                    </p>
                </div>
            </section>

            <div className="container mx-auto px-4 max-w-6xl -mt-6">
                {/* 30-second Buyer Trust Summary Box */}
                {showTrustSummary && (
                <section
                    aria-label="Pirkėjo pasitikėjimo santrauka"
                    className="rounded-md bg-white border-2 border-[#0284C7] shadow-md p-6 md:p-8 mb-10"
                >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 mb-6 border-b border-slate-200">
                        <div>
                            <p className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-[#DC2626] mb-1">
                                TRUMPAI IR AIŠKIAI (PIRKĖJO GARANTIJOS 30 SEK.)
                            </p>
                            <h2 className="font-display text-xl md:text-2xl font-extrabold text-[#0B192C]">
                                Pirkėjo pasitikėjimo santrauka (Svarbiausia per 30 sek.)
                            </h2>
                        </div>
                        <Link
                            href="/returns"
                            className="inline-flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider text-[#0284C7] hover:underline"
                        >
                            <span>14 d. grąžinimo ir keitimo sąlygos</span>
                            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {TERMS_TRUST_CARDS.map((card) => {
                            const Icon = card.icon;
                            return (
                                <div
                                    key={card.title}
                                    className={`rounded-sm bg-[#F8FAFC] border-t-4 ${card.accent} border border-slate-200 p-5 flex flex-col justify-between`}
                                >
                                    <div>
                                        <div className="flex items-center justify-between gap-2 mb-3">
                                            <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-[#0284C7]">
                                                {card.badge}
                                            </span>
                                            <Icon className="w-5 h-5 text-[#0B192C] shrink-0" aria-hidden="true" />
                                        </div>
                                        <h3 className="font-display text-base font-bold text-[#0B192C] mb-2">
                                            {card.title}
                                        </h3>
                                        <p className="text-sm text-slate-600 leading-relaxed">
                                            {card.description}
                                        </p>
                                    </div>
                                    <div className="mt-4 pt-3 border-t border-slate-200 flex items-center gap-1.5 font-mono text-[11px] font-semibold text-emerald-700">
                                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                                        <span>Oficiali tiekimo grandinė</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>
                )}

                {/* Detailed Terms Content */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-8 bg-white rounded-md border border-slate-200 p-6 md:p-10 shadow-xs space-y-8">
                        {policy?.contentText ? (
                            <div
                                className="prose prose-slate max-w-none leading-relaxed"
                                dangerouslySetInnerHTML={{ __html: sanitizeHtml(policy.contentText) }}
                            />
                        ) : null}
                        <section className="rounded-sm bg-[#F8FAFC] border border-slate-200 p-5 space-y-1.5">
                            <h2 className="font-display text-lg font-bold text-[#0B192C]">
                                Pardavėjo rekvizitai ir garantiniai įsipareigojimai
                            </h2>
                            <p className="text-sm font-bold text-[#0B192C]">UAB „Gilės inžinerija“</p>
                            <p className="text-sm text-slate-700">Įmonės kodas: 302620907 · PVM mokėtojo kodas: LT100006119810</p>
                            <p className="text-sm text-slate-700">Adresas: Žirmūnų g. 68, LT-09124 Vilnius · Eigulių g. 21, LT-51418 Kaunas</p>
                            <p className="text-sm font-mono text-[#0284C7] font-semibold">El. paštas: info@gilesinzinerija.lt</p>
                            <p className="text-xs text-slate-600 pt-1">
                                Garantijos: 14 d. grąžinimo garantija, 24 mėn. garantija originaliai Danfoss, IMI ir Ferroli įrangai, BDAR duomenų apsauga.
                            </p>
                        </section>
                        {!policy?.contentText && (
                            <>
                                <section className="space-y-3">
                                    <h2 className="font-display text-xl font-bold text-[#0B192C] border-b border-slate-200 pb-2">
                                        {t('legalTerms.s1')}
                                    </h2>
                                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                        {t('legalTerms.s1Body')}
                                    </p>
                                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                        {t('legalTerms.s1Body2')}
                                    </p>
                                </section>

                                <section className="space-y-3">
                                    <h2 className="font-display text-xl font-bold text-[#0B192C] border-b border-slate-200 pb-2">
                                        {t('legalTerms.s2')}
                                    </h2>
                                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                        {t('legalTerms.s2Body')}
                                    </p>
                                </section>

                                <section className="space-y-3">
                                    <h2 className="font-display text-xl font-bold text-[#0B192C] border-b border-slate-200 pb-2">
                                        {t('legalTerms.s3')}
                                    </h2>
                                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                        {t('legalTerms.s3Body')}
                                    </p>
                                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                        {t('legalTerms.s3Body2')}
                                    </p>
                                </section>

                                <section className="space-y-3">
                                    <h2 className="font-display text-xl font-bold text-[#0B192C] border-b border-slate-200 pb-2">
                                        {t('legalTerms.s4')}
                                    </h2>
                                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                        {t('legalTerms.s4Body')}
                                    </p>
                                    <p className="text-slate-600 text-sm md:text-base leading-relaxed">
                                        {t('legalTerms.s4Body2')}{' '}
                                        <Link href="/shipping" className="text-[#0284C7] font-bold underline">
                                            Pristatymo sąlygos →
                                        </Link>
                                    </p>
                                </section>

                                <section className="space-y-3">
                                    <h2 className="font-display text-xl font-bold text-[#0B192C] border-b border-slate-200 pb-2">
                                        {t('legalTerms.s5')}
                                    </h2>
                                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                        {t('legalTerms.s5Body')}
                                    </p>
                                    <p className="text-slate-700 text-sm md:text-base">
                                        {t('legalTerms.more')}{' '}
                                        <Link href="/returns" className="text-[#0284C7] font-bold underline">
                                            {t('legalTerms.returnsLink')}
                                        </Link>
                                    </p>
                                </section>

                                <section className="rounded-sm bg-[#F8FAFC] border border-slate-200 p-5 space-y-2">
                                    <h2 className="font-display text-lg font-bold text-[#0B192C]">
                                        {t('legalTerms.seller')}
                                    </h2>
                                    <p className="text-sm font-bold text-[#0B192C]">{t('legalTerms.company')}</p>
                                    <p className="text-sm text-slate-700">{t('legalTerms.code')}</p>
                                    <p className="text-sm text-slate-700">{t('legalTerms.vat')}</p>
                                    <p className="text-sm text-slate-700">{t('legalTerms.address')}</p>
                                    <p className="text-sm font-mono text-[#0284C7] font-semibold">{t('legalTerms.email')}</p>
                                </section>
                            </>
                        )}
                    </div>

                    {/* Sidebar */}
                    <aside className="lg:col-span-4 space-y-6">
                        <div className="rounded-md bg-[#0B192C] text-white p-6 border border-[#0284C7]/40">
                            <div className="h-1 w-full bg-[#DC2626] mb-5" />
                            <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-[#38BDF8] font-bold mb-2">
                                <Sparkles className="w-4 h-4 text-[#DC2626]" aria-hidden="true" />
                                <span>24/7 INŽINERINĖ PATIKRA</span>
                            </div>
                            <h3 className="font-display text-lg font-bold mb-2">
                                Abejojate dėl sriegio ar DN skersmens?
                            </h3>
                            <p className="text-xs text-slate-300 leading-relaxed mb-4">
                                Prieš apmokėdami užsakymą pasitikrinkite suderinamumą su AI inžinieriumi Vytautu arba atsidarykite techninį mazgų palyginimą.
                            </p>
                            <div className="space-y-2">
                                <Link
                                    href="/palyginimai"
                                    className="flex items-center justify-between py-2.5 px-3 rounded-sm bg-[#0F2537] hover:bg-[#0284C7] text-xs font-bold transition-colors"
                                >
                                    <span>8 ŠVOK mazgų palyginimai</span>
                                    <ArrowRight className="w-4 h-4 text-[#38BDF8]" aria-hidden="true" />
                                </Link>
                                <Link
                                    href="/skaiciuokle"
                                    className="flex items-center justify-between py-2.5 px-3 rounded-sm bg-[#0F2537] hover:bg-[#0284C7] text-xs font-bold transition-colors"
                                >
                                    <span>5 Inžinerinės skaičiuoklės</span>
                                    <Calculator className="w-4 h-4 text-[#DC2626]" aria-hidden="true" />
                                </Link>
                                <Link
                                    href="/uzklausa"
                                    className="flex items-center justify-between py-2.5 px-3 rounded-sm bg-[#DC2626] hover:bg-[#B91C1C] text-xs font-bold transition-colors"
                                >
                                    <span>Gauti B2B projekto sąmatą (RFQ)</span>
                                    <ArrowRight className="w-4 h-4 text-white" aria-hidden="true" />
                                </Link>
                            </div>
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    );
}
