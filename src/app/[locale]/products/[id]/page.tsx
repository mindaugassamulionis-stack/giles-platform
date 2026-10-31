import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import { getCatalogProduct, getRelatedProducts, storeIdOrThrow } from '../../../../lib/catalog';
import { formatLtDecimalCommas, stripLegacySkuTail } from '../../../../lib/product-text';
import {
    findCompatibleCatalogProducts,
    type ProductCompatibilityResult,
} from '@platform/database/services/product-compatibility-rag';
import { assetUrl } from '../../../../lib/api';
import { resolvePurchasability } from '../../../../lib/purchasable';
import { ProductPurchase } from '../../../../components/conversion/product-purchase';
import { PriceDisplay } from '../../../../components/price-display';
import { CopySkuButton } from '../../../../components/copy-sku-button';
import {
    LocalizedVytautasConsultButton,
    LocalizedCopySkuButton,
} from '../../../../components/product-card';
import {
    parseV3Description,
    getProductUxGuide,
    resolveProductBrandInfo,
    resolveProductImageUrl,
    formatCleanCatalogProductTitle,
    extractCardTechChips,
} from '../../../../lib/v3-description';
import { buildProductFaqAndComparison } from '../../../../lib/product-faq-and-comparison';
import { formatEur, formatEurAmount } from '../../../../lib/format';
import { escapeJsonLdForScript } from '../../../../lib/jsonld';
import {
    CheckCircle2,
    Wrench,
    FileText,
    ShieldCheck,
} from 'lucide-react';
import { STOREFRONT_STOCK_COPY, resolveAppLocale } from '../../../../i18n/storefront-ui-copy';
import type { AppLocale } from '../../../../i18n/routing';
import {
    localizeProductTitle,
    localizeCategoryLabel,
    localizeSpecKey,
    localizeSpecValue,
    localizeTechChip,
    localizeProductHook,
    localizeProductUxGuide,
    localizeProductFaqItems,
    localizeCompatibilityData,
    localizePairingReason,
} from '../../../../lib/product-i18n';
import { PdpCadExplodedSchematic } from '../../../../components/pdp-cad-exploded-schematic';
import { COMPATIBILITY_SOURCE_PROVENANCE_COPY } from '../../../../components/industrial-containers-hub';
import { readCatalogOverrides } from '../../../../lib/giles-catalog-snapshot';
import type { ProductUxStep, V3SpecRow } from '../../../../lib/v3-description';

export const dynamic = 'force-dynamic';

type PdpSubtypeCode =
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

interface PdpEngineeringProfileInput {
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

interface ResolvedPdpEngineeringProfile {
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

type Props = { params: Promise<{ locale: string; id: string }> };

const cleanDash = (s: string) =>
    s
        .replace(/\u2014/g, '–')
        .replace(/\p{Extended_Pictographic}/gu, '')
        .replace(/[\u00A9\u00AE\u2122]/g, '');

const PDP_COPY: Record<
    AppLocale,
    {
        notFoundTitle: string;
        breadcrumbAria: string;
        breadcrumbHome: string;
        view01: string;
        view02: string;
        view03: string;
        view04: string;
        datasheetTitle: (sku: string) => string;
        datasheetSubtitle: string;
        datasheetCta: string;
        manufacturerLabel: string;
        stripParamLabel: string;
        stripCategoryLabel: string;
        stripStandardLabel: string;
        retailPriceLabel: string;
        vatGrossSuffix: string;
        vatNetSuffix: string;
        soldOut: string;
        stockSourcePrefix: string;
        priceOnRequestRfq: string;
        b2bPriceHeading: string;
        b2bPriceSubtitle: string;
        b2bLoginCta: string;
        compatCheckBadge: string;
        compatCheckHeading: string;
        compatPrompt: (name: string, sku: string, brand: string) => string;
        compatSummary: (brand: string) => string;
        wizardCta: string;
        guaranteeStockBold: string;
        guaranteeStockRest: string;
        guaranteeSupplyPrefix: string;
        guaranteeSupplySuffix: string;
        guaranteeInstallText: string;
        explodedSectionAria: string;
        explodedBadge: (sku: string) => string;
        explodedHeading: string;
        nodeTypeLabel: string;
        whatYouGetHeading: string;
        includedBadge: string;
        cadHeader: (sku: string) => string;
        cadScaleNote: string;
        cadSvgAria: string;
        cad01Title: string;
        cad01Sub: string;
        cad02Title: string;
        cad02Sub: string;
        cad03Title: string;
        cad03Sub: string;
        cad04Title: string;
        cad04Sub: string;
        cad05BottomNote: string;
        whatYouNeedHeading: string;
        specsSectionAria: string;
        specsHeading: (sku: string) => string;
        selfCheckAria: string;
        selfCheckEyebrow: string;
        selfCheckHeading: string;
        proTipLabel: string;
        vytautasCompatAria: string;
        vytautasCompatEyebrow: string;
        vytautasCompatHeading: string;
        nodeRoleLabel: string;
        vytautasCommentTitle: (sku: string) => string;
        relationEssential: string;
        relationCompletion: string;
        relationAlternative: string;
        priceOnRequestShort: string;
        viewProductCta: string;
        faqSectionAria: string;
        faqHeading: (name: string, sku: string) => string;
        boughtTogetherHeading: string;
        fullCategoryCta: string;
        inStockShort: string;
    }
> = {
    lt: {
        notFoundTitle: 'Prekė nerasta',
        breadcrumbAria: 'Prekės kelias',
        breadcrumbHome: 'Pradžia',
        view01: '01 / Gaminys',
        view02: '02 / Mazgas',
        view03: '03 / Jungtis',
        view04: '04 / Schema',
        datasheetTitle: (sku) => `Techninis pasas ir 2D brėžinys (${sku})`,
        datasheetSubtitle: 'Matmenų ir prijungimo schema',
        datasheetCta: 'Atsisiųsti techninį pasą (PDF / Spausdinti)',
        manufacturerLabel: 'Gamintojas:',
        stripParamLabel: 'Parametras',
        stripCategoryLabel: 'Kategorija',
        stripStandardLabel: 'Standartas',
        retailPriceLabel: 'Mažmeninė kaina',
        vatGrossSuffix: 'su PVM',
        vatNetSuffix: '€ be PVM',
        soldOut: 'Išparduota',
        stockSourcePrefix: 'Šaltinis:',
        priceOnRequestRfq: 'Kaina pagal užklausą – Užklausa',
        b2bPriceHeading: 'Montuotojo B2B didmeninė kaina',
        b2bPriceSubtitle: 'Didmeninės nuolaidos patvirtintiems ŠVOK montuotojams ir rangovams',
        b2bLoginCta: 'Prisijungti / Registruotis B2B',
        compatCheckBadge: 'Suderinamumo patikra · Tinka katilams ir sistemoms',
        compatCheckHeading: 'Ar tiks mano katilui ar šildymo mazgui?',
        compatPrompt: (name, sku, brand) =>
            `Domina prekė ${name} (SKU: ${sku}, gamintojas: ${brand}). Patikrink, su kokiais katilais ir jungtimis ji suderinama bei kokiuose mazguose naudojama.`,
        compatSummary: (brand) => `Gamintojas: ${brand}`,
        wizardCta: 'Katilo perdarymo vedlys',
        guaranteeStockBold: 'Yra sandėlyje',
        guaranteeStockRest:
            ' · pristatymas visoje Lietuvoje per 1–3 d. d. arba atsiėmimas Žirmūnų g. 68, Vilniuje / Kaune',
        guaranteeSupplyPrefix: 'Oficiali ',
        guaranteeSupplySuffix: ' tiekimo grandinė · 24 mėn. garantija ir serviso priežiūra',
        guaranteeInstallText:
            'Galimas pilnas montavimas ir paleidimas objekte (Darius Šauklys: +370 611 19158)',
        explodedSectionAria: 'Komplektacijos sudėtis ir mazgo schema',
        explodedBadge: (sku) => `Mazgo sudėtis ir montavimo schema · ${sku}`,
        explodedHeading: 'Kas komplekte ir ko prireiks pilnam sumontavimui',
        nodeTypeLabel: 'Mazgo tipas:',
        whatYouGetHeading: '01 / Kas įeina į komplektą (ką gaunate)',
        includedBadge: 'Komplekte',
        cadHeader: (sku) => `Mazgo ir atsarginių dalių sprogdintas brėžinys (Exploded CAD) · ${sku}`,
        cadScaleNote: 'M 1:5 · Atsarginės dalys sandėlyje',
        cadSvgAria: 'Mazgo detalių sprogdintas techninis CAD brėžinys',
        cad01Title: '[01] KORPUSAS',
        cad01Sub: 'P265GH / CW617N',
        cad02Title: '[02] FLANŠAS',
        cad02Sub: 'CNC tvirtinimas',
        cad03Title: '[03] MAZGAS',
        cad03Sub: 'Karščiui atsparus',
        cad04Title: '[04] VALDYMAS',
        cad04Sub: 'Jutiklis / Tenas',
        cad05BottomNote:
            '[05] Visos [01–04] mazgo dalys ir tarpinės tiekiamos iš Kauno sandėlio (10+ m. palaikymas)',
        whatYouNeedHeading: '02 / Ko prireiks montavimui ir 4 montavimo žingsniai',
        specsSectionAria: 'Techninė specifikacija',
        specsHeading: (sku) => `Techniniai duomenys (${sku})`,
        selfCheckAria: '3 sek. tinkamumo patikra',
        selfCheckEyebrow: 'Inžinieriaus atmintinė prieš montuojant',
        selfCheckHeading: 'Patikrinkite prieš dedant į krepšelį',
        proTipLabel: 'Meistro patarimas:',
        vytautasCompatAria: 'Vytautas rekomenduoja: su kuo dera ši prekė',
        vytautasCompatEyebrow: 'Inžinerinis mazgo komplektavimas · Vytautas',
        vytautasCompatHeading:
            'Vytautas rekomenduoja: su kuo dera ši prekė ir ko reikia pilnam sumontavimui',
        nodeRoleLabel: 'Mazgo rolė:',
        vytautasCommentTitle: (sku) => `Vytauto mazgo komplektavimo komentaras (${sku})`,
        relationEssential: 'Būtina pora',
        relationCompletion: 'Mazgo dalis',
        relationAlternative: 'Alternatyva',
        priceOnRequestShort: 'Pagal užklausą',
        viewProductCta: 'Peržiūrėti',
        faqSectionAria: 'Dažniausiai užduodami pirkėjų klausimai (DUK)',
        faqHeading: (name, sku) => `Atsakymai į praktinius klausimus apie ${name} (${sku})`,
        boughtTogetherHeading: 'Dažniausiai perkama kartu',
        fullCategoryCta: 'Visa kategorija',
        inStockShort: 'Sandėlyje',
    },
    en: {
        notFoundTitle: 'Product not found',
        breadcrumbAria: 'Breadcrumb',
        breadcrumbHome: 'Home',
        view01: '01 / Unit',
        view02: '02 / Assembly',
        view03: '03 / Connection',
        view04: '04 / Diagram',
        datasheetTitle: (sku) => `Technical Datasheet & 2D Drawing (${sku})`,
        datasheetSubtitle: 'Dimensional & hydraulic connection schematic',
        datasheetCta: 'Download Technical Datasheet (PDF / Print)',
        manufacturerLabel: 'Manufacturer:',
        stripParamLabel: 'Parameter',
        stripCategoryLabel: 'Category',
        stripStandardLabel: 'Standard',
        retailPriceLabel: 'Retail price',
        vatGrossSuffix: 'incl. VAT',
        vatNetSuffix: '€ excl. VAT',
        soldOut: 'Out of stock',
        stockSourcePrefix: 'Source:',
        priceOnRequestRfq: 'Price on request – Send RFQ',
        b2bPriceHeading: 'Installer B2B wholesale price',
        b2bPriceSubtitle: 'Wholesale discounts for verified HVAC installers and contractors',
        b2bLoginCta: 'Sign in / Register B2B',
        compatCheckBadge: 'Compatibility check · Fits boilers & heating systems',
        compatCheckHeading: 'Will this fit my boiler or hydronic node?',
        compatPrompt: (name, sku, brand) =>
            `I am looking at ${name} (SKU: ${sku}, brand: ${brand}). Check which boilers and connections it fits.`,
        compatSummary: (brand) => `Manufacturer: ${brand}`,
        wizardCta: 'Boiler Conversion Wizard',
        guaranteeStockBold: 'In stock',
        guaranteeStockRest:
            ' · delivery across Lithuania in 1–3 bus. days or pickup at Žirmūnų St. 68, Vilnius / Kaunas',
        guaranteeSupplyPrefix: 'Official ',
        guaranteeSupplySuffix: ' supply chain · 24-month warranty & after-sales service',
        guaranteeInstallText:
            'Full on-site installation & commissioning available (Darius Šauklys: +370 611 19158)',
        explodedSectionAria: 'Package contents & assembly diagram',
        explodedBadge: (sku) => `Package contents & mounting schematic · ${sku}`,
        explodedHeading: 'What is in the box & required installation fittings',
        nodeTypeLabel: 'Assembly type:',
        whatYouGetHeading: '01 / What is included in the box',
        includedBadge: 'Included',
        cadHeader: (sku) => `Exploded Spare-Parts & Assembly CAD Drawing · ${sku}`,
        cadScaleNote: 'Scale 1:5 · Spare parts in stock',
        cadSvgAria: 'Exploded technical CAD schematic of the assembly',
        cad01Title: '[01] HOUSING',
        cad01Sub: 'P265GH / CW617N',
        cad02Title: '[02] FLANGE',
        cad02Sub: 'CNC mounting',
        cad03Title: '[03] CORE UNIT',
        cad03Sub: 'Heat-resistant',
        cad04Title: '[04] CONTROL',
        cad04Sub: 'Sensor / Igniter',
        cad05BottomNote:
            '[05] All [01–04] spare parts & gaskets supplied from Kaunas warehouse (10+ yr support)',
        whatYouNeedHeading: '02 / Required tools & 4-step mounting sequence',
        specsSectionAria: 'Technical specifications',
        specsHeading: (sku) => `Technical specifications (${sku})`,
        selfCheckAria: '3-second pre-installation check',
        selfCheckEyebrow: 'Engineer checklist before installation',
        selfCheckHeading: 'Verify before adding to cart',
        proTipLabel: 'Engineer pro tip:',
        vytautasCompatAria: 'Vytautas recommends: compatible mating components',
        vytautasCompatEyebrow: 'Engineering node configuration · Vytautas',
        vytautasCompatHeading:
            'Vytautas recommends: compatible components for complete installation',
        nodeRoleLabel: 'Node role:',
        vytautasCommentTitle: (sku) => `Vytautas engineering compatibility note (${sku})`,
        relationEssential: 'Essential pair',
        relationCompletion: 'System part',
        relationAlternative: 'Alternative',
        priceOnRequestShort: 'On request',
        viewProductCta: 'View item',
        faqSectionAria: 'Frequently asked questions (FAQ)',
        faqHeading: (name, sku) => `Practical engineering answers for ${name} (${sku})`,
        boughtTogetherHeading: 'Frequently bought together',
        fullCategoryCta: 'Full category',
        inStockShort: 'In stock',
    },
    pl: {
        notFoundTitle: 'Nie znaleziono produktu',
        breadcrumbAria: 'Ścieżka produktu',
        breadcrumbHome: 'Start',
        view01: '01 / Produkt',
        view02: '02 / Węzeł',
        view03: '03 / Przyłącze',
        view04: '04 / Schemat',
        datasheetTitle: (sku) => `Karta katalogowa i rysunek 2D (${sku})`,
        datasheetSubtitle: 'Schemat wymiarowy i przyłączeniowy',
        datasheetCta: 'Pobierz kartę techniczną (PDF / Drukuj)',
        manufacturerLabel: 'Producent:',
        stripParamLabel: 'Parametr',
        stripCategoryLabel: 'Kategoria',
        stripStandardLabel: 'Standard',
        retailPriceLabel: 'Cena detaliczna',
        vatGrossSuffix: 'z VAT',
        vatNetSuffix: '€ bez VAT',
        soldOut: 'Wyprzedane',
        stockSourcePrefix: 'Źródło:',
        priceOnRequestRfq: 'Cena na zapytanie – Zapytaj',
        b2bPriceHeading: 'Cena hurtowa B2B dla instalatorów',
        b2bPriceSubtitle: 'Rabaty hurtowe dla zweryfikowanych instalatorów i wykonawców HVAC',
        b2bLoginCta: 'Zaloguj / Zarejestruj B2B',
        compatCheckBadge: 'Test kompatybilności · Pasuje do kotłów i instalacji',
        compatCheckHeading: 'Czy będzie pasować do mojego kotła lub węzła grzewczego?',
        compatPrompt: (name, sku, brand) =>
            `Interesuje mnie produkt ${name} (SKU: ${sku}, producent: ${brand}). Sprawdź kompatybilność z kotłami i przyłączami.`,
        compatSummary: (brand) => `Producent: ${brand}`,
        wizardCta: 'Kreator modernizacji kotła',
        guaranteeStockBold: 'W magazynie',
        guaranteeStockRest:
            ' · dostawa w ciągu 1–3 dni rob. lub odbiór osobisty (Wilno, ul. Žirmūnų 68 / Kowno)',
        guaranteeSupplyPrefix: 'Oficjalna dystrybucja ',
        guaranteeSupplySuffix: ' · 24 mies. gwarancji i wsparcie serwisowe',
        guaranteeInstallText:
            'Możliwy pełny montaż i uruchomienie na obiekcie (Darius Šauklys: +370 611 19158)',
        explodedSectionAria: 'Zawartość zestawu i schemat węzła',
        explodedBadge: (sku) => `Skład zestawu i schemat montażowy · ${sku}`,
        explodedHeading: 'Co znajduje się w zestawie i czego potrzeba do montażu',
        nodeTypeLabel: 'Typ węzła:',
        whatYouGetHeading: '01 / Co wchodzi w skład zestawu',
        includedBadge: 'W zestawie',
        cadHeader: (sku) => `Rysunek złożeniowy części zamiennych (Exploded CAD) · ${sku}`,
        cadScaleNote: 'Skala 1:5 · Części zamienne w magazynie',
        cadSvgAria: 'Techniczny rysunek złożeniowy CAD węzła',
        cad01Title: '[01] KORPUS',
        cad01Sub: 'P265GH / CW617N',
        cad02Title: '[02] KOŁNIERZ',
        cad02Sub: 'Mocowanie CNC',
        cad03Title: '[03] MODUŁ',
        cad03Sub: 'Żaroodporny',
        cad04Title: '[04] STEROWANIE',
        cad04Sub: 'Czujnik / Grzałka',
        cad05BottomNote:
            '[05] Wszystkie części [01–04] i uszczelki dostępne z magazynu w Kownie (10+ lat wsparcia)',
        whatYouNeedHeading: '02 / Co będzie potrzebne do montażu i 4 kroki instalacji',
        specsSectionAria: 'Specyfikacja techniczna',
        specsHeading: (sku) => `Dane techniczne (${sku})`,
        selfCheckAria: '3-sekundowa kontrola dopasowania',
        selfCheckEyebrow: 'Lista kontrolna inżyniera przed montażem',
        selfCheckHeading: 'Sprawdź przed dodaniem do koszyka',
        proTipLabel: 'Wskazówka instalatora:',
        vytautasCompatAria: 'Vytautas poleca: kompatybilne elementy',
        vytautasCompatEyebrow: 'Kompletacja inżynieryjna węzła · Vytautas',
        vytautasCompatHeading:
            'Vytautas poleca: z czym współpracuje ten produkt do pełnego montażu',
        nodeRoleLabel: 'Rola w układzie:',
        vytautasCommentTitle: (sku) => `Komentarz inżynieryjny Vytautasa (${sku})`,
        relationEssential: 'Wymagana para',
        relationCompletion: 'Część układu',
        relationAlternative: 'Alternatywa',
        priceOnRequestShort: 'Na zapytanie',
        viewProductCta: 'Zobacz',
        faqSectionAria: 'Najczęściej zadawane pytania (FAQ)',
        faqHeading: (name, sku) => `Praktyczne pytania i odpowiedzi o ${name} (${sku})`,
        boughtTogetherHeading: 'Często kupowane razem',
        fullCategoryCta: 'Cała kategoria',
        inStockShort: 'W magazynie',
    },
    ru: {
        notFoundTitle: 'Товар не найден',
        breadcrumbAria: 'Навигационная цепочка',
        breadcrumbHome: 'Главная',
        view01: '01 / Изделие',
        view02: '02 / Узел',
        view03: '03 / Присоединение',
        view04: '04 / Схема',
        datasheetTitle: (sku) => `Технический паспорт и 2D чертеж (${sku})`,
        datasheetSubtitle: 'Габаритная и монтажная схема подключения',
        datasheetCta: 'Скачать техпаспорт (PDF / Печать)',
        manufacturerLabel: 'Производитель:',
        stripParamLabel: 'Параметр',
        stripCategoryLabel: 'Категория',
        stripStandardLabel: 'Стандарт',
        retailPriceLabel: 'Розничная цена',
        vatGrossSuffix: 'с НДС',
        vatNetSuffix: '€ без НДС',
        soldOut: 'Распродано',
        stockSourcePrefix: 'Источник:',
        priceOnRequestRfq: 'Цена по запросу – Запрос',
        b2bPriceHeading: 'Оптовая B2B цена для монтажников',
        b2bPriceSubtitle: 'Оптовые скидки для подтвержденных монтажников и подрядчиков ОВиК',
        b2bLoginCta: 'Войти / Регистрация B2B',
        compatCheckBadge: 'Проверка совместимости · Подходит для котлов и систем',
        compatCheckHeading: 'Подойдет ли к моему котлу или отопительному узлу?',
        compatPrompt: (name, sku, brand) =>
            `Интересует товар ${name} (SKU: ${sku}, бренд: ${brand}). Проверь совместимость с котлами и фитингами.`,
        compatSummary: (brand) => `Производитель: ${brand}`,
        wizardCta: 'Мастер модернизации котла',
        guaranteeStockBold: 'В наличии на складе',
        guaranteeStockRest:
            ' · доставка за 1–3 раб. дн. или самовывоз (Вильнюс, ул. Жирмуну 68 / Каунас)',
        guaranteeSupplyPrefix: 'Официальная поставка ',
        guaranteeSupplySuffix: ' · гарантия 24 мес. и сервисное обслуживание',
        guaranteeInstallText:
            'Возможен полный монтаж и пусконаладка на объекте (Дарюс Шауклис: +370 611 19158)',
        explodedSectionAria: 'Состав комплекта и схема узла',
        explodedBadge: (sku) => `Состав узла и монтажная схема · ${sku}`,
        explodedHeading: 'Что входит в комплект и что потребуется для монтажа',
        nodeTypeLabel: 'Тип узла:',
        whatYouGetHeading: '01 / Что входит в комплект поставки',
        includedBadge: 'В комплекте',
        cadHeader: (sku) => `Взрыв-схема узла и запчастей (Exploded CAD) · ${sku}`,
        cadScaleNote: 'М 1:5 · Запчасти на складе',
        cadSvgAria: 'Техническая взрыв-схема CAD узла',
        cad01Title: '[01] КОРПУС',
        cad01Sub: 'P265GH / CW617N',
        cad02Title: '[02] ФЛАНЕЦ',
        cad02Sub: 'Крепление ЧПУ',
        cad03Title: '[03] УЗЕЛ',
        cad03Sub: 'Жаропрочный',
        cad04Title: '[04] УПРАВЛЕНИЕ',
        cad04Sub: 'Датчик / ТЭН',
        cad05BottomNote:
            '[05] Все детали [01–04] и прокладки поставляются со склада в Каунасе (10+ лет поддержки)',
        whatYouNeedHeading: '02 / Что потребуется для монтажа и 4 шага установки',
        specsSectionAria: 'Техническая спецификация',
        specsHeading: (sku) => `Технические данные (${sku})`,
        selfCheckAria: '3-секундная проверка совместимости',
        selfCheckEyebrow: 'Памятка инженера перед монтажом',
        selfCheckHeading: 'Проверьте перед добавлением в корзину',
        proTipLabel: 'Совет мастера:',
        vytautasCompatAria: 'Витаутас рекомендует: совместимые узлы',
        vytautasCompatEyebrow: 'Инженерная комплектация узла · Vytautas',
        vytautasCompatHeading:
            'Витаутас рекомендует: с чем сочетается товар для полного монтажа',
        nodeRoleLabel: 'Роль узла:',
        vytautasCommentTitle: (sku) => `Инженерный комментарий по комплектации (${sku})`,
        relationEssential: 'Обязательная пара',
        relationCompletion: 'Часть узла',
        relationAlternative: 'Альтернатива',
        priceOnRequestShort: 'По запросу',
        viewProductCta: 'Открыть',
        faqSectionAria: 'Часто задаваемые вопросы (FAQ)',
        faqHeading: (name, sku) => `Ответы на практические вопросы о ${name} (${sku})`,
        boughtTogetherHeading: 'С этим товаром покупают',
        fullCategoryCta: 'Вся категория',
        inStockShort: 'В наличии',
    },
};

function parseStringListOverride(raw: unknown): string[] | null {
    if (Array.isArray(raw)) {
        const cleaned = raw
            .map((item) => (typeof item === 'string' ? cleanDash(item.trim()) : ''))
            .filter(Boolean);
        return cleaned.length > 0 ? cleaned : null;
    }
    if (typeof raw === 'string' && raw.trim().length > 0) {
        const cleaned = raw
            .split(/[\r\n;|]+/)
            .map((item) => cleanDash(item.trim()))
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
                    if (param && value) return { param: cleanDash(param), value: cleanDash(value) };
                }
                return null;
            })
            .filter((r): r is V3SpecRow => r !== null);
        return rows.length > 0 ? rows : null;
    }
    if (raw && typeof raw === 'object') {
        const rows = Object.entries(raw as Record<string, unknown>)
            .map(([k, v]) => ({
                param: cleanDash(k.trim()),
                value: cleanDash(String(v ?? '').trim()),
            }))
            .filter((r) => r.param && r.value);
        return rows.length > 0 ? rows : null;
    }
    return null;
}

