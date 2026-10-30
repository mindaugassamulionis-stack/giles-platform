import {
    listB2BPartnerAccounts,
    resetB2BAccountsCache,
    type B2BPartnerAccount,
    type B2BDiscountTierLabel,
} from './b2b-accounts';

export type B2BCustomerTierSegment =
    | 'Montuotojas'
    | 'ŠVOK Rangovas'
    | 'Regioninis Dileris'
    | 'Individualus'
    | 'VIP';

export type B2BPaymentDeferralDays = 0 | 7 | 14 | 30 | 45 | 60;

export type B2BCreditInvoiceStatus = 'paid' | 'unpaid_deferred' | 'overdue';

export type B2BCreditStatus =
    | 'HEALTHY'
    | 'APPROACHING_LIMIT'
    | 'LIMIT_EXCEEDED'
    | 'OVERDUE_HOLD';

export type B2BCreditReminderType =
    | 'approaching_limit'
    | 'due_soon'
    | 'overdue_invoice'
    | 'limit_exceeded';

export type B2BCreditReminderTrigger = 'auto_threshold' | 'manual_darius' | 'mcp_agent';

export interface B2BCreditConfig {
    creditLimitEur: number;
    paymentTermDays: number;
    autoReminderThresholdPct: number;
    autoDueSoonReminderDays: number;
    autoRemindersEnabled: boolean;
    creditHoldOnExceed: boolean;
}

export interface B2BClientInvoiceRecord {
    id: string;
    invoiceNumber: string;
    issuedAt: string;
    dueDate: string;
    amountEur: number;
    paidAmountEur: number;
    status: B2BCreditInvoiceStatus;
    paidAt?: string;
    projectTitle?: string;
}

export interface B2BCreditLedgerSummary {
    creditLimitEur: number;
    creditUsedEur: number;
    creditRemainingEur: number;
    creditUtilizationPct: number;
    creditStatus: B2BCreditStatus;
    paidInvoicesTotalEur: number;
    paidInvoicesCount: number;
    unpaidInvoicesTotalEur: number;
    unpaidInvoicesCount: number;
    overdueInvoicesTotalEur: number;
    overdueInvoicesCount: number;
    maxOverdueDays: number;
    invoices: B2BClientInvoiceRecord[];
}

export interface B2BCreditReminderRecord {
    id: string;
    accountId: string;
    companyName: string;
    type: B2BCreditReminderType;
    channel: 'email_and_portal';
    utilizationPct: number;
    usedEur: number;
    limitEur: number;
    message: string;
    triggeredBy: B2BCreditReminderTrigger;
    sentAt: string;
}

export type B2BCustomerProjectStatus = 'planning' | 'quoted' | 'active' | 'completed';

export interface B2BCustomerProject {
    id: string;
    title: string;
    location: string;
    status: B2BCustomerProjectStatus;
    budgetEur: number;
    orderedEur: number;
    discountAppliedPct: number;
    updatedAt: string;
}

export type B2BCustomerNoteTag =
    | 'skambutis'
    | 'susitikimas'
    | 'kainodara'
    | 'objektas'
    | 'buhalterija';

export interface B2BCustomerNote {
    id: string;
    author: string;
    tag: B2BCustomerNoteTag;
    text: string;
    createdAt: string;
}

export interface B2BMonthlyPurchaseRecord {
    month: string;
    purchasedEur: number;
    discountEur: number;
    marginEur: number;
}

export type B2BCrmCategoryBucket =
    | 'Katilai'
    | 'Šilumos siurbliai'
    | 'Termostatika'
    | 'Radiatoriai'
    | 'Talpos';

export interface B2BCustomerPurchaseStats {
    totalPurchasedEur: number;
    ordersCount: number;
    avgOrderEur: number;
    totalDiscountsGrantedEur: number;
    effectiveDiscountPct: number;
    netMarginEur: number;
    netMarginPct: number;
    creditLimitEur: number;
    creditUsedEur: number;
    monthlyHistory: B2BMonthlyPurchaseRecord[];
    categoryBreakdown: Record<B2BCrmCategoryBucket, number>;
}

export interface B2BGrantedDiscountsSummary {
    tierSegment: B2BCustomerTierSegment;
    baseDiscountPct: number;
    activeBrandDiscounts: Array<{ brand: string; discountPct: number; label: string }>;
    activeCategoryDiscounts: Array<{ category: string; discountPct: number; label: string }>;
    skuOverridesCount: number;
    skuOverridesLabel: string;
    extraCartDiscountPct: number;
    extraCartFixedEur: number;
    wholeCartSummaryLabel: string;
    totalDiscountsGrantedEur: number;
}

export interface B2BCustomer360Summary {
    accountId: string;
    companyName: string;
    companyCode: string;
    vatCode: string;
    contactPerson: string;
    email: string;
    phone: string;
    city: string;
    status: B2BPartnerAccount['status'];
    tierSegment: B2BCustomerTierSegment;
    assignedManager: string;
    paymentTermsDays: number;
    creditConfig: B2BCreditConfig;
    creditLedgerSummary: B2BCreditLedgerSummary;
    clientInvoices: B2BClientInvoiceRecord[];
    purchaseStats: B2BCustomerPurchaseStats;
    monthlyPurchases: B2BMonthlyPurchaseRecord[];
    grantedDiscountsSummary: B2BGrantedDiscountsSummary;
    projects: B2BCustomerProject[];
    notes: B2BCustomerNote[];
    latestNote: B2BCustomerNote | null;
}

export interface B2BCrmAnalyticsSnapshot {
    totalCustomers: number;
    totalPurchasedEur: number;
    totalOrdersCount: number;
    totalDiscountsGrantedEur: number;
    totalNetMarginEur: number;
    avgEffectiveDiscountPct: number;
    activeProjectsCount: number;
    totalNotesCount: number;
    totalCreditLimitsEur: number;
    totalCreditUsedEur: number;
    totalPaidInvoicesEur: number;
    totalOverdueInvoicesEur: number;
    approachingLimitClientsCount: number;
    overdueClientsCount: number;
    creditRemindersLog: B2BCreditReminderRecord[];
    monthlyHistory: B2BMonthlyPurchaseRecord[];
    customers: B2BCustomer360Summary[];
}

export interface B2BSkuPriceOverride {
    sku: string;
    customPriceEur?: number;
    customDiscountPct?: number;
    minQty?: number;
    note?: string;
}

export interface B2BCartVolumeTier {
    minCartEur: number;
    extraDiscountPct: number;
    label?: string;
}

export interface B2BQuantityDiscountTier {
    minQty: number;
    extraDiscountPct: number;
    label: string;
}

export interface B2BCartDiscountRules {
    extraCartDiscountPct?: number;
    extraCartFixedEur?: number;
    volumeTiers: B2BCartVolumeTier[];
    personalPromoCode?: string;
}

export interface B2BCustomerPricingRule {
    accountId: string;
    tierSegment?: B2BCustomerTierSegment;
    assignedManager?: string;
    suspended?: boolean;
    brandDiscounts: Record<string, number>;
    categoryDiscounts: Record<string, number>;
    skuOverrides: B2BSkuPriceOverride[];
    cartDiscountRules: B2BCartDiscountRules;
    creditConfig?: B2BCreditConfig;
    clientInvoices?: B2BClientInvoiceRecord[];
    projects?: B2BCustomerProject[];
    notes?: B2BCustomerNote[];
    updatedAt: string;
}

export interface B2BIndividualOfferItem {
    sku: string;
    title: string;
    qty: number;
    retailNetEur: number;
    customNetEur: number;
}

export interface B2BIndividualCommercialOffer {
    id: string;
    offerNumber: string;
    accountId: string;
    clientName: string;
    title: string;
    items: B2BIndividualOfferItem[];
    extraWholeCartDiscountPct: number;
    subtotalNetEur: number;
    finalNetEur: number;
    finalGrossEur: number;
    validUntil: string;
    shareLink: string;
    status: 'AKTYVUS' | 'PATVIRTINTAS' | 'PASIBAIGĘS';
    createdAt: string;
}

export interface B2BMarketingCampaign {
    id: string;
    title: string;
    message: string;
    categoryTag:
        | 'Sezoninė akcija'
        | 'Kainų kritimas'
        | 'Nauja siunta sandėlyje'
        | 'Asmeninis krepšelio pasiūlymas';
    targetType: 'ALL_B2B' | 'SEGMENT' | 'SINGLE_CLIENT';
    targetSegment?: B2BCustomerTierSegment;
    targetAccountId?: string;
    promoDiscountPct?: number;
    ctaSku?: string;
    sentCount: number;
    createdAt: string;
}

export interface CartCustomQuoteRequest {
    id: string;
    requestNumber: string;
    accountId?: string;
    customerName: string;
    companyName: string;
    phone: string;
    email: string;
    note: string;
    items: Array<{
        sku: string;
        title: string;
        qty: number;
        unitGrossEur: number;
    }>;
    totalGrossEur: number;
    totalNetEur: number;
    status: 'NAUJA_UZKLAUSA' | 'PASIULYMAS_ISSIUSTAS' | 'PATVIRTINTA';
    createdAt: string;
}

export interface B2BPricingEngineStore {
    customerRules: Record<string, B2BCustomerPricingRule>;
    individualOffers: B2BIndividualCommercialOffer[];
    campaigns: B2BMarketingCampaign[];
    cartQuoteRequests: CartCustomQuoteRequest[];
    creditRemindersLog: B2BCreditReminderRecord[];
    globalVolumeTiers: B2BCartVolumeTier[];
    globalQuantityTiers: B2BQuantityDiscountTier[];
}

export const SUPPORTED_B2B_BRANDS = [
    'Danfoss',
    'Haier',
    'IMI Heimeier',
    'HERZ',
    'Gilės / Megatherm',
    'Gorenje / Tiki',
    'Dražice',
    'Ferroli',
] as const;

export const SUPPORTED_B2B_CATEGORIES = [
    'Granulių degikliai',
    'Katilai',
    'Šilumos siurbliai',
    'Vandens šildytuvai (boileriai)',
    'Termostatinės galvutės',
    'Siurbliai ir pamaišymo mazgai',
    'Konteinerinės katilinės',
] as const;

export const DEFAULT_CART_VOLUME_TIERS: B2BCartVolumeTier[] = [
    { minCartEur: 1000, extraDiscountPct: 3, label: 'Krepšelis ≥ 1 000 € (-3%)' },
    { minCartEur: 2500, extraDiscountPct: 5, label: 'Krepšelis ≥ 2 500 € (-5%)' },
    { minCartEur: 5000, extraDiscountPct: 8, label: 'Krepšelis ≥ 5 000 € (-8%)' },
];

export const DEFAULT_QUANTITY_TIERS: B2BQuantityDiscountTier[] = [
    { minQty: 3, extraDiscountPct: 2, label: 'Perkant 3+ vnt. (-2%)' },
    { minQty: 5, extraDiscountPct: 4, label: 'Perkant 5+ vnt. (-4%)' },
    { minQty: 10, extraDiscountPct: 6, label: 'Perkant 10+ vnt. (-6%)' },
];

function round2(n: number): number {
    return Math.round(n * 100) / 100;
}

function normalizeSku(sku: string): string {
    return (sku || '').trim().toUpperCase();
}

function getServerFs(): {
    fs: typeof import('node:fs');
    rulesPath: string;
    campaignsPath: string;
    invoicesPath: string;
} | null {
    if (typeof window !== 'undefined') return null;
    try {
        const req = eval('require') as NodeRequire;
        const fs = req('fs') as typeof import('node:fs');
        const path = req('path') as typeof import('node:path');
        const dataDir = path.join(process.cwd(), 'src', 'data');
        return {
            fs,
            rulesPath: path.join(dataDir, 'b2b-pricing-rules.json'),
            campaignsPath: path.join(dataDir, 'b2b-campaigns.json'),
            invoicesPath: path.join(dataDir, 'skaita-invoices.json'),
        };
    } catch {
        return null;
    }
}

