'use client';

import { useEffect, useState } from 'react';
import {
    Check,
    X,
    FileSpreadsheet,
    FileCode2,
    Printer,
    Upload,
    Plus,
    ShieldCheck,
    Database,
} from 'lucide-react';
import { assetUrl } from '../../../lib/api';
import {
    GILES_COMPANY_IDENTITY,
    GILES_PATENTED_LOGO_PATH,
    GILES_SUPPLIER_PRICELISTS,
} from '../../../lib/giles-masterpiece-data';
import type { B2BPartnerAccount, B2BDiscountTierLabel } from '../../../lib/b2b-accounts';
import type { SkaitaInvoiceRecord, SkaitaStockImportSummary } from '../../../lib/skaita-accounting';
import {
    GilesAdminOsModules,
    GilesAdminCopilotPanel,
    type GilesAdminTabId,
} from '../../../components/giles-admin-os';
import { GilesAdminProductCrud } from '../../../components/giles-admin-product-crud';
import { GilesAdminInvoiceBuilder } from '../../../components/giles-admin-invoice-builder';
import { GilesAdminSuppliersManager } from '../../../components/giles-admin-suppliers-and-agents';
import { GilesAdminAuthBar } from '../../../components/giles-admin-auth-bar';
import { AdminCommandPalette } from '../../../components/admin-command-palette';
import { AdminCsvImportWizard } from '../../../components/admin-csv-import-wizard';

const ADMIN_HEADER_THUMBS = [
    { src: '/images/brands/giles-inzinerija.svg', label: 'Gilės B2B patvirtinimai' },
    { src: '/images/products/giles-studio-01-mpb-nani-35-50.webp', label: 'Skaita PVM sąskaitos' },
    { src: '/images/brands/danfoss.svg', label: 'Danfoss kainynas' },
    { src: '/images/brands/herz.svg', label: 'HERZ Baltija kainynas' },
    { src: '/images/brands/haier.svg', label: 'Haier ŠVOK kainynas' },
    { src: '/images/brands/gorenje.svg', label: 'Gorenje / TIKI likučiai' },
];

// W123-A1: single tab registry shared by the nav grid and the command palette.
const ADMIN_TAB_DEFS = [
    { id: 'overview', testId: 'admin-tab-overview', label: '1. Suvestinė' },
    { id: 'support', testId: 'admin-tab-support', label: '2. Servisas (S/N)' },
    { id: 'orders', testId: 'admin-tab-orders', label: '3. Užsakymai' },
    { id: 'b2b', testId: 'admin-tab-b2b', label: '4. B2B' },
    { id: 'skaita', testId: 'admin-tab-skaita', label: '5. „Skaita“ ERP' },
    { id: 'catalog', testId: 'admin-tab-catalog', label: '6. Kainynai (5)' },
    { id: 'projects', testId: 'admin-tab-projects', label: '7. Vedlio CRM' },
    { id: 'agents', testId: 'admin-tab-agents', label: '8. AI Agentai' },
    { id: 'integrations', testId: 'admin-tab-integrations', label: '9. Integracijos (14)' },
    { id: 'mcp', testId: 'admin-tab-mcp', label: '10. MCP (Claude)' },
] as const;

