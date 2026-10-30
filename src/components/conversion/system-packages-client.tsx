'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ZoomIn } from 'lucide-react';
import {
    GILES_SYSTEM_PACKAGES,
    UNDERFLOOR_AREA_PRESETS,
    getLocalizedSystemPackages,
    getLocalizedUnderfloorPresets,
    computePackageTotalEur,
    type PackageComponentItem,
    type SystemPackageOffer,
} from '../../lib/giles-packages-data';
import { HeatingSystemCalculator } from './heating-system-calculator';
import { useCart } from '../../store/cart';
import { formatEur } from '../../lib/conversion';
import { apiUrl, assetUrl } from '../../lib/api';
import { resolveAppLocale } from '../../i18n/storefront-ui-copy';
import type { AppLocale } from '../../i18n/routing';
import { trackEvent } from '../analytics';

void GILES_SYSTEM_PACKAGES;
void UNDERFLOOR_AREA_PRESETS;

interface LightboxPreviewItem {
    imageUrl: string;
    title: string;
    subtitle: string;
    sku?: string;
    brand?: string;
    priceLabel?: string;
}

function balanceCopy(text: string): string {
    const words = text.trim().split(/\s+/);
    if (words.length <= 3) return text;
    const lastTwo = words.slice(-2).join('\u00A0');
    if (lastTwo.length > 18) return text;
    return `${words.slice(0, -2).join(' ')} ${lastTwo}`;
}

