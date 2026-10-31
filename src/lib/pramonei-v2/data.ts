import type { AppLocale } from '../../i18n/routing';
import rawModelsFile from '../../data/pramonei-v2/industrial-models.lt.json';
import rawRoiConfig from '../../data/pramonei-v2/roi-config.json';
import rawProjectsFile from '../../data/pramonei-v2/projects.lt.json';
import rawContentLt from '../../data/pramonei-v2/pramonei-content.lt.json';
import type { BoilerDrawingSpec, IndustrialModel, ModelsFile, PublishEnv, RoiConfig } from './types';

export interface PramoneiProject {
    id: string;
    model: string | null;
    tag: string;
    title: string;
    equipment: string;
    result: string;
    image: string;
    client: string | null;
    city: string | null;
    year: number | null;
}

export type PramoneiContent = typeof rawContentLt;

const GK2000_DRAWING: BoilerDrawingSpec = {
    rev: '4.2',
    modules: [
        { id: 'M1', lengthMm: 12192, widthMm: 2438, heightMm: 2896 },
        { id: 'M2', lengthMm: 12192, widthMm: 2438, heightMm: 2896 },
    ],
    layout: 'side-by-side',
    zones: [
        { tag: 'K1', kind: 'fuel', x0Mm: 0, x1Mm: 5000, y0Mm: 0, y1Mm: 4876 },
        { tag: 'F1', kind: 'firewall', x0Mm: 5000, x1Mm: 5000, y0Mm: 0, y1Mm: 4876 },
        { tag: 'K2', kind: 'auger', x0Mm: 4600, x1Mm: 5700, y0Mm: 1050, y1Mm: 1350 },
        { tag: 'B', kind: 'boiler', x0Mm: 5700, x1Mm: 10000, y0Mm: 300, y1Mm: 2150 },
        { tag: 'D1', kind: 'cyclone', x0Mm: 10000, x1Mm: 10800, y0Mm: 3000, y1Mm: 3800 },
        { tag: 'D2', kind: 'filter', x0Mm: 10900, x1Mm: 11500, y0Mm: 3000, y1Mm: 3750 },
        { tag: 'D3', kind: 'fan', x0Mm: 11550, x1Mm: 12100, y0Mm: 3100, y1Mm: 3650 },
        { tag: 'D4', kind: 'chimney', x0Mm: 12192, x1Mm: 12750, y0Mm: 3100, y1Mm: 3650 },
        { tag: 'H2', kind: 'hydraulics', x0Mm: 6800, x1Mm: 9500, y0Mm: 2600, y1Mm: 4876 },
        { tag: 'E1', kind: 'control', x0Mm: 5700, x1Mm: 6500, y0Mm: 4300, y1Mm: 4700 },
    ],
    sectionYmm: 1200,
    chimneyHeightM: null,
    hydraulics: {
        dn: 150,
        pn: 6,
        supplyC: 85,
        returnC: 65,
        minReturnC: 55,
        pumps: 2,
        safetyValveBar: 6,
    },
    positions: [
        {
            tag: 'K1',
            name: 'Kuro sandėlis',
            spec: '36 m³ · stumdomosios grindys (Walking-Floor)',
            views: ['plan', 'section'],
        },
        {
            tag: 'K2',
            name: 'Sraigtinis transporteris',
            spec: 'Su priešgaisrine sklende ties pertvara',
            views: ['plan', 'section'],
        },
        {
            tag: 'F1',
            name: 'Priešgaisrinė pertvara',
            spec: 'Atskiria kuro sandėlį nuo katilinės · EI 60',
            views: ['plan', 'section'],
        },
        {
            tag: 'B',
            name: 'Katilas GK-2000',
            spec: 'Judančios ardelės, 3 eigų šilumokaitis · 2 000 kW · PN6',
            views: ['plan', 'pid'],
        },
        {
            tag: 'B1',
            name: 'Pakura',
            spec: 'Judančios ardelės, šamoto mūras · ≈ 1 050 °C',
            views: ['section'],
        },
        {
            tag: 'B2',
            name: 'Šilumokaitis',
            spec: '3 dūmų eigos · P265GH',
            views: ['section'],
        },
        {
            tag: 'B3',
            name: 'Pelenų sraigtas',
            spec: 'Automatinis pelenų šalinimas',
            views: ['section'],
        },
        {
            tag: 'D1',
            name: 'Multiciklonas',
            spec: 'Stambiųjų dalelių atskyrimas',
            views: ['plan', 'section'],
        },
        {
            tag: 'D2',
            name: 'Dulkių filtras',
            spec: 'Elektrostatinis arba rankovinis · pagal leidimo ribą',
            views: ['plan', 'section'],
        },
        {
            tag: 'D3',
            name: 'Dūmsiurbė',
            spec: 'Su dažnio keitikliu · palaiko ≈ −20 Pa išretėjimą',
            views: ['plan', 'section'],
        },
        {
            tag: 'D4',
            name: 'Kaminas',
            spec: 'Nerūdijantis, izoliuotas · H pagal sklaidos skaičiavimą',
            views: ['plan', 'section'],
        },
        {
            tag: 'H1',
            name: 'Antikondensacinis mazgas',
            spec: 'Siurblys + 3 eigų vožtuvas · ≥ 55 °C į katilą',
            views: ['pid'],
        },
        {
            tag: 'H2',
            name: 'Hidraulinis kolektorius',
            spec: 'Atskiria katilo ir tinklo kontūrus · DN150 PN6',
            views: ['plan', 'pid'],
        },
        {
            tag: 'H3',
            name: 'Tinklo siurbliai',
            spec: 'Dviguba grupė (darbinis + rezervinis) · ≈ 87 m³/h',
            views: ['plan', 'pid'],
        },
        {
            tag: 'H4',
            name: 'Plėtimosi indas',
            spec: 'Prijungtas atšaka prie grąžinimo, su slėgio palaikymu',
            views: ['plan', 'pid'],
        },
        {
            tag: 'H5',
            name: 'Purvo ir oro separatorius',
            spec: 'Grąžinimo linijoje prieš kolektorių',
            views: ['pid'],
        },
        {
            tag: 'H6',
            name: 'Apsauginis vožtuvas',
            spec: 'Darbinis slėgis iki 6 bar',
            views: ['pid'],
        },
        {
            tag: 'H7',
            name: 'Prijungimo flanšai',
            spec: 'DN150 PN16 flanšai · sistema iki 6 bar · 85/65 °C',
            views: ['plan', 'pid'],
        },
        {
            tag: 'E1',
            name: 'Valdymo skydas',
            spec: 'PLC · 7" HMI · Modbus / SCADA',
            views: ['plan'],
        },
    ],
    techSpecs: [
        { k: 'Šiluminė galia', v: '2 000 kW (2 × 1 000 kW kaskada, N+1)' },
        { k: 'Kuras', v: 'Medienos skiedra iki W35, pramoninės granulės ENplus A1/A2' },
        { k: 'Kuro sandėlis', v: '36 m³ · stumdomosios grindys' },
        { k: 'Pakura', v: 'Judančios ardelės, šamotas' },
        { k: 'Šilumokaitis', v: '3 eigų · P265GH' },
        { k: 'Naudingumo koef.', v: '93,0 %' },
        { k: 'Dūmų valymas', v: 'Multiciklonas + filtras pagal leidimo ribas' },
        { k: 'Hidraulika', v: '85/65 °C · DN150 PN16 flanšai · sistema iki 6 bar' },
        { k: 'Debitas', v: '≈ 87 m³/h' },
        { k: 'Gabaritai', v: '12 192 × 4 876 × 2 896 mm (2 × 40ft HC)' },
        { k: 'Masė', v: '14,5 + 11,2 t' },
        { k: 'Valdymas', v: 'PLC · 7" HMI · GSM / SCADA' },
    ],
};

