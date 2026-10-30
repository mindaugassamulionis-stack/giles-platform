import fs from 'fs';
import path from 'path';

// Per-file Promise mutex queue serializing concurrent transactions in-process.
const fileMutexQueues = new Map<string, Promise<unknown>>();
let atomicWriteCounter = 0;

export type PostgresSyncHook = (payload: {
    filePath: string;
    data: unknown;
    syncedAt: string;
}) => Promise<void> | void;

let registeredPostgresSyncHook: PostgresSyncHook | null = null;

export function registerPostgresSyncHook(hook: PostgresSyncHook | null): void {
    registeredPostgresSyncHook = hook;
}

export function isPostgresSyncEnabled(): boolean {
    return (
        process.env.POSTGRES_SYNC_ENABLED === 'true' &&
        Boolean(process.env.DATABASE_URL && process.env.DATABASE_URL.trim().length > 0)
    );
}

function triggerOptionalPostgresSync(filePath: string, data: unknown): void {
    if (!isPostgresSyncEnabled() && !registeredPostgresSyncHook) {
        return;
    }
    if (registeredPostgresSyncHook) {
        try {
            void Promise.resolve(
                registeredPostgresSyncHook({
                    filePath,
                    data,
                    syncedAt: new Date().toISOString(),
                }),
            ).catch(() => {
                // Non-blocking background sync fallback
            });
        } catch {
            // Non-blocking background sync fallback
        }
    }
}

export function readJsonAtomic<T>(filePath: string, fallback: T): T {
    const resolved = path.resolve(filePath);
    try {
        if (!fs.existsSync(resolved)) {
            return structuredCloneFallback(fallback);
        }
        const raw = fs.readFileSync(resolved, 'utf8');
        if (!raw.trim()) {
            return structuredCloneFallback(fallback);
        }
        return JSON.parse(raw) as T;
    } catch {
        return structuredCloneFallback(fallback);
    }
}

export function writeJsonAtomic<T>(filePath: string, data: T): T {
    const resolved = path.resolve(filePath);
    const dir = path.dirname(resolved);
    const seq = ++atomicWriteCounter;
    const tmpPath = `${resolved}.${process.pid}.${Date.now()}.${seq}.tmp`;

    try {
        fs.mkdirSync(dir, { recursive: true });
        const serialized = JSON.stringify(data, null, 2);
        fs.writeFileSync(tmpPath, serialized, { encoding: 'utf8', flush: true });
        fs.renameSync(tmpPath, resolved);
        triggerOptionalPostgresSync(resolved, data);
    } catch {
        try {
            if (fs.existsSync(tmpPath)) {
                fs.unlinkSync(tmpPath);
            }
        } catch {
            // Ignore cleanup failure on read-only fs
        }
    }
    return data;
}

export interface TransactionMutatorResult<T, R> {
    nextState: T;
    result: R;
}

function isSplitResult<T, R>(
    val: TransactionMutatorResult<T, R> | R | T,
): val is TransactionMutatorResult<T, R> {
    return Boolean(val && typeof val === 'object' && 'nextState' in val && 'result' in val);
}

/**
 * Serializes concurrent read-modify-write mutations per file via an in-process
 * Promise Mutex Queue and commits the resulting JSON atomically via POSIX rename.
 *
 * The mutator can either return `{ nextState, result }` or mutate/return the updated state `T` directly.
 */
export async function withFileTransaction<T, R = T>(
    filePath: string,
    fallback: T,
    mutator: (current: T) => Promise<TransactionMutatorResult<T, R> | R> | TransactionMutatorResult<T, R> | R,
): Promise<R> {
    const resolved = path.resolve(filePath);
    const previousLock = fileMutexQueues.get(resolved) ?? Promise.resolve();

    let releaseLock!: () => void;
    const currentLock = new Promise<void>((resolve) => {
        releaseLock = resolve;
    });
    fileMutexQueues.set(
        resolved,
        previousLock.then(() => currentLock, () => currentLock),
    );

    await previousLock.catch(() => undefined);

    try {
        const current = readJsonAtomic<T>(resolved, fallback);
        const outcome = await mutator(current);

        if (isSplitResult<T, R>(outcome)) {
            writeJsonAtomic<T>(resolved, outcome.nextState);
            return outcome.result;
        }

        writeJsonAtomic<T>(resolved, outcome as unknown as T);
        return outcome;
    } finally {
        releaseLock();
        if (fileMutexQueues.get(resolved) === currentLock) {
            fileMutexQueues.delete(resolved);
        }
    }
}

function structuredCloneFallback<T>(value: T): T {
    if (value === null || typeof value !== 'object') {
        return value;
    }
    try {
        return JSON.parse(JSON.stringify(value)) as T;
    } catch {
        return value;
    }
}
