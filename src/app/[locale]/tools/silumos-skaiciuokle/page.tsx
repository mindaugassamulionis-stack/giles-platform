import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { ScientificCalculatorsHub } from '../../../../components/scientific-calculators-hub';
import { getCalculatorRecommendations } from '../../../../lib/scientific-calculators-catalog';
import { formatInstrumentalAgentName, type CalculatorToolId } from '../../../../lib/scientific-calculators';
import { getCalculatorPageJsonLd } from '../../../../lib/calculator-marketing';
import { escapeJsonLdForScript } from '../../../../lib/jsonld';
import { Link } from '../../../../i18n/navigation';
import { getBrandName, withBrandSuffix } from '../../../../lib/brand';

export const dynamic = 'force-dynamic';

// W35-A1 & W44-A2: 5-in-1 ŠVOK Engineering Calculators & Live Product Selection Hub
// Daylight-first layout with step-grouped pill configurators and result + matching products as the hero.
// Includes Vytautas consultation and RFQ handoff.
export async function generateMetadata(): Promise<Metadata> {
    return {
        title: withBrandSuffix('Interaktyvus ŠVOK įrangos parinkimo vedlys', await getBrandName()),
        description:
            'Pasirinkite savo būsto parametrus vizualiai – skaičiuoklė iškart parodys tinkamą katilo galią, plėtimosi indo tūrį, kolektorių ar vamzdžio skersmenį ir parinks tikslias prekes iš katalogo.',
    };
}

const VALID_TABS: Set<CalculatorToolId> = new Set([
    'boiler',
    'vessel',
    'valve',
    'manifold',
    'radiator',
]);

export default async function HeatToolPage({
    searchParams,
}: {
    searchParams?: Promise<{ tab?: string }>;
}) {
    const resolvedParams = searchParams ? await searchParams : {};
    const rawTab = (resolvedParams?.tab || 'boiler').toLowerCase() as CalculatorToolId;
    const initialTab: CalculatorToolId = VALID_TABS.has(rawTab) ? rawTab : 'boiler';

    const [boilerRecs, vesselRecs, valveRecs, manifoldRecs, radiatorRecs] = await Promise.all([
        getCalculatorRecommendations({ tool: 'boiler', kw: 5.5, liters: 200 }),
        getCalculatorRecommendations({ tool: 'vessel', liters: 18, kw: 18 }),
        getCalculatorRecommendations({ tool: 'valve', dn: 'DN20', kv: 2.18 }),
        getCalculatorRecommendations({ tool: 'manifold', loops: 8 }),
        getCalculatorRecommendations({ tool: 'radiator', radiators: 6, connection: 'bottom_vk_50mm', control: 'afc_dynamic' }),
    ]);
    const nonce = (await headers()).get('x-nonce') ?? undefined;
    const calcJsonLd = getCalculatorPageJsonLd();

    return (
        <main className="min-h-screen bg-[var(--surface-canvas)] text-[var(--text-primary)]">
            <script
                type="application/ld+json"
                nonce={nonce}
                dangerouslySetInnerHTML={{ __html: escapeJsonLdForScript(JSON.stringify(calcJsonLd)) }}
            />
            {/* Compact Daylight Engineering Header */}
            <div className="bg-white border-b border-stone-200 py-3.5">
                <div className="container mx-auto px-4 max-w-6xl flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-stone-900">
                            Interaktyvus ŠVOK įrangos parinkimo vedlys
                        </h1>
                        <p className="text-stone-600 text-xs sm:text-sm mt-0.5 max-w-3xl leading-relaxed">
                            Pasirinkite savo būsto parametrus – skaičiuoklė iškart parodys rekomenduojamą galią, tūrį ar skersmenį ir atrinks tinkančias{' '}
                            <strong className="text-stone-900">Danfoss, IMI Heimeier, IMI Pneumatex, IMI TA bei Ferroli</strong>
                            {` prekes arba sujungs su konsultantu ${formatInstrumentalAgentName('Vytautas')} (Vytautas AI).`}
                        </p>
                    </div>
                    <Link
                        href="/uzklausa"
                        className="inline-flex items-center justify-center rounded-sm border border-stone-300 bg-stone-50 hover:border-stone-900 px-3 py-1.5 text-xs font-semibold text-stone-900 transition-colors shrink-0"
                    >
                        Projekto sąmatos užklausa (RFQ)
                    </Link>
                </div>
            </div>

            <div className="container mx-auto px-4 py-4 max-w-6xl">
                <ScientificCalculatorsHub
                    initialTab={initialTab}
                    initialRecommendationsByTool={{
                        boiler: boilerRecs,
                        vessel: vesselRecs,
                        valve: valveRecs,
                        manifold: manifoldRecs,
                        radiator: radiatorRecs,
                    }}
                />
            </div>
        </main>
    );
}
