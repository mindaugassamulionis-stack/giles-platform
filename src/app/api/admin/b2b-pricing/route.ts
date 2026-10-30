import { NextResponse } from 'next/server';
import { listB2BPartnerAccounts } from '../../../../lib/b2b-accounts';
import {
    SUPPORTED_B2B_BRANDS,
    SUPPORTED_B2B_CATEGORIES,
    addB2BCustomerNote,
    calculateB2BCartPricing,
    createCustomCommercialOffer,
    createManualB2BCustomer,
    createMarketingCampaign,
    deleteB2BCustomerNote,
    deleteB2BCustomerProject,
    deleteMarketingCampaign,
    getB2BCrmAnalyticsSnapshot,
    getB2BPricingStore,
    recordB2BInvoiceOrPayment,
    resetB2BPricingEngineState,
    runAutoCreditRemindersSweep,
    sendB2BCreditReminder,
    updateB2BCreditTerms,
    updateB2BCustomerCrmProfile,
    updateGlobalSalesGrowthRules,
    upsertB2BCustomerProject,
    upsertCustomerPricingRule,
    type B2BCreditInvoiceStatus,
    type B2BCreditReminderTrigger,
    type B2BCreditReminderType,
    type B2BCustomerNoteTag,
    type B2BCustomerProjectStatus,
    type B2BCustomerTierSegment,
    type B2BPaymentDeferralDays,
} from '../../../../lib/b2b-pricing-engine';

function buildAdminSnapshot(previewSimulation = false) {
    const store = getB2BPricingStore();
    const accounts = listB2BPartnerAccounts();
    const crmAnalytics = getB2BCrmAnalyticsSnapshot({ previewSimulation });
    return {
        ok: true,
        accounts,
        customerRules: store.customerRules,
        individualOffers: store.individualOffers,
        campaigns: store.campaigns,
        cartQuoteRequests: store.cartQuoteRequests,
        creditRemindersLog: store.creditRemindersLog,
        globalVolumeTiers: store.globalVolumeTiers,
        globalQuantityTiers: store.globalQuantityTiers,
        supportedBrands: SUPPORTED_B2B_BRANDS,
        supportedCategories: SUPPORTED_B2B_CATEGORIES,
        crmAnalytics,
    };
}

