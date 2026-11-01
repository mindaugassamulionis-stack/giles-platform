// WP-W121-F1 PDP locale regression gate.
//
// EN/PL/RU product pages used to crash with a client-side exception: the
// server page imported COMPATIBILITY_SOURCE_PROVENANCE_COPY (a plain object)
// from the 'use client' industrial-containers-hub module, so RSC handed the
// page a client-reference proxy and COPY['en'|'pl'|'ru'] was undefined. LT
// escaped via a ternary. The fix moved the map to
// src/lib/compatibility-provenance.ts (server-safe).
//
// What this asserts per locale (lt/en/pl/ru), wire level, against a running
// server (dev or `next start`):
//   1. GET /{locale}/products/{SKU} returns 200
//   2. Body is not the Next.js error shell (__next_error__)
//   3. The localized compatibility provenance copy is rendered
//   4. The provenance testid block exists
//
// Usage: node scripts/pdp-locale-regression.mjs
//   env: BASE_URL (default http://127.0.0.1:3012), SKU (default 013G2970)
import { readFileSync } from 'node:fs';

const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:3012';
const SKU = process.env.SKU || '013G2970';

const PROVENANCE_MARKERS = {
    lt: 'Šaltinis: Gamintojo techninis katalogas',
    en: 'Source: Manufacturer technical catalog',
    pl: 'Źródło: Katalog techniczny producenta',
    ru: 'Источник: Технический каталог производителя',
};

let failures = 0;
for (const [locale, marker] of Object.entries(PROVENANCE_MARKERS)) {
    const url = `${BASE_URL}/${locale}/products/${SKU}`;
    let body = '';
    let status = 0;
    try {
        const res = await fetch(url, { redirect: 'manual' });
        status = res.status;
        body = await res.text();
    } catch (e) {
        console.error(`FAIL ${locale}: request error ${e.message}`);
        failures += 1;
        continue;
    }
    const checks = [
        status === 200,
        !body.includes('__next_error__'),
        body.includes(marker),
        body.includes("data-testid=\"compatibility-source-provenance\""),
    ];
    if (checks.every(Boolean)) {
        console.log(`PASS ${locale}: ${status}, provenance rendered`);
    } else {
        failures += 1;
        console.error(
            `FAIL ${locale}: status=${status} errorShell=${body.includes('__next_error__')} marker=${checks[2]} testid=${checks[3]}`,
        );
    }
}

// Guard: the copy must never move back into the 'use client' hub module.
const hub = readFileSync(new URL('../src/components/industrial-containers-hub.tsx', import.meta.url), 'utf-8');
if (hub.includes('export const COMPATIBILITY_SOURCE_PROVENANCE_COPY')) {
    console.error('FAIL guard: hub re-exports the provenance copy (RSC proxy trap)');
    failures += 1;
} else {
    console.log('PASS guard: hub does not export the provenance copy');
}

if (failures > 0) {
    console.error(`pdp-locale-regression: ${failures} failure(s)`);
    process.exit(1);
}
console.log('pdp-locale-regression: all locales green');
