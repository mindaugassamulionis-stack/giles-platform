import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { GILES_SUPPLIER_PRICELISTS } from './giles-masterpiece-data';
import {
    getB2BCrmAnalyticsSnapshot,
    getB2BPricingStore,
} from './b2b-pricing-engine';
import {
    getAiAgentsList,
    getAiAgentLogs,
    getSuppliersList,
} from './suppliers-and-agents-store';
import {
    MCP_STORE_TOOLS,
    MCP_STORE_RESOURCES,
    MCP_STORE_PROMPTS,
    type McpScopeTier,
    type McpToolDefinition,
} from './mcp-store-catalog';
import { executeStoreTool } from './mcp-store-tools-exec';

export {
    MCP_STORE_TOOLS,
    MCP_STORE_RESOURCES,
    MCP_STORE_PROMPTS,
    type McpScopeTier,
    type McpToolDefinition,
};

export interface McpSecurityPolicy {
    maxPriceDropPct: number;
    minMarginFloorPct: number;
    maxStockDeltaUnits: number;
    enforceFinancialGuardrails: boolean;
    requireHumanApprovalForBulkAndB2b: boolean;
    allowHighRiskDirect: boolean;
    rateLimitPerMinute: number;
}

export interface McpApiKeyRecord {
    id: string;
    name: string;
    scope: McpScopeTier;
    maskedPrefix: string;
    keyHash: string;
    createdAt: string;
    lastUsedAt: string | null;
    revokedAt: string | null;
}

export interface McpAuditLogEntry {
    id: string;
    timestamp: string;
    actor: string;
    scope: McpScopeTier | 'unauthenticated';
    method: string;
    toolName: string | null;
    decision: 'ALLOWED' | 'QUEUED_FOR_APPROVAL' | 'DENIED';
    summary: string;
}

export interface McpSecurityDatabase {
    policy: McpSecurityPolicy;
    keys: McpApiKeyRecord[];
    auditLog: McpAuditLogEntry[];
}

const MCP_SECURITY_PATH = path.join(process.cwd(), 'src', 'data', 'mcp-security.json');
const AGENT_PROPOSALS_PATH = path.join(process.cwd(), 'src', 'data', 'agent-proposals.json');

const DEFAULT_POLICY: McpSecurityPolicy = {
    maxPriceDropPct: 20,
    minMarginFloorPct: 15,
    maxStockDeltaUnits: 200,
    enforceFinancialGuardrails: true,
    requireHumanApprovalForBulkAndB2b: true,
    allowHighRiskDirect: false,
    rateLimitPerMinute: 60,
};

const rateBuckets = new Map<string, { windowStart: number; count: number }>();
let memorySecurityDb: McpSecurityDatabase | null = null;

export function hashMcpKey(rawKey: string): string {
    return crypto.createHash('sha256').update(rawKey).digest('hex');
}

export function loadMcpSecurityDb(): McpSecurityDatabase {
    if (memorySecurityDb) return memorySecurityDb;
    try {
        if (fs.existsSync(MCP_SECURITY_PATH)) {
            const raw = JSON.parse(fs.readFileSync(MCP_SECURITY_PATH, 'utf-8'));
            memorySecurityDb = {
                policy: { ...DEFAULT_POLICY, ...(raw?.policy || {}) },
                keys: Array.isArray(raw?.keys) ? raw.keys : [],
                auditLog: Array.isArray(raw?.auditLog) ? raw.auditLog : [],
            };
            return memorySecurityDb;
        }
    } catch {
        // fallback to default
    }
    memorySecurityDb = { policy: { ...DEFAULT_POLICY }, keys: [], auditLog: [] };
    return memorySecurityDb;
}

export function saveMcpSecurityDb(db: McpSecurityDatabase): void {
    memorySecurityDb = db;
    try {
        fs.mkdirSync(path.dirname(MCP_SECURITY_PATH), { recursive: true });
        fs.writeFileSync(MCP_SECURITY_PATH, JSON.stringify(db, null, 2) + '\n', 'utf-8');
    } catch {
        // non-fatal in read-only runner
    }
}

export function resetMcpSecurityDatabase(): McpSecurityDatabase {
    rateBuckets.clear();
    const clean: McpSecurityDatabase = {
        policy: { ...DEFAULT_POLICY },
        keys: [],
        auditLog: [],
    };
    saveMcpSecurityDb(clean);
    try {
        fs.mkdirSync(path.dirname(AGENT_PROPOSALS_PATH), { recursive: true });
        fs.writeFileSync(AGENT_PROPOSALS_PATH, JSON.stringify({ proposals: [] }, null, 2) + '\n', 'utf-8');
    } catch {
        // ignore
    }
    return clean;
}