const GK500_DRAWING: BoilerDrawingSpec = {
    rev: '4.2',
    modules: [{ id: 'M1', lengthMm: 6058, widthMm: 2438, heightMm: 2896 }],
    layout: 'single',
    zones: [
        { tag: 'K1', kind: 'fuel', x0Mm: 0, x1Mm: 2400, y0Mm: 0, y1Mm: 2438 },
        { tag: 'F1', kind: 'firewall', x0Mm: 2400, x1Mm: 2400, y0Mm: 0, y1Mm: 2438 },
        { tag: 'K2', kind: 'auger', x0Mm: 2100, x1Mm: 2900, y0Mm: 800, y1Mm: 1100 },
        { tag: 'B', kind: 'boiler', x0Mm: 2900, x1Mm: 4700, y0Mm: 300, y1Mm: 1600 },
        { tag: 'D1', kind: 'cyclone', x0Mm: 4750, x1Mm: 5350, y0Mm: 400, y1Mm: 1150 },
        { tag: 'D3', kind: 'fan', x0Mm: 5400, x1Mm: 5850, y0Mm: 550, y1Mm: 1050 },
        { tag: 'D4', kind: 'chimney', x0Mm: 5900, x1Mm: 6350, y0Mm: 550, y1Mm: 1050 },
        { tag: 'H2', kind: 'hydraulics', x0Mm: 3200, x1Mm: 5200, y0Mm: 1700, y1Mm: 2438 },
        { tag: 'E1', kind: 'control', x0Mm: 2600, x1Mm: 3100, y0Mm: 1950, y1Mm: 2350 },
    ],
    sectionYmm: 1000,
    chimneyHeightM: null,
    hydraulics: {
        dn: 80,
        pn: 6,
        supplyC: 85,
        returnC: 65,
        minReturnC: 55,
        pumps: 2,
        safetyValveBar: 6,
    },
    positions: [
        {
            tag: 'K1',
            name: 'Kuro sandėlis',
            spec: '18 m³ · stumdomosios grindys arba sraigtas',
            views: ['plan', 'section'],
        },
        {
            tag: 'K2',
            name: 'Sraigtinis transporteris',
            spec: 'Su priešgaisrine sklende ties pertvara',
            views: ['plan', 'section'],
        },
        {
            tag: 'F1',
            name: 'Priešgaisrinė pertvara',
            spec: 'Atskiria kuro sandėlį nuo katilinės · EI 60',
            views: ['plan', 'section'],
        },
        {
            tag: 'B',
            name: 'Katilas GK-500',
            spec: 'Judančios ardelės, 3 eigų P265GH šilumokaitis · 500 kW',
            views: ['plan', 'pid'],
        },
        {
            tag: 'B1',
            name: 'Pakura',
            spec: 'Judančios ardelės, šamoto mūras · 125–500 kW',
            views: ['section'],
        },
        {
            tag: 'B2',
            name: 'Šilumokaitis',
            spec: '3 dūmų eigos · P265GH plienas',
            views: ['section'],
        },
        {
            tag: 'B3',
            name: 'Pelenų sraigtas',
            spec: 'Automatinis pelenų šalinimas į 240 L konteinerį',
            views: ['section'],
        },
        {
            tag: 'D1',
            name: 'Multiciklonas',
            spec: 'Kietųjų dalelių atskyrimas',
            views: ['plan', 'section'],
        },
        {
            tag: 'D2',
            name: 'Dūmų filtras',
            spec: 'Pagal taršos leidimo ribas',
            views: ['plan', 'section'],
        },
        {
            tag: 'D3',
            name: 'Dūmsiurbė',
            spec: 'Su dažnio keitikliu',
            views: ['plan', 'section'],
        },
        {
            tag: 'D4',
            name: 'Kaminas',
            spec: 'Nerūdijantis, izoliuotas Ø250 mm',
            views: ['plan', 'section'],
        },
        {
            tag: 'H1',
            name: 'Antikondensacinis mazgas',
            spec: 'Siurblys + 3 eigų vožtuvas · ≥ 55 °C į katilą',
            views: ['pid'],
        },
        {
            tag: 'H2',
            name: 'Hidraulinis kolektorius',
            spec: 'DN80 PN16 flanšai · sistema iki 6 bar',
            views: ['plan', 'pid'],
        },
        {
            tag: 'H3',
            name: 'Tinklo siurbliai',
            spec: 'Dviguba siurblių grupė · ≈ 22 m³/h',
            views: ['plan', 'pid'],
        },
        {
            tag: 'H4',
            name: 'Plėtimosi indas',
            spec: 'Prijungtas atšaka prie grąžinimo',
            views: ['plan', 'pid'],
        },
        {
            tag: 'H5',
            name: 'Purvo ir oro separatorius',
            spec: 'Grąžinimo linijoje prieš kolektorių',
            views: ['pid'],
        },
        {
            tag: 'H6',
            name: 'Apsauginis vožtuvas',
            spec: 'Darbinis slėgis iki 6 bar',
            views: ['pid'],
        },
        {
            tag: 'H7',
            name: 'Prijungimo flanšai',
            spec: 'DN80 PN16 flanšai · sistema iki 6 bar · 85/65 °C',
            views: ['plan', 'pid'],
        },
        {
            tag: 'E1',
            name: 'Valdymo skydas',
            spec: 'PLC · GSM / SCADA stebėsena',
            views: ['plan'],
        },
    ],
    techSpecs: [
        { k: 'Šiluminė galia', v: '500 kW (moduliacija 125–500 kW)' },
        { k: 'Kuras', v: 'Medienos skiedra iki W35, pramoninės granulės ENplus A1/A2' },
        { k: 'Kuro sandėlis', v: '18 m³ · stumdomosios grindys arba sraigtas' },
        { k: 'Pakura', v: 'Judančios ardelės, šamotas' },
        { k: 'Šilumokaitis', v: '3 eigų · P265GH' },
        { k: 'Naudingumo koef.', v: '92,4 %' },
        { k: 'Dūmų valymas', v: 'Multiciklonas, dūmsiurbė su dažnio keitikliu' },
        { k: 'Hidraulika', v: '85/65 °C · DN80 PN16 flanšai · sistema iki 6 bar' },
        { k: 'Debitas', v: '≈ 22 m³/h' },
        { k: 'Gabaritai', v: '6 058 × 2 438 × 2 896 mm (ISO 20ft HC)' },
        { k: 'Masė', v: '8,4 t' },
        { k: 'Valdymas', v: 'PLC · GSM / SCADA' },
    ],
};

const enrichedModels: IndustrialModel[] = (rawModelsFile.models as IndustrialModel[]).map((m) => {
    if (m.slug === 'gk-2000') {
        return { ...m, drawing: GK2000_DRAWING };
    }
    if (m.slug === 'gk-500') {
        return { ...m, drawing: GK500_DRAWING };
    }
    return m;
});

export const INDUSTRIAL_MODELS_FILE: ModelsFile = {
    vat_rate: rawModelsFile.vat_rate,
    constants: rawModelsFile.constants as ModelsFile['constants'],
    models: enrichedModels,
};

export const ROI_CONFIG: RoiConfig = rawRoiConfig as RoiConfig;

export const PRAMONEI_PROJECTS: PramoneiProject[] = rawProjectsFile.projects as PramoneiProject[];

export function getDefaultPublishEnv(): PublishEnv {
    const raw =
        (typeof process !== 'undefined' &&
            (process.env.SHOW_ASSUMPTIONS || process.env.NEXT_PUBLIC_SHOW_ASSUMPTIONS)) ||
        '';
    return {
        SHOW_ASSUMPTIONS: raw === 'true' || raw === '1',
    };
}

