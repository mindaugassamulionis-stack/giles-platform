'use client';

import { useState } from 'react';
import { Plus, Trash2, Search, CheckCircle2, ArrowRightLeft, ShieldCheck } from 'lucide-react';
import { assetUrl } from '../lib/api';
import { formatApvaInvoiceComplianceNote } from './apva-subsidy-widget';
import type {
    SkaitaDocumentType,
    SkaitaInvoiceRecord,
    SkaitaPaymentStatus,
} from '../lib/skaita-accounting';
import type { AdminCatalogProductRow } from '../app/api/admin/products/route';

interface DraftLine {
    sku: string;
    ean: string;
    title: string;
    unit: string;
    qty: number;
    unitNetEur: number;
    discountPercent: number;
}

interface GilesAdminInvoiceBuilderProps {
    invoices: SkaitaInvoiceRecord[];
    selectedInvoiceId: string;
    onSelectInvoice: (id: string) => void;
    onInvoicesUpdated: (invoices: SkaitaInvoiceRecord[], focusId?: string) => void;
}

export function GilesAdminInvoiceBuilder({
    invoices,
    selectedInvoiceId,
    onSelectInvoice,
    onInvoicesUpdated,
}: GilesAdminInvoiceBuilderProps) {
    const [docType, setDocType] = useState<SkaitaDocumentType>('PVM_SASKAITA_FAKTURA');
    const [buyerName, setBuyerName] = useState('');
    const [buyerCompanyCode, setBuyerCompanyCode] = useState('');
    const [buyerVatCode, setBuyerVatCode] = useState('');
    const [buyerAddress, setBuyerAddress] = useState('Eigulių g. 21, LT-51418 Kaunas');
    const [buyerEmail, setBuyerEmail] = useState('');
    const [paymentTermDays, setPaymentTermDays] = useState(14);

    const [lines, setLines] = useState<DraftLine[]>([
        {
            sku: 'MPB-NANI-35',
            ean: '4770001000351',
            title: 'Granulių degiklio komplektas Megatherm MPB NANI 35 (8–35 kW)',
            unit: 'kompl.',
            qty: 1,
            unitNetEur: 1942.15,
            discountPercent: 0,
        },
    ]);

    const [catalogQuery, setCatalogQuery] = useState('');
    const [catalogResults, setCatalogResults] = useState<AdminCatalogProductRow[]>([]);
    const [sepaText, setSepaText] = useState('');
    const [builderNotice, setBuilderNotice] = useState('');
    const [apvaModeEnabled, setApvaModeEnabled] = useState(true);

    const handleSearchCatalogForInvoice = async (qVal: string) => {
        setCatalogQuery(qVal);
        if (!qVal.trim()) {
            setCatalogResults([]);
            return;
        }
        try {
            const res = await fetch(
                assetUrl(`/api/admin/products?q=${encodeURIComponent(qVal.trim())}&limit=6`),
            );
            const data = await res.json();
            if (data?.ok && Array.isArray(data.items)) {
                setCatalogResults(data.items);
            }
        } catch {
            // ignore
        }
    };

    const handleAddCatalogLine = (item: AdminCatalogProductRow) => {
        setLines((prev) => [
            ...prev,
            {
                sku: item.sku,
                ean: item.ean,
                title: item.name,
                unit: 'vnt.',
                qty: 1,
                unitNetEur: item.priceNetEur,
                discountPercent: 0,
            },
        ]);
        setCatalogQuery('');
        setCatalogResults([]);
    };

    const handleAddServiceLine = () => {
        setLines((prev) => [
            ...prev,
            {
                sku: 'SERV-MONT-01',
                ean: '4770001009999',
                title: 'Katilo ir degiklio montavimo bei paleidimo-derinimo darbai',
                unit: 'darb.',
                qty: 1,
                unitNetEur: 350.0,
                discountPercent: 0,
            },
        ]);
    };

    const computedNet =
        Math.round(
            lines.reduce((sum, l) => {
                const discountedUnit =
                    l.unitNetEur * (1 - Math.min(95, Math.max(0, l.discountPercent)) / 100);
                return sum + discountedUnit * Math.max(1, l.qty);
            }, 0) * 100,
        ) / 100;
    const computedVat = Math.round(computedNet * 0.21 * 100) / 100;
    const computedGross = Math.round((computedNet + computedVat) * 100) / 100;

    const handleCreateInvoice = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!buyerName.trim() || !buyerCompanyCode.trim() || lines.length === 0) return;
        const preparedLines = apvaModeEnabled
            ? lines.map((line, index) => {
                  if (index === 0 && !line.title.includes('[APVA / ENA ATITIKTIS:')) {
                      const apvaBlock = formatApvaInvoiceComplianceNote({
                          sku: line.sku,
                          title: line.title,
                          buyerAddress: buyerAddress.trim(),
                      });
                      return {
                          ...line,
                          title: `${line.title} ${apvaBlock}`,
                      };
                  }
                  return line;
              })
            : lines;
        try {
            const res = await fetch(assetUrl('/api/accounting/skaita'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    docType,
                    buyerName: buyerName.trim(),
                    buyerCompanyCode: buyerCompanyCode.trim(),
                    buyerVatCode: buyerVatCode.trim() || 'LT100000000000',
                    buyerAddress: buyerAddress.trim(),
                    buyerEmail: buyerEmail.trim() || 'apskaita@klientas.lt',
                    paymentTermDays,
                    apvaComplianceMode: apvaModeEnabled,
                    lines: preparedLines,
                }),
            });
            const data = await res.json();
            if (data?.ok && data.invoice && Array.isArray(data.invoices)) {
                onInvoicesUpdated(data.invoices, data.invoice.id);
                setBuilderNotice(
                    `Dokumentas ${data.invoice.invoiceNumber} (${data.invoice.totalGrossEur.toFixed(2)} € su PVM) sugeneruotas ir įrašytas į skaita-invoices.json.`,
                );
                setBuyerName('');
                setBuyerCompanyCode('');
                setBuyerVatCode('');
            }
        } catch {
            // ignore
        }
    };

    const handleUpdateInvoiceStatus = async (
        invoiceId: string,
        paymentStatus: SkaitaPaymentStatus,
    ) => {
        try {
            const res = await fetch(assetUrl('/api/accounting/skaita'), {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'update_status',
                    invoiceId,
                    paymentStatus,
                }),
            });
            const data = await res.json();
            if (data?.ok && Array.isArray(data.invoices)) {
                onInvoicesUpdated(data.invoices, invoiceId);
                setBuilderNotice(`Sąskaitos apmokėjimo būsena atnaujinta: ${paymentStatus}`);
            }
        } catch {
            // ignore
        }
    };

    const handleConvertProToGile = async (invoiceId: string) => {
        try {
            const res = await fetch(assetUrl('/api/accounting/skaita'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'convert_pro_to_gile',
                    invoiceId,
                }),
            });
            const data = await res.json();
            if (data?.ok && Array.isArray(data.invoices)) {
                onInvoicesUpdated(data.invoices, invoiceId);
                setBuilderNotice(
                    `Išankstinė sąskaita konvertuota į PVM sąskaitą faktūrą ${data.invoice?.invoiceNumber}.`,
                );
            }
        } catch {
            // ignore
        }
    };

    const handleRunSepaReconciliation = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!sepaText.trim()) return;
        try {
            const res = await fetch(assetUrl('/api/accounting/skaita'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'reconcile_sepa',
                    statementText: sepaText,
                }),
            });
            const data = await res.json();
            if (data?.ok && Array.isArray(data.invoices)) {
                onInvoicesUpdated(data.invoices);
                setBuilderNotice(
                    `SEPA ISO 20022 (camt.053 / CSV) sudengimas atliktas: automatiškai susieta ir pažymėta apmokėtomis ${data.reconciledCount} sąsk.`,
                );
            }
        } catch {
            // ignore
        }
    };

    return (
        <div className="space-y-5">
            {builderNotice && (
                <div className="rounded-xl bg-[#E3F1E8] text-[#0F5A2B] p-3 text-xs font-bold">
                    {builderNotice}
                </div>
            )}

            {/* A) Multi-Line Catalog-Connected Invoice Builder */}
            <form
                data-testid="admin-multiline-invoice-builder"
                onSubmit={handleCreateInvoice}
                className="rounded-2xl border border-[#E2DDD3] bg-white p-5 space-y-4 text-xs"
            >
                <div className="space-y-1">
                    <span className="font-mono text-xs font-bold text-[#C2410C] block">
                        DAUGIAEILIS SĄSKAITŲ KONSTRUKTORIUS · SUSIETAS SU 6 337 PREKIŲ KATALOGU
                    </span>
                    <h3 className="text-lg font-extrabold text-[#11161B]">
                        Išrašyti PVM sąskaitą faktūrą (`GILE`), Išankstinę (`PRO`) arba Kreditinę (`KRED`)
                    </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label className="flex flex-col gap-1 font-semibold sm:col-span-2">
                        Dokumento tipas
                        <select
                            value={docType}
                            onChange={(e) => setDocType(e.target.value as SkaitaDocumentType)}
                            className="h-10 px-3 rounded-lg border border-[#D5CFC3] bg-[#FAF9F6] font-bold text-[#11161B]"
                        >
                            <option value="PVM_SASKAITA_FAKTURA">
                                PVM sąskaita faktūra (Serija GILE)
                            </option>
                            <option value="ISANKSTINE_SASKAITA">
                                Išankstinė sąskaita (Serija PRO)
                            </option>
                            <option value="KREDITINE_SASKAITA">
                                Kreditinė sąskaita (Serija KRED)
                            </option>
                        </select>
                    </label>

                    <label className="flex flex-col gap-1 font-semibold">
                        Pirkėjo pavadinimas *
                        <input
                            type="text"
                            required
                            value={buyerName}
                            onChange={(e) => setBuyerName(e.target.value)}
                            placeholder="Įmonė arba fizinis asmuo"
                            className="h-10 px-3 rounded-lg border border-[#D5CFC3] bg-white"
                        />
                    </label>
                    <label className="flex flex-col gap-1 font-semibold">
                        Pirkėjo įmonės kodas *
                        <input
                            type="text"
                            required
                            value={buyerCompanyCode}
                            onChange={(e) => setBuyerCompanyCode(e.target.value)}
                            placeholder="300000000"
                            className="h-10 px-3 rounded-lg border border-[#D5CFC3] bg-white font-mono"
                        />
                    </label>
                    <label className="flex flex-col gap-1 font-semibold">
                        PVM mokėtojo kodas
                        <input
                            type="text"
                            value={buyerVatCode}
                            onChange={(e) => setBuyerVatCode(e.target.value)}
                            placeholder="LT100000000000"
                            className="h-10 px-3 rounded-lg border border-[#D5CFC3] bg-white font-mono"
                        />
                    </label>
                    <label className="flex flex-col gap-1 font-semibold">
                        Apmokėjimo terminas (d.)
                        <input
                            type="number"
                            min={1}
                            value={paymentTermDays}
                            onChange={(e) => setPaymentTermDays(Number(e.target.value))}
                            className="h-10 px-3 rounded-lg border border-[#D5CFC3] bg-white font-bold"
                        />
                    </label>
                    <label className="flex flex-col gap-1 font-semibold">
                        Adresas
                        <input
                            type="text"
                            value={buyerAddress}
                            onChange={(e) => setBuyerAddress(e.target.value)}
                            className="h-10 px-3 rounded-lg border border-[#D5CFC3] bg-white"
                        />
                    </label>
                    <label className="flex flex-col gap-1 font-semibold">
                        El. paštas sąskaitai
                        <input
                            type="email"
                            value={buyerEmail}
                            onChange={(e) => setBuyerEmail(e.target.value)}
                            placeholder="apskaita@klientas.lt"
                            className="h-10 px-3 rounded-lg border border-[#D5CFC3] bg-white"
                        />
                    </label>
                </div>

                {/* Live Catalog Line-Item Picker */}
                <div
                    data-testid="invoice-catalog-search"
                    className="rounded-xl border border-[#E2DDD3] bg-[#FAF9F6] p-3.5 space-y-2.5"
                >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-bold text-[#11161B]">
                            Pridėti prekes iš 6 337 katalogo arba montavimo paslaugą
                        </span>
                        <button
                            type="button"
                            onClick={handleAddServiceLine}
                            className="h-9 px-3 rounded-lg border border-[#D5CFC3] bg-white hover:border-[#11161B] font-bold text-[#11161B] cursor-pointer"
                        >
                            + Pridėti montavimo / serviso darbus
                        </button>
                    </div>

                    <div className="relative">
                        <input
                            type="text"
                            value={catalogQuery}
                            onChange={(e) => handleSearchCatalogForInvoice(e.target.value)}
                            placeholder="Įveskite SKU arba pavadinimą (pvz. MPB-NANI-35, 013G2990, AW082HUGHA, ZV 100)..."
                            className="w-full h-10 pl-9 pr-3 rounded-lg border border-[#D5CFC3] bg-white"
                        />
                        <Search className="w-4 h-4 text-[#5B6470] absolute left-3 top-3" />
                    </div>

                    {catalogResults.length > 0 && (
                        <div className="space-y-1.5 pt-1">
                            {catalogResults.map((hit) => (
                                <div
                                    key={hit.id}
                                    className="rounded-lg border border-[#E2DDD3] bg-white p-2.5 flex items-center justify-between gap-2"
                                >
                                    <div>
                                        <span className="font-mono font-bold text-[#C2410C]">
                                            {hit.sku}
                                        </span>{' '}
                                        <strong className="text-[#11161B]">{hit.name}</strong>
                                        <span className="block text-[#5B6470]">
                                            Be PVM: {hit.priceNetEur.toFixed(2)} € · Su PVM: {hit.priceGrossEur.toFixed(2)} € · Kaune: {hit.stockQuantity} vnt.
                                        </span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleAddCatalogLine(hit)}
                                        className="h-9 px-3 rounded-lg bg-[#11161B] text-white font-bold cursor-pointer shrink-0"
                                    >
                                        + Įtraukti
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Line Items List */}
                    <div className="space-y-2 pt-1">
                        {lines.map((line, idx) => (
                            <div
                                key={`${line.sku}-${idx}`}
                                className="rounded-lg border border-[#E2DDD3] bg-white p-2.5 space-y-2"
                            >
                                <div className="flex items-center justify-between gap-2">
                                    <span className="font-mono font-bold text-[#C2410C]">
                                        #{idx + 1} · {line.sku}
                                    </span>
                                    {lines.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setLines((prev) =>
                                                    prev.filter((_, i) => i !== idx),
                                                )
                                            }
                                            className="h-8 px-2 rounded border border-[#D5CFC3] text-[#8A2F07] inline-flex items-center gap-1 cursor-pointer"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                            <span>Šalinti</span>
                                        </button>
                                    )}
                                </div>
                                <input
                                    type="text"
                                    value={line.title}
                                    onChange={(e) =>
                                        setLines((prev) =>
                                            prev.map((l, i) =>
                                                i === idx ? { ...l, title: e.target.value } : l,
                                            ),
                                        )
                                    }
                                    className="w-full h-9 px-2.5 rounded border border-[#D5CFC3] bg-[#FAF9F6] font-semibold"
                                />
                                <div className="grid grid-cols-3 gap-2">
                                    <label className="flex flex-col gap-0.5 font-semibold text-[#5B6470]">
                                        Kiekis ({line.unit})
                                        <input
                                            type="number"
                                            min={1}
                                            value={line.qty}
                                            onChange={(e) =>
                                                setLines((prev) =>
                                                    prev.map((l, i) =>
                                                        i === idx
                                                            ? { ...l, qty: Number(e.target.value) }
                                                            : l,
                                                    ),
                                                )
                                            }
                                            className="h-9 px-2 rounded border border-[#D5CFC3] bg-white font-bold text-[#11161B]"
                                        />
                                    </label>
                                    <label className="flex flex-col gap-0.5 font-semibold text-[#5B6470]">
                                        Kaina be PVM (€)
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={line.unitNetEur}
                                            onChange={(e) =>
                                                setLines((prev) =>
                                                    prev.map((l, i) =>
                                                        i === idx
                                                            ? {
                                                                  ...l,
                                                                  unitNetEur: Number(e.target.value),
                                                              }
                                                            : l,
                                                    ),
                                                )
                                            }
                                            className="h-9 px-2 rounded border border-[#D5CFC3] bg-white font-bold text-[#11161B]"
                                        />
                                    </label>
                                    <label className="flex flex-col gap-0.5 font-semibold text-[#5B6470]">
                                        Nuolaida (%)
                                        <input
                                            type="number"
                                            min={0}
                                            max={90}
                                            value={line.discountPercent}
                                            onChange={(e) =>
                                                setLines((prev) =>
                                                    prev.map((l, i) =>
                                                        i === idx
                                                            ? {
                                                                  ...l,
                                                                  discountPercent: Number(
                                                                      e.target.value,
                                                                  ),
                                                              }
                                                            : l,
                                                    ),
                                                )
                                            }
                                            className="h-9 px-2 rounded border border-[#D5CFC3] bg-white font-semibold text-[#11161B]"
                                        />
                                    </label>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="rounded-lg bg-[#11161B] text-white p-3 flex flex-wrap items-center justify-between gap-2">
                        <span>
                            Be PVM: <strong>{computedNet.toFixed(2)} €</strong> · PVM 21%: <strong>{computedVat.toFixed(2)} €</strong>
                        </span>
                        <span className="text-sm font-extrabold text-[#FF8A3D]">
                            Iš viso su PVM: {computedGross.toFixed(2)} €
                        </span>
                    </div>

                    {/* APVA / ENA Technical Compliance Block Toggle */}
                    <div className="rounded-lg border border-[#157A3B]/40 bg-[#E3F1E8] p-3 space-y-2">
                        <label className="flex items-start gap-2.5 cursor-pointer">
                            <input
                                type="checkbox"
                                data-testid="invoice-apva-mode-toggle"
                                checked={apvaModeEnabled}
                                onChange={(e) => setApvaModeEnabled(e.target.checked)}
                                className="mt-0.5 h-4 w-4 accent-[#157A3B] cursor-pointer shrink-0"
                            />
                            <span className="font-bold text-[#0F5A2B] leading-snug">
                                Įtraukti APVA / ENA paramos techninius rekvizitus (Modelis, kW, SCOP/ηs, EcoDesign sertifikatas)
                            </span>
                        </label>
                        {apvaModeEnabled && lines[0] && (
                            <div
                                data-testid="invoice-apva-compliance-preview"
                                className="rounded border border-[#157A3B]/30 bg-white px-2.5 py-2 font-mono text-[11px] font-semibold text-[#11161B] flex items-start gap-2"
                            >
                                <ShieldCheck className="h-4 w-4 text-[#157A3B] shrink-0 mt-0.5" />
                                <span>
                                    {formatApvaInvoiceComplianceNote({
                                        sku: lines[0].sku,
                                        title: lines[0].title,
                                        buyerAddress,
                                    })}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                <button
                    type="submit"
                    data-testid="create-skaita-invoice-btn"
                    className="w-full h-11 rounded-lg bg-[#C2410C] hover:bg-[#9A3412] text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer"
                >
                    <Plus className="w-4 h-4" />
                    <span>Sugeneruoti sąskaitą ({lines.length} eil.) + i.VAZ</span>
                </button>
            </form>

            {/* B) Invoices Journal with Status Lifecycle & 1-Click PRO -> GILE Conversion */}
            <div className="rounded-2xl border border-[#E2DDD3] bg-white p-5 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                    <h3 className="text-base font-extrabold text-[#11161B]">
                        Išrašytų sąskaitų žurnalas ir būsenų valdymas ({invoices.length})
                    </h3>
                    <button
                        type="button"
                        data-testid="convert-pro-to-gile-btn"
                        onClick={() => {
                            const firstPro = invoices.find(
                                (i) =>
                                    i.docType === 'ISANKSTINE_SASKAITA' ||
                                    i.invoiceNumber.startsWith('PRO-'),
                            );
                            if (firstPro) handleConvertProToGile(firstPro.id);
                        }}
                        className="h-9 px-3 rounded-lg border border-[#D5CFC3] bg-[#FAF9F6] hover:border-[#11161B] font-bold text-[#11161B] inline-flex items-center gap-1 cursor-pointer"
                    >
                        <ArrowRightLeft className="w-3.5 h-3.5" />
                        <span>PRO į GILE konvertavimas</span>
                    </button>
                </div>

                {invoices.length === 0 ? (
                    <p className="text-[#5B6470]">
                        Išrašytų sąskaitų dar nėra. Sukurkite sąskaitą formoje aukščiau.
                    </p>
                ) : (
                    <div className="space-y-2.5">
                        {invoices.map((inv) => {
                            const active = selectedInvoiceId === inv.id;
                            const statusBadge =
                                inv.paymentStatus === 'APMOKETA_PAVEDIMU'
                                    ? 'bg-[#E3F1E8] text-[#0F5A2B]'
                                    : inv.paymentStatus === 'ANULIUOTA'
                                      ? 'bg-[#FBEADF] text-[#8A2F07]'
                                      : 'bg-[#FFF1D6] text-[#7A4A00]';
                            return (
                                <div
                                    key={inv.id}
                                    className={`rounded-xl p-3.5 border space-y-2 ${
                                        active
                                            ? 'border-[#C2410C] bg-[#FAF9F6]'
                                            : 'border-[#E2DDD3] bg-white'
                                    }`}
                                >
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <button
                                            type="button"
                                            onClick={() => onSelectInvoice(inv.id)}
                                            className="text-left font-mono font-bold text-[#C2410C] underline cursor-pointer"
                                        >
                                            {inv.invoiceNumber} (Išankstinė: {inv.proformaNumber})
                                        </button>
                                        <span
                                            className={`px-2.5 py-0.5 rounded-full font-bold ${statusBadge}`}
                                        >
                                            {inv.paymentStatus === 'APMOKETA_PAVEDIMU'
                                                ? 'Apmokėta (Pavedimu)'
                                                : inv.paymentStatus === 'ANULIUOTA'
                                                  ? 'Anuliuota'
                                                  : 'Laukia apmokėjimo'}
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <div>
                                            <strong className="text-[#11161B]">
                                                {inv.buyerName}
                                            </strong>{' '}
                                            <span className="text-[#5B6470]">
                                                (įm. k. {inv.buyerCompanyCode}) · {inv.lines.length} eil.
                                            </span>
                                        </div>
                                        <span className="font-extrabold text-[#11161B]">
                                            {inv.totalGrossEur.toFixed(2)} € su PVM
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2 pt-1">
                                        <select
                                            aria-label={`Apmokėjimo būsena ${inv.invoiceNumber}`}
                                            value={inv.paymentStatus || 'LAUKIA_APMOKEJIMO'}
                                            onChange={(e) =>
                                                handleUpdateInvoiceStatus(
                                                    inv.id,
                                                    e.target.value as SkaitaPaymentStatus,
                                                )
                                            }
                                            className="h-9 px-2.5 rounded-lg border border-[#D5CFC3] bg-white font-semibold"
                                        >
                                            <option value="LAUKIA_APMOKEJIMO">
                                                Laukia apmokėjimo
                                            </option>
                                            <option value="APMOKETA_PAVEDIMU">
                                                Apmokėta (Pavedimu)
                                            </option>
                                            <option value="ANULIUOTA">Anuliuota</option>
                                        </select>
                                        {(inv.docType === 'ISANKSTINE_SASKAITA' ||
                                            inv.invoiceNumber.startsWith('PRO-')) && (
                                            <button
                                                type="button"
                                                onClick={() => handleConvertProToGile(inv.id)}
                                                className="h-9 px-3 rounded-lg bg-[#11161B] hover:bg-[#C2410C] text-white font-bold cursor-pointer"
                                            >
                                                Konvertuoti PRO į GILE PVM SF
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* C) 2026/2027 SEPA ISO 20022 (camt.053 / CSV) Automated Bank Statement Reconciliation */}
            <form
                data-testid="sepa-bank-reconciliation"
                onSubmit={handleRunSepaReconciliation}
                className="rounded-2xl border border-[#E2DDD3] bg-white p-5 space-y-3 text-xs"
            >
                <span className="font-mono text-xs font-bold text-[#C2410C] block">
                    2026/2027 SEPA ISO 20022 (CAMT.053 / CSV) AUTOMATINIS BANKO IŠRAŠŲ SUDENGIMAS
                </span>
                <h3 className="text-base font-extrabold text-[#11161B]">
                    Automatinis apmokėjimų sudengimas (Swedbank / SEB / Luminor camt.053 XML arba CSV)
                </h3>
                <p className="text-[#5B6470]">
                    Įklijuokite SEPA banko išrašo XML arba CSV eilutes su mokėjimo paskirtimi (`GILE-XXXX` arba `PRO-XXXX`). Sistema automatiškai pažymi sąskaitas `Apmokėta (Pavedimu)` ir konvertuoja apmokėtas `PRO-...` išankstines sąskaitas į `GILE-...` PVM sąskaitas faktūras.
                </p>
                <textarea
                    rows={3}
                    value={sepaText}
                    onChange={(e) => setSepaText(e.target.value)}
                    placeholder="<Ntry><Amt Ccy=&quot;EUR&quot;>2439.54</Amt><RmtInf><Ustrd>Apmokejimas pagal PRO-0001</Ustrd></RmtInf></Ntry>"
                    className="w-full p-3 rounded-lg border border-[#D5CFC3] bg-[#FAF9F6] font-mono text-xs"
                />
                <button
                    type="submit"
                    className="w-full h-10 rounded-lg bg-[#157A3B] hover:bg-[#0F5A2B] text-white font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer"
                >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Vykdyti SEPA banko išrašo sudengimą</span>
                </button>
            </form>
        </div>
    );
}
