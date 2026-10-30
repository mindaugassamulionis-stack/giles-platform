import React from 'react';
import { buildSeoGeoKnowledgeGraph } from '../lib/seo-geo-authority';

export interface SeoGeoJsonLdProps {
    locale: string;
    nonce?: string;
}

export function SeoGeoJsonLd({ locale, nonce }: SeoGeoJsonLdProps) {
    const knowledgeGraph = buildSeoGeoKnowledgeGraph(locale);

    return (
        <script
            type="application/ld+json"
            data-testid="seo-geo-knowledge-graph"
            nonce={nonce}
            dangerouslySetInnerHTML={{
                __html: JSON.stringify(knowledgeGraph),
            }}
        />
    );
}
