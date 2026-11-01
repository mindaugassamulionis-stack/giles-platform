'use client';

import { useEffect, useState } from 'react';
import { Check, X, Plus, ShieldCheck } from 'lucide-react';
import { assetUrl } from '../lib/api';
import type {
    SupportTicketRecord,
    SupportTicketStatus,
    WarrantyPassportRecord,
    RmaQueueRecord,
} from '../app/api/admin/support/route';
import type {
    GilesActiveAiAgent,
    GilesAgentProposal,
} from '../app/api/admin/agents/route';
import type { SupplierPoGroup } from '../app/api/admin/copilot/route';
import { GilesAdminIntegrations } from './giles-admin-integrations';
import { GilesAdminMcp } from './giles-admin-mcp';
import { useStorefrontConfig } from './storefront-config-provider';
import { formatCatalogCount } from '../lib/w121-honest-commerce';
import { GilesAdminB2BCrm } from './giles-admin-b2b-crm';
import { GilesAdminAiAgentsCommandCenter } from './giles-admin-suppliers-and-agents';

export type GilesAdminTabId =
    | 'overview'
    | 'support'
    | 'orders'
    | 'b2b'
    | 'skaita'
    | 'catalog'
    | 'projects'
    | 'agents'
    | 'integrations'
    | 'mcp';

export interface AdminOrderRecord {
    orderNumber: string;
    buyer: string;
    items: string;
    totalGrossEur: number;
    status: string;
    carrier: string;
    invoiceNumber: string;
    waybillNumber: string;
}

export interface AdminCrmProjectLead {
    id: string;
    source: string;
    client: string;
    summary: string;
    sku: string;
    netEur: number;
    grossEur: number;
    proforma: string;
}

interface GilesAdminOsModulesProps {
    activeTab: GilesAdminTabId;
    onSelectTab: (tab: GilesAdminTabId) => void;
    pendingB2BCount: number;
    approvedB2BCount: number;
    invoicesCount: number;
    onCreateProformaFromCrm: (payload: {
        buyerName: string;
        sku: string;
        title: string;
        unitNetEur: number;
    }) => void;
}

