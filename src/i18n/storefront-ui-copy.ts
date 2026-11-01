import type { AppLocale } from './routing';

export function resolveAppLocale(raw?: string | null): AppLocale {
    const clean = (raw || 'lt').toLowerCase().trim();
    if (clean.startsWith('en')) return 'en';
    if (clean.startsWith('pl')) return 'pl';
    if (clean.startsWith('ru')) return 'ru';
    return 'lt';
}

export const NAVBAR_UI_COPY: Record<
    AppLocale,
    {
        audienceHouseholds: string;
        audienceWizard: string;
        audienceIndustrial: string;
        audienceStore: string;
        audienceB2b: string;
        navStore: string;
        navSolutions: string;
        navIndustrial: string;
        navPackages: string;
        navCalculators: string;
        navB2b: string;
        vatGross: string;
        vatNet: string;
        vatGroupAria: string;
        homeAria: string;
        mainMenuAria: string;
        searchAria: string;
        searchPlaceholder: string;
        askVytautas: string;
        wishlistLabel: string;
        wishlistAria: string;
        cartLabel: string;
        localeSwitcherAria: string;
    }
> = {
    lt: {
        audienceHouseholds: 'Namų ūkiams',
        audienceWizard: 'Katilo perdarymas',
        audienceIndustrial: 'Pramonei 100 kW – 2,5 MW',
        audienceStore: 'El. parduotuvė ({count})',
        audienceB2b: 'Montuotojams (B2B)',
        navStore: 'Parduotuvė',
        navSolutions: 'Sprendimai',
        navIndustrial: 'Pramonei',
        navPackages: 'Paketai',
        navCalculators: 'Skaičiuoklės',
        navB2b: 'B2B portalas',
        vatGross: 'Su PVM (21%)',
        vatNet: 'Be PVM',
        vatGroupAria: 'Kainų rodymo režimas su PVM arba be PVM',
        homeAria: 'Gilės Inžinerija – pradžia',
        mainMenuAria: 'Pagrindinis meniu',
        searchAria: 'Paieška parduotuvėje',
        searchPlaceholder: 'Prekė, kodas ar gamintojas',
        askVytautas: 'Klausti Vytauto',
        wishlistLabel: 'Įsimintos',
        wishlistAria: 'Įsimintos prekės',
        cartLabel: 'Krepšelis',
        localeSwitcherAria: 'Kalbos pasirinkimas',
    },
    en: {
        audienceHouseholds: 'For Households',
        audienceWizard: 'Boiler Conversion',
        audienceIndustrial: 'Industrial 100 kW – 2.5 MW',
        audienceStore: 'Online Store ({count})',
        audienceB2b: 'Installers (B2B)',
        navStore: 'Store',
        navSolutions: 'Solutions',
        navIndustrial: 'Industrial',
        navPackages: 'Packages',
        navCalculators: 'Calculators',
        navB2b: 'B2B Portal',
        vatGross: 'Incl. VAT (21%)',
        vatNet: 'Excl. VAT',
        vatGroupAria: 'Price display mode including or excluding VAT',
        homeAria: 'Gilės Inžinerija – home',
        mainMenuAria: 'Main navigation',
        searchAria: 'Store search',
        searchPlaceholder: 'Item, SKU code or brand',
        askVytautas: 'Ask Vytautas',
        wishlistLabel: 'Saved',
        wishlistAria: 'Saved items',
        cartLabel: 'Cart',
        localeSwitcherAria: 'Language switcher',
    },
    pl: {
        audienceHouseholds: 'Dla domów',
        audienceWizard: 'Modernizacja kotła',
        audienceIndustrial: 'Przemysł 100 kW – 2,5 MW',
        audienceStore: 'Sklep ({count})',
        audienceB2b: 'Instalatorzy (B2B)',
        navStore: 'Sklep',
        navSolutions: 'Rozwiązania',
        navIndustrial: 'Przemysł',
        navPackages: 'Pakiety',
        navCalculators: 'Kalkulatory',
        navB2b: 'Portal B2B',
        vatGross: 'Z VAT (21%)',
        vatNet: 'Bez VAT',
        vatGroupAria: 'Tryb wyświetlania cen z VAT lub bez VAT',
        homeAria: 'Gilės Inžinerija – strona główna',
        mainMenuAria: 'Menu główne',
        searchAria: 'Wyszukiwanie w sklepie',
        searchPlaceholder: 'Produkt, kod SKU lub marka',
        askVytautas: 'Zapytaj Vytautasa',
        wishlistLabel: 'Zapisane',
        wishlistAria: 'Zapisane produkty',
        cartLabel: 'Koszyk',
        localeSwitcherAria: 'Wybór języka',
    },
    ru: {
        audienceHouseholds: 'Для дома',
        audienceWizard: 'Модернизация котла',
        audienceIndustrial: 'Промышленность 100 кВт – 2,5 МВт',
        audienceStore: 'Магазин ({count})',
        audienceB2b: 'Монтажникам (B2B)',
        navStore: 'Магазин',
        navSolutions: 'Решения',
        navIndustrial: 'Промышленность',
        navPackages: 'Пакеты',
        navCalculators: 'Калькуляторы',
        navB2b: 'B2B портал',
        vatGross: 'С НДС (21%)',
        vatNet: 'Без НДС',
        vatGroupAria: 'Режим отображения цен с НДС или без НДС',
        homeAria: 'Gilės Inžinerija – главная',
        mainMenuAria: 'Главное меню',
        searchAria: 'Поиск по магазину',
        searchPlaceholder: 'Товар, артикул или бренд',
        askVytautas: 'Спросить Витаутаса',
        wishlistLabel: 'Избранное',
        wishlistAria: 'Избранные товары',
        cartLabel: 'Корзина',
        localeSwitcherAria: 'Выбор языка',
    },
};

