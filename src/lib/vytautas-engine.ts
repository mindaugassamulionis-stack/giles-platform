import { getGilesCatalogSnapshot } from './giles-catalog-snapshot';
import { resolveBrandLogo } from './product-visuals';
import type {
    ClientSystemMap,
    VytautasHistoryTurn,
    VytautasNodeCategory,
    VytautasProductCard,
    VytautasStage,
} from './vytautas-consultant';

export type VytautasDomain =
    | 'radiators'
    | 'boilers'
    | 'heat_pumps'
    | 'pellet_burners'
    | 'tanks_boilers'
    | 'underfloor'
    | 'valves_thermostats'
    | 'pumps_hydraulics'
    | 'expansion_air'
    | 'spare_parts'
    | 'general';

export type VytautasConnectionSide = 'lateral' | 'bottom' | null;
export type VytautasConnectionHand = 'right' | 'left' | null;
export type VytautasFocusFilter = 'main_units_only' | 'accessories_only' | 'complete_kit';

export interface VytautasConversationState {
    domain: VytautasDomain;
    nodeCategory: VytautasNodeCategory;
    nodeLabel: string;
    connectionSide: VytautasConnectionSide;
    connectionHand: VytautasConnectionHand;
    focusFilter: VytautasFocusFilter;
    areaM2: number | null;
    powerKw: number | null;
    heightMm: number | null;
    volumeL: number | null;
    loopCount: number | null;
    brandFilter: string | null;
    turnCount: number;
    userTurnsCount: number;
    lastUserMessage: string;
    normalizedLastUserMessage: string;
    combinedUserText: string;
    powerOrAreaSummary: string;
    connectionOrTypeSummary: string;
}

export interface VytautasEngineResult {
    stage: VytautasStage;
    reply: string;
    response: string;
    recommendations: VytautasProductCard[];
    recommendedProducts: VytautasProductCard[];
    suggestedProducts: VytautasProductCard[];
    quickReplies: string[];
    followUpSuggestions: string[];
    systemMap: ClientSystemMap;
    state: VytautasConversationState;
}

/**
 * Built-in radiator catalog enrichment & fallback matching Gilės Inžinerija SKUs
 * so Vytautas ALWAYS returns multiple real radiator heights/models (Ferroli POL 350, 500, 600, 800,
 * and Plieninis radiatorius Tipas 22 K 500x800 / 500x1000 / 600x1000).
 */
export const RADIATOR_MAIN_UNIT_CATALOG: VytautasProductCard[] = [
    {
        id: 'POL./80-500',
        sku: 'POL./80-500',
        name: 'Ferroli POL 500 sekcijinis aliumininis radiatorius (ašių tarpas 500 mm, ~119 W/sekc.)',
        title: 'Ferroli POL 500 sekcijinis aliumininis radiatorius (ašių tarpas 500 mm, ~119 W/sekc.)',
        price: 13.03,
        formattedPrice: '13,03 €',
        url: '/products/POL.%2F80-500',
        slug: 'ferroli-pol-500-pol-80-500',
        image: '/images/products/0381-01.000.webp',
        imageUrl: '/images/products/0381-01.000.webp',
        brandName: 'Ferroli',
        brandLogoUrl: '/images/brands/ferroli.svg',
        category: 'Radiatoriai ir konvektoriai',
        applicationRole: 'Aliumininis sekcijinis radiatorius (universalus kairės/dešinės pusės)',
        keySpec: 'Aukštis 582 mm · Ašių tarpas 500 mm · Šoninis G 1″ · ~119 W/sekc. (ΔT 50K)',
    },
    {
        id: 'POL./80-300',
        sku: 'POL./80-300',
        name: 'Ferroli POL 350 sekcijinis aliumininis radiatorius (ašių tarpas 350 mm, ~88 W/sekc.)',
        title: 'Ferroli POL 350 sekcijinis aliumininis radiatorius (ašių tarpas 350 mm, ~88 W/sekc.)',
        price: 12.16,
        formattedPrice: '12,16 €',
        url: '/products/POL.%2F80-300',
        slug: 'ferroli-pol-350-pol-80-300',
        image: '/images/products/0381-01.000.webp',
        imageUrl: '/images/products/0381-01.000.webp',
        brandName: 'Ferroli',
        brandLogoUrl: '/images/brands/ferroli.svg',
        category: 'Radiatoriai ir konvektoriai',
        applicationRole: 'Žemas sekcijinis radiatorius po žemomis palangėmis (350 mm)',
        keySpec: 'Aukštis 432 mm · Ašių tarpas 350 mm · Šoninis G 1″ · ~88 W/sekc. (ΔT 50K)',
    },
    {
        id: 'POL./80-600',
        sku: 'POL./80-600',
        name: 'Ferroli POL 600 sekcijinis aliumininis radiatorius (ašių tarpas 600 mm, ~142 W/sekc.)',
        title: 'Ferroli POL 600 sekcijinis aliumininis radiatorius (ašių tarpas 600 mm, ~142 W/sekc.)',
        price: 14.8,
        formattedPrice: '14,80 €',
        url: '/products/POL.%2F80-600',
        slug: 'ferroli-pol-600-pol-80-600',
        image: '/images/products/0381-01.000.webp',
        imageUrl: '/images/products/0381-01.000.webp',
        brandName: 'Ferroli',
        brandLogoUrl: '/images/brands/ferroli.svg',
        category: 'Radiatoriai ir konvektoriai',
        applicationRole: 'Padidintos galios sekcijinis radiatorius (600 mm)',
        keySpec: 'Aukštis 682 mm · Ašių tarpas 600 mm · Šoninis G 1″ · ~142 W/sekc. (ΔT 50K)',
    },
    {
        id: 'POL./80-800',
        sku: 'POL./80-800',
        name: 'Ferroli POL 800 aukštas sekcijinis aliumininis radiatorius (ašių tarpas 800 mm, ~178 W/sekc.)',
        title: 'Ferroli POL 800 aukštas sekcijinis aliumininis radiatorius (ašių tarpas 800 mm, ~178 W/sekc.)',
        price: 18.9,
        formattedPrice: '18,90 €',
        url: '/products/POL.%2F80-800',
        slug: 'ferroli-pol-800-pol-80-800',
        image: '/images/products/0381-01.000.webp',
        imageUrl: '/images/products/0381-01.000.webp',
        brandName: 'Ferroli',
        brandLogoUrl: '/images/brands/ferroli.svg',
        category: 'Radiatoriai ir konvektoriai',
        applicationRole: 'Aukštas sekcijinis radiatorius siauroms nišoms (800 mm)',
        keySpec: 'Aukštis 882 mm · Ašių tarpas 800 mm · Šoninis G 1″ · ~178 W/sekc. (ΔT 50K)',
    },
    {
        id: 'GI-RAD-22K-500-800',
        sku: 'GI-RAD-22K-500-800',
        name: 'Plieninis radiatorius Tipas 22 K 500×800 mm (šoninis kairės/dešinės pajungimas 4×G1/2″)',
        title: 'Plieninis radiatorius Tipas 22 K 500×800 mm (šoninis kairės/dešinės pajungimas 4×G1/2″)',
        price: 94.0,
        formattedPrice: '94,00 €',
        url: '/products/POL.%2F80-500',
        slug: 'plieninis-radiatorius-tipas-22-k-500x800',
        image: '/images/products/0381-01.000.webp',
        imageUrl: '/images/products/0381-01.000.webp',
        brandName: 'Gilės Inžinerija',
        brandLogoUrl: '/images/brands/giles-inzinerija.svg',
        category: 'Radiatoriai ir konvektoriai',
        applicationRole: 'Plieninis šoninio pajungimo radiatorius (12–14 m² kambariui)',
        keySpec: 'Tipas 22 K · 500×800 mm · Ašių tarpas 445 mm · ~1340 W (75/65/20 °C)',
    },
    {
        id: 'GI-RAD-22K-500-1000',
        sku: 'GI-RAD-22K-500-1000',
        name: 'Plieninis radiatorius Tipas 22 K 500×1000 mm (šoninis kairės/dešinės pajungimas 4×G1/2″)',
        title: 'Plieninis radiatorius Tipas 22 K 500×1000 mm (šoninis kairės/dešinės pajungimas 4×G1/2″)',
        price: 112.0,
        formattedPrice: '112,00 €',
        url: '/products/POL.%2F80-500',
        slug: 'plieninis-radiatorius-tipas-22-k-500x1000',
        image: '/images/products/0381-01.000.webp',
        imageUrl: '/images/products/0381-01.000.webp',
        brandName: 'Gilės Inžinerija',
        brandLogoUrl: '/images/brands/giles-inzinerija.svg',
        category: 'Radiatoriai ir konvektoriai',
        applicationRole: 'Plieninis šoninio pajungimo radiatorius (15–18 m² kambariui)',
        keySpec: 'Tipas 22 K · 500×1000 mm · Ašių tarpas 445 mm · ~1675 W (75/65/20 °C)',
    },
    {
        id: 'GI-RAD-22K-600-1000',
        sku: 'GI-RAD-22K-600-1000',
        name: 'Plieninis radiatorius Tipas 22 K 600×1000 mm (šoninis kairės/dešinės pajungimas 4×G1/2″)',
        title: 'Plieninis radiatorius Tipas 22 K 600×1000 mm (šoninis kairės/dešinės pajungimas 4×G1/2″)',
        price: 126.0,
        formattedPrice: '126,00 €',
        url: '/products/POL.%2F80-500',
        slug: 'plieninis-radiatorius-tipas-22-k-600x1000',
        image: '/images/products/0381-01.000.webp',
        imageUrl: '/images/products/0381-01.000.webp',
        brandName: 'Gilės Inžinerija',
        brandLogoUrl: '/images/brands/giles-inzinerija.svg',
        category: 'Radiatoriai ir konvektoriai',
        applicationRole: 'Plieninis šoninio pajungimo radiatorius (18–22 m² kambariui)',
        keySpec: 'Tipas 22 K · 600×1000 mm · Ašių tarpas 545 mm · ~1930 W (75/65/20 °C)',
    },
];

