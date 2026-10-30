'use client';

import { useEffect, useState } from 'react';
import { assetUrl } from '../lib/api';
import {
    PRODUCTION_PRIMARY_ORIGIN,
    resolveActiveRuntimeOrigin,
} from '../lib/domain-routing';
import { MCP_STORE_TOOLS, type McpScopeTier } from '../lib/mcp-store-catalog';
import type {
    McpApiKeyRecord,
    McpAuditLogEntry,
    McpSecurityPolicy,
} from '../lib/mcp-store-server';

const DEFAULT_POLICY: McpSecurityPolicy = {
    maxPriceDropPct: 20,
    minMarginFloorPct: 15,
    maxStockDeltaUnits: 200,
    enforceFinancialGuardrails: true,
    requireHumanApprovalForBulkAndB2b: true,
    allowHighRiskDirect: false,
    rateLimitPerMinute: 60,
};

export function GilesAdminMcp() {
    const [policy, setPolicy] = useState<McpSecurityPolicy>(DEFAULT_POLICY);
    const [keys, setKeys] = useState<McpApiKeyRecord[]>([]);
    const [auditLog, setAuditLog] = useState<McpAuditLogEntry[]>([]);

    const [keyName, setKeyName] = useState('Dariaus Claude Desktop');
    const [keyScope, setKeyScope] = useState<McpScopeTier>('operator_safe');
    const [newlyGeneratedKey, setNewlyGeneratedKey] = useState<string>('');
    const [copyNotice, setCopyNotice] = useState<string>('');

    const [selectedTool, setSelectedTool] = useState<string>('giles_store_overview');
    const [toolArgsJson, setToolArgsJson] = useState<string>('{}');
    const [playgroundScope, setPlaygroundScope] = useState<McpScopeTier>('operator_safe');
    const [playgroundResult, setPlaygroundResult] = useState<string>('');
    const [originMode, setOriginMode] = useState<'production' | 'current'>('production');
    const [activeRuntimeOrigin, setActiveRuntimeOrigin] = useState<string>(
        PRODUCTION_PRIMARY_ORIGIN,
    );

    const refreshMcpState = () => {
        fetch(assetUrl('/api/mcp'))
            .then((r) => r.json())
            .then((data) => {
                if (data?.policy) setPolicy(data.policy);
                if (Array.isArray(data?.keys)) setKeys(data.keys);
                if (Array.isArray(data?.auditLog)) setAuditLog(data.auditLog);
            })
            .catch(() => {});
    };

    useEffect(() => {
        setActiveRuntimeOrigin(resolveActiveRuntimeOrigin());
        refreshMcpState();
    }, []);

    const handleCopyText = (text: string, label: string) => {
        if (typeof navigator !== 'undefined' && navigator.clipboard) {
            navigator.clipboard.writeText(text).catch(() => {});
        }
        setCopyNotice(`Nukopijuota: ${label}`);
    };

    const handleGenerateKey = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch(assetUrl('/api/mcp'), {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'generate_key',
                    name: keyName.trim() || 'Dariaus Claude Desktop',
                    scope: keyScope,
                }),
            });
            const data = await res.json();
            if (data?.ok) {
                setNewlyGeneratedKey(data.rawKey || '');
                if (Array.isArray(data.keys)) setKeys(data.keys);
            }
        } catch {
            // ignore
        }
    };

    const handleRevokeKey = async (keyId: string) => {
        try {
            const res = await fetch(assetUrl(`/api/mcp?keyId=${encodeURIComponent(keyId)}`), {
                method: 'DELETE',
            });
            const data = await res.json();
            if (data?.ok && Array.isArray(data.keys)) setKeys(data.keys);
        } catch {
            // ignore
        }
    };

    const handleSavePolicy = async (patch: Partial<McpSecurityPolicy>) => {
        const next = { ...policy, ...patch };
        setPolicy(next);
        try {
            const res = await fetch(assetUrl('/api/mcp'), {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'update_policy', ...next }),
            });
            const data = await res.json();
            if (data?.policy) setPolicy(data.policy);
        } catch {
            // ignore
        }
    };

    const executePlaygroundCall = async (
        toolName: string,
        parsedArgs: Record<string, unknown>,
        scopeOverride?: McpScopeTier,
    ) => {
        try {
            const res = await fetch(assetUrl('/api/mcp'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Giles-Admin-Playground': '1',
                    'X-Giles-Playground-Scope': scopeOverride || playgroundScope,
                },
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    id: Date.now(),
                    method: 'tools/call',
                    params: { name: toolName, arguments: parsedArgs },
                }),
            });
            const data = await res.json();
            setPlaygroundResult(JSON.stringify(data, null, 2));
            refreshMcpState();
        } catch (err) {
            setPlaygroundResult(
                JSON.stringify({ error: err instanceof Error ? err.message : String(err) }, null, 2),
            );
        }
    };

    const handleRunSelectedTool = async () => {
        try {
            const parsed = toolArgsJson.trim() ? JSON.parse(toolArgsJson) : {};
            await executePlaygroundCall(selectedTool, parsed);
        } catch {
            setPlaygroundResult('Netinkamas JSON argumentų formatas.');
        }
    };

    const handleSimulateCircuitBreaker = async () => {
        setSelectedTool('giles_update_product');
        const riskyArgs = { sku: 'MPB-NANI-35', priceGrossEur: 1290 };
        setToolArgsJson(JSON.stringify(riskyArgs, null, 2));
        await executePlaygroundCall('giles_update_product', riskyArgs, 'operator_safe');
    };

    const tokenForSnippet = newlyGeneratedKey || 'giles_mcp_live_SUGENERUOKITE_RAKTA_2_SEKCJIOJE';
    const resolvedMcpOrigin =
        originMode === 'production' ? PRODUCTION_PRIMARY_ORIGIN : activeRuntimeOrigin;
    const resolvedMcpEndpoint = `${resolvedMcpOrigin}/api/mcp`;

    const claudeDesktopStdioConfig = JSON.stringify(
        {
            mcpServers: {
                'giles-inzinerija-store': {
                    command: 'node',
                    args: ['/home/mindu/Desktop/giles/giles-platform/mcp/giles-mcp-stdio.mjs'],
                    env: {
                        GILES_MCP_URL: resolvedMcpEndpoint,
                        GILES_MCP_API_KEY: tokenForSnippet,
                    },
                },
            },
        },
        null,
        2,
    );
    const claudeCodeHttpConfig = JSON.stringify(
        {
            mcpServers: {
                'giles-inzinerija-http': {
                    type: 'http',
                    url: resolvedMcpEndpoint,
                    headers: { Authorization: `Bearer ${tokenForSnippet}` },
                },
            },
        },
        null,
        2,
    );

    return (
        <section data-testid="admin-mcp-hub" className="space-y-6">
            <div data-testid="mcp-security-policy" className="rounded-2xl border border-[#E2DDD3] bg-white p-5 sm:p-6 space-y-4">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                    <div>
                        <span className="text-xs font-bold text-[#C2410C] block">
                            Model Context Protocol (JSON-RPC 2.0 · 2025-03-26) · 5 Saugumo Sluoksniai
                        </span>
                        <h2 className="text-xl sm:text-2xl font-extrabold text-[#11161B]">
                            Gilės Inžinerijos MCP Serveris: Žmogus + Claude AI Valdymas su Saugikliais
                        </h2>
                        <p className="text-xs text-[#5B6470] mt-1">
                            Leidžia prijungti Claude Desktop, Claude Code arba OpenCode prie 32 parduotuvės, vidinių AI agentų, tiekėjų kainynų, pilno prekių CRUD, „Skaita“ apskaitos, B2B CRM, Vytauto inžinerijos ir serviso įrankių bei 10 resursų nerizikuojant savavališku kainų ar maržų sugadinimu.
                        </p>
                    </div>
                    {copyNotice && (
                        <span className="text-xs font-bold text-[#0F5A2B] bg-[#E3F1E8] px-3 py-1.5 rounded-lg">
                            {copyNotice}
                        </span>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                    <div className="rounded-xl border border-[#E2DDD3] bg-[#FAF9F6] p-3.5 space-y-1.5">
                        <strong className="text-[#11161B] block">
                            Max leidžiamas kainos sumažinimas be žmogaus patvirtinimo (20%)
                        </strong>
                        <p className="text-[#5B6470]">
                            Jei išorinis AI agentas bando sumažinti prekės kainą daugiau nei {policy.maxPriceDropPct}%, pakeitimas blokuojamas ir perkeliamas į „8. AI Agentai“ patvirtinimo eilę.
                        </p>
                        <div className="flex items-center gap-2 pt-1">
                            <span className="font-mono font-bold text-[#C2410C]">Saugiklio riba: {policy.maxPriceDropPct}%</span>
                            <button
                                type="button"
                                onClick={() => handleSavePolicy({ maxPriceDropPct: policy.maxPriceDropPct === 20 ? 15 : 20 })}
                                className="h-8 px-2.5 rounded-lg border border-[#D5CFC3] bg-white text-[#11161B] font-bold cursor-pointer whitespace-nowrap"
                            >
                                Keisti ribą (15% / 20%)
                            </button>
                        </div>
                    </div>

                    <div className="rounded-xl border border-[#E2DDD3] bg-[#FAF9F6] p-3.5 space-y-1.5">
                        <strong className="text-[#11161B] block">Minimali leistina marža (15%)</strong>
                        <p className="text-[#5B6470]">
                            Kiekvienas MCP kainos keitimas tikrinamas prieš „Prototechnika Skaita“ savikainą. Kaina negali kristi žemiau savikainos + {policy.minMarginFloorPct}% maržos.
                        </p>
                        <span className="font-mono font-bold text-[#0F5A2B] block pt-1">
                            Aktyvi grindų apsauga: &ge; {policy.minMarginFloorPct}% marža
                        </span>
                    </div>

                    <div className="rounded-xl border border-[#E2DDD3] bg-[#FAF9F6] p-3.5 space-y-1.5">
                        <strong className="text-[#11161B] block">
                            Masiniai kainų pokyčiai ir B2B nuolaidos -&gt; per Proposal-Review-Apply patvirtinimą
                        </strong>
                        <p className="text-[#5B6470]">
                            1) SHA-256 Bearer raktai · 2) RBAC teisės · 3) Finansinis saugiklis · 4) 60 užkl./min. ir XSS/SQL filtras · 5) Audit žurnalas.
                        </p>
                        <span className="font-mono font-bold text-[#11161B] block pt-1">Būsena: PRIVALOMA ŽMOGAUS PATIKRA</span>
                    </div>
                </div>
            </div>

            <div data-testid="mcp-keys-manager" className="rounded-2xl border border-[#E2DDD3] bg-white p-5 sm:p-6 space-y-4">
                <div>
                    <span className="text-xs font-bold text-[#C2410C] block">1 ir 2 Sluoksniai · SHA-256 Bearer Raktai ir RBAC Teisių Lygiai</span>
                    <h3 className="text-lg font-extrabold text-[#11161B]">MCP API Raktų Valdymas (read_only · operator_safe · full_admin)</h3>
                </div>

                <form onSubmit={handleGenerateKey} className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                    <input
                        type="text"
                        value={keyName}
                        onChange={(e) => setKeyName(e.target.value)}
                        placeholder="Pavadinimas: pvz. Dariaus Claude Desktop"
                        className="h-10 px-3 rounded-lg border border-[#D5CFC3] bg-[#FAF9F6]"
                    />
                    <select
                        value={keyScope}
                        onChange={(e) => setKeyScope(e.target.value as McpScopeTier)}
                        className="h-10 px-3 rounded-lg border border-[#D5CFC3] bg-[#FAF9F6] font-semibold"
                    >
                        <option value="operator_safe">operator_safe (Valdo prekes/sąskaitas + Finansinis saugiklis)</option>
                        <option value="read_only">read_only (Tik skaitymas ir analitika — jokio keitimo)</option>
                        <option value="full_admin">full_admin (Pilnos administratoriaus teisės)</option>
                    </select>
                    <button
                        type="submit"
                        data-testid="mcp-generate-key-btn"
                        className="h-10 px-4 rounded-lg bg-[#C2410C] hover:bg-[#9E3308] text-white font-bold cursor-pointer whitespace-nowrap"
                    >
                        Sugeneruoti MCP raktą
                    </button>
                </form>

                {newlyGeneratedKey && (
                    <div className="rounded-xl bg-[#11161B] text-[#F5F3EE] p-3.5 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="space-y-0.5">
                            <span className="text-[#FF8A3D] font-bold block">Naujas MCP API raktas (saugomas kaip SHA-256 hash):</span>
                            <code className="font-mono text-white break-all">{newlyGeneratedKey}</code>
                        </div>
                        <button
                            type="button"
                            onClick={() => handleCopyText(newlyGeneratedKey, 'MCP Bearer raktas')}
                            className="h-9 px-3 rounded-lg bg-[#C2410C] text-white font-bold cursor-pointer whitespace-nowrap shrink-0"
                        >
                            Kopijuoti raktą
                        </button>
                    </div>
                )}

                {keys.length === 0 ? (
                    <p className="text-xs text-[#5B6470]">
                        Šiuo metu aktyvių išorinių MCP raktų nėra. Sugeneruokite raktą viršuje, kad prijungtumėte Claude Desktop arba Claude Code.
                    </p>
                ) : (
                    <div className="space-y-2 text-xs">
                        {keys.map((k) => (
                            <div key={k.id} className="rounded-xl border border-[#E2DDD3] bg-[#FAF9F6] p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <div>
                                    <strong className="text-[#11161B]">{k.name}</strong> · <code className="font-mono text-[#C2410C]">{k.maskedPrefix}</code> · <span className="font-bold text-[#0F5A2B]">Teisės: {k.scope}</span>
                                    {k.revokedAt && <span className="ml-2 text-[#8A2F07] font-bold">(ATŠAUKTAS)</span>}
                                </div>
                                {!k.revokedAt && (
                                    <button
                                        type="button"
                                        onClick={() => handleRevokeKey(k.id)}
                                        className="h-8 px-3 rounded-lg border border-[#D5CFC3] bg-white text-[#8A2F07] font-bold cursor-pointer whitespace-nowrap"
                                    >
                                        Atšaukti raktą
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div data-testid="mcp-claude-config" className="rounded-2xl border border-[#E2DDD3] bg-white p-5 sm:p-6 space-y-4">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                    <div>
                        <span className="text-xs font-bold text-[#C2410C] block">
                            Greitas Prijungimas · Stdio ir HTTP Streamable Transportas · Aktyvus adresas: {resolvedMcpEndpoint}
                        </span>
                        <h3 className="text-lg font-extrabold text-[#11161B]">
                            Claude Desktop (claude_desktop_config.json) ir Claude Code (.mcp.json) Konfigūracija
                        </h3>
                    </div>

                    <div
                        data-testid="mcp-origin-mode-toggle"
                        className="inline-flex flex-wrap rounded-lg border border-[#D5CFC3] bg-[#FAF9F6] p-1 gap-1 text-xs"
                    >
                        <button
                            type="button"
                            onClick={() => setOriginMode('production')}
                            className={`h-9 px-3 rounded-md font-bold cursor-pointer ${
                                originMode === 'production'
                                    ? 'bg-[#11161B] text-white'
                                    : 'text-[#11161B]'
                            }`}
                        >
                            Produkcija: {PRODUCTION_PRIMARY_ORIGIN}
                        </button>
                        <button
                            type="button"
                            onClick={() => setOriginMode('current')}
                            className={`h-9 px-3 rounded-md font-bold cursor-pointer ${
                                originMode === 'current'
                                    ? 'bg-[#11161B] text-white'
                                    : 'text-[#11161B]'
                            }`}
                        >
                            Dabartinis adresas: {activeRuntimeOrigin}
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-xs">
                    <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                            <strong className="text-[#11161B]">1. Claude Desktop (Stdio · mcp/giles-mcp-stdio.mjs)</strong>
                            <button
                                type="button"
                                onClick={() => handleCopyText(claudeDesktopStdioConfig, 'claude_desktop_config.json')}
                                className="h-8 px-3 rounded-lg border border-[#11161B] bg-[#FAF9F6] font-bold text-[#11161B] cursor-pointer whitespace-nowrap"
                            >
                                Kopijuoti Stdio JSON
                            </button>
                        </div>
                        <pre className="p-3 rounded-xl bg-[#11161B] text-[#F5F3EE] font-mono overflow-x-auto max-h-48">{claudeDesktopStdioConfig}</pre>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                            <strong className="text-[#11161B]">2. Claude Code / OpenCode (HTTP · /api/mcp)</strong>
                            <button
                                type="button"
                                onClick={() => handleCopyText(claudeCodeHttpConfig, '.mcp.json HTTP')}
                                className="h-8 px-3 rounded-lg border border-[#11161B] bg-[#FAF9F6] font-bold text-[#11161B] cursor-pointer whitespace-nowrap"
                            >
                                Kopijuoti HTTP JSON
                            </button>
                        </div>
                        <pre className="p-3 rounded-xl bg-[#11161B] text-[#F5F3EE] font-mono overflow-x-auto max-h-48">{claudeCodeHttpConfig}</pre>
                    </div>
                </div>
            </div>

            <div data-testid="mcp-playground" className="rounded-2xl border border-[#E2DDD3] bg-white p-5 sm:p-6 space-y-4">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                    <div>
                        <span className="text-xs font-bold text-[#C2410C] block">Interaktyvi 32 Įrankių ir 10 Resursų MCP Smėliadėžė ir Finansinio Saugiklio Testavimas</span>
                        <h3 className="text-lg font-extrabold text-[#11161B]">Išbandyti 32 MCP Parduotuvės, Vidinių AI Agentų, Tiekėjų bei B2B CRM Įrankius ir Saugumo Žurnalą</h3>
                    </div>
                    <button
                        type="button"
                        data-testid="mcp-test-circuit-breaker-btn"
                        onClick={handleSimulateCircuitBreaker}
                        className="h-10 px-3.5 rounded-lg bg-[#11161B] hover:bg-[#C2410C] text-white text-xs font-bold cursor-pointer whitespace-nowrap"
                    >
                        Simuliuoti Claude bandymą sumažinti MPB-NANI-35 kainą -45% (Saugiklio testas)
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 text-xs">
                    <select
                        value={selectedTool}
                        onChange={(e) => setSelectedTool(e.target.value)}
                        className="h-10 px-3 rounded-lg border border-[#D5CFC3] bg-[#FAF9F6] font-semibold"
                    >
                        {MCP_STORE_TOOLS.map((t) => (
                            <option key={t.name} value={t.name}>
                                [{t.scopeCategory.toUpperCase()}] {t.name} — {t.title}
                            </option>
                        ))}
                    </select>

                    <select
                        value={playgroundScope}
                        onChange={(e) => setPlaygroundScope(e.target.value as McpScopeTier)}
                        className="h-10 px-3 rounded-lg border border-[#D5CFC3] bg-[#FAF9F6] font-semibold"
                    >
                        <option value="operator_safe">Simuliuoti su: operator_safe</option>
                        <option value="read_only">Simuliuoti su: read_only</option>
                        <option value="full_admin">Simuliuoti su: full_admin</option>
                    </select>

                    <button
                        type="button"
                        onClick={handleRunSelectedTool}
                        className="h-10 px-4 rounded-lg bg-[#157A3B] hover:bg-[#0F5A2B] text-white font-bold cursor-pointer whitespace-nowrap"
                    >
                        Vykdyti MCP tools/call
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 text-xs">
                    <div className="space-y-1">
                        <strong className="text-[#11161B] block">JSON-RPC argumentai (arguments):</strong>
                        <textarea
                            rows={4}
                            value={toolArgsJson}
                            onChange={(e) => setToolArgsJson(e.target.value)}
                            className="w-full p-3 rounded-xl border border-[#D5CFC3] bg-[#FAF9F6] font-mono"
                        />
                    </div>
                    <div className="space-y-1">
                        <strong className="text-[#11161B] block">MCP JSON-RPC 2.0 atsakymas:</strong>
                        <pre className="p-3 rounded-xl bg-[#11161B] text-[#F5F3EE] font-mono overflow-x-auto max-h-36">
                            {playgroundResult || '// Paspauskite „Vykdyti MCP tools/call“ arba „Saugiklio testas“'}
                        </pre>
                    </div>
                </div>

                <div data-testid="mcp-audit-log" className="space-y-2 pt-2 text-xs">
                    <strong className="text-[#11161B] block">5 Sluoksnis · Nekintamas MCP Saugumo Audito Žurnalas (auditLog):</strong>
                    {auditLog.length === 0 ? (
                        <p className="text-[#5B6470]">Audito žurnalas švarus (0 įrašų). Kiekvienas Claude ar kito MCP agento veiksmas bus užfiksuotas čia.</p>
                    ) : (
                        <div className="space-y-1.5">
                            {auditLog.slice(0, 8).map((entry) => (
                                <div key={entry.id} className="rounded-lg border border-[#E2DDD3] bg-[#FAF9F6] p-2.5 flex flex-wrap items-center justify-between gap-2">
                                    <div>
                                        <span className="font-mono font-bold text-[#C2410C]">[{entry.decision}]</span>{' '}
                                        <strong className="text-[#11161B]">{entry.actor}</strong> · <code className="font-mono">{entry.toolName || entry.method}</code>
                                    </div>
                                    <span className="text-[#5B6470]">{entry.summary}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}
