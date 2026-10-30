import fs from 'fs';
import path from 'path';
import { beforeEach, describe, expect, it } from 'vitest';
import {
    COMPARE_STORAGE_KEY,
    MAX_COMPARE_ITEMS,
    useCompareStore,
    addCompareItem,
    removeCompareItem,
    toggleCompareItem,
    clearCompare,
    extractCompareTechnicalSpecs,
    filterDiffOnlyCompareRows,
    type CompareItem,
} from '../store/compare';
import {
    calculateApvaSubsidyEstimate,
    APVA_MANDATORY_INVOICE_FIELDS,
    isProductEligibleForApvaSubsidy,
    formatApvaInvoiceComplianceNote,
} from '../components/apva-subsidy-widget';

const repoRoot = path.resolve(__dirname, '../..');

describe('W102-A1: Gap P03 (2-4 SKU Side-by-Side Comparison) & Gap P04 (APVA / LEA State Subsidy Calculator, Eligible PDP Badges & Invoice Compliance Mode)', () => {
    beforeEach(() => {
        clearCompare();
    });

    it('1) Gap P03 Store: persists up to 4 items under localStorage key giles_compare_v1 with addCompareItem, removeCompareItem, toggleCompareItem, and clearCompare', () => {
        expect(COMPARE_STORAGE_KEY).toBe('giles_compare_v1');
        expect(MAX_COMPARE_ITEMS).toBe(4);

        const sample1: CompareItem = {
            id: 'mpb-nani-35',
            sku: 'MPB-NANI-35',
            name: 'Granulių degiklio komplektas Megatherm MPB NANI 8–35 kW su sraigtu',
            brand: 'Megatherm',
            price: 2350,
            categoryName: 'Granulių degikliai',
            subCategoryName: 'Megatherm MPB',
            image: '/images/products/giles-studio-01-mpb-nani-35-50.webp',
            stockQty: 6,
            specs: ['5–35 kW', 'A+', 'Ø90 mm'],
        };
        const sample2: CompareItem = {
            id: 'haier-r290-aw082',
            sku: 'AW082HUGHA',
            name: 'Oras–vanduo šilumos siurblys Haier Super Aqua Monoblock R290 8 kW',
            brand: 'Haier',
            price: 3490,
            categoryName: 'Katilai ir šilumos siurbliai',
            subCategoryName: 'Šilumos siurbliai',
            image: '/images/products/giles-studio-21-haier-super-aqua-r290.webp',
            stockQty: 5,
            specs: ['8,0 kW', 'A+++', 'R290 iki +75 °C'],
        };
        const sample3: CompareItem = {
            id: 'kat-25kw-gi',
            sku: 'KAT-25KW-GI',
            name: 'Plieninis kieto kuro ir granulių katilas KaTRI 25 kW (6 mm plienas)',
            brand: 'Gilės Inžinerija',
            price: 1750,
            categoryName: 'Katilai ir šilumos siurbliai',
            image: '/images/products/giles-studio-25-katri-25kw-pellet-boiler.webp',
            stockQty: 4,
            specs: ['25 kW', 'A+', '6 mm P265GH'],
        };
        const sample4: CompareItem = {
            id: 'pelltech-pv30b',
            sku: 'PV-30B',
            name: 'Granulių degiklis Pelltech PV 30b su savaiminiu ardelių valymu',
            brand: 'Pelltech',
            price: 2190,
            categoryName: 'Granulių degikliai',
            image: '/images/products/giles-studio-05-pelltech-pv20a-kit.webp',
            stockQty: 5,
            specs: ['10–30 kW', 'A+', 'Auto-valymas'],
        };
        const sample5: CompareItem = {
            id: 'zv-100-gorenje',
            sku: 'ZV 100',
            name: 'Kombinuotas vandens šildytuvas ir akumuliacinė talpa Gorenje ZV 100 L',
            brand: 'Gorenje',
            price: 289,
            categoryName: 'Akumuliacinės talpos',
            image: '/images/products/giles-studio-27-centrometal-cas-1001-buffer.webp',
            stockQty: 12,
            specs: ['100 L', 'PN6 bar', 'G 3/4"'],
        };

        addCompareItem(sample1);
        addCompareItem(sample2);
        addCompareItem(sample3);
        addCompareItem(sample4);
        expect(useCompareStore.getState().items).toHaveLength(4);

        // Adding a 5th item caps at 4 items (either replaces oldest or ignores 5th, never exceeding 4)
        addCompareItem(sample5);
        expect(useCompareStore.getState().items.length).toBeLessThanOrEqual(4);

        // Toggle removes an existing item
        const firstId = useCompareStore.getState().items[0]!.id;
        toggleCompareItem(useCompareStore.getState().items[0]!);
        expect(useCompareStore.getState().hasItem(firstId)).toBe(false);

        // Remove by ID works
        const secondId = useCompareStore.getState().items[0]!.id;
        removeCompareItem(secondId);
        expect(useCompareStore.getState().hasItem(secondId)).toBe(false);

        // Clear resets to 0
        clearCompare();
        expect(useCompareStore.getState().items).toHaveLength(0);
    });

    it('2) Gap P03 Structured Technical Spec Extraction & Diff-Only Filtering: extracts Galia kW, DN/mm, Šaltnešis/Kuras, Garantija 24–60 mėn., APVA tinkamumas and filters identical vs differing rows', () => {
        const itemA: CompareItem = {
            id: 'haier-r290-aw082',
            sku: 'AW082HUGHA',
            name: 'Oras–vanduo šilumos siurblys Haier Super Aqua Monoblock R290 8 kW',
            brand: 'Haier',
            price: 3490,
            categoryName: 'Katilai ir šilumos siurbliai',
            stockQty: 5,
            specs: ['8,0 kW', 'A+++', 'R290 iki +75 °C'],
        };
        const itemB: CompareItem = {
            id: 'mpb-nani-35',
            sku: 'MPB-NANI-35',
            name: 'Granulių degiklio komplektas Megatherm MPB NANI 8–35 kW su sraigtu DN25 Ø90 mm',
            brand: 'Megatherm',
            price: 2350,
            categoryName: 'Granulių degikliai',
            stockQty: 6,
            specs: ['5–35 kW', 'A+', 'Ø90 mm'],
        };

        const specsA = extractCompareTechnicalSpecs(itemA, 'lt');
        const specsB = extractCompareTechnicalSpecs(itemB, 'lt');

        expect(specsA.powerKw).toContain('8');
        expect(specsA.fuelOrRefrigerant).toMatch(/R290|Oras/i);
        expect(specsA.warranty).toMatch(/24|36|60/);
        expect(specsA.apvaEligible).toBe(true);

        expect(specsB.powerKw).toMatch(/35|8–35/);
        expect(specsB.dimensionsOrConnection).toMatch(/90|DN25/i);
        expect(specsB.apvaEligible).toBe(true);

        const rows = [
            { key: 'power', label: 'Galia (kW)', values: [specsA.powerKw, specsB.powerKw] },
            { key: 'apva', label: 'APVA parama', values: ['Tinka APVA paramai', 'Tinka APVA paramai'] },
        ];
        const diffOnly = filterDiffOnlyCompareRows(rows, true);
        expect(diffOnly).toHaveLength(1);
        expect(diffOnly[0]?.key).toBe('power');

        const allRows = filterDiffOnlyCompareRows(rows, false);
        expect(allRows).toHaveLength(2);
    });

    it('3) Gap P04 APVA / LEA State Subsidy Calculator: computes accurate grant €, customer net investment €, and returns all 5 mandatory APVA invoice fields', () => {
        const hpCalc = calculateApvaSubsidyEstimate({
            replacedBoilerType: 'fossil_coal_wood',
            newDeviceType: 'heat_pump_air_water',
            powerKw: 8,
            devicePriceEur: 3490,
        });

        expect(hpCalc.estimatedGrantEur).toBeGreaterThan(1000);
        expect(hpCalc.estimatedGrantEur).toBeLessThan(hpCalc.devicePriceEur);
        expect(hpCalc.netCustomerInvestmentEur).toBeCloseTo(
            hpCalc.devicePriceEur - hpCalc.estimatedGrantEur,
            2,
        );
        expect(hpCalc.scopOrEfficiencyLabel).toContain('SCOP');
        expect(hpCalc.ecodesignRegulation).toContain('813/2013');

        const bioCalc = calculateApvaSubsidyEstimate({
            replacedBoilerType: 'old_biomass',
            newDeviceType: 'ecodesign_pellet_boiler',
            powerKw: 20,
            devicePriceEur: 2850,
        });

        expect(bioCalc.estimatedGrantEur).toBeGreaterThan(600);
        expect(bioCalc.netCustomerInvestmentEur).toBeCloseTo(
            bioCalc.devicePriceEur - bioCalc.estimatedGrantEur,
            2,
        );
        expect(bioCalc.ecodesignRegulation).toContain('2015/1189');

        expect(APVA_MANDATORY_INVOICE_FIELDS.lt).toHaveLength(5);
        expect(APVA_MANDATORY_INVOICE_FIELDS.lt[0]).toContain('1. Tikslus gamintojo modelio kodas');
        expect(APVA_MANDATORY_INVOICE_FIELDS.lt[1]).toContain('2. Vardinė šiluminė galia (kW)');
        expect(APVA_MANDATORY_INVOICE_FIELDS.lt[2]).toContain('3. Sezoninis naudingumo koeficientas SCOP / ηs');
        expect(APVA_MANDATORY_INVOICE_FIELDS.lt[3]).toContain('4. EcoDesign (ES 2015/1189 arba 813/2013) atitikties žyma');
        expect(APVA_MANDATORY_INVOICE_FIELDS.lt[4]).toContain('montavimo adresas');
    });

    it('4) Gap P04 Eligibility & Invoice Compliance Formatting: detects heat pumps, boilers, and pellet burners for pdp-apva-badge and formats APVA invoice lines', () => {
        expect(
            isProductEligibleForApvaSubsidy({
                name: 'Oras–vanduo šilumos siurblys Haier Super Aqua Monoblock R290 8 kW',
                category: 'Katilai ir šilumos siurbliai',
                sku: 'AW082HUGHA',
            }),
        ).toBe(true);

        expect(
            isProductEligibleForApvaSubsidy({
                name: 'Granulių degiklio komplektas Megatherm MPB NANI 8–35 kW',
                category: 'Granulių degikliai',
                sku: 'MPB-NANI-35',
            }),
        ).toBe(true);

        expect(
            isProductEligibleForApvaSubsidy({
                name: 'Plieninis kieto kuro ir granulių katilas KaTRI 25 kW',
                category: 'Kieto kuro katilai',
                sku: 'KAT-25KW-GI',
            }),
        ).toBe(true);

        expect(
            isProductEligibleForApvaSubsidy({
                name: 'Termostatinė radiatoriaus galvutė Danfoss RA 2990',
                category: 'Termostatika ir vožtuvai',
                sku: '013G2990',
            }),
        ).toBe(false);

        const complianceLine = formatApvaInvoiceComplianceNote({
            sku: 'AW082HUGHA',
            title: 'Oras–vanduo šilumos siurblys Haier Super Aqua Monoblock R290 8 kW',
            buyerAddress: 'Eigulių g. 21, LT-51418 Kaunas',
        });
        expect(complianceLine).toContain('AW082HUGHA');
        expect(complianceLine).toContain('kW');
        expect(complianceLine).toContain('SCOP');
        expect(complianceLine).toContain('EcoDesign');
    });

    it('5) DOM & Wiring Verification: all required test-ids and components are mounted across providers, cards, PDP, calculators hub, and admin invoice builder', () => {
        const compareDrawerSrc = fs.readFileSync(
            path.join(repoRoot, 'src/components/compare-drawer.tsx'),
            'utf-8',
        );
        expect(compareDrawerSrc).toContain('data-testid="compare-drawer"');
        expect(compareDrawerSrc).toContain('data-testid="compare-floating-bar"');
        expect(compareDrawerSrc).toContain('data-testid="compare-diff-only-toggle"');
        expect(compareDrawerSrc).toContain('Rodyti tik besiskiriančius parametrus');
        expect(compareDrawerSrc).toContain('Eigulių g. 21, Kaunas');

        const providersSrc = fs.readFileSync(
            path.join(repoRoot, 'src/components/providers.tsx'),
            'utf-8',
        );
        expect(providersSrc).toContain('CompareDrawer');

        const productCardSrc = fs.readFileSync(
            path.join(repoRoot, 'src/components/product-card.tsx'),
            'utf-8',
        );
        expect(productCardSrc).toContain('data-testid="product-compare-toggle"');

        const artboardGridSrc = fs.readFileSync(
            path.join(repoRoot, 'src/components/giles-artboard-catalog-grid.tsx'),
            'utf-8',
        );
        expect(artboardGridSrc).toContain('data-testid="product-compare-toggle"');

        const productPurchaseSrc = fs.readFileSync(
            path.join(repoRoot, 'src/components/conversion/product-purchase.tsx'),
            'utf-8',
        );
        expect(productPurchaseSrc).toContain('data-testid="product-compare-toggle"');
        expect(productPurchaseSrc).toContain('data-testid="pdp-apva-badge"');
        expect(productPurchaseSrc).toContain(
            'Tinka APVA paramai · EcoDesign / A+++ sąskaita su SCOP ir kW duomenimis',
        );

        const apvaWidgetSrc = fs.readFileSync(
            path.join(repoRoot, 'src/components/apva-subsidy-widget.tsx'),
            'utf-8',
        );
        expect(apvaWidgetSrc).toContain('data-testid="apva-subsidy-calculator"');

        const calcHubSrc = fs.readFileSync(
            path.join(repoRoot, 'src/components/scientific-calculators-hub.tsx'),
            'utf-8',
        );
        expect(calcHubSrc).toContain('ApvaSubsidyWidget');

        const invoiceBuilderSrc = fs.readFileSync(
            path.join(repoRoot, 'src/components/giles-admin-invoice-builder.tsx'),
            'utf-8',
        );
        expect(invoiceBuilderSrc).toContain('data-testid="invoice-apva-mode-toggle"');
        expect(invoiceBuilderSrc).toContain(
            'Įtraukti APVA / ENA paramos techninius rekvizitus (Modelis, kW, SCOP/ηs, EcoDesign sertifikatas)',
        );
    });
});
