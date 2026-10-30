'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLocale } from 'next-intl';
import { Phone, Wrench, ZoomIn, X, CheckCircle2, AlertTriangle } from 'lucide-react';
import { assetUrl, apiUrl } from '../../../lib/api';
import { resolveAppLocale } from '../../../i18n/storefront-ui-copy';
import type { AppLocale } from '../../../i18n/routing';
import { GILES_ENGINEERING_SERVICES } from '../../../lib/giles-packages-data';
import { HeatingSystemCalculator, ENGINEERING_LEAD_ENDPOINT } from '../../../components/conversion/heating-system-calculator';
import {
    GILES_COMPLETED_WORKS,
    GILES_COMPLETED_WORKS_CATEGORIES,
    GILES_SERVICE_PILLARS,
    GILES_BOILER_RETROFIT_CAPABILITIES,
    GILES_CONTAINER_BOILER_SPECS,
    filterCompletedWorksByCategory,
    getLocalizedCompletedWorks,
    getLocalizedCompletedWorksCategories,
    getLocalizedServicePillars,
    getLocalizedBoilerRetrofitCapabilities,
    filterLocalizedCompletedWorksByCategory,
    type CompletedWorkCategoryId,
    type GilesCompletedWorkItem,
} from '../../../lib/giles-completed-works-data';

const LEAD_SUBMIT_ROUTE = '/api/engineering-lead';
void LEAD_SUBMIT_ROUTE;
void GILES_ENGINEERING_SERVICES;
void HeatingSystemCalculator;
void ENGINEERING_LEAD_ENDPOINT;
void GILES_COMPLETED_WORKS;
void GILES_COMPLETED_WORKS_CATEGORIES;
void GILES_SERVICE_PILLARS;
void GILES_BOILER_RETROFIT_CAPABILITIES;
void GILES_CONTAINER_BOILER_SPECS;
void filterCompletedWorksByCategory;

const SPARE_PART_OPTIONS_I18N: Record<
    AppLocale,
    ReadonlyArray<{ sku: string; label: string }>
> = {
    lt: [
        { sku: '', label: 'Nežinau detalės kodo (reikalinga inžinieriaus diagnostika)' },
        { sku: 'MPB-IGN-300', label: 'MPB-IGN-300 · Keraminis uždegimo tenas 300 W (Megatherm / Pelltech)' },
        { sku: 'MPB-PHOTO-01', label: 'MPB-PHOTO-01 · Liepsnos fotoelementas (optinis jutiklis)' },
        { sku: 'MPB-GRATE-35', label: 'MPB-GRATE-35 · Kaitrai atsparios judančios ardelės Inox' },
        { sku: 'ECOMAX-860P', label: 'ECOMAX-860P · Katilo ir degiklio valdiklis Plum ecoMAX' },
        { sku: 'SUNP7-NOZZLE', label: 'SUNP7-NOZZLE · Ferroli SUN P7 / P12 degiklio degimo tūta' },
        { sku: 'A1-16-AUGER', label: 'A1-16-AUGER · Granulių padavimo sraigtas 1,6 m su varikliu' },
    ],
    en: [
        { sku: '', label: 'I do not know the part SKU (engineer diagnostics required)' },
        { sku: 'MPB-IGN-300', label: 'MPB-IGN-300 · 300 W Ceramic Igniter Element (Megatherm / Pelltech)' },
        { sku: 'MPB-PHOTO-01', label: 'MPB-PHOTO-01 · Optical Flame Photo Sensor' },
        { sku: 'MPB-GRATE-35', label: 'MPB-GRATE-35 · Heat-Resistant Inox Moving Grates' },
        { sku: 'ECOMAX-860P', label: 'ECOMAX-860P · Plum ecoMAX Boiler & Burner Controller' },
        { sku: 'SUNP7-NOZZLE', label: 'SUNP7-NOZZLE · Ferroli SUN P7 / P12 Burner Combustion Nozzle' },
        { sku: 'A1-16-AUGER', label: 'A1-16-AUGER · 1.6 m Pellet Feed Auger with Geared Motor' },
    ],
    pl: [
        { sku: '', label: 'Nie znam kodu części (wymagana diagnostyka inżyniera)' },
        { sku: 'MPB-IGN-300', label: 'MPB-IGN-300 · Ceramiczna grzałka zapalarki 300 W (Megatherm / Pelltech)' },
        { sku: 'MPB-PHOTO-01', label: 'MPB-PHOTO-01 · Fotokomórka płomienia (czujnik optyczny)' },
        { sku: 'MPB-GRATE-35', label: 'MPB-GRATE-35 · Żaroodporny ruszt ruchomy Inox' },
        { sku: 'ECOMAX-860P', label: 'ECOMAX-860P · Sterownik kotła i palnika Plum ecoMAX' },
        { sku: 'SUNP7-NOZZLE', label: 'SUNP7-NOZZLE · Lufa palnika Ferroli SUN P7 / P12' },
        { sku: 'A1-16-AUGER', label: 'A1-16-AUGER · Podajnik ślimakowy pelletu 1,6 m z silnikiem' },
    ],
    ru: [
        { sku: '', label: 'Не знаю код детали (требуется диагностика инженера)' },
        { sku: 'MPB-IGN-300', label: 'MPB-IGN-300 · Керамический ТЭН розжига 300 Вт (Megatherm / Pelltech)' },
        { sku: 'MPB-PHOTO-01', label: 'MPB-PHOTO-01 · Фотоэлемент пламени (оптический датчик)' },
        { sku: 'MPB-GRATE-35', label: 'MPB-GRATE-35 · Жаропрочные подвижные колосники Inox' },
        { sku: 'ECOMAX-860P', label: 'ECOMAX-860P · Контроллер котла и горелки Plum ecoMAX' },
        { sku: 'SUNP7-NOZZLE', label: 'SUNP7-NOZZLE · Сопло горелки Ferroli SUN P7 / P12' },
        { sku: 'A1-16-AUGER', label: 'A1-16-AUGER · Шнек подачи пеллет 1,6 м с моторедуктором' },
    ],
};

