'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useCartStore, useCartHydration } from '../../../store/cart';
import { ArrowLeft, Lock, ShoppingBag, AlertCircle } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { apiUrl } from '../../../lib/api';
import { resolveAppLocale } from '../../../i18n/storefront-ui-copy';
import type { AppLocale } from '../../../i18n/routing';

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder');

const CHECKOUT_LOCALE_COPY: Record<
    AppLocale,
    {
        preparing: string;
        errorHeading: string;
        backToCart: string;
        orderConfirm: string;
        contactUs: string;
        emailPlaceholder: string;
        phonePlaceholder: string;
        shippingAddress: string;
        firstNamePlaceholder: string;
        lastNamePlaceholder: string;
        addressPlaceholder: string;
        postalCodePlaceholder: string;
        cityPlaceholder: string;
        shippingMethod: string;
        omniva: string;
        etaValue: string;
        dpd: string;
        days12: string;
        freeLabel: string;
        paymentTitle: string;
        processing: string;
        confirmOrder: string;
        stripeSecure: string;
        paymentFailed: string;
        paymentCreateFailed: string;
        agreePrefix: string;
        purchaseTerms: string;
        agreeConnector: string;
        privacyPolicy: string;
        yourOrder: string;
        qtyPrefix: string;
        itemsSubtotal: string;
        shippingLabel: string;
        totalLabel: string;
    }
