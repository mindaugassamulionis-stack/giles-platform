/**
 * WP-W119-A2: server startup gate (Next.js instrumentation register()).
 *
 * Kept import-free: instrumentation.ts is also compiled for non-node
 * contexts, where the database module graph (fs/crypto/pg) cannot bundle.
 * The boot gate enforces identity env presence and format; the full
 * row-backed resolution (unknown slug -> StoreIdentityError) runs on the
 * first server request via src/lib/store-identity.ts, which every identity
 * consumer already calls. A deployment without STORE_SLUG/STORE_ID dies
 * here instead of silently rendering another store.
 */
const STORE_UUID_RE =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function register(): Promise<void> {
    const runsOnNodeServer = process.env.NEXT_RUNTIME === 'nodejs';
    if (!runsOnNodeServer) return;
    if (process.env.NEXT_PHASE === 'phase-production-build') return;
    if (process.env.VITEST) return;

    const slug = (process.env.STORE_SLUG || '').trim();
    const storeId = (process.env.STORE_ID || '').trim();

    if (!slug && !storeId) {
        console.error(
            '[instrumentation] store identity check FAILED — refusing to start: Store identity not configured. Set STORE_SLUG (recommended, e.g. giles-inzinierija) or STORE_ID for this deployment.',
        );
        throw new Error(
            'Store identity not configured. Set STORE_SLUG (recommended, e.g. giles-inzinierija) or STORE_ID for this deployment.',
        );
    }
    if (storeId && !STORE_UUID_RE.test(storeId)) {
        console.error(
            `[instrumentation] store identity check FAILED — refusing to start: STORE_ID "${storeId}" is not a valid store UUID.`,
        );
        throw new Error(`STORE_ID "${storeId}" is not a valid store UUID.`);
    }
    console.log(
        `[instrumentation] store identity env OK (STORE_SLUG="${slug || '-'}", STORE_ID="${storeId || '-'}"); store row resolved on first request`,
    );
}
