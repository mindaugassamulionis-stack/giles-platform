'use client';

import { useState } from 'react';
import { FileSpreadsheet, Printer, Plus, RotateCcw, Check, Search } from 'lucide-react';
import { assetUrl } from '../lib/api';
import { GILES_SUPPLIER_PRICELISTS, type B2BQuickOrderResolvedRow } from '../lib/giles-masterpiece-data';
import type { B2BPartnerAccount } from '../lib/b2b-accounts';
import { calculateB2BCartPricing, type B2BCustomerPricingRule, type B2BMarketingCampaign } from '../lib/b2b-pricing-engine';
import { B2BCustomerMcpPanel } from './b2b-customer-mcp-panel';
import { B2BBomAndClientQuote } from './b2b-bom-and-client-quote';

export type B2BSidebarViewId = 'overview' | 'quick_order' | 'orders' | 'invoices' | 'projects' | 'pricelists';
export type SupportedB2BLocale = 'lt' | 'en' | 'pl' | 'ru';

export interface B2BOrderRecord {
    id: string; invoiceNo: string; site: string; status: string;
    netEur: number; grossEur: number;
    lines: { sku: string; title: string; qty: number; netUnitEur: number }[];
}

export interface B2BProjectQuote {
    id: string; name: string; clientName: string; markupPercent: number;
    items: { sku: string; title: string; qty: number; dealerNetEur: number }[];
}

export const INITIAL_B2B_ORDERS: B2BOrderRecord[] = [];
export const INITIAL_B2B_PROJECTS: B2BProjectQuote[] = [];

