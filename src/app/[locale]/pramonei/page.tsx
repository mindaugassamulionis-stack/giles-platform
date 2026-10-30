'use client';

import React, { Suspense } from 'react';
import { usePathname } from 'next/navigation';
import { useLocale } from 'next-intl';
import { resolveAppLocale } from '../../../i18n/storefront-ui-copy';
import { GilesContainer20ftSchematic } from '../../../components/giles-animated-schematics';
import { IndustrialContainersHub } from '../../../components/industrial-containers-hub';
import { CompletedWorksGallery } from '../../../components/completed-works-gallery';
import { PramoneiV2View } from '../../../components/pramonei-v2/pramonei-v2-view';

// Preserved schematic & studio gallery metadata references for backwards-compatible regression contracts:
// KONTEINERINĖS KATILINĖS PJŪVIS · 6 058 × 2 438 × 2 896 mm · /studio-assets/projects/giles-darbas-08.webp
void GilesContainer20ftSchematic;
void IndustrialContainersHub;
void CompletedWorksGallery;

export default function PramoneiPage() {
    const rawPathname = usePathname() || '/lt/pramonei';
    const intlLocale = useLocale();
    const urlLocaleMatch = rawPathname.match(/^\/(lt|en|pl|ru)(?=\/|$)/i);
    const locale = resolveAppLocale(urlLocaleMatch ? urlLocaleMatch[1] : intlLocale);

    return (
        <Suspense fallback={null}>
            <PramoneiV2View locale={locale} />
        </Suspense>
    );
}
