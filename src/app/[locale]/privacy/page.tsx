import type { Metadata } from 'next';
import { getLegalPolicy } from '@/lib/storefront-content';
import { getStorefrontRuntimeConfig } from '@platform/database';
import { sanitizeHtml } from '@/lib/sanitize-html';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { ShieldCheck, Lock, Sparkles, Calculator, CheckCircle2, ArrowRight, FileText } from 'lucide-react';
import { getBrandName, withBrandSuffix } from '../../../lib/brand';
import { EmailText } from '../../../components/email';

export async function generateMetadata(): Promise<Metadata> {
    const brand = await getBrandName();
    return {
        title: withBrandSuffix('Privatumo ir BDAR duomenų apsaugos politika', brand),
        description: `${brand} privatumo politika (BDAR / GDPR): kaip saugomi užsakymų duomenys, kodėl 5 ŠVOK skaičiuoklių bei Vytauto AI istorija saugoma tik Jūsų naršyklėje ir nulis brukalo garantija.`,
    };
}

const PRIVACY_TRUST_CARDS = [
    {
        badge: 'BDAR / GDPR APSAUGA',
        title: 'Griežta ES duomenų apsauga ir konfidencialumas',
        description:
            'Jūsų vardo, pristatymo adreso ir PVM sąskaitų faktūrų duomenys naudojami tik užsakymo pristatymui, apskaitai ir 24 mėn. Danfoss / IMI Hydronic / Ferroli garantiniam aptarnavimui.',
        icon: ShieldCheck,
        accent: 'border-[#0284C7]',
    },
    {
        badge: 'VIETINĖ NARŠYKLĖS ATMINTIS',
        title: 'Skaičiuoklių ir Vytauto AI istorija – tik Jūsų įrenginyje',
        description:
            '5 ŠVOK skaičiuoklių įvestys (kW, DN, litrai) ir konsultacijos su AI asistentu Vytautu saugomos lokaliai Jūsų naršyklėje, kad galėtumėte patogiai sukomplektuoti mazgą be privalomos registracijos.',
        icon: Sparkles,
        accent: 'border-[#DC2626]',
    },
    {
        badge: 'NULIS BRUKALO (ZERO SPAM)',
        title: 'Jokių įkyrių skambučių ar duomenų pardavimo',
        description:
            'Niekada neperduodame Jūsų el. pašto ar telefono numerio trečiųjų šalių reklamos biržoms. Techninius naujienlaiškius siunčiame tik gavę aiškų Jūsų sutikimą.',
        icon: Lock,
        accent: 'border-[#0284C7]',
    },
];

