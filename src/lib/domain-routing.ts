export const PRODUCTION_PRIMARY_ORIGIN = 'https://gilesinzinerija.lt';
export const PRODUCTION_PRIMARY_DOMAIN = 'gilesinzinerija.lt';
export const PROTECTED_MAIL_SERVER_HOST = 'bumslangis.serveriai.lt';
export const PROTECTED_MAIL_SERVER_IP = '79.98.29.20';

export type GilesDomainRole =
    | 'PRIMARY_CANONICAL'
    | 'ALIAS_AND_301_SEO'
    | 'ESHOP_ENTRYPOINT'
    | 'BRAND_ENTRYPOINT'
    | 'GROUP_ALIAS'
    | 'PROTECTED_DO_NOT_TOUCH';

export interface GilesDomainPortfolioEntry {
    domain: string;
    aliases: string[];
    registrar: 'KTU domains.lt' | 'Interneto vizija';
    expiryDate: string;
    role: GilesDomainRole;
    roleLabel: string;
    description: string;
    legacySystem: string;
    targetRoute: string;
    mxProtectionRule: string;
    cutoverAction: string;
    sslManagedBy: string;
}

export const GILES_DOMAIN_PORTFOLIO: GilesDomainPortfolioEntry[] = [
    {
        domain: 'gilesinzinerija.lt',
        aliases: ['www.gilesinzinerija.lt'],
        registrar: 'KTU domains.lt',
        expiryDate: '2027-04-05',
        role: 'PRIMARY_CANONICAL',
        roleLabel: 'Pagrindinis (Canonical)',
        description:
            'Pagrindinis įmonės, inžinerijos, B2B montuotojų portalo ir el. parduotuvės domenas.',
        legacySystem: 'domains.lt HTTP nukreipimas + pagrindinis el. paštas (28.8 GB)',
        targetRoute: '/lt',
        mxProtectionRule:
            'MX 10 bumslangis.serveriai.lt (79.98.29.20, 8 dėžutės: darius@, info@ ir kt.) PALIEKAMA NEPAKEISTA',
        cutoverAction:
            'Keičiamas tik @ ir www A įrašas į produkcinio serverio IP; MX ir SPF lieka ant 79.98.29.20.',
        sslManagedBy: "Caddy Let's Encrypt Auto-TLS",
    },
    {
        domain: 'gilesinzinerija.com',
        aliases: ['www.gilesinzinerija.com'],
        registrar: 'Interneto vizija',
        expiryDate: '2027-10-08',
        role: 'ALIAS_AND_301_SEO',
        roleLabel: 'Tarptautinis ir 301 SEO',
        description:
            'Tarptautinis ir esamas korporatyvinis domenas su pilnu senų WordPress URL 301 SEO žemėlapiu.',
        legacySystem: 'WordPress 7.1.3 (Celestial Lite, 3.2 GB)',
        targetRoute: '/lt',
        mxProtectionRule:
            'MX 10 bumslangis.serveriai.lt (79.98.29.20) + SPF/DKIM PALIEKAMA NEPAKEISTA',
        cutoverAction:
            'Keičiamas tik @ ir www A įrašas; mail.gilesinzinerija.com ir MX nukreipti į 79.98.29.20.',
        sslManagedBy: "Caddy Let's Encrypt Auto-TLS",
    },
    {
        domain: 'egip.lt',
        aliases: ['www.egip.lt'],
        registrar: 'KTU domains.lt',
        expiryDate: '2027-02-01',
        role: 'ESHOP_ENTRYPOINT',
        roleLabel: 'El. parduotuvė egip.lt -> /lt/products',
        description:
            'Esama el. parduotuvė (PrestaShop 1.7 -> Gilės E-Shop) su automatiniu 13,531 prekių ir kategorijų 301 nukreipimu.',
        legacySystem: 'PrestaShop 1.7 (themes/webstrum, 5.3 GB)',
        targetRoute: '/lt/products',
        mxProtectionRule: 'MX mail.egip.lt -> 79.98.29.20 (bumslangis.serveriai.lt) PALIEKAMA NEPAKEISTA',
        cutoverAction:
            'Keičiamas @ ir www A įrašas į produkcijos IP; PrestaShop /index.php ir kategorijos 301 -> /lt/products.',
        sslManagedBy: "Caddy Let's Encrypt Auto-TLS",
    },
    {
        domain: 'vernerkatilai.lt',
        aliases: ['www.vernerkatilai.lt'],
        registrar: 'KTU domains.lt',
        expiryDate: '2027-07-22',
        role: 'BRAND_ENTRYPOINT',
        roleLabel: 'Prekės ženklas -> /lt/products?q=Verner',
        description:
            'Prekės ženklo domenas: Čekijos VERNER katilai, ardynai ir originalios atsarginės dalys.',
        legacySystem: 'WordPress 5.8.13 + WooCommerce 5.5.2 (525 MB)',
        targetRoute: '/lt/products?q=Verner',
        mxProtectionRule:
            'MX 10 bumslangis.serveriai.lt (79.98.29.20, info@vernerkatilai.lt) PALIEKAMA NEPAKEISTA',
        cutoverAction:
            'Keičiamas tik @ ir www A įrašas; srautas automatiškai nukreipiamas į Verner katilų katalogą.',
        sslManagedBy: "Caddy Let's Encrypt Auto-TLS",
    },
    {
        domain: 'ponast.lt',
        aliases: ['www.ponast.lt'],
        registrar: 'KTU domains.lt',
        expiryDate: '2027-07-22',
        role: 'BRAND_ENTRYPOINT',
        roleLabel: 'Prekės ženklas -> /lt/products?q=Ponast',
        description: 'Prekės ženklo domenas: PONAST automatiniai granuliniai katilai ir degikliai.',
        legacySystem: 'WordPress 5.8.13 + WooCommerce 5.5.2 (430 MB)',
        targetRoute: '/lt/products?q=Ponast',
        mxProtectionRule:
            'MX 10 bumslangis.serveriai.lt (79.98.29.20, info@ponast.lt) PALIEKAMA NEPAKEISTA',
        cutoverAction:
            'Keičiamas tik @ ir www A įrašas; srautas nukreipiamas į Ponast katilų katalogą.',
        sslManagedBy: "Caddy Let's Encrypt Auto-TLS",
    },
    {
        domain: 'ponast-verner.lt',
        aliases: ['www.ponast-verner.lt'],
        registrar: 'Interneto vizija',
        expiryDate: '2030-02-10',
        role: 'BRAND_ENTRYPOINT',
        roleLabel: 'Prekės ženklas -> /lt/pramonei',
        description:
            'Prekės ženklo domenas: Ponast & Verner pramoniniai biokuro katilai ir modulinės katilinės (100 kW – 2.5 MW).',
        legacySystem: 'Išorinis NS (lexita.lt)',
        targetRoute: '/lt/pramonei',
        mxProtectionRule: 'SPF ir el. pašto įrašai ant 79.98.29.20 / lexita.lt PALIEKAMI NEPAKEISTI',
        cutoverAction: 'Nukreipti @ ir www A įrašą į produkcijos IP -> /lt/pramonei.',
        sslManagedBy: "Caddy Let's Encrypt Auto-TLS",
    },
    {
        domain: 'thermostal.lt',
        aliases: ['www.thermostal.lt'],
        registrar: 'Interneto vizija',
        expiryDate: '2027-08-23',
        role: 'BRAND_ENTRYPOINT',
        roleLabel: 'Prekės ženklas -> /lt/products?q=Thermostal',
        description: 'Prekės ženklo domenas: Thermostal plieniniai šildymo katilai (Lietuva).',
        legacySystem: 'IV HTTP peradresavimas (thermostahl5.wordpress.com)',
        targetRoute: '/lt/products?q=Thermostal',
        mxProtectionRule:
            'El. pašto peradresavimas į vidas@gilesinzinerija.lt (79.98.29.20) PALIEKAMAS NEPAKEISTAS',
        cutoverAction: 'Pakeisti IV HTTP redirect į produkcinį A įrašą -> /lt/products?q=Thermostal.',
        sslManagedBy: "Caddy Let's Encrypt Auto-TLS",
    },
    {
        domain: 'thermostal.eu',
        aliases: ['www.thermostal.eu'],
        registrar: 'Interneto vizija',
        expiryDate: '2027-08-23',
        role: 'BRAND_ENTRYPOINT',
        roleLabel: 'Prekės ženklas -> /lt/products?q=Thermostal',
        description: 'Prekės ženklo domenas: Thermostal katilai Europos rinkai.',
        legacySystem: 'IV HTTP peradresavimas (thermostahl5.wordpress.com)',
        targetRoute: '/lt/products?q=Thermostal',
        mxProtectionRule:
            'El. pašto peradresavimas į vidas@gilesinzinerija.lt (79.98.29.20) PALIEKAMAS NEPAKEISTAS',
        cutoverAction: 'Pakeisti IV HTTP redirect į produkcinį A įrašą -> /lt/products?q=Thermostal.',
        sslManagedBy: "Caddy Let's Encrypt Auto-TLS",
    },
    {
        domain: 'gilesgrupe.lt',
        aliases: ['www.gilesgrupe.lt'],
        registrar: 'KTU domains.lt',
        expiryDate: '2027-04-05',
        role: 'GROUP_ALIAS',
        roleLabel: 'Įmonių grupė -> /lt',
        description: 'Įmonių grupės domenas su aktyviomis korporatyvinėmis el. pašto dėžutėmis.',
        legacySystem: 'Aktyvus el. paštas (6 dėžutės, 757 MB ant 79.98.29.20)',
        targetRoute: '/lt',
        mxProtectionRule:
            'MX 10 bumslangis.serveriai.lt (79.98.29.20, 6 dėžutės) PALIEKAMA NEPAKEISTA',
        cutoverAction: 'Keičiamas tik @ ir www A įrašas į produkcijos IP; MX neliečiamas.',
        sslManagedBy: "Caddy Let's Encrypt Auto-TLS",
    },
    {
        domain: 'saukliai.lt',
        aliases: ['www.saukliai.lt'],
        registrar: 'KTU domains.lt',
        expiryDate: '2027-10-06',
        role: 'GROUP_ALIAS',
        roleLabel: 'Šeimos / grupės paštas -> /lt',
        description: 'Papildomas įmonės el. pašto domenas (5 aktyvios dėžutės, 979 MB).',
        legacySystem: 'Aktyvus el. paštas (5 dėžutės, 979 MB ant 79.98.29.20)',
        targetRoute: '/lt',
        mxProtectionRule:
            'MX 10 bumslangis.serveriai.lt (79.98.29.20, 5 dėžutės) PALIEKAMA NEPAKEISTA',
        cutoverAction: 'MX lieka ant 79.98.29.20; pasirenkamas @ A įrašas -> /lt.',
        sslManagedBy: "Caddy Let's Encrypt Auto-TLS",
    },
    {
        domain: 'gilesservisas.lt',
        aliases: ['www.gilesservisas.lt'],
        registrar: 'Interneto vizija',
        expiryDate: '2027-11-22',
        role: 'PROTECTED_DO_NOT_TOUCH',
        roleLabel: 'Apsaugotas ERP gilesservisas.lt',
        description:
            'Apsaugotas vidinis serviso ir atsarginių dalių ERP domenas (Dagos :: ERP).',
        legacySystem: 'Dagos :: ERP (tarakonas.serveriai.lt / 79.98.28.35 & 79.98.29.20)',
        targetRoute: 'http://gilesservisas.lt',
        mxProtectionRule:
            'DNS, A ir MX įrašai ant 79.98.28.35 / 79.98.29.20 GRIEŽTAI NELIEČIAMI',
        cutoverAction: 'NELIEČIAMA — vidinė Dagos ERP sistema lieka savo serveryje.',
        sslManagedBy: 'Neliečiama (Dagos ERP)',
    },
    {
        domain: 'vernerbaltic.lt',
        aliases: ['www.vernerbaltic.lt'],
        registrar: 'KTU domains.lt',
        expiryDate: 'Laisvas perregistravimui',
        role: 'BRAND_ENTRYPOINT',
        roleLabel: 'Prekės ženklas -> /lt/products?q=Verner',
        description:
            'Istorinis Verner Baltic domenas (paruoštas 301 maršrutas po perregistravimo).',
        legacySystem: 'Istorinis Verner Baltic katalogas',
        targetRoute: '/lt/products?q=Verner',
        mxProtectionRule: 'Nukreipti į 79.98.29.20 po perregistravimo',
        cutoverAction: 'Perregistravus nukreipti A įrašą į produkcijos IP -> /lt/products?q=Verner.',
        sslManagedBy: "Caddy Let's Encrypt Auto-TLS",
    },
];

