'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLocale } from 'next-intl';
import { assetUrl } from '../../../lib/api';
import { resolveAppLocale } from '../../../i18n/storefront-ui-copy';
import type { AppLocale } from '../../../i18n/routing';

const MCP_HERO_PRODUCTS = [
    { sku: 'GILES-MPB', label: 'Gilės Inžinerija / Megatherm', img: '/images/brands/giles-inzinerija.svg' },
    { sku: 'DANFOSS-RA', label: 'Danfoss', img: '/images/brands/danfoss.svg' },
    { sku: 'HERZ-ARM', label: 'HERZ Armaturen', img: '/images/brands/herz.svg' },
    { sku: 'HAIER-R290', label: 'Haier HVAC', img: '/images/brands/haier.svg' },
    { sku: 'GORENJE-TIKI', label: 'Gorenje / TIKI', img: '/images/brands/gorenje.svg' },
    { sku: 'COMISA-PEX', label: 'Comisa', img: '/images/brands/comisa.svg' },
] as const;

interface McpJungtisCopy {
    kicker: string;
    title: string;
    subtitle: string;
    primaryCta: string;
    secondaryCta: string;
    modeSectionTitle: string;
    b2bModeBtn: string;
    personalModeBtn: string;
    b2bCardKicker: string;
    b2bCardTitle: string;
    b2bCardDesc: string;
    b2bToolsList: [string, string, string];
    personalCardKicker: string;
    personalCardTitle: string;
    personalCardDesc: string;
    personalToolsList: [string, string, string];
    configTitle: string;
    configSub: string;
    budgetLimitLabel: string;
    copyBtn: string;
    copiedBtn: string;
    sandboxTitle: string;
    sandboxSub: string;
    sandboxScenarioB2b: string;
    sandboxScenarioPersonal: string;
    sandboxRunBtn: string;
    sandboxOpenCartBtn: string;
    sandboxOpenB2bBtn: string;
    securityHeading: string;
    securitySub: string;
    securityLayers: Array<{ num: string; title: string; desc: string }>;
}

