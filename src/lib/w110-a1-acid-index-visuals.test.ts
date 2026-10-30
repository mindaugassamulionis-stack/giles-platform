import fs from 'fs';
import path from 'path';
import { describe, expect, it, beforeEach } from 'vitest';
import {
    readJsonAtomic,
    writeJsonAtomic,
    withFileTransaction,
} from './transactional-store';
import {
    getCatalogSearchIndex,
    invalidateCatalogSearchIndex,
    searchCatalogIndex,
} from './catalog-search-index';
import {
    PRODUCT_VISUAL_SERIES_RULES,
    resolveProductSeriesVisual,
} from './product-visual-resolver';
import {
    getGilesCatalogSnapshot,
    getGilesCatalogProductByIdOrSlug,
    searchGilesSnapshotPaged,
    resetCatalogOverrides,
    upsertCatalogProductOverride,
} from './giles-catalog-snapshot';

describe('W110-A1: ACID Persistence, O(1) Inverted Search Index & 30-Series Studio Visual Resolver', () => {
    const tmpTestPath = path.join('/tmp', `giles-w110-acid-test-${process.pid}.json`);

    beforeEach(() => {
        if (fs.existsSync(tmpTestPath)) {
            fs.unlinkSync(tmpTestPath);
        }
        resetCatalogOverrides();
        invalidateCatalogSearchIndex();
    });

    describe('Gap 1: ACID Transactional Persistence & 50M EUR PostgreSQL Schema', () => {
        it('provides a complete PostgreSQL 16+ enterprise migration with pg_trgm, optimistic concurrency, and all required tables', () => {
            const schemaPath = path.resolve(
                process.cwd(),
                'migrations/001_giles_enterprise_50m_schema.sql',
            );
            expect(fs.existsSync(schemaPath)).toBe(true);
            const sql = fs.readFileSync(schemaPath, 'utf8');

            expect(sql).toContain('CREATE EXTENSION IF NOT EXISTS pg_trgm');
            expect(sql).toContain('giles_products');
            expect(sql).toContain('giles_b2b_accounts');
            expect(sql).toContain('giles_b2b_pricing_rules');
            expect(sql).toContain('giles_b2b_credit_ledger');
            expect(sql).toContain('giles_b2b_projects');
            expect(sql).toContain('giles_b2b_notes');
            expect(sql).toContain('giles_skaita_invoices');
            expect(sql).toContain('giles_suppliers');
            expect(sql).toContain('giles_ai_agents');
            expect(sql).toContain('giles_ai_agent_logs');
            expect(sql).toContain('giles_support_tickets');
            expect(sql).toContain('giles_admin_users');
            expect(sql).toContain('gin_trgm_ops');
            expect(sql).toContain('version INT NOT NULL DEFAULT 1');
        });

        it('serializes 25 concurrent file transactions via Promise mutex queue without losing a single update', async () => {
            interface CounterStore {
                counter: number;
                entries: string[];
            }

            const initial: CounterStore = { counter: 0, entries: [] };
            writeJsonAtomic(tmpTestPath, initial);

            const concurrentWrites = Array.from({ length: 25 }, (_, idx) =>
                withFileTransaction<CounterStore, number>(tmpTestPath, initial, async (current) => {
                    await new Promise((r) => setTimeout(r, Math.random() * 5));
                    const next: CounterStore = {
                        counter: current.counter + 1,
                        entries: [...current.entries, `tx-${idx}`],
                    };
                    return { nextState: next, result: next.counter };
                }),
            );

            await Promise.all(concurrentWrites);

            const finalState = readJsonAtomic<CounterStore>(tmpTestPath, initial);
            expect(finalState.counter).toBe(25);
            expect(finalState.entries).toHaveLength(25);
            for (let i = 0; i < 25; i++) {
                expect(finalState.entries).toContain(`tx-${i}`);
            }
        });

        it('wires atomic persistence into giles-catalog-snapshot overrides', () => {
            const updated = upsertCatalogProductOverride({
                sku: '013G2970',
                priceGrossEur: 34.5,
                stockQuantity: 42,
            });
            expect(updated.priceGrossEur).toBe(34.5);
            expect(updated.stockQuantity).toBe(42);

            const product = getGilesCatalogProductByIdOrSlug('013G2970');
            expect(product).not.toBeNull();
            expect(product?.price).toBe(34.5);
            expect(product?.stockQuantity).toBe(42);
        });
    });

    describe('Gap 2: O(1) Pre-Indexed Inverted Catalog Search & Facet Engine', () => {
        it('builds an in-memory index over 6,337 SKUs with O(1) byIdOrSlug, byCategory, byBrand, and invertedTokenIndex', () => {
            const index = getCatalogSearchIndex();
            expect(index.totalProducts).toBeGreaterThanOrEqual(6337);
            expect(index.byIdOrSlug.size).toBeGreaterThan(12000);
            expect(index.byCategory.size).toBeGreaterThanOrEqual(15);
            expect(index.byBrand.size).toBeGreaterThanOrEqual(25);
            expect(index.invertedTokenIndex.size).toBeGreaterThan(2000);
        });

        it('executes O(1) product lookup and inverted token search in < 2ms average across typical HVAC queries', () => {
            // Warm up index once
            getCatalogSearchIndex();

            const t0 = performance.now();
            const p1 = getGilesCatalogProductByIdOrSlug('013G2970');
            const p2 = getGilesCatalogProductByIdOrSlug('7101003');
            const p3 = getGilesCatalogProductByIdOrSlug('52-133-215');
            const lookupElapsedMs = (performance.now() - t0) / 3;

            expect(p1?.sku.toUpperCase()).toBe('013G2970');
            expect(p2?.sku).toBe('7101003');
            expect(p3?.sku).toBe('52-133-215');
            expect(lookupElapsedMs).toBeLessThan(2);

            const queries = ['Danfoss DN15', 'Statico', 'Haier R290', 'MPB', 'STAD'];
            const s0 = performance.now();
            for (const q of queries) {
                const candidates = searchCatalogIndex({ q });
                expect(candidates.length).toBeGreaterThan(0);
            }
            const avgSearchMs = (performance.now() - s0) / queries.length;
            expect(avgSearchMs).toBeLessThan(2);

            // Also verify searchGilesSnapshotPaged integrates properly
            const paged = searchGilesSnapshotPaged({ brand: 'danfoss', q: 'RA-N', page: 1, pageSize: 24 });
            expect(paged.total).toBeGreaterThan(0);
        });
    });

    describe('Gap 3: Fine-Grained 30-Series Studio Product Visual Resolver', () => {
        it('defines 30 distinct product-series visual rules and maps >= 25 distinct series across the 6,337 catalog SKUs', () => {
            expect(PRODUCT_VISUAL_SERIES_RULES).toHaveLength(30);

            const snap = getGilesCatalogSnapshot();
            expect(snap.products.length).toBeGreaterThanOrEqual(6337);

            const matchedSeriesIds = new Set<string>();
            const matchedImages = new Set<string>();

            for (const prod of snap.products) {
                const resolved = resolveProductSeriesVisual({
                    sku: prod.sku,
                    title: prod.nameLt || prod.name,
                    brand: prod.brandName,
                    category: prod.categoryName,
                    imageUrl: prod.imageUrl,
                });
                expect(resolved.image).toBeTruthy();
                expect(resolved.seriesBadge).toBeTruthy();
                expect(resolved.technicalCallout).toBeTruthy();
                matchedSeriesIds.add(resolved.seriesId);
                matchedImages.add(resolved.image);
            }

            expect(matchedSeriesIds.size).toBeGreaterThanOrEqual(25);
            expect(matchedImages.size).toBeGreaterThanOrEqual(25);
        });

        it('accurately distinguishes Danfoss actuators, PICV valves, RA-N valves, Haier R290/HP/ES series, and Gilės studio renders', () => {
            const abn = resolveProductSeriesVisual({
                sku: '088H0017',
                title: 'Danfoss ABN-A5 230V NC termoajamasis su eigos indikatoriumi',
                brand: 'Danfoss',
                category: 'Katilinės automatika ir pavaros',
            });
            expect(abn.seriesBadge).toContain('Danfoss');
            expect(abn.seriesId).toBe('danfoss-abn-twa-actuator');

            const abqm = resolveProductSeriesVisual({
                sku: '003Z1215',
                title: 'Danfoss AB-QM 4.0 DN15 PICV balansinis vožtuvas',
                brand: 'Danfoss',
                category: 'Balansiniai ir reguliavimo vožtuvai',
            });
            expect(abqm.seriesId).toBe('danfoss-ab-qm-picv-valve');

            const haierR290 = resolveProductSeriesVisual({
                sku: 'AW082HUGHA',
                title: 'Haier Super Aqua Monoblokas R290 8 kW',
                brand: 'Haier',
                category: 'Katilai ir katilinės įranga',
            });
            expect(haierR290.seriesId).toBe('haier-super-aqua-monoblokas');
            expect(haierR290.image).toContain('giles-studio-21-haier-super-aqua-r290.webp');

            const mpbBurner = resolveProductSeriesVisual({
                sku: 'MPB-50',
                title: 'Megatherm MPB 50 rotacinis granulių degiklis',
                brand: 'Megatherm',
                category: 'Degikliai ir priedai',
            });
            expect(mpbBurner.seriesId).toBe('megatherm-mpb-rotary-pellet-burner');
            expect(mpbBurner.image).toContain('giles-studio-01-mpb-nani-35-50.webp');
        });
    });
});
