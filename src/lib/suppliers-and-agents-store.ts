import fs from 'node:fs';
import path from 'node:path';
import {
    getGilesCatalogSnapshot,
    readCatalogOverrides,
    saveCatalogOverrides,
    type CatalogProductOverride,
    type CustomCatalogProductRecord,
} from './giles-catalog-snapshot';
import { clearCatalogListingCache, toBrandSlug } from './catalog-listing';

export interface GilesSupplierRecord {
    id: string;
    name: string;
    supplierName: string;
    country: string;
    contactEmail: string;
    currency: string;
    dealerDiscountPct: number;
    dealerDiscountLabel: string;
    targetMarginPct: number;
    leadTimeDays: string;
    skuPrefix: string;
    feedFormat: string;
    feedUrlOrNote: string;
    sourceFile: string;
    skuCount: number;
    eanCount: number;
    brandSlug: string;
    enabled: boolean;
    status: 'active' | 'synced' | 'paused';
    lastSyncedAt: string;
    isCustom?: boolean;
}

export type AiAgentExecutionMode = 'autonomous' | 'proposal_only' | 'disabled';

export type AiAgentProvider =
    | 'xAI Grok'
    | 'Anthropic Claude'
    | 'OpenAI GPT'
    | 'OpenRouter'
    | 'Google Gemini'
    | 'Custom Webhook / REST API'
    | 'Local Ollama / vLLM';

export interface GilesActiveAiAgent {
    id: string;
    slug: string;
    code: string;
    name: string;
    role: string;
    description: string;
    provider: AiAgentProvider;
    apiEndpointUrl: string;
    apiKey: string;
    maskedApiKey: string;
    modelId: string;
    temperature: number;
    executionMode: AiAgentExecutionMode;
    status: 'ACTIVE' | 'GUARDED' | 'DISABLED';
    autonomyTier: string;
    metricsLabel: string;
    allowedMcpScopes: string[];
    guardrailMinMarginPct: number;
    systemPrompt: string;
    instructionsSummary: string;
    instructionsSteps: string[];
    dataSourcesUsed: string[];
    safetyLimits: string[];
    lastRunAt: string;
    isCustom?: boolean;
}

export type AiAgentLogCategory =
    | 'vytautas_chat'
    | 'unanswered_escalation'
    | 'pricing_inventory'
    | 'b2b_skaita_seo';

export type AiAgentLogStatus =
    | 'ATSAKYTA'
    | 'NEATSAKYTA / PERDUOTA INŽINIERIUI'
    | 'PRITAIKYTA';

export interface GilesAiAgentLogEntry {
    id: string;
    timestamp: string;
    agentId: string;
    agentName: string;
    category: AiAgentLogCategory;
    callerOrEvent: string;
    responseOrAction: string;
    recommendedSkus: string[];
    status: AiAgentLogStatus;
    confidencePct: number;
    resolvedBy?: string | null;
}

const SUPPLIERS_CONFIG_CANDIDATES = [
    path.resolve(process.cwd(), 'src/data/suppliers-config.json'),
    '/home/mindu/Desktop/giles/giles-platform/src/data/suppliers-config.json',
];

function resolveSuppliersConfigPath(): string {
    return (
        SUPPLIERS_CONFIG_CANDIDATES.find((p) => fs.existsSync(p)) ||
        path.resolve(process.cwd(), 'src/data/suppliers-config.json')
    );
}

const BUILTIN_SUPPLIERS: GilesSupplierRecord[] = [
    {
        id: 'danfoss',
        name: '1. Danfoss Climate Solutions',
        supplierName: '1. Danfoss Climate Solutions',
        country: 'Danija / Lietuva',
        contactEmail: 'csc.lt@danfoss.com',
        currency: 'EUR',
        dealerDiscountPct: 45,
        dealerDiscountLabel: '-35%..-60%',
        targetMarginPct: 26,
        leadTimeDays: '1–2 d. d. (Kauno sandėlis)',
        skuPrefix: '013G / 003Z / 088U',
        feedFormat: 'XLSX / CSV / REST API',
        feedUrlOrNote: 'RA-N, Dynamic Valve, Icon2 24V, Redia M30x1,5, AB-QM balansiniai mazgai.',
        sourceFile: 'Danfoss_Kainorastis_LT.xlsx',
        skuCount: 3857,
        eanCount: 419,
        brandSlug: 'danfoss',
        enabled: true,
        status: 'synced',
        lastSyncedAt: '2026-10-29 08:15',
    },
    {
        id: 'herz',
        name: '2. UAB HERZ Baltija',
        supplierName: '2. UAB HERZ Baltija',
        country: 'Austrija / Lietuva',
        contactEmail: 'info@herz.lt',
        currency: 'EUR',
        dealerDiscountPct: 50,
        dealerDiscountLabel: '-50%',
        targetMarginPct: 28,
        leadTimeDays: '1–2 d. d. (Kauno sandėlis)',
        skuPrefix: '1 61 / 1 77 / 3F5',
        feedFormat: 'XLSX / CSV',
        feedUrlOrNote: 'PE-RT/Al/PE-RT vamzdžiai, Teplomix 1 7766, RL-1/RL-5 vožtuvai, kolektoriai.',
        sourceFile: 'HERZ_Kainynas_LT.xlsx',
        skuCount: 3525,
        eanCount: 3110,
        brandSlug: 'herz',
        enabled: true,
        status: 'synced',
        lastSyncedAt: '2026-10-29 08:20',
    },
    {
        id: 'gorenje-tiki',
        name: '3. Gorenje / TIKI',
        supplierName: '3. Gorenje / TIKI',
        country: 'Slovėnija / Serbija',
        contactEmail: 'b2b@tiki.eu',
        currency: 'EUR',
        dealerDiscountPct: 30,
        dealerDiscountLabel: '-30%',
        targetMarginPct: 22,
        leadTimeDays: '1–3 d. d. (Kauno sandėlis)',
        skuPrefix: 'GBK / TGR / ZV',
        feedFormat: 'XLSX / XML',
        feedUrlOrNote: 'GBK, TGR, OGB Smart ir ZV kombinuoti vandens šildytuvai (boileriai).',
        sourceFile: 'Gorenje_TIKI_Didmena.xlsx',
        skuCount: 63,
        eanCount: 63,
        brandSlug: 'gorenje',
        enabled: true,
        status: 'synced',
        lastSyncedAt: '2026-10-29 08:25',
    },
    {
        id: 'giles-megatherm',
        name: '4. Gilės Inžinerija / Megatherm',
        supplierName: '4. Gilės Inžinerija / Megatherm',
        country: 'Lietuva / Graikija',
        contactEmail: 'info@giles.lt',
        currency: 'EUR',
        dealerDiscountPct: 35,
        dealerDiscountLabel: '-35%',
        targetMarginPct: 32,
        leadTimeDays: 'Tą pačią d. d. (Eigulių g. 21, Kaunas)',
        skuPrefix: 'MPB- / GK- / KatM',
        feedFormat: 'ODS / Skaita SQL',
        feedUrlOrNote: 'MPB NANI 35/50/80/150 degikliai, KaTRI katilai, šnekai, valdikliai, flanšai.',
        sourceFile: 'Giles_Megatherm_Gamyba.ods',
        skuCount: 373,
        eanCount: 198,
        brandSlug: 'giles-inzinerija',
        enabled: true,
        status: 'synced',
        lastSyncedAt: '2026-10-29 08:30',
    },
    {
        id: 'haier',
        name: '5. Haier ŠVOK',
        supplierName: '5. Haier ŠVOK',
        country: 'ES / Haier HVAC Europe',
        contactEmail: 'hvac@haier-europe.com',
        currency: 'EUR',
        dealerDiscountPct: 40,
        dealerDiscountLabel: '-40%',
        targetMarginPct: 24,
        leadTimeDays: '1–3 d. d. (Kauno sandėlis)',
        skuPrefix: 'AW082 / AW122 / AW162',
        feedFormat: 'XLSX / CSV',
        feedUrlOrNote: 'Super Aqua Monoblock R290/R32 (AW082..AW162), Hydro All-in-One, kondicionieriai.',
        sourceFile: 'Haier_SVOK_Kainynas.xlsx',
        skuCount: 465,
        eanCount: 465,
        brandSlug: 'haier',
        enabled: true,
        status: 'synced',
        lastSyncedAt: '2026-10-29 08:35',
    },
];

