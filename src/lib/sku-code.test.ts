/**
 * W22-D1 T1 remainder: SKU paste tolerance.
 * Contract: installer pastes codes in any of the real-world shapes —
 * `88.20.411` (dotted), `7 736 900 742` (spaced EAN), `013G6075` (plain) —
 * and multi-code pastes split into a pin set. Normalization strips spaces,
 * dots, hyphens and control chars, uppercases; parseSkuQuery also accepts
 * comma/semicolon/newline separated lists.
 */
import { describe, expect, it } from 'vitest';
import {
    normalizeSkuCode,
    parseSkuQuery,
    tokenizeHvacSearchQuery,
    expandHvacSearchTokenSynonyms,
    scoreProductRecordForSearchQuery,
} from './sku-code';
import { formatCleanCatalogProductTitle } from './product-visuals';

describe('W22-D1 T1: SKU paste normalization', () => {
    it('normalizes dotted codes', () => {
        expect(normalizeSkuCode('88.20.411')).toBe('8820411');
    });

    it('normalizes spaced codes (EAN blocks)', () => {
        expect(normalizeSkuCode('7 736 900 742')).toBe('7736900742');
    });

    it('keeps alphanumeric codes, uppercases, strips hyphens', () => {
        expect(normalizeSkuCode('013G6075')).toBe('013G6075');
        expect(normalizeSkuCode('ra-n013g0011')).toBe('RAN013G0011');
    });

    it('trims and collapses whitespace before stripping', () => {
        expect(normalizeSkuCode('  88.20.411 ')).toBe('8820411');
    });

    it('empty/whitespace-only input normalizes to empty string', () => {
        expect(normalizeSkuCode('   ')).toBe('');
        expect(normalizeSkuCode('...')).toBe('');
    });

    it('multi-code paste splits on comma, semicolon and newline runs', () => {
        expect(parseSkuQuery('88.20.411, 013G6075')).toMatchObject({
            codes: ['8820411', '013G6075'],
            rawTokens: ['88.20.411', '013G6075'],
        });
        expect(parseSkuQuery('88.20.411;013G6075\n7 736 900 742')).toMatchObject({
            codes: ['8820411', '013G6075', '7736900742'],
            rawTokens: ['88.20.411', '013G6075', '7 736 900 742'],
        });
    });

    it('single code paste yields a one-element set', () => {
        expect(parseSkuQuery('013G6075').codes).toEqual(['013G6075']);
        expect(parseSkuQuery('013G6075').isMultiCode).toBe(false);
    });

    it('multi-code paste is flagged', () => {
        expect(parseSkuQuery('88.20.411 013G6075').isMultiCode).toBe(true);
    });

    it('ordinary words are not treated as codes-only (free text passes through)', () => {
        const parsed = parseSkuQuery('kampinis vožtuvas danfoss');
        expect(parsed.codes).toEqual([]);
        expect(parsed.isMultiCode).toBe(false);
        // free-text search term survives normalization for ILIKE fallback
        expect(parsed.rawQuery).toBe('kampinis vožtuvas danfoss');
    });
});

// W22-D1 SECFIX F3 (security review .runtime/state/W22-D1-SECREVIEW.md §2 F3):
// pasted code lists feed a SQL IN-list — cap the parsed set so a huge paste
// cannot build an oversized IN query (values are param-bound; this is a size
// bound, not an injection fix).
describe('W22-D1 SECFIX F3: SKU code list bound', () => {
    it('caps parsed codes at MAX_SKU_CODES=20 (first 20 kept, in order)', () => {
        const pasted = Array.from({ length: 25 }, (_, i) => `88.20.4${String(i).padStart(2, '0')}`).join(', ');
        const parsed = parseSkuQuery(pasted);
        expect(parsed.codes.length).toBe(20);
        expect(parsed.rawTokens.length).toBe(20);
        expect(parsed.codes[0]).toBe('8820400');
        expect(parsed.codes[19]).toBe('8820419');
        expect(parsed.isMultiCode).toBe(true);
    });

    it('a 20-code paste passes through untouched', () => {
        const pasted = Array.from({ length: 20 }, (_, i) => `013G60${String(i).padStart(2, '0')}`).join(',');
        const parsed = parseSkuQuery(pasted);
        expect(parsed.codes.length).toBe(20);
        expect(parsed.rawTokens.length).toBe(20);
    });

    it('free-text rawQuery is not truncated by the codes cap', () => {
        const pasted = Array.from({ length: 25 }, (_, i) => `88.20.4${String(i).padStart(2, '0')}`).join(', ');
        expect(parseSkuQuery(pasted).rawQuery).toBe(pasted);
    });
});