interface LiteSkaitaInvoiceLine {
    sku: string;
    title: string;
    qty: number;
    unitNetEur: number;
    discountPercent?: number;
    costNetEur?: number;
}

interface LiteSkaitaInvoice {
    paymentStatus: string;
    buyerCompanyCode: string;
    buyerName: string;
    totalNetEur: number;
    issueDate: string;
    lines: LiteSkaitaInvoiceLine[];
}

function readServerInvoices(): LiteSkaitaInvoice[] {
    const srv = getServerFs();
    if (!srv) return [];
    try {
        if (srv.fs.existsSync(srv.invoicesPath)) {
            const raw = srv.fs.readFileSync(srv.invoicesPath, 'utf-8').trim();
            if (raw && raw !== '[]') {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed)) return parsed as LiteSkaitaInvoice[];
            }
        }
    } catch {
        // ignore
    }
    return [];
}

let memoryStore: B2BPricingEngineStore | null = null;

function createEmptyStore(): B2BPricingEngineStore {
    return {
        customerRules: {},
        individualOffers: [],
        campaigns: [],
        cartQuoteRequests: [],
        creditRemindersLog: [],
        globalVolumeTiers: [...DEFAULT_CART_VOLUME_TIERS],
        globalQuantityTiers: [...DEFAULT_QUANTITY_TIERS],
    };
}

function loadStore(): B2BPricingEngineStore {
    if (memoryStore) return memoryStore;
    const srv = getServerFs();
    const initial = createEmptyStore();
    if (srv) {
        try {
            if (srv.fs.existsSync(srv.rulesPath)) {
                const raw = srv.fs.readFileSync(srv.rulesPath, 'utf-8').trim();
                if (raw && raw !== '{}') {
                    const parsed = JSON.parse(raw) as Partial<B2BPricingEngineStore>;
                    if (parsed.customerRules && typeof parsed.customerRules === 'object') {
                        initial.customerRules = parsed.customerRules;
                    }
                    if (Array.isArray(parsed.individualOffers)) {
                        initial.individualOffers = parsed.individualOffers;
                    }
                    if (Array.isArray(parsed.cartQuoteRequests)) {
                        initial.cartQuoteRequests = parsed.cartQuoteRequests;
                    }
                    if (Array.isArray(parsed.creditRemindersLog)) {
                        initial.creditRemindersLog = parsed.creditRemindersLog;
                    }
                    if (Array.isArray(parsed.globalVolumeTiers) && parsed.globalVolumeTiers.length > 0) {
                        initial.globalVolumeTiers = parsed.globalVolumeTiers;
                    }
                    if (Array.isArray(parsed.globalQuantityTiers) && parsed.globalQuantityTiers.length > 0) {
                        initial.globalQuantityTiers = parsed.globalQuantityTiers;
                    }
                }
            }
            if (srv.fs.existsSync(srv.campaignsPath)) {
                const rawCamp = srv.fs.readFileSync(srv.campaignsPath, 'utf-8').trim();
                if (rawCamp && rawCamp !== '[]') {
                    const parsedCamp = JSON.parse(rawCamp);
                    if (Array.isArray(parsedCamp)) {
                        initial.campaigns = parsedCamp;
                    }
                }
            }
        } catch {
            // keep default clean store
        }
    }
    memoryStore = initial;
    return memoryStore;
}

function saveStore(store: B2BPricingEngineStore): void {
    memoryStore = store;
    const srv = getServerFs();
    if (!srv) return;
    try {
        const isCleanRules =
            Object.keys(store.customerRules).length === 0 &&
            store.individualOffers.length === 0 &&
            store.cartQuoteRequests.length === 0 &&
            store.creditRemindersLog.length === 0;
        if (isCleanRules) {
            srv.fs.writeFileSync(srv.rulesPath, '{}\n', 'utf-8');
        } else {
            srv.fs.writeFileSync(
                srv.rulesPath,
                JSON.stringify(
                    {
                        customerRules: store.customerRules,
                        individualOffers: store.individualOffers,
                        cartQuoteRequests: store.cartQuoteRequests,
                        creditRemindersLog: store.creditRemindersLog,
                        globalVolumeTiers: store.globalVolumeTiers,
                        globalQuantityTiers: store.globalQuantityTiers,
                    },
                    null,
                    2,
                ),
                'utf-8',
            );
        }
        if (store.campaigns.length === 0) {
            srv.fs.writeFileSync(srv.campaignsPath, '[]\n', 'utf-8');
        } else {
            srv.fs.writeFileSync(srv.campaignsPath, JSON.stringify(store.campaigns, null, 2), 'utf-8');
        }
    } catch {
        // ignore read-only fs errors
    }
}

export function resetB2BPricingEngineState(): void {
    resetB2BAccountsCache([]);
    const clean = createEmptyStore();
    saveStore(clean);
}

export function getB2BPricingStore(): B2BPricingEngineStore {
    return loadStore();
}

export function getCustomerPricingRule(accountId?: string | null): B2BCustomerPricingRule | null {
    if (!accountId) return null;
    const store = loadStore();
    return store.customerRules[accountId] || null;
}

export function upsertCustomerPricingRule(
    accountId: string,
    patch: {
        tierSegment?: B2BCustomerTierSegment;
        assignedManager?: string;
        suspended?: boolean;
        brandDiscounts?: Record<string, number>;
        categoryDiscounts?: Record<string, number>;
        skuOverrides?: B2BSkuPriceOverride[];
        cartDiscountRules?: Partial<B2BCartDiscountRules>;
        creditConfig?: Partial<B2BCreditConfig>;
        clientInvoices?: B2BClientInvoiceRecord[];
        projects?: B2BCustomerProject[];
        notes?: B2BCustomerNote[];
    },
): B2BCustomerPricingRule {
    const store = loadStore();
    const account = listB2BPartnerAccounts().find((a) => a.id === accountId);
    const existing = store.customerRules[accountId] || {
        accountId,
        tierSegment: 'Montuotojas',
        assignedManager: 'Darius Šauklys',
        suspended: false,
        brandDiscounts: {},
        categoryDiscounts: {},
        skuOverrides: [],
        cartDiscountRules: {
            extraCartDiscountPct: 0,
            extraCartFixedEur: 0,
            volumeTiers: [...store.globalVolumeTiers],
        },
        creditConfig: {
            creditLimitEur: account?.creditLimitEur ?? 10000,
            paymentTermDays: account?.paymentTermsDays ?? 14,
            autoReminderThresholdPct: 80,
            autoDueSoonReminderDays: 3,
            autoRemindersEnabled: true,
            creditHoldOnExceed: true,
        },
        clientInvoices: [],
        projects: [],
        notes: [],
        updatedAt: new Date().toISOString(),
    };

    const existingCredit: B2BCreditConfig = existing.creditConfig || {
        creditLimitEur: account?.creditLimitEur ?? 10000,
        paymentTermDays: account?.paymentTermsDays ?? 14,
        autoReminderThresholdPct: 80,
        autoDueSoonReminderDays: 3,
        autoRemindersEnabled: true,
        creditHoldOnExceed: true,
    };

    const updated: B2BCustomerPricingRule = {
        ...existing,
        tierSegment: patch.tierSegment ?? existing.tierSegment,
        assignedManager: patch.assignedManager ?? existing.assignedManager,
        suspended: patch.suspended ?? existing.suspended,
        brandDiscounts: patch.brandDiscounts ?? existing.brandDiscounts,
        categoryDiscounts: patch.categoryDiscounts ?? existing.categoryDiscounts,
        skuOverrides: patch.skuOverrides
            ? patch.skuOverrides.map((o) => ({
                  ...o,
                  sku: normalizeSku(o.sku),
                  minQty: Math.max(1, Number(o.minQty) || 1),
              }))
            : existing.skuOverrides,
        cartDiscountRules: {
            extraCartDiscountPct:
                patch.cartDiscountRules?.extraCartDiscountPct ??
                existing.cartDiscountRules.extraCartDiscountPct ??
                0,
            extraCartFixedEur:
                patch.cartDiscountRules?.extraCartFixedEur ??
                existing.cartDiscountRules.extraCartFixedEur ??
                0,
            personalPromoCode:
                patch.cartDiscountRules?.personalPromoCode ??
                existing.cartDiscountRules.personalPromoCode,
            volumeTiers:
                patch.cartDiscountRules?.volumeTiers ??
                existing.cartDiscountRules.volumeTiers ??
                [...store.globalVolumeTiers],
        },
        creditConfig: {
            creditLimitEur:
                typeof patch.creditConfig?.creditLimitEur === 'number'
                    ? Math.max(0, round2(patch.creditConfig.creditLimitEur))
                    : existingCredit.creditLimitEur,
            paymentTermDays:
                typeof patch.creditConfig?.paymentTermDays === 'number'
                    ? Math.max(0, Math.round(patch.creditConfig.paymentTermDays))
                    : existingCredit.paymentTermDays,
            autoReminderThresholdPct:
                typeof patch.creditConfig?.autoReminderThresholdPct === 'number'
                    ? Math.min(100, Math.max(10, Math.round(patch.creditConfig.autoReminderThresholdPct)))
                    : existingCredit.autoReminderThresholdPct,
            autoDueSoonReminderDays:
                typeof patch.creditConfig?.autoDueSoonReminderDays === 'number'
                    ? Math.max(1, Math.round(patch.creditConfig.autoDueSoonReminderDays))
                    : existingCredit.autoDueSoonReminderDays,
            autoRemindersEnabled:
                typeof patch.creditConfig?.autoRemindersEnabled === 'boolean'
                    ? patch.creditConfig.autoRemindersEnabled
                    : existingCredit.autoRemindersEnabled,
            creditHoldOnExceed:
                typeof patch.creditConfig?.creditHoldOnExceed === 'boolean'
                    ? patch.creditConfig.creditHoldOnExceed
                    : existingCredit.creditHoldOnExceed,
        },
        clientInvoices: patch.clientInvoices ?? existing.clientInvoices ?? [],
        projects: patch.projects ?? existing.projects ?? [],
        notes: patch.notes ?? existing.notes ?? [],
        updatedAt: new Date().toISOString(),
    };

    store.customerRules[accountId] = updated;
    saveStore(store);
    return updated;
}

function mapTierSegmentToLegacyLabel(
    segment: B2BCustomerTierSegment | undefined,
    defaultDiscountPercent: number,
): B2BDiscountTierLabel {
    if (segment === 'Regioninis Dileris' || defaultDiscountPercent >= 50) {
        return 'Regioninis dileris ir rangovas -52%';
    }
    if (segment === 'ŠVOK Rangovas' || segment === 'Individualus' || defaultDiscountPercent >= 42) {
        return 'Pro montuotojas Danfoss -48% / HERZ -50% / Haier -40%';
    }
    return 'Standartinis montuotojas -35%';
}