> = {
    lt: {
        preparing: 'Ruošiamas saugus atsiskaitymas...',
        errorHeading: 'Atsiskaitymo klaida',
        backToCart: 'Grįžti į krepšelį',
        orderConfirm: 'Užsakymo patvirtinimas',
        contactUs: 'Kontaktiniai duomenys',
        emailPlaceholder: 'El. pašto adresas',
        phonePlaceholder: 'Telefono numeris (+370 6...)',
        shippingAddress: 'Pristatymo adresas',
        firstNamePlaceholder: 'Vardas',
        lastNamePlaceholder: 'Pavardė',
        addressPlaceholder: 'Gatvė, namo ir buto nr.',
        postalCodePlaceholder: 'Pašto kodas',
        cityPlaceholder: 'Miestas',
        shippingMethod: 'Pristatymo būdas',
        omniva: 'Omniva paštomatas / standartinis pristatymas',
        etaValue: 'Pristatymas per 2–3 darbo dienas',
        dpd: 'DPD kurjeris į rankas / į objektą',
        days12: 'Pristatymas per 1–2 darbo dienas',
        freeLabel: 'Nemokamas',
        paymentTitle: 'Mokėjimo būdas',
        processing: 'Apdorojamas mokėjimas...',
        confirmOrder: 'Patvirtinti ir apmokėti užsakymą',
        stripeSecure: 'Saugus SSL / Stripe mokėjimas',
        paymentFailed: 'Mokėjimas nepavyko',
        paymentCreateFailed: 'Šiuo metu mokėjimo paslauga nepasiekiama.',
        agreePrefix: 'Sutinku su',
        purchaseTerms: 'pirkimo taisyklėmis',
        agreeConnector: 'ir',
        privacyPolicy: 'privatumo politika',
        yourOrder: 'Jūsų užsakymas',
        qtyPrefix: 'Kiekis:',
        itemsSubtotal: 'Prekių suma',
        shippingLabel: 'Pristatymas',
        totalLabel: 'Iš viso su PVM',
    },
    en: {
        preparing: 'Preparing secure checkout...',
        errorHeading: 'Checkout error',
        backToCart: 'Back to cart',
        orderConfirm: 'Order Confirmation',
        contactUs: 'Contact Information',
        emailPlaceholder: 'Email address',
        phonePlaceholder: 'Phone number (+370 6...)',
        shippingAddress: 'Shipping Address',
        firstNamePlaceholder: 'First name',
        lastNamePlaceholder: 'Last name',
        addressPlaceholder: 'Street address, building/unit',
        postalCodePlaceholder: 'Postal code',
        cityPlaceholder: 'City',
        shippingMethod: 'Shipping Method',
        omniva: 'Omniva parcel locker / standard delivery',
        etaValue: 'Delivery in 2–3 business days',
        dpd: 'DPD courier to door / project site',
        days12: 'Delivery in 1–2 business days',
        freeLabel: 'Free',
        paymentTitle: 'Payment Method',
        processing: 'Processing payment...',
        confirmOrder: 'Confirm and pay order',
        stripeSecure: 'Encrypted SSL / Stripe payment',
        paymentFailed: 'Payment failed',
        paymentCreateFailed: 'Payment service is temporarily unavailable.',
        agreePrefix: 'I agree to the',
        purchaseTerms: 'terms of purchase',
        agreeConnector: 'and',
        privacyPolicy: 'privacy policy',
        yourOrder: 'Your Order',
        qtyPrefix: 'Quantity:',
        itemsSubtotal: 'Items subtotal',
        shippingLabel: 'Shipping',
        totalLabel: 'Total incl. VAT',
    },
    pl: {
        preparing: 'Przygotowywanie bezpiecznej płatności...',
        errorHeading: 'Błąd płatności',
        backToCart: 'Wróć do koszyka',
        orderConfirm: 'Potwierdzenie zamówienia',
        contactUs: 'Dane kontaktowe',
        emailPlaceholder: 'Adres e-mail',
        phonePlaceholder: 'Numer telefonu (+48 / +370...)',
        shippingAddress: 'Adres dostawy',
        firstNamePlaceholder: 'Imię',
        lastNamePlaceholder: 'Nazwisko',
        addressPlaceholder: 'Ulica, nr budynku / lokalu',
        postalCodePlaceholder: 'Kod pocztowy',
        cityPlaceholder: 'Miasto',
        shippingMethod: 'Sposób dostawy',
        omniva: 'Paczkomat Omniva / dostawa standardowa',
        etaValue: 'Dostawa w 2–3 dni robocze',
        dpd: 'Kurier DPD pod adres / na budowę',
        days12: 'Dostawa w 1–2 dni robocze',
        freeLabel: 'Bezpłatnie',
        paymentTitle: 'Metoda płatności',
        processing: 'Przetwarzanie płatności...',
        confirmOrder: 'Potwierdź i opłać zamówienie',
        stripeSecure: 'Bezpieczna płatność SSL / Stripe',
        paymentFailed: 'Płatność nie powiodła się',
        paymentCreateFailed: 'Usługa płatności jest chwilowo niedostępna.',
        agreePrefix: 'Akceptuję',
        purchaseTerms: 'regulamin zakupów',
        agreeConnector: 'oraz',
        privacyPolicy: 'politykę prywatności',
        yourOrder: 'Twoje zamówienie',
        qtyPrefix: 'Ilość:',
        itemsSubtotal: 'Wartość produktów',
        shippingLabel: 'Dostawa',
        totalLabel: 'Razem z VAT',
    },
    ru: {
        preparing: 'Подготовка безопасной оплаты...',
        errorHeading: 'Ошибка оформления',
        backToCart: 'Вернуться в корзину',
        orderConfirm: 'Подтверждение заказа',
        contactUs: 'Контактные данные',
        emailPlaceholder: 'Адрес эл. почты',
        phonePlaceholder: 'Номер телефона (+370 6...)',
        shippingAddress: 'Адрес доставки',
        firstNamePlaceholder: 'Имя',
        lastNamePlaceholder: 'Фамилия',
        addressPlaceholder: 'Улица, номер дома / квартиры',
        postalCodePlaceholder: 'Почтовый индекс',
        cityPlaceholder: 'Город',
        shippingMethod: 'Способ доставки',
        omniva: 'Почтомат Omniva / стандартная доставка',
        etaValue: 'Доставка за 2–3 рабочих дня',
        dpd: 'Курьер DPD до двери / на объект',
        days12: 'Доставка за 1–2 рабочих дня',
        freeLabel: 'Бесплатно',
        paymentTitle: 'Способ оплаты',
        processing: 'Обработка платежа...',
        confirmOrder: 'Подтвердить и оплатить заказ',
        stripeSecure: 'Защищенный платеж SSL / Stripe',
        paymentFailed: 'Ошибка оплаты',
        paymentCreateFailed: 'Платежный сервис временно недоступен.',
        agreePrefix: 'Я согласен с',
        purchaseTerms: 'правилами покупки',
        agreeConnector: 'и',
        privacyPolicy: 'политикой конфиденциальности',
        yourOrder: 'Ваш заказ',
        qtyPrefix: 'Количество:',
        itemsSubtotal: 'Сумма товаров',
        shippingLabel: 'Доставка',
        totalLabel: 'Итого с НДС',
    },
};