describe('W47-A1 Gap 1: /api/search multi-word tokenization, Lithuanian HVAC synonyms & advisor chips', () => {
    const SAMPLE_CATALOG = [
        {
            sku: '1837-00.500',
            titleLt: 'Elektroterminė pavara EMO T, NC 230V/1m',
            titleEn: 'Thermoelectric actuator EMO T 230V NC',
            brandName: 'IMI Heimeier',
        },
        {
            sku: '9330-06.800',
            titleLt: 'Kolektorius Dynacon Eclipse 6 žiedų',
            titleEn: 'Manifold Dynacon Eclipse 6 loops',
            brandName: 'IMI Heimeier',
        },
        {
            sku: '9330-08.800',
            titleLt: 'Kolektorius Dynacon Eclipse 8 žiedų',
            titleEn: 'Manifold Dynacon Eclipse 8 loops',
            brandName: 'IMI Heimeier',
        },
        {
            sku: '7101003',
            titleLt: 'Išsiplėtimo indas Statico-SD 25.3 (3 bar)',
            titleEn: 'Expansion vessel Statico-SD 25.3',
            brandName: 'IMI Pneumatex',
        },
        {
            sku: '7109002',
            titleLt: 'Tvirtinimo konsolė DSV 300-D Statico indams',
            titleEn: 'Mounting bracket DSV 300-D for Statico',
            brandName: 'IMI Pneumatex',
        },
        {
            sku: '52-151-020',
            titleLt: 'STAD BAL.VALVE BALANCING PRE-SETTING MEASURING SHUT-OFF WITHOUT DRAINING PN20 DN20 G3/4',
            titleEn: 'STAD balancing valve DN20',
            brandName: 'IMI Hydronic',
        },
        {
            sku: '013G2970',
            titleLt: 'Standartinis, įmontuotas daviklis su dujinu užpildu, temp. ribos 5-21 °C.',
            titleEn: 'Danfoss RA 2970 sensor',
            brandName: 'Danfoss',
        },
    ];

    it('matches all 7 benchmark queries (termopavara 230V + 6 AI Advisor quick-filter chips) with allTokensMatched=true', () => {
        const queries = [
            { q: 'termopavara 230V', expectedSku: '1837-00.500' },
            { q: 'EMO T 230V', expectedSku: '1837-00.500' },
            { q: 'Dynacon Eclipse 6', expectedSku: '9330-06.800' },
            { q: 'Dynacon Eclipse 8', expectedSku: '9330-08.800' },
            { q: 'Statico SD', expectedSku: '7101003' },
            { q: 'Statico konsolė', expectedSku: '7109002' },
            { q: 'IMI TA STAD', expectedSku: '52-151-020' },
        ];

        for (const { q, expectedSku } of queries) {
            const tokens = tokenizeHvacSearchQuery(q);
            expect(tokens.length).toBeGreaterThanOrEqual(2);

            const hits = SAMPLE_CATALOG.filter(
                (item) => scoreProductRecordForSearchQuery(item, q).allTokensMatched,
            );
            expect(hits.length).toBeGreaterThanOrEqual(1);
            expect(hits.map((h) => h.sku)).toContain(expectedSku);
        }
    });

    it('expands Lithuanian HVAC stems and clean-formats supplier titles via formatCleanCatalogProductTitle', () => {
        expect(expandHvacSearchTokenSynonyms('termopavara')).toEqual(
            expect.arrayContaining(['termopavara', 'pavara', 'emo', 'ajam']),
        );
        expect(expandHvacSearchTokenSynonyms('kolektoriai')).toEqual(
            expect.arrayContaining(['kolektor', 'dynacon']),
        );
        expect(expandHvacSearchTokenSynonyms('konsolė')).toEqual(
            expect.arrayContaining(['konsol', 'laikikl', 'dsv']),
        );
        expect(
            formatCleanCatalogProductTitle(
                'Standartinis, įmontuotas daviklis su dujinu užpildu, temp. ribos 5-21 °C.',
                '013G2970',
                'Danfoss',
            ),
        ).toBe('Danfoss RA 2970 termostatinė galvutė (5–21 °C)');
    });
});
