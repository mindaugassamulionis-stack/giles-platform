// Gilės Inžinerija & EGIP System Packages, Outsourced Engineering Services,
// and Interactive Heating System Calculator data & engineering calculations.

export interface PackageComponentItem {
    sku: string;
    productId: string;
    variantId: string;
    slug: string;
    brand: string;
    name: string;
    specSummary: string;
    priceEur: number;
    quantity: number;
    imageUrl: string;
}

export interface UnderfloorAreaPreset {
    areaM2: 50 | 100 | 150 | 200;
    label: string;
    loopsCount: number;
    pipeLengthM: number;
    cabinetLabel: string;
    components: PackageComponentItem[];
}

export interface SystemPackageOffer {
    id: string;
    numberLabel: string;
    title: string;
    subtitle: string;
    powerOrScopeBadge: string;
    targetApplication: string;
    heroImageUrl: string;
    includedHighlights: string[];
    engineeringNotes: string;
    components: PackageComponentItem[];
    underfloorPresets?: UnderfloorAreaPreset[];
}

export interface EngineeringServiceItem {
    id: string;
    numberLabel: string;
    title: string;
    shortScope: string;
    description: string;
    deliverables: string[];
    partnerEquipmentBrands: string[];
    leadTimeLabel: string;
    referencePriceLabel: string;
    representativeImageUrl: string;
    representativeSku: string;
}

export type InsulationClassKey = 'a_plus' | 'b_c' | 'old_unrenovated';
export type HeatingEmitterType = 'underfloor' | 'radiators' | 'mixed';
export type HeatSourceType =
    | 'heat_pump_air_water'
    | 'electric_boiler'
    | 'heat_pump_air_air'
    | 'pellet'
    | 'solid_fuel_buffer'
    | 'gas_condensing';
export type OccupantsTier = '1_2' | '3_4' | '5_plus';

export interface HeatingCalculatorInput {
    areaM2: number;
    insulationClass: InsulationClassKey;
    emitterType: HeatingEmitterType;
    heatSource: HeatSourceType;
    occupants: OccupantsTier;
}

export interface HeatingCalculatorResult {
    requiredPowerKw: number;
    specificHeatLossWm2: number;
    recommendedHeatSourceModel: string;
    recommendedHeatSourceSku: string;
    recommendedHeatSourcePriceEur: number;
    recommendedHeatSourceSlug: string;
    recommendedBufferLiters: number;
    recommendedBufferSku?: string;
    recommendedBufferModel?: string;
    recommendedBufferPriceEur?: number;
    bufferReason: string;
    recommendedBoilerLiters: number;
    recommendedBoilerModel: string;
    recommendedBoilerSku: string;
    underfloorLoopsCount: number;
    underfloorPipeLengthM: number;
    recommendedManifoldSku: string;
    recommendedRadiatorControlLabel: string;
    recommendedExpansionVesselLiters: number;
    recommendedExpansionVesselSku: string;
    recommendedPackageId: string;
    recommendedUnderfloorAreaPreset?: 50 | 100 | 150 | 200;
}

export const UNDERFLOOR_AREA_PRESETS: UnderfloorAreaPreset[] = [
    {
        areaM2: 50,
        label: '50 m² (4 kontūrai)',
        loopsCount: 4,
        pipeLengthM: 320,
        cabinetLabel: 'Virštinkinė / potinkinė spintelė 4–6 kontūrams + 320 m Comisa PEX-AL-PEX 16×2.0',
        components: [
            {
                sku: '88.20.413',
                productId: 'f1e8d120-cc76-53f5-8408-56839f06103e',
                variantId: '106a128f-d236-5b02-8b72-ab3fa643effb',
                slug: 'comisa-kolektorius-su-debitomaciais-nikeliuotas-4-88-20-413',
                brand: 'Comisa',
                name: 'Comisa nikeliuotas grindinio šildymo kolektorius su debitomačiais (4 kontūrų)',
                specSummary: '1" kolektoriaus sijos, 0–5 l/min debitomačiai, 3/4" Eurokonus išvadai',
                priceEur: 157.70,
                quantity: 1,
                imageUrl: '/images/products/giles-88-06-4131-9732ce5d.webp',
            },
            {
                sku: '88.20.518',
                productId: '7a81521c-d1a9-566e-842f-7dc14fe7ca21',
                variantId: '025b2d86-61f0-53c4-a1c4-6cfe5809b073',
                slug: 'comisa-pavara-elektrotermine-m30x1-5-88-20-518',
                brand: 'Comisa',
                name: 'Comisa termoelektrinė pavara 230 V (M30×1,5) kontūrų valdymui',
                specSummary: '230 V AC, NC (normaliai uždara), sriegis M30×1,5, IP44',
                priceEur: 31.54,
                quantity: 4,
                imageUrl: '/images/products/giles-88-20-5181-d10585f3.webp',
            },
            {
                sku: '88.03.116',
                productId: 'dfeacc00-72b1-5c15-bedd-c7a7dafb1a07',
                variantId: 'f564f961-319d-548d-bac0-a19d17345a96',
                slug: 'comisa-verzle-euro-16-x-2-3-4-88-03-116',
                brand: 'Comisa',
                name: 'Comisa Eurokonus suspaudžiamos jungtys PEX-AL-PEX vamzdžiui 16×2.0 – 3/4"',
                specSummary: 'Žalvarinės Eurokonus jungtys 16×2.0 mm daugiasluoksniam vamzdžiui (8 vnt.)',
                priceEur: 2.45,
                quantity: 8,
                imageUrl: '/images/products/giles-12-e1411974058983-15414770.webp',
            },
            {
                sku: '88.10.360',
                productId: '032dbc78-90d0-55c7-8a4b-3dbc26bf5ee4',
                variantId: 'a5883853-3b2e-5301-90c4-9fc1bd2601cd',
                slug: 'comisa-nuorintojas-automatinis-nikeliuotas-1-2-88-10-360',
                brand: 'Comisa',
                name: 'Comisa automatinis nikeliuotas kolektoriaus nuorintojas 1/2"',
                specSummary: 'Paduodamo ir grįžtamo kolektoriaus nuorinimo mazgas (2 vnt.)',
                priceEur: 7.71,
                quantity: 2,
                imageUrl: '/images/products/giles-88-10-3601-1919b06c.webp',
            },
            {
                sku: '9018586',
                productId: 'e17cc6b9-e283-5293-a035-55277d0893f4',
                variantId: '20900888-94fd-5ba3-9c79-9576ab047bd5',
                slug: 'watts-patalpos-termostatas-wfht-lcd-230v-ip30-nc-no-9018586',
                brand: 'Watts',
                name: 'Watts WFHT-LCD skaitmeniniai patalpų termostatai 230 V',
                specSummary: 'LCD ekranas, 5–35 °C reguliavimas, 230 V NC/NO, IP30 (2 zonoms)',
                priceEur: 56.07,
                quantity: 2,
                imageUrl: '/images/products/giles-wfhc-rf-lcd-8ce4cff3.webp',
            },
        ],
    },
    {
        areaM2: 100,
        label: '100 m² (6 kontūrai)',
        loopsCount: 6,
        pipeLengthM: 600,
        cabinetLabel: 'Virštinkinė / potinkinė spintelė 6–8 kontūrams + 600 m Comisa PEX-AL-PEX 16×2.0',
        components: [
            {
                sku: '88.20.415',
                productId: 'b8a714d8-634e-59aa-9bce-0c429c3fc277',
                variantId: '1da3d1da-9981-5f3a-a56e-ef16a9141b95',
                slug: 'comisa-kolektorius-su-debitomaciais-nikeliuotas-6-88-20-415',
                brand: 'Comisa',
                name: 'Comisa nikeliuotas grindinio šildymo kolektorius su debitomačiais (6 kontūrų)',
                specSummary: '1" kolektoriaus sijos, 0–5 l/min debitomačiai, 3/4" Eurokonus išvadai',
                priceEur: 227.79,
                quantity: 1,
                imageUrl: '/images/products/giles-88-06-4131-9732ce5d.webp',
            },
            {
                sku: '88.20.518',
                productId: '7a81521c-d1a9-566e-842f-7dc14fe7ca21',
                variantId: '025b2d86-61f0-53c4-a1c4-6cfe5809b073',
                slug: 'comisa-pavara-elektrotermine-m30x1-5-88-20-518',
                brand: 'Comisa',
                name: 'Comisa termoelektrinė pavara 230 V (M30×1,5) kontūrų valdymui',
                specSummary: '230 V AC, NC (normaliai uždara), sriegis M30×1,5, IP44 (6 kontūrams)',
                priceEur: 31.54,
                quantity: 6,
                imageUrl: '/images/products/giles-88-20-5181-d10585f3.webp',
            },
            {
                sku: '88.03.116',
                productId: 'dfeacc00-72b1-5c15-bedd-c7a7dafb1a07',
                variantId: 'f564f961-319d-548d-bac0-a19d17345a96',
                slug: 'comisa-verzle-euro-16-x-2-3-4-88-03-116',
                brand: 'Comisa',
                name: 'Comisa Eurokonus suspaudžiamos jungtys PEX-AL-PEX vamzdžiui 16×2.0 – 3/4"',
                specSummary: 'Žalvarinės Eurokonus jungtys 16×2.0 mm daugiasluoksniam vamzdžiui (12 vnt.)',
                priceEur: 2.45,
                quantity: 12,
                imageUrl: '/images/products/giles-12-e1411974058983-15414770.webp',
            },
            {
                sku: '88.10.360',
                productId: '032dbc78-90d0-55c7-8a4b-3dbc26bf5ee4',
                variantId: 'a5883853-3b2e-5301-90c4-9fc1bd2601cd',
                slug: 'comisa-nuorintojas-automatinis-nikeliuotas-1-2-88-10-360',
                brand: 'Comisa',
                name: 'Comisa automatinis nikeliuotas kolektoriaus nuorintojas 1/2"',
                specSummary: 'Paduodamo ir grįžtamo kolektoriaus nuorinimo mazgas (2 vnt.)',
                priceEur: 7.71,
                quantity: 2,
                imageUrl: '/images/products/giles-88-10-3601-1919b06c.webp',
            },
            {
                sku: '9018586',
                productId: 'e17cc6b9-e283-5293-a035-55277d0893f4',
                variantId: '20900888-94fd-5ba3-9c79-9576ab047bd5',
                slug: 'watts-patalpos-termostatas-wfht-lcd-230v-ip30-nc-no-9018586',
                brand: 'Watts',
                name: 'Watts WFHT-LCD skaitmeniniai patalpų termostatai 230 V',
                specSummary: 'LCD ekranas, 5–35 °C reguliavimas, 230 V NC/NO, IP30 (4 zonoms)',
                priceEur: 56.07,
                quantity: 4,
                imageUrl: '/images/products/giles-wfhc-rf-lcd-8ce4cff3.webp',
            },
        ],
    },
    {
        areaM2: 150,
        label: '150 m² (9 kontūrai)',
        loopsCount: 9,
        pipeLengthM: 900,
        cabinetLabel: 'Virštinkinė / potinkinė spintelė 9–10 kontūrų + 900 m Comisa PEX-AL-PEX 16×2.0',
        components: [
            {
                sku: '88.20.418',
                productId: '7fa82cf3-ccfd-58e5-9976-cee1a4a360b9',
                variantId: '6f243287-c3ae-508b-a601-8d18dcc2dacb',
                slug: 'comisa-kolektorius-su-debitomaciais-nikeliuotas-9-88-20-418',
                brand: 'Comisa',
                name: 'Comisa nikeliuotas grindinio šildymo kolektorius su debitomačiais (9 kontūrų)',
                specSummary: '1" kolektoriaus sijos, 0–5 l/min debitomačiai, 3/4" Eurokonus išvadai',
                priceEur: 332.92,
                quantity: 1,
                imageUrl: '/images/products/giles-88-06-4131-9732ce5d.webp',
            },
            {
                sku: '88.20.518',
                productId: '7a81521c-d1a9-566e-842f-7dc14fe7ca21',
                variantId: '025b2d86-61f0-53c4-a1c4-6cfe5809b073',
                slug: 'comisa-pavara-elektrotermine-m30x1-5-88-20-518',
                brand: 'Comisa',
                name: 'Comisa termoelektrinė pavara 230 V (M30×1,5) kontūrų valdymui',
                specSummary: '230 V AC, NC (normaliai uždara), sriegis M30×1,5, IP44 (9 kontūrams)',
                priceEur: 31.54,
                quantity: 9,
                imageUrl: '/images/products/giles-88-20-5181-d10585f3.webp',
            },
            {
                sku: '88.03.116',
                productId: 'dfeacc00-72b1-5c15-bedd-c7a7dafb1a07',
                variantId: 'f564f961-319d-548d-bac0-a19d17345a96',
                slug: 'comisa-verzle-euro-16-x-2-3-4-88-03-116',
                brand: 'Comisa',
                name: 'Comisa Eurokonus suspaudžiamos jungtys PEX-AL-PEX vamzdžiui 16×2.0 – 3/4"',
                specSummary: 'Žalvarinės Eurokonus jungtys 16×2.0 mm daugiasluoksniam vamzdžiui (18 vnt.)',
                priceEur: 2.45,
                quantity: 18,
                imageUrl: '/images/products/giles-12-e1411974058983-15414770.webp',
            },
            {
                sku: '88.10.360',
                productId: '032dbc78-90d0-55c7-8a4b-3dbc26bf5ee4',
                variantId: 'a5883853-3b2e-5301-90c4-9fc1bd2601cd',
                slug: 'comisa-nuorintojas-automatinis-nikeliuotas-1-2-88-10-360',
                brand: 'Comisa',
                name: 'Comisa automatinis nikeliuotas kolektoriaus nuorintojas 1/2"',
                specSummary: 'Paduodamo ir grįžtamo kolektoriaus nuorinimo mazgas (2 vnt.)',
                priceEur: 7.71,
                quantity: 2,
                imageUrl: '/images/products/giles-88-10-3601-1919b06c.webp',
            },
            {
                sku: '9018586',
                productId: 'e17cc6b9-e283-5293-a035-55277d0893f4',
                variantId: '20900888-94fd-5ba3-9c79-9576ab047bd5',
                slug: 'watts-patalpos-termostatas-wfht-lcd-230v-ip30-nc-no-9018586',
                brand: 'Watts',
                name: 'Watts WFHT-LCD skaitmeniniai patalpų termostatai 230 V',
                specSummary: 'LCD ekranas, 5–35 °C reguliavimas, 230 V NC/NO, IP30 (5 zonoms)',
                priceEur: 56.07,
                quantity: 5,
                imageUrl: '/images/products/giles-wfhc-rf-lcd-8ce4cff3.webp',
            },
        ],
    },
    {
        areaM2: 200,
        label: '200 m² (12 kontūrų)',
        loopsCount: 12,
        pipeLengthM: 1200,
        cabinetLabel: 'Virštinkinė / potinkinė spintelė 12 kontūrų + 1200 m Comisa PEX-AL-PEX 16×2.0',
        components: [
            {
                sku: '88.20.421',
                productId: '037dcc65-2393-5199-9d21-3ee8f22481b5',
                variantId: '7575e5f8-9e18-5216-9068-2ea7d9c85f51',
                slug: 'comisa-kolektorius-su-debitomaciais-nikeliuotas-12-88-20-421',
                brand: 'Comisa',
                name: 'Comisa nikeliuotas grindinio šildymo kolektorius su debitomačiais (12 kontūrų)',
                specSummary: '1" kolektoriaus sijos, 0–5 l/min debitomačiai, 3/4" Eurokonus išvadai',
                priceEur: 508.14,
                quantity: 1,
                imageUrl: '/images/products/giles-88-06-4131-9732ce5d.webp',
            },
            {
                sku: '88.20.518',
                productId: '7a81521c-d1a9-566e-842f-7dc14fe7ca21',
                variantId: '025b2d86-61f0-53c4-a1c4-6cfe5809b073',
                slug: 'comisa-pavara-elektrotermine-m30x1-5-88-20-518',
                brand: 'Comisa',
                name: 'Comisa termoelektrinė pavara 230 V (M30×1,5) kontūrų valdymui',
                specSummary: '230 V AC, NC (normaliai uždara), sriegis M30×1,5, IP44 (12 kontūrų)',
                priceEur: 31.54,
                quantity: 12,
                imageUrl: '/images/products/giles-88-20-5181-d10585f3.webp',
            },
            {
                sku: '88.03.116',
                productId: 'dfeacc00-72b1-5c15-bedd-c7a7dafb1a07',
                variantId: 'f564f961-319d-548d-bac0-a19d17345a96',
                slug: 'comisa-verzle-euro-16-x-2-3-4-88-03-116',
                brand: 'Comisa',
                name: 'Comisa Eurokonus suspaudžiamos jungtys PEX-AL-PEX vamzdžiui 16×2.0 – 3/4"',
                specSummary: 'Žalvarinės Eurokonus jungtys 16×2.0 mm daugiasluoksniam vamzdžiui (24 vnt.)',
                priceEur: 2.45,
                quantity: 24,
                imageUrl: '/images/products/giles-12-e1411974058983-15414770.webp',
            },
            {
                sku: '88.10.360',
                productId: '032dbc78-90d0-55c7-8a4b-3dbc26bf5ee4',
                variantId: 'a5883853-3b2e-5301-90c4-9fc1bd2601cd',
                slug: 'comisa-nuorintojas-automatinis-nikeliuotas-1-2-88-10-360',
                brand: 'Comisa',
                name: 'Comisa automatinis nikeliuotas kolektoriaus nuorintojas 1/2"',
                specSummary: 'Paduodamo ir grįžtamo kolektoriaus nuorinimo mazgas (2 vnt.)',
                priceEur: 7.71,
                quantity: 2,
                imageUrl: '/images/products/giles-88-10-3601-1919b06c.webp',
            },
            {
                sku: '9018586',
                productId: 'e17cc6b9-e283-5293-a035-55277d0893f4',
                variantId: '20900888-94fd-5ba3-9c79-9576ab047bd5',
                slug: 'watts-patalpos-termostatas-wfht-lcd-230v-ip30-nc-no-9018586',
                brand: 'Watts',
                name: 'Watts WFHT-LCD skaitmeniniai patalpų termostatai 230 V',
                specSummary: 'LCD ekranas, 5–35 °C reguliavimas, 230 V NC/NO, IP30 (6 zonoms)',
                priceEur: 56.07,
                quantity: 6,
                imageUrl: '/images/products/giles-wfhc-rf-lcd-8ce4cff3.webp',
            },
        ],
    },
];

