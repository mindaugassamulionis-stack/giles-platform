export type GilesLogoConceptId = 'A' | 'B' | 'C' | 'D' | 'current';

export interface GilesLogoConcept {
    id: GilesLogoConceptId;
    shortLabel: string;
    label: string;
    subtitle: string;
    accentHex: string;
}

export const GILES_LOGO_CONCEPTS: GilesLogoConcept[] = [
    {
        id: 'A',
        shortLabel: 'A · Gilė-liepsna',
        label: 'Variantas A · Gilė-liepsna',
        subtitle: 'Geometrinė gilė su liepsnos siluetu (#C2410C + #11161B)',
        accentHex: '#C2410C',
    },
    {
        id: 'B',
        shortLabel: 'B · Veržlė',
        label: 'Variantas B · Inžinerinė veržlė',
        subtitle: 'Šešiakampė veržlė su gile viduje · ŠILDYMAS · KATILINĖS',
        accentHex: '#FF8A3D',
    },
    {
        id: 'C',
        shortLabel: 'C · Ė su gile',
        label: 'Variantas C · Tipografinis „ė“ su gile',
        subtitle: 'Mažųjų raidžių „gilės inžinerija“ su gile virš ė',
        accentHex: '#C2410C',
    },
    {
        id: 'D',
        shortLabel: 'D · Žalia',
        label: 'Variantas D · Žalia evoliucija',
        subtitle: 'Miško žalios (#2F5A17) ir laimo (#7AA02C) evoliucija',
        accentHex: '#2F5A17',
    },
    {
        id: 'current',
        shortLabel: 'Dabartinis',
        label: 'Dabartinis logotipas (nuo 2011 m.)',
        subtitle: 'Oficialus UAB „Gilės inžinerija“ patentuotas logotipas',
        accentHex: '#7FA33A',
    },
];

export const GILES_PATENTED_LOGO_PATH = '/studio-assets/logos/logo-current-original.png' as const;
export const GILES_PATENTED_MARK_TRANSPARENT_PATH =
    '/studio-assets/logos/giles-patented-mark-transparent.png' as const;
export const GILES_PATENTED_FULL_LIGHT_PATH =
    '/studio-assets/logos/giles-patented-full-light.png' as const;
export const GILES_PATENTED_FULL_DARK_PATH =
    '/studio-assets/logos/giles-patented-full-dark.png' as const;

export const GILES_COMPANY_IDENTITY = {
    brandName: 'GILĖS INŽINERIJA',
    legalName: 'UAB „Gilės inžinerija“',
    eshopBrand: 'EGIP.LT',
    companyCode: '302620907',
    vatCode: 'LT100006119810',
    foundedYear: 2011,
    address: 'Žirmūnų g. 68, LT-09124 Vilnius · Eigulių g. 21, LT-51418 Kaunas',
    phoneLandline: '+370 37 332234',
    phoneDarius: '+370 611 19158',
    phoneService: '+370 693 97098',
    phoneVidas: '+370 656 77679',
    emailGeneral: 'info@gilesinzinerija.lt',
    emailDarius: 'darius@gilesinzinerija.lt',
    emailVidas: 'vidas@gilesinzinerija.lt',
} as const;

export interface HeroSchematicHotspot {
    id: string;
    number: string;
    xPercent: string;
    yPercent: string;
    title: string;
    sku: string;
    brand: string;
    priceGrossEur: number;
    priceNetEur: number;
    description: string;
    ctaLabel: string;
    href: string;
    imageUrl: string;
}

