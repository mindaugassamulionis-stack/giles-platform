'use client';

import { useEffect } from 'react';
import { Outfit, Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { useTranslations } from 'next-intl';

// Fonts duplicate from layout to ensure they load in error state
const outfit = Outfit({ subsets: ['latin'], variable: '--font-display' });
const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' });

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    const t = useTranslations();
    useEffect(() => {
        console.error('Global Error:', error);
    }, [error]);

    return (
        <html lang="lt" className={`${outfit.variable} ${inter.variable} ${mono.variable}`}>
            <body className="bg-background text-foreground antialiased min-h-screen flex items-center justify-center">
                <div className="text-center p-8 max-w-lg">
                    <h1 className="text-4xl font-bold font-display mb-4">
                        {t('globalError.title')}
                    </h1>
                    <p className="text-lg text-muted-foreground mb-8">
                        {t('globalError.desc')}
                    </p>

                    <button
                        onClick={reset}
                        className="inline-flex items-center justify-center px-8 py-3 bg-primary text-primary-foreground rounded-full font-medium hover:bg-primary/90 transition-all"
                    >
                        {t('globalError.reload')}
                    </button>

                    {process.env.NODE_ENV === 'development' && (
                        <pre className="mt-8 p-4 bg-black/5 rounded-lg text-left overflow-auto text-xs font-mono text-destructive">
                            {error.stack}
                        </pre>
                    )}
                </div>
            </body>
        </html>
    );
}
