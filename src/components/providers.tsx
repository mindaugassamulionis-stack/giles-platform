'use client';

import { ReactLenis } from 'lenis/react';
import { CartDrawer } from './cart-drawer';
import { WishlistDrawer } from './wishlist-drawer';
import { CompareDrawer } from './compare-drawer';
import { WishlistProvider } from '../lib/wishlist-context';
import { StoreProvider } from '../context/store-context';
import {
    StorefrontConfigProvider,
    type StorefrontRuntimeConfigClient,
} from './storefront-config-provider';
import { SearchOverlay } from './search-overlay';
import { CookieConsent } from './CookieConsent';
import { SyncManager } from './sync-manager';

// W22-D1-FIX1 (VERDICT.md R2.1/R2.2, DESIGN.md v3): the v2 packing loader
// (Caveat caption + "Ruošiame rinkinius…" banned-token inflection) and the
// floating rounded-full chat pill are unmounted — pill chrome and
// handwritten fonts are banned; search-overlay remains the RFQ fallback.

export function Providers({
    children,
    initialRuntimeConfig,
}: {
    children: React.ReactNode;
    initialRuntimeConfig?: Partial<StorefrontRuntimeConfigClient> | null;
}) {
    return (
        <StorefrontConfigProvider initialConfig={initialRuntimeConfig}>
            <StoreProvider>
                <WishlistProvider>
                    <ReactLenis root>
                        {children}

                        {/* Global Components */}
                        <CartDrawer />
                        <WishlistDrawer />
                        <CompareDrawer />
                        <SearchOverlay />
                        <CookieConsent />
                        <SyncManager />
                    </ReactLenis>
                </WishlistProvider>
            </StoreProvider>
        </StorefrontConfigProvider>
    );
}
