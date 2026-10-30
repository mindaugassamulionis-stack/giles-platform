
import { NextResponse } from 'next/server';
import { db, products, variants } from '@platform/database';
import { inArray, eq, asc } from 'drizzle-orm';
import { resolvePurchasability } from '../../../../lib/purchasable';

// W23-S1/G4+G1: price/stock from variants (priceGross cents → EUR, same
// source as the PDP) — the old offers EAN join never matched (ean empty)
// and rendered price 0.00 + sold-out for every row.
async function getProductWithDetails(p: any) {
    const variantsList = await db.select({
        priceGross: variants.priceGross,
        stock: variants.stock,
        images: variants.images,
        sku: variants.sku
    })
        .from(variants)
        .where(eq(variants.productId, p.id))
        .orderBy(asc(variants.priceGross))
        .limit(1);

    const bestVariant = variantsList[0];
    const price = bestVariant?.priceGross != null ? Number(bestVariant.priceGross) / 100 : 0;

    let imageUrl = undefined;
    if (bestVariant?.images && Array.isArray(bestVariant.images) && bestVariant.images.length > 0) {
        const mainImg = bestVariant.images.find((img: any) => img.slot === 'main');
        imageUrl = mainImg ? mainImg.url : bestVariant.images[0].url;
    }

    return {
        id: p.id,
        name: p.titleLt || p.titleEn,
        price,
        inStock: !resolvePurchasability(bestVariant?.stock ?? null).soldOut,
        stock: bestVariant?.stock ?? null,
        sku: bestVariant?.sku || `SKU-${p.id.slice(0, 8)}`,
        imageUrl,
    };
}

export async function POST(req: Request) {
    try {
        const { ids } = await req.json();
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json([]);
        }

        const rawProducts = await db.select().from(products).where(inArray(products.id, ids));

        const results = await Promise.all(rawProducts.map(getProductWithDetails));

        return NextResponse.json(results);
    } catch (error) {
        console.error('Batch fetch failed', error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