function isLocalHost(host: string): boolean {
    const cleaned = host.trim().toLowerCase().replace(/:\d+$/, '');
    return (
        !cleaned ||
        cleaned === '127.0.0.1' ||
        cleaned === 'localhost' ||
        cleaned === '0.0.0.0' ||
        cleaned === '[::1]'
    );
}

function readHeaderValue(
    headers: Headers | Record<string, string | undefined> | undefined,
    key: string,
): string | undefined {
    if (!headers) return undefined;
    if (typeof (headers as Headers).get === 'function') {
        return (headers as Headers).get(key) || undefined;
    }
    const rec = headers as Record<string, string | undefined>;
    return rec[key] ?? rec[key.toLowerCase()] ?? rec[key.toUpperCase()];
}

export function resolvePublicSiteOrigin(
    requestOrHeader?:
        | Request
        | { headers?: Headers | Record<string, string | undefined>; url?: string }
        | string,
): string {
    if (typeof requestOrHeader === 'string') {
        const trimmed = requestOrHeader.trim();
        if (trimmed) {
            if (/^https?:\/\//i.test(trimmed)) {
                try {
                    const parsed = new URL(trimmed);
                    if (!isLocalHost(parsed.host)) {
                        return `${parsed.protocol}//${parsed.host}`;
                    }
                } catch {
                    // fall through
                }
            } else {
                const hostOnly = trimmed.split('/')[0]?.trim() || '';
                if (!isLocalHost(hostOnly)) {
                    return `https://${hostOnly}`;
                }
            }
        }
    } else if (requestOrHeader && typeof requestOrHeader === 'object') {
        const headers = requestOrHeader.headers;
        const forwardedHost = readHeaderValue(headers, 'x-forwarded-host')
            ?.split(',')[0]
            ?.trim();
        const directHost = readHeaderValue(headers, 'host')?.split(',')[0]?.trim();
        const candidateHost = forwardedHost || directHost || '';

        if (candidateHost && !isLocalHost(candidateHost)) {
            const proto =
                readHeaderValue(headers, 'x-forwarded-proto')?.split(',')[0]?.trim() ||
                'https';
            return `${proto}://${candidateHost}`;
        }

        if ('url' in requestOrHeader && typeof requestOrHeader.url === 'string') {
            try {
                const parsed = new URL(requestOrHeader.url);
                if (!isLocalHost(parsed.host)) {
                    return `${parsed.protocol}//${parsed.host}`;
                }
            } catch {
                // fall through
            }
        }
    }

    const envUrl = (process.env.NEXT_PUBLIC_SITE_URL || '').trim().replace(/\/+$/, '');
    if (envUrl) {
        try {
            const parsed = new URL(envUrl);
            if (!isLocalHost(parsed.host)) {
                return `${parsed.protocol}//${parsed.host}`;
            }
        } catch {
            // fall through
        }
    }

    if (typeof window !== 'undefined' && window.location?.origin) {
        if (!isLocalHost(window.location.host)) {
            return window.location.origin;
        }
    }

    return PRODUCTION_PRIMARY_ORIGIN;
}