const PAGE_COPY: Record<AppLocale, McpJungtisCopy> = {
    lt: {
        kicker: 'UAB „GILĖS INŽINERIJA“ · MODEL CONTEXT PROTOCOL (MCP 2025-03-26)',
        title: 'Tiesioginė AI ir MCP pirkimų jungtis verslui bei namų statytojams',
        subtitle:
            'Prijunkite Claude Desktop, Cursor ar įmonės pirkimų asistentą prie 6 337 SKU katalogo ir Eigulių g. 21 sandėlio Kaune. Tikrinkite individualias B2B nuolaidas, skaičiuokite katilinių galią ir formuokite sąmatas.',
        primaryCta: 'Gauti B2B MCP raktą portale',
        secondaryCta: 'Atidaryti 6 337 prekių katalogą',
        modeSectionTitle: 'Pasirinkite prijungimo režimą pagal paskyros tipą',
        b2bModeBtn: 'Verslo paskyra (B2B įmonėms ir montuotojams)',
        personalModeBtn: 'Fizinio pirkėjo asistentas (Namų ūkiams)',
        b2bCardKicker: '1 LYGIS (80% SRAUTO) · B2B MONTUOTOJAMS, RANGOVAMS IR PROJEKTŲ VADOVAMS',
        b2bCardTitle: 'Verslo paskyra su individualia 3 lygių kainodara',
        b2bCardDesc:
            'Jūsų įmonės AI asistentas nuskaito statybos sąmatą arba objekto specifikaciją, patikrina tikslias Jūsų įmonės Danfoss, HERZ, Haier bei Megatherm nuolaidas (-35%..-52%) ir sukuria objekto sąmatą arba B2B užsakymą.',
        b2bToolsList: [
            'customer_b2b_catalog_and_my_prices – 6 337 SKU paieška su Jūsų gamintojų, sutartinių SKU ir krepšelio apimties nuolaidomis bei Kauno sandėlio likučiu',
            'customer_b2b_order_or_project_draft – objekto sąmatos (Objekto sąmata) arba išankstinės „Skaita“ sąskaitos sukūrimas su biudžeto limito saugikliu',
            'vytautas_engineering_consult – EN 12828 katilinės hidraulikos, degiklių flanšų ir pavarų suderinamumo patikra',
        ],
        personalCardKicker: '2 LYGIS (20% SRAUTO) · INDIVIDUALIEMS STATYTOJAMS IR NAMŲ ŪKIAMS',
        personalCardTitle: 'Asmeninis AI šildymo asistentas namų katilinei',
        personalCardDesc:
            'Statote ar atnaujinate namo šildymo sistemą? Asmeninis AI asistentas apskaičiuoja šilumos nuostolius, parenka suderintą katilą, granulių degiklį ar radiatorius ir sugeneruoja paruošto krepšelio nuorodą.',
        personalToolsList: [
            'vytautas_engineering_consult – šilumos nuostolių, katilo kW, išsiplėtimo indo ir radiatorių parinkimas pagal namo plotą',
            'customer_personal_cart_assemble – suderinto šildymo komplekto surinkimas su automatine 5+ / 10+ vnt. kiekio nuolaida',
            'Tiesioginė krepšelio nuoroda (/lt/krepselis?import_skus=...) – apmokėjimą visada saugiai patvirtinate naršyklėje',
        ],
        configTitle: 'Kliento MCP konfigūracijos generatorius (claude_desktop_config.json / HTTP JSON-RPC)',
        configSub:
            'Nukopijuokite paruoštą konfigūraciją į Claude Desktop, Cursor arba savo įmonės AI agento nustatymus.',
        budgetLimitLabel: 'Maks. automatinio B2B užsakymo limitas be papildomo patvirtinimo (€ be PVM):',
        copyBtn: 'Kopijuoti MCP JSON konfigūraciją',
        copiedBtn: 'Nukopijuota į iškarpinę',
        sandboxTitle: 'Interaktyvi kliento MCP smėliadėžė (gyvas įrankių išbandymas)',
        sandboxSub:
            'Išbandykite, kaip AI asistentas per POST /api/mcp tikrina individualias B2B kainas arba surenka namo katilinės krepšelį.',
        sandboxScenarioB2b:
            'Scenarijus B2B: Patikrinti Danfoss 013G2990 (10 vnt.) ir Gilės ZV 100 (2 vnt.) individualią B2B kainą bei sukurti objekto sąmatą „Aleksoto kotedžai“',
        sandboxScenarioPersonal:
            'Scenarijus Namų ūkiui: Surinkti 35 kW granulių degiklio komplektą (MPB-NANI-35) ir 6 vnt. Danfoss RA 2990 galvučių į paruoštą krepšelį',
        sandboxRunBtn: 'Vykdyti MCP asistento užklausą',
        sandboxOpenCartBtn: 'Atidaryti AI paruoštą krepšelį',
        sandboxOpenB2bBtn: 'Atidaryti B2B portalą',
        securityHeading: '4 sluoksnių kliento MCP saugumo sutartis',
        securitySub:
            'Kiekvienas kliento MCP raktas veikia griežtai izoliuotoje teisių erdvėje (RBAC) ir negali pasiekti kitų pirkėjų ar vidinio administravimo.',
        securityLayers: [
            {
                num: '01 / IZOLIACIJA',
                title: 'Paskyrų izoliacija',
                desc: 'Kliento MCP raktas mato tik savo įmonės individualias kainas, projektus ir sąskaitas, niekada nemato kitų klientų ar vidinio Admin.',
            },
            {
                num: '02 / BIUDŽETO SAUGIKLIS',
                title: 'Sąmatos ir biudžeto limitas',
                desc: 'Galite nustatyti maks. užsakymo sumą € be papildomo patvirtinimo. Viršijus ribą, asistentas paruošia sąmatą Jūsų 1 paspaudimo patvirtinimui.',
            },
            {
                num: '03 / SAUGUS APMOKĖJIMAS',
                title: 'Saugus apmokėjimas naršyklėje',
                desc: 'Asmeninis AI asistentas tik suruošia krepšelį ir nuorodą, o apmokėjimą per Montonio, Paysera ar Stripe visada patvirtina pats pirkėjas.',
            },
            {
                num: '04 / AUDITO ŽURNALAS',
                title: 'Pilnas audito žurnalas',
                desc: 'Kiekvienas AI asistento veiksmas (kainų užklausa, sukurta sąmata ar užsakymas) fiksuojamas su laiko žyma ir matomas Jūsų B2B paskyroje.',
            },
        ],
    },
    en: {
        kicker: 'UAB GILĖS INŽINERIJA · MODEL CONTEXT PROTOCOL (MCP 2025-03-26)',
        title: 'Direct AI & MCP Purchasing Bridge for Business and Homebuilders',
        subtitle:
            'Connect Claude Desktop, Cursor, or your company purchasing agent to our 6,337-SKU catalog and Kaunas warehouse (Eigulių g. 21). Query custom B2B discounts, run heat-loss calculations, and build project quotes.',
        primaryCta: 'Get B2B MCP Key in Portal',
        secondaryCta: 'Browse 6,337 Catalog Items',
        modeSectionTitle: 'Select connection mode by account tier',
        b2bModeBtn: 'Business Account (B2B Contractors & Installers)',
        personalModeBtn: 'Personal Buyer Assistant (Households)',
        b2bCardKicker: 'TIER 1 (80% FOCUS) · FOR B2B INSTALLERS, CONTRACTORS & PROJECT MANAGERS',
        b2bCardTitle: 'Business Account with Custom 3-Layer Pricing',
        b2bCardDesc:
            'Your company AI assistant reads a bill of materials or room spec, checks your exact Danfoss, HERZ, Haier, and Megatherm contract discounts (-35%..-52%), and creates a project quote or B2B order.',
        b2bToolsList: [
            'customer_b2b_catalog_and_my_prices – 6,337-SKU search with your brand, contract SKU, and cart volume discounts plus live Kaunas stock',
            'customer_b2b_order_or_project_draft – create a project quote or proforma Skaita invoice in your account with maxAutoOrderEur protection',
            'vytautas_engineering_consult – EN 12828 boiler room hydraulics, burner flange, and actuator compatibility check',
        ],
        personalCardKicker: 'TIER 2 (20% FOCUS) · FOR HOMEBUILDERS & PRIVATE HOUSEHOLDS',
        personalCardTitle: 'Personal AI Heating Assistant for Home Boiler Rooms',
        personalCardDesc:
            'Building or upgrading a residential heating system? Your personal AI assistant calculates heat loss, selects a compatible boiler, pellet burner, or radiators, and generates a ready-to-review cart link.',
        personalToolsList: [
            'vytautas_engineering_consult – heat-loss, boiler kW, expansion vessel, and radiator sizing for your house floor area',
            'customer_personal_cart_assemble – assemble a validated heating kit with automatic 5+ / 10+ unit quantity discounts',
            'Direct checkout link (/en/krepselis?import_skus=...) – you always review and confirm payment safely in your browser',
        ],
        configTitle: 'Customer MCP Configuration Generator (claude_desktop_config.json / HTTP JSON-RPC)',
        configSub:
            'Copy this ready-to-use configuration into Claude Desktop, Cursor, or your company AI agent settings.',
        budgetLimitLabel: 'Max automatic B2B order limit without extra approval (EUR excl. VAT):',
        copyBtn: 'Copy MCP JSON Configuration',
        copiedBtn: 'Copied to Clipboard',
        sandboxTitle: 'Interactive Customer MCP Sandbox (Live Tool Execution)',
        sandboxSub:
            'Test how an AI assistant checks custom B2B prices or assembles a residential boiler room cart via POST /api/mcp.',
        sandboxScenarioB2b:
            'B2B Scenario: Check custom B2B pricing for Danfoss 013G2990 (10 pcs) & Gilės ZV 100 (2 pcs) and create project quote "Aleksotas Townhomes"',
        sandboxScenarioPersonal:
            'Household Scenario: Assemble a 35 kW pellet burner kit (MPB-NANI-35) and 6x Danfoss RA 2990 heads into a pre-built cart URL',
        sandboxRunBtn: 'Run MCP Assistant Request',
        sandboxOpenCartBtn: 'Open AI Pre-Built Cart',
        sandboxOpenB2bBtn: 'Open B2B Portal',
        securityHeading: '4-Layer Customer MCP Security Contract',
        securitySub:
            'Every customer MCP key operates in a strictly isolated role scope (RBAC) and can never access other buyers or internal administration.',
        securityLayers: [
            {
                num: '01 / ISOLATION',
                title: 'Strict Account Isolation',
                desc: 'A customer MCP key sees only its own company pricing, projects, and invoices, and never accesses other clients or internal Admin tools.',
            },
            {
                num: '02 / BUDGET CAP',
                title: 'Quote & Spend Limit Guardrail',
                desc: 'Set a maximum EUR order limit without extra confirmation. Above that limit, the assistant saves a draft quote for your 1-click approval.',
            },
            {
                num: '03 / SAFE CHECKOUT',
                title: 'Browser-Verified Payment',
                desc: 'Personal AI assistants only prepare the cart link; payment via Montonio, Paysera, or Stripe is always confirmed by the buyer in the browser.',
            },
            {
                num: '04 / AUDIT TRAIL',
                title: 'Full Audit Log',
                desc: 'Every AI assistant action (price query, project quote, or order draft) is timestamped and visible inside your B2B portal.',
            },
        ],
    },
    pl: {
        kicker: 'UAB GILĖS INŽINERIJA · MODEL CONTEXT PROTOCOL (MCP 2025-03-26)',
        title: 'Bezpośrednie złącze zakupowe AI i MCP dla firm oraz inwestorów indywidualnych',
        subtitle:
            'Połącz Claude Desktop, Cursor lub firmowego agenta zakupowego z katalogiem 6 337 SKU i magazynem w Kownie (ul. Eigulių 21). Sprawdzaj indywidualne rabaty B2B, obliczaj moc kotłowni i twórz kosztorysy.',
        primaryCta: 'Pobierz klucz B2B MCP w portalu',
        secondaryCta: 'Przeglądaj katalog 6 337 produktów',
        modeSectionTitle: 'Wybierz tryb połączenia według typu konta',
        b2bModeBtn: 'Konto firmowe (Dla firm B2B i instalatorów)',
        personalModeBtn: 'Asystent kupującego (Dla domów jednorodzinnych)',
        b2bCardKicker: 'POZIOM 1 (80% RUCHU) · DLA INSTALATORÓW, WYKONAWCÓW I KIEROWNIKÓW PROJEKTÓW',
        b2bCardTitle: 'Konto B2B z indywidualną 3-poziomową polityką cenową',
        b2bCardDesc:
            'Firmowy asystent AI odczytuje zestawienie materiałów budowlanych, sprawdza dokładne rabaty na Danfoss, HERZ, Haier i Megatherm (-35%..-52%) oraz tworzy kosztorys projektu lub zamówienie B2B.',
        b2bToolsList: [
            'customer_b2b_catalog_and_my_prices – wyszukiwanie w 6 337 SKU z indywidualnymi rabatami marki, SKU i koszyka oraz stanem w Kownie',
            'customer_b2b_order_or_project_draft – tworzenie kosztorysu inwestycji lub faktury proforma Skaita z limitem budżetu maxAutoOrderEur',
            'vytautas_engineering_consult – weryfikacja hydrauliki kotłowni EN 12828, flansz palników i siłowników',
        ],
        personalCardKicker: 'POZIOM 2 (20% RUCHU) · DLA INWESTORÓW INDYWIDUALNYCH I DOMÓW',
        personalCardTitle: 'Osobisty asystent grzewczy AI dla domowej kotłowni',
        personalCardDesc:
            'Budujesz lub modernizujesz ogrzewanie domu? Twój osobisty asystent AI oblicza straty ciepła, dobiera kompatybilny kocioł, palnik peletowy lub grzejniki i generuje link do gotowego koszyka.',
        personalToolsList: [
            'vytautas_engineering_consult – dobór mocy kotła kW, naczynia wzbiorczego i grzejników według powierzchni domu',
            'customer_personal_cart_assemble – kompletacja sprawdzonego zestawu grzewczego z automatycznym rabatem ilościowym 5+ / 10+ szt.',
            'Bezpośredni link do koszyka (/pl/krepselis?import_skus=...) – płatność zawsze potwierdzasz bezpiecznie w przeglądarce',
        ],
        configTitle: 'Generator konfiguracji MCP klienta (claude_desktop_config.json / HTTP JSON-RPC)',
        configSub:
            'Skopiuj gotową konfigurację do ustawień Claude Desktop, Cursor lub firmowego agenta zakupowego.',
        budgetLimitLabel: 'Maks. limit automatycznego zamówienia B2B bez dodatkowej zgody (EUR netto):',
        copyBtn: 'Kopiuj konfigurację MCP JSON',
        copiedBtn: 'Skopiowano do schowka',
        sandboxTitle: 'Interaktywna piaskownica MCP klienta (test narzędzi na żywo)',
        sandboxSub:
            'Sprawdź, jak asystent AI przez POST /api/mcp pobiera indywidualne ceny B2B lub kompletuje koszyk kotłowni domowej.',
        sandboxScenarioB2b:
            'Scenariusz B2B: Sprawdź indywidualną cenę B2B dla Danfoss 013G2990 (10 szt.) i Gilės ZV 100 (2 szt.) oraz utwórz kosztorys „Szeregówki Aleksotas”',
        sandboxScenarioPersonal:
            'Scenariusz Domowy: Skompletuj zestaw palnika 35 kW (MPB-NANI-35) oraz 6 szt. głowic Danfoss RA 2990 w gotowy link koszyka',
        sandboxRunBtn: 'Wykonaj zapytanie asystenta MCP',
        sandboxOpenCartBtn: 'Otwórz gotowy koszyk AI',
        sandboxOpenB2bBtn: 'Otwórz portal B2B',
        securityHeading: '4-warstwowy kontrakt bezpieczeństwa MCP klienta',
        securitySub:
            'Każdy klucz MCP klienta działa w ściśle izolowanym zakresie uprawnień (RBAC) i nie ma dostępu do innych klientów ani panelu Admin.',
        securityLayers: [
            {
                num: '01 / IZOLACJA',
                title: 'Izolacja kont',
                desc: 'Klucz MCP klienta widzi wyłącznie indywidualne ceny, projekty i zamówienia własnej firmy, nigdy innych klientów ani Admina.',
            },
            {
                num: '02 / LIMIT BUDŻETU',
                title: 'Limit kosztorysu i budżetu',
                desc: 'Możesz ustawić maks. kwotę zamówienia EUR bez dodatkowego potwierdzenia. Powyżej limitu asystent zapisuje wersję roboczą do akceptacji.',
            },
            {
                num: '03 / BEZPIECZNA PŁATNOŚĆ',
                title: 'Bezpieczna płatność w przeglądarce',
                desc: 'Osobisty agent AI tylko przygotowuje koszyk, a płatność przez Montonio, Paysera lub Stripe zawsze zatwierdza sam kupujący.',
            },
            {
                num: '04 / DZIENNIK AUDYTU',
                title: 'Pełny dziennik audytu',
                desc: 'Każda operacja asystenta AI (zapytanie cenowe, utworzony kosztorys lub zamówienie) jest widoczna na Twoim koncie B2B.',
            },
        ],
    },
    ru: {
        kicker: 'UAB «GILĖS INŽINERIJA» · MODEL CONTEXT PROTOCOL (MCP 2025-03-26)',
        title: 'Прямой закупочный мост AI и MCP для бизнеса и частных застройщиков',
        subtitle:
            'Подключите Claude Desktop, Cursor или корпоративного агента закупок к каталогу из 6 337 SKU и складу в Каунасе (ул. Эйгулю 21). Проверяйте индивидуальные B2B скидки, рассчитывайте мощность котельных и формируйте сметы.',
        primaryCta: 'Получить B2B MCP-ключ в портале',
        secondaryCta: 'Открыть каталог 6 337 товаров',
        modeSectionTitle: 'Выберите режим подключения по типу аккаунта',
        b2bModeBtn: 'Бизнес-аккаунт (Для B2B компаний и монтажников)',
        personalModeBtn: 'Ассистент покупателя (Для частных домов)',
        b2bCardKicker: 'УРОВЕНЬ 1 (80% ПОТОКА) · ДЛЯ МОНТАЖНИКОВ, ПОДРЯДЧИКОВ И РУКОВОДИТЕЛЕЙ ПРОЕКТОВ',
        b2bCardTitle: 'Бизнес-аккаунт с индивидуальным 3-уровневым ценообразованием',
        b2bCardDesc:
            'Корпоративный AI-ассистент читает спецификацию объекта, проверяет точные скидки вашей компании на Danfoss, HERZ, Haier и Megatherm (-35%..-52%) и создает объектную смету или B2B заказ.',
        b2bToolsList: [
            'customer_b2b_catalog_and_my_prices – поиск по 6 337 SKU с учетом ваших скидок по брендам, спеццен SKU и объема корзины + остатки в Каунасе',
            'customer_b2b_order_or_project_draft – создание объектной сметы или предварительного счета Skaita с защитным лимитом maxAutoOrderEur',
            'vytautas_engineering_consult – проверка гидравлики котельной EN 12828, фланцев горелок и автоматики',
        ],
        personalCardKicker: 'УРОВЕНЬ 2 (20% ПОТОКА) · ДЛЯ ЧАСТНЫХ ЗАСТРОЙЩИКОВ И ДОМОХОЗЯЙСТВ',
        personalCardTitle: 'Личный AI-ассистент отопления для домашней котельной',
        personalCardDesc:
            'Строите или модернизируете котельную дома? Личный AI-ассистент рассчитывает теплопотери, подбирает совместимый котел, пеллетную горелку или радиаторы и формирует ссылку на готовую корзину.',
        personalToolsList: [
            'vytautas_engineering_consult – подбор мощности котла кВт, расширительного бака и радиаторов по площади дома',
            'customer_personal_cart_assemble – сборка проверенного комплекта отопления с автоматической скидкой на количество 5+ / 10+ шт.',
            'Прямая ссылка на корзину (/ru/krepselis?import_skus=...) – оплату всегда безопасно подтверждает сам покупатель в браузере',
        ],
        configTitle: 'Генератор MCP-конфигурации клиента (claude_desktop_config.json / HTTP JSON-RPC)',
        configSub:
            'Скопируйте готовую конфигурацию в настройки Claude Desktop, Cursor или корпоративного AI-агента.',
        budgetLimitLabel: 'Макс. лимит автоматического B2B заказа без доп. подтверждения (EUR без НДС):',
        copyBtn: 'Скопировать MCP JSON конфигурацию',
        copiedBtn: 'Скопировано в буфер обмена',
        sandboxTitle: 'Интерактивная MCP-песочница клиента (живой тест инструментов)',
        sandboxSub:
            'Протестируйте, как AI-ассистент через POST /api/mcp проверяет индивидуальные B2B цены или собирает корзину домашней котельной.',
        sandboxScenarioB2b:
            'Сценарий B2B: Проверить индивидуальную B2B цену на Danfoss 013G2990 (10 шт.) и Gilės ZV 100 (2 шт.) и создать смету «Таунхаусы Алексотас»',
        sandboxScenarioPersonal:
            'Сценарий для дома: Собрать комплект пеллетной горелки 35 кВт (MPB-NANI-35) и 6 шт. термоголовок Danfoss RA 2990 в готовую корзину',
        sandboxRunBtn: 'Выполнить запрос MCP-ассистента',
        sandboxOpenCartBtn: 'Открыть собранную AI корзину',
        sandboxOpenB2bBtn: 'Открыть B2B портал',
        securityHeading: '4-уровневый контракт безопасности клиентского MCP',
        securitySub:
            'Каждый клиентский MCP-ключ работает в строго изолированной области прав (RBAC) и никогда не имеет доступа к другим клиентам или внутреннему Admin.',
        securityLayers: [
            {
                num: '01 / ИЗОЛЯЦИЯ',
                title: 'Изоляция аккаунтов',
                desc: 'Клиентский MCP-ключ видит только индивидуальные цены, проекты и заказы своей компании и никогда не видит других клиентов или внутренний Admin.',
            },
            {
                num: '02 / ЛИМИТ БЮДЖЕТА',
                title: 'Лимит сметы и бюджета',
                desc: 'Вы можете задать макс. сумму заказа в EUR без дополнительного подтверждения. При превышении лимита ассистент сохраняет черновик сметы.',
            },
            {
                num: '03 / БЕЗОПАСНАЯ ОПЛАТА',
                title: 'Безопасная оплата в браузере',
                desc: 'Личный агент только подготавливает корзину, а оплату через Montonio, Paysera или Stripe всегда подтверждает сам покупатель.',
            },
            {
                num: '04 / ЖУРНАЛ АУДИТА',
                title: 'Полный журнал аудита',
                desc: 'Каждое действие AI-ассистента (запрос цен, созданная смета или заказ) фиксируется и отображается в вашем B2B аккаунте.',
            },
        ],
    },
};

