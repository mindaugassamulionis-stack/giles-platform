import type { ListingProduct } from './catalog-listing';
import {
    parseV3Description,
    getProductUxGuide,
    resolveProductBrandInfo,
    formatCleanCatalogProductTitle,
    type ProductUxStep,
    type V3SpecRow,
} from './v3-description';
import {
    localizeProductHook,
    localizeProductUxGuide,
} from './product-i18n';

function readCatalogOverridesSafe(): {
    overrides: Record<string, Record<string, unknown>>;
    customProducts: Array<Record<string, unknown> & { sku: string }>;
} {
    if (typeof window !== 'undefined') {
        return { overrides: {}, customProducts: [] };
    }
    try {
        const req = eval('require') as NodeRequire;
        const snap = req('./giles-catalog-snapshot') as {
            readCatalogOverrides: () => {
                overrides: Record<string, Record<string, unknown>>;
                customProducts: Array<Record<string, unknown> & { sku: string }>;
            };
        };
        return snap.readCatalogOverrides();
    } catch {
        return { overrides: {}, customProducts: [] };
    }
}

export type BoilerCompatLocale = 'lt' | 'en' | 'pl' | 'ru';

export type BoilerSystemGroupId =
    | 'kieto_kuro_seni'
    | 'granuliniai_degikliai'
    | 'silumos_siurbliai'
    | 'dujiniai_elektriniai_mazgai';

export type CompatibilityVerificationStatus =
    | 'PATVIRTINTA_GAMINTOJO'
    | 'NEPATVIRTINTA_GAMINTOJO';

export type CompatibilitySourceKind =
    | 'manufacturer'
    | 'standard'
    | 'own-pricelist';

export const MANUFACTURER_CONFIRMED_BOILER_PROFILE_IDS = new Set<string>([
    'megatherm-mpb',
    'haier-super-aqua-r290',
    'haier-hydro-split',
    'haier-es-kospell-elektra',
]);

export function resolveBoilerProfileVerificationMeta(modelId: string): {
    verificationStatus: CompatibilityVerificationStatus;
    sourceKind: CompatibilitySourceKind;
    verificationBadgeLabel: string;
} {
    const cleanId = (modelId || '').trim().toLowerCase();
    if (cleanId === 'megatherm-mpb') {
        return {
            verificationStatus: 'PATVIRTINTA_GAMINTOJO',
            sourceKind: 'own-pricelist',
            verificationBadgeLabel:
                'Gamintojo dokumentu patvirtintas suderinamumas (Price List Giles 2025.xlsx)',
        };
    }
    if (MANUFACTURER_CONFIRMED_BOILER_PROFILE_IDS.has(cleanId)) {
        return {
            verificationStatus: 'PATVIRTINTA_GAMINTOJO',
            sourceKind: 'manufacturer',
            verificationBadgeLabel:
                'Gamintojo dokumentu patvirtintas suderinamumas (Haier kainininkas TOP 2026-2.pdf)',
        };
    }
    return {
        verificationStatus: 'NEPATVIRTINTA_GAMINTOJO',
        sourceKind: 'standard',
        verificationBadgeLabel:
            'Tipinis parinkimas (suderinamumą su konkrečiu katilo modeliu pasitikslinkite su mūsų inžinieriumi +370 611 19158)',
    };
}

export interface EngineeringCompatibilitySpecs {
    burnerKw: Record<BoilerCompatLocale, string>;
    bufferTankLiters: Record<BoilerCompatLocale, string>;
    anticondensationValve: Record<BoilerCompatLocale, string>;
    flueOrConnection: Record<BoilerCompatLocale, string>;
    typicalSpareParts: Record<BoilerCompatLocale, string>;
}

export interface EngineeringCompatibilityPassport {
    modelTitle: Record<BoilerCompatLocale, string>;
    marketShareNote: Record<BoilerCompatLocale, string>;
    conversionOrUpgradeSummary: Record<BoilerCompatLocale, string>;
    recommendedSpecs: EngineeringCompatibilitySpecs;
    vytautasPrompt: Record<BoilerCompatLocale, string>;
    matchingKeywords: string[];
    matchingCategories: string[];
    matchingSkus: string[];
    sqlRegex: string;
    excludedRegex?: string;
}

export interface ResolvedEngineeringCompatibilityPassport {
    id: string;
    groupId: BoilerSystemGroupId;
    groupTitle: string;
    modelTitle: string;
    shortChipLabel: string;
    marketShareNote: string;
    conversionOrUpgradeSummary: string;
    recommendedSpecs: {
        burnerKw: string;
        bufferTankLiters: string;
        anticondensationValve: string;
        flueOrConnection: string;
        typicalSpareParts: string;
    };
    vytautasPrompt: string;
    matchingKeywords: string[];
    matchingCategories: string[];
    matchingSkus: string[];
    sqlRegex: string;
    excludedRegex: string;
    verificationStatus: CompatibilityVerificationStatus;
    sourceKind: CompatibilitySourceKind;
    verificationBadgeLabel: string;
}

export interface LithuanianBoilerSystemModel {
    id: string;
    groupId: BoilerSystemGroupId;
    labels: Record<BoilerCompatLocale, string>;
    shortChipLabels: Record<BoilerCompatLocale, string>;
    passport: EngineeringCompatibilityPassport;
    verificationStatus?: CompatibilityVerificationStatus;
    sourceKind?: CompatibilitySourceKind;
    verificationBadgeLabel?: string;
}

export interface BoilerSystemGroup {
    id: BoilerSystemGroupId;
    stepNumber: number;
    shortTabLabel: Record<BoilerCompatLocale, string>;
    title: Record<BoilerCompatLocale, string>;
    subtitle: Record<BoilerCompatLocale, string>;
    models: LithuanianBoilerSystemModel[];
}

function loc4(lt: string, en?: string, pl?: string, ru?: string): Record<BoilerCompatLocale, string> {
    return {
        lt,
        en: en || lt,
        pl: pl || en || lt,
        ru: ru || en || lt,
    };
}

