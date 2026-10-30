import type { Metadata } from 'next';
import { Wrench, Search, ShieldCheck, FileText, ArrowRight, Sparkles, Calculator, CheckCircle2, Layers } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '../../../i18n/navigation';
import { HVAC_SYSTEM_GROUPS } from '../../../lib/v3-description';

export const metadata: Metadata = {
    title: 'Apie Gilės Inžinerija – Lietuvos šildymo, santechnikos ir inžinerinių sistemų centras | Gilės Inžinerija',
    description:
        'Gilės Inžinerija – Šildymo, santechnikos ir inžinerinių sistemų centras. Nuo vieno vožtuvo iki pilnos katilinės – aiškiai paprastam žmogui, tiksliai profesionalui. Danfoss, IMI Heimeier, IMI Pneumatex, IMI TA, Ferroli ir 24/7 Vytautas AI + RAG konsultantas.',
};

const FOUR_PILLARS = [
    {
        number: '01',
        icon: Layers,
        title: 'Europos inžinerijos lyderiai vienoje vietoje',
        description:
            'Gilės Inžinerija, Comisa, Centrometal, Dražice, Viessmann, Wilo, Danfoss, Haier, Gorenje, IMI Heimeier, IMI Pneumatex, IMI TA, Ferroli – 6 337+ patikrintų pozicijų: šildymo reguliavimas, balansavimas, plėtimosi indai, oro ir purvo atskyrimas, grindinis šildymas, radiatoriai, šilumos siurbliai ir automatika.',
        badge: '6 337+ POZICIJŲ · ORIGINALŪS GAMINTOJŲ KODAI',
    },
    {
        number: '02',
        icon: Wrench,
        title: 'Suprantama kiekvienam – be inžinerinio galvos skausmo',
        description:
            'Kiekviena prekė turi dvigubą aprašymą: paprastą paaiškinimą žmogui, statančiam ar renovuojančiam būstą, žingsnis po žingsnio montavimo atmintinę, ir tikslią techninę lentelę su DN, PN, Kvs parametrais meistrui.',
        badge: 'NAMŲ ŠEIMININKUI + PROFESIONALIAM MONTUOTOJUI',
    },
    {
        number: '03',
        icon: Sparkles,
        title: 'Inžinerinis AI konsultantas Vytautas (su RAG suderinamumo sistema)',
        description:
            'Nežinote, kokia termostatinė galvutė, pavara ar srieginė jungtis tinka jūsų vožtuvui? Vytautas akimirksniu patikrina sriegius, diametrus ir parodo tiksliai derančias dalis iš mūsų katalogo.',
        badge: 'AKTYVUS 24/7 · RAG MAZGŲ SUDERINAMUMO PATIKRA',
    },
    {
        number: '04',
        icon: FileText,
        title: 'Pilnas objekto sukomplektavimas per 1 darbo dieną',
        description:
            'Turite šildymo projektą, katilinės schemą ar meistro sąrašą? Įkelkite jį į sąmatos užklausą arba pasinaudokite įrangos skaičiuokle – parinksime visą mazgą be klaidų.',
        badge: 'GREITAS OBJEKTO SUKOMPLEKTAVIMAS PER 24 VAL.',
    },
];