function CheckoutForm({
    clientSecret,
    locale,
}: {
    clientSecret: string;
    locale: AppLocale;
}) {
    const ui = CHECKOUT_LOCALE_COPY[locale] || CHECKOUT_LOCALE_COPY.lt;
    const stripe = useStripe();
    const elements = useElements();
    const router = useRouter();
    const clearCart = useCartStore((state) => state.clearCart);

    const [isProcessing, setIsProcessing] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!stripe || !elements) {
            return;
        }

        setIsProcessing(true);
        setErrorMessage(null);

        const { error, paymentIntent } = await stripe.confirmPayment({
            elements,
            confirmParams: {
                return_url: `${window.location.origin}/${locale}/confirmation`,
            },
            redirect: 'if_required',
        });

        if (error) {
            setErrorMessage(error.message || ui.paymentFailed);
            setIsProcessing(false);
        } else if (paymentIntent && paymentIntent.status === 'succeeded') {
            clearCart();
            router.push(`/${locale}/confirmation?payment_intent=${paymentIntent.id}`);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <PaymentElement
                options={{
                    layout: 'tabs',
                }}
            />

            {errorMessage && (
                <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
                    {errorMessage}
                </div>
            )}

            <button
                type="submit"
                disabled={!stripe || isProcessing}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary py-4 text-base font-semibold text-primary-foreground shadow-lg transition-all hover:bg-primary/90 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isProcessing ? (
                    <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        {ui.processing}
                    </>
                ) : (
                    <>
                        <Lock className="w-5 h-5" />
                        {ui.confirmOrder}
                    </>
                )}
            </button>

            <p className="text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                <Lock className="w-3 h-3" />
                {ui.stripeSecure}
            </p>
        </form>
    );
}