export function createManualB2BCustomer(input: {
    companyName: string;
    companyCode: string;
    vatCode?: string;
    contactPerson: string;
    email: string;
    phone: string;
    city?: string;
    tierLabel?: B2BCustomerTierSegment;
    defaultDiscountPercent?: number;
    creditLimitEur?: number;
    paymentTermsDays?: B2BPaymentDeferralDays;
    assignedManager?: string;
    password?: string;
}): B2BPartnerAccount {
    const accounts = listB2BPartnerAccounts();
    const discountPct =
        typeof input.defaultDiscountPercent === 'number' ? input.defaultDiscountPercent : 35;
    const tierSegment = input.tierLabel || 'Montuotojas';
    const newAccount: B2BPartnerAccount = {
        id: `b2b-client-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        companyName: input.companyName.trim(),
        companyCode: input.companyCode.trim(),
        vatCode: (input.vatCode || 'LT100000000000').trim(),
        contactPerson: input.contactPerson.trim(),
        email: input.email.trim().toLowerCase(),
        phone: input.phone.trim(),
        activityType:
            tierSegment === 'Regioninis Dileris'
                ? 'Dileris'
                : tierSegment === 'ŠVOK Rangovas'
                  ? 'Projektuotojas / Dileris'
                  : 'ŠVOK montuotojas',
        city: (input.city || 'Kaunas').trim(),
        status: 'APPROVED',
        discountTier: mapTierSegmentToLegacyLabel(tierSegment, discountPct),
        defaultDiscountPercent: discountPct,
        creditLimitEur: input.creditLimitEur ?? 10000,
        creditUsedEur: 0,
        paymentTermsDays: input.paymentTermsDays ?? 14,
        password: (input.password || 'gile2026').trim(),
        createdAt: new Date().toISOString(),
        approvedAt: new Date().toISOString(),
        approvedBy: input.assignedManager || 'Darius Šauklys (Admin)',
    };

    resetB2BAccountsCache([newAccount, ...accounts]);
    upsertCustomerPricingRule(newAccount.id, {
        tierSegment,
        assignedManager: input.assignedManager || 'Darius Šauklys',
    });
    return newAccount;
}

export function updateB2BCustomerCrmProfile(input: {
    accountId: string;
    status?: B2BPartnerAccount['status'];
    companyName?: string;
    companyCode?: string;
    vatCode?: string;
    contactPerson?: string;
    email?: string;
    phone?: string;
    city?: string;
    tierLabel?: B2BCustomerTierSegment;
    defaultDiscountPercent?: number;
    creditLimitEur?: number;
    paymentTermsDays?: B2BPaymentDeferralDays;
    assignedManager?: string;
    suspended?: boolean;
}): B2BPartnerAccount | null {
    const accounts = listB2BPartnerAccounts();
    const idx = accounts.findIndex((a) => a.id === input.accountId);
    if (idx === -1) return null;

    const current = accounts[idx]!;
    const nextDiscount =
        typeof input.defaultDiscountPercent === 'number'
            ? input.defaultDiscountPercent
            : current.defaultDiscountPercent;
    const nextStatus = input.suspended
        ? 'REJECTED'
        : input.status ?? current.status;

    const updated: B2BPartnerAccount = {
        ...current,
        companyName: input.companyName?.trim() || current.companyName,
        companyCode: input.companyCode?.trim() || current.companyCode,
        vatCode: input.vatCode?.trim() || current.vatCode,
        contactPerson: input.contactPerson?.trim() || current.contactPerson,
        email: input.email?.trim().toLowerCase() || current.email,
        phone: input.phone?.trim() || current.phone,
        city: input.city?.trim() || current.city,
        status: nextStatus,
        defaultDiscountPercent: nextDiscount,
        discountTier: input.tierLabel
            ? mapTierSegmentToLegacyLabel(input.tierLabel, nextDiscount)
            : current.discountTier,
        creditLimitEur: input.creditLimitEur ?? current.creditLimitEur,
        paymentTermsDays: input.paymentTermsDays ?? current.paymentTermsDays,
        approvedBy: input.assignedManager || current.approvedBy || 'Darius Šauklys (Admin)',
    };

    const nextAccounts = accounts.map((a, i) => (i === idx ? updated : a));
    resetB2BAccountsCache(nextAccounts);

    upsertCustomerPricingRule(updated.id, {
        tierSegment: input.tierLabel,
        assignedManager: input.assignedManager,
        suspended: input.suspended,
    });

    return updated;
}

export interface B2BLineItemPriceCalculation {
    sku: string;
    qty: number;
    retailGrossEur: number;
    retailNetEur: number;
    costNetEur: number;
    unitNetEur: number;
    unitGrossEur: number;
    lineNetEur: number;
    lineGrossEur: number;
    appliedDiscountPct: number;
    appliedLayer:
        | 'SKU_OVERRIDE'
        | 'BRAND_DISCOUNT'
        | 'CATEGORY_DISCOUNT'
        | 'QUANTITY_TIER'
        | 'ACCOUNT_DEFAULT'
        | 'RETAIL';
    appliedRuleLabel: string;
    marginEur: number;
    marginPct: number;
    marginBelowFloorWarning: boolean;
}

export function calculateB2BLineItemPrice(input: {
    accountId?: string | null;
    defaultAccountDiscountPct?: number;
    sku: string;
    brandName?: string;
    categoryName?: string;
    retailGrossEur: number;
    costNetEur?: number;
    qty: number;
    applyGlobalQuantityTiers?: boolean;
}): B2BLineItemPriceCalculation {
    const qty = Math.max(1, Number(input.qty) || 1);
    const retailGrossEur = round2(Math.max(0.01, Number(input.retailGrossEur) || 0));
    const retailNetEur = round2(retailGrossEur / 1.21);
    const costNetEur =
        typeof input.costNetEur === 'number' && input.costNetEur > 0
            ? round2(input.costNetEur)
            : round2(retailNetEur * 0.58);

    const store = loadStore();
    const rule = input.accountId ? store.customerRules[input.accountId] : undefined;
    const account = input.accountId
        ? listB2BPartnerAccounts().find((a) => a.id === input.accountId)
        : undefined;
    const baseAccountDiscountPct =
        typeof input.defaultAccountDiscountPct === 'number'
            ? input.defaultAccountDiscountPct
            : account?.defaultDiscountPercent ?? 0;

    const normSku = normalizeSku(input.sku);
    let unitNetEur = retailNetEur;
    let appliedDiscountPct = 0;
    let appliedLayer: B2BLineItemPriceCalculation['appliedLayer'] = 'RETAIL';
    let appliedRuleLabel = 'Mažmeninė kaina';

    // Layer 2: Specific SKU Price / Discount Override (highest priority when qty >= minQty)
    const matchingOverride = rule?.skuOverrides.find(
        (o) => normalizeSku(o.sku) === normSku && qty >= (o.minQty || 1),
    );

    if (matchingOverride) {
        if (
            typeof matchingOverride.customPriceEur === 'number' &&
            matchingOverride.customPriceEur > 0
        ) {
            unitNetEur = round2(matchingOverride.customPriceEur);
            appliedDiscountPct = round2(
                Math.max(0, ((retailNetEur - unitNetEur) / retailNetEur) * 100),
            );
            appliedLayer = 'SKU_OVERRIDE';
            appliedRuleLabel = `Spec. SKU kaina (${unitNetEur.toFixed(2)} € be PVM${matchingOverride.minQty && matchingOverride.minQty > 1 ? `, nuo ${matchingOverride.minQty} vnt.` : ''})`;
        } else if (
            typeof matchingOverride.customDiscountPct === 'number' &&
            matchingOverride.customDiscountPct > 0
        ) {
            appliedDiscountPct = matchingOverride.customDiscountPct;
            unitNetEur = round2(retailNetEur * (1 - appliedDiscountPct / 100));
            appliedLayer = 'SKU_OVERRIDE';
            appliedRuleLabel = `Spec. SKU nuolaida (-${appliedDiscountPct}%)`;
        }
    }

    // Layer 1: Individual Brand or Category Discount Matrix
    if (appliedLayer === 'RETAIL' && rule) {
        const brandKey = Object.keys(rule.brandDiscounts).find(
            (b) =>
                (input.brandName || '').toLowerCase().includes(b.toLowerCase()) ||
                b.toLowerCase().includes((input.brandName || '___').toLowerCase()),
        );
        const brandDiscount = brandKey ? rule.brandDiscounts[brandKey] : undefined;

        const catKey = Object.keys(rule.categoryDiscounts).find(
            (c) =>
                (input.categoryName || '').toLowerCase().includes(c.toLowerCase()) ||
                c.toLowerCase().includes((input.categoryName || '___').toLowerCase()),
        );
        const catDiscount = catKey ? rule.categoryDiscounts[catKey] : undefined;

        if (typeof brandDiscount === 'number' && brandDiscount > 0) {
            appliedDiscountPct = brandDiscount;
            unitNetEur = round2(retailNetEur * (1 - appliedDiscountPct / 100));
            appliedLayer = 'BRAND_DISCOUNT';
            appliedRuleLabel = `Individuali „${brandKey}“ nuolaida (-${appliedDiscountPct}%)`;
        } else if (typeof catDiscount === 'number' && catDiscount > 0) {
            appliedDiscountPct = catDiscount;
            unitNetEur = round2(retailNetEur * (1 - appliedDiscountPct / 100));
            appliedLayer = 'CATEGORY_DISCOUNT';
            appliedRuleLabel = `Kategorijos „${catKey}“ nuolaida (-${appliedDiscountPct}%)`;
        }
    }

    // Account default wholesale discount
    if (appliedLayer === 'RETAIL' && baseAccountDiscountPct > 0) {
        appliedDiscountPct = baseAccountDiscountPct;
        unitNetEur = round2(retailNetEur * (1 - appliedDiscountPct / 100));
        appliedLayer = 'ACCOUNT_DEFAULT';
        appliedRuleLabel = `B2B bazinė nuolaida (-${appliedDiscountPct}%)`;
    }

    // Quantity tier discount (for retail or as an extra booster when enabled)
    if (input.applyGlobalQuantityTiers) {
        const matchingQtyTier = [...store.globalQuantityTiers]
            .sort((a, b) => b.minQty - a.minQty)
            .find((t) => qty >= t.minQty);
        if (matchingQtyTier && appliedLayer === 'RETAIL') {
            appliedDiscountPct = matchingQtyTier.extraDiscountPct;
            unitNetEur = round2(retailNetEur * (1 - appliedDiscountPct / 100));
            appliedLayer = 'QUANTITY_TIER';
            appliedRuleLabel = matchingQtyTier.label;
        }
    }

    const unitGrossEur = round2(unitNetEur * 1.21);
    const lineNetEur = round2(unitNetEur * qty);
    const lineGrossEur = round2(unitGrossEur * qty);
    const marginEur = round2((unitNetEur - costNetEur) * qty);
    const marginPct =
        unitNetEur > 0 ? round2(((unitNetEur - costNetEur) / unitNetEur) * 100) : 0;

    return {
        sku: normSku,
        qty,
        retailGrossEur,
        retailNetEur,
        costNetEur,
        unitNetEur,
        unitGrossEur,
        lineNetEur,
        lineGrossEur,
        appliedDiscountPct,
        appliedLayer,
        appliedRuleLabel,
        marginEur,
        marginPct,
        marginBelowFloorWarning: marginPct < 10,
    };
}

export interface B2BCartPricingSummary {
    lines: Array<B2BLineItemPriceCalculation & { title: string; brandName?: string }>;
    retailTotalNetEur: number;
    retailTotalGrossEur: number;
    linesSubtotalNetEur: number;
    linesSubtotalGrossEur: number;
    activeVolumeTier: B2BCartVolumeTier | null;
    volumeDiscountPct: number;
    personalCartDiscountPct: number;
    combinedExtraCartDiscountPct: number;
    extraCartPercentDiscountEur: number;
    extraCartFixedEur: number;
    finalNetEur: number;
    finalVatEur: number;
    finalGrossEur: number;
    totalSavedEur: number;
    nextVolumeTier: {
        tier: B2BCartVolumeTier;
        remainingEur: number;
        progressPct: number;
    } | null;
}

export function calculateB2BCartPricing(input: {
    accountId?: string | null;
    defaultAccountDiscountPct?: number;
    applyGlobalQuantityTiers?: boolean;
    manualExtraCartDiscountPct?: number;
    items: Array<{
        sku: string;
        title: string;
        brandName?: string;
        categoryName?: string;
        retailGrossEur: number;
        costNetEur?: number;
        qty: number;
    }>;
}): B2BCartPricingSummary {
    const store = loadStore();
    const rule = input.accountId ? store.customerRules[input.accountId] : undefined;

    const lines = input.items.map((item) => {
        const calc = calculateB2BLineItemPrice({
            accountId: input.accountId,
            defaultAccountDiscountPct: input.defaultAccountDiscountPct,
            sku: item.sku,
            brandName: item.brandName,
            categoryName: item.categoryName,
            retailGrossEur: item.retailGrossEur,
            costNetEur: item.costNetEur,
            qty: item.qty,
            applyGlobalQuantityTiers: input.applyGlobalQuantityTiers ?? true,
        });
        return {
            ...calc,
            title: item.title,
            brandName: item.brandName,
        };
    });

    const retailTotalNetEur = round2(
        lines.reduce((sum, l) => sum + l.retailNetEur * l.qty, 0),
    );
    const retailTotalGrossEur = round2(
        lines.reduce((sum, l) => sum + l.retailGrossEur * l.qty, 0),
    );
    const linesSubtotalNetEur = round2(lines.reduce((sum, l) => sum + l.lineNetEur, 0));
    const linesSubtotalGrossEur = round2(lines.reduce((sum, l) => sum + l.lineGrossEur, 0));

    const volumeTiers =
        rule?.cartDiscountRules.volumeTiers && rule.cartDiscountRules.volumeTiers.length > 0
            ? rule.cartDiscountRules.volumeTiers
            : store.globalVolumeTiers;

    const sortedTiersAsc = [...volumeTiers].sort((a, b) => a.minCartEur - b.minCartEur);
    const sortedTiersDesc = [...volumeTiers].sort((a, b) => b.minCartEur - a.minCartEur);

    const activeVolumeTier =
        sortedTiersDesc.find((t) => linesSubtotalNetEur >= t.minCartEur) || null;
    const volumeDiscountPct = activeVolumeTier?.extraDiscountPct || 0;

    const personalCartDiscountPct =
        typeof input.manualExtraCartDiscountPct === 'number'
            ? input.manualExtraCartDiscountPct
            : rule?.cartDiscountRules.extraCartDiscountPct || 0;

    const combinedExtraCartDiscountPct = round2(volumeDiscountPct + personalCartDiscountPct);
    const extraCartPercentDiscountEur = round2(
        linesSubtotalNetEur * (combinedExtraCartDiscountPct / 100),
    );
    const extraCartFixedEur = round2(rule?.cartDiscountRules.extraCartFixedEur || 0);

    const finalNetEur = round2(
        Math.max(0, linesSubtotalNetEur - extraCartPercentDiscountEur - extraCartFixedEur),
    );
    const finalGrossEur = round2(finalNetEur * 1.21);
    const finalVatEur = round2(Math.max(0, finalGrossEur - finalNetEur));
    const totalSavedEur = round2(Math.max(0, retailTotalNetEur - finalNetEur));

    const upcomingTier = sortedTiersAsc.find((t) => linesSubtotalNetEur < t.minCartEur);
    const nextVolumeTier = upcomingTier
        ? {
              tier: upcomingTier,
              remainingEur: round2(Math.max(0, upcomingTier.minCartEur - linesSubtotalNetEur)),
              progressPct: Math.min(
                  100,
                  Math.round((linesSubtotalNetEur / upcomingTier.minCartEur) * 100),
              ),
          }
        : null;

    return {
        lines,
        retailTotalNetEur,
        retailTotalGrossEur,
        linesSubtotalNetEur,
        linesSubtotalGrossEur,
        activeVolumeTier,
        volumeDiscountPct,
        personalCartDiscountPct,
        combinedExtraCartDiscountPct,
        extraCartPercentDiscountEur,
        extraCartFixedEur,
        finalNetEur,
        finalVatEur,
        finalGrossEur,
        totalSavedEur,
        nextVolumeTier,
    };
}

export function createCustomCommercialOffer(input: {
    accountId: string;
    clientName: string;
    title: string;
    extraWholeCartDiscountPct?: number;
    validUntil?: string;
    items: B2BIndividualOfferItem[];
}): B2BIndividualCommercialOffer {
    const store = loadStore();
    const seq = String(store.individualOffers.length + 1).padStart(4, '0');
    const offerNumber = `KP-${seq}`;
    const subtotalNetEur = round2(
        input.items.reduce((sum, item) => sum + item.customNetEur * item.qty, 0),
    );
    const extraPct = Math.max(0, Number(input.extraWholeCartDiscountPct) || 0);
    const finalNetEur = round2(subtotalNetEur * (1 - extraPct / 100));
    const finalGrossEur = round2(finalNetEur * 1.21);

    const offer: B2BIndividualCommercialOffer = {
        id: `b2b-offer-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        offerNumber,
        accountId: input.accountId,
        clientName: input.clientName.trim(),
        title: input.title.trim(),
        items: input.items,
        extraWholeCartDiscountPct: extraPct,
        subtotalNetEur,
        finalNetEur,
        finalGrossEur,
        validUntil: input.validUntil || 'Galioja 14 d.',
        shareLink: `https://gilesinzinerija.lt/lt/b2b?offer=${offerNumber}`,
        status: 'AKTYVUS',
        createdAt: new Date().toISOString(),
    };

    store.individualOffers = [offer, ...store.individualOffers];
    saveStore(store);
    return offer;
}

