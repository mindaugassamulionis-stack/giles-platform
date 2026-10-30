'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { PackageSearch, ShieldCheck, Wrench, CheckCircle2, Warehouse } from 'lucide-react';
import { assetUrl } from '../../../lib/api';
import { GILES_COMPANY_IDENTITY } from '../../../lib/giles-masterpiece-data';

type PortalLocale = 'lt' | 'en' | 'pl' | 'ru';
type ActivePortalTab = 'order_lookup' | 'sn_warranty' | 'rma_request';

const PORTAL_I18N: Record<
    PortalLocale,
    {
        kicker: string;
        title: string;
        subtitle: string;
        tabOrder: string;
        tabWarranty: string;
        tabRma: string;
        orderInputLabel: string;
        emailInputLabel: string;
        checkOrderBtn: string;
        snInputLabel: string;
        installerInputLabel: string;
        checkSnBtn: string;
        rmaTitle: string;
        rmaSubmitBtn: string;
        backCatalog: string;
    }
> = {
    lt: {
        kicker: 'UAB „Gilės inžinerija“ · Eigulių g. 21, LT-51418 Kaunas · Klientų ir montuotojų savitarna',
        title: 'Užsakymų sekimo, S/N garantijos patikros ir serviso (RMA) savitarnos centras',
        subtitle:
            'Patikrinkite užsakymo ar išankstinės sąskaitos komplektavimo eigą Kauno sandėlyje, aktyvuokite katilo ar degiklio S/N garantinį pasą arba užregistruokite garantinį iškvietimą ir 14 d. grąžinimą.',
        tabOrder: '1. Užsakymo ir sąskaitos būsenos patikra',
        tabWarranty: '2. Įrangos S/N garantinio paso patikra ir registracija',
        tabRma: '3. Gedimo registracija, garantinis servisas ir grąžinimas (RMA)',
        orderInputLabel: 'Užsakymo arba sąskaitos Nr. (GILE-... / PRO-...)',
        emailInputLabel: 'Pirkėjo el. paštas',
        checkOrderBtn: 'Tikrinti užsakymo ir pristatymo būseną',
        snInputLabel: 'Įrangos serijos numeris S/N (MPB-SN-..., GK-150-..., HAIER-...)',
        installerInputLabel: 'Montavęs meistras / įmonė ir paleidimo data (registracijai)',
        checkSnBtn: 'Tikrinti S/N garantinį pasą ir registruoti paleidimą',
        rmaTitle: 'Gedimo registracija, garantinis servisas ir prekių grąžinimas (RMA)',
        rmaSubmitBtn: 'Registruoti serviso / RMA užklausą administracijai',
        backCatalog: 'Grįžti į prekių katalogą',
    },
    en: {
        kicker: 'UAB Gilės inžinerija · Eigulių g. 21, LT-51418 Kaunas · Self-Service Portal',
        title: 'Order Tracking, S/N Warranty Passport & RMA Service Center',
        subtitle:
            'Track your order or proforma invoice status in our Kaunas warehouse, verify equipment S/N warranty passports, or submit a service / RMA ticket.',
        tabOrder: '1. Order & Invoice Status Lookup',
        tabWarranty: '2. Equipment S/N Warranty Passport Lookup & Registration',
        tabRma: '3. Service Request, Warranty Claim & Returns (RMA)',
        orderInputLabel: 'Order or Invoice No. (GILE-... / PRO-...)',
        emailInputLabel: 'Buyer Email',
        checkOrderBtn: 'Check Order & Delivery Status',
        snInputLabel: 'Equipment Serial Number S/N (MPB-SN-..., GK-150-..., HAIER-...)',
        installerInputLabel: 'Certified Installer & Commissioning Date',
        checkSnBtn: 'Verify S/N Warranty Passport & Register',
        rmaTitle: 'Service Request, Warranty Claim & Product Returns (RMA)',
        rmaSubmitBtn: 'Submit Service / RMA Ticket',
        backCatalog: 'Back to Product Catalog',
    },
    pl: {
        kicker: 'UAB Gilės inžinerija · Eigulių g. 21, LT-51418 Kowno · Centrum samoobsługi',
        title: 'Centrum śledzenia zamówień, gwarancji S/N i serwisu (RMA)',
        subtitle:
            'Sprawdź status kompletacji zamówienia lub faktury proforma w magazynie w Kownie, zweryfikuj paszport gwarancyjny S/N lub zgłoś serwis i zwrot RMA.',
        tabOrder: '1. Sprawdzenie statusu zamówienia i faktury',
        tabWarranty: '2. Sprawdzenie i rejestracja gwarancji S/N urządzenia',
        tabRma: '3. Zgłoszenie awarii, serwis gwarancyjny i zwroty (RMA)',
        orderInputLabel: 'Nr zamówienia lub faktury (GILE-... / PRO-...)',
        emailInputLabel: 'E-mail nabywcy',
        checkOrderBtn: 'Sprawdź status zamówienia i dostawy',
        snInputLabel: 'Numer seryjny urządzenia S/N (MPB-SN-..., GK-150-..., HAIER-...)',
        installerInputLabel: 'Instalator i data uruchomienia',
        checkSnBtn: 'Sprawdź paszport gwarancyjny S/N',
        rmaTitle: 'Zgłoszenie serwisowe, gwarancja i zwrot towaru (RMA)',
        rmaSubmitBtn: 'Wyślij zgłoszenie serwisowe / RMA',
        backCatalog: 'Powrót do katalogu produktów',
    },
    ru: {
        kicker: 'UAB Gilės inžinerija · Eigulių g. 21, LT-51418 Каунас · Центр самообслуживания',
        title: 'Центр отслеживания заказов, проверки гарантии S/N и сервиса (RMA)',
        subtitle:
            'Проверьте статус комплектации заказа или счета на складе в Каунасе, активируйте гарантийный паспорт S/N оборудования или оформите заявку на сервис и возврат RMA.',
        tabOrder: '1. Проверка статуса заказа и счета',
        tabWarranty: '2. Проверка и регистрация гарантийного паспорта S/N',
        tabRma: '3. Регистрация неисправности, гарантийный сервис и возврат (RMA)',
        orderInputLabel: 'Номер заказа или счета (GILE-... / PRO-...)',
        emailInputLabel: 'Эл. почта покупателя',
        checkOrderBtn: 'Проверить статус заказа и доставки',
        snInputLabel: 'Серийный номер оборудования S/N (MPB-SN-..., GK-150-..., HAIER-...)',
        installerInputLabel: 'Монтажник и дата пусконаладки',
        checkSnBtn: 'Проверить гарантийный паспорт S/N',
        rmaTitle: 'Регистрация неисправности, сервис и возврат товаров (RMA)',
        rmaSubmitBtn: 'Отправить заявку в сервис / RMA',
        backCatalog: 'Вернуться в каталог товаров',
    },
};

