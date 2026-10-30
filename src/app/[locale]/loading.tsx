import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function Loading() {
    const t = useTranslations();
    return (
        <div className="min-h-[50vh] flex flex-col items-center justify-center p-8" role="status" aria-live="polite">
            <div className="relative">
                <div className="w-16 h-16 border-4 border-[var(--border)] border-t-[var(--primary)] rounded-full animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-8 h-8 bg-[var(--background)] rounded-full" />
                </div>
            </div>
            <p className="mt-4 text-sm font-medium text-[var(--muted-foreground)]">
                {t('common.loading')}
            </p>
        </div>
    );
}
