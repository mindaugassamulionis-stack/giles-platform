import { resolveProductImageUrl } from './product-visuals';

export interface ProductVisualInput {
    sku?: string | null;
    title?: string | null;
    name?: string | null;
    nameLt?: string | null;
    brand?: string | null;
    brandName?: string | null;
    category?: string | null;
    categoryName?: string | null;
    imageUrl?: string | null;
    seriesImageUrl?: string | null;
}

export interface ProductSeriesVisualRule {
    seriesId: string;
    seriesLabel: string;
    seriesBadge: string;
    technicalCallout: string;
    studioImage: string;
    projectReferenceImage?: string;
    matches: (ctx: {
        skuLower: string;
        titleLower: string;
        brandLower: string;
        categoryLower: string;
        combined: string;
    }) => boolean;
}

export interface ResolvedProductSeriesVisual {
    seriesId: string;
    seriesLabel: string;
    image: string;
    seriesBadge: string;
    technicalCallout: string;
    projectReferenceImage?: string;
}

export const STUDIO_PROJECT_GALLERY_ASSETS: ReadonlyArray<{
    id: string;
    publicPath: string;
    category: string;
    powerKw: string;
}> = [
    { id: 'darbas-01', publicPath: '/studio-assets/projects/giles-darbas-01.webp', category: 'boiler_retrofits', powerKw: '25–35 kW' },
    { id: 'darbas-02', publicPath: '/studio-assets/projects/giles-darbas-02.webp', category: 'boiler_retrofits', powerKw: '30 kW' },
    { id: 'darbas-03', publicPath: '/studio-assets/projects/giles-darbas-03.webp', category: 'boiler_retrofits', powerKw: '24 kW' },
    { id: 'darbas-04', publicPath: '/studio-assets/projects/giles-darbas-04.webp', category: 'boiler_retrofits', powerKw: '32 kW' },
    { id: 'darbas-05', publicPath: '/studio-assets/projects/giles-darbas-05.webp', category: 'boiler_retrofits', powerKw: '25 kW' },
    { id: 'darbas-06', publicPath: '/studio-assets/projects/giles-darbas-06.webp', category: 'industrial_containers', powerKw: '500 kW' },
    { id: 'darbas-07', publicPath: '/studio-assets/projects/giles-darbas-07.webp', category: 'industrial_containers', powerKw: '750 kW' },
    { id: 'darbas-08', publicPath: '/studio-assets/projects/giles-darbas-08.webp', category: 'industrial_containers', powerKw: '2 000 kW' },
    { id: 'darbas-09', publicPath: '/studio-assets/projects/giles-darbas-09.webp', category: 'industrial_containers', powerKw: '150–500 kW' },
    { id: 'darbas-10', publicPath: '/studio-assets/projects/giles-darbas-10.webp', category: 'industrial_containers', powerKw: '500 kW' },
    { id: 'darbas-11', publicPath: '/studio-assets/projects/giles-darbas-11.webp', category: 'heat_pumps_boiler_rooms', powerKw: '200 kW' },
    { id: 'darbas-12', publicPath: '/studio-assets/projects/giles-darbas-12.webp', category: 'service_automation', powerKw: '25 kW' },
    { id: 'darbas-13', publicPath: '/studio-assets/projects/giles-darbas-13.webp', category: 'industrial_containers', powerKw: '250 kW' },
    { id: 'darbas-14', publicPath: '/studio-assets/projects/giles-darbas-14.webp', category: 'industrial_containers', powerKw: '500 kW' },
    { id: 'darbas-15', publicPath: '/studio-assets/projects/giles-darbas-15.webp', category: 'heat_pumps_boiler_rooms', powerKw: '120 kW' },
    { id: 'darbas-16', publicPath: '/studio-assets/projects/giles-darbas-16.webp', category: 'service_automation', powerKw: '80–190 kW' },
];