export function createMarketingCampaign(input: {
    title: string;
    message: string;
    categoryTag?: B2BMarketingCampaign['categoryTag'];
    targetType: B2BMarketingCampaign['targetType'];
    targetSegment?: B2BCustomerTierSegment;
    targetAccountId?: string;
    promoDiscountPct?: number;
    ctaSku?: string;
}): B2BMarketingCampaign {
    const store = loadStore();
    const accounts = listB2BPartnerAccounts();
    const matchingCount =
        input.targetType === 'SINGLE_CLIENT'
            ? 1
            : input.targetType === 'SEGMENT'
              ? Math.max(1, accounts.length)
              : Math.max(1, accounts.length);

    const campaign: B2BMarketingCampaign = {
        id: `camp-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        title: input.title.trim(),
        message: input.message.trim(),
        categoryTag: input.categoryTag || 'Sezoninė akcija',
        targetType: input.targetType,
        targetSegment: input.targetSegment,
        targetAccountId: input.targetAccountId,
        promoDiscountPct: input.promoDiscountPct,
        ctaSku: input.ctaSku?.trim().toUpperCase(),
        sentCount: matchingCount,
        createdAt: new Date().toISOString(),
    };

    store.campaigns = [campaign, ...store.campaigns];
    saveStore(store);
    return campaign;
}

export function deleteMarketingCampaign(campaignId: string): boolean {
    const store = loadStore();
    const before = store.campaigns.length;
    store.campaigns = store.campaigns.filter((c) => c.id !== campaignId);
    saveStore(store);
    return store.campaigns.length < before;
}

export function getCampaignsForPartner(
    accountId?: string | null,
    tierSegment?: B2BCustomerTierSegment,
): B2BMarketingCampaign[] {
    const store = loadStore();
    const rule = accountId ? store.customerRules[accountId] : undefined;
    const effectiveSegment = tierSegment || rule?.tierSegment || 'Montuotojas';

    return store.campaigns.filter((c) => {
        if (c.targetType === 'ALL_B2B') return true;
        if (c.targetType === 'SINGLE_CLIENT') return Boolean(accountId && c.targetAccountId === accountId);
        if (c.targetType === 'SEGMENT') {
            return !c.targetSegment || c.targetSegment === effectiveSegment;
        }
        return true;
    });
}

export function getOffersForPartner(accountId?: string | null): B2BIndividualCommercialOffer[] {
    const store = loadStore();
    if (!accountId) return store.individualOffers;
    return store.individualOffers.filter(
        (o) => o.accountId === accountId || o.accountId === 'ALL',
    );
}

export function submitCartQuoteRequest(input: {
    accountId?: string;
    customerName: string;
    companyName?: string;
    phone: string;
    email: string;
    note?: string;
    items: Array<{
        sku: string;
        title: string;
        qty: number;
        unitGrossEur: number;
    }>;
}): CartCustomQuoteRequest {
    const store = loadStore();
    const seq = String(store.cartQuoteRequests.length + 1).padStart(4, '0');
    const totalGrossEur = round2(
        input.items.reduce((sum, i) => sum + i.unitGrossEur * i.qty, 0),
    );
    const totalNetEur = round2(totalGrossEur / 1.21);

    const reqRecord: CartCustomQuoteRequest = {
        id: `krp-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        requestNumber: `KRP-${seq}`,
        accountId: input.accountId,
        customerName: input.customerName.trim(),
        companyName: (input.companyName || input.customerName).trim(),
        phone: input.phone.trim(),
        email: input.email.trim().toLowerCase(),
        note: (input.note || 'Prašoma individualios projekto / krepšelio nuolaidos').trim(),
        items: input.items,
        totalGrossEur,
        totalNetEur,
        status: 'NAUJA_UZKLAUSA',
        createdAt: new Date().toISOString(),
    };

    store.cartQuoteRequests = [reqRecord, ...store.cartQuoteRequests];
    saveStore(store);
    return reqRecord;
}

export function listCartQuoteRequests(): CartCustomQuoteRequest[] {
    return [...loadStore().cartQuoteRequests];
}

export function updateGlobalSalesGrowthRules(patch: {
    globalVolumeTiers?: B2BCartVolumeTier[];
    globalQuantityTiers?: B2BQuantityDiscountTier[];
}): {
    globalVolumeTiers: B2BCartVolumeTier[];
    globalQuantityTiers: B2BQuantityDiscountTier[];
} {
    const store = loadStore();
    if (Array.isArray(patch.globalVolumeTiers) && patch.globalVolumeTiers.length > 0) {
        store.globalVolumeTiers = patch.globalVolumeTiers;
    }
    if (Array.isArray(patch.globalQuantityTiers) && patch.globalQuantityTiers.length > 0) {
        store.globalQuantityTiers = patch.globalQuantityTiers;
    }
    saveStore(store);
    return {
        globalVolumeTiers: store.globalVolumeTiers,
        globalQuantityTiers: store.globalQuantityTiers,
    };
}

const CRM_MONTH_LABELS_12: readonly string[] = [
    '2025-11',
    '2025-12',
    '2026-01',
    '2026-02',
    '2026-03',
    '2026-04',
    '2026-05',
    '2026-06',
    '2026-07',
    '2026-08',
    '2026-09',
    '2026-10',
];

export function upsertB2BCustomerProject(
    accountId: string,
    input: {
        id?: string;
        title: string;
        location?: string;
        status?: B2BCustomerProjectStatus;
        budgetEur?: number;
        orderedEur?: number;
        discountAppliedPct?: number;
    },
): B2BCustomerProject {
    const existingRule = getCustomerPricingRule(accountId) || upsertCustomerPricingRule(accountId, {});
    const currentProjects = existingRule.projects || [];
    const targetId = input.id || `proj-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const existingIdx = currentProjects.findIndex((p) => p.id === targetId);
    const prev = existingIdx >= 0 ? currentProjects[existingIdx] : undefined;

    const validStatuses: B2BCustomerProjectStatus[] = ['planning', 'quoted', 'active', 'completed'];
    const status: B2BCustomerProjectStatus =
        input.status && validStatuses.includes(input.status)
            ? input.status
            : prev?.status || 'active';

    const record: B2BCustomerProject = {
        id: targetId,
        title: (input.title || prev?.title || 'ŠVOK ir katilinės objektas').trim(),
        location: (input.location || prev?.location || 'Eigulių g. 21, LT-51418 Kaunas').trim(),
        status,
        budgetEur: round2(Math.max(0, Number(input.budgetEur ?? prev?.budgetEur ?? 0))),
        orderedEur: round2(Math.max(0, Number(input.orderedEur ?? prev?.orderedEur ?? 0))),
        discountAppliedPct: round2(
            Math.max(0, Number(input.discountAppliedPct ?? prev?.discountAppliedPct ?? 35)),
        ),
        updatedAt: new Date().toISOString(),
    };

    const nextProjects =
        existingIdx >= 0
            ? currentProjects.map((p, idx) => (idx === existingIdx ? record : p))
            : [record, ...currentProjects];

    upsertCustomerPricingRule(accountId, { projects: nextProjects });
    return record;
}

export function deleteB2BCustomerProject(accountId: string, projectId: string): boolean {
    const existingRule = getCustomerPricingRule(accountId);
    if (!existingRule || !Array.isArray(existingRule.projects)) return false;
    const before = existingRule.projects.length;
    const nextProjects = existingRule.projects.filter((p) => p.id !== projectId);
    upsertCustomerPricingRule(accountId, { projects: nextProjects });
    return nextProjects.length < before;
}

export function addB2BCustomerNote(
    accountId: string,
    input: {
        author?: string;
        tag?: B2BCustomerNoteTag;
        text: string;
    },
): B2BCustomerNote {
    const existingRule = getCustomerPricingRule(accountId) || upsertCustomerPricingRule(accountId, {});
    const currentNotes = existingRule.notes || [];
    const validTags: B2BCustomerNoteTag[] = [
        'skambutis',
        'susitikimas',
        'kainodara',
        'objektas',
        'buhalterija',
    ];
    const tag: B2BCustomerNoteTag =
        input.tag && validTags.includes(input.tag) ? input.tag : 'kainodara';

    const note: B2BCustomerNote = {
        id: `note-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        author: (input.author || 'Darius Šauklys').trim(),
        tag,
        text: (input.text || '').trim(),
        createdAt: new Date().toISOString(),
    };

    upsertCustomerPricingRule(accountId, {
        notes: [note, ...currentNotes],
    });
    return note;
}

