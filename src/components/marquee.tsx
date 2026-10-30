'use client';

const BENEFITS = [
    "EN 12831 SERTIFIKUOTA METODIKA",
    "OFICIALŪS GAMINTOJŲ KODAI (SKU)",
    "TIEKIMAS 1–3 D. D. VISOJE LIETUVOJE",
    "DANFOSS · GRUNDFOS · VIESSMANN · GEBERIT",
    "24 MĖN. GAMINTOJO GARANTIJA",
    "PVM SĄSKAITOS FAKTŪROS"
];

export function Marquee() {
    return (
        <div className="relative py-4 bg-[var(--muted)] border-y border-[var(--border)] overflow-x-auto">
            <div className="container mx-auto px-4 flex flex-wrap items-center justify-between gap-6">
                {BENEFITS.map((benefit, i) => (
                    <div key={i} className="flex items-center gap-3">
                        <span className="font-sans text-xs font-semibold tracking-normal text-[var(--foreground)]">
                            {benefit}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}

