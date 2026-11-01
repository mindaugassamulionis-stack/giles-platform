'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { AppLocale } from '../i18n/routing';
import { useStorefrontConfig } from './storefront-config-provider';
import { formatCatalogCount } from '../lib/w121-honest-commerce';

interface McpShowcaseCopy {
    kicker: string;
    title: string;
    lead: string;
    modeB2bTab: string;
    modePersonalTab: string;
    tier1Tag: string;
    tier1Title: string;
    tier1Desc: string;
    tier1Bullets: [string, string, string];
    tier2Tag: string;
    tier2Title: string;
    tier2Desc: string;
    tier2Bullets: [string, string, string];
    previewHeader: string;
    step1Label: string;
    step2Label: string;
    step3Label: string;
    b2bPrompt: string;
    b2bToolCall: string;
    b2bResult: string;
    personalPrompt: string;
    personalToolCall: string;
    personalResult: string;
    ctaPrimary: string;
    ctaSecondary: string;
}

const SHOWCASE_COPY: Record<AppLocale, McpShowcaseCopy> = {
    lt: {
        kicker: '06 / AI IR MCP PIRKIMŲ PROTOKOLAS · PIRMIEJI BALTIJOS ŠALYSE',
        title: 'Jūsų AI asistentas dabar gali tiesiogiai komplektuoti ir užsakyti iš „Gilės inžinerijos“',
        lead: 'Palaikome atvirą Model Context Protocol (MCP 2025-03-26) standartą. Jūsų įmonės planavimo, pirkimų ar asmeninis AI asistentas (Claude Desktop, Cursor, OpenAI Agent) tiesiogiai jungiasi prie {count} SKU katalogo ir Kauno sandėlio.',
        modeB2bTab: '1. Verslo paskyroms (B2B MCP)',
        modePersonalTab: '2. Namų statytojams (Asmeninis AI)',
        tier1Tag: 'PAGRINDINIS REŽIMAS (80% SRAUTO) · B2B PARTNERIAMS IR MONTUOTOJAMS',
        tier1Title: 'Verslo ir montuotojų paskyroms (B2B MCP Jungtis)',
        tier1Desc:
            'Prijunkite savo įmonės Claude, Cursor ar pirkimų agentą prie patvirtintos B2B paskyros. Asistentas pagal objekto specifikaciją patikrina Eigulių g. 21 sandėlio likučius, pritaiko Jūsų individualias gamintojų, SKU ir krepšelio nuolaidas bei suformuoja užsakymą arba sąmatą.',
        tier1Bullets: [
            '• Individualios 3 lygių B2B kainos: gamintojų matrica (-35%..-52%), sutartinės SKU kainos ir krepšelio apimties nuolaida',
            '• Tiesioginis objekto sąmatos (Objekto sąmata) arba išankstinės „Skaita“ sąskaitos sukūrimas Jūsų B2B paskyroje',
            '• Saugus biudžeto limitas: nustatykite maks. automatinio užsakymo sumą € arba patvirtinkite 1 paspaudimu',
        ],
        tier2Tag: 'FIZINIAMS PIRKĖJAMS · INDIVIDUALIEMS NAMŲ ŪKIAMS',
        tier2Title: 'Namų statytojams ir fiziniams pirkėjams (Asmeninis AI Asistentas)',
        tier2Desc:
            'Statote ar atnaujinate namo katilinę? Jūsų asmeninis AI asistentas per MCP protokolą apskaičiuoja šilumos nuostolius, parenka suderintą katilą, šilumos siurblį, talpą ar radiatorius ir paruošia pilną krepšelį saugiam apmokėjimui.',
        tier2Bullets: [
            '• EN 12828 šilumos nuostolių, katilo galios, akumuliacinės talpos ir radiatorių skaičiavimas per Vytauto variklį',
            '• Automatinis suderinto mazgo surinkimas į paruoštą krepšelį (/lt/krepselis?import_skus=...)',
            '• Saugus apmokėjimas: AI asistentas niekada nenuskaito kortelės – apmokėjimą visada patvirtinate naršyklėje',
        ],
        previewHeader: 'Gyva MCP užklausos ir vykdymo eiga (JSON-RPC 2.0 POST /api/mcp)',
        step1Label: '1. Užklausa AI asistentui',
        step2Label: '2. MCP įrankio kvietimas',
        step3Label: '3. Paruošta sąmata su individualia nuolaida',
        b2bPrompt:
            '„Sukomplektuok Aleksoto kotedžų katilinei 10 vnt. Danfoss RA 2990 galvučių (013G2990) ir 2 vnt. Gilės ZV 100 katilų su mano įmonės B2B nuolaida bei įkelk į objekto sąmatą.“',
        b2bToolCall:
            'tool: "customer_b2b_order_or_project_draft"\nargs: { accountId: "B2B-KAUNAS", mode: "project_quote", projectTitle: "Aleksoto kotedžai", maxAutoOrderEur: 5000, items: [{ sku: "013G2990", qty: 10 }, { sku: "ZV-100", qty: 2 }] }',
        b2bResult:
            'status: "CREATED_IN_ACCOUNT" · Sandėlis: Eigulių g. 21, Kaunas (Yra sandėlyje)\nDanfoss 013G2990: 13,50 € be PVM/vnt. (Sutartinė SKU kaina -48%)\nPapildoma krepšelio apimties nuolaida: -5% · Sukurta sąmata #PRJ-ALEKSOTAS',
        personalPrompt:
            '„Atnaujinu 140 m² namo katilinę Kaune. Parink automatinį granulių degiklį 35 kW katilui ir 6 vnt. Danfoss termostatinių galvučių, paruošk pirkimo krepšelį.“',
        personalToolCall:
            'tool: "customer_personal_cart_assemble"\nargs: { locale: "lt", projectNote: "140 m2 namo katilinė", items: [{ sku: "MPB-NANI-35", qty: 1 }, { sku: "013G2990", qty: 6 }] }',
        personalResult:
            'status: "CART_READY" · Kiekio nuolaida pritaikyta automatiškai\nParuošta krepšelio nuoroda: /lt/krepselis?import_skus=MPB-NANI-35:1,013G2990:6\nSaugiklis: Apmokėjimą patvirtina pats pirkėjas naršyklėje (Montonio / Paysera / Stripe)',
        ctaPrimary: 'Atidaryti AI / MCP jungties vedlį',
        ctaSecondary: 'Gauti B2B MCP raktą portale',
    },
    en: {
        kicker: '06 / AI & MCP PURCHASING PROTOCOL · FIRST IN THE BALTICS',
        title: 'Your AI assistant can now configure and order directly from Gilės Inžinerija',
        lead: 'We support the open Model Context Protocol (MCP 2025-03-26). Your company purchasing agent or personal AI assistant (Claude Desktop, Cursor, OpenAI Agent) connects directly to our {count}-SKU catalog and Kaunas warehouse.',
        modeB2bTab: '1. Business Accounts (B2B MCP)',
        modePersonalTab: '2. Homebuilders (Personal AI)',
        tier1Tag: 'PRIMARY MODE (80% FOCUS) · FOR B2B CONTRACTORS & INSTALLERS',
        tier1Title: 'For Business & Installer Accounts (B2B MCP Bridge)',
        tier1Desc:
            'Connect your company Claude, Cursor, or ERP purchasing agent to your approved B2B account. Your assistant checks real-time stock at Eigulių g. 21 in Kaunas, applies your custom brand, SKU, and cart volume discounts, and creates a B2B order or project quote.',
        tier1Bullets: [
            '• Custom 3-layer B2B pricing: brand matrix (-35%..-52%), contract SKU overrides, and whole-cart volume tiers',
            '• Direct creation of project quotes or proforma Skaita invoices inside your B2B account',
            '• Spend limit guardrail: set a max auto-order EUR threshold or require 1-click buyer approval',
        ],
        tier2Tag: 'FOR HOMEBUILDERS · INDIVIDUAL HOUSEHOLDS',
        tier2Title: 'For Homebuilders & Private Buyers (Personal AI Heating Assistant)',
        tier2Desc:
            'Building or renovating a residential boiler room? Your personal AI assistant calculates heat loss via MCP, selects a compatible boiler, heat pump, buffer tank, or radiators, and prepares a complete cart for safe checkout.',
        tier2Bullets: [
            '• EN 12828 heat-loss, boiler output, expansion vessel, and radiator sizing via the Vytautas engineering engine',
            '• Automatic assembly of compatible components into a ready cart link (/en/krepselis?import_skus=...)',
            '• Safe checkout: the AI assistant never charges your card – you always confirm payment in the browser',
        ],
        previewHeader: 'Live MCP Prompt & Execution Trace (JSON-RPC 2.0 POST /api/mcp)',
        step1Label: '1. Prompt to AI Assistant',
        step2Label: '2. MCP Tool Execution',
        step3Label: '3. Ready Quote with Custom Discount',
        b2bPrompt:
            '"Build a project quote for the Aleksotas townhomes boiler room with 10x Danfoss RA 2990 heads (013G2990) and 2x Gilės ZV 100 boilers using our B2B contract pricing."',
        b2bToolCall:
            'tool: "customer_b2b_order_or_project_draft"\nargs: { accountId: "B2B-KAUNAS", mode: "project_quote", projectTitle: "Aleksotas Townhomes", maxAutoOrderEur: 5000, items: [{ sku: "013G2990", qty: 10 }, { sku: "ZV-100", qty: 2 }] }',
        b2bResult:
            'status: "CREATED_IN_ACCOUNT" · Warehouse: Eigulių g. 21, Kaunas (In Stock)\nDanfoss 013G2990: 13.50 EUR net/unit (Contract SKU override -48%)\nExtra whole-cart volume discount: -5% · Saved to Project #PRJ-ALEKSOTAS',
        personalPrompt:
            '"I am upgrading a 140 m2 house boiler room. Select an automatic 35 kW pellet burner kit and 6 Danfoss thermostatic heads, and prepare a shopping cart link."',
        personalToolCall:
            'tool: "customer_personal_cart_assemble"\nargs: { locale: "en", projectNote: "140 m2 house boiler upgrade", items: [{ sku: "MPB-NANI-35", qty: 1 }, { sku: "013G2990", qty: 6 }] }',
        personalResult:
            'status: "CART_READY" · Quantity tier discount applied automatically\nReady Cart URL: /en/krepselis?import_skus=MPB-NANI-35:1,013G2990:6\nGuardrail: Payment is confirmed by the homeowner in browser (Montonio / Paysera / Stripe)',
        ctaPrimary: 'Open AI / MCP Bridge Wizard',
        ctaSecondary: 'Get B2B MCP Key in Portal',
    },
    pl: {
        kicker: '06 / PROTOKÓŁ ZAKUPOWY AI I MCP · PIERWSI W KRAJACH BAŁTYCKICH',
        title: 'Twój asystent AI może teraz bezpośrednio kompletować i zamawiać w Gilės Inžinerija',
        lead: 'Obsługujemy otwarty standard Model Context Protocol (MCP 2025-03-26). Firmowy agent zakupowy lub osobisty asystent AI (Claude Desktop, Cursor, OpenAI Agent) łączy się bezpośrednio z katalogiem {count} SKU i magazynem w Kownie.',
        modeB2bTab: '1. Konta firmowe (B2B MCP)',
        modePersonalTab: '2. Inwestorzy indywidualni (AI)',
        tier1Tag: 'TRYB GŁÓWNY (80% RUCHU) · DLA INSTALATORÓW I FIRM B2B',
        tier1Title: 'Dla kont firmowych i instalatorów (Złącze B2B MCP)',
        tier1Desc:
            'Połącz firmowego agenta Claude, Cursor lub system zakupowy z zatwierdzonym kontem B2B. Asystent sprawdza stany magazynowe przy ul. Eigulių 21 w Kownie, nalicza indywidualne rabaty producenckie, SKU i koszykowe oraz tworzy zamówienie lub kosztorys.',
        tier1Bullets: [
            '• Indywidualne 3-poziomowe ceny B2B: matryca marek (-35%..-52%), ceny kontraktowe SKU i progi koszykowe',
            '• Bezpośrednie tworzenie kosztorysu inwestycji lub faktury proforma Skaita na koncie B2B',
            '• Limit budżetu: ustaw maks. kwotę automatycznego zamówienia EUR lub zatwierdzaj 1 kliknięciem',
        ],
        tier2Tag: 'DLA KUPUJĄCYCH INDYWIDUALNYCH · DOMY JEDNORODZINNE',
        tier2Title: 'Dla budujących dom i klientów indywidualnych (Osobisty Asystent AI)',
        tier2Desc:
            'Budujesz lub modernizujesz kotłownię? Twój osobisty asystent AI przez protokół MCP oblicza straty ciepła, dobiera kompatybilny kocioł, pompę ciepła, bufor lub grzejniki i przygotowuje gotowy koszyk do bezpiecznej płatności.',
        tier2Bullets: [
            '• Obliczenia strat ciepła EN 12828, mocy kotła, naczynia wzbiorczego i grzejników przez silnik Vytautas',
            '• Automatyczne złożenie kompatybilnego zestawu w gotowy link koszyka (/pl/krepselis?import_skus=...)',
            '• Bezpieczna płatność: asystent AI nigdy nie obciąża karty – płatność potwierdzasz sam w przeglądarce',
        ],
        previewHeader: 'Podgląd zapytania i wykonania MCP na żywo (JSON-RPC 2.0 POST /api/mcp)',
        step1Label: '1. Polecenie dla asystenta AI',
        step2Label: '2. Wywołanie narzędzia MCP',
        step3Label: '3. Gotowy kosztorys z indywidualnym rabatem',
        b2bPrompt:
            '„Skompletuj do kotłowni szeregówek Aleksotas 10 szt. głowic Danfoss RA 2990 (013G2990) i 2 szt. kotłów Gilės ZV 100 z naszym rabatem B2B i zapisz kosztorys inwestycji.”',
        b2bToolCall:
            'tool: "customer_b2b_order_or_project_draft"\nargs: { accountId: "B2B-KAUNAS", mode: "project_quote", projectTitle: "Szeregówki Aleksotas", maxAutoOrderEur: 5000, items: [{ sku: "013G2990", qty: 10 }, { sku: "ZV-100", qty: 2 }] }',
        b2bResult:
            'status: "CREATED_IN_ACCOUNT" · Magazyn: Eigulių g. 21, Kowno (Dostępne)\nDanfoss 013G2990: 13,50 EUR netto/szt. (Cena kontraktowa SKU -48%)\nDodatkowy rabat wolumenowy koszyka: -5% · Zapisano kosztorys #PRJ-ALEKSOTAS',
        personalPrompt:
            '„Modernizuję kotłownię w domu 140 m2. Dobierz zestaw palnika пеллетnego 35 kW oraz 6 głowic termostatycznych Danfoss i przygotuj link do koszyka.”',
        personalToolCall:
            'tool: "customer_personal_cart_assemble"\nargs: { locale: "pl", projectNote: "Dom 140 m2 modernizacja", items: [{ sku: "MPB-NANI-35", qty: 1 }, { sku: "013G2990", qty: 6 }] }',
        personalResult:
            'status: "CART_READY" · Rabat ilościowy naliczony automatycznie\nGotowy link do koszyka: /pl/krepselis?import_skus=MPB-NANI-35:1,013G2990:6\nZabezpieczenie: Płatność potwierdza kupujący w przeglądarce (Montonio / Paysera / Stripe)',
        ctaPrimary: 'Otwórz kreator złącza AI / MCP',
        ctaSecondary: 'Pobierz klucz B2B MCP w portalu',
    },
    ru: {
        kicker: '06 / ПРОТОКОЛ ЗАКУПОК AI И MCP · ПЕРВЫЕ В СТРАНАХ БАЛТИИ',
        title: 'Ваш AI-ассистент теперь может напрямую комплектовать и заказывать в «Gilės inžinerija»',
        lead: 'Мы поддерживаем открытый стандарт Model Context Protocol (MCP 2025-03-26). Корпоративный агент закупок или личный AI-ассистент (Claude Desktop, Cursor, OpenAI Agent) подключается напрямую к каталогу из {count} SKU и складу в Каунасе.',
        modeB2bTab: '1. Бизнес-аккаунты (B2B MCP)',
        modePersonalTab: '2. Частным застройщикам (AI)',
        tier1Tag: 'ОСНОВНОЙ РЕЖИМ (80% ПОТОКА) · ДЛЯ B2B ПАРТНЕРОВ И МОНТАЖНИКОВ',
        tier1Title: 'Для корпоративных и монтажных аккаунтов (B2B MCP Мост)',
        tier1Desc:
            'Подключите корпоративный Claude, Cursor или закупочного агента к подтвержденному B2B аккаунту. Ассистент по спецификации объекта проверяет остатки на складе ул. Эйгулю 21 в Каунасе, применяет ваши индивидуальные скидки по брендам, SKU и корзине и формирует заказ или смету.',
        tier1Bullets: [
            '• Индивидуальные 3-уровневые цены B2B: матрица брендов (-35%..-52%), спеццены SKU и скидки от объема корзины',
            '• Прямое создание объектной сметы или предварительного счета Skaita в вашем B2B кабинете',
            '• Лимит бюджета: задайте макс. сумму автозаказа в EUR или подтверждайте заказы в 1 клик',
        ],
        tier2Tag: 'ЧАСТНЫМ ПОКУПАТЕЛЯМ · ИНДИВИДУАЛЬНЫМ ДОМОХОЗЯЙСТВАМ',
        tier2Title: 'Для застройщиков домов и частных покупателей (Личный AI-ассистент)',
        tier2Desc:
            'Строите или обновляете домашнюю котельную? Ваш личный AI-ассистент через протокол MCP рассчитывает теплопотери, подбирает совместимый котел, тепловой насос, буферную емкость или радиаторы и готовит полную корзину для безопасной оплаты.',
        tier2Bullets: [
            '• Расчет теплопотерь EN 12828, мощности котла, расширительного бака и радиаторов через инженерный модуль Vytautas',
            '• Автоматическая сборка совместимого комплекта в готовую ссылку корзины (/ru/krepselis?import_skus=...)',
            '• Безопасная оплата: AI-ассистент никогда не списывает средства – оплату всегда подтверждает покупатель в браузере',
        ],
        previewHeader: 'Живой пример MCP-запроса и выполнения (JSON-RPC 2.0 POST /api/mcp)',
        step1Label: '1. Запрос AI-ассистенту',
        step2Label: '2. Вызов MCP-инструмента',
        step3Label: '3. Готовая смета с индивидуальной скидкой',
        b2bPrompt:
            '«Скомплектуй для котельной таунхаусов Алексотас 10 шт. термоголовок Danfoss RA 2990 (013G2990) и 2 котла Gilės ZV 100 с нашей B2B скидкой и сохрани в объектную смету.»',
        b2bToolCall:
            'tool: "customer_b2b_order_or_project_draft"\nargs: { accountId: "B2B-KAUNAS", mode: "project_quote", projectTitle: "Таунхаусы Алексотас", maxAutoOrderEur: 5000, items: [{ sku: "013G2990", qty: 10 }, { sku: "ZV-100", qty: 2 }] }',
        b2bResult:
            'status: "CREATED_IN_ACCOUNT" · Склад: ул. Эйгулю 21, Каунас (В наличии)\nDanfoss 013G2990: 13,50 EUR без НДС/шт. (Контрактная спеццена SKU -48%)\nДополнительная скидка на объем корзины: -5% · Смета сохранена #PRJ-ALEKSOTAS',
        personalPrompt:
            '«Модернизирую котельную дома 140 м2. Подбери пеллетную горелку 35 кВт и 6 термоголовок Danfoss, подготовь ссылку на корзину.»',
        personalToolCall:
            'tool: "customer_personal_cart_assemble"\nargs: { locale: "ru", projectNote: "Котельная дома 140 м2", items: [{ sku: "MPB-NANI-35", qty: 1 }, { sku: "013G2990", qty: 6 }] }',
        personalResult:
            'status: "CART_READY" · Количественная скидка применена автоматически\nГотовая ссылка корзины: /ru/krepselis?import_skus=MPB-NANI-35:1,013G2990:6\nЗащита: Оплату подтверждает сам покупатель в браузере (Montonio / Paysera / Stripe)',
        ctaPrimary: 'Открыть мастер подключения AI / MCP',
        ctaSecondary: 'Получить B2B MCP-ключ в портале',
    },
};

