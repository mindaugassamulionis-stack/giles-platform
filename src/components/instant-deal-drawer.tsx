'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '../store/cart';
import { openVytautasWithContext } from '../lib/customer-journey-tracker';
import type { AppLocale } from '../i18n/routing';
import {
    BOILER_RENTAL_ADDONS,
    BOILER_RENTAL_POWER_OPTIONS,
    BOILER_RENTAL_TERMS,
    buildDealRef,
    buildProformaRef,
    calculateBoilerRentalDeal,
    type RentalPowerOption,
} from '../lib/instant-deal-config';

export const INSTANT_DEAL_EVENT = 'giles:open-instant-deal';

export interface InstantDealItem {
    sku: string;
    title: string;
    priceNetEur: number;
    vatIncl?: boolean;
  details?: string[];
    productIdPath?: string;
}

interface DealCopy {
    title: string;
    lead: string;
    stepPower: string;
    stepTerm: string;
    stepAddons: string;
    monthly: string;
    discount: string;
    addonsLabel: string;
    totalNet: string;
    vat: string;
    totalGross: string;
    addToCart: string;
    addToCartSub: string;
    instantContract: string;
    instantContractSub: string;
    consultVytautas: string;
    consultVytautasSub: string;
    formCompany: string;
    formPhone: string;
    formCity: string;
    formSubmit: string;
    confirmationTitle: string;
    printSummary: string;
    closeDeal: string;
    close: string;
    drawerOrder: string;
    drawerPriceNote: string;
    monthsLabel: string;
}