export const HERO_SCHEMATIC_HOTSPOTS: HeroSchematicHotspot[] = [
    {
        id: 'burner',
        number: '01',
        xPercent: '38%',
        yPercent: '62%',
        title: 'Granulių degiklis Megatherm MPB NANI 35',
        sku: 'MPB-NANI-35',
        brand: 'Megatherm / Gilės',
        priceGrossEur: 2350.0,
        priceNetEur: 1942.15,
        description:
            'Montuojamas vietoje kuro pakrovimo durelių su automatiniu sraigtiniu tiektuvu ir savaime išsivalančiomis ardelėmis (8–35 kW).',
        ctaLabel: 'Granulių degikliai',
        href: '/products?q=MPB',
        imageUrl: '/images/products/giles-studio-01-mpb-nani-35-50.webp',
    },
    {
        id: 'boiler',
        number: '02',
        xPercent: '55%',
        yPercent: '46%',
        title: 'Katilas 25 kW (kieto kuro / granulinis)',
        sku: 'KAT-25KW-GI',
        brand: 'Gilės Inžinerija / KaTRI',
        priceGrossEur: 1750.0,
        priceNetEur: 1446.28,
        description:
            'Kieto kuro, granulinis ar kombinuotas katilas: nuo 25 kW namui iki 150–500 kW komerciniam ir pramoniniam objektui.',
        ctaLabel: 'Katilai ir katilinės',
        href: '/products?category=%C5%A0ildymo%20katilai%20ir%20krosnel%C4%97s',
        imageUrl: '/images/products/giles-studio-25-katri-25kw-pellet-boiler.webp',
    },
    {
        id: 'tank',
        number: '03',
        xPercent: '16%',
        yPercent: '42%',
        title: 'Akumuliacinė talpa ir boileris Gorenje ZV',
        sku: 'ZV 100',
        brand: 'Gorenje / TIKI',
        priceGrossEur: 289.0,
        priceNetEur: 238.84,
        description:
            'Kombinuoti vandens šildytuvai ir akumuliacinės talpos stabilizuoja katilo darbą ir ruošia buitinį karštą vandenį.',
        ctaLabel: 'Talpos ir boileriai',
        href: '/products?q=ZV+100',
        imageUrl: '/images/products/giles-studio-27-centrometal-cas-1001-buffer.webp',
    },
    {
        id: 'mixing',
        number: '04',
        xPercent: '82%',
        yPercent: '35%',
        title: 'Pamaišymo mazgas Danfoss / IMI Heimeier',
        sku: '013G2990',
        brand: 'Danfoss / IMI',
        priceGrossEur: 24.9,
        priceNetEur: 20.58,
        description:
            'Termostatiniai ir balansiniai vožtuvai, cirkuliaciniai siurbliai, radiatoriai ir grindinio šildymo kolektoriai viename mazge.',
        ctaLabel: 'Hidraulika ir vožtuvai',
        href: '/products?q=013G2990',
        imageUrl: '/images/products/013g2990.webp',
    },
    {
        id: 'controller',
        number: '05',
        xPercent: '58%',
        yPercent: '24%',
        title: 'Valdiklis ecoMAX 920i su interneto moduliu',
        sku: 'ECOMAX-920I',
        brand: 'Plum / Gilės',
        priceGrossEur: 385.0,
        priceNetEur: 318.18,
        description:
            'Jutiklinis valdiklis palaiko nustatytą temperatūrą, moduliuoja degiklio galią, valdo pamaišymo vožtuvus ir siunčia pranešimus į telefoną.',
        ctaLabel: 'Valdikliai ir automatika',
        href: '/products?category=Automatika',
        imageUrl: '/images/products/giles-studio-30-ecomax-920i-automation.webp',
    },
];

export interface BoilerConversionModel {
    id: string;
    name: string;
    typeLabel: string;
    flangeCode: string;
    defaultKw: number;
    compatibilityNote: string;
}

