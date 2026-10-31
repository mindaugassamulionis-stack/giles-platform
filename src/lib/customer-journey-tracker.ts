/**
 * W40-A1 + W43-A1 + W119-A2: Multi-Store Customer Journey Memory & Proactive
 * Vytautas Context Bridge
 *
 * Tracks the customer's active HVAC configuration journey in localStorage
 * (`giles_customer_journey_v1_<storeId>`) and dynamically obeys
 * `setJourneyTrackingConfig({ enabled, storeId, proactiveTrigger })`
 * controlled from `/admin/storefront-control`. Values written under the old
 * `suradai_customer_journey_v1*` keys are copied across once by
 * migrateLegacyJourneyStorage().
 */

export const CUSTOMER_JOURNEY_STORAGE_KEY = 'giles_customer_journey_v1';
export const LEGACY_CUSTOMER_JOURNEY_STORAGE_KEY = 'suradai_customer_journey_v1';
export const JOURNEY_UPDATE_EVENT = 'giles:journey-update';
export const OPEN_VYTAUTAS_EVENT = 'giles:open-vytautas';

export interface JourneyTrackingRuntimeConfig {
    enabled: boolean;
    storeId?: string;
    proactiveTrigger?: boolean;
}

let runtimeTrackingConfig: JourneyTrackingRuntimeConfig = {
    enabled: true,
    storeId: undefined,
    proactiveTrigger: true,
};

export interface JourneySearchEntry {
    query: string;
    timestamp: number;
    resultCount?: number;
}

export interface JourneyCalculatorEntry {
    tab: string;
    labelLt: string;
    inputsSummary: string;
    resultSummary: string;
    recommendedSkus: string[];
    timestamp: number;
}

export interface JourneyViewedProductEntry {
    id?: string;
    sku: string;
    title: string;
    brand?: string;
    category?: string;
    price?: number;
    priceEur?: number;
    imageUrl?: string;
    timestamp: number;
}

export interface JourneySelectedVariantEntry {
    source: string;
    title: string;
    summary: string;
    recommendedSkus: string[];
    timestamp: number;
}

export interface CustomerJourneyState {
    searches: JourneySearchEntry[];
    calculators: JourneyCalculatorEntry[];
    viewedProducts: JourneyViewedProductEntry[];
    selectedVariants: JourneySelectedVariantEntry[];
    cartSnapshot?: string[];
}

export interface OpenVytautasPayload {
    prompt?: string;
    sku?: string;
    title?: string;
    variantTitle?: string;
    summary?: string;
    calculatorSummary?: string;
    recommendedSkus?: string[];
    autoSend?: boolean;
    proactive?: boolean;
}

const EMPTY_JOURNEY_STATE: CustomerJourneyState = {
    searches: [],
    calculators: [],
    viewedProducts: [],
    selectedVariants: [],
    cartSnapshot: [],
};

function isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

