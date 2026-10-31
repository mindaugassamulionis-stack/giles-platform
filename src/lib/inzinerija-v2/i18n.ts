// Inžinerija v2 vertimai (EN/PL/RU). LT – autoritetingas šaltinis data/*.lt.json.
export interface ServiceT {
    eyebrow: string;
    title: string;
    text: string;
    points: string[];
    term: string;
    price: string;
    cta: string;
}
export interface ServiceLocaleT {
    kitPrefix: string;
    services: Record<string, ServiceT>;
}
export interface ContentT {
    seoTitle: string;
    seoDescription: string;
    breadcrumb: [string, string];
    heroEyebrow: string;
    heroH1: string;
    heroLead: string;
    paths: { title: string; sub: string }[];
    trust: string[];
    brandsLabel: string;
    servicesTitle: string;
    serviceTitle: string;
    serviceLead: string;
    a01Title: string;
    a01Steps: { t: string; d: string }[];
    projectsTitle: string;
    projectsLead: string;
    conversionTitle: string;
    conversionCta: string;
    compatTitle: string;
    compatHint: string;
    processTitle: string;
    processSteps: { n: string; t: string; d: string }[];
    commitmentsTitle: string;
    commitments: string[];
    faq: { q: string; a: string }[];
    formTitle: string;
    formSubmit: string;
    formNote: string;
    formTypes: string[];
}
export interface FormT {
    urgency: { label: string; sub: string }[];
    types: string[];
    submit: string;
    success: string;
    fieldLabels: Record<string, string>;
    fieldPlaceholders: Record<string, string>;
    notes: Record<string, string>;
}

