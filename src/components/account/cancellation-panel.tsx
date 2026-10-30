'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { XCircle, AlertTriangle } from 'lucide-react';
import { cancelContract } from '../../app/[locale]/account/actions';

/**
 * BGB §356a "Kündigungsbutton" — two-step cancellation UI.
 *
 * Step 1: clearly-labelled "Verträge hier kündigen" button (§356a Abs. 1
 *         Satz 1 Nr. 1 — the cancellation button).
 * Step 2: confirmation page/button "Jetzt kündigen" (§356a Abs. 1 Satz 1
 *         Nr. 2 — the Bestätigungsseite / confirmation button).
 *
 * Reachable from the account area without additional login barriers beyond
 * normal account access. Only rendered for German customers (geo-injected by
 * the account page); other locales are unaffected.
 */

type Step = 'intro' | 'confirm' | 'done';

const COPY = {
    de: {
        sectionTitle: 'Verträge kündigen',
        sectionDesc:
            'Hier können Sie Ihre laufenden Verträge oder Abonnements jederzeit kündigen.',
        cancelButton: 'Verträge hier kündigen',
        confirmTitle: 'Kündigung bestätigen',
        confirmDesc:
            'Bitte bestätigen Sie, dass Sie Ihren Vertrag jetzt kündigen möchten. Sie erhalten anschließend eine Bestätigung auf einem dauerhaften Datenträger (per E-Mail).',
        confirmButton: 'Jetzt kündigen',
        back: 'Zurück',
        doneTitle: 'Ihre Kündigung wurde bestätigt',
        doneDesc: (ref: string, date: string) =>
            `Wir haben Ihre Kündigung zum Vertrag ${ref} am ${date} erhalten. Eine Bestätigung wurde per E-Mail versendet.`,
        errorGeneric: 'Die Kündigung konnte nicht verarbeitet werden. Bitte versuchen Sie es erneut.',
        errorNoContract: 'Es wurde kein aktiver Vertrag zum Kündigen gefunden.',
        processing: 'Wird bearbeitet…',
    },
} as const;

export function CancellationPanel({ language = 'de' }: { language?: 'de' }) {
    const t = COPY[language] ?? COPY.de;
    const router = useRouter();
    const [step, setStep] = useState<Step>('intro');
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<{ orderRef: string; cancelledDate: string } | null>(null);
    const [isPending, startTransition] = useTransition();

    const handleConfirm = () => {
        setError(null);
        startTransition(async () => {
            const fd = new FormData();
            fd.set('language', language);
            const res = await cancelContract(fd);
            if (res.error === 'no_active_contract') {
                setError(t.errorNoContract);
                return;
            }
            if (res.error || !res.success) {
                setError(t.errorGeneric);
                return;
            }
            setResult({ orderRef: res.orderRef!, cancelledDate: res.cancelledDate! });
            setStep('done');
            // Route to the durable on-screen confirmation page (§356a).
            router.push(
                `/account/cancellation/confirmed?ref=${encodeURIComponent(res.orderRef!)}&date=${encodeURIComponent(res.cancelledDate!)}`,
            );
        });
    };

    return (
        <section
            data-testid="cancellation-panel"
            data-geo="DE"
            className="p-6 bg-white rounded-2xl border border-zinc-200"
        >
            <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center shrink-0">
                    <XCircle className="w-6 h-6 text-red-600" />
                </div>
                <div className="flex-1">
                    <h2 className="font-bold text-lg mb-1">{t.sectionTitle}</h2>
                    <p className="text-sm text-zinc-500 mb-4">{t.sectionDesc}</p>

                    {error && (
                        <div className="mb-4 flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
                            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    {step === 'intro' && (
                        <button
                            type="button"
                            data-testid="kundigen-button"
                            onClick={() => {
                                setError(null);
                                setStep('confirm');
                            }}
                            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                        >
                            {t.cancelButton}
                        </button>
                    )}

                    {step === 'confirm' && (
                        <div data-testid="cancellation-confirm-step">
                            <h3 className="font-semibold text-base mb-2">{t.confirmTitle}</h3>
                            <p className="text-sm text-zinc-600 mb-4">{t.confirmDesc}</p>
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    data-testid="kundigen-confirm-button"
                                    disabled={isPending}
                                    onClick={handleConfirm}
                                    className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-60"
                                >
                                    {isPending ? t.processing : t.confirmButton}
                                </button>
                                <button
                                    type="button"
                                    disabled={isPending}
                                    onClick={() => setStep('intro')}
                                    className="inline-flex items-center px-5 py-2.5 text-sm font-medium text-zinc-700 bg-zinc-100 rounded-lg hover:bg-zinc-200 transition-colors disabled:opacity-60"
                                >
                                    {t.back}
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 'done' && result && (
                        <div data-testid="cancellation-done" className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                            <p className="font-semibold">{t.doneTitle}</p>
                            <p>{t.doneDesc(result.orderRef, result.cancelledDate)}</p>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}