export default function GilesAdminAndSkaitaErpPage() {
    const [activeTab, setActiveTab] = useState<GilesAdminTabId>('b2b');
    const [isAdminLocked, setIsAdminLocked] = useState<boolean>(false);
    const [accounts, setAccounts] = useState<B2BPartnerAccount[]>([]);
    const [tierSelections, setTierSelections] = useState<Record<string, B2BDiscountTierLabel>>({});
    const [invoices, setInvoices] = useState<SkaitaInvoiceRecord[]>([]);
    const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>('');
    const [exportPreviewTitle, setExportPreviewTitle] = useState<string>('');
    const [exportPreviewContent, setExportPreviewContent] = useState<string>('');
    const [stockImportResult, setStockImportResult] = useState<SkaitaStockImportSummary | null>(
        null,
    );

    // Quick New Invoice Form
    const [newBuyerName, setNewBuyerName] = useState('');
    const [newBuyerCode, setNewBuyerCode] = useState('');
    const [newBuyerVat, setNewBuyerVat] = useState('');
    const [newSku, setNewSku] = useState('MPB-NANI-35');
    const [newTitle, setNewTitle] = useState(
        'Granulių degiklio komplektas Megatherm MPB NANI 35 (8–35 kW)',
    );
    const [newQty, setNewQty] = useState(1);
    const [newUnitNet, setNewUnitNet] = useState(1942.15);

    useEffect(() => {
        fetch(assetUrl('/api/b2b/accounts'))
            .then((r) => r.json())
            .then((d) => {
                if (Array.isArray(d?.accounts)) {
                    setAccounts(d.accounts);
                }
            })
            .catch(() => {});

        fetch(assetUrl('/api/accounting/skaita'))
            .then((r) => r.json())
            .then((d) => {
                if (Array.isArray(d?.invoices)) {
                    setInvoices(d.invoices);
                    if (d.invoices[0]?.id) {
                        setSelectedInvoiceId(d.invoices[0].id);
                    }
                }
            })
            .catch(() => {});
    }, []);

    const selectedInvoice =
        invoices.find((i) => i.id === selectedInvoiceId) || invoices[0] || null;

    const handleApproveOrReject = async (
        accountId: string,
        action: 'approve' | 'reject',
    ) => {
        const tier =
            tierSelections[accountId] ||
            'Pro montuotojas Danfoss -48% / HERZ -50% / Haier -40%';

        try {
            const res = await fetch(assetUrl('/api/b2b/accounts'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    accountId,
                    action,
                    discountTier: tier,
                }),
            });
            const data = await res.json();
            if (Array.isArray(data?.accounts)) {
                setAccounts(data.accounts);
                return;
            }
        } catch {
            // fallback local update
        }

        setAccounts((prev) =>
            prev.map((a) =>
                a.id !== accountId
                    ? a
                    : {
                          ...a,
                          status: action === 'approve' ? 'APPROVED' : 'REJECTED',
                          discountTier: tier,
                          defaultDiscountPercent: tier.includes('-52%')
                              ? 52
                              : tier.includes('-48%')
                                ? 45
                                : 35,
                          approvedAt:
                              action === 'approve' ? new Date().toISOString() : null,
                          approvedBy: 'Darius Šauklys (Admin)',
                      },
            ),
        );
    };

    const handleCreateAutonomousInvoice = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newBuyerName.trim() || !newBuyerCode.trim()) return;
        try {
            const res = await fetch(assetUrl('/api/accounting/skaita'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    docType: 'PVM_SASKAITA_FAKTURA',
                    buyerName: newBuyerName.trim(),
                    buyerCompanyCode: newBuyerCode.trim(),
                    buyerVatCode: newBuyerVat.trim() || 'LT100000000000',
                    buyerAddress: 'Eigulių g. 21, LT-51418 Kaunas',
                    lines: [
                        {
                            sku: newSku,
                            ean: '4770001000351',
                            title: newTitle,
                            unit: 'vnt.',
                            qty: newQty,
                            unitNetEur: newUnitNet,
                        },
                    ],
                }),
            });
            const data = await res.json();
            if (data?.invoice && Array.isArray(data?.invoices)) {
                setInvoices(data.invoices);
                setSelectedInvoiceId(data.invoice.id);
                setNewBuyerName('');
                setNewBuyerCode('');
                setNewBuyerVat('');
            }
        } catch {
            // ignore
        }
    };

    const handleExportSkaitaCsv = async () => {
        try {
            const res = await fetch(assetUrl('/api/accounting/skaita'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'export_skaita_csv' }),
            });
            const data = await res.json();
            if (data?.content) {
                setExportPreviewTitle(`Skaita Excel/CSV eksportas (${data.filename})`);
                setExportPreviewContent(data.content);
            }
        } catch {
            // ignore
        }
    };

    const handleExportIsafXml = async () => {
        try {
            const res = await fetch(assetUrl('/api/accounting/skaita'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'export_isaf_xml' }),
            });
            const data = await res.json();
            if (data?.content) {
                setExportPreviewTitle(`VMI i.SAF 1.2 XML eksportas (${data.filename})`);
                setExportPreviewContent(data.content);
            }
        } catch {
            // ignore
        }
    };

    const handleExportWriteoffAct = async () => {
        try {
            const res = await fetch(assetUrl('/api/accounting/skaita'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'export_writeoff_act' }),
            });
            const data = await res.json();
            if (data?.content) {
                setExportPreviewTitle(`Skaita likučių nurašymo aktas (${data.filename})`);
                setExportPreviewContent(data.content);
            }
        } catch {
            // ignore
        }
    };

    const handleImportSkaitaStock = async () => {
        try {
            const res = await fetch(assetUrl('/api/accounting/skaita'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'import_skaita_stock' }),
            });
            const data = await res.json();
            if (data?.summary) {
                setStockImportResult(data.summary);
            }
        } catch {
            // ignore
        }
    };

    return (
        <main
            data-testid="giles-admin-panel"
            className="min-h-screen w-full max-w-full overflow-x-clip bg-[#F5F3EE] text-[#11161B]"
        >
            <style>{`#cookie-consent-banner { display: none !important; }`}</style>
            {/* Dark Header Banner + 6 Studio/Brand Visuals Above the Fold */}
            <section className="bg-[#11161B] text-[#F5F3EE] border-b border-[#2C3742] py-3 sm:py-5">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 space-y-2.5">
                    <GilesAdminAuthBar
                        isLocked={isAdminLocked}
                        onLockChange={setIsAdminLocked}
                    />

                    <div className="space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <h1 className="text-xl sm:text-2xl font-extrabold text-white leading-tight">
                                Gilės Inžinerijos ir „Skaita“ ERP
                            </h1>
                            <AdminCommandPalette
                                tabs={ADMIN_TAB_DEFS.map((t) => ({ id: t.id, label: t.label }))}
                                onNavigateTab={(id) => setActiveTab(id as GilesAdminTabId)}
                            />
                        </div>

                        {/* 10-Module Admin OS Navigation */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-1.5">
                            {ADMIN_TAB_DEFS.map((tab) => (
                                <button
                                    key={tab.id}
                                    type="button"
                                    data-testid={tab.testId}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`h-9 sm:h-10 px-2 rounded-lg text-xs font-bold cursor-pointer border transition-colors bg-transparent whitespace-nowrap ${
                                        activeTab === tab.id
                                            ? 'border-[#FF8A3D] text-[#FF8A3D]'
                                            : 'border-[#2C3742] text-[#C9D0D8] hover:text-white'
                                    }`}
                                >
                                    {tab.id === 'b2b'
                                        ? `${tab.label} (${accounts.filter((a) => a.status === 'PENDING_APPROVAL').length})`
                                        : tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 6 Studio & Brand Visuals Above the Fold */}
                    <div className="grid grid-cols-3 lg:grid-cols-6 gap-1.5 pt-0.5">
                        {ADMIN_HEADER_THUMBS.map((item) => (
                            <div
                                key={item.label}
                                className="rounded-lg bg-[#1B232C] p-1.5 flex items-center gap-1.5 overflow-hidden"
                            >
                                <img
                                    src={assetUrl(item.src)}
                                    alt={item.label}
                                    className="h-7 w-9 rounded-sm bg-white object-contain p-0.5 shrink-0"
                                />
                                <span className="text-xs font-semibold text-white leading-snug truncate">
                                    {item.label}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {isAdminLocked ? (
                <div className="mx-auto max-w-3xl px-4 sm:px-6 py-10">
                    <div className="rounded-2xl border border-[#E2DDD3] bg-white p-6 space-y-2">
                        <h2 className="text-lg font-extrabold text-[#11161B]">
                            Gilės Admin OS valdymo pultas užrakintas
                        </h2>
                        <p className="text-xs sm:text-sm text-[#5B6470]">
                            Norėdami tęsti darbą su B2B paraiškomis, „Skaita“ PVM sąskaitomis ir tiekėjų kainynais, viršutiniame lange įveskite Dariaus administratoriaus prisijungimo duomenis (darius@gilesinzinerija.com).
                        </p>
                    </div>
                </div>
            ) : (
            <div className="mx-auto max-w-7xl px-4 sm:px-6 py-4 sm:py-6 space-y-6">
                <GilesAdminOsModules
                    activeTab={activeTab}
                    onSelectTab={setActiveTab}
                    pendingB2BCount={accounts.filter((a) => a.status === 'PENDING_APPROVAL').length}
                    approvedB2BCount={accounts.filter((a) => a.status === 'APPROVED').length}
                    invoicesCount={invoices.length}
                    onCreateProformaFromCrm={(payload) => {
                        setNewBuyerName(payload.buyerName);
                        setNewSku(payload.sku);
                        setNewTitle(payload.title);
                        setNewUnitNet(payload.unitNetEur);
                        setActiveTab('skaita');
                    }}
                />
                {/* TAB 1: B2B PARTNER APPROVALS */}
                {activeTab === 'b2b' && (
                    <section
                        data-testid="admin-b2b-approvals"
                        className="space-y-5 lg:min-h-[460px]"
                    >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <span className="text-xs font-bold text-[#C2410C] block">
                                    1 skyrius · Montuotojų registracijos
                                </span>
                                <h2 className="text-xl sm:text-2xl font-extrabold text-[#11161B]">
                                    B2B Partnerių Patvirtinimas ({accounts.length})
                                </h2>
                                <p className="text-xs sm:text-sm text-[#5B6470]">
                                    Didmeninių B2B paskyrų patvirtinimas.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setActiveTab('skaita')}
                                className="h-10 px-4 rounded-lg bg-transparent border border-[#C2410C] text-[#C2410C] hover:border-[#11161B] hover:text-[#11161B] text-xs font-semibold cursor-pointer whitespace-nowrap transition-colors"
                            >
                                Atidaryti „Skaita“ ERP
                            </button>
                        </div>

                        {accounts.length === 0 ? (
                            <div className="rounded-2xl border border-[#E2DDD3] bg-white p-6 lg:p-10 space-y-2 text-xs">
                                <strong className="block text-sm text-[#11161B]">
                                    B2B paraiškų dar nėra.
                                </strong>
                                <p className="text-[#5B6470]">
                                    Naujos „/lt/b2b“ paraiškos bus rodomos čia.
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-4">
                                {accounts.map((acc) => {
                                    const selectedTier =
                                        tierSelections[acc.id] || acc.discountTier;
                                    return (
                                        <div
                                            key={acc.id}
                                            data-testid={`b2b-account-card-${acc.id}`}
                                            className="rounded-2xl border border-[#E2DDD3] bg-white p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                                        >
                                            <div className="space-y-1.5">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span
                                                        className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                                            acc.status === 'APPROVED'
                                                                ? 'bg-[#E3F1E8] text-[#0F5A2B]'
                                                                : acc.status === 'PENDING_APPROVAL'
                                                                  ? 'bg-[#FFF1D6] text-[#7A4A00]'
                                                                  : 'bg-[#FBEADF] text-[#8A2F07]'
                                                        }`}
                                                    >
                                                        {acc.status === 'APPROVED'
                                                            ? 'PATVIRTINTA (APPROVED)'
                                                            : acc.status === 'PENDING_APPROVAL'
                                                              ? 'LAUKIA PATVIRTINIMO (PENDING_APPROVAL)'
                                                              : 'ATMESTA (REJECTED)'}
                                                    </span>
                                                    <span className="text-xs text-[#5B6470]">
                                                        Įm. k. {acc.companyCode} · PVM {acc.vatCode}
                                                    </span>
                                                    <span className="text-xs font-semibold text-[#C2410C]">
                                                        {acc.activityType} · {acc.city}
                                                    </span>
                                                </div>
                                                <h3 className="text-lg font-extrabold text-[#11161B]">
                                                    {acc.companyName}
                                                </h3>
                                                <p className="text-xs text-[#5B6470]">
                                                    Kontaktinis asmuo: <strong className="text-[#11161B]">{acc.contactPerson}</strong> · {acc.email} · {acc.phone}
                                                </p>
                                            </div>

                                            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                                                <label className="flex flex-col gap-1 text-xs font-semibold text-[#5B6470] w-full sm:w-auto">
                                                    Didmeninės nuolaidos lygis
                                                    <select
                                                        value={selectedTier}
                                                        onChange={(e) =>
                                                            setTierSelections((prev) => ({
                                                                ...prev,
                                                                [acc.id]: e.target
                                                                    .value as B2BDiscountTierLabel,
                                                            }))
                                                        }
                                                        className="h-10 w-full max-w-full px-3 rounded-lg border border-[#D5CFC3] bg-[#FAF9F6] text-xs font-semibold text-[#11161B]"
                                                    >
                                                        <option value="Standartinis montuotojas -35%">
                                                            Standartinis montuotojas -35%
                                                        </option>
                                                        <option value="Pro montuotojas Danfoss -48% / HERZ -50% / Haier -40%">
                                                            Pro montuotojas Danfoss -48% / HERZ -50% / Haier -40%
                                                        </option>
                                                        <option value="Regioninis dileris ir rangovas -52%">
                                                            Regioninis dileris ir rangovas -52%
                                                        </option>
                                                    </select>
                                                </label>

                                                <button
                                                    type="button"
                                                    data-testid={`approve-b2b-${acc.id}`}
                                                    onClick={() =>
                                                        handleApproveOrReject(acc.id, 'approve')
                                                    }
                                                    className="h-10 px-4 rounded-lg bg-[#157A3B] hover:bg-[#0F5A2B] text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                                                >
                                                    <Check className="w-4 h-4" />
                                                    <span>Patvirtinti B2B paskyrą</span>
                                                </button>

                                                <button
                                                    type="button"
                                                    data-testid={`reject-b2b-${acc.id}`}
                                                    onClick={() =>
                                                        handleApproveOrReject(acc.id, 'reject')
                                                    }
                                                    className="h-10 px-3.5 rounded-lg border border-[#D5CFC3] bg-white hover:border-[#8A2F07] text-[#8A2F07] text-xs font-bold inline-flex items-center gap-1 cursor-pointer whitespace-nowrap"
                                                >
                                                    <X className="w-4 h-4" />
                                                    <span>Atmesti</span>
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </section>
                )}

                {/* TAB 2: AUTONOMOUS E-SHOP ACCOUNTING & PROTOTECHNIKA SKAITA BRIDGE */}
                {activeTab === 'skaita' && (
                    <section className="space-y-8">
                        <div className="rounded-2xl bg-[#11161B] text-[#F5F3EE] p-6 space-y-4">
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                <div className="space-y-1">
                                    <span className="font-mono text-xs font-bold text-[#FF8A3D] block">
                                        UAB „PROTOTECHNIKA“ — „SKAITA“ INTEGRACIJOS VARIKLIS (BE SQL DB KEITIMO)
                                    </span>
                                    <h2 className="text-xl sm:text-2xl font-extrabold text-white">
                                        Autonominė el. parduotuvės buhalterija ir „Skaita“ dvikryptis tiltas
                                    </h2>
                                    <p className="text-xs sm:text-sm text-[#C9D0D8] max-w-3xl">
                                        El. parduotuvė pati išrašo išankstines sąskaitas (`PRO-XXXX`), PVM sąskaitas faktūras (`GILE-XXXX`) bei važtaraščius (`IVAZ-XXXX`) ir vienu paspaudimu paruošia „Skaita“ Excel/CSV bei VMI `i.SAF 1.2` XML failus.
                                    </p>
                                </div>

                                <div className="flex flex-wrap gap-2.5 shrink-0">
                                    <button
                                        type="button"
                                        data-testid="skaita-export-excel-btn"
                                        onClick={handleExportSkaitaCsv}
                                        className="h-11 px-4 rounded-lg bg-[#C2410C] hover:bg-[#9A3412] text-white text-xs font-bold inline-flex items-center gap-2 cursor-pointer whitespace-nowrap"
                                    >
                                        <FileSpreadsheet className="w-4 h-4" />
                                        <span>Eksportuoti į „Skaita“ Excel / CSV</span>
                                    </button>

                                    <button
                                        type="button"
                                        data-testid="skaita-export-isaf-btn"
                                        onClick={handleExportIsafXml}
                                        className="h-11 px-4 rounded-lg border border-[#3A4652] bg-[#1B232C] hover:border-[#FF8A3D] text-white text-xs font-bold inline-flex items-center gap-2 cursor-pointer whitespace-nowrap"
                                    >
                                        <FileCode2 className="w-4 h-4 text-[#FF8A3D]" />
                                        <span>Eksportuoti VMI i.SAF 1.2 XML</span>
                                    </button>

                                    <button
                                        type="button"
                                        data-testid="skaita-export-writeoff-btn"
                                        onClick={handleExportWriteoffAct}
                                        className="h-11 px-4 rounded-lg border border-[#3A4652] bg-[#1B232C] hover:border-[#FF8A3D] text-white text-xs font-bold inline-flex items-center gap-2 cursor-pointer whitespace-nowrap"
                                    >
                                        <Database className="w-4 h-4 text-[#FF8A3D]" />
                                        <span>Eksportuoti likučių nurašymo aktą</span>
                                    </button>

                                    <button
                                        type="button"
                                        data-testid="skaita-import-stock-btn"
                                        onClick={handleImportSkaitaStock}
                                        className="h-11 px-4 rounded-lg bg-[#157A3B] hover:bg-[#0F5A2B] text-white text-xs font-bold inline-flex items-center gap-2 cursor-pointer whitespace-nowrap"
                                    >
                                        <Upload className="w-4 h-4" />
                                        <span>Importuoti „Skaita“ likučius (Excel)</span>
                                    </button>
                                </div>
                            </div>

                            {exportPreviewContent && (
                                <div className="rounded-xl bg-[#1B232C] p-4 space-y-2">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="font-mono font-bold text-[#FF8A3D]">
                                            {exportPreviewTitle}
                                        </span>
                                        <div className="flex items-center gap-3">
                                            <a
                                                href={assetUrl('/api/accounting/skaita?format=skaita_csv')}
                                                className="text-white underline font-semibold whitespace-nowrap"
                                            >
                                                Atsisiųsti .CSV
                                            </a>
                                            <a
                                                href={assetUrl('/api/accounting/skaita?format=isaf_xml')}
                                                className="text-white underline font-semibold whitespace-nowrap"
                                            >
                                                Atsisiųsti i.SAF .XML
                                            </a>
                                        </div>
                                    </div>
                                    <pre className="text-xs font-mono text-[#C9D0D8] overflow-x-auto max-h-48 p-3 rounded-lg bg-[#11161B]">
                                        {exportPreviewContent}
                                    </pre>
                                </div>
                            )}

                            {stockImportResult && (
                                <div
                                    data-testid="skaita-stock-import-summary"
                                    className="rounded-xl bg-[#1B232C] p-4 space-y-2 text-xs"
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="font-bold text-[#FF8A3D]">
                                            ✓ „Skaita“ ataskaitos „Faktiniai vertybių likučiai“ sinchronizacija atlikta ({stockImportResult.matchedCatalogSkus}/{stockImportResult.processedRows} SKU susieti su {stockImportResult.totalCatalogProducts} prekių katalogu)
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-2 pt-1">
                                        {stockImportResult.updatedItems.map((it) => (
                                            <div
                                                key={it.sku}
                                                className="rounded-lg bg-[#11161B] p-2.5 space-y-0.5"
                                            >
                                                <span className="font-mono font-bold text-white block">
                                                    {it.sku}
                                                </span>
                                                <span className="text-[#C9D0D8] block truncate">
                                                    Likutis: {it.previousStock} → <strong>{it.newStock} vnt.</strong>
                                                </span>
                                                <span className="text-[#FF8A3D] block">
                                                    Savikaina: {it.costNetEur.toFixed(2)} € · Mažmena: {it.retailGrossEur.toFixed(2)} €
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Split Grid: Left = Multi-Line Invoice Builder + Lifecycle + SEPA Reconciliation; Right = Printable Lithuanian VAT Invoice Preview */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                            <div className="lg:col-span-5 space-y-5">
                                <GilesAdminInvoiceBuilder
                                    invoices={invoices}
                                    selectedInvoiceId={selectedInvoice?.id || ''}
                                    onSelectInvoice={(id) => setSelectedInvoiceId(id)}
                                    onInvoicesUpdated={(nextInvoices, focusId) => {
                                        setInvoices(nextInvoices);
                                        if (focusId) {
                                            setSelectedInvoiceId(focusId);
                                        } else if (nextInvoices[0]?.id) {
                                            setSelectedInvoiceId(nextInvoices[0].id);
                                        }
                                    }}
                                />
                            </div>

                            {/* Right: Printable Official Lithuanian VAT Invoice Preview (data-testid="invoice-print-preview") */}
                            <div
                                data-testid="invoice-print-preview"
                                className="lg:col-span-7 rounded-2xl border border-[#E2DDD3] bg-white p-6 sm:p-8 space-y-6"
                            >
                                {!selectedInvoice ? (
                                    <div className="space-y-3 text-xs">
                                        <div className="flex items-center gap-3 border-b border-[#E2DDD3] pb-4">
                                            <img
                                                src={assetUrl(GILES_PATENTED_LOGO_PATH)}
                                                alt="UAB Gilės inžinerija patentuotas logotipas"
                                                className="h-12 w-auto object-contain rounded-sm border border-[#E2DDD3] bg-white p-1"
                                            />
                                            <div>
                                                <span className="font-mono text-xs font-bold text-[#C2410C] block">
                                                    PVM SĄSKAITOS FAKTŪROS PERŽIŪRA
                                                </span>
                                                <h3 className="text-lg font-extrabold text-[#11161B]">
                                                    UAB „Gilės inžinerija“ (302620907, LT100006119810)
                                                </h3>
                                            </div>
                                        </div>
                                        <p className="text-[#5B6470]">
                                            Pasirinkite sąskaitą iš žurnalo arba sugeneruokite naują PVM sąskaitą faktūrą kairėje esančioje formoje.
                                        </p>
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#E2DDD3] pb-5">
                                            <div className="flex items-center gap-3">
                                                <img
                                                    src={assetUrl(GILES_PATENTED_LOGO_PATH)}
                                                    alt="UAB Gilės inžinerija patentuotas logotipas"
                                                    className="h-12 w-auto object-contain rounded-sm border border-[#E2DDD3] bg-white p-1"
                                                />
                                                <div>
                                                    <span className="font-mono text-xs font-bold text-[#C2410C] block">
                                                        PVM SĄSKAITA FAKTŪRA
                                                    </span>
                                                    <h3 className="text-xl font-extrabold text-[#11161B]">
                                                        Serija ir Nr.: {selectedInvoice.invoiceNumber}
                                                    </h3>
                                                    <span className="text-xs text-[#5B6470]">
                                                        Išankstinė: {selectedInvoice.proformaNumber} · Važtaraštis: {selectedInvoice.waybillNumber}
                                                    </span>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    typeof window !== 'undefined' && window.print()
                                                }
                                                className="h-10 px-4 rounded-lg border border-[#D5CFC3] bg-[#FAF9F6] hover:border-[#11161B] text-xs font-bold text-[#11161B] inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                                            >
                                                <Printer className="w-4 h-4" />
                                                <span>Spausdinti / PDF</span>
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                                            <div className="rounded-xl bg-[#F5F3EE] p-4 space-y-1">
                                                <span className="font-mono font-bold text-[#5B6470] block">
                                                    PARDAVĖJAS
                                                </span>
                                                <strong className="text-sm text-[#11161B] block">
                                                    {selectedInvoice.sellerName}
                                                </strong>
                                                <p>Įmonės kodas: {selectedInvoice.sellerCompanyCode}</p>
                                                <p>PVM mokėtojo kodas: {selectedInvoice.sellerVatCode}</p>
                                                <p>Adresas: {selectedInvoice.sellerAddress}</p>
                                                <p>A. s.: {selectedInvoice.sellerBankAccount}</p>
                                                <p>Tel.: {GILES_COMPANY_IDENTITY.phoneDarius}</p>
                                            </div>

                                            <div className="rounded-xl bg-[#F5F3EE] p-4 space-y-1">
                                                <span className="font-mono font-bold text-[#5B6470] block">
                                                    PIRKĖJAS
                                                </span>
                                                <strong className="text-sm text-[#11161B] block">
                                                    {selectedInvoice.buyerName}
                                                </strong>
                                                <p>Įmonės kodas: {selectedInvoice.buyerCompanyCode}</p>
                                                <p>PVM mokėtojo kodas: {selectedInvoice.buyerVatCode}</p>
                                                <p>Adresas: {selectedInvoice.buyerAddress}</p>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            {selectedInvoice.lines.map((line, i) => (
                                                <div
                                                    key={`${line.sku}-${i}`}
                                                    className="rounded-xl border border-[#E2DDD3] p-3.5 flex flex-wrap items-center justify-between gap-2 text-xs"
                                                >
                                                    <div>
                                                        <span className="font-mono font-bold text-[#C2410C]">
                                                            {line.sku} (EAN: {line.ean})
                                                        </span>
                                                        <div className="font-bold text-[#11161B] text-sm">
                                                            {line.title}
                                                        </div>
                                                        <span className="text-[#5B6470]">
                                                            {line.qty} {line.unit} × {line.unitNetEur.toFixed(2)} € be PVM (PVM {line.vatRatePercent}%: {line.lineVatEur.toFixed(2)} €)
                                                        </span>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="text-base font-extrabold text-[#11161B] block">
                                                            {line.lineGrossEur.toFixed(2)} €
                                                        </span>
                                                        <span className="text-[#5B6470]">su PVM</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="rounded-xl bg-[#11161B] text-white p-4 space-y-2 text-xs">
                                            <div className="flex justify-between">
                                                <span className="text-[#C9D0D8]">Suma be PVM:</span>
                                                <span className="font-bold">
                                                    {selectedInvoice.totalNetEur.toFixed(2)} €
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-[#C9D0D8]">
                                                    PVM ({selectedInvoice.vatRatePercent}%):
                                                </span>
                                                <span className="font-bold">
                                                    {selectedInvoice.vatAmountEur.toFixed(2)} €
                                                </span>
                                            </div>
                                            <div className="flex justify-between text-base font-extrabold pt-2 border-t border-[#2C3742]">
                                                <span>Iš viso mokėti su PVM:</span>
                                                <span className="text-[#FF8A3D]">
                                                    {selectedInvoice.totalGrossEur.toFixed(2)} €
                                                </span>
                                            </div>
                                            <div className="pt-1 text-[#C9D0D8]">
                                                Suma žodžiais: <strong className="text-white">{selectedInvoice.amountInWordsLt}</strong>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap justify-between gap-4 pt-2 text-xs text-[#5B6470]">
                                            <span>
                                                Sąskaitą išrašė: UAB „Gilės inžinerija“ (Darius Šauklys, +370 611 19158)
                                            </span>
                                            <span>
                                                Paruošta importui į UAB „Prototechnika“ sistemą „Skaita“
                                            </span>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </section>
                )}

                {/* TAB 3: 5 SUPPLIER PRICELISTS & 6,337 CATALOG */}
                {activeTab === 'catalog' && (
                    <section className="space-y-5">
                        <GilesAdminSuppliersManager />
                        <AdminCsvImportWizard />
                        <GilesAdminProductCrud />
                    </section>
                )}

                <GilesAdminCopilotPanel />
            </div>
            )}
        </main>
    );
}