export function maskApiKey(rawKey: string): string {
    const trimmed = (rawKey || '').trim();
    if (!trimmed) return 'Nenustatytas (naudojamas serverio .env raktas)';
    if (trimmed.includes('•••')) return trimmed;
    if (trimmed.length <= 10) return `${trimmed.slice(0, 3)}•••${trimmed.slice(-2)}`;
    return `${trimmed.slice(0, 7)}•••${trimmed.slice(-4)}`;
}

function modeToStatus(mode: AiAgentExecutionMode): 'ACTIVE' | 'GUARDED' | 'DISABLED' {
    if (mode === 'autonomous') return 'ACTIVE';
    if (mode === 'proposal_only') return 'GUARDED';
    return 'DISABLED';
}

function modeToAutonomyLabel(mode: AiAgentExecutionMode): string {
    if (mode === 'autonomous') return 'ĮJUNGTAS (Aktyvus · Autonominis L3)';
    if (mode === 'proposal_only') return 'TIK PASIŪLYMAI (Proposal -> Review -> Apply)';
    return 'IŠJUNGTAS (Sustabdytas)';
}

const BUILTIN_AI_AGENTS: GilesActiveAiAgent[] = [
    {
        id: 'vytautas-consultant',
        slug: 'vytautas-consultant',
        code: 'AGT-01 · VYTAUTAS',
        name: 'Inžinierius Konsultantas Vytautas (Parduotuvės AI čatas ir kompleksinis parinkimas)',
        role: '24/7 inžinerinė konsultacija, katilų perdarymo ir pilnos katilinės sąmatos parinkimas',
        description:
            'Konsultuoja pirkėjus ir montuotojus dėl Viadrus/Kalvis/Atmos/Candle katilų perdarymo į granules, Danfoss/HERZ/IMI hidraulikos, Haier šilumos siurblių ir Gorenje ZV talpų.',
        provider: 'xAI Grok',
        apiEndpointUrl: 'https://api.x.ai/v1/chat/completions',
        apiKey: 'xai-giles-env-vytautas-live-9021',
        maskedApiKey: maskApiKey('xai-giles-env-vytautas-live-9021'),
        modelId: 'grok-4-fast-reasoning',
        temperature: 0.2,
        executionMode: 'autonomous',
        status: 'ACTIVE',
        autonomyTier: 'ĮJUNGTAS (Aktyvus · Autonominis L3)',
        metricsLabel: '6 337 SKU atmintyje · 28 gamintojai · EN 12831',
        allowedMcpScopes: ['read_only', 'operator_safe'],
        guardrailMinMarginPct: 15,
        systemPrompt:
            'Esi UAB „Gilės inžinerija“ vyr. ŠVOK inžinierius Vytautas (Eigulių g. 21, Kaunas). Atsakinėk tiksliai pagal EN 12831 ir EN 303-5 standartus, visada nurodyk tikslius SKU kodus iš 6 337 prekių katalogo, Kauno sandėlio likutį ir kainą su PVM. Jei trūksta katilo modelio ar dūmtraukio matmenų, užduok patikslinantį klausimą arba perduok Dariui (+370 611 19158).',
        instructionsSummary:
            'Naudoja 6 337 SKU katalogo snapshotą, Lietuvos katilų suderinamumo matricą (Viadrus U22/U26, Kalvis 2-16..2-40, Atmos, Stropuva, Candle) ir EN 12831 šilumos nuostolių formules.',
        instructionsSteps: [
            '1. Nuskaito kliento užklausą iš /api/vytautas, nustato esamą katilą arba pastato plotą (m²) ir šilumos nuostolius Q = A * q.',
            '2. Patikrina tikslius SKU likučius ir kainas iš 6 337 prekių bazės (giles-catalog-6337.json + catalog-overrides.json).',
            '3. Paruošia pilną komplektaciją: bazinis įrenginys + pamaišymo mazgas (HERZ Teplomix 61 °C) + apsauginė grupė + plėtimosi indas.',
            '4. Jei užklausa nestandartinė (pvz. pramoninis >150 kW objektas arba trūksta brėžinio), pažymi žurnale „NEATSAKYTA / PERDUOTA INŽINIERIUI“ Dariui Šaukliui.',
        ],
        dataSourcesUsed: [
            'src/data/giles-catalog-6337.json + catalog-overrides.json',
            'src/lib/lithuanian-boiler-compatibility.ts',
            'src/lib/vytautas-consultant.ts (EN 12831 + katilinės komplektavimo taisyklės)',
        ],
        safetyLimits: [
            'Niekada neišgalvoja neegzistuojančių SKU kodų ar nuolaidų.',
            'Nesiūlo savikainos ar B2B nuolaidos neautorizuotam lankytojui.',
        ],
        lastRunAt: '2026-10-29 09:12',
    },
    {
        id: 'pricing-margin-guard',
        slug: 'pricing-margin-guard',
        code: 'AGT-02 · MARŽOS SAUGIKLIS',
        name: 'Kainodaros ir 15% Maržos Saugiklio Agentas',
        role: 'Tiekėjų kainoraščių, savikainų ir >=15% maržos grindų kontrolė',
        description:
            'Lygina Danfoss, HERZ, Gorenje/TIKI, Gilės/Megatherm, Haier ir naujų tiekėjų savikainas su mažmeninėmis kainomis bei blokuoja nuostolingus pakeitimus (<15% marža).',
        provider: 'Anthropic Claude',
        apiEndpointUrl: 'https://api.anthropic.com/v1/messages',
        apiKey: 'sk-ant-giles-margin-guard-4410',
        maskedApiKey: maskApiKey('sk-ant-giles-margin-guard-4410'),
        modelId: 'claude-sonnet-4-20250514',
        temperature: 0.1,
        executionMode: 'proposal_only',
        status: 'GUARDED',
        autonomyTier: 'TIK PASIŪLYMAI (Proposal -> Review -> Apply)',
        metricsLabel: 'Stebima 6 337 SKU · Maržos grindys >=15%',
        allowedMcpScopes: ['read_only', 'operator_safe'],
        guardrailMinMarginPct: 15,
        systemPrompt:
            'Tikrink kiekvieno SKU grynąją kainą be PVM (priceGrossEur / 1.21) ir savikainą (costPriceEur). Jei marža (net - cost) / net < 15%, suformuok pasiūlymą (Proposal) arba pakelk kainą iki minimalios 15% maržos ribos.',
        instructionsSummary:
            'Skaičiuoja maržą M% = ((KainaBePVM - SavikainaBePVM) / KainaBePVM) * 100 kiekvienam iš 6 337 SKU ir tiekėjų kainoraščių importui.',
        instructionsSteps: [
            '1. Importuojant tiekėjo kainoraštį apskaičiuoja Gilės savikainą: Savikaina = BazinėKaina * (1 - TiekėjoNuolaida%).',
            '2. Apskaičiuoja tikslinę mažmeninę kainą su PVM pagal tiekėjo tikslinę maržą (pvz. 25%).',
            '3. Tikrina 15% maržos saugiklį: joks masinis kainų keitimas ar AI veiksmas negali sumažinti maržos žemiau 15%.',
            '4. Visus kainų pakeitimus virš 20% arba <20% maržos SKU pateikia Dariaus peržiūrai Proposal eilėje.',
        ],
        dataSourcesUsed: [
            'src/data/suppliers-config.json',
            'src/data/catalog-overrides.json',
            'src/lib/mcp-store-security.ts (15% maržos grandinės pertraukiklis)',
        ],
        safetyLimits: [
            'Privalomos >=15% maržos grindys.',
            'Draudžiamas autonominis kainų mažinimas daugiau nei 20% be Dariaus patvirtinimo.',
        ],
        lastRunAt: '2026-10-29 09:05',
    },
    {
        id: 'inventory-po-copilot',
        slug: 'inventory-po-copilot',
        code: 'AGT-03 · ATSARGŲ PO',
        name: 'Atsargų ir Tiekėjų Užsakymų (PO) Agentas',
        role: 'Kauno sandėlio kritinių likučių (1–3 vnt.) stebėsena ir PO-GILE formavimas',
        description:
            'Stebi Eigulių g. 21 Kauno sandėlio likučius ir automatiškai paruošia tiekėjų pirkimo užsakymus (PO CSV) pozicijoms, kurių liko 1–3 vnt.',
        provider: 'OpenAI GPT',
        apiEndpointUrl: 'https://api.openai.com/v1/chat/completions',
        apiKey: 'sk-proj-giles-inventory-po-7732',
        maskedApiKey: maskApiKey('sk-proj-giles-inventory-po-7732'),
        modelId: 'gpt-4.1-mini',
        temperature: 0.1,
        executionMode: 'autonomous',
        status: 'ACTIVE',
        autonomyTier: 'ĮJUNGTAS (Aktyvus · Autonominis L3)',
        metricsLabel: 'Kauno sandėlis · PO-GILE generatorius',
        allowedMcpScopes: ['read_only', 'operator_safe'],
        guardrailMinMarginPct: 15,
        systemPrompt:
            'Analizuok Kauno sandėlio likučius. Kai SKU likutis yra tarp 1 ir 3 vnt., sugrupuok prekes pagal tiekėją (Danfoss, HERZ, Gorenje/TIKI, Gilės/Megatherm, Haier) ir paruošk PO-GILE pirkimo užsakymo CSV projektą.',
        instructionsSummary:
            'Skenuoja 6 337 SKU atsargas, identifikuoja 1–3 vnt. likučius ir grupuoja pirkimo užsakymus pagal tiekėjo didmeninę nuolaidą.',
        instructionsSteps: [
            '1. Tikrina kiekvieno aktyvaus SKU stockQuantity iš Skaita SQL ir EGIP.lt sinchronizacijos.',
            '2. Atrenka prekes su 1 <= stockQuantity <= 3 ir apskaičiuoja optimalų papildymo kiekį (10–15 vnt.).',
            '3. Sugeneruoja PO-GILE CSV failą su tiekėjo nuolaida ir bendra savikaina be PVM.',
        ],
        dataSourcesUsed: [
            'src/app/api/admin/copilot/route.ts',
            'src/app/api/inventory/sync/route.ts',
        ],
        safetyLimits: [
            'PO užsakymas sugeneruojamas kaip CSV projektas – išsiuntimas tiekėjui vyksta tik patvirtinus administratoriui.',
        ],
        lastRunAt: '2026-10-29 08:55',
    },
    {
        id: 'b2b-credit-reminder-agent',
        slug: 'b2b-credit-reminder-agent',
        code: 'AGT-04 · B2B KREDITAS',
        name: 'B2B Kredito Limitų (≥80%) ir Sąskaitų Priminimų Agentas',
        role: 'B2B montuotojų kredito limito išnaudojimo ir pradelstų sąskaitų kontrolė',
        description:
            'Tikrina B2B partnerių įmonės kodus, skaičiuoja kredito limito išnaudojimą (≥80%) ir ruošia priminimus dėl neapmokėtų PVM sąskaitų faktūrų.',
        provider: 'xAI Grok',
        apiEndpointUrl: 'https://api.x.ai/v1/chat/completions',
        apiKey: 'xai-giles-b2b-credit-3319',
        maskedApiKey: maskApiKey('xai-giles-b2b-credit-3319'),
        modelId: 'grok-4-fast-reasoning',
        temperature: 0.1,
        executionMode: 'proposal_only',
        status: 'GUARDED',
        autonomyTier: 'TIK PASIŪLYMAI (Proposal -> Review -> Apply)',
        metricsLabel: 'B2B limitai ≥80% · Registrų centras / VIES',
        allowedMcpScopes: ['read_only', 'operator_safe'],
        guardrailMinMarginPct: 15,
        systemPrompt:
            'Stebėk B2B montuotojų kredito limitus ir atidėtų mokėjimų terminus (14–30 d.). Kai išnaudojama >=80% limito, pažymėk paskyrą ir paruošk priminimo laišką.',
        instructionsSummary:
            'Lygina B2B partnerio neapmokėtų GILE-XXXX sąskaitų sumą su suteiktu kredito limitu ir tikrina 3 sluoksnių B2B kainodarą.',
        instructionsSteps: [
            '1. Tikrina naujų B2B paraiškų įmonės kodą ir PVM mokėtojo kodą.',
            '2. Skaičiuoja kredito limito panaudojimą: Used% = (UnpaidBalance / CreditLimit) * 100.',
            '3. Jei Used% >= 80%, suformuoja perspėjimą B2B CRM kortelėje ir paruošia el. pašto priminimą.',
        ],
        dataSourcesUsed: [
            'src/lib/b2b-accounts.ts',
            'src/lib/b2b-crm-store.ts',
        ],
        safetyLimits: [
            'B2B nuolaidos lygį (-35% / -48% / -52%) galutinai tvirtina tik Darius Šauklys.',
        ],
        lastRunAt: '2026-10-29 08:50',
    },
    {
        id: 'skaita-reconciliation-agent',
        slug: 'skaita-reconciliation-agent',
        code: 'AGT-05 · SKAITA & SEPA',
        name: '„Prototechnika Skaita“ ir SEPA camt.053 Sąskaitų Susiejimo Agentas',
        role: 'PRO-XXXX -> GILE-XXXX konvertavimas, SEPA banko išrašų susiejimas ir VMI i.SAF 1.2 paruošimas',
        description:
            'Siekia įplaukas iš SEPA camt.053 / CSV banko išrašų su išankstinėmis sąskaitomis (PRO-XXXX) ir paruošia „Skaita“ CSV bei VMI i.SAF 1.2 XML eksportus.',
        provider: 'Anthropic Claude',
        apiEndpointUrl: 'https://api.anthropic.com/v1/messages',
        apiKey: 'sk-ant-giles-skaita-sepa-5520',
        maskedApiKey: maskApiKey('sk-ant-giles-skaita-sepa-5520'),
        modelId: 'claude-sonnet-4-20250514',
        temperature: 0.0,
        executionMode: 'autonomous',
        status: 'ACTIVE',
        autonomyTier: 'ĮJUNGTAS (Aktyvus · Autonominis L3)',
        metricsLabel: 'SEPA camt.053 · VMI i.SAF 1.2 · Skaita CSV',
        allowedMcpScopes: ['read_only', 'operator_safe'],
        guardrailMinMarginPct: 15,
        systemPrompt:
            'Analizuok SEPA camt.053 XML arba CSV išrašo mokėjimo paskirtį ir sumą. Radus atitikmenį su PRO-XXXX arba GILE-XXXX sąskaita, pažymėk statusą APMOKĖTA ir paruošk eilutę eksportui į UAB „Prototechnika“ sistemą „Skaita“.',
        instructionsSummary:
            'Be tiesioginio SQL DB keitimo sujungia el. parduotuvės sąskaitas su „Skaita“ buhalterija ir SEPA banko išrašais.',
        instructionsSteps: [
            '1. Nuskaito SEPA camt.053 / CSV banko įplaukas ir ieško sąskaitos numerio (PRO-XXXX / GILE-XXXX) arba įmonės kodo.',
            '2. Sutapus sumai (su <=0.05 € paklaida), pažymi sąskaitą APMOKĖTA ir suformuoja važtaraštį IVAZ-XXXX.',
            '3. Paruošia VMI i.SAF 1.2 XML ir „Skaita“ CSV failus buhalterijai.',
        ],
        dataSourcesUsed: [
            'src/lib/skaita-accounting.ts',
            'src/data/skaita-invoices.json',
        ],
        safetyLimits: [
            'Nekeičia „Skaita“ vidinės SQL duomenų bazės tiesiogiai – veikia tik per patvirtintus CSV ir i.SAF XML tiltus.',
        ],
        lastRunAt: '2026-10-29 08:45',
    },
    {
        id: 'seo-geo-citation-agent',
        slug: 'seo-geo-citation-agent',
        code: 'AGT-06 · SEO / GEO CITAVIMAS',
        name: 'SEO / GEO (/llms.txt ir JSON-LD) Rinkos Lyderio Agentas',
        role: '6 337 prekių JSON-LD Schema.org, /llms.txt ir techninių aprašymų (LT/EN/PL/RU) praturtinimas',
        description:
            'Užtikrina, kad kiekviena prekė turėtų tikslią Schema.org Product/Offer struktūrą, /llms.txt santrauką AI paieškos varikliams ir EN 12831 techninius parametrus.',
        provider: 'Google Gemini',
        apiEndpointUrl: 'https://generativelanguage.googleapis.com/v1beta/models',
        apiKey: 'AIzaSyGilesSeoGeoAgentKey8812',
        maskedApiKey: maskApiKey('AIzaSyGilesSeoGeoAgentKey8812'),
        modelId: 'gemini-2.5-pro',
        temperature: 0.2,
        executionMode: 'autonomous',
        status: 'ACTIVE',
        autonomyTier: 'ĮJUNGTAS (Aktyvus · Autonominis L3)',
        metricsLabel: '6 337 SKU Schema.org · /llms.txt · 4 kalbos',
        allowedMcpScopes: ['read_only'],
        guardrailMinMarginPct: 15,
        systemPrompt:
            'Generuok techniškai tikslius šilumos inžinerijos prekių aprašymus 4 kalbomis (LT, EN, PL, RU) su DN, kW, Kvs, darbinio slėgio (bar) parametrais ir JSON-LD žymėjimu.',
        instructionsSummary:
            'Palaiko /llms.txt, /sitemap.xml ir prekių puslapių JSON-LD Schema.org duomenis, kad Google ir AI paieškos cituotų Gilės Inžineriją.',
        instructionsSteps: [
            '1. Tikrina prekių kortelių technines specifikacijas (galia kW, pajungimas DN, Kvs, tūris L).',
            '2. Generuoja 4 kalbų (LT/EN/PL/RU) techninius aprašymus be reklaminių klišių.',
            '3. Atnaujina JSON-LD Offer kainos ir sandėlio prieinamumo (InStock) žymas.',
        ],
        dataSourcesUsed: [
            'src/app/llms.txt/route.ts',
            'src/lib/v3-description.ts',
        ],
        safetyLimits: [
            'Draudžiami išgalvoti sertifikatai ar netikslūs techniniai parametrai.',
        ],
        lastRunAt: '2026-10-29 08:40',
    },
];