export function deleteB2BCustomerNote(accountId: string, noteId: string): boolean {
    const existingRule = getCustomerPricingRule(accountId);
    if (!existingRule || !Array.isArray(existingRule.notes)) return false;
    const before = existingRule.notes.length;
    const nextNotes = existingRule.notes.filter((n) => n.id !== noteId);
    upsertCustomerPricingRule(accountId, { notes: nextNotes });
    return nextNotes.length < before;
}

export function getGrantedDiscountsSummary(
    accountId: string,
    totalDiscountsGrantedEur = 0,
): B2BGrantedDiscountsSummary {
    const store = loadStore();
    const account = listB2BPartnerAccounts().find((a) => a.id === accountId);
    const rule = store.customerRules[accountId];
    const tierSegment: B2BCustomerTierSegment = rule?.tierSegment || 'Montuotojas';
    const baseDiscountPct = account?.defaultDiscountPercent ?? 35;

    const activeBrandDiscounts = Object.entries(rule?.brandDiscounts || {})
        .filter(([, pct]) => typeof pct === 'number' && pct > 0)
        .map(([brand, discountPct]) => ({
            brand,
            discountPct,
            label: `${brand} -${discountPct}%`,
        }));

    const activeCategoryDiscounts = Object.entries(rule?.categoryDiscounts || {})
        .filter(([, pct]) => typeof pct === 'number' && pct > 0)
        .map(([category, discountPct]) => ({
            category,
            discountPct,
            label: `${category} -${discountPct}%`,
        }));

    const skuOverridesCount = rule?.skuOverrides?.length || 0;
    const skuOverridesLabel =
        skuOverridesCount > 0
            ? `${skuOverridesCount} spec. prekių su individualia kaina`
            : '0 spec. prekių su individualia kaina';

    const extraCartDiscountPct = rule?.cartDiscountRules?.extraCartDiscountPct ?? 0;
    const extraCartFixedEur = rule?.cartDiscountRules?.extraCartFixedEur ?? 0;
    const volumeTiersCount =
        rule?.cartDiscountRules?.volumeTiers?.length || store.globalVolumeTiers.length;

    const wholeCartSummaryLabel = `Papildoma krepšelio nuolaida -${extraCartDiscountPct}%${
        extraCartFixedEur > 0 ? ` (-${extraCartFixedEur} €)` : ''
    } + ${volumeTiersCount} apimties laipteliai`;

    return {
        tierSegment,
        baseDiscountPct,
        activeBrandDiscounts,
        activeCategoryDiscounts,
        skuOverridesCount,
        skuOverridesLabel,
        extraCartDiscountPct,
        extraCartFixedEur,
        wholeCartSummaryLabel,
        totalDiscountsGrantedEur: round2(totalDiscountsGrantedEur),
    };
}

function classifyInvoiceLineCategory(title: string, sku: string): B2BCrmCategoryBucket {
    const hay = `${title} ${sku}`.toLowerCase();
    if (hay.includes('siurb') || hay.includes('haier') || hay.includes('monoblock')) {
        return 'Šilumos siurbliai';
    }
    if (hay.includes('termostat') || hay.includes('danfoss') || hay.includes('vožtuv') || hay.includes('galvut')) {
        return 'Termostatika';
    }
    if (hay.includes('radiator') || hay.includes('pol.')) {
        return 'Radiatoriai';
    }
    if (hay.includes('boiler') || hay.includes('talp') || hay.includes('vandens') || hay.includes('dražice') || hay.includes('gorenje')) {
        return 'Talpos';
    }
    return 'Katilai';
}

export function getCustomerPurchaseStats(accountId: string): B2BCustomerPurchaseStats {
    const store = loadStore();
    const account = listB2BPartnerAccounts().find((a) => a.id === accountId);
    const rule = store.customerRules[accountId];
    const baseDiscountPct = account?.defaultDiscountPercent ?? 35;

    const invoices = readServerInvoices().filter((inv) => {
        if (inv.paymentStatus === 'ANULIUOTA') return false;
        if (!account) return false;
        const matchCode =
            account.companyCode &&
            inv.buyerCompanyCode &&
            inv.buyerCompanyCode.trim() === account.companyCode.trim();
        const matchName =
            account.companyName &&
            inv.buyerName &&
            inv.buyerName.toLowerCase().includes(account.companyName.toLowerCase());
        return Boolean(matchCode || matchName);
    });

    const projects = (rule?.projects || []).filter((p) => p.orderedEur > 0);
    const offers = store.individualOffers.filter(
        (o) => o.accountId === accountId && o.status !== 'PASIBAIGĘS',
    );

    const categoryBreakdown: Record<B2BCrmCategoryBucket, number> = {
        Katilai: 0,
        'Šilumos siurbliai': 0,
        Termostatika: 0,
        Radiatoriai: 0,
        Talpos: 0,
    };

    const monthlyMap = new Map<string, { purchasedEur: number; discountEur: number; marginEur: number }>();
    for (const m of CRM_MONTH_LABELS_12) {
        monthlyMap.set(m, { purchasedEur: 0, discountEur: 0, marginEur: 0 });
    }

    let totalPurchasedEur = 0;
    let totalDiscountsGrantedEur = 0;
    let netMarginEur = 0;
    let ordersCount = 0;

    for (const inv of invoices) {
        ordersCount += 1;
        const net = round2(inv.totalNetEur);
        totalPurchasedEur = round2(totalPurchasedEur + net);

        let invDiscount = 0;
        let invCost = 0;
        for (const line of inv.lines) {
            const lineNet = round2(line.unitNetEur * line.qty);
            const discPct = line.discountPercent && line.discountPercent > 0 ? line.discountPercent : baseDiscountPct;
            const listEquivalent = discPct > 0 && discPct < 90 ? lineNet / (1 - discPct / 100) : lineNet;
            invDiscount += Math.max(0, listEquivalent - lineNet);
            invCost += (line.costNetEur || line.unitNetEur * 0.68) * line.qty;

            const bucket = classifyInvoiceLineCategory(line.title, line.sku);
            categoryBreakdown[bucket] = round2(categoryBreakdown[bucket] + lineNet);
        }

        const cleanDiscount = round2(invDiscount);
        const cleanMargin = round2(Math.max(0, net - invCost));
        totalDiscountsGrantedEur = round2(totalDiscountsGrantedEur + cleanDiscount);
        netMarginEur = round2(netMarginEur + cleanMargin);

        const monthKey = (inv.issueDate || '').slice(0, 7);
        const targetMonth = monthlyMap.has(monthKey) ? monthKey : CRM_MONTH_LABELS_12[CRM_MONTH_LABELS_12.length - 1]!;
        const slot = monthlyMap.get(targetMonth)!;
        slot.purchasedEur = round2(slot.purchasedEur + net);
        slot.discountEur = round2(slot.discountEur + cleanDiscount);
        slot.marginEur = round2(slot.marginEur + cleanMargin);
    }

    for (const proj of projects) {
        ordersCount += 1;
        const ordered = round2(proj.orderedEur);
        const discPct = proj.discountAppliedPct > 0 ? proj.discountAppliedPct : baseDiscountPct;
        const retailEquiv = discPct > 0 && discPct < 90 ? ordered / (1 - discPct / 100) : ordered;
        const granted = round2(Math.max(0, retailEquiv - ordered));
        const margin = round2(ordered * 0.24);

        totalPurchasedEur = round2(totalPurchasedEur + ordered);
        totalDiscountsGrantedEur = round2(totalDiscountsGrantedEur + granted);
        netMarginEur = round2(netMarginEur + margin);

        const bucket = classifyInvoiceLineCategory(proj.title, '');
        categoryBreakdown[bucket] = round2(categoryBreakdown[bucket] + ordered);

        const monthKey = (proj.updatedAt || '').slice(0, 7);
        const targetMonth = monthlyMap.has(monthKey) ? monthKey : CRM_MONTH_LABELS_12[CRM_MONTH_LABELS_12.length - 1]!;
        const slot = monthlyMap.get(targetMonth)!;
        slot.purchasedEur = round2(slot.purchasedEur + ordered);
        slot.discountEur = round2(slot.discountEur + granted);
        slot.marginEur = round2(slot.marginEur + margin);
    }

    if (ordersCount === 0 && offers.length > 0) {
        for (const ofr of offers) {
            ordersCount += 1;
            const net = round2(ofr.finalNetEur);
            const retailSum = round2(
                ofr.items.reduce((s, item) => s + item.retailNetEur * item.qty, 0),
            );
            const granted = round2(Math.max(0, retailSum - net));
            const margin = round2(net * 0.22);

            totalPurchasedEur = round2(totalPurchasedEur + net);
            totalDiscountsGrantedEur = round2(totalDiscountsGrantedEur + granted);
            netMarginEur = round2(netMarginEur + margin);

            const bucket = classifyInvoiceLineCategory(ofr.title, ofr.items[0]?.sku || '');
            categoryBreakdown[bucket] = round2(categoryBreakdown[bucket] + net);

            const monthKey = (ofr.createdAt || '').slice(0, 7);
            const targetMonth = monthlyMap.has(monthKey) ? monthKey : CRM_MONTH_LABELS_12[CRM_MONTH_LABELS_12.length - 1]!;
            const slot = monthlyMap.get(targetMonth)!;
            slot.purchasedEur = round2(slot.purchasedEur + net);
            slot.discountEur = round2(slot.discountEur + granted);
            slot.marginEur = round2(slot.marginEur + margin);
        }
    }

    const avgOrderEur = ordersCount > 0 ? round2(totalPurchasedEur / ordersCount) : 0;
    const listTotalEur = totalPurchasedEur + totalDiscountsGrantedEur;
    const effectiveDiscountPct =
        listTotalEur > 0 ? round2((totalDiscountsGrantedEur / listTotalEur) * 100) : baseDiscountPct;
    const netMarginPct =
        totalPurchasedEur > 0 ? round2((netMarginEur / totalPurchasedEur) * 100) : 0;

    const monthlyHistory: B2BMonthlyPurchaseRecord[] = CRM_MONTH_LABELS_12.map((month) => ({
        month,
        ...(monthlyMap.get(month) || { purchasedEur: 0, discountEur: 0, marginEur: 0 }),
    }));

    const creditSummary = getCustomerCreditLedger(accountId);

    return {
        totalPurchasedEur,
        ordersCount,
        avgOrderEur,
        totalDiscountsGrantedEur,
        effectiveDiscountPct,
        netMarginEur,
        netMarginPct,
        creditLimitEur: creditSummary.creditConfig.creditLimitEur,
        creditUsedEur: creditSummary.creditLedgerSummary.creditUsedEur,
        monthlyHistory,
        categoryBreakdown,
    };
}

