'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { usePathname as useNextPathname } from 'next/navigation';
import { useLocale } from 'next-intl';
import { Link, usePathname } from '../i18n/navigation';
import { resolveAppLocale } from '../i18n/storefront-ui-copy';
import type { AppLocale } from '../i18n/routing';
import { apiUrl, assetUrl } from '../lib/api';
import { resolveProductImageUrl, resolveBrandLogo } from '../lib/product-visuals';
import type {
    ClientSystemMap,
    ClientTelemetry,
    VytautasHistoryTurn,
} from '../lib/vytautas-consultant';
import { useCartStore } from '../store/cart';
import { useStorefrontConfig } from './storefront-config-provider';
import {
    getCustomerJourney,
    recordSearchQuery,
    recordViewedProduct,
    syncCartSnapshot,
    buildChatJourneyContext,
    JOURNEY_UPDATE_EVENT,
    OPEN_VYTAUTAS_EVENT,
    type CustomerJourneyState,
    type OpenVytautasPayload,
} from '../lib/customer-journey-tracker';
import {
    Wrench,
    X,
    Send,
    CheckCircle2,
    ArrowRight,
    Flame,
    Gauge,
    Layers,
    Thermometer,
    Search,
    ShoppingBag,
    Plus,
} from 'lucide-react';

interface CompatibleItem {
    id: string;
    sku: string;
    name: string;
    price: number;
    priceNet: number;
    url: string;
    image: string;
    pairingReasonLt: string;
    relationType: 'essential_pair' | 'system_completion' | 'alternative';
    attributes?: {
        brand?: string;
        nominalDiameter?: string | null;
        threadLabel?: string | null;
        connectionStandard?: string | null;
        roleLabelLt?: string;
    };
}

interface CompatibilityPayload {
    focalProduct: {
        id: string;
        sku: string;
        name: string;
        price: number;
        priceNet: number;
        url: string;
        image?: string;
        attributes: {
            brand: string;
            nominalDiameter: string | null;
            threadLabel: string | null;
            connectionStandard?: string | null;
            pressureRating: string | null;
            roleLabelLt: string;
        };
    } | null;
    compatibleProducts: CompatibleItem[];
    bundleExplanation: string;
    installationSteps: string[];
    vytautasPitch: string;
}

interface ChatSuggestedProduct {
    id: string;
    sku?: string | null;
    name: string;
    title?: string;
    price: number;
    formattedPrice?: string;
    url: string;
    image?: string;
    imageUrl?: string;
    brandName?: string;
    brandLogoUrl?: string;
    applicationRole?: string;
    keySpec?: string;
}

interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
    text?: string;
    suggestedProducts?: ChatSuggestedProduct[];
    quickReplies?: string[];
}

interface VytautasLocaleCopy {
    launcherLabel: (name: string) => string;
    launcherAria: (name: string) => string;
    headerTitle: (name: string) => string;
    headerRoleDefault: string;
    headerRolePdp: string;
    closeAria: string;
    defaultGreeting: (name: string) => string;
    quickReplies: [string, string, string, string, string];
    memoryTitle: (name: string) => string;
    calcPrefix: string;
    showProductsSuffix: string;
    searchedPrefix: string;
    cartCheckLabel: (count: number) => string;
    viewedPrefix: string;
    tabCompatPdp: string;
    tabCompatHome: string;
    tabChat: (name: string, count: number) => string;
    skuPlaceholder: string;
    findBtn: string;
    checkingCompat: string;
    whatSelectingToday: string;
    fourWizardsBadge: string;
    visualCards: Array<{
        href: string;
        icon: typeof Flame;
        title: string;
        desc: string;
    }>;
    uploadBoqCta: string;
    compatiblePartsHeading: (count: number) => string;
    openItemCta: string;
    systemMapTitle: string;
    nodeLabelPrefix: string;
    powerAreaLabelPrefix: string;
    connectionLabelPrefix: string;
    defaultNodeLabel: string;
    defaultPowerOrArea: string;
    defaultConnection: string;
    defaultStageLabel: string;
    leaveEmailCta: string;
    closeToggle: string;
    openToggle: string;
    leadSentHeading: (ref: string) => string;
    leadSentBody: string;
    leadFormIntro: string;
    leadNamePlaceholder: string;
    leadCityPlaceholder: string;
    leadEmailPlaceholder: string;
    leadSubmitSending: string;
    leadSubmitBtn: string;
    leadValidationError: string;
    leadSubmitError: string;
    leadNetworkError: string;
    youLabel: string;
    recommendedProductsHeading: (count: number) => string;
    inStockBadge: string;
    openProductBtn: string;
    addToCartBtn: string;
    checkingMessage: (name: string) => string;
    chatInputPlaceholder: string;
    sendAria: (name: string) => string;
    fallbackReply: string;
    connectionErrorReply: string;
    compatEssential: (conn?: string | null) => string;
    compatCompletion: (conn?: string | null) => string;
    compatAlternative: (conn?: string | null) => string;
}

