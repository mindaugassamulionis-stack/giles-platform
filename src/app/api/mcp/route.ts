import { NextResponse } from 'next/server';
import {
    MCP_STORE_TOOLS,
    MCP_STORE_RESOURCES,
    MCP_STORE_PROMPTS,
    loadMcpSecurityDb,
    resetMcpSecurityDatabase,
    generateMcpApiKey,
    revokeMcpApiKey,
    updateMcpSecurityPolicy,
    authenticateMcpCaller,
    inspectPayloadForInjection,
    checkRateLimit,
    recordMcpAudit,
    dispatchMcpJsonRpc,
    type McpScopeTier,
} from '../../../lib/mcp-store-server';

export async function GET() {
    const db = loadMcpSecurityDb();
    return NextResponse.json({
        ok: true,
        protocolVersion: '2025-03-26',
        supportedVersions: ['2024-11-05', '2025-03-26'],
        serverInfo: {
            name: 'giles-inzinerija-mcp',
            version: '1.1.0',
            title: 'UAB „Gilės inžinerija“ Security-First & Open Discovery MCP Server',
            tier0OpenDiscovery: true,
            discoveryManifestUrl: '/.well-known/mcp.json',
        },
        toolsCount: MCP_STORE_TOOLS.length,
        resourcesCount: MCP_STORE_RESOURCES.length,
        promptsCount: MCP_STORE_PROMPTS.length,
        tools: MCP_STORE_TOOLS,
        resources: MCP_STORE_RESOURCES,
        prompts: MCP_STORE_PROMPTS,
        policy: db.policy,
        keys: db.keys,
        auditLog: db.auditLog,
    });
}

export async function POST(req: Request) {
    let rawText = '';
    try {
        rawText = await req.text();
    } catch {
        return NextResponse.json(
            {
                jsonrpc: '2.0',
                id: null,
                error: { code: -32700, message: 'Parse error: unable to read request body' },
            },
            { status: 400 },
        );
    }

    let body: { jsonrpc?: string; id?: unknown; method?: string; params?: Record<string, unknown> } = {};
    try {
        body = rawText ? JSON.parse(rawText) : {};
    } catch {
        return NextResponse.json(
            {
                jsonrpc: '2.0',
                id: null,
                error: { code: -32700, message: 'Parse error: invalid JSON payload' },
            },
            { status: 400 },
        );
    }

    const id = body?.id ?? null;
    const method = String(body?.method || 'unknown');
    const caller = authenticateMcpCaller(req);

    if (!caller.authenticated) {
        recordMcpAudit({
            actor: 'Neautorizuotas kvietėjas',
            scope: 'unauthenticated',
            method,
            toolName: body?.params?.name ? String(body.params.name) : null,
            decision: 'DENIED',
            summary: `Atmesta (401 Unauthorized): trūksta galiojančio Bearer giles_mcp_... rakto`,
        });
        return NextResponse.json(
            {
                jsonrpc: '2.0',
                id,
                error: {
                    code: -32001,
                    message:
                        'Unauthorized: pateikite Authorization: Bearer giles_mcp_... arba X-MCP-API-Key antraštę',
                },
            },
            { status: 401 },
        );
    }

    const db = loadMcpSecurityDb();
    if (!checkRateLimit(caller.keyId, db.policy.rateLimitPerMinute)) {
        recordMcpAudit({
            actor: caller.actor,
            scope: caller.scope,
            method,
            toolName: null,
            decision: 'DENIED',
            summary: `Rate limit viršytas (${db.policy.rateLimitPerMinute} užkl./min.)`,
        });
        return NextResponse.json(
            {
                jsonrpc: '2.0',
                id,
                error: { code: -32005, message: 'Rate limit exceeded (60 req/min)' },
            },
            { status: 429 },
        );
    }

    const injectionReason = inspectPayloadForInjection(rawText);
    if (injectionReason) {
        recordMcpAudit({
            actor: caller.actor,
            scope: caller.scope,
            method,
            toolName: body?.params?.name ? String(body.params.name) : null,
            decision: 'DENIED',
            summary: `Įvesties sanitizavimo blokavimas: ${injectionReason}`,
        });
        return NextResponse.json(
            {
                jsonrpc: '2.0',
                id,
                error: { code: -32602, message: `Invalid params: ${injectionReason}` },
            },
            { status: 400 },
        );
    }

    const dispatched = dispatchMcpJsonRpc(body, {
        actor: caller.actor,
        scope: caller.scope,
    });
    return NextResponse.json(dispatched.response, { status: dispatched.status });
}