export const BOILER_SYSTEM_GROUPS: BoilerSystemGroup[] = [
    {
        id: 'kieto_kuro_seni',
        stepNumber: 1,
        shortTabLabel: loc4(
            '1. Kieto kuro katilai (perdarymui ir dalims)',
            '1. Solid fuel boilers (conversion & parts)',
            '1. Kotły na paliwo stałe (modernizacja i części)',
            '1. Твердотопливные котлы (модернизация и запчасти)',
        ),
        title: loc4(
            'Populiariausi kieto kuro (malkiniai / angliniai) katilai Lietuvoje',
            'Most popular solid fuel (wood / coal) boilers in Lithuania',
            'Najpopularniejsze kotły na paliwo stałe (drewno / węgiel) na Litwie',
            'Самые популярные твердотопливные (дровяные / угольные) котлы в Литве',
        ),
        subtitle: loc4(
            'Perdarymui į granulinius per 4 val., durelių modifikacijai su CNC flanšu, akumuliacinėms talpoms ir dalims',
            'For 4-hour pellet conversion, CNC door flange modification, buffer tanks and spare parts',
            'Do konwersji na pellet w 4 godz., modyfikacji drzwiczek z kołnierzem CNC, buforów i części',
            'Для переделки на пеллеты за 4 ч, модификации дверец с ЧПУ-фланцем, буферных емкостей и запчастей',
        ),
        models: [
            {
                id: 'viadrus-u22-u26',
                groupId: 'kieto_kuro_seni',
                labels: loc4(
                    'Viadrus U22 / U26 / Hercules (Ketiniai 4–10 sekc.)',
                    'Viadrus U22 / U26 / Hercules (Cast-iron 4–10 sect.)',
                    'Viadrus U22 / U26 / Hercules (Żeliwne 4–10 sekc.)',
                    'Viadrus U22 / U26 / Hercules (Чугунные 4–10 секц.)',
                ),
                shortChipLabels: loc4('Viadrus U22 / U26'),
                passport: {
                    modelTitle: loc4('Viadrus U22 / U26 / Hercules (4–10 sekcijų ketinis katilas)'),
                    marketShareNote: loc4(
                        'Nr. 1 labiausiai paplitęs ketinis kieto kuro katilas Lietuvos individualiuose namuose (1998–2020 m. statybos katilinėse).',
                        'No. 1 most widespread cast-iron solid fuel boiler in Lithuanian residential boiler rooms (installed 1998–2020).',
                    ),
                    conversionOrUpgradeSummary: loc4(
                        '4 val. apatinių durelių modifikacija su CNC adapterio flanšu + savaime išsivalantis rotacinis granulių degiklis Megatherm MPB 20 arba MPB 28 kW + HERZ Teplomix DN25 (61 °C) antikondensacinis mazgas.',
                        '4-hour lower door modification with CNC adapter flange + self-cleaning rotary pellet burner Megatherm MPB 20 or MPB 28 kW + HERZ Teplomix DN25 (61 °C) anti-condensation valve.',
                    ),
                    recommendedSpecs: {
                        burnerKw: loc4('Megatherm MPB 20 / 28 kW (4–7 sekc.) arba MPB 35 kW (8–10 sekc.)'),
                        bufferTankLiters: loc4('Gorenje ZV 200–500 L arba Dražice NAD 500 L buferinė talpa'),
                        anticondensationValve: loc4('HERZ Teplomix DN25 / DN32 (61 °C, 1 7766 13 / 14) + Wilo Yonos PICO'),
                        flueOrConnection: loc4('DN40 (6/4") srieginis pajungimas, dūmtraukis Ø150–160 mm'),
                        typicalSpareParts: loc4('Keraminis uždegimo tenas KatGr, Viadrus durelių stiklo virvė, STB termostatas, traukos reguliatorius'),
                    },
                    vytautasPrompt: loc4(
                        'Turiu ketinį katilą Viadrus U22 / U26. Parinkite pilną perdarymo į granules komplektą (Megatherm MPB degiklį, durelių flanšą, HERZ Teplomix 61 °C vožtuvą ir reikiamas atsargines dalis).',
                    ),
                    matchingKeywords: ['Megatherm', 'MPB', 'degkmpl', 'Teplomix', '1 7766', 'KatGr', 'bunker', 'sraigt'],
                    matchingCategories: ['Degikliai ir priedai', 'Katilai ir katilinės įranga', 'Katilinės automatika ir pavaros'],
                    matchingSkus: ['degkmpl20', 'degkmpl28', 'degkmpl35', '1776613', '1776614'],
                    sqlRegex: '(Megatherm|MPB|degkmpl|1\\s*7766|Teplomix|KatGr|bunker|sraigt|traukos reguliator)',
                },
            },
            {
                id: 'kalvis-2-serija',
                groupId: 'kieto_kuro_seni',
                labels: loc4(
                    'Kalvis 2-12 / 2-16 / 2-20 / 2-25 / 2-30 (Utena, apatinio degimo)',
                    'Kalvis 2-12 / 2-16 / 2-20 / 2-25 / 2-30 (Utena, bottom burn)',
                    'Kalvis 2-12 / 2-16 / 2-20 / 2-25 / 2-30 (Dolnego spalania)',
                    'Kalvis 2-12 / 2-16 / 2-20 / 2-25 / 2-30 (Нижнего горения)',
                ),
                shortChipLabels: loc4('Kalvis 2-12..2-30'),
                passport: {
                    modelTitle: loc4('Kalvis 2-12 / 2-16 / 2-20 / 2-25 / 2-30 (Utenos apatinio degimo plieninis katilas)'),
                    marketShareNote: loc4(
                        'Populiariausias lietuviškas apatinio degimo malkinis katilas su dideliu šilumokaičio plotu – idealiai tinka granulių degiklio integracijai.',
                        'Most popular Lithuanian bottom-burning steel wood boiler with large heat exchanger surface – ideal for pellet burner retrofits.',
                    ),
                    conversionOrUpgradeSummary: loc4(
                        'Durelių arba šoninės angos pritaikymas granulių degikliui Megatherm MPB 20/28 kW arba Verner / Pelltech + privalomas grįžtamo srauto 61 °C pamaišymo mazgas HERZ Teplomix ir 500–1000 L akumuliacinė talpa.',
                        'Door or side port adaptation for Megatherm MPB 20/28 kW or Verner / Pelltech burner + mandatory 61 °C return protection HERZ Teplomix and 500–1000 L buffer tank.',
                    ),
                    recommendedSpecs: {
                        burnerKw: loc4('Megatherm MPB 20 kW (Kalvis 2-12/16) arba MPB 28 kW (Kalvis 2-20/25/30)'),
                        bufferTankLiters: loc4('Akumuliacinė talpa 500–1000 L (malkiniam režimui) arba 200 L (granulėms)'),
                        anticondensationValve: loc4('HERZ Teplomix DN25 / DN32 (61 °C) + apsauginė grupė 2,5 bar'),
                        flueOrConnection: loc4('DN40 / DN50 katilo atvamzdžiai, dūmtraukis Ø160–180 mm'),
                        typicalSpareParts: loc4('Ketiniai ardeliai, šamotinės plytos, durelių sandarinimo virvė, traukos reguliatorius, uždegimo tenas'),
                    },
                    vytautasPrompt: loc4(
                        'Turiu lietuvišką katilą Kalvis 2-16 / 2-20. Parinkite tinkamą granulių degiklio komplektą, akumuliacinę talpą ir grįžtamo srauto apsaugos vožtuvą.',
                    ),
                    matchingKeywords: ['Megatherm', 'MPB', 'degkmpl', 'Teplomix', 'akumuliacin', 'ZV', 'ardel', 'tenas'],
                    matchingCategories: ['Degikliai ir priedai', 'Akumuliacinės talpos ir boileriai', 'Termostatinės galvutės ir vožtuvai'],
                    matchingSkus: ['degkmpl20', 'degkmpl28', '1776613', '1776614'],
                    sqlRegex: '(Megatherm|MPB|degkmpl|Teplomix|1\\s*7766|akumuliacin|ZV\\s*\\d|ardel|KatGr)',
                },
            },
            {
                id: 'atmos-vigas',
                groupId: 'kieto_kuro_seni',
                labels: loc4(
                    'Atmos DC 18S–50S / Vigas (Dujų generaciniai)',
                    'Atmos DC 18S–50S / Vigas (Wood gasification)',
                    'Atmos DC 18S–50S / Vigas (Zgazowujące drewno)',
                    'Atmos DC 18S–50S / Vigas (Пиролизные газогенераторные)',
                ),
                shortChipLabels: loc4('Atmos / Vigas'),
                passport: {
                    modelTitle: loc4('Atmos DC 18S / 22S / 25S / 32S / 50S ir Vigas (Dujų generaciniai piroliziniai katilai)'),
                    marketShareNote: loc4(
                        'Pagrindiniai Čekijos ir Slovakijos piroliziniai katilai Lietuvoje, reikalaujantys tikslaus 65–72 °C grįžtamo vandens palaikymo ir traukos ventiliatoriaus.',
                        'Leading Czech and Slovak wood gasification boilers in Lithuania requiring strict 65–72 °C return temperature control and draft fans.',
                    ),
                    conversionOrUpgradeSummary: loc4(
                        'Viršutinių durelių modifikacija su granulių degikliu Megatherm MPB 28/35 kW arba Pelltech + aukštos temperatūros pamaišymo mazgas + akumuliacinė talpa 800–1500 L + ištraukimo ventiliatorius ir keramikos purkštukas.',
                        'Upper door modification with Megatherm MPB 28/35 kW or Pelltech burner + high-temp return mixing unit + 800–1500 L buffer tank + exhaust fan and ceramic nozzle.',
                    ),
                    recommendedSpecs: {
                        burnerKw: loc4('Megatherm MPB 28 / 35 kW arba Pelltech PV 20a / 30a degiklis'),
                        bufferTankLiters: loc4('Akumuliacinė talpa 800–1500 L + Pneumatex Statico SD plėtimosi indas 80–140 L'),
                        anticondensationValve: loc4('HERZ Teplomix DN32 (1 7766 14) arba 3 eigų maišymo vožtuvas su pavara'),
                        flueOrConnection: loc4('DN32 / DN40 pajungimas, dūmų ventiliatorius ir STB apsauginis termostatas'),
                        typicalSpareParts: loc4('Dūmų ventiliatorius, STB termostatas, kapiliarinis termometras, degiklio tenas, plėtimosi indas Statico'),
                    },
                    vytautasPrompt: loc4(
                        'Turiu dujų generacinį katilą Atmos DC / Vigas. Parinkite suderinamą granulių degiklį, akumuliacinę talpą, plėtimosi indą ir katilinės apsaugos mazgus.',
                    ),
                    matchingKeywords: ['Pelltech', 'Megatherm', 'MPB', 'Teplomix', 'Statico', 'ventiliator', 'STB', 'akumuliacin'],
                    matchingCategories: ['Degikliai ir priedai', 'Plėtimosi indai ir slėgio palaikymas', 'Katilinės automatika ir pavaros'],
                    matchingSkus: ['degkmpl28', 'degkmpl35', '1776614'],
                    sqlRegex: '(Pelltech|Megatherm|MPB|degkmpl|Teplomix|1\\s*7766|Statico|ventiliator|STB|akumuliacin)',
                },
            },
            {
                id: 'stropuva-zvake',
                groupId: 'kieto_kuro_seni',
                labels: loc4(
                    'Stropuva S10 / S20 / S40 / Liepsnelė (Viršutinio degimo žvakės)',
                    'Stropuva S10 / S20 / S40 / Liepsnelė (Top-burning candle boilers)',
                    'Stropuva S10 / S20 / S40 / Liepsnelė (Kotły świecowe górnego spalania)',
                    'Stropuva S10 / S20 / S40 / Liepsnelė (Котлы верхнего горения «свеча»)',
                ),
                shortChipLabels: loc4('Stropuva / Liepsnelė'),
                passport: {
                    modelTitle: loc4('Stropuva S10 / S20 / S40, Liepsnelė ir Candle (Viršutinio degimo žvakės tipo katilai)'),
                    marketShareNote: loc4(
                        'Plačiai Lietuvoje įrengti cilindriniai viršutinio degimo katilai, jautrūs kondensatui ir srauto balansavimui (būtinas trieigis vožtuvas ir balansinis srauto ribotuvas).',
                        'Widespread Lithuanian top-burning cylindrical candle boilers sensitive to condensation and flow rate (requires 3-way mixing and balancing valve).',
                    ),
                    conversionOrUpgradeSummary: loc4(
                        'Hidraulinio aprišimo modernizacija: HERZ Teplomix 61 °C + IMI TA STAD balansinis vožtuvas (srauto ribojimui) + kombinuotas karšto vandens boileris Gorenje / Dražice OKC arba pakeitimas į Haier R290 šilumos siurblį.',
                        'Hydronic piping upgrade: HERZ Teplomix 61 °C + IMI TA STAD balancing valve (flow restriction) + combined DHW cylinder Gorenje / Dražice OKC or upgrade to Haier R290 heat pump.',
                    ),
                    recommendedSpecs: {
                        burnerKw: loc4('Hidraulinis mazgas 15–40 kW arba keitimas į Haier Super Aqua R290 8–12 kW / granulinį katilą'),
                        bufferTankLiters: loc4('Kombinuotas boileris Dražice OKC 125–200 L arba Gorenje GV / TGR'),
                        anticondensationValve: loc4('HERZ Teplomix DN25 (1 7766 13) + IMI TA STAD DN20/DN25 balansinis vožtuvas'),
                        flueOrConnection: loc4('DN25 / DN32 katilinės aprišimas, apsauginis vožtuvas 1,5–2,0 bar'),
                        typicalSpareParts: loc4('Bimetalinis traukos reguliatorius, termomanometras, apsauginis vožtuvas, nuorintojas Zeparo'),
                    },
                    vytautasPrompt: loc4(
                        'Turiu žvakės tipo katilą Stropuva / Liepsnelė. Parinkite teisingą katilinės aprišimo mazgą (trieigį vožtuvą, balansinį vožtuvą STAD, boilerį) arba pakeitimo į granulinį / šilumos siurblį sprendimą.',
                    ),
                    matchingKeywords: ['Teplomix', 'STAD', 'OKC', 'Zeparo', 'HERZ', 'Statico'],
                    matchingCategories: ['Balansiniai ir reguliavimo vožtuvai', 'Akumuliacinės talpos ir boileriai', 'Oro atskyrikliai ir nuorintuvai'],
                    matchingSkus: ['1776613', '1776614'],
                    sqlRegex: '(Teplomix|1\\s*7766|STAD\\s*DN2[05]|OKC\\s*1[26]0|Zeparo.*DN2[05])',
                },
            },
            {
                id: 'vienybe-atrama-umega',
                groupId: 'kieto_kuro_seni',
                labels: loc4(
                    'Vienybė / Atrama / Umega / Aremikas (Lietuviški plieniniai)',
                    'Vienybė / Atrama / Umega / Aremikas (Lithuanian steel boilers)',
                    'Vienybė / Atrama / Umega / Aremikas (Litewskie kotły stalowe)',
                    'Vienybė / Atrama / Umega / Aremikas (Литовские стальные котлы)',
                ),
                shortChipLabels: loc4('Vienybė / Atrama / Umega'),
                passport: {
                    modelTitle: loc4('Vienybė (Ukmergė), Atrama (Kaunas), Umega (Utena) ir Aremikas (Lietuviški plieniniai katilai)'),
                    marketShareNote: loc4(
                        'Tūkstančiai 12–32 kW lietuviškų plieninių katilų Kauno, Ukmergės ir Utenos regionuose, kuriems tiesiai tinka standartinis Megatherm MPB degiklio flanšas.',
                        'Thousands of 12–32 kW Lithuanian steel boilers in Kaunas, Ukmergė and Utena regions directly compatible with standard Megatherm MPB burner flanges.',
                    ),
                    conversionOrUpgradeSummary: loc4(
                        'Greitas perdarymas į automatinį granulinį šildymą su Megatherm MPB 20 / 28 kW degiklio komplektu (su 2 m šneku ir valdikliu) + 300 L granulių bunkeriu + apsauginis vožtuvas ir plėtimosi indas.',
                        'Fast conversion to automatic pellet heating with Megatherm MPB 20 / 28 kW burner kit (with 2 m auger and controller) + 300 L pellet hopper + safety valve and expansion vessel.',
                    ),
                    recommendedSpecs: {
                        burnerKw: loc4('Megatherm MPB 20 kW (iki 180 m²) arba MPB 28 kW (180–280 m²)'),
                        bufferTankLiters: loc4('Gorenje ZV 100–300 L akumuliacinė talpa ir Dražice OKC boileris'),
                        anticondensationValve: loc4('HERZ Teplomix DN25 (61 °C) + Pneumatex Statico 35–50 L plėtimosi indas'),
                        flueOrConnection: loc4('DN32 / DN40 pajungimas, dūmtraukis Ø150–160 mm'),
                        typicalSpareParts: loc4('Keraminis tenas KatGr, šneko lanksti žarna, ketiniai ardeliai, STB termostatas'),
                    },
                    vytautasPrompt: loc4(
                        'Turiu lietuvišką plieninį katilą Vienybė / Atrama / Umega. Parinkite tinkamą Megatherm MPB granulių degiklio komplektą su bunkeriu ir aprišimo armatūra.',
                    ),
                    matchingKeywords: ['Megatherm', 'MPB', 'degkmpl', 'bunker', 'sraigt', 'Teplomix', 'KatGr', 'ardel'],
                    matchingCategories: ['Degikliai ir priedai', 'Katilai ir katilinės įranga', 'Plėtimosi indai ir slėgio palaikymas'],
                    matchingSkus: ['degkmpl20', 'degkmpl28'],
                    sqlRegex: '(Megatherm|MPB|degkmpl|bunker|sraigt|Teplomix|1\\s*7766|KatGr|ardel)',
                },
            },
            {
                id: 'defro-moderator-sas',
                groupId: 'kieto_kuro_seni',
                labels: loc4(
                    'Defro / Moderator Unica / Kamen / SAS / Pereko (Lenkiški)',
                    'Defro / Moderator Unica / Kamen / SAS / Pereko (Polish steel)',
                    'Defro / Moderator Unica / Kamen / SAS / Pereko (Polskie kotły)',
                    'Defro / Moderator Unica / Kamen / SAS / Pereko (Польские котлы)',
                ),
                shortChipLabels: loc4('Defro / Moderator / Kamen'),
                passport: {
                    modelTitle: loc4('Defro Optima, Moderator Unica, Kamen, SAS ir Pereko (Lenkiški plieniniai katilai)'),
                    marketShareNote: loc4(
                        'Labai populiarūs 15–50 kW lenkiški plieniniai katilai su plačiomis apatinėmis durelėmis ir horizontaliomis arba vertikaliomis dūmų lentynomis.',
                        'Very common 15–50 kW Polish steel boilers with wide lower doors and multi-pass heat exchangers.',
                    ),
                    conversionOrUpgradeSummary: loc4(
                        'Įmontuojamas savaime išsivalantis rotacinis degiklis Megatherm MPB 20–50 kW arba Centrometal PelTec / Cppl įranga + ventiliatoriaus ir valdiklio automatika + 3 eigų pamaišymo mazgas.',
                        'Retrofit self-cleaning rotary burner Megatherm MPB 20–50 kW or Centrometal PelTec / Cppl equipment + fan and controller automation + 3-way mixing valve.',
                    ),
                    recommendedSpecs: {
                        burnerKw: loc4('Megatherm MPB 20 / 28 / 35 / 50 kW arba Centrometal Cppl 14–35 kW'),
                        bufferTankLiters: loc4('Gorenje ZV 200–500 L buferinė talpa + kombinuotas boileris OKC 160–200 L'),
                        anticondensationValve: loc4('HERZ Teplomix DN25 / DN32 + 3 eigų maišymo vožtuvas su pavara'),
                        flueOrConnection: loc4('DN40 pajungimas, dūmtraukis Ø160–200 mm'),
                        typicalSpareParts: loc4('Pūtimo ventiliatorius, katilo temperatūros daviklis, uždegimo tenas, šneko reduktorius'),
                    },
                    vytautasPrompt: loc4(
                        'Turiu katilą Defro / Moderator / Kamen / SAS. Parinkite jam tinkamą granulių degiklio komplektą arba atsargines dalis (teną, ventiliatorių, daviklius).',
                    ),
                    matchingKeywords: ['Megatherm', 'MPB', 'degkmpl', 'Centrometal', 'CPPL', 'ventiliator', 'davikl', 'tenas'],
                    matchingCategories: ['Degikliai ir priedai', 'Katilinės automatika ir pavaros'],
                    matchingSkus: ['degkmpl20', 'degkmpl28', 'degkmpl35', 'degkmpl50'],
                    sqlRegex: '(Megatherm|MPB|degkmpl|Centrometal.*degikl|CPPL|ventiliator|KatGr|davikl)',
                },
            },
            {
                id: 'buderus-bosch-dakon',
                groupId: 'kieto_kuro_seni',
                labels: loc4(
                    'Buderus Logano / Bosch Solid / Dakon DOR / Sime Solida',
                    'Buderus Logano / Bosch Solid / Dakon DOR / Sime Solida',
                    'Buderus Logano / Bosch Solid / Dakon DOR / Sime Solida',
                    'Buderus Logano / Bosch Solid / Dakon DOR / Sime Solida',
                ),
                shortChipLabels: loc4('Buderus Logano / Dakon'),
                passport: {
                    modelTitle: loc4('Buderus Logano S111 / G211 / G221, Bosch Solid, Dakon DOR ir Sime Solida'),
                    marketShareNote: loc4(
                        'Vokiški, čekiški ir itališki ketiniai bei plieniniai katilai, kurių šilumokaičiai tarnauja 20–30 metų ir dažniausiai modernizuojami granulių degikliu arba keičiami į šilumos siurblį.',
                        'German, Czech and Italian cast-iron and steel boilers with 20–30 year heat exchangers frequently upgraded with pellet burners or heat pumps.',
                    ),
                    conversionOrUpgradeSummary: loc4(
                        'Buderus Logano G211 / S111 modernizavimas su Megatherm MPB 20/28 kW degikliu arba originalūs Buderus mazgai, dūmtraukio ir katilinės vožtuvai, plėtimosi indai ir traukos reguliatoriai.',
                        'Buderus Logano G211 / S111 modernization with Megatherm MPB 20/28 kW burner or genuine Buderus components, boiler room valves, expansion vessels and draft regulators.',
                    ),
                    recommendedSpecs: {
                        burnerKw: loc4('Megatherm MPB 20 / 28 / 35 kW arba Buderus Logano S111 mazgai'),
                        bufferTankLiters: loc4('Gorenje ZV 200–300 L arba Buderus Logalux SU boileris'),
                        anticondensationValve: loc4('HERZ Teplomix DN25 (1 7766 13) + IMI Pneumatex Statico plėtimosi indas'),
                        flueOrConnection: loc4('DN40 srieginis / flanšinis pajungimas, dūmtraukis Ø150–180 mm'),
                        typicalSpareParts: loc4('Buderus ardeliai, traukos reguliatorius, katilo izoliacija, degiklio tenas, apsauginė grupė'),
                    },
                    vytautasPrompt: loc4(
                        'Turiu katilą Buderus Logano / Bosch Solid / Dakon DOR. Parinkite jam tinkančias Buderus dalis, granulių degiklio komplektą arba katilinės aprišimo mazgus.',
                    ),
                    matchingKeywords: ['Buderus', 'Logano', 'Megatherm', 'MPB', 'degkmpl', 'Teplomix'],
                    matchingCategories: ['Katilai ir katilinės įranga', 'Degikliai ir priedai', 'Katilinės automatika ir pavaros'],
                    matchingSkus: ['degkmpl20', 'degkmpl28'],
                    sqlRegex: '(Buderus|Logano|Megatherm|MPB|degkmpl|Teplomix|1\\s*7766)',
                },
            },
            {
                id: 'tisco-kamen-pramoniniai',
                groupId: 'kieto_kuro_seni',
                labels: loc4(
                    'Pramoniniai kieto kuro katilai 70–500 kW (Kalvis / Moderator / Gilės)',
                    'Industrial solid fuel boilers 70–500 kW (Kalvis / Moderator / Gilės)',
                    'Przemysłowe kotły na paliwo stałe 70–500 kW (Kalvis / Moderator / Gilės)',
                    'Промышленные твердотопливные котлы 70–500 кВт (Kalvis / Moderator / Gilės)',
                ),
                shortChipLabels: loc4('Pramoniniai 70–500 kW'),
                passport: {
                    modelTitle: loc4('Pramoniniai ir komerciniai katilai 70–500 kW (Kalvis, Moderator, Centrometal EKO-CKB, Gilės)'),
                    marketShareNote: loc4(
                        'Gamybos cechų, sandėlių, mokyklų, darželių ir šiltnamių katilinės Lietuvoje (70–500 kW), kurias UAB „Gilės inžinerija“ automatizuoja pramoniniais degikliais.',
                        'Manufacturing halls, warehouses, schools and greenhouses in Lithuania (70–500 kW) automated by UAB Gilės inžinerija with industrial burners.',
                    ),
                    conversionOrUpgradeSummary: loc4(
                        'Pramoninis rotacinis granulių degiklis Megatherm MPB 80 / 150 / 250 / 350 / 500 kW arba Verner A501 + flanšiniai balansiniai vožtuvai IMI TA STAF DN50–DN150 + Pneumatex Statico / Transfero slėgio palaikymo sistema.',
                        'Industrial rotary pellet burner Megatherm MPB 80 / 150 / 250 / 350 / 500 kW or Verner A501 + flanged balancing valves IMI TA STAF DN50–DN150 + Pneumatex Statico / Transfero pressurization.',
                    ),
                    recommendedSpecs: {
                        burnerKw: loc4('Megatherm MPB 80 / 150 / 250 / 350 / 500 kW arba Verner A501 (48 kW)'),
                        bufferTankLiters: loc4('Akumuliacinės talpos CAS 1000–5000 L + Pneumatex Statico / Transfero stotis'),
                        anticondensationValve: loc4('Flanšiniai balansiniai vožtuvai IMI TA STAF DN50–DN150 + Zeparo Giga separatoriai'),
                        flueOrConnection: loc4('Flanšinis DN50–DN125 pajungimas, pramoninis dūmsiurbis ir ciklono filtras'),
                        typicalSpareParts: loc4('Pramoniniai keraminiai tenai, sunkūs ketaus ardeliai, šneko motoreduktoriai, STAF flanšiniai vožtuvai'),
                    },
                    vytautasPrompt: loc4(
                        'Komplektuojame arba modernizuojame 70–500 kW pramoninį katilą. Parinkite Megatherm MPB 80–500 kW pramoninį degiklį, flanšinius IMI TA STAF vožtuvus ir Pneumatex slėgio palaikymo įrangą.',
                    ),
                    matchingKeywords: ['degkmpl80', 'degkmpl150', 'degkmpl250', 'degkmpl350', 'degkmpl500', 'STAF', 'Transfero', 'Verner'],
                    matchingCategories: ['Degikliai ir priedai', 'Balansiniai ir reguliavimo vožtuvai', 'Plėtimosi indai ir slėgio palaikymas'],
                    matchingSkus: ['degkmpl80', 'degkmpl150', 'degkmpl250', 'degkmpl350', 'degkmpl500'],
                    sqlRegex: '(degkmpl(80|150|250|350|500)|MPB\\s*(80|150|250|350|500)|STAF|Transfero|Vento|Verner.*A501|EKO-CK.*(70|90|110))',
                },
            },
        ],
    },
    {
        id: 'granuliniai_degikliai',
        stepNumber: 2,
        shortTabLabel: loc4(
            '2. Granuliniai katilai ir degikliai',
            '2. Pellet boilers & burners',
            '2. Kotły i palniki pelletowe',
            '2. Пеллетные котлы и горелки',
        ),
        title: loc4(
            'Granuliniai katilai ir degikliai Lietuvoje',
            'Pellet boilers and burners in Lithuania',
            'Kotły i palniki pelletowe na Litwie',
            'Пеллетные котлы и горелки в Литве',
        ),
        subtitle: loc4(
            'Atsarginėms dalims: uždegimo tenams, ardeliams, davikliams, fotodiodams, šnekams ir hidraulikai',
            'For spare parts: igniters, grates, sensors, photodiodes, augers and hydronics',
            'Do części zamiennych: zapalarek, rusztów, czujników, fotodiod, podajników i hydrauliki',
            'Для запчастей: ТЭНов розжига, колосников, датчиков, фотодиодов, шнеков и гидравлики',
        ),
        models: [
            {
                id: 'megatherm-mpb',
                groupId: 'granuliniai_degikliai',
                labels: loc4(
                    'Megatherm MPB 20 / 28 / 35 / 50 / 80 / 150 (Rotaciniai degikliai)',
                    'Megatherm MPB 20 / 28 / 35 / 50 / 80 / 150 (Rotary burners)',
                    'Megatherm MPB 20 / 28 / 35 / 50 / 80 / 150 (Palniki rotacyjne)',
                    'Megatherm MPB 20 / 28 / 35 / 50 / 80 / 150 (Ротационные горелки)',
                ),
                shortChipLabels: loc4('Megatherm MPB 20–150'),
                passport: {
                    modelTitle: loc4('Megatherm MPB 20 / 28 / 35 / 50 / 80 / 150 (Savaime išsivalantys rotaciniai degikliai)'),
                    marketShareNote: loc4(
                        'UAB „Gilės inžinerija“ flagmanas Lietuvoje: rotacinė besisukanti degimo kamera neleidžia susidaryti šlako plutelei net kūrenant prastesnės kokybės granules.',
                        'UAB Gilės inžinerija flagship in Lithuania: rotating combustion chamber prevents clinker buildup even with lower-grade pellets.',
                    ),
                    conversionOrUpgradeSummary: loc4(
                        'Pilni Megatherm MPB 20–500 kW komplektai su padavimo sraigtu ir valdikliu bei originalios atsarginės dalys Kauno sandėlyje: keraminiai uždegimo tenai, fotodiodai, ventiliatoriai, bunkeriai ir HERZ pamaišymo mazgai.',
                        'Complete Megatherm MPB 20–500 kW kits with auger and controller plus genuine spare parts in Kaunas stock: ceramic igniters, photodiodes, fans, hoppers and HERZ mixing units.',
                    ),
                    recommendedSpecs: {
                        burnerKw: loc4('MPB 20 kW, MPB 28 kW, MPB 35 kW, MPB 50 kW, MPB 80–500 kW'),
                        bufferTankLiters: loc4('Gorenje ZV 200–300 L + granulių bunkeris 200–1000 L'),
                        anticondensationValve: loc4('HERZ Teplomix DN25 / DN32 (61 °C) + IMI Pneumatex Statico plėtimosi indas'),
                        flueOrConnection: loc4('CNC montavimo flanšas į katilo dureles, poliuretaninė žarna Ø60 mm'),
                        typicalSpareParts: loc4('Keraminis uždegimo tenas KatGr, šneko lanksti žarna, optinis liepsnos jutiklis, ventiliatorius'),
                    },
                    vytautasPrompt: loc4(
                        'Naudoju arba renkuosi Megatherm MPB rotacinį granulių degiklį. Parinkite tinkamos galios komplektą arba originalias atsargines dalis (teną, jutiklį, bunkerį).',
                    ),
                    matchingKeywords: ['Megatherm', 'MPB', 'degkmpl', 'KatGr', 'bunker', 'sraigt', 'Teplomix'],
                    matchingCategories: ['Degikliai ir priedai', 'Katilinės automatika ir pavaros'],
                    matchingSkus: ['degkmpl20', 'degkmpl28', 'degkmpl35', 'degkmpl50', 'degkmpl80', 'degkmpl150'],
                    sqlRegex: '(Megatherm|MPB|degkmpl|KatGr|bunker|sraigt|Teplomix|1\\s*7766)',
                },
            },
            {
                id: 'verner-v25-a251',
                groupId: 'granuliniai_degikliai',
                labels: loc4(
                    'Verner V25 / A251 / A501 (Judančių ardelių degikliai)',
                    'Verner V25 / A251 / A501 (Moving-grate burners & boilers)',
                    'Verner V25 / A251 / A501 (Palniki z ruchomym rusztem)',
                    'Verner V25 / A251 / A501 (Горелки с подвижным колосником)',
                ),
                shortChipLabels: loc4('Verner V25 / A251'),
                passport: {
                    modelTitle: loc4('Verner V25 / A251 / A501 (Čekiški katilai ir judančių ardelių biokuro degikliai)'),
                    marketShareNote: loc4(
                        'Aukštos klasės Čekijos gamintojo Verner malkiniai piroliziniai katilai (V25 / V210) ir pramoniniai biokuro / agro-granulių degikliai (A251 / A501) Lietuvos ūkiuose ir įmonėse.',
                        'High-grade Czech Verner gasification boilers (V25 / V210) and moving-grate agro-pellet burners (A251 / A501) on Lithuanian farms and industrial sites.',
                    ),
                    conversionOrUpgradeSummary: loc4(
                        'Originalūs Verner katilai ir degikliai, keramikos ir degimo kameros dalys, uždegimo tenai, traukos ventiliatoriai bei katilinės pamaišymo mazgai.',
                        'Genuine Verner boilers and burners, ceramic chamber parts, igniters, draft fans and boiler room mixing assemblies.',
                    ),
                    recommendedSpecs: {
                        burnerKw: loc4('Verner A251 (25 kW) arba Verner A501 (48 kW) judančių ardelių degiklis'),
                        bufferTankLiters: loc4('Akumuliacinė talpa 800–2000 L (su Verner V25 / V210)'),
                        anticondensationValve: loc4('HERZ Teplomix DN32 (1 7766 14) + IMI TA balansiniai vožtuvai'),
                        flueOrConnection: loc4('DN40 / DN50 katilinės pajungimas, dūmtraukis Ø160–200 mm'),
                        typicalSpareParts: loc4('Verner uždegimo tenas, judantys ardeliai, šamotinė keramika, dūmų termostatas, fotojutiklis'),
                    },
                    vytautasPrompt: loc4(
                        'Domina Verner V25 / A251 / A501 įranga ir atsarginės dalys. Parinkite turimus Verner katilus, degiklius ir jiems tinkančias atsargines dalis.',
                    ),
                    matchingKeywords: ['Verner', 'tenas', 'ardel', 'Teplomix', 'ventiliator'],
                    matchingCategories: ['Katilai ir katilinės įranga', 'Degikliai ir priedai', 'Katilinės automatika ir pavaros'],
                    matchingSkus: ['1776614'],
                    sqlRegex: '(Verner|KatGr|KatM|ardel|Teplomix|1\\s*7766)',
                },
            },
            {
                id: 'ponast-kp',
                groupId: 'granuliniai_degikliai',
                labels: loc4(
                    'Ponast KP 11 / KP 21 / KP 52 (Čekija)',
                    'Ponast KP 11 / KP 21 / KP 52 (Czech Republic)',
                    'Ponast KP 11 / KP 21 / KP 52 (Czechy)',
                    'Ponast KP 11 / KP 21 / KP 52 (Чехия)',
                ),
                shortChipLabels: loc4('Ponast KP 11 / 21 / 52'),
                passport: {
                    modelTitle: loc4('Ponast KP 11 / KP 12 / KP 21 / KP 22 / KP 52 (Čekiški automatiniai granuliniai katilai)'),
                    marketShareNote: loc4(
                        'Automatizuoti Čekijos gamintojo Ponast granuliniai katilai, kuriuos UAB „Gilės inžinerija“ tiekia ir aptarnauja Lietuvoje su pilnu atsarginių dalių sandėliu.',
                        'Automated Czech Ponast pellet boilers supplied and serviced in Lithuania by UAB Gilės inžinerija with full spare parts stock.',
                    ),
                    conversionOrUpgradeSummary: loc4(
                        'Ponast KP serijos katilai, originalūs uždegimo tenai, ardeliai, valdikliai, bunkeriai, padavimo sraigtai bei pilnas katilinės hidraulinis aprišimas.',
                        'Ponast KP series boilers, genuine igniters, grates, controllers, hoppers, feed augers and complete hydronic boiler room fittings.',
                    ),
                    recommendedSpecs: {
                        burnerKw: loc4('Ponast KP 11 (13,5 kW), KP 21 (23 kW), KP 52 (48 kW)'),
                        bufferTankLiters: loc4('Gorenje ZV 200–500 L + Dražice OKC 160–200 L netiesioginis boileris'),
                        anticondensationValve: loc4('HERZ Teplomix DN25 / DN32 (61 °C) + Zeparo purvo ir oro separatoriai'),
                        flueOrConnection: loc4('DN25 / DN32 / DN40 pajungimas, dūmtraukis Ø130–180 mm'),
                        typicalSpareParts: loc4('Ponast uždegimo tenas, degiklio ardelis, šneko variklis, STB termostatas, durų tarpinės'),
                    },
                    vytautasPrompt: loc4(
                        'Naudoju arba renkuosi Ponast KP granulinį katilą. Parinkite Ponast katilus, originalias atsargines dalis ir katilinės aprišimo mazgus.',
                    ),
                    matchingKeywords: ['Ponast', 'KatGr', 'KatM', 'tenas', 'ardel', 'Teplomix'],
                    matchingCategories: ['Katilai ir katilinės įranga', 'Degikliai ir priedai', 'Katilinės automatika ir pavaros'],
                    matchingSkus: ['1776613'],
                    sqlRegex: '(Ponast|KatGr|KatM|KatF|Teplomix|1\\s*7766|ardel)',
                },
            },
            {
                id: 'thermostal-attack',
                groupId: 'granuliniai_degikliai',
                labels: loc4(
                    'Thermostal / Attack Pellet / Ferroli Sun P7 / P12',
                    'Thermostal / Attack Pellet / Ferroli Sun P7 / P12',
                    'Thermostal / Attack Pellet / Ferroli Sun P7 / P12',
                    'Thermostal / Attack Pellet / Ferroli Sun P7 / P12',
                ),
                shortChipLabels: loc4('Thermostal / Ferroli Sun P7'),
                passport: {
                    modelTitle: loc4('Thermostal PLB, Attack Pellet ir Ferroli Sun P7 / P12 (Katilai ir degikliai)'),
                    marketShareNote: loc4(
                        'Plačiai Lietuvoje sumontuoti Ferroli Sun P7 / P12 degikliai (dažnai poroje su Ferroli SFL ketiniais katilais) bei Thermostal plieniniai katilai.',
                        'Widely installed Ferroli Sun P7 / P12 pellet burners (often paired with Ferroli SFL cast-iron boilers) and Thermostal steel boilers in Lithuania.',
                    ),
                    conversionOrUpgradeSummary: loc4(
                        'Ferroli Sun P7 / P12 ir Thermostal uždegimo tenai (350 W), fotorezistoriai, ardeliai, arba nusidėvėjusio degiklio pakeitimas į savaime išsivalantį rotacinį Megatherm MPB 20 / 28 kW.',
                        'Ferroli Sun P7 / P12 and Thermostal igniters (350 W), photoresistors, grates, or replacement of worn burner with self-cleaning rotary Megatherm MPB 20 / 28 kW.',
                    ),
                    recommendedSpecs: {
                        burnerKw: loc4('Keitimui: Megatherm MPB 20 / 28 kW arba Thermostal PLB / Ferroli mazgai'),
                        bufferTankLiters: loc4('Gorenje ZV 200 L buferinė talpa + Dražice OKC boileris'),
                        anticondensationValve: loc4('HERZ Teplomix DN25 (1 7766 13) + apsauginė grupė'),
                        flueOrConnection: loc4('DN32 / DN40 pajungimas, degiklio kaklelis Ø90–130 mm'),
                        typicalSpareParts: loc4('Uždegimo tenas KatF / KatGr (Ferroli Sun P7/P12), ardelis, fotoelementas, lanksti žarna'),
                    },
                    vytautasPrompt: loc4(
                        'Turiu Thermostal / Attack arba Ferroli Sun P7 / P12 granulinį degiklį. Parinkite jam tinkamą uždegimo teną, ardelį arba pakeitimo į Megatherm MPB degiklį sprendimą.',
                    ),
                    matchingKeywords: ['Thermostal', 'Ferroli', 'KatF', 'KatGr', 'tenas', 'ardel', 'degkmpl'],
                    matchingCategories: ['Katilai ir katilinės įranga', 'Degikliai ir priedai', 'Katilinės automatika ir pavaros'],
                    matchingSkus: ['degkmpl20', 'degkmpl28'],
                    sqlRegex: '(Thermostal|KatF|KatGr|KatM|Ferroli.*katil|degkmpl2[08]|uždegim|uzdegim)',
                },
            },
            {
                id: 'kostrzewa-pellasx-kipi',
                groupId: 'granuliniai_degikliai',
                labels: loc4(
                    'Kostrzewa Platinum Bio / PellasX / KIPI / Skiepko',
                    'Kostrzewa Platinum Bio / PellasX / KIPI / Skiepko',
                    'Kostrzewa Platinum Bio / PellasX / KIPI / Skiepko',
                    'Kostrzewa Platinum Bio / PellasX / KIPI / Skiepko',
                ),
                shortChipLabels: loc4('Kostrzewa / PellasX / KIPI'),
                passport: {
                    modelTitle: loc4('Kostrzewa Platinum Bio / Mini Bio, PellasX Revo, KIPI ir Skiepko degikliai'),
                    marketShareNote: loc4(
                        'Populiarūs Lenkijos gamintojų granuliniai katilai ir degikliai Lietuvoje, kuriems kas 2–4 sezonus reikalingi keraminiai ar metaliniai uždegimo tenai, jutikliai ir šneko žarnos.',
                        'Popular Polish pellet boilers and burners in Lithuania requiring ceramic or metal igniters, sensors and auger hoses every 2–4 heating seasons.',
                    ),
                    conversionOrUpgradeSummary: loc4(
                        'Atsarginės dalys (keraminiai ir metaliniai uždegimo tenai, temperatūros davikliai, STB apsaugos, bunkeriai, sraigtai), HERZ pamaišymo vožtuvai arba modernizavimas į Megatherm MPB.',
                        'Spare parts (ceramic and metal igniters, temperature sensors, STB cutoffs, hoppers, augers), HERZ mixing valves or upgrade to Megatherm MPB.',
                    ),
                    recommendedSpecs: {
                        burnerKw: loc4('12–40 kW granuliniai degikliai (atsarginės dalys arba Megatherm MPB 20/28 kW)'),
                        bufferTankLiters: loc4('Gorenje ZV 200–300 L buferinė talpa + OKC 160 L boileris'),
                        anticondensationValve: loc4('HERZ Teplomix DN25 (1 7766 13) arba 3 eigų pamaišymo vožtuvas su pavara'),
                        flueOrConnection: loc4('Poliuretaninė nedegi granulių padavimo žarna, 3/8" arba M16x1,5 teno sriegis'),
                        typicalSpareParts: loc4('Keraminis / metalinis uždegimo tenas, fotodiodas, STB termostatas, padavimo sraigtas'),
                    },
                    vytautasPrompt: loc4(
                        'Turiu Kostrzewa / PellasX / KIPI / Skiepko granulinį degiklį. Parinkite tinkamą uždegimo teną, daviklius, padavimo žarną ir katilinės pamaišymo mazgus.',
                    ),
                    matchingKeywords: ['tenas', 'uždegim', 'KatGr', 'KatM', 'KatF', 'davikl', 'bunker', 'sraigt', 'Teplomix'],
                    matchingCategories: ['Katilinės automatika ir pavaros', 'Degikliai ir priedai'],
                    matchingSkus: ['degkmpl20', '1776613'],
                    sqlRegex: '(tenas|uždegim|uzdegim|KatGr|KatM|KatF|EGIP-GLI|fotodiod|STB|bunker|sraigt|Teplomix)',
                },
            },
            {
                id: 'biokaitra-opop-burnpell',
                groupId: 'granuliniai_degikliai',
                labels: loc4(
                    'Biokaitra / OPOP Biopel / BurnPell / Lazar',
                    'Biokaitra / OPOP Biopel / BurnPell / Lazar',
                    'Biokaitra / OPOP Biopel / BurnPell / Lazar',
                    'Biokaitra / OPOP Biopel / BurnPell / Lazar',
                ),
                shortChipLabels: loc4('Biokaitra / OPOP / Centrometal'),
                passport: {
                    modelTitle: loc4('Biokaitra, OPOP Biopel, BurnPell, Lazar ir Centrometal PelTec / CentroPelet'),
                    marketShareNote: loc4(
                        'Lietuviški Biokaitra šiaudų/medienos granulių katilai, čekiški OPOP Biopel ir kroatiški Centrometal PelTec / CentroPelet granuliniai katilai.',
                        'Lithuanian Biokaitra straw/wood pellet boilers, Czech OPOP Biopel and Croatian Centrometal PelTec / CentroPelet pellet boilers.',
                    ),
                    conversionOrUpgradeSummary: loc4(
                        'Pilnas Centrometal PelTec / CentroPelet / Cppl atsarginių dalių spektras (tenai, ardeliai, valdikliai CPREG, sraigtai CPSP, bunkeriai CPPT) bei universalūs tenai ir hidraulika Biokaitra / OPOP katilams.',
                        'Full Centrometal PelTec / CentroPelet / Cppl spare parts inventory (igniters, grates, CPREG controllers, CPSP augers, CPPT hoppers) plus universal igniters and hydronics for Biokaitra / OPOP.',
                    ),
                    recommendedSpecs: {
                        burnerKw: loc4('Centrometal PelTec 12–48 kW / Cppl 14–35 kW arba Megatherm MPB 20/28 kW'),
                        bufferTankLiters: loc4('Centrometal CAS arba Gorenje ZV 200–500 L akumuliacinė talpa'),
                        anticondensationValve: loc4('HERZ Teplomix DN25 / DN32 (61 °C) + cirkuliacinis siurblys Wilo'),
                        flueOrConnection: loc4('DN25 / DN32 / DN40 pajungimas, dūmtraukis Ø130–160 mm'),
                        typicalSpareParts: loc4('Centrometal tenas, ardelis CPDV, valdiklis CPREG, sraigtas CPSP, bunkeris CPPT, davikliai'),
                    },
                    vytautasPrompt: loc4(
                        'Turiu Biokaitra / OPOP Biopel / Centrometal granulinį katilą. Parinkite jam tinkančias atsargines dalis (teną, ardelį, sraigtą, valdiklį) ir hidraulikos mazgus.',
                    ),
                    matchingKeywords: ['Centrometal', 'PelTec', 'CentroPelet', 'CPPL', 'CPDV', 'CPREG', 'CPSP', 'CPPT', 'KatGr'],
                    matchingCategories: ['Katilai ir katilinės įranga', 'Degikliai ir priedai', 'Katilinės automatika ir pavaros'],
                    matchingSkus: ['1776613'],
                    sqlRegex: '(Centrometal|PelTec|CentroPelet|CPPL|CPDV|CPREG|CPSP|CPPT|KatGr|KatM|KatF)',
                },
            },
        ],
    },
    {
        id: 'silumos_siurbliai',
        stepNumber: 3,
        shortTabLabel: loc4(
            '3. Šilumos siurbliai Oras–Vanduo',
            '3. Air-to-Water Heat Pumps',
            '3. Pompy ciepła Powietrze–Woda',
            '3. Тепловые насосы Воздух–Вода',
        ),
        title: loc4(
            'Šilumos siurbliai Oras–Vanduo ir Geoterminiai Lietuvoje',
            'Air-to-Water and Geothermal Heat Pumps in Lithuania',
            'Pompy ciepła Powietrze–Woda i Geotermalne na Litwie',
            'Тепловые насосы Воздух–Вода и Геотермальные в Литве',
        ),
        subtitle: loc4(
            'Buferinėms Gorenje ZV talpoms, 3 eigų vožtuvams, boileriams su padidintu šilumokaičiu ir magnetiniams filtrams',
            'For Gorenje ZV buffer tanks, 3-way diverter valves, large-coil DHW cylinders and magnetic dirt separators',
            'Do buforów Gorenje ZV, zaworów 3-drogowych, bojlerów z dużą wężownicą i separatorów magnetycznych',
            'Для буферных емкостей Gorenje ZV, 3-ходовых клапанов, бойлеров с увеличенным теплообменником и магнитных сепараторов',
        ),
        models: [
            {
                id: 'haier-super-aqua-r290',
                groupId: 'silumos_siurbliai',
                labels: loc4(
                    'Haier Super Aqua Monoblokas R290 / R32 (5–16 kW)',
                    'Haier Super Aqua Monoblock R290 / R32 (5–16 kW)',
                    'Haier Super Aqua Monoblok R290 / R32 (5–16 kW)',
                    'Haier Super Aqua Моноблок R290 / R32 (5–16 кВт)',
                ),
                shortChipLabels: loc4('Haier Super Aqua R290'),
                passport: {
                    modelTitle: loc4('Haier Super Aqua Monoblokas R290 (GT) ir R32 (5 / 8 / 11 / 14 / 16 kW, A+++)'),
                    marketShareNote: loc4(
                        'Vienas sparčiausiai populiarėjančių A+++ klasės propano (R290) monoblokų Lietuvoje (dirba iki -25 °C, tiekia iki +75 °C be tenų, tinka APVA paramai).',
                        'One of the fastest-growing A+++ propane (R290) monoblocks in Lithuania (operates down to -25 °C, supplies up to +75 °C, APVA grant eligible).',
                    ),
                    conversionOrUpgradeSummary: loc4(
                        'Pilnas monobloko aprišimo komplektas: Haier Super Aqua R290 (AW052/082/112/162HVGHA) + privaloma Gorenje ZV 100–200 L buferinė talpa (atšildymo ciklui) + IMI Pneumatex Zeparo magnetinis purvo separatorius + ATW-A01 valdymo blokas.',
                        'Complete monoblock hydronic kit: Haier Super Aqua R290 (AW052/082/112/162HVGHA) + mandatory Gorenje ZV 100–200 L buffer tank (for defrost cycle) + IMI Pneumatex Zeparo magnetic separator + ATW-A01 PCB box.',
                    ),
                    recommendedSpecs: {
                        burnerKw: loc4('Haier Super Aqua R290: 5 kW, 8 kW, 11 kW, 14 kW arba 16 kW (1f / 3f)'),
                        bufferTankLiters: loc4('Gorenje ZV 100 L arba ZV 200 L buferinė talpa + Haier HP200/250M7 boileris'),
                        anticondensationValve: loc4('IMI Pneumatex Zeparo ZUM magnetinis purvo separatorius + anti-užšalimo vožtuvai'),
                        flueOrConnection: loc4('DN25 (1") hidraulinės jungtys, ATW-A01 valdymo dėžutė, HW-BA101ABT termostatas'),
                        typicalSpareParts: loc4('Valdymo blokas ATW-A01, buferinė talpa Gorenje ZV, magnetinis separatorius Zeparo, plėtimosi indas Aquapresso'),
                    },
                    vytautasPrompt: loc4(
                        'Domina Haier Super Aqua R290 monoblokas (5–16 kW). Parinkite tinkamos galios monobloką, Gorenje ZV buferinę talpą, boilerį ir Zeparo magnetinį separatorių.',
                    ),
                    matchingKeywords: ['Super Aqua', 'R290', 'AW0', 'ATW-A01', 'ZV 100', 'ZV 200', 'Zeparo', 'HP200', 'HP250'],
                    matchingCategories: ['Katilai ir katilinės įranga', 'Akumuliacinės talpos ir boileriai', 'Oro atskyrikliai ir nuorintuvai'],
                    matchingSkus: ['AW082HVGHA', 'AW112HVGHA', 'AW162HVGHA', 'ATW-A01'],
                    sqlRegex: '(Super Aqua|HVGHA|MUCHA|ATW-A01|ZV\\s*[12]00|HP(150|200|250|300)M|Zeparo.*ZUM)',
                },
            },
            {
                id: 'haier-hydro-split',
                groupId: 'silumos_siurbliai',
                labels: loc4(
                    'Haier Hydro Split / All-in-One ir Nordic Split',
                    'Haier Hydro Split / All-in-One & Nordic Split',
                    'Haier Hydro Split / All-in-One i Nordic Split',
                    'Haier Hydro Split / All-in-One и Nordic Split',
                ),
                shortChipLabels: loc4('Haier Hydro Split / Nordic'),
                passport: {
                    modelTitle: loc4('Haier Hydro Split, Hydro All-in-One (HU102F20) ir Nordic Oras–Oras (Jade / Flexis / Pearl)'),
                    marketShareNote: loc4(
                        'Populiarūs sprendimai naujos statybos A++ namams (Hydro All-in-One su integruotu 200 L nerūdijančio plieno boileriu) bei sodyboms (Nordic Oras–Oras iki -25/-30 °C).',
                        'Popular solutions for A++ new builds (Hydro All-in-One with integrated 200 L stainless DHW tank) and cottages (Nordic Air-to-Air down to -25/-30 °C).',
                    ),
                    conversionOrUpgradeSummary: loc4(
                        'Haier Hydro Split / All-in-One vidiniai ir išoriniai blokai (AU082/112FYCRA + HU102F20 / HU082WAMNA), Gorenje ZV 100 L buferinės talpos, grindinio šildymo kolektoriai bei Haier Nordic oro kondicionieriai.',
                        'Haier Hydro Split / All-in-One indoor and outdoor units (AU082/112FYCRA + HU102F20 / HU082WAMNA), Gorenje ZV 100 L buffer tanks, UFH manifolds and Haier Nordic air conditioners.',
                    ),
                    recommendedSpecs: {
                        burnerKw: loc4('Haier Hydro Split 6–10 kW arba Nordic Split 2,6–7,0 kW (Jade / Flexis / Pearl)'),
                        bufferTankLiters: loc4('Integruotas 200 L boileris (HU102F20) + Gorenje ZV 80–120 L buferinė talpa'),
                        anticondensationValve: loc4('IMI Pneumatex Zeparo separatorius + IMI Heimeier Dynacon kolektoriai'),
                        flueOrConnection: loc4('Šaltnešio vamzdynas 3/8" + 5/8", hidraulika DN25 (1")'),
                        typicalSpareParts: loc4('Antivibracinės įvorės, kondensato vonelės tenas, Zeparo separatorius, kambario termostatai'),
                    },
                    vytautasPrompt: loc4(
                        'Renkuosi Haier Hydro Split / All-in-One arba Nordic Split šilumos siurblį. Parinkite tinkamą komplektą ir montavimo mazgus.',
                    ),
                    matchingKeywords: ['Hydro', 'HU102', 'HU082', 'FYCRA', 'Jade', 'Flexis', 'Pearl', 'ZV 100'],
                    matchingCategories: ['Katilai ir katilinės įranga', 'Akumuliacinės talpos ir boileriai'],
                    matchingSkus: ['HU102F20', 'AU082FYCRA(HW)', 'AU112FYCRA(HW)'],
                    sqlRegex: '(HU102|HU082|HU162|FYCRA|Hydro|Jade|Flexis|Pearl|Nordic)',
                },
            },
            {
                id: 'panasonic-aquarea',
                groupId: 'silumos_siurbliai',
                labels: loc4(
                    'Panasonic Aquarea High Performance / T-CAP (5–16 kW)',
                    'Panasonic Aquarea High Performance / T-CAP (5–16 kW)',
                    'Panasonic Aquarea High Performance / T-CAP (5–16 kW)',
                    'Panasonic Aquarea High Performance / T-CAP (5–16 кВт)',
                ),
                shortChipLabels: loc4('Panasonic Aquarea T-CAP'),
                passport: {
                    modelTitle: loc4('Panasonic Aquarea High Performance ir T-CAP (5 / 7 / 9 / 12 / 16 kW šilumos siurbliai)'),
                    marketShareNote: loc4(
                        'Vienas plačiausiai Lietuvoje įrengtų oras–vanduo šilumos siurblių, reikalaujantis didelio debitinio pralaidumo, 100–200 L buferinės talpos ir magnetinio dumblo separatoriaus.',
                        'One of the most widely installed air-to-water heat pumps in Lithuania, requiring high flow rates, a 100–200 L buffer tank and magnetic dirt separation.',
                    ),
                    conversionOrUpgradeSummary: loc4(
                        'Pilnas hidraulinis aprišimas Panasonic Aquarea sistemai: privaloma Gorenje ZV 100–200 L buferinė talpa + IMI Pneumatex Zeparo magnetinis purvo ir oro separatorius + Dražice OKC NTR/HP boileris su padidintu šilumokaičiu + 3 eigų vožtuvas DN25.',
                        'Complete hydronic kit for Panasonic Aquarea: mandatory Gorenje ZV 100–200 L buffer tank + IMI Pneumatex Zeparo magnetic dirt & air separator + Dražice OKC NTR/HP large-coil cylinder + DN25 3-way diverter valve.',
                    ),
                    recommendedSpecs: {
                        burnerKw: loc4('Skirta 5–16 kW Panasonic Aquarea High Performance / T-CAP (K, L, M ir J kartoms)'),
                        bufferTankLiters: loc4('Gorenje ZV 100 L / ZV 200 L buferinė talpa + Dražice OKC 200–300 NTR/HP boileris'),
                        anticondensationValve: loc4('IMI Pneumatex Zeparo ZUM / ZUKM magnetinis separatorius DN25 (1") + 3 eigų vožtuvas'),
                        flueOrConnection: loc4('28 mm / DN25 (5/4" arba 1") hidraulinis pajungimas, srautas 20–45 l/min'),
                        typicalSpareParts: loc4('Magnetinis purvo separatorius Zeparo, 3 eigų perjungimo vožtuvas su pavara, Aquapresso plėtimosi indas, buferinė talpa ZV'),
                    },
                    vytautasPrompt: loc4(
                        'Turiu arba montuoju Panasonic Aquarea (5–16 kW) šilumos siurblį. Parinkite jam Gorenje ZV buferinę talpą, boilerį su padidintu šilumokaičiu, Zeparo magnetinį separatorių ir 3 eigų vožtuvą.',
                    ),
                    matchingKeywords: ['ZV 100', 'ZV 200', 'Zeparo', 'OKC', 'NTR', 'Aquapresso', 'Statico', 'trieig'],
                    matchingCategories: ['Akumuliacinės talpos ir boileriai', 'Oro atskyrikliai ir nuorintuvai', 'Plėtimosi indai ir slėgio palaikymas'],
                    matchingSkus: ['ZV100', 'ZV200', 'ATW-A01'],
                    sqlRegex: '(ZV\\s*[12]00|OKC.*NTR|Zeparo.*(ZUM|ZUK|ZUV).*25|Aquapresso|Statico\\s*SD)',
                },
            },
            {
                id: 'daikin-mitsubishi',
                groupId: 'silumos_siurbliai',
                labels: loc4(
                    'Daikin Altherma 3 / Mitsubishi Electric Zubadan & Ecodan',
                    'Daikin Altherma 3 / Mitsubishi Electric Zubadan & Ecodan',
                    'Daikin Altherma 3 / Mitsubishi Electric Zubadan i Ecodan',
                    'Daikin Altherma 3 / Mitsubishi Electric Zubadan и Ecodan',
                ),
                shortChipLabels: loc4('Daikin Altherma / Zubadan'),
                passport: {
                    modelTitle: loc4('Daikin Altherma 3 ir Mitsubishi Electric Zubadan / Ecodan šilumos siurbliai'),
                    marketShareNote: loc4(
                        'Populiarūs japoniški oras–vanduo šilumos siurbliai Lietuvos individualiuose namuose, kurių garantiniam darbui būtinas švarus kontūras (magnetinis filtras), buferinė talpa ir subalansuoti kolektoriai.',
                        'Popular Japanese air-to-water heat pumps in Lithuanian homes requiring clean primary circuits (magnetic filter), buffer storage and balanced manifolds.',
                    ),
                    conversionOrUpgradeSummary: loc4(
                        'Aprišimo ir modernizavimo mazgai Daikin Altherma / Mitsubishi Zubadan sistemoms: Gorenje ZV 100–200 L akumuliacinės talpos, IMI Pneumatex Zeparo cicloniniai separatoriai, IMI Heimeier Dynacon kolektoriai ir Danfoss pavaros.',
                        'Hydronic components for Daikin Altherma / Mitsubishi Zubadan: Gorenje ZV 100–200 L buffer tanks, IMI Pneumatex Zeparo cyclonic separators, IMI Heimeier Dynacon manifolds and Danfoss actuators.',
                    ),
                    recommendedSpecs: {
                        burnerKw: loc4('Skirta 4–16 kW Daikin Altherma 3 ir Mitsubishi Zubadan / Ecodan sistemoms'),
                        bufferTankLiters: loc4('Gorenje ZV 100–200 L buferinė talpa + Dražice OKC / Gorenje boileris'),
                        anticondensationValve: loc4('IMI Pneumatex Zeparo magnetinis purvo ir mikromullų separatorius DN25'),
                        flueOrConnection: loc4('DN25 (1") magistralė, IMI Heimeier Dynacon Eclipse grindinio šildymo kolektorius'),
                        typicalSpareParts: loc4('Zeparo magnetinis separatorius, Dynacon kolektorius, 230V/24V pavaros EMO T / TWA, plėtimosi indas'),
                    },
                    vytautasPrompt: loc4(
                        'Montuoju arba aptarnauju Daikin Altherma / Mitsubishi Zubadan šilumos siurblį. Parinkite Gorenje ZV buferinę talpą, Zeparo magnetinį separatorių ir grindinio šildymo kolektorius.',
                    ),
                    matchingKeywords: ['ZV 100', 'ZV 200', 'Zeparo', 'Dynacon', 'EMO', 'TWA', 'OKC'],
                    matchingCategories: ['Akumuliacinės talpos ir boileriai', 'Oro atskyrikliai ir nuorintuvai', 'Grindinis šildymas ir kolektoriai'],
                    matchingSkus: ['ZV100', 'ZV200'],
                    sqlRegex: '(ZV\\s*[12]00|Zeparo.*25|Dynacon|EMO\\s*T|TWA-|OKC\\s*200)',
                },
            },
            {
                id: 'nibe-ctc-vaillant',
                groupId: 'silumos_siurbliai',
                labels: loc4(
                    'NIBE F2120 / S2125 / Vaillant aroTHERM / Viessmann Vitocal',
                    'NIBE F2120 / S2125 / Vaillant aroTHERM / Viessmann Vitocal',
                    'NIBE F2120 / S2125 / Vaillant aroTHERM / Viessmann Vitocal',
                    'NIBE F2120 / S2125 / Vaillant aroTHERM / Viessmann Vitocal',
                ),
                shortChipLabels: loc4('NIBE / Vaillant / Vitocal'),
                passport: {
                    modelTitle: loc4('NIBE F2120 / S2125 / S1155, CTC, Vaillant aroTHERM plus ir Viessmann Vitocal'),
                    marketShareNote: loc4(
                        'Skandinaviški ir vokiški geoterminiai bei oras–vanduo šilumos siurbliai (R290 / inverteriniai), reikalaujantys aukščiausios klasės Šveicarijos ir Vokietijos hidraulikos (IMI Pneumatex, IMI TA, Viessmann, Wilo).',
                        'Scandinavian and German geothermal and air-to-water heat pumps requiring Swiss and German hydronics (IMI Pneumatex, IMI TA, Viessmann, Wilo).',
                    ),
                    conversionOrUpgradeSummary: loc4(
                        'Viessmann Vitocal ir NIBE / Vaillant sistemų komponentai: Viessmann priedai, IMI Pneumatex Statico / Aquapresso plėtimosi indai, Zeparo separatoriai, Wilo cirkuliaciniai siurbliai ir Gorenje ZV buferinės talpos.',
                        'Viessmann Vitocal and NIBE / Vaillant system components: Viessmann accessories, IMI Pneumatex Statico / Aquapresso vessels, Zeparo separators, Wilo circulation pumps and Gorenje ZV buffer tanks.',
                    ),
                    recommendedSpecs: {
                        burnerKw: loc4('Skirta 6–20 kW NIBE, Vaillant aroTHERM ir Viessmann Vitocal 200-S / 250-A'),
                        bufferTankLiters: loc4('Gorenje ZV 100–300 L buferinė talpa + Pneumatex Aquapresso geriamo vandens indas'),
                        anticondensationValve: loc4('IMI TA STAD / TBV-C balansiniai vožtuvai + IMI Pneumatex Zeparo separatorius'),
                        flueOrConnection: loc4('DN25 / DN32 variniai arba presuojami SANHA vamzdynai ir jungtys'),
                        typicalSpareParts: loc4('Wilo Yonos / Stratos PICO siurbliai, Viessmann davikliai, Zeparo nuorintojai, Statico indai'),
                    },
                    vytautasPrompt: loc4(
                        'Turiu NIBE / Vaillant aroTHERM / Viessmann Vitocal šilumos siurblį. Parinkite suderinamus Viessmann mazgus, Wilo cirkuliacinį siurblį, Pneumatex indą ir buferinę talpą.',
                    ),
                    matchingKeywords: ['Vitocal', 'Viessmann', 'Wilo', 'Zeparo', 'Aquapresso', 'ZV 100', 'ZV 200'],
                    matchingCategories: ['Katilai ir katilinės įranga', 'Oro atskyrikliai ir nuorintuvai', 'Plėtimosi indai ir slėgio palaikymas'],
                    matchingSkus: ['ZV200', 'ZV300'],
                    sqlRegex: '(Vitocal|Wilo.*(PICO|Para|Stratos)|Zeparo.*25|Aquapresso|ZV\\s*[123]00)',
                },
            },
            {
                id: 'gree-midea-samsung',
                groupId: 'silumos_siurbliai',
                labels: loc4(
                    'Gree Versati / Midea M-Thermal / Samsung EHS / LG Therma V',
                    'Gree Versati / Midea M-Thermal / Samsung EHS / LG Therma V',
                    'Gree Versati / Midea M-Thermal / Samsung EHS / LG Therma V',
                    'Gree Versati / Midea M-Thermal / Samsung EHS / LG Therma V',
                ),
                shortChipLabels: loc4('Gree / Midea / Samsung / LG'),
                passport: {
                    modelTitle: loc4('Gree Versati, Midea M-Thermal, Samsung EHS ir LG Therma V šilumos siurbliai'),
                    marketShareNote: loc4(
                        'Plačiai Lietuvos kotedžuose ir naujos statybos namuose montuojami ekonomiški oras–vanduo šilumos siurbliai, kuriems dažnai trūksta buferinės talpos ir kokybiško karšto vandens boilerio.',
                        'Widely installed residential air-to-water heat pumps in Lithuanian townhomes and new builds that need proper buffer storage and high-efficiency DHW cylinders.',
                    ),
                    conversionOrUpgradeSummary: loc4(
                        'Pilnas katilinės aprišimas arba pakeitimas į Haier Super Aqua R290: Gorenje ZV 100–200 L buferinės talpos, Haier HP R290 boileriai su integruotu šilumos siurbliu, Comisa PEX-AL-PEX jungtys ir Danfoss automatika.',
                        'Complete boiler room hydronics or upgrade to Haier Super Aqua R290: Gorenje ZV 100–200 L buffer tanks, Haier HP R290 heat pump water heaters, Comisa press fittings and Danfoss controls.',
                    ),
                    recommendedSpecs: {
                        burnerKw: loc4('Skirta 6–16 kW Gree / Midea / Samsung / LG arba keitimui į Haier Super Aqua R290'),
                        bufferTankLiters: loc4('Gorenje ZV 100–200 L buferinė talpa + Haier HP150/200/250M7 boileris'),
                        anticondensationValve: loc4('IMI Pneumatex Zeparo purvo separatorius + Watts apsauginė grupė'),
                        flueOrConnection: loc4('DN25 (1") srieginės ir Comisa presuojamos jungtys 26×3 / 32×3 mm'),
                        typicalSpareParts: loc4('Buferinė talpa Gorenje ZV, nuorintojas Zeparo, 3 eigų vožtuvas, kambario termostatai Danfoss Icon'),
                    },
                    vytautasPrompt: loc4(
                        'Montuoju Gree / Midea / Samsung / LG šilumos siurblį. Parinkite tinkamą Gorenje ZV buferinę talpą, boilerį, Zeparo purvo separatorių ir jungtis.',
                    ),
                    matchingKeywords: ['ZV 100', 'ZV 200', 'HP150', 'HP200', 'HP250', 'Zeparo', 'Icon', 'Watts'],
                    matchingCategories: ['Akumuliacinės talpos ir boileriai', 'Oro atskyrikliai ir nuorintuvai', 'Grindinis šildymas ir kolektoriai'],
                    matchingSkus: ['AW082HVGHA', 'AW112HVGHA'],
                    sqlRegex: '(ZV\\s*[12]00|HP(150|200|250)M|Zeparo.*2[05]|Danfoss\\s*Icon|AW(082|112)HVGHA)',
                },
            },
        ],
    },
    {
        id: 'dujiniai_elektriniai_mazgai',
        stepNumber: 4,
        shortTabLabel: loc4(
            '4. Dujiniai / Elektriniai ir Šildymo sistemos',
            '4. Gas / Electric & Heating Systems',
            '4. Kotły gazowe / elektryczne i instalacje',
            '4. Газовые / электрические котлы и системы',
        ),
        title: loc4(
            'Dujiniai, Elektriniai katilai ir Šildymo Mazgai Lietuvoje',
            'Gas, Electric Boilers and Heating Assemblies in Lithuania',
            'Kotły gazowe, elektryczne i węzły grzewcze na Litwie',
            'Газовые, электрические котлы и отопительные узлы в Литве',
        ),
        subtitle: loc4(
            'Kondensaciniams katilams, elektriniam šildymui, radiatoriams (22K / 22VK), grindiniam šildymui ir balansavimui',
            'For condensing boilers, electric heating, radiators (22K / 22VK), underfloor heating and hydronic balancing',
            'Do kotłów kondensacyjnych, ogrzewania elektrycznego, grzejników (22K / 22VK), podłogówki i równoważenia',
            'Для конденсационных котлов, электроотопления, радиаторов (22K / 22VK), теплого пола и балансировки',
        ),
        models: [
            {
                id: 'viessmann-vitodens-bosch',
                groupId: 'dujiniai_elektriniai_mazgai',
                labels: loc4(
                    'Viessmann Vitodens / Bosch Condens / Junkers dujiniai katilai',
                    'Viessmann Vitodens / Bosch Condens / Junkers gas boilers',
                    'Kotły gazowe Viessmann Vitodens / Bosch Condens / Junkers',
                    'Газовые котлы Viessmann Vitodens / Bosch Condens / Junkers',
                ),
                shortChipLabels: loc4('Viessmann Vitodens / Junkers'),
                passport: {
                    modelTitle: loc4('Viessmann Vitodens 050-W / 100-W / 200-W, Bosch Condens ir Junkers Cerapur dujiniai katilai'),
                    marketShareNote: loc4(
                        'Populiariausi kondensaciniai dujiniai katilai Vilniaus, Kauno ir Klaipėdos dujofikuotuose rajonuose – mūsų sandėlyje virš 360 originalių Viessmann ir Junkers pozicijų.',
                        'Most popular condensing gas boilers in gasified districts of Vilnius, Kaunas and Klaipėda – over 360 genuine Viessmann and Junkers items in our stock.',
                    ),
                    conversionOrUpgradeSummary: loc4(
                        'Originalūs Viessmann Vitodens ir Junkers katilai, koaksialiniai dūmtraukiai Ø60/100 ir Ø80/125, Viessmann jutikliai, hidrauliniai indai, Dražice OKC netiesioginiai boileriai ir Zeparo magnetiniai filtrai.',
                        'Genuine Viessmann Vitodens and Junkers boilers, Ø60/100 and Ø80/125 coaxial flue kits, Viessmann sensors, expansion vessels, Dražice OKC indirect cylinders and Zeparo magnetic filters.',
                    ),
                    recommendedSpecs: {
                        burnerKw: loc4('Viessmann Vitodens 100-W / 200-W (11–35 kW) ir Junkers kondensaciniai mazgai'),
                        bufferTankLiters: loc4('Netiesioginio šildymo boileris Dražice OKC 125–200 NTR arba Viessmann Vitocell'),
                        anticondensationValve: loc4('IMI Pneumatex Zeparo ZUM magnetinis purvo separatorius DN20 / DN25'),
                        flueOrConnection: loc4('Koaksialinis dūmtraukis Ø60/100 mm, hidraulika DN20 (3/4")'),
                        typicalSpareParts: loc4('Viessmann jonizacijos ir uždegimo elektrodai, NTC davikliai, dūmtraukio alkūnės, plėtimosi indai'),
                    },
                    vytautasPrompt: loc4(
                        'Turiu arba renkuosi Viessmann Vitodens / Bosch Condens / Junkers dujinį katilą. Parinkite originalias Viessmann / Junkers dalis, dūmtraukio elementus arba boilerį.',
                    ),
                    matchingKeywords: ['Viessmann', 'Vitodens', 'Vitocell', 'Junkers', 'Cerapur'],
                    matchingCategories: ['Katilai ir katilinės įranga', 'Katilinės automatika ir pavaros', 'Akumuliacinės talpos ir boileriai'],
                    matchingSkus: ['Z025702', '7956565'],
                    sqlRegex: '(Viessmann|Vitodens|Vitocell|Junkers|Cerapur)',
                },
            },
            {
                id: 'vaillant-protherm-baxi',
                groupId: 'dujiniai_elektriniai_mazgai',
                labels: loc4(
                    'Vaillant ecoTEC / Protherm / Baxi / Ariston dujiniai katilai',
                    'Vaillant ecoTEC / Protherm / Baxi / Ariston gas boilers',
                    'Kotły gazowe Vaillant ecoTEC / Protherm / Baxi / Ariston',
                    'Газовые котлы Vaillant ecoTEC / Protherm / Baxi / Ariston',
                ),
                shortChipLabels: loc4('Vaillant / Protherm / Baxi'),
                passport: {
                    modelTitle: loc4('Vaillant ecoTEC, Protherm Gepard / Lynx, Baxi Luna / Nuvola ir Ariston Genus dujiniai katilai'),
                    marketShareNote: loc4(
                        'Daugiabučiuose ir kotedžuose plačiai montuojami sieniniai kondensaciniai dujiniai katilai, kurių siauri plokšteliniai šilumokaičiai reikalauja magnetinio purvo separatoriaus ir tikslaus balansavimo.',
                        'Wall-hung condensing gas boilers widely installed in apartments and townhomes whose compact plate heat exchangers require magnetic filtration and precise balancing.',
                    ),
                    conversionOrUpgradeSummary: loc4(
                        'Katilinės ir sistemos apsaugos komplektas dujiniam katilui: IMI Pneumatex Zeparo magnetinis purvo ir oro separatorius + Zilmet / Pneumatex plokščias ar cilindrinis plėtimosi indas + Wilo Para / Yonos PICO siurblys + Danfoss termostatika.',
                        'System protection kit for gas boilers: IMI Pneumatex Zeparo magnetic dirt & air separator + Zilmet / Pneumatex expansion vessel + Wilo Para / Yonos PICO pump + Danfoss thermostatics.',
                    ),
                    recommendedSpecs: {
                        burnerKw: loc4('Skirta 12–35 kW sieniniams dujiniams katilams (Vaillant, Protherm, Baxi, Ariston)'),
                        bufferTankLiters: loc4('Dražice OKC 100–160 NTR netiesioginis boileris + Zilmet plėtimosi indas 12–24 L'),
                        anticondensationValve: loc4('IMI Pneumatex Zeparo ZUM DN20 (3/4") magnetinis separatorius + Watts apsauginis vožtuvas'),
                        flueOrConnection: loc4('DN20 (3/4") šildymo kontūras, DN15 (1/2") karšto vandens kontūras'),
                        typicalSpareParts: loc4('Zilmet plėtimosi indas, Wilo cirkuliacinis siurblys, Zeparo magnetinis filtras, automatinis nuorintojas'),
                    },
                    vytautasPrompt: loc4(
                        'Turiu Vaillant / Protherm / Baxi / Ariston dujinį katilą. Parinkite jam Zeparo magnetinį filtrą, Zilmet plėtimosi indą, Wilo siurblį ir netiesioginį boilerį.',
                    ),
                    matchingKeywords: ['Zilmet', 'Zeparo', 'Wilo', 'OKC', 'Watts'],
                    matchingCategories: ['Plėtimosi indai ir slėgio palaikymas', 'Oro atskyrikliai ir nuorintuvai', 'Akumuliacinės talpos ir boileriai'],
                    matchingSkus: ['11A0001800', '11A0002400'],
                    sqlRegex: '(Zilmet|Zeparo.*DN20|Wilo.*PICO|OKC\\s*1[026]0)',
                },
            },
            {
                id: 'haier-es-kospell-elektra',
                groupId: 'dujiniai_elektriniai_mazgai',
                labels: loc4(
                    'Haier ES 10–100V / Kospell / Protherm Ray elektriniai katilai',
                    'Haier ES 10–100V / Kospell / Protherm Ray electric boilers',
                    'Kotły elektryczne Haier ES 10–100V / Kospell / Protherm Ray',
                    'Электрические котлы Haier ES 10–100V / Kospell / Protherm Ray',
                ),
                shortChipLabels: loc4('Elektriniai katilai / Boileriai'),
                passport: {
                    modelTitle: loc4('Haier ES, Viessmann Vitotron 100, Kospell EKCO ir Protherm Ray elektriniai katilai bei šildytuvai'),
                    marketShareNote: loc4(
                        'Pagrindinis šildymo ir karšto vandens sprendimas namams su saulės elektrine (ESO gaminantiems vartotojams) arba kaip rezervinis šaltinis šalia kieto kuro / šilumos siurblio.',
                        'Primary heating and DHW solution for homes with solar PV (prosumers) or as backup heat source alongside solid fuel / heat pumps.',
                    ),
                    conversionOrUpgradeSummary: loc4(
                        'Elektriniai šildymo katilai (Viessmann Vitotron 100), elektriniai vandens šildytuvai Haier ES 10V–100V, Gorenje TGR / GT ir Dražice OKCE / OKHE bei 2–6 kW elektriniai tenai akumuliacinėms talpoms.',
                        'Electric heating boilers (Viessmann Vitotron 100), electric water heaters Haier ES 10V–100V, Gorenje TGR / GT and Dražice OKCE / OKHE plus 2–6 kW immersion heaters for buffer tanks.',
                    ),
                    recommendedSpecs: {
                        burnerKw: loc4('Viessmann Vitotron 4–8 kW elektrinis katilas arba 2–9 kW kaitinimo tenai į talpas'),
                        bufferTankLiters: loc4('Haier ES10V–ES100V, Gorenje TGR 30–150 L arba Dražice OKCE 80–200 L'),
                        anticondensationValve: loc4('Apsauginis vožtuvas 6 bar (boileriams) + Aquapresso plėtimosi indas 8–18 L'),
                        flueOrConnection: loc4('230 V (1f) arba 400 V (3f) maitinimas, G 1/2" – G 3/4" vandentiekio jungtys'),
                        typicalSpareParts: loc4('Magnio anodas, boilerio flanšo tarpinė, kaitinimo tenas 2,0–6,0 kW, termostatas'),
                    },
                    vytautasPrompt: loc4(
                        'Ieškau elektrinio šildymo katilo, elektrinio vandens šildytuvo (Haier ES / Gorenje / Dražice) arba elektrinio teno į akumuliacinę talpą.',
                    ),
                    matchingKeywords: ['Vitotron', 'ES10V', 'ES15V', 'ES30V', 'ES50V', 'ES80V', 'ES100V', 'OKCE', 'OKHE', 'TGR'],
                    matchingCategories: ['Katilai ir katilinės įranga', 'Akumuliacinės talpos ir boileriai'],
                    matchingSkus: ['ES50V-F1(EU)', 'ES80V-F1(EU)', 'ES100V-F1(EU)'],
                    sqlRegex: '(Vitotron|ES(10|15|30|50|80|100)V|OKCE|OKHE|TGR\\s*\\d|elektrin.*katil|elektrinis vandens)',
                },
            },
            {
                id: 'radiatorine-sistema-dn15',
                groupId: 'dujiniai_elektriniai_mazgai',
                labels: loc4(
                    'Radiatorinė namo šildymo sistema (Aliumininiai / Plieniniai 22K / 22VK)',
                    'Radiator home heating system (Aluminum / Steel 22K / 22VK)',
                    'System grzejnikowy domu (Aluminiowe / Stalowe 22K / 22VK)',
                    'Радиаторная система отопления дома (Алюминиевые / Стальные 22K / 22VK)',
                ),
                shortChipLabels: loc4('Radiatorinė sistema (22K / 22VK)'),
                passport: {
                    modelTitle: loc4('Radiatorinė namo šildymo sistema (Plieniniai Tipas 22 K / 22 VK ir Aliumininiai Ferroli POL)'),
                    marketShareNote: loc4(
                        'Klasikinė ir renovuojama Lietuvos namų bei butų šildymo sistema: plieniniai plokštiniai radiatoriai (šoninis K ir apatinis VK 50 mm pajungimas) bei sekcijiniai aliumininiai radiatoriai.',
                        'Classic and renovated Lithuanian house and apartment heating system: steel panel radiators (side K and bottom VK 50 mm connection) and sectional aluminum radiators.',
                    ),
                    conversionOrUpgradeSummary: loc4(
                        'Pilnas radiatorių ir jų aprišimo komplektas: plieniniai 22K / 22VK arba Ferroli POL aliumininiai radiatoriai + Danfoss RA-N / IMI Heimeier Eclipse termostatiniai vožtuvai su automatinio srauto ribojimo funkcija + Vekolux H-blokai + termogalvutės.',
                        'Complete radiator and valve package: steel 22K / 22VK or Ferroli POL aluminum radiators + Danfoss RA-N / IMI Heimeier Eclipse automatic flow-limiting thermostatic valves + Vekolux H-blocks + thermostatic heads.',
                    ),
                    recommendedSpecs: {
                        burnerKw: loc4('Radiatorių galia 500–3000 W pagal patalpos plotą (EN 442, ΔT 50K / ΔT 30K)'),
                        bufferTankLiters: loc4('Automatinis srauto balansavimas su IMI Heimeier Eclipse (10–150 l/h) be papildomų balansinių vožtuvų'),
                        anticondensationValve: loc4('IMI Heimeier Vekolux / Multilux apatinio pajungimo mazgai (50 mm) arba Danfoss RA-N DN15'),
                        flueOrConnection: loc4('Šoninis G 1/2" (DN15) arba apatinis G 3/4" eurokonusas (50 mm tarp centrų), sriegis M30×1,5 / RA Click'),
                        typicalSpareParts: loc4('Termogalvutė K / Aero, Vekolux binoklis, ferroli radiatorių montavimo komplektas 1/2", laikančios gembės'),
                    },
                    vytautasPrompt: loc4(
                        'Komplektuoju arba atnaujinu namo radiatorinę šildymo sistemą. Parinkite radiatorius (22K / 22VK arba aliumininius), termostatinius vožtuvus, apatinio pajungimo binoklius ir termogalvutes.',
                    ),
                    matchingKeywords: ['GI-RAD-22', 'POL', 'Vekolux', 'Multilux', 'Eclipse', 'RA-N', 'Aero', 'GI-FERROLI'],
                    matchingCategories: ['Radiatoriai ir konvektoriai', 'Termostatinės galvutės ir vožtuvai'],
                    matchingSkus: ['GI-RAD-22K-600-1000', 'GI-RAD-22VK-600-1000', 'GI-FERROLI-KOMPL-12'],
                    sqlRegex: '(GI-RAD-22|^POL[./-]|GI-FERROLI|Vekolux|Multilux|Eclipse.*DN15|RA-N.*15|013G)',
                },
            },
            {
                id: 'grindinio-sildymo-sistema',
                groupId: 'dujiniai_elektriniai_mazgai',
                labels: loc4(
                    'Grindinio šildymo kolektorinė sistema (2–12 kontūrų)',
                    'Underfloor heating manifold system (2–12 loops)',
                    'System rozdzielaczowy ogrzewania podłogowego (2–12 obwodów)',
                    'Коллекторная система теплого пола (2–12 контуров)',
                ),
                shortChipLabels: loc4('Grindinis šildymas (2–12 kont.)'),
                passport: {
                    modelTitle: loc4('Grindinio šildymo kolektorinė sistema (2–12 kontūrų su automatiniu srauto balansavimu)'),
                    marketShareNote: loc4(
                        'Pagrindinė naujos statybos ir renovuojamų A++ klasės namų Lietuvoje šildymo sistema, dirbanti žemoje 28–38 °C padavimo temperatūroje.',
                        'Primary heating distribution system in Lithuanian A++ new builds and renovations operating at low 28–38 °C supply temperatures.',
                    ),
                    conversionOrUpgradeSummary: loc4(
                        'Pilnas grindinio šildymo mazgas: nerūdijančio plieno kolektorius IMI Heimeier Dynacon Eclipse (su automatiniu srauto reguliavimu l/h) + 230 V / 24 V termoelektrinės pavaros EMO T / Danfoss TWA + kambario termostatai Danfoss Icon + Comisa 16×2 mm vamzdžiai ir eurokonusai.',
                        'Complete underfloor heating assembly: stainless manifold IMI Heimeier Dynacon Eclipse (with automatic flow control) + 230 V / 24 V thermal actuators EMO T / Danfoss TWA + Danfoss Icon room thermostats + Comisa 16×2 mm pipes and eurocones.',
                    ),
                    recommendedSpecs: {
                        burnerKw: loc4('2–12 kontūrų kolektoriai (30–250 m² šildomam plotui, 60–100 m vamzdžio vienam kontūrui)'),
                        bufferTankLiters: loc4('Gorenje ZV 100–200 L buferinė talpa (kai kontūrus valdo pavaros su kambario termostatais)'),
                        anticondensationValve: loc4('Pamaišymo mazgas FHM arba IMI Heimeier Multibox K-RTL vieno kontūro grįžtamo srauto ribotojas'),
                        flueOrConnection: loc4('Kolektorius 1" su G 3/4" eurokonusais (16×2,0 mm arba 20×2,0 mm vamzdžiui), pavaros M30×1,5'),
                        typicalSpareParts: loc4('Termoelektrinė pavara EMO T / TWA 230V NC, eurokonuso jungtys 16×2, Multibox K-RTL dėžutė, debitomačiai'),
                    },
                    vytautasPrompt: loc4(
                        'Komplektuoju grindinio šildymo sistemą (2–12 kontūrų). Parinkite nerūdijančio plieno kolektorių Dynacon, pavaras, kambario termostatus, vamzdžius ir eurokonuso jungtis.',
                    ),
                    matchingKeywords: ['Dynacon', 'Dynalux', 'Multibox', 'EMO', 'TWA', 'Icon', 'eurokonus', 'kolektor'],
                    matchingCategories: ['Grindinis šildymas ir kolektoriai', 'Termostatinės galvutės ir vožtuvai'],
                    matchingSkus: ['088U0625', '1807-00.500'],
                    sqlRegex: '(Dynacon|Dynalux|Multibox|EMO\\s*T|TWA-|Danfoss\\s*Icon|eurokonus|kolektor)',
                },
            },
        ],
    },
];