export function GilesMcpMarketingShowcase({ locale }: { locale: AppLocale }) {
    const c = SHOWCASE_COPY[locale] || SHOWCASE_COPY.lt;
    // W121-A2: live SKU count in the MCP showcase lead.
    const showcaseCountLabel = formatCatalogCount(
        useStorefrontConfig().catalog?.skuCount ?? 0,
        locale,
    );
    const [previewMode, setPreviewMode] = useState<'b2b' | 'personal'>('b2b');

    return (
        <section
            id="mcp-jungtis"
            data-testid="giles-mcp-marketing-section"
            aria-label={c.kicker}
            className="py-12 md:py-16 bg-[#11161B] text-[#F5F3EE] border-b border-[#2C3742]"
        >
            <div className="mx-auto max-w-7xl px-4 sm:px-6 space-y-8">
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                    <div className="space-y-2 max-w-3xl">
                        <span className="tabular-nums text-xs font-bold text-[#FF8A3D] block">
                            {c.kicker}
                        </span>
                        <h2 className="text-2xl md:text-4xl font-extrabold text-white leading-tight">
                            {c.title}
                        </h2>
                        <p className="text-sm text-[#C9D0D8] leading-relaxed">
                            {c.lead.replaceAll('{count}', showcaseCountLabel)}
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 shrink-0">
                        <Link
                            href={`/${locale}/mcp-jungtis`}
                            data-testid="mcp-showcase-primary-cta"
                            className="inline-flex min-h-[44px] items-center rounded-none bg-[#C2410C] hover:bg-[#9A3412] px-5 py-3 text-xs sm:text-sm font-bold text-white whitespace-nowrap transition-colors"
                        >
                            {c.ctaPrimary}
                        </Link>
                        <Link
                            href={`/${locale}/b2b`}
                            data-testid="mcp-showcase-b2b-cta"
                            className="inline-flex min-h-[44px] items-center rounded-none border border-[#3A4652] bg-[#1B232C] hover:border-[#FF8A3D] px-5 py-3 text-xs sm:text-sm font-bold text-white whitespace-nowrap transition-colors"
                        >
                            {c.ctaSecondary}
                        </Link>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                    <div
                        data-testid="mcp-tier-b2b-card"
                        className="lg:col-span-7 border border-[#C2410C] bg-[#1B232C] p-6 space-y-4 flex flex-col justify-between"
                    >
                        <div className="space-y-3">
                            <span className="text-xs font-bold text-[#FF8A3D] block">
                                {c.tier1Tag}
                            </span>
                            <h3 className="text-xl font-extrabold text-white leading-snug">
                                {c.tier1Title}
                            </h3>
                            <p className="text-xs sm:text-sm text-[#C9D0D8] leading-relaxed">
                                {c.tier1Desc}
                            </p>
                            <ul className="space-y-1.5 text-xs text-[#E2DDD3] pt-1">
                                {c.tier1Bullets.map((b) => (
                                    <li key={b} className="leading-relaxed">
                                        {b}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    <div
                        data-testid="mcp-tier-personal-card"
                        className="lg:col-span-5 border border-[#2C3742] bg-[#1B232C] p-6 space-y-4 flex flex-col justify-between"
                    >
                        <div className="space-y-3">
                            <span className="text-xs font-bold text-[#A9C83E] block">
                                {c.tier2Tag}
                            </span>
                            <h3 className="text-xl font-extrabold text-white leading-snug">
                                {c.tier2Title}
                            </h3>
                            <p className="text-xs sm:text-sm text-[#C9D0D8] leading-relaxed">
                                {c.tier2Desc}
                            </p>
                            <ul className="space-y-1.5 text-xs text-[#E2DDD3] pt-1">
                                {c.tier2Bullets.map((b) => (
                                    <li key={b} className="leading-relaxed">
                                        {b}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>

                <div
                    data-testid="mcp-live-execution-preview"
                    className="border border-[#2C3742] bg-[#1B232C] p-5 sm:p-6 space-y-4"
                >
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#2C3742] pb-3">
                        <strong className="text-xs sm:text-sm text-white">
                            {c.previewHeader}
                        </strong>
                        <div className="flex flex-wrap gap-2">
                            <button
                                type="button"
                                data-testid="mcp-preview-mode-b2b"
                                onClick={() => setPreviewMode('b2b')}
                                className={`min-h-[40px] px-3.5 text-xs font-bold cursor-pointer transition-colors ${
                                    previewMode === 'b2b'
                                        ? 'bg-[#C2410C] text-white'
                                        : 'bg-[#11161B] text-[#C9D0D8] hover:text-white'
                                }`}
                            >
                                {c.modeB2bTab}
                            </button>
                            <button
                                type="button"
                                data-testid="mcp-preview-mode-personal"
                                onClick={() => setPreviewMode('personal')}
                                className={`min-h-[40px] px-3.5 text-xs font-bold cursor-pointer transition-colors ${
                                    previewMode === 'personal'
                                        ? 'bg-[#C2410C] text-white'
                                        : 'bg-[#11161B] text-[#C9D0D8] hover:text-white'
                                }`}
                            >
                                {c.modePersonalTab}
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 text-xs">
                        <div className="space-y-1.5">
                            <span className="font-bold text-[#FF8A3D] block">
                                {c.step1Label}
                            </span>
                            <p className="text-[#F5F3EE] leading-relaxed">
                                {previewMode === 'b2b' ? c.b2bPrompt : c.personalPrompt}
                            </p>
                        </div>
                        <div className="space-y-1.5">
                            <span className="font-bold text-[#A9C83E] block">
                                {c.step2Label}
                            </span>
                            <div className="text-[11px] text-[#C9D0D8] whitespace-pre-wrap break-words leading-relaxed">
                                {previewMode === 'b2b' ? c.b2bToolCall : c.personalToolCall}
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <span className="font-bold text-[#38BDF8] block">
                                {c.step3Label}
                            </span>
                            <div className="text-[11px] text-[#E2DDD3] whitespace-pre-wrap break-words leading-relaxed">
                                {previewMode === 'b2b' ? c.b2bResult : c.personalResult}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
