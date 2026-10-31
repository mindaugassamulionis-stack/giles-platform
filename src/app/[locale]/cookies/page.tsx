import type { Metadata } from 'next';
import { getLegalPolicy } from '@/lib/storefront-content';
import { getStorefrontRuntimeConfig } from '@platform/database';
import { sanitizeHtml } from '@/lib/sanitize-html';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { ShieldCheck, Lock, Sparkles, Calculator, CheckCircle2, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
    title: 'Slapukų ir naršyklės atminties politika (BDAR) | Gilės Inžinerija',
    description:
        'Gilės Inžinerija slapukų politika: kaip veikia krepšelio slapukai, kodėl 5 ŠVOK skaičiuoklių bei Vytauto AI istorija saugoma tik Jūsų naršyklėje ir nulis brukalo garantija.',
};

const COOKIES_TRUST_CARDS = [
    {
        badge: 'VIETINĖ NARŠYKLĖS ATMINTIS',
        title: 'Skaičiuoklių ir Vytauto AI rezultatai – tik Jūsų naršyklėje',
        description:
            'Kai skaičiuojate šilumos nuostolius, plėtimosi indą ar konsultuojatės su Vytautu, šie parametrai saugomi Jūsų naršyklės vietinėje atmintyje (localStorage), kad galėtumėte grįžti prie savo mazgo.',
        icon: Calculator,
        accent: 'border-[#0284C7]',
    },
    {
        badge: 'BDAR / GDPR KONTROLĖ',
        title: 'Būtinieji slapukai krepšeliui ir saugiam atsiskaitymui',
        description:
            'Būtinieji slapukai užtikrina, kad Jūsų sukomplektuotos Danfoss, IMI ir Ferroli detalės nedingtų iš krepšelio. Analitinius slapukus galite bet kada išjungti.',
        icon: ShieldCheck,
        accent: 'border-[#DC2626]',
    },
    {
        badge: 'NULIS BRUKALO (ZERO SPAM)',
        title: 'Jokio agresyvaus sekimo ar duomenų perpardavimo',
        description:
            'Nenaudojame įkyrių trečiųjų šalių reklamos tinklų slapukų ir neperduodame Jūsų inžinerinių paieškų duomenų pašaliniams.',
        icon: Lock,
        accent: 'border-[#0284C7]',
    },
];

