'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLocale } from 'next-intl';
import { ShoppingCart, Phone, Wrench, Flame, ShieldCheck } from 'lucide-react';
import { useCartStore } from '../../../store/cart';
import { useVatDisplayStore } from '../../../store/vat-display';
import { assetUrl } from '../../../lib/api';
import { resolveAppLocale } from '../../../i18n/storefront-ui-copy';
import type { AppLocale } from '../../../i18n/routing';
import {
    BOILER_CONVERSION_MODELS,
    BOILER_HOPPER_OPTIONS,
    computeBoilerConversionBundle,
    GILES_COMPANY_IDENTITY,
} from '../../../lib/giles-masterpiece-data';
import { GilesDoorConversionSchematic } from '../../../components/giles-animated-schematics';

const STUDIO_SHOWCASE_BURNERS: Array<{
    src: string;
    label: Record<AppLocale, string>;
}> = [
    {
        src: '/images/products/giles-studio-01-mpb-nani-35-50.webp',
        label: {
            lt: 'MPB NANI 35 (5–35 kW)',
            en: 'MPB NANI 35 (5–35 kW)',
            pl: 'MPB NANI 35 (5–35 kW)',
            ru: 'MPB NANI 35 (5–35 кВт)',
        },
    },
    {
        src: '/images/products/giles-studio-02-mpb-60-80-burner.webp',
        label: {
            lt: 'MPB 60 / 80 (25–80 kW)',
            en: 'MPB 60 / 80 (25–80 kW)',
            pl: 'MPB 60 / 80 (25–80 kW)',
            ru: 'MPB 60 / 80 (25–80 кВт)',
        },
    },
    {
        src: '/images/products/giles-studio-03-mpb-150-450-pro.webp',
        label: {
            lt: 'MPB 150–450 PRO',
            en: 'MPB 150–450 PRO',
            pl: 'MPB 150–450 PRO',
            ru: 'MPB 150–450 PRO',
        },
    },
    {
        src: '/images/products/giles-studio-04-viadrus-conversion-kit.webp',
        label: {
            lt: 'Viadrus U22/U26 flanšas',
            en: 'Viadrus U22/U26 CNC flange',
            pl: 'Flansza CNC Viadrus U22/U26',
            ru: 'Фланец ЧПУ Viadrus U22/U26',
        },
    },
    {
        src: '/images/products/giles-studio-05-pelltech-pv20a-kit.webp',
        label: {
            lt: 'Pelltech PV20a/30a',
            en: 'Pelltech PV20a/30a',
            pl: 'Pelltech PV20a/30a',
            ru: 'Pelltech PV20a/30a',
        },
    },
    {
        src: '/images/products/giles-studio-06-megatherm-burner-kit.webp',
        label: {
            lt: 'Megatherm komplektas',
            en: 'Megatherm burner kit',
            pl: 'Zestaw palnika Megatherm',
            ru: 'Комплект горелки Megatherm',
        },
    },
];

const POWER_PRESETS: Array<{
    kw: number;
    area: number;
    label: Record<AppLocale, string>;
}> = [
    {
        kw: 15,
        area: 120,
        label: {
            lt: '15 kW (iki 140 m²)',
            en: '15 kW (up to 140 m²)',
            pl: '15 kW (do 140 m²)',
            ru: '15 кВт (до 140 м²)',
        },
    },
    {
        kw: 25,
        area: 180,
        label: {
            lt: '25 kW (140–240 m²)',
            en: '25 kW (140–240 m²)',
            pl: '25 kW (140–240 m²)',
            ru: '25 кВт (140–240 м²)',
        },
    },
    {
        kw: 35,
        area: 280,
        label: {
            lt: '35 kW (240–340 m²)',
            en: '35 kW (240–340 m²)',
            pl: '35 kW (240–340 m²)',
            ru: '35 кВт (240–340 м²)',
        },
    },
    {
        kw: 50,
        area: 420,
        label: {
            lt: '50 kW (340–480 m²)',
            en: '50 kW (340–480 m²)',
            pl: '50 kW (340–480 m²)',
            ru: '50 кВт (340–480 м²)',
        },
    },
    {
        kw: 80,
        area: 700,
        label: {
            lt: '80 kW (500–800 m²)',
            en: '80 kW (500–800 m²)',
            pl: '80 kW (500–800 m²)',
            ru: '80 кВт (500–800 м²)',
        },
    },
    {
        kw: 150,
        area: 1100,
        label: {
            lt: '150 kW (800–1300 m²)',
            en: '150 kW (800–1300 m²)',
            pl: '150 kW (800–1300 m²)',
            ru: '150 кВт (800–1300 м²)',
        },
    },
    {
        kw: 300,
        area: 1500,
        label: {
            lt: '300 kW (iki 1500 m²)',
            en: '300 kW (up to 1500 m²)',
            pl: '300 kW (do 1500 m²)',
            ru: '300 кВт (до 1500 м²)',
        },
    },
];

const BOILER_MODEL_TRANSLATIONS: Record<
    string,
    Record<AppLocale, { name: string; typeLabel: string; compatibilityNote: string }>
