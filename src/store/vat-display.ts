'use client';

// W22-D1 T4: su/be PVM display state — session-persisted, anonymous default
// is su PVM (gross). Display-only: checkout/JSON-LD always use gross.

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface VatDisplayState {
    showNet: boolean;
    toggle: () => void;
    setShowNet: (showNet: boolean) => void;
}

export const useVatDisplayStore = create<VatDisplayState>()(
    persist(
        (set) => ({
            showNet: false,
            toggle: () => set((s) => ({ showNet: !s.showNet })),
            setShowNet: (showNet) => set({ showNet }),
        }),
        {
            name: 'giles-vat-display',
            storage: createJSONStorage(() => sessionStorage),
        },
    ),
);