export const RADIATOR_LATERAL_VALVE_CATALOG: VytautasProductCard[] = [
    {
        id: '013G0014',
        sku: '013G0014',
        name: 'Danfoss RA-N 15 tiesus termostatinis radiatoriaus vožtuvas DN15 (013G0014)',
        title: 'Danfoss RA-N 15 tiesus termostatinis radiatoriaus vožtuvas DN15 (013G0014)',
        price: 27.95,
        formattedPrice: '27,95 €',
        url: '/products/013G0014',
        slug: 'danfoss-ra-n-15-013g0014',
        image: '/images/products/danfoss-013g0011.webp',
        imageUrl: '/images/products/danfoss-013g0011.webp',
        brandName: 'Danfoss',
        brandLogoUrl: '/images/brands/danfoss.svg',
        category: 'Termostatinės galvutės ir vožtuvai',
        applicationRole: 'Šoniniam radiatoriaus pajungimui (DN15 1/2″)',
        keySpec: 'DN15 (1/2″) · Išankstinis kv nustatymas · RA-Click jungtis',
    },
    {
        id: '3933-02.000',
        sku: '3933-02.000',
        name: 'IMI Heimeier Eclipse DN15 tiesus termostatinis vožtuvas su automatiniu srauto ribotuvu',
        title: 'IMI Heimeier Eclipse DN15 tiesus termostatinis vožtuvas su automatiniu srauto ribotuvu',
        price: 29.89,
        formattedPrice: '29,89 €',
        url: '/products/3933-02.000',
        slug: 'imi-heimeier-eclipse-dn15-3933-02-000',
        image: '/images/products/3933-02.000.webp',
        imageUrl: '/images/products/3933-02.000.webp',
        brandName: 'IMI Heimeier',
        brandLogoUrl: '/images/brands/imi-heimeier.svg',
        category: 'Termostatinės galvutės ir vožtuvai',
        applicationRole: 'Šoniniam pajungimui (DN15 1/2″ AFC)',
        keySpec: 'DN15 (1/2″) · AFC 10–150 l/h · M30×1,5',
    },
    {
        id: '013G2970',
        sku: '013G2970',
        name: 'Danfoss Aero RA 2970 termostatinė galvutė su dujiniu jutikliu (5–21 °C)',
        title: 'Danfoss Aero RA 2970 termostatinė galvutė su dujiniu jutikliu (5–21 °C)',
        price: 24.85,
        formattedPrice: '24,85 €',
        url: '/products/013G2970',
        slug: 'danfoss-ra-2970-013g2970',
        image: '/images/products/013g2970.webp',
        imageUrl: '/images/products/013g2970.webp',
        brandName: 'Danfoss',
        brandLogoUrl: '/images/brands/danfoss.svg',
        category: 'Termostatinės galvutės ir vožtuvai',
        applicationRole: 'Termostatinė galva šoniniam RA-N vožtuvui (RA-Click)',
        keySpec: 'RA-Click jungtis · Dujinis jutiklis · 5–21 °C',
    },
    {
        id: 'GI-FERROLI-001',
        sku: 'GI-FERROLI-001',
        name: 'Ferroli 1″×1/2″ radiatorių kamščių ir perėjimų komplektas su nuorintoju (dešinei ir kairei pusei)',
        title: 'Ferroli 1″×1/2″ radiatorių kamščių ir perėjimų komplektas su nuorintoju (dešinei ir kairei pusei)',
        price: 7.01,
        formattedPrice: '7,01 €',
        url: '/products/GI-FERROLI-001',
        slug: 'ferroli-kamsciu-komplektas-gi-ferroli-001',
        image: '/images/products/0381-01.000.webp',
        imageUrl: '/images/products/0381-01.000.webp',
        brandName: 'Ferroli',
        brandLogoUrl: '/images/brands/ferroli.svg',
        category: 'Radiatoriai ir konvektoriai',
        applicationRole: 'Perėjimų komplektas G 1″ × 1/2″ (2 dešininiai + 2 kairiniai + nuorintojas)',
        keySpec: 'G 1″ × 1/2″ D/K · Su tarpinėmis, akliniu kamščiu ir rankiniu nuorintoju',
    },
];

export const RADIATOR_BOTTOM_VALVE_CATALOG: VytautasProductCard[] = [
    {
        id: '0382-02.000',
        sku: '0382-02.000',
        name: 'IMI Heimeier Vekolux DN15 apatinio pajungimo mazgas („binoklis“ 50 mm, kampinis)',
        title: 'IMI Heimeier Vekolux DN15 apatinio pajungimo mazgas („binoklis“ 50 mm, kampinis)',
        price: 34.12,
        formattedPrice: '34,12 €',
        url: '/products/0382-02.000',
        slug: 'imi-heimeier-vekolux-dn15-0382-02-000',
        image: '/images/products/0382-02.000.webp',
        imageUrl: '/images/products/0382-02.000.webp',
        brandName: 'IMI Heimeier',
        brandLogoUrl: '/images/brands/imi-heimeier.svg',
        category: 'Termostatinės galvutės ir vožtuvai',
        applicationRole: 'Apatiniam VK pajungimui (50 mm H-blokas)',
        keySpec: 'Tarpcentris 50 mm · Rp 1/2″ / G 3/4″ Eurokonus',
    },
    {
        id: '9690-27.000',
        sku: '9690-27.000',
        name: 'IMI Heimeier Multilux 4 apatinio pajungimo rinkinys su termostatine galvute (50 mm)',
        title: 'IMI Heimeier Multilux 4 apatinio pajungimo rinkinys su termostatine galvute (50 mm)',
        price: 84.24,
        formattedPrice: '84,24 €',
        url: '/products/9690-27.000',
        slug: 'imi-heimeier-multilux-4-9690-27-000',
        image: '/images/products/0382-02.000.webp',
        imageUrl: '/images/products/0382-02.000.webp',
        brandName: 'IMI Heimeier',
        brandLogoUrl: '/images/brands/imi-heimeier.svg',
        category: 'Termostatinės galvutės ir vožtuvai',
        applicationRole: 'Apatinio pajungimo mazgas su dekoratyviniu dangteliu ir galva',
        keySpec: 'Tarpcentris 50 mm · M30×1,5 · Dvivamzdei ir vienvamzdei sistemai',
    },
];

/**
 * Normalizes Lithuanian diacritics and common HVAC user typos so search and intent matching are fault-tolerant.
 */
export function normalizeLtText(input: string): string {
    return (input || '')
        .toLowerCase()
        .replace(/ą/g, 'a')
        .replace(/č/g, 'c')
        .replace(/ę/g, 'e')
        .replace(/ė/g, 'e')
        .replace(/į/g, 'i')
        .replace(/š/g, 's')
        .replace(/ų/g, 'u')
        .replace(/ū/g, 'u')
        .replace(/ž/g, 'z')
        .replace(/\bpaungim/g, 'pajungim')
        .replace(/\bpajungmas\b/g, 'pajungimas')
        .replace(/\bradiatoriu\b/g, 'radiatorius')
        .replace(/\bradiatoria\b/g, 'radiatorius')
        .replace(/\bsoninio\b/g, 'soninis')
        .replace(/\bis sono\b/g, 'soninis')
        .replace(/\bdesines\b/g, 'desine')
        .replace(/\bkaires\b/g, 'kaire')
        .replace(/\bpacio\b/g, 'paties')
        .replace(/\bpatys\b/g, 'paties');
}

