export type IntegrationCategoryId =
    | 'payments'
    | 'shipping'
    | 'accounting'
    | 'communications'
    | 'ai_growth';

export type IntegrationReadinessStatus =
    | 'ACTIVE'
    | 'READY_FOR_KEYS'
    | 'CONFIGURED';

export type IntegrationEnvironment = 'sandbox' | 'production';

export interface IntegrationFieldDefinition {
    envVar: string;
    label: string;
    placeholder: string;
    secret: boolean;
    defaultValue?: string;
}

export interface IntegrationConnectorDefinition {
    id: string;
    categoryId: IntegrationCategoryId;
    categoryTitle: string;
    categoryShortLabel: string;
    title: string;
    description: string;
    defaultStatus: 'ACTIVE' | 'READY_FOR_KEYS';
    statusBadgeText: string;
    webhookUrl?: string;
    supportsEnvironmentToggle: boolean;
    defaultEnvironment: IntegrationEnvironment;
    fields: IntegrationFieldDefinition[];
}

export interface SavedIntegrationOverride {
    enabled?: boolean;
    environment?: IntegrationEnvironment;
    values?: Record<string, string>;
    updatedAt?: string;
}

export interface IntegrationRuntimeState extends IntegrationConnectorDefinition {
    enabled: boolean;
    environment: IntegrationEnvironment;
    readinessStatus: IntegrationReadinessStatus;
    maskedValues: Record<string, string>;
    configuredValues: Record<string, string>;
    updatedAt: string | null;
}

export interface WebhookLogRecord {
    id: string;
    provider: string;
    eventType: string;
    signatureVerified: boolean;
    orderOrInvoiceRef: string | null;
    invoiceUpdated: boolean;
    receivedAt: string;
}

let memoryOverridesCache: Record<string, SavedIntegrationOverride> | null = null;
const webhookLogsMemory: WebhookLogRecord[] = [];

function getServerFsAndPath(): {
    fs: typeof import('node:fs');
    configPath: string;
    dirPath: string;
} | null {
    if (typeof window !== 'undefined') return null;
    try {
        const req = eval('require') as NodeRequire;
        const fs = req('fs') as typeof import('node:fs');
        const path = req('path') as typeof import('node:path');
        const configPath = path.join(process.cwd(), 'src', 'data', 'integrations-config.json');
        return { fs, configPath, dirPath: path.dirname(configPath) };
    } catch {
        return null;
    }
}

export const INTEGRATION_CATEGORIES: Array<{
    id: 'all' | IntegrationCategoryId;
    label: string;
    fullTitle: string;
    count: number;
}> = [
    { id: 'all', label: 'Visos (14)', fullTitle: 'Visos integracijos', count: 14 },
    {
        id: 'payments',
        label: 'Mokėjimai (4)',
        fullTitle: 'Mokėjimų sistemos (Payment Gateways)',
        count: 4,
    },
    {
        id: 'shipping',
        label: 'Kurjeriai ir paštomatai (4)',
        fullTitle: 'Kurjeriai, Paletės ir Paštomatai (Shipping & Logistics)',
        count: 4,
    },
    {
        id: 'accounting',
        label: 'Buhalterija Skaita / VMI (3)',
        fullTitle: 'Buhalterija, VMI ir Valstybės Registrai (Accounting & ERP)',
        count: 3,
    },
    {
        id: 'communications',
        label: 'El. paštas ir SMS (2)',
        fullTitle: 'El. Paštas, SMS ir Pranešimai (Communications)',
        count: 2,
    },
    {
        id: 'ai_growth',
        label: 'AI ir Analitika (1)',
        fullTitle: 'AI Inžinierius, Reklamos Srautas ir Analitika (AI & Growth)',
        count: 1,
    },
];

