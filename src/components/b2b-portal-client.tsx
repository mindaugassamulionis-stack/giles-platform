'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { Lock, Clock, ShieldCheck, LogOut, RefreshCw } from 'lucide-react';
import { useCartStore } from '../store/cart';
import { assetUrl } from '../lib/api';
import { GILES_COMPANY_IDENTITY, type B2BQuickOrderResolvedRow } from '../lib/giles-masterpiece-data';
import { GilesBrandLogo } from './giles-logo';
import type { B2BPartnerAccount } from '../lib/b2b-accounts';
import { calculateB2BLineItemPrice, type B2BCustomerPricingRule, type B2BMarketingCampaign } from '../lib/b2b-pricing-engine';
import { B2BPortalWorkspaceViews, INITIAL_B2B_ORDERS, INITIAL_B2B_PROJECTS, type B2BOrderRecord, type B2BProjectQuote, type B2BSidebarViewId, type SupportedB2BLocale } from './b2b-portal-views'; import { TextWithEmail } from './email';
const B2B_HEADER_BRANDS = [
    { src: '/images/brands/giles-inzinerija.svg', label: 'Gilės Inžinerija / Megatherm' },
    { src: '/images/brands/danfoss.svg', label: 'Danfoss' },
    { src: '/images/brands/herz.svg', label: 'HERZ Armaturen' },
    { src: '/images/brands/haier.svg', label: 'Haier HVAC' },
    { src: '/images/brands/gorenje.svg', label: 'Gorenje / TIKI' },
    { src: '/images/brands/comisa.svg', label: 'Comisa' },
];

export interface EditableCatalogItem { id: string; sku: string; ean: string; title: string; brandName: string; grossEur: number; netEur: number; costNetEur: number; stock: number; }