const CONTENT_EN: PramoneiContent = {
    seo: {
        title: 'Containerized Boiler Plants 100 kW – 2.5 MW | Built in Kaunas | Gilės inžinerija',
        description:
            'Containerized biomass boiler plants 100 kW – 2.5 MW: factory-built and tested in Kaunas, purchase or rental. Prices from 28 500 € excl. VAT, payback calculator, drawings, and quote within 24h.',
        og_image: '/studio-assets/projects/giles-darbas-08.webp',
    },
    breadcrumb: ['Home', 'Industrial'],
    hero: {
        eyebrow: 'BUILT IN KAUNAS · SALE · RENTAL',
        h1: 'Containerized Boiler Plants 100 kW – 2.5 MW',
        lead: 'Assembled and pressure-tested at our Kaunas factory, delivered ready to connect. Wood chips, pellets, or biogas – purchase or rental. Project quote within 24h on business days.',
        cta_primary: {
            label: 'Request a Quote',
            href: '#industrial-rfq',
        },
        cta_secondary: {
            label: 'Models & Pricing',
            href: '#modeliai',
        },
        cta_tertiary: {
            label: 'PDF Catalog',
            href: '/files/giles-pramonei-katalogas.pdf',
            note: 'PDF pending owner confirmation',
        },
        facts: [
            { value: '100 kW – 2.5 MW', label: 'output range' },
            { value: '4–8 wks', label: 'production & testing in Kaunas' },
            { value: '16 sites', label: 'manufactured & commissioned' },
        ],
        image: {
            src: '/studio-assets/projects/giles-darbas-08.webp',
            alt: '2.0 MW modular biomass boiler plant GK-2000 with fuel bunker and chimney',
            caption_title: 'GK-2000 · 2.0 MW',
            caption_text: 'Walking-Floor fuel store · multi-stage flue filtration · SCADA',
        },
    },
    paths: [
        {
            segment: 'buy',
            eyebrow: 'PURCHASE',
            title: 'Permanent Boiler Plant',
            text: 'For factories, greenhouses, schools, and district networks. 100 kW – 2.5 MW.',
            price_from: 'from 28 500 € excl. VAT',
        },
        {
            segment: 'rent',
            eyebrow: 'RENTAL',
            title: 'Mobile Boiler Unit',
            text: 'For emergencies, winter construction, hangars, and seasonal peak demand.',
            price_from: 'from 700 €/mo excl. VAT',
            price_source: 'assumption (MOB-ORO-90)',
        },
        {
            segment: 'special',
            eyebrow: 'SPECIAL',
            title: 'Biogas & Rooftop Gas',
            text: 'Biogas plants, food processing facilities, and rooftop cascade boiler rooms.',
            price_from: 'Custom project quote',
        },
    ],
    models_section: {
        eyebrow: 'MODELS',
        titles: {
            buy: 'Boiler Plants for Purchase & Long-Term Rental',
            rent: 'Mobile Boiler Plants for Rental',
            special: 'Special Industrial Solutions',
            all: 'All Industrial Models',
        },
        filters: {
            buy: 'Purchase',
            rent: 'Rental',
            special: 'Special',
            all: 'All',
        },
        vat_toggle: {
            net: 'Excl. VAT',
            gross: 'Incl. VAT',
        },
        columns: [
            'Model',
            'Output',
            'Heated Area',
            'Fuel Store',
            'Dimensions',
            'Price excl. VAT | Price incl. VAT',
            '',
        ],
        row_cta: 'Model Passport',
        price_on_request: 'By project',
        footnote:
            'Prices exclude site installation and grid connection. "≈" indicates an indicative estimate refined in your formal proposal. Autonomy shown for pellets at 100% load; at 50% load autonomy doubles. Model passport includes photos, 3 schematic views, technical specs, and DWG.',
    },
    assemblies: {
        eyebrow: 'ARCHITECTURE',
        title: 'Five Integrated Subsystems in One Factory Unit',
        link: {
            label: 'Schematics: plan, section, hydronics →',
            href: '/en/pramonei/gk-2000#breziniai',
        },
        items: [
            {
                tag: '01 · K',
                title: 'Fuel Storage',
                text: '8–90 m³, Walking-Floor or screw extractors. Wood chips up to W35 or pellets.',
            },
            {
                tag: '02 · F',
                title: 'Feed & Fire Protection',
                text: 'Screw conveyor with rotary fire valve and fire-rated partition wall.',
            },
            {
                tag: '03 · B',
                title: 'Industrial Boiler',
                text: 'Moving grates, refractory chamber, 3-pass P265GH heat exchanger, automatic de-ashing.',
            },
            {
                tag: '04 · D',
                title: 'Flue Gas Cleaning',
                text: 'Multicyclone, particulate filter per emission permit limits, VFD draft fan.',
            },
            {
                tag: '05 · H/E',
                title: 'Hydronics & Controls',
                text: 'Manifold, twin pumps, pressure stabilization, PLC with GSM/SCADA telemetry.',
            },
        ],
    },
    roi: {
        eyebrow: 'PAYBACK CALCULATOR',
        title: 'How much would you save switching to biomass?',
        steps: ['1. Current fuel', '2. Biomass fuel', '3. Annual heat demand'],
        assumptions:
            'Assumptions: fuel prices from BALTPOOL SM2, LEA, and VERT range midpoints ({version}); 2 100 full-load hours/year and 10% sizing reserve; operating cost 3% of capex/year plus auxiliary electricity at 0,20 €/kWh. Exact calculation prepared from your utility bills.',
        result_labels: {
            eyebrow: 'RESULT · {model}',
            net: 'Net annual savings',
            sizing: 'Required output ≈ {kw} kW → {model}',
            now: 'Current · {fuel}',
            bio: 'Biomass · {bio}',
            opex: 'Operating & maintenance',
            invest: 'Investment excl. VAT, from',
            payback: 'Estimated payback',
            rent: 'Or rental: {rent}',
            no_payback: 'No payback',
            exceeds: 'For higher demand we configure a multi-module cascade',
        },
        cta: 'Get a calculation from my utility bills',
    },
    projects_section: {
        eyebrow: 'COMPLETED PROJECTS',
        title: 'Manufactured and Commissioned',
        link: {
            label: 'All 16 projects →',
            href: '/en/inzinerija#atlikti-darbai',
        },
        fields: {
            equipment: 'Equipment',
            result: 'Result',
            client: 'Site',
            year: 'Year',
        },
    },
    process: {
        eyebrow: 'PROCESS',
        title: 'From Inquiry to Commissioned Heat',
        steps: [
            { n: '01', title: 'Heat Load Audit', text: '1–2 bus. days · load & fuel logistics' },
            { n: '02', title: 'Permit Assessment', text: 'Construction, emission & grid rules' },
            { n: '03', title: 'Design & Kaunas Build', text: '4–8 weeks in factory' },
            { n: '04', title: 'Delivery & Connection', text: '1–2 days on site' },
            { n: '05', title: 'Commissioning & Flue Test', text: '1 day · emission protocol' },
            { n: '06', title: 'Telemetry & Service', text: 'SCADA / GSM · SLA contract' },
        ],
    },
    documents: {
        title: 'Included Documentation Package',
        items: [
            { label: 'Declaration of Conformity & CE', format: 'PDF' },
            { label: 'Technical Passport (12 parameters)', format: 'PDF' },
            { label: 'Schematics: plan, section, hydronics', format: 'DWG · PDF' },
            { label: 'Factory Hydrostatic Test Certificate', format: 'PDF' },
            { label: 'Flue Gas Analysis Protocol', format: 'PDF' },
            { label: 'Operating & Maintenance Manual', format: 'PDF' },
        ],
    },
    faq: {
        title: 'Frequently Asked Questions',
        items: [
            {
                q: 'Is a building permit required?',
                a: 'It depends on site specifics. Under STR 1.05.01:2017 and local conditions we assess whether a construction permit, emission permit, and utility connection conditions are required, and include the permit schedule in our quote.',
            },
            {
                q: 'How long does manufacturing take?',
                a: 'Factory production in Kaunas takes 4–8 weeks from contract signing. Delivery and hydronic connection take 1–2 days, and commissioning with combustion tuning takes 1 day.',
            },
            {
                q: 'Which fuels can be used?',
                a: 'Wood chips G30–G50 (moisture up to W35), industrial wood pellets ENplus A1/A2, and briquettes. BIO models run on biogas with an integrated pellet backup.',
            },
            {
                q: 'How long does the boiler plant run without refueling?',
                a: 'Depends on bunker volume, fuel type, and load. For example, GK-500 with 18 m³ of pellets runs approx. 4,5 days at 100% load and approx. 9 days at 50% load. Wood chips have lower bulk density, giving roughly one-third the autonomy.',
            },
            {
                q: 'Can we rent a containerized boiler plant?',
                a: 'Yes. GK series plants start from 1 250 €/month excl. VAT, and mobile MOB units are available for emergency and seasonal heating.',
            },
            {
                q: 'What warranty and service do you provide?',
                a: 'We provide a 24-month equipment warranty. All plants include GSM/SCADA telemetry for remote fault diagnostics. Service line: +370 693 97098.',
            },
        ],
    },
    rfq: {
        anchor_id: 'industrial-rfq',
        eyebrow: 'INQUIRY',
        title: 'Get a Proposal for Your Facility',
        lead: 'Your inquiry goes directly to our lead engineer. We prepare an itemised estimate within 24 hours on business days (Mon–Fri 8:30–17:30).',
        contact: {
            name: 'Darius, Lead Engineer',
            phone: '+370 611 19158',
            service_phone: '+370 693 97098',
        },
        modes: {
            buy: 'Purchase',
            rent: 'Rent',
        },
        fields: {
            company_city: {
                label: 'Company & City',
                required: true,
                autocomplete: 'organization',
            },
            phone: {
                label: 'Phone',
                required: true,
                placeholder: '+370',
                autocomplete: 'tel',
            },
            email: {
                label: 'Email',
                required: false,
                autocomplete: 'email',
            },
            power: {
                label: 'Required Output',
                options: [
                    'Not sure – help me size it',
                    '100–250 kW',
                    '250–500 kW',
                    '500 kW – 1 MW',
                    '1–2,5 MW',
                ],
            },
            fuel: {
                label: 'Fuel Type',
                options: ['Wood chips', 'Pellets', 'Biogas', 'Not sure yet'],
            },
            model: {
                label: 'Model',
                hidden_unless_prefilled: true,
            },
            files: {
                label: 'Project files or photos (optional)',
                choose: 'Choose files',
                none: 'No files selected',
                accept: '.pdf,.dwg,.dxf,.jpg,.jpeg,.png',
                max_files: 5,
                max_total_mb: 20,
            },
        },
        consent: 'We use your details solely to respond to this inquiry.',
        submit: {
            buy: 'Send Inquiry',
            rent: 'Send Rental Inquiry',
        },
        success: 'Thank you! We received your inquiry. Darius will contact you within 24h on business days.',
        errors: {
            required: 'Please fill out this field',
            phone: 'Enter a valid phone number, e.g. +370 600 00000',
            email: 'Please check the email address',
            files: 'Up to 5 files, max 20 MB total (PDF, DWG, DXF, JPG, PNG)',
            server: 'Could not send inquiry. Please call +370 611 19158 or try again.',
        },
    },
};