export const GILES_INTEGRATIONS_REGISTRY: IntegrationConnectorDefinition[] = [
    {
        id: 'montonio',
        categoryId: 'payments',
        categoryTitle: 'Mokėjimų sistemos (Payment Gateways)',
        categoryShortLabel: 'Mokėjimai',
        title: 'Montonio — Lietuvos Banklinkai: Swedbank, SEB, Luminor, Revolut, Citadele + Kortelės',
        description: 'Tiesioginis atsiskaitymas per Lietuvos bankus (PIS), Apple Pay, Google Pay ir mokėjimo korteles su automatiniu GILE sąskaitų apmokėjimo pažymėjimu.',
        defaultStatus: 'READY_FOR_KEYS',
        statusBadgeText: 'Paruošta — įveskite Montonio Access ir Secret raktus',
        webhookUrl: '/api/integrations/webhooks/montonio',
        supportsEnvironmentToggle: true,
        defaultEnvironment: 'sandbox',
        fields: [
            { envVar: 'MONTONIO_ACCESS_KEY', label: 'Montonio Access Key', placeholder: 'Įveskite MONTONIO_ACCESS_KEY...', secret: true },
            { envVar: 'MONTONIO_SECRET_KEY', label: 'Montonio Secret Key', placeholder: 'Įveskite MONTONIO_SECRET_KEY...', secret: true },
            { envVar: 'MONTONIO_ENV', label: 'Aplinka (sandbox | production)', placeholder: 'sandbox', secret: false, defaultValue: 'sandbox' },
        ],
    },
    {
        id: 'paysera',
        categoryId: 'payments',
        categoryTitle: 'Mokėjimų sistemos (Payment Gateways)',
        categoryShortLabel: 'Mokėjimai',
        title: 'Paysera Checkout — Banklinkai, Kortelės ir Mokėjimų inicijavimas',
        description: 'Paysera Checkout integracija su MD5/SS2 parašo patikra ir automatiniu užsakymo statuso atnaujinimu.',
        defaultStatus: 'READY_FOR_KEYS',
        statusBadgeText: 'Paruošta — įveskite Paysera Project ID ir Sign Password',
        webhookUrl: '/api/integrations/webhooks/paysera',
        supportsEnvironmentToggle: true,
        defaultEnvironment: 'sandbox',
        fields: [
            { envVar: 'PAYSERA_PROJECT_ID', label: 'Paysera Project ID', placeholder: 'Įveskite PAYSERA_PROJECT_ID...', secret: false },
            { envVar: 'PAYSERA_SIGN_PASSWORD', label: 'Paysera Sign Password', placeholder: 'Įveskite PAYSERA_SIGN_PASSWORD...', secret: true },
            { envVar: 'PAYSERA_ENV', label: 'Aplinka (sandbox | production)', placeholder: 'sandbox', secret: false, defaultValue: 'sandbox' },
        ],
    },
    {
        id: 'stripe',
        categoryId: 'payments',
        categoryTitle: 'Mokėjimų sistemos (Payment Gateways)',
        categoryShortLabel: 'Mokėjimai',
        title: 'Stripe — Visa / Mastercard, Apple Pay, Google Pay, SEPA',
        description: 'Tarptautiniai atsiskaitymai kortelėmis, Apple Pay, Google Pay ir SEPA tiesioginiu debetu.',
        defaultStatus: 'READY_FOR_KEYS',
        statusBadgeText: 'Paruošta — įveskite Stripe Publishable, Secret ir Webhook raktus',
        webhookUrl: '/api/integrations/webhooks/stripe',
        supportsEnvironmentToggle: true,
        defaultEnvironment: 'sandbox',
        fields: [
            { envVar: 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY', label: 'Stripe Publishable Key', placeholder: 'pk_live_... arba pk_test_...', secret: false },
            { envVar: 'STRIPE_SECRET_KEY', label: 'Stripe Secret Key', placeholder: 'sk_live_... arba sk_test_...', secret: true },
            { envVar: 'STRIPE_WEBHOOK_SECRET', label: 'Stripe Webhook Secret', placeholder: 'whsec_...', secret: true },
        ],
    },
    {
        id: 'bank_transfer_proforma',
        categoryId: 'payments',
        categoryTitle: 'Mokėjimų sistemos (Payment Gateways)',
        categoryShortLabel: 'Mokėjimai',
        title: 'Išankstinė PVM sąskaita faktūra / Bankinis pavedimas + SEPA camt.053',
        description: 'Automatinis PRO-XXXX išankstinių sąskaitų generavimas ir banko išrašų (SEPA ISO 20022 camt.053 XML / CSV) sudengimas.',
        defaultStatus: 'ACTIVE',
        statusBadgeText: 'Aktyvuota — veikia iš karto be papildomų raktų',
        supportsEnvironmentToggle: false,
        defaultEnvironment: 'production',
        fields: [
            { envVar: 'GILES_IBAN', label: 'Įmonės IBAN sąskaita', placeholder: 'LT627300010128945112', secret: false, defaultValue: 'LT627300010128945112' },
            { envVar: 'GILES_BANK_NAME', label: 'Banko pavadinimas', placeholder: 'Swedbank, AB', secret: false, defaultValue: 'Swedbank, AB' },
            { envVar: 'GILES_PAYMENT_TERM_DAYS', label: 'Apmokėjimo terminas (d.)', placeholder: '14', secret: false, defaultValue: '14' },
        ],
    },
    {
        id: 'venipak',
        categoryId: 'shipping',
        categoryTitle: 'Kurjeriai, Paletės ir Paštomatai (Shipping & Logistics)',
        categoryShortLabel: 'Kurjeriai ir paštomatai',
        title: 'Venipak — Sunkių katilų / palečių (50–800 kg) kurjeris ir paštomatai',
        description: 'Krovinių su hidrauliniu liftu, katilų palečių ir smulkių siuntų lipdukų bei manifestų generavimas iš Kauno sandėlio.',
        defaultStatus: 'READY_FOR_KEYS',
        statusBadgeText: 'Paruošta — įveskite Venipak API ID, vartotoją ir slaptažodį',
        webhookUrl: '/api/integrations/webhooks/venipak',
        supportsEnvironmentToggle: true,
        defaultEnvironment: 'sandbox',
        fields: [
            { envVar: 'VENIPAK_API_ID', label: 'Venipak API ID', placeholder: 'Įveskite VENIPAK_API_ID...', secret: false },
            { envVar: 'VENIPAK_API_USER', label: 'Venipak API vartotojas', placeholder: 'Įveskite VENIPAK_API_USER...', secret: false },
            { envVar: 'VENIPAK_API_PASSWORD', label: 'Venipak API slaptažodis', placeholder: 'Įveskite VENIPAK_API_PASSWORD...', secret: true },
            { envVar: 'VENIPAK_WAREHOUSE_ADDRESS', label: 'Sandėlio išsiuntimo adresas', placeholder: 'Eigulių g. 21, LT-51418 Kaunas', secret: false, defaultValue: 'Eigulių g. 21, LT-51418 Kaunas' },
        ],
    },
    {
        id: 'dpd',
        categoryId: 'shipping',
        categoryTitle: 'Kurjeriai, Paletės ir Paštomatai (Shipping & Logistics)',
        categoryShortLabel: 'Kurjeriai ir paštomatai',
        title: 'DPD Lietuva — Kurjeris, paletės ir Pickup paštomatai',
        description: 'DPD kurjerio iškvietimas į objektą, palečių logistika ir Pickup paštomatų žemėlapis.',
        defaultStatus: 'READY_FOR_KEYS',
        statusBadgeText: 'Paruošta — įveskite DPD API Token ir Client ID',
        webhookUrl: '/api/integrations/webhooks/dpd',
        supportsEnvironmentToggle: true,
        defaultEnvironment: 'sandbox',
        fields: [
            { envVar: 'DPD_API_TOKEN', label: 'DPD API Token', placeholder: 'Įveskite DPD_API_TOKEN...', secret: true },
            { envVar: 'DPD_CLIENT_ID', label: 'DPD Client ID', placeholder: 'Įveskite DPD_CLIENT_ID...', secret: false },
            { envVar: 'DPD_SENDER_ZIP', label: 'Siuntėjo pašto kodas', placeholder: '50182', secret: false, defaultValue: '50182' },
        ],
    },
    {
        id: 'omniva',
        categoryId: 'shipping',
        categoryTitle: 'Kurjeriai, Paletės ir Paštomatai (Shipping & Logistics)',
        categoryShortLabel: 'Kurjeriai ir paštomatai',
        title: 'Omniva LT — Paštomatų tinklas smulkioms dalims, vožtuvams ir automatikai',
        description: 'Automatinis Omniva paštomatų lipdukų generavimas Danfoss, HERZ ir katilų atsarginėms dalims iki 30 kg.',
        defaultStatus: 'READY_FOR_KEYS',
        statusBadgeText: 'Paruošta — įveskite Omniva Webservice vartotoją ir slaptažodį',
        webhookUrl: '/api/integrations/webhooks/omniva',
        supportsEnvironmentToggle: true,
        defaultEnvironment: 'sandbox',
        fields: [
            { envVar: 'OMNIVA_API_USER', label: 'Omniva API vartotojas', placeholder: 'Įveskite OMNIVA_API_USER...', secret: false },
            { envVar: 'OMNIVA_API_PASSWORD', label: 'Omniva API slaptažodis', placeholder: 'Įveskite OMNIVA_API_PASSWORD...', secret: true },
            { envVar: 'OMNIVA_RETURN_CODE', label: 'Grąžinimo kodas (Return Code)', placeholder: 'Įveskite OMNIVA_RETURN_CODE...', secret: false },
        ],
    },
    {
        id: 'lpexpress',
        categoryId: 'shipping',
        categoryTitle: 'Kurjeriai, Paletės ir Paštomatai (Shipping & Logistics)',
        categoryShortLabel: 'Kurjeriai ir paštomatai',
        title: 'LP Express / Lietuvos paštas — Paštomatai ir kurjeris',
        description: 'LP Express savitarnos terminalų ir kurjerių siuntų registravimas visoje Lietuvoje.',
        defaultStatus: 'READY_FOR_KEYS',
        statusBadgeText: 'Paruošta — įveskite LP Express API prisijungimus',
        supportsEnvironmentToggle: true,
        defaultEnvironment: 'sandbox',
        fields: [
            { envVar: 'LPEXPRESS_API_USER', label: 'LP Express API vartotojas', placeholder: 'Įveskite LPEXPRESS_API_USER...', secret: false },
            { envVar: 'LPEXPRESS_API_PASSWORD', label: 'LP Express API slaptažodis', placeholder: 'Įveskite LPEXPRESS_API_PASSWORD...', secret: true },
        ],
    },
    {
        id: 'prototechnika_skaita',
        categoryId: 'accounting',
        categoryTitle: 'Buhalterija, VMI ir Valstybės Registrai (Accounting & ERP)',
        categoryShortLabel: 'Buhalterija Skaita / VMI',
        title: 'UAB Prototechnika „Skaita“ — Buhalterinė apskaita ir sandėlis',
        description: 'Aktyvus GILE-XXXX PVM sąskaitų CSV/Excel/EIP eksportas ir sandėlio likučių importas; pasirenkamas tiesioginis SQL/ODBC tiltas.',
        defaultStatus: 'ACTIVE',
        statusBadgeText: 'Aktyvuota — CSV/Excel/EIP eksportas ir likučių importas veikia; pasirenkamas tiesioginis SQL/ODBC tiltas',
        supportsEnvironmentToggle: false,
        defaultEnvironment: 'production',
        fields: [
            { envVar: 'SKAITA_ODBC_DSN', label: 'Skaita ODBC DSN', placeholder: 'SKAITA_PROD_DSN', secret: false },
            { envVar: 'SKAITA_SQL_HOST', label: 'Skaita SQL Host', placeholder: '127.0.0.1:1433', secret: false },
            { envVar: 'SKAITA_SQL_USER', label: 'Skaita SQL vartotojas', placeholder: 'skaita_sync', secret: false },
            { envVar: 'SKAITA_SQL_PASSWORD', label: 'Skaita SQL slaptažodis', placeholder: 'Įveskite SKAITA_SQL_PASSWORD...', secret: true },
            { envVar: 'SKAITA_DEFAULT_WAREHOUSE', label: 'Numatytasis sandėlis', placeholder: 'KAUNAS_SAVANORIU_191A', secret: false, defaultValue: 'KAUNAS_SAVANORIU_191A' },
        ],
    },
    {
        id: 'vmi_imas',
        categoryId: 'accounting',
        categoryTitle: 'Buhalterija, VMI ir Valstybės Registrai (Accounting & ERP)',
        categoryShortLabel: 'Buhalterija Skaita / VMI',
        title: 'VMI i.MAS — i.SAF 1.2 PVM sąskaitų registras ir i.VAZ važtaraščiai',
        description: 'Aktyvus VMI i.SAF 1.2 XML ir i.VAZ važtaraščių generavimas; pasirenkamas VMI žiniatinklio paslaugų API raktas tiesioginiam pateikimui.',
        defaultStatus: 'ACTIVE',
        statusBadgeText: 'Aktyvuota — i.SAF 1.2 XML ir i.VAZ generavimas veikia; pasirenkamas VMI API raktas tiesioginiam pateikimui',
        supportsEnvironmentToggle: true,
        defaultEnvironment: 'production',
        fields: [
            { envVar: 'VMI_IMAS_API_TOKEN', label: 'VMI i.MAS API Token', placeholder: 'Įveskite VMI_IMAS_API_TOKEN...', secret: true },
            { envVar: 'VMI_TAXPAYER_CODE', label: 'Mokesčių mokėtojo kodas', placeholder: '302620907', secret: false, defaultValue: '302620907' },
        ],
    },
    {
        id: 'registru_centras_vies',
        categoryId: 'accounting',
        categoryTitle: 'Buhalterija, VMI ir Valstybės Registrai (Accounting & ERP)',
        categoryShortLabel: 'Buhalterija Skaita / VMI',
        title: 'Registrų Centras / ES VIES — Įmonės kodo ir PVM mokėtojo automatinė patikra',
        description: 'Automatinis B2B montuotojų ir pirkėjų įmonės rekvizitų bei ES VIES PVM kodo galiojimo tikrinimas.',
        defaultStatus: 'ACTIVE',
        statusBadgeText: 'Aktyvuota — VIES SOAP patikra veikia iš karto',
        supportsEnvironmentToggle: false,
        defaultEnvironment: 'production',
        fields: [
            { envVar: 'VIES_SOAP_ENABLED', label: 'ES VIES SOAP patikra įjungta', placeholder: 'true', secret: false, defaultValue: 'true' },
            { envVar: 'RC_API_KEY', label: 'Registrų Centro API raktas (pasirenkamas)', placeholder: 'Įveskite RC_API_KEY...', secret: true },
        ],
    },
    {
        id: 'smtp_mail',
        categoryId: 'communications',
        categoryTitle: 'El. Paštas, SMS ir Pranešimai (Communications)',
        categoryShortLabel: 'El. paštas ir SMS',
        title: 'El. pašto serveris (bumslangis.serveriai.lt) — Sąskaitų ir užsakymų siuntimas',
        description: 'Automatinis išankstinių sąskaitų (PRO), PVM sąskaitų faktūrų (GILE) ir serviso pranešimų siuntimas per serveriai.lt SMTP.',
        defaultStatus: 'READY_FOR_KEYS',
        statusBadgeText: 'Paruošta — įveskite info@gilesinzinerija.lt SMTP slaptažodį',
        supportsEnvironmentToggle: false,
        defaultEnvironment: 'production',
        fields: [
            { envVar: 'SMTP_HOST', label: 'SMTP serveris', placeholder: 'bumslangis.serveriai.lt', secret: false, defaultValue: 'bumslangis.serveriai.lt' },
            { envVar: 'SMTP_PORT', label: 'SMTP prievadas', placeholder: '465', secret: false, defaultValue: '465' },
            { envVar: 'SMTP_USER', label: 'SMTP vartotojas', placeholder: 'info@gilesinzinerija.lt', secret: false, defaultValue: 'info@gilesinzinerija.lt' },
            { envVar: 'SMTP_PASSWORD', label: 'SMTP slaptažodis', placeholder: 'Įveskite SMTP_PASSWORD...', secret: true },
        ],
    },
    {
        id: 'sms_biuras',
        categoryId: 'communications',
        categoryTitle: 'El. Paštas, SMS ir Pranešimai (Communications)',
        categoryShortLabel: 'El. paštas ir SMS',
        title: 'SMS Biuras — SMS pranešimai klientams ir serviso meistrų iškvietimams',
        description: 'Momentiniai SMS pranešimai apie paruoštą atsiimti katilą Kauno sandėlyje ir skubius garantinio serviso iškvietimus.',
        defaultStatus: 'READY_FOR_KEYS',
        statusBadgeText: 'Paruošta — įveskite SMS Biuras API raktą',
        supportsEnvironmentToggle: true,
        defaultEnvironment: 'production',
        fields: [
            { envVar: 'SMS_BIURAS_API_KEY', label: 'SMS Biuras API raktas', placeholder: 'Įveskite SMS_BIURAS_API_KEY...', secret: true },
            { envVar: 'SMS_SENDER_ID', label: 'Siuntėjo vardas (Sender ID)', placeholder: 'GilesInz', secret: false, defaultValue: 'GilesInz' },
        ],
    },
    {
        id: 'xai_grok_and_ads',
        categoryId: 'ai_growth',
        categoryTitle: 'AI Inžinierius, Reklamos Srautas ir Analitika (AI & Growth)',
        categoryShortLabel: 'AI ir Analitika',
        title: 'xAI Grok (Vytautas 2.0 AI) + GA4 + Meta CAPI + Google Merchant XML Feed',
        description: 'Vytautas 2.0 AI šilumos inžinierius, /api/feed XML prekių srautas ir Google Analytics 4 / Meta Conversions API įvykiai.',
        defaultStatus: 'ACTIVE',
        statusBadgeText: 'Aktyvuota — Vytautas AI ir /api/feed aktyvūs; įveskite GA4/Meta Pixel ID analitikai',
        supportsEnvironmentToggle: false,
        defaultEnvironment: 'production',
        fields: [
            { envVar: 'XAI_DIRECT_API_KEY', label: 'xAI Direct API Key (Vytautas 2.0)', placeholder: 'xai-...', secret: true },
            { envVar: 'NEXT_PUBLIC_GA4_ID', label: 'Google Analytics 4 ID', placeholder: 'G-XXXXXXXXXX', secret: false },
            { envVar: 'NEXT_PUBLIC_META_PIXEL_ID', label: 'Meta Pixel ID', placeholder: 'Įveskite Pixel ID...', secret: false },
            { envVar: 'META_CAPI_TOKEN', label: 'Meta Conversions API Token', placeholder: 'Įveskite META_CAPI_TOKEN...', secret: true },
        ],
    },
];

export function maskSecretValue(val: string, isSecret: boolean): string {
    const trimmed = (val || '').trim();
    if (!trimmed) return '';
    if (!isSecret) return trimmed;
    if (trimmed.length <= 6) return '••••••';
    return `${trimmed.slice(0, 4)}••••••••${trimmed.slice(-3)}`;
}

export function readIntegrationsOverrides(): Record<string, SavedIntegrationOverride> {
    if (memoryOverridesCache) return memoryOverridesCache;
    try {
        const srv = getServerFsAndPath();
        if (srv && srv.fs.existsSync(srv.configPath)) {
            const raw = srv.fs.readFileSync(srv.configPath, 'utf-8');
            const parsed = JSON.parse(raw);
            if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
                memoryOverridesCache = parsed as Record<string, SavedIntegrationOverride>;
                return memoryOverridesCache;
            }
        }
    } catch {
        // ignore read error
    }
    memoryOverridesCache = {};
    return memoryOverridesCache;
}