export const BOILER_CONVERSION_MODELS: BoilerConversionModel[] = [
    {
        id: 'viadrus-u22',
        name: 'Viadrus U22 / U26 (ketinis)',
        typeLabel: 'Ketinis sekcijinis (4–10 sekcijų)',
        flangeCode: 'FL-VIA-U22',
        defaultKw: 25,
        compatibilityNote: 'Tinka montuoti į apatines dureles su Gilės CNC flanšu be katilo pjovimo.',
    },
    {
        id: 'kalvis',
        name: 'Kalvis (plieninis kieto kuro)',
        typeLabel: 'Plieninis apatinio degimo (Kalvis 2-16 .. 2-40)',
        flangeCode: 'FL-KAL-2',
        defaultKw: 25,
        compatibilityNote: 'Didelis šilumokaitis užtikrina ~91 % naudingumo koeficientą su MPB NANI degikliu.',
    },
    {
        id: 'atmos-vigas',
        name: 'Atmos / Vigas (dujų generacinis)',
        typeLabel: 'Pirolizinis / dujų generacinis katilas',
        flangeCode: 'FL-ATM-DC',
        defaultKw: 35,
        compatibilityNote: 'Išsaugomas originalus ištraukimo ventiliatorius ir keraminė degimo kamera.',
    },
    {
        id: 'stropuva',
        name: 'Stropuva / Žvakė',
        typeLabel: 'Viršutinio degimo cilindrinis katilas',
        flangeCode: 'FL-STR-CIL',
        defaultKw: 25,
        compatibilityNote: 'Komplektuojamas su lenktu flanšu ir deflektoriumi liepsnos nukreipimui.',
    },
    {
        id: 'buderus-dakon',
        name: 'Buderus / Dakon / Bosch',
        typeLabel: 'Logano G211 / S111 / DOR serija',
        flangeCode: 'FL-BUD-G211',
        defaultKw: 35,
        compatibilityNote: 'Tiesioginis tvirtinimas prie gamyklinio ketinio arba plieninio rėmo.',
    },
    {
        id: 'industrial-100-500',
        name: 'Pramoninis katilas (100–500 kW)',
        typeLabel: 'Didelės galios plieninis arba biokuro katilas',
        flangeCode: 'FL-IND-PRO',
        defaultKw: 150,
        compatibilityNote: 'Komplektuojamas su savaime išsivalančiomis ardelėmis ir pramoniniu šneku.',
    },
];

export interface BoilerHopperOption {
    id: string;
    title: string;
    volumeL: number;
    autonomyDays: string;
    grossEur: number;
    sku: string;
}

export const BOILER_HOPPER_OPTIONS: BoilerHopperOption[] = [
    {
        id: 'compact-200',
        title: 'Kompaktinis 200 L granulių bunkeris',
        volumeL: 200,
        autonomyDays: '3–5 d. autonomija (siaurai katilinei)',
        grossEur: 240,
        sku: 'GI-BNK-200',
    },
    {
        id: 'standard-350',
        title: 'Standartinis 350 L cinkuotas bunkeris',
        volumeL: 350,
        autonomyDays: '6–8 d. autonomija (populiariausias)',
        grossEur: 310,
        sku: 'GI-BNK-350',
    },
    {
        id: 'large-800',
        title: 'Didelis 500–1000 L modulinis bunkeris',
        volumeL: 800,
        autonomyDays: '14–21 d. autonomija',
        grossEur: 580,
        sku: 'GI-BNK-800',
    },
];

export interface BoilerConversionLineItem {
    sku: string;
    title: string;
    category: string;
    grossEur: number;
    netEur: number;
    included: boolean;
}

export interface BoilerConversionBundleResult {
    boilerModel: BoilerConversionModel;
    areaM2: number;
    powerKw: number;
    burnerSku: string;
    burnerTitle: string;
    burnerPowerRange: string;
    hopper: BoilerHopperOption;
    items: BoilerConversionLineItem[];
    totalGrossEur: number;
    totalNetEur: number;
    estimatedAnnualSavingsEur: number;
    paybackSeasons: string;
}