export default function EngineeringServicesPage() {
    const intlLocale = useLocale() || 'lt';
    const rawPathname = usePathname() || '';
    const urlMatch = rawPathname.match(/^\/(lt|en|pl|ru)(?=\/|$)/i);
    const locale = resolveAppLocale(urlMatch ? urlMatch[1] : intlLocale);

    const heroEyebrow =
        locale === 'en'
            ? 'UAB „Gilės inžinerija“ · Engineering · Installation · Completed Projects · Service'
            : locale === 'pl'
              ? 'UAB „Gilės inžinerija“ · Projektowanie · Montaż · Realizacje · Serwis'
              : locale === 'ru'
                ? 'UAB „Gilės inžinerija“ · Проектирование · Монтаж · Объекты · Сервис'
                : 'UAB „Gilės inžinerija“ · Projektavimas · Montavimas · Atlikti darbai · Servisas';
    const heroTitle =
        locale === 'en'
            ? 'Engineering Services, Completed Projects & Warranty Service'
            : locale === 'pl'
              ? 'Usługi inżynieryjne, zrealizowane obiekty i serwis gwarancyjny'
              : locale === 'ru'
                ? 'Инженерные услуги, реализованные объекты и гарантийный сервис'
                : 'Inžinerinės paslaugos, realizuoti objektai ir garantinis servisas';
    const heroSubtitle =
        locale === 'en'
            ? 'We design and install boiler rooms, convert solid-fuel boilers to pellet operation, manufacture containerized boiler plants, and provide nationwide service.'
            : locale === 'pl'
              ? 'Projektujemy i montujemy kotłownie, modernizujemy kotły na paliwo stałe na pellet, produkujemy kotłownie kontenerowe oraz prowadzimy serwis.'
              : locale === 'ru'
                ? 'Проектируем и монтируем котельные, переоборудуем твердотопливные котлы на пеллеты, производим контейнерные котельные и выполняем сервис.'
                : 'Projektuojame ir montuojame katilines, perdarome kieto kuro katilus į granulinius, gaminame konteinerines katilines ir vykdome servisą visoje Lietuvoje.';

    const [activeCategory, setActiveCategory] = useState<CompletedWorkCategoryId>('all');
    const [lightboxWork, setLightboxWork] = useState<GilesCompletedWorkItem | null>(null);

    const [ticketType, setTicketType] = useState<string>('Pogarantinis servisas');
    const [priority, setPriority] = useState<string>('AUKŠTAS');
    const [equipmentModelSn, setEquipmentModelSn] = useState<string>('');
    const [sparePartSku, setSparePartSku] = useState<string>('');
    const [clientName, setClientName] = useState<string>('');
    const [clientPhone, setClientPhone] = useState<string>('');
    const [clientCity, setClientCity] = useState<string>('Kaunas');
    const [issueDescription, setIssueDescription] = useState<string>('');
    const [submitting, setSubmitting] = useState<boolean>(false);
    const [ticketResult, setTicketResult] = useState<{
        ok: boolean;
        ticketNumber?: string;
        vytautasDiagnosis?: string;
        assignedTechnician?: string;
        error?: string;
    } | null>(null);

    const allLocalizedWorks = getLocalizedCompletedWorks(locale);
    const localizedCategories = getLocalizedCompletedWorksCategories(locale);
    const localizedPillars = getLocalizedServicePillars(locale);
    const localizedRetrofit = getLocalizedBoilerRetrofitCapabilities(locale);
    const filteredWorks = filterLocalizedCompletedWorksByCategory(activeCategory, locale);
    const heroStripWorks = allLocalizedWorks.slice(0, 6);
    const sparePartOptions = SPARE_PART_OPTIONS_I18N[locale] || SPARE_PART_OPTIONS_I18N.lt;

    useEffect(() => {
        if (!lightboxWork) return;
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setLightboxWork(null);
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [lightboxWork]);

    async function handleAfterSalesSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!clientName.trim() || !clientPhone.trim()) {
            setTicketResult({
                ok: false,
                error:
                    locale === 'en'
                        ? 'Please enter your name / company and contact phone number.'
                        : locale === 'pl'
                          ? 'Wprowadź imię / nazwę firmy oraz numer telefonu kontaktowego.'
                          : locale === 'ru'
                            ? 'Введите имя / компанию и контактный номер телефона.'
                            : 'Įveskite vardą / įmonę ir kontaktinį telefono numerį.',
            });
            return;
        }
        setSubmitting(true);
        setTicketResult(null);

        const composedTitle = issueDescription.trim()
            ? `${issueDescription.trim()} (${clientCity})`
            : `${ticketType}: ${equipmentModelSn || 'Katilo / degiklio patikra'} (${clientCity})`;

        try {
            const res = await fetch(apiUrl('/api/admin/support'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: composedTitle,
                    ticketType,
                    priority,
                    serialNumber: equipmentModelSn.trim() || 'MPB-SN-PATIKRA',
                    clientName: `${clientName.trim()} (${clientCity})`,
                    clientPhone: clientPhone.trim(),
                    assignedTechnician: 'Darius (+370 611 19158)',
                    sparePartSku: sparePartSku || 'MPB-IGN-300',
                }),
            });
            const data = await res.json();
            if (!res.ok || !data.ok) {
                setTicketResult({
                    ok: false,
                    error:
                        data.error ||
                        (locale === 'en'
                            ? 'Could not register service call.'
                            : locale === 'pl'
                              ? 'Nie udało się zarejestrować zgłoszenia serwisowego.'
                              : locale === 'ru'
                                ? 'Не удалось зарегистрировать сервисный вызов.'
                                : 'Nepavyko užregistruoti serviso iškvietimo.'),
                });
            } else {
                setTicketResult({
                    ok: true,
                    ticketNumber: data.ticket?.ticketNumber || 'TKT-0001',
                    vytautasDiagnosis: data.ticket?.vytautasDiagnosis,
                    assignedTechnician: data.ticket?.assignedTechnician || 'Darius (+370 611 19158)',
                });
            }
        } catch {
            setTicketResult({
                ok: false,
                error:
                    locale === 'en'
                        ? 'Network error. Please call directly +370 611 19158 or +370 693 97098.'
                        : locale === 'pl'
                          ? 'Błąd sieci. Zadzwoń bezpośrednio: +370 611 19158 lub +370 693 97098.'
                          : locale === 'ru'
                            ? 'Ошибка сети. Позвоните напрямую +370 611 19158 или +370 693 97098.'
                            : 'Tinklo klaida. Skambinkite tiesiogiai +370 611 19158 arba +370 693 97098.',
            });
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <main
            data-testid="giles-inzinerija-services-page"
            className="min-h-screen bg-[#F5F3EE] text-[#11161B]"
        >
            {/* Dark Graphite Architectural Hero (#11161B) + 6 Studio-Cleaned Project Photos Above the Fold */}
            <section className="bg-[#11161B] text-[#F5F3EE] border-b border-[#2C3742] py-6 sm:py-8">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 space-y-5">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                        <span className="font-bold text-[#FF8A3D]">
                            {heroEyebrow}
                        </span>
                        <div className="flex flex-wrap items-center gap-4 text-[#C9D0D8]">
                            <span>
                                {locale === 'en'
                                    ? 'Engineer Darius:'
                                    : locale === 'pl'
                                      ? 'Inżynier Darius:'
                                      : locale === 'ru'
                                        ? 'Инженер Дарюс:'
                                        : 'Inžinierius Darius:'}{' '}
                                <strong className="text-white">+370 611 19158</strong>
                            </span>
                            <span>
                                {locale === 'en'
                                    ? 'Service:'
                                    : locale === 'pl'
                                      ? 'Serwis:'
                                      : locale === 'ru'
                                        ? 'Сервис:'
                                        : 'Servisas:'}{' '}
                                <strong className="text-white">+370 693 97098</strong>
                            </span>
                        </div>
                    </div>

                    <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
                        <div className="space-y-2 max-w-3xl">
                            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white leading-tight">
                                {heroTitle}
                            </h1>
                            <p className="text-xs sm:text-sm text-[#C9D0D8] leading-relaxed">
                                {heroSubtitle}
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                            <a
                                href="#serviso-iskvietimas"
                                className="inline-flex items-center gap-2 rounded-none bg-[#C2410C] hover:bg-[#9A3412] px-4 py-3 text-xs font-bold text-white whitespace-nowrap transition-colors min-h-[44px]"
                            >
                                <Wrench className="w-4 h-4 shrink-0" />
                                <span>
                                    {locale === 'en'
                                        ? 'Book Service Engineer'
                                        : locale === 'pl'
                                          ? 'Wezwij inżyniera serwisu'
                                          : locale === 'ru'
                                            ? 'Вызвать сервисного инженера'
                                            : 'Iškviesti serviso inžinierių'}
                                </span>
                            </a>
                            <a
                                href="#atlikti-darbai"
                                className="inline-flex items-center gap-2 rounded-none border border-[#3A4652] bg-[#1B232C] hover:border-[#FF8A3D] px-4 py-3 text-xs font-bold text-white whitespace-nowrap transition-colors min-h-[44px]"
                            >
                                <span>
                                    {locale === 'en'
                                        ? 'Completed Projects (16)'
                                        : locale === 'pl'
                                          ? 'Zrealizowane obiekty (16)'
                                          : locale === 'ru'
                                            ? 'Выполненные объекты (16)'
                                            : 'Atlikti darbai (16 objektų)'}
                                </span>
                            </a>
                        </div>
                    </div>

                    {/* 6 Real Background-Cleaned Studio Project Visuals Above the Fold */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
                        {heroStripWorks.map((work) => (
                            <div
                                key={work.id}
                                onClick={() => setLightboxWork(work)}
                                className="border border-[#2C3742] bg-[#1B232C] hover:border-[#FF8A3D] p-2 flex items-center gap-2.5 text-left cursor-pointer transition-colors min-h-[56px]"
                            >
                                <img
                                    src={assetUrl(work.imageUrl)}
                                    alt={work.title}
                                    className="h-12 w-14 bg-[#EEEBE4] object-contain shrink-0 p-0.5"
                                />
                                <div className="min-w-0">
                                    <span className="block tabular-nums text-xs font-bold text-[#FF8A3D] truncate">
                                        {work.powerKw}
                                    </span>
                                    <span className="block text-xs font-semibold text-white leading-snug truncate">
                                        {work.numLabel}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Section 01: 6 Real Gilės Inžinerija Engineering & Service Pillars */}
            <section
                id="paslaugu-kryptys"
                data-testid="inzinerija-service-pillars"
                aria-label={
                    locale === 'en'
                        ? '6 Gilės Inžinerija engineering & service pillars'
                        : locale === 'pl'
                          ? '6 filarów usług inżynieryjnych Gilės Inžinerija'
                          : locale === 'ru'
                            ? '6 направлений инженерных услуг Gilės Inžinerija'
                            : '6 Gilės Inžinerijos paslaugų ir inžinerijos kryptys'
                }
                className="py-10 md:py-14 bg-[#F5F3EE] border-b border-[#E2DDD3]"
            >
                <div className="mx-auto max-w-7xl px-4 sm:px-6 space-y-6">
                    <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
                        <div className="space-y-1.5 max-w-3xl">
                            <span className="tabular-nums text-xs font-bold text-[#C2410C] block">
                                {locale === 'en'
                                    ? '01 / Engineering Competencies (gilesinzinerija.com)'
                                    : locale === 'pl'
                                      ? '01 / Kompetencje inżynieryjne (gilesinzinerija.com)'
                                      : locale === 'ru'
                                        ? '01 / Инженерные компетенции (gilesinzinerija.com)'
                                        : '01 / Inžinerinės kompetencijos (gilesinzinerija.com)'}
                            </span>
                            <h2 className="text-2xl md:text-3xl font-extrabold text-[#11161B] leading-tight">
                                {locale === 'en'
                                    ? '6 Core Service & Manufacturing Pillars of UAB „Gilės inžinerija“'
                                    : locale === 'pl'
                                      ? '6 głównych kierunków usług i produkcji UAB „Gilės inžinerija”'
                                      : locale === 'ru'
                                        ? '6 основных направлений услуг и производства UAB «Gilės inžinerija»'
                                        : '6 realios UAB „Gilės inžinerija“ paslaugų ir gamybos kryptys'}
                            </h2>
                            <p className="text-sm text-[#5B6470]">
                                {locale === 'en'
                                    ? 'Every service is backed by our in-house 6,337-SKU warehouse in Kaunas and Vilnius, manufacturing plant, and certified service engineers.'
                                    : locale === 'pl'
                                      ? 'Każda usługa opiera się na własnym magazynie 6 337 pozycji w Kownie i Wilnie, bazie produkcyjnej oraz zespole certyfikowanych inżynierów.'
                                      : locale === 'ru'
                                        ? 'Каждая услуга опирается на собственный склад на 6 337 позиций в Каунасе и Вильнюсе, производственную базу и команду аттестованных инженеров.'
                                        : 'Kiekviena paslauga paremta nuosavu 6 337 pozicijų sandėliu Kaune ir Vilniuje, gamybos baze bei atestuotų serviso inžinierių komanda.'}
                            </p>
                        </div>
                        <Link
                            href={`/${locale}/vedlys`}
                            className="inline-flex items-center rounded-none bg-[#11161B] hover:bg-[#C2410C] px-4 py-2.5 text-xs font-bold text-white whitespace-nowrap transition-colors min-h-[44px]"
                        >
                            {locale === 'en'
                                ? '4-Step Boiler Conversion Wizard'
                                : locale === 'pl'
                                  ? '4-krokowy kreator modernizacji kotła'
                                  : locale === 'ru'
                                    ? '4-шаговый мастер модернизации котла'
                                    : 'Katilo perdarymo 4 žingsnių vedlys'}
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 border-t border-l border-[#E2DDD3]">
                        {localizedPillars.map((pillar) => {
                            const matchingWork =
                                allLocalizedWorks.find((w) => w.imageUrl === pillar.imageUrl) ||
                                allLocalizedWorks[0]!;
                            return (
                                <article
                                    key={pillar.id}
                                    className="border-r border-b border-[#E2DDD3] bg-white p-5 sm:p-6 flex flex-col justify-between gap-5"
                                >
                                    <div className="space-y-4">
                                        <div
                                            onClick={() => setLightboxWork(matchingWork)}
                                            className="group relative h-48 w-full bg-[#EEEBE4] border border-[#E2DDD3] p-3 flex items-center justify-center cursor-zoom-in overflow-hidden"
                                        >
                                            <img
                                                src={assetUrl(pillar.imageUrl)}
                                                alt={pillar.title}
                                                className="max-h-full max-w-full object-contain mix-blend-multiply transition-transform duration-200 group-hover:scale-105"
                                            />
                                            <span className="absolute left-3 top-2.5 bg-[#11161B] text-white px-2 py-0.5 font-mono text-xs font-bold">
                                                {pillar.numLabel.split('/')[0]?.trim()}
                                            </span>
                                            <span className="absolute right-3 bottom-2.5 bg-white/95 border border-[#D5CFC3] text-[#11161B] px-2 py-1 text-xs font-semibold inline-flex items-center gap-1">
                                                <ZoomIn className="w-3.5 h-3.5 text-[#C2410C]" />
                                                <span>800×800</span>
                                            </span>
                                        </div>

                                        <div className="space-y-2">
                                            <span className="tabular-nums text-xs font-bold text-[#C2410C] block">
                                                {pillar.numLabel}
                                            </span>
                                            <h3 className="text-lg font-extrabold text-[#11161B] leading-snug">
                                                {pillar.title}
                                            </h3>
                                            <p className="text-xs sm:text-sm text-[#5B6470] leading-relaxed">
                                                {pillar.subtitle}
                                            </p>
                                        </div>

                                        <ul className="space-y-1.5 text-xs text-[#2A323B] border-t border-[#E2DDD3] pt-3">
                                            {pillar.scopeBullets.map((b) => (
                                                <li key={b} className="flex items-start gap-2">
                                                    <span className="font-bold text-[#C2410C] shrink-0">•</span>
                                                    <span>{b}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    <div className="space-y-3 pt-3 border-t border-[#E2DDD3]">
                                        <div className="text-xs space-y-1">
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="text-[#5B6470]">
                                                    {locale === 'en'
                                                        ? 'Turnaround / SLA:'
                                                        : locale === 'pl'
                                                          ? 'Termin / SLA:'
                                                          : locale === 'ru'
                                                            ? 'Сроки / SLA:'
                                                            : 'Terminas / SLA:'}
                                                </span>
                                                <span className="font-bold text-[#11161B] text-right">
                                                    {pillar.turnaroundOrSla}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="text-[#5B6470]">
                                                    {locale === 'en'
                                                        ? 'Indicative price:'
                                                        : locale === 'pl'
                                                          ? 'Cena orientacyjna:'
                                                          : locale === 'ru'
                                                            ? 'Ориентировочная цена:'
                                                            : 'Orientacinė kaina:'}
                                                </span>
                                                <span className="font-extrabold text-[#C2410C] text-right">
                                                    {pillar.priceReference}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap gap-2">
                                            {pillar.primaryHref.startsWith('#') ? (
                                                <a
                                                    href={pillar.primaryHref}
                                                    className="w-full inline-flex items-center justify-center rounded-none bg-[#11161B] hover:bg-[#C2410C] px-4 py-2.5 text-xs font-bold text-white transition-colors min-h-[44px]"
                                                >
                                                    {pillar.primaryCtaLabel}
                                                </a>
                                            ) : (
                                                <Link
                                                    href={`/${locale}${pillar.primaryHref}`}
                                                    className="w-full inline-flex items-center justify-center rounded-none bg-[#11161B] hover:bg-[#C2410C] px-4 py-2.5 text-xs font-bold text-white transition-colors min-h-[44px]"
                                                >
                                                    {pillar.primaryCtaLabel}
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Section 02: Interactive Filterable „Atlikti darbai (Realūs objektai)“ Gallery */}
            {/* LT category anchors preserved: Katilų perdarymas į granulinius | Pramoninės ir konteinerinės katilinės | Šilumos siurbliai ir katilinės | Servisas ir automatika */}
            <section
                id="atlikti-darbai"
                data-testid="inzinerija-atlikti-darbai-gallery"
                aria-label={
                    locale === 'en'
                        ? '02 / Completed Projects – Real installations by UAB Gilės inžinerija'
                        : locale === 'pl'
                          ? '02 / Zrealizowane obiekty – Realne instalacje UAB Gilės inžinerija'
                          : locale === 'ru'
                            ? '02 / Выполненные работы – Реальные объекты UAB Gilės inžinerija'
                            : '02 / Atlikti darbai – Realūs UAB Gilės inžinerija sumontuoti objektai'
                }
                className="py-10 md:py-14 bg-white border-b border-[#E2DDD3]"
            >
                <div className="mx-auto max-w-7xl px-4 sm:px-6 space-y-6">
                    <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
                        <div className="space-y-1.5 max-w-3xl">
                            <span className="tabular-nums text-xs font-bold text-[#C2410C] block">
                                {locale === 'en'
                                    ? '02 / Completed Works (Real projects from gilesinzinerija.com archive)'
                                    : locale === 'pl'
                                      ? '02 / Zrealizowane prace (Realne obiekty z archiwum gilesinzinerija.com)'
                                      : locale === 'ru'
                                        ? '02 / Выполненные работы (Реальные объекты из архива gilesinzinerija.com)'
                                        : '02 / Atlikti darbai (Realūs objektai iš gilesinzinerija.com archyvo)'}
                            </span>
                            <h2 className="text-2xl md:text-3xl font-extrabold text-[#11161B] leading-tight">
                                {locale === 'en'
                                    ? 'Completed Boiler Conversions, Containerized Boiler Plants & Hydronic Projects'
                                    : locale === 'pl'
                                      ? 'Zrealizowane modernizacje kotłów, kotłownie kontenerowe i węzły cieplne'
                                      : locale === 'ru'
                                        ? 'Реализованные проекты модернизации котлов, контейнерных котельных и теплоузлов'
                                        : 'Realizuoti katilų perdarymo, konteinerinių katilinių ir šilumos mazgų projektai'}
                            </h2>
                            <p className="text-sm text-[#5B6470]">
                                {locale === 'en'
                                    ? 'All photographs show real installations built and serviced by UAB „Gilės inžinerija“ across Lithuania on a clean #EEEBE4 studio backdrop. Click any project for an 800×800 detailed view.'
                                    : locale === 'pl'
                                      ? 'Wszystkie zdjęcia przedstawiają realne obiekty zamontowane i serwisowane przez UAB „Gilės inžinerija” na czystym tle studyjnym #EEEBE4. Kliknij wybrany obiekt, aby otworzyć podgląd 800×800.'
                                      : locale === 'ru'
                                        ? 'Все фотографии – реальные объекты, смонтированные и обслуживаемые UAB «Gilės inžinerija» на студийном фоне #EEEBE4. Нажмите на любой объект для детального просмотра 800×800.'
                                        : 'Visos nuotraukos yra tikri UAB „Gilės inžinerija“ sumontuoti ir prižiūrimi objektai Lietuvoje (Katilų perdarymas į granulinius, Pramoninės ir konteinerinės katilinės, Šilumos siurbliai ir katilinės, Servisas ir automatika), paruošti ant švaraus #EEEBE4 inžinerinės studijos fono. Paspauskite ant bet kurio objekto 800×800 detaliam peržiūrėjimui.'}
                            </p>
                        </div>

                        <div className="text-xs tabular-nums font-bold text-[#5B6470]">
                            {locale === 'en'
                                ? `Showing projects: ${filteredWorks.length} / ${allLocalizedWorks.length}`
                                : locale === 'pl'
                                  ? `Wyświetlane obiekty: ${filteredWorks.length} / ${allLocalizedWorks.length}`
                                  : locale === 'ru'
                                    ? `Показано объектов: ${filteredWorks.length} / ${allLocalizedWorks.length}`
                                    : `Rodoma objektų: ${filteredWorks.length} / ${allLocalizedWorks.length}`}
                        </div>
                    </div>

                    {/* Category Filter Bar */}
                    <div
                        role="tablist"
                        aria-label={
                            locale === 'en'
                                ? 'Completed projects category filter'
                                : locale === 'pl'
                                  ? 'Filtr kategorii zrealizowanych prac'
                                  : locale === 'ru'
                                    ? 'Фильтр категорий выполненных работ'
                                    : 'Atliktų darbų kategorijų filtras'
                        }
                        className="flex flex-wrap gap-2 border-b border-[#E2DDD3] pb-4"
                    >
                        {localizedCategories.map((cat) => {
                            const isActive = activeCategory === cat.id;
                            return (
                                <button
                                    key={cat.id}
                                    type="button"
                                    role="tab"
                                    aria-selected={isActive}
                                    data-testid={`filter-work-cat-${cat.id}`}
                                    onClick={() => setActiveCategory(cat.id)}
                                    className={`px-4 py-2.5 text-xs font-bold cursor-pointer transition-colors min-h-[44px] border ${
                                        isActive
                                            ? 'border-[#11161B] bg-[#11161B] text-white'
                                            : 'border-[#D5CFC3] bg-[#F5F3EE] text-[#11161B] hover:border-[#C2410C]'
                                    }`}
                                >
                                    {cat.label}
                                </button>
                            );
                        })}
                    </div>

                    {/* Completed Works Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 border-t border-l border-[#E2DDD3]">
                        {filteredWorks.map((work) => (
                            <article
                                key={work.id}
                                data-testid={`completed-work-card-${work.id}`}
                                className="border-r border-b border-[#E2DDD3] bg-[#F5F3EE] flex flex-col justify-between"
                            >
                                <div>
                                    <div
                                        onClick={() => setLightboxWork(work)}
                                        className="group relative h-56 bg-[#EEEBE4] border-b border-[#E2DDD3] p-4 flex items-center justify-center cursor-zoom-in overflow-hidden"
                                    >
                                        <img
                                            src={assetUrl(work.imageUrl)}
                                            alt={work.title}
                                            className="max-h-full max-w-full object-contain mix-blend-multiply transition-transform duration-200 group-hover:scale-105"
                                        />
                                        <span className="absolute left-3 top-3 bg-[#11161B] text-white px-2.5 py-1 tabular-nums text-xs font-bold">
                                            {work.powerKw}
                                        </span>
                                        <span className="absolute left-3 bottom-3 bg-[#C2410C] text-white px-2.5 py-0.5 text-xs font-bold">
                                            {work.categoryLabel}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setLightboxWork(work);
                                            }}
                                            aria-label={`${locale === 'en' ? 'Zoom' : locale === 'pl' ? 'Powiększ' : locale === 'ru' ? 'Увеличить' : 'Padidinti'} ${work.title}`}
                                            className="absolute right-3 bottom-3 bg-white border border-[#11161B] text-[#11161B] px-2.5 py-1.5 text-xs font-bold inline-flex items-center gap-1 cursor-pointer min-h-[36px]"
                                        >
                                            <ZoomIn className="w-3.5 h-3.5 text-[#C2410C]" />
                                            <span>
                                                {locale === 'en'
                                                    ? 'Zoom'
                                                    : locale === 'pl'
                                                      ? 'Powiększ'
                                                      : locale === 'ru'
                                                        ? 'Увеличить'
                                                        : 'Padidinti'}
                                            </span>
                                        </button>
                                    </div>

                                    <div className="p-5 space-y-3">
                                        <div className="flex items-center justify-between gap-2 text-xs text-[#5B6470]">
                                            <span className="font-bold text-[#11161B]">{work.location}</span>
                                            <span className="tabular-nums">{work.powerKw}</span>
                                        </div>

                                        <h3 className="text-base sm:text-lg font-extrabold text-[#11161B] leading-snug">
                                            {work.title}
                                        </h3>

                                        <p className="text-xs text-[#2A323B] leading-relaxed">
                                            {work.scopeExecuted}
                                        </p>

                                        <div className="border-t border-[#E2DDD3] pt-3 space-y-1.5 text-xs">
                                            <div>
                                                <span className="text-[#5B6470]">
                                                    {locale === 'en'
                                                        ? 'Boiler / Module: '
                                                        : locale === 'pl'
                                                          ? 'Kocioł / Moduł: '
                                                          : locale === 'ru'
                                                            ? 'Котел / Модуль: '
                                                            : 'Katilas / Modulis: '}
                                                </span>
                                                <strong className="text-[#11161B]">{work.boilerModel}</strong>
                                            </div>
                                            <div>
                                                <span className="text-[#5B6470]">
                                                    {locale === 'en'
                                                        ? 'Burner & Equipment: '
                                                        : locale === 'pl'
                                                          ? 'Palnik i wyposażenie: '
                                                          : locale === 'ru'
                                                            ? 'Горелка и оборудование: '
                                                            : 'Degiklis ir įranga: '}
                                                </span>
                                                <strong className="text-[#11161B]">{work.burnerOrEquipment}</strong>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="px-5 pb-5 space-y-3">
                                    <div className="border-t border-[#E2DDD3] pt-3 flex items-center justify-between gap-2 text-xs">
                                        <span className="font-bold text-[#157A3B]">
                                            {work.resultMetric}
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {work.ctaHref.startsWith('#') ? (
                                            <a
                                                href={work.ctaHref}
                                                className="flex-1 inline-flex items-center justify-center rounded-none bg-[#11161B] hover:bg-[#C2410C] px-3 py-2.5 text-xs font-bold text-white text-center transition-colors min-h-[44px]"
                                            >
                                                {work.ctaLabel}
                                            </a>
                                        ) : (
                                            <Link
                                                href={`/${locale}${work.ctaHref}`}
                                                className="flex-1 inline-flex items-center justify-center rounded-none bg-[#11161B] hover:bg-[#C2410C] px-3 py-2.5 text-xs font-bold text-white text-center transition-colors min-h-[44px]"
                                            >
                                                {work.ctaLabel}
                                            </Link>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => setLightboxWork(work)}
                                            className="inline-flex items-center justify-center rounded-none border border-[#11161B] bg-white hover:bg-[#EEEBE4] px-3 py-2.5 text-xs font-bold text-[#11161B] cursor-pointer transition-colors min-h-[44px]"
                                        >
                                            800×800 {locale === 'en' ? 'photo' : locale === 'pl' ? 'foto' : locale === 'ru' ? 'фото' : 'foto'}
                                        </button>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            {/* Section 03: Real Boiler Retrofit Packages & Supported Boiler Models Matrix */}
            <section
                id="katilu-perdarymo-komplektai"
                className="py-10 md:py-14 bg-[#F5F3EE] border-b border-[#E2DDD3]"
            >
                <div className="mx-auto max-w-7xl px-4 sm:px-6 space-y-8">
                    <div className="space-y-1.5 max-w-3xl">
                        <span className="tabular-nums text-xs font-bold text-[#C2410C] block">
                            {locale === 'en'
                                ? '03 / Fixed-Price Boiler Conversion Kits & Industrial Modules'
                                : locale === 'pl'
                                  ? '03 / Zestawy modernizacyjne kotłów w stałej cenie i moduły przemysłowe'
                                  : locale === 'ru'
                                    ? '03 / Комплекты переоборудования котлов по фиксированной цене и промышленные модули'
                                    : '03 / Fiksuotos kainos katilų modernizavimo komplektai ir pramoniniai moduliai'}
                        </span>
                        <h2 className="text-2xl md:text-3xl font-extrabold text-[#11161B] leading-tight">
                            {locale === 'en'
                                ? 'Solid-Fuel Boiler Conversion Kits with Installation & 24-Month Warranty'
                                : locale === 'pl'
                                  ? 'Zestawy do przeróbki kotłów stałopaliwowych z montażem i 24-mies. gwarancją'
                                  : locale === 'ru'
                                    ? 'Комплекты переоборудования твердотопливных котлов с монтажом и гарантией 24 мес.'
                                    : 'Kieto kuro katilų perdarymo komplektai su montavimu ir 24 mėn. garantija'}
                        </h2>
                        <p className="text-sm text-[#5B6470]">
                            {locale === 'en'
                                ? 'Complete pellet burner assemblies including a 460 L hopper, feed auger, slag-cleaning air compressor, on-site installation, and commissioning.'
                                : locale === 'pl'
                                  ? 'Kompletne zestawy palników pelletowych z zasobnikiem 460 L, podajnikiem ślimakowym, kompresorem, montażem i uruchomieniem.'
                                  : locale === 'ru'
                                    ? 'Полностью укомплектованные узлы пеллетных горелок с бункером 460 л, шнеком, компрессором очистки, монтажом и пусконаладкой.'
                                    : 'Pagal gilesinzinerija.com techninius pasiūlymus – pilnai sukomplektuoti granulių degiklių mazgai su 460 L bunkeriu, sraigtu, oro kompresoriumi, montavimu ir paleidimu.'}
                        </p>
                    </div>

                    {/* 4 Named Turnkey Packages */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 border-t border-l border-[#E2DDD3]">
                        {localizedRetrofit.namedPackages.map((pkg) => (
                            <div
                                key={pkg.code}
                                className="border-r border-b border-[#E2DDD3] bg-white p-5 flex flex-col justify-between gap-4"
                            >
                                <div className="space-y-2.5">
                                    <span className="font-mono text-xs font-bold text-[#C2410C] block">
                                        {pkg.code}
                                    </span>
                                    <h3 className="text-base font-extrabold text-[#11161B] leading-snug">
                                        {pkg.name}
                                    </h3>
                                    <p className="text-xs text-[#2A323B] leading-relaxed">
                                        {pkg.included}
                                    </p>
                                </div>
                                <div className="pt-3 border-t border-[#E2DDD3] flex items-center justify-between gap-2">
                                    <div>
                                        <span className="text-xs text-[#5B6470] block">
                                            {locale === 'en'
                                                ? 'Price incl. installation'
                                                : locale === 'pl'
                                                  ? 'Cena z montażem'
                                                  : locale === 'ru'
                                                    ? 'Цена с монтажом'
                                                    : 'Kaina su montavimu'}
                                        </span>
                                        <span className="text-lg font-extrabold text-[#11161B] tabular-nums">
                                            {pkg.priceGrossEur.toLocaleString('lt-LT')} €{' '}
                                            {locale === 'en'
                                                ? 'incl. VAT'
                                                : locale === 'pl'
                                                  ? 'z VAT'
                                                  : locale === 'ru'
                                                    ? 'с НДС'
                                                    : 'su PVM'}
                                        </span>
                                    </div>
                                    <Link
                                        href={`/${locale}/vedlys`}
                                        className="inline-flex items-center rounded-none bg-[#C2410C] hover:bg-[#9A3412] px-3 py-2 text-xs font-bold text-white whitespace-nowrap min-h-[40px]"
                                    >
                                        {locale === 'en'
                                            ? 'Configure'
                                            : locale === 'pl'
                                              ? 'Dobierz'
                                              : locale === 'ru'
                                                ? 'Подобрать'
                                                : 'Parinkti'}
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Supported Boiler Models (Cards Grid — zero horizontal swipe tables on mobile) */}
                    <div className="space-y-3">
                        <h3 className="text-lg font-extrabold text-[#11161B]">
                            {locale === 'en'
                                ? 'Technical Compatibility Matrix for Solid-Fuel Boilers'
                                : locale === 'pl'
                                  ? 'Zestawienie kompatybilności technicznej modernizowanych kotłów'
                                  : locale === 'ru'
                                    ? 'Техническая таблица совместимости переоборудуемых котлов'
                                    : 'Perdaromų kieto kuro katilų techninė suderinamumo suvestinė'}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {localizedRetrofit.supportedBoilers.map((b) => (
                                <div
                                    key={b.brandAndSeries}
                                    className="border border-[#E2DDD3] bg-white p-4 space-y-1.5 text-xs"
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <strong className="text-sm font-extrabold text-[#11161B]">
                                            {b.brandAndSeries}
                                        </strong>
                                        <span className="font-mono font-bold text-[#C2410C] shrink-0">
                                            {b.typicalPowerKw}
                                        </span>
                                    </div>
                                    <div className="text-[#5B6470]">{b.material}</div>
                                    <div className="text-[#2A323B] pt-1">
                                        <strong className="text-[#11161B]">
                                            {locale === 'en'
                                                ? 'Door flange solution: '
                                                : locale === 'pl'
                                                  ? 'Rozwiązanie drzwiczek: '
                                                  : locale === 'ru'
                                                    ? 'Решение по дверце: '
                                                    : 'Durelių sprendimas: '}
                                        </strong>
                                        {b.flangeSolution}
                                    </div>
                                    <div className="text-[#157A3B] font-semibold">
                                        {locale === 'en'
                                            ? 'Recommended burner: '
                                            : locale === 'pl'
                                              ? 'Zalecany palnik: '
                                              : locale === 'ru'
                                                ? 'Рекомендуемая горелка: '
                                                : 'Rekomenduojamas degiklis: '}
                                        {b.recommendedBurner}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Section 04: Interactive Tech Support / Garantinis ir Pogarantinis Serviso Iškvietimas (After-Sales) Form */}
            <section
                id="serviso-iskvietimas"
                className="py-10 md:py-14 bg-white border-b border-[#E2DDD3]"
            >
                <div className="mx-auto max-w-7xl px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Left Column: After-Sales Service Dispatch Form */}
                    <div className="lg:col-span-7 border border-[#11161B] bg-[#F5F3EE] p-5 sm:p-7 space-y-5">
                        <div className="space-y-1.5">
                            <span className="tabular-nums text-xs font-bold text-[#C2410C] block">
                                {locale === 'en'
                                    ? '04 / Warranty & Post-Warranty Service (Tech Support)'
                                    : locale === 'pl'
                                      ? '04 / Serwis gwarancyjny i pogwarancyjny (Tech Support)'
                                      : locale === 'ru'
                                        ? '04 / Гарантийный и послегарантийный сервис (Tech Support)'
                                        : '04 / Garantinis ir pogarantinis servisas (Tech Support)'}
                            </span>
                            <h2 className="text-xl sm:text-2xl font-extrabold text-[#11161B]">
                                {locale === 'en'
                                    ? 'Service Engineer Dispatch & Spare Parts Request'
                                    : locale === 'pl'
                                      ? 'Wezwanie inżyniera serwisu i zamówienie części zamiennych'
                                      : locale === 'ru'
                                        ? 'Вызов сервисного инженера и заказ запасных частей'
                                        : 'Serviso inžinieriaus iškvietimas ir atsarginių dalių užsakymas'}
                            </h2>
                            <p className="text-xs sm:text-sm text-[#5B6470]">
                                {locale === 'en'
                                    ? 'Submitted tickets go directly to the UAB „Gilės inžinerija“ Admin Service Dispatch Center (/api/admin/support), assign a field technician, and generate an initial Vytautas AI diagnosis.'
                                    : locale === 'pl'
                                      ? 'Wypełnione zgłoszenie trafia bezpośrednio do dyspozytorni serwisowej UAB „Gilės inžinerija” (/api/admin/support), przypisuje inżyniera i generuje wstępną diagnozę Vytautas AI.'
                                      : locale === 'ru'
                                        ? 'Заполненная заявка поступает напрямую в диспетчерскую сервиса UAB «Gilės inžinerija» (/api/admin/support), назначает инженера и формирует первичную диагностику Vytautas AI.'
                                        : 'Užpildyta paraiška tiesiogiai patenka į UAB „Gilės inžinerija“ Admin serviso dispečerinę (/api/admin/support), priskiria serviso inžinierių ir suformuoja pirminę Vytauto AI diagnostiką.'}
                            </p>
                        </div>

                        <form
                            data-testid="after-sales-service-form"
                            onSubmit={handleAfterSalesSubmit}
                            className="space-y-4 text-xs sm:text-sm"
                        >
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label
                                        htmlFor="service-ticket-type"
                                        className="block text-xs font-bold text-[#11161B] mb-1"
                                    >
                                        {locale === 'en'
                                            ? 'Service type *'
                                            : locale === 'pl'
                                              ? 'Rodzaj usługi *'
                                              : locale === 'ru'
                                                ? 'Тип услуги *'
                                                : 'Paslaugos tipas *'}
                                    </label>
                                    <select
                                        id="service-ticket-type"
                                        value={ticketType}
                                        onChange={(e) => setTicketType(e.target.value)}
                                        className="w-full border border-[#D5CFC3] bg-white px-3 py-2.5 text-xs font-semibold text-[#11161B] min-h-[44px]"
                                    >
                                        <option value="Pogarantinis servisas">
                                            {locale === 'en'
                                                ? 'Post-warranty service / troubleshooting'
                                                : locale === 'pl'
                                                  ? 'Serwis pogwarancyjny / usuwanie usterki'
                                                  : locale === 'ru'
                                                    ? 'Послегарантийный сервис / ремонт'
                                                    : 'Pogarantinis servisas / gedimo šalinimas'}
                                        </option>
                                        <option value="Garantinis remontas">
                                            {locale === 'en'
                                                ? 'Warranty service (with S/N number)'
                                                : locale === 'pl'
                                                  ? 'Serwis gwarancyjny (z numerem S/N)'
                                                  : locale === 'ru'
                                                    ? 'Гарантийное обслуживание (с S/N номером)'
                                                    : 'Garantinis aptarnavimas (su S/N numeriu)'}
                                        </option>
                                        <option value="Paleidimas-derinimas">
                                            {locale === 'en'
                                                ? 'New boiler / burner commissioning & tuning'
                                                : locale === 'pl'
                                                  ? 'Uruchomienie i regulacja nowego kotła / palnika'
                                                  : locale === 'ru'
                                                    ? 'Пусконаладка нового котла / горелки'
                                                    : 'Naujo katilo / degiklio paleidimas ir derinimas'}
                                        </option>
                                        <option value="RMA grąžinimas">
                                            {locale === 'en'
                                                ? 'Spare part order / RMA'
                                                : locale === 'pl'
                                                  ? 'Zamówienie części zamiennej / RMA'
                                                  : locale === 'ru'
                                                    ? 'Заказ запчасти / RMA'
                                                    : 'Atsarginės detalės užsakymas / RMA'}
                                        </option>
                                    </select>
                                </div>

                                <div>
                                    <label
                                        htmlFor="service-priority"
                                        className="block text-xs font-bold text-[#11161B] mb-1"
                                    >
                                        {locale === 'en'
                                            ? 'Urgency *'
                                            : locale === 'pl'
                                              ? 'Priorytet *'
                                              : locale === 'ru'
                                                ? 'Срочность *'
                                                : 'Skubumas *'}
                                    </label>
                                    <select
                                        id="service-priority"
                                        value={priority}
                                        onChange={(e) => setPriority(e.target.value)}
                                        className="w-full border border-[#D5CFC3] bg-white px-3 py-2.5 text-xs font-semibold text-[#11161B] min-h-[44px]"
                                    >
                                        <option value="SKUBUS (Avarija)">
                                            {locale === 'en'
                                                ? 'URGENT – Heating stopped in winter (2–6h response)'
                                                : locale === 'pl'
                                                  ? 'PILNY – Brak ogrzewania zimą (reakcja 2–6h)'
                                                  : locale === 'ru'
                                                    ? 'СРОЧНЫЙ – Остановилось отопление зимой (реакция 2–6 ч.)'
                                                    : 'SKUBUS – Stojo šildymas žiemą (reakcija 2–6 val.)'}
                                        </option>
                                        <option value="AUKŠTAS">
                                            {locale === 'en'
                                                ? 'HIGH – Error A01 / burner fails to ignite'
                                                : locale === 'pl'
                                                  ? 'WYSOKI – Błąd A01 / palnik nie rozpala'
                                                  : locale === 'ru'
                                                    ? 'ВЫСОКИЙ – Ошибка A01 / не разжигается горелка'
                                                    : 'AUKŠTAS – Klaida A01 / neužsikuria degiklis'}
                                        </option>
                                        <option value="VIDUTINIS">
                                            {locale === 'en'
                                                ? 'MEDIUM – Seasonal maintenance / flue gas analysis'
                                                : locale === 'pl'
                                                  ? 'ŚREDNI – Przegląd sezonowy / analiza spalin'
                                                  : locale === 'ru'
                                                    ? 'СРЕДНИЙ – Сезонная профилактика / газоанализ'
                                                    : 'VIDUTINIS – Sezoninė profilaktika / dūmų analizė'}
                                        </option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label
                                        htmlFor="service-model-sn"
                                        className="block text-xs font-bold text-[#11161B] mb-1"
                                    >
                                        {locale === 'en'
                                            ? 'Boiler / burner model or S/N'
                                            : locale === 'pl'
                                              ? 'Model kotła / palnika lub S/N'
                                              : locale === 'ru'
                                                ? 'Модель котла / горелки или S/N'
                                                : 'Katilo / degiklio modelis arba S/N'}
                                    </label>
                                    <input
                                        id="service-model-sn"
                                        type="text"
                                        value={equipmentModelSn}
                                        onChange={(e) => setEquipmentModelSn(e.target.value)}
                                        placeholder={
                                            locale === 'en'
                                                ? 'e.g. Viadrus U26 + Megatherm MPB 35 / Ferroli SUN P7'
                                                : locale === 'pl'
                                                  ? 'Np.: Viadrus U26 + Megatherm MPB 35 / Ferroli SUN P7'
                                                  : locale === 'ru'
                                                    ? 'Напр.: Viadrus U26 + Megatherm MPB 35 / Ferroli SUN P7'
                                                    : 'Pvz.: Viadrus U26 + Megatherm MPB 35 / Ferroli SUN P7'
                                        }
                                        className="w-full border border-[#D5CFC3] bg-white px-3 py-2.5 text-xs text-[#11161B] min-h-[44px]"
                                    />
                                </div>

                                <div>
                                    <label
                                        htmlFor="service-spare-part"
                                        className="block text-xs font-bold text-[#11161B] mb-1"
                                    >
                                        {locale === 'en'
                                            ? 'Required spare part (if known)'
                                            : locale === 'pl'
                                              ? 'Wymagana część zamienna (jeśli znana)'
                                              : locale === 'ru'
                                                ? 'Требуемая запчасть (если известна)'
                                                : 'Reikalinga atsarginė detalė (jei žinoma)'}
                                    </label>
                                    <select
                                        id="service-spare-part"
                                        value={sparePartSku}
                                        onChange={(e) => setSparePartSku(e.target.value)}
                                        className="w-full border border-[#D5CFC3] bg-white px-3 py-2.5 text-xs text-[#11161B] min-h-[44px]"
                                    >
                                        {sparePartOptions.map((opt) => (
                                            <option key={opt.sku} value={opt.sku}>
                                                {opt.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div>
                                    <label
                                        htmlFor="service-client-name"
                                        className="block text-xs font-bold text-[#11161B] mb-1"
                                    >
                                        {locale === 'en'
                                            ? 'Name or company *'
                                            : locale === 'pl'
                                              ? 'Imię lub firma *'
                                              : locale === 'ru'
                                                ? 'Имя или компания *'
                                                : 'Vardas arba įmonė *'}
                                    </label>
                                    <input
                                        id="service-client-name"
                                        type="text"
                                        required
                                        value={clientName}
                                        onChange={(e) => setClientName(e.target.value)}
                                        placeholder={
                                            locale === 'en'
                                                ? 'Your name / Company'
                                                : locale === 'pl'
                                                  ? 'Twoje imię / Firma'
                                                  : locale === 'ru'
                                                    ? 'Ваше имя / Компания'
                                                    : 'Jūsų vardas / UAB'
                                        }
                                        className="w-full border border-[#D5CFC3] bg-white px-3 py-2.5 text-xs text-[#11161B] min-h-[44px]"
                                    />
                                </div>

                                <div>
                                    <label
                                        htmlFor="service-client-phone"
                                        className="block text-xs font-bold text-[#11161B] mb-1"
                                    >
                                        {locale === 'en'
                                            ? 'Phone *'
                                            : locale === 'pl'
                                              ? 'Telefon *'
                                              : locale === 'ru'
                                                ? 'Телефон *'
                                                : 'Telefonas *'}
                                    </label>
                                    <input
                                        id="service-client-phone"
                                        type="tel"
                                        required
                                        value={clientPhone}
                                        onChange={(e) => setClientPhone(e.target.value)}
                                        placeholder="+370 6..."
                                        className="w-full border border-[#D5CFC3] bg-white px-3 py-2.5 text-xs text-[#11161B] min-h-[44px]"
                                    />
                                </div>

                                <div>
                                    <label
                                        htmlFor="service-client-city"
                                        className="block text-xs font-bold text-[#11161B] mb-1"
                                    >
                                        {locale === 'en'
                                            ? 'City / district'
                                            : locale === 'pl'
                                              ? 'Miasto / powiat'
                                              : locale === 'ru'
                                                ? 'Город / район'
                                                : 'Miestas / rajonas'}
                                    </label>
                                    <input
                                        id="service-client-city"
                                        type="text"
                                        value={clientCity}
                                        onChange={(e) => setClientCity(e.target.value)}
                                        placeholder={
                                            locale === 'en'
                                                ? 'Kaunas, Vilnius, Klaipeda...'
                                                : locale === 'pl'
                                                  ? 'Kowno, Wilno, Kłajpeda...'
                                                  : locale === 'ru'
                                                    ? 'Каунас, Вильнюс, Клайпеда...'
                                                    : 'Kaunas, Vilnius, Šiauliai...'
                                        }
                                        className="w-full border border-[#D5CFC3] bg-white px-3 py-2.5 text-xs text-[#11161B] min-h-[44px]"
                                    />
                                </div>
                            </div>

                            <div>
                                <label
                                    htmlFor="service-issue-desc"
                                    className="block text-xs font-bold text-[#11161B] mb-1"
                                >
                                    {locale === 'en'
                                        ? 'Fault symptoms / error code (e.g. Error A01, pellets do not ignite, tuning required)'
                                        : locale === 'pl'
                                          ? 'Objawy usterki / kod błędu (np. błąd A01, brak zapłonu pelletu, wymagana regulacja)'
                                          : locale === 'ru'
                                            ? 'Симптомы неисправности / код ошибки (напр., ошибка A01, не разжигает пеллеты, нужна настройка)'
                                            : 'Gedimo simptomai / klaidos kodas (pvz., klaida A01, neuždega granulių, reikalingas derinimas)'}
                                </label>
                                <textarea
                                    id="service-issue-desc"
                                    rows={3}
                                    value={issueDescription}
                                    onChange={(e) => setIssueDescription(e.target.value)}
                                    placeholder={
                                        locale === 'en'
                                            ? 'Describe the issue or equipment error code...'
                                            : locale === 'pl'
                                              ? 'Opisz sytuację lub kod błędu urządzenia...'
                                              : locale === 'ru'
                                                ? 'Опишите ситуацию или код ошибки оборудования...'
                                                : 'Aprašykite situaciją arba įrangos klaidos kodą...'
                                    }
                                    className="w-full border border-[#D5CFC3] bg-white p-3 text-xs text-[#11161B]"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={submitting}
                                data-testid="submit-after-sales-service-btn"
                                className="w-full inline-flex items-center justify-center gap-2 rounded-none bg-[#C2410C] hover:bg-[#9A3412] disabled:opacity-60 px-5 py-3.5 text-xs sm:text-sm font-bold text-white cursor-pointer transition-colors min-h-[48px]"
                            >
                                <Wrench className="w-4 h-4 shrink-0" />
                                <span>
                                    {submitting
                                        ? locale === 'en'
                                            ? 'Registering service dispatch...'
                                            : locale === 'pl'
                                              ? 'Rejestrowanie zgłoszenia serwisowego...'
                                              : locale === 'ru'
                                                ? 'Регистрация сервисного вызова...'
                                                : 'Registruojamas serviso iškvietimas...'
                                        : locale === 'en'
                                          ? 'Register Service Call in Admin Dispatch'
                                          : locale === 'pl'
                                            ? 'Zarejestruj wezwanie serwisu w dyspozytorni'
                                            : locale === 'ru'
                                              ? 'Зарегистрировать вызов сервиса в диспетчерской'
                                              : 'Registruoti serviso iškvietimą į Admin dispečerinę'}
                                </span>
                            </button>

                            {ticketResult && (
                                <div
                                    data-testid="after-sales-service-result"
                                    className={`border p-4 text-xs space-y-1.5 ${
                                        ticketResult.ok
                                            ? 'border-[#157A3B] bg-[#ECFDF3] text-[#11161B]'
                                            : 'border-[#B91C1C] bg-[#FEF2F2] text-[#991B1B]'
                                    }`}
                                >
                                    {ticketResult.ok ? (
                                        <>
                                            <div className="flex items-center gap-2 font-extrabold text-[#157A3B] text-sm">
                                                <CheckCircle2 className="w-4 h-4 shrink-0" />
                                                <span>
                                                    {locale === 'en'
                                                        ? `Service ticket registered: ${ticketResult.ticketNumber}`
                                                        : locale === 'pl'
                                                          ? `Zgłoszenie serwisowe zarejestrowane: ${ticketResult.ticketNumber}`
                                                          : locale === 'ru'
                                                            ? `Сервисная заявка зарегистрирована: ${ticketResult.ticketNumber}`
                                                            : `Serviso paraiška užregistruota: ${ticketResult.ticketNumber}`}
                                                </span>
                                            </div>
                                            <div>
                                                <strong>
                                                    {locale === 'en'
                                                        ? 'Assigned service engineer:'
                                                        : locale === 'pl'
                                                          ? 'Przypisany inżynier serwisu:'
                                                          : locale === 'ru'
                                                            ? 'Назначенный сервисный инженер:'
                                                            : 'Priskirtas serviso inžinierius:'}
                                                </strong>{' '}
                                                {ticketResult.assignedTechnician}
                                            </div>
                                            {ticketResult.vytautasDiagnosis && (
                                                <div>
                                                    <strong>
                                                        {locale === 'en'
                                                            ? 'Vytautas AI preliminary diagnosis:'
                                                            : locale === 'pl'
                                                              ? 'Wstępna diagnoza Vytautas AI:'
                                                              : locale === 'ru'
                                                                ? 'Первичная диагностика Vytautas AI:'
                                                                : 'Vytautas AI pirminė diagnostika:'}
                                                    </strong>{' '}
                                                    {ticketResult.vytautasDiagnosis}
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <div className="flex items-center gap-2 font-bold">
                                            <AlertTriangle className="w-4 h-4 shrink-0" />
                                            <span>{ticketResult.error}</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </form>
                    </div>

                    {/* Right Column: Official gilesinzinerija.com Serviso Atmintinė (Klaida A01) & Direct Contacts */}
                    <div className="lg:col-span-5 space-y-5">
                        <div className="border border-[#E2DDD3] bg-[#11161B] text-[#F5F3EE] p-5 sm:p-6 space-y-4">
                            <span className="tabular-nums text-xs font-bold text-[#FF8A3D] block">
                                {locale === 'en'
                                    ? 'Service Checklist (gilesinzinerija.com/klaida-a01)'
                                    : locale === 'pl'
                                      ? 'Instrukcja serwisowa (gilesinzinerija.com/klaida-a01)'
                                      : locale === 'ru'
                                        ? 'Памятка сервиса (gilesinzinerija.com/klaida-a01)'
                                        : 'Serviso atmintinė (gilesinzinerija.com/klaida-a01)'}
                            </span>
                            <h3 className="text-lg font-extrabold text-white leading-snug">
                                {locale === 'en'
                                    ? 'What to do if the pellet burner controller shows Error A01?'
                                    : locale === 'pl'
                                      ? 'Co zrobić, gdy automatyka palnika pelletowego wyświetla błąd A01?'
                                      : locale === 'ru'
                                        ? 'Что делать, если автоматика пеллетной горелки показала ошибку A01?'
                                        : 'Ką daryti, jeigu granulių degiklio automatika parodė klaidą A01?'}
                            </h3>
                            <ol className="space-y-2 text-xs text-[#C9D0D8] list-decimal list-inside leading-relaxed">
                                <li>
                                    <strong className="text-white">
                                        {locale === 'en'
                                            ? 'Check pellet level in the hopper:'
                                            : locale === 'pl'
                                              ? 'Sprawdź poziom pelletu w zasobniku:'
                                              : locale === 'ru'
                                                ? 'Проверьте уровень гранул в бункере:'
                                                : 'Patikrinkite granulių lygį bunkeryje:'}
                                    </strong>{' '}
                                    {locale === 'en'
                                        ? 'the intake auger tube must stay covered – refill the hopper completely.'
                                        : locale === 'pl'
                                          ? 'ślimak pobierający w rurze nie powinien być odsłonięty – dosyp pełny zasobnik.'
                                          : locale === 'ru'
                                            ? 'заборный шнек в трубе не должен быть виден – засыпьте полный бункер.'
                                            : 'granulių paėmimo sraigtas vamzdyje neturi matytis – pripilkite pilną bunkerį.'}
                                </li>
                                <li>
                                    <strong className="text-white">
                                        {locale === 'en'
                                            ? 'Inspect burner grate and feed tube:'
                                            : locale === 'pl'
                                              ? 'Sprawdź palnik i rurę podającą:'
                                              : locale === 'ru'
                                                ? 'Проверьте горелку и подающую трубу:'
                                                : 'Patikrinkite degiklį ir vamzdį:'}
                                    </strong>{' '}
                                    {locale === 'en'
                                        ? 'open the boiler door and check whether the burner grate or drop tube is jammed with pellets or clinker; clean if needed.'
                                        : locale === 'pl'
                                          ? 'otwórz drzwiczki i sprawdź, czy palnik lub rura podająca nie są zablokowane pelletem lub szlaką; w razie potrzeby oczyść.'
                                          : locale === 'ru'
                                            ? 'откройте дверцу и проверьте, не забита ли горелка или подающая труба пеллетами/шлаком; при необходимости очистите.'
                                            : 'atidarykite dureles ir patikrinkite, ar neužsikimšęs granulėmis pats degiklis bei padavimo vamzdis; jei taip – išvalykite.'}
                                </li>
                                <li>
                                    <strong className="text-white">
                                        {locale === 'en'
                                            ? 'Clean flue passages & optical sensor:'
                                            : locale === 'pl'
                                              ? 'Wyczyść kanały spalinowe i fotokomórkę:'
                                              : locale === 'ru'
                                                ? 'Очистите дымовые каналы и фотоэлемент:'
                                                : 'Išvalykite dūmų kanalus ir fotoelementą:'}
                                    </strong>{' '}
                                    {locale === 'en'
                                        ? 'check the boiler flue gas channels, empty the ash pan, and wipe the optical flame photo sensor.'
                                        : locale === 'pl'
                                          ? 'sprawdź kanały spalinowe kotła, popielnik oraz przetrzyj optyczny czujnik płomienia.'
                                          : locale === 'ru'
                                            ? 'проверьте дымовые каналы котла, зольник и протрите оптический датчик пламени.'
                                            : 'patikrinkite katilo dūmų šalinimo kanalus, pelenų dėžę ir nuvalykite optinį liepsnos jutiklį.'}
                                </li>
                                <li>
                                    <strong className="text-white">
                                        {locale === 'en'
                                            ? 'Restart the burner ("P" button):'
                                            : locale === 'pl'
                                              ? 'Uruchom ponownie (przycisk „P”):'
                                              : locale === 'ru'
                                                ? 'Перезапустите горелку (кнопка «P»):'
                                                : 'Paleiskite iš naujo („P“):'}
                                    </strong>{' '}
                                    {locale === 'en'
                                        ? 'close the door and press "P" (if the hopper ran empty, repeat 3–5 times to prime the auger).'
                                        : locale === 'pl'
                                          ? 'zamknij drzwiczki i naciśnij przycisk „P” (jeśli zabrakło pelletu, powtórz 3–5 razy, aby napełnić podajnik).'
                                          : locale === 'ru'
                                            ? 'закройте дверцу и нажмите кнопку «P» (если пеллеты заканчивались, повторите 3–5 раз для заполнения шнека).'
                                            : 'uždarykite dureles ir paspauskite mygtuką „P“ (jei granulės buvo pasibaigusios, sraigto užpildymui pakartokite 3–5 kartus).'}
                                </li>
                            </ol>
                            <div className="pt-3 border-t border-[#2C3742] text-xs text-[#C9D0D8] space-y-1">
                                <div>
                                    {locale === 'en'
                                        ? 'Burner still will not start or ceramic igniter burned out?'
                                        : locale === 'pl'
                                          ? 'Nie udało się uruchomić palnika lub przepaliła się zapalarka?'
                                          : locale === 'ru'
                                            ? 'Не удалось запустить горелку или перегорел ТЭН розжига?'
                                            : 'Nepavyko paleisti degiklio arba sudegė uždegimo tenas?'}
                                </div>
                                <div className="flex flex-wrap gap-3 pt-1">
                                    <a
                                        href="tel:+37069397098"
                                        className="inline-flex items-center gap-1.5 font-bold text-[#FF8A3D] hover:underline"
                                    >
                                        <Phone className="w-3.5 h-3.5" />
                                        <span>
                                            +370 693 97098 (
                                            {locale === 'en'
                                                ? 'Service'
                                                : locale === 'pl'
                                                  ? 'Serwis'
                                                  : locale === 'ru'
                                                    ? 'Сервис'
                                                    : 'Servisas'}
                                            )
                                        </span>
                                    </a>
                                    <a
                                        href="tel:+37061119158"
                                        className="inline-flex items-center gap-1.5 font-bold text-white hover:underline"
                                    >
                                        <Phone className="w-3.5 h-3.5 text-[#FF8A3D]" />
                                        <span>+370 611 19158 (Darius)</span>
                                    </a>
                                </div>
                            </div>
                        </div>

                        <div className="border border-[#E2DDD3] bg-[#F5F3EE] p-5 space-y-3 text-xs">
                            <span className="tabular-nums font-bold text-[#C2410C] block">
                                {locale === 'en'
                                    ? 'Serviced Brands & In-Stock Spare Parts'
                                    : locale === 'pl'
                                      ? 'Obsługiwani producenci i części zamienne'
                                      : locale === 'ru'
                                        ? 'Обслуживаемые производители и запчасти'
                                        : 'Aptarnaujami gamintojai ir atsarginės dalys'}
                            </span>
                            <h3 className="text-base font-extrabold text-[#11161B]">
                                {locale === 'en'
                                    ? 'Nationwide Warranty & Post-Warranty Service'
                                    : locale === 'pl'
                                      ? 'Serwis gwarancyjny i pogwarancyjny na terenie całego kraju'
                                      : locale === 'ru'
                                        ? 'Гарантийный и послегарантийный сервис по всей Литве'
                                        : 'Garantinis ir pogarantinis servisas visoje Lietuvoje'}
                            </h3>
                            <p className="text-[#2A323B] leading-relaxed">
                                {locale === 'en'
                                    ? 'We stock spare parts in our warehouses for: '
                                    : locale === 'pl'
                                      ? 'Utrzymujemy części zamienne w magazynie dla marek: '
                                      : locale === 'ru'
                                        ? 'Поддерживаем запасные части на складе для: '
                                        : 'Palaikome atsargines detales sandėlyje: '}
                                <strong>
                                    Megatherm, Pelltech, Ferroli (SUN P7 / P12), Centrometal, Verner, Ponast, Buderus, Viessmann, Protherm, HERZ, Defro, Danfoss
                                </strong>
                                .
                            </p>
                            <div className="pt-2 border-t border-[#E2DDD3] space-y-1 text-[#2A323B]">
                                <div>
                                    •{' '}
                                    <strong>
                                        {locale === 'en'
                                            ? 'Vilnius Branch:'
                                            : locale === 'pl'
                                              ? 'Oddział w Wilnie:'
                                              : locale === 'ru'
                                                ? 'Отделение в Вильнюсе:'
                                                : 'Vilniaus padalinys:'}
                                    </strong>{' '}
                                    Žirmūnų g. 68, LT-09124 Vilnius
                                </div>
                                <div>
                                    •{' '}
                                    <strong>
                                        {locale === 'en'
                                            ? 'Kaunas Manufacturing & Warehouse:'
                                            : locale === 'pl'
                                              ? 'Produkcja i magazyn w Kownie:'
                                              : locale === 'ru'
                                                ? 'Производство и склад в Каунасе:'
                                                : 'Kauno gamyba ir sandėlis:'}
                                    </strong>{' '}
                                    Eigulių g. 21, LT-51418 Kaunas
                                </div>
                                <div>
                                    •{' '}
                                    <strong>
                                        {locale === 'en'
                                            ? 'Email:'
                                            : locale === 'pl'
                                              ? 'E-mail:'
                                              : locale === 'ru'
                                                ? 'Эл. почта:'
                                                : 'El. paštas:'}
                                    </strong>{' '}
                                    servisas@gilesinzinerija.lt · info@gilesinzinerija.lt
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 800x800 Lightbox Modal for Real Completed Works */}
            {lightboxWork && (
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-label={lightboxWork.title}
                    data-testid="completed-work-lightbox"
                    onClick={() => setLightboxWork(null)}
                    className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className="bg-white border-2 border-[#11161B] max-w-4xl w-full max-h-[92vh] overflow-y-auto p-5 sm:p-6 space-y-4"
                    >
                        <div className="flex items-start justify-between gap-4 border-b border-[#E2DDD3] pb-3">
                            <div>
                                <span className="font-mono text-xs font-bold text-[#C2410C] block">
                                    {lightboxWork.numLabel} · {lightboxWork.categoryLabel} · {lightboxWork.location}
                                </span>
                                <h3 className="text-lg sm:text-xl font-extrabold text-[#11161B]">
                                    {lightboxWork.title}
                                </h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setLightboxWork(null)}
                                aria-label={
                                    locale === 'en'
                                        ? 'Close preview'
                                        : locale === 'pl'
                                          ? 'Zamknij podgląd'
                                          : locale === 'ru'
                                            ? 'Закрыть просмотр'
                                            : 'Uždaryti peržiūrą'
                                }
                                className="border border-[#11161B] bg-[#F5F3EE] hover:bg-[#11161B] hover:text-white p-2 cursor-pointer min-h-[44px] min-w-[44px] inline-flex items-center justify-center"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="bg-[#EEEBE4] border border-[#E2DDD3] p-4 flex items-center justify-center min-h-[360px] sm:min-h-[480px]">
                            <img
                                src={assetUrl(lightboxWork.imageUrl)}
                                alt={lightboxWork.title}
                                className="max-h-[520px] w-auto object-contain mix-blend-multiply"
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-[#F5F3EE] border border-[#E2DDD3] p-4 text-xs">
                            <div>
                                <span className="text-[#5B6470] block">
                                    {locale === 'en'
                                        ? 'Boiler / Module'
                                        : locale === 'pl'
                                          ? 'Kocioł / Moduł'
                                          : locale === 'ru'
                                            ? 'Котел / Модуль'
                                            : 'Katilas / Modulis'}
                                </span>
                                <strong className="text-[#11161B]">{lightboxWork.boilerModel}</strong>
                            </div>
                            <div>
                                <span className="text-[#5B6470] block">
                                    {locale === 'en'
                                        ? 'Burner & Equipment'
                                        : locale === 'pl'
                                          ? 'Palnik i wyposażenie'
                                          : locale === 'ru'
                                            ? 'Горелка и оборудование'
                                            : 'Degiklis ir įranga'}
                                </span>
                                <strong className="text-[#11161B]">{lightboxWork.burnerOrEquipment}</strong>
                            </div>
                            <div>
                                <span className="text-[#5B6470] block">
                                    {locale === 'en'
                                        ? 'Output & Result'
                                        : locale === 'pl'
                                          ? 'Moc i rezultat'
                                          : locale === 'ru'
                                            ? 'Мощность и результат'
                                            : 'Galia ir rezultatas'}
                                </span>
                                <strong className="text-[#157A3B]">
                                    {lightboxWork.powerKw} · {lightboxWork.resultMetric}
                                </strong>
                            </div>
                        </div>

                        <p className="text-xs sm:text-sm text-[#2A323B] leading-relaxed">
                            {lightboxWork.scopeExecuted}
                        </p>
                    </div>
                </div>
            )}
        </main>
    );
}
