import { NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';
import { getGilesCatalogSkuCount } from '../../../../lib/catalog-count';
import { formatCatalogCount } from '../../../../lib/w121-honest-commerce';
import {
    addOrUpdateAiAgent,
    getAiAgentLogs,
    getAiAgentsList,
    loadSampleAgentAuditLogs,
    resetSuppliersAndAgentsStore,
    resolveAiAgentLogEntry,
    runAiAgentDiagnosticCheck,
    toggleAiAgentExecutionMode,
    type AiAgentExecutionMode,
    type AiAgentProvider,
    type GilesActiveAiAgent,
    type GilesAiAgentLogEntry,
} from '../../../../lib/suppliers-and-agents-store';

export type { GilesActiveAiAgent, GilesAiAgentLogEntry };

export interface GilesAgentProposal {
    id: string;
    proposalNumber: string;
    agentName: string;
    title: string;
    impactSummary: string;
    confidencePercent: number;
    targetModule: 'catalog' | 'support' | 'b2b' | 'skaita';
    status: 'PENDING_REVIEW' | 'APPLIED' | 'REJECTED';
    reviewedBy: string | null;
}

const DEFAULT_PROPOSALS: GilesAgentProposal[] = [
    {
        id: 'PRP-01',
        proposalNumber: 'PRP-01',
        agentName: 'Kainodaros ir 15% Maržos Saugiklio Agentas',
        title: 'PRP-01: Sinchronizuoti Megatherm MPB atsarginių dalių komplektų savikainas su „Skaita“ sandėlio likučiais',
        impactSummary:
            'Užtikrina keraminio uždegimo teno (MPB-IGN-300), fotosensorių (MPB-PHOTO-01) ir sraigtų reduktorių pozicijų maržos kontrolę pagal aktualų tiekėjo kainyną.',
        confidencePercent: 97,
        targetModule: 'catalog',
        status: 'PENDING_REVIEW',
        reviewedBy: null,
    },
    {
        id: 'PRP-02',
        proposalNumber: 'PRP-02',
        agentName: 'SEO / GEO (/llms.txt ir JSON-LD) Rinkos Lyderio Agentas',
        title: 'PRP-02: Patikrinti 3 659 Kauno sandėlio pozicijų likučių sinchronizaciją su EGIP.lt ir „Skaita“',
        impactSummary:
            `Palaiko ${formatCatalogCount(getGilesCatalogSkuCount() ?? 6337, 'lt')} prekių katalogo ir oficialių tiekėjų kainynų (Danfoss, HERZ, Gorenje/TIKI, Gilės/Megatherm, Haier) duomenų vientisumą.`,
        confidencePercent: 95,
        targetModule: 'catalog',
        status: 'PENDING_REVIEW',
        reviewedBy: null,
    },
];

let memoryProposals: GilesAgentProposal[] = DEFAULT_PROPOSALS.map((p) => ({ ...p }));

const AGENT_PROPOSALS_PATH = path.join(
    process.cwd(),
    'src',
    'data',
    'agent-proposals.json',
);

function readPersistedProposals(): GilesAgentProposal[] {
    try {
        if (fs.existsSync(AGENT_PROPOSALS_PATH)) {
            const parsed = JSON.parse(fs.readFileSync(AGENT_PROPOSALS_PATH, 'utf-8'));
            if (Array.isArray(parsed?.proposals)) {
                return parsed.proposals;
            }
        }
    } catch {
        // ignore read error
    }
    return [];
}

function writePersistedProposals(proposals: GilesAgentProposal[]): void {
    try {
        fs.mkdirSync(path.dirname(AGENT_PROPOSALS_PATH), { recursive: true });
        fs.writeFileSync(
            AGENT_PROPOSALS_PATH,
            JSON.stringify({ proposals }, null, 2) + '\n',
            'utf-8',
        );
    } catch {
        // non-fatal in read-only runner
    }
}

export async function GET() {
    const persisted = readPersistedProposals();
    const combinedProposals = [
        ...persisted,
        ...memoryProposals.filter((m) => !persisted.some((p) => p.id === m.id)),
    ];
    return NextResponse.json({
        ok: true,
        architecture: 'Platform-OS Proposal -> Review -> Apply Governance Control Plane',
        agents: getAiAgentsList(),
        proposals: combinedProposals,
        logs: getAiAgentLogs('all'),
    });
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const action = String(body.action || '');

        if (action === 'reset_agents') {
            resetSuppliersAndAgentsStore();
            memoryProposals = DEFAULT_PROPOSALS.map((p) => ({ ...p }));
            return NextResponse.json({
                ok: true,
                agents: getAiAgentsList(),
                proposals: memoryProposals,
                logs: getAiAgentLogs(),
            });
        }

        if (action === 'upsert_agent') {
            const agent = addOrUpdateAiAgent({
                id: body.id,
                name: String(body.name || 'Custom AI Agentas'),
                role: body.role,
                description: body.description,
                provider: body.provider as AiAgentProvider | undefined,
                apiEndpointUrl: body.apiEndpointUrl,
                apiKey: body.apiKey,
                modelId: body.modelId,
                temperature: body.temperature,
                executionMode: body.executionMode as AiAgentExecutionMode | undefined,
                allowedMcpScopes: body.allowedMcpScopes,
                guardrailMinMarginPct: body.guardrailMinMarginPct,
                systemPrompt: body.systemPrompt,
                instructionsSummary: body.instructionsSummary,
                instructionsSteps: body.instructionsSteps,
            });
            return NextResponse.json({
                ok: true,
                action: 'upsert_agent',
                agent,
                agents: getAiAgentsList(),
                logs: getAiAgentLogs(),
            });
        }

        if (action === 'toggle_agent_mode') {
            const agentId = String(body.agentId || body.id || 'vytautas-consultant');
            const nextMode = body.executionMode as AiAgentExecutionMode | undefined;
            const agent = toggleAiAgentExecutionMode(agentId, nextMode);
            if (!agent) {
                return NextResponse.json(
                    { ok: false, error: 'AI agentas nerastas' },
                    { status: 404 },
                );
            }
            return NextResponse.json({
                ok: true,
                action: 'toggle_agent_mode',
                agent,
                agents: getAiAgentsList(),
                logs: getAiAgentLogs(),
            });
        }

        if (action === 'test_run_agent') {
            const agentId = String(body.agentId || body.id || 'vytautas-consultant');
            const result = runAiAgentDiagnosticCheck(agentId);
            return NextResponse.json({
                ok: true,
                action: 'test_run_agent',
                agent: result.agent,
                logEntry: result.logEntry,
                agents: getAiAgentsList(),
                logs: getAiAgentLogs(),
            });
        }

        if (action === 'load_sample_logs') {
            const logs = loadSampleAgentAuditLogs();
            return NextResponse.json({
                ok: true,
                action: 'load_sample_logs',
                logs,
            });
        }

        if (action === 'resolve_log_entry') {
            const logId = String(body.logId || '');
            const engineerReply = String(body.engineerReply || '');
            const entry = resolveAiAgentLogEntry({
                logId,
                engineerReply,
                resolvedBy: body.resolvedBy,
            });
            if (!entry) {
                return NextResponse.json(
                    { ok: false, error: 'Žurnalo įrašas nerastas' },
                    { status: 404 },
                );
            }
            return NextResponse.json({
                ok: true,
                action: 'resolve_log_entry',
                entry,
                logs: getAiAgentLogs(),
            });
        }

        const proposalId = String(body.proposalId || body.id || '');
        const decisionAction = body.action === 'reject' ? 'reject' : 'apply';
        const reviewedBy = String(body.reviewedBy || 'Darius Šauklys (Admin)');

        const persisted = readPersistedProposals();
        const pIdx = persisted.findIndex(
            (p) => p.id === proposalId || p.proposalNumber === proposalId,
        );
        if (pIdx !== -1) {
            const updated: GilesAgentProposal = {
                ...persisted[pIdx]!,
                status: decisionAction === 'apply' ? 'APPLIED' : 'REJECTED',
                reviewedBy,
            };
            persisted[pIdx] = updated;
            writePersistedProposals(persisted);
            const combined = [
                ...persisted,
                ...memoryProposals.filter((m) => !persisted.some((p) => p.id === m.id)),
            ];
            return NextResponse.json({
                ok: true,
                proposal: updated,
                proposals: combined,
                agents: getAiAgentsList(),
            });
        }

        const idx = memoryProposals.findIndex(
            (p) => p.id === proposalId || p.proposalNumber === proposalId,
        );
        if (idx === -1) {
            return NextResponse.json(
                { ok: false, error: 'AI agento pasiūlymas nerastas' },
                { status: 404 },
            );
        }

        const updated: GilesAgentProposal = {
            ...memoryProposals[idx]!,
            status: decisionAction === 'apply' ? 'APPLIED' : 'REJECTED',
            reviewedBy,
        };
        memoryProposals[idx] = updated;

        const combined = [
            ...persisted,
            ...memoryProposals.filter((m) => !persisted.some((p) => p.id === m.id)),
        ];

        return NextResponse.json({
            ok: true,
            proposal: updated,
            proposals: combined,
            agents: getAiAgentsList(),
        });
    } catch {
        return NextResponse.json(
            { ok: false, error: 'Nepavyko apdoroti AI agento veiksmo' },
            { status: 400 },
        );
    }
}

export async function PATCH(req: Request) {
    return POST(req);
}