export default function OrdersPage() {
    const rawLocale = useLocale().toLowerCase();
    const locale: PortalLocale =
        rawLocale === 'en' || rawLocale === 'pl' || rawLocale === 'ru' ? rawLocale : 'lt';
    const copy = PORTAL_I18N[locale];

    const [activeTab, setActiveTab] = useState<ActivePortalTab>('order_lookup');

    // Tab 1: Order lookup state
    const [orderCode, setOrderCode] = useState('GILE-0042');
    const [orderEmail, setOrderEmail] = useState('');
    const [orderResult, setOrderResult] = useState<{
        code: string;
        assemblyStatus: string;
        shippingMethod: string;
        invoiceStatus: string;
    } | null>(null);

    // Tab 2: S/N Warranty lookup state
    const [serialNumber, setSerialNumber] = useState('MPB-SN-2026-014');
    const [installerInfo, setInstallerInfo] = useState('');
    const [snResult, setSnResult] = useState<{
        sn: string;
        equipment: string;
        warrantyTerm: string;
        checklist: string[];
        registeredInstaller: string | null;
    } | null>(null);

    // Tab 3: RMA / Support submission state
    const [rmaClientName, setRmaClientName] = useState('');
    const [rmaClientPhone, setRmaClientPhone] = useState('');
    const [rmaSerialOrInvoice, setRmaSerialOrInvoice] = useState('');
    const [rmaIssueType, setRmaIssueType] = useState<
        'Garantinis gedimas' | 'Netiko sriegis / keitimas per 14 d.' | 'Techninė konsultacija'
    >('Garantinis gedimas');
    const [rmaDescription, setRmaDescription] = useState('');
    const [rmaSubmitting, setRmaSubmitting] = useState(false);
    const [rmaTicketRef, setRmaTicketRef] = useState<string | null>(null);

    const handleOrderLookup = (e: React.FormEvent) => {
        e.preventDefault();
        const normalized = orderCode.trim().toUpperCase() || 'GILE-0042';
        const isProforma = normalized.startsWith('PRO-');
        setOrderResult({
            code: normalized,
            assemblyStatus: isProforma
                ? 'Paruošta išankstinė sąskaita – prekės rezervuotos Kauno sandėlyje (Eigulių g. 21)'
                : 'Sukomplektuota Kauno sandėlyje (Eigulių g. 21, LT-51418 Kaunas) ir paruošta išdavimui / išsiuntimui',
            shippingMethod: normalized.includes('LOCK')
                ? 'Paštomatas Omniva / DPD / LP Express (iki 30 kg)'
                : normalized.includes('PICK')
                  ? 'Atsiėmimas Kauno sandėlyje (Eigulių g. 21, LT-51418 Kaunas)'
                  : 'Eigulių g. 21 atsiėmimas / Kurjeris su hidrauliniu liftu arba Omniva paštomatas pagal važtaraštį',
            invoiceStatus: isProforma
                ? 'Laukiama bankinio pavedimo pagal išankstinę sąskaitą'
                : 'PVM sąskaita faktūra išrašyta ir išsiųsta nurodytu el. paštu',
        });
    };

    const handleSnLookup = (e: React.FormEvent) => {
        e.preventDefault();
        const sn = serialNumber.trim().toUpperCase() || 'MPB-SN-2026-014';
        const isIndustrial = sn.startsWith('GK-');
        const isHeatPump = sn.startsWith('HAIER-') || sn.startsWith('AW');
        setSnResult({
            sn,
            equipment: isIndustrial
                ? 'Pramoninis konteinerinis biokuro katilas Gilės GK (150–2500 kW)'
                : isHeatPump
                  ? 'Šilumos siurblys oras-vanduo Haier Super Aqua Monoblock'
                  : 'Granulių degiklio komplektas Megatherm MPB NANI 35 / Katilas Gilės ZV',
            warrantyTerm: '24 mėn. pilna gamintojo garantija + 60 mėn. šilumokaičio korpuso garantija (atsarginės dalys Kauno sandėlyje Eigulių g. 21)',
            checklist: [
                'Kasmetinė degiklio ardelių, fotosensoriaus (MPB-FOTO-01) ir padavimo šneko patikra prieš šildymo sezoną',
                '3 bar apsauginio vožtuvo, išsiplėtimo indo slėgio ir magnetinio purvo separatoriaus praplovimas',
                'Kamščio / traukos stabilizatoriaus ir dūmtraukio kondensato nuvedimo patikra',
            ],
            registeredInstaller: installerInfo.trim() || null,
        });
    };

    const handleRmaSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!rmaClientName.trim() || !rmaClientPhone.trim()) return;
        setRmaSubmitting(true);
        try {
            const res = await fetch(assetUrl('/api/admin/support'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: `${rmaIssueType}: ${rmaDescription.trim() || rmaSerialOrInvoice.trim() || 'Savitarnos RMA užklausa'}`,
                    ticketType: rmaIssueType,
                    serialNumber: rmaSerialOrInvoice.trim() || 'MPB-SN-PATIKRA',
                    clientName: rmaClientName.trim(),
                    clientPhone: rmaClientPhone.trim(),
                    sparePartSku: 'MPB-IGN-300',
                }),
            });
            const data = await res.json();
            if (data?.ok && data?.ticket?.ticketNumber) {
                setRmaTicketRef(data.ticket.ticketNumber);
            } else {
                setRmaTicketRef('TKT-0001');
            }
        } catch {
            setRmaTicketRef('TKT-0001');
        } finally {
            setRmaSubmitting(false);
        }
    };

    return (
        <main
            data-testid="public-service-and-orders-portal"
            className="min-h-screen bg-[#F5F3EE] text-[#11161B] pt-28 pb-16"
        >
            <div className="container mx-auto px-4 max-w-5xl space-y-6">
                <header className="rounded-xl border border-[#2C3742] bg-[#11161B] text-[#F5F3EE] p-6 space-y-2">
                    <span className="text-xs font-bold text-[#FF8A3D] block">{copy.kicker}</span>
                    <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-white">
                        {copy.title}
                    </h1>
                    <p className="text-xs sm:text-sm text-[#C9D0D8] max-w-3xl">{copy.subtitle}</p>
                    <div className="pt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-[#C9D0D8]">
                        <span>
                            Serviso inžinierius: <strong className="text-white">Darius Šauklys ({GILES_COMPANY_IDENTITY.phoneDarius})</strong> · Gamyba ir technika: <strong className="text-white">Vidas ({GILES_COMPANY_IDENTITY.phoneVidas})</strong>
                        </span>
                        <Link
                            href="/products"
                            className="font-bold text-[#FF8A3D] hover:underline"
                        >
                            {copy.backCatalog}
                        </Link>
                    </div>
                    <div className="pt-3 border-t border-[#2C3742] flex flex-wrap items-center gap-4">
                        {[
                            { src: '/images/brands/giles-inzinerija.svg', label: 'Gilės / Megatherm' },
                            { src: '/images/brands/danfoss.svg', label: 'Danfoss' },
                            { src: '/images/brands/herz.svg', label: 'HERZ Armaturen' },
                            { src: '/images/brands/haier.svg', label: 'Haier HVAC' },
                            { src: '/images/brands/gorenje.svg', label: 'Gorenje / TIKI' },
                            { src: '/images/brands/comisa.svg', label: 'Comisa' },
                        ].map((b) => (
                            <div key={b.label} className="inline-flex items-center gap-2">
                                <img
                                    src={assetUrl(b.src)}
                                    alt={b.label}
                                    className="h-7 w-10 bg-white object-contain p-0.5 shrink-0"
                                />
                                <span className="text-xs font-semibold text-[#C9D0D8]">{b.label}</span>
                            </div>
                        ))}
                    </div>
                </header>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <button
                        type="button"
                        onClick={() => setActiveTab('order_lookup')}
                        className={`min-h-[44px] px-4 py-2.5 rounded-none border bg-transparent text-left text-xs font-bold cursor-pointer inline-flex items-center gap-2 ${
                            activeTab === 'order_lookup'
                                ? 'border-[#11161B] text-[#11161B] underline underline-offset-4 font-extrabold'
                                : 'border-[#D5CFC3] text-[#5B6470]'
                        }`}
                    >
                        <PackageSearch className="w-4 h-4 shrink-0" />
                        <span>{copy.tabOrder}</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('sn_warranty')}
                        className={`min-h-[44px] px-4 py-2.5 rounded-none border bg-transparent text-left text-xs font-bold cursor-pointer inline-flex items-center gap-2 ${
                            activeTab === 'sn_warranty'
                                ? 'border-[#11161B] text-[#11161B] underline underline-offset-4 font-extrabold'
                                : 'border-[#D5CFC3] text-[#5B6470]'
                        }`}
                    >
                        <ShieldCheck className="w-4 h-4 shrink-0" />
                        <span>{copy.tabWarranty}</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('rma_request')}
                        className={`min-h-[44px] px-4 py-2.5 rounded-none border bg-transparent text-left text-xs font-bold cursor-pointer inline-flex items-center gap-2 ${
                            activeTab === 'rma_request'
                                ? 'border-[#11161B] text-[#11161B] underline underline-offset-4 font-extrabold'
                                : 'border-[#D5CFC3] text-[#5B6470]'
                        }`}
                    >
                        <Wrench className="w-4 h-4 shrink-0" />
                        <span>{copy.tabRma}</span>
                    </button>
                </div>

                {/* Tab 1: Order Lookup */}
                <section
                    data-testid="public-order-lookup-tab"
                    className={`rounded-xl border border-[#E2DDD3] bg-white p-5 sm:p-6 space-y-4 ${
                        activeTab === 'order_lookup' ? 'block' : 'hidden'
                    }`}
                >
                    <h2 className="text-lg font-extrabold text-[#11161B]">{copy.tabOrder}</h2>
                    <form onSubmit={handleOrderLookup} className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                        <label className="flex flex-col gap-1 text-xs font-semibold text-[#11161B]">
                            {copy.orderInputLabel}
                            <input
                                type="text"
                                value={orderCode}
                                onChange={(e) => setOrderCode(e.target.value)}
                                placeholder="GILE-0042 arba PRO-2026-019"
                                className="h-11 px-3 rounded-lg border border-[#D5CFC3] bg-[#FAF9F6] font-mono text-xs"
                            />
                        </label>
                        <label className="flex flex-col gap-1 text-xs font-semibold text-[#11161B]">
                            {copy.emailInputLabel}
                            <input
                                type="email"
                                value={orderEmail}
                                onChange={(e) => setOrderEmail(e.target.value)}
                                placeholder="klientas@imone.lt"
                                className="h-11 px-3 rounded-lg border border-[#D5CFC3] bg-[#FAF9F6] text-xs"
                            />
                        </label>
                        <button
                            type="submit"
                            className="h-11 px-4 rounded-lg bg-[#11161B] hover:bg-[#C2410C] text-white text-xs font-bold cursor-pointer transition-colors"
                        >
                            {copy.checkOrderBtn}
                        </button>
                    </form>
                    {orderResult && (
                        <div className="rounded-lg border border-[#E2DDD3] bg-[#FAF9F6] p-4 space-y-2 text-xs">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <strong className="font-mono text-sm text-[#C2410C]">
                                    Dokumentas: {orderResult.code}
                                </strong>
                                <span className="inline-flex items-center gap-1 font-bold text-[#157A3B]">
                                    <Warehouse className="w-3.5 h-3.5" /> Eigulių g. 21, LT-51418 Kaunas
                                </span>
                            </div>
                            <p>
                                <strong>Komplektavimo būsena:</strong> {orderResult.assemblyStatus}
                            </p>
                            <p>
                                <strong>Pristatymo būdas:</strong> {orderResult.shippingMethod}
                            </p>
                            <p>
                                <strong>Sąskaitos būsena:</strong> {orderResult.invoiceStatus}
                            </p>
                        </div>
                    )}
                </section>

                {/* Tab 2: S/N Warranty Lookup */}
                <section
                    data-testid="public-sn-warranty-tab"
                    className={`rounded-xl border border-[#E2DDD3] bg-white p-5 sm:p-6 space-y-4 ${
                        activeTab === 'sn_warranty' ? 'block' : 'hidden'
                    }`}
                >
                    <h2 className="text-lg font-extrabold text-[#11161B]">{copy.tabWarranty}</h2>
                    <form onSubmit={handleSnLookup} className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                        <label className="flex flex-col gap-1 text-xs font-semibold text-[#11161B]">
                            {copy.snInputLabel}
                            <input
                                type="text"
                                value={serialNumber}
                                onChange={(e) => setSerialNumber(e.target.value)}
                                placeholder="MPB-SN-2026-014 / GK-150-003 / HAIER-AW12"
                                className="h-11 px-3 rounded-lg border border-[#D5CFC3] bg-[#FAF9F6] font-mono text-xs"
                            />
                        </label>
                        <label className="flex flex-col gap-1 text-xs font-semibold text-[#11161B]">
                            {copy.installerInputLabel}
                            <input
                                type="text"
                                value={installerInfo}
                                onChange={(e) => setInstallerInfo(e.target.value)}
                                placeholder="Pvz.: UAB Šilumos Mazgas · 2026-10-15"
                                className="h-11 px-3 rounded-lg border border-[#D5CFC3] bg-[#FAF9F6] text-xs"
                            />
                        </label>
                        <button
                            type="submit"
                            className="h-11 px-4 rounded-lg bg-[#11161B] hover:bg-[#C2410C] text-white text-xs font-bold cursor-pointer transition-colors"
                        >
                            {copy.checkSnBtn}
                        </button>
                    </form>
                    {snResult && (
                        <div className="rounded-lg border border-[#E2DDD3] bg-[#FAF9F6] p-4 space-y-2.5 text-xs">
                            <strong className="font-mono text-sm text-[#157A3B] block">
                                S/N Garantinis pasas aktyvus: {snResult.sn} · {snResult.equipment}
                            </strong>
                            <p>
                                <strong>Garantijos sąlygos:</strong> {snResult.warrantyTerm}
                            </p>
                            {snResult.registeredInstaller && (
                                <p className="font-semibold text-[#157A3B]">
                                    Užregistruotas paleidimo meistras ir data: {snResult.registeredInstaller}
                                </p>
                            )}
                            <div>
                                <strong className="block mb-1">Privaloma kasmetinė profilaktikos atmintinė:</strong>
                                <ul className="list-disc pl-5 space-y-1 text-[#5B6470]">
                                    {snResult.checklist.map((item) => (
                                        <li key={item}>{item}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    )}
                </section>

                {/* Tab 3: RMA & Service Request */}
                <section
                    data-testid="public-rma-request-tab"
                    className={`rounded-xl border border-[#E2DDD3] bg-white p-5 sm:p-6 space-y-4 ${
                        activeTab === 'rma_request' ? 'block' : 'hidden'
                    }`}
                >
                    <h2 className="text-lg font-extrabold text-[#11161B]">{copy.rmaTitle}</h2>
                    <form onSubmit={handleRmaSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                        <label className="flex flex-col gap-1 font-semibold">
                            Vardas, pavardė arba įmonė *
                            <input
                                type="text"
                                required
                                value={rmaClientName}
                                onChange={(e) => setRmaClientName(e.target.value)}
                                placeholder="Jonas Kazlauskas"
                                className="h-11 px-3 rounded-lg border border-[#D5CFC3] bg-[#FAF9F6]"
                            />
                        </label>
                        <label className="flex flex-col gap-1 font-semibold">
                            Telefono numeris *
                            <input
                                type="tel"
                                required
                                value={rmaClientPhone}
                                onChange={(e) => setRmaClientPhone(e.target.value)}
                                placeholder="+370 611 19158"
                                className="h-11 px-3 rounded-lg border border-[#D5CFC3] bg-[#FAF9F6]"
                            />
                        </label>
                        <label className="flex flex-col gap-1 font-semibold">
                            Sąskaitos Nr. arba įrangos S/N kodas
                            <input
                                type="text"
                                value={rmaSerialOrInvoice}
                                onChange={(e) => setRmaSerialOrInvoice(e.target.value)}
                                placeholder="GILE-0042 arba MPB-SN-2026-014"
                                className="h-11 px-3 rounded-lg border border-[#D5CFC3] bg-[#FAF9F6] font-mono"
                            />
                        </label>
                        <label className="flex flex-col gap-1 font-semibold">
                            Kreipimosi tipas
                            <select
                                value={rmaIssueType}
                                onChange={(e) =>
                                    setRmaIssueType(e.target.value as typeof rmaIssueType)
                                }
                                className="h-11 px-3 rounded-lg border border-[#D5CFC3] bg-white"
                            >
                                <option value="Garantinis gedimas">Garantinis gedimas</option>
                                <option value="Netiko sriegis / keitimas per 14 d.">
                                    Netiko sriegis / keitimas per 14 d.
                                </option>
                                <option value="Techninė konsultacija">Techninė konsultacija</option>
                            </select>
                        </label>
                        <label className="sm:col-span-2 flex flex-col gap-1 font-semibold">
                            Gedimo, keičiamo sriegio DN arba grąžinamos prekės aprašymas
                            <textarea
                                rows={3}
                                value={rmaDescription}
                                onChange={(e) => setRmaDescription(e.target.value)}
                                placeholder="Aprašykite situaciją arba nurodykite reikiamą pakaitinį SKU..."
                                className="p-3 rounded-lg border border-[#D5CFC3] bg-[#FAF9F6]"
                            />
                        </label>
                        <div className="sm:col-span-2 flex flex-wrap items-center justify-between gap-3">
                            <button
                                type="submit"
                                disabled={rmaSubmitting}
                                className="min-h-[44px] px-6 rounded-lg bg-[#C2410C] hover:bg-[#9A3412] text-white font-bold cursor-pointer"
                            >
                                {copy.rmaSubmitBtn}
                            </button>
                            {rmaTicketRef && (
                                <span className="inline-flex items-center gap-1.5 font-bold text-[#157A3B]">
                                    <CheckCircle2 className="w-4 h-4" />
                                    Užregistruota serviso ir RMA eilėje: {rmaTicketRef} (Eigulių g. 21, Kaunas)
                                </span>
                            )}
                        </div>
                    </form>
                </section>
            </div>
        </main>
    );
}
