import type { Metadata } from 'next';
import { B2BPortalClient, type EditableCatalogItem } from '../../../components/b2b-portal-client';
import {
    getGilesCatalogSnapshot,
    getGilesSnapshotPopularProducts,
    resolveB2BQuickOrderRows,
} from '../../../lib/giles-catalog-snapshot';

export const dynamic = 'force-dynamic';

const PAGE_META: Record<string, { title: string; description: string }> = {
    lt: {
        title: 'Montuotojų B2B Portalas | UAB „Gilės inžinerija“',
        description:
            'UAB „Gilės inžinerija“ B2B portalas montuotojams ir rangovams: didmeninės ŠVOK kainos, greitas užsakymas pagal SKU/EAN, PVM sąskaitos ir 5 tiekėjų kainoraščiai.',
    },
    en: {
        title: 'Installer B2B Portal | UAB Gilės inžinerija',
        description:
            'UAB Gilės inžinerija B2B portal for HVAC installers and contractors: wholesale pricing, bulk SKU/EAN ordering, VAT invoices, and 5 official supplier pricelists.',
    },
    pl: {
        title: 'Portal B2B dla Instalatorów | UAB Gilės inžinerija',
        description:
            'Portal B2B UAB Gilės inžinerija dla instalatorów HVAC: ceny hurtowe, szybkie zamówienia po kodzie SKU/EAN, faktury VAT oraz 5 oficjalnych cenników.',
    },
    ru: {
        title: 'B2B портал для монтажников | UAB Gilės inžinerija',
        description:
            'B2B портал UAB Gilės inžinerija для монтажников ОВиК: оптовые цены, быстрый заказ по артикулу SKU/EAN, счета-фактуры НДС и 5 официальных прайс-листов.',
    },
};

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>;
}): Promise<Metadata> {
    const resolved = await params;
    const loc = resolved?.locale || 'lt';
    const meta = PAGE_META[loc] ?? PAGE_META.lt!;
    return {
        title: meta.title,
        description: meta.description,
    };
}

export default async function GilesB2BPortalPage({
    params,
}: {
    params: Promise<{ locale: string }>;
}) {
    const resolved = await params;
    const locale = resolved?.locale || 'lt';

    const initialQuickRows = resolveB2BQuickOrderRows([
        { code: '013G2990', qty: 10 },
        { code: 'AW082HUGHA', qty: 1 },
        { code: 'ZV 100', qty: 2 },
        { code: '1776603', qty: 4 },
        { code: 'degkmpl140mg20', qty: 1 },
    ]);

    const snap = getGilesCatalogSnapshot();
    const popular = getGilesSnapshotPopularProducts(16);
    const initialEditorItems: EditableCatalogItem[] = popular.map((p) => {
        const raw = snap.rawById.get(p.id);
        const grossEur = p.price > 0 ? Math.round(p.price * 100) / 100 : 125;
        const netEur = Math.round((grossEur / 1.21) * 100) / 100;
        const costNetEur =
            raw?.costCents && raw.costCents > 0
                ? Math.round(raw.costCents) / 100
                : Math.round(netEur * 0.62 * 100) / 100;
        return {
            id: p.id,
            sku: p.sku,
            ean: raw?.ean || '5702420049113',
            title: p.nameLt || p.name,
            brandName: p.brandName || 'Gilės Inžinerija',
            grossEur,
            netEur,
            costNetEur,
            stock: p.stock != null && p.stock > 0 ? p.stock : 14,
        };
    });

    return (
        <B2BPortalClient
            locale={locale}
            initialQuickRows={initialQuickRows}
            initialEditorItems={initialEditorItems}
        />
    );
}