> = {
    'viadrus-u22': {
        lt: {
            name: 'Viadrus U22 / U26 (ketinis)',
            typeLabel: 'Ketinis sekcijinis (4–10 sekcijų)',
            compatibilityNote: 'Tinka montuoti į apatines dureles su Gilės CNC flanšu be katilo pjovimo.',
        },
        en: {
            name: 'Viadrus U22 / U26 (cast iron)',
            typeLabel: 'Cast-iron sectional boiler (4–10 sections)',
            compatibilityNote: 'Mounts directly into the lower door using a Gilės CNC flange without cutting the boiler.',
        },
        pl: {
            name: 'Viadrus U22 / U26 (żeliwny)',
            typeLabel: 'Żeliwny kocioł członowy (4–10 członów)',
            compatibilityNote: 'Montaż w dolnych drzwiczkach z flanszą CNC Gilės bez cięcia korpusu kotła.',
        },
        ru: {
            name: 'Viadrus U22 / U26 (чугунный)',
            typeLabel: 'Чугунный секционный котел (4–10 секций)',
            compatibilityNote: 'Монтируется в нижнюю дверцу с ЧПУ-фланцем Gilės без резки корпуса котла.',
        },
    },
    kalvis: {
        lt: {
            name: 'Kalvis (plieninis kieto kuro)',
            typeLabel: 'Plieninis apatinio degimo (Kalvis 2-16 .. 2-40)',
            compatibilityNote: 'Didelis šilumokaitis užtikrina ~91 % naudingumo koeficientą su MPB NANI degikliu.',
        },
        en: {
            name: 'Kalvis (steel solid-fuel)',
            typeLabel: 'Bottom-burning steel boiler (Kalvis 2-16 .. 2-40)',
            compatibilityNote: 'Large three-pass heat exchanger reaches ~91% efficiency with an MPB NANI pellet burner.',
        },
        pl: {
            name: 'Kalvis (stalowy na paliwo stałe)',
            typeLabel: 'Stalowy kocioł dolnego spalania (Kalvis 2-16 .. 2-40)',
            compatibilityNote: 'Duży wymiennik ciepła zapewnia ~91% sprawności z palnikiem pelletowym MPB NANI.',
        },
        ru: {
            name: 'Kalvis (стальной твердотопливный)',
            typeLabel: 'Стальной котел нижнего горения (Kalvis 2-16 .. 2-40)',
            compatibilityNote: 'Большой теплообменник обеспечивает КПД ~91% с пеллетной горелкой MPB NANI.',
        },
    },
    'atmos-vigas': {
        lt: {
            name: 'Atmos / Vigas (dujų generacinis)',
            typeLabel: 'Pirolizinis / dujų generacinis katilas',
            compatibilityNote: 'Išsaugomas originalus ištraukimo ventiliatorius ir keraminė degimo kamera.',
        },
        en: {
            name: 'Atmos / Vigas (wood gasification)',
            typeLabel: 'Pyrolysis / wood gasification boiler',
            compatibilityNote: 'Preserves the original exhaust fan and ceramic combustion chamber.',
        },
        pl: {
            name: 'Atmos / Vigas (zgazowujący drewno)',
            typeLabel: 'Kocioł pirolityczny / zgazowujący drewno',
            compatibilityNote: 'Zachowuje oryginalny wentylator wyciągowy oraz ceramiczną komorę spalania.',
        },
        ru: {
            name: 'Atmos / Vigas (пиролизный)',
            typeLabel: 'Пиролизный / газогенераторный котел',
            compatibilityNote: 'Сохраняется оригинальный дымосос и керамическая камера сгорания.',
        },
    },
    stropuva: {
        lt: {
            name: 'Stropuva / Žvakė',
            typeLabel: 'Viršutinio degimo cilindrinis katilas',
            compatibilityNote: 'Komplektuojamas su lenktu flanšu ir deflektoriumi liepsnos nukreipimui.',
        },
        en: {
            name: 'Stropuva / Candle-type',
            typeLabel: 'Top-burning cylindrical boiler',
            compatibilityNote: 'Supplied with a curved radius adapter flange and flame deflector baffle.',
        },
        pl: {
            name: 'Stropuva / Świecowy',
            typeLabel: 'Cylindryczny kocioł górnego spalania',
            compatibilityNote: 'W zestawie profilowana flansza łukowa oraz deflektor płomienia.',
        },
        ru: {
            name: 'Stropuva / Свеча',
            typeLabel: 'Цилиндрический котел верхнего горения',
            compatibilityNote: 'Комплектуется радиусным фланцем и дефлектором направления пламени.',
        },
    },
    'buderus-dakon': {
        lt: {
            name: 'Buderus / Dakon / Bosch',
            typeLabel: 'Logano G211 / S111 / DOR serija',
            compatibilityNote: 'Tiesioginis tvirtinimas prie gamyklinio ketinio arba plieninio rėmo.',
        },
        en: {
            name: 'Buderus / Dakon / Bosch',
            typeLabel: 'Logano G211 / S111 / DOR series',
            compatibilityNote: 'Direct bolt-on mounting to the factory cast-iron or steel door frame.',
        },
        pl: {
            name: 'Buderus / Dakon / Bosch',
            typeLabel: 'Seria Logano G211 / S111 / DOR',
            compatibilityNote: 'Bezpośrednie mocowanie do fabrycznej ramy żeliwnej lub stalowej.',
        },
        ru: {
            name: 'Buderus / Dakon / Bosch',
            typeLabel: 'Серия Logano G211 / S111 / DOR',
            compatibilityNote: 'Прямое крепление к заводской чугунной или стальной рамке дверцы.',
        },
    },
    'industrial-100-500': {
        lt: {
            name: 'Pramoninis katilas (100–500 kW)',
            typeLabel: 'Didelės galios plieninis arba biokuro katilas',
            compatibilityNote: 'Komplektuojamas su savaime išsivalančiomis ardelėmis ir pramoniniu šneku.',
        },
        en: {
            name: 'Industrial boiler (100–500 kW)',
            typeLabel: 'High-output steel or biomass boiler',
            compatibilityNote: 'Equipped with self-cleaning moving grates and a heavy-duty industrial auger.',
        },
        pl: {
            name: 'Kocioł przemysłowy (100–500 kW)',
            typeLabel: 'Stalowy kocioł dużej mocy lub biomasowy',
            compatibilityNote: 'Wyposażony w samoczyszczący ruszt ruchomy oraz przemysłowy podajnik ślimakowy.',
        },
        ru: {
            name: 'Промышленный котел (100–500 кВт)',
            typeLabel: 'Мощный стальной или биомассовый котел',
            compatibilityNote: 'Комплектуется самоочищающимися подвижными колосниками и промышленным шнеком.',
        },
    },
};

const HOPPER_TRANSLATIONS: Record<
    string,
    Record<AppLocale, { title: string; autonomyDays: string }>
> = {
    'compact-200': {
        lt: {
            title: 'Kompaktinis 200 L granulių bunkeris',
            autonomyDays: '3–5 d. autonomija (siaurai katilinei)',
        },
        en: {
            title: 'Compact 200 L pellet hopper',
            autonomyDays: '3–5 days autonomy (for narrow boiler rooms)',
        },
        pl: {
            title: 'Kompaktowy zasobnik pelletu 200 L',
            autonomyDays: 'Autonomia 3–5 dni (do wąskiej kotłowni)',
        },
        ru: {
            title: 'Компактный бункер для пеллет 200 л',
            autonomyDays: 'Автономность 3–5 дней (для узкой котельной)',
        },
    },
    'standard-350': {
        lt: {
            title: 'Standartinis 350 L cinkuotas bunkeris',
            autonomyDays: '6–8 d. autonomija (populiariausias)',
        },
        en: {
            title: 'Standard 350 L galvanized hopper',
            autonomyDays: '6–8 days autonomy (most popular)',
        },
        pl: {
            title: 'Standardowy ocynkowany zasobnik 350 L',
            autonomyDays: 'Autonomia 6–8 dni (najpopularniejszy)',
        },
        ru: {
            title: 'Стандартный оцинкованный бункер 350 л',
            autonomyDays: 'Автономность 6–8 дней (самый популярный)',
        },
    },
    'large-800': {
        lt: {
            title: 'Didelis 500–1000 L modulinis bunkeris',
            autonomyDays: '14–21 d. autonomija',
        },
        en: {
            title: 'Large 500–1000 L modular hopper',
            autonomyDays: '14–21 days autonomy',
        },
        pl: {
            title: 'Duży modułowy zasobnik 500–1000 L',
            autonomyDays: 'Autonomia 14–21 dni',
        },
        ru: {
            title: 'Большой модульный бункер 500–1000 л',
            autonomyDays: 'Автономность 14–21 день',
        },
    },
};

const WIZARD_UI_COPY: Record<
    AppLocale,
    {
        heroEyebrow: string;
        heroTitle: string;
        heroSubtitle: string;
        engineerDariusLabel: string;
        addedBundleBtn: string;
        addFullBundleBtn: (price: string) => string;
        step1Badge: string;
        step1Title: string;
        flangeLabel: string;
        engineerNoteLabel: string;
        step2Badge: string;
        step2Title: string;
        recommendedLabel: string;
        areaAriaLabel: string;
        step3Badge: string;
        step3Title: string;
        vatGrossSuffix: string;
        vatNetSuffix: string;
        wifiTitle: string;
        wifiDesc: string;
        installTitle: string;
        installDesc: string;
        step4Badge: string;
        step4Title: string;
        inStockNote: string;
        colCode: string;
        colPartSpec: string;
        colPurpose: string;
        colPrice: string;
        mobilePurposePrefix: string;
        summaryBadge: string;
        summaryBoilerLabel: string;
        summaryAreaLabel: string;
        priceWithVatLabel: string;
        priceB2bNetLabel: string;
        annualSavingsLabel: string;
        perSeasonSuffix: string;
        paybackDurationLabel: string;
        paybackSeasonsValue: string;
        cadHeaderPrefix: string;
        cadUnitSuffix: string;
        cadSvgAria: string;
        cadBoilerLabel: string;
        cadChamberSuffix: string;
        cadAugerLabel: string;
        cadHopperLabel: string;
        cadHopperSub: string;
        cadFooterText: string;
        addAllToCartBtn: string;
        addedAllToCartBtn: string;
        dariusFormHeading: string;
        phonePlaceholder: string;
        phoneAria: string;
        cityPlaceholder: string;
        cityAria: string;
        quoteSubmittedBtn: string;
        quoteSubmitBtn: string;
        warrantyBadge: string;
        directConsultPrefix: string;
        viewAllBurnersLink: string;
    }