const VYTAUTAS_I18N: Record<AppLocale, VytautasLocaleCopy> = {
    lt: {
        launcherLabel: (name) => (name === 'Vytautas' ? 'Konsultantas Vytautas' : `Konsultantas ${name}`),
        launcherAria: (name) => `Atidaryti konsultantą ${name}`,
        headerTitle: (name) => `Konsultantas ${name}`,
        headerRoleDefault: 'Vyriausiasis inžinierius · Atsako akimirksniu',
        headerRolePdp: 'Tiesioginis suderinamų dalių parinkimas šiai prekei',
        closeAria: 'Uždaryti konsultantą',
        defaultGreeting: (name) => `Sveiki! Esu ${name}. Kuo galiu padėti šiandien?`,
        quickReplies: [
            'Haier šilumos siurblys + Gorenje ZV talpa namui',
            'Radiatoriaus prijungimas ir termostatinis valdymas',
            'Granulinės / kieto kuro katilinės komplektas (20–25 kW)',
            'Grindinio šildymo kolektorius ir pavaros (~100 m²)',
            'Boileris karštam vandeniui (Dražice / Gorenje / Haier)',
        ],
        memoryTitle: (name) =>
            name === 'Vytautas'
                ? 'Jūsų paieškos ir skaičiavimų atmintis (Vytautas mato, ką renkate)'
                : `${name} mato jūsų paiešką ir skaičiavimus`,
        calcPrefix: 'Skaičiuoklė:',
        showProductsSuffix: '· Parodyti prekes',
        searchedPrefix: 'Ieškota:',
        cartCheckLabel: (c) => `Krepšelyje: ${c} vnt. · Patikrinti suderinamumą`,
        viewedPrefix: 'Žiūrėta:',
        tabCompatPdp: 'Su kuo dera',
        tabCompatHome: 'Ką šiandien renkame?',
        tabChat: (name, count) => `Klausimas ${name === 'Vytautas' ? 'Vytautui' : name} (${count})`,
        skuPlaceholder: 'Įrašykite prekės kodą arba klausimą, pvz.: kokia galvutė tinka RA-N vožtuvui?',
        findBtn: 'Rasti',
        checkingCompat: 'Tikrinamos suderinamos dalys kataloge...',
        whatSelectingToday: 'Ką šiandien renkame?',
        fourWizardsBadge: '4 parinkimo vedliai',
        visualCards: [
            {
                href: '/skaiciuokle?tab=boiler',
                icon: Flame,
                title: 'Katilo ir boilerio parinkimas',
                desc: 'Tiksli šilumos galia (kW) ir boilerio talpa pagal jūsų būsto plotą.',
            },
            {
                href: '/skaiciuokle?tab=vessel',
                icon: Gauge,
                title: 'Plėtimosi indo skaičiuoklė',
                desc: 'Tinkamas Statico / Aquapresso tūris ir pradinis oro pagalvės slėgis.',
            },
            {
                href: '/skaiciuokle?tab=manifold',
                icon: Layers,
                title: 'Grindinio šildymo kolektorius',
                desc: 'Kontūrų skaičius (2–12), vamzdžio ilgis ir Dynacon Eclipse parinkimas.',
            },
            {
                href: '/skaiciuokle?tab=radiator',
                icon: Thermometer,
                title: 'Radiatoriaus galvutės ir vožtuvai',
                desc: 'Suderinamos galvutės (RA Click / M30×1,5), vožtuvai ir 50 mm H-blokai.',
            },
        ],
        uploadBoqCta: 'Turite sąmatą? Įkelkite sąrašą (/uzklausa) →',
        compatiblePartsHeading: (c) => `Su šia preke derančios dalys (${c}):`,
        openItemCta: 'Atidaryti →',
        systemMapTitle: 'Kliento Sistemos Žemėlapis',
        nodeLabelPrefix: '1. Mazgas: ',
        powerAreaLabelPrefix: '2. Galia/Plotas: ',
        connectionLabelPrefix: '3. Pajungimas: ',
        defaultNodeLabel: 'ŠVOK mazgo diagnostika',
        defaultPowerOrArea: 'Pagal patalpos plotą (m²) ir galią (kW)',
        defaultConnection: 'Suderinama srieginė jungtis (DN15–DN32)',
        defaultStageLabel: '1/2 Poreikio diagnostika',
        leaveEmailCta: 'Palikti el. paštą inžinieriui / Gauti sąmatą',
        closeToggle: 'Uždaryti',
        openToggle: 'Atidaryti',
        leadSentHeading: (ref) => `Užklausa perduota AI asistentui (Nr. ${ref})`,
        leadSentBody: 'UAB „Gilės inžinerija“ komanda peržiūrės jūsų mazgo žemėlapį ir susisieks su tikslia sąmata.',
        leadFormIntro: 'Palikite el. paštą – paruošime pilną mazgo sąmatą pagal jūsų sistemos žemėlapį:',
        leadNamePlaceholder: 'Vardas arba įmonė',
        leadCityPlaceholder: 'Miestas (pvz. Vilnius)',
        leadEmailPlaceholder: 'El. paštas (pvz. vardas@imone.lt)',
        leadSubmitSending: 'Siunčiama...',
        leadSubmitBtn: 'Gauti sąmatą',
        leadValidationError: 'Įveskite vardą ir el. pašto adresą.',
        leadSubmitError: 'Nepavyko išsiųsti užklausos. Bandykite dar kartą.',
        leadNetworkError: 'Ryšio klaida siunčiant užklausą.',
        youLabel: 'Jūs',
        recommendedProductsHeading: (c) => `Rekomenduojamos prekės jūsų sistemai (${c}):`,
        inStockBadge: 'Sandėlyje',
        openProductBtn: 'Atidaryti prekę',
        addToCartBtn: 'Į krepšelį',
        checkingMessage: (name) => `${name} tikrina mazgo suderinamumą kataloge...`,
        chatInputPlaceholder: 'Įrašykite prekės kodą arba klausimą...',
        sendAria: (name) => `Siųsti žinutę ${name}`,
        fallbackReply: 'Prašome patikslinti klausimą – tuoj pat parinksiu tinkamą sprendimą.',
        connectionErrorReply: 'Laikinas ryšio trikdis jungiantis prie konsultanto. Bandykite išsiųsti žinutę dar kartą.',
        compatEssential: (conn) => (conn ? `Tinka tiesiogiai (${conn})` : 'Būtina pora šiam mazgui'),
        compatCompletion: (conn) => (conn ? `Mazgo papildymas (${conn})` : 'Pilnam sumontavimui'),
        compatAlternative: (conn) => (conn ? `Suderinama alternatyva (${conn})` : 'Suderinama alternatyva'),
    },
    en: {
        launcherLabel: (name) => `Engineer ${name}`,
        launcherAria: (name) => `Open engineering consultant ${name}`,
        headerTitle: (name) => `Engineer ${name}`,
        headerRoleDefault: 'Chief HVAC Engineer · Instant Technical Support',
        headerRolePdp: 'Direct compatible parts matcher for this product',
        closeAria: 'Close consultant',
        defaultGreeting: (name) => `Hello! I'm ${name}, Gilės HVAC engineer. How can I help you today?`,
        quickReplies: [
            'Haier R290 heat pump + Gorenje ZV buffer tank for a house',
            'Radiator connection valves & thermostatic heads',
            'Pellet / solid-fuel boiler room kit (20–25 kW)',
            'Underfloor heating manifold & actuators (~100 m²)',
            'Domestic hot water cylinder (Dražice / Gorenje / Haier)',
        ],
        memoryTitle: (name) => `Your search & calculation memory (${name} sees your configuration)`,
        calcPrefix: 'Calculator:',
        showProductsSuffix: '· Show products',
        searchedPrefix: 'Searched:',
        cartCheckLabel: (c) => `In cart: ${c} pcs · Verify compatibility`,
        viewedPrefix: 'Viewed:',
        tabCompatPdp: 'Compatible Parts',
        tabCompatHome: 'What are we sizing?',
        tabChat: (name, count) => `Ask ${name} (${count})`,
        skuPlaceholder: 'Enter SKU code or question, e.g.: which head fits an RA-N valve?',
        findBtn: 'Find',
        checkingCompat: 'Checking compatible components in catalog...',
        whatSelectingToday: 'What are we sizing today?',
        fourWizardsBadge: '4 sizing wizards',
        visualCards: [
            {
                href: '/skaiciuokle?tab=boiler',
                icon: Flame,
                title: 'Boiler & DHW Cylinder Sizing',
                desc: 'Required heating output (kW) and hot-water tank volume for your building area.',
            },
            {
                href: '/skaiciuokle?tab=vessel',
                icon: Gauge,
                title: 'Expansion Vessel Calculator',
                desc: 'Exact Statico / Aquapresso volume and pre-charge pressure for your system.',
            },
            {
                href: '/skaiciuokle?tab=manifold',
                icon: Layers,
                title: 'Underfloor Heating Manifold',
                desc: 'Loop count (2–12), pipe length, and Dynacon Eclipse manifold selection.',
            },
            {
                href: '/skaiciuokle?tab=radiator',
                icon: Thermometer,
                title: 'Radiator Heads & Valves',
                desc: 'Compatible thermostatic heads (RA Click / M30×1.5), valves & 50 mm H-blocks.',
            },
        ],
        uploadBoqCta: 'Have a project spec? Upload BOQ (/uzklausa) →',
        compatiblePartsHeading: (c) => `Compatible components for this item (${c}):`,
        openItemCta: 'Open →',
        systemMapTitle: 'Client System Map',
        nodeLabelPrefix: '1. Node: ',
        powerAreaLabelPrefix: '2. Output/Area: ',
        connectionLabelPrefix: '3. Connection: ',
        defaultNodeLabel: 'HVAC system diagnostics',
        defaultPowerOrArea: 'Pending (specify m² / kW / mm)',
        defaultConnection: 'Pending (specify type / thread)',
        defaultStageLabel: '1/2 Requirement diagnostics',
        leaveEmailCta: 'Leave email for engineer / Get BOQ quote',
        closeToggle: 'Close',
        openToggle: 'Open',
        leadSentHeading: (ref) => `Inquiry forwarded to Chief Engineer (Ref. ${ref})`,
        leadSentBody: 'The UAB “Gilės inžinerija” team will review your system map and send a detailed quote.',
        leadFormIntro: 'Leave your email – we will prepare a complete bill of materials based on your system map:',
        leadNamePlaceholder: 'Name or company',
        leadCityPlaceholder: 'City (e.g. Vilnius)',
        leadEmailPlaceholder: 'Email (e.g. name@company.com)',
        leadSubmitSending: 'Sending...',
        leadSubmitBtn: 'Get Quote',
        leadValidationError: 'Please enter your name and email address.',
        leadSubmitError: 'Could not send inquiry. Please try again.',
        leadNetworkError: 'Network error while sending inquiry.',
        youLabel: 'You',
        recommendedProductsHeading: (c) => `Recommended products for your system (${c}):`,
        inStockBadge: 'In stock',
        openProductBtn: 'View product',
        addToCartBtn: 'Add to cart',
        checkingMessage: (name) => `${name} is verifying component compatibility in the catalog...`,
        chatInputPlaceholder: 'Enter SKU code or engineering question...',
        sendAria: (name) => `Send message to ${name}`,
        fallbackReply: 'Please clarify your parameters – I will immediately match the right assembly.',
        connectionErrorReply: 'Temporary connection issue reaching the consultant. Please resend your message.',
        compatEssential: (conn) => (conn ? `Direct fit (${conn})` : 'Essential pair for this node'),
        compatCompletion: (conn) => (conn ? `System completion (${conn})` : 'For complete installation'),
        compatAlternative: (conn) => (conn ? `Compatible alternative (${conn})` : 'Compatible alternative'),
    },
    pl: {
        launcherLabel: (name) => `Konsultant ${name}`,
        launcherAria: (name) => `Otwórz konsultanta inżynieryjnego ${name}`,
        headerTitle: (name) => `Konsultant ${name}`,
        headerRoleDefault: 'Główny inżynier HVAC · Odpowiada natychmiast',
        headerRolePdp: 'Bezpośredni dobór kompatybilnych części do tego produktu',
        closeAria: 'Zamknij konsultanta',
        defaultGreeting: (name) => `Dzień dobry! Jestem ${name}, inżynier Gilės. W czym mogę dziś pomóc?`,
        quickReplies: [
            'Pompa ciepła Haier R290 + bufor Gorenje ZV do domu',
            'Podłączenie grzejnika i głowice termostatyczne',
            'Zestaw kotłowni peletowej / stałopalnej (20–25 kW)',
            'Rozdzielacz ogrzewania podłogowego i siłowniki (~100 m²)',
            'Bojler C.W.U. (Dražice / Gorenje / Haier)',
        ],
        memoryTitle: (name) => `Pamięć wyszukiwania i obliczeń (${name} widzi Twój dobór)`,
        calcPrefix: 'Kalkulator:',
        showProductsSuffix: '· Pokaż produkty',
        searchedPrefix: 'Szukano:',
        cartCheckLabel: (c) => `W koszyku: ${c} szt. · Sprawdź kompatybilność`,
        viewedPrefix: 'Oglądano:',
        tabCompatPdp: 'Z czym pasuje',
        tabCompatHome: 'Co dziś dobieramy?',
        tabChat: (name, count) => `Pytanie do ${name} (${count})`,
        skuPlaceholder: 'Wpisz kod produktu lub pytanie, np.: jaka głowica pasuje do zaworu RA-N?',
        findBtn: 'Szukaj',
        checkingCompat: 'Sprawdzanie kompatybilnych części w katalogu...',
        whatSelectingToday: 'Co dziś dobieramy?',
        fourWizardsBadge: '4 kreatory doboru',
        visualCards: [
            {
                href: '/skaiciuokle?tab=boiler',
                icon: Flame,
                title: 'Dobór kotła i bojlera C.W.U.',
                desc: 'Dokładna moc grzewcza (kW) i pojemność zasobnika według powierzchni domu.',
            },
            {
                href: '/skaiciuokle?tab=vessel',
                icon: Gauge,
                title: 'Kalkulator naczynia wzbiorczego',
                desc: 'Odpowiednia pojemność Statico / Aquapresso i ciśnienie wstępne membrany.',
            },
            {
                href: '/skaiciuokle?tab=manifold',
                icon: Layers,
                title: 'Rozdzielacz ogrzewania podłogowego',
                desc: 'Liczba obiegów (2–12), długość rur oraz dobór rozdzielacza Dynacon Eclipse.',
            },
            {
                href: '/skaiciuokle?tab=radiator',
                icon: Thermometer,
                title: 'Głowice i zawory grzejnikowe',
                desc: 'Kompatybilne głowice (RA Click / M30×1,5), zawory i bloki H 50 mm.',
            },
        ],
        uploadBoqCta: 'Masz przedmiar? Prześlij specyfikację (/uzklausa) →',
        compatiblePartsHeading: (c) => `Części pasujące do tego produktu (${c}):`,
        openItemCta: 'Otwórz →',
        systemMapTitle: 'Mapa Systemu Klienta',
        nodeLabelPrefix: '1. Węzeł: ',
        powerAreaLabelPrefix: '2. Moc/Pow.: ',
        connectionLabelPrefix: '3. Przyłącze: ',
        defaultNodeLabel: 'Diagnostyka węzła HVAC',
        defaultPowerOrArea: 'Do ustalenia (podaj m² / kW / mm)',
        defaultConnection: 'Do ustalenia (podaj typ / gwint)',
        defaultStageLabel: '1/2 Diagnostyka potrzeb',
        leaveEmailCta: 'Zostaw e-mail inżynierowi / Otrzymaj wycenę',
        closeToggle: 'Zamknij',
        openToggle: 'Otwórz',
        leadSentHeading: (ref) => `Zapytanie przekazano gł. inżynierowi (Nr ${ref})`,
        leadSentBody: 'Zespół UAB „Gilės inžinerija” przeanalizuje mapę układu i prześle dokładny kosztorys.',
        leadFormIntro: 'Zostaw adres e-mail – przygotujemy pełny kosztorys węzła na podstawie Twojej mapy systemu:',
        leadNamePlaceholder: 'Imię lub firma',
        leadCityPlaceholder: 'Miasto (np. Warszawa / Wilno)',
        leadEmailPlaceholder: 'E-mail (np. jan@firma.pl)',
        leadSubmitSending: 'Wysyłanie...',
        leadSubmitBtn: 'Otrzymaj wycenę',
        leadValidationError: 'Podaj imię oraz adres e-mail.',
        leadSubmitError: 'Nie udało się wysłać zapytania. Spróbuj ponownie.',
        leadNetworkError: 'Błąd połączenia podczas wysyłania zapytania.',
        youLabel: 'Ty',
        recommendedProductsHeading: (c) => `Rekomendowane produkty do Twojego układu (${c}):`,
        inStockBadge: 'W magazynie',
        openProductBtn: 'Otwórz produkt',
        addToCartBtn: 'Do koszyka',
        checkingMessage: (name) => `${name} sprawdza kompatybilność węzła w katalogu...`,
        chatInputPlaceholder: 'Wpisz kod SKU lub pytanie techniczne...',
        sendAria: (name) => `Wyślij wiadomość do ${name}`,
        fallbackReply: 'Proszę doprecyzować pytanie – dobiorę odpowiednie rozwiązanie.',
        connectionErrorReply: 'Chwilowy błąd połączenia z konsultantem. Spróbuj wysłać wiadomość ponownie.',
        compatEssential: (conn) => (conn ? `Pasuje bezpośrednio (${conn})` : 'Niezbędna para do tego węzła'),
        compatCompletion: (conn) => (conn ? `Uzupełnienie węzła (${conn})` : 'Do pełnego montażu'),
        compatAlternative: (conn) => (conn ? `Kompatybilny zamiennik (${conn})` : 'Kompatybilny zamiennik'),
    },
    ru: {
        launcherLabel: (name) => `Консультант ${name === 'Vytautas' ? 'Витаутас' : name}`,
        launcherAria: (name) => `Открыть инженерного консультанта ${name}`,
        headerTitle: (name) => `Консультант ${name === 'Vytautas' ? 'Витаутас' : name}`,
        headerRoleDefault: 'Главный инженер ОВиК · Отвечает мгновенно',
        headerRolePdp: 'Прямой подбор совместимых деталей для этого товара',
        closeAria: 'Закрыть консультанта',
        defaultGreeting: (name) =>
            `Здравствуйте! Я ${name === 'Vytautas' ? 'Витаутас' : name}, инженер Gilės. Чем могу помочь сегодня?`,
        quickReplies: [
            'Тепловой насос Haier R290 + буферная емкость Gorenje ZV',
            'Подключение радиатора и термостатическое управление',
            'Комплект пеллетной / твердотопливной котельной (20–25 кВт)',
            'Коллектор теплого пола и сервоприводы (~100 м²)',
            'Бойлер косвенного нагрева (Dražice / Gorenje / Haier)',
        ],
        memoryTitle: (name) =>
            `Память вашего поиска и расчетов (${name === 'Vytautas' ? 'Витаутас' : name} видит ваш выбор)`,
        calcPrefix: 'Калькулятор:',
        showProductsSuffix: '· Показать товары',
        searchedPrefix: 'Поиск:',
        cartCheckLabel: (c) => `В корзине: ${c} шт. · Проверить совместимость`,
        viewedPrefix: 'Просмотрено:',
        tabCompatPdp: 'С чем совместимо',
        tabCompatHome: 'Что сегодня подбираем?',
        tabChat: (name, count) => `Вопрос ${name === 'Vytautas' ? 'Витаутасу' : name} (${count})`,
        skuPlaceholder: 'Введите артикул или вопрос, напр.: какая головка подходит к клапану RA-N?',
        findBtn: 'Найти',
        checkingCompat: 'Проверка совместимых деталей в каталоге...',
        whatSelectingToday: 'Что сегодня подбираем?',
        fourWizardsBadge: '4 мастера подбора',
        visualCards: [
            {
                href: '/skaiciuokle?tab=boiler',
                icon: Flame,
                title: 'Подбор котла и бойлера ГВС',
                desc: 'Точная тепловая мощность (кВт) и объем бойлера по площади вашего дома.',
            },
            {
                href: '/skaiciuokle?tab=vessel',
                icon: Gauge,
                title: 'Калькулятор расширительного бака',
                desc: 'Подходящий объем Statico / Aquapresso и начальное давление мембраны.',
            },
            {
                href: '/skaiciuokle?tab=manifold',
                icon: Layers,
                title: 'Коллектор теплого пола',
                desc: 'Количество контуров (2–12), длина трубы и подбор коллектора Dynacon Eclipse.',
            },
            {
                href: '/skaiciuokle?tab=radiator',
                icon: Thermometer,
                title: 'Радиаторные головки и клапаны',
                desc: 'Совместимые головки (RA Click / M30×1,5), клапаны и Н-образные узлы 50 мм.',
            },
        ],
        uploadBoqCta: 'Есть спецификация? Загрузите список (/uzklausa) →',
        compatiblePartsHeading: (c) => `Совместимые детали для этого товара (${c}):`,
        openItemCta: 'Открыть →',
        systemMapTitle: 'Карта Системы Клиента',
        nodeLabelPrefix: '1. Узел: ',
        powerAreaLabelPrefix: '2. Мощн./Площадь: ',
        connectionLabelPrefix: '3. Подключение: ',
        defaultNodeLabel: 'Диагностика узла ОВиК',
        defaultPowerOrArea: 'Уточняется (укажите м² / кВт / мм)',
        defaultConnection: 'Уточняется (укажите тип / резьбу)',
        defaultStageLabel: '1/2 Диагностика задачи',
        leaveEmailCta: 'Оставить e-mail инженеру / Получить смету',
        closeToggle: 'Закрыть',
        openToggle: 'Открыть',
        leadSentHeading: (ref) => `Заявка передана гл. инженеру (№ ${ref})`,
        leadSentBody: 'Команда UAB «Gilės inžinerija» проверит карту вашей системы и свяжется с точной сметой.',
        leadFormIntro: 'Оставьте e-mail – подготовим полную комплектацию и смету по вашей карте системы:',
        leadNamePlaceholder: 'Имя или компания',
        leadCityPlaceholder: 'Город (напр. Вильнюс)',
        leadEmailPlaceholder: 'E-mail (напр. name@company.lt)',
        leadSubmitSending: 'Отправка...',
        leadSubmitBtn: 'Получить смету',
        leadValidationError: 'Введите имя и адрес электронной почты.',
        leadSubmitError: 'Не удалось отправить запрос. Попробуйте еще раз.',
        leadNetworkError: 'Ошибка соединения при отправке запроса.',
        youLabel: 'Вы',
        recommendedProductsHeading: (c) => `Рекомендуемые товары для вашей системы (${c}):`,
        inStockBadge: 'На складе',
        openProductBtn: 'Открыть товар',
        addToCartBtn: 'В корзину',
        checkingMessage: (name) =>
            `${name === 'Vytautas' ? 'Витаутас' : name} проверяет совместимость узла в каталоге...`,
        chatInputPlaceholder: 'Введите артикул товара или вопрос...',
        sendAria: (name) => `Отправить сообщение ${name}`,
        fallbackReply: 'Пожалуйста, уточните вопрос – я сразу подберу подходящее решение.',
        connectionErrorReply: 'Временный сбой связи с консультантом. Попробуйте отправить сообщение еще раз.',
        compatEssential: (conn) => (conn ? `Прямая совместимость (${conn})` : 'Обязательная пара для узла'),
        compatCompletion: (conn) => (conn ? `Дополнение узла (${conn})` : 'Для полного монтажа'),
        compatAlternative: (conn) => (conn ? `Совместимый аналог (${conn})` : 'Совместимый аналог'),
    },
};

