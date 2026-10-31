'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLocale } from 'next-intl';
import { Check, ShoppingCart, Wrench, Flame, Layers, Droplets, Gauge } from 'lucide-react';
import {
    GILES_SYSTEM_PACKAGES,
    UNDERFLOOR_AREA_PRESETS,
    getLocalizedSystemPackages,
    getLocalizedUnderfloorPresets,
    calculateHeatingSystemRecommendation,
    computePackageTotalEur,
    type InsulationClassKey,
    type HeatingEmitterType,
    type HeatSourceType,
    type OccupantsTier,
    type PackageComponentItem,
    type SystemPackageOffer,
} from '../../lib/giles-packages-data';
import { useCart } from '../../store/cart';
import { apiUrl, assetUrl } from '../../lib/api';
import { resolveAppLocale } from '../../i18n/storefront-ui-copy';
import type { AppLocale } from '../../i18n/routing';
import { trackEvent } from '../analytics';

interface HeatingSystemCalculatorProps {
    defaultHeatSource?: HeatSourceType;
    compact?: boolean;
    locale?: string;
    onRequestQuote?: (pkg: SystemPackageOffer, summaryNote: string, areaM2: number) => void;
}

const CALC_UI_COPY: Record<
    AppLocale,
    {
        sectionAria: string;
        eyebrow: string;
        heading: string;
        subtitle: string;
        allPackagesBtn: string;
        designInstallBtn: string;
        step1Label: string;
        step2Label: string;
        insulationOptions: Record<InsulationClassKey, string>;
        step3Label: string;
        heatSourceOptions: Record<HeatSourceType, string>;
        step4Label: string;
        emitterOptions: Record<HeatingEmitterType, string>;
        step5Label: string;
        occupantOptions: Record<OccupantsTier, string>;
        calcLoadPrefix: (area: number, wm2: number) => string;
        resultHeadlinePrefix: string;
        resultHeadlineSuffix: string;
        enBadge: string;
        selectedSourceLabel: (kw: number) => string;
        fromPriceLabel: (eur: string) => string;
        bufferLabel: string;
        bufferNotRequired: string;
        dhwBoilerLabel: (liters: number) => string;
        ufhLoopsLabel: (loops: number, pipeM: number) => string;
        radiatorNodeLabel: string;
        expansionVesselLabel: (liters: number) => string;
        recPackageBadge: (numLabel: string) => string;
        fullPriceVatLabel: string;
        pcsUnit: string;
        addedToastPrefix: string;
        addRecPackageBtn: (eur: string) => string;
        addUnderfloorBtn: (presetLabel: string) => string;
        orderWithInstallBtn: string;
        leadModalTitle: string;
        closeBtn: string;
        leadModalSubtitle: (area: number, kw: number, pkgTitle: string) => string;
        nameLabel: string;
        namePlaceholder: string;
        emailLabel: string;
        emailPlaceholder: string;
        cityLabel: string;
        cityPlaceholder: string;
        notesLabel: string;
        notesPlaceholder: string;
        submitErrorDefault: string;
        networkError: string;
        leadSuccess: (ref?: string) => string;
        submittingBtn: string;
        submitQuoteBtn: string;
    }
