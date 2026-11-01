'use client';

import { useState, useEffect } from 'react';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { AppLocale } from '../i18n/routing';

export const COMPARE_STORAGE_KEY = 'giles_compare_v1';
export const MAX_COMPARE_ITEMS = 4;

const memoryStorageMap = new Map<string, string>();
const safeStorage = {
    getItem: (name: string): string | null => {
        if (typeof window !== 'undefined' && window.localStorage) {
            try {
                return window.localStorage.getItem(name);
            } catch {
                // fallback
            }
        }
        return memoryStorageMap.get(name) ?? null;
    },
    setItem: (name: string, value: string): void => {
        if (typeof window !== 'undefined' && window.localStorage) {
            try {
                window.localStorage.setItem(name, value);
                return;
            } catch {
                // fallback
            }
        }
        memoryStorageMap.set(name, value);
    },
    removeItem: (name: string): void => {
        if (typeof window !== 'undefined' && window.localStorage) {
            try {
                window.localStorage.removeItem(name);
                return;
            } catch {
                // fallback
            }
        }
        memoryStorageMap.delete(name);
    },
};

export interface CompareItem {
    id: string;
    slug?: string | null;
    sku?: string;
    name: string;
    brand?: string | null;
    price: number;
    image?: string;
    categoryName?: string | null;
    subCategoryName?: string | null;
    stockQty?: number | null;
    stockStatus?: string;
    specs?: string[];
    /** W121-A2: priceless rows compare with an RFQ CTA instead of a price. */
    priceOnRequest?: boolean;
    addedAt?: number;
}

export interface ExtractedCompareTechnicalSpecs {
    powerKw: string;
    dimensionsOrConnection: string;
    fuelOrRefrigerant: string;
    warranty: string;
    apvaEligible: boolean;
    apvaEligibilityLabel: string;
    stockWarehouseLabel: string;
    subCategoryLabel: string;
}

export interface CompareMatrixRow {
    key: string;
    label: string;
    values: string[];
}

