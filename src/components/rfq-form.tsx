'use client';

// W22-D1 T6: RFQ form — no-auth, honeypot + rate-limit handled by /api/rfq.
// Static supplier-verified topics only; confirmation carries the reference.

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { RFQ_TOPICS } from '../lib/rfq';
import { apiUrl } from '../lib/api';

type Status = 'idle' | 'submitting' | 'success' | 'error' | 'rate_limited';

export function RfqForm() {
    const t = useTranslations();
    const params = useSearchParams();
    const contextSku = params.get('kodas') ?? params.get('context') ?? '';

    const [topic, setTopic] = useState<string>(RFQ_TOPICS[0].id);
    const [contact, setContact] = useState('');
    const [company, setCompany] = useState('');
    const [message, setMessage] = useState('');
    const [honeypot, setHoneypot] = useState('');
    const [status, setStatus] = useState<Status>('idle');
    const [reference, setReference] = useState('');

    async function submit(e: React.FormEvent) {
        e.preventDefault();
        setStatus('submitting');
        try {
            const res = await fetch(apiUrl('/api/rfq'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ topic, contact, company, message, honeypot, contextSku }),
            });
            if (res.status === 429) {
                setStatus('rate_limited');
                return;
            }
            const data = await res.json();
            if (res.ok && data.ok) {
                setReference(data.reference);
                setStatus('success');
            } else {
                setStatus('error');
            }
        } catch {
            setStatus('error');
        }
    }

    if (status === 'success') {
        return (
            <div className="border border-[var(--data-ok)]/50 bg-card rounded-[2px] p-10 text-center" role="status">
                <h2 className="font-display text-2xl font-bold text-foreground mb-3">{t('rfqPage.successTitle')}</h2>
                <p className="font-mono text-sm text-muted-foreground mb-1">{t('rfqPage.successRef')}</p>
                <p className="font-mono text-xl font-bold text-[var(--primary)] mb-4">{reference}</p>
                <p className="text-muted-foreground max-w-md mx-auto">{t('rfqPage.successNote')}</p>
            </div>
        );
    }

    const inputCls = 'w-full rounded-[2px] border border-border bg-card px-4 py-3 text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-[var(--primary)] transition-colors';
    const labelCls = 'block font-mono text-xs uppercase tracking-wide text-muted-foreground mb-2';

    return (
        <form onSubmit={submit} className="border border-border bg-card rounded-[2px] p-6 md:p-8 space-y-5" noValidate={false}>
            <div>
                <label htmlFor="rfq-topic" className={labelCls}>{t('rfqPage.topicLabel')}</label>
                <select
                    id="rfq-topic"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className={inputCls}
                >
                    {RFQ_TOPICS.map((tp) => (
                        <option key={tp.id} value={tp.id}>
                            {t(`rfqPage.topics.${tp.id}`)}
                        </option>
                    ))}
                </select>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
                <div>
                    <label htmlFor="rfq-contact" className={labelCls}>{t('rfqPage.contactLabel')}</label>
                    <input
                        id="rfq-contact"
                        type="text"
                        required
                        value={contact}
                        onChange={(e) => setContact(e.target.value)}
                        className={inputCls}
                        autoComplete="email"
                    />
                </div>
                <div>
                    <label htmlFor="rfq-company" className={labelCls}>{t('rfqPage.companyLabel')}</label>
                    <input
                        id="rfq-company"
                        type="text"
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        className={inputCls}
                        autoComplete="organization"
                    />
                </div>
            </div>

            <div>
                <label htmlFor="rfq-message" className={labelCls}>{t('rfqPage.messageLabel')}</label>
                <textarea
                    id="rfq-message"
                    required
                    rows={6}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={t('rfqPage.messagePlaceholder')}
                    className={inputCls}
                />
            </div>

            {contextSku && (
                <p className="font-mono text-sm text-muted-foreground">
                    {t('rfqPage.contextLabel')}: <span className="font-bold text-foreground">{contextSku}</span>
                </p>
            )}

            {/* Honeypot: visually + AT hidden; bots fill it, humans never see it. */}
            <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
                <label htmlFor="rfq-hp">{t('rfqPage.company')}</label>
                <input
                    id="rfq-hp"
                    type="text"
                    tabIndex={-1}
                    autoComplete="off"
                    value={honeypot}
                    onChange={(e) => setHoneypot(e.target.value)}
                />
            </div>

            {status === 'error' && (
                <p role="alert" className="text-sm text-[var(--data-error)]">{t('rfqPage.errorGeneric')}</p>
            )}
            {status === 'rate_limited' && (
                <p role="alert" className="text-sm text-[var(--data-warn)]">{t('rfqPage.rateLimited')}</p>
            )}

            <button
                type="submit"
                disabled={status === 'submitting'}
                className="inline-flex h-12 items-center justify-center rounded-[2px] bg-[var(--accent)] px-8 text-sm font-bold text-white transition-colors duration-150 hover:bg-[var(--accent-hover)] disabled:opacity-50"
            >
                {status === 'submitting' ? t('rfqPage.submitting') : t('rfqPage.submit')}
            </button>
        </form>
    );
}