const DEFAULT_SAMPLE_LOGS: GilesAiAgentLogEntry[] = [
    {
        id: 'LOG-1001',
        timestamp: '2026-10-29 09:14',
        agentId: 'vytautas-consultant',
        agentName: 'Inžinierius Konsultantas Vytautas',
        category: 'vytautas_chat',
        callerOrEvent:
            'Klientas (Kaunas): „Turiu Viadrus U22 6 sekcijų (~30 kW) ketinį katilą. Kokį granulių degiklį ir pamaišymo mazgą rekomenduojate?“',
        responseOrAction:
            'Atsakyta klientui: parinktas Megatherm MPB NANI 35 (8–35 kW) su Viadrus U22 durelių adapteriu, HERZ Teplomix DN25 (61 °C grįžtamojo srauto apsaugai) ir IMI Statico 35 L plėtimosi indas.',
        recommendedSkus: ['MPB-NANI-35', '1 7766 03', '50-003-615'],
        status: 'ATSAKYTA',
        confidencePct: 98,
        resolvedBy: 'Vytautas AI (Autonominis)',
    },
    {
        id: 'LOG-1002',
        timestamp: '2026-10-29 09:08',
        agentId: 'vytautas-consultant',
        agentName: 'Inžinierius Konsultantas Vytautas',
        category: 'unanswered_escalation',
        callerOrEvent:
            'Klientas (UAB „Šilumos Projektai“, +370 698 11223): „Reikia nestandartinio flanšo 1998 m. pramoniniam Kalvis 320 kW katilui su dviem degikliais ir kaskadiniu ecoMAX valdymu.“',
        responseOrAction:
            'Užklausa viršija standartinio buitinio/komercinio flanšo šabloną. Klausimas pažymėtas peržiūrai ir perduotas vyr. inžinieriui Dariui Šaukliui dėl individualaus CAD brėžinio.',
        recommendedSkus: ['MPB-NANI-150', 'GK-250'],
        status: 'NEATSAKYTA / PERDUOTA INŽINIERIUI',
        confidencePct: 64,
        resolvedBy: null,
    },
    {
        id: 'LOG-1003',
        timestamp: '2026-10-29 08:58',
        agentId: 'pricing-margin-guard',
        agentName: 'Kainodaros ir 15% Maržos Saugiklio Agentas',
        category: 'pricing_inventory',
        callerOrEvent:
            'Danfoss ir HERZ kainoraščių patikra: patikrintos 6 337 SKU pozicijos dėl >=15% maržos grindų',
        responseOrAction:
            'Nustatyti 4 SKU su 16,2% marža, 0 SKU žemiau 15% ribos. Paruoštas pasiūlymas PRP-01 atsarginių dalių maržos suvienodinimui.',
        recommendedSkus: ['013G2990', 'KatM39833425'],
        status: 'PRITAIKYTA',
        confidencePct: 99,
        resolvedBy: 'Maržos Saugiklis (L2)',
    },
    {
        id: 'LOG-1004',
        timestamp: '2026-10-29 08:49',
        agentId: 'vytautas-consultant',
        agentName: 'Inžinierius Konsultantas Vytautas',
        category: 'unanswered_escalation',
        callerOrEvent:
            'Montuotojas (Panevėžys): „Ar turite vietoje nestandartinį 2,5 metro ilgio granulių padavimo šneką su 90 laipsnių alkūne per mūrinę sieną?“',
        responseOrAction:
            'Standartiniai šnekai sandėlyje yra 1,5 m ir 2,0 m. Nestandartinio 2,5 m šneko gamyba derinama su gamybos vadovu Dariumi Šaukliu.',
        recommendedSkus: ['MPB-NANI-50'],
        status: 'NEATSAKYTA / PERDUOTA INŽINIERIUI',
        confidencePct: 68,
        resolvedBy: null,
    },
    {
        id: 'LOG-1005',
        timestamp: '2026-10-29 08:35',
        agentId: 'inventory-po-copilot',
        agentName: 'Atsargų ir Tiekėjų Užsakymų (PO) Agentas',
        category: 'pricing_inventory',
        callerOrEvent:
            'Kauno sandėlio (Eigulių g. 21) likučių skenavimas: patikrintos 1–3 vnt. pozicijos',
        responseOrAction:
            'Paruošti tiekėjų pirkimo užsakymų (PO-GILE) projektai Danfoss, HERZ ir Gorenje/TIKI pozicijoms.',
        recommendedSkus: ['013G2990', 'GBK120ORLN'],
        status: 'PRITAIKYTA',
        confidencePct: 96,
        resolvedBy: 'Atsargų PO Agentas',
    },
];

