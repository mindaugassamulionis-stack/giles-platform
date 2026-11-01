'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { Paperclip } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { assetUrl } from '../../lib/api';
import { useVatDisplayStore } from '../../store/vat-display';
import type { AppLocale } from '../../i18n/routing';
import {
    FUEL_LABELS_I18N,
    INDUSTRIAL_MODELS_FILE,
    ROI_CONFIG,
    getDefaultPublishEnv,
    getLocalizedIndustrialModels,
    getLocalizedProjects,
    getPramoneiContent,
} from '../../lib/pramonei-v2/data';
import {
    formatDecimal,
    formatEur,
    formatInt,
    formatModelArea,
    formatModelFuel,
    formatModelPower,
    formatModelPriceCell,
    priceLabel,
} from '../../lib/pramonei-v2/format';
import { computeRoi } from '../../lib/pramonei-v2/roi';
import { isEstimate, isPublishable, type IndustrialModel, type Segment } from '../../lib/pramonei-v2/types';
import { BoilerRentalDealFlow, InstantDealDrawerMount } from '../instant-deal-drawer';

export { formatModelArea, formatModelFuel, formatModelPower, formatModelPriceCell };

type FilterSegment = Segment | 'all';

const HERO_GALLERY_THUMBS: Array<{ src: string; code: string; label: Record<AppLocale, string> }> = [
    {
        src: '/studio-assets/projects/giles-darbas-06.webp',
        code: 'GK-500',
        label: {
            lt: 'GK-500 · 500 kW konteinerinė katilinė',
            en: 'GK-500 · 500 kW containerized plant',
            pl: 'GK-500 · kotłownia kontenerowa 500 kW',
            ru: 'GK-500 · контейнерная котельная 500 кВт',
        },
    },
    {
        src: '/studio-assets/projects/giles-darbas-07.webp',
        code: 'GK-750',
        label: {
            lt: 'GK-750 · 750 kW pramoninė katilinė',
            en: 'GK-750 · 750 kW industrial plant',
            pl: 'GK-750 · kotłownia przemysłowa 750 kW',
            ru: 'GK-750 · промышленная котельная 750 кВт',
        },
    },
    {
        src: '/studio-assets/projects/giles-darbas-09.webp',
        code: 'MOB-500',
        label: {
            lt: 'MOB-500 · mobili katilinė nuomai',
            en: 'MOB-500 · mobile rental boiler plant',
            pl: 'MOB-500 · mobilna kotłownia na wynajem',
            ru: 'MOB-500 · мобильная котельная в аренду',
        },
    },
    {
        src: '/studio-assets/projects/giles-darbas-13.webp',
        code: 'GK-250',
        label: {
            lt: 'GK-250 · 250 kW konteinerinė katilinė',
            en: 'GK-250 · 250 kW containerized plant',
            pl: 'GK-250 · kotłownia kontenerowa 250 kW',
            ru: 'GK-250 · контейнерная котельная 250 кВт',
        },
    },
    {
        src: '/studio-assets/projects/giles-darbas-14.webp',
        code: 'BIO-800',
        label: {
            lt: 'BIO-DUJOS-800 · biodujų katilinė',
            en: 'BIO-DUJOS-800 · biogas boiler plant',
            pl: 'BIO-DUJOS-800 · kotłownia biogazowa',
            ru: 'BIO-DUJOS-800 · биогазовая котельная',
        },
    },
];

