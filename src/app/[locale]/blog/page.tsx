import type { Metadata } from 'next';
import { Construction } from 'lucide-react';
import { useTranslations } from 'next-intl';

export const metadata: Metadata = {
    title: 'Žurnalas | SURADAI',
    description: 'Naujienos apie ilgaamžiškumą ir mokslą.',
};

export default function BlogPage() {
    const t = useTranslations();
    return (
        <div className="min-h-screen bg-zinc-50 pt-32 pb-20">
            <div className="container mx-auto px-4 text-center">
                <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Construction className="w-10 h-10 text-emerald-600" />
                </div>
                <h1 className="font-display text-4xl font-bold mb-4">{t('blogPage.title')}</h1>
                <p className="text-zinc-500 max-w-lg mx-auto mb-8">
                    {t('blogPage.subtitle')}
                </p>
                <div className="inline-block px-6 py-2 bg-zinc-200 text-zinc-600 rounded-full text-sm font-medium">
                    {t('blogPage.comingSoon')}
                </div>
            </div>
        </div>
    );
}
