// F-2 (W127/S7): Host and x-forwarded-host values are client-controlled, so a
// loopback-valued Host alone must never mark a request local/trusted. Local-admin
// trust requires the server-side opt-in GILES_TRUST_LOCAL_ADMIN=1 — never a header.
export const LOCAL_ADMIN_TRUST_ENV = 'GILES_TRUST_LOCAL_ADMIN';

export function isLocalAdminTrustEnabled(): boolean {
    return process.env[LOCAL_ADMIN_TRUST_ENV] === '1';
}