const EN_SERVICES: ServiceLocaleT = {
    kitPrefix: 'Conversion kit',
    services: {
        projektavimas: {
            eyebrow: 'DESIGN AND INSTALLATION',
            title: 'Boiler house design and turnkey installation',
            text: 'Technical and work projects for heating, plumbing, containerised and gas boiler houses and fuel stores.',
            points: [
                '2D / 3D boiler house and fuel store projects',
                'Full assembly with safety groups, vessels and pump modules',
                'Underfloor heating and collector cabinets (HERZ, Comisa)',
            ],
            term: 'Project in 3–5 days · installation in 1–5 days',
            price: 'Installation from 480 € ex VAT',
            cta: 'Get a quote in 24 h',
        },
        perdarymas: {
            eyebrow: 'BOILER CONVERSION',
            title: 'Solid fuel boiler conversion to pellets',
            text: 'We fit CNC doors with a pellet burner, economisers and a 200–2,000 kg hopper in place of the loading door.',
            points: [
                'Viadrus, Kalvis, Atmos, Stropuva, Dakon, Buderus and industrial boilers',
                'No demolition of the boiler room, wood firing remains available',
                '4 fixed-price kits including installation',
            ],
            term: '4–6 h including start-up',
            price: 'from 2,150 € incl VAT',
            cta: 'Choose a kit',
        },
        servisas: {
            eyebrow: 'SERVICE',
            title: 'Burner, boiler and heat pump service',
            text: 'Warranty and post-warranty service for Centrometal, Buderus, Viessmann, Ferroli, Verner, Protherm, Pelltech, Megatherm and HERZ.',
            points: [
                'Fault repair: igniters, photocells, augers, grates, controllers',
                'Combustion tuning with a flue gas analyser',
                'Spare parts from our own warehouses',
            ],
            term: 'Response in 2–24 h',
            price: 'Quote before work begins',
            cta: 'Call out service',
        },
        renovacija: {
            eyebrow: 'RENOVATION',
            title: 'Heating system renovation and balancing',
            text: 'Modernisation of one-pipe and two-pipe systems in apartment blocks, schools, kindergartens and industrial buildings.',
            points: [
                'Pressure and flow regulators IMI TA STAD, STAP, TBV-CMP',
                'Radiator thermostats Heimeier, Danfoss, Watts',
                'Stainless steel flue inserts and chimneys',
            ],
            term: 'IMI TA Scope measurements · balancing passport',
            price: 'By number of risers and circuits',
            cta: 'Get a quote',
        },
        konteinerines: {
            eyebrow: 'CONTAINER BOILER HOUSES',
            title: 'Container boiler houses and mobile rental',
            text: 'Biofuel, gas and biogas boiler houses 100 kW to 2.5 MW assembled at our Kaunas factory, plus mobile 15–500 kW units.',
            points: [
                'Manufacture and testing in Kaunas in 4–8 weeks',
                'Mobile boiler house delivered within 24 h',
                'Connection to the heat line in 1–2 days',
            ],
            term: 'Manufacture 4–8 wks · rental in 24 h',
            price: '',
            cta: 'Industry: models and prices',
        },
        'silumos-siurbliai': {
            eyebrow: 'HEAT PUMPS AND APVA',
            title: 'Heat pumps, water heaters and APVA documents',
            text: 'Air-to-water and air-to-air heat pump installation, selection of water heaters and accumulator tanks.',
            points: [
                'Haier Super Aqua R290, Bosch Climate 3000i',
                'Accumulator tanks Gorenje, water heaters Centrometal and Dražice',
                'All documents for the APVA subsidy',
            ],
            term: 'Installation in 1–2 days',
            price: 'By system · with APVA documents',
            cta: 'View packages',
        },
    },
};
const EN_CONTENT: ContentT = {
    seoTitle: 'Boiler house design, boiler conversion and service | Gilės inžinerija',
    seoDescription: 'Boiler house design and installation, solid fuel boiler conversion to pellets from 2,150 € incl VAT, burner and boiler service across Lithuania with 2–24 h response. Since 2011.',
    breadcrumb: ['Home', 'Engineering and service'],
    heroEyebrow: 'DESIGN · INSTALLATION · SERVICE · SINCE 2011',
    heroH1: 'From project to service, one responsible team',
    heroLead: 'We design and install boiler houses, convert solid fuel boilers to pellets, build container boiler houses in Kaunas and service equipment across Lithuania.',
    paths: [
        { title: 'Broken, need service', sub: 'Response in 2–24 h · winter emergency 2–6 h' },
        { title: 'Convert boiler to pellets', sub: 'Kit with installation from 2,150 € incl VAT · in 4–6 h' },
        { title: 'Need a project or boiler house', sub: 'Quote in 24 h · project in 3–5 days' },
    ],
    trust: ['UAB Gilės inžinerija', 'sites from 10 kW to 2 MW', 'service response', 'installation warranty', 'items in Kaunas and Vilnius warehouses', 'container boiler houses'],
    brandsLabel: 'WE SERVICE AND STOCK PARTS FOR',
    servicesTitle: 'Six services with clear timelines and prices',
    serviceTitle: 'Call a service engineer',
    serviceLead: 'Your request goes straight to a service engineer. We will contact you within the selected response time.',
    a01Title: 'Burner shows error A01?',
    a01Steps: [
        { t: 'Check the pellet level.', d: 'If the auger is visible, refill the hopper.' },
        { t: 'Check the burner and tube.', d: 'If blocked by pellets, clean it.' },
        { t: 'Wipe the photocell and flue passages.', d: 'Check the ash box too.' },
        { t: 'Restart with the P button.', d: 'If pellets ran out, repeat 3–5 times.' },
    ],
    projectsTitle: '16 sites, from a 10 kW home to a 2 MW boiler house',
    projectsLead: 'Every photo is a system we installed and maintain in Lithuania.',
    conversionTitle: 'Fixed price with installation and 24-month warranty',
    conversionCta: 'Check my boiler',
    compatTitle: 'Which boilers we convert',
    compatHint: 'Tap your boiler, the wizard will have it preselected',
    processTitle: 'A clear process with no surprises',
    processSteps: [
        { n: '01', t: 'Enquiry', d: 'By phone or form' },
        { n: '02', t: 'Survey and quote', d: 'Quote in 24 h' },
        { n: '03', t: 'Installation', d: 'From 4–6 h to 1–5 days' },
        { n: '04', t: 'Start-up', d: 'Tuning with a flue gas analyser' },
        { n: '05', t: 'Warranty and service', d: '24 months, remote diagnostics' },
    ],
    commitmentsTitle: 'Our commitments',
    commitments: [
        'Price known before work starts',
        '24-month warranty on installation and kits',
        'Combustion tuned with an analyser, results handed to you',
        'Spare parts in our own Kaunas and Vilnius warehouses',
        'All documents for the APVA subsidy',
    ],
    faq: [
        { q: 'How fast do you arrive?', a: 'When heating stops in winter, within 2–6 hours. For a fault or error code, within 24 hours on business days. Maintenance and tuning times are agreed.' },
        { q: 'What does a service call cost?', a: 'The price depends on distance and work. We state it before arriving and bring spare parts from our own warehouses in Kaunas and Vilnius.' },
        { q: 'Can I still burn wood after conversion?', a: 'In most cases yes. We fit separate CNC doors for the burner, so the original loading doors remain.' },
        { q: 'How long does a boiler conversion take?', a: 'Usually 4–6 hours, without demolishing the boiler room. The same day the boiler runs automatically.' },
        { q: 'Do you help get the APVA subsidy?', a: 'Yes. We prepare the technical passports, class V emission certificates and invoices required for the APVA application.' },
    ],
    formTitle: 'Get a quote in 24 h',
    formSubmit: 'Get a quote',
    formNote: 'We reply within 24 h on business days.',
    formTypes: ['Boiler house project and installation', 'Boiler conversion', 'Renovation and balancing', 'Container boiler house', 'Heat pump and APVA'],
};
const EN_FORM: FormT = {
    urgency: [
        { label: 'Urgent', sub: 'Heating stopped in winter · 2–6 h' },
        { label: 'Fault', sub: 'Error, no ignition · within 24 h' },
        { label: 'Planned', sub: 'Maintenance, tuning · by agreement' },
    ],
    types: ['Fault repair', 'Warranty (with S/N)', 'Start-up and tuning', 'Spare part'],
    submit: 'Call out service',
    success: 'Thank you! Request received. A service engineer will contact you per the chosen urgency. Request No. {id}.',
    fieldLabels: { model: 'Boiler / burner model or S/N', error_code: 'Error code (if shown)', name: 'Name or company', phone: 'Phone', city: 'City / district', photo: 'Photo of the controller screen', description: 'What happened?', part: 'Part needed' },
    fieldPlaceholders: { model: 'e.g. Viadrus U26 + Megatherm MPB 35', error_code: 'e.g. A01', phone: '+370', city: 'e.g. Kaunas', description: 'e.g. pellets not igniting, auger stopped' },
    notes: { urgent: 'We will call back within 2–6 h. If very urgent, call +370 693 97098.', high: 'We will contact you within 24 h on business days.', plan: 'We will contact you to agree a time.' },
};
const PL_SERVICES: ServiceLocaleT = {
    kitPrefix: 'Zestaw przebudowy',
    services: {
        projektavimas: {
            eyebrow: 'PROJEKTOWANIE I MONTAŻ',
            title: 'Projektowanie i montaż kotłowni pod klucz',
            text: 'Projekty techniczne i robocze dla ogrzewania, wodociągu, kontenerowych i gazowych kotłowni oraz magazynów paliwa.',
            points: ['Projekty 2D / 3D kotłowni i magazynów paliwa', 'Pełny montaż z grupami bezpieczeństwa i modułami pomp', 'Ogrzewanie podłogowe i szafki kolektorowe (HERZ, Comisa)'],
            term: 'Projekt w 3–5 dni · montaż w 1–5 dni',
            price: 'Montaż od 480 € bez VAT',
            cta: 'Wycena w 24 h',
        },
        perdarymas: {
            eyebrow: 'PRZEBUDOWA KOTŁÓW',
            title: 'Przebudowa kotła na paliwo stałe na pellet',
            text: 'Zamiast drzwiczek wsadowych montujemy drzwiczki CNC z palnikiem pelletowym, ekonomizery i zasobnik 200–2,000 kg.',
            points: ['Viadrus, Kalvis, Atmos, Stropuva, Dakon, Buderus i kotły przemysłowe', 'Bez rozbiórki kotłowni, możliwość palenia drewnem zostaje', '4 zestawy w stałej cenie z montażem'],
            term: '4–6 h z uruchomieniem',
            price: 'od 2,150 € z VAT',
            cta: 'Wybierz zestaw',
        },
        servisas: {
            eyebrow: 'SERWIS',
            title: 'Serwis palników, kotłów i pomp ciepła',
            text: 'Serwis gwarancyjny i pogwarancyjny Centrometal, Buderus, Viessmann, Ferroli, Verner, Protherm, Pelltech, Megatherm i HERZ.',
            points: ['Usuwanie usterek: zapalniki, fotokomórki, ślimaki, ruszty, sterowniki', 'Strojenie spalania analizatorem spalin', 'Części zamienne z własnych magazynów'],
            term: 'Reakcja w 2–24 h',
            price: 'Wycena przed rozpoczęciem prac',
            cta: 'Wezwij serwis',
        },
        renovacija: {
            eyebrow: 'RENOWACJA',
            title: 'Renowacja i wyważanie systemów ogrzewania',
            text: 'Modernizacja systemów jedno- i dwururowych w blokach, szkołach, przedszkolach i budynkach przemysłowych.',
            points: ['Regulatory ciśnienia i przepływu IMI TA STAD, STAP, TBV-CMP', 'Termostaty grzejnikowe Heimeier, Danfoss, Watts', 'Wkłady kominowe i kominy ze stali nierdzewnej'],
            term: 'Pomiary IMI TA Scope · paszport wyważenia',
            price: 'Według liczby pionów i obiegów',
            cta: 'Uzyskaj wycenę',
        },
        konteinerines: {
            eyebrow: 'KOTŁOWNIE KONTENEROWE',
            title: 'Kotłownie kontenerowe i wynajem mobilnych',
            text: 'Kotłownie na biopaliwo, gaz i biogaz 100 kW do 2,5 MW składane w naszej fabryce w Kownie, oraz mobilne 15–500 kW.',
            points: ['Produkcja i testy w Kownie w 4–8 tygodni', 'Mobilna kotłownia dostarczona w 24 h', 'Podłączenie do linii cieplnej w 1–2 dni'],
            term: 'Produkcja 4–8 tyg. · wynajem w 24 h',
            price: '',
            cta: 'Dla przemysłu: modele i ceny',
        },
        'silumos-siurbliai': {
            eyebrow: 'POMPY CIEPŁA I APVA',
            title: 'Pompy ciepła, bojlery i dokumenty APVA',
            text: 'Montaż pomp ciepła powietrze-woda i powietrze-powietrze, dobór bojlerów i zasobników.',
            points: ['Haier Super Aqua R290, Bosch Climate 3000i', 'Zasobniki Gorenje, bojlery Centrometal i Dražice', 'Wszystkie dokumenty do dotacji APVA'],
            term: 'Montaż w 1–2 dni',
            price: 'Według systemu · z dokumentami APVA',
            cta: 'Zobacz pakiety',
        },
    },
};
const PL_CONTENT: ContentT = {
    seoTitle: 'Projektowanie kotłowni, przebudowa kotłów i serwis | Gilės inžinerija',
    seoDescription: 'Projektowanie i montaż kotłowni, przebudowa kotłów na paliwo stałe na pellet od 2,150 € z VAT, serwis palników i kotłów w całej Litwie z reakcją 2–24 h. Od 2011 r.',
    breadcrumb: ['Strona główna', 'Inżynieria i serwis'],
    heroEyebrow: 'PROJEKTOWANIE · MONTAŻ · SERWIS · OD 2011 R.',
    heroH1: 'Od projektu do serwisu, jeden odpowiedzialny zespół',
    heroLead: 'Projektujemy i montujemy kotłownie, przebudowujemy kotły na paliwo stałe na pellet, produkujemy kotłownie kontenerowe w Kownie i serwisujemy sprzęt w całej Litwie.',
    paths: [
        { title: 'Awaria, potrzebny serwis', sub: 'Reakcja w 2–24 h · zimą awaryjnie 2–6 h' },
        { title: 'Przebuduj kocioł na pellet', sub: 'Zestaw z montażem od 2,150 € z VAT · w 4–6 h' },
        { title: 'Potrzebny projekt lub kotłownia', sub: 'Wycena w 24 h · projekt w 3–5 dni' },
    ],
    trust: ['UAB Gilės inžinerija', 'obiekty od 10 kW do 2 MW', 'reakcja serwisu', 'gwarancja montażu', 'towarów w magazynach w Kownie i Wilnie', 'kotłownie kontenerowe'],
    brandsLabel: 'SERWISUJEMY I MAMY CZĘŚCI DO',
    servicesTitle: 'Sześć usług z jasnymi terminami i cenami',
    serviceTitle: 'Wezwij inżyniera serwisu',
    serviceLead: 'Zgłoszenie trafia bezpośrednio do inżyniera serwisu. Skontaktujemy się w wybranym czasie reakcji.',
    a01Title: 'Palnik pokazuje błąd A01?',
    a01Steps: [
        { t: 'Sprawdź poziom pelletu.', d: 'Jeśli widać ślimak, dosyp zasobnik.' },
        { t: 'Sprawdź palnik i rurę.', d: 'Jeśli zatkane pelpletem, wyczyść.' },
        { t: 'Przetrzyj fotokomórkę i kanały spalin.', d: 'Sprawdź też popielnik.' },
        { t: 'Uruchom ponownie przyciskiem P.', d: 'Jeśli pellet się skończył, powtórz 3–5 razy.' },
    ],
    projectsTitle: '16 obiektów, od domu 10 kW do kotłowni 2 MW',
    projectsLead: 'Każde zdjęcie to system, który zamontowaliśmy i serwisujemy na Litwie.',
    conversionTitle: 'Stała cena z montażem i 24-miesięczną gwarancją',
    conversionCta: 'Sprawdź mój kocioł',
    compatTitle: 'Które kotły przebudowujemy',
    compatHint: 'Kliknij swój kocioł, kreator już go wybierze',
    processTitle: 'Jasny proces bez niespodzianek',
    processSteps: [
        { n: '01', t: 'Zgłoszenie', d: 'Telefonicznie lub formularzem' },
        { n: '02', t: 'Oględziny i wycena', d: 'Wycena w 24 h' },
        { n: '03', t: 'Montaż', d: 'Od 4–6 h do 1–5 dni' },
        { n: '04', t: 'Uruchomienie', d: 'Strojenie analizatorem spalin' },
        { n: '05', t: 'Gwarancja i serwis', d: '24 mies., diagnostyka zdalna' },
    ],
    commitmentsTitle: 'Nasze zobowiązania',
    commitments: [
        'Cena znana przed rozpoczęciem prac',
        '24-miesięczna gwarancja na montaż i zestawy',
        'Spalanie strojone analizatorem, wyniki dla Ciebie',
        'Części zamienne w własnych magazynach w Kownie i Wilnie',
        'Wszystkie dokumenty do dotacji APVA',
    ],
    faq: [
        { q: 'Jak szybko przyjedziecie?', a: 'Gdy zimą stanie ogrzewanie, w ciągu 2–6 godzin. Przy usterce lub kodzie błędu, w ciągu 24 godzin w dni robocze. Terminy przeglądów ustalamy.' },
        { q: 'Ile kosztuje wezwanie serwisu?', a: 'Cena zależy od odległości i prac. Podajemy ją przed przyjazdem i przywozimy części z własnych magazynów w Kownie i Wilnie.' },
        { q: 'Czy po przebudowie mogę palić drewnem?', a: 'W większości przypadków tak. Montujemy osobne drzwiczki CNC na palnik, więc oryginalne drzwiczki wsadowe zostają.' },
        { q: 'Ile trwa przebudowa kotła?', a: 'Zwykle 4–6 godzin, bez rozbiórki kotłowni. Tego samego dnia kocioł pracuje automatycznie.' },
        { q: 'Pomagacie uzyskać dotację APVA?', a: 'Tak. Przygotowujemy paszporty techniczne, certyfikaty klasy emisji V i faktury wymagane do wniosku APVA.' },
    ],
    formTitle: 'Uzyskaj wycenę w 24 h',
    formSubmit: 'Uzyskaj wycenę',
    formNote: 'Odpowiadamy w 24 h w dni robocze.',
    formTypes: ['Projekt i montaż kotłowni', 'Przebudowa kotła', 'Renowacja i wyważanie', 'Kotłownia kontenerowa', 'Pompa ciepła i APVA'],
};
const PL_FORM: FormT = {
    urgency: [
        { label: 'Pilne', sub: 'Ogrzewanie stanęło zimą · 2–6 h' },
        { label: 'Usterka', sub: 'Błąd, nie zapala · w 24 h' },
        { label: 'Planowe', sub: 'Przegląd, strojenie · wg ustaleń' },
    ],
    types: ['Usuwanie usterki', 'Gwarancyjny (z S/N)', 'Uruchomienie i strojenie', 'Część zamienna'],
    submit: 'Wezwij serwis',
    success: 'Dziękujemy! Zgłoszenie otrzymane. Inżynier serwisu skontaktuje się zgodnie z pilnością. Zgłoszenie Nr {id}.',
    fieldLabels: { model: 'Model kotła / palnika lub S/N', error_code: 'Kod błędu (jeśli jest)', name: 'Imię lub firma', phone: 'Telefon', city: 'Miasto / rejon', photo: 'Zdjęcie ekranu sterownika', description: 'Co się stało?', part: 'Potrzebna część' },
    fieldPlaceholders: { model: 'np. Viadrus U26 + Megatherm MPB 35', error_code: 'np. A01', phone: '+370', city: 'np. Kowno', description: 'np. pellet się nie zapala, ślimak stanął' },
    notes: { urgent: 'Oddzwonimy w 2–6 h. Jeśli bardzo pilnie, dzwoń +370 693 97098.', high: 'Skontaktujemy się w 24 h w dni robocze.', plan: 'Skontaktujemy się i ustalimy termin.' },
};
const RU_SERVICES: ServiceLocaleT = {
    kitPrefix: 'Комплект переоборудования',
    services: {
        projektavimas: {
            eyebrow: 'ПРОЕКТИРОВАНИЕ И МОНТАЖ',
            title: 'Проектирование и монтаж котельных под ключ',
            text: 'Технические и рабочие проекты отопления, водоснабжения, контейнерных и газовых котельных и складов топлива.',
            points: ['Проекты котельных и складов топлива 2D / 3D', 'Полная сборка с группами безопасности и насосными узлами', 'Тёплый пол и коллекторные шкафы (HERZ, Comisa)'],
            term: 'Проект за 3–5 дней · монтаж за 1–5 дней',
            price: 'Монтаж от 480 € без НДС',
            cta: 'Смета за 24 ч',
        },
        perdarymas: {
            eyebrow: 'ПЕРЕОБОРУДОВАНИЕ КОТЛОВ',
            title: 'Переоборудование твердотопливного котла на пеллеты',
            text: 'Вместо загрузочной дверцы монтируем CNC дверцу с пеллетной горелкой, экономайзеры и бункер 200–2,000 кг.',
            points: ['Viadrus, Kalvis, Atmos, Stropuva, Dakon, Buderus и промышленные котлы', 'Без разборки котельной, возможность топки дровами сохраняется', '4 комплекта по фиксированной цене с монтажом'],
            term: '4–6 ч с запуском',
            price: 'от 2,150 € с НДС',
            cta: 'Подобрать комплект',
        },
        servisas: {
            eyebrow: 'СЕРВИС',
            title: 'Сервис горелок, котлов и тепловых насосов',
            text: 'Гарантийное и послегарантийное обслуживание Centrometal, Buderus, Viessmann, Ferroli, Verner, Protherm, Pelltech, Megatherm и HERZ.',
            points: ['Устранение неисправностей: запальники, фотодатчики, шнеки, решётки, контроллеры', 'Настройка горения газоанализатором', 'Запчасти с собственных складов'],
            term: 'Реакция 2–24 ч',
            price: 'Смета до начала работ',
            cta: 'Вызвать сервис',
        },
        renovacija: {
            eyebrow: 'РЕНОВАЦИЯ',
            title: 'Реновация и балансировка систем отопления',
            text: 'Модернизация однотрубных и двухтрубных систем в многоэтажках, школах, детских садах и производственных зданиях.',
            points: ['Регуляторы давления и потока IMI TA STAD, STAP, TBV-CMP', 'Термостаты радиаторов Heimeier, Danfoss, Watts', 'Вставки дымоходов и трубы из нержавеющей стали'],
            term: 'Измерения IMI TA Scope · паспорт балансировки',
            price: 'По числу стояков и контуров',
            cta: 'Получить смету',
        },
        konteinerines: {
            eyebrow: 'КОНТЕЙНЕРНЫЕ КОТЕЛЬНЫЕ',
            title: 'Контейнерные котельные и аренда мобильных',
            text: 'Котельные на биотопливе, газе и биогазе 100 кВт до 2,5 МВт, собираемые на нашем заводе в Каунасе, и мобильные 15–500 кВт.',
            points: ['Производство и испытания в Каунасе за 4–8 недель', 'Мобильная котельная доставляется за 24 ч', 'Подключение к теплотрассе за 1–2 дня'],
            term: 'Производство 4–8 нед. · аренда за 24 ч',
            price: '',
            cta: 'Промышленности: модели и цены',
        },
        'silumos-siurbliai': {
            eyebrow: 'ТЕПЛОВЫЕ НАСОСЫ И APVA',
            title: 'Тепловые насосы, бойлеры и документы APVA',
            text: 'Монтаж тепловых насосов воздух-вода и воздух-воздух, подбор бойлеров и аккумуляторных ёмкостей.',
            points: ['Haier Super Aqua R290, Bosch Climate 3000i', 'Аккумуляционные ёмкости Gorenje, бойлеры Centrometal и Dražice', 'Все документы для субсидии APVA'],
            term: 'Монтаж за 1–2 дня',
            price: 'По системе · с документами APVA',
            cta: 'Смотреть пакеты',
        },
    },
};
const RU_CONTENT: ContentT = {
    seoTitle: 'Проектирование котельных, переоборудование котлов и сервис | Gilės inžinerija',
    seoDescription: 'Проектирование и монтаж котельных, переоборудование твердотопливных котлов на пеллеты от 2,150 € с НДС, сервис горелок и котлов по всей Литве с реакцией 2–24 ч. С 2011 г.',
    breadcrumb: ['Главная', 'Инжиниринг и сервис'],
    heroEyebrow: 'ПРОЕКТИРОВАНИЕ · МОНТАЖ · СЕРВИС · С 2011 Г.',
    heroH1: 'От проекта до сервиса, одна ответственная команда',
    heroLead: 'Проектируем и монтируем котельные, переоборудуем твердотопливные котлы на пеллеты, производим контейнерные котельные в Каунасе и обслуживаем оборудование по всей Литве.',
    paths: [
        { title: 'Сломалось, нужен сервис', sub: 'Реакция 2–24 ч · зимой аварийно 2–6 ч' },
        { title: 'Переоборудовать котёл на пеллеты', sub: 'Комплект с монтажом от 2,150 € с НДС · за 4–6 ч' },
        { title: 'Нужен проект или котельная', sub: 'Смета за 24 ч · проект за 3–5 дней' },
    ],
    trust: ['UAB Gilės inžinerija', 'объекты от 10 кВт до 2 МВт', 'реакция сервиса', 'гарантия на монтаж', 'товаров на складах в Каунасе и Вильнюсе', 'контейнерные котельные'],
    brandsLabel: 'ОБСЛУЖИВАЕМ И ИМЕЕМ ЗАПЧАСТИ ДЛЯ',
    servicesTitle: 'Шесть услуг с ясными сроками и ценами',
    serviceTitle: 'Вызовите сервисного инженера',
    serviceLead: 'Заявка сразу попадает сервисному инженеру. Свяжемся в выбранное время реакции.',
    a01Title: 'Горелка показывает ошибку A01?',
    a01Steps: [
        { t: 'Проверьте уровень пеллет.', d: 'Если виден шнек, засыпьте бункер.' },
        { t: 'Проверьте горелку и трубу.', d: 'Если забились пеллетами, прочистите.' },
        { t: 'Протрите фотодатчик и дымоходные каналы.', d: 'Проверьте и зольный ящик.' },
        { t: 'Перезапустите кнопкой P.', d: 'Если пеллеты закончились, повторите 3–5 раз.' },
    ],
    projectsTitle: '16 объектов, от дома 10 кВт до котельной 2 МВт',
    projectsLead: 'Каждое фото, это система, которую мы смонтировали и обслуживаем в Литве.',
    conversionTitle: 'Фиксированная цена с монтажом и 24-месячной гарантией',
    conversionCta: 'Проверить мой котёл',
    compatTitle: 'Какие котлы переоборудуем',
    compatHint: 'Нажмите свой котёл, мастер уже выберет его',
    processTitle: 'Понятный процесс без сюрпризов',
    processSteps: [
        { n: '01', t: 'Заявка', d: 'По телефону или форме' },
        { n: '02', t: 'Осмотр и смета', d: 'Смета за 24 ч' },
        { n: '03', t: 'Монтаж', d: 'От 4–6 ч до 1–5 дней' },
        { n: '04', t: 'Запуск', d: 'Настройка газоанализатором' },
        { n: '05', t: 'Гарантия и сервис', d: '24 мес., удалённая диагностика' },
    ],
    commitmentsTitle: 'Наши обязательства',
    commitments: [
        'Цена известна до начала работ',
        '24-месячная гарантия на монтаж и комплекты',
        'Горение настраивается анализатором, результаты вам',
        'Запчасти на собственных складах в Каунасе и Вильнюсе',
        'Все документы для субсидии APVA',
    ],
    faq: [
        { q: 'Как быстро приедете?', a: 'Когда зимой встаёт отопление, в течение 2–6 часов. При неисправности или коде ошибки, в течение 24 часов в рабочие дни. Время профилактики согласуем.' },
        { q: 'Сколько стоит вызов сервиса?', a: 'Цена зависит от расстояния и работ. Называем её до приезда и привозим запчасти с собственных складов в Каунасе и Вильнюсе.' },
        { q: 'После переоборудования можно топить дровами?', a: 'В большинстве случаев да. Монтируем отдельные CNC дверцы для горелки, поэтому оригинальные загрузочные дверцы остаются.' },
        { q: 'Сколько длится переоборудование котла?', a: 'Обычно 4–6 часов, без разборки котельной. В тот же день котёл работает автоматически.' },
        { q: 'Помогаете получить субсидию APVA?', a: 'Да. Готовим технические паспорта, сертификаты класса эмиссии V и счета, необходимые для заявки APVA.' },
    ],
    formTitle: 'Получите смету за 24 ч',
    formSubmit: 'Получить смету',
    formNote: 'Отвечаем за 24 ч в рабочие дни.',
    formTypes: ['Проект и монтаж котельной', 'Переоборудование котла', 'Реновация и балансировка', 'Контейнерная котельная', 'Тепловой насос и APVA'],
};
const RU_FORM: FormT = {
    urgency: [
        { label: 'Срочно', sub: 'Отопление встало зимой · 2–6 ч' },
        { label: 'Неисправность', sub: 'Ошибка, не розжиг · за 24 ч' },
        { label: 'Плановое', sub: 'Профилактика, настройка · по договорённости' },
    ],
    types: ['Устранение неисправности', 'Гарантийный (с S/N)', 'Запуск и настройка', 'Запчасть'],
    submit: 'Вызвать сервис',
    success: 'Спасибо! Заявка получена. Сервисный инженер свяжется согласно срочности. Заявка № {id}.',
    fieldLabels: { model: 'Модель котла / горелки или S/N', error_code: 'Код ошибки (если показывает)', name: 'Имя или компания', phone: 'Телефон', city: 'Город / район', photo: 'Фото экрана контроллера', description: 'Что случилось?', part: 'Нужная запчасть' },
    fieldPlaceholders: { model: 'напр. Viadrus U26 + Megatherm MPB 35', error_code: 'напр. A01', phone: '+370', city: 'напр. Каунас', description: 'напр. не зажигаются пеллеты, встал шнек' },
    notes: { urgent: 'Перезвоним в течение 2–6 ч. Если очень срочно, звоните +370 693 97098.', high: 'Свяжемся в течение 24 ч в рабочие дни.', plan: 'Свяжемся и согласуем время.' },
};