export function RfqSection({
    locale,
    defaultModelSlug = '',
    defaultMode = 'buy',
    rentalConfiguratorHref = '#nuomos-sandoris',
}: {
    locale: AppLocale;
    defaultModelSlug?: string;
    defaultMode?: 'buy' | 'rent';
    rentalConfiguratorHref?: string;
}) {
    const content = getPramoneiContent(locale);
    const [mode, setMode] = useState<'buy' | 'rent'>(defaultMode);
    const [companyCity, setCompanyCity] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [power, setPower] = useState(content.rfq.fields.power.options[0]);
    // W118-A2: the native file input renders English browser chrome
    // ("Choose Files / No file chosen"); show a locale-aware picker instead.
    const [pickedFileNames, setPickedFileNames] = useState<string[]>([]);
    const [fuel, setFuel] = useState(content.rfq.fields.fuel.options[0]);
    const [modelSlug, setModelSlug] = useState(defaultModelSlug);
    const [website, setWebsite] = useState('');
    const [errors, setErrors] = useState<{
        company_city?: string;
        phone?: string;
        email?: string;
        files?: string;
        server?: string;
    }>({});
    const [submitting, setSubmitting] = useState(false);
    const [sent, setSent] = useState(false);
    const successRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (defaultModelSlug) setModelSlug(defaultModelSlug);
    }, [defaultModelSlug]);

    useEffect(() => {
        if (defaultMode) setMode(defaultMode);
    }, [defaultMode]);

    useEffect(() => {
        if (sent && successRef.current) {
            successRef.current.focus();
        }
    }, [sent]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const nextErrors: typeof errors = {};
        const cleanCompany = companyCity.trim();
        const cleanPhone = phone.trim();
        const cleanEmail = email.trim();

        if (cleanCompany.length < 2 || cleanCompany.length > 120) {
            nextErrors.company_city = content.rfq.errors.required;
        }
        if (!cleanPhone) {
            nextErrors.phone = content.rfq.errors.required;
        } else if (!/^\+?[0-9 ()-]{8,20}$/.test(cleanPhone)) {
            nextErrors.phone = content.rfq.errors.phone;
        }
        if (cleanEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
            nextErrors.email = content.rfq.errors.email;
        }

        if (Object.keys(nextErrors).length > 0) {
            setErrors(nextErrors);
            return;
        }

        setErrors({});
        if (website.trim() !== '') {
            setSent(true);
            return;
        }

        setSubmitting(true);
        try {
            const res = await fetch('/api/rfq', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    topic: 'objekto-projektas',
                    contact: cleanEmail || 'darius.rfq@gilesinzinerija.lt',
                    company: cleanCompany,
                    contextSku: modelSlug || mode,
                    honeypot: website,
                    message: `Pramonei v2 užklausa (${mode}): įmonė=${cleanCompany}, tel=${cleanPhone}, galia=${power}, kuras=${fuel}, modelis=${modelSlug || 'nenurodyta'}`,
                    mode,
                    company_city: cleanCompany,
                    phone: cleanPhone,
                    email: cleanEmail,
                    power,
                    fuel,
                    model: modelSlug || null,
                    source_page: typeof window !== 'undefined' ? window.location.pathname : `/${locale}/pramonei`,
                }),
            });
            if (!res.ok) {
                setErrors({ server: content.rfq.errors.server });
            } else {
                setSent(true);
            }
        } catch {
            setErrors({ server: content.rfq.errors.server });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <section id="industrial-rfq" className="py-12 sm:py-16">
            <div className="mx-auto max-w-7xl px-4 sm:px-6">
                <div className="rounded-2xl bg-[#0E1216] text-[#F5F3EE] p-6 sm:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    <div className="lg:col-span-5 space-y-4">
                        <span className="text-xs font-bold tracking-wider uppercase text-[#FF8A3D] block">
                            {content.rfq.eyebrow}
                        </span>
                        <h2 className="text-2xl sm:text-3xl font-extrabold text-[#F5F3EE] leading-tight text-balance">
                            {content.rfq.title}
                        </h2>
                        <p className="text-sm sm:text-base text-[#C9D0D8] leading-relaxed">
                            {content.rfq.lead}
                        </p>
                        <div className="flex items-center gap-3.5 p-4 rounded-xl bg-[#151C23] border border-[#26313B]">
                            <span className="w-12 h-12 rounded-full bg-[#26313B] flex items-center justify-center font-bold text-base text-[#F5F3EE] shrink-0">
                                D
                            </span>
                            <div className="flex flex-col gap-0.5 text-sm">
                                <span className="font-bold text-[#F5F3EE]">
                                    {content.rfq.contact.name}
                                </span>
                                <a
                                    href="tel:+37061119158"
                                    className="text-[#F5F3EE] hover:text-[#FF8A3D] font-semibold"
                                >
                                    {content.rfq.contact.phone}
                                </a>
                                <span className="text-xs text-[#A3ADB8]">
                                    Servisas:{' '}
                                    <a
                                        href="tel:+37069397098"
                                        className="text-[#F5F3EE] hover:text-[#FF8A3D]"
                                    >
                                        {content.rfq.contact.service_phone}
                                    </a>
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-7">
                        {sent ? (
                            <div
                                ref={successRef}
                                tabIndex={-1}
                                data-testid="rfq-success"
                                className="p-6 rounded-xl bg-[#151C23] border border-[#3FB950] text-[#F5F3EE] space-y-2"
                            >
                                <p className="text-base sm:text-lg font-bold text-[#3FB950]">
                                    {content.rfq.success}
                                </p>
                            </div>
                        ) : (
                            <form
                                data-testid="rfq-form"
                                noValidate
                                onSubmit={handleSubmit}
                                className="space-y-4"
                            >
                                <div className="flex flex-wrap gap-2.5">
                                    <button
                                        type="button"
                                        aria-pressed={mode === 'buy'}
                                        onClick={() => setMode('buy')}
                                        className={`min-h-[44px] px-4 rounded-lg border text-sm font-semibold cursor-pointer transition ${
                                            mode === 'buy'
                                                ? 'border-[#FF8A3D] bg-[#FF8A3D] text-[#0E1216]'
                                                : 'border-[#3A4652] bg-transparent text-[#F5F3EE] hover:border-[#FF8A3D]'
                                        }`}
                                    >
                                        {content.rfq.modes.buy}
                                    </button>
                                    {/* W118-A2: rental intent goes to the W116-A1 configurator,
                                        not a generic RFQ textarea. */}
                                    <a
                                        href={rentalConfiguratorHref}
                                        data-testid="rfq-rent-configurator-link"
                                        aria-current={mode === 'rent' ? 'true' : undefined}
                                        className={`min-h-[44px] px-4 inline-flex items-center rounded-lg border text-sm font-semibold transition ${
                                            mode === 'rent'
                                                ? 'border-[#FF8A3D] bg-[#FF8A3D] text-[#0E1216]'
                                                : 'border-[#3A4652] bg-transparent text-[#F5F3EE] hover:border-[#FF8A3D]'
                                        }`}
                                    >
                                        {content.rfq.modes.rent}
                                    </a>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                    <div className="flex flex-col gap-1.5">
                                        <label
                                            htmlFor="rfq-company-city"
                                            className="text-xs font-semibold text-[#F5F3EE]"
                                        >
                                            {content.rfq.fields.company_city.label} <span aria-hidden="true" className="text-[#F2555A]">*</span>
                                        </label>
                                        <input
                                            id="rfq-company-city"
                                            type="text"
                                            autoComplete="organization"
                                            value={companyCity}
                                            onChange={(e) => setCompanyCity(e.target.value)}
                                            aria-invalid={!!errors.company_city}
                                            aria-describedby={
                                                errors.company_city
                                                    ? 'rfq-company-city-error'
                                                    : undefined
                                            }
                                            className="h-[46px] px-3 rounded-lg border border-[#3A4652] bg-[#151C23] text-white text-sm"
                                        />
                                        {errors.company_city && (
                                            <span
                                                id="rfq-company-city-error"
                                                className="text-xs text-[#F2555A]"
                                            >
                                                {errors.company_city}
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex flex-col gap-1.5">
                                        <label
                                            htmlFor="rfq-phone"
                                            className="text-xs font-semibold text-[#F5F3EE]"
                                        >
                                            {content.rfq.fields.phone.label} <span aria-hidden="true" className="text-[#F2555A]">*</span>
                                        </label>
                                        <input
                                            id="rfq-phone"
                                            type="tel"
                                            autoComplete="tel"
                                            placeholder={content.rfq.fields.phone.placeholder}
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            aria-invalid={!!errors.phone}
                                            aria-describedby={
                                                errors.phone ? 'rfq-phone-error' : undefined
                                            }
                                            className="h-[46px] px-3 rounded-lg border border-[#3A4652] bg-[#151C23] text-white text-sm"
                                        />
                                        {errors.phone && (
                                            <span
                                                id="rfq-phone-error"
                                                className="text-xs text-[#F2555A]"
                                            >
                                                {errors.phone}
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex flex-col gap-1.5">
                                        <label
                                            htmlFor="rfq-email"
                                            className="text-xs font-semibold text-[#F5F3EE]"
                                        >
                                            {content.rfq.fields.email.label}
                                        </label>
                                        <input
                                            id="rfq-email"
                                            type="email"
                                            autoComplete="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            aria-invalid={!!errors.email}
                                            className="h-[46px] px-3 rounded-lg border border-[#3A4652] bg-[#151C23] text-white text-sm"
                                        />
                                        {errors.email && (
                                            <span className="text-xs text-[#F2555A]">
                                                {errors.email}
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex flex-col gap-1.5">
                                        <label
                                            htmlFor="rfq-power"
                                            className="text-xs font-semibold text-[#F5F3EE]"
                                        >
                                            {content.rfq.fields.power.label}
                                        </label>
                                        <select
                                            id="rfq-power"
                                            value={power}
                                            onChange={(e) => setPower(e.target.value)}
                                            className="h-[46px] px-3 rounded-lg border border-[#3A4652] bg-[#151C23] text-white text-sm"
                                        >
                                            {content.rfq.fields.power.options.map((opt) => (
                                                <option key={opt} value={opt}>
                                                    {opt}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="flex flex-col gap-1.5">
                                        <label
                                            htmlFor="rfq-fuel"
                                            className="text-xs font-semibold text-[#F5F3EE]"
                                        >
                                            {content.rfq.fields.fuel.label}
                                        </label>
                                        <select
                                            id="rfq-fuel"
                                            value={fuel}
                                            onChange={(e) => setFuel(e.target.value)}
                                            className="h-[46px] px-3 rounded-lg border border-[#3A4652] bg-[#151C23] text-white text-sm"
                                        >
                                            {content.rfq.fields.fuel.options.map((opt) => (
                                                <option key={opt} value={opt}>
                                                    {opt}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {modelSlug && (
                                        <div className="flex flex-col gap-1.5">
                                            <label
                                                htmlFor="rfq-model"
                                                className="text-xs font-semibold text-[#F5F3EE]"
                                            >
                                                {content.rfq.fields.model.label}
                                            </label>
                                            <input
                                                id="rfq-model"
                                                type="text"
                                                value={modelSlug.toUpperCase()}
                                                readOnly
                                                className="h-[46px] px-3 rounded-lg border border-[#3A4652] bg-[#151C23] text-[#FF8A3D] font-bold text-sm"
                                            />
                                        </div>
                                    )}
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <label
                                        htmlFor="rfq-files"
                                        className="text-xs font-semibold text-[#F5F3EE]"
                                    >
                                        {content.rfq.fields.files.label}
                                    </label>
                                    <input
                                        id="rfq-files"
                                        type="file"
                                        multiple
                                        accept={content.rfq.fields.files.accept}
                                        onChange={(e) =>
                                            setPickedFileNames(
                                                Array.from(e.target.files ?? []).map((f) => f.name),
                                            )
                                        }
                                        className="sr-only"
                                    />
                                    <label
                                        htmlFor="rfq-files"
                                        className="inline-flex min-h-[44px] items-center gap-2 self-start px-4 rounded-lg border border-dashed border-[#3A4652] bg-[#151C23] text-xs font-semibold text-[#F5F3EE] hover:border-[#FF8A3D] transition cursor-pointer"
                                    >
                                        <Paperclip className="w-3.5 h-3.5" aria-hidden="true" />
                                        {content.rfq.fields.files.choose}
                                    </label>
                                    <span className="text-xs text-[#C9D0D8] break-words">
                                        {pickedFileNames.length > 0
                                            ? pickedFileNames.join(', ')
                                            : content.rfq.fields.files.none}
                                    </span>
                                </div>

                                <input
                                    type="text"
                                    name="website"
                                    value={website}
                                    onChange={(e) => setWebsite(e.target.value)}
                                    tabIndex={-1}
                                    autoComplete="off"
                                    aria-hidden="true"
                                    className="hidden"
                                />

                                {errors.server && (
                                    <p className="text-xs text-[#F2555A]">{errors.server}</p>
                                )}

                                <div className="flex flex-wrap items-center gap-3.5 pt-1">
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="min-h-[48px] px-6 rounded-lg bg-[#C2410C] text-white font-bold text-sm sm:text-base cursor-pointer hover:brightness-110 transition"
                                    >
                                        {mode === 'rent'
                                            ? content.rfq.submit.rent
                                            : content.rfq.submit.buy}
                                    </button>
                                    <span className="text-xs text-[#8E99A5]">
                                        {content.rfq.consent}
                                    </span>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}

export function RoiCalculatorSection({
    locale,
    forcedModelSlug,
    showAssumptions,
}: {
    locale: AppLocale;
    forcedModelSlug?: string;
    showAssumptions: boolean;
}) {
    const content = getPramoneiContent(locale);
    const models = useMemo(() => getLocalizedIndustrialModels(locale), [locale]);
    const [currentFuelId, setCurrentFuelId] = useState<string>('gas');
    const [bioFuelId, setBioFuelId] = useState<string>('chips');
    const [mwhPerYear, setMwhPerYear] = useState<number>(1200);

    const env = useMemo(() => ({ SHOW_ASSUMPTIONS: showAssumptions }), [showAssumptions]);

    const roi = useMemo(
        () =>
            computeRoi(
                {
                    mwhPerYear: Math.min(10000, Math.max(100, mwhPerYear || 1200)),
                    currentFuelId,
                    bioFuelId,
                    modelSlug: forcedModelSlug,
                },
                ROI_CONFIG,
                models,
                env,
            ),
        [mwhPerYear, currentFuelId, bioFuelId, forcedModelSlug, models, env],
    );

    const curFuelObj =
        ROI_CONFIG.current_fuels.find((f) => f.id === currentFuelId) ??
        ROI_CONFIG.current_fuels[0];
    const bioFuelObj =
        ROI_CONFIG.bio_fuels.find((f) => f.id === bioFuelId) ?? ROI_CONFIG.bio_fuels[0];

    const curFuelLabel = FUEL_LABELS_I18N[curFuelObj.id]?.[locale] ?? curFuelObj.label;
    const bioFuelLabel = FUEL_LABELS_I18N[bioFuelObj.id]?.[locale] ?? bioFuelObj.label;

    const monthsUnit =
        locale === 'en' ? 'mo.' : locale === 'pl' ? 'mies.' : locale === 'ru' ? 'мес.' : 'mėn.';
    const yearUnit =
        locale === 'en' ? '/yr' : locale === 'pl' ? '/r.' : locale === 'ru' ? '/г.' : '/m.';

    const formatRange = (min: number, max: number) =>
        min === max ? `${min}\u00A0€/MWh` : `${min}–${max}\u00A0€/MWh`;

    return (
        <section id="skaiciuokle" className="pt-8 sm:pt-16">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
                <div className="lg:col-span-7 flex flex-col gap-4 sm:gap-5 p-4 sm:p-8 rounded-2xl bg-white border border-[#E2DDD3]">
                    <div className="space-y-1.5">
                        <span className="text-xs font-bold text-[#C2410C] block">
                            {content.roi.eyebrow}
                        </span>
                        <h2 className="text-2xl sm:text-3xl font-extrabold text-[#11161B] leading-tight text-balance">
                            {content.roi.title}
                        </h2>
                    </div>

                    <fieldset className="space-y-2.5 border-0 p-0 m-0">
                        <legend className="font-bold text-sm text-[#11161B] pb-1">
                            {content.roi.steps[0]}
                        </legend>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {ROI_CONFIG.current_fuels.map((f) => {
                                const active = f.id === currentFuelId;
                                const label = FUEL_LABELS_I18N[f.id]?.[locale] ?? f.label;
                                return (
                                    <button
                                        key={f.id}
                                        type="button"
                                        data-testid={`roi-fuel-${f.id}`}
                                        aria-pressed={active}
                                        onClick={() => setCurrentFuelId(f.id)}
                                        className={`min-h-[50px] px-3.5 py-2.5 rounded-lg border-2 text-left cursor-pointer flex items-center justify-between gap-2 transition ${
                                            active
                                                ? 'border-[#C2410C] bg-[#FBEADF] text-[#11161B]'
                                                : 'border-[#E2DDD3] bg-white text-[#11161B] hover:border-[#C2410C]'
                                        }`}
                                    >
                                        <span className="font-semibold text-sm">{label}</span>
                                        <span className="text-xs text-[#5B6470] whitespace-nowrap">
                                            {formatRange(
                                                f.eur_per_mwh_heat.min,
                                                f.eur_per_mwh_heat.max,
                                            )}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </fieldset>

                    <fieldset className="space-y-2.5 border-0 p-0 m-0">
                        <legend className="font-bold text-sm text-[#11161B] pb-1">
                            {content.roi.steps[1]}
                        </legend>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {ROI_CONFIG.bio_fuels.map((f) => {
                                const active = f.id === bioFuelId;
                                const label = FUEL_LABELS_I18N[f.id]?.[locale] ?? f.label;
                                return (
                                    <button
                                        key={f.id}
                                        type="button"
                                        data-testid={`roi-bio-${f.id}`}
                                        aria-pressed={active}
                                        onClick={() => setBioFuelId(f.id)}
                                        className={`min-h-[50px] px-3.5 py-2.5 rounded-lg border-2 text-left cursor-pointer flex items-center justify-between gap-2 transition ${
                                            active
                                                ? 'border-[#C2410C] bg-[#FBEADF] text-[#11161B]'
                                                : 'border-[#E2DDD3] bg-white text-[#11161B] hover:border-[#C2410C]'
                                        }`}
                                    >
                                        <span className="font-semibold text-sm">{label}</span>
                                        <span className="text-xs text-[#5B6470] whitespace-nowrap">
                                            {formatRange(
                                                f.eur_per_mwh_heat.min,
                                                f.eur_per_mwh_heat.max,
                                            )}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </fieldset>

                    <fieldset className="space-y-2.5 border-0 p-0 m-0">
                        <legend className="font-bold text-sm text-[#11161B] pb-1">
                            {content.roi.steps[2]}
                        </legend>
                        <div className="flex flex-wrap gap-2">
                            {ROI_CONFIG.load_presets_mwh.map((preset) => {
                                const active = mwhPerYear === preset;
                                const presetRoi = computeRoi(
                                    {
                                        mwhPerYear: preset,
                                        currentFuelId,
                                        bioFuelId,
                                        modelSlug: forcedModelSlug,
                                    },
                                    ROI_CONFIG,
                                    models,
                                    env,
                                );
                                return (
                                    <button
                                        key={preset}
                                        type="button"
                                        data-testid={`roi-load-${preset}`}
                                        aria-pressed={active}
                                        onClick={() => setMwhPerYear(preset)}
                                        className={`min-h-[50px] px-3.5 py-2 rounded-lg border-2 text-left cursor-pointer flex flex-col items-start gap-0.5 transition ${
                                            active
                                                ? 'border-[#C2410C] bg-[#FBEADF] text-[#11161B]'
                                                : 'border-[#E2DDD3] bg-white text-[#11161B] hover:border-[#C2410C]'
                                        }`}
                                    >
                                        <span className="font-bold text-sm">
                                            {formatInt(preset)} MWh
                                        </span>
                                        <span className="text-xs text-[#5B6470]">
                                            {presetRoi.model.code}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </fieldset>

                    <p className="text-xs text-[#5B6470] leading-relaxed mt-auto">
                        {content.roi.assumptions.replace('{version}', ROI_CONFIG.version)}
                    </p>
                </div>

                <div className="lg:col-span-5 flex flex-col gap-3 sm:gap-4 p-4 sm:p-8 rounded-2xl bg-[#0E1216] text-[#F5F3EE]">
                    <div className="flex items-center justify-between gap-2 text-xs font-bold text-[#FF8A3D]">
                        <span>
                            {content.roi.result_labels.eyebrow.split('{model}')[0]}
                            <span data-testid="roi-model">{roi.model.code}</span>
                        </span>
                    </div>

                    <div className="flex flex-col gap-1">
                        <span className="text-xs sm:text-sm text-[#A3ADB8]">
                            {content.roi.result_labels.net}
                        </span>
                        <span
                            data-testid="roi-net"
                            className="font-extrabold text-3xl sm:text-4xl text-[#F5F3EE] tabular-nums"
                        >
                            {roi.netSavingEur > 0
                                ? formatEur(roi.netSavingEur)
                                : content.roi.result_labels.no_payback}
                        </span>
                        <span className="text-xs text-[#A3ADB8]">
                            {content.roi.result_labels.sizing
                                .replace('{kw}', formatInt(roi.peakKw))
                                .replace('{model}', roi.model.code)}
                        </span>
                        {roi.exceedsRange && (
                            <span className="text-xs text-[#FF8A3D]">
                                {content.roi.result_labels.exceeds}
                            </span>
                        )}
                    </div>

                    <dl className="border-t border-[#26313B] divide-y divide-[#26313B] text-sm">
                        <div className="flex justify-between gap-3 py-2.5">
                            <dt className="text-[#A3ADB8]">
                                {content.roi.result_labels.now.replace('{fuel}', curFuelLabel)}
                            </dt>
                            <dd className="font-semibold tabular-nums">
                                {formatEur(roi.nowEur)}
                                {yearUnit}
                            </dd>
                        </div>
                        <div className="flex justify-between gap-3 py-2.5">
                            <dt className="text-[#A3ADB8]">
                                {content.roi.result_labels.bio.replace('{bio}', bioFuelLabel)}
                            </dt>
                            <dd className="font-semibold text-[#3FB950] tabular-nums">
                                {formatEur(roi.bioEur)}
                                {yearUnit}
                            </dd>
                        </div>
                        <div className="flex justify-between gap-3 py-2.5">
                            <dt className="text-[#A3ADB8]">{content.roi.result_labels.opex}</dt>
                            <dd className="font-semibold tabular-nums">
                                {formatEur(roi.opexEur)}
                                {yearUnit}
                            </dd>
                        </div>
                        <div className="flex justify-between gap-3 py-2.5">
                            <dt className="text-[#A3ADB8]">{content.roi.result_labels.invest}</dt>
                            <dd className="font-semibold tabular-nums">
                                {priceLabel(roi.investNetEur, {
                                    gross: false,
                                    estimate: roi.investIsEstimate,
                                })}
                            </dd>
                        </div>
                        <div className="flex justify-between items-baseline gap-3 pt-3">
                            <dt className="text-[#A3ADB8]">{content.roi.result_labels.payback}</dt>
                            <dd
                                data-testid="roi-payback"
                                className="font-extrabold text-2xl text-[#FF8A3D] tabular-nums"
                            >
                                {roi.paybackMonths !== null
                                    ? `≈ ${roi.paybackMonths} ${monthsUnit}`
                                    : content.roi.result_labels.no_payback}
                            </dd>
                        </div>
                    </dl>

                    {roi.rentNetEur !== null && (
                        <span className="text-xs text-[#A3ADB8]">
                            {content.roi.result_labels.rent.replace(
                                '{rent}',
                                `nuo ${priceLabel(roi.rentNetEur, {
                                    gross: false,
                                    estimate: roi.rentIsEstimate,
                                })}${monthsUnit === 'mėn.' ? '/mėn. be PVM' : '/mo excl. VAT'}`,
                            )}
                        </span>
                    )}

                    <a
                        href="#industrial-rfq"
                        className="mt-auto min-h-[48px] inline-flex items-center justify-center rounded-lg bg-[#C2410C] text-white font-bold text-sm hover:brightness-110 transition"
                    >
                        {content.roi.cta}
                    </a>
                </div>
            </div>
        </section>
    );
}

export function PramoneiV2View({ locale }: { locale: AppLocale }) {
    const searchParams = useSearchParams();
    const content = getPramoneiContent(locale);
    const models = useMemo(() => getLocalizedIndustrialModels(locale), [locale]);
    const projects = useMemo(() => getLocalizedProjects(locale), [locale]);

    const querySegment = searchParams?.get('segment');
    const queryModel = searchParams?.get('model') || '';
    const queryMode = searchParams?.get('mode') === 'rent' ? 'rent' : 'buy';
    const queryAssumptions = searchParams?.get('assumptions');

    const defaultEnv = getDefaultPublishEnv();
    const showAssumptions =
        queryAssumptions === '1' || queryAssumptions === 'true'
            ? true
            : queryAssumptions === '0' || queryAssumptions === 'false'
              ? false
              : defaultEnv.SHOW_ASSUMPTIONS;

    const [segment, setSegment] = useState<FilterSegment>('buy');
    // W124-A1 (F3.1): viena gi.vat būsena visai svetainei (navbar + lentelės + vedlys).
    const [allModelsVisible, setAllModelsVisible] = useState(false);
    const showNet = useVatDisplayStore((s) => s.showNet);
    const setShowNet = useVatDisplayStore((s) => s.setShowNet);
    const gross = !showNet;
    const [faqOpen, setFaqOpen] = useState<number>(0);

    useEffect(() => {
        if (
            querySegment === 'buy' ||
            querySegment === 'rent' ||
            querySegment === 'special' ||
            querySegment === 'all'
        ) {
            setSegment(querySegment);
        }
    }, [querySegment]);

    // „Katilinė nuomai" įvestis: #nuomos-sandoris veda tiesiai į sandorio konfigūratorių.
    useEffect(() => {
        if (typeof window === 'undefined' || window.location.hash !== '#nuomos-sandoris') return;
        const t = window.setTimeout(() => {
            const el = document.getElementById('nuomos-sandoris');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
        }, 350);
        return () => window.clearTimeout(t);
    }, []);

    const selectVat = (nextGross: boolean) => setShowNet(!nextGross);

    const filteredModels = useMemo(
        () => models.filter((m) => segment === 'all' || m.segment === segment),
        [models, segment],
    );

    const [priceHeadNet, priceHeadGross] = content.models_section.columns[5]
        .split('|')
        .map((s) => s.trim());

    const faqJsonLd = useMemo(
        () => ({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: content.faq.items.map((item) => ({
                '@type': 'Question',
                name: item.q,
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: item.a,
                },
            })),
        }),
        [content.faq.items],
    );

    const itemListJsonLd = useMemo(
        () => ({
            '@context': 'https://schema.org',
            '@type': 'ItemList',
            itemListElement: models.map((m, idx) => ({
                '@type': 'ListItem',
                position: idx + 1,
                name: `${m.code} – ${m.kind}`,
                url: `https://gilesinzinerija.lt/${locale}/pramonei/${m.slug}`,
            })),
        }),
        [models, locale],
    );

    return (
        <div className="bg-[#F5F3EE] text-[#11161B] min-h-screen">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
            />

            {/* 1. Hero */}
            <section className="bg-[#0E1216] text-[#F5F3EE]">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 pt-5 pb-8 sm:pb-12 space-y-5">
                    <nav aria-label="Kelias" className="flex items-center gap-2 text-xs text-[#8E99A5]">
                        <Link href={`/${locale}`} className="hover:text-[#F5F3EE]">
                            {content.breadcrumb[0]}
                        </Link>
                        <span aria-hidden="true">/</span>
                        <span className="text-[#F5F3EE]">{content.breadcrumb[1]}</span>
                    </nav>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                        <div className="lg:col-span-6 space-y-4">
                            <span className="text-xs font-bold text-[#FF8A3D] block">
                                {content.hero.eyebrow}
                            </span>
                            <h1 className="text-3xl sm:text-5xl font-extrabold text-[#F5F3EE] leading-tight text-balance">
                                {content.hero.h1}
                            </h1>
                            <p className="text-sm sm:text-base text-[#C9D0D8] leading-relaxed max-w-xl">
                                {content.hero.lead}
                            </p>

                            <div className="flex flex-wrap gap-3 pt-1">
                                <a
                                    href={content.hero.cta_primary.href}
                                    className="min-h-[48px] px-5 inline-flex items-center justify-center rounded-lg bg-[#C2410C] text-white font-bold text-sm sm:text-base hover:brightness-110 transition"
                                >
                                    {content.hero.cta_primary.label}
                                </a>
                                <a
                                    href={content.hero.cta_secondary.href}
                                    className="min-h-[48px] px-5 inline-flex items-center justify-center rounded-lg border border-[#3A4652] bg-transparent text-[#F5F3EE] font-semibold text-sm sm:text-base hover:border-[#FF8A3D] transition"
                                >
                                    {content.hero.cta_secondary.label}
                                </a>
                            </div>

                            <dl className="grid grid-cols-3 gap-3 pt-3 border-t border-[#26313B]">
                                {content.hero.facts.map((fact) => (
                                    <div key={fact.label} className="flex flex-col gap-0.5">
                                        <dt className="order-2 text-xs text-[#8E99A5]">
                                            {fact.label}
                                        </dt>
                                        <dd className="order-1 font-extrabold text-base sm:text-lg text-[#F5F3EE]">
                                            {fact.value}
                                        </dd>
                                    </div>
                                ))}
                            </dl>
                        </div>

                        <figure className="lg:col-span-6 m-0 flex flex-col rounded-2xl overflow-hidden bg-[#EEEBE4]">
                            <img
                                src={assetUrl(content.hero.image.src)}
                                alt={content.hero.image.alt}
                                width={960}
                                height={600}
                                fetchPriority="high"
                                className="w-full h-56 sm:h-72 object-cover block brightness-105 contrast-105"
                            />
                            <figcaption className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-[#151C23] text-[#F5F3EE] text-xs">
                                <span>
                                    <strong className="font-bold">
                                        {content.hero.image.caption_title}
                                    </strong>
                                </span>
                                <span className="text-[#A3ADB8]">
                                    {content.hero.image.caption_text}
                                </span>
                            </figcaption>
                            <div className="grid grid-cols-5 gap-1.5 p-2 bg-[#11171D]">
                                {HERO_GALLERY_THUMBS.map((thumb) => (
                                    <div
                                        key={thumb.code}
                                        className="flex flex-col items-center bg-[#EEEBE4] rounded overflow-hidden"
                                    >
                                        <img
                                            src={assetUrl(thumb.src)}
                                            alt={thumb.label[locale]}
                                            width={120}
                                            height={80}
                                            className="w-full h-11 object-cover block brightness-105 contrast-105"
                                        />
                                    </div>
                                ))}
                            </div>
                        </figure>
                    </div>
                </div>
            </section>

            {/* 2. Trys keliai */}
            <section className="pt-8 sm:pt-10">
                <div className="mx-auto max-w-7xl px-4 sm:px-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                        {content.paths.map((p) => {
                            const segKey = p.segment as Segment;
                            const active = segment === segKey;
                            return (
                                <button
                                    key={p.segment}
                                    type="button"
                                    data-testid={`path-${p.segment}`}
                                    aria-pressed={active}
                                    onClick={() => {
                                        setSegment(segKey);
                                        const el = document.getElementById('modeliai');
                                        if (el) el.scrollIntoView({ behavior: 'auto', block: 'start' });
                                    }}
                                    className={`p-5 rounded-xl border-2 bg-transparent text-left cursor-pointer flex flex-col gap-2 transition ${
                                        active
                                            ? 'border-[#C2410C]'
                                            : 'border-[#D5CFC3] hover:border-[#C2410C]'
                                    }`}
                                >
                                    <span className="text-xs font-bold text-[#C2410C]">
                                        {p.eyebrow}
                                    </span>
                                    <span className="font-extrabold text-xl text-[#11161B]">
                                        {p.title}
                                    </span>
                                    <span className="text-sm text-[#5B6470] leading-relaxed">
                                        {p.text}
                                    </span>
                                    <span className="font-bold text-sm text-[#11161B] pt-1">
                                        {p.price_from}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* 3. Modelių lentelė */}
            <section id="modeliai" className="pt-10 sm:pt-14 scroll-mt-24">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 space-y-5">
                    <div className="flex flex-wrap items-end justify-between gap-4">
                        <div className="space-y-1.5">
                            <span className="text-xs font-bold text-[#C2410C] block">
                                {content.models_section.eyebrow}
                            </span>
                            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#11161B] leading-tight text-balance">
                                {content.models_section.titles[segment]}
                            </h2>
                        </div>

                        <div className="flex flex-wrap items-center gap-2.5">
                            <div
                                role="group"
                                aria-label="Segmentas"
                                className="inline-flex flex-wrap p-1 rounded-lg bg-[#E7E3DB] gap-1"
                            >
                                {(['buy', 'rent', 'special', 'all'] as const).map((segKey) => {
                                    const active = segment === segKey;
                                    return (
                                        <button
                                            key={segKey}
                                            type="button"
                                            data-testid={`segment-${segKey}`}
                                            aria-pressed={active}
                                            onClick={() => setSegment(segKey)}
                                            className={`scroll-mt-24 min-h-[38px] px-3 rounded-md bg-transparent text-xs font-bold cursor-pointer transition ${
                                                active
                                                    ? 'text-[#C2410C] underline underline-offset-4'
                                                    : 'text-[#11161B] hover:text-[#C2410C]'
                                            }`}
                                        >
                                            {content.models_section.filters[segKey]}
                                        </button>
                                    );
                                })}
                            </div>

                            <div
                                role="group"
                                aria-label="Kainos"
                                className="inline-flex p-1 rounded-lg bg-[#E7E3DB] gap-1"
                            >
                                <button
                                    type="button"
                                    data-testid="vat-net"
                                    aria-pressed={!gross}
                                    onClick={() => selectVat(false)}
                                    className={`min-h-[38px] px-3 rounded-md bg-transparent text-xs font-bold cursor-pointer transition ${
                                        !gross
                                            ? 'text-[#C2410C] underline underline-offset-4'
                                            : 'text-[#11161B] hover:text-[#C2410C]'
                                    }`}
                                >
                                    {content.models_section.vat_toggle.net}
                                </button>
                                <button
                                    type="button"
                                    data-testid="vat-gross"
                                    aria-pressed={gross}
                                    onClick={() => selectVat(true)}
                                    className={`min-h-[38px] px-3 rounded-md bg-transparent text-xs font-bold cursor-pointer transition ${
                                        gross
                                            ? 'text-[#C2410C] underline underline-offset-4'
                                            : 'text-[#11161B] hover:text-[#C2410C]'
                                    }`}
                                >
                                    {content.models_section.vat_toggle.gross}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl bg-white border border-[#E2DDD3] overflow-hidden">
                        <table
                            data-testid="models-table"
                            className="block md:table w-full border-collapse text-sm"
                        >
                            <thead className="block md:table-header-group bg-[#11161B] text-white text-xs">
                                <tr className="flex items-center justify-between px-4 py-2.5 md:p-0 md:table-row text-left">
                                    <th scope="col" className="md:py-3.5 md:px-4 font-semibold">
                                        {content.models_section.columns[0]}
                                    </th>
                                    <th
                                        scope="col"
                                        className="hidden md:table-cell py-3.5 px-3 font-semibold"
                                    >
                                        {content.models_section.columns[1]}
                                    </th>
                                    <th
                                        scope="col"
                                        className="hidden md:table-cell py-3.5 px-3 font-semibold"
                                    >
                                        {content.models_section.columns[2]}
                                    </th>
                                    <th
                                        scope="col"
                                        className="hidden md:table-cell py-3.5 px-3 font-semibold"
                                    >
                                        {content.models_section.columns[3]}
                                    </th>
                                    <th
                                        scope="col"
                                        className="hidden md:table-cell py-3.5 px-3 font-semibold"
                                    >
                                        {content.models_section.columns[4]}
                                    </th>
                                    <th
                                        scope="col"
                                        data-testid="price-head"
                                        className="md:py-3.5 md:px-3 font-semibold text-right"
                                    >
                                        {gross ? priceHeadGross : priceHeadNet}
                                    </th>
                                    <th
                                        scope="col"
                                        className="hidden md:table-cell py-3.5 px-4 w-36"
                                    >
                                        <span className="sr-only">{content.models_section.row_cta}</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="block md:table-row-group divide-y divide-[#E2DDD3]">
                                {filteredModels.map((m, mIdx) => {
                                    const fuelInfo = formatModelFuel(m, locale, showAssumptions);
                                    const priceInfo = formatModelPriceCell(m, {
                                        gross,
                                        showAssumptions,
                                        locale,
                                        priceOnRequest: content.models_section.price_on_request,
                                    });
                                    const dimsLabel = m.dimensions.value?.label ?? '–';
                                    return (
                                        <tr
                                            key={m.slug}
                                            className={`block md:table-row py-3 px-3 md:p-0 hover:bg-[#FAF8F4] transition ${mIdx >= 5 && !allModelsVisible ? 'max-md:hidden' : ''}`}
                                        >
                                            <td className="block md:table-cell py-1.5 md:py-3 md:px-4">
                                                <div className="flex items-center gap-3.5">
                                                    {m.image ? (
                                                        <img
                                                            src={assetUrl(m.image)}
                                                            alt={`${m.code} – ${m.kind}`}
                                                            width={72}
                                                            height={54}
                                                            loading="lazy"
                                                            className="w-[72px] h-[54px] object-cover rounded-lg bg-[#EEEBE4] shrink-0 brightness-105 contrast-105"
                                                        />
                                                    ) : (
                                                        <span
                                                            aria-hidden="true"
                                                            className="w-[72px] h-[54px] rounded-lg bg-[#EEEBE4] shrink-0 flex items-center justify-center"
                                                        >
                                                            <svg
                                                                width="44"
                                                                height="30"
                                                                viewBox="0 0 44 30"
                                                                fill="none"
                                                                stroke="#8A8478"
                                                                strokeWidth="1.5"
                                                            >
                                                                <rect
                                                                    x="2"
                                                                    y="10"
                                                                    width="32"
                                                                    height="18"
                                                                    rx="1"
                                                                />
                                                                <path d="M9 10V28 M16 10V28 M23 10V28 M30 10V28" />
                                                                <rect
                                                                    x="36"
                                                                    y="2"
                                                                    width="5"
                                                                    height="26"
                                                                />
                                                            </svg>
                                                        </span>
                                                    )}
                                                    <div className="flex flex-col gap-0.5">
                                                        <span className="font-bold text-sm text-[#C2410C]">
                                                            {m.code}
                                                        </span>
                                                        <span className="text-xs text-[#5B6470]">
                                                            {m.kind}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="block md:table-cell py-1 md:py-3 md:px-3 font-bold whitespace-nowrap">
                                                {formatModelPower(m, locale)}
                                            </td>
                                            <td className="block md:table-cell py-1 md:py-3 md:px-3 whitespace-nowrap">
                                                {formatModelArea(m, locale)}
                                            </td>
                                            <td className="block md:table-cell py-1 md:py-3 md:px-3">
                                                <div className="flex flex-col gap-0.5">
                                                    <span>{fuelInfo.main}</span>
                                                    {fuelInfo.autonomy && (
                                                        <span className="text-xs text-[#5B6470]">
                                                            {fuelInfo.autonomy}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="block md:table-cell py-1 md:py-3 md:px-3 text-xs text-[#3A4652]">
                                                {dimsLabel}
                                            </td>
                                            <td className="block md:table-cell py-1.5 md:py-3 md:px-3 md:text-right whitespace-nowrap">
                                                <div className="flex flex-col md:items-end gap-0.5">
                                                    <strong className="font-bold text-base text-[#11161B] tabular-nums">
                                                        {priceInfo.main}
                                                    </strong>
                                                    {priceInfo.sub && (
                                                        <span className="text-xs text-[#5B6470] tabular-nums">
                                                            {priceInfo.sub}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="block md:table-cell pt-2 md:py-3 md:px-4">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <Link
                                                        href={`/${locale}/pramonei/${m.slug}`}
                                                        className="min-h-[38px] px-3 inline-flex items-center justify-center rounded-lg border border-[#11161B] text-xs font-semibold text-[#11161B] hover:border-[#C2410C] hover:text-[#C2410C] whitespace-nowrap transition"
                                                    >
                                                        {content.models_section.row_cta}
                                                    </Link>
                                                    {m.segment === 'rent' && (
                                                        <a
                                                            href="#nuomos-sandoris"
                                                            data-testid={`row-rent-deal-${m.slug}`}
                                                            onClick={() => setSegment('rent')}
                                                            className="min-h-[38px] px-3 inline-flex items-center justify-center rounded-lg bg-[#C2410C] text-white text-xs font-bold hover:brightness-110 whitespace-nowrap transition"
                                                        >
                                                            {locale === 'lt' ? 'Užsakyti nuomą' : locale === 'en' ? 'Order rental' : locale === 'pl' ? 'Zamów wynajem' : 'Арендовать'}
                                                        </a>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        {!allModelsVisible && filteredModels.length > 5 && (
                            <button
                                type="button"
                                onClick={() => setAllModelsVisible(true)}
                                className="mt-3 w-full md:hidden min-h-[44px] rounded-lg border border-[#E2DDD3] bg-white text-sm font-bold text-[#11161B] hover:border-[#C2410C] transition cursor-pointer"
                            >
                                Rodyti visus {filteredModels.length} modelių
                            </button>
                        )}
                    </div>

                    <p className="text-xs text-[#5B6470] leading-relaxed">
                        {content.models_section.footnote}
                    </p>
                </div>
            </section>

            {/* 3b. Mobilios katilinės nuomos sandorio konfigūratorius */}
            <BoilerRentalDealFlow locale={locale} />
            <InstantDealDrawerMount locale={locale} />

            {/* 4. Sandara */}
            <section className="pt-8 sm:pt-16">
                <div className="bg-[#0E1216] text-[#F5F3EE] py-12 sm:py-16">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 space-y-8">
                        <div className="flex flex-wrap items-end justify-between gap-4">
                            <div className="space-y-2 max-w-2xl">
                                <span className="text-xs font-bold text-[#FF8A3D] block">
                                    {content.assemblies.eyebrow}
                                </span>
                                <h2 className="text-2xl sm:text-3xl font-extrabold text-[#F5F3EE] leading-tight text-balance">
                                    {content.assemblies.title}
                                </h2>
                            </div>
                            <Link
                                href={`/${locale}/pramonei/gk-2000#breziniai`}
                                className="text-sm font-semibold text-[#F5F3EE] hover:text-[#FF8A3D] underline underline-offset-4"
                            >
                                {content.assemblies.link.label.replace(/\s*→$/, '')}
                            </Link>
                        </div>

                        <ol className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3 list-none p-0 m-0">
                            {content.assemblies.items.map((item) => (
                                <li
                                    key={item.tag}
                                    className="flex flex-col gap-2.5 p-5 rounded-xl bg-[#151C23] border border-[#26313B]"
                                >
                                    <span className="text-xs font-bold text-[#FF8A3D]">
                                        {item.tag}
                                    </span>
                                    <span className="font-bold text-base text-[#F5F3EE]">
                                        {item.title}
                                    </span>
                                    <span className="text-xs sm:text-sm text-[#C9D0D8] leading-relaxed">
                                        {item.text}
                                    </span>
                                </li>
                            ))}
                        </ol>
                    </div>
                </div>
            </section>

            {/* 5. Skaičiuoklė */}
            <RoiCalculatorSection locale={locale} showAssumptions={showAssumptions} />

            {/* 6. Projektai */}
            <section id="projektai" className="pt-8 sm:pt-16">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 space-y-6">
                    <div className="flex flex-wrap items-end justify-between gap-4">
                        <div className="space-y-1.5">
                            <span className="text-xs font-bold text-[#C2410C] block">
                                {content.projects_section.eyebrow}
                            </span>
                            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#11161B] leading-tight text-balance">
                                {content.projects_section.title}
                            </h2>
                        </div>
                        <Link
                            href={content.projects_section.link.href}
                            className="text-sm font-semibold text-[#11161B] hover:text-[#C2410C] underline underline-offset-4"
                        >
                            {content.projects_section.link.label.replace(/\s*→$/, '')}
                        </Link>
                    </div>

                    <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-4 md:overflow-visible">
                        {projects.map((p) => {
                            const targetHref = p.model
                                ? `/${locale}/pramonei/${p.model}`
                                : `/${locale}/inzinerija#atlikti-darbai`;
                            return (
                                <Link
                                    key={p.id}
                                    href={targetHref}
                                    className="flex flex-col rounded-2xl bg-white border border-[#E2DDD3] overflow-hidden hover:border-[#C2410C] transition min-w-[270px] snap-start md:min-w-0"
                                >
                                    <div className="relative bg-[#EEEBE4]">
                                        <img
                                            src={assetUrl(p.image)}
                                            alt={p.title}
                                            width={640}
                                            height={480}
                                            loading="lazy"
                                            className="w-full aspect-[4/3] object-cover block brightness-105 contrast-105"
                                        />
                                        <span className="absolute left-3.5 top-3.5 px-2.5 py-1 rounded bg-[#11161B] text-white text-xs font-bold">
                                            {p.tag}
                                        </span>
                                    </div>
                                    <div className="flex flex-col gap-3 p-5 flex-1">
                                        <span className="font-bold text-base sm:text-lg text-[#11161B] leading-snug">
                                            {p.title}
                                        </span>
                                        <div className="flex flex-col gap-2 pt-3 border-t border-[#E2DDD3] text-xs sm:text-sm mt-auto">
                                            <div className="flex gap-2.5">
                                                <span className="w-20 shrink-0 text-xs text-[#5B6470]">
                                                    {content.projects_section.fields.equipment}
                                                </span>
                                                <span className="text-[#11161B]">
                                                    {p.equipment}
                                                </span>
                                            </div>
                                            <div className="flex gap-2.5">
                                                <span className="w-20 shrink-0 text-xs text-[#5B6470]">
                                                    {content.projects_section.fields.result}
                                                </span>
                                                <span className="font-semibold text-[#157A3B]">
                                                    {p.result}
                                                </span>
                                            </div>
                                            {p.client && (
                                                <div className="flex gap-2.5">
                                                    <span className="w-20 shrink-0 text-xs text-[#5B6470]">
                                                        {content.projects_section.fields.client}
                                                    </span>
                                                    <span>
                                                        {p.client}
                                                        {p.city ? `, ${p.city}` : ''}
                                                    </span>
                                                </div>
                                            )}
                                            {p.year && (
                                                <div className="flex gap-2.5">
                                                    <span className="w-20 shrink-0 text-xs text-[#5B6470]">
                                                        {content.projects_section.fields.year}
                                                    </span>
                                                    <span>{p.year}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* 7. Eiga ir dokumentai */}
            <section className="pt-8 sm:pt-16">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    <div className="lg:col-span-7 space-y-4">
                        <span className="text-xs font-bold text-[#C2410C] block">
                            {content.process.eyebrow}
                        </span>
                        <h2 className="text-2xl sm:text-3xl font-extrabold text-[#11161B] leading-tight text-balance">
                            {content.process.title}
                        </h2>
                        <ol className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3.5 list-none p-0 m-0 pt-1">
                            {content.process.steps.map((step) => (
                                <li
                                    key={step.n}
                                    className="flex flex-col gap-1.5 pt-3.5 border-t-2 border-[#11161B]"
                                >
                                    <span className="text-xs font-bold text-[#C2410C]">
                                        {step.n}
                                    </span>
                                    <span className="font-bold text-sm text-[#11161B]">
                                        {step.title}
                                    </span>
                                    <span className="text-xs text-[#5B6470]">{step.text}</span>
                                </li>
                            ))}
                        </ol>
                    </div>

                    <div className="lg:col-span-5 p-6 rounded-2xl bg-white border border-[#E2DDD3] space-y-3">
                        <h3 className="font-bold text-lg text-[#11161B]">
                            {content.documents.title}
                        </h3>
                        <ul className="divide-y divide-[#E2DDD3] border-t border-b border-[#E2DDD3] list-none p-0 m-0 text-sm">
                            {content.documents.items.map((doc) => (
                                <li
                                    key={doc.label}
                                    className="flex items-center justify-between gap-3 py-2.5"
                                >
                                    <span className="text-[#11161B]">{doc.label}</span>
                                    <span className="text-xs font-semibold text-[#5B6470] shrink-0">
                                        {doc.format}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </section>

            {/* 8. DUK */}
            <section className="pt-8 sm:pt-16">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 space-y-4">
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-[#11161B] leading-tight text-balance">
                        {content.faq.title}
                    </h2>
                    <div className="border-t border-[#D5CFC3] divide-y divide-[#D5CFC3]">
                        {content.faq.items.map((item, idx) => {
                            const open = faqOpen === idx;
                            return (
                                <div key={item.q}>
                                    <button
                                        type="button"
                                        aria-expanded={open}
                                        onClick={() => setFaqOpen(open ? -1 : idx)}
                                        className="w-full min-h-[56px] py-4 bg-transparent border-0 text-left cursor-pointer flex items-center justify-between gap-4"
                                    >
                                        <span className="font-bold text-base text-[#11161B]">
                                            {item.q}
                                        </span>
                                        <span
                                            aria-hidden="true"
                                            className="text-xl font-bold text-[#C2410C]"
                                        >
                                            {open ? '−' : '+'}
                                        </span>
                                    </button>
                                    {open && (
                                        <p className="pb-4 max-w-3xl text-sm text-[#3A4652] leading-relaxed">
                                            {item.a}
                                        </p>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* 9. Užklausa */}
            <RfqSection
                locale={locale}
                defaultModelSlug={queryModel}
                defaultMode={queryMode}
            />
        </div>
    );
}