export const LITHUANIAN_BOILER_SYSTEM_MODELS: LithuanianBoilerSystemModel[] =
    BOILER_SYSTEM_GROUPS.flatMap((group) =>
        group.models.map((mdl) => {
            const meta = resolveBoilerProfileVerificationMeta(mdl.id);
            mdl.verificationStatus = meta.verificationStatus;
            mdl.sourceKind = meta.sourceKind;
            mdl.verificationBadgeLabel = meta.verificationBadgeLabel;
            return mdl;
        }),
    );

export const LITHUANIAN_BOILER_PROFILES = LITHUANIAN_BOILER_SYSTEM_MODELS;

const MODEL_BY_ID = new Map<string, LithuanianBoilerSystemModel>(
    LITHUANIAN_BOILER_SYSTEM_MODELS.map((model) => [model.id.toLowerCase(), model]),
);

const GROUP_BY_ID = new Map<BoilerSystemGroupId, BoilerSystemGroup>(
    BOILER_SYSTEM_GROUPS.map((group) => [group.id, group]),
);

export function getBoilerSystemModelById(id?: string | null): LithuanianBoilerSystemModel | undefined {
    if (!id) return undefined;
    return MODEL_BY_ID.get(id.trim().toLowerCase());
}

export function getBoilerSystemGroupById(
    groupId?: BoilerSystemGroupId | string | null,
): BoilerSystemGroup | undefined {
    if (!groupId) return undefined;
    return GROUP_BY_ID.get(groupId.trim() as BoilerSystemGroupId);
}