export const GILES_SYSTEM_PACKAGES: SystemPackageOffer[] = [
    {
        id: 'pkg-pellet-25kw',
        numberLabel: 'Paketas Nr. 1',
        title: 'Granulinės katilinės pilnas paketas (20–25 kW)',
        subtitle: 'KaTRI 25 kW / Centrometal EKO-CK P 25 kW katilas + Pelltech PV20a / Megatherm 20 kW degiklio komplektas + 460 L talpa + apsaugos ir cirkuliacinis mazgas',
        powerOrScopeBadge: '20–25 kW · 120–240 m² namui',
        targetApplication: 'Pilnai automatizuota granulinė katilinė individualiam namui arba esamos kieto kuro katilinės modernizavimas',
        heroImageUrl: '/images/products/egip-katri3850020.webp',
        includedHighlights: [
            'KaTRI 25 kW (5–6 mm P265GH katilinis plienas), Centrometal EKO-CK P 25 kW arba Ponast KP08 (8 kW su 130 L bunkeriu – 2 890 €) šildymo katilas',
            'Automatinis granulių degiklio komplektas: „Nord komfortui“ Pelltech PV20a 10–20 kW (degkmpl140pv20 – 2 350 €), „Link lyderių“ Megatherm 10–35 kW (degkmpl140mg20 – 2 150 €) arba „Vidutiniams“ 25–50 kW (degkmpl50kv)',
            '460 L cinkuoto plieno granulių bunkeris (23013009600X0) + HERZ Teplomix 61 °C + Watts KSG 30 + Wilo Yonos PICO 25/1-6',
        ],
        engineeringNotes: 'Suderinta pagal Gilės Inžinerija granulinės katilinės schemą ir oficialius modernizavimo komplektus („Link lyderių“ 2 150 €, „Nord komfortui“ 2 350 €, „Vidutiniams“ 15–50 kW): HERZ Teplomix 61 °C apsaugo katilo šilumokaitį nuo kondensato, o Pelltech PV20a / Megatherm degiklis automatiškai uždega ir moduliuoja galią.',
        components: [
            {
                sku: 'KaTRI3850020',
                productId: '72a75477-ea91-5b77-a6f9-17fb0786f5f0',
                variantId: '0cb7a8d9-bc13-5f65-b852-e31ad5238fc5',
                slug: 'plieninis-kieto-kuro-ir-granuliu-sildymo-katilas-25-kw-su-triju-e-katri3850020',
                brand: 'Gilės Inžinerija',
                name: 'Plieninis kieto kuro ir granulių šildymo katilas KaTRI 25 kW (arba Centrometal EKO-CK P 25 kW)',
                specSummary: '25 kW, 5–6 mm P265GH katilinis plienas, 3 eigų šilumokaitis, 2.5 bar',
                priceEur: 1750.00,
                quantity: 1,
                imageUrl: '/images/products/egip-katri3850020.webp',
            },
            {
                sku: 'degkmpl140pv20',
                productId: '07f3763c-aa54-5801-9d55-07f178111553',
                variantId: '3a535d10-6ffe-54b4-9a0c-5892a2d714ae',
                slug: 'automatinis-medienos-granuliu-degiklio-komplektas-pelltech-pv20a-degkmpl140pv20',
                brand: 'Pelltech',
                name: 'Pelltech PV20a 20 kW automatinis granulių degiklio komplektas su sraigtu (alt. Megatherm degkmpl140mg20)',
                specSummary: '10–20 kW moduliacija, automatinis uždegimas, 1.4 m sraigtas ir valdiklis',
                priceEur: 2350.00,
                quantity: 1,
                imageUrl: '/images/products/egip-degkmpl140pv20.webp',
            },
            {
                sku: '23013009600X0',
                productId: '35b72088-3fe2-52f4-a632-de7858495dc7',
                variantId: '0d85eecd-5451-5075-b732-48418464eafa',
                slug: 'kuro-talpa-bunkeris-460ltr-23013009600x0',
                brand: 'Gilės Inžinerija',
                name: 'Medienos granulių talpa – bunkeris 460 L',
                specSummary: '460 L (~300 kg granulių, 5–10 parų autonominiam darbui)',
                priceEur: 220.00,
                quantity: 1,
                imageUrl: '/images/products/egip-23013009600x0.webp',
            },
            {
                sku: '0270132',
                productId: 'aea3fceb-7343-5b5e-b07a-307d8dd551a1',
                variantId: 'dd42c6fd-e06e-50e2-80b2-1f46736d8cd9',
                slug: 'watts-ksg-30-komplektacija-manometras-4bar-nuorintuvas-apsauginis-0270132',
                brand: 'Watts',
                name: 'Watts KSG 30 katilo apsaugos grupė 3 bar su manometru ir nuorintuvu',
                specSummary: '1" vidinis sriegis, 3 bar apsauginis vožtuvas, 0–4 bar manometras',
                priceEur: 48.40,
                quantity: 1,
                imageUrl: '/images/products/giles-ksg-eb0735a4.webp',
            },
            {
                sku: '1776603',
                productId: 'c218dbef-5f0a-5c4b-8de0-905a41f30383',
                variantId: '8d816af1-7613-5936-95f0-4b40e15b654e',
                slug: 'herz-trieigis-pamaisymo-voztuvas-su-imontuotu-termostatiniu-eleme-1776603',
                brand: 'HERZ',
                name: 'HERZ Teplomix DN25 termostatinis grįžtamo srauto vožtuvas 61 °C',
                specSummary: 'DN25, Kvs 11, palaiko >= 55–61 °C grįžtamą srautą į katilą',
                priceEur: 79.79,
                quantity: 1,
                imageUrl: '/images/products/giles-termomaisytuvas-katilui-a3159b78.webp',
            },
            {
                sku: '4248084',
                productId: '5c3851f1-f4c8-5663-8eaa-43e54b20b8a1',
                variantId: '64ceeff2-a9da-5d91-800d-286e464d0cab',
                slug: 'wilo-yonos-pico1-0-25-1-6-1-180-4248084',
                brand: 'Wilo',
                name: 'Wilo Yonos PICO 1.0 25/1-6 elektroninis cirkuliacinis siurblys',
                specSummary: 'G 1 1/2" (DN25), montavimo ilgis 180 mm, kėlimo aukštis iki 6 m',
                priceEur: 385.99,
                quantity: 1,
                imageUrl: '/images/products/giles-yonos-pico-25-1-8-0f95e4c1.webp',
            },
        ],
    },
    {
        id: 'pkg-solid-fuel-buffer',
        numberLabel: 'Paketas Nr. 2',
        title: 'Kieto kuro katilinės paketas su akumuliacine talpa (25–35 kW)',
        subtitle: 'Centrometal EKO-CK P / Bio-Pek katilas + Centrometal CAS 1001 akumuliacinė talpa + termostatinis krovimo mazgas + IMI Pneumatex Statico + Wilo Yonos PICO',
        powerOrScopeBadge: '25–35 kW · 1000 L akumuliacija',
        targetApplication: 'Malkomis ir briketais kūrenama katilinė su 1000 L šilumos akumuliacija tolygiam namo šildymui be perkaitimo',
        heroImageUrl: '/images/products/giles-eko-ck-p-14-110-kw-gi1-a9b6ef59.webp',
        includedHighlights: [
            'Centrometal EKO-CK P 25 kW (arba EKO-CK P 35 kW / Bio-Pek) plieninis katilas',
            'Centrometal CAS 1001 (1000 L) akumuliacinė talpa su šilumine izoliacija',
            'HERZ Teplomix DN25 termostatinis krovimo mazgas + IMI Pneumatex Statico SD 80.3 + Wilo Yonos PICO 25/1-6',
        ],
        engineeringNotes: 'Pagal EN 303-5 rekomendaciją (40–50 L akumuliacinės talpos 1 kW katilo galios), 1000 L Centrometal CAS 1001 talpa sugeria pilną įkrovos šilumą ir leidžia kieto kuro katilui dirbti maksimaliu naudingumu.',
        components: [
            {
                sku: '17526',
                productId: '7e6aedf0-476e-5265-a1e1-a6f177e1247c',
                variantId: '778a6184-30f6-5d84-b71c-af777eebd47a',
                slug: 'centrometal-plieninis-kieto-kuro-katilas-eko-ck-p-25-17526',
                brand: 'Centrometal',
                name: 'Centrometal EKO-CK P 25 kW plieninis kieto kuro katilas (alt. Bio-Pek 29 kW)',
                specSummary: '25 kW, EN 303-5, didelė pakura malkoms ir briketams, paruoštas degikliui',
                priceEur: 1390.10,
                quantity: 1,
                imageUrl: '/images/products/giles-eko-ck-p-14-110-kw-gi1-a9b6ef59.webp',
            },
            {
                sku: '16716',
                productId: '15351283-697c-5a0d-ac76-5a2e2821d9e0',
                variantId: 'a651794e-810c-52f9-aaf9-056e32b9e735',
                slug: 'centrometal-akumuliacine-talpa-cas-1001-16716',
                brand: 'Centrometal',
                name: 'Centrometal CAS 1001 akumuliacinė talpa (1000 L)',
                specSummary: '1000 L tūris, nuimama poliuretano izoliacija, 8 pajungimo atvamzdžiai',
                priceEur: 1108.72,
                quantity: 1,
                imageUrl: '/images/products/giles-cas-ir-pjuvis-foto-500x500-austrobal-e567acab.webp',
            },
            {
                sku: '1776603',
                productId: 'c218dbef-5f0a-5c4b-8de0-905a41f30383',
                variantId: '8d816af1-7613-5936-95f0-4b40e15b654e',
                slug: 'herz-trieigis-pamaisymo-voztuvas-su-imontuotu-termostatiniu-eleme-1776603',
                brand: 'HERZ',
                name: 'HERZ Teplomix DN25 termostatinis krovimo mazgas 61 °C',
                specSummary: 'DN25, Kvs 11, automatinis akumuliacinės talpos įkrovimo valdymas',
                priceEur: 79.79,
                quantity: 1,
                imageUrl: '/images/products/giles-termomaisytuvas-katilui-a3159b78.webp',
            },
            {
                sku: '7101006',
                productId: '18c71c54-43b3-444d-aace-3e569e8df0f8',
                variantId: 'dc9d3f78-24f5-4e19-9c2c-73b0c7f4e487',
                slug: 'statico-sd-80-3-issipletimo-indas-disko-formos-pakabinamas-su-butyl-gu-7101006',
                brand: 'IMI Pneumatex',
                name: 'IMI Pneumatex Statico SD 80.3 išsiplėtimo indas (80 L / 3 bar)',
                specSummary: '80 L, butyl gumos kamera (EN 12828), pradinis slėgis 1.5 bar, R3/4"',
                priceEur: 326.69,
                quantity: 1,
                imageUrl: '/images/products/giles-7891720-zuvls-giles-inzinerija-f2590bce.webp',
            },
            {
                sku: '4248084',
                productId: '5c3851f1-f4c8-5663-8eaa-43e54b20b8a1',
                variantId: '64ceeff2-a9da-5d91-800d-286e464d0cab',
                slug: 'wilo-yonos-pico1-0-25-1-6-1-180-4248084',
                brand: 'Wilo',
                name: 'Wilo Yonos PICO 1.0 25/1-6 elektroninis cirkuliacinis siurblys',
                specSummary: 'G 1 1/2" (DN25), 180 mm, LED debito ir galios indikacija',
                priceEur: 385.99,
                quantity: 1,
                imageUrl: '/images/products/giles-yonos-pico-25-1-8-0f95e4c1.webp',
            },
        ],
    },
    {
        id: 'pkg-underfloor-comisa',
        numberLabel: 'Paketas Nr. 3',
        title: 'Grindinio šildymo pilnas paketas pagal plotą (Comisa 50 m² / 100 m² / 150 m² / 200 m²)',
        subtitle: 'Comisa nikeliuotas kolektorius su debitomačiais (4–12 kontūrų) + Comisa 230 V termoelektrinės pavaros + Eurokonus 16×2.0 jungtys + patalpų termostatai',
        powerOrScopeBadge: '50–200 m² · 4–12 kontūrų',
        targetApplication: 'Pilnas Comisa (Italija) ir Watts grindinio šildymo paskirstymo bei zoninio valdymo mazgas pasirinktam pastato plotui',
        heroImageUrl: '/images/products/giles-88-06-4131-9732ce5d.webp',
        includedHighlights: [
            'Pasirinkite plotą (50 m² / 100 m² / 150 m² / 200 m²) – komplektacija perskaičiuojama automatiškai',
            'Comisa 1" nikeliuotas kolektorius su 0–5 l/min debitomačiais (4, 6, 9 arba 12 kontūrų) + 3/4" Eurokonus 16×2.0 jungtys',
            'Comisa 230 V termoelektrinės pavaros M30×1,5 kiekvienam kontūrui + Watts WFHT-LCD kambario termostatai',
        ],
        engineeringNotes: 'Kiekvienam ~15–17 m² grindų plotui skaičiuojamas atskiras 70–85 m ilgio PEX-AL-PEX 16×2.0 mm vamzdžio kontūras, kad hidraulinis nuostolis neviršytų 20 kPa.',
        components: UNDERFLOOR_AREA_PRESETS[1].components,
        underfloorPresets: UNDERFLOOR_AREA_PRESETS,
    },
    {
        id: 'pkg-solar-dhw',
        numberLabel: 'Paketas Nr. 4',
        title: 'Saulės kolektorių ir karšto vandens ruošimo paketas',
        subtitle: 'Comisa KIT COMPACT 300 plokščiųjų saulės kolektorių sistema + Dražice OKC 300 NTRR/SOL dvigubo šilumokaičio boileris + Statico glikolio išsiplėtimo indas',
        powerOrScopeBadge: '4–6 asm. šeimai · 300 L DHW',
        targetApplication: 'Karšto buitinio vandens ruošimas saulės energija pavasarį–rudenį ir iš šildymo katilo žiemą',
        heroImageUrl: '/images/products/giles-9-solar-kit-4b39ec81.webp',
        includedHighlights: [
            'Comisa KIT COMPACT 300 (88.23.220): 2 plokštieji BLUETEC selektyvinio stiklo kolektoriai, saulės siurblinė, valdiklis ir 20 L glikolio',
            'Dražice OKC 300 NTRR/SOL (300 L) dviejų šilumokaičių vertikalus boileris saulės ir katilo kontūrams',
            'IMI Pneumatex Statico SD 25.10 (10 bar) specialus išsiplėtimo indas glikolio tirpalams iki 50 %',
        ],
        engineeringNotes: 'Dviejų šilumokaičių schema leidžia apatinį šilumokaitį prijungti prie Comisa saulės kolektorių siurblinės, o viršutinį – prie granulinio, kieto kuro arba dujinio katilo.',
        components: [
            {
                sku: '88.23.220',
                productId: '294f695c-14bc-5450-9207-6a95689dcedb',
                variantId: 'cc4f4884-4219-54a7-9dc6-7b36efd95e11',
                slug: 'comisa-kit-compact-300-naujas-saules-kolektoriu-rinkinys-compact-88-23-220',
                brand: 'Comisa',
                name: 'Comisa KIT COMPACT 300 plokščiųjų saulės kolektorių komplektas su saulės siurbline ir automatika',
                specSummary: '2×2.0 m² BLUETEC kolektoriai, siurblio grupė, valdiklis, laikikliai, 20 L glikolio',
                priceEur: 4275.37,
                quantity: 1,
                imageUrl: '/images/products/giles-9-solar-kit-4b39ec81.webp',
            },
            {
                sku: 'OKC300NTRR-S',
                productId: 'f1f3d6ef-a627-5e4e-9cf2-552ccbd42e93',
                variantId: '6a07db3d-1352-5523-b221-9549ab6c5561',
                slug: 'drazice-okc-300-ntrr-sol-35-24-okc300ntrr-s',
                brand: 'Dražice',
                name: 'Dražice OKC 300 NTRR/SOL dvigubo šilumokaičio saulės vandens šildytuvas (300 L)',
                specSummary: '300 L, du šilumokaičiai (35 + 24 kW), darbinis slėgis iki 1 MPa (10 bar)',
                priceEur: 1050.00,
                quantity: 1,
                imageUrl: '/images/products/giles-okce-250-ntr-1-4f6bdea8.webp',
            },
            {
                sku: '7103003',
                productId: 'ade39e34-e68a-45cd-9a57-9aa1615cb8f1',
                variantId: '22c58f3c-56ea-451b-8b2c-13f6c35a2c8a',
                slug: 'statico-sd-25-10-issipletimo-indas-disko-formos-pakabinamas-su-butyl-g-7103003',
                brand: 'IMI Pneumatex',
                name: 'IMI Pneumatex Statico SD 25.10 glikolio išsiplėtimo indas (25 L / 10 bar)',
                specSummary: '25 L, 10 bar darbinis slėgis, butyl kamera atspari glikoliui iki 50 %',
                priceEur: 199.42,
                quantity: 1,
                imageUrl: '/images/products/giles-7891720-zuvls-giles-inzinerija-f2590bce.webp',
            },
        ],
    },
    {
        id: 'pkg-renovation-balancing',
        numberLabel: 'Paketas Nr. 5',
        title: 'Šildymo sistemos renovacijos ir hidraulinio balansavimo paketas',
        subtitle: 'IMI Heimeier termostatiniai vožtuvai ir K-galvos + IMI TA STAD / STAP balansavimo ir slėgio perkričio ventiliai + IMI Pneumatex Zeparo oro ir šlamo separatorius',
        powerOrScopeBadge: 'Dvivamzdė / stovų renovacija',
        targetApplication: 'Daugiabučių stovų, mokyklų, darželių ir individualių namų radiatorinio šildymo sistemos hidraulinis subalansavimas',
        heroImageUrl: '/images/products/52-151-220.webp',
        includedHighlights: [
            '8 vnt. IMI Heimeier DX + V-exact termostatinių komplektų DN15 + 2 vnt. IMI Heimeier K-galvų M30×1,5',
            'IMI TA STAD DN20 balansinis vožtuvas + IMI TA STAP DN20 diferencinio slėgio reguliatorius (10–60 kPa)',
            'IMI Pneumatex Zeparo ZUVS 20 cikloninis oro ir magnetitinio šlamo separatorius',
        ],
        engineeringNotes: 'Suderinta pagal Gilės Inžinerijos renovacijos specifikaciją: STAP + STAD pora palaiko pastovų diferencinį slėgį stovuose, todėl radiatoriai neūžia ir tolygiai šyla visuose aukštuose.',
        components: [
            {
                sku: 'DXTEMVEX2P15',
                productId: '2066585b-0041-5f4c-8f43-e141ebdc0ba5',
                variantId: '98347673-1680-5d14-9d80-c9256cf11bb6',
                slug: 'imi-heimeier-kompl-dx-termostatine-galvute-temp-ribos-16-28c-v-ex-dxtemvex2p15',
                brand: 'IMI Heimeier',
                name: 'IMI Heimeier komplektas: DX termostatinė galvutė + V-exact termoventilis DN15',
                specSummary: 'DN15 tiesus termoventilis su išankstiniu kv nustatymu + DX galvutė 16–28 °C (8 vnt.)',
                priceEur: 15.31,
                quantity: 8,
                imageUrl: '/images/products/giles-6700-32-500-4caab21c.webp',
            },
            {
                sku: '6000-09.500',
                productId: 'd4f9bfd6-4f96-458e-88bb-c23e52bb9e38',
                variantId: '77a2b25b-7bdd-4080-840a-483a818d8bd5',
                slug: 'termostatine-galvute-k-6-28-standartine-su-imontuotu-davikliu-6000-09-6000-09-500',
                brand: 'IMI Heimeier',
                name: 'IMI Heimeier K-galva M30×1,5 su įmontuotu skystiniu davikliu (6–28 °C)',
                specSummary: 'Sriegis M30×1,5, tiksli temperatūros skalė 1–5 (2 vnt.)',
                priceEur: 18.50,
                quantity: 2,
                imageUrl: '/images/products/giles-3912-02-000-6afda445.webp',
            },
            {
                sku: '52-151-220',
                productId: 'f9e58d92-383d-4ae9-ac4a-895fc0bcdedb',
                variantId: '3dfd4900-4e33-4586-a82f-a3315e0310e9',
                slug: 'stad-balansinis-srauto-reguliavimo-voztuvas-su-istrizu-kotu-su-uzsisan-52-151-220',
                brand: 'IMI TA',
                name: 'IMI TA STAD DN20 balansinis srauto reguliavimo vožtuvas (Kvs 5.7)',
                specSummary: 'DN20 (G 3/4"), PN20, AMETAL lydinys, su matavimo atvamzdžiais ir drenažu',
                priceEur: 91.19,
                quantity: 1,
                imageUrl: '/images/products/52-151-220.webp',
            },
            {
                sku: '52-265-020',
                productId: '0c5a5d5d-4923-449f-ab53-240fe71a3d0c',
                variantId: '1b500c40-b372-4fef-b7c6-592e6a5878e6',
                slug: 'stap-slegio-perkricio-reguliatorius-10-60kpa-su-antgaliu-matavimui-ir-52-265-020',
                brand: 'IMI TA',
                name: 'IMI TA STAP DN20 diferencinio slėgio perkričio reguliatorius (10–60 kPa)',
                specSummary: 'DN20 (G 3/4"), Kvs 3.1, su 1 m kapiliariniu vamzdeliu ir matavimo nipeliu',
                priceEur: 187.54,
                quantity: 1,
                imageUrl: '/images/products/giles-52-265-015-a1e59010.webp',
            },
            {
                sku: '7891720',
                productId: '5389e099-aed5-4bba-a10f-0062f87cedfc',
                variantId: '8e499909-1541-4683-827e-7cb142628c08',
                slug: 'zeparo-zuvs-20-7891720',
                brand: 'IMI Pneumatex',
                name: 'IMI Pneumatex Zeparo ZUVS 20 automatinis oro ir šlamo separatorius',
                specSummary: 'DN20, Heiko-rin žiedų arba cikloninė separacija, PN10, Tmax 110 °C',
                priceEur: 206.23,
                quantity: 1,
                imageUrl: '/images/products/giles-7891720-zuvls-giles-inzinerija-f2590bce.webp',
            },
        ],
    },
    {
        id: 'pkg-gas-condensing',
        numberLabel: 'Paketas Nr. 6',
        title: 'Dujinės kondensacinės katilinės ir karšto vandens paketas',
        subtitle: 'Viessmann Vitodens 100-W / Buderus Logamax plus dujinis kondensacinis katilas + Dražice OKC 200 NTR boileris + Wilo Yonos PICO siurblys + Comisa pajungimo mazgas',
        powerOrScopeBadge: '6,5–26 kW · 200 L DHW',
        targetApplication: 'Kompaktiška, aukšto naudingumo dujinė kondensacinė katilinė su greitaeigiu 200 L karšto vandens ruošimu',
        heroImageUrl: '/images/products/giles-b1hc232-4a7fbc7a.webp',
        includedHighlights: [
            'Viessmann Vitodens 100-W 6,5–26 kW (B1HC232) su Inox-Radial šilumokaičiu ir Ø60/100 kaminu (alt. Buderus Logamax plus GB172i)',
            'Dražice OKC 200 NTR (200 L) boileris su 1.45 m² (32 kW) šilumokaičiu greitam karšto vandens paruošimui',
            'Wilo Yonos PICO 25/1-4 cirkuliacinis siurblys + IMI Pneumatex Statico SD 25.3 + Comisa žalvarinės jungtys',
        ],
        engineeringNotes: 'Dujinis kondensacinis katilas su 32 kW galios Dražice OKC 200 NTR šilumokaičiu paruošia 200 L karšto vandens per ~22 min., palaikant žemą grįžtamo srauto temperatūrą kondensacijai.',
        components: [
            {
                sku: 'B1HC232',
                productId: 'bdc4e5f7-ec50-5a68-8543-1f51ce16f58f',
                variantId: '32733076-55b7-519f-9a98-b1659da21e66',
                slug: 'viessmann-vitodens-100-w-montavimo-dalys-kamino-atvamzdis-60-100-b1hc232',
                brand: 'Viessmann',
                name: 'Viessmann Vitodens 100-W dujinis kondensacinis katilas 6,5–26 kW su Ø60/100 atvamzdžiu (alt. Buderus Logamax GB172i)',
                specSummary: '6.5–26 kW, Inox-Radial nerūdijančio plieno šilumokaitis, naudingumas iki 98 % (Hs)',
                priceEur: 1818.63,
                quantity: 1,
                imageUrl: '/images/products/giles-b1hc232-4a7fbc7a.webp',
            },
            {
                sku: 'OKC200NTR',
                productId: '36ea89a3-6721-5b5f-9419-c1744d6f9bc2',
                variantId: '22189ef9-1873-577e-bb8f-359067f1031b',
                slug: 'drazice-okc-200-ntr-32-okc200ntr',
                brand: 'Dražice',
                name: 'Dražice OKC 200 NTR vertikalus vandens šildytuvas (200 L, 32 kW šilumokaitis)',
                specSummary: '200 L, keraminė emalė su magnio anodu, 32 kW spiralinis šilumokaitis',
                priceEur: 760.00,
                quantity: 1,
                imageUrl: '/images/products/giles-okce-250-ntr-1-4f6bdea8.webp',
            },
            {
                sku: '4248082',
                productId: 'be24b509-4f8e-5f03-8a2b-e5986bfb624b',
                variantId: 'dd781758-3cd4-51b4-b957-985180826d60',
                slug: 'wilo-yonos-pico1-0-25-1-4-1-180-4248082',
                brand: 'Wilo',
                name: 'Wilo Yonos PICO 1.0 25/1-4 elektroninis cirkuliacinis siurblys',
                specSummary: 'G 1 1/2" (DN25), 180 mm, 4–20 W ECM variklis',
                priceEur: 333.96,
                quantity: 1,
                imageUrl: '/images/products/giles-yonos-pico-25-1-8-0f95e4c1.webp',
            },
            {
                sku: '7101003',
                productId: '8ada2c59-3a44-44b4-8c79-8f5a81e84790',
                variantId: '28d525d8-2a11-494f-a695-6045a168996c',
                slug: 'statico-sd-25-3-issipletimo-indas-disko-formos-pakabinamas-su-butyl-gu-7101003',
                brand: 'IMI Pneumatex',
                name: 'IMI Pneumatex Statico SD 25.3 išsiplėtimo indas 25 L / 3 bar',
                specSummary: '25 L, disko formos pakabinamas, butyl membrana, R3/4"',
                priceEur: 149.62,
                quantity: 1,
                imageUrl: '/images/products/giles-7891720-zuvls-giles-inzinerija-f2590bce.webp',
            },
            {
                sku: '88.01.030',
                productId: 'e3309974-656b-5016-87b5-23746553df93',
                variantId: 'cc149451-67c3-5958-b03b-46c85db262b2',
                slug: 'comisa-perejimas-su-isoriniu-sriegiu-1-m-x-3-4-m-88-01-030',
                brand: 'Comisa',
                name: 'Comisa žalvarinis katilinės ir boilerio pajungimo jungčių komplektas 1" × 3/4"',
                specSummary: 'CW617N štampuotas žalvaris, PN16 (4 vnt.)',
                priceEur: 3.15,
                quantity: 4,
                imageUrl: '/images/products/giles-21-e1399469712695-69da5885.webp',
            },
        ],
    },
    {
        id: 'pkg-heat-pump-haier',
        numberLabel: 'Paketas Nr. 7',
        title: 'Haier Super Aqua R290 Oras–Vanduo šilumos siurblio ir Gorenje ZV 100 mazgo paketas (8–10 kW, A++)',
        subtitle: 'Haier Super Aqua R290 / R32 šilumos siurblys (AW082HUGHA / AW082HVGHA / AU082FYCRA) + Gorenje / TIKI ZV 100 akumuliacinė talpa + Haier R290 HP200M7C-F9 boileris + IMI Pneumatex Statico SD 35.3',
        powerOrScopeBadge: '8–10 kW · A++ namui 80–160 m²',
        targetApplication: 'A+ / A++ klasės individualaus namo ar kotedžo šildymas, vėsinimas ir karšto vandens ruošimas su natūraliu R290 šaltnešiu bei Gorenje ZV 100 atitirpinimo (defrost) buferiu',
        heroImageUrl: '/images/products/haier-2026-aw082hugha.webp',
        includedHighlights: [
            'Haier Super Aqua R290 Oras–Vanduo šilumos siurblys AW082HUGHA 8 kW (3 430,00 €; alt. R290 GT AW082HVGHA 4 150,00 € arba R32 monoblokas AU082FYCRA(HW) 3 662,00 €)',
            'Gorenje / TIKI ZV 100 (100 L, 400,00 €; alt. ZV 50 320,00 € / ZV 200 800,00 €) akumuliacinė talpa šilumos siurblio atitirpinimo (defrost) ciklams ir ΔT = 5 K srautui',
            'Haier R290 šilumos siurblys–boileris HP200M7C-F9 (2 226,00 €; alt. HP250M7C-F9 2 241,00 € arba Dražice OKC 200 NTR/HP) + IMI Pneumatex Statico SD 35.3 + Zeparo ZUVS 20',
        ],
        engineeringNotes: 'Pagal šilumos siurblių hidraulikos reikalavimus (10–15 L/kW buferinio tūrio), Gorenje TIKI ZV 100 talpa užtikrina pakankamą termofikato tūrį atitirpinimo (defrost) ciklams ir apsaugo kompresorių nuo taktavimų užsidarius grindinio šildymo pavaroms.',
        components: [
            {
                sku: 'AW082HUGHA',
                productId: '0166d867-a866-54b7-8f84-933d856870a3',
                variantId: '75985ecd-71ca-52a7-b77a-3cbe810b2be0',
                slug: 'haier-r290-silumos-siurblys-oras-vanduo-aw082hugha-8-kw-r290-aw082hugha',
                brand: 'Haier',
                name: 'Haier Super Aqua R290 šilumos siurblys oras–vanduo AW082HUGHA, 8 kW (alt. AW082HVGHA / AU082FYCRA(HW))',
                specSummary: '8 kW, R290 natūralus šaltnešis, darbas iki -25 °C, padavimas iki +75 °C (HAIER-AW082HVGHA / AW082HUGHA)',
                priceEur: 3430.00,
                quantity: 1,
                imageUrl: '/images/products/haier-2026-aw082hugha.webp',
            },
            {
                sku: 'ZV 100',
                productId: '17316b9e-b992-5beb-9193-8027f824c230',
                variantId: 'b4f5b8e8-e3f2-5f1b-99fc-e4439a5a183c',
                slug: 'gorenje-tiki-zv-100-pakabinama-akumuliacine-sildymo-sistemos-zv-100',
                brand: 'Gorenje',
                name: 'Gorenje / TIKI ZV 100 pakabinama akumuliacinė šildymo sistemos talpa (100 L, šilumos siurbliams)',
                specSummary: '102 L, PN10 (10 bar), G 1 1/4" pajungimas, 33 mm PU izoliacija (GORENJE-ZV-100-739150 / GI-GORENJE-056)',
                priceEur: 400.00,
                quantity: 1,
                imageUrl: '/images/products/gorenje-2026-zv-100.webp',
            },
            {
                sku: 'HP200M7C-F9',
                productId: '46f26da4-dfb5-58d0-97d3-67c6458c0f8f',
                variantId: '9dcb08c7-1953-54c3-9918-686d917c1ade',
                slug: 'haier-r290-silumos-siurblys-boileris-karsto-vandens-ruosimui-hp200m7c-f9',
                brand: 'Haier',
                name: 'Haier R290 šilumos siurblys–boileris karštam vandeniui HP200M7C-F9 (alt. HP200M7C-9 / HP250M7C-F9)',
                specSummary: 'R290 integruotas šilumos siurblys + šilumokaitis, A+ klasė (HAIER-HP200M7C-9 / HP200M7C-F9)',
                priceEur: 2226.00,
                quantity: 1,
                imageUrl: '/images/products/haier-2026-hp200m7c-f9.webp',
            },
            {
                sku: '7101003',
                productId: '8ada2c59-3a44-44b4-8c79-8f5a81e84790',
                variantId: '28d525d8-2a11-494f-a695-6045a168996c',
                slug: 'statico-sd-25-3-issipletimo-indas-disko-formos-pakabinamas-su-butyl-gu-7101003',
                brand: 'IMI Pneumatex',
                name: 'IMI Pneumatex Statico SD 25.3 išsiplėtimo indas 25 L / 3 bar',
                specSummary: '25 L, disko formos pakabinamas, Airproof butyl membrana, R3/4"',
                priceEur: 149.62,
                quantity: 1,
                imageUrl: '/images/products/giles-7891720-zuvls-giles-inzinerija-f2590bce.webp',
            },
            {
                sku: '7891720',
                productId: '5389e099-aed5-4bba-a10f-0062f87cedfc',
                variantId: '8e499909-1541-4683-827e-7cb142628c08',
                slug: 'zeparo-zuvs-20-7891720',
                brand: 'IMI Pneumatex',
                name: 'IMI Pneumatex Zeparo ZUVS 20 automatinis oro ir šlamo separatorius',
                specSummary: 'DN20, cikloninis mikroburbuliukų ir magnetito šalinimas šilumos siurblio apsaugai',
                priceEur: 206.23,
                quantity: 1,
                imageUrl: '/images/products/giles-7891720-zuvls-giles-inzinerija-f2590bce.webp',
            },
        ],
    },
];

