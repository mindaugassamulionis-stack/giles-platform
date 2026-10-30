'use server';

import { cookies } from 'next/headers';
import { db, wishlistItems } from '@platform/database';
import { eq, and, inArray } from 'drizzle-orm';
import { verifyToken } from '../../../lib/auth';

export async function getUserFromSession() {
    const token = (await cookies()).get('auth-token')?.value;
    if (!token) return null;
    const payload = await verifyToken(token);
    if (!payload?.userId) return null;
    return payload;
}

export async function getWishlist() {
    const user = await getUserFromSession();
    if (!user) return [];

    const items = await db.select().from(wishlistItems).where(eq(wishlistItems.userId, user.userId));
    return items.map((i: any) => i.productId);
}

export async function addToWishlist(productId: string) {
    const user = await getUserFromSession();
    if (!user) return { error: 'Unauthorized' };

    try {
        // Check if exists
        const existing = await db.query.wishlistItems.findFirst({
            where: and(
                eq(wishlistItems.userId, user.userId),
                eq(wishlistItems.productId, productId)
            )
        });

        if (!existing) {
            await db.insert(wishlistItems).values({
                userId: user.userId,
                productId
            });
        }
        return { success: true };
    } catch (error) {
        return { error: 'Failed to add' };
    }
}

export async function removeFromWishlist(productId: string) {
    const user = await getUserFromSession();
    if (!user) return { error: 'Unauthorized' };

    try {
        await db.delete(wishlistItems).where(
            and(
                eq(wishlistItems.userId, user.userId),
                eq(wishlistItems.productId, productId)
            )
        );
        return { success: true };
    } catch (error) {
        return { error: 'Failed' };
    }
}

export async function syncWishlist(localIds: string[]) {
    const user = await getUserFromSession();
    if (!user) return { ids: localIds, merged: false };

    try {
        // Get DB items
        const dbItems = await db.select().from(wishlistItems).where(eq(wishlistItems.userId, user.userId));
        const dbIds = new Set<string>(dbItems.map((i: any) => String(i.productId)));
        const localSet = new Set(localIds);

        // Find items in Local but NOT in DB -> Insert them
        const toInsert = localIds.filter(id => !dbIds.has(id));

        if (toInsert.length > 0) {
            await db.insert(wishlistItems).values(
                toInsert.map(id => ({ userId: user.userId, productId: id }))
            );
        }

        // Return Union (Safe iteration)
        const union = new Set<string>(dbIds);
        localIds.forEach(id => union.add(id));
        const allIds = Array.from(union);
        return { ids: allIds, merged: true };

    } catch (error) {
        console.error('Sync failed', error);
        return { ids: localIds, merged: false };
    }
}