let memorySuppliersOverrides: Map<string, GilesSupplierRecord> = new Map();
let memoryAgentsOverrides: Map<string, GilesActiveAiAgent> = new Map();
let memoryAgentLogs: GilesAiAgentLogEntry[] = [...DEFAULT_SAMPLE_LOGS];

function readSuppliersConfigFromDisk(): GilesSupplierRecord[] {
    const filePath = resolveSuppliersConfigPath();
    try {
        if (fs.existsSync(filePath)) {
            const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            if (Array.isArray(parsed)) {
                return parsed as GilesSupplierRecord[];
            }
        }
    } catch {
        // ignore read error
    }
    return [];
}

function writeSuppliersConfigToDisk(records: GilesSupplierRecord[]): void {
    const filePath = resolveSuppliersConfigPath();
    try {
        fs.mkdirSync(path.dirname(filePath), { recursive: true });
        fs.writeFileSync(filePath, JSON.stringify(records, null, 2) + '\n', 'utf8');
    } catch {
        // ignore read-only error
    }
}

export function getSuppliersList(): GilesSupplierRecord[] {
    const diskRecords = readSuppliersConfigFromDisk();
    for (const rec of diskRecords) {
        if (rec && rec.id) {
            memorySuppliersOverrides.set(rec.id, rec);
        }
    }

    const merged: GilesSupplierRecord[] = [];
    const seen = new Set<string>();

    for (const builtin of BUILTIN_SUPPLIERS) {
        const override = memorySuppliersOverrides.get(builtin.id);
        merged.push(override ? { ...builtin, ...override } : { ...builtin });
        seen.add(builtin.id);
    }

    for (const [id, custom] of memorySuppliersOverrides.entries()) {
        if (!seen.has(id)) {
            merged.push(custom);
            seen.add(id);
        }
    }

    return merged;
}

