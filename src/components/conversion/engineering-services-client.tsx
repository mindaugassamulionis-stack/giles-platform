'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ZoomIn } from 'lucide-react';
import {
    GILES_ENGINEERING_SERVICES,
    GILES_SYSTEM_PACKAGES,
    type EngineeringServiceItem,
} from '../../lib/giles-packages-data';
import { apiUrl, assetUrl } from '../../lib/api';
import { useStorefrontConfig } from '../storefront-config-provider';
import { formatCatalogCount } from '../../lib/w121-honest-commerce';
import { EmailLink, TextWithEmail } from '../email';

interface ServiceLightboxItem {
    imageUrl: string;
    title: string;
    subtitle: string;
    sku?: string;
    brandsLabel?: string;
}

function balanceCopy(text: string): string {
    const words = text.trim().split(/\s+/);
    if (words.length <= 3) return text;
    const lastTwo = words.slice(-2).join('\u00A0');
    if (lastTwo.length > 18) return text;
    return `${words.slice(0, -2).join(' ')} ${lastTwo}`;
}

const SERVICE_SECONDARY_IMAGE_BY_ID: Record<string, string> = {
    'svc-hvac-design': '/images/products/52-151-220.webp',
    'svc-boiler-room-install': '/images/products/egip-degkmpl140pv20.webp',
    'svc-underfloor-plumbing': '/images/products/giles-88-20-5181-d10585f3.webp',
    'svc-hydraulic-balancing': '/images/products/giles-52-265-015-a1e59010.webp',
    'svc-burner-boiler-service': '/images/products/egip-katm39833425.webp',
    'svc-full-bom-takeoff': '/images/products/giles-ksg-eb0735a4.webp',
};

interface EngineeringServicesClientProps {
    locale: string;
    initialServiceId?: string;
    initialPackageId?: string;
    initialAreaM2?: number;
}

