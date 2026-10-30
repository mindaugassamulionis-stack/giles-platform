import type { Metadata } from 'next';
import { Mail, MapPin, Sparkles, FileText, Calculator, CheckCircle2, Wrench, ArrowRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '../../../i18n/navigation';

export const metadata: Metadata = {
    title: 'Kontaktai ir inžinerinės konsultacijos | Gilės Inžinerija',
    description:
        'Susisiekite su Gilės Inžinerija komanda dėl šildymo ir santechnikos įrangos užsakymų, B2B projektų sąmatų arba pasitarkite su 24/7 puslapyje veikiančiu AI konsultantu Vytautu.',
};

export default function ContactPage() {
    const t = useTranslations();
    return (
        <div className="min-h-screen bg-[var(--muted)] text-[var(--foreground)] pb-20">
            <div className="bg-[var(--foreground)] text-white border-b border-slate-800 pt-28 pb-10 mb-10">
                <div className="h-1 w-full bg-[var(--primary)] mb-6" />
                <div className="container mx-auto px-4 max-w-6xl">
                    <p className="font-mono text-[var(--primary-foreground)] text-xs tracking-[0.25em] uppercase mb-3 font-bold">
                        {t('contactPage.kicker')}
                    </p>
                    <h1 className="font-display text-4xl md:text-5xl font-extrabold tracking-tight mb-4 text-white">
                        {t('contactPage.title')}
                    </h1>
                    <p className="text-slate-300 text-base md:text-lg max-w-3xl leading-relaxed">
                        {t('contactPage.subtitle')}
                    </p>
                </div>
            </div>

            <div className="container mx-auto px-4 max-w-6xl">
                {/* Step-by-step guidance for Homeowners/Builders vs B2B Installers */}
                <div className="grid md:grid-cols-2 gap-6 mb-12">
                    <div className="rounded-md border border-slate-300 bg-white p-6 shadow-2xs">
                        <div className="flex items-center gap-2.5 font-mono text-xs uppercase tracking-wider text-[var(--primary)] font-bold mb-3">
                            <Sparkles className="w-4 h-4 shrink-0" aria-hidden="true" />
                            <span>Statantiems ir renovuojantiems namus</span>
                        </div>
                        <h2 className="font-display text-lg font-bold text-[var(--foreground)] mb-3">
                            Kaip greičiausiai išsirinkti tinkamą detalę?
                        </h2>
                        <ol className="space-y-2 text-sm text-slate-600">
                            <li className="flex items-start gap-2">
                                <span className="font-mono font-bold text-[var(--primary)]">1.</span>
                                <span>Atidarykite puslapio apačioje veikiantį <strong>inžinerinį AI konsultantą – Vytautas</strong> patikrins ieškomą vožtuvą, radiatorių ar mazgą.</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="font-mono font-bold text-[var(--primary)]">2.</span>
                                <span>Nežinote reikalingos katilo ar šildymo galios? Pasinaudokite <Link href="/skaiciuokle" className="text-[var(--secondary)] font-semibold underline">interaktyviomis įrangos skaičiuoklėmis</Link>.</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="font-mono font-bold text-[var(--primary)]">3.</span>
                                <span>Kiekvienos prekės kortelėje rasite aiškią montavimo atmintinę ir Vytauto rekomenduojamas derančias dalis.</span>
                            </li>
                        </ol>
                    </div>

                    <div className="rounded-md border border-slate-300 bg-white p-6 shadow-2xs">
                        <div className="flex items-center gap-2.5 font-mono text-xs uppercase tracking-wider text-[var(--secondary)] font-bold mb-3">
                            <Wrench className="w-4 h-4 shrink-0" aria-hidden="true" />
                            <span>Montuotojams, projektuotojams ir įmonėms</span>
                        </div>
                        <h2 className="font-display text-lg font-bold text-[var(--foreground)] mb-3">
                            Kaip greitai sukomplektuoti šildymo objektą?
                        </h2>
                        <ol className="space-y-2 text-sm text-slate-600">
                            <li className="flex items-start gap-2">
                                <span className="font-mono font-bold text-[var(--secondary)]">1.</span>
                                <span>Paieškoje įklijuokite vieną ar kelis gamintojo kodus iš sąmatos (pvz., <code>013G0013, 88.20.411</code>) – tikslūs atitikmenys iškart iškeliami į viršų.</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="font-mono font-bold text-[var(--secondary)]">2.</span>
                                <span>Kiekvienoje kortelėje iškart matote sriegius, DN skersmenį ir darbinį slėgį.</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="font-mono font-bold text-[var(--secondary)]">3.</span>
                                <span>Pilnam katilinės ar daugiabučio mazgui užpildykite <Link href="/uzklausa" className="text-[var(--secondary)] font-semibold underline">projekto sąmatos užklausą (RFQ)</Link>.</span>
                            </li>
                        </ol>
                    </div>
                </div>

                <div className="grid lg:grid-cols-12 gap-10">
                    {/* Direct Contact & Engineering Channels */}
                    <div className="lg:col-span-5 space-y-5">
                        <div className="flex items-start gap-4 rounded-[2px] border border-border bg-card p-5">
                            <div className="p-3 bg-muted rounded-[2px] text-[var(--primary)] shrink-0">
                                <Mail className="w-5 h-5" strokeWidth={1.75} aria-hidden="true" />
                            </div>
                            <div>
                                <h3 className="font-display font-bold text-base mb-1">{t('contactPage.emailLabel')}</h3>
                                <p className="font-mono text-sm font-bold text-[var(--primary)]">{t('contactPage.emailAddress')}</p>
                                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{t('contactPage.emailNote')}</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4 rounded-[2px] border border-border bg-card p-5">
                            <div className="p-3 bg-muted rounded-[2px] text-[var(--primary)] shrink-0">
                                <Sparkles className="w-5 h-5" strokeWidth={1.75} aria-hidden="true" />
                            </div>
                            <div>
                                <h3 className="font-display font-bold text-base mb-1">{t('contactPage.phoneLabel')}</h3>
                                <p className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--data-ok)]">
                                    {t('contactPage.phoneValue')}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{t('contactPage.phoneNote')}</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4 rounded-[2px] border border-border bg-card p-5">
                            <div className="p-3 bg-muted rounded-[2px] text-[var(--primary)] shrink-0">
                                <MapPin className="w-5 h-5" strokeWidth={1.75} aria-hidden="true" />
                            </div>
                            <div>
                                <h3 className="font-display font-bold text-base mb-1">{t('contactPage.officeLabel')}</h3>
                                <p className="text-sm text-foreground font-medium">
                                    {t('contactPage.street')}
                                </p>
                                <p className="font-mono text-xs text-muted-foreground mt-1">
                                    {t('contactPage.city')}
                                </p>
                                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                                    UAB „Gilės inžinerija“ · Įmonės kodas: 302620907 · PVM kodas: LT100006119810 · Žirmūnų g. 68, LT-09124 Vilnius · Eigulių g. 21, LT-51418 Kaunas · info@gilesinzinerija.lt · 14 d. grąžinimo garantija · 24 mėn. garantija
                                </p>
                                <div className="mt-3 flex flex-wrap gap-3">
                                    <Link
                                        href="/uzklausa"
                                        className="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider text-[var(--primary)] font-bold hover:underline"
                                    >
                                        <FileText className="w-3.5 h-3.5" aria-hidden="true" />
                                        <span>Siųsti sąmatos užklausą →</span>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Direct Message / Inquiry Form */}
                    <div className="lg:col-span-7 bg-card p-6 md:p-8 rounded-[2px] border border-border">
                        <div className="flex items-center justify-between gap-4 mb-6 pb-4 border-b border-border">
                            <div>
                                <h2 className="font-display text-xl font-bold text-foreground">
                                    Greita žinutė inžinerijos komandai
                                </h2>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    Dėl konkrečių gamintojų kodų, sąmatų ar užsakymų patikslinimo
                                </p>
                            </div>
                            <CheckCircle2 className="w-5 h-5 text-[var(--data-ok)] shrink-0" aria-hidden="true" />
                        </div>
                        <form className="space-y-4">
                            <div>
                                <label className="block font-mono text-xs uppercase tracking-wide text-muted-foreground mb-2">
                                    {t('contactPage.name')}
                                </label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-3 border border-border bg-background rounded-[2px] focus:border-[var(--primary)] outline-none transition-colors text-sm"
                                    placeholder={t('contactPage.namePlaceholder')}
                                />
                            </div>
                            <div>
                                <label className="block font-mono text-xs uppercase tracking-wide text-muted-foreground mb-2">
                                    {t('contactPage.email')}
                                </label>
                                <input
                                    type="email"
                                    className="w-full px-4 py-3 border border-border bg-background rounded-[2px] focus:border-[var(--primary)] outline-none transition-colors text-sm"
                                    placeholder="vardas@imone.lt"
                                />
                            </div>
                            <div>
                                <label className="block font-mono text-xs uppercase tracking-wide text-muted-foreground mb-2">
                                    {t('contactPage.message')}
                                </label>
                                <textarea
                                    rows={4}
                                    className="w-full px-4 py-3 border border-border bg-background rounded-[2px] focus:border-[var(--primary)] outline-none transition-colors text-sm"
                                    placeholder={t('contactPage.messagePlaceholder')}
                                />
                            </div>
                            <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                                <button
                                    type="button"
                                    className="inline-flex h-12 items-center justify-center gap-2 bg-[var(--accent)] text-white px-8 rounded-[2px] text-sm font-bold hover:bg-[var(--accent-hover)] transition-colors duration-150"
                                >
                                    <span>{t('contactPage.send')}</span>
                                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                                </button>
                                <Link
                                    href="/uzklausa"
                                    className="font-mono text-xs uppercase tracking-wider text-[var(--primary)] hover:underline"
                                >
                                    Turite pilną projekto specifikaciją? Naudokite RFQ formą →
                                </Link>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