export const B2B_VIEWS_COPY: Record<SupportedB2BLocale, Record<string, string>> = {
    lt: {
        overviewTitle: 'Partnerio paskyros apžvalga ir rekvizitai', quickOrderHeading: 'Greitas užsakymas pagal SKU / EAN (6 337 prekių katalogas)',
        searchPlaceholder: 'Įveskite SKU, EAN arba prekės pavadinimą (pvz., 013G2990, ZV 100)...', addSkuBtn: '+ Pridėti į užsakymą',
        addToCartBtn: '+ Įkelti į krepšelį', submitOrderBtn: 'Pateikti B2B užsakymą', ordersHeading: 'B2B užsakymai ir i.VAZ važtaraščiai',
        repeatOrderBtn: 'Kartoti užsakymą', waybillBtn: 'i.VAZ važtaraštis', invoicesHeading: 'PVM sąskaitos faktūros',
        projectsHeading: 'Objektai ir komercinės sąmatos klientams', newProjectBtn: '+ Sukurti naują projekto sąmatą klientui',
        pricelistsHeading: 'Didmeniniai kainoraščiai (5)', stockInKaunas: 'Sandėlyje Kaune', netPriceLabel: 'Kaina be PVM su partnerio nuolaida',
        emptyOrdersTitle: 'Dar nėra pateiktų B2B užsakymų.', emptyOrdersDesc: 'Sukurkite savo pirmąjį didmeninį užsakymą skiltyje „Greitas užsakymas“.',
        emptyInvoicesTitle: 'Dar nėra išrašytų PVM sąskaitų faktūrų.', emptyInvoicesDesc: 'Patvirtinus jūsų B2B užsakymą čia automatiškai bus sugeneruota PVM sąskaita faktūra ir i.VAZ važtaraštis.',
        emptyProjectsTitle: 'Dar nėra sukurtų objektų sąmatų.', emptyProjectsDesc: 'Įveskite objekto pavadinimą ir užsakovą aukščiau esančioje formoje bei spauskite „+ Sukurti naują projekto sąmatą klientui“.',
    },
    en: {
        overviewTitle: 'Partner Account Overview & Company Details', quickOrderHeading: 'Quick Bulk Order by SKU / EAN (6,337 Catalog Items)',
        searchPlaceholder: 'Enter SKU, EAN or product name (e.g., 013G2990, ZV 100)...', addSkuBtn: '+ Add to Order',
        addToCartBtn: '+ Add to Cart', submitOrderBtn: 'Submit B2B Order', ordersHeading: 'B2B Orders & Packing Slips (i.VAZ)',
        repeatOrderBtn: 'Repeat Order', waybillBtn: 'Packing Slip / i.VAZ', invoicesHeading: 'VAT Invoices',
        projectsHeading: 'Projects & Client Commercial Quotes', newProjectBtn: '+ Create New Project Quote for Client',
        pricelistsHeading: 'Wholesale Pricelists (5)', stockInKaunas: 'In Kaunas Warehouse', netPriceLabel: 'Wholesale Net Price (excl. VAT)',
        emptyOrdersTitle: 'No B2B orders submitted yet.', emptyOrdersDesc: 'Create your first wholesale order in the Quick Order section.',
        emptyInvoicesTitle: 'No VAT invoices issued yet.', emptyInvoicesDesc: 'Once you submit a B2B order, your VAT invoice and i.VAZ packing slip will appear here.',
        emptyProjectsTitle: 'No project quotes created yet.', emptyProjectsDesc: 'Enter the project name and client above to create your first commercial quote.',
    },
    pl: {
        overviewTitle: 'Przegląd konta partnera i dane firmy', quickOrderHeading: 'Szybkie zamówienie hurtowe wg SKU / EAN (katalog 6 337 produktów)',
        searchPlaceholder: 'Wpisz kod SKU, EAN lub nazwę produktu (np. 013G2990, ZV 100)...', addSkuBtn: '+ Dodaj pozycję',
        addToCartBtn: '+ Dodaj do koszyka', submitOrderBtn: 'Złóż zamówienie B2B', ordersHeading: 'Zamówienia B2B i listy przewozowe (i.VAZ)',
        repeatOrderBtn: 'Ponów zamówienie', waybillBtn: 'List przewozowy i.VAZ', invoicesHeading: 'Faktury VAT',
        projectsHeading: 'Obiekty i kosztorysy dla klientów', newProjectBtn: '+ Utwórz nowy kosztorys projektu dla klienta',
        pricelistsHeading: 'Cenniki hurtowe (5)', stockInKaunas: 'Magazyn w Kownie', netPriceLabel: 'Cena netto z rabatem partnerskim',
        emptyOrdersTitle: 'Brak złożonych zamówień B2B.', emptyOrdersDesc: 'Utwórz swoje pierwsze zamówienie hurtowe w sekcji „Szybkie zamówienie”.',
        emptyInvoicesTitle: 'Brak wystawionych faktur VAT.', emptyInvoicesDesc: 'Po złożeniu zamówienia B2B faktura VAT pojawi się w tym miejscu.',
        emptyProjectsTitle: 'Brak utworzonych kosztorysów projektów.', emptyProjectsDesc: 'Wpisz nazwę obiektu i klienta powyżej, aby utworzyć kosztorys.',
    },
    ru: {
        overviewTitle: 'Обзор кабинета партнера и реквизиты компании', quickOrderHeading: 'Быстрый оптовый заказ по SKU / EAN (каталог 6 337 товаров)',
        searchPlaceholder: 'Введите артикул SKU, EAN или название (напр. 013G2990, ZV 100)...', addSkuBtn: '+ Добавить позицию',
        addToCartBtn: '+ В корзину', submitOrderBtn: 'Оформить B2B заказ', ordersHeading: 'Заказы B2B и накладные i.VAZ',
        repeatOrderBtn: 'Повторить заказ', waybillBtn: 'Накладная i.VAZ', invoicesHeading: 'Счета-фактуры НДС',
        projectsHeading: 'Объекты и сметы для клиентов', newProjectBtn: '+ Создать новую смету проекта для клиента',
        pricelistsHeading: 'Оптовые прайс-листы (5)', stockInKaunas: 'На складе в Каунасе', netPriceLabel: 'Оптовая цена без НДС со скидкой',
        emptyOrdersTitle: 'Оптовые заказы B2B еще не оформлены.', emptyOrdersDesc: 'Создайте свой первый заказ в разделе «Быстрый заказ».',
        emptyInvoicesTitle: 'Счета-фактуры НДС еще не выставлены.', emptyInvoicesDesc: 'После оформления заказа счет-фактура появится здесь автоматически.',
        emptyProjectsTitle: 'Сметы объектов еще не созданы.', emptyProjectsDesc: 'Укажите название объекта и заказчика выше, чтобы создать смету.',
    },
};

