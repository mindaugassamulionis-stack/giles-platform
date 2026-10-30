// Pure formatting helpers usable from BOTH server and client components
// (must NOT live in a 'use client' module).
export function formatEur(value: number): string {
    return `${value.toFixed(2).replace('.', ',')} €`;
}
