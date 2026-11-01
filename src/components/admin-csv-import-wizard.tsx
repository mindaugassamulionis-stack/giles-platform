'use client';

import { useMemo, useState } from 'react';
import { Upload, FileSpreadsheet, AlertTriangle } from 'lucide-react';
import { assetUrl } from '../lib/api';
import {
    detectCsvDelimiter,
    parseCsvRows,
    guessCsvColumnMapping,
    type CsvColumnMapping,
    type CsvDelimiter,
} from '../lib/admin-csv-import';

// W123-A1: supplier CSV import wizard (module 3). Delimiter detection and
// column mapping run client-side with the pure lib; the dry-run and apply
// steps hit /api/admin/products so margins check against the real catalog.

interface CsvDryRunDelta {
    sku: string;
    name: string;
    matched: boolean;
    currentPriceGrossEur: number | null;
    newPriceGrossEur: number;
    deltaPct: number | null;
    marginPct: number;
    marginBlocked: boolean;
    newStock: number | null;
    brand: string;
}

interface CsvDryRunResponse {
    ok: boolean;
    error?: string;
    rowsParsed: number;
    matchedCount: number;
    newCount: number;
    blockedCount: number;
    deltas: CsvDryRunDelta[];
}

const COLUMN_ROLES: Array<{ key: keyof CsvColumnMapping; label: string }> = [
    { key: 'sku', label: 'SKU kodas' },
    { key: 'name', label: 'Pavadinimas' },
    { key: 'price', label: 'Kaina su PVM (€)' },
    { key: 'stock', label: 'Likutis' },
    { key: 'brand', label: 'Gamintojas' },
];