export function computePackageTotalEur(items: PackageComponentItem[]): number {
    const sum = items.reduce((acc, item) => acc + item.priceEur * item.quantity, 0);
    return Math.round(sum * 100) / 100;
}

export const GILES_ENGINEERING_SERVICES: EngineeringServiceItem[] = [
    {
        id: 'svc-hvac-design',
        numberLabel: 'Paslauga 01',
        title: 'ŠVOK, katilinių ir vandentiekio techninis bei darbo projektavimas',
        shortScope: 'Techniniai, darbo ir 3D katilinių projektai pagal STR 2.01.02 / EN 12831',
        description: 'Rengiame individualių namų, daugiabučių, mokyklų ir pramoninių objektų vidaus šildymo, vandentiekio, nuotekų, vėdinimo bei šildymo automatizavimo techninius ir darbo projektus, taip pat 3D konteinerinių ir dujinių katilinių projektus.',
        deliverables: [
            'Šilumos nuostolių ir hidrauliniai skaičiavimai (EN 12831, EN 12828)',
            'Katilinės principinė ir montavimo schema su tikslia įrangos specifikacija',
            'Grindinio šildymo kontūrų išklotinės ir kolektorių balansavimo lentelės',
        ],
        partnerEquipmentBrands: ['Danfoss', 'IMI TA', 'IMI Heimeier', 'Viessmann', 'Comisa'],
        leadTimeLabel: 'Paruošimas per 3–7 d. d.',
        referencePriceLabel: 'Projekto kaina įskaičiuojama į įrangos komplektą arba pagal objekto plotą',
        representativeImageUrl: '/images/products/giles-b1hc232-4a7fbc7a.webp',
        representativeSku: 'B1HC232',
    },
    {
        id: 'svc-boiler-room-install',
        numberLabel: 'Paslauga 02',
        title: 'Katilinių, granulių degiklių ir šilumos siurblių montavimas iki rakto',
        shortScope: 'Katilinių įrengimas, kieto kuro katilų perdarymas į granulinius ir APVA dokumentai',
        description: 'Montuojame granulines, kieto kuro (su akumuliacinėmis talpomis), dujines kondensacines bei gaminame/nuomojame mobilias konteinerines ir biodujų katilines (15–90 kW granuliniai karšto oro, 40–190 kW dyzeliniai/dvigubo kuro, 110–120 kW karšto vandens, 150–500 kW / 750 kW / 2 MW hidraulinės katilinės), taip pat modernizuojame kieto kuro katilus su Pelltech ir Megatherm degikliais.',
        deliverables: [
            'Katilo, degiklio („Link lyderių“ / „Nord komfortui“ / „Vidutiniams“), akumuliacinės talpos ir boilerio montavimas',
            'Mobilių konteinerinių ir biodujų katilinių (15 kW – 2 MW) gamyba, nuoma, pardavimas ir pajungimas',
            'Hidraulinis išbandymas, dūmtraukio traukos patikra ir dokumentai APVA kompensacijai',
        ],
        partnerEquipmentBrands: ['Gilės Inžinerija', 'Centrometal', 'Pelltech', 'Megatherm', 'Viessmann', 'Buderus', 'Ponast', 'Bosch'],
        leadTimeLabel: 'Montavimas per 2–5 d. d.',
        referencePriceLabel: 'Darbų sąmata pateikiama per 24 val. po objekto ar nuotraukų įvertinimo',
        representativeImageUrl: '/images/products/egip-katri3850020.webp',
        representativeSku: 'KaTRI3850020',
    },
    {
        id: 'svc-underfloor-plumbing',
        numberLabel: 'Paslauga 03',
        title: 'Grindinio šildymo, rekuperacijos ir vidaus inžinerinių tinklų įrengimas',
        shortScope: 'Comisa PEX-AL-PEX grindinis šildymas, FV-Plast / SANHA vamzdynai ir Wavin nuotekos',
        description: 'Įrengiame pilnas grindinio ir radiatorinio šildymo sistemas, montuojame Comisa ir HERZ kolektorius su debitomačiais, klijuojame ir presuojame SANHA varinius bei FV-Plast PPR vamzdynus, įrengiame Wavin vidaus bei betriukšmes nuotekų sistemas.',
        deliverables: [
            'Grindinio šildymo vamzdžių klojimas, kolektorių spintelių ir zoninės automatikos montavimas',
            'Slėginis sistemos sandarumo bandymas ir akto išrašymas prieš betonavimą',
            'Karšto ir šalto vandentiekio bei recirkuliacijos linijų izoliavimas Thermawool / Thermaflex',
        ],
        partnerEquipmentBrands: ['Comisa', 'HERZ', 'Watts', 'SANHA', 'FV-Plast', 'Wavin'],
        leadTimeLabel: 'Etapinis įrengimas pagal statybų grafiką',
        referencePriceLabel: 'Fiksuotas įkainis už m² arba pilna objekto sąmata',
        representativeImageUrl: '/images/products/giles-88-06-4131-9732ce5d.webp',
        representativeSku: '88.20.415',
    },
    {
        id: 'svc-hydraulic-balancing',
        numberLabel: 'Paslauga 04',
        title: 'Hidraulinis sistemų balansavimas (IMI TA įranga) ir paleidimas-derinimas',
        shortScope: 'Daugiabučių, mokyklų, darželių ir komercinių pastatų stovų balansavimas',
        description: 'Atliekame šildymo sistemų renovaciją ir instrumentalų hidraulinį balansavimą su IMI TA STAD, STAF, STAP bei IMI Heimeier V-exact / A-exact armatūra, panaikinant vamzdynų triukšmą ir netolygų patalpų šildymą.',
        deliverables: [
            'Stovų ir atšakų srautų išmatavimas elektroniniu IMI TA balansavimo prietaisu',
            'STAD / STAP slėgio perkričio reguliatorių ir Zeparo separatorių sumontavimas',
            'Oficialus hidraulinio balansavimo protokolas šilumos ūkio pridavimui',
        ],
        partnerEquipmentBrands: ['IMI TA', 'IMI Heimeier', 'IMI Pneumatex', 'Danfoss'],
        leadTimeLabel: 'Išvykimas į objektą per 1–3 d. d.',
        referencePriceLabel: 'Pagal stovų ir balansinių mazgų skaičių',
        representativeImageUrl: '/images/products/52-151-220.webp',
        representativeSku: '52-151-220',
    },
    {
        id: 'svc-burner-boiler-service',
        numberLabel: 'Paslauga 05',
        title: 'Granulinių degiklių (Pelltech, Megatherm, Ferroli, Centrometal) ir katilų servisas',
        shortScope: 'Garantinis ir pogarantinis remontas, tenų keitimas, dūmų analizė ir derinimas',
        description: 'Vykdome garantinį ir pogarantinį Centrometal, Buderus (Robert Bosch), Viessmann, Ferroli, Verner, Pelltech, Megatherm ir HERZ katilų bei degiklių aptarnavimą, keičiame uždegimo tenus, fotodaviklius, Danfoss purkštukus ir programuojame valdiklius.',
        deliverables: [
            'Skubus uždegimo tenų (kvarcinių, keraminių, metalinių), sraigtų ir jutiklių keitimas',
            'Degimo parametrų reguliavimas su dūmų analizatoriumi (CO, O₂, naudingumo %)',
            'Kasmetinė profilaktinė katilinės patikra prieš šildymo sezoną',
        ],
        partnerEquipmentBrands: ['Pelltech', 'Megatherm', 'Ferroli', 'Centrometal', 'Danfoss'],
        leadTimeLabel: 'Serviso meistro iškvietimas per 24 val.',
        referencePriceLabel: 'Atsarginės dalys iš mūsų sandėlio + serviso iškvietimo įkainis',
        representativeImageUrl: '/images/products/egip-degkmpl140pv20.webp',
        representativeSku: 'degkmpl140pv20',
    },
    {
        id: 'svc-full-bom-takeoff',
        numberLabel: 'Paslauga 06',
        title: 'Pilnas objekto sąmatos sukomplektavimas pagal Jūsų projektą ar brėžinius',
        shortScope: 'Nemokamas įrangos parinkimas ir sąmata iš brėžinio, Excel sąrašo ar katilinės nuotraukos',
        description: 'Atsiųskite namo ŠVOK projektą, santechniko sąrašą arba esamos katilinės nuotraukas – UAB „Gilės inžinerija“ inžinieriai per 2–24 val. sukomplektuos 100 % suderintą sąmatą su visomis jungtimis, sriegiais ir montavimo darbų pasiūlymu.',
        deliverables: [
            'Detali įrangos ir jungčių sąmata su tiksliais Gilės Inžinerijos ir OEM kodais',
            'Sriegių, įtampų (230 V / 24 V) ir hidraulinių Kvs verčių suderinamumo patikra',
            'Pasirinktinai: įrangos pristatymas į objektą arba pristatymas su montavimu iki rakto',
        ],
        partnerEquipmentBrands: ['Gilės Inžinerija', 'Comisa', 'Dražice', 'Wilo', 'Watts', 'SANHA'],
        leadTimeLabel: 'Sąmata per 2–24 val.',
        referencePriceLabel: 'Sąmatos sudarymas – 0,00 € (nemokamai)',
        representativeImageUrl: '/images/products/giles-okce-250-ntr-1-4f6bdea8.webp',
        representativeSku: 'OKC200NTR',
    },
];