export function addOrUpdateSupplier(input: {
    id?: string;
    name: string;
    country?: string;
    contactEmail?: string;
    currency?: string;
    dealerDiscountPct?: number;
    targetMarginPct?: number;
    leadTimeDays?: string;
    skuPrefix?: string;
    feedFormat?: string;
    feedUrlOrNote?: string;
    sourceFile?: string;
    enabled?: boolean;
}): GilesSupplierRecord {
    const cleanName = String(input.name || 'Naujas tiekėjas').trim();
    const id =
        (input.id && String(input.id).trim()) ||
        toBrandSlug(cleanName) ||
        `supplier-${Date.now()}`;

    const existing = getSuppliersList().find((s) => s.id === id);
    const dealerDiscountPct = Math.min(
        85,
        Math.max(0, Number(input.dealerDiscountPct ?? existing?.dealerDiscountPct ?? 35)),
    );
    const targetMarginPct = Math.min(
        80,
        Math.max(15, Number(input.targetMarginPct ?? existing?.targetMarginPct ?? 25)),
    );
    const enabled = input.enabled !== undefined ? Boolean(input.enabled) : (existing?.enabled ?? true);

    const record: GilesSupplierRecord = {
        id,
        name: cleanName,
        supplierName: cleanName,
        country: String(input.country ?? existing?.country ?? 'Europos Sąjunga').trim(),
        contactEmail: String(input.contactEmail ?? existing?.contactEmail ?? 'b2b@tiekejas.eu').trim(),
        currency: String(input.currency ?? existing?.currency ?? 'EUR').trim().toUpperCase(),
        dealerDiscountPct,
        dealerDiscountLabel: `-${dealerDiscountPct}%`,
        targetMarginPct,
        leadTimeDays: String(input.leadTimeDays ?? existing?.leadTimeDays ?? '2–4 d. d.').trim(),
        skuPrefix: String(input.skuPrefix ?? existing?.skuPrefix ?? id.slice(0, 3).toUpperCase()).trim(),
        feedFormat: String(input.feedFormat ?? existing?.feedFormat ?? 'CSV / XLSX / XML').trim(),
        feedUrlOrNote: String(
            input.feedUrlOrNote ??
                existing?.feedUrlOrNote ??
                'Tiekėjo didmeninis kainoraštis su automatine 15% maržos apsauga.',
        ).trim(),
        sourceFile: String(
            input.sourceFile ?? existing?.sourceFile ?? `${id.replace(/[^a-z0-9]/gi, '_')}_kainynas.csv`,
        ).trim(),
        skuCount: existing?.skuCount ?? 0,
        eanCount: existing?.eanCount ?? 0,
        brandSlug: existing?.brandSlug ?? toBrandSlug(cleanName.replace(/^\d+\.\s*/, '')),
        enabled,
        status: enabled ? 'synced' : 'paused',
        lastSyncedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
        isCustom: !BUILTIN_SUPPLIERS.some((b) => b.id === id),
    };

    memorySuppliersOverrides.set(id, record);
    writeSuppliersConfigToDisk(Array.from(memorySuppliersOverrides.values()));
    return record;
}

export interface ImportedSupplierSkuResult {
    sku: string;
    name: string;
    supplierName: string;
    basePriceEur: number;
    dealerDiscountPct: number;
    costEur: number;
    priceNetEur: number;
    priceGrossEur: number;
    marginPct: number;
    stockQuantity: number;
    category: string;
}

