'use client';

// Conversion helpers shared by the storefront catalog/cart/checkout flow.
// The cart must NOT be shared between stores hosted on the same origin
// (caddy path routing: /aurora, /suradai, …), so the persisted zustand key
// is prefixed with the build-time basePath.

export const CART_STORAGE_KEY = (() => {
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
    return basePath ? `cart-storage-${basePath.replace(/\//g, '')}` : 'cart-storage';
})();

export const ADMIN_API_BASE = process.env.NEXT_PUBLIC_ADMIN_API_BASE || '/admin';

export { formatEur } from './format';

export interface CheckoutOrderResult {
    orderId: string;
}

export async function submitOrder(input: {
    items: Array<{ productId: string; quantity: number }>;
    email: string;
    name: string;
    address: string;
    city: string;
    postalCode: string;
    country?: string;
    phone: string;
    storeSlug: string;
}): Promise<CheckoutOrderResult> {
    const idempotencyKey =
        globalThis.crypto?.randomUUID?.() ||
        `web-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

    const res = await fetch(`${ADMIN_API_BASE}/api/public/orders`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Idempotency-Key': idempotencyKey,
        },
        body: JSON.stringify({
            items: input.items,
            shippingAddress: {
                name: input.name,
                address: input.address,
                city: input.city,
                postalCode: input.postalCode,
                country: input.country || 'LT',
                phone: input.phone,
            },
            email: input.email,
            storeId: input.storeSlug,
        }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data?.orderId) {
        throw new Error(data?.error || 'Nepavyko sukurti užsakymo');
    }
    return { orderId: String(data.orderId) };
}