export const FOOTER_UI_COPY: Record<
    AppLocale,
    {
        companyCodeLabel: string;
        vatLabel: string;
        storeHeading: string;
        solutionsHeading: string;
        wizardLink: string;
        containersLink: string;
        b2bLink: string;
        packagesLink: string;
        calculatorLink: string;
        engineeringLink: string;
        mcpBridgeLink: string;
        buyersHeading: string;
        deliveryLink: string;
        termsLink: string;
        privacyLink: string;
        contactsLink: string;
        bottomCopyright: string;
        bottomPayments: string;
    }
> = {
    lt: {
        companyCodeLabel: 'Įmonės kodas',
        vatLabel: 'PVM',
        storeHeading: 'Parduotuvė ({count} prekės)',
        solutionsHeading: 'Sprendimai ir B2B',
        wizardLink: 'Katilų perdarymo vedlys',
        containersLink: 'Konteinerinės katilinės',
        b2bLink: 'Montuotojų B2B portalas',
        packagesLink: 'Paruošti katilinių paketai',
        calculatorLink: 'Šildymo galios skaičiuoklė',
        engineeringLink: 'Inžinerija ir servisas',
        mcpBridgeLink: 'AI / MCP pirkimų jungtis',
        buyersHeading: 'Pirkėjams',
        deliveryLink: 'Pristatymas',
        termsLink: 'Pirkimo taisyklės',
        privacyLink: 'Privatumo politika',
        contactsLink: 'Kontaktai',
        bottomCopyright:
            'UAB „Gilės inžinerija“ (nuo 2011 m.) · Įm. k. 302620907 · PVM LT100006119810',
        bottomPayments:
            'Banko nuoroda · PVM sąskaita faktūra · Visa · Mastercard · Apple Pay · Google Pay · Lizingas',
    },
    en: {
        companyCodeLabel: 'Company code',
        vatLabel: 'VAT',
        storeHeading: 'Online Store ({count} items)',
        solutionsHeading: 'Solutions & B2B',
        wizardLink: 'Boiler Conversion Wizard',
        containersLink: 'Containerized Boiler Rooms',
        b2bLink: 'Installer B2B Portal',
        packagesLink: 'Turnkey Boiler Packages',
        calculatorLink: 'Heating Power Calculator',
        engineeringLink: 'Engineering & Service',
        mcpBridgeLink: 'AI / MCP Purchasing Bridge',
        buyersHeading: 'Customer Info',
        deliveryLink: 'Shipping & Delivery',
        termsLink: 'Terms & Conditions',
        privacyLink: 'Privacy Policy',
        contactsLink: 'Contact Us',
        bottomCopyright:
            'UAB „Gilės inžinerija“ (since 2011) · Reg. 302620907 · VAT LT100006119810',
        bottomPayments:
            'Bank link · VAT invoice · Visa · Mastercard · Apple Pay · Google Pay · Leasing',
    },
    pl: {
        companyCodeLabel: 'Kod firmy',
        vatLabel: 'VAT',
        storeHeading: 'Sklep internetowy ({count} poz.)',
        solutionsHeading: 'Rozwiązania i B2B',
        wizardLink: 'Kreator modernizacji kotła',
        containersLink: 'Kotłownie kontenerowe',
        b2bLink: 'Portal B2B dla instalatorów',
        packagesLink: 'Gotowe pakiety kotłowni',
        calculatorLink: 'Kalkulator mocy grzewczej',
        engineeringLink: 'Inżynieria i serwis',
        mcpBridgeLink: 'Złącze zakupowe AI / MCP',
        buyersHeading: 'Dla kupujących',
        deliveryLink: 'Dostawa i zwroty',
        termsLink: 'Regulamin zakupów',
        privacyLink: 'Polityka prywatności',
        contactsLink: 'Kontakt',
        bottomCopyright:
            'UAB „Gilės inžinerija“ (od 2011 r.) · Kod 302620907 · VAT LT100006119810',
        bottomPayments:
            'Przelew bankowy · Faktura VAT · Visa · Mastercard · Apple Pay · Google Pay · Leasing',
    },
    ru: {
        companyCodeLabel: 'Код компании',
        vatLabel: 'НДС',
        storeHeading: 'Интернет-магазин ({count} поз.)',
        solutionsHeading: 'Решения и B2B',
        wizardLink: 'Мастер модернизации котла',
        containersLink: 'Контейнерные котельные',
        b2bLink: 'B2B портал для монтажников',
        packagesLink: 'Готовые пакеты котельных',
        calculatorLink: 'Калькулятор мощности отопления',
        engineeringLink: 'Инженерия и сервис',
        mcpBridgeLink: 'AI / MCP закупочный мост',
        buyersHeading: 'Покупателям',
        deliveryLink: 'Доставка и возврат',
        termsLink: 'Правила покупки',
        privacyLink: 'Политика конфиденциальности',
        contactsLink: 'Контакты',
        bottomCopyright:
            'UAB „Gilės inžinerija“ (с 2011 г.) · Код 302620907 · НДС LT100006119810',
        bottomPayments:
            'Банковская ссылка · Счет-фактура НДС · Visa · Mastercard · Apple Pay · Google Pay · Лизинг',
    },
};