function formatCleanChatCardTitle(rawTitle: string, sku?: string | null): string {
    const cleanSku = (sku || '').trim() || null;
    const base = (rawTitle || '').trim();
    const stripped = cleanSku
        ? base
              .replace(new RegExp(`\\s*\\(${cleanSku.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\)\\s*$`, 'i'), '')
              .replace(new RegExp(`\\s*[–—-]\\s*${cleanSku.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`, 'i'), '')
              .trim()
        : base;
    const raw = (stripped || base).replace(/—/g, '–').trim();
    if (!raw) return cleanSku ? `HVAC (${cleanSku})` : 'HVAC';
    return raw;
}

function normalizeMessageProseAndExtractCards(
    rawContent: string,
    initialProducts: ChatSuggestedProduct[] = [],
): { cleanText: string; products: ChatSuggestedProduct[] } {
    const productMap = new Map<string, ChatSuggestedProduct>();
    for (const p of initialProducts) {
        const key = p.id || p.sku || p.name;
        if (key && !productMap.has(key)) {
            productMap.set(key, p);
        }
    }

    const mdLinkRegex = /\[([^\]]+)\]\(\s*(?:https?:\/\/[^/)]+)?(?:\/suradai)?(?:\/(?:lt|en|pl|ru))?\/products\/([^)\s?#]+)[^)]*\)/gi;
    let m: RegExpExecArray | null;
    while ((m = mdLinkRegex.exec(rawContent)) !== null) {
        const rawLabel = m[1].trim();
        const prodId = decodeURIComponent(m[2].trim());
        const afterSlice = rawContent.slice(m.index, m.index + m[0].length + 120);
        const priceMatch = afterSlice.match(/(\d+[.,]\d{2})\s*(?:EUR|€)/i);
        const skuMatch =
            afterSlice.match(/kodas\s*[=:]?\s*`?([0-9A-Za-z.-]{3,})`?/i) ||
            rawLabel.match(/(?:–|-)\s*([0-9A-Za-z.-]{4,})\s*$/);
        const sku = skuMatch && !/REDACTED/i.test(skuMatch[1]) ? skuMatch[1] : null;
        const cleanTitle = sku
            ? rawLabel.replace(new RegExp(`\\s*[–—-]\\s*${sku.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`, 'i'), '').trim()
            : rawLabel;

        const parsedPrice = priceMatch ? Number(priceMatch[1].replace(',', '.')) : 0;
        if (parsedPrice > 10000 || sku === '7111020') continue;

        if (!productMap.has(prodId)) {
            const brandInfo = resolveBrandLogo(undefined, `${sku || ''} ${cleanTitle}`);
            const resolvedImg = resolveProductImageUrl({ sku, title: cleanTitle, brand: brandInfo.name });
            productMap.set(prodId, {
                id: prodId,
                sku,
                name: cleanTitle,
                title: cleanTitle,
                price: parsedPrice,
                formattedPrice: parsedPrice > 0 ? `${parsedPrice.toFixed(2).replace('.', ',')} €` : undefined,
                url: `/products/${prodId}`,
                image: resolvedImg,
                imageUrl: resolvedImg,
                brandName: brandInfo.name,
                brandLogoUrl: brandInfo.logoPath,
            });
        }
    }

    const lines = rawContent.split(/\r?\n/);
    const cleanLines: string[] = [];
    for (const line of lines) {
        const trimmed = line.trim();
        const isPureLinkDump =
            /^[-*•]\s*\[[^\]]+\]\(\s*(?:https?:\/\/[^/)]+)?(?:\/suradai)?(?:\/(?:lt|en|pl|ru))?\/products\/[^)]+\)\s*(?:[—–-]\s*(?:kodas|\d+[.,]\d{2})|\(kodas|\s*$)/i.test(
                trimmed,
            ) && !/kodėl tinka|paskirtis|montavim/i.test(trimmed);
        if (isPureLinkDump) continue;

        const cleaned = line
            .replace(
                /\[([^\]]+)\]\(\s*(?:https?:\/\/[^/)]+)?(?:\/suradai)?(?:\/(?:lt|en|pl|ru))?\/products\/[^)]+\)/gi,
                (_match, label: string) => `**${label.replace(/\s*[—–-]\s*([0-9A-Za-z.-]{4,})$/, ' ($1)')}**`,
            )
            .replace(/\[([^\]]+)\]\(\s*(\/[a-z0-9/_-]+)\s*\)/gi, (_match, label: string, href: string) =>
                label.trim() === href.trim() ? href.trim() : `${label.trim()} (${href.trim()})`,
            )
            .replace(/\s*[—–-]?\s*kodas\s*=\s*\[REDACTED\]\s*,?/gi, '')
            .replace(/\[REDACTED\]/g, '')
            .replace(/`/g, '')
            .replace(/—/g, '–');
        cleanLines.push(cleaned);
    }

    return {
        cleanText: cleanLines.join('\n').replace(/\n{3,}/g, '\n\n').trim(),
        products: Array.from(productMap.values()).slice(0, 4),
    };
}

function renderInlineFormattedText(text: string) {
    const clean = text.replace(/`/g, '').replace(/—/g, '–');
    const tokens = clean.split(/(\*\*[^*]+\*\*)/g);
    return tokens.map((token, i) => {
        if (token.startsWith('**') && token.endsWith('**') && token.length > 4) {
            return (
                <strong key={i} className="font-semibold text-[var(--foreground)]">
                    {token.slice(2, -2)}
                </strong>
            );
        }
        return <span key={i}>{token}</span>;
    });
}

