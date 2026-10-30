import type { Metadata } from 'next';
import { Suspense } from 'react';
import { RfqForm } from '../../../components/rfq-form';
import { getTranslations } from 'next-intl/server';
import { Link } from '../../../i18n/navigation';
import { Sparkles, Wrench, Calculator, CheckCircle2 } from 'lucide-react';

// W32-B1: RFQ page – market-leader guidance for homeowners & B2B installers + Vytautas AI handoff.
export const metadata: Metadata = {
    title: 'Projekto sąmatos ir įrangos užklausa (RFQ) | SURADAI',
    description:
        'Pateikite šildymo ar santechnikos įrangos kodų sąrašą arba mazgo aprašymą – paruošime tikslų komercinį pasiūlymą per 1 darbo dieną.',
};

export default async function RfqPage() {
    const t = await getTranslations();

    return (
        <main className="min-h-screen bg-[#F0F4F8] text-[var(--foreground)]">
            <div className="bg-[var(--foreground)] text-white border-b border-slate-800 pt-28 pb-10 mb-10">
                <div className="h-1 w-full bg-[var(--primary)] mb-6" />
                <div className="container mx-auto px-4 max-w-4xl">
                    <p className="font-mono text-[#38BDF8] text-xs tracking-[0.25em] uppercase mb-3 font-bold">
                        {t('rfqPage.kicker')}
                    </p>
                    <h1 className="font-display text-4xl md:text-5xl font-extrabold tracking-tight mb-4 text-white">
                        {t('rfqPage.title')}
                    </h1>
                    <p className="text-slate-300 text-base md:text-lg leading-relaxed">
                        {t('rfqPage.subtitle')}
                    </p>
                </div>
            </div>

            <div className="container mx-auto px-4 pb-16 max-w-4xl">
                {/* Step-by-step guidance for Homeowners & B2B Installers */}
                <div className="grid md:grid-cols-3 gap-4 mb-10">
                    <div className="rounded-md border border-slate-300 bg-white p-4 shadow-2xs">
                        <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-[var(--primary)] font-bold mb-2">
                            <Wrench className="w-4 h-4 shrink-0" aria-hidden="true" />
                            <span>1. Ką nurodyti užklausoje?</span>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">
                            Įklijuokite gamintojų kodus iš projekto (pvz., Danfoss, IMI Heimeier, Pneumatex, TA, Ferroli) arba paprastai aprašykite namo plotą ir reikiamą mazgą.
                        </p>
                    </div>
                    <div className="rounded-md border border-slate-300 bg-white p-4 shadow-2xs">
                        <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-[var(--secondary)] font-bold mb-2">
                            <Sparkles className="w-4 h-4 shrink-0" aria-hidden="true" />
                            <span>2. Vytautas AI + RAG patikra</span>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">
                            Reikia greitai sužinoti, kokia galvutė ar pavara tinka vožtuvui? Atidarykite puslapio apačioje veikiantį <strong>AI konsultantą Vytautą</strong> – jis patikrins sriegius (DN15–DN50) akimirksniu.
                        </p>
                    </div>
                    <div className="rounded-md border border-slate-300 bg-white p-4 shadow-2xs">
                        <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-[var(--foreground)] font-bold mb-2">
                            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" aria-hidden="true" />
                            <span>3. Pasiūlymas per 24 val.</span>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">
                            Paruošime sukomplektuotą sąmatą su tiksliais kodais ir suderinamomis dalimis. Nežinote galios? <Link href="/skaiciuokle" className="text-[var(--secondary)] font-semibold underline">Atidarykite įrangos skaičiuoklę</Link>.
                        </p>
                    </div>
                </div>

                <Suspense fallback={null}>
                    <RfqForm />
                </Suspense>
            </div>
        </main>
    );
}
