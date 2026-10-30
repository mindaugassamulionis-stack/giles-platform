'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiUrl } from '../lib/api';
import { setJourneyTrackingConfig } from '../lib/customer-journey-tracker';

export interface StorefrontFeatureFlagsClient {
    vytautasWidget: boolean;
    customerJourneyTracker: boolean;
    instantAiSearch: boolean;
    proactiveTrigger: boolean;
    calculatorsEnabled: boolean;
    calculatorsPhysicalBinding: boolean;
    cadDiagnosticsEnabled: boolean;
    deepSubtypeSpecFilters: boolean;
    trustPolicySummaries: boolean;
}

export interface StorefrontConsultantPersonaClient {
    agentName: string;
    agentRoleLt: string;
    agentRoleEn: string;
    greetingLt: string;
    greetingEn: string;
    specialtyLt?: string;
    storeFactsLt?: string;
}

export interface StorefrontRuntimeConfigClient {
    storeId: string;
    storeKey: string;
    storeSlug: string;
    storeName: string;
    domain?: string | null;
    features: StorefrontFeatureFlagsClient;
    persona: StorefrontConsultantPersonaClient;
    llm: {
        enabled: boolean;
        provider: string;
        model: string;
        hasApiKey: boolean;
        thinkingEnabled?: boolean;
    };
}

export const DEFAULT_CLIENT_STOREFRONT_CONFIG: StorefrontRuntimeConfigClient = {
    storeId: 'default',
    storeKey: 'store_lt_main',
    storeSlug: 'suradai',
    storeName: 'Gilės Inžinerija',
    domain: 'gilesinzinerija.lt',
    features: {
        vytautasWidget: true,
        customerJourneyTracker: true,
        instantAiSearch: true,
        proactiveTrigger: true,
        calculatorsEnabled: true,
        calculatorsPhysicalBinding: true,
        cadDiagnosticsEnabled: true,
        deepSubtypeSpecFilters: true,
        trustPolicySummaries: true,
    },
    persona: {
        agentName: 'Vytautas',
        agentRoleLt: 'Vyriausiasis inžinierius · Atsako akimirksniu',
        agentRoleEn: 'Chief Systems Engineer · Instant answers',
        greetingLt:
            'Sveiki! Esu konsultantas Vytautas. Patikrinsiu, kokios dalys dera tarpusavyje pagal gamintojo kodą (Danfoss, IMI Heimeier, Pneumatex, IMI TA) ir padėsiu sukomplektuoti mazgą be klaidų. Kokį kodą ar mazgą šiandien renkame?',
        greetingEn:
            'Hello! I am Vytautas, your Chief Systems Engineer. I can verify valve, actuator, and manifold compatibility by SKU and help you assemble a complete hydronic node.',
    },
    llm: {
        enabled: true,
        provider: 'deepseek',
        model: 'deepseek-flash',
        hasApiKey: true,
        thinkingEnabled: false,
    },
};

const StorefrontConfigContext = createContext<StorefrontRuntimeConfigClient>(
    DEFAULT_CLIENT_STOREFRONT_CONFIG,
);

export function StorefrontConfigProvider({
    initialConfig,
    children,
}: {
    initialConfig?: Partial<StorefrontRuntimeConfigClient> | null;
    children: React.ReactNode;
}) {
    const [config, setConfig] = useState<StorefrontRuntimeConfigClient>(() => {
        const merged: StorefrontRuntimeConfigClient = {
            ...DEFAULT_CLIENT_STOREFRONT_CONFIG,
            ...(initialConfig || {}),
            features: {
                ...DEFAULT_CLIENT_STOREFRONT_CONFIG.features,
                ...(initialConfig?.features || {}),
            },
            persona: {
                ...DEFAULT_CLIENT_STOREFRONT_CONFIG.persona,
                ...(initialConfig?.persona || {}),
            },
            llm: {
                ...DEFAULT_CLIENT_STOREFRONT_CONFIG.llm,
                ...(initialConfig?.llm || {}),
            },
        };
        setJourneyTrackingConfig({
            enabled: merged.features.customerJourneyTracker,
            storeId: merged.storeId,
            proactiveTrigger: merged.features.proactiveTrigger,
        });
        return merged;
    });

    useEffect(() => {
        if (typeof window === 'undefined') return;
        (window as any).__SURADAI_STOREFRONT_CONFIG__ = config;
        setJourneyTrackingConfig({
            enabled: config.features.customerJourneyTracker,
            storeId: config.storeId,
            proactiveTrigger: config.features.proactiveTrigger,
        });
    }, [config]);

    useEffect(() => {
        let cancelled = false;
        async function syncRuntimeConfig() {
            try {
                const params =
                    typeof window !== 'undefined'
                        ? new URLSearchParams(window.location.search)
                        : null;
                const urlStoreId = params?.get('storeId')?.trim();
                const endpoint = urlStoreId
                    ? apiUrl(`/api/storefront-config?storeId=${encodeURIComponent(urlStoreId)}`)
                    : apiUrl('/api/storefront-config');

                const res = await fetch(endpoint, { cache: 'no-store' });
                if (!res.ok) return;
                const data = await res.json();
                if (!cancelled && data && data.features) {
                    const next: StorefrontRuntimeConfigClient = {
                        storeId: data.storeId || DEFAULT_CLIENT_STOREFRONT_CONFIG.storeId,
                        storeKey: data.storeKey || DEFAULT_CLIENT_STOREFRONT_CONFIG.storeKey,
                        storeSlug: data.storeSlug || DEFAULT_CLIENT_STOREFRONT_CONFIG.storeSlug,
                        storeName: data.storeName || DEFAULT_CLIENT_STOREFRONT_CONFIG.storeName,
                        domain: data.domain ?? DEFAULT_CLIENT_STOREFRONT_CONFIG.domain,
                        features: {
                            ...DEFAULT_CLIENT_STOREFRONT_CONFIG.features,
                            ...data.features,
                        },
                        persona: {
                            ...DEFAULT_CLIENT_STOREFRONT_CONFIG.persona,
                            ...(data.persona || {}),
                        },
                        llm: {
                            ...DEFAULT_CLIENT_STOREFRONT_CONFIG.llm,
                            ...(data.llm || {}),
                        },
                    };
                    setConfig(next);
                    if (typeof window !== 'undefined') {
                        (window as any).__SURADAI_STOREFRONT_CONFIG__ = next;
                    }
                    setJourneyTrackingConfig({
                        enabled: next.features.customerJourneyTracker,
                        storeId: next.storeId,
                        proactiveTrigger: next.features.proactiveTrigger,
                    });
                }
            } catch {
                // Keep initial SSR config on offline/test error
            }
        }
        void syncRuntimeConfig();
        return () => {
            cancelled = true;
        };
    }, []);

    return (
        <StorefrontConfigContext.Provider value={config}>
            {children}
        </StorefrontConfigContext.Provider>
    );
}

export function useStorefrontConfig(): StorefrontRuntimeConfigClient {
    return useContext(StorefrontConfigContext);
}