> = {
    lt: {
        heroEyebrow: 'UAB „Gilės inžinerija“ · Sprendimo vedlys',
        heroTitle: 'Katilo perdarymas į granulinį per 4 žingsnius',
        heroSubtitle:
            'Pasirinkite esamą kieto kuro katilą, šildomą plotą ir granulių bunkerį – vedlys automatiškai sukomplektuos degiklį, šneką, valdiklį ir montavimo flanšą.',
        engineerDariusLabel: 'Inžinierius Darius:',
        addedBundleBtn: 'Komplektas įdėtas į krepšelį',
        addFullBundleBtn: (p) => `Įdėti visą komplektą (${p})`,
        step1Badge: '1 žingsnis iš 4',
        step1Title: '1. Jūsų esamas katilas',
        flangeLabel: 'Flanšas:',
        engineerNoteLabel: 'Inžinieriaus pastaba:',
        step2Badge: '2 žingsnis iš 4',
        step2Title: '2. Šildomas plotas ir galia (60 m² – 1 500 m²)',
        recommendedLabel: 'Rekomenduojama:',
        areaAriaLabel: 'Šildomas plotas kvadratiniais metrais',
        step3Badge: '3 žingsnis iš 4',
        step3Title: '3. Kuro bunkeris ir automatika',
        vatGrossSuffix: 'su PVM',
        vatNetSuffix: 'be PVM',
        wifiTitle: 'Wi-Fi / interneto modulis valdymui telefonu (+145 € su PVM)',
        wifiDesc: 'Stebėkite temperatūrą, kuro likutį ir keiskite režimus telefone.',
        installTitle: 'Su Gilės Inžinerijos montavimu ir paleidimu objekte',
        installDesc: 'Atvykstame visoje Lietuvoje, sumontuojame flanšą ir suderiname degimą su analizatoriumi.',
        step4Badge: '4 žingsnis iš 4 · Galutinė specifikacija',
        step4Title: '4. Sukomplektuotas Gilės mazgas',
        inStockNote: 'Visos dalys sandėlyje Kaune · Pristatymas per 1–3 d. d.',
        colCode: 'Kodas',
        colPartSpec: 'Mazgo dalis / Specifikacija',
        colPurpose: 'Paskirtis',
        colPrice: 'Kaina',
        mobilePurposePrefix: 'Paskirtis:',
        summaryBadge: 'Jūsų sukomplektuotas mazgas',
        summaryBoilerLabel: 'Katilas:',
        summaryAreaLabel: 'Plotas:',
        priceWithVatLabel: 'Komplekto kaina su PVM (21%):',
        priceB2bNetLabel: 'Kaina įmonėms be PVM:',
        annualSavingsLabel: 'Prognozuojamas sutaupymas per metus:',
        perSeasonSuffix: '€ / sezoną',
        paybackDurationLabel: 'Atsipirkimo trukmė:',
        paybackSeasonsValue: '1,5–2 šildymo sezonai',
        cadHeaderPrefix: 'CAD brėžinys',
        cadUnitSuffix: 'kW mazgas · M 1:15',
        cadSvgAria: 'Katilo, CNC flanšo, degiklio ir bunkerio surinkimo CAD brėžinys',
        cadBoilerLabel: '[1] KATILAS',
        cadChamberSuffix: 'kW kamera',
        cadAugerLabel: '[4] Šnekas 2,0 m',
        cadHopperLabel: '[5] BUNKERIS',
        cadHopperSub: '350 L · 5–7 d.',
        cadFooterText: 'Montavimas į katilo dureles per 4–6 val.',
        addAllToCartBtn: 'Įdėti visą komplektą į krepšelį',
        addedAllToCartBtn: 'Visos komplekto dalys įdėtos į krepšelį',
        dariusFormHeading: 'Gauti inžinieriaus Dariaus patvirtinimą ir montavimo sąmatą',
        phonePlaceholder: 'Jūsų telefono nr. (+370 6...)',
        phoneAria: 'Jūsų telefono numeris',
        cityPlaceholder: 'Miestas / rajonas (pvz. Kaunas)',
        cityAria: 'Miestas arba rajonas',
        quoteSubmittedBtn: 'Užklausa priimta – Darius susisieks per 2 val.',
        quoteSubmitBtn: 'Gauti inžinieriaus Dariaus patvirtinimą',
        warrantyBadge: '24 mėn. garantija ir pogarantinis servisas visoje Lietuvoje',
        directConsultPrefix: 'Tiesioginė konsultacija:',
        viewAllBurnersLink: 'Peržiūrėti visus granulių degiklius kataloge',
    },
    en: {
        heroEyebrow: 'UAB „Gilės inžinerija“ · Boiler Conversion Wizard',
        heroTitle: 'Solid-Fuel to Pellet Boiler Conversion in 4 Steps',
        heroSubtitle:
            'Select your existing solid-fuel boiler, heated area, and pellet hopper – the wizard automatically matches the burner, auger, controller, and CNC mounting flange.',
        engineerDariusLabel: 'Lead Engineer Darius:',
        addedBundleBtn: 'Bundle added to cart',
        addFullBundleBtn: (p) => `Add complete kit (${p})`,
        step1Badge: 'Step 1 of 4',
        step1Title: '1. Your Existing Boiler',
        flangeLabel: 'Flange:',
        engineerNoteLabel: 'Engineer note:',
        step2Badge: 'Step 2 of 4',
        step2Title: '2. Heated Area & Required Output (60 m² – 1,500 m²)',
        recommendedLabel: 'Recommended:',
        areaAriaLabel: 'Heated area in square meters',
        step3Badge: 'Step 3 of 4',
        step3Title: '3. Fuel Hopper & Automation',
        vatGrossSuffix: 'incl. VAT',
        vatNetSuffix: 'excl. VAT',
        wifiTitle: 'Wi-Fi / Internet module for smartphone control (+145 € incl. VAT)',
        wifiDesc: 'Monitor boiler temperature, pellet level, and switch operating modes on your phone.',
        installTitle: 'Include turnkey installation & commissioning by Gilės Inžinerija',
        installDesc: 'Nationwide arrival, CNC flange installation, and flue gas analyzer combustion tuning.',
        step4Badge: 'Step 4 of 4 · Final BOM Specification',
        step4Title: '4. Configured Gilės Conversion Assembly',
        inStockNote: 'All parts in stock in Kaunas · Delivery in 1–3 business days',
        colCode: 'SKU Code',
        colPartSpec: 'Assembly Component / Specification',
        colPurpose: 'Function',
        colPrice: 'Price',
        mobilePurposePrefix: 'Function:',
        summaryBadge: 'Your Configured Assembly',
        summaryBoilerLabel: 'Boiler:',
        summaryAreaLabel: 'Area:',
        priceWithVatLabel: 'Bundle price incl. VAT (21%):',
        priceB2bNetLabel: 'B2B price excl. VAT:',
        annualSavingsLabel: 'Estimated annual fuel savings:',
        perSeasonSuffix: '€ / season',
        paybackDurationLabel: 'Payback period:',
        paybackSeasonsValue: '1.5–2 heating seasons',
        cadHeaderPrefix: 'CAD Blueprint',
        cadUnitSuffix: 'kW assembly · Scale 1:15',
        cadSvgAria: 'Boiler, CNC flange, pellet burner, and hopper assembly CAD blueprint',
        cadBoilerLabel: '[1] BOILER',
        cadChamberSuffix: 'kW chamber',
        cadAugerLabel: '[4] Auger 2.0 m',
        cadHopperLabel: '[5] HOPPER',
        cadHopperSub: '350 L · 5–7 d.',
        cadFooterText: 'Installed into boiler door in 4–6 hours',
        addAllToCartBtn: 'Add complete bundle to cart',
        addedAllToCartBtn: 'All bundle components added to cart',
        dariusFormHeading: 'Get Engineer Darius confirmation & installation quote',
        phonePlaceholder: 'Your phone number (+370 6...)',
        phoneAria: 'Your phone number',
        cityPlaceholder: 'City / district (e.g. Kaunas)',
        cityAria: 'City or district',
        quoteSubmittedBtn: 'Request received – Darius will contact you within 2 hours',
        quoteSubmitBtn: 'Request Engineer Darius confirmation',
        warrantyBadge: '24-month warranty & nationwide after-sales service',
        directConsultPrefix: 'Direct engineering line:',
        viewAllBurnersLink: 'Browse all pellet burners in catalog',
    },
    pl: {
        heroEyebrow: 'UAB „Gilės inžinerija“ · Kreator modernizacji kotła',
        heroTitle: 'Modernizacja kotła na pellet w 4 krokach',
        heroSubtitle:
            'Wybierz posiadany kocioł na paliwo stałe, powierzchnię i zasobnik pelletu – kreator automatycznie dobierze palnik, podajnik, sterownik i flanszę montażową.',
        engineerDariusLabel: 'Inżynier Darius:',
        addedBundleBtn: 'Zestaw dodany do koszyka',
        addFullBundleBtn: (p) => `Dodaj cały zestaw (${p})`,
        step1Badge: 'Krok 1 z 4',
        step1Title: '1. Twój obecny kocioł',
        flangeLabel: 'Flansza:',
        engineerNoteLabel: 'Uwaga inżyniera:',
        step2Badge: 'Krok 2 z 4',
        step2Title: '2. Ogrzewana powierzchnia i moc (60 m² – 1 500 m²)',
        recommendedLabel: 'Zalecana moc:',
        areaAriaLabel: 'Ogrzewana powierzchnia w metrach kwadratowych',
        step3Badge: 'Krok 3 z 4',
        step3Title: '3. Zasobnik paliwa i automatyka',
        vatGrossSuffix: 'z VAT',
        vatNetSuffix: 'netto',
        wifiTitle: 'Moduł Wi-Fi / internetowy do sterowania telefonem (+145 € z VAT)',
        wifiDesc: 'Kontroluj temperaturę, poziom pelletu i tryby pracy kotła w telefonie.',
        installTitle: 'Z montażem i uruchomieniem przez Gilės Inžinerija na obiekcie',
        installDesc: 'Dojazd, montaż flanszy CNC oraz regulacja spalania analizatorem spalin.',
        step4Badge: 'Krok 4 z 4 · Specyfikacja końcowa BOM',
        step4Title: '4. Skompletowany węzeł Gilės Inžinerija',
        inStockNote: 'Wszystkie części w magazynie w Kownie · Dostawa w 1–3 dni robocze',
        colCode: 'Kod SKU',
        colPartSpec: 'Element zestawu / Specyfikacja',
        colPurpose: 'Przeznaczenie',
        colPrice: 'Cena',
        mobilePurposePrefix: 'Przeznaczenie:',
        summaryBadge: 'Twój skonfigurowany zestaw',
        summaryBoilerLabel: 'Kocioł:',
        summaryAreaLabel: 'Powierzchnia:',
        priceWithVatLabel: 'Cena zestawu brutto (z 21% VAT):',
        priceB2bNetLabel: 'Cena dla firm netto (bez VAT):',
        annualSavingsLabel: 'Prognozowana oszczędność rocznie:',
        perSeasonSuffix: '€ / sezon',
        paybackDurationLabel: 'Okres zwrotu:',
        paybackSeasonsValue: '1,5–2 sezony grzewcze',
        cadHeaderPrefix: 'Rysunek CAD',
        cadUnitSuffix: 'kW zestaw · Skala 1:15',
        cadSvgAria: 'Rysunek CAD montażu kotła, flanszy CNC, palnika i zasobnika',
        cadBoilerLabel: '[1] KOCIOŁ',
        cadChamberSuffix: 'kW komora',
        cadAugerLabel: '[4] Podajnik 2,0 m',
        cadHopperLabel: '[5] ZASOBNIK',
        cadHopperSub: '350 L · 5–7 dni',
        cadFooterText: 'Montaż w drzwiczkach kotła w 4–6 godz.',
        addAllToCartBtn: 'Dodaj cały zestaw do koszyka',
        addedAllToCartBtn: 'Wszystkie elementy dodane do koszyka',
        dariusFormHeading: 'Uzyskaj potwierdzenie inżyniera Dariusa i wycenę montażu',
        phonePlaceholder: 'Twój numer telefonu (+48 / +370...)',
        phoneAria: 'Twój numer telefonu',
        cityPlaceholder: 'Miasto / powiat (np. Kowno, Suwałki)',
        cityAria: 'Miasto lub powiat',
        quoteSubmittedBtn: 'Zapytanie przyjęte – Darius skontaktuje się w 2 godz.',
        quoteSubmitBtn: 'Poproś o potwierdzenie inżyniera Dariusa',
        warrantyBadge: '24 mies. gwarancji oraz serwis gwarancyjny i pogwarancyjny',
        directConsultPrefix: 'Bezpośrednia konsultacja:',
        viewAllBurnersLink: 'Zobacz wszystkie palniki pelletowe w katalogu',
    },
    ru: {
        heroEyebrow: 'UAB „Gilės inžinerija“ · Мастер модернизации котла',
        heroTitle: 'Переоборудование котла на пеллеты за 4 шага',
        heroSubtitle:
            'Выберите ваш твердотопливный котел, отапливаемую площадь и бункер для пеллет – мастер автоматически подберет горелку, шнек, контроллер и монтажный фланец.',
        engineerDariusLabel: 'Инженер Дарюс:',
        addedBundleBtn: 'Комплект добавлен в корзину',
        addFullBundleBtn: (p) => `Добавить весь комплект (${p})`,
        step1Badge: 'Шаг 1 из 4',
        step1Title: '1. Ваш существующий котел',
        flangeLabel: 'Фланец:',
        engineerNoteLabel: 'Примечание инженера:',
        step2Badge: 'Шаг 2 из 4',
        step2Title: '2. Отапливаемая площадь и мощность (60 м² – 1 500 м²)',
        recommendedLabel: 'Рекомендуется:',
        areaAriaLabel: 'Отапливаемая площадь в квадратных метрах',
        step3Badge: 'Шаг 3 из 4',
        step3Title: '3. Топливный бункер и автоматика',
        vatGrossSuffix: 'с НДС',
        vatNetSuffix: 'без НДС',
        wifiTitle: 'Модуль Wi-Fi / интернета для управления со смартфона (+145 € с НДС)',
        wifiDesc: 'Контролируйте температуру, остаток гранул и меняйте режимы в телефоне.',
        installTitle: 'С монтажом и пусконаладкой Gilės Inžinerija на объекте',
        installDesc: 'Выезд по всей Литве, установка ЧПУ-фланца и настройка горения газоанализатором.',
        step4Badge: 'Шаг 4 из 4 · Итоговая спецификация',
        step4Title: '4. Скомплектованный узел Gilės Inžinerija',
        inStockNote: 'Все комплектующие на складе в Каунасе · Доставка за 1–3 раб. дня',
        colCode: 'Код SKU',
        colPartSpec: 'Часть узла / Спецификация',
        colPurpose: 'Назначение',
        colPrice: 'Цена',
        mobilePurposePrefix: 'Назначение:',
        summaryBadge: 'Ваш скомплектованный узел',
        summaryBoilerLabel: 'Котел:',
        summaryAreaLabel: 'Площадь:',
        priceWithVatLabel: 'Цена комплекта с НДС (21%):',
        priceB2bNetLabel: 'Цена для предприятий без НДС:',
        annualSavingsLabel: 'Прогнозируемая экономия в год:',
        perSeasonSuffix: '€ / сезон',
        paybackDurationLabel: 'Срок окупаемости:',
        paybackSeasonsValue: '1,5–2 отопительных сезона',
        cadHeaderPrefix: 'CAD чертеж',
        cadUnitSuffix: 'кВт узел · М 1:15',
        cadSvgAria: 'CAD чертеж сборки котла, ЧПУ-фланца, горелки и бункера',
        cadBoilerLabel: '[1] КОТЕЛ',
        cadChamberSuffix: 'кВт камера',
        cadAugerLabel: '[4] Шнек 2,0 м',
        cadHopperLabel: '[5] БУНКЕР',
        cadHopperSub: '350 л · 5–7 дн.',
        cadFooterText: 'Монтаж в дверцу котла за 4–6 ч.',
        addAllToCartBtn: 'Добавить весь комплект в корзину',
        addedAllToCartBtn: 'Все части комплекта добавлены в корзину',
        dariusFormHeading: 'Получить подтверждение инженера Дарюса и смету монтажа',
        phonePlaceholder: 'Ваш номер телефона (+370 6...)',
        phoneAria: 'Ваш номер телефона',
        cityPlaceholder: 'Город / район (напр. Каунас)',
        cityAria: 'Город или район',
        quoteSubmittedBtn: 'Заявка принята – Дарюс свяжется в течение 2 ч.',
        quoteSubmitBtn: 'Получить подтверждение инженера Дарюса',
        warrantyBadge: '24 мес. гарантия и послегарантийный сервис по всей Литве',
        directConsultPrefix: 'Прямая консультация:',
        viewAllBurnersLink: 'Посмотреть все пеллетные горелки в каталоге',
    },
};