const PORTAL_COPY: Record<SupportedB2BLocale, Record<string, string>> = {
    lt: {
        kicker: 'UAB „Gilės inžinerija“ · Montuotojų ir rangovų B2B portalas', title: 'Montuotojų ir B2B partnerių portalas',
        subtitle: 'Didmeninės ŠVOK kainos, greitas užsakymas pagal SKU/EAN ir PVM sąskaitos faktūros registruotiems partneriams.',
        deptHeader: 'UAB „Gilės inžinerija“ B2B skyrius · Darius Šauklys ·', deptFooter: 'UAB „Gilės inžinerija“ B2B skyrius · Darius Šauklys · +370 611 19158 · info@gilesinzinerija.lt',
        loginTitle: 'Prisijungimas B2B partneriams', loginSubtitle: 'Prisijunkite su patvirtinta UAB „Gilės inžinerija“ B2B partnerio paskyra.',
        emailLabel: 'El. paštas', emailPlaceholder: 'vardas@imone.lt', passwordLabel: 'Slaptažodis', loginBtn: 'Prisijungti',
        registerTitle: 'Naujo B2B partnerio / montuotojo registracija', registerSubtitle: 'Užpildykite įmonės duomenis. Po patvirtinimo bus aktyvuotos didmeninės nuolaidos (-35% .. -52%).',
        companyName: 'Įmonės pavadinimas *', companyPlaceholder: 'Jūsų įmonės pavadinimas', companyCode: 'Įmonės kodas *', vatCode: 'PVM mokėtojo kodas',
        contactPerson: 'Vardas, pavardė *', contactPlaceholder: 'Vardas Pavardė', phone: 'Telefonas *', activity: 'Veiklos sritis *',
        actInstall: 'ŠVOK montavimas', actDesign: 'Projektavimas', actTrade: 'Regioninė prekyba', lockNotice: 'Didmeninės kainos atrakinamos administracijai patvirtinus įmonės rekvizitus.',
        submitApplication: 'Pateikti paraišką administracijai', pendingTitle: 'Laukia administracijos patvirtinimo', pendingStatus: 'Paraiška užregistruota ir perduota UAB „Gilės inžinerija“ B2B skyriui.',
        companyShort: 'Įmonė', contactShort: 'Kontaktas', deptShort: 'B2B skyrius', checkStatusBtn: 'Tikrinti patvirtinimo būseną', logoutBtn: 'Atsijungti',
        b2bMenuAria: 'B2B meniu', b2bPartnerBadge: 'B2B Partneris', catalogLink: 'Katalogas (6 337)',
        navOverview: 'Apžvalga', navQuickOrder: 'Greitas užsakymas', navOrders: 'Užsakymai', navInvoices: 'PVM sąskaitos', navProjects: 'Objektai ir sąmatos', navPricelists: 'Didmeniniai kainoraščiai (5)',
    },
    en: {
        kicker: 'UAB Gilės inžinerija · Installer & Contractor B2B Portal', title: 'B2B Partner & Installer Portal',
        subtitle: 'Wholesale HVAC pricing, bulk SKU/EAN ordering, and VAT invoices for verified partners.',
        deptHeader: 'UAB „Gilės inžinerija“ B2B Desk · Darius Šauklys ·', deptFooter: 'UAB „Gilės inžinerija“ B2B Desk · Darius Šauklys · +370 611 19158 · info@gilesinzinerija.lt',
        loginTitle: 'B2B Partner Login', loginSubtitle: 'Sign in with your approved UAB Gilės inžinerija partner credentials.',
        emailLabel: 'Email address', emailPlaceholder: 'name@company.com', passwordLabel: 'Password', loginBtn: 'Sign In',
        registerTitle: 'New B2B Partner / Installer Registration', registerSubtitle: 'Submit your company details to unlock wholesale discounts (-35% .. -52%).',
        companyName: 'Company name *', companyPlaceholder: 'Your company name', companyCode: 'Company registration code *', vatCode: 'VAT number',
        contactPerson: 'Full name *', contactPlaceholder: 'First & Last Name', phone: 'Phone number *', activity: 'Business activity *',
        actInstall: 'HVAC installation', actDesign: 'Engineering design', actTrade: 'Regional trade', lockNotice: 'Wholesale prices are unlocked once administration verifies your company credentials.',
        submitApplication: 'Submit application for approval', pendingTitle: 'Pending administrator approval', pendingStatus: 'Your B2B application has been submitted to UAB Gilės inžinerija.',
        companyShort: 'Company', contactShort: 'Contact', deptShort: 'B2B Desk', checkStatusBtn: 'Check approval status', logoutBtn: 'Sign out',
        b2bMenuAria: 'B2B menu', b2bPartnerBadge: 'B2B Partner', catalogLink: 'Catalog (6,337)',
        navOverview: 'Overview', navQuickOrder: 'Quick Order', navOrders: 'Orders', navInvoices: 'VAT Invoices', navProjects: 'Projects & Quotes', navPricelists: 'Wholesale Pricelists (5)',
    },
    pl: {
        kicker: 'UAB Gilės inžinerija · Portal B2B dla instalatorów i wykonawców', title: 'Portal B2B dla partnerów i instalatorów',
        subtitle: 'Ceny hurtowe HVAC, szybkie zamówienia po SKU/EAN oraz faktury VAT dla zweryfikowanych partnerów.',
        deptHeader: 'Dział B2B UAB „Gilės inžinerija“ · Darius Šauklys ·', deptFooter: 'Dział B2B UAB „Gilės inžinerija“ · Darius Šauklys · +370 611 19158 · info@gilesinzinerija.lt',
        loginTitle: 'Logowanie dla partnerów B2B', loginSubtitle: 'Zaloguj się na zatwierdzone konto partnerskie UAB Gilės inžinerija.',
        emailLabel: 'Adres e-mail', emailPlaceholder: 'imie@firma.pl', passwordLabel: 'Hasło', loginBtn: 'Zaloguj się',
        registerTitle: 'Rejestracja nowego partnera / instalatora B2B', registerSubtitle: 'Wypełnij dane firmy, aby odblokować rabaty hurtowe (-35% .. -52%).',
        companyName: 'Nazwa firmy *', companyPlaceholder: 'Nazwa Twojej firmy', companyCode: 'Kod rejestracyjny firmy *', vatCode: 'Numer NIP / VAT',
        contactPerson: 'Imię i nazwisko *', contactPlaceholder: 'Imię i nazwisko', phone: 'Telefon *', activity: 'Profil działalności *',
        actInstall: 'Instalacje HVAC', actDesign: 'Projektowanie', actTrade: 'Dystrybucja regionalna', lockNotice: 'Ceny hurtowe zostają odblokowane po zatwierdzeniu danych firmy przez administrację.',
        submitApplication: 'Wyślij wniosek do administracji', pendingTitle: 'Oczekuje na zatwierdzenie administracji', pendingStatus: 'Twój wniosek B2B został przekazany do działu B2B UAB Gilės inžinerija.',
        companyShort: 'Firma', contactShort: 'Kontakt', deptShort: 'Dział B2B', checkStatusBtn: 'Sprawdź status zatwierdzenia', logoutBtn: 'Wyloguj się',
        b2bMenuAria: 'Menu B2B', b2bPartnerBadge: 'Partner B2B', catalogLink: 'Katalog (6 337)',
        navOverview: 'Przegląd', navQuickOrder: 'Szybkie zamówienie', navOrders: 'Zamówienia', navInvoices: 'Faktury VAT', navProjects: 'Obiekty i kosztorysy', navPricelists: 'Cenniki hurtowe (5)',
    },
    ru: {
        kicker: 'UAB Gilės inžinerija · B2B портал для монтажников и подрядчиков', title: 'B2B портал для партнеров и монтажников',
        subtitle: 'Оптовые цены ОВиК, быстрый заказ по SKU/EAN и счета-фактуры НДС для подтвержденных партнеров.',
        deptHeader: 'Отдел B2B UAB «Gilės inžinerija» · Darius Šauklys ·', deptFooter: 'Отдел B2B UAB «Gilės inžinerija» · Darius Šauklys · +370 611 19158 · info@gilesinzinerija.lt',
        loginTitle: 'Вход для B2B партнеров', loginSubtitle: 'Войдите в подтвержденный партнерский аккаунт UAB Gilės inžinerija.',
        emailLabel: 'Эл. почта', emailPlaceholder: 'name@company.com', passwordLabel: 'Пароль', loginBtn: 'Войти',
        registerTitle: 'Регистрация нового B2B партнера / монтажника', registerSubtitle: 'Заполните реквизиты компании для активации оптовых скидок (-35% .. -52%).',
        companyName: 'Название компании *', companyPlaceholder: 'Название вашей компании', companyCode: 'Код компании *', vatCode: 'Код плательщика НДС',
        contactPerson: 'Имя, фамилия *', contactPlaceholder: 'Имя и фамилия', phone: 'Телефон *', activity: 'Сфера деятельности *',
        actInstall: 'Монтаж ОВиК', actDesign: 'Проектирование', actTrade: 'Региональная торговля', lockNotice: 'Оптовые цены открываются после подтверждения реквизитов компании администрацией.',
        submitApplication: 'Отправить заявку администрации', pendingTitle: 'Ожидает подтверждения администрации', pendingStatus: 'Ваша заявка зарегистрирована и передана в отдел B2B UAB Gilės inžinerija.',
        companyShort: 'Компания', contactShort: 'Контакт', deptShort: 'Отдел B2B', checkStatusBtn: 'Проверить статус подтверждения', logoutBtn: 'Выйти',
        b2bMenuAria: 'Меню B2B', b2bPartnerBadge: 'B2B Партнер', catalogLink: 'Каталог (6 337)',
        navOverview: 'Обзор', navQuickOrder: 'Быстрый заказ', navOrders: 'Заказы', navInvoices: 'Счета-фактуры НДС', navProjects: 'Объекты и сметы', navPricelists: 'Оптовые прайс-листы (5)',
    },
};