const SPECIFIC_HEAT_LOSS_MAP: Record<InsulationClassKey, number> = {
    a_plus: 35,
    b_c: 60,
    old_unrenovated: 90,
};

export function calculateHeatingSystemRecommendation(input: HeatingCalculatorInput): HeatingCalculatorResult {
    const clampedArea = Math.max(40, Math.min(400, Math.round(input.areaM2 || 140)));
    const specificHeatLossWm2 = SPECIFIC_HEAT_LOSS_MAP[input.insulationClass] || 60;

    // Base transmission + ventilation heat load + 15% reserve factor (EN 12831 practical sizing)
    const rawHeatKw = (clampedArea * specificHeatLossWm2 * 1.15) / 1000;
    const dhwAdderKw = input.occupants === '5_plus' ? 3.5 : input.occupants === '3_4' ? 2.0 : 1.0;
    const requiredPowerKw = Math.max(5, Math.round((rawHeatKw + dhwAdderKw) * 10) / 10);

    let recommendedHeatSourceModel = 'KaTRI 25 kW + Pelltech PV20a / Megatherm 20 kW granulių degiklis';
    let recommendedHeatSourceSku = 'KaTRI3850020';
    let recommendedHeatSourcePriceEur = 1750;
    let recommendedHeatSourceSlug = 'plieninis-kieto-kuro-ir-granuliu-sildymo-katilas-25-kw-su-triju-e-katri3850020';

    let recommendedBufferLiters = 0;
    let recommendedBufferSku: string | undefined;
    let recommendedBufferModel: string | undefined;
    let recommendedBufferPriceEur: number | undefined;
    let bufferReason = 'Dujiniam kondensaciniam katilui su plačia moduliacija akumuliacinė talpa nebūtina';

    // Domestic hot water (DHW) default Dražice boiler selection by occupants
    let recommendedBoilerLiters = 160;
    let recommendedBoilerModel = 'Dražice OKC 160 NTR (160 L, 32 kW šilumokaitis)';
    let recommendedBoilerSku = 'OKC160NTR';
    if (input.occupants === '3_4') {
        recommendedBoilerLiters = 200;
        recommendedBoilerModel = 'Dražice OKC 200 NTR (200 L, 32 kW šilumokaitis, 760 €)';
        recommendedBoilerSku = 'OKC200NTR';
    } else if (input.occupants === '5_plus') {
        recommendedBoilerLiters = 250;
        recommendedBoilerModel = 'Dražice OKC 250 NTR (250 L, 32 kW šilumokaitis)';
        recommendedBoilerSku = 'OKC250NTR';
    }

    if (input.heatSource === 'heat_pump_air_water') {
        if (requiredPowerKw <= 6.5) {
            recommendedHeatSourceModel =
                'Haier Super Aqua AU052FYCRB(HW) (R32, 5 kW, 3 170 €; alt. AU052FYCRA 2 280 € / R290 AW062HUGHA 6 kW 3 193 € / AW062HVGHA 3 900 € su PVM)';
            recommendedHeatSourceSku = 'AU052FYCRB(HW)';
            recommendedHeatSourcePriceEur = 3170;
            recommendedHeatSourceSlug =
                'haier-monoblokas-silumos-siurblys-oras-vanduo-r32-au052fycrb-au052fycrb-hw';
            recommendedBufferLiters = 50;
            recommendedBufferSku = 'ZV 50';
            recommendedBufferModel = 'Gorenje / TIKI ZV 50 (50 L, 320 € / 300 € su PVM)';
            recommendedBufferPriceEur = 320;
        } else if (requiredPowerKw <= 9.5) {
            recommendedHeatSourceModel =
                'Haier Super Aqua AW082HUGHA (R290, 8 kW, 3 430 €; alt. R32 AU082FYCRA(HW) 3 662 € / AU082FYCRA 2 900 € / R290 GT AW082HVGHA 4 150 € su PVM)';
            recommendedHeatSourceSku = 'AW082HUGHA';
            recommendedHeatSourcePriceEur = 3430;
            recommendedHeatSourceSlug =
                'haier-r290-silumos-siurblys-oras-vanduo-aw082hugha-8-kw-r290-aw082hugha';
            recommendedBufferLiters = 100;
            recommendedBufferSku = 'ZV 100';
            recommendedBufferModel = 'Gorenje / TIKI ZV 100 (100 L, 400 € / 370 € su PVM; alt. ZV 80 320 €)';
            recommendedBufferPriceEur = 400;
        } else if (requiredPowerKw <= 12.5) {
            recommendedHeatSourceModel =
                'Haier Super Aqua AW102HUGHA (R290, 10 kW, 3 669 €; alt. R32 AU112FYCRA(HW) 11 kW 5 949 € / AU112FYCRA 4 300 € / AW102HVGHA 4 850 € su PVM)';
            recommendedHeatSourceSku = 'AW102HUGHA';
            recommendedHeatSourcePriceEur = 3669;
            recommendedHeatSourceSlug =
                'haier-r290-silumos-siurblys-oras-vanduo-aw102hugha-10-kw-r29-aw102hugha';
            recommendedBufferLiters = 150;
            recommendedBufferSku = 'ZV 150 FS';
            recommendedBufferModel = 'Gorenje / TIKI ZV 150 FS (150 L, 500 € / 480 € su PVM)';
            recommendedBufferPriceEur = 500;
        } else {
            recommendedHeatSourceModel =
                'Haier Super Aqua AW16NHVGHA (R290, 16 kW, 4 520 €; alt. R32 AU162FYCRA(HW) 16 kW 6 262 € / AU162FYCRA 4 800 € / AW162HVGHA 6 000 € su PVM)';
            recommendedHeatSourceSku = 'AW16NHVGHA';
            recommendedHeatSourcePriceEur = 4520;
            recommendedHeatSourceSlug =
                'haier-r290-silumos-siurblys-oras-vanduo-aw16nhvgha-16-kw-r29-aw16nhvgha';
            recommendedBufferLiters = 200;
            recommendedBufferSku = 'ZV 200';
            recommendedBufferModel = 'Gorenje / TIKI ZV 200 (200 L, 800 € / 580 € su PVM)';
            recommendedBufferPriceEur = 800;
        }
        bufferReason = `10–15 L/kW atitirpinimo (defrost) ir hidraulinio atskyrimo talpa: ${recommendedBufferModel}`;

        if (input.occupants === '5_plus') {
            recommendedBoilerLiters = 250;
            recommendedBoilerModel =
                'Haier R290 HP250M7C-F9 (250 L, 2 241 € / 2 200 € su PVM; alt. Dražice OKC 250 NTR/HP)';
            recommendedBoilerSku = 'HP250M7C-F9';
        } else {
            recommendedBoilerLiters = 200;
            recommendedBoilerModel =
                'Haier R290 HP200M7C-F9 (200 L, 2 226 € / HP200M7C-9 1 550 € su PVM; alt. Dražice OKC 200 NTR/HP 760 €)';
            recommendedBoilerSku = 'HP200M7C-F9';
        }
    } else if (input.heatSource === 'electric_boiler') {
        if (requiredPowerKw <= 9.5) {
            recommendedHeatSourceModel =
                'Haier ES10V-F1 (9 kW, 1/3 faz., 990 € su PVM) + Haier ES50V-TF7(EU) (308 € su PVM)';
            recommendedHeatSourceSku = 'ES50V-TF7(EU)';
            recommendedHeatSourcePriceEur = 990;
            recommendedHeatSourceSlug =
                'haier-tf7-plokscias-dvieju-baku-elektrinis-vandens-sildytuvas-es50v-tf7-eu';
        } else if (requiredPowerKw <= 14.5) {
            recommendedHeatSourceModel =
                'Haier ES50V-F3(EU) (14 kW, 3 faz., 1 040 € su PVM) + Haier ES80V-TF7W(EU) Wi-Fi (389 € su PVM)';
            recommendedHeatSourceSku = 'ES80V-TF7W(EU)';
            recommendedHeatSourcePriceEur = 1040;
            recommendedHeatSourceSlug =
                'haier-tf7w-plokscias-wi-fi-elektrinis-vandens-sildytuvas-boil-es80v-tf7w-eu';
        } else if (requiredPowerKw <= 21.5) {
            recommendedHeatSourceModel =
                'Haier ES80V-F3(EU) (21 kW, 3 faz., 1 130 € su PVM) + Gorenje GBU 120 E5 (480 € su PVM)';
            recommendedHeatSourceSku = 'ES80V-TF7W(EU)';
            recommendedHeatSourcePriceEur = 1130;
            recommendedHeatSourceSlug =
                'haier-tf7w-plokscias-wi-fi-elektrinis-vandens-sildytuvas-boil-es80v-tf7w-eu';
        } else {
            recommendedHeatSourceModel =
                'Haier ES100V-F3(EU) (28 kW, 3 faz., 1 230 € su PVM) + Haier ES100V-TF7W(EU) (418 € su PVM)';
            recommendedHeatSourceSku = 'ES100V-TF7W(EU)';
            recommendedHeatSourcePriceEur = 1230;
            recommendedHeatSourceSlug =
                'haier-tf7w-plokscias-wi-fi-elektrinis-vandens-sildytuvas-boil-es100v-tf7w-eu';
        }
        recommendedBufferLiters = clampedArea >= 120 ? 100 : 50;
        recommendedBufferSku = recommendedBufferLiters === 100 ? 'ZV 100' : 'ZV 50';
        recommendedBufferModel =
            recommendedBufferLiters === 100
                ? 'Gorenje / TIKI ZV 100 (100 L, 400 € su PVM)'
                : 'Gorenje / TIKI ZV 50 (50 L, 320 € su PVM)';
        recommendedBufferPriceEur = recommendedBufferLiters === 100 ? 400 : 320;
        bufferReason = `Hidrauliniam balansui ir naktinio tarifo kaupimui: ${recommendedBufferModel}`;
        recommendedBoilerModel = 'Gorenje GBU 120 E5 (480 €) arba Haier ES100V-TF7W(EU) Wi-Fi (418 € su PVM)';
        recommendedBoilerSku = 'ES100V-TF7W(EU)';
    } else if (input.heatSource === 'heat_pump_air_air') {
        if (clampedArea <= 65) {
            recommendedHeatSourceModel =
                'Haier Nordic Expert Plus AS25XCHHRA-NR/1U25KEHFRA-NR (iki -30 °C, 3.0 kW, 1 490 €; alt. Pearl Premium / Revive Plus 2.6–3.5 kW 590–921 € su PVM)';
            recommendedHeatSourceSku = 'AS25XCHHRA-NR/1U25KEHFRA-NR';
            recommendedHeatSourcePriceEur = 1490;
            recommendedHeatSourceSlug =
                'haier-nordic-silumos-siurblys-oras-oras-iki-30-c-as25xchhra-as25xchhra-nr-1u25kehfra-nr';
        } else if (clampedArea <= 110) {
            recommendedHeatSourceModel =
                'Haier Nordic Expert Plus AS35XCHHRA-NR/1U35KEHFRA-NR (iki -30 °C, 4.0 kW, 1 584 €; alt. Flexis Plus / Jade Plus Nordic 3.5–4.2 kW 986–1 730 € su PVM)';
            recommendedHeatSourceSku = 'AS35XCHHRA-NR/1U35KEHFRA-NR';
            recommendedHeatSourcePriceEur = 1584;
            recommendedHeatSourceSlug =
                'haier-split-silumos-siurblys-oras-oras-oro-kondicionierius-a-as35xchhra-nr-1u35kehfra-nr';
        } else {
            recommendedHeatSourceModel =
                'Haier Split AS50SDBHRA-MW/1U50KEBFRA-SH arba 2× Nordic Jade Plus / Expert Plus (6.0–7.0 kW, iki -25..-30 °C, 1 343–2 200 € su PVM)';
            recommendedHeatSourceSku = 'AS50SDBHRA-MW/1U50KEBFRA-SH';
            recommendedHeatSourcePriceEur = 1343;
            recommendedHeatSourceSlug =
                'haier-split-silumos-siurblys-oras-oras-oro-kondicionierius-a-as50sdbhra-mw-1u50kebfra-sh';
        }
        recommendedBufferLiters = 0;
        bufferReason = 'Oras–oras šilumos siurblys šildo tiesiogiai orą iki -25..-30 °C (hidraulinė talpa nereikalinga)';
        recommendedBoilerModel = 'Haier R290 HP200M7C-F9 (2 226 €) arba Haier ES80V-TF7W(EU) Wi-Fi (389 € su PVM)';
        recommendedBoilerSku = 'HP200M7C-F9';
    } else if (input.heatSource === 'solid_fuel_buffer') {
        recommendedHeatSourceModel =
            'Centrometal EKO-CK P 25 kW (1 390,10 €) / Gilės Inžinerija KaTRI 25 kW (1 750 €) + HERZ Teplomix DN25 61 °C (79,79 € su PVM)';
        recommendedHeatSourceSku = '17526';
        recommendedHeatSourcePriceEur = 1390.1;
        recommendedHeatSourceSlug = 'centrometal-plieninis-kieto-kuro-katilas-eko-ck-p-25-17526';
        const rawBuffer = requiredPowerKw * 50;
        if (rawBuffer <= 500) recommendedBufferLiters = 500;
        else if (rawBuffer <= 850) recommendedBufferLiters = 800;
        else if (rawBuffer <= 1150) recommendedBufferLiters = 1000;
        else recommendedBufferLiters = 1500;
        recommendedBufferSku = 'ZV 300';
        recommendedBufferModel = `Centrometal CAS ${recommendedBufferLiters === 1000 ? '1001' : recommendedBufferLiters + ' L'} arba Gorenje ZV 150..300 (480–950 € su PVM) / Dražice NAD`;
        recommendedBufferPriceEur = 950;
        bufferReason = `50 L / 1 kW pagal EN 303-5 (${recommendedBufferModel}) + grįžtamo srauto apsauga ≥ 55–61 °C (HERZ Teplomix 1776603 – 79,79 €)`;
    } else if (input.heatSource === 'pellet') {
        recommendedHeatSourceModel =
            'Gilės Inžinerija KaTRI 25 kW (1 750 €) + Pelltech PV20a (2 350 €) / Megatherm 20 kW (2 150 €) + HERZ Teplomix 61 °C (79,79 €)';
        recommendedHeatSourceSku = 'KaTRI3850020';
        recommendedHeatSourcePriceEur = 1750;
        recommendedHeatSourceSlug =
            'plieninis-kieto-kuro-ir-granuliu-sildymo-katilas-25-kw-su-triju-e-katri3850020';
        recommendedBufferLiters = clampedArea >= 180 ? 300 : 200;
        recommendedBufferSku = recommendedBufferLiters === 300 ? 'ZV 300' : 'ZV 200';
        recommendedBufferModel =
            recommendedBufferLiters === 300
                ? 'Gorenje / TIKI ZV 300 (300 L, 950 € su PVM) arba Centrometal CAS 501'
                : 'Gorenje / TIKI ZV 200 (200 L, 800 € su PVM) arba ZV 150 FS (500 €)';
        recommendedBufferPriceEur = recommendedBufferLiters === 300 ? 950 : 800;
        bufferReason = `Rekomenduojama ${recommendedBufferModel} retesniems granulių degiklio uždegimo ciklams + HERZ Teplomix DN25 (79,79 €)`;
    } else if (input.heatSource === 'gas_condensing') {
        recommendedHeatSourceModel = 'Viessmann Vitodens 100-W 6,5–26 kW (B1HC232 – 1 818,63 € su PVM)';
        recommendedHeatSourceSku = 'B1HC232';
        recommendedHeatSourcePriceEur = 1818.63;
        recommendedHeatSourceSlug =
            'viessmann-vitodens-100-w-montavimo-dalys-kamino-atvamzdis-60-100-b1hc232';
    }

    // Underfloor heating loops & Comisa PEX-AL-PEX 16x2.0 pipe length
    const effectiveUnderfloorArea =
        input.emitterType === 'underfloor'
            ? clampedArea
            : input.emitterType === 'mixed'
              ? Math.round(clampedArea * 0.6)
              : 0;

    const underfloorLoopsCount =
        effectiveUnderfloorArea > 0
            ? Math.max(2, Math.min(12, Math.ceil(effectiveUnderfloorArea / 16)))
            : 0;
    const underfloorPipeLengthM = Math.round(effectiveUnderfloorArea * 6.2);

    const manifoldByLoops: Record<number, string> = {
        2: '88.20.411',
        3: '88.20.412',
        4: '88.20.413',
        5: '88.20.414',
        6: '88.20.415',
        7: '88.20.416',
        8: '88.20.417',
        9: '88.20.418',
        10: '88.20.419',
        11: '88.20.420',
        12: '88.20.421',
    };
    const recommendedManifoldSku =
        underfloorLoopsCount > 0 ? manifoldByLoops[underfloorLoopsCount] || '88.20.415' : '013G0014';

    const recommendedRadiatorControlLabel =
        input.emitterType === 'underfloor'
            ? `Comisa kolektorius (${recommendedManifoldSku}) + Comisa M30×1,5 pavaros (88.20.518 – 31,54 €) + Danfoss Icon / Watts termostatai`
            : `Danfoss RA-N 15 (013G0014 – 27,95 € su PVM) arba vienvamzdei RA-G 15 (013G1675 – 48,04 € su PVM) + Danfoss RA 2990 galvutė (013G2990 – 41,26 € su PVM) / IMI Heimeier Eclipse`;

    // Expansion vessel sizing (EN 12828: ~10% of total system + buffer water volume)
    let recommendedExpansionVesselLiters = 25;
    let recommendedExpansionVesselSku = '7101003';
    if (recommendedBufferLiters >= 800) {
        recommendedExpansionVesselLiters = 80;
        recommendedExpansionVesselSku = '7101006';
    } else if (recommendedBufferLiters >= 500 || clampedArea >= 220) {
        recommendedExpansionVesselLiters = 50;
        recommendedExpansionVesselSku = '7101005';
    } else if (clampedArea >= 140) {
        recommendedExpansionVesselLiters = 35;
        recommendedExpansionVesselSku = '7101004';
    }

    // Recommended package ID
    let recommendedPackageId = 'pkg-pellet-25kw';
    if (
        input.heatSource === 'heat_pump_air_water' ||
        input.heatSource === 'electric_boiler' ||
        input.heatSource === 'heat_pump_air_air'
    ) {
        recommendedPackageId = 'pkg-heat-pump-haier';
    } else if (input.heatSource === 'solid_fuel_buffer') {
        recommendedPackageId = 'pkg-solid-fuel-buffer';
    } else if (input.heatSource === 'gas_condensing') {
        recommendedPackageId = 'pkg-gas-condensing';
    } else {
        recommendedPackageId = 'pkg-pellet-25kw';
    }

    const recommendedUnderfloorAreaPreset: 50 | 100 | 150 | 200 =
        clampedArea <= 70 ? 50 : clampedArea <= 125 ? 100 : clampedArea <= 175 ? 150 : 200;

    return {
        requiredPowerKw,
        specificHeatLossWm2,
        recommendedHeatSourceModel,
        recommendedHeatSourceSku,
        recommendedHeatSourcePriceEur,
        recommendedHeatSourceSlug,
        recommendedBufferLiters,
        recommendedBufferSku,
        recommendedBufferModel,
        recommendedBufferPriceEur,
        bufferReason,
        recommendedBoilerLiters,
        recommendedBoilerModel,
        recommendedBoilerSku,
        underfloorLoopsCount,
        underfloorPipeLengthM,
        recommendedManifoldSku,
        recommendedRadiatorControlLabel,
        recommendedExpansionVesselLiters,
        recommendedExpansionVesselSku,
        recommendedPackageId,
        recommendedUnderfloorAreaPreset,
    };
}