export async function PUT(req: Request) {
    try {
        const body = await req.json();
        const action = String(body.action || '');

        if (action === 'reset_security') {
            const clean = resetMcpSecurityDatabase();
            return NextResponse.json({
                ok: true,
                reset: true,
                policy: clean.policy,
                keys: clean.keys,
                auditLog: clean.auditLog,
            });
        }

        if (action === 'generate_key') {
            const name = String(body.name || 'Dariaus Claude Desktop').trim();
            const rawScope = String(body.scope || 'operator_safe');
            const scope: McpScopeTier =
                rawScope === 'read_only' || rawScope === 'full_admin' ? rawScope : 'operator_safe';
            const generated = generateMcpApiKey({ name, scope });
            return NextResponse.json({
                ok: true,
                action: 'generate_key',
                rawKey: generated.rawKey,
                keyRecord: generated.keyRecord,
                keys: generated.keys,
            });
        }

        if (action === 'update_policy') {
            const updatedPolicy = updateMcpSecurityPolicy({
                ...(body.maxPriceDropPct != null
                    ? { maxPriceDropPct: Math.max(1, Math.min(80, Number(body.maxPriceDropPct))) }
                    : {}),
                ...(body.minMarginFloorPct != null
                    ? { minMarginFloorPct: Math.max(5, Math.min(60, Number(body.minMarginFloorPct))) }
                    : {}),
                ...(body.maxStockDeltaUnits != null
                    ? { maxStockDeltaUnits: Math.max(10, Number(body.maxStockDeltaUnits)) }
                    : {}),
                ...(typeof body.enforceFinancialGuardrails === 'boolean'
                    ? { enforceFinancialGuardrails: body.enforceFinancialGuardrails }
                    : {}),
                ...(typeof body.requireHumanApprovalForBulkAndB2b === 'boolean'
                    ? { requireHumanApprovalForBulkAndB2b: body.requireHumanApprovalForBulkAndB2b }
                    : {}),
                ...(typeof body.allowHighRiskDirect === 'boolean'
                    ? { allowHighRiskDirect: body.allowHighRiskDirect }
                    : {}),
            });
            return NextResponse.json({
                ok: true,
                action: 'update_policy',
                policy: updatedPolicy,
            });
        }

        return NextResponse.json(
            { ok: false, error: `Unknown PUT /api/mcp action: ${action}` },
            { status: 400 },
        );
    } catch {
        return NextResponse.json(
            { ok: false, error: 'Failed to process PUT /api/mcp request' },
            { status: 400 },
        );
    }
}

export async function DELETE(req: Request) {
    try {
        const url = new URL(req.url);
        let keyId = url.searchParams.get('keyId') || '';
        if (!keyId) {
            const body = await req.json().catch(() => ({}));
            keyId = String((body as Record<string, unknown>)?.keyId || '');
        }
        if (!keyId) {
            return NextResponse.json({ ok: false, error: 'keyId is required' }, { status: 400 });
        }
        const keys = revokeMcpApiKey(keyId);
        return NextResponse.json({
            ok: true,
            revokedKeyId: keyId,
            keys,
        });
    } catch {
        return NextResponse.json({ ok: false, error: 'Failed to revoke MCP key' }, { status: 400 });
    }
}