function formatAmountNoSymbol(val: number): string {
    return val.toLocaleString('lt-LT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const PACKAGES_UI_COPY: Record<
    AppLocale,
    {
        headerEyebrow: string;
        headerTitle: string;
        headerSubtitle: string;
        calcBtn: string;
        engBtn: string;
        sectionAria: string;
        vatSuffix: string;
        zoomBtn: string;
        zoomAriaPrefix: string;
        zoomCompAriaPrefix: string;
        areaSwitcherLabel: string;
        presetSummary: (loops: number, pipeM: number) => string;
        bomHeading: (count: number) => string;
        engineerNoteLabel: string;
        pkgPriceLabel: string;
        addedToCartBtn: string;
        addToCartBtn: string;
        orderWithInstallBtn: string;
        defaultQuoteNote: (title: string) => string;
        serviceTypePrefix: string;
        submitFailedError: string;
        networkError: string;
        modalEyebrow: string;
        closeBtn: string;
        modalCloseX: string;
        successHeading: (ref?: string) => string;
        successBody: string;
        backToPackagesBtn: string;
        nameLabel: string;
        namePlaceholder: string;
        emailLabel: string;
        emailPlaceholder: string;
        cityLabel: string;
        cityPlaceholder: string;
        notesLabel: string;
        cancelBtn: string;
        submittingBtn: string;
        confirmQuoteBtn: string;
    }
> = {
    lt: {
        headerEyebrow: 'UAB „Gilės inžinerija“ · El. paštas: info@gilesinzinerija.lt · Tel. +370 611 19158',
        headerTitle: 'Sisteminiai šildymo ir katilinių paketai',
        headerSubtitle:
            '7 inžineriškai suderinti katilinių, šilumos siurblių, grindinio šildymo, saulės kolektorių ir renovacijos paketai iš mūsų sandėlio su tiesioginiu įdėjimu į krepšelį arba montavimu iki rakto.',
        calcBtn: 'Katilinės skaičiuoklė',
        engBtn: 'Inžinerija ir montavimas',
        sectionAria: '7 Sisteminiai šildymo ir katilinių paketai',
        vatSuffix: 'EUR su PVM',
        zoomBtn: 'Padidinti vaizdą',
        zoomAriaPrefix: 'Padidinti vaizdą:',
        zoomCompAriaPrefix: 'Padidinti komponento vaizdą:',
        areaSwitcherLabel: 'Pasirinkite šildomą plotą (komplekto perjungiklis):',
        presetSummary: (loops, pipeM) =>
            `Parinkta: ${loops} kontūrų Comisa kolektorius ir ${pipeM} m PEX-AL-PEX vamzdžio.`,
        bomHeading: (count) => `Komplekto sudėtis (${count} pozicijos, kaina EUR su PVM):`,
        engineerNoteLabel: 'Inžinieriaus pastaba:',
        pkgPriceLabel: 'Komplekto kaina (EUR su PVM):',
        addedToCartBtn: 'Paketas pridėtas į krepšelį',
        addToCartBtn: 'Įdėti visą paketą į krepšelį',
        orderWithInstallBtn: 'Užsakyti su projektavimu ir montavimu',
        defaultQuoteNote: (title) =>
            `Pageidauju užsakyti paketą „${title}“ su UAB „Gilės inžinerija“ projektavimu ir montavimu iki rakto.`,
        serviceTypePrefix: 'Paketas su projektavimu ir montavimu:',
        submitFailedError: 'Nepavyko išsiųsti užklausos.',
        networkError: 'Tinklo klaida. Bandykite dar kartą.',
        modalEyebrow: 'UAB „Gilės inžinerija“ · Projektavimo ir montavimo užklausa',
        closeBtn: 'Uždaryti',
        modalCloseX: '× Uždaryti',
        successHeading: (ref) => `Užklausa priimta ir perduota inžinieriui (Nr. ${ref || 'OK'}).`,
        successBody:
            'Jūsų pasirinktas paketas užregistruotas sistemoje. Inžinierius susisieks su Jumis per 2–24 val. dėl objekto apžiūros, projekto ir montavimo darbų sąmatos.',
        backToPackagesBtn: 'Grįžti į sisteminius paketus',
        nameLabel: 'Vardas arba įmonė *',
        namePlaceholder: 'Vardas Pavardė / UAB',
        emailLabel: 'El. paštas *',
        emailPlaceholder: 'vardas@imone.lt',
        cityLabel: 'Miestas / objekto vieta *',
        cityPlaceholder: 'Vilnius / Kaunas / rajonas',
        notesLabel: 'Objekto duomenys ir pageidaujami darbai',
        cancelBtn: 'Atšaukti',
        submittingBtn: 'Siunčiama...',
        confirmQuoteBtn: 'Patvirtinti paketo užklausą',
    },
    en: {
        headerEyebrow: 'UAB „Gilės inžinerija“ · Email: info@gilesinzinerija.lt · Tel. +370 611 19158',
        headerTitle: 'Complete Heating & Boiler Room System Packages',
        headerSubtitle:
            '7 engineer-matched pellet boiler room, heat pump, underfloor heating, solar thermal, and hydronic balancing packages from our warehouse with 1-click cart add or turnkey installation.',
        calcBtn: 'Boiler Room Calculator',
        engBtn: 'Engineering & Installation',
        sectionAria: '7 Complete Heating & Boiler Room System Packages',
        vatSuffix: 'EUR incl. VAT',
        zoomBtn: 'Zoom image',
        zoomAriaPrefix: 'Zoom image:',
        zoomCompAriaPrefix: 'Zoom component image:',
        areaSwitcherLabel: 'Select heated floor area (package preset switcher):',
        presetSummary: (loops, pipeM) =>
            `Selected: ${loops}-loop Comisa manifold and ${pipeM} m of PEX-AL-PEX pipe.`,
        bomHeading: (count) => `Included BOM components (${count} items, price EUR incl. VAT):`,
        engineerNoteLabel: 'Engineer note:',
        pkgPriceLabel: 'Package price (EUR incl. VAT):',
        addedToCartBtn: 'Package added to cart',
        addToCartBtn: 'Add complete package to cart',
        orderWithInstallBtn: 'Order with design & turnkey installation',
        defaultQuoteNote: (title) =>
            `I would like to order package "${title}" with UAB „Gilės inžinerija“ engineering design and turnkey installation.`,
        serviceTypePrefix: 'Package with design & installation:',
        submitFailedError: 'Failed to submit inquiry.',
        networkError: 'Network error. Please try again.',
        modalEyebrow: 'UAB „Gilės inžinerija“ · Design & Installation Quote Request',
        closeBtn: 'Close',
        modalCloseX: '× Close',
        successHeading: (ref) => `Request received and assigned to an engineer (Ref. ${ref || 'OK'}).`,
        successBody:
            'Your selected system package has been logged. Our engineer will contact you within 2–24 hours regarding site inspection, engineering design, and installation quote.',
        backToPackagesBtn: 'Back to system packages',
        nameLabel: 'Name or company *',
        namePlaceholder: 'Full Name / Company Ltd.',
        emailLabel: 'Email address *',
        emailPlaceholder: 'name@company.com',
        cityLabel: 'City / project location *',
        cityPlaceholder: 'Vilnius / Kaunas / district',
        notesLabel: 'Building details & requested installation scope',
        cancelBtn: 'Cancel',
        submittingBtn: 'Submitting...',
        confirmQuoteBtn: 'Confirm package inquiry',
    },
    pl: {
        headerEyebrow: 'UAB „Gilės inžinerija“ · E-mail: info@gilesinzinerija.lt · Tel. +370 611 19158',
        headerTitle: 'Systemowe pakiety grzewcze i kotłowniane',
        headerSubtitle:
            '7 inżynieryjnie dobranych pakietów kotłowni, pomp ciepła, ogrzewania podłogowego, kolektorów słonecznych i renowacji z naszego magazynu – z dodaniem do koszyka lub montażem pod klucz.',
        calcBtn: 'Kalkulator kotłowni',
        engBtn: 'Inżynieria i montaż',
        sectionAria: '7 systemowych pakietów grzewczych i kotłownianych',
        vatSuffix: 'EUR z VAT',
        zoomBtn: 'Powiększ zdjęcie',
        zoomAriaPrefix: 'Powiększ zdjęcie:',
        zoomCompAriaPrefix: 'Powiększ zdjęcie elementu:',
        areaSwitcherLabel: 'Wybierz ogrzewaną powierzchnię (przełącznik zestawu):',
        presetSummary: (loops, pipeM) =>
            `Wybrano: ${loops}-obiegowy rozdzielacz Comisa oraz ${pipeM} m rury PEX-AL-PEX.`,
        bomHeading: (count) => `Skład pakietu (${count} pozycji, cena EUR z VAT):`,
        engineerNoteLabel: 'Uwaga inżyniera:',
        pkgPriceLabel: 'Cena pakietu (EUR z VAT):',
        addedToCartBtn: 'Pakiet dodany do koszyka',
        addToCartBtn: 'Dodaj cały pakiet do koszyka',
        orderWithInstallBtn: 'Zamów z projektem i montażem',
        defaultQuoteNote: (title) =>
            `Chcę zamówić pakiet „${title}” wraz z projektem i montażem pod klucz przez UAB „Gilės inžinerija”.`,
        serviceTypePrefix: 'Pakiet z projektem i montażem:',
        submitFailedError: 'Nie udało się wysłać zapytania.',
        networkError: 'Błąd sieci. Spróbuj ponownie.',
        modalEyebrow: 'UAB „Gilės inžinerija“ · Zapytanie o projekt i montaż',
        closeBtn: 'Zamknij',
        modalCloseX: '× Zamknij',
        successHeading: (ref) => `Zapytanie przyjęte i przekazane inżynierowi (Nr ${ref || 'OK'}).`,
        successBody:
            'Wybrany pakiet został zarejestrowany w systemie. Inżynier skontaktuje się z Państwem w ciągu 2–24 godz. w sprawie wizji lokalnej, projektu i wyceny montażu.',
        backToPackagesBtn: 'Powrót do pakietów systemowych',
        nameLabel: 'Imię lub firma *',
        namePlaceholder: 'Imię i Nazwisko / Firma',
        emailLabel: 'E-mail *',
        emailPlaceholder: 'imie@firma.pl',
        cityLabel: 'Miasto / lokalizacja obiektu *',
        cityPlaceholder: 'Wilno / Kowno / Suwałki',
        notesLabel: 'Dane obiektu i oczekiwany zakres prac',
        cancelBtn: 'Anuluj',
        submittingBtn: 'Wysyłanie...',
        confirmQuoteBtn: 'Potwierdź zapytanie o pakiet',
    },
    ru: {
        headerEyebrow: 'UAB „Gilės inžinerija“ · Эл. почта: info@gilesinzinerija.lt · Тел. +370 611 19158',
        headerTitle: 'Системные пакеты отопления и котельных',
        headerSubtitle:
            '7 инженерно согласованных пакетов котельных, тепловых насосов, теплого пола, гелиосистем и реновации с нашего склада с прямым добавлением в корзину или монтажом под ключ.',
        calcBtn: 'Калькулятор котельной',
        engBtn: 'Инженерия и монтаж',
        sectionAria: '7 системных пакетов отопления и котельных',
        vatSuffix: 'EUR с НДС',
        zoomBtn: 'Увеличить фото',
        zoomAriaPrefix: 'Увеличить фото:',
        zoomCompAriaPrefix: 'Увеличить фото компонента:',
        areaSwitcherLabel: 'Выберите отапливаемую площадь (переключатель комплекта):',
        presetSummary: (loops, pipeM) =>
            `Выбрано: коллектор Comisa на ${loops} контуров и ${pipeM} м трубы PEX-AL-PEX.`,
        bomHeading: (count) => `Состав комплекта (${count} поз., цена EUR с НДС):`,
        engineerNoteLabel: 'Примечание инженера:',
        pkgPriceLabel: 'Цена пакета (EUR с НДС):',
        addedToCartBtn: 'Пакет добавлен в корзину',
        addToCartBtn: 'Добавить весь пакет в корзину',
        orderWithInstallBtn: 'Заказать с проектированием и монтажом',
        defaultQuoteNote: (title) =>
            `Желаю заказать пакет «${title}» с проектированием и монтажом под ключ от UAB «Gilės inžinerija».`,
        serviceTypePrefix: 'Пакет с проектированием и монтажом:',
        submitFailedError: 'Не удалось отправить запрос.',
        networkError: 'Ошибка сети. Попробуйте еще раз.',
        modalEyebrow: 'UAB „Gilės inžinerija“ · Запрос на проектирование и монтаж',
        closeBtn: 'Закрыть',
        modalCloseX: '× Закрыть',
        successHeading: (ref) => `Заявка принята и передана инженеру (№ ${ref || 'OK'}).`,
        successBody:
            'Выбранный вами пакет зарегистрирован в системе. Инженер свяжется с вами в течение 2–24 ч. для согласования осмотра объекта, проекта и сметы монтажа.',
        backToPackagesBtn: 'Вернуться к системным пакетам',
        nameLabel: 'Имя или компания *',
        namePlaceholder: 'Имя Фамилия / Компания',
        emailLabel: 'Эл. почта *',
        emailPlaceholder: 'name@company.lt',
        cityLabel: 'Город / местоположение объекта *',
        cityPlaceholder: 'Вильнюс / Каунас / район',
        notesLabel: 'Данные объекта и желаемые работы',
        cancelBtn: 'Отмена',
        submittingBtn: 'Отправка...',
        confirmQuoteBtn: 'Подтвердить заявку на пакет',
    },
};

export function SystemPackagesClient({ locale: localeProp }: { locale: string }) {
    const rawPathname = usePathname() || '';
    const urlMatch = rawPathname.match(/^\/(lt|en|pl|ru)(?=\/|$)/i);
    const locale = resolveAppLocale(urlMatch ? urlMatch[1] : localeProp);
    const ui = PACKAGES_UI_COPY[locale] || PACKAGES_UI_COPY.lt;

    const localizedPackages = getLocalizedSystemPackages(locale);
    const localizedUnderfloorPresets = getLocalizedUnderfloorPresets(locale);

    const [underfloorArea, setUnderfloorArea] = useState<50 | 100 | 150 | 200>(100);
    const [addedPackageId, setAddedPackageId] = useState<string | null>(null);
    const [quoteModalPkg, setQuoteModalPkg] = useState<SystemPackageOffer | null>(null);
    const [quoteComponents, setQuoteComponents] = useState<PackageComponentItem[]>([]);
    const [quoteAreaM2, setQuoteAreaM2] = useState<number>(150);
    const [quoteNotes, setQuoteNotes] = useState<string>('');
    const [customerName, setCustomerName] = useState<string>('');
    const [customerEmail, setCustomerEmail] = useState<string>('');
    const [customerCity, setCustomerCity] = useState<string>('Vilnius');
    const [submitting, setSubmitting] = useState<boolean>(false);
    const [submitResult, setSubmitResult] = useState<{
        ok: boolean;
        reference?: string;
        orderId?: string;
        error?: string;
    } | null>(null);
    const [lightboxItem, setLightboxItem] = useState<LightboxPreviewItem | null>(null);

    useEffect(() => {
        if (!lightboxItem) return;
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setLightboxItem(null);
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [lightboxItem]);

    const addItem = useCart((s) => s.addItem);
    const openCart = useCart((s) => s.openCart);

    function getActiveComponents(pkg: SystemPackageOffer): PackageComponentItem[] {
        if (pkg.id === 'pkg-underfloor-comisa') {
            const preset =
                localizedUnderfloorPresets.find((p) => p.areaM2 === underfloorArea) ||
                localizedUnderfloorPresets[1];
            return preset.components;
        }
        return pkg.components;
    }

    function handleAddPackageToCart(pkg: SystemPackageOffer) {
        const comps = getActiveComponents(pkg);
        const totalEur = computePackageTotalEur(comps);
        for (const comp of comps) {
            addItem({
                id: comp.variantId,
                productId: comp.productId,
                variantId: comp.variantId,
                name: comp.name,
                price: comp.priceEur,
                sku: comp.sku,
                image: assetUrl(comp.imageUrl),
                quantity: comp.quantity,
            });
        }
        trackEvent('AddToCart', {
            content_ids: comps.map((c) => c.sku),
            content_name: pkg.title,
            content_type: 'product_group',
            value: totalEur,
            currency: 'EUR',
            num_items: comps.reduce((sum, c) => sum + c.quantity, 0),
        });
        setAddedPackageId(pkg.id);
        openCart();
        setTimeout(() => setAddedPackageId(null), 2400);
    }

    function openQuoteForPackage(pkg: SystemPackageOffer, prefilledNote?: string, customArea?: number) {
        const comps = getActiveComponents(pkg);
        setQuoteModalPkg(pkg);
        setQuoteComponents(comps);
        setQuoteAreaM2(customArea || (pkg.id === 'pkg-underfloor-comisa' ? underfloorArea : 150));
        setQuoteNotes(prefilledNote || ui.defaultQuoteNote(pkg.title));
        setSubmitResult(null);
    }

    async function handleQuoteSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!quoteModalPkg) return;
        setSubmitting(true);
        setSubmitResult(null);
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
                    serviceType: `${ui.serviceTypePrefix} ${quoteModalPkg.title}`,
                    packageId: quoteModalPkg.id,
                    areaM2: quoteAreaM2,
                    notes: quoteNotes,
                    items: quoteComponents.map((c) => ({
                        sku: c.sku,
                        title: c.name,
                        quantity: c.quantity,
                        unitPrice: c.priceEur,
                    })),
                }),
            });
            const data = await response.json();
            if (!response.ok || !data.ok) {
                setSubmitResult({ ok: false, error: data.error || ui.submitFailedError });
            } else {
                setSubmitResult({
                    ok: true,
                    reference: data.reference,
                    orderId: data.orderId,
                });
            }
        } catch {
            setSubmitResult({ ok: false, error: ui.networkError });
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="space-y-8">
            {/* Compact Header above the fold */}
            <header className="rounded-md border border-stone-300 bg-white p-4 flex flex-col lg:flex-row lg:items-end justify-between gap-4">
                <div>
                    <span className="text-xs font-bold text-red-800 block mb-1">
                        {ui.headerEyebrow}
                    </span>
                    <h1 className="text-xl sm:text-2xl font-bold text-stone-900">
                        {ui.headerTitle}
                    </h1>
                    <p className="text-xs sm:text-sm text-stone-600 mt-1 max-w-3xl">
                        {balanceCopy(ui.headerSubtitle)}
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <a
                        href="#sildymo-skaiciuokle"
                        className="rounded-sm border-2 border-[var(--primary)] bg-transparent hover:bg-[var(--primary)] hover:text-white px-3.5 py-2 text-xs font-bold text-stone-900 transition-colors min-h-[40px] inline-flex items-center whitespace-nowrap"
                    >
                        {ui.calcBtn}
                    </a>
                    <Link
                        href={`/${locale}/inzinerija`}
                        className="rounded-sm border border-stone-800 bg-transparent hover:bg-stone-900 hover:text-white px-3.5 py-2 text-xs font-bold text-stone-900 transition-colors min-h-[40px] inline-flex items-center whitespace-nowrap"
                    >
                        {ui.engBtn}
                    </Link>
                </div>
            </header>

            {/* 7 System Packages Grid */}
            <section
                aria-label={ui.sectionAria}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
            >
                {localizedPackages.map((pkg) => {
                    const activeComps = getActiveComponents(pkg);
                    const totalEur = computePackageTotalEur(activeComps);
                    const isUnderfloor = pkg.id === 'pkg-underfloor-comisa';
                    const activePreset = isUnderfloor
                        ? localizedUnderfloorPresets.find((p) => p.areaM2 === underfloorArea) ||
                          localizedUnderfloorPresets[1]
                        : null;

                    return (
                        <article
                            key={pkg.id}
                            data-product-card="true"
                            className="rounded-md border border-stone-300 bg-white p-4 sm:p-5 flex flex-col justify-between"
                        >
                            <div>
                                {/* Main Zoomable Package Image + Header */}
                                <div
                                    onClick={() =>
                                        setLightboxItem({
                                            imageUrl: assetUrl(pkg.heroImageUrl),
                                            title: pkg.title,
                                            subtitle: pkg.subtitle,
                                            sku: activeComps[0]?.sku,
                                            brand: pkg.numberLabel,
                                            priceLabel: `${formatAmountNoSymbol(totalEur)} ${ui.vatSuffix}`,
                                        })
                                    }
                                    className="group relative w-full h-60 sm:h-64 p-3 mb-3 border-b border-stone-200 bg-white flex items-center justify-center overflow-hidden cursor-zoom-in text-left"
                                >
                                    <img
                                        src={assetUrl(pkg.heroImageUrl)}
                                        alt={pkg.title}
                                        className="max-h-full max-w-full object-contain transition-transform duration-300 ease-out group-hover:scale-110 cursor-zoom-in"
                                    />
                                    <button
                                        type="button"
                                        data-testid={`package-image-zoom-${pkg.id}`}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setLightboxItem({
                                                imageUrl: assetUrl(pkg.heroImageUrl),
                                                title: pkg.title,
                                                subtitle: pkg.subtitle,
                                                sku: activeComps[0]?.sku,
                                                brand: pkg.numberLabel,
                                                priceLabel: `${formatAmountNoSymbol(totalEur)} ${ui.vatSuffix}`,
                                            });
                                        }}
                                        aria-label={`${ui.zoomAriaPrefix} ${pkg.title}`}
                                        className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-xs bg-stone-900/90 px-2.5 py-1 text-xs font-semibold text-white opacity-95 group-hover:opacity-100 transition-opacity whitespace-nowrap cursor-zoom-in"
                                    >
                                        <ZoomIn className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                                        <span>{ui.zoomBtn}</span>
                                    </button>
                                </div>

                                <div className="mb-3 pb-3 border-b border-stone-200">
                                    <span className="text-xs font-bold text-[var(--secondary)] block mb-0.5">
                                        {pkg.numberLabel} · {pkg.powerOrScopeBadge}
                                    </span>
                                    <h2 className="text-sm sm:text-base font-bold text-stone-900 leading-snug">
                                        {balanceCopy(pkg.title)}
                                    </h2>
                                </div>

                                <p className="text-xs text-stone-600 leading-relaxed mb-3">
                                    {balanceCopy(pkg.subtitle)}
                                </p>

                                {/* Interactive Area Switcher on Package 3 (Comisa Underfloor Heating) */}
                                {isUnderfloor && (
                                    <div className="mb-3 pb-3 border-b border-stone-200">
                                        <span className="block text-xs font-bold text-stone-900 mb-1.5">
                                            {ui.areaSwitcherLabel}
                                        </span>
                                        <div className="grid grid-cols-4 gap-1.5">
                                            {localizedUnderfloorPresets.map((preset) => (
                                                <button
                                                    key={preset.areaM2}
                                                    type="button"
                                                    onClick={() => setUnderfloorArea(preset.areaM2)}
                                                    className={`px-2 py-1.5 text-xs font-bold rounded-xs transition-colors min-h-[36px] whitespace-nowrap ${
                                                        underfloorArea === preset.areaM2
                                                            ? 'border-2 border-[var(--primary)] bg-transparent text-red-800'
                                                            : 'border border-stone-300 bg-transparent text-stone-800 hover:border-stone-900'
                                                    }`}
                                                >
                                                    {preset.areaM2} m²
                                                </button>
                                            ))}
                                        </div>
                                        {activePreset && (
                                            <p className="text-xs text-emerald-800 font-semibold mt-1.5">
                                                {balanceCopy(
                                                    ui.presetSummary(
                                                        activePreset.loopsCount,
                                                        activePreset.pipeLengthM,
                                                    ),
                                                )}
                                            </p>
                                        )}
                                    </div>
                                )}

                                {/* Included Components List with Real SKUs & Studio Photos */}
                                <div className="mb-3">
                                    <span className="block text-xs font-bold text-stone-900 mb-1.5">
                                        {ui.bomHeading(activeComps.length)}
                                    </span>
                                    <ul className="divide-y divide-stone-200 border-t border-b border-stone-200">
                                        {activeComps.map((comp) => (
                                            <li key={`${pkg.id}-${comp.sku}`} className="py-2 flex items-start gap-2.5 text-xs">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setLightboxItem({
                                                            imageUrl: assetUrl(comp.imageUrl),
                                                            title: comp.name,
                                                            subtitle: comp.specSummary || `${comp.brand} · SKU: ${comp.sku}`,
                                                            sku: comp.sku,
                                                            brand: comp.brand,
                                                            priceLabel: `${formatAmountNoSymbol(comp.priceEur)} EUR`,
                                                        })
                                                    }
                                                    aria-label={`${ui.zoomCompAriaPrefix} ${comp.name}`}
                                                    className="w-14 h-14 rounded-xs border border-stone-200 bg-white p-1 shrink-0 mt-0.5 flex items-center justify-center overflow-hidden cursor-zoom-in"
                                                >
                                                    <img
                                                        src={assetUrl(comp.imageUrl)}
                                                        alt={comp.name}
                                                        className="max-h-full max-w-full object-contain hover:scale-125 transition-transform cursor-zoom-in"
                                                    />
                                                </button>
                                                <div className="min-w-0 flex-1">
                                                    <span className="font-semibold text-stone-900 leading-snug block">
                                                        {balanceCopy(comp.name)}
                                                    </span>
                                                    <span className="text-xs text-stone-600 block mt-0.5">
                                                        {comp.brand} ·{' '}
                                                        <Link
                                                            href={`/${locale}/products/${comp.slug}`}
                                                            className="font-mono font-semibold text-[var(--primary)] hover:underline whitespace-nowrap"
                                                        >
                                                            {comp.sku}
                                                        </Link>
                                                    </span>
                                                </div>
                                                <div className="text-right shrink-0 tabular-nums">
                                                    <span className="font-bold text-stone-900 block whitespace-nowrap">
                                                        {comp.quantity} × {formatAmountNoSymbol(comp.priceEur)}
                                                    </span>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <p className="text-xs text-stone-600 leading-relaxed mb-3">
                                    <strong className="text-stone-900">{ui.engineerNoteLabel}</strong>{' '}
                                    {balanceCopy(pkg.engineeringNotes)}
                                </p>
                            </div>

                            {/* Package Price & Dual Action Buttons */}
                            <div className="pt-3 border-t border-stone-200 space-y-2">
                                <div className="flex items-baseline justify-between gap-2 mb-1">
                                    <span className="text-xs font-semibold text-stone-600">
                                        {ui.pkgPriceLabel}
                                    </span>
                                    <span className="text-lg font-bold text-stone-900 tabular-nums whitespace-nowrap">
                                        {formatAmountNoSymbol(totalEur)} EUR
                                    </span>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => handleAddPackageToCart(pkg)}
                                    className="w-full rounded-sm bg-[var(--primary)] hover:bg-[var(--brand-accent-hover)] px-3 py-2.5 text-xs font-bold text-white transition-colors min-h-[44px] whitespace-nowrap"
                                >
                                    {addedPackageId === pkg.id ? ui.addedToCartBtn : ui.addToCartBtn}
                                </button>

                                <button
                                    type="button"
                                    onClick={() => openQuoteForPackage(pkg)}
                                    className="w-full rounded-sm border border-stone-800 bg-transparent hover:bg-stone-900 hover:text-white px-3 py-2.5 text-xs font-bold text-stone-900 transition-colors min-h-[44px] whitespace-nowrap"
                                >
                                    {ui.orderWithInstallBtn}
                                </button>
                            </div>
                        </article>
                    );
                })}
            </section>

            {/* Interactive Heating System Calculator */}
            <HeatingSystemCalculator
                locale={locale}
                onRequestQuote={(pkg, note, area) => openQuoteForPackage(pkg, note, area)}
            />

            {/* Engineering & Installation Quote Modal */}
            {quoteModalPkg && (
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="pkg-quote-modal-title"
                    className="fixed inset-0 z-50 bg-stone-900/60 flex items-center justify-center p-4 overflow-y-auto"
                >
                    <div className="w-full max-w-xl rounded-md border border-stone-300 bg-white p-5 sm:p-6 shadow-md">
                        <div className="flex items-start justify-between gap-3 border-b border-stone-200 pb-3 mb-4">
                            <div>
                                <span className="text-xs font-bold text-[var(--primary)] block">
                                    {ui.modalEyebrow}
                                </span>
                                <h3 id="pkg-quote-modal-title" className="text-lg font-bold text-stone-900 mt-0.5">
                                    {quoteModalPkg.title} ({formatEur(computePackageTotalEur(quoteComponents))})
                                </h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setQuoteModalPkg(null)}
                                className="px-3 py-1.5 text-xs font-bold text-stone-700 border border-stone-300 rounded-xs hover:bg-stone-100 min-h-[36px] whitespace-nowrap"
                            >
                                {ui.closeBtn}
                            </button>
                        </div>

                        {submitResult?.ok ? (
                            <div className="space-y-3 py-2">
                                <p className="text-sm font-bold text-emerald-800">
                                    {ui.successHeading(submitResult.reference)}
                                </p>
                                <p className="text-xs text-stone-700 leading-relaxed">
                                    {ui.successBody}
                                </p>
                                <button
                                    type="button"
                                    onClick={() => setQuoteModalPkg(null)}
                                    className="w-full rounded-sm bg-stone-900 px-4 py-2.5 text-xs font-bold text-white min-h-[44px]"
                                >
                                    {ui.backToPackagesBtn}
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleQuoteSubmit} className="space-y-3.5">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label htmlFor="quote-name" className="block text-xs font-bold text-stone-800 mb-1">
                                            {ui.nameLabel}
                                        </label>
                                        <input
                                            id="quote-name"
                                            type="text"
                                            required
                                            value={customerName}
                                            onChange={(e) => setCustomerName(e.target.value)}
                                            placeholder={ui.namePlaceholder}
                                            className="w-full rounded-sm border border-stone-300 px-3 py-2 text-sm text-stone-900 placeholder:text-stone-600"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="quote-email" className="block text-xs font-bold text-stone-800 mb-1">
                                            {ui.emailLabel}
                                        </label>
                                        <input
                                            id="quote-email"
                                            type="email"
                                            required
                                            value={customerEmail}
                                            onChange={(e) => setCustomerEmail(e.target.value)}
                                            placeholder={ui.emailPlaceholder}
                                            className="w-full rounded-sm border border-stone-300 px-3 py-2 text-sm text-stone-900 placeholder:text-stone-600"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="quote-city" className="block text-xs font-bold text-stone-800 mb-1">
                                        {ui.cityLabel}
                                    </label>
                                    <input
                                        id="quote-city"
                                        type="text"
                                        required
                                        value={customerCity}
                                        onChange={(e) => setCustomerCity(e.target.value)}
                                        placeholder={ui.cityPlaceholder}
                                        className="w-full rounded-sm border border-stone-300 px-3 py-2 text-sm text-stone-900 placeholder:text-stone-600"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="quote-notes" className="block text-xs font-bold text-stone-800 mb-1">
                                        {ui.notesLabel}
                                    </label>
                                    <textarea
                                        id="quote-notes"
                                        rows={3}
                                        value={quoteNotes}
                                        onChange={(e) => setQuoteNotes(e.target.value)}
                                        className="w-full rounded-sm border border-stone-300 px-3 py-2 text-xs text-stone-900 placeholder:text-stone-600"
                                    />
                                </div>

                                {submitResult?.error && (
                                    <p className="text-xs font-bold text-red-700">{submitResult.error}</p>
                                )}

                                <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setQuoteModalPkg(null)}
                                        className="rounded-sm border border-stone-300 bg-transparent px-4 py-2.5 text-xs font-bold text-stone-700 min-h-[44px] whitespace-nowrap"
                                    >
                                        {ui.cancelBtn}
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="rounded-sm bg-[var(--primary)] hover:bg-[var(--brand-accent-hover)] px-5 py-2.5 text-xs font-bold text-white min-h-[44px] whitespace-nowrap"
                                    >
                                        {submitting ? ui.submittingBtn : ui.confirmQuoteBtn}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}

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
                                {lightboxItem.brand && (
                                    <span className="text-xs font-bold text-[var(--primary)] block">
                                        {lightboxItem.brand}
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
                                {ui.modalCloseX}
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

                        <div className="mt-4 pt-3 border-t border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-stone-700">
                            <p className="leading-relaxed max-w-xl">{lightboxItem.subtitle}</p>
                            {lightboxItem.priceLabel && (
                                <span className="font-mono font-bold text-sm text-stone-900 shrink-0">
                                    {lightboxItem.priceLabel}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