const CONTENT_PL: PramoneiContent = {
    seo: {
        title: 'Kotłownie kontenerowe 100 kW – 2,5 MW | Produkcja w Kownie | Gilės inžinerija',
        description:
            'Kontenerowe kotłownie biomasowe 100 kW – 2,5 MW: produkcja i próby ciśnieniowe w Kownie, zakup lub wynajem. Ceny od 28 500 € netto, kalkulator zwrotu, schematy i wycena w 24h.',
        og_image: '/studio-assets/projects/giles-darbas-08.webp',
    },
    breadcrumb: ['Start', 'Przemysł'],
    hero: {
        eyebrow: 'PRODUKCJA W KOWNIE · SPRZEDAŻ · WYNAJEM',
        h1: 'Kotłownie kontenerowe 100 kW – 2,5 MW',
        lead: 'Montujemy i testujemy w zakładzie w Kownie, dostarczamy gotowe do podłączenia. Zrębka, pellet lub biogaz – zakup albo wynajem. Wycena w 24 godz. w dni robocze.',
        cta_primary: {
            label: 'Otrzymaj ofertę',
            href: '#industrial-rfq',
        },
        cta_secondary: {
            label: 'Modele i ceny',
            href: '#modeliai',
        },
        cta_tertiary: {
            label: 'Katalog PDF',
            href: '/files/giles-pramonei-katalogas.pdf',
            note: 'PDF w przygotowaniu',
        },
        facts: [
            { value: '100 kW – 2,5 MW', label: 'zakres mocy' },
            { value: '4–8 tyg.', label: 'produkcja i testy w Kownie' },
            { value: '16 obiektów', label: 'wyprodukowano i wdrożono' },
        ],
        image: {
            src: '/studio-assets/projects/giles-darbas-08.webp',
            alt: 'Modułowa kotłownia biomasowa 2,0 MW GK-2000 z magazynem paliwa i kominem',
            caption_title: 'GK-2000 · 2,0 MW',
            caption_text: 'Magazyn Walking-Floor · wielostopniowe odpylanie · SCADA',
        },
    },
    paths: [
        {
            segment: 'buy',
            eyebrow: 'ZAKUP',
            title: 'Stała kotłownia',
            text: 'Dla zakładów, szklarni, szkół i sieci ciepłowniczych. 100 kW – 2,5 MW.',
            price_from: 'od 28 500 € netto',
        },
        {
            segment: 'rent',
            eyebrow: 'WYNAJEM',
            title: 'Mobilna kotłownia',
            text: 'Na awarie, zimowe budowy, hale i sezonowe zapotrzebowanie.',
            price_from: 'od 700 €/mies. netto',
            price_source: 'assumption (MOB-ORO-90)',
        },
        {
            segment: 'special',
            eyebrow: 'SPECJALNE',
            title: 'Biogaz i dachowe gazowe',
            text: 'Biogazownie, przemysł spożywczy, kotłownie dachowe w kaskadzie.',
            price_from: 'Według projektu',
        },
    ],
    models_section: {
        eyebrow: 'MODELE',
        titles: {
            buy: 'Kotłownie na zakup i wynajem długoterminowy',
            rent: 'Mobilne kotłownie na wynajem',
            special: 'Rozwiązania specjalne',
            all: 'Wszystkie modele',
        },
        filters: {
            buy: 'Zakup',
            rent: 'Wynajem',
            special: 'Specjalne',
            all: 'Wszystkie',
        },
        vat_toggle: {
            net: 'Bez VAT',
            gross: 'Z VAT',
        },
        columns: [
            'Model',
            'Moc',
            'Ogrzewana pow.',
            'Magazyn paliwa',
            'Gabaryty',
            'Cena bez VAT | Cena z VAT',
            '',
        ],
        row_cta: 'Paszport modelu',
        price_on_request: 'Wg projektu',
        footnote:
            'Ceny bez montażu i przyłączenia. „≈” – cena orientacyjna, doprecyzowana w ofercie. Autonomia dla pelletu przy pełnej mocy; przy 50% obciążenia dwukrotnie dłużej. W paszporcie modelu: zdjęcia, 3 schematy, dane techniczne i DWG.',
    },
    assemblies: {
        eyebrow: 'BUDOWA',
        title: 'Pięć zespołów w jednym fabrycznym module',
        link: {
            label: 'Schematy: rzut, przekrój, hydraulika →',
            href: '/pl/pramonei/gk-2000#breziniai',
        },
        items: [
            {
                tag: '01 · K',
                title: 'Magazyn paliwa',
                text: '8–90 m³, ruchoma podłoga lub podajniki ślimakowe. Zrębka do W35 lub pellet.',
            },
            {
                tag: '02 · F',
                title: 'Podawanie i ochrona ppoż.',
                text: 'Podajnik ślimakowy z klapą ppoż., wydzielona przegroda ogniowa.',
            },
            {
                tag: '03 · B',
                title: 'Kocioł',
                text: 'Ruchomy ruszt, komora szamotowa, 3-ciągowy wymiennik P265GH, automatyczne odpopielanie.',
            },
            {
                tag: '04 · D',
                title: 'Odpylanie spalin',
                text: 'Multicyklon, filtr wg norm pozwolenia emisyjnego, wentylator wyciągowy z falownikiem.',
            },
            {
                tag: '05 · H/E',
                title: 'Hydraulika i sterowanie',
                text: 'Kolektor, pompy obiegowe, stabilizacja ciśnienia, PLC z telemetrią GSM/SCADA.',
            },
        ],
    },
    roi: {
        eyebrow: 'KALKULATOR ZWROTU',
        title: 'Ile zaoszczędzisz przechodząc na biomasę?',
        steps: ['1. Obecne paliwo', '2. Biomasa', '3. Roczne zapotrzebowanie na ciepło'],
        assumptions:
            'Założenia: ceny paliw wg średnich przedziałów BALTPOOL SM2, LEA i VERT ({version}); 2 100 godz. pełnego obciążenia rocznie i 10% rezerwy mocy; eksploatacja – 3% inwestycji rocznie oraz energia własna po 0,20 €/kWh. Dokładną kalkulację przygotujemy na podstawie rachunków.',
        result_labels: {
            eyebrow: 'WYNIK · {model}',
            net: 'Oszczędność netto rocznie',
            sizing: 'Wymagana moc ≈ {kw} kW → {model}',
            now: 'Obecnie · {fuel}',
            bio: 'Biomasa · {bio}',
            opex: 'Eksploatacja',
            invest: 'Inwestycja netto, od',
            payback: 'Okres zwrotu',
            rent: 'Lub wynajem: {rent}',
            no_payback: 'Brak zwrotu',
            exceeds: 'Dla większego zapotrzebowania dobieramy kaskadę wielomodułową',
        },
        cta: 'Otrzymaj wyliczenie wg moich rachunków',
    },
    projects_section: {
        eyebrow: 'ZREALIZOWANE OBIEKTY',
        title: 'Wyprodukowane i zamontowane',
        link: {
            label: 'Wszystkie 16 obiektów →',
            href: '/pl/inzinerija#atlikti-darbai',
        },
        fields: {
            equipment: 'Urządzenia',
            result: 'Rezultat',
            client: 'Obiekt',
            year: 'Rok',
        },
    },
    process: {
        eyebrow: 'PRZEBIEG',
        title: 'Od zapytania do uruchomienia ciepła',
        steps: [
            { n: '01', title: 'Audyt zapotrzebowania', text: '1–2 dni rob. · moc i logistyka paliwa' },
            { n: '02', title: 'Ocena pozwoleń', text: 'Budowa, emisje, warunki przyłączenia' },
            { n: '03', title: 'Projekt i produkcja w Kownie', text: '4–8 tygodni' },
            { n: '04', title: 'Dostawa i podłączenie', text: '1–2 dni' },
            { n: '05', title: 'Rozruch i pomiar emisji', text: '1 dzień · protokół spalin' },
            { n: '06', title: 'Telemetria i serwis', text: 'SCADA / GSM · umowa SLA' },
        ],
    },
    documents: {
        title: 'Wraz z kotłownią otrzymujesz',
        items: [
            { label: 'Deklaracja zgodności i CE', format: 'PDF' },
            { label: 'Paszport techniczny (12 parametrów)', format: 'PDF' },
            { label: 'Schematy: rzut, przekrój, hydraulika', format: 'DWG · PDF' },
            { label: 'Protokół fabrycznej próby ciśnieniowej', format: 'PDF' },
            { label: 'Protokół analizy spalin', format: 'PDF' },
            { label: 'Instrukcja eksploatacji', format: 'PDF' },
        ],
    },
    faq: {
        title: 'Najczęstsze pytania',
        items: [
            {
                q: 'Czy wymagane jest pozwolenie na budowę?',
                a: 'Zależy od obiektu. Zgodnie z STR 1.05.01:2017 i warunkami lokalnymi oceniamy wymagania dot. pozwolenia budowlanego, emisyjnego oraz przyłączeniowego i wpisujemy harmonogram do oferty.',
            },
            {
                q: 'Ile trwa produkcja kotłowni?',
                a: 'Produkcja w zakładzie w Kownie trwa 4–8 tygodni od umowy. Dostawa i podłączenie – 1–2 dni, rozruch i regulacja spalania – 1 dzień.',
            },
            {
                q: 'Jakie paliwo można stosować?',
                a: 'Zrębkę drzewną G30–G50 (wilgotność do W35), pellet przemysłowy ENplus A1/A2, brykiet. Modele BIO pracują na biogazie z rezerwą pelletową.',
            },
            {
                q: 'Jak długo kotłownia pracuje bez załadunku paliwa?',
                a: 'Zależy od bunkra, paliwa i obciążenia. Np. GK-500 z 18 m³ pelletu pracuje ok. 4,5 doby przy pełnej mocy i ok. 9 dób przy 50% obciążenia.',
            },
            {
                q: 'Czy można wynająć kotłownię?',
                a: 'Tak. Kotłownie serii GK – od 1 250 €/mies. netto, mobilne kotłownie MOB – do ogrzewania awaryjnego i tymczasowego.',
            },
            {
                q: 'Jaka jest gwarancja i serwis?',
                a: 'Udzielamy 24 mies. gwarancji na urządzenia. Kotłownie posiadają telemetrię GSM/SCADA do zdalnej diagnostyki. Serwis: +370 693 97098.',
            },
        ],
    },
    rfq: {
        anchor_id: 'industrial-rfq',
        eyebrow: 'ZAPYTANIE',
        title: 'Otrzymaj ofertę dla swojego obiektu',
        lead: 'Zapytanie trafia bezpośrednio do inżyniera. Kosztorys przygotowujemy w 24 godz. w dni robocze (pon.–pt. 8:30–17:30).',
        contact: {
            name: 'Darius, inżynier',
            phone: '+370 611 19158',
            service_phone: '+370 693 97098',
        },
        modes: {
            buy: 'Zakup',
            rent: 'Wynajem',
        },
        fields: {
            company_city: {
                label: 'Firma i miasto',
                required: true,
                autocomplete: 'organization',
            },
            phone: {
                label: 'Telefon',
                required: true,
                placeholder: '+370',
                autocomplete: 'tel',
            },
            email: {
                label: 'E-mail',
                required: false,
                autocomplete: 'email',
            },
            power: {
                label: 'Wymagana moc',
                options: [
                    'Nie wiem – pomóżcie dobrać',
                    '100–250 kW',
                    '250–500 kW',
                    '500 kW – 1 MW',
                    '1–2,5 MW',
                ],
            },
            fuel: {
                label: 'Paliwo',
                options: ['Zrębka', 'Pellet', 'Biogaz', 'Jeszcze nie wiem'],
            },
            model: {
                label: 'Model',
                hidden_unless_prefilled: true,
            },
            files: {
                label: 'Projekt lub zdjęcia (opcjonalnie)',
                choose: 'Wybierz pliki',
                none: 'Nie wybrano plików',
                accept: '.pdf,.dwg,.dxf,.jpg,.jpeg,.png',
                max_files: 5,
                max_total_mb: 20,
            },
        },
        consent: 'Dane wykorzystujemy wyłącznie do odpowiedzi na zapytanie.',
        submit: {
            buy: 'Wyślij zapytanie',
            rent: 'Wyślij zapytanie o wynajem',
        },
        success: 'Dziękujemy! Otrzymaliśmy zapytanie. Darius skontaktuje się w ciągu 24 godz. w dni robocze.',
        errors: {
            required: 'Wypełnij to pole',
            phone: 'Podaj numer telefonu, np. +370 600 00000',
            email: 'Sprawdź adres e-mail',
            files: 'Do 5 plików, łącznie do 20 MB (PDF, DWG, DXF, JPG, PNG)',
            server: 'Nie udało się wysłać. Zadzwoń +370 611 19158 lub spróbuj ponownie.',
        },
    },
};