export async function GET() {
    return NextResponse.json(buildAdminSnapshot(false));
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const action = String(body.action || '');

        if (action === 'reset_db') {
            resetB2BPricingEngineState();
            return NextResponse.json(buildAdminSnapshot());
        }

        if (action === 'create_customer') {
            if (!body.companyName || !body.companyCode || !body.email) {
                return NextResponse.json(
                    { ok: false, error: 'Įveskite įmonės pavadinimą, kodą ir el. paštą' },
                    { status: 400 },
                );
            }
            const account = createManualB2BCustomer({
                companyName: String(body.companyName),
                companyCode: String(body.companyCode),
                vatCode: body.vatCode ? String(body.vatCode) : undefined,
                contactPerson: String(body.contactPerson || body.companyName),
                email: String(body.email),
                phone: String(body.phone || '+370 611 19158'),
                city: body.city ? String(body.city) : 'Kaunas',
                tierLabel: (body.tierLabel as B2BCustomerTierSegment) || 'Montuotojas',
                defaultDiscountPercent:
                    typeof body.defaultDiscountPercent === 'number'
                        ? body.defaultDiscountPercent
                        : 35,
                creditLimitEur:
                    typeof body.creditLimitEur === 'number' ? body.creditLimitEur : 10000,
                paymentTermsDays:
                    ([0, 7, 14, 30, 45, 60].includes(Number(body.paymentTermsDays))
                        ? Number(body.paymentTermsDays)
                        : 14) as B2BPaymentDeferralDays,
                assignedManager: body.assignedManager
                    ? String(body.assignedManager)
                    : 'Darius Šauklys',
                password: body.password ? String(body.password) : 'gile2026',
            });
            return NextResponse.json({
                ...buildAdminSnapshot(),
                account,
            });
        }

        if (action === 'upsert_pricing_rule') {
            const accountId = String(body.accountId || '');
            if (!accountId) {
                return NextResponse.json(
                    { ok: false, error: 'Nepasirinktas klientas (accountId)' },
                    { status: 400 },
                );
            }
            const rule = upsertCustomerPricingRule(accountId, {
                tierSegment: body.tierSegment,
                assignedManager: body.assignedManager,
                suspended: body.suspended,
                brandDiscounts: body.brandDiscounts,
                categoryDiscounts: body.categoryDiscounts,
                skuOverrides: body.skuOverrides,
                cartDiscountRules: body.cartDiscountRules,
            });
            return NextResponse.json({
                ...buildAdminSnapshot(),
                rule,
            });
        }

        if (action === 'create_offer') {
            const offer = createCustomCommercialOffer({
                accountId: String(body.accountId || 'ALL'),
                clientName: String(body.clientName || 'B2B Klientas'),
                title: String(body.title || 'Komercinis pasiūlymas'),
                extraWholeCartDiscountPct: Number(body.extraWholeCartDiscountPct) || 0,
                validUntil: body.validUntil ? String(body.validUntil) : undefined,
                items: Array.isArray(body.items) ? body.items : [],
            });
            return NextResponse.json({
                ...buildAdminSnapshot(),
                offer,
                offers: getB2BPricingStore().individualOffers,
            });
        }

        if (action === 'create_campaign') {
            const campaign = createMarketingCampaign({
                title: String(body.title || 'B2B pranešimas'),
                message: String(body.message || ''),
                categoryTag: body.categoryTag || 'Sezoninė akcija',
                targetType: body.targetType || 'ALL_B2B',
                targetSegment: body.targetSegment,
                targetAccountId: body.targetAccountId,
                promoDiscountPct:
                    typeof body.promoDiscountPct === 'number'
                        ? body.promoDiscountPct
                        : undefined,
                ctaSku: body.ctaSku ? String(body.ctaSku) : undefined,
            });
            return NextResponse.json({
                ...buildAdminSnapshot(),
                campaign,
                campaigns: getB2BPricingStore().campaigns,
            });
        }

        if (action === 'simulate_cart') {
            const simulation = calculateB2BCartPricing({
                accountId: body.accountId ? String(body.accountId) : null,
                defaultAccountDiscountPct:
                    typeof body.defaultAccountDiscountPct === 'number'
                        ? body.defaultAccountDiscountPct
                        : undefined,
                manualExtraCartDiscountPct:
                    typeof body.manualExtraCartDiscountPct === 'number'
                        ? body.manualExtraCartDiscountPct
                        : undefined,
                items: Array.isArray(body.items) ? body.items : [],
            });
            return NextResponse.json({
                ok: true,
                simulation,
            });
        }

        if (action === 'upsert_project') {
            const accountId = String(body.accountId || '');
            if (!accountId) {
                return NextResponse.json(
                    { ok: false, error: 'Nepasirinktas klientas (accountId)' },
                    { status: 400 },
                );
            }
            const projInput = (body.project && typeof body.project === 'object' ? body.project : body) as Record<string, unknown>;
            const project = upsertB2BCustomerProject(accountId, {
                id: projInput.id ? String(projInput.id) : undefined,
                title: String(projInput.title || 'ŠVOK objektas'),
                location: projInput.location ? String(projInput.location) : undefined,
                status: projInput.status as B2BCustomerProjectStatus | undefined,
                budgetEur: typeof projInput.budgetEur === 'number' ? projInput.budgetEur : Number(projInput.budgetEur || 0),
                orderedEur: typeof projInput.orderedEur === 'number' ? projInput.orderedEur : Number(projInput.orderedEur || 0),
                discountAppliedPct:
                    typeof projInput.discountAppliedPct === 'number'
                        ? projInput.discountAppliedPct
                        : Number(projInput.discountAppliedPct || 35),
            });
            return NextResponse.json({
                ...buildAdminSnapshot(),
                project,
            });
        }

        if (action === 'delete_project') {
            const accountId = String(body.accountId || '');
            const projectId = String(body.projectId || '');
            const deleted = deleteB2BCustomerProject(accountId, projectId);
            return NextResponse.json({
                ...buildAdminSnapshot(),
                deleted,
            });
        }

        if (action === 'add_note') {
            const accountId = String(body.accountId || '');
            if (!accountId) {
                return NextResponse.json(
                    { ok: false, error: 'Nepasirinktas klientas (accountId)' },
                    { status: 400 },
                );
            }
            const noteInput = (body.note && typeof body.note === 'object' ? body.note : body) as Record<string, unknown>;
            const note = addB2BCustomerNote(accountId, {
                author: noteInput.author ? String(noteInput.author) : 'Darius Šauklys',
                tag: noteInput.tag as B2BCustomerNoteTag | undefined,
                text: String(noteInput.text || ''),
            });
            return NextResponse.json({
                ...buildAdminSnapshot(),
                note,
            });
        }

        if (action === 'delete_note') {
            const accountId = String(body.accountId || '');
            const noteId = String(body.noteId || '');
            const deleted = deleteB2BCustomerNote(accountId, noteId);
            return NextResponse.json({
                ...buildAdminSnapshot(),
                deleted,
            });
        }

        if (action === 'update_credit_terms') {
            const accountId = String(body.accountId || '');
            if (!accountId) {
                return NextResponse.json(
                    { ok: false, error: 'Nepasirinktas klientas (accountId)' },
                    { status: 400 },
                );
            }
            const result = updateB2BCreditTerms(accountId, {
                creditLimitEur:
                    typeof body.creditLimitEur === 'number'
                        ? body.creditLimitEur
                        : undefined,
                paymentTermDays:
                    typeof body.paymentTermDays === 'number'
                        ? body.paymentTermDays
                        : typeof body.paymentTermsDays === 'number'
                          ? body.paymentTermsDays
                          : undefined,
                autoReminderThresholdPct:
                    typeof body.autoReminderThresholdPct === 'number'
                        ? body.autoReminderThresholdPct
                        : undefined,
                autoDueSoonReminderDays:
                    typeof body.autoDueSoonReminderDays === 'number'
                        ? body.autoDueSoonReminderDays
                        : undefined,
                autoRemindersEnabled:
                    typeof body.autoRemindersEnabled === 'boolean'
                        ? body.autoRemindersEnabled
                        : undefined,
                creditHoldOnExceed:
                    typeof body.creditHoldOnExceed === 'boolean'
                        ? body.creditHoldOnExceed
                        : undefined,
            });
            return NextResponse.json({
                ...buildAdminSnapshot(),
                ...result,
            });
        }

        if (action === 'record_invoice_or_payment') {
            const accountId = String(body.accountId || '');
            if (!accountId) {
                return NextResponse.json(
                    { ok: false, error: 'Nepasirinktas klientas (accountId)' },
                    { status: 400 },
                );
            }
            const result = recordB2BInvoiceOrPayment(accountId, {
                invoiceId: body.invoiceId ? String(body.invoiceId) : undefined,
                markPaid: Boolean(body.markPaid),
                paidAmountEur:
                    typeof body.paidAmountEur === 'number' ? body.paidAmountEur : undefined,
                status: body.status as B2BCreditInvoiceStatus | undefined,
                invoice:
                    body.invoice && typeof body.invoice === 'object'
                        ? body.invoice
                        : undefined,
            });
            return NextResponse.json({
                ...buildAdminSnapshot(),
                ...result,
            });
        }

        if (action === 'send_credit_reminder') {
            if (body.sweepAll || body.mode === 'sweep') {
                const sweep = runAutoCreditRemindersSweep({
                    triggeredBy: (body.triggeredBy as B2BCreditReminderTrigger) || 'auto_threshold',
                });
                return NextResponse.json({
                    ...buildAdminSnapshot(),
                    ...sweep,
                });
            }
            const accountId = String(body.accountId || '');
            if (!accountId) {
                return NextResponse.json(
                    { ok: false, error: 'Nepasirinktas klientas (accountId)' },
                    { status: 400 },
                );
            }
            const reminder = sendB2BCreditReminder({
                accountId,
                companyName: body.companyName ? String(body.companyName) : undefined,
                type: body.type as B2BCreditReminderType | undefined,
                channel: 'email_and_portal',
                triggeredBy: (body.triggeredBy as B2BCreditReminderTrigger) || 'manual_darius',
                customMessage: body.message ? String(body.message) : undefined,
            });
            return NextResponse.json({
                ...buildAdminSnapshot(),
                reminder,
            });
        }

        if (action === 'run_auto_credit_reminders_sweep') {
            const sweep = runAutoCreditRemindersSweep({
                triggeredBy: (body.triggeredBy as B2BCreditReminderTrigger) || 'auto_threshold',
            });
            return NextResponse.json({
                ...buildAdminSnapshot(),
                ...sweep,
            });
        }

        return NextResponse.json(
            { ok: false, error: 'Nežinomas veiksmas' },
            { status: 400 },
        );
    } catch {
        return NextResponse.json(
            { ok: false, error: 'Nepavyko apdoroti B2B kainodaros užklausos' },
            { status: 400 },
        );
    }
}