export const DEAL_COPY: Record<AppLocale, DealCopy> = {
    lt: {
        title: 'Mobilios katilinės nuomos sandorio konfigūratorius',
        lead: 'Sukonfigūruokite sandorį – kaina matoma iškart, įkainota be PVM, PVM 21% paskaičiuojamas eilutėje.',
        stepPower: '1. Pasirinkite mobilios katilinės galią',
        stepTerm: '2. Nuomos trukmė ir tarifas',
        stepAddons: '3. Papildomi mazgai į sandorį',
        monthly: 'Nuoma per mėnesį',
        discount: 'Sezono nuolaida',
        addonsLabel: 'Papildomi mazgai (vienkartiniai mokesčiai)',
        totalNet: 'Iš viso be PVM',
        vat: 'PVM 21%',
        totalGross: 'Iš viso su PVM',
        addToCart: 'Įtraukti į krepšelį',
        addToCartSub: 'Sąskaita paruošiama atsiskaitymo žingsnyje',
        instantContract: 'Gauti pasirašomą nuomos sutartį ir sąmatą',
        instantContractSub: 'Sandorio rezervacija GILE-DEAL-... su spausdinama santrauka',
        consultVytautas: 'Klausti AI asistento',
        consultVytautasSub: 'Pokalbis atsidarys su jūsų pasirinkta katiline ir galia',
        formCompany: 'Įmonė arba vardas',
        formPhone: 'Telefonas',
        formCity: 'Objekto miestas',
        formSubmit: 'Rezervuoti ir gauti sutartį',
        confirmationTitle: 'Sandorio rezervacijos patvirtinimas',
        printSummary: 'Spausdinti santrauką',
        closeDeal: 'Uždaryti sandorio langą',
        close: 'Uždaryti',
        drawerOrder: 'Momentinis sandoris',
        drawerPriceNote: 'Kaina su PVM, jei nurodyta kitaip',
        monthsLabel: 'Mėnesių skaičius',
    },
    en: {
        title: 'Mobile boiler rental deal configurator',
        lead: 'Configure the deal – the price is shown immediately, quoted ex VAT with 21% VAT on its own line.',
        stepPower: '1. Choose the mobile boiler power',
        stepTerm: '2. Rental term and rate',
        stepAddons: '3. Additional modules in the deal',
        monthly: 'Rent per month',
        discount: 'Season discount',
        addonsLabel: 'Additional modules (one-off fees)',
        totalNet: 'Total ex VAT',
        vat: 'VAT 21%',
        totalGross: 'Total incl VAT',
        addToCart: 'Add to cart',
        addToCartSub: 'The proforma is prepared at the checkout step',
        instantContract: 'Get a signable rental contract and quote',
        instantContractSub: 'Deal reservation GILE-DEAL-... with a printable summary',
        consultVytautas: 'Ask the AI assistant',
        consultVytautasSub: 'The chat opens with your chosen boiler and power',
        formCompany: 'Company or name',
        formPhone: 'Phone',
        formCity: 'Object city',
        formSubmit: 'Reserve the deal',
        confirmationTitle: 'Deal reservation confirmation',
        printSummary: 'Print summary',
        closeDeal: 'Close deal dialog',
        close: 'Close',
        drawerOrder: 'Instant deal',
        drawerPriceNote: 'Price incl VAT unless stated otherwise',
        monthsLabel: 'Number of months',
    },
    pl: {
        title: 'Konfigurator wynajmu mobilnej kotłowni',
        lead: 'Skonfiguruj umowę – cena widoczna od razu, bez VAT, VAT 21% w osobnej linii.',
        stepPower: '1. Wybierz moc mobilnej kotłowni',
        stepTerm: '2. Czas i taryfa wynajmu',
        stepAddons: '3. Dodatkowe moduły do umowy',
        monthly: 'Najem miesięcznie',
        discount: 'Zniżka sezonowa',
        addonsLabel: 'Moduły dodatkowe (opłaty jednorazowe)',
        totalNet: ' Razem bez VAT',
        vat: 'VAT 21%',
        totalGross: 'Razem z VAT',
        addToCart: 'Dodaj do koszyka',
        addToCartSub: 'Faktura pro forma przygotowywana na kroku płatności',
        instantContract: 'Podpisana umowa najmu i wycena',
        instantContractSub: 'Rezerwacja umowy GILE-DEAL-... z podsumowaniem do druku',
        consultVytautas: 'Zapytaj asystenta AI',
        consultVytautasSub: 'Czat otworzy się z wybraną kotłownią i mocą',
        formCompany: 'Firma lub imię',
        formPhone: 'Telefon',
        formCity: 'Miasto obiektu',
        formSubmit: 'Zarezerwuj umowę',
        confirmationTitle: 'Potwierdzenie rezerwacji umowy',
        printSummary: 'Drukuj podsumowanie',
        closeDeal: 'Zamknij okno umowy',
        close: 'Zamknij',
        drawerOrder: 'Natychmiastowa umowa',
        drawerPriceNote: 'Cena z VAT, chyba że wskazano inaczej',
        monthsLabel: 'Liczba miesięcy',
    },
    ru: {
        title: 'Конфигуратор аренды мобильной котельной',
        lead: 'Настройте сделку – цена видна сразу, без НДС, НДС 21% отдельной строкой.',
        stepPower: '1. Выберите мощность мобильной котельной',
        stepTerm: '2. Срок и тариф аренды',
        stepAddons: '3. Дополнительные узлы в сделку',
        monthly: 'Аренда в месяц',
        discount: 'Сезонная скидка',
        addonsLabel: 'Дополнительные узлы (разовые платежи)',
        totalNet: 'Итого без НДС',
        vat: 'НДС 21%',
        totalGross: 'Итого с НДС',
        addToCart: 'В корзину',
        addToCartSub: 'Счёт-проформа готовится на шаге оплаты',
        instantContract: 'Подписываемый договор аренды и смета',
        instantContractSub: 'Резервирование сделки GILE-DEAL-... со сводкой для печати',
        consultVytautas: 'Спросить ИИ-ассистента',
        consultVytautasSub: 'Чат откроется с выбранной котельной и мощностью',
        formCompany: 'Компания или имя',
        formPhone: 'Телефон',
        formCity: 'Город объекта',
        formSubmit: 'Забронировать сделку',
        confirmationTitle: 'Подтверждение резервирования сделки',
        printSummary: 'Печать сводки',
        closeDeal: 'Закрыть окно сделки',
        close: 'Закрыть',
        drawerOrder: 'Мгновенная сделка',
        drawerPriceNote: 'Цена с НДС, если не указано иное',
        monthsLabel: 'Число месяцев',
    },
};