function StructuredMessageContent({ content }: { content: string }) {
    const blocks = content.split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);

    return (
        <div className="space-y-2 text-xs leading-relaxed text-[var(--foreground)]">
            {blocks.map((block, bIdx) => {
                const lines = block.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
                const isBulletList = lines.length > 0 && lines.every((l) => /^[-*•]\s+/.test(l));
                const isNumberedList = lines.length > 0 && lines.every((l) => /^\d+[.)]\s+/.test(l));

                if (isBulletList) {
                    return (
                        <ul key={bIdx} className="space-y-1 pl-3.5 list-disc marker:text-slate-400">
                            {lines.map((line, lIdx) => (
                                <li key={lIdx} className="leading-snug">
                                    {renderInlineFormattedText(line.replace(/^[-*•]\s+/, ''))}
                                </li>
                            ))}
                        </ul>
                    );
                }

                if (isNumberedList) {
                    return (
                        <ol key={bIdx} className="space-y-1 pl-4 list-decimal marker:font-mono marker:text-slate-500">
                            {lines.map((line, lIdx) => (
                                <li key={lIdx} className="leading-snug">
                                    {renderInlineFormattedText(line.replace(/^\d+[.)]\s+/, ''))}
                                </li>
                            ))}
                        </ol>
                    );
                }

                return (
                    <div key={bIdx} className="space-y-1">
                        {lines.map((line, lIdx) => {
                            if (/^[-*•]\s+/.test(line)) {
                                return (
                                    <div key={lIdx} className="flex items-start gap-1.5 pl-1">
                                        <span className="text-slate-400 select-none">•</span>
                                        <span>{renderInlineFormattedText(line.replace(/^[-*•]\s+/, ''))}</span>
                                    </div>
                                );
                            }
                            return <p key={lIdx}>{renderInlineFormattedText(line)}</p>;
                        })}
                    </div>
                );
            })}
        </div>
    );
}

