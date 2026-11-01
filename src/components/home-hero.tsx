'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Check, ZoomIn, X } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import {
    HVAC_SYSTEM_GROUPS,
    BRAND_SHOWCASE_ITEMS,
    HERO_FLAGSHIP_SHOWCASE,
} from '../lib/v3-description';
import { HERO_SCHEMATIC_HOTSPOTS, GILES_COMPANY_IDENTITY } from '../lib/giles-masterpiece-data';
import { GILES_COMPLETED_WORKS } from '../lib/giles-completed-works-data';
import { useVatDisplayStore } from '../store/vat-display';
import { assetUrl } from '../lib/api';
import { resolveAppLocale } from '../i18n/storefront-ui-copy';
import { useStorefrontConfig } from './storefront-config-provider';
import { formatCatalogCount } from '../lib/w121-honest-commerce';
import type { AppLocale } from '../i18n/routing';
import { CatalogSearchForm } from './catalog-search-form';
import { GilesHeroAnimatedSchematic } from './giles-animated-schematics';

const cleanDash = (s: string) => s.replace(/\u2014/g, '–');

export interface HeroQuickCategoryCard {
    id: string;
    title: string;
    subtitle: string;
    href: string;
    imageUrl: string;
    badge: string;
}

export const HERO_QUICK_CATEGORIES: HeroQuickCategoryCard[] = [
    {
        id: 'boiler-conversion-wizard',
        title: '1. Katilo perdarymo vedlys',
        subtitle: 'Viadrus, Kalvis, Atmos, Stropuva',
        href: '/vedlys',
        imageUrl: '/images/products/giles-studio-01-mpb-nani-35-50.webp',
        badge: '5–300 kW mazgai',
    },
    {
        id: 'eshop-catalog',
        title: '2. El. parduotuvė ({count} poz.)',
        subtitle: 'Katilai, degikliai, vožtuvai, dalys',
        href: '/products',
        imageUrl: '/images/products/giles-studio-06-megatherm-burner-kit.webp',
        badge: '28 gamintojai',
    },
    {
        id: 'industrial-boiler-rooms',
        title: '3. Konteinerinės katilinės pramonei',
        subtitle: 'Gamyba, pardavimas ir nuoma',
        href: '/pramonei',
        imageUrl: '/images/products/giles-studio-22-container-boiler-500kw.webp',
        badge: '100 kW – 2,5 MW',
    },
    {
        id: 'haier-heat-pumps-boilers',
        title: '4. Šilumos siurbliai Haier ir katilai',
        subtitle: 'Haier R290/R32, KaTRI, Centrometal',
        href: '/products?brand=haier',
        imageUrl: '/images/products/giles-studio-21-haier-super-aqua-r290.webp',
        badge: '465 Haier modeliai',
    },
];

export interface HydronicZoneItem {
    sku: string;
    brand: string;
    brandLogoUrl: string;
    title: string;
    specSummary: string;
    imageUrl: string;
    href: string;
}

export interface HeroBrandPill {
    slug: string;
    name: string;
    logoUrl: string;
}

export const HERO_BRAND_LINEUP: HeroBrandPill[] = [
    { slug: 'giles-inzinerija', name: 'Gilės Inžinerija', logoUrl: '/images/brands/giles-inzinerija.svg' },
    { slug: 'comisa', name: 'Comisa', logoUrl: '/images/brands/comisa.svg' },
    { slug: 'centrometal', name: 'Centrometal', logoUrl: '/images/brands/centrometal.svg' },
    { slug: 'drazice', name: 'Dražice', logoUrl: '/images/brands/drazice.svg' },
    { slug: 'danfoss', name: 'Danfoss', logoUrl: '/images/brands/danfoss.svg' },
    { slug: 'imi-heimeier', name: 'IMI Heimeier', logoUrl: '/images/brands/imi-heimeier.svg' },
    { slug: 'imi-pneumatex', name: 'IMI Pneumatex', logoUrl: '/images/brands/imi-pneumatex.svg' },
    { slug: 'imi-ta', name: 'IMI TA', logoUrl: '/images/brands/imi-ta.svg' },
    { slug: 'viessmann', name: 'Viessmann', logoUrl: '/images/brands/viessmann.svg' },
    { slug: 'wilo', name: 'Wilo', logoUrl: '/images/brands/wilo.svg' },
    { slug: 'grundfos', name: 'Grundfos', logoUrl: '/images/brands/grundfos.svg' },
    { slug: 'ferroli', name: 'Ferroli', logoUrl: '/images/brands/ferroli.svg' },
    { slug: 'pelltech', name: 'Pelltech', logoUrl: '/images/brands/pelltech.svg' },
    { slug: 'megatherm', name: 'Megatherm', logoUrl: '/images/brands/megatherm.svg' },
];

export interface HeroSystemPill {
    id: string;
    label: string;
    href: string;
    isHighlight?: boolean;
}

export const HERO_SYSTEM_PILLS: HeroSystemPill[] = [
    {
        id: 'katilai-degikliai',
        label: 'Katilai ir granulių degikliai',
        href: '/products?category=%C5%A0ildymo%20katilai%20ir%20krosnel%C4%97s',
    },
    {
        id: 'grindinis-comisa',
        label: 'Grindinis šildymas ir Comisa kolektoriai',
        href: '/products?category=Grindinis%20%C5%A1ildymas%20ir%20kolektoriai',
    },
    {
        id: 'vandens-sildytuvai',
        label: 'Vandens šildytuvai (Dražice / Gorenje)',
        href: '/products?category=Vandens%20%C5%A1ildytuvai%20ir%20akumuliacin%C4%97s%20talpos',
    },
    {
        id: 'radiatoriai-termostatai',
        label: 'Radiatoriai ir termostatiniai mazgai',
        href: '/products?category=Termostatin%C4%97s%20galvut%C4%97s%20ir%20vo%C5%BEtuvai',
    },
    {
        id: 'balansiniai-hidraulika',
        label: 'Balansiniai vožtuvai ir hidraulika',
        href: '/products?category=Balansiniai%20ir%20reguliavimo%20vo%C5%BEtuvai',
    },
    {
        id: 'pletimosi-siurbliai-nuorintuvai',
        label: 'Plėtimosi indai, siurbliai ir nuorintuvai',
        href: '/products?category=Pl%C4%97timosi%20indai%20ir%20sl%C4%97gio%20palaikymas',
    },
    {
        id: 'sisteminiai-paketai',
        label: 'Sisteminiai paketai (/paketai)',
        href: '/paketai',
    },
    {
        id: 'inzinerija-montavimas',
        label: 'Inžinerija ir montavimas (/inzinerija)',
        href: '/inzinerija',
    },
    {
        id: 'irangos-skaiciuokle',
        label: 'Įrangos skaičiuoklė',
        href: '/skaiciuokle',
        isHighlight: true,
    },
];

export interface HydronicHouseZone {
    id: string;
    number: number;
    tabLabel: string;
    zoneTitle: string;
    engineeringParam: string;
    plainHint: string;
    calculatorHref: string;
    categoryHref: string;
    items: HydronicZoneItem[];
}