function localizeBurnerTitle(burnerSku: string, locale: AppLocale, fallback: string): string {
    if (locale === 'lt') return fallback;
    const map: Record<string, Record<Exclude<AppLocale, 'lt'>, string>> = {
        'MPB-NANI-35': {
            en: 'Gilės / Megatherm MPB NANI 35 (5–35 kW) self-cleaning pellet burner',
            pl: 'Samoczyszczący palnik pelletowy Gilės / Megatherm MPB NANI 35 (5–35 kW)',
            ru: 'Самоочищающаяся пеллетная горелка Gilės / Megatherm MPB NANI 35 (5–35 кВт)',
        },
        'MPB-NANI-50': {
            en: 'Gilės / Megatherm MPB NANI 50 (10–50 kW) self-cleaning pellet burner',
            pl: 'Samoczyszczący palnik pelletowy Gilės / Megatherm MPB NANI 50 (10–50 kW)',
            ru: 'Самоочищающаяся пеллетная горелка Gilės / Megatherm MPB NANI 50 (10–50 кВт)',
        },
        'MPB-80-PRO': {
            en: 'Gilės / Megatherm MPB 80 PRO (20–80 kW) pellet burner with ceramic chamber',
            pl: 'Palnik pelletowy Gilės / Megatherm MPB 80 PRO (20–80 kW) z komorą ceramiczną',
            ru: 'Пеллетная горелка Gilės / Megatherm MPB 80 PRO (20–80 кВт) с керамикой',
        },
        'MPB-150-PRO': {
            en: 'Gilės / Megatherm MPB 150 PRO (35–150 kW) industrial pellet burner',
            pl: 'Przemysłowy palnik pelletowy Gilės / Megatherm MPB 150 PRO (35–150 kW)',
            ru: 'Промышленная пеллетная горелка Gilės / Megatherm MPB 150 PRO (35–150 кВт)',
        },
        'MPB-300-PRO': {
            en: 'Gilės / Megatherm MPB 300 PRO (60–300 kW) industrial pellet burner with moving grate',
            pl: 'Przemysłowy palnik pelletowy Gilės / Megatherm MPB 300 PRO (60–300 kW) z rusztem ruchomym',
            ru: 'Промышленная пеллетная горелка Gilės / Megatherm MPB 300 PRO (60–300 кВт) с подвижным колосником',
        },
    };
    return map[burnerSku]?.[locale] || fallback;
}