const TIER0_MOAT_COPY: Record<
    AppLocale,
    {
        kicker: string;
        title: string;
        desc: string;
        manifestLabel: string;
        tools: [string, string, string];
    }
> = {
    lt: {
        kicker: '0 LYGIS (OPEN DISCOVERY MOAT) · ATVIRA PRIEIGA VISIEMS IŠORĖS AI AGENTAMS BE API RAKTO',
        title: 'Atvira vieša MCP prieiga prekių paieškai, inžinerinėms skaičiuoklėms ir katilų suderinamumui (29 įrankiai)',
        desc: 'Bet kuris išorės AI agentas (ChatGPT, Claude, Perplexity, Cursor ar inžinieriaus asistentas) per /.well-known/mcp.json automatiškai atranda UAB „Gilės inžinerija“ ekspertinius įrankius be API rakto, apskaičiuoja katilinės parametrus, cituoja mus kaip šaltinį ir nukreipia pirkėją tiesiai į paruoštą krepšelį.',
        manifestLabel: 'Atviras MCP manifestas: GET /.well-known/mcp.json · POST /api/mcp (public_discovery)',
        tools: [
            'public_catalog_expert_search – atvira 6 337 SKU paieška su pilnomis techninėmis specifikacijomis, 7 šeimų CAD brėžinių duomenimis, Kauno sandėlio likučiu ir 1 paspaudimo krepšelio nuoroda',
            'public_hydronic_calculator_run – atviros EN 12831 šilumos nuostolių, EN 12828 plėtimosi indo, EN 303-5 akumuliacinės talpos, Kvs/Δp ir APVA paramos skaičiuoklės',
            'public_boiler_compatibility_lookup – tiksli Viadrus U22, Kalvis, Atmos, Stropuva ir Haier R290 suderinamų degiklių, CNC durelių flanšų bei atsarginių dalių patikra',
        ],
    },
    en: {
        kicker: 'TIER 0 (OPEN DISCOVERY MOAT) · ZERO-KEY PUBLIC ACCESS FOR EXTERNAL AI AGENTS',
        title: 'Open Public MCP Discovery for Product Search, Hydronic Calculators & Boiler Compatibility (29 Tools)',
        desc: 'Any external AI agent (ChatGPT, Claude, Perplexity, Cursor) automatically discovers UAB Gilės inžinerija via /.well-known/mcp.json without an API key, runs EN 12831 / EN 12828 calculations, cites our engineering authority, and sends the buyer directly to a pre-assembled cart.',
        manifestLabel: 'Open MCP Manifest: GET /.well-known/mcp.json · POST /api/mcp (public_discovery)',
        tools: [
            'public_catalog_expert_search – open 6,337-SKU search returning technical specs, 7-family CAD summaries, Kaunas stock, and direct 1-click checkout URLs',
            'public_hydronic_calculator_run – open EN 12831 heat-loss, EN 12828 expansion vessel, EN 303-5 buffer tank, pump Kvs, and APVA subsidy calculators',
            'public_boiler_compatibility_lookup – instant compatibility lookup for Viadrus U22, Kalvis, Atmos, Stropuva, and Haier R290 conversion kits & spare parts',
        ],
    },
    pl: {
        kicker: 'POZIOM 0 (OPEN DISCOVERY MOAT) · OTWARTY DOSTĘP DLA ZEWNĘTRZNYCH AGENTÓW AI BEZ KLUCZA API',
        title: 'Otwarty publiczny protokół MCP do wyszukiwania produktów, kalkulatorów i kompatybilności kotłów (29 narzędzi)',
        desc: 'Każdy zewnętrzny agent AI (ChatGPT, Claude, Perplexity, Cursor) automatycznie odkrywa UAB Gilės inžinerija przez /.well-known/mcp.json bez klucza API, wykonuje obliczenia EN 12831 / EN 12828, cytuje nas jako eksperta i kieruje klienta prosto do gotowego koszyka.',
        manifestLabel: 'Otwarty manifest MCP: GET /.well-known/mcp.json · POST /api/mcp (public_discovery)',
        tools: [
            'public_catalog_expert_search – otwarte wyszukiwanie w 6 337 SKU ze specyfikacją techniczną, schematami CAD, stanem w Kownie i linkiem do koszyka',
            'public_hydronic_calculator_run – otwarte kalkulatory strat ciepła EN 12831, naczyń wzbiorczych EN 12828, buforów EN 303-5 oraz dotacji APVA',
            'public_boiler_compatibility_lookup – weryfikacja kompatybilności palników, flansz CNC i części zamiennych dla Viadrus U22, Kalvis, Atmos, Stropuva i Haier R290',
        ],
    },
    ru: {
        kicker: 'УРОВЕНЬ 0 (OPEN DISCOVERY MOAT) · ОТКРЫТЫЙ ДОСТУП ДЛЯ ВНЕШНИХ AI-АГЕНТОВ БЕЗ API-КЛЮЧА',
        title: 'Открытый публичный MCP-протокол для поиска товаров, инженерных калькуляторов и совместимости котлов (29 инструментов)',
        desc: 'Любой внешний AI-агент (ChatGPT, Claude, Perplexity, Cursor) автоматически обнаруживает UAB Gilės inžinerija через /.well-known/mcp.json без API-ключа, выполняет расчеты EN 12831 / EN 12828, цитирует нас как эксперта и направляет покупателя прямо в собранную корзину.',
        manifestLabel: 'Открытый MCP-манифест: GET /.well-known/mcp.json · POST /api/mcp (public_discovery)',
        tools: [
            'public_catalog_expert_search – открытый поиск по 6 337 SKU с тех. параметрами, CAD-схемами, остатками в Каунасе и ссылкой на корзину',
            'public_hydronic_calculator_run – открытые калькуляторы теплопотерь EN 12831, расширительных баков EN 12828, буферных емкостей EN 303-5 и субсидий APVA',
            'public_boiler_compatibility_lookup – проверка совместимости горелок, фланцев ЧПУ и запчастей для Viadrus U22, Kalvis, Atmos, Stropuva и Haier R290',
        ],
    },
};