export const HYDRONIC_HOUSE_ZONES: HydronicHouseZone[] = [
    {
        id: 'radiatoriai',
        number: 1,
        tabLabel: '[1] Radiatoriai ir galvutės',
        zoneTitle: '1 zona: Radiatorių termostatika ir H-blokai (ΔT 15K)',
        engineeringParam: 'Radiatoriai ΔT 15K · M30×1,5 / RA Click · AFC 10–150 l/h',
        plainHint: 'Palaiko tikslią kambario temperatūrą ir riboja srautą be radiatoriaus ūžimo.',
        calculatorHref: '/skaiciuokle?tab=radiator',
        categoryHref: '/products?category=Termostatin%C4%97s%20galvut%C4%97s%20ir%20vo%C5%BEtuvai',
        items: [
            {
                sku: HERO_FLAGSHIP_SHOWCASE[0]?.sku || '013G2970',
                brand: 'Danfoss',
                brandLogoUrl: '/images/brands/danfoss.svg',
                title: 'Danfoss RA 2970 termostatinė galvutė',
                specSummary: 'RA Click · 5–26 °C · Greita reakcija',
                imageUrl: '/images/products/013g2970.webp',
                href: '/products?q=013G2970',
            },
            {
                sku: HERO_FLAGSHIP_SHOWCASE[1]?.sku || '3933-02.000',
                brand: 'IMI Heimeier',
                brandLogoUrl: '/images/brands/imi-heimeier.svg',
                title: 'IMI Heimeier Eclipse DN15 vožtuvas',
                specSummary: 'AFC 10–150 l/h · DN15 · M30×1,5',
                imageUrl: '/images/products/3933-02.000.webp',
                href: '/products?q=3933-02.000',
            },
            {
                sku: '013G6170',
                brand: 'Danfoss',
                brandLogoUrl: '/images/brands/danfoss.svg',
                title: 'Danfoss Redia M30×1,5 galvutė',
                specSummary: 'Skystinis jutiklis · M30×1,5 sriegis',
                imageUrl: '/images/products/013g6170.webp',
                href: '/products?q=013G6170',
            },
            {
                sku: '0382-02.000',
                brand: 'IMI Heimeier',
                brandLogoUrl: '/images/brands/imi-heimeier.svg',
                title: 'IMI Heimeier Multilux 4-Eclipse mazgas',
                specSummary: '50 mm H-blokas · Apatinis pajungimas',
                imageUrl: '/images/products/0382-02.000.webp',
                href: '/products?q=0382-02.000',
            },
        ],
    },
    {
        id: 'grindinis',
        number: 2,
        tabLabel: '[2] Grindinis ir kolektoriai',
        zoneTitle: '2 zona: Grindinio šildymo kolektoriai ir pavaros (6–12 kontūrų)',
        engineeringParam: 'Kolektorius 6–12 kontūrų · 35/28 °C · 230V / 24V NC',
        plainHint: 'Automatiškai paskirsto šiltą vandenį į kiekvieno kambario grindų kontūrus.',
        calculatorHref: '/skaiciuokle?tab=manifold',
        categoryHref: '/products?category=Grindinis%20%C5%A1ildymas%20ir%20kolektoriai',
        items: [
            {
                sku: '9330-06.800',
                brand: 'IMI Heimeier',
                brandLogoUrl: '/images/brands/imi-heimeier.svg',
                title: 'IMI Heimeier Dynacon Eclipse 6 kontūrų',
                specSummary: 'AFC srauto ribotuvai · 6 kontūrai',
                imageUrl: '/images/products/9330-06.800.webp',
                href: '/products?q=9330-06.800',
            },
            {
                sku: '9330-08.800',
                brand: 'IMI Heimeier',
                brandLogoUrl: '/images/brands/imi-heimeier.svg',
                title: 'IMI Heimeier Dynacon Eclipse 8 kontūrų',
                specSummary: 'Nerūdijantis plienas · 8 kontūrai',
                imageUrl: '/images/products/9330-08.800.webp',
                href: '/products?q=9330-08.800',
            },
            {
                sku: '088U0240',
                brand: 'Danfoss',
                brandLogoUrl: '/images/brands/danfoss.svg',
                title: 'Danfoss Icon 230V kambario termostatas',
                specSummary: 'Potinkinis · 230V · Grindų jutiklis',
                imageUrl: '/images/products/088u0240.webp',
                href: '/products?q=088U0240',
            },
            {
                sku: '140F1064',
                brand: 'Danfoss',
                brandLogoUrl: '/images/brands/danfoss.svg',
                title: 'Danfoss EMO T / TWA 230V NC pavara',
                specSummary: 'M30×1,5 · 230V NC · Kolektoriams',
                imageUrl: '/images/products/140f1064.webp',
                href: '/products?q=140F1064',
            },
        ],
    },
    {
        id: 'katiline',
        number: 3,
        tabLabel: '[3] Katilinė ir plėtimosi indai',
        zoneTitle: '3 zona: Katilinė ir slėgio palaikymas (1,5 bar / PN3–PN10)',
        engineeringParam: 'Katilinė 1,5 bar · EN 12828 · Airproof butilo membrana',
        plainHint: 'Kompensuoja šylančio vandens plėtimąsi ir apsaugo katilą nuo slėgio kritimo.',
        calculatorHref: '/skaiciuokle?tab=vessel',
        categoryHref: '/products?category=Pl%C4%97timosi%20indai%20ir%20sl%C4%97gio%20palaikymas',
        items: [
            {
                sku: HERO_FLAGSHIP_SHOWCASE[3]?.sku || '7101003',
                brand: 'IMI Pneumatex',
                brandLogoUrl: '/images/brands/imi-pneumatex.svg',
                title: 'IMI Pneumatex Statico SD 25.3 indas',
                specSummary: '25 L · 3 bar · Airproof membrana',
                imageUrl: '/images/products/7101003.webp',
                href: '/products?q=7101003',
            },
            {
                sku: '7101004',
                brand: 'IMI Pneumatex',
                brandLogoUrl: '/images/brands/imi-pneumatex.svg',
                title: 'IMI Pneumatex Statico SD 35.3 indas',
                specSummary: '35 L · 3 bar · Šildymo sistemoms',
                imageUrl: '/images/products/7101004.webp',
                href: '/products?q=7101004',
            },
            {
                sku: '7111017',
                brand: 'IMI Pneumatex',
                brandLogoUrl: '/images/brands/imi-pneumatex.svg',
                title: 'IMI Pneumatex Aquapresso ADF 18.10',
                specSummary: '18 L · 10 bar · Geriamam vandeniui',
                imageUrl: '/images/products/7111017.webp',
                href: '/products?q=7111017',
            },
            {
                sku: '8101413',
                brand: 'IMI Pneumatex',
                brandLogoUrl: '/images/brands/imi-pneumatex.svg',
                title: 'IMI Pneumatex DLV 20 prijungimo mazgas',
                specSummary: 'Aptarnavimas neišleidžiant sistemos',
                imageUrl: '/images/products/8101413.webp',
                href: '/products?q=8101413',
            },
        ],
    },
    {
        id: 'balansavimas',
        number: 4,
        tabLabel: '[4] Balansavimas (IMI TA)',
        zoneTitle: '4 zona: Stovų ir atšakų hidraulinis balansavimas (DN15–DN50)',
        engineeringParam: 'IMI TA STAD / TBV-C · AMETAL lydinys · PN20 · Memory stop',
        plainHint: 'Suvienodina srautą tarp pirmo ir antro aukšto, kad tolimiausi kambariai nešaltų.',
        calculatorHref: '/skaiciuokle?tab=valve',
        categoryHref: '/products?category=Balansiniai%20ir%20reguliavimo%20vo%C5%BEtuvai',
        items: [
            {
                sku: HERO_FLAGSHIP_SHOWCASE[2]?.sku || '52-151-014',
                brand: 'IMI TA',
                brandLogoUrl: '/images/brands/imi-ta.svg',
                title: 'IMI TA STAD DN15 balansinis vožtuvas',
                specSummary: 'DN15 (1/2") · AMETAL · PN20',
                imageUrl: '/images/products/52-151-014.webp',
                href: '/products?q=52-151-014',
            },
            {
                sku: '52-151-020',
                brand: 'IMI TA',
                brandLogoUrl: '/images/brands/imi-ta.svg',
                title: 'IMI TA STAD DN20 balansinis vožtuvas',
                specSummary: 'DN20 (3/4") · Kvs 5,7 · Matavimo nipeliai',
                imageUrl: '/images/products/52-151-020.webp',
                href: '/products?q=52-151-020',
            },
            {
                sku: '52-151-025',
                brand: 'IMI TA',
                brandLogoUrl: '/images/brands/imi-ta.svg',
                title: 'IMI TA STAD DN25 balansinis vožtuvas',
                specSummary: 'DN25 (1") · Kvs 8,7 · Stovų balansavimui',
                imageUrl: '/images/products/52-151-025.webp',
                href: '/products?q=52-151-025',
            },
            {
                sku: '52-133-215',
                brand: 'IMI TA',
                brandLogoUrl: '/images/brands/imi-ta.svg',
                title: 'IMI TA TBV-C DN15 reguliavimo vožtuvas',
                specSummary: 'DN15 · Pavaros sriegis M30×1,5',
                imageUrl: '/images/products/52-133-215.webp',
                href: '/products?q=52-133-215',
            },
        ],
    },
    {
        id: 'nuorinimas',
        number: 5,
        tabLabel: '[5] Nuorinimas ir apsauga',
        zoneTitle: '5 zona: Mikroburbuliukų, šlamo šalinimas ir armatūra',
        engineeringParam: 'Zeparo ZUC / ZUV · Helistill separatorius · Eurokonus G 3/4"',
        plainHint: 'Pašalina orą ir magnetinį dumblą iš sistemos, kad radiatoriai nečiurlentų.',
        calculatorHref: '/skaiciuokle?tab=boiler',
        categoryHref: '/products?category=Oro%20atskyrikliai%20ir%20nuorintuvai',
        items: [
            {
                sku: '7895122',
                brand: 'IMI Pneumatex',
                brandLogoUrl: '/images/brands/imi-pneumatex.svg',
                title: 'IMI Pneumatex Zeparo ZUC 22 atskyriklis',
                specSummary: 'Helistill · Oro ir šlamo šalinimas',
                imageUrl: '/images/products/7895122.webp',
                href: '/products?q=7895122',
            },
            {
                sku: '0601-02.350',
                brand: 'IMI Heimeier',
                brandLogoUrl: '/images/brands/imi-heimeier.svg',
                title: 'IMI Heimeier Eurokonus DN15 jungtis',
                specSummary: 'G 3/4" · 16×2,0 mm vamzdžiams',
                imageUrl: '/images/products/0601-02.350.webp',
                href: '/products?q=0601-02.350',
            },
            {
                sku: '3712-02.000',
                brand: 'IMI Heimeier',
                brandLogoUrl: '/images/brands/imi-heimeier.svg',
                title: 'IMI Heimeier Regulux DN15 vožtuvas',
                specSummary: 'Grįžtamo srauto uždarymas · DN15',
                imageUrl: '/images/products/3712-02.000.webp',
                href: '/products?q=3712-02.000',
            },
            {
                sku: '013G5012',
                brand: 'Danfoss',
                brandLogoUrl: '/images/brands/danfoss.svg',
                title: 'Danfoss RA-N 15 kampinis vožtuvas',
                specSummary: 'Išankstinis kv nustatymas · DN15',
                imageUrl: '/images/products/013g5012.webp',
                href: '/products?q=013G5012',
            },
        ],
    },
];

interface LocalizedHeroHotspotText {
    title: string;
    description: string;
    ctaLabel: string;
    specPill: string;
}

const HERO_I18N: Record<
    AppLocale,
    {
        eyebrow: string;
        h1: string;
        lead: string;
        card1Kicker: string;
        card1Title: string;
        card1Desc: string;
        card1Alt: string;
        card1Cta: string;
        card2Kicker: string;
        card2Title: string;
        card2Desc: string;
        card2Alt: string;
        card2Cta: string;
        kpis: Array<{ val: string; label: string }>;
        schematicTitle: string;
        schematicDims: string;
        schematicAria: string;
        svgHopperTitle: string;
        svgHopperFuel: string;
        svgHopperAutonomy: string;
        svgAuger: string;
        svgBurnerTitle: string;
        svgBurnerSub: string;
        svgBoilerTitle: string;
        svgControllerTitle: string;
        svgCombustionChamber: string;
        svgRadiators: string;
        svgUnderfloor: string;
        svgLegendLeft: string;
        svgLegendSupply: string;
        svgLegendReturn: string;
        vatGross: string;
        vatNet: string;
        viewProductCta: string;
        configureKitCta: string;
        hotspots: Record<string, LocalizedHeroHotspotText>;
    }
