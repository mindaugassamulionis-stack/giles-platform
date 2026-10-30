'use client';

import { useState } from 'react';
import { FileSpreadsheet, Printer, CheckCircle2, EyeOff } from 'lucide-react';
import { useCartStore } from '../store/cart';
import { type B2BQuickOrderResolvedRow } from '../lib/giles-masterpiece-data';
import { calculateB2BLineItemPrice } from '../lib/b2b-pricing-engine';

const KNOWN_B2B_BOM_CATALOG: Record<
    string,
    { title: string; brandName: string; retailGrossEur: number; stockLabel: string }
> = {
    '013G0014': {
        title: 'Danfoss RA-N 15 tiesus termostatinis vožtuvas DN15',
        brandName: 'Danfoss',
        retailGrossEur: 18.5,
        stockLabel: 'Sandėlyje Kaune (140+ vnt.)',
    },
    'POL./80-500': {
        title: 'Aliumininis radiatorius Fondital Calidor Super 500/80 (1 сек.)',
        brandName: 'Fondital',
        retailGrossEur: 14.2,
        stockLabel: 'Sandėlyje Kaune (320+ sekc.)',
    },
    '013G2970': {
        title: 'Termostatinė galvutė Danfoss Redia M30x1.5 su skystiniu jutikliu',
        brandName: 'Danfoss',
        retailGrossEur: 24.9,
        stockLabel: 'Sandėlyje Kaune (85+ vnt.)',
    },
    '013G2990': {
        title: 'Termostatinė galvutė Danfoss RA 2990 su fiksacija',
        brandName: 'Danfoss',
        retailGrossEur: 26.8,
        stockLabel: 'Sandėlyje Kaune (95+ vnt.)',
    },
    'MPB-NANI-35': {
        title: 'Granulių degiklio komplektas Megatherm MPB NANI 35 (8–35 kW)',
        brandName: 'Gilės Inžinerija / Megatherm',
        retailGrossEur: 2350.0,
        stockLabel: 'Sandėlyje Kaune (6 kompl.)',
    },
    'ZV-100': {
        title: 'Katilas Gilės ZV 100 su automatiniu šilumokaičio valymu',
        brandName: 'Gilės Inžinerija',
        retailGrossEur: 4890.0,
        stockLabel: 'Sandėlyje Kaune (2 vnt.)',
    },
    'GI-FERROLI-001': {
        title: 'Radiatoriaus montavimo komplektas 1"x1/2" su nuorintoju ir kronšteinais',
        brandName: 'Gilės Inžinerija',
        retailGrossEur: 14.9,
        stockLabel: 'Sandėlyje Kaune (200+ kompl.)',
    },
};

export function parseAndMatchBulkBomLines(
    rawText: string,
    accountId?: string | null,
    defaultDiscountPct = 45,
): B2BQuickOrderResolvedRow[] {
    if (!rawText || !rawText.trim()) return [];

    return rawText
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line, idx) => {
            const parts = line
                .split(/[\t,;]+|\s+/)
                .map((p) => p.trim())
                .filter(Boolean);
            const rawCode = (parts[0] || '').toUpperCase();
            const parsedQty = Number(parts[parts.length - 1]);
            const qty =
                parts.length > 1 && Number.isFinite(parsedQty) && parsedQty > 0
                    ? Math.round(parsedQty)
                    : 1;

            const preset = KNOWN_B2B_BOM_CATALOG[rawCode];
            const retailGross = preset ? preset.retailGrossEur : 48.0;
            const brandName = preset ? preset.brandName : 'Danfoss / HERZ / Gilės';
            const title = preset ? preset.title : `ŠVOK sąmatos mazgas ${rawCode}`;
            const stockLabel = preset ? preset.stockLabel : 'Sandėlyje Kaune (Eigulių g. 21)';

            const calc = calculateB2BLineItemPrice({
                accountId: accountId || null,
                defaultAccountDiscountPct: defaultDiscountPct,
                sku: rawCode,
                brandName,
                retailGrossEur: retailGross,
                qty,
            });

            return {
                inputCode: rawCode,
                qty,
                found: Boolean(preset),
                productId: `bom-${rawCode}-${idx}`,
                sku: rawCode,
                ean: '5702420114200',
                title,
                brandName,
                stockLabel,
                retailGrossUnitEur: calc.retailGrossEur,
                retailNetUnitEur: calc.retailNetEur,
                discountPercent: calc.appliedDiscountPct,
                dealerNetUnitEur: calc.unitNetEur,
                dealerGrossUnitEur: calc.unitGrossEur,
                lineTotalNetEur: calc.lineNetEur,
                lineTotalGrossEur: calc.lineGrossEur,
                lineMarginEur:
                    Math.round((calc.retailNetEur - calc.unitNetEur) * qty * 100) / 100,
                imageUrl: '/images/products/013g2990.webp',
            };
        });
}