export function extractCompareTechnicalSpecs(
    item: CompareItem,
    locale: AppLocale = 'lt',
): ExtractedCompareTechnicalSpecs {
    const combinedText = [
        item.name || '',
        item.sku || '',
        item.categoryName || '',
        item.subCategoryName || '',
        ...(item.specs || []),
    ].join(' ');

    // 1. Power (Galia kW / W / L)
    const kwRangeMatch = combinedText.match(/(\d+(?:[.,]\d+)?\s*[–-]\s*\d+(?:[.,]\d+)?\s*kW)/i);
    const kwSingleMatch = combinedText.match(/(\d+(?:[.,]\d+)?\s*kW)/i);
    const wattMatch = combinedText.match(/(\d{3,5}\s*W)\b/i);
    const literMatch = combinedText.match(/(\d{2,4}\s*(?:L|l))\b/);

    let powerKw = '—';
    if (kwRangeMatch) {
        powerKw = kwRangeMatch[1]!.replace('-', '–');
    } else if (kwSingleMatch) {
        powerKw = kwSingleMatch[1]!;
    } else if (wattMatch) {
        const watts = parseInt(wattMatch[1]!.replace(/\D/g, ''), 10);
        powerKw = `${(watts / 1000).toFixed(2).replace('.', ',')} kW (${wattMatch[1]})`;
    } else if (literMatch) {
        powerKw = `${literMatch[1]!.toUpperCase()} (${
            locale === 'en' ? 'Volume' : locale === 'pl' ? 'Pojemność' : locale === 'ru' ? 'Объем' : 'Tūris'
        })`;
    } else {
        powerKw =
            locale === 'en'
                ? 'Hydronic component (PN10/PN16)'
                : locale === 'pl'
                  ? 'Armatura hydrauliczna (PN10/PN16)'
                  : locale === 'ru'
                    ? 'Гидравлический узел (PN10/PN16)'
                    : 'Hidraulinis mazgas (PN10/PN16)';
    }

    // 2. Dimensions / Connection (DN / mm / G inch)
    const dnMatch = combinedText.match(/\b(DN\s*\d{2,3})\b/i);
    const diaMatch = combinedText.match(/(Ø\s*\d{2,3}\s*mm)/i);
    const threadMatch = combinedText.match(/\b(G\s*\d\/\d"|1\/2"|3\/4"|1"|1\s*1\/4"|M30\s*x\s*1[.,]5|RA\s*Click)\b/i);
    const mmMatch = combinedText.match(/\b(\d{2,4}\s*mm)\b/i);
    const loopsMatch = combinedText.match(/(\d+\s*(?:kontūr\w*|loops|obieg\w*|контур\w*))/i);

    const connParts: string[] = [];
    if (dnMatch) connParts.push(dnMatch[1]!.toUpperCase().replace(/\s+/g, ''));
    if (diaMatch) connParts.push(diaMatch[1]!);
    if (threadMatch) connParts.push(threadMatch[1]!);
    if (mmMatch && !diaMatch) connParts.push(mmMatch[1]!);
    if (loopsMatch) connParts.push(loopsMatch[1]!);

    const dimensionsOrConnection =
        connParts.length > 0
            ? connParts.slice(0, 2).join(' · ')
            : /katil|degikl|mpb|pv-|katri/i.test(combinedText)
              ? 'DN25 (1") · Ø90–180 mm'
              : /siurbl|haier|aw0/i.test(combinedText)
                ? 'DN25 (G 1") · Monoblock'
                : 'DN20 / G 3/4" (EN 10226)';

    // 3. Refrigerant / Fuel / Medium
    let fuelOrRefrigerant =
        locale === 'en'
            ? 'Heating water / glycol (up to +95 °C)'
            : locale === 'pl'
              ? 'Woda grzewcza / glikol (do +95 °C)'
              : locale === 'ru'
                ? 'Теплоноситель / гликоль (до +95 °C)'
                : 'Šildymo vanduo / glikolis (iki +95 °C)';

    if (/r290/i.test(combinedText)) {
        fuelOrRefrigerant =
            locale === 'en'
                ? 'R290 natural refrigerant (propane, up to +75 °C)'
                : locale === 'pl'
                  ? 'Czynnik R290 (propan, do +75 °C)'
                  : locale === 'ru'
                    ? 'Хладагент R290 (пропан, до +75 °C)'
                    : 'R290 natūralus šaltnešis (iki +75 °C)';
    } else if (/r32/i.test(combinedText) || /šilumos siurbl|heat pump|pompa ciepła|тепловой насос/i.test(combinedText)) {
        fuelOrRefrigerant =
            locale === 'en'
                ? 'R32 / R290 refrigerant (Air-to-Water A+++)'
                : locale === 'pl'
                  ? 'Czynnik R32 / R290 (Powietrze–Woda A+++)'
                  : locale === 'ru'
                    ? 'Хладагент R32 / R290 (Воздух–Вода A+++)'
                    : 'R290 / R32 šaltnešis (Oras–Vanduo A+++)';
    } else if (/granul|pellet|pelet|пеллет|mpb|pelltech|nani/i.test(combinedText)) {
        fuelOrRefrigerant =
            locale === 'en'
                ? 'ENplus A1 wood pellets (6–8 mm)'
                : locale === 'pl'
                  ? 'Pellet drzewny ENplus A1 (6–8 mm)'
                  : locale === 'ru'
                    ? 'Древесные пеллеты ENplus A1 (6–8 мм)'
                    : 'Medžio granulės ENplus A1 (6–8 mm)';
    } else if (/kieto kuro|malk|briket|katri/i.test(combinedText)) {
        fuelOrRefrigerant =
            locale === 'en'
                ? 'Wood logs / briquettes / pellets (5th class)'
                : locale === 'pl'
                  ? 'Drewno / brykiet / pellet (5 klasa)'
                  : locale === 'ru'
                    ? 'Дрова / брикеты / пеллеты (5 класс)'
                    : 'Malkos, briketai arba granulės (5 kl. EcoDesign)';
    }

    // 4. Warranty (24-60 months)
    let warrantyMonths = '24 mėn.';
    if (/katil|siurbl|haier|katri|gorenje|danfoss|imi|heimeier/i.test(combinedText)) {
        warrantyMonths =
            /katri|haier|imi|danfoss/i.test(combinedText)
                ? locale === 'en'
                    ? '36–60 mos. (24–60 mos. warranty)'
                    : locale === 'pl'
                      ? '36–60 mies. (gwarancja 24–60 mies.)'
                      : locale === 'ru'
                        ? '36–60 мес. (гарантия 24–60 мес.)'
                        : '36–60 mėn. (24–60 mėn. garantija)'
                : locale === 'en'
                  ? '24–36 mos. (24–60 mos. warranty)'
                  : locale === 'pl'
                    ? '24–36 mies. (gwarancja 24–60 mies.)'
                    : locale === 'ru'
                      ? '24–36 мес. (гарантия 24–60 мес.)'
                      : '24–36 mėn. (24–60 mėn. garantija)';
    } else {
        warrantyMonths =
            locale === 'en'
                ? '24 mos. (24–60 mos. series)'
                : locale === 'pl'
                  ? '24 mies. (seria 24–60 mies.)'
                  : locale === 'ru'
                    ? '24 мес. (серия 24–60 мес.)'
                    : '24 mėn. (24–60 mėn. garantija)';
    }

    // 5. APVA subsidy eligibility
    const apvaEligible =
        /šilumos siurbl|heat pump|pompa ciepła|тепловой насос|haier|aw0|granul|pellet|pelet|пеллет|katil|boiler|kocioł|котел|mpb|nani|pelltech|katri|verner|ponast|megatherm/i.test(
            combinedText,
        ) && !/galvut|vožtuv|kolektor|radiator|tarpin|tenas|davikl/i.test(item.categoryName || '');

    const apvaEligibilityLabel = apvaEligible
        ? locale === 'en'
            ? 'Eligible for APVA / LEA grant (EcoDesign / A+++)'
            : locale === 'pl'
              ? 'Kwalifikuje się do dotacji APVA / LEA (EcoDesign / A+++)'
              : locale === 'ru'
                ? 'Подходит для субсидии APVA / LEA (EcoDesign / A+++)'
                : 'Tinka APVA paramai (EcoDesign / A+++ su SCOP ir kW)'
        : locale === 'en'
          ? 'System accessory (included in boiler room BOM)'
          : locale === 'pl'
            ? 'Element instalacji (wchodzi w skład zestawu kotłowni)'
            : locale === 'ru'
              ? 'Комплектующее узла (входит в смету котельной)'
              : 'Sistemos mazgo dalis (komplektuojama kartu)';

    // W121-A2: honest warehouse label — real qty only when the row carries it.
    const qty = typeof item.stockQty === 'number' && item.stockQty > 0 ? item.stockQty : null;
    const stockWarehouseLabel =
        qty == null
            ? locale === 'en'
                ? 'Availability on request · Eigulių g. 21, Kaunas'
                : locale === 'pl'
                  ? 'Dostępność na zapytanie · Eigulių g. 21, Kowno'
                  : locale === 'ru'
                    ? 'Наличие по запросу · ул. Эйгулю 21, Каунас'
                    : 'Pagal užklausą · Eigulių g. 21, Kaunas'
            : locale === 'en'
              ? `In stock (${qty} pcs) · Eigulių g. 21, Kaunas`
              : locale === 'pl'
                ? `W magazynie (${qty} szt.) · Eigulių g. 21, Kowno`
                : locale === 'ru'
                  ? `На складе (${qty} шт.) · ул. Эйгулю 21, Каунас`
                  : `Sandėlyje (${qty} vnt.) · Eigulių g. 21, Kaunas`;

    const subCategoryLabel =
        item.subCategoryName ||
        (/siurbl|haier|aw0/i.test(combinedText)
            ? 'Šilumos siurbliai Oras–Vanduo'
            : /degikl|mpb|pelltech/i.test(combinedText)
              ? 'Automatiniai granulių degikliai'
              : /katil|katri/i.test(combinedText)
                ? '5 kl. EcoDesign katilai'
                : /talp|boiler|zv/i.test(combinedText)
                  ? 'Akumuliacinės talpos ir boileriai'
                  : 'Katilinės ir ŠVOK armatūra');

    return {
        powerKw,
        dimensionsOrConnection,
        fuelOrRefrigerant,
        warranty: warrantyMonths,
        apvaEligible,
        apvaEligibilityLabel,
        stockWarehouseLabel,
        subCategoryLabel,
    };
}

export function filterDiffOnlyCompareRows(
    rows: CompareMatrixRow[],
    diffOnly: boolean,
): CompareMatrixRow[] {
    if (!diffOnly) return rows;
    return rows.filter((row) => {
        if (row.values.length <= 1) return true;
        const normalized = row.values.map((v) => v.trim().toLowerCase());
        return new Set(normalized).size > 1;
    });
}

interface CompareState {
    items: CompareItem[];
    isOpen: boolean;
    diffOnly: boolean;
    openCompare: () => void;
    closeCompare: () => void;
    setDiffOnly: (val: boolean) => void;
    toggleDiffOnly: () => void;
    addCompareItem: (item: CompareItem) => void;
    removeCompareItem: (id: string) => void;
    toggleCompareItem: (item: CompareItem) => void;
    hasItem: (id: string) => boolean;
    clearCompare: () => void;
}

export const useCompareStore = create<CompareState>()(
    persist(
        (set, get) => ({
            items: [],
            isOpen: false,
            diffOnly: false,

            openCompare: () => set({ isOpen: true }),
            closeCompare: () => set({ isOpen: false }),
            setDiffOnly: (val) => set({ diffOnly: val }),
            toggleDiffOnly: () => set({ diffOnly: !get().diffOnly }),

            addCompareItem: (newItem) => {
                const { items } = get();
                if (items.some((item) => item.id === newItem.id)) {
                    return;
                }
                const enriched: CompareItem = {
                    ...newItem,
                    addedAt: Date.now(),
                };
                if (items.length >= MAX_COMPARE_ITEMS) {
                    set({ items: [...items.slice(1), enriched] });
                } else {
                    set({ items: [...items, enriched] });
                }
            },

            removeCompareItem: (id) => {
                set({ items: get().items.filter((item) => item.id !== id) });
            },

            hasItem: (id) => {
                return get().items.some((item) => item.id === id);
            },

            toggleCompareItem: (item) => {
                const { hasItem, addCompareItem: add, removeCompareItem: remove } = get();
                if (hasItem(item.id)) {
                    remove(item.id);
                } else {
                    add(item);
                }
            },

            clearCompare: () => set({ items: [], isOpen: false, diffOnly: false }),
        }),
        {
            name: COMPARE_STORAGE_KEY,
            storage: createJSONStorage(() => safeStorage),
            partialize: (state) => ({ items: state.items, diffOnly: state.diffOnly }),
        },
    ),
);

export function addCompareItem(item: CompareItem): void {
    useCompareStore.getState().addCompareItem(item);
}

export function removeCompareItem(id: string): void {
    useCompareStore.getState().removeCompareItem(id);
}

export function toggleCompareItem(item: CompareItem): void {
    useCompareStore.getState().toggleCompareItem(item);
}

export function clearCompare(): void {
    useCompareStore.getState().clearCompare();
}

export function useCompareHydration(): boolean {
    const [hydrated, setHydrated] = useState(false);

    useEffect(() => {
        setHydrated(true);
    }, []);

    return hydrated;
}

export function useCompare() {
    const items = useCompareStore((s) => s.items);
    const isOpen = useCompareStore((s) => s.isOpen);
    const diffOnly = useCompareStore((s) => s.diffOnly);
    const openCompare = useCompareStore((s) => s.openCompare);
    const closeCompare = useCompareStore((s) => s.closeCompare);
    const setDiffOnly = useCompareStore((s) => s.setDiffOnly);
    const toggleDiffOnly = useCompareStore((s) => s.toggleDiffOnly);
    const add = useCompareStore((s) => s.addCompareItem);
    const remove = useCompareStore((s) => s.removeCompareItem);
    const toggle = useCompareStore((s) => s.toggleCompareItem);
    const hasItem = useCompareStore((s) => s.hasItem);
    const clear = useCompareStore((s) => s.clearCompare);
    const hydrated = useCompareHydration();

    return {
        items,
        count: items.length,
        maxItems: MAX_COMPARE_ITEMS,
        isOpen,
        diffOnly,
        hydrated,
        openCompare,
        closeCompare,
        setDiffOnly,
        toggleDiffOnly,
        addCompareItem: add,
        removeCompareItem: remove,
        toggleCompareItem: toggle,
        hasItem,
        clearCompare: clear,
    };
}