> = {
    lt: {
        eyebrow: 'LIETUVIŠKA ŠILUMOS INŽINERIJA · NUO 2011 M.',
        h1: 'Šiluma, kuri veikia pati.',
        lead: 'Automatizuojame kieto kuro katilus granulėms, gaminame ir nuomojame konteinerines katilines 100 kW – 2,5 MW. El. parduotuvėje – {count} šildymo, vėdinimo ir santechnikos pozicijos su inžinieriaus konsultacija.',
        card1Kicker: '01 / EL. PARDUOTUVĖ',
        card1Title: 'Man reikia įrangos',
        card1Desc: 'Katilai, degikliai, automatika, vėdinimas ir instaliacija',
        card1Alt: 'Katilai ir degikliai',
        card1Cta: 'Peržiūrėti {count} prekių katalogą',
        card2Kicker: '02 / INŽINERINIS SPRENDIMAS',
        card2Title: 'Man reikia sprendimo',
        card2Desc: 'Keturi klausimai – komplektas ir orientacinė kaina',
        card2Alt: 'Granulių degiklio komplektas',
        card2Cta: 'Paleisti katilo perdarymo vedlį',
        kpis: [
            { val: '14+ metų', label: 'patirtis nuo 2011 m.' },
            { val: '2,5 MW', label: 'maks. katilinių galia' },
            { val: '{count}+', label: 'prekių kataloge' },
            { val: '24 mėn.', label: 'garantija ir servisas' },
        ],
        schematicTitle: 'MAZGO SCHEMA · GRANULINĖ KATILINĖ 25 kW · REV 4.2',
        schematicDims: 'Gabaritai: 1 450 mm × 680 mm × 1 280 mm',
        schematicAria: 'Granulinės katilinės 25 kW techninis CAD brėžinys su 5 mazgais ir matmenimis',
        svgHopperTitle: '[3] BUNKERIS 300 L',
        svgHopperFuel: 'Kuras: 6–8 mm',
        svgHopperAutonomy: '5–7 d. autonomija',
        svgAuger: 'ŠNEKAS 2.0 M',
        svgBurnerTitle: '[1] DEGIKLIS MPB',
        svgBurnerSub: '8–35 kW · CNC',
        svgBoilerTitle: '[2] KATILAS 25 kW',
        svgControllerTitle: '[5] VALDIKLIS ecoMAX',
        svgCombustionChamber: 'Degimo kamera',
        svgRadiators: '[4] AKUMULIACINĖ TALPA',
        svgUnderfloor: 'GRINDINIS ŠILD.',
        svgLegendLeft: 'CAD M 1:20 · P265GH 6 mm plienas',
        svgLegendSupply: 'Padavimas T1 80 °C',
        svgLegendReturn: 'Grįžtamas T2 60 °C',
        vatGross: 'su PVM',
        vatNet: 'be PVM',
        viewProductCta: 'Žiūrėti prekę',
        configureKitCta: 'Parinkti komplektą',
        hotspots: {
            burner: {
                title: 'Granulių degiklis Megatherm MPB NANI 35',
                description:
                    'Montuojamas vietoje kuro pakrovimo durelių su automatiniu sraigtiniu tiektuvu ir savaime išsivalančiomis ardelėmis (8–35 kW).',
                ctaLabel: 'Žiūrėti prekę',
                specPill: '8–35 kW · CNC flanšas',
            },
            boiler: {
                title: 'Katilas 25 kW (kieto kuro / granulinis)',
                description:
                    'Kieto kuro, granulinis ar kombinuotas katilas: nuo 25 kW namui iki 2,5 MW komerciniam ir pramoniniam objektui.',
                ctaLabel: 'Žiūrėti prekę',
                specPill: '25 kW · P265GH 6 mm',
            },
            tank: {
                title: 'Akumuliacinė talpa ir boileris Gorenje ZV',
                description:
                    'Kombinuoti vandens šildytuvai ir akumuliacinės talpos stabilizuoja katilo darbą ir ruošia buitinį karštą vandenį.',
                ctaLabel: 'Žiūrėti prekę',
                specPill: '100–300 L · PN6 bar',
            },
            mixing: {
                title: 'Pamaišymo mazgas Danfoss / IMI Heimeier',
                description:
                    'Termostatiniai ir balansiniai vožtuvai, cirkuliaciniai siurbliai, radiatoriai ir grindinio šildymo kolektoriai viename mazge.',
                ctaLabel: 'Žiūrėti prekę',
                specPill: 'RA Click · DN15–DN25',
            },
            controller: {
                title: 'Valdiklis ecoMAX 920i su interneto moduliu',
                description:
                    'Jutiklinis valdiklis palaiko nustatytą temperatūrą, moduliuoja degiklio galią, valdo pamaišymo vožtuvus ir siunčia pranešimus į telefoną.',
                ctaLabel: 'Žiūrėti prekę',
                specPill: 'Wi-Fi · Fuzzy Logic',
            },
        },
    },
    en: {
        eyebrow: 'LITHUANIAN HEATING ENGINEERING · SINCE 2011',
        h1: 'Heating that works on its own.',
        lead: 'We convert solid-fuel boilers to automatic pellet firing and manufacture or rent 100 kW – 2.5 MW containerized boiler rooms. Our online store stocks {count} heating, ventilation, and plumbing items with direct engineering support.',
        card1Kicker: '01 / ONLINE STORE',
        card1Title: 'I need equipment',
        card1Desc: 'Boilers, burners, automation, ventilation & hydronic fittings',
        card1Alt: 'Boilers and pellet burners',
        card1Cta: 'Browse {count} catalog items',
        card2Kicker: '02 / ENGINEERING SOLUTION',
        card2Title: 'I need a solution',
        card2Desc: 'Four questions – matched conversion kit and indicative price',
        card2Alt: 'Pellet burner conversion kit',
        card2Cta: 'Launch boiler conversion wizard',
        kpis: [
            { val: '14+ years', label: 'experience since 2011' },
            { val: '2.5 MW', label: 'max. boiler plant output' },
            { val: '{count}+', label: 'items in catalog' },
            { val: '24 mo.', label: 'warranty & service' },
        ],
        schematicTitle: 'SYSTEM SCHEMATIC · PELLET BOILER ROOM 25 kW · REV 4.2',
        schematicDims: 'Dimensions: 1,450 mm × 680 mm × 1,280 mm',
        schematicAria: '25 kW pellet boiler room technical CAD blueprint with 5 interactive nodes and dimensions',
        svgHopperTitle: '[3] HOPPER 300 L',
        svgHopperFuel: 'Pellets: 6–8 mm',
        svgHopperAutonomy: '5–7 days autonomy',
        svgAuger: 'AUGER 2.0 M',
        svgBurnerTitle: '[1] BURNER MPB',
        svgBurnerSub: '8–35 kW · CNC',
        svgBoilerTitle: '[2] BOILER 25 kW',
        svgControllerTitle: '[5] CONTROLLER ecoMAX',
        svgCombustionChamber: 'Combustion chamber',
        svgRadiators: '[4] BUFFER TANK',
        svgUnderfloor: 'UNDERFLOOR HTG',
        svgLegendLeft: 'CAD 1:20 · P265GH 6 mm boiler steel',
        svgLegendSupply: 'Supply T1 80 °C',
        svgLegendReturn: 'Return T2 60 °C',
        vatGross: 'incl. VAT',
        vatNet: 'excl. VAT',
        viewProductCta: 'View product',
        configureKitCta: 'Configure kit',
        hotspots: {
            burner: {
                title: 'Megatherm MPB NANI 35 Pellet Burner Kit',
                description:
                    'Mounts directly into existing boiler loading doors with an automatic screw auger and self-cleaning moving grate (8–35 kW).',
                ctaLabel: 'View product',
                specPill: '8–35 kW · CNC flange',
            },
            boiler: {
                title: '25 kW Solid-Fuel & Pellet Boiler KaTRI',
                description:
                    'Heavy-duty 6 mm P265GH steel boiler: from 25 kW residential units to 2.5 MW commercial and industrial plants.',
                ctaLabel: 'View product',
                specPill: '25 kW · P265GH 6 mm',
            },
            tank: {
                title: 'Gorenje ZV Buffer Tank & DHW Cylinder',
                description:
                    'Combined domestic hot water cylinders and accumulation tanks stabilize boiler operation and store thermal energy.',
                ctaLabel: 'View product',
                specPill: '100–300 L · PN6 bar',
            },
            mixing: {
                title: 'Danfoss / IMI Heimeier Hydronic Mixing Unit',
                description:
                    'Thermostatic and balancing valves, circulation pumps, radiator controls, and underfloor heating manifolds in one assembly.',
                ctaLabel: 'View product',
                specPill: 'RA Click · DN15–DN25',
            },
            controller: {
                title: 'ecoMAX 920i Touch Controller with Internet Module',
                description:
                    'Touchscreen controller maintains target room temperature, modulates burner output, controls mixing valves, and sends mobile alerts.',
                ctaLabel: 'View product',
                specPill: 'Wi-Fi · Fuzzy Logic',
            },
        },
    },
    pl: {
        eyebrow: 'LITEWSKA INŻYNIERIA GRZEWCZA · OD 2011 R.',
        h1: 'Ciepło, które działa samo.',
        lead: 'Automatyzujemy kotły stałopalne na pellet oraz produkujemy i wynajmujemy kotłownie kontenerowe 100 kW – 2,5 MW. W sklepie internetowym – {count} pozycji grzewczych, wentylacyjnych i sanitarnych z doradztwem inżyniera.',
        card1Kicker: '01 / SKLEP INTERNETOWY',
        card1Title: 'Potrzebuję sprzętu',
        card1Desc: 'Kotły, palniki, automatyka, wentylacja i armatura',
        card1Alt: 'Kotły i palniki peletowe',
        card1Cta: 'Zobacz katalog {count} produktów',
        card2Kicker: '02 / ROZWIĄZANIE INŻYNIERYJNE',
        card2Title: 'Potrzebuję rozwiązania',
        card2Desc: 'Cztery pytania – dobór zestawu i orientacyjna cena',
        card2Alt: 'Zestaw palnika peletowego',
        card2Cta: 'Uruchom kreator modernizacji kotła',
        kpis: [
            { val: '14+ lat', label: 'doświadczenia od 2011 r.' },
            { val: '2,5 MW', label: 'maks. moc kotłowni' },
            { val: '{count}+', label: 'pozycji w katalogu' },
            { val: '24 mies.', label: 'gwarancja i serwis' },
        ],
        schematicTitle: 'SCHEMAT UKŁADU · KOTŁOWNIA PELETOWA 25 kW · REV 4.2',
        schematicDims: 'Wymiary: 1 450 mm × 680 mm × 1 280 mm',
        schematicAria: 'Rysunek techniczny CAD kotłowni peletowej 25 kW z 5 węzłami i wymiarami',
        svgHopperTitle: '[3] ZASOBNIK 300 L',
        svgHopperFuel: 'Paliwo: 6–8 mm',
        svgHopperAutonomy: '5–7 dni autonomii',
        svgAuger: 'PODAJNIK 2.0 M',
        svgBurnerTitle: '[1] PALNIK MPB',
        svgBurnerSub: '8–35 kW · CNC',
        svgBoilerTitle: '[2] KOCIOŁ 25 kW',
        svgControllerTitle: '[5] STEROWNIK ecoMAX',
        svgCombustionChamber: 'Komora spalania',
        svgRadiators: '[4] BUFOR CIEPŁA',
        svgUnderfloor: 'OGRZEW. PODŁOG.',
        svgLegendLeft: 'CAD 1:20 · Stal kotłowa P265GH 6 mm',
        svgLegendSupply: 'Zasilanie T1 80 °C',
        svgLegendReturn: 'Powrót T2 60 °C',
        vatGross: 'z VAT',
        vatNet: 'bez VAT',
        viewProductCta: 'Zobacz produkt',
        configureKitCta: 'Dobierz zestaw',
        hotspots: {
            burner: {
                title: 'Palnik peletowy Megatherm MPB NANI 35',
                description:
                    'Montowany w miejsce drzwiczek załadunkowych z automatycznym podajnikiem ślimakowym i samoczyszczącym rusztem ruchomym (8–35 kW).',
                ctaLabel: 'Zobacz produkt',
                specPill: '8–35 kW · Kołnierz CNC',
            },
            boiler: {
                title: 'Kocioł 25 kW (stałopalny / peletowy)',
                description:
                    'Kocioł ze stali kotłowej P265GH 6 mm: od 25 kW dla domu po 2,5 MW dla obiektów komercyjnych i przemysłowych.',
                ctaLabel: 'Zobacz produkt',
                specPill: '25 kW · P265GH 6 mm',
            },
            tank: {
                title: 'Zbiornik buforowy i bojler Gorenje ZV',
                description:
                    'Kombinowane podgrzewacze wody i zbiorniki akumulacyjne stabilizują pracę kotła oraz przygotowują ciepłą wodę użytkową.',
                ctaLabel: 'Zobacz produkt',
                specPill: '100–300 L · PN6 bar',
            },
            mixing: {
                title: 'Grupa mieszająca Danfoss / IMI Heimeier',
                description:
                    'Zawory termostatyczne i równoważące, pompy obiegowe, głowice grzejnikowe oraz rozdzielacze ogrzewania podłogowego.',
                ctaLabel: 'Zobacz produkt',
                specPill: 'RA Click · DN15–DN25',
            },
            controller: {
                title: 'Sterownik ecoMAX 920i z modułem internetowym',
                description:
                    'Dotykowy sterownik utrzymuje zadaną temperaturę, moduluje moc palnika, steruje zaworami mieszającymi i wysyła powiadomienia na telefon.',
                ctaLabel: 'Zobacz produkt',
                specPill: 'Wi-Fi · Fuzzy Logic',
            },
        },
    },
    ru: {
        eyebrow: 'ЛИТОВСКАЯ ТЕПЛОТЕХНИКА · С 2011 Г.',
        h1: 'Тепло, которое работает само.',
        lead: 'Автоматизируем твердотопливные котлы под пеллеты, производим и сдаем в аренду контейнерные котельные 100 кВт – 2,5 МВт. В интернет-магазине – {count} позиций отопления, вентиляции и сантехники с консультацией инженера.',
        card1Kicker: '01 / ИНТЕРНЕТ-МАГАЗИН',
        card1Title: 'Мне нужно оборудование',
        card1Desc: 'Котлы, горелки, автоматика, вентиляция и арматура',
        card1Alt: 'Котлы и пеллетные горелки',
        card1Cta: 'Смотреть каталог {count} товаров',
        card2Kicker: '02 / ИНЖЕНЕРНОЕ РЕШЕНИЕ',
        card2Title: 'Мне нужно решение',
        card2Desc: 'Четыре вопроса – подбор комплекта и ориентировочная цена',
        card2Alt: 'Комплект пеллетной горелки',
        card2Cta: 'Запустить мастер модернизации котла',
        kpis: [
            { val: '14+ лет', label: 'опыт работы с 2011 г.' },
            { val: '2,5 МВт', label: 'макс. мощность котельных' },
            { val: '{count}+', label: 'товаров в каталоге' },
            { val: '24 мес.', label: 'гарантия и servis'.replace('servis', 'сервис') },
        ],
        schematicTitle: 'СХЕМА УЗЛА · ПЕЛЛЕТНАЯ КОТЕЛЬНАЯ 25 кВт · REV 4.2',
        schematicDims: 'Габариты: 1 450 мм × 680 мм × 1 280 мм',
        schematicAria: 'Технический CAD-чертеж пеллетной котельной 25 кВт с 5 узлами и размерами',
        svgHopperTitle: '[3] БУНКЕР 300 Л',
        svgHopperFuel: 'Гранулы: 6–8 мм',
        svgHopperAutonomy: '5–7 дн. автономии',
        svgAuger: 'ШНЕК 2.0 М',
        svgBurnerTitle: '[1] ГОРЕЛКА MPB',
        svgBurnerSub: '8–35 кВт · ЧПУ',
        svgBoilerTitle: '[2] КОТЕЛ 25 кВт',
        svgControllerTitle: '[5] КОНТРОЛЛЕР ecoMAX',
        svgCombustionChamber: 'Камера сгорания',
        svgRadiators: '[4] БУФЕРНАЯ ЕМКОСТЬ',
        svgUnderfloor: 'ТЕПЛЫЙ ПОЛ',
        svgLegendLeft: 'CAD 1:20 · Котловая сталь P265GH 6 мм',
        svgLegendSupply: 'Подача T1 80 °C',
        svgLegendReturn: 'Обратка T2 60 °C',
        vatGross: 'с НДС',
        vatNet: 'без НДС',
        viewProductCta: 'Смотреть товар',
        configureKitCta: 'Подобрать комплект',
        hotspots: {
            burner: {
                title: 'Пеллетная горелка Megatherm MPB NANI 35',
                description:
                    'Монтируется взамен загрузочной дверцы котла с автоматическим шнековым податчиком и самоочищающимися колосниками (8–35 кВт).',
                ctaLabel: 'Смотреть товар',
                specPill: '8–35 кВт · ЧПУ фланец',
            },
            boiler: {
                title: 'Котел 25 кВт (твердотопливный / пеллетный)',
                description:
                    'Котел из котловой стали P265GH 6 мм: от 25 кВт для дома до 2,5 МВт для коммерческих и промышленных объектов.',
                ctaLabel: 'Смотреть товар',
                specPill: '25 кВт · P265GH 6 мм',
            },
            tank: {
                title: 'Аккумулирующая емкость и бойлер Gorenje ZV',
                description:
                    'Комбинированные водонагреватели и буферные емкости стабилизируют работу котла и готовят горячую воду.',
                ctaLabel: 'Смотреть товар',
                specPill: '100–300 Л · PN6 бар',
            },
            mixing: {
                title: 'Смесительный узел Danfoss / IMI Heimeier',
                description:
                    'Термостатические и балансировочные клапаны, циркуляционные насосы, радиаторные головки и коллекторы теплого пола.',
                ctaLabel: 'Смотреть товар',
                specPill: 'RA Click · DN15–DN25',
            },
            controller: {
                title: 'Контроллер ecoMAX 920i с интернет-модулем',
                description:
                    'Сенсорный контроллер поддерживает заданную температуру, модулирует мощность горелки, управляет смесительными клапанами и шлет уведомления.',
                ctaLabel: 'Смотреть товар',
                specPill: 'Wi-Fi · Fuzzy Logic',
            },
        },
    },
};

