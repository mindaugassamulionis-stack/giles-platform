
'use client';

import { useEffect } from 'react';
import { trackEvent } from './analytics';

type Props = {
    amount?: number;
    total?: number;
    currency: string;
    orderId: string;
    items?: {
        sku: string;
        price: number;
        quantity: number;
        name: string;
    }[];
};

export function PurchaseTracker({ amount, total, currency, orderId, items = [] }: Props) {
    const totalEur = Number(total ?? amount ?? 0);

    useEffect(() => {
        if (!orderId) return;

        trackEvent('Purchase', {
            order_id: orderId,
            value: totalEur,
            currency: currency || 'EUR',
            content_ids: items.map((item) => item.sku),
            content_type: 'product',
            num_items: items.reduce((sum, item) => sum + item.quantity, 0),
            items,
        });
    }, [totalEur, currency, orderId, items]);

    return null;
}