export const PRODUCT_VISUAL_SERIES_RULES: ReadonlyArray<ProductSeriesVisualRule> = [
    // 1. Danfoss ABN-A5 / TWA actuator
    {
        seriesId: 'danfoss-abn-twa-actuator',
        seriesLabel: 'Danfoss ABN-A5 / TWA actuator',
        seriesBadge: 'Danfoss ABN-A5 / TWA · Termopavara',
        technicalCallout: '24V / 230V NC/NO · M30×1,5 arba RA jungtis · IP41/IP54 su eigos indikatoriumi',
        studioImage: '/images/products/danfoss-088h0017.webp',
        projectReferenceImage: '/studio-assets/projects/giles-darbas-12.webp',
        matches: ({ brandLower, skuLower, titleLower }) =>
            brandLower.includes('danfoss') &&
            (skuLower.startsWith('088h') ||
                skuLower.startsWith('082') ||
                titleLower.includes('abn') ||
                titleLower.includes('twa') ||
                titleLower.includes('amv') ||
                titleLower.includes('ame') ||
                titleLower.includes('pavara') ||
                titleLower.includes('termoajam')),
    },
    // 2. Danfoss AB-QM PICV valve
    {
        seriesId: 'danfoss-ab-qm-picv-valve',
        seriesLabel: 'Danfoss AB-QM PICV valve',
        seriesBadge: 'Danfoss AB-QM / ASV · Balansinis PICV',
        technicalCallout: 'Slėgio nepriklausomas srauto reguliavimas · DN10–DN250 · PN16/PN25',
        studioImage: '/images/products/danfoss-003z1215.webp',
        projectReferenceImage: '/studio-assets/projects/giles-darbas-11.webp',
        matches: ({ brandLower, skuLower, titleLower, categoryLower }) =>
            brandLower.includes('danfoss') &&
            (skuLower.startsWith('003z') ||
                skuLower.startsWith('003l') ||
                titleLower.includes('ab-qm') ||
                titleLower.includes('asv-') ||
                titleLower.includes('usv-') ||
                titleLower.includes('msv-') ||
                titleLower.includes('picv') ||
                categoryLower.includes('balansiniai')),
    },
    // 3. Danfoss Icon / room thermostat
    {
        seriesId: 'danfoss-icon-room-thermostat',
        seriesLabel: 'Danfoss Icon / room thermostat',
        seriesBadge: 'Danfoss Icon / Link · Zonų valdymas',
        technicalCallout: '24V / 230V ir Zigbee belaidė komunikacija · PWM grindinio šildymo reguliavimas',
        studioImage: '/images/products/088u0240.webp',
        projectReferenceImage: '/studio-assets/projects/giles-darbas-12.webp',
        matches: ({ brandLower, skuLower, titleLower, categoryLower }) =>
            brandLower.includes('danfoss') &&
            (skuLower.startsWith('088u') ||
                skuLower.startsWith('088l') ||
                skuLower.startsWith('014g') ||
                skuLower.startsWith('087n') ||
                titleLower.includes('icon') ||
                titleLower.includes('devireg') ||
                titleLower.includes('termostatas') ||
                titleLower.includes('valdiklis') ||
                categoryLower.includes('katilinės automatika')),
    },
    // 4. Danfoss Aero/Redia thermostatic head
    {
        seriesId: 'danfoss-aero-redia-thermostatic-head',
        seriesLabel: 'Danfoss Aero/Redia thermostatic head',
        seriesBadge: 'Danfoss Aero / Redia · RA Click galvutė',
        technicalCallout: 'Dujinis arba skystinis jutiklis · Reakcijos laikas 10–18 min · EN 215',
        studioImage: '/images/products/013g2970.webp',
        matches: ({ brandLower, skuLower, titleLower }) =>
            brandLower.includes('danfoss') &&
            (titleLower.includes('galvut') ||
                titleLower.includes('aero') ||
                titleLower.includes('redia') ||
                titleLower.includes('ras-c') ||
                titleLower.includes('raw ') ||
                titleLower.includes('daviklis') ||
                skuLower.startsWith('013g2') ||
                skuLower.startsWith('013g5') ||
                skuLower.startsWith('013g6')),
    },
    // 5. Danfoss RA-N radiator valve
    {
        seriesId: 'danfoss-ra-n-radiator-valve',
        seriesLabel: 'Danfoss RA-N radiator valve',
        seriesBadge: 'Danfoss RA-N / RLV-K · Radiatoriaus armatūra',
        technicalCallout: 'Išankstinio srauto nustatymo vožtuvas DN10–DN25 · PN10 · Žalvaris MS58',
        studioImage: '/images/products/013g3368.webp',
        matches: ({ brandLower, skuLower, titleLower }) =>
            brandLower.includes('danfoss') ||
            skuLower.startsWith('013g') ||
            titleLower.includes('ra-n') ||
            titleLower.includes('rlv-k') ||
            titleLower.includes('rlv-s') ||
            titleLower.includes('vhx'),
    },
    // 6. IMI Heimeier Vekolux H-block
    {
        seriesId: 'imi-heimeier-vekolux-h-block',
        seriesLabel: 'IMI Heimeier Vekolux H-block',
        seriesBadge: 'IMI Heimeier Vekolux / Multilux · H-blokas 50 mm',
        technicalCallout: 'Apatinio pajungimo dviejų vamzdžių mazgas · 50 mm tarpas · G3/4" Eurokonusas',
        studioImage: '/images/products/0382-02.000.webp',
        matches: ({ brandLower, skuLower, titleLower }) =>
            brandLower.includes('heimeier') &&
            (skuLower.startsWith('038') ||
                skuLower.startsWith('05') ||
                titleLower.includes('vekolux') ||
                titleLower.includes('multilux') ||
                titleLower.includes('vekotec') ||
                titleLower.includes('raditec') ||
                titleLower.includes('regulux') ||
                titleLower.includes('regutec') ||
                titleLower.includes('h-blok')),
    },
    // 7. IMI Heimeier Emo T / K head
    {
        seriesId: 'imi-heimeier-emo-t-k-head',
        seriesLabel: 'IMI Heimeier Emo T / K head',
        seriesBadge: 'IMI Heimeier K-galvutė / EMO T · M30×1,5',
        technicalCallout: 'Skystinis termostatas arba EMO T pavara · M30×1,5 sriegis · Vokiška KEYMARK kokybė',
        studioImage: '/images/products/family-actuator.webp',
        matches: ({ brandLower, skuLower, titleLower }) =>
            brandLower.includes('heimeier') &&
            (skuLower.startsWith('18') ||
                skuLower.startsWith('6000') ||
                skuLower.startsWith('28') ||
                titleLower.includes('emo ') ||
                titleLower.includes('galvut') ||
                titleLower.includes('halo') ||
                titleLower.includes('pavara') ||
                titleLower.includes('termostat')),
    },
    // 8. IMI Heimeier Eclipse / V-exact valve
    {
        seriesId: 'imi-heimeier-eclipse-v-exact-valve',
        seriesLabel: 'IMI Heimeier Eclipse / V-exact valve',
        seriesBadge: 'IMI Heimeier Eclipse / V-exact II · Vožtuvas',
        technicalCallout: 'Automatinis srauto ribotuvas 10–150 l/h · Korozijai atsparus bronzos korpusas',
        studioImage: '/images/products/3933-02.000.webp',
        matches: ({ brandLower, skuLower, titleLower }) =>
            brandLower.includes('heimeier') ||
            skuLower.startsWith('393') ||
            skuLower.startsWith('371') ||
            titleLower.includes('eclipse') ||
            titleLower.includes('v-exact') ||
            titleLower.includes('calypso'),
    },
    // 9. IMI TA STAD / STAF balancing valve
    {
        seriesId: 'imi-ta-stad-staf-balancing-valve',
        seriesLabel: 'IMI TA STAD / STAF balancing valve',
        seriesBadge: 'IMI TA STAD / STAF · Hidraulinis balansavimas',
        technicalCallout: 'AMETAL® lydinys atsparus cinko išplovimui · Diagnostikos matavimo nipeliai · PN16/PN20',
        studioImage: '/images/products/52-151-014.webp',
        projectReferenceImage: '/studio-assets/projects/giles-darbas-11.webp',
        matches: ({ brandLower, skuLower, titleLower, categoryLower }) =>
            brandLower.includes('imi ta') ||
            skuLower.startsWith('52-') ||
            titleLower.includes('stad') ||
            titleLower.includes('staf') ||
            titleLower.includes('tbv') ||
            titleLower.includes('ta-modulator') ||
            categoryLower.includes('balansiniai'),
    },
    // 10. IMI Pneumatex Zeparo dirt/air separator
    {
        seriesId: 'imi-pneumatex-zeparo-separator',
        seriesLabel: 'IMI Pneumatex Zeparo dirt/air separator',
        seriesBadge: 'IMI Pneumatex Zeparo / Vento · Nuorintuvas-atskyriklis',
        technicalCallout: 'HEist cikloninis ir magnetinis šlamo bei mikroburbuliukų atskyrimas · PN10',
        studioImage: '/images/products/7895122.webp',
        projectReferenceImage: '/studio-assets/projects/giles-darbas-11.webp',
        matches: ({ brandLower, skuLower, titleLower, categoryLower }) =>
            categoryLower.includes('oro atskyrikliai') ||
            (brandLower.includes('pneumatex') &&
                (skuLower.startsWith('78') ||
                    titleLower.includes('zeparo') ||
                    titleLower.includes('vento') ||
                    titleLower.includes('nuorint') ||
                    titleLower.includes('purvo') ||
                    titleLower.includes('atskyr'))),
    },
    // 11. IMI Pneumatex Transfero pressurization
    {
        seriesId: 'imi-pneumatex-transfero-pressurization',
        seriesLabel: 'IMI Pneumatex Transfero pressurization',
        seriesBadge: 'IMI Pneumatex Transfero / Compresso · Slėgio stotelė',
        technicalCallout: 'BrainCube Connect išmanus slėgio palaikymas ir degazavimas katilinėms iki 10 MW',
        studioImage: '/images/products/8101411.webp',
        projectReferenceImage: '/studio-assets/projects/giles-darbas-11.webp',
        matches: ({ brandLower, skuLower, titleLower }) =>
            brandLower.includes('pneumatex') &&
            (skuLower.startsWith('810') ||
                skuLower.startsWith('77') ||
                titleLower.includes('transfero') ||
                titleLower.includes('compresso') ||
                titleLower.includes('pleno') ||
                titleLower.includes('simply') ||
                titleLower.includes('braincube') ||
                titleLower.includes('stotelė')),
    },
    // 12. IMI Pneumatex Statico / Aquapresso expansion vessel
    {
        seriesId: 'imi-pneumatex-statico-aquapresso-vessel',
        seriesLabel: 'IMI Pneumatex Statico / Aquapresso expansion vessel',
        seriesBadge: 'IMI Pneumatex Statico / Aquapresso · Plėtimosi indas',
        technicalCallout: 'AirProof butilo pūslė su minimaliu dujų difuzijos koeficientu · Šveicariška technologija',
        studioImage: '/images/products/7101003.webp',
        matches: ({ brandLower, skuLower, titleLower, categoryLower }) =>
            brandLower.includes('pneumatex') ||
            brandLower.includes('zilmet') ||
            skuLower.startsWith('710') ||
            skuLower.startsWith('711') ||
            titleLower.includes('statico') ||
            titleLower.includes('aquapresso') ||
            categoryLower.includes('plėtimosi indai'),
    },
    // 13. HERZ Teplomix 3-way anticondensation valve
    {
        seriesId: 'herz-teplomix-3way-valve',
        seriesLabel: 'HERZ Teplomix 3-way anticondensation valve',
        seriesBadge: 'HERZ Teplomix 1 7766 · Grįžtamo srauto apsauga',
        technicalCallout: 'Fiksuota 61 °C termostatinė kasetė katilo apsaugai nuo žematemperatūrės korozijos',
        studioImage: '/images/products/giles-termomaisytuvas-katilui-a3159b78.webp',
        projectReferenceImage: '/studio-assets/projects/giles-darbas-05.webp',
        matches: ({ brandLower, titleLower, skuLower }) =>
            (brandLower.includes('herz') &&
                (titleLower.includes('teplomix') ||
                    titleLower.includes('pamaišymo') ||
                    titleLower.includes('trieig') ||
                    titleLower.includes('calis') ||
                    skuLower.includes('7766'))) ||
            titleLower.includes('teplomix') ||
            titleLower.includes('termomaišytuv'),
    },
    // 14. HERZ TS-90 / RL-5 valve
    {
        seriesId: 'herz-ts-90-rl-5-valve',
        seriesLabel: 'HERZ TS-90 / RL-5 valve',
        seriesBadge: 'HERZ TS-90 / De Luxe · Austriška armatūra',
        technicalCallout: 'M28×1,5 termostatinė charakteristika · PN10 / 110 °C · Vienetinė hidraulinė patikra',
        studioImage: '/images/products/giles-1213704-091350da.webp',
        matches: ({ brandLower }) => brandLower.includes('herz'),
    },
    // 15. Haier HP80..250 Heat Pump Boiler
    {
        seriesId: 'haier-hp80-250-heat-pump-boiler',
        seriesLabel: 'Haier HP80..250 Heat Pump Boiler',
        seriesBadge: 'Haier HP80–250M · Šilumos siurblys-boileris A+',
        technicalCallout: 'COP iki 3,52 · Mikrokanalinis kondensatorius · R134a / R290 · 80–250 L emaliuotas bakas',
        studioImage: '/images/products/haier-2026-hp200m7c-f9.webp',
        matches: ({ brandLower, skuLower, titleLower }) =>
            brandLower.includes('haier') &&
            (skuLower.startsWith('hp80') ||
                skuLower.startsWith('hp110') ||
                skuLower.startsWith('hp150') ||
                skuLower.startsWith('hp200') ||
                skuLower.startsWith('hp250') ||
                titleLower.includes('hp80') ||
                titleLower.includes('hp110') ||
                titleLower.includes('hp150') ||
                titleLower.includes('hp200') ||
                titleLower.includes('hp250') ||
                (titleLower.includes('šilumos siurbl') && titleLower.includes('boiler'))),
    },
    // 16. Haier ES10V..100V Electric Boiler
    {
        seriesId: 'haier-es10v-100v-electric-boiler',
        seriesLabel: 'Haier ES10V..100V Electric Boiler',
        seriesBadge: 'Haier ES10V–100V · Elektrinis vandens šildytuvas',
        technicalCallout: 'Incoloy 800 nerūdijančio plieno tenas · ShockProof apsauga · Trijų sluoksnių titano emalė',
        studioImage: '/images/products/haier-2026-es80v-tf7w-eu.webp',
        matches: ({ brandLower, skuLower, titleLower, categoryLower }) =>
            brandLower.includes('haier') &&
            (skuLower.startsWith('es10') ||
                skuLower.startsWith('es15') ||
                skuLower.startsWith('es30') ||
                skuLower.startsWith('es50') ||
                skuLower.startsWith('es80') ||
                skuLower.startsWith('es100') ||
                titleLower.includes('elektrinis vandens šildytuvas') ||
                categoryLower.includes('boileriai')),
    },
    // 17. Haier Hydro Split / All-in-One
    {
        seriesId: 'haier-hydro-split-all-in-one',
        seriesLabel: 'Haier Hydro Split / All-in-One',
        seriesBadge: 'Haier Super Aqua Split / All-in-One · Oras–vanduo',
        technicalCallout: 'Split hidromodulis HU062/HU102/HU162 su integruotu 200 L nerūdijančio plieno boileriu',
        studioImage: '/images/products/haier-2026-hu102f20ahya.webp',
        projectReferenceImage: '/studio-assets/projects/giles-darbas-11.webp',
        matches: ({ brandLower, skuLower, titleLower }) =>
            brandLower.includes('haier') &&
            (skuLower.startsWith('hu0') ||
                skuLower.startsWith('hu1') ||
                skuLower.includes('wamna') ||
                skuLower.includes('wahyb') ||
                skuLower.includes('ahya') ||
                titleLower.includes('all-in-one') ||
                titleLower.includes('hidromodul') ||
                titleLower.includes('hydrobox')),
    },
    // 18. Haier Super Aqua Monoblokas R290/R32
    {
        seriesId: 'haier-super-aqua-monoblokas',
        seriesLabel: 'Haier Super Aqua Monoblokas R290/R32',
        seriesBadge: 'Haier Super Aqua R290 / R32 · Monoblokas A+++',
        technicalCallout: '4–40 kW inverterinis kompresorius · Darbas iki -25 °C · Padavimas iki +75 °C (APVA)',
        studioImage: '/studio-assets/products/giles-studio-21-haier-super-aqua-r290.webp',
        projectReferenceImage: '/studio-assets/projects/giles-darbas-11.webp',
        matches: ({ brandLower, skuLower, titleLower }) =>
            (brandLower.includes('haier') &&
                (skuLower.startsWith('aw0') ||
                    skuLower.startsWith('aw1') ||
                    skuLower.startsWith('aw2') ||
                    skuLower.startsWith('aw3') ||
                    skuLower.startsWith('aw4') ||
                    skuLower.startsWith('au0') ||
                    skuLower.startsWith('au1') ||
                    skuLower.startsWith('atw') ||
                    titleLower.includes('super aqua') ||
                    titleLower.includes('monoblok') ||
                    titleLower.includes('oras-vanduo') ||
                    titleLower.includes('oras–vanduo'))) ||
            titleLower.includes('master plus') ||
            titleLower.includes('master r32'),
    },
    // 19. Haier Nordic Split AC
    {
        seriesId: 'haier-nordic-split-ac',
        seriesLabel: 'Haier Nordic Split AC',
        seriesBadge: 'Haier Nordic / Jade / Pearl · Oras–oras A+++',
        technicalCallout: 'Šildymas iki -25 °C / -30 °C · UVC Pro sterilizacija · Self-Clean ir hOn Wi-Fi',
        studioImage: '/images/products/haier-2026-split-jade-expert-001.webp',
        matches: ({ brandLower }) => brandLower.includes('haier'),
    },
    // 20. Gorenje Tiki ZV Buffer Tank
    {
        seriesId: 'gorenje-tiki-zv-buffer-tank',
        seriesLabel: 'Gorenje Tiki ZV Buffer Tank',
        seriesBadge: 'Gorenje ZV / Centrometal CAS · Akumuliacinė talpa',
        technicalCallout: '25–2000 L hidraulinio balansavimo ir šilumos akumuliavimo talpa šilumos siurbliams ir katilams',
        studioImage: '/studio-assets/products/giles-studio-27-centrometal-cas-1001-buffer.webp',
        projectReferenceImage: '/studio-assets/projects/giles-darbas-15.webp',
        matches: ({ brandLower, skuLower, titleLower }) =>
            skuLower.startsWith('zv') ||
            titleLower.includes('zv ') ||
            titleLower.includes('zv-') ||
            titleLower.includes('cas ') ||
            titleLower.includes('cas-') ||
            titleLower.includes('akumuliacinė talpa') ||
            titleLower.includes('akumuliacine talpa') ||
            (brandLower.includes('gorenje') && titleLower.includes('akumuliac')),
    },
    // 21. Gorenje / Dražice Electric & Indirect Boiler
    {
        seriesId: 'gorenje-drazice-electric-indirect-boiler',
        seriesLabel: 'Gorenje / Dražice Electric & Indirect Boiler',
        seriesBadge: 'Dražice OKC / Gorenje GBK · Kombinuotas boileris',
        technicalCallout: 'Keraminis „sausas“ tenas 2,2 kW + didelio ploto spiralinis šilumokaitis iki 1,45 m²',
        studioImage: '/images/products/giles-okc-160-ntrz-3d8ef303.webp',
        matches: ({ brandLower, categoryLower, titleLower }) =>
            brandLower.includes('gorenje') ||
            brandLower.includes('dražice') ||
            brandLower.includes('drazice') ||
            categoryLower.includes('akumuliacinės talpos ir boileriai') ||
            titleLower.includes('boileris') ||
            titleLower.includes('vandens šildytuvas'),
    },
    // 22. Ferroli POL Sectional Aluminum Radiator
    {
        seriesId: 'ferroli-pol-sectional-aluminum-radiator',
        seriesLabel: 'Ferroli POL Sectional Aluminum Radiator',
        seriesBadge: 'Ferroli POL / Clan · Aliumininis sekcijinis radiatorius',
        technicalCallout: 'Aukštas šilumos atidavimas ΔT50 · Darbinis slėgis iki 16 bar · 430–800 mm aukštis',
        studioImage: '/images/products/0381-01.000.webp',
        matches: ({ brandLower, skuLower, titleLower, categoryLower }) =>
            (brandLower.includes('ferroli') &&
                (skuLower.startsWith('pol') ||
                    titleLower.includes('radiator') ||
                    titleLower.includes('konvektor') ||
                    categoryLower.includes('radiatoriai'))) ||
            skuLower.startsWith('pol.') ||
            titleLower.includes('aliumininis radiatorius'),
    },
    // 23. Steel Panel Radiator Tipas 22 K / 22 VK
    {
        seriesId: 'steel-panel-radiator-tipas-22',
        seriesLabel: 'Steel Panel Radiator Tipas 22 K / 22 VK',
        seriesBadge: 'Plieninis radiatorius Tipas 22 K / VK · Konvektorius',
        technicalCallout: 'EN 442 sertifikuotas plieninis profilinis radiatorius ir grindinis konvektorius',
        studioImage: '/images/products/0381-01.000.webp',
        matches: ({ categoryLower, titleLower }) =>
            categoryLower.includes('radiatoriai') ||
            titleLower.includes('radiatorius') ||
            titleLower.includes('konvektorius'),
    },
    // 24. Megatherm MPB Rotary Pellet Burner
    {
        seriesId: 'megatherm-mpb-rotary-pellet-burner',
        seriesLabel: 'Megatherm MPB Rotary Pellet Burner',
        seriesBadge: 'Megatherm MPB / Pelltech PV · Savaime išsivalantis degiklis',
        technicalCallout: '8–450 kW moduliacija · Keraminis 425 W uždegimo tenas · Sraigtinis tiektuvas ir automatika',
        studioImage: '/studio-assets/products/giles-studio-01-mpb-nani-35-50.webp',
        projectReferenceImage: '/studio-assets/projects/giles-darbas-01.webp',
        matches: ({ brandLower, skuLower, titleLower }) =>
            brandLower.includes('megatherm') ||
            brandLower.includes('pelltech') ||
            skuLower.includes('mpb') ||
            skuLower.startsWith('degkmpl') ||
            titleLower.includes('granulių degikl') ||
            titleLower.includes('granuliu degikl') ||
            titleLower.includes('perdarymo komplektas'),
    },
    // 25. Gilės GK-150..500 Containerized Boiler
    {
        seriesId: 'giles-gk-150-500-containerized-boiler',
        seriesLabel: 'Gilės GK-150..500 Containerized Boiler',
        seriesBadge: 'Gilės GK-150..500 · Pramoninė konteinerinė katilinė',
        technicalCallout: '150 kW – 2 MW modulinė biokuro ir granulių katilinė su SCADA/GSM telemetrija',
        studioImage: '/studio-assets/products/giles-studio-22-container-boiler-500kw.webp',
        projectReferenceImage: '/studio-assets/projects/giles-darbas-06.webp',
        matches: ({ skuLower, titleLower }) =>
            skuLower.includes('konteiner') ||
            skuLower.includes('mobili') ||
            skuLower.includes('pramonine') ||
            skuLower.startsWith('gk-') ||
            titleLower.includes('konteinerin') ||
            titleLower.includes('mobilioji') ||
            titleLower.includes('pramoninė katilinė') ||
            titleLower.includes('biodujų'),
    },
    // 26. Verner / Ponast / Thermostal Pellet Boiler
    {
        seriesId: 'verner-ponast-thermostal-pellet-boiler',
        seriesLabel: 'Verner / Ponast / Thermostal Pellet Boiler',
        seriesBadge: 'KaTRI / Centrometal / Viessmann · Šildymo katilas Class 5',
        technicalCallout: 'EN 303-5 5 klasė (EcoDesign) · 6 mm P265GH katilinis plienas · APVA kompensacija',
        studioImage: '/studio-assets/products/giles-studio-25-katri-25kw-pellet-boiler.webp',
        projectReferenceImage: '/studio-assets/projects/giles-darbas-03.webp',
        matches: ({ brandLower, categoryLower, titleLower }) =>
            brandLower.includes('centrometal') ||
            brandLower.includes('viessmann') ||
            brandLower.includes('buderus') ||
            brandLower.includes('rotex') ||
            brandLower.includes('junkers') ||
            brandLower.includes('ferroli') ||
            titleLower.includes('katilas') ||
            titleLower.includes('katri') ||
            titleLower.includes('ecobio') ||
            titleLower.includes('ecotwin') ||
            titleLower.includes('ecowood') ||
            titleLower.includes('profi ') ||
            categoryLower.includes('katilai ir katilinės įranga') ||
            categoryLower.includes('saulės energija'),
    },
    // 27. Underfloor Heating Manifold 2–12 loops
    {
        seriesId: 'underfloor-heating-manifold-2-12-loops',
        seriesLabel: 'Underfloor Heating Manifold 2–12 loops',
        seriesBadge: 'Grindinio šildymo kolektorius 2–12 žiedų · Inox / Žalvaris',
        technicalCallout: 'Debito matuokliai 0–5 l/min · M30×1,5 termostatiniai vožtuvai · Automatiniai nuorintuvai',
        studioImage: '/images/products/9330-06.800.webp',
        projectReferenceImage: '/studio-assets/projects/giles-darbas-12.webp',
        matches: ({ categoryLower, titleLower, skuLower }) =>
            categoryLower.includes('grindinis šildymas') ||
            titleLower.includes('kolektor') ||
            skuLower.startsWith('9330-') ||
            skuLower.startsWith('88.10'),
    },
    // 28. Wilo / Grundfos Circulation Pump
    {
        seriesId: 'wilo-grundfos-circulation-pump',
        seriesLabel: 'Wilo / Grundfos Circulation Pump',
        seriesBadge: 'Wilo Yonos / Stratos · Grundfos ALPHA2 / MAGNA3',
        technicalCallout: 'EEI ≤ 0,20 ECM sinchroninis variklis · Δp-v / Δp-c srauto adaptacija · PN10',
        studioImage: '/images/products/giles-stratos-pico-251-6-130-row-d4006e6d.webp',
        projectReferenceImage: '/studio-assets/projects/giles-darbas-11.webp',
        matches: ({ brandLower, categoryLower, titleLower }) =>
            brandLower.includes('wilo') ||
            brandLower.includes('grundfos') ||
            categoryLower.includes('cirkuliaciniai ir vandens siurbliai') ||
            titleLower.includes('cirkuliacinis siurblys') ||
            titleLower.includes('yonos') ||
            titleLower.includes('stratos') ||
            titleLower.includes('alpha2') ||
            titleLower.includes('magna'),
    },
    // 29. Burner Igniter / Grate / Sensor Spare Part
    {
        seriesId: 'burner-igniter-grate-sensor-spare-part',
        seriesLabel: 'Burner Igniter / Grate / Sensor Spare Part',
        seriesBadge: 'Degiklių ir katilų atsarginės dalys · Tenai, ardelės, jutikliai',
        technicalCallout: 'Originalios atsarginės dalys Kauno sandėlyje: 425 W uždegimo tenai, fotoelementai, ardelės, valdikliai',
        studioImage: '/studio-assets/products/giles-studio-30-ecomax-920i-automation.webp',
        projectReferenceImage: '/studio-assets/projects/giles-darbas-16.webp',
        matches: ({ categoryLower, titleLower, brandLower }) =>
            categoryLower.includes('degikliai ir priedai') ||
            categoryLower.includes('katilinės automatika') ||
            brandLower.includes('watts') ||
            titleLower.includes('tenas') ||
            titleLower.includes('ardel') ||
            titleLower.includes('jutikl') ||
            titleLower.includes('davikl') ||
            titleLower.includes('fotoelement') ||
            titleLower.includes('šnekas') ||
            titleLower.includes('sraigtas') ||
            titleLower.includes('apsauginis vožtuvas') ||
            titleLower.includes('manometras') ||
            titleLower.includes('termometras'),
    },
    // 30. Comisa / SANHA / FV-Plast Multilayer Pipe & Press Fittings
    {
        seriesId: 'comisa-sanha-fvplast-multilayer-pipe-press-fittings',
        seriesLabel: 'Comisa / SANHA / FV-Plast Multilayer Pipe & Press Fittings',
        seriesBadge: 'Comisa / SANHA / FV-Plast / Wavin · Vamzdynų ir presuojama armatūra',
        technicalCallout: 'DVGW sertifikuoti presuojami TH/U/V profilio fitingai, daugiasluoksniai vamzdžiai ir izoliacija',
        studioImage: '/images/products/giles-8826005-e1409650886687-b0fa6b47.webp',
        matches: ({ brandLower, categoryLower }) =>
            brandLower.includes('comisa') ||
            brandLower.includes('sanha') ||
            brandLower.includes('fv-plast') ||
            brandLower.includes('wavin') ||
            brandLower.includes('thermawool') ||
            brandLower.includes('thermaflex') ||
            brandLower.includes('ferro') ||
            categoryLower.includes('vamzdynų') ||
            categoryLower.includes('nuotekų') ||
            categoryLower.includes('izoliacija') ||
            categoryLower.includes('santechnika') ||
            true,
    },
];

