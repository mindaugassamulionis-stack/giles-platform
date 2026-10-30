import { CheckoutForm } from '../../../components/conversion/checkout-form';
import { getStore } from '../../../lib/storefront-content';
import { getTranslations } from 'next-intl/server';

// DB-backed page: render per-request so production builds do not require a live postgres for prerender.
export const dynamic = 'force-dynamic';

export const metadata = { title: 'Atsiskaitymas' };

export default async function CheckoutPage() {
    const t = await getTranslations();
    const store = await getStore();
    return (
        <main className="min-h-screen bg-background text-foreground">
            <div className="container mx-auto px-4 py-10">
                <h1 className="font-display text-3xl font-bold mb-1">{t('billingPage.title')}</h1>
                <p className="text-muted-foreground mb-8">{t('billingPage.subtitle')}</p>
                <CheckoutForm storeSlug={store?.slug || ''} />
            </div>
        </main>
    );
}
