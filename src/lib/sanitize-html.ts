/**
 * Lightweight HTML Sanitizer for CMS Content
 *
 * Hoisted from apps/storefront-suradai/src/app/pages/[slug]/page.tsx (W2-06)
 * to a shared module so legal pages (C-INJ-04) can reuse the same
 * allowlist HTML sanitizer as CMS pages. Strips dangerous HTML tags/attributes
 * while preserving safe formatting. Used for server-rendered
 * dangerouslySetInnerHTML on operator-writable content.
 */

// Tags allowed in CMS / legal content
const ALLOWED_TAGS = new Set([
    'a', 'p', 'br', 'strong', 'em', 'u', 'ul', 'ol', 'li',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'blockquote', 'code', 'pre', 'img', 'figure', 'figcaption',
    'span', 'div', 'table', 'thead', 'tbody', 'tr', 'td', 'th',
]);

// Attributes allowed (any tag)
const ALLOWED_ATTRS = new Set(['href', 'src', 'alt', 'title', 'class']);

/**
 * Sanitize HTML content for safe rendering.
 * Strips <script>/<style>, on*-event handlers, javascript: URLs, and any
 * tag/attribute outside the allowlist. Returns empty string for empty input.
 */
export function sanitizeHtml(input: string): string {
    if (!input) return '';

    // 1. Strip <script>...</script> and <style>...</style> entirely.
    let s = input.replace(/<script\b[\s\S]*?<\/script\s*>/gi, '');
    s = s.replace(/<style\b[\s\S]*?<\/style\s*>/gi, '');

    // 2. Walk every tag; drop disallowed ones, then strip on* + javascript: attrs.
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