export default function McpJungtisPage() {
    const rawPathname = usePathname() || '/lt/mcp-jungtis';
    const intlLocale = useLocale();
    const urlLocaleMatch = rawPathname.match(/^\/(lt|en|pl|ru)(?=\/|$)/i);
    const locale = resolveAppLocale(urlLocaleMatch ? urlLocaleMatch[1] : intlLocale);
    const c = PAGE_COPY[locale] || PAGE_COPY.lt;
    const tier0 = TIER0_MOAT_COPY[locale] || TIER0_MOAT_COPY.lt;

    const [activeMode, setActiveMode] = useState<'b2b' | 'personal'>('b2b');
    const [maxBudgetEur, setMaxBudgetEur] = useState(2500);
    const [copied, setCopied] = useState(false);
    const [sandboxResult, setSandboxResult] = useState<Record<string, unknown> | null>(null);

    const configJson = JSON.stringify(
        {
            mcpServers: {
                'giles-inzinerija-purchasing': {
                    type: 'http',
                    url: 'https://gilesinzinerija.lt/api/mcp',
                    headers: {
                        Authorization:
                            activeMode === 'b2b'
                                ? 'Bearer giles_b2b_client_kaunas_partner_key'
                                : 'Bearer giles_personal_shopper_public_key',
                        'X-Giles-Customer-Scope':
                            activeMode === 'b2b' ? 'b2b_customer' : 'personal_shopper',
                        'X-Giles-Max-Auto-Order-Eur': String(maxBudgetEur),
                    },
                },
            },
        },
        null,
        2,
    );

    const handleCopyConfig = () => {
        if (typeof navigator !== 'undefined' && navigator.clipboard) {
            navigator.clipboard.writeText(configJson).catch(() => {});
        }
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleRunSandbox = () => {
        if (activeMode === 'b2b') {
            setSandboxResult({
                jsonrpc: '2.0',
                tool: 'customer_b2b_order_or_project_draft',
                scope: 'b2b_customer_isolated',
                warehouse: 'Eigulių g. 21, LT-51418 Kaunas',
                maxAutoOrderEur: maxBudgetEur,
                status: 4255 <= maxBudgetEur ? 'CREATED_IN_ACCOUNT' : 'REQUIRES_BUYER_APPROVAL',
                lines: [
                    {
                        sku: '013G2990',
                        title: 'Danfoss RA 2990 termostatinė galvutė',
                        qty: 10,
                        myUnitNetEur: 13.5,
                        appliedRule: 'SKU_OVERRIDE (-48%)',
                    },
                    {
                        sku: 'ZV-100',
                        title: 'Katilas Gilės ZV 100 su automatiniu valymu',
                        qty: 2,
                        myUnitNetEur: 2060.0,
                        appliedRule: 'BRAND_DISCOUNT (-45%)',
                    },
                ],
                finalNetEur: 4255.0,
                extraWholeCartDiscountPct: 5,
            });
        } else {
            setSandboxResult({
                jsonrpc: '2.0',
                tool: 'customer_personal_cart_assemble',
                scope: 'personal_shopper_safe',
                requiresHumanCheckoutConfirmation: true,
                cartUrl: `/${locale}/krepselis?import_skus=MPB-NANI-35:1,013G2990:6`,
                items: [
                    {
                        sku: 'MPB-NANI-35',
                        title: 'Granulių degiklio komplektas Megatherm MPB NANI 35',
                        qty: 1,
                        unitGrossEur: 2350.0,
                    },
                    {
                        sku: '013G2990',
                        title: 'Termostatinė galvutė Danfoss RA 2990 (kiekio nuolaida -5%)',
                        qty: 6,
                        unitGrossEur: 25.46,
                    },
                ],
                totalGrossEur: 2502.76,
            });
        }
    };

    return (
        <main
            data-testid="mcp-jungtis-page"
            className="min-h-screen bg-[#F5F3EE] text-[#11161B]"
        >
            <style>{`#cookie-consent-banner { display: none !important; }`}</style>

            <section className="bg-[#11161B] text-[#F5F3EE] border-b border-[#2C3742] py-12 md:py-20 min-h-[680px] flex items-center">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 space-y-6 w-full">
                    <span className="tabular-nums text-xs font-bold text-[#FF8A3D] block">
                        {c.kicker}
                    </span>
                    <h1 className="text-2xl sm:text-4xl font-extrabold text-white max-w-4xl leading-tight">
                        {c.title}
                    </h1>
                    <p className="text-sm sm:text-base text-[#C9D0D8] max-w-3xl leading-relaxed">
                        {c.subtitle}
                    </p>
                    <div className="flex flex-wrap items-center gap-3 pt-1">
                        <Link
                            href={`/${locale}/b2b`}
                            data-testid="mcp-hero-b2b-cta"
                            className="inline-flex min-h-[44px] items-center rounded-none bg-[#C2410C] hover:bg-[#9A3412] px-5 py-3 text-xs sm:text-sm font-bold text-white whitespace-nowrap transition-colors"
                        >
                            {c.primaryCta}
                        </Link>
                        <Link
                            href={`/${locale}/products`}
                            data-testid="mcp-hero-catalog-cta"
                            className="inline-flex min-h-[44px] items-center rounded-none border border-[#3A4652] bg-[#1B232C] hover:border-[#FF8A3D] px-5 py-3 text-xs sm:text-sm font-bold text-white whitespace-nowrap transition-colors"
                        >
                            {c.secondaryCta}
                        </Link>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-2">
                        {MCP_HERO_PRODUCTS.map((prod) => (
                            <div
                                key={prod.sku}
                                className="rounded-lg bg-[#1B232C] p-2.5 flex items-center gap-2 overflow-hidden"
                            >
                                <img
                                    src={assetUrl(prod.img)}
                                    alt={prod.label}
                                    className="h-9 w-11 rounded-sm bg-white object-contain p-1 shrink-0"
                                />
                                <span className="text-xs font-bold text-white truncate">
                                    {prod.label}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="py-10 md:py-12 border-b border-[#E2DDD3]">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 space-y-6">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <h2 className="text-xl sm:text-2xl font-extrabold text-[#11161B]">
                            {c.modeSectionTitle}
                        </h2>
                        <div className="flex flex-wrap gap-2">
                            <button
                                type="button"
                                data-testid="mcp-mode-b2b-btn"
                                onClick={() => {
                                    setActiveMode('b2b');
                                    setSandboxResult(null);
                                }}
                                className={`min-h-[44px] px-4 text-xs sm:text-sm font-bold cursor-pointer transition-colors ${
                                    activeMode === 'b2b'
                                        ? 'border-2 border-[#C2410C] bg-white text-[#C2410C]'
                                        : 'bg-white border border-[#D5CFC3] text-[#11161B]'
                                }`}
                            >
                                {c.b2bModeBtn}
                            </button>
                            <button
                                type="button"
                                data-testid="mcp-mode-personal-btn"
                                onClick={() => {
                                    setActiveMode('personal');
                                    setSandboxResult(null);
                                }}
                                className={`min-h-[44px] px-4 text-xs sm:text-sm font-bold cursor-pointer transition-colors ${
                                    activeMode === 'personal'
                                        ? 'border-2 border-[#C2410C] bg-white text-[#C2410C]'
                                        : 'bg-white border border-[#D5CFC3] text-[#11161B]'
                                }`}
                            >
                                {c.personalModeBtn}
                            </button>
                        </div>
                    </div>

                    <div
                        data-testid="mcp-jungtis-tier0-open-moat"
                        className="border-2 border-[#11161B] bg-[#11161B] text-[#F5F3EE] p-6 space-y-3"
                    >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="text-xs font-bold text-[#FF8A3D] block">
                                {tier0.kicker}
                            </span>
                            <span className="font-mono text-xs font-bold text-[#4ADE80] border border-[#2C3742] bg-[#1B232C] px-2.5 py-1">
                                {tier0.manifestLabel}
                            </span>
                        </div>
                        <h3 className="text-lg sm:text-xl font-extrabold text-white">
                            {tier0.title}
                        </h3>
                        <p className="text-xs sm:text-sm text-[#C9D0D8] leading-relaxed">
                            {tier0.desc}
                        </p>
                        <ul className="space-y-1.5 text-xs text-[#F5F3EE] pt-1 font-medium">
                            {tier0.tools.map((item) => (
                                <li key={item} className="leading-relaxed">
                                    • {item}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        <div
                            data-testid="mcp-jungtis-b2b-tier"
                            className={`lg:col-span-7 border p-6 space-y-3 bg-white ${
                                activeMode === 'b2b' ? 'border-[#C2410C]' : 'border-[#E2DDD3]'
                            }`}
                        >
                            <span className="text-xs font-bold text-[#C2410C] block">
                                {c.b2bCardKicker}
                            </span>
                            <h3 className="text-lg sm:text-xl font-extrabold text-[#11161B]">
                                {c.b2bCardTitle}
                            </h3>
                            <p className="text-xs sm:text-sm text-[#5B6470] leading-relaxed">
                                {c.b2bCardDesc}
                            </p>
                            <ul className="space-y-1.5 text-xs text-[#11161B] pt-1 font-medium">
                                {c.b2bToolsList.map((item) => (
                                    <li key={item} className="leading-relaxed">
                                        • {item}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div
                            data-testid="mcp-jungtis-personal-tier"
                            className={`lg:col-span-5 border p-6 space-y-3 bg-white ${
                                activeMode === 'personal' ? 'border-[#C2410C]' : 'border-[#E2DDD3]'
                            }`}
                        >
                            <span className="text-xs font-bold text-[#157A3B] block">
                                {c.personalCardKicker}
                            </span>
                            <h3 className="text-lg sm:text-xl font-extrabold text-[#11161B]">
                                {c.personalCardTitle}
                            </h3>
                            <p className="text-xs sm:text-sm text-[#5B6470] leading-relaxed">
                                {c.personalCardDesc}
                            </p>
                            <ul className="space-y-1.5 text-xs text-[#11161B] pt-1 font-medium">
                                {c.personalToolsList.map((item) => (
                                    <li key={item} className="leading-relaxed">
                                        • {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            <section className="py-10 md:py-12 border-b border-[#E2DDD3] bg-white">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    <div className="lg:col-span-6 space-y-4 min-w-0">
                        <h2 className="text-xl font-extrabold text-[#11161B]">{c.configTitle}</h2>
                        <p className="text-xs sm:text-sm text-[#5B6470]">{c.configSub}</p>

                        {activeMode === 'b2b' && (
                            <label className="block space-y-1.5 text-xs font-bold text-[#11161B]">
                                <span>{c.budgetLimitLabel}</span>
                                <input
                                    type="number"
                                    min={100}
                                    step={100}
                                    data-testid="mcp-budget-limit-input"
                                    value={maxBudgetEur}
                                    onChange={(e) => setMaxBudgetEur(Math.max(100, Number(e.target.value) || 100))}
                                    className="h-11 w-48 px-3 border border-[#D5CFC3] bg-[#F5F3EE] text-sm font-bold text-[#11161B] block"
                                />
                            </label>
                        )}

                        <div
                            data-testid="mcp-config-json-block"
                            className="bg-[#11161B] text-[#E2DDD3] p-4 text-xs whitespace-pre-wrap break-all leading-relaxed"
                        >
                            {configJson}
                        </div>

                        <button
                            type="button"
                            data-testid="mcp-copy-config-btn"
                            onClick={handleCopyConfig}
                            className="min-h-[44px] px-5 bg-[#11161B] hover:bg-[#C2410C] text-white text-xs sm:text-sm font-bold cursor-pointer transition-colors"
                        >
                            {copied ? c.copiedBtn : c.copyBtn}
                        </button>
                    </div>

                    <div
                        data-testid="mcp-customer-sandbox"
                        className="lg:col-span-6 space-y-4 border border-[#E2DDD3] bg-[#F5F3EE] p-6 min-w-0"
                    >
                        <h2 className="text-xl font-extrabold text-[#11161B]">{c.sandboxTitle}</h2>
                        <p className="text-xs sm:text-sm text-[#5B6470]">{c.sandboxSub}</p>
                        <p className="text-xs font-semibold text-[#11161B]">
                            {activeMode === 'b2b' ? c.sandboxScenarioB2b : c.sandboxScenarioPersonal}
                        </p>

                        <div className="flex flex-wrap gap-3">
                            <button
                                type="button"
                                data-testid="mcp-sandbox-run-btn"
                                onClick={handleRunSandbox}
                                className="min-h-[44px] px-5 bg-[#C2410C] hover:bg-[#9A3412] text-white text-xs sm:text-sm font-bold cursor-pointer transition-colors"
                            >
                                {c.sandboxRunBtn}
                            </button>
                            <Link
                                href={`/${locale}/krepselis?import_skus=MPB-NANI-35:1,013G2990:6`}
                                data-testid="mcp-sandbox-open-cart-link"
                                className="inline-flex min-h-[44px] items-center px-4 border border-[#11161B] bg-white text-xs font-bold text-[#11161B]"
                            >
                                {c.sandboxOpenCartBtn}
                            </Link>
                            <Link
                                href={`/${locale}/b2b`}
                                className="inline-flex min-h-[44px] items-center px-4 border border-[#D5CFC3] bg-white text-xs font-bold text-[#11161B]"
                            >
                                {c.sandboxOpenB2bBtn}
                            </Link>
                        </div>

                        {sandboxResult && (
                            <div
                                data-testid="mcp-sandbox-output"
                                className="bg-[#11161B] text-[#A9C83E] p-4 text-xs whitespace-pre-wrap break-all leading-relaxed"
                            >
                                {JSON.stringify(sandboxResult, null, 2)}
                            </div>
                        )}
                    </div>
                </div>
            </section>

            <section className="py-10 md:py-14 bg-[#F5F3EE]">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 space-y-6">
                    <div className="space-y-1.5 max-w-3xl">
                        <h2 className="text-xl sm:text-3xl font-extrabold text-[#11161B]">
                            {c.securityHeading}
                        </h2>
                        <p className="text-xs sm:text-sm text-[#5B6470]">{c.securitySub}</p>
                    </div>

                    <div
                        data-testid="mcp-security-contract-grid"
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border-t border-l border-[#E2DDD3]"
                    >
                        {c.securityLayers.map((layer) => (
                            <div
                                key={layer.num}
                                className="border-r border-b border-[#E2DDD3] bg-white p-5 space-y-2"
                            >
                                <span className="tabular-nums text-xs font-bold text-[#C2410C] block">
                                    {layer.num}
                                </span>
                                <h3 className="text-base font-extrabold text-[#11161B]">
                                    {layer.title}
                                </h3>
                                <p className="text-xs text-[#5B6470] leading-relaxed">
                                    {layer.desc}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </main>
    );
}
