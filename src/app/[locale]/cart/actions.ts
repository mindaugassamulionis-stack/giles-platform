'use server';

import { cookies } from 'next/headers';
import { db, carts, cartItems } from '@platform/database';
import { eq, and } from 'drizzle-orm';
import { verifyToken } from '../../../lib/auth';

export async function getUserFromSession() {
    const token = (await cookies()).get('auth-token')?.value;
    if (!token) return null;
    const payload = await verifyToken(token);
    if (!payload?.userId) return null;
    return payload;
}

interface LocalCartItem {
    id: string; // product/variant ID
    quantity: number;
    price: number;
    name: string;
    image?: string;
    sku: string;
}

export async function syncCart(localItems: LocalCartItem[]) {
    const user = await getUserFromSession();
    if (!user) return { success: false, items: [] };

    try {
        // 1. Find active cart for user
        let activeCart = await db.query.carts.findFirst({
            where: and(eq(carts.customerId, user.userId), eq(carts.status, 'active')),
            with: { items: true }
        });

        // 2. Create if missing
        if (!activeCart) {
            const [newCart] = await db.insert(carts).values({
                customerId: user.userId,
                status: 'active',
                currency: 'EUR'
            }).returning();
            activeCart = { ...newCart, items: [] };
        }

        // 3. Merge Logic
        // For simplicity: Add local items if they don't exist in DB cart.
        // Update quantity if they do.

        for (const localItem of localItems) {
            const dbItem = activeCart.items.find((i: any) => i.ean === localItem.id || i.sku === localItem.sku); // Approximate match ID=EAN/SKU linkage

            if (dbItem) {
                // Update quantity
                await db.update(cartItems)
                    .set({ quantity: dbItem.quantity + localItem.quantity })
                    .where(eq(cartItems.id, dbItem.id));
            } else {
                // Insert new
                await db.insert(cartItems).values({
                    cartId: activeCart.id,
                    title: localItem.name,
                    ean: localItem.id, // Storing ID in EAN field for now as linkage
                    sku: localItem.sku,
                    quantity: localItem.quantity,
                    unitPrice: localItem.price.toString(),
                    totalPrice: (localItem.price * localItem.quantity).toString(),
                    imageUrl: localItem.image
                });
            }
        }

        return { success: true };
    } catch (err) {
        console.error('Cart Sync Failed', err);
        return { success: false };
    }
}
