'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export type PageType = 'home' | 'product' | 'cart' | 'checkout' | 'other';

export interface ProductContext {
    id: string;
    name: string;
    price: number;
    inStock: boolean;
}

interface StoreContextState {
    pageType: PageType;
    activeProduct?: ProductContext;
    setPageContext: (type: PageType, product?: ProductContext) => void;
}

const StoreContext = createContext<StoreContextState | undefined>(undefined);

export function StoreProvider({ children }: { children: ReactNode }) {
    const [pageType, setPageType] = useState<PageType>('other');
    const [activeProduct, setActiveProduct] = useState<ProductContext | undefined>(undefined);

    // Stable callback reference to prevent repeated state updates in consumers
    const setPageContext = useCallback((type: PageType, product?: ProductContext) => {
        setPageType(type);
        setActiveProduct(product);
    }, []);

    return (
        <StoreContext.Provider value={{ pageType, activeProduct, setPageContext }}>
            {children}
        </StoreContext.Provider>
    );
}

export function useStoreContext() {
    const context = useContext(StoreContext);
    if (context === undefined) {
        throw new Error('useStoreContext must be used within a StoreProvider');
    }
    return context;
}