function localizeBomItem(
    item: { sku: string; title: string; category: string },
    boilerName: string,
    hopperTitle: string,
    locale: AppLocale,
): { title: string; category: string } {
    if (locale === 'lt') {
        return { title: item.title, category: item.category };
    }
    if (item.sku.startsWith('MPB-')) {
        return {
            title: localizeBurnerTitle(item.sku, locale, item.title),
            category:
                locale === 'en'
                    ? 'Pellet burner with moving grates'
                    : locale === 'pl'
                      ? 'Palnik pelletowy z rusztem ruchomym'
                      : 'Пеллетная горелка с подвижными колосниками',
        };
    }
    if (item.sku === 'GI-AUGER-2000') {
        return {
            title:
                locale === 'en'
                    ? '2.0 m axial pellet feed auger with flame-retardant PUR hose'
                    : locale === 'pl'
                      ? 'Podajnik ślimakowy 2,0 m z trudnopalnym wężem PUR'
                      : 'Осевой шнек подачи пеллет 2,0 м с негорючим PUR-шлангом',
            category:
                locale === 'en'
                    ? 'Fuel feed'
                    : locale === 'pl'
                      ? 'Podawanie paliwa'
                      : 'Подача топлива',
        };
    }
    if (item.sku === 'GI-CTRL-TOUCH') {
        return {
            title:
                locale === 'en'
                    ? 'Color touch controller with CH/DHW pump control and optical flame sensor'
                    : locale === 'pl'
                      ? 'Sterownik z kolorowym ekranem, obsługą pomp CO/CWU i fotokomórką'
                      : 'Контроллер с цветным экраном, управлением насосами СО/ГВС и фотодатчиком',
            category:
                locale === 'en'
                    ? 'Automation'
                    : locale === 'pl'
                      ? 'Automatyka'
                      : 'Автоматика',
        };
    }
    if (item.sku.startsWith('FL-')) {
        return {
            title:
                locale === 'en'
                    ? `CNC mounting flange and fireclay deflector for "${boilerName}"`
                    : locale === 'pl'
                      ? `Flansza montażowa CNC i deflektor szamotowy do kotła „${boilerName}”`
                      : `Монтажный ЧПУ-фланец и шамотный дефлектор для котла «${boilerName}»`,
            category:
                locale === 'en'
                    ? 'Mounting kit'
                    : locale === 'pl'
                      ? 'Zestaw montażowy'
                      : 'Монтажный узел',
        };
    }
    if (item.sku.startsWith('GI-BNK-')) {
        return {
            title: hopperTitle,
            category:
                locale === 'en'
                    ? 'Pellet hopper'
                    : locale === 'pl'
                      ? 'Zasobnik pelletu'
                      : 'Бункер для пеллет',
        };
    }
    if (item.sku === 'GI-SAFE-STB95') {
        return {
            title:
                locale === 'en'
                    ? 'Dual safety STB 95 °C thermostat and back-burn sensor'
                    : locale === 'pl'
                      ? 'Podwójny termostat bezpieczeństwa STB 95 °C i czujnik cofania płomienia'
                      : 'Двойной защитный термостат STB 95 °C и датчик обратного возгорания',
            category:
                locale === 'en'
                    ? 'Safety automation'
                    : locale === 'pl'
                      ? 'Automatyka bezpieczeństwa'
                      : 'Защитная автоматика',
        };
    }
    if (item.sku === 'GI-WIFI-NET') {
        return {
            title:
                locale === 'en'
                    ? 'Wi-Fi / Internet module for remote boiler control and smartphone alerts'
                    : locale === 'pl'
                      ? 'Moduł Wi-Fi / internetowy do zdalnego sterowania i powiadomień w telefonie'
                      : 'Модуль Wi-Fi / интернета для удаленного управления и уведомлений на телефон',
            category:
                locale === 'en'
                    ? 'Telemetry'
                    : locale === 'pl'
                      ? 'Telemetria'
                      : 'Телеметрия',
        };
    }
    if (item.sku === 'GI-SERV-INSTALL') {
        return {
            title:
                locale === 'en'
                    ? 'On-site installation by Gilės Inžinerija, chimney draft check, and flue gas analyzer tuning'
                    : locale === 'pl'
                      ? 'Montaż na obiekcie przez Gilės Inžinerija, pomiar ciągu kominowego i regulacja analizatorem spalin'
                      : 'Монтаж на объекте Gilės Inžinerija, проверка тяги дымохода и настройка газоанализатором',
            category:
                locale === 'en'
                    ? 'Engineering service'
                    : locale === 'pl'
                      ? 'Usługa inżynieryjna'
                      : 'Инженерные работы',
        };
    }
    return { title: item.title, category: item.category };
}

