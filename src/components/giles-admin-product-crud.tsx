'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Plus, Check, Search, Wand2, RefreshCw, Star, Trash2 } from 'lucide-react';
import { assetUrl } from '../lib/api';
import type { AdminCatalogProductRow } from '../app/api/admin/products/route';
import {
    useAdminSavedViews,
    type AdminProductFilters,
} from '../lib/admin-saved-views';
import {
    computeBulkEditPreview,
    buildUndoPayload,
    type BulkEditOperation,
    type BulkEditDiff,
    type BulkEditUndoItem,
} from '../lib/admin-bulk-edit';
import { AdminActivityLogPanel } from './admin-activity-log-panel';

interface BrandSummary {
    id: string;
    name: string;
    slug: string;
    productCount: number;
}

export function GilesAdminProductCrud() {
    const [items, setItems] = useState<AdminCatalogProductRow[]>([]);
    const [brands, setBrands] = useState<BrandSummary[]>([]);
    const [totalCatalogCount, setTotalCatalogCount] = useState(6337);
    const [matchedCount, setMatchedCount] = useState(6337);
    const [lowMarginCount, setLowMarginCount] = useState(0);
    const [lowStockCount, setLowStockCount] = useState(0);
    const [overridesCount, setOverridesCount] = useState(0);

    const [query, setQuery] = useState('');
    const [brandFilter, setBrandFilter] = useState('visi');
    const [stockFilter, setStockFilter] = useState('all');
    const [statusNotice, setStatusNotice] = useState('');
    const [priceMin, setPriceMin] = useState<number | null>(null);
    const [priceMax, setPriceMax] = useState<number | null>(null);

    // W123-A1: saved views, bulk editor and audit panel state.
    const savedViews = useAdminSavedViews();
    const [viewNotice, setViewNotice] = useState('');
    const [viewName, setViewName] = useState('');
    const [selectedSkus, setSelectedSkus] = useState<Set<string>>(new Set());
    const [bulkOpen, setBulkOpen] = useState(false);
    const [bulkKind, setBulkKind] = useState<BulkEditOperation['kind']>('price_percent');
    const [bulkPercent, setBulkPercent] = useState(5);
    const [bulkPriceSet, setBulkPriceSet] = useState(100);
    const [bulkStock, setBulkStock] = useState(0);
    const [bulkCategory, setBulkCategory] = useState('Katilinės įranga');
    const [bulkPreview, setBulkPreview] = useState<
        ReturnType<typeof computeBulkEditPreview> | null
    >(null);
    const [undoPayload, setUndoPayload] = useState<BulkEditUndoItem[] | null>(null);
    const [activityRefreshKey, setActivityRefreshKey] = useState(0);

    // Inline row draft edits keyed by SKU
    const [draftEdits, setDraftEdits] = useState<
        Record<
            string,
            {
                name: string;
                priceGrossEur: number;
                costPriceEur: number;
                stockQuantity: number;
                published: boolean;
            }
        >
    >({});

    // Create Product Drawer/Form state
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newSku, setNewSku] = useState('');
    const [newEan, setNewEan] = useState('4770001002027');
    const [newName, setNewName] = useState('');
    const [newBrand, setNewBrand] = useState('Gilės Inžinerija');
    const [newCategory, setNewCategory] = useState('Granulių degikliai ir katilai');
    const [newPriceGross, setNewPriceGross] = useState(249.0);
    const [newCostNet, setNewCostNet] = useState(145.0);
    const [newStockQty, setNewStockQty] = useState(10);
    const [newDescLt, setNewDescLt] = useState('');
    const [aiTranslations, setAiTranslations] = useState<{
        en: string;
        pl: string;
        ru: string;
    } | null>(null);

    // Bulk Brand Rule & Stock state
    const [bulkBrand, setBulkBrand] = useState('danfoss');
    const [bulkMode, setBulkMode] = useState<'margin_floor' | 'percent_adjust'>('margin_floor');
    const [bulkValue, setBulkValue] = useState(28);
    const [bulkStockQty, setBulkStockQty] = useState(12);

    // Full Product Editor Drawer state
    const [editingFullProduct, setEditingFullProduct] = useState<AdminCatalogProductRow | null>(
        null,
    );
    const [fullSubcategory, setFullSubcategory] = useState('Termostatiniai ir balansiniai mazgai');
    const [fullPromoGross, setFullPromoGross] = useState<string>('');
    const [fullWeightKg, setFullWeightKg] = useState<number>(4.5);
    const [fullDeliveryClass, setFullDeliveryClass] = useState<string>('Paštomatas <30kg');
    const [fullApvaEligible, setFullApvaEligible] = useState<boolean>(false);
    const [fullBoilerTags, setFullBoilerTags] = useState<string>('Viadrus U22, Kalvis 2-16, Atmos');
    const [fullDescriptionLt, setFullDescriptionLt] = useState<string>('');
    const [fullCompatibilityNote, setFullCompatibilityNote] = useState<string>('');
    const [fullKitContentsText, setFullKitContentsText] = useState<string>('');

    const fetchProducts = async (
        qVal = query,
        bVal = brandFilter,
        sVal = stockFilter,
        pMin: number | null = priceMin,
        pMax: number | null = priceMax,
    ) => {
        try {
            const params = new URLSearchParams({
                q: qVal,
                brand: bVal,
                stock: sVal,
                limit: '30',
            });
            const res = await fetch(assetUrl(`/api/admin/products?${params.toString()}`));
            const data = await res.json();
            if (data?.ok && Array.isArray(data.items)) {
                let rows: AdminCatalogProductRow[] = data.items;
                if (pMin != null) rows = rows.filter((r) => r.priceGrossEur >= pMin);
                if (pMax != null) rows = rows.filter((r) => r.priceGrossEur <= pMax);
                setItems(rows);
                setTotalCatalogCount(data.totalCatalogCount ?? 6337);
                setMatchedCount(data.matchedCount ?? data.items.length);
                setLowMarginCount(data.lowMarginCount ?? 0);
                setLowStockCount(data.lowStockCount ?? 0);
                setOverridesCount(data.overridesCount ?? 0);
                if (Array.isArray(data.brands)) {
                    setBrands(data.brands);
                }
                const nextDrafts: typeof draftEdits = {};
                for (const row of data.items as AdminCatalogProductRow[]) {
                    nextDrafts[row.sku] = {
                        name: row.name,
                        priceGrossEur: row.priceGrossEur,
                        costPriceEur: row.costPriceEur,
                        stockQuantity: row.stockQuantity,
                        published: row.published,
                    };
                }
                setDraftEdits(nextDrafts);
            }
        } catch {
            // ignore
        }
    };

    useEffect(() => {
        fetchProducts('', 'visi', 'all');
    }, []);

    // W123-A1: command palette jumps straight to a SKU in this editor.
    useEffect(() => {
        const onFocusProduct = (e: Event) => {
            const sku = (e as CustomEvent<{ sku: string }>).detail?.sku;
            if (!sku) return;
            setQuery(sku);
            setBrandFilter('visi');
            setStockFilter('all');
            setPriceMin(null);
            setPriceMax(null);
            fetchProducts(sku, 'visi', 'all', null, null);
        };
        const onCatalogChanged = () => {
            setActivityRefreshKey((k) => k + 1);
            fetchProducts();
        };
        window.addEventListener('giles-admin:focus-product', onFocusProduct);
        window.addEventListener('giles-admin:catalog-changed', onCatalogChanged);
        return () => {
            window.removeEventListener('giles-admin:focus-product', onFocusProduct);
            window.removeEventListener('giles-admin:catalog-changed', onCatalogChanged);
        };
    }, []);

    // Apply the marked-default saved view once on first load.
    const defaultViewAppliedRef = useRef(false);
    useEffect(() => {
        if (defaultViewAppliedRef.current) return;
        const def = savedViews.views.find((v) => v.isDefault);
        if (def) {
            defaultViewAppliedRef.current = true;
            applyFilters(def.filters);
        }
    }, [savedViews.views]);

    const currentFilters: AdminProductFilters = {
        query,
        brand: brandFilter,
        stock: stockFilter,
        priceMin,
        priceMax,
    };

    const applyFilters = (filters: AdminProductFilters) => {
        setQuery(filters.query);
        setBrandFilter(filters.brand);
        setStockFilter(filters.stock);
        setPriceMin(filters.priceMin);
        setPriceMax(filters.priceMax);
        fetchProducts(filters.query, filters.brand, filters.stock, filters.priceMin, filters.priceMax);
    };

    const handleSaveView = () => {
        const result = savedViews.save(viewName, currentFilters);
        setViewNotice(
            result.ok ? `Vaizdas „${viewName.trim()}“ išsaugotas.` : result.error || 'Nepavyko išsaugoti',
        );
        if (result.ok) setViewName('');
    };

    const toggleSelected = (sku: string) => {
        setSelectedSkus((prev) => {
            const next = new Set(prev);
            if (next.has(sku)) next.delete(sku);
            else next.add(sku);
            return next;
        });
        setBulkPreview(null);
    };

    const allVisibleSelected = items.length > 0 && items.every((r) => selectedSkus.has(r.sku));
    const toggleSelectAll = () => {
        setSelectedSkus((prev) => {
            if (allVisibleSelected) {
                const next = new Set(prev);
                for (const r of items) next.delete(r.sku);
                return next;
            }
            const next = new Set(prev);
            for (const r of items) next.add(r.sku);
            return next;
        });
        setBulkPreview(null);
    };

    const buildOperation = (): BulkEditOperation | null => {
        if (bulkKind === 'price_percent') return { kind: 'price_percent', percent: bulkPercent };
        if (bulkKind === 'price_set') return { kind: 'price_set', priceGrossEur: bulkPriceSet };
        if (bulkKind === 'availability') return { kind: 'availability', stockQuantity: bulkStock };
        if (bulkKind === 'category') return { kind: 'category', category: bulkCategory };
        return null;
    };

    const handleBulkPreview = () => {
        const op = buildOperation();
        if (!op) return;
        setBulkPreview(computeBulkEditPreview(items, [...selectedSkus], op));
    };

    const handleBulkApply = async () => {
        if (!bulkPreview) return;
        const edits = bulkPreview.diffs
            .filter((d) => !d.blocked)
            .map((d) =>
                d.field === 'priceGrossEur'
                    ? { sku: d.sku, priceGrossEur: Number(d.after) }
                    : d.field === 'stockQuantity'
                      ? { sku: d.sku, stockQuantity: Number(d.after) }
                      : { sku: d.sku, category: String(d.after) },
            );
        if (!edits.length) return;
        try {
            const res = await fetch(assetUrl('/api/admin/products'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'bulk_edit_apply', edits }),
            });
            const data = await res.json();
            if (data?.ok) {
                setUndoPayload(buildUndoPayload(bulkPreview.diffs));
                setStatusNotice(
                    `Masinis redagavimas pritaikytas: ${data.appliedCount} SKU. Pakeitimus galite anuliuoti mygtuku „Anuliuoti“.`,
                );
                setBulkPreview(null);
                setSelectedSkus(new Set());
                setBulkOpen(false);
                setActivityRefreshKey((k) => k + 1);
                await fetchProducts();
            }
        } catch {
            // ignore
        }
    };

    const handleBulkUndo = async () => {
        if (!undoPayload?.length) return;
        try {
            const res = await fetch(assetUrl('/api/admin/products'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'bulk_edit_apply', edits: undoPayload }),
            });
            const data = await res.json();
            if (data?.ok) {
                setStatusNotice(
                    `Masinis redagavimas atšauktas: ${data.appliedCount} SKU grąžinti į pradines reikšmes.`,
                );
                setUndoPayload(null);
                setActivityRefreshKey((k) => k + 1);
                await fetchProducts();
            }
        } catch {
            // ignore
        }
    };

    const handleSaveProductRow = async (sku: string) => {
        const draft = draftEdits[sku];
        if (!draft) return;
        try {
            const res = await fetch(assetUrl('/api/admin/products'), {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sku,
                    name: draft.name,
                    priceGrossEur: draft.priceGrossEur,
                    costPriceEur: draft.costPriceEur,
                    stockQuantity: draft.stockQuantity,
                    published: draft.published,
                }),
            });
            const data = await res.json();
            if (data?.ok) {
                setStatusNotice(
                    `Išsaugota diske (catalog-overrides.json): SKU ${sku} – Kaina su PVM ${Number(draft.priceGrossEur).toFixed(2)} €, Savikaina ${Number(draft.costPriceEur).toFixed(2)} €, Likutis Kaune ${draft.stockQuantity} vnt.`,
                );
                await fetchProducts();
            }
        } catch {
            // ignore
        }
    };

    const handleBulkStockUpdate = async () => {
        try {
            const res = await fetch(assetUrl('/api/admin/products'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'bulk_stock_update',
                    brandSlug: bulkBrand,
                    stockQuantity: bulkStockQty,
                }),
            });
            const data = await res.json();
            if (data?.ok) {
                setStatusNotice(
                    `Masinis likučių atnaujinimas (${bulkBrand.toUpperCase()}): atnaujinta ${data.affectedCount} SKU pozicijų (${bulkStockQty} vnt. Kauno sandėlyje).`,
                );
                await fetchProducts();
            }
        } catch {
            // ignore
        }
    };

    const handleSaveFullProductModal = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingFullProduct) return;
        const draft = draftEdits[editingFullProduct.sku] || {
            name: editingFullProduct.name,
            priceGrossEur: editingFullProduct.priceGrossEur,
            costPriceEur: editingFullProduct.costPriceEur,
            stockQuantity: editingFullProduct.stockQuantity,
            published: editingFullProduct.published,
        };
        try {
            const res = await fetch(assetUrl('/api/admin/products'), {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sku: editingFullProduct.sku,
                    ean: editingFullProduct.ean,
                    name: draft.name,
                    brandName: editingFullProduct.brandName,
                    category: editingFullProduct.category,
                    subcategory: fullSubcategory,
                    priceGrossEur: draft.priceGrossEur,
                    promoPriceEur: fullPromoGross.trim() ? Number(fullPromoGross) : null,
                    costPriceEur: draft.costPriceEur,
                    stockQuantity: draft.stockQuantity,
                    published: draft.published,
                    active: draft.published,
                    weightKg: fullWeightKg,
                    deliveryClass: fullDeliveryClass,
                    apvaEligible: fullApvaEligible,
                    boilerCompatibilityTags: fullBoilerTags
                        .split(',')
                        .map((t) => t.trim())
                        .filter(Boolean),
                    compatibleBoilers: fullBoilerTags
                        .split(',')
                        .map((t) => t.trim())
                        .filter(Boolean),
                    descriptionLt: fullDescriptionLt,
                    description: fullDescriptionLt,
                    compatibilityNote: fullCompatibilityNote,
                    kitContents: fullKitContentsText
                        .split('\n')
                        .map((line) => line.trim())
                        .filter(Boolean),
                }),
            });
            const data = await res.json();
            if (data?.ok) {
                setStatusNotice(
                    `Pilna prekės kortelė atnaujinta ir sinchronizuota su vitrina: ${editingFullProduct.sku} (${draft.name}).`,
                );
                setEditingFullProduct(null);
                await fetchProducts();
            }
        } catch {
            // ignore
        }
    };

    const handleAiEnrichNewProduct = async () => {
        try {
            const res = await fetch(assetUrl('/api/admin/products'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'ai_enrich_product',
                    sku: newSku || 'MPB-NANI-35',
                    name: newName || 'Granulių degiklio ir katilinės mazgas',
                    brandName: newBrand,
                    category: newCategory,
                }),
            });
            const data = await res.json();
            if (data?.ok && data.enrichment) {
                setNewDescLt(data.enrichment.descriptionLt);
                setAiTranslations({
                    en: data.enrichment.translations.en,
                    pl: data.enrichment.translations.pl,
                    ru: data.enrichment.translations.ru,
                });
                setStatusNotice(
                    'Vytautas AI sugeneravo techninį aprašymą (EN 12831 / EN 303-5) ir 4 kalbų (LT/EN/PL/RU) vertimus.',
                );
            }
        } catch {
            // ignore
        }
    };

    const handleCreateProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newSku.trim() || !newName.trim()) return;
        try {
            const res = await fetch(assetUrl('/api/admin/products'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'create_product',
                    sku: newSku.trim(),
                    ean: newEan.trim(),
                    name: newName.trim(),
                    brandName: newBrand.trim(),
                    category: newCategory.trim(),
                    priceGrossEur: newPriceGross,
                    costPriceEur: newCostNet,
                    stockQuantity: newStockQty,
                    description: newDescLt.trim(),
                }),
            });
            const data = await res.json();
            if (data?.ok) {
                setStatusNotice(
                    `Nauja prekė sukurta ir paskelbta kataloge: ${newName.trim()} (SKU: ${newSku.trim()}, ${newPriceGross.toFixed(2)} € su PVM).`,
                );
                setShowCreateModal(false);
                setQuery(newSku.trim());
                await fetchProducts(newSku.trim(), 'visi', 'all');
                setNewSku('');
                setNewName('');
            }
        } catch {
            // ignore
        }
    };

    const handleApplyBulkBrandRule = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch(assetUrl('/api/admin/products'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'bulk_brand_rule',
                    brandSlug: bulkBrand,
                    mode: bulkMode,
                    value: bulkValue,
                }),
            });
            const data = await res.json();
            if (data?.ok) {
                setStatusNotice(
                    `Masinė kainodaros taisyklė pritaikyta (${bulkBrand.toUpperCase()}): atnaujinta ${data.affectedCount} SKU pozicijų.`,
                );
                await fetchProducts();
            }
        } catch {
            // ignore
        }
    };

    return (
        <div data-testid="admin-catalog-crud" className="space-y-6">
            {/* Top Bar: Summary + Create New Product Trigger */}
            <div className="rounded-2xl border border-[#E2DDD3] bg-white p-5 sm:p-6 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <span className="text-xs font-bold text-[#C2410C] block">
                            Pilnas Prekių Valdymas (CRUD) · Tiesioginis ryšys su /lt/products vitrina
                        </span>
                        <h3 className="text-xl font-extrabold text-[#11161B]">
                            Prekių Katalogo, Savikainų, Maržos ir Kauno Sandėlio Likučių Redaktorius ({totalCatalogCount.toLocaleString('lt-LT')} SKU)
                        </h3>
                        <p className="text-xs text-[#5B6470]">
                            Aktyvūs pakeitimai diske: <strong>{overridesCount}</strong> · Žemos maržos (&lt;20%) SKU: <strong>{lowMarginCount}</strong> · Baigiasi sandėlyje (1–3 vnt.): <strong>{lowStockCount}</strong>
                        </p>
                    </div>
                    <button
                        type="button"
                        data-testid="admin-create-product-btn"
                        onClick={() => setShowCreateModal((prev) => !prev)}
                        className="h-11 px-4 rounded-lg bg-[#C2410C] hover:bg-[#9A3412] text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                    >
                        <Plus className="w-4 h-4" />
                        <span>+ Sukurti naują prekę</span>
                    </button>
                </div>

                {statusNotice && (
                    <div className="rounded-xl bg-[#E3F1E8] text-[#0F5A2B] p-3 text-xs font-bold">
                        {statusNotice}
                    </div>
                )}

                {/* 1) Create New Product Drawer/Form */}
                {showCreateModal && (
                    <form
                        data-testid="admin-create-product-form"
                        onSubmit={handleCreateProduct}
                        className="rounded-xl border border-[#D5CFC3] bg-[#FAF9F6] p-4 space-y-4 text-xs"
                    >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <h4 className="text-sm font-extrabold text-[#11161B]">
                                Sukurti naują prekę kataloge (iškart matoma /lt/products vitrinoje)
                            </h4>
                            <button
                                type="button"
                                onClick={handleAiEnrichNewProduct}
                                className="h-10 px-3.5 rounded-lg bg-[#11161B] hover:bg-[#C2410C] text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                            >
                                <Wand2 className="w-3.5 h-3.5" />
                                <span>Sugeneruoti techninį aprašymą ir 4 kalbų vertimą (AI)</span>
                            </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                            <label className="flex flex-col gap-1 font-semibold">
                                Prekės kodas (SKU) *
                                <input
                                    type="text"
                                    required
                                    value={newSku}
                                    onChange={(e) => setNewSku(e.target.value)}
                                    placeholder="MPB-PRO-50"
                                    className="h-10 px-3 rounded-lg border border-[#D5CFC3] bg-white font-mono"
                                />
                            </label>
                            <label className="flex flex-col gap-1 font-semibold">
                                EAN brūkšninis kodas
                                <input
                                    type="text"
                                    value={newEan}
                                    onChange={(e) => setNewEan(e.target.value)}
                                    className="h-10 px-3 rounded-lg border border-[#D5CFC3] bg-white font-mono"
                                />
                            </label>
                            <label className="flex flex-col gap-1 font-semibold sm:col-span-2">
                                Prekės pavadinimas *
                                <input
                                    type="text"
                                    required
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    placeholder="Granulių degiklio komplektas..."
                                    className="h-10 px-3 rounded-lg border border-[#D5CFC3] bg-white"
                                />
                            </label>
                            <label className="flex flex-col gap-1 font-semibold">
                                Gamintojas
                                <input
                                    type="text"
                                    value={newBrand}
                                    onChange={(e) => setNewBrand(e.target.value)}
                                    className="h-10 px-3 rounded-lg border border-[#D5CFC3] bg-white"
                                />
                            </label>
                            <label className="flex flex-col gap-1 font-semibold">
                                Kategorija
                                <input
                                    type="text"
                                    value={newCategory}
                                    onChange={(e) => setNewCategory(e.target.value)}
                                    className="h-10 px-3 rounded-lg border border-[#D5CFC3] bg-white"
                                />
                            </label>
                            <label className="flex flex-col gap-1 font-semibold">
                                Kaina su PVM (€)
                                <input
                                    type="number"
                                    step="0.01"
                                    value={newPriceGross}
                                    onChange={(e) => setNewPriceGross(Number(e.target.value))}
                                    className="h-10 px-3 rounded-lg border border-[#D5CFC3] bg-white"
                                />
                            </label>
                            <label className="flex flex-col gap-1 font-semibold">
                                Savikaina be PVM (€) / Likutis Kaune
                                <div className="grid grid-cols-2 gap-2">
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={newCostNet}
                                        onChange={(e) => setNewCostNet(Number(e.target.value))}
                                        className="h-10 px-2.5 rounded-lg border border-[#D5CFC3] bg-white"
                                    />
                                    <input
                                        type="number"
                                        value={newStockQty}
                                        onChange={(e) => setNewStockQty(Number(e.target.value))}
                                        className="h-10 px-2.5 rounded-lg border border-[#D5CFC3] bg-white"
                                    />
                                </div>
                            </label>
                        </div>

                        <label className="flex flex-col gap-1 font-semibold">
                            Techninis aprašymas (LT)
                            <textarea
                                rows={2}
                                value={newDescLt}
                                onChange={(e) => setNewDescLt(e.target.value)}
                                placeholder="Techninė specifikacija pagal EN 12831 / EN 303-5..."
                                className="p-3 rounded-lg border border-[#D5CFC3] bg-white text-xs"
                            />
                        </label>

                        {aiTranslations && (
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 rounded-lg bg-white p-3 border border-[#E2DDD3]">
                                <div>
                                    <strong className="block text-[#C2410C]">EN vertimas:</strong>
                                    <p className="text-[#5B6470]">{aiTranslations.en}</p>
                                </div>
                                <div>
                                    <strong className="block text-[#C2410C]">PL vertimas:</strong>
                                    <p className="text-[#5B6470]">{aiTranslations.pl}</p>
                                </div>
                                <div>
                                    <strong className="block text-[#C2410C]">RU vertimas:</strong>
                                    <p className="text-[#5B6470]">{aiTranslations.ru}</p>
                                </div>
                            </div>
                        )}

                        <div className="flex flex-wrap gap-2">
                            <button
                                type="submit"
                                className="h-10 px-4 rounded-lg bg-[#157A3B] hover:bg-[#0F5A2B] text-white font-bold inline-flex items-center gap-1.5 cursor-pointer"
                            >
                                <Check className="w-4 h-4" />
                                <span>Išsaugoti ir paskelbti naują prekę</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowCreateModal(false)}
                                className="h-10 px-3.5 rounded-lg border border-[#D5CFC3] bg-white text-[#11161B] font-semibold cursor-pointer"
                            >
                                Uždaryti
                            </button>
                        </div>
                    </form>
                )}

                {/* 2) Top-Eshop Bulk Operations Bar (Price, Margin Floor >=15%, Stock & CSV/JSON Export) */}
                <div
                    data-testid="admin-product-bulk-actions"
                    className="rounded-xl border border-[#E2DDD3] bg-[#FAF9F6] p-4 space-y-3 text-xs"
                >
                    <form
                        data-testid="admin-bulk-brand-rule"
                        onSubmit={handleApplyBulkBrandRule}
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end"
                    >
                        <label className="flex flex-col gap-1 font-semibold">
                            Gamintojo / Kategorijos filtras
                            <select
                                value={bulkBrand}
                                onChange={(e) => setBulkBrand(e.target.value)}
                                className="h-10 px-3 rounded-lg border border-[#D5CFC3] bg-white font-semibold"
                            >
                                <option value="all">Visi 28 gamintojai ({totalCatalogCount} SKU)</option>
                                {brands.map((b) => (
                                    <option key={b.slug} value={b.slug}>
                                        {b.name} ({b.productCount} SKU)
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label className="flex flex-col gap-1 font-semibold">
                            Kainodaros taisyklė (&gt;=15% maržos apsauga)
                            <select
                                value={bulkMode}
                                onChange={(e) =>
                                    setBulkMode(
                                        e.target.value as 'margin_floor' | 'percent_adjust',
                                    )
                                }
                                className="h-10 px-3 rounded-lg border border-[#D5CFC3] bg-white font-semibold"
                            >
                                <option value="margin_floor">Minimali marža nuo savikainos (%)</option>
                                <option value="percent_adjust">Kainos pokytis (+/- %)</option>
                            </select>
                        </label>
                        <label className="flex flex-col gap-1 font-semibold">
                            Reikšmė (%)
                            <input
                                type="number"
                                step="0.5"
                                value={bulkValue}
                                onChange={(e) => setBulkValue(Number(e.target.value))}
                                className="h-10 px-3 rounded-lg border border-[#D5CFC3] bg-white font-bold"
                            />
                        </label>
                        <button
                            type="submit"
                            className="h-10 px-4 rounded-lg bg-[#11161B] hover:bg-[#C2410C] text-white font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span>Pritaikyti kainodarai</span>
                        </button>
                    </form>

                    <div className="pt-2 border-t border-[#E2DDD3] flex flex-wrap items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="font-semibold text-[#11161B]">
                                Masinis likučių atnaujinimas pasirinktam gamintojui:
                            </span>
                            <input
                                type="number"
                                min={0}
                                value={bulkStockQty}
                                onChange={(e) => setBulkStockQty(Number(e.target.value))}
                                className="h-9 w-24 px-2.5 rounded-lg border border-[#D5CFC3] bg-white font-bold"
                            />
                            <button
                                type="button"
                                onClick={handleBulkStockUpdate}
                                className="h-9 px-3.5 rounded-lg border border-[#11161B] bg-white hover:bg-[#11161B] hover:text-white text-[#11161B] font-bold cursor-pointer"
                            >
                                Atnaujinti likučius (vnt.)
                            </button>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <a
                                href={assetUrl(
                                    `/api/admin/products?brand=${encodeURIComponent(brandFilter)}&format=csv&limit=200`,
                                )}
                                className="h-9 px-3 rounded-lg border border-[#D5CFC3] bg-white hover:border-[#11161B] text-[#11161B] font-bold inline-flex items-center"
                            >
                                Eksportuoti CSV
                            </a>
                            <a
                                href={assetUrl(
                                    `/api/admin/products?brand=${encodeURIComponent(brandFilter)}&limit=200`,
                                )}
                                target="_blank"
                                rel="noreferrer"
                                className="h-9 px-3 rounded-lg border border-[#D5CFC3] bg-white hover:border-[#11161B] text-[#11161B] font-bold inline-flex items-center"
                            >
                                Eksportuoti JSON
                            </a>
                        </div>
                    </div>
                </div>

                {/* Full Product Editor Modal/Drawer */}
                {editingFullProduct && (
                    <form
                        onSubmit={handleSaveFullProductModal}
                        className="rounded-xl border border-[#C2410C] bg-[#FAF9F6] p-4 space-y-3 text-xs"
                    >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <strong className="text-sm text-[#11161B]">
                                Pilnas prekės kortelės redaktorius: {editingFullProduct.sku} ({editingFullProduct.brandName})
                            </strong>
                            <button
                                type="button"
                                onClick={() => setEditingFullProduct(null)}
                                className="h-8 px-3 rounded-lg border border-[#D5CFC3] bg-white font-semibold cursor-pointer"
                            >
                                Uždaryti
                            </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                            <label className="flex flex-col gap-1 font-semibold">
                                Subkategorija
                                <input
                                    type="text"
                                    value={fullSubcategory}
                                    onChange={(e) => setFullSubcategory(e.target.value)}
                                    className="h-9 px-2.5 rounded-lg border border-[#D5CFC3] bg-white"
                                />
                            </label>
                            <label className="flex flex-col gap-1 font-semibold">
                                Akcijinė kaina su PVM € (Promo)
                                <input
                                    type="number"
                                    step="0.01"
                                    value={fullPromoGross}
                                    onChange={(e) => setFullPromoGross(e.target.value)}
                                    placeholder="Pvz. 219.00"
                                    className="h-9 px-2.5 rounded-lg border border-[#D5CFC3] bg-white font-bold"
                                />
                            </label>
                            <label className="flex flex-col gap-1 font-semibold">
                                Svoris (kg) ir Siuntimo klasė
                                <div className="grid grid-cols-2 gap-1.5">
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={fullWeightKg}
                                        onChange={(e) => setFullWeightKg(Number(e.target.value))}
                                        className="h-9 px-2 rounded-lg border border-[#D5CFC3] bg-white"
                                    />
                                    <select
                                        value={fullDeliveryClass}
                                        onChange={(e) => setFullDeliveryClass(e.target.value)}
                                        className="h-9 px-2 rounded-lg border border-[#D5CFC3] bg-white font-semibold"
                                    >
                                        <option value="Paštomatas <30kg">Paštomatas &lt;30kg</option>
                                        <option value="Paletinis">Paletinis</option>
                                    </select>
                                </div>
                            </label>
                            <label className="flex flex-col gap-1 font-semibold">
                                APVA parama ir Suderinami katilai
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={fullApvaEligible}
                                        onChange={(e) => setFullApvaEligible(e.target.checked)}
                                    />
                                    <span>Tinka APVA paramai</span>
                                </div>
                                <input
                                    type="text"
                                    value={fullBoilerTags}
                                    onChange={(e) => setFullBoilerTags(e.target.value)}
                                    placeholder="Viadrus U22, Kalvis 2-16"
                                    className="h-9 px-2.5 rounded-lg border border-[#D5CFC3] bg-white"
                                />
                            </label>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                            <label className="flex flex-col gap-1 font-semibold">
                                Prekės techninis aprašymas
                                <textarea
                                    rows={3}
                                    value={fullDescriptionLt}
                                    onChange={(e) => setFullDescriptionLt(e.target.value)}
                                    placeholder="Pilnas inžinerinis prekės aprašymas ir pritaikymas..."
                                    className="p-2.5 rounded-lg border border-[#D5CFC3] bg-white font-normal"
                                />
                            </label>
                            <label className="flex flex-col gap-1 font-semibold">
                                Suderinamumo pastaba (sriegis / katilai / pavaros)
                                <textarea
                                    rows={3}
                                    value={fullCompatibilityNote}
                                    onChange={(e) => setFullCompatibilityNote(e.target.value)}
                                    placeholder="Pvz. Tinka Viadrus U22/U26, Kalvis 2-16, Danfoss RA Click 23 mm..."
                                    className="p-2.5 rounded-lg border border-[#D5CFC3] bg-white font-normal"
                                />
                            </label>
                            <label className="flex flex-col gap-1 font-semibold">
                                Kas įeina į komplektą (eilutėmis)
                                <textarea
                                    rows={3}
                                    value={fullKitContentsText}
                                    onChange={(e) => setFullKitContentsText(e.target.value)}
                                    placeholder={'1× Pagrindinis mazgas\n1× Montavimo tarpinė\n1× Instrukcija LT'}
                                    className="p-2.5 rounded-lg border border-[#D5CFC3] bg-white font-normal"
                                />
                            </label>
                        </div>

                        <div className="flex justify-end gap-2">
                            <button
                                type="submit"
                                className="h-9 px-4 rounded-lg bg-[#157A3B] hover:bg-[#0F5A2B] text-white font-bold cursor-pointer"
                            >
                                Išsaugoti pilną kortelę ir sinchronizuoti su parduotuve
                            </button>
                        </div>
                    </form>
                )}

                {/* W123-A1: Saved Views (Odoo favorites pattern) */}
                <div data-testid="admin-saved-views" className="rounded-xl border border-[#E2DDD3] bg-[#FAF9F6] p-3.5 space-y-2.5 text-xs">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-[#11161B]">Išsaugoti vaizdai:</span>
                        {savedViews.views.length === 0 && (
                            <span className="text-[#5B6470]">
                                Dar nėra. Nustatykite filtrus ir įrašykite derinį vardiniu vaizdu.
                            </span>
                        )}
                        {savedViews.views.map((view) => (
                            <span
                                key={view.id}
                                className="inline-flex items-center gap-1 rounded-lg border border-[#D5CFC3] bg-white overflow-hidden"
                            >
                                <button
                                    type="button"
                                    aria-label={view.isDefault ? 'Numatytasis vaizdas' : 'Padaryti numatytuoju'}
                                    onClick={() => savedViews.setDefault(view.id)}
                                    className="h-8 w-8 inline-flex items-center justify-center text-[#C2410C] cursor-pointer bg-transparent"
                                >
                                    <Star
                                        className={`w-3.5 h-3.5 ${view.isDefault ? 'fill-[#C2410C]' : 'fill-transparent'}`}
                                    />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => applyFilters(view.filters)}
                                    title={view.isDefault ? 'Numatytasis vaizdas' : 'Taikyti vaizdą'}
                                    className="h-8 px-2.5 inline-flex items-center gap-1.5 font-bold text-[#11161B] hover:bg-[#F5F3EE] cursor-pointer bg-transparent"
                                >
                                    {view.name}
                                </button>
                                <button
                                    type="button"
                                    aria-label={`Ištrinti vaizdą ${view.name}`}
                                    onClick={() => savedViews.remove(view.id)}
                                    className="h-8 w-8 inline-flex items-center justify-center text-[#5B6470] hover:text-[#8A2F07] cursor-pointer bg-transparent"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </span>
                        ))}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <input
                            type="text"
                            value={viewName}
                            onChange={(e) => setViewName(e.target.value)}
                            placeholder="Vaizdo pavadinimas (pvz. Danfoss žemos maržos)"
                            aria-label="Naujo vaizdo pavadinimas"
                            data-testid="admin-save-view-name"
                            className="h-9 w-full sm:w-72 px-2.5 rounded-lg border border-[#D5CFC3] bg-white"
                        />
                        <button
                            type="button"
                            onClick={handleSaveView}
                            data-testid="admin-save-view-btn"
                            className="h-9 px-3.5 rounded-lg border border-[#11161B] bg-white hover:bg-[#11161B] hover:text-white text-[#11161B] font-bold inline-flex items-center gap-1.5 cursor-pointer"
                        >
                            <Star className="w-3.5 h-3.5" />
                            <span>Įrašyti dabartinį vaizdą</span>
                        </button>
                        {viewNotice && <span className="text-[#5B6470] font-semibold">{viewNotice}</span>}
                    </div>
                </div>

                {/* 3) Search & Filter Bar */}
                <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3 text-xs">
                    <div className="relative">
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => {
                                setQuery(e.target.value);
                                fetchProducts(e.target.value, brandFilter, stockFilter);
                            }}
                            placeholder="Ieškoti pagal SKU, EAN ar pavadinimą (pvz. 013G2990, MPB-NANI-35)..."
                            className="w-full h-10 pl-9 pr-3 rounded-lg border border-[#D5CFC3] bg-white"
                        />
                        <Search className="w-4 h-4 text-[#5B6470] absolute left-3 top-3" />
                    </div>
                    <select
                        value={brandFilter}
                        onChange={(e) => {
                            setBrandFilter(e.target.value);
                            fetchProducts(query, e.target.value, stockFilter);
                        }}
                        className="h-10 px-3 rounded-lg border border-[#D5CFC3] bg-white font-semibold"
                    >
                        <option value="visi">Visi gamintojai ({totalCatalogCount})</option>
                        {brands.map((b) => (
                            <option key={b.slug} value={b.slug}>
                                {b.name} ({b.productCount})
                            </option>
                        ))}
                    </select>
                    <select
                        value={stockFilter}
                        onChange={(e) => {
                            setStockFilter(e.target.value);
                            fetchProducts(query, brandFilter, e.target.value);
                        }}
                        className="h-10 px-3 rounded-lg border border-[#D5CFC3] bg-white font-semibold"
                    >
                        <option value="all">Visos pozicijos ({matchedCount})</option>
                        <option value="low">Baigiasi Kauno sandėlyje (1–3 vnt.)</option>
                        <option value="low_margin">Žema marža (&lt;20% nuo savikainos)</option>
                    </select>
                    <div className="flex gap-2">
                        <input
                            type="number"
                            min={0}
                            value={priceMin ?? ''}
                            onChange={(e) => {
                                const v = e.target.value === '' ? null : Number(e.target.value);
                                setPriceMin(v);
                                fetchProducts(query, brandFilter, stockFilter, v, priceMax);
                            }}
                            placeholder="Kaina nuo €"
                            aria-label="Minimali kaina"
                            className="w-full h-10 px-2.5 rounded-lg border border-[#D5CFC3] bg-white"
                        />
                        <input
                            type="number"
                            min={0}
                            value={priceMax ?? ''}
                            onChange={(e) => {
                                const v = e.target.value === '' ? null : Number(e.target.value);
                                setPriceMax(v);
                                fetchProducts(query, brandFilter, stockFilter, priceMin, v);
                            }}
                            placeholder="Kaina iki €"
                            aria-label="Maksimali kaina"
                            className="w-full h-10 px-2.5 rounded-lg border border-[#D5CFC3] bg-white"
                        />
                    </div>
                </div>

                {/* W123-A1: Bulk editor with preview + undo */}
                <div
                    data-testid="admin-bulk-editor"
                    className="rounded-xl border border-[#E2DDD3] bg-[#FAF9F6] p-3.5 space-y-3 text-xs"
                >
                    <div className="flex flex-wrap items-center gap-3">
                        <label className="inline-flex items-center gap-2 font-bold text-[#11161B] cursor-pointer">
                            <input
                                type="checkbox"
                                checked={allVisibleSelected}
                                onChange={toggleSelectAll}
                                aria-label="Pasirinkti visas matomas prekes"
                                data-testid="admin-bulk-select-all"
                                className="w-4 h-4"
                            />
                            Pasirinkti viską
                        </label>
                        <span className="text-[#5B6470]">
                            Pasirinkta: <strong>{selectedSkus.size}</strong> SKU
                        </span>
                        <button
                            type="button"
                            disabled={selectedSkus.size === 0}
                            onClick={() => {
                                setBulkOpen((prev) => !prev);
                                setBulkPreview(null);
                            }}
                            data-testid="admin-bulk-open-btn"
                            className="h-9 px-3.5 rounded-lg border border-[#11161B] bg-white hover:bg-[#11161B] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed text-[#11161B] font-bold cursor-pointer"
                        >
                            Masinis redagavimas ({selectedSkus.size})
                        </button>
                        {undoPayload && (
                            <span
                                data-testid="admin-bulk-undo-toast"
                                className="inline-flex items-center gap-2 rounded-lg bg-[#FFF1D6] text-[#7A4A00] px-3 py-2 font-bold"
                            >
                                Paskutinis masinis keitimas aktyvus.
                                <button
                                    type="button"
                                    onClick={handleBulkUndo}
                                    data-testid="admin-bulk-undo-btn"
                                    className="h-7 px-2.5 rounded-md border border-[#7A4A00] bg-white hover:bg-[#7A4A00] hover:text-white font-bold cursor-pointer"
                                >
                                    Anuliuoti
                                </button>
                            </span>
                        )}
                    </div>

                    {bulkOpen && selectedSkus.size > 0 && (
                        <div className="space-y-3 border-t border-[#E2DDD3] pt-3">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 items-end">
                                <label className="flex flex-col gap-1 font-semibold">
                                    Operacija
                                    <select
                                        value={bulkKind}
                                        onChange={(e) => {
                                            setBulkKind(e.target.value as BulkEditOperation['kind']);
                                            setBulkPreview(null);
                                        }}
                                        className="h-9 px-2 rounded-lg border border-[#D5CFC3] bg-white font-semibold"
                                    >
                                        <option value="price_percent">Kainos pokytis (+/- %)</option>
                                        <option value="price_set">Nustatyti kainą (€ su PVM)</option>
                                        <option value="availability">Likutis (vnt.)</option>
                                        <option value="category">Kategorija</option>
                                    </select>
                                </label>
                                {bulkKind === 'price_percent' && (
                                    <label className="flex flex-col gap-1 font-semibold">
                                        Pokytis (%)
                                        <input
                                            type="number"
                                            step="0.5"
                                            value={bulkPercent}
                                            onChange={(e) => {
                                                setBulkPercent(Number(e.target.value));
                                                setBulkPreview(null);
                                            }}
                                            data-testid="admin-bulk-percent-input"
                                            className="h-9 px-2.5 rounded-lg border border-[#D5CFC3] bg-white font-bold"
                                        />
                                    </label>
                                )}
                                {bulkKind === 'price_set' && (
                                    <label className="flex flex-col gap-1 font-semibold">
                                        Kaina su PVM (€)
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={bulkPriceSet}
                                            onChange={(e) => {
                                                setBulkPriceSet(Number(e.target.value));
                                                setBulkPreview(null);
                                            }}
                                            className="h-9 px-2.5 rounded-lg border border-[#D5CFC3] bg-white font-bold"
                                        />
                                    </label>
                                )}
                                {bulkKind === 'availability' && (
                                    <label className="flex flex-col gap-1 font-semibold">
                                        Likutis (vnt.)
                                        <input
                                            type="number"
                                            min={0}
                                            value={bulkStock}
                                            onChange={(e) => {
                                                setBulkStock(Number(e.target.value));
                                                setBulkPreview(null);
                                            }}
                                            className="h-9 px-2.5 rounded-lg border border-[#D5CFC3] bg-white font-bold"
                                        />
                                    </label>
                                )}
                                {bulkKind === 'category' && (
                                    <label className="flex flex-col gap-1 font-semibold">
                                        Kategorija
                                        <input
                                            type="text"
                                            value={bulkCategory}
                                            onChange={(e) => {
                                                setBulkCategory(e.target.value);
                                                setBulkPreview(null);
                                            }}
                                            className="h-9 px-2.5 rounded-lg border border-[#D5CFC3] bg-white"
                                        />
                                    </label>
                                )}
                                <button
                                    type="button"
                                    onClick={handleBulkPreview}
                                    data-testid="admin-bulk-preview-btn"
                                    className="h-9 px-4 rounded-lg bg-[#11161B] hover:bg-[#C2410C] text-white font-bold cursor-pointer"
                                >
                                    Peržiūrėti pakeitimus
                                </button>
                            </div>

                            {bulkPreview && (
                                <div className="space-y-2" data-testid="admin-bulk-preview-table">
                                    <div className="flex flex-wrap items-center gap-3 font-semibold text-[#11161B]">
                                        <span>Peržiūra ({bulkPreview.diffs.length} SKU):</span>
                                        <span className="text-[#0F5A2B]">
                                            Taikytina: {bulkPreview.applicableCount}
                                        </span>
                                        {bulkPreview.blockedCount > 0 && (
                                            <span className="text-[#8A2F07]">
                                                Užblokuota maržos apsaugos (&lt;15%): {bulkPreview.blockedCount}
                                            </span>
                                        )}
                                    </div>
                                    <div className="space-y-1.5 max-h-56 overflow-y-auto">
                                        {bulkPreview.diffs.map((d: BulkEditDiff) => (
                                            <div
                                                key={d.sku}
                                                className={`rounded-lg border px-3 py-2 flex flex-wrap items-center gap-x-3 gap-y-1 ${
                                                    d.blocked
                                                        ? 'border-[#F3C9AE] bg-[#FBEADF] text-[#8A2F07]'
                                                        : 'border-[#E2DDD3] bg-white text-[#11161B]'
                                                }`}
                                            >
                                                <span className="font-mono font-bold shrink-0">{d.sku}</span>
                                                <span className="min-w-0 flex-1 truncate">{d.name}</span>
                                                <span className="shrink-0">
                                                    {d.field === 'priceGrossEur' ? 'Kaina: ' : d.field === 'stockQuantity' ? 'Likutis: ' : 'Kategorija: '}
                                                    {typeof d.before === 'number' ? d.before.toFixed(2) : d.before} →{' '}
                                                    <strong>
                                                        {typeof d.after === 'number' ? d.after.toFixed(2) : d.after}
                                                    </strong>
                                                </span>
                                                {d.field === 'priceGrossEur' && (
                                                    <span className={`shrink-0 font-bold ${d.blocked ? '' : 'text-[#0F5A2B]'}`}>
                                                        {d.blocked
                                                            ? `${d.marginAfterPct.toFixed(1)}% marža, užblokuota`
                                                            : `marža ${d.marginBeforePct.toFixed(1)}% → ${d.marginAfterPct.toFixed(1)}%`}
                                                    </span>
                                                )}
                                                {d.blocked && d.field !== 'priceGrossEur' && (
                                                    <span className="shrink-0 font-bold">{d.blockReason}</span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleBulkApply}
                                        disabled={bulkPreview.applicableCount === 0}
                                        data-testid="admin-bulk-apply-btn"
                                        className="h-9 px-4 rounded-lg bg-[#157A3B] hover:bg-[#0F5A2B] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold cursor-pointer"
                                    >
                                        Taikyti ({bulkPreview.applicableCount} SKU)
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* 4) Persistent Inline Product Editor Cards/Rows (Zero Horizontal Scroll on Mobile & Desktop) */}
                <div className="space-y-2.5">
                    {items.map((row) => {
                        const draft = draftEdits[row.sku] || {
                            name: row.name,
                            priceGrossEur: row.priceGrossEur,
                            costPriceEur: row.costPriceEur,
                            stockQuantity: row.stockQuantity,
                            published: row.published,
                        };
                        const netEur = draft.priceGrossEur / 1.21;
                        const liveMargin =
                            netEur > 0
                                ? Math.round(((netEur - draft.costPriceEur) / netEur) * 1000) / 10
                                : 0;
                        const marginBadgeClass =
                            liveMargin >= 25
                                ? 'bg-[#E3F1E8] text-[#0F5A2B]'
                                : liveMargin >= 15
                                  ? 'bg-[#FFF1D6] text-[#7A4A00]'
                                  : 'bg-[#FBEADF] text-[#8A2F07]';

                        return (
                            <div
                                key={row.id}
                                className="rounded-xl border border-[#E2DDD3] bg-[#FAF9F6] p-3.5 grid grid-cols-1 lg:grid-cols-12 gap-3 items-center text-xs"
                            >
                                <div className="lg:col-span-4 space-y-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={selectedSkus.has(row.sku)}
                                            onChange={() => toggleSelected(row.sku)}
                                            aria-label={`Pasirinkti ${row.sku} masiniam redagavimui`}
                                            data-testid={`admin-bulk-row-${row.sku}`}
                                            className="w-4 h-4 shrink-0"
                                        />
                                        <span className="font-mono font-bold text-[#C2410C]">
                                            {row.sku}
                                        </span>
                                        <span className="text-[#5B6470]">
                                            {row.brandName} · EAN {row.ean}
                                        </span>
                                        <span
                                            className={`px-2 py-0.5 rounded-full font-bold ${marginBadgeClass}`}
                                        >
                                            Marža: {liveMargin.toFixed(1)}%
                                        </span>
                                    </div>
                                    <input
                                        type="text"
                                        aria-label={`Pavadinimas ${row.sku}`}
                                        value={draft.name}
                                        onChange={(e) =>
                                            setDraftEdits((prev) => ({
                                                ...prev,
                                                [row.sku]: { ...draft, name: e.target.value },
                                            }))
                                        }
                                        className="w-full h-9 px-2.5 rounded-lg border border-[#D5CFC3] bg-white font-semibold text-[#11161B]"
                                    />
                                </div>

                                <div className="lg:col-span-2">
                                    <label className="flex flex-col gap-0.5 font-semibold text-[#5B6470]">
                                        Kaina su PVM (€)
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={draft.priceGrossEur}
                                            onChange={(e) =>
                                                setDraftEdits((prev) => ({
                                                    ...prev,
                                                    [row.sku]: {
                                                        ...draft,
                                                        priceGrossEur: Number(e.target.value),
                                                    },
                                                }))
                                            }
                                            className="h-9 px-2.5 rounded-lg border border-[#D5CFC3] bg-white font-bold text-[#11161B]"
                                        />
                                    </label>
                                </div>

                                <div className="lg:col-span-2">
                                    <label className="flex flex-col gap-0.5 font-semibold text-[#5B6470]">
                                        Savikaina be PVM (€)
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={draft.costPriceEur}
                                            onChange={(e) =>
                                                setDraftEdits((prev) => ({
                                                    ...prev,
                                                    [row.sku]: {
                                                        ...draft,
                                                        costPriceEur: Number(e.target.value),
                                                    },
                                                }))
                                            }
                                            className="h-9 px-2.5 rounded-lg border border-[#D5CFC3] bg-white font-semibold text-[#11161B]"
                                        />
                                    </label>
                                </div>

                                <div className="lg:col-span-2">
                                    <label className="flex flex-col gap-0.5 font-semibold text-[#5B6470]">
                                        Likutis Kaune (vnt.)
                                        <input
                                            type="number"
                                            value={draft.stockQuantity}
                                            onChange={(e) =>
                                                setDraftEdits((prev) => ({
                                                    ...prev,
                                                    [row.sku]: {
                                                        ...draft,
                                                        stockQuantity: Number(e.target.value),
                                                    },
                                                }))
                                            }
                                            className="h-9 px-2.5 rounded-lg border border-[#D5CFC3] bg-white font-bold text-[#11161B]"
                                        />
                                    </label>
                                </div>

                                <div className="lg:col-span-2 flex flex-wrap items-center justify-between lg:justify-end gap-2 pt-1 lg:pt-4">
                                    <select
                                        aria-label={`Būsena ${row.sku}`}
                                        value={draft.published ? 'active' : 'hidden'}
                                        onChange={(e) =>
                                            setDraftEdits((prev) => ({
                                                ...prev,
                                                [row.sku]: {
                                                    ...draft,
                                                    published: e.target.value === 'active',
                                                },
                                            }))
                                        }
                                        className="h-9 px-2 rounded-lg border border-[#D5CFC3] bg-white font-semibold text-[#11161B]"
                                    >
                                        <option value="active">Aktyvi</option>
                                        <option value="hidden">Paslėpta</option>
                                    </select>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setEditingFullProduct(row);
                                            setFullSubcategory(
                                                row.subcategory ||
                                                    'Termostatiniai ir balansiniai mazgai',
                                            );
                                            setFullPromoGross(
                                                row.promoPriceEur ? String(row.promoPriceEur) : '',
                                            );
                                            setFullWeightKg(row.weightKg ?? 4.5);
                                            setFullDeliveryClass(
                                                row.deliveryClass || 'Paštomatas <30kg',
                                            );
                                            setFullApvaEligible(Boolean(row.apvaEligible));
                                            setFullBoilerTags(
                                                row.boilerCompatibilityTags?.join(', ') ||
                                                    'Viadrus U22, Kalvis 2-16, Atmos',
                                            );
                                            setFullDescriptionLt(
                                                row.description || row.descriptionLt || '',
                                            );
                                            setFullCompatibilityNote(row.compatibilityNote || '');
                                            setFullKitContentsText(
                                                Array.isArray(row.kitContents)
                                                    ? row.kitContents.join('\n')
                                                    : '',
                                            );
                                        }}
                                        className="h-9 px-2.5 rounded-lg border border-[#D5CFC3] bg-white hover:border-[#11161B] text-[#11161B] font-semibold cursor-pointer"
                                    >
                                        Kortelė
                                    </button>
                                    <button
                                        type="button"
                                        data-testid="admin-save-product-btn"
                                        onClick={() => handleSaveProductRow(row.sku)}
                                        className="h-9 px-3.5 rounded-lg bg-[#157A3B] hover:bg-[#0F5A2B] text-white font-bold cursor-pointer"
                                    >
                                        Išsaugoti
                                    </button>
                                </div>
                            </div>
                        );
                     })}
                </div>

                {/* W123-A1: chatter-style audit log */}
                <AdminActivityLogPanel refreshKey={activityRefreshKey} />
            </div>
        </div>
    );
}