export const BOILER_GROUP_EXCLUDED_REGEX: Record<BoilerSystemGroupId, string> = {
    kieto_kuro_seni:
        '(oro kondicionier|kondicionieriaus|split\\s+vidinis\\s+blokas|split\\s+išorinis\\s+blokas|oras[-–]oras|kasetinis\\s+vidinis|kanalinis\\s+vidinis|konsolinis|mrv\\s+vrf|\\bjade\\b|\\bflexis\\b|\\bpearl\\b|\\brevive\\b|\\btundra\\b|\\bfreon)',
    granuliniai_degikliai:
        '(oro kondicionier|kondicionieriaus|split\\s+vidinis\\s+blokas|split\\s+išorinis\\s+blokas|oras[-–]oras|kasetinis\\s+vidinis|kanalinis\\s+vidinis|konsolinis|mrv\\s+vrf|\\bjade\\b|\\bflexis\\b|\\bpearl\\b|\\brevive\\b|\\btundra\\b|\\bfreon)',
    silumos_siurbliai:
        '(\\bdegikl|degkmpl|\\bmpb\\b|pelet-set|ardel|cpdv|\\bšnek|\\bsnek|sraigt|cpsp|bunker|cppt|uždegimo\\s+ten|uzdegimo\\s+ten|\\bkatgr\\b|\\bkatm\\b|\\bkatf\\b|egip-gli|purkštuk|purkstuk|\\b030[fhb]\\b|kieto\\s+kuro\\s+katil|malkinis\\s+katil|granulinis\\s+katil|eko-ck|peltec|centroplus|biopel|ponast\\s+kp|viadrus|stropuva|kalvis)',
    dujiniai_elektriniai_mazgai:
        '(granulių\\s+degikl|degiklio\\s+komplekt|degkmpl|\\bmpb\\b|pelet-set|ardel|cpdv|\\bšnek|\\bsnek|sraigt|cpsp|granulių\\s+bunker|cppt|uždegimo\\s+ten|uzdegimo\\s+ten|\\bkatgr\\b|\\bkatm\\b|\\bkatf\\b|egip-gli|kieto\\s+kuro\\s+katil|malkinis\\s+katil|granulinis\\s+katil|eko-ck|peltec|centroplus|oro kondicionier|split\\s+vidinis\\s+blokas|oras[-–]oras)',
};