const CONTENT_RU: PramoneiContent = {
    seo: {
        title: 'Контейнерные котельные 100 кВт – 2,5 МВт | Производство в Каунасе | Gilės inžinerija',
        description:
            'Контейнерные биокотельные 100 кВт – 2,5 МВт: сборка и испытания в Каунасе, покупка или аренда. Цены от 28 500 € без НДС, калькулятор окупаемости, схемы и смета за 24 ч.',
        og_image: '/studio-assets/projects/giles-darbas-08.webp',
    },
    breadcrumb: ['Главная', 'Промышленность'],
    hero: {
        eyebrow: 'ПРОИЗВОДСТВО В КАУНАСЕ · ПРОДАЖА · АРЕНДА',
        h1: 'Контейнерные котельные 100 кВт – 2,5 МВт',
        lead: 'Собираем и испытываем на заводе в Каунасе, привозим готовыми к подключению. Щепа, пеллеты или биогаз – покупка или аренда. Смета за 24 ч в рабочие дни.',
        cta_primary: {
            label: 'Получить предложение',
            href: '#industrial-rfq',
        },
        cta_secondary: {
            label: 'Модели и цены',
            href: '#modeliai',
        },
        cta_tertiary: {
            label: 'Каталог PDF',
            href: '/files/giles-pramonei-katalogas.pdf',
            note: 'PDF в разработке',
        },
        facts: [
            { value: '100 кВт – 2,5 МВт', label: 'диапазон мощности' },
            { value: '4–8 нед.', label: 'производство и испытания в Каунасе' },
            { value: '16 объектов', label: 'изготовлено и смонтировано' },
        ],
        image: {
            src: '/studio-assets/projects/giles-darbas-08.webp',
            alt: 'Модульная биокотельная 2,0 МВт GK-2000 со складом топлива и дымовой трубой',
            caption_title: 'GK-2000 · 2,0 МВт',
            caption_text: 'Склад Walking-Floor · многоступенчатая очистка дымовых газов · SCADA',
        },
    },
    paths: [
        {
            segment: 'buy',
            eyebrow: 'ПОКУПКА',
            title: 'Стационарная котельная',
            text: 'Для заводов, теплиц, школ и кварталов. 100 кВт – 2,5 МВт.',
            price_from: 'от 28 500 € без НДС',
        },
        {
            segment: 'rent',
            eyebrow: 'АРЕНДА',
            title: 'Мобильная котельная',
            text: 'Для аварий, зимнего строительства, ангаров и сезонных нагрузок.',
            price_from: 'от 700 €/мес. без НДС',
            price_source: 'assumption (MOB-ORO-90)',
        },
        {
            segment: 'special',
            eyebrow: 'СПЕЦИАЛЬНЫЕ',
            title: 'Биогазовые и крышные газовые',
            text: 'Биогазовые станции, пищевая промышленность, крышные котельные.',
            price_from: 'По проекту',
        },
    ],
    models_section: {
        eyebrow: 'МОДЕЛИ',
        titles: {
            buy: 'Котельные для покупки и долгосрочной аренды',
            rent: 'Мобильные котельные в аренду',
            special: 'Специальные решения',
            all: 'Все модели',
        },
        filters: {
            buy: 'Покупка',
            rent: 'Аренда',
            special: 'Специальные',
            all: 'Все',
        },
        vat_toggle: {
            net: 'Без НДС',
            gross: 'С НДС',
        },
        columns: [
            'Модель',
            'Мощность',
            'Отапливаемая пл.',
            'Склад топлива',
            'Габариты',
            'Цена без НДС | Цена с НДС',
            '',
        ],
        row_cta: 'Паспорт модели',
        price_on_request: 'По проекту',
        footnote:
            'Цены без монтажа и подключения. «≈» – ориентировочная цена, уточняется в предложении. Автономия – на пеллетах при полной мощности; при нагрузке 50% – вдвое дольше. В паспорте модели: фото, 3 схемы, техданные и DWG.',
    },
    assemblies: {
        eyebrow: 'УСТРОЙСТВО',
        title: 'Пять узлов в единой заводской системе',
        link: {
            label: 'Чертежи: план, разрез, гидравлика →',
            href: '/ru/pramonei/gk-2000#breziniai',
        },
        items: [
            {
                tag: '01 · K',
                title: 'Склад топлива',
                text: '8–90 м³, подвижный пол или шнеки. Щепа до W35 или пеллеты.',
            },
            {
                tag: '02 · F',
                title: 'Подача и противопожарная защита',
                text: 'Шнековый транспортер с противопожарным клапаном и перегородкой.',
            },
            {
                tag: '03 · B',
                title: 'Котел',
                text: 'Подвижные колосники, шамотная топка, 3-ходовой теплообменник P265GH, автозолоудаление.',
            },
            {
                tag: '04 · D',
                title: 'Очистка дымовых газов',
                text: 'Мультициклон, фильтр по нормам разрешения на выбросы, дымосос с ЧРП.',
            },
            {
                tag: '05 · H/E',
                title: 'Гидравлика и управление',
                text: 'Коллектор, насосы, поддержание давления, ПЛК с телеметрией GSM/SCADA.',
            },
        ],
    },
    roi: {
        eyebrow: 'КАЛЬКУЛЯТОР ОКУПАЕМОСТИ',
        title: 'Сколько вы сэкономите при переходе на биотопливо?',
        steps: ['1. Текущее топливо', '2. Биотопливо', '3. Годовая потребность в тепле'],
        assumptions:
            'Допущения: цены топлива – средние значения диапазонов BALTPOOL SM2, LEA и VERT ({version}); 2 100 часов полной нагрузки в год и 10% резерв мощности; эксплуатация – 3% инвестиций в год и электроэнергия собственных нужд по 0,20 €/кВт·ч. Точный расчет подготовим по вашим счетам.',
        result_labels: {
            eyebrow: 'РЕЗУЛЬТАТ · {model}',
            net: 'Чистая экономия в год',
            sizing: 'Требуемая мощность ≈ {kw} кВт → {model}',
            now: 'Сейчас · {fuel}',
            bio: 'Биотопливо · {bio}',
            opex: 'Эксплуатация',
            invest: 'Инвестиция без НДС, от',
            payback: 'Окупаемость',
            rent: 'Или аренда: {rent}',
            no_payback: 'Не окупается',
            exceeds: 'Для большей потребности предлагаем каскад из нескольких модулей',
        },
        cta: 'Получить расчет по моим счетам',
    },
    projects_section: {
        eyebrow: 'РЕАЛИЗОВАННЫЕ ОБЪЕКТЫ',
        title: 'Изготовлено и смонтировано',
        link: {
            label: 'Все 16 объектов →',
            href: '/ru/inzinerija#atlikti-darbai',
        },
        fields: {
            equipment: 'Оборудование',
            result: 'Результат',
            client: 'Объект',
            year: 'Год',
        },
    },
    process: {
        eyebrow: 'ЭТАПЫ',
        title: 'От заявки до подачи тепла',
        steps: [
            { n: '01', title: 'Аудит теплопотребления', text: '1–2 раб. дн. · нагрузка и логистика' },
            { n: '02', title: 'Оценка разрешений', text: 'Строительство, выбросы, подключение' },
            { n: '03', title: 'Проект и сборка в Каунасе', text: '4–8 недель' },
            { n: '04', title: 'Доставка и подключение', text: '1–2 дня' },
            { n: '05', title: 'Пусконаладка и замер выбросов', text: '1 день · протокол дымовых газов' },
            { n: '06', title: 'Телеметрия и сервис', text: 'SCADA / GSM · договор SLA' },
        ],
    },
    documents: {
        title: 'Вместе с котельной вы получаете',
        items: [
            { label: 'Декларация соответствия и CE', format: 'PDF' },
            { label: 'Технический паспорт (12 параметров)', format: 'PDF' },
            { label: 'Чертежи: план, разрез, гидравлика', format: 'DWG · PDF' },
            { label: 'Акт заводских гидравлических испытаний', format: 'PDF' },
            { label: 'Протокол газоанализа', format: 'PDF' },
            { label: 'Инструкция по эксплуатации', format: 'PDF' },
        ],
    },
    faq: {
        title: 'Частые вопросы',
        items: [
            {
                q: 'Нужно ли разрешение на строительство?',
                a: 'Зависит от объекта. Согласно STR 1.05.01:2017 и местным условиям оцениваем необходимость разрешения на строительство, выбросы и подключение, и включаем план в предложение.',
            },
            {
                q: 'За какое время изготавливается котельная?',
                a: 'Производство в цехе в Каунасе занимает 4–8 недель от договора. Доставка и подключение – 1–2 дня, пусконаладка – 1 день.',
            },
            {
                q: 'Какое топливо можно использовать?',
                a: 'Древесную щепу G30–G50 (влажность до W35), промышленные пеллеты ENplus A1/A2, брикеты. Модели BIO работают на биогазе с пеллетным резервом.',
            },
            {
                q: 'Сколько времени котельная работает без дозагрузки?',
                a: 'Зависит от бункера, топлива и нагрузки. Например, GK-500 с 18 м³ пеллет работает около 4,5 суток на полной мощности и около 9 суток при 50% нагрузке.',
            },
            {
                q: 'Можно ли арендовать котельную?',
                a: 'Да. Котельные серии GK – от 1 250 €/мес. без НДС, мобильные котельные MOB – для аварийного и временного отопления.',
            },
            {
                q: 'Какая гарантия и сервис?',
                a: 'На оборудование предоставляем гарантию 24 мес. Котельные оснащены телеметрией GSM/SCADA для удаленной диагностики. Сервис: +370 693 97098.',
            },
        ],
    },
    rfq: {
        anchor_id: 'industrial-rfq',
        eyebrow: 'ЗАЯВКА',
        title: 'Получите предложение для вашего объекта',
        lead: 'Заявка сразу поступает инженеру. Смету готовим за 24 ч в рабочие дни (Пн–Пт 8:30–17:30).',
        contact: {
            name: 'Дарюс, инженер',
            phone: '+370 611 19158',
            service_phone: '+370 693 97098',
        },
        modes: {
            buy: 'Купить',
            rent: 'Арендовать',
        },
        fields: {
            company_city: {
                label: 'Компания и город',
                required: true,
                autocomplete: 'organization',
            },
            phone: {
                label: 'Телефон',
                required: true,
                placeholder: '+370',
                autocomplete: 'tel',
            },
            email: {
                label: 'Эл. почта',
                required: false,
                autocomplete: 'email',
            },
            power: {
                label: 'Требуемая мощность',
                options: [
                    'Не знаю – помогите оценить',
                    '100–250 кВт',
                    '250–500 кВт',
                    '500 кВт – 1 МВт',
                    '1–2,5 МВт',
                ],
            },
            fuel: {
                label: 'Топливо',
                options: ['Щепа', 'Пеллеты', 'Биогаз', 'Еще не знаю'],
            },
            model: {
                label: 'Модель',
                hidden_unless_prefilled: true,
            },
            files: {
                label: 'Проект или фото (необязательно)',
                choose: 'Выбрать файлы',
                none: 'Файлы не выбраны',
                accept: '.pdf,.dwg,.dxf,.jpg,.jpeg,.png',
                max_files: 5,
                max_total_mb: 20,
            },
        },
        consent: 'Данные используются только для ответа на заявку.',
        submit: {
            buy: 'Отправить заявку',
            rent: 'Отправить заявку на аренду',
        },
        success: 'Спасибо! Заявка получена. Дарюс свяжется с вами в течение 24 ч в рабочие дни.',
        errors: {
            required: 'Заполните это поле',
            phone: 'Введите номер телефона, напр., +370 600 00000',
            email: 'Проверьте адрес эл. почты',
            files: 'До 5 файлов, всего до 20 МБ (PDF, DWG, DXF, JPG, PNG)',
            server: 'Не удалось отправить. Позвоните +370 611 19158 или попробуйте снова.',
        },
    },
};

