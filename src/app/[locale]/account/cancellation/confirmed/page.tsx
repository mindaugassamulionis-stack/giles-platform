import type { Metadata } from 'next';
import Link from 'next/link';
import { cookies, headers } from 'next/headers';
import { CheckCircle, Mail, ArrowLeft } from 'lucide-react';
import {
    buildCancellationConfirmation,
    type SupportedLanguage,
} from '../../../../../lib/cancellation';
import { detectCountry, isGermanCustomer } from '../../../../../lib/geo';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
    title: 'Kündigung bestätigt',
};

/**
 * BGB §356a on-screen durable confirmation ("Bestätigungsseite").
 *
 * Shown immediately after a successful cancellation. Restates the content and
 * date of the cancellation. A matching confirmation is also sent by email
 * (durable medium). German copy for DE customers; LT fallback otherwise.
 */
export default async function CancellationConfirmedPage({
    searchParams,
}: {
    searchParams: Promise<{ ref?: string; date?: string }>;
}) {
    const resolvedParams = await searchParams;
    const country = detectCountry(
        (await headers()) as unknown as Headers,
        undefined,
    ) || (await cookies()).get('geo-country')?.value || null;

    const language: SupportedLanguage = isGermanCustomer(country) ? 'de' : 'lt';

    const orderRef = resolvedParams.ref || '—';
    // The date param is already formatted DD.MM.YYYY; parse defensively.
    const parsedDate = parseFormattedDate(resolvedParams.date);

    const confirmation = buildCancellationConfirmation(language, {
        orderRef,
        customerEmail: '',
        cancelledAt: parsedDate,
    });

    const backLabel = language === 'de' ? 'Zurück zum Konto' : 'Grįžti į paskyrą';
    const emailNote =
        language === 'de'
            ? 'Diese Bestätigung wurde zusätzlich per E-Mail an Sie versendet.'
            : 'Šis patvirtinimas taip pat išsiųstas jums el. paštu.';

    return (
        <div className="min-h-screen bg-zinc-50 pt-24">
            <div className="container mx-auto px-4 py-12">
                <div className="max-w-2xl mx-auto text-center">
                    <div className="mb-8">
                        <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                            <CheckCircle className="w-12 h-12 text-emerald-600" />
                        </div>
                    </div>

                    <h1
                        data-testid="cancellation-confirmed-heading"
                        className="font-display text-3xl md:text-4xl font-bold mb-4"
                    >
                        {confirmation.heading}
                    </h1>

                    <div className="bg-white rounded-2xl p-8 shadow-sm border border-zinc-200 text-left mb-8">
                        <p data-testid="cancellation-confirmed-body" className="text-zinc-700 leading-relaxed">
                            {confirmation.body}
                        </p>

                        <div className="mt-6 space-y-2 text-sm border-t border-zinc-100 pt-4">
                            <div className="flex justify-between">
                                <span className="text-zinc-500">
                                    {language === 'de' ? 'Vertrag' : 'Sutartis'}:
                                </span>
                                <span className="font-mono font-medium" data-testid="cancellation-order-ref">
                                    {orderRef}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-zinc-500">
                                    {language === 'de' ? 'Datum' : 'Data'}:
                                </span>
                                <span className="font-medium" data-testid="cancellation-date">
                                    {resolvedParams.date || '—'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-center gap-2 text-sm text-zinc-500 mb-8">
                        <Mail className="w-4 h-4" />
                        <span>{emailNote}</span>
                    </div>

                    <Link
                        href="/account"
                        className="inline-flex items-center justify-center gap-2 px-8 py-3 border border-zinc-300 rounded-full font-medium hover:bg-zinc-100 transition-all"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        {backLabel}
                    </Link>
                </div>
            </div>
        </div>
    );
}

function parseFormattedDate(formatted?: string): Date {
    if (formatted) {
        const m = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(formatted);
        if (m) {
            return new Date(Date.UTC(Number(m[3]), Number(m[2]) - 1, Number(m[1])));
        }
    }
    return new Date();
}