export async function PATCH(req: Request) {
    try {
        const body = await req.json();
        const action = String(body.action || 'update_customer_crm');

        if (action === 'update_customer_crm') {
            const updated = updateB2BCustomerCrmProfile({
                accountId: String(body.accountId || ''),
                status: body.status,
                companyName: body.companyName,
                companyCode: body.companyCode,
                vatCode: body.vatCode,
                contactPerson: body.contactPerson,
                email: body.email,
                phone: body.phone,
                city: body.city,
                tierLabel: body.tierLabel,
                defaultDiscountPercent:
                    typeof body.defaultDiscountPercent === 'number'
                        ? body.defaultDiscountPercent
                        : undefined,
                creditLimitEur:
                    typeof body.creditLimitEur === 'number'
                        ? body.creditLimitEur
                        : undefined,
                paymentTermsDays:
                    typeof body.paymentTermsDays === 'number'
                        ? (body.paymentTermsDays as B2BPaymentDeferralDays)
                        : undefined,
                assignedManager: body.assignedManager,
                suspended:
                    typeof body.suspended === 'boolean' ? body.suspended : undefined,
            });
            if (!updated) {
                return NextResponse.json(
                    { ok: false, error: 'Kliento paskyra nerasta' },
                    { status: 404 },
                );
            }
            return NextResponse.json({
                ...buildAdminSnapshot(),
                account: updated,
            });
        }

        if (action === 'upsert_pricing_rule') {
            const rule = upsertCustomerPricingRule(String(body.accountId || ''), {
                tierSegment: body.tierSegment,
                assignedManager: body.assignedManager,
                suspended: body.suspended,
                brandDiscounts: body.brandDiscounts,
                categoryDiscounts: body.categoryDiscounts,
                skuOverrides: body.skuOverrides,
                cartDiscountRules: body.cartDiscountRules,
            });
            return NextResponse.json({
                ...buildAdminSnapshot(),
                rule,
            });
        }

        if (action === 'update_global_tiers') {
            updateGlobalSalesGrowthRules({
                globalVolumeTiers: body.globalVolumeTiers,
                globalQuantityTiers: body.globalQuantityTiers,
            });
            return NextResponse.json(buildAdminSnapshot());
        }

        if (action === 'upsert_project') {
            const accountId = String(body.accountId || '');
            const projInput = (body.project && typeof body.project === 'object' ? body.project : body) as Record<string, unknown>;
            const project = upsertB2BCustomerProject(accountId, {
                id: projInput.id ? String(projInput.id) : undefined,
                title: String(projInput.title || 'ŠVOK objektas'),
                location: projInput.location ? String(projInput.location) : undefined,
                status: projInput.status as B2BCustomerProjectStatus | undefined,
                budgetEur: Number(projInput.budgetEur || 0),
                orderedEur: Number(projInput.orderedEur || 0),
                discountAppliedPct: Number(projInput.discountAppliedPct || 35),
            });
            return NextResponse.json({
                ...buildAdminSnapshot(),
                project,
            });
        }

        if (action === 'delete_project') {
            const deleted = deleteB2BCustomerProject(
                String(body.accountId || ''),
                String(body.projectId || ''),
            );
            return NextResponse.json({
                ...buildAdminSnapshot(),
                deleted,
            });
        }

        if (action === 'add_note') {
            const accountId = String(body.accountId || '');
            const noteInput = (body.note && typeof body.note === 'object' ? body.note : body) as Record<string, unknown>;
            const note = addB2BCustomerNote(accountId, {
                author: noteInput.author ? String(noteInput.author) : 'Darius Šauklys',
                tag: noteInput.tag as B2BCustomerNoteTag | undefined,
                text: String(noteInput.text || ''),
            });
            return NextResponse.json({
                ...buildAdminSnapshot(),
                note,
            });
        }

        if (action === 'delete_note') {
            const deleted = deleteB2BCustomerNote(
                String(body.accountId || ''),
                String(body.noteId || ''),
            );
            return NextResponse.json({
                ...buildAdminSnapshot(),
                deleted,
            });
        }

        if (action === 'update_credit_terms') {
            const result = updateB2BCreditTerms(String(body.accountId || ''), {
                creditLimitEur:
                    typeof body.creditLimitEur === 'number'
                        ? body.creditLimitEur
                        : undefined,
                paymentTermDays:
                    typeof body.paymentTermDays === 'number'
                        ? body.paymentTermDays
                        : typeof body.paymentTermsDays === 'number'
                          ? body.paymentTermsDays
                          : undefined,
                autoReminderThresholdPct:
                    typeof body.autoReminderThresholdPct === 'number'
                        ? body.autoReminderThresholdPct
                        : undefined,
                autoDueSoonReminderDays:
                    typeof body.autoDueSoonReminderDays === 'number'
                        ? body.autoDueSoonReminderDays
                        : undefined,
                autoRemindersEnabled:
                    typeof body.autoRemindersEnabled === 'boolean'
                        ? body.autoRemindersEnabled
                        : undefined,
                creditHoldOnExceed:
                    typeof body.creditHoldOnExceed === 'boolean'
                        ? body.creditHoldOnExceed
                        : undefined,
            });
            return NextResponse.json({
                ...buildAdminSnapshot(),
                ...result,
            });
        }

        if (action === 'record_invoice_or_payment') {
            const result = recordB2BInvoiceOrPayment(String(body.accountId || ''), {
                invoiceId: body.invoiceId ? String(body.invoiceId) : undefined,
                markPaid: Boolean(body.markPaid),
                paidAmountEur:
                    typeof body.paidAmountEur === 'number' ? body.paidAmountEur : undefined,
                status: body.status as B2BCreditInvoiceStatus | undefined,
                invoice:
                    body.invoice && typeof body.invoice === 'object'
                        ? body.invoice
                        : undefined,
            });
            return NextResponse.json({
                ...buildAdminSnapshot(),
                ...result,
            });
        }

        return NextResponse.json(
            { ok: false, error: 'Nežinomas PATCH veiksmas' },
            { status: 400 },
        );
    } catch {
        return NextResponse.json(
            { ok: false, error: 'Nepavyko atnaujinti B2B duomenų' },
            { status: 400 },
        );
    }
}

export async function DELETE(req: Request) {
    try {
        const url = new URL(req.url);
        let campaignId = url.searchParams.get('campaignId') || '';
        if (!campaignId) {
            const body = await req.json().catch(() => ({}));
            campaignId = String(body.campaignId || '');
        }
        if (!campaignId) {
            return NextResponse.json(
                { ok: false, error: 'Nenurodytas campaignId' },
                { status: 400 },
            );
        }
        deleteMarketingCampaign(campaignId);
        return NextResponse.json(buildAdminSnapshot());
    } catch {
        return NextResponse.json(
            { ok: false, error: 'Nepavyko pašalinti kampanijos' },
            { status: 400 },
        );
    }
}