export default async function PrivacyPage() {
    const t = await getTranslations();
    const [policy, runtimeConfig] = await Promise.all([
        getLegalPolicy('privacy'),
        getStorefrontRuntimeConfig(),
    ]);
    const showTrustSummary = runtimeConfig.features.trustPolicySummaries;
    const effectiveDate = policy?.effectiveAt
        ? new Date(policy.effectiveAt).toISOString().slice(0, 10)
        : '2026-01-01';
    const version = policy?.version || '2.4 (BDAR / ŠVOK)';

    return (
        <div className="min-h-screen bg-[#F0F4F8] text-[#0B192C] pb-20">
            {/* Hero Banner */}
            <section className="bg-[#0B192C] text-white border-b border-slate-800 pt-24 pb-12">
                {/* 3px Thermal Accent Bar */}
                <div className="h-[3px] w-full bg-[#DC2626] mb-8" />
                <div className="container mx-auto px-4 max-w-6xl">
                    <div className="flex flex-wrap items-center gap-3 mb-4">
                        <span className="inline-flex items-center gap-1.5 rounded-sm bg-[#0284C7]/20 border border-[#38BDF8]/40 px-3 py-1 font-mono text-xs font-bold uppercase tracking-wider text-[#38BDF8]">
                            <ShieldCheck className="w-3.5 h-3.5 text-[#DC2626]" aria-hidden="true" />
                            ES BDAR (GDPR) ATITIKTIS
                        </span>
                        <span className="font-mono text-xs text-slate-300">
                            Įsigalioja: {effectiveDate} · Versija: {version}
                        </span>
                    </div>
                    <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-4">
                        {t('legalPrivacy.title')}
                    </h1>
                    <p className="text-slate-300 text-base md:text-lg max-w-3xl leading-relaxed">
                        Skaidriai paaiškiname, kaip saugome pirkėjų bei B2B montuotojų duomenis, kodėl ŠVOK skaičiuoklių parametrai lieka Jūsų naršyklėje ir kaip užtikriname 100 % privatumą.
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
                            href="/cookies"
                            className="inline-flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider text-[#0284C7] hover:underline"
                        >
                            <span>Slapukų ir atminties lentelė</span>
                            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {PRIVACY_TRUST_CARDS.map((card) => {
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
                                        <span>Garantuota Gilės Inžinerija</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>
                )}

                {/* Detailed Legal Clauses + Quick Navigation */}
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
                                Duomenų valdytojo ir pardavėjo rekvizitai (BDAR / GDPR)
                            </h2>
                            <p className="text-sm font-bold text-[#0B192C]">UAB „Gilės inžinerija“</p>
                            <p className="text-sm text-slate-700">Įmonės kodas: 302620907 · PVM mokėtojo kodas: LT100006119810</p>
                            <p className="text-sm text-slate-700">Adresas: Žirmūnų g. 68, LT-09124 Vilnius · Eigulių g. 21, LT-51418 Kaunas</p>
                            <p className="text-sm font-mono text-[#0284C7] font-semibold">
                                El. paštas: <EmailText email="info@gilesinzinerija.lt" />
                            </p>
                            <p className="text-xs text-slate-600 pt-1">
                                Pirkėjų teisės: 14 d. grąžinimo garantija, 24 mėn. oficiali gamintojo garantija ir visos ES BDAR duomenų subjekto teisės.
                            </p>
                        </section>
                        {!policy?.contentText && (
                            <>
                                <section className="space-y-3">
                                    <h2 className="font-display text-xl font-bold text-[#0B192C] border-b border-slate-200 pb-2">
                                        {t('legalPrivacy.s1')}
                                    </h2>
                                    <p className="text-slate-700 text-sm md:text-base leading-relaxed font-semibold">
                                        {t('legalPrivacy.company')}
                                    </p>
                                    <p className="text-slate-600 text-sm md:text-base leading-relaxed">
                                        {t('legalPrivacy.contact')}
                                    </p>
                                </section>

                                <section className="space-y-3">
                                    <h2 className="font-display text-xl font-bold text-[#0B192C] border-b border-slate-200 pb-2">
                                        {t('legalPrivacy.s2')}
                                    </h2>
                                    <ul className="space-y-2.5 text-sm md:text-base text-slate-700">
                                        <li className="flex items-start gap-2.5">
                                            <CheckCircle2 className="w-4 h-4 text-[#0284C7] shrink-0 mt-1" aria-hidden="true" />
                                            <span>{t('legalPrivacy.d1')}</span>
                                        </li>
                                        <li className="flex items-start gap-2.5">
                                            <CheckCircle2 className="w-4 h-4 text-[#0284C7] shrink-0 mt-1" aria-hidden="true" />
                                            <span>{t('legalPrivacy.d2')}</span>
                                        </li>
                                        <li className="flex items-start gap-2.5">
                                            <CheckCircle2 className="w-4 h-4 text-[#0284C7] shrink-0 mt-1" aria-hidden="true" />
                                            <span>{t('legalPrivacy.d3')}</span>
                                        </li>
                                        <li className="flex items-start gap-2.5">
                                            <CheckCircle2 className="w-4 h-4 text-[#DC2626] shrink-0 mt-1" aria-hidden="true" />
                                            <span>{t('legalPrivacy.d4')}</span>
                                        </li>
                                    </ul>
                                </section>

                                <section className="space-y-3">
                                    <h2 className="font-display text-xl font-bold text-[#0B192C] border-b border-slate-200 pb-2">
                                        {t('legalPrivacy.s3')}
                                    </h2>
                                    <ul className="space-y-2.5 text-sm md:text-base text-slate-700">
                                        <li className="flex items-start gap-2.5">
                                            <span className="font-mono font-bold text-[#0284C7]">01.</span>
                                            <span>{t('legalPrivacy.p1')}</span>
                                        </li>
                                        <li className="flex items-start gap-2.5">
                                            <span className="font-mono font-bold text-[#0284C7]">02.</span>
                                            <span>{t('legalPrivacy.p2')}</span>
                                        </li>
                                        <li className="flex items-start gap-2.5">
                                            <span className="font-mono font-bold text-[#0284C7]">03.</span>
                                            <span>{t('legalPrivacy.p3')}</span>
                                        </li>
                                        <li className="flex items-start gap-2.5">
                                            <span className="font-mono font-bold text-[#DC2626]">04.</span>
                                            <span>{t('legalPrivacy.p4')}</span>
                                        </li>
                                    </ul>
                                </section>

                                <section className="space-y-3">
                                    <h2 className="font-display text-xl font-bold text-[#0B192C] border-b border-slate-200 pb-2">
                                        {t('legalPrivacy.s4')}
                                    </h2>
                                    <ul className="space-y-2 text-sm md:text-base text-slate-700 list-disc pl-5">
                                        <li>{t('legalPrivacy.r1')}</li>
                                        <li>{t('legalPrivacy.r2')}</li>
                                        <li>{t('legalPrivacy.r3')}</li>
                                        <li>{t('legalPrivacy.r4')}</li>
                                        <li>{t('legalPrivacy.r5')}</li>
                                    </ul>
                                </section>

                                <section className="space-y-3">
                                    <h2 className="font-display text-xl font-bold text-[#0B192C] border-b border-slate-200 pb-2">
                                        {t('legalPrivacy.s5')}
                                    </h2>
                                    <p className="text-slate-700 text-sm md:text-base">{t('legalPrivacy.exercise')}</p>
                                    <p className="text-slate-600 text-sm md:text-base">{t('legalPrivacy.respond')}</p>
                                    <p className="text-slate-600 text-sm md:text-base">{t('legalPrivacy.complaints')}</p>
                                </section>

                                <section className="space-y-3">
                                    <h2 className="font-display text-xl font-bold text-[#0B192C] border-b border-slate-200 pb-2">
                                        {t('legalPrivacy.s6')}
                                    </h2>
                                    <p className="text-slate-700 text-sm md:text-base">
                                        {t('legalPrivacy.more')}{' '}
                                        <Link href="/cookies" className="text-[#0284C7] font-bold underline">
                                            {t('legalPrivacy.cookiesLink')}
                                        </Link>
                                    </p>
                                </section>
                            </>
                        )}
                    </div>

                    {/* Sidebar Trust & Policy Links */}
                    <aside className="lg:col-span-4 space-y-6">
                        <div className="rounded-md bg-[#0B192C] text-white p-6 border border-[#0284C7]/40">
                            <div className="h-1 w-full bg-[#DC2626] mb-5" />
                            <p className="font-mono text-xs uppercase tracking-wider text-[#38BDF8] font-bold mb-2">
                                KITI TEISINIAI IR GARANTIJŲ DOKUMENTAI
                            </p>
                            <h3 className="font-display text-lg font-bold mb-4">
                                Pirkėjo apsauga kiekviename žingsnyje
                            </h3>
                            <ul className="space-y-2.5 text-sm">
                                <li>
                                    <Link href="/terms" className="flex items-center justify-between py-2 px-3 rounded-sm bg-[#0F2537] hover:bg-[#0284C7] transition-colors">
                                        <span>Pirkimo–pardavimo taisyklės</span>
                                        <ArrowRight className="w-4 h-4 text-[#38BDF8]" aria-hidden="true" />
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/shipping" className="flex items-center justify-between py-2 px-3 rounded-sm bg-[#0F2537] hover:bg-[#0284C7] transition-colors">
                                        <span>Pristatymas Lietuvoje (1–3 d. d.)</span>
                                        <ArrowRight className="w-4 h-4 text-[#38BDF8]" aria-hidden="true" />
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/returns" className="flex items-center justify-between py-2 px-3 rounded-sm bg-[#0F2537] hover:bg-[#0284C7] transition-colors">
                                        <span>14 d. grąžinimas ir DN keitimas</span>
                                        <ArrowRight className="w-4 h-4 text-[#38BDF8]" aria-hidden="true" />
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/cookies" className="flex items-center justify-between py-2 px-3 rounded-sm bg-[#0F2537] hover:bg-[#0284C7] transition-colors">
                                        <span>Slapukų politika</span>
                                        <ArrowRight className="w-4 h-4 text-[#38BDF8]" aria-hidden="true" />
                                    </Link>
                                </li>
                            </ul>
                        </div>

                        <div className="rounded-md bg-white border border-slate-200 p-6">
                            <div className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider text-[#0284C7] mb-2">
                                <Calculator className="w-4 h-4 text-[#DC2626]" aria-hidden="true" />
                                <span>SAUGUS PARINKIMAS</span>
                            </div>
                            <h3 className="font-display text-base font-bold text-[#0B192C] mb-2">
                                Skaičiuokite ir komplektuokite be registracijos
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed mb-4">
                                Naudokitės 5 ŠVOK skaičiuoklėmis arba klauskite Vytauto AI – jokie asmens duomenys neprašomi tol, kol patys nenusprendžiate užsisakyti.
                            </p>
                            <div className="flex flex-col gap-2">
                                <Link
                                    href="/skaiciuokle"
                                    className="inline-flex items-center justify-center gap-2 rounded-sm bg-[#DC2626] hover:bg-[#B91C1C] text-white px-4 py-2.5 text-xs font-bold transition-colors"
                                >
                                    <Calculator className="w-3.5 h-3.5" aria-hidden="true" />
                                    <span>Atidaryti ŠVOK skaičiuokles</span>
                                </Link>
                                <Link
                                    href="/uzklausa"
                                    className="inline-flex items-center justify-center gap-2 rounded-sm border border-slate-300 hover:border-[#0284C7] text-[#0B192C] px-4 py-2.5 text-xs font-semibold transition-colors"
                                >
                                    <FileText className="w-3.5 h-3.5 text-[#0284C7]" aria-hidden="true" />
                                    <span>Projekto sąmatos užklausa (RFQ)</span>
                                </Link>
                            </div>
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    );
}