export function resolveActiveRuntimeOrigin(): string {
    if (typeof window !== 'undefined' && window.location?.origin) {
        return window.location.origin;
    }
    return resolvePublicSiteOrigin();
}

const LEGACY_WORDPRESS_EXACT_MAP: Record<string, string> = {
    '/apie-mus': '/lt/apie-mus',
    '/paslaugos': '/lt/inzinerija',
    '/inzinerines-sistemos': '/lt/inzinerija',
    '/atlikti-darbai': '/lt/projektai',
    '/galerija': '/lt/projektai',
    '/kontaktai': '/lt/uzklausa',
    '/granuliu-degikliai': '/lt/konversija',
    '/degikliai': '/lt/konversija',
    '/katilu-modernizavimas': '/lt/konversija',
    '/konteinerines-katilines': '/lt/pramonei',
    '/katilu-nuoma': '/lt/pramonei',
    '/mobilios-katilines': '/lt/pramonei',
    '/pramoniniai-katilai': '/lt/pramonei',
    '/servisas': '/lt/servisas',
    '/katilu-remontas': '/lt/servisas',
    '/didmena': '/lt/b2b',
    '/partneriams': '/lt/b2b',
    '/wp-admin': '/lt/admin',
    '/wp-login.php': '/lt/admin',
};

