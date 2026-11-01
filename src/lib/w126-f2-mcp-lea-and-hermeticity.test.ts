import { describe, it, expect, beforeEach, afterEach, afterAll } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import * as mcpRoute from '../app/api/mcp/route';
import { resetMcpSecurityDatabase } from './mcp-store-server';
import { resetB2BPricingEngineState } from './b2b-pricing-engine';
import { MCP_STORE_TOOLS } from './mcp-store-catalog';
import {
    resetSkaitaInvoices,
    createAutonomousSkaitaInvoice,
    listSkaitaInvoices,
} from './skaita-accounting';
import { leaGrant, leaRate, type LeaData } from './heat/lea';
import lea2026Raw from '../data/heat/lea-2026.lt.json';

const LEA_2026 = lea2026Raw as unknown as LeaData;
const LIVE_SKAITA_INVOICES = path.resolve(__dirname, '../data/skaita-invoices.json');

async function runMcpCalculator(args: Record<string, unknown>): Promise<Record<string, unknown>> {
    const res = await mcpRoute.POST(
        new Request('http://localhost/api/mcp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jsonrpc: '2.0',
                id: 1,
                method: 'tools/call',
                params: { name: 'public_hydronic_calculator_run', arguments: args },
            }),
        }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { result: { structuredContent: Record<string, unknown> } };
    return body.result.structuredContent;
}

describe('WP-W126-F2: MCP LEA sinchronizavimas su lib/heat/lea + skaita-invoices hermetiškumas', () => {
    beforeEach(() => {
        resetMcpSecurityDatabase();
        resetB2BPricingEngineState();
    });

    afterEach(() => {
        resetMcpSecurityDatabase();
        resetB2BPricingEngineState();
    });

    it('1) MCP apva_subsidy 8 kW ŠS pinigai sutampa su src/lib/heat/lea.ts: 591,38 €/kW → 2 365,52 €', async () => {
        const payload = await runMcpCalculator({ calculatorType: 'apva_subsidy', powerKw: 8, locale: 'lt' });
        const calc = payload['engineeringCalculation'] as {
            fixedRatePerKwEur: number;
            estimatedGrantEur: number;
        };
        expect(calc.fixedRatePerKwEur).toBeCloseTo(leaRate(LEA_2026, 'hp_aw', 8), 2);
        expect(calc.estimatedGrantEur).toBeCloseTo(leaGrant(LEA_2026, 'hp_aw', 8), 2);
        expect(calc.fixedRatePerKwEur).toBeCloseTo(591.38, 2);
        expect(calc.estimatedGrantEur).toBeCloseTo(2365.52, 2);
    });

    it('2) MCP apva_subsidy citata išvesta iš LEA duomenų (be „APVA“, be „415 €/kW × 65 %“)', async () => {
        const payload = await runMcpCalculator({ calculatorType: 'apva_subsidy', powerKw: 8, locale: 'lt' });
        const citation = String(payload['standardCitation']);
        expect(citation).toContain('LEA');
        expect(citation).not.toContain('APVA');
        expect(citation).not.toContain('415');
        expect(citation).toContain('591.38 €/kW × 50 %');
    });

    it('3) MCP įrankio aprašymas (catalog): LEA, ne APVA', () => {
        const tool = MCP_STORE_TOOLS.find((t) => t.name === 'public_hydronic_calculator_run');
        expect(tool).toBeDefined();
        const copy = `${tool!.title} ${tool!.description}`;
        expect(copy).toContain('LEA');
        expect(copy).not.toContain('APVA');
    });

    it('4) skaita-accounting pagal W125-F1: vitest rašo į /tmp, gyvas skaita-invoices.json lieka []', () => {
        resetSkaitaInvoices();
        const inv = createAutonomousSkaitaInvoice({
            docType: 'PVM_SASKAITA_FAKTURA',
            buyerName: 'UAB Hermetiškas Testas',
            buyerCompanyCode: '300000009',
            lines: [
                { sku: 'ZV-100', title: 'Gorenje Tiki ZV 100 (testas)', qty: 1, unitNetEur: 238.02 },
            ],
        });
        expect(inv.invoiceNumber).toMatch(/^GILE-\d{4}$/);
        expect(listSkaitaInvoices()).toHaveLength(1);
        expect(JSON.parse(fs.readFileSync(LIVE_SKAITA_INVOICES, 'utf-8'))).toEqual([]);
        resetSkaitaInvoices();
    });

    it('5) šaltinio užraktas: mcp-store-tools-exec importuoja iš ./heat/lea, be „APVA / LEA“ copy', () => {
        const execSrc = fs.readFileSync(path.resolve(__dirname, 'mcp-store-tools-exec.ts'), 'utf-8');
        expect(execSrc).not.toContain('APVA / LEA');
        expect(execSrc).toContain("from './heat/lea'");
        const skaitaSrc = fs.readFileSync(path.resolve(__dirname, 'skaita-accounting.ts'), 'utf-8');
        expect(skaitaSrc).toContain('process.env.VITEST');
    });

    afterAll(() => {
        expect(JSON.parse(fs.readFileSync(LIVE_SKAITA_INVOICES, 'utf-8'))).toEqual([]);
    });
});