export function getBoilerExcludedRegex(model: LithuanianBoilerSystemModel): string {
    if (model.passport.excludedRegex) {
        return model.passport.excludedRegex;
    }
    if (model.groupId === 'silumos_siurbliai' && model.id !== 'haier-hydro-split') {
        return `${BOILER_GROUP_EXCLUDED_REGEX.silumos_siurbliai.slice(0, -1)}|oro kondicionier|split\\s+vidinis\\s+blokas|oras[-–]oras|\\bjade\\b|\\bflexis\\b|\\bpearl\\b)`;
    }
    return BOILER_GROUP_EXCLUDED_REGEX[model.groupId];
}

export function resolveBoilerCompatibilityPassport(
    boilerId?: string | null,
    locale: BoilerCompatLocale = 'lt',
): ResolvedEngineeringCompatibilityPassport | undefined {
    const model = getBoilerSystemModelById(boilerId);
    if (!model) return undefined;
    const group = getBoilerSystemGroupById(model.groupId);
    const p = model.passport;
    const meta = resolveBoilerProfileVerificationMeta(model.id);
    return {
        id: model.id,
        groupId: model.groupId,
        groupTitle: group?.title[locale] || group?.title.lt || '',
        modelTitle: p.modelTitle[locale] || p.modelTitle.lt,
        shortChipLabel: model.shortChipLabels[locale] || model.shortChipLabels.lt,
        marketShareNote: p.marketShareNote[locale] || p.marketShareNote.lt,
        conversionOrUpgradeSummary:
            p.conversionOrUpgradeSummary[locale] || p.conversionOrUpgradeSummary.lt,
        recommendedSpecs: {
            burnerKw: p.recommendedSpecs.burnerKw[locale] || p.recommendedSpecs.burnerKw.lt,
            bufferTankLiters:
                p.recommendedSpecs.bufferTankLiters[locale] || p.recommendedSpecs.bufferTankLiters.lt,
            anticondensationValve:
                p.recommendedSpecs.anticondensationValve[locale] ||
                p.recommendedSpecs.anticondensationValve.lt,
            flueOrConnection:
                p.recommendedSpecs.flueOrConnection[locale] || p.recommendedSpecs.flueOrConnection.lt,
            typicalSpareParts:
                p.recommendedSpecs.typicalSpareParts[locale] ||
                p.recommendedSpecs.typicalSpareParts.lt,
        },
        vytautasPrompt: p.vytautasPrompt[locale] || p.vytautasPrompt.lt,
        matchingKeywords: p.matchingKeywords,
        matchingCategories: p.matchingCategories,
        matchingSkus: p.matchingSkus,
        sqlRegex: p.sqlRegex,
        excludedRegex: getBoilerExcludedRegex(model),
        verificationStatus: meta.verificationStatus,
        sourceKind: meta.sourceKind,
        verificationBadgeLabel: meta.verificationBadgeLabel,
    };
}