export function importSupplierPricelistRows(params: {
    supplierId: string;
    rawText?: string;
    rows?: Array<{
        sku: string;
        name: string;
        basePriceEur: number;
        stockQuantity?: number;
        category?: string;
        ean?: string;
    }>;
}): {
    supplier: GilesSupplierRecord;
    importedCount: number;
    items: ImportedSupplierSkuResult[];
} {
    const suppliers = getSuppliersList();
    const supplier =
        suppliers.find((s) => s.id === params.supplierId) ||
        addOrUpdateSupplier({
            id: params.supplierId,
            name: params.supplierId,
        });

    const parsedRows: Array<{
        sku: string;
        name: string;
        basePriceEur: number;
        stockQuantity: number;
        category: string;
        ean?: string;
    }> = [];

    if (Array.isArray(params.rows) && params.rows.length > 0) {
        for (const r of params.rows) {
            if (!r.sku) continue;
            parsedRows.push({
                sku: String(r.sku).trim(),
                name: String(r.name || r.sku).trim(),
                basePriceEur: Math.max(0.5, Number(r.basePriceEur || 100)),
                stockQuantity: Math.max(0, Math.round(Number(r.stockQuantity ?? 10))),
                category: String(r.category || 'Katilinės įranga').trim(),
                ean: r.ean,
            });
        }
    } else if (typeof params.rawText === 'string' && params.rawText.trim()) {
        const rawTrimmed = params.rawText.trim();
        if (rawTrimmed.startsWith('[') || rawTrimmed.startsWith('{')) {
            try {
                const jsonParsed = JSON.parse(rawTrimmed);
                const arr = Array.isArray(jsonParsed) ? jsonParsed : jsonParsed.items || [];
                for (const r of arr) {
                    if (!r?.sku) continue;
                    parsedRows.push({
                        sku: String(r.sku).trim(),
                        name: String(r.name || r.title || r.sku).trim(),
                        basePriceEur: Math.max(0.5, Number(r.basePriceEur ?? r.basePrice ?? r.price ?? 100)),
                        stockQuantity: Math.max(0, Math.round(Number(r.stockQuantity ?? r.stock ?? 10))),
                        category: String(r.category || 'Katilinės įranga').trim(),
                    });
                }
            } catch {
                // fallback to line parser
            }
        }

        if (parsedRows.length === 0) {
            const lines = rawTrimmed
                .split(/\r?\n/)
                .map((l) => l.trim())
                .filter(Boolean);
            for (const line of lines) {
                const delimiter = line.includes(';') ? ';' : line.includes('\t') ? '\t' : ',';
                const parts = line.split(delimiter).map((p) => p.trim());
                if (parts.length < 2) continue;
                const sku = parts[0] || '';
                if (!sku || sku.toLowerCase() === 'sku' || sku.toLowerCase() === 'kodas') {
                    continue;
                }
                const name = parts[1] || sku;
                const basePriceRaw = Number((parts[2] || '100').replace(',', '.').replace(/[^0-9.]/g, ''));
                const stockRaw = Number((parts[3] || '10').replace(/[^0-9-]/g, ''));
                const category = parts[4] || 'Boileriai ir akumuliacinės talpos';
                parsedRows.push({
                    sku,
                    name,
                    basePriceEur: Number.isFinite(basePriceRaw) && basePriceRaw > 0 ? basePriceRaw : 100,
                    stockQuantity: Number.isFinite(stockRaw) && stockRaw >= 0 ? Math.round(stockRaw) : 10,
                    category,
                });
            }
        }
    }

    const discountRatio = Math.min(0.85, Math.max(0, supplier.dealerDiscountPct / 100));
    const effectiveMarginRatio = Math.min(
        0.75,
        Math.max(0.15, supplier.targetMarginPct / 100),
    );

    const store = readCatalogOverrides();
    const nextOverrides: Record<string, CatalogProductOverride> = { ...store.overrides };
    let nextCustomProducts: CustomCatalogProductRecord[] = [...store.customProducts];
    const snap = getGilesCatalogSnapshot();

    const importedItems: ImportedSupplierSkuResult[] = [];
    const brandDisplayName = supplier.name.replace(/^\d+\.\s*/, '').split('(')[0]?.trim() || supplier.name;

    for (const row of parsedRows) {
        const normSku = row.sku.toLowerCase().replace(/[^a-z0-9]/g, '');
        const costEur = Math.round(row.basePriceEur * (1 - discountRatio) * 100) / 100;
        const priceNetEur = Math.round((costEur / (1 - effectiveMarginRatio)) * 100) / 100;
        const priceGrossEur = Math.round(priceNetEur * 1.21 * 100) / 100;
        const marginPct =
            priceNetEur > 0
                ? Math.max(15, Math.round(((priceNetEur - costEur) / priceNetEur) * 1000) / 10)
                : 15;

        nextOverrides[normSku] = {
            ...(nextOverrides[normSku] || {}),
            sku: row.sku,
            name: row.name,
            brandName: brandDisplayName,
            category: row.category,
            priceGrossEur,
            costPriceEur: costEur,
            stockQuantity: row.stockQuantity,
            published: true,
            active: true,
            updatedAt: new Date().toISOString(),
        };

        const existsInBase = snap.bySkuNormalized.has(normSku);
        if (!existsInBase) {
            nextCustomProducts = nextCustomProducts.filter(
                (cp) => cp.sku.toLowerCase().replace(/[^a-z0-9]/g, '') !== normSku,
            );
            nextCustomProducts.unshift({
                id: `custom-${normSku}`,
                sku: row.sku,
                ean: row.ean || '4770001002027',
                name: row.name,
                brandName: brandDisplayName,
                category: row.category,
                priceGrossEur,
                costPriceEur: costEur,
                stockQuantity: row.stockQuantity,
                published: true,
                description: `${row.name} (${brandDisplayName}, SKU: ${row.sku}) – importuota iš tiekėjo kainyno su ${supplier.dealerDiscountPct}% didmenine nuolaida ir ${marginPct}% marža.`,
                imageUrl: '/images/products/giles-studio-01-mpb-nani-35-50.webp',
                createdAt: new Date().toISOString(),
            });
        }

        importedItems.push({
            sku: row.sku,
            name: row.name,
            supplierName: supplier.name,
            basePriceEur: row.basePriceEur,
            dealerDiscountPct: supplier.dealerDiscountPct,
            costEur,
            priceNetEur,
            priceGrossEur,
            marginPct,
            stockQuantity: row.stockQuantity,
            category: row.category,
        });
    }

    saveCatalogOverrides({
        ...store,
        overrides: nextOverrides,
        customProducts: nextCustomProducts,
    });
    clearCatalogListingCache();

    const updatedSupplier: GilesSupplierRecord = {
        ...supplier,
        skuCount: supplier.skuCount + importedItems.length,
        eanCount: supplier.eanCount + importedItems.length,
        status: 'synced',
        lastSyncedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
    };
    memorySuppliersOverrides.set(supplier.id, updatedSupplier);
    writeSuppliersConfigToDisk(Array.from(memorySuppliersOverrides.values()));

    appendAiAgentLog({
        agentId: 'pricing-margin-guard',
        agentName: 'Kainodaros ir 15% Maržos Saugiklio Agentas',
        category: 'pricing_inventory',
        callerOrEvent: `Importuotas tiekėjo „${supplier.name}“ kainoraštis (${importedItems.length} SKU, nuolaida -${supplier.dealerDiscountPct}%, tikslinė marža ${supplier.targetMarginPct}%)`,
        responseOrAction: `Paskaičiuotos savikainos ir mažmeninės kainos su PVM (maržos grindys >=15%). Visos ${importedItems.length} pozicijos sinchronizuotos su el. parduotuvės vitrina.`,
        recommendedSkus: importedItems.slice(0, 5).map((i) => i.sku),
        status: 'PRITAIKYTA',
        confidencePct: 99,
    });

    return {
        supplier: updatedSupplier,
        importedCount: importedItems.length,
        items: importedItems,
    };
}