export function HomeHero({
    storeName: _storeName,
    locale: propLocale,
}: {
    storeName: string;
    locale?: AppLocale;
}) {
    const intlLocale = useLocale() || 'lt';
    const rawPathname = usePathname() || '';
    const urlMatch = rawPathname.match(/^\/(lt|en|pl|ru)(?=\/|$)/i);
    const locale = resolveAppLocale(propLocale || (urlMatch ? urlMatch[1] : intlLocale));
    const copy = HERO_I18N[locale];
    // W121-A2: live SKU count replaces the hardcoded catalog size.
    const heroCatalogCountLabel = formatCatalogCount(
        useStorefrontConfig().catalog?.skuCount ?? 0,
        locale,
    );
    const withCount = (s2: string) => s2.replaceAll('{count}', heroCatalogCountLabel);
    const showNet = useVatDisplayStore((s) => s.showNet);
    const [selectedHotspotId, setSelectedHotspotId] = useState<string>(
        HERO_SCHEMATIC_HOTSPOTS[0]?.id || 'burner',
    );

    const currentHotspot =
        HERO_SCHEMATIC_HOTSPOTS.find((h) => h.id === selectedHotspotId) ||
        HERO_SCHEMATIC_HOTSPOTS[0]!;
    const localizedHotspot = copy.hotspots[currentHotspot.id] || {
        title: currentHotspot.title,
        description: currentHotspot.description,
        ctaLabel: copy.viewProductCta,
        specPill: currentHotspot.sku,
    };

    const formattedHotspotPrice = `${(showNet ? currentHotspot.priceNetEur : currentHotspot.priceGrossEur)
        .toFixed(2)
        .replace('.', ',')} € ${showNet ? copy.vatNet : copy.vatGross}`;

    return (
        <section
            data-testid="giles-redizainas-hero"
            className="bg-[#11161B] text-[#F5F3EE] border-b border-[#2C3742] py-6 sm:py-9"
        >
            <div className="mx-auto max-w-7xl px-4 sm:px-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
                    <div className="lg:col-span-6 space-y-4">
                        <span className="block text-xs font-bold text-[#FF8A3D]">
                            {copy.eyebrow}
                        </span>

                        <h1 className="text-3xl sm:text-5xl font-extrabold text-white leading-tight tracking-tight">
                            {copy.h1}
                        </h1>

                        <p className="text-sm sm:text-base text-[#C9D0D8] leading-relaxed max-w-xl">
                            {withCount(copy.lead)}
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                            <div className="rounded-none border border-[#2C3742] bg-[#1B232C] p-4 flex flex-col justify-between gap-2.5">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="space-y-1">
                                        <span className="tabular-nums text-xs font-semibold text-[#A3ADB8] block">
                                            {copy.card1Kicker}
                                        </span>
                                        <h2 className="text-lg font-extrabold text-white">
                                            {copy.card1Title}
                                        </h2>
                                        <p className="text-xs text-[#C9D0D8] leading-relaxed">
                                            {copy.card1Desc}
                                        </p>
                                    </div>
                                    <div className="h-12 w-12 shrink-0 bg-[#EEEBE4] p-1 flex items-center justify-center">
                                        <img
                                            src={assetUrl('/images/products/giles-studio-06-megatherm-burner-kit.webp')}
                                            alt={copy.card1Alt}
                                            className="max-h-full max-w-full object-contain mix-blend-multiply"
                                        />
                                    </div>
                                </div>
                                <Link
                                    href={`/${locale}/products`}
                                    className="inline-flex items-center text-xs font-bold text-[#FF8A3D] hover:text-white whitespace-nowrap pt-1"
                                >
                                    {withCount(copy.card1Cta)}
                                </Link>
                            </div>

                            <div className="rounded-none border border-[#9A3412] bg-[#9A3412] p-4 flex flex-col justify-between gap-2.5">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="space-y-1">
                                        <span className="tabular-nums text-xs font-semibold text-white block">
                                            {copy.card2Kicker}
                                        </span>
                                        <h2 className="text-lg font-extrabold text-white">
                                            {copy.card2Title}
                                        </h2>
                                        <p className="text-xs text-white leading-relaxed">
                                            {copy.card2Desc}
                                        </p>
                                    </div>
                                    <div className="h-12 w-12 shrink-0 bg-[#EEEBE4] p-1 flex items-center justify-center">
                                        <img
                                            src={assetUrl('/images/products/giles-studio-01-mpb-nani-35-50.webp')}
                                            alt={copy.card2Alt}
                                            className="max-h-full max-w-full object-contain mix-blend-multiply"
                                        />
                                    </div>
                                </div>
                                <Link
                                    href={`/${locale}/vedlys`}
                                    className="inline-flex items-center text-xs font-bold text-white underline underline-offset-4 whitespace-nowrap pt-1"
                                >
                                    {copy.card2Cta}
                                </Link>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-[#2C3742]">
                            {copy.kpis.map((kpi) => (
                                <div key={kpi.label}>
                                    <span className="block text-lg font-extrabold text-white">
                                        {withCount(kpi.val)}
                                    </span>
                                    <span className="text-xs text-[#A3ADB8]">{kpi.label}</span>
                                </div>
                            ))}
                        </div>

                        <p className="text-xs text-[#A3ADB8]">
                            {GILES_COMPANY_IDENTITY.legalName} · Darius Šauklys: {GILES_COMPANY_IDENTITY.phoneDarius} · {GILES_COMPANY_IDENTITY.phoneLandline}
                        </p>
                    </div>

                    <div className="lg:col-span-6 space-y-3">
                        <GilesHeroAnimatedSchematic locale={locale} />
                    </div>
                </div>
            </div>
        </section>
    );
}

const HOME_FEATURED_WORK_IDS = [
    'darbas-01',
    'darbas-02',
    'darbas-06',
    'darbas-08',
    'darbas-10',
    'darbas-11',
] as const;

interface LocalizedWorkTranslation {
    numLabel: string;
    categoryLabel: string;
    title: string;
    location: string;
    powerKw: string;
    fuelOrMedium: string;
    boilerModel: string;
    burnerOrEquipment: string;
    scopeExecuted: string;
    resultMetric: string;
    ctaLabel: string;
}

const COMPLETED_WORKS_I18N: Record<
    AppLocale,
    {
        boilerModuleLabel: string;
        burnerEquipmentLabel: string;
        powerLabel: string;
        fuelLabel: string;
        resultLabel: string;
        zoomPhotoLabel: string;
        zoomAriaPrefix: string;
        closePreviewAria: string;
        powerAndResultLabel: string;
        works: Record<string, LocalizedWorkTranslation>;
    }
> = {
    lt: {
        boilerModuleLabel: 'Katilas / Modulis: ',
        burnerEquipmentLabel: 'Degiklis / Įranga: ',
        powerLabel: 'Galia',
        fuelLabel: 'Kuras',
        resultLabel: 'Rezultatas',
        zoomPhotoLabel: 'Padidinti foto',
        zoomAriaPrefix: 'Padidinti',
        closePreviewAria: 'Uždaryti peržiūrą',
        powerAndResultLabel: 'Galia ir rezultatas',
        works: {
            'darbas-01': {
                numLabel: 'Mazgas #01',
                categoryLabel: 'Katilų perdarymas į granulinius',
                title: 'Ketinio katilo Viadrus U26 perdarymas su Megatherm MPB granulių degikliu',
                location: 'Viadrus U26 + Megatherm MPB',
                powerKw: '25–35 kW',
                fuelOrMedium: 'Medienos granulės (DINplus 6–8 mm)',
                boilerModel: 'Viadrus U26 (ketinis sekcijinis kieto kuro katilas)',
                burnerOrEquipment: 'Megatherm MPB savaime išsivalantis degiklis + CNC durelių flanšas',
                scopeExecuted:
                    'Vietoje apatinių pakrovimo durelių sumontuotos naujos CNC plieninės durelės su degiklio tvirtinimo anga, įdėtos šilumokaičio užsklandos (ekonomaizeriai), pajungtas padavimo sraigtas ir degiklio valdiklis.',
                resultMetric: 'Montavimas per 4–6 val. · 100 % automatinis režimas',
                ctaLabel: 'Pritaikyti savo Viadrus katilui',
            },
            'darbas-02': {
                numLabel: 'Mazgas #02',
                categoryLabel: 'Katilų perdarymas į granulinius',
                title: 'Viadrus U26 katilinės mazgas su granulių bunkeriu ir sraigtiniu tiektuvu',
                location: 'Komplektas „Link lyderių“',
                powerKw: '10–35 kW',
                fuelOrMedium: 'Medienos granulės',
                boilerModel: 'Viadrus U26 + 460 L cinkuotas granulių bunkeris',
                burnerOrEquipment: 'Komplektas „Link lyderių“ (Megatherm 10–35 kW + 1,5 m sraigtas + oro kompresorius)',
                scopeExecuted:
                    'Pilnas kieto kuro katilinės automatizavimas: pastatytas 460 L bunkeris, sumontuotas 1,5 m kuro padavimo sraigtas, pneumatinis šlako valymas kompresoriumi ir patalpos termostatas.',
                resultMetric: 'Autonominis darbas 7–10 parų be papildymo',
                ctaLabel: 'Užsakyti „Link lyderių“ komplektą',
            },
            'darbas-06': {
                numLabel: 'Mazgas #06',
                categoryLabel: 'Pramoninės ir konteinerinės katilinės',
                title: '500 kW pramoninė konteinerinė biokuro katilinė GK-500 (gamyklinis surinkimas)',
                location: 'Konteinerinė katilinė GK-500',
                powerKw: '500 kW',
                fuelOrMedium: 'Medienos granulės / biokuras',
                boilerModel: 'Gilės GK-500 konteinerinis biokuro modulis (6 058 × 2 438 × 2 896 mm)',
                burnerOrEquipment: 'Pramoninis katilas su judančiomis ardelėmis, multiciklonu ir GSM/SCADA',
                scopeExecuted:
                    'Gamykloje surinktas, hidrauliškai išbandytas ir izoliuotas 500 kW konteinerinis šilumos modulis su automatiniu kuro padavimu, dūmų valymu ir nuotoline telemetrija.',
                resultMetric: 'Pilnas gamyklinis surinkimas ir hidraulinis išbandymas',
                ctaLabel: 'GK-500 specifikacija ir ROI',
            },
            'darbas-08': {
                numLabel: 'Mazgas #08',
                categoryLabel: 'Pramoninės ir konteinerinės katilinės',
                title: '2,0 MW modulinė pramoninė katilinė su kuro sandėliu ir dūmų valymo sistema',
                location: 'Modulinis kompleksas GK-2000',
                powerKw: '2 000 kW (2,0 MW)',
                fuelOrMedium: 'Biokuras (skiedra G30–G50 / medienos granulės)',
                boilerModel: 'Gilės GK-2000 pramoninis kaskadinis katilinės kompleksas',
                burnerOrEquipment: 'Walking-Floor kuro sandėlis + multiciklonas + automatinis pelenų šalinimas',
                scopeExecuted:
                    'Didelės galios pramoninis biokuro kompleksas su judančių grindų (Walking-Floor) kuro sandėliu, daugiapakopiu dūmų valymo filtru ir SCADA dispečeriniu valdymu.',
                resultMetric: 'Atitinka ES EcoDesign ir Aplinkos apsaugos normas',
                ctaLabel: 'Gauti 1–2,5 MW pasiūlymą',
            },
            'darbas-10': {
                numLabel: 'Mazgas #10',
                categoryLabel: 'Pramoninės ir konteinerinės katilinės',
                title: '500 kW konteinerinė dujinė katilinė su kaskadiniais katilais ir dūmtraukiais',
                location: 'Stoginė dujinė katilinė',
                powerKw: '500 kW',
                fuelOrMedium: 'Gamtinės dujos',
                boilerModel: 'Stoginė konteinerinė dujinė katilinė',
                burnerOrEquipment: 'Kaskadiniai dujiniai katilai + nerūdijančio plieno dūmtraukiai + siurblių grupė',
                scopeExecuted:
                    'Suprojektuota, pagaminta ir ant pastato stogo sumontuota 500 kW konteinerinė dujinė katilinė su kaskadine automatika ir nerūdijančio plieno dūmtraukių sistema.',
                resultMetric: 'Sumontuota ant stogo be vidaus ploto praradimo',
                ctaLabel: 'Konteinerinės katilinės projektas',
            },
            'darbas-11': {
                numLabel: 'Mazgas #11',
                categoryLabel: 'Šilumos siurbliai ir katilinės',
                title: '200 kW katilinės šilumos mazgas, paskirstymo kolektoriai ir balansavimo sistema',
                location: 'Hidraulinis šilumos mazgas',
                powerKw: '200 kW',
                fuelOrMedium: 'Šildymo kontūras',
                boilerModel: '200 kW pramoninis šilumos mazgas su paskirstymo kolektoriais',
                burnerOrEquipment: 'Elektroniniai cirkuliaciniai siurbliai + IMI TA STAD/STAP balansiniai vožtuvai + Pneumatex',
                scopeExecuted:
                    'Sumontuotas 200 kW katilinės hidraulinis šilumos mazgas su pamaišymo vožtuvais, elektroniniais cirkuliaciniais siurbliais ir IMI TA srautų balansavimu.',
                resultMetric: 'Tikslus hidraulinis kontūrų srautų balansavimas',
                ctaLabel: 'Skaičiuoti šilumos mazgą',
            },
        },
    },
    en: {
        boilerModuleLabel: 'Boiler / Module: ',
        burnerEquipmentLabel: 'Burner / Equipment: ',
        powerLabel: 'Output',
        fuelLabel: 'Fuel / Medium',
        resultLabel: 'Outcome',
        zoomPhotoLabel: 'Enlarge photo',
        zoomAriaPrefix: 'Enlarge photo of',
        closePreviewAria: 'Close preview',
        powerAndResultLabel: 'Output & outcome',
        works: {
            'darbas-01': {
                numLabel: 'Node #01',
                categoryLabel: 'Solid-Fuel Boiler Pellet Retrofits',
                title: 'Cast-Iron Viadrus U26 Boiler Conversion with Megatherm MPB Pellet Burner',
                location: 'Viadrus U26 + Megatherm MPB',
                powerKw: '25–35 kW',
                fuelOrMedium: 'Wood pellets (DINplus 6–8 mm)',
                boilerModel: 'Viadrus U26 (cast-iron sectional solid-fuel boiler)',
                burnerOrEquipment: 'Megatherm MPB self-cleaning pellet burner + CNC door flange',
                scopeExecuted:
                    'Replaced the lower loading door with a CNC-cut steel mounting door, installed heat-exchanger turbulators, and connected the feed auger and controller.',
                resultMetric: 'Installed in 4–6 hrs · 100% automatic operation',
                ctaLabel: 'Match to my Viadrus boiler',
            },
            'darbas-02': {
                numLabel: 'Node #02',
                categoryLabel: 'Solid-Fuel Boiler Pellet Retrofits',
                title: 'Viadrus U26 Boiler Room Assembly with 460 L Pellet Hopper and Feed Auger',
                location: '“Link Lyderių” Kit',
                powerKw: '10–35 kW',
                fuelOrMedium: 'Wood pellets',
                boilerModel: 'Viadrus U26 + 460 L galvanized pellet hopper',
                burnerOrEquipment: '“Link Lyderių” Kit (Megatherm 10–35 kW + 1.5 m auger + air compressor)',
                scopeExecuted:
                    'Full solid-fuel boiler room automation: installed 460 L hopper, 1.5 m screw auger, pneumatic ash cleaning with compressor, and room thermostat.',
                resultMetric: '7–10 days autonomous operation per fill',
                ctaLabel: 'Order “Link Lyderių” kit',
            },
            'darbas-06': {
                numLabel: 'Node #06',
                categoryLabel: 'Industrial & Containerized Boiler Plants',
                title: '500 kW Industrial Containerized Biomass Boiler Plant GK-500 (Factory Assembled)',
                location: 'Container Plant GK-500',
                powerKw: '500 kW',
                fuelOrMedium: 'Wood pellets / biomass',
                boilerModel: 'Gilės GK-500 containerized biomass module (6,058 × 2,438 × 2,896 mm)',
                burnerOrEquipment: 'Industrial moving-grate boiler, multicyclone & GSM/SCADA telemetry',
                scopeExecuted:
                    'Factory-assembled, hydro-tested, and insulated 500 kW container heating module with automatic fuel feed, flue-gas cleaning, and remote telemetry.',
                resultMetric: 'Turnkey factory assembly & hydrostatic test',
                ctaLabel: 'GK-500 specifications & ROI',
            },
            'darbas-08': {
                numLabel: 'Node #08',
                categoryLabel: 'Industrial & Containerized Boiler Plants',
                title: '2.0 MW Modular Industrial Boiler Plant with Walking-Floor Silo & Flue Filtration',
                location: 'Modular Complex GK-2000',
                powerKw: '2,000 kW (2.0 MW)',
                fuelOrMedium: 'Biomass (G30–G50 woodchips / wood pellets)',
                boilerModel: 'Gilės GK-2000 industrial cascade boiler complex',
                burnerOrEquipment: 'Walking-Floor fuel store + multicyclone + automatic ash extraction',
                scopeExecuted:
                    'High-capacity industrial biomass complex featuring a Walking-Floor fuel bunker, multi-stage flue gas filtration, and SCADA dispatch control.',
                resultMetric: 'Meets EU EcoDesign & environmental emission norms',
                ctaLabel: 'Request 1–2.5 MW quote',
            },
            'darbas-10': {
                numLabel: 'Node #10',
                categoryLabel: 'Industrial & Containerized Boiler Plants',
                title: '500 kW Rooftop Containerized Gas Boiler Room with Cascade Boilers & Flues',
                location: 'Rooftop Gas Boiler Plant',
                powerKw: '500 kW',
                fuelOrMedium: 'Natural gas',
                boilerModel: 'Rooftop containerized gas boiler plant',
                burnerOrEquipment: 'Cascade gas boilers + stainless-steel flues + pump station',
                scopeExecuted:
                    'Engineered, manufactured, and crane-mounted a 500 kW rooftop containerized gas boiler plant with cascade automation and stainless-steel chimneys.',
                resultMetric: 'Rooftop installation without losing indoor floor area',
                ctaLabel: 'Containerized boiler project',
            },
            'darbas-11': {
                numLabel: 'Node #11',
                categoryLabel: 'Heat Pumps & Hydronic Substations',
                title: '200 kW Boiler Room Hydronic Substation, Distribution Manifolds & Balancing',
                location: 'Hydronic Substation',
                powerKw: '200 kW',
                fuelOrMedium: 'Hydronic heating loop',
                boilerModel: '200 kW industrial hydronic substation with distribution headers',
                burnerOrEquipment: 'Electronic circulation pumps + IMI TA STAD/STAP balancing valves + Pneumatex',
                scopeExecuted:
                    'Assembled a 200 kW boiler room hydronic substation with mixing valves, electronic circulation pumps, and precision IMI TA flow balancing.',
                resultMetric: 'Precision multi-zone hydronic flow balancing',
                ctaLabel: 'Calculate hydronic node',
            },
        },
    },
    pl: {
        boilerModuleLabel: 'Kocioł / Moduł: ',
        burnerEquipmentLabel: 'Palnik / Osprzęt: ',
        powerLabel: 'Moc',
        fuelLabel: 'Paliwo',
        resultLabel: 'Rezultat',
        zoomPhotoLabel: 'Powiększ zdjęcie',
        zoomAriaPrefix: 'Powiększ zdjęcie',
        closePreviewAria: 'Zamknij podgląd',
        powerAndResultLabel: 'Moc i rezultat',
        works: {
            'darbas-01': {
                numLabel: 'Węzeł #01',
                categoryLabel: 'Modernizacja kotłów na pellet',
                title: 'Modernizacja żeliwnego kotła Viadrus U26 z palnikiem peletowym Megatherm MPB',
                location: 'Viadrus U26 + Megatherm MPB',
                powerKw: '25–35 kW',
                fuelOrMedium: 'Pellet drzewny (DINplus 6–8 mm)',
                boilerModel: 'Viadrus U26 (żeliwny członowy kocioł stałopalny)',
                burnerOrEquipment: 'Samoczyszczący palnik Megatherm MPB + kołnierz CNC drzwiczek',
                scopeExecuted:
                    'Zamiast dolnych drzwiczek zamontowano nowe stalowe drzwiczki CNC z otworem pod palnik, zawirowywacze spalin oraz podajnik ślimakowy ze sterownikiem.',
                resultMetric: 'Montaż w 4–6 godz. · 100% praca automatyczna',
                ctaLabel: 'Dopasuj do mojego kotła Viadrus',
            },
            'darbas-02': {
                numLabel: 'Węzeł #02',
                categoryLabel: 'Modernizacja kotłów na pellet',
                title: 'Układ kotłowni Viadrus U26 z zasobnikiem pelletu 460 L i podajnikiem',
                location: 'Zestaw „Link Lyderių”',
                powerKw: '10–35 kW',
                fuelOrMedium: 'Pellet drzewny',
                boilerModel: 'Viadrus U26 + ocynkowany zasobnik pelletu 460 L',
                burnerOrEquipment: 'Zestaw „Link Lyderių” (Megatherm 10–35 kW + podajnik 1,5 m + kompresor)',
                scopeExecuted:
                    'Pełna automatyzacja kotłowni stałopalnej: zasobnik 460 L, podajnik ślimakowy 1,5 m, pneumatyczne czyszczenie szlaki kompresorem i termostat pokojowy.',
                resultMetric: 'Praca autonomiczna 7–10 dni bez dosypywania',
                ctaLabel: 'Zamów zestaw „Link Lyderių”',
            },
            'darbas-06': {
                numLabel: 'Węzeł #06',
                categoryLabel: 'Kotłownie przemysłowe i kontenerowe',
                title: 'Przemysłowa kontenerowa kotłownia biomasowa 500 kW GK-500 (montaż fabryczny)',
                location: 'Kotłownia kontenerowa GK-500',
                powerKw: '500 kW',
                fuelOrMedium: 'Pellet drzewny / biomasa',
                boilerModel: 'Kontenerowy moduł biomasowy Gilės GK-500 (6 058 × 2 438 × 2 896 mm)',
                burnerOrEquipment: 'Kocioł przemysłowy z rusztem ruchomym, multicyklonem i GSM/SCADA',
                scopeExecuted:
                    'Zmontowany fabrycznie, przetestowany hydraulicznie i zaizolowany moduł grzewczy 500 kW z automatycznym podawaniem paliwa, odpylaniem i telemetrią.',
                resultMetric: 'Pełny montaż fabryczny i próba ciśnieniowa',
                ctaLabel: 'Specyfikacja GK-500 i ROI',
            },
            'darbas-08': {
                numLabel: 'Węzeł #08',
                categoryLabel: 'Kotłownie przemysłowe i kontenerowe',
                title: 'Modułowa kotłownia przemysłowa 2,0 MW z magazynem paliwa i odpylaniem spalin',
                location: 'Kompleks modułowy GK-2000',
                powerKw: '2 000 kW (2,0 MW)',
                fuelOrMedium: 'Biomasa (zrębka G30–G50 / pellet drzewny)',
                boilerModel: 'Kaskadowy kompleks kotłowni przemysłowej Gilės GK-2000',
                burnerOrEquipment: 'Magazyn paliwa Walking-Floor + multicyklon + automatyczne odpopielanie',
                scopeExecuted:
                    'Przemysłowy kompleks biomasowy dużej mocy z ruchomą podłogą Walking-Floor, wielostopniową filtracją spalin oraz systemem dyspozytorskim SCADA.',
                resultMetric: 'Spełnia normy UE EcoDesign i ochrony środowiska',
                ctaLabel: 'Otrzymaj ofertę 1–2,5 MW',
            },
            'darbas-10': {
                numLabel: 'Węzeł #10',
                categoryLabel: 'Kotłownie przemysłowe i kontenerowe',
                title: 'Kontenerowa kotłownia gazowa 500 kW z kotłami kaskadowymi i kominami',
                location: 'Dachowa kotłownia gazowa',
                powerKw: '500 kW',
                fuelOrMedium: 'Gaz ziemny',
                boilerModel: 'Dachowa kontenerowa kotłownia gazowa',
                burnerOrEquipment: 'Kotły gazowe w kaskadzie + kominy ze stali nierdzewnej + grupa pompowa',
                scopeExecuted:
                    'Zaprojektowana, wyprodukowana i zamontowana na dachu budynku kontenerowa kotłownia gazowa 500 kW z automatyką kaskadową i kominami INOX.',
                resultMetric: 'Montaż na dachu bez utraty powierzchni użytkowej',
                ctaLabel: 'Projekt kotłowni kontenerowej',
            },
            'darbas-11': {
                numLabel: 'Węzeł #11',
                categoryLabel: 'Pompy ciepła i węzły cieplne',
                title: 'Węzeł cieplny kotłowni 200 kW, rozdzielacze i równoważenie hydrauliczne',
                location: 'Hydrauliczny węzeł cieplny',
                powerKw: '200 kW',
                fuelOrMedium: 'Obieg grzewczy',
                boilerModel: 'Przemysłowy węzeł cieplny 200 kW z rozdzielaczami',
                burnerOrEquipment: 'Pompy elektroniczne + zawory równoważące IMI TA STAD/STAP + Pneumatex',
                scopeExecuted:
                    'Zmontowany hydrauliczny węzeł cieplny 200 kW z zaworami mieszającymi, elektronicznymi pompami obiegowymi oraz równoważeniem przepływów IMI TA.',
                resultMetric: 'Precyzyjne równoważenie hydrauliczne obiegów',
                ctaLabel: 'Oblicz węzeł cieplny',
            },
        },
    },
    ru: {
        boilerModuleLabel: 'Котел / Модуль: ',
        burnerEquipmentLabel: 'Горелка / Оборудование: ',
        powerLabel: 'Мощность',
        fuelLabel: 'Топливо',
        resultLabel: 'Результат',
        zoomPhotoLabel: 'Увеличить фото',
        zoomAriaPrefix: 'Увеличить фото',
        closePreviewAria: 'Закрыть просмотр',
        powerAndResultLabel: 'Мощность и результат',
        works: {
            'darbas-01': {
                numLabel: 'Узел #01',
                categoryLabel: 'Перевод котлов на пеллеты',
                title: 'Модернизация чугунного котла Viadrus U26 с пеллетной горелкой Megatherm MPB',
                location: 'Viadrus U26 + Megatherm MPB',
                powerKw: '25–35 кВт',
                fuelOrMedium: 'Древесные гранулы (DINplus 6–8 мм)',
                boilerModel: 'Viadrus U26 (чугунный секционный твердотопливный котел)',
                burnerOrEquipment: 'Самоочищающаяся горелка Megatherm MPB + ЧПУ фланец дверцы',
                scopeExecuted:
                    'Вместо нижней загрузочной дверцы установлена новая стальная дверца ЧПУ с посадочным окном горелки, установлены турбулизаторы, подключены шнек и контроллер.',
                resultMetric: 'Монтаж за 4–6 ч. · 100 % автоматический режим',
                ctaLabel: 'Подобрать для моего котла Viadrus',
            },
            'darbas-02': {
                numLabel: 'Узел #02',
                categoryLabel: 'Перевод котлов на пеллеты',
                title: 'Узел котельной Viadrus U26 с бункером пеллет 460 л и шнековым питателем',
                location: 'Комплект «Link Lyderių»',
                powerKw: '10–35 кВт',
                fuelOrMedium: 'Древесные гранулы',
                boilerModel: 'Viadrus U26 + оцинкованный бункер гранул 460 л',
                burnerOrEquipment: 'Комплект «Link Lyderių» (Megatherm 10–35 кВт + шнек 1,5 м + компрессор)',
                scopeExecuted:
                    'Полная автоматизация твердотопливной котельной: бункер 460 л, шнек подачи топлива 1,5 м, пневмоочистка компрессором и комнатный термостат.',
                resultMetric: 'Автономная работа 7–10 суток без дозагрузки',
                ctaLabel: 'Заказать комплект «Link Lyderių»',
            },
            'darbas-06': {
                numLabel: 'Узел #06',
                categoryLabel: 'Промышленные и контейнерные котельные',
                title: 'Промышленная контейнерная биокотельная 500 кВт GK-500 (заводская сборка)',
                location: 'Контейнерная котельная GK-500',
                powerKw: '500 кВт',
                fuelOrMedium: 'Древесные гранулы / биотопливо',
                boilerModel: 'Контейнерный биомодуль Gilės GK-500 (6 058 × 2 438 × 2 896 мм)',
                burnerOrEquipment: 'Промышленный котел с подвижными колосниками, мультициклоном и GSM/SCADA',
                scopeExecuted:
                    'Собранный на заводе, гидравлически испытанный и утепленный 500 кВт контейнерный тепловой модуль с автоподачей топлива, очисткой дымовых газов и телеметрией.',
                resultMetric: 'Полная заводская сборка и гидроиспытания',
                ctaLabel: 'Спецификация GK-500 и ROI',
            },
            'darbas-08': {
                numLabel: 'Узел #08',
                categoryLabel: 'Промышленные и контейнерные котельные',
                title: 'Модульная промышленная котельная 2,0 МВт со складом топлива и газоочисткой',
                location: 'Модульный комплекс GK-2000',
                powerKw: '2 000 кВт (2,0 МВт)',
                fuelOrMedium: 'Биотопливо (щепа G30–G50 / древесные пеллеты)',
                boilerModel: 'Промышленный каскадный комплекс Gilės GK-2000',
                burnerOrEquipment: 'Склад топлива Walking-Floor + мультициклон + золоудаление',
                scopeExecuted:
                    'Промышленный биоэнергетический комплекс большой мощности со складом «подвижный пол» (Walking-Floor), многоступенчатой очисткой дымовых газов и SCADA.',
                resultMetric: 'Соответствует нормам ЕС EcoDesign и экологии',
                ctaLabel: 'Получить предложение 1–2,5 МВт',
            },
            'darbas-10': {
                numLabel: 'Узел #10',
                categoryLabel: 'Промышленные и контейнерные котельные',
                title: 'Контейнерная газовая котельная 500 кВт с каскадными котлами и дымоходами',
                location: 'Крышная газовая котельная',
                powerKw: '500 кВт',
                fuelOrMedium: 'Природный газ',
                boilerModel: 'Крышная контейнерная газовая котельная',
                burnerOrEquipment: 'Каскадные газовые котлы + дымоходы из нержавеющей стали + насосная группа',
                scopeExecuted:
                    'Спроектирована, изготовлена и смонтирована на кровле здания 500 кВт контейнерная газовая котельная с каскадной автоматикой и дымоходами.',
                resultMetric: 'Монтаж на крыше без потери внутренней площади',
                ctaLabel: 'Проект контейнерной котельной',
            },
            'darbas-11': {
                numLabel: 'Узел #11',
                categoryLabel: 'Тепловые насосы и теплоузлы',
                title: 'Тепловой узел котельной 200 кВт, распределительные коллекторы и балансировка',
                location: 'Гидравлический тепловой узел',
                powerKw: '200 кВт',
                fuelOrMedium: 'Отопительный контур',
                boilerModel: 'Промышленный тепловой узел 200 кВт с распределительными коллекторами',
                burnerOrEquipment: 'Электронные насосы + балансировочные клапаны IMI TA STAD/STAP + Pneumatex',
                scopeExecuted:
                    'Смонтирован гидравлический тепловой узел котельной 200 кВт со смесительными клапанами, электронными циркуляционными насосами и балансировкой IMI TA.',
                resultMetric: 'Точная гидравлическая балансировка контуров',
                ctaLabel: 'Рассчитать тепловой узел',
            },
        },
    },
};

export function LocalizedCompletedWorksHomeShowcase({ locale: rawLocale }: { locale: string }) {
    const locale = resolveAppLocale(rawLocale);
    const copy = COMPLETED_WORKS_I18N[locale];
    const [lightboxWorkId, setLightboxWorkId] = useState<string | null>(null);

    const featuredWorks = HOME_FEATURED_WORK_IDS.map((id) => {
        const base = GILES_COMPLETED_WORKS.find((w) => w.id === id);
        if (!base) return null;
        const tr = copy.works[id];
        return {
            ...base,
            numLabel: tr?.numLabel || base.numLabel,
            categoryLabel: tr?.categoryLabel || base.categoryLabel,
            title: tr?.title || base.title,
            location: tr?.location || base.location,
            powerKw: tr?.powerKw || base.powerKw,
            fuelOrMedium: tr?.fuelOrMedium || base.fuelOrMedium,
            boilerModel: tr?.boilerModel || base.boilerModel,
            burnerOrEquipment: tr?.burnerOrEquipment || base.burnerOrEquipment,
            scopeExecuted: tr?.scopeExecuted || base.scopeExecuted,
            resultMetric: tr?.resultMetric || base.resultMetric,
            ctaLabel: tr?.ctaLabel || base.ctaLabel,
        };
    }).filter((item): item is NonNullable<typeof item> => Boolean(item));

    const lightboxWork = featuredWorks.find((w) => w.id === lightboxWorkId) || null;

    useEffect(() => {
        if (!lightboxWork) return;
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setLightboxWorkId(null);
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [lightboxWork]);

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 border-t border-l border-[#E2DDD3]">
                {featuredWorks.map((pr) => (
                    <article
                        key={pr.id}
                        data-testid={`home-completed-work-${pr.id}`}
                        className="flex flex-col justify-between border-r border-b border-[#E2DDD3] bg-[#FFFFFF] rounded-none overflow-hidden"
                    >
                        <div>
                            <div
                                onClick={() => setLightboxWorkId(pr.id)}
                                className="group relative h-52 bg-[#EEEBE4] border-b border-[#E2DDD3] p-4 flex items-center justify-center cursor-zoom-in overflow-hidden"
                            >
                                <img
                                    src={assetUrl(pr.imageUrl)}
                                    alt={pr.title}
                                    className="max-h-full max-w-full object-contain mix-blend-multiply transition-transform duration-200 group-hover:scale-105"
                                />
                                <span className="absolute left-3 top-3 bg-[#11161B] text-white px-2.5 py-1 font-mono text-xs font-bold">
                                    {pr.numLabel} · {pr.location}
                                </span>
                                <span className="absolute left-3 bottom-3 bg-[#C2410C] text-white px-2.5 py-0.5 text-xs font-bold">
                                    {pr.categoryLabel}
                                </span>
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setLightboxWorkId(pr.id);
                                    }}
                                    aria-label={`${copy.zoomAriaPrefix} ${pr.title}`}
                                    className="absolute right-3 bottom-3 bg-white border border-[#11161B] text-[#11161B] px-2.5 py-1 text-xs font-bold inline-flex items-center gap-1 cursor-pointer min-h-[34px]"
                                >
                                    <ZoomIn className="w-3.5 h-3.5 text-[#C2410C]" />
                                    <span>800×800</span>
                                </button>
                            </div>
                            <div className="p-6 space-y-2.5">
                                <h3 className="text-lg font-extrabold text-[#11161B] leading-snug">
                                    {pr.title}
                                </h3>
                                <p className="text-xs sm:text-sm text-[#5B6470] leading-relaxed">
                                    {pr.scopeExecuted}
                                </p>
                                <div className="pt-2 border-t border-[#E2DDD3] text-xs space-y-1 text-[#2A323B]">
                                    <div>
                                        <span className="text-[#5B6470]">{copy.boilerModuleLabel}</span>
                                        <strong className="text-[#11161B]">{pr.boilerModel}</strong>
                                    </div>
                                    <div>
                                        <span className="text-[#5B6470]">{copy.burnerEquipmentLabel}</span>
                                        <strong className="text-[#11161B]">{pr.burnerOrEquipment}</strong>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="px-6 pb-6 space-y-3">
                            <div className="grid grid-cols-3 gap-2 pt-4 border-t border-[#E2DDD3] text-xs">
                                <div>
                                    <span className="text-[#5B6470] block">{copy.powerLabel}</span>
                                    <span className="font-extrabold text-[#11161B] block mt-0.5">
                                        {pr.powerKw}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-[#5B6470] block">{copy.fuelLabel}</span>
                                    <span className="font-extrabold text-[#11161B] block mt-0.5">
                                        {pr.fuelOrMedium}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-[#5B6470] block">{copy.resultLabel}</span>
                                    <span className="font-extrabold text-[#157A3B] block mt-0.5">
                                        {pr.resultMetric}
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center justify-between gap-2 pt-1">
                                <Link
                                    href={`/${locale}${pr.ctaHref.startsWith('#') ? `/inzinerija${pr.ctaHref}` : pr.ctaHref}`}
                                    className="text-xs font-bold text-[#C2410C] hover:text-[#11161B] underline"
                                >
                                    {pr.ctaLabel}
                                </Link>
                                <button
                                    type="button"
                                    onClick={() => setLightboxWorkId(pr.id)}
                                    className="text-xs font-semibold text-[#11161B] hover:text-[#C2410C] cursor-pointer"
                                >
                                    {copy.zoomPhotoLabel}
                                </button>
                            </div>
                        </div>
                    </article>
                ))}
            </div>

            {lightboxWork && (
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-label={lightboxWork.title}
                    onClick={() => setLightboxWorkId(null)}
                    className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className="bg-white border-2 border-[#11161B] max-w-4xl w-full max-h-[92vh] overflow-y-auto p-5 sm:p-6 space-y-4"
                    >
                        <div className="flex items-start justify-between gap-4 border-b border-[#E2DDD3] pb-3">
                            <div>
                                <span className="font-mono text-xs font-bold text-[#C2410C] block">
                                    {lightboxWork.numLabel} · {lightboxWork.categoryLabel} · {lightboxWork.location}
                                </span>
                                <h3 className="text-lg sm:text-xl font-extrabold text-[#11161B]">
                                    {lightboxWork.title}
                                </h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setLightboxWorkId(null)}
                                aria-label={copy.closePreviewAria}
                                className="border border-[#11161B] bg-[#F5F3EE] hover:bg-[#11161B] hover:text-white p-2 cursor-pointer min-h-[44px] min-w-[44px] inline-flex items-center justify-center"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="bg-[#EEEBE4] border border-[#E2DDD3] p-4 flex items-center justify-center min-h-[360px] sm:min-h-[460px]">
                            <img
                                src={assetUrl(lightboxWork.imageUrl)}
                                alt={lightboxWork.title}
                                className="max-h-[500px] w-auto object-contain mix-blend-multiply"
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-[#F5F3EE] border border-[#E2DDD3] p-4 text-xs">
                            <div>
                                <span className="text-[#5B6470] block">{copy.boilerModuleLabel}</span>
                                <strong className="text-[#11161B]">{lightboxWork.boilerModel}</strong>
                            </div>
                            <div>
                                <span className="text-[#5B6470] block">{copy.burnerEquipmentLabel}</span>
                                <strong className="text-[#11161B]">{lightboxWork.burnerOrEquipment}</strong>
                            </div>
                            <div>
                                <span className="text-[#5B6470] block">{copy.powerAndResultLabel}</span>
                                <strong className="text-[#157A3B]">
                                    {lightboxWork.powerKw} · {lightboxWork.resultMetric}
                                </strong>
                            </div>
                        </div>

                        <p className="text-xs sm:text-sm text-[#2A323B] leading-relaxed">
                            {lightboxWork.scopeExecuted}
                        </p>
                    </div>
                </div>
            )}
        </>
    );
}

export function HydronicCutawayExplorer() {
    const [activeZoneId, setActiveZoneId] = useState<string>(HYDRONIC_HOUSE_ZONES[0].id);

    const activeZone =
        HYDRONIC_HOUSE_ZONES.find((z) => z.id === activeZoneId) || HYDRONIC_HOUSE_ZONES[0];

    return (
        <div
            data-testid="hydronic-cutaway-explorer"
            data-brand-filter-template="/products?brand="
            className="rounded-md border border-[var(--border)] bg-[var(--surface-paper)] p-3 sm:p-4"
        >
            {/* Explorer Top Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <div>
                    <span className="text-xs font-bold text-[var(--text-primary)] block">
                        Namo šildymo mazgų schema (5 zonų interaktyvus brėžinys)
                    </span>
                    <span className="text-xs text-[var(--text-secondary)]">
                        Katilinė 1,5 bar · Kolektorius 6–12 kontūrų · Radiatoriai ΔT 15K
                    </span>
                </div>
                <Link
                    href={activeZone.calculatorHref}
                    className="inline-flex items-center rounded-xs border border-[var(--brand-secondary)] bg-transparent px-2.5 py-1 text-xs font-semibold text-[var(--brand-secondary)] hover:bg-[var(--brand-secondary)] hover:text-[var(--secondary-foreground)] transition-colors whitespace-nowrap"
                >
                    Skaičiuoti šį mazgą
                </Link>
            </div>

            {/* 5 Clickable System Zone Tabs */}
            <div
                role="tablist"
                aria-label="Namo šildymo sistemos zonos"
                className="flex flex-wrap gap-1 mb-2"
            >
                {HYDRONIC_HOUSE_ZONES.map((zone) => {
                    const isSelected = zone.id === activeZone.id;
                    return (
                        <button
                            key={zone.id}
                            type="button"
                            role="tab"
                            aria-selected={isSelected}
                            data-testid={`hydronic-zone-tab-${zone.number}`}
                            onClick={() => setActiveZoneId(zone.id)}
                            className={`rounded-xs border px-2 py-1 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--ring)] ${
                                isSelected
                                    ? 'border-[var(--brand-accent)] bg-[var(--brand-accent)] text-[var(--primary-foreground)]'
                                    : 'border-[var(--border)] bg-transparent text-[var(--text-primary)] hover:border-[var(--text-primary)]'
                            }`}
                        >
                            {zone.tabLabel}
                        </button>
                    );
                })}
            </div>

            {/* Daylight Architectural House Cross-Section SVG Diagram - hidden on mobile so it never bloats vertical height */}
            <div className="hidden lg:block rounded-sm border border-[var(--border-subtle)] bg-[var(--surface-card)] p-2 mb-2">
                <svg
                    viewBox="0 0 560 118"
                    role="img"
                    aria-label="Namo šildymo sistemos 5 zonų pjūvio brėžinys"
                    className="w-full h-24 sm:h-28 block"
                >
                    <polygon
                        points="16,32 280,6 544,32 544,112 16,112"
                        fill="var(--surface-paper)"
                        stroke="var(--border)"
                        strokeWidth="1.5"
                    />
                    <line x1="16" y1="68" x2="544" y2="68" stroke="var(--border)" strokeWidth="1.5" />
                    <line x1="155" y1="32" x2="155" y2="112" stroke="var(--border)" strokeWidth="1.25" strokeDasharray="3 2" />
                    <line x1="355" y1="32" x2="355" y2="112" stroke="var(--border)" strokeWidth="1.25" strokeDasharray="3 2" />

                    <polyline
                        points="58,92 128,92 210,92 430,92 480,50 260,50"
                        fill="none"
                        stroke="var(--brand-accent)"
                        strokeWidth="2"
                    />
                    <polyline
                        points="260,55 488,55 438,97 210,97 128,97 58,97"
                        fill="none"
                        stroke="var(--brand-secondary)"
                        strokeWidth="1.5"
                        strokeDasharray="4 2"
                    />

                    <g
                        onClick={() => setActiveZoneId('katiline')}
                        className="cursor-pointer"
                    >
                        <rect
                            x="26"
                            y="74"
                            width="118"
                            height="32"
                            rx="3"
                            fill={activeZone.id === 'katiline' ? 'var(--surface-subtle)' : 'var(--surface-card)'}
                            stroke={activeZone.id === 'katiline' ? 'var(--brand-accent)' : 'var(--border)'}
                            strokeWidth={activeZone.id === 'katiline' ? '2' : '1.2'}
                        />
                        <circle
                            cx="40"
                            cy="90"
                            r="9"
                            fill={activeZone.id === 'katiline' ? 'var(--brand-accent)' : 'var(--brand-secondary)'}
                        />
                        <text x="40" y="94" textAnchor="middle" fill="var(--primary-foreground)" fontSize="12" fontWeight="700">
                            3
                        </text>
                        <text x="54" y="94" fill="var(--text-primary)" fontSize="12" fontWeight="700">
                            Katilinė 1,5 bar
                        </text>
                    </g>

                    <g
                        onClick={() => setActiveZoneId('nuorinimas')}
                        className="cursor-pointer"
                    >
                        <rect
                            x="26"
                            y="34"
                            width="118"
                            height="29"
                            rx="3"
                            fill={activeZone.id === 'nuorinimas' ? 'var(--surface-subtle)' : 'var(--surface-card)'}
                            stroke={activeZone.id === 'nuorinimas' ? 'var(--brand-accent)' : 'var(--border)'}
                            strokeWidth={activeZone.id === 'nuorinimas' ? '2' : '1.2'}
                        />
                        <circle
                            cx="40"
                            cy="48"
                            r="9"
                            fill={activeZone.id === 'nuorinimas' ? 'var(--brand-accent)' : 'var(--brand-secondary)'}
                        />
                        <text x="40" y="52" textAnchor="middle" fill="var(--primary-foreground)" fontSize="12" fontWeight="700">
                            5
                        </text>
                        <text x="54" y="52" fill="var(--text-primary)" fontSize="12" fontWeight="700">
                            Nuorinimas
                        </text>
                    </g>

                    <g
                        onClick={() => setActiveZoneId('grindinis')}
                        className="cursor-pointer"
                    >
                        <rect
                            x="166"
                            y="74"
                            width="178"
                            height="32"
                            rx="3"
                            fill={activeZone.id === 'grindinis' ? 'var(--surface-subtle)' : 'var(--surface-card)'}
                            stroke={activeZone.id === 'grindinis' ? 'var(--brand-accent)' : 'var(--border)'}
                            strokeWidth={activeZone.id === 'grindinis' ? '2' : '1.2'}
                        />
                        <circle
                            cx="181"
                            cy="90"
                            r="9"
                            fill={activeZone.id === 'grindinis' ? 'var(--brand-accent)' : 'var(--brand-secondary)'}
                        />
                        <text x="181" y="94" textAnchor="middle" fill="var(--primary-foreground)" fontSize="12" fontWeight="700">
                            2
                        </text>
                        <text x="196" y="94" fill="var(--text-primary)" fontSize="12" fontWeight="700">
                            Kolektorius 6–12 kont.
                        </text>
                    </g>

                    <g
                        onClick={() => setActiveZoneId('balansavimas')}
                        className="cursor-pointer"
                    >
                        <rect
                            x="366"
                            y="74"
                            width="166"
                            height="32"
                            rx="3"
                            fill={activeZone.id === 'balansavimas' ? 'var(--surface-subtle)' : 'var(--surface-card)'}
                            stroke={activeZone.id === 'balansavimas' ? 'var(--brand-accent)' : 'var(--border)'}
                            strokeWidth={activeZone.id === 'balansavimas' ? '2' : '1.2'}
                        />
                        <circle
                            cx="381"
                            cy="90"
                            r="9"
                            fill={activeZone.id === 'balansavimas' ? 'var(--brand-accent)' : 'var(--brand-secondary)'}
                        />
                        <text x="381" y="94" textAnchor="middle" fill="var(--primary-foreground)" fontSize="12" fontWeight="700">
                            4
                        </text>
                        <text x="396" y="94" fill="var(--text-primary)" fontSize="12" fontWeight="700">
                            Balansavimas (IMI TA)
                        </text>
                    </g>

                    <g
                        onClick={() => setActiveZoneId('radiatoriai')}
                        className="cursor-pointer"
                    >
                        <rect
                            x="166"
                            y="34"
                            width="366"
                            height="29"
                            rx="3"
                            fill={activeZone.id === 'radiatoriai' ? 'var(--surface-subtle)' : 'var(--surface-card)'}
                            stroke={activeZone.id === 'radiatoriai' ? 'var(--brand-accent)' : 'var(--border)'}
                            strokeWidth={activeZone.id === 'radiatoriai' ? '2' : '1.2'}
                        />
                        <circle
                            cx="181"
                            cy="48"
                            r="9"
                            fill={activeZone.id === 'radiatoriai' ? 'var(--brand-accent)' : 'var(--brand-secondary)'}
                        />
                        <text x="181" y="52" textAnchor="middle" fill="var(--primary-foreground)" fontSize="12" fontWeight="700">
                            1
                        </text>
                        <text x="196" y="52" fill="var(--text-primary)" fontSize="12" fontWeight="700">
                            Radiatoriai ΔT 15K · Danfoss RA 2970 + Eclipse
                        </text>
                    </g>
                </svg>
            </div>

            <div className="mb-2 pt-1.5 border-t border-[var(--border-subtle)] flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="font-bold text-[var(--text-primary)]">
                    {activeZone.zoneTitle}
                </span>
                <span className="text-[var(--brand-secondary)] font-semibold">
                    {activeZone.engineeringParam}
                </span>
            </div>

            {/* 4 Flagship SKUs of Selected Hydronic Zone */}
            <div
                data-testid="hydronic-zone-sku-grid"
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2"
            >
                {activeZone.items.map((item) => (
                    <div
                        key={item.sku}
                        className="rounded-sm border border-[var(--border)] bg-[var(--surface-card)] overflow-hidden transition-colors hover:border-[var(--text-primary)]"
                    >
                        <Link
                            href={item.href}
                            className="group flex items-center gap-2 p-2 bg-transparent overflow-hidden"
                        >
                            <div className="h-12 w-12 shrink-0 rounded-xs bg-[var(--surface-card)] border border-[var(--border-subtle)] flex items-center justify-center p-1 overflow-hidden">
                                <img
                                    src={assetUrl(item.imageUrl)}
                                    alt={cleanDash(item.title)}
                                    className="h-full w-full object-contain"
                                />
                            </div>
                            <div className="min-w-0 flex-1 overflow-hidden">
                                <div className="flex items-center justify-between gap-1 mb-0.5 overflow-hidden">
                                    <img
                                        src={assetUrl(item.brandLogoUrl)}
                                        alt=""
                                        aria-hidden="true"
                                        className="h-3.5 w-auto object-contain shrink-0"
                                    />
                                    <span className="tabular-nums text-xs font-semibold text-[var(--text-primary)] bg-[var(--surface-paper)] border border-[var(--border-subtle)] px-1.5 py-0.5 rounded-xs whitespace-nowrap shrink-0">
                                        {item.sku}
                                    </span>
                                </div>
                                <h3 className="text-xs font-bold text-[var(--text-primary)] leading-tight group-hover:text-[var(--brand-accent)] line-clamp-1">
                                    {cleanDash(item.title)}
                                </h3>
                                <p className="text-xs text-[var(--text-secondary)] line-clamp-1 mt-0.5">
                                    {item.specSummary}
                                </p>
                            </div>
                        </Link>
                    </div>
                ))}
            </div>
        </div>
    );
}