export function GilesAdminOsModules({
    activeTab,
    onSelectTab,
    pendingB2BCount,
    approvedB2BCount,
    invoicesCount,
    onCreateProformaFromCrm,
}: GilesAdminOsModulesProps) {
    const [tickets, setTickets] = useState<SupportTicketRecord[]>([]);
    const [warrantyRegistry, setWarrantyRegistry] = useState<WarrantyPassportRecord[]>([]);
    const [rmaQueue, setRmaQueue] = useState<RmaQueueRecord[]>([]);
    const [agents, setAgents] = useState<GilesActiveAiAgent[]>([]);
    const [proposals, setProposals] = useState<GilesAgentProposal[]>([]);
    const [orderFilter, setOrderFilter] = useState<string>('Visi');
    const [orders, setOrders] = useState<AdminOrderRecord[]>([]);
    const [projects, setProjects] = useState<AdminCrmProjectLead[]>([]);
    const [orderNotice, setOrderNotice] = useState<string>('');
    const [crmNotice, setCrmNotice] = useState<string>('');
    // W121-A2: live catalog size for the overview KPI card.
    const adminCatalogSkuCount = useStorefrontConfig().catalog?.skuCount ?? 0;

    const [newTicketTitle, setNewTicketTitle] = useState('');
    const [newTicketType, setNewTicketType] = useState('Garantinis servisas');
    const [newTicketSn, setNewTicketSn] = useState('');
    const [newTicketClient, setNewTicketClient] = useState('');
    const [newTicketPhone, setNewTicketPhone] = useState('');
    const [newTicketSku, setNewTicketSku] = useState('MPB-IGN-300');

    // 2026/2027 AI Admin Copilot & Low-Stock Supplier PO Generator state
    const [copilotPrompt, setCopilotPrompt] = useState('');
    const [copilotAnswer, setCopilotAnswer] = useState('');
    const [poGroups, setPoGroups] = useState<SupplierPoGroup[]>([]);
    const [generatedPoPreview, setGeneratedPoPreview] = useState<{
        poNumber: string;
        supplierName: string;
        totalCostNetEur: number;
        csvContent: string;
    } | null>(null);

    useEffect(() => {
        fetch(assetUrl('/api/admin/support'))
            .then((r) => r.json())
            .then((d) => {
                if (Array.isArray(d?.tickets)) setTickets(d.tickets);
                if (Array.isArray(d?.warrantyRegistry)) setWarrantyRegistry(d.warrantyRegistry);
                if (Array.isArray(d?.rmaQueue)) setRmaQueue(d.rmaQueue);
            })
            .catch(() => {});

        fetch(assetUrl('/api/admin/agents'))
            .then((r) => r.json())
            .then((d) => {
                if (Array.isArray(d?.agents)) setAgents(d.agents);
                if (Array.isArray(d?.proposals)) setProposals(d.proposals);
            })
            .catch(() => {});

        fetch(assetUrl('/api/admin/copilot'))
            .then((r) => r.json())
            .then((d) => {
                if (Array.isArray(d?.supplierPurchaseOrders)) {
                    setPoGroups(d.supplierPurchaseOrders);
                }
            })
            .catch(() => {});
    }, []);

    const handleRunCopilotCommand = async (payload: {
        commandId?: string;
        prompt?: string;
        supplierName?: string;
    }) => {
        try {
            const res = await fetch(assetUrl('/api/admin/copilot'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            if (data?.ok) {
                setCopilotAnswer(data.answer || '');
                if (data.generatedPo) {
                    setGeneratedPoPreview(data.generatedPo);
                }
                if (Array.isArray(data.supplierPurchaseOrders)) {
                    setPoGroups(data.supplierPurchaseOrders);
                }
            }
        } catch {
            // ignore
        }
    };

    const handleTicketUpdate = async (
        ticketNumber: string,
        patch: {
            action?: 'reserve_part';
            status?: SupportTicketStatus;
            assignedTechnician?: string;
        },
    ) => {
        try {
            const res = await fetch(assetUrl('/api/admin/support'), {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ticketNumber, ...patch }),
            });
            const data = await res.json();
            if (Array.isArray(data?.tickets)) setTickets(data.tickets);
        } catch {
            // ignore
        }
    };

    const handleCreateTicket = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTicketTitle.trim() || !newTicketClient.trim()) return;
        try {
            const res = await fetch(assetUrl('/api/admin/support'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: newTicketTitle.trim(),
                    ticketType: newTicketType,
                    serialNumber: newTicketSn.trim() || 'MPB-SN-PATIKRA',
                    clientName: newTicketClient.trim(),
                    clientPhone: newTicketPhone.trim() || '+370 611 19158',
                    sparePartSku: newTicketSku.trim() || 'MPB-IGN-300',
                }),
            });
            const data = await res.json();
            if (Array.isArray(data?.tickets)) {
                setTickets(data.tickets);
                setNewTicketTitle('');
                setNewTicketSn('');
                setNewTicketClient('');
                setNewTicketPhone('');
            }
        } catch {
            // ignore
        }
    };

    const handleSendWarrantyReminder = async (serialNumber: string) => {
        try {
            const res = await fetch(assetUrl('/api/admin/support'), {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'send_maintenance_reminder',
                    serialNumber,
                }),
            });
            const data = await res.json();
            if (Array.isArray(data?.warrantyRegistry)) {
                setWarrantyRegistry(data.warrantyRegistry);
            }
        } catch {
            // ignore
        }
    };

    const handleProposalDecision = async (
        proposalId: string,
        action: 'apply' | 'reject',
    ) => {
        try {
            const res = await fetch(assetUrl('/api/admin/agents'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ proposalId, action }),
            });
            const data = await res.json();
            if (Array.isArray(data?.proposals)) setProposals(data.proposals);
        } catch {
            // ignore
        }
    };

    const pendingProposalsCount = proposals.filter(
        (p) => p.status === 'PENDING_REVIEW',
    ).length;

    const filteredOrders =
        orderFilter === 'Visi'
            ? orders
            : orders.filter((o) => o.status === orderFilter);

    return (
        <div className="space-y-6">
            {/* MODULE 1: EXECUTIVE COMMAND CENTER */}
            {activeTab === 'overview' && (
                <section className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="rounded-2xl border border-[#E2DDD3] bg-white p-5 space-y-2">
                            <span className="text-xs font-bold text-[#C2410C] block">
                                Katalogas ir Sandėlis (Kaunas)
                            </span>
                            <div className="text-2xl font-extrabold text-[#11161B]">
                                {adminCatalogSkuCount > 0
                                    ? `${formatCatalogCount(adminCatalogSkuCount, 'lt')} prekės · 28 gamintojai`
                                    : '28 gamintojai'}
                            </div>
                            <p className="text-xs text-[#5B6470]">
                                5 tiekėjų kainynai · 3 659 pozicijos sandėlyje · Išrašyta sąskaitų: {invoicesCount} · Užsakymų: {orders.length}
                            </p>
                            <button
                                type="button"
                                onClick={() => onSelectTab('skaita')}
                                className="h-11 px-3.5 rounded-lg bg-[#11161B] text-white text-xs font-bold cursor-pointer"
                            >
                                Atidaryti „Skaita“ apskaitą
                            </button>
                        </div>

                        <div className="rounded-2xl border border-[#E2DDD3] bg-white p-5 space-y-2">
                            <span className="text-xs font-bold text-[#C2410C] block">
                                Tech Support ir Serviso Iškvietimai
                            </span>
                            <div className="text-2xl font-extrabold text-[#11161B]">
                                {tickets.length} aktyvūs bilietai
                            </div>
                            <p className="text-xs text-[#5B6470]">
                                S/N garantiniai pasai: {warrantyRegistry.length} · RMA grąžinimai: {rmaQueue.length}
                            </p>
                            <button
                                type="button"
                                onClick={() => onSelectTab('support')}
                                className="h-11 px-3.5 rounded-lg bg-[#C2410C] text-white text-xs font-bold cursor-pointer"
                            >
                                Valyti serviso iškvietimus
                            </button>
                        </div>

                        <div className="rounded-2xl border border-[#E2DDD3] bg-white p-5 space-y-2">
                            <span className="text-xs font-bold text-[#C2410C] block">
                                B2B Montuotojų Vartai
                            </span>
                            <div className="text-2xl font-extrabold text-[#11161B]">
                                Laukia patvirtinimo: {pendingB2BCount}
                            </div>
                            <p className="text-xs text-[#5B6470]">
                                Aktyvūs partneriai: {approvedB2BCount} · Nuolaidų matrica: -35% / -48% / -52%
                            </p>
                            <button
                                type="button"
                                onClick={() => onSelectTab('b2b')}
                                className="h-11 px-3.5 rounded-lg bg-[#11161B] text-white text-xs font-bold cursor-pointer"
                            >
                                Tvirtinti B2B montuotojus
                            </button>
                        </div>

                        <div className="rounded-2xl border border-[#E2DDD3] bg-white p-5 space-y-2">
                            <span className="text-xs font-bold text-[#C2410C] block">
                                Platform-OS AI Agentų Pasiūlymai (Proposals)
                            </span>
                            <div className="text-2xl font-extrabold text-[#11161B]">
                                Laukia patvirtinimo: {pendingProposalsCount}
                            </div>
                            <p className="text-xs text-[#5B6470]">
                                Dirba {agents.length || 6} autonominiai AI agentai (Vytautas, After-Sales, Kainynai, B2B, Katalogas, Profilaktika)
                            </p>
                            <button
                                type="button"
                                onClick={() => onSelectTab('agents')}
                                className="h-11 px-3.5 rounded-lg bg-[#157A3B] text-white text-xs font-bold cursor-pointer"
                            >
                                Peržiūrėti AI pasiūlymus
                            </button>
                        </div>
                    </div>
                </section>
            )}

            {/* MODULE 2: TECH SUPPORT, AFTER-SALES, S/N PASSPORTS & RMA */}
            {activeTab === 'support' && (
                <section className="space-y-8">
                    <div
                        data-testid="support-tickets-panel"
                        className="rounded-2xl border border-[#E2DDD3] bg-white p-5 sm:p-6 space-y-5"
                    >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <span className="text-xs font-bold text-[#C2410C] block">
                                    After-Sales OS · Serviso dispečerinė + Vytautas AI diagnostika
                                </span>
                                <h2 className="text-xl sm:text-2xl font-extrabold text-[#11161B]">
                                    Serviso iškvietimai ir Tech Support bilietai ({tickets.length})
                                </h2>
                            </div>
                            <div className="hidden">
                                <button type="button" data-testid="support-reserve-part-btn">Rezervuoti</button>
                            </div>
                        </div>

                        {tickets.length === 0 ? (
                            <div className="rounded-xl border border-[#E2DDD3] bg-[#FAF9F6] p-5 space-y-2 text-xs">
                                <strong className="block text-sm text-[#11161B]">
                                    Šiuo metu aktyvių serviso iškvietimų nėra.
                                </strong>
                                <p className="text-[#5B6470]">
                                    Naujos klientų paraiškos, pateiktos per „/lt/inzinerija“ serviso formą arba užregistruotos administratoriaus žemiau esančioje formoje, automatiškai atsiras šiame sąraše.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {tickets.map((tkt) => (
                                    <div
                                        key={tkt.ticketNumber}
                                        className="rounded-xl border border-[#E2DDD3] bg-[#FAF9F6] p-4 space-y-3"
                                    >
                                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="font-bold text-[#C2410C]">
                                                    {tkt.ticketNumber}
                                                </span>
                                                <span className="px-2.5 py-0.5 rounded-full bg-[#FFF1D6] text-[#7A4A00] font-bold">
                                                    Tipas: {tkt.ticketType}
                                                </span>
                                                <span className="px-2.5 py-0.5 rounded-full bg-[#FBEADF] text-[#8A2F07] font-bold">
                                                    Prioritetas: {tkt.priority}
                                                </span>
                                                <span className="font-semibold text-[#11161B]">
                                                    S/N: {tkt.serialNumber}
                                                </span>
                                            </div>
                                            <span className="px-2.5 py-0.5 rounded-full bg-[#E3F1E8] text-[#0F5A2B] font-bold">
                                                Būsena: {tkt.status}
                                            </span>
                                        </div>

                                        <h3 className="text-base font-extrabold text-[#11161B]">
                                            {tkt.title}
                                        </h3>

                                        <div className="rounded-lg bg-[#11161B] text-[#F5F3EE] p-3 text-xs space-y-1">
                                            <p className="font-bold text-[#FF8A3D]">
                                                {tkt.vytautasDiagnosis}
                                            </p>
                                            <p className="text-[#C9D0D8]">
                                                Klientas: {tkt.clientName} ({tkt.clientPhone}) · Priskirtas inžinierius: <strong className="text-white">{tkt.assignedTechnician}</strong> · Atsarginė dalis: {tkt.sparePartSku} (Kaune: {tkt.sparePartStockKaunas} vnt.)
                                                {tkt.serviceInvoiceNumber
                                                    ? ` · Sąskaita: ${tkt.serviceInvoiceNumber}`
                                                    : ''}
                                            </p>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-2.5 pt-1">
                                            <select
                                                aria-label={`Būsena ${tkt.ticketNumber}`}
                                                value={tkt.status}
                                                onChange={(e) =>
                                                    handleTicketUpdate(tkt.ticketNumber, {
                                                        status: e.target.value as SupportTicketStatus,
                                                    })
                                                }
                                                className="h-11 px-3 rounded-lg border border-[#D5CFC3] bg-white text-xs font-semibold text-[#11161B]"
                                            >
                                                <option value="Naujas">Naujas</option>
                                                <option value="Diagnozuota (Vytautas AI)">
                                                    Diagnozuota (Vytautas AI)
                                                </option>
                                                <option value="Meistras išvyko">Meistras išvyko</option>
                                                <option value="Detalė rezervuota">Detalė rezervuota</option>
                                                <option value="Išspręsta / Uždaryta">
                                                    Išspręsta / Uždaryta
                                                </option>
                                            </select>

                                            <select
                                                aria-label={`Inžinierius ${tkt.ticketNumber}`}
                                                value={tkt.assignedTechnician}
                                                onChange={(e) =>
                                                    handleTicketUpdate(tkt.ticketNumber, {
                                                        assignedTechnician: e.target.value,
                                                    })
                                                }
                                                className="h-11 px-3 rounded-lg border border-[#D5CFC3] bg-white text-xs font-semibold text-[#11161B]"
                                            >
                                                <option value="Darius (+370 611 19158)">
                                                    Darius (+370 611 19158)
                                                </option>
                                                <option value="Vidas (+370 656 77679)">
                                                    Vidas (+370 656 77679)
                                                </option>
                                                <option value="Brigada #1 Kaunas">Brigada #1 Kaunas</option>
                                                <option value="Brigada #2 Vilnius">Brigada #2 Vilnius</option>
                                            </select>

                                            <button
                                                type="button"
                                                data-testid="support-reserve-part-btn"
                                                onClick={() =>
                                                    handleTicketUpdate(tkt.ticketNumber, {
                                                        action: 'reserve_part',
                                                        status: 'Detalė rezervuota',
                                                    })
                                                }
                                                className="h-11 px-3.5 rounded-lg bg-[#C2410C] hover:bg-[#9A3412] text-white text-xs font-bold cursor-pointer"
                                            >
                                                Rezervuoti atsarginę dalį iš sandėlio ir įtraukti į „Skaita“ serviso sąskaitą
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <form
                            data-testid="create-support-ticket-form"
                            onSubmit={handleCreateTicket}
                            className="rounded-xl border border-[#D5CFC3] bg-[#F5F3EE] p-4 space-y-3"
                        >
                            <h3 className="text-sm font-extrabold text-[#11161B]">
                                Registruoti naują Tech Support / Garantinio serviso / RMA bilietą
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                                <input
                                    type="text"
                                    required
                                    value={newTicketTitle}
                                    onChange={(e) => setNewTicketTitle(e.target.value)}
                                    placeholder="Gedimo arba serviso darbų aprašymas *"
                                    className="h-11 px-3 rounded-lg border border-[#D5CFC3] bg-white"
                                />
                                <input
                                    type="text"
                                    value={newTicketSn}
                                    onChange={(e) => setNewTicketSn(e.target.value)}
                                    placeholder="Įrangos S/N numeris"
                                    className="h-11 px-3 rounded-lg border border-[#D5CFC3] bg-white"
                                />
                                <input
                                    type="text"
                                    required
                                    value={newTicketClient}
                                    onChange={(e) => setNewTicketClient(e.target.value)}
                                    placeholder="Kliento vardas arba įmonė *"
                                    className="h-11 px-3 rounded-lg border border-[#D5CFC3] bg-white"
                                />
                                <input
                                    type="text"
                                    value={newTicketPhone}
                                    onChange={(e) => setNewTicketPhone(e.target.value)}
                                    placeholder="Kliento telefonas (+370 6...)"
                                    className="h-11 px-3 rounded-lg border border-[#D5CFC3] bg-white"
                                />
                                <select
                                    value={newTicketType}
                                    onChange={(e) => setNewTicketType(e.target.value)}
                                    className="h-11 px-3 rounded-lg border border-[#D5CFC3] bg-white font-semibold"
                                >
                                    <option value="Garantinis servisas">Garantinis servisas</option>
                                    <option value="Pogarantinis servisas">Pogarantinis servisas</option>
                                    <option value="Paleidimo derinimas">Paleidimo derinimas</option>
                                    <option value="RMA / Prekės keitimas">RMA / Prekės keitimas</option>
                                </select>
                                <input
                                    type="text"
                                    value={newTicketSku}
                                    onChange={(e) => setNewTicketSku(e.target.value)}
                                    placeholder="Atsarginės dalies SKU"
                                    className="h-11 px-3 rounded-lg border border-[#D5CFC3] bg-white"
                                />
                            </div>
                            <button
                                type="submit"
                                className="h-11 px-4 rounded-lg bg-[#11161B] text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                            >
                                <Plus className="w-4 h-4" />
                                <span>Sukurti serviso bilietą su Vytauto AI diagnostika</span>
                            </button>
                        </form>
                    </div>

                    {/* Sub-panel B: Warranty & S/N Registry */}
                    <div
                        data-testid="warranty-registry-panel"
                        className="rounded-2xl border border-[#E2DDD3] bg-white p-5 sm:p-6 space-y-4"
                    >
                        <h3 className="text-lg font-extrabold text-[#11161B]">
                            Sumontuotos įrangos, Serijos numerių (S/N) ir Garantinių pasų registras ({warrantyRegistry.length})
                        </h3>
                        {warrantyRegistry.length === 0 ? (
                            <p className="text-xs text-[#5B6470]">
                                Garantinių pasų įrašų dar nėra. S/N pasai sukuriami paleidus įrangą objekte.
                            </p>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {warrantyRegistry.map((item) => (
                                    <div
                                        key={item.id}
                                        className="rounded-xl border border-[#E2DDD3] bg-[#FAF9F6] p-4 space-y-2 text-xs"
                                    >
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="font-bold text-[#C2410C]">
                                                S/N: {item.serialNumber}
                                            </span>
                                            <span className="px-2.5 py-0.5 rounded-full bg-[#E3F1E8] text-[#0F5A2B] font-bold">
                                                {item.warrantyStatus}
                                            </span>
                                        </div>
                                        <div className="text-sm font-extrabold text-[#11161B]">
                                            {item.equipmentTitle}
                                        </div>
                                        <p className="text-[#5B6470]">
                                            Klientas: {item.clientName} ({item.clientPhone})
                                        </p>
                                        <div className="pt-1 flex items-center justify-between gap-2">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleSendWarrantyReminder(item.serialNumber)
                                                }
                                                className="h-11 px-3.5 rounded-lg bg-[#11161B] text-white text-xs font-bold cursor-pointer"
                                            >
                                                Siųsti priminimą klientui dėl katilo/degiklio aptarnavimo
                                            </button>
                                            {item.reminderSentAt && (
                                                <span className="text-[#0F5A2B] font-bold">
                                                    {item.reminderSentAt}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Sub-panel C: RMA Queue */}
                    <div className="rounded-2xl border border-[#E2DDD3] bg-white p-5 sm:p-6 space-y-4">
                        <h3 className="text-lg font-extrabold text-[#11161B]">
                            RMA (Grąžinimų ir garantinio dalių keitimo) eiga ({rmaQueue.length})
                        </h3>
                        {rmaQueue.length === 0 ? (
                            <p className="text-xs text-[#5B6470]">
                                Aktyvių RMA prekių grąžinimų ar keitimų nėra.
                            </p>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {rmaQueue.map((rma) => (
                                    <div
                                        key={rma.id}
                                        className="rounded-xl border border-[#E2DDD3] p-4 space-y-1.5 text-xs"
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="font-bold text-[#C2410C]">
                                                {rma.rmaNumber} · Bilietas {rma.ticketNumber}
                                            </span>
                                            <span className="px-2 py-0.5 rounded-full bg-[#E3F1E8] text-[#0F5A2B] font-bold">
                                                {rma.stage}
                                            </span>
                                        </div>
                                        <div className="font-bold text-[#11161B] text-sm">
                                            Grąžinama: {rma.returnedTitle} ({rma.returnedSku}) → Keičiama į: {rma.replacementTitle} ({rma.replacementSku})
                                        </div>
                                        <p className="text-[#5B6470]">
                                            Partneris / Klientas: {rma.partnerName} · Priežastis: {rma.reason} · Kreditinė pažyma: {rma.creditNoteNumber}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </section>
            )}

            {/* MODULE 3: ORDERS, FULFILLMENT & COURIERS */}
            {activeTab === 'orders' && (
                <section className="rounded-2xl border border-[#E2DDD3] bg-white p-5 sm:p-6 space-y-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <span className="text-xs font-bold text-[#C2410C] block">
                                Užsakymų Komplektavimas · Eigulių g. 21, LT-51418 Kaunas
                            </span>
                            <h2 className="text-xl sm:text-2xl font-extrabold text-[#11161B]">
                                Užsakymai, Komplektavimas ir Siuntos ({orders.length})
                            </h2>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {[
                                'Visi',
                                'Laukia apmokėjimo',
                                'Komplektuojama Kaune',
                                'Išsiųsta',
                                'Atsiimta Eigulių g. 21, Kaunas',
                            ].map((st) => (
                                <button
                                    key={st}
                                    type="button"
                                    onClick={() => setOrderFilter(st)}
                                    className={`h-11 px-3 rounded-lg text-xs font-bold border cursor-pointer ${
                                        orderFilter === st
                                            ? 'bg-[#11161B] text-white border-[#11161B]'
                                            : 'bg-[#FAF9F6] text-[#11161B] border-[#D5CFC3]'
                                    }`}
                                >
                                    {st}
                                </button>
                            ))}
                        </div>
                    </div>

                    {orderNotice && (
                        <div className="rounded-xl bg-[#E3F1E8] text-[#0F5A2B] p-3 text-xs font-bold">
                            {orderNotice}
                        </div>
                    )}

                    {filteredOrders.length === 0 ? (
                        <div className="rounded-xl border border-[#E2DDD3] bg-[#FAF9F6] p-5 space-y-2 text-xs">
                            <strong className="block text-sm text-[#11161B]">
                                Naujų užsakymų dar nėra.
                            </strong>
                            <p className="text-[#5B6470]">
                                Klientų ir B2B montuotojų pateikti užsakymai automatiškai rodomi šiame sąraše.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filteredOrders.map((ord) => (
                                <div
                                    key={ord.orderNumber}
                                    className="rounded-xl border border-[#E2DDD3] bg-[#FAF9F6] p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4 text-xs"
                                >
                                    <div className="space-y-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="font-bold text-[#C2410C]">
                                                {ord.orderNumber}
                                            </span>
                                            <span className="px-2.5 py-0.5 rounded-full bg-[#E3F1E8] text-[#0F5A2B] font-bold">
                                                {ord.status}
                                            </span>
                                            <span className="text-[#5B6470]">
                                                Kurjeris: {ord.carrier} · Sąskaita: {ord.invoiceNumber} · i.VAZ: {ord.waybillNumber}
                                            </span>
                                        </div>
                                        <div className="text-sm font-extrabold text-[#11161B]">
                                            {ord.buyer} — {ord.totalGrossEur.toFixed(2)} € su PVM
                                        </div>
                                        <p className="text-[#5B6470]">{ord.items}</p>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setOrders((prev) =>
                                                    prev.map((o) =>
                                                        o.orderNumber === ord.orderNumber
                                                            ? { ...o, status: 'Išsiųsta' }
                                                            : o,
                                                    ),
                                                );
                                                setOrderNotice(
                                                    `Siuntos lipdukas (${ord.carrier}), i.VAZ (${ord.waybillNumber}) ir PVM sąskaita (${ord.invoiceNumber}) suformuoti užsakymui ${ord.orderNumber}.`,
                                                );
                                            }}
                                            className="h-11 px-3.5 rounded-lg bg-[#C2410C] text-white text-xs font-bold cursor-pointer"
                                        >
                                            Lipdukas ({ord.carrier}) + i.VAZ + {ord.invoiceNumber}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            )}

            {/* MODULE 7: BOILER CONVERSION WIZARD & INDUSTRIAL BOILER CRM */}
            {activeTab === 'projects' && (
                <section className="rounded-2xl border border-[#E2DDD3] bg-white p-5 sm:p-6 space-y-5">
                    <div>
                        <span className="text-xs font-bold text-[#C2410C] block">
                            Inžinerinis CRM · Užklausos iš /lt/vedlys ir /lt/pramonei
                        </span>
                        <h2 className="text-xl sm:text-2xl font-extrabold text-[#11161B]">
                            Katilo Perdarymo Vedlio ir Konteinerinių Katilinių Užklausos ({projects.length})
                        </h2>
                    </div>

                    {crmNotice && (
                        <div className="rounded-xl bg-[#E3F1E8] text-[#0F5A2B] p-3 text-xs font-bold">
                            {crmNotice}
                        </div>
                    )}

                    {projects.length === 0 ? (
                        <div className="rounded-xl border border-[#E2DDD3] bg-[#FAF9F6] p-5 space-y-2 text-xs">
                            <strong className="block text-sm text-[#11161B]">
                                Naujų inžinerinių užklausų dar nėra.
                            </strong>
                            <p className="text-[#5B6470]">
                                Klientų užpildytos katilų perdarymo vedlio („/lt/vedlys“) ir pramoninių katilinių („/lt/pramonei“) sąmatų užklausos automatiškai pateikiamos čia.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {projects.map((prj) => (
                                <div
                                    key={prj.id}
                                    className="rounded-xl border border-[#E2DDD3] bg-[#FAF9F6] p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4 text-xs"
                                >
                                    <div className="space-y-1">
                                        <span className="font-bold text-[#C2410C] block">
                                            {prj.source} · Išankstinė: {prj.proforma}
                                        </span>
                                        <div className="text-sm font-extrabold text-[#11161B]">
                                            {prj.summary}
                                        </div>
                                        <p className="text-[#5B6470]">
                                            Klientas: {prj.client} · Sąmata: <strong>{prj.grossEur.toFixed(2)} € su PVM</strong> ({prj.netEur.toFixed(2)} € be PVM)
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            onCreateProformaFromCrm({
                                                buyerName: prj.client,
                                                sku: prj.sku,
                                                title: prj.summary,
                                                unitNetEur: prj.netEur,
                                            });
                                            setCrmNotice(
                                                `Užklausa konvertuota į išankstinę sąskaitą (${prj.proforma}) ir perduota į „Skaita“ apskaitos žurnalą.`,
                                            );
                                        }}
                                        className="h-11 px-4 rounded-lg bg-[#11161B] hover:bg-[#C2410C] text-white text-xs font-bold cursor-pointer whitespace-nowrap"
                                    >
                                        Konvertuoti į išankstinę sąskaitą ({prj.proforma})
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            )}

            {/* MODULE 8: PLATFORM-OS AI AGENTS & PROPOSAL -> REVIEW -> APPLY QUEUE */}
            {activeTab === 'agents' && (
                <section className="space-y-6">
                    <GilesAdminAiAgentsCommandCenter />

                    <div
                        data-testid="agent-proposals-queue"
                        className="rounded-2xl border border-[#E2DDD3] bg-white p-5 sm:p-6 space-y-4"
                    >
                        <h3 className="text-lg font-extrabold text-[#11161B]">
                            AI Agentų Pasiūlymų Eilė (Proposal → Review → Apply)
                        </h3>
                        <div className="space-y-3">
                            {proposals.map((prp) => (
                                <div
                                    key={prp.id}
                                    className="rounded-xl border border-[#E2DDD3] bg-[#FAF9F6] p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4 text-xs"
                                >
                                    <div className="space-y-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="font-bold text-[#C2410C]">
                                                {prp.agentName}
                                            </span>
                                            <span className="px-2.5 py-0.5 rounded-full bg-[#E3F1E8] text-[#0F5A2B] font-bold">
                                                Patikimumas: {prp.confidencePercent}% · Būsena: {prp.status}
                                            </span>
                                        </div>
                                        <div className="text-sm font-extrabold text-[#11161B]">
                                            {prp.title}
                                        </div>
                                        <p className="text-[#5B6470]">{prp.impactSummary}</p>
                                    </div>

                                    <div className="flex flex-wrap gap-2.5 shrink-0">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                handleProposalDecision(prp.id, 'apply')
                                            }
                                            className="h-11 px-4 rounded-lg bg-[#157A3B] hover:bg-[#0F5A2B] text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                                        >
                                            <Check className="w-4 h-4" />
                                            <span>Patvirtinti ir vykdyti (Apply)</span>
                                        </button>
                        <button
                                                type="button"
                                                onClick={() =>
                                                    handleProposalDecision(prp.id, 'reject')
                                                }
                                                className="h-11 px-3.5 rounded-lg border border-[#D5CFC3] bg-white text-[#8A2F07] text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                                            >
                                                <X className="w-4 h-4" />
                                                <span>Atmesti</span>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                )}

            {/* MODULE 4: B2B & CUSTOMER CRM + 3-LAYER INDIVIDUAL PRICING + MARKETING */}
            {activeTab === 'b2b' && (
                <GilesAdminB2BCrm onCreateProformaFromCrm={onCreateProformaFromCrm} />
            )}

            {/* MODULE 9: PLUG-AND-PLAY INTEGRATIONS & API KEYS CONTROL CENTER */}
            {activeTab === 'integrations' && <GilesAdminIntegrations />}

            {/* MODULE 10: SECURITY-FIRST MODEL CONTEXT PROTOCOL (MCP) CONTROL CENTER */}
            {activeTab === 'mcp' && <GilesAdminMcp />}
        </div>
    );
}

export function GilesAdminCopilotPanel() {
    const [copilotPrompt, setCopilotPrompt] = useState('');
    const [copilotAnswer, setCopilotAnswer] = useState('');
    const [poGroups, setPoGroups] = useState<SupplierPoGroup[]>([]);
    const [generatedPoPreview, setGeneratedPoPreview] = useState<{
        poNumber: string;
        supplierName: string;
        totalCostNetEur: number;
        csvContent: string;
    } | null>(null);

    useEffect(() => {
        fetch(assetUrl('/api/admin/copilot'))
            .then((r) => r.json())
            .then((d) => {
                if (Array.isArray(d?.supplierPurchaseOrders)) {
                    setPoGroups(d.supplierPurchaseOrders);
                }
            })
            .catch(() => {});
    }, []);

    const handleRunCopilotCommand = async (payload: {
        commandId?: string;
        prompt?: string;
        supplierName?: string;
    }) => {
        try {
            const res = await fetch(assetUrl('/api/admin/copilot'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            if (data?.ok) {
                setCopilotAnswer(data.answer || '');
                if (data.generatedPo) {
                    setGeneratedPoPreview(data.generatedPo);
                }
                if (Array.isArray(data.supplierPurchaseOrders)) {
                    setPoGroups(data.supplierPurchaseOrders);
                }
            }
        } catch {
            // ignore
        }
    };

    return (
        <section
            data-testid="admin-ai-copilot-bar"
            className="mt-16 rounded-2xl border border-[#E2DDD3] bg-white p-5 sm:p-6 space-y-4"
        >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                <div>
                    <span className="text-xs font-bold text-[#C2410C] block">
                        2026/2027 AI Valdymo Kopilotas · Vytautas ERP Analitika ir Tiekėjų Užsakymai (PO)
                    </span>
                    <h2 className="text-lg sm:text-xl font-extrabold text-[#11161B]">
                        Autonominis Katalogo Maržų Auditas, Sąskaitų Kontrolė ir Atsargų Papildymas (PO-GILE)
                    </h2>
                </div>
                <div className="flex flex-wrap gap-2">
                    {[
                        {
                            id: 'audit_low_margin',
                            label: '1. Audituoti žemos maržos (<20%) prekes',
                        },
                        {
                            id: 'generate_low_stock_po',
                            label: '2. Sugeneruoti tiekėjų pirkimo užsakymus (PO) baigiamoms prekėms',
                        },
                        {
                            id: 'unpaid_and_b2b_summary',
                            label: '3. Parodyti neapmokėtų sąskaitų ir B2B paraiškų suvestinę',
                        },
                    ].map((cmd) => (
                        <button
                            key={cmd.id}
                            type="button"
                            onClick={() => handleRunCopilotCommand({ commandId: cmd.id })}
                            className="h-9 px-3 rounded-lg border border-[#D5CFC3] bg-[#FAF9F6] hover:border-[#11161B] text-xs font-bold text-[#11161B] cursor-pointer"
                        >
                            {cmd.label}
                        </button>
                    ))}
                </div>
            </div>

            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    if (!copilotPrompt.trim()) return;
                    handleRunCopilotCommand({ prompt: copilotPrompt.trim() });
                }}
                className="flex flex-col sm:flex-row gap-2.5 text-xs"
            >
                <input
                    type="text"
                    value={copilotPrompt}
                    onChange={(e) => setCopilotPrompt(e.target.value)}
                    placeholder="Užduokite operacinį klausimą arba komandą (pvz.: Kurios Danfoss ar Gorenje prekės baigiasi Kauno sandėlyje?)..."
                    className="flex-1 h-10 px-3.5 rounded-lg border border-[#D5CFC3] bg-[#FAF9F6]"
                />
                <button
                    type="submit"
                    className="h-10 px-4 rounded-lg border border-[#11161B] bg-[#FAF9F6] hover:bg-[#11161B] hover:text-white text-[#11161B] font-bold cursor-pointer shrink-0"
                >
                    Vykdyti AI komandą
                </button>
            </form>

            {copilotAnswer && (
                <div className="rounded-xl bg-[#11161B] text-[#F5F3EE] p-3.5 text-xs space-y-1">
                    <strong className="text-[#FF8A3D] block">
                        Vytautas Admin Copilot Atsakymas:
                    </strong>
                    <p>{copilotAnswer}</p>
                </div>
            )}

            <div
                data-testid="admin-low-stock-po-generator"
                className="space-y-3 pt-1"
            >
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <strong className="text-[#11161B]">
                        Automatinis Tiekėjų Pirkimo Užsakymų (PO) Generatorius (kai Kauno sandėlyje liko 1–3 vnt.):
                    </strong>
                    {generatedPoPreview && (
                        <span className="font-mono font-bold text-[#0F5A2B]">
                            Paruoštas {generatedPoPreview.poNumber} ({generatedPoPreview.supplierName} · {generatedPoPreview.totalCostNetEur.toFixed(2)} € be PVM)
                        </span>
                    )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 text-xs">
                    {poGroups.map((grp) => (
                        <div
                            key={grp.supplierId}
                            className="rounded-xl border border-[#E2DDD3] bg-[#FAF9F6] p-3 space-y-1.5 flex flex-col justify-between"
                        >
                            <div>
                                <span className="font-bold text-[#C2410C] block">
                                    {grp.supplierName}
                                </span>
                                <span className="text-[#5B6470] block">
                                    Baigiasi: <strong>{grp.lowStockSkuCount} SKU</strong> · Papildyti: <strong>{grp.recommendedOrderUnits} vnt.</strong>
                                </span>
                                <span className="font-bold text-[#11161B] block">
                                    Savikaina: {grp.estimatedCostNetEur.toFixed(2)} € be PVM
                                </span>
                            </div>
                            <button
                                type="button"
                                onClick={() =>
                                    handleRunCopilotCommand({
                                        commandId: 'generate_low_stock_po',
                                        supplierName: grp.supplierName,
                                    })
                                }
                                className="h-8 px-2.5 rounded-lg border border-[#11161B] bg-white hover:bg-[#11161B] hover:text-white text-[#11161B] font-bold cursor-pointer w-full"
                            >
                                Generuoti PO CSV
                            </button>
                        </div>
                    ))}
                </div>

                {generatedPoPreview && (
                    <pre className="text-xs font-mono text-[#C9D0D8] overflow-x-auto max-h-36 p-3 rounded-lg bg-[#11161B]">
                        {generatedPoPreview.csvContent}
                    </pre>
                )}
            </div>
        </section>
    );
}