export function getCustomerCreditLedger(accountId: string): {
    creditConfig: B2BCreditConfig;
    creditLedgerSummary: B2BCreditLedgerSummary;
    clientInvoices: B2BClientInvoiceRecord[];
} {
    const store = loadStore();
    const account = listB2BPartnerAccounts().find((a) => a.id === accountId);
    const rule = store.customerRules[accountId];

    const creditConfig: B2BCreditConfig = {
        creditLimitEur:
            typeof rule?.creditConfig?.creditLimitEur === 'number'
                ? rule.creditConfig.creditLimitEur
                : account?.creditLimitEur ?? 10000,
        paymentTermDays:
            typeof rule?.creditConfig?.paymentTermDays === 'number'
                ? rule.creditConfig.paymentTermDays
                : account?.paymentTermsDays ?? 14,
        autoReminderThresholdPct:
            typeof rule?.creditConfig?.autoReminderThresholdPct === 'number'
                ? rule.creditConfig.autoReminderThresholdPct
                : 80,
        autoDueSoonReminderDays:
            typeof rule?.creditConfig?.autoDueSoonReminderDays === 'number'
                ? rule.creditConfig.autoDueSoonReminderDays
                : 3,
        autoRemindersEnabled:
            typeof rule?.creditConfig?.autoRemindersEnabled === 'boolean'
                ? rule.creditConfig.autoRemindersEnabled
                : true,
        creditHoldOnExceed:
            typeof rule?.creditConfig?.creditHoldOnExceed === 'boolean'
                ? rule.creditConfig.creditHoldOnExceed
                : true,
    };

    const clientInvoices: B2BClientInvoiceRecord[] = [...(rule?.clientInvoices || [])];

    let paidInvoicesTotalEur = 0;
    let paidInvoicesCount = 0;
    let unpaidInvoicesTotalEur = 0;
    let unpaidInvoicesCount = 0;
    let overdueInvoicesTotalEur = 0;
    let overdueInvoicesCount = 0;
    let maxOverdueDays = 0;

    for (const inv of clientInvoices) {
        const amt = round2(Math.max(0, Number(inv.amountEur) || 0));
        const paidAmt = round2(Math.max(0, Number(inv.paidAmountEur) || 0));
        const outstanding = round2(Math.max(0, amt - paidAmt));

        if (inv.status === 'paid' || outstanding <= 0) {
            paidInvoicesTotalEur = round2(paidInvoicesTotalEur + (paidAmt > 0 ? paidAmt : amt));
            paidInvoicesCount += 1;
        } else if (inv.status === 'overdue') {
            overdueInvoicesTotalEur = round2(overdueInvoicesTotalEur + outstanding);
            overdueInvoicesCount += 1;
            if (paidAmt > 0) {
                paidInvoicesTotalEur = round2(paidInvoicesTotalEur + paidAmt);
            }
            const dueMs = Date.parse(inv.dueDate || '');
            const daysLate = !Number.isNaN(dueMs)
                ? Math.max(1, Math.round((Date.now() - dueMs) / (1000 * 60 * 60 * 24)))
                : 7;
            if (daysLate > maxOverdueDays) maxOverdueDays = daysLate;
        } else {
            unpaidInvoicesTotalEur = round2(unpaidInvoicesTotalEur + outstanding);
            unpaidInvoicesCount += 1;
            if (paidAmt > 0) {
                paidInvoicesTotalEur = round2(paidInvoicesTotalEur + paidAmt);
            }
        }
    }

    const creditUsedEur =
        clientInvoices.length > 0
            ? round2(unpaidInvoicesTotalEur + overdueInvoicesTotalEur)
            : round2(account?.creditUsedEur ?? 0);

    const creditRemainingEur = round2(Math.max(0, creditConfig.creditLimitEur - creditUsedEur));
    const creditUtilizationPct =
        creditConfig.creditLimitEur > 0
            ? round2((creditUsedEur / creditConfig.creditLimitEur) * 100)
            : 0;

    let creditStatus: B2BCreditStatus = 'HEALTHY';
    if (overdueInvoicesCount > 0) {
        creditStatus = 'OVERDUE_HOLD';
    } else if (creditUtilizationPct > 100) {
        creditStatus = 'LIMIT_EXCEEDED';
    } else if (creditUtilizationPct >= creditConfig.autoReminderThresholdPct) {
        creditStatus = 'APPROACHING_LIMIT';
    }

    const creditLedgerSummary: B2BCreditLedgerSummary = {
        creditLimitEur: creditConfig.creditLimitEur,
        creditUsedEur,
        creditRemainingEur,
        creditUtilizationPct,
        creditStatus,
        paidInvoicesTotalEur,
        paidInvoicesCount,
        unpaidInvoicesTotalEur,
        unpaidInvoicesCount,
        overdueInvoicesTotalEur,
        overdueInvoicesCount,
        maxOverdueDays,
        invoices: clientInvoices,
    };

    return {
        creditConfig,
        creditLedgerSummary,
        clientInvoices,
    };
}

export function updateB2BCreditTerms(
    accountId: string,
    patch: Partial<B2BCreditConfig>,
): {
    account: B2BPartnerAccount | null;
    creditConfig: B2BCreditConfig;
    creditLedgerSummary: B2BCreditLedgerSummary;
} {
    const accounts = listB2BPartnerAccounts();
    const idx = accounts.findIndex((a) => a.id === accountId);
    let updatedAccount: B2BPartnerAccount | null = null;

    if (idx >= 0) {
        const current = accounts[idx]!;
        updatedAccount = {
            ...current,
            creditLimitEur:
                typeof patch.creditLimitEur === 'number'
                    ? Math.max(0, round2(patch.creditLimitEur))
                    : current.creditLimitEur,
            paymentTermsDays:
                typeof patch.paymentTermDays === 'number'
                    ? Math.max(0, Math.round(patch.paymentTermDays))
                    : current.paymentTermsDays,
        };
        const nextAccounts = accounts.map((a, i) => (i === idx ? updatedAccount! : a));
        resetB2BAccountsCache(nextAccounts);
    }

    upsertCustomerPricingRule(accountId, {
        creditConfig: patch,
    });

    const { creditConfig, creditLedgerSummary } = getCustomerCreditLedger(accountId);
    return {
        account: updatedAccount,
        creditConfig,
        creditLedgerSummary,
    };
}