const KNOWN_BRANDS: Array<{ pattern: RegExp; canonical: string }> = [
    { pattern: /\bhaier\b/i, canonical: 'Haier' },
    { pattern: /\bferroli\b/i, canonical: 'Ferroli' },
    { pattern: /\bdanfoss\b/i, canonical: 'Danfoss' },
    { pattern: /\bheimeier\b/i, canonical: 'IMI Heimeier' },
    { pattern: /\bherz\b/i, canonical: 'HERZ' },
    { pattern: /\bgorenje\b/i, canonical: 'Gorenje' },
    { pattern: /\btiki\b/i, canonical: 'Tiki' },
    { pattern: /\bdrazice|dražice\b/i, canonical: 'Dražice' },
    { pattern: /\bmegatherm\b/i, canonical: 'Megatherm' },
    { pattern: /\bverner\b/i, canonical: 'Verner' },
    { pattern: /\bponast\b/i, canonical: 'Ponast' },
    { pattern: /\bthermostal\b/i, canonical: 'Thermostal' },
    { pattern: /\bgrundfos\b/i, canonical: 'Grundfos' },
    { pattern: /\bwilo\b/i, canonical: 'Wilo' },
    { pattern: /\bflamco\b/i, canonical: 'Flamco' },
    { pattern: /\breflex\b/i, canonical: 'Reflex' },
    { pattern: /\besbe\b/i, canonical: 'ESBE' },
    { pattern: /\bcomisa\b/i, canonical: 'Comisa' },
    { pattern: /\bviessmann\b/i, canonical: 'Viessmann' },
    { pattern: /\bbuderus\b/i, canonical: 'Buderus' },
    { pattern: /\bcentrometal\b/i, canonical: 'Centrometal' },
    { pattern: /\bpelltech\b/i, canonical: 'Pelltech' },
    { pattern: /\bpneumatex\b/i, canonical: 'IMI Pneumatex' },
    { pattern: /\bwatts\b/i, canonical: 'Watts' },
];

function mapDomainToNode(domain: VytautasDomain): { nodeCategory: VytautasNodeCategory; nodeLabel: string } {
    switch (domain) {
        case 'radiators':
        case 'valves_thermostats':
            return { nodeCategory: 'radiator', nodeLabel: 'Radiatorinis šildymas ir termostatika' };
        case 'boilers':
        case 'heat_pumps':
            return { nodeCategory: 'boiler_heat', nodeLabel: 'Katilinė ir šildymo katilai' };
        case 'pellet_burners':
        case 'spare_parts':
            return { nodeCategory: 'burner', nodeLabel: 'Granulių degikliai ir automatika' };
        case 'tanks_boilers':
            return { nodeCategory: 'water_heater', nodeLabel: 'Vandens šildytuvai (boileriai) ir talpos' };
        case 'underfloor':
            return { nodeCategory: 'underfloor', nodeLabel: 'Grindinis šildymas ir kolektoriai' };
        case 'pumps_hydraulics':
            return { nodeCategory: 'pump', nodeLabel: 'Siurbliai ir cirkuliacija' };
        case 'expansion_air':
            return { nodeCategory: 'expansion_safety', nodeLabel: 'Plėtimosi indai ir apsauga' };
        default:
            return { nodeCategory: 'general', nodeLabel: 'ŠVOK mazgo diagnostika' };
    }
}

export function detectDomainFromText(rawText: string): VytautasDomain {
    const norm = normalizeLtText(rawText);
    if (
        /\b(atsargines dalys|atsargine dalis|ardiklis|tarpine|daviklis|uzdegimo tenas|tenas|fotoelementas|fotosensorius)\b/.test(
            norm,
        )
    ) {
        return 'spare_parts';
    }
    if (
        /\b(radiator\w*|sekcijin\w*|pol\.|tipas 22|konvektor\w*)\b/.test(norm) ||
        /\b(sonin\w*|apatin\w*|vk\s*50|h-blok\w*|binokl\w*|vekolux|multilux)\b/.test(norm)
    ) {
        return 'radiators';
    }
    if (
        /\b(silumos siurbl\w*|oras vanduo|oras-vanduo|oras–vanduo|monoblok\w*|haier.*kw|r290|r32|au082|aw082)\b/.test(
            norm,
        )
    ) {
        return 'heat_pumps';
    }
    if (/\b(degikl\w*|mpb|pelltech|pv20\w*|megatherm|granuliu bunker\w*|sraigtas)\b/.test(norm)) {
        return 'pellet_burners';
    }
    if (
        /\b(boiler\w*|vandens sildytuv\w*|akumuliacin\w*|talp\w*|drazice|okc\w*|gorenje|zv\s*\d+|tiki)\b/.test(
            norm,
        )
    ) {
        return 'tanks_boilers';
    }
    if (/\b(grindin\w*|kolektori\w*|dynacon|eurokonus|pavar\w*|kontur\w*)\b/.test(norm)) {
        return 'underfloor';
    }
    if (/\b(pletimosi|issipleto\w*|statico|aquapresso|zeparo|nuorintuv\w*|apsaugos grup\w*|ksg)\b/.test(norm)) {
        return 'expansion_air';
    }
    if (/\b(cirkuliacin\w*|siurbl\w*|grundfos|wilo|alpha2|yonos|pamaisymo voztuv\w*|3 eigu|teplomix|esbe)\b/.test(norm)) {
        return 'pumps_hydraulics';
    }
    if (/\b(termostatin\w*.*galv\w*|termostatin\w*.*voztuv\w*|ra-n|ra-g|eclipse|013g\w*)\b/.test(norm)) {
        return 'valves_thermostats';
    }
    if (/\b(katil\w*|katri\w*|centrometal|viessmann|vitodens|buderus|verner|ponast|thermostal|kieto kuro)\b/.test(norm)) {
        return 'boilers';
    }
    return 'general';
}

/**
 * Multi-Turn Dialogue State & Constraint Extraction (`extractConversationState(messages)`):
 * Parses the entire `messages` array (both user and assistant turns) to accumulate and update
 * structured engineering constraints without losing context across turns.
 */
