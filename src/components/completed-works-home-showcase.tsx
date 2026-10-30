'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ZoomIn, X } from 'lucide-react';
import { assetUrl } from '../lib/api';
import { GILES_COMPLETED_WORKS, type GilesCompletedWorkItem } from '../lib/giles-completed-works-data';

const HOME_FEATURED_WORK_IDS = [
    'darbas-01',
    'darbas-02',
    'darbas-06',
    'darbas-08',
    'darbas-10',
    'darbas-11',
] as const;

export function CompletedWorksHomeShowcase({ locale }: { locale: string }) {
    const [lightboxWork, setLightboxWork] = useState<GilesCompletedWorkItem | null>(null);

    const featuredWorks = HOME_FEATURED_WORK_IDS.map(
        (id) => GILES_COMPLETED_WORKS.find((w) => w.id === id)!,
    ).filter(Boolean);

    useEffect(() => {
        if (!lightboxWork) return;
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setLightboxWork(null);
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [lightboxWork]);

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 border-t border-l border-[#E2DDD3]">
                {featuredWorks.map((pr) => (
                    <article
                        key={pr.id}
                        data-testid={`home-completed-work-${pr.id}`}
                        className="flex flex-col justify-between border-r border-b border-[#E2DDD3] bg-[#FFFFFF] rounded-none overflow-hidden"
                    >
                        <div>
                            <div
                                onClick={() => setLightboxWork(pr)}
                                className="group relative h-52 bg-[#EEEBE4] border-b border-[#E2DDD3] p-4 flex items-center justify-center cursor-zoom-in overflow-hidden"
                            >
                                <img
                                    src={assetUrl(pr.imageUrl)}
                                    alt={pr.title}
                                    className="max-h-full max-w-full object-contain mix-blend-multiply transition-transform duration-200 group-hover:scale-105"
                                />
                                <span className="absolute left-3 top-3 bg-[#11161B] text-white px-2.5 py-1 font-mono text-xs font-bold">
                                    {pr.numLabel} · {pr.location}
                                </span>
                                <span className="absolute left-3 bottom-3 bg-[#C2410C] text-white px-2.5 py-0.5 text-xs font-bold">
                                    {pr.categoryLabel}
                                </span>
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setLightboxWork(pr);
                                    }}
                                    aria-label={`Padidinti ${pr.title} nuotrauką`}
                                    className="absolute right-3 bottom-3 bg-white border border-[#11161B] text-[#11161B] px-2.5 py-1 text-xs font-bold inline-flex items-center gap-1 cursor-pointer min-h-[34px]"
                                >
                                    <ZoomIn className="w-3.5 h-3.5 text-[#C2410C]" />
                                    <span>800×800</span>
                                </button>
                            </div>
                            <div className="p-6 space-y-2.5">
                                <h3 className="text-lg font-extrabold text-[#11161B] leading-snug">
                                    {pr.title}
                                </h3>
                                <p className="text-xs sm:text-sm text-[#5B6470] leading-relaxed">
                                    {pr.scopeExecuted}
                                </p>
                                <div className="pt-2 border-t border-[#E2DDD3] text-xs space-y-1 text-[#2A323B]">
                                    <div>
                                        <span className="text-[#5B6470]">Katilas / Modulis: </span>
                                        <strong className="text-[#11161B]">{pr.boilerModel}</strong>
                                    </div>
                                    <div>
                                        <span className="text-[#5B6470]">Degiklis / Įranga: </span>
                                        <strong className="text-[#11161B]">{pr.burnerOrEquipment}</strong>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="px-6 pb-6 space-y-3">
                            <div className="grid grid-cols-3 gap-2 pt-4 border-t border-[#E2DDD3] text-xs">
                                <div>
                                    <span className="text-[#5B6470] block">Galia</span>
                                    <span className="font-extrabold text-[#11161B] block mt-0.5">
                                        {pr.powerKw}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-[#5B6470] block">Kuras</span>
                                    <span className="font-extrabold text-[#11161B] block mt-0.5">
                                        {pr.fuelOrMedium}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-[#5B6470] block">Rezultatas</span>
                                    <span className="font-extrabold text-[#157A3B] block mt-0.5">
                                        {pr.resultMetric}
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center justify-between gap-2 pt-1">
                                <Link
                                    href={`/${locale}${pr.ctaHref.startsWith('#') ? `/inzinerija${pr.ctaHref}` : pr.ctaHref}`}
                                    className="text-xs font-bold text-[#C2410C] hover:text-[#11161B] underline"
                                >
                                    {pr.ctaLabel}
                                </Link>
                                <button
                                    type="button"
                                    onClick={() => setLightboxWork(pr)}
                                    className="text-xs font-semibold text-[#11161B] hover:text-[#C2410C] cursor-pointer"
                                >
                                    Padidinti foto
                                </button>
                            </div>
                        </div>
                    </article>
                ))}
            </div>

            {lightboxWork && (
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-label={lightboxWork.title}
                    onClick={() => setLightboxWork(null)}
                    className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className="bg-white border-2 border-[#11161B] max-w-4xl w-full max-h-[92vh] overflow-y-auto p-5 sm:p-6 space-y-4"
                    >
                        <div className="flex items-start justify-between gap-4 border-b border-[#E2DDD3] pb-3">
                            <div>
                                <span className="font-mono text-xs font-bold text-[#C2410C] block">
                                    {lightboxWork.numLabel} · {lightboxWork.categoryLabel} · {lightboxWork.location}
                                </span>
                                <h3 className="text-lg sm:text-xl font-extrabold text-[#11161B]">
                                    {lightboxWork.title}
                                </h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setLightboxWork(null)}
                                aria-label="Uždaryti peržiūrą"
                                className="border border-[#11161B] bg-[#F5F3EE] hover:bg-[#11161B] hover:text-white p-2 cursor-pointer min-h-[44px] min-w-[44px] inline-flex items-center justify-center"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="bg-[#EEEBE4] border border-[#E2DDD3] p-4 flex items-center justify-center min-h-[360px] sm:min-h-[460px]">
                            <img
                                src={assetUrl(lightboxWork.imageUrl)}
                                alt={lightboxWork.title}
                                className="max-h-[500px] w-auto object-contain mix-blend-multiply"
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-[#F5F3EE] border border-[#E2DDD3] p-4 text-xs">
                            <div>
                                <span className="text-[#5B6470] block">Katilas / Modulis</span>
                                <strong className="text-[#11161B]">{lightboxWork.boilerModel}</strong>
                            </div>
                            <div>
                                <span className="text-[#5B6470] block">Degiklis ir įranga</span>
                                <strong className="text-[#11161B]">{lightboxWork.burnerOrEquipment}</strong>
                            </div>
                            <div>
                                <span className="text-[#5B6470] block">Galia ir rezultatas</span>
                                <strong className="text-[#157A3B]">
                                    {lightboxWork.powerKw} · {lightboxWork.resultMetric}
                                </strong>
                            </div>
                        </div>

                        <p className="text-xs sm:text-sm text-[#2A323B] leading-relaxed">
                            {lightboxWork.scopeExecuted}
                        </p>
                    </div>
                </div>
            )}
        </>
    );
}
