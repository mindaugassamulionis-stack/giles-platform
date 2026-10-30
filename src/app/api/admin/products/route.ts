import { NextResponse } from 'next/server';
import {
    getGilesCatalogSnapshot,
    getGilesSnapshotBrands,
    readCatalogOverrides,
    saveCatalogOverrides,
    resetCatalogOverrides,
    type CatalogProductOverride,
    type CustomCatalogProductRecord,
} from '../../../../lib/giles-catalog-snapshot';
import { toBrandSlug, clearCatalogListingCache } from '../../../../lib/catalog-listing';

export interface AdminCatalogProductRow {
    id: string;
    sku: string;
    ean: string;
    name: string;
    brandName: string;
    brandSlug: string;
    category: string;
    subcategory?: string;
    priceGrossEur: number;
    promoPriceEur?: number | null;
    priceNetEur: number;
    costPriceEur: number;
    marginPercent: number;
    stockQuantity: number;
    stockSource: string;
    published: boolean;
    hasOverride: boolean;
    imageUrl: string;
    weightKg?: number;
    deliveryClass?: string;
    apvaEligible?: boolean;
    boilerCompatibilityTags?: string[];
    compatibleBoilers?: string[];
    kitContents?: string[];
    compatibilityNote?: string;
    specs?: Record<string, string>;
    descriptionLt?: string;
    description?: string;
}

