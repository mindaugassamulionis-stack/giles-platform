'use client';

import { useEffect } from 'react';
import { ProductCard } from './product-card';
import { formatCleanCatalogProductTitle } from '../lib/product-visuals';
import { openVytautasWithContext, recordSearchQuery } from '../lib/customer-journey-tracker';
import { useStorefrontConfig } from './storefront-config-provider';

interface Product {
    id: string;
    slug?: string | null;
    name: string;
    price: number;
    imageUrl?: string;
    categoryName?: string | null;
    categorySlug?: string | null;
    brandName?: string | null;
    brandVerified?: boolean | null;
    inStock?: boolean;
    stock?: number | null;
    sku?: string;
    nameLt?: string | null;
    exactSkuMatch?: boolean;
    createdAt?: Date | string | null;
    priceCents?: number | null;
    vatRate?: number | null;
}

export function VytautasCatalogConsultButton({
    prompt,
    title,
    summary,
    searchQuery,
    resultCount,
}: {
    prompt: string;
    title: string;
    summary: string;
    searchQuery?: string;
    resultCount?: number;
}) {
    const { features, persona } = useStorefrontConfig();
    const agentName = persona.agentName || 'Vytautas';

    useEffect(() => {
        if (features.customerJourneyTracker && searchQuery && searchQuery.trim().length >= 2) {
            recordSearchQuery(searchQuery.trim(), resultCount);
        }
    }, [searchQuery, resultCount, features.customerJourneyTracker]);

    if (!features.vytautasWidget) return null;

    return (
        <button
            type="button"
            onClick={() =>
                openVytautasWithContext({
                    prompt,
                    title,
                    summary,
                    autoSend: true,
                })
            }
            className="inline-flex items-center justify-center gap-2 rounded-none bg-[#C2410C] hover:bg-[#9A3412] px-4 py-2 text-xs font-bold text-white transition-colors shrink-0 cursor-pointer whitespace-nowrap"
        >
            <span>Pasikonsultuoti su {agentName}</span>
        </button>
    );
}

export function ProductGridClient({ products }: { products: Product[] }) {
    return (
        <div
            data-testid="giles-architectural-product-matrix"
            className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 border-t border-l border-[#E2DDD3]"
        >
            {products.map((product, idx) => {
                const formattedName = formatCleanCatalogProductTitle(
                    product.nameLt || product.name,
                    product.sku,
                    product.brandName,
                );
                return (
                    <ProductCard
                        key={product.id}
                        product={{ ...product, name: formattedName }}
                        index={idx}
                    />
                );
            })}
        </div>
    );
}