export function extractConversationState(
    messages: Array<{ role: 'user' | 'assistant' | string; content: string }>,
): VytautasConversationState {
    const cleanMessages = (messages || []).filter(
        (m) => m && typeof m.content === 'string' && m.content.trim().length > 0,
    );
    const userMessages = cleanMessages.filter((m) => m.role === 'user');
    const lastUserMessage =
        userMessages.length > 0
            ? userMessages[userMessages.length - 1]!.content.trim()
            : cleanMessages[cleanMessages.length - 1]?.content.trim() || '';
    const normalizedLastUserMessage = normalizeLtText(lastUserMessage);
    const combinedUserText = userMessages.map((m) => m.content.trim()).join(' ');
    const allTurnsText = cleanMessages.map((m) => m.content.trim()).join(' ');

    let domain: VytautasDomain = 'general';
    let connectionSide: VytautasConnectionSide = null;
    let connectionHand: VytautasConnectionHand = null;
    let focusFilter: VytautasFocusFilter = 'complete_kit';
    let areaM2: number | null = null;
    let powerKw: number | null = null;
    let heightMm: number | null = null;
    let volumeL: number | null = null;
    let loopCount: number | null = null;
    let brandFilter: string | null = null;

    // Accumulate turn by turn (preferring user turns for constraint commitments, assistant turns for domain continuity)
    for (const msg of cleanMessages) {
        const isUser = msg.role === 'user';
        const raw = msg.content;
        const norm = normalizeLtText(raw);

        const detectedDom = detectDomainFromText(raw);
        if (detectedDom !== 'general') {
            if (isUser || domain === 'general') {
                // Keep radiators domain if user previously asked for radiators and now mentions lateral/bottom valve or main units
                if (domain === 'radiators' && detectedDom === 'valves_thermostats') {
                    domain = 'radiators';
                } else {
                    domain = detectedDom;
                }
            }
        }

        if (isUser) {
            // Connection side detection (lateral vs bottom)
            if (
                /\b(sonin\w*|is sono|kaire\w*.*pus\w*|desine\w*.*pus\w*|dn\s*15|1\/2)\b/.test(norm) &&
                !/\b(apatin\w*|vk\s*50|h-blok\w*|binokl\w*|vekolux|multilux)\b/.test(norm)
            ) {
                connectionSide = 'lateral';
            } else if (/\b(apatin\w*|is apacios|vk\s*50|50\s*mm|h-blok\w*|binokl\w*|vekolux|multilux)\b/.test(norm)) {
                connectionSide = 'bottom';
            }

            // Connection hand detection (right vs left)
            if (/\b(desin\w*|is desines|desine\w* pus\w*)\b/.test(norm)) {
                connectionHand = 'right';
                if (!connectionSide && /\b(son\w*|pus\w*)\b/.test(norm)) {
                    connectionSide = 'lateral';
                }
            } else if (/\b(kair\w*|is kaires|kaire\w* pus\w*)\b/.test(norm)) {
                connectionHand = 'left';
                if (!connectionSide && /\b(son\w*|pus\w*)\b/.test(norm)) {
                    connectionSide = 'lateral';
                }
            }

            // Focus filter detection
            if (
                /\b(kur patys|kur paties|o tai kur|rodyk tik|tik radiator\w*|reikia paties radiator\w*|reikia pacio radiator\w*|kur katil\w*|rodyk tik katil\w*|kur boiler\w*|rodyk tik boiler\w*|patys radiator\w*|pacius radiator\w*|tik silumos siurbl\w*|tik degikl\w*)\b/.test(
                    norm,
                )
            ) {
                focusFilter = 'main_units_only';
            } else if (
                /\b(tik voztuv\w*|tik galvut\w*|tik pried\w*|tik armatur\w*|tik pajungim\w*)\b/.test(norm) &&
                !/\bradiator\w*\b/.test(norm)
            ) {
                focusFilter = 'accessories_only';
            } else if (/\b(su priedais|pilnam sumontavimui|pilnas komplektas|su voztuvais)\b/.test(norm)) {
                focusFilter = 'complete_kit';
            }

            // Area m2
            const areaMatch = norm.match(/\b(\d{1,4})\s*(?:m2|m²|kv\.?\s*m|kvadrat|kv\b)/i);
            if (areaMatch) {
                areaM2 = Number(areaMatch[1]);
            }

            // Power kW
            const kwMatch = norm.match(/\b(\d{1,3}(?:[.,]\d+)?)\s*kw\b/i);
            if (kwMatch) {
                powerKw = Number(kwMatch[1]!.replace(',', '.'));
            }

            // Height mm
            const mmMatch = norm.match(/\b(200|300|350|500|600|700|800|900)\s*(?:mm|aukscio|tarpcentr)?\b/i);
            if (mmMatch) {
                const candidateMm = Number(mmMatch[1]);
                if (
                    raw.toLowerCase().includes('mm') ||
                    domain === 'radiators' ||
                    detectedDom === 'radiators'
                ) {
                    heightMm = candidateMm;
                }
            }

            // Volume L
            const lMatch = norm.match(/\b(50|80|100|120|125|150|160|200|250|300|460|500|800|1000)\s*(?:l|ltr|litr)\b/i);
            if (lMatch) {
                volumeL = Number(lMatch[1]);
            } else if (domain === 'tanks_boilers' || detectedDom === 'tanks_boilers') {
                const tankModelVol = norm.match(/\b(?:zv|okc)\s*(100|125|160|200|250|300|500|800|1000)\b/i);
                if (tankModelVol) {
                    volumeL = Number(tankModelVol[1]);
                }
            }

            // Underfloor loops
            const loopMatch = norm.match(/\b(\d{1,2})\s*(?:kontur|sak|zied)\w*/i);
            if (loopMatch) {
                loopCount = Number(loopMatch[1]);
            }

            // Brand filter
            for (const b of KNOWN_BRANDS) {
                if (b.pattern.test(raw) || b.pattern.test(norm)) {
                    brandFilter = b.canonical;
                    break;
                }
            }
        }
    }

    if (domain === 'general') {
        domain = detectDomainFromText(allTurnsText);
    }

    const { nodeCategory, nodeLabel } = mapDomainToNode(domain);

    // Build human-readable summaries without robotic placeholders
    const powerParts: string[] = [];
    if (areaM2 != null) powerParts.push(`${areaM2} m²`);
    if (powerKw != null) powerParts.push(`${powerKw} kW`);
    if (heightMm != null) powerParts.push(`${heightMm} mm aukštis`);
    if (volumeL != null) powerParts.push(`${volumeL} L talpa`);
    if (loopCount != null) powerParts.push(`${loopCount} kontūrai`);

    const defaultPowerSummaryByDomain: Record<VytautasDomain, string> = {
        radiators: 'Standartinis ~100 W/m² (350–800 mm aukščiai)',
        boilers: areaM2 ? `${areaM2} m² (~${Math.max(12, Math.round(areaM2 * 0.12))} kW)` : '15–35 kW individualiam namui',
        heat_pumps: '6–16 kW oras–vanduo monoblokas',
        pellet_burners: '15–35 kW automatinis granulių degiklis',
        tanks_boilers: '160–300 L greitaeigis / akumuliacinis tūris',
        underfloor: '2–12 kontūrų kolektorinis mazgas',
        valves_thermostats: 'DN15 (1/2″) srauto reguliavimas',
        pumps_hydraulics: 'DN25 cirkuliacijos ir pamaišymo mazgas',
        expansion_air: '18–35 L slėgio kompensavimo mazgas',
        spare_parts: 'Originalus OEM mazgo komponentas',
        general: 'Pagal patalpos plotą (m²) ir šiluminę galią (kW)',
    };

    const powerOrAreaSummary =
        powerParts.length > 0 ? powerParts.join(' · ') : defaultPowerSummaryByDomain[domain];

    const connParts: string[] = [];
    if (connectionSide === 'lateral') {
        const handText =
            connectionHand === 'right'
                ? ' iš dešinės pusės (G 1″×1/2″ D)'
                : connectionHand === 'left'
                  ? ' iš kairės pusės (G 1″×1/2″ K)'
                  : ' (DN15 1/2″)';
        connParts.push(`Šoninis pajungimas${handText}`);
    } else if (connectionSide === 'bottom') {
        connParts.push('Apatinis VK pajungimas (50 mm H-blokas)');
    }

    if (brandFilter) {
        connParts.push(`Gamintojas: ${brandFilter}`);
    }
    if (focusFilter === 'main_units_only') {
        connParts.push('Tik pagrindiniai įrenginiai');
    }

    const defaultConnSummaryByDomain: Record<VytautasDomain, string> = {
        radiators: 'Šoninis DN15 (1/2″) arba apatinis VK 50 mm',
        boilers: 'Kietas kuras / medienos granulės + grįžtamo srauto apsauga',
        heat_pumps: 'Monoblokas R290/R32 + buferinė talpa',
        pellet_burners: 'Automatinis uždegimas + padavimo sraigtas',
        tanks_boilers: 'Padidinto ploto šilumokaitis / akumuliacija',
        underfloor: 'G 3/4″ Eurokonus (16×2,0 mm vamzdžiui)',
        valves_thermostats: 'RA-Click / M30×1,5 termostatika',
        pumps_hydraulics: 'Trijų eigų pamaišymas ir elektroninis siurblys',
        expansion_air: 'PN3 šildymui (Statico) / PN10 geriamam vandeniui (Aquapresso)',
        spare_parts: 'Tiesioginis keitimas pagal serijos kodą',
        general: 'Suderinama srieginė jungtis (DN15–DN32)',
    };

    const connectionOrTypeSummary =
        connParts.length > 0 ? connParts.join(' · ') : defaultConnSummaryByDomain[domain];

    return {
        domain,
        nodeCategory,
        nodeLabel,
        connectionSide,
        connectionHand,
        focusFilter,
        areaM2,
        powerKw,
        heightMm,
        volumeL,
        loopCount,
        brandFilter,
        turnCount: cleanMessages.length,
        userTurnsCount: userMessages.length,
        lastUserMessage,
        normalizedLastUserMessage,
        combinedUserText,
        powerOrAreaSummary,
        connectionOrTypeSummary,
    };
}

function isSparePartItem(title: string, category: string, price: number): boolean {
    const norm = normalizeLtText(`${title} ${category}`);
    if (
        /\b(tarpine|nipelis|akle|kamstis|laikiklis|adapteris|rankenele|raktas|daviklis|tenas|ardiklis|apsauga nuo vagystes|panardinama ivore|antgalis)\b/.test(
            norm,
        )
    ) {
        return true;
    }
    if (price > 0 && price < 8 && !/\bradiatorius\b/.test(norm)) {
        return true;
    }
    return false;
}

/**
 * Full Catalog Hybrid Search (BM25 + Spec/SKU/Brand/Category Scorer across all 6,337+ SKUs).
 */