const STUDIO_DIRECT_SKU_MAP: Record<string, string> = {
    'mpb nani 35': '/studio-assets/products/giles-studio-01-mpb-nani-35-50.webp',
    'mpb-50': '/studio-assets/products/giles-studio-01-mpb-nani-35-50.webp',
    'mpb 60': '/studio-assets/products/giles-studio-02-mpb-60-80-burner.webp',
    'mpb 80': '/studio-assets/products/giles-studio-02-mpb-60-80-burner.webp',
    'mpb 150': '/studio-assets/products/giles-studio-03-mpb-150-450-pro.webp',
    'viadrus-kit-4-10': '/studio-assets/products/giles-studio-04-viadrus-conversion-kit.webp',
    degkmpl140pv20: '/studio-assets/products/giles-studio-05-pelltech-pv20a-kit.webp',
    degkmpl140mg20: '/studio-assets/products/giles-studio-06-megatherm-burner-kit.webp',
    degkmpl50kv: '/studio-assets/products/giles-studio-07-agro-pellet-burner-50kw.webp',
    aw082hugha: '/studio-assets/products/giles-studio-21-haier-super-aqua-r290.webp',
    aw16nhvgha: '/studio-assets/products/giles-studio-21-haier-super-aqua-r290.webp',
    katri3850020: '/studio-assets/products/giles-studio-25-katri-25kw-pellet-boiler.webp',
    'eko-ck-p-25': '/studio-assets/products/giles-studio-26-centrometal-eko-ck-p-25.webp',
    'cas-1001': '/studio-assets/products/giles-studio-27-centrometal-cas-1001-buffer.webp',
};

