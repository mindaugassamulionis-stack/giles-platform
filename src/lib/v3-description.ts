// W22-D1-C & W33-B2: deterministic parser for v3 dual-audience product
// descriptions, brand/photo visual integration with product-visuals.ts, and
// deep 15-subtype HVAC UX guide ("Kas įeina į komplektą", "Ko prireiks
// montavimui", 4-step mounting guide, "Meistro patarimas", "Dažniausia klaida",
// "3 sek. patikra").

import {
    BRAND_LOGOS,
    EXACT_PHOTO_SKUS,
    isExactPhotoSku,
    resolveBrandLogo,
    resolveProductImageUrl,
    resolveProductVisual,
    formatCleanCatalogProductTitle,
    type BrandVisualInfo,
    type ResolvedProductVisual,
} from './product-visuals';
export {
    buildProductFaqAndComparison,
    type ProductComparisonRow,
    type ProductFaqItem,
    type ProductFaqAndComparisonResult,
    type ProductFaqAndComparisonInput,
} from './product-faq-and-comparison';

export {
    BRAND_LOGOS,
    EXACT_PHOTO_SKUS,
    isExactPhotoSku,
    resolveBrandLogo,
    resolveProductImageUrl,
    resolveProductVisual,
    formatCleanCatalogProductTitle,
    type BrandVisualInfo,
    type ResolvedProductVisual,
};

export interface V3SpecRow {
    param: string;
    value: string;
}

export interface ParsedV3Description {
    hook: string;
    plainLayer: string;
    specRows: V3SpecRow[];
    purpose: string;
    vatNotice: string;
    legacyText: string;
}

export interface InstallationGuide {
    title: string;
    steps: string[];
    safetyNote: string;
}

export interface ProductUxStep {
    title: string;
    detail: string;
}

export interface ProductUxGuide {
    subtypeId: string;
    subtypeKey?: string;
    subtypeTitle: string;
    subtypeBadge: string;
    whatYouGet: string[];
    whatYouNeed: string[];
    steps: ProductUxStep[];
    proTip: string;
    commonMistake: string;
    selfCheck: string[];
    safetyNote: string;
}

export interface BrandVisual {
    slug: string;
    name: string;
    logoUrl: string;
    originLabel: string;
    specialtyLabel: string;
    query: string;
    productCountLabel: string;
}

export interface HvacSystemGroup {
    id: string;
    title: string;
    plainDesc: string;
    query: string;
    imageUrl: string;
    featuredSku: string;
    brandLabel: string;
}

export interface HeroFlagshipItem {
    sku: string;
    brand: string;
    brandLogoUrl: string;
    title: string;
    subtitle: string;
    imageUrl: string;
    href: string;
}

