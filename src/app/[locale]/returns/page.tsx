import type { Metadata } from 'next';
import { getLegalPolicy } from '@/lib/storefront-content';
import { getStorefrontRuntimeConfig } from '@platform/database';
import { sanitizeHtml } from '@/lib/sanitize-html';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { RefreshCw, ShieldCheck, Truck, CheckCircle2, ArrowRight, Wrench, Sparkles } from 'lucide-react';
import { getBrandName, withBrandSuffix } from '../../../lib/brand';

export async function generateMetadata(): Promise<Metadata> {
    const brand = await getBrandName();
    return {
        title: withBrandSuffix('14 dienų grąžinimo, sriegių keitimo ir garantijos taisyklės', brand),
        description: `${brand} grąžinimo ir garantijos sąlygos: 14 dienų nenaudotų detalių grąžinimas, nemokamas keitimas jei netiko sriegis (DN15 vs DN20 arba RA Click vs M30×1.5) ir 24 mėn. gamintojo garantija.`,
    };
}

const RETURNS_TRUST_CARDS = [
    {
        badge: '14 DIENŲ BE RIZIKOS',
        title: '14 d. nenaudotų detalių grąžinimas originalioje pakuotėje',
        description:
            'Liko nesumontuotų vožtuvų, galvučių ar jungčių po katilinės montavimo? Nenaudotas detales originalioje pakuotėje grąžinkite per 14 kalendorinių dienų.',
        icon: ShieldCheck,
        accent: 'border-[#0284C7]',
    },
    {
        badge: 'NEMOKAMAS SRIEGIO / DN KEITIMAS',
        title: 'Netiko DN15 vs DN20 ar RA Click vs M30×1.5? Pakeisime!',
        description:
            'Užsisakėte termostatinę galvutę ar vožtuvą ir pamatėte, kad Jūsų radiatoriaus sriegis kito standarto (pvz., Danfoss RA Click vietoj M30×1.5 arba DN15 vietoj DN20)? Nemokamai pakeisime į derančią poziciją.',
        icon: RefreshCw,
        accent: 'border-[#DC2626]',
    },
    {
        badge: '1–3 D. D. PRISTATYMAS LIETUVOJE',
        title: 'Greitas pristatymas į namus, objektą arba paštomatą',
        description:
            'Smulkias detales siunčiame į Omniva / DPD / LP Express paštomatus, o katilus, kolektorius ir plėtimosi indus pristatome kurjeriu tiesiai į statybvietę.',
        icon: Truck,
        accent: 'border-[#0284C7]',
    },
];

