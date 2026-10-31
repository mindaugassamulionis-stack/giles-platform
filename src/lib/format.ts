// Pure formatting helpers usable from BOTH server and client components
// (must NOT live in a 'use client' module).
// W118-A2: unified lt-LT price format — decimal comma, NBSP thousands grouping.
const eurAmountFormatter = new Intl.NumberFormat('lt-LT', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
});

export function formatEurAmount(value: number): string {
    return eurAmountFormatter.format(value);
}

export function formatEur(value: number): string {
    return `${formatEurAmount(value)} €`;
}