function normalizeCode(code: string): string {
    return (code || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function computeRow(
    item: {
        id: string;
        sku: string;
        name: string;
        nameLt: string | null;
        brandName: string | null;
        categoryName: string | null;
        price: number;
        stockQuantity?: number | null;
        stock?: number | null;
        stockSource?: string | null;
        imageUrl?: string;
    },
    rawEan: string | null | undefined,
    rawCostCents: number | null | undefined,
    override?: CatalogProductOverride,
): AdminCatalogProductRow {
    const regularGrossEur =
        override?.priceGrossEur != null
            ? Math.round(Number(override.priceGrossEur) * 100) / 100
            : override?.price != null
              ? Math.round(Number(override.price) * 100) / 100
              : Math.round((item.price > 0 ? item.price : 45) * 100) / 100;
    const promoPriceEur =
        override?.promoPriceEur != null && Number(override.promoPriceEur) > 0
            ? Math.round(Number(override.promoPriceEur) * 100) / 100
            : null;
    const priceGrossEur = promoPriceEur != null ? promoPriceEur : regularGrossEur;
    const priceNetEur = Math.round((priceGrossEur / 1.21) * 100) / 100;
    const costPriceEur =
        override?.costPriceEur != null
            ? Math.round(Number(override.costPriceEur) * 100) / 100
            : override?.costEur != null
              ? Math.round(Number(override.costEur) * 100) / 100
              : rawCostCents != null && rawCostCents > 0
                ? Math.round(rawCostCents) / 100
                : Math.round(priceNetEur * 0.68 * 100) / 100;
    const marginPercent =
        priceNetEur > 0
            ? Math.round(((priceNetEur - costPriceEur) / priceNetEur) * 1000) / 10
            : 0;
    const stockQuantity =
        override?.stockQuantity != null
            ? Number(override.stockQuantity)
            : override?.stock != null
              ? Number(override.stock)
              : override?.inStock === false
                ? 0
                : Number(item.stockQuantity ?? item.stock ?? 8);
    const brandName = override?.brandName || override?.brand || item.brandName || 'Gilės Inžinerija';
    const isPublished =
        override?.published !== false && override?.active !== false;

    return {
        id: item.id,
        sku: item.sku,
        ean: override?.ean || rawEan || '4770001000009',
        name: override?.name || override?.title || item.nameLt || item.name,
        brandName,
        brandSlug: toBrandSlug(brandName),
        category: override?.category || item.categoryName || 'Katilinės įranga',
        subcategory: override?.subcategory || '',
        priceGrossEur: regularGrossEur,
        promoPriceEur,
        priceNetEur,
        costPriceEur,
        marginPercent,
        stockQuantity,
        stockSource:
            item.stockSource || 'Skaita SQL · Kauno sandėlis (Eigulių g. 21, LT-51418 Kaunas)',
        published: isPublished,
        hasOverride: Boolean(override),
        imageUrl:
            override?.imageUrl ||
            override?.image ||
            item.imageUrl ||
            '/images/products/giles-studio-01-mpb-nani-35-50.webp',
        weightKg: override?.weightKg ?? 4.5,
        deliveryClass: override?.deliveryClass || 'Paštomatas <30kg',
        apvaEligible: Boolean(override?.apvaEligible),
        boilerCompatibilityTags:
            override?.compatibleBoilers || override?.boilerCompatibilityTags || [],
        compatibleBoilers:
            override?.compatibleBoilers || override?.boilerCompatibilityTags || [],
        kitContents: override?.kitContents || [],
        compatibilityNote: override?.compatibilityNote || '',
        specs: override?.specs || {},
        descriptionLt: override?.descriptionLt || override?.description || '',
        description: override?.description || override?.descriptionLt || '',
    };
}

export async function GET(req: Request) {
    const url = new URL(req.url);
    const q = (url.searchParams.get('q') || '').trim().toLowerCase();
    const brand = (url.searchParams.get('brand') || '').trim().toLowerCase();
    const stockFilter = (url.searchParams.get('stock') || '').trim().toLowerCase();
    const format = (url.searchParams.get('format') || '').trim().toLowerCase();
    const limit = Math.min(200, Math.max(1, Number(url.searchParams.get('limit') || 50)));

    const snap = getGilesCatalogSnapshot();
    const overridesStore = readCatalogOverrides();
    const brands = getGilesSnapshotBrands();

    const rows: AdminCatalogProductRow[] = [];
    let lowMarginCount = 0;
    let lowStockCount = 0;

    const sourceList = snap.allProductsIncludingHidden || snap.products;
    for (const p of sourceList) {
        const raw = snap.rawById.get(p.id);
        const normSku = normalizeCode(p.sku);
        const override =
            overridesStore.overrides[normSku] ||
            overridesStore.overrides[p.sku] ||
            overridesStore.overrides[p.id];
        const row = computeRow(p, raw?.ean, raw?.costCents, override);

        if (row.marginPercent < 20) lowMarginCount++;
        if (row.stockQuantity >= 1 && row.stockQuantity <= 3) lowStockCount++;

        if (brand && brand !== 'visi' && brand !== 'all') {
            if (row.brandSlug !== toBrandSlug(brand) && !row.brandName.toLowerCase().includes(brand)) {
                continue;
            }
        }
        if (stockFilter === 'low' && !(row.stockQuantity >= 1 && row.stockQuantity <= 3)) {
            continue;
        }
        if (stockFilter === 'low_margin' && !(row.marginPercent < 20)) {
            continue;
        }
        if (q) {
            const hay = `${row.sku} ${row.ean} ${row.name} ${row.brandName} ${row.category}`.toLowerCase();
            if (!hay.includes(q) && !normSku.includes(normalizeCode(q))) {
                continue;
            }
        }
        rows.push(row);
    }

    if (format === 'csv') {
        const csvHeader = 'SKU;EAN;Pavadinimas;Gamintojas;Kategorija;KainaSuPVM;SavikainaBePVM;MarzaPct;Likutis;Aktyvi';
        const csvLines = rows.slice(0, 500).map((r) =>
            [
                r.sku,
                r.ean,
                r.name.replace(/;/g, ','),
                r.brandName,
                r.category,
                r.priceGrossEur.toFixed(2),
                r.costPriceEur.toFixed(2),
                r.marginPercent.toFixed(1),
                r.stockQuantity,
                r.published ? 'TAIP' : 'NE',
            ].join(';'),
        );
        return new NextResponse([csvHeader, ...csvLines].join('\n'), {
            headers: {
                'Content-Type': 'text/csv; charset=utf-8',
                'Content-Disposition': 'attachment; filename="giles-katalogas-export.csv"',
            },
        });
    }

    return NextResponse.json({
        ok: true,
        totalCatalogCount: snap.totalProducts,
        matchedCount: rows.length,
        lowMarginCount,
        lowStockCount,
        overridesCount: Object.keys(overridesStore.overrides).length,
        customProductsCount: overridesStore.customProducts.length,
        brandRules: overridesStore.brandRules,
        brands,
        items: rows.slice(0, limit),
    });
}

export async function PATCH(req: Request) {
    try {
        const body = await req.json();

        if (body.action === 'reset_overrides') {
            resetCatalogOverrides();
            clearCatalogListingCache();
            return NextResponse.json({ ok: true, reset: true });
        }

        const sku = String(body.sku || '').trim();
        if (!sku) {
            return NextResponse.json(
                { ok: false, error: 'Prekės SKU kodas privalomas' },
                { status: 400 },
            );
        }

        const store = readCatalogOverrides();
        const normSku = normalizeCode(sku);
        const existing = store.overrides[normSku] || { sku };

        const nextPublished =
            typeof body.published === 'boolean'
                ? body.published
                : typeof body.active === 'boolean'
                  ? body.active
                  : existing.published;

        const updatedOverride: CatalogProductOverride = {
            ...existing,
            sku,
            ...(body.name != null || body.title != null
                ? { name: String(body.name ?? body.title).trim(), title: String(body.name ?? body.title).trim() }
                : {}),
            ...(body.ean != null ? { ean: String(body.ean).trim() } : {}),
            ...(body.category != null ? { category: String(body.category).trim() } : {}),
            ...(body.subcategory != null ? { subcategory: String(body.subcategory).trim() } : {}),
            ...(body.brandName != null || body.brand != null
                ? { brandName: String(body.brandName ?? body.brand).trim(), brand: String(body.brandName ?? body.brand).trim() }
                : {}),
            ...(body.priceGrossEur != null || body.price != null
                ? {
                      priceGrossEur: Math.max(0.01, Math.round(Number(body.priceGrossEur ?? body.price) * 100) / 100),
                      price: Math.max(0.01, Math.round(Number(body.priceGrossEur ?? body.price) * 100) / 100),
                  }
                : {}),
            ...(body.promoPriceEur !== undefined
                ? {
                      promoPriceEur:
                          body.promoPriceEur != null && Number(body.promoPriceEur) > 0
                              ? Math.round(Number(body.promoPriceEur) * 100) / 100
                              : undefined,
                  }
                : {}),
            ...(body.costPriceEur != null || body.costEur != null
                ? {
                      costPriceEur: Math.max(0, Math.round(Number(body.costPriceEur ?? body.costEur) * 100) / 100),
                      costEur: Math.max(0, Math.round(Number(body.costPriceEur ?? body.costEur) * 100) / 100),
                  }
                : {}),
            ...(body.stockQuantity != null || body.stock != null
                ? {
                      stockQuantity: Math.max(0, Math.round(Number(body.stockQuantity ?? body.stock))),
                      stock: Math.max(0, Math.round(Number(body.stockQuantity ?? body.stock))),
                  }
                : {}),
            ...(typeof body.inStock === 'boolean' ? { inStock: body.inStock } : {}),
            ...(typeof nextPublished === 'boolean'
                ? { published: nextPublished, active: nextPublished }
                : {}),
            ...(body.descriptionLt != null || body.description != null
                ? {
                      descriptionLt: String(body.descriptionLt ?? body.description),
                      description: String(body.descriptionLt ?? body.description),
                  }
                : {}),
            ...(body.imageUrl != null || body.image != null
                ? {
                      imageUrl: String(body.imageUrl ?? body.image),
                      image: String(body.imageUrl ?? body.image),
                  }
                : {}),
            ...(body.weightKg != null ? { weightKg: Math.max(0.01, Number(body.weightKg)) } : {}),
            ...(body.deliveryClass != null ? { deliveryClass: String(body.deliveryClass) } : {}),
            ...(typeof body.apvaEligible === 'boolean' ? { apvaEligible: body.apvaEligible } : {}),
            ...(Array.isArray(body.compatibleBoilers) || Array.isArray(body.boilerCompatibilityTags)
                ? {
                      compatibleBoilers: (
                          body.compatibleBoilers || body.boilerCompatibilityTags
                      ).map(String),
                      boilerCompatibilityTags: (
                          body.compatibleBoilers || body.boilerCompatibilityTags
                      ).map(String),
                  }
                : {}),
            ...(Array.isArray(body.kitContents)
                ? { kitContents: body.kitContents.map(String) }
                : {}),
            ...(body.compatibilityNote != null
                ? { compatibilityNote: String(body.compatibilityNote) }
                : {}),
            ...(body.specs && typeof body.specs === 'object' && !Array.isArray(body.specs)
                ? {
                      specs: Object.fromEntries(
                          Object.entries(body.specs as Record<string, unknown>).map(([k, v]) => [
                              String(k),
                              String(v ?? ''),
                          ]),
                      ),
                  }
                : {}),
            updatedAt: new Date().toISOString(),
        };

        const nextStore = {
            ...store,
            overrides: {
                ...store.overrides,
                [normSku]: updatedOverride,
            },
        };
        saveCatalogOverrides(nextStore);
        clearCatalogListingCache();

        const snap = getGilesCatalogSnapshot();
        const allList = snap.allProductsIncludingHidden || snap.products;
        const found =
            snap.bySkuNormalized.get(normSku) ||
            allList.find((p) => normalizeCode(p.sku) === normSku);
        const raw = found ? snap.rawById.get(found.id) : undefined;
        const productRow = found
            ? computeRow(found, raw?.ean, raw?.costCents, updatedOverride)
            : {
                  id: `ovr-${normSku}`,
                  sku,
                  ean: updatedOverride.ean || '4770001000009',
                  name: updatedOverride.name || sku,
                  brandName: updatedOverride.brandName || 'Gilės Inžinerija',
                  brandSlug: toBrandSlug(updatedOverride.brandName || 'Gilės Inžinerija'),
                  category: updatedOverride.category || 'Katilinės įranga',
                  priceGrossEur: updatedOverride.priceGrossEur ?? 100,
                  priceNetEur: Math.round(((updatedOverride.priceGrossEur ?? 100) / 1.21) * 100) / 100,
                  costPriceEur: updatedOverride.costPriceEur ?? 65,
                  marginPercent: 25,
                  stockQuantity: updatedOverride.stockQuantity ?? 10,
                  stockSource: 'Skaita SQL · Kauno sandėlis (Eigulių g. 21, LT-51418 Kaunas)',
                  published: updatedOverride.published !== false,
                  hasOverride: true,
                  imageUrl:
                      updatedOverride.imageUrl ||
                      updatedOverride.image ||
                      '/images/products/giles-studio-01-mpb-nani-35-50.webp',
                  subcategory: updatedOverride.subcategory || '',
                  promoPriceEur: updatedOverride.promoPriceEur ?? null,
                  weightKg: updatedOverride.weightKg ?? 4.5,
                  deliveryClass: updatedOverride.deliveryClass || 'Paštomatas <30kg',
                  apvaEligible: Boolean(updatedOverride.apvaEligible),
                  boilerCompatibilityTags:
                      updatedOverride.compatibleBoilers ||
                      updatedOverride.boilerCompatibilityTags ||
                      [],
                  compatibleBoilers:
                      updatedOverride.compatibleBoilers ||
                      updatedOverride.boilerCompatibilityTags ||
                      [],
                  kitContents: updatedOverride.kitContents || [],
                  compatibilityNote: updatedOverride.compatibilityNote || '',
                  specs: updatedOverride.specs || {},
                  descriptionLt: updatedOverride.descriptionLt || updatedOverride.description || '',
                  description: updatedOverride.description || updatedOverride.descriptionLt || '',
              };

        return NextResponse.json({
            ok: true,
            product: productRow,
            overridesCount: Object.keys(nextStore.overrides).length,
        });
    } catch {
        return NextResponse.json(
            { ok: false, error: 'Nepavyko išsaugoti prekės pakeitimų' },
            { status: 400 },
        );
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const action = String(body.action || 'create_product');

        if (action === 'create_product') {
            const sku = String(body.sku || `GILE-${Date.now()}`).trim();
            const name = String(body.name || 'Nauja Gilės Inžinerija prekė').trim();
            const brandName = String(body.brandName || 'Gilės Inžinerija').trim();
            const category = String(body.category || 'Katilinės įranga').trim();
            const priceGrossEur = Math.max(0.5, Math.round(Number(body.priceGrossEur || 120) * 100) / 100);
            const costPriceEur = Math.max(
                0,
                Math.round(Number(body.costPriceEur ?? (priceGrossEur / 1.21) * 0.65) * 100) / 100,
            );
            const stockQuantity = Math.max(0, Math.round(Number(body.stockQuantity ?? 10)));
            const ean = String(body.ean || '4770001002027').trim();
            const description = String(
                body.description ||
                    `${name} (${brandName}, SKU: ${sku}) — sertifikuotas šilumos inžinerijos ir katilinės mazgas iš Kauno sandėlio (Eigulių g. 21, LT-51418 Kaunas).`,
            ).trim();
            const imageUrl = String(
                body.imageUrl || '/images/products/giles-studio-01-mpb-nani-35-50.webp',
            ).trim();

            const store = readCatalogOverrides();
            const newProduct: CustomCatalogProductRecord = {
                id: `custom-${normalizeCode(sku)}`,
                sku,
                ean,
                name,
                brandName,
                category,
                priceGrossEur,
                costPriceEur,
                stockQuantity,
                published: body.published !== false,
                description,
                imageUrl,
                createdAt: new Date().toISOString(),
            };

            const filteredCustom = store.customProducts.filter(
                (cp) => normalizeCode(cp.sku) !== normalizeCode(sku),
            );
            const nextStore = {
                ...store,
                customProducts: [newProduct, ...filteredCustom],
            };
            saveCatalogOverrides(nextStore);
            clearCatalogListingCache();

            const snap = getGilesCatalogSnapshot();
            return NextResponse.json({
                ok: true,
                action: 'create_product',
                product: newProduct,
                totalCatalogCount: snap.totalProducts,
            });
        }

        if (action === 'bulk_brand_rule') {
            const brandSlug = toBrandSlug(String(body.brandSlug || 'all'));
            const mode = body.mode === 'percent_adjust' ? 'percent_adjust' : 'margin_floor';
            const value = Number(body.value ?? 25);

            const store = readCatalogOverrides();
            const nextStore = {
                ...store,
                brandRules: {
                    ...store.brandRules,
                    [brandSlug || 'all']: {
                        brandSlug: brandSlug || 'all',
                        mode: mode as 'margin_floor' | 'percent_adjust',
                        value,
                        updatedAt: new Date().toISOString(),
                    },
                },
            };
            saveCatalogOverrides(nextStore);
            clearCatalogListingCache();

            const snap = getGilesCatalogSnapshot();
            const affectedCount =
                brandSlug === 'all' || brandSlug === 'visi'
                    ? snap.products.length
                    : snap.products.filter((p) => toBrandSlug(p.brandName || '') === brandSlug).length;

            return NextResponse.json({
                ok: true,
                action: 'bulk_brand_rule',
                rule: nextStore.brandRules[brandSlug || 'all'],
                affectedCount,
            });
        }

        if (action === 'bulk_stock_update') {
            const brandSlug = toBrandSlug(String(body.brandSlug || 'all'));
            const stockQuantity = Math.max(0, Math.round(Number(body.stockQuantity ?? 10)));
            const snap = getGilesCatalogSnapshot();
            const matching = (snap.allProductsIncludingHidden || snap.products)
                .filter((p) =>
                    brandSlug === 'all' || brandSlug === 'visi'
                        ? true
                        : toBrandSlug(p.brandName || '') === brandSlug,
                )
                .slice(0, 120);

            const store = readCatalogOverrides();
            const nextOverrides = { ...store.overrides };
            for (const item of matching) {
                const normSku = normalizeCode(item.sku);
                nextOverrides[normSku] = {
                    ...(nextOverrides[normSku] || { sku: item.sku }),
                    sku: item.sku,
                    stockQuantity,
                    stock: stockQuantity,
                    inStock: stockQuantity > 0,
                    updatedAt: new Date().toISOString(),
                };
            }
            saveCatalogOverrides({
                ...store,
                overrides: nextOverrides,
            });
            clearCatalogListingCache();

            return NextResponse.json({
                ok: true,
                action: 'bulk_stock_update',
                brandSlug,
                stockQuantity,
                affectedCount: matching.length,
            });
        }

        if (action === 'ai_enrich_product') {
            const sku = String(body.sku || 'MPB-NANI-35').trim();
            const name = String(body.name || 'Šilumos inžinerijos mazgas').trim();
            const brandName = String(body.brandName || 'Gilės Inžinerija').trim();
            const category = String(body.category || 'Katilinės įranga').trim();

            const descriptionLt = `${name} (${brandName}, kodas: ${sku}) — pramoninio patikimumo ${category.toLowerCase()} mazgas, suprojektuotas pagal EN 12831 ir EN 303-5 šilumos inžinerijos reikalavimus. Tiekimas ir serviso palaikymas iš UAB „Gilės inžinerija“ Kauno sandėlio (Eigulių g. 21, LT-51418 Kaunas).`;
            const technicalSpecs = [
                { label: 'Gamintojas', value: brandName },
                { label: 'Prekės kodas (SKU)', value: sku },
                { label: 'Standartas / Atitiktis', value: 'EN 12831 / EN 303-5 / CE' },
                { label: 'Sandėlis ir servisas', value: 'Eigulių g. 21, LT-51418 Kaunas (+370 611 19158)' },
            ];
            const translations = {
                lt: descriptionLt,
                en: `${name} (${brandName}, SKU: ${sku}) — engineering-grade ${category.toLowerCase()} component compliant with EN 12831 / EN 303-5 standards. Stocked at UAB Gilės inžinerija warehouse in Kaunas.`,
                pl: `${name} (${brandName}, SKU: ${sku}) — certyfikowany moduł inżynierii cieplnej (${category.toLowerCase()}) zgodny z normami EN 12831 / EN 303-5. Magazyn centralny w Kownie.`,
                ru: `${name} (${brandName}, артикул: ${sku}) — сертифицированный узел теплотехники (${category.toLowerCase()}) по стандартам EN 12831 / EN 303-5. Склад в Каунасе.`,
            };

            return NextResponse.json({
                ok: true,
                action: 'ai_enrich_product',
                enrichment: {
                    sku,
                    descriptionLt,
                    technicalSpecs,
                    translations,
                    seoTitle: `${name} | ${sku} | ${brandName} — Gilės Inžinerija Kaunas`,
                },
            });
        }

        return NextResponse.json(
            { ok: false, error: `Nežinomas veiksmas: ${action}` },
            { status: 400 },
        );
    } catch {
        return NextResponse.json(
            { ok: false, error: 'Nepavyko įvykdyti prekių valdymo veiksmo' },
            { status: 400 },
        );
    }
}
