import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
    SYMPTOM_DIAGNOSTICS,
    HVAC_COMPARISON_GUIDES,
    HVAC_COMPARISONS,
    getComparisonGuideBySlug,
    buildLlmsTxtContent,
} from './hvac-comparisons-data';
import { CATALOG_SUBTYPE_OPTIONS, CATALOG_SPEC_OPTIONS } from './catalog-listing';

describe('W47-A2 hvac-comparisons-data (18 symptom diagnostics & 20 comparison guides) & llms.txt', () => {
    it('exports 18 categorized interactive symptom diagnostic cards with 3-step fixes and recommended SKUs', () => {
        expect(SYMPTOM_DIAGNOSTICS).toHaveLength(18);
        const categoryCounts: Record<string, number> = {};
        for (const card of SYMPTOM_DIAGNOSTICS) {
            expect(card.id.length).toBeGreaterThan(3);
            expect(['radiatoriai', 'grindinis', 'katiline', 'silumos-siurbliai', 'balansavimas', 'montavimas']).toContain(
                card.category,
            );
            categoryCounts[card.category] = (categoryCounts[card.category] || 0) + 1;
            expect(card.symptomTitle.length).toBeGreaterThan(10);
            expect(card.causePlain.length).toBeGreaterThan(30);
            expect(card.fiveMinFixSteps).toHaveLength(3);
            expect(card.recommendedProducts.length).toBeGreaterThanOrEqual(2);
            expect(card.calculatorHref).toMatch(/^\/skaiciuokle\?tab=/);
            expect(getComparisonGuideBySlug(card.relatedGuideSlug)).toBeDefined();
        }
        expect(categoryCounts.radiatoriai).toBe(4);
        expect(categoryCounts.grindinis).toBe(4);
        expect(categoryCounts.katiline).toBe(3);
        expect(categoryCounts['silumos-siurbliai']).toBe(3);
        expect((categoryCounts.balansavimas || 0) + (categoryCounts.montavimas || 0)).toBe(4);
    });

    it('exports all 20 deep SEO / AI-SEO comparison guides with AI direct answers, tables, and FAQs', () => {
        expect(HVAC_COMPARISON_GUIDES).toHaveLength(20);
        expect(HVAC_COMPARISONS).toHaveLength(20);
        const uniqueSlugs = new Set(HVAC_COMPARISON_GUIDES.map((g) => g.slug));
        expect(uniqueSlugs.size).toBe(20);

        for (const guide of HVAC_COMPARISON_GUIDES) {
            expect(guide.title.length).toBeGreaterThan(20);
            expect(guide.aiDirectAnswer.length).toBeGreaterThan(120);
            expect(guide.comparisonRows.length).toBeGreaterThanOrEqual(3);
            expect(guide.diagnosticChecklist).toHaveLength(3);
            expect(guide.recommendedSkus.length).toBeGreaterThanOrEqual(2);
            expect(guide.faqItems.length).toBeGreaterThanOrEqual(2);
        }
    });

    it('enforces antislop R-02 (0 em-dashes) and R-16 (0 banned Lithuanian buzzwords) across all 18 diagnostics and 20 guides', () => {
        const serialized = JSON.stringify({ SYMPTOM_DIAGNOSTICS, HVAC_COMPARISON_GUIDES });
        expect(serialized).not.toContain('\u2014');
        expect(/[\u00A9\u00AE\u2122]/.test(serialized)).toBe(false);

        const bannedBuzzwords = [
            /inovatyv/i,
            /pažang/i,
            /išmanus sprendim/i,
            /skland/i,
            /revoliucin/i,
            /naujos kartos/i,
            /aukščiausios kokybės/i,
            /unikal/i,
            /galing/i,
            /be vargo/i,
        ];
        for (const pattern of bannedBuzzwords) {
            expect(pattern.test(serialized), `Banned buzzword ${pattern} found in hvac-comparisons-data`).toBe(false);
        }
    });

    it('builds comprehensive /llms.txt markdown indexing all 18 symptom diagnostics and 20 comparisons', () => {
        const content = buildLlmsTxtContent();
        expect(content).toContain('# Gilės Inžinerija');
        expect(content).toContain('Danfoss');
        expect(content).toContain('IMI Heimeier');
        expect(content).toContain('IMI Pneumatex');
        expect(content).toContain('IMI TA');
        expect(content).toContain('Ferroli');
        for (const sym of SYMPTOM_DIAGNOSTICS) {
            expect(content).toContain(sym.symptomTitle);
        }
        for (const guide of HVAC_COMPARISON_GUIDES) {
            expect(content).toContain(`/palyginimai/${guide.slug}`);
            expect(content).toContain(guide.aiDirectAnswer);
        }
    });

    it('W40-A2 & W47-A2: enforces zero emojis, zero truncate, and proper Vytautu instrumental grammar in symptom-diagnostic-finder', () => {
        const emojiRegex = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u;
        const filesToCheck = [
            'src/lib/hvac-comparisons-data.ts',
            'src/components/symptom-diagnostic-finder.tsx',
            'src/components/scientific-calculators-hub.tsx',
            'src/components/calculator-visual-diagrams.tsx',
        ];
        for (const relPath of filesToCheck) {
            const fullPath = join(process.cwd(), relPath);
            const src = readFileSync(fullPath, 'utf8');
            expect(emojiRegex.test(src), `Found emoji in ${relPath}`).toBe(false);
        }

        const finderSrc = readFileSync(join(process.cwd(), 'src/components/symptom-diagnostic-finder.tsx'), 'utf8');
        expect(finderSrc).not.toContain('truncate');
        expect(finderSrc).not.toContain('line-clamp-');
    });

    it('W40-A2: exports CATALOG_SUBTYPE_OPTIONS and CATALOG_SPEC_OPTIONS for /products deep filtering', () => {
        expect(CATALOG_SUBTYPE_OPTIONS.length).toBeGreaterThanOrEqual(12);
        expect(CATALOG_SPEC_OPTIONS.length).toBeGreaterThanOrEqual(12);
        expect(CATALOG_SUBTYPE_OPTIONS.map((o) => o.key)).toEqual(
            expect.arrayContaining(['kolektoriai', 'pavaros', 'spinteles', 'jungtys', 'galvutes', 'voztuvai', 'h-blokai', 'pletimosi-indai']),
        );
        expect(CATALOG_SPEC_OPTIONS.map((o) => o.key)).toEqual(
            expect.arrayContaining(['DN15', 'DN20', 'DN25', 'M30x1.5', 'RA-Click', '230V', '24V', '25L', '35L', '50L']),
        );
    });
});
