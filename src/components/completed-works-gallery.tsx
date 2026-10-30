'use client';

import React from 'react';
import { ZoomIn } from 'lucide-react';
import { assetUrl } from '../lib/api';
import type { AppLocale } from '../i18n/routing';
import type { GilesCompletedWorkItem } from '../lib/giles-completed-works-data';
import { INDUSTRIAL_CONTAINER_SYSTEMS } from './industrial-containers-hub';

export function resolveContainerSystemIdForWork(work: GilesCompletedWorkItem): string {
    const text = `${work.id} ${work.title} ${work.boilerModel} ${work.powerKw}`.toLowerCase();
    if (text.includes('darbas-07') || text.includes('gk-750') || text.includes('750')) {
        return 'gk-750';
    }
    if (text.includes('darbas-08') || text.includes('2,0 mw') || text.includes('2.0 mw') || text.includes('modulin')) {
        return 'moduline-2000';
    }
    if (text.includes('darbas-09') || text.includes('nuom') || text.includes('mobili')) {
        return 'mobili-500';
    }
    if (text.includes('darbas-14') || text.includes('bioduj') || text.includes('biogas')) {
        return 'bioduju-pramonine';
    }
    if (text.includes('darbas-16') || text.includes('karšto oro') || text.includes('80–190')) {
        return 'karsto-oro-80-190';
    }
    return 'gk-500';
}

export function CompletedWorksGallery({
    works,
    locale,
    onSelectSystemId,
}: {
    works: GilesCompletedWorkItem[];
    locale: AppLocale;
    onSelectSystemId: (systemId: string) => void;
}) {
    return (
        <div
            data-testid="completed-works-gallery-grid"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 border-t border-l border-[#E2DDD3]"
        >
            {works.map((work) => {
                const matchedSystemId = resolveContainerSystemIdForWork(work);
                const matchedSys =
                    INDUSTRIAL_CONTAINER_SYSTEMS.find((s) => s.id === matchedSystemId) ||
                    INDUSTRIAL_CONTAINER_SYSTEMS[0];
                return (
                    <article
                        key={work.id}
                        data-testid={`completed-work-card-${work.id}`}
                        onClick={() => onSelectSystemId(matchedSys.id)}
                        className="border-r border-b border-[#E2DDD3] bg-white flex flex-col justify-between cursor-pointer hover:bg-[#FAF9F6] transition-colors"
                    >
                        <div>
                            <div className="group relative h-56 bg-[#EEEBE4] border-b border-[#E2DDD3] p-4 flex items-center justify-center overflow-hidden">
                                <img
                                    src={assetUrl(work.imageUrl)}
                                    alt={work.title}
                                    className="max-h-full max-w-full object-contain brightness-105 contrast-105 transition-transform duration-200 group-hover:scale-105"
                                />
                                <span className="absolute left-3 top-3 bg-[#11161B] text-white px-2.5 py-1 tabular-nums text-xs font-bold">
                                    {work.powerKw} · {work.location}
                                </span>
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onSelectSystemId(matchedSys.id);
                                    }}
                                    aria-label={`Padidinti nuotrauką ir techninį brėžinį: ${work.title}`}
                                    className="absolute right-3 bottom-3 bg-white border border-[#11161B] text-[#11161B] px-2.5 py-1.5 text-xs font-extrabold inline-flex items-center gap-1.5 cursor-pointer min-h-[38px]"
                                >
                                    <ZoomIn className="w-3.5 h-3.5 text-[#C2410C] shrink-0" aria-hidden="true" />
                                    <span>Padidinti nuotrauką ir techninį brėžinį</span>
                                </button>
                            </div>
                            <div className="p-5 space-y-2">
                                <h3 className="text-base font-extrabold text-[#11161B] leading-snug text-balance">
                                    {work.title}
                                </h3>
                                <p className="text-xs text-[#2A323B] leading-relaxed">
                                    {work.scopeExecuted}
                                </p>
                            </div>
                        </div>
                        <div className="px-5 pb-5">
                            <div className="pt-3 border-t border-[#E2DDD3] flex items-center justify-between gap-2 text-xs">
                                <span className="font-bold text-[#157A3B]">
                                    {work.resultMetric}
                                </span>
                                <span className="font-extrabold text-[#C2410C] underline">
                                    {locale === 'en'
                                        ? 'Open CAD & 12-Point Dossier'
                                        : locale === 'pl'
                                          ? 'Otwórz CAD i paszport (12 pkt)'
                                          : locale === 'ru'
                                            ? 'Открыть CAD и техпаспорт'
                                            : 'Atidaryti CAD brėžinį ir 12 p. pasą'}
                                </span>
                            </div>
                        </div>
                    </article>
                );
            })}
        </div>
    );
}
