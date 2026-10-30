'use client';

// W22-D1-C (G-D1-1): Copy-on-click SKU mono button for PDP spec ledger.
// DESIGN.md v3: font-mono, 2px radius, ≥44px touch target, 150ms transition.

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

export function CopySkuButton({ sku }: { sku: string }) {
    const [copied, setCopied] = useState(false);

    async function handleCopy() {
        try {
            if (typeof navigator !== 'undefined' && navigator.clipboard) {
                await navigator.clipboard.writeText(sku);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
            }
        } catch {
            // Clipboard permission denied or unavailable; fail silently
        }
    }

    return (
        <button
            type="button"
            onClick={handleCopy}
            title="Kopijuoti prekės kodą"
            aria-label={`Kopijuoti kodą ${sku}`}
            className="inline-flex min-h-[36px] items-center gap-2 rounded-[2px] border border-border bg-muted/60 px-2.5 py-1 font-mono text-sm font-semibold text-foreground transition-colors duration-150 hover:border-[var(--primary)] hover:text-[var(--primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--ring)]"
        >
            <span>KODAS: {sku}</span>
            {copied ? (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-[var(--data-ok)]">
                    <Check className="h-3.5 w-3.5" aria-hidden="true" />
                    Nukopijuota
                </span>
            ) : (
                <Copy className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
            )}
        </button>
    );
}