export function computeBoilerConversionBundle(input: {
    boilerModelId: string;
    areaM2: number;
    powerKw: number;
    hopperId: string;
    wifiModule: boolean;
    includeInstallation: boolean;
}): BoilerConversionBundleResult {
    const boilerModel =
        BOILER_CONVERSION_MODELS.find((m) => m.id === input.boilerModelId) ||
        BOILER_CONVERSION_MODELS[0]!;
    const hopper =
        BOILER_HOPPER_OPTIONS.find((h) => h.id === input.hopperId) ||
        BOILER_HOPPER_OPTIONS[1]!;

    const effectiveKw = Math.max(input.powerKw || 25, Math.round(input.areaM2 * 0.1));

    let burnerSku = 'MPB-NANI-35';
    let burnerTitle = 'Gilės / Megatherm MPB NANI 35 (5–35 kW) savaime išsivalantis granulių degiklis';
    let burnerPowerRange = '5–35 kW';
    let burnerGross = 1590;

    if (effectiveKw > 150) {
        burnerSku = 'MPB-300-PRO';
        burnerTitle = 'Gilės / Megatherm MPB 300 PRO (60–300 kW) pramoninis granulių degiklis su judančiu dugnu';
        burnerPowerRange = '60–300 kW';
        burnerGross = 4850;
    } else if (effectiveKw > 80) {
        burnerSku = 'MPB-150-PRO';
        burnerTitle = 'Gilės / Megatherm MPB 150 PRO (35–150 kW) pramoninis granulių degiklis';
        burnerPowerRange = '35–150 kW';
        burnerGross = 3290;
    } else if (effectiveKw > 50) {
        burnerSku = 'MPB-80-PRO';
        burnerTitle = 'Gilės / Megatherm MPB 80 PRO (20–80 kW) granulių degiklis su keramika';
        burnerPowerRange = '20–80 kW';
        burnerGross = 2390;
    } else if (effectiveKw > 35) {
        burnerSku = 'MPB-NANI-50';
        burnerTitle = 'Gilės / Megatherm MPB NANI 50 (10–50 kW) savaime išsivalantis granulių degiklis';
        burnerPowerRange = '10–50 kW';
        burnerGross = 1850;
    }

    const rawItems: Array<{ sku: string; title: string; category: string; grossEur: number }> = [
        {
            sku: burnerSku,
            title: burnerTitle,
            category: 'Granulių degiklis su judančiomis ardelėmis',
            grossEur: burnerGross,
        },
        {
            sku: 'GI-AUGER-2000',
            title: '2,0 m ašinis granulių padavimo sraigtas (šnekas) su nedegia PUR žarna',
            category: 'Kuro padavimas',
            grossEur: 220,
        },
        {
            sku: 'GI-CTRL-TOUCH',
            title: 'Valdiklis su spalvotu ekranu, katilo ir boilerio siurblių valdymu bei fotoelementu',
            category: 'Automatika',
            grossEur: 230,
        },
        {
            sku: boilerModel.flangeCode,
            title: `CNC montavimo flanšas ir šamoto deflektorius katilui „${boilerModel.name}“`,
            category: 'Montavimo mazgas',
            grossEur: 95,
        },
        {
            sku: hopper.sku,
            title: hopper.title,
            category: 'Granulių talpa',
            grossEur: hopper.grossEur,
        },
        {
            sku: 'GI-SAFE-STB95',
            title: 'Apsauginis dvigubas STB 95 °C termostatas ir atbulinio degimo jutiklis',
            category: 'Saugos automatika',
            grossEur: 45,
        },
    ];

    if (input.wifiModule) {
        rawItems.push({
            sku: 'GI-WIFI-NET',
            title: 'Wi-Fi / interneto modulis katilinės valdymui ir gedimų pranešimams telefonu',
            category: 'Telemetrija',
            grossEur: 145,
        });
    }

    if (input.includeInstallation) {
        rawItems.push({
            sku: 'GI-SERV-INSTALL',
            title: 'Gilės Inžinerijos montavimas objekte, dūmtraukio traukos patikra ir degimo derinimas su dujų analizatoriumi',
            category: 'Inžinerinis darbas',
            grossEur: effectiveKw > 80 ? 680 : 390,
        });
    }

    const items: BoilerConversionLineItem[] = rawItems.map((it) => ({
        ...it,
        netEur: Math.round((it.grossEur / 1.21) * 100) / 100,
        included: true,
    }));

    const totalGrossEur = items.reduce((sum, it) => sum + it.grossEur, 0);
    const totalNetEur = Math.round((totalGrossEur / 1.21) * 100) / 100;
    const estimatedAnnualSavingsEur = Math.max(420, Math.round(input.areaM2 * 3.4));

    return {
        boilerModel,
        areaM2: input.areaM2,
        powerKw: effectiveKw,
        burnerSku,
        burnerTitle,
        burnerPowerRange,
        hopper,
        items,
        totalGrossEur,
        totalNetEur,
        estimatedAnnualSavingsEur,
        paybackSeasons: '1,5–2 šildymo sezonai',
    };
}

