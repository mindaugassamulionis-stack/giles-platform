import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

export const DARIUS_ADMIN_DEFAULT_HASH =
    '77b2c493b8514eb66bc0d1756bba3f26a3326b9e01ce1ed381d87439eba7233e';

export const DARIUS_ADMIN_PROFILE = {
    email: 'darius@gilesinzinerija.com',
    aliases: ['darius@gilesinzinerija.com', 'darius@gilesinzinerija.lt'] as const,
    name: 'Darius Šauklys',
    role: 'Super Admin',
    fullRole: 'Vykdantysis direktorius / vyr. inžinierius (Super Admin)',
    phone: '+370 693 97098',
} as const;

export const ADMIN_SESSION_COOKIE_NAME = 'giles_admin_session';

export interface AdminAuthOverrideStore {
    passwordHash?: string;
    updatedAt?: string;
    updatedBy?: string;
}

export interface AdminAuthenticatedUser {
    email: string;
    loginEmail: string;
    aliases: readonly string[];
    name: string;
    role: string;
    fullRole: string;
    phone: string;
    hasCustomPassword: boolean;
}

function resolveAdminAuthDataPath(): string {
    const candidates = [
        path.join(process.cwd(), 'src/data/admin-auth.json'),
        path.resolve(__dirname, '../data/admin-auth.json'),
    ];
    for (const candidate of candidates) {
        if (fs.existsSync(path.dirname(candidate))) {
            return candidate;
        }
    }
    return candidates[0];
}

export function hashAdminPassword(password: string): string {
    return crypto.createHash('sha256').update(String(password), 'utf8').digest('hex');
}

export function readAdminAuthOverrides(): AdminAuthOverrideStore {
    const filePath = resolveAdminAuthDataPath();
    try {
        if (!fs.existsSync(filePath)) {
            return {};
        }
        const raw = fs.readFileSync(filePath, 'utf8').trim();
        if (!raw) {
            return {};
        }
        const parsed = JSON.parse(raw) as AdminAuthOverrideStore;
        return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
        return {};
    }
}

export function writeAdminAuthOverrides(overrides: AdminAuthOverrideStore): void {
    const filePath = resolveAdminAuthDataPath();
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    const serialized =
        Object.keys(overrides).length === 0 ? '{}\n' : `${JSON.stringify(overrides, null, 2)}\n`;
    fs.writeFileSync(filePath, serialized, 'utf8');
}

export function resetAdminAuthOverrides(): void {
    writeAdminAuthOverrides({});
}

export function getActiveAdminPasswordHash(): string {
    const overrides = readAdminAuthOverrides();
    if (
        typeof overrides.passwordHash === 'string' &&
        /^[a-f0-9]{64}$/i.test(overrides.passwordHash.trim())
    ) {
        return overrides.passwordHash.trim().toLowerCase();
    }
    return DARIUS_ADMIN_DEFAULT_HASH;
}

export function isDariusAdminEmail(emailInput: string): boolean {
    const normalized = String(emailInput || '').trim().toLowerCase();
    return (DARIUS_ADMIN_PROFILE.aliases as readonly string[]).includes(normalized);
}

function safeCompareHex(hashA: string, hashB: string): boolean {
    const a = Buffer.from(String(hashA || '').toLowerCase(), 'utf8');
    const b = Buffer.from(String(hashB || '').toLowerCase(), 'utf8');
    if (a.length !== b.length || a.length === 0) {
        return false;
    }
    return crypto.timingSafeEqual(a, b);
}

function getSessionSigningKey(): string {
    return (
        process.env.GILES_ADMIN_SESSION_SECRET ||
        `giles-admin-hmac-${DARIUS_ADMIN_DEFAULT_HASH.slice(0, 32)}`
    );
}

export function createAdminSessionToken(
    loginEmail: string = DARIUS_ADMIN_PROFILE.email,
): string {
    const issuedAt = Date.now();
    const activeHashPrefix = getActiveAdminPasswordHash().slice(0, 16);
    const payload = Buffer.from(
        JSON.stringify({
            sub: DARIUS_ADMIN_PROFILE.email,
            loginEmail: String(loginEmail || DARIUS_ADMIN_PROFILE.email).trim().toLowerCase(),
            role: DARIUS_ADMIN_PROFILE.role,
            hp: activeHashPrefix,
            iat: issuedAt,
        }),
        'utf8',
    ).toString('base64url');
    const sig = crypto
        .createHmac('sha256', getSessionSigningKey())
        .update(payload)
        .digest('base64url');
    return `${payload}.${sig}`;
}

