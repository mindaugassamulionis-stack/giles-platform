import type { Metadata } from 'next';
import Link from 'next/link';
import { Atom, FlaskConical, Magnet, Rocket, ArrowRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { getBrandName, withBrandSuffix } from '../../../lib/brand';

export async function generateMetadata(): Promise<Metadata> {
    return {
        title: withBrandSuffix('Mokslas', await getBrandName()),
        description:
            "Kid-friendly science kits: what's inside, what children learn, and how experiments work at home.",
    };
}

export default function SciencePage() {
    const t = useTranslations();
    return (
        <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
            {/* Header */}
            <div className="pt-32 pb-24 px-6 text-center">
                <div className="max-w-3xl mx-auto">
                    <p className="font-mono text-[var(--data-ok)] text-xs tracking-[0.3em] uppercase mb-4">
                        {t('sciencePage.rdKicker')}
                    </p>
                    <h1 className="text-5xl md:text-7xl font-bold font-display text-[var(--data-ok)] mb-6 tracking-tight leading-[1.1]">
                        {t('sciencePage.rdTitle1')}<br />
                        {t('sciencePage.rdTitle2')}
                    </h1>
                    <p className="text-[var(--muted-foreground)] text-lg max-w-lg mx-auto">
                        {t('sciencePage.rdBody')}
                    </p>
                </div>
            </div>

            {/* What children learn */}
            <div className="bg-[var(--surface-paper)] border-y-2 border-[var(--border)]">
                <div className="container mx-auto px-6 py-16">
                    <div className="max-w-5xl mx-auto mb-20">
                        <div className="text-center mb-12">
                            <p className="font-mono text-xs text-[var(--muted-foreground)] uppercase tracking-widest mb-3">
                                {t('sciencePage.ingKicker')}
                            </p>
                            <h2 className="text-3xl md:text-4xl font-bold font-display text-[var(--foreground)]">
                                {t('sciencePage.ingTitle')}
                            </h2>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            <LearnCard
                                icon={<Atom className="w-7 h-7" strokeWidth={1.5} />}
                                name="Chemija"
                                description="Tirpikliai, reakcijos ir spalvų pokyčiai – saugios medžiagos, kurias galima maišyti namų stalo sąlygomis."
                            />
                            <LearnCard
                                icon={<Magnet className="w-7 h-7" strokeWidth={1.5} />}
                                name="Fizika"
                                description="Magnetizmas, gravitacija ir slėgis – eksperimentai, kuriuos vaikas atlieka pats ir mato rezultatą akimirksniu."
                            />
                            <LearnCard
                                icon={<Rocket className="w-7 h-7" strokeWidth={1.5} />}
                                name="Inžinerija"
                                description="Konstravimas ir testavimas: nuo popieriaus raketų iki tilto modelių – bandymas ir klaida kaip mokymosi dalis."
                            />
                            <LearnCard
                                icon={<FlaskConical className="w-7 h-7" strokeWidth={1.5} />}
                                name="Gamtos stebėjimas"
                                description="Užrašai, matavimai ir išvados – mokomės fiksuoti, kas vyksta, ir formuluoti klausimus toliau."
                            />
                        </div>
                    </div>

                    {/* Safety */}
                    <div className="max-w-4xl mx-auto mb-20">
                        <div className="bg-[var(--data-ok)] text-[var(--background)] rounded-3xl p-8 md:p-16">
                            <div className="text-center mb-12">
                                <p className="font-mono text-[var(--background)]/70 text-xs tracking-widest uppercase mb-3">
                                    {t('sciencePage.qaKicker')}
                                </p>
                                <h2 className="text-3xl md:text-4xl font-bold font-display mb-4">
                                    {t('sciencePage.qaTitle')}
                                </h2>
                                <p className="text-[var(--background)]/80 max-w-lg mx-auto">
                                    {t('sciencePage.qaBody')}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center font-mono text-sm">
                                <div>{t('sciencePage.step1')}</div>
                                <div>{t('sciencePage.step2')}</div>
                                <div>{t('sciencePage.step3')}</div>
                                <div>{t('sciencePage.step4')}</div>
                            </div>
                        </div>
                    </div>

                    {/* CTA */}
                    <div className="text-center">
                        <p className="text-[var(--muted-foreground)] mb-6">{t('sciencePage.cta')}</p>
                        <Link
                            href="/products"
                            className="inline-flex items-center gap-3 px-10 py-5 bg-[var(--brand-accent)] text-[var(--primary-foreground)] rounded-2xl font-bold text-lg hover:bg-[var(--brand-accent-hover)] transition-colors duration-200 group"
                        >
                            {t('sciencePage.ctaButton')}
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

function LearnCard({ icon, name, description }: { icon: React.ReactNode; name: string; description: string }) {
    return (
        <div className="bg-[var(--background)] rounded-3xl p-8 border-2 border-[var(--border)]">
            <div className="w-16 h-16 bg-[var(--muted)] rounded-2xl flex items-center justify-center text-[var(--data-ok)] mb-5">
                {icon}
            </div>
            <h3 className="font-display text-xl font-bold text-[var(--foreground)] mb-3">{name}</h3>
            <p className="text-[var(--muted-foreground)] leading-relaxed">{description}</p>
        </div>
    );
}