export function searchCatalogHybrid(
    query: string,
    options?: {
        domain?: VytautasDomain;
        brandFilter?: string | null;
        focusFilter?: VytautasFocusFilter;
        connectionSide?: VytautasConnectionSide;
        limit?: number;
    },
): VytautasProductCard[] {
    const snap = getGilesCatalogSnapshot();
    const limit = options?.limit ?? 8;
    const rawQuery = (query || '').trim();
    const normQuery = normalizeLtText(rawQuery);
    const codeClean = rawQuery.toLowerCase().replace(/[^a-z0-9]/g, '');

    const stopWords = new Set([
        'man', 'reikia', 'ieskau', 'ka', 'rekomenduojate', 'issirinkti', 'ir', 'su', 'ar',
        'kad', 'kaip', 'gerai', 'as', 'noriu', 'apie', 'koks', 'kokia', 'kokie', 'kuris',
        'pilnam', 'sumontavimui', 'priedai', 'butini', 'kazkokiu', 'tai', 'kur', 'patys',
        'paties', 'rodyk', 'tik', 'is', 'puses',
    ]);

    const rawTokens = normQuery
        .replace(/[^a-z0-9.]/g, ' ')
        .split(/\s+/)
        .map((t) => t.trim())
        .filter((t) => t.length >= 2 && !stopWords.has(t));

    // Expand stems & synonyms
    const expandedTokens = new Set<string>(rawTokens);
    for (const tok of rawTokens) {
        if (tok.startsWith('radiator')) {
            expandedTokens.add('radiator');
            expandedTokens.add('pol');
        }
        if (tok.startsWith('degikl')) {
            expandedTokens.add('degikl');
            expandedTokens.add('mpb');
            expandedTokens.add('pv20');
        }
        if (tok.startsWith('katil')) {
            expandedTokens.add('katil');
        }
        if (tok.startsWith('boiler') || tok.startsWith('talp')) {
            expandedTokens.add('boiler');
            expandedTokens.add('talp');
            expandedTokens.add('okc');
            expandedTokens.add('zv');
        }
        if (tok.startsWith('kolektor')) {
            expandedTokens.add('kolektor');
        }
        if (tok.startsWith('siurbl')) {
            expandedTokens.add('siurbl');
        }
        if (tok.startsWith('voztuv')) {
            expandedTokens.add('voztuv');
            expandedTokens.add('ventil');
        }
        if (tok.startsWith('pletim') || tok.startsWith('issiple')) {
            expandedTokens.add('pletim');
            expandedTokens.add('statico');
            expandedTokens.add('aquapresso');
        }
    }

    const tokenList = Array.from(expandedTokens);
    const wantsSpareParts =
        options?.domain === 'spare_parts' ||
        /\b(atsargin|tenas|tarpine|ardiklis|daviklis|nipelis|akle|laikiklis)\b/.test(normQuery);

    const scored: Array<{ card: VytautasProductCard; score: number }> = [];

    for (const item of snap.products) {
        const skuLow = (item.sku || '').toLowerCase();
        const skuAlphaNum = skuLow.replace(/[^a-z0-9]/g, '');
        const title = item.nameLt || item.name || '';
        const brand = item.brandName || 'Gilės Inžinerija';
        const category = item.categoryName || 'ŠVOK įranga';
        const normDoc = normalizeLtText(`${item.sku} ${title} ${brand} ${category}`);

        let score = 0;

        // 1. Exact or prefix SKU match
        if (codeClean.length >= 4 && skuAlphaNum === codeClean) {
            score += 250;
        } else if (codeClean.length >= 4 && skuAlphaNum.includes(codeClean)) {
            score += 120;
        }

        // 2. Brand filter match
        if (options?.brandFilter) {
            const normBrandFilter = normalizeLtText(options.brandFilter);
            if (normalizeLtText(brand).includes(normBrandFilter) || normDoc.includes(normBrandFilter)) {
                score += 45;
            }
        }

        // 3. Token BM25-like lexical scoring
        let matchedTokenCount = 0;
        for (const tok of tokenList) {
            if (skuLow.includes(tok)) {
                score += 35;
                matchedTokenCount++;
            } else if (normDoc.includes(tok)) {
                score += 18;
                matchedTokenCount++;
            }
        }
        if (matchedTokenCount >= 2) {
            score += matchedTokenCount * 10;
        }

        if (score <= 0) continue;

        // 4. Connection side compatibility guard for radiators
        if (options?.connectionSide === 'lateral') {
            if (/\b(vekolux|vekotec|apatinio|0382-02|053[0-7]-50|055[0-3]-50|vk\s*50)\b/.test(normDoc)) {
                continue; // Strictly exclude bottom connection valves when lateral is requested
            }
        }

        // 5. Focus filter & main unit vs spare part ranking
        const isSpare = isSparePartItem(title, category, item.price);
        if (wantsSpareParts) {
            if (isSpare) score += 40;
        } else {
            if (isSpare) score -= 35;
            if (item.price >= 12) score += 10;
        }

        if (options?.focusFilter === 'main_units_only') {
            if (options.domain === 'radiators' && !/\b(radiator\w*|pol\.)\b/.test(normDoc)) {
                continue;
            }
            if (
                options.domain === 'boilers' &&
                (/\b(voztuv\w*|siurbl\w*|indas|apsaugos grup\w*|kamin\w*|talp\w*|sraigt\w*)\b/.test(normDoc) ||
                    !/\b(katil\w*|eko-ck|vitodens|logano)\b/.test(normDoc))
            ) {
                continue;
            }
        }

        const brandLogo = resolveBrandLogo(brand, `${item.sku} ${title}`).logoPath;
        scored.push({
            score,
            card: {
                id: item.id,
                sku: item.sku,
                name: title,
                title,
                price: item.price,
                formattedPrice: `${item.price.toFixed(2).replace('.', ',')} €`,
                url: `/products/${encodeURIComponent(item.sku)}`,
                slug: item.slug ?? undefined,
                image: item.imageUrl || '/images/products/family-ferroli-boiler.webp',
                imageUrl: item.imageUrl || '/images/products/family-ferroli-boiler.webp',
                brandName: brand,
                brandLogoUrl: brandLogo,
                category,
                applicationRole: category,
                keySpec: `SKU: ${item.sku} · ${brand}`,
            },
        });
    }

    scored.sort((a, b) => b.score - a.score);

    const unique: VytautasProductCard[] = [];
    const seen = new Set<string>();
    for (const entry of scored) {
        const key = (entry.card.sku || entry.card.id).toLowerCase();
        if (!seen.has(key)) {
            seen.add(key);
            unique.push(entry.card);
            if (unique.length >= limit) break;
        }
    }

    return unique;
}

/**
 * Selects domain-accurate, strictly compatible product cards for the current conversation state.
 */
export function selectProductsForConversationState(
    state: VytautasConversationState,
    fallbackCandidates: VytautasProductCard[] = [],
): VytautasProductCard[] {
    if (state.domain === 'radiators') {
        // Filter main radiators by height if specified
        const matchingMainRadiators = state.heightMm
            ? RADIATOR_MAIN_UNIT_CATALOG.filter((r) =>
                  `${r.sku} ${r.name} ${r.keySpec}`.includes(String(state.heightMm)),
              )
            : RADIATOR_MAIN_UNIT_CATALOG;
        const radiatorPool =
            matchingMainRadiators.length >= 2 ? matchingMainRadiators : RADIATOR_MAIN_UNIT_CATALOG;

        if (state.focusFilter === 'main_units_only') {
            return radiatorPool.slice(0, 4);
        }

        if (state.connectionSide === 'lateral') {
            // Show actual radiators FIRST (at least 2 real radiator models), followed ONLY by lateral DN15 valves/head
            return [
                radiatorPool[0]!, // Ferroli POL 500
                radiatorPool[4] || radiatorPool[1]!, // Plieninis Tipas 22 K 500x800 or Ferroli POL 350
                RADIATOR_LATERAL_VALVE_CATALOG[0]!, // Danfoss RA-N 15 (013G0014)
                RADIATOR_LATERAL_VALVE_CATALOG[2]!, // Danfoss Aero RA 2970 (013G2970)
            ];
        }

        if (state.connectionSide === 'bottom') {
            return [
                radiatorPool[4] || radiatorPool[0]!,
                radiatorPool[5] || radiatorPool[2]!,
                RADIATOR_BOTTOM_VALVE_CATALOG[0]!,
                RADIATOR_LATERAL_VALVE_CATALOG[2]!,
            ];
        }

        // General radiator kit when side is not locked yet
        return [
            radiatorPool[0]!,
            radiatorPool[1]!,
            RADIATOR_LATERAL_VALVE_CATALOG[0]!,
            RADIATOR_LATERAL_VALVE_CATALOG[2]!,
        ];
    }

    const hybridHits = searchCatalogHybrid(
        `${state.brandFilter || ''} ${state.lastUserMessage} ${state.combinedUserText}`.trim(),
        {
            domain: state.domain,
            brandFilter: state.brandFilter,
            focusFilter: state.focusFilter,
            connectionSide: state.connectionSide,
            limit: 6,
        },
    );

    const merged: VytautasProductCard[] = [];
    const seen = new Set<string>();

    const pushCard = (c: VytautasProductCard) => {
        const key = (c.sku || c.id).toLowerCase();
        if (seen.has(key) || merged.length >= 4) return;
        if (state.connectionSide === 'lateral' && /vekolux|0382-02\.000|vk\s*50|apatinio/i.test(`${c.sku} ${c.name} ${c.applicationRole}`)) {
            return;
        }
        if (state.focusFilter === 'main_units_only') {
            if (state.domain === 'boilers' && /vožtuvas|siurblys|indas|apsaugos grupė|Teplomix|KSG|Statico/i.test(`${c.name} ${c.category}`)) {
                return;
            }
        }
        seen.add(key);
        merged.push(c);
    };

    for (const c of fallbackCandidates) pushCard(c);
    for (const c of hybridHits) pushCard(c);

    // Domain-specific guaranteed main units when focusFilter === 'main_units_only' on boilers
    if (state.domain === 'boilers' && state.focusFilter === 'main_units_only' && merged.length < 3) {
        const guaranteedBoilers: VytautasProductCard[] = [
            {
                id: '72a75477-ea91-5b77-a6f9-17fb0786f5f0',
                sku: 'KaTRI3850020',
                name: 'Plieninis kieto kuro ir granulių šildymo katilas KaTRI 25 kW su 3 eigų šilumokaičiu',
                title: 'Plieninis kieto kuro ir granulių šildymo katilas KaTRI 25 kW su 3 eigų šilumokaičiu',
                price: 1750.0,
                formattedPrice: '1750,00 €',
                url: '/products/KaTRI3850020',
                image: '/images/products/egip-katri3850020.webp',
                imageUrl: '/images/products/egip-katri3850020.webp',
                brandName: 'Gilės Inžinerija',
                brandLogoUrl: '/images/brands/giles-inzinerija.svg',
                category: 'Šildymo katilai ir krosnelės',
                applicationRole: 'Kieto kuro / granulių katilas (120–220 m²)',
                keySpec: '25 kW · P265GH 5–6 mm plienas',
            },
            {
                id: '7e6aedf0-476e-5265-a1e1-a6f177e1247c',
                sku: '17526',
                name: 'Centrometal EKO-CK P 25 kW plieninis kieto kuro katilas (paruoštas granulių degikliui)',
                title: 'Centrometal EKO-CK P 25 kW plieninis kieto kuro katilas (paruoštas granulių degikliui)',
                price: 1390.1,
                formattedPrice: '1390,10 €',
                url: '/products/17526',
                image: '/images/products/giles-eko-ck-p-14-110-kw-gi1-a9b6ef59.webp',
                imageUrl: '/images/products/giles-eko-ck-p-14-110-kw-gi1-a9b6ef59.webp',
                brandName: 'Centrometal',
                brandLogoUrl: '/images/brands/centrometal.svg',
                category: 'Šildymo katilai ir krosnelės',
                applicationRole: 'Katilas malkoms / granulėms',
                keySpec: '25 kW · EN 303-5 · Didelė pakura',
            },
            {
                id: 'bdc4e5f7-ec50-5a68-8543-1f51ce16f58f',
                sku: 'B1HC232',
                name: 'Viessmann Vitodens 100-W dujinis kondensacinis katilas 6,5–26 kW',
                title: 'Viessmann Vitodens 100-W dujinis kondensacinis katilas 6,5–26 kW',
                price: 1818.63,
                formattedPrice: '1818,63 €',
                url: '/products/B1HC232',
                image: '/images/products/giles-b1hc232-4a7fbc7a.webp',
                imageUrl: '/images/products/giles-b1hc232-4a7fbc7a.webp',
                brandName: 'Viessmann',
                brandLogoUrl: '/images/brands/viessmann.svg',
                category: 'Šildymo katilai ir krosnelės',
                applicationRole: 'Dujinis kondensacinis katilas',
                keySpec: '6,5–26 kW · Inox-Radial',
            },
        ];
        for (const b of guaranteedBoilers) pushCard(b);
    }

    return merged.slice(0, 4);
}