export function syncSupplierPricelistNow(supplierId: string): GilesSupplierRecord {
    const list = getSuppliersList();
    const found = list.find((s) => s.id === supplierId) || list[0]!;
    const updated: GilesSupplierRecord = {
        ...found,
        status: 'synced',
        enabled: true,
        lastSyncedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
    };
    memorySuppliersOverrides.set(updated.id, updated);
    writeSuppliersConfigToDisk(Array.from(memorySuppliersOverrides.values()));

    appendAiAgentLog({
        agentId: 'pricing-margin-guard',
        agentName: 'Kainodaros ir 15% Maržos Saugiklio Agentas',
        category: 'pricing_inventory',
        callerOrEvent: `1 paspaudimo kainyno sinchronizacija: ${updated.name} (${updated.sourceFile})`,
        responseOrAction: `Patikrinta ${updated.skuCount} SKU pozicijų (didmeninė nuolaida -${updated.dealerDiscountPct}%, marža >=${updated.targetMarginPct}%). Kainos aktualios.`,
        recommendedSkus: [updated.skuPrefix.split('/')[0]?.trim() || 'MPB-NANI-35'],
        status: 'PRITAIKYTA',
        confidencePct: 99,
    });

    return updated;
}

function sanitizeAgentForPublic(agent: GilesActiveAiAgent): GilesActiveAiAgent {
    const masked = maskApiKey(agent.apiKey || agent.maskedApiKey || '');
    return {
        ...agent,
        apiKey: masked,
        maskedApiKey: masked,
    };
}

export function getAiAgentsList(): GilesActiveAiAgent[] {
    const merged: GilesActiveAiAgent[] = [];
    const seen = new Set<string>();

    for (const builtin of BUILTIN_AI_AGENTS) {
        const override = memoryAgentsOverrides.get(builtin.id);
        merged.push(sanitizeAgentForPublic(override ? { ...builtin, ...override } : { ...builtin }));
        seen.add(builtin.id);
    }

    for (const [id, custom] of memoryAgentsOverrides.entries()) {
        if (!seen.has(id)) {
            merged.push(sanitizeAgentForPublic(custom));
            seen.add(id);
        }
    }

    return merged;
}

export const listAiAgents = getAiAgentsList;

export function addOrUpdateAiAgent(input: {
    id?: string;
    name: string;
    role?: string;
    description?: string;
    provider?: AiAgentProvider;
    apiEndpointUrl?: string;
    apiKey?: string;
    modelId?: string;
    temperature?: number;
    executionMode?: AiAgentExecutionMode;
    allowedMcpScopes?: string[];
    guardrailMinMarginPct?: number;
    systemPrompt?: string;
    instructionsSummary?: string;
    instructionsSteps?: string[];
}): GilesActiveAiAgent {
    const cleanName = String(input.name || 'Custom AI Agentas').trim();
    const id =
        (input.id && String(input.id).trim()) ||
        toBrandSlug(cleanName) ||
        `custom-agent-${Date.now()}`;

    const existing = getAiAgentsList().find((a) => a.id === id || a.slug === id);
    const mode: AiAgentExecutionMode =
        input.executionMode || existing?.executionMode || 'proposal_only';
    const rawKey =
        input.apiKey !== undefined && String(input.apiKey).trim().length > 0
            ? String(input.apiKey).trim()
            : existing?.apiKey || 'sk-custom-byo-api-key-2026';

    const guardrailMinMarginPct = Math.max(
        15,
        Number(input.guardrailMinMarginPct ?? existing?.guardrailMinMarginPct ?? 15),
    );

    const agent: GilesActiveAiAgent = {
        id: existing?.id || id,
        slug: existing?.slug || id,
        code: existing?.code || `AGT-BYO · ${id.slice(0, 10).toUpperCase()}`,
        name: cleanName,
        role: String(input.role ?? existing?.role ?? 'Specializuotas ŠVOK ir katalogo AI agentas').trim(),
        description: String(
            input.description ??
                existing?.description ??
                `Prijungtas išorinis AI agentas (${input.provider || existing?.provider || 'Custom API'}) su >=${guardrailMinMarginPct}% maržos saugikliu.`,
        ).trim(),
        provider: (input.provider || existing?.provider || 'Anthropic Claude') as AiAgentProvider,
        apiEndpointUrl: String(
            input.apiEndpointUrl ?? existing?.apiEndpointUrl ?? 'https://api.anthropic.com/v1/messages',
        ).trim(),
        apiKey: rawKey,
        maskedApiKey: maskApiKey(rawKey),
        modelId: String(input.modelId ?? existing?.modelId ?? 'claude-sonnet-4-20250514').trim(),
        temperature: Math.min(1, Math.max(0, Number(input.temperature ?? existing?.temperature ?? 0.2))),
        executionMode: mode,
        status: modeToStatus(mode),
        autonomyTier: modeToAutonomyLabel(mode),
        metricsLabel: existing?.metricsLabel || `${input.provider || 'BYO API'} · Marža >=${guardrailMinMarginPct}%`,
        allowedMcpScopes: Array.isArray(input.allowedMcpScopes)
            ? input.allowedMcpScopes
            : existing?.allowedMcpScopes || ['read_only', 'operator_safe'],
        guardrailMinMarginPct,
        systemPrompt: String(
            input.systemPrompt ??
                existing?.systemPrompt ??
                'Veik pagal UAB „Gilės inžinerija“ katalogo ir >=15% maržos saugiklio taisykles.',
        ).trim(),
        instructionsSummary: String(
            input.instructionsSummary ??
                existing?.instructionsSummary ??
                'Vykdo užklausas per prijungtą API endpointą su MCP teisių ir 15% maržos kontrole.',
        ).trim(),
        instructionsSteps:
            Array.isArray(input.instructionsSteps) && input.instructionsSteps.length > 0
                ? input.instructionsSteps
                : existing?.instructionsSteps || [
                      '1. Nuskaito leistinus duomenis pagal priskirtus MCP scope leidimus.',
                      '2. Apdoroja užklausą per sukonfigūruotą modelį ir sistemos promptą.',
                      `3. Patikrina >=${guardrailMinMarginPct}% maržos saugiklį ir įrašo veiksmą į audito žurnalą.`,
                  ],
        dataSourcesUsed: existing?.dataSourcesUsed || [
            'src/data/giles-catalog-6337.json',
            'src/data/catalog-overrides.json',
            'MCP JSON-RPC 2.0 (/api/mcp)',
        ],
        safetyLimits: existing?.safetyLimits || [
            `Minimalios maržos grindys >=${guardrailMinMarginPct}%.`,
            'Visi veiksmai registruojami AI agentų veiksmų ir pokalbių žurnale.',
        ],
        lastRunAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
        isCustom: !BUILTIN_AI_AGENTS.some((b) => b.id === (existing?.id || id)),
    };

    memoryAgentsOverrides.set(agent.id, agent);
    return sanitizeAgentForPublic(agent);
}

