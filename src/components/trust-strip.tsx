'use client';

import { Truck, RotateCcw, ShieldCheck } from 'lucide-react';
import { useTranslations } from 'next-intl';

// Trust strip per DESIGN.md v2: Lucide stroke icons (emoji banned).
export function TrustStrip() {
    const t = useTranslations();

    const items = [
        { icon: Truck, title: t('home.trustShip'), desc: t('home.trustShipDesc') },
        { icon: RotateCcw, title: t('home.trustReturns'), desc: t('home.trustReturnsDesc') },
        { icon: ShieldCheck, title: t('home.trustSecure'), desc: t('home.trustSecureDesc') },
    ];

    return (
        <section aria-label={t('home.trustSecure')} className="border-t border-[var(--border)] bg-[var(--surface-card)]">
            <div className="container mx-auto max-w-6xl px-4 py-14 md:py-16 grid gap-6 md:grid-cols-3 text-center">
                {items.map(({ icon: Icon, title, desc }) => (
                    <div key={title} className="rounded-md border border-[var(--border)] bg-[var(--surface-paper)] px-6 py-7 shadow-2xs">
                        <span className="inline-flex w-12 h-12 items-center justify-center rounded-sm bg-[var(--text-primary)] mb-3">
                            <Icon className="w-6 h-6 text-[var(--primary-foreground)]" strokeWidth={1.75} aria-hidden="true" />
                        </span>
                        <h3 className="font-display font-bold text-[var(--text-primary)]">{title}</h3>
                        <p className="text-sm text-[var(--text-secondary)] mt-1">{desc}</p>
                    </div>
                ))}
            </div>
        </section>
    );
}