export default function AboutPage() {
    const t = useTranslations();

    return (
        <div className="min-h-screen bg-[var(--muted)] text-[var(--foreground)]">
            {/* Hero */}
            <section className="pt-28 pb-14 px-6 border-b border-slate-800 bg-[var(--foreground)] text-white">
                <div className="h-1 w-full bg-[var(--primary)] mb-8" />
                <div className="relative z-10 max-w-4xl mx-auto text-center">
                    <p className="font-mono text-[var(--secondary)] text-xs tracking-[0.25em] uppercase mb-4 font-bold">
                        {t('aboutPage.storyKicker')}
                    </p>
                    <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold font-display text-white mb-6 tracking-tight leading-[1.08]">
                        {t('aboutPage.storyTitle1')}{' '}
                        <span className="text-[var(--secondary)]">{t('aboutPage.storyTitle2')}</span>
                    </h1>
                    <p className="font-display text-xl md:text-2xl font-semibold text-slate-100 max-w-3xl mx-auto mb-5 leading-snug">
                        „Gilės Inžinerija – Šildymo, santechnikos ir inžinerinių sistemų centras. Nuo vieno vožtuvo iki pilnos katilinės – aiškiai paprastam žmogui, tiksliai profesionalui.“
                    </p>
                    <p className="text-slate-300 text-base md:text-lg max-w-3xl mx-auto mb-10 leading-relaxed">
                        {t('aboutPage.storyBody')}
                    </p>

                    <div className="flex flex-wrap items-center justify-center gap-4">
                        <Link
                            href="/products"
                            className="inline-flex h-12 items-center gap-2 rounded-md bg-[var(--primary)] px-8 text-sm font-bold text-white transition-colors duration-150 hover:bg-[var(--brand-accent-hover)]"
                        >
                            {t('aboutPage.ctaButton')}
                            <ArrowRight className="w-4 h-4" aria-hidden="true" />
                        </Link>
                        <Link
                            href="/skaiciuokle"
                            className="inline-flex h-12 items-center gap-2 rounded-md border-2 border-[var(--secondary)] px-6 text-sm font-bold text-[var(--secondary)] transition-colors duration-150 hover:bg-[var(--secondary)] hover:text-white"
                        >
                            <Calculator className="w-4 h-4" aria-hidden="true" />
                            Įrangos skaičiuoklės
                        </Link>
                        <Link
                            href="/uzklausa"
                            className="inline-flex h-12 items-center gap-2 rounded-md border border-slate-600 bg-[var(--text-primary)] px-6 text-sm font-semibold text-white transition-colors duration-150 hover:border-[var(--secondary)]"
                        >
                            Projekto sąmatos užklausa (RFQ)
                        </Link>
                    </div>
                </div>
            </section>

            {/* 4 Pillars: Kodėl statytojai, namų šeimininkai ir meistrai renkasi mus */}
            <section className="bg-card border-b border-border">
                <div className="container mx-auto max-w-6xl px-4 py-16 md:py-20">
                    <div className="max-w-3xl mb-12">
                        <p className="font-mono text-xs text-[var(--primary)] uppercase tracking-[0.2em] mb-3">
                            {t('aboutPage.valuesKicker')}
                        </p>
                        <h2 className="text-3xl md:text-4xl font-bold font-display text-foreground tracking-tight">
                            Kodėl statytojai, namų šeimininkai ir meistrai renkasi mus
                        </h2>
                        <p className="mt-3 text-muted-foreground text-base leading-relaxed">
                            Sujungėme profesionalų inžinerinį tiekimą su aiškiomis montavimo instrukcijomis ir dirbtinio intelekto suderinamumo patikra, kad nė viena detalė nebūtų užsakyta aklai.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        {FOUR_PILLARS.map((pillar) => {
                            const Icon = pillar.icon;
                            return (
                                <div
                                    key={pillar.number}
                                    className="bg-background rounded-[2px] p-7 md:p-8 border border-border flex flex-col justify-between hover:border-[var(--primary)]/50 transition-colors duration-150"
                                >
                                    <div>
                                        <div className="flex items-center justify-between gap-4 mb-5">
                                            <div className="w-12 h-12 bg-card border border-border rounded-[2px] flex items-center justify-center text-[var(--primary)]">
                                                <Icon className="w-6 h-6" strokeWidth={1.75} aria-hidden="true" />
                                            </div>
                                            <span className="font-mono text-xs font-bold text-muted-foreground tracking-widest">
                                                STANDARTAS #{pillar.number}
                                            </span>
                                        </div>
                                        <h3 className="font-display text-xl font-bold text-foreground mb-3 leading-snug">
                                            {pillar.title}
                                        </h3>
                                        <p className="text-muted-foreground leading-relaxed text-sm md:text-base">
                                            {pillar.description}
                                        </p>
                                    </div>
                                    <div className="mt-6 pt-4 border-t border-border flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-[var(--primary)] font-semibold">
                                        <CheckCircle2 className="w-4 h-4 shrink-0 text-[var(--data-ok)]" aria-hidden="true" />
                                        <span>{pillar.badge}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Vytautas AI + Engineering Standard Banner */}
                    <div className="mt-14 bg-[var(--foreground)] text-white rounded-md overflow-hidden border border-[var(--secondary)]/40 shadow-md">
                        <div className="h-1.5 w-full bg-[var(--brand-accent)]" />
                        <div className="p-8 md:p-14 grid lg:grid-cols-12 gap-8 items-center">
                            <div className="lg:col-span-8">
                                <p className="font-mono text-[var(--secondary)] text-xs tracking-[0.25em] uppercase mb-3 font-bold">
                                    {t('aboutPage.missionKicker')}
                                </p>
                                <h2 className="text-2xl md:text-4xl font-display font-bold mb-4 leading-tight text-white">
                                    {t('aboutPage.valuesHeading')}
                                </h2>
                                <p className="text-slate-300 leading-relaxed mb-6 text-sm md:text-base">
                                    {t('aboutPage.missionBody')}
                                </p>
                                <div className="flex flex-wrap gap-2.5">
                                    <span className="px-3.5 py-1.5 border border-white/20 bg-white/5 text-xs font-mono rounded-sm">
                                        {t('aboutPage.est')}
                                    </span>
                                    <span className="px-3.5 py-1.5 border border-white/20 bg-white/5 text-xs font-mono rounded-sm">
                                        {t('aboutPage.city')}
                                    </span>
                                </div>
                            </div>
                            <div className="lg:col-span-4 border border-[var(--secondary)]/40 bg-[var(--text-primary)] rounded-md p-6">
                                <div className="flex items-center gap-3 mb-3">
                                    <Sparkles className="w-6 h-6 text-[var(--primary)] shrink-0" strokeWidth={1.75} aria-hidden="true" />
                                    <div>
                                        <p className="font-mono text-[11px] uppercase tracking-wider text-[var(--secondary)] font-bold">
                                            24/7 AI + RAG INŽINIERIUS
                                        </p>
                                        <p className="font-display text-lg font-bold text-white">
                                            Konsultantas Vytautas
                                        </p>
                                    </div>
                                </div>
                                <p className="text-xs text-slate-300 leading-relaxed mb-4">
                                    Atidarykite pokalbio langą dešiniajame apatiniame kampe arba bet kurios prekės kortelėje peržiūrėkite Vytauto parinktus suderinamus mazgo komponentus.
                                </p>
                                <p className="font-mono text-[11px] text-[var(--secondary)] uppercase tracking-wider font-bold">
                                    {t('aboutPage.ctaKicker')}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 8 Sprendimų Kryptys */}
            <section className="py-16 md:py-20 px-4 border-b border-border bg-background">
                <div className="container mx-auto max-w-6xl">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
                        <div>
                            <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--primary)] mb-2">
                                8 SPRENDIMŲ KRYPTYS · MAZGŲ GRUPĖS
                            </p>
                            <h2 className="font-display text-2xl md:text-4xl font-bold text-foreground tracking-tight">
                                Nuo radiatoriaus termostato iki katilinės automatikos
                            </h2>
                            <p className="mt-2 text-muted-foreground text-sm md:text-base max-w-2xl">
                                Pasirinkite dominančią inžinerinę grupę ir iškart matykite tiek paprastus paaiškinimus namams, tiek tikslius gamintojų kodus.
                            </p>
                        </div>
                        <Link
                            href="/products"
                            className="font-mono text-xs uppercase tracking-wider text-[var(--primary)] font-bold hover:underline"
                        >
                            Visas 6 337+ prekių katalogas →
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {HVAC_SYSTEM_GROUPS.map((group, idx) => (
                            <Link
                                key={group.id}
                                href={`/products?q=${encodeURIComponent(group.query)}`}
                                className="group flex flex-col justify-between rounded-[2px] border border-border bg-card p-5 transition-colors duration-150 hover:border-[var(--primary)]"
                            >
                                <div>
                                    <div className="flex items-center justify-between gap-2 mb-3">
                                        <span className="font-mono text-[11px] font-bold uppercase tracking-widest text-[var(--primary)]">
                                            KRYPTIS 0{idx + 1}
                                        </span>
                                        <Search className="w-4 h-4 text-muted-foreground group-hover:text-[var(--primary)] transition-colors" aria-hidden="true" />
                                    </div>
                                    <h3 className="font-display text-base font-bold text-foreground group-hover:text-[var(--primary)] transition-colors">
                                        {group.title}
                                    </h3>
                                    <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                                        {group.plainDesc}
                                    </p>
                                </div>
                                <span className="mt-4 pt-3 border-t border-border inline-flex items-center justify-between font-mono text-[11px] uppercase tracking-wider text-[var(--primary)] font-semibold">
                                    <span>Atidaryti grupę</span>
                                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
                                </span>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* Action CTA */}
            <section className="py-16 md:py-20 text-center px-6 bg-card">
                <div className="max-w-3xl mx-auto">
                    <ShieldCheck className="w-10 h-10 text-[var(--primary)] mx-auto mb-4" strokeWidth={1.75} aria-hidden="true" />
                    <h2 className="text-2xl md:text-4xl font-display font-bold text-foreground mb-4">
                        {t('aboutPage.cta')}
                    </h2>
                    <p className="text-muted-foreground mb-8 text-base md:text-lg leading-relaxed">
                        {t('aboutPage.ctaBody')}
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-4">
                        <Link
                            href="/products"
                            className="group inline-flex items-center gap-3 px-8 py-4 bg-[var(--accent)] text-white rounded-[2px] font-bold text-base hover:bg-[var(--accent-hover)] transition-colors duration-150"
                        >
                            {t('aboutPage.ctaButton')}
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-150" aria-hidden="true" />
                        </Link>
                        <Link
                            href="/tools/silumos-skaiciuokle"
                            className="inline-flex items-center gap-2 px-7 py-4 border-2 border-[var(--primary)] text-[var(--primary)] rounded-[2px] font-bold text-base hover:bg-[var(--primary)] hover:text-white transition-colors duration-150"
                        >
                            Skaičiuoti šildymo galią
                        </Link>
                        <Link
                            href="/uzklausa"
                            className="inline-flex items-center gap-2 px-7 py-4 border border-border bg-background text-foreground rounded-[2px] font-semibold text-base hover:border-[var(--primary)] transition-colors duration-150"
                        >
                            Pasitarti / Siųsti sąmatos užklausą
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