> = {
    lt: {
        sectionAria: 'Šildymo sistemos, katilo galios, akumuliacinės talpos ir grindinio šildymo skaičiuoklė',
        eyebrow: 'Gilės Inžinerija · INŽINERINIS PROJEKTAVIMO DARBASTALIS · EN 12831 / STR 2.09.02',
        heading: 'Sužinokite tikslią katilo galią, akumuliacinę talpą ir grindinio šildymo kontūrų skaičių',
        subtitle:
            'Pasirinkite savo namo plotą ir šiltinimo klasę – skaičiuoklė parinks pilną katilinės bei grindinio šildymo komplektą iš mūsų Kauno sandėlio („Skaita“ / EGIP.lt).',
        allPackagesBtn: 'Visi 7 sisteminiai paketai',
        designInstallBtn: 'Projektavimas ir montavimas',
        step1Label: '1. Šildomas pastato plotas (m²)',
        step2Label: '2. Pastato energetinė ir šiltinimo klasė',
        insulationOptions: {
            a_plus: 'A / A+ / A++ klasė (naujos statybos, ~35 W/m²)',
            b_c: 'B / C klasė arba renovuotas namas (~60 W/m²)',
            old_unrenovated: 'Senesnės statybos nerenovuotas namas (~90 W/m²)',
        },
        step3Label: '3. Šilumos šaltinis / sistema (katilinės tipas)',
        heatSourceOptions: {
            heat_pump_air_water: 'Oras–Vanduo šilumos siurblys (Haier Super Aqua R290 / R32 Monoblokas)',
            electric_boiler: 'Elektrinis šildymo katilas (Haier ES10V–ES100V 9–28 kW + Gorenje ZV)',
            heat_pump_air_air: 'Oras–Oras šilumos siurblys / Kondicionierius iki -25..-30 °C (Haier Nordic)',
            pellet: 'Granulinis katilas (Gilės Inžinerija KaTRI / Centrometal + Pelltech / Megatherm)',
            solid_fuel_buffer: 'Kieto kuro katilas + Gorenje ZV / Dražice / Centrometal CAS akumuliacinė talpa',
            gas_condensing: 'Dujinis kondensacinis katilas (Viessmann Vitodens / Buderus)',
        },
        step4Label: '4. Šildymo prietaisai',
        emitterOptions: {
            underfloor: 'Grindinis šildymas',
            mixed: 'Grindinis + radiatoriai',
            radiators: 'Tik radiatoriai',
        },
        step5Label: '5. Gyventojų skaičius (karštam vandeniui)',
        occupantOptions: {
            '1_2': '1–2 asmenys (160 L)',
            '3_4': '3–4 asmenys (200 L)',
            '5_plus': '5+ asmenys (250 L)',
        },
        calcLoadPrefix: (area, wm2) => `Apskaičiuotas šilumos poreikis (${area} m² · ${wm2} W/m²)`,
        resultHeadlinePrefix: 'Jūsų namui reikia ~',
        resultHeadlineSuffix: ' šildymo galios',
        enBadge: 'Parinkta pagal EN 12831',
        selectedSourceLabel: (kw) => `Parinktas šilumos šaltinis (${kw} kW):`,
        fromPriceLabel: (eur) => `nuo ${eur} € su PVM`,
        bufferLabel: 'Akumuliacinė talpa:',
        bufferNotRequired: 'Nebūtina (0 L)',
        dhwBoilerLabel: (liters) => `Karšto vandens boileris: ${liters} L`,
        ufhLoopsLabel: (loops, pipeM) => `Grindinis šildymas: ${loops} kontūrai (~${pipeM} m vamzdžio)`,
        radiatorNodeLabel: 'Radiatorinis šildymas: Danfoss 2026 / IMI Heimeier mazgas',
        expansionVesselLabel: (liters) => `Plėtimosi indas: ${liters} L`,
        recPackageBadge: (numLabel) => `Rekomenduojamas bazinis katilinės paketas (${numLabel})`,
        fullPriceVatLabel: 'Pilno komplekto kaina su PVM',
        pcsUnit: 'vnt.',
        addedToastPrefix: 'Į krepšelį įdėtas komplektas:',
        addRecPackageBtn: (eur) => `Įdėti rekomenduojamą paketą į krepšelį (${eur} €)`,
        addUnderfloorBtn: (presetLabel) => `+ Įdėti ${presetLabel} grindų mazgą`,
        orderWithInstallBtn: 'Užsakyti su projektavimu ir montavimu',
        leadModalTitle: 'Užsakyti Gilės Inžinerijos projektavimą, komplektaciją ir montavimą iki rakto',
        closeBtn: 'Uždaryti',
        leadModalSubtitle: (area, kw, pkgTitle) =>
            `Jūsų skaičiuoklės duomenys (${area} m², ${kw} kW, paketas „${pkgTitle}“) bus automatiškai pridėti prie užklausos.`,
        nameLabel: 'Vardas arba įmonė *',
        namePlaceholder: 'Jūsų vardas arba įmonė',
        emailLabel: 'El. paštas *',
        emailPlaceholder: 'vardas@pavyzdys.lt',
        cityLabel: 'Miestas / rajonas',
        cityPlaceholder: 'Vilnius, Kaunas, Klaipėda...',
        notesLabel: 'Papildoma informacija (esamas katilas, kaminas, pageidaujami darbai)',
        notesPlaceholder: 'Pvz.: Reikalingas pilnas katilinės montavimas ir APVA kompensacijos dokumentai.',
        submitErrorDefault: 'Nepavyko išsiųsti užklausos. Patikrinkite duomenis.',
        networkError: 'Ryšio klaida. Bandykite dar kartą arba rašykite info@gilesinzinerija.lt.',
        leadSuccess: (ref) =>
            `Užklausa užregistruota (Nr. ${ref || 'OK'}). UAB „Gilės inžinerija“ inžinierius susisieks per 2–24 val.`,
        submittingBtn: 'Siunčiama užklausa...',
        submitQuoteBtn: 'Gauti sąmatą su įranga ir montavimu',
    },
    en: {
        sectionAria: 'Heating system, boiler output, buffer tank, and underfloor heating calculator',
        eyebrow: 'Gilės Inžinerija · ENGINEERING DESIGN WORKBENCH · EN 12831',
        heading: 'Calculate exact boiler output, buffer tank volume, and underfloor heating loop count',
        subtitle:
            'Select your floor area and insulation class – the workbench matches a complete boiler room and underfloor heating package from our Kaunas warehouse.',
        allPackagesBtn: 'All 7 System Packages',
        designInstallBtn: 'Engineering & Installation',
        step1Label: '1. Heated building floor area (m²)',
        step2Label: '2. Building energy & insulation class',
        insulationOptions: {
            a_plus: 'Class A / A+ / A++ (new build, ~35 W/m²)',
            b_c: 'Class B / C or renovated house (~60 W/m²)',
            old_unrenovated: 'Older unrenovated building (~90 W/m²)',
        },
        step3Label: '3. Heat source / boiler plant type',
        heatSourceOptions: {
            heat_pump_air_water: 'Air-to-Water Heat Pump (Haier Super Aqua R290 / R32 Monoblock)',
            electric_boiler: 'Electric Heating Boiler (Haier ES10V–ES100V 9–28 kW + Gorenje ZV)',
            heat_pump_air_air: 'Air-to-Air Heat Pump / Nordic Conditioner down to -30 °C (Haier Nordic)',
            pellet: 'Pellet Boiler (Gilės Inžinerija KaTRI / Centrometal + Pelltech / Megatherm)',
            solid_fuel_buffer: 'Solid-Fuel Boiler + Gorenje ZV / Drazice / Centrometal CAS Buffer Tank',
            gas_condensing: 'Gas Condensing Boiler (Viessmann Vitodens / Buderus)',
        },
        step4Label: '4. Heat emitters',
        emitterOptions: {
            underfloor: 'Underfloor heating',
            mixed: 'Underfloor + radiators',
            radiators: 'Radiators only',
        },
        step5Label: '5. Occupants (for domestic hot water)',
        occupantOptions: {
            '1_2': '1–2 persons (160 L)',
            '3_4': '3–4 persons (200 L)',
            '5_plus': '5+ persons (250 L)',
        },
        calcLoadPrefix: (area, wm2) => `Calculated heat load (${area} m² · ${wm2} W/m²)`,
        resultHeadlinePrefix: 'Your building requires ~',
        resultHeadlineSuffix: ' thermal output',
        enBadge: 'Sized to EN 12831',
        selectedSourceLabel: (kw) => `Matched heat source (${kw} kW):`,
        fromPriceLabel: (eur) => `from ${eur} € incl. VAT`,
        bufferLabel: 'Buffer tank:',
        bufferNotRequired: 'Not required (0 L)',
        dhwBoilerLabel: (liters) => `DHW cylinder: ${liters} L`,
        ufhLoopsLabel: (loops, pipeM) => `Underfloor heating: ${loops} loops (~${pipeM} m pipe)`,
        radiatorNodeLabel: 'Radiator heating: Danfoss 2026 / IMI Heimeier assembly',
        expansionVesselLabel: (liters) => `Expansion vessel: ${liters} L`,
        recPackageBadge: (numLabel) => `Recommended base boiler room package (${numLabel})`,
        fullPriceVatLabel: 'Complete package price incl. VAT',
        pcsUnit: 'pcs',
        addedToastPrefix: 'Added package to cart:',
        addRecPackageBtn: (eur) => `Add recommended package to cart (${eur} €)`,
        addUnderfloorBtn: (presetLabel) => `+ Add ${presetLabel} underfloor assembly`,
        orderWithInstallBtn: 'Order with engineering & installation',
        leadModalTitle: 'Request Gilės Inžinerija engineering design, BOM & turnkey installation',
        closeBtn: 'Close',
        leadModalSubtitle: (area, kw, pkgTitle) =>
            `Your calculator parameters (${area} m², ${kw} kW, package "${pkgTitle}") will be attached automatically.`,
        nameLabel: 'Name or company *',
        namePlaceholder: 'Your name or company',
        emailLabel: 'Email address *',
        emailPlaceholder: 'name@company.com',
        cityLabel: 'City / district',
        cityPlaceholder: 'Vilnius, Kaunas, Klaipeda...',
        notesLabel: 'Additional details (existing boiler, flue, requested scope)',
        notesPlaceholder: 'E.g.: Need full turnkey boiler room installation and project documentation.',
        submitErrorDefault: 'Failed to submit inquiry. Please check your details.',
        networkError: 'Network error. Please try again or email info@gilesinzinerija.lt.',
        leadSuccess: (ref) =>
            `Inquiry registered (Ref. ${ref || 'OK'}). A UAB „Gilės inžinerija“ engineer will contact you within 2–24 hours.`,
        submittingBtn: 'Submitting inquiry...',
        submitQuoteBtn: 'Request equipment & installation quote',
    },
    pl: {
        sectionAria: 'Kalkulator instalacji grzewczej, mocy kotła, bufora ciepła i ogrzewania podłogowego',
        eyebrow: 'Gilės Inžinerija · INŻYNIERYJNY PULPIT PROJEKTOWY · EN 12831',
        heading: 'Oblicz dokładną moc kotła, pojemność bufora oraz liczbę obiegów ogrzewania podłogowego',
        subtitle:
            'Wybierz powierzchnię domu i klasę izolacji – kalkulator dobierze kompletny pakiet kotłowni oraz ogrzewania podłogowego z naszego magazynu w Kownie.',
        allPackagesBtn: 'Wszystkie 7 pakietów systemowych',
        designInstallBtn: 'Projektowanie i montaż',
        step1Label: '1. Ogrzewana powierzchnia budynku (m²)',
        step2Label: '2. Klasa energetyczna i izolacja budynku',
        insulationOptions: {
            a_plus: 'Klasa A / A+ / A++ (nowy budynek, ~35 W/m²)',
            b_c: 'Klasa B / C lub dom po termomodernizacji (~60 W/m²)',
            old_unrenovated: 'Starszy nieocieplony budynek (~90 W/m²)',
        },
        step3Label: '3. Źródło ciepła / układ kotłowni',
        heatSourceOptions: {
            heat_pump_air_water: 'Pompa ciepła powietrze–woda (Haier Super Aqua R290 / R32 Monoblok)',
            electric_boiler: 'Kocioł elektryczny (Haier ES10V–ES100V 9–28 kW + Gorenje ZV)',
            heat_pump_air_air: 'Pompa ciepła powietrze–powietrze do -25..-30 °C (Haier Nordic)',
            pellet: 'Kocioł peletowy (Gilės Inžinerija KaTRI / Centrometal + Pelltech / Megatherm)',
            solid_fuel_buffer: 'Kocioł stałopalny + bufor ciepła Gorenje ZV / Drazice / Centrometal CAS',
            gas_condensing: 'Gazowy kocioł kondensacyjny (Viessmann Vitodens / Buderus)',
        },
        step4Label: '4. Odbiorniki ciepła',
        emitterOptions: {
            underfloor: 'Ogrzewanie podłogowe',
            mixed: 'Podłogowe + grzejniki',
            radiators: 'Tylko grzejniki',
        },
        step5Label: '5. Liczba domowników (dla CWU)',
        occupantOptions: {
            '1_2': '1–2 osoby (160 L)',
            '3_4': '3–4 osoby (200 L)',
            '5_plus': '5+ osób (250 L)',
        },
        calcLoadPrefix: (area, wm2) => `Obliczone zapotrzebowanie na ciepło (${area} m² · ${wm2} W/m²)`,
        resultHeadlinePrefix: 'Twój dom potrzebuje ~',
        resultHeadlineSuffix: ' mocy grzewczej',
        enBadge: 'Dobrano wg EN 12831',
        selectedSourceLabel: (kw) => `Dobrane źródło ciepła (${kw} kW):`,
        fromPriceLabel: (eur) => `od ${eur} € z VAT`,
        bufferLabel: 'Zbiornik buforowy:',
        bufferNotRequired: 'Niewymagany (0 L)',
        dhwBoilerLabel: (liters) => `Zasobnik CWU: ${liters} L`,
        ufhLoopsLabel: (loops, pipeM) => `Ogrzewanie podłogowe: ${loops} obiegów (~${pipeM} m rury)`,
        radiatorNodeLabel: 'Ogrzewanie grzejnikowe: układ Danfoss 2026 / IMI Heimeier',
        expansionVesselLabel: (liters) => `Naczynie wzbiorcze: ${liters} L`,
        recPackageBadge: (numLabel) => `Zalecany bazowy pakiet kotłowni (${numLabel})`,
        fullPriceVatLabel: 'Cena pełnego zestawu z VAT',
        pcsUnit: 'szt.',
        addedToastPrefix: 'Dodano pakiet do koszyka:',
        addRecPackageBtn: (eur) => `Dodaj zalecany pakiet do koszyka (${eur} €)`,
        addUnderfloorBtn: (presetLabel) => `+ Dodaj węzeł podłogowy ${presetLabel}`,
        orderWithInstallBtn: 'Zamów z projektem i montażem',
        leadModalTitle: 'Zamów projekt, kompletację i montaż pod klucz od Gilės Inžinerija',
        closeBtn: 'Zamknij',
        leadModalSubtitle: (area, kw, pkgTitle) =>
            `Dane z kalkulatora (${area} m², ${kw} kW, pakiet „${pkgTitle}”) zostaną automatycznie dołączone do zapytania.`,
        nameLabel: 'Imię lub firma *',
        namePlaceholder: 'Twoje imię lub nazwa firmy',
        emailLabel: 'Adres e-mail *',
        emailPlaceholder: 'imie@firma.pl',
        cityLabel: 'Miasto / lokalizacja',
        cityPlaceholder: 'Wilno, Kowno, Warszawa...',
        notesLabel: 'Dodatkowe informacje (obecny kocioł, komin, zakres prac)',
        notesPlaceholder: 'Np.: Potrzebny pełny montaż kotłowni wraz z uruchomieniem.',
        submitErrorDefault: 'Nie udało się wysłać zapytania. Sprawdź dane.',
        networkError: 'Błąd połączenia. Spróbuj ponownie lub napisz na info@gilesinzinerija.lt.',
        leadSuccess: (ref) =>
            `Zapytanie zarejestrowane (nr ${ref || 'OK'}). Inżynier UAB „Gilės inžinerija” skontaktuje się w ciągu 2–24 godz.`,
        submittingBtn: 'Wysyłanie zapytania...',
        submitQuoteBtn: 'Uzyskaj wycenę sprzętu i montażu',
    },
    ru: {
        sectionAria: 'Калькулятор системы отопления, мощности котла, буферной емкости и теплого пола',
        eyebrow: 'Gilės Inžinerija · ИНЖЕНЕРНЫЙ РАСЧЕТНЫЙ СТЕНД · EN 12831',
        heading: 'Рассчитайте точную мощность котла, объем буферной емкости и число контуров теплого пола',
        subtitle:
            'Выберите площадь дома и класс утепления – калькулятор подберет полный комплект котельной и водяного теплого пола с нашего склада в Каунасе.',
        allPackagesBtn: 'Все 7 системных пакетов',
        designInstallBtn: 'Проектирование и монтаж',
        step1Label: '1. Отапливаемая площадь здания (м²)',
        step2Label: '2. Энергоэффективность и утепление здания',
        insulationOptions: {
            a_plus: 'Класс A / A+ / A++ (новый дом, ~35 Вт/м²)',
            b_c: 'Класс B / C или реновированный дом (~60 Вт/м²)',
            old_unrenovated: 'Старый неутепленный дом (~90 Вт/м²)',
        },
        step3Label: '3. Источник тепла / тип котельной',
        heatSourceOptions: {
            heat_pump_air_water: 'Тепловой насос воздух–вода (Haier Super Aqua R290 / R32 Моноблок)',
            electric_boiler: 'Электрический котел (Haier ES10V–ES100V 9–28 кВт + Gorenje ZV)',
            heat_pump_air_air: 'Тепловой насос воздух–воздух до -25..-30 °C (Haier Nordic)',
            pellet: 'Пеллетный котел (Gilės Inžinerija KaTRI / Centrometal + Pelltech / Megatherm)',
            solid_fuel_buffer: 'Твердотопливный котел + буферная емкость Gorenje ZV / Drazice / Centrometal CAS',
            gas_condensing: 'Газовый конденсационный котел (Viessmann Vitodens / Buderus)',
        },
        step4Label: '4. Отопительные приборы',
        emitterOptions: {
            underfloor: 'Водяной теплый пол',
            mixed: 'Теплый пол + радиаторы',
            radiators: 'Только радиаторы',
        },
        step5Label: '5. Количество жильцов (для ГВС)',
        occupantOptions: {
            '1_2': '1–2 человека (160 л)',
            '3_4': '3–4 человека (200 л)',
            '5_plus': '5+ человек (250 л)',
        },
        calcLoadPrefix: (area, wm2) => `Расчетная тепловая нагрузка (${area} м² · ${wm2} Вт/м²)`,
        resultHeadlinePrefix: 'Вашему дому требуется ~',
        resultHeadlineSuffix: ' тепловой мощности',
        enBadge: 'Расчет по EN 12831',
        selectedSourceLabel: (kw) => `Подобранный источник тепла (${kw} кВт):`,
        fromPriceLabel: (eur) => `от ${eur} € с НДС`,
        bufferLabel: 'Буферная емкость:',
        bufferNotRequired: 'Не требуется (0 л)',
        dhwBoilerLabel: (liters) => `Бойлер горячей воды: ${liters} л`,
        ufhLoopsLabel: (loops, pipeM) => `Теплый пол: ${loops} контуров (~${pipeM} м трубы)`,
        radiatorNodeLabel: 'Радиаторное отопление: узел Danfoss 2026 / IMI Heimeier',
        expansionVesselLabel: (liters) => `Расширительный бак: ${liters} л`,
        recPackageBadge: (numLabel) => `Рекомендуемый базовый пакет котельной (${numLabel})`,
        fullPriceVatLabel: 'Цена полного комплекта с НДС',
        pcsUnit: 'шт.',
        addedToastPrefix: 'В корзину добавлен комплект:',
        addRecPackageBtn: (eur) => `Добавить рекомендуемый пакет в корзину (${eur} €)`,
        addUnderfloorBtn: (presetLabel) => `+ Добавить узел теплого пола ${presetLabel}`,
        orderWithInstallBtn: 'Заказать с проектированием и монтажом',
        leadModalTitle: 'Заказать проектирование, комплектацию и монтаж под ключ от Gilės Inžinerija',
        closeBtn: 'Закрыть',
        leadModalSubtitle: (area, kw, pkgTitle) =>
            `Данные калькулятора (${area} м², ${kw} кВт, пакет «${pkgTitle}») будут автоматически прикреплены к заявке.`,
        nameLabel: 'Имя или компания *',
        namePlaceholder: 'Ваше имя или компания',
        emailLabel: 'Эл. почта *',
        emailPlaceholder: 'name@company.com',
        cityLabel: 'Город / район',
        cityPlaceholder: 'Вильнюс, Каунас, Клайпеда...',
        notesLabel: 'Дополнительная информация (текущий котел, дымоход, объем работ)',
        notesPlaceholder: 'Напр.: Требуется полный монтаж котельной и пусконаладка.',
        submitErrorDefault: 'Не удалось отправить заявку. Проверьте данные.',
        networkError: 'Ошибка сети. Попробуйте снова или напишите на info@gilesinzinerija.lt.',
        leadSuccess: (ref) =>
            `Заявка зарегистрирована (№ ${ref || 'OK'}). Инженер UAB «Gilės inžinerija» свяжется с вами в течение 2–24 ч.`,
        submittingBtn: 'Отправка заявки...',
        submitQuoteBtn: 'Получить смету на оборудование и монтаж',
    },
};

