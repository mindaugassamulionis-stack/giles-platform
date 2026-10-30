import { NextResponse } from 'next/server';
import {
    listB2BPartnerAccounts,
    registerB2BPartnerAccount,
    approveOrRejectB2BPartnerAccount,
    authenticateB2BPartnerAccount,
    type B2BDiscountTierLabel,
} from '../../../../lib/b2b-accounts';

export async function GET() {
    const accounts = listB2BPartnerAccounts();
    return NextResponse.json({
        ok: true,
        accounts,
    });
}

export async function POST(req: Request) {
    try {
        const body = await req.json();

        if (body.action === 'login') {
            const account = authenticateB2BPartnerAccount({
                email: String(body.email || ''),
                password: String(body.password || ''),
            });

            if (!account) {
                return NextResponse.json(
                    {
                        ok: false,
                        error: 'Neteisingas el. paštas arba slaptažodis. Patikrinkite duomenis arba pateikite naują B2B registracijos paraišką.',
                    },
                    { status: 401 },
                );
            }

            return NextResponse.json({
                ok: true,
                account,
            });
        }

        if (body.action === 'approve' || body.action === 'reject') {
            const updated = approveOrRejectB2BPartnerAccount({
                accountId: String(body.accountId || ''),
                action: body.action,
                discountTier: body.discountTier as B2BDiscountTierLabel | undefined,
                defaultDiscountPercent:
                    typeof body.defaultDiscountPercent === 'number'
                        ? body.defaultDiscountPercent
                        : undefined,
                creditLimitEur:
                    typeof body.creditLimitEur === 'number' ? body.creditLimitEur : undefined,
                approvedBy: body.approvedBy || 'Darius Šauklys (Admin)',
            });

            if (!updated) {
                return NextResponse.json(
                    { ok: false, error: 'B2B paskyra nerasta' },
                    { status: 404 },
                );
            }

            return NextResponse.json({
                ok: true,
                account: updated,
                accounts: listB2BPartnerAccounts(),
            });
        }

        if (!body.companyName || !body.companyCode || !body.email) {
            return NextResponse.json(
                { ok: false, error: 'Užpildykite įmonės pavadinimą, kodą ir el. paštą' },
                { status: 400 },
            );
        }

        const created = registerB2BPartnerAccount({
            companyName: String(body.companyName),
            companyCode: String(body.companyCode),
            vatCode: body.vatCode ? String(body.vatCode) : undefined,
            contactPerson: String(body.contactPerson || body.companyName),
            email: String(body.email),
            phone: String(body.phone || '+370 600 00000'),
            activityType: body.activityType || 'ŠVOK montuotojas',
            city: body.city ? String(body.city) : 'Kaunas',
            password: body.password ? String(body.password) : 'gile2026',
        });

        return NextResponse.json({
            ok: true,
            account: created,
            accounts: listB2BPartnerAccounts(),
        });
    } catch {
        return NextResponse.json(
            { ok: false, error: 'Nepavyko apdoroti B2B užklausos' },
            { status: 400 },
        );
    }
}

export async function PATCH(req: Request) {
    try {
        const body = await req.json();
        const updated = approveOrRejectB2BPartnerAccount({
            accountId: String(body.accountId || ''),
            action: body.action === 'reject' ? 'reject' : 'approve',
            discountTier: body.discountTier as B2BDiscountTierLabel | undefined,
            defaultDiscountPercent:
                typeof body.defaultDiscountPercent === 'number'
                    ? body.defaultDiscountPercent
                    : undefined,
            creditLimitEur:
                typeof body.creditLimitEur === 'number' ? body.creditLimitEur : undefined,
            approvedBy: body.approvedBy || 'Darius Šauklys (Admin)',
        });

        if (!updated) {
            return NextResponse.json(
                { ok: false, error: 'B2B paskyra nerasta' },
                { status: 404 },
            );
        }

        return NextResponse.json({
            ok: true,
            account: updated,
            accounts: listB2BPartnerAccounts(),
        });
    } catch {
        return NextResponse.json(
            { ok: false, error: 'Nepavyko atnaujinti B2B paskyros' },
            { status: 400 },
        );
    }
}