const SECONDARY_DOMAIN_ENTRYPOINT_MAP: Record<string, string> = {
    'egip.lt': '/lt/products',
    'vernerkatilai.lt': '/lt/products?q=Verner',
    'vernerbaltic.lt': '/lt/products?q=Verner',
    'ponast.lt': '/lt/products?q=Ponast',
    'ponast-verner.lt': '/lt/pramonei',
    'thermostal.lt': '/lt/products?q=Thermostal',
    'thermostal.eu': '/lt/products?q=Thermostal',
};

const GROUP_ALIAS_DOMAINS = new Set([
    'gilesinzinerija.com',
    'gilesgrupe.lt',
    'saukliai.lt',
]);

function toUrlSearchParams(
    input?: URLSearchParams | Record<string, string | undefined> | string,
): URLSearchParams {
    if (!input) return new URLSearchParams();
    if (input instanceof URLSearchParams) return input;
    if (typeof input === 'string') return new URLSearchParams(input);
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(input)) {
        if (typeof v === 'string') params.set(k, v);
    }
    return params;
}

export function resolveLegacySeoRedirect(
    pathname: string,
    searchParams?: URLSearchParams | Record<string, string | undefined> | string,
    host?: string,
): string | null {
    const cleanHost = (host || '')
        .trim()
        .toLowerCase()
        .replace(/^www\./, '')
        .replace(/:\d+$/, '');

    if (cleanHost === 'gilesservisas.lt') {
        return null;
    }

    const rawPath = (pathname || '/').trim();
    const normalizedPath =
        rawPath === '/' ? '/' : rawPath.replace(/\/+$/, '').toLowerCase();
    const params = toUrlSearchParams(searchParams);

    // 1. Legacy PrestaShop /index.php entrypoint
    if (normalizedPath === '/index.php' || normalizedPath === '/lt/index.php') {
        const controller = (params.get('controller') || '').toLowerCase();
        if (controller === 'cart' || controller === 'order') {
            return '/lt/cart';
        }
        if (controller === 'contact') {
            return '/lt/uzklausa';
        }
        const searchQuery = params.get('s') || params.get('q') || params.get('search_query');
        if (searchQuery && searchQuery.trim()) {
            return `/lt/products?q=${encodeURIComponent(searchQuery.trim())}`;
        }
        return '/lt/products';
    }

    // 2. Legacy WordPress unprefixed paths (/apie-mus/, /paslaugos/, /atlikti-darbai/, /kontaktai/, etc.)
    const wpTarget = LEGACY_WORDPRESS_EXACT_MAP[normalizedPath];
    if (wpTarget) {
        return wpTarget;
    }

    // 3. Legacy PrestaShop CMS pages (/lt/content/4-apie-mus, /content/3-taisykles, etc.)
    if (
        normalizedPath.startsWith('/lt/content/') ||
        normalizedPath.startsWith('/en/content/') ||
        normalizedPath.startsWith('/content/')
    ) {
        if (normalizedPath.includes('grazin') || normalizedPath.includes('pristat')) {
            return '/lt/legal/returns';
        }
        if (normalizedPath.includes('privat') || normalizedPath.includes('slapuk')) {
            return '/lt/legal/privacy';
        }
        if (normalizedPath.includes('taisykl') || normalizedPath.includes('salyg')) {
            return '/lt/legal/terms';
        }
        if (normalizedPath.includes('kontakt')) {
            return '/lt/uzklausa';
        }
        return '/lt/apie-mus';
    }

    // 4. Legacy PrestaShop numeric category/product routes (/lt/3-katilai, /lt/12-katilai, /lt/4-degikliai, /lt/15-degikliai, /lt/5-boileriai)
    const prestaMatch = normalizedPath.match(
        /^(?:\/(?:lt|en|ru|pl))?\/(\d+)-([a-z0-9-]+)(?:\.html)?$/i,
    );
    if (prestaMatch) {
        const slug = (prestaMatch[2] || '').toLowerCase();
        if (slug.includes('katil')) {
            return '/lt/products?q=Katilai';
        }
        if (slug.includes('degikl')) {
            return '/lt/products?q=Degikliai';
        }
        if (slug.includes('boiler') || slug.includes('sildytuv')) {
            return '/lt/products?q=Boileriai';
        }
        if (slug.includes('verner')) {
            return '/lt/products?q=Verner';
        }
        if (slug.includes('ponast')) {
            return '/lt/products?q=Ponast';
        }
        if (slug.includes('thermostal')) {
            return '/lt/products?q=Thermostal';
        }
        if (slug.includes('danfoss')) {
            return '/lt/products?q=Danfoss';
        }
        if (slug.includes('herz')) {
            return '/lt/products?q=HERZ';
        }
        return '/lt/products';
    }

    // 5. Secondary brand domain root / locale-root entrypoint routing
    if (normalizedPath === '/' || normalizedPath === '' || normalizedPath === '/lt') {
        const brandTarget = SECONDARY_DOMAIN_ENTRYPOINT_MAP[cleanHost];
        if (brandTarget) {
            return brandTarget;
        }
        if (GROUP_ALIAS_DOMAINS.has(cleanHost) && (normalizedPath === '/' || normalizedPath === '')) {
            return '/lt';
        }
    }

    return null;
}