export function AdminCsvImportWizard({ onApplied }: { onApplied?: () => void }) {
    const [rawText, setRawText] = useState('');
    const [delimiter, setDelimiter] = useState<CsvDelimiter>(';');
    const [mapping, setMapping] = useState<CsvColumnMapping>({
        sku: null,
        name: null,
        price: null,
        stock: null,
        brand: null,
    });
    const [dryRun, setDryRun] = useState<CsvDryRunResponse | null>(null);
    const [busy, setBusy] = useState(false);
    const [applyResult, setApplyResult] = useState<string>('');

    const parsedRows = useMemo(
        () => (rawText.trim() ? parseCsvRows(rawText, delimiter) : []),
        [rawText, delimiter],
    );
    const headerRow = parsedRows[0] || [];

    const handleTextChange = (text: string) => {
        setRawText(text);
        setDryRun(null);
        setApplyResult('');
        if (text.trim()) {
            const detected = detectCsvDelimiter(text);
            setDelimiter(detected);
            const rows = parseCsvRows(text, detected);
            if (rows[0]) {
                setMapping(guessCsvColumnMapping(rows[0]));
            }
        }
    };

    const handleFileUpload = (file: File) => {
        void file.text().then(handleTextChange);
    };

    const runDryRun = async () => {
        if (!parsedRows.length) return;
        setBusy(true);
        setApplyResult('');
        try {
            const res = await fetch(assetUrl('/api/admin/products'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'csv_import_dryrun',
                    rows: parsedRows,
                    mapping,
                }),
            });
            const data: CsvDryRunResponse = await res.json();
            setDryRun(data);
        } catch {
            setDryRun({
                ok: false,
                error: 'Dry-run užklausa nepavyko (tinklo klaida)',
                rowsParsed: 0,
                matchedCount: 0,
                newCount: 0,
                blockedCount: 0,
                deltas: [],
            });
        } finally {
            setBusy(false);
        }
    };

    const applyImport = async () => {
        if (!dryRun?.ok) return;
        const rows = dryRun.deltas
            .filter((d) => !d.marginBlocked)
            .map((d) => ({
                sku: d.sku,
                name: d.name,
                priceGrossEur: d.newPriceGrossEur,
                stockQuantity: d.newStock ?? 0,
                brandName: d.brand || undefined,
            }));
        if (!rows.length) return;
        setBusy(true);
        try {
            const res = await fetch(assetUrl('/api/admin/products'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'csv_import_apply', rows }),
            });
            const data = await res.json();
            if (data?.ok) {
                setApplyResult(
                    `Importas atliktas: atnaujinta ${data.updatedCount} esamų SKU, sukurta ${data.createdCount} naujų prekių.`,
                );
                window.dispatchEvent(new Event('giles-admin:catalog-changed'));
                onApplied?.();
            } else {
                setApplyResult(data?.error || 'Importas nepavyko');
            }
        } catch {
            setApplyResult('Importas nepavyko (tinklo klaida)');
        } finally {
            setBusy(false);
        }
    };

    const columnOptions = Array.isArray(headerRow) ? headerRow : [];

    return (
        <div
            data-testid="admin-csv-wizard"
            className="rounded-2xl border border-[#E2DDD3] bg-white p-5 space-y-4 text-xs"
        >
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <span className="font-mono text-xs font-bold text-[#C2410C] block">
                        CSV IMPORTO VEDLYS: MAPINGAS + DRY-RUN + MARŽOS APSAUGA
                    </span>
                    <h3 className="text-base font-extrabold text-[#11161B]">
                        Tiekėjo kainoraščio importas per 3 žingsnius
                    </h3>
                    <p className="text-[#5B6470]">
                        Įkelkite arba įklijuokite CSV: sistema atpažins skirtuką ir stulpelius,
                        parodys kainų pokyčius prieš taikant ir neleis nusileisti žemiau 15% maržos.
                    </p>
                </div>
                <label className="h-9 px-3 rounded-lg border border-[#D5CFC3] bg-[#FAF9F6] hover:border-[#11161B] text-[#11161B] font-semibold inline-flex items-center gap-1.5 cursor-pointer">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Įkelti .CSV failą</span>
                    <input
                        type="file"
                        accept=".csv,.tsv,.txt"
                        onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFileUpload(file);
                        }}
                        className="hidden"
                    />
                </label>
            </div>

            <label className="flex flex-col gap-1 font-semibold">
                1. Kainoraščio turinys (įklijuokite arba įkelkite failą)
                <textarea
                    rows={4}
                    value={rawText}
                    onChange={(e) => handleTextChange(e.target.value)}
                    placeholder={'Kodas;Pavadinimas;Kaina;Likutis;Gamintojas\nSKU-A;Mazgas A;100;5;Danfoss'}
                    className="p-3 rounded-lg border border-[#D5CFC3] bg-[#FAF9F6] font-mono text-xs"
                    data-testid="admin-csv-text"
                />
            </label>

            {parsedRows.length > 0 && (
                <div className="space-y-3" data-testid="admin-csv-mapping">
                    <div className="flex flex-wrap items-center gap-3">
                        <span className="font-bold text-[#11161B]">2. Stulpelių susiejimas</span>
                        <label className="flex items-center gap-1.5 font-semibold text-[#5B6470]">
                            Skirtukas:
                            <select
                                value={delimiter}
                                onChange={(e) => {
                                    const next = e.target.value as CsvDelimiter;
                                    setDelimiter(next);
                                    const rows = parseCsvRows(rawText, next);
                                    if (rows[0]) setMapping(guessCsvColumnMapping(rows[0]));
                                    setDryRun(null);
                                }}
                                className="h-9 px-2 rounded-lg border border-[#D5CFC3] bg-[#FAF9F6] font-mono"
                            >
                                <option value=";">;</option>
                                <option value=",">,</option>
                                <option value={'\t'}>TAB</option>
                                <option value="|">|</option>
                            </select>
                        </label>
                        <span className="text-[#5B6470]">
                            Atpažinta eilučių: <strong>{Math.max(0, parsedRows.length - 1)}</strong>
                        </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                        {COLUMN_ROLES.map((role) => (
                            <label key={role.key} className="flex flex-col gap-1 font-semibold">
                                {role.label}
                                <select
                                    value={mapping[role.key] ?? ''}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setMapping((prev) => ({
                                            ...prev,
                                            [role.key]: val === '' ? null : Number(val),
                                        }));
                                        setDryRun(null);
                                    }}
                                    className="h-9 px-2 rounded-lg border border-[#D5CFC3] bg-[#FAF9F6] font-semibold"
                                >
                                    <option value="">(nesusieta)</option>
                                    {columnOptions.map((h, i) => (
                                        <option key={`${h}-${i}`} value={i}>
                                            {h || `Stulpelis ${i + 1}`}
                                        </option>
                                    ))}
                                </select>
                            </label>
                        ))}
                    </div>
                    <button
                        type="button"
                        onClick={runDryRun}
                        disabled={busy || mapping.sku == null}
                        data-testid="admin-csv-dryrun-btn"
                        className="h-10 px-4 rounded-lg bg-[#11161B] hover:bg-[#C2410C] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold inline-flex items-center gap-1.5 cursor-pointer"
                    >
                        <FileSpreadsheet className="w-4 h-4" />
                        <span>Tikrinti prieš taikant (dry-run)</span>
                    </button>
                </div>
            )}

            {dryRun && !dryRun.ok && (
                <p
                    data-testid="admin-csv-dryrun-error"
                    className="rounded-xl bg-[#FBEADF] text-[#8A2F07] p-3 font-bold inline-flex items-center gap-2"
                >
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    {dryRun.error || 'Dry-run nepavyko'}
                </p>
            )}

            {dryRun?.ok && (
                <div className="space-y-3" data-testid="admin-csv-dryrun-result">
                    <div className="flex flex-wrap items-center gap-3 font-semibold text-[#11161B]">
                        <span className="font-bold">3. Dry-run peržiūra:</span>
                        <span>Nuskaityta eilučių: <strong>{dryRun.rowsParsed}</strong></span>
                        <span>Susietų pagal SKU: <strong>{dryRun.matchedCount}</strong></span>
                        <span>Naujų prekių: <strong>{dryRun.newCount}</strong></span>
                        {dryRun.blockedCount > 0 && (
                            <span className="text-[#8A2F07]">
                                Užblokuota maržos apsaugos: <strong>{dryRun.blockedCount}</strong>
                            </span>
                        )}
                    </div>
                    <div className="space-y-1.5 max-h-64 overflow-y-auto">
                        {dryRun.deltas.map((d) => (
                            <div
                                key={d.sku}
                                className={`rounded-lg border px-3 py-2 flex flex-wrap items-center gap-x-3 gap-y-1 ${
                                    d.marginBlocked
                                        ? 'border-[#F3C9AE] bg-[#FBEADF] text-[#8A2F07]'
                                        : 'border-[#E2DDD3] bg-[#FAF9F6] text-[#11161B]'
                                }`}
                            >
                                <span className="font-mono font-bold shrink-0">{d.sku}</span>
                                <span className="min-w-0 flex-1 truncate">{d.name}</span>
                                {d.matched ? (
                                    <span className="shrink-0">
                                        {d.currentPriceGrossEur?.toFixed(2)} € →{' '}
                                        <strong>{d.newPriceGrossEur.toFixed(2)} €</strong>
                                        {d.deltaPct != null && (
                                            <span> ({d.deltaPct > 0 ? '+' : ''}{d.deltaPct.toFixed(1)}%)</span>
                                        )}
                                    </span>
                                ) : (
                                    <span className="shrink-0">
                                        Nauja prekė: <strong>{d.newPriceGrossEur.toFixed(2)} €</strong>
                                    </span>
                                )}
                                <span className={`shrink-0 font-bold ${d.marginBlocked ? '' : 'text-[#0F5A2B]'}`}>
                                    {d.marginBlocked
                                        ? `Marža ${d.marginPct.toFixed(1)}% < 15% (bus praleista)`
                                        : `Marža ${d.marginPct.toFixed(1)}%`}
                                </span>
                            </div>
                        ))}
                    </div>
                    <button
                        type="button"
                        onClick={applyImport}
                        disabled={busy || dryRun.deltas.filter((d) => !d.marginBlocked).length === 0}
                        data-testid="admin-csv-apply-btn"
                        className="h-10 px-4 rounded-lg bg-[#157A3B] hover:bg-[#0F5A2B] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold inline-flex items-center gap-1.5 cursor-pointer"
                    >
                        <span>Taikyti importą ({dryRun.deltas.filter((d) => !d.marginBlocked).length} eil.)</span>
                    </button>
                </div>
            )}

            {applyResult && (
                <p
                    data-testid="admin-csv-apply-result"
                    className="rounded-xl bg-[#E3F1E8] text-[#0F5A2B] p-3 font-bold"
                >
                    {applyResult}
                </p>
            )}
        </div>
    );
}