export interface IndustrialBoilerModule {
    code: string;
    powerKw: number;
    powerLabel: string;
    heatedAreaM2: string;
    dimensionsM: string;
    hopperVolumeM3: string;
    fuels: string;
    targetUseCases: string;
    baseInvestmentNetEur: number;
    monthlyRentalNetEur: number;
}

export const INDUSTRIAL_BOILER_MODULES: IndustrialBoilerModule[] = [
    {
        code: 'GK-100',
        powerKw: 100,
        powerLabel: '100 kW',
        heatedAreaM2: '800 – 1 400 m²',
        dimensionsM: '6,0 × 2,4 × 2,9 m',
        hopperVolumeM3: '8 m³ (5,2 t granulių)',
        fuels: 'Medienos granulės (DINplus / ENplus A1–B), agro granulės',
        targetUseCases: 'Autoservisai, gamybos cechai, kaimo turizmo kompleksai, mokyklos',
        baseInvestmentNetEur: 28500,
        monthlyRentalNetEur: 1250,
    },
    {
        code: 'GK-250',
        powerKw: 250,
        powerLabel: '250 kW',
        heatedAreaM2: '1 800 – 3 500 m²',
        dimensionsM: '6,0 × 3,0 × 3,0 m',
        hopperVolumeM3: '16 m³ (judančios grindys / sraigtai)',
        fuels: 'Medienos granulės, smulkinta skiedra (G30), pjuvenų briketai',
        targetUseCases: 'Baldai ir medienos apdirbimas, sandėliai, šiltnamiai, biurų pastatai',
        baseInvestmentNetEur: 46900,
        monthlyRentalNetEur: 1950,
    },
    {
        code: 'GK-500',
        powerKw: 500,
        powerLabel: '500 kW',
        heatedAreaM2: '3 500 – 7 500 m²',
        dimensionsM: '9,0 × 3,0 × 3,2 m',
        hopperVolumeM3: '28 m³ (hidraulinės judančios grindys)',
        fuels: 'Biokuras (skiedra G30–G50), pramoninės granulės, durpės',
        targetUseCases: 'Gamyklos, logistikos centrai, šiltnamių ūkiai, daugiabučių kvartalai',
        baseInvestmentNetEur: 78500,
        monthlyRentalNetEur: 3200,
    },
    {
        code: 'GK-1000',
        powerKw: 1000,
        powerLabel: '1,0 MW (1 000 kW)',
        heatedAreaM3OrM2: '7 500 – 15 000 m²',
        heatedAreaM2: '7 500 – 15 000 m²',
        dimensionsM: '12,0 × 3,5 × 3,5 m (2×500 kW kaskada)',
        hopperVolumeM3: '45 m³ su automatiniu pelenų šalinimu ir multiciklonu',
        fuels: 'Šlapia skiedra (iki 45 % drėgmės), granulės, pramoninės medienos atliekos',
        targetUseCases: 'Pramonės įmonės, grūdų džiovyklos, rajoninės katilinės',
        baseInvestmentNetEur: 138000,
        monthlyRentalNetEur: 5400,
    } as IndustrialBoilerModule & { heatedAreaM3OrM2?: string },
    {
        code: 'GK-2500',
        powerKw: 2500,
        powerLabel: '2,5 MW (2 500 kW)',
        heatedAreaM2: '15 000 – 38 000 m²',
        dimensionsM: 'Modulinis 2–3 konteinerių blokas su dūmų filtrais',
        hopperVolumeM3: '90 m³ Walking-Floor kuro sandėlis',
        fuels: 'Biokuras (skiedra, žievė, pjuvenos), granulės, rezervinis dujų/dyzelino degiklis',
        targetUseCases: 'Didžioji pramonė, centralizuoto šildymo tinklai, technologinis garas/vanduo',
        baseInvestmentNetEur: 279000,
        monthlyRentalNetEur: 9800,
    },
];

