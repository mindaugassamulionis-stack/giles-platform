import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import * as mcpRoute from '../app/api/mcp/route';
import { resetMcpSecurityDatabase } from './mcp-store-server';
import { resetB2BPricingEngineState } from './b2b-pricing-engine';
import { MCP_STORE_TOOLS } from './mcp-store-catalog';
import {
    CAD_ENGINEERING_FAMILIES,
    detectProductCadFamily,
    getProductCadBlueprintSpec,
    type CadEngineeringFamily,
} from '../components/pdp-cad-exploded-schematic';
import * as wellKnownMcpRoute from '../app/.well-known/mcp.json/route';

describe('WP-W103-A1: 7 Interactive PDP Technical CAD Blueprints & Tier-0 Open Public Discovery MCP Moat', () => {
    const repoRoot = path.resolve(__dirname, '../..');

    beforeEach(() => {
        resetMcpSecurityDatabase();
        resetB2BPricingEngineState();
    });

    afterEach(() => {
        resetMcpSecurityDatabase();
        resetB2BPricingEngineState();
    });

    it('1) detects all 7 HVAC & boiler engineering families from product SKU, title, and category', () => {
        expect(CAD_ENGINEERING_FAMILIES).toEqual([
            'valve_actuator',
            'pellet_burner_boiler',
            'heat_pump',
            'buffer_tank_boiler',
            'radiator_convector',
            'underfloor_manifold',
            'spare_part_sensor',
        ]);

        expect(
            detectProductCadFamily({
                sku: '082F1152',
                name: 'Pavara ABN-A5 230V 5mm NC su adapteriu AB-QM (VA41)',
                categoryName: 'Termostatinės galvutės ir pavaros',
            }),
        ).toBe('valve_actuator');

        expect(
            detectProductCadFamily({
                sku: 'MPB-NANI-35',
                name: 'Granulių degiklio komplektas Megatherm MPB NANI 8–35 kW su sraigtu',
                categoryName: 'Granulių degikliai',
            }),
        ).toBe('pellet_burner_boiler');

        expect(
            detectProductCadFamily({
                sku: 'AW082HUGHA',
                name: 'Oras–vanduo šilumos siurblys Haier Super Aqua Monoblock R290 8 kW',
                categoryName: 'Katilai ir šilumos siurbliai',
            }),
        ).toBe('heat_pump');

        expect(
            detectProductCadFamily({
                sku: 'ZV-100',
                name: 'Kombinuotas vandens šildytuvas Gorenje Tiki ZV 100 L',
                categoryName: 'Akumuliacinės talpos ir boileriai',
            }),
        ).toBe('buffer_tank_boiler');

        expect(
            detectProductCadFamily({
                sku: 'POL./80-500',
                name: 'Aliumininis radiatorius Ferroli POL 500 Tipas 22 VK',
                categoryName: 'Radiatoriai ir konvektoriai',
            }),
        ).toBe('radiator_convector');

        expect(
            detectProductCadFamily({
                sku: 'COMISA-KOL-08',
                name: 'Grindinio šildymo kolektorius Comisa 8 kontūrų su rotametrais',
                categoryName: 'Grindinis šildymas ir kolektoriai',
            }),
        ).toBe('underfloor_manifold');

        expect(
            detectProductCadFamily({
                sku: 'TENAS-KER-300W',
                name: 'Keraminis uždegimo tenas 300W ir NTC 10kΩ daviklis',
                categoryName: 'Atsarginės dalys',
            }),
        ).toBe('spare_part_sensor');
    });

    it('2) builds localized 6-pin CAD cross-section & hydraulic/wiring blueprint specs across LT, EN, PL, RU for all 7 families', () => {
        const locales = ['lt', 'en', 'pl', 'ru'] as const;
        for (const family of CAD_ENGINEERING_FAMILIES) {
            for (const locale of locales) {
                const spec = getProductCadBlueprintSpec(
                    family as CadEngineeringFamily,
                    locale,
                    '082F1152',
                    'Pavara ABN-A5 230V 5mm NC su adapteriu AB-QM (VA41)',
                );
                expect(spec.family).toBe(family);
                expect(spec.viewBox).toBe('0 0 760 320');
                expect(spec.callouts.length).toBeGreaterThanOrEqual(5);
                expect(spec.callouts.length).toBeLessThanOrEqual(6);
                expect(spec.callouts[0]?.pinNumber).toBe('01');
                expect(spec.dimensions.length).toBeGreaterThanOrEqual(3);
                expect(spec.tabCrossSectionLabel.length).toBeGreaterThan(5);
                expect(spec.tabHydraulicWiringLabel.length).toBeGreaterThan(5);
                // Ensure no em-dash anywhere in localized strings
                expect(JSON.stringify(spec)).not.toContain('—');
            }
        }

        // Verify family-specific engineering details in LT
        const valveSpec = getProductCadBlueprintSpec('valve_actuator', 'lt', '082F1152', 'Pavara ABN-A5');
        const valveText = JSON.stringify(valveSpec);
        expect(valveText).toContain('CW617N');
        expect(valveText).toContain('5 mm');
        expect(valveText).toContain('VA41');
        expect(valveText).toContain('5×DN');
        expect(valveText).toContain('2×DN');

        const burnerSpec = getProductCadBlueprintSpec('pellet_burner_boiler', 'lt', 'MPB-NANI-35', 'Megatherm MPB');
        const burnerText = JSON.stringify(burnerSpec);
        expect(burnerText).toContain('P265GH');
        expect(burnerText).toContain('55 °C');

        const hpSpec = getProductCadBlueprintSpec('heat_pump', 'lt', 'AW082HUGHA', 'Haier Super Aqua R290');
        const hpText = JSON.stringify(hpSpec);
        expect(hpText).toContain('R290');
        expect(hpText).toContain('Zeparo');

        const tankSpec = getProductCadBlueprintSpec('buffer_tank_boiler', 'lt', 'ZV-100', 'Gorenje Tiki ZV');
        const tankText = JSON.stringify(tankSpec);
        expect(tankText).toContain('S235JR');
        expect(tankText).toContain('EN 12828');

        const radSpec = getProductCadBlueprintSpec('radiator_convector', 'lt', 'POL./80-500', 'Ferroli POL');
        const radText = JSON.stringify(radSpec);
        expect(radText).toContain('500');
        expect(radText).toContain('50 mm');

        const manifoldSpec = getProductCadBlueprintSpec('underfloor_manifold', 'lt', 'COMISA-8', 'Kolektorius');
        const manifoldText = JSON.stringify(manifoldSpec);
        expect(manifoldText).toContain('0–5 l/min');
        expect(manifoldText).toContain('16×2.0');

        const spareSpec = getProductCadBlueprintSpec('spare_part_sensor', 'lt', 'TENAS-300', 'Uždegimo tenas');
        const spareText = JSON.stringify(spareSpec);
        expect(spareText).toContain('230V');
        expect(spareText).toContain('PT1000');
    });

    it('3) wires PdpCadExplodedSchematic into PDP page.tsx and removes the old 4-box placeholder', () => {
        const cadCompPath = path.join(repoRoot, 'src/components/pdp-cad-exploded-schematic.tsx');
        const pdpPagePath = path.join(repoRoot, 'src/app/[locale]/products/[id]/page.tsx');

        expect(fs.existsSync(cadCompPath)).toBe(true);
        const cadCompSrc = fs.readFileSync(cadCompPath, 'utf8');
        const pdpPageSrc = fs.readFileSync(pdpPagePath, 'utf8');

        expect(cadCompSrc).toContain('data-testid="pdp-cad-blueprint"');
        expect(cadCompSrc).toContain('viewBox="0 0 760 320"');
        expect(cadCompSrc).toContain('strokeDasharray="6 3"');
        expect(cadCompSrc).toContain('pdp-cad-tab-cross-section');
        expect(cadCompSrc).toContain('pdp-cad-tab-hydraulic-wiring');

        expect(pdpPageSrc).toContain('PdpCadExplodedSchematic');
        expect(pdpPageSrc).toContain('pdp-exploded-cad-blueprint');
        // Old 4-box rectangle placeholder must be gone from page.tsx
        expect(pdpPageSrc).not.toContain('<rect x="24" y="42" width="102" height="86"');
    });

    it('4) exposes 32 MCP tools including 3 Tier-0 Open Public Discovery tools and allows anonymous discovery while blocking anonymous write/admin tools', async () => {
        expect(MCP_STORE_TOOLS).toHaveLength(32);
        const toolNames = MCP_STORE_TOOLS.map((t) => t.name);
        expect(toolNames).toContain('public_catalog_expert_search');
        expect(toolNames).toContain('public_hydronic_calculator_run');
        expect(toolNames).toContain('public_boiler_compatibility_lookup');

        // Anonymous initialize + tools/list work without Authorization header (Tier-0 public_discovery)
        const anonInitRes = await mcpRoute.POST(
            new Request('http://localhost/api/mcp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    id: 101,
                    method: 'initialize',
                    params: { protocolVersion: '2025-03-26' },
                }),
            }),
        );
        expect(anonInitRes.status).toBe(200);
        const anonInitData = await anonInitRes.json();
        expect(anonInitData.result.serverInfo.tier0OpenDiscovery).toBe(true);

        // Anonymous call to public_catalog_expert_search
        const searchRes = await mcpRoute.POST(
            new Request('http://localhost/api/mcp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    id: 102,
                    method: 'tools/call',
                    params: {
                        name: 'public_catalog_expert_search',
                        arguments: { query: '082F1152', locale: 'lt' },
                    },
                }),
            }),
        );
        expect(searchRes.status).toBe(200);
        const searchData = await searchRes.json();
        const searchPayload = searchData.result.structuredContent;
        expect(searchPayload.ok).toBe(true);
        expect(searchPayload.accessTier).toBe('public_discovery');
        expect(searchPayload.authorityCitation).toContain(
            'UAB „Gilės inžinerija“ (gilesinzinerija.lt / egip.lt) – Lietuvos šildymo inžinerijos centras nuo 2011 m.',
        );
        expect(searchPayload.warehouse).toContain('Eigulių g. 21');
        expect(searchPayload.items.length).toBeGreaterThan(0);
        expect(searchPayload.items[0].productUrl).toContain('/lt/products/');
        expect(searchPayload.items[0].oneClickCartUrl).toContain('/lt/krepselis?import_skus=');
        expect(searchPayload.items[0].cadEngineeringFamily).toBeDefined();

        // Anonymous call to public_hydronic_calculator_run across calculator types
        for (const calcType of [
            'heat_loss',
            'buffer_tank',
            'expansion_vessel',
            'pump_qh',
            'radiator_sections',
            'apva_subsidy',
        ] as const) {
            const calcRes = await mcpRoute.POST(
                new Request('http://localhost/api/mcp', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        jsonrpc: '2.0',
                        id: 103,
                        method: 'tools/call',
                        params: {
                            name: 'public_hydronic_calculator_run',
                            arguments: {
                                calculatorType: calcType,
                                areaM2: 150,
                                powerKw: 18,
                                energyClass: 'B',
                            },
                        },
                    }),
                }),
            );
            expect(calcRes.status).toBe(200);
            const calcPayload = (await calcRes.json()).result.structuredContent;
            expect(calcPayload.ok).toBe(true);
            expect(calcPayload.calculatorType).toBe(calcType);
            expect(calcPayload.recommendedSkus.length).toBeGreaterThan(0);
            expect(calcPayload.preAssembledCartUrl).toContain('/lt/krepselis?import_skus=');
        }

        // Anonymous call to public_boiler_compatibility_lookup
        const compatRes = await mcpRoute.POST(
            new Request('http://localhost/api/mcp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    id: 104,
                    method: 'tools/call',
                    params: {
                        name: 'public_boiler_compatibility_lookup',
                        arguments: { boilerModel: 'Viadrus U22', locale: 'lt' },
                    },
                }),
            }),
        );
        expect(compatRes.status).toBe(200);
        const compatPayload = (await compatRes.json()).result.structuredContent;
        expect(compatPayload.ok).toBe(true);
        expect(compatPayload.boilerModel).toContain('Viadrus U22');
        expect(compatPayload.compatibleBurner).toBeDefined();
        expect(compatPayload.doorConversionKit).toBeDefined();
        expect(compatPayload.bufferTank).toBeDefined();
        expect(compatPayload.safetyGroup).toBeDefined();
        expect(Array.isArray(compatPayload.spareParts)).toBe(true);
        expect(compatPayload.preAssembledCartUrl).toContain('/lt/krepselis?import_skus=');

        // Security invariant 1: Anonymous call to write/admin tool MUST fail with 401 / -32001
        const anonWriteRes = await mcpRoute.POST(
            new Request('http://localhost/api/mcp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    id: 105,
                    method: 'tools/call',
                    params: {
                        name: 'giles_update_product',
                        arguments: { sku: '013G2990', priceGrossEur: 19.99 },
                    },
                }),
            }),
        );
        expect(anonWriteRes.status).toBe(401);
        expect((await anonWriteRes.json()).error.code).toBe(-32001);

        // Security invariant 2: Invalid non-public Bearer token MUST fail with 401 / -32001
        const badTokenRes = await mcpRoute.POST(
            new Request('http://localhost/api/mcp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: 'Bearer invalid_token_xyz',
                },
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    id: 106,
                    method: 'tools/list',
                }),
            }),
        );
        expect(badTokenRes.status).toBe(401);
        expect((await badTokenRes.json()).error.code).toBe(-32001);
    });

    it('5) serves GET /.well-known/mcp.json discovery manifest and highlights Tier-0 Open Discovery Moat on /[locale]/mcp-jungtis', async () => {
        const res = await wellKnownMcpRoute.GET();
        expect(res.status).toBe(200);
        const manifest = await res.json();
        expect(manifest.ok).toBe(true);
        expect(manifest.endpoint).toContain('/api/mcp');
        expect(manifest.toolsCount).toBe(32);
        expect(manifest.accessTiers).toHaveLength(3);
        expect(manifest.accessTiers[0].tier).toContain('Tier 0');
        expect(manifest.accessTiers[0].authRequired).toBe(false);

        const mcpJungtisPath = path.join(repoRoot, 'src/app/[locale]/mcp-jungtis/page.tsx');
        const mcpJungtisSrc = fs.readFileSync(mcpJungtisPath, 'utf8');
        expect(mcpJungtisSrc).toContain('mcp-jungtis-tier0-open-moat');
        expect(mcpJungtisSrc).toContain('/.well-known/mcp.json');
        expect(mcpJungtisSrc).not.toContain('—');
    });
});