export function formatDealEur(n: number): string {
    return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

function useDealActions(locale: AppLocale) {
    const router = useRouter();
    const addItem = useCartStore((s) => s.addItem);
    const items = useCartStore((s) => s.items);

    const addAndCheckout = React.useCallback(
        (item: { sku: string; title: string; price: number; productIdPath?: string }) => {
            addItem({
                id: item.sku,
                productId: item.productIdPath || '/parduotuve',
                name: item.title,
                price: item.price,
                quantity: 1,
                sku: item.sku,
            });
            const ref = buildProformaRef(items.length);
            try {
                window.sessionStorage.setItem('giles_proforma_ref', ref);
            } catch {
                // sessionStorage gali būti neprieinamas
            }
            router.push(`/${locale}/atsiskaitymas`);
        },
        [addItem, items.length, locale, router],
    );

    return { addAndCheckout };
}

async function submitDealLead(params: {
    title: string;
    sku: string;
    totalNetEur: number;
    name: string;
    phone: string;
    city: string;
    details: string[];
}): Promise<string> {
    const ref = buildDealRef();
    const summary = `${params.title} · ${params.sku} · ${formatDealEur(params.totalNetEur)} € be PVM`;
    const failures: unknown[] = [];
    await Promise.allSettled([
        fetch('/api/admin/support', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: `Sandoris ${ref}: ${summary}`,
                ticketType: 'Pardavimo sandoris (nuoma arba komplektas)',
                priority: 'PLANINIS',
                clientName: params.name,
                clientPhone: params.phone,
                serialNumber: params.sku,
            }),
        }).catch((e) => failures.push(e)),
        fetch('/api/b2b', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'request_cart_quote',
                partnerId: 'giles-deal-flow',
                notes: `${ref} · ${params.city} · ${params.details.join(' | ')}`,
                items: [{ sku: params.sku, title: params.title, quantity: 1, unitPrice: params.totalNetEur }],
                contact: { name: params.name, phone: params.phone, city: params.city },
            }),
        }).catch((e) => failures.push(e)),
    ]);
    return ref;
}