function resolvePdpEngineeringProfile(
    input: PdpEngineeringProfileInput,
    locale: AppLocale = 'lt',
): ResolvedPdpEngineeringProfile {
    const loc = resolveAppLocale(locale);
    const normSku = (input.sku || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const overridesStore = readCatalogOverrides();
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
        brand: input.brand || (rawOverrideObj.brandName as string) || (rawOverrideObj.brand as string),
        title: input.name,
        sku: input.sku,
        description: input.description,
    });
    const brand = brandInfo.name;
    const cleanTitleLt = cleanDash(formatCleanCatalogProductTitle(input.name, input.sku, brand));
    const text = `${cleanTitleLt} ${input.name || ''} ${input.sku || ''} ${brand} ${input.category || ''}`;
    const textLower = text.toLowerCase();

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
    let steps = [...baseRawGuide.steps];
    let selfCheck = [...baseRawGuide.selfCheck];
    let proTip = baseRawGuide.proTip;
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

    // 1A: Elektroterminės ir motorinės pavaros (ALWAYS check BEFORE AB-QM / balancing valves!)
    const isActuator =
        /\bpavar|\babn[-\s]?a5\b|\btwa\b|\bemo\s*t\b|\bemo\b|ta-slider|\bame\s*\d|\bnovocon\b|\bactuator\b|^082f|^088h|^1807-/i.test(
            textLower,
        );
    // 1B: Automatiniai slėgio nepriklausomi balansiniai vožtuvai PICV
    const isPicvValve =
        !isActuator &&
        /\bab-qm\b|\btbv-cmp\b|\bta-modulator\b|\bta-compact\b|\bpicv\b/i.test(textLower);
    // 1C: Rankiniai hidrauliniai balansiniai vožtuvai
    const isManualBalancingValve =
        !isActuator &&
        !isPicvValve &&
        /\bstad\b|\bstaf\b|\btbv-c\b|\btbv\b|\bstrv\b|\busv-i\b|\bmsv-bd\b|\bmsv-f2\b|\bmsv\b|\bballorex\b|\bleno\b|\basv\b|balansinis\s+vožtuvas/i.test(
            textLower,
        );
    // 1E: Termostatinės galvutės ir kambario termostatai
    const isThermostaticHeadOrRoomStat =
        !isActuator &&
        (/termogalvut|termostatinė\s+galv|termostatinis\s+elementas|\bredia\b|\baero\b|\breact\b|galvutė\s+k\b|heimeier\s+k\b|\bhalo\b|\bdx\b|\bicon\b|kambario\s+termostat|patalpos\s+termostat|\bdevireg\b|^013g29|^013g5|^6000-00/i.test(
            textLower,
        ) &&
            !/vožtuvas|ventilio\s+korpus|binokl|vekolux|multilux/i.test(textLower));
    // 1D: Termostatiniai radiatorių vožtuvai ir apatinio pajungimo mazgai
    const isThermostaticRadiatorValve =
        !isActuator &&
        !isPicvValve &&
        !isManualBalancingValve &&
        !isThermostaticHeadOrRoomStat &&
        /\bra-n\b|\bra-dv\b|\bra-fn\b|\beclipse\b|\bv-exact\b|\bcalypso\b|\bvekolux\b|\bmultilux\b|\bregulux\b|\braditec\b|\brlv-k\b|\brlv-ks\b|\brlv-s\b|\bvhx\b|herz-ts|\bts-90\b|apatinio\s+pajungimo\s+mazg|h-blok|binokl|^013g0|^3933-|^0382-|^17761/i.test(
            textLower,
        ) &&
        !/kolektor|dynacon/i.test(textLower);

    // 2A / 2B / 2C: Plėtimosi indai, oro nuorintojai / purvo separatoriai, slėgio palaikymo stotys
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

    // 6A / 6B / 6C: Radiatoriai ir konvektoriai
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

    // 5A / 5B: Akumuliacinės talpos vs karšto vandens boileriai
    const isBufferTank =
        /\bzv\s*\d|\bzv\b|akumuliacinė\s+talpa|akumuliacine\s+talpa|buferinė\s+talpa|buferine\s+talpa|\bcas\s*\d|\bnad\s*\d/i.test(
            textLower,
        ) && !/katilas\s+gilės\s+zv/i.test(textLower);
    const isDhwBoiler =
        !isBufferTank &&
        (/\bboileris\b|vandens\s+šildytuvas|vandens\s+sildytuvas|\bokc\b|\bokce\b|\bokhe\b|\bdražice\b|\bdrazice\b|\bgbk\b|\btgr\b|\bvlgm\b|\bhp(80|110|150|200|250|300)\b|\bes(10|15|30|50|80|100)v\b/i.test(
            textLower,
        ));

    // 4A / 4B / 4C: Šilumos siurbliai, kondicionieriai ir elektriniai katilai
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
        (/super\s+aqua|\bmonoblok|hydro\s+split|all-in-one|\baw0|\baw1|\bhu102|\bhu082|\bfycra\b|\bvitocal\b|oras[-–]vanduo|šilumos\s+siurblys|silumos\s+siurblys|\bmrv\b/i.test(
            textLower,
        ));

    // 3A / 3B / 3C / 3D: Granulių degikliai, katilai, šnekai/bunkeriai ir atsarginės dalys
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
        (/granulių\s+degikl|granulinis\s+degikl|degiklio\s+komplekt|\bmpb\b|degkmpl|pelet-set|\bpv\s*20|\bpv\s*30|\bsun\s*p7|\bsun\s*p12|\ba251\b|\ba501\b|\bdegiklis\b/i.test(
            textLower,
        ));
    const isSolidOrPelletBoiler =
        !isBurnerOrBoilerSpare &&
        !isPelletHopperOrAuger &&
        !isPelletBurner &&
        !isElectricBoiler &&
        !isAirToWaterHeatPump &&
        /\bkatilas\b|\bpeltec\b|\beko-ck\b|\bcentroplus\b|\bbiopel\b|\bponast\b|\bverner\s+v|\bdefro\b|\bkalvis\b|\bviadrus\b|\batmos\b/i.test(
            textLower,
        );

    const titleSkuLower = `${cleanTitleLt} ${input.name || ''} ${input.sku || ''}`.toLowerCase();
    // 7A / 7B / 7C: Grindinio šildymo kolektoriai, daugiasluoksniai vamzdžiai, presuojamos/srieginės jungtys
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
        (/presuojam|eurokonus|fiting|alkūn|alkun|trišak|trisak|\bmova\b|\bnipel|\badapter|\bjungt|\bcomisa\b|\bsanha\b|\bfv-plast\b|\bwavin\b/i.test(
            textLower,
        ));

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
        compatibleSystemChips = hasVa41OrAbQm
            ? [
                  'Danfoss AB-QM DN10–32 (PICV)',
                  'VA41 adapteris komplekte',
                  `${voltLabel} ${ncNoMatch?.[1] || 'NC'} valdymas`,
                  'ŠVOK zoninė automatika',
              ]
            : hasRaClick
              ? [
                    'Danfoss RA-N / FHV vožtuvai',
                    'Danfoss RA-Click (23 mm)',
                    'Grindinio ir radiatorių automatika',
                ]
              : [
                    'M30×1,5 kolektoriai (Dynacon / Comisa)',
                    'IMI Heimeier / TA vožtuvai',
                    'Grindinio šildymo automatika',
                ];
        generatedSpecs.push(
            { param: 'Tipas', value: subtypeTitle },
            { param: 'Maitinimas', value: `${voltLabel}, ${ncNoLabel}` },
            {
                param: 'Sriegis',
                value: hasVa41OrAbQm
                    ? 'VA41 adapteris (Danfoss AB-QM DN10–32)'
                    : hasRaClick
                      ? 'Danfoss RA-Click (23 mm)'
                      : 'M30×1,5',
            },
        );
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
        whatYouNeed = [
            isDanfossPicv
                ? 'Suderinama Danfoss pavara: ABN-A5 (su VA41 adapteriu, 082F1152), AME arba skaitmeninė NovoCon pavara'
                : 'Suderinama IMI TA pavara: TA-Slider, TA-Modulator arba EMO T (M30×1,5)',
            'Srieginės pusmovės arba jungtys pagal vamzdyno DN skersmenį',
            'Tinklinis filtras ir Zeparo purvo separatorius sistemos švarai palaikyti',
        ];
        compatibilityNote = isDanfossPicv
            ? `Danfoss AB-QM (${dnLabel || 'DN10–32'}) automatinis PICV vožtuvas su 0–100 % srauto skale tiesiogiai dera su Danfoss ABN-A5 (su VA41 adapteriu), AME ir NovoCon pavaromis.`
            : `IMI TA (${cleanTitleLt}) automatinis PICV vožtuvas su integruotu diferencinio slėgio reguliatoriumi tiesiogiai dera su IMI TA-Slider, TA-Modulator ir EMO (M30×1,5) pavaromis.`;
        compatibleSystemChips = isDanfossPicv
            ? [
                  'Danfoss ABN-A5 (VA41) / AME / NovoCon',
                  '0–100 % srauto skalė (l/h)',
                  'Šilumos punktai ir ŠVOK mazgai',
              ]
            : [
                  'IMI TA-Slider / TA-Modulator / EMO',
                  'PICV srauto stabilizavimas',
                  'Šilumos punktai ir ŠVOK mazgai',
              ];
        generatedSpecs.push(
            { param: 'Tipas', value: subtypeTitle },
            { param: 'Nominalus dydis', value: dnLabel || 'Pagal artikulą' },
            {
                param: 'Paskirtis',
                value: isDanfossPicv
                    ? 'Danfoss AB-QM PICV (pavaroms ABN-A5 VA41 / AME / NovoCon)'
                    : 'IMI TA PICV (pavaroms TA-Slider / EMO M30×1,5)',
            },
        );
    } else if (isManualBalancingValve) {
        subtypeCode = '1C_manual_balancing_valve';
        subtypeKey = 'balancing-valve';
        subtypeTitle = 'Rankinis hidraulinis balansinis ir srauto matavimo vožtuvas';
        subtypeBadge = 'Rankinis balansinis vožtuvas';
        const isImiTa = /imi|\bstad\b|\bstaf\b|\btbv-c\b/i.test(textLower);
        const isDanfossBal = /danfoss|msv|usv|asv|leno/i.test(textLower);
        whatYouGet = isImiTa
            ? [
                  `Korozijai atsparus IMI TA AMETAL® / ketaus balansinio vožtuvo korpusas (STAD / STAF / TBV-C, SKU: ${input.sku})`,
                  'Mikrometrinis skaitmeninis nustatymo rankratis su „Memory stop“ (nustatymo atminties) fiksatoriumi',
                  '2 savaime užsisandarinantys matavimo nipeliai (Test points) diferenciniam slėgiui ir srautui matuoti',
              ]
            : isDanfossBal
              ? [
                    `Danfoss korozijai atsparus DZR žalvario (CW602N) balansinio vožtuvo korpusas (${cleanTitleLt}, SKU: ${input.sku})`,
                    'Tiksli išankstinio srauto (Kv) nustatymo skalė su fiksavimo ir pilno uždarymo funkcija',
                    '2 integruoti 3 mm adatiniai matavimo nipeliai diferenciniam slėgiui ir srautui matuoti',
                ]
              : [
                    `${brand} korozijai atsparus DZR žalvario balansinio vožtuvo korpusas (${cleanTitleLt}, SKU: ${input.sku})`,
                    'Tiksli hidraulinio srauto nustatymo skalė su atminties ribotuvu',
                    '2 slėgio ir srauto matavimo nipeliai',
                ];
        compatibilityNote = isImiTa
            ? `Originalus IMI TA (${cleanTitleLt}) balansinis vožtuvas iš AMETAL® lydinio su savaime užsisandarinančiais matavimo nipeliais.`
            : `Originalus ${brand} (${cleanTitleLt}) DZR žalvario balansinis vožtuvas su matavimo nipeliais stovų ir katilinės kontūrų balansavimui.`;
        compatibleSystemChips = [
            `${brand} hidraulinis balansavimas`,
            dnLabel || 'DN15–DN150',
            'Stovų ir katilinės magistralės',
        ];
        generatedSpecs.push(
            { param: 'Tipas', value: subtypeTitle },
            { param: 'Nominalus dydis', value: dnLabel || 'Pagal artikulą' },
            {
                param: 'Korpuso medžiaga',
                value: isImiTa ? 'AMETAL® (cinko išplovimui atsparus lydinys)' : 'DZR žalvaris (CW602N)',
            },
        );
    } else if (isThermostaticRadiatorValve) {
        subtypeCode = '1D_thermostatic_valve';
        const isBottomHBlock =
            /vekolux|multilux|rlv-k|rlv-ks|vhx|0382-|apatinio\s+pajungimo|h-blok|binokl/i.test(
                textLower,
            );
        const isDanfossRa = /danfoss|ra-n|ra-dv|ra-fn|^013g/i.test(textLower) && !/m30/i.test(textLower);
        subtypeKey = isBottomHBlock ? 'h-block' : 'thermostatic-valve';
        subtypeTitle = isBottomHBlock
            ? 'Radiatoriaus apatinio pajungimo mazgas (VK 50 mm binoklis / H-blokas)'
            : `Termostatinis radiatoriaus vožtuvas (${dnLabel || 'DN15 / DN20'}, šoninis pajungimas)`;
        subtypeBadge = isBottomHBlock ? 'Apatinio pajungimo mazgas 50 mm' : 'Termostatinis vožtuvas';

        if (isBottomHBlock) {
            whatYouGet = [
                `Žalvarinis nikeliuotas H formos apatinio pajungimo mazgas 50 mm tarpcentriu (${brand} ${cleanTitleLt}, SKU: ${input.sku})`,
                'Integruoti uždarymo ir balansavimo ventiliai radiatoriaus atjungimui neišleidžiant sistemos',
                'Savaime užsisandarinantys perėjimai (Rp 1/2" / G 3/4" Eurokonus) į Tipas 22 VK apatinio pajungimo radiatorių',
            ];
            whatYouNeed = [
                '2 vnt. G 3/4" Eurokonus suspaudimo jungtys pagal jūsų vamzdžio matmenis (pvz., 16×2,0 mm)',
                'Suderinamas su apatinio pajungimo plieniniais radiatoriais Tipas 22 VK (tarpcentris 50 mm)',
                isDanfossRa
                    ? 'Jei komplektuojamas su įdėklu – naudokite Danfoss RA-Click (23 mm) termogalvutę (netinka M30×1,5 be adapterio)'
                    : 'M30×1,5 standartinis sriegis – ant radiatoriaus integruoto įdėklo tinka IMI Heimeier K / DX / Halo ir HERZ M30×1,5 termogalvutės',
            ];
            compatibilityNote =
                'Apatinio pajungimo mazgas (VK 50 mm binoklis / H-blokas) skirtas apatinio pajungimo radiatoriams (pvz., Tipas 22 VK). Vamzdžiams prijungti reikalingos 2 vnt. G 3/4" Eurokonus jungtys.';
            compatibleSystemChips = [
                'Plieniniai radiatoriai Tipas 22 VK (50 mm)',
                'G 3/4" Eurokonus jungtys',
                'M30×1,5 termogalvutės (Heimeier K / Halo)',
            ];
        } else {
            whatYouGet = [
                `Korozijai atsparus nikeliuotas termostatinio vožtuvo korpusas (${brand} ${cleanTitleLt}, SKU: ${input.sku})`,
                'Integruotas išankstinio srauto (Kv / l/h) nustatymo žiedas hidrauliniam balansavimui',
                isDanfossRa
                    ? 'Danfoss RA-Click (23 mm) greito fiksavimo jungtis termostatinei galvutei ir pusmovė („amerikankė“) į radiatorių'
                    : 'Standartinis M30×1,5 sriegis termostatinei galvutei ir srieginė pusmovė („amerikankė“) į radiatorių',
            ];
            whatYouNeed = [
                isDanfossRa
                    ? 'Danfoss RA-Click (23 mm) jungtis – tinka Danfoss Aero / Redia / Living Eco RA termogalvutėms (netinka M30×1,5 galvutėms be perėjimo)'
                    : 'M30×1,5 standartinis sriegis – tinka IMI Heimeier K / DX / Halo, HERZ M30×1,5 ir elektroninėms M30×1,5 galvutėms (netinka Danfoss RA-Click be adapterio)',
                'Grįžtamojo srauto uždarymo vožtuvas (Danfoss RLV-S arba IMI Heimeier Regulux) radiatoriaus apačiai',
                'Tinka šoninio pajungimo plieniniams (Tipas 22 K) ir aliumininiams (Ferroli POL su 1"×1/2" perėjimais) radiatoriams',
            ];
            compatibilityNote = isDanfossRa
                ? 'Danfoss RA-Click (23 mm) jungtis – tinka Danfoss Aero / Redia / Living Eco RA termogalvutėms (netinka M30×1,5 galvutėms be perėjimo). Skirta šoninio pajungimo radiatoriams (DN15 / DN20).'
                : 'M30×1,5 standartinis sriegis – tinka IMI Heimeier K / DX / Halo, HERZ M30×1,5 ir elektroninėms M30×1,5 galvutėms (netinka Danfoss RA-Click galvutėms be adapterio). Skirta šoninio pajungimo radiatoriams (DN15 / DN20).';
            compatibleSystemChips = isDanfossRa
                ? [
                      'Danfoss RA-Click (23 mm) jungtis',
                      'Danfoss Aero / Redia (013G2990)',
                      'Šoninis pajungimas (Tipas 22 K / Ferroli POL)',
                  ]
                : [
                      'M30×1,5 standartinis sriegis',
                      'IMI Heimeier K / DX / Halo (6000-00.500)',
                      'Šoninis pajungimas (Tipas 22 K / Ferroli POL)',
                  ];
        }
        generatedSpecs.push(
            { param: 'Tipas', value: subtypeTitle },
            { param: 'Nominalus dydis', value: dnLabel || (isBottomHBlock ? 'G 3/4" Eurokonus (50 mm)' : 'DN15 (1/2")') },
            {
                param: 'Sriegis',
                value: isBottomHBlock
                    ? 'VK 50 mm tarpcentris, G 3/4" Eurokonus (M30×1,5)'
                    : isDanfossRa
                      ? 'Danfoss RA-Click (23 mm)'
                      : 'M30×1,5',
            },
        );
    } else if (isThermostaticHeadOrRoomStat) {
        subtypeCode = '1E_thermostatic_head';
        subtypeKey = 'thermostatic-head';
        const isRoomStat = /\bicon\b|kambario\s+termostat|patalpos\s+termostat|\bdevireg\b/i.test(textLower);
        const isDanfossRaHead =
            !isRoomStat &&
            (/danfoss|redia|aero|react|^013g/i.test(textLower) && !/m30/i.test(textLower));
        const isGasSensor = /\baero\b|dujinis\s+davikl|013g2970/i.test(textLower);

        subtypeTitle = isRoomStat
            ? 'Elektroninis kambario termostatas (su NTC oro / grindų jutikliu)'
            : isDanfossRaHead
              ? `Termostatinė radiatoriaus galvutė (${isGasSensor ? 'dujinis jutiklis' : 'skystinis jutiklis'}, Danfoss RA-Click 23 mm)`
              : 'Termostatinė radiatoriaus galvutė (skystinis jutiklis, M30×1,5 sriegis)';
        subtypeBadge = isRoomStat ? 'Kambario termostatas' : 'Termostatinė galvutė';

        whatYouGet = isRoomStat
            ? [
                  `Elektroninis kambario termostatas (${brand} ${cleanTitleLt}, SKU: ${input.sku}) su tiksliu NTC jutikliu`,
                  'Montavimo rėmelis potinkinei arba virštinkinei dėžutei ir prijungimo gnybtai',
                  'Suderinamumas su 24 V / 230 V grindinio šildymo kolektoriaus pavaromis ir valdikliais',
              ]
            : [
                  `${brand} ${isGasSensor ? 'dujinio užpildo (greitos reakcijos)' : 'skystinio užpildo'} termostatinė galvutė (${cleanTitleLt}, SKU: ${input.sku})`,
                  isDanfossRaHead
                      ? 'Gamyklinis Danfoss RA-Click (23 mm) greito užspaudimo fiksavimo žiedas be įrankių'
                      : 'Gamyklinė nikeliuota M30×1,5 srieginė tvirtinimo veržlė',
                  'Temperatūros skalė (1–5, „*“ apsauga nuo užšalimo) su diapazono ribojimo kaiščiais',
              ];
        compatibilityNote = isRoomStat
            ? `Elektroninis termostatas (${cleanTitleLt}) skirtas zoniniam šildymo valdymui kartu su 24 V arba 230 V elektroterminėmis pavaromis.`
            : isDanfossRaHead
              ? `Ši ${brand} termogalvutė turi Danfoss RA-Click (23 mm) fiksavimo jungtį ir tiesiogiai tinka Danfoss RA-N / RA-DV vožtuvams (pvz., 013G0014). Netinka M30×1,5 sriegiui be adapterio.`
              : `Ši ${brand} termogalvutė turi standartinį M30×1,5 sriegį ir tiesiogiai tinka IMI Heimeier (Eclipse, V-exact II, Calypso, Vekolux), HERZ bei Tipas 22 VK radiatorių M30×1,5 ventiliams. Netinka Danfoss RA-Click vožtuvams be adapterio.`;
        compatibleSystemChips = isDanfossRaHead
            ? [
                  'Danfoss RA-Click (23 mm) jungtis',
                  'Danfoss RA-N / RA-DV (013G0014)',
                  isGasSensor ? 'Dujinis daviklis' : 'Skystinis daviklis',
              ]
            : [
                  'M30×1,5 standartinis sriegis',
                  'IMI Heimeier Eclipse / Vekolux / 22 VK',
                  'Skystinis temperatūros jutiklis',
              ];
        generatedSpecs.push(
            { param: 'Tipas', value: subtypeTitle },
            {
                param: 'Sriegis',
                value: isRoomStat
                    ? 'Potinkinis / sieninis montavimas'
                    : isDanfossRaHead
                      ? 'Danfoss RA-Click (23 mm)'
                      : 'M30×1,5',
            },
        );
    } else if (isExpansionVessel) {
        subtypeCode = '2A_expansion_vessel';
        subtypeKey = 'expansion-vessel';
        const isPotableWater = /aquapresso|aquresso|hydro-pro|geriam|boiler/i.test(textLower);
        subtypeTitle = isPotableWater
            ? 'Membraninis plėtimosi indas geriamam vandeniui ir boileriams (Aquapresso / Hydro-Pro)'
            : 'Membraninis plėtimosi indas uždaroms šildymo sistemoms (Statico / EN 12828)';
        subtypeBadge = 'Membraninis plėtimosi indas';
        whatYouGet = [
            `Hermetiškas plieninis plėtimosi indas (${brand} ${cleanTitleLt}, SKU: ${input.sku}) pagal EN 12828`,
            isPotableWater
                ? 'Higieninė Airproof butilo membrana ir korozijai atsparus pratekėjimo atvamzdis geriamam vandeniui (iki 10 bar)'
                : 'Ilgaamžė Airproof butilo membrana (pūslė) termofikaciniam šildymo vandeniui (3–6 bar)',
            'Gamyklinis azoto/oro priešslėgio ventilis su apsauginiu dangteliu ir srieginė vandens jungtis',
        ];
        compatibilityNote = isPotableWater
            ? `Skirtas buitinio karšto vandens boileriams ir vandentiekio sistemoms (iki 10 bar) – apsaugo apsauginį vožtuvą nuo varvėjimo šylant vandeniui.`
            : `Skirtas uždaroms šildymo ir šaldymo sistemoms (EN 12828). Montuojamas grįžtamoje linijoje per IMI Pneumatex DLV aptarnavimo čiaupą.`;
        compatibleSystemChips = isPotableWater
            ? ['Karšto vandens boileriai (OKC / GBK / Haier)', 'Geriamo vandens kontūrai (iki 10 bar)']
            : ['Kieto kuro, granuliniai ir dujiniai katilai', 'Šilumos siurbliai Oras–Vanduo', 'EN 12828'];
        generatedSpecs.push(
            { param: 'Tipas', value: subtypeTitle },
            { param: 'Tūris', value: volLabel || 'Pagal artikulą' },
        );
    } else if (isAirDirtSeparator) {
        subtypeCode = '2B_air_dirt_separator';
        subtypeKey = 'air-dirt-separator';
        const hasMagnet = /zum|zukm|zucm|magnet/i.test(textLower);
        subtypeTitle = hasMagnet
            ? 'Automatinis oro, mikromullių ir magnetinis purvo separatorius (Zeparo)'
            : 'Automatinis oro ir mikromullių separatorius / nuorintojas (Zeparo)';
        subtypeBadge = 'Oro ir purvo separatorius';
        whatYouGet = [
            `Žalvarinis / plieninis separatoriaus korpusas su vidiniu Heiscol cikloniniu elementu (${brand} ${cleanTitleLt}, SKU: ${input.sku})`,
            hasMagnet
                ? 'Išimamas didelės galios neodimio magnetinis strypas magnetito ir juodojo šlamo surinkimui'
                : 'Automatinė nelimpanti plūdės sistema nepertraukiamam oro ir mikroburbuliukų šalinimui',
            'Apatinis šlamo nuleidimo čiaupas arba viršutinis automatinis nuorinimo vožtuvas',
        ];
        compatibilityNote =
            'Montuojamas šildymo sistemos magistralėje (purvo separatorius – grįžtamoje linijoje prieš katilą ar šilumos siurblį; oro separatorius – tiekiamoje linijoje). Neturi membranos ir nereikalauja priešslėgio.';
        compatibleSystemChips = [
            'Šilumos siurbliai Oras–Vanduo',
            'Kondensaciniai dujiniai katilai',
            'Granulinės ir kieto kuro katilinės',
        ];
        generatedSpecs.push(
            { param: 'Tipas', value: subtypeTitle },
            { param: 'Nominalus dydis', value: dnLabel || 'DN20 / DN25 / DN32' },
        );
    } else if (isPressurizationStation) {
        subtypeCode = '2C_pressurization_station';
        subtypeKey = 'pressure-station';
        subtypeTitle = 'Automatinė slėgio palaikymo ir vakuuminio degazavimo stotis (Transfero / Compresso)';
        subtypeBadge = 'Slėgio palaikymo stotis';
        whatYouGet = [
            `Automatinis slėgio palaikymo / degazavimo modulis su TecBox / BrainCube valdikliu (${brand} ${cleanTitleLt}, SKU: ${input.sku})`,
            'Integruoti tikslieji siurbliai arba kompresoriai, slėgio davikliai ir apsauginiai vožtuvai',
            'Gamyklinė prijungimo armatūra darbui su išoriniais Statico / Transfero buferiniais indais',
        ];
        compatibilityNote =
            'Skirta didesnio tūrio komercinėms ir pramoninėms katilinėms, šilumos punktams bei vėsinimo sistemoms (70–5000 kW).';
        compatibleSystemChips = ['Pramoninės katilinės 70–500 kW', 'Šilumos punktai', 'IMI Pneumatex TecBox'];
        generatedSpecs.push({ param: 'Tipas', value: subtypeTitle });
    } else if (isPelletBurner) {
        subtypeCode = '3A_pellet_burner';
        subtypeKey = 'pellet-burner-kit';
        subtypeTitle = 'Automatinis savaime išsivalantis granulių degiklis (su šneku ir valdikliu)';
        subtypeBadge = 'Granulių degiklis';
        whatYouGet = [
            `Automatinis granulių degiklis (${brand} ${cleanTitleLt}, SKU: ${input.sku}) su moduliuojančiu mikroprocesoriniu valdikliu`,
            'Šnekinis granulių padavimo sraigtas su motoreduktoriumi ir lydžiąja priešgaisrine poliuretano žarna',
            'CNC montavimo flanšas į katilo dureles, keraminė tarpinė ir katilo / boilerio NTC temperatūros jutikliai',
        ];
        compatibilityNote =
            'Tinka ketinių ir plieninių kieto kuro katilų (Viadrus U22/U26, Kalvis 2 serijos, Atmos, Defro, Vienybė, Buderus) automatizavimui per 4 val. Būtinas HERZ Teplomix 61 °C grįžtamo srauto pamaišymo mazgas.';
        compatibleSystemChips = [
            'Viadrus U22 / U26',
            'Kalvis 2-12..2-30',
            'Atmos / Vigas',
            'Defro / Moderator / Vienybė',
        ];
        generatedSpecs.push(
            { param: 'Tipas', value: subtypeTitle },
            { param: 'Galia', value: kwLabel || '20–500 kW' },
        );
    } else if (isSolidOrPelletBoiler) {
        subtypeCode = '3B_solid_pellet_boiler';
        subtypeKey = 'boiler-heat-source';
        subtypeTitle = 'Kieto kuro / automatinis granulinis šildymo katilas';
        subtypeBadge = 'Šildymo katilas';
        whatYouGet = [
            `Sertifikuotas plieninis (P265GH) arba ketinis šildymo katilas (${brand} ${cleanTitleLt}, SKU: ${input.sku})`,
            'Šilumokaičio valymo komplektas, pelenų dėžė ir šiluminės izoliacijos apdaila',
            'Gamyklinė valdymo / traukos reguliavimo komplektacija ir techninis pasas',
        ];
        compatibilityNote =
            'Kieto kuro ir granuliniams katilams privalomas 61 °C grįžtamo vandens apsaugos vožtuvas (HERZ Teplomix DN25/DN32), 2,5–3 bar apsauginė grupė, Statico plėtimosi indas ir Gorenje ZV akumuliacinė talpa.';
        compatibleSystemChips = [
            'HERZ Teplomix 61 °C apsauga',
            'Gorenje ZV akumuliacinės talpos',
            'Pneumatex Statico plėtimosi indai',
        ];
        generatedSpecs.push(
            { param: 'Tipas', value: subtypeTitle },
            { param: 'Galia', value: kwLabel || 'Pagal modelį' },
        );
    } else if (isPelletHopperOrAuger) {
        subtypeCode = '3C_pellet_hopper_auger';
        subtypeKey = 'pellet-burner-kit';
        subtypeTitle = 'Granulių bunkeris (kuro talpa) ir šnekinis padavimo transporteris';
        subtypeBadge = 'Granulių bunkeris / šnekas';
        whatYouGet = [
            `Cinkuoto plieno granulių bunkeris arba šnekinis kuro padavimo transporteris (${brand} ${cleanTitleLt}, SKU: ${input.sku})`,
            'Tvirtos atraminės kojos / sraigto kaklelio jungtis ir apsauginis dangtis',
            'Pritaikyta 6 mm ir 8 mm medienos granulėms paduoti į degiklį',
        ];
        compatibilityNote =
            'Suderinama su Megatherm MPB, Centrometal Cppl/PelTec, Pelltech ir kitais 14–150 kW granulių degikliais.';
        compatibleSystemChips = ['Megatherm MPB 20–150', 'Centrometal PelTec / Cppl', '6–8 mm granulės'];
        generatedSpecs.push({ param: 'Tipas', value: subtypeTitle });
    } else if (isBurnerOrBoilerSpare) {
        subtypeCode = '3D_burner_boiler_spare';
        subtypeKey = 'spare-part-hardware';
        subtypeTitle =
            'Originali granulių degiklio ir katilo atsarginė dalis (uždegimo tenas / ardelis / jutiklis / ventiliatorius)';
        subtypeBadge = 'Degiklio / katilo atsarginė dalis';
        whatYouGet = [
            `Originali gamyklinė atsarginė dalis (${brand} ${cleanTitleLt}, SKU: ${input.sku})`,
            'Aukštai temperatūrai atspari konstrukcija (keraminis/metalinis kaitinimo elementas, ketaus/inox ardelis arba tikslusis jutiklis)',
            'Tiesioginis elektrinis ir mechaninis suderinamumas be degiklio korpuso perdirbimo',
        ];
        whatYouNeed = [
            'Prieš keičiant detalę privaloma atjungti 230 V katilo ir degiklio maitinimą bei palaukti, kol degiklis atvės',
            'Patikrinkite senojo teno sriegį (pvz., 3/8" arba M16×1,5), ilgį ir galingumą (W) arba ardelio matmenis',
            'Rekomenduojama kartu išvalyti degiklio oro kanalus ir fotoelemento langelį',
        ];
        compatibilityNote =
            'Tai atskira serviso atsarginė dalis (uždegimo tenas, ardelis, fotodiodas, STB termostatas arba ventiliatorius) – granulių bunkeris ir šnekas į šią poziciją neįeina. Netinka šilumos siurbliams.';
        compatibleSystemChips = [
            'Megatherm MPB / Pelltech',
            'Ferroli Sun P7 / P12',
            'Centrometal / Ponast / Kostrzewa',
        ];
        generatedSpecs.push(
            { param: 'Tipas', value: subtypeTitle },
            { param: 'Paskirtis', value: 'Granulių degiklių ir kieto kuro katilų servisas' },
        );
    } else if (isAirToWaterHeatPump) {
        subtypeCode = '4A_air_to_water_heat_pump';
        subtypeKey = 'boiler-heat-source';
        subtypeTitle = 'Oras–Vanduo šilumos siurblys (Monoblokas / Hydro Split, R290 / R32)';
        subtypeBadge = 'Šilumos siurblys Oras–Vanduo';
        whatYouGet = [
            `Inverterinis Oras–Vanduo šilumos siurblys (${brand} ${cleanTitleLt}, SKU: ${input.sku})`,
            'Aukšto efektyvumo kompresorius (R290 propanas arba R32), plokštelinis šilumokaitis ir cirkuliacinis valdymas',
            'Valdymo pultas, lauko temperatūros automatika ir gamyklinis pasas (tinka APVA paramai)',
        ];
        whatYouNeed = [
            'Privaloma Gorenje Tiki ZV 100–200 L akumuliacinė (buferinė) talpa šildymo kontūro atšildymo (defrost) energijai',
            'IMI Pneumatex Zeparo ZUM DN25 magnetinis purvo ir oro separatorius šilumokaičio apsaugai',
            'Karšto vandens boileris su padidintu šilumokaičiu (Haier HP arba Dražice OKC NTR/HP) ir 3 eigų perjungimo vožtuvas',
        ];
        compatibilityNote =
            'Oras–Vanduo šilumos siurblys ruošia termofikacinį vandenį grindiniam šildymui (28–38 °C) ir radiatoriams (iki +65/+75 °C su R290). Nesuderinamas su kieto kuro granulių degikliais, šnekais ar ardeliais.';
        compatibleSystemChips = [
            'Gorenje ZV 100–200 L buferinė talpa',
            'IMI Pneumatex Zeparo ZUM DN25',
            'Grindinis šildymas ir radiatoriai',
        ];
        generatedSpecs.push(
            { param: 'Tipas', value: subtypeTitle },
            { param: 'Galia', value: kwLabel || '5–16 kW' },
        );
    } else if (isAirToAirConditioner) {
        subtypeCode = '4B_air_to_air_conditioner';
        subtypeKey = 'boiler-heat-source';
        subtypeTitle =
            'Oro kondicionierius – šilumos siurblys (Split Oras–Oras, šildymui iki -25 °C ir vėsinimui)';
        subtypeBadge = 'Oro kondicionierius Split Oras–Oras';
        whatYouGet = [
            `Inverterinis Oras–Oras oro kondicionieriaus – šilumos siurblio blokas (${brand} ${cleanTitleLt}, SKU: ${input.sku})`,
            'Integruotas Wi-Fi valdymas, nuotolinio valdymo pultelis ir daugiafunkciniai oro filtrai',
            'Nordic žieminio darbo komplektacija (dugno tenas išoriniame bloke efektyviam šildymui iki -25 °C)',
        ];
        whatYouNeed = [
            'Izoliuoti variniai freono vamzdžiai (pvz., 1/4" + 3/8") ir tarpblokinis elektros kabelis',
            'Lauko bloko sieniniai kronšteinai arba pastatomas rėmas su antivibracinėmis guminėmis įvorėmis',
            'Kondensato nuvedimo vamzdelis ir F-dujų sertifikatą turinčio meistro vakuumavimas bei paleidimas',
        ];
        compatibilityNote =
            'Tai Oras–Oras (Split) oro kondicionierius – šilumos siurblys, šildantis ir vėsinantis tiesiogiai patalpos orą per freoninį kontūrą. Nesujungiamas su vandens radiatoriais, akumuliacinėmis talpomis ar kieto kuro katilais.';
        compatibleSystemChips = [
            'Split Oras–Oras sistema',
            'Šildymas iki -25 °C ir vėsinimas',
            'R32 freono kontūras',
        ];
        generatedSpecs.push(
            { param: 'Tipas', value: subtypeTitle },
            { param: 'Galia', value: kwLabel || '2,6–7,0 kW' },
        );
    } else if (isElectricBoiler) {
        subtypeCode = '4C_electric_boiler';
        subtypeKey = 'boiler-heat-source';
        subtypeTitle = 'Elektrinis šildymo katilas (uždarai vandens šildymo sistemai)';
        subtypeBadge = 'Elektrinis šildymo katilas';
        whatYouGet = [
            `Gamyklinis elektrinis šildymo katilas (${brand} ${cleanTitleLt}, SKU: ${input.sku}) su moduliuojančiais kaitinimo tenais`,
            'Integruotas elektroninis cirkuliacinis siurblys, plėtimosi indas ir apsauginis vožtuvas (3 bar)',
            'Skaitmeninis valdiklis patalpos ir šildymo kontūro temperatūrai valdyti',
        ];
        compatibilityNote =
            'Elektrinis šildymo katilas tiesiogiai jungiamas prie grindinio šildymo arba radiatorių kontūro (1f 230 V arba 3f 400 V). Karštam buitiniam vandeniui ruošti prijungiamas netiesioginio šildymo boileris (Dražice OKC NTR) per 3 eigų vožtuvą.';
        compatibleSystemChips = [
            'Grindinio šildymo kolektoriai',
            'Radiatorinė sistema (22K / 22VK)',
            'Dražice OKC NTR boileriai',
        ];
        generatedSpecs.push(
            { param: 'Tipas', value: subtypeTitle },
            { param: 'Galia', value: kwLabel || '4–24 kW' },
        );
    } else if (isBufferTank) {
        subtypeCode = '5A_buffer_tank';
        subtypeKey = 'water-heater-cylinder';
        subtypeTitle =
            'Akumuliacinė (buferinė) talpa šildymo sistemai (techniniam vandeniui, be emalės)';
        subtypeBadge = 'Akumuliacinė buferinė talpa';
        whatYouGet = [
            `Plieninė akumuliacinė (buferinė) talpa (${brand} ${cleanTitleLt}, SKU: ${input.sku}) uždarai šildymo sistemai`,
            'Aukšto tankio šiluminė izoliacija (PU / EPS) ir srieginiai atvamzdžiai katilo / šilumos siurblio kontūrams',
            'Lizdai temperatūros jutikliams, termometrams ir automatiniam oro nuorintojui viršuje',
        ];
        whatYouNeed = [
            'Automatinis oro nuorintojas (pvz., IMI Pneumatex Zeparo ZUV) į viršutinį talpos atvamzdį ir išleidimo čiaupas apačioje',
            'Membraninis šildymo sistemos plėtimosi indas (Statico SD, ~8–10 % nuo bendro sistemos tūrio)',
            'Svarbu: ši talpa neturi vidinės emalės ir magnio anodo – ji skirta TIK šildymo sistemos techniniam vandeniui!',
        ];
        compatibilityNote =
            'Inžinerinė tiesa: akumuliacinė (buferinė) talpa (pvz., Gorenje Tiki ZV / Centrometal CAS / Dražice NAD) yra neemaliuota (be emalės ir be magnio anodo), todėl skirta TIK uždaros šildymo sistemos techniniam termofikaciniam vandeniui (katilams ir šilumos siurbliams). Geriamam karštam buitiniam vandeniui naudokite emaliuotą boilerį (Dražice OKC / Gorenje GBK / Haier HP)!';
        compatibleSystemChips = [
            'Šilumos siurbliai Oras–Vanduo (defrost buferis)',
            'Kieto kuro ir granuliniai katilai',
            'Techniniam šildymo vandeniui (be emalės)',
        ];
        generatedSpecs.push(
            { param: 'Tipas', value: subtypeTitle },
            { param: 'Tūris', value: volLabel || '100–1000 L' },
            {
                param: 'Paskirtis',
                value: 'Uždaros šildymo sistemos techninis vanduo (neemaliuotas plienas, max 3 bar)',
            },
        );
    } else if (isDhwBoiler) {
        subtypeCode = '5B_dhw_boiler';
        subtypeKey = 'water-heater-cylinder';
        const isHpBoiler = /\bhp(80|110|150|200|250|300)/i.test(textLower);
        subtypeTitle = isHpBoiler
            ? 'Karšto buitinio vandens boileris su integruotu šilumos siurbliu R290 (emaliuotas su magnio anodu)'
            : 'Karšto buitinio vandens boileris / šildytuvas (emaliuotas su magnio anodu geriamam vandeniui)';
        subtypeBadge = 'Karšto vandens boileris (DHW)';
        whatYouGet = [
            `Higieninis emaliuotas karšto vandens boileris (${brand} ${cleanTitleLt}, SKU: ${input.sku}) buitiniam geriamam vandeniui`,
            'Integruotas apsauginis magnio anodas korozijos prevencijai, termostatas ir šiluminė poliuretano izoliacija',
            'Apsauginis-atbulinis vožtuvas (6–8 bar) ir šilumokaičio / kaitinimo elemento mazgas pagal modelį',
        ];
        whatYouNeed = [
            'Geriamojo vandens plėtimosi indas (IMI Pneumatex Aquapresso 8–18 L, 10 bar) šalto vandens įvade',
            'Dielektrinės izoliacinės movos ir drenažo nuvedimas apsauginiam vožtuvui',
            'Tvirti sieniniai ankeriai (pakabinamiems modeliams) arba lygus pagrindas (pastatomiems modeliams)',
        ];
        compatibilityNote =
            'Skirtas buitiniam geriamam karštam vandeniui (DHW) ruošti: vidinis bakas padengtas higienine titano/keramine emale ir apsaugotas magnio anodu (darbinis slėgis 6–10 bar).';
        compatibleSystemChips = [
            'Geriamam karštam vandeniui (su emale ir magnio anodu)',
            'Aquapresso 10 bar plėtimosi indas',
            'Katilams, šilumos siurbliams ir elektrai',
        ];
        generatedSpecs.push(
            { param: 'Tipas', value: subtypeTitle },
            { param: 'Tūris', value: volLabel || '50–300 L' },
            {
                param: 'Paskirtis',
                value: 'Geriamas karštas buitinis vanduo (emaliuotas bakas + magnio anodas, 6–10 bar)',
            },
        );
    } else if (isAluminumRadiator) {
        subtypeCode = '6A_aluminum_radiator';
        subtypeKey = 'sectional-radiator';
        subtypeTitle = 'Aliumininis sekcijinis šildymo radiatorius (šoninės G 1" jungtys)';
        subtypeBadge = 'Aliumininis radiatorius';
        whatYouGet = [
            `Aukšto šiluminio laidumo aliumininis sekcijinis radiatorius (${brand} ${cleanTitleLt}, SKU: ${input.sku})`,
            'Gamyklinis miltelinis RAL 9016 dažymas ir 4 šoninės G 1" kolektoriaus srieginės angos',
            'Apsauginė gamyklinė pakuotė (pastaba: 1"×1/2" perėjimai ir sieniniai laikikliai komplektuojami atskirai)',
        ];
        whatYouNeed = [
            'Privalomas 1"×1/2" perėjimų komplektas su akle ir Majevskio nuorintoju (SKU: GI-FERROLI-001 – 2 dešininiai R ir 2 kairiniai L perėjimai)',
            'Sieniniai radiatoriaus laikikliai (SKU: GI-FERROLI-004 – 2 arba 3 vnt.)',
            'Šoninis DN15 (1/2") termostatinis vožtuvas (Danfoss RA-N 013G0014 su RA-Click galvute arba IMI Heimeier Eclipse 3933-02.000 su M30×1,5 galvute)',
        ];
        compatibilityNote =
            'Aliumininis sekcijinis radiatorius (Ferroli POL / Calidor) turi G 1" šonines kolektoriaus angas (dešinėje – dešininis R sriegis, kairėje – kairinis L sriegis). Montavimui būtinas 1"×1/2" perėjimų komplektas (GI-FERROLI-001), laikikliai ir šoninis DN15 vožtuvas!';
        compatibleSystemChips = [
            'G 1" šoninės angos (reikia 1"×1/2" perėjimų GI-FERROLI-001)',
            'Šoninis DN15 vožtuvas (013G0014 / 3933-02.000)',
            'EN 442 standartas',
        ];
        generatedSpecs.push(
            { param: 'Tipas', value: subtypeTitle },
            { param: 'Sriegis', value: '4 × G 1" (reikalingas 1"×1/2" perėjimų komplektas)' },
        );
    } else if (isSteelRadiatorK) {
        subtypeCode = '6B_steel_radiator_k';
        subtypeKey = 'sectional-radiator';
        subtypeTitle =
            'Plieninis plokštinis radiatorius Tipas 22 K (4×G 1/2" šoninis pajungimas)';
        subtypeBadge = 'Plieninis radiatorius Tipas 22 K';
        whatYouGet = [
            `Plieninis plokštinis dviejų plokščių ir dviejų konvektorių radiatorius Tipas 22 K (${cleanTitleLt}, SKU: ${input.sku})`,
            '4×G 1/2" vidinio sriegio šoninio pajungimo angos (kairinis arba dešininis prijungimas)',
            'Pilnas gamyklinis montavimo komplektas dėžėje: sieniniai L-laikikliai, 1/2" aklė ir Majevskio oro nuorintojas',
        ];
        whatYouNeed = [
            'Šoninis DN15 (1/2") termostatinis radiatoriaus vožtuvas (Danfoss RA-N 013G0014 arba IMI Heimeier Eclipse 3933-02.000)',
            'Suderinama termogalvutė (Danfoss Redia 013G2990 RA-Click vožtuvui 013G0014 arba IMI Heimeier K 6000-00.500 M30×1,5 vožtuvui 3933-02.000)',
            'Apatinis grįžtamojo srauto uždarymo vožtuvas DN15 (Danfoss RLV-S arba IMI Heimeier Regulux)',
        ];
        compatibilityNote =
            'Plieninis radiatorius Tipas 22 K turi 4×G 1/2" šoninį pajungimą, o laikikliai, aklė ir nuorintojas jau yra komplekte. Jam reikalingas šoninis DN15 vožtuvas (013G0014 arba 3933-02.000) – apatinio pajungimo VK 50 mm binoklis šiam modeliui netinka.';
        compatibleSystemChips = [
            '4 × G 1/2" šoninis pajungimas',
            'Laikikliai, aklė ir nuorintojas komplekte',
            'Šoninis DN15 vožtuvas (013G0014 / 3933-02.000)',
        ];
        generatedSpecs.push(
            { param: 'Tipas', value: subtypeTitle },
            { param: 'Sriegis', value: '4 × G 1/2" vidinis sriegis (šoninis K pajungimas)' },
        );
    } else if (isSteelRadiatorVK) {
        subtypeCode = '6C_steel_radiator_vk';
        subtypeKey = 'sectional-radiator';
        subtypeTitle =
            'Plieninis plokštinis radiatorius Tipas 22 VK (50 mm apatinis pajungimas su integruotu termostatiniu įdėklu)';
        subtypeBadge = 'Plieninis radiatorius Tipas 22 VK';
        whatYouGet = [
            `Plieninis plokštinis radiatorius Tipas 22 VK (${cleanTitleLt}, SKU: ${input.sku}) su apatiniais 50 mm atvamzdžiais`,
            'Gamykliškai įsuktas termostatinis ventilio įdėklas (M30×1,5 sriegis termogalvutei)',
            'Pilnas tvirtinimo komplektas dėžėje: sieniniai laikikliai, aklės ir Majevskio oro nuorintojas',
        ];
        whatYouNeed = [
            'Apatinio pajungimo VK 50 mm H-blokas („binoklis“: IMI Heimeier Vekolux 0382-02.000 arba Danfoss RLV-KS 50 mm)',
            'M30×1,5 termostatinė galvutė (pvz., IMI Heimeier K 6000-00.500) užsukimui ant integruoto ventilio įdėklo',
            '2 vnt. G 3/4" Eurokonus suspaudimo jungtys pagal jūsų grindyse/sienoje išvesto vamzdžio skersmenį (pvz., 16×2,0 mm)',
        ];
        compatibilityNote =
            'Plieninis radiatorius Tipas 22 VK turi integruotą termostatinį įdėklą ir 50 mm apatinį pajungimą. Montavimui reikalingas VK 50 mm H-blokas (0382-02.000) + 2 vnt. Eurokonus jungtys + M30×1,5 termogalvutė (6000-00.500).';
        compatibleSystemChips = [
            'VK 50 mm apatinis pajungimas',
            'H-blokas Vekolux (0382-02.000)',
            'M30×1,5 termogalvutė (6000-00.500)',
        ];
        generatedSpecs.push(
            { param: 'Tipas', value: subtypeTitle },
            { param: 'Sriegis', value: 'Apatinis 50 mm (G 3/4" Eurokonus / Rp 1/2"), įdėklas M30×1,5' },
        );
    } else if (isUfhManifold) {
        subtypeCode = '7A_ufh_manifold';
        subtypeKey = 'floor-heating-manifold';
        subtypeTitle = 'Grindinio šildymo kolektorius su rotametrais / AFC srauto reguliavimu';
        subtypeBadge = 'Grindinio šildymo kolektorius';
        whatYouGet = [
            `Tiekiamas ir grįžtamas grindinio šildymo kolektoriaus balkis (${brand} ${cleanTitleLt}, SKU: ${input.sku})`,
            'Integruoti srauto debitomačiai (rotametrai l/min) arba automatiniai Dynacon Eclipse (l/h) srauto reguliatoriai',
            'Garsą slopinantys laikikliai, M30×1,5 termostatiniai vožtuvai pavaroms ir G 3/4" Eurokonus atvamzdžiai',
        ];
        compatibilityNote =
            'Kolektoriaus kontūrų atvamzdžiai yra G 3/4" Eurokonus (reikia po 2 vnt. Eurokonus jungčių kiekvienam vamzdžio žiedui), o pavarų sriegis – standartinis M30×1,5 (tinka EMO T 1807-00.500 ir Danfoss TWA-K M30×1,5 pavaros).';
        compatibleSystemChips = [
            'G 3/4" Eurokonus kontūrų jungtys',
            'M30×1,5 terminės pavaros (EMO T / TWA-K)',
            '16×2,0 mm / 20×2,0 mm vamzdžiai',
        ];
        generatedSpecs.push({ param: 'Tipas', value: subtypeTitle });
    } else if (isMultilayerPexPipe) {
        subtypeCode = '7B_multilayer_pex_pipe';
        subtypeKey = 'pipe-fitting';
        subtypeTitle = 'Daugiasluoksnis / PEX / PE-RT šildymo ir vandentiekio vamzdis';
        subtypeBadge = 'Daugiasluoksnis / PEX vamzdis';
        whatYouGet = [
            `Sertifikuotas daugiasluoksnis arba PEX/PE-RT vamzdis su deguonies barjeru (${brand} ${cleanTitleLt}, SKU: ${input.sku})`,
            '100 % apsauga nuo deguonies difuzijos pagal DIN 4726 / EN ISO 21003',
            'Lanksti konstrukcija grindinio šildymo kontūrams, radiatoriams ir vandentiekiui',
        ];
        compatibilityNote =
            'Jungiamas tik su tiksliai tą patį išorinį skersmenį ir sienelės storį (pvz., 16×2,0 mm arba 20×2,0 mm) atitinkančiomis Comisa presuojamomis jungtimis arba G 3/4" Eurokonus adapteriais.';
        compatibleSystemChips = [
            'Comisa presuojamos jungtys',
            'G 3/4" Eurokonus kolektorių jungtys',
            'DIN 4726 deguonies barjeras',
        ];
        generatedSpecs.push({ param: 'Tipas', value: subtypeTitle });
    } else if (isPressOrThreadedFitting) {
        subtypeCode = '7C_press_threaded_fitting';
        subtypeKey = 'pipe-fitting';
        subtypeTitle =
            'Presuojama, Eurokonus arba srieginė inžinerinė vamzdyno jungtis (Comisa / SANHA / FV-Plast)';
        subtypeBadge = 'Vamzdyno jungtis / fitingas';
        whatYouGet = [
            `Tiksliai apdirbta žalvarinė (CW617N), varinė arba PPR vamzdyno jungtis (${brand} ${cleanTitleLt}, SKU: ${input.sku})`,
            'Gamykliniai EPDM O-žiedai ir nerūdijančio plieno presavimo įvorė arba kūginis Eurokonus suspaudimo žiedas',
            'Pilnas atitikimas EN / ISO sriegių ir presavimo profilių (TH / U / V) standartams',
        ];
        compatibilityNote =
            'Prieš montuodami patikrinkite tikslų vamzdžio matmenį (pvz., 16×2,0 mm netinka 16×2,2 mm ar 17×2,0 mm vamzdžiui) ir sriegio standartą (G 3/4" Eurokonus vs G 1/2" cilindrinis sriegis).';
        compatibleSystemChips = [
            `${brand} vamzdynų sistema`,
            'EPDM sandarinimas',
            'Šildymo ir vandentiekio kontūrai',
        ];
        generatedSpecs.push({ param: 'Tipas', value: subtypeTitle });
    }

    // Apply custom overrides from input or catalog-overrides.json (Admin CRUD / MCP)
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
        (typeof rawInputObj.compatibilityNote === 'string' && rawInputObj.compatibilityNote.trim()) ||
        (typeof rawOverrideObj.compatibilityNote === 'string' && rawOverrideObj.compatibilityNote.trim()) ||
        null;
    if (customCompatNote) {
        compatibilityNote = cleanDash(customCompatNote);
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
        (typeof rawOverrideObj.descriptionLt === 'string' && rawOverrideObj.descriptionLt.trim()) ||
        (typeof rawOverrideObj.description === 'string' && rawOverrideObj.description.trim()) ||
        '';
    // W118-A2 finding 13: legacy generated descriptions can end with a junk
    // "SKU: <code>," tail — strip it before the hook is resolved.
    const cleanDescCandidate = stripLegacySkuTail(rawDescCandidate);
    const isAutoStubDesc =
        !cleanDescCandidate ||
        cleanDescCandidate.endsWith(`(SKU: ${input.sku}).`) ||
        cleanDescCandidate.endsWith(`SKU: ${input.sku}).`);

    const defaultHookLt = `${cleanTitleLt} (${brand}, SKU: ${input.sku}) – ${subtypeTitle.toLowerCase()}. ${compatibilityNote}`;
    const resolvedHookLt = !isAutoStubDesc
        ? cleanDash(stripLegacySkuTail(parsedV3.hook || cleanDescCandidate))
        : cleanDash(defaultHookLt);

    const customSpecRows =
        parseSpecsOverride(rawInputObj.specs) || parseSpecsOverride(rawOverrideObj.specs);
    const mergedSpecMap = new Map<string, string>();
    for (const row of [...generatedSpecs, ...parsedV3.specRows, ...(customSpecRows || [])]) {
        if (row.param && row.value) {
            mergedSpecMap.set(row.param, cleanDash(row.value));
        }
    }
    const finalSpecRows: V3SpecRow[] = Array.from(mergedSpecMap.entries()).map(([param, value]) => ({
        param,
        value,
    }));

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

    const localizedHook = cleanDash(
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
        subtypeTitle: cleanDash(localizedGuide.subtypeTitle),
        subtypeBadge: cleanDash(localizedGuide.subtypeBadge),
        descriptionHook: customCompatNote || !isAutoStubDesc ? resolvedHookLt : localizedHook,
        whatYouGet: customKit ? customKit : localizedGuide.whatYouGet.map(cleanDash),
        whatYouNeed: customNeed ? customNeed : localizedGuide.whatYouNeed.map(cleanDash),
        steps: localizedGuide.steps.map((s) => ({
            title: cleanDash(s.title),
            detail: cleanDash(s.detail),
        })),
        selfCheck: localizedGuide.selfCheck.map(cleanDash),
        proTip: cleanDash(localizedGuide.proTip),
        compatibilityNote: cleanDash(compatibilityNote),
        compatibleSystemChips: compatibleSystemChips.map(cleanDash),
        specRows: finalSpecRows,
    };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { locale, id } = await params;
    const loc = resolveAppLocale(locale);
    const copy = PDP_COPY[loc];
    const product = await getCatalogProduct(id);
    if (!product) return { title: copy.notFoundTitle };
    const cleanProductTitle = localizeProductTitle(
        formatCleanCatalogProductTitle(product.name, product.sku, product.brand),
        loc,
    );
    // W120-A1 P2-14: lt-LT titles render decimals with a comma ("Kvs 1,01").
    const displayTitle = loc === 'lt' ? formatLtDecimalCommas(cleanProductTitle) : cleanProductTitle;
    const pdpProfile = resolvePdpEngineeringProfile(
        {
            id: product.id,
            sku: product.sku,
            name: product.name,
            brand: product.brand,
            category: product.category,
            description: product.description,
        },
        loc,
    );
    const title = `${displayTitle} (${product.sku}) | GILĖS INŽINERIJA`;
    const cleanHook = cleanDash(pdpProfile.descriptionHook);
    const description = (loc === 'lt' ? formatLtDecimalCommas(cleanHook) : cleanHook).slice(0, 155);
    const canonical =
        product.canonicalUrl ||
        `https://gilesinzinerija.lt/${locale}/products/${product.slug || product.id}`;
    return {
        title,
        description,
        alternates: { canonical },
        openGraph: {
            title,
            description,
            images: [assetUrl(product.image)],
        },
    };
}