export const calculateHeatingSystem = calculateHeatingSystemRecommendation;

export interface EngineeringLeadPayload {
    name?: string;
    phone?: string;
    email?: string;
    city?: string;
    address?: string;
    serviceType?: string;
    packageId?: string;
    areaM2?: number;
    notes?: string;
    items?: Array<{
        sku: string;
        title: string;
        quantity: number;
        unitPrice: number;
    }>;
}

export function validateEngineeringLeadPayload(raw: unknown): {
    ok: true;
    data: Required<Pick<EngineeringLeadPayload, 'name' | 'phone' | 'email' | 'city' | 'serviceType'>> & {
        address: string;
        packageId: string;
        areaM2: number | null;
        notes: string;
        items: Array<{ sku: string; title: string; quantity: number; unitPrice: number }>;
    };
} | { ok: false; error: string } {
    if (!raw || typeof raw !== 'object') {
        return { ok: false, error: 'Netinkamas užklausos formatas.' };
    }
    const body = raw as Record<string, unknown>;
    const name = String(body.name || '').trim().slice(0, 120);
    const phone = String(body.phone || '').trim().slice(0, 40);
    const email = String(body.email || '').trim().slice(0, 140);
    const city = String(body.city || 'Vilnius').trim().slice(0, 80);
    const address = String(body.address || city || 'Lietuva').trim().slice(0, 200);
    const serviceType = String(body.serviceType || 'Katilinės ir ŠVOK projektavimas bei montavimas').trim().slice(0, 160);
    const packageId = String(body.packageId || '').trim().slice(0, 80);
    const notes = String(body.notes || '').trim().slice(0, 2000);
    const areaNum = Number(body.areaM2);
    const areaM2 = Number.isFinite(areaNum) && areaNum > 0 ? Math.min(10000, Math.round(areaNum)) : null;

    if (name.length < 2) {
        return { ok: false, error: 'Įveskite vardą arba įmonės pavadinimą.' };
    }
    if (phone.length < 6 && !email.includes('@')) {
        return { ok: false, error: 'Įveskite telefono numerį arba el. pašto adresą.' };
    }

    const rawItems = Array.isArray(body.items) ? body.items : [];
    const items = rawItems
        .map((it: any) => ({
            sku: String(it?.sku || 'GILES-PASLAUGA').trim().slice(0, 64),
            title: String(it?.title || serviceType).trim().slice(0, 240),
            quantity: Math.max(1, Math.min(999, Math.round(Number(it?.quantity) || 1))),
            unitPrice: Math.max(0, Math.round((Number(it?.unitPrice) || 0) * 100) / 100),
        }))
        .slice(0, 30);

    return {
        ok: true,
        data: {
            name,
            phone,
            email: email || 'info@gilesinzinerija.lt',
            city: city || 'Vilnius',
            address,
            serviceType,
            packageId,
            areaM2,
            notes,
            items,
        },
    };
}

type PackageSupportedLocale = 'lt' | 'en' | 'pl' | 'ru';

function resolvePkgLocale(raw?: string | null): PackageSupportedLocale {
    const clean = (raw || 'lt').toLowerCase().trim();
    if (clean.startsWith('en')) return 'en';
    if (clean.startsWith('pl')) return 'pl';
    if (clean.startsWith('ru')) return 'ru';
    return 'lt';
}

const COMPONENT_COPY_I18N: Record<
    string,
    Record<Exclude<PackageSupportedLocale, 'lt'>, { name: string; specSummary: string }>
