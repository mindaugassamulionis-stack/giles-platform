'use client';

// W22-D1 T3: heat load band calculator (orientational only).
// All math + sources live in lib/heat-load (tested); this UI only renders
// the band + mandatory disclaimer and can hand the result to the RFQ form.

import { useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import { HEAT_COEFFICIENTS, CLIMATE_ZONES, calcHeatLoadBand } from '../lib/heat-load';

export function HeatLoadCalculator() {
    const t = useTranslations();
    const locale = useLocale();
    const isEn = locale.startsWith('en');

    const [area, setArea] = useState('100');
    const [height, setHeight] = useState('2.5');
    const [era, setEra] = useState(HEAT_COEFFICIENTS[0].id);
    const [zoneId, setZoneId] = useState(CLIMATE_ZONES[0].id);

    const band = useMemo(
        () => calcHeatLoadBand({
            areaM2: Number(area),
            ceilingHeightM: Number(height),
            era,
            zoneId,
        }),
        [area, height, era, zoneId],
    );

    const inputCls = 'w-full rounded-[2px] border border-border bg-card px-4 py-3 text-foreground focus:outline-none focus:border-[var(--primary)] transition-colors font-mono';
    const labelCls = 'block font-mono text-xs uppercase tracking-wide text-muted-foreground mb-2';

    return (
        <div className="grid gap-8 lg:grid-cols-2">
            {/* Inputs */}
            <form
                className="border border-border bg-card rounded-[2px] p-6 md:p-8 space-y-5"
                onSubmit={(e) => e.preventDefault()}
            >
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="hl-area" className={labelCls}>{t('toolsPage.areaLabel')}</label>
                        <input
                            id="hl-area"
                            type="number"
                            min="1"
                            step="1"
                            inputMode="numeric"
                            value={area}
                            onChange={(e) => setArea(e.target.value)}
                            className={inputCls}
                        />
                    </div>
                    <div>
                        <label htmlFor="hl-height" className={labelCls}>{t('toolsPage.heightLabel')}</label>
                        <input
                            id="hl-height"
                            type="number"
                            min="1"
                            max="10"
                            step="0.1"
                            inputMode="decimal"
                            value={height}
                            onChange={(e) => setHeight(e.target.value)}
                            className={inputCls}
                        />
                    </div>
                </div>

                <div>
                    <label htmlFor="hl-era" className={labelCls}>{t('toolsPage.eraLabel')}</label>
                    <select id="hl-era" value={era} onChange={(e) => setEra(e.target.value)} className={inputCls}>
                        {HEAT_COEFFICIENTS.map((row) => (
                            <option key={row.id} value={row.id}>
                                {isEn ? row.labelEn : row.labelLt}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label htmlFor="hl-zone" className={labelCls}>{t('toolsPage.zoneLabel')}</label>
                    <select id="hl-zone" value={zoneId} onChange={(e) => setZoneId(e.target.value)} className={inputCls}>
                        {CLIMATE_ZONES.map((z) => (
                            <option key={z.id} value={z.id}>
                                {isEn ? z.labelEn : z.labelLt}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Source-cited coefficient table (the numbers ARE the content) */}
                <div className="border border-border rounded-[2px] divide-y divide-border font-mono text-xs">
                    {HEAT_COEFFICIENTS.map((row) => (
                        <div key={row.id} className="flex justify-between gap-4 px-4 py-2.5">
                            <span className="text-muted-foreground">{isEn ? row.labelEn : row.labelLt}</span>
                            <span className="font-semibold text-foreground whitespace-nowrap">
                                {row.wPerM2Low}–{row.wPerM2High} W/m²
                            </span>
                        </div>
                    ))}
                </div>
                <p className="font-mono text-[11px] text-muted-foreground">
                    {t('toolsPage.sourceLabel')}: {band?.coefficient.source ?? HEAT_COEFFICIENTS[0].source}
                </p>
            </form>

            {/* Result — a BAND, never a single exact kW (plan §6 T3) */}
            <div className="border-2 border-[var(--primary)]/40 bg-card rounded-[2px] p-6 md:p-8 flex flex-col">
                <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--primary)] mb-4">
                    {t('toolsPage.resultBand')}
                </p>
                {band ? (
                    <>
                        <p className="font-mono text-4xl md:text-5xl font-bold text-foreground">
                            {band.kwLow.toFixed(1)}–{band.kwHigh.toFixed(1)}
                            <span className="text-xl text-muted-foreground ml-2">kW</span>
                        </p>
                        <p className="mt-2 font-mono text-sm text-muted-foreground">
                            {area} m² × {height} m · {isEn ? band.zone.labelEn : band.zone.labelLt} ×{band.zone.multiplier.toFixed(2)}
                        </p>

                        <p role="note" className="mt-6 text-sm text-muted-foreground leading-relaxed border-l-2 border-[var(--data-warn)] pl-4">
                            {t('toolsPage.disclaimer')}
                        </p>

                        <Link
                            href={`/uzklausa?kodas=${encodeURIComponent(`kW ${band.kwLow.toFixed(1)}-${band.kwHigh.toFixed(1)}`)}`}
                            className="mt-auto pt-8 inline-flex h-12 items-center justify-center rounded-[2px] bg-[var(--accent)] px-8 text-sm font-bold text-white transition-colors duration-150 hover:bg-[var(--accent-hover)]"
                        >
                            {t('toolsPage.sendRfq')}
                        </Link>
                    </>
                ) : (
                    <p role="alert" className="text-sm text-[var(--data-warn)]">{t('toolsPage.invalidInput')}</p>
                )}
            </div>
        </div>
    );
}
