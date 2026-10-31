import { NextResponse } from 'next/server';
import {
    listB2BPartnerAccounts,
    registerB2BPartnerAccount,
    approveOrRejectB2BPartnerAccount,
    authenticateB2BPartnerAccount,
    type B2BDiscountTierLabel,
} from '../../../../lib/b2b-accounts';
import { verifyAdminSessionToken } from '../../../../lib/admin-auth-store';

function isExternalB2BRequest(req: Request): boolean {
    if (req.headers.get('x-enforce-admin-auth') === '1') {
        return true;
    }
    const rawHost =
        req.headers.get('x-forwarded-host') ||
        req.headers.get('host') ||
        new URL(req.url).hostname ||
        '';
    const cleanHost = rawHost.split(',')[0]?.trim().toLowerCase().replace(/:\d+$/, '') || '';
    if (!cleanHost) return false;
    return (
        cleanHost !== '127.0.0.1' &&
        cleanHost !== 'localhost' &&
        cleanHost !== '::1' &&
        cleanHost !== '[::1]' &&
        cleanHost !== '0.0.0.0'
    );
}

function hasValidAdminTokenOnRequest(req: Request): boolean {
    const cookieHeader = req.headers.get('cookie') || '';
    const m = cookieHeader.match(/(?:^|;\s*)giles_admin_session=([^;]+)/);
    const cookieToken = m?.[1] ? decodeURIComponent(m[1].trim()) : '';
    if (verifyAdminSessionToken(cookieToken)) {
        return true;
    }
    const authHeader = (req.headers.get('authorization') || '').trim();
    const bearer = authHeader.toLowerCase().startsWith('bearer ')
        ? authHeader.slice(7).trim()
        : '';
    return verifyAdminSessionToken(bearer);
}

const isExternalHostRequest = isExternalB2BRequest;
const hasAdminSession = hasValidAdminTokenOnRequest;

export async function GET(request: Request) {
    if (request && isExternalHostRequest(request) && !hasAdminSession(request)) {
        return NextResponse.json(
            {
                ok: false,
                error: 'Unauthorized: Admin session required to list B2B accounts on external hosts.',
            },
            { status: 401 },
        );
    }
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

        if (
            body.action === 'approve' ||
            body.action === 'reject' ||
            body.action === 'update_discounts'
        ) {
            if (isExternalB2BRequest(req) && !hasValidAdminTokenOnRequest(req)) {
                return NextResponse.json(
                    { ok: false, error: 'Unauthorized: Admin session required' },
                    { status: 401 },
                );
            }
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
        if (isExternalB2BRequest(req) && !hasValidAdminTokenOnRequest(req)) {
            return NextResponse.json(
                { ok: false, error: 'Unauthorized: Admin session required' },
                { status: 401 },
            );
        }
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
