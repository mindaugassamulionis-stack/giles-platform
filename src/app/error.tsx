'use client';

import { useEffect } from 'react';
import { RefreshCw, AlertTriangle } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    const t = useTranslations();
    useEffect(() => {
        // Log the error to an error reporting service
        console.error('Storefront Error:', error);
    }, [error]);

    return (
        <div className="min-h-[60vh] flex items-center justify-center p-4">
            <div className="text-center max-w-md mx-auto">
                <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <AlertTriangle className="w-8 h-8 text-destructive" />
                </div>

                <h2 className="text-2xl font-bold font-display mb-2">
                    {t('errorPage.title')}
                </h2>

                <p className="text-muted-foreground mb-8">
                    {t('errorPage.desc')}
                </p>

                <div className="flex flex-col gap-3">
                    <button
                        onClick={reset}
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-all hover:scale-105"
                    >
                        <RefreshCw className="w-4 h-4" />
                        {t('errorPage.retry')}
                    </button>

                    <button
                        onClick={() => window.location.href = '/'}
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                        {t('errorPage.home')}
                    </button>

                    {process.env.NODE_ENV === 'development' && (
                        <div className="mt-8 p-4 bg-muted/50 rounded-lg text-left overflow-auto max-h-48 text-xs font-mono">
                            <p className="font-bold text-destructive mb-1">{error.name}</p>
                            <p>{error.message}</p>
                            {error.digest && <p className="mt-2 text-muted-foreground">Digest: {error.digest}</p>}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