/**
 * Generates natural, non-repetitive, context-aware engineering responses in LT, EN, PL, RU.
 */
export function buildContextualEngineeringReply(
    state: VytautasConversationState,
    products: VytautasProductCard[],
    locale: 'lt' | 'en' | 'pl' | 'ru' = 'lt',
): { stage: VytautasStage; reply: string; quickReplies: string[] } {
    // 1. Radiators domain
    if (state.domain === 'radiators') {
        // Case A: User asks "o tai kur patys radiatoriai ?" or focusFilter === 'main_units_only'
        if (state.focusFilter === 'main_units_only') {
            const handPhraseLt =
                state.connectionHand === 'right'
                    ? 'iš dešinės pusės (šoniniu būdu)'
                    : state.connectionHand === 'left'
                      ? 'iš kairės pusės (šoniniu būdu)'
                      : 'šoniniu arba apatiniu būdu';

            const areaCalcLt = state.areaM2
                ? `Jūsų ${state.areaM2} m² patalpai (skaičiuojant ~100 W/m² šilumos poreikį, t. y. ~${(state.areaM2 * 0.1).toFixed(1).replace('.', ',')} kW) tinka **${Math.max(4, Math.ceil((state.areaM2 * 100) / 119))} sekcijų Ferroli POL 500** arba plieninis **Tipas 22 K 500×1000 mm** radiatorius.`
                : 'Skaičiuokite pagal normą `~100 W/m²`: pavyzdžiui, `12 m²` kambariui reikia `10 sekcijų Ferroli POL 500 (~1,19 kW)` arba plieninio `Tipas 22 K 500×800 mm (~1,34 kW)`, o `18 m²` kambariui – `15 sekcijų POL 500 (~1,78 kW)` arba `Tipas 22 K 500×1000 mm (~1,68 kW)`.';

            if (locale === 'en') {
                return {
                    stage: 'recommendation',
                    reply: `Apologies for listing too many fittings earlier – here are the actual radiators suitable for ${state.connectionHand === 'right' ? 'right-hand lateral' : 'lateral'} connection: sectional aluminium **Ferroli POL 350 / 500 / 600 / 800** (` +
                        '`88–178 W/section`) and steel panel **Type 22 K 500×800 / 500×1000 / 600×1000 mm** (`1.34–1.93 kW`). Size at `~100 W/m²` (e.g., 10 sections of POL 500 for a 12 m² room). Which room area (m²) and window sill height (mm) are we fitting?',
                    quickReplies: [
                        '12 m² room – 10 sections Ferroli POL 500',
                        '18 m² room – Type 22 K 500×1000 mm',
                        'Add right-hand 1"×1/2" adapter plug kit',
                    ],
                };
            }
            if (locale === 'pl') {
                return {
                    stage: 'recommendation',
                    reply: `Przepraszam za nadmiar armatury – oto same grzejniki do podłączenia bocznego (${state.connectionHand === 'right' ? 'z prawej strony' : 'uniwersalne lewe/prawe'}): aluminiowe członowe **Ferroli POL 350 / 500 / 600 / 800** (\`88–178 W/człon\`) oraz stalowe płytowe **Typ 22 K 500×800 / 500×1000 / 600×1000 mm**. Dobieramy wg normy \`~100 W/m²\` (np. na 12 m² potrzeba 10 członów Ferroli POL 500 ~1,19 kW). Jaka jest powierzchnia pokoju (m²)?`,
                    quickReplies: [
                        'Pokój 12 m² – 10 członów Ferroli POL 500',
                        'Pokój 18 m² – Typ 22 K 500×1000 mm',
                        'Dodaj komplet korków redukcyjnych 1"×1/2"',
                    ],
                };
            }
            if (locale === 'ru') {
                return {
                    stage: 'recommendation',
                    reply: `Извините за избыток арматуры – вот именно сами радиаторы для бокового подключения (${state.connectionHand === 'right' ? 'с правой стороны' : 'универсальные левые/правые'}): секционные алюминиевые **Ferroli POL 350 / 500 / 600 / 800** (\`88–178 Вт/секц.\`) и стальные панельные **Тип 22 K 500×800 / 500×1000 / 600×1000 мм**. Расчет по норме \`~100 Вт/м²\` (для 12 м² нужно 10 секций Ferroli POL 500 ~1,19 кВт). Какая площадь комнаты (м²)?`,
                    quickReplies: [
                        'Комната 12 м² – 10 секций Ferroli POL 500',
                        'Комната 18 м² – Тип 22 K 500×1000 мм',
                        'Добавить комплект переходников 1"×1/2"',
                    ],
                };
            }

            return {
                stage: 'recommendation',
                reply:
                    `Atsiprašau už priedų perteklių – štai būtent patys radiatoriai, kuriuos galite jungti ${handPhraseLt}: sekcijiniai aliumininiai **Ferroli POL 350** (\`88 W/sekc.\`), **Ferroli POL 500** (\`119 W/sekc.\`, SKU \`POL./80-500\`), **Ferroli POL 600** (\`142 W/sekc.\`), **Ferroli POL 800** (\`178 W/sekc.\`) bei plieniniai šoninio pajungimo **Tipas 22 K 500×800 / 500×1000 / 600×1000 mm**. ` +
                    `${areaCalcLt} Kurį aukštį (350, 500 ar 600 mm) ir kelių m² kambariui skaičiuojame?`,
                quickReplies: [
                    '12 m² kambariui (10 sekcijų Ferroli POL 500)',
                    '18 m² kambariui (Plieninis Tipas 22 K 500×1000)',
                    'Žemai palangei (Ferroli POL 350 mm)',
                ],
            };
        }

        // Case B: Lateral connection specified (e.g. "soninio radiatoriaus reikia paungimas is sono desines puses")
        if (state.connectionSide === 'lateral') {
            const handDetailLt =
                state.connectionHand === 'right'
                    ? 'dešiniam šoniniam pajungimui iš dešinės pusės įsukami **dešininio sriegio (`G 1" × 1/2" D`, SKU `GI-FERROLI-008` / komplektas `GI-FERROLI-001`) perėjimai**, o iš kairės pusės – aklinis kamštis ir nuorintojas'
                    : state.connectionHand === 'left'
                      ? 'kairiniam šoniniam pajungimui iš kairės pusės įsukami **kairinio sriegio (`G 1" × 1/2" K`, SKU `GI-FERROLI-007` / komplektas `GI-FERROLI-001`) perėjimai**, o iš dešinės pusės – aklinis kamštis ir nuorintojas'
                      : 'šoniniam pajungimui į radiatoriaus kolektorius įsukami `G 1" × 1/2"` perėjimai (`GI-FERROLI-001`), aklinis kamštis ir nuorintojas';

            if (locale === 'en') {
                return {
                    stage: 'recommendation',
                    reply:
                        `Sectional aluminium radiators (**Ferroli POL 500**, SKU \`POL./80-500\`) and side-connected steel panel radiators (**Type 22 K 500×800 / 500×1000**) are **universal left/right-hand units** – for right-side lateral connection you thread in **right-hand \`G 1" × 1/2" D\` reducers** on the right and a blind plug + air vent on the left. ` +
                        `Below I selected the radiators first, followed strictly by lateral \`DN15 (1/2")\` valves (**Danfoss RA-N 15** \`013G0014\` / **Heimeier Eclipse DN15** \`3933-02.000\`) and head **Danfoss Aero RA 2970** (\`013G2970\`). What is your room area in m²?`,
                    quickReplies: [
                        'Show only the radiators (all heights 350–800 mm)',
                        'Room is 14 m² – calculate section count',
                        'Include G 1"×1/2" right-hand reducer kit',
                    ],
                };
            }
            if (locale === 'pl') {
                return {
                    stage: 'recommendation',
                    reply:
                        `Grzejniki aluminiowe członowe (**Ferroli POL 500**, SKU \`POL./80-500\`) oraz stalowe bocznozasilane (**Typ 22 K 500×800**) są **uniwersalne lewe/prawe** – do podłączenia bocznego z prawej strony wkręca się **prawe redukcje \`G 1" × 1/2" D\`**, a z lewej korek zaślepiający i odpowietrznik. ` +
                        `Poniżej zestawiłem najpierw same grzejniki, a do nich wyłącznie boczne zawory \`DN15\` (**Danfoss RA-N 15** \`013G0014\`) i głowicę **Danfoss Aero RA 2970** (\`013G2970\`). Jaki metraż (m²) ma pomieszczenie?`,
                    quickReplies: [
                        'Pokaż same grzejniki (350 / 500 / 600 mm)',
                        'Pokój ma 15 m² – policz liczbę członów',
                        'Dodaj zestaw korków G 1"×1/2"',
                    ],
                };
            }
            if (locale === 'ru') {
                return {
                    stage: 'recommendation',
                    reply:
                        `Секционные алюминиевые радиаторы (**Ferroli POL 500**, SKU \`POL./80-500\`) и стальные радиаторы с боковым подключением (**Тип 22 K 500×800**) являются **универсальными (левыми/правыми)** – для правого бокового подключения справа вкручиваются переходники с **правой резьбой \`G 1" × 1/2" D\`**, а слева – глухая пробка и воздухоотводчик. ` +
                        `Ниже подобраны сами радиаторы и строго боковые клапаны \`DN15\` (**Danfoss RA-N 15** \`013G0014\`) с термоголовкой **Danfoss Aero RA 2970** (\`013G2970\`). Какая площадь комнаты (м²)?`,
                    quickReplies: [
                        'Показать только сами радиаторы',
                        'Комната 15 м² – рассчитать секции',
                        'Добавить переходники G 1"×1/2" правые',
                    ],
                };
            }

            return {
                stage: 'recommendation',
                reply:
                    `Sekcijiniai aliumininiai radiatoriai (**Ferroli POL 350 / 500 / 600**, SKU \`POL./80-500\`) ir šoninio pajungimo plieniniai radiatoriai (**Tipas 22 K 500×800 / 500×1000**, keturios \`G 1/2"\` šoninės angos) yra **universalūs kairės/dešinės pusės** – ${handDetailLt}. ` +
                    `Žemiau pirmiausia pateikiu pačius radiatorius, o prie jų – tik šoninio \`DN15 (1/2")\` pajungimo termostatinius vožtuvus (**Danfoss RA-N 15** \`013G0014\` arba **IMI Heimeier Eclipse DN15** \`3933-02.000\`) ir galvutę **Danfoss Aero RA 2970** (\`013G2970\`). Koks yra jūsų kambario plotas (m²) ir koks aukštis po palange?`,
                quickReplies: [
                    'Rodyk tik pačius radiatorius (350, 500, 600, 800 mm)',
                    'Kambarys 14 m² – kiek sekcijų POL 500 reikia?',
                    'Pridėti G 1"×1/2" perėjimų komplektą (GI-FERROLI-001)',
                ],
            };
        }

        // Case C: Bottom VK 50 mm connection specified
        if (state.connectionSide === 'bottom') {
            return {
                stage: 'recommendation',
                reply:
                    `Apatiniam \`VK 50 mm\` pajungimui vamzdžiai iš grindų arba sienos jungiami per \`50 mm\` tarpcentrio H-bloką („binoklį“) **IMI Heimeier Vekolux DN15** (SKU \`0382-02.000\`) arba pilną rinkinį su dekoratyviniu dangteliu **IMI Heimeier Multilux 4** (SKU \`9690-27.000\`). ` +
                    `Prie integruoto ventilio viršuje tiesiogiai sukasi \`M30×1,5\` arba \`RA-Click\` termostatinė galvutė. Koks patalpos plotas (m²) ir ar vamzdžiai išeina iš sienos (reikia kampinio mazgo), ar iš grindų (tiesaus)?`,
                quickReplies: [
                    'Vamzdžiai išeina iš sienos (kampinis Vekolux 50 mm)',
                    'Vamzdžiai išeina iš grindų (tiesus mazgas 50 mm)',
                    'Rodyk tik pačius radiatorius',
                ],
            };
        }

        // Case D: Turn 1 discovery when neither height, area, nor connection side is specified yet
        if (state.userTurnsCount <= 1 && !state.heightMm && !state.areaM2 && !state.connectionSide) {
            return {
                stage: 'discovery',
                reply:
                    'Girdžiu. Kad parinkčiau tikslų radiatorių ir jam tinkančią prijungimo armatūrą be grąžinimų, patikslinkite: 1) Ar ieškote paties radiatoriaus (350 mm, 500 mm, 600 mm aukščio), ar pilno komplekto su vožtuvais? 2) Koks kambario plotas (m²)? 3) Koks pajungimas: šoninis DN15 (iš kairės ar dešinės) ar apatinis VK 50 mm?',
                quickReplies: [
                    'Šoninio radiatoriaus reikia (pajungimas iš šono dešinės pusės)',
                    'Rodyk tik pačius radiatorius (Ferroli POL / Tipas 22 K)',
                    'Apatinis pajungimas (VK 50 mm H-blokas + galvutė)',
                ],
            };
        }
    }

    // 2. Boilers domain
    if (state.domain === 'boilers') {
        const calcKw = state.powerKw || (state.areaM2 ? Math.max(12, Math.round(state.areaM2 * 0.12)) : 25);
        if (state.focusFilter === 'main_units_only') {
            return {
                stage: 'recommendation',
                reply:
                    `Štai patys šildymo katilai be papildomos aprišimo armatūros (${state.areaM2 ? `jūsų ${state.areaM2} m² plotui optimali galia ~${calcKw} kW` : `~${calcKw} kW galios klasėje`}): lietuviškas 5–6 mm katilinio plieno ` +
                    `**KaTRI 25 kW** (SKU \`KaTRI3850020\`), kroatiškas **Centrometal EKO-CK P 25 kW** (SKU \`17526\`, paruoštas granulių degikliui) ir dujinis kondensacinis **Viessmann Vitodens 100-W** (SKU \`B1HC232\`). Kurį kuro tipą (malkos/granulės ar dujos) renkatės?`,
                quickReplies: [
                    'Malkos ir medienos granulės (KaTRI 25 kW)',
                    'Kokie apsauginiai priedai būtini prie šio katilo?',
                    'Reikia granulių degiklio komplekto į esamą katilą',
                ],
            };
        }

        return {
            stage: 'recommendation',
            reply:
                `Pagal jūsų parametrus (${state.powerOrAreaSummary}) rekomenduoju patikimą **KaTRI 25 kW** (SKU \`KaTRI3850020\`) arba **Centrometal EKO-CK P 25 kW** (SKU \`17526\`) katilą. ` +
                `Kad kieto kuro katilas nesikondensuotų ir tarnautų 15+ metų, grįžtamame vamzdyje privalomas termostatinis pamaišymo vožtuvas **HERZ Teplomix DN25 61 °C** (\`1776603\`), \`3 bar\` apsaugos grupė **Watts KSG 30** (\`0270132\`) ir **Statico SD 25.3** (\`7101003\`) išsiplėtimo indas.`,
            quickReplies: [
                'Rodyk tik pačius katilus be priedų',
                'Pridėti Megatherm 20 kW granulių degiklio komplektą',
                'Kokia akumuliacinė talpa tinka 25 kW katilui?',
            ],
        };
    }

    // 3. Pellet burners domain
    if (state.domain === 'pellet_burners') {
        return {
            stage: 'recommendation',
            reply:
                `Automatizuotam granulių kūrenimui rekomenduoju pilną komplektą su padavimo sraigtu ir valdikliu: **Megatherm MPB 20 kW** (SKU \`degkmpl140mg20\`, tinka 10–35 kW katilams, su 460 L bunkeriu ir 1,5 m sraigtu) arba **Pelltech PV20a 20 kW** (SKU \`degkmpl140pv20\`). ` +
                `Abu degikliai turi automatinį uždegimą, fotoelementą ir moduliuojamą galią. Kokio modelio katile planuojate montuoti degiklį?`,
            quickReplies: [
                'Montuosiu į Viadrus U22 ketinį katilą',
                'Montuosiu į plieninį KaTRI / Kalvis katilą',
                'Reikia atsarginio uždegimo teno degikliui',
            ],
        };
    }

    // 4. Heat pumps domain
    if (state.domain === 'heat_pumps') {
        const kwText = state.powerKw ? `${state.powerKw} kW` : '8–12 kW';
        return {
            stage: 'recommendation',
            reply:
                `${kwText} galios šilumos siurblio mazgui rekomenduoju **Haier Super Aqua Monoblok** oras–vanduo šilumos siurblį kartu su buferine akumuliacine talpa **Gorenje ZV 200** ir greitaeigiu boileriu **Dražice OKC NTR/HP** (su padidintu \`2,1–3,2 m²\` šilumokaičiu, kad siurblys nekiltų į aukšto slėgio klaidą). Ar šildysite grindis, ar radiatorius?`,
            quickReplies: [
                'Šildysiu tik grindinį šildymą (35 °C režimas)',
                'Mišri sistema: radiatoriai + grindinis šildymas',
                'Rodyk tik pačius Haier šilumos siurblius',
            ],
        };
    }

    // 5. Tanks & Boilers (Gorenje ZV / Dražice OKC)
    if (state.domain === 'tanks_boilers') {
        return {
            stage: 'recommendation',
            reply:
                `Akumuliacijai ir karšto vandens ruošimui atrinkau patikrintus modelius: akumuliacinę talpą **Gorenje ZV** / **Tiki** bei greitaeigį netiesioginio šildymo boilerį **Dražice OKC 200 NTR** (SKU \`OKC200NTR\`) arba dviejų šilumokaičių **OKC 300 NTRR/SOL** (\`OKC300NTRR-S\`). ` +
                `Geriamojo vandens kontūre privalomas higieninis \`PN10\` plėtimosi indas **IMI Pneumatex Aquapresso** (\`7111020\`). Kelių asmenų šeimai ar kokio galingumo katilui renkate talpą?`,
            quickReplies: [
                '4 asmenų šeimai – 200 L boileris',
                'Prie šilumos siurblio (reikia didelio gyvatuko)',
                'Prie kieto kuro katilo (akumuliacinė talpa)',
            ],
        };
    }

    // 6. Underfloor heating manifold
    if (state.domain === 'underfloor') {
        const loops = state.loopCount || 8;
        return {
            stage: 'recommendation',
            reply:
                `${loops} kontūrų grindinio šildymo sistemai rekomenduoju nerūdijančio plieno kolektorių su debitomačiais **Comisa** (SKU \`88.20.415\`) arba automatinio srauto palaikymo **IMI Heimeier Dynacon Eclipse**, kartu su \`G 3/4" Eurokonus\` jungtimis \`16×2,0 mm\` vamzdžiui (SKU \`88.03.116\`) ir \`230 V\` elektroterminėmis pavaromis. Ar kolektorių jungsite prie žematemperatūrio šilumos siurblio, ar prie katilo (kuriam būtinas pamaišymo mazgas 20–50 °C)?`,
            quickReplies: [
                'Jungsiu prie katilo – reikia pamaišymo mazgo su siurbliu',
                'Jungsiu prie šilumos siurblio (tiesiogiai 35 °C)',
                'Pridėti 230 V pavaras ir kambario termostatus',
            ],
        };
    }

    // 7. Spare parts
    if (state.domain === 'spare_parts') {
        return {
            stage: 'recommendation',
            reply:
                `Atrinkau tikslias atsargines dalis pagal jūsų užklausą: **Ferroli SUN P7/P12** patroninį \`350 W\` uždegimo teną (\`KatF0033292\`, OEM \`39833290\`, L=140 mm, Ø10 mm) bei **Megatherm** \`425 W\` uždegimo teną (\`KatM39833425\`) ir susijusius mazgo komponentus. Dalys yra Kauno sandėlyje (Eigulių g. 21, LT-51418 Kaunas), pristatome per 1–3 d. d.`,
            quickReplies: [
                'Tinka Ferroli SUN P7 degikliui (KatF0033292)',
                'Tinka Megatherm degikliui (KatM39833425)',
                'Reikia ir liepsnos jutiklio (fotoelemento)',
            ],
        };
    }

    // 8. General / SKU lookup fallback
    const topNames = products
        .slice(0, 3)
        .map((p) => `**${p.name}** (SKU \`${p.sku}\`, ${p.formattedPrice || `${p.price.toFixed(2)} €`})`)
        .join(', ');

    if (products.length > 0) {
        return {
            stage: 'recommendation',
            reply: `Pagal jūsų užklausą (${state.powerOrAreaSummary}; ${state.connectionOrTypeSummary}) iš 6 337 pozicijų katalogo atrinkau tiksliausiai derančias prekes: ${topNames}. Patikslinkite sriegio skersmenį arba sistemos galingumą, jei reikia sukomplektuoti gretimus prijungimo mazgus.`,
            quickReplies: [
                'Rodyti tik pagrindinius įrenginius',
                'Patikrinti prijungimo sriegius ir adapterius',
                'Paruošti pilną mazgo sąmatą',
            ],
        };
    }

    return {
        stage: 'discovery',
        reply:
            'Girdžiu. Kad parinkčiau tikslius komponentus iš mūsų 6 337 prekių katalogo, patikslinkite: 1) Kokį mazgą komplektuojame (radiatorius, katilinę, šilumos siurblį, boilerį ar grindinį šildymą)? 2) Koks šildomas plotas (m²) arba įrenginio galia (kW)?',
        quickReplies: [
            'Radiatoriai ir termostatiniai vožtuvai',
            'Katilai ir granulių degikliai',
            'Šilumos siurbliai ir boileriai',
        ],
    };
}