export function BoilerRentalDealFlow({
    locale,
    defaultPowerCode = 'GK-500M',
    id = 'nuomos-sandoris',
}: {
    locale: AppLocale;
    defaultPowerCode?: RentalPowerOption['code'];
    id?: string;
}) {
    const copy = DEAL_COPY[locale];
    const { addAndCheckout } = useDealActions(locale);
    const [powerCode, setPowerCode] = useState<RentalPowerOption['code']>(defaultPowerCode);
    const [termId, setTermId] = useState<'emergency' | 'monthly' | 'season'>('monthly');
    // W124-A1 (F3.2): mėnesiai pasirenkami 1–12 (mėnesinei) arba 4–7 (sezono).
    const [months, setMonths] = useState<number>(1);
    const [addons, setAddons] = useState({ hoses: false, delivery: false, pellets: false });
    const [formOpen, setFormOpen] = useState(false);
    const [company, setCompany] = useState('');
    const [phone, setPhone] = useState('');
    const [city, setCity] = useState('');
    const [dealRef, setDealRef] = useState<string | null>(null);
    const [sending, setSending] = useState(false);

    const activeTerm = BOILER_RENTAL_TERMS.find((t) => t.id === termId) ?? BOILER_RENTAL_TERMS[1];
    const monthsLocked = activeTerm.monthsMin === activeTerm.monthsMax;
    const effectiveMonths = monthsLocked ? activeTerm.months : Math.min(activeTerm.monthsMax, Math.max(activeTerm.monthsMin, months));

    const deal = useMemo(
        () => calculateBoilerRentalDeal({ powerCode, termId, months: effectiveMonths, addons }),
        [powerCode, termId, effectiveMonths, addons],
    );

    async function handleContractSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (company.trim().length < 2 || phone.trim().length < 5) return;
        setSending(true);
        const ref = await submitDealLead({
            title: deal.title,
            sku: deal.sku,
            totalNetEur: deal.totalNetEur,
            name: company.trim(),
            phone: phone.trim(),
            city: city.trim() || 'Nenurodyta',
            details: [deal.termSub, ...deal.addons.map((a) => a.label)],
        });
        setDealRef(ref);
        setSending(false);
    }

    return (
        <section
            id={id}
            data-testid="boiler-rental-deal-flow"
            className="scroll-mt-24 bg-[#F5F3EE] py-7 sm:py-16"
            aria-labelledby="rental-deal-title"
        >
            <div className="mx-auto max-w-6xl px-4">
                <div className="max-w-2xl">
                    <p className="text-xs font-bold text-[#C2410C]">NUOMA · SANDORIO KONFIGURATORIUS</p>
                    <h2 id="rental-deal-title" className="mt-2 text-2xl sm:text-3xl font-extrabold text-[#11161B] leading-tight">
                        {copy.title}
                    </h2>
                    <p className="mt-2 text-sm text-[#5B6470] leading-relaxed">{copy.lead}</p>
                </div>

                <div className="mt-6 grid gap-4 max-sm:gap-3 lg:gap-6 lg:grid-cols-[1fr_360px] items-start">
                    <div className="space-y-4 max-sm:space-y-3 sm:space-y-6">
                        <fieldset>
                            <legend className="text-sm font-bold text-[#11161B]">{copy.stepPower}</legend>
                            <div className="mt-3 grid gap-2 max-sm:grid-cols-1 sm:grid-cols-3" role="radiogroup" aria-label={copy.stepPower}>
                                {BOILER_RENTAL_POWER_OPTIONS.map((p) => {
                                    const active = p.code === powerCode;
                                    return (
                                        <button
                                            key={p.code}
                                            type="button"
                                            role="radio"
                                            aria-checked={active}
                                            data-testid={`rental-power-${p.code.toLowerCase()}`}
                                            onClick={() => setPowerCode(p.code)}
                                            className={`text-left rounded-lg border px-4 py-3 max-sm:min-h-[64px] min-h-[76px] transition-colors cursor-pointer ${
                                                active
                                                    ? 'border-2 border-[#C2410C] bg-white'
                                                    : 'border border-[#D5CFC3] bg-transparent hover:border-[#11161B]'
                                            }`}
                                        >
                                            <span className="block font-extrabold text-[#11161B] text-sm">{p.label}</span>
                                            <span className="block text-xs text-[#5B6470] mt-1">{p.sub}</span>
                                            <span className="block text-xs font-semibold text-[#11161B] mt-1">
                                                {formatDealEur(p.baseNetEurMonth)} €/mėn. be PVM
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </fieldset>

                        <fieldset>
                            <legend className="text-sm font-bold text-[#11161B]">{copy.stepTerm}</legend>
                            <div className="mt-3 grid gap-2 sm:grid-cols-3" role="radiogroup" aria-label={copy.stepTerm}>
                                {BOILER_RENTAL_TERMS.map((t) => {
                                    const active = t.id === termId;
                                    return (
                                        <button
                                            key={t.id}
                                            type="button"
                                            role="radio"
                                            aria-checked={active}
                                            data-testid={`rental-term-${t.id}`}
                                            onClick={() => setTermId(t.id)}
                                            className={`text-left rounded-lg border px-4 py-3 min-h-[64px] transition-colors cursor-pointer ${
                                                active
                                                    ? 'border-2 border-[#C2410C] bg-white'
                                                    : 'border border-[#D5CFC3] bg-transparent hover:border-[#11161B]'
                                            }`}
                                        >
                                            <span className="block font-bold text-[#11161B] text-sm leading-snug">{t.label}</span>
                                            <span className="block text-xs text-[#5B6470] mt-1">{t.sub}</span>
                                        </button>
                                    );
                                })}
                            </div>
                            {!monthsLocked && (
                                <div className="mt-3 flex items-center gap-3">
                                    <label htmlFor="rental-months-input" className="text-sm font-semibold text-[#11161B] whitespace-nowrap">
                                        {copy.monthsLabel}
                                    </label>
                                    <input
                                        id="rental-months-input"
                                        type="number"
                                        inputMode="numeric"
                                        data-testid="rental-months"
                                        min={activeTerm.monthsMin}
                                        max={activeTerm.monthsMax}
                                        step={1}
                                        value={effectiveMonths}
                                        onChange={(e) => {
                                            const v = Number(e.target.value);
                                            if (Number.isFinite(v)) setMonths(Math.trunc(v));
                                        }}
                                        className="w-24 rounded-lg border border-[#D5CFC3] px-3 py-2 text-sm font-bold text-[#11161B] tabular-nums focus:outline-none focus:border-[#C2410C]"
                                    />
                                    <span className="text-xs text-[#5B6470]">
                                        {activeTerm.monthsMin}–{activeTerm.monthsMax} mėn.
                                    </span>
                                </div>
                            )}
                        </fieldset>

                        <fieldset>
                            <legend className="text-sm font-bold text-[#11161B]">{copy.stepAddons}</legend>
                            <div className="mt-3 space-y-2">
                                {BOILER_RENTAL_ADDONS.map((a) => (
                                    <label
                                        key={a.id}
                                        data-testid={`rental-addon-${a.id}`}
                                        className={`flex items-start gap-3 rounded-lg border px-4 py-3 cursor-pointer transition-colors ${
                                            addons[a.id as keyof typeof addons]
                                                ? 'border-2 border-[#C2410C] bg-white'
                                                : 'border border-[#D5CFC3] bg-transparent hover:border-[#11161B]'
                                        }`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={addons[a.id as keyof typeof addons]}
                                            onChange={(e) => setAddons((prev) => ({ ...prev, [a.id]: e.target.checked }))}
                                            className="mt-0.5 w-4 h-4 accent-[#C2410C] cursor-pointer"
                                        />
                                        <span className="flex-1 text-sm text-[#2A323B] leading-snug">{a.label}</span>
                                        <span className="text-sm font-bold text-[#11161B] whitespace-nowrap">
                                            {a.netEur > 0 ? `+${formatDealEur(a.netEur)} €` : '0 €'}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </fieldset>
                    </div>
                    <aside data-testid="rental-summary" className="rounded-xl bg-[#11161B] text-[#F5F3EE] p-4 sm:p-6 lg:sticky lg:top-24">
                        <p className="text-xs font-bold text-[#FF8A3D]">{deal.sku}</p>
                        <h3 className="mt-1 text-lg font-extrabold leading-snug">{deal.powerLabel}</h3>
                        <dl className="mt-4 space-y-2 text-sm">
                            <div className="flex justify-between gap-3">
                                <dt className="text-[#A3ADB8]">{copy.monthly}</dt>
                                <dd className="font-bold tabular-nums">{formatDealEur(deal.monthlyNetEur)} €</dd>
                            </div>
                            {deal.discountPct > 0 && (
                                <div className="flex justify-between gap-3">
                                    <dt className="text-[#A3ADB8]">{copy.discount}</dt>
                                    <dd className="font-bold text-[#FF8A3D] tabular-nums">-{deal.discountPct}%</dd>
                                </div>
                            )}
                            {deal.addons.length > 0 && (
                                <div className="flex justify-between gap-3">
                                    <dt className="text-[#A3ADB8]">{copy.addonsLabel}</dt>
                                    <dd className="font-bold tabular-nums">+{formatDealEur(deal.addonsNetEur)} €</dd>
                                </div>
                            )}
                            <div className="flex justify-between gap-3 border-t border-[#2C3742] pt-2">
                                <dt className="text-[#A3ADB8]">{copy.totalNet}</dt>
                                <dd className="font-extrabold tabular-nums text-base">{formatDealEur(deal.totalNetEur)} €</dd>
                            </div>
                            <div className="flex justify-between gap-3">
                                <dt className="text-[#A3ADB8]">{copy.vat}</dt>
                                <dd className="tabular-nums">{formatDealEur(deal.vatEur)} €</dd>
                            </div>
                            <div className="flex justify-between gap-3">
                                <dt className="font-bold">{copy.totalGross}</dt>
                                <dd className="font-extrabold tabular-nums text-[#FF8A3D]">{formatDealEur(deal.totalGrossEur)} €</dd>
                            </div>
                        </dl>

                        <div className="mt-5 space-y-2">
                            {/* W124-A1 (F3.2): tiesioginis apmokėjimas – tik po objekto patvirtinimo,
                                todėl pirminis kelias yra rezervacija su sutartimi, ne krepšelis. */}
                            <p className="text-xs text-[#A3ADB8] text-center">{copy.addToCartSub}</p>

                            {!formOpen && !dealRef && (
                                <button
                                    type="button"
                                    data-testid="deal-submit-instant-contract-btn"
                                    onClick={() => setFormOpen(true)}
                                    className="w-full min-h-[56px] rounded-lg bg-[#C2410C] hover:brightness-110 text-white font-bold text-sm px-4 transition cursor-pointer"
                                >
                                    {copy.instantContract}
                                </button>
                            )}

                            {formOpen && !dealRef && (
                                <form
                                    data-testid="deal-contract-form"
                                    onSubmit={handleContractSubmit}
                                    className="space-y-2 rounded-lg bg-[#1B232C] border border-[#2C3742] p-3"
                                >
                                    <input
                                        type="text"
                                        required
                                        minLength={2}
                                        value={company}
                                        onChange={(e) => setCompany(e.target.value)}
                                        placeholder={copy.formCompany}
                                        aria-label={copy.formCompany}
                                        className="w-full rounded-sm bg-[#0E1216] border border-[#2C3742] px-3 py-2.5 text-sm text-[#F5F3EE] placeholder-[#A3ADB8] focus:outline-none focus:border-[#FF8A3D]"
                                    />
                                    <input
                                        type="tel"
                                        required
                                        minLength={5}
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        placeholder={copy.formPhone}
                                        aria-label={copy.formPhone}
                                        className="w-full rounded-sm bg-[#0E1216] border border-[#2C3742] px-3 py-2.5 text-sm text-[#F5F3EE] placeholder-[#A3ADB8] focus:outline-none focus:border-[#FF8A3D]"
                                    />
                                    <input
                                        type="text"
                                        value={city}
                                        onChange={(e) => setCity(e.target.value)}
                                        placeholder={copy.formCity}
                                        aria-label={copy.formCity}
                                        className="w-full rounded-sm bg-[#0E1216] border border-[#2C3742] px-3 py-2.5 text-sm text-[#F5F3EE] placeholder-[#A3ADB8] focus:outline-none focus:border-[#FF8A3D]"
                                    />
                                    <button
                                        type="submit"
                                        disabled={sending}
                                        className="w-full min-h-[48px] rounded-sm bg-[#F5F3EE] text-[#11161B] font-bold text-sm px-4 hover:bg-white transition cursor-pointer disabled:opacity-60"
                                    >
                                        {copy.formSubmit}
                                    </button>
                                </form>
                            )}

                            {dealRef && (
                                <div
                                    data-testid="deal-reservation-confirmation"
                                    className="rounded-lg bg-[#1B232C] border border-[#2C3742] p-4 text-sm"
                                >
                                    <p className="font-extrabold text-[#FF8A3D]">{copy.confirmationTitle}</p>
                                    <p className="mt-1 font-mono text-xs text-[#F5F3EE]">{dealRef}</p>
                                    <p className="mt-2 text-xs text-[#C9D0D8] leading-relaxed">
                                        {deal.powerLabel} · {deal.termLabel} · {formatDealEur(deal.totalNetEur)} € be PVM
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() => window.print()}
                                        className="mt-3 w-full min-h-[44px] rounded-sm bg-transparent border border-[#F5F3EE] text-[#F5F3EE] font-bold text-xs px-4 hover:bg-[#0E1216] transition cursor-pointer"
                                    >
                                        {copy.printSummary}
                                    </button>
                                </div>
                            )}

                            <button
                                type="button"
                                data-testid="deal-consult-vytautas-btn"
                                onClick={() =>
                                    openVytautasWithContext({
                                        prompt: `Sveiki, aptarkime mobilios katilinės ${deal.powerLabel} nuomą (${deal.termLabel}, ~${formatDealEur(deal.totalNetEur)} € be PVM).`,
                                    })
                                }
                                className="w-full min-h-[48px] rounded-lg bg-transparent text-[#FF8A3D] font-semibold text-sm px-4 underline underline-offset-4 hover:text-[#F5F3EE] transition cursor-pointer"
                            >
                                {copy.consultVytautas}
                            </button>
                        </div>
                    </aside>
                </div>
            </div>
        </section>
    );
}

function DealActions({
    locale,
    sku,
    title,
    totalNetEur,
    totalGrossEur,
    summaryLine,
    details,
    productIdPath,
}: {
    locale: AppLocale;
    sku: string;
    title: string;
    totalNetEur: number;
    totalGrossEur: number;
    summaryLine: string;
    details: string[];
    productIdPath?: string;
}) {
    const copy = DEAL_COPY[locale];
    const { addAndCheckout } = useDealActions(locale);
    const [formOpen, setFormOpen] = useState(false);
    const [company, setCompany] = useState('');
    const [phone, setPhone] = useState('');
    const [city, setCity] = useState('');
    const [dealRef, setDealRef] = useState<string | null>(null);
    const [sending, setSending] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (company.trim().length < 2 || phone.trim().length < 5) return;
        setSending(true);
        const ref = await submitDealLead({
            title,
            sku,
            totalNetEur,
            name: company.trim(),
            phone: phone.trim(),
            city: city.trim() || 'Nenurodyta',
            details,
        });
        setDealRef(ref);
        setSending(false);
    }

    return (
        <div className="space-y-2">
            <button
                type="button"
                data-testid="deal-add-to-cart-and-checkout-btn"
                onClick={() => addAndCheckout({ sku, title, price: totalGrossEur, productIdPath })}
                className="w-full min-h-[56px] rounded-lg bg-[#C2410C] hover:brightness-110 text-white font-bold text-sm px-4 transition cursor-pointer"
            >
                {copy.addToCart}
            </button>
            <p className="text-xs text-[#5B6470] text-center">{copy.addToCartSub}</p>

            {!formOpen && !dealRef && (
                <button
                    type="button"
                    data-testid="deal-submit-instant-contract-btn"
                    onClick={() => setFormOpen(true)}
                    className="w-full min-h-[56px] rounded-lg bg-transparent border border-[#11161B] text-[#11161B] font-bold text-sm px-4 hover:bg-[#F5F3EE] transition cursor-pointer"
                >
                    {copy.instantContract}
                </button>
            )}

            {formOpen && !dealRef && (
                <form data-testid="deal-contract-form" onSubmit={handleSubmit} className="space-y-2 rounded-lg bg-[#F5F3EE] border border-[#E2DDD3] p-3">
                    <input type="text" required minLength={2} value={company} onChange={(e) => setCompany(e.target.value)} placeholder={copy.formCompany} aria-label={copy.formCompany} className="w-full rounded-sm bg-white border border-[#D5CFC3] px-3 py-2.5 text-sm text-[#11161B] placeholder-[#5B6470] focus:outline-none focus:border-[#C2410C]" />
                    <input type="tel" required minLength={5} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={copy.formPhone} aria-label={copy.formPhone} className="w-full rounded-sm bg-white border border-[#D5CFC3] px-3 py-2.5 text-sm text-[#11161B] placeholder-[#5B6470] focus:outline-none focus:border-[#C2410C]" />
                    <input type="text" value={city} onChange={(e) => setCity(e.target.value)} placeholder={copy.formCity} aria-label={copy.formCity} className="w-full rounded-sm bg-white border border-[#D5CFC3] px-3 py-2.5 text-sm text-[#11161B] placeholder-[#5B6470] focus:outline-none focus:border-[#C2410C]" />
                    <button type="submit" disabled={sending} className="w-full min-h-[48px] rounded-sm bg-[#11161B] text-white font-bold text-sm px-4 hover:bg-[#1B232C] transition cursor-pointer disabled:opacity-60">
                        {copy.formSubmit}
                    </button>
                </form>
            )}

            {dealRef && (
                <div data-testid="deal-reservation-confirmation" className="rounded-lg bg-[#11161B] text-[#F5F3EE] p-4 text-sm">
                    <p className="font-extrabold text-[#FF8A3D]">{copy.confirmationTitle}</p>
                    <p className="mt-1 font-mono text-xs">{dealRef}</p>
                    <p className="mt-2 text-xs text-[#C9D0D8] leading-relaxed">{summaryLine}</p>
                    <button type="button" onClick={() => window.print()} className="mt-3 w-full min-h-[44px] rounded-sm bg-transparent border border-[#F5F3EE] text-[#F5F3EE] font-bold text-xs px-4 hover:bg-[#1B232C] transition cursor-pointer">
                        {copy.printSummary}
                    </button>
                </div>
            )}

            <button
                type="button"
                data-testid="deal-consult-vytautas-btn"
                onClick={() => openVytautasWithContext({ prompt: `Sveiki, aptarkime: ${title} (${summaryLine}).` })}
                className="w-full min-h-[48px] rounded-lg bg-transparent text-[#C2410C] font-semibold text-sm px-4 underline underline-offset-4 hover:text-[#11161B] transition cursor-pointer"
            >
                {copy.consultVytautas}
            </button>
        </div>
    );
}

export function InstantDealDrawer({
    locale,
    item,
    open,
    onClose,
}: {
    locale: AppLocale;
    item: InstantDealItem | null;
    open: boolean;
    onClose: () => void;
}) {
    const copy = DEAL_COPY[locale];
    const panelRef = React.useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!open) return;
        panelRef.current?.focus();
        function onKey(e: KeyboardEvent) {
            if (e.key === 'Escape') onClose();
        }
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open, onClose]);

    if (!open || !item) return null;
    const net = item.priceNetEur;
    const gross = item.vatIncl ? net : Math.round(net * 1.21);

    return (
        <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4">
            <button
                type="button"
                aria-label={copy.closeDeal}
                onClick={onClose}
                className="absolute inset-0 w-full h-full bg-black/70 cursor-default"
            />
            <div
                ref={panelRef}
                tabIndex={-1}
                role="dialog"
                aria-modal="true"
                aria-label={copy.drawerOrder}
                data-testid="instant-deal-drawer"
                className="relative w-full sm:max-w-md max-h-[92vh] overflow-y-auto bg-white border border-[#E2DDD3] sm:rounded-xl p-5 outline-none"
            >
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <p className="text-xs font-bold text-[#C2410C]">{copy.drawerOrder}</p>
                        <p className="font-mono text-xs text-[#5B6470] mt-0.5">{item.sku}</p>
                    </div>
                    <button type="button" onClick={onClose} aria-label={copy.close} className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center border border-[#D5CFC3] bg-transparent hover:bg-[#F5F3EE] rounded-sm cursor-pointer text-[#11161B] text-sm font-bold">
                        ×
                    </button>
                </div>
                <h3 className="mt-3 text-lg font-extrabold text-[#11161B] leading-snug">{item.title}</h3>
                {item.details && item.details.length > 0 && (
                    <ul className="mt-2 space-y-1 text-sm text-[#2A323B]">
                        {item.details.map((d) => (
                            <li key={d} className="leading-snug">{d}</li>
                        ))}
                    </ul>
                )}
                <div className="mt-4 flex items-baseline justify-between border-t border-[#E2DDD3] pt-3">
                    <span className="text-xs text-[#5B6470]">{copy.totalGross}</span>
                    <span className="text-2xl font-extrabold text-[#11161B] tabular-nums">{formatDealEur(gross)} €</span>
                </div>
                <p className="text-xs text-[#5B6470] text-right">{copy.totalNet} {formatDealEur(net)} €</p>
                <div className="mt-4">
                    <DealActions
                        locale={locale}
                        sku={item.sku}
                        title={item.title}
                        totalNetEur={net}
                        totalGrossEur={gross}
                        summaryLine={`${formatDealEur(net)} € be PVM · ${item.title}`}
                        details={item.details || []}
                        productIdPath={item.productIdPath}
                    />
                </div>
            </div>
        </div>
    );
}

export function openInstantDeal(item: InstantDealItem): void {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new CustomEvent<InstantDealItem>(INSTANT_DEAL_EVENT, { detail: item }));
}

export function InstantDealDrawerMount({ locale }: { locale: AppLocale }) {
    const [item, setItem] = useState<InstantDealItem | null>(null);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        function handler(e: Event) {
            const custom = e as CustomEvent<InstantDealItem>;
            if (!custom.detail) return;
            setItem(custom.detail);
            setOpen(true);
        }
        window.addEventListener(INSTANT_DEAL_EVENT, handler);
        return () => window.removeEventListener(INSTANT_DEAL_EVENT, handler);
    }, []);

    return <InstantDealDrawer locale={locale} item={item} open={open} onClose={() => setOpen(false)} />;
}