export function resolveJourneyStorageKey(storeId?: string): string {
    const activeId = (storeId ?? runtimeTrackingConfig.storeId ?? '').trim();
    if (!activeId) {
        return `${CUSTOMER_JOURNEY_STORAGE_KEY}_unknown`;
    }
    return `${CUSTOMER_JOURNEY_STORAGE_KEY}_${activeId.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
}

/**
 * One-time copy of pre-rename `suradai_customer_journey_v1*` values to the
 * `giles_` key for the currently active store id. Idempotent: runs only when
 * the new key is absent and the legacy twin still holds a value.
 */
export function migrateLegacyJourneyStorage(storeIdOverride?: string): void {
    if (!isBrowser()) return;
    try {
        const suffix = (() => {
            const key = resolveJourneyStorageKey(storeIdOverride);
            return key.slice(CUSTOMER_JOURNEY_STORAGE_KEY.length);
        })();
        const nextKey = `${CUSTOMER_JOURNEY_STORAGE_KEY}${suffix}`;
        const legacyKey = `${LEGACY_CUSTOMER_JOURNEY_STORAGE_KEY}${suffix}`;
        if (window.localStorage.getItem(nextKey)) return;
        const legacy = window.localStorage.getItem(legacyKey);
        if (legacy) window.localStorage.setItem(nextKey, legacy);
    } catch {
        // Ignore quota / privacy mode errors
    }
}

export function setJourneyTrackingConfig(config: {
    enabled: boolean;
    storeId?: string;
    proactiveTrigger?: boolean;
}): void {
    runtimeTrackingConfig = {
        enabled: config.enabled !== false,
        storeId: config.storeId ?? runtimeTrackingConfig.storeId,
        proactiveTrigger: config.proactiveTrigger ?? runtimeTrackingConfig.proactiveTrigger ?? true,
    };
    if (isBrowser()) {
        (window as any).__GILES_JOURNEY_CONFIG__ = runtimeTrackingConfig;
    }
}

export function setJourneyTrackingEnabled(enabled: boolean, storeId?: string): void {
    setJourneyTrackingConfig({ enabled, storeId });
}

export function getJourneyTrackingConfig(): JourneyTrackingRuntimeConfig {
    if (isBrowser() && (window as any).__GILES_STOREFRONT_CONFIG__?.features) {
        const winCfg = (window as any).__GILES_STOREFRONT_CONFIG__;
        return {
            enabled: winCfg.features.customerJourneyTracker !== false,
            storeId: winCfg.storeId || runtimeTrackingConfig.storeId,
            proactiveTrigger: winCfg.features.proactiveTrigger !== false,
        };
    }
    return runtimeTrackingConfig;
}

export function isJourneyTrackingEnabled(): boolean {
    return getJourneyTrackingConfig().enabled !== false;
}

export function getCustomerJourney(storeIdOverride?: string): CustomerJourneyState {
    if (!isJourneyTrackingEnabled()) {
        return {
            searches: [],
            calculators: [],
            viewedProducts: [],
            selectedVariants: [],
            cartSnapshot: [],
        };
    }
    if (!isBrowser()) {
        return {
            searches: [],
            calculators: [],
            viewedProducts: [],
            selectedVariants: [],
            cartSnapshot: [],
        };
    }
    try {
        migrateLegacyJourneyStorage(storeIdOverride);
        const storageKey = resolveJourneyStorageKey(storeIdOverride);
        const raw = window.localStorage.getItem(storageKey);
        if (!raw) {
            return {
                searches: [],
                calculators: [],
                viewedProducts: [],
                selectedVariants: [],
                cartSnapshot: [],
            };
        }
        const parsed = JSON.parse(raw) as Partial<CustomerJourneyState>;
        return {
            searches: Array.isArray(parsed.searches) ? parsed.searches.slice(0, 5) : [],
            calculators: Array.isArray(parsed.calculators) ? parsed.calculators.slice(0, 5) : [],
            viewedProducts: Array.isArray(parsed.viewedProducts) ? parsed.viewedProducts.slice(0, 8) : [],
            selectedVariants: Array.isArray(parsed.selectedVariants) ? parsed.selectedVariants.slice(0, 5) : [],
            cartSnapshot: Array.isArray(parsed.cartSnapshot) ? parsed.cartSnapshot.slice(0, 8) : [],
        };
    } catch {
        return { ...EMPTY_JOURNEY_STATE };
    }
}

function saveCustomerJourney(next: CustomerJourneyState, storeIdOverride?: string): CustomerJourneyState {
    if (!isJourneyTrackingEnabled()) {
        return { ...EMPTY_JOURNEY_STATE };
    }
    const normalized: CustomerJourneyState = {
        searches: next.searches.slice(0, 5),
        calculators: next.calculators.slice(0, 5),
        viewedProducts: next.viewedProducts.slice(0, 8),
        selectedVariants: next.selectedVariants.slice(0, 5),
        cartSnapshot: Array.isArray(next.cartSnapshot) ? next.cartSnapshot.slice(0, 8) : [],
    };
    if (isBrowser()) {
        try {
            const storageKey = resolveJourneyStorageKey(storeIdOverride);
            window.localStorage.setItem(storageKey, JSON.stringify(normalized));
            window.dispatchEvent(new CustomEvent(JOURNEY_UPDATE_EVENT, { detail: normalized }));
        } catch {
            // Ignore quota / privacy mode errors
        }
    }
    return normalized;
}

export function recordJourneyEvent(event: {
    type: 'search' | 'calculator' | 'product_view' | 'variant_select' | 'diagnostic';
    query?: string;
    resultCount?: number;
    tab?: string;
    labelLt?: string;
    inputsSummary?: string;
    resultSummary?: string;
    sku?: string;
    title?: string;
    summary?: string;
    recommendedSkus?: string[];
}): CustomerJourneyState {
    if (!isJourneyTrackingEnabled()) return { ...EMPTY_JOURNEY_STATE };
    switch (event.type) {
        case 'search':
            return recordSearchQuery(event.query || '', event.resultCount);
        case 'calculator':
            return recordCalculatorRun({
                tab: event.tab || 'boiler',
                labelLt: event.labelLt || event.tab || 'boiler',
                inputsSummary: event.inputsSummary || '',
                resultSummary: event.resultSummary || '',
                recommendedSkus: event.recommendedSkus || [],
            });
        case 'product_view':
            return recordViewedProduct({
                sku: event.sku || '',
                title: event.title || '',
            });
        case 'diagnostic':
        case 'variant_select':
            return recordSelectedVariant({
                source: event.type === 'diagnostic' ? 'diagnostic' : 'comparison',
                title: event.title || '',
                summary: event.summary || '',
                recommendedSkus: event.recommendedSkus || [],
            });
        default:
            return getCustomerJourney();
    }
}

export function recordSearchQuery(query: string, resultCount?: number): CustomerJourneyState {
    if (!isJourneyTrackingEnabled()) return { ...EMPTY_JOURNEY_STATE };
    const trimmed = (query || '').trim();
    const current = getCustomerJourney();
    if (trimmed.length < 2) return current;

    const lower = trimmed.toLowerCase();
    const filtered = current.searches.filter((s) => s.query.toLowerCase() !== lower);
    const entry: JourneySearchEntry = {
        query: trimmed,
        timestamp: Date.now(),
        ...(typeof resultCount === 'number' ? { resultCount } : {}),
    };
    return saveCustomerJourney({
        ...current,
        searches: [entry, ...filtered].slice(0, 5),
    });
}

export function recordCalculatorRun(
    entry: Omit<JourneyCalculatorEntry, 'timestamp'>,
): CustomerJourneyState {
    if (!isJourneyTrackingEnabled()) return { ...EMPTY_JOURNEY_STATE };
    const current = getCustomerJourney();
    const tab = (entry.tab || 'boiler').trim();
    const filtered = current.calculators.filter((c) => c.tab !== tab);
    const fullEntry: JourneyCalculatorEntry = {
        tab,
        labelLt: entry.labelLt || tab,
        inputsSummary: entry.inputsSummary || '',
        resultSummary: entry.resultSummary || '',
        recommendedSkus: Array.isArray(entry.recommendedSkus) ? entry.recommendedSkus : [],
        timestamp: Date.now(),
    };
    return saveCustomerJourney({
        ...current,
        calculators: [fullEntry, ...filtered].slice(0, 5),
    });
}

export function recordViewedProduct(
    entry: Omit<JourneyViewedProductEntry, 'timestamp'>,
): CustomerJourneyState {
    if (!isJourneyTrackingEnabled()) return { ...EMPTY_JOURNEY_STATE };
    const current = getCustomerJourney();
    const sku = (entry.sku || entry.id || '').trim();
    if (!sku && !entry.title) return current;

    const filtered = current.viewedProducts.filter(
        (p) => (sku ? p.sku !== sku && p.id !== entry.id : p.title !== entry.title),
    );
    const priceVal = entry.priceEur ?? entry.price;
    const fullEntry: JourneyViewedProductEntry = {
        id: entry.id,
        sku: sku || entry.title,
        title: entry.title,
        brand: entry.brand,
        category: entry.category,
        price: priceVal,
        priceEur: priceVal,
        imageUrl: entry.imageUrl,
        timestamp: Date.now(),
    };
    return saveCustomerJourney({
        ...current,
        viewedProducts: [fullEntry, ...filtered].slice(0, 8),
    });
}

export const recordProductView = recordViewedProduct;

export function recordSelectedVariant(entry: {
    source?: string;
    title: string;
    summary: string;
    recommendedSkus?: string[];
}): CustomerJourneyState {
    if (!isJourneyTrackingEnabled()) return { ...EMPTY_JOURNEY_STATE };
    const current = getCustomerJourney();
    const title = (entry.title || '').trim();
    if (!title) return current;

    const filtered = current.selectedVariants.filter((v) => v.title !== title);
    const fullEntry: JourneySelectedVariantEntry = {
        source: entry.source || 'comparison',
        title,
        summary: entry.summary || '',
        recommendedSkus: Array.isArray(entry.recommendedSkus) ? entry.recommendedSkus : [],
        timestamp: Date.now(),
    };
    return saveCustomerJourney({
        ...current,
        selectedVariants: [fullEntry, ...filtered].slice(0, 5),
    });
}

export const recordCalculatorOptionInspect = recordSelectedVariant;

export function recordDiagnosticSymptom(entry: {
    symptomId?: string;
    title: string;
    summary: string;
    recommendedSkus?: string[];
}): CustomerJourneyState {
    if (!isJourneyTrackingEnabled()) return { ...EMPTY_JOURNEY_STATE };
    return recordSelectedVariant({
        source: 'diagnostic',
        title: entry.title,
        summary: entry.summary,
        recommendedSkus: entry.recommendedSkus,
    });
}

export function syncCartSnapshot(cartSkus: string[]): CustomerJourneyState {
    if (!isJourneyTrackingEnabled()) return { ...EMPTY_JOURNEY_STATE };
    const current = getCustomerJourney();
    return saveCustomerJourney({
        ...current,
        cartSnapshot: Array.isArray(cartSkus) ? cartSkus.slice(0, 8) : [],
    });
}

export function clearCustomerJourney(storeIdOverride?: string): void {
    if (!isBrowser()) return;
    try {
        const storageKey = resolveJourneyStorageKey(storeIdOverride);
        window.localStorage.removeItem(storageKey);
        window.dispatchEvent(new CustomEvent(JOURNEY_UPDATE_EVENT, { detail: EMPTY_JOURNEY_STATE }));
    } catch {
        // Ignore storage errors
    }
}

export function openVytautasWithContext(payload: OpenVytautasPayload): void {
    const cfg = getJourneyTrackingConfig();
    if (payload.proactive && cfg.proactiveTrigger === false) {
        return;
    }

    const chosenTitle = payload.title || payload.variantTitle;
    const chosenSummary = payload.summary || payload.calculatorSummary || payload.prompt || '';
    const skus = payload.recommendedSkus ?? (payload.sku ? [payload.sku] : []);

    if (chosenTitle && cfg.enabled !== false) {
        recordSelectedVariant({
            source: payload.calculatorSummary ? 'calculator' : 'advisor',
            title: chosenTitle,
            summary: chosenSummary,
            recommendedSkus: skus,
        });
    }

    if (typeof window !== 'undefined') {
        window.dispatchEvent(
            new CustomEvent(OPEN_VYTAUTAS_EVENT, {
                detail: {
                    ...payload,
                    title: chosenTitle,
                    summary: chosenSummary,
                    recommendedSkus: skus,
                    autoSend: payload.autoSend ?? Boolean(payload.prompt),
                },
            }),
        );
    }
}

export function buildChatJourneyContext(cartSkus: string[] = []): {
    searches: string[];
    calculatorSummary?: string;
    viewedSkus: string[];
    selectedVariantSummary?: string;
    cartSkus: string[];
} {
    if (!isJourneyTrackingEnabled()) {
        return {
            searches: [],
            viewedSkus: [],
            cartSkus: [],
        };
    }

    const state = getCustomerJourney();
    const latestCalc = state.calculators[0];
    const latestVariant = state.selectedVariants[0];
    const effectiveCart = cartSkus.length > 0 ? cartSkus : state.cartSnapshot ?? [];

    return {
        searches: state.searches.map((s) => s.query).slice(0, 5),
        calculatorSummary: latestCalc
            ? `${latestCalc.labelLt}: ${latestCalc.inputsSummary} → ${latestCalc.resultSummary}`
            : undefined,
        viewedSkus: state.viewedProducts
            .map((p) => (p.sku && p.sku !== p.title ? `${p.title} (${p.sku})` : p.title))
            .slice(0, 5),
        selectedVariantSummary: latestVariant
            ? `${latestVariant.title}${latestVariant.summary ? ` (${latestVariant.summary})` : ''}`
            : undefined,
        cartSkus: effectiveCart.slice(0, 8),
    };
}

export function getJourneySummaryForPrompt(cartSkus: string[] = []): string {
    if (!isJourneyTrackingEnabled()) return '';
    const ctx = buildChatJourneyContext(cartSkus);
    const parts: string[] = [];
    if (ctx.calculatorSummary) parts.push(`Skaičiuoklė: ${ctx.calculatorSummary}`);
    if (ctx.selectedVariantSummary) parts.push(`Variantas: ${ctx.selectedVariantSummary}`);
    if (ctx.searches.length > 0) parts.push(`Paieškos: ${ctx.searches.join(', ')}`);
    if (ctx.viewedSkus.length > 0) parts.push(`Peržiūrėta: ${ctx.viewedSkus.join(', ')}`);
    if (ctx.cartSkus.length > 0) parts.push(`Krepšelis: ${ctx.cartSkus.join(', ')}`);
    return parts.join(' | ');
}
