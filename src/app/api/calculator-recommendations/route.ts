import { NextRequest, NextResponse } from 'next/server';
import { getCalculatorRecommendations } from '../../../lib/scientific-calculators-catalog';
import type { CalculatorToolId } from '../../../lib/scientific-calculators';

export const runtime = 'nodejs';

const VALID_TOOLS: Set<CalculatorToolId> = new Set([
    'boiler',
    'vessel',
    'valve',
    'manifold',
    'radiator',
]);

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const rawTool = (searchParams.get('tool') || 'boiler').toLowerCase() as CalculatorToolId;
        const tool: CalculatorToolId = VALID_TOOLS.has(rawTool) ? rawTool : 'boiler';

        const kw = Number(searchParams.get('kw')) || undefined;
        const liters = Number(searchParams.get('liters')) || undefined;
        const dn = searchParams.get('dn') || undefined;
        const kv = Number(searchParams.get('kv')) || undefined;
        const loops = Number(searchParams.get('loops')) || undefined;
        const radiators = Number(searchParams.get('radiators')) || undefined;
        const connection = searchParams.get('connection') || undefined;
        const control = searchParams.get('control') || undefined;

        const items = await getCalculatorRecommendations({
            tool,
            kw,
            liters,
            dn,
            kv,
            loops,
            radiators,
            connection,
            control,
        });

        return NextResponse.json({
            tool,
            items,
        });
    } catch (error) {
        console.error('[api/calculator-recommendations] GET error:', error);
        return NextResponse.json(
            { error: 'Nepavyko parinkti prekių pagal skaičiavimo parametrus', items: [] },
            { status: 500 },
        );
    }
}
