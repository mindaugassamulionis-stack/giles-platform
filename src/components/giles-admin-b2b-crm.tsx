'use client';

import { useEffect, useState } from 'react';
import { Check, Plus, Trash2, Calculator, Send, AlertTriangle } from 'lucide-react';
import { assetUrl } from '../lib/api';
import type { B2BPartnerAccount } from '../lib/b2b-accounts';
import {
    SUPPORTED_B2B_BRANDS,
    SUPPORTED_B2B_CATEGORIES,
    DEFAULT_CART_VOLUME_TIERS,
    DEFAULT_QUANTITY_TIERS,
    calculateB2BCartPricing,
    getB2BCrmAnalyticsSnapshot,
    type B2BCartVolumeTier,
    type B2BCreditReminderRecord,
    type B2BCrmAnalyticsSnapshot,
    type B2BCustomer360Summary,
    type B2BCustomerNoteTag,
    type B2BCustomerPricingRule,
    type B2BCustomerProjectStatus,
    type B2BCustomerTierSegment,
    type B2BIndividualCommercialOffer,
    type B2BMarketingCampaign,
    type B2BPaymentDeferralDays,
    type B2BQuantityDiscountTier,
    type B2BSkuPriceOverride,
    type CartCustomQuoteRequest,
} from '../lib/b2b-pricing-engine';

type AdminB2BSubViewId = 'crm' | 'pricing' | 'offers' | 'marketing';

interface GilesAdminB2BCrmProps {
    onCreateProformaFromCrm?: (payload: {
        buyerName: string;
        sku: string;
        title: string;
        unitNetEur: number;
    }) => void;
}

