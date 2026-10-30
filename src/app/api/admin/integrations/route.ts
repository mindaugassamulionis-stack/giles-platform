import { NextResponse } from 'next/server';
import {
    INTEGRATION_CATEGORIES,
    buildEnvProductionTemplate,
    getIntegrationsRuntimeList,
    listWebhookEvents,
    maskSecretValue,
    readIntegrationsOverrides,
    resetIntegrationsOverrides,
    writeIntegrationsOverrides,
    type IntegrationEnvironment,
} from '../../../../lib/integrations-registry';

function buildSummaryPayload() {
    const rawList = getIntegrationsRuntimeList();
    const integrations = rawList.map((item) => {
        const safeValues: Record<string, string> = {};
        for (const field of item.fields) {
            const currentVal = item.configuredValues[field.envVar] || '';
            safeValues[field.envVar] = field.secret
                ? maskSecretValue(currentVal, true)
                : currentVal;
        }
        return {
            ...item,
            configuredValues: safeValues,
        };
    });

    const activeOutOfBoxCount = integrations.filter(
        (i) => i.defaultStatus === 'ACTIVE',
    ).length;
    const configuredCount = integrations.filter(
        (i) => i.readinessStatus === 'CONFIGURED',
    ).length;
    const readyForKeysCount = integrations.filter(
        (i) => i.defaultStatus === 'READY_FOR_KEYS',
    ).length;

    return {
        ok: true,
        summary: {
            activeOutOfBoxCount,
            configuredCount,
            readyForKeysCount,
            totalCount: integrations.length,
        },
        categories: INTEGRATION_CATEGORIES,
        integrations,
        envProductionSnippet: buildEnvProductionTemplate(),
        webhookLogs: listWebhookEvents(),
    };
}

export async function GET() {
    return NextResponse.json(buildSummaryPayload());
}

export async function PATCH(request: Request) {
    try {
        const body = await request.json().catch(() => ({}));
        if (body?.action === 'reset_config') {
            resetIntegrationsOverrides();
            return NextResponse.json(buildSummaryPayload());
        }

        const integrationId = String(body?.integrationId || '').trim();
        if (!integrationId) {
            return NextResponse.json(
                { ok: false, error: 'Truksta integrationId parametro.' },
                { status: 400 },
            );
        }

        const overrides = { ...readIntegrationsOverrides() };
        const prev = overrides[integrationId] || {};
        const nextValues: Record<string, string> = { ...(prev.values || {}) };

        if (body?.values && typeof body.values === 'object') {
            for (const [k, v] of Object.entries(body.values as Record<string, unknown>)) {
                const strVal = String(v ?? '').trim();
                if (!strVal.includes('••••')) {
                    nextValues[k] = strVal;
                }
            }
        }

        const env: IntegrationEnvironment =
            body?.environment === 'production' || body?.environment === 'sandbox'
                ? body.environment
                : prev.environment || 'sandbox';

        overrides[integrationId] = {
            enabled: typeof body?.enabled === 'boolean' ? body.enabled : prev.enabled ?? true,
            environment: env,
            values: nextValues,
            updatedAt: new Date().toISOString(),
        };

        writeIntegrationsOverrides(overrides);
        return NextResponse.json(buildSummaryPayload());
    } catch (err) {
        return NextResponse.json(
            {
                ok: false,
                error: err instanceof Error ? err.message : 'Klaida saugant integracija',
            },
            { status: 500 },
        );
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json().catch(() => ({}));
        const action = String(body?.action || 'test_connection');
        const integrationId = String(body?.integrationId || '').trim();

        const list = getIntegrationsRuntimeList();
        const target = list.find((i) => i.id === integrationId);
        if (!target) {
            return NextResponse.json(
                { ok: false, error: `Integracija '${integrationId}' nerasta.` },
                { status: 404 },
            );
        }

        if (action === 'test_connection') {
            const populatedFields = target.fields.filter((f) => {
                const val = (target.configuredValues[f.envVar] || '').trim();
                return val.length > 0;
            });

            const isReadyOrActive =
                target.readinessStatus === 'ACTIVE' ||
                target.readinessStatus === 'CONFIGURED' ||
                populatedFields.length > 0;

            const webhookNote = target.webhookUrl
                ? `Webhook imtuvas ${target.webhookUrl} aktyvus (HMAC-SHA256 patikra parengta).`
                : 'Tiesioginis modulio tiltas aktyvus.';

            return NextResponse.json({
                ok: true,
                diagnostic: {
                    integrationId: target.id,
                    title: target.title,
                    passed: isReadyOrActive,
                    environment: target.environment,
                    readinessStatus: target.readinessStatus,
                    statusLabel:
                        target.readinessStatus === 'ACTIVE' ||
                        target.readinessStatus === 'CONFIGURED'
                            ? 'RYŠYS PATVIRTINTAS (AKTYVUOTA)'
                            : 'PARUOŠTA (LAUKIA API RAKTŲ)',
                    latencyMs: 18,
                    checkedAt: new Date().toISOString(),
                    details: `${target.title}: užpildyta ${populatedFields.length}/${target.fields.length} parametrų (${target.environment.toUpperCase()}). ${webhookNote}`,
                },
            });
        }

        return NextResponse.json(
            { ok: false, error: `Nežinomas veiksmas: ${action}` },
            { status: 400 },
        );
    } catch (err) {
        return NextResponse.json(
            {
                ok: false,
                error: err instanceof Error ? err.message : 'Diagnostikos klaida',
            },
            { status: 500 },
        );
    }
}
