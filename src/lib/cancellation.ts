/**
 * Cancellation confirmation content (BGB §356a).
 *
 * §356a (Kündigungsbutton) requires that after a consumer cancels a
 * continuing-obligation contract, the trader confirms — on a durable medium
 * (Bestätigung auf einem dauerhaften Datenträger) — that the cancellation was
 * received, restating the content and the effective date/time.
 *
 * This module builds the localized on-screen + email confirmation content.
 * The German copy here is the *default fallback*; the authoritative, live
 * copy is the Admin-editable DB email template (email_templates, language
 * 'de'). Keeping this pure makes the statutory content unit-testable.
 */

export type SupportedLanguage = 'de' | 'lt' | 'en';

export interface CancellationContext {
    /** Human-readable contract/order reference shown to the customer. */
    orderRef: string;
    customerEmail: string;
    /** When the cancellation was received/took effect. */
    cancelledAt: Date;
}

export interface CancellationConfirmation {
    language: SupportedLanguage;
    heading: string;
    body: string;
    /** Short line suitable for a durable-medium acknowledgement. */
    acknowledgement: string;
}

/** Format a date as DD.MM.YYYY (DE convention, also unambiguous for LT/EN). */
export function formatCancellationDate(d: Date): string {
    const day = String(d.getUTCDate()).padStart(2, '0');
    const month = String(d.getUTCMonth() + 1).padStart(2, '0');
    const year = d.getUTCFullYear();
    return `${day}.${month}.${year}`;
}

const COPY: Record<SupportedLanguage, (ref: string, date: string) => Omit<CancellationConfirmation, 'language'>> = {
    de: (ref, date) => ({
        heading: 'Ihre Kündigung wurde bestätigt',
        acknowledgement: `Wir bestätigen den Eingang Ihrer Kündigung am ${date}.`,
        body:
            `Wir bestätigen, dass wir Ihre Kündigung zum Vertrag ${ref} erhalten haben. ` +
            `Die Kündigung ist am ${date} bei uns eingegangen und wird zum nächstmöglichen ` +
            `Zeitpunkt wirksam. Diese Bestätigung erhalten Sie zusätzlich per E-Mail auf einem ` +
            `dauerhaften Datenträger. Sollten Sie Fragen haben, kontaktieren Sie uns bitte.`,
    }),
    lt: (ref, date) => ({
        heading: 'Jūsų sutartis nutraukta',
        acknowledgement: `Patvirtiname, kad ${date} gavome jūsų prašymą nutraukti sutartį.`,
        body:
            `Patvirtiname, kad gavome jūsų prašymą nutraukti sutartį ${ref}. ` +
            `Prašymas gautas ${date} ir bus įvykdytas artimiausiu metu. ` +
            `Šį patvirtinimą taip pat gausite el. paštu.`,
    }),
    en: (ref, date) => ({
        heading: 'Your cancellation is confirmed',
        acknowledgement: `We confirm receipt of your cancellation on ${date}.`,
        body:
            `We confirm that we have received your cancellation for contract ${ref}. ` +
            `It was received on ${date} and will take effect at the earliest possible date. ` +
            `You will also receive this confirmation by email.`,
    }),
};

export function buildCancellationConfirmation(
    language: SupportedLanguage,
    ctx: CancellationContext,
): CancellationConfirmation {
    const date = formatCancellationDate(ctx.cancelledAt);
    const copy = (COPY[language] ?? COPY.en)(ctx.orderRef, date);
    return { language, ...copy };
}

/**
 * Variables for the Admin-editable DB email template ({{orderRef}} etc.).
 * The DB template owns the surrounding HTML/branding; this supplies the
 * statutory, localized values.
 */
export function cancellationEmailVariables(
    language: SupportedLanguage,
    ctx: CancellationContext,
): Record<string, string> {
    const c = buildCancellationConfirmation(language, ctx);
    return {
        orderRef: ctx.orderRef,
        customerEmail: ctx.customerEmail,
        cancelledDate: formatCancellationDate(ctx.cancelledAt),
        heading: c.heading,
        acknowledgement: c.acknowledgement,
        body: c.body,
    };
}