export function computeClientSafeQuoteSummary(
    rows: B2BQuickOrderResolvedRow[],
    markupPercent: number,
    clientSafeMode: boolean,
): {
    dealerTotalNetEur: number;
    clientTotalNetEur: number;
    clientTotalGrossEur: number;
    installerMarginNetEur: number;
    markupPercent: number;
    hideB2BCost: boolean;
    lines: Array<{
        sku: string;
        title: string;
        qty: number;
        clientUnitNetEur: number;
        clientLineNetEur: number;
        dealerUnitNetEur: number;
    }>;
} {
    const safeMarkup = Math.max(0, markupPercent);
    const factor = 1 + safeMarkup / 100;

    const lines = rows.map((r) => {
        const clientUnitNetEur = Math.round(r.dealerNetUnitEur * factor * 100) / 100;
        const clientLineNetEur = Math.round(clientUnitNetEur * r.qty * 100) / 100;
        return {
            sku: r.sku,
            title: r.title,
            qty: r.qty,
            clientUnitNetEur,
            clientLineNetEur,
            dealerUnitNetEur: r.dealerNetUnitEur,
        };
    });

    const dealerTotalNetEur =
        Math.round(rows.reduce((sum, r) => sum + r.dealerNetUnitEur * r.qty, 0) * 100) / 100;
    const clientTotalNetEur =
        Math.round(lines.reduce((sum, l) => sum + l.clientLineNetEur, 0) * 100) / 100;
    const clientTotalGrossEur = Math.round(clientTotalNetEur * 1.21 * 100) / 100;
    const installerMarginNetEur =
        Math.round((clientTotalNetEur - dealerTotalNetEur) * 100) / 100;

    return {
        dealerTotalNetEur,
        clientTotalNetEur,
        clientTotalGrossEur,
        installerMarginNetEur,
        markupPercent: safeMarkup,
        hideB2BCost: clientSafeMode,
        lines,
    };
}

