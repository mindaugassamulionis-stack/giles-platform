// WP-W121-F1 regression: EN/PL/RU PDP crashed because the server page imported
// COMPATIBILITY_SOURCE_PROVENANCE_COPY (a plain object) from a 'use client'
// module — React Server Components replace such exports with client-reference
// proxies, so COPY['en'] was undefined and .standardSource threw. The map must
// live in a server-safe lib module and the client hub must not export it.
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { COMPATIBILITY_SOURCE_PROVENANCE_COPY } from './compatibility-provenance';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const readSrc = (rel: string) => readFileSync(join(repoRoot, rel), 'utf-8');

describe('COMPATIBILITY_SOURCE_PROVENANCE_COPY', () => {
    it('has non-empty standardSource + retrofitCaveat for all four locales', () => {
        for (const loc of ['lt', 'en', 'pl', 'ru'] as const) {
            expect(COMPATIBILITY_SOURCE_PROVENANCE_COPY[loc], loc).toBeDefined();
            expect(COMPATIBILITY_SOURCE_PROVENANCE_COPY[loc].standardSource.length).toBeGreaterThan(20);
            expect(COMPATIBILITY_SOURCE_PROVENANCE_COPY[loc].retrofitCaveat.length).toBeGreaterThan(20);
        }
    });

    it('preserves Lithuanian diacritics in the lt entries', () => {
        expect(COMPATIBILITY_SOURCE_PROVENANCE_COPY.lt.standardSource).toContain('Šaltinis');
        expect(COMPATIBILITY_SOURCE_PROVENANCE_COPY.lt.retrofitCaveat).toContain('inžinieriumi');
    });

    it('is not exported from the use-client hub module (RSC proxy trap)', () => {
        const hub = readSrc('src/components/industrial-containers-hub.tsx');
        expect(hub.startsWith("'use client'")).toBe(true);
        expect(hub).not.toContain('export const COMPATIBILITY_SOURCE_PROVENANCE_COPY');
    });

    it('server PDP page imports the copy from the server-safe lib', () => {
        const page = readSrc('src/app/[locale]/products/[id]/page.tsx');
        expect(page).toContain("from '../../../../lib/compatibility-provenance'");
        expect(page).not.toContain(
            "COMPATIBILITY_SOURCE_PROVENANCE_COPY } from '../../../../components/industrial-containers-hub'",
        );
    });
});