export function getPramoneiContent(locale: AppLocale): PramoneiContent {
    if (locale === 'en') return CONTENT_EN;
    if (locale === 'pl') return CONTENT_PL;
    if (locale === 'ru') return CONTENT_RU;
    return rawContentLt;
}

const MODEL_KIND_I18N: Record<string, Record<AppLocale, string>> = {
    'gk-100': {
        lt: 'Konteinerinė biokuro katilinė',
        en: 'Containerized biomass boiler plant',
        pl: 'Kontenerowa kotłownia biomasowa',
        ru: 'Контейнерная биокотельная',
    },
    'gk-250': {
        lt: 'Konteinerinė biokuro katilinė',
        en: 'Containerized biomass boiler plant',
        pl: 'Kontenerowa kotłownia biomasowa',
        ru: 'Контейнерная биокотельная',
    },
    'gk-500': {
        lt: 'Konteinerinė biokuro katilinė',
        en: 'Containerized biomass boiler plant',
        pl: 'Kontenerowa kotłownia biomasowa',
        ru: 'Контейнерная биокотельная',
    },
    'gk-750': {
        lt: 'Pramoninė biokuro katilinė',
        en: 'Industrial biomass boiler plant',
        pl: 'Przemysłowa kotłownia biomasowa',
        ru: 'Промышленная биокотельная',
    },
    'gk-1000': {
        lt: 'Kaskadinė katilinė 2 × 500 kW',
        en: 'Cascade boiler plant 2 × 500 kW',
        pl: 'Kotłownia kaskadowa 2 × 500 kW',
        ru: 'Каскадная котельная 2 × 500 кВт',
    },
    'gk-2000': {
        lt: 'Kaskadinė katilinė 2 × 1 000 kW',
        en: 'Cascade boiler plant 2 × 1 000 kW (N+1)',
        pl: 'Kotłownia kaskadowa 2 × 1 000 kW (N+1)',
        ru: 'Каскадная котельная 2 × 1 000 кВт (N+1)',
    },
    'gk-2500': {
        lt: 'Modulinė katilinė 2–3 moduliai',
        en: 'Modular boiler plant (2–3 modules)',
        pl: 'Kotłownia modułowa (2–3 moduły)',
        ru: 'Модульная котельная (2–3 модуля)',
    },
    'mob-500': {
        lt: 'Mobili katilinė ant važiuoklės',
        en: 'Mobile boiler plant on chassis',
        pl: 'Mobilna kotłownia na podwoziu',
        ru: 'Мобильная котельная на шасси',
    },
    'pellmobil-120': {
        lt: 'Mobili granulinė katilinė + karštas vanduo',
        en: 'Mobile pellet boiler room + DHW',
        pl: 'Mobilna kotłownia pelletowa + CWU',
        ru: 'Мобильная пеллетная котельная + ГВС',
    },
    'mob-oro-190': {
        lt: 'Karšto oro katilinė',
        en: 'Hot-air heating unit (up to 14 500 m³/h)',
        pl: 'Kotłownia gorącego powietrza (do 14 500 m³/h)',
        ru: 'Воздушная котельная (до 14 500 м³/ч)',
    },
    'mob-oro-90': {
        lt: 'Mobilus karšto oro šildytuvas',
        en: 'Mobile hot-air heater',
        pl: 'Mobilna nagrzewnica powietrza',
        ru: 'Мобильный воздухонагреватель',
    },
    'bio-dujos-800': {
        lt: 'Biodujų ir kombinuoto kuro katilinė',
        en: 'Biogas & dual-fuel boiler plant',
        pl: 'Kotłownia biogazowa z rezerwą pelletową',
        ru: 'Биогазовая и комбинированная котельная',
    },
    'gd-500': {
        lt: 'Stoginė dujinė katilinė (kaskada)',
        en: 'Rooftop gas boiler room (cascade)',
        pl: 'Dachowa kotłownia gazowa (kaskada)',
        ru: 'Крышная газовая котельная (каскад)',
    },
};