> = {
    '88.20.413': {
        en: {
            name: 'Comisa nickel-plated underfloor heating manifold with flowmeters (4 loops)',
            specSummary: '1" manifold bars, 0–5 L/min flowmeters, 3/4" Eurokonus outlets',
        },
        pl: {
            name: 'Niklowany rozdzielacz ogrzewania podłogowego Comisa z przepływomierzami (4 obiegi)',
            specSummary: 'Belki 1", przepływomierze 0–5 l/min, wyjścia 3/4" Eurokonus',
        },
        ru: {
            name: 'Никелированный коллектор теплого пола Comisa с расходомерами (4 контура)',
            specSummary: 'Балки 1", расходомеры 0–5 л/мин, выходы 3/4" Евроконус',
        },
    },
    '88.20.415': {
        en: {
            name: 'Comisa nickel-plated underfloor heating manifold with flowmeters (6 loops)',
            specSummary: '1" manifold bars, 0–5 L/min flowmeters, 3/4" Eurokonus outlets',
        },
        pl: {
            name: 'Niklowany rozdzielacz ogrzewania podłogowego Comisa z przepływomierzami (6 obiegów)',
            specSummary: 'Belki 1", przepływomierze 0–5 l/min, wyjścia 3/4" Eurokonus',
        },
        ru: {
            name: 'Никелированный коллектор теплого пола Comisa с расходомерами (6 контуров)',
            specSummary: 'Балки 1", расходомеры 0–5 л/мин, выходы 3/4" Евроконус',
        },
    },
    '88.20.418': {
        en: {
            name: 'Comisa nickel-plated underfloor heating manifold with flowmeters (9 loops)',
            specSummary: '1" manifold bars, 0–5 L/min flowmeters, 3/4" Eurokonus outlets',
        },
        pl: {
            name: 'Niklowany rozdzielacz ogrzewania podłogowego Comisa z przepływomierzami (9 obiegów)',
            specSummary: 'Belki 1", przepływomierze 0–5 l/min, wyjścia 3/4" Eurokonus',
        },
        ru: {
            name: 'Никелированный коллектор теплого пола Comisa с расходомерами (9 контуров)',
            specSummary: 'Балки 1", расходомеры 0–5 л/мин, выходы 3/4" Евроконус',
        },
    },
    '88.20.421': {
        en: {
            name: 'Comisa nickel-plated underfloor heating manifold with flowmeters (12 loops)',
            specSummary: '1" manifold bars, 0–5 L/min flowmeters, 3/4" Eurokonus outlets',
        },
        pl: {
            name: 'Niklowany rozdzielacz ogrzewania podłogowego Comisa z przepływomierzami (12 obiegów)',
            specSummary: 'Belki 1", przepływomierze 0–5 l/min, wyjścia 3/4" Eurokonus',
        },
        ru: {
            name: 'Никелированный коллектор теплого пола Comisa с расходомерами (12 контуров)',
            specSummary: 'Балки 1", расходомеры 0–5 л/мин, выходы 3/4" Евроконус',
        },
    },
    '88.20.518': {
        en: {
            name: 'Comisa electrothermal actuator 230 V (M30×1.5) for loop control',
            specSummary: '230 V AC, NC (normally closed), M30×1.5 thread, IP44',
        },
        pl: {
            name: 'Siłownik termoelektryczny Comisa 230 V (M30×1,5) do sterowania obiegami',
            specSummary: '230 V AC, NC (normalnie zamknięty), gwint M30×1,5, IP44',
        },
        ru: {
            name: 'Термоэлектрический сервопривод Comisa 230 В (M30×1,5) для управления контурами',
            specSummary: '230 В AC, NC (нормально закрытый), резьба M30×1,5, IP44',
        },
    },
    '88.03.116': {
        en: {
            name: 'Comisa Eurokonus compression fittings for PEX-AL-PEX pipe 16×2.0 – 3/4"',
            specSummary: 'Brass Eurokonus fittings for 16×2.0 mm multilayer pipe',
        },
        pl: {
            name: 'Złączki zaciskowe Comisa Eurokonus do rury PEX-AL-PEX 16×2.0 – 3/4"',
            specSummary: 'Mosiężne złączki Eurokonus do rury wielowarstwowej 16×2.0 mm',
        },
        ru: {
            name: 'Компрессионные фитинги Comisa Евроконус для трубы PEX-AL-PEX 16×2.0 – 3/4"',
            specSummary: 'Латунные соединители Евроконус для металлопластиковой трубы 16×2.0 мм',
        },
    },
    '88.10.360': {
        en: {
            name: 'Comisa automatic nickel-plated manifold air vent 1/2"',
            specSummary: 'Supply and return manifold automatic air vent assembly (2 pcs)',
        },
        pl: {
            name: 'Automatyczny niklowany odpowietrznik rozdzielacza Comisa 1/2"',
            specSummary: 'Zespół odpowietrzający belki zasilającej i powrotnej (2 szt.)',
        },
        ru: {
            name: 'Автоматический никелированный воздухоотводчик коллектора Comisa 1/2"',
            specSummary: 'Узел развоздушивания подающего и обратного коллектора (2 шт.)',
        },
    },
    '9018586': {
        en: {
            name: 'Watts WFHT-LCD digital room thermostats 230 V',
            specSummary: 'LCD display, 5–35 °C setpoint range, 230 V NC/NO, IP30',
        },
        pl: {
            name: 'Cyfrowe termostaty pokojowe Watts WFHT-LCD 230 V',
            specSummary: 'Ekran LCD, regulacja 5–35 °C, 230 V NC/NO, IP30',
        },
        ru: {
            name: 'Цифровые комнатные термостаты Watts WFHT-LCD 230 В',
            specSummary: 'ЖК-экран, регулировка 5–35 °C, 230 В NC/NO, IP30',
        },
    },
    KaTRI3850020: {
        en: {
            name: 'Steel solid-fuel & pellet heating boiler KaTRI 25 kW (or Centrometal EKO-CK P 25 kW)',
            specSummary: '25 kW, 5–6 mm P265GH boiler steel, 3-pass heat exchanger, 2.5 bar',
        },
        pl: {
            name: 'Stalowy kocioł grzewczy na paliwo stałe i pellet KaTRI 25 kW (lub Centrometal EKO-CK P 25 kW)',
            specSummary: '25 kW, stal kotłowa P265GH 5–6 mm, trójciągowy wymiennik, 2,5 bar',
        },
        ru: {
            name: 'Стальной твердотопливный и пеллетный котел KaTRI 25 кВт (или Centrometal EKO-CK P 25 кВт)',
            specSummary: '25 кВт, котельная сталь P265GH 5–6 мм, 3-ходовой теплообменник, 2,5 бар',
        },
    },
    degkmpl140pv20: {
        en: {
            name: 'Pelltech PV20a 20 kW automatic pellet burner kit with auger (alt. Megatherm degkmpl140mg20)',
            specSummary: '10–20 kW modulation, automatic ignition, 1.4 m feed auger & controller',
        },
        pl: {
            name: 'Automatyczny zestaw palnika pelletowego Pelltech PV20a 20 kW z podajnikiem (alt. Megatherm)',
            specSummary: 'Modulacja 10–20 kW, automatyczna zapalarka, podajnik 1,4 m i sterownik',
        },
        ru: {
            name: 'Автоматический комплект пеллетной горелки Pelltech PV20a 20 кВт со шнеком (альт. Megatherm)',
            specSummary: 'Модуляция 10–20 кВт, авторозжиг, шнек 1,4 м и контроллер',
        },
    },
    '23013009600X0': {
        en: {
            name: 'Galvanized wood pellet hopper – 460 L',
            specSummary: '460 L (~300 kg pellets, 5–10 days autonomous operation)',
        },
        pl: {
            name: 'Zasobnik na pellet drzewny – bunkier 460 L',
            specSummary: '460 L (~300 kg pelletu, 5–10 dni pracy autonomicznej)',
        },
        ru: {
            name: 'Топливный бункер для древесных пеллет 460 л',
            specSummary: '460 л (~300 кг пеллет, 5–10 суток автономной работы)',
        },
    },
    '0270132': {
        en: {
            name: 'Watts KSG 30 boiler safety group 3 bar with pressure gauge & air vent',
            specSummary: '1" female thread, 3 bar safety relief valve, 0–4 bar pressure gauge',
        },
        pl: {
            name: 'Grupa bezpieczeństwa kotła Watts KSG 30 3 bar z manometrem i odpowietrznikiem',
            specSummary: 'Gwint wewnętrzny 1", zawór bezpieczeństwa 3 bar, manometr 0–4 bar',
        },
        ru: {
            name: 'Группа безопасности котла Watts KSG 30 3 бар с манометром и воздухоотводчиком',
            specSummary: 'Внутренняя резьба 1", предохранительный клапан 3 бар, манометр 0–4 бар',
        },
    },
    '1776603': {
        en: {
            name: 'HERZ Teplomix DN25 thermostatic return temperature protection valve 61 °C',
            specSummary: 'DN25, Kvs 11, maintains >= 55–61 °C return flow to the boiler',
        },
        pl: {
            name: 'Termostatyczny zawór ochrony powrotu HERZ Teplomix DN25 61 °C',
            specSummary: 'DN25, Kvs 11, utrzymuje temperaturę powrotu >= 55–61 °C do kotła',
        },
        ru: {
            name: 'Термостатический трехходовой смесительный клапан HERZ Teplomix DN25 61 °C',
            specSummary: 'DN25, Kvs 11, поддерживает температуру обратки >= 55–61 °C в котел',
        },
    },
    '4248084': {
        en: {
            name: 'Wilo Yonos PICO 1.0 25/1-6 electronic circulation pump',
            specSummary: 'G 1 1/2" (DN25), 180 mm port-to-port length, head up to 6 m',
        },
        pl: {
            name: 'Elektroniczna pompa obiegowa Wilo Yonos PICO 1.0 25/1-6',
            specSummary: 'G 1 1/2" (DN25), długość montażowa 180 mm, wysokość podnoszenia do 6 m',
        },
        ru: {
            name: 'Электронный циркуляционный насос Wilo Yonos PICO 1.0 25/1-6',
            specSummary: 'G 1 1/2" (DN25), монтажная длина 180 мм, напор до 6 м',
        },
    },
    '17526': {
        en: {
            name: 'Centrometal EKO-CK P 25 kW steel solid-fuel boiler (alt. Bio-Pek 29 kW)',
            specSummary: '25 kW, EN 303-5, large firebox for logs and briquettes, burner-ready',
        },
        pl: {
            name: 'Stalowy kocioł na paliwo stałe Centrometal EKO-CK P 25 kW (alt. Bio-Pek 29 kW)',
            specSummary: '25 kW, EN 303-5, duża komora na drewno i brykiet, przystosowany pod palnik',
        },
        ru: {
            name: 'Стальной твердотопливный котел Centrometal EKO-CK P 25 кВт (альт. Bio-Pek 29 кВт)',
            specSummary: '25 кВт, EN 303-5, большая топка для дров и брикетов, готов под горелку',
        },
    },
    '16716': {
        en: {
            name: 'Centrometal CAS 1001 thermal accumulation buffer tank (1000 L)',
            specSummary: '1000 L volume, removable polyurethane insulation, 8 connection ports',
        },
        pl: {
            name: 'Zbiornik akumulacyjny (bufor) Centrometal CAS 1001 (1000 L)',
            specSummary: 'Pojemność 1000 L, zdejmowana izolacja poliuretanowa, 8 króćców przyłączeniowych',
        },
        ru: {
            name: 'Буферная аккумулирующая емкость Centrometal CAS 1001 (1000 л)',
            specSummary: 'Объем 1000 л, съемная полиуретановая изоляция, 8 патрубков подключения',
        },
    },
    '7101006': {
        en: {
            name: 'IMI Pneumatex Statico SD 80.3 expansion vessel (80 L / 3 bar)',
            specSummary: '80 L, Airproof butyl bladder (EN 12828), pre-charge 1.5 bar, R3/4"',
        },
        pl: {
            name: 'Naczynie wzbiorcze IMI Pneumatex Statico SD 80.3 (80 L / 3 bar)',
            specSummary: '80 L, worek butylowy Airproof (EN 12828), ciśnienie wstępne 1,5 bar, R3/4"',
        },
        ru: {
            name: 'Расширительный бак IMI Pneumatex Statico SD 80.3 (80 л / 3 бар)',
            specSummary: '80 л, бутиловая мембрана Airproof (EN 12828), преднакачка 1,5 бар, R3/4"',
        },
    },
    '88.23.220': {
        en: {
            name: 'Comisa KIT COMPACT 300 flat-plate solar thermal kit with pump station & controller',
            specSummary: '2×2.0 m² BLUETEC collectors, solar pump station, controller, brackets, 20 L glycol',
        },
        pl: {
            name: 'Zestaw kolektorów słonecznych płaskich Comisa KIT COMPACT 300 z grupą pompową i sterownikiem',
            specSummary: '2×2,0 m² kolektory BLUETEC, grupa pompowa, sterownik, uchwyty, 20 L glikolu',
        },
        ru: {
            name: 'Комплект плоских солнечных коллекторов Comisa KIT COMPACT 300 с насосной станцией и автоматикой',
            specSummary: '2×2,0 м² коллекторы BLUETEC, насосная группа, контроллер, крепления, 20 л гликоля',
        },
    },
    'OKC300NTRR-S': {
        en: {
            name: 'Drazice OKC 300 NTRR/SOL twin-coil solar domestic hot water cylinder (300 L)',
            specSummary: '300 L, dual heat exchanger coils (35 + 24 kW), working pressure up to 10 bar',
        },
        pl: {
            name: 'Solarny podgrzewacz wody z dwiema wężownicami Drazice OKC 300 NTRR/SOL (300 L)',
            specSummary: '300 L, dwie wężownice (35 + 24 kW), ciśnienie robocze do 1 MPa (10 bar)',
        },
        ru: {
            name: 'Бойлер косвенного нагрева с двумя теплообменниками Drazice OKC 300 NTRR/SOL (300 л)',
            specSummary: '300 л, два змеевика (35 + 24 кВт), рабочее давление до 1 МПа (10 бар)',
        },
    },
    '7103003': {
        en: {
            name: 'IMI Pneumatex Statico SD 25.10 solar glycol expansion vessel (25 L / 10 bar)',
            specSummary: '25 L, 10 bar working pressure, butyl bladder resistant to 50% glycol',
        },
        pl: {
            name: 'Solarne naczynie wzbiorcze do glikolu IMI Pneumatex Statico SD 25.10 (25 L / 10 bar)',
            specSummary: '25 L, ciśnienie robocze 10 bar, membrana butylowa odporna na glikol do 50%',
        },
        ru: {
            name: 'Расширительный бак для гликоля IMI Pneumatex Statico SD 25.10 (25 л / 10 бар)',
            specSummary: '25 л, рабочее давление 10 бар, бутиловая камера для гликоля до 50%',
        },
    },
    DXTEMVEX2P15: {
        en: {
            name: 'IMI Heimeier set: DX thermostatic head + V-exact II thermostatic valve DN15',
            specSummary: 'DN15 straight valve with precision kv presetting + DX head 16–28 °C (8 pcs)',
        },
        pl: {
            name: 'Zestaw IMI Heimeier: głowica termostatyczna DX + zawór V-exact DN15',
            specSummary: 'Prosty zawór DN15 z nastawą wstępną kv + głowica DX 16–28 °C (8 szt.)',
        },
        ru: {
            name: 'Комплект IMI Heimeier: термоголовка DX + термоклапан V-exact DN15',
            specSummary: 'Прямой термоклапан DN15 с преднастройкой kv + головка DX 16–28 °C (8 шт.)',
        },
    },
    '6000-09.500': {
        en: {
            name: 'IMI Heimeier K-head M30×1.5 with liquid-filled sensor (6–28 °C)',
            specSummary: 'M30×1.5 thread, precision temperature scale 1–5 (2 pcs)',
        },
        pl: {
            name: 'Głowica termostatyczna IMI Heimeier K M30×1,5 z czujnikiem cieczowym (6–28 °C)',
            specSummary: 'Gwint M30×1,5, precyzyjna skala temperatury 1–5 (2 szt.)',
        },
        ru: {
            name: 'Термостатическая головка IMI Heimeier K M30×1,5 с жидкостным датчиком (6–28 °C)',
            specSummary: 'Резьба M30×1,5, точная шкала температуры 1–5 (2 шт.)',
        },
    },
    '52-151-220': {
        en: {
            name: 'IMI TA STAD DN20 hydronic balancing valve (Kvs 5.7)',
            specSummary: 'DN20 (G 3/4"), PN20, AMETAL alloy, with P/T test points and drain',
        },
        pl: {
            name: 'Ręczny zawór równoważący IMI TA STAD DN20 (Kvs 5,7)',
            specSummary: 'DN20 (G 3/4"), PN20, stop AMETAL, z króćcami pomiarowymi i spustem',
        },
        ru: {
            name: 'Балансировочный клапан регулирования расхода IMI TA STAD DN20 (Kvs 5,7)',
            specSummary: 'DN20 (G 3/4"), PN20, сплав AMETAL, с измерительными ниппелями и дренажем',
        },
    },
    '52-265-020': {
        en: {
            name: 'IMI TA STAP DN20 differential pressure controller (10–60 kPa)',
            specSummary: 'DN20 (G 3/4"), Kvs 3.1, with 1 m capillary tube and measuring nipple',
        },
        pl: {
            name: 'Regulator różnicy ciśnień IMI TA STAP DN20 (10–60 kPa)',
            specSummary: 'DN20 (G 3/4"), Kvs 3,1, z rurką kapilarną 1 m i króćcem pomiarowym',
        },
        ru: {
            name: 'Регулятор перепада давления IMI TA STAP DN20 (10–60 кПа)',
            specSummary: 'DN20 (G 3/4"), Kvs 3,1, с капиллярной трубкой 1 м и ниппелем измерения',
        },
    },
    '7891720': {
        en: {
            name: 'IMI Pneumatex Zeparo ZUVS 20 automatic microbubble air & sludge separator',
            specSummary: 'DN20, Helistill / cyclonic microbubble and magnetite separation, PN10, Tmax 110 °C',
        },
        pl: {
            name: 'Automatyczny separator powietrza i szlamu IMI Pneumatex Zeparo ZUVS 20',
            specSummary: 'DN20, separacja mikropęcherzyków i magnetytu, PN10, Tmax 110 °C',
        },
        ru: {
            name: 'Автоматический сепаратор воздуха и шлама IMI Pneumatex Zeparo ZUVS 20',
            specSummary: 'DN20, циклонная сепарация микропузырьков и магнетита, PN10, Tmax 110 °C',
        },
    },
    B1HC232: {
        en: {
            name: 'Viessmann Vitodens 100-W gas condensing boiler 6.5–26 kW with Ø60/100 flue (alt. Buderus Logamax GB172i)',
            specSummary: '6.5–26 kW, Inox-Radial stainless-steel heat exchanger, efficiency up to 98% (Hs)',
        },
        pl: {
            name: 'Gazowy kocioł kondensacyjny Viessmann Vitodens 100-W 6,5–26 kW z kominem Ø60/100 (alt. Buderus GB172i)',
            specSummary: '6,5–26 kW, wymiennik ze stali nierdzewnej Inox-Radial, sprawność do 98% (Hs)',
        },
        ru: {
            name: 'Газовый конденсационный котел Viessmann Vitodens 100-W 6,5–26 кВт с коаксиальным дымоходом Ø60/100',
            specSummary: '6,5–26 кВт, теплообменник Inox-Radial из нержавейки, КПД до 98% (Hs)',
        },
    },
    OKC200NTR: {
        en: {
            name: 'Drazice OKC 200 NTR vertical indirect DHW cylinder (200 L, 32 kW heat exchanger)',
            specSummary: '200 L, ceramic enamel with magnesium anode, 32 kW spiral coil',
        },
        pl: {
            name: 'Pionowy podgrzewacz wody CWU Drazice OKC 200 NTR (200 L, wężownica 32 kW)',
            specSummary: '200 L, emalia ceramiczna z anodą magnezową, spiralna wężownica 32 kW',
        },
        ru: {
            name: 'Вертикальный бойлер косвенного нагрева Drazice OKC 200 NTR (200 л, теплообменник 32 кВт)',
            specSummary: '200 л, керамическая эмаль с магниевым анодом, спиральный змеевик 32 кВт',
        },
    },
    '4248082': {
        en: {
            name: 'Wilo Yonos PICO 1.0 25/1-4 electronic circulation pump',
            specSummary: 'G 1 1/2" (DN25), 180 mm length, 4–20 W ECM motor',
        },
        pl: {
            name: 'Elektroniczna pompa obiegowa Wilo Yonos PICO 1.0 25/1-4',
            specSummary: 'G 1 1/2" (DN25), długość 180 mm, silnik ECM 4–20 W',
        },
        ru: {
            name: 'Электронный циркуляционный насос Wilo Yonos PICO 1.0 25/1-4',
            specSummary: 'G 1 1/2" (DN25), длина 180 мм, ЕСМ-двигатель 4–20 Вт',
        },
    },
    '7101003': {
        en: {
            name: 'IMI Pneumatex Statico SD 25.3 expansion vessel 25 L / 3 bar',
            specSummary: '25 L, disc-shaped wall-hung, Airproof butyl bladder, R3/4"',
        },
        pl: {
            name: 'Naczynie wzbiorcze IMI Pneumatex Statico SD 25.3 25 L / 3 bar',
            specSummary: '25 L, dyskowe wiszące, membrana butylowa Airproof, R3/4"',
        },
        ru: {
            name: 'Расширительный бак IMI Pneumatex Statico SD 25.3 25 л / 3 бар',
            specSummary: '25 л, дисковый навесной, бутиловая мембрана Airproof, R3/4"',
        },
    },
    '88.01.030': {
        en: {
            name: 'Comisa brass boiler & cylinder connection fitting set 1" × 3/4"',
            specSummary: 'CW617N forged brass, PN16 (4 pcs)',
        },
        pl: {
            name: 'Zestaw mosiężnych złączek przyłączeniowych kotła i bojlera Comisa 1" × 3/4"',
            specSummary: 'Mosiądz kuty CW617N, PN16 (4 szt.)',
        },
        ru: {
            name: 'Комплект латунных резьбовых переходников подключения котла и бойлера Comisa 1" × 3/4"',
            specSummary: 'Штампованная латунь CW617N, PN16 (4 шт.)',
        },
    },
    AW082HUGHA: {
        en: {
            name: 'Haier Super Aqua R290 air-to-water heat pump AW082HUGHA, 8 kW (alt. AW082HVGHA / AU082FYCRA(HW))',
            specSummary: '8 kW, natural R290 refrigerant, operation down to -25 °C, flow up to +75 °C',
        },
        pl: {
            name: 'Pompa ciepła powietrze–woda Haier Super Aqua R290 AW082HUGHA, 8 kW (alt. AW082HVGHA / AU082FYCRA)',
            specSummary: '8 kW, naturalny czynnik R290, praca do -25 °C, zasilanie do +75 °C',
        },
        ru: {
            name: 'Тепловой насос воздух–вода Haier Super Aqua R290 AW082HUGHA, 8 кВт (альт. AW082HVGHA / AU082FYCRA)',
            specSummary: '8 кВт, природный хладагент R290, работа до -25 °C, подача до +75 °C',
        },
    },
    'ZV 100': {
        en: {
            name: 'Gorenje / TIKI ZV 100 wall-hung buffer tank for heat pump systems (100 L)',
            specSummary: '102 L, PN10 (10 bar), G 1 1/4" connections, 33 mm PU insulation',
        },
        pl: {
            name: 'Wiszący zbiornik buforowy Gorenje / TIKI ZV 100 do pomp ciepła (100 L)',
            specSummary: '102 L, PN10 (10 bar), przyłącza G 1 1/4", izolacja PU 33 mm',
        },
        ru: {
            name: 'Навесная буферная емкость Gorenje / TIKI ZV 100 для систем с тепловыми насосами (100 л)',
            specSummary: '102 л, PN10 (10 бар), подключение G 1 1/4", ПУ-изоляция 33 мм',
        },
    },
    'HP200M7C-F9': {
        en: {
            name: 'Haier R290 domestic hot water heat pump cylinder HP200M7C-F9 (alt. HP250M7C-F9)',
            specSummary: 'Integrated R290 heat pump + auxiliary coil, Class A+ efficiency',
        },
        pl: {
            name: 'Pompa ciepła do CWU z zasobnikiem Haier R290 HP200M7C-F9 (alt. HP250M7C-F9)',
            specSummary: 'Zintegrowana pompa ciepła R290 + wężownica, klasa A+',
        },
        ru: {
            name: 'Бойлер с тепловым насосом R290 для ГВС Haier HP200M7C-F9 (альт. HP250M7C-F9)',
            specSummary: 'Встроенный тепловой насос R290 + змеевик, класс A+',
        },
    },
};