function extractProductIdFromPathname(pathname: string | null): string | null {
    if (!pathname) return null;
    const match = pathname.match(/\/products\/([0-9a-fA-F-]{8,}|[^/?#]+)/);
    return match ? decodeURIComponent(match[1]) : null;
}

export function VytautasAssistantWidget() {
    const routerPathname = usePathname();
    const rawNextPathname = useNextPathname() || '';
    const intlLocale = useLocale() || 'lt';
    const urlMatch = rawNextPathname.match(/^\/(lt|en|pl|ru)(?=\/|$)/i);
    const locale = resolveAppLocale(urlMatch ? urlMatch[1] : intlLocale);
    const copy = VYTAUTAS_I18N[locale];

    const { storeId, features, persona } = useStorefrontConfig();
    const agentName = persona.agentName || 'Vytautas';
    const agentRole = locale === 'lt' ? persona.agentRoleLt || copy.headerRoleDefault : copy.headerRoleDefault;
    const initialGreeting = copy.defaultGreeting(agentName);

    const cartItems = useCartStore((s) => s.items);
    const addItemToCart = useCartStore((s) => s.addItem);
    const openCartDrawer = useCartStore((s) => s.openCart);
    const [open, setOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'compat' | 'chat'>('compat');
    const [activeProductId, setActiveProductId] = useState<string | null>(null);
    const [compatData, setCompatData] = useState<CompatibilityPayload | null>(null);
    const [compatLoading, setCompatLoading] = useState(false);
    const [skuQuery, setSkuQuery] = useState('');
    const [journey, setJourney] = useState<CustomerJourneyState>({
        searches: [],
        calculators: [],
        viewedProducts: [],
        selectedVariants: [],
    });
    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            role: 'assistant',
            content: initialGreeting,
            quickReplies: [...copy.quickReplies],
        },
    ]);
    const [systemMap, setSystemMap] = useState<ClientSystemMap>({
        nodeId: 'general',
        nodeLabel: copy.defaultNodeLabel,
        powerOrAreaLabel: copy.defaultPowerOrArea,
        connectionOrTypeLabel: copy.defaultConnection,
        stage: 'discovery',
        stageLabel: '1/2 Poreikio diagnostika',
    });
    const [inputMessage, setInputMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [sessionModifiedCalcSummary, setSessionModifiedCalcSummary] = useState<string | null>(null);
    const [leadFormOpen, setLeadFormOpen] = useState(false);
    const [leadName, setLeadName] = useState('');
    const [leadContact, setLeadContact] = useState('');
    const [leadCity, setLeadCity] = useState('Vilnius');
    const [leadSubmitting, setLeadSubmitting] = useState(false);
    const [leadReceipt, setLeadReceipt] = useState<string | null>(null);
    const [leadError, setLeadError] = useState<string | null>(null);
    const sessionIdRef = useRef<string>('suradai-session');
    const messagesEndRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        try {
            // W119-A2: giles_ key; one-time read of the old suradai_ key so an
            // in-flight visitor keeps their session id.
            const legacy = window.sessionStorage.getItem('suradai_vytautas_session_id');
            const existing =
                window.sessionStorage.getItem('giles_vytautas_session_id') || legacy;
            if (existing) {
                sessionIdRef.current = existing;
                window.sessionStorage.setItem('giles_vytautas_session_id', existing);
            } else {
                const created = `vyt-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
                window.sessionStorage.setItem('giles_vytautas_session_id', created);
                sessionIdRef.current = created;
            }
        } catch {
            // Ignore sessionStorage restrictions
        }
    }, []);

    useEffect(() => {
        setMessages((prev) => {
            if (prev.length === 1 && prev[0].role === 'assistant') {
                return [
                    {
                        role: 'assistant',
                        content: initialGreeting,
                        quickReplies: [...copy.quickReplies],
                    },
                ];
            }
            return prev;
        });
        setSystemMap((prev) =>
            prev.nodeId === 'general'
                ? {
                      ...prev,
                      nodeLabel: copy.defaultNodeLabel,
                      powerOrAreaLabel: copy.defaultPowerOrArea,
                      connectionOrTypeLabel: copy.defaultConnection,
                  }
                : prev,
        );
    }, [initialGreeting, copy]);

    useEffect(() => {
        if (!features.customerJourneyTracker) {
            setJourney({
                searches: [],
                calculators: [],
                viewedProducts: [],
                selectedVariants: [],
            });
            return;
        }
        setJourney(getCustomerJourney(storeId));

        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const urlQuery = params.get('q')?.trim();
            if (urlQuery && urlQuery.length >= 2) {
                const updated = recordSearchQuery(urlQuery);
                setJourney(updated);
            }
        }
    }, [routerPathname, features.customerJourneyTracker, storeId]);

    useEffect(() => {
        if (!features.customerJourneyTracker) return;
        const cartSkus = cartItems.map((item) => `${item.name} (${item.sku}) x${item.quantity}`);
        syncCartSnapshot(cartSkus);
    }, [cartItems, features.customerJourneyTracker]);

    useEffect(() => {
        const winPath = typeof window !== 'undefined' ? window.location.pathname : null;
        const detectedId =
            extractProductIdFromPathname(routerPathname) ||
            extractProductIdFromPathname(winPath);
        setActiveProductId(detectedId);
        if (!detectedId) {
            setCompatData(null);
        }
    }, [routerPathname]);

    useEffect(() => {
        if (!activeProductId) return;
        let cancelled = false;
        async function loadCompatibility(productId: string) {
            setCompatLoading(true);
            try {
                const res = await fetch(
                    apiUrl(`/api/compatibility?productId=${encodeURIComponent(productId)}&limit=3`),
                );
                if (!res.ok) return;
                const data = (await res.json()) as CompatibilityPayload;
                if (!cancelled) {
                    setCompatData(data);
                    if (data.focalProduct) {
                        const updated = recordViewedProduct({
                            id: data.focalProduct.id,
                            sku: data.focalProduct.sku,
                            title: data.focalProduct.name,
                            brand: data.focalProduct.attributes.brand,
                            category: data.focalProduct.attributes.roleLabelLt,
                            priceEur: data.focalProduct.price,
                            imageUrl: data.focalProduct.image,
                        });
                        setJourney(updated);
                    }
                }
            } catch {
                // Silent fallback
            } finally {
                if (!cancelled) setCompatLoading(false);
            }
        }
        loadCompatibility(activeProductId);
        return () => {
            cancelled = true;
        };
    }, [activeProductId]);

    const sendChatQuestion = useCallback(
        async (questionText: string, includeJourneyContext = false) => {
            const trimmed = questionText.trim();
            if (!trimmed || sending) return;
            setActiveTab('chat');
            setOpen(true);

            const historySnapshot: VytautasHistoryTurn[] = messages.map((m) => ({
                role: m.role,
                content: m.text || m.content,
            }));

            setMessages((prev) => [...prev, { role: 'user', content: trimmed }]);
            setInputMessage('');
            setSending(true);

            const cartSkus = cartItems.map((item) => `${item.name} (${item.sku}) x${item.quantity}`);
            const journeyContext =
                includeJourneyContext && features.customerJourneyTracker
                    ? buildChatJourneyContext(cartSkus)
                    : undefined;
            const winPath = typeof window !== 'undefined' ? window.location.pathname : routerPathname || '/';
            const resolvedPageType: ClientTelemetry['currentPage'] = activeProductId
                ? 'pdp'
                : /\/paketai\b/i.test(winPath)
                  ? 'paketai'
                  : /\/inzinerija\b/i.test(winPath)
                    ? 'inzinerija'
                    : /\/skaiciuokle\b/i.test(winPath)
                      ? 'calculator'
                      : /\/cart\b|\/checkout\b/i.test(winPath)
                        ? 'cart'
                        : 'catalog';

            const focalProd = compatData?.focalProduct;
            const currentProductTelemetry = focalProd
                ? {
                      id: focalProd.id,
                      sku: focalProd.sku,
                      title: focalProd.name,
                      brand: focalProd.attributes.brand,
                      category: focalProd.attributes.roleLabelLt,
                      priceEur: focalProd.price,
                      specs: [
                          focalProd.attributes.nominalDiameter,
                          focalProd.attributes.threadLabel,
                          focalProd.attributes.connectionStandard,
                          focalProd.attributes.pressureRating,
                      ]
                          .filter(Boolean)
                          .join(' · '),
                  }
                : activeProductId
                  ? {
                        sku: activeProductId,
                        title: `SKU (${activeProductId})`,
                    }
                  : null;

            const clientTelemetry: ClientTelemetry = {
                currentPage: resolvedPageType,
                currentPath: winPath,
                currentProduct: currentProductTelemetry,
                recentlyViewedSkus: journey.viewedProducts
                    .slice(0, 5)
                    .map((p) => (p.sku && p.sku !== p.title ? `${p.title} (${p.sku})` : p.title)),
                cartItems: cartSkus,
                activeCalculatorSummary: includeJourneyContext
                    ? journeyContext?.calculatorSummary || sessionModifiedCalcSummary
                    : sessionModifiedCalcSummary,
            };

            if (typeof window !== 'undefined') {
                try {
                    window.sessionStorage.setItem(
                        'giles_vytautas_client_telemetry_v1',
                        JSON.stringify(clientTelemetry),
                    );
                } catch {
                    // Ignore sessionStorage restrictions
                }
            }

            const cartItemCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
            const cartTotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
            const chatEndpoint =
                typeof window !== 'undefined' && window.location.pathname.startsWith('/suradai')
                    ? '/suradai/api/chat'
                    : '/api/chat';

            try {
                const res = await fetch(chatEndpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        storeId,
                        locale,
                        sessionId: sessionIdRef.current,
                        message: trimmed,
                        history: historySnapshot,
                        messages: [...historySnapshot, { role: 'user', content: trimmed }],
                        systemMap,
                        clientTelemetry,
                        ...(journeyContext ? { journeyContext } : {}),
                        context: {
                            pageType: resolvedPageType,
                            currentPath: winPath,
                            activeProduct: focalProd
                                ? {
                                      id: focalProd.id,
                                      sku: focalProd.sku,
                                      name: focalProd.name,
                                      brand: focalProd.attributes.brand,
                                      category: focalProd.attributes.roleLabelLt,
                                      price: focalProd.price,
                                  }
                                : undefined,
                            recentlyViewedSkus: clientTelemetry.recentlyViewedSkus,
                            activeCalculatorSummary: clientTelemetry.activeCalculatorSummary,
                            cartItemCount,
                            cartTotal,
                            cartItems: cartSkus,
                            ...(journeyContext ? { journeyContext } : {}),
                        },
                    }),
                });
                const data = await res.json().catch(() => ({}));
                if (data.systemMap) {
                    setSystemMap(data.systemMap as ClientSystemMap);
                }

                const effectiveStage: string = data.stage || 'conversation';
                const rawCards: ChatSuggestedProduct[] =
                    effectiveStage === 'recommendation'
                        ? Array.isArray(data.recommendations) && data.recommendations.length > 0
                            ? data.recommendations
                            : Array.isArray(data.suggestedProducts)
                              ? data.suggestedProducts
                              : []
                        : [];

                const replyText =
                    typeof data.response === 'string' && data.response.trim()
                        ? data.response.trim()
                        : copy.fallbackReply;

                const normalized = normalizeMessageProseAndExtractCards(
                    replyText,
                    rawCards,
                );
                setMessages((prev) => [
                    ...prev,
                    {
                        role: 'assistant',
                        content: normalized.cleanText,
                        suggestedProducts:
                            effectiveStage === 'recommendation' ? normalized.products : [],
                        quickReplies: Array.isArray(data.quickReplies)
                            ? data.quickReplies
                            : Array.isArray(data.followUpSuggestions)
                              ? data.followUpSuggestions
                              : [],
                    },
                ]);
            } catch {
                setMessages((prev) => [
                    ...prev,
                    {
                        role: 'assistant',
                        content: copy.connectionErrorReply,
                        suggestedProducts: [],
                        quickReplies: [],
                    },
                ]);
            } finally {
                setSending(false);
            }
        },
        [
            sending,
            messages,
            systemMap,
            cartItems,
            activeProductId,
            compatData,
            storeId,
            locale,
            copy,
            features.customerJourneyTracker,
            routerPathname,
            journey.viewedProducts,
            sessionModifiedCalcSummary,
        ],
    );

    useEffect(() => {
        function handleJourneyUpdate(ev: Event) {
            if (!features.customerJourneyTracker) return;
            const updated = getCustomerJourney(storeId);
            setJourney(updated);
            const custom = ev as CustomEvent<CustomerJourneyState>;
            const newestCalc = custom.detail?.calculators?.[0];
            if (newestCalc && Date.now() - newestCalc.timestamp < 15000) {
                setSessionModifiedCalcSummary(
                    `${newestCalc.labelLt}: ${newestCalc.inputsSummary} → ${newestCalc.resultSummary}`,
                );
            }
        }

        function handleOpenVytautas(e: Event) {
            if (!features.vytautasWidget) return;
            const custom = e as CustomEvent<OpenVytautasPayload>;
            const detail = custom.detail || {};
            if (detail.proactive && !features.proactiveTrigger) return;
            if (features.customerJourneyTracker) {
                setJourney(getCustomerJourney(storeId));
            }
            setOpen(true);

            if (detail.sku && !detail.prompt) {
                setSkuQuery(detail.sku);
                setActiveTab('compat');
                setCompatLoading(true);
                fetch(apiUrl(`/api/compatibility?q=${encodeURIComponent(detail.sku)}&limit=3`))
                    .then((res) => (res.ok ? res.json() : null))
                    .then((data: CompatibilityPayload | null) => {
                        if (data) setCompatData(data);
                    })
                    .catch(() => {})
                    .finally(() => setCompatLoading(false));
                return;
            }

            if (detail.prompt) {
                setActiveTab('chat');
                if (detail.autoSend !== false) {
                    void sendChatQuestion(detail.prompt);
                } else {
                    setInputMessage(detail.prompt);
                }
            }
        }

        window.addEventListener(JOURNEY_UPDATE_EVENT, handleJourneyUpdate);
        window.addEventListener(OPEN_VYTAUTAS_EVENT, handleOpenVytautas);
        return () => {
            window.removeEventListener(JOURNEY_UPDATE_EVENT, handleJourneyUpdate);
            window.removeEventListener(OPEN_VYTAUTAS_EVENT, handleOpenVytautas);
        };
    }, [sendChatQuestion, features.customerJourneyTracker, features.vytautasWidget, features.proactiveTrigger, storeId]);

    useEffect(() => {
        if (open && activeTab === 'chat') {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, open, activeTab]);

    async function handleSkuSearch(e: React.FormEvent) {
        e.preventDefault();
        const trimmed = skuQuery.trim();
        if (!trimmed) return;
        setJourney(recordSearchQuery(trimmed));
        setCompatLoading(true);
        try {
            const res = await fetch(
                apiUrl(`/api/compatibility?q=${encodeURIComponent(trimmed)}&limit=3`),
            );
            if (res.ok) {
                const data = (await res.json()) as CompatibilityPayload;
                setCompatData(data);
            }
        } finally {
            setCompatLoading(false);
        }
    }

    async function handleEngineeringLeadSubmit(e: React.FormEvent) {
        e.preventDefault();
        const cleanName = leadName.trim();
        const cleanContact = leadContact.trim();
        if (cleanName.length < 2 || cleanContact.length < 5) {
            setLeadError(copy.leadValidationError);
            return;
        }
        setLeadError(null);
        setLeadSubmitting(true);

        const isEmail = cleanContact.includes('@');
        const lastRecMessage = [...messages]
            .reverse()
            .find((m) => m.role === 'assistant' && Array.isArray(m.suggestedProducts) && m.suggestedProducts.length > 0);
        const recItems = (lastRecMessage?.suggestedProducts || []).map((p) => ({
            sku: p.sku || p.id,
            title: p.title || p.name,
            quantity: 1,
            unitPrice: Number(p.price || 0),
        }));

        const leadEndpoint =
            typeof window !== 'undefined' && window.location.pathname.startsWith('/suradai')
                ? '/suradai/api/engineering-lead'
                : '/api/engineering-lead';

        try {
            const res = await fetch(leadEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: cleanName,
                    phone: isEmail ? '' : cleanContact,
                    email: isEmail ? cleanContact : 'info@gilesinzinerija.lt',
                    city: leadCity.trim() || 'Vilnius',
                    serviceType: `Vytautas HVAC consultation (${systemMap.nodeLabel})`,
                    notes: `System map: ${systemMap.nodeLabel} | ${systemMap.powerOrAreaLabel} | ${systemMap.connectionOrTypeLabel}. Contact: ${cleanContact}`,
                    items: recItems,
                }),
            });
            const data = await res.json().catch(() => ({}));
            if (res.ok && data.ok) {
                setLeadReceipt(data.reference || 'GI-2026-OK');
            } else {
                setLeadError(data.error || copy.leadSubmitError);
            }
        } catch {
            setLeadError(copy.leadNetworkError);
        } finally {
            setLeadSubmitting(false);
        }
    }

    function buildCompactCompatBadge(item: CompatibleItem): string {
        const conn = item.attributes?.connectionStandard || item.attributes?.threadLabel || item.attributes?.nominalDiameter;
        if (item.relationType === 'essential_pair') {
            return copy.compatEssential(conn);
        }
        if (item.relationType === 'system_completion') {
            return copy.compatCompletion(conn);
        }
        return copy.compatAlternative(conn);
    }

    const focal = compatData?.focalProduct;
    const focalImage = focal
        ? resolveProductImageUrl({
              sku: focal.sku,
              title: focal.name,
              brand: focal.attributes.brand,
              imageUrl: focal.image,
          })
        : '';

    const latestCalc = journey.calculators[0];
    const latestSearch = journey.searches[0];
    const latestViewed = journey.viewedProducts[0];
    const latestVariant = journey.selectedVariants[0];
    const totalCartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    const hasActiveMemory =
        features.customerJourneyTracker &&
        (Boolean(latestCalc) ||
            Boolean(latestSearch) ||
            Boolean(latestViewed) ||
            Boolean(latestVariant) ||
            totalCartCount > 0);

    if (!features.vytautasWidget) {
        return null;
    }

    return (
        <div
            data-testid="vytautas-assistant-widget"
            id="vytautas-launcher"
            className="fixed bottom-[var(--cookie-banner-h,1rem)] right-4 z-[9995] max-w-[calc(100vw-2rem)] font-sans transition-[bottom] duration-200 ease-out"
        >
            {!open && (
                <button
                    type="button"
                    onClick={() => setOpen(true)}
                    aria-label={copy.launcherAria(agentName)}
                    className="bg-transparent p-0 border-0 cursor-pointer"
                >
                    <span className="h-11 px-4 bg-white text-[var(--foreground)] border border-slate-300 rounded-md shadow-md flex items-center gap-2.5 hover:border-[var(--foreground)] transition-colors">
                        <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0" />
                        <span className="font-display text-xs font-bold text-[var(--foreground)] whitespace-nowrap">
                            {copy.launcherLabel(agentName)}
                        </span>
                        <Wrench className="w-3.5 h-3.5 text-[var(--primary)] shrink-0" />
                    </span>
                </button>
            )}

            {open && (
                <div
                    onWheel={(e) => e.stopPropagation()}
                    onTouchMove={(e) => e.stopPropagation()}
                    className="w-[380px] sm:w-[440px] max-w-[calc(100vw-2rem)] bg-[var(--background)] text-[var(--foreground)] border border-slate-300 rounded-md shadow-xl max-h-[min(650px,calc(100vh-5rem))] flex flex-col overflow-hidden"
                >
                    <div className="bg-white text-[var(--foreground)] px-4 py-3 flex items-center justify-between border-b border-slate-200 shrink-0">
                        <div className="min-w-0">
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0" />
                                <span className="font-display text-sm font-bold text-[var(--foreground)] truncate">
                                    {copy.headerTitle(agentName)}
                                </span>
                            </div>
                            <p className="text-xs text-slate-600 mt-0.5 truncate">
                                {activeProductId ? copy.headerRolePdp : agentRole}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setOpen(false)}
                            aria-label={copy.closeAria}
                            className="p-1 text-slate-500 hover:text-[var(--foreground)] rounded-sm"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {hasActiveMemory && (
                        <div
                            data-testid="vytautas-active-context-bar"
                            className="bg-slate-100 border-b border-slate-200 px-3.5 py-2 shrink-0 space-y-1.5"
                        >
                            <div className="flex items-center justify-between gap-2">
                                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                                    {copy.memoryTitle(agentName)}
                                </span>
                            </div>
                            <div className="flex flex-wrap gap-1.5 text-xs">
                                {latestCalc && (
                                    <button
                                        type="button"
                                        onClick={() =>
                                            sendChatQuestion(
                                                `${latestCalc.labelLt}: ${latestCalc.inputsSummary} -> ${latestCalc.resultSummary}`,
                                                true,
                                            )
                                        }
                                        className="bg-white border border-slate-300 hover:border-[var(--primary)] text-[var(--foreground)] px-2 py-0.5 rounded-xs font-medium flex items-center gap-1 transition-colors max-w-full truncate"
                                    >
                                        <span className="font-mono text-[10px] font-bold text-slate-700">
                                            {copy.calcPrefix}
                                        </span>
                                        <span className="truncate">{latestCalc.resultSummary}</span>
                                        <span className="font-mono text-[10px] text-[var(--primary)] font-bold shrink-0">
                                            {copy.showProductsSuffix}
                                        </span>
                                    </button>
                                )}
                                {latestSearch && (
                                    <button
                                        type="button"
                                        onClick={() => sendChatQuestion(latestSearch.query)}
                                        className="bg-white border border-[var(--secondary)]/40 hover:border-[var(--primary)] text-[var(--foreground)] px-2 py-0.5 rounded-xs font-medium flex items-center gap-1 transition-colors"
                                    >
                                        <span className="font-mono text-[10px] font-bold text-[var(--secondary)]">
                                            {copy.searchedPrefix}
                                        </span>
                                        <span className="truncate max-w-[120px]">„{latestSearch.query}“</span>
                                    </button>
                                )}
                                {totalCartCount > 0 && (
                                    <button
                                        type="button"
                                        onClick={() => sendChatQuestion(copy.cartCheckLabel(totalCartCount))}
                                        className="bg-white border border-emerald-400 hover:border-[var(--primary)] text-[var(--foreground)] px-2 py-0.5 rounded-xs font-medium flex items-center gap-1 transition-colors"
                                    >
                                        <ShoppingBag className="w-3 h-3 text-emerald-700 shrink-0" />
                                        <span>{copy.cartCheckLabel(totalCartCount)}</span>
                                    </button>
                                )}
                                {latestViewed && !latestCalc && (
                                    <button
                                        type="button"
                                        onClick={() => sendChatQuestion(`${latestViewed.title} (${latestViewed.sku})`)}
                                        className="bg-white border border-slate-300 hover:border-[var(--secondary)] text-[var(--foreground)] px-2 py-0.5 rounded-xs font-medium flex items-center gap-1 transition-colors max-w-full truncate"
                                    >
                                        <span className="font-mono text-[10px] font-bold text-slate-600">
                                            {copy.viewedPrefix}
                                        </span>
                                        <span className="truncate max-w-[150px]">{latestViewed.title}</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-2 border-b border-slate-300 bg-slate-200/80 font-mono text-xs uppercase shrink-0">
                        <button
                            type="button"
                            onClick={() => setActiveTab('compat')}
                            className={`py-2 px-3 text-center border-r border-slate-300 transition-colors ${
                                activeTab === 'compat'
                                    ? 'bg-white text-[var(--foreground)] font-bold border-b-2 border-b-[var(--primary)]'
                                    : 'text-slate-600 hover:text-[var(--foreground)]'
                            }`}
                        >
                            {activeProductId || focal ? copy.tabCompatPdp : copy.tabCompatHome}
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('chat')}
                            className={`py-2 px-3 text-center transition-colors ${
                                activeTab === 'chat'
                                    ? 'bg-white text-[var(--foreground)] font-bold border-b-2 border-b-[var(--primary)]'
                                    : 'text-slate-600 hover:text-[var(--foreground)]'
                            }`}
                        >
                            {copy.tabChat(agentName, messages.length)}
                        </button>
                    </div>

                    {activeTab === 'compat' && (
                        <div
                            onWheel={(e) => e.stopPropagation()}
                            onTouchMove={(e) => e.stopPropagation()}
                            className="p-3.5 flex-1 min-h-0 overflow-y-auto overscroll-contain scroll-smooth pr-1 space-y-3 text-xs"
                        >
                            <form onSubmit={handleSkuSearch} className="flex gap-1.5">
                                <div className="relative flex-1">
                                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                    <input
                                        type="text"
                                        value={skuQuery}
                                        onChange={(e) => setSkuQuery(e.target.value)}
                                        placeholder={copy.skuPlaceholder}
                                        className="w-full bg-white border border-slate-300 pl-8 pr-2.5 py-2 rounded-sm text-xs focus:outline-none focus:border-[var(--secondary)]"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    className="bg-[var(--foreground)] text-white font-mono text-xs uppercase px-3 py-2 rounded-sm hover:bg-[var(--primary)] transition-colors shrink-0 font-bold"
                                >
                                    {copy.findBtn}
                                </button>
                            </form>

                            {compatLoading && (
                                <div className="py-6 text-center font-mono text-xs text-slate-600">
                                    {copy.checkingCompat}
                                </div>
                            )}

                            {!compatLoading && !focal && (
                                <div className="space-y-2.5">
                                    <div className="flex items-center justify-between">
                                        <span className="font-display text-sm font-bold text-[var(--foreground)]">
                                            {copy.whatSelectingToday}
                                        </span>
                                        <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--secondary)] font-bold">
                                            {copy.fourWizardsBadge}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-1 gap-2">
                                        {copy.visualCards.map((card) => {
                                            const IconComp = card.icon;
                                            return (
                                                <Link
                                                    key={card.href}
                                                    href={card.href}
                                                    onClick={() => setOpen(false)}
                                                    className="group bg-white border border-slate-300 hover:border-[var(--secondary)] rounded-sm p-2.5 flex items-center justify-between gap-3 transition-all shadow-2xs"
                                                >
                                                    <div className="flex items-start gap-2.5 min-w-0">
                                                        <span
                                                            aria-hidden="true"
                                                            className="w-8 h-8 rounded-sm bg-[var(--muted)] border border-slate-200 flex items-center justify-center text-[var(--secondary)] shrink-0"
                                                        >
                                                            <IconComp className="w-4 h-4" />
                                                        </span>
                                                        <div className="min-w-0">
                                                            <div className="font-display text-xs font-bold text-[var(--foreground)] group-hover:text-[var(--primary)] truncate">
                                                                {card.title}
                                                            </div>
                                                            <p className="text-xs text-slate-600 leading-snug mt-0.5">
                                                                {card.desc}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <ArrowRight className="w-4 h-4 text-[var(--secondary)] group-hover:text-[var(--primary)] shrink-0" />
                                                </Link>
                                            );
                                        })}
                                    </div>

                                    <div className="pt-1 flex items-center justify-between gap-2 text-xs">
                                        <Link
                                            href="/uzklausa"
                                            onClick={() => setOpen(false)}
                                            className="font-mono text-[var(--secondary)] font-bold hover:underline"
                                        >
                                            {copy.uploadBoqCta}
                                        </Link>
                                    </div>
                                </div>
                            )}

                            {!compatLoading && focal && compatData && (
                                <div className="space-y-3">
                                    <div className="bg-white border border-slate-300 p-2.5 rounded-sm flex items-center gap-3">
                                        <div className="w-12 h-12 shrink-0 rounded-xs border border-slate-200 bg-white p-1 flex items-center justify-center overflow-hidden">
                                            <img
                                                src={assetUrl(focalImage)}
                                                alt={focal.name}
                                                className="w-full h-full object-contain"
                                            />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center justify-between gap-1.5">
                                                <span className="font-mono text-[10px] uppercase tracking-wider bg-[var(--foreground)] text-white px-1.5 py-0.5 rounded-xs truncate">
                                                    SKU: {focal.sku}
                                                </span>
                                                <span className="font-mono text-xs font-extrabold text-[var(--foreground)] shrink-0">
                                                    {focal.price.toFixed(2).replace('.', ',')} €
                                                </span>
                                            </div>
                                            <div className="font-display text-xs font-bold text-[var(--foreground)] mt-1 line-clamp-1">
                                                {focal.name}
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <div className="font-mono text-xs uppercase tracking-wider font-bold text-[var(--foreground)] mb-1.5">
                                            {copy.compatiblePartsHeading(Math.min(compatData.compatibleProducts.length, 3))}
                                        </div>
                                        <div className="space-y-2">
                                            {compatData.compatibleProducts.slice(0, 3).map((cp) => {
                                                const cpImg = resolveProductImageUrl({
                                                    sku: cp.sku,
                                                    title: cp.name,
                                                    brand: cp.attributes?.brand,
                                                    imageUrl: cp.image,
                                                });
                                                const badgeText = buildCompactCompatBadge(cp);
                                                return (
                                                    <div
                                                        key={cp.id}
                                                        className="bg-white border border-slate-300 p-2.5 rounded-sm hover:border-[var(--secondary)] transition-colors flex items-center gap-3"
                                                    >
                                                        <Link
                                                            href={cp.url}
                                                            className="w-14 h-14 shrink-0 rounded-xs border border-slate-200 bg-white p-1 flex items-center justify-center overflow-hidden"
                                                        >
                                                            <img
                                                                src={assetUrl(cpImg)}
                                                                alt={cp.name}
                                                                className="w-full h-full object-contain"
                                                            />
                                                        </Link>
                                                        <div className="min-w-0 flex-1">
                                                            <div className="flex items-start justify-between gap-2">
                                                                <Link
                                                                    href={cp.url}
                                                                    className="font-display text-xs font-bold text-[var(--foreground)] hover:text-[var(--primary)] line-clamp-2 leading-snug"
                                                                >
                                                                    {cp.name}
                                                                </Link>
                                                                <span className="font-mono text-xs font-extrabold text-[var(--foreground)] shrink-0">
                                                                    {cp.price.toFixed(2).replace('.', ',')} €
                                                                </span>
                                                            </div>
                                                            <div className="mt-1 flex items-center justify-between gap-2">
                                                                <span className="inline-flex items-center gap-1 font-mono text-[10px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-xs truncate">
                                                                    <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                                                                    <span className="truncate">{badgeText}</span>
                                                                </span>
                                                                <Link
                                                                    href={cp.url}
                                                                    className="font-mono text-xs text-[var(--secondary)] font-bold hover:underline shrink-0"
                                                                >
                                                                    {copy.openItemCta}
                                                                </Link>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'chat' && (
                        <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
                            <div
                                data-testid="vytautas-client-system-map"
                                className="bg-slate-50 border-b border-slate-200 px-3.5 py-2 shrink-0 space-y-1 text-xs"
                            >
                                <div className="flex items-center justify-between gap-2">
                                    <span className="font-bold text-slate-800">
                                        {copy.systemMapTitle}
                                    </span>
                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-xs text-[10px] font-bold bg-emerald-50 text-emerald-900 border border-emerald-200">
                                        {locale === 'lt' ? systemMap.stageLabel : copy.defaultStageLabel}
                                    </span>
                                </div>
                                <div className="grid grid-cols-3 gap-1.5 text-[10px] text-slate-700">
                                    <div className="bg-white border border-slate-200 rounded-xs px-1.5 py-1 truncate" title={systemMap.nodeLabel}>
                                        <span className="font-semibold text-slate-500">{copy.nodeLabelPrefix}</span>
                                        <span className="font-bold text-slate-900">{systemMap.nodeLabel}</span>
                                    </div>
                                    <div className="bg-white border border-slate-200 rounded-xs px-1.5 py-1 truncate" title={systemMap.powerOrAreaLabel}>
                                        <span className="font-semibold text-slate-500">{copy.powerAreaLabelPrefix}</span>
                                        <span className="font-bold text-slate-900">{systemMap.powerOrAreaLabel}</span>
                                    </div>
                                    <div className="bg-white border border-slate-200 rounded-xs px-1.5 py-1 truncate" title={systemMap.connectionOrTypeLabel}>
                                        <span className="font-semibold text-slate-500">{copy.connectionLabelPrefix}</span>
                                        <span className="font-bold text-slate-900">{systemMap.connectionOrTypeLabel}</span>
                                    </div>
                                </div>
                                <div className="pt-1 flex items-center justify-between gap-2">
                                    <button
                                        type="button"
                                        data-testid="vytautas-lead-capture-toggle"
                                        onClick={() => setLeadFormOpen((v) => !v)}
                                        className="w-full py-1 px-2.5 rounded-xs border border-slate-300 bg-white hover:border-[var(--primary)] text-xs font-bold text-[var(--foreground)] flex items-center justify-between transition-colors"
                                    >
                                        <span>{copy.leaveEmailCta}</span>
                                        <span className="font-mono text-xs text-[var(--primary)]">
                                            {leadFormOpen ? copy.closeToggle : copy.openToggle}
                                        </span>
                                    </button>
                                </div>
                                {leadFormOpen && (
                                    <form
                                        data-testid="vytautas-lead-capture-form"
                                        onSubmit={handleEngineeringLeadSubmit}
                                        className="mt-1.5 p-2.5 bg-white border border-slate-300 rounded-xs space-y-2"
                                    >
                                        {leadReceipt ? (
                                            <div className="text-xs text-emerald-900 bg-emerald-50 border border-emerald-200 p-2 rounded-xs space-y-1">
                                                <div className="font-bold">
                                                    {copy.leadSentHeading(leadReceipt)}
                                                </div>
                                                <div>
                                                    {copy.leadSentBody}
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="text-xs text-slate-700 font-medium">
                                                    {copy.leadFormIntro}
                                                </div>
                                                <div className="grid grid-cols-2 gap-1.5">
                                                    <input
                                                        type="text"
                                                        value={leadName}
                                                        onChange={(e) => setLeadName(e.target.value)}
                                                        placeholder={copy.leadNamePlaceholder}
                                                        className="bg-white border border-slate-300 px-2 py-1 rounded-xs text-xs"
                                                    />
                                                    <input
                                                        type="text"
                                                        value={leadCity}
                                                        onChange={(e) => setLeadCity(e.target.value)}
                                                        placeholder={copy.leadCityPlaceholder}
                                                        className="bg-white border border-slate-300 px-2 py-1 rounded-xs text-xs"
                                                    />
                                                </div>
                                                <div className="flex gap-1.5">
                                                    <input
                                                        type="email"
                                                        value={leadContact}
                                                        onChange={(e) => setLeadContact(e.target.value)}
                                                        placeholder={copy.leadEmailPlaceholder}
                                                        className="flex-1 bg-white border border-slate-300 px-2 py-1 rounded-xs text-xs"
                                                    />
                                                    <button
                                                        type="submit"
                                                        disabled={leadSubmitting}
                                                        className="bg-[var(--primary)] text-white px-2.5 py-1 rounded-xs text-xs font-bold hover:bg-[var(--brand-accent-hover)] disabled:opacity-50 shrink-0"
                                                    >
                                                        {leadSubmitting ? copy.leadSubmitSending : copy.leadSubmitBtn}
                                                    </button>
                                                </div>
                                                {leadError && (
                                                    <div className="text-xs text-red-700 font-medium">
                                                        {leadError}
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </form>
                                )}
                            </div>

                            <div
                                onWheel={(e) => e.stopPropagation()}
                                onTouchMove={(e) => e.stopPropagation()}
                                className="p-3.5 flex-1 min-h-0 overflow-y-auto overscroll-contain scroll-smooth pr-1 space-y-2.5 text-xs"
                            >
                                {messages.map((m, idx) => {
                                    const normalized =
                                        m.role === 'assistant'
                                            ? normalizeMessageProseAndExtractCards(m.content, m.suggestedProducts)
                                            : { cleanText: m.content, products: [] };
                                    return (
                                        <div
                                            key={idx}
                                            className={`p-3 rounded-sm leading-relaxed ${
                                                m.role === 'user'
                                                    ? 'bg-[var(--foreground)] text-white ml-6 whitespace-pre-line'
                                                    : 'bg-white border border-slate-200 text-[var(--foreground)] mr-2 space-y-2.5'
                                            }`}
                                        >
                                            <div className="text-xs font-semibold opacity-75 mb-1">
                                                {m.role === 'user' ? copy.youLabel : copy.headerTitle(agentName)}
                                            </div>
                                            {m.role === 'user' ? (
                                                <div>{m.content}</div>
                                            ) : (
                                                <StructuredMessageContent content={normalized.cleanText} />
                                            )}

                                            {m.role === 'assistant' &&
                                                Array.isArray(m.quickReplies) &&
                                                m.quickReplies.length > 0 && (
                                                    <div
                                                        data-testid="vytautas-quick-replies"
                                                        className="pt-2 border-t border-slate-200/80 flex flex-wrap gap-1.5"
                                                    >
                                                        {m.quickReplies.map((qr) => (
                                                            <button
                                                                key={qr}
                                                                type="button"
                                                                data-testid="vytautas-quick-reply-chip"
                                                                disabled={sending}
                                                                onClick={() => void sendChatQuestion(qr)}
                                                                className="text-left text-xs font-medium px-2.5 py-1 rounded-xs border border-slate-300 bg-slate-50 hover:bg-white hover:border-[var(--primary)] text-slate-800 transition-colors"
                                                            >
                                                                {qr}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}

                                            {m.role === 'assistant' &&
                                                Array.isArray(m.suggestedProducts) &&
                                                m.suggestedProducts.length > 0 &&
                                                normalized.products.length > 0 && (
                                                    <div
                                                        data-testid="vytautas-chat-product-cards"
                                                        className="pt-2 border-t border-slate-200 space-y-2"
                                                    >
                                                        <div className="text-xs font-bold text-[var(--foreground)]">
                                                            {copy.recommendedProductsHeading(normalized.products.length)}
                                                        </div>
                                                        <div className="space-y-2">
                                                            {normalized.products.map((prod) => {
                                                                const displayTitle = formatCleanChatCardTitle(
                                                                    prod.title || prod.name,
                                                                    prod.sku,
                                                                );
                                                                const brandInfo = resolveBrandLogo(
                                                                    prod.brandName,
                                                                    `${prod.sku || ''} ${displayTitle}`,
                                                                );
                                                                const logoSrc = prod.brandLogoUrl || brandInfo.logoPath;
                                                                const resolvedImg =
                                                                    prod.imageUrl ||
                                                                    resolveProductImageUrl({
                                                                        sku: prod.sku,
                                                                        title: displayTitle,
                                                                        brand: prod.brandName || brandInfo.name,
                                                                        imageUrl: prod.image,
                                                                    });
                                                                const displayPrice =
                                                                    prod.formattedPrice ||
                                                                    `${Number(prod.price || 0).toFixed(2).replace('.', ',')} €`;
                                                                const productHref = prod.url || `/products/${prod.id}`;

                                                                return (
                                                                    <div
                                                                        key={`${prod.id}-${prod.sku || ''}`}
                                                                        data-testid="vytautas-product-card"
                                                                        className="bg-[var(--background)] border border-slate-200 hover:border-slate-400 rounded-sm p-2.5 transition-colors space-y-2"
                                                                    >
                                                                        <div className="flex items-start gap-2.5">
                                                                            <Link
                                                                                href={productHref}
                                                                                onClick={() => setOpen(false)}
                                                                                className="w-16 h-16 shrink-0 rounded-xs border border-slate-200 bg-white p-1 flex items-center justify-center overflow-hidden"
                                                                            >
                                                                                <img
                                                                                    src={assetUrl(resolvedImg)}
                                                                                    alt={displayTitle}
                                                                                    className="w-full h-full object-contain"
                                                                                />
                                                                            </Link>
                                                                            <div className="min-w-0 flex-1 space-y-1">
                                                                                <div className="flex flex-wrap items-center gap-1.5">
                                                                                    <img
                                                                                        src={assetUrl(logoSrc)}
                                                                                        alt={brandInfo.name}
                                                                                        className="h-3.5 w-auto object-contain shrink-0"
                                                                                    />
                                                                                    {prod.applicationRole && (
                                                                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-xs text-[10px] font-semibold bg-sky-50 text-sky-900 border border-sky-200 truncate">
                                                                                            {prod.applicationRole}
                                                                                        </span>
                                                                                    )}
                                                                                    {prod.sku && (
                                                                                        <span className="font-mono text-[10px] font-semibold text-slate-700 bg-white border border-slate-200 px-1.5 py-0.5 rounded-xs">
                                                                                            SKU: {prod.sku}
                                                                                        </span>
                                                                                    )}
                                                                                </div>
                                                                                <Link
                                                                                    href={productHref}
                                                                                    onClick={() => setOpen(false)}
                                                                                    className="block font-display text-xs font-bold text-[var(--foreground)] hover:text-[var(--primary)] leading-snug line-clamp-2"
                                                                                >
                                                                                    {displayTitle}
                                                                                </Link>
                                                                                {prod.keySpec && (
                                                                                    <div className="font-mono text-[10px] text-slate-600">
                                                                                        {prod.keySpec}
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        </div>

                                                                        <div className="pt-1.5 border-t border-slate-200/80 flex items-center justify-between gap-2">
                                                                            <div className="flex items-center gap-2">
                                                                                <span className="font-mono text-xs font-extrabold text-[var(--foreground)]">
                                                                                    {displayPrice}
                                                                                </span>
                                                                                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-800">
                                                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                                                                                    {copy.inStockBadge}
                                                                                </span>
                                                                            </div>
                                                                            <div className="flex items-center gap-1.5">
                                                                                <Link
                                                                                    href={productHref}
                                                                                    onClick={() => setOpen(false)}
                                                                                    className="px-2 py-1 rounded-xs border border-slate-300 bg-white hover:border-[var(--foreground)] text-xs font-semibold text-[var(--foreground)] transition-colors"
                                                                                >
                                                                                    {copy.openProductBtn}
                                                                                </Link>
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => {
                                                                                        addItemToCart({
                                                                                            id: prod.id,
                                                                                            productId: prod.id,
                                                                                            name: displayTitle,
                                                                                            price: Number(prod.price || 0),
                                                                                            sku: prod.sku || prod.id,
                                                                                            image: assetUrl(resolvedImg),
                                                                                        });
                                                                                        openCartDrawer();
                                                                                    }}
                                                                                    className="px-2.5 py-1 rounded-xs bg-[var(--primary)] hover:bg-[var(--brand-accent-hover)] text-white text-xs font-bold inline-flex items-center gap-1 transition-colors"
                                                                                >
                                                                                    <Plus className="w-3 h-3" />
                                                                                    {copy.addToCartBtn}
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                )}
                                        </div>
                                    );
                                })}
                                {sending && (
                                    <div className="bg-white border border-slate-200 p-2.5 rounded-sm text-xs font-mono text-slate-600">
                                        {copy.checkingMessage(agentName)}
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    void sendChatQuestion(inputMessage);
                                }}
                                className="p-2.5 border-t border-slate-200 bg-white flex gap-1.5 shrink-0"
                            >
                                <input
                                    type="text"
                                    value={inputMessage}
                                    onChange={(e) => setInputMessage(e.target.value)}
                                    placeholder={copy.chatInputPlaceholder}
                                    className="flex-1 bg-white border border-slate-300 px-2.5 py-1.5 rounded-sm text-xs text-[var(--foreground)] focus:outline-none focus:border-[var(--foreground)]"
                                />
                                <button
                                    type="submit"
                                    disabled={sending || !inputMessage.trim()}
                                    aria-label={copy.sendAria(agentName)}
                                    className="bg-[var(--primary)] text-white px-3 py-1.5 rounded-sm text-xs font-bold hover:bg-[var(--brand-accent-hover)] disabled:opacity-50 flex items-center gap-1 transition-colors"
                                >
                                    <Send className="w-3.5 h-3.5" />
                                </button>
                            </form>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