export interface IndustrialFuelOption {
    id: 'natural-gas' | 'lpg' | 'diesel' | 'electricity';
    label: string;
    eurPerMwh: number;
    note: string;
}

export const INDUSTRIAL_FUELS: IndustrialFuelOption[] = [
    {
        id: 'natural-gas',
        label: 'Gamtinės dujos (su ESO skirstymo dedamąja)',
        eurPerMwh: 82,
        note: '~82 €/MWh šilumos (įskaitant katilo naudingumą ir galios mokestį)',
    },
    {
        id: 'lpg',
        label: 'Suskystintos dujos (LPG balionai / požeminė talpa)',
        eurPerMwh: 108,
        note: '~108 €/MWh šilumos (~0,78 €/l LPG)',
    },
    {
        id: 'diesel',
        label: 'Dyzelinas (žymėtas šildymo kuras)',
        eurPerMwh: 118,
        note: '~118 €/MWh šilumos (~1,05 €/l su pristatymu)',
    },
    {
        id: 'electricity',
        label: 'Tiesioginė elektra / pramoniniai šildytuvai',
        eurPerMwh: 165,
        note: '~165 €/MWh (pramoninis tarifas su persiuntimu)',
    },
];

export const GILES_BIOMASS_EUR_PER_MWH = 38; // ~38 €/MWh su pramoninėmis granulėmis / skiedra

export function computeIndustrialBoilerRoi(input: {
    currentFuelId: IndustrialFuelOption['id'];
    annualHeatMwh: number;
    moduleCode: string;
}) {
    const fuel =
        INDUSTRIAL_FUELS.find((f) => f.id === input.currentFuelId) || INDUSTRIAL_FUELS[1]!;
    const mod =
        INDUSTRIAL_BOILER_MODULES.find((m) => m.code === input.moduleCode) ||
        INDUSTRIAL_BOILER_MODULES[2]!;

    const mwh = Math.max(100, input.annualHeatMwh);
    const currentAnnualCostEur = Math.round(mwh * fuel.eurPerMwh);
    const biomassAnnualCostEur = Math.round(mwh * GILES_BIOMASS_EUR_PER_MWH);
    const annualSavingsEur = Math.max(1000, currentAnnualCostEur - biomassAnnualCostEur);
    const paybackMonths = Math.max(
        4,
        Math.round((mod.baseInvestmentNetEur / annualSavingsEur) * 12),
    );

    return {
        fuel,
        module: mod,
        annualHeatMwh: mwh,
        currentAnnualCostEur,
        biomassAnnualCostEur,
        annualSavingsEur,
        fiveYearSavingsEur: annualSavingsEur * 5 - mod.baseInvestmentNetEur,
        paybackMonths,
    };
}

export interface GilesSupplierPricelist {
    id: string;
    supplierName: string;
    sourceFile: string;
    effectiveDate: string;
    skuCount: number;
    eanCount: number;
    dealerDiscountLabel: string;
    defaultDiscountPercent: number;
    status: 'active' | 'synced';
    brandSlug: string;
    notes: string;
}