const SYSTEM_PACKAGES_I18N: Record<
    string,
    Record<
        Exclude<PackageSupportedLocale, 'lt'>,
        Pick<
            SystemPackageOffer,
            | 'numberLabel'
            | 'title'
            | 'subtitle'
            | 'powerOrScopeBadge'
            | 'targetApplication'
            | 'includedHighlights'
            | 'engineeringNotes'
        >
    >
> = {
    'pkg-pellet-25kw': {
        en: {
            numberLabel: 'Package No. 1',
            title: 'Complete Pellet Boiler Room Package (20–25 kW)',
            subtitle:
                'KaTRI 25 kW / Centrometal EKO-CK P 25 kW boiler + Pelltech PV20a / Megatherm 20 kW burner kit + 460 L hopper + safety & circulation group',
            powerOrScopeBadge: '20–25 kW · for 120–240 m² homes',
            targetApplication: 'Fully automated pellet boiler room for a single-family home or modernization of an existing solid-fuel plant',
            includedHighlights: [
                'KaTRI 25 kW (5–6 mm P265GH boiler steel), Centrometal EKO-CK P 25 kW, or Ponast KP08 (8 kW with 130 L hopper – 2,890 €) boiler',
                'Automatic pellet burner kit: "Nord komfortui" Pelltech PV20a 10–20 kW (2,350 €), "Link lyderių" Megatherm 10–35 kW (2,150 €), or "Vidutiniams" 25–50 kW',
                '460 L galvanized steel pellet hopper + HERZ Teplomix 61 °C + Watts KSG 30 + Wilo Yonos PICO 25/1-6',
            ],
            engineeringNotes:
                'Engineered to the Gilės Inžinerija pellet plant schematic: HERZ Teplomix 61 °C protects the boiler heat exchanger against return condensation while the Pelltech PV20a / Megatherm burner automatically ignites and modulates output.',
        },
        pl: {
            numberLabel: 'Pakiet nr 1',
            title: 'Kompletny pakiet kotłowni pelletowej (20–25 kW)',
            subtitle:
                'Kocioł KaTRI 25 kW / Centrometal EKO-CK P 25 kW + zestaw palnika Pelltech PV20a / Megatherm 20 kW + zasobnik 460 L + grupa bezpieczeństwa i obiegowa',
            powerOrScopeBadge: '20–25 kW · dla domu 120–240 m²',
            targetApplication: 'W pełni zautomatyzowana kotłownia pelletowa dla domu jednorodzinnego lub modernizacja istniejącej kotłowni',
            includedHighlights: [
                'Kocioł grzewczy KaTRI 25 kW (stal kotłowa P265GH 5–6 mm), Centrometal EKO-CK P 25 kW lub Ponast KP08 (8 kW z zasobnikiem 130 L – 2 890 €)',
                'Automatyczny zestaw palnika: „Nord komfortui” Pelltech PV20a 10–20 kW (2 350 €), „Link lyderių” Megatherm 10–35 kW (2 150 €) lub „Vidutiniams” 25–50 kW',
                'Ocynkowany zasobnik pelletu 460 L + HERZ Teplomix 61 °C + Watts KSG 30 + Wilo Yonos PICO 25/1-6',
            ],
            engineeringNotes:
                'Dobrano wg schematu kotłowni pelletowej Gilės Inžinerija: zawór HERZ Teplomix 61 °C chroni wymiennik kotła przed korozją niskotemperaturową, a palnik Pelltech PV20a / Megatherm automatycznie rozpala i moduluje moc.',
        },
        ru: {
            numberLabel: 'Пакет № 1',
            title: 'Полный пакет пеллетной котельной (20–25 кВт)',
            subtitle:
                'Котел KaTRI 25 кВт / Centrometal EKO-CK P 25 кВт + комплект горелки Pelltech PV20a / Megatherm 20 кВт + бункер 460 л + группа безопасности и циркуляции',
            powerOrScopeBadge: '20–25 кВт · для дома 120–240 м²',
            targetApplication: 'Полностью автоматизированная пеллетная котельная для частного дома или модернизация твердотопливной котельной',
            includedHighlights: [
                'Отопительный котел KaTRI 25 кВт (котельная сталь P265GH 5–6 мм), Centrometal EKO-CK P 25 кВт или Ponast KP08 (8 кВт с бункером 130 л – 2 890 €)',
                'Автоматический комплект горелки: «Nord komfortui» Pelltech PV20a 10–20 кВт (2 350 €), «Link lyderių» Megatherm 10–35 кВт (2 150 €) или «Vidutiniams» 25–50 кВт',
                'Оцинкованный бункер 460 л + HERZ Teplomix 61 °C + Watts KSG 30 + Wilo Yonos PICO 25/1-6',
            ],
            engineeringNotes:
                'Согласовано по схеме пеллетной котельной Gilės Inžinerija: клапан HERZ Teplomix 61 °C защищает теплообменник котла от конденсата, а горелка Pelltech PV20a / Megatherm автоматически разжигает пеллеты и модулирует мощность.',
        },
    },
    'pkg-solid-fuel-buffer': {
        en: {
            numberLabel: 'Package No. 2',
            title: 'Solid-Fuel Boiler Room Package with 1000 L Buffer Tank (25–35 kW)',
            subtitle:
                'Centrometal EKO-CK P / Bio-Pek boiler + Centrometal CAS 1001 buffer tank + thermostatic charging valve + IMI Pneumatex Statico + Wilo Yonos PICO',
            powerOrScopeBadge: '25–35 kW · 1000 L accumulation',
            targetApplication: 'Wood-log and briquette boiler plant with 1000 L thermal storage for even heating without overheating',
            includedHighlights: [
                'Centrometal EKO-CK P 25 kW (or EKO-CK P 35 kW / Bio-Pek) steel solid-fuel boiler',
                'Centrometal CAS 1001 (1000 L) thermal buffer tank with removable insulation',
                'HERZ Teplomix DN25 thermostatic charging valve + IMI Pneumatex Statico SD 80.3 + Wilo Yonos PICO 25/1-6',
            ],
            engineeringNotes:
                'Sized to EN 303-5 recommendations (40–50 L buffer volume per 1 kW boiler output): the 1000 L Centrometal CAS 1001 tank absorbs a full fuel load and allows the boiler to run at peak efficiency.',
        },
        pl: {
            numberLabel: 'Pakiet nr 2',
            title: 'Pakiet kotłowni na paliwo stałe z buforem ciepła 1000 L (25–35 kW)',
            subtitle:
                'Kocioł Centrometal EKO-CK P / Bio-Pek + zbiornik akumulacyjny Centrometal CAS 1001 + termostatyczny układ ładowania + IMI Pneumatex Statico + Wilo Yonos PICO',
            powerOrScopeBadge: '25–35 kW · akumulacja 1000 L',
            targetApplication: 'Kotłownia na drewno i brykiet z akumulacją ciepła 1000 L do równomiernego ogrzewania domu bez przegrzewania',
            includedHighlights: [
                'Stalowy kocioł Centrometal EKO-CK P 25 kW (lub EKO-CK P 35 kW / Bio-Pek)',
                'Zbiornik buforowy Centrometal CAS 1001 (1000 L) z izolacją termiczną',
                'Zawór ładowania bufora HERZ Teplomix DN25 + IMI Pneumatex Statico SD 80.3 + Wilo Yonos PICO 25/1-6',
            ],
            engineeringNotes:
                'Zgodnie z normą EN 303-5 (40–50 L pojemności bufora na 1 kW mocy kotła) zbiornik Centrometal CAS 1001 o pojemności 1000 L przejmuje całe ciepło załadunku i pozwala kotłowi pracować z maksymalną sprawnością.',
        },
        ru: {
            numberLabel: 'Пакет № 2',
            title: 'Пакет твердотопливной котельной с буферной емкостью 1000 л (25–35 кВт)',
            subtitle:
                'Котел Centrometal EKO-CK P / Bio-Pek + буферная емкость Centrometal CAS 1001 + термостатический узел загрузки + IMI Pneumatex Statico + Wilo Yonos PICO',
            powerOrScopeBadge: '25–35 кВт · аккумуляция 1000 л',
            targetApplication: 'Котельная на дровах и брикетах с теплоаккумулятором 1000 л для равномерного отопления без перегрева',
            includedHighlights: [
                'Стальной котел Centrometal EKO-CK P 25 кВт (или EKO-CK P 35 кВт / Bio-Pek)',
                'Буферная аккумулирующая емкость Centrometal CAS 1001 (1000 л) с теплоизоляцией',
                'Термостатический узел загрузки HERZ Teplomix DN25 + IMI Pneumatex Statico SD 80.3 + Wilo Yonos PICO 25/1-6',
            ],
            engineeringNotes:
                'По стандарту EN 303-5 (40–50 л буферного объема на 1 кВт мощности котла) емкость Centrometal CAS 1001 (1000 л) аккумулирует тепло полной закладки дров и обеспечивает работу котла с максимальным КПД.',
        },
    },
    'pkg-underfloor-comisa': {
        en: {
            numberLabel: 'Package No. 3',
            title: 'Complete Underfloor Heating Package by Area (Comisa 50 m² / 100 m² / 150 m² / 200 m²)',
            subtitle:
                'Comisa nickel-plated manifold with flowmeters (4–12 loops) + Comisa 230 V electrothermal actuators + Eurokonus 16×2.0 fittings + room thermostats',
            powerOrScopeBadge: '50–200 m² · 4–12 loops',
            targetApplication: 'Complete Comisa (Italy) and Watts underfloor heating distribution and multi-zone control assembly for your floor area',
            includedHighlights: [
                'Select heated area (50 m² / 100 m² / 150 m² / 200 m²) – component quantities recalculate automatically',
                'Comisa 1" nickel-plated manifold with 0–5 L/min flowmeters (4, 6, 9, or 12 loops) + 3/4" Eurokonus 16×2.0 fittings',
                'Comisa 230 V electrothermal actuators M30×1.5 for every loop + Watts WFHT-LCD digital room thermostats',
            ],
            engineeringNotes:
                'Each ~15–17 m² floor zone is served by an individual 70–85 m loop of PEX-AL-PEX 16×2.0 mm pipe so hydraulic pressure drop stays below 20 kPa.',
        },
        pl: {
            numberLabel: 'Pakiet nr 3',
            title: 'Kompletny pakiet ogrzewania podłogowego wg powierzchni (Comisa 50 m² / 100 m² / 150 m² / 200 m²)',
            subtitle:
                'Niklowany rozdzielacz Comisa z przepływomierzami (4–12 obiegów) + siłowniki Comisa 230 V + złączki Eurokonus 16×2.0 + termostaty pokojowe',
            powerOrScopeBadge: '50–200 m² · 4–12 obiegów',
            targetApplication: 'Kompletny węzeł rozdzielaczowy i sterowania strefowego ogrzewania podłogowego Comisa (Włochy) oraz Watts',
            includedHighlights: [
                'Wybierz powierzchnię (50 m² / 100 m² / 150 m² / 200 m²) – zestawienie przelicza się automatycznie',
                'Niklowany rozdzielacz Comisa 1" z rotametrami 0–5 l/min (4, 6, 9 lub 12 obiegów) + złączki 3/4" Eurokonus 16×2.0',
                'Siłowniki termoelektryczne Comisa 230 V M30×1,5 na każdy obieg + termostaty pokojowe Watts WFHT-LCD',
            ],
            engineeringNotes:
                'Na każde ~15–17 m² powierzchni podłogi przypada osobna pętla rury PEX-AL-PEX 16×2.0 mm o długości 70–85 m, aby opór hydrauliczny nie przekraczał 20 kPa.',
        },
        ru: {
            numberLabel: 'Пакет № 3',
            title: 'Полный пакет водяного теплого пола по площади (Comisa 50 м² / 100 м² / 150 м² / 200 м²)',
            subtitle:
                'Никелированный коллектор Comisa с расходомерами (4–12 контуров) + сервоприводы Comisa 230 В + фитинги Евроконус 16×2.0 + комнатные термостаты',
            powerOrScopeBadge: '50–200 м² · 4–12 контуров',
            targetApplication: 'Полный распределительный и зональный узел теплого пола Comisa (Италия) и Watts под выбранную площадь здания',
            includedHighlights: [
                'Выберите площадь (50 м² / 100 м² / 150 м² / 200 м²) – комплектация пересчитывается автоматически',
                'Никелированный коллектор Comisa 1" с расходомерами 0–5 л/мин (4, 6, 9 или 12 контуров) + Евроконусы 3/4" 16×2.0',
                'Термоэлектрические приводы Comisa 230 В M30×1,5 на каждый контур + комнатные термостаты Watts WFHT-LCD',
            ],
            engineeringNotes:
                'На каждые ~15–17 м² площади пола рассчитывается отдельный контур трубы PEX-AL-PEX 16×2.0 мм длиной 70–85 м, чтобы гидравлические потери не превышали 20 кПа.',
        },
    },
    'pkg-solar-dhw': {
        en: {
            numberLabel: 'Package No. 4',
            title: 'Solar Thermal Collector & Domestic Hot Water Package',
            subtitle:
                'Comisa KIT COMPACT 300 flat-plate solar collector system + Dražice OKC 300 NTRR/SOL twin-coil cylinder + Statico glycol expansion vessel',
            powerOrScopeBadge: 'For 4–6 persons · 300 L DHW',
            targetApplication: 'Domestic hot water preparation using solar energy from spring to autumn and the heating boiler in winter',
            includedHighlights: [
                'Comisa KIT COMPACT 300 (88.23.220): 2 BLUETEC selective flat-plate collectors, solar pump station, controller, and 20 L glycol',
                'Dražice OKC 300 NTRR/SOL (300 L) vertical dual-coil cylinder for solar and boiler circuits',
                'IMI Pneumatex Statico SD 25.10 (10 bar) solar expansion vessel rated for up to 50% glycol solutions',
            ],
            engineeringNotes:
                'The dual-coil configuration connects the lower heat exchanger to the Comisa solar pump station and the upper coil to your pellet, solid-fuel, or gas boiler.',
        },
        pl: {
            numberLabel: 'Pakiet nr 4',
            title: 'Pakiet kolektorów słonecznych i przygotowania CWU',
            subtitle:
                'System kolektorów płaskich Comisa KIT COMPACT 300 + biwalentny zasobnik Dražice OKC 300 NTRR/SOL + naczynie wzbiorcze do glikolu Statico',
            powerOrScopeBadge: 'Dla rodziny 4–6 os. · 300 L CWU',
            targetApplication: 'Przygotowanie ciepłej wody użytkowej energią słoneczną od wiosny do jesieni oraz z kotła grzewczego zimą',
            includedHighlights: [
                'Comisa KIT COMPACT 300 (88.23.220): 2 kolektory płaskie BLUETEC, grupa pompowa solarna, sterownik i 20 L glikolu',
                'Pionowy zasobnik z dwiema wężownicami Dražice OKC 300 NTRR/SOL (300 L) do obiegu solarnego i kotłowego',
                'Specjalne naczynie wzbiorcze IMI Pneumatex Statico SD 25.10 (10 bar) do roztworów glikolu do 50%',
            ],
            engineeringNotes:
                'Układ dwuwężownicowy pozwala podłączyć dolną wężownicę do grupy solarnej Comisa, a górną do kotła pelletowego, stałopaliwowego lub gazowego.',
        },
        ru: {
            numberLabel: 'Пакет № 4',
            title: 'Пакет солнечных коллекторов и подготовки горячей воды (ГВС)',
            subtitle:
                'Система плоских солнечных коллекторов Comisa KIT COMPACT 300 + бивалентный бойлер Dražice OKC 300 NTRR/SOL + гликолевый бак Statico',
            powerOrScopeBadge: 'Для семьи 4–6 чел. · 300 л ГВС',
            targetApplication: 'Нагрев бытовой горячей воды солнечной энергией с весны до осени и от отопительного котла зимой',
            includedHighlights: [
                'Comisa KIT COMPACT 300 (88.23.220): 2 плоских селективных коллектора BLUETEC, солнечная насосная станция, контроллер и 20 л гликоля',
                'Вертикальный бойлер Dražice OKC 300 NTRR/SOL (300 л) с двумя теплообменниками для солнечного и котельного контуров',
                'Специальный расширительный бак IMI Pneumatex Statico SD 25.10 (10 бар) для растворов гликоля до 50%',
            ],
            engineeringNotes:
                'Двухконтурная схема позволяет подключить нижний теплообменник к солнечной станции Comisa, а верхний – к пеллетному, твердотопливному или газовому котлу.',
        },
    },
    'pkg-renovation-balancing': {
        en: {
            numberLabel: 'Package No. 5',
            title: 'Heating System Renovation & Hydronic Balancing Package',
            subtitle:
                'IMI Heimeier thermostatic valves & K-heads + IMI TA STAD / STAP balancing and differential pressure valves + IMI Pneumatex Zeparo air & dirt separator',
            powerOrScopeBadge: 'Two-pipe / riser renovation',
            targetApplication: 'Hydronic balancing of radiator heating systems in apartment risers, schools, kindergartens, and private homes',
            includedHighlights: [
                '8 pcs IMI Heimeier DX + V-exact thermostatic sets DN15 + 2 pcs IMI Heimeier K-heads M30×1.5',
                'IMI TA STAD DN20 balancing valve + IMI TA STAP DN20 differential pressure controller (10–60 kPa)',
                'IMI Pneumatex Zeparo ZUVS 20 cyclonic microbubble air and magnetite sludge separator',
            ],
            engineeringNotes:
                'Matched to the Gilės Inžinerija renovation specification: the STAP + STAD pair stabilizes differential pressure across risers so radiators operate silently and heat evenly on every floor.',
        },
        pl: {
            numberLabel: 'Pakiet nr 5',
            title: 'Pakiet renowacji instalacji grzewczej i równoważenia hydraulicznego',
            subtitle:
                'Zawory termostatyczne i głowice K IMI Heimeier + zawory równoważące i podciśnieniowe IMI TA STAD / STAP + separator powietrza i szlamu Zeparo',
            powerOrScopeBadge: 'Renowacja dwururowa / pionów',
            targetApplication: 'Hydrauliczne zrównoważenie instalacji grzejnikowych w budynkach wielorodzinnych, szkołach, przedszkolach i domach',
            includedHighlights: [
                '8 szt. zestawów termostatycznych IMI Heimeier DX + V-exact DN15 + 2 szt. głowic IMI Heimeier K M30×1,5',
                'Zawór równoważący IMI TA STAD DN20 + regulator różnicy ciśnień IMI TA STAP DN20 (10–60 kPa)',
                'Cyklonowy separator mikropęcherzyków i szlamu magnetytowego IMI Pneumatex Zeparo ZUVS 20',
            ],
            engineeringNotes:
                'Zestawiony wg specyfikacji renowacyjnej Gilės Inžinerija: para STAP + STAD utrzymuje stałą różnicę ciśnień na pionach, dzięki czemu grzejniki nie szumią i grzeją równomiernie.',
        },
        ru: {
            numberLabel: 'Пакет № 5',
            title: 'Пакет реновации системы отопления и гидравлической балансировки',
            subtitle:
                'Термоклапаны и головки K IMI Heimeier + балансировочные клапаны и регуляторы перепада давления IMI TA STAD / STAP + сепаратор Zeparo',
            powerOrScopeBadge: 'Двухтрубная / стояковая реновация',
            targetApplication: 'Гидравлическая балансировка радиаторного отопления стояков многоквартирных домов, школ, детсадов и коттеджей',
            includedHighlights: [
                '8 шт. термостатических комплектов IMI Heimeier DX + V-exact DN15 + 2 шт. головок IMI Heimeier K M30×1,5',
                'Балансировочный клапан IMI TA STAD DN20 + регулятор перепада давления IMI TA STAP DN20 (10–60 кПа)',
                'Циклонный сепаратор воздуха и магнетитового шлама IMI Pneumatex Zeparo ZUVS 20',
            ],
            engineeringNotes:
                'Подобрано по спецификации реновации Gilės Inžinerija: пара STAP + STAD поддерживает постоянный перепад давления в стояках, устраняя шум и обеспечивая равномерный прогрев этажей.',
        },
    },
    'pkg-gas-condensing': {
        en: {
            numberLabel: 'Package No. 6',
            title: 'Gas Condensing Boiler Room & Domestic Hot Water Package',
            subtitle:
                'Viessmann Vitodens 100-W / Buderus Logamax plus gas condensing boiler + Dražice OKC 200 NTR cylinder + Wilo Yonos PICO pump + Comisa fitting kit',
            powerOrScopeBadge: '6.5–26 kW · 200 L DHW',
            targetApplication: 'Compact, high-efficiency gas condensing boiler plant with rapid 200 L domestic hot water preparation',
            includedHighlights: [
                'Viessmann Vitodens 100-W 6.5–26 kW (B1HC232) with Inox-Radial heat exchanger and Ø60/100 coaxial flue (alt. Buderus Logamax plus GB172i)',
                'Dražice OKC 200 NTR (200 L) cylinder with 1.45 m² (32 kW) coil for fast DHW recovery',
                'Wilo Yonos PICO 25/1-4 circulation pump + IMI Pneumatex Statico SD 25.3 + Comisa brass connection fittings',
            ],
            engineeringNotes:
                'The gas condensing boiler paired with the 32 kW Dražice OKC 200 NTR coil heats 200 L of hot water in ~22 minutes while maintaining low return temperatures for full flue gas condensation.',
        },
        pl: {
            numberLabel: 'Pakiet nr 6',
            title: 'Pakiet gazowej kotłowni kondensacyjnej i przygotowania CWU',
            subtitle:
                'Gazowy kocioł kondensacyjny Viessmann Vitodens 100-W / Buderus Logamax plus + zasobnik Dražice OKC 200 NTR + pompa Wilo Yonos PICO + złączki Comisa',
            powerOrScopeBadge: '6,5–26 kW · 200 L CWU',
            targetApplication: 'Kompaktowa, wysokosprawna gazowa kotłownia kondensacyjna z szybkim przygotowaniem 200 L ciepłej wody użytkowej',
            includedHighlights: [
                'Viessmann Vitodens 100-W 6,5–26 kW (B1HC232) z wymiennikiem Inox-Radial i kominem Ø60/100 (alt. Buderus Logamax plus GB172i)',
                'Zasobnik CWU Dražice OKC 200 NTR (200 L) z wężownicą 1,45 m² (32 kW) do szybkiego ładowania CWU',
                'Pompa obiegowa Wilo Yonos PICO 25/1-4 + naczynie wzbiorcze IMI Pneumatex Statico SD 25.3 + mosiężne złączki Comisa',
            ],
            engineeringNotes:
                'Gazowy kocioł kondensacyjny z wężownicą 32 kW zasobnika Dražice OKC 200 NTR podgrzewa 200 L wody w ~22 minuty przy zachowaniu niskiej temperatury powrotu dla pełnej kondensacji.',
        },
        ru: {
            numberLabel: 'Пакет № 6',
            title: 'Пакет газовой конденсационной котельной и горячего водоснабжения',
            subtitle:
                'Газовый конденсационный котел Viessmann Vitodens 100-W / Buderus Logamax plus + бойлер Dražice OKC 200 NTR + насос Wilo Yonos PICO + фитинги Comisa',
            powerOrScopeBadge: '6,5–26 кВт · 200 л ГВС',
            targetApplication: 'Компактная высокоэффективная газовая конденсационная котельная со скоростным нагревом 200 л горячей воды',
            includedHighlights: [
                'Viessmann Vitodens 100-W 6,5–26 кВт (B1HC232) с теплообменником Inox-Radial и дымоходом Ø60/100 (альт. Buderus Logamax plus GB172i)',
                'Бойлер Dražice OKC 200 NTR (200 л) с теплообменником 1,45 м² (32 кВт) для быстрого приготовления ГВС',
                'Циркуляционный насос Wilo Yonos PICO 25/1-4 + бак IMI Pneumatex Statico SD 25.3 + латунные фитинги Comisa',
            ],
            engineeringNotes:
                'Газовый конденсационный котел со змеевиком 32 кВт бойлера Dražice OKC 200 NTR нагревает 200 л горячей воды за ~22 мин., сохраняя низкую температуру обратки для конденсации.',
        },
    },
    'pkg-heat-pump-haier': {
        en: {
            numberLabel: 'Package No. 7',
            title: 'Haier Super Aqua R290 Air-to-Water Heat Pump & Gorenje ZV 100 Assembly Package (8–10 kW, A++)',
            subtitle:
                'Haier Super Aqua R290 / R32 heat pump (AW082HUGHA / AW082HVGHA / AU082FYCRA) + Gorenje / TIKI ZV 100 buffer tank + Haier R290 HP200M7C-F9 DHW cylinder + IMI Pneumatex Statico SD 25.3',
            powerOrScopeBadge: '8–10 kW · A++ homes 80–160 m²',
            targetApplication: 'A+ / A++ house heating, cooling, and DHW preparation with natural R290 refrigerant and Gorenje ZV 100 defrost buffer volume',
            includedHighlights: [
                'Haier Super Aqua R290 air-to-water heat pump AW082HUGHA 8 kW (3,430.00 €; alt. R290 GT AW082HVGHA 4,150.00 € or R32 AU082FYCRA(HW) 3,662.00 €)',
                'Gorenje / TIKI ZV 100 (100 L, 400.00 €; alt. ZV 50 / ZV 200) buffer tank for defrost cycles and ΔT = 5 K flow stability',
                'Haier R290 heat pump DHW cylinder HP200M7C-F9 (2,226.00 €; alt. Dražice OKC 200 NTR/HP) + IMI Pneumatex Statico SD 25.3 + Zeparo ZUVS 20',
            ],
            engineeringNotes:
                'Sized to heat pump hydraulic rules (10–15 L/kW buffer volume): the Gorenje TIKI ZV 100 tank guarantees sufficient thermal mass for defrost cycles and prevents compressor short-cycling when underfloor actuators close.',
        },
        pl: {
            numberLabel: 'Pakiet nr 7',
            title: 'Pakiet pompy ciepła powietrze–woda Haier Super Aqua R290 i bufora Gorenje ZV 100 (8–10 kW, A++)',
            subtitle:
                'Pompa ciepła Haier Super Aqua R290 / R32 (AW082HUGHA / AW082HVGHA / AU082FYCRA) + bufor Gorenje / TIKI ZV 100 + zasobnik CWU Haier R290 HP200M7C-F9 + Statico SD 25.3',
            powerOrScopeBadge: '8–10 kW · dom A++ 80–160 m²',
            targetApplication: 'Ogrzewanie, chłodzenie i przygotowanie CWU w domu klasy A+ / A++ z naturalnym czynnikiem R290 oraz buforem odszraniania Gorenje ZV 100',
            includedHighlights: [
                'Pompa ciepła powietrze–woda Haier Super Aqua R290 AW082HUGHA 8 kW (3 430,00 €; alt. AW082HVGHA lub AU082FYCRA)',
                'Zbiornik buforowy Gorenje / TIKI ZV 100 (100 L, 400,00 €) dla cykli defrost i przepływu ΔT = 5 K',
                'Zasobnik CWU z pompą ciepła Haier R290 HP200M7C-F9 (2 226,00 €) + IMI Pneumatex Statico SD 25.3 + Zeparo ZUVS 20',
            ],
            engineeringNotes:
                'Zgodnie z wymogami hydraulicznymi pomp ciepła (10–15 L/kW zładu buforowego) zbiornik Gorenje TIKI ZV 100 zapewnia odpowiedni zład do odszraniania (defrost) i chroni sprężarkę przed taktowaniem.',
        },
        ru: {
            numberLabel: 'Пакет № 7',
            title: 'Пакет теплового насоса воздух–вода Haier Super Aqua R290 и узла Gorenje ZV 100 (8–10 кВт, A++)',
            subtitle:
                'Тепловой насос Haier Super Aqua R290 / R32 (AW082HUGHA / AW082HVGHA / AU082FYCRA) + буфер Gorenje / TIKI ZV 100 + бойлер Haier R290 HP200M7C-F9 + Statico SD 25.3',
            powerOrScopeBadge: '8–10 кВт · для дома A++ 80–160 м²',
            targetApplication: 'Отопление, охлаждение и ГВС дома класса A+ / A++ на природном хладагенте R290 с буфером оттайки Gorenje ZV 100',
            includedHighlights: [
                'Тепловой насос воздух–вода Haier Super Aqua R290 AW082HUGHA 8 кВт (3 430,00 €; альт. AW082HVGHA или AU082FYCRA)',
                'Буферная емкость Gorenje / TIKI ZV 100 (100 л, 400,00 €) для циклов оттайки (defrost) и потока ΔT = 5 K',
                'Бойлер с тепловым насосом Haier R290 HP200M7C-F9 (2 226,00 €) + IMI Pneumatex Statico SD 25.3 + Zeparo ZUVS 20',
            ],
            engineeringNotes:
                'По гидравлическим требованиям тепловых насосов (10–15 л/кВт буферного объема) бак Gorenje TIKI ZV 100 обеспечивает запас теплоносителя для оттайки (defrost) и защищает компрессор от тактования.',
        },
    },
};