export const STOREFRONT_STOCK_COPY: Record<
    AppLocale,
    {
        warehouseBadge: string;
        inStockKaunas: (qty: number) => string;
        delivery2to4Days: string;
        warehouseProvenance: string;
        vatGrossShort: string;
        vatNetShort: string;
        addToCart: string;
        added: string;
        b2bInstallerDiscount: string;
        copySkuTitle: string;
        copied: string;
    }
> = {
    lt: {
        warehouseBadge: 'Sandėlis: Eigulių g. 21, LT-51418 Kaunas · {count} poz.',
        inStockKaunas: (qty: number) => `Sandėlyje Kaune: ${qty} vnt.`,
        delivery2to4Days: 'Pristatymas 2–4 d. d.',
        warehouseProvenance: 'UAB „Gilės inžinerija“ Kauno sandėlis (Eigulių g. 21, LT-51418 Kaunas)',
        vatGrossShort: 'su PVM',
        vatNetShort: 'be PVM',
        addToCart: '+ Į krepšelį',
        added: 'Įdėta',
        b2bInstallerDiscount: 'Komplekto pasiūlymas ir B2B projektų sąmatos',
        copySkuTitle: 'Kopijuoti gamintojo kodą',
        copied: 'Nukopijuota',
    },
    en: {
        warehouseBadge: 'Warehouse: Eigulių St. 21, LT-51418 Kaunas · {count} items',
        inStockKaunas: (qty: number) => `In stock in Kaunas: ${qty} pcs`,
        delivery2to4Days: 'Delivery 2–4 bus. days',
        warehouseProvenance: 'UAB „Gilės inžinerija“ Kaunas warehouse (Eigulių St. 21, LT-51418 Kaunas)',
        vatGrossShort: 'incl. VAT',
        vatNetShort: 'excl. VAT',
        addToCart: '+ Add to cart',
        added: 'Added',
        b2bInstallerDiscount: 'Package quote & B2B project estimates',
        copySkuTitle: 'Copy manufacturer SKU',
        copied: 'Copied',
    },
    pl: {
        warehouseBadge: 'Magazyn: Eigulių g. 21, LT-51418 Kowno · {count} poz.',
        inStockKaunas: (qty: number) => `W magazynie w Kownie: ${qty} szt.`,
        delivery2to4Days: 'Dostawa 2–4 dni rob.',
        warehouseProvenance: 'Magazyn UAB „Gilės inžinerija“ w Kownie (Eigulių g. 21, LT-51418 Kowno)',
        vatGrossShort: 'z VAT',
        vatNetShort: 'bez VAT',
        addToCart: '+ Do koszyka',
        added: 'Dodano',
        b2bInstallerDiscount: 'Oferta zestawu i wyceny projektowe B2B',
        copySkuTitle: 'Kopiuj kod producenta SKU',
        copied: 'Skopiowano',
    },
    ru: {
        warehouseBadge: 'Склад: ул. Эйгулю 21, LT-51418 Каунас · {count} поз.',
        inStockKaunas: (qty: number) => `На складе в Каунасе: ${qty} шт.`,
        delivery2to4Days: 'Доставка 2–4 раб. дн.',
        warehouseProvenance: 'Склад UAB „Gilės inžinerija“ в Каунасе (ул. Эйгулю 21, LT-51418 Каунас)',
        vatGrossShort: 'с НДС',
        vatNetShort: 'без НДС',
        addToCart: '+ В корзину',
        added: 'Добавлено',
        b2bInstallerDiscount: 'Комплектное предложение и проектные сметы B2B',
        copySkuTitle: 'Скопировать артикул SKU',
        copied: 'Скопировано',
    },
};
