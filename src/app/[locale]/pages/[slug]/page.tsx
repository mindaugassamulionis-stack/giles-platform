import { notFound } from 'next/navigation';
import { getStorefrontPage } from '@/lib/storefront-content';
import { getTranslations } from 'next-intl/server';

type PageProps = {
    params: Promise<{ slug: string }>;
};

// W2-06 (SEC-INJ-04): minimal allowlist HTML sanitizer. Strips any tag
// outside the safe set, drops <script>, <style>, on* / javascript:
// attributes, and breaks the script-context breakout. A heavier
// library (DOMPurify / isomorphic-dompurify) can replace this once the
// package is added; the contract (no raw dangerouslySetInnerHTML of
// user content) is what this slice owns.
const ALLOWED_TAGS = new Set([
    'a', 'p', 'br', 'strong', 'em', 'u', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4',
    'blockquote', 'code', 'pre', 'img', 'figure', 'figcaption', 'span', 'div',
    'table', 'thead', 'tbody', 'tr', 'td', 'th',
]);
const ALLOWED_ATTRS = new Set(['href', 'src', 'alt', 'title', 'class']);

function sanitizeHtml(input: string): string {
    if (!input) return '';
    // 1. Strip <script>...</script> and <style>...</style> entirely.
    let s = input.replace(/<script\b[\s\S]*?<\/script\s*>/gi, '');
    s = s.replace(/<style\b[\s\S]*?<\/style\s*>/gi, '');
    // 2. Walk every tag and drop disallowed ones, then strip on* + javascript: attrs.
    s = s.replace(/<\/?([a-zA-Z][a-zA-Z0-9]*)([^>]*)>/g, (full, rawTag: string, rawAttrs: string) => {
        const tag = String(rawTag).toLowerCase();
        if (!ALLOWED_TAGS.has(tag)) return '';
        if (full.startsWith('</')) return `</${tag}>`;
        const attrs = String(rawAttrs).replace(
            /\s+([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/g,
            (m, name: string, _v, dq?: string, sq?: string, bare?: string) => {
                const lname = String(name).toLowerCase();
                if (lname.startsWith('on')) return '';
                const value = dq ?? sq ?? bare ?? '';
                if (/^\s*javascript:/i.test(value)) return '';
                if (/^\s*data:/i.test(value) && !['src', 'href'].includes(lname)) return '';
                if (!ALLOWED_ATTRS.has(lname)) return '';
                return ` ${lname}="${String(value).replace(/"/g, '&quot;')}"`;
            },
        );
        return `<${tag}${attrs}>`;
    });
    return s;
}

export default async function StorefrontPage({ params }: PageProps) {
    const t = await getTranslations();
    const { slug } = await params;
    const page = await getStorefrontPage(slug);
    if (!page || page.status !== 'published') {
        notFound();
    }

    const safeContent = sanitizeHtml(page.content || '');

    return (
        <div className="max-w-3xl mx-auto py-12 px-6">
            <h1 className="text-3xl font-semibold mb-6">{page.title}</h1>
            {safeContent ? (
                <div
                    className="prose prose-zinc max-w-none"
                    dangerouslySetInnerHTML={{ __html: safeContent }}
                />
            ) : (
                <p className="text-muted-foreground">{t('cmsPage.noContent')}</p>
            )}
        </div>
    );
}
