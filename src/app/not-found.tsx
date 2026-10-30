import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function NotFound() {
    const t = useTranslations();
    return (
        <div className="min-h-[70vh] flex flex-col items-center justify-center p-4 text-center">
            <div className="font-mono text-9xl font-bold text-primary/10 mb-8 select-none">
                404
            </div>

            <h2 className="text-3xl md:text-4xl font-bold font-display mb-4">
                {t('notFound.title')}
            </h2>

            <p className="text-lg text-muted-foreground max-w-md mb-8">
                {t('notFound.desc')}
            </p>

            <Link
                href="/"
                className="inline-flex items-center gap-2 px-8 py-3 bg-primary text-primary-foreground rounded-full font-medium hover:bg-primary/90 transition-all hover:shadow-lg"
            >
                <ArrowLeft className="w-4 h-4" />
                {t('notFound.home')}
            </Link>
        </div>
    );
}
