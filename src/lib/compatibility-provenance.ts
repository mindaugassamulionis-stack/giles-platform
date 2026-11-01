// WP-W121-F1: server-safe compatibility provenance copy.
//
// This map used to live in industrial-containers-hub.tsx, a 'use client'
// module. Server components that import plain-object exports from a client
// module receive RSC client-reference proxies, so
// COMPATIBILITY_SOURCE_PROVENANCE_COPY['en' | 'pl' | 'ru'] was undefined and
// the EN/PL/RU PDP crashed on `.standardSource` (the lt branch escaped via a
// ternary). Keep data exports for server pages in lib modules like this one.
import type { AppLocale } from '../i18n/routing';

export const COMPATIBILITY_SOURCE_PROVENANCE_COPY: Record<
    AppLocale,
    {
        standardSource: string;
        retrofitCaveat: string;
    }
> = {
    lt: {
        standardSource:
            'Šaltinis: Gamintojo techninis katalogas (Danfoss / IMI Hydronic / HERZ / Haier / Gorenje 2025–2026) ir LST EN 215 / EN 12828 / EN 303-5 standartas',
        retrofitCaveat:
            'Patikslinimo pastaba: Kieto kuro katilų durelių angos ir flanšo matmenys priklauso nuo katilo pagaminimo metų ir kW modifikacijos – prieš užsakant durelių perdarymo komplektą ar degiklį, tikslius matmenis pasitikslinkite pagal katilo techninį pasą arba su „Gilės inžinerijos“ inžinieriumi (+370 611 19158).',
    },
    en: {
        standardSource:
            'Source: Manufacturer technical catalog (Danfoss / IMI Hydronic / HERZ / Haier / Gorenje 2025–2026) and LST EN 215 / EN 12828 / EN 303-5 standard',
        retrofitCaveat:
            'Verification note: Solid-fuel boiler door aperture and flange dimensions vary by production year and kW rating – before ordering a door conversion kit or pellet burner, verify exact dimensions against the boiler passport or with a „Gilės inžinerija“ engineer (+370 611 19158).',
    },
    pl: {
        standardSource:
            'Źródło: Katalog techniczny producenta (Danfoss / IMI Hydronic / HERZ / Haier / Gorenje 2025–2026) oraz norma LST EN 215 / EN 12828 / EN 303-5',
        retrofitCaveat:
            'Uwaga weryfikacyjna: Wymiary otworu drzwiczek i kołnierza kotłów stałopalnych zależą od roku produkcji i mocy (kW) – przed zamówieniem zestawu konwersyjnego lub palnika zweryfikuj wymiary z dokumentacją kotła lub inżynierem „Gilės inžinerija” (+370 611 19158).',
    },
    ru: {
        standardSource:
            'Источник: Технический каталог производителя (Danfoss / IMI Hydronic / HERZ / Haier / Gorenje 2025–2026) и стандарт LST EN 215 / EN 12828 / EN 303-5',
        retrofitCaveat:
            'Примечание по проверке: Размеры проема дверец и фланца твердотопливных котлов зависят от года выпуска и мощности (кВт) – перед заказом комплекта переоборудования или горелки уточните размеры по техпаспорту котла или с инженером «Gilės inžinerija» (+370 611 19158).',
    },
};