const LT_SERVICES: ServiceLocaleT = { kitPrefix: '', services: {} };

export const SERVICE_I18N: Record<'en' | 'pl' | 'ru', ServiceLocaleT> = {
    en: EN_SERVICES,
    pl: PL_SERVICES,
    ru: RU_SERVICES,
};
export const CONTENT_I18N: Record<'en' | 'pl' | 'ru', ContentT> = {
    en: EN_CONTENT,
    pl: PL_CONTENT,
    ru: RU_CONTENT,
};
export const FORM_I18N: Record<'en' | 'pl' | 'ru', FormT> = {
    en: EN_FORM,
    pl: PL_FORM,
    ru: RU_FORM,
};
export const PROJECT_CATEGORY_I18N: Record<'en' | 'pl' | 'ru', Record<string, string>> = {
    en: { perd: 'Boiler conversions', ind: 'Industrial and container', hp: 'Heat modules and boiler houses', svc: 'Service and automation' },
    pl: { perd: 'Przebudowa kotłów', ind: 'Przemysłowe i kontenerowe', hp: 'Węzły cieplne i kotłownie', svc: 'Serwis i automatyka' },
    ru: { perd: 'Переоборудование котлов', ind: 'Промышленные и контейнерные', hp: 'Тепловые узлы и котельные', svc: 'Сервис и автоматика' },
};
void LT_SERVICES;
