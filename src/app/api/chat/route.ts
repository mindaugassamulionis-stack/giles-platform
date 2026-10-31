import { NextRequest, NextResponse } from 'next/server';
import { createHash, randomUUID } from 'crypto';
import { chatMessageSchema } from '../../../lib/validation';
import { getStorefrontRuntimeConfig, db } from '@platform/database';
import { supportThreads, threadMessages } from '@platform/database/schema/support';
import { encryptSupportEmail } from '@platform/database/services/support-crypto';
import { eq } from 'drizzle-orm';
import {
    runVytautasConsultativeTurn,
    type ClientSystemMap,
    type ClientTelemetry,
    type VytautasHistoryTurn,
} from '../../../lib/vytautas-consultant';
import { resolveStoreIdOrThrow } from '../../../lib/store-identity';

async function syncChatTurnToSupport(params: {
    sessionId: string;
    userMessage: string;
    assistantResponse: string;
    systemMap: ClientSystemMap;
    clientTelemetry?: ClientTelemetry | null;
}) {
    try {
        const emailMatch = params.userMessage.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
        const phoneMatch = params.userMessage.match(/(?:\+370|8\s?6|0\s?6)[\d\s-]{6,11}/);
        const customerIdentifier = emailMatch
            ? emailMatch[0].trim()
            : phoneMatch
              ? `${phoneMatch[0].replace(/\s+/g, '')}@gilesinzinerija.lt`
              : `vytautas-${params.sessionId.slice(0, 12)}@gilesinzinerija.lt`;

        const emailHash = createHash('sha256').update(customerIdentifier.toLowerCase()).digest('hex');
        const emailEnc = encryptSupportEmail(customerIdentifier);
        const subject = `[Vytautas ŠVOK] ${params.systemMap.nodeLabel} · ${params.systemMap.powerOrAreaLabel}`;

        const [existing] = await db
            .select({ id: supportThreads.id, messageCount: supportThreads.messageCount })
            .from(supportThreads)
            .where(eq(supportThreads.externalThreadId, params.sessionId))
            .limit(1);

        let threadId = existing?.id;
        if (!threadId) {
            const [created] = await db
                .insert(supportThreads)
                .values({
                    storeId: await resolveStoreIdOrThrow(),
                    customerEmailHash: emailHash,
                    customerEmailEnc: emailEnc,
                    channel: 'chat',
                    externalThreadId: params.sessionId,
                    status: 'open',
                    priority: emailMatch || phoneMatch ? 'high' : 'normal',
                    subject,
                    messageCount: 2,
                    lastMessageAt: new Date(),
                })
                .returning({ id: supportThreads.id });
            threadId = created?.id;
        } else {
            await db
                .update(supportThreads)
                .set({
                    subject,
                    customerEmailHash: emailHash,
                    customerEmailEnc: emailEnc,
                    priority: emailMatch || phoneMatch ? 'high' : 'normal',
                    messageCount: (existing.messageCount || 0) + 2,
                    lastMessageAt: new Date(),
                    updatedAt: new Date(),
                })
                .where(eq(supportThreads.id, threadId));
        }

        if (threadId) {
            const turnId = randomUUID();
            await db.insert(threadMessages).values([
                {
                    threadId,
                    direction: 'inbound',
                    providerMessageId: `vyt-in-${turnId}`,
                    subject,
                    bodyText: params.userMessage,
                    isAiDraft: false,
                    metaJson: {
                        from: customerIdentifier,
                    },
                },
                {
                    threadId,
                    direction: 'outbound',
                    providerMessageId: `vyt-out-${turnId}`,
                    subject,
                    bodyText: `${params.assistantResponse}\n\n[Sistemos žemėlapis: ${params.systemMap.nodeLabel} | ${params.systemMap.powerOrAreaLabel} | ${params.systemMap.connectionOrTypeLabel}]`,
                    isAiDraft: true,
                    metaJson: {
                        from: 'Vytautas (Gilės Inžinerija ŠVOK vyr. inžinierius)',
                        to: customerIdentifier,
                    } as any,
                },
            ]);
        }
    } catch {
        // Non-blocking telemetry sync
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const normalizedBody = { ...body };
        if (typeof normalizedBody.message !== 'string' && Array.isArray(normalizedBody.messages)) {
            const lastUserMsg = [...normalizedBody.messages]
                .reverse()
                .find((m: any) => m && m.role === 'user' && typeof m.content === 'string');
            const fallbackMsg = normalizedBody.messages[normalizedBody.messages.length - 1];
            const extractedMessage = lastUserMsg?.content ?? fallbackMsg?.content;
            if (typeof extractedMessage === 'string') {
                normalizedBody.message = extractedMessage;
            }
            if (!Array.isArray(normalizedBody.history) && normalizedBody.messages.length > 1) {
                normalizedBody.history = normalizedBody.messages.slice(0, -1);
            }
        }

        const result = chatMessageSchema.safeParse(normalizedBody);
        if (!result.success) {
            const formatted = result.error.flatten();
            return NextResponse.json(
                { error: formatted.fieldErrors.message?.[0] || 'Invalid input' },
                { status: 400 },
            );
        }

        const {
            message,
            context,
            journeyContext,
            clientTelemetry: rawClientTelemetry,
            sessionId: rawSessionId,
            storeId,
            storeKey,
            history,
            systemMap,
        } = normalizedBody;
        const safeHistory: VytautasHistoryTurn[] = Array.isArray(history)
            ? history
                  .filter(
                      (h: any) =>
                          h &&
                          (h.role === 'user' || h.role === 'assistant') &&
                          typeof h.content === 'string',
                  )
                  .map((h: any) => ({ role: h.role, content: h.content }))
            : [];

        const safeSystemMap: Partial<ClientSystemMap> | null =
            systemMap && typeof systemMap === 'object' ? (systemMap as Partial<ClientSystemMap>) : null;

        const requestedStoreId =
            (typeof storeId === 'string' && storeId.trim()) ||
            (typeof storeKey === 'string' && storeKey.trim()) ||
            request.nextUrl.searchParams.get('storeId') ||
            request.headers.get('x-store-id') ||
            (await resolveStoreIdOrThrow());

        const runtimeConfig = await getStorefrontRuntimeConfig(requestedStoreId);
        if (!runtimeConfig.features.vytautasWidget) {
            return NextResponse.json(
                {
                    response: `Atsiprašome, šiuo metu konsultantas ${runtimeConfig.persona.agentName || 'Vytautas'} šioje parduotuvėje yra išjungtas.`,
                    disabled: true,
                },
                { status: 503 },
            );
        }

        const rawJourney = runtimeConfig.features.customerJourneyTracker
            ? (journeyContext ?? context?.journeyContext ?? null)
            : null;

        const safeClientTelemetry: ClientTelemetry | null = runtimeConfig.features.customerJourneyTracker
            ? rawClientTelemetry && typeof rawClientTelemetry === 'object'
                ? (rawClientTelemetry as ClientTelemetry)
                : context && typeof context === 'object'
                  ? {
                        currentPage: context.pageType || 'catalog',
                        currentPath: context.currentPath,
                        currentProduct: context.activeProduct
                            ? {
                                  id: context.activeProduct.id,
                                  sku: context.activeProduct.sku || context.activeProduct.id,
                                  title: context.activeProduct.name || context.activeProduct.title,
                                  brand: context.activeProduct.brand,
                                  category: context.activeProduct.category,
                                  priceEur: context.activeProduct.price,
                                  specs: context.activeProduct.specs,
                              }
                            : null,
                        recentlyViewedSkus: Array.isArray(context.recentlyViewedSkus)
                            ? context.recentlyViewedSkus
                            : [],
                        cartItems: Array.isArray(context.cartItems) ? context.cartItems : [],
                        activeCalculatorSummary: context.activeCalculatorSummary || null,
                    }
                  : null
            : null;

        const turn = await runVytautasConsultativeTurn({
            message,
            history: safeHistory,
            systemMap: safeSystemMap,
            clientTelemetry: safeClientTelemetry,
            journeyContext: rawJourney,
        });

        const sessionId =
            (typeof rawSessionId === 'string' && rawSessionId.trim()) ||
            request.headers.get('x-vytautas-session') ||
            'suradai-live-session';

        void syncChatTurnToSupport({
            sessionId,
            userMessage: message,
            assistantResponse: turn.response,
            systemMap: turn.systemMap,
            clientTelemetry: safeClientTelemetry,
        });

        return NextResponse.json({
            response: turn.response,
            reply: turn.response,
            mode: 'xai_grok_llm_rag_moat',
            model: turn.modelUsed,
            modelUsed: turn.modelUsed,
            stage: turn.stage,
            recommendations: turn.recommendations,
            recommendedProducts: turn.recommendations,
            relatedProducts: turn.suggestedProducts,
            suggestedProducts: turn.suggestedProducts,
            quickReplies: turn.quickReplies,
            followUpSuggestions: turn.followUpSuggestions,
            systemMap: turn.systemMap,
            compatibility: null,
            rag: null,
        });
    } catch (error: any) {
        console.error('Chat API Error:', error);
        return NextResponse.json(
            { error: 'Failed to process message' },
            { status: 500 },
        );
    }
}
