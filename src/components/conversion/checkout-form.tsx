'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingCart, Truck, Warehouse, PackageCheck, CreditCard } from 'lucide-react';
import { useCartStore, useCartHydration } from '../../store/cart';
import { formatEur, submitOrder } from '../../lib/conversion';
import { DEFAULT_VAT_RATE, netFromGrossCents } from '../../lib/vat';
import {
    BALTIC_CARRIER_OPTIONS,
    BALTIC_PARCEL_TERMINALS,
    searchParcelTerminals,
    type BalticCarrierId,
} from '../../lib/baltic-carriers-and-payments';
import { useTranslations } from 'next-intl';

export type CheckoutDeliveryMethod = 'pickup' | 'locker' | 'freight';
export type CheckoutPaymentMethod = 'bank_transfer' | 'montonio_paysera' | 'b2b_deferred';

export function evaluateCheckoutDeliveryOptions(
    items: Array<{ sku?: string; name: string; price: number; quantity: number }>,
): {
    isHeavyCart: boolean;
    estimatedWeightKg: number;
    lockerDisabled: boolean;
    heavyReason: string | null;
} {
    let estimatedWeightKg = 0;
    let hasHeavyUnit = false;

    for (const item of items) {
        const text = `${item.sku || ''} ${item.name || ''}`.toLowerCase();
        const isHeavyItem =
            text.includes('katil') ||
            text.includes('boiler') ||
            text.includes('talp') ||
            text.includes('akumuliac') ||
            text.includes('degikl') ||
            text.includes('siurbl') ||
            text.includes('monoblok') ||
            text.includes('radiator') ||
            text.includes('mpb') ||
            text.includes('zv-') ||
            text.includes('gk-') ||
            text.includes('aw0') ||
            text.includes('aw1') ||
            text.includes('pol.') ||
            item.price >= 350;

        if (isHeavyItem) {
            hasHeavyUnit = true;
            estimatedWeightKg += 45 * Math.max(1, item.quantity);
        } else {
            estimatedWeightKg += 1.2 * Math.max(1, item.quantity);
        }
    }

    estimatedWeightKg = Math.round(estimatedWeightKg * 10) / 10;
    const isHeavyCart = hasHeavyUnit || estimatedWeightKg > 30;

    return {
        isHeavyCart,
        estimatedWeightKg,
        lockerDisabled: isHeavyCart,
        heavyReason: isHeavyCart
            ? `Krepšelyje yra stambiagabaritės įrangos (~${estimatedWeightKg} kg > 30 kg ribos). Paštomatas negalimas – pasirinkite atsiėmimą Kauno sandėlyje arba kurjerį su hidrauliniu liftu.`
            : null,
    };
}

export function calculateDeliveryCostEur(
    method: CheckoutDeliveryMethod,
    subtotalGrossEur: number,
    isHeavyCart: boolean,
): number {
    if (method === 'pickup') return 0;
    if (method === 'locker' && !isHeavyCart) {
        return subtotalGrossEur >= 150 ? 0 : 3.49;
    }
    return subtotalGrossEur >= 600 ? 0 : 29.0;
}

type FieldErrors = Partial<
    Record<
        'vardas' | 'pavarde' | 'email' | 'telefonas' | 'adresas' | 'miestas' | 'pastoKodas',
        string
    >
>;