export const GILES_SUPPLIER_PRICELISTS: GilesSupplierPricelist[] = [
    {
        id: 'danfoss',
        supplierName: '1. Danfoss Climate Solutions',
        sourceFile: 'Danfoss_Kainorastis_LT.xlsx',
        effectiveDate: 'Aktyvus didmeninis kainynas',
        skuCount: 3857,
        eanCount: 419,
        dealerDiscountLabel: '-35%..-60%',
        defaultDiscountPercent: 45,
        status: 'synced',
        brandSlug: 'danfoss',
        notes: 'RA-N, Dynamic Valve, Icon2 24V, Redia M30×1,5, AB-QM balansiniai mazgai.',
    },
    {
        id: 'herz',
        supplierName: '2. UAB HERZ Baltija',
        sourceFile: 'HERZ_Kainynas_LT.xlsx',
        effectiveDate: 'Aktyvus didmeninis kainynas',
        skuCount: 3525,
        eanCount: 3110,
        dealerDiscountLabel: '-50%',
        defaultDiscountPercent: 50,
        status: 'synced',
        brandSlug: 'herz',
        notes: 'PE-RT/Al/PE-RT vamzdžiai, RL-1/RL-5 vožtuvai, katilinių aprišimo mazgai.',
    },
    {
        id: 'gorenje-tiki',
        supplierName: '3. Gorenje / TIKI',
        sourceFile: 'Gorenje_TIKI_Didmena.xlsx',
        effectiveDate: 'Aktyvus didmeninis kainynas',
        skuCount: 63,
        eanCount: 63,
        dealerDiscountLabel: '-30%',
        defaultDiscountPercent: 30,
        status: 'synced',
        brandSlug: 'gorenje',
        notes: 'GBK, TGR, OGB Smart ir ZV kombinuoti vandens šildytuvai (boileriai).',
    },
    {
        id: 'giles-megatherm',
        supplierName: '4. Gilės Inžinerija / Megatherm',
        sourceFile: 'Giles_Megatherm_Gamyba.ods',
        effectiveDate: 'Aktyvus didmeninis kainynas',
        skuCount: 373,
        eanCount: 198,
        dealerDiscountLabel: '-35%',
        defaultDiscountPercent: 35,
        status: 'synced',
        brandSlug: 'giles-inzinerija',
        notes: 'MPB NANI 35/50/80/150 degikliai, KaTRI katilai, šnekai, valdikliai, flanšai.',
    },
    {
        id: 'haier',
        supplierName: '5. Haier ŠVOK',
        sourceFile: 'Haier_SVOK_Kainynas.xlsx',
        effectiveDate: 'Aktyvus didmeninis kainynas',
        skuCount: 465,
        eanCount: 465,
        dealerDiscountLabel: '-40%',
        defaultDiscountPercent: 40,
        status: 'synced',
        brandSlug: 'haier',
        notes: 'Super Aqua Monoblock R290/R32 (AW082..AW162), Hydro All-in-One, kondicionieriai.',
    },
];

export interface B2BQuickOrderResolvedRow {
    inputCode: string;
    qty: number;
    found: boolean;
    productId: string;
    sku: string;
    ean: string;
    title: string;
    brandName: string;
    stockLabel: string;
    retailGrossUnitEur: number;
    retailNetUnitEur: number;
    discountPercent: number;
    dealerNetUnitEur: number;
    dealerGrossUnitEur: number;
    lineTotalNetEur: number;
    lineTotalGrossEur: number;
    lineMarginEur: number;
    imageUrl?: string;
}

export function resolveB2BDiscountForBrand(brandName?: string | null): number {
    const b = (brandName || '').toLowerCase();
    if (b.includes('herz')) return 50;
    if (b.includes('danfoss')) return 45;
    if (b.includes('haier')) return 40;
    if (b.includes('imi') || b.includes('heimeier') || b.includes('pneumatex')) return 42;
    if (b.includes('comisa') || b.includes('wilo') || b.includes('viessmann')) return 38;
    if (b.includes('giles') || b.includes('gilės') || b.includes('megatherm') || b.includes('pelltech')) return 35;
    if (b.includes('gorenje') || b.includes('drazice') || b.includes('dražice')) return 30;
    return 35;
}