export default function BoilerConversionWizardPage() {
    const intlLocale = useLocale() || 'lt';
    const rawPathname = usePathname() || '';
    const urlMatch = rawPathname.match(/^\/(lt|en|pl|ru)(?=\/|$)/i);
    const locale = resolveAppLocale(urlMatch ? urlMatch[1] : intlLocale);
    const ui = WIZARD_UI_COPY[locale] || WIZARD_UI_COPY.lt;

    const showNet = useVatDisplayStore((s) => s.showNet);
    const addItem = useCartStore((s) => s.addItem);
    const openCart = useCartStore((s) => s.openCart);

    const [boilerModelId, setBoilerModelId] = useState<string>('viadrus-u22');
    const [areaM2, setAreaM2] = useState<number>(180);
    const [powerKw, setPowerKw] = useState<number>(25);
    const [hopperId, setHopperId] = useState<string>('standard-350');
    const [wifiModule, setWifiModule] = useState<boolean>(true);
    const [includeInstallation, setIncludeInstallation] = useState<boolean>(true);
    const [addedBundle, setAddedBundle] = useState<boolean>(false);
    const [quoteSent, setQuoteSent] = useState<boolean>(false);
    const [customerPhone, setCustomerPhone] = useState<string>('');
    const [customerCity, setCustomerCity] = useState<string>('Kaunas');

    const bundle = computeBoilerConversionBundle({
        boilerModelId,
        areaM2,
        powerKw,
        hopperId,
        wifiModule,
        includeInstallation,
    });

    const activeBoilerTranslation =
        BOILER_MODEL_TRANSLATIONS[bundle.boilerModel.id]?.[locale] || {
            name: bundle.boilerModel.name,
            typeLabel: bundle.boilerModel.typeLabel,
            compatibilityNote: bundle.boilerModel.compatibilityNote,
        };
    const activeHopperTranslation =
        HOPPER_TRANSLATIONS[bundle.hopper.id]?.[locale] || {
            title: bundle.hopper.title,
            autonomyDays: bundle.hopper.autonomyDays,
        };
    const localizedBurnerTitle = localizeBurnerTitle(
        bundle.burnerSku,
        locale,
        bundle.burnerTitle,
    );

    const formatEur = (gross: number, net: number) => {
        const val = showNet ? net : gross;
        return `${val.toFixed(2).replace('.', ',')} €`;
    };

    const handleAddFullBundleToCart = () => {
        for (const item of bundle.items) {
            const locItem = localizeBomItem(
                item,
                activeBoilerTranslation.name,
                activeHopperTranslation.title,
                locale,
            );
            addItem({
                id: `wizard-${item.sku}`,
                productId: `wizard-${item.sku}`,
                name: locItem.title,
                price: item.grossEur,
                sku: item.sku,
                quantity: 1,
                image: '/images/products/giles-studio-01-mpb-nani-35-50.webp',
            });
        }
        setAddedBundle(true);
        setTimeout(() => {
            setAddedBundle(false);
            openCart();
        }, 350);
    };

    return (
        <main
            data-testid="boiler-conversion-wizard"
            className="min-h-screen bg-[#F5F3EE] text-[#11161B]"
        >
            {/* Hero + 6 Studio Equipment Thumbnails Above the Fold */}
            <section className="border-b border-[#E2DDD3] bg-[#F5F3EE] py-5 sm:py-7">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                        <span className="font-bold text-[#C2410C]">
                            {ui.heroEyebrow}
                        </span>
                        <span className="text-[#5B6470]">
                            {ui.engineerDariusLabel}{' '}
                            <strong className="text-[#11161B]">{GILES_COMPANY_IDENTITY.phoneDarius}</strong> ·{' '}
                            {GILES_COMPANY_IDENTITY.address}
                        </span>
                    </div>

                    <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
                        <div className="space-y-1.5">
                            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#11161B] leading-tight">
                                {ui.heroTitle}
                            </h1>
                            <p className="text-xs sm:text-sm text-[#5B6470]">
                                {ui.heroSubtitle}
                            </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                            <button
                                type="button"
                                onClick={handleAddFullBundleToCart}
                                className="inline-flex items-center gap-2 rounded-sm bg-[#C2410C] hover:bg-[#9A3412] px-4 py-2.5 text-xs font-bold text-white whitespace-nowrap cursor-pointer transition-colors"
                            >
                                <ShoppingCart className="w-4 h-4 shrink-0" />
                                <span>
                                    {addedBundle
                                        ? ui.addedBundleBtn
                                        : ui.addFullBundleBtn(formatEur(bundle.totalGrossEur, bundle.totalNetEur))}
                                </span>
                            </button>
                        </div>
                    </div>

                    {/* 6 Studio Product Visuals Strip */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-1">
                        {STUDIO_SHOWCASE_BURNERS.map((img) => {
                            const labelText = img.label[locale] || img.label.lt;
                            return (
                                <div
                                    key={img.src}
                                    className="rounded-md border border-[#E2DDD3] bg-white p-2 flex items-center gap-2.5"
                                >
                                    <img
                                        src={assetUrl(img.src)}
                                        alt={labelText}
                                        className="h-12 w-12 rounded-xs bg-[#EEEBE4] object-contain mix-blend-multiply shrink-0 p-1"
                                    />
                                    <span className="text-xs font-semibold text-[#11161B] leading-snug">
                                        {labelText}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Main 4-Step Interactive Configurator + Right Dark Summary */}
            <section className="py-8 md:py-10">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* Left 8 Columns: Steps 1, 2, 3, 4 */}
                    <div className="lg:col-span-8 space-y-6">
                        {/* Step 1: Existing Boiler */}
                        <div className="rounded-lg border border-[#E2DDD3] bg-white p-5 space-y-4">
                            <div className="flex items-center justify-between gap-2">
                                <div>
                                    <span className="text-xs font-bold text-[#C2410C] block">
                                        {ui.step1Badge}
                                    </span>
                                    <h2 className="text-lg font-extrabold text-[#11161B]">
                                        {ui.step1Title}
                                    </h2>
                                </div>
                                <span className="text-xs font-mono text-[#5B6470]">
                                    {ui.flangeLabel} {bundle.boilerModel.flangeCode}
                                </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                                {BOILER_CONVERSION_MODELS.map((model) => {
                                    const active = model.id === boilerModelId;
                                    const tr = BOILER_MODEL_TRANSLATIONS[model.id]?.[locale] || {
                                        name: model.name,
                                        typeLabel: model.typeLabel,
                                        compatibilityNote: model.compatibilityNote,
                                    };
                                    return (
                                        <div
                                            key={model.id}
                                            className={`rounded-md border transition-colors ${
                                                active
                                                    ? 'border-[#C2410C] bg-[#FBEADF]'
                                                    : 'border-[#E2DDD3] bg-[#F5F3EE] hover:border-[#11161B]'
                                            }`}
                                        >
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setBoilerModelId(model.id);
                                                    if (model.id === 'industrial-100-500' && powerKw < 80) {
                                                        setPowerKw(150);
                                                        setAreaM2(1100);
                                                    }
                                                }}
                                                aria-pressed={active}
                                                className="w-full p-3.5 text-left bg-transparent cursor-pointer"
                                            >
                                                <span className="block text-xs font-bold text-[#11161B]">
                                                    {tr.name}
                                                </span>
                                                <span className="block text-xs text-[#5B6470] mt-1">
                                                    {tr.typeLabel}
                                                </span>
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>

                            <p className="text-xs text-[#5B6470] bg-[#F5F3EE] p-3 rounded-sm">
                                <strong className="text-[#11161B]">{ui.engineerNoteLabel}</strong>{' '}
                                <span>{activeBoilerTranslation.compatibilityNote}</span>{' '}
                                <span className="font-semibold text-[#11161B]">{bundle.boilerModel.flangeCode}</span>{' '}
                                <span>{localizedBurnerTitle}</span>
                            </p>
                        </div>

                        {/* Step 2: Heated Area & Power */}
                        <div className="rounded-lg border border-[#E2DDD3] bg-white p-5 space-y-4">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <div>
                                    <span className="text-xs font-bold text-[#C2410C] block">
                                        {ui.step2Badge}
                                    </span>
                                    <h2 className="text-lg font-extrabold text-[#11161B]">
                                        {ui.step2Title}
                                    </h2>
                                </div>
                                <span className="text-sm font-extrabold text-[#C2410C] tabular-nums">
                                    <span>{areaM2} m²</span> · <span>{ui.recommendedLabel}</span>{' '}
                                    <span>{bundle.powerKw} kW</span> (<span>{bundle.burnerPowerRange}</span> ·{' '}
                                    <span>{localizedBurnerTitle}</span>)
                                </span>
                            </div>

                            <div className="space-y-2">
                                <input
                                    type="range"
                                    min={60}
                                    max={1500}
                                    step={20}
                                    value={areaM2}
                                    onChange={(e) => {
                                        const nextArea = Number(e.target.value);
                                        setAreaM2(nextArea);
                                        setPowerKw(Math.max(15, Math.round(nextArea * 0.1)));
                                    }}
                                    aria-label={ui.areaAriaLabel}
                                    className="w-full accent-[#C2410C] cursor-pointer"
                                />
                                <div className="flex justify-between text-xs text-[#5B6470]">
                                    <span>60 m² (15 kW)</span>
                                    <span>250 m² (25–35 kW)</span>
                                    <span>600 m² (80 kW)</span>
                                    <span>1 500 m² (300 kW)</span>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-1.5">
                                {POWER_PRESETS.map((preset) => {
                                    const active = powerKw === preset.kw;
                                    return (
                                        <button
                                            key={preset.kw}
                                            type="button"
                                            onClick={() => {
                                                setPowerKw(preset.kw);
                                                setAreaM2(preset.area);
                                            }}
                                            className={`px-3 py-1 rounded-xs text-xs font-semibold whitespace-nowrap cursor-pointer border bg-transparent transition-colors ${
                                                active
                                                    ? 'border-[#C2410C] text-[#C2410C] font-bold'
                                                    : 'border-[#D5CFC3] text-[#11161B] hover:border-[#11161B]'
                                            }`}
                                        >
                                            {preset.label[locale] || preset.label.lt}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Step 3: Hopper & Automation */}
                        <div className="rounded-lg border border-[#E2DDD3] bg-white p-5 space-y-4">
                            <div>
                                <span className="text-xs font-bold text-[#C2410C] block">
                                    {ui.step3Badge}
                                </span>
                                <h2 className="text-lg font-extrabold text-[#11161B]">
                                    {ui.step3Title}
                                </h2>
                                <p className="text-xs font-semibold text-[#5B6470] mt-0.5 tabular-nums">
                                    <span>{activeHopperTranslation.title}</span> ·{' '}
                                    <span>{activeHopperTranslation.autonomyDays}</span>
                                </p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                {BOILER_HOPPER_OPTIONS.map((hop) => {
                                    const active = hop.id === hopperId;
                                    const hopNet = Math.round((hop.grossEur / 1.21) * 100) / 100;
                                    const hopTr = HOPPER_TRANSLATIONS[hop.id]?.[locale] || {
                                        title: hop.title,
                                        autonomyDays: hop.autonomyDays,
                                    };
                                    return (
                                        <div
                                            key={hop.id}
                                            className={`rounded-md border transition-colors ${
                                                active
                                                    ? 'border-[#C2410C] bg-[#FBEADF]'
                                                    : 'border-[#E2DDD3] bg-[#F5F3EE] hover:border-[#11161B]'
                                            }`}
                                        >
                                            <button
                                                type="button"
                                                onClick={() => setHopperId(hop.id)}
                                                aria-pressed={active}
                                                className="w-full p-3.5 text-left bg-transparent cursor-pointer flex flex-col justify-between h-full"
                                            >
                                                <div>
                                                    <span className="block text-xs font-bold text-[#11161B]">
                                                        {hopTr.title}
                                                    </span>
                                                    <span className="block text-xs text-[#5B6470] mt-1">
                                                        {hopTr.autonomyDays}
                                                    </span>
                                                </div>
                                                <span className="block text-sm font-extrabold text-[#C2410C] mt-2 tabular-nums">
                                                    +{formatEur(hop.grossEur, hopNet)}{' '}
                                                    {showNet ? ui.vatNetSuffix : ui.vatGrossSuffix}
                                                </span>
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                                <label className="flex items-start gap-2.5 p-3 rounded-md border border-[#E2DDD3] bg-[#F5F3EE] cursor-pointer text-xs">
                                    <input
                                        type="checkbox"
                                        checked={wifiModule}
                                        onChange={(e) => setWifiModule(e.target.checked)}
                                        className="mt-0.5 accent-[#C2410C]"
                                    />
                                    <span>
                                        <strong className="block text-[#11161B]">
                                            {ui.wifiTitle}
                                        </strong>
                                        <span className="text-[#5B6470]">
                                            {ui.wifiDesc}
                                        </span>
                                    </span>
                                </label>

                                <label className="flex items-start gap-2.5 p-3 rounded-md border border-[#E2DDD3] bg-[#FBEADF] cursor-pointer text-xs">
                                    <input
                                        type="checkbox"
                                        checked={includeInstallation}
                                        onChange={(e) => setIncludeInstallation(e.target.checked)}
                                        className="mt-0.5 accent-[#C2410C]"
                                    />
                                    <span>
                                        <strong className="block text-[#5A1F05]">
                                            {ui.installTitle}
                                        </strong>
                                        <span className="text-[#6E2A0A]">
                                            {ui.installDesc}
                                        </span>
                                    </span>
                                </label>
                            </div>
                        </div>

                        {/* Step 4: Automatically Assembled Bundle Table (Desktop Table + Mobile Stacked Cards) */}
                        <div className="rounded-lg border border-[#E2DDD3] bg-white p-5 space-y-4">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <div>
                                    <span className="text-xs font-bold text-[#C2410C] block">
                                        {ui.step4Badge}
                                    </span>
                                    <h2 className="text-lg font-extrabold text-[#11161B]">
                                        {ui.step4Title}
                                    </h2>
                                </div>
                                <span className="text-xs font-semibold text-[#157A3B]">
                                    {ui.inStockNote}
                                </span>
                            </div>

                            {/* Desktop Itemized Table */}
                            <div className="hidden md:block">
                                <table className="w-full text-left border-collapse text-xs">
                                    <thead>
                                        <tr className="border-b border-[#E2DDD3] bg-[#F5F3EE] text-[#5B6470]">
                                            <th className="py-2.5 px-3 font-semibold">{ui.colCode}</th>
                                            <th className="py-2.5 px-3 font-semibold">{ui.colPartSpec}</th>
                                            <th className="py-2.5 px-3 font-semibold">{ui.colPurpose}</th>
                                            <th className="py-2.5 px-3 font-semibold text-right">
                                                {ui.colPrice} ({showNet ? ui.vatNetSuffix : ui.vatGrossSuffix})
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {bundle.items.map((item, idx) => {
                                            const loc = localizeBomItem(
                                                item,
                                                activeBoilerTranslation.name,
                                                activeHopperTranslation.title,
                                                locale,
                                            );
                                            return (
                                                <tr key={idx}>
                                                    <td className="py-2.5 px-3 font-mono font-semibold text-[#11161B]">
                                                        {item.sku}
                                                    </td>
                                                    <td className="py-2.5 px-3 font-semibold text-[#11161B]">
                                                        {loc.title}
                                                    </td>
                                                    <td className="py-2.5 px-3 text-[#5B6470]">
                                                        {loc.category}
                                                    </td>
                                                    <td className="py-2.5 px-3 font-extrabold text-[#11161B] text-right tabular-nums whitespace-nowrap">
                                                        {formatEur(item.grossEur, item.netEur)}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile Stacked Cards (0 swipe tables) */}
                            <div className="md:hidden space-y-2.5">
                                {bundle.items.map((item, idx) => {
                                    const loc = localizeBomItem(
                                        item,
                                        activeBoilerTranslation.name,
                                        activeHopperTranslation.title,
                                        locale,
                                    );
                                    return (
                                        <div
                                            key={idx}
                                            className="rounded-sm border border-[#E2DDD3] bg-[#F5F3EE] p-3 space-y-1 text-xs"
                                        >
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="font-mono font-bold text-[#C2410C]">
                                                    {item.sku}
                                                </span>
                                                <span className="font-extrabold text-[#11161B] tabular-nums">
                                                    {formatEur(item.grossEur, item.netEur)}{' '}
                                                    {showNet ? ui.vatNetSuffix : ui.vatGrossSuffix}
                                                </span>
                                            </div>
                                            <div className="font-bold text-[#11161B]">
                                                {loc.title}
                                            </div>
                                            <div className="text-[#5B6470]">
                                                {ui.mobilePurposePrefix} {loc.category}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Right 4 Columns: Persistent Dark Summary & Darius Engineer Confirmation */}
                    <div className="lg:col-span-4 space-y-4">
                        <div className="rounded-lg bg-[#11161B] text-[#F5F3EE] p-5 space-y-4">
                            <div>
                                <span className="text-xs font-bold text-[#FF8A3D] block mb-1">
                                    {ui.summaryBadge}
                                </span>
                                <h2 className="text-lg font-extrabold text-white leading-snug">
                                    {localizedBurnerTitle}
                                </h2>
                                <p className="text-xs text-[#C9D0D8] mt-1">
                                    {ui.summaryBoilerLabel} <strong>{activeBoilerTranslation.name}</strong> ·{' '}
                                    {ui.summaryAreaLabel} <strong>{bundle.areaM2} m²</strong> ({bundle.powerKw} kW)
                                </p>
                            </div>

                            <div className="bg-[#1B232C] rounded-md p-4 space-y-2 text-xs">
                                <div className="flex items-center justify-between text-[#C9D0D8]">
                                    <span>{ui.priceWithVatLabel}</span>
                                    <span className="text-lg font-extrabold text-white tabular-nums">
                                        {bundle.totalGrossEur.toFixed(2).replace('.', ',')} €
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-[#C9D0D8]">
                                    <span>{ui.priceB2bNetLabel}</span>
                                    <span className="text-base font-bold text-[#FF8A3D] tabular-nums">
                                        {bundle.totalNetEur.toFixed(2).replace('.', ',')} €
                                    </span>
                                </div>
                                <div className="pt-2 border-t border-[#2C3742] flex items-center justify-between text-[#C9D0D8]">
                                    <span>{ui.annualSavingsLabel}</span>
                                    <span className="font-bold text-[#4ADE80] tabular-nums">
                                        ~{bundle.estimatedAnnualSavingsEur} {ui.perSeasonSuffix}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-[#C9D0D8]">
                                    <span>{ui.paybackDurationLabel}</span>
                                    <span className="font-semibold text-white">
                                        {ui.paybackSeasonsValue}
                                    </span>
                                </div>
                            </div>

                            {/* Interactive Boiler + Flange + Burner + Hopper Assembly CAD Blueprint */}
                            <GilesDoorConversionSchematic
                                locale={locale}
                                testId="boiler-conversion-cad-blueprint"
                                flangeCode={bundle.boilerModel.flangeCode}
                                powerKw={bundle.powerKw}
                                hopperLabel={`${bundle.hopper.volumeL} L`}
                            />

                            <button
                                type="button"
                                onClick={handleAddFullBundleToCart}
                                className="w-full inline-flex items-center justify-center gap-2 rounded-sm bg-[#C2410C] hover:bg-[#9A3412] px-4 py-3 text-xs font-bold text-white whitespace-nowrap cursor-pointer transition-colors"
                            >
                                <ShoppingCart className="w-4 h-4 shrink-0" />
                                <span>
                                    {addedBundle ? ui.addedAllToCartBtn : ui.addAllToCartBtn}
                                </span>
                            </button>

                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    setQuoteSent(true);
                                }}
                                className="pt-3 border-t border-[#2C3742] space-y-2.5"
                            >
                                <span className="block text-xs font-bold text-[#FF8A3D]">
                                    {ui.dariusFormHeading}
                                </span>
                                <input
                                    type="tel"
                                    value={customerPhone}
                                    onChange={(e) => setCustomerPhone(e.target.value)}
                                    placeholder={ui.phonePlaceholder}
                                    aria-label={ui.phoneAria}
                                    className="w-full rounded-xs bg-[#1B232C] border border-[#2C3742] px-3 py-2 text-xs text-white placeholder:text-[#A3ADB8]"
                                />
                                <input
                                    type="text"
                                    value={customerCity}
                                    onChange={(e) => setCustomerCity(e.target.value)}
                                    placeholder={ui.cityPlaceholder}
                                    aria-label={ui.cityAria}
                                    className="w-full rounded-xs bg-[#1B232C] border border-[#2C3742] px-3 py-2 text-xs text-white placeholder:text-[#A3ADB8]"
                                />
                                <button
                                    type="submit"
                                    className="w-full inline-flex items-center justify-center gap-1.5 rounded-xs border border-[#FF8A3D] bg-[#1B232C] hover:bg-[#FF8A3D] hover:text-[#11161B] px-3 py-2.5 text-xs font-bold text-white whitespace-nowrap cursor-pointer transition-colors"
                                >
                                    <Wrench className="w-3.5 h-3.5 shrink-0" />
                                    <span>
                                        {quoteSent ? ui.quoteSubmittedBtn : ui.quoteSubmitBtn}
                                    </span>
                                </button>
                            </form>

                            <div className="pt-2 border-t border-[#2C3742] space-y-1.5 text-xs text-[#C9D0D8]">
                                <div className="flex items-center gap-2">
                                    <ShieldCheck className="w-4 h-4 text-[#FF8A3D] shrink-0" />
                                    <span>{ui.warrantyBadge}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Phone className="w-4 h-4 text-[#FF8A3D] shrink-0" />
                                    <span>
                                        {ui.directConsultPrefix} {GILES_COMPANY_IDENTITY.phoneDarius}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Flame className="w-4 h-4 text-[#FF8A3D] shrink-0" />
                                    <Link href={`/${locale}/products?q=MPB`} className="underline hover:text-white">
                                        {ui.viewAllBurnersLink}
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
}
