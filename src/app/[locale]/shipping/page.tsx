import type { Metadata } from 'next';
import { Link } from '@/i18n/navigation';
import { getStorefrontRuntimeConfig } from '@platform/database';
import { Truck, Package, RefreshCw, ShieldCheck, CheckCircle2, ArrowRight, Wrench, Calculator } from 'lucide-react';
import { EmailText } from '../../../components/email';

export const metadata: Metadata = {
    title: 'Pristatymas Lietuvoje (1–3 d. d.) į namus, statybvietę ar paštomatą | Gilės Inžinerija',
    description:
        'Gilės Inžinerija pristatymo sąlygos visoje Lietuvoje: 1–3 d. d. pristatymas į namus, tiesiai į statybvietę (objektą) arba Omniva / DPD / LP Express paštomatus, paletinis katilų transportas ir 14 d. grąžinimas.',
};

const SHIPPING_TRUST_CARDS = [
    {
        badge: '1–3 D. D. VISOJE LIETUVOJE',
        title: 'Pristatymas į namus, statybvietę arba paštomatą',
        description:
            'Smulkią armatūrą (termostatines galvutes, vožtuvus, pavaras, jungtis) siunčiame į Omniva, DPD ir LP Express paštomatus arba kurjeriu į namus bei tiesiai į montuojamą objektą per 1–3 darbo dienas.',
        icon: Truck,
        accent: 'border-[#0284C7]',
    },
    {
        badge: 'PALETINIS KATILINĖS TRANSPORTAS',
        title: 'Saugus katilų, kolektorių ir plėtimosi indų pristatymas',
        description:
            'Sunkią ir stambiagabaritę įrangą (Ferroli katilus, IMI Pneumatex Statico / Aquapresso plėtimosi indus nuo 35 L, kolektorines spintas) pristatome specialiu transportu su liftu ir iškrovimu objekte.',
        icon: Package,
        accent: 'border-[#DC2626]',
    },
    {
        badge: '14 D. GRĄŽINIMAS IR DN KEITIMAS',
        title: 'Nemokamas keitimas, jei netiko DN15 vs DN20 ar RA Click vs M30×1.5',
        description:
            'Nenaudotas prekes originalioje pakuotėje galite grąžinti per 14 dienų. Jei montavimo metu paaiškėjo, kad reikia kito sriegio ar skersmens – operatyviai pakeisime į tinkamą.',
        icon: RefreshCw,
        accent: 'border-[#0284C7]',
    },
];

const DELIVERY_TIERS = [
    {
        method: 'Paštomatai (Omniva, DPD, LP Express)',
        items: 'Termostatinės galvutės, vožtuvai, pavaros, termostatai, jungtys iki 30 kg',
        eta: '1–2 darbo dienos',
        notes: 'SMS pranešimas su atsiėmimo kodu 24/7 visoje Lietuvoje',
    },
    {
        method: 'Kurjeris į namus arba tiesiai į statybvietę (objektą)',
        items: 'Grindinio šildymo kolektoriai, balansiniai vožtuvai, plėtimosi indai iki 50 L',
        eta: '1–3 darbo dienos',
        notes: 'Kurjeris paskambina prieš pristatymą suderinti tikslaus laiko',
    },
    {
        method: 'Paletinis ir stambiagabaritis transportas su liftu',
        items: 'Ferroli šildymo katilai, dideli IMI Pneumatex indai (80–1000 L), pilnos objekto sąmatos',
        eta: '1–3 darbo dienos',
        notes: 'Pristatymas ant paletės su hidrauliniu bortu tiesiai į katilinės objektą',
    },
];