function normalizeSkuCode(sku: string): string {
    return (sku || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function doesProductMatchBoilerSystem(
    product: Pick<ListingProduct, 'sku' | 'name' | 'nameLt' | 'brandName' | 'categoryName'>,
    boilerId: string,
    extraText?: string | null,
): { matches: boolean; pinnedRank: number } {
    const model = getBoilerSystemModelById(boilerId);
    if (!model) {
        return { matches: true, pinnedRank: 999 };
    }
    const hay = `${product.sku || ''} ${product.nameLt || ''} ${product.name || ''} ${product.brandName || ''} ${product.categoryName || ''} ${extraText || ''}`;
    const excludedPattern = getBoilerExcludedRegex(model);
    if (excludedPattern && new RegExp(excludedPattern, 'i').test(hay)) {
        return { matches: false, pinnedRank: 999 };
    }

    const normSku = normalizeSkuCode(product.sku);
    const pinIdx = model.passport.matchingSkus.findIndex(
        (targetSku) => normalizeSkuCode(targetSku) === normSku,
    );
    if (pinIdx >= 0) {
        return { matches: true, pinnedRank: pinIdx };
    }

    const regex = new RegExp(model.passport.sqlRegex, 'i');
    if (regex.test(hay)) {
        return { matches: true, pinnedRank: 100 };
    }

    const hayLower = hay.toLowerCase();
    for (const kw of model.passport.matchingKeywords) {
        if (kw && hayLower.includes(kw.toLowerCase())) {
            return { matches: true, pinnedRank: 200 };
        }
    }

    return { matches: false, pinnedRank: 999 };
}

export function filterProductsByBoilerCompatibility<
    T extends Pick<ListingProduct, 'sku' | 'name' | 'nameLt' | 'brandName' | 'categoryName'>,
>(products: T[], boilerId?: string | null): T[] {
    if (!boilerId || boilerId === 'all' || boilerId === 'visi') {
        return products;
    }
    const model = getBoilerSystemModelById(boilerId);
    if (!model) {
        return products;
    }

    const scored: Array<{ item: T; rank: number; idx: number }> = [];
    for (let i = 0; i < products.length; i++) {
        const p = products[i];
        const res = doesProductMatchBoilerSystem(p, model.id);
        if (res.matches) {
            scored.push({ item: p, rank: res.pinnedRank, idx: i });
        }
    }

    scored.sort((a, b) => {
        if (a.rank !== b.rank) return a.rank - b.rank;
        return a.idx - b.idx;
    });

    return scored.map((s) => s.item);
}

export type PdpSubtypeCode =
    | '1A_actuator'
    | '1B_picv_valve'
    | '1C_manual_balancing_valve'
    | '1D_thermostatic_valve'
    | '1E_thermostatic_head'
    | '2A_expansion_vessel'
    | '2B_air_dirt_separator'
    | '2C_pressurization_station'
    | '3A_pellet_burner'
    | '3B_solid_pellet_boiler'
    | '3C_pellet_hopper_auger'
    | '3D_burner_boiler_spare'
    | '4A_air_to_water_heat_pump'
    | '4B_air_to_air_conditioner'
    | '4C_electric_boiler'
    | '5A_buffer_tank'
    | '5B_dhw_boiler'
    | '6A_aluminum_radiator'
    | '6B_steel_radiator_k'
    | '6C_steel_radiator_vk'
    | '7A_ufh_manifold'
    | '7B_multilayer_pex_pipe'
    | '7C_press_threaded_fitting'
    | 'general_hvac_component';

export interface PdpEngineeringProfileInput {
    id?: string;
    sku: string;
    name: string;
    brand?: string | null;
    category?: string | null;
    description?: string | null;
    kitContents?: string[] | string | null;
    whatYouNeed?: string[] | string | null;
    compatibilityNote?: string | null;
    specs?: Array<{ param: string; value: string }> | Record<string, string | number> | null;
    boilerCompatibilityTags?: string[] | null;
}

export interface ResolvedPdpEngineeringProfile {
    subtypeCode: PdpSubtypeCode;
    subtypeKey: string;
    subtypeTitle: string;
    subtypeBadge: string;
    descriptionHook: string;
    whatYouGet: string[];
    whatYouNeed: string[];
    steps: ProductUxStep[];
    selfCheck: string[];
    proTip: string;
    compatibilityNote: string;
    compatibleSystemChips: string[];
    specRows: V3SpecRow[];
}

const cleanDashProfile = (s: string) =>
    s
        .replace(/\u2014/g, '–')
        .replace(/\p{Extended_Pictographic}/gu, '')
        .replace(/[\u00A9\u00AE\u2122]/g, '');

function parseStringListOverride(raw: unknown): string[] | null {
    if (Array.isArray(raw)) {
        const cleaned = raw
            .map((item) => (typeof item === 'string' ? cleanDashProfile(item.trim()) : ''))
            .filter(Boolean);
        return cleaned.length > 0 ? cleaned : null;
    }
    if (typeof raw === 'string' && raw.trim().length > 0) {
        const cleaned = raw
            .split(/[\r\n;|]+/)
            .map((item) => cleanDashProfile(item.trim()))
            .filter(Boolean);
        return cleaned.length > 0 ? cleaned : null;
    }
    return null;
}

function parseSpecsOverride(raw: unknown): V3SpecRow[] | null {
    if (Array.isArray(raw)) {
        const rows = raw
            .map((r) => {
                if (r && typeof r === 'object') {
                    const obj = r as Record<string, unknown>;
                    const param = String(obj.param ?? obj.key ?? obj.label ?? '').trim();
                    const value = String(obj.value ?? obj.val ?? '').trim();
                    if (param && value)
                        return { param: cleanDashProfile(param), value: cleanDashProfile(value) };
                }
                return null;
            })
            .filter((r): r is V3SpecRow => r !== null);
        return rows.length > 0 ? rows : null;
    }
    if (raw && typeof raw === 'object') {
        const rows = Object.entries(raw as Record<string, unknown>)
            .map(([k, v]) => ({
                param: cleanDashProfile(k.trim()),
                value: cleanDashProfile(String(v ?? '').trim()),
            }))
            .filter((r) => r.param && r.value);
        return rows.length > 0 ? rows : null;
    }
    return null;
}

export function resolvePdpEngineeringProfile(
    input: PdpEngineeringProfileInput,
    locale: BoilerCompatLocale = 'lt',
): ResolvedPdpEngineeringProfile {
    const loc: BoilerCompatLocale =
        locale === 'en' || locale === 'pl' || locale === 'ru' ? locale : 'lt';
    const normSku = (input.sku || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const overridesStore = readCatalogOverridesSafe();
    const storeOverride =
        (normSku && overridesStore.overrides[normSku]) ||
        overridesStore.overrides[input.sku] ||
        undefined;
    const customRec = normSku
        ? overridesStore.customProducts.find(
              (c) => c.sku.toLowerCase().replace(/[^a-z0-9]/g, '') === normSku,
          )
        : undefined;
    const rawOverrideObj = (storeOverride || customRec || {}) as unknown as Record<string, unknown>;
    const rawInputObj = input as unknown as Record<string, unknown>;

    const brandInfo = resolveProductBrandInfo({
        brand:
            input.brand ||
            (rawOverrideObj.brandName as string) ||
            (rawOverrideObj.brand as string),
        title: input.name,
        sku: input.sku,
        description: input.description,
    });
    const brand = brandInfo.name;
    const cleanTitleLt = cleanDashProfile(
        formatCleanCatalogProductTitle(input.name, input.sku, brand),
    );
    const text = `${cleanTitleLt} ${input.name || ''} ${input.sku || ''} ${brand} ${input.category || ''}`;
    const textLower = text.toLowerCase();
    const titleSkuLower = `${cleanTitleLt} ${input.name || ''} ${input.sku || ''}`.toLowerCase();

    const parsedV3 = parseV3Description(input.description);
    const baseRawGuide = getProductUxGuide({
        title: cleanTitleLt,
        category: input.category || 'Katilinės įranga',
        brand,
        sku: input.sku,
        rawDescription: input.description || undefined,
    });

    const dnMatch = text.match(/\bDN\s?(\d{1,3})\b/i);
    const dnLabel = dnMatch ? `DN${dnMatch[1]}` : null;
    const voltMatch = text.match(/\b(230\s?V|24\s?V)\b/i);
    const voltLabel = voltMatch ? voltMatch[1].replace(/\s+/g, '').toUpperCase() : '230V / 24V';
    const ncNoMatch = text.match(/\b(NC|NO)\b/);
    const ncNoLabel = ncNoMatch ? ncNoMatch[1] : 'NC (normaliai uždara)';
    const kwMatch = text.match(/\b(\d+(?:[.,]\d+)?)\s?kW\b/i);
    const kwLabel = kwMatch ? `${kwMatch[1].replace('.', ',')} kW` : null;
    const volMatch = text.match(/\b(\d{2,4})\s?(?:L|l|litr)\b/);
    const volLabel = volMatch ? `${volMatch[1]} L` : null;

    let subtypeCode: PdpSubtypeCode = 'general_hvac_component';
    let subtypeKey = baseRawGuide.subtypeKey ?? baseRawGuide.subtypeId;
    let subtypeTitle = baseRawGuide.subtypeTitle;
    let subtypeBadge = baseRawGuide.subtypeBadge;
    let whatYouGet = [...baseRawGuide.whatYouGet];
    let whatYouNeed = [...baseRawGuide.whatYouNeed];
    const steps = [...baseRawGuide.steps];
    const selfCheck = [...baseRawGuide.selfCheck];
    const proTip = baseRawGuide.proTip;
    let compatibilityNote = `${brand} ${cleanTitleLt} (${input.sku}) – patikrinkite jungties sriegį ir sistemos parametrus prieš montavimą.`;
    let compatibleSystemChips: string[] = [
        'Viadrus U22 / U26',
        'Kalvis 2-16 / 2-20',
        'Megatherm MPB',
        'Haier R290 / Danfoss',
    ];
    const generatedSpecs: V3SpecRow[] = [
        { param: 'Gamintojas', value: brand },
        { param: 'Modelis / Kodas', value: input.sku },
    ];

    const isActuator =
        /\bpavar|\babn[-\s]?a5\b|\btwa\b|\bemo\s*t\b|\bemo\b|ta-slider|\bame\s*\d|\bnovocon\b|\bactuator\b|^082f|^088h|^1807-/i.test(
            textLower,
        );
    const isPicvValve =
        !isActuator &&
        /\bab-qm\b|\btbv-cmp\b|\bta-modulator\b|\bta-compact\b|\bpicv\b/i.test(textLower);
    const isManualBalancingValve =
        !isActuator &&
        !isPicvValve &&
        /\bstad\b|\bstaf\b|\btbv-c\b|\btbv\b|\bstrv\b|\busv-i\b|\bmsv-bd\b|\bmsv-f2\b|\bmsv\b|\bballorex\b|\bleno\b|\basv\b|balansinis\s+vožtuvas/i.test(
            textLower,
        );
    const isThermostaticHeadOrRoomStat =
        !isActuator &&
        (/termogalvut|termostatinė\s+galv|termostatinis\s+elementas|\bredia\b|\baero\b|\breact\b|galvutė\s+k\b|heimeier\s+k\b|\bhalo\b|\bdx\b|\bicon\b|kambario\s+termostat|patalpos\s+termostat|\bdevireg\b|^013g29|^013g5|^6000-00/i.test(
            textLower,
        ) &&
            !/vožtuvas|ventilio\s+korpus|binokl|vekolux|multilux/i.test(textLower));
    const isThermostaticRadiatorValve =
        !isActuator &&
        !isPicvValve &&
        !isManualBalancingValve &&
        !isThermostaticHeadOrRoomStat &&
        /\bra-n\b|\bra-dv\b|\bra-fn\b|\beclipse\b|\bv-exact\b|\bcalypso\b|\bvekolux\b|\bmultilux\b|\bregulux\b|\braditec\b|\brlv-k\b|\brlv-ks\b|\brlv-s\b|\bvhx\b|herz-ts|\bts-90\b|apatinio\s+pajungimo\s+mazg|h-blok|binokl|^013g0|^3933-|^0382-|^17761/i.test(
            textLower,
        ) &&
        !/kolektor|dynacon/i.test(textLower);

    const isPressurizationStation =
        /\btransfero\b|\bcompresso\b|\bsimply\b|\bvento\b|\bpleno\b|slėgio\s+palaikymo\s+stotel|degazav/i.test(
            textLower,
        );
    const isAirDirtSeparator =
        !isPressurizationStation &&
        /\bzeparo\b|\bhyjet\b|oro\s+atskyr|purvo\s+atskyr|šlamo\s+atskyr|magnetinis.*atskyr|magnetinis.*separator|separatorius|nuorintuv|nuorintoj/i.test(
            textLower,
        ) &&
        !/radiator|kolektor/i.test(textLower);
    const isExpansionVessel =
        !isPressurizationStation &&
        !isAirDirtSeparator &&
        /\bstatico\b|\baquapresso\b|\baquresso\b|\bzilmet\b|plėtimosi\s+ind|pletimosi\s+ind|išsiplėtimo\s+ind|membraninis\s+ind/i.test(
            textLower,
        );

    const isRadiatorOrConvector =
        !isThermostaticRadiatorValve &&
        !isThermostaticHeadOrRoomStat &&
        (/radiatorius|konvektorius|^pol\.\//i.test(textLower) ||
            /\bgi-rad-22/i.test(textLower) ||
            /\bcalidor\b|\bferroli\s+pol\b/i.test(textLower));
    const isAluminumRadiator =
        isRadiatorOrConvector &&
        (/aliumin|\bpol\b|^pol\.\/|\bcalidor\b/i.test(textLower) && !/22\s*v?k/i.test(textLower));
    const isSteelRadiatorVK =
        isRadiatorOrConvector &&
        !isAluminumRadiator &&
        /\b22\s*vk\b|gi-rad-22vk|apatinis\s+pajungim|apatinio\s+pajungim/i.test(textLower);
    const isSteelRadiatorK =
        isRadiatorOrConvector && !isAluminumRadiator && !isSteelRadiatorVK;

    const isBufferTank =
        /\bzv\s*\d|\bzv\b|akumuliacinė\s+talpa|akumuliacine\s+talpa|buferinė\s+talpa|buferine\s+talpa|\bcas\s*\d|\bnad\s*\d/i.test(
            textLower,
        ) && !/katilas\s+gilės\s+zv/i.test(textLower);
    const isDhwBoiler =
        !isBufferTank &&
        /\bboileris\b|vandens\s+šildytuvas|vandens\s+sildytuvas|\bokc\b|\bokce\b|\bokhe\b|\bdražice\b|\bdrazice\b|\bgbk\b|\btgr\b|\bvlgm\b|\bhp(80|110|150|200|250|300)\b|\bes(10|15|30|50|80|100)v\b/i.test(
            textLower,
        );

    const isElectricBoiler =
        !isDhwBoiler &&
        /\bvitotron\b|\bkospell\b|\bekco\b|elektrinis\s+šildymo\s+katilas|elektrinis\s+katilas/i.test(
            textLower,
        );
    const isAirToAirConditioner =
        !isElectricBoiler &&
        !isDhwBoiler &&
        (/oro\s+kondicionier|oras[-–]oras|\bjade\b|\bflexis\b|\bpearl\b|\brevive\b|\btundra\b|nordic\s+split|\bas(20|25|35|50|71)|1u(25|35|50|71)|kasetinis|kanalinis|konsolinis/i.test(
            textLower,
        ) &&
            !/super\s+aqua|monoblok|hydro\s+split|oras[-–]vanduo/i.test(textLower));
    const isAirToWaterHeatPump =
        !isElectricBoiler &&
        !isAirToAirConditioner &&
        !isDhwBoiler &&
        /super\s+aqua|\bmonoblok|hydro\s+split|all-in-one|\baw0|\baw1|\bhu102|\bhu082|\bfycra\b|\bvitocal\b|oras[-–]vanduo|šilumos\s+siurblys|silumos\s+siurblys|\bmrv\b/i.test(
            textLower,
        );

    const isBurnerOrBoilerSpare =
        !isElectricBoiler &&
        !isDhwBoiler &&
        (/uždegimo\s+ten|uzdegimo\s+ten|\btenas\b|\bkatgr\b|\bkatm\b|\bkatf\b|\begip-gli\b|\bardel|\bcpdv\b|fotodiod|fotoelement|\bstb\b|ventiliator|traukos\s+reguliator|\bcpreg\b|purkštuk|purkstuk|\b030[fhb]\b/i.test(
            textLower,
        ) &&
            !/degiklio\s+komplektas|degkmpl/i.test(textLower));
    const isPelletHopperOrAuger =
        !isBurnerOrBoilerSpare &&
        (/\bbunkeris\b|granulių\s+talpa|kuro\s+talpa|\bcppt\b|\bšnekas\b|\bsnekas\b|\bsraigtas\b|\bcpsp\b|padavimo\s+sraigt/i.test(
            textLower,
        ) &&
            !/degiklio\s+komplektas|degkmpl/i.test(textLower));
    const isPelletBurner =
        !isBurnerOrBoilerSpare &&
        !isPelletHopperOrAuger &&
        /granulių\s+degikl|granulinis\s+degikl|degiklio\s+komplekt|\bmpb\b|degkmpl|pelet-set|\bpv\s*20|\bpv\s*30|\bsun\s*p7|\bsun\s*p12|\ba251\b|\ba501\b|\bdegiklis\b/i.test(
            textLower,
        );
    const isSolidOrPelletBoiler =
        !isBurnerOrBoilerSpare &&
        !isPelletHopperOrAuger &&
        !isPelletBurner &&
        !isElectricBoiler &&
        !isAirToWaterHeatPump &&
        /\bkatilas\b|\bpeltec\b|\beko-ck\b|\bcentroplus\b|\bbiopel\b|\bponast\b|\bverner\s+v|\bdefro\b|\bkalvis\b|\bviadrus\b|\batmos\b/i.test(
            textLower,
        );

    const isUfhManifold =
        /\bkolektorius\b|\bkolektoriai\b|\bdynacon\b|\bdynalux\b|\bfhf\b/i.test(textLower);
    const isMultilayerPexPipe =
        !isUfhManifold &&
        (/\bvamzdis\b|daugiasluoksnis\s+vamzd|pex-al-pex|\bpe-rt\b|\balupex\b/i.test(titleSkuLower) &&
            !/jungt|alkūn|alkun|trišak|trisak|mova|adapter|eurokonus|fiting/i.test(titleSkuLower));
    const isPressOrThreadedFitting =
        !isUfhManifold &&
        !isMultilayerPexPipe &&
        !isThermostaticRadiatorValve &&
        !isManualBalancingValve &&
        !isPicvValve &&
        /presuojam|eurokonus|fiting|alkūn|alkun|trišak|trisak|\bmova\b|\bnipel|\badapter|\bjungt|\bcomisa\b|\bsanha\b|\bfv-plast\b|\bwavin\b/i.test(
            textLower,
        );

    if (isActuator) {
        subtypeCode = '1A_actuator';
        subtypeKey = 'actuator-controller';
        const hasVa41OrAbQm = /va41|ab-qm/i.test(textLower);
        const hasRaClick = /\bra\b|twa-a|ra-click/i.test(textLower) && !hasVa41OrAbQm;
        const isAbnA5 = /abn[-\s]?a5/i.test(textLower);
        const isEmo = /\bemo\b/i.test(textLower);
        const isTwa = /\btwa\b/i.test(textLower);

        subtypeTitle = hasVa41OrAbQm
            ? 'Elektroterminė vožtuvo pavara su VA41 adapteriu (Danfoss AB-QM vožtuvams)'
            : 'Elektroterminė / motorinė vožtuvo pavara';
        subtypeBadge = 'Vožtuvo pavara';

        const unitDesc = isAbnA5
            ? `Danfoss ABN-A5 elektroterminė pavara (${voltLabel}, ${ncNoLabel}, 5 mm eiga, SKU: ${input.sku})`
            : isEmo
              ? `IMI Heimeier EMO T elektroterminė pavara M30×1,5 (${voltLabel}, ${ncNoLabel}, SKU: ${input.sku})`
              : isTwa
                ? `Danfoss TWA elektroterminė pavara (${voltLabel}, ${ncNoLabel}, SKU: ${input.sku})`
                : `${brand} elektroterminė / motorinė vožtuvo pavara (${cleanTitleLt}, SKU: ${input.sku})`;

        const adapterDesc = hasVa41OrAbQm
            ? 'VA41 greito fiksavimo adapteris Danfoss AB-QM (DN10–32) slėgio nepriklausomiems balansiniams vožtuvams'
            : hasRaClick
              ? 'Danfoss RA-Click (23 mm) fiksavimo jungtis Danfoss RA-N / FHV vožtuvams'
              : 'M30×1,5 srieginė prispaudimo veržlė standartiniams M30×1,5 vožtuvams ir kolektoriams';

        whatYouGet = [
            unitDesc,
            adapterDesc,
            'Integruotas prijungimo kabelis (2×0,75 mm²) ir vizualus eigos / pozicijos indikatorius',
        ];
        whatYouNeed = [
            hasVa41OrAbQm
                ? 'Suderinamas Danfoss AB-QM (DN10–32) automatinis balansinis vožtuvas (PICV)'
                : hasRaClick
                  ? 'Suderinamas Danfoss RA-N arba FHV vožtuvas su RA-Click (23 mm) kakleliu'
                  : 'Suderinamas vožtuvas arba grindinio šildymo kolektorius su M30×1,5 sriegiu',
            `Zoninis valdiklis arba kambario termostatas (${voltLabel} – įtampa privalo sutapti su pavaros maitinimu)`,
            'Svarbu: Danfoss RA-Click (23 mm), VA41 (AB-QM) ir M30×1,5 sriegio standartai tarpusavyje nesuderinami be atitinkamo adapterio',
        ];
        compatibilityNote = hasVa41OrAbQm
            ? `Ši ${brand} ABN-A5 pavara komplektuojama su VA41 adapteriu ir tiesiogiai tinka Danfoss AB-QM DN10–32 vožtuvams. Nemaipykite Danfoss RA-Click, VA41 ir M30×1,5 jungčių be atitinkamo adapterio.`
            : hasRaClick
              ? `Ši ${brand} TWA-A pavara turi Danfoss RA-Click (23 mm) jungtį ir tinka Danfoss RA-N / FHV vožtuvams (netinka M30×1,5 vožtuvams be adapterio).`
              : `Ši ${brand} pavara turi standartinį M30×1,5 sriegį ir tinka M30×1,5 vožtuvams bei kolektoriams (netinka Danfoss RA-Click vožtuvams be adapterio).`;
    } else if (isPicvValve) {
        subtypeCode = '1B_picv_valve';
        subtypeKey = 'balancing-valve';
        subtypeTitle =
            'Automatinis slėgio nepriklausomas balansinis ir reguliavimo vožtuvas (PICV)';
        subtypeBadge = 'PICV automatinis balansinis vožtuvas';
        const isDanfossPicv = /danfoss|ab-qm/i.test(textLower);
        whatYouGet = [
            `Korozijai atsparus DZR žalvario (CW602N) / ketaus PICV vožtuvo korpusas (${brand} ${cleanTitleLt}, SKU: ${input.sku})`,
            'Integruota diferencinio slėgio reguliatoriaus membrana ir 0–100 % projektinio srauto (l/h) nustatymo skalė',
            'Apsauginis dangtelis ir pavaros prijungimo kaklelis (su matavimo nipeliais pagal modelio modifikaciją)',
        ];
        compatibilityNote = isDanfossPicv
            ? `Danfoss AB-QM (${dnLabel || 'DN10–32'}) automatinis PICV vožtuvas su 0–100 % srauto skale tiesiogiai dera su Danfoss ABN-A5 (su VA41 adapteriu), AME ir NovoCon pavaromis.`
            : `IMI TA (${cleanTitleLt}) automatinis PICV vožtuvas su integruotu diferencinio slėgio reguliatoriumi tiesiogiai dera su IMI TA-Slider, TA-Modulator ir EMO (M30×1,5) pavaromis.`;
    } else if (isManualBalancingValve) {
        subtypeCode = '1C_manual_balancing_valve';
        subtypeKey = 'balancing-valve';
        subtypeTitle = 'Rankinis hidraulinis balansinis ir srauto matavimo vožtuvas';
        subtypeBadge = 'Rankinis balansinis vožtuvas';
        const isImiTa = /imi|\bstad\b|\bstaf\b|\btbv-c\b/i.test(textLower);
        whatYouGet = isImiTa
            ? [
                  `Korozijai atsparus IMI TA AMETAL® / ketaus balansinio vožtuvo korpusas (STAD / STAF / TBV-C, SKU: ${input.sku})`,
                  'Mikrometrinis skaitmeninis nustatymo rankratis su „Memory stop“ (nustatymo atminties) fiksatoriumi',
                  '2 savaime užsisandarinantys matavimo nipeliai (Test points) diferenciniam slėgiui ir srautui matuoti',
              ]
            : [
                  `${brand} korozijai atsparus DZR žalvario (CW602N) balansinio vožtuvo korpusas (${cleanTitleLt}, SKU: ${input.sku})`,
                  'Tiksli išankstinio srauto (Kv) nustatymo skalė su fiksavimo ir pilno uždarymo funkcija',
                  '2 integruoti matavimo nipeliai diferenciniam slėgiui ir srautui matuoti',
              ];
    } else if (isThermostaticRadiatorValve) {
        subtypeCode = '1D_thermostatic_valve';
        const isBottomHBlock =
            /vekolux|multilux|rlv-k|rlv-ks|vhx|0382-|apatinio\s+pajungimo|h-blok|binokl/i.test(
                textLower,
            );
        const isDanfossRa =
            /danfoss|ra-n|ra-dv|ra-fn|^013g/i.test(textLower) && !/m30/i.test(textLower);
        subtypeKey = isBottomHBlock ? 'h-block' : 'thermostatic-valve';
        subtypeTitle = isBottomHBlock
            ? 'Radiatoriaus apatinio pajungimo mazgas (VK 50 mm binoklis / H-blokas)'
            : `Termostatinis radiatoriaus vožtuvas (${dnLabel || 'DN15 / DN20'}, šoninis pajungimas)`;
        compatibilityNote = isBottomHBlock
            ? 'Apatinio pajungimo mazgas (VK 50 mm binoklis / H-blokas) skirtas apatinio pajungimo radiatoriams (pvz., Tipas 22 VK). Vamzdžiams prijungti reikalingos 2 vnt. G 3/4" Eurokonus jungtys.'
            : isDanfossRa
              ? 'Danfoss RA-Click (23 mm) jungtis – tinka Danfoss Aero / Redia / Living Eco RA termogalvutėms (netinka M30×1,5 galvutėms be perėjimo). Skirta šoninio pajungimo radiatoriams (DN15 / DN20).'
              : 'M30×1,5 standartinis sriegis – tinka IMI Heimeier K / DX / Halo, HERZ M30×1,5 ir elektroninėms M30×1,5 galvutėms (netinka Danfoss RA-Click galvutėms be adapterio). Skirta šoninio pajungimo radiatoriams (DN15 / DN20).';
    } else if (isThermostaticHeadOrRoomStat) {
        subtypeCode = '1E_thermostatic_head';
        subtypeKey = 'thermostatic-head';
        const isDanfossRaHead =
            /danfoss|redia|aero|react|^013g/i.test(textLower) && !/m30/i.test(textLower);
        subtypeTitle = isDanfossRaHead
            ? 'Termostatinė radiatoriaus galvutė (Danfoss RA-Click 23 mm)'
            : 'Termostatinė radiatoriaus galvutė (M30×1,5 sriegis)';
        compatibilityNote = isDanfossRaHead
            ? `Ši ${brand} termogalvutė turi Danfoss RA-Click (23 mm) fiksavimo jungtį ir tiesiogiai tinka Danfoss RA-N / RA-DV vožtuvams (pvz., 013G0014). Netinka M30×1,5 sriegiui be adapterio.`
            : `Ši ${brand} termogalvutė turi standartinį M30×1,5 sriegį ir tiesiogiai tinka IMI Heimeier (Eclipse, V-exact II, Calypso, Vekolux), HERZ bei Tipas 22 VK radiatorių M30×1,5 ventiliams. Netinka Danfoss RA-Click vožtuvams be adapterio.`;
    } else if (isExpansionVessel) {
        subtypeCode = '2A_expansion_vessel';
        subtypeKey = 'expansion-vessel';
        subtypeTitle = 'Membraninis plėtimosi indas (Statico / Aquapresso / EN 12828)';
    } else if (isAirDirtSeparator) {
        subtypeCode = '2B_air_dirt_separator';
        subtypeKey = 'air-dirt-separator';
        subtypeTitle = 'Automatinis oro, mikromullių ir magnetinis purvo separatorius (Zeparo)';
        whatYouGet = [
            `Žalvarinis / plieninis separatoriaus korpusas su vidiniu Heiscol cikloniniu elementu (${brand} ${cleanTitleLt}, SKU: ${input.sku})`,
            'Išimamas neodimio magnetas magnetitui arba automatinis oro šalinimo vožtuvas',
            'Apatinis šlamo nuleidimo čiaupas',
        ];
    } else if (isPressurizationStation) {
        subtypeCode = '2C_pressurization_station';
        subtypeKey = 'pressure-station';
        subtypeTitle = 'Automatinė slėgio palaikymo ir vakuuminio degazavimo stotis (Transfero / Compresso)';
    } else if (isPelletBurner) {
        subtypeCode = '3A_pellet_burner';
        subtypeKey = 'pellet-burner-kit';
        subtypeTitle = 'Automatinis savaime išsivalantis granulių degiklis (su šneku ir valdikliu)';
    } else if (isSolidOrPelletBoiler) {
        subtypeCode = '3B_solid_pellet_boiler';
        subtypeKey = 'boiler-heat-source';
        subtypeTitle = 'Kieto kuro / automatinis granulinis šildymo katilas';
    } else if (isPelletHopperOrAuger) {
        subtypeCode = '3C_pellet_hopper_auger';
        subtypeKey = 'pellet-burner-kit';
        subtypeTitle = 'Granulių bunkeris (kuro talpa) ir šnekinis padavimo transporteris';
    } else if (isBurnerOrBoilerSpare) {
        subtypeCode = '3D_burner_boiler_spare';
        subtypeKey = 'spare-part-hardware';
        subtypeTitle =
            'Originali granulių degiklio ir katilo atsarginė dalis (uždegimo tenas / ardelis / jutiklis / ventiliatorius)';
        whatYouGet = [
            `Originali gamyklinė atsarginė dalis (${brand} ${cleanTitleLt}, SKU: ${input.sku})`,
            'Aukštai temperatūrai atspari konstrukcija (keraminis/metalinis kaitinimo elementas, ketaus/inox ardelis arba tikslusis jutiklis)',
            'Tiesioginis elektrinis ir mechaninis suderinamumas be degiklio korpuso perdirbimo',
        ];
    } else if (isAirToWaterHeatPump) {
        subtypeCode = '4A_air_to_water_heat_pump';
        subtypeKey = 'boiler-heat-source';
        subtypeTitle = 'Oras–Vanduo šilumos siurblys (Monoblokas / Hydro Split, R290 / R32)';
    } else if (isAirToAirConditioner) {
        subtypeCode = '4B_air_to_air_conditioner';
        subtypeKey = 'boiler-heat-source';
        subtypeTitle =
            'Oro kondicionierius – šilumos siurblys (Split Oras–Oras, šildymui iki -25 °C ir vėsinimui)';
    } else if (isElectricBoiler) {
        subtypeCode = '4C_electric_boiler';
        subtypeKey = 'boiler-heat-source';
        subtypeTitle = 'Elektrinis šildymo katilas (uždarai vandens šildymo sistemai)';
    } else if (isBufferTank) {
        subtypeCode = '5A_buffer_tank';
        subtypeKey = 'water-heater-cylinder';
        subtypeTitle =
            'Akumuliacinė (buferinė) talpa šildymo sistemai (techniniam vandeniui, be emalės)';
        whatYouGet = [
            `Plieninė akumuliacinė (buferinė) talpa (${brand} ${cleanTitleLt}, SKU: ${input.sku}) uždarai šildymo sistemai`,
            'Aukšto tankio šiluminė izoliacija (PU / EPS) ir srieginiai atvamzdžiai katilo / šilumos siurblio kontūrams',
            'Lizdai temperatūros jutikliams, termometrams ir automatiniam oro nuorintojui viršuje',
        ];
        compatibilityNote =
            'Inžinerinė tiesa: akumuliacinė (buferinė) talpa (pvz., Gorenje Tiki ZV / Centrometal CAS / Dražice NAD) yra neemaliuota (be emalės ir be magnio anodo), todėl skirta TIK uždaros šildymo sistemos techniniam termofikaciniam vandeniui (katilams ir šilumos siurbliams).';
    } else if (isDhwBoiler) {
        subtypeCode = '5B_dhw_boiler';
        subtypeKey = 'water-heater-cylinder';
        subtypeTitle =
            'Karšto buitinio vandens boileris / šildytuvas (emaliuotas su magnio anodu geriamam vandeniui)';
        whatYouGet = [
            `Higieninis emaliuotas karšto vandens boileris (${brand} ${cleanTitleLt}, SKU: ${input.sku}) buitiniam geriamam vandeniui`,
            'Integruotas apsauginis magnio anodas korozijos prevencijai, termostatas ir šiluminė poliuretano izoliacija',
            'Apsauginis-atbulinis vožtuvas (6–8 bar) ir šilumokaičio / kaitinimo elemento mazgas pagal modelį',
        ];
        compatibilityNote =
            'Skirtas buitiniam geriamam karštam vandeniui (DHW) ruošti: vidinis bakas padengtas higienine titano/keramine emale ir apsaugotas magnio anodu (darbinis slėgis 6–10 bar).';
    } else if (isAluminumRadiator) {
        subtypeCode = '6A_aluminum_radiator';
        subtypeKey = 'sectional-radiator';
        subtypeTitle = 'Aliumininis sekcijinis šildymo radiatorius (šoninės G 1" jungtys)';
        compatibilityNote =
            'Aliumininis sekcijinis radiatorius (Ferroli POL / Calidor) turi G 1" šonines kolektoriaus angas (dešinėje – dešininis R sriegis, kairėje – kairinis L sriegis). Montavimui būtinas 1"×1/2" perėjimų komplektas (GI-FERROLI-001), laikikliai ir šoninis DN15 vožtuvas!';
    } else if (isSteelRadiatorK) {
        subtypeCode = '6B_steel_radiator_k';
        subtypeKey = 'sectional-radiator';
        subtypeTitle =
            'Plieninis plokštinis radiatorius Tipas 22 K (4×G 1/2" šoninis pajungimas)';
        whatYouGet = [
            `Plieninis plokštinis dviejų plokščių ir dviejų konvektorių radiatorius Tipas 22 K (${cleanTitleLt}, SKU: ${input.sku})`,
            '4×G 1/2" vidinio sriegio šoninio pajungimo angos (kairinis arba dešininis prijungimas)',
            'Pilnas gamyklinis montavimo komplektas dėžėje: sieniniai L-laikikliai, 1/2" aklė ir Majevskio oro nuorintojas',
        ];
    } else if (isSteelRadiatorVK) {
        subtypeCode = '6C_steel_radiator_vk';
        subtypeKey = 'sectional-radiator';
        subtypeTitle =
            'Plieninis plokštinis radiatorius Tipas 22 VK (50 mm apatinis pajungimas su integruotu termostatiniu įdėklu)';
        compatibilityNote =
            'Plieninis radiatorius Tipas 22 VK turi integruotą termostatinį įdėklą ir 50 mm apatinį pajungimą. Montavimui reikalingas VK 50 mm H-blokas (0382-02.000) + 2 vnt. Eurokonus jungtys + M30×1,5 termogalvutė (6000-00.500).';
    } else if (isUfhManifold) {
        subtypeCode = '7A_ufh_manifold';
        subtypeKey = 'floor-heating-manifold';
        subtypeTitle = 'Grindinio šildymo kolektorius su rotametrais / AFC srauto reguliavimu';
    } else if (isMultilayerPexPipe) {
        subtypeCode = '7B_multilayer_pex_pipe';
        subtypeKey = 'pipe-fitting';
        subtypeTitle = 'Daugiasluoksnis / PEX / PE-RT šildymo ir vandentiekio vamzdis';
    } else if (isPressOrThreadedFitting) {
        subtypeCode = '7C_press_threaded_fitting';
        subtypeKey = 'pipe-fitting';
        subtypeTitle =
            'Presuojama, Eurokonus arba srieginė inžinerinė vamzdyno jungtis (Comisa / SANHA / FV-Plast)';
    }

    const customKit =
        parseStringListOverride(rawInputObj.kitContents) ||
        parseStringListOverride(rawOverrideObj.kitContents);
    if (customKit) {
        whatYouGet = customKit;
    }

    const customNeed =
        parseStringListOverride(rawInputObj.whatYouNeed) ||
        parseStringListOverride(rawOverrideObj.whatYouNeed);
    if (customNeed) {
        whatYouNeed = customNeed;
    }

    const customCompatNote =
        (typeof rawInputObj.compatibilityNote === 'string' &&
            rawInputObj.compatibilityNote.trim()) ||
        (typeof rawOverrideObj.compatibilityNote === 'string' &&
            rawOverrideObj.compatibilityNote.trim()) ||
        null;
    if (customCompatNote) {
        compatibilityNote = cleanDashProfile(customCompatNote);
    }

    const customTags =
        parseStringListOverride(rawInputObj.boilerCompatibilityTags) ||
        parseStringListOverride(rawInputObj.compatibleBoilers) ||
        parseStringListOverride(rawOverrideObj.boilerCompatibilityTags) ||
        parseStringListOverride(rawOverrideObj.compatibleBoilers);
    if (customTags) {
        compatibleSystemChips = customTags;
    }

    const rawDescCandidate =
        (typeof input.description === 'string' && input.description.trim()) ||
        (typeof rawOverrideObj.descriptionLt === 'string' &&
            rawOverrideObj.descriptionLt.trim()) ||
        (typeof rawOverrideObj.description === 'string' && rawOverrideObj.description.trim()) ||
        '';
    const isAutoStubDesc =
        !rawDescCandidate ||
        rawDescCandidate.endsWith(`(SKU: ${input.sku}).`) ||
        rawDescCandidate.endsWith(`SKU: ${input.sku}).`);

    const defaultHookLt = `${cleanTitleLt} (${brand}, SKU: ${input.sku}) – ${subtypeTitle.toLowerCase()}. ${compatibilityNote}`;
    const resolvedHookLt = !isAutoStubDesc
        ? cleanDashProfile(parsedV3.hook || rawDescCandidate)
        : cleanDashProfile(defaultHookLt);

    const customSpecRows =
        parseSpecsOverride(rawInputObj.specs) || parseSpecsOverride(rawOverrideObj.specs);
    const mergedSpecMap = new Map<string, string>();
    for (const row of [...generatedSpecs, ...parsedV3.specRows, ...(customSpecRows || [])]) {
        if (row.param && row.value) {
            mergedSpecMap.set(row.param, cleanDashProfile(row.value));
        }
    }
    const finalSpecRows: V3SpecRow[] = Array.from(mergedSpecMap.entries()).map(
        ([param, value]) => ({
            param,
            value,
        }),
    );

    const localizedGuide = localizeProductUxGuide(
        {
            subtypeId: subtypeCode,
            subtypeKey,
            subtypeTitle,
            subtypeBadge,
            whatYouGet,
            whatYouNeed,
            steps,
            proTip,
            commonMistake: baseRawGuide.commonMistake,
            selfCheck,
            safetyNote: baseRawGuide.safetyNote,
        },
        { title: cleanTitleLt, sku: input.sku, brand },
        loc,
    );

    const localizedHook = cleanDashProfile(
        localizeProductHook(
            resolvedHookLt,
            {
                title: cleanTitleLt,
                sku: input.sku,
                brand,
                category: input.category || 'Katilinės įranga',
            },
            loc,
        ),
    );

    return {
        subtypeCode,
        subtypeKey,
        subtypeTitle: cleanDashProfile(localizedGuide.subtypeTitle),
        subtypeBadge: cleanDashProfile(localizedGuide.subtypeBadge),
        descriptionHook: customCompatNote || !isAutoStubDesc ? resolvedHookLt : localizedHook,
        whatYouGet: customKit ? customKit : localizedGuide.whatYouGet.map(cleanDashProfile),
        whatYouNeed: customNeed ? customNeed : localizedGuide.whatYouNeed.map(cleanDashProfile),
        steps: localizedGuide.steps.map((s) => ({
            title: cleanDashProfile(s.title),
            detail: cleanDashProfile(s.detail),
        })),
        selfCheck: localizedGuide.selfCheck.map(cleanDashProfile),
        proTip: cleanDashProfile(localizedGuide.proTip),
        compatibilityNote: cleanDashProfile(compatibilityNote),
        compatibleSystemChips: compatibleSystemChips.map(cleanDashProfile),
        specRows: finalSpecRows,
    };
}
