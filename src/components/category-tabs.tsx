'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';

interface Category {
    id: string;
    name: string;
    slug?: string;
    productCount?: number;
}

export function CategoryTabs({
    categories,
    selectedCategory,
    searchParams
}: {
    categories: Category[];
    selectedCategory?: string;
    searchParams: Record<string, string | undefined>;
}) {
    const t = useTranslations();
    const locale = useLocale() || 'lt';
    const buildUrl = (categoryId?: string) => {
        const params: Record<string, string> = {};
        for (const [k, v] of Object.entries(searchParams)) {
            if (v && v.trim() && k !== 'page' && k !== 'q') {
                params[k] = v.trim();
            }
        }
        if (categoryId) {
            params.category = categoryId;
        } else {
            delete params.category;
        }
        const searchString = new URLSearchParams(params).toString();
        return `/${locale}/products${searchString ? `?${searchString}` : ''}`;
    };

    return (
        <section className="lg:hidden py-2 bg-white border-b border-stone-200">
            <div className="container mx-auto max-w-6xl px-4 sm:px-6">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar" role="tablist" aria-label={t('catalog.categoriesLabel')}>
                    <CategoryChip
                        href={buildUrl()}
                        active={!selectedCategory}
                        count={categories.reduce((sum, cat) => sum + (cat.productCount ?? 0), 0)}
                        countLabel={t('catalogPage.productsWord')}
                    >
                        {t('catalog.all')}
                    </CategoryChip>

                    {categories.map((cat) => {
                        const isSelected = Boolean(
                            selectedCategory && (
                                selectedCategory === cat.id ||
                                selectedCategory.toLowerCase() === (cat.slug ?? '').toLowerCase() ||
                                selectedCategory.trim().toLowerCase() === cat.name.trim().toLowerCase()
                            )
                        );
                        return (
                            <CategoryChip
                                key={cat.id}
                                href={buildUrl(cat.name)}
                                active={isSelected}
                                count={cat.productCount}
                                countLabel={t('catalogPage.productsWord')}
                            >
                                {cat.name}
                            </CategoryChip>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}

function CategoryChip({
    href,
    active,
    children,
    count,
    countLabel,
}: {
    href: string;
    active?: boolean;
    children: React.ReactNode;
    count?: number;
    countLabel?: string;
}) {
    return (
        <Link
            href={href}
            rel="nofollow"
            role="tab"
            aria-selected={active}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs whitespace-nowrap shrink-0 transition-colors duration-150 ${active
                ? 'border-2 border-[var(--brand-accent)] bg-transparent text-stone-900 font-bold'
                : 'border border-stone-200 bg-transparent text-[var(--text-secondary)] hover:border-stone-900 hover:text-[var(--text-primary)] font-medium'
                }`}
        >
            <span>{children}</span>
            {typeof count === 'number' && count > 0 && (
                <span
                    className={`text-xs px-1.5 py-0.5 rounded-xs ${active ? 'bg-stone-100 text-stone-900 font-semibold' : 'bg-stone-100 text-stone-600'}`}
                    aria-label={`${count} ${countLabel ?? ''}`}
                >
                    {count}
                </span>
            )}
        </Link>
    );
}