export function B2BPortalClient({ locale: propLocale, initialQuickRows }: { locale?: string; initialQuickRows: B2BQuickOrderResolvedRow[]; initialEditorItems: EditableCatalogItem[] }) {
    const hookLocale = useLocale();
    const rawLoc = (propLocale || hookLocale || 'lt').toLowerCase();
    const locale: SupportedB2BLocale = rawLoc === 'en' || rawLoc === 'pl' || rawLoc === 'ru' ? rawLoc : 'lt';
    const t = PORTAL_COPY[locale];
    const addItem = useCartStore((s) => s.addItem);
    const openCart = useCartStore((s) => s.openCart);
    const [currentAccount, setCurrentAccount] = useState<B2BPartnerAccount | null>(null);
    const [activeView, setActiveView] = useState<B2BSidebarViewId>('overview');
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    const [loginError, setLoginError] = useState<string | null>(null);
    const [regCompanyName, setRegCompanyName] = useState('');
    const [regCompanyCode, setRegCompanyCode] = useState('');
    const [regVatCode, setRegVatCode] = useState('');
    const [regContactPerson, setRegContactPerson] = useState('');
    const [regEmail, setRegEmail] = useState('');
    const [regPhone, setRegPhone] = useState('');
    const [regActivityType, setRegActivityType] = useState<'ŠVOK montuotojas' | 'Projektuotojas' | 'Dileris'>('ŠVOK montuotojas');
    const [regPassword, setRegPassword] = useState('');
    const [regSubmitting, setRegSubmitting] = useState(false);
    const [rows, setRows] = useState<B2BQuickOrderResolvedRow[]>(initialQuickRows);
    const [newSkuInput, setNewSkuInput] = useState('');
    const [newQtyInput, setNewQtyInput] = useState(2);
    const [orders, setOrders] = useState<B2BOrderRecord[]>(INITIAL_B2B_ORDERS);
    const [projects, setProjects] = useState<B2BProjectQuote[]>(INITIAL_B2B_PROJECTS);
    const [pricingRule, setPricingRule] = useState<B2BCustomerPricingRule | null>(null);
    const [campaigns, setCampaigns] = useState<B2BMarketingCampaign[]>([]);

    useEffect(() => {
        if (!currentAccount || currentAccount.status !== 'APPROVED') return;
        fetch(assetUrl(`/api/b2b?accountId=${encodeURIComponent(currentAccount.id)}`)).then((r) => r.json()).then((d) => {
            if (d?.pricingRule) setPricingRule(d.pricingRule);
            if (Array.isArray(d?.campaigns)) setCampaigns(d.campaigns);
        }).catch(() => {});
    }, [currentAccount]);

    const handlePartnerLogin = async (e: React.FormEvent) => {
        e.preventDefault(); setLoginError(null);
        try {
            const res = await fetch(assetUrl('/api/b2b/accounts'), {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'login', email: loginEmail, password: loginPassword }),
            });
            const data = await res.json();
            if (!res.ok || !data?.account) { setLoginError(data?.error || 'Neteisingi prisijungimo duomenys.'); return; }
            setCurrentAccount(data.account);
        } catch { setLoginError('Nepavyko prisijungti prie serverio.'); }
    };

    const handleRegisterSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!regCompanyName.trim() || !regCompanyCode.trim() || !regEmail.trim()) return;
        setRegSubmitting(true);
        try {
            const res = await fetch(assetUrl('/api/b2b/accounts'), {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    companyName: regCompanyName, companyCode: regCompanyCode, vatCode: regVatCode || 'LT100000000000',
                    contactPerson: regContactPerson || regCompanyName, email: regEmail, phone: regPhone || '+370 600 00000',
                    activityType: regActivityType, password: regPassword || 'gile2026',
                }),
            });
            const data = await res.json();
            if (data?.account) setCurrentAccount(data.account);
        } finally { setRegSubmitting(false); }
    };

    const handleRefreshApprovalStatus = async () => {
        if (!currentAccount) return;
        try {
            const res = await fetch(assetUrl('/api/b2b/accounts'));
            const data = await res.json();
            const found = (data?.accounts || []).find(
                (a: B2BPartnerAccount) => a.id === currentAccount.id || a.email.toLowerCase() === currentAccount.email.toLowerCase(),
            );
            if (found) setCurrentAccount(found);
        } catch { /* keep state */ }
    };

    const handleAddSkuRow = async (e: React.FormEvent) => {
        e.preventDefault();
        const code = newSkuInput.trim(); if (!code) return;
        const qty = Math.max(1, Number(newQtyInput) || 1);
        const discount = currentAccount?.defaultDiscountPercent || 45;
        try {
            const res = await fetch(assetUrl(`/api/search?q=${encodeURIComponent(code)}`));
            const data = await res.json();
            const first = data?.results?.[0];
            const retailGross = first?.price && first.price > 0 ? Number(first.price) : 95;
            const calc = calculateB2BLineItemPrice({
                accountId: currentAccount?.id, defaultAccountDiscountPct: discount,
                sku: first?.sku || code.toUpperCase(), brandName: first?.brand || 'Gilės Inžinerija',
                retailGrossEur: retailGross, qty,
            });
            setRows((prev) => [
                ...prev,
                {
                    inputCode: code, qty, found: Boolean(first), productId: first?.id || `b2b-${Date.now()}`,
                    sku: calc.sku, ean: '5702420114200', title: first?.name || `Prekė ${code.toUpperCase()}`,
                    brandName: first?.brand || 'Gilės Inžinerija', stockLabel: 'Sandėlyje Kaune',
                    retailGrossUnitEur: calc.retailGrossEur, retailNetUnitEur: calc.retailNetEur, discountPercent: calc.appliedDiscountPct,
                    dealerNetUnitEur: calc.unitNetEur, dealerGrossUnitEur: calc.unitGrossEur,
                    lineTotalNetEur: calc.lineNetEur, lineTotalGrossEur: calc.lineGrossEur,
                    lineMarginEur: Math.round((calc.retailNetEur - calc.unitNetEur) * qty * 100) / 100, imageUrl: first?.image || '/images/products/013g2990.webp',
                },
            ]);
            setNewSkuInput('');
        } catch { /* ignore */ }
    };

    return (
        <main data-testid="giles-b2b-portal" className="min-h-screen w-full max-w-full overflow-x-clip bg-[#F5F3EE] text-[#11161B]">
            <style>{`#cookie-consent-banner { display: none !important; }`}</style>
            <section className="bg-[#11161B] text-[#F5F3EE] border-b border-[#2C3742] py-5 sm:py-7">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                        <span className="font-bold text-[#FF8A3D]">{t.kicker}</span>
                        <span className="text-[#C9D0D8]">{t.deptHeader} <strong className="text-white">{GILES_COMPANY_IDENTITY.phoneDarius}</strong></span>
                    </div>
                    <h1 className="text-2xl sm:text-4xl font-extrabold text-white leading-tight">{t.title}</h1>
                    <p className="text-xs sm:text-sm text-[#C9D0D8] max-w-2xl">{t.subtitle}</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-1">
                        {B2B_HEADER_BRANDS.map((b) => (
                            <div key={b.label} className="rounded-lg bg-[#1B232C] p-2.5 flex items-center gap-2 overflow-hidden">
                                <img src={assetUrl(b.src)} alt={b.label} className="h-9 w-11 rounded-sm bg-white object-contain p-1 shrink-0" />
                                <span className="text-xs font-bold text-white truncate">{b.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {currentAccount === null && (
                <section data-testid="b2b-auth-gate" className="mx-auto max-w-7xl px-4 sm:px-6 py-8 sm:py-12">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                        <div className="lg:col-span-5 rounded-2xl border border-[#E2DDD3] bg-white p-6 sm:p-8 space-y-4">
                            <h2 className="text-xl font-extrabold text-[#11161B]">{t.loginTitle}</h2>
                            <p className="text-xs sm:text-sm text-[#5B6470]">{t.loginSubtitle}</p>
                            <form onSubmit={handlePartnerLogin} className="space-y-3.5">
                                <label className="flex flex-col gap-1 text-xs font-semibold text-[#11161B]">{t.emailLabel}<input type="email" required data-testid="b2b-login-email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} placeholder={t.emailPlaceholder} className="h-11 px-3.5 rounded-lg border border-[#D5CFC3] bg-white text-sm text-[#11161B] placeholder:text-[#5B6470]" /></label>
                                <label className="flex flex-col gap-1 text-xs font-semibold text-[#11161B]">{t.passwordLabel}<input type="password" required data-testid="b2b-login-password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} placeholder="••••••••" className="h-11 px-3.5 rounded-lg border border-[#D5CFC3] bg-white text-sm text-[#11161B] placeholder:text-[#5B6470]" /></label>
                                {loginError && <p className="text-xs font-semibold text-[#B91C1C]">{loginError}</p>}
                                <button type="submit" data-testid="b2b-login-submit" className="w-full h-11 rounded-lg bg-[#11161B] hover:bg-[#C2410C] text-white font-bold text-sm cursor-pointer transition-colors">{t.loginBtn}</button>
                            </form>
                            <div className="rounded-xl bg-[#F5F3EE] p-3.5 text-xs text-[#5B6470]"><TextWithEmail text={t.deptFooter} /></div>
                        </div>

                        <div className="lg:col-span-7 rounded-2xl border border-[#E2DDD3] bg-white p-6 sm:p-8 space-y-4">
                            <h2 className="text-xl font-extrabold text-[#11161B]">{t.registerTitle}</h2>
                            <p className="text-xs sm:text-sm text-[#5B6470]">{t.registerSubtitle}</p>
                            <form data-testid="b2b-register-form" onSubmit={handleRegisterSubmit} className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                    <label className="flex flex-col gap-1 text-xs font-semibold text-[#11161B]">{t.companyName}<input type="text" required value={regCompanyName} onChange={(e) => setRegCompanyName(e.target.value)} placeholder={t.companyPlaceholder} className="h-11 px-3 rounded-lg border border-[#D5CFC3] text-sm placeholder:text-[#5B6470]" /></label>
                                    <label className="flex flex-col gap-1 text-xs font-semibold text-[#11161B]">{t.companyCode}<input type="text" required value={regCompanyCode} onChange={(e) => setRegCompanyCode(e.target.value)} placeholder="300000000" className="h-11 px-3 rounded-lg border border-[#D5CFC3] text-sm font-mono placeholder:text-[#5B6470]" /></label>
                                    <label className="flex flex-col gap-1 text-xs font-semibold text-[#11161B]">{t.vatCode}<input type="text" value={regVatCode} onChange={(e) => setRegVatCode(e.target.value)} placeholder="LT100000000000" className="h-11 px-3 rounded-lg border border-[#D5CFC3] text-sm font-mono placeholder:text-[#5B6470]" /></label>
                                    <label className="flex flex-col gap-1 text-xs font-semibold text-[#11161B]">{t.contactPerson}<input type="text" required value={regContactPerson} onChange={(e) => setRegContactPerson(e.target.value)} placeholder={t.contactPlaceholder} className="h-11 px-3 rounded-lg border border-[#D5CFC3] text-sm placeholder:text-[#5B6470]" /></label>
                                    <label className="flex flex-col gap-1 text-xs font-semibold text-[#11161B]">{t.emailLabel} *<input type="email" required value={regEmail} onChange={(e) => setRegEmail(e.target.value)} placeholder={t.emailPlaceholder} className="h-11 px-3 rounded-lg border border-[#D5CFC3] text-sm placeholder:text-[#5B6470]" /></label>
                                    <label className="flex flex-col gap-1 text-xs font-semibold text-[#11161B]">{t.phone}<input type="tel" required value={regPhone} onChange={(e) => setRegPhone(e.target.value)} placeholder="+370 600 00000" className="h-11 px-3 rounded-lg border border-[#D5CFC3] text-sm placeholder:text-[#5B6470]" /></label>
                                    <label className="flex flex-col gap-1 text-xs font-semibold text-[#11161B]">{t.activity}<select value={regActivityType} onChange={(e) => setRegActivityType(e.target.value as typeof regActivityType)} className="h-11 px-3 rounded-lg border border-[#D5CFC3] bg-white text-sm"><option value="ŠVOK montuotojas">{t.actInstall}</option><option value="Projektuotojas">{t.actDesign}</option><option value="Dileris">{t.actTrade}</option></select></label>
                                    <label className="flex flex-col gap-1 text-xs font-semibold text-[#11161B]">{t.passwordLabel} *<input type="password" required value={regPassword} onChange={(e) => setRegPassword(e.target.value)} placeholder="••••••••" className="h-11 px-3 rounded-lg border border-[#D5CFC3] text-sm placeholder:text-[#5B6470]" /></label>
                                </div>
                                <div className="rounded-xl bg-[#F5F3EE] p-3 flex items-center gap-2 text-xs text-[#5B6470]"><Lock className="w-4 h-4 text-[#C2410C] shrink-0" /> {t.lockNotice}</div>
                                <button type="submit" data-testid="b2b-register-submit-btn" disabled={regSubmitting} className="h-11 px-6 rounded-lg bg-[#C2410C] hover:bg-[#9A3412] text-white font-bold text-sm cursor-pointer transition-colors">{t.submitApplication}</button>
                            </form>
                        </div>
                    </div>
                </section>
            )}

            {currentAccount !== null && currentAccount.status !== 'APPROVED' && (
                <section data-testid="b2b-pending-screen" className="mx-auto max-w-4xl px-4 sm:px-6 py-10">
                    <div className="rounded-2xl border border-[#E2DDD3] bg-white p-6 sm:p-8 space-y-5">
                        <div className="flex items-center gap-3">
                            <span className="h-11 w-11 rounded-xl bg-[#FBEADF] text-[#8A2F07] flex items-center justify-center"><Clock className="w-5 h-5" /></span>
                            <div><h2 className="text-xl font-extrabold text-[#11161B]">{t.pendingTitle}</h2><p className="text-xs text-[#5B6470]">{t.pendingStatus}</p></div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 rounded-xl bg-[#F5F3EE] p-4 text-xs">
                            <div><span className="text-[#5B6470] block">{t.companyShort}</span><strong className="text-sm">{currentAccount.companyName} ({currentAccount.companyCode})</strong></div>
                            <div><span className="text-[#5B6470] block">{t.contactShort}</span><strong className="text-sm">{currentAccount.contactPerson} · {currentAccount.email}</strong></div>
                            <div><span className="text-[#5B6470] block">{t.deptShort}</span><strong className="text-sm">Darius Šauklys (+370 611 19158)</strong></div>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            <button type="button" data-testid="b2b-check-status-btn" onClick={handleRefreshApprovalStatus} className="h-11 px-5 rounded-lg bg-[#C2410C] text-white text-xs font-bold inline-flex items-center gap-2 cursor-pointer"><RefreshCw className="w-4 h-4" /> {t.checkStatusBtn}</button>
                            <button type="button" data-testid="b2b-logout-btn" onClick={() => setCurrentAccount(null)} className="h-11 px-5 rounded-lg border border-[#D5CFC3] bg-white text-xs font-bold text-[#11161B] inline-flex items-center gap-2 cursor-pointer"><LogOut className="w-4 h-4" /> {t.logoutBtn}</button>
                        </div>
                    </div>
                </section>
            )}

            {currentAccount !== null && currentAccount.status === 'APPROVED' && (
                <div data-testid="b2b-approved-workspace" className="mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-8">
                    <div className="flex flex-col lg:flex-row gap-6 items-start">
                        <aside aria-label={t.b2bMenuAria} className="w-full lg:w-64 shrink-0 rounded-2xl bg-[#11161B] text-[#C9D0D8] p-5 space-y-4">
                            <div className="pb-3 border-b border-[#2C3742]"><GilesBrandLogo variant="dark" /></div>
                            <div className="rounded-xl bg-[#1B232C] p-3.5 space-y-1">
                                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#FF8A3D]"><ShieldCheck className="w-3.5 h-3.5" /> {t.b2bPartnerBadge}</span>
                                <strong className="block text-sm text-white">{currentAccount.companyName}</strong>
                                <span className="block text-xs text-[#A3ADB8]">−{currentAccount.defaultDiscountPercent}% · {currentAccount.companyCode}</span>
                            </div>
                            <nav className="flex flex-col gap-1">
                                {([
                                    { id: 'overview', tid: 'b2b-nav-overview', label: t.navOverview },
                                    { id: 'quick_order', tid: 'b2b-nav-quick_order', label: t.navQuickOrder },
                                    { id: 'orders', tid: 'b2b-nav-orders', label: `${t.navOrders} (${orders.length})` },
                                    { id: 'invoices', tid: 'b2b-nav-invoices', label: t.navInvoices },
                                    { id: 'projects', tid: 'b2b-nav-projects', label: `${t.navProjects} (${projects.length})` },
                                    { id: 'pricelists', tid: 'b2b-nav-pricelists', label: t.navPricelists },
                                ] as const).map((nav) => (
                                    <button key={nav.id} type="button" data-testid={nav.tid} onClick={() => setActiveView(nav.id)} className={`h-10 px-3 rounded-lg text-left text-xs font-semibold cursor-pointer transition-colors border-0 ${activeView === nav.id ? 'bg-[#C2410C] text-white' : 'bg-transparent text-[#C9D0D8] hover:text-white'}`}>{nav.label}</button>
                                ))}
                            </nav>
                            <button type="button" data-testid="b2b-logout-btn" onClick={() => setCurrentAccount(null)} className="w-full h-10 px-3 rounded-lg bg-[#1B232C] text-xs font-bold text-[#C9D0D8] hover:text-white inline-flex items-center gap-2 cursor-pointer border-0"><LogOut className="w-3.5 h-3.5" /> {t.logoutBtn}</button>
                        </aside>

                        <div className="flex-1 min-w-0 space-y-5 w-full">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div><h2 className="text-xl sm:text-2xl font-extrabold text-[#11161B]">{currentAccount.companyName} · {currentAccount.contactPerson}</h2><p className="text-xs text-[#5B6470]">{currentAccount.discountTier}</p></div>
                                <Link href={`/${locale}/products`} className="h-10 px-4 rounded-lg border border-[#D5CFC3] bg-white inline-flex items-center text-xs font-bold text-[#11161B]">{t.catalogLink}</Link>
                            </div>
                            <B2BPortalWorkspaceViews
                                locale={locale} activeView={activeView} setActiveView={setActiveView} account={currentAccount} rows={rows}
                                pricingRule={pricingRule} campaigns={campaigns}
                                newSkuInput={newSkuInput} setNewSkuInput={setNewSkuInput} newQtyInput={newQtyInput} setNewQtyInput={setNewQtyInput}
                                onAddSkuRow={handleAddSkuRow}
                                onUpdateRowQty={(idx, nq) => {
                                    const q = Math.max(1, nq);
                                    setRows((prev) => prev.map((r, i) => (i !== idx ? r : { ...r, qty: q, lineTotalNetEur: Math.round(r.dealerNetUnitEur * q * 100) / 100, lineTotalGrossEur: Math.round(r.dealerGrossUnitEur * q * 100) / 100 })));
                                }}
                                onAddAllToCart={() => {
                                    for (const r of rows) addItem({ id: r.productId, productId: r.productId, name: `[B2B -${r.discountPercent}%] ${r.title}`, price: r.dealerGrossUnitEur, sku: r.sku, quantity: r.qty, image: r.imageUrl || '/images/products/013g2990.webp' });
                                    openCart();
                                }}
                                onSubmitB2BOrder={() => {
                                    const netEur = Math.round(rows.reduce((s, r) => s + r.lineTotalNetEur, 0) * 100) / 100;
                                    const seq = String(orders.length + 1).padStart(4, '0');
                                    const newOrder: B2BOrderRecord = { id: `B2B-${seq}`, invoiceNo: `GILE-${seq}`, site: currentAccount.companyName, status: 'Priimtas vykdymui', netEur, grossEur: Math.round(netEur * 1.21 * 100) / 100, lines: rows.map((r) => ({ sku: r.sku, title: r.title, qty: r.qty, netUnitEur: r.dealerNetUnitEur })) };
                                    setOrders((prev) => [newOrder, ...prev]);
                                    setActiveView('orders');
                                }}
                                orders={orders}
                                onRepeatOrder={(o) => {
                                    for (const l of o.lines) addItem({ id: l.sku, productId: l.sku, name: l.title, price: Math.round(l.netUnitEur * 1.21 * 100) / 100, sku: l.sku, quantity: l.qty });
                                    openCart();
                                }}
                                projects={projects}
                                onAddProject={(name, clientName, markupPercent) => setProjects((prev) => [{ id: `PRJ-${prev.length + 1}`, name, clientName, markupPercent, items: rows.map((r) => ({ sku: r.sku, title: r.title, qty: r.qty, dealerNetEur: r.dealerNetUnitEur })) }, ...prev])}
                            />
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
