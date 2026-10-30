'use client';

import { create } from 'zustand';

export interface Message {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: number;
}

interface ChatState {
    isOpen: boolean;
    messages: Message[];
    isLoading: boolean;

    // Actions
    toggleChat: () => void;
    openChat: () => void;
    closeChat: () => void;
    addMessage: (message: Omit<Message, 'timestamp'>) => void;
    setLoading: (loading: boolean) => void;
    clearChat: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
    isOpen: false,
    messages: [
        {
            id: 'welcome',
            role: 'assistant',
            content: 'Sveiki! Aš esu SURADAI asistentas. Kaip galiu jums padėti?',
            timestamp: Date.now(),
        }
    ],
    isLoading: false,

    toggleChat: () => set((state) => ({ isOpen: !state.isOpen })),
    openChat: () => set({ isOpen: true }),
    closeChat: () => set({ isOpen: false }),

    addMessage: (message) => set((state) => ({
        messages: [
            ...state.messages,
            { ...message, timestamp: Date.now() }
        ]
    })),

    setLoading: (loading) => set({ isLoading: loading }),
    clearChat: () => set({ messages: [] }),
}));