export function verifyAdminSessionToken(token?: string | null): boolean {
    if (!token || typeof token !== 'string' || !token.includes('.')) {
        return false;
    }
    const [payload, sig] = token.split('.');
    if (!payload || !sig) {
        return false;
    }
    const expectedSig = crypto
        .createHmac('sha256', getSessionSigningKey())
        .update(payload)
        .digest('base64url');
    const sigBuf = Buffer.from(sig, 'utf8');
    const expBuf = Buffer.from(expectedSig, 'utf8');
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
        return false;
    }
    try {
        const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as {
            sub?: string;
            hp?: string;
        };
        if (decoded.sub !== DARIUS_ADMIN_PROFILE.email) {
            return false;
        }
        const activeHashPrefix = getActiveAdminPasswordHash().slice(0, 16);
        return decoded.hp === activeHashPrefix;
    } catch {
        return false;
    }
}

export function buildAdminUserResponse(
    loginEmail: string = DARIUS_ADMIN_PROFILE.email,
): AdminAuthenticatedUser {
    const overrides = readAdminAuthOverrides();
    return {
        email: DARIUS_ADMIN_PROFILE.email,
        loginEmail: String(loginEmail || DARIUS_ADMIN_PROFILE.email).trim().toLowerCase(),
        aliases: DARIUS_ADMIN_PROFILE.aliases,
        name: DARIUS_ADMIN_PROFILE.name,
        role: DARIUS_ADMIN_PROFILE.role,
        fullRole: DARIUS_ADMIN_PROFILE.fullRole,
        phone: DARIUS_ADMIN_PROFILE.phone,
        hasCustomPassword: Boolean(overrides.passwordHash),
    };
}

export function authenticateAdminCredentials(
    emailInput: string,
    passwordInput: string,
): {
    ok: boolean;
    error?: string;
    user?: AdminAuthenticatedUser;
    sessionToken?: string;
} {
    const normalizedEmail = String(emailInput || '').trim().toLowerCase();
    if (!isDariusAdminEmail(normalizedEmail)) {
        return {
            ok: false,
            error: 'Neteisingas el. paštas arba slaptažodis.',
        };
    }

    const candidateHash = hashAdminPassword(String(passwordInput || ''));
    const activeHash = getActiveAdminPasswordHash();
    if (!safeCompareHex(candidateHash, activeHash)) {
        return {
            ok: false,
            error: 'Neteisingas el. paštas arba slaptažodis.',
        };
    }

    const user = buildAdminUserResponse(normalizedEmail);
    const sessionToken = createAdminSessionToken(normalizedEmail);
    return {
        ok: true,
        user,
        sessionToken,
    };
}

export function changeAdminPassword(params: {
    email?: string;
    currentPassword: string;
    newPassword: string;
}): {
    ok: boolean;
    status: number;
    message?: string;
    error?: string;
    sessionToken?: string;
    user?: AdminAuthenticatedUser;
} {
    const emailToCheck = params.email ? String(params.email).trim().toLowerCase() : DARIUS_ADMIN_PROFILE.email;
    if (!isDariusAdminEmail(emailToCheck)) {
        return {
            ok: false,
            status: 401,
            error: 'Neteisinga administratoriaus paskyra.',
        };
    }

    const currentCandidateHash = hashAdminPassword(String(params.currentPassword || ''));
    const activeHash = getActiveAdminPasswordHash();
    if (!safeCompareHex(currentCandidateHash, activeHash)) {
        return {
            ok: false,
            status: 401,
            error: 'Dabartinis slaptažodis neteisingas.',
        };
    }

    const trimmedNew = String(params.newPassword || '').trim();
    if (trimmedNew.length < 6) {
        return {
            ok: false,
            status: 400,
            error: 'Naujas slaptažodis turi būti bent 6 simbolių ilgio.',
        };
    }

    const newHash = hashAdminPassword(trimmedNew);
    writeAdminAuthOverrides({
        passwordHash: newHash,
        updatedAt: new Date().toISOString(),
        updatedBy: DARIUS_ADMIN_PROFILE.email,
    });

    const user = buildAdminUserResponse(emailToCheck);
    const sessionToken = createAdminSessionToken(emailToCheck);
    return {
        ok: true,
        status: 200,
        message: 'Slaptažodis sėkmingai pakeistas',
        sessionToken,
        user,
    };
}
