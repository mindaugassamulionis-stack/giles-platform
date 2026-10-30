/**
 * Staging bootstrap: seed the German (BGB §356a) cancellation-confirmation
 * email template into the DB-driven, Admin-editable email_templates store.
 *
 * This is IDEMPOTENT and additive: it only inserts a row if a DE
 * ORDER_CANCELLED template does not already exist for the store. After
 * seeding, the template is fully editable via Admin > Settings > Email
 * Templates — the copy is NOT hardcoded in the send path.
 *
 * Usage:
 *   NEXT_PUBLIC_STORE_ID=<store> \
 *   node --import tsx apps/storefront-suradai/scripts/seed-de-cancellation-template.ts
 */
import { db } from '@platform/database';
import { emailTemplates } from '@platform/database/schema/email-templates';
import { and, eq } from 'drizzle-orm';

const STORE_ID = process.env.NEXT_PUBLIC_STORE_ID || process.argv[2] || 'store_lt_main';
const LANGUAGE = 'de';
const TEMPLATE_TYPE = 'ORDER_CANCELLED';

const SUBJECT = 'Bestätigung Ihrer Kündigung – Vertrag {{orderRef}}';

// {{...}} placeholders are filled by CommsService from
// cancellationEmailVariables(). Admin can freely edit this HTML afterwards.
const BODY_HTML = `<!DOCTYPE html>
<html lang="de">
  <body style="font-family: Arial, sans-serif; color: #18181b; max-width: 600px; margin: 0 auto;">
    <h1 style="font-size: 22px;">{{heading}}</h1>
    <p>{{acknowledgement}}</p>
    <p>{{body}}</p>
    <table style="width:100%; border-collapse: collapse; margin: 16px 0;">
      <tr>
        <td style="padding:6px 0; color:#71717a;">Vertrag</td>
        <td style="padding:6px 0; text-align:right; font-weight:600;">{{orderRef}}</td>
      </tr>
      <tr>
        <td style="padding:6px 0; color:#71717a;">Datum der Kündigung</td>
        <td style="padding:6px 0; text-align:right; font-weight:600;">{{cancelledDate}}</td>
      </tr>
    </table>
    <p style="color:#71717a; font-size: 13px;">
      Diese E-Mail dient als Bestätigung auf einem dauerhaften Datenträger gemäß § 356a BGB.
    </p>
  </body>
</html>`;

const BODY_TEXT = `{{heading}}

{{acknowledgement}}

{{body}}

Vertrag: {{orderRef}}
Datum der Kündigung: {{cancelledDate}}

Diese E-Mail dient als Bestätigung auf einem dauerhaften Datentraeger gemaess § 356a BGB.`;

async function main() {
    const existing = await db
        .select()
        .from(emailTemplates)
        .where(
            and(
                eq(emailTemplates.templateType, TEMPLATE_TYPE as any),
                eq(emailTemplates.storeId, STORE_ID),
                eq(emailTemplates.language, LANGUAGE),
                eq(emailTemplates.isActive, true),
            ),
        )
        .limit(1);

    if (existing.length > 0) {
        console.log(`[seed] DE ${TEMPLATE_TYPE} template already exists for store ${STORE_ID} (id=${existing[0].id}). Nothing to do.`);
        return;
    }

    const [row] = await db
        .insert(emailTemplates)
        .values({
            templateType: TEMPLATE_TYPE as any,
            storeId: STORE_ID,
            language: LANGUAGE,
            subject: SUBJECT,
            bodyHtml: BODY_HTML,
            bodyText: BODY_TEXT,
            fromName: 'Kundenservice',
            fromEmail: process.env.MAIL_FROM || 'noreply@example.com',
            availableVariables: ['heading', 'acknowledgement', 'body', 'orderRef', 'cancelledDate', 'customerEmail'],
            createdBy: 'seed:bgb356a',
        })
        .returning();

    console.log(`[seed] Inserted DE ${TEMPLATE_TYPE} template for store ${STORE_ID} (id=${row.id}). Editable in Admin > Email Templates.`);
}

main()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error('[seed] failed:', err);
        process.exit(1);
    });