function localizeCalcDynamicString(raw: string, loc: AppLocale): string {
    if (!raw || loc === 'lt') return raw;
    let out = raw.replace(/Dražice/g, 'Drazice');
    if (loc === 'en') {
        out = out
            .replace(/su PVM/gi, 'incl. VAT')
            .replace(/be PVM/gi, 'excl. VAT')
            .replace(/\barba\b/g, 'or')
            .replace(/\biki\b/g, 'up to')
            .replace(/šilumokaitis/gi, 'heat exchanger')
            .replace(/granulių degiklis/gi, 'pellet burner')
            .replace(/Dujiniam kondensaciniam katilui su plačia moduliacija akumuliacinė talpa nebūtina/gi, 'No buffer tank required for wide-modulation gas condensing boilers')
            .replace(/10–15 L\/kW atitirpinimo \(defrost\) ir hidraulinio atskyrimo talpa:/gi, '10–15 L/kW defrost & hydraulic separation buffer volume:')
            .replace(/Hidrauliniam balansui ir naktinio tarifo kaupimui:/gi, 'For hydraulic balance and off-peak thermal storage:')
            .replace(/Oras–oras šilumos siurblys šildo tiesiogiai orą iki -25\.\.-30 °C \(hidraulinė talpa nereikalinga\)/gi, 'Air-to-air heat pump heats indoor air directly down to -25..-30 °C (hydronic buffer not required)')
            .replace(/50 L \/ 1 kW pagal EN 303-5/gi, '50 L / 1 kW per EN 303-5')
            .replace(/grįžtamo srauto apsauga/gi, 'return flow protection')
            .replace(/Rekomenduojama/gi, 'Recommended')
            .replace(/retesniems granulių degiklio uždegimo ciklams/gi, 'for fewer pellet burner ignition cycles')
            .replace(/Comisa kolektorius/gi, 'Comisa manifold')
            .replace(/pavaros/gi, 'actuators')
            .replace(/termostatai/gi, 'thermostats')
            .replace(/vienvamzdei/gi, 'for one-pipe')
            .replace(/galvutė/gi, 'thermostatic head');
    } else if (loc === 'pl') {
        out = out
            .replace(/su PVM/gi, 'z VAT')
            .replace(/be PVM/gi, 'bez VAT')
            .replace(/\barba\b/g, 'lub')
            .replace(/\biki\b/g, 'do')
            .replace(/šilumokaitis/gi, 'wężownica')
            .replace(/granulių degiklis/gi, 'palnik peletowy')
            .replace(/Dujiniam kondensaciniam katilui su plačia moduliacija akumuliacinė talpa nebūtina/gi, 'Dla gazowego kotła kondensacyjnego z szeroką modulacją bufor nie jest wymagany')
            .replace(/10–15 L\/kW atitirpinimo \(defrost\) ir hidraulinio atskyrimo talpa:/gi, 'Bufor odszraniania (defrost) i sprzęgła 10–15 L/kW:')
            .replace(/Hidrauliniam balansui ir naktinio tarifo kaupimui:/gi, 'Do równowagi hydraulicznej i taryfy nocnej:')
            .replace(/Oras–oras šilumos siurblys šildo tiesiogiai orą iki -25\.\.-30 °C \(hidraulinė talpa nereikalinga\)/gi, 'Pompa powietrze–powietrze ogrzewa bezpośrednio powietrze do -25..-30 °C (bufor niewymagany)')
            .replace(/50 L \/ 1 kW pagal EN 303-5/gi, '50 L / 1 kW wg EN 303-5')
            .replace(/grįžtamo srauto apsauga/gi, 'ochrona powrotu')
            .replace(/Rekomenduojama/gi, 'Zalecany')
            .replace(/retesniems granulių degiklio uždegimo ciklams/gi, 'dla rzadszych cykli rozpalania palnika')
            .replace(/Comisa kolektorius/gi, 'Rozdzielacz Comisa')
            .replace(/pavaros/gi, 'siłowniki')
            .replace(/termostatai/gi, 'termostaty')
            .replace(/vienvamzdei/gi, 'dla instalacji jednorurowej')
            .replace(/galvutė/gi, 'głowica');
    } else if (loc === 'ru') {
        out = out
            .replace(/su PVM/gi, 'с НДС')
            .replace(/be PVM/gi, 'без НДС')
            .replace(/\barba\b/g, 'или')
            .replace(/\biki\b/g, 'до')
            .replace(/šilumokaitis/gi, 'теплообменник')
            .replace(/granulių degiklis/gi, 'пеллетная горелка')
            .replace(/Dujiniam kondensaciniam katilui su plačia moduliacija akumuliacinė talpa nebūtina/gi, 'Для газового конденсационного котла с широкой модуляцией буферная емкость не требуется')
            .replace(/10–15 L\/kW atitirpinimo \(defrost\) ir hidraulinio atskyrimo talpa:/gi, 'Буфер оттайки (defrost) и гидравлического разделения 10–15 л/кВт:')
            .replace(/Hidrauliniam balansui ir naktinio tarifo kaupimui:/gi, 'Для гидравлического баланса и ночного тарифа:')
            .replace(/Oras–oras šilumos siurblys šildo tiesiogiai orą iki -25\.\.-30 °C \(hidraulinė talpa nereikalinga\)/gi, 'Тепловой насос воздух–воздух греет воздух напрямую до -25..-30 °C (буфер не требуется)')
            .replace(/50 L \/ 1 kW pagal EN 303-5/gi, '50 л / 1 кВт по EN 303-5')
            .replace(/grįžtamo srauto apsauga/gi, 'защита обратки')
            .replace(/Rekomenduojama/gi, 'Рекомендуется')
            .replace(/retesniems granulių degiklio uždegimo ciklams/gi, 'для более редких циклов розжига горелки')
            .replace(/Comisa kolektorius/gi, 'Коллектор Comisa')
            .replace(/pavaros/gi, 'сервоприводы')
            .replace(/termostatai/gi, 'термостаты')
            .replace(/vienvamzdei/gi, 'для однотрубной')
            .replace(/galvutė/gi, 'термоголовка');
    }
    return out;
}