/**
 * Main deterministic + hybrid multi-turn engine entry point.
 */
export function runVytautasMultiTurnEngine(input: {
    messages?: Array<{ role: 'user' | 'assistant' | string; content: string }>;
    message?: string;
    history?: VytautasHistoryTurn[];
    locale?: 'lt' | 'en' | 'pl' | 'ru';
    candidateCards?: VytautasProductCard[];
}): VytautasEngineResult {
    const locale = input.locale || 'lt';
    const fullMessages: Array<{ role: 'user' | 'assistant' | string; content: string }> =
        Array.isArray(input.messages) && input.messages.length > 0
            ? input.messages
            : [
                  ...(input.history || []),
                  ...(input.message ? [{ role: 'user', content: input.message }] : []),
              ];

    const state = extractConversationState(fullMessages);
    const selectedProducts = selectProductsForConversationState(state, input.candidateCards || []);
    const { stage, reply, quickReplies } = buildContextualEngineeringReply(
        state,
        selectedProducts,
        locale,
    );

    const finalProducts = stage === 'recommendation' ? selectedProducts : [];
    const stageLabel: ClientSystemMap['stageLabel'] =
        stage === 'recommendation'
            ? '2/2 Tikslinis mazgo parinkimas'
            : stage === 'discovery'
              ? '1/2 Poreikio diagnostika'
              : 'Gyva konsultacija';

    const systemMap: ClientSystemMap = {
        nodeId: state.nodeCategory,
        nodeLabel: state.nodeLabel,
        powerOrAreaLabel: state.powerOrAreaSummary,
        connectionOrTypeLabel: state.connectionOrTypeSummary,
        stage,
        stageLabel,
    };

    return {
        stage,
        reply,
        response: reply,
        recommendations: finalProducts,
        recommendedProducts: finalProducts,
        suggestedProducts: finalProducts,
        quickReplies,
        followUpSuggestions: quickReplies,
        systemMap,
        state,
    };
}
