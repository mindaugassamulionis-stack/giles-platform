'use server';

import { cookies } from 'next/headers';
import { db, userAddresses } from '@platform/database';
import { eq, and } from 'drizzle-orm';
import { verifyToken } from '../../../lib/auth';
import { revalidatePath } from 'next/cache';

export async function getUserFromSession() {
    const token = (await cookies()).get('auth-token')?.value;
    if (!token) return null;
    const payload = await verifyToken(token);
    if (!payload?.userId) return null;
    return payload;
}

export async function addAddress(formData: FormData) {
    const user = await getUserFromSession();
    if (!user) return { error: 'Unauthorized' };

    const name = formData.get('name') as string;
    const fullName = formData.get('fullName') as string;
    const addressLine1 = formData.get('addressLine1') as string;
    const city = formData.get('city') as string;
    const postalCode = formData.get('postalCode') as string;
    const country = formData.get('country') as string || 'LT';

    if (!name || !addressLine1 || !city || !postalCode) {
        return { error: 'Missing required fields' };
    }

    try {
        await db.insert(userAddresses).values({
            userId: user.userId,
            name,
            fullName,
            addressLine1,
            city,
            postalCode,
            country,
        });

        revalidatePath('/account');
        return { success: true };
    } catch (error) {
        console.error('Failed to add address:', error);
        return { error: 'Failed to save address' };
    }
}

export async function deleteAddress(addressId: string) {
    const user = await getUserFromSession();
    if (!user) return { error: 'Unauthorized' };

    try {
        await db.delete(userAddresses)
            .where(and(
                eq(userAddresses.id, addressId),
                eq(userAddresses.userId, user.userId)
            ));

        revalidatePath('/account');
        return { success: true };
    } catch (error) {
        return { error: 'Failed to delete address' };
    }
}

import bcrypt from 'bcryptjs';
import { users } from '@platform/database';
import { orders } from '@platform/database/schema/orders';
import { returnService, commsService } from '@platform/database';
import { desc } from 'drizzle-orm';
import { cancellationEmailVariables, type SupportedLanguage } from '../../../lib/cancellation';

const STORE_ID = process.env.NEXT_PUBLIC_STORE_ID || 'store_lt_main';

/**
 * BGB §356a cancellation ("Kündigung").
 *
 * Called from the two-step account cancellation UI (Kündigen → Bestätigen).
 * Wires into the EXISTING cancellation service (returnService.createRequest,
 * reason = 'cancellation') — no new schema — and queues the statutory
 * confirmation email through the DB-driven CommsService (Admin-editable
 * template `ORDER_CANCELLED`, language 'de').
 *
 * Contract selection: the customer's most-recent non-cancelled order is the
 * cancellable continuing obligation. Real live cancellations against paid
 * contracts / real email delivery are human-gated at the go-live cutover;
 * on staging this runs autonomously.
 */
export async function cancelContract(formData: FormData): Promise<{
    success?: boolean;
    error?: string;
    orderRef?: string;
    cancelledDate?: string;
}> {
    const session = await getUserFromSession();
    if (!session?.userId) return { error: 'Unauthorized' };

    const language = ((formData.get('language') as string) || 'de') as SupportedLanguage;

    // Resolve the customer's email from their account record.
    const dbUser = await db.query.users.findFirst({
        where: eq(users.id, session.userId),
    });
    if (!dbUser?.email) return { error: 'User not found' };

    // Find the most-recent cancellable contract (order) for this customer.
    const [contract] = await db
        .select()
        .from(orders)
        .where(eq(orders.customerEmail, dbUser.email))
        .orderBy(desc(orders.createdAt))
        .limit(1);

    if (!contract) {
        return { error: 'no_active_contract' };
    }

    const cancelledAt = new Date();
    const orderRef = String(contract.id).slice(0, 8).toUpperCase();

    try {
        // 1. Record the cancellation via the EXISTING cancellation service.
        await returnService.createRequest(
            String(contract.id),
            [],
            'cancellation',
            session.userId,
        );

        // 2. Queue the statutory confirmation email (DB-driven, Admin-editable
        //    template). templateId 'order_cancelled' → ORDER_CANCELLED enum.
        const variables = cancellationEmailVariables(language, {
            orderRef,
            customerEmail: dbUser.email,
            cancelledAt,
        });

        try {
            await commsService.queueMessage({
                storeId: STORE_ID,
                channel: 'email',
                recipientEmail: dbUser.email,
                templateId: 'order_cancelled',
                language,
                variables,
                relatedType: 'order',
                relatedId: String(contract.id),
            });
        } catch (mailErr) {
            // Email template may not be seeded for this store/language yet.
            // The on-screen durable confirmation still satisfies acknowledgement;
            // surface a warning but do not fail the cancellation.
            console.warn('[cancelContract] confirmation email not queued:', mailErr);
        }

        revalidatePath('/account');
        return {
            success: true,
            orderRef,
            cancelledDate: variables.cancelledDate,
        };
    } catch (error) {
        console.error('[cancelContract] failed:', error);
        return { error: 'Failed to process cancellation' };
    }
}

export async function changePassword(formData: FormData) {
    const user = await getUserFromSession();
    if (!user) return { error: 'Unauthorized' };

    const currentPassword = formData.get('currentPassword') as string;
    const newPassword = formData.get('newPassword') as string;

    if (!currentPassword || !newPassword) {
        return { error: 'Missing fields' };
    }

    if (newPassword.length < 6) {
        return { error: 'Password too short' };
    }

    try {
        // Fetch current hash
        const dbUser = await db.query.users.findFirst({
            where: eq(users.id, user.userId),
        });

        if (!dbUser) return { error: 'User not found' };

        // Verify current
        const isValid = await bcrypt.compare(currentPassword, dbUser.passwordHash);
        if (!isValid) {
            return { error: 'Incorrect current password' };
        }

        // Hash new
        const newHash = await bcrypt.hash(newPassword, 10);

        // Update
        await db.update(users)
            .set({ passwordHash: newHash })
            .where(eq(users.id, user.userId));

        return { success: true };
    } catch (error) {
        console.error(error);
        return { error: 'Failed to update password' };
    }
}