export default async function CookiesPage() {
    const t = await getTranslations();
    const [policy, runtimeConfig] = await Promise.all([
        getLegalPolicy('cookies'),
        getStorefrontRuntimeConfig(),
    ]);
    const showTrustSummary = runtimeConfig.features.trustPolicySummaries;
    const effectiveDate = policy?.effectiveAt
        ? new Date(policy.effectiveAt).toISOString().slice(0, 10)
        : 'Nuo 2011 m.';
    const version = policy?.version || '2.2 (BDAR / LocalStorage)';

    return (
        <div className="min-h-screen bg-[#F0F4F8] text-[#0B192C] pb-20">
            {/* Hero Banner */}
            <section className="bg-[#0B192C] text-white border-b border-slate-800 pt-24 pb-12">
                <div className="h-[3px] w-full bg-[#DC2626] mb-8" />
                <div className="container mx-auto px-4 max-w-6xl">
                    <div className="flex flex-wrap items-center gap-3 mb-4">
                        <span className="inline-flex items-center gap-1.5 rounded-sm bg-[#0284C7]/20 border border-[#38BDF8]/40 px-3 py-1 font-mono text-xs font-bold uppercase tracking-wider text-[#38BDF8]">
                            <Lock className="w-3.5 h-3.5 text-[#DC2626]" aria-hidden="true" />
                            BDAR SLAPUKŲ IR ATMINTIES SKAIDRUMAS
                        </span>
                        <span className="font-mono text-xs text-slate-300">
                            Įsigalioja: {effectiveDate} · Versija: {version}
                        </span>
                    </div>
                    <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-4">
                        {t('legalCookies.title')}
                    </h1>
                    <p className="text-slate-300 text-base md:text-lg max-w-3xl leading-relaxed">
                        Aiškus sąrašas slapukų ir naršyklės atminties įrašų, padedančių išsaugoti Jūsų krepšelį, ŠVOK skaičiuoklių skaičiavimus ir Vytauto AI rekomendacijas.
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
                            href="/privatumo-politika"
                            className="inline-flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider text-[#0284C7] hover:underline"
                        >
                            <span>Pilna BDAR privatumo politika</span>
                            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {COOKIES_TRUST_CARDS.map((card) => {
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
                                        <span>Skaidri kontrolė</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>
                )}

                {/* Detailed Cookie Table */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-8 bg-white rounded-md border border-slate-200 p-6 md:p-10 shadow-xs space-y-8">
                        {policy?.contentText ? (
                            <div
                                className="prose prose-slate max-w-none leading-relaxed"
                                dangerouslySetInnerHTML={{ __html: sanitizeHtml(policy.contentText) }}
                            />
                        ) : (
                            <>
                                <section className="space-y-3">
                                    <h2 className="font-display text-xl font-bold text-[#0B192C] border-b border-slate-200 pb-2">
                                        {t('legalCookies.whatTitle')}
                                    </h2>
                                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                        {t('legalCookies.whatBody')} Be standartinių slapukų, Gilės Inžinerija naudoja vietinę naršyklės atmintį (<code>localStorage</code>), kad Jums nereikėtų iš naujo vesti pastato ploto, katilo galios ar radiatoriaus sriegio duomenų.
                                    </p>
                                </section>

                                <section className="space-y-4">
                                    <h2 className="font-display text-xl font-bold text-[#0B192C] border-b border-slate-200 pb-2">
                                        {t('legalCookies.usedTitle')}
                                    </h2>

                                    <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-[#0284C7]">
                                        {t('legalCookies.essentialTitle')}
                                    </h3>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse text-sm">
                                            <thead>
                                                <tr className="bg-[#0B192C] text-white font-mono text-xs uppercase">
                                                    <th className="p-3">{t('legalCookies.cookie')}</th>
                                                    <th className="p-3">{t('legalCookies.purpose')}</th>
                                                    <th className="p-3">{t('legalCookies.validity')}</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-200">
                                                <tr>
                                                    <td className="p-3 font-mono text-xs font-bold text-[#0B192C]">{t('legalCookies.sessionId')}</td>
                                                    <td className="p-3 text-slate-700">{t('legalCookies.session')}</td>
                                                    <td className="p-3 text-slate-600">{t('legalCookies.sessionEnd')}</td>
                                                </tr>
                                                <tr>
                                                    <td className="p-3 font-mono text-xs font-bold text-[#0B192C]">{t('legalCookies.cartId')}</td>
                                                    <td className="p-3 text-slate-700">{t('cartPage.title')} ir pasirinktos ŠVOK detalės</td>
                                                    <td className="p-3 text-slate-600">{t('legalCookies.days30')}</td>
                                                </tr>
                                                <tr>
                                                    <td className="p-3 font-mono text-xs font-bold text-[#0B192C]">{t('legalCookies.cookieConsent')}</td>
                                                    <td className="p-3 text-slate-700">{t('legalCookies.consentState')}</td>
                                                    <td className="p-3 text-slate-600">{t('legalCookies.year1')}</td>
                                                </tr>
                                                <tr>
                                                    <td className="p-3 font-mono text-xs font-bold text-[#0284C7]">giles_customer_journey_v1</td>
                                                    <td className="p-3 text-slate-700">5 ŠVOK skaičiuoklių ir Vytauto AI parinktų mazgų atmintis naršyklėje</td>
                                                    <td className="p-3 text-slate-600">Tik Jūsų naršyklėje (iki išvalymo)</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>

                                    <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-[#0284C7] pt-4">
                                        {t('legalCookies.analyticsTitle')}
                                    </h3>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse text-sm">
                                            <thead>
                                                <tr className="bg-slate-100 text-[#0B192C] font-mono text-xs uppercase border-b border-slate-300">
                                                    <th className="p-3">{t('legalCookies.cookie')}</th>
                                                    <th className="p-3">{t('legalCookies.purpose')}</th>
                                                    <th className="p-3">{t('legalCookies.validity')}</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-200">
                                                <tr>
                                                    <td className="p-3 font-mono text-xs font-bold text-[#0B192C]">{t('legalCookies.ga')}</td>
                                                    <td className="p-3 text-slate-700">{t('legalCookies.gaPurpose')} (anoniminė srauto statistika)</td>
                                                    <td className="p-3 text-slate-600">{t('legalCookies.years2')}</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </section>

                                <section className="space-y-3">
                                    <h2 className="font-display text-xl font-bold text-[#0B192C] border-b border-slate-200 pb-2">
                                        {t('legalCookies.choicesTitle')}
                                    </h2>
                                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                        {t('legalCookies.choicesBody')} Taip pat galite bet kada išvalyti naršyklės vietinę atmintį (<code>localStorage</code>) tiesiogiai Vytauto AI konsultanto lange arba naršyklės nustatymuose.
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
                                <Sparkles className="w-4 h-4 text-[#DC2626]" aria-hidden="true" />
                                <span>IŠMANUS PARINKIMAS</span>
                            </div>
                            <h3 className="font-display text-lg font-bold mb-2">
                                Kodėl saugome skaičiuoklės rezultatus naršyklėje?
                            </h3>
                            <p className="text-xs text-slate-300 leading-relaxed mb-4">
                                Kai apskaičiuojate reikalingą katilo galią (pvz., 14 kW) arba plėtimosi indą (35 L), Vytautas AI iškart gali pasiūlyti tiksliai derančius vožtuvus ir jungtis be pakartotinio klausinėjimo.
                            </p>
                            <Link
                                href="/skaiciuokle"
                                className="flex items-center justify-between py-2.5 px-3 rounded-sm bg-[#DC2626] hover:bg-[#B91C1C] text-xs font-bold transition-colors"
                            >
                                <span>Išbandyti 5 ŠVOK skaičiuokles</span>
                                <ArrowRight className="w-4 h-4 text-white" aria-hidden="true" />
                            </Link>
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    );
}