export function hasExactProductPhoto(sku?: string | null, imageUrl?: string | null): boolean {
    if (isExactPhotoSku(sku)) return true;
    const cleanSku = (sku ?? '').trim().toLowerCase();
    const cleanUrl = (imageUrl ?? '').trim().toLowerCase();
    if (cleanUrl.startsWith('/images/products/') && !cleanUrl.includes('family-')) {
        const fileStem = cleanUrl.replace(/^.*\/images\/products\//, '').replace(/\.webp$/, '');
        if (cleanSku && fileStem === cleanSku) return true;
    }
    return false;
}

/**
 * Official 11 European HVAC manufacturer brands represented alongside Gilės Inžinerija in FILL.LT (12 total in homepage 6-col grid).
 */
export const BRAND_SHOWCASE_ITEMS: BrandVisual[] = [
    {
        slug: 'comisa',
        name: 'Comisa',
        logoUrl: BRAND_LOGOS['Comisa'].logoPath,
        originLabel: BRAND_LOGOS['Comisa'].origin,
        specialtyLabel: 'Presuojami fitingai, kolektoriai, rutuliniai kranai, saulės sistemos',
        query: 'Comisa',
        productCountLabel: '769 poz.',
    },
    {
        slug: 'imi-pneumatex',
        name: 'IMI Pneumatex',
        logoUrl: BRAND_LOGOS['IMI Pneumatex'].logoPath,
        originLabel: BRAND_LOGOS['IMI Pneumatex'].origin,
        specialtyLabel: 'Statico / Aquapresso plėtimosi indai, Zeparo, Compresso',
        query: 'IMI Pneumatex',
        productCountLabel: '865 poz.',
    },
    {
        slug: 'imi-heimeier',
        name: 'IMI Heimeier',
        logoUrl: BRAND_LOGOS['IMI Heimeier'].logoPath,
        originLabel: BRAND_LOGOS['IMI Heimeier'].origin,
        specialtyLabel: 'Eclipse srauto ribotuvai, K-galvutės, Dynacon kolektoriai',
        query: 'IMI Heimeier',
        productCountLabel: '679 poz.',
    },
    {
        slug: 'danfoss',
        name: 'Danfoss',
        logoUrl: BRAND_LOGOS['Danfoss'].logoPath,
        originLabel: BRAND_LOGOS['Danfoss'].origin,
        specialtyLabel: 'RA-N vožtuvai, Redia galvutės, Icon / DEVIreg valdikliai',
        query: 'Danfoss',
        productCountLabel: '640 poz.',
    },
    {
        slug: 'imi-ta',
        name: 'IMI TA',
        logoUrl: BRAND_LOGOS['IMI TA'].logoPath,
        originLabel: BRAND_LOGOS['IMI TA'].origin,
        specialtyLabel: 'STAD, STAF, TBV-C, TA-Modulator balansiniai vožtuvai',
        query: 'IMI TA',
        productCountLabel: '553 poz.',
    },
    {
        slug: 'haier',
        name: 'Haier',
        logoUrl: BRAND_LOGOS['Haier']?.logoPath || '/images/brands/haier.svg',
        originLabel: BRAND_LOGOS['Haier']?.origin || 'Tarptautinis ŠVOK · Šilumos siurbliai',
        specialtyLabel: 'Oras–vanduo R290/R32 šilumos siurbliai, elektriniai katilai ir kondicionieriai',
        query: 'Haier',
        productCountLabel: '465 poz.',
    },
    {
        slug: 'viessmann',
        name: 'Viessmann',
        logoUrl: BRAND_LOGOS['Viessmann'].logoPath,
        originLabel: BRAND_LOGOS['Viessmann'].origin,
        specialtyLabel: 'Vitodens 100-W / 200-W / 222-F katilai, Vitosol saulės kolektoriai',
        query: 'Viessmann',
        productCountLabel: '366 poz.',
    },
    {
        slug: 'wilo',
        name: 'Wilo',
        logoUrl: BRAND_LOGOS['Wilo'].logoPath,
        originLabel: BRAND_LOGOS['Wilo'].origin,
        specialtyLabel: 'Stratos PICO, Yonos PICO, Star-Z, DrainLift, TWU/TWI siurbliai',
        query: 'Wilo',
        productCountLabel: '290 poz.',
    },
    {
        slug: 'centrometal',
        name: 'Centrometal',
        logoUrl: BRAND_LOGOS['Centrometal'].logoPath,
        originLabel: BRAND_LOGOS['Centrometal'].origin,
        specialtyLabel: 'EKO-CK P, PelTec, CentroPlus katilai, Cm Pelet-set degikliai, CAS talpos',
        query: 'Centrometal',
        productCountLabel: '150 poz.',
    },
    {
        slug: 'drazice',
        name: 'Dražice',
        logoUrl: BRAND_LOGOS['Dražice'].logoPath,
        originLabel: BRAND_LOGOS['Dražice'].origin,
        specialtyLabel: 'OKC, OKCE, OKHE, OKCV kombinuoti ir netiesioginio šildymo boileriai',
        query: 'Dražice',
        productCountLabel: '143 poz.',
    },
    {
        slug: 'gorenje',
        name: 'Gorenje',
        logoUrl: BRAND_LOGOS['Gorenje']?.logoPath || '/images/brands/gorenje.svg',
        originLabel: BRAND_LOGOS['Gorenje']?.origin || 'Slovėnija · TIKI akumuliacinės talpos ir boileriai',
        specialtyLabel: 'TIKI ZV 25–300 L akumuliacinės talpos, greitaeigiai VLGM ir kombinuoti boileriai',
        query: 'Gorenje',
        productCountLabel: '63 poz.',
    },
];

/**
 * Resolves exact manufacturer brand name and BrandVisualInfo from explicit brand,
 * v3 description table (`| Gamintojas | ... |`), SKU prefix, or product title.
 */
export function inferProductBrandName(input: {
    brand?: string | null;
    title?: string | null;
    sku?: string | null;
    description?: string | null;
}): string {
    const rawBrand = (input.brand ?? '').trim();
    if (rawBrand && BRAND_LOGOS[rawBrand] && rawBrand !== 'GI-AUTOMATIKA' && rawBrand !== 'ŠVOK Inžinerija') {
        return rawBrand;
    }
    if (rawBrand) {
        const lower = rawBrand.toLowerCase();
        if (lower.includes('comisa')) return 'Comisa';
        if (lower.includes('viessmann')) return 'Viessmann';
        if (lower.includes('wilo')) return 'Wilo';
        if (lower.includes('sanha')) return 'SANHA';
        if (lower.includes('watts')) return 'Watts';
        if (lower.includes('fv-plast') || lower.includes('fv plast')) return 'FV-Plast';
        if (lower.includes('wavin')) return 'Wavin';
        if (lower.includes('centrometal')) return 'Centrometal';
        if (lower.includes('dražice') || lower.includes('drazice')) return 'Dražice';
        if (lower.includes('buderus')) return 'Buderus';
        if (lower.includes('thermawool')) return 'Thermawool';
        if (lower.includes('herz')) return 'HERZ';
        if (lower.includes('gorenje')) return 'Gorenje';
        if (lower.includes('rotex')) return 'Rotex';
        if (lower.includes('grundfos')) return 'Grundfos';
        if (lower.includes('thermaflex')) return 'Thermaflex';
        if (lower.includes('zilmet')) return 'Zilmet';
        if (lower.includes('junkers')) return 'Junkers';
        if (lower.includes('megatherm')) return 'Megatherm';
        if (lower.includes('pelltech')) return 'Pelltech';
        if (lower.includes('ponast')) return 'Ponast';
        if (lower.includes('bosch')) return 'Bosch';
        if (lower.includes('haier')) return 'Haier';
        if (lower.includes('gilės inžinerija') || lower.includes('giles inzinerija')) return 'Gilės Inžinerija';
        if (lower.includes('heimeier')) return 'IMI Heimeier';
        if (lower.includes('pneumatex')) return 'IMI Pneumatex';
        if (lower.includes('imi ta') || lower === 'ta') return 'IMI TA';
        if (lower.includes('ferroli')) return 'Ferroli';
        if (lower.includes('ferro')) return 'Ferro';
        if (lower.includes('danfoss')) return 'Danfoss';
    }

    const desc = input.description ?? '';
    const match = desc.match(/\|\s*Gamintojas\s*\|\s*([^|\r\n]+)\s*\|/i);
    if (match?.[1]) {
        const extracted = match[1].trim();
        if (extracted && extracted.toUpperCase() !== 'GI-AUTOMATIKA') {
            return inferProductBrandName({ brand: extracted });
        }
    }

    const sku = (input.sku ?? '').trim().toLowerCase();
    const haystack = `${input.title ?? ''} ${sku} ${desc}`.toLowerCase();

    if (/pneumatex|statico|aquapresso|compresso|transfero|zeparo|vento|pleno|^710|^711|^789|^810|^812|\bdlv\b|\bdsv\b/i.test(haystack)) {
        return 'IMI Pneumatex';
    }
    if (/imi\s*ta|\bstad\b|\bstaf\b|\btbv\b|ta-modulator|ta-compact|^52-/i.test(haystack)) {
        return 'IMI TA';
    }
    if (/heimeier|eclipse|dynacon|v-exact|calypso|raditec|multilux|globo|vekolux|regulux|^038|^060|^183|^224|^345|^371|^393|^394|^933/i.test(haystack)) {
        return 'IMI Heimeier';
    }
    if (/ferroli|divatech|bluehelix|^pol\.|^gi-ferroli/i.test(haystack)) {
        return 'Ferroli';
    }
    if (/danfoss|redia|ra-n|ra-fn|rlv|emo\b|twa\b|abn\b|icon\b|devireg|link\s*hc|\bjip\b|asv\b|ab-qm|leno|msv|^013|^014|^088|^140|^003|^042|^065|^180|^193/i.test(haystack)) {
        return 'Danfoss';
    }
    if (
        rawBrand === 'GI-AUTOMATIKA' ||
        rawBrand === 'ŠVOK Inžinerija' ||
        sku.startsWith('gi-') ||
        /montavimo dėž|montavimo dez|potinkin.*dėž|instaliacin.*dėž/i.test(haystack)
    ) {
        return 'ŠVOK Inžinerija';
    }
    return 'Danfoss';
}

export function resolveProductBrandInfo(input: {
    brand?: string | null;
    title?: string | null;
    sku?: string | null;
    description?: string | null;
}): BrandVisualInfo {
    const brandName = inferProductBrandName(input);
    return resolveBrandLogo(brandName, `${input.title ?? ''} ${input.sku ?? ''}`);
}

/**
 * 4 flagship hero showcase items with real manufacturer `.webp` photos and brand logos.
 */
export const HERO_FLAGSHIP_SHOWCASE: HeroFlagshipItem[] = [
    {
        sku: '013G2970',
        brand: 'Danfoss',
        brandLogoUrl: '/images/brands/danfoss.svg',
        title: 'Danfoss RA 2970 termostatinė galvutė',
        subtitle: 'Greita reakcija, RA „Click“ jungtis, tikslus kambario temperatūros palaikymas',
        imageUrl: '/images/products/013g2970.webp',
        href: '/products?q=013G2970',
    },
    {
        sku: '3933-02.000',
        brand: 'IMI Heimeier',
        brandLogoUrl: '/images/brands/imi-heimeier.svg',
        title: 'IMI Heimeier Eclipse DN15 vožtuvas',
        subtitle: 'Tiesioginis srauto ribojimas (l/h) ant vožtuvo be sudėtingų skaičiavimų',
        imageUrl: '/images/products/3933-02.000.webp',
        href: '/products?q=3933-02.000',
    },
    {
        sku: '52-151-014',
        brand: 'IMI TA',
        brandLogoUrl: '/images/brands/imi-ta.svg',
        title: 'IMI TA STAD DN15 balansinis vožtuvas',
        subtitle: 'AMETAL® lydinys, matavimo atvamzdžiai ir tikslus „Memory stop“ fiksavimas',
        imageUrl: '/images/products/52-151-014.webp',
        href: '/products?q=52-151-014',
    },
    {
        sku: '7101003',
        brand: 'IMI Pneumatex',
        brandLogoUrl: '/images/brands/imi-pneumatex.svg',
        title: 'IMI Pneumatex Statico SD 25.3 indas',
        subtitle: 'Šveicariška butilo membrana (Airproof) ilgaamžiam šildymo sistemos slėgiui',
        imageUrl: '/images/products/7101003.webp',
        href: '/products?q=7101003',
    },
];

/**
 * The 8 canonical Lithuanian HVAC & plumbing system groups with real equipment
 * thumbnails and representative SKUs so both everyday buyers and installers
 * immediately see the physical hardware.
 */
export const HVAC_SYSTEM_GROUPS: HvacSystemGroup[] = [
    {
        id: 'radiatoriai',
        title: 'Radiatoriai ir konvektoriai',
        plainDesc: 'Šilumos prietaisai kambariams šildyti ir jų tvirtinimo mazgai.',
        query: 'radiator',
        imageUrl: '/images/products/family-ferroli-boiler.webp',
        featuredSku: 'FERROLI-POL',
        brandLabel: 'Ferroli · IMI Heimeier',
    },
    {
        id: 'termostatai',
        title: 'Termostatinės galvutės ir vožtuvai',
        plainDesc: 'Rankenėlės ir vožtuvai, kuriais nustatoma kambario temperatūra ant radiatoriaus.',
        query: 'termostat',
        imageUrl: '/images/products/013g2970.webp',
        featuredSku: '013G2970 · 3933-02.000',
        brandLabel: 'Danfoss · IMI Heimeier',
    },
    {
        id: 'balansiniai',
        title: 'Balansiniai ir reguliavimo vožtuvai',
        plainDesc: 'Vožtuvai tolygiam šilumos paskirstymui tarp aukštų, stovų ir pastato dalių.',
        query: 'balans',
        imageUrl: '/images/products/52-151-014.webp',
        featuredSku: '52-151-014 · STAD',
        brandLabel: 'IMI TA · Danfoss',
    },
    {
        id: 'pletimosi-indai',
        title: 'Plėtimosi indai ir slėgio palaikymas',
        plainDesc: 'Indai ir stotelės, kompensuojantys vandens tūrio pokyčius ir palaikantys pastovų slėgį.',
        query: 'Statico',
        imageUrl: '/images/products/7101003.webp',
        featuredSku: '7101003 · Statico SD',
        brandLabel: 'IMI Pneumatex',
    },
    {
        id: 'oro-atskyrikliai',
        title: 'Oro atskyrikliai ir nuorintuvai',
        plainDesc: 'Automatiniai oro ir purvo šalinimo įrenginiai tylesniam bei efektyvesniam šildymui.',
        query: 'Zeparo',
        imageUrl: '/images/products/7895122.webp',
        featuredSku: '7895122 · Zeparo ZUC',
        brandLabel: 'IMI Pneumatex',
    },
    {
        id: 'grindinis-sildymas',
        title: 'Grindinis šildymas ir kolektoriai',
        plainDesc: 'Kolektoriai (šakotuvai), maišymo mazgai ir spintelės šiltų grindų kontūrams.',
        query: 'kolektor',
        imageUrl: '/images/products/9330-06.800.webp',
        featuredSku: '9330-06.800 · Dynacon',
        brandLabel: 'IMI Heimeier · Danfoss',
    },
    {
        id: 'automatika',
        title: 'Katilinės automatika ir pavaros',
        plainDesc: 'Elektrinės pavaros, valdikliai ir jutikliai automatiniam šilumos valdymui.',
        query: 'pavar',
        imageUrl: '/images/products/140f1064.webp',
        featuredSku: '140F1064 · EMO T',
        brandLabel: 'Danfoss · IMI TA',
    },
    {
        id: 'jungtys',
        title: 'Vamzdynų jungtys ir armatūra',
        plainDesc: 'Srieginės ir presuojamos jungtys, uždarymo ventiliai bei montavimo priedai.',
        query: 'ventili',
        imageUrl: '/images/products/0601-02.350.webp',
        featuredSku: '0601-02.350 · Eurokonus',
        brandLabel: 'IMI Heimeier · Danfoss',
    },
];

/**
 * Parse a v3 dual-audience product description into structured blocks so raw
 * markdown pipe tables (`| Parametras | Reikšmė |`) never leak into `<p>` tags.
 * Falls back cleanly to `legacyText` for plain-text descriptions.
 */
export function parseV3Description(raw: string | null | undefined): ParsedV3Description {
    const trimmed = (raw ?? '').trim();
    if (!trimmed) {
        return {
            hook: '',
            plainLayer: '',
            specRows: [],
            purpose: '',
            vatNotice: '',
            legacyText: '',
        };
    }

    const lines = trimmed.split(/\r?\n/).map((l) => l.trim());
    const hasSpecHeader = lines.some(
        (l) => /^specifikacija$/i.test(l) || (/^\|/.test(l) && /parametras/i.test(l)),
    );

    if (!hasSpecHeader) {
        return {
            hook: '',
            plainLayer: '',
            specRows: [],
            purpose: '',
            vatNotice: '',
            legacyText: trimmed,
        };
    }

    const specRows: V3SpecRow[] = [];
    const preSpecLines: string[] = [];
    const postSpecLines: string[] = [];
    let state: 'pre' | 'spec' | 'post' = 'pre';

    for (const line of lines) {
        if (!line) continue;

        if (state === 'pre') {
            if (/^specifikacija$/i.test(line)) {
                state = 'spec';
                continue;
            }
            if (line.startsWith('|')) {
                state = 'spec';
            } else {
                preSpecLines.push(line);
                continue;
            }
        }

        if (state === 'spec') {
            if (line.startsWith('|')) {
                const cells = line
                    .replace(/^\|/, '')
                    .replace(/\|$/, '')
                    .split('|')
                    .map((c) => c.trim());
                if (cells.length >= 2) {
                    const [c0, c1] = cells;
                    const isDivider = /^[-:\s]+$/.test(c0) && /^[-:\s]+$/.test(c1);
                    const isHeader =
                        /^parametras$/i.test(c0) && /^reikšmė|reiksme$/i.test(c1);
                    if (!isDivider && !isHeader && c0 && c1) {
                        specRows.push({ param: c0, value: c1 });
                    }
                }
                continue;
            } else {
                state = 'post';
            }
        }

        if (state === 'post') {
            postSpecLines.push(line);
        }
    }

    const hook = preSpecLines[0] ?? '';
    const plainLayer = preSpecLines.slice(1).join(' ');

    const purposeParts: string[] = [];
    let vatNotice = '';

    for (const line of postSpecLines) {
        if (/^visos kainos su pvm\.?$/i.test(line)) {
            vatNotice = line;
        } else {
            purposeParts.push(line);
        }
    }

    return {
        hook,
        plainLayer,
        specRows,
        purpose: purposeParts.join(' '),
        vatNotice,
        legacyText: '',
    };
}

/**
 * Deep 15-subtype HVAC UX guide generator ("UI Dievas + UX Specialistas").
 * Answers every buyer's practical questions:
 * 1. Kas įeina į komplektą (ką gaunate)
 * 2. Ko prireiks montavimui (rekomenduojama pasiruošti)
 * 3. Kaip rekomenduojama pritvirtinti / montuoti (4 žingsniai)
 * 4. Meistro patarimas (proTip)
 * 5. Dažniausia klaida, kurios išvengsite (commonMistake)
 * 6. 3 sek. tinkamumo patikra (selfCheck)
 */
export function getProductUxGuide(product: {
    title: string;
    category?: string | null;
    brand?: string | null;
    sku?: string | null;
    rawDescription?: string | null;
}): ProductUxGuide {
    const rawTitle = (product.title ?? '').trim();
    const t = rawTitle.toLowerCase();
    const cat = (product.category ?? '').toLowerCase();
    const skuLower = (product.sku ?? '').trim().toLowerCase();
    // Title-First hay: never include rawDescription or brand="Ferroli" when matching item subtype
    const text = `${t} ${cat} ${skuLower}`;

    const threadMatch = rawTitle.match(/\b(DN\s*\d+|M\d+[×x*]\d+(?:[.,]\d+)?|\d+\s*[″"]\s*[-x×]\s*\d+\/\d+\s*[″"]?|\d+\/\d+\s*[″"]|\d+\s*[″"])/i);
    const threadSize = threadMatch ? threadMatch[1].replace(/\s+/g, '') : '1″';
    const isLeftHand = /kairin/i.test(t);
    const isRightHand = /dešinin|desinin/i.test(t);
    const isWhite = /baltos|balta|ral\s*9016/i.test(t);
    const volumeMatch = rawTitle.match(/\b(\d+(?:[.,]\d+)?)\s*(?:l|ltr)\b/i);
    const volumeLabel = volumeMatch ? `${volumeMatch[1]} l` : '';

    // SUBTYPE 0A: Radiatoriaus pajungimo komplektas (radiator-mounting-kit)
    if (/kamščių komplektas|kamsciu komplektas|radiatoriaus pajungimo komplektas|montavimo komplektas radiatoriui|pajungimo komplektas.*radiator/i.test(t)) {
        const subtypeTitle = 'Radiatoriaus srieginis pajungimo ir nuorinimo komplektas';
        return {
            subtypeId: 'radiator-mounting-kit',
            subtypeKey: 'radiator-mounting-kit',
            subtypeTitle,
            subtypeBadge: 'Radiatoriaus pajungimo komplektas',
            whatYouGet: [
                `4 vnt. redukcinių radiatoriaus perėjimų (2 vnt. su dešininiu R sriegiu ir 2 vnt. su kairiniu L sriegiu${isWhite ? ', baltos spalvos RAL 9016 emalė' : ''})`,
                'Srieginė radiatoriaus aklė (kamštis) ir rankinis oro nuorintuvas (Majevskio čiaupelis su rakteliu)',
                'Pilnas gamyklinių plokščių paronitinių / silikoninių sandarinimo tarpinių komplektas visoms 4 radiatoriaus angoms',
            ],
            whatYouNeed: [
                'Lygiažiotis arba žiedinis veržliaraktis redukciniams perėjimams suveržti nepažeidžiant baltos emalės',
                'Laikikliai (kronšteinai) radiatoriui pakabinti ant sienos (parenkami pagal sekcijų skaičių)',
                'Termostatinis ir grįžtamasis radiatoriaus vožtuvas (1/2" arba 3/4" pagal komplekto sriegį)',
            ],
            steps: [
                {
                    title: 'Atskirkite dešininius (R) ir kairinius (L) perėjimus',
                    detail: 'Aliumininio ar sekcijinio radiatoriaus dešinėje pusėje sriegis yra dešininis (R — sukamas pagal laikrodžio rodyklę), o kairėje pusėje — kairinis (L — sukamas prieš laikrodžio rodyklę).',
                },
                {
                    title: 'Uždėkite plokščias tarpines ir įsukite 4 perėjimus',
                    detail: 'Ant švarių radiatoriaus kaklelių įsukite visus 4 perėjimus ranka ir tolygiai prispauskite veržliarakčiu be papildomų pakulų ant plokščios tarpinės.',
                },
                {
                    title: 'Viršutinėje angoje įsukite Majevskio oro nuorintuvą',
                    detail: 'Priešingoje nuo vamzdžių viršutinėje angoje įsukite rankinį oro nuorintuvą, o nenaudojamą apatinę angą užsukite komplekto akle.',
                },
                {
                    title: 'Prijunkite radiatoriaus vožtuvus ir nuorinkite',
                    detail: 'Į likusias angas įsukite termostatinį bei grįžtamąjį vožtuvą, užpildykite radiatorių vandeniu ir išleiskite orą per Majevskio čiaupelį.',
                },
            ],
            proTip: 'Prieš sukdami perėjimus ant stalo, visada pasitikrinkite sriegio kryptį pirštais — teisingos pusės perėjimas lengvai užsisuka ranka be jokios jėgos.',
            commonMistake: 'Dešininio (R) ir kairinio (L) perėjimo supainiojimas arba pakulų vyniojimas ant plokščios gamyklinės tarpinės.',
            selfCheck: [
                'Ar komplekto vidinis sriegis (1/2″ ar 3/4″) atitinka jūsų pasirinktų radiatoriaus vožtuvų sriegį?',
                'Ar įsidėjote į krepšelį sieninius radiatoriaus laikiklius (pvz., GI-FERROLI-004)?',
                'Ar turite termostatinį ir grįžtamąjį vožtuvą radiatoriaus prijungimui?',
            ],
            safetyNote: 'Nuorindami radiatorių per Majevskio čiaupelį laikykite indą po snapeliu ir saugokitės karšto šildymo sistemos vandens.',
        };
    }

    // SUBTYPE 0B: Radiatoriaus srieginė aklė, kamštis, redukcinis perėjimas arba sekcijų nipelis (radiator-plug-reducer)
    if (
        /\baklė|\bakle|\baklės|\bakles|\bkamštis|\bkamstis|perėjimas.*radiator|radiator.*perėjimas|nipelis.*radiator|radiator.*nipelis|jungimo reduktorius/i.test(t) ||
        (/\bperėjimas\b|\bperejimas\b/i.test(t) && /dešinin|desinin|kairin|1"|1″/i.test(t))
    ) {
        const subtypeTitle = 'Radiatoriaus srieginė aklė, kamštis ir redukcinis perėjimas';
        const handDesc = isLeftHand
            ? 'su kairiniu (L — sukamu prieš laikrodžio rodyklę) sriegiu'
            : isRightHand
              ? 'su dešininiu (R — sukamu pagal laikrodžio rodyklę) sriegiu'
              : 'su tiksliu gamykliniu sriegiu';
        const finishDesc = isWhite ? ' ir baltos spalvos (RAL 9016) emalės danga' : '';
        const itemDesc = /perėjim|perejim|kamštis.*1\/2|kamštis.*3\/4|reduktor/i.test(t)
            ? `Redukcinis radiatoriaus perėjimas / kamštis (${rawTitle}) ${handDesc}${finishDesc}`
            : /nipel/i.test(t)
              ? `Metalinis dvipusis sekcijų sujungimo nipelis ${threadSize} aliumininiam radiatoriui`
              : `Metalinė srieginė radiatoriaus aklė ${threadSize} ${handDesc}${finishDesc}`;
        return {
            subtypeId: 'radiator-plug-reducer',
            subtypeKey: 'radiator-plug-reducer',
            subtypeTitle,
            subtypeBadge: 'Radiatoriaus srieginė aklė / perėjimas',
            whatYouGet: [
                itemDesc,
                'Gamyklinė plokščia sandarinimo tarpinė (paronitinė / silikoninė arba EPDM O-žiedas srieginiam lizdui)',
                'Šešiabriaunė briauna veržliarakčiui — tvirtam įsukimui nepažeidžiant baltos apdailos',
            ],
            whatYouNeed: [
                'Veržliaraktis arba šešiabriaunė galvutė lygiomis briaunomis (kad nesubraižytumėte baltos emalės)',
                'Kitos radiatoriaus pusės srieginiai perėjimai (atminkite: aliumininių radiatorių dešinėje pusėje sriegis yra dešininis R, o kairėje — kairinis L!)',
                'Rankinis oro nuorintuvas (Majevskio čiaupelis) viršutinei radiatoriaus angai ir tvirtinimo laikikliai',
            ],
            steps: [
                {
                    title: 'Patikrinkite radiatoriaus pusę ir sriegio kryptį (R vs. L)',
                    detail: 'Aliuminio radiatorių dešinėje pusėje sriegis yra dešininis (R — sukamas pagal laikrodžio rodyklę), o kairėje — kairinis (L — sukamas prieš laikrodžio rodyklę).',
                },
                {
                    title: 'Nuvalykite radiatoriaus sriegio lizdą ir patikrinkite tarpinę',
                    detail: 'Nuvalykite radiatoriaus kolektoriaus kaklelį ir įsitikinkite, kad plokščia tarpinė lygiai priglunda prie srieginio petelio.',
                },
                {
                    title: 'Įsukite ranka ir tolygiai priveržkite raktu be perveržimo',
                    detail: 'Užsukite aklę ar perėjimą pirštais ir priveržkite lygiažiočiu raktu iki tarpinės suspaudimo — neperveržkite ilga svirtimi.',
                },
                {
                    title: 'Patikrinkite sandarumą užpildžius ir nuorinus radiatorių',
                    detail: 'Užpildykite šildymo kontūrą, išleiskite orą per nuorintuvą ir įsitikinkite, kad ties tarpine nėra drėgmės.',
                },
            ],
            proTip: 'Aliumininiuose radiatoriuose niekada nevyniokite storo pakulų sluoksnio ant plokščios tarpinės lizdo ir neperveržkite ilgu raktu — sandarumą užtikrina tarpinės prispaudimas prie lygaus radiatoriaus kaklelio.',
            commonMistake: 'Bandymas dešininio sriegio (R) aklę ar perėjimą įsukti į kairiąją aliumininio radiatoriaus pusę (kurioje yra kairinis L sriegis) — taip iškart sugadinamas radiatoriaus sriegis.',
            selfCheck: [
                'Ar montuojate į atitinkamą radiatoriaus pusę (dešininis R — dešinei pusei, kairinis L — kairei pusei)?',
                'Ar jūsų radiatoriaus kolektoriaus sriegis yra 1″?',
                'Ar turite perėjimus ir rankinį nuorintuvą likusioms radiatoriaus angoms?',
            ],
            safetyNote: 'Montavimo darbus atlikite tik išjungę šildymo kontūrą ir išleidę slėgį iš radiatoriaus.',
        };
    }

    // SUBTYPE 0C: Sandarinimo tarpinė, O-žiedas, EPDM kūgis (gasket-seal)
    if (
        /^tarpinė|^tarpine|\btarpinių\b|\btarpinės\b|paranitin.*tarpin|paronitin.*tarpin|\bo-žied|\bo-zied|\bo-ring|^cone epdm|^cone\b|^gasket|flange sealings|sight sealing|^packing\b/i.test(t) &&
        !/^antgalis|^vakuumin|^išsiplėtimo|^membraninis|^compresso|^transfero|^statico|^aquapresso/i.test(t)
    ) {
        const subtypeTitle = 'Sandarinimo tarpinė, EPDM O-žiedas ir vožtuvo sandariklis';
        return {
            subtypeId: 'gasket-seal',
            subtypeKey: 'gasket-seal',
            subtypeTitle,
            subtypeBadge: 'Sandarinimo tarpinė / O-žiedas',
            whatYouGet: [
                `Originalus gamintojo sandarinimo elementas (${rawTitle}) šildymo ir vandentiekio mazgams`,
                'Temperatūrai ir glikolio tirpalams atspari medžiaga (paronitas, EPDM arba NBR elastomeras)',
                'Tikslūs geometriniai matmenys pagal gamintojo vožtuvo arba radiatoriaus lizdą',
            ],
            whatYouNeed: [
                'Švarus beplaušis audinys ir minkštas šepetėlis sėdimo lizdo paviršiui nuvalyti nuo senų apnašų',
                'Silikoninis (EPDM/NBR tinkamas) tepalas O-žiedams drėkinti (niekada nenaudokite mineralinės alyvos)',
                'Dinamometrinis arba lygiažiotis veržliaraktis tolygiam suveržimui be tarpinės perkirpimo',
            ],
            steps: [
                {
                    title: 'Atjunkite mazgą ir sumažinkite slėgį',
                    detail: 'Uždarykite uždarymo čiaupus ir nuleiskite slėgį iš aptarnaujamo vožtuvo ar radiatoriaus.',
                },
                {
                    title: 'Švariai nuvalykite senos tarpinės likučius',
                    detail: 'Nuo flanšo ar srieginio lizdo pašalinkite visus prilipusius seno paronito, pakulų ar kalkių likučius neįbrėždami metalo.',
                },
                {
                    title: 'Tiksliai įstatykite naują tarpinę ar O-žiedą',
                    detail: 'Plokščią tarpinę centruokite ant petelio; EPDM O-žiedą lengvai sudrėkinkite vandeniu arba silikoniniu tepalu.',
                },
                {
                    title: 'Tolygiai suveržkite ir patikrinkite sandarumą',
                    detail: 'Priveržkite jungtį be perkrovos, užpildykite kontūrą ir įsitikinkite, kad įšilusiame mazge nėra pratekėjimo.',
                },
            ],
            proTip: 'Išrinkę seną srieginę ar flanšinę jungtį, visada dėkite naują plokščią tarpinę ar O-žiedą — antrą kartą suspausta sena tarpinė praranda elastingumą.',
            commonMistake: 'Mineralinio tepalo ar litolio tepimas ant EPDM O-žiedų — naftos produktai išbrinkdo ir suardo EPDM gumą per kelis mėnesius.',
            selfCheck: [
                'Ar tarpinės skersmuo (DN / mm) ir modelio serija (pvz., STAD, STAF, RLV-KS, radiatoriaus 1″) sutampa su jūsų mazgu?',
                'Ar keičiate visas išrinkto mazgo tarpines iš karto?',
                'Ar turite švarų įrankį lizdui nuvalyti prieš montavimą?',
            ],
            safetyNote: 'Keisdami tarpines įsitikinkite, kad šildymo kontūras atvėsęs ir be darbinio slėgio.',
        };
    }

    // SUBTYPE 0D: Vožtuvo serviso įdėklas, riebokšlis, šerdis, nustatymo raktas, rankenėlė (valve-insert-gland)
    if (
        /riebokšl|rieboksl|\bįdėklas\b|\bideklas\b|\binsert\b|\binsertas\b|\bšerdis\b|\bserdis\b|nustatymo raktas|reguliavimo raktas|matavimo antgalis|adatiniai antgaliai|allen key|torx key|\bwrench\b|key for measurement|plastic regulating key|^measuring point|two-way measuring point|measuring niple|^bonnet complete|^handwheel|reguliavimo rankenėlė|uždarymo ranken|atsarginė rankenėlė|^rankenėlė|msv-bd.*rankena|rankena dn|apsauga nuo vagystės|programavimo magnetas|spyruoklių rinkinys|impulsinis vamzdelis|impulse pipeline|ašelė ra|nuėmimo įrenginys|montavimo prietais|atsarginis kotas|atsuktuvų rinkinys|delonghi|vogel & noot|kermi|terma\b|purmo|dianorm|hendrad|prailginimas.*elementui|ašies prailgintojas/i.test(t) &&
        !/staf-sg|staf-sgt|staf-r|stad\b|stada\b|stag\b|ta-therm/i.test(t)
    ) {
        const subtypeTitle = 'Vožtuvo serviso įdėklas, riebokšlis, rankenėlė ir nustatymo įrankis';
        return {
            subtypeId: 'valve-insert-gland',
            subtypeKey: 'valve-insert-gland',
            subtypeTitle,
            subtypeBadge: 'Vožtuvo įdėklas / riebokšlis / raktas',
            whatYouGet: [
                `Originalus gamintojo vožtuvo serviso mazgas arba nustatymo įrankis (${rawTitle})`,
                'Tikslios gamyklinės EPDM tarpinės ir sriegis konkrečiai vožtuvų serijai (RA, V-exact, Eclipse, STAD/STAF)',
                'Pilnas suderinamumas su gamintojo korpusu be vamzdyno ardymo',
            ],
            whatYouNeed: [
                'Atitinkamo dydžio žiedinis arba dinamometrinis veržliaraktis (pvz., SW 10 / SW 13 / SW 19 pagal įdėklą)',
                'Švarus audinys vožtuvo lizdui nuvalyti prieš įsukant naują įdėklą ar riebokšlį',
                'Suderinama termostatinė galvutė (RA Click arba M30×1,5 pagal pasirinktą įdėklo tipą)',
            ],
            steps: [
                {
                    title: 'Patikrinkite esamo vožtuvo ar radiatoriaus seriją',
                    detail: 'Įsitikinkite, kad įdėklas, riebokšlis ar nustatymo raktas atitinka jūsų vožtuvo gamintoją (Danfoss RA, IMI Heimeier M30×1,5 arba IMI TA).',
                },
                {
                    title: 'Nuimkite termostatinę galvutę ir paruoškite lizdą',
                    detail: 'Riebokšlį (ašelę) daugeliu atvejų galima pakeisti neišleidžiant vandens; keičiant pilną ventilio įdėklą (insertą) be šliuzo — uždarykite kontūrą ir nuleiskite slėgį.',
                },
                {
                    title: 'Įsukite naują įdėklą ar riebokšlį',
                    detail: 'Švariai įsukite naują detalę ir priveržkite gamintojo nurodytu momentu, kad EPDM žiedas pilnai užsandarintų korpusą.',
                },
                {
                    title: 'Nustatykite srautą (Kv) ir uždėkite galvutę',
                    detail: 'Nustatymo raktu nustatykite projektinę Kv padalą ir užfiksuokite termostatinę galvutę.',
                },
            ],
            proTip: 'Danfoss RA riebokšlį (013G0290) galima pakeisti vos per 2 minutes neišleidžiant vandens iš radiatoriaus — pakanka žiedinio 10 mm raktelio.',
            commonMistake: 'Bandymas įsukti netinkamo gamintojo ventilio įdėklą į apatinio pajungimo radiatorių (Kermi, Purmo, Vogel & Noot ir DeLonghi turi skirtingus gylius bei sriegius).',
            selfCheck: [
                'Ar žinote tikslų savo radiatoriaus arba vožtuvo korpuso gamintoją ir seriją?',
                'Ar įdėklo jungtis galvutei yra Danfoss RA Click ar srieginė M30×1,5?',
                'Ar turite tinkamą raktą išankstiniam srauto (Kv) nustatymui?',
            ],
            safetyNote: 'Keisdami pilną ventilio įdėklą (insertą) be serviso šliuzo, būtinai išleiskite slėgį iš radiatoriaus ar kontūro.',
        };
    }

    // SUBTYPE 1A: Montavimo dėžutė patalpos termostatui / valdikliui (potinkinė / instaliacinė dėžutė)
    if (/montavimo dėž|montavimo dez|potinkin.*dėž|instaliacin.*dėž|^manifold dėž|^manifold box|^multibox dėžutė|dėžutė vožtuvui|dėžutė, balta/i.test(t)) {
        const subtypeTitle = 'Tvirtinimo mazgas, laikanti konsolė ir montavimo dėžutė';
        return {
            subtypeId: 'mounting-bracket',
            subtypeKey: 'mounting-bracket',
            subtypeTitle,
            subtypeBadge: 'Montavimo dėžutė ir tvirtinimo mazgas',
            whatYouGet: [
                'Standartizuota sieninė / potinkinė montavimo dėžutė (korpusas) patalpos termostatui arba valdikliui įstatyti',
                'Tvirtinimo auselės ir varžtų lizdai termostato rėmeliui lygiai su sienos plokštuma priveržti',
                'Perforuoti kabelių įvadai maitinimo laidui bei grindų jutiklio apsauginiam vamzdeliui (gofrai) prijungti',
            ],
            whatYouNeed: [
                'Karūnėlė (žiedinis grąžtas) arba perforatorius nišai sienoje suformuoti bei statybinis gipsas / varžtai dėžutei įtvirtinti',
                'Instaliacinis kabelis (pvz., 3×0,75 mm² arba 5×0,75 mm²) nuo kolektoriaus spintelės ir Ø16 mm gofruotas vamzdelis grindų jutikliui',
                'Gulsčiukas ir minkšta sandarinimo medžiaga kabelio įvadui nuo skersvėjo iš sienos ertmės užkimšti',
            ],
            steps: [
                {
                    title: 'Parinkite teisingą vietą ~1,5 m aukštyje ant vidinės sienos',
                    detail: 'Montavimo dėžutę planuokite 1,4–1,5 m aukštyje nuo grindų ant vidinės kambario sienos — toliau nuo tiesioginių saulės spindulių, langų skersvėjų ir šilumą skleidžiančių prietaisų.',
                },
                {
                    title: 'Įgilinkite ir išlyginkite dėžutę pagal sienos plokštumą',
                    detail: 'Išpjaukite angą ir įtvirtinkite montavimo dėžutę su gulsčiuku taip, kad jos priekinis kraštas sutaptų su galutiniu tinko ar gipskartonio paviršiumi.',
                },
                {
                    title: 'Įveskite termostato kabelį ir grindų jutiklio gofrą',
                    detail: 'Pro perforuotą dėžutės įvadą įkiškite valdymo kabelį iš kolektoriaus ir lygiasienį gofruotą vamzdelį grindų temperatūros jutikliui (palikite 10–15 cm laidų atsargą).',
                },
                {
                    title: 'Užsandarinkite kabelio įvadą ir prisukite termostato rėmelį',
                    detail: 'Kad šaltas oras iš sienos ar gofros neiškreiptų termostato vidinio jutiklio parodymų, įvado angą užkimškite minkšta vata, tuomet varžtais priveržkite termostato pagrindą.',
                },
            ],
            proTip: 'Būtinai užsandarinkite gofruoto vamzdelio angą pačioje montavimo dėžutėje — kitaip iš šaltos perdangos ar sienos ertmės kylantis skersvėjis vėsins termostato jutiklį ir kambarys bus nuolat perkaitinamas 2–3 °C.',
            commonMistake: 'Montavimo dėžutės įrengimas ant šaltos lauko sienos arba neužsandarinta kabelio gofra, dėl kurios termostatas matuoja sienos ertmės, o ne kambario oro temperatūrą.',
            selfCheck: [
                'Ar jūsų pasirinkto patalpos termostato galinė dalis atitinka šios montavimo dėžutės gylį ir varžtų tarpcentrį?',
                'Ar iki dėžutės vietos jau atvestas kabelis iš grindinio šildymo kolektoriaus valdiklio?',
                'Ar paklojote atskirą gofruotą vamzdelį grindų jutikliui, kad ateityje jį būtų galima laisvai įverti ar pakeisti?',
            ],
            safetyNote: 'Prieš montuodami dėžutę sienoje ir vesdami kabelius, įsitikinkite, kad gręžimo zonoje nėra paslėptų elektros laidų ar vandentiekio vamzdžių.',
        };
    }

    // SUBTYPE 1: Tvirtinimo detalė / konsolė / laikiklis ("Detalė tvirtinimo", SMU, Halter, bracket)
    if (
        /^detalė tvirtinimo|^detale tvirtinimo|^laikiklis|^laikikliai|indo laikiklis|^tvirtinimas su priedais|\bkonsolė\b|\bkonsole\b|\bsmu\b|halter|\bbracket\b|radiatoriaus laikiklis|laikiklis.*radiatoriui|chain for mounthing|atraminis smaigas|termostatų rėmelis/i.test(t) ||
        (/tvirtinim|laikikl|konsol|apkab|\bsmu\b|halter|bracket/i.test(t) && !/kolektor|galvut|vožtuv|ventili/i.test(t))
    ) {
        const subtypeTitle = 'Tvirtinimo mazgas ir laikanti konsolė';
        return {
            subtypeId: 'mounting-bracket',
            subtypeKey: 'mounting-bracket',
            subtypeTitle,
            subtypeBadge: subtypeTitle,
            whatYouGet: [
                'Originali gamintojo plieninė tvirtinimo konsolė / laikiklis (parinktas pagal įrenginio seriją ir gabaritus)',
                'Gamykliniai tvirtinimo lizdai / apkabos sujungimui su plėtimosi indu arba kolektoriumi',
                'Antikorozinis miltelinis / cinkuotas paviršiaus padengimas katilinės aplinkai',
            ],
            whatYouNeed: [
                'Sieniniai ankeriai / varžtai su kaiščiais pagal sienos tipą (betonui, pilnaviduriui mūrui ar blokeliams — parinkti pagal pilno su vandeniu indo svorį!)',
                'Atjungimo ir išleidimo vožtuvas (pvz., IMI Pneumatex DLV), kad ateityje indą galėtumėte aptarnauti neišleidę visos šildymo sistemos',
                'Gulsčiukas, dinamometrinis arba veržliaraktis ir sandarinimo medžiaga srieginiam sujungimui',
            ],
            steps: [
                {
                    title: 'Įvertinkite pilną svorį su vandeniu',
                    detail: 'Atminkite: tuščias plėtimosi indas yra lengvas, tačiau darbo metu ar plyšus membranai jis pilnai užsipildo vandeniu (pvz., 35 l indas sveria ~45 kg, 80 l — virš 95 kg). Tvirtinkite tik į laikančią sieną (betoną, mūrą), ne į viengubą gipskartonį.',
                },
                {
                    title: 'Pažymėkite taškus ir palikite aptarnavimo tarpus',
                    detail: 'Priglauskite konsolę su gulsčiuku. Virš indo oro ventilio ir prie vandens pajungimo palikite bent 15–20 cm laisvos erdvės manometrui, kompresoriui ir DLV čiaupui.',
                },
                {
                    title: 'Išgręžkite ir įtvirtinkite ankerius',
                    detail: 'Naudokite sienos medžiagai tinkamus ankerius (cheminius ankerius akytam betonui arba plėtimosi ankerius betonui). Priveržkite konsolę taip, kad ji visiškai neklibėtų.',
                },
                {
                    title: 'Pakabinkite įrenginį be vamzdyno įtempimų',
                    detail: 'Įstatykite indą / mazgą į tvirtinimo detalę, suveržkite apkabą ar jungiamąją veržlę ir tik tada prijunkite vamzdyną per aptarnavimo čiaupą (DLV), kad vamzdžiai nelaužtų sriegio.',
                },
            ],
            proTip: 'Prieš prijungdami plėtimosi indą prie tvirtinimo konsolės, patikrinkite jo pradinį dujų (azoto/oro) slėgį manometru, kol indas dar neprijungtas prie vandens — jis turi būti ~0,2–0,3 bar mažesnis už statinį sistemos aukščio slėgį (bet ne mažesnis nei 1,0 bar).',
            commonMistake: 'Tvirtinimas į silpną pertvarą trumpais buitiniais kaiščiais arba indo pakabinimas tiesiai ant vamzdžio be konsolės ir be DLV atjungimo vožtuvo.',
            selfCheck: [
                'Ar jūsų montuojamo indo / mazgo tūris (litrais) ir serija (pvz., Statico SD, Aquapresso A) atitinka šios tvirtinimo detalės aprašymą?',
                'Ar katilinės siena išlaikys pilnai vandeniu užpildyto indo svorį?',
                'Ar jau turite krepšelyje atjungimo vožtuvą (DLV) ir sienos tipui tinkamus ankerius?',
            ],
            safetyNote: 'Montuokite tik ant laikančios konstrukcijos, įvertinę pilną vandeniu užpildyto įrenginio masę.',
        };
    }

    // SUBTYPE 1B: Šiluminės izoliacijos kevalas vožtuvams / atskyrikliams (insulation-shell)
    if (/^izoliacija|^insulation|izoliacinis kevalas|zeparo-zchm.*izoliacija|zeparo-zhi|zeparo-zio|zeparo-zik|zeparo-zek/i.test(t)) {
        const subtypeTitle = 'Šiluminės ir antikondensacinės izoliacijos kevalas';
        return {
            subtypeId: 'insulation-shell',
            subtypeKey: 'insulation-shell',
            subtypeTitle,
            subtypeBadge: 'Izoliacinis kevalas',
            whatYouGet: [
                `Formuotas dviejų pusių šiluminės izoliacijos kevalas (${rawTitle}) tiksliam vožtuvo ar atskyriklio korpusui`,
                'Tvirtinimo sąvaržos / lipni ar įspaudžiama sujungimo briauna greitam uždėjimui',
                'Išpjova vožtuvo rankračiui bei matavimo atvamzdžiams pasiekti nenuimant kevalo',
            ],
            whatYouNeed: [
                'Atitinkamo DN skersmens ir serijos vožtuvas arba atskyriklis (pvz., STAD, STAF, Globo H/D, Zeparo)',
                'Lipni aliuminio arba elastomerinė juosta siūlėms sandarinti (jei montuojama šaldymo linijoje nuo kondensato)',
                'Jokių specialių įrankių (kevalas užsispaudžia ant sumontuoto vožtuvo rankomis)',
            ],
            steps: [
                {
                    title: 'Atlikite hidraulinį bandymą prieš uždėdami izoliaciją',
                    detail: 'Kevalą montuokite tik pilnai užpildę sistemą, patikrinę jungčių sandarumą ir nustatę balansinio vožtuvo padėtį.',
                },
                {
                    title: 'Apgaubkite vožtuvo korpusą dviem kevalo pusėmis',
                    detail: 'Suderinkite kevalo vidines išpjovas su vožtuvo kakleliu, rankračiu ir matavimo nipeliais.',
                },
                {
                    title: 'Užfiksuokite sujungimo briauną arba žiedus',
                    detail: 'Tvirtai suspauskite abi puses, kad tarp kevalo ir vamzdyno izoliacijos neliktų šiluminių tiltelių.',
                },
                {
                    title: 'Užklijuokite siūles šaldymo kontūruose',
                    detail: 'Vėsinimo sistemose visas kevalo sandūras papildomai užsandarinkite garo izoliacine juosta, kad nesikauptų kondensatas.',
                },
            ],
            proTip: 'Izoliuotas DN25–DN50 balansinis ar rutulinis vožtuvas katilinėje per šildymo sezoną sutaupo tiek pat šilumos, kiek ~1,5 m neizoliuoto plieninio vamzdžio.',
            commonMistake: 'Izoliacinio kevalo užklijavimas prieš atliekant srauto balansavimą ir sandarumo patikrą.',
            selfCheck: [
                'Ar kevalo kodas ir DN skersmuo tiksliai atitinka jūsų montuojamą vožtuvą (Globo H, Globo D, Multi-V, STAD ar STAF)?',
                'Ar naudojate kevalą šildymui (EPP/PUR) ar vėsinimui (garams nelaidus kevalas)?',
                'Ar rankratis lieka laisvai pasiekiamas uždėjus kevalą?',
            ],
            safetyNote: 'Montuokite kevalą ant atvėsusio arba darbinės temperatūros vamzdyno, neviršydami gamintojo nurodytos maksimalios terpės temperatūros.',
        };
    }

    // SUBTYPE 1C: Elektrinis arba kombinuotas vandens šildytuvas / boileris (water-heater-cylinder)
    if (/vandens šildytuvas|vandens sildytuvas|\bboileris\b|akumuliacin.*talp|elektrinis kaitinimo elementas|kaitinimo elemento adapteris/i.test(t)) {
        const subtypeTitle = 'Elektrinis / kombinuotas vandens šildytuvas (boileris) ir kaitinimo elementas';
        const capText = volumeLabel ? ` (${volumeLabel} talpos)` : '';
        return {
            subtypeId: 'water-heater-cylinder',
            subtypeKey: 'water-heater-cylinder',
            subtypeTitle,
            subtypeBadge: 'Vandens šildytuvas / boileris',
            whatYouGet: [
                `Gamyklinis vandens šildytuvas${capText} arba elektrinis kaitinimo elementas (${rawTitle}) su CE sertifikatu`,
                'Integruotas magnio anodas korozijos apsaugai, termostatas ir apsauginis perkaitimo ribotuvas',
                'Gamyklinis apsauginis-atbulinis vožtuvas (6–8 bar) ir techninis pasas',
            ],
            whatYouNeed: [
                'Sieniniai laikančios konstrukcijos ankeriai (įvertinant pilno su vandeniu boilerio masę!) ir 2 dielektrinės movos',
                'Geriamojo vandens plėtimosi indas (pvz., IMI Pneumatex Aquapresso) ir drenažo žarnelė apsauginiam vožtuvui',
                'Atskira įžeminta 230 V elektros linija su 30 mA nuotėkio rele (RCD)',
            ],
            steps: [
                {
                    title: 'Pakabinkite ant laikančios sienos ir įsukite dielektrines movas',
                    detail: 'Tvirtinkite ankeriais, skirtais pilnai užpildyto boilerio masei. Ant šalto ir karšto vandens atvamzdžių užsukite dielektrines movas nuo klaidžiojančių srovių.',
                },
                {
                    title: 'Sumontuokite apsauginį-atbulinį vožtuvą (6–8 bar)',
                    detail: 'Ant šalto vandens įvado privalomai sumontuokite apsauginį vožtuvą (tarp jo ir boilerio negali būti jokio uždarymo čiaupo!) ir nuveskite drenažo vamzdelį į kanalizaciją.',
                },
                {
                    title: 'Pilnai užpildykite vandeniu ir nuorinkite prieš įjungdami elektrą',
                    detail: 'Atsukite karšto vandens čiaupą maišytuve ir pildykite boilerį šaltu vandeniu, kol iš čiaupo bėgs tolygi srovė be oro.',
                },
                {
                    title: 'Prijunkite įžemintą 230 V maitinimą ir nustatykite 55–60 °C',
                    detail: 'Tik pilnai užpildę baką vandeniu įjunkite elektros maitinimą. Kartą per 12–18 mėn. patikrinkite magnio anodo būklę.',
                },
            ],
            proTip: 'Kartu su vandens šildytuvu šalto vandens linijoje sumontuokite nedidelį geriamojo vandens plėtimosi indą (Aquapresso) — tuomet šylant vandeniui apsauginis vožtuvas nevarvės.',
            commonMistake: 'Elektros įjungimas dar pilnai neužpildžius ir nenuorinus vandens šildytuvo — sausas kaitinimo elementas (TENas) perdega per keliasdešimt sekundžių.',
            selfCheck: [
                'Ar siena išlaikys pilnai vandeniu užpildyto šildytuvo svorį?',
                'Ar paruošta įžeminta 230 V jungtis ir drenažas apsauginiam vožtuvui?',
                'Ar įsidėjote geriamojo vandens plėtimosi indą (Aquapresso)?',
            ],
            safetyNote: 'Dujinių, elektrinių ir slėginių šildymo prietaisų pirminį paleidimą privalo atlikti atestuotas specialistas pagal gamintojo reikalavimus.',
        };
    }

    // SUBTYPE 1D: Šildymo katilas / šilumos siurblys (boiler-heat-source)
    if (/\bkatilas\b|šilumos siurblys|silumos siurblys|bluehelix|omnia|divatech/i.test(t)) {
        const subtypeTitle = 'Šilumos generavimo įrenginys (šildymo katilas / šilumos siurblys)';
        return {
            subtypeId: 'boiler-heat-source',
            subtypeKey: 'boiler-heat-source',
            subtypeTitle,
            subtypeBadge: 'Šildymo katilas / šilumos šaltinis',
            whatYouGet: [
                `Gamyklinis šildymo įrenginys (${rawTitle}) su CE žymėjimu ir gamintojo bandymo protokolu`,
                'Sieninė pakabinimo plokštė / rėmas, prijungimo šablonas ir techninis pasas',
                'Integruota saugos ir valdymo automatika',
            ],
            whatYouNeed: [
                'Magnetinis šlamo ir oro atskyriklis (pvz., IMI Pneumatex Zeparo) grįžtamoje linijoje šilumokaičio apsaugai',
                'Uždarymo čiaupai su filtrais, apsauginis vožtuvas (3 bar) ir plėtimosi indas (Statico)',
                'Dūmtraukio / kondensato nuvedimo sistema ir sertifikuoto meistro paleidimas',
            ],
            steps: [
                {
                    title: 'Išplaukite šildymo sistemą ir sumontuokite magnetinį filtrą',
                    detail: 'Prieš prijungdami katilą ar šilumos siurblį, hidropneumatiškai praplaukite vamzdyną ir grįžtamoje linijoje įrenkite magnetinį purvo atskyriklį.',
                },
                {
                    title: 'Pakabinkite įrenginį išlaikydami aptarnavimo tarpus',
                    detail: 'Tvirtinkite pagal gamintojo šabloną ant nedegios laikančios sienos.',
                },
                {
                    title: 'Prijunkite hidraulines linijas, kondensatą ir dūmtraukį',
                    detail: 'Sujunkite tiekiamą/grįžtamą šildymo kontūrą per uždarymo čiaupus be mechaninių vamzdyno įtempimų.',
                },
                {
                    title: 'Užpildykite minkštintu vandeniu ir kvieskite atestuotą specialistą',
                    detail: 'Užpildykite ir nuorinkite kontūrą (1,2–1,5 bar), o pirminį dujinį/elektrinį paleidimą patikėkite atestuotam specialistui.',
                },
            ],
            proTip: 'Magnetinis šlamo atskyriklis (Zeparo) grįžtamoje linijoje apsaugo katilo plokštelinį šilumokaitį ir cirkuliacinį siurblį nuo magnetito užkalkėjimo.',
            commonMistake: 'Naujo katilo prijungimas prie neplautos senos sistemos be magnetinio šlamo atskyriklio — prarandama gamintojo garantija.',
            selfCheck: [
                'Ar katilo šiluminė galia (kW) atitinka pastato projektinius šilumos nuostolius?',
                'Ar krepšelyje turite magnetinį purvo atskyriklį (Zeparo) ir plėtimosi indą (Statico)?',
                'Ar suplanuotas atestuoto specialisto pirminis paleidimas?',
            ],
            safetyNote: 'Dujinių, elektrinių ir slėginių šildymo prietaisų pirminį paleidimą privalo atlikti atestuotas specialistas pagal gamintojo reikalavimus.',
        };
    }

    // SUBTYPE 1E: Sekcijinis aliumininis ar plieninis radiatorius / konvektorius (sectional-radiator)
    if (/aliuminio lydinio radiatorius|aliumininis radiatorius|plieninis.*radiatorius|^radiatorius\b|\bkonvektorius\b/i.test(t)) {
        const subtypeTitle = 'Šildymo radiatorius / sekcijinis aliuminio ar plieno radiatorius';
        return {
            subtypeId: 'sectional-radiator',
            subtypeKey: 'sectional-radiator',
            subtypeTitle,
            subtypeBadge: 'Šildymo radiatorius',
            whatYouGet: [
                `Gamykliškai išbandytas ir milteliniu būdu dažytas (RAL 9016) šildymo radiatorius (${rawTitle})`,
                'Aukšto šiluminio laidumo konvekcinės briaunos ir 1″ srieginės kolektoriaus angos (sekcijiniams modeliams)',
                'Gamyklinė apsauginė transportavimo ir montavimo pakuotė',
            ],
            whatYouNeed: [
                'Radiatoriaus pajungimo komplektas (GI-FERROLI-001: 2 dešininiai R + 2 kairiniai L perėjimai 1″×1/2″ arba 1″×3/4″, aklė ir Majevskio nuorintuvas)',
                'Sieniniai radiatoriaus laikikliai (pvz., GI-FERROLI-004 — 2 arba 3 vnt. pagal radiatoriaus ilgį)',
                'Termostatinis radiatoriaus vožtuvas su galvute (pvz., Eclipse + K-galvutė arba RA-N + Redia) ir grįžtamasis vožtuvas (Regulux / RLV-S)',
            ],
            steps: [
                {
                    title: 'Pažymėkite laikiklių vietas išlaikydami konvekcijos tarpus',
                    detail: 'Išlaikykite ≥10–12 cm tarpą nuo grindų, ≥3–5 cm nuo sienos ir ≥10 cm po palange, kad šiltas oras laisvai cirkuliuotų kambaryje.',
                },
                {
                    title: 'Įsukite dešininius (R) ir kairinius (L) perėjimus su tarpinėmis',
                    detail: 'Į dešinę radiatoriaus pusę sukite dešininio sriegio (R), o į kairę — kairinio sriegio (L) perėjimus, aklę bei viršutinį Majevskio nuorintuvą.',
                },
                {
                    title: 'Pakabinkite radiatorių ant laikiklių ir prijunkite vožtuvus',
                    detail: 'Pakabinkite radiatorių horizontaliai pagal gulsčiuką, prijunkite viršutinį termostatinį ir apatinį grįžtamąjį vožtuvą.',
                },
                {
                    title: 'Užpildykite vandeniu, nuorinkite ir nuimkite plėvelę po remonto',
                    detail: 'Lėtai atsukite vožtuvus, išleiskite orą per Majevskio čiaupelį ir patikrinkite visų 4 srieginių perėjimų sandarumą.',
                },
            ],
            proTip: 'Aliuminio radiatoriams iki 10 sekcijų naudokite bent 2 sieninius laikiklius viršuje ir 1 atraminį laikiklį apačioje; virš 10 sekcijų — 3 viršutinius laikiklius.',
            commonMistake: 'Radiatoriaus užsakymas be 1″ srieginių perėjimų komplekto (GI-FERROLI-001) ir be sieninių laikiklių (GI-FERROLI-004) — sekcijiniai radiatoriai gamykliškai komplektuojami atskirai nuo perėjimų.',
            selfCheck: [
                'Ar ašių tarpas (350 mm ar 500 mm) atitinka jūsų išvestų vamzdžių tarpcentrį?',
                'Ar įsidėjote į krepšelį kamščių komplektą su nuorintoju (GI-FERROLI-001) ir laikiklius (GI-FERROLI-004)?',
                'Ar pasirinkote termostatinį ir grįžtamąjį vožtuvą pagal vamzdyno skersmenį (1/2″ ar 3/4″)?',
            ],
            safetyNote: 'Montuokite radiatorių tik ant tvirtų sieninių laikiklių ir neviršykite gamintojo nurodyto maksimalaus darbinio slėgio (10–16 bar).',
        };
    }

    // SUBTYPE 1F: Granulių degiklio komplektas, uždegimo tenas, kuro sraigtas, bunkeris, purkštukas (pellet-burner-kit)
    if (
        /degikl|granulių degikl|uždegimo|uzdegimo|\btenas\b|kaitinimo tenas|kuro talpa|bunkeris|kuro purkštuk|purkštukas|turbulizator|degkmpl|^katgr|^katm|^katf|^egip-gli|^o30h|^030h|^030f|^030b/i.test(
            `${t} ${skuLower}`,
        )
    ) {
        const isBurnerKit = /degiklio komplektas|degkmpl/i.test(`${t} ${skuLower}`);
        const isIgniter = /\btenas\b|uždegimo|uzdegimo|^katgr|^katm|^katf|^egip-gli/i.test(`${t} ${skuLower}`);
        const isNozzle = /purkštuk|purkstuk|^o30h|^030h|^030f|^030b/i.test(`${t} ${skuLower}`);
        const subtypeBadge = isBurnerKit
            ? 'Granulių degiklių komplektai'
            : isIgniter
              ? 'Degiklio uždegimo tenas'
              : isNozzle
                ? 'Skysto kuro purkštukas'
                : 'Degikliai ir katilinės priedai';
        const subtypeTitle = isBurnerKit
            ? 'Automatinis medienos granulių degiklio komplektas su sraigtu ir talpa'
            : isIgniter
              ? 'Keraminis / kvarcinis / metalinis granulių degiklio uždegimo tenas'
              : isNozzle
                ? 'Kalibruotas skysto kuro degiklio purkštukas (Danfoss OD / EH)'
                : 'Katilo ir granulių degiklio inžinerinis mazgas';
        return {
            subtypeId: 'pellet-burner-kit',
            subtypeKey: 'pellet-burner-kit',
            subtypeTitle,
            subtypeBadge,
            whatYouGet: isBurnerKit
                ? [
                      `Automatinis medienos granulių degiklis (${rawTitle}) su moduliuojančiu mikroprocesoriniu valdikliu`,
                      'Lankstus ugniai atsparus granulių padavimo vamzdis ir šnekinis padavimo sraigtas su reduktoriumi',
                      'Cinkuoto plieno 460 L granulių bunkeris (talpa) ir katilo durelių montavimo flanšas su keraminiu sandarikliu',
                  ]
                : [
                      `Originalus degiklio arba katilo mazgas (${rawTitle}) pagal gamintojo specifikaciją`,
                      'Karščiui atspari konstrukcija (iki 1000–1200 °C uždegimo zonoje) arba tikslus srieginis tvirtinimas',
                      'Pilnas suderinamumas su nurodytais Pelltech, Megatherm, Ferroli SUN P ar Centrometal degikliais',
                  ],
            whatYouNeed: [
                'Nedegi katilo durelių angos izoliacinė tarpinė ir 4 tvirtinimo smeigės degiklio flanšui',
                'Įžeminta 230 V elektros linija su įtampos stabilizatoriumi / UPS katilinės automatikai',
                'Kaminkrėčio patikrinta dūmtraukio trauka (15–20 Pa) ir apsauginis termostatas (STB)',
            ],
            steps: [
                {
                    title: 'Paruoškite katilo durelių flanšą ir sandarinimą',
                    detail: 'Sumontuokite montavimo plokštę ant kieto kuro katilo durelių taip, kad degiklio tūta įeitų į pakurą be atvirų oro plyšių.',
                },
                {
                    title: 'Pastatykite 460 L granulių talpą ir sraigtą 40–45° kampu',
                    detail: 'Suformuokite saugų atstumą tarp bunkerio ir katilo; sraigtą sujunkite su degikliu lanksčia lydžiąja poliuretano žarna (saugos vožtuvu nuo atbulinės liepsnos).',
                },
                {
                    title: 'Prijunkite katilo, boilerio ir patalpos jutiklius',
                    detail: 'Panardinkite NTC temperatūros zondą į katilo gilzę, prijunkite apsauginį STB termostatą ir cirkuliacinio siurblio valdymą.',
                },
                {
                    title: 'Sukalibruokite sraigto našumą ir oro padavimą',
                    detail: 'Pasverkite per 6 min. sraigto подаduodamų granulių svorį (g), įveskite kalibravimo reikšmę į valdiklį ir patikrinkite automatinį uždegimą.',
                },
            ],
            proTip: 'Kartą per sezoną pasverkite naujos partijos granulių sraigto našumą — skirtingo tankio 6 mm ir 8 mm granulės keičia degiklio šiluminę galią iki 15–20 %.',
            commonMistake: 'Tiesus metalinis vamzdis tarp sraigto ir degiklio vietoje lanksčios lydžiosios poliuretano žarnos — lanksti žarna yra privalomas priešgaisrinis saugiklis.',
            selfCheck: [
                'Ar katilo pakuros gylis pakankamas degiklio liepsnos fakelui (bent 35–45 cm)?',
                'Ar katilinėje yra pakankama natūrali pritekamojo oro ventiliacija degimui?',
                'Ar pasirinkta degiklio galia (kW) atitinka esamo katilo šilumokaičio plotą?',
            ],
            safetyNote: 'Granulių degiklio prijungimą prie elektros tinklo ir dūmų analizatoriaus derinimą rekomenduojama patikėti kvalifikuotam šildymo inžinieriui.',
        };
    }

    // SUBTYPE 1G: Cirkuliacinis, giluminis arba nuotekų siurblys (circulation-pump)
    if (/\bsiurblys\b|\bsiurbliai\b|\byonos\b|\bstratos\b|\balpha2\b|\bmagna1\b|\bmagna3\b|\bdrainlift\b|\bsololift\b|\bstar-rs\b|\bstar-z\b|\btop-s\b/i.test(t)) {
        const subtypeTitle = 'Elektroninis cirkuliacinis ir vandentiekio siurblys';
        return {
            subtypeId: 'circulation-pump',
            subtypeKey: 'circulation-pump',
            subtypeTitle,
            subtypeBadge: 'Cirkuliacinis / vandens siurblys',
            whatYouGet: [
                `Originalus didelio efektyvumo siurblys (${rawTitle}) su elektroniniu sūkių reguliavimu`,
                'Gamyklinės EPDM sandarinimo tarpinės ir greito prijungimo elektros kištukas',
                'Šilumos izoliacijos kevalas (šildymo cirkuliaciniams modeliams)',
            ],
            whatYouNeed: [
                'Siurblio srieginių pusmovių („amerikankių“) komplektas pagal prijungimo sriegį (G 1 1/2″ -> Rp 1″ arba G 2″ -> Rp 1 1/4″)',
                'Magnetinis šlamo atskyriklis ir tinklinis koštuvas prieš siurblį',
                'Du rutuliniai uždarymo čiaupai abiejose siurblio pusėse patogiam aptarnavimui',
            ],
            steps: [
                {
                    title: 'Montuokite siurblio ašį griežtai horizontaliai',
                    detail: 'Šlapio rotoriaus cirkuliacinio siurblio variklio velenas privalo būti horizontalioje padėtyje, kad keraminiai guoliai būtų nuolat tepami ir aušinami.',
                },
                {
                    title: 'Patikrinkite srauto krypties rodyklę ant korpuso',
                    detail: 'Įsukite siurblį tarp pusmovių su plokščiomis tarpinėmis taip, kad elektroninio valdymo dėžutė nebūtų nukreipta į apačią.',
                },
                {
                    title: 'Užpildykite sistemą ir paleiskite nuorinimo režimą',
                    detail: 'Niekada nejunkite siurblio sausai! Užpildę kontūrą vandeniu, įjunkite automatinį rotoriaus kameros nuorinimo režimą.',
                },
                {
                    title: 'Pasirinkite valdymo kreivę (Δp-v radiatoriams / Δp-c grindims)',
                    detail: 'Radiatorių kontūrui pasirinkite kintamo slėgio (Δp-v), o grindinio šildymo kontūrui — pastovaus slėgio (Δp-c) kreivę.',
                },
            ],
            proTip: 'Radiatoriniam šildymui visada rinkitės Δp-v (kintamo diferencinio slėgio) režimą — užsidarinėjant termostatinėms galvutėms siurblys sumažina slėgį ir vožtuvuose neatsiranda švilpimo.',
            commonMistake: 'Siurblio variklio galvutės sumontavimas vertikaliai į viršų arba į apačią — viršutiniame guolyje susikaupia oro burbulas ir guolis sudyla per kelis mėnesius.',
            selfCheck: [
                'Ar siurblio montavimo ilgis (130 mm ar 180 mm) ir sriegis (G 1″, G 1 1/2″, G 2″) atitinka jūsų mazgą?',
                'Ar įsidėjote į krepšelį siurblio pusmovių komplektą ir uždarymo čiaupus?',
                'Ar prieš siurblį sumontuotas magnetinis šlamo atskyriklis?',
            ],
            safetyNote: 'Griežtai draudžiama įjungti cirkuliacinį siurblį be vandens — keraminiai guoliai sausai perkais per kelias sekundes.',
        };
    }

    // SUBTYPE 2: Slėgio palaikymo stotelė / degazavimo modulis (Compresso, Transfero, Simply, Vento, Pleno)
    if (/compresso|transfero|simply|pleno|vento|slėgio palaikymo stotel|degazav|master-slave-dms|comcube/i.test(t)) {
        const subtypeTitle = 'Automatinė slėgio palaikymo ir degazavimo stotelė';
        return {
            subtypeId: 'pressurization-station',
            subtypeKey: 'pressure-station',
            subtypeTitle,
            subtypeBadge: subtypeTitle,
            whatYouGet: [
                'Gamykliškai sukomplektuotas slėgio palaikymo / degazavimo modulis su valdikliu (BrainCube / Connect)',
                'Integruoti slėgio jutikliai ir apsauginiai atbuliniai / elektromagnetiniai vožtuvai',
                'Prijungimo gnybtai ir gamintojo paleidimo dokumentacija',
            ],
            whatYouNeed: [
                'Priešslėgio arba buferinis plėtimosi indas (jei stotelė komplektuojama atskirai nuo bazinio indo)',
                'Lanksčios antivibracinės jungtys ir rutulinis uždarymo čiaupas su filtru grįžtamoje linijoje',
                'Atskiras 230 V maitinimo įvadas su automatiniu jungikliu ir drenažo trapas katilinėje',
            ],
            steps: [
                {
                    title: 'Pastatykite ant lygaus pagrindo grįžtamoje linijoje',
                    detail: 'Stotelę montuokite sausoje katilinės zonoje ant lygaus betoninio pagrindo, prijunkite prie grįžtamojo kolektoriaus prieš cirkuliacinius siurblius.',
                },
                {
                    title: 'Sumontuokite purvo filtrą ir uždarymo armatūrą',
                    detail: 'Prieš prijungimo atvamzdį įrenkite tinklinį filtrą ir aptarnavimo čiaupą, kad sistemos šlamas nepatektų į stotelės vožtuvus.',
                },
                {
                    title: 'Prijunkite papildymo liniją ir elektros maitinimą',
                    detail: 'Jei sistema turi automatinį papildymą (Pleno), prijunkite vandentiekį per atbulinį vožtuvą (BA) ir skaitiklį.',
                },
                {
                    title: 'Sukalibruokite BrainCube valdiklį',
                    detail: 'Įveskite statinį pastato aukštį, apsauginio vožtuvo suveikimo slėgį ir atlikite pirminį savaiminio nuorinimo bei priešslėgio ciklą.',
                },
            ],
            proTip: 'Prijungimo vamzdyne tarp sistemos ir stotelės nenaudokite susiaurėjimų — vamzdžio DN turi atitikti gamintojo nurodytą nominalą, kad slėgio jutiklis nefiksuotų klaidingų hidraulinių šuolių.',
            commonMistake: 'Stotelės paleidimas sausai be pirminio kameros nuorinimo arba prijungimas prie tiekiamojo vamzdyno, kur temperatūra viršija leistiną membranos ribą (+70 °C).',
            selfCheck: [
                'Ar šildymo/šaldymo sistemos bendras tūris ir galingumas (kW) atitinka šio modulio darbo grafiką?',
                'Ar katilinėje yra 230 V lizdas ir kanalizacijos trapas avariniam išleidimui?',
                'Ar grįžtamojo vandens temperatūra prijungimo taške neviršija 70 °C?',
            ],
            safetyNote: 'Elektros ir slėginės dalies paleidimą atlikite tik užpildytame ir nuorintame kontūre, išjungę pagrindinius siurblius.',
        };
    }

    // SUBTYPE 3: Membraninis plėtimosi indas (Statico, Aquapresso, plėtimosi indas)
    if (/statico|aquapresso|plėtimosi|pletimosi|išsiplėtimo|membran/i.test(text)) {
        const subtypeTitle = 'Membraninis plėtimosi indas (šildymui / vandentiekiui)';
        return {
            subtypeId: 'expansion-vessel',
            subtypeTitle,
            subtypeBadge: subtypeTitle,
            whatYouGet: [
                'Hermetiškas plieninis plėtimosi indas su ilgaamže Airproof butilo membrana',
                'Gamyklinis dujų (azoto/oro) priešslėgis su apsauginiu ventilio dangteliu',
                'Srieginis vandens prijungimo atvamzdis (pvz., G3/4" arba G1")',
            ],
            whatYouNeed: [
                'Tvirtinimo konsolė / sieninis laikiklis (indams iki 80 l) arba lygi grindų aikštelė (pastatomiems SG/AG indams)',
                'IMI Pneumatex DLV aptarnavimo vožtuvas su išleidimo čiaupu ir apsauga nuo netyčinio uždarymo',
                'Manometras pradinio dujų priešslėgio patikrai ir derinimui prieš montavimą',
            ],
            steps: [
                {
                    title: 'Nustatykite pradinį dujų priešslėgį (P0)',
                    detail: 'Prieš prijungdami indą prie vandens, patikrinkite ir nustatykite dujų priešslėgį pagal pastato statinį aukštį (10 m = 1 bar) plius 0,2 bar garų atsarga.',
                },
                {
                    title: 'Pritvirtinkite indą ir įsukite DLV vožtuvą',
                    detail: 'Montuokite ant grįžtamojo šildymo vamzdyno (prieš cirkuliacinį siurblį) per DLV uždarymo-išleidimo ventilį.',
                },
                {
                    title: 'Sandarinkite sriegį be perkrovos',
                    detail: 'Naudokite inžinerinę pakulą su pasta arba anaerobinį sandariklį; priveržkite veržliarakčiu už šešiabriaunio atvamzdžio.',
                },
                {
                    title: 'Užpildykite sistemą ir pažymėkite darbinį slėgį',
                    detail: 'Užpildę ir nuorinę sistemą, nustatykite darbinį vandens slėgį ~0,3–0,5 bar didesnį už pradinį indo priešslėgį.',
                },
            ],
            proTip: 'Kartą per metus profilaktiškai uždarykite DLV vožtuvą, išleiskite vandenį iš indo per drenažo čiaupą ir patikrinkite dujų priešslėgį — tai prailgina membranos tarnavimo laiką 2–3 kartus.',
            commonMistake: 'Indo montavimas su gamykliniu priešslėgiu jo nesuderinus pagal konkretų namo aukštį — dėl to indas dirba tik puse tūrio arba suveikia apsauginis vožtuvas.',
            selfCheck: [
                'Ar pasirinkote tinkamą seriją: Statico (šildymo sistemoms) ar Aquapresso (geriamajam vandeniui / boileriui)?',
                'Ar turite krepšelyje sieninį laikiklį (konsolę) ir DLV aptarnavimo vožtuvą?',
                'Ar indo maksimalus darbinis slėgis (3 bar, 6 bar ar 10 bar) atitinka jūsų apsauginį vožtuvą?',
            ],
            safetyNote: 'Slėginę įrangą montuokite tik išjungę cirkuliacinį siurblį ir sumažinę sistemos slėgį; pradinį priešslėgį tikrinkite be vandens slėgio.',
        };
    }

    // SUBTYPE 4: Apsauginė ir aptarnavimo armatūra (DLV, DSV, manometrai, apsauginiai vožtuvai)
    if (/\bdlv\b|\bdsv\b|apsauginis|manometr|išleidimo|isleidimo/i.test(text)) {
        const subtypeTitle = 'Apsauginė ir aptarnavimo katilinės armatūra';
        return {
            subtypeId: 'safety-service-valve',
            subtypeTitle,
            subtypeBadge: subtypeTitle,
            whatYouGet: [
                'Originalus žalvarinis / bronzinis aptarnavimo arba apsauginis vožtuvas',
                'Fiksuojama rankenėlė / plombavimo gaubtelis nuo netyčinio perjungimo',
                'Integruotas drenažo / išleidimo atvamzdis su aklės dangteliu',
            ],
            whatYouNeed: [
                'Aukštai temperatūrai atspari sriegio sandarinimo medžiaga (pakula su pasta arba PTFE siūlas)',
                'Drenažo žarnelė arba varinis nuvedimo vamzdelis į katilinės trapą',
                'Atitinkamo dydžio raginis veržliaraktis (nenaudokite santechninių replių ant korpuso)',
            ],
            steps: [
                {
                    title: 'Patikrinkite sriegio skersmenį ir PN/bar žymėjimą',
                    detail: 'Įsitikinkite, kad vožtuvo prijungimo sriegis (pvz., Rp 3/4" arba G 1") ir suveikimo slėgis atitinka montuojamą indą ar katilą.',
                },
                {
                    title: 'Įsukite srauto kryptimi',
                    detail: 'Laikykitės ant žalvarinio korpuso išlietos srauto rodyklės; drenažo čiaupą nukreipkite taip, kad būtų patogu prijungti išleidimo žarnelę.',
                },
                {
                    title: 'Užfiksuokite darbinę (atvirą) padėtį',
                    detail: 'DLV vožtuvo rankenėlę nustatykite į atvirą padėtį ir užfiksuokite apsauginiu varžteliu/plomba pagal STR reikalavimus.',
                },
                {
                    title: 'Patikrinkite sandarumą ir drenažo veikimą',
                    detail: 'Sukėlę darbinį sistemos slėgį, įsitikinkite, kad per sriegius ir drenažo aklę nesisunkia vanduo.',
                },
            ],
            proTip: 'Tarp katilo / plėtimosi indo ir apsauginio vožtuvo (DSV) griežtai draudžiama montuoti bet kokius uždarymo čiaupus ar filtrus — kelias turi būti 100 % atviras.',
            commonMistake: 'Paprasto buitinio rutulinio čiaupo naudojimas vietoje DLV vožtuvo: netyčia uždarius paprastą čiaupą, plėtimosi indas atsijungia nuo sistemos ir iššauna apsauginis vožtuvas.',
            selfCheck: [
                'Ar vožtuvo sriegis (DN15 / 1/2", DN20 / 3/4", DN25 / 1") atitinka jūsų plėtimosi indo atvamzdį?',
                'Ar palikta vietos prijungti išleidimo žarnelę patikros metu?',
                'Ar suveikimo slėgis (bar) neviršija silpniausio sistemos mazgo darbinio slėgio?',
            ],
            safetyNote: 'Apsauginės armatūros išmetimo vamzdelį visada nukreipkite žemyn į drenažą, kad suveikimo metu karštas garas nesužalotų žmonių.',
        };
    }

    // SUBTYPE 5: Oro ir purvo / šlamo atskyriklis bei nuorintuvas (Zeparo, Hyjet, separator)
    if (/zeparo|hyjet|oro atskyr|purvo atskyr|nuorintuv|separator/i.test(text)) {
        const subtypeTitle = 'Automatinis oro, mikromullių ir šlamo atskyriklis';
        return {
            subtypeId: 'air-dirt-separator',
            subtypeTitle,
            subtypeBadge: subtypeTitle,
            whatYouGet: [
                'Žalvarinis arba plieninis atskyriklio korpusas su vidiniu Heimeier/Pneumatex Heiscol arba cikloniniu elementu',
                'Automatinis plūdinis oro nuorinimo vožtuvas viršutinėje dalyje (arba apatinis drenažo čiaupas purvo modeliui)',
                'Magnetinis apvalkalas magnetito dalelių surinkimui (priklausomai nuo ZUM/ZUK/ZUC modifikacijos)',
            ],
            whatYouNeed: [
                'Du rutuliniai uždarymo čiaupai prieš ir už atskyriklio patogiam aptarnavimui ir praplovimui',
                'Šiluminės izoliacijos kevalas (jei montuojama šaldymo arba aukštos temperatūros linijoje)',
                'Srieginiai perėjimai arba presuojamos jungtys pagal vamzdyno skersmenį',
            ],
            steps: [
                {
                    title: 'Parinkite teisingą vietą sistemoje',
                    detail: 'Oro atskyriklį montuokite karščiausioje vietos zonoje (tiekiamoje linijoje iškart už katilo), o purvo/magnetito atskyriklį — grįžtamoje linijoje prieš katilą ir siurblį.',
                },
                {
                    title: 'Išlaikykite griežtai vertikalią kameros padėtį',
                    detail: 'Nuorinimo galvutė privalo būti nukreipta vertikaliai į viršų, kad plūdės mechanizmas netrukdomai išleistų mikroburbuliukus.',
                },
                {
                    title: 'Sujunkite vamzdyną pagal srauto rodyklę',
                    detail: 'Stebėkite rodyklę ant korpuso. Palikite bent 10 cm tarpą po drenažo čiaupu kibirui ar žarnelei pakišti.',
                },
                {
                    title: 'Atlikite pirminį nuorinimą ir šlamo nuleidimą',
                    detail: 'Po pirmųjų 24–48 val. šildymo darbo nuimkite magnetą ir trumpam atidarykite apatinį čiaupą, kad pašalintumėte surinktą magnetitą.',
                },
            ],
            proTip: 'Šiuolaikiniams kondensaciniams katilams ir šilumos siurbliams su elektroniniais cirkuliaciniais siurbliais magnetinis šlamo atskyriklis (Zeparo su magnetu) yra būtinas — magnetitas kitaip užkemša siurblio rotorių.',
            commonMistake: 'Atskyriklio sumontavimas pasvirusiu kampu arba priešinga srauto kryptimi, dėl ko cikloninė kamera nesukuria sūkurio ir oras/purvas keliauja toliau į radiatorius.',
            selfCheck: [
                'Ar vamzdžio skersmuo (DN20, DN25, DN32 ar flanšas) atitinka pasirinktą Zeparo modelį?',
                'Ar montavimo vieta yra horizontalioje ar vertikalioje vamzdžio atkarpoje (pagal ZUV / ZUK / ZUC tipą)?',
                'Ar palikta vietos viršuje nuorintuvo dangteliui ir apačioje purvo išleidimui?',
            ],
            safetyNote: 'Plovimo ar nuosėdų išleidimo metu saugokitės karšto termofikacinio vandens — darbus atlikite su apsauginėmis pirštinėmis.',
        };
    }

    // SUBTYPE 6: Grindinio šildymo kolektorius ir priedai (Dynacon, spintelės, FHF)
    if (/dynacon|kolektor|grindin|spintel|žiedų|ziedu|kontūr/i.test(text)) {
        const subtypeTitle = 'Grindinio šildymo kolektorius ir kontūrų paskirstymas';
        return {
            subtypeId: 'floor-heating-manifold',
            subtypeTitle,
            subtypeBadge: subtypeTitle,
            whatYouGet: [
                'Tiekiamas ir grįžtamas kolektoriaus balkis (nerūdijančio plieno arba žalvario) su pasirinktu kontūrų skaičiumi',
                'Integruoti automatiniai srauto reguliatoriai (Dynacon Eclipse kasetės) arba rotametrai',
                'Sieniniai garsą slopinantys laikikliai, automatiniai nuorintojai ir užpildymo/išleidimo čiaupai',
            ],
            whatYouNeed: [
                'G3/4" Eurokonus suspaudimo jungtys pagal jūsų grindinio vamzdžio matmenis (pvz., 16×2,0 mm arba 17×2,0 mm)',
                '2 rutuliniai 1" uždarymo čiaupai su termometrais kolektoriaus pajungimui prie magistralės',
                'Terminės pavaros (M30×1,5, 24 V arba 230 V) ir kolektorinė spintelė (potinkinė arba virštinkinė)',
            ],
            steps: [
                {
                    title: 'Sumontuokite spintelę ir kolektoriaus laikiklius',
                    detail: 'Kolektorių tvirtinkite 40–60 cm aukštyje nuo švarių grindų griežtai horizontaliai pagal gulsčiuką, kad nuorintojai būtų aukščiausiame taške.',
                },
                {
                    title: 'Sujunkite kontūrų vamzdžius su Eurokonus jungtimis',
                    detail: 'Nupjaukite PEX/PERT vamzdį statmenai, sukalibruokite ir priveržkite Eurokonus veržles prie tiekiamo ir grįžtamo balkio.',
                },
                {
                    title: 'Užpildykite ir nuorinkite kiekvieną kontūrą atskirai',
                    detail: 'Uždarykite visus žiedus ir pildykite po vieną kontūrą pilnu srautu, kol iš drenažo žarnos nebeeis oro burbulai, tada atlikite hidraulinį bandymą.',
                },
                {
                    title: 'Nustatykite projektinius srautus (l/h) ir užsukite pavaras',
                    detail: 'Ant Dynacon kasečių nustatykite kiekvieno kambario srautą (l/h) ir ant grįžtamojo balkio M30×1,5 vožtuvų užsukite termines pavaras.',
                },
            ],
            proTip: 'Su IMI Heimeier Dynacon kolektoriumi nereikia gaišti laiko su balansiniais rakteliais: nustatote projektinį srautą l/h tiesiai ant žiedo, ir vožtuvas pats palaiko pastovų srautą net kai kiti kambariai užsidaro.',
            commonMistake: 'Visų grindinio šildymo kontūrų pildymas vienu metu — taip vamzdžių kilpose lieka oro kamščiai ir atskiros grindų zonos lieka šaltos.',
            selfCheck: [
                'Ar kolektoriaus žiedų (kontūrų) skaičius (2–12) atitinka jūsų išvedžiotų grindų kilpų skaičių?',
                'Ar įsidėjote į krepšelį atitinkamą kiekį G3/4" Eurokonus jungčių (2 vnt. kiekvienam kontūrui)?',
                'Ar kolektoriaus bendras ilgis telpa į pasirinktą potinkinę ar virštinkinę spintelę?',
            ],
            safetyNote: 'Grindinio šildymo kontūrus pildykite ir bandykite tik švariu vandeniu pagal STR reikalavimus, neviršydami maksimalios leistinos paduodamos temperatūros.',
        };
    }

    // SUBTYPE 7: Balansinis ir reguliavimo vožtuvas (STAD, STAF, TBV-C, TA-Modulator, ASV, Leno, Globo)
    if (/\bstad\b|\bstaf\b|\btbv\b|ta-modulator|ta-compact|asv|ab-qm|leno|msv|globo|balansin|matavimo atvamzd/i.test(text)) {
        const subtypeTitle = 'Hidraulinis balansinis ir srauto reguliavimo vožtuvas';
        return {
            subtypeId: 'balancing-valve',
            subtypeTitle,
            subtypeBadge: subtypeTitle,
            whatYouGet: [
                'Korozijai atsparus AMETAL® / ketaus balansinio vožtuvo korpusas (STAD / STAF / TBV-C)',
                'Mikrometrinis skaitmeninis nustatymo rankratis su „Memory stop“ (nustatymo atminties) fiksatoriumi',
                '2 savaime užsisandarinantys matavimo atvamzdžiai (Test points) diferenciniam slėgiui ir srautui matuoti',
            ],
            whatYouNeed: [
                'Sriegio sandarinimo medžiaga (STAD srieginiams) arba flanšų tarpinės su varžtais (STAF flanšiniams)',
                'Šiluminės izoliacijos kevalas (šildymui arba vėsinimui nuo kondensato)',
                'Šešiakampis raktas (3 mm / 5 mm) „Memory stop“ vidinio ribotuvo užfiksavimui',
            ],
            steps: [
                {
                    title: 'Išlaikykite tiesią vamzdžio atkarpą prieš vožtuvą',
                    detail: 'Tiksliam srauto matavimui prieš vožtuvą palikite bent 5×DN tiesią vamzdžio atkarpą (arba 10×DN už siurblio), o už vožtuvo — 2×DN.',
                },
                {
                    title: 'Montuokite pagal srauto krypties rodyklę',
                    detail: 'Pasukite korpusą taip, kad skaitmeninė rankračio skalė ir matavimo nipeliai būtų lengvai pasiekiami matavimo zondams.',
                },
                {
                    title: 'Nustatykite projektinį apsisukimų skaičių',
                    detail: 'Pagal hidraulinio projekto lentelę (arba HySelect programėlę) nustatykite tikslų pilnų ir dešimtųjų apsisukimų skaičių.',
                },
                {
                    title: 'Užfiksuokite „Memory stop“ atminties ribotuvą',
                    detail: 'Įsukite vidinį atminties varžtą iki atramos — dabar net uždarius vožtuvą aptarnavimui, jį atsuksite tiksliai iki nustatytos padėties.',
                },
            ],
            proTip: 'Montuodami srieginį STAD vožtuvą, niekada nevyniokite per daug pakulos ant vamzdžio galo — įlindęs sandariklis gali užblokuoti matavimo atvamzdžio kanalą.',
            commonMistake: 'Vožtuvo palikimas gamyklinėje pilnai atidarytoje padėtyje be hidraulinio nustatymo — artimiausi stovai pasiima visą srautą, o tolimiausi radiatoriai nešyla.',
            selfCheck: [
                'Ar vožtuvo nominalus skersmuo (DN15–DN150) ir Kvs reikšmė atitinka jūsų projekto srautą?',
                'Ar pasirinkote teisingą sujungimo tipą: vidinį sriegį (STAD), išorinį sriegį ar flanšą (STAF)?',
                'Ar aplink vožtuvą palikta vietos prijungti balansavimo prietaiso matavimo adatas?',
            ],
            safetyNote: 'Diferencinio slėgio ir srauto matavimus per matavimo atvamzdžius atlikite tik su tam skirtais IMI TA matavimo antgaliais, neištuštindami sistemos.',
        };
    }

    // SUBTYPE 8: Terminė pavara ir valdiklis / termostatas (EMO T, TWA, Icon, Link, DEVIreg)
    if (/emo|twa|abn|icon|devireg|danfoss link|pavar|valdikl|patalpos termostat/i.test(`${t} ${skuLower}`)) {
        const subtypeTitle = 'Elektroterminė pavara ir zoninio šildymo automatika';
        return {
            subtypeId: 'actuator-controller',
            subtypeTitle,
            subtypeBadge: subtypeTitle,
            whatYouGet: [
                'Originali terminė pavara arba elektroninis patalpos termostatas / zonų valdiklis',
                'Prijungimo kabelis (pavaroms) arba montavimo rėmelis su grindų/oro jutikliu (termostatams)',
                'Eigos indikatorius ant pavaros korpuso ir gamintojo sujungimo schema',
            ],
            whatYouNeed: [
                'Tinkamas vožtuvo adapteris (IMI Heimeier / TA pavaros turi M30×1,5 sriegį; Danfoss RA vožtuvams parenkamas RA adapteris)',
                'Komutacinė dėžutė / grindinio šildymo valdiklis (24 V arba 230 V — griežtai vienodos įtampos su pavaromis!)',
                'Mažo skerspjūvio instaliacinis kabelis (pvz., 2×0,75 mm²) nuo kolektoriaus spintelės iki termostato',
            ],
            steps: [
                {
                    title: 'Atjunkite elektros maitinimą ir patikrinkite įtampą',
                    detail: 'Prieš jungdami bet kokius laidus įsitikinkite, kad pavaros įtampa (24 V arba 230 V) ir tipas (NC – normaliai uždara / NO – normaliai atvira) sutampa su valdikliu.',
                },
                {
                    title: 'Užsukite pavarą ant kolektoriaus / vožtuvo ranka',
                    detail: 'Užsukite M30×1,5 veržlę ant vožtuvo tik rankos jėga — nenaudokite santechninių replių, kad nesuskaldytumėte plastikinės veržlės.',
                },
                {
                    title: 'Sujunkite laidus su zoniniu valdikliu',
                    detail: 'Prijunkite pavaros laidus prie atitinkamo kambario termostato kanalo gnybtų kolektoriaus valdiklyje.',
                },
                {
                    title: 'Patikrinkite pirminį atsidarymo ciklą',
                    detail: 'Įjungę maitinimą ir nustatę aukštesnę temperatūrą termostate, palaukite 3–4 minutes, kol šiluminis vaško elementas pilnai pakels vožtuvo šerdelę.',
                },
            ],
            proTip: '95 % buitinių grindinio šildymo sistemų naudoja NC (normaliai uždaras) pavaras: kai termostatas nepaduoda įtampos, kontūras yra uždarytas ir neeikvoja elektros energijos.',
            commonMistake: '24 V pavaros prijungimas tiesiai į 230 V tinklą (pavara iškart perdega) arba veržlės perveržimas replėmis.',
            selfCheck: [
                'Ar jūsų valdiklis (komutacinė dėžutė) dirba su 24 V ar su 230 V įtampa?',
                'Ar vožtuvo sriegis yra standartinis M30×1,5 (Heimeier / TA) ar Danfoss RA Click?',
                'Ar pasirinkote tinkamą veikimo principą: NC (normaliai uždara) ar NO (normaliai atvira)?',
            ],
            safetyNote: 'Prieš jungdami bet kokius 230 V ar 24 V automatikos laidus privalomai atjunkite maitinimo įtampą paskirstymo skydelyje.',
        };
    }

    // SUBTYPE 9: Apatinio pajungimo mazgas („binoklis“) / H-blokas (RLV-K, RLV-KS, Multilux, Regulux, Vekolux)
    if (/rlv-k|multilux|vekolux|vekotec|\bvhx\b|e-z paskirstytojas|srauto krypties keitiklis|apatinio pajungimo|h-blok|design-edition set|chromuotas , dvigubas/i.test(t)) {
        const subtypeTitle = 'Radiatoriaus apatinio pajungimo mazgas („binoklis“)';
        return {
            subtypeId: 'h-block-valve',
            subtypeKey: 'h-block',
            subtypeTitle,
            subtypeBadge: subtypeTitle,
            whatYouGet: [
                'Žalvarinis nikeliuotas H formos apatinio pajungimo mazgas (tarpcentris 50 mm)',
                'Integruoti uždarymo ir balansavimo ventiliai radiatoriaus atjungimui neišleidžiant sistemos',
                'Savaime užsisandarinantys perėjimai su EPDM tarpinėmis į radiatorių (Rp 1/2" arba G 3/4")',
            ],
            whatYouNeed: [
                '2 vnt. G3/4" Eurokonus suspaudimo jungtys pagal jūsų vamzdžio tipą (daugiasluoksniam 16×2 mm arba variniam 15 mm vamzdžiui)',
                'Apdailinė dviguba rozetė vamzdžių išėjimui iš sienos ar grindų uždengti',
                'Šešiakampis raktas uždarymo šerdelėms ir veržliaraktis Eurokonus veržlėms',
            ],
            steps: [
                {
                    title: 'Įsukite savaime užsisandarinančius nupelius į radiatorių',
                    detail: 'Jei radiatorius turi 1/2" vidinius sriegius, įsukite komplekte esančius perėjimo nipelius su O-žiedo tarpinėmis.',
                },
                {
                    title: 'Priveržkite H-bloką prie radiatoriaus apačios',
                    detail: 'Patikrinkite, kurioje pusėje (išorėje ar arčiau centro) yra tiekiamas vamzdis, ir priveržkite viršutines veržles.',
                },
                {
                    title: 'Prijunkite vamzdžius su Eurokonus jungtimis',
                    detail: 'Užmaukite apdailinę rozetę, įstatykite kalibruotus vamzdžius į H-bloko apačią ir suveržkite G3/4" Eurokonus veržles.',
                },
                {
                    title: 'Atidarykite šerdeles ir nuorinkite radiatorių',
                    detail: 'Šešiakampiu raktu atsukite tiekiamą bei grįžtamą uždarymo šerdelę H-bloke ir išleiskite orą per viršutinį radiatoriaus nuorintuvą.',
                },
            ],
            proTip: 'Montuodami H-bloką pasirinkite kampinį modelį, jei vamzdžiai išeina iš sienos (grindų plovimo robotas neatsitrenks į vamzdžius), arba tiesų modelį, jei vamzdžiai kyla iš grindų.',
            commonMistake: 'Užmirštama įsidėti 2 vnt. Eurokonus jungtis vamzdžiui — pats „binoklis“ turi G3/4" sriegius, o jungtys parenkamos pagal jūsų vamzdžio storį (16×2, 18×2 ar 15 mm).',
            selfCheck: [
                'Ar jūsų vamzdžiai išvesti iš sienos (reikia kampinio mazgo) ar iš grindų (reikia tiesaus mazgo)?',
                'Ar sistema dvivamzdė (standartinis RLV-KS / Vekolux) ar vienvamzdė (su 50 % bypass)?',
                'Ar pridėjote į krepšelį 2 vnt. Eurokonus jungtis pagal savo vamzdžio skersmenį?',
            ],
            safetyNote: 'Atjungdami radiatorių dažymui, užsukite abu H-bloko varžtus ir papildomai užsukite aklutes ant atvamzdžių.',
        };
    }

    // SUBTYPE 9B: Kapiliarinis / distancinis termostatinis jutiklis ir panardinamas daviklis (capillary-remote-sensor)
    if (/kapiliar|distancin.*davikl|distancin.*montavim|distancin.*temperatūr|distanciniu temp|nuotoliniu davikliu|nuotolinis reguli|panardinamu.*davikl|panardinamu.*jutikl|paviršinis jutiklis|grindų jutiklis|grindų daviklis|rasos taško jutiklis|jutiklis įleidžiamas|jutiklis pridedamas|temperature sensor|lizdas pt1000/i.test(t)) {
        const subtypeTitle = 'Termostatinė galvutė su kapiliariniu / distanciniu jutikliu';
        return {
            subtypeId: 'capillary-remote-sensor',
            subtypeKey: 'capillary-remote-sensor',
            subtypeTitle,
            subtypeBadge: 'Kapiliarinis / distancinis jutiklis',
            whatYouGet: [
                `Termostatinis reguliavimo elementas arba išorinis temperatūros jutiklis (${rawTitle}) su kapiliariniu vamzdeliu / kabeliu`,
                'Distancinė jutiklio kapsulė (arba panardinama gilzė / kontaktinis pagrindas vamzdžiui)',
                'Gamyklinė RA Click arba M30×1,5 tvirtinimo veržlė montavimui ant vožtuvo',
            ],
            whatYouNeed: [
                'Suderinamas termostatinis arba maišymo vožtuvas (M30×1,5 arba Danfoss RA)',
                '2 smulkūs varžteliai su kaiščiais distancinio jutiklio dėžutei ant sienos pritvirtinti (arba termoizoliacinė pasta gilzei)',
                'Atsargus kapiliaro klojimas (lenkimo spindulys ≥30 mm — kapiliaro vamzdelio negalima užlaužti ar nukirpti!)',
            ],
            steps: [
                {
                    title: 'Užsukite galvutę ant vožtuvo nišoje ar kolektoriuje',
                    detail: 'Nustatykite skalę į maksimalią padėtį ir užfiksuokite galvutę ant vožtuvo, esančio už užuolaidos, po grotelėmis arba kolektoriaus spintelėje.',
                },
                {
                    title: 'Atsargiai išvyniokite kapiliarinį vamzdelį be užlaužimų',
                    detail: 'Išvyniokite kapiliarą iki atviros sienos vietos arba panardinamos gilzės. Griežtai neužlaužkite ir nenukirpkite plono varinio kapiliaro!',
                },
                {
                    title: 'Pritvirtinkite jutiklio kapsulę atviroje zonoje',
                    detail: 'Kambario jutiklį tvirtinkite 1,2–1,5 m aukštyje ant sienos; kontaktinį/panardinamą jutiklį — ant tiekiamo vamzdžio ar į gilzę.',
                },
                {
                    title: 'Nustatykite norimą temperatūrą ant skalės',
                    detail: 'Pasukite galvutės skalę į reikiamą padalą (°C arba 1–5) ir patikrinkite vožtuvo reakciją.',
                },
            ],
            proTip: 'Kapiliarinė galvutė yra vienintelis teisingas sprendimas, kai radiatorius paslėptas gilioje nišoje, po plačia palange arba už storų užuolaidų.',
            commonMistake: 'Kapiliarinio vamzdelio užlaužimas 90° kampu arba bandymas jį patrumpinti — vamzdelio viduje yra skystis/dujos, todėl pažeidus kapiliarą galvutė tampa neveiksni.',
            selfCheck: [
                'Ar kapiliaro ilgis (pvz., 2 m, 5 m ar 10 m) pakankamas nuo vožtuvo iki matavimo taško?',
                'Ar vožtuvo jungtis yra M30×1,5 ar Danfoss RA?',
                'Ar jutiklis skirtas kambario orui (6–27 °C) ar vamzdyno / boilerio vandeniui (20–50 °C / 40–70 °C)?',
            ],
            safetyNote: 'Saugokite kapiliarinį vamzdelį nuo mechaninio suspaudimo, gręžimo ar aštrių lenkimų montavimo metu.',
        };
    }

    // SUBTYPE 10: Termostatinė radiatoriaus galvutė (Redia, Aero, React, K-galvutė, Halo, DX, jutiklis)
    if (/galvut|termostatinė galva|redia|aero|react|halo|\bdx\b|jutikl|davikl|termostatinis elementas|termost\. elementas|^spalva –|013g29|013g50|013g51|013g52/i.test(t) && !/ventilio korpus|vožtuvas/i.test(t)) {
        const subtypeTitle = 'Termostatinė radiatoriaus galvutė (temperatūros jutiklis)';
        return {
            subtypeId: 'thermostatic-head',
            subtypeKey: 'thermostatic-head',
            subtypeTitle,
            subtypeBadge: subtypeTitle,
            whatYouGet: [
                'Originali skystinė arba dujinė termostatinė galvutė su temperatūros skale (1–5 ir apsaugos nuo užšalimo „*“ padėtimi)',
                'Gamyklinis fiksavimo žiedas („RA Click“ Danfoss modeliams arba plieninė M30×1,5 veržlė IMI Heimeier / M30 modeliams)',
                'Temperatūros ribojimo / blokavimo kaiščiai po skale',
            ],
            whatYouNeed: [
                'Jokių papildomų įrankių nereikia („RA Click“ užsispaudžia ranka, M30×1,5 priveržiama ranka)',
                'Suderinamas termostatinis vožtuvas ant radiatoriaus (arba įsukamas ventilio įdėklas apatiniam pajungimui)',
                'Jei radiatorius uždengtas nišoje ar storu užuolaidos audiniu — rinkitės modelį su išoriniu kapiliariniu jutikliu (2 m)',
            ],
            steps: [
                {
                    title: 'Atsukite galvutę į maksimalią padėtį „5“',
                    detail: 'Prieš montuodami pasukite rankenėlę iki galo į „5“ padėtį — taip vidinis stūmoklis įsitraukia ir galvutė lengvai užsideda ant vožtuvo.',
                },
                {
                    title: 'Užfiksuokite ant vožtuvo korpuso horizontaliai',
                    detail: 'Danfoss RA Click galvutę tiesiog užspauskite ir pasukite žiedą iki spragtelėjimo; M30×1,5 galvutę užsukite veržle taip, kad skalės žymė žiūrėtų į viršų.',
                },
                {
                    title: 'Nustatykite komfortišką padalą („3“ ≈ 20 °C)',
                    detail: 'Padala „3“ atitinka ~20 °C kambario temperatūrą, „4“ — ~23 °C, „2“ — ~17 °C (miegamajam), „*“ — apsaugą nuo užšalimo (~7–8 °C).',
                },
                {
                    title: 'Apribokite diapazoną ribotuvais (jei reikia)',
                    detail: 'Viešose patalpose ar vaikų kambaryje ištraukite ribojimo kaištukus ir užfiksuokite maksimalią bei minimalią leidžiamą padalą.',
                },
            ],
            proTip: 'Termostatinė galvutė privalo būti montuojama horizontaliai (kad oras iš kambario laisvai apgaubtų jutiklį). Jei ji pastatyta vertikaliai virš karšto vamzdžio, kylanti šiluma apgauna jutiklį ir radiatorius per anksti užsidaro.',
            commonMistake: 'Netinkamos jungties pasirinkimas: Danfoss RA vožtuvams tinka „RA Click“ (pvz., 013G2970), o IMI Heimeier ir daugumai integruotų radiatorių ventilių — srieginė M30×1,5 jungtis.',
            selfCheck: [
                'Kokio tipo vožtuvas pas jus sumontuotas: Danfoss RA Click (23 mm su grioveliu) ar srieginis M30×1,5?',
                'Ar galvutės neuždengs palangė, radiatoriaus grotelės ar tankios užuolaidos?',
                'Ar krepšelyje jau turite patį termostatinio vožtuvo korpusą (jei keičiate visą mazgą)?',
            ],
            safetyNote: 'Vasarai pasibaigus šildymo sezonui, atsukite galvutę į „5“ padėtį — taip vožtuvo adatėlė neprikibs prie lizdo per vasarą.',
        };
    }

    // SUBTYPE 11: Termostatinis radiatoriaus vožtuvas (Eclipse, V-exact II, Calypso, RA-N, RA-FN, Raditec)
    if (/ra-n|ra-fn|eclipse|v-exact|calypso|raditec|termostatinis vožtuvas|ventilio korpus/i.test(text)) {
        const subtypeTitle = 'Termostatinis radiatoriaus vožtuvas su srauto nustatymu';
        return {
            subtypeId: 'thermostatic-valve',
            subtypeTitle,
            subtypeBadge: subtypeTitle,
            whatYouGet: [
                'Korozijai atsparus žalvarinis / bronzinis nikeliuotas termostatinio vožtuvo korpusas',
                'Integruotas išankstinio srauto nustatymo žiedas (kv / l/h balansavimui tiesiai ant radiatoriaus)',
                'Srieginė pusmovė (amerikankė) su gaubiamąja veržle įsukimui į radiatorių ir apsauginis statybinis dangtelis',
            ],
            whatYouNeed: [
                'Suderinama termostatinė galvutė (pvz., IMI Heimeier K-galvutė M30×1,5 arba Danfoss Redia RA Click)',
                'Grįžtamojo srauto uždarymo vožtuvas (pvz., IMI Heimeier Regulux / Raditec arba Danfoss RLV-S) radiatoriaus apačiai',
                'Šešiakampis / laiptuotas pusmovių raktas (pvz., 1/2" pusmovei įsukti iš vidaus) ir sriegio sandariklis',
            ],
            steps: [
                {
                    title: 'Įsukite vožtuvo pusmovę į radiatoriaus viršutinį atvamzdį',
                    detail: 'Atskirkite pusmovę nuo vožtuvo, užvyniokite pakulą arba PTFE siūlą ir laiptuotu raktu įsukite ją į radiatorių.',
                },
                {
                    title: 'Sumontuokite vožtuvo korpusą ant tiekiamojo vamzdžio',
                    detail: 'Stebėkite srauto rodyklę ant vožtuvo korpuso (vanduo turi tekėti į radiatorių) ir sujunkite su pusmovės gaubiamąja veržle.',
                },
                {
                    title: 'Nustatykite radiatoriaus projektinį srautą ant žiedo',
                    detail: 'Nuėmę apsauginį dangtelį, pasukite skaičiais sužymėtą žiedą (pvz., Eclipse 1–15 arba RA-N 1–7/N) pagal kambario radiatoriaus galią.',
                },
                {
                    title: 'Užspauskite / užsukite termostatinę galvutę',
                    detail: 'Užpildę sistemą ir patikrinę sandarumą, uždėkite termostatinę galvutę horizontalia kryptimi į kambarį.',
                },
            ],
            proTip: 'Su IMI Heimeier Eclipse vožtuvu nebereikia skaičiuoti slėgio nuostolių vamzdyne: tiesiog padalinkite radiatoriaus galią (W) iš ~20 ir gausite srautą litrais per valandą (pvz., 1000 W ≈ 50 l/h → padala „5“).',
            commonMistake: 'Vožtuvo sumontavimas ant grįžtamojo vamzdžio priešinga srauto kryptimi — kilus slėgiui vožtuvo lėkštelė pradeda vibruoti ir radiatoriuje girdimas garsus kalenimas.',
            selfCheck: [
                'Ar pasirinkote tinkamą formą: kampinį (vamzdis iš apačios/sienos), tiesų (vamzdis iš šono) ar ašinį?',
                'Ar sriegio dydis (DN10 / 3/8", DN15 / 1/2", DN20 / 3/4") atitinka jūsų vamzdyną?',
                'Ar pridėjote į krepšelį termostatinę galvutę ir grįžtamąjį uždarymo ventilį?',
            ],
            safetyNote: 'Statybos ir tinkavimo metu palikite ant vožtuvo plastikinį apsauginį dangtelį, o termostatinę galvutę uždėkite tik po apdailos darbų.',
        };
    }

    // SUBTYPE 12: Uždaromoji armatūra, rutulinis čiaupas, atbulinis vožtuvas (JiP, sklendė, čiaupas)
    if (/\bjip\b|rutulin|atbulin|uždarom|uzdarom|sklend|čiaup|ciaup/i.test(text)) {
        const subtypeTitle = 'Uždaromoji vamzdynų armatūra (čiaupas / atbulinis vožtuvas)';
        return {
            subtypeId: 'shutoff-valve',
            subtypeTitle,
            subtypeBadge: subtypeTitle,
            whatYouGet: [
                'Pilno pralaidumo uždarymo čiaupas arba atbulinis vožtuvas (žalvario, bronzos arba plieno korpusas)',
                'PTFE / EPDM sandarinimo lizdai ir tvirta valdymo rankenėlė (arba virinami/srieginiai antgaliai)',
                'Gamintojo PN slėgio ir maksimalios darbinės temperatūros žymėjimas ant korpuso',
            ],
            whatYouNeed: [
                'Sriegio sandarinimo medžiaga arba flanšų/virinimo sujungimo priemonės pagal modelį',
                'Du raginiai veržliarakčiai (vienas vamzdžio atvamzdžiui prilaikyti, kitas čiaupui sukti)',
                'Šiluminės izoliacijos kevalas šildymo/šaldymo magistralėms',
            ],
            steps: [
                {
                    title: 'Patikrinkite darbinę temperatūrą ir srauto kryptį',
                    detail: 'Atbuliniams vožtuvams privalomai patikrinkite srauto rodyklę ant korpuso; rutuliniams čiaupams palikite laisvą erdvę rankenėlės 90° pasukimui.',
                },
                {
                    title: 'Sandarinkite sriegius nenaudodami perteklinio sriegio ilgio',
                    detail: 'Priverždami čiaupą laikykite veržliarakčiu už tą pusę, į kurią sukate vamzdį, kad nesukeltumėte korpuso įtempimo.',
                },
                {
                    title: 'Jei armatūra virinama (pvz., Danfoss JiP) — saugokite sandariklius',
                    detail: 'Virindami plieninį rutulinį čiaupą laikykite jį pilnai atidarytoje padėtyje ir vėsinkite korpusą drėgnu audiniu.',
                },
                {
                    title: 'Patikrinkite pilną uždarymo eigą',
                    detail: 'Užpildę vamzdyną kelis kartus lėtai uždarykite ir atidarykite čiaupą, įsitikindami, kad eiga švelni, o sriegiai sausi.',
                },
            ],
            proTip: 'Katilinės rutulinius čiaupus bent 2 kartus per metus pilnai pasukite „uždaryta–atidaryta“ — tai neleidžia kalkėms ir magnetitui prikibti prie rutulio paviršiaus.',
            commonMistake: 'Rutulinio čiaupo naudojimas srauto reguliavimui (paliekant pusiau pravirą): greitas vandens srautas išgraužia tefloninį lizdą ir čiaupas praranda sandarumą.',
            selfCheck: [
                'Ar armatūros prijungimo skersmuo (DN) ir tipas (vidinis sriegis, išorinis sriegis, virinamas) tinka jūsų vamzdžiui?',
                'Ar darbinė temperatūra ir slėgis (PN16 / PN25 / PN40) atitinka jūsų sistemą?',
                'Ar montavimo vietoje rankenėlei netrukdys siena ar šalia einantis vamzdis?',
            ],
            safetyNote: 'Niekada nenaudokite rutulinių čiaupų kaip droseliavimo (balansavimo) vožtuvų — jie turi dirbti tik „100 % atidaryta“ arba „100 % uždaryta“ režimu.',
        };
    }

    // SUBTYPE 13: Vamzdynų jungtis, nipelis, adapteris, Eurokonus fitingas
    if (/jungt|nipel|adapter|eurokonus|fiting|mova|alkūn|alkun|antgal|veržl|verzl/i.test(text)) {
        const subtypeTitle = 'Inžinerinė vamzdyno jungtis, adapteris ir fitingas';
        return {
            subtypeId: 'pipe-fitting',
            subtypeTitle,
            subtypeBadge: subtypeTitle,
            whatYouGet: [
                'Tiksliai apdirbta žalvarinė / bronzinė jungtis arba suspaudimo adapteris (pvz., G3/4" Eurokonus)',
                'Suspaudimo žiedas, atraminė įvorė ir EPDM O-žiedo tarpinės (suspaudžiamiems vamzdžių adapteriams)',
                'Standartizuotas sriegis pagal EN / ISO normas',
            ],
            whatYouNeed: [
                'Vamzdžių žirklės ir kalibratorius su nuožulos nuėmėju (jei jungiate daugiasluoksnį PEX/PERT vamzdį)',
                'Dinamometrinis arba lygiažiotis veržliaraktis (kad nesubraižytumėte nikeliuotos veržlės)',
                'Sriegio sandariklis (tik cilindriniams/kūginiams sriegiams be O-žiedo ar kūginio sandarinimo)',
            ],
            steps: [
                {
                    title: 'Nupjaukite vamzdį griežtai 90° kampu ir sukalibruokite',
                    detail: 'Daugiasluoksnio ar PEX vamzdžio galą privalomai sukalibruokite ir nuimkite vidinę nuožulą, kad įstumiant nenukirptumėte EPDM O-žiedų.',
                },
                {
                    title: 'Užmaukite gaubiamąją veržlę ir skeltą suspaudimo žiedą',
                    detail: 'Įstumkite adapterio antgalį į vamzdį iki pat atramos (pro kontrolinę skylutę turi matytis vamzdžio kraštas).',
                },
                {
                    title: 'Suveržkite kūginę jungtį be pakulos',
                    detail: 'Dėmesio: ant Eurokonus ir kūginių jungčių su tarpine pakula ar teflonas NEVYNIAMI — sandarumą užtikrina kūgis ir EPDM tarpinė.',
                },
                {
                    title: 'Priveržkite gamintojo rekomenduojamu momentu',
                    detail: 'Priveržkite veržlę ranka ir dar ~3/4–1 apsisukimą raktu (apie 25–35 Nm), kol skeltas žiedas tvirtai apspaus vamzdį.',
                },
            ],
            proTip: 'Prieš įstumdami Eurokonus antgalį į daugiasluoksnį vamzdį, sudrėkinkite O-žiedus švariu vandeniu (niekada nenaudokite mineralinio tepalo, nes jis ardo EPDM gumą).',
            commonMistake: 'Bandymas prijungti 16×2,0 mm vamzdį su 16×2,2 mm arba 17×2,0 mm jungtimi — net 0,2 mm sienelės skirtumas lemia pratekėjimą arba netelpantį antgalį.',
            selfCheck: [
                'Ar išorinis vamzdžio skersmuo ir sienelės storis (pvz., 16×2,0 mm) tiksliai atitinka šios jungties kodą?',
                'Ar jungties sriegis yra G3/4" Eurokonus (kolektoriams / H-blokams) ar M22×1,5 / G1/2"?',
                'Ar skaičiuojate po 2 vnt. jungčių kiekvienam kontūrui arba radiatoriui?',
            ],
            safetyNote: 'Suspaudžiamas sriegines jungtis privaloma palikti prieinamose vietose (kolektoriaus spintelėje ar prie radiatoriaus) — jų negalima užbetonuoti grindyse.',
        };
    }

    // SUBTYPE 15: Atsarginė dalis, riebokšlis, įdėklas, serviso įrankis (default fallback)
    const subtypeTitle = 'Originali inžinerinė detalė ir serviso komponentas';
    return {
        subtypeId: 'spare-part-hardware',
        subtypeKey: 'spare-part-hardware',
        subtypeTitle,
        subtypeBadge: subtypeTitle,
        whatYouGet: [
            'Originali gamintojo detalė / ventilio įdėklas / serviso mazgas gamyklinėje pakuotėje',
            'Gamykliškai sumontuotos EPDM / NBR sandarinimo tarpinės (jei numatyta pagal artikulą)',
            'Tikslus atitikimas nurodytam gamintojo artikului (SKU) be papildomo perdirbimo',
        ],
        whatYouNeed: [
            'Atitinkamo dydžio lygiažiotis arba žiedinis veržliaraktis (arba gamintojo serviso įrankis keitimui esant slėgiui)',
            'Švarus audinys ir silikoninis / EPDM tinkamas tepalas tarpinėms (jei keičiamas riebokšlis ar įdėklas)',
            'Sriegio sandariklis (jei detalė sukama į cilindrinį vamzdyno sriegį)',
        ],
        steps: [
            {
                title: 'Sutikrinkite artikulo (SKU) kodą ir sriegio standartą',
                detail: 'Prieš išrinkdami mazgą įsitikinkite, kad naujos detalės kodas, DN skersmuo ir sriegio žingsnis atitinka esamą vožtuvą.',
            },
            {
                title: 'Atjunkite kontūrą ir sumažinkite slėgį',
                detail: 'Uždarykite stovo arba radiatoriaus atjungimo čiaupus ir nuleiskite slėgį (nebent naudojate specialų keitimo šliuzą).',
            },
            {
                title: 'Nuvalykite sėdimo lizdą ir įsukite naują detalę',
                detail: 'Pašalinkite kalkių ar magnetito apnašas iš vožtuvo vidaus ir atsargiai įsukite naują įdėklą / riebokšlį.',
            },
            {
                title: 'Atstatykite slėgį ir patikrinkite veikimą',
                detail: 'Lėtai atidarykite uždarymo armatūrą, nuorinkite mazgą ir įsitikinkite, kad jungtis 100 % sandari.',
            },
        ],
        proTip: 'Daugelio Danfoss RA ir IMI Heimeier termostatinių vožtuvų riebokšlius (riebokšlio dėžutes) galima pakeisti neišleidžiant vandens iš šildymo sistemos — tai sutaupo kelias valandas darbo.',
        commonMistake: 'Skirtingų gamintojų (pvz., Danfoss ir Heimeier) vidinių ventilio įdėklų painiojimas: nors išoriškai jie panašūs, jų sriegio žingsnis ir gylis skiriasi.',
        selfCheck: [
            'Ar keičiamo mazgo gamintojas (Danfoss, IMI Heimeier, IMI TA, IMI Pneumatex) sutampa su šios detalės gamintoju?',
            'Ar patikrinote nominalų skersmenį (DN) ir pagaminimo seriją?',
            'Ar turite reikiamą raktą senuoju įdėklu atsukti nepažeidžiant korpuso?',
        ],
        safetyNote: 'Montavimo ir serviso darbus vamzdyne atlikite tik uždarę atitinkamą kontūrą ir įsitikinę, kad jums negresia apsiplikymas karštu termofikaciniu vandeniu.',
    };
}

/**
 * Convenience alias accepting (category, title, brand, sku) for subtype-aware UX guide.
 */
export function getInstallationGuide(
    category?: string | null,
    title?: string | null,
    brand?: string | null,
    sku?: string | null,
): ProductUxGuide {
    return getProductUxGuide({
        title: title ?? '',
        category,
        brand,
        sku,
    });
}

/**
 * Deterministic Lithuanian installation & selection instructions (4 practical
 * steps + safety note) tailored to the product's HVAC category or family.
 */
export function getInstallationInstructions(product: {
    title: string;
    category?: string | null;
    brand?: string | null;
    sku?: string | null;
}): InstallationGuide {
    const ux = getProductUxGuide(product);
    return {
        title: ux.subtypeTitle,
        steps: ux.steps.map((s) => `${s.title}: ${s.detail}`),
        safetyNote: ux.safetyNote,
    };
}

/**
 * Normalize multi-SKU paste (newlines, semicolons, tabs) into a clean
 * comma-separated query string suitable for `/products?q=...`.
 */
export function normalizeMultiSkuPaste(raw: string): string {
    const trimmed = (raw ?? '').trim();
    if (!trimmed) return '';
    if (!/[\r\n;\t]/.test(trimmed)) return trimmed;
    const parts = trimmed
        .split(/[\r\n;,\t]+/)
        .map((p) => p.trim())
        .filter(Boolean);
    return parts.join(', ');
}

/**
 * Extract up to 3 compact technical engineering chips from a product title and SKU
 * (e.g., DN15, 1/2", PN10, M30×1.5, 35 L, 3 bar, AFC, 230V, RA-Click) so B2B
 * installers and engineers can compare specifications directly in the catalog grid.
 */
export function extractCardTechChips(title: string, sku?: string | null): string[] {
    const text = `${title ?? ''} ${sku ?? ''}`;
    const chips: string[] = [];
    const pushUnique = (val: string) => {
        const clean = val.trim();
        if (!clean || chips.length >= 3) return;
        if (!chips.some((c) => c.toLowerCase() === clean.toLowerCase())) {
            chips.push(clean);
        }
    };

    const dnMatch = text.match(/\bDN\s?(\d{1,3})\b/i);
    if (dnMatch) pushUnique(`DN${dnMatch[1]}`);

    const threadMatch = text.match(
        /(?:^|[\s(])(M30\s?[x×]\s?1[.,]5|RA[-\s]?Click|1\s?1\/4"|1\s?1\/2"|1\/2"|3\/4"|3\/8"|1"|2"|[GR]p?\s?\d\/\d(?:"|'')?)(?=$|[\s,.)])/i,
    );
    if (threadMatch) {
        const rawThread = threadMatch[1]
            .replace(/\s+/g, '')
            .replace(/m30[x×]1[.,]5/i, 'M30×1.5')
            .replace(/ra-?click/i, 'RA-Click');
        pushUnique(rawThread);
    }

    const pnMatch = text.match(/\bPN\s?(\d{1,2})\b/i);
    if (pnMatch) pushUnique(`PN${pnMatch[1]}`);

    const barMatch = text.match(/\b(\d+(?:[.,]\d+)?)\s?bar\b/i);
    if (barMatch) pushUnique(`${barMatch[1].replace('.', ',')} bar`);

    const volMatch = text.match(/\b(\d{1,4})\s?(?:l|L|litr)\b/);
    if (volMatch) pushUnique(`${volMatch[1]} L`);

    const kwMatch = text.match(/\b(\d+(?:[.,]\d+)?)\s?kW\b/i);
    if (kwMatch) pushUnique(`${kwMatch[1].replace('.', ',')} kW`);

    const voltMatch = text.match(/\b(230\s?V|24\s?V)\b/i);
    if (voltMatch) pushUnique(voltMatch[1].replace(/\s+/g, '').toUpperCase());

    if (/\bAFC\b/i.test(text) || /eclipse/i.test(text)) pushUnique('AFC');
    if (/dešinin/i.test(text)) pushUnique('Dešininė (R)');
    else if (/kairin/i.test(text)) pushUnique('Kairinė (L)');

    if (chips.length === 0) {
        if (/termostat/i.test(text)) pushUnique('Termostatinis');
        else if (/kolektor/i.test(text)) pushUnique('Kolektorius');
        else if (/vožtuv|ventili/i.test(text)) pushUnique('Hidronika');
        else pushUnique('ŠVOK standartas');
    }

    return chips.slice(0, 3);
}