export function GilesAdminB2BCrm({ onCreateProformaFromCrm }: GilesAdminB2BCrmProps) {
    const [subView, setSubView] = useState<AdminB2BSubViewId>('crm');
    const [accounts, setAccounts] = useState<B2BPartnerAccount[]>([]);
    const [customerRules, setCustomerRules] = useState<Record<string, B2BCustomerPricingRule>>({});
    const [offers, setOffers] = useState<B2BIndividualCommercialOffer[]>([]);
    const [campaigns, setCampaigns] = useState<B2BMarketingCampaign[]>([]);
    const [quoteRequests, setQuoteRequests] = useState<CartCustomQuoteRequest[]>([]);
    const [globalVolumeTiers, setGlobalVolumeTiers] =
        useState<B2BCartVolumeTier[]>(DEFAULT_CART_VOLUME_TIERS);
    const [globalQuantityTiers, setGlobalQuantityTiers] =
        useState<B2BQuantityDiscountTier[]>(DEFAULT_QUANTITY_TIERS);
    const [selectedAccountId, setSelectedAccountId] = useState<string>('DEFAULT_TIER');
    const [notice, setNotice] = useState<string>('');
    const [crmAnalytics, setCrmAnalytics] = useState<B2BCrmAnalyticsSnapshot>(() =>
        getB2BCrmAnalyticsSnapshot({ previewSimulation: false }),
    );
    const [previewSimEnabled, setPreviewSimEnabled] = useState<boolean>(false);
    const [selectedMonthIdx, setSelectedMonthIdx] = useState<number>(11);
    const [clientSortKey, setClientSortKey] = useState<'purchased' | 'discounts' | 'orders'>('purchased');
    const [activeClient360Id, setActiveClient360Id] = useState<string>('');

    // Client 360° Project & Manager Note inputs
    const [projTitle, setProjTitle] = useState('');
    const [projLocation, setProjLocation] = useState('Eigulių g. 21, LT-51418 Kaunas');
    const [projStatus, setProjStatus] = useState<B2BCustomerProjectStatus>('active');
    const [projBudgetEur, setProjBudgetEur] = useState<number>(18500);
    const [projOrderedEur, setProjOrderedEur] = useState<number>(12400);
    const [projDiscountPct, setProjDiscountPct] = useState<number>(42);

    const [noteAuthor, setNoteAuthor] = useState('Darius Šauklys');
    const [noteTag, setNoteTag] = useState<B2BCustomerNoteTag>('kainodara');
    const [noteText, setNoteText] = useState('');
    const [noteFilterTag, setNoteFilterTag] = useState<B2BCustomerNoteTag | 'ALL'>('ALL');

    // Client 360° Credit Limit, Deferral & Invoices Ledger State
    const [editCreditLimitEur, setEditCreditLimitEur] = useState<number>(25000);
    const [editPaymentTermDays, setEditPaymentTermDays] = useState<B2BPaymentDeferralDays>(30);
    const [editAutoThresholdPct, setEditAutoThresholdPct] = useState<number>(80);
    const [editAutoRemindersEnabled, setEditAutoRemindersEnabled] = useState<boolean>(true);
    const [newInvNumber, setNewInvNumber] = useState<string>('GILE-2026-1088');
    const [newInvAmountEur, setNewInvAmountEur] = useState<number>(4800);
    const [newInvProjectTitle, setNewInvProjectTitle] = useState<string>(
        'Eigulių g. 21 katilinės mazgas',
    );
    const [simPaidInvoiceIds, setSimPaidInvoiceIds] = useState<string[]>([]);
    const [simExtraReminders, setSimExtraReminders] = useState<B2BCreditReminderRecord[]>([]);

    // Sub-view A: Create B2B Customer Form
    const [newCompanyName, setNewCompanyName] = useState('');
    const [newCompanyCode, setNewCompanyCode] = useState('');
    const [newVatCode, setNewVatCode] = useState('');
    const [newContactPerson, setNewContactPerson] = useState('');
    const [newEmail, setNewEmail] = useState('');
    const [newPhone, setNewPhone] = useState('');
    const [newTierLabel, setNewTierLabel] = useState<B2BCustomerTierSegment>('Montuotojas');
    const [newDiscountPct, setNewDiscountPct] = useState<number>(35);
    const [newCreditLimit, setNewCreditLimit] = useState<number>(10000);
    const [newDeferralDays, setNewDeferralDays] = useState<B2BPaymentDeferralDays>(14);
    const [newManager, setNewManager] = useState('Darius Šauklys');

    // Sub-view B: Individual Pricing State (Layer 1, Layer 2, Layer 3)
    const [brandDiscounts, setBrandDiscounts] = useState<Record<string, number>>({
        Danfoss: 45,
        Haier: 40,
        'IMI Heimeier': 42,
        HERZ: 48,
        'Gilės / Megatherm': 35,
        'Gorenje / Tiki': 38,
        Dražice: 36,
        Ferroli: 40,
    });
    const [categoryDiscounts, setCategoryDiscounts] = useState<Record<string, number>>({
        'Granulių degikliai': 35,
        'Šilumos siurbliai': 40,
    });
    const [skuOverrides, setSkuOverrides] = useState<B2BSkuPriceOverride[]>([]);
    const [skuSearchQuery, setSkuSearchQuery] = useState('');
    const [skuSearchResults, setSkuSearchResults] = useState<
        Array<{ sku: string; name: string; price: number; brand: string }>
    >([]);
    const [overrideSku, setOverrideSku] = useState('013G2990');
    const [overrideCustomPriceEur, setOverrideCustomPriceEur] = useState<string>('12.50');
    const [overrideCustomDiscountPct, setOverrideCustomDiscountPct] = useState<string>('');
    const [overrideMinQty, setOverrideMinQty] = useState<number>(5);
    const [overrideCostEur, setOverrideCostEur] = useState<number>(10.5);
    const [overrideNote, setOverrideNote] = useState('Projektinė montuotojo kaina');

    const [extraCartDiscountPct, setExtraCartDiscountPct] = useState<number>(4);
    const [extraCartFixedEur, setExtraCartFixedEur] = useState<number>(0);
    const [personalPromoCode, setPersonalPromoCode] = useState<string>('PARTNERIS-VIP');

    // Sub-view C: Commercial Offer Builder
    const [offerClientName, setOfferClientName] = useState('');
    const [offerTitle, setOfferTitle] = useState('');
    const [offerExtraCartPct, setOfferExtraCartPct] = useState<number>(5);
    const [offerValidUntil, setOfferValidUntil] = useState('Galioja 14 d.');
    const [offerSku, setOfferSku] = useState('MPB-NANI-35');
    const [offerItemTitle, setOfferItemTitle] = useState(
        'Granulių degiklio komplektas Megatherm MPB NANI 35 (8–35 kW)',
    );
    const [offerQty, setOfferQty] = useState<number>(1);
    const [offerRetailNet, setOfferRetailNet] = useState<number>(1942.15);
    const [offerCustomNet, setOfferCustomNet] = useState<number>(1580.0);

    // Sub-view D: Marketing Campaign Broadcast
    const [campTitle, setCampTitle] = useState('');
    const [campMessage, setCampMessage] = useState('');
    const [campCategory, setCampCategory] =
        useState<B2BMarketingCampaign['categoryTag']>('Sezoninė akcija');
    const [campTargetType, setCampTargetType] =
        useState<B2BMarketingCampaign['targetType']>('ALL_B2B');
    const [campTargetSegment, setCampTargetSegment] =
        useState<B2BCustomerTierSegment>('Montuotojas');
    const [campPromoPct, setCampPromoPct] = useState<number>(5);
    const [campCtaSku, setCampCtaSku] = useState('AW082HUGHA');

    const applySnapshot = (data: Record<string, unknown>) => {
        if (Array.isArray(data.accounts)) {
            const accs = data.accounts as B2BPartnerAccount[];
            setAccounts(accs);
            if (accs[0]?.id && selectedAccountId === 'DEFAULT_TIER') {
                setSelectedAccountId(accs[0].id);
            }
        }
        if (data.customerRules && typeof data.customerRules === 'object') {
            setCustomerRules(data.customerRules as Record<string, B2BCustomerPricingRule>);
        }
        if (Array.isArray(data.individualOffers)) {
            setOffers(data.individualOffers as B2BIndividualCommercialOffer[]);
        }
        if (Array.isArray(data.campaigns)) {
            setCampaigns(data.campaigns as B2BMarketingCampaign[]);
        }
        if (Array.isArray(data.cartQuoteRequests)) {
            setQuoteRequests(data.cartQuoteRequests as CartCustomQuoteRequest[]);
        }
        if (Array.isArray(data.globalVolumeTiers)) {
            setGlobalVolumeTiers(data.globalVolumeTiers as B2BCartVolumeTier[]);
        }
        if (Array.isArray(data.globalQuantityTiers)) {
            setGlobalQuantityTiers(data.globalQuantityTiers as B2BQuantityDiscountTier[]);
        }
        if (data.crmAnalytics && typeof data.crmAnalytics === 'object') {
            const snap = data.crmAnalytics as B2BCrmAnalyticsSnapshot;
            setCrmAnalytics(snap);
            if (!activeClient360Id && snap.customers[0]?.accountId) {
                setActiveClient360Id(snap.customers[0].accountId);
            }
        }
    };

    useEffect(() => {
        fetch(assetUrl('/api/admin/b2b-pricing'))
            .then((r) => r.json())
            .then((d) => {
                if (d?.ok) applySnapshot(d);
            })
            .catch(() => {});
    }, []);

    useEffect(() => {
        const rule = customerRules[selectedAccountId];
        if (!rule) return;
        if (Object.keys(rule.brandDiscounts || {}).length > 0) {
            setBrandDiscounts((prev) => ({ ...prev, ...rule.brandDiscounts }));
        }
        if (Object.keys(rule.categoryDiscounts || {}).length > 0) {
            setCategoryDiscounts((prev) => ({ ...prev, ...rule.categoryDiscounts }));
        }
        setSkuOverrides(rule.skuOverrides || []);
        setExtraCartDiscountPct(rule.cartDiscountRules?.extraCartDiscountPct ?? 0);
        setExtraCartFixedEur(rule.cartDiscountRules?.extraCartFixedEur ?? 0);
        setPersonalPromoCode(rule.cartDiscountRules?.personalPromoCode || '');
    }, [selectedAccountId, customerRules]);

    const handleCreateCustomer = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCompanyName.trim() || !newCompanyCode.trim() || !newEmail.trim()) return;
        try {
            const res = await fetch(assetUrl('/api/admin/b2b-pricing'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'create_customer',
                    companyName: newCompanyName.trim(),
                    companyCode: newCompanyCode.trim(),
                    vatCode: newVatCode.trim() || 'LT100000000000',
                    contactPerson: newContactPerson.trim() || newCompanyName.trim(),
                    email: newEmail.trim(),
                    phone: newPhone.trim() || '+370 611 19158',
                    tierLabel: newTierLabel,
                    defaultDiscountPercent: newDiscountPct,
                    creditLimitEur: newCreditLimit,
                    paymentTermsDays: newDeferralDays,
                    assignedManager: newManager,
                }),
            });
            const data = await res.json();
            if (data?.ok) {
                applySnapshot(data);
                if (data.account?.id) setSelectedAccountId(data.account.id);
                setNewCompanyName('');
                setNewCompanyCode('');
                setNewVatCode('');
                setNewContactPerson('');
                setNewEmail('');
                setNewPhone('');
                setNotice(`B2B klientas „${data.account.companyName}“ sukurtas ir aktyvuotas.`);
            }
        } catch {
            // ignore
        }
    };

    const handleUpdateCrmAccount = async (
        accountId: string,
        patch: {
            status?: B2BPartnerAccount['status'];
            creditLimitEur?: number;
            paymentTermsDays?: B2BPaymentDeferralDays;
            tierLabel?: B2BCustomerTierSegment;
            defaultDiscountPercent?: number;
            suspended?: boolean;
        },
    ) => {
        try {
            const res = await fetch(assetUrl('/api/admin/b2b-pricing'), {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'update_customer_crm',
                    accountId,
                    ...patch,
                }),
            });
            const data = await res.json();
            if (data?.ok) {
                applySnapshot(data);
                setNotice('Kliento CRM paskyros nustatymai išsaugoti.');
            }
        } catch {
            // ignore
        }
    };

    const handleSearchCatalogSku = async () => {
        const q = skuSearchQuery.trim();
        if (!q) return;
        try {
            const res = await fetch(assetUrl(`/api/search?q=${encodeURIComponent(q)}`));
            const data = await res.json();
            if (Array.isArray(data?.results)) {
                setSkuSearchResults(
                    data.results.slice(0, 6).map((item: Record<string, unknown>) => ({
                        sku: String(item.sku || ''),
                        name: String(item.name || ''),
                        price: Number(item.price) || 95,
                        brand: String(item.brand || 'Gilės Inžinerija'),
                    })),
                );
            }
        } catch {
            // ignore
        }
    };

    const handleAddSkuOverride = () => {
        const cleanSku = overrideSku.trim().toUpperCase();
        if (!cleanSku) return;
        const nextOverride: B2BSkuPriceOverride = {
            sku: cleanSku,
            customPriceEur: overrideCustomPriceEur ? Number(overrideCustomPriceEur) : undefined,
            customDiscountPct: overrideCustomDiscountPct
                ? Number(overrideCustomDiscountPct)
                : undefined,
            minQty: Math.max(1, Number(overrideMinQty) || 1),
            note: overrideNote.trim() || undefined,
        };
        setSkuOverrides((prev) => [
            nextOverride,
            ...prev.filter((o) => o.sku.toUpperCase() !== cleanSku),
        ]);
    };

    const handleSaveCustomerPricingRules = async () => {
        try {
            const res = await fetch(assetUrl('/api/admin/b2b-pricing'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'upsert_pricing_rule',
                    accountId: selectedAccountId,
                    brandDiscounts,
                    categoryDiscounts,
                    skuOverrides,
                    cartDiscountRules: {
                        extraCartDiscountPct,
                        extraCartFixedEur,
                        personalPromoCode: personalPromoCode.trim() || undefined,
                        volumeTiers: globalVolumeTiers,
                    },
                }),
            });
            const data = await res.json();
            if (data?.ok) {
                applySnapshot(data);
                setNotice(
                    `3 lygių individuali kainodara (prekės ženklams, SKU ir visam krepšeliui) išsaugota (${selectedAccountId}).`,
                );
            }
        } catch {
            // ignore
        }
    };

    const handleCreateOffer = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!offerTitle.trim()) return;
        const selectedAcc = accounts.find((a) => a.id === selectedAccountId);
        try {
            const res = await fetch(assetUrl('/api/admin/b2b-pricing'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'create_offer',
                    accountId: selectedAccountId,
                    clientName:
                        offerClientName.trim() ||
                        selectedAcc?.companyName ||
                        'B2B Partneris',
                    title: offerTitle.trim(),
                    extraWholeCartDiscountPct: offerExtraCartPct,
                    validUntil: offerValidUntil,
                    items: [
                        {
                            sku: offerSku.trim().toUpperCase(),
                            title: offerItemTitle.trim(),
                            qty: Math.max(1, Number(offerQty) || 1),
                            retailNetEur: Number(offerRetailNet) || 100,
                            customNetEur: Number(offerCustomNet) || 80,
                        },
                    ],
                }),
            });
            const data = await res.json();
            if (data?.ok) {
                applySnapshot(data);
                setOfferTitle('');
                setNotice(
                    `Komercinis pasiūlymas ${data.offer.offerNumber} sukurtas ir paruoštas dalinimuisi.`,
                );
            }
        } catch {
            // ignore
        }
    };

    const handleCreateCampaign = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!campTitle.trim() || !campMessage.trim()) return;
        try {
            const res = await fetch(assetUrl('/api/admin/b2b-pricing'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'create_campaign',
                    title: campTitle.trim(),
                    message: campMessage.trim(),
                    categoryTag: campCategory,
                    targetType: campTargetType,
                    targetSegment: campTargetType === 'SEGMENT' ? campTargetSegment : undefined,
                    targetAccountId:
                        campTargetType === 'SINGLE_CLIENT' ? selectedAccountId : undefined,
                    promoDiscountPct: campPromoPct,
                    ctaSku: campCtaSku.trim() || undefined,
                }),
            });
            const data = await res.json();
            if (data?.ok) {
                applySnapshot(data);
                setCampTitle('');
                setCampMessage('');
                setNotice('Marketinginis pranešimas išsiųstas ir aktyvuotas B2B portale.');
            }
        } catch {
            // ignore
        }
    };

    const handleDeleteCampaign = async (campaignId: string) => {
        try {
            const res = await fetch(
                assetUrl(`/api/admin/b2b-pricing?campaignId=${encodeURIComponent(campaignId)}`),
                { method: 'DELETE' },
            );
            const data = await res.json();
            if (data?.ok) applySnapshot(data);
        } catch {
            // ignore
        }
    };

    const handleTogglePreviewSimulation = () => {
        const next = !previewSimEnabled;
        setPreviewSimEnabled(next);
        const snap = getB2BCrmAnalyticsSnapshot({ previewSimulation: next });
        setCrmAnalytics(snap);
        if (snap.customers[0]?.accountId) {
            setActiveClient360Id(snap.customers[0].accountId);
        }
    };

    const handleUpsertProject = async (e: React.FormEvent, targetAccountId: string) => {
        e.preventDefault();
        if (!projTitle.trim() || !targetAccountId) return;
        try {
            const res = await fetch(assetUrl('/api/admin/b2b-pricing'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'upsert_project',
                    accountId: targetAccountId,
                    project: {
                        title: projTitle.trim(),
                        location: projLocation.trim() || 'Eigulių g. 21, LT-51418 Kaunas',
                        status: projStatus,
                        budgetEur: Number(projBudgetEur) || 0,
                        orderedEur: Number(projOrderedEur) || 0,
                        discountAppliedPct: Number(projDiscountPct) || 35,
                    },
                }),
            });
            const data = await res.json();
            if (data?.ok) {
                setPreviewSimEnabled(false);
                applySnapshot(data);
                setProjTitle('');
                setNotice('Kliento objektas / projektas išsaugotas ir įtrauktas į pirkimų analitiką.');
            }
        } catch {
            // ignore
        }
    };

    const handleDeleteProject = async (targetAccountId: string, projectId: string) => {
        try {
            const res = await fetch(assetUrl('/api/admin/b2b-pricing'), {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'delete_project',
                    accountId: targetAccountId,
                    projectId,
                }),
            });
            const data = await res.json();
            if (data?.ok) applySnapshot(data);
        } catch {
            // ignore
        }
    };

    const handleAddNote = async (e: React.FormEvent, targetAccountId: string) => {
        e.preventDefault();
        if (!noteText.trim() || !targetAccountId) return;
        try {
            const res = await fetch(assetUrl('/api/admin/b2b-pricing'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'add_note',
                    accountId: targetAccountId,
                    note: {
                        author: noteAuthor.trim() || 'Darius Šauklys',
                        tag: noteTag,
                        text: noteText.trim(),
                    },
                }),
            });
            const data = await res.json();
            if (data?.ok) {
                setPreviewSimEnabled(false);
                applySnapshot(data);
                setNoteText('');
                setNotice('Vadybininko pastaba išsaugota kliento 360° kortelėje.');
            }
        } catch {
            // ignore
        }
    };

    const handleDeleteNote = async (targetAccountId: string, noteId: string) => {
        try {
            const res = await fetch(assetUrl('/api/admin/b2b-pricing'), {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'delete_note',
                    accountId: targetAccountId,
                    noteId,
                }),
            });
            const data = await res.json();
            if (data?.ok) applySnapshot(data);
        } catch {
            // ignore
        }
    };

    const activeAnalytics: B2BCrmAnalyticsSnapshot = previewSimEnabled
        ? getB2BCrmAnalyticsSnapshot({ previewSimulation: true })
        : crmAnalytics;

    const sortedCustomers: B2BCustomer360Summary[] = [...activeAnalytics.customers].sort((a, b) => {
        if (clientSortKey === 'discounts') {
            return b.purchaseStats.totalDiscountsGrantedEur - a.purchaseStats.totalDiscountsGrantedEur;
        }
        if (clientSortKey === 'orders') {
            return b.purchaseStats.ordersCount - a.purchaseStats.ordersCount;
        }
        return b.purchaseStats.totalPurchasedEur - a.purchaseStats.totalPurchasedEur;
    });

        const activeClient360: B2BCustomer360Summary | null =
        sortedCustomers.find((c) => c.accountId === activeClient360Id) ||
        sortedCustomers.find((c) => c.accountId === selectedAccountId) ||
        sortedCustomers[0] ||
        null;

    useEffect(() => {
        if (!activeClient360) return;
        setEditCreditLimitEur(activeClient360.creditConfig.creditLimitEur);
        setEditPaymentTermDays(
            ([0, 7, 14, 30, 45, 60].includes(activeClient360.creditConfig.paymentTermDays)
                ? activeClient360.creditConfig.paymentTermDays
                : 30) as B2BPaymentDeferralDays,
        );
        setEditAutoThresholdPct(activeClient360.creditConfig.autoReminderThresholdPct || 80);
        setEditAutoRemindersEnabled(activeClient360.creditConfig.autoRemindersEnabled ?? true);
    }, [activeClient360?.accountId]);

    const handleSaveCreditTerms = async (targetAccountId: string) => {
        if (!targetAccountId || targetAccountId.startsWith('sim-')) {
            setNotice(
                `Kredito limitas (${editCreditLimitEur.toLocaleString('lt-LT')} €), atidėjimas (${editPaymentTermDays} d.) ir automatinio priminimo riba (≥${editAutoThresholdPct}%) atnaujinti.`,
            );
            return;
        }
        try {
            const res = await fetch(assetUrl('/api/admin/b2b-pricing'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'update_credit_terms',
                    accountId: targetAccountId,
                    creditLimitEur: Number(editCreditLimitEur) || 0,
                    paymentTermDays: Number(editPaymentTermDays) || 0,
                    autoReminderThresholdPct: Number(editAutoThresholdPct) || 80,
                    autoRemindersEnabled: editAutoRemindersEnabled,
                }),
            });
            const data = await res.json();
            if (data?.ok) {
                setPreviewSimEnabled(false);
                applySnapshot(data);
                setNotice(
                    `Kliento kredito limitas (${editCreditLimitEur.toLocaleString('lt-LT')} €), atidėjimas (${editPaymentTermDays} d.) ir automatinio priminimo slenkstis (≥${editAutoThresholdPct}%) išsaugoti.`,
                );
            }
        } catch {
            // ignore
        }
    };

    const handleIssueDeferredInvoice = async (e: React.FormEvent, targetAccountId: string) => {
        e.preventDefault();
        if (!targetAccountId || targetAccountId.startsWith('sim-')) {
            setNotice(
                `Sąskaita su atidėjimu ${newInvNumber} (${newInvAmountEur.toLocaleString('lt-LT')} €) įtraukta į kredito limito apskaitą.`,
            );
            return;
        }
        try {
            const res = await fetch(assetUrl('/api/admin/b2b-pricing'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'record_invoice_or_payment',
                    accountId: targetAccountId,
                    invoice: {
                        invoiceNumber: newInvNumber.trim() || `GILE-2026-${Date.now().toString().slice(-4)}`,
                        amountEur: Math.max(1, Number(newInvAmountEur) || 1000),
                        status: 'unpaid_deferred',
                        projectTitle: newInvProjectTitle.trim() || 'ŠVOK objektas',
                    },
                }),
            });
            const data = await res.json();
            if (data?.ok) {
                setPreviewSimEnabled(false);
                applySnapshot(data);
                setNotice(`Sąskaita ${newInvNumber} su atidėjimu išrašyta ir įskaičiuota į sunaudotą kredito limitą.`);
            }
        } catch {
            // ignore
        }
    };

    const handleMarkInvoicePaid = async (targetAccountId: string, invoiceId: string) => {
        if (!targetAccountId || targetAccountId.startsWith('sim-')) {
            setSimPaidInvoiceIds((prev) => (prev.includes(invoiceId) ? prev : [...prev, invoiceId]));
            setNotice(`Sąskaita ${invoiceId} pažymėta apmokėta, kliento kredito limitas atlaisvintas.`);
            return;
        }
        try {
            const res = await fetch(assetUrl('/api/admin/b2b-pricing'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'record_invoice_or_payment',
                    accountId: targetAccountId,
                    invoiceId,
                    markPaid: true,
                }),
            });
            const data = await res.json();
            if (data?.ok) {
                setPreviewSimEnabled(false);
                applySnapshot(data);
                setNotice('Sąskaita pažymėta apmokėta, kliento laisvas kredito limitas iškart perskaičiuotas.');
            }
        } catch {
            // ignore
        }
    };

    const handleSendClientReminder = async (targetClient: B2BCustomer360Summary) => {
        if (targetClient.accountId.startsWith('sim-')) {
            const simRec: B2BCreditReminderRecord = {
                id: `sim-rem-${Date.now()}`,
                accountId: targetClient.accountId,
                companyName: targetClient.companyName,
                type:
                    targetClient.creditLedgerSummary.overdueInvoicesCount > 0
                        ? 'overdue_invoice'
                        : 'approaching_limit',
                channel: 'email_and_portal',
                utilizationPct: targetClient.creditLedgerSummary.creditUtilizationPct,
                usedEur: targetClient.creditLedgerSummary.creditUsedEur,
                limitEur: targetClient.creditLedgerSummary.creditLimitEur,
                message: `Darius Šauklys išsiuntė priminimą: išnaudota ${targetClient.creditLedgerSummary.creditUtilizationPct}% kredito limito (${targetClient.creditLedgerSummary.creditUsedEur.toLocaleString('lt-LT')} € iš ${targetClient.creditLedgerSummary.creditLimitEur.toLocaleString('lt-LT')} €).`,
                triggeredBy: 'manual_darius',
                sentAt: new Date().toISOString(),
            };
            setSimExtraReminders((prev) => [simRec, ...prev]);
            setNotice(`Priminimas klientui „${targetClient.companyName}“ išsiųstas el. paštu ir B2B portale.`);
            return;
        }
        try {
            const res = await fetch(assetUrl('/api/admin/b2b-pricing'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'send_credit_reminder',
                    accountId: targetClient.accountId,
                    companyName: targetClient.companyName,
                    triggeredBy: 'manual_darius',
                }),
            });
            const data = await res.json();
            if (data?.ok) {
                applySnapshot(data);
                setNotice(`Priminimas klientui „${targetClient.companyName}“ išsiųstas.`);
            }
        } catch {
            // ignore
        }
    };

    const handleRunAutoRemindersSweep = async () => {
        if (previewSimEnabled || accounts.length === 0) {
            const simAuto: B2BCreditReminderRecord = {
                id: `sim-auto-${Date.now()}`,
                accountId: 'sim-b2b-kauno-siluma',
                companyName: 'UAB „Kauno Šilumos Mazgai“ (Simuliacija)',
                type: 'approaching_limit',
                channel: 'email_and_portal',
                utilizationPct: 85,
                usedEur: 38250,
                limitEur: 45000,
                message:
                    'Automatinis įspėjimas: pasiektas 85% kredito limito slenkstis (≥80%) · išsiųstas pranešimas el. paštu ir B2B portale.',
                triggeredBy: 'auto_threshold',
                sentAt: new Date().toISOString(),
            };
            setSimExtraReminders((prev) => [simAuto, ...prev]);
            setNotice('Automatinis kredito limitų (≥80 %) ir vėluojančių sąskaitų patikrinimas įvykdytas.');
            return;
        }
        try {
            const res = await fetch(assetUrl('/api/admin/b2b-pricing'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'run_auto_credit_reminders_sweep',
                }),
            });
            const data = await res.json();
            if (data?.ok) {
                applySnapshot(data);
                setNotice(
                    `Automatinis priminimų patikrinimas baigtas: sugeneruota ${data.generatedReminders?.length || 0} įspėjimų.`,
                );
            }
        } catch {
            // ignore
        }
    };

    const combinedRemindersLog: B2BCreditReminderRecord[] = [
        ...simExtraReminders,
        ...(activeAnalytics.creditRemindersLog || []),
    ];

    const maxMonthlyPurchased = Math.max(
        1,
        ...activeAnalytics.monthlyHistory.map((m) =>
            Math.max(m.purchasedEur, m.discountEur, m.marginEur),
        ),
    );
    const maxClientPurchased = Math.max(
        1,
        ...sortedCustomers.map((c) => c.purchaseStats.totalPurchasedEur),
    );
    const selectedMonthRecord =
        activeAnalytics.monthlyHistory[selectedMonthIdx] ||
        activeAnalytics.monthlyHistory[activeAnalytics.monthlyHistory.length - 1];

    // Live margin calculation for Layer 2 SKU override input
    const previewUnitNet = Number(overrideCustomPriceEur) || 0;
    const previewMarginPct =
        previewUnitNet > 0
            ? Math.round(((previewUnitNet - overrideCostEur) / previewUnitNet) * 1000) / 10
            : 0;
    const previewMarginWarning = previewUnitNet > 0 && previewMarginPct < 10;

    // Live simulator for Layer 3 Cart Pricing
    const liveCartSimulation = calculateB2BCartPricing({
        accountId: selectedAccountId,
        manualExtraCartDiscountPct: extraCartDiscountPct,
        items: [
            {
                sku: overrideSku || '013G2990',
                title: 'Danfoss RA 2990 termostatinė galvutė',
                brandName: 'Danfoss',
                retailGrossEur: 24.2,
                costNetEur: overrideCostEur || 10.5,
                qty: Math.max(5, overrideMinQty),
            },
            {
                sku: 'MPB-NANI-35',
                title: 'Granulių degiklis Megatherm MPB NANI 35',
                brandName: 'Gilės / Megatherm',
                retailGrossEur: 2350,
                costNetEur: 1280,
                qty: 1,
            },
        ],
    });

    return (
        <section
            data-testid="admin-b2b-crm-suite"
            className="rounded-2xl border border-[#E2DDD3] bg-white p-5 sm:p-6 space-y-6"
        >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#E2DDD3] pb-4">
                <div className="space-y-0.5">
                    <span className="text-xs font-bold text-[#C2410C] block">
                        4 modulis · B2B CRM
                    </span>
                    <h2 className="text-xl sm:text-2xl font-extrabold text-[#11161B]">
                        Klientų CRM ir kainos
                    </h2>
                </div>
                <div className="flex flex-wrap gap-2">
                    {(
                        [
                            {
                                id: 'crm',
                                tid: 'admin-b2b-subview-crm',
                                label: `A. CRM (${accounts.length})`,
                            },
                            {
                                id: 'pricing',
                                tid: 'admin-b2b-subview-pricing',
                                label: 'B. Kainos',
                            },
                            {
                                id: 'offers',
                                tid: 'admin-b2b-subview-offers',
                                label: `C. Pasiūlymai (${offers.length})`,
                            },
                            {
                                id: 'marketing',
                                tid: 'admin-b2b-subview-marketing',
                                label: `D. Akcijos (${campaigns.length})`,
                            },
                        ] as const
                    ).map((tab) => (
                        <button
                            key={tab.id}
                            type="button"
                            data-testid={tab.tid}
                            onClick={() => setSubView(tab.id)}
                            className={`min-h-[44px] px-3.5 rounded-lg text-xs border cursor-pointer transition-colors bg-transparent ${
                                subView === tab.id
                                    ? 'bg-transparent border-[#C2410C] text-[#C2410C] font-semibold'
                                    : 'border-[#D5CFC4] text-[#4A545E] hover:border-[#11161B] hover:text-[#11161B]'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {notice && (
                <div className="rounded-xl bg-[#E3F1E8] text-[#0F5A2B] p-3 text-xs font-bold flex items-center justify-between">
                    <span>{notice}</span>
                    <button
                        type="button"
                        onClick={() => setNotice('')}
                        className="text-xs underline cursor-pointer bg-transparent border-0 text-[#0F5A2B]"
                    >
                        Uždaryti
                    </button>
                </div>
            )}

            {/* SUB-VIEW A: CUSTOMER & B2B CRM */}
            {subView === 'crm' && (
                <div data-testid="admin-b2b-crm-panel" className="space-y-6">
                    {/* EXECUTIVE B2B CRM ANALYTICS & SVG CHARTS */}
                    <div className="space-y-5">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-[#E2DDD3] pb-3">
                            <h3 className="text-base sm:text-lg font-extrabold text-[#11161B]">
                                B2B analitika
                            </h3>
                            <button
                                type="button"
                                data-testid="b2b-crm-preview-simulation-toggle"
                                onClick={handleTogglePreviewSimulation}
                                className={`min-h-[44px] px-3.5 rounded-lg text-xs border cursor-pointer whitespace-nowrap transition-colors bg-transparent ${
                                    previewSimEnabled
                                        ? 'border-[#C2410C] text-[#C2410C] font-semibold'
                                        : 'border-[#D5CFC4] text-[#4A545E] hover:border-[#11161B] hover:text-[#11161B]'
                                }`}
                            >
                                {previewSimEnabled
                                    ? 'Išjungti simuliaciją'
                                    : 'Simuliacija'}
                            </button>
                        </div>

                        {/* Top KPI summary strip */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 border-b border-[#E2DDD3] pb-4 text-xs">
                            <div className="space-y-0.5">
                                <span className="text-[#5B6470] block">Pirkimai</span>
                                <strong className="text-lg font-extrabold font-mono text-[#11161B] block">
                                    {activeAnalytics.totalPurchasedEur.toLocaleString('lt-LT', {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                    })}{' '}
                                    €
                                </strong>
                                <span className="text-[#5B6470]">
                                    Užsak.: <strong>{activeAnalytics.totalOrdersCount}</strong>
                                </span>
                            </div>
                            <div className="space-y-0.5">
                                <span className="text-[#5B6470] block">Nuolaidos</span>
                                <strong className="text-lg font-extrabold font-mono text-[#C2410C] block">
                                    -{activeAnalytics.totalDiscountsGrantedEur.toLocaleString('lt-LT', {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                    })}{' '}
                                    €
                                </strong>
                                <span className="text-[#5B6470]">
                                    Vid.: <strong className="font-mono">-{activeAnalytics.avgEffectiveDiscountPct}%</strong>
                                </span>
                            </div>
                            <div className="space-y-0.5">
                                <span className="text-[#5B6470] block">Marža</span>
                                <strong className="text-lg font-extrabold font-mono text-[#157A3B] block">
                                    +{activeAnalytics.totalNetMarginEur.toLocaleString('lt-LT', {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                    })}{' '}
                                    €
                                </strong>
                                <span className="text-[#5B6470]">
                                    Min: <strong className="font-mono">≥ 10%</strong>
                                </span>
                            </div>
                            <div className="space-y-0.5">
                                <span className="text-[#5B6470] block">Objektai</span>
                                <strong className="text-lg font-extrabold font-mono text-[#11161B] block">
                                    {activeAnalytics.activeProjectsCount} proj. · {activeAnalytics.totalNotesCount} past.
                                </strong>
                                <span className="text-[#5B6470]">
                                    Eigulių g. 21, Kaunas
                                </span>
                            </div>
                        </div>

                        {/* SVG CHART 1 & SVG CHART 2 */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {/* SVG Chart 1: 12-Month Purchase, Discount & Net Margin Dynamics */}
                            <div
                                data-testid="b2b-crm-svg-monthly-chart"
                                className="rounded-xl border border-[#E2DDD3] bg-[#FAF9F6] p-4 space-y-3 text-xs"
                            >
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div>
                                        <h4 className="text-sm font-extrabold text-[#11161B]">
                                            12 mėn. dinamika
                                        </h4>
                                    </div>
                                    {selectedMonthRecord && (
                                        <div className="font-mono text-xs">
                                            <strong>{selectedMonthRecord.month}</strong> ·{' '}
                                            <strong className="text-[#11161B]">
                                                {selectedMonthRecord.purchasedEur.toFixed(0)} €
                                            </strong>{' '}
                                            ·{' '}
                                            <strong className="text-[#C2410C]">
                                                -{selectedMonthRecord.discountEur.toFixed(0)} €
                                            </strong>{' '}
                                            ·{' '}
                                            <strong className="text-[#157A3B]">
                                                +{selectedMonthRecord.marginEur.toFixed(0)} €
                                            </strong>
                                        </div>
                                    )}
                                </div>

                                <svg
                                    viewBox="0 0 720 210"
                                    className="w-full h-48 overflow-visible"
                                    role="img"
                                    aria-label="12 mėnesių B2B pirkimų, suteiktų nuolaidų ir grynosios maržos grafikas"
                                >
                                    {[0, 0.5, 1].map((ratio, idx) => {
                                        const y = 165 - ratio * 130;
                                        const labelVal = Math.round(maxMonthlyPurchased * ratio);
                                        return (
                                            <g key={idx}>
                                                <line
                                                    x1={42}
                                                    y1={y}
                                                    x2={705}
                                                    y2={y}
                                                    stroke="#E2DDD3"
                                                    strokeDasharray="3 3"
                                                />
                                                <text
                                                    x={38}
                                                    y={y + 4}
                                                    textAnchor="end"
                                                    fontSize="10"
                                                    fill="#5B6470"
                                                >
                                                    {labelVal} €
                                                </text>
                                            </g>
                                        );
                                    })}

                                    {activeAnalytics.monthlyHistory.map((m, i) => {
                                        const groupX = 52 + i * 54;
                                        const pH = Math.max(
                                            3,
                                            Math.round((m.purchasedEur / maxMonthlyPurchased) * 130),
                                        );
                                        const dH = Math.max(
                                            2,
                                            Math.round((m.discountEur / maxMonthlyPurchased) * 130),
                                        );
                                        const mH = Math.max(
                                            2,
                                            Math.round((m.marginEur / maxMonthlyPurchased) * 130),
                                        );
                                        const isSelected = i === selectedMonthIdx;
                                        return (
                                            <g
                                                key={m.month}
                                                onClick={() => setSelectedMonthIdx(i)}
                                                className="cursor-pointer"
                                            >
                                                {isSelected && (
                                                    <rect
                                                        x={groupX - 4}
                                                        y={25}
                                                        width={44}
                                                        height={145}
                                                        rx={4}
                                                        fill="#F5F3EE"
                                                    />
                                                )}
                                                <rect
                                                    x={groupX}
                                                    y={165 - pH}
                                                    width={11}
                                                    height={pH}
                                                    rx={2}
                                                    fill="#11161B"
                                                />
                                                <rect
                                                    x={groupX + 13}
                                                    y={165 - dH}
                                                    width={11}
                                                    height={dH}
                                                    rx={2}
                                                    fill="#C2410C"
                                                />
                                                <rect
                                                    x={groupX + 26}
                                                    y={165 - mH}
                                                    width={11}
                                                    height={mH}
                                                    rx={2}
                                                    fill="#157A3B"
                                                />
                                                <text
                                                    x={groupX + 18}
                                                    y={184}
                                                    textAnchor="middle"
                                                    fontSize="10"
                                                    fontWeight={isSelected ? '700' : '500'}
                                                    fill={isSelected ? '#11161B' : '#5B6470'}
                                                >
                                                    {m.month.slice(5)} mėn.
                                                </text>
                                            </g>
                                        );
                                    })}
                                </svg>

                                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs text-[#5B6470]">
                                    <div className="flex flex-wrap items-center gap-3">
                                        <span className="inline-flex items-center gap-1.5">
                                            <span className="w-2.5 h-2.5 rounded-sm bg-[#11161B] inline-block" />
                                            Pirkimai
                                        </span>
                                        <span className="inline-flex items-center gap-1.5">
                                            <span className="w-2.5 h-2.5 rounded-sm bg-[#C2410C] inline-block" />
                                            Nuolaidos
                                        </span>
                                        <span className="inline-flex items-center gap-1.5">
                                            <span className="w-2.5 h-2.5 rounded-sm bg-[#157A3B] inline-block" />
                                            Marža
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* SVG Chart 2: Client Comparison Horizontal Bars */}
                            <div
                                data-testid="b2b-crm-svg-client-comparison-chart"
                                className="rounded-xl border border-[#E2DDD3] bg-[#FAF9F6] p-4 space-y-3 text-xs"
                            >
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div>
                                        <h4 className="text-sm font-extrabold text-[#11161B]">
                                            Klientų palyginimas
                                        </h4>
                                    </div>
                                    <div className="inline-flex flex-wrap gap-1">
                                        {(
                                            [
                                                { id: 'purchased', label: 'Pirkimai' },
                                                { id: 'discounts', label: 'Nuolaidos' },
                                                { id: 'orders', label: 'Užsakymai' },
                                            ] as const
                                        ).map((opt) => (
                                            <button
                                                key={opt.id}
                                                type="button"
                                                onClick={() => setClientSortKey(opt.id)}
                                                className={`px-2 py-1 rounded text-xs cursor-pointer whitespace-nowrap border bg-transparent ${
                                                    clientSortKey === opt.id
                                                        ? 'border-[#C2410C] text-[#C2410C] font-semibold'
                                                        : 'border-[#D5CFC4] text-[#4A545E] hover:border-[#11161B] hover:text-[#11161B]'
                                                }`}
                                            >
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {sortedCustomers.length === 0 ? (
                                    <p className="text-[#5B6470] py-2">
                                        Sąrašas tuščias (0 įrašų).
                                    </p>
                                ) : (
                                    <svg
                                        viewBox={`0 0 680 ${Math.max(120, sortedCustomers.slice(0, 5).length * 42 + 16)}`}
                                        className="w-full overflow-visible"
                                        role="img"
                                        aria-label="Klientų pirkimų ir suteiktų nuolaidų palyginimo grafikas"
                                    >
                                        {sortedCustomers.slice(0, 5).map((c, idx) => {
                                            const rowY = 12 + idx * 42;
                                            const pWidth = Math.max(
                                                8,
                                                Math.round(
                                                    (c.purchaseStats.totalPurchasedEur /
                                                        maxClientPurchased) *
                                                        340,
                                                ),
                                            );
                                            const dWidth = Math.max(
                                                4,
                                                Math.round(
                                                    (c.purchaseStats.totalDiscountsGrantedEur /
                                                        maxClientPurchased) *
                                                        340,
                                                ),
                                            );
                                            return (
                                                <g
                                                    key={c.accountId}
                                                    onClick={() => setActiveClient360Id(c.accountId)}
                                                    className="cursor-pointer"
                                                >
                                                    <text
                                                        x={0}
                                                        y={rowY + 12}
                                                        fontSize="11"
                                                        fontWeight="700"
                                                        fill="#11161B"
                                                    >
                                                        {c.companyName.slice(0, 26)}
                                                    </text>
                                                    <text
                                                        x={0}
                                                        y={rowY + 26}
                                                        fontSize="10"
                                                        fill="#5B6470"
                                                    >
                                                        {c.tierSegment} · -{c.purchaseStats.effectiveDiscountPct}%
                                                    </text>
                                                    <rect
                                                        x={195}
                                                        y={rowY + 2}
                                                        width={pWidth}
                                                        height={12}
                                                        rx={3}
                                                        fill="#11161B"
                                                    />
                                                    <rect
                                                        x={195}
                                                        y={rowY + 17}
                                                        width={dWidth}
                                                        height={10}
                                                        rx={3}
                                                        fill="#C2410C"
                                                    />
                                                    <text
                                                        x={202 + Math.max(pWidth, dWidth)}
                                                        y={rowY + 13}
                                                        fontSize="10"
                                                        fontWeight="700"
                                                        fill="#11161B"
                                                    >
                                                        {c.purchaseStats.totalPurchasedEur.toLocaleString('lt-LT')} € (nuol. -{c.purchaseStats.totalDiscountsGrantedEur.toLocaleString('lt-LT')} €)
                                                    </text>
                                                </g>
                                            );
                                        })}
                                    </svg>
                                )}
                            </div>
                        </div>

                        {/* B2B CREDIT LIMITS, DEFERRALS & INVOICE PAYMENTS OVERVIEW */}
                        <div
                            data-testid="b2b-crm-credit-overview"
                            className="rounded-xl border border-[#E2DDD3] bg-[#FAF9F6] p-4 space-y-3 text-xs"
                        >
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2 border-b border-[#E2DDD3] pb-2.5">
                                <div>
                                    <h4 className="text-sm font-extrabold text-[#11161B]">
                                        Kredito limitų, atidėjimų ir apmokėjimų suvestinė
                                    </h4>
                                    <p className="text-[#5B6470]">
                                        Pilnas klientų kredito limitų, mokėjimo atidėjimo terminų (0 / 7 / 14 / 30 / 45 / 60 d.), apmokėtų bei neapmokėtų sąskaitų ir automatinių priminimų (≥80 % limito) valdymas.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    data-testid="b2b-crm-auto-reminders-sweep-btn"
                                    onClick={handleRunAutoRemindersSweep}
                                    className="min-h-[40px] px-3.5 py-1.5 rounded-lg border border-[#C2410C] text-[#C2410C] font-semibold cursor-pointer bg-transparent hover:border-[#11161B] hover:text-[#11161B] text-left sm:text-center"
                                >
                                    Vykdyti automatinį priminimų patikrinimą (≥80 % limito / vėluojantys)
                                </button>
                            </div>

                            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 font-mono">
                                <div>
                                    <span className="font-sans text-[#5B6470] block">
                                        Bendra suteiktų limitų suma €
                                    </span>
                                    <strong className="text-sm font-extrabold text-[#11161B]">
                                        {(activeAnalytics.totalCreditLimitsEur || 0).toLocaleString('lt-LT')} €
                                    </strong>
                                </div>
                                <div>
                                    <span className="font-sans text-[#5B6470] block">
                                        Sunaudota / Neapmokėta €
                                    </span>
                                    <strong className="text-sm font-extrabold text-[#C2410C]">
                                        {(activeAnalytics.totalCreditUsedEur || 0).toLocaleString('lt-LT')} €
                                    </strong>
                                </div>
                                <div>
                                    <span className="font-sans text-[#5B6470] block">
                                        Apmokėta laiku €
                                    </span>
                                    <strong className="text-sm font-extrabold text-[#157A3B]">
                                        {(activeAnalytics.totalPaidInvoicesEur || 0).toLocaleString('lt-LT')} €
                                    </strong>
                                </div>
                                <div>
                                    <span className="font-sans text-[#5B6470] block">
                                        Vėluojama apmokėti €
                                    </span>
                                    <strong className="text-sm font-extrabold text-[#B91C1C]">
                                        {(activeAnalytics.totalOverdueInvoicesEur || 0).toLocaleString('lt-LT')} €
                                    </strong>
                                </div>
                                <div>
                                    <span className="font-sans text-[#5B6470] block">
                                        Artėja prie limito ≥80 %
                                    </span>
                                    <strong className="text-sm font-extrabold text-[#D97706]">
                                        {activeAnalytics.approachingLimitClientsCount || 0} kl. (vėluoja:{' '}
                                        {activeAnalytics.overdueClientsCount || 0})
                                    </strong>
                                </div>
                            </div>
                        </div>

                        {/* Sortable Customer Analytics Comparison Table */}
                        {sortedCustomers.length > 0 && (
                            <div className="space-y-2">
                                <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#5B6470]">
                                    Klientų pirkimų, suteiktų nuolaidų taisyklių, aktyvių projektų ir pastabų suvestinė
                                </h4>
                                <div className="grid grid-cols-1 gap-2.5 text-xs">
                                    {sortedCustomers.map((c) => {
                                        const isSelected = activeClient360?.accountId === c.accountId;
                                        return (
                                            <div
                                                key={c.accountId}
                                                onClick={() => setActiveClient360Id(c.accountId)}
                                                className={`rounded-xl border p-3.5 transition-colors cursor-pointer ${
                                                    isSelected
                                                        ? 'border-[#C2410C] bg-white'
                                                        : 'border-[#E2DDD3] bg-white hover:border-[#11161B]'
                                                }`}
                                            >
                                                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2">
                                                    <div className="space-y-1">
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <strong className="text-sm text-[#11161B]">
                                                                {c.companyName}
                                                            </strong>
                                                            <span className="px-2 py-0.5 rounded bg-[#F5F3EE] text-[#11161B] font-semibold">
                                                                {c.tierSegment} (bazinė -{c.grantedDiscountsSummary.baseDiscountPct}%)
                                                            </span>
                                                            <span className="font-mono text-[#157A3B] font-bold">
                                                                Nupirkta: {c.purchaseStats.totalPurchasedEur.toLocaleString('lt-LT')} € ({c.purchaseStats.ordersCount} užsak.)
                                                            </span>
                                                            <span className="font-mono text-[#C2410C] font-bold">
                                                                Suteikta nuolaidų: -{c.purchaseStats.totalDiscountsGrantedEur.toLocaleString('lt-LT')} € (vid. -{c.purchaseStats.effectiveDiscountPct}%)
                                                            </span>
                                                        </div>
                                                        <div className="space-y-1 pt-0.5">
                                                            <div className="flex flex-wrap items-center justify-between gap-2 text-[#11161B]">
                                                                <span>
                                                                    <strong>Kredito limitas:</strong> Sunaudota{' '}
                                                                    <strong className="font-mono">
                                                                        {c.creditLedgerSummary.creditUsedEur.toLocaleString('lt-LT')} €
                                                                    </strong>{' '}
                                                                    iš{' '}
                                                                    <strong className="font-mono">
                                                                        {c.creditLedgerSummary.creditLimitEur.toLocaleString('lt-LT')} €
                                                                    </strong>{' '}
                                                                    ·{' '}
                                                                    <strong className="font-mono">
                                                                        {c.creditLedgerSummary.creditUtilizationPct}%
                                                                    </strong>{' '}
                                                                    · Atidėjimas{' '}
                                                                    <strong>{c.creditConfig.paymentTermDays} d.</strong>
                                                                </span>
                                                                <span className="font-mono">
                                                                    Apmokėta:{' '}
                                                                    <strong className="text-[#157A3B]">
                                                                        {c.creditLedgerSummary.paidInvoicesTotalEur.toLocaleString('lt-LT')} €
                                                                    </strong>{' '}
                                                                    · Vėluoja:{' '}
                                                                    <strong className="text-[#B91C1C]">
                                                                        {c.creditLedgerSummary.overdueInvoicesTotalEur.toLocaleString('lt-LT')} €
                                                                    </strong>
                                                                </span>
                                                            </div>
                                                            <div className="w-full h-2 rounded-full bg-[#E2DDD3] overflow-hidden">
                                                                <div
                                                                    style={{
                                                                        width: `${Math.min(100, Math.max(2, c.creditLedgerSummary.creditUtilizationPct))}%`,
                                                                        backgroundColor:
                                                                            c.creditLedgerSummary.creditUtilizationPct > 95 ||
                                                                            c.creditLedgerSummary.overdueInvoicesCount > 0
                                                                                ? '#B91C1C'
                                                                                : c.creditLedgerSummary.creditUtilizationPct >= 75
                                                                                  ? '#D97706'
                                                                                  : '#157A3B',
                                                                    }}
                                                                    className="h-full"
                                                                />
                                                            </div>
                                                        </div>
                                                        <p className="text-[#5B6470]">
                                                            <strong>Suteiktos taisyklės:</strong>{' '}
                                                            {c.grantedDiscountsSummary.activeBrandDiscounts.length > 0
                                                                ? c.grantedDiscountsSummary.activeBrandDiscounts
                                                                      .map((b) => b.label)
                                                                      .join(', ')
                                                                : 'Standartinė matrica'}{' '}
                                                            · {c.grantedDiscountsSummary.skuOverridesLabel} ·{' '}
                                                            {c.grantedDiscountsSummary.wholeCartSummaryLabel}
                                                        </p>
                                                        <p className="text-[#5B6470]">
                                                            <strong>Aktyvūs projektai ({c.projects.length}):</strong>{' '}
                                                            {c.projects[0]
                                                                ? `${c.projects[0].title} (${c.projects[0].orderedEur.toLocaleString('lt-LT')} €)`
                                                                : 'Nėra priskirtų objektų'}{' '}
                                                            · <strong>Paskutinė pastaba:</strong>{' '}
                                                            {c.latestNote
                                                                ? `[${c.latestNote.tag.toUpperCase()}] ${c.latestNote.text}`
                                                                : 'Pastabų dar nėra'}
                                                        </p>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setActiveClient360Id(c.accountId);
                                                            if (!c.accountId.startsWith('sim-')) {
                                                                setSelectedAccountId(c.accountId);
                                                            }
                                                        }}
                                                        className="min-h-[40px] px-3 rounded-lg bg-[#11161B] text-white font-bold shrink-0 cursor-pointer"
                                                    >
                                                        Atidaryti 360° kortelę
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* CLIENT 360° DRAWER / DETAIL PANEL */}
                        <div
                            data-testid="b2b-client-360-drawer"
                            className="rounded-xl border border-[#D5CFC3] bg-white p-4 sm:p-5 space-y-4 text-xs"
                        >
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E2DDD3] pb-3">
                                <div>
                                    <span className="text-xs font-bold text-[#C2410C] block">
                                        Kliento 360° kortelė · Pirkimai, Suteiktos Nuolaidos, Objektai ir Vadybininko Pastabos
                                    </span>
                                    <h4 className="text-base font-extrabold text-[#11161B]">
                                        {activeClient360
                                            ? `${activeClient360.companyName} (${activeClient360.companyCode} · Vadybininkas: ${activeClient360.assignedManager})`
                                            : 'Pasirinkite arba sukurkite B2B klientą 360° kortelės peržiūrai'}
                                    </h4>
                                </div>
                                {activeClient360 && !activeClient360.accountId.startsWith('sim-') && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSelectedAccountId(activeClient360.accountId);
                                            setSubView('pricing');
                                        }}
                                        className="min-h-[40px] px-3.5 rounded-lg bg-[#C2410C] text-white font-bold cursor-pointer"
                                    >
                                        Konfigūruoti šio kliento 3 lygių nuolaidas
                                    </button>
                                )}
                            </div>

                            {activeClient360 ? (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                    {/* 1 & 2: Category breakdown + Granted Discounts Summary */}
                                    <div className="space-y-4">
                                        <div className="border-b border-[#E2DDD3] pb-3 space-y-2">
                                            <strong className="text-[#11161B] block">
                                                1. Pirkimų ir maržos struktūra bei kategorijų pasiskirstymas
                                            </strong>
                                            <div className="grid grid-cols-3 gap-2 font-mono text-xs">
                                                <div>
                                                    <span className="text-[#5B6470] block">Pirkta (€)</span>
                                                    <strong className="text-[#11161B]">
                                                        {activeClient360.purchaseStats.totalPurchasedEur.toLocaleString('lt-LT')} €
                                                    </strong>
                                                </div>
                                                <div>
                                                    <span className="text-[#5B6470] block">Nuolaidos (€)</span>
                                                    <strong className="text-[#C2410C]">
                                                        -{activeClient360.purchaseStats.totalDiscountsGrantedEur.toLocaleString('lt-LT')} €
                                                    </strong>
                                                </div>
                                                <div>
                                                    <span className="text-[#5B6470] block">Marža (€ / %)</span>
                                                    <strong className="text-[#157A3B]">
                                                        +{activeClient360.purchaseStats.netMarginEur.toLocaleString('lt-LT')} € ({activeClient360.purchaseStats.netMarginPct}%)
                                                    </strong>
                                                </div>
                                            </div>
                                            <div className="space-y-1 pt-1">
                                                {(
                                                    Object.entries(
                                                        activeClient360.purchaseStats.categoryBreakdown,
                                                    ) as Array<[string, number]>
                                                ).map(([cat, val]) => (
                                                    <div key={cat} className="flex items-center justify-between text-xs">
                                                        <span className="text-[#5B6470]">{cat}</span>
                                                        <strong className="font-mono text-[#11161B]">
                                                            {val.toLocaleString('lt-LT')} €
                                                        </strong>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <strong className="text-[#11161B] block">
                                                2. Suteiktos nuolaidos (Brand matrica + Spec. SKU kainos + Viso krepšelio nuolaidos)
                                            </strong>
                                            <p className="text-[#5B6470]">
                                                Segmentas: <strong>{activeClient360.grantedDiscountsSummary.tierSegment}</strong> · Bazinė nuolaida:{' '}
                                                <strong className="font-mono text-[#C2410C]">
                                                    -{activeClient360.grantedDiscountsSummary.baseDiscountPct}%
                                                </strong>
                                            </p>
                                            <div className="flex flex-wrap gap-1.5">
                                                {activeClient360.grantedDiscountsSummary.activeBrandDiscounts.map((b) => (
                                                    <span
                                                        key={b.brand}
                                                        className="px-2 py-0.5 rounded bg-[#FAF9F6] border border-[#D5CFC3] font-mono font-bold text-[#11161B]"
                                                    >
                                                        {b.label}
                                                    </span>
                                                ))}
                                                {activeClient360.grantedDiscountsSummary.activeCategoryDiscounts.map((c) => (
                                                    <span
                                                        key={c.category}
                                                        className="px-2 py-0.5 rounded bg-[#FAF9F6] border border-[#D5CFC3] font-mono text-[#5B6470]"
                                                    >
                                                        {c.label}
                                                    </span>
                                                ))}
                                            </div>
                                            <p className="text-[#5B6470]">
                                                <strong>Spec. SKU kainos:</strong> {activeClient360.grantedDiscountsSummary.skuOverridesLabel}
                                            </p>
                                            <p className="text-[#5B6470]">
                                                <strong>Krepšelio taisyklė:</strong> {activeClient360.grantedDiscountsSummary.wholeCartSummaryLabel}
                                            </p>
                                        </div>
                                    </div>

                                    {/* 3 & 4: Customer Projects / Objects + Manager Notes & Interaction Log */}
                                    <div className="space-y-4">
                                        {/* 3. Customer Projects / Objects */}
                                        <div className="border-b border-[#E2DDD3] pb-3 space-y-2.5">
                                            <strong className="text-[#11161B] block">
                                                3. Objektai ir projektai ({activeClient360.projects.length})
                                            </strong>
                                            <form
                                                onSubmit={(e) => handleUpsertProject(e, activeClient360.accountId)}
                                                className="grid grid-cols-1 sm:grid-cols-3 gap-2"
                                            >
                                                <input
                                                    type="text"
                                                    value={projTitle}
                                                    onChange={(e) => setProjTitle(e.target.value)}
                                                    placeholder="Objekto / projekto pavadinimas *"
                                                    className="sm:col-span-2 min-h-[40px] px-2.5 rounded-lg border border-[#D5CFC3] bg-white"
                                                />
                                                <select
                                                    aria-label="Projekto būsena"
                                                    value={projStatus}
                                                    onChange={(e) =>
                                                        setProjStatus(
                                                            e.target.value as B2BCustomerProjectStatus,
                                                        )
                                                    }
                                                    className="min-h-[40px] px-2 rounded-lg border border-[#D5CFC3] bg-white font-semibold"
                                                >
                                                    <option value="planning">Planuojamas</option>
                                                    <option value="quoted">Pateikta sąmata</option>
                                                    <option value="active">Vykdomas objektas</option>
                                                    <option value="completed">Užbaigtas</option>
                                                </select>
                                                <input
                                                    type="number"
                                                    value={projBudgetEur}
                                                    onChange={(e) => setProjBudgetEur(Number(e.target.value))}
                                                    placeholder="Sąmata €"
                                                    className="min-h-[40px] px-2.5 rounded-lg border border-[#D5CFC3] bg-white font-mono"
                                                />
                                                <input
                                                    type="number"
                                                    value={projOrderedEur}
                                                    onChange={(e) => setProjOrderedEur(Number(e.target.value))}
                                                    placeholder="Užsakyta €"
                                                    className="min-h-[40px] px-2.5 rounded-lg border border-[#D5CFC3] bg-white font-mono"
                                                />
                                                <button
                                                    type="submit"
                                                    data-testid="b2b-add-project-btn"
                                                    className="min-h-[40px] px-3 rounded-lg bg-[#11161B] text-white font-bold cursor-pointer whitespace-nowrap"
                                                >
                                                    + Pridėti objektą
                                                </button>
                                            </form>

                                            <div className="space-y-1.5">
                                                {activeClient360.projects.map((p) => (
                                                    <div
                                                        key={p.id}
                                                        className="border-t border-[#E2DDD3] pt-2 flex items-center justify-between gap-2"
                                                    >
                                                        <div>
                                                            <strong className="text-[#11161B]">{p.title}</strong>{' '}
                                                            <span className="text-[#5B6470]">({p.location})</span>
                                                            <span className="block font-mono text-xs text-[#5B6470]">
                                                                Statusas: <strong>{p.status}</strong> · Sąmata:{' '}
                                                                {p.budgetEur.toLocaleString('lt-LT')} € · Nupirkta:{' '}
                                                                <strong className="text-[#157A3B]">
                                                                    {p.orderedEur.toLocaleString('lt-LT')} €
                                                                </strong>{' '}
                                                                (-{p.discountAppliedPct}%)
                                                            </span>
                                                        </div>
                                                        {!p.id.startsWith('sim-') && (
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    handleDeleteProject(
                                                                        activeClient360.accountId,
                                                                        p.id,
                                                                    )
                                                                }
                                                                className="text-[#B91C1C] font-bold cursor-pointer bg-transparent border-0"
                                                            >
                                                                Šalinti
                                                            </button>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* 4. Manager Notes & Interaction Log */}
                                        <div className="space-y-2.5">
                                            <div className="flex flex-wrap items-center justify-between gap-2">
                                                <strong className="text-[#11161B]">
                                                    4. Pastabos ir komunikacijos istorija ({activeClient360.notes.length})
                                                </strong>
                                                <select
                                                    aria-label="Filtruoti pastabas pagal žymą"
                                                    value={noteFilterTag}
                                                    onChange={(e) =>
                                                        setNoteFilterTag(
                                                            e.target.value as B2BCustomerNoteTag | 'ALL',
                                                        )
                                                    }
                                                    className="h-8 px-2 rounded border border-[#D5CFC3] bg-white text-xs font-semibold"
                                                >
                                                    <option value="ALL">Visos žymos</option>
                                                    <option value="skambutis">Skambutis</option>
                                                    <option value="susitikimas">Susitikimas</option>
                                                    <option value="kainodara">Kainodara</option>
                                                    <option value="objektas">Objektas</option>
                                                    <option value="buhalterija">Buhalterija</option>
                                                </select>
                                            </div>

                                            <form
                                                onSubmit={(e) => handleAddNote(e, activeClient360.accountId)}
                                                className="grid grid-cols-1 sm:grid-cols-3 gap-2"
                                            >
                                                <select
                                                    aria-label="Pastabos žyma"
                                                    value={noteTag}
                                                    onChange={(e) =>
                                                        setNoteTag(e.target.value as B2BCustomerNoteTag)
                                                    }
                                                    className="min-h-[40px] px-2 rounded-lg border border-[#D5CFC3] bg-white font-semibold"
                                                >
                                                    <option value="kainodara">Kainodara</option>
                                                    <option value="objektas">Objektas</option>
                                                    <option value="skambutis">Skambutis</option>
                                                    <option value="susitikimas">Susitikimas</option>
                                                    <option value="buhalterija">Buhalterija</option>
                                                </select>
                                                <input
                                                    type="text"
                                                    value={noteText}
                                                    onChange={(e) => setNoteText(e.target.value)}
                                                    placeholder="Įrašyti vadybininko pastabą arba susitarimą..."
                                                    className="min-h-[40px] px-2.5 rounded-lg border border-[#D5CFC3] bg-white"
                                                />
                                                <button
                                                    type="submit"
                                                    data-testid="b2b-add-note-btn"
                                                    className="min-h-[40px] px-3 rounded-lg bg-[#C2410C] text-white font-bold cursor-pointer whitespace-nowrap"
                                                >
                                                    + Pridėti pastabą
                                                </button>
                                            </form>

                                            <div className="space-y-1.5">
                                                {activeClient360.notes
                                                    .filter(
                                                        (n) =>
                                                            noteFilterTag === 'ALL' ||
                                                            n.tag === noteFilterTag,
                                                    )
                                                    .map((n) => (
                                                        <div
                                                            key={n.id}
                                                            className="border-t border-[#E2DDD3] pt-2 flex items-center justify-between gap-2"
                                                        >
                                                            <div>
                                                                <span className="px-1.5 py-0.5 rounded bg-[#FBEADF] text-[#8A2F07] font-mono font-bold text-xs uppercase">
                                                                    {n.tag}
                                                                </span>{' '}
                                                                <strong className="text-[#11161B]">{n.author}</strong>:{' '}
                                                                <span className="text-[#5B6470]">{n.text}</span>
                                                            </div>
                                                            {!n.id.startsWith('sim-') && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        handleDeleteNote(
                                                                            activeClient360.accountId,
                                                                            n.id,
                                                                        )
                                                                    }
                                                                    className="text-[#B91C1C] font-bold cursor-pointer bg-transparent border-0"
                                                                >
                                                                    Šalinti
                                                                </button>
                                                            )}
                                                        </div>
                                                    ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-[#5B6470]">
                                    Šiuo metu aktyvių B2B klientų nėra. Sukurkite klientą žemiau arba paspauskite „Simuliacija“.
                                </p>
                            )}

                            {/* 5. CREDIT LIMIT, PAYMENT DEFERRAL (ATIDĖJIMAS), INVOICES LEDGER & AUTO/MANUAL REMINDERS */}
                            <div className="border-t border-[#E2DDD3] pt-4 space-y-4">
                                <div
                                    data-testid="b2b-client-credit-settings"
                                    className="space-y-3"
                                >
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <div>
                                            <strong className="text-[#11161B] block">
                                                5. Kredito limito (€), Mokėjimo atidėjimo (0 / 7 / 14 / 30 / 45 / 60 d.) ir Automatinio priminimo ribos (≥80 %) valdymas
                                            </strong>
                                            {activeClient360 && (
                                                <span className="text-[#5B6470]">
                                                    Sunaudota{' '}
                                                    <strong className="font-mono text-[#11161B]">
                                                        {activeClient360.creditLedgerSummary.creditUsedEur.toLocaleString('lt-LT')} €
                                                    </strong>{' '}
                                                    iš{' '}
                                                    <strong className="font-mono text-[#11161B]">
                                                        {activeClient360.creditLedgerSummary.creditLimitEur.toLocaleString('lt-LT')} €
                                                    </strong>{' '}
                                                    ·{' '}
                                                    <strong className="font-mono text-[#C2410C]">
                                                        {activeClient360.creditLedgerSummary.creditUtilizationPct} %
                                                    </strong>{' '}
                                                    · Laisvas limitas:{' '}
                                                    <strong className="font-mono text-[#157A3B]">
                                                        {activeClient360.creditLedgerSummary.creditRemainingEur.toLocaleString('lt-LT')} €
                                                    </strong>{' '}
                                                    · Atidėjimas{' '}
                                                    <strong>{activeClient360.creditConfig.paymentTermDays} d.</strong>
                                                </span>
                                            )}
                                        </div>
                                        {activeClient360 && (
                                            <button
                                                type="button"
                                                data-testid="b2b-send-credit-reminder-btn"
                                                onClick={() => handleSendClientReminder(activeClient360)}
                                                className="min-h-[38px] px-3 rounded-lg border border-[#C2410C] text-[#C2410C] font-bold cursor-pointer bg-transparent inline-flex items-center gap-1.5"
                                            >
                                                <Send className="w-3.5 h-3.5" />
                                                <span>Siųsti priminimą klientui (Artėja prie limito / Apmokėjimas)</span>
                                            </button>
                                        )}
                                    </div>

                                    {activeClient360 && (
                                        <div className="w-full h-2.5 rounded-full bg-[#E2DDD3] overflow-hidden">
                                            <div
                                                style={{
                                                    width: `${Math.min(100, Math.max(2, activeClient360.creditLedgerSummary.creditUtilizationPct))}%`,
                                                    backgroundColor:
                                                        activeClient360.creditLedgerSummary.creditUtilizationPct > 95 ||
                                                        activeClient360.creditLedgerSummary.overdueInvoicesCount > 0
                                                            ? '#B91C1C'
                                                            : activeClient360.creditLedgerSummary.creditUtilizationPct >= 75
                                                              ? '#D97706'
                                                              : '#157A3B',
                                                }}
                                                className="h-full transition-all"
                                            />
                                        </div>
                                    )}

                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
                                        <label className="space-y-1 block">
                                            <span className="text-[#5B6470] block">Kredito limitas (€)</span>
                                            <input
                                                type="number"
                                                min={0}
                                                step={500}
                                                value={editCreditLimitEur}
                                                onChange={(e) => setEditCreditLimitEur(Number(e.target.value))}
                                                className="w-full min-h-[38px] px-2.5 rounded-lg border border-[#D5CFC3] bg-white font-mono font-bold text-[#11161B]"
                                            />
                                        </label>
                                        <label className="space-y-1 block">
                                            <span className="text-[#5B6470] block">Mokėjimo atidėjimas (d.)</span>
                                            <select
                                                aria-label="Kliento mokėjimo atidėjimas"
                                                value={editPaymentTermDays}
                                                onChange={(e) =>
                                                    setEditPaymentTermDays(
                                                        Number(e.target.value) as B2BPaymentDeferralDays,
                                                    )
                                                }
                                                className="w-full min-h-[38px] px-2 rounded-lg border border-[#D5CFC3] bg-white font-semibold text-[#11161B]"
                                            >
                                                <option value={0}>0 d. (išankstinis)</option>
                                                <option value={7}>7 d. atidėjimas</option>
                                                <option value={14}>14 d. atidėjimas</option>
                                                <option value={30}>30 d. atidėjimas</option>
                                                <option value={45}>45 d. atidėjimas</option>
                                                <option value={60}>60 d. atidėjimas</option>
                                            </select>
                                        </label>
                                        <label className="space-y-1 block">
                                            <span className="text-[#5B6470] block">Auto-priminimo riba (%)</span>
                                            <input
                                                type="number"
                                                min={50}
                                                max={100}
                                                value={editAutoThresholdPct}
                                                onChange={(e) => setEditAutoThresholdPct(Number(e.target.value))}
                                                className="w-full min-h-[38px] px-2.5 rounded-lg border border-[#D5CFC3] bg-white font-mono font-bold text-[#11161B]"
                                            />
                                        </label>
                                        <label className="space-y-1 flex items-end pb-1">
                                            <span className="inline-flex items-center gap-2 font-semibold text-[#11161B] cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={editAutoRemindersEnabled}
                                                    onChange={(e) =>
                                                        setEditAutoRemindersEnabled(e.target.checked)
                                                    }
                                                />
                                                <span>Auto-priminimas ≥{editAutoThresholdPct}%</span>
                                            </span>
                                        </label>
                                        <div className="flex items-end">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleSaveCreditTerms(activeClient360?.accountId || '')
                                                }
                                                className="w-full min-h-[38px] px-3 rounded-lg bg-[#11161B] text-white font-bold cursor-pointer"
                                            >
                                                Išsaugoti kredito sąlygas
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* INVOICES LEDGER (PAID / UNPAID DEFERRED / OVERDUE) */}
                                <div
                                    data-testid="b2b-client-invoices-ledger"
                                    className="border-t border-[#E2DDD3] pt-3 space-y-2.5"
                                >
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <strong className="text-[#11161B]">
                                            Apmokėtų, neapmokėtų (su atidėjimu) ir vėluojančių sąskaitų žurnalas
                                        </strong>
                                        {activeClient360 && (
                                            <span className="font-mono text-[#5B6470]">
                                                Apmokėta:{' '}
                                                <strong className="text-[#157A3B]">
                                                    {activeClient360.creditLedgerSummary.paidInvoicesTotalEur.toLocaleString('lt-LT')} € ({activeClient360.creditLedgerSummary.paidInvoicesCount} vnt.)
                                                </strong>{' '}
                                                · Neapmokėta:{' '}
                                                <strong className="text-[#C2410C]">
                                                    {activeClient360.creditLedgerSummary.unpaidInvoicesTotalEur.toLocaleString('lt-LT')} € ({activeClient360.creditLedgerSummary.unpaidInvoicesCount} vnt.)
                                                </strong>{' '}
                                                · Vėluoja:{' '}
                                                <strong className="text-[#B91C1C]">
                                                    {activeClient360.creditLedgerSummary.overdueInvoicesTotalEur.toLocaleString('lt-LT')} € ({activeClient360.creditLedgerSummary.overdueInvoicesCount} vnt.)
                                                </strong>
                                            </span>
                                        )}
                                    </div>

                                    {activeClient360 && (
                                        <form
                                            onSubmit={(e) =>
                                                handleIssueDeferredInvoice(e, activeClient360.accountId)
                                            }
                                            className="grid grid-cols-1 sm:grid-cols-4 gap-2"
                                        >
                                            <input
                                                type="text"
                                                value={newInvNumber}
                                                onChange={(e) => setNewInvNumber(e.target.value)}
                                                placeholder="Sąskaitos Nr. (GILE-2026-...)"
                                                className="min-h-[38px] px-2.5 rounded-lg border border-[#D5CFC3] bg-white font-mono"
                                            />
                                            <input
                                                type="number"
                                                min={1}
                                                value={newInvAmountEur}
                                                onChange={(e) => setNewInvAmountEur(Number(e.target.value))}
                                                placeholder="Suma € be PVM"
                                                className="min-h-[38px] px-2.5 rounded-lg border border-[#D5CFC3] bg-white font-mono"
                                            />
                                            <input
                                                type="text"
                                                value={newInvProjectTitle}
                                                onChange={(e) => setNewInvProjectTitle(e.target.value)}
                                                placeholder="Objektas / paskirtis"
                                                className="min-h-[38px] px-2.5 rounded-lg border border-[#D5CFC3] bg-white"
                                            />
                                            <button
                                                type="submit"
                                                className="min-h-[38px] px-3 rounded-lg bg-[#C2410C] text-white font-bold cursor-pointer whitespace-nowrap"
                                            >
                                                + Išrašyti sąskaitą su atidėjimu
                                            </button>
                                        </form>
                                    )}

                                    <div className="space-y-1.5">
                                        {(activeClient360?.creditLedgerSummary.invoices || []).map((inv) => {
                                            const isPaid =
                                                inv.status === 'paid' ||
                                                simPaidInvoiceIds.includes(inv.id);
                                            const statusLabel = isPaid
                                                ? 'APMOKĖTA'
                                                : inv.status === 'overdue'
                                                  ? 'VĖLUOJA APMOKĖTI'
                                                  : 'NEAPMOKĖTA (ATIDĖJIMAS)';
                                            const badgeClass = isPaid
                                                ? 'bg-[#E3F1E8] text-[#0F5A2B]'
                                                : inv.status === 'overdue'
                                                  ? 'bg-[#FEE2E2] text-[#B91C1C]'
                                                  : 'bg-[#FEF3C7] text-[#92400E]';
                                            return (
                                                <div
                                                    key={inv.id}
                                                    className="border-t border-[#E2DDD3] pt-2 flex flex-wrap items-center justify-between gap-2"
                                                >
                                                    <div>
                                                        <strong className="font-mono text-[#11161B]">
                                                            {inv.invoiceNumber}
                                                        </strong>{' '}
                                                        <span
                                                            className={`px-2 py-0.5 rounded font-mono font-bold text-xs ${badgeClass}`}
                                                        >
                                                            {statusLabel}
                                                        </span>{' '}
                                                        <span className="text-[#5B6470]">
                                                            · Išrašyta: {inv.issuedAt} · Terminas: {inv.dueDate}
                                                            {inv.projectTitle ? ` · ${inv.projectTitle}` : ''}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <strong className="font-mono text-[#11161B]">
                                                            {inv.amountEur.toLocaleString('lt-LT')} €
                                                        </strong>
                                                        {!isPaid && activeClient360 && (
                                                            <button
                                                                type="button"
                                                                data-testid="b2b-mark-invoice-paid-btn"
                                                                onClick={() =>
                                                                    handleMarkInvoicePaid(
                                                                        activeClient360.accountId,
                                                                        inv.id,
                                                                    )
                                                                }
                                                                className="min-h-[34px] px-2.5 rounded-lg bg-[#157A3B] text-white font-bold cursor-pointer"
                                                            >
                                                                Pažymėti apmokėta
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* CREDIT REMINDERS LOG (AUTO THRESHOLD >=80% & MANUAL DARIUS) */}
                                <div
                                    data-testid="b2b-credit-reminders-log"
                                    className="border-t border-[#E2DDD3] pt-3 space-y-2"
                                >
                                    <strong className="text-[#11161B] block">
                                        Išsiųstų kredito limito ir apmokėjimo priminimų žurnalas ({combinedRemindersLog.length})
                                    </strong>
                                    {combinedRemindersLog.length === 0 ? (
                                        <p className="text-[#5B6470]">
                                            Priminimų dar neišsiųsta. Kai kliento kredito limito panaudojimas pasiekia ≥80 % arba paspaudžiamas automatinės patikros mygtukas, įspėjimas užfiksuojamas čia.
                                        </p>
                                    ) : (
                                        <div className="space-y-1.5">
                                            {combinedRemindersLog.slice(0, 6).map((rem) => (
                                                <div
                                                    key={rem.id}
                                                    className="border-t border-[#E2DDD3] pt-1.5 flex flex-wrap items-center justify-between gap-2"
                                                >
                                                    <div>
                                                        <span className="px-2 py-0.5 rounded bg-[#F5F3EE] font-mono font-bold text-[#C2410C]">
                                                            {rem.triggeredBy === 'auto_threshold'
                                                                ? 'AUTOMATINIS ≥80%'
                                                                : rem.triggeredBy === 'mcp_agent'
                                                                  ? 'MCP AGENTAS'
                                                                  : 'DARIUS ŠAUKLYS'}
                                                        </span>{' '}
                                                        <strong className="text-[#11161B]">{rem.companyName}</strong>:{' '}
                                                        <span className="text-[#5B6470]">{rem.message}</span>
                                                    </div>
                                                    <span className="font-mono text-[#5B6470]">
                                                        {rem.utilizationPct}% ({rem.usedEur.toLocaleString('lt-LT')} € /{' '}
                                                        {rem.limitEur.toLocaleString('lt-LT')} €)
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <form
                        data-testid="admin-create-b2b-customer-form"
                        onSubmit={handleCreateCustomer}
                        className="rounded-xl border border-[#D5CFC3] bg-[#F5F3EE] p-4 space-y-3"
                    >
                        <h3 className="text-sm font-extrabold text-[#11161B]">
                            Sukurti naują B2B / projektinį klientą su individualiu kredito limitu ir atidėjimu
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                            <input
                                type="text"
                                required
                                value={newCompanyName}
                                onChange={(e) => setNewCompanyName(e.target.value)}
                                placeholder="Įmonės pavadinimas *"
                                className="min-h-[44px] px-3 rounded-lg border border-[#D5CFC3] bg-white"
                            />
                            <input
                                type="text"
                                required
                                value={newCompanyCode}
                                onChange={(e) => setNewCompanyCode(e.target.value)}
                                placeholder="Įmonės kodas *"
                                className="min-h-[44px] px-3 rounded-lg border border-[#D5CFC3] bg-white font-mono"
                            />
                            <input
                                type="text"
                                value={newVatCode}
                                onChange={(e) => setNewVatCode(e.target.value)}
                                placeholder="PVM mokėtojo kodas (LT...)"
                                className="min-h-[44px] px-3 rounded-lg border border-[#D5CFC3] bg-white font-mono"
                            />
                            <input
                                type="text"
                                value={newContactPerson}
                                onChange={(e) => setNewContactPerson(e.target.value)}
                                placeholder="Kontaktinis asmuo"
                                className="min-h-[44px] px-3 rounded-lg border border-[#D5CFC3] bg-white"
                            />
                            <input
                                type="email"
                                required
                                value={newEmail}
                                onChange={(e) => setNewEmail(e.target.value)}
                                placeholder="El. paštas *"
                                className="min-h-[44px] px-3 rounded-lg border border-[#D5CFC3] bg-white"
                            />
                            <input
                                type="text"
                                value={newPhone}
                                onChange={(e) => setNewPhone(e.target.value)}
                                placeholder="Telefonas (+370 6...)"
                                className="min-h-[44px] px-3 rounded-lg border border-[#D5CFC3] bg-white"
                            />
                            <select
                                aria-label="Kliento segmentas"
                                value={newTierLabel}
                                onChange={(e) =>
                                    setNewTierLabel(e.target.value as B2BCustomerTierSegment)
                                }
                                className="min-h-[44px] px-3 rounded-lg border border-[#D5CFC3] bg-white font-semibold"
                            >
                                <option value="Montuotojas">Montuotojas</option>
                                <option value="ŠVOK Rangovas">ŠVOK Rangovas</option>
                                <option value="Regioninis Dileris">Regioninis Dileris</option>
                                <option value="Individualus">Individualus / VIP</option>
                            </select>
                            <div className="grid grid-cols-3 gap-2">
                                <input
                                    type="number"
                                    min={0}
                                    max={70}
                                    value={newDiscountPct}
                                    onChange={(e) => setNewDiscountPct(Number(e.target.value))}
                                    aria-label="Bazinė nuolaida %"
                                    placeholder="-%"
                                    className="min-h-[44px] px-2 rounded-lg border border-[#D5CFC3] bg-white font-mono font-bold"
                                />
                                <input
                                    type="number"
                                    min={0}
                                    step={500}
                                    value={newCreditLimit}
                                    onChange={(e) => setNewCreditLimit(Number(e.target.value))}
                                    aria-label="Kredito limitas €"
                                    placeholder="Limitas €"
                                    className="min-h-[44px] px-2 rounded-lg border border-[#D5CFC3] bg-white font-mono"
                                />
                                <select
                                    aria-label="Mokėjimo atidėjimas"
                                    value={newDeferralDays}
                                    onChange={(e) =>
                                        setNewDeferralDays(
                                            Number(e.target.value) as B2BPaymentDeferralDays,
                                        )
                                    }
                                    className="min-h-[44px] px-2 rounded-lg border border-[#D5CFC3] bg-white font-semibold"
                                >
                                    <option value={0}>0 d.</option>
                                    <option value={7}>7 d.</option>
                                    <option value={14}>14 d.</option>
                                    <option value={30}>30 d.</option>
                                    <option value={45}>45 d.</option>
                                    <option value={60}>60 d.</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="text-xs text-[#5B6470]">
                                Priskirtas vadybininkas: <strong>{newManager}</strong> (+370 611 19158)
                            </span>
                            <button
                                type="submit"
                                data-testid="admin-create-customer-submit"
                                className="min-h-[44px] px-4 rounded-lg bg-[#C2410C] hover:bg-[#9A3412] text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                            >
                                <Plus className="w-4 h-4" />
                                <span>Sukurti ir aktyvuoti B2B klientą</span>
                            </button>
                        </div>
                    </form>

                    {accounts.length > 0 && (
                        <div className="space-y-3">
                            <h4 className="text-sm font-extrabold text-[#11161B]">
                                Aktyvios ir laukiančios B2B klientų paskyros ({accounts.length})
                            </h4>
                            {accounts.map((acc) => (
                                <div
                                    key={acc.id}
                                    className="rounded-xl border border-[#E2DDD3] bg-[#FAF9F6] p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-xs"
                                >
                                    <div className="space-y-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <strong className="text-sm text-[#11161B]">
                                                {acc.companyName}
                                            </strong>
                                            <span className="font-mono text-[#5B6470]">
                                                Įm. k. {acc.companyCode} · PVM {acc.vatCode}
                                            </span>
                                            <span className="px-2 py-0.5 rounded-full bg-[#E3F1E8] text-[#0F5A2B] font-bold">
                                                {acc.status} · -{acc.defaultDiscountPercent}%
                                            </span>
                                        </div>
                                        <p className="text-[#5B6470]">
                                            Kontaktas: {acc.contactPerson} ({acc.email}, {acc.phone}) · Kredito limitas:{' '}
                                            <strong>{acc.creditLimitEur.toLocaleString('lt-LT')} €</strong> · Atidėjimas:{' '}
                                            <strong>{acc.paymentTermsDays} d.</strong>
                                        </p>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <select
                                            aria-label={`Atidėjimas ${acc.companyName}`}
                                            value={acc.paymentTermsDays}
                                            onChange={(e) =>
                                                handleUpdateCrmAccount(acc.id, {
                                                    paymentTermsDays: Number(
                                                        e.target.value,
                                                    ) as B2BPaymentDeferralDays,
                                                })
                                            }
                                            className="min-h-[44px] px-2.5 rounded-lg border border-[#D5CFC3] bg-white font-semibold"
                                        >
                                            <option value={0}>Atidėjimas: 0 d.</option>
                                            <option value={7}>Atidėjimas: 7 d.</option>
                                            <option value={14}>Atidėjimas: 14 d.</option>
                                            <option value={30}>Atidėjimas: 30 d.</option>
                                            <option value={45}>Atidėjimas: 45 d.</option>
                                            <option value={60}>Atidėjimas: 60 d.</option>
                                        </select>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSelectedAccountId(acc.id);
                                                setSubView('pricing');
                                            }}
                                            className="min-h-[44px] px-3.5 rounded-lg bg-[#11161B] text-white font-bold cursor-pointer"
                                        >
                                            Redaguoti individualias kainas
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Incoming Custom Cart Quote Requests from /krepselis */}
                    <div className="rounded-xl border border-[#E2DDD3] bg-[#FAF9F6] p-4 space-y-2 text-xs">
                        <h4 className="text-sm font-extrabold text-[#11161B]">
                            Gautos krepšelio individualių nuolaidų užklausos iš „/lt/krepselis“ ({quoteRequests.length})
                        </h4>
                        {quoteRequests.length === 0 ? (
                            <p className="text-[#5B6470]">
                                Kai pirkėjas krepšelyje paspaudžia „Prašyti individualios projekto / krepšelio nuolaidos“, užklausa iškart atsiranda čia.
                            </p>
                        ) : (
                            <div className="space-y-2">
                                {quoteRequests.map((qr) => (
                                    <div
                                        key={qr.id}
                                        className="rounded-lg border border-[#D5CFC3] bg-white p-3 flex flex-wrap items-center justify-between gap-2"
                                    >
                                        <div>
                                            <strong className="font-mono text-[#C2410C]">
                                                {qr.requestNumber}
                                            </strong>{' '}
                                            · <strong>{qr.companyName}</strong> ({qr.customerName}, {qr.phone}, {qr.email})
                                            <p className="text-[#5B6470]">{qr.note}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <strong className="font-mono text-sm">
                                                {qr.totalGrossEur.toFixed(2)} € su PVM
                                            </strong>
                                            {onCreateProformaFromCrm && qr.items[0] && (
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        onCreateProformaFromCrm({
                                                            buyerName: qr.companyName,
                                                            sku: qr.items[0]!.sku,
                                                            title: qr.items[0]!.title,
                                                            unitNetEur:
                                                                Math.round(
                                                                    (qr.items[0]!.unitGrossEur /
                                                                        1.21) *
                                                                        100,
                                                                ) / 100,
                                                        })
                                                    }
                                                    className="min-h-[44px] px-3 rounded-lg bg-[#C2410C] text-white font-bold cursor-pointer"
                                                >
                                                    Išrašyti išankstinę sąskaitą
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* SUB-VIEW B: 3-LAYER INDIVIDUAL PRICING ENGINE */}
            {subView === 'pricing' && (
                <div data-testid="admin-b2b-pricing-panel" className="space-y-6">
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[#F5F3EE] p-4 text-xs">
                        <label className="flex flex-wrap items-center gap-2 font-bold text-[#11161B]">
                            <span>Pasirinkite klientą arba numatytąją grupę:</span>
                            <select
                                data-testid="admin-pricing-select-customer"
                                value={selectedAccountId}
                                onChange={(e) => setSelectedAccountId(e.target.value)}
                                className="min-h-[44px] px-3 rounded-lg border border-[#D5CFC3] bg-white font-semibold"
                            >
                                <option value="DEFAULT_TIER">
                                    Numatytasis B2B profilis (Standartinė matrica)
                                </option>
                                {accounts.map((acc) => (
                                    <option key={acc.id} value={acc.id}>
                                        {acc.companyName} ({acc.companyCode} · -{acc.defaultDiscountPercent}%)
                                    </option>
                                ))}
                            </select>
                        </label>
                        <button
                            type="button"
                            data-testid="admin-save-pricing-rules-btn"
                            onClick={handleSaveCustomerPricingRules}
                            className="min-h-[44px] px-4 rounded-lg bg-[#157A3B] hover:bg-[#0F5A2B] text-white font-bold inline-flex items-center gap-1.5 cursor-pointer"
                        >
                            <Check className="w-4 h-4" />
                            <span>Išsaugoti kliento 3 lygių kainodarą</span>
                        </button>
                    </div>

                    {/* Layer 1: Brand & Category Discount Matrix */}
                    <div className="rounded-xl border border-[#E2DDD3] bg-[#FAF9F6] p-4 space-y-3">
                        <h3 className="text-sm font-extrabold text-[#11161B]">
                            1 Lygis · Gamintojų ir kategorijų individualių nuolaidų matrica (%)
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                            {SUPPORTED_B2B_BRANDS.map((brand) => (
                                <label
                                    key={brand}
                                    className="rounded-lg border border-[#D5CFC3] bg-white p-2.5 flex flex-col gap-1"
                                >
                                    <span className="font-bold text-[#11161B]">{brand}</span>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="number"
                                            min={0}
                                            max={75}
                                            value={brandDiscounts[brand] ?? 35}
                                            onChange={(e) =>
                                                setBrandDiscounts((prev) => ({
                                                    ...prev,
                                                    [brand]: Number(e.target.value),
                                                }))
                                            }
                                            className="w-full min-h-[40px] px-2 rounded border border-[#D5CFC3] font-mono font-bold text-[#C2410C]"
                                        />
                                        <span className="font-bold text-[#5B6470]">%</span>
                                    </div>
                                </label>
                            ))}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 text-xs">
                            {SUPPORTED_B2B_CATEGORIES.slice(0, 3).map((cat) => (
                                <label
                                    key={cat}
                                    className="rounded-lg border border-[#D5CFC3] bg-white p-2.5 flex items-center justify-between gap-2"
                                >
                                    <span className="font-semibold text-[#11161B]">{cat}</span>
                                    <input
                                        type="number"
                                        min={0}
                                        max={70}
                                        value={categoryDiscounts[cat] ?? 35}
                                        onChange={(e) =>
                                            setCategoryDiscounts((prev) => ({
                                                ...prev,
                                                [cat]: Number(e.target.value),
                                            }))
                                        }
                                        className="w-20 min-h-[40px] px-2 rounded border border-[#D5CFC3] font-mono font-bold"
                                    />
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Layer 2: Specific SKU Price / Discount Overrides */}
                    <div className="rounded-xl border border-[#E2DDD3] bg-[#FAF9F6] p-4 space-y-3 text-xs">
                        <h3 className="text-sm font-extrabold text-[#11161B]">
                            2 Lygis · Specifinių prekių (SKU) individualios kainos ir maržos kontrolė (6 337 SKU)
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            <input
                                type="text"
                                value={skuSearchQuery}
                                onChange={(e) => setSkuSearchQuery(e.target.value)}
                                placeholder="Ieškoti iš 6 337 prekių pagal SKU arba pavadinimą (pvz., 013G2990, MPB-NANI-35)..."
                                className="flex-1 min-w-[220px] min-h-[44px] px-3 rounded-lg border border-[#D5CFC3] bg-white"
                            />
                            <button
                                type="button"
                                onClick={handleSearchCatalogSku}
                                className="min-h-[44px] px-4 rounded-lg bg-[#11161B] text-white font-bold cursor-pointer"
                            >
                                Ieškoti kataloge
                            </button>
                        </div>

                        {skuSearchResults.length > 0 && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {skuSearchResults.map((sr) => (
                                    <button
                                        key={sr.sku}
                                        type="button"
                                        onClick={() => {
                                            setOverrideSku(sr.sku);
                                            const net = Math.round((sr.price / 1.21) * 100) / 100;
                                            setOverrideCostEur(Math.round(net * 0.6 * 100) / 100);
                                            setOverrideCustomPriceEur(
                                                (Math.round(net * 0.72 * 100) / 100).toFixed(2),
                                            );
                                        }}
                                        className="rounded-lg border border-[#D5CFC3] bg-white p-2.5 text-left hover:border-[#C2410C] cursor-pointer"
                                    >
                                        <span className="font-mono font-bold text-[#C2410C]">
                                            {sr.sku}
                                        </span>{' '}
                                        · <strong>{sr.name}</strong> ({sr.price.toFixed(2)} € su PVM)
                                    </button>
                                ))}
                            </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-6 gap-2.5 items-end pt-1">
                            <label className="flex flex-col gap-1 font-semibold">
                                Prekės SKU
                                <input
                                    type="text"
                                    value={overrideSku}
                                    onChange={(e) => setOverrideSku(e.target.value)}
                                    className="min-h-[44px] px-2.5 rounded-lg border border-[#D5CFC3] bg-white font-mono font-bold"
                                />
                            </label>
                            <label className="flex flex-col gap-1 font-semibold">
                                Fiksuota kaina € (be PVM)
                                <input
                                    type="number"
                                    step="0.01"
                                    value={overrideCustomPriceEur}
                                    onChange={(e) => setOverrideCustomPriceEur(e.target.value)}
                                    className="min-h-[44px] px-2.5 rounded-lg border border-[#D5CFC3] bg-white font-mono font-bold"
                                />
                            </label>
                            <label className="flex flex-col gap-1 font-semibold">
                                Arba spec. nuolaida %
                                <input
                                    type="number"
                                    value={overrideCustomDiscountPct}
                                    onChange={(e) => setOverrideCustomDiscountPct(e.target.value)}
                                    placeholder="pvz. 50"
                                    className="min-h-[44px] px-2.5 rounded-lg border border-[#D5CFC3] bg-white font-mono"
                                />
                            </label>
                            <label className="flex flex-col gap-1 font-semibold">
                                Min. kiekis (vnt.)
                                <input
                                    type="number"
                                    min={1}
                                    value={overrideMinQty}
                                    onChange={(e) => setOverrideMinQty(Number(e.target.value))}
                                    className="min-h-[44px] px-2.5 rounded-lg border border-[#D5CFC3] bg-white font-mono"
                                />
                            </label>
                            <label className="flex flex-col gap-1 font-semibold">
                                Pastaba / Sąlyga
                                <input
                                    type="text"
                                    value={overrideNote}
                                    onChange={(e) => setOverrideNote(e.target.value)}
                                    className="min-h-[44px] px-2.5 rounded-lg border border-[#D5CFC3] bg-white"
                                />
                            </label>
                            <button
                                type="button"
                                data-testid="admin-add-sku-override-btn"
                                onClick={handleAddSkuOverride}
                                className="min-h-[44px] px-3.5 rounded-lg bg-[#C2410C] text-white font-bold cursor-pointer"
                            >
                                + Pridėti SKU kainą
                            </button>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                            <span className="text-[#5B6470]">
                                Savikaina: <strong className="font-mono">{overrideCostEur.toFixed(2)} €</strong> · Prognozuojama marža:{' '}
                                <strong className="font-mono">{previewMarginPct.toFixed(1)}%</strong>
                            </span>
                            {previewMarginWarning && (
                                <span className="inline-flex items-center gap-1 text-[#B91C1C] font-bold">
                                    <AlertTriangle className="w-4 h-4" /> Įspėjimas: marža žemiau 10% ribos!
                                </span>
                            )}
                        </div>

                        {skuOverrides.length > 0 && (
                            <div className="space-y-1.5 pt-2">
                                {skuOverrides.map((ov) => (
                                    <div
                                        key={ov.sku}
                                        className="rounded-lg border border-[#D5CFC3] bg-white p-2.5 flex flex-wrap items-center justify-between gap-2"
                                    >
                                        <div>
                                            <strong className="font-mono text-[#C2410C]">
                                                {ov.sku}
                                            </strong>{' '}
                                            ·{' '}
                                            {ov.customPriceEur
                                                ? `Fiksuota: ${ov.customPriceEur.toFixed(2)} € be PVM`
                                                : `Nuolaida: -${ov.customDiscountPct}%`}{' '}
                                            (nuo {ov.minQty || 1} vnt.) {ov.note ? `· ${ov.note}` : ''}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setSkuOverrides((prev) =>
                                                    prev.filter((i) => i.sku !== ov.sku),
                                                )
                                            }
                                            className="text-[#B91C1C] font-bold cursor-pointer bg-transparent border-0"
                                        >
                                            Pašalinti
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Layer 3: Whole-Cart Extra Discounts & Live Simulator */}
                    <div className="rounded-xl border border-[#E2DDD3] bg-[#FAF9F6] p-4 space-y-4 text-xs">
                        <h3 className="text-sm font-extrabold text-[#11161B]">
                            3 Lygis · Viso krepšelio papildomos nuolaidos ir Krepšelio kainodaros simuliatorius
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <label className="flex flex-col gap-1 font-semibold">
                                Papildoma asmeninė krepšelio nuolaida (%)
                                <input
                                    type="number"
                                    min={0}
                                    max={30}
                                    value={extraCartDiscountPct}
                                    onChange={(e) =>
                                        setExtraCartDiscountPct(Number(e.target.value))
                                    }
                                    className="min-h-[44px] px-3 rounded-lg border border-[#D5CFC3] bg-white font-mono font-bold text-[#C2410C]"
                                />
                            </label>
                            <label className="flex flex-col gap-1 font-semibold">
                                Fiksuota krepšelio nuolaida / bonusas (€)
                                <input
                                    type="number"
                                    min={0}
                                    step={5}
                                    value={extraCartFixedEur}
                                    onChange={(e) => setExtraCartFixedEur(Number(e.target.value))}
                                    className="min-h-[44px] px-3 rounded-lg border border-[#D5CFC3] bg-white font-mono font-bold"
                                />
                            </label>
                            <label className="flex flex-col gap-1 font-semibold">
                                Asmeninis nuolaidos kodas
                                <input
                                    type="text"
                                    value={personalPromoCode}
                                    onChange={(e) => setPersonalPromoCode(e.target.value)}
                                    className="min-h-[44px] px-3 rounded-lg border border-[#D5CFC3] bg-white font-mono uppercase"
                                />
                            </label>
                        </div>

                        <div
                            data-testid="admin-cart-pricing-simulator"
                            className="rounded-xl bg-[#11161B] text-[#F5F3EE] p-4 space-y-2"
                        >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <strong className="text-[#FF8A3D] inline-flex items-center gap-1.5">
                                    <Calculator className="w-4 h-4" /> Krepšelio kainodaros simuliatorius (Live skaičiavimas)
                                </strong>
                                <span className="font-mono text-[#C9D0D8]">
                                    Apimties laiptelis:{' '}
                                    {liveCartSimulation.activeVolumeTier?.label || 'Iki 1 000 €'} + Asmeninė: -{extraCartDiscountPct}%
                                </span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                                <div className="rounded-lg bg-[#1B232C] p-3">
                                    <span className="text-[#A3ADB8] block">
                                        Eilučių suma po SKU/Gamintojų nuolaidų
                                    </span>
                                    <strong className="text-base font-mono text-white">
                                        {liveCartSimulation.linesSubtotalNetEur.toFixed(2)} € be PVM
                                    </strong>
                                </div>
                                <div className="rounded-lg bg-[#1B232C] p-3">
                                    <span className="text-[#A3ADB8] block">
                                        Papildoma viso krepšelio nuolaida (-{liveCartSimulation.combinedExtraCartDiscountPct}%)
                                    </span>
                                    <strong className="text-base font-mono text-[#FF8A3D]">
                                        -{liveCartSimulation.extraCartPercentDiscountEur.toFixed(2)} €
                                    </strong>
                                </div>
                                <div className="rounded-lg bg-[#1B232C] p-3">
                                    <span className="text-[#A3ADB8] block">
                                        Galutinė B2B krepšelio suma
                                    </span>
                                    <strong className="text-base font-mono text-[#A9C83E]">
                                        {liveCartSimulation.finalNetEur.toFixed(2)} € be PVM ({liveCartSimulation.finalGrossEur.toFixed(2)} € su PVM)
                                    </strong>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* SUB-VIEW C: COMMERCIAL OFFERS & SALES BOOSTER */}
            {subView === 'offers' && (
                <div data-testid="admin-b2b-offers-panel" className="space-y-6 text-xs">
                    <form
                        onSubmit={handleCreateOffer}
                        className="rounded-xl border border-[#D5CFC3] bg-[#F5F3EE] p-4 space-y-3"
                    >
                        <h3 className="text-sm font-extrabold text-[#11161B]">
                            Sukurti individualų komercinį pasiūlymą / projektinę sąmatą klientui (KP-XXXX)
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <input
                                type="text"
                                value={offerClientName}
                                onChange={(e) => setOfferClientName(e.target.value)}
                                placeholder="Kliento / įmonės pavadinimas"
                                className="min-h-[44px] px-3 rounded-lg border border-[#D5CFC3] bg-white"
                            />
                            <input
                                type="text"
                                required
                                value={offerTitle}
                                onChange={(e) => setOfferTitle(e.target.value)}
                                placeholder="Pasiūlymo pavadinimas (pvz., Katilinės modernizavimo komplektas) *"
                                className="min-h-[44px] px-3 rounded-lg border border-[#D5CFC3] bg-white"
                            />
                            <input
                                type="text"
                                value={offerValidUntil}
                                onChange={(e) => setOfferValidUntil(e.target.value)}
                                placeholder="Galiojimo terminas"
                                className="min-h-[44px] px-3 rounded-lg border border-[#D5CFC3] bg-white"
                            />
                            <input
                                type="text"
                                value={offerSku}
                                onChange={(e) => setOfferSku(e.target.value)}
                                placeholder="Prekės SKU"
                                className="min-h-[44px] px-3 rounded-lg border border-[#D5CFC3] bg-white font-mono"
                            />
                            <input
                                type="number"
                                step="0.01"
                                value={offerCustomNet}
                                onChange={(e) => setOfferCustomNet(Number(e.target.value))}
                                placeholder="Spec. kaina € be PVM"
                                className="min-h-[44px] px-3 rounded-lg border border-[#D5CFC3] bg-white font-mono font-bold"
                            />
                            <input
                                type="number"
                                min={0}
                                max={30}
                                value={offerExtraCartPct}
                                onChange={(e) => setOfferExtraCartPct(Number(e.target.value))}
                                placeholder="Papildoma krepšelio nuolaida %"
                                className="min-h-[44px] px-3 rounded-lg border border-[#D5CFC3] bg-white font-mono"
                            />
                        </div>
                        <button
                            type="submit"
                            data-testid="admin-create-offer-btn"
                            className="min-h-[44px] px-4 rounded-lg bg-[#C2410C] text-white font-bold cursor-pointer"
                        >
                            + Sugeneruoti komercinį pasiūlymą ir nuorodą klientui
                        </button>
                    </form>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="rounded-xl border border-[#E2DDD3] bg-[#FAF9F6] p-4 space-y-2">
                            <h4 className="text-sm font-extrabold text-[#11161B]">
                                Kiekio nuolaidos (Quantity Tiers 3+ / 5+ / 10+ vnt.)
                            </h4>
                            {globalQuantityTiers.map((qt) => (
                                <div
                                    key={qt.minQty}
                                    className="flex items-center justify-between rounded-lg bg-white border border-[#D5CFC3] p-2.5"
                                >
                                    <span className="font-semibold">{qt.label}</span>
                                    <strong className="font-mono text-[#C2410C]">
                                        -{qt.extraDiscountPct}%
                                    </strong>
                                </div>
                            ))}
                        </div>
                        <div className="rounded-xl border border-[#E2DDD3] bg-[#FAF9F6] p-4 space-y-2">
                            <h4 className="text-sm font-extrabold text-[#11161B]">
                                Krepšelio apimties nuolaidų laipteliai (Volume Tiers)
                            </h4>
                            {globalVolumeTiers.map((vt) => (
                                <div
                                    key={vt.minCartEur}
                                    className="flex items-center justify-between rounded-lg bg-white border border-[#D5CFC3] p-2.5"
                                >
                                    <span className="font-semibold">
                                        {vt.label || `Nuo ${vt.minCartEur} €`}
                                    </span>
                                    <strong className="font-mono text-[#157A3B]">
                                        Papildoma -{vt.extraDiscountPct}%
                                    </strong>
                                </div>
                            ))}
                        </div>
                    </div>

                    {offers.length > 0 && (
                        <div className="space-y-2">
                            <h4 className="text-sm font-extrabold text-[#11161B]">
                                Paruošti individualūs komerciniai pasiūlymai ({offers.length})
                            </h4>
                            {offers.map((of) => (
                                <div
                                    key={of.id}
                                    className="rounded-xl border border-[#E2DDD3] bg-[#FAF9F6] p-4 flex flex-wrap items-center justify-between gap-3"
                                >
                                    <div>
                                        <span className="font-mono font-bold text-[#C2410C]">
                                            {of.offerNumber}
                                        </span>{' '}
                                        · <strong>{of.clientName}</strong> · {of.title}
                                        <span className="block text-[#5B6470]">
                                            Papildoma krepšelio nuolaida: -{of.extraWholeCartDiscountPct}% · Galioja: {of.validUntil} · Nuoroda: {of.shareLink}
                                        </span>
                                    </div>
                                    <strong className="font-mono text-sm text-[#11161B]">
                                        {of.finalNetEur.toFixed(2)} € be PVM ({of.finalGrossEur.toFixed(2)} € su PVM)
                                    </strong>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* SUB-VIEW D: B2B & CLIENT MARKETING BROADCASTS */}
            {subView === 'marketing' && (
                <div data-testid="admin-b2b-marketing-panel" className="space-y-6 text-xs">
                    <form
                        data-testid="admin-create-campaign-form"
                        onSubmit={handleCreateCampaign}
                        className="rounded-xl border border-[#D5CFC3] bg-[#F5F3EE] p-4 space-y-3"
                    >
                        <h3 className="text-sm font-extrabold text-[#11161B]">
                            Siųsti tikslinį marketinginį pranešimą / kainų kritimo įspėjimą / asmeninį pasiūlymą B2B klientams
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                            <input
                                type="text"
                                required
                                value={campTitle}
                                onChange={(e) => setCampTitle(e.target.value)}
                                placeholder="Pranešimo antraštė (pvz., Haier R290 šilumos siurbliai, Danfoss akcija) *"
                                className="sm:col-span-2 min-h-[44px] px-3 rounded-lg border border-[#D5CFC3] bg-white"
                            />
                            <select
                                aria-label="Kampanijos tipas"
                                value={campCategory}
                                onChange={(e) =>
                                    setCampCategory(
                                        e.target.value as B2BMarketingCampaign['categoryTag'],
                                    )
                                }
                                className="min-h-[44px] px-3 rounded-lg border border-[#D5CFC3] bg-white font-semibold"
                            >
                                <option value="Sezoninė akcija">Sezoninė akcija</option>
                                <option value="Kainų kritimas">Kainų kritimas</option>
                                <option value="Nauja siunta sandėlyje">Nauja siunta sandėlyje</option>
                                <option value="Asmeninis krepšelio pasiūlymas">
                                    Asmeninis krepšelio pasiūlymas
                                </option>
                            </select>
                            <select
                                aria-label="Gavėjų auditorija"
                                value={campTargetType}
                                onChange={(e) =>
                                    setCampTargetType(
                                        e.target.value as B2BMarketingCampaign['targetType'],
                                    )
                                }
                                className="min-h-[44px] px-3 rounded-lg border border-[#D5CFC3] bg-white font-semibold"
                            >
                                <option value="ALL_B2B">Visi B2B partneriai</option>
                                <option value="SEGMENT">Konkretus segmentas (Montuotojai / Rangovai / VIP)</option>
                                <option value="SINGLE_CLIENT">Vienas pasirinktas klientas</option>
                            </select>
                        </div>

                        {campTargetType === 'SEGMENT' && (
                            <select
                                aria-label="Pasirinkti segmentą"
                                value={campTargetSegment}
                                onChange={(e) =>
                                    setCampTargetSegment(e.target.value as B2BCustomerTierSegment)
                                }
                                className="min-h-[44px] px-3 rounded-lg border border-[#D5CFC3] bg-white font-semibold"
                            >
                                <option value="Montuotojas">Montuotojai</option>
                                <option value="ŠVOK Rangovas">ŠVOK Rangovai</option>
                                <option value="Regioninis Dileris">Regioniniai Dileriai</option>
                                <option value="VIP">VIP klientai</option>
                            </select>
                        )}

                        <textarea
                            required
                            rows={2}
                            value={campMessage}
                            onChange={(e) => setCampMessage(e.target.value)}
                            placeholder="Pranešimo tekstas ir pasiūlymo sąlygos B2B partneriams..."
                            className="w-full p-3 rounded-lg border border-[#D5CFC3] bg-white"
                        />

                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex flex-wrap items-center gap-2">
                                <label className="inline-flex items-center gap-1.5 font-semibold">
                                    <span>Akcijos nuolaida %:</span>
                                    <input
                                        type="number"
                                        min={0}
                                        max={50}
                                        value={campPromoPct}
                                        onChange={(e) => setCampPromoPct(Number(e.target.value))}
                                        className="w-20 min-h-[40px] px-2 rounded border border-[#D5CFC3] bg-white font-mono font-bold"
                                    />
                                </label>
                                <label className="inline-flex items-center gap-1.5 font-semibold">
                                    <span>Akcijos SKU:</span>
                                    <input
                                        type="text"
                                        value={campCtaSku}
                                        onChange={(e) => setCampCtaSku(e.target.value)}
                                        className="w-32 min-h-[40px] px-2 rounded border border-[#D5CFC3] bg-white font-mono"
                                    />
                                </label>
                            </div>
                            <button
                                type="submit"
                                data-testid="admin-send-campaign-btn"
                                className="min-h-[44px] px-4 rounded-lg bg-[#C2410C] hover:bg-[#9A3412] text-white font-bold inline-flex items-center gap-1.5 cursor-pointer"
                            >
                                <Send className="w-4 h-4" />
                                <span>Publikuoti ir išsiųsti pranešimą</span>
                            </button>
                        </div>
                    </form>

                    {campaigns.length === 0 ? (
                        <div className="rounded-xl border border-[#E2DDD3] bg-[#FAF9F6] p-4 text-[#5B6470]">
                            Šiuo metu aktyvių marketinginių pranešimų nėra. Sukurkite pranešimą aukščiau – jis iškart bus matomas prisijungusiems B2B partneriams.
                        </div>
                    ) : (
                        <div className="space-y-2.5">
                            {campaigns.map((c) => (
                                <div
                                    key={c.id}
                                    className="rounded-xl border border-[#E2DDD3] bg-[#FAF9F6] p-4 flex flex-wrap items-center justify-between gap-3"
                                >
                                    <div className="space-y-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="px-2.5 py-0.5 rounded-full bg-[#FBEADF] text-[#8A2F07] font-bold">
                                                {c.categoryTag}
                                            </span>
                                            <strong className="text-sm text-[#11161B]">
                                                {c.title}
                                            </strong>
                                            {c.promoDiscountPct ? (
                                                <span className="font-mono font-bold text-[#157A3B]">
                                                    Papildoma -{c.promoDiscountPct}%
                                                </span>
                                            ) : null}
                                        </div>
                                        <p className="text-[#5B6470]">{c.message}</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleDeleteCampaign(c.id)}
                                        className="min-h-[40px] px-3 rounded-lg border border-[#D5CFC3] bg-white text-[#B91C1C] font-bold inline-flex items-center gap-1 cursor-pointer"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" /> Pašalinti
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </section>
    );
}