export default async function ShippingPage() {
    const runtimeConfig = await getStorefrontRuntimeConfig();
    const showTrustSummary = runtimeConfig.features.trustPolicySummaries;
    return (
        <div className="min-h-screen bg-[#F0F4F8] text-[#0B192C] pb-20">
            {/* Hero Banner */}
            <section className="bg-[#0B192C] text-white border-b border-slate-800 pt-24 pb-12">
                <div className="h-[3px] w-full bg-[#DC2626] mb-8" />
                <div className="container mx-auto px-4 max-w-6xl">
                    <div className="flex flex-wrap items-center gap-3 mb-4">
                        <span className="inline-flex items-center gap-1.5 rounded-sm bg-[#0284C7]/20 border border-[#38BDF8]/40 px-3 py-1 font-mono text-xs font-bold uppercase tracking-wider text-[#38BDF8]">
                            <Truck className="w-3.5 h-3.5 text-[#DC2626]" aria-hidden="true" />
                            LOGISTIKA VISOJE LIETUVOJE · 1–3 DARBO DIENOS
                        </span>
                        <span className="font-mono text-xs text-slate-300">
                            Paštomatai · Kurjeris į objektą · Paletinis transportas
                        </span>
                    </div>
                    <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-4">
                        Pristatymo ir įrangos atsiėmimo sąlygos
                    </h1>
                    <p className="text-slate-300 text-base md:text-lg max-w-3xl leading-relaxed">
                        Nuo vieno Danfoss vožtuvo į artimiausią paštomatą iki pilnos katilinės komplektacijos ant paletės tiesiai į Jūsų statybvietę.
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
                            <span>14 d. grąžinimo ir keitimo tvarka</span>
                            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {SHIPPING_TRUST_CARDS.map((card) => {
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
                                        <span>Saugus įpakavimas ir draudimas</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>
                )}

                {/* Detailed Shipping Table & Rules */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-8 bg-white rounded-md border border-slate-200 p-6 md:p-10 shadow-xs space-y-8">
                        <section className="space-y-4">
                            <h2 className="font-display text-xl font-bold text-[#0B192C] border-b border-slate-200 pb-2">
                                1. Pristatymo būdai ir terminai Lietuvoje
                            </h2>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse text-sm">
                                    <thead>
                                        <tr className="bg-[#0B192C] text-white font-mono text-xs uppercase">
                                            <th className="p-3">Pristatymo būdas</th>
                                            <th className="p-3">Tinkama įranga</th>
                                            <th className="p-3">Terminas</th>
                                            <th className="p-3">Pastabos</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200">
                                        {DELIVERY_TIERS.map((row) => (
                                            <tr key={row.method} className="hover:bg-slate-50">
                                                <td className="p-3 font-bold text-[#0B192C]">{row.method}</td>
                                                <td className="p-3 text-slate-700">{row.items}</td>
                                                <td className="p-3 font-mono font-bold text-[#DC2626] whitespace-nowrap">{row.eta}</td>
                                                <td className="p-3 text-slate-600 text-xs">{row.notes}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </section>

                        <section className="space-y-3">
                            <h2 className="font-display text-xl font-bold text-[#0B192C] border-b border-slate-200 pb-2">
                                2. Pristatymas tiesiai į statybvietę (objektą) montuotojams
                            </h2>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Suprantame, kad katilinės ar grindinio šildymo montavimo darbai negali laukti. Užsakymo metu galite nurodyti statybvietės adresą ir atsakingo meistro telefono numerį – kurjeris susisieks prieš atvykdamas, o sąskaita faktūra bus išsiųsta užsakovui ar įmonei el. paštu.
                            </p>
                        </section>

                        <section className="space-y-3">
                            <h2 className="font-display text-xl font-bold text-[#0B192C] border-b border-slate-200 pb-2">
                                3. Siuntos patikra priėmimo metu ir 14 d. keitimo garantija
                            </h2>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Visos siuntos yra apdraustos. Atsiimdami stambiagabaritę įrangą (katilus, plėtimosi indus, kolektorius) patikrinkite pakuotės būklę. Jei išpakavę pastebėjote, kad užsisakėte netinkamo sriegio ar skersmens detalę (pvz., <strong>DN15 vietoj DN20</strong> arba <strong>RA Click vietoj M30×1.5</strong>), parašykite <EmailText email="info@gilesinzinerija.lt" className="font-mono font-semibold text-[#0284C7]" /> – operatyviai pakeisime.
                            </p>
                        </section>
                    </div>

                    {/* Sidebar */}
                    <aside className="lg:col-span-4 space-y-6">
                        <div className="rounded-md bg-[#0B192C] text-white p-6 border border-[#0284C7]/40">
                            <div className="h-1 w-full bg-[#DC2626] mb-5" />
                            <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-[#38BDF8] font-bold mb-2">
                                <ShieldCheck className="w-4 h-4 text-[#DC2626]" aria-hidden="true" />
                                <span>PILNAS OBJEKTO TIEKIMAS</span>
                            </div>
                            <h3 className="font-display text-lg font-bold mb-2">
                                Komplektuojate visą namą ar katilinę?
                            </h3>
                            <p className="text-xs text-slate-300 leading-relaxed mb-4">
                                Įkelkite projekto specifikaciją arba pasiskaičiuokite mazgus – visą užsakymą sukomplektuosime ir pristatysime vienu reisu.
                            </p>
                            <div className="space-y-2">
                                <Link
                                    href="/uzklausa"
                                    className="flex items-center justify-between py-2.5 px-3 rounded-sm bg-[#DC2626] hover:bg-[#B91C1C] text-xs font-bold transition-colors"
                                >
                                    <span>Projekto sąmatos užklausa (RFQ)</span>
                                    <ArrowRight className="w-4 h-4 text-white" aria-hidden="true" />
                                </Link>
                                <Link
                                    href="/skaiciuokle"
                                    className="flex items-center justify-between py-2.5 px-3 rounded-sm bg-[#0F2537] hover:bg-[#0284C7] text-xs font-bold transition-colors"
                                >
                                    <span>5 ŠVOK įrangos skaičiuoklės</span>
                                    <Calculator className="w-4 h-4 text-[#38BDF8]" aria-hidden="true" />
                                </Link>
                                <Link
                                    href="/returns"
                                    className="flex items-center justify-between py-2.5 px-3 rounded-sm bg-[#0F2537] hover:bg-[#0284C7] text-xs font-bold transition-colors"
                                >
                                    <span>14 d. grąžinimo taisyklės</span>
                                    <Wrench className="w-4 h-4 text-[#38BDF8]" aria-hidden="true" />
                                </Link>
                            </div>
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    );
}
