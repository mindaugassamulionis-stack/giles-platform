import { NextRequest, NextResponse } from 'next/server';
import {
    ADMIN_SESSION_COOKIE_NAME,
    DARIUS_ADMIN_PROFILE,
    authenticateAdminCredentials,
    buildAdminUserResponse,
    changeAdminPassword,
    clearAdminLoginFailures,
    isAdminLoginRateLimited,
    recordAdminLoginFailure,
    resetAdminAuthOverrides,
    verifyAdminSessionToken,
} from '../../../../lib/admin-auth-store';

function isExternalHost(req: NextRequest): boolean {
    if (req.headers.get('x-enforce-admin-auth') === '1') {
        return true;
    }
    const rawHost =
        req.headers.get('x-forwarded-host') ||
        req.headers.get('host') ||
        req.nextUrl.hostname ||
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

function extractRequestToken(req: NextRequest): string | undefined {
    const cookieToken = req.cookies.get(ADMIN_SESSION_COOKIE_NAME)?.value;
    if (cookieToken) return cookieToken;
    const cookieHeader = req.headers.get('cookie') || '';
    const m = cookieHeader.match(/(?:^|;\s*)giles_admin_session=([^;]+)/);
    if (m?.[1]) return decodeURIComponent(m[1].trim());
    const authHeader = req.headers.get('authorization');
    return authHeader?.toLowerCase().startsWith('bearer ')
        ? authHeader.slice(7).trim()
        : undefined;
}

export async function GET(req: NextRequest) {
    const cookieToken = req.cookies.get(ADMIN_SESSION_COOKIE_NAME)?.value;
    const authHeader = req.headers.get('authorization');
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : undefined;
    const token = cookieToken || bearerToken;

    const authenticated = verifyAdminSessionToken(token);
    return NextResponse.json({
        ok: true,
        authenticated,
        user: buildAdminUserResponse(DARIUS_ADMIN_PROFILE.email),
    });
}

export async function POST(req: NextRequest) {
    try {
        const body = (await req.json()) as {
            action?: 'login' | 'change_password' | 'logout' | 'reset_default';
            email?: string;
            password?: string;
            currentPassword?: string;
            newPassword?: string;
        };

        const action = body?.action || 'login';

        if (action === 'login') {
            const clientIp =
                req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';
            const rateCheck = isAdminLoginRateLimited(clientIp);
            if (rateCheck.limited) {
                return NextResponse.json(
                    {
                        ok: false,
                        error: 'Per daug nesėkmingų bandymų prisijungti. Bandykite vėliau.',
                    },
                    {
                        status: 429,
                        headers: {
                            'Retry-After': String(rateCheck.retryAfterSeconds),
                        },
                    },
                );
            }

            const result = authenticateAdminCredentials(
                String(body.email || ''),
                String(body.password || ''),
            );
            if (!result.ok || !result.user || !result.sessionToken) {
                recordAdminLoginFailure(clientIp);
                return NextResponse.json(
                    {
                        ok: false,
                        error: result.error || 'Neteisingas el. paštas arba slaptažodis.',
                    },
                    { status: 401 },
                );
            }

            clearAdminLoginFailures(clientIp);
            const res = NextResponse.json({
                ok: true,
                user: result.user,
                sessionToken: result.sessionToken,
            });
            res.cookies.set(ADMIN_SESSION_COOKIE_NAME, result.sessionToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 60 * 60 * 24 * 14,
                path: '/',
            });
            return res;
        }

        if (action === 'change_password') {
            const result = changeAdminPassword({
                email: body.email,
                currentPassword: String(body.currentPassword || ''),
                newPassword: String(body.newPassword || ''),
            });
            if (!result.ok || !result.sessionToken || !result.user) {
                return NextResponse.json(
                    {
                        ok: false,
                        error: result.error || 'Nepavyko pakeisti slaptažodžio.',
                    },
                    { status: result.status || 400 },
                );
            }

            const res = NextResponse.json({
                ok: true,
                message: result.message || 'Slaptažodis sėkmingai pakeistas',
                user: result.user,
                sessionToken: result.sessionToken,
            });
            res.cookies.set(ADMIN_SESSION_COOKIE_NAME, result.sessionToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 60 * 60 * 24 * 14,
                path: '/',
            });
            return res;
        }

        if (action === 'logout') {
            const res = NextResponse.json({
                ok: true,
                authenticated: false,
                message: 'Sėkmingai atsijungta nuo Gilės Admin OS.',
            });
            res.cookies.set(ADMIN_SESSION_COOKIE_NAME, '', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 0,
                path: '/',
            });
            return res;
        }

        if (action === 'reset_default') {
            if (isExternalHost(req) && !verifyAdminSessionToken(extractRequestToken(req))) {
                return NextResponse.json(
                    { ok: false, error: 'Unauthorized: Admin session required' },
                    { status: 401 },
                );
            }
            resetAdminAuthOverrides();
            return NextResponse.json({
                ok: true,
                message: 'Atstatytas pradinis slaptažodis.',
            });
        }

        return NextResponse.json(
            { ok: false, error: 'Nežinomas veiksmas.' },
            { status: 400 },
        );
    } catch {
        return NextResponse.json(
            { ok: false, error: 'Netinkama užklausos struktūra.' },
            { status: 400 },
        );
    }
}
