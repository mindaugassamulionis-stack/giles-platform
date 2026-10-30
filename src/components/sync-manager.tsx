'use client';
import { useEffect, useRef } from 'react';
import { useWishlistStore } from '../store/wishlist';
import { useCartStore } from '../store/cart';
import { syncWishlist } from '../app/[locale]/wishlist/actions';
import { syncCart } from '../app/[locale]/cart/actions';
import { apiUrl } from '../lib/api';


export function SyncManager() {
    const { items, addItem } = useWishlistStore();
    const { items: cartItems } = useCartStore();
    const hasSynced = useRef(false);

    useEffect(() => {
        if (hasSynced.current) return;

        const doSync = async () => {
            // Simple auth check to avoid unnecessary calls
            if (!document.cookie.includes('auth-token')) return;

            const localIds = items.map(i => i.id);

            try {
                // Sync Cart
                if (cartItems.length > 0) {
                    await syncCart(cartItems);
                }

                // Sync Wishlist
                const res = await syncWishlist(localIds);

                if (res.merged) {
                    const currentIds = items.map(i => i.id); // Re-read? No, closure. But logic holds.
                    const missingIds = res.ids.filter(id => !currentIds.includes(id));

                    if (missingIds.length > 0) {
                        const resp = await fetch(apiUrl('/api/products/batch'), {
                            method: 'POST',
                            body: JSON.stringify({ ids: missingIds })
                        });
                        const newProducts = await resp.json();

                        if (Array.isArray(newProducts)) {
                            newProducts.forEach(p => {
                                // Add to store (store handles dedupe based on ID)
                                addItem({
                                    id: p.id,
                                    name: p.name,
                                    price: p.price,
                                    image: p.imageUrl,
                                    sku: p.sku
                                });
                            });
                        }
                    }
                    hasSynced.current = true;
                }
            } catch (e) {
                console.error('Sync error', e);
            }
        };

        doSync();
    }, []); // Mount only

    return null;
}