export function writeIntegrationsOverrides(
    overrides: Record<string, SavedIntegrationOverride>,
): void {
    memoryOverridesCache = overrides;
    try {
        const srv = getServerFsAndPath();
        if (srv) {
            srv.fs.mkdirSync(srv.dirPath, { recursive: true });
            srv.fs.writeFileSync(
                srv.configPath,
                `${JSON.stringify(overrides, null, 2)}\n`,
                'utf-8',
            );
        }
    } catch {
        // ignore write error
    }
}

export function resetIntegrationsOverrides(): void {
    writeIntegrationsOverrides({});
}

export function getIntegrationsRuntimeList(): IntegrationRuntimeState[] {
    const overrides = readIntegrationsOverrides();
    return GILES_INTEGRATIONS_REGISTRY.map((def) => {
        const saved = overrides[def.id];
        const configuredValues: Record<string, string> = {};
        const maskedValues: Record<string, string> = {};
        let hasUserEnteredKey = false;

        for (const field of def.fields) {
            const fromSaved = saved?.values?.[field.envVar];
            const fromEnv = process.env[field.envVar];
            const rawVal =
                fromSaved !== undefined
                    ? fromSaved
                    : fromEnv !== undefined
                      ? fromEnv
                      : field.defaultValue || '';
            configuredValues[field.envVar] = rawVal;
            maskedValues[field.envVar] = maskSecretValue(rawVal, field.secret);
            if (fromSaved && fromSaved.trim().length > 0 && fromSaved !== field.defaultValue) {
                hasUserEnteredKey = true;
            }
        }

        const readinessStatus: IntegrationReadinessStatus =
            def.defaultStatus === 'ACTIVE'
                ? 'ACTIVE'
                : hasUserEnteredKey
                  ? 'CONFIGURED'
                  : 'READY_FOR_KEYS';

        return {
            ...def,
            enabled: saved?.enabled ?? def.defaultStatus === 'ACTIVE',
            environment: saved?.environment || def.defaultEnvironment,
            readinessStatus,
            maskedValues,
            configuredValues,
            updatedAt: saved?.updatedAt || null,
        };
    });
}