export function recordMcpAudit(entry: Omit<McpAuditLogEntry, 'id' | 'timestamp'>): McpAuditLogEntry {
    const db = loadMcpSecurityDb();
    const record: McpAuditLogEntry = {
        id: `AUD-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
        timestamp: new Date().toISOString(),
        ...entry,
    };
    db.auditLog = [record, ...db.auditLog].slice(0, 120);
    saveMcpSecurityDb(db);
    return record;
}

export function generateMcpApiKey(input: { name: string; scope: McpScopeTier }): {
    rawKey: string;
    keyRecord: McpApiKeyRecord;
    keys: McpApiKeyRecord[];
} {
    const db = loadMcpSecurityDb();
    const rand = crypto.randomBytes(18).toString('hex');
    const rawKey = `giles_mcp_live_${rand}`;
    const keyRecord: McpApiKeyRecord = {
        id: `key-${Date.now()}-${rand.slice(0, 6)}`,
        name: input.name.trim() || 'Claude Desktop MCP Raktas',
        scope: input.scope,
        maskedPrefix: `giles_mcp_live_****${rand.slice(-4)}`,
        keyHash: hashMcpKey(rawKey),
        createdAt: new Date().toISOString(),
        lastUsedAt: null,
        revokedAt: null,
    };
    db.keys = [keyRecord, ...db.keys];
    saveMcpSecurityDb(db);
    return { rawKey, keyRecord, keys: db.keys };
}

export function revokeMcpApiKey(keyId: string): McpApiKeyRecord[] {
    const db = loadMcpSecurityDb();
    db.keys = db.keys.map((k) =>
        k.id === keyId ? { ...k, revokedAt: new Date().toISOString() } : k,
    );
    saveMcpSecurityDb(db);
    return db.keys;
}

export function updateMcpSecurityPolicy(patch: Partial<McpSecurityPolicy>): McpSecurityPolicy {
    const db = loadMcpSecurityDb();
    db.policy = { ...db.policy, ...patch };
    saveMcpSecurityDb(db);
    return db.policy;
}

export function inspectPayloadForInjection(rawText: string): string | null {
    const dangerPatterns = [/<script/i, /\.\.\//, /DROP\s+TABLE/i, /UNION\s+SELECT/i, /;\s*rm\s+-rf/i];
    for (const pat of dangerPatterns) {
        if (pat.test(rawText)) {
            return `Blocked unsafe pattern (${pat.source})`;
        }
    }
    return null;
}

export function checkRateLimit(actorKey: string, limitPerMin: number): boolean {
    const now = Date.now();
    const cur = rateBuckets.get(actorKey);
    if (!cur || now - cur.windowStart > 60_000) {
        rateBuckets.set(actorKey, { windowStart: now, count: 1 });
        return true;
    }
    if (cur.count >= limitPerMin) return false;
    cur.count += 1;
    return true;
}

const PUBLIC_DISCOVERY_ALLOWED_TOOLS = new Set([
    'public_catalog_expert_search',
    'public_hydronic_calculator_run',
    'public_boiler_compatibility_lookup',
    'vytautas_engineering_consult',
    'customer_personal_cart_assemble',
]);

export function authenticateMcpCaller(req: Request): {
    authenticated: boolean;
    role?: 'public_discovery' | 'authenticated_key' | 'admin_playground' | 'unauthenticated';
    scopes?: string[];
    actor: string;
    scope: McpScopeTier;
    keyId: string;
} {
    const authHeader = (req.headers.get('authorization') || '').trim();
    const apiKeyHeader = (req.headers.get('x-mcp-api-key') || '').trim();
    const playgroundHeader = req.headers.get('x-giles-admin-playground') === '1';

    let rawToken = '';
    if (authHeader.toLowerCase().startsWith('bearer ')) {
        rawToken = authHeader.slice(7).trim();
    } else if (apiKeyHeader) {
        rawToken = apiKeyHeader;
    }

    if (rawToken) {
        if (
            [
                'public',
                'public_discovery',
                'giles_public_discovery',
                'giles_personal_shopper_public_key',
            ].includes(rawToken.toLowerCase())
        ) {
            return {
                authenticated: true,
                role: 'public_discovery',
                scopes: ['public_read'],
                actor: 'Išorinis AI Agentas (Tier-0 Open Public Discovery)',
                scope: 'public_discovery',
                keyId: 'public-discovery-tier0',
            };
        }

        const hashed = hashMcpKey(rawToken);
        const db = loadMcpSecurityDb();
        const found = db.keys.find((k) => k.keyHash === hashed && !k.revokedAt);
        if (found) {
            found.lastUsedAt = new Date().toISOString();
            saveMcpSecurityDb(db);
            return {
                authenticated: true,
                role: 'authenticated_key',
                scopes: [found.scope],
                actor: `${found.name} (${found.maskedPrefix})`,
                scope: found.scope,
                keyId: found.id,
            };
        }

        return {
            authenticated: false,
            role: 'unauthenticated',
            scopes: [],
            actor: 'Unauthenticated Caller (Invalid Bearer Token)',
            scope: 'read_only',
            keyId: 'unauth',
        };
    }

    if (playgroundHeader) {
        const reqUrl = new URL(req.url);
        const isLocal =
            reqUrl.hostname === 'localhost' ||
            reqUrl.hostname === '127.0.0.1' ||
            reqUrl.hostname === '::1';
        if (isLocal) {
            const reqScope = req.headers.get('x-giles-playground-scope') as McpScopeTier | null;
            const validScope: McpScopeTier =
                reqScope === 'read_only' || reqScope === 'full_admin' ? reqScope : 'operator_safe';
            return {
                authenticated: true,
                role: 'admin_playground',
                scopes: [validScope],
                actor: 'Darius Šauklys (Admin Playground)',
                scope: validScope,
                keyId: 'admin-playground-local',
            };
        }
    }

    // Tier-0 Open Public Discovery for anonymous external AI agents (no Bearer header required)
    return {
        authenticated: true,
        role: 'public_discovery',
        scopes: ['public_read'],
        actor: 'Išorinis AI Agentas (Tier-0 Open Public Discovery)',
        scope: 'public_discovery',
        keyId: 'public-discovery-tier0',
    };
}

export function dispatchMcpJsonRpc(
    body: { jsonrpc?: string; id?: unknown; method?: string; params?: Record<string, unknown> },
    caller: { actor: string; scope: McpScopeTier },
): { status: number; response: Record<string, unknown> } {
    const id = body?.id ?? null;
    const method = String(body?.method || '');
    const params = (body?.params || {}) as Record<string, unknown>;
    const db = loadMcpSecurityDb();

    if (method === 'initialize') {
        recordMcpAudit({
            actor: caller.actor,
            scope: caller.scope,
            method,
            toolName: null,
            decision: 'ALLOWED',
            summary: `MCP initialize (${String(params.protocolVersion || '2025-03-26')})`,
        });
        return {
            status: 200,
            response: {
                jsonrpc: '2.0',
                id,
                result: {
                    protocolVersion: String(params.protocolVersion || '2025-03-26'),
                    capabilities: {
                        tools: { listChanged: false },
                        resources: { subscribe: false, listChanged: false },
                        prompts: { listChanged: false },
                    },
                    serverInfo: {
                        name: 'giles-inzinerija-mcp',
                        version: '1.1.0',
                        title: 'UAB Gilės inžinerija Security-First & Open Discovery MCP Server',
                        tier0OpenDiscovery: true,
                        discoveryManifestUrl: '/.well-known/mcp.json',
                        callerRole: caller.scope,
                    },
                },
            },
        };
    }

    if (method === 'notifications/initialized' || method === 'ping') {
        return { status: 200, response: { jsonrpc: '2.0', id, result: { ok: true } } };
    }

    if (method === 'tools/list') {
        return { status: 200, response: { jsonrpc: '2.0', id, result: { tools: MCP_STORE_TOOLS } } };
    }

    if (method === 'resources/list') {
        return { status: 200, response: { jsonrpc: '2.0', id, result: { resources: MCP_STORE_RESOURCES } } };
    }

    if (method === 'resources/read') {
        const uri = String(params.uri || 'giles://store/overview');
        const b2bStore = getB2BPricingStore();
        const payload =
            uri === 'giles://catalog/suppliers'
                ? { suppliers: GILES_SUPPLIER_PRICELISTS }
                : uri === 'giles://security/mcp-policy'
                  ? { policy: db.policy }
                  : uri === 'giles://b2b/crm-analytics'
                    ? getB2BCrmAnalyticsSnapshot()
                    : uri === 'giles://b2b/pricing-rules'
                      ? {
                            customerRules: b2bStore.customerRules,
                            globalVolumeTiers: b2bStore.globalVolumeTiers,
                            globalQuantityTiers: b2bStore.globalQuantityTiers,
                        }
                      : uri === 'giles://b2b/campaigns'
                        ? {
                              campaigns: b2bStore.campaigns,
                              individualOffers: b2bStore.individualOffers,
                          }
                        : uri === 'giles://admin/ai-agents-and-logs'
                          ? {
                                agents: getAiAgentsList(),
                                logs: getAiAgentLogs('all'),
                                unansweredLogs: getAiAgentLogs('unanswered'),
                            }
                          : uri === 'giles://admin/suppliers-and-pricelists'
                            ? {
                                  suppliers: getSuppliersList(),
                              }
                            : executeStoreTool('giles_store_overview', {}, caller, db.policy).payload;
        return {
            status: 200,
            response: {
                jsonrpc: '2.0',
                id,
                result: {
                    contents: [{ uri, mimeType: 'application/json', text: JSON.stringify(payload, null, 2) }],
                },
            },
        };
    }

    if (method === 'prompts/list') {
        return { status: 200, response: { jsonrpc: '2.0', id, result: { prompts: MCP_STORE_PROMPTS } } };
    }

    if (method === 'prompts/get') {
        const name = String(params.name || 'audit_low_margin_and_stock');
        const promptDef = MCP_STORE_PROMPTS.find((p) => p.name === name) || MCP_STORE_PROMPTS[0]!;
        return {
            status: 200,
            response: {
                jsonrpc: '2.0',
                id,
                result: {
                    description: promptDef.description,
                    messages: [
                        {
                            role: 'user',
                            content: {
                                type: 'text',
                                text: `Vykdyk UAB „Gilės inžinerija“ MCP užduotį: ${promptDef.description}. Naudok giles_* įrankius ir laikykis 15% maržos grindų.`,
                            },
                        },
                    ],
                },
            },
        };
    }

    if (method === 'tools/call') {
        const toolName = String(params.name || '');
        const toolArgs = ((params.arguments || {}) as Record<string, unknown>) || {};
        const toolDef = MCP_STORE_TOOLS.find((t) => t.name === toolName);

        if (!toolDef) {
            return {
                status: 404,
                response: {
                    jsonrpc: '2.0',
                    id,
                    error: { code: -32601, message: `MCP tool not found: ${toolName}` },
                },
            };
        }

        if (
            caller.scope === 'public_discovery' &&
            toolDef.scopeCategory !== 'public_read' &&
            !PUBLIC_DISCOVERY_ALLOWED_TOOLS.has(toolName)
        ) {
            recordMcpAudit({
                actor: caller.actor,
                scope: caller.scope,
                method,
                toolName,
                decision: 'DENIED',
                summary: `Atmesta (401 Unauthorized): viešas Tier-0 agentas bandė kviesti apsaugotą įrankį ${toolName} (${toolDef.scopeCategory})`,
            });
            return {
                status: 401,
                response: {
                    jsonrpc: '2.0',
                    id,
                    error: {
                        code: -32001,
                        message: `Unauthorized: įrankis ${toolName} (${toolDef.scopeCategory}) reikalauja B2B arba Admin Authorization: Bearer giles_mcp_... rakto`,
                    },
                },
            };
        }

        if (
            caller.scope === 'read_only' &&
            toolDef.scopeCategory !== 'read' &&
            toolDef.scopeCategory !== 'public_read'
        ) {
            recordMcpAudit({
                actor: caller.actor,
                scope: caller.scope,
                method,
                toolName,
                decision: 'DENIED',
                summary: `RBAC blokavimas: read_only raktas bandė vykdyti ${toolName} (${toolDef.scopeCategory})`,
            });
            return {
                status: 403,
                response: {
                    jsonrpc: '2.0',
                    id,
                    error: {
                        code: -32003,
                        message: `Forbidden: read_only MCP key cannot execute ${toolDef.scopeCategory} tool ${toolName}`,
                    },
                },
            };
        }

        const outcome = executeStoreTool(toolName, toolArgs, caller, db.policy);
        recordMcpAudit({
            actor: caller.actor,
            scope: caller.scope,
            method,
            toolName,
            decision: outcome.decision,
            summary:
                outcome.decision === 'QUEUED_FOR_APPROVAL'
                    ? `Finansinis saugiklis: ${toolName} -> ${String(outcome.payload.proposalId || 'Proposal')}`
                    : `Įvykdyta ${toolName}`,
        });

        return {
            status: 200,
            response: {
                jsonrpc: '2.0',
                id,
                result: {
                    content: [{ type: 'text', text: JSON.stringify(outcome.payload, null, 2) }],
                    structuredContent: outcome.payload,
                    isError: false,
                },
            },
        };
    }

    return {
        status: 400,
        response: {
            jsonrpc: '2.0',
            id,
            error: { code: -32601, message: `Unsupported MCP JSON-RPC 2.0 method: ${method}` },
        },
    };
}
