import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { eq } from 'drizzle-orm';
import { db } from '@platform/database';
import { orders } from '@platform/database/schema/orders';
import { PurchaseTracker } from '../../../components/purchase-tracker';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Užsakymas gautas' };

// R2 order confirmation (LT path /uzsakyma-gauta). Payments are disabled
// until Stripe keys land — the customer is told we will contact them.
export default async function OrderReceivedPage({
    searchParams,
}: {
    searchParams: Promise<{ uzsakymoNr?: string; total?: string }>;
}) {
    const { uzsakymoNr, total: totalParam } = await searchParams;
    const t = await getTranslations();

    let orderTotal = totalParam ? Number.parseFloat(totalParam) || 0 : 0;
    let orderItems: { sku: string; name: string; price: number; quantity: number }[] = [];

    if (uzsakymoNr && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uzsakymoNr)) {
        try {
            const orderData = await db.query.orders.findFirst({
                where: eq(orders.id, uzsakymoNr),
                with: { lineItems: true },
            });
            if (orderData) {
                orderTotal = Number(orderData.total ?? orderTotal);
                orderItems = (orderData.lineItems || []).map((item: any) => ({
                    sku: item.sku || 'unknown',
                    name: item.title || item.sku || 'Prekė',
                    price: Number(item.unitPrice ?? 0),
                    quantity: Number(item.quantity ?? 1),
                }));
            }
        } catch {
            // Order lookup is best-effort for pixel enrichment.
        }
    }

    return (
        <main className="min-h-screen bg-background text-foreground">
            {uzsakymoNr && (
                <PurchaseTracker
                    orderId={uzsakymoNr}
                    total={orderTotal}
                    amount={orderTotal}
                    currency="EUR"
                    items={orderItems}
                />
            )}
            <div className="container mx-auto px-4 py-20 text-center">
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-4xl" aria-hidden="true">
                    ✓
                </div>
                <h1 className="font-display text-3xl md:text-4xl font-bold">{t('orderReceived.title')}</h1>
                {uzsakymoNr && (
                    <p className="mt-4 text-lg">
                        Užsakymo numeris:{' '}
                        <span className="font-mono font-bold text-[var(--brand-primary)]">{uzsakymoNr}</span>
                    </p>
                )}
                <p className="mx-auto mt-4 max-w-md text-muted-foreground">
                    {uzsakymoNr
                        ? 'Dėl apmokėjimo susisieksime su Jumis per 1 darbo dieną.'
                        : 'Dėl apmokėjimo susisieksime su Jumis artimiausiu metu nurodytu el. paštu arba telefonu.'}
                </p>
                <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                    {t('orderReceived.subtitle')}
                </p>
                <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
                    <Link
                        href="/"
                        className="rounded-full bg-[var(--brand-primary)] px-8 py-3 font-bold text-white hover:bg-[var(--brand-primary-dark)]"
                    >
                        {t('orderReceived.back')}
                    </Link>
                </div>
                <ul className="mx-auto mt-12 grid max-w-2xl gap-4 text-left sm:grid-cols-3 text-sm">
                    <li className="rounded-xl border border-border p-4">{t('orderReceived.ship')}</li>
                    <li className="rounded-xl border border-border p-4">{t('orderReceived.returns')}</li>
                    <li className="rounded-xl border border-border p-4">{t('orderReceived.secure')}</li>
                </ul>
            </div>
        </main>
    );
}