function localizeComponentsList(
    items: PackageComponentItem[],
    loc: PackageSupportedLocale,
): PackageComponentItem[] {
    if (loc === 'lt') return items;
    return items.map((item) => {
        const tr = COMPONENT_COPY_I18N[item.sku]?.[loc];
        if (!tr) return item;
        return {
            ...item,
            name: tr.name,
            specSummary: tr.specSummary,
        };
    });
}

export function getLocalizedUnderfloorPresets(
    locale?: string | null,
): UnderfloorAreaPreset[] {
    const loc = resolvePkgLocale(locale);
    if (loc === 'lt') return UNDERFLOOR_AREA_PRESETS;
    return UNDERFLOOR_AREA_PRESETS.map((preset) => ({
        ...preset,
        label:
            loc === 'en'
                ? `${preset.areaM2} m² (${preset.loopsCount} loops)`
                : loc === 'pl'
                  ? `${preset.areaM2} m² (${preset.loopsCount} obiegów)`
                  : `${preset.areaM2} м² (${preset.loopsCount} контуров)`,
        cabinetLabel:
            loc === 'en'
                ? `Surface / recessed cabinet for ${preset.loopsCount} loops + ${preset.pipeLengthM} m Comisa PEX-AL-PEX 16×2.0`
                : loc === 'pl'
                  ? `Szafka natynkowa / podtynkowa na ${preset.loopsCount} obiegów + ${preset.pipeLengthM} m Comisa PEX-AL-PEX 16×2.0`
                  : `Накладной / встраиваемый шкаф на ${preset.loopsCount} контуров + ${preset.pipeLengthM} м Comisa PEX-AL-PEX 16×2.0`,
        components: localizeComponentsList(preset.components, loc),
    }));
}

export function getLocalizedSystemPackages(
    locale?: string | null,
): SystemPackageOffer[] {
    const loc = resolvePkgLocale(locale);
    if (loc === 'lt') return GILES_SYSTEM_PACKAGES;
    const localizedPresets = getLocalizedUnderfloorPresets(loc);
    return GILES_SYSTEM_PACKAGES.map((pkg) => {
        const tr = SYSTEM_PACKAGES_I18N[pkg.id]?.[loc];
        const localizedComponents = localizeComponentsList(pkg.components, loc);
        return {
            ...pkg,
            ...(tr || {}),
            components: localizedComponents,
            underfloorPresets: pkg.underfloorPresets ? localizedPresets : undefined,
        };
    });
}



