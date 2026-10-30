import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

export type B2BAccountStatus = 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';

export type B2BDiscountTierLabel =
    | 'Standartinis montuotojas -35%'
    | 'Pro montuotojas Danfoss -48% / HERZ -50% / Haier -40%'
    | 'Regioninis dileris ir rangovas -52%';

export interface B2BPartnerAccount {
    id: string;
    companyName: string;
    companyCode: string;
    vatCode: string;
    contactPerson: string;
    email: string;
    phone: string;
    activityType: 'ŠVOK montuotojas' | 'Projektuotojas' | 'Dileris' | 'Projektuotojas / Dileris';
    city: string;
    status: B2BAccountStatus;
    discountTier: B2BDiscountTierLabel;
    defaultDiscountPercent: number;
    creditLimitEur: number;
    creditUsedEur: number;
    paymentTermsDays: number;
    password?: string;
    createdAt: string;
    approvedAt: string | null;
    approvedBy: string | null;
}

const B2B_ACCOUNTS_PATH = path.join(process.cwd(), 'src', 'data', 'b2b-accounts.json');

let memoryAccountsCache: B2BPartnerAccount[] | null = null;

function readAccountsFromDisk(): B2BPartnerAccount[] {
    if (memoryAccountsCache) {
        return memoryAccountsCache;
    }
    try {
        if (fs.existsSync(B2B_ACCOUNTS_PATH)) {
            const raw = fs.readFileSync(B2B_ACCOUNTS_PATH, 'utf-8');
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
                memoryAccountsCache = parsed;
                return parsed;
            }
        }
    } catch {
        // fallback to memory
    }
    memoryAccountsCache = [];
    return memoryAccountsCache;
}

function saveAccountsToDisk(accounts: B2BPartnerAccount[]): void {
    memoryAccountsCache = accounts;
    try {
        fs.mkdirSync(path.dirname(B2B_ACCOUNTS_PATH), { recursive: true });
        fs.writeFileSync(B2B_ACCOUNTS_PATH, JSON.stringify(accounts, null, 2), 'utf-8');
    } catch {
        // non-fatal in read-only test runners
    }
}

export function resetB2BAccountsCache(accounts: B2BPartnerAccount[] = []): void {
    saveAccountsToDisk(accounts);
}

function stripAccountPassword(account: B2BPartnerAccount): B2BPartnerAccount {
    const { password: _password, ...safe } = account;
    return safe;
}

export function listB2BPartnerAccounts(): B2BPartnerAccount[] {
    return readAccountsFromDisk().map(stripAccountPassword);
}

export function canAccessB2BWholesale(account: B2BPartnerAccount | null | undefined): boolean {
    if (!account) return false;
    return account.status === 'APPROVED';
}

export function authenticateB2BPartnerAccount(input: {
    email: string;
    password?: string;
}): B2BPartnerAccount | null {
    const normalizedEmail = (input.email || '').trim().toLowerCase();
    const rawPassword = (input.password || '').trim();
    if (!normalizedEmail || !rawPassword) {
        return null;
    }
    const accounts = readAccountsFromDisk();
    const found = accounts.find((a) => a.email.toLowerCase() === normalizedEmail);
    if (!found) {
        return null;
    }
    if (found.password) {
        const candidateBuf = Buffer.from(rawPassword, 'utf8');
        const expectedBuf = Buffer.from(found.password, 'utf8');
        if (
            candidateBuf.length !== expectedBuf.length ||
            !crypto.timingSafeEqual(candidateBuf, expectedBuf)
        ) {
            return null;
        }
    }
    return stripAccountPassword(found);
}

export function registerB2BPartnerAccount(input: {
    companyName: string;
    companyCode: string;
    vatCode?: string;
    contactPerson: string;
    email: string;
    phone: string;
    activityType?: B2BPartnerAccount['activityType'];
    city?: string;
    password?: string;
}): B2BPartnerAccount {
    const accounts = readAccountsFromDisk();
    const normalizedEmail = input.email.trim().toLowerCase();
    const existing = accounts.find((a) => a.email.toLowerCase() === normalizedEmail);
    if (existing) {
        return stripAccountPassword(existing);
    }

    const newAccount: B2BPartnerAccount = {
        id: `b2b-partner-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        companyName: input.companyName.trim(),
        companyCode: input.companyCode.trim(),
        vatCode: (input.vatCode || 'LT100000000000').trim(),
        contactPerson: input.contactPerson.trim(),
        email: normalizedEmail,
        phone: input.phone.trim(),
        activityType: input.activityType || 'ŠVOK montuotojas',
        city: (input.city || 'Kaunas').trim(),
        status: 'PENDING_APPROVAL',
        discountTier: 'Standartinis montuotojas -35%',
        defaultDiscountPercent: 35,
        creditLimitEur: 5000,
        creditUsedEur: 0,
        paymentTermsDays: 14,
        password: (input.password || 'gile2026').trim(),
        createdAt: new Date().toISOString(),
        approvedAt: null,
        approvedBy: null,
    };

    const next = [newAccount, ...accounts];
    saveAccountsToDisk(next);
    return stripAccountPassword(newAccount);
}

export function approveOrRejectB2BPartnerAccount(input: {
    accountId: string;
    action: 'approve' | 'reject';
    discountTier?: B2BDiscountTierLabel;
    defaultDiscountPercent?: number;
    creditLimitEur?: number;
    approvedBy?: string;
}): B2BPartnerAccount | null {
    const accounts = readAccountsFromDisk();
    const idx = accounts.findIndex((a) => a.id === input.accountId);
    if (idx === -1) return null;

    const current = accounts[idx]!;
    const tier = input.discountTier || current.discountTier;
    const discountPct =
        typeof input.defaultDiscountPercent === 'number'
            ? input.defaultDiscountPercent
            : tier.includes('-52%')
              ? 52
              : tier.includes('-48%')
                ? 45
                : 35;

    const updated: B2BPartnerAccount = {
        ...current,
        status: input.action === 'approve' ? 'APPROVED' : 'REJECTED',
        discountTier: tier,
        defaultDiscountPercent: discountPct,
        creditLimitEur: input.creditLimitEur ?? current.creditLimitEur,
        approvedAt: input.action === 'approve' ? new Date().toISOString() : null,
        approvedBy: input.approvedBy || 'Darius Šauklys (Admin)',
    };

    const next = accounts.map((a, i) => (i === idx ? updated : a));
    saveAccountsToDisk(next);
    return stripAccountPassword(updated);
}
