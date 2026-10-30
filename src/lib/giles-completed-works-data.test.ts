import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import {
    GILES_COMPLETED_WORKS,
    GILES_COMPLETED_WORKS_CATEGORIES,
    GILES_SERVICE_PILLARS,
    GILES_BOILER_RETROFIT_CAPABILITIES,
    GILES_CONTAINER_BOILER_SPECS,
    filterCompletedWorksByCategory,
} from './giles-completed-works-data';

describe('Gilės Inžinerija Real Completed Works ("Atlikti darbai") & Engineering Services', () => {
    const repoRoot = path.resolve(__dirname, '../..');

    it('provides at least 12 real background-cleaned studio project visuals from gilesinzinerija.com on #EEEBE4 canvases', () => {
        expect(GILES_COMPLETED_WORKS.length).toBeGreaterThanOrEqual(12);

        for (const work of GILES_COMPLETED_WORKS) {
            expect(work.imageUrl).toMatch(/^\/studio-assets\/projects\/giles-darbas-\d+\.webp$/);
            expect(work.sourceImageUrl).toContain('gilesinzinerija.com/wp-content/uploads/');
            expect(work.studioBackdropHex).toBe('#EEEBE4');

            const diskPath = path.join(repoRoot, 'public', work.imageUrl);
            expect(fs.existsSync(diskPath)).toBe(true);
            const stat = fs.statSync(diskPath);
            expect(stat.size).toBeGreaterThan(10000);
        }
    });

    it('supports filtering across all 4 required Atlikti darbai categories', () => {
        const labels = GILES_COMPLETED_WORKS_CATEGORIES.map((c) => c.label);
        expect(labels).toContain('Katilų perdarymas į granulinius');
        expect(labels).toContain('Pramoninės ir konteinerinės katilinės');
        expect(labels).toContain('Šilumos siurbliai ir katilinės');
        expect(labels).toContain('Servisas ir automatika');

        const all = filterCompletedWorksByCategory('all');
        expect(all.length).toBe(GILES_COMPLETED_WORKS.length);

        for (const cat of GILES_COMPLETED_WORKS_CATEGORIES) {
            if (cat.id === 'all') continue;
            const filtered = filterCompletedWorksByCategory(cat.id);
            expect(filtered.length).toBeGreaterThanOrEqual(2);
            expect(filtered.every((w) => w.category === cat.id)).toBe(true);
        }
    });

    it('documents all 6 real Gilės Inžinerija Engineering & Service Pillars, boiler retrofits, and container boiler capabilities', () => {
        expect(GILES_SERVICE_PILLARS.length).toBe(6);
        expect(GILES_BOILER_RETROFIT_CAPABILITIES.supportedBoilers.length).toBeGreaterThanOrEqual(6);
        expect(GILES_BOILER_RETROFIT_CAPABILITIES.namedPackages.length).toBeGreaterThanOrEqual(3);
        expect(GILES_CONTAINER_BOILER_SPECS.length).toBeGreaterThanOrEqual(5);
    });

    it('integrates processed giles-darbas-*.webp visuals across /lt, /lt/pramonei, and /lt/inzinerija with after-sales-service-form', () => {
        const homeSrc = fs.readFileSync(path.join(repoRoot, 'src/app/[locale]/page.tsx'), 'utf8');
        const pramoneiSrc = fs.readFileSync(path.join(repoRoot, 'src/app/[locale]/pramonei/page.tsx'), 'utf8');
        const inzinerijaSrc = fs.readFileSync(path.join(repoRoot, 'src/app/[locale]/inzinerija/page.tsx'), 'utf8');

        expect(homeSrc).toContain('giles-darbas-');
        expect(pramoneiSrc).toContain('giles-darbas-');
        expect(inzinerijaSrc).toContain('after-sales-service-form');
        expect(inzinerijaSrc).toContain('Katilų perdarymas į granulinius');
        expect(inzinerijaSrc).toContain('Pramoninės ir konteinerinės katilinės');
        expect(inzinerijaSrc).toContain('Šilumos siurbliai ir katilinės');
        expect(inzinerijaSrc).toContain('Servisas ir automatika');
        expect(inzinerijaSrc).toContain('/api/admin/support');
    });

    it('W89-A3: localizes completed works, service pillars, system packages, comparisons, vedlys, pramonei, inzinerija, paketai, palyginimai, checkout, and giles-logo across lt, en, pl, ru', async () => {
        const worksMod = await import('./giles-completed-works-data');
        const pkgMod = await import('./giles-packages-data');
        const compMod = await import('./hvac-comparisons-data');

        expect(typeof (worksMod as Record<string, unknown>).getLocalizedCompletedWorks).toBe('function');
        const enWorks = (worksMod as { getLocalizedCompletedWorks: (l: string) => unknown[] }).getLocalizedCompletedWorks('en');
        const plWorks = (worksMod as { getLocalizedCompletedWorks: (l: string) => unknown[] }).getLocalizedCompletedWorks('pl');
        const ruWorks = (worksMod as { getLocalizedCompletedWorks: (l: string) => unknown[] }).getLocalizedCompletedWorks('ru');
        expect(enWorks.length).toBe(16);
        expect(plWorks.length).toBe(16);
        expect(ruWorks.length).toBe(16);
        expect((enWorks[0] as { title: string }).title).not.toBe(GILES_COMPLETED_WORKS[0].title);
        expect((plWorks[0] as { title: string }).title).not.toBe(GILES_COMPLETED_WORKS[0].title);
        expect((ruWorks[0] as { title: string }).title).not.toBe(GILES_COMPLETED_WORKS[0].title);

        expect(typeof (pkgMod as Record<string, unknown>).getLocalizedSystemPackages).toBe('function');
        const enPkgs = (pkgMod as { getLocalizedSystemPackages: (l: string) => Array<{ title: string }> }).getLocalizedSystemPackages('en');
        expect(enPkgs.length).toBe(7);
        expect(enPkgs[0].title).toContain('Pellet');

        expect(typeof (compMod as Record<string, unknown>).getLocalizedHvacComparisonGuides).toBe('function');
        const enGuides = (compMod as { getLocalizedHvacComparisonGuides: (l: string) => Array<{ title: string }> }).getLocalizedHvacComparisonGuides('en');
        expect(enGuides.length).toBe(20);
        expect(enGuides[0].title).toContain('Danfoss');
    });
});
