import React from 'react';

// W118-A2: Cloudflare email obfuscation rewrites addresses in the SSR HTML,
// which breaks React hydration (#418) and injects a CSP-violating decode
// script. Addresses wrapped in these markers are skipped by Cloudflare, so
// the server HTML reaches the browser unchanged.
// Rendered via dangerouslySetInnerHTML because JSX strips HTML comments.

function escapeHtmlAttr(value: string): string {
    return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

export function EmailText({ email, className }: { email: string; className?: string }) {
    const cls = className ? ` class="${escapeHtmlAttr(className)}"` : '';
    return (
        <span
            dangerouslySetInnerHTML={{
                __html: `<!--email_off--><span${cls}>${email}</span><!--/email_off-->`,
            }}
        />
    );
}

export function EmailLink({
    email,
    className,
    label,
}: {
    email: string;
    className?: string;
    label?: string;
}) {
    const cls = className ? ` class="${escapeHtmlAttr(className)}"` : '';
    return (
        <span
            dangerouslySetInnerHTML={{
                __html: `<!--email_off--><a href="mailto:${email}"${cls}>${label || email}</a><!--/email_off-->`,
            }}
        />
    );
}

const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;

// Renders a copy string that contains an email address, wrapping only the
// address in the Cloudflare-skipped markers.
export function TextWithEmail({ text, className }: { text: string; className?: string }) {
    const parts = text.split(EMAIL_RE);
    const emails = text.match(EMAIL_RE) || [];
    return (
        <span className={className}>
            {parts.map((part, i) => (
                <React.Fragment key={i}>
                    {part}
                    {i < emails.length && <EmailText email={emails[i]} />}
                </React.Fragment>
            ))}
        </span>
    );
}
