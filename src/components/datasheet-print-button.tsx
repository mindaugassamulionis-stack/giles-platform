'use client';

import { Printer } from 'lucide-react';

export function DatasheetPrintButton() {
    return (
        <button
            type="button"
            data-testid="datasheet-print-button"
            onClick={() => {
                if (typeof window !== 'undefined' && typeof window.print === 'function') {
                    window.print();
                }
            }}
            className="inline-flex items-center gap-2 rounded-sm bg-[var(--brand-accent)] px-4 py-2 text-xs font-bold text-[var(--primary-foreground)] hover:bg-[var(--brand-accent-hover)] transition-colors cursor-pointer print:hidden"
        >
            <Printer className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>Spausdinti / Išsaugoti PDF</span>
        </button>
    );
}
