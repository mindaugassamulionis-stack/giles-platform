import type { Metadata } from 'next';
import Link from 'next/link';
import { CheckCircle, Package, Mail, ArrowRight } from 'lucide-react';
import { PurchaseTracker } from '../../../components/purchase-tracker';
import { db } from '@platform/database';
import { orders, orderLineItems } from '@platform/database/schema/orders';
import { eq } from 'drizzle-orm';
import { getTranslations } from 'next-intl/server';

// DB-backed page (order lookup): render per-request so production builds do not require a live postgres for prerender.
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
    title: 'Užsakymas patvirtintas | Gilės Inžinerija',
};

export default async function ConfirmationPage({
    searchParams,
}: {
    searchParams: Promise<{ payment_intent?: string }>;
}) {
    const t = await getTranslations();
    const params = await searchParams;
    const paymentIntentId = params.payment_intent;
    let orderDetails = null;

    if (paymentIntentId) {
        const orderData = await db.query.orders.findFirst({
            where: eq(orders.paymentIntentId, paymentIntentId),
            with: {
                lineItems: true
            }
        });

        if (orderData) {
            orderDetails = {
                id: orderData.id,
                total: Number(orderData.total),
                currency: orderData.currency || 'EUR',
                items: orderData.lineItems.map((item: any) => ({
                    sku: item.sku || 'unknown',
                    name: item.title,
                    price: Number(item.unitPrice),
                    quantity: item.quantity
                }))
            };
        }
    }

    return (
        <div className="min-h-screen bg-zinc-50 pt-24">
            <div className="container mx-auto px-4 py-12">
                {orderDetails && (
                    <PurchaseTracker
                        amount={orderDetails.total}
                        currency={orderDetails.currency}
                        orderId={orderDetails.id}
                        items={orderDetails.items}
                    />
                )}
                <div className="max-w-2xl mx-auto text-center">
                    {/* Success Icon */}
                    <div className="mb-8">
                        <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                            <CheckCircle className="w-12 h-12 text-emerald-600" />
                        </div>
                    </div>

                    {/* Heading */}
                    <h1 className="font-display text-3xl md:text-4xl font-bold mb-4">
                        {t('confirmation.thanks')}
                    </h1>
                    <p className="text-lg text-muted-foreground mb-8">
                        {t('confirmation.confirmed')}
                    </p>

                    {/* Order Details Card */}
                    <div className="bg-white rounded-2xl p-8 shadow-sm border border-border text-left mb-8">
                        <h2 className="font-semibold text-lg mb-4">{t('confirmation.orderInfo')}</h2>

                        <div className="space-y-3 text-sm">
                            {paymentIntentId && (
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">{t('confirmation.paymentId')}</span>
                                    <span className="font-mono text-xs">{paymentIntentId.slice(0, 20)}...</span>
                                </div>
                            )}
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">{t('confirmation.status')}</span>
                                <span className="text-emerald-600 font-medium flex items-center gap-1">
                                    <span className="w-2 h-2 bg-emerald-500 rounded-full" />
                                    {t('confirmation.paid')}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">{t('confirmation.eta')}</span>
                                <span>{t('confirmation.etaValue')}</span>
                            </div>
                        </div>
                    </div>

                    {/* What's Next */}
                    <div className="bg-primary/5 rounded-2xl p-8 text-left mb-8">
                        <h2 className="font-semibold text-lg mb-4">{t('confirmation.next')}</h2>

                        <div className="space-y-4">
                            <div className="flex gap-4">
                                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                                    <Mail className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                    <p className="font-medium">{t('confirmation.emailStep')}</p>
                                    <p className="text-sm text-muted-foreground">
                                        {t('confirmation.emailStepDesc')}
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                                    <Package className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                    <p className="font-medium">{t('confirmation.shippingStep')}</p>
                                    <p className="text-sm text-muted-foreground">
                                        {t('confirmation.shippingStepDesc')}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* CTA */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            href="/products"
                            className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-primary text-primary-foreground rounded-full font-medium hover:bg-primary/90 transition-all"
                        >
                            {t('cartPage.continue')}
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                        <Link
                            href="/"
                            className="inline-flex items-center justify-center px-8 py-3 border border-border rounded-full font-medium hover:bg-muted transition-all"
                        >
                            {t('notFound.home')}
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