export function getLocalizedIndustrialModels(locale: AppLocale): IndustrialModel[] {
    if (locale === 'lt') return INDUSTRIAL_MODELS_FILE.models;
    return INDUSTRIAL_MODELS_FILE.models.map((m) => ({
        ...m,
        kind: MODEL_KIND_I18N[m.slug]?.[locale] ?? m.kind,
    }));
}

export function getIndustrialModelBySlug(
    slug: string,
    locale: AppLocale = 'lt',
): IndustrialModel | undefined {
    const clean = slug.toLowerCase().trim();
    return getLocalizedIndustrialModels(locale).find((m) => m.slug === clean);
}

const PROJECTS_I18N: Record<
    string,
    Record<AppLocale, { title: string; equipment: string; result: string; tag?: string }>
> = {
    'gk-500-gamyklinis': {
        lt: {
            title: 'Konteinerinė biokuro katilinė, gamyklinis surinkimas',
            equipment: 'Judančios ardelės, multiciklonas, GSM/SCADA',
            result: 'Atvežta hidrauliškai išbandyta ir izoliuota',
        },
        en: {
            title: 'Containerized biomass boiler plant, factory assembly',
            equipment: 'Moving grates, multicyclone, GSM/SCADA',
            result: 'Delivered hydrostatically tested and insulated',
        },
        pl: {
            title: 'Kontenerowa kotłownia biomasowa, montaż fabryczny',
            equipment: 'Ruchomy ruszt, multicyklon, GSM/SCADA',
            result: 'Dostarczona po próbie ciśnieniowej i zaizolowana',
        },
        ru: {
            title: 'Контейнерная биокотельная, заводская сборка',
            equipment: 'Подвижные колосники, мультициклон, GSM/SCADA',
            result: 'Доставлена гидравлически испытанной и утепленной',
        },
    },
    'gk-750': {
        lt: {
            title: 'Pramoninė biokuro katilinė',
            equipment: 'Dūmsiurbė su dažnio keitikliu, multiciklonas, automatinis pelenų šalinimas',
            result: 'Pilna telemetrija, 6 bar hidraulinis mazgas',
        },
        en: {
            title: 'Industrial biomass boiler plant',
            equipment: 'VFD draft fan, multicyclone, automatic de-ashing',
            result: 'Full telemetry, 6 bar hydronic manifold',
        },
        pl: {
            title: 'Przemysłowa kotłownia biomasowa',
            equipment: 'Wentylator wyciągowy z falownikiem, multicyklon, automatyczne odpopielanie',
            result: 'Pełna telemetria, węzeł hydrauliczny 6 bar',
        },
        ru: {
            title: 'Промышленная биокотельная',
            equipment: 'Дымосос с ЧРП, мультициклон, автоматическое золоудаление',
            result: 'Полная телеметрия, гидравлический узел 6 бар',
        },
    },
    'gk-2000': {
        lt: {
            title: 'Modulinė katilinė su kuro sandėliu',
            equipment: 'Walking-Floor sandėlis, daugiapakopis dūmų valymas',
            result: 'SCADA dispečerinis valdymas',
        },
        en: {
            title: 'Modular boiler plant with fuel store',
            equipment: 'Walking-Floor bunker, multi-stage flue filtration',
            result: 'SCADA supervisory control',
        },
        pl: {
            title: 'Kotłownia modułowa z magazynem paliwa',
            equipment: 'Magazyn Walking-Floor, wielostopniowe odpylanie',
            result: 'Nadzór dyspozytorski SCADA',
        },
        ru: {
            title: 'Модульная котельная со складом топлива',
            equipment: 'Склад Walking-Floor, многоступенчатая очистка дыма',
            result: 'Диспетчерское управление SCADA',
        },
    },
    mob: {
        lt: {
            title: 'Mobili katilinė nuomai ir avarijoms',
            equipment: 'Greito prijungimo DN50/DN65 movos, integruotas bunkeris',
            result: 'Šildymas trasų rekonstrukcijos ir statybų metu',
        },
        en: {
            title: 'Mobile boiler room for rental & emergencies',
            equipment: 'Quick-connect DN50/DN65 couplings, integrated hopper',
            result: 'Continuous heat during grid reconstruction & winter builds',
        },
        pl: {
            title: 'Mobilna kotłownia na wynajem i awarie',
            equipment: 'Szybkozłącza DN50/DN65, zintegrowany zasobnik',
            result: 'Ogrzewanie podczas przebudowy sieci i budowy zimą',
        },
        ru: {
            title: 'Мобильная котельная для аренды и аварий',
            equipment: 'Быстроразъемные муфты DN50/DN65, встроенный бункер',
            result: 'Отопление при реконструкции сетей и зимнем строительстве',
        },
    },
    'gd-500': {
        lt: {
            title: 'Stoginė dujinė katilinė su kaskada',
            equipment: 'Kaskadiniai dujiniai katilai, nerūdijantys dūmtraukiai',
            result: 'Sumontuota ant stogo be vidaus ploto praradimo',
        },
        en: {
            title: 'Rooftop cascade gas boiler plant',
            equipment: 'Cascade condensing gas boilers, stainless flues',
            result: 'Roof-mounted with zero indoor floor footprint loss',
        },
        pl: {
            title: 'Dachowa kotłownia gazowa w kaskadzie',
            equipment: 'Kaskadowe kotły gazowe, kominy ze stali nierdzewnej',
            result: 'Zamontowana na dachu bez utraty powierzchni wewnątrz',
        },
        ru: {
            title: 'Крышная каскадная газовая котельная',
            equipment: 'Каскадные газовые котлы, нержавеющие дымоходы',
            result: 'Смонтирована на крыше без потери внутренней площади',
        },
    },
    'mazgas-200': {
        lt: {
            tag: 'Šilumos mazgas · 200 kW',
            title: 'Katilinės hidraulinis mazgas',
            equipment: 'Elektroniniai siurbliai, IMI TA STAD/STAP, Pneumatex',
            result: 'Tiksliai subalansuoti kontūrų srautai',
        },
        en: {
            tag: 'Hydronic Substation · 200 kW',
            title: 'Boiler Room Hydronic Manifold',
            equipment: 'Electronic pumps, IMI TA STAD/STAP, Pneumatex',
            result: 'Precisely balanced circuit flow rates',
        },
        pl: {
            tag: 'Węzeł cieplny · 200 kW',
            title: 'Węzeł hydrauliczny kotłowni',
            equipment: 'Pompy elektroniczne, IMI TA STAD/STAP, Pneumatex',
            result: 'Precyzyjnie zrównoważone przepływy obiegów',
        },
        ru: {
            tag: 'Тепловой узел · 200 кВт',
            title: 'Гидравлический узел котельной',
            equipment: 'Электронные насосы, IMI TA STAD/STAP, Pneumatex',
            result: 'Точно сбалансированные потоки контуров',
        },
    },
};

