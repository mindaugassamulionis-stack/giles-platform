// W125-F1: duomenų failų keliai vitest metu. Testuojami API maršrutai rašo čia,
// kad gyvi src/data failai liktų nepaliesti (git status švarus po viso suite).
export function vitestDataFile(prefix: string): string {
    const pool = process.env.VITEST_POOL_ID || process.env.VITEST_WORKER_ID || '0';
    return `/tmp/giles-${prefix}-vitest-${process.pid}-${pool}.json`;
}