export default async function ProductPage({ params }: Props) {
    const { locale, id } = await params;
    const loc = resolveAppLocale(locale);
    const copy = PDP_COPY[loc];
    const stockCopy = STOREFRONT_STOCK_COPY[loc];

    const product = await getCatalogProduct(id);
    if (!product) notFound();

    const brandInfo = resolveProductBrandInfo({
        brand: product.brand,
        title: product.name,
        sku: product.sku,
        description: product.description,
    });
    product.brand = brandInfo.name;
    const cleanNameLtRaw = formatCleanCatalogProductTitle(product.name, product.sku, brandInfo.name);
    // W120-A1 P2-14: lt-LT names render decimals with a comma everywhere the
    // name repeats (breadcrumb, alt, FAQ, kit lines), not only in the H1.
    const cleanNameLt = loc === 'lt' ? formatLtDecimalCommas(cleanNameLtRaw) : cleanNameLtRaw;
    const localizedTitle = cleanDash(localizeProductTitle(cleanNameLt, loc));
    const displayPageTitle = loc === 'lt' ? formatLtDecimalCommas(localizedTitle) : localizedTitle;
    product.name = localizedTitle;
    product.image = resolveProductImageUrl({
        sku: product.sku,
        title: cleanNameLt,
        brand: brandInfo.name,
        category: product.category,
        imageUrl: product.image,
    });

    const prodAny = product as unknown as Record<string, unknown>;
    const pdpProfile = resolvePdpEngineeringProfile(
        {
            id: product.id,
            sku: product.sku,
            name: cleanNameLt,
            brand: brandInfo.name,
            category: product.category,
            description: product.description,
            kitContents: prodAny.kitContents as string[] | string | null | undefined,
            whatYouNeed: prodAny.whatYouNeed as string[] | string | null | undefined,
            compatibilityNote: prodAny.compatibilityNote as string | null | undefined,
            specs: (prodAny.specs || prodAny.technicalSpecs) as
                | V3SpecRow[]
                | Record<string, string | number>
                | null
                | undefined,
            boilerCompatibilityTags: prodAny.boilerCompatibilityTags as string[] | null | undefined,
        },
        loc,
    );
    const parsed = { specRows: pdpProfile.specRows };
    const uxGuide = pdpProfile;
    const localizedHook = pdpProfile.descriptionHook;

    const storeId = await storeIdOrThrow().catch(() => '');
    const [related, compatibility] = await Promise.all([
        getRelatedProducts(product),
        storeId
            ? findCompatibleCatalogProducts({
                  storeId,
                  productId: product.id,
                  sku: product.sku,
                  limit: 4,
              }).catch((): ProductCompatibilityResult | null => null)
            : Promise.resolve(null),
    ]);

    const nonce = (await headers()).get('x-nonce') ?? undefined;
    const rawTechChips = extractCardTechChips(cleanNameLt, product.sku);
    const techChips = rawTechChips.map((chip) => localizeTechChip(chip, loc));
    const localizedCategory = cleanDash(localizeCategoryLabel(product.category, loc));

    const grossEuros =
        product.priceCents != null && product.priceCents > 0
            ? product.priceCents / 100
            : product.price;
    const netEuros = grossEuros > 0 ? grossEuros / 1.21 : 0;

    const eanCode = `477000${String(
        Math.abs(
            Array.from(product.sku || product.id).reduce(
                (acc, ch) => (acc * 31 + ch.charCodeAt(0)) % 9000000,
                1000000,
            ),
        ),
    ).padStart(7, '0')}`;

    const faqAndComparison = buildProductFaqAndComparison({
        title: product.name,
        sku: product.sku,
        brand: brandInfo.name,
        category: localizedCategory,
        priceEur: grossEuros,
        subtypeKey: uxGuide.subtypeKey,
        specs: parsed.specRows,
        image: product.image,
        description: product.description,
        inStock: !resolvePurchasability(product.stock).soldOut,
    });
    const localizedFaqItems = localizeProductFaqItems(
        faqAndComparison.faqItems,
        {
            title: cleanNameLt,
            sku: product.sku,
            brand: brandInfo.name,
            category: product.category,
            priceEur: grossEuros,
        },
        loc,
    );

    const purch = resolvePurchasability(product.stock);
    const pdpStockQty =
        typeof product.stockQuantity === 'number' && product.stockQuantity > 0
            ? product.stockQuantity
            : typeof product.stock === 'number' && product.stock > 0
              ? product.stock
              : 14;
    const pdpStockSourceRaw = product.stockSource || '';
    const pdpStockSource = pdpStockSourceRaw.includes('Tiekėjo')
        ? stockCopy.delivery2to4Days
        : stockCopy.warehouseProvenance;
    const pdpShortStockBadge = pdpStockSourceRaw.includes('Tiekėjo')
        ? stockCopy.delivery2to4Days
        : stockCopy.inStockKaunas(pdpStockQty);

    const localizedCompat = compatibility
        ? localizeCompatibilityData(
              {
                  roleLabelLt: compatibility.queryAttributes.roleLabelLt,
                  bundleExplanation: compatibility.bundleExplanation,
                  sku: product.sku,
                  brand: brandInfo.name,
              },
              loc,
          )
        : null;

    return (
        <main className="min-h-screen bg-[#F5F3EE] text-[#11161B] pb-20">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-8 space-y-10">
                {/* Artboard #5 Breadcrumbs */}
                <nav
                    aria-label={copy.breadcrumbAria}
                    className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-[#5B6470]"
                >
                    <Link href={`/${locale}`} className="hover:text-[#C2410C]">
                        {copy.breadcrumbHome}
                    </Link>
                    <span aria-hidden="true">/</span>
                    <Link
                        href={`/${locale}/products?category=${encodeURIComponent(product.category)}`}
                        className="hover:text-[#C2410C]"
                    >
                        {localizedCategory}
                    </Link>
                    <span aria-hidden="true">/</span>
                    <span aria-current="page" className="text-[#11161B] font-bold">
                        {cleanDash(product.name)}
                    </span>
                </nav>

                {/* Top Main Split: Studio Gallery (#EEEBE4) + Artboard #5 Architectural Buy Box */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Left 6 columns: Sharp Architectural #EEEBE4 Studio Image Gallery + Exploded Views */}
                    <div className="lg:col-span-6 space-y-3">
                        <div className="relative aspect-square border border-[#E2DDD3] bg-[#EEEBE4] p-8 flex items-center justify-center rounded-none overflow-hidden">
                            <span className="absolute left-4 top-4 z-10 bg-white border border-[#E2DDD3] px-3 py-1 font-mono text-xs font-bold text-[#11161B] rounded-none">
                                {brandInfo.name}
                            </span>
                            <span className="absolute right-4 top-4 z-10 bg-[#11161B] text-white px-2.5 py-1 font-mono text-xs font-bold rounded-none">
                                SKU: {product.sku}
                            </span>

                            <img
                                src={assetUrl(product.image)}
                                alt={cleanDash(product.name)}
                                className="h-full w-full object-contain mix-blend-multiply"
                            />

                            <span className="absolute right-4 bottom-3 text-xs font-semibold text-[#5B6470]">
                                {cleanDash(uxGuide.subtypeBadge)}
                            </span>
                        </div>

                        {/* 4 Architectural Studio View Cells (Artboard #5) */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 border-t border-l border-[#E2DDD3]">
                            {[
                                { label: copy.view01, img: product.image },
                                {
                                    label: copy.view02,
                                    img: '/images/products/giles-studio-01-mpb-nani-35-50.webp',
                                },
                                {
                                    label: copy.view03,
                                    img: '/images/products/giles-studio-04-viadrus-conversion-kit.webp',
                                },
                                {
                                    label: copy.view04,
                                    img: '/images/products/giles-studio-06-megatherm-burner-kit.webp',
                                },
                            ].map((thumb, idx) => (
                                <div
                                    key={thumb.label}
                                    className={`border-r border-b border-[#E2DDD3] bg-[#EEEBE4] p-2.5 flex flex-col items-center gap-1.5 rounded-none ${
                                        idx === 0 ? 'ring-2 ring-inset ring-[#11161B]' : ''
                                    }`}
                                >
                                    <div className="h-14 w-full flex items-center justify-center bg-[#EEEBE4] p-1.5">
                                        <img
                                            src={assetUrl(thumb.img)}
                                            alt={thumb.label}
                                            className="max-h-full max-w-full object-contain mix-blend-multiply"
                                        />
                                    </div>
                                    <span className="text-xs font-bold text-[#11161B] text-center leading-tight">
                                        {thumb.label}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* Datasheet & 2D Blueprint Bar */}
                        <div className="border border-[#E2DDD3] bg-white p-4 rounded-none flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <span className="bg-[#11161B] text-white tabular-nums text-xs font-bold px-2.5 py-1">
                                    PDF
                                </span>
                                <div>
                                    <p className="text-xs sm:text-sm font-extrabold text-[#11161B]">
                                        {copy.datasheetTitle(product.sku)}
                                    </p>
                                    <p className="text-xs text-[#5B6470]">
                                        {copy.datasheetSubtitle}
                                    </p>
                                </div>
                            </div>
                            <Link
                                href={`/${locale}/products/${product.id}/datasheet`}
                                data-testid="pdp-datasheet-link"
                                className="inline-flex items-center gap-1.5 rounded-none bg-[#11161B] hover:bg-[#C2410C] px-4 py-2 text-xs font-bold text-white transition-colors whitespace-nowrap"
                            >
                                <FileText className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                                <span>{copy.datasheetCta}</span>
                            </Link>
                        </div>
                    </div>

                    {/* Right 6 columns: SKU / EAN / Gamintojas Header + 3-Spec Strip + Dual Pricing Box + Compatibility Check */}
                    <div className="lg:col-span-6 space-y-5">
                        {/* SKU / EAN / Gamintojas Header */}
                        <div className="space-y-2.5">
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#5B6470]">
                                <span>
                                    {copy.manufacturerLabel}{' '}
                                    <strong className="font-extrabold text-[#11161B]">
                                        {brandInfo.name}
                                    </strong>
                                </span>
                                <span className="inline-flex items-center gap-1 text-[#11161B] font-bold">
                                    {loc === 'lt' ? (
                                        <CopySkuButton sku={product.sku} />
                                    ) : (
                                        <LocalizedCopySkuButton sku={product.sku} locale={loc} />
                                    )}
                                </span>
                                <span className="tabular-nums">
                                    EAN: <strong className="text-[#11161B]">{eanCode}</strong>
                                </span>
                            </div>

                            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#11161B] leading-tight">
                                {displayPageTitle}
                            </h1>

                            <p className="text-sm text-[#5B6470] leading-relaxed">
                                {(() => {
                                    const excerpt = localizedHook.slice(0, 160);
                                    return loc === 'lt' ? formatLtDecimalCommas(excerpt) : excerpt;
                                })()}
                            </p>
                        </div>

                        {/* Artboard #5 3-Cell Hairline Technical Strip */}
                        <div className="grid grid-cols-3 border-t border-l border-[#E2DDD3]">
                            <div className="border-r border-b border-[#E2DDD3] bg-white p-3.5 rounded-none overflow-hidden min-w-0">
                                <span className="block text-xs text-[#5B6470]">
                                    {copy.stripParamLabel}
                                </span>
                                <span className="block text-xs sm:text-sm font-extrabold text-[#11161B] mt-0.5 leading-snug break-words">
                                    {techChips[0] || 'EN 12828'}
                                </span>
                            </div>
                            <div className="border-r border-b border-[#E2DDD3] bg-white p-3.5 rounded-none overflow-hidden min-w-0">
                                <span className="block text-xs text-[#5B6470]">
                                    {copy.stripCategoryLabel}
                                </span>
                                <span className="block text-xs sm:text-sm font-extrabold text-[#11161B] mt-0.5 leading-snug break-words">
                                    {localizedCategory}
                                </span>
                            </div>
                            <div className="border-r border-b border-[#E2DDD3] bg-white p-3.5 rounded-none overflow-hidden min-w-0">
                                <span className="block text-xs text-[#5B6470]">
                                    {copy.stripStandardLabel}
                                </span>
                                <span className="block text-xs sm:text-sm font-extrabold text-[#11161B] mt-0.5 leading-snug break-words">
                                    {techChips[1] || 'ISO 9001'}
                                </span>
                            </div>
                        </div>

                        {/* Dual Pricing Box (Mažmeninė Su/Be PVM + Montuotojo B2B Didmeninė Kaina) */}
                        <div
                            data-testid="pdp-dual-pricing-box"
                            className="border border-[#E2DDD3] bg-white rounded-none overflow-hidden"
                        >
                            {/* Retail Su PVM / Be PVM */}
                            <div className="p-5 space-y-4">
                                <div className="flex flex-wrap items-baseline justify-between gap-4">
                                    <div>
                                        <span className="block text-xs font-bold text-[#5B6470] mb-1">
                                            {copy.retailPriceLabel}
                                        </span>
                                        {grossEuros > 0 ? (
                                            <div className="flex items-baseline gap-2.5 flex-wrap">
                                                <span className="text-3xl sm:text-4xl font-extrabold text-[#11161B] tabular-nums">
                                                    {formatEurAmount(grossEuros)} €
                                                </span>
                                                <span className="text-sm font-semibold text-[#5B6470]">
                                                    {copy.vatGrossSuffix}
                                                </span>
                                            </div>
                                        ) : (
                                            <PriceDisplay
                                                priceCents={product.priceCents}
                                                vatRate={product.vatRate}
                                                compareAtCents={
                                                    product.compareAtPrice != null
                                                        ? Math.round(product.compareAtPrice * 100)
                                                        : null
                                                }
                                                size="lg"
                                            />
                                        )}
                                        {netEuros > 0 && (
                                            <span className="block text-xs sm:text-sm text-[#5B6470] mt-1 tabular-nums">
                                                {formatEurAmount(netEuros)} {copy.vatNetSuffix}
                                            </span>
                                        )}
                                    </div>

                                    <div className="text-right">
                                        {purch.soldOut ? (
                                            <span className="inline-block bg-[#B91C1C] text-white px-2.5 py-1 text-xs font-bold">
                                                {copy.soldOut}
                                            </span>
                                        ) : (
                                            <div className="space-y-0.5">
                                                <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#157A3B]">
                                                    <span className="w-2 h-2 rounded-full bg-[#157A3B]" />
                                                    {pdpShortStockBadge}
                                                </span>
                                                <span className="block text-xs text-[#5B6470]">
                                                    {copy.stockSourcePrefix} {pdpStockSource}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {product.priceCents == null || product.priceCents <= 0 ? (
                                    <Link
                                        href={`/${locale}/uzklausa?kodas=${encodeURIComponent(product.sku)}`}
                                        className="inline-flex h-12 items-center justify-center rounded-none bg-[#C2410C] hover:bg-[#9A3412] px-8 text-sm font-bold text-white transition-colors whitespace-nowrap"
                                    >
                                        {copy.priceOnRequestRfq}
                                    </Link>
                                ) : (
                                    <ProductPurchase product={product} />
                                )}
                            </div>

                        {/* Montuotojo ir komplektavimo pasiūlymas (pdp-wishlist-toggle in ProductPurchase above) */}
                        <div className="border-t border-[#E2DDD3] bg-[#FBEADF] px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div className="space-y-0.5">
                                    <span className="text-xs font-extrabold text-[#5A1F05] block">
                                        {copy.b2bPriceHeading}
                                    </span>
                                    <span className="text-xs text-[#6E2A0A] block">
                                        {copy.b2bPriceSubtitle}
                                    </span>
                                </div>
                                <Link
                                    href={`/${locale}/b2b`}
                                    className="inline-flex items-center justify-center rounded-none bg-[#11161B] hover:bg-[#C2410C] px-4 py-2 text-xs font-bold text-white whitespace-nowrap shrink-0 transition-colors"
                                >
                                    {copy.b2bLoginCta}
                                </Link>
                            </div>
                        </div>

                        {/* Suderinamumo patikra („Tinka katilams ir sistemoms“) + 1-Click Vytautas AI Consultation */}
                        <div
                            data-testid="pdp-boiler-compatibility-box"
                            className="border border-[#2C3742] bg-[#11161B] text-[#F5F3EE] p-5 rounded-none space-y-3.5"
                        >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#2C3742] pb-2.5">
                                <div>
                                    <span className="tabular-nums text-xs font-bold text-[#FF8A3D] block">
                                        {copy.compatCheckBadge}
                                    </span>
                                    <h2 className="text-base font-extrabold text-white mt-0.5">
                                        {copy.compatCheckHeading}
                                    </h2>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-1.5">
                                {uxGuide.compatibleSystemChips.map((sys) => (
                                    <span
                                        key={sys}
                                        className="border border-[#2C3742] bg-[#1B232C] px-2.5 py-1 text-xs font-semibold text-[#C9D0D8] rounded-none"
                                    >
                                        {cleanDash(sys)}
                                    </span>
                                ))}
                            </div>

                            <p
                                data-testid="pdp-compatibility-note"
                                className="text-xs text-[#C9D0D8] leading-relaxed border-t border-[#2C3742] pt-2.5"
                            >
                                {cleanDash(uxGuide.compatibilityNote)}
                            </p>

                            {/* Explicit Source-Provenance & „Pasitikslinkite“ Block (req_261030064151_1270 & req_261030072802_61e2) */}
                            <div
                                data-testid="compatibility-source-provenance"
                                className="border-t border-[#2C3742] pt-2.5 space-y-1.5 text-xs text-[#C9D0D8]"
                            >
                                <p className="font-bold text-[#FF8A3D]">
                                    {/danfoss|imi|heimeier|pneumatex|herz|haier|gorenje|megatherm/i.test(
                                        `${brandInfo.name} ${product.name} ${product.sku}`,
                                    )
                                        ? 'Gamintojo dokumentu patvirtintas suderinamumas (vieno gamintojo sistemos ribose) · Kitiems mazgams: Suderinamumą pasitikslinkite su mūsų inžinieriumi (+370 611 19158) arba pagal įrenginio techninį pasą'
                                        : 'Suderinamumą pasitikslinkite su mūsų inžinieriumi (+370 611 19158) arba pagal įrenginio techninį pasą'}
                                </p>
                                <p className="leading-relaxed">
                                    {loc === 'lt'
                                        ? 'Šaltinis: Gamintojo techninis katalogas (Danfoss / IMI Hydronic / HERZ / Haier / Gorenje 2025–2026) ir LST EN 215 / EN 12828 / EN 303-5 standartas'
                                        : COMPATIBILITY_SOURCE_PROVENANCE_COPY[loc].standardSource}
                                </p>
                                <p className="leading-relaxed text-[#F5F3EE]">
                                    {loc === 'lt'
                                        ? 'Patikslinimo pastaba: Kieto kuro katilų durelių angos ir flanšo matmenys priklauso nuo katilo pagaminimo metų ir kW modifikacijos – prieš užsakant durelių perdarymo komplektą ar degiklį, tikslius matmenis pasitikslinkite pagal katilo techninį pasą arba su „Gilės inžinerijos“ inžinieriumi (+370 611 19158).'
                                        : COMPATIBILITY_SOURCE_PROVENANCE_COPY[loc].retrofitCaveat}
                                </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-3 pt-1">
                                <LocalizedVytautasConsultButton
                                    locale={loc}
                                    prompt={copy.compatPrompt(localizedTitle, product.sku, brandInfo.name)}
                                    title={`${localizedTitle} (${product.sku})`}
                                    summary={copy.compatSummary(brandInfo.name)}
                                />
                                <Link
                                    href={`/${locale}/vedlys`}
                                    className="inline-flex items-center justify-center rounded-none border border-[#3A4652] bg-transparent hover:border-[#FF8A3D] px-4 py-2 text-xs font-bold text-white whitespace-nowrap transition-colors"
                                >
                                    {copy.wizardCta}
                                </Link>
                            </div>
                        </div>

                        {/* Artboard #5 Guarantee & Delivery Facts */}
                        <ul className="border-t border-[#E2DDD3] pt-4 space-y-2 text-xs sm:text-sm text-[#2A323B]">
                            <li className="flex items-center gap-2.5">
                                <CheckCircle2
                                    className="w-4 h-4 text-[#157A3B] shrink-0"
                                    aria-hidden="true"
                                />
                                <span>
                                    <strong className="text-[#157A3B]">{copy.guaranteeStockBold}</strong>
                                    {copy.guaranteeStockRest}
                                </span>
                            </li>
                            <li className="flex items-center gap-2.5">
                                <ShieldCheck
                                    className="w-4 h-4 text-[#11161B] shrink-0"
                                    aria-hidden="true"
                                />
                                <span>
                                    {copy.guaranteeSupplyPrefix}
                                    <strong>{brandInfo.name}</strong>
                                    {copy.guaranteeSupplySuffix}
                                </span>
                            </li>
                            <li className="flex items-center gap-2.5">
                                <Wrench
                                    className="w-4 h-4 text-[#C2410C] shrink-0"
                                    aria-hidden="true"
                                />
                                <span>{copy.guaranteeInstallText}</span>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* SECTION 1: Komplektacijos sudėtis ir mazgo schema (Exploded Spare-Parts & Compatibility Block) */}
                <section
                    data-testid="pdp-exploded-kit-block"
                    aria-label={copy.explodedSectionAria}
                    className="border border-[#E2DDD3] bg-white rounded-none overflow-hidden"
                >
                    <div className="border-b border-[#E2DDD3] bg-[#11161B] text-white px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                            <span className="tabular-nums text-xs font-bold text-[#FF8A3D] block">
                                {copy.explodedBadge(product.sku)}
                            </span>
                            <h2 className="text-lg sm:text-xl font-extrabold text-white mt-0.5">
                                {copy.explodedHeading}
                            </h2>
                        </div>
                        <span className="text-xs text-[#C9D0D8]">
                            {copy.nodeTypeLabel}{' '}
                            <strong className="text-white">{cleanDash(uxGuide.subtypeTitle)}</strong>
                        </span>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-[#E2DDD3]">
                        {/* Left: Kas komplekte (What's in the box) */}
                        <div className="p-6 space-y-4">
                            <h3 className="text-sm font-extrabold text-[#11161B]">
                                {copy.whatYouGetHeading}
                            </h3>
                            <ul className="divide-y divide-[#E2DDD3] border-t border-b border-[#E2DDD3] text-xs sm:text-sm">
                                {uxGuide.whatYouGet.map((item, idx) => (
                                    <li
                                        key={idx}
                                        className="py-3 flex items-start justify-between gap-4"
                                    >
                                        <span className="flex items-start gap-2.5 text-[#11161B] font-medium">
                                            <span className="tabular-nums text-xs font-bold text-[#C2410C] mt-0.5">
                                                0{idx + 1}
                                            </span>
                                            <span>{cleanDash(item)}</span>
                                        </span>
                                        <span className="text-xs font-bold text-[#157A3B] shrink-0">
                                            {copy.includedBadge}
                                        </span>
                                    </li>
                                ))}
                            </ul>

                            {/* Interactive 7-Family Technical CAD Blueprint (pdp-exploded-cad-blueprint) */}
                            <PdpCadExplodedSchematic
                                sku={product.sku}
                                productTitle={cleanNameLt}
                                categoryName={product.category}
                                subCategoryName={localizedCategory}
                                brandName={brandInfo.name}
                                locale={loc}
                            />
                        </div>

                        {/* Right: Ko prireiks montavimui + 4 montavimo žingsniai */}
                        <div className="p-6 bg-[#F5F3EE] space-y-4">
                            <h3 className="text-sm font-extrabold text-[#11161B]">
                                {copy.whatYouNeedHeading}
                            </h3>
                            <ul className="space-y-2 text-xs sm:text-sm text-[#2A323B]">
                                {uxGuide.whatYouNeed.map((item, idx) => (
                                    <li key={idx} className="flex items-start gap-2">
                                        <span className="tabular-nums text-xs font-bold text-[#C2410C] mt-0.5">
                                            +
                                        </span>
                                        <span>{cleanDash(item)}</span>
                                    </li>
                                ))}
                            </ul>

                            <ol className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-[#E2DDD3]">
                                {uxGuide.steps.map((step, idx) => (
                                    <li
                                        key={idx}
                                        className="bg-white border border-[#E2DDD3] p-3.5 rounded-none space-y-1"
                                    >
                                        <span className="tabular-nums text-xs font-bold text-[#C2410C] block">
                                            0{idx + 1} · {cleanDash(step.title)}
                                        </span>
                                        <p className="text-xs text-[#5B6470] leading-relaxed">
                                            {cleanDash(step.detail)}
                                        </p>
                                    </li>
                                ))}
                            </ol>
                        </div>
                    </div>
                </section>

                {/* SECTION 2: Techniniai duomenys (Artboard #5 Spec Table) + Savikontrolė */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    <section
                        aria-label={copy.specsSectionAria}
                        className="lg:col-span-7 border border-[#E2DDD3] bg-white rounded-none overflow-hidden"
                    >
                        <div className="border-b border-[#E2DDD3] bg-[#F5F3EE] px-5 py-3.5 flex items-center justify-between">
                            <h2 className="text-sm sm:text-base font-extrabold text-[#11161B]">
                                {copy.specsHeading(product.sku)}
                            </h2>
                            <span className="text-xs font-semibold text-[#5B6470]">
                                {brandInfo.name}
                            </span>
                        </div>
                        {parsed.specRows.length > 0 ? (
                            <dl className="divide-y divide-[#E2DDD3] text-xs sm:text-sm">
                                {parsed.specRows.map((row) => (
                                    <div
                                        key={`${row.param}-${row.value}`}
                                        className="grid grid-cols-12 gap-2 px-5 py-3 hover:bg-[#FAF8F5]"
                                    >
                                        <dt className="col-span-6 text-[#5B6470] font-medium break-words">
                                            {cleanDash(localizeSpecKey(row.param, loc))}
                                        </dt>
                                        <dd className="col-span-6 text-right font-bold text-[#11161B] tabular-nums break-words">
                                            {cleanDash(localizeSpecValue(row.value, loc))}
                                        </dd>
                                    </div>
                                ))}
                            </dl>
                        ) : (
                            <div className="p-5 text-sm text-[#5B6470]">
                                {loc === 'lt' ? formatLtDecimalCommas(cleanDash(localizedHook)) : cleanDash(localizedHook)}
                            </div>
                        )}
                    </section>

                    <section
                        aria-label={copy.selfCheckAria}
                        className="lg:col-span-5 border border-[#E2DDD3] bg-white p-6 rounded-none space-y-4"
                    >
                        <span className="tabular-nums text-xs font-bold text-[#C2410C] block">
                            {copy.selfCheckEyebrow}
                        </span>
                        <h2 className="text-base font-extrabold text-[#11161B]">
                            {copy.selfCheckHeading}
                        </h2>
                        <ul className="space-y-2.5 text-xs sm:text-sm text-[#2A323B]">
                            {uxGuide.selfCheck.map((checkItem, idx) => (
                                <li
                                    key={idx}
                                    className="flex items-start gap-2.5 border border-[#E2DDD3] bg-[#F5F3EE] p-3 rounded-none"
                                >
                                    <span className="tabular-nums text-xs font-bold text-[#C2410C] mt-0.5">
                                        0{idx + 1}
                                    </span>
                                    <span className="leading-relaxed">{cleanDash(checkItem)}</span>
                                </li>
                            ))}
                        </ul>
                        <div className="border-t border-[#E2DDD3] pt-3 text-xs text-[#5B6470] space-y-1">
                            <p>
                                <strong className="text-[#11161B]">{copy.proTipLabel}</strong>{' '}
                                {cleanDash(uxGuide.proTip)}
                            </p>
                        </div>
                    </section>
                </div>

                <script
                    type="application/ld+json"
                    nonce={nonce}
                    dangerouslySetInnerHTML={{
                        __html: escapeJsonLdForScript(JSON.stringify(faqAndComparison.jsonLd)),
                    }}
                />

                {/* SECTION 3: Inline Vytautas Compatibility & Node Assembly Section */}
                {compatibility && localizedCompat && (
                    <section
                        aria-label={copy.vytautasCompatAria}
                        className="border border-[#E2DDD3] bg-white rounded-none overflow-hidden"
                    >
                        <div className="bg-[#F5F3EE] px-6 py-4 border-b border-[#E2DDD3] flex flex-col md:flex-row md:items-center justify-between gap-3">
                            <div>
                                <span className="tabular-nums text-xs font-bold text-[#C2410C] block">
                                    {copy.vytautasCompatEyebrow}
                                </span>
                                <h2 className="text-lg sm:text-xl font-extrabold text-[#11161B] mt-0.5">
                                    {copy.vytautasCompatHeading}
                                </h2>
                            </div>
                            <span className="inline-flex items-center gap-2 self-start md:self-auto px-3 py-1 border border-[#D5CFC3] bg-white text-xs text-[#11161B] rounded-none">
                                <span>{copy.nodeRoleLabel}</span>
                                <strong>{cleanDash(localizedCompat.roleLabel)}</strong>
                            </span>
                        </div>

                        <div className="p-6 space-y-5">
                            <div className="border border-[#E2DDD3] bg-[#F5F3EE] p-4 rounded-none">
                                <p className="text-xs font-bold text-[#11161B] mb-1">
                                    {copy.vytautasCommentTitle(product.sku)}
                                </p>
                                <p className="text-sm text-[#2A323B] leading-relaxed">
                                    {cleanDash(localizedCompat.bundleExplanation)}
                                </p>
                            </div>

                            {compatibility.compatibleProducts.length > 0 && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border-t border-l border-[#E2DDD3]">
                                    {compatibility.compatibleProducts.map((cp) => {
                                        const cpBrand = resolveProductBrandInfo({
                                            title: cp.name,
                                            sku: cp.sku,
                                        });
                                        const cpCleanNameLt = cleanDash(
                                            formatCleanCatalogProductTitle(
                                                cp.name,
                                                cp.sku,
                                                cpBrand.name,
                                            ),
                                        );
                                        const cpCleanName = localizeProductTitle(cpCleanNameLt, loc);
                                        const cpImage = resolveProductImageUrl({
                                            sku: cp.sku,
                                            title: cpCleanNameLt,
                                            brand: cpBrand.name,
                                        });
                                        const cpReason = localizePairingReason(
                                            cp.pairingReasonLt,
                                            cp.relationType,
                                            loc,
                                        );
                                        return (
                                            <article
                                                key={cp.id}
                                                className="flex flex-col justify-between border-r border-b border-[#E2DDD3] bg-white p-4 rounded-none"
                                            >
                                                <div className="space-y-2.5">
                                                    <div className="flex items-center justify-between gap-2 text-xs">
                                                        <span className="font-bold text-[#C2410C]">
                                                            {cp.relationType === 'essential_pair'
                                                                ? copy.relationEssential
                                                                : cp.relationType === 'system_completion'
                                                                  ? copy.relationCompletion
                                                                  : copy.relationAlternative}
                                                        </span>
                                                        <span className="tabular-nums font-bold text-[#5B6470]">
                                                            {cp.sku}
                                                        </span>
                                                    </div>

                                                    <Link
                                                        href={`/${locale}/products/${cp.slug || cp.id}`}
                                                        className="block aspect-square w-full bg-[#EEEBE4] p-3 flex items-center justify-center rounded-none"
                                                    >
                                                        <img
                                                            src={assetUrl(cpImage)}
                                                            alt={cpCleanName}
                                                            className="max-h-full max-w-full object-contain mix-blend-multiply"
                                                        />
                                                    </Link>

                                                    <Link
                                                        href={`/${locale}/products/${cp.slug || cp.id}`}
                                                        className="text-sm font-bold text-[#11161B] hover:text-[#C2410C] leading-snug block"
                                                    >
                                                        {cpCleanName}
                                                    </Link>
                                                    <p className="text-xs text-[#5B6470] leading-relaxed">
                                                        {cleanDash(cpReason)}
                                                    </p>
                                                </div>

                                                <div className="pt-3 border-t border-[#E2DDD3] mt-3 flex items-center justify-between gap-2">
                                                    <span className="text-base font-extrabold text-[#11161B] tabular-nums">
                                                        {cp.price > 0
                                                            ? formatEur(cp.price)
                                                            : copy.priceOnRequestShort}
                                                    </span>
                                                    <Link
                                                        href={`/${locale}/products/${cp.slug || cp.id}`}
                                                        className="inline-flex items-center rounded-none bg-[#11161B] hover:bg-[#C2410C] px-3 py-1.5 text-xs font-bold text-white transition-colors whitespace-nowrap"
                                                    >
                                                        {copy.viewProductCta}
                                                    </Link>
                                                </div>
                                            </article>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </section>
                )}

                {/* SECTION 4: Palyginimas ir DUK */}
                <section
                    aria-label={copy.faqSectionAria}
                    className="border border-[#E2DDD3] bg-white p-6 rounded-none space-y-5"
                >
                    <h2 className="text-lg font-extrabold text-[#11161B] border-b border-[#E2DDD3] pb-3">
                        {copy.faqHeading(localizedTitle, product.sku)}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {localizedFaqItems.map((faq) => (
                            <article
                                key={faq.question}
                                className="border border-[#E2DDD3] bg-[#F5F3EE] p-4 rounded-none space-y-1.5"
                            >
                                <h3 className="text-sm font-bold text-[#11161B] leading-snug">
                                    {cleanDash(faq.question)}
                                </h3>
                                <p className="text-xs sm:text-sm text-[#2A323B] leading-relaxed">
                                    {cleanDash(faq.answer)}
                                </p>
                            </article>
                        ))}
                    </div>
                </section>

                {/* SECTION 5: Related Products (Artboard #5 Flush Hairline Row) */}
                {related.length > 0 && (
                    <section className="space-y-4">
                        <div className="flex items-end justify-between gap-4 flex-wrap">
                            <h2 className="text-xl sm:text-2xl font-extrabold text-[#11161B]">
                                {copy.boughtTogetherHeading}
                            </h2>
                            <Link
                                href={`/${locale}/products`}
                                className="text-xs font-bold text-[#C2410C] hover:underline whitespace-nowrap"
                            >
                                {copy.fullCategoryCta}
                            </Link>
                        </div>

                        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border-t border-l border-[#E2DDD3]">
                            {related.map((r) => {
                                const rBrand = resolveProductBrandInfo({
                                    brand: r.brand,
                                    title: r.name,
                                    sku: r.sku,
                                    description: r.description,
                                });
                                const rCleanNameLt = cleanDash(
                                    formatCleanCatalogProductTitle(
                                        r.name,
                                        r.sku,
                                        rBrand.name,
                                    ),
                                );
                                const rCleanName = localizeProductTitle(rCleanNameLt, loc);
                                r.image = resolveProductImageUrl({
                                    sku: r.sku,
                                    title: rCleanNameLt,
                                    brand: rBrand.name,
                                    category: r.category,
                                    imageUrl: r.image,
                                });
                                return (
                                    <li key={r.id} className="flex">
                                        <Link
                                            href={`/${locale}/products/${r.slug || r.id}`}
                                            className="group flex w-full flex-col justify-between border-r border-b border-[#E2DDD3] bg-white p-4 rounded-none hover:bg-[#FAF8F5] transition-colors"
                                        >
                                            <div className="space-y-2.5">
                                                <div className="flex items-center justify-between gap-2 text-xs">
                                                    <span className="font-bold text-[#157A3B]">
                                                        {copy.inStockShort}
                                                    </span>
                                                    <span className="tabular-nums font-bold text-[#5B6470]">
                                                        {r.sku}
                                                    </span>
                                                </div>
                                                <div className="relative aspect-square bg-[#EEEBE4] p-4 flex items-center justify-center overflow-hidden rounded-none">
                                                    <img
                                                        src={assetUrl(r.image)}
                                                        alt={rCleanName}
                                                        className="h-full w-full object-contain transition-transform duration-150 group-hover:scale-105"
                                                    />
                                                </div>
                                                <p className="text-sm font-bold leading-snug text-[#11161B] group-hover:text-[#C2410C] line-clamp-2">
                                                    {rCleanName}
                                                </p>
                                            </div>
                                            <div className="pt-3 mt-3 border-t border-[#E2DDD3]">
                                                <PriceDisplay
                                                    priceCents={r.priceCents}
                                                    vatRate={r.vatRate}
                                                    size="sm"
                                                />
                                            </div>
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    </section>
                )}
            </div>
        </main>
    );
}
