import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';
import {
    getGilesCatalogSnapshot,
    getGilesCatalogProductByIdOrSlug,
    invalidateGilesCatalogSnapshotCache,
} from './giles-catalog-snapshot';
import { resolveProductSeriesVisual } from './product-visual-resolver';
import { resolvePdpEngineeringProfile } from './lithuanian-boiler-compatibility';

const repoRoot = path.resolve(__dirname, '../..');
const publicDir = path.join(repoRoot, 'public');
const catalogJsonPath = path.join(repoRoot, 'src/data/giles-catalog-6337.json');

describe('W111-A1: Real Manufacturer Image Extraction & 6,337-SKU Individual Technical Description/Specification Enrichment', () => {
    it('1) extracts and builds >= 90 distinct verified .webp manufacturer and series images in public/manufacturer-assets/ with > 0 bytes', () => {
        const haierDir = path.join(publicDir, 'manufacturer-assets/haier');
        const seriesDir = path.join(publicDir, 'manufacturer-assets/series');

        expect(fs.existsSync(haierDir)).toBe(true);
        expect(fs.existsSync(seriesDir)).toBe(true);

        const haierFiles = fs
            .readdirSync(haierDir)
            .filter((f) => f.endsWith('.webp'))
            .map((f) => path.join(haierDir, f));
        const seriesFiles = fs
            .readdirSync(seriesDir)
            .filter((f) => f.endsWith('.webp'))
            .map((f) => path.join(seriesDir, f));

        expect(haierFiles.length).toBeGreaterThanOrEqual(35);
        expect(seriesFiles.length).toBeGreaterThanOrEqual(65);

        const allManufacturerAssets = [...haierFiles, ...seriesFiles];
        expect(allManufacturerAssets.length).toBeGreaterThanOrEqual(90);

        for (const filePath of allManufacturerAssets) {
            const stat = fs.statSync(filePath);
            expect(stat.size).toBeGreaterThan(500);
        }
    });

    it('2) enriches all 6,337 SKUs in src/data/giles-catalog-6337.json with 100% unique SKU-specific descriptions, >= 6 structured spec keys, and verified image paths on disk (>= 90 distinct images)', () => {
        const raw = JSON.parse(fs.readFileSync(catalogJsonPath, 'utf8')) as {
            products: Array<{
                id: string;
                sku: string;
                ean?: string;
                name: string;
                nameLt?: string;
                brandName?: string;
                categoryName?: string;
                image?: string;
                rawImageUrl?: string;
                description?: string;
                descriptionLt?: string;
                specs?: Record<string, string>;
                technicalSpecs?: Record<string, string>;
            }>;
        };

        expect(raw.products).toHaveLength(6337);

        const uniqueDescriptions = new Set<string>();
        const distinctUsedImages = new Set<string>();
        const verifiedDiskCache = new Map<string, boolean>();
        let brokenImageCount = 0;
        let shortOrMissingDescCount = 0;
        let emDashCount = 0;
        let insufficientSpecsCount = 0;

        const requiredSpecKeys = [
            'Gamintojas',
            'Prekės kodas (SKU)',
            'EAN-13 kodas',
            'Gamintojo serija',
            'Pajungimo matmuo / sriegis',
            'Vardinis slėgis / galia / tūris',
            'Korpuso / mazgo medžiaga',
            'Taikymo sritis',
        ];

        for (const item of raw.products) {
            const imgPath = item.image || item.rawImageUrl || '';
            if (!/^\/(manufacturer-assets|studio-assets|images)\/.+\.webp$/.test(imgPath)) {
                brokenImageCount++;
            } else {
                let existsOk = verifiedDiskCache.get(imgPath);
                if (existsOk === undefined) {
                    const diskPath = path.join(publicDir, imgPath.replace(/^\//, ''));
                    existsOk = fs.existsSync(diskPath) && fs.statSync(diskPath).size > 0;
                    verifiedDiskCache.set(imgPath, existsOk);
                }
                if (!existsOk) {
                    brokenImageCount++;
                } else {
                    distinctUsedImages.add(imgPath);
                }
            }

            const desc = (item.description || item.descriptionLt || '').trim();
            if (desc.length < 80 || !desc.includes(item.sku)) {
                shortOrMissingDescCount++;
            }
            if (desc.includes('\u2014')) {
                emDashCount++;
            }
            uniqueDescriptions.add(desc);

            const specs = item.technicalSpecs || item.specs || {};
            const specKeys = Object.keys(specs);
            if (
                specKeys.length < 8 ||
                specs['Prekės kodas (SKU)'] !== item.sku ||
                requiredSpecKeys.some((k) => !specs[k] || specs[k].includes('\u2014'))
            ) {
                insufficientSpecsCount++;
            }
        }

        expect(brokenImageCount).toBe(0);
        expect(shortOrMissingDescCount).toBe(0);
        expect(emDashCount).toBe(0);
        expect(insufficientSpecsCount).toBe(0);
        expect(uniqueDescriptions.size).toBe(6337);
        expect(distinctUsedImages.size).toBeGreaterThanOrEqual(90);
    });

    it('3) resolves >= 90 distinct verified product images through getGilesCatalogSnapshot() and resolveProductSeriesVisual() and wires SKU specs into PDP engineering profile', () => {
        invalidateGilesCatalogSnapshotCache();
        const snap = getGilesCatalogSnapshot();
        expect(snap.products).toHaveLength(6337);

        const snapshotImages = new Set<string>();
        const seriesResolvedImages = new Set<string>();
        const diskCheckCache = new Map<string, boolean>();
        let missingSnapshotImgCount = 0;

        for (const prod of snap.products) {
            const imgUrl = prod.imageUrl || '';
            if (!imgUrl) {
                missingSnapshotImgCount++;
            } else {
                let ok = diskCheckCache.get(imgUrl);
                if (ok === undefined) {
                    const diskPath = path.join(publicDir, imgUrl.replace(/^\//, ''));
                    ok = fs.existsSync(diskPath) && fs.statSync(diskPath).size > 0;
                    diskCheckCache.set(imgUrl, ok);
                }
                if (!ok) missingSnapshotImgCount++;
                snapshotImages.add(imgUrl);
            }

            const seriesVis = resolveProductSeriesVisual({
                sku: prod.sku,
                title: prod.nameLt || prod.name,
                brand: prod.brandName,
                category: prod.categoryName,
                imageUrl: prod.imageUrl,
            });
            if (seriesVis.image) {
                seriesResolvedImages.add(seriesVis.image);
            }
        }

        expect(missingSnapshotImgCount).toBe(0);
        expect(snapshotImages.size).toBeGreaterThanOrEqual(90);
        expect(seriesResolvedImages.size).toBeGreaterThanOrEqual(90);

        const sampleHaier = getGilesCatalogProductByIdOrSlug('AW082HUGHA');
        expect(sampleHaier).not.toBeNull();
        expect(sampleHaier?.specs).toBeDefined();
        expect(Object.keys(sampleHaier?.specs || {}).length).toBeGreaterThanOrEqual(8);

        const pdpProfile = resolvePdpEngineeringProfile(
            {
                id: sampleHaier!.id,
                sku: sampleHaier!.sku,
                name: sampleHaier!.name,
                brand: sampleHaier!.brand,
                category: sampleHaier!.category,
                description: sampleHaier!.description,
                specs: sampleHaier!.specs,
            },
            'lt',
        );
        expect(pdpProfile.specRows.length).toBeGreaterThanOrEqual(8);
        const specParams = pdpProfile.specRows.map((r) => r.param);
        expect(specParams).toContain('Gamintojo serija');
        expect(specParams).toContain('Pajungimo matmuo / sriegis');
        expect(specParams).toContain('Vardinis slėgis / galia / tūris');
        expect(specParams).toContain('Korpuso / mazgo medžiaga');
    });
});
