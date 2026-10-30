import type { Metadata } from 'next';
import { SystemPackagesClient } from '../../../components/conversion/system-packages-client';
import { GILES_SYSTEM_PACKAGES } from '../../../lib/giles-packages-data';
import { HeatingSystemCalculator } from '../../../components/conversion/heating-system-calculator';
import { useCart } from '../../../store/cart';
import { resolveAppLocale } from '../../../i18n/storefront-ui-copy';

void GILES_SYSTEM_PACKAGES;
void HeatingSystemCalculator;
void useCart;

export const dynamic = 'force-dynamic';

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>;
}): Promise<Metadata> {
    const resolved = await params;
    const loc = resolveAppLocale(resolved?.locale || 'lt');

    if (loc === 'en') {
        return {
            title: 'Complete Heating & Boiler Room System Packages | Gilės Inžinerija',
            description:
                'UAB „Gilės inžinerija“ – engineer-matched pellet boiler room, solid-fuel with buffer tank, Comisa underfloor heating (50–200 m²), solar thermal, IMI TA/Heimeier balancing, and Haier R290 heat pump packages.',
        };
    }
    if (loc === 'pl') {
        return {
            title: 'Systemowe pakiety grzewcze i kotłowniane (gotowe zestawy) | Gilės Inžinerija',
            description:
                'UAB „Gilės inžinerija” – dobrane pakiety kotłowni pelletowych, stałopaliwowych z buforem, ogrzewania podłogowego Comisa (50–200 m²), kolektorów słonecznych, równoważenia IMI TA/Heimeier oraz pomp ciepła Haier R290.',
        };
    }
    if (loc === 'ru') {
        return {
            title: 'Системные пакеты отопления и котельных (готовые комплекты) | Gilės Inžinerija',
            description:
                'UAB «Gilės inžinerija» – согласованные пакеты пеллетных и твердотопливных котельных с буфером, теплого пола Comisa (50–200 м²), солнечных коллекторов, балансировки IMI TA/Heimeier и тепловых насосов Haier R290.',
        };
    }
    return {
        title: 'Sisteminiai šildymo ir katilinių paketai (paruošti komplektai) | Gilės Inžinerija',
        description:
            'UAB „Gilės inžinerija“ – suderinti granulinės katilinės, kieto kuro su akumuliacine talpa, Comisa grindinio šildymo (50–200 m²), saulės kolektorių, IMI TA/Heimeier renovacijos ir Viessmann/Buderus dujinės katilinės paketai su interaktyvia šildymo sistemos skaičiuokle.',
    };
}

export default async function SystemPackagesPage({
    params,
}: {
    params: Promise<{ locale: string }>;
}) {
    const resolved = await params;
    const locale = resolved?.locale || 'lt';

    return (
        <main className="min-h-screen bg-[var(--surface-canvas)] text-[var(--text-primary)] py-6 sm:py-8">
            <div className="container mx-auto max-w-6xl px-4 sm:px-6">
                <SystemPackagesClient locale={locale} />
            </div>
        </main>
    );
}
