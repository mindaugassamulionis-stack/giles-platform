'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export const WISHLIST_STORAGE_KEY = 'giles_wishlist_v1';

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

export interface WishlistItem {
    id: string;
    name: string;
    price: number;
    image?: string;
    sku?: string;
    categoryName?: string;
    stockStatus?: string;
    addedAt: number;
}

interface WishlistState {
    items: WishlistItem[];
    isOpen: boolean;
    openWishlist: () => void;
    closeWishlist: () => void;
    addItem: (item: Omit<WishlistItem, 'addedAt'>) => void;
    removeItem: (id: string) => void;
    hasItem: (id: string) => boolean;
    clearWishlist: () => void;
    toggleItem: (item: Omit<WishlistItem, 'addedAt'>) => void;
}

export const useWishlistStore = create<WishlistState>()(
    persist(
        (set, get) => ({
            items: [],
            isOpen: false,

            openWishlist: () => set({ isOpen: true }),
            closeWishlist: () => set({ isOpen: false }),

            addItem: (newItem) => {
                const { items } = get();
                if (!items.find((item) => item.id === newItem.id)) {
                    set({ items: [...items, { ...newItem, addedAt: Date.now() }] });
                }
            },

            removeItem: (id) => {
                set({ items: get().items.filter((item) => item.id !== id) });
            },

            hasItem: (id) => {
                return !!get().items.find((item) => item.id === id);
            },

            toggleItem: (newItem) => {
                const { hasItem, addItem, removeItem } = get();
                if (hasItem(newItem.id)) {
                    removeItem(newItem.id);
                } else {
                    addItem(newItem);
                }
            },

            clearWishlist: () => set({ items: [] }),
        }),
        {
            name: WISHLIST_STORAGE_KEY,
            storage: createJSONStorage(() => safeStorage),
            partialize: (state) => ({ items: state.items }),
        }
    )
);

// Hydration hook
import { useState, useEffect } from 'react';

export function useWishlistHydration() {
    const [hydrated, setHydrated] = useState(false);

    useEffect(() => {
        setHydrated(true);
    }, []);

    return hydrated;
}