export function HeatingSystemCalculator({
    defaultHeatSource = 'pellet',
    compact = false,
    locale: propLocale,
}: HeatingSystemCalculatorProps) {
    const rawPathname = usePathname() || '';
    let intlLocale = 'lt';
    try {
        intlLocale = useLocale() || 'lt';
    } catch {
        intlLocale = 'lt';
    }
    const urlMatch = rawPathname.match(/^\/(lt|en|pl|ru)(?=\/|$)/i);
    const locale = resolveAppLocale(propLocale || (urlMatch ? urlMatch[1] : intlLocale));
    const ui = CALC_UI_COPY[locale];

    const { addItem, openCart } = useCart();

    const [areaM2, setAreaM2] = useState<number>(150);
    const [insulationClass, setInsulationClass] = useState<InsulationClassKey>('b_c');
    const [emitterType, setEmitterType] = useState<HeatingEmitterType>('underfloor');
    const [heatSource, setHeatSource] = useState<HeatSourceType>(defaultHeatSource);
    const [occupants, setOccupants] = useState<OccupantsTier>('3_4');

    const [addedPackageToast, setAddedPackageToast] = useState<string | null>(null);
    const [showLeadModal, setShowLeadModal] = useState<boolean>(false);
    const [leadName, setLeadName] = useState('');
    const [leadEmail, setLeadEmail] = useState('');
    const [leadCity, setLeadCity] = useState('Vilnius');
    const [leadNotes, setLeadNotes] = useState('');
    const [leadSubmitting, setLeadSubmitting] = useState(false);
    const [leadResult, setLeadResult] = useState<{
        ok: boolean;
        reference?: string;
        error?: string;
    } | null>(null);

    const calcResult = useMemo(
        () =>
            calculateHeatingSystemRecommendation({
                areaM2,
                insulationClass,
                emitterType,
                heatSource,
                occupants,
            }),
        [areaM2, insulationClass, emitterType, heatSource, occupants],
    );

    const localizedPackages = useMemo(
        () => getLocalizedSystemPackages(locale),
        [locale],
    );
    const localizedUnderfloorPresets = useMemo(
        () => getLocalizedUnderfloorPresets(locale),
        [locale],
    );

    const recommendedPackage = useMemo(() => {
        return (
            localizedPackages.find((p) => p.id === calcResult.recommendedPackageId) ||
            localizedPackages[0] ||
            GILES_SYSTEM_PACKAGES[0]
        );
    }, [localizedPackages, calcResult.recommendedPackageId]);

    const recommendedUnderfloorPreset = useMemo(() => {
        const presetArea = calcResult.recommendedUnderfloorAreaPreset || 100;
        return (
            localizedUnderfloorPresets.find((p) => p.areaM2 === presetArea) ||
            localizedUnderfloorPresets[1] ||
            UNDERFLOOR_AREA_PRESETS[1]
        );
    }, [localizedUnderfloorPresets, calcResult.recommendedUnderfloorAreaPreset]);

    const packageTotalEur = useMemo(
        () => computePackageTotalEur(recommendedPackage.components),
        [recommendedPackage],
    );

    const handleAddRecommendedPackageToCart = (items: PackageComponentItem[], label: string) => {
        for (const item of items) {
            addItem({
                id: item.variantId || item.productId,
                productId: item.productId,
                variantId: item.variantId,
                name: item.name,
                price: item.priceEur,
                quantity: item.quantity,
                sku: item.sku,
                image: assetUrl(item.imageUrl),
            });
        }
        trackEvent('AddToCart', {
            content_ids: items.map((i) => i.sku),
            content_name: label,
            content_type: 'product_group',
            value: computePackageTotalEur(items),
            currency: 'EUR',
            num_items: items.reduce((sum, i) => sum + i.quantity, 0),
        });
        setAddedPackageToast(label);
        openCart();
        setTimeout(() => setAddedPackageToast(null), 4000);
    };

    const handleLeadSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLeadSubmitting(true);
        setLeadResult(null);

        try {
            const endpoint = apiUrl('/api/engineering-lead');
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: leadName,
                    phone: '',
                    email: leadEmail,
                    city: leadCity,
                    areaM2,
                    packageId: recommendedPackage.id,
                    serviceType: `Calculator selection (${calcResult.requiredPowerKw} kW, ${areaM2} m²) + installation`,
                    notes: `${leadNotes} | Calculator: ${areaM2} m², ${calcResult.specificHeatLossWm2} W/m², ${calcResult.requiredPowerKw} kW, buffer ${calcResult.recommendedBufferLiters} L, DHW ${calcResult.recommendedBoilerModel}, UFH loops ${calcResult.underfloorLoopsCount} (${calcResult.underfloorPipeLengthM} m), vessel ${calcResult.recommendedExpansionVesselLiters} L.`,
                    items: recommendedPackage.components.map((c) => ({
                        sku: c.sku,
                        title: c.name,
                        quantity: c.quantity,
                        unitPrice: c.priceEur,
                    })),
                }),
            });
            const data = await res.json();
            if (!res.ok || !data.ok) {
                setLeadResult({
                    ok: false,
                    error: data.error || ui.submitErrorDefault,
                });
            } else {
                setLeadResult({
                    ok: true,
                    reference: data.reference,
                });
            }
        } catch {
            setLeadResult({
                ok: false,
                error: ui.networkError,
            });
        } finally {
            setLeadSubmitting(false);
        }
    };

    return (
        <section
            id="sildymo-sistemos-skaiciuokle"
            data-testid="giles-heating-system-cad-calculator"
            aria-label={ui.sectionAria}
            className="rounded-none border border-[#E2DDD3] bg-[#F5F3EE] p-5 md:p-6"
        >
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 pb-4 mb-5 border-b border-[#E2DDD3]">
                <div>
                    <span className="text-xs font-bold text-[#C2410C] block mb-1">
                        {ui.eyebrow}
                    </span>
                    <h2 className="text-xl md:text-2xl font-bold text-[#11161B]">
                        {ui.heading}
                    </h2>
                    <p className="text-xs sm:text-sm text-[#5B6470] mt-1">
                        {ui.subtitle}
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <Link
                        href={`/${locale}/paketai`}
                        className="inline-flex items-center min-h-[40px] px-3 py-2 rounded-none border border-[#D5CFC3] bg-white text-xs font-semibold text-[#11161B] hover:border-[#11161B] transition-colors"
                    >
                        {ui.allPackagesBtn}
                    </Link>
                    <Link
                        href={`/${locale}/inzinerija`}
                        className="inline-flex items-center min-h-[40px] px-3 py-2 rounded-none border border-[#D5CFC3] bg-white text-xs font-semibold text-[#11161B] hover:border-[#11161B] transition-colors"
                    >
                        {ui.designInstallBtn}
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 border-t border-l border-[#E2DDD3] bg-white items-start">
                {/* Left Column: Calculator Controls */}
                <div className="lg:col-span-5 space-y-4 rounded-none border-r border-b border-[#E2DDD3] bg-white p-5">
                    <div>
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                            <label htmlFor="calc-area-input" className="text-xs font-bold text-stone-900">
                                {ui.step1Label}
                            </label>
                            <span className="font-mono text-sm font-bold text-[var(--primary)]">
                                {areaM2} m²
                            </span>
                        </div>
                        <input
                            id="calc-area-input"
                            type="range"
                            min={40}
                            max={350}
                            step={10}
                            value={areaM2}
                            onChange={(e) => setAreaM2(Number(e.target.value))}
                            className="w-full accent-[var(--primary)] cursor-pointer"
                        />
                        <div className="flex flex-wrap gap-1.5 mt-2">
                            {[80, 120, 150, 200, 260].map((preset) => (
                                <button
                                    key={preset}
                                    type="button"
                                    onClick={() => setAreaM2(preset)}
                                    className={`min-h-[36px] px-2.5 py-1 rounded-xs text-xs font-semibold border transition-colors ${
                                        areaM2 === preset
                                            ? 'bg-stone-900 text-white border-stone-900'
                                            : 'bg-white text-stone-700 border-stone-300 hover:border-stone-900'
                                    }`}
                                >
                                    {preset} m²
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <span className="block text-xs font-bold text-stone-900 mb-1.5">
                            {ui.step2Label}
                        </span>
                        <div className="grid grid-cols-1 gap-1.5">
                            {(['a_plus', 'b_c', 'old_unrenovated'] as const).map((key) => (
                                <button
                                    key={key}
                                    type="button"
                                    onClick={() => setInsulationClass(key)}
                                    className={`min-h-[44px] px-3 py-2 rounded-sm text-left text-xs font-semibold border transition-colors ${
                                        insulationClass === key
                                            ? 'bg-stone-900 text-white border-stone-900'
                                            : 'bg-white text-stone-800 border-stone-300 hover:border-stone-900'
                                    }`}
                                >
                                    {ui.insulationOptions[key]}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <span className="block text-xs font-bold text-stone-900 mb-1.5">
                            {ui.step3Label}
                        </span>
                        <div className="grid grid-cols-1 gap-1.5">
                            {(
                                [
                                    'heat_pump_air_water',
                                    'electric_boiler',
                                    'heat_pump_air_air',
                                    'pellet',
                                    'solid_fuel_buffer',
                                    'gas_condensing',
                                ] as const
                            ).map((key) => (
                                <button
                                    key={key}
                                    type="button"
                                    onClick={() => setHeatSource(key)}
                                    className={`min-h-[44px] px-3 py-2 rounded-sm text-left text-xs font-semibold border transition-colors ${
                                        heatSource === key
                                            ? 'bg-[var(--primary)] text-white border-[var(--primary)]'
                                            : 'bg-white text-stone-800 border-stone-300 hover:border-stone-900'
                                    }`}
                                >
                                    {ui.heatSourceOptions[key]}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <span className="block text-xs font-bold text-stone-900 mb-1.5">
                                {ui.step4Label}
                            </span>
                            <div className="flex flex-col gap-1.5">
                                {(['underfloor', 'mixed', 'radiators'] as const).map((key) => (
                                    <button
                                        key={key}
                                        type="button"
                                        onClick={() => setEmitterType(key)}
                                        className={`min-h-[40px] px-2.5 py-1.5 rounded-sm text-left text-xs font-semibold border transition-colors ${
                                            emitterType === key
                                                ? 'bg-stone-900 text-white border-stone-900'
                                                : 'bg-white text-stone-800 border-stone-300 hover:border-stone-900'
                                        }`}
                                    >
                                        {ui.emitterOptions[key]}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <span className="block text-xs font-bold text-stone-900 mb-1.5">
                                {ui.step5Label}
                            </span>
                            <div className="flex flex-col gap-1.5">
                                {(['1_2', '3_4', '5_plus'] as const).map((key) => (
                                    <button
                                        key={key}
                                        type="button"
                                        onClick={() => setOccupants(key)}
                                        className={`min-h-[40px] px-2.5 py-1.5 rounded-sm text-left text-xs font-semibold border transition-colors ${
                                            occupants === key
                                                ? 'bg-stone-900 text-white border-stone-900'
                                                : 'bg-white text-stone-800 border-stone-300 hover:border-stone-900'
                                        }`}
                                    >
                                        {ui.occupantOptions[key]}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Hero Engineering Result & Recommended Package */}
                <div className="lg:col-span-7 space-y-4">
                    {/* Result Hero Banner */}
                    <div className="rounded-md border-2 border-stone-900 bg-[var(--surface-paper)] p-5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-4 border-b border-stone-300">
                            <div>
                                <span className="text-xs font-semibold text-stone-600 block">
                                    {ui.calcLoadPrefix(areaM2, calcResult.specificHeatLossWm2)}
                                </span>
                                <p className="text-2xl md:text-3xl font-bold text-stone-900 mt-0.5">
                                    {ui.resultHeadlinePrefix}
                                    <span className="font-mono text-[var(--primary)]">
                                        {calcResult.requiredPowerKw} kW
                                    </span>
                                    {ui.resultHeadlineSuffix}
                                </p>
                            </div>
                            <span className="inline-flex items-center self-start sm:self-center px-2.5 py-1 rounded-xs bg-emerald-900 text-white text-xs font-semibold">
                                {ui.enBadge}
                            </span>
                        </div>

                        <div className="mb-3 rounded-sm border border-stone-300 bg-white p-3 text-xs">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <div>
                                    <span className="font-bold text-stone-900 block">
                                        {ui.selectedSourceLabel(calcResult.requiredPowerKw)}
                                    </span>
                                    <p className="text-stone-700 mt-0.5 leading-relaxed">
                                        {localizeCalcDynamicString(calcResult.recommendedHeatSourceModel, locale)} · SKU:{' '}
                                        <Link
                                            href={`/${locale}/products/${calcResult.recommendedHeatSourceSlug}`}
                                            className="font-mono font-bold text-[var(--primary)] hover:underline"
                                        >
                                            {calcResult.recommendedHeatSourceSku}
                                        </Link>
                                    </p>
                                </div>
                                <span className="tabular-nums font-mono text-sm font-bold text-stone-900 shrink-0">
                                    {ui.fromPriceLabel(calcResult.recommendedHeatSourcePriceEur.toFixed(2))}
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                            <div className="rounded-sm border border-stone-300 bg-white p-3">
                                <div className="flex items-center gap-1.5 font-bold text-stone-900 mb-1">
                                    <Flame className="w-4 h-4 text-[var(--primary)] shrink-0" aria-hidden="true" />
                                    <span>
                                        {ui.bufferLabel}{' '}
                                        {calcResult.recommendedBufferLiters > 0
                                            ? `${calcResult.recommendedBufferLiters} L${calcResult.recommendedBufferSku ? ` (${calcResult.recommendedBufferSku})` : ''}`
                                            : ui.bufferNotRequired}
                                    </span>
                                </div>
                                <p className="text-stone-600 leading-relaxed">
                                    {localizeCalcDynamicString(calcResult.bufferReason, locale)}
                                </p>
                            </div>

                            <div className="rounded-sm border border-stone-300 bg-white p-3">
                                <div className="flex items-center gap-1.5 font-bold text-stone-900 mb-1">
                                    <Droplets className="w-4 h-4 text-[var(--secondary)] shrink-0" aria-hidden="true" />
                                    <span>{ui.dhwBoilerLabel(calcResult.recommendedBoilerLiters)}</span>
                                </div>
                                <p className="text-stone-600 leading-relaxed">
                                    {localizeCalcDynamicString(calcResult.recommendedBoilerModel, locale)} (SKU:{' '}
                                    <span className="font-mono font-semibold">{calcResult.recommendedBoilerSku}</span>)
                                </p>
                            </div>

                            <div className="rounded-sm border border-stone-300 bg-white p-3">
                                <div className="flex items-center gap-1.5 font-bold text-stone-900 mb-1">
                                    <Layers className="w-4 h-4 text-[var(--primary)] shrink-0" aria-hidden="true" />
                                    <span>
                                        {calcResult.underfloorLoopsCount > 0
                                            ? ui.ufhLoopsLabel(
                                                  calcResult.underfloorLoopsCount,
                                                  calcResult.underfloorPipeLengthM,
                                              )
                                            : ui.radiatorNodeLabel}
                                    </span>
                                </div>
                                <p className="text-stone-600 leading-relaxed">
                                    {localizeCalcDynamicString(calcResult.recommendedRadiatorControlLabel, locale)} (SKU:{' '}
                                    <span className="font-mono font-semibold">{calcResult.recommendedManifoldSku}</span>)
                                </p>
                            </div>

                            <div className="rounded-sm border border-stone-300 bg-white p-3">
                                <div className="flex items-center gap-1.5 font-bold text-stone-900 mb-1">
                                    <Gauge className="w-4 h-4 text-[var(--secondary)] shrink-0" aria-hidden="true" />
                                    <span>{ui.expansionVesselLabel(calcResult.recommendedExpansionVesselLiters)}</span>
                                </div>
                                <p className="text-stone-600 leading-relaxed">
                                    IMI Pneumatex Statico SD (SKU:{' '}
                                    <span className="font-mono font-semibold">{calcResult.recommendedExpansionVesselSku}</span>)
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Matched System Package Card */}
                    <div className="rounded-md border border-stone-300 bg-white p-4 sm:p-5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 mb-3 border-b border-stone-200">
                            <div>
                                <span className="text-xs font-bold text-emerald-800 block">
                                    {ui.recPackageBadge(recommendedPackage.numberLabel)}
                                </span>
                                <h3 className="text-base sm:text-lg font-bold text-stone-900">
                                    {recommendedPackage.title}
                                </h3>
                            </div>
                            <div className="text-left sm:text-right shrink-0">
                                <span className="text-xs text-stone-500 block">{ui.fullPriceVatLabel}</span>
                                <span className="tabular-nums text-xl font-bold text-stone-900">
                                    {packageTotalEur.toFixed(2)} €
                                </span>
                            </div>
                        </div>

                        {!compact && (
                            <div className="space-y-2 mb-4">
                                {recommendedPackage.components.map((item) => (
                                    <div
                                        key={item.sku}
                                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-sm border border-stone-200 bg-[var(--surface-paper)] px-3 py-2 text-xs"
                                    >
                                        <div className="min-w-0">
                                            <span className="font-bold text-stone-900 block">
                                                {item.name}
                                            </span>
                                            <p className="text-stone-600 mt-0.5">
                                                <span className="font-semibold">{item.brand}</span> ·{' '}
                                                <Link
                                                    href={`/${locale}/products/${item.slug}`}
                                                    className="font-mono font-semibold text-[var(--primary)] hover:underline whitespace-nowrap"
                                                >
                                                    {item.sku}
                                                </Link>{' '}
                                                · {item.specSummary}
                                            </p>
                                        </div>
                                        <div className="tabular-nums font-semibold text-stone-900 shrink-0 whitespace-nowrap">
                                            {item.quantity} {ui.pcsUnit} × {item.priceEur.toFixed(2)} €
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {addedPackageToast && (
                            <div className="mb-3 rounded-sm border border-emerald-700 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-950 flex items-center gap-2">
                                <Check className="w-4 h-4 shrink-0 text-emerald-700" />
                                <span>
                                    {ui.addedToastPrefix} {addedPackageToast}
                                </span>
                            </div>
                        )}

                        <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2.5">
                            <button
                                type="button"
                                onClick={() =>
                                    handleAddRecommendedPackageToCart(
                                        recommendedPackage.components,
                                        recommendedPackage.title,
                                    )
                                }
                                className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2.5 rounded-sm bg-[var(--primary)] hover:bg-[var(--brand-accent-hover)] text-white text-xs sm:text-sm font-bold transition-colors cursor-pointer"
                            >
                                <ShoppingCart className="w-4 h-4 shrink-0" />
                                <span>{ui.addRecPackageBtn(packageTotalEur.toFixed(2))}</span>
                            </button>

                            {calcResult.underfloorLoopsCount > 0 && (
                                <button
                                    type="button"
                                    onClick={() =>
                                        handleAddRecommendedPackageToCart(
                                            recommendedUnderfloorPreset.components,
                                            `Comisa ${recommendedUnderfloorPreset.label}`,
                                        )
                                    }
                                    className="inline-flex items-center justify-center gap-2 min-h-[44px] px-3.5 py-2.5 rounded-sm border border-stone-900 bg-white hover:bg-stone-100 text-stone-900 text-xs font-bold transition-colors cursor-pointer"
                                >
                                    <span>{ui.addUnderfloorBtn(recommendedUnderfloorPreset.label)}</span>
                                </button>
                            )}

                            <button
                                type="button"
                                onClick={() => setShowLeadModal((prev) => !prev)}
                                className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2.5 rounded-sm bg-stone-900 hover:bg-stone-800 text-white text-xs sm:text-sm font-bold transition-colors cursor-pointer"
                            >
                                <Wrench className="w-4 h-4 shrink-0" />
                                <span>{ui.orderWithInstallBtn}</span>
                            </button>
                        </div>

                        {/* Inline Engineering Quote Lead Form */}
                        {showLeadModal && (
                            <form
                                onSubmit={handleLeadSubmit}
                                className="mt-4 pt-4 border-t border-stone-300 space-y-3 bg-[var(--surface-paper)] p-4 rounded-sm"
                            >
                                <div className="flex items-center justify-between gap-2">
                                    <h4 className="text-sm font-bold text-stone-900">
                                        {ui.leadModalTitle}
                                    </h4>
                                    <button
                                        type="button"
                                        onClick={() => setShowLeadModal(false)}
                                        className="text-xs font-semibold text-stone-600 hover:text-stone-900"
                                    >
                                        {ui.closeBtn}
                                    </button>
                                </div>
                                <p className="text-xs text-stone-600">
                                    {ui.leadModalSubtitle(
                                        areaM2,
                                        calcResult.requiredPowerKw,
                                        recommendedPackage.title,
                                    )}
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <div>
                                        <label className="block text-xs font-semibold text-stone-800 mb-1">
                                            {ui.nameLabel}
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={leadName}
                                            onChange={(e) => setLeadName(e.target.value)}
                                            placeholder={ui.namePlaceholder}
                                            className="w-full min-h-[42px] rounded-sm border border-stone-300 bg-white px-3 py-2 text-xs text-stone-900"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-stone-800 mb-1">
                                            {ui.emailLabel}
                                        </label>
                                        <input
                                            type="email"
                                            required
                                            value={leadEmail}
                                            onChange={(e) => setLeadEmail(e.target.value)}
                                            placeholder={ui.emailPlaceholder}
                                            className="w-full min-h-[42px] rounded-sm border border-stone-300 bg-white px-3 py-2 text-xs text-stone-900"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-stone-800 mb-1">
                                            {ui.cityLabel}
                                        </label>
                                        <input
                                            type="text"
                                            value={leadCity}
                                            onChange={(e) => setLeadCity(e.target.value)}
                                            placeholder={ui.cityPlaceholder}
                                            className="w-full min-h-[42px] rounded-sm border border-stone-300 bg-white px-3 py-2 text-xs text-stone-900"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-stone-800 mb-1">
                                        {ui.notesLabel}
                                    </label>
                                    <textarea
                                        rows={2}
                                        value={leadNotes}
                                        onChange={(e) => setLeadNotes(e.target.value)}
                                        placeholder={ui.notesPlaceholder}
                                        className="w-full rounded-sm border border-stone-300 bg-white px-3 py-2 text-xs text-stone-900"
                                    />
                                </div>

                                {leadResult && (
                                    <div
                                        className={`rounded-sm p-3 text-xs font-semibold border ${
                                            leadResult.ok
                                                ? 'border-emerald-700 bg-emerald-50 text-emerald-950'
                                                : 'border-red-700 bg-red-50 text-red-950'
                                        }`}
                                    >
                                        {leadResult.ok
                                            ? ui.leadSuccess(leadResult.reference)
                                            : leadResult.error}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={leadSubmitting}
                                    className="inline-flex items-center justify-center min-h-[44px] px-5 py-2.5 rounded-sm bg-[var(--primary)] hover:bg-[var(--brand-accent-hover)] text-white text-xs font-bold transition-colors disabled:opacity-60"
                                >
                                    {leadSubmitting ? ui.submittingBtn : ui.submitQuoteBtn}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}
