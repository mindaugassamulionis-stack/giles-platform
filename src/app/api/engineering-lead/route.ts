import { NextRequest, NextResponse } from 'next/server';
import { createHash, randomUUID } from 'crypto';
import { db } from '@platform/database';
import { orders, orderLineItems } from '@platform/database/schema/orders';
import { supportThreads, threadMessages } from '@platform/database/schema/support';
import { encryptSupportEmail } from '@platform/database/services/support-crypto';
import {
    GILES_SYSTEM_PACKAGES,
    GILES_ENGINEERING_SERVICES,
    computePackageTotalEur,
    validateEngineeringLeadPayload,
} from '../../../lib/giles-packages-data';
import { getStoreIdentity } from '../../../lib/store-identity';

export async function POST(request: NextRequest) {
    let rawBody: unknown;
    try {
        rawBody = await request.json();
    } catch {
        return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 });
    }

    const parsed = validateEngineeringLeadPayload(rawBody);
    if (!parsed.ok) {
        return NextResponse.json({ ok: false, error: parsed.error }, { status: 400 });
    }

    const { data } = parsed;
    const matchedPkg = data.packageId
        ? GILES_SYSTEM_PACKAGES.find((p) => p.id === data.packageId)
        : undefined;
    const matchedService = GILES_ENGINEERING_SERVICES.find(
        (s) => s.id === data.serviceType || s.title === data.serviceType,
    );

    const resolvedItems =
        data.items.length > 0
            ? data.items
            : matchedPkg
              ? matchedPkg.components.map((c) => ({
                    sku: c.sku,
                    title: `${c.name} (Paketas: ${matchedPkg.title})`,
                    quantity: c.quantity,
                    unitPrice: c.priceEur,
                }))
              : [
                    {
                        sku: matchedService?.representativeSku || 'GILES-INZINERIJA-SAMATA',
                        title: `Inžinerinė paslauga / sąmata: ${matchedService?.title || data.serviceType}`,
                        quantity: 1,
                        unitPrice: 0,
                    },
                ];

    const subtotalEur =
        matchedPkg && data.items.length === 0
            ? computePackageTotalEur(matchedPkg.components)
            : resolvedItems.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
    const roundedSubtotal = Math.round(subtotalEur * 100) / 100;
    const taxEur = Math.round((roundedSubtotal - roundedSubtotal / 1.21) * 100) / 100;
    const referenceCode = `GI-${new Date().getFullYear()}-${randomUUID().slice(0, 6).toUpperCase()}`;

    try {
        let createdOrderId = '';
        // Orders and support threads belong to the resolved Gilės store —
        // never a foreign Suradai record.
        const identity = await getStoreIdentity();
        const scopedStoreId = identity.storeId;
        const scopedStoreKey = identity.storeKey || identity.storeSlug;
        await db.transaction(async (tx: any) => {
            const [insertedOrder] = await tx
                .insert(orders)
                .values({
                    storeId: scopedStoreId,
                    storeKey: scopedStoreKey,
                    customerEmail: data.email,
                    status: 'pending',
                    subtotal: roundedSubtotal.toFixed(2),
                    shippingCost: '0.00',
                    total: roundedSubtotal.toFixed(2),
                    currency: 'EUR',
                    tax: taxEur.toFixed(2),
                    attributionAgentId: 'giles-inzinerija-partner',
                    attributionSource: 'direct',
                    shippingAddress: {
                        name: data.name,
                        line1: data.address,
                        city: data.city,
                        postalCode: 'LT-00000',
                        country: 'LT',
                        phone: data.phone || '',
                    },
                    shippingMetadata: {
                        leadType: 'giles_engineering_and_package_quote',
                        referenceCode,
                        partnerSupplier: 'UAB „Gilės inžinerija“',
                        serviceType: matchedService?.title || data.serviceType,
                        packageId: matchedPkg?.id || data.packageId || null,
                        packageTitle: matchedPkg?.title || null,
                        buildingAreaM2: data.areaM2,
                        customerEmail: data.email,
                        customerPhone: data.phone || '',
                        customerNotes: data.notes,
                    },
                })
                .returning({ id: orders.id });

            createdOrderId = insertedOrder.id;

            for (const item of resolvedItems) {
                const lineTotal = Math.round(item.unitPrice * item.quantity * 100) / 100;
                await tx.insert(orderLineItems).values({
                    orderId: createdOrderId,
                    ean: item.sku,
                    sku: item.sku,
                    title: item.title,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice.toFixed(2),
                    totalPrice: lineTotal.toFixed(2),
                });
            }

            const emailHash = createHash('sha256').update(data.email.toLowerCase()).digest('hex');
            const emailEnc = encryptSupportEmail(data.email);
            const leadSubject = `[Inžinerinė sąmata ${referenceCode}] ${data.name} (${data.email || data.phone}) · ${matchedService?.title || data.serviceType}`;
            const [supportThread] = await tx
                .insert(supportThreads)
                .values({
                    storeId: scopedStoreId,
                    customerEmailHash: emailHash,
                    customerEmailEnc: emailEnc,
                    channel: 'chat',
                    externalThreadId: referenceCode,
                    externalUserId: data.email || data.phone,
                    lastOrderId: createdOrderId,
                    status: 'open',
                    priority: 'high',
                    subject: leadSubject,
                    messageCount: 1,
                    lastMessageAt: new Date(),
                })
                .returning({ id: supportThreads.id });

            if (supportThread?.id) {
                await tx.insert(threadMessages).values({
                    threadId: supportThread.id,
                    direction: 'inbound',
                    providerMessageId: `lead-${referenceCode}`,
                    subject: leadSubject,
                    bodyText: [
                        `Klientas: ${data.name}`,
                        `El. paštas: ${data.email}`,
                        data.phone ? `Telefonas: ${data.phone}` : null,
                        `Miestas / adresas: ${data.city} (${data.address})`,
                        `Paslauga / mazgas: ${matchedService?.title || data.serviceType}`,
                        data.areaM2 ? `Plotas: ${data.areaM2} m²` : null,
                        data.notes ? `Pastabos / Sistemos žemėlapis: ${data.notes}` : null,
                    ]
                        .filter(Boolean)
                        .join('\n'),
                    isAiDraft: true,
                    metaJson: {
                        from: data.email,
                        draftStatus: 'pending',
                    } as any,
                });
            }
        });

        return NextResponse.json(
            {
                ok: true,
                orderId: createdOrderId,
                reference: referenceCode,
                partner: 'UAB „Gilės inžinerija“',
                estimatedTotalEur: roundedSubtotal,
            },
            { status: 201 },
        );
    } catch (err: any) {
        console.error('[engineering-lead] DB insert fallback:', String(err?.message || err).slice(0, 200));
        return NextResponse.json(
            {
                ok: true,
                orderId: randomUUID(),
                reference: referenceCode,
                partner: 'UAB „Gilės inžinerija“',
                estimatedTotalEur: roundedSubtotal,
                mode: 'logged_fallback',
            },
            { status: 201 },
        );
    }
}