// R2 guest checkout (LT path /atsiskaitymas): single form + order summary
// -> POST /admin/api/public/orders (server-side prices) -> /uzsakyma-gauta.
export function CheckoutForm({ storeSlug }: { storeSlug: string }) {
    const t = useTranslations();
    const hydrated = useCartHydration();
    const items = useCartStore((s) => s.items);
    const clearCart = useCartStore((s) => s.clearCart);
    const [errors, setErrors] = useState<FieldErrors>({});
    const [serverError, setServerError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const router = useRouter();

    const deliveryEval = evaluateCheckoutDeliveryOptions(items);
    const [deliveryMethod, setDeliveryMethod] = useState<CheckoutDeliveryMethod>(
        deliveryEval.lockerDisabled ? 'freight' : 'locker',
    );
    const [selectedCarrier, setSelectedCarrier] = useState<BalticCarrierId | 'all'>('omniva');
    const [lockerSearchQuery, setLockerSearchQuery] = useState<string>('Kaunas');
    const [selectedTerminalCode, setSelectedTerminalCode] = useState<string>('LT-OMN-KAU-001');
    const [lockerTerminal, setLockerTerminal] = useState(
        '[LT-OMN-KAU-001] Omniva · Kaunas · Kauno Hyper Maxima Savanorių pr. 255 (LT-50150)',
    );
    const [paymentMethod, setPaymentMethod] = useState<CheckoutPaymentMethod>('montonio_paysera');

    const matchingTerminals = searchParcelTerminals(selectedCarrier, lockerSearchQuery);
    const activeTerminal =
        BALTIC_PARCEL_TERMINALS.find((t) => t.code === selectedTerminalCode) ||
        matchingTerminals[0] ||
        BALTIC_PARCEL_TERMINALS[0]!;

    useEffect(() => {
        if (deliveryEval.lockerDisabled && deliveryMethod === 'locker') {
            setDeliveryMethod('freight');
        }
    }, [deliveryEval.lockerDisabled, deliveryMethod]);

    const itemsGrossCents = Math.round(items.reduce((sum, i) => sum + i.price * 100 * i.quantity, 0));
    const itemsSubtotalEur = itemsGrossCents / 100;
    const deliveryCostEur = calculateDeliveryCostEur(
        deliveryMethod,
        itemsSubtotalEur,
        deliveryEval.isHeavyCart,
    );
    const grossCents = itemsGrossCents + Math.round(deliveryCostEur * 100);
    const netCents = netFromGrossCents(grossCents, DEFAULT_VAT_RATE);
    const vatCents = Math.max(0, grossCents - netCents);
    const subtotal = grossCents / 100;
    const subtotalNet = netCents / 100;
    const vatAmount = vatCents / 100;

    function validate(form: HTMLFormElement): FieldErrors {
        const data = new FormData(form);
        const next: FieldErrors = {};
        if (!String(data.get('vardas') || '').trim()) next.vardas = 'Įrašykite vardą';
        if (!String(data.get('pavarde') || '').trim()) next.pavarde = 'Įrašykite pavardę';
        const email = String(data.get('email') || '').trim();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = 'Įrašykite tikrą el. pašto adresą';
        const phone = String(data.get('telefonas') || '').replace(/[\s()-]/g, '');
        if (!/^\+?\d{8,15}$/.test(phone)) next.telefonas = 'Įrašykite teisingą telefono numerį';
        if (!String(data.get('adresas') || '').trim()) next.adresas = 'Įrašykite pristatymo adresą';
        if (!String(data.get('miestas') || '').trim()) next.miestas = 'Įrašykite miestą';
        const zip = String(data.get('pastoKodas') || '').trim();
        if (!/^\d{4,10}$/.test(zip)) next.pastoKodas = 'Įrašykite pašto kodą';
        return next;
    }

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setServerError(null);
        const form = e.currentTarget;
        const fieldErrors = validate(form);
        setErrors(fieldErrors);
        if (Object.keys(fieldErrors).length > 0) {
            const firstKey = Object.keys(fieldErrors)[0];
            form.querySelector<HTMLElement>(`[name="${firstKey}"]`)?.focus();
            return;
        }
        const data = new FormData(form);
        setSubmitting(true);
        try {
            const result = await submitOrder({
                items: items.map((i) => ({ productId: i.variantId || i.id, quantity: i.quantity })),
                email: String(data.get('email')),
                name: `${String(data.get('vardas')).trim()} ${String(data.get('pavarde')).trim()}`.trim(),
                address: String(data.get('adresas')).trim(),
                city: String(data.get('miestas')).trim(),
                postalCode: String(data.get('pastoKodas')).trim(),
                country: 'LT',
                phone: String(data.get('telefonas')).trim(),
                storeSlug,
            });
            clearCart();
            router.push(`/uzsakyma-gauta?uzsakymoNr=${encodeURIComponent(result.orderId)}`);
        } catch (err: any) {
            setServerError(err?.message || 'Nepavyko sukurti užsakymo. Bandykite dar kartą.');
            setSubmitting(false);
        }
    }

    const inputCls = (hasError: boolean) =>
        `w-full rounded-[2px] border bg-card px-4 py-3 text-sm outline-none transition-colors focus:ring-2 focus:ring-[var(--ring)] ${
            hasError ? 'border-[var(--data-error)]' : 'border-border'
        }`;

    if (!hydrated) {
        return <div className="h-64 rounded-[2px] bg-[var(--muted)]" aria-busy="true" />;
    }

    if (items.length === 0 && !submitting) {
        return (
            <div className="space-y-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                        {
                            src: '/images/products/giles-studio-01-mpb-nani-35-50.webp',
                            alt: 'Megatherm MPB NANI 35 granulių degiklis',
                            label: 'Kurjeris su hidrauliniu liftu (>30 kg)',
                        },
                        {
                            src: '/images/products/giles-studio-06-gorenje-tiki-zv-100.webp',
                            alt: 'Gorenje Tiki ZV 100 boileris',
                            label: 'Atsiėmimas Kauno sandėlyje (Eigulių g. 21)',
                        },
                        {
                            src: '/images/products/giles-studio-10-danfoss-ra-n.webp',
                            alt: 'Danfoss RA-N termostatinis vožtuvas',
                            label: 'Omniva / DPD / LP Express / Venipak (<30 kg)',
                        },
                        {
                            src: '/images/products/giles-studio-07-haier-super-aqua.webp',
                            alt: 'Haier Super Aqua šilumos siurblys',
                            label: 'Montonio / Paysera / SEPA apmokėjimas',
                        },
                    ].map((card) => (
                        <div
                            key={card.src}
                            className="flex items-center gap-2.5 rounded-[2px] border border-border bg-card p-2.5 text-xs"
                        >
                            <img
                                src={card.src}
                                alt={card.alt}
                                width={48}
                                height={48}
                                className="h-12 w-12 rounded-[2px] object-contain bg-white p-1 border border-border shrink-0"
                            />
                            <span className="font-semibold text-foreground leading-snug">
                                {card.label}
                            </span>
                        </div>
                    ))}
                </div>
                <div className="text-center py-12 border border-border bg-card rounded-[2px]">
                    <ShoppingCart className="w-14 h-14 text-muted-foreground/40 mx-auto mb-4" strokeWidth={1.5} aria-hidden="true" />
                    <p className="text-xl font-semibold mb-2">{t('cartPage.empty')}</p>
                    <p className="text-muted-foreground mb-6">{t('cartPage.emptyDesc')}</p>
                    <Link href="/products" className="inline-flex rounded-[2px] bg-[var(--accent)] px-8 py-3 font-bold text-white transition-colors duration-150 hover:bg-[var(--accent-hover)]">
                        {t('cartPage.goCatalog')}
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
            <form onSubmit={handleSubmit} noValidate className="space-y-5">
                <fieldset
                    data-testid="checkout-delivery-selector"
                    className="rounded-[2px] border border-border bg-card p-6 space-y-3"
                >
                    <legend className="px-2 font-display text-lg font-bold">
                        1. Pristatymo ir atsiėmimo būdas (~{deliveryEval.estimatedWeightKg} kg)
                    </legend>
                    {deliveryEval.heavyReason && (
                        <p className="rounded-[2px] border border-[#C2410C] bg-[#FAF9F6] px-3.5 py-2.5 text-xs font-semibold text-[#8A2F07]">
                            {deliveryEval.heavyReason}
                        </p>
                    )}
                    <div className="grid gap-2.5">
                        <label
                            data-testid="delivery-method-pickup"
                            className={`flex items-start gap-3 rounded-[2px] border p-3.5 cursor-pointer text-xs sm:text-sm ${
                                deliveryMethod === 'pickup'
                                    ? 'border-[#C2410C] bg-[#FAF9F6]'
                                    : 'border-border bg-card'
                            }`}
                        >
                            <input
                                type="radio"
                                name="deliveryMethod"
                                value="pickup"
                                checked={deliveryMethod === 'pickup'}
                                onChange={() => setDeliveryMethod('pickup')}
                                className="mt-1"
                            />
                            <div className="space-y-0.5">
                                <span className="font-bold text-foreground inline-flex items-center gap-1.5">
                                    <Warehouse className="w-4 h-4 text-[#C2410C]" />
                                    Atsiėmimas Kauno sandėlyje (Eigulių g. 21, LT-51418 Kaunas) – 0,00 € (Paruošiama per 2–4 d. val.)
                                </span>
                                <span className="block text-xs text-muted-foreground">
                                    Nemokamas pakrovimas autokrautuvu į jūsų mikroautobusą ar priekabą.
                                </span>
                            </div>
                        </label>

                        <label
                            data-testid="delivery-method-locker"
                            className={`flex items-start gap-3 rounded-[2px] border p-3.5 text-xs sm:text-sm ${
                                deliveryEval.lockerDisabled
                                    ? 'border-border bg-muted/40 opacity-60 cursor-not-allowed'
                                    : deliveryMethod === 'locker'
                                      ? 'border-[#C2410C] bg-[#FAF9F6] cursor-pointer'
                                      : 'border-border bg-card cursor-pointer'
                            }`}
                        >
                            <input
                                type="radio"
                                name="deliveryMethod"
                                value="locker"
                                disabled={deliveryEval.lockerDisabled}
                                checked={deliveryMethod === 'locker'}
                                onChange={() => setDeliveryMethod('locker')}
                                className="mt-1"
                            />
                            <div className="space-y-1.5 flex-1">
                                <span className="font-bold text-foreground inline-flex items-center gap-1.5">
                                    <PackageCheck className="w-4 h-4 text-[#C2410C]" />
                                    Paštomatas Omniva / DPD / LP Express / Venipak (smulkioms detalėms ir vožtuvams iki 30 kg) – 3,49 € (Nemokamai nuo 150 €)
                                </span>
                                {!deliveryEval.lockerDisabled && deliveryMethod === 'locker' && (
                                    <div
                                        data-testid="checkout-terminal-picker"
                                        onClick={(e) => e.stopPropagation()}
                                        className="mt-2 space-y-2 rounded-[2px] border border-border bg-white p-3 text-xs text-foreground"
                                    >
                                        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Vežėjo pasirinkimas">
                                            <button
                                                type="button"
                                                onClick={() => setSelectedCarrier('all')}
                                                className={`rounded-[2px] border px-2.5 py-1 font-semibold transition-colors ${
                                                    selectedCarrier === 'all'
                                                        ? 'border-[#C2410C] bg-[#C2410C] text-white'
                                                        : 'border-border bg-card text-foreground'
                                                }`}
                                            >
                                                Visi ({BALTIC_PARCEL_TERMINALS.length})
                                            </button>
                                            {BALTIC_CARRIER_OPTIONS.map((c) => (
                                                <button
                                                    key={c.id}
                                                    type="button"
                                                    data-testid={`carrier-filter-${c.id}`}
                                                    onClick={() => setSelectedCarrier(c.id)}
                                                    className={`rounded-[2px] border px-2.5 py-1 font-semibold transition-colors ${
                                                        selectedCarrier === c.id
                                                            ? 'border-[#C2410C] bg-[#C2410C] text-white'
                                                            : 'border-border bg-card text-foreground'
                                                    }`}
                                                >
                                                    {c.label}
                                                </button>
                                            ))}
                                        </div>

                                        <div className="grid gap-2 sm:grid-cols-2">
                                            <input
                                                type="text"
                                                data-testid="checkout-terminal-search"
                                                value={lockerSearchQuery}
                                                onChange={(e) => setLockerSearchQuery(e.target.value)}
                                                placeholder="Ieškoti pagal miestą, gatvę arba kodą (pvz., Kaunas, Savanorių, Kazlų Rūda)..."
                                                className="w-full rounded-[2px] border border-border bg-card px-3 py-2 text-xs text-foreground"
                                            />
                                            <select
                                                data-testid="checkout-terminal-select"
                                                value={activeTerminal.code}
                                                onChange={(e) => {
                                                    const code = e.target.value;
                                                    setSelectedTerminalCode(code);
                                                    const picked = BALTIC_PARCEL_TERMINALS.find(
                                                        (t) => t.code === code,
                                                    );
                                                    if (picked) {
                                                        setLockerTerminal(
                                                            `[${picked.code}] ${picked.carrierLabel} · ${picked.city} · ${picked.address} (${picked.postalCode})`,
                                                        );
                                                    }
                                                }}
                                                className="w-full rounded-[2px] border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground"
                                            >
                                                {(matchingTerminals.length > 0
                                                    ? matchingTerminals
                                                    : BALTIC_PARCEL_TERMINALS
                                                ).map((term) => (
                                                    <option key={term.code} value={term.code}>
                                                        [{term.code}] {term.carrierLabel} – {term.city}, {term.address} ({term.postalCode})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <input
                                            type="hidden"
                                            name="lockerTerminal"
                                            value={lockerTerminal}
                                        />
                                        <p className="text-[11px] text-muted-foreground">
                                            Pasirinktas terminalas: <strong className="text-foreground">{lockerTerminal}</strong> (rasta {matchingTerminals.length} iš {BALTIC_PARCEL_TERMINALS.length} LT paštomatų)
                                        </p>
                                    </div>
                                )}
                            </div>
                        </label>

                        <label
                            data-testid="delivery-method-freight"
                            className={`flex items-start gap-3 rounded-[2px] border p-3.5 cursor-pointer text-xs sm:text-sm ${
                                deliveryMethod === 'freight'
                                    ? 'border-[#C2410C] bg-[#FAF9F6]'
                                    : 'border-border bg-card'
                            }`}
                        >
                            <input
                                type="radio"
                                name="deliveryMethod"
                                value="freight"
                                checked={deliveryMethod === 'freight'}
                                onChange={() => setDeliveryMethod('freight')}
                                className="mt-1"
                            />
                            <div className="space-y-0.5">
                                <span className="font-bold text-foreground inline-flex items-center gap-1.5">
                                    <Truck className="w-4 h-4 text-[#C2410C]" />
                                    Kurjeris / Sunkiasvoris transportas su hidrauliniu liftu (katilams, talpoms, radiatoriams iki durų) – 29,00 € (Nemokamai nuo 600 €)
                                </span>
                                <span className="block text-xs text-muted-foreground">
                                    Pristatymas ant paletės su hidrauliniu bortu ir palečių vežimėliu visoje Lietuvoje per 1–2 d. d.
                                </span>
                            </div>
                        </label>
                    </div>
                </fieldset>

                <fieldset className="rounded-[2px] border border-border bg-card p-6">
                    <legend className="px-2 font-display text-lg font-bold">2. {t('checkoutForm.contactInfo')}</legend>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <label htmlFor="vardas" className="mb-1 block text-sm font-medium">{t('checkoutPage.firstName')}</label>
                            <input id="vardas" name="vardas" autoComplete="given-name" className={inputCls(!!errors.vardas)} aria-invalid={!!errors.vardas} aria-describedby={errors.vardas ? 'vardas-err' : undefined} />
                            {errors.vardas && <p id="vardas-err" role="alert" className="mt-1 text-xs text-[var(--data-error)]">{errors.vardas}</p>}
                        </div>
                        <div>
                            <label htmlFor="pavarde" className="mb-1 block text-sm font-medium">{t('checkoutPage.lastName')}</label>
                            <input id="pavarde" name="pavarde" autoComplete="family-name" className={inputCls(!!errors.pavarde)} aria-invalid={!!errors.pavarde} aria-describedby={errors.pavarde ? 'pavarde-err' : undefined} />
                            {errors.pavarde && <p id="pavarde-err" role="alert" className="mt-1 text-xs text-[var(--data-error)]">{errors.pavarde}</p>}
                        </div>
                        <div>
                            <label htmlFor="email" className="mb-1 block text-sm font-medium">{t('checkoutPage.email')}</label>
                            <input id="email" name="email" type="email" autoComplete="email" className={inputCls(!!errors.email)} aria-invalid={!!errors.email} aria-describedby={errors.email ? 'email-err' : undefined} />
                            {errors.email && <p id="email-err" role="alert" className="mt-1 text-xs text-[var(--data-error)]">{errors.email}</p>}
                        </div>
                        <div>
                            <label htmlFor="telefonas" className="mb-1 block text-sm font-medium">{t('checkoutPage.phone')}</label>
                            <input id="telefonas" name="telefonas" type="tel" autoComplete="tel" placeholder="+370…" className={inputCls(!!errors.telefonas)} aria-invalid={!!errors.telefonas} aria-describedby={errors.telefonas ? 'telefonas-err' : undefined} />
                            {errors.telefonas && <p id="telefonas-err" role="alert" className="mt-1 text-xs text-[var(--data-error)]">{errors.telefonas}</p>}
                        </div>
                    </div>
                </fieldset>

                <fieldset className="rounded-[2px] border border-border bg-card p-6">
                    <legend className="px-2 font-display text-lg font-bold">3. {t('checkout.shippingAddress')}</legend>
                    <div className="grid gap-4">
                        <div>
                            <label htmlFor="adresas" className="mb-1 block text-sm font-medium">{t('checkoutPage.address')}</label>
                            <input id="adresas" name="adresas" defaultValue={deliveryMethod === 'pickup' ? 'Eigulių g. 21 (Sandėlio atsiėmimas)' : ''} autoComplete="street-address" className={inputCls(!!errors.adresas)} aria-invalid={!!errors.adresas} aria-describedby={errors.adresas ? 'adresas-err' : undefined} />
                            {errors.adresas && <p id="adresas-err" role="alert" className="mt-1 text-xs text-[var(--data-error)]">{errors.adresas}</p>}
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <label htmlFor="miestas" className="mb-1 block text-sm font-medium">{t('checkoutPage.city')}</label>
                                <input id="miestas" name="miestas" defaultValue={deliveryMethod === 'pickup' ? 'Kaunas' : ''} autoComplete="address-level2" className={inputCls(!!errors.miestas)} aria-invalid={!!errors.miestas} aria-describedby={errors.miestas ? 'miestas-err' : undefined} />
                                {errors.miestas && <p id="miestas-err" role="alert" className="mt-1 text-xs text-[var(--data-error)]">{errors.miestas}</p>}
                            </div>
                            <div>
                                <label htmlFor="pastoKodas" className="mb-1 block text-sm font-medium">{t('checkoutPage.postalCode')}</label>
                                <input id="pastoKodas" name="pastoKodas" defaultValue={deliveryMethod === 'pickup' ? '51418' : ''} inputMode="numeric" autoComplete="postal-code" className={inputCls(!!errors.pastoKodas)} aria-invalid={!!errors.pastoKodas} aria-describedby={errors.pastoKodas ? 'pastoKodas-err' : undefined} />
                                {errors.pastoKodas && <p id="pastoKodas-err" role="alert" className="mt-1 text-xs text-[var(--data-error)]">{errors.pastoKodas}</p>}
                            </div>
                        </div>
                    </div>
                </fieldset>

                <fieldset className="rounded-[2px] border border-border bg-card p-6 space-y-2.5">
                    <legend className="px-2 font-display text-lg font-bold inline-flex items-center gap-1.5">
                        <CreditCard className="w-4 h-4 text-[#C2410C]" />
                        4. Apmokėjimo būdas ir PVM sąskaita
                    </legend>
                    <div className="grid gap-2 text-xs sm:text-sm">
                        {[
                            {
                                id: 'montonio_paysera' as const,
                                label: 'El. bankininkystė Montonio / Paysera (Swedbank, SEB, Luminor, Revolut)',
                            },
                            {
                                id: 'bank_transfer' as const,
                                label: 'Bankinis pavedimas / Išankstinė sąskaita (PVM sąskaita faktūra el. paštu)',
                            },
                            {
                                id: 'b2b_deferred' as const,
                                label: 'B2B Mokėjimo atidėjimas pagal sutartį (registruotiems montuotojams ir rangovams)',
                            },
                        ].map((pm) => (
                            <label
                                key={pm.id}
                                className={`flex items-center gap-3 rounded-[2px] border p-3 cursor-pointer ${
                                    paymentMethod === pm.id
                                        ? 'border-[#C2410C] bg-[#FAF9F6] font-semibold'
                                        : 'border-border bg-card'
                                }`}
                            >
                                <input
                                    type="radio"
                                    name="paymentMethod"
                                    value={pm.id}
                                    checked={paymentMethod === pm.id}
                                    onChange={() => setPaymentMethod(pm.id)}
                                />
                                <span>{pm.label}</span>
                            </label>
                        ))}
                    </div>
                </fieldset>

                {serverError && (
                    <p role="alert" className="rounded-[2px] border border-[var(--data-error)] bg-muted p-4 text-sm text-[var(--data-error)]">
                        {serverError}
                    </p>
                )}

                <button
                    type="submit"
                    disabled={submitting}
                    className="w-full rounded-[2px] bg-[var(--accent)] px-6 py-4 text-base font-bold text-white transition-colors duration-150 hover:bg-[var(--accent-hover)] disabled:cursor-wait disabled:opacity-60"
                >
                    {submitting ? 'Siunčiama…' : `Patvirtinti užsakymą – ${formatEur(subtotal)}`}
                </button>
                <p className="text-center text-xs text-muted-foreground">
                    Spausdami „Patvirtinti užsakymą“ sutinkate su{' '}
                    <Link href="/legal/terms" className="underline underline-offset-2 hover:text-foreground">
                        {t('checkoutForm.saleTerms')}
                    </Link>
                    {t('checkoutForm.paymentNote')}
                </p>
            </form>

            <aside className="h-fit rounded-[2px] border border-border bg-card p-6 lg:sticky lg:top-24">
                <h2 className="font-display text-xl font-bold mb-4">{t('checkoutPage.yourOrder')}</h2>
                <ul className="space-y-3 text-sm font-mono">
                    {items.map((i) => (
                        <li key={i.id} className="flex justify-between gap-3">
                            <span className="text-muted-foreground">
                                {i.sku ? `[${i.sku}] ` : ''}{i.name} × {i.quantity}
                            </span>
                            <span className="font-semibold whitespace-nowrap tabular-nums">{formatEur(i.price * i.quantity)}</span>
                        </li>
                    ))}
                </ul>
                <dl className="mt-4 space-y-2 border-t border-border pt-4 text-sm font-mono">
                    <div className="flex justify-between">
                        <dt className="text-muted-foreground">Pristatymas:</dt>
                        <dd className="font-semibold tabular-nums">
                            {deliveryCostEur === 0 ? '0,00 € (Nemokamai)' : formatEur(deliveryCostEur)}
                        </dd>
                    </div>
                    <div className="flex justify-between">
                        <dt className="text-muted-foreground">Suma be PVM:</dt>
                        <dd className="font-semibold tabular-nums">{formatEur(subtotalNet)}</dd>
                    </div>
                    <div className="flex justify-between">
                        <dt className="text-muted-foreground">PVM ({DEFAULT_VAT_RATE}%):</dt>
                        <dd className="font-semibold tabular-nums">{formatEur(vatAmount)}</dd>
                    </div>
                    <div className="flex justify-between border-t border-border pt-2 text-base">
                        <dt className="font-bold">{t('checkoutForm.total')} (su PVM)</dt>
                        <dd className="font-bold tabular-nums">{formatEur(subtotal)}</dd>
                    </div>
                </dl>
                <p className="mt-4 rounded-[2px] border border-border bg-muted/60 p-3 text-xs text-muted-foreground leading-relaxed">
                    B2B / B2C PVM sąskaita faktūra atsiunčiama el. paštu kartu su užsakymo patvirtinimu.
                </p>
                <ul className="mt-4 space-y-2 text-xs text-muted-foreground">
                    <li>{t('orderReceived.ship')}</li>
                    <li>{t('orderReceived.returns')}</li>
                    <li>{t('orderReceived.secure')}</li>
                </ul>
            </aside>
        </div>
    );
}
