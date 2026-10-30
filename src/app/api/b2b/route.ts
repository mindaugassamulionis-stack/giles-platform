import { NextResponse } from 'next/server';
import { listB2BPartnerAccounts } from '../../../lib/b2b-accounts';
import {
    calculateB2BCartPricing,
    getB2BPricingStore,
    getCampaignsForPartner,
    getCustomerPricingRule,
    getOffersForPartner,
    listCartQuoteRequests,
    submitCartQuoteRequest,
} from '../../../lib/b2b-pricing-engine';

export async function GET(req: Request) {
    const url = new URL(req.url);
    const accountId = url.searchParams.get('accountId') || undefined;
    const accounts = listB2BPartnerAccounts();
    const account = accountId ? accounts.find((a) => a.id === accountId) || null : null;
    const pricingRule = getCustomerPricingRule(accountId);
    const campaigns = getCampaignsForPartner(accountId, pricingRule?.tierSegment);
    const offers = getOffersForPartner(accountId);
    const store = getB2BPricingStore();

    return NextResponse.json({
        ok: true,
        account,
        pricingRule,
        campaigns,
        offers,
        globalVolumeTiers: store.globalVolumeTiers,
        globalQuantityTiers: store.globalQuantityTiers,
    });
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const action = String(body.action || 'calculate_cart');

        if (action === 'calculate_cart') {
            const summary = calculateB2BCartPricing({
                accountId: body.accountId ? String(body.accountId) : null,
                defaultAccountDiscountPct:
                    typeof body.defaultAccountDiscountPct === 'number'
                        ? body.defaultAccountDiscountPct
                        : undefined,
                applyGlobalQuantityTiers: body.applyGlobalQuantityTiers ?? true,
                items: Array.isArray(body.items) ? body.items : [],
            });
            return NextResponse.json({
                ok: true,
                summary,
            });
        }

        if (action === 'request_cart_quote') {
            const quoteRequest = submitCartQuoteRequest({
                accountId: body.accountId ? String(body.accountId) : undefined,
                customerName: String(body.customerName || 'Klientas'),
                companyName: body.companyName ? String(body.companyName) : undefined,
                phone: String(body.phone || '+370 600 00000'),
                email: String(body.email || 'info@klientas.lt'),
                note: body.note ? String(body.note) : undefined,
                items: Array.isArray(body.items) ? body.items : [],
            });
            return NextResponse.json({
                ok: true,
                quoteRequest,
                requests: listCartQuoteRequests(),
            });
        }

        return NextResponse.json(
            { ok: false, error: 'Nežinomas B2B veiksmas' },
            { status: 400 },
        );
    } catch {
        return NextResponse.json(
            { ok: false, error: 'Nepavyko apdoroti B2B užklausos' },
            { status: 400 },
        );
    }
}
