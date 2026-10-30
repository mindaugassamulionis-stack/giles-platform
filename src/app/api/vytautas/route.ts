import { NextRequest, NextResponse } from 'next/server';
import {
    runVytautasConsultativeTurn,
    type ClientSystemMap,
    type ClientTelemetry,
    type VytautasHistoryTurn,
} from '../../../lib/vytautas-consultant';
import {
    extractConversationState,
    runVytautasMultiTurnEngine,
} from '../../../lib/vytautas-engine';
import { appendAiAgentLog } from '../../../lib/suppliers-and-agents-store';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json().catch(() => ({}));
        const rawMessages = Array.isArray(body.messages) ? body.messages : [];
        const rawHistory = Array.isArray(body.history) ? body.history : [];
        const locale = (
            typeof body.locale === 'string' && ['lt', 'en', 'pl', 'ru'].includes(body.locale)
                ? body.locale
                : 'lt'
        ) as 'lt' | 'en' | 'pl' | 'ru';

        let message = typeof body.message === 'string' ? body.message.trim() : '';
        let history: VytautasHistoryTurn[] = rawHistory
            .filter(
                (h: any) =>
                    h &&
                    (h.role === 'user' || h.role === 'assistant') &&
                    typeof h.content === 'string',
            )
            .map((h: any) => ({ role: h.role, content: h.content }));

        if (!message && rawMessages.length > 0) {
            const lastUser = [...rawMessages]
                .reverse()
                .find((m: any) => m && m.role === 'user' && typeof m.content === 'string');
            const fallback = rawMessages[rawMessages.length - 1];
            message = (lastUser?.content ?? fallback?.content ?? '').trim();
            if (history.length === 0 && rawMessages.length > 1) {
                history = rawMessages
                    .slice(0, -1)
                    .filter(
                        (h: any) =>
                            h &&
                            (h.role === 'user' || h.role === 'assistant') &&
                            typeof h.content === 'string',
                    )
                    .map((h: any) => ({ role: h.role, content: h.content }));
            }
        }

        if (!message) {
            return NextResponse.json(
                { error: 'Message or messages array is required' },
                { status: 400 },
            );
        }

        const allTurns: VytautasHistoryTurn[] = [...history, { role: 'user', content: message }];
        const convState = extractConversationState(allTurns);

        const safeSystemMap: Partial<ClientSystemMap> | null =
            body.systemMap && typeof body.systemMap === 'object'
                ? (body.systemMap as Partial<ClientSystemMap>)
                : null;
        const safeClientTelemetry: ClientTelemetry | null =
            body.clientTelemetry && typeof body.clientTelemetry === 'object'
                ? (body.clientTelemetry as ClientTelemetry)
                : null;

        let turnResult;
        if (locale !== 'lt') {
            const localizedOut = runVytautasMultiTurnEngine({
                messages: allTurns,
                locale,
            });
            turnResult = {
                mode: 'xai_grok_llm_rag_moat' as const,
                stage: localizedOut.stage,
                response: localizedOut.response,
                reply: localizedOut.reply,
                recommendations: localizedOut.recommendations,
                recommendedProducts: localizedOut.recommendedProducts,
                suggestedProducts: localizedOut.suggestedProducts,
                quickReplies: localizedOut.quickReplies,
                followUpSuggestions: localizedOut.followUpSuggestions,
                systemMap: localizedOut.systemMap,
                modelUsed: 'vytautas-multiturn-engine',
            };
        } else {
            turnResult = await runVytautasConsultativeTurn({
                message,
                history,
                systemMap: safeSystemMap,
                clientTelemetry: safeClientTelemetry,
                journeyContext: body.journeyContext ?? null,
            });
        }

        const recSkus = Array.isArray(turnResult.recommendedProducts)
            ? turnResult.recommendedProducts
                  .map((p: any) => String(p?.sku || '').trim())
                  .filter(Boolean)
                  .slice(0, 4)
            : [];
        const needsEngineer =
            message.toLowerCase().includes('nestandart') ||
            message.toLowerCase().includes('individual') ||
            recSkus.length === 0;
        appendAiAgentLog({
            agentId: 'vytautas-consultant',
            agentName: 'Inžinierius Konsultantas Vytautas',
            category: needsEngineer ? 'unanswered_escalation' : 'vytautas_chat',
            callerOrEvent: `Kliento klausimas (${locale.toUpperCase()}): „${message.slice(0, 180)}“`,
            responseOrAction: String(turnResult.reply || turnResult.response || '').slice(0, 260),
            recommendedSkus: recSkus,
            status: needsEngineer ? 'NEATSAKYTA / PERDUOTA INŽINIERIUI' : 'ATSAKYTA',
            confidencePct: needsEngineer ? 68 : 96,
        });

        return NextResponse.json({
            response: turnResult.response,
            reply: turnResult.reply,
            mode: turnResult.mode,
            model: turnResult.modelUsed,
            modelUsed: turnResult.modelUsed,
            stage: turnResult.stage,
            state: convState,
            recommendations: turnResult.recommendations,
            recommendedProducts: turnResult.recommendedProducts,
            relatedProducts: turnResult.suggestedProducts,
            suggestedProducts: turnResult.suggestedProducts,
            quickReplies: turnResult.quickReplies,
            followUpSuggestions: turnResult.followUpSuggestions,
            systemMap: turnResult.systemMap,
        });
    } catch (error: any) {
        console.error('Vytautas API Error:', error);
        return NextResponse.json(
            { error: 'Failed to process Vytautas consultation' },
            { status: 500 },
        );
    }
}