export function getLocalizedProjects(locale: AppLocale): PramoneiProject[] {
    if (locale === 'lt') return PRAMONEI_PROJECTS;
    return PRAMONEI_PROJECTS.map((p) => {
        const tr = PROJECTS_I18N[p.id]?.[locale];
        if (!tr) return p;
        return {
            ...p,
            tag: tr.tag ?? p.tag,
            title: tr.title,
            equipment: tr.equipment,
            result: tr.result,
        };
    });
}

export const FUEL_LABELS_I18N: Record<string, Record<AppLocale, string>> = {
    gas: {
        lt: 'Gamtinės dujos',
        en: 'Natural gas',
        pl: 'Gaz ziemny',
        ru: 'Природный газ',
    },
    lpg_oil: {
        lt: 'Suskystintos dujos / dyzelinas',
        en: 'LPG / heating diesel',
        pl: 'Gaz płynny LPG / olej opałowy',
        ru: 'Сжиженный газ / дизтопливо',
    },
    district: {
        lt: 'Centrinis šildymas',
        en: 'District heating',
        pl: 'Ciepło sieciowe',
        ru: 'Центральное отопление',
    },
    electric: {
        lt: 'Elektra',
        en: 'Electricity',
        pl: 'Energia elektryczna',
        ru: 'Электроэнергия',
    },
    chips: {
        lt: 'Medienos skiedra (SM2, W30–W35)',
        en: 'Wood chips (SM2, W30–W35)',
        pl: 'Zrębka drzewna (SM2, W30–W35)',
        ru: 'Древесная щепа (SM2, W30–W35)',
    },
    pellets: {
        lt: 'Pramoninės granulės ENplus A1/A2',
        en: 'Industrial pellets ENplus A1/A2',
        pl: 'Pellet przemysłowy ENplus A1/A2',
        ru: 'Промышленные пеллеты ENplus A1/A2',
    },
};