export function buildEnvProductionTemplate(): string {
    const list = getIntegrationsRuntimeList();
    const lines: string[] = [
        '# UAB „Gilės inžinerija“ (gilesinzinerija.lt / egip.lt) — .env.production konfigūracija',
        '# Sugeneruota iš /lt/admin Integracijų ir API Raktų valdymo centro',
        'NEXT_PUBLIC_SITE_URL="https://gilesinzinerija.lt"',
        'STORE_PUBLIC_DOMAIN="gilesinzinerija.lt"',
        '',
    ];
    for (const item of list) {
        lines.push(`# --- ${item.title} ---`);
        for (const f of item.fields) {
            const val = item.configuredValues[f.envVar] || f.defaultValue || '';
            lines.push(`${f.envVar}="${val}"`);
        }
        lines.push('');
    }
    return lines.join('\n');
}

export function recordWebhookEvent(entry: Omit<WebhookLogRecord, 'id' | 'receivedAt'>): WebhookLogRecord {
    const rec: WebhookLogRecord = {
        ...entry,
        id: `wh-${Date.now()}-${webhookLogsMemory.length + 1}`,
        receivedAt: new Date().toISOString(),
    };
    webhookLogsMemory.unshift(rec);
    if (webhookLogsMemory.length > 50) webhookLogsMemory.length = 50;
    return rec;
}

export function listWebhookEvents(): WebhookLogRecord[] {
    return [...webhookLogsMemory];
}
