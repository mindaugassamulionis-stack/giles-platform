'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { CART_STORAGE_KEY } from '../lib/conversion';

export interface CartItem {
    id: string;           // Unique key (variantId or productId)
    productId: string;    // Link to product page
    variantId?: string;   // variant ID if applicable
    name: string;
    price: number;        // in EUR
    quantity: number;
    sku: string;
    image?: string;
}

interface CartState {
    items: CartItem[];
    isOpen: boolean;

    // Actions
    addItem: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void;
    removeItem: (id: string) => void;
    updateQuantity: (id: string, quantity: number) => void;
    clearCart: () => void;
    toggleCart: () => void;
    openCart: () => void;
    closeCart: () => void;

    // Computed
    getItemCount: () => number;
    getSubtotal: () => number;
    getShipping: () => number;
    getTotal: () => number;
}

export const useCartStore = create<CartState>()(
    persist(
        (set, get) => ({
            items: [],
            isOpen: false,

            addItem: (newItem) => {
                const { items } = get();
                // Check by unique ID (which is now variantId or productId)
                const existingItem = items.find(item => item.id === newItem.id);

                if (existingItem) {
                    // Update quantity
                    set({
                        items: items.map(item =>
                            item.id === newItem.id
                                ? { ...item, quantity: item.quantity + (newItem.quantity || 1) }
                                : item
                        ),
                    });
                } else {
                    // Add new item
                    set({
                        items: [...items, { ...newItem, quantity: newItem.quantity || 1 }],
                    });
                }
            },

            removeItem: (id) => {
                set({ items: get().items.filter(item => item.id !== id) });
            },

            updateQuantity: (id, quantity) => {
                if (quantity <= 0) {
                    get().removeItem(id);
                    return;
                }
                set({
                    items: get().items.map(item =>
                        item.id === id ? { ...item, quantity } : item
                    ),
                });
            },

            clearCart: () => set({ items: [] }),

            toggleCart: () => set({ isOpen: !get().isOpen }),
            openCart: () => set({ isOpen: true }),
            closeCart: () => set({ isOpen: false }),

            getItemCount: () => get().items.reduce((sum, item) => sum + item.quantity, 0),

            getSubtotal: () =>
                get().items.reduce((sum, item) => sum + item.price * item.quantity, 0),

            getShipping: () => {
                const subtotal = get().getSubtotal();
                return subtotal >= 50 ? 0 : 3.99;
            },

            getTotal: () => get().getSubtotal() + get().getShipping(),
        }),
        {
            // Per-store localStorage key: stores share one origin via caddy
            // path routing (/aurora, /suradai) and must never share carts.
            name: CART_STORAGE_KEY,
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({ items: state.items }), // Only persist items
        }
    )
);

export const useCart = useCartStore;

// Hook for hydration safety
import { useState, useEffect } from 'react';

export function useCartHydration() {
    const [hydrated, setHydrated] = useState(false);

    useEffect(() => {
        setHydrated(true);
    }, []);

    return hydrated;
}