export function B2BBomAndClientQuote(props: {
    accountId?: string | null;
    defaultDiscountPercent?: number;
    activeRows: B2BQuickOrderResolvedRow[];
}) {
    const { accountId, defaultDiscountPercent = 45, activeRows } = props;
    const addItem = useCartStore((s) => s.addItem);
    const openCart = useCartStore((s) => s.openCart);

    const [bomText, setBomText] = useState('013G0014 8\nPOL./80-500 12\n013G2970 8');
    const [matchedRows, setMatchedRows] = useState<B2BQuickOrderResolvedRow[]>(() =>
        parseAndMatchBulkBomLines('013G0014 8\nPOL./80-500 12\n013G2970 8', accountId, defaultDiscountPercent),
    );
    const [bomImportedConfirm, setBomImportedConfirm] = useState(false);

    const [clientSafeMode, setClientSafeMode] = useState(true);
    const [markupPercent, setMarkupPercent] = useState<number>(15);
    const [quoteExportedMsg, setQuoteExportedMsg] = useState<string | null>(null);

    const sourceRows = matchedRows.length > 0 ? matchedRows : activeRows;
    const quoteSummary = computeClientSafeQuoteSummary(sourceRows, markupPercent, clientSafeMode);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-3">
            {/* P09: Bulk BOM Paste Matcher */}
            <section
                data-testid="b2b-bulk-bom-paste"
                className="rounded-xl border border-[#E2DDD3] bg-[#FAF9F6] p-4 space-y-3 text-xs"
            >
                <div className="flex items-center justify-between gap-2">
                    <div>
                        <span className="font-bold text-[#C2410C] block">
                            1. Greitas sąmatos įkėlimas iš teksto / Excel (Bulk BOM)
                        </span>
                        <strong className="text-sm text-[#11161B]">
                            Įklijuokite kelias eilutes (SKU arba pavadinimas, kiekis)
                        </strong>
                    </div>
                    <FileSpreadsheet className="w-4 h-4 text-[#C2410C] shrink-0" />
                </div>

                <textarea
                    rows={3}
                    value={bomText}
                    onChange={(e) => setBomText(e.target.value)}
                    placeholder={'013G0014 8\nPOL./80-500 12\n013G2970 8'}
                    className="w-full rounded-lg border border-[#D5CFC3] bg-white p-2.5 font-mono text-xs text-[#11161B]"
                />

                <div className="flex flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={() => {
                            setMatchedRows(
                                parseAndMatchBulkBomLines(
                                    bomText,
                                    accountId,
                                    defaultDiscountPercent,
                                ),
                            );
                            setBomImportedConfirm(false);
                        }}
                        className="h-9 px-3.5 rounded-lg bg-[#11161B] text-white font-bold cursor-pointer"
                    >
                        Atpažinti ir suskaičiuoti sąmatą
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            for (const r of matchedRows) {
                                addItem({
                                    id: r.sku,
                                    productId: r.sku,
                                    sku: r.sku,
                                    name: r.title,
                                    price: r.dealerGrossUnitEur,
                                    quantity: r.qty,
                                    image: r.imageUrl,
                                });
                            }
                            setBomImportedConfirm(true);
                            openCart();
                        }}
                        className="h-9 px-3.5 rounded-lg bg-[#C2410C] hover:bg-[#9A3412] text-white font-bold cursor-pointer"
                    >
                        Įkelti viską į greitą užsakymą / sąmatą
                    </button>
                </div>

                {bomImportedConfirm && (
                    <p className="font-bold text-[#157A3B] inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Visos atpažintos BOM eilutės įkeltos į užsakymo sąmatą!
                    </p>
                )}

                <div className="space-y-1.5 pt-1">
                    {matchedRows.map((row) => (
                        <div
                            key={`${row.sku}-${row.qty}`}
                            className="rounded-lg border border-[#E2DDD3] bg-white px-3 py-2 flex items-center justify-between gap-2"
                        >
                            <div className="min-w-0">
                                <strong className="font-mono text-[#C2410C]">{row.sku}</strong> ·{' '}
                                <span className="font-semibold text-[#11161B]">{row.title}</span> ×{' '}
                                <strong>{row.qty} vnt.</strong>
                                <span className="block text-[11px] text-[#157A3B]">
                                    {row.stockLabel} · B2B −{row.discountPercent}%
                                </span>
                            </div>
                            <strong className="font-mono text-[#11161B] whitespace-nowrap">
                                {row.lineTotalNetEur.toFixed(2)} € be PVM
                            </strong>
                        </div>
                    ))}
                </div>
            </section>

            {/* P10: Client-Safe Printable Quote Mode */}
            <section
                data-testid="b2b-client-quote-mode"
                className="rounded-xl border border-[#E2DDD3] bg-[#FAF9F6] p-4 space-y-3 text-xs"
            >
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                        <span className="font-bold text-[#157A3B] block">
                            2. Pasiūlymas galutiniam klientui (Client-Safe Quote Mode)
                        </span>
                        <strong className="text-sm text-[#11161B]">
                            Švari sąmata užsakovui be jūsų didmeninės nuolaidos ir savikainos
                        </strong>
                    </div>
                    <label className="inline-flex items-center gap-1.5 font-bold text-[#11161B] cursor-pointer">
                        <input
                            type="checkbox"
                            checked={clientSafeMode}
                            onChange={(e) => setClientSafeMode(e.target.checked)}
                        />
                        <EyeOff className="w-3.5 h-3.5 text-[#C2410C]" />
                        <span>Kliento režimas (Slėpti mano B2B savikainą)</span>
                    </label>
                </div>

                <div className="space-y-1.5">
                    <span className="font-semibold text-[#5B6470] block">
                        Montuotojo antkainis klientui (%)
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                        {[0, 10, 15, 20].map((pct) => (
                            <button
                                key={pct}
                                type="button"
                                onClick={() => setMarkupPercent(pct)}
                                className={`h-8 px-3 rounded-lg font-mono font-bold cursor-pointer border ${
                                    markupPercent === pct
                                        ? 'border-[#C2410C] bg-[#C2410C] text-white'
                                        : 'border-[#D5CFC3] bg-white text-[#11161B]'
                                }`}
                            >
                                {pct === 0 ? '0%' : `+${pct}%`}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="rounded-lg border border-[#E2DDD3] bg-white p-3 space-y-1.5">
                    {quoteSummary.lines.map((line) => (
                        <div key={line.sku} className="flex items-center justify-between gap-2">
                            <span>
                                <strong className="font-mono">{line.sku}</strong> · {line.title} ×{' '}
                                {line.qty} vnt.
                            </span>
                            <strong className="font-mono whitespace-nowrap">
                                {line.clientLineNetEur.toFixed(2)} €
                            </strong>
                        </div>
                    ))}
                    <div className="pt-2 border-t border-[#E2DDD3] flex flex-wrap items-center justify-between gap-2 font-bold">
                        <span>Kaina klientui be PVM: {quoteSummary.clientTotalNetEur.toFixed(2)} €</span>
                        <span className="text-[#C2410C]">
                            Su PVM (21%): {quoteSummary.clientTotalGrossEur.toFixed(2)} €
                        </span>
                    </div>
                    {!clientSafeMode && (
                        <div className="pt-1 text-[11px] text-[#157A3B] font-mono flex justify-between">
                            <span>Mano B2B savikaina: {quoteSummary.dealerTotalNetEur.toFixed(2)} €</span>
                            <span>Mano uždarbis: +{quoteSummary.installerMarginNetEur.toFixed(2)} €</span>
                        </div>
                    )}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2">
                    <button
                        type="button"
                        onClick={() => {
                            setQuoteExportedMsg(
                                `Paruoštas kliento pasiūlymas (${quoteSummary.clientTotalGrossEur.toFixed(2)} € su PVM, antkainis +${markupPercent}%, B2B savikaina paslėpta).`,
                            );
                            if (typeof window !== 'undefined' && typeof window.print === 'function') {
                                try {
                                    window.print();
                                } catch {
                                    // ignore in headless test
                                }
                            }
                        }}
                        className="h-9 px-3.5 rounded-lg bg-[#11161B] hover:bg-[#C2410C] text-white font-bold inline-flex items-center gap-1.5 cursor-pointer"
                    >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Spausdinti / Eksportuoti pasiūlymą klientui</span>
                    </button>
                    {quoteExportedMsg && (
                        <span className="text-[11px] font-semibold text-[#157A3B]">
                            {quoteExportedMsg}
                        </span>
                    )}
                </div>
            </section>
        </div>
    );
}