export function B2BPortalWorkspaceViews(props: {
    locale: SupportedB2BLocale; activeView: B2BSidebarViewId; setActiveView: (v: B2BSidebarViewId) => void;
    account: B2BPartnerAccount; rows: B2BQuickOrderResolvedRow[];
    pricingRule?: B2BCustomerPricingRule | null; campaigns?: B2BMarketingCampaign[];
    newSkuInput: string; setNewSkuInput: (v: string) => void;
    newQtyInput: number; setNewQtyInput: (v: number) => void; onAddSkuRow: (e: React.FormEvent) => void;
    onUpdateRowQty: (idx: number, qty: number) => void; onAddAllToCart: () => void; onSubmitB2BOrder: () => void;
    orders: B2BOrderRecord[]; onRepeatOrder: (order: B2BOrderRecord) => void;
    projects: B2BProjectQuote[]; onAddProject: (name: string, clientName: string, markupPercent: number) => void;
}) {
    const {
        locale, activeView, setActiveView, account, rows, pricingRule, campaigns = [], newSkuInput, setNewSkuInput,
        newQtyInput, setNewQtyInput, onAddSkuRow, onUpdateRowQty, onAddAllToCart,
        onSubmitB2BOrder, orders, onRepeatOrder, projects, onAddProject,
    } = props;
    const t = B2B_VIEWS_COPY[locale] || B2B_VIEWS_COPY.lt;

    const [expandedOrderId, setExpandedOrderId] = useState<string | null>(orders[0]?.id || null);
    const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
    const [newProjName, setNewProjName] = useState('');
    const [newProjClient, setNewProjClient] = useState('');
    const [newProjMarkup, setNewProjMarkup] = useState(18);
    const [pricelistQuery, setPricelistQuery] = useState('');

    const cartCalc = calculateB2BCartPricing({
        accountId: account.id, defaultAccountDiscountPct: account.defaultDiscountPercent,
        items: rows.map((r) => ({ sku: r.sku, title: r.title, brandName: r.brandName, retailGrossEur: r.retailGrossUnitEur, qty: r.qty })),
    });
    const totalNet = cartCalc.finalNetEur, totalGross = cartCalc.finalGrossEur, availableCredit = Math.max(0, account.creditLimitEur - account.creditUsedEur);

    if (activeView === 'overview') {
        return (
            <div data-testid="b2b-view-overview" className="space-y-5">
                <section data-testid="b2b-individual-pricing-banner" className="rounded-2xl border border-[#E2DDD3] bg-[#11161B] text-[#F5F3EE] p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div><strong className="text-[#FF8A3D] block">Mano individualios kainos: spec. SKU kainos, gamintojų nuolaidos ir papildoma krepšelio nuolaida</strong><span className="text-[#C9D0D8]">Spec. SKU kainų: {pricingRule?.skuOverrides?.length || 0} · Krepšelio papildoma nuolaida: -{cartCalc.combinedExtraCartDiscountPct}% ({cartCalc.activeVolumeTier?.label || 'Apimties laipteliai 1 000 € / 2 500 € / 5 000 €'})</span></div>
                    <span className="px-3 py-1 rounded-lg bg-[#1B232C] text-[#A9C83E] font-mono font-bold">Sutaupoma sąmatoje: {cartCalc.totalSavedEur.toFixed(2)} €</span>
                </section>
                {campaigns.length > 0 && (
                    <section data-testid="b2b-marketing-notifications" className="rounded-2xl border border-[#C2410C] bg-[#FAF9F6] p-4 space-y-2 text-xs">
                        <strong className="text-[#C2410C] block">Asmeniniai pasiūlymai ir B2B akcijos ({campaigns.length})</strong>
                        {campaigns.map((c) => (
                            <div key={c.id} className="rounded-lg bg-white border border-[#E2DDD3] p-2.5 flex flex-wrap items-center justify-between gap-2">
                                <span><strong>{c.title}</strong> · {c.message}</span>
                                {c.promoDiscountPct ? <span className="font-mono font-bold text-[#157A3B]">-{c.promoDiscountPct}%</span> : null}
                            </div>
                        ))}
                    </section>
                )}
                <section className="rounded-2xl border border-[#E2DDD3] bg-white p-5 space-y-4">
                    <h3 className="text-lg font-extrabold text-[#11161B]">{t.overviewTitle}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                        <div className="rounded-xl bg-[#F5F3EE] p-3.5 space-y-1"><span className="text-[#5B6470] block">Įmonė / Company</span><strong className="text-[#11161B] text-sm block">{account.companyName}</strong><span className="font-mono text-[#5B6470]">{account.companyCode} · {account.vatCode}</span></div>
                        <div className="rounded-xl bg-[#F5F3EE] p-3.5 space-y-1"><span className="text-[#5B6470] block">Nuolaidų grupė / Tier</span><strong className="text-[#C2410C] text-sm block">−{account.defaultDiscountPercent}% ({account.discountTier})</strong></div>
                        <div className="rounded-xl bg-[#F5F3EE] p-3.5 space-y-1"><span className="text-[#5B6470] block">Laisvas kredito likutis</span><strong className="text-[#11161B] text-sm block">{availableCredit.toLocaleString('lt-LT')} € / {account.creditLimitEur.toLocaleString('lt-LT')} €</strong><span className="text-[#5B6470]">Atidėjimas: {account.paymentTermsDays} d.</span></div>
                        <div className="rounded-xl bg-[#F5F3EE] p-3.5 space-y-1"><span className="text-[#5B6470] block">B2B vadybininkas</span><strong className="text-[#11161B] text-sm block">Darius Šauklys</strong><span className="text-[#C2410C] font-semibold">+370 611 19158 · info@gilesinzinerija.lt</span></div>
                    </div>
                </section>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <section className="rounded-2xl border border-[#E2DDD3] bg-white p-5 space-y-3">
                        <div className="flex items-center justify-between"><h4 className="text-base font-extrabold text-[#11161B]">{t.ordersHeading}</h4><button type="button" onClick={() => setActiveView('orders')} className="text-xs font-bold text-[#C2410C] hover:underline cursor-pointer bg-transparent border-0">Visi užsakymai ({orders.length})</button></div>
                        {orders.length === 0 ? (
                            <div className="rounded-xl bg-[#FAF9F6] border border-[#E2DDD3] p-4 space-y-2 text-xs">
                                <strong className="block text-[#11161B]">{t.emptyOrdersTitle}</strong>
                                <p className="text-[#5B6470]">{t.emptyOrdersDesc}</p>
                                <button type="button" onClick={() => setActiveView('quick_order')} className="h-9 px-3.5 rounded-lg bg-[#C2410C] text-white font-bold cursor-pointer">Greitas užsakymas</button>
                            </div>
                        ) : (
                            <div className="space-y-2 text-xs">
                                {orders.slice(0, 3).map((o) => (
                                    <div key={o.id} className="rounded-xl bg-[#FAF9F6] border border-[#E2DDD3] p-3 flex items-center justify-between">
                                        <div><span className="font-mono font-bold text-[#11161B]">{o.id}</span> · {o.site}<span className="block text-[#5B6470]">SF {o.invoiceNo}</span></div>
                                        <strong className="text-[#11161B]">{o.netEur.toFixed(2)} € be PVM</strong>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                    <section className="rounded-2xl border border-[#E2DDD3] bg-white p-5 space-y-3">
                        <div className="flex items-center justify-between"><h4 className="text-base font-extrabold text-[#11161B]">{t.quickOrderHeading}</h4><button type="button" onClick={() => setActiveView('quick_order')} className="text-xs font-bold text-[#C2410C] hover:underline cursor-pointer bg-transparent border-0">Atidaryti pilną lentelę ({rows.length})</button></div>
                        <form onSubmit={onAddSkuRow} className="flex flex-wrap gap-2">
                            <input type="text" value={newSkuInput} onChange={(e) => setNewSkuInput(e.target.value)} placeholder={t.searchPlaceholder} className="flex-1 min-w-[180px] h-10 px-3 rounded-lg border border-[#D5CFC3] bg-[#FAF9F6] text-xs text-[#11161B]" />
                            <button type="submit" className="h-10 px-4 rounded-lg bg-[#11161B] text-white text-xs font-bold cursor-pointer">{t.addSkuBtn}</button>
                        </form>
                        <div className="text-xs text-[#5B6470] flex items-center justify-between pt-1"><span>Aktyvi sąmata: <strong>{rows.length} poz.</strong></span><strong className="text-[#11161B]">{totalNet.toFixed(2)} € be PVM</strong></div>
                    </section>
                </div>
                <B2BBomAndClientQuote accountId={account.id} defaultDiscountPercent={account.defaultDiscountPercent} activeRows={rows} />
                <B2BCustomerMcpPanel locale={locale} account={account} />
            </div>
        );
    }

    if (activeView === 'quick_order') {
        return (
            <section data-testid="b2b-view-quick_order" className="rounded-2xl border border-[#E2DDD3] bg-white p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <div><h3 className="text-lg font-extrabold text-[#11161B]">{t.quickOrderHeading}</h3><p className="text-xs text-[#5B6470]">{t.netPriceLabel} (−{account.defaultDiscountPercent}%)</p></div>
                    <div className="flex flex-wrap gap-2">
                        <button type="button" onClick={onAddAllToCart} className="h-10 px-4 rounded-lg border border-[#D5CFC3] bg-white text-xs font-bold text-[#11161B] cursor-pointer">{t.addToCartBtn}</button>
                        <button type="button" data-testid="b2b-submit-order-btn" onClick={onSubmitB2BOrder} className="h-10 px-4 rounded-lg bg-[#C2410C] hover:bg-[#9A3412] text-white text-xs font-bold cursor-pointer">{t.submitOrderBtn} ({totalNet.toFixed(2)} €)</button>
                    </div>
                </div>
                <form onSubmit={onAddSkuRow} className="flex flex-wrap gap-2">
                    <input type="text" data-testid="b2b-quick-sku-input" value={newSkuInput} onChange={(e) => setNewSkuInput(e.target.value)} placeholder={t.searchPlaceholder} className="flex-1 min-w-[200px] h-10 px-3 rounded-lg border border-[#D5CFC3] bg-[#FAF9F6] text-xs font-mono text-[#11161B]" />
                    <input type="number" min={1} value={newQtyInput} onChange={(e) => setNewQtyInput(Number(e.target.value))} aria-label="Kiekis" className="w-20 h-10 px-2.5 rounded-lg border border-[#D5CFC3] bg-white text-xs font-bold text-[#11161B]" />
                    <button type="submit" className="h-10 px-4 rounded-lg bg-[#11161B] text-white text-xs font-bold cursor-pointer">{t.addSkuBtn}</button>
                </form>
                <div className="space-y-2">
                    {rows.map((r, idx) => (
                        <div key={`${r.sku}-${idx}`} className="rounded-xl bg-[#FAF9F6] border border-[#E2DDD3] p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
                            <div className="min-w-0 flex-1"><span className="font-mono font-bold text-[#C2410C]">{r.sku}</span> · <strong className="text-[#11161B]">{r.title}</strong><span className="block text-[#157A3B] mt-0.5">{r.brandName} · {t.stockInKaunas} · −{r.discountPercent}% ({r.dealerNetUnitEur.toFixed(2)} € / vnt. be PVM)</span></div>
                            <div className="flex items-center gap-3">
                                <div className="inline-flex items-center border border-[#D5CFC3] rounded-md bg-white"><button type="button" onClick={() => onUpdateRowQty(idx, r.qty - 1)} className="w-8 h-8 bg-transparent border-0 font-bold cursor-pointer">−</button><span className="px-2 font-bold">{r.qty}</span><button type="button" onClick={() => onUpdateRowQty(idx, r.qty + 1)} className="w-8 h-8 bg-transparent border-0 font-bold cursor-pointer">+</button></div>
                                <strong className="text-sm text-[#11161B] min-w-[90px] text-right">{r.lineTotalNetEur.toFixed(2)} €</strong>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="pt-2 border-t border-[#E2DDD3] flex flex-wrap justify-between text-xs font-bold text-[#11161B]"><span>Viso be PVM: {totalNet.toFixed(2)} €</span><span>Viso su PVM (21%): {totalGross.toFixed(2)} €</span></div>
                <B2BBomAndClientQuote accountId={account.id} defaultDiscountPercent={account.defaultDiscountPercent} activeRows={rows} />
            </section>
        );
    }

    if (activeView === 'orders') {
        return (
            <section data-testid="b2b-view-orders" className="rounded-2xl border border-[#E2DDD3] bg-white p-5 space-y-4">
                <h3 className="text-lg font-extrabold text-[#11161B]">{t.ordersHeading}</h3>
                {orders.length === 0 ? (
                    <div className="rounded-xl border border-[#E2DDD3] bg-[#FAF9F6] p-5 space-y-3 text-xs">
                        <strong className="block text-sm text-[#11161B]">{t.emptyOrdersTitle}</strong>
                        <p className="text-[#5B6470]">{t.emptyOrdersDesc}</p>
                        <button type="button" onClick={() => setActiveView('quick_order')} className="h-10 px-4 rounded-lg bg-[#C2410C] text-white font-bold cursor-pointer">Greitas užsakymas</button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {orders.map((o) => (
                            <div key={o.id} className="rounded-xl border border-[#E2DDD3] bg-[#FAF9F6] p-4 space-y-3 text-xs">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div><span className="font-mono font-bold text-[#11161B] text-sm">{o.id}</span><span className="block font-bold text-[#11161B] mt-0.5">{o.site} · SF {o.invoiceNo}</span></div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="px-2.5 py-1 rounded-full bg-[#E3F1E8] text-[#0F5A2B] font-bold">{o.status}</span>
                                        <button type="button" data-testid="b2b-repeat-order-btn" onClick={() => onRepeatOrder(o)} className="h-9 px-3 rounded-lg bg-[#11161B] text-white font-bold inline-flex items-center gap-1.5 cursor-pointer"><RotateCcw className="w-3.5 h-3.5" /> {t.repeatOrderBtn}</button>
                                        <button type="button" onClick={() => setExpandedOrderId(expandedOrderId === o.id ? null : o.id)} className="h-9 px-3 rounded-lg border border-[#D5CFC3] bg-white text-[#11161B] font-bold inline-flex items-center gap-1.5 cursor-pointer"><Printer className="w-3.5 h-3.5" /> {t.waybillBtn}</button>
                                    </div>
                                </div>
                                {expandedOrderId === o.id && (
                                    <div className="rounded-lg bg-white border border-[#E2DDD3] p-3 space-y-1.5">
                                        <div className="font-bold text-[#11161B]">i.VAZ važtaraštis · Sandėlis: Eigulių g. 21, LT-51418 Kaunas</div>
                                        {o.lines.map((line, i) => (
                                            <div key={`${o.id}-${i}`} className="flex justify-between text-[#5B6470]"><span><strong className="font-mono text-[#11161B]">{line.sku}</strong> · {line.title} × {line.qty} vnt.</span><span className="font-semibold text-[#11161B]">{(line.netUnitEur * line.qty).toFixed(2)} €</span></div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </section>
        );
    }

    if (activeView === 'invoices') {
        return (
            <section data-testid="b2b-view-invoices" className="rounded-2xl border border-[#E2DDD3] bg-white p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-lg font-extrabold text-[#11161B]">{t.invoicesHeading}</h3>
                    <div className="flex flex-wrap gap-2 text-xs">
                        <a href={assetUrl('/api/accounting/skaita?format=skaita_csv')} className="h-9 px-3 rounded-lg border border-[#D5CFC3] bg-[#FAF9F6] inline-flex items-center gap-1.5 font-bold text-[#11161B]"><FileSpreadsheet className="w-3.5 h-3.5 text-[#C2410C]" /> CSV buhalterijai</a>
                        <a href={assetUrl('/api/accounting/skaita?format=isaf_xml')} className="h-9 px-3 rounded-lg border border-[#D5CFC3] bg-[#FAF9F6] inline-flex items-center gap-1.5 font-bold text-[#11161B]"><FileSpreadsheet className="w-3.5 h-3.5 text-[#C2410C]" /> VMI i.SAF XML</a>
                    </div>
                </div>
                {orders.length === 0 ? (
                    <div className="rounded-xl border border-[#E2DDD3] bg-[#FAF9F6] p-5 space-y-3 text-xs">
                        <strong className="block text-sm text-[#11161B]">{t.emptyInvoicesTitle}</strong>
                        <p className="text-[#5B6470]">{t.emptyInvoicesDesc}</p>
                        <button type="button" onClick={() => setActiveView('quick_order')} className="h-10 px-4 rounded-lg bg-[#C2410C] text-white font-bold cursor-pointer">Greitas užsakymas</button>
                    </div>
                ) : (
                    <div className="space-y-2.5 text-xs">
                        {orders.map((o) => (
                            <div key={o.invoiceNo} className="rounded-xl border border-[#E2DDD3] bg-[#FAF9F6] p-4 flex flex-wrap items-center justify-between gap-3">
                                <div><span className="font-mono font-bold text-[#11161B] text-sm">{o.invoiceNo}</span><span className="block text-[#5B6470]">Pirkėjas: {account.companyName} ({account.companyCode}, {account.vatCode})</span></div>
                                <div className="flex items-center gap-3">
                                    <div className="text-right"><strong className="text-[#11161B] block">{o.netEur.toFixed(2)} € be PVM</strong><span className="text-[#5B6470]">{o.grossEur.toFixed(2)} € su PVM</span></div>
                                    <button type="button" onClick={() => setSelectedInvoiceId(selectedInvoiceId === o.invoiceNo ? null : o.invoiceNo)} className="h-9 px-3 rounded-lg bg-[#11161B] text-white font-bold cursor-pointer">PVM SF peržiūra</button>
                                </div>
                                {selectedInvoiceId === o.invoiceNo && (
                                    <div className="w-full rounded-lg bg-white border border-[#E2DDD3] p-3 mt-2 space-y-1">
                                        <strong>PVM SĄSKAITA FAKTŪRA Serija GILE Nr. {o.invoiceNo}</strong>
                                        <p className="text-[#5B6470]">Pardavėjas: UAB „Gilės inžinerija“ (302620907, LT100006119810, Eigulių g. 21, LT-51418 Kaunas) · Pirkėjas: {account.companyName}</p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </section>
        );
    }

    if (activeView === 'projects') {
        return (
            <section data-testid="b2b-view-projects" className="rounded-2xl border border-[#E2DDD3] bg-white p-5 space-y-4">
                <h3 className="text-lg font-extrabold text-[#11161B]">{t.projectsHeading}</h3>
                <form
                    onSubmit={(e) => {
                        e.preventDefault(); if (!newProjName.trim()) return;
                        onAddProject(newProjName.trim(), newProjClient.trim() || account.companyName, newProjMarkup);
                        setNewProjName(''); setNewProjClient('');
                    }}
                    className="grid grid-cols-1 sm:grid-cols-4 gap-2"
                >
                    <input type="text" value={newProjName} onChange={(e) => setNewProjName(e.target.value)} placeholder="Objekto pavadinimas..." className="h-10 px-3 rounded-lg border border-[#D5CFC3] text-xs" />
                    <input type="text" value={newProjClient} onChange={(e) => setNewProjClient(e.target.value)} placeholder="Klientas / Užsakovas..." className="h-10 px-3 rounded-lg border border-[#D5CFC3] text-xs" />
                    <input type="number" min={0} max={100} value={newProjMarkup} onChange={(e) => setNewProjMarkup(Number(e.target.value))} aria-label="Antkainis %" className="h-10 px-3 rounded-lg border border-[#D5CFC3] text-xs font-bold" />
                    <button type="submit" data-testid="b2b-new-project-btn" className="h-10 px-4 rounded-lg bg-[#C2410C] text-white text-xs font-bold cursor-pointer inline-flex items-center justify-center gap-1"><Plus className="w-3.5 h-3.5" /> {t.newProjectBtn}</button>
                </form>
                {projects.length === 0 ? (
                    <div className="rounded-xl border border-[#E2DDD3] bg-[#FAF9F6] p-5 space-y-2 text-xs">
                        <strong className="block text-sm text-[#11161B]">{t.emptyProjectsTitle}</strong>
                        <p className="text-[#5B6470]">{t.emptyProjectsDesc}</p>
                    </div>
                ) : (
                    <div className="space-y-3 text-xs">
                        {projects.map((p) => {
                            const dealerSum = p.items.reduce((s, i) => s + i.dealerNetEur * i.qty, 0);
                            const clientSum = Math.round(dealerSum * (1 + p.markupPercent / 100) * 100) / 100;
                            return (
                                <div key={p.id} className="rounded-xl border border-[#E2DDD3] bg-[#FAF9F6] p-4 flex flex-wrap items-center justify-between gap-2">
                                    <div><strong className="text-sm text-[#11161B] block">{p.name}</strong><span className="text-[#5B6470]">Užsakovas: {p.clientName} · Antkainis: +{p.markupPercent}%</span></div>
                                    <div className="text-right"><span className="text-[#5B6470] block">Savikaina jums: {dealerSum.toFixed(2)} € be PVM</span><strong className="text-[#157A3B] text-sm">Pasiūlymas klientui: {clientSum.toFixed(2)} € be PVM</strong></div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </section>
        );
    }

    const filteredLists = GILES_SUPPLIER_PRICELISTS.filter((pl) => `${pl.supplierName} ${pl.notes} ${pl.sourceFile}`.toLowerCase().includes(pricelistQuery.toLowerCase()));
    return (
        <section data-testid="b2b-view-pricelists" className="rounded-2xl border border-[#E2DDD3] bg-white p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-lg font-extrabold text-[#11161B]">{t.pricelistsHeading}</h3>
                <div className="relative min-w-[220px]"><Search className="w-3.5 h-3.5 text-[#5B6470] absolute left-3 top-3" /><input type="text" value={pricelistQuery} onChange={(e) => setPricelistQuery(e.target.value)} placeholder="Filtruoti tiekėją arba SKU..." className="w-full h-9 pl-8 pr-3 rounded-lg border border-[#D5CFC3] text-xs" /></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                {filteredLists.map((pl) => (
                    <div key={pl.id} className="rounded-xl border border-[#E2DDD3] bg-[#FAF9F6] p-4 space-y-2">
                        <div className="flex items-center justify-between"><strong className="text-sm text-[#11161B]">{pl.supplierName}</strong><span className="px-2.5 py-0.5 rounded-full bg-[#FBEADF] text-[#8A2F07] font-bold">{pl.dealerDiscountLabel}</span></div>
                        <p className="text-[#5B6470]">{pl.notes} · {pl.skuCount.toLocaleString('lt-LT')} poz.</p>
                        <div className="flex items-center justify-between pt-1"><span className="font-mono text-[#5B6470]">{pl.sourceFile}</span><a href={assetUrl(`/api/accounting/skaita?format=skaita_csv&supplier=${encodeURIComponent(pl.id)}`)} className="font-bold text-[#C2410C] hover:underline inline-flex items-center gap-1"><Check className="w-3.5 h-3.5" /> CSV</a></div>
                    </div>
                ))}
            </div>
        </section>
    );
}