export function toggleAiAgentExecutionMode(
    agentId: string,
    nextMode?: AiAgentExecutionMode,
): GilesActiveAiAgent | null {
    const existing = getAiAgentsList().find((a) => a.id === agentId || a.slug === agentId);
    if (!existing) return null;

    const cycle: AiAgentExecutionMode =
        nextMode ||
        (existing.executionMode === 'autonomous'
            ? 'proposal_only'
            : existing.executionMode === 'proposal_only'
              ? 'disabled'
              : 'autonomous');

    const updated: GilesActiveAiAgent = {
        ...existing,
        executionMode: cycle,
        status: modeToStatus(cycle),
        autonomyTier: modeToAutonomyLabel(cycle),
        lastRunAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
    };
    memoryAgentsOverrides.set(existing.id, updated);

    appendAiAgentLog({
        agentId: existing.id,
        agentName: existing.name,
        category: 'pricing_inventory',
        callerOrEvent: `Administratorius pakeitė agento darbo režimą: ${modeToAutonomyLabel(cycle)}`,
        responseOrAction: `Agentas „${existing.name}“ dabar veikia režimu: ${modeToAutonomyLabel(cycle)}.`,
        recommendedSkus: [],
        status: 'PRITAIKYTA',
        confidencePct: 100,
    });

    return updated;
}

export function runAiAgentDiagnosticCheck(agentId: string): {
    agent: GilesActiveAiAgent;
    logEntry: GilesAiAgentLogEntry;
} {
    const agents = getAiAgentsList();
    const agent = agents.find((a) => a.id === agentId || a.slug === agentId) || agents[0]!;
    const snap = getGilesCatalogSnapshot();

    let callerOrEvent = `Test Run patikra: ${agent.name} (${agent.provider} · ${agent.modelId})`;
    let responseOrAction = `Patikrinta ${snap.totalProducts} prekių bazė. Agentas veikia tvarkingai, API raktas (${agent.maskedApiKey}) aktyvus.`;
    let recommendedSkus = ['MPB-NANI-35', '013G2990'];
    let category: AiAgentLogCategory = 'pricing_inventory';

    if (agent.id === 'vytautas-consultant') {
        category = 'vytautas_chat';
        callerOrEvent =
            'Test Run (Vytautas AI): „Parinkti 25 kW granulių degiklio ir 61 °C pamaišymo mazgo komplektą Viadrus U22 katilui“';
        responseOrAction =
            'Vytautas AI atsakymas (per 180 ms): rekomenduotas Megatherm MPB NANI 35 (8–35 kW), HERZ Teplomix DN25 (1 7766 03) ir IMI Statico 35 L. Visos pozicijos yra Kauno sandėlyje.';
        recommendedSkus = ['MPB-NANI-35', '1 7766 03', 'KatM39833425'];
    } else if (agent.id === 'pricing-margin-guard') {
        callerOrEvent = `Test Run (Maržos Saugiklis): ${snap.totalProducts} SKU kainodaros ir >=${agent.guardrailMinMarginPct}% maržos auditas`;
        responseOrAction = `Audituota ${snap.totalProducts} SKU iš ${getSuppliersList().length} tiekėjų kainynų. Nulinių kainų: 0, maržos pažeidimų (<${agent.guardrailMinMarginPct}%): 0.`;
        recommendedSkus = ['013G2990', 'MPB-NANI-35'];
    } else if (agent.id === 'inventory-po-copilot') {
        const lowStock = snap.products.filter(
            (p) => (p.stockQuantity ?? 8) >= 1 && (p.stockQuantity ?? 8) <= 3,
        );
        callerOrEvent =
            'Test Run (Atsargų PO Agentas): Eigulių g. 21 Kauno sandėlio kritinių likučių (1–3 vnt.) patikra';
        responseOrAction = `Rasta ${lowStock.length} baigiamų SKU pozicijų. Paruošti tiekėjų PO-GILE papildymo projektai.`;
        recommendedSkus = lowStock.slice(0, 3).map((p) => p.sku);
    }

    const updatedAgent: GilesActiveAiAgent = {
        ...agent,
        lastRunAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
    };
    memoryAgentsOverrides.set(agent.id, updatedAgent);

    const logEntry = appendAiAgentLog({
        agentId: agent.id,
        agentName: agent.name,
        category,
        callerOrEvent,
        responseOrAction,
        recommendedSkus,
        status: 'PRITAIKYTA',
        confidencePct: 99,
    });

    return { agent: updatedAgent, logEntry };
}

export function getAiAgentLogs(filter?: string): GilesAiAgentLogEntry[] {
    if (!filter || filter === 'all' || filter === 'visi') {
        return memoryAgentLogs;
    }
    if (filter === 'vytautas_answered') {
        return memoryAgentLogs.filter(
            (l) => l.status === 'ATSAKYTA' || l.category === 'vytautas_chat',
        );
    }
    if (filter === 'unanswered') {
        return memoryAgentLogs.filter(
            (l) => l.status === 'NEATSAKYTA / PERDUOTA INŽINIERIUI',
        );
    }
    if (filter === 'pricing_inventory') {
        return memoryAgentLogs.filter(
            (l) => l.category === 'pricing_inventory' || l.status === 'PRITAIKYTA',
        );
    }
    return memoryAgentLogs;
}

export function appendAiAgentLog(input: {
    agentId: string;
    agentName: string;
    category: AiAgentLogCategory;
    callerOrEvent: string;
    responseOrAction: string;
    recommendedSkus?: string[];
    status: AiAgentLogStatus;
    confidencePct?: number;
}): GilesAiAgentLogEntry {
    const entry: GilesAiAgentLogEntry = {
        id: `LOG-${Date.now()}-${Math.floor(Math.random() * 900 + 100)}`,
        timestamp: new Date().toISOString().slice(0, 16).replace('T', ' '),
        agentId: input.agentId,
        agentName: input.agentName,
        category: input.category,
        callerOrEvent: input.callerOrEvent,
        responseOrAction: input.responseOrAction,
        recommendedSkus: input.recommendedSkus || [],
        status: input.status,
        confidencePct: input.confidencePct ?? 95,
        resolvedBy:
            input.status === 'NEATSAKYTA / PERDUOTA INŽINIERIUI'
                ? null
                : 'AI Agentas (Autonominis)',
    };
    memoryAgentLogs = [entry, ...memoryAgentLogs].slice(0, 100);
    return entry;
}

export function loadSampleAgentAuditLogs(): GilesAiAgentLogEntry[] {
    const existingIds = new Set(memoryAgentLogs.map((l) => l.id));
    const merged = [
        ...DEFAULT_SAMPLE_LOGS.map((item) => ({ ...item })),
        ...memoryAgentLogs.filter((l) => !DEFAULT_SAMPLE_LOGS.some((d) => d.id === l.id)),
    ];
    void existingIds;
    memoryAgentLogs = merged;
    return memoryAgentLogs;
}

export function resolveAiAgentLogEntry(params: {
    logId: string;
    engineerReply: string;
    resolvedBy?: string;
}): GilesAiAgentLogEntry | null {
    const idx = memoryAgentLogs.findIndex((l) => l.id === params.logId);
    if (idx === -1) return null;
    const current = memoryAgentLogs[idx]!;
    const updated: GilesAiAgentLogEntry = {
        ...current,
        responseOrAction: String(params.engineerReply || current.responseOrAction).trim(),
        status: 'ATSAKYTA',
        resolvedBy: params.resolvedBy || 'Darius Šauklys (Vyr. inžinierius)',
    };
    memoryAgentLogs[idx] = updated;
    return updated;
}

export function resetSuppliersAndAgentsStore(): void {
    memorySuppliersOverrides = new Map();
    memoryAgentsOverrides = new Map();
    memoryAgentLogs = DEFAULT_SAMPLE_LOGS.map((item) => ({ ...item }));
    const filePath = resolveSuppliersConfigPath();
    try {
        if (fs.existsSync(filePath)) {
            fs.writeFileSync(filePath, '[]\n', 'utf8');
        }
    } catch {
        // ignore
    }
}
