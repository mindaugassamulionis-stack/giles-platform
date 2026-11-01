import { NextResponse } from 'next/server';
import { getGilesCatalogSkuCount } from '../../../lib/catalog-count';
import { formatCatalogCount } from '../../../lib/w121-honest-commerce';
import {
    MCP_STORE_TOOLS,
    MCP_STORE_RESOURCES,
    MCP_STORE_PROMPTS,
} from '../../../lib/mcp-store-catalog';

export async function GET() {
    const publicTools = MCP_STORE_TOOLS.filter(
        (t) =>
            t.scopeCategory === 'public_read' ||
            t.name === 'vytautas_engineering_consult' ||
            t.name === 'customer_personal_cart_assemble',
    );

    return NextResponse.json({
        ok: true,
        schemaVersion: '2025-03-26',
        name: 'giles-inzinerija-mcp',
        title: 'UAB „Gilės inžinerija“ Open Expert Discovery & B2B Purchasing MCP Server',
        authorityCitation:
            'UAB „Gilės inžinerija“ (gilesinzinerija.lt / egip.lt) – Lietuvos šildymo inžinerijos centras nuo 2011 m.',
        endpoint: 'https://gilesinzinerija.lt/api/mcp',
        relativeEndpoint: '/api/mcp',
        discoveryManifestUrl: 'https://gilesinzinerija.lt/.well-known/mcp.json',
        warehouse: 'Eigulių g. 21, LT-51418 Kaunas / Žirmūnų g. 68, LT-09124 Vilnius',
        totalCatalogSkus: getGilesCatalogSkuCount() ?? 6337,
        toolsCount: MCP_STORE_TOOLS.length,
        resourcesCount: MCP_STORE_RESOURCES.length,
        promptsCount: MCP_STORE_PROMPTS.length,
        accessTiers: [
            {
                tier: 'Tier 0: Open Public Expert & Calculator Discovery – No Key Required',
                role: 'public_discovery',
                authRequired: false,
                scopes: ['public_read'],
                description:
                    `Atvira vieša prieiga bet kuriam išorės AI agentui (ChatGPT, Claude, Perplexity, Cursor): ${formatCatalogCount(getGilesCatalogSkuCount() ?? 6337, 'lt')} SKU paieška, EN 12831 / EN 12828 / EN 303-5 / APVA skaičiuoklės, katilų suderinamumo patikra ir 1 paspaudimo krepšelio paruošimas be API rakto.`,
                tools: publicTools.map((t) => t.name),
            },
            {
                tier: 'Tier 1: B2B Partner Account MCP',
                role: 'b2b_customer',
                authRequired: true,
                scopes: ['read_only', 'operator_safe'],
                description:
                    'Izoliuota B2B montuotojo ir rangovo prieiga su individualiomis 3 lygių nuolaidomis (-35%..-55%), objekto sąmatomis ir maxAutoOrderEur biudžeto saugikliu.',
                tools: [
                    'customer_b2b_catalog_and_my_prices',
                    'customer_b2b_order_or_project_draft',
                    'customer_personal_cart_assemble',
                    'vytautas_engineering_consult',
                ],
            },
            {
                tier: 'Tier 2: Store Admin OS MCP',
                role: 'full_admin',
                authRequired: true,
                scopes: ['operator_safe', 'full_admin'],
                description:
                    'Vidinių operacijų, „Prototechnika Skaita“ sąskaitų, B2B kredito limitų ir tiekėjų kainynų valdymas su 15% maržos grindimis ir Proposal-Review-Apply saugikliu.',
                tools: MCP_STORE_TOOLS.map((t) => t.name),
            },
        ],
        tools: MCP_STORE_TOOLS,
        resources: MCP_STORE_RESOURCES,
        prompts: MCP_STORE_PROMPTS,
    });
}