export function EngineeringServicesClient({
    locale,
    initialServiceId,
    initialPackageId,
    initialAreaM2,
}: EngineeringServicesClientProps) {
    // W121-A2: live SKU count replaces the hardcoded catalog size.
    const engCountLabel = formatCatalogCount(
        useStorefrontConfig().catalog?.skuCount ?? 0,
        'lt',
    );
    const defaultService =
        GILES_ENGINEERING_SERVICES.find((s) => s.id === initialServiceId) ||
        GILES_ENGINEERING_SERVICES[0];

    const [selectedServiceTitle, setSelectedServiceTitle] = useState<string>(defaultService.title);
    const [selectedPackageId, setSelectedPackageId] = useState<string>(initialPackageId || '');
    const [areaM2, setAreaM2] = useState<number>(initialAreaM2 || 150);
    const [customerName, setCustomerName] = useState<string>('');
    const [customerPhone, setCustomerPhone] = useState<string>('');
    const [customerEmail, setCustomerEmail] = useState<string>('');
    const [customerCity, setCustomerCity] = useState<string>('Vilnius');
    const [customerNotes, setCustomerNotes] = useState<string>('');
    const [submitting, setSubmitting] = useState<boolean>(false);
    const [submitState, setSubmitState] = useState<{
        ok: boolean;
        reference?: string;
        orderId?: string;
        error?: string;
    } | null>(null);
    const [lightboxItem, setLightboxItem] = useState<ServiceLightboxItem | null>(null);

    useEffect(() => {
        if (!lightboxItem) return;
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setLightboxItem(null);
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [lightboxItem]);

    function handleSelectServiceForForm(svc: EngineeringServiceItem) {
        setSelectedServiceTitle(svc.title);
        const formEl = document.getElementById('inzinerijos-uzklausos-forma');
        if (formEl) {
            formEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    async function handleFormSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSubmitting(true);
        setSubmitState(null);
        try {
            const response = await fetch(apiUrl('/api/orders'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: customerName,
                    phone: '',
                    email: customerEmail,
                    city: customerCity,
                    address: customerCity,
                    serviceType: selectedServiceTitle,
                    packageId: selectedPackageId,
                    areaM2,
                    notes: customerNotes,
                }),
            });
            const data = await response.json();
            if (!response.ok || !data.ok) {
                setSubmitState({ ok: false, error: data.error || 'Nepavyko išsiųsti užklausos.' });
            } else {
                setSubmitState({
                    ok: true,
                    reference: data.reference,
                    orderId: data.orderId,
                });
            }
        } catch {
            setSubmitState({ ok: false, error: 'Tinklo klaida. Bandykite dar kartą.' });
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="space-y-8">
            {/* Compact Header Banner above the fold */}
            <header className="rounded-md border border-stone-300 bg-white p-4 flex flex-col lg:flex-row lg:items-end justify-between gap-4">
                <div>
                    <span className="text-xs font-bold text-red-800 block mb-1">
                        <TextWithEmail text={'UAB „Gilės inžinerija“ · El. paštas: info@gilesinzinerija.lt (tik El. paštas)'} />
                    </span>
                    <h1 className="text-xl sm:text-2xl font-bold text-stone-900">
                        Inžinerinės paslaugos, ŠVOK projektavimas ir katilinių montavimas
                    </h1>
                    <p className="text-xs sm:text-sm text-stone-600 mt-1 max-w-3xl">
                        {balanceCopy(
                            `Komplektuojame įrangą iš ${engCountLabel} pozicijų sandėlio ir atliekame ŠVOK projektavimą, katilinių montavimą iki rakto, hidraulinį balansavimą bei servisą.`,
                        )}
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <a
                        href="#inzinerijos-uzklausos-forma"
                        className="rounded-sm bg-[var(--primary)] hover:bg-[var(--brand-accent-hover)] px-3.5 py-2 text-xs font-bold text-white transition-colors min-h-[40px] inline-flex items-center whitespace-nowrap"
                    >
                        Užsakyti paslaugą ir sąmatą
                    </a>
                    <Link
                        href={`/${locale}/paketai`}
                        className="rounded-sm border border-stone-800 bg-transparent hover:bg-stone-900 hover:text-white px-3.5 py-2 text-xs font-bold text-stone-900 transition-colors min-h-[40px] inline-flex items-center whitespace-nowrap"
                    >
                        6 sisteminiai paketai
                    </Link>
                </div>
            </header>

            {/* 6 Engineering & Installation Services Grid (above the fold with 2 equipment photos per card) */}
            <section
                aria-label="6 Inžinerinės ir montavimo paslaugos"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            >
                {GILES_ENGINEERING_SERVICES.map((svc) => {
                    const secondaryImg =
                        SERVICE_SECONDARY_IMAGE_BY_ID[svc.id] || '/images/products/52-151-220.webp';
                    return (
                        <article
                            key={svc.id}
                            data-product-card="true"
                            className="rounded-md border border-stone-300 bg-white p-4 sm:p-5 flex flex-col justify-between"
                        >
                            <div>
                                <div className="relative mb-3 pb-3 border-b border-stone-200">
                                    <div
                                        onClick={() =>
                                            setLightboxItem({
                                                imageUrl: assetUrl(svc.representativeImageUrl),
                                                title: svc.title,
                                                subtitle: svc.description,
                                                sku: svc.representativeSku,
                                                brandsLabel: svc.partnerEquipmentBrands.join(', '),
                                            })
                                        }
                                        className="group relative w-full h-60 sm:h-64 p-3 bg-white flex items-center justify-center overflow-hidden cursor-zoom-in text-left"
                                    >
                                        <img
                                            src={assetUrl(svc.representativeImageUrl)}
                                            alt={svc.title}
                                            className="max-h-full max-w-full object-contain transition-transform duration-300 ease-out group-hover:scale-110 cursor-zoom-in"
                                        />
                                        <button
                                            type="button"
                                            data-testid={`service-image-zoom-${svc.id}`}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setLightboxItem({
                                                    imageUrl: assetUrl(svc.representativeImageUrl),
                                                    title: svc.title,
                                                    subtitle: svc.description,
                                                    sku: svc.representativeSku,
                                                    brandsLabel: svc.partnerEquipmentBrands.join(', '),
                                                });
                                            }}
                                            aria-label={`Padidinti paslaugos įrangos vaizdą: ${svc.title}`}
                                            className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-xs bg-stone-900/90 px-2.5 py-1 text-xs font-semibold text-white opacity-95 group-hover:opacity-100 transition-opacity whitespace-nowrap cursor-zoom-in"
                                        >
                                            <ZoomIn className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                                            <span>Padidinti vaizdą</span>
                                        </button>
                                    </div>

                                    <div className="mt-2.5 flex items-start gap-2.5">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setLightboxItem({
                                                    imageUrl: assetUrl(secondaryImg),
                                                    title: `${svc.title} – sistemos mazgas`,
                                                    subtitle: svc.description,
                                                    sku: svc.representativeSku,
                                                    brandsLabel: svc.partnerEquipmentBrands.join(', '),
                                                })
                                            }
                                            aria-label={`Padidinti papildomo mazgo vaizdą: ${svc.title}`}
                                            className="w-14 h-14 rounded-xs border border-stone-200 bg-white p-1 shrink-0 flex items-center justify-center overflow-hidden cursor-zoom-in"
                                        >
                                            <img
                                                src={assetUrl(secondaryImg)}
                                                alt={`${svc.title} mazgas`}
                                                className="max-h-full max-w-full object-contain hover:scale-125 transition-transform cursor-zoom-in"
                                            />
                                        </button>
                                        <div className="min-w-0 flex-1">
                                            <span className="text-xs font-bold text-[var(--secondary)] block mb-0.5">
                                                {svc.numberLabel} · {svc.leadTimeLabel}
                                            </span>
                                            <h2 className="text-sm sm:text-base font-bold text-stone-900 leading-snug">
                                                {balanceCopy(svc.title)}
                                            </h2>
                                        </div>
                                    </div>
                                </div>

                                <p className="text-xs text-stone-700 leading-relaxed mb-3">
                                    {balanceCopy(svc.description)}
                                </p>

                                <ul className="space-y-1.5 text-xs text-stone-700 border-t border-stone-200 pt-2.5 mb-3">
                                    {svc.deliverables.map((deliv) => (
                                        <li key={deliv} className="flex items-start gap-2">
                                            <span className="font-bold text-[var(--primary)]">·</span>
                                            <span>{balanceCopy(deliv)}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="pt-3 border-t border-stone-200 space-y-2.5">
                                <p className="text-xs text-stone-600">
                                    <strong className="text-stone-900">Įranga:</strong>{' '}
                                    {svc.partnerEquipmentBrands.join(', ')} (SKU:{' '}
                                    <span className="font-mono">{svc.representativeSku}</span>)
                                </p>
                                <button
                                    type="button"
                                    onClick={() => handleSelectServiceForForm(svc)}
                                    className="w-full rounded-sm bg-[var(--primary)] hover:bg-[var(--brand-accent-hover)] px-3.5 py-2.5 text-xs font-bold text-white transition-colors min-h-[42px] whitespace-nowrap"
                                >
                                    Užsakyti paslaugą ir sąmatą
                                </button>
                            </div>
                        </article>
                    );
                })}
            </section>

            {/* Interactive Lead Order Form */}
            <section
                id="inzinerijos-uzklausos-forma"
                aria-label="Gauti inžinieriaus pasiūlymą / Užsakyti montavimą"
                className="rounded-md border border-stone-300 bg-white p-5 md:p-6"
            >
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <div className="lg:col-span-5 space-y-4">
                        <span className="text-xs font-bold text-[var(--primary)] block">
                            Tiesioginė inžinerinė užklausa į užsakymų sistemą
                        </span>
                        <h2 className="text-xl md:text-2xl font-bold text-stone-900">
                            {balanceCopy('Gauti inžinieriaus pasiūlymą arba užsakyti montavimą')}
                        </h2>
                        <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                            {balanceCopy(
                                'Užpildykite trumpą objekto formą – Jūsų užklausa iškart registruojama mūsų užsakymų valdymo sistemoje ir perduodama atsakingam UAB „Gilės inžinerija“ projektų ar serviso inžinieriui.',
                            )}
                        </p>

                        <div className="border-t border-stone-200 pt-4 space-y-2.5 text-xs text-stone-700">
                            <p>
                                <strong className="text-stone-900">Projektavimas, katilinės, komplektavimas ir tiekimas (tik El. paštas):</strong>{' '}
                                <EmailLink email="info@gilesinzinerija.lt" className="font-mono font-bold text-[var(--primary)] hover:underline" />
                            </p>
                        </div>
                    </div>

                    <div className="lg:col-span-7">
                        {submitState?.ok ? (
                            <div className="rounded-sm border border-emerald-300 bg-emerald-50/60 p-5 space-y-3">
                                <h3 className="text-base font-bold text-emerald-900">
                                    Inžinerinė užklausa sėkmingai užregistruota (Nr. {submitState.reference})
                                </h3>
                                <p className="text-xs sm:text-sm text-stone-700 leading-relaxed">
                                    Jūsų užsakymas (ID: <span className="font-mono">{submitState.orderId}</span>) įrašytas į sistemą. Inžinierius susisieks su Jumis nurodytu el. paštu per 2–24 val.
                                </p>
                                <button
                                    type="button"
                                    onClick={() => setSubmitState(null)}
                                    className="rounded-sm bg-stone-900 px-4 py-2.5 text-xs font-bold text-white min-h-[42px] whitespace-nowrap"
                                >
                                    Pateikti dar vieną užklausą
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleFormSubmit} className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                    <div>
                                        <label htmlFor="eng-service-select" className="block text-xs font-bold text-stone-800 mb-1">
                                            Pasirinkite reikiamą inžinerinę paslaugą *
                                        </label>
                                        <select
                                            id="eng-service-select"
                                            value={selectedServiceTitle}
                                            onChange={(e) => setSelectedServiceTitle(e.target.value)}
                                            className="w-full rounded-sm border border-stone-300 bg-white px-3 py-2.5 text-xs sm:text-sm text-stone-900 min-h-[44px]"
                                        >
                                            {GILES_ENGINEERING_SERVICES.map((svc) => (
                                                <option key={svc.id} value={svc.title}>
                                                    {svc.numberLabel}: {svc.title}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label htmlFor="eng-package-select" className="block text-xs font-bold text-stone-800 mb-1">
                                            Domina paruoštas įrangos paketas (neprivaloma)
                                        </label>
                                        <select
                                            id="eng-package-select"
                                            value={selectedPackageId}
                                            onChange={(e) => setSelectedPackageId(e.target.value)}
                                            className="w-full rounded-sm border border-stone-300 bg-white px-3 py-2.5 text-xs sm:text-sm text-stone-900 min-h-[44px]"
                                        >
                                            <option value="">Tik inžinerinė paslauga / individuali sąmata</option>
                                            {GILES_SYSTEM_PACKAGES.map((pkg) => (
                                                <option key={pkg.id} value={pkg.id}>
                                                    {pkg.numberLabel}: {pkg.title}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                    <div>
                                        <label htmlFor="eng-name" className="block text-xs font-bold text-stone-800 mb-1">
                                            Vardas arba įmonė *
                                        </label>
                                        <input
                                            id="eng-name"
                                            type="text"
                                            required
                                            value={customerName}
                                            onChange={(e) => setCustomerName(e.target.value)}
                                            placeholder="Vardas Pavardė / UAB"
                                            className="w-full rounded-sm border border-stone-300 bg-white px-3 py-2.5 text-sm text-stone-900 placeholder:text-stone-600 min-h-[44px]"
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="eng-email" className="block text-xs font-bold text-stone-800 mb-1">
                                            El. paštas * (tik El. paštas)
                                        </label>
                                        <input
                                            id="eng-email"
                                            type="email"
                                            required
                                            value={customerEmail}
                                            onChange={(e) => setCustomerEmail(e.target.value)}
                                            placeholder="vardas@imone.lt"
                                            className="w-full rounded-sm border border-stone-300 bg-white px-3 py-2.5 text-sm text-stone-900 placeholder:text-stone-600 min-h-[44px]"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                    <div>
                                        <label htmlFor="eng-city" className="block text-xs font-bold text-stone-800 mb-1">
                                            Miestas / savivaldybė *
                                        </label>
                                        <input
                                            id="eng-city"
                                            type="text"
                                            required
                                            value={customerCity}
                                            onChange={(e) => setCustomerCity(e.target.value)}
                                            placeholder="Vilnius / Kaunas / Klaipėda"
                                            className="w-full rounded-sm border border-stone-300 bg-white px-3 py-2.5 text-sm text-stone-900 placeholder:text-stone-600 min-h-[44px]"
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="eng-area" className="block text-xs font-bold text-stone-800 mb-1">
                                            Pastato ar šildomas plotas (m²)
                                        </label>
                                        <input
                                            id="eng-area"
                                            type="number"
                                            min={20}
                                            max={10000}
                                            value={areaM2}
                                            onChange={(e) => setAreaM2(Number(e.target.value))}
                                            className="w-full rounded-sm border border-stone-300 bg-white px-3 py-2.5 text-sm text-stone-900 min-h-[44px]"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="eng-notes" className="block text-xs font-bold text-stone-800 mb-1">
                                        Objekto situacija, esamas katilas arba reikalingi darbai
                                    </label>
                                    <textarea
                                        id="eng-notes"
                                        rows={3}
                                        value={customerNotes}
                                        onChange={(e) => setCustomerNotes(e.target.value)}
                                        placeholder="Aprašykite objektą, esamą katilą ar degiklį, arba nurodykite reikalingus projektavimo / montavimo darbus..."
                                        className="w-full rounded-sm border border-stone-300 bg-white px-3 py-2 text-xs sm:text-sm text-stone-900 placeholder:text-stone-600"
                                    />
                                </div>

                                {submitState?.error && (
                                    <p className="text-xs font-bold text-red-700">{submitState.error}</p>
                                )}

                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full rounded-sm bg-[var(--primary)] hover:bg-[var(--brand-accent-hover)] px-5 py-3 text-xs sm:text-sm font-bold text-white transition-colors min-h-[46px] whitespace-nowrap"
                                >
                                    {submitting
                                        ? 'Siunčiama užklausa...'
                                        : 'Užsakyti paslaugą ir sąmatą'}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </section>

            {/* Interactive Full-Screen Image Zoom Lightbox Modal */}
            {lightboxItem && (
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-label={lightboxItem.title}
                    data-testid="image-zoom-lightbox"
                    onClick={() => setLightboxItem(null)}
                    className="fixed inset-0 z-50 bg-stone-900/80 flex items-center justify-center p-4 overflow-y-auto"
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className="w-full max-w-3xl rounded-md border border-stone-300 bg-white p-4 sm:p-6 shadow-md"
                    >
                        <div className="flex items-start justify-between gap-3 border-b border-stone-200 pb-3 mb-4">
                            <div>
                                {lightboxItem.brandsLabel && (
                                    <span className="text-xs font-bold text-[var(--primary)] block">
                                        {lightboxItem.brandsLabel}
                                        {lightboxItem.sku ? ` · SKU: ${lightboxItem.sku}` : ''}
                                    </span>
                                )}
                                <h3 className="text-base sm:text-lg font-bold text-stone-900 mt-0.5">
                                    {lightboxItem.title}
                                </h3>
                            </div>
                            <button
                                type="button"
                                data-testid="image-zoom-lightbox-close"
                                onClick={() => setLightboxItem(null)}
                                className="px-3.5 py-2 text-xs font-bold text-stone-800 border border-stone-300 rounded-xs hover:bg-stone-100 min-h-[40px] whitespace-nowrap shrink-0"
                            >
                                × Uždaryti
                            </button>
                        </div>

                        <div className="w-full h-[360px] sm:h-[480px] bg-white border border-stone-200 rounded-xs p-4 flex items-center justify-center overflow-hidden">
                            <img
                                src={lightboxItem.imageUrl}
                                alt={lightboxItem.title}
                                width={800}
                                height={800}
                                className="max-h-full max-w-full object-contain"
                            />
                        </div>

                        <div className="mt-4 pt-3 border-t border-stone-200 text-xs text-stone-700 leading-relaxed">
                            <p>{lightboxItem.subtitle}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