export function resolveProductSeriesVisual(input: ProductVisualInput): ResolvedProductSeriesVisual {
    const skuRaw = (input.sku ?? '').trim();
    const skuLower = skuRaw.toLowerCase();
    const titleRaw = (input.title ?? input.nameLt ?? input.name ?? '').trim();
    const titleLower = titleRaw.toLowerCase();
    const brandRaw = (input.brand ?? input.brandName ?? '').trim();
    const brandLower = brandRaw.toLowerCase();
    const categoryRaw = (input.category ?? input.categoryName ?? '').trim();
    const categoryLower = categoryRaw.toLowerCase();
    const combined = `${skuLower} ${titleLower} ${brandLower} ${categoryLower}`;

    const matchedRule =
        PRODUCT_VISUAL_SERIES_RULES.find((rule) =>
            rule.matches({
                skuLower,
                titleLower,
                brandLower,
                categoryLower,
                combined,
            }),
        ) || PRODUCT_VISUAL_SERIES_RULES[PRODUCT_VISUAL_SERIES_RULES.length - 1];

    const directStudio = STUDIO_DIRECT_SKU_MAP[skuLower];
    let resolvedImage = directStudio || '';

    if (!resolvedImage) {
        const candidateFromBase = resolveProductImageUrl({
            sku: skuRaw,
            title: titleRaw,
            brand: brandRaw,
            category: categoryRaw,
            imageUrl: input.imageUrl ?? undefined,
            seriesImageUrl: input.seriesImageUrl ?? undefined,
        });

        const isGenericFamilyFallback =
            !candidateFromBase ||
            candidateFromBase.includes('family-ferroli-boiler') ||
            candidateFromBase === '/images/products/013g2970.webp';

        if (
            input.imageUrl &&
            (input.imageUrl.startsWith('/manufacturer-assets/') ||
                input.imageUrl.startsWith('/studio-assets/products/'))
        ) {
            resolvedImage = input.imageUrl;
        } else if (matchedRule.studioImage.startsWith('/studio-assets/products/')) {
            if (
                input.imageUrl &&
                (input.imageUrl.startsWith('/studio-assets/products/') ||
                    (!input.imageUrl.includes('family-') &&
                        !input.imageUrl.includes('egip-katri3850020') &&
                        !input.imageUrl.includes('haier-2026-au082fycra-hw')))
            ) {
                resolvedImage = candidateFromBase;
            } else {
                resolvedImage = matchedRule.studioImage;
            }
        } else {
            resolvedImage = isGenericFamilyFallback ? matchedRule.studioImage : candidateFromBase;
        }
    }

    return {
        seriesId: matchedRule.seriesId,
        seriesLabel: matchedRule.seriesLabel,
        image: resolvedImage || matchedRule.studioImage,
        seriesBadge: matchedRule.seriesBadge,
        technicalCallout: matchedRule.technicalCallout,
        projectReferenceImage: matchedRule.projectReferenceImage,
    };
}
