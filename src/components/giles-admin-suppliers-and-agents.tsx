'use client';

import { useEffect, useState } from 'react';
import {
    Check,
    Plus,
    RefreshCw,
    ShieldCheck,
    Sliders,
    Upload,
    Play,
    BookOpen,
    Activity,
} from 'lucide-react';
import { assetUrl } from '../lib/api';
import type {
    AiAgentExecutionMode,
    AiAgentProvider,
    GilesActiveAiAgent,
    GilesAiAgentLogEntry,
    GilesSupplierRecord,
    ImportedSupplierSkuResult,
} from '../lib/suppliers-and-agents-store';

interface GilesAdminSuppliersManagerProps {
    onCatalogSynced?: () => void;
}

export function GilesAdminSuppliersManager({
    onCatalogSynced,
}: GilesAdminSuppliersManagerProps) {
    const [suppliers, setSuppliers] = useState<GilesSupplierRecord[]>([]);
    const [showAddSupplier, setShowAddSupplier] = useState(false);
    const [showPricelistImporter, setShowPricelistImporter] = useState(false);
    const [notice, setNotice] = useState('');

    // New / Edit Supplier form state
    const [supId, setSupId] = useState('');
    const [supName, setSupName] = useState('');
    const [supCountry, setSupCountry] = useState('Čekija / ES');
    const [supEmail, setSupEmail] = useState('export@tiekejas.eu');
    const [supCurrency, setSupCurrency] = useState('EUR');
    const [supDiscountPct, setSupDiscountPct] = useState(38);
    const [supTargetMarginPct, setSupTargetMarginPct] = useState(25);
    const [supLeadTime, setSupLeadTime] = useState('2–4 d. d.');
    const [supSkuPrefix, setSupSkuPrefix] = useState('DRZ-');
    const [supFeedFormat, setSupFeedFormat] = useState('XLSX / CSV / XML');
    const [supFeedNote, setSupFeedNote] = useState(
        'Kombinuoti vandens šildytuvai, akumuliacinės talpos ir katilinės armatūra.',
    );
    const [supEnabled, setSupEnabled] = useState(true);

    // Pricelist CSV/TSV/JSON importer state
    const [importSupplierId, setImportSupplierId] = useState('danfoss');
    const [importRawText, setImportRawText] = useState(
        [
            'DRZ-OKC-200-NTR; Dražice OKC 200 NTR/BP netiesioginio šildymo vandens šildytuvas (2,1 m² šilumokaitis); 650.00; 12; Boileriai ir akumuliacinės talpos',
            'DRZ-OKC-160-NTR; Dražice OKC 160 NTR/BP greitaeigis boileris šilumos siurbliui; 540.00; 9; Boileriai ir akumuliacinės talpos',
            'GRF-ALPHA2-25-60; Grundfos ALPHA2 25-60 180 cirkuliacinis siurblys su AUTOADAPT; 210.00; 18; Cirkuliaciniai siurbliai',
        ].join('\n'),
    );
    const [importedPreview, setImportedPreview] = useState<ImportedSupplierSkuResult[]>([]);

    // Inline discount/margin edits per supplier
    const [draftSupplierParams, setDraftSupplierParams] = useState<
        Record<string, { dealerDiscountPct: number; targetMarginPct: number; enabled: boolean }>
    >({});

    const loadSuppliers = async () => {
        try {
            const res = await fetch(assetUrl('/api/admin/suppliers'));
            const data = await res.json();
            if (data?.ok && Array.isArray(data.suppliers)) {
                setSuppliers(data.suppliers);
                const nextDrafts: typeof draftSupplierParams = {};
                for (const s of data.suppliers as GilesSupplierRecord[]) {
                    nextDrafts[s.id] = {
                        dealerDiscountPct: s.dealerDiscountPct,
                        targetMarginPct: s.targetMarginPct,
                        enabled: s.enabled,
                    };
                }
                setDraftSupplierParams(nextDrafts);
            }
        } catch {
            // ignore
        }
    };

    useEffect(() => {
        loadSuppliers();
    }, []);

    const handleUpsertSupplier = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!supName.trim()) return;
        try {
            const res = await fetch(assetUrl('/api/admin/suppliers'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'upsert_supplier',
                    id: supId.trim() || undefined,
                    name: supName.trim(),
                    country: supCountry.trim(),
                    contactEmail: supEmail.trim(),
                    currency: supCurrency.trim(),
                    dealerDiscountPct: supDiscountPct,
                    targetMarginPct: Math.max(15, supTargetMarginPct),
                    leadTimeDays: supLeadTime.trim(),
                    skuPrefix: supSkuPrefix.trim(),
                    feedFormat: supFeedFormat.trim(),
                    feedUrlOrNote: supFeedNote.trim(),
                    enabled: supEnabled,
                }),
            });
            const data = await res.json();
            if (data?.ok && data.supplier) {
                setNotice(
                    `Tiekėjas „${data.supplier.name}“ išsaugotas (didmeninė nuolaida -${data.supplier.dealerDiscountPct}%, tikslinė marža ${data.supplier.targetMarginPct}%, min. 15% saugiklis).`,
                );
                setImportSupplierId(data.supplier.id);
                setShowAddSupplier(false);
                setSupId('');
                setSupName('');
                await loadSuppliers();
            }
        } catch {
            // ignore
        }
    };

    const handleSaveInlineSupplier = async (s: GilesSupplierRecord) => {
        const draft = draftSupplierParams[s.id];
        if (!draft) return;
        try {
            const res = await fetch(assetUrl('/api/admin/suppliers'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'upsert_supplier',
                    id: s.id,
                    name: s.name,
                    country: s.country,
                    contactEmail: s.contactEmail,
                    currency: s.currency,
                    dealerDiscountPct: draft.dealerDiscountPct,
                    targetMarginPct: Math.max(15, draft.targetMarginPct),
                    leadTimeDays: s.leadTimeDays,
                    skuPrefix: s.skuPrefix,
                    feedFormat: s.feedFormat,
                    feedUrlOrNote: s.feedUrlOrNote,
                    sourceFile: s.sourceFile,
                    enabled: draft.enabled,
                }),
            });
            const data = await res.json();
            if (data?.ok) {
                setNotice(
                    `Atnaujintos tiekėjo „${s.name}“ sąlygos: nuolaida -${draft.dealerDiscountPct}%, tikslinė marža ${Math.max(15, draft.targetMarginPct)}%.`,
                );
                await loadSuppliers();
            }
        } catch {
            // ignore
        }
    };

    const handleSyncSupplierNow = async (supplierId: string) => {
        try {
            const res = await fetch(assetUrl('/api/admin/suppliers'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'sync_pricelist',
                    supplierId,
                }),
            });
            const data = await res.json();
            if (data?.ok && data.supplier) {
                setNotice(
                    `Sinchronizuotas tiekėjo „${data.supplier.name}“ kainynas (${data.supplier.skuCount} SKU pozicijos, paskutinė patikra ${data.supplier.lastSyncedAt}).`,
                );
                await loadSuppliers();
                onCatalogSynced?.();
            }
        } catch {
            // ignore
        }
    };

    const handleImportPricelist = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!importRawText.trim()) return;
        try {
            const res = await fetch(assetUrl('/api/admin/suppliers'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'import_pricelist',
                    supplierId: importSupplierId,
                    rawText: importRawText,
                }),
            });
            const data = await res.json();
            if (data?.ok) {
                setImportedPreview(Array.isArray(data.items) ? data.items : []);
                setNotice(
                    `Importuotos ${data.importedCount} prekės iš tiekėjo „${data.supplier?.name || importSupplierId}“ kainoraščio. Savikainos ir mažmeninės kainos su >=15% marža iškart paskelbtos /lt/products vitrinoje.`,
                );
                await loadSuppliers();
                onCatalogSynced?.();
            }
        } catch {
            // ignore
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            if (typeof reader.result === 'string') {
                setImportRawText(reader.result);
            }
        };
        reader.readAsText(file);
    };

    return (
        <div data-testid="admin-suppliers-manager" className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <span className="font-mono text-xs font-bold text-[#C2410C] block">
                        3 SKYRIUS · TIEKĖJŲ KAINYNŲ IR KATALOGO PREKIŲ SINCHRONIZACIJA
                    </span>
                    <h2 className="text-xl sm:text-2xl font-extrabold text-[#11161B]">
                        {suppliers.length || 5} Tiekėjų Kainoraščiai (Danfoss, HERZ, Gorenje/TIKI, Gilės/Megatherm, Haier ir nauji tiekėjai)
                    </h2>
                    <p className="text-xs text-[#5B6470]">
                        Pridėkite naują tiekėją (pvz. Dražice, Viessmann, Flamco, Grundfos, Comisa), nustatykite dilerio nuolaidą (%), tikslinę maržą (&gt;=15%) ir įkelkite CSV/XLSX kainoraštį tiesiai į parduotuvę.
                    </p>
                </div>

                <div className="flex flex-wrap gap-2">
                    <button
                        type="button"
                        data-testid="admin-add-supplier-btn"
                        onClick={() => setShowAddSupplier((prev) => !prev)}
                        className="h-10 px-4 rounded-lg border border-[#C2410C] bg-transparent hover:bg-[#C2410C] hover:text-white text-[#C2410C] text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        <span>+ Pridėti naują tiekėją ir kainoraštį</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setShowPricelistImporter((prev) => !prev)}
                        className="h-10 px-4 rounded-lg border border-[#11161B] bg-transparent hover:bg-[#11161B] hover:text-white text-[#11161B] text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                        <Upload className="w-4 h-4" />
                        <span>Įkelti tiekėjo CSV / TSV / JSON kainoraštį</span>
                    </button>
                </div>
            </div>

            {notice && (
                <div className="rounded-xl bg-[#E3F1E8] text-[#0F5A2B] p-3.5 text-xs font-bold">
                    {notice}
                </div>
            )}

            {/* 1. Add / Edit Supplier Form */}
            {showAddSupplier && (
                <form
                    onSubmit={handleUpsertSupplier}
                    className="rounded-2xl border border-[#D5CFC3] bg-white p-5 space-y-4 text-xs"
                >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <h3 className="text-base font-extrabold text-[#11161B]">
                            Naujo tiekėjo ir dilerio kainodaros registracija
                        </h3>
                        <div className="flex flex-wrap gap-1.5">
                            {[
                                {
                                    label: 'Dražice (Čekija, -38%)',
                                    name: 'Dražice (DZ Dražice)',
                                    country: 'Čekija (CZ)',
                                    email: 'export@dzd.cz',
                                    discount: 38,
                                    margin: 24,
                                    prefix: 'DRZ-OKC',
                                    note: 'Dražice OKC NTR/BP kombinuoti ir netiesioginio šildymo boileriai.',
                                },
                                {
                                    label: 'Grundfos (-42%)',
                                    name: 'Grundfos Pumps Baltic',
                                    country: 'Danija / Lietuva',
                                    email: 'info-lt@grundfos.com',
                                    discount: 42,
                                    margin: 25,
                                    prefix: 'GRF-ALPHA',
                                    note: 'Grundfos ALPHA2, ALPHA3, UPS ir MAGNA3 cirkuliaciniai siurbliai.',
                                },
                                {
                                    label: 'Flamco / Meibes (-44%)',
                                    name: 'Flamco / Aalberts Hydronic',
                                    country: 'Nyderlandai (NL)',
                                    email: 'baltic@flamcogroup.com',
                                    discount: 44,
                                    margin: 26,
                                    prefix: 'FLM-',
                                    note: 'Flexcon plėtimosi indai, Flamcovent oro separatoriai, Meibes pamaišymo grupės.',
                                },
                            ].map((preset) => (
                                <button
                                    key={preset.label}
                                    type="button"
                                    onClick={() => {
                                        setSupName(preset.name);
                                        setSupCountry(preset.country);
                                        setSupEmail(preset.email);
                                        setSupDiscountPct(preset.discount);
                                        setSupTargetMarginPct(preset.margin);
                                        setSupSkuPrefix(preset.prefix);
                                        setSupFeedNote(preset.note);
                                    }}
                                    className="h-8 px-2.5 rounded-lg border border-[#D5CFC3] bg-[#FAF9F6] text-[#11161B] font-semibold cursor-pointer"
                                >
                                    Užpildyti: {preset.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        <label className="flex flex-col gap-1 font-semibold">
                            Tiekėjo pavadinimas *
                            <input
                                type="text"
                                required
                                value={supName}
                                onChange={(e) => setSupName(e.target.value)}
                                placeholder="Pvz.: Dražice / Viessmann / Grundfos"
                                className="h-10 px-3 rounded-lg border border-[#D5CFC3] bg-[#FAF9F6]"
                            />
                        </label>
                        <label className="flex flex-col gap-1 font-semibold">
                            Šalis / Regionas
                            <input
                                type="text"
                                value={supCountry}
                                onChange={(e) => setSupCountry(e.target.value)}
                                className="h-10 px-3 rounded-lg border border-[#D5CFC3] bg-[#FAF9F6]"
                            />
                        </label>
                        <label className="flex flex-col gap-1 font-semibold">
                            B2B kontaktinis el. paštas
                            <input
                                type="email"
                                value={supEmail}
                                onChange={(e) => setSupEmail(e.target.value)}
                                className="h-10 px-3 rounded-lg border border-[#D5CFC3] bg-[#FAF9F6]"
                            />
                        </label>
                        <label className="flex flex-col gap-1 font-semibold">
                            Valiuta ir tiekimo terminas
                            <div className="grid grid-cols-2 gap-2">
                                <input
                                    type="text"
                                    value={supCurrency}
                                    onChange={(e) => setSupCurrency(e.target.value)}
                                    className="h-10 px-2.5 rounded-lg border border-[#D5CFC3] bg-[#FAF9F6] font-mono"
                                />
                                <input
                                    type="text"
                                    value={supLeadTime}
                                    onChange={(e) => setSupLeadTime(e.target.value)}
                                    placeholder="2–4 d. d."
                                    className="h-10 px-2.5 rounded-lg border border-[#D5CFC3] bg-[#FAF9F6]"
                                />
                            </div>
                        </label>
                        <label className="flex flex-col gap-1 font-semibold">
                            Tiekėjo nuolaida nuo bazinio kainyno (%)
                            <input
                                type="number"
                                min={0}
                                max={85}
                                value={supDiscountPct}
                                onChange={(e) => setSupDiscountPct(Number(e.target.value))}
                                className="h-10 px-3 rounded-lg border border-[#D5CFC3] bg-[#FAF9F6] font-bold"
                            />
                        </label>
                        <label className="flex flex-col gap-1 font-semibold">
                            Tikslinė marža % (min. 15% saugiklis)
                            <input
                                type="number"
                                min={15}
                                max={80}
                                value={supTargetMarginPct}
                                onChange={(e) => setSupTargetMarginPct(Number(e.target.value))}
                                className="h-10 px-3 rounded-lg border border-[#D5CFC3] bg-[#FAF9F6] font-bold"
                            />
                        </label>
                        <label className="flex flex-col gap-1 font-semibold">
                            SKU prefiksas ir formatas
                            <div className="grid grid-cols-2 gap-2">
                                <input
                                    type="text"
                                    value={supSkuPrefix}
                                    onChange={(e) => setSupSkuPrefix(e.target.value)}
                                    placeholder="DRZ-"
                                    className="h-10 px-2.5 rounded-lg border border-[#D5CFC3] bg-[#FAF9F6] font-mono"
                                />
                                <input
                                    type="text"
                                    value={supFeedFormat}
                                    onChange={(e) => setSupFeedFormat(e.target.value)}
                                    placeholder="CSV / XLSX"
                                    className="h-10 px-2.5 rounded-lg border border-[#D5CFC3] bg-[#FAF9F6]"
                                />
                            </div>
                        </label>
                        <label className="flex flex-col gap-1 font-semibold">
                            Būsena
                            <select
                                value={supEnabled ? 'active' : 'paused'}
                                onChange={(e) => setSupEnabled(e.target.value === 'active')}
                                className="h-10 px-3 rounded-lg border border-[#D5CFC3] bg-[#FAF9F6] font-semibold"
                            >
                                <option value="active">Aktyvus (Sinchronizuojamas)</option>
                                <option value="paused">Sustabdytas</option>
                            </select>
                        </label>
                    </div>

                    <label className="flex flex-col gap-1 font-semibold">
                        Kainoraščio šaltinis / pastabos (URL, failo šablonas ar produktų grupės)
                        <input
                            type="text"
                            value={supFeedNote}
                            onChange={(e) => setSupFeedNote(e.target.value)}
                            className="h-10 px-3 rounded-lg border border-[#D5CFC3] bg-[#FAF9F6]"
                        />
                    </label>

                    <div className="flex flex-wrap gap-2">
                        <button
                            type="submit"
                            className="h-10 px-4 rounded-lg bg-[#157A3B] hover:bg-[#0F5A2B] text-white font-bold inline-flex items-center gap-1.5 cursor-pointer"
                        >
                            <Check className="w-4 h-4" />
                            <span>Išsaugoti tiekėją registre</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setShowAddSupplier(false)}
                            className="h-10 px-3.5 rounded-lg border border-[#D5CFC3] bg-white text-[#11161B] font-semibold cursor-pointer"
                        >
                            Atšaukti
                        </button>
                    </div>
                </form>
            )}

            {/* 2. Interactive Pricelist Importer */}
            <form
                data-testid="admin-supplier-pricelist-import"
                onSubmit={handleImportPricelist}
                className={`rounded-2xl border border-[#E2DDD3] bg-white p-5 space-y-4 text-xs ${
                    showPricelistImporter ? 'block' : 'block'
                }`}
            >
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                        <span className="font-mono font-bold text-[#C2410C] block">
                            INTERAKTYVUS KAINORAŠČIO IMPORTAS (CSV / TSV / JSON) SU AUTOMATINE SAVIKAINOS IR MARŽOS FORMULE
                        </span>
                        <h3 className="text-base font-extrabold text-[#11161B]">
                            Importuoti tiekėjo kainoraščio eilutes tiesiai į el. parduotuvės vitriną (/lt/products)
                        </h3>
                    </div>
                    <label className="h-9 px-3 rounded-lg border border-[#D5CFC3] bg-[#FAF9F6] hover:border-[#11161B] text-[#11161B] font-semibold inline-flex items-center gap-1.5 cursor-pointer">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Įkelti .CSV / .JSON failą</span>
                        <input
                            type="file"
                            accept=".csv,.tsv,.txt,.json"
                            onChange={handleFileUpload}
                            className="hidden"
                        />
                    </label>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-start">
                    <div className="lg:col-span-4 space-y-2">
                        <label className="flex flex-col gap-1 font-semibold">
                            Pasirinkite tiekėją (pagal jį pritaikoma dilerio nuolaida ir marža)
                            <select
                                value={importSupplierId}
                                onChange={(e) => setImportSupplierId(e.target.value)}
                                className="h-10 px-3 rounded-lg border border-[#D5CFC3] bg-[#FAF9F6] font-semibold"
                            >
                                {suppliers.map((s) => (
                                    <option key={s.id} value={s.id}>
                                        {s.name} (Nuolaida -{s.dealerDiscountPct}% · Marža {s.targetMarginPct}%)
                                    </option>
                                ))}
                            </select>
                        </label>
                        <p className="text-[#5B6470] leading-relaxed">
                            Formulė: <strong>Savikaina = Bazinė kaina × (1 - Nuolaida%)</strong>. Mažmeninė kaina apskaičiuojama pritaikius tikslinę maržą (apsaugota &gt;=15% maržos grindimis) ir +21% PVM.
                        </p>
                    </div>

                    <div className="lg:col-span-8 space-y-2">
                        <label className="flex flex-col gap-1 font-semibold">
                            Kainoraščio eilutės (Formatas: SKU; Pavadinimas; Bazinė kaina € be PVM; Likutis; Kategorija)
                            <textarea
                                rows={3}
                                value={importRawText}
                                onChange={(e) => setImportRawText(e.target.value)}
                                className="p-3 rounded-lg border border-[#D5CFC3] bg-[#FAF9F6] font-mono text-xs"
                            />
                        </label>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="text-[#5B6470]">
                                Importuotos prekės automatiškai įrašomos į <code className="font-mono">catalog-overrides.json</code> ir tampa matomos vitrinoje.
                            </span>
                            <button
                                type="submit"
                                className="h-10 px-4 rounded-lg bg-[#11161B] hover:bg-[#C2410C] text-white font-bold inline-flex items-center gap-1.5 cursor-pointer"
                            >
                                <Upload className="w-4 h-4" />
                                <span>Skaičiuoti savikainą ir importuoti į vitriną</span>
                            </button>
                        </div>
                    </div>
                </div>

                {importedPreview.length > 0 && (
                    <div className="rounded-xl border border-[#E2DDD3] bg-[#FAF9F6] p-3.5 space-y-2">
                        <strong className="text-[#0F5A2B] block">
                            Importuota ir paskelbta vitrinoje ({importedPreview.length} SKU):
                        </strong>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                            {importedPreview.map((item) => (
                                <div
                                    key={item.sku}
                                    className="rounded-lg border border-[#E2DDD3] bg-white p-2.5 space-y-0.5"
                                >
                                    <span className="font-mono font-bold text-[#C2410C] block">
                                        {item.sku} · Marža {item.marginPct.toFixed(1)}%
                                    </span>
                                    <span className="font-semibold text-[#11161B] block truncate">
                                        {item.name}
                                    </span>
                                    <span className="text-[#5B6470] block">
                                        Bazė: {item.basePriceEur.toFixed(2)} € → Savikaina (-{item.dealerDiscountPct}%): <strong>{item.costEur.toFixed(2)} €</strong> → Mažmena su PVM: <strong>{item.priceGrossEur.toFixed(2)} €</strong> (Likutis: {item.stockQuantity} vnt.)
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </form>

            {/* 3. Dynamic Supplier Cards with Inline Discount / Margin Controls & 1-Click Sync */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {suppliers.map((pl) => {
                    const draft = draftSupplierParams[pl.id] || {
                        dealerDiscountPct: pl.dealerDiscountPct,
                        targetMarginPct: pl.targetMarginPct,
                        enabled: pl.enabled,
                    };
                    return (
                        <div
                            key={pl.id}
                            className="rounded-2xl border border-[#E2DDD3] bg-white p-5 space-y-3 text-xs flex flex-col justify-between"
                        >
                            <div className="space-y-2">
                                <div className="flex items-center justify-between gap-2">
                                    <span className="font-mono font-bold text-[#C2410C]">
                                        {pl.skuCount.toLocaleString('lt-LT')} poz. · {pl.skuPrefix}
                                    </span>
                                    <span
                                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold ${
                                            draft.enabled
                                                ? 'bg-[#E3F1E8] text-[#0F5A2B]'
                                                : 'bg-[#FBEADF] text-[#8A2F07]'
                                        }`}
                                    >
                                        <ShieldCheck className="w-3.5 h-3.5" />
                                        {draft.enabled ? 'Aktyvus' : 'Sustabdytas'}
                                    </span>
                                </div>
                                <h3 className="text-base font-extrabold text-[#11161B]">
                                    {pl.name}
                                </h3>
                                <p className="font-mono text-[#5B6470] truncate">
                                    {pl.sourceFile} · {pl.country} · {pl.leadTimeDays}
                                </p>
                                <p className="text-[#5B6470]">{pl.feedUrlOrNote}</p>
                            </div>

                            <div className="space-y-2.5 pt-2 border-t border-[#E2DDD3]">
                                <div className="grid grid-cols-2 gap-2">
                                    <label className="flex flex-col gap-0.5 font-semibold text-[#5B6470]">
                                        Dilerio nuolaida (%)
                                        <input
                                            type="number"
                                            min={0}
                                            max={85}
                                            value={draft.dealerDiscountPct}
                                            onChange={(e) =>
                                                setDraftSupplierParams((prev) => ({
                                                    ...prev,
                                                    [pl.id]: {
                                                        ...draft,
                                                        dealerDiscountPct: Number(e.target.value),
                                                    },
                                                }))
                                            }
                                            className="h-8 px-2 rounded-lg border border-[#D5CFC3] bg-[#FAF9F6] font-bold text-[#11161B]"
                                        />
                                    </label>
                                    <label className="flex flex-col gap-0.5 font-semibold text-[#5B6470]">
                                        Tikslinė marža (%)
                                        <input
                                            type="number"
                                            min={15}
                                            max={80}
                                            value={draft.targetMarginPct}
                                            onChange={(e) =>
                                                setDraftSupplierParams((prev) => ({
                                                    ...prev,
                                                    [pl.id]: {
                                                        ...draft,
                                                        targetMarginPct: Number(e.target.value),
                                                    },
                                                }))
                                            }
                                            className="h-8 px-2 rounded-lg border border-[#D5CFC3] bg-[#FAF9F6] font-bold text-[#11161B]"
                                        />
                                    </label>
                                </div>

                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <button
                                        type="button"
                                        onClick={() => handleSaveInlineSupplier(pl)}
                                        className="h-8 px-3 rounded-lg border border-[#D5CFC3] bg-[#FAF9F6] hover:border-[#11161B] font-bold text-[#11161B] cursor-pointer"
                                    >
                                        Išsaugoti %
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleSyncSupplierNow(pl.id)}
                                        className="h-8 px-3 rounded-lg bg-[#11161B] hover:bg-[#C2410C] text-white font-bold inline-flex items-center gap-1 cursor-pointer"
                                    >
                                        <RefreshCw className="w-3.5 h-3.5" />
                                        <span>Sinchronizuoti kainyną</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export function GilesAdminAiAgentsCommandCenter() {
    const [agents, setAgents] = useState<GilesActiveAiAgent[]>([]);
    const [logs, setLogs] = useState<GilesAiAgentLogEntry[]>([]);
    const [selectedAgentId, setSelectedAgentId] = useState<string>('vytautas-consultant');
    const [logFilter, setLogFilter] = useState<string>('all');
    const [showAddByoAgent, setShowAddByoAgent] = useState(false);
    const [notice, setNotice] = useState('');

    // Editable fields for the selected agent
    const [editProvider, setEditProvider] = useState<AiAgentProvider>('xAI Grok');
    const [editEndpoint, setEditEndpoint] = useState('');
    const [editApiKey, setEditApiKey] = useState('');
    const [editModelId, setEditModelId] = useState('');
    const [editTemp, setEditTemp] = useState(0.2);
    const [editMinMargin, setEditMinMargin] = useState(15);
    const [editSystemPrompt, setEditSystemPrompt] = useState('');

    // New BYO AI Agent form state
    const [newAgentName, setNewAgentName] = useState('');
    const [newAgentRole, setNewAgentRole] = useState('');
    const [newAgentProvider, setNewAgentProvider] =
        useState<AiAgentProvider>('Anthropic Claude');
    const [newAgentEndpoint, setNewAgentEndpoint] = useState(
        'https://api.anthropic.com/v1/messages',
    );
    const [newAgentApiKey, setNewAgentApiKey] = useState('');
    const [newAgentModel, setNewAgentModel] = useState('claude-sonnet-4-20250514');
    const [newAgentTemp, setNewAgentTemp] = useState(0.2);
    const [newAgentMode, setNewAgentMode] =
        useState<AiAgentExecutionMode>('proposal_only');
    const [newAgentMinMargin, setNewAgentMinMargin] = useState(15);
    const [newAgentPrompt, setNewAgentPrompt] = useState(
        'Veik kaip UAB „Gilės inžinerija“ techninis AI agentas. Laikykis >=15% maržos grindų ir EN 12831 standartų.',
    );

    // Engineer reply drafts for unanswered queries
    const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});

    const syncSelectedAgentForm = (ag: GilesActiveAiAgent) => {
        setEditProvider(ag.provider);
        setEditEndpoint(ag.apiEndpointUrl);
        setEditApiKey('');
        setEditModelId(ag.modelId);
        setEditTemp(ag.temperature);
        setEditMinMargin(ag.guardrailMinMarginPct);
        setEditSystemPrompt(ag.systemPrompt);
    };

    const fetchAgentsAndLogs = async (filterVal = logFilter) => {
        try {
            const res = await fetch(
                assetUrl(`/api/admin/agents?logFilter=${encodeURIComponent(filterVal)}`),
            );
            const data = await res.json();
            if (data?.ok) {
                if (Array.isArray(data.agents)) {
                    setAgents(data.agents);
                    const found =
                        (data.agents as GilesActiveAiAgent[]).find(
                            (a) => a.id === selectedAgentId,
                        ) || data.agents[0];
                    if (found) {
                        syncSelectedAgentForm(found);
                    }
                }
                if (Array.isArray(data.logs)) {
                    setLogs(data.logs);
                }
            }
        } catch {
            // ignore
        }
    };

    useEffect(() => {
        fetchAgentsAndLogs('all');
    }, []);

    const selectedAgent =
        agents.find((a) => a.id === selectedAgentId) || agents[0] || null;

    const handleToggleMode = async (
        agentId: string,
        nextMode?: AiAgentExecutionMode,
    ) => {
        try {
            const res = await fetch(assetUrl('/api/admin/agents'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'toggle_agent_mode',
                    agentId,
                    executionMode: nextMode,
                }),
            });
            const data = await res.json();
            if (data?.ok && data.agent) {
                setNotice(
                    `Agento „${data.agent.name}“ būsena pakeista į: ${data.agent.autonomyTier}.`,
                );
                if (Array.isArray(data.agents)) setAgents(data.agents);
                if (Array.isArray(data.logs)) setLogs(data.logs);
            }
        } catch {
            // ignore
        }
    };

    const handleSaveAgentConfig = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedAgent) return;
        try {
            const res = await fetch(assetUrl('/api/admin/agents'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'upsert_agent',
                    id: selectedAgent.id,
                    name: selectedAgent.name,
                    role: selectedAgent.role,
                    provider: editProvider,
                    apiEndpointUrl: editEndpoint,
                    apiKey: editApiKey.trim() || undefined,
                    modelId: editModelId,
                    temperature: editTemp,
                    guardrailMinMarginPct: Math.max(15, editMinMargin),
                    systemPrompt: editSystemPrompt,
                }),
            });
            const data = await res.json();
            if (data?.ok && data.agent) {
                setNotice(
                    `Išsaugoti agento „${data.agent.name}“ API nustatymai (${data.agent.provider} · ${data.agent.modelId}) ir sistemos promptas.`,
                );
                if (Array.isArray(data.agents)) setAgents(data.agents);
                setEditApiKey('');
            }
        } catch {
            // ignore
        }
    };

    const handleRunAgentNow = async (agentId: string) => {
        try {
            const res = await fetch(assetUrl('/api/admin/agents'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'test_run_agent',
                    agentId,
                }),
            });
            const data = await res.json();
            if (data?.ok && data.logEntry) {
                setNotice(
                    `Test Run įvykdytas: ${data.logEntry.responseOrAction}`,
                );
                if (Array.isArray(data.agents)) setAgents(data.agents);
                if (Array.isArray(data.logs)) setLogs(data.logs);
            }
        } catch {
            // ignore
        }
    };

    const handleAddByoAgent = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newAgentName.trim()) return;
        try {
            const res = await fetch(assetUrl('/api/admin/agents'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'upsert_agent',
                    name: newAgentName.trim(),
                    role: newAgentRole.trim() || 'Išorinis BYO API ŠVOK agentas',
                    provider: newAgentProvider,
                    apiEndpointUrl: newAgentEndpoint.trim(),
                    apiKey: newAgentApiKey.trim() || 'sk-byo-giles-api-key-2026',
                    modelId: newAgentModel.trim(),
                    temperature: newAgentTemp,
                    executionMode: newAgentMode,
                    guardrailMinMarginPct: Math.max(15, newAgentMinMargin),
                    systemPrompt: newAgentPrompt.trim(),
                }),
            });
            const data = await res.json();
            if (data?.ok && data.agent) {
                setNotice(
                    `Prijungtas naujas AI agentas „${data.agent.name}“ (${data.agent.provider}, raktas ${data.agent.maskedApiKey}).`,
                );
                if (Array.isArray(data.agents)) setAgents(data.agents);
                setSelectedAgentId(data.agent.id);
                syncSelectedAgentForm(data.agent);
                setShowAddByoAgent(false);
                setNewAgentName('');
                setNewAgentRole('');
                setNewAgentApiKey('');
            }
        } catch {
            // ignore
        }
    };

    const handleLoadSampleLogs = async () => {
        try {
            const res = await fetch(assetUrl('/api/admin/agents'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'load_sample_logs' }),
            });
            const data = await res.json();
            if (data?.ok && Array.isArray(data.logs)) {
                setLogs(data.logs);
                setNotice(
                    'Užkrauti agentų darbo ir Vytauto pokalbių žurnalo pavyzdžiai (atsakyti klientų klausimai ir inžinieriaus peržiūros laukiančios užklausos).',
                );
            }
        } catch {
            // ignore
        }
    };

    const handleResolveLog = async (logId: string) => {
        const reply =
            replyDrafts[logId] ||
            'Darius Šauklys patikslino techninę specifikaciją ir išsiuntė komercinį pasiūlymą klientui.';
        try {
            const res = await fetch(assetUrl('/api/admin/agents'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'resolve_log_entry',
                    logId,
                    engineerReply: reply,
                }),
            });
            const data = await res.json();
            if (data?.ok && Array.isArray(data.logs)) {
                setLogs(data.logs);
                setNotice(`Užklausa ${logId} pažymėta kaip ATSAKYTA.`);
            }
        } catch {
            // ignore
        }
    };

    return (
        <div data-testid="admin-ai-agents-command-center" className="space-y-6">
            {/* Header + Bring Your Own API Agent button */}
            <div className="rounded-2xl border border-[#E2DDD3] bg-white p-5 sm:p-6 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <span className="text-xs font-bold text-[#C2410C] block">
                            JOKIO „BLACK BOX“ · SKAIDRUS AI AGENTŲ IR SAVO API (BYO-API) VALDYMO CENTRAS
                        </span>
                        <h2 className="text-xl sm:text-2xl font-extrabold text-[#11161B]">
                            AI Agentų Instrukcijos, Promptų Redaktorius, Įjungimas/Išjungimas ir Pokalbių Žurnalas ({agents.length})
                        </h2>
                        <p className="text-xs text-[#5B6470]">
                            Matykite kaip dirba kiekvienas agentas, kokius duomenis ir formules naudoja, keiskite API raktus (xAI Grok, Claude, OpenAI, Gemini, Ollama) ir tikrinkite visus atsakytus bei neatsakytus klientų klausimus.
                        </p>
                    </div>
                    <button
                        type="button"
                        data-testid="admin-add-ai-agent-btn"
                        onClick={() => setShowAddByoAgent((prev) => !prev)}
                        className="h-11 px-4 rounded-lg bg-[#C2410C] hover:bg-[#9A3412] text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                    >
                        <Plus className="w-4 h-4" />
                        <span>+ Prijungti savo AI agentą / Išorinį API</span>
                    </button>
                </div>

                {notice && (
                    <div className="rounded-xl bg-[#E3F1E8] text-[#0F5A2B] p-3.5 text-xs font-bold">
                        {notice}
                    </div>
                )}

                {/* Bring Your Own AI Agent / API Form */}
                {showAddByoAgent && (
                    <form
                        onSubmit={handleAddByoAgent}
                        className="rounded-xl border border-[#D5CFC3] bg-[#FAF9F6] p-4 space-y-4 text-xs"
                    >
                        <h3 className="text-sm font-extrabold text-[#11161B]">
                            Prijungti naują AI agentą arba išorinį LLM / Webhook API („Bring Your Own API“)
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                            <label className="flex flex-col gap-1 font-semibold">
                                Agento pavadinimas *
                                <input
                                    type="text"
                                    required
                                    value={newAgentName}
                                    onChange={(e) => setNewAgentName(e.target.value)}
                                    placeholder="Pvz.: Grundfos Hidraulikos Agentas"
                                    className="h-10 px-3 rounded-lg border border-[#D5CFC3] bg-white"
                                />
                            </label>
                            <label className="flex flex-col gap-1 font-semibold">
                                Paskirtis / Rolė
                                <input
                                    type="text"
                                    value={newAgentRole}
                                    onChange={(e) => setNewAgentRole(e.target.value)}
                                    placeholder="Siurblių ir balansinių vožtuvų atranka"
                                    className="h-10 px-3 rounded-lg border border-[#D5CFC3] bg-white"
                                />
                            </label>
                            <label className="flex flex-col gap-1 font-semibold">
                                AI Tiekėjas (Provider)
                                <select
                                    value={newAgentProvider}
                                    onChange={(e) =>
                                        setNewAgentProvider(e.target.value as AiAgentProvider)
                                    }
                                    className="h-10 px-3 rounded-lg border border-[#D5CFC3] bg-white font-semibold"
                                >
                                    <option value="xAI Grok">xAI Grok</option>
                                    <option value="Anthropic Claude">Anthropic Claude</option>
                                    <option value="OpenAI GPT">OpenAI GPT</option>
                                    <option value="OpenRouter">OpenRouter</option>
                                    <option value="Google Gemini">Google Gemini</option>
                                    <option value="Custom Webhook / REST API">
                                        Custom Webhook / REST API
                                    </option>
                                    <option value="Local Ollama / vLLM">Local Ollama / vLLM</option>
                                </select>
                            </label>
                            <label className="flex flex-col gap-1 font-semibold">
                                Modelio ID
                                <input
                                    type="text"
                                    value={newAgentModel}
                                    onChange={(e) => setNewAgentModel(e.target.value)}
                                    placeholder="claude-sonnet-4-20250514 / grok-4"
                                    className="h-10 px-3 rounded-lg border border-[#D5CFC3] bg-white font-mono"
                                />
                            </label>
                            <label className="flex flex-col gap-1 font-semibold sm:col-span-2">
                                API Endpoint URL
                                <input
                                    type="text"
                                    value={newAgentEndpoint}
                                    onChange={(e) => setNewAgentEndpoint(e.target.value)}
                                    className="h-10 px-3 rounded-lg border border-[#D5CFC3] bg-white font-mono"
                                />
                            </label>
                            <label className="flex flex-col gap-1 font-semibold">
                                API Raktas (bus saugomas užmaskuotas)
                                <input
                                    type="password"
                                    value={newAgentApiKey}
                                    onChange={(e) => setNewAgentApiKey(e.target.value)}
                                    placeholder="sk-ant-... arba xai-..."
                                    className="h-10 px-3 rounded-lg border border-[#D5CFC3] bg-white font-mono"
                                />
                            </label>
                            <label className="flex flex-col gap-1 font-semibold">
                                Vykdymo režimas ir min. marža (%)
                                <div className="grid grid-cols-2 gap-2">
                                    <select
                                        value={newAgentMode}
                                        onChange={(e) =>
                                            setNewAgentMode(
                                                e.target.value as AiAgentExecutionMode,
                                            )
                                        }
                                        className="h-10 px-2 rounded-lg border border-[#D5CFC3] bg-white font-semibold"
                                    >
                                        <option value="autonomous">ĮJUNGTAS</option>
                                        <option value="proposal_only">TIK PASIŪLYMAI</option>
                                        <option value="disabled">IŠJUNGTAS</option>
                                    </select>
                                    <input
                                        type="number"
                                        min={15}
                                        max={80}
                                        value={newAgentMinMargin}
                                        onChange={(e) =>
                                            setNewAgentMinMargin(Number(e.target.value))
                                        }
                                        className="h-10 px-2.5 rounded-lg border border-[#D5CFC3] bg-white font-bold"
                                    />
                                </div>
                            </label>
                        </div>

                        <label className="flex flex-col gap-1 font-semibold">
                            Sistemos Promptas ir sprendimų taisyklės
                            <textarea
                                rows={2}
                                value={newAgentPrompt}
                                onChange={(e) => setNewAgentPrompt(e.target.value)}
                                className="p-3 rounded-lg border border-[#D5CFC3] bg-white text-xs"
                            />
                        </label>

                        <div className="flex flex-wrap gap-2">
                            <button
                                type="submit"
                                className="h-10 px-4 rounded-lg bg-[#157A3B] hover:bg-[#0F5A2B] text-white font-bold inline-flex items-center gap-1.5 cursor-pointer"
                            >
                                <Check className="w-4 h-4" />
                                <span>Išsaugoti ir aktyvuoti BYO AI agentą</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowAddByoAgent(false)}
                                className="h-10 px-3.5 rounded-lg border border-[#D5CFC3] bg-white text-[#11161B] font-semibold cursor-pointer"
                            >
                                Uždaryti
                            </button>
                        </div>
                    </form>
                )}

                {/* BLOCK 1: Agent Registry Grid + 1-Click Mode Toggle */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {agents.map((ag) => {
                        const isSelected = selectedAgent?.id === ag.id;
                        const badgeClass =
                            ag.executionMode === 'autonomous'
                                ? 'bg-[#E3F1E8] text-[#0F5A2B]'
                                : ag.executionMode === 'proposal_only'
                                  ? 'bg-[#FFF1D6] text-[#7A4A00]'
                                  : 'bg-[#FBEADF] text-[#8A2F07]';
                        return (
                            <div
                                key={ag.id}
                                className={`rounded-xl border p-4 space-y-2.5 text-xs flex flex-col justify-between ${
                                    isSelected
                                        ? 'border-[#C2410C] bg-[#FAF9F6]'
                                        : 'border-[#E2DDD3] bg-[#FAF9F6]'
                                }`}
                            >
                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="font-mono font-bold text-[#C2410C]">
                                            {ag.code}
                                        </span>
                                        <span
                                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold ${badgeClass}`}
                                        >
                                            <ShieldCheck className="w-3.5 h-3.5" />
                                            {ag.executionMode === 'autonomous'
                                                ? 'ĮJUNGTAS (Aktyvus)'
                                                : ag.executionMode === 'proposal_only'
                                                  ? 'TIK PASIŪLYMAI'
                                                  : 'IŠJUNGTAS'}
                                        </span>
                                    </div>
                                    <h3 className="text-sm font-extrabold text-[#11161B]">
                                        {ag.name}
                                    </h3>
                                    <p className="text-[#5B6470]">{ag.description}</p>
                                    <p className="font-mono text-[11px] text-[#11161B]">
                                        API: <strong>{ag.provider}</strong> ({ag.modelId}) · Raktas: {ag.maskedApiKey}
                                    </p>
                                </div>

                                <div className="pt-2 border-t border-[#E2DDD3] flex flex-wrap items-center justify-between gap-2">
                                    <select
                                        aria-label={`Režimas ${ag.name}`}
                                        value={ag.executionMode}
                                        onChange={(e) =>
                                            handleToggleMode(
                                                ag.id,
                                                e.target.value as AiAgentExecutionMode,
                                            )
                                        }
                                        className="h-8 px-2 rounded-lg border border-[#D5CFC3] bg-white font-bold text-[#11161B]"
                                    >
                                        <option value="autonomous">ĮJUNGTAS (Aktyvus)</option>
                                        <option value="proposal_only">
                                            TIK PASIŪLYMAI (Patvirtinimas)
                                        </option>
                                        <option value="disabled">IŠJUNGTAS (Sustabdytas)</option>
                                    </select>

                                    <div className="flex items-center gap-1.5">
                                        <button
                                            type="button"
                                            data-testid="admin-agent-toggle-btn"
                                            onClick={() => handleToggleMode(ag.id)}
                                            className="h-8 px-2.5 rounded-lg border border-[#D5CFC3] bg-white hover:border-[#11161B] font-semibold text-[#11161B] cursor-pointer"
                                        >
                                            Perjungti
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSelectedAgentId(ag.id);
                                                syncSelectedAgentForm(ag);
                                            }}
                                            className="h-8 px-2.5 rounded-lg bg-[#11161B] hover:bg-[#C2410C] text-white font-bold cursor-pointer"
                                        >
                                            Instrukcija ir API
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* BLOCK 2 & BLOCK 3: Detailed Agent Instructions + Prompt / Rules / BYO-API Editor */}
            {selectedAgent && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* BLOCK 2: Detali Instrukcija */}
                    <div
                        data-testid="admin-agent-instructions-panel"
                        className="lg:col-span-5 rounded-2xl border border-[#E2DDD3] bg-white p-5 space-y-4 text-xs"
                    >
                        <div className="flex items-center gap-2 text-[#C2410C] font-bold">
                            <BookOpen className="w-4 h-4" />
                            <span>DETALI INSTRUKCIJA · KAIP DIRBA ŠIS AGENTAS</span>
                        </div>
                        <h3 className="text-base font-extrabold text-[#11161B]">
                            {selectedAgent.name}
                        </h3>
                        <p className="text-[#5B6470] leading-relaxed">
                            {selectedAgent.instructionsSummary}
                        </p>

                        <div className="space-y-1.5">
                            <strong className="text-[#11161B] block">
                                Žingsnis po žingsnio vykdymo algoritmas:
                            </strong>
                            <ul className="space-y-1.5 text-[#11161B]">
                                {selectedAgent.instructionsSteps.map((step) => (
                                    <li
                                        key={step}
                                        className="rounded-lg bg-[#FAF9F6] border border-[#E2DDD3] p-2.5"
                                    >
                                        {step}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="space-y-1">
                            <strong className="text-[#11161B] block">
                                Naudojami duomenų šaltiniai:
                            </strong>
                            <ul className="list-disc pl-4 text-[#5B6470] space-y-0.5 font-mono">
                                {selectedAgent.dataSourcesUsed.map((src) => (
                                    <li key={src}>{src}</li>
                                ))}
                            </ul>
                        </div>

                        <div className="space-y-1">
                            <strong className="text-[#11161B] block">
                                Saugikliai ir finansinės ribos:
                            </strong>
                            <ul className="list-disc pl-4 text-[#0F5A2B] font-semibold space-y-0.5">
                                {selectedAgent.safetyLimits.map((lim) => (
                                    <li key={lim}>{lim}</li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* BLOCK 3: Prompto, Taisyklių ir API Redaktorius + Test Run */}
                    <form
                        data-testid="admin-agent-config-editor"
                        onSubmit={handleSaveAgentConfig}
                        className="lg:col-span-7 rounded-2xl border border-[#E2DDD3] bg-white p-5 space-y-4 text-xs"
                    >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2 text-[#C2410C] font-bold">
                                <Sliders className="w-4 h-4" />
                                <span>PROMPTO, TAISYKLIŲ IR SAVO API REDAKTORIUS</span>
                            </div>
                            <button
                                type="button"
                                data-testid="admin-agent-run-now-btn"
                                onClick={() => handleRunAgentNow(selectedAgent.id)}
                                className="h-9 px-3.5 rounded-lg bg-[#157A3B] hover:bg-[#0F5A2B] text-white font-bold inline-flex items-center gap-1.5 cursor-pointer"
                            >
                                <Play className="w-3.5 h-3.5" />
                                <span>Paleisti agento patikrą dabar (Test Run)</span>
                            </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <label className="flex flex-col gap-1 font-semibold">
                                AI Tiekėjas (Provider)
                                <select
                                    value={editProvider}
                                    onChange={(e) =>
                                        setEditProvider(e.target.value as AiAgentProvider)
                                    }
                                    className="h-10 px-3 rounded-lg border border-[#D5CFC3] bg-[#FAF9F6] font-semibold"
                                >
                                    <option value="xAI Grok">xAI Grok</option>
                                    <option value="Anthropic Claude">Anthropic Claude</option>
                                    <option value="OpenAI GPT">OpenAI GPT</option>
                                    <option value="OpenRouter">OpenRouter</option>
                                    <option value="Google Gemini">Google Gemini</option>
                                    <option value="Custom Webhook / REST API">
                                        Custom Webhook / REST API
                                    </option>
                                    <option value="Local Ollama / vLLM">Local Ollama / vLLM</option>
                                </select>
                            </label>
                            <label className="flex flex-col gap-1 font-semibold">
                                Modelio ID
                                <input
                                    type="text"
                                    value={editModelId}
                                    onChange={(e) => setEditModelId(e.target.value)}
                                    className="h-10 px-3 rounded-lg border border-[#D5CFC3] bg-[#FAF9F6] font-mono"
                                />
                            </label>
                            <label className="flex flex-col gap-1 font-semibold">
                                API Endpoint URL
                                <input
                                    type="text"
                                    value={editEndpoint}
                                    onChange={(e) => setEditEndpoint(e.target.value)}
                                    className="h-10 px-3 rounded-lg border border-[#D5CFC3] bg-[#FAF9F6] font-mono"
                                />
                            </label>
                            <label className="flex flex-col gap-1 font-semibold">
                                Naujas API Raktas (dabartinis: {selectedAgent.maskedApiKey})
                                <input
                                    type="password"
                                    value={editApiKey}
                                    onChange={(e) => setEditApiKey(e.target.value)}
                                    placeholder="Įveskite naują raktą pakeitimui..."
                                    className="h-10 px-3 rounded-lg border border-[#D5CFC3] bg-[#FAF9F6] font-mono"
                                />
                            </label>
                            <label className="flex flex-col gap-1 font-semibold">
                                Temperatūra (0.0 – 1.0)
                                <input
                                    type="number"
                                    step="0.05"
                                    min={0}
                                    max={1}
                                    value={editTemp}
                                    onChange={(e) => setEditTemp(Number(e.target.value))}
                                    className="h-10 px-3 rounded-lg border border-[#D5CFC3] bg-[#FAF9F6] font-bold"
                                />
                            </label>
                            <label className="flex flex-col gap-1 font-semibold">
                                Minimalios maržos grindys (%)
                                <input
                                    type="number"
                                    min={15}
                                    max={80}
                                    value={editMinMargin}
                                    onChange={(e) => setEditMinMargin(Number(e.target.value))}
                                    className="h-10 px-3 rounded-lg border border-[#D5CFC3] bg-[#FAF9F6] font-bold"
                                />
                            </label>
                        </div>

                        <label className="flex flex-col gap-1 font-semibold">
                            Agento Sistemos Promptas (Instrukcija modeliui)
                            <textarea
                                rows={4}
                                value={editSystemPrompt}
                                onChange={(e) => setEditSystemPrompt(e.target.value)}
                                className="p-3 rounded-lg border border-[#D5CFC3] bg-[#FAF9F6] text-xs leading-relaxed"
                            />
                        </label>

                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="text-[#5B6470]">
                                Paskutinis vykdymas: <strong>{selectedAgent.lastRunAt}</strong> · MCP teisės: <code className="font-mono">{selectedAgent.allowedMcpScopes.join(', ')}</code>
                            </span>
                            <button
                                type="submit"
                                className="h-10 px-4 rounded-lg bg-[#11161B] hover:bg-[#C2410C] text-white font-bold inline-flex items-center gap-1.5 cursor-pointer"
                            >
                                <Check className="w-4 h-4" />
                                <span>Išsaugoti promptą ir API konfigūraciją</span>
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* BLOCK 4: Pilnas Agentų Veiksmų ir Pokalbių Žurnalas ("Ką darė, kam atsakė / neatsakė") */}
            <div
                data-testid="admin-ai-agent-logs"
                className="rounded-2xl border border-[#E2DDD3] bg-white p-5 sm:p-6 space-y-4 text-xs"
            >
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <div className="flex items-center gap-2 text-[#C2410C] font-bold">
                            <Activity className="w-4 h-4" />
                            <span>PILNAS AGENTŲ VEIKSMŲ IR POKALBIŲ ŽURNALAS (AUDIT LOG)</span>
                        </div>
                        <h3 className="text-lg font-extrabold text-[#11161B]">
                            Ką agentai darė, kam Vytautas atsakė ir kokie klausimai laukia inžinieriaus peržiūros ({logs.length})
                        </h3>
                    </div>
                    <button
                        type="button"
                        onClick={handleLoadSampleLogs}
                        className="h-9 px-3.5 rounded-lg border border-[#D5CFC3] bg-[#FAF9F6] hover:border-[#11161B] text-[#11161B] font-bold cursor-pointer"
                    >
                        Užkrauti agentų darbo ir pokalbių žurnalo pavyzdžius (patikrai)
                    </button>
                </div>

                {/* Filter buttons */}
                <div className="flex flex-wrap gap-2">
                    {[
                        { id: 'all', label: 'Visi įrašai' },
                        {
                            id: 'vytautas_answered',
                            label: 'Atsakyta klientui (Vytautas)',
                        },
                        {
                            id: 'unanswered',
                            label: 'Neatsakyta / Reikia inžinieriaus peržiūros',
                        },
                        {
                            id: 'pricing_inventory',
                            label: 'Kainodaros / Atsargų veiksmai',
                        },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => {
                                setLogFilter(tab.id);
                                fetchAgentsAndLogs(tab.id);
                            }}
                            className={`h-9 px-3 rounded-lg font-bold border cursor-pointer ${
                                logFilter === tab.id
                                    ? 'bg-[#11161B] text-white border-[#11161B]'
                                    : 'bg-[#FAF9F6] text-[#11161B] border-[#D5CFC3]'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Stacked responsive log rows */}
                <div className="space-y-3">
                    {logs
                        .filter((entry) => {
                            if (logFilter === 'vytautas_answered') {
                                return (
                                    entry.status === 'ATSAKYTA' ||
                                    entry.category === 'vytautas_chat'
                                );
                            }
                            if (logFilter === 'unanswered') {
                                return (
                                    entry.status ===
                                    'NEATSAKYTA / PERDUOTA INŽINIERIUI'
                                );
                            }
                            if (logFilter === 'pricing_inventory') {
                                return (
                                    entry.category === 'pricing_inventory' ||
                                    entry.status === 'PRITAIKYTA'
                                );
                            }
                            return true;
                        })
                        .map((entry) => {
                        const isUnanswered =
                            entry.status === 'NEATSAKYTA / PERDUOTA INŽINIERIUI';
                        return (
                            <div
                                key={entry.id}
                                className="rounded-xl border border-[#E2DDD3] bg-[#FAF9F6] p-4 space-y-2.5"
                            >
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="font-mono font-bold text-[#5B6470]">
                                            {entry.timestamp}
                                        </span>
                                        <span className="font-bold text-[#C2410C]">
                                            {entry.agentName}
                                        </span>
                                        {entry.recommendedSkus.length > 0 && (
                                            <span className="font-mono text-[#11161B] bg-white px-2 py-0.5 rounded border border-[#E2DDD3]">
                                                SKU: {entry.recommendedSkus.join(', ')}
                                            </span>
                                        )}
                                    </div>
                                    <span
                                        className={`px-2.5 py-0.5 rounded-full font-bold ${
                                            isUnanswered
                                                ? 'bg-[#FFF1D6] text-[#7A4A00]'
                                                : 'bg-[#E3F1E8] text-[#0F5A2B]'
                                        }`}
                                    >
                                        {entry.status}
                                    </span>
                                </div>

                                <div className="font-bold text-[#11161B] text-sm">
                                    {entry.callerOrEvent}
                                </div>
                                <p className="text-[#5B6470] leading-relaxed">
                                    {entry.responseOrAction}
                                </p>

                                {isUnanswered && (
                                    <div className="pt-2 border-t border-[#E2DDD3] flex flex-col sm:flex-row gap-2">
                                        <input
                                            type="text"
                                            value={replyDrafts[entry.id] ?? ''}
                                            onChange={(e) =>
                                                setReplyDrafts((prev) => ({
                                                    ...prev,
                                                    [entry.id]: e.target.value,
                                                }))
                                            }
                                            placeholder="Įrašykite inžinieriaus Dariaus atsakymą arba sąmatos komentarą..."
                                            className="flex-1 h-9 px-3 rounded-lg border border-[#D5CFC3] bg-white"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => handleResolveLog(entry.id)}
                                            className="h-9 px-3.5 rounded-lg bg-[#157A3B] hover:bg-[#0F5A2B] text-white font-bold cursor-pointer whitespace-nowrap"
                                        >
                                            Patvirtinti atsakymą (Pažymėti ATSAKYTA)
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