export function recordB2BInvoiceOrPayment(
    accountId: string,
    input: {
        invoiceId?: string;
        markPaid?: boolean;
        paidAmountEur?: number;
        status?: B2BCreditInvoiceStatus;
        invoice?: Partial<B2BClientInvoiceRecord>;
    },
): {
    invoice: B2BClientInvoiceRecord;
    creditLedgerSummary: B2BCreditLedgerSummary;
} {
    const existingRule =
        getCustomerPricingRule(accountId) || upsertCustomerPricingRule(accountId, {});
    const currentInvoices = [...(existingRule.clientInvoices || [])];
    const paymentTermDays = existingRule.creditConfig?.paymentTermDays ?? 30;

    let targetRecord: B2BClientInvoiceRecord;

    if (input.invoiceId) {
        const idx = currentInvoices.findIndex(
            (i) => i.id === input.invoiceId || i.invoiceNumber === input.invoiceId,
        );
        if (idx >= 0) {
            const prev = currentInvoices[idx]!;
            const nextPaidAmount = input.markPaid
                ? prev.amountEur
                : typeof input.paidAmountEur === 'number'
                  ? round2(Math.min(prev.amountEur, Math.max(0, input.paidAmountEur)))
                  : prev.paidAmountEur;
            const nextStatus: B2BCreditInvoiceStatus =
                input.markPaid || nextPaidAmount >= prev.amountEur
                    ? 'paid'
                    : input.status || prev.status;
            targetRecord = {
                ...prev,
                paidAmountEur: nextPaidAmount,
                status: nextStatus,
                paidAt:
                    nextStatus === 'paid'
                        ? prev.paidAt || new Date().toISOString().slice(0, 10)
                        : prev.paidAt,
            };
            currentInvoices[idx] = targetRecord;
        } else {
            const amt = round2(Number(input.invoice?.amountEur || 1000));
            targetRecord = {
                id: input.invoiceId,
                invoiceNumber: input.invoice?.invoiceNumber || input.invoiceId,
                issuedAt: input.invoice?.issuedAt || new Date().toISOString().slice(0, 10),
                dueDate: input.invoice?.dueDate || new Date().toISOString().slice(0, 10),
                amountEur: amt,
                paidAmountEur: input.markPaid ? amt : 0,
                status: input.markPaid ? 'paid' : 'unpaid_deferred',
                paidAt: input.markPaid ? new Date().toISOString().slice(0, 10) : undefined,
                projectTitle: input.invoice?.projectTitle,
            };
            currentInvoices.unshift(targetRecord);
        }
    } else {
        const invInput = input.invoice || {};
        const issuedAt = invInput.issuedAt || new Date().toISOString().slice(0, 10);
        const defaultDueMs =
            Date.parse(issuedAt) + Math.max(0, paymentTermDays) * 24 * 60 * 60 * 1000;
        const defaultDueDate = !Number.isNaN(defaultDueMs)
            ? new Date(defaultDueMs).toISOString().slice(0, 10)
            : issuedAt;
        const amountEur = round2(Math.max(0, Number(invInput.amountEur) || 0));
        const status: B2BCreditInvoiceStatus =
            invInput.status === 'paid' || invInput.status === 'overdue'
                ? invInput.status
                : 'unpaid_deferred';
        const paidAmountEur =
            status === 'paid'
                ? amountEur
                : round2(
                      Math.min(
                          amountEur,
                          Math.max(0, Number(invInput.paidAmountEur ?? input.paidAmountEur ?? 0)),
                      ),
                  );

        targetRecord = {
            id: invInput.id || `b2b-inv-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            invoiceNumber:
                (invInput.invoiceNumber || '').trim() ||
                `GILE-2026-${String(currentInvoices.length + 101).padStart(4, '0')}`,
            issuedAt,
            dueDate: invInput.dueDate || defaultDueDate,
            amountEur,
            paidAmountEur,
            status: paidAmountEur >= amountEur && amountEur > 0 ? 'paid' : status,
            paidAt:
                paidAmountEur >= amountEur && amountEur > 0
                    ? invInput.paidAt || new Date().toISOString().slice(0, 10)
                    : invInput.paidAt,
            projectTitle: invInput.projectTitle,
        };

        const existingIdx = currentInvoices.findIndex(
            (i) =>
                i.id === targetRecord.id || i.invoiceNumber === targetRecord.invoiceNumber,
        );
        if (existingIdx >= 0) {
            currentInvoices[existingIdx] = targetRecord;
        } else {
            currentInvoices.unshift(targetRecord);
        }
    }

    upsertCustomerPricingRule(accountId, {
        clientInvoices: currentInvoices,
    });

    const { creditLedgerSummary } = getCustomerCreditLedger(accountId);

    // Sync creditUsedEur on account in b2b-accounts cache
    const accounts = listB2BPartnerAccounts();
    const accIdx = accounts.findIndex((a) => a.id === accountId);
    if (accIdx >= 0) {
        const nextAccounts = accounts.map((a, i) =>
            i === accIdx ? { ...a, creditUsedEur: creditLedgerSummary.creditUsedEur } : a,
        );
        resetB2BAccountsCache(nextAccounts);
    }

    return {
        invoice: targetRecord,
        creditLedgerSummary,
    };
}

export function sendB2BCreditReminder(input: {
    accountId: string;
    companyName?: string;
    type?: B2BCreditReminderType;
    channel?: 'email_and_portal';
    triggeredBy?: B2BCreditReminderTrigger;
    customMessage?: string;
}): B2BCreditReminderRecord {
    const store = loadStore();
    const account = listB2BPartnerAccounts().find((a) => a.id === input.accountId);
    const { creditConfig, creditLedgerSummary } = getCustomerCreditLedger(input.accountId);
    const companyName =
        input.companyName || account?.companyName || `B2B klientas (${input.accountId})`;

    const type: B2BCreditReminderType =
        input.type ||
        (creditLedgerSummary.overdueInvoicesCount > 0
            ? 'overdue_invoice'
            : creditLedgerSummary.creditUtilizationPct > 100
              ? 'limit_exceeded'
              : 'approaching_limit');

    const defaultMessage =
        type === 'overdue_invoice'
            ? `Gerb. ${companyName}, primename apie vėluojančią apmokėti PVM sąskaitą faktūrą (${creditLedgerSummary.overdueInvoicesTotalEur.toLocaleString('lt-LT')} €). Prašome apmokėti, kad būtų atnaujintas ${creditConfig.paymentTermDays} d. mokėjimo atidėjimas.`
            : type === 'limit_exceeded'
              ? `Dėmesio: ${companyName} viršijo suteiktą ${creditLedgerSummary.creditLimitEur.toLocaleString('lt-LT')} € kredito limitą (sunaudota ${creditLedgerSummary.creditUsedEur.toLocaleString('lt-LT')} € · ${creditLedgerSummary.creditUtilizationPct}%).`
              : type === 'due_soon'
                ? `Priminimas ${companyName}: artėja sąskaitos su ${creditConfig.paymentTermDays} d. atidėjimu apmokėjimo terminas. Laisvas kredito limitas: ${creditLedgerSummary.creditRemainingEur.toLocaleString('lt-LT')} €.`
                : `Automatinis įspėjimas ${companyName}: išnaudota ${creditLedgerSummary.creditUtilizationPct}% suteikto kredito limito (${creditLedgerSummary.creditUsedEur.toLocaleString('lt-LT')} € iš ${creditLedgerSummary.creditLimitEur.toLocaleString('lt-LT')} €, slenkstis ≥${creditConfig.autoReminderThresholdPct}%).`;

    const reminder: B2BCreditReminderRecord = {
        id: `rem-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        accountId: input.accountId,
        companyName,
        type,
        channel: input.channel || 'email_and_portal',
        utilizationPct: creditLedgerSummary.creditUtilizationPct,
        usedEur: creditLedgerSummary.creditUsedEur,
        limitEur: creditLedgerSummary.creditLimitEur,
        message: (input.customMessage || defaultMessage).trim(),
        triggeredBy: input.triggeredBy || 'manual_darius',
        sentAt: new Date().toISOString(),
    };

    store.creditRemindersLog = [reminder, ...store.creditRemindersLog];
    saveStore(store);
    return reminder;
}

export function runAutoCreditRemindersSweep(options?: {
    triggeredBy?: B2BCreditReminderTrigger;
}): {
    sweptCount: number;
    generatedReminders: B2BCreditReminderRecord[];
    creditRemindersLog: B2BCreditReminderRecord[];
} {
    const accounts = listB2BPartnerAccounts();
    const generated: B2BCreditReminderRecord[] = [];
    const trigger: B2BCreditReminderTrigger = options?.triggeredBy || 'auto_threshold';

    for (const acc of accounts) {
        const { creditConfig, creditLedgerSummary } = getCustomerCreditLedger(acc.id);
        if (!creditConfig.autoRemindersEnabled) continue;

        if (creditLedgerSummary.overdueInvoicesCount > 0) {
            generated.push(
                sendB2BCreditReminder({
                    accountId: acc.id,
                    companyName: acc.companyName,
                    type: 'overdue_invoice',
                    triggeredBy: trigger,
                }),
            );
        } else if (creditLedgerSummary.creditUtilizationPct > 100) {
            generated.push(
                sendB2BCreditReminder({
                    accountId: acc.id,
                    companyName: acc.companyName,
                    type: 'limit_exceeded',
                    triggeredBy: trigger,
                }),
            );
        } else if (
            creditLedgerSummary.creditUtilizationPct >= creditConfig.autoReminderThresholdPct
        ) {
            generated.push(
                sendB2BCreditReminder({
                    accountId: acc.id,
                    companyName: acc.companyName,
                    type: 'approaching_limit',
                    triggeredBy: trigger,
                }),
            );
        }
    }

    const store = loadStore();
    return {
        sweptCount: accounts.length,
        generatedReminders: generated,
        creditRemindersLog: store.creditRemindersLog,
    };
}

export function getB2BCustomer360(accountId: string): B2BCustomer360Summary | null {
    const account = listB2BPartnerAccounts().find((a) => a.id === accountId);
    if (!account) return null;
    const store = loadStore();
    const rule = store.customerRules[accountId];
    const purchaseStats = getCustomerPurchaseStats(accountId);
    const { creditConfig, creditLedgerSummary, clientInvoices } = getCustomerCreditLedger(accountId);
    const grantedDiscountsSummary = getGrantedDiscountsSummary(
        accountId,
        purchaseStats.totalDiscountsGrantedEur,
    );
    const projects = rule?.projects || [];
    const notes = rule?.notes || [];

    return {
        accountId: account.id,
        companyName: account.companyName,
        companyCode: account.companyCode,
        vatCode: account.vatCode,
        contactPerson: account.contactPerson,
        email: account.email,
        phone: account.phone,
        city: account.city,
        status: account.status,
        tierSegment: rule?.tierSegment || 'Montuotojas',
        assignedManager: rule?.assignedManager || 'Darius Šauklys',
        paymentTermsDays: creditConfig.paymentTermDays,
        creditConfig,
        creditLedgerSummary,
        clientInvoices,
        purchaseStats,
        monthlyPurchases: purchaseStats.monthlyHistory,
        grantedDiscountsSummary,
        projects,
        notes,
        latestNote: notes[0] || null,
    };
}

export function getB2BCrmAnalyticsSnapshot(options?: {
    previewSimulation?: boolean;
}): B2BCrmAnalyticsSnapshot {
    const accounts = listB2BPartnerAccounts();
    const customers = accounts
        .map((a) => getB2BCustomer360(a.id))
        .filter((c): c is B2BCustomer360Summary => Boolean(c));

    if (options?.previewSimulation && customers.length === 0) {
        const simMonthly: B2BMonthlyPurchaseRecord[] = CRM_MONTH_LABELS_12.map((month, idx) => {
            const purchasedEur = round2(14200 + idx * 2650 + (idx % 3) * 1800);
            const discountEur = round2(purchasedEur * 0.38);
            const marginEur = round2(purchasedEur * 0.24);
            return { month, purchasedEur, discountEur, marginEur };
        });

        const simKaunoInvoices: B2BClientInvoiceRecord[] = [
            {
                id: 'sim-inv-1',
                invoiceNumber: 'GILE-2026-0812',
                issuedAt: '2026-08-12',
                dueDate: '2026-09-11',
                amountEur: 18400,
                paidAmountEur: 18400,
                status: 'paid',
                paidAt: '2026-09-09',
                projectTitle: 'Eigulių g. 21 gamybinio korpuso 250 kW katilinės mazgas',
            },
            {
                id: 'sim-inv-2',
                invoiceNumber: 'GILE-2026-0904',
                issuedAt: '2026-09-04',
                dueDate: '2026-10-04',
                amountEur: 27950,
                paidAmountEur: 27950,
                status: 'paid',
                paidAt: '2026-10-02',
                projectTitle: 'Eigulių g. 21 gamybinio korpuso 250 kW katilinės mazgas',
            },
            {
                id: 'sim-inv-3',
                invoiceNumber: 'GILE-2026-1012',
                issuedAt: '2026-10-12',
                dueDate: '2026-11-11',
                amountEur: 22400,
                paidAmountEur: 0,
                status: 'unpaid_deferred',
                projectTitle: 'Eigulių g. 21 gamybinio korpuso 250 kW katilinės mazgas',
            },
            {
                id: 'sim-inv-4',
                invoiceNumber: 'GILE-2026-1021',
                issuedAt: '2026-10-21',
                dueDate: '2026-11-20',
                amountEur: 15850,
                paidAmountEur: 0,
                status: 'unpaid_deferred',
                projectTitle: 'Žirmūnų g. 68 daugiabučio šilumos punkto atnaujinimas',
            },
        ];

        const simVilniausInvoices: B2BClientInvoiceRecord[] = [
            {
                id: 'sim-inv-5',
                invoiceNumber: 'GILE-2026-0819',
                issuedAt: '2026-08-19',
                dueDate: '2026-10-03',
                amountEur: 52000,
                paidAmountEur: 52000,
                status: 'paid',
                paidAt: '2026-10-01',
                projectTitle: 'Pramonės logistikos parko konteinerinė katilinė GK-500',
            },
            {
                id: 'sim-inv-6',
                invoiceNumber: 'GILE-2026-0905',
                issuedAt: '2026-09-05',
                dueDate: '2026-10-20',
                amountEur: 46000,
                paidAmountEur: 39600,
                status: 'overdue',
                projectTitle: 'Pramonės logistikos parko konteinerinė katilinė GK-500',
            },
            {
                id: 'sim-inv-7',
                invoiceNumber: 'GILE-2026-1018',
                issuedAt: '2026-10-18',
                dueDate: '2026-12-02',
                amountEur: 22000,
                paidAmountEur: 0,
                status: 'unpaid_deferred',
                projectTitle: 'Pramonės logistikos parko konteinerinė katilinė GK-500',
            },
        ];

        const simCustomers: B2BCustomer360Summary[] = [
            {
                accountId: 'sim-b2b-kauno-siluma',
                companyName: 'UAB „Kauno Šilumos Mazgai“ (Simuliacija)',
                companyCode: '304112233',
                vatCode: 'LT100009112233',
                contactPerson: 'Tomas Vaitkus',
                email: 'tomas@kaunosiluma.lt',
                phone: '+370 611 19158',
                city: 'Kaunas',
                status: 'APPROVED',
                tierSegment: 'ŠVOK Rangovas',
                assignedManager: 'Darius Šauklys',
                paymentTermsDays: 30,
                creditConfig: {
                    creditLimitEur: 45000,
                    paymentTermDays: 30,
                    autoReminderThresholdPct: 80,
                    autoDueSoonReminderDays: 3,
                    autoRemindersEnabled: true,
                    creditHoldOnExceed: true,
                },
                creditLedgerSummary: {
                    creditLimitEur: 45000,
                    creditUsedEur: 38250,
                    creditRemainingEur: 6750,
                    creditUtilizationPct: 85,
                    creditStatus: 'APPROACHING_LIMIT',
                    paidInvoicesTotalEur: 46350,
                    paidInvoicesCount: 2,
                    unpaidInvoicesTotalEur: 38250,
                    unpaidInvoicesCount: 2,
                    overdueInvoicesTotalEur: 0,
                    overdueInvoicesCount: 0,
                    maxOverdueDays: 0,
                    invoices: simKaunoInvoices,
                },
                clientInvoices: simKaunoInvoices,
                purchaseStats: {
                    totalPurchasedEur: 84600,
                    ordersCount: 14,
                    avgOrderEur: 6042.86,
                    totalDiscountsGrantedEur: 36800,
                    effectiveDiscountPct: 43.5,
                    netMarginEur: 20304,
                    netMarginPct: 24,
                    creditLimitEur: 45000,
                    creditUsedEur: 38250,
                    monthlyHistory: simMonthly,
                    categoryBreakdown: {
                        Katilai: 34200,
                        'Šilumos siurbliai': 24800,
                        Termostatika: 11200,
                        Radiatoriai: 8400,
                        Talpos: 6000,
                    },
                },
                monthlyPurchases: simMonthly,
                grantedDiscountsSummary: {
                    tierSegment: 'ŠVOK Rangovas',
                    baseDiscountPct: 42,
                    activeBrandDiscounts: [
                        { brand: 'Danfoss', discountPct: 48, label: 'Danfoss -48%' },
                        { brand: 'Haier', discountPct: 40, label: 'Haier -40%' },
                        { brand: 'HERZ', discountPct: 50, label: 'HERZ -50%' },
                    ],
                    activeCategoryDiscounts: [
                        { category: 'Katilai', discountPct: 38, label: 'Katilai -38%' },
                    ],
                    skuOverridesCount: 4,
                    skuOverridesLabel: '4 spec. prekių su individualia kaina',
                    extraCartDiscountPct: 5,
                    extraCartFixedEur: 0,
                    wholeCartSummaryLabel: 'Papildoma krepšelio nuolaida -5% + 3 apimties laipteliai',
                    totalDiscountsGrantedEur: 36800,
                },
                projects: [
                    {
                        id: 'sim-proj-1',
                        title: 'Eigulių g. 21 gamybinio korpuso 250 kW katilinės mazgas',
                        location: 'Eigulių g. 21, LT-51418 Kaunas',
                        status: 'active',
                        budgetEur: 48000,
                        orderedEur: 36400,
                        discountAppliedPct: 44,
                        updatedAt: '2026-10-15T10:00:00.000Z',
                    },
                    {
                        id: 'sim-proj-2',
                        title: 'Žirmūnų g. 68 daugiabučio šilumos punkto atnaujinimas',
                        location: 'Žirmūnų g. 68, LT-09124 Vilnius',
                        status: 'quoted',
                        budgetEur: 29500,
                        orderedEur: 18200,
                        discountAppliedPct: 42,
                        updatedAt: '2026-10-20T14:30:00.000Z',
                    },
                ],
                notes: [
                    {
                        id: 'sim-note-1',
                        author: 'Darius Šauklys',
                        tag: 'kainodara',
                        text: 'Patvirtinta Danfoss -48% ir HERZ -50% matrica 2026–2027 m. šildymo sezonui.',
                        createdAt: '2026-10-21T09:15:00.000Z',
                    },
                    {
                        id: 'sim-note-2',
                        author: 'Darius Šauklys',
                        tag: 'objektas',
                        text: 'Eigulių g. 21 objekte pristatyti 2 vnt. MPB-NANI-50 degikliai ir Teplomix mazgai.',
                        createdAt: '2026-10-18T11:40:00.000Z',
                    },
                ],
                latestNote: {
                    id: 'sim-note-1',
                    author: 'Darius Šauklys',
                    tag: 'kainodara',
                    text: 'Patvirtinta Danfoss -48% ir HERZ -50% matrica 2026–2027 m. šildymo sezonui.',
                    createdAt: '2026-10-21T09:15:00.000Z',
                },
            },
            {
                accountId: 'sim-b2b-vilniaus-inzinerija',
                companyName: 'UAB „Šiaurės ŠVOK Projektai“ (Simuliacija)',
                companyCode: '305223344',
                vatCode: 'LT100012233445',
                contactPerson: 'Mantas Kazlauskas',
                email: 'mantas@siauresprojektai.lt',
                phone: '+370 612 44556',
                city: 'Vilnius',
                status: 'APPROVED',
                tierSegment: 'Regioninis Dileris',
                assignedManager: 'Darius Šauklys',
                paymentTermsDays: 45,
                creditConfig: {
                    creditLimitEur: 60000,
                    paymentTermDays: 45,
                    autoReminderThresholdPct: 80,
                    autoDueSoonReminderDays: 3,
                    autoRemindersEnabled: true,
                    creditHoldOnExceed: true,
                },
                creditLedgerSummary: {
                    creditLimitEur: 60000,
                    creditUsedEur: 28400,
                    creditRemainingEur: 31600,
                    creditUtilizationPct: 47.3,
                    creditStatus: 'OVERDUE_HOLD',
                    paidInvoicesTotalEur: 91600,
                    paidInvoicesCount: 1,
                    unpaidInvoicesTotalEur: 22000,
                    unpaidInvoicesCount: 1,
                    overdueInvoicesTotalEur: 6400,
                    overdueInvoicesCount: 1,
                    maxOverdueDays: 9,
                    invoices: simVilniausInvoices,
                },
                clientInvoices: simVilniausInvoices,
                purchaseStats: {
                    totalPurchasedEur: 126400,
                    ordersCount: 22,
                    avgOrderEur: 5745.45,
                    totalDiscountsGrantedEur: 58900,
                    effectiveDiscountPct: 48.2,
                    netMarginEur: 27808,
                    netMarginPct: 22,
                    creditLimitEur: 60000,
                    creditUsedEur: 28400,
                    monthlyHistory: simMonthly,
                    categoryBreakdown: {
                        Katilai: 52000,
                        'Šilumos siurbliai': 38400,
                        Termostatika: 16000,
                        Radiatoriai: 12000,
                        Talpos: 8000,
                    },
                },
                monthlyPurchases: simMonthly,
                grantedDiscountsSummary: {
                    tierSegment: 'Regioninis Dileris',
                    baseDiscountPct: 50,
                    activeBrandDiscounts: [
                        { brand: 'Danfoss', discountPct: 52, label: 'Danfoss -52%' },
                        { brand: 'Gilės / Megatherm', discountPct: 40, label: 'Gilės / Megatherm -40%' },
                    ],
                    activeCategoryDiscounts: [
                        { category: 'Šilumos siurbliai', discountPct: 44, label: 'Šilumos siurbliai -44%' },
                    ],
                    skuOverridesCount: 6,
                    skuOverridesLabel: '6 spec. prekių su individualia kaina',
                    extraCartDiscountPct: 6,
                    extraCartFixedEur: 50,
                    wholeCartSummaryLabel: 'Papildoma krepšelio nuolaida -6% (-50 €) + 3 apimties laipteliai',
                    totalDiscountsGrantedEur: 58900,
                },
                projects: [
                    {
                        id: 'sim-proj-3',
                        title: 'Pramonės logistikos parko konteinerinė katilinė GK-500',
                        location: 'Žirmūnų g. 68, LT-09124 Vilnius',
                        status: 'active',
                        budgetEur: 92000,
                        orderedEur: 68400,
                        discountAppliedPct: 49,
                        updatedAt: '2026-10-22T15:20:00.000Z',
                    },
                ],
                notes: [
                    {
                        id: 'sim-note-3',
                        author: 'Darius Šauklys',
                        tag: 'susitikimas',
                        text: 'Aptartas 2027 m. I ketvirčio konteinerinių katilinių GK-250 ir GK-500 užsakymų grafikas.',
                        createdAt: '2026-10-22T16:00:00.000Z',
                    },
                ],
                latestNote: {
                    id: 'sim-note-3',
                    author: 'Darius Šauklys',
                    tag: 'susitikimas',
                    text: 'Aptartas 2027 m. I ketvirčio konteinerinių katilinių GK-250 ir GK-500 užsakymų grafikas.',
                    createdAt: '2026-10-22T16:00:00.000Z',
                },
            },
        ];

        const simReminders: B2BCreditReminderRecord[] = [
            {
                id: 'sim-rem-1',
                accountId: 'sim-b2b-kauno-siluma',
                companyName: 'UAB „Kauno Šilumos Mazgai“ (Simuliacija)',
                type: 'approaching_limit',
                channel: 'email_and_portal',
                utilizationPct: 85,
                usedEur: 38250,
                limitEur: 45000,
                message:
                    'Automatinis įspėjimas: išnaudota 85% suteikto kredito limito (38 250 € iš 45 000 €, slenkstis ≥80%).',
                triggeredBy: 'auto_threshold',
                sentAt: '2026-10-24T08:30:00.000Z',
            },
            {
                id: 'sim-rem-2',
                accountId: 'sim-b2b-vilniaus-inzinerija',
                companyName: 'UAB „Šiaurės ŠVOK Projektai“ (Simuliacija)',
                type: 'overdue_invoice',
                channel: 'email_and_portal',
                utilizationPct: 47.3,
                usedEur: 28400,
                limitEur: 60000,
                message:
                    'Darius Šauklys išsiuntė priminimą dėl GILE-2026-0905 likučio (6 400 €, vėluoja 9 d.).',
                triggeredBy: 'manual_darius',
                sentAt: '2026-10-25T11:15:00.000Z',
            },
        ];

        return {
            totalCustomers: simCustomers.length,
            totalPurchasedEur: 211000,
            totalOrdersCount: 36,
            totalDiscountsGrantedEur: 95700,
            totalNetMarginEur: 48112,
            avgEffectiveDiscountPct: 45.9,
            activeProjectsCount: 3,
            totalNotesCount: 3,
            totalCreditLimitsEur: 105000,
            totalCreditUsedEur: 66650,
            totalPaidInvoicesEur: 137950,
            totalOverdueInvoicesEur: 6400,
            approachingLimitClientsCount: 1,
            overdueClientsCount: 1,
            creditRemindersLog: simReminders,
            monthlyHistory: simMonthly,
            customers: simCustomers,
        };
    }

    const store = loadStore();
    const monthlyTotals = CRM_MONTH_LABELS_12.map((month, idx) => {
        const purchasedEur = round2(
            customers.reduce((s, c) => s + (c.monthlyPurchases[idx]?.purchasedEur || 0), 0),
        );
        const discountEur = round2(
            customers.reduce((s, c) => s + (c.monthlyPurchases[idx]?.discountEur || 0), 0),
        );
        const marginEur = round2(
            customers.reduce((s, c) => s + (c.monthlyPurchases[idx]?.marginEur || 0), 0),
        );
        return { month, purchasedEur, discountEur, marginEur };
    });

    const totalPurchasedEur = round2(
        customers.reduce((s, c) => s + c.purchaseStats.totalPurchasedEur, 0),
    );
    const totalOrdersCount = customers.reduce((s, c) => s + c.purchaseStats.ordersCount, 0);
    const totalDiscountsGrantedEur = round2(
        customers.reduce((s, c) => s + c.purchaseStats.totalDiscountsGrantedEur, 0),
    );
    const totalNetMarginEur = round2(
        customers.reduce((s, c) => s + c.purchaseStats.netMarginEur, 0),
    );
    const avgEffectiveDiscountPct =
        customers.length > 0
            ? round2(
                  customers.reduce((s, c) => s + c.purchaseStats.effectiveDiscountPct, 0) /
                      customers.length,
              )
            : 0;
    const activeProjectsCount = customers.reduce(
        (s, c) => s + c.projects.filter((p) => p.status !== 'completed').length,
        0,
    );
    const totalNotesCount = customers.reduce((s, c) => s + c.notes.length, 0);

    const totalCreditLimitsEur = round2(
        customers.reduce((s, c) => s + c.creditLedgerSummary.creditLimitEur, 0),
    );
    const totalCreditUsedEur = round2(
        customers.reduce((s, c) => s + c.creditLedgerSummary.creditUsedEur, 0),
    );
    const totalPaidInvoicesEur = round2(
        customers.reduce((s, c) => s + c.creditLedgerSummary.paidInvoicesTotalEur, 0),
    );
    const totalOverdueInvoicesEur = round2(
        customers.reduce((s, c) => s + c.creditLedgerSummary.overdueInvoicesTotalEur, 0),
    );
    const approachingLimitClientsCount = customers.filter(
        (c) =>
            c.creditLedgerSummary.creditStatus === 'APPROACHING_LIMIT' ||
            c.creditLedgerSummary.creditStatus === 'LIMIT_EXCEEDED',
    ).length;
    const overdueClientsCount = customers.filter(
        (c) => c.creditLedgerSummary.overdueInvoicesCount > 0,
    ).length;

    return {
        totalCustomers: customers.length,
        totalPurchasedEur,
        totalOrdersCount,
        totalDiscountsGrantedEur,
        totalNetMarginEur,
        avgEffectiveDiscountPct,
        activeProjectsCount,
        totalNotesCount,
        totalCreditLimitsEur,
        totalCreditUsedEur,
        totalPaidInvoicesEur,
        totalOverdueInvoicesEur,
        approachingLimitClientsCount,
        overdueClientsCount,
        creditRemindersLog: store.creditRemindersLog,
        monthlyHistory: monthlyTotals,
        customers,
    };
}