export default async function ReturnsPage() {
    const t = await getTranslations();
    const [policy, runtimeConfig] = await Promise.all([
        getLegalPolicy('refund'),
        getStorefrontRuntimeConfig(),
    ]);
    const showTrustSummary = runtimeConfig.features.trustPolicySummaries;
    const effectiveDate = policy?.effectiveAt
        ? new Date(policy.effectiveAt).toISOString().slice(0, 10)
        : '2026-01-01';
    const version = policy?.version || '2.8 (14 d. grąžinimas + DN keitimas)';

    return (
        <div className="min-h-screen bg-[#F0F4F8] text-[#0B192C] pb-20">
            {/* Hero Banner */}
            <section className="bg-[#0B192C] text-white border-b border-slate-800 pt-24 pb-12">
                <div className="h-[3px] w-full bg-[#DC2626] mb-8" />
                <div className="container mx-auto px-4 max-w-6xl">
                    <div className="flex flex-wrap items-center gap-3 mb-4">
                        <span className="inline-flex items-center gap-1.5 rounded-sm bg-[#DC2626]/20 border border-[#DC2626]/50 px-3 py-1 font-mono text-xs font-bold uppercase tracking-wider text-white">
                            <RefreshCw className="w-3.5 h-3.5 text-[#38BDF8]" aria-hidden="true" />
                            14 D. GRĄŽINIMAS · NEMOKAMAS DN / SRIEGIO KEITIMAS
                        </span>
                        <span className="font-mono text-xs text-slate-300">
                            Įsigalioja: {effectiveDate} · Versija: {version}
                        </span>
                    </div>
                    <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-4">
                        {t('legalReturns.title')}
                    </h1>
                    <p className="text-slate-300 text-base md:text-lg max-w-3xl leading-relaxed">
                        Pirkite šildymo ir santechnikos įrangą be baimės suklysti: jei netiko sriegis ar skersmuo, detalę operatyviai pakeisime arba grąžinsime pinigus.
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
                            href="/shipping"
                            className="inline-flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider text-[#0284C7] hover:underline"
                        >
                            <span>Pristatymo terminai ir būdai</span>
                            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {RETURNS_TRUST_CARDS.map((card) => {
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
                                        <span>Saugus pirkimas Gilės Inžinerija</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>
                )}

                {/* Detailed Return Clauses */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-8 bg-white rounded-md border border-slate-200 p-6 md:p-10 shadow-xs space-y-8">
                        {policy?.contentText ? (
                            <div
                                className="prose prose-slate max-w-none leading-relaxed"
                                dangerouslySetInnerHTML={{ __html: sanitizeHtml(policy.contentText) }}
                            />
                        ) : (
                            <>
                                <div className="rounded-sm bg-[#0B192C] text-white p-5 border-t-4 border-[#DC2626]">
                                    <p className="text-sm md:text-base leading-relaxed">
                                        <strong className="text-[#38BDF8] font-mono uppercase tracking-wider mr-2">
                                            {t('legalReturns.important')}
                                        </strong>
                                        {t('legalReturns.importantBody')}
                                    </p>
                                </div>

                                <section className="space-y-3">
                                    <h2 className="font-display text-xl font-bold text-[#0B192C] border-b border-slate-200 pb-2">
                                        {t('legalReturns.s14')}
                                    </h2>
                                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                        {t('legalReturns.s14Body')}
                                    </p>
                                    <ol className="space-y-2 text-sm md:text-base text-slate-700 list-decimal pl-5">
                                        <li>{t('legalReturns.step1')}</li>
                                        <li>{t('legalReturns.step2')}</li>
                                        <li>{t('legalReturns.step3')}</li>
                                    </ol>
                                </section>

                                <section className="space-y-3">
                                    <h2 className="font-display text-xl font-bold text-[#0B192C] border-b border-slate-200 pb-2">
                                        Nemokamas keitimas, jei netiko sriegis ar DN skersmuo
                                    </h2>
                                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                        Inžinerinėje praktikoje dažniausiai pasitaiko sriegių arba jungčių neatitikimai: pavyzdžiui, užsakomas <strong>DN15 (1/2&quot;)</strong> vožtuvas vietoj <strong>DN20 (3/4&quot;)</strong>, arba <strong>M30×1.5</strong> termostatinė galvutė senesniam <strong>Danfoss RA 23 mm Click</strong> korpusui. Tokiu atveju nenaudotą detalę originalioje pakuotėje nemokamai pakeičiame į tiksliai Jūsų mazgui tinkančią poziciją.
                                    </p>
                                </section>

                                <section className="space-y-3">
                                    <h2 className="font-display text-xl font-bold text-[#0B192C] border-b border-slate-200 pb-2">
                                        {t('legalReturns.conditions')}
                                    </h2>
                                    <p className="font-bold text-emerald-700 text-sm uppercase tracking-wider">
                                        {t('legalReturns.accept')}
                                    </p>
                                    <ul className="space-y-2 text-sm md:text-base text-slate-700 list-disc pl-5">
                                        <li>{t('legalReturns.accept1')}</li>
                                        <li>{t('legalReturns.accept2')}</li>
                                    </ul>
                                    <p className="font-bold text-[#DC2626] text-sm uppercase tracking-wider pt-3">
                                        {t('legalReturns.reject')}
                                    </p>
                                    <ul className="space-y-2 text-sm md:text-base text-slate-700 list-disc pl-5">
                                        <li>{t('legalReturns.reject1')}</li>
                                        <li>{t('legalReturns.reject2')}</li>
                                    </ul>
                                </section>

                                <section className="space-y-3">
                                    <h2 className="font-display text-xl font-bold text-[#0B192C] border-b border-slate-200 pb-2">
                                        {t('legalReturns.refunds')}
                                    </h2>
                                    <p className="text-slate-700 text-sm md:text-base">{t('legalReturns.refund1')}</p>
                                    <p className="text-slate-700 text-sm md:text-base">{t('legalReturns.refund2')}</p>
                                </section>

                                <section className="space-y-3">
                                    <h2 className="font-display text-xl font-bold text-[#0B192C] border-b border-slate-200 pb-2">
                                        {t('legalReturns.defects')}
                                    </h2>
                                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                        {t('legalReturns.defectsBody')}
                                    </p>
                                    <ol className="space-y-2 text-sm md:text-base text-slate-700 list-decimal pl-5">
                                        <li>{t('legalReturns.defect1')}</li>
                                        <li>{t('legalReturns.defect2')}</li>
                                        <li>{t('legalReturns.defect3')}</li>
                                    </ol>
                                </section>

                                <section className="rounded-sm bg-[#F8FAFC] border border-slate-200 p-5 space-y-2">
                                    <h2 className="font-display text-lg font-bold text-[#0B192C]">
                                        {t('legalReturns.addressTitle')}
                                    </h2>
                                    <p className="text-sm font-bold text-[#0B192C]">{t('legalReturns.company')}</p>
                                    <p className="text-sm text-slate-700">{t('legalReturns.address')}</p>
                                    <p className="text-sm text-slate-700">{t('legalReturns.cityPostal')}</p>
                                    <p className="text-xs text-slate-500 pt-2">
                                        {t('legalReturns.disputes')}: {t('legalReturns.odr')}{' '}
                                        <a href="https://ec.europa.eu/odr" target="_blank" rel="noreferrer" className="text-[#0284C7] underline">
                                            {t('legalReturns.odrLink')}
                                        </a>
                                    </p>
                                </section>
                            </>
                        )}
                    </div>

                    {/* Sidebar */}
                    <aside className="lg:col-span-4 space-y-6">
                        <div className="rounded-md bg-[#0B192C] text-white p-6 border border-[#0284C7]/40">
                            <div className="h-1 w-full bg-[#DC2626] mb-5" />
                            <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-[#38BDF8] font-bold mb-2">
                                <Wrench className="w-4 h-4 text-[#DC2626]" aria-hidden="true" />
                                <span>PATIKRINKITE PRIEŠ UŽSAKANT</span>
                            </div>
                            <h3 className="font-display text-lg font-bold mb-2">
                                Kaip nesuklysti dėl RA Click ir M30×1.5?
                            </h3>
                            <p className="text-xs text-slate-300 leading-relaxed mb-4">
                                Atidarykite mūsų paruoštą Danfoss ir IMI Heimeier jungčių palyginimą arba užduokite klausimą Vytautui.
                            </p>
                            <div className="space-y-2">
                                <Link
                                    href="/palyginimai/danfoss-ra-click-vs-m30-sriegis"
                                    className="flex items-center justify-between py-2.5 px-3 rounded-sm bg-[#0F2537] hover:bg-[#0284C7] text-xs font-bold transition-colors"
                                >
                                    <span>Danfoss RA Click vs M30×1.5 gidas</span>
                                    <ArrowRight className="w-4 h-4 text-[#38BDF8]" aria-hidden="true" />
                                </Link>
                                <Link
                                    href="/shipping"
                                    className="flex items-center justify-between py-2.5 px-3 rounded-sm bg-[#0F2537] hover:bg-[#0284C7] text-xs font-bold transition-colors"
                                >
                                    <span>Pristatymo į objektą ir paštomatus sąlygos</span>
                                    <ArrowRight className="w-4 h-4 text-[#38BDF8]" aria-hidden="true" />
                                </Link>
                                <Link
                                    href="/contact"
                                    className="flex items-center justify-between py-2.5 px-3 rounded-sm bg-[#DC2626] hover:bg-[#B91C1C] text-xs font-bold transition-colors"
                                >
                                    <span>Susisiekti dėl keitimo ar grąžinimo</span>
                                    <Sparkles className="w-4 h-4 text-white" aria-hidden="true" />
                                </Link>
                            </div>
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    );
}
