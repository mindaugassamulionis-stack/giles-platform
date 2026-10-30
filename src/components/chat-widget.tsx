'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Minimize2, User, Sparkles, Phone } from 'lucide-react';
import { useChatStore, Message } from '../store/chat';
import { useStoreContext } from '../context/store-context';
import { useCartStore } from '../store/cart';
import { useTranslations } from 'next-intl';

// Parse and render markdown links and basic formatting
function MessageContent({ content, isUser }: { content: string; isUser: boolean }) {
    // Parse markdown links: [text](url)
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    // Parse bold: **text**
    const boldRegex = /\*\*([^*]+)\*\*/g;

    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;

    // First, handle links
    const processedContent = content.replace(linkRegex, (match, text, url) => {
        return `{{LINK:${text}:${url}}}`;
    });

    // Split by link placeholders and render
    const segments = processedContent.split(/({{LINK:[^}]+}})/);

    return (
        <span className="whitespace-pre-wrap">
            {segments.map((segment, i) => {
                if (segment.startsWith('{{LINK:')) {
                    const [, text, url] = segment.match(/{{LINK:([^:]+):([^}]+)}}/) || [];
                    if (text && url) {
                        return (
                            <Link
                                key={i}
                                href={url}
                                className={`underline font-medium ${isUser ? 'text-white/90 hover:text-white' : 'text-emerald-600 hover:text-emerald-700'} transition-colors`}
                            >
                                {text}
                            </Link>
                        );
                    }
                }

                // Handle bold within non-link segments
                const boldParts = segment.split(boldRegex);
                if (boldParts.length > 1) {
                    return boldParts.map((part, j) =>
                        j % 2 === 1 ? <strong key={`${i}-${j}`}>{part}</strong> : part
                    );
                }

                return segment;
            })}
        </span>
    );
}


export function ChatWidget() {
    const t = useTranslations();
    const { isOpen, toggleChat, messages, addMessage, isLoading, setLoading } = useChatStore();
    const [input, setInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Move hook calls to top level (Rules of Hooks)
    const { pageType, activeProduct } = useStoreContext();

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage = input.trim();
        setInput('');

        // Add user message
        addMessage({
            id: Date.now().toString(),
            role: 'user',
            content: userMessage
        });
        setLoading(true);

        // Get fresh cart state (Zustand getState is safe to call anywhere)
        const { items: cartItems } = useCartStore.getState();

        try {
            const context = {
                pageType,
                activeProduct,
                cartItemCount: cartItems.length,
                cartTotal: cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0),
                cartItems: cartItems.map(i => i.name) // Send names for context
            };

            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: userMessage,
                    context
                }),
            });

            if (!response.ok) throw new Error('Failed to send');

            const data = await response.json();

            // Add bot response
            addMessage({
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: data.response
            });
        } catch (error) {
            console.error('Chat error:', error);
            addMessage({
                id: (Date.now() + 1).toString(),
                role: 'system',
                content: 'Atsiprašome, įvyko klaida. Bandykite vėliau.'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="mb-4 w-[380px] h-[600px] max-h-[80vh] bg-background border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden"
                    >
                        {/* Header */}
                        <div className="p-4 bg-primary text-primary-foreground flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
                                    <Sparkles className="w-5 h-5 text-accent" />
                                </div>
                                <div>
                                    <h3 className="font-semibold">{t('chat.agent')}</h3>
                                    <div className="flex items-center gap-1.5">
                                        <span className="w-2 h-2 bg-[var(--data-ok)] rounded-full" />
                                        <span className="text-xs opacity-90">{t('chat.online')}</span>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={toggleChat}
                                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                            >
                                <Minimize2 className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-zinc-50/50">
                            {/* Welcome message when no messages */}
                            {messages.length === 0 && (
                                <div className="flex flex-col items-center justify-center h-full text-center p-6">
                                    <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                                        <Sparkles className="w-8 h-8 text-emerald-600" />
                                    </div>
                                    <h4 className="font-semibold text-lg text-zinc-800 mb-2">{t('chat.greeting')}</h4>
                                    <p className="text-zinc-600 mb-1">{t('chat.ask')}</p>
                                    <p className="text-xs text-zinc-400">{t('chat.capabilities')}</p>
                                </div>
                            )}
                            {messages.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div
                                        className={`max-w-[85%] rounded-2xl p-3 text-sm shadow-sm ${msg.role === 'user'
                                            ? 'bg-primary text-primary-foreground rounded-tr-none'
                                            : msg.role === 'system'
                                                ? 'bg-destructive/10 text-destructive border border-destructive/20'
                                                : 'bg-white border border-border rounded-tl-none'
                                            }`}
                                    >
                                        <MessageContent content={msg.content} isUser={msg.role === 'user'} />
                                        <div className={`text-[10px] mt-1 ${msg.role === 'user' ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {isLoading && (
                                <div className="flex justify-start">
                                    <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl rounded-tl-none p-4 shadow-sm" role="status" aria-live="polite">
                                        <div className="flex gap-1.5 items-center text-xs text-[var(--muted-foreground)]">
                                            <span className="w-2 h-2 bg-[var(--muted-foreground)] rounded-full" />
                                            <span className="w-2 h-2 bg-[var(--muted-foreground)]/70 rounded-full" />
                                            <span className="w-2 h-2 bg-[var(--muted-foreground)]/40 rounded-full" />
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <form onSubmit={handleSubmit} className="p-4 bg-background border-t border-border shrink-0">
                            <div className="relative">
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder={t('chat.placeholder')}
                                    className="w-full pl-4 pr-12 py-3 bg-muted/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                />
                                <button
                                    type="submit"
                                    disabled={!input.trim() || isLoading}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:hover:bg-primary"
                                >
                                    <Send className="w-4 h-4" />
                                </button>
                            </div>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Toggle Button */}
            {!isOpen && (
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={toggleChat}
                    className="w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg flex items-center justify-center hover:bg-primary/90 transition-colors group relative"
                >
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-[var(--data-ok)] rounded-full border-2 border-[var(--background)]" />
                    <MessageCircle className="w-7 h-7" />
                </motion.button>
            )}
        </div>
    );
}