export default function CheckoutPage() {
    const t = useTranslations();
    const intlLocale = useLocale() || 'lt';
    const rawPathname = usePathname() || '';
    const urlMatch = rawPathname.match(/^\/(lt|en|pl|ru)(?=\/|$)/i);
    const locale = resolveAppLocale(urlMatch ? urlMatch[1] : intlLocale);
    const ui = CHECKOUT_LOCALE_COPY[locale] || CHECKOUT_LOCALE_COPY.lt;

    const { items, getSubtotal, getShipping, getTotal } = useCartStore();
    const hydrated = useCartHydration();
    const router = useRouter();

    const [clientSecret, setClientSecret] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Form state
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [address, setAddress] = useState('');
    const [city, setCity] = useState('');
    const [postalCode, setPostalCode] = useState('');
    const [shippingMethod, setShippingMethod] = useState('standard');
    const [termsAccepted, setTermsAccepted] = useState(false);

    // Create PaymentIntent when cart is loaded
    useEffect(() => {
        if (!hydrated) return;

        if (items.length === 0) {
            router.push(`/${locale}/cart`);
            return;
        }

        const createPaymentIntent = async () => {
            try {
                const response = await fetch(apiUrl('/api/checkout'), {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ items, email, locale }),
                });

                if (!response.ok) {
                    let copy = ui.paymentCreateFailed || t('checkoutPage.paymentCreateFailed');
                    try {
                        const errData = await response.json();
                        if (typeof errData?.error === 'string' && errData.error) copy = errData.error;
                    } catch { /* non-JSON body — keep the localized fallback */ }
                    throw new Error(copy);
                }

                const data = await response.json();
                setClientSecret(data.clientSecret);
            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : '';
                setError(message || ui.paymentCreateFailed);
            } finally {
                setLoading(false);
            }
        };

        createPaymentIntent();
    }, [hydrated, items, router, email, locale, t, ui.paymentCreateFailed]);

    if (!hydrated || loading) {
        return (
            <div className="min-h-screen bg-[var(--background)] pt-24 flex items-center justify-center" role="status" aria-live="polite">
                <div className="text-center rounded-md border border-[var(--border)] bg-[var(--card)] px-8 py-6">
                    <p className="text-[var(--muted-foreground)] font-medium">{ui.preparing}</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-zinc-50 pt-24">
                <div className="container mx-auto px-4 py-8 text-center">
                    <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-700 mb-4">
                        <AlertCircle className="w-7 h-7" />
                    </div>
                    <h1 className="text-2xl font-bold mb-4">{ui.errorHeading}</h1>
                    <p className="text-muted-foreground mb-6">{error}</p>
                    <Link href={`/${locale}/cart`} className="text-primary underline">
                        {ui.backToCart}
                    </Link>
                </div>
            </div>
        );
    }

    const subtotal = getSubtotal();
    const shipping = getShipping();
    const total = getTotal();

    return (
        <div className="min-h-screen bg-zinc-50 pt-24">
            <div className="container mx-auto px-4 py-8">
                <div className="mb-6">
                    <Link
                        href={`/${locale}/cart`}
                        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        {ui.backToCart}
                    </Link>
                </div>

                <h1 className="mb-8 text-3xl font-bold tracking-tight font-display">{ui.orderConfirm}</h1>

                <div className="grid gap-12 lg:grid-cols-2">
                    {/* Checkout Form */}
                    <div className="space-y-8">
                        {/* Contact */}
                        <section className="bg-white rounded-2xl p-6 shadow-sm border border-border">
                            <h2 className="mb-4 text-xl font-semibold">{ui.contactUs}</h2>
                            <div className="space-y-3">
                                <input
                                    type="email"
                                    placeholder={ui.emailPlaceholder}
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                                <input
                                    type="tel"
                                    placeholder={ui.phonePlaceholder}
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    required
                                    className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                            </div>
                        </section>

                        {/* Shipping Address */}
                        <section className="bg-white rounded-2xl p-6 shadow-sm border border-border">
                            <h2 className="mb-4 text-xl font-semibold">{ui.shippingAddress}</h2>
                            <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                    <input
                                        type="text"
                                        placeholder={ui.firstNamePlaceholder}
                                        value={firstName}
                                        onChange={(e) => setFirstName(e.target.value)}
                                        required
                                        className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                    />
                                    <input
                                        type="text"
                                        placeholder={ui.lastNamePlaceholder}
                                        value={lastName}
                                        onChange={(e) => setLastName(e.target.value)}
                                        required
                                        className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                    />
                                </div>
                                <input
                                    type="text"
                                    placeholder={ui.addressPlaceholder}
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                    required
                                    className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                                <div className="grid grid-cols-3 gap-3">
                                    <input
                                        type="text"
                                        placeholder={ui.postalCodePlaceholder}
                                        value={postalCode}
                                        onChange={(e) => setPostalCode(e.target.value)}
                                        required
                                        className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                    />
                                    <input
                                        type="text"
                                        placeholder={ui.cityPlaceholder}
                                        value={city}
                                        onChange={(e) => setCity(e.target.value)}
                                        required
                                        className="col-span-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                    />
                                </div>
                            </div>
                        </section>

                        {/* Shipping Method */}
                        <section className="bg-white rounded-2xl p-6 shadow-sm border border-border">
                            <h2 className="mb-4 text-xl font-semibold">{ui.shippingMethod}</h2>
                            <div className="space-y-3">
                                <label className={`flex cursor-pointer items-center rounded-xl border-2 p-4 transition-all ${shippingMethod === 'standard' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}>
                                    <input
                                        type="radio"
                                        name="shipping"
                                        value="standard"
                                        checked={shippingMethod === 'standard'}
                                        onChange={(e) => setShippingMethod(e.target.value)}
                                        className="mr-3 accent-primary"
                                    />
                                    <div className="flex-1">
                                        <p className="font-medium">{ui.omniva}</p>
                                        <p className="text-sm text-muted-foreground">{ui.etaValue}</p>
                                    </div>
                                    <span className="font-semibold text-emerald-600">
                                        {subtotal >= 50 ? ui.freeLabel : '2.99 €'}
                                    </span>
                                </label>
                                <label className={`flex cursor-pointer items-center rounded-xl border-2 p-4 transition-all ${shippingMethod === 'express' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}>
                                    <input
                                        type="radio"
                                        name="shipping"
                                        value="express"
                                        checked={shippingMethod === 'express'}
                                        onChange={(e) => setShippingMethod(e.target.value)}
                                        className="mr-3 accent-primary"
                                    />
                                    <div className="flex-1">
                                        <p className="font-medium">{ui.dpd}</p>
                                        <p className="text-sm text-muted-foreground">{ui.days12}</p>
                                    </div>
                                    <span className="font-semibold">6.99 €</span>
                                </label>
                            </div>
                        </section>

                        {/* Payment */}
                        <section className="bg-white rounded-2xl p-6 shadow-sm border border-border">
                            <h2 className="mb-4 text-xl font-semibold">{ui.paymentTitle}</h2>
                            {clientSecret ? (
                                <Elements stripe={stripePromise} options={{ clientSecret }}>
                                    <CheckoutForm clientSecret={clientSecret} locale={locale} />
                                </Elements>
                            ) : (
                                <div className="text-center py-8 text-sm text-[var(--muted-foreground)]" role="status">
                                    {ui.preparing}
                                </div>
                            )}
                        </section>

                        {/* Terms */}
                        <label className="flex items-start gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={termsAccepted}
                                onChange={(e) => setTermsAccepted(e.target.checked)}
                                required
                                className="mt-1 accent-primary"
                            />
                            <span className="text-sm text-muted-foreground">
                                {ui.agreePrefix}{' '}
                                <Link href={`/${locale}/legal/terms`} className="underline hover:text-primary">{ui.purchaseTerms}</Link>
                                {' '}{ui.agreeConnector}{' '}
                                <Link href={`/${locale}/legal/privacy`} className="underline hover:text-primary">{ui.privacyPolicy}</Link> *
                            </span>
                        </label>
                    </div>

                    {/* Order Summary */}
                    <div className="h-fit rounded-2xl border border-border bg-white p-6 shadow-sm lg:sticky lg:top-24">
                        <h2 className="mb-6 text-xl font-semibold flex items-center gap-2">
                            <ShoppingBag className="w-5 h-5" />
                            {ui.yourOrder}
                        </h2>

                        <div className="mb-6 space-y-4 border-b border-border pb-6 max-h-[300px] overflow-y-auto">
                            {items.map((item) => (
                                <div key={item.id} className="flex gap-3">
                                    <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-muted text-sm font-mono font-bold shrink-0">
                                        <ShoppingBag className="w-5 h-5 text-stone-700" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">{item.name}</p>
                                        <p className="text-xs text-muted-foreground">{ui.qtyPrefix} {item.quantity}</p>
                                    </div>
                                    <p className="text-sm font-medium">
                                        {(item.price * item.quantity).toFixed(2)} €
                                    </p>
                                </div>
                            ))}
                        </div>

                        <div className="space-y-2 mb-4">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">{ui.itemsSubtotal}</span>
                                <span>{subtotal.toFixed(2)} €</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">{ui.shippingLabel}</span>
                                <span className={shipping === 0 ? 'text-emerald-600' : ''}>
                                    {shipping === 0 ? ui.freeLabel : `${shipping.toFixed(2)} €`}
                                </span>
                            </div>
                        </div>

                        <div className="flex justify-between border-t border-border pt-4 text-xl font-bold">
                            <span>{ui.totalLabel}</span>
                            <span>{total.toFixed(2)} €</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
