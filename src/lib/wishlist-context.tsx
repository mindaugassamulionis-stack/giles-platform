'use client';

import React, { createContext, useContext } from 'react';
import {
    useWishlistStore,
    useWishlistHydration,
    WISHLIST_STORAGE_KEY,
    type WishlistItem,
} from '../store/wishlist';
import { useCartStore } from '../store/cart';

export { WISHLIST_STORAGE_KEY, useWishlistStore, useWishlistHydration, type WishlistItem };

export interface WishlistContextValue {
    items: WishlistItem[];
    count: number;
    isOpen: boolean;
    hydrated: boolean;
    openWishlist: () => void;
    closeWishlist: () => void;
    addItem: (item: Omit<WishlistItem, 'addedAt'>) => void;
    removeItem: (id: string) => void;
    toggleItem: (item: Omit<WishlistItem, 'addedAt'>) => void;
    hasItem: (id: string) => boolean;
    clearWishlist: () => void;
    moveAllToCart: () => void;
}

const WishlistContext = createContext<WishlistContextValue | null>(null);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
    const items = useWishlistStore((s) => s.items);
    const isOpen = useWishlistStore((s) => s.isOpen);
    const openWishlist = useWishlistStore((s) => s.openWishlist);
    const closeWishlist = useWishlistStore((s) => s.closeWishlist);
    const addItem = useWishlistStore((s) => s.addItem);
    const removeItem = useWishlistStore((s) => s.removeItem);
    const toggleItem = useWishlistStore((s) => s.toggleItem);
    const hasItem = useWishlistStore((s) => s.hasItem);
    const clearWishlist = useWishlistStore((s) => s.clearWishlist);
    const hydrated = useWishlistHydration();

    const addCartItem = useCartStore((s) => s.addItem);
    const openCart = useCartStore((s) => s.openCart);

    const moveAllToCart = () => {
        for (const item of items) {
            addCartItem({
                id: item.id,
                productId: item.id,
                name: item.name,
                price: item.price,
                sku: item.sku || item.id,
                quantity: 1,
                image: item.image,
            });
        }
        closeWishlist();
        openCart();
    };

    return (
        <WishlistContext.Provider
            value={{
                items,
                count: items.length,
                isOpen,
                hydrated,
                openWishlist,
                closeWishlist,
                addItem,
                removeItem,
                toggleItem,
                hasItem,
                clearWishlist,
                moveAllToCart,
            }}
        >
            {children}
        </WishlistContext.Provider>
    );
}

export function useWishlist(): WishlistContextValue {
    const ctx = useContext(WishlistContext);
    const items = useWishlistStore((s) => s.items);
    const isOpen = useWishlistStore((s) => s.isOpen);
    const openWishlist = useWishlistStore((s) => s.openWishlist);
    const closeWishlist = useWishlistStore((s) => s.closeWishlist);
    const addItem = useWishlistStore((s) => s.addItem);
    const removeItem = useWishlistStore((s) => s.removeItem);
    const toggleItem = useWishlistStore((s) => s.toggleItem);
    const hasItem = useWishlistStore((s) => s.hasItem);
    const clearWishlist = useWishlistStore((s) => s.clearWishlist);
    const hydrated = useWishlistHydration();
    const addCartItem = useCartStore((s) => s.addItem);
    const openCart = useCartStore((s) => s.openCart);

    if (ctx) return ctx;

    return {
        items,
        count: items.length,
        isOpen,
        hydrated,
        openWishlist,
        closeWishlist,
        addItem,
        removeItem,
        toggleItem,
        hasItem,
        clearWishlist,
        moveAllToCart: () => {
            for (const item of items) {
                addCartItem({
                    id: item.id,
                    productId: item.id,
                    name: item.name,
                    price: item.price,
                    sku: item.sku || item.id,
                    quantity: 1,
                    image: item.image,
                });
            }
            closeWishlist();
            openCart();
        },
    };
}
