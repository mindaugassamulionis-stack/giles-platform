import { resolveAppLocale } from '../i18n/storefront-ui-copy';
import type { AppLocale } from '../i18n/routing';
import type { ProductUxGuide, V3SpecRow } from './v3-description';
import type { ProductFaqItem } from './product-faq-and-comparison';
import { formatLtDecimalCommas } from './product-text';

export type SupportedLocale = AppLocale;

function toLoc(locale?: string | null): SupportedLocale {
    return resolveAppLocale(locale);
}

const CATEGORY_MAP: Record<string, Record<Exclude<SupportedLocale, 'lt'>, string>> = {
    'Visos 6 337 prekės': {
        en: 'All 6,337 products',
        pl: 'Wszystkie 6 337 produktów',
        ru: 'Все 6 337 товаров',
    },
    'Visos kategorijos': {
        en: 'All categories',
        pl: 'Wszystkie kategorie',
        ru: 'Все категории',
    },
    'Granulių degikliai': {
        en: 'Pellet burners',
        pl: 'Palniki pelletowe',
        ru: 'Пеллетные горелки',
    },
    'Katilai ir šilumos siurbliai': {
        en: 'Boilers & heat pumps',
        pl: 'Kotły i pompy ciepła',
        ru: 'Котлы и тепловые насосы',
    },
    'Akumuliacinės talpos ir boileriai': {
        en: 'Buffer tanks & water heaters',
        pl: 'Bufory ciepła i bojlery',
        ru: 'Буферные емкости и бойлеры',
    },
    'Termostatika ir vožtuvai': {
        en: 'Thermostatics & valves',
        pl: 'Termostatyka i zawory',
        ru: 'Термостатика и клапаны',
    },
    'Grindinis šildymas': {
        en: 'Underfloor heating',
        pl: 'Ogrzewanie podłogowe',
        ru: 'Теплый пол',
    },
    'Atsarginės dalys': {
        en: 'Spare parts',
        pl: 'Części zamienne',
        ru: 'Запчасти и автоматика',
    },
    'Grindinis šildymas ir kolektoriai': {
        en: 'Underfloor heating & manifolds',
        pl: 'Ogrzewanie podłogowe i rozdzielacze',
        ru: 'Теплый пол и коллекторы',
    },
    'Plėtimosi indai ir slėgio palaikymas': {
        en: 'Expansion vessels & pressurisation',
        pl: 'Naczynia wzbiorcze i utrzymanie ciśnienia',
        ru: 'Расширительные баки и поддержание давления',
    },
    'Plėtimosi indai': {
        en: 'Expansion vessels',
        pl: 'Naczynia wzbiorcze',
        ru: 'Расширительные баки',
    },
    'Balansiniai ir reguliavimo vožtuvai': {
        en: 'Balancing & control valves',
        pl: 'Zawory równoważące i regulacyjne',
        ru: 'Балансировочные и регулирующие клапаны',
    },
    'Balansiniai vožtuvai': {
        en: 'Balancing valves',
        pl: 'Zawory równoważące',
        ru: 'Балансировочные клапаны',
    },
    'Termostatinės galvutės ir vožtuvai': {
        en: 'Thermostatic heads & valves',
        pl: 'Głowice i zawory termostatyczne',
        ru: 'Термостатические головки и клапаны',
    },
    'Termostatinės galvutės': {
        en: 'Thermostatic heads',
        pl: 'Głowice termostatyczne',
        ru: 'Термостатические головки',
    },
    'Šildymo katilai ir krosnelės': {
        en: 'Heating boilers & stoves',
        pl: 'Kotły grzewcze i piece',
        ru: 'Отопительные котлы и печи',
    },
    'Šildymo katilai': {
        en: 'Heating boilers',
        pl: 'Kotły grzewcze',
        ru: 'Отопительные котлы',
    },
    'Katilai ir katilinės įranga': {
        en: 'Boilers & boiler room equipment',
        pl: 'Kotły i wyposażenie kotłowni',
        ru: 'Котлы и котельное оборудование',
    },
    'Vandens šildytuvai ir akumuliacinės talpos': {
        en: 'Water heaters & buffer tanks',
        pl: 'Podgrzewacze wody i zasobniki buforowe',
        ru: 'Водонагреватели и буферные емкости',
    },
    'Vandens šildytuvai': {
        en: 'Water heaters',
        pl: 'Podgrzewacze wody',
        ru: 'Водонагреватели',
    },
    'Oro atskyrikliai ir nuorintuvai': {
        en: 'Air & dirt separators, air vents',
        pl: 'Separatory powietrza i odpowietrzniki',
        ru: 'Сепараторы воздуха и воздухоотводчики',
    },
    'Oro atskyrikliai': {
        en: 'Air separators',
        pl: 'Separatory powietrza',
        ru: 'Сепараторы воздуха',
    },
    'Katilinės automatika ir pavaros': {
        en: 'Boiler room automation & actuators',
        pl: 'Automatyka kotłowni i siłowniki',
        ru: 'Автоматика котельной и приводы',
    },
    'Katilinės automatika': {
        en: 'Boiler automation',
        pl: 'Automatyka kotłowni',
        ru: 'Автоматика котельной',
    },
    'Cirkuliaciniai ir vandens siurbliai': {
        en: 'Circulation & water pumps',
        pl: 'Pompy obiegowe i wodne',
        ru: 'Циркуляционные и водяные насосы',
    },
    'Degikliai ir priedai': {
        en: 'Burners & accessories',
        pl: 'Palniki i akcesoria',
        ru: 'Горелки и комплектующие',
    },
    'Nuotekų ir kanalizacijos sistemos': {
        en: 'Wastewater & drainage systems',
        pl: 'Systemy kanalizacyjne i odpływowe',
        ru: 'Системы канализации и водоотведения',
    },
    'Radiatoriai ir konvektoriai': {
        en: 'Radiators & convectors',
        pl: 'Grzejniki i konwektory',
        ru: 'Радиаторы ir конвекторы',
    },
    'Radiatoriai ir šildymo prietaisai': {
        en: 'Radiators & heating units',
        pl: 'Grzejniki i urządzenia grzewcze',
        ru: 'Радиаторы и отопительные приборы',
    },
    'Radiatoriai': {
        en: 'Radiators',
        pl: 'Grzejniki',
        ru: 'Радиаторы',
    },
    'Santechnika ir maišytuvai': {
        en: 'Plumbing & faucets',
        pl: 'Armatura sanitarna i baterie',
        ru: 'Сантехника и смесители',
    },
    'Saulės energija ir kolektoriai': {
        en: 'Solar thermal systems & collectors',
        pl: 'Energia słoneczna i kolektory',
        ru: 'Солнечная энергия и коллекторы',
    },
    'Šilumos izoliacija': {
        en: 'Thermal pipe insulation',
        pl: 'Izolacja termiczna',
        ru: 'Теплоизоляция',
    },
    'Vamzdynų jungtys ir armatūra': {
        en: 'Pipe fittings & valves',
        pl: 'Złączki rurowe i armatura',
        ru: 'Трубопроводные фитинги и арматура',
    },
    'Vamzdžiai ir jungiamosios detalės': {
        en: 'Pipes & fittings',
        pl: 'Rury i kształtki',
        ru: 'Трубы и соединительные детали',
    },
    'Vamzdžiai ir jungtys': {
        en: 'Pipes & fittings',
        pl: 'Rury i złączki',
        ru: 'Трубы и фитинги',
    },
    'Siurbliai ir pamaišymo mazgai': {
        en: 'Pumps & mixing units',
        pl: 'Pompy i grupy pompowo-mieszające',
        ru: 'Насосы и смесительные узлы',
    },
    'Siurbliai ir mazgai': {
        en: 'Pumps & mixing units',
        pl: 'Pompy i grupy mieszające',
        ru: 'Насосы и узлы',
    },
    'ŠVOK ir santechnikos įranga': {
        en: 'HVAC & hydronic engineering equipment',
        pl: 'Urządzenia HVAC i instalacje grzewcze',
        ru: 'Инженерное оборудование ОВиК и сантехника',
    },
};

const SUBTYPE_MAP: Record<string, Record<Exclude<SupportedLocale, 'lt'>, string>> = {
    kolektoriai: {
        en: 'Manifolds (headers)',
        pl: 'Rozdzielacze',
        ru: 'Коллекторы (гребенки)',
    },
    'Kolektoriai (šakotuvai)': {
        en: 'Manifolds (headers)',
        pl: 'Rozdzielacze',
        ru: 'Коллекторы (гребенки)',
    },
    Kolektoriai: {
        en: 'Manifolds',
        pl: 'Rozdzielacze',
        ru: 'Коллекторы',
    },
    pavaros: {
        en: 'Thermal actuators & controllers',
        pl: 'Siłowniki termiczne i sterowniki',
        ru: 'Термоприводы и контроллеры',
    },
    'Terminės pavaros ir valdikliai': {
        en: 'Thermal actuators & controllers',
        pl: 'Siłowniki termiczne i sterowniki',
        ru: 'Термоприводы и контроллеры',
    },
    'Terminės pavaros': {
        en: 'Thermal actuators',
        pl: 'Siłowniki termiczne',
        ru: 'Термоприводы',
    },
    spinteles: {
        en: 'Manifold cabinets & brackets',
        pl: 'Szafki i uchwyty montażowe',
        ru: 'Коллекторные шкафы и кронштейны',
    },
    'Spintelės ir laikikliai': {
        en: 'Manifold cabinets & brackets',
        pl: 'Szafki i uchwyty montażowe',
        ru: 'Коллекторные шкафы и кронштейны',
    },
    'Spintelės ir dėžės': {
        en: 'Cabinets & boxes',
        pl: 'Szafki i skrzynki',
        ru: 'Шкафы и боксы',
    },
    jungtys: {
        en: 'Eurocone adapters & fittings',
        pl: 'Złączki Eurokonus i kształtki',
        ru: 'Евроконусы и фитинги',
    },
    'Eurokonusai ir jungtys': {
        en: 'Eurocone adapters & fittings',
        pl: 'Złączki Eurokonus i kształtki',
        ru: 'Евроконусы и фитинги',
    },
    galvutes: {
        en: 'Thermostatic heads',
        pl: 'Głowice termostatyczne',
        ru: 'Термостатические головки',
    },
    'Termostatinės galvutės': {
        en: 'Thermostatic heads',
        pl: 'Głowice termostatyczne',
        ru: 'Термостатические головки',
    },
    voztuvai: {
        en: 'Thermostatic valves',
        pl: 'Zawory termostatyczne',
        ru: 'Термостатические клапаны',
    },
    'Termostatiniai vožtuvai': {
        en: 'Thermostatic valves',
        pl: 'Zawory termostatyczne',
        ru: 'Термостатические клапаны',
    },
    'h-blokai': {
        en: 'Bottom-connection H-blocks',
        pl: 'Zestawy przyłączeniowe dolne H',
        ru: 'Узлы нижнего подключения (H-блоки)',
    },
    'Apatinio pajungimo H-blokai': {
        en: 'Bottom-connection H-blocks',
        pl: 'Zestawy przyłączeniowe dolne H',
        ru: 'Узлы нижнего подключения (H-блоки)',
    },
    'Apatiniai H-blokai': {
        en: 'Bottom H-blocks',
        pl: 'Dolne bloki H',
        ru: 'Нижние H-блоки',
    },
    'pletimosi-indai': {
        en: 'Expansion vessels',
        pl: 'Naczynia wzbiorcze',
        ru: 'Расширительные баки',
    },
    'Plėtimosi indai': {
        en: 'Expansion vessels',
        pl: 'Naczynia wzbiorcze',
        ru: 'Расширительные баки',
    },
    'slegio-stoteles': {
        en: 'Pressurisation units',
        pl: 'Układy stabilizacji ciśnienia',
        ru: 'Станции поддержания давления',
    },
    'Slėgio stotelės': {
        en: 'Pressurisation units',
        pl: 'Układy stabilizacji ciśnienia',
        ru: 'Станции поддержания давления',
    },
    'tvirtinimas-servisas': {
        en: 'Mounting & service units (SMU / DLV)',
        pl: 'Zespoły montażowe i serwisowe (SMU / DLV)',
        ru: 'Монтажные и сервисные узлы (SMU / DLV)',
    },
    'Tvirtinimo ir serviso mazgai (SMU / DLV)': {
        en: 'Mounting & service units (SMU / DLV)',
        pl: 'Zespoły montażowe i serwisowe (SMU / DLV)',
        ru: 'Монтажные и сервисные узлы (SMU / DLV)',
    },
    'Serviso mazgai SMU/DLV': {
        en: 'Service units SMU/DLV',
        pl: 'Zespoły serwisowe SMU/DLV',
        ru: 'Сервисные узлы SMU/DLV',
    },
    balansiniai: {
        en: 'Balancing valves',
        pl: 'Zawory równoważące',
        ru: 'Балансировочные клапаны',
    },
    'Balansiniai vožtuvai': {
        en: 'Balancing valves',
        pl: 'Zawory równoważące',
        ru: 'Балансировочные клапаны',
    },
    separatoriai: {
        en: 'Air vents & dirt separators',
        pl: 'Odpowietrzniki i separatory zanieczyszczeń',
        ru: 'Воздухоотводчики и сепараторы шлама',
    },
    'Nuorintuvai ir purvo separatoriai': {
        en: 'Air vents & dirt separators',
        pl: 'Odpowietrzniki i separatory zanieczyszczeń',
        ru: 'Воздухоотводчики и сепараторы шлама',
    },
    'Purvo separatoriai': {
        en: 'Dirt separators',
        pl: 'Separatory zanieczyszczeń',
        ru: 'Сепараторы шлама',
    },
    'katilai-boileriai': {
        en: 'Boilers & water heaters',
        pl: 'Kotły i podgrzewacze wody',
        ru: 'Котлы и водонагреватели',
    },
    'Katilai ir vandens šildytuvai': {
        en: 'Boilers & water heaters',
        pl: 'Kotły i podgrzewacze wody',
        ru: 'Котлы и водонагреватели',
    },
    'Katilai ir boileriai': {
        en: 'Boilers & water heaters',
        pl: 'Kotły i bojlery',
        ru: 'Котлы и бойлеры',
    },
    radiatoriai: {
        en: 'Radiators & convectors',
        pl: 'Grzejniki i konwektory',
        ru: 'Радиаторы и конвекторы',
    },
    'Radiatoriai ir konvektoriai': {
        en: 'Radiators & convectors',
        pl: 'Grzejniki i konwektory',
        ru: 'Радиаторы и конвекторы',
    },
};

export function localizeCategoryLabel(categoryKeyOrLabel: string, locale: string): string {
    const loc = toLoc(locale);
    const trimmed = (categoryKeyOrLabel || '').trim();
    if (!trimmed || loc === 'lt') return trimmed;

    if (CATEGORY_MAP[trimmed]) {
        return CATEGORY_MAP[trimmed][loc];
    }
    const lower = trimmed.toLowerCase();
    for (const [k, v] of Object.entries(CATEGORY_MAP)) {
        if (k.toLowerCase() === lower) {
            return v[loc];
        }
    }
    return localizeProductTitle(trimmed, loc);
}

export function localizeSubtypeLabel(subtypeLabel: string, locale: string): string {
    const loc = toLoc(locale);
    const trimmed = (subtypeLabel || '').trim();
    if (!trimmed || loc === 'lt') return trimmed;

    if (SUBTYPE_MAP[trimmed]) {
        return SUBTYPE_MAP[trimmed][loc];
    }
    const lower = trimmed.toLowerCase();
    for (const [k, v] of Object.entries(SUBTYPE_MAP)) {
        if (k.toLowerCase() === lower) {
            return v[loc];
        }
    }
    if (CATEGORY_MAP[trimmed]) {
        return CATEGORY_MAP[trimmed][loc];
    }
    return localizeProductTitle(trimmed, loc);
}

const SPEC_KEY_MAP: Record<string, Record<Exclude<SupportedLocale, 'lt'>, string>> = {
    Gamintojas: { en: 'Manufacturer', pl: 'Producent', ru: 'Производитель' },
    Kodas: { en: 'SKU Code', pl: 'Kod SKU', ru: 'Артикул / Код' },
    'Modelis / Kodas': { en: 'Model / SKU', pl: 'Model / Kod', ru: 'Модель / Код' },
    'Modelis / Ko': { en: 'Model / SKU', pl: 'Model / Kod', ru: 'Модель / Код' },
    'Modelis /': { en: 'Model', pl: 'Model', ru: 'Модель' },
    Tipas: { en: 'Component Type', pl: 'Typ elementu', ru: 'Тип узла' },
    Šeima: { en: 'Product Series', pl: 'Seria produktu', ru: 'Серия' },
    'Nominalus dydis': { en: 'Nominal diameter (DN)', pl: 'Średnica nominalna (DN)', ru: 'Номинальный диаметр (DN)' },
    'Nominalus dydi': { en: 'Nominal diameter (DN)', pl: 'Średnica nominalna (DN)', ru: 'Номинальный диаметр (DN)' },
    'Nominalus dyd': { en: 'Nominal diameter (DN)', pl: 'Średnica nominalna (DN)', ru: 'Номинальный диаметр (DN)' },
    Nominalus: { en: 'Nominal size', pl: 'Rozmiar nominalny', ru: 'Номинальный размер' },
    'Nomin.': { en: 'Nominal size', pl: 'Rozmiar nominalny', ru: 'Номинальный размер' },
    'Nomin. slėgis': { en: 'Nominal pressure (PN)', pl: 'Ciśnienie nominalne (PN)', ru: 'Номинальное давление (PN)' },
    'Slėgio ribos': { en: 'Pressure rating', pl: 'Zakres ciśnienia', ru: 'Рабочее давление' },
    'Slėgio rib': { en: 'Pressure rating', pl: 'Zakres ciśnienia', ru: 'Рабочее давление' },
    'Temperatūros ribos': { en: 'Temperature range', pl: 'Zakres temperatury', ru: 'Диапазон температур' },
    Tmax: { en: 'Max. temperature (Tmax)', pl: 'Temp. maks. (Tmax)', ru: 'Макс. температура (Tmax)' },
    Sriegis: { en: 'Thread / Connection', pl: 'Gwint / Przyłącze', ru: 'Резьба / Присоединение' },
    Spalva: { en: 'Color / Finish', pl: 'Kolor / Wykończenie', ru: 'Цвет / Покрытие' },
    Maitinimas: { en: 'Power supply', pl: 'Zasilanie', ru: 'Питание' },
    Maitin: { en: 'Power supply', pl: 'Zasilanie', ru: 'Питание' },
    Matmenys: { en: 'Dimensions', pl: 'Wymiary', ru: 'Размеры' },
    Kaina: { en: 'Price', pl: 'Cena', ru: 'Цена' },
    Ka: { en: 'Price', pl: 'Cena', ru: 'Цена' },
    K: { en: 'Parameter', pl: 'Parametr', ru: 'Параметр' },
    Kategorija: { en: 'System category', pl: 'Kategoria systemu', ru: 'Категория системы' },
    Kategorij: { en: 'System category', pl: 'Kategoria systemu', ru: 'Категория системы' },
    Kategor: { en: 'System category', pl: 'Kategoria systemu', ru: 'Категория системы' },
    Parametras: { en: 'Parameter', pl: 'Parametr', ru: 'Параметр' },
    kvs: { en: 'Flow factor (Kvs)', pl: 'Współczynnik Kvs', ru: 'Пропускная способность (Kvs)' },
    Kvs: { en: 'Flow factor (Kvs)', pl: 'Współczynnik Kvs', ru: 'Пропускная способность (Kvs)' },
    Paskirtis: { en: 'Application', pl: 'Zastosowanie', ru: 'Назначение' },
    Galia: { en: 'Thermal Output (kW)', pl: 'Moc grzewcza (kW)', ru: 'Тепловая мощность (кВт)' },
    Tūris: { en: 'Volume (L)', pl: 'Pojemność (L)', ru: 'Объем (л)' },
};

export function localizeSpecKey(specKey: string, locale: string): string {
    const loc = toLoc(locale);
    const trimmed = (specKey || '').trim();
    if (!trimmed || loc === 'lt') return trimmed;

    if (SPEC_KEY_MAP[trimmed]) {
        return SPEC_KEY_MAP[trimmed][loc];
    }
    const lower = trimmed.toLowerCase();
    for (const [k, v] of Object.entries(SPEC_KEY_MAP)) {
        if (k.toLowerCase() === lower) {
            return v[loc];
        }
    }
    return localizeProductTitle(trimmed, loc);
}

export function localizeSpecValue(specVal: string, locale: string): string {
    const loc = toLoc(locale);
    const trimmed = (specVal || '').trim();
    if (!trimmed) return trimmed;
    // W120-A1 P2-14: lt-LT spec values render decimals with a comma ("Kvs 1,01").
    if (loc === 'lt') return formatLtDecimalCommas(trimmed);

    if (CATEGORY_MAP[trimmed]) {
        return CATEGORY_MAP[trimmed][loc];
    }
    return localizeProductTitle(trimmed, loc);
}

type PhraseRule = {
    pattern: RegExp;
    en: string;
    pl: string;
    ru: string;
};

// Ordered phrase rules (longest / most specific technical HVAC patterns first)
const TECHNICAL_PHRASE_RULES: PhraseRule[] = [
    {
        pattern: /Automatinis medienos granulių degiklio komplektas/gi,
        en: 'Automatic wood pellet burner kit',
        pl: 'Automatyczny zestaw palnika na pellet drzewny',
        ru: 'Автоматический комплект пеллетной горелки',
    },
    {
        pattern: /granulių degiklio uždegimo tenas/gi,
        en: 'pellet burner ignition heating element',
        pl: 'grzałka zapalarki palnika pelletowego',
        ru: 'ТЭН розжига пеллетной горелки',
    },
    {
        pattern: /Juodo kvarco kristalo tenas/gi,
        en: 'Black quartz crystal ignition element',
        pl: 'Grzałka kwarcowa zapalarki',
        ru: 'Кварцевый ТЭН розжига',
    },
    {
        pattern: /Keraminis tenas/gi,
        en: 'Ceramic ignition element',
        pl: 'Grzałka ceramiczna zapalarki',
        ru: 'Керамический ТЭН розжига',
    },
    {
        pattern: /Granulinis degiklis/gi,
        en: 'Pellet burner',
        pl: 'Palnik pelletowy',
        ru: 'Пеллетная горелка',
    },
    {
        pattern: /su užsklanda/gi,
        en: 'with shut-off damper',
        pl: 'z przepustnicą',
        ru: 'с заслонкой',
    },
    {
        pattern: /MRV VRF šilumos siurblių sistemos išorinis blokas/gi,
        en: 'MRV VRF heat pump outdoor unit',
        pl: 'jednostka zewnętrzna systemu pomp ciepła MRV VRF',
        ru: 'наружный блок системы тепловых насосов MRV VRF',
    },
    {
        pattern: /šilumos siurblio išorinis blokas/gi,
        en: 'heat pump outdoor unit',
        pl: 'jednostka zewnętrzna pompy ciepła',
        ru: 'наружный блок теплового насоса',
    },
    {
        pattern: /vidinių blokų iki/gi,
        en: 'up to indoor units:',
        pl: 'jednostek wewnętrznych do:',
        ru: 'внутренних блоков до:',
    },
    {
        pattern: /Trieigis pamaišymo vožtuvas su įmontuotu termostatiniu elementu,?\s*grįžtamo srauto temperatūros palaikymui\.?/gi,
        en: '3-way thermostatic mixing valve for boiler return temperature protection.',
        pl: 'Trójdrogowy zawór mieszający z wkładką termostatyczną do ochrony powrotu.',
        ru: 'Трехходовой смесительный клапан со встроенным термостатом для защиты обратки.',
    },
    {
        pattern: /Trieigis pamaišymo vožtuvas/gi,
        en: '3-way mixing valve',
        pl: 'Trójdrogowy zawór mieszający',
        ru: 'Трехходовой смесительный клапан',
    },
    {
        pattern: /temperatūrų diapazonas nuo/gi,
        en: 'temperature range from',
        pl: 'zakres temperatur od',
        ru: 'диапазон температур от',
    },
    {
        pattern: /Movinis dvieigis rutulinis čiaupas su rankenėle/gi,
        en: '2-way threaded ball valve with lever handle',
        pl: 'Dwudrogowy zawór kulowy mufowy z rączką',
        ru: 'Муфтовый двухходовой шаровой кран с рукояткой',
    },
    {
        pattern: /Movinis dvieigis rutulinis čiaupas be rankenėlės/gi,
        en: '2-way threaded ball valve without handle',
        pl: 'Dwudrogowy zawór kulowy mufowy bez rączki',
        ru: 'Муфтовый двухходовой шаровой кран без рукоятки',
    },
    {
        pattern: /Prailginimo komplektas prie kolektoriaus be debitomačių/gi,
        en: 'Manifold extension kit without flowmeters',
        pl: 'Zestaw rozbudowy rozdzielacza bez rotametrów',
        ru: 'Комплект расширения коллектора без расходомеров',
    },
    {
        pattern: /Prailginimo komplektas prie kolektoriaus su debitomačiais/gi,
        en: 'Manifold extension kit with flowmeters',
        pl: 'Zestaw rozbudowy rozdzielacza z rotametrami',
        ru: 'Комплект расширения коллектора с расходомерами',
    },
    {
        pattern: /Pavara rutuliniam čiaupui/gi,
        en: 'Actuator for ball valve',
        pl: 'Siłownik do zaworu kulowego',
        ru: 'Привод для шарового крана',
    },
    {
        pattern: /Pavara trieigiui pamaišymo vožtuvui/gi,
        en: 'Actuator for 3-way mixing valve',
        pl: 'Siłownik do zaworu mieszającego 3-drogowego',
        ru: 'Привод для трехходового смесительного клапана',
    },
    {
        pattern: /Antivandalinis,?\s*įtakai atsparus,?\s*įmontuotas dujinis daviklis/gi,
        en: 'Tamper-proof heavy-duty built-in gas sensor head',
        pl: 'Głowica wandaloodporna z wbudowanym czujnikiem gazowym',
        ru: 'Антивандальная термоголовка со встроенным газовым датчиком',
    },
    {
        pattern: /Kampinis adapteris,?\s*skirtas tiesioginiam prijungimui prie apatinio jungimo radiatorių su ([^–]+?) jungties integruotais ventiliais/gi,
        en: 'Angle adapter for bottom-connection radiators with $1 integrated valves',
        pl: 'Adapter kątowy do grzejników dolnozasilanych z zaworami $1',
        ru: 'Угловой адаптер для радиаторов с нижним подключением $1',
    },
    {
        pattern: /Įmontuotas skystinis daviklis,?\s*skirtas tiesioginiam prijungimui prie apatinio jungimo radiatorių su M30x1[.,]5 jungtimi/gi,
        en: 'Built-in liquid sensor head for bottom-connection radiators (M30x1.5)',
        pl: 'Głowica z czujnikiem cieczowym do grzejników dolnozasilanych (M30x1.5)',
        ru: 'Встроенный жидкостный датчик для радиаторов с нижним подключением (M30x1.5)',
    },
    {
        pattern: /Rekomenduojama naudoti daugiabučiuose SU apskaita/gi,
        en: 'Recommended for metered apartment buildings',
        pl: 'Zalecana do budynków wielorodzinnych z podzielnikami',
        ru: 'Рекомендуется для многоквартирных домов с учетом тепла',
    },
    {
        pattern: /skystinis užpildas,?\s*distancinis daviklis iki/gi,
        en: 'liquid-filled sensor, remote capillary sensor up to',
        pl: 'czujnik cieczowy, czujnik zdalny do',
        ru: 'жидкостный элемент, выносной датчик до',
    },
    {
        pattern: /reguliuojamas be debitomačių/gi,
        en: 'adjustable without flowmeters',
        pl: 'regulowany bez przepływomierzy',
        ru: 'регулируемый без расходомеров',
    },
    {
        pattern: /Grindų šildymo komplektas/gi,
        en: 'Underfloor heating room kit',
        pl: 'Zestaw ogrzewania podłogowego',
        ru: 'Комплект теплого пола',
    },
    {
        pattern: /su dangteliu ir grįžtamo srauto reguliatorium/gi,
        en: 'with cover plate and RTL return temperature limiter',
        pl: 'z pokrywą i ogranicznikiem temperatury powrotu RTL',
        ru: 'с крышкой и ограничителем температуры обратного потока RTL',
    },
    {
        pattern: /su term\.\s*vožtuvu,?\s*dangteliu ir term\.\s*galva K cromas/gi,
        en: 'with thermostatic valve, cover plate and chrome K-head',
        pl: 'z zaworem termostatycznym, pokrywą i głowicą K chrom',
        ru: 'с термоклапаном, крышкой и хромированной термоголовкой K',
    },
    {
        pattern: /Kanalas vamzdžiams iš PU/gi,
        en: 'PU pipe duct channel',
        pl: 'Kanał rurowy z PU',
        ru: 'Канал для труб из ПУ',
    },
    {
        pattern: /žalvariniai chromuoti kolektoriai vandentiekiui/gi,
        en: 'chrome-plated brass plumbing manifolds',
        pl: 'mosiężne chromowane rozdzielacze wodociągowe',
        ru: 'латунные хромированные коллекторы водоснабжения',
    },
    {
        pattern: /Galinė sekcija su automatiniu nuorintoju ir drenažu/gi,
        en: 'Manifold end section with automatic air vent and drain valve',
        pl: 'Sekcja końcowa rozdzielacza z odpowietrznikiem i spustem',
        ru: 'Концевая секция коллектора с автовоздухоотводчиком и дренажем',
    },
    {
        pattern: /grindų\+patalpos jutiklis/gi,
        en: 'floor + room sensor',
        pl: 'czujnik podłogowy + powietrzny',
        ru: 'датчик пола и воздуха',
    },
    {
        pattern: /Bimetalinis NC termostatas su flanšu/gi,
        en: 'Bimetallic NC safety thermostat with mounting flange',
        pl: 'Termostat bimetaliczny NC z kołnierzem',
        ru: 'Биметаллический термостат NC с фланцем',
    },
    {
        pattern: /temperatūros zondas/gi,
        en: 'temperature probe sensor',
        pl: 'czujnik temperatury (sonda)',
        ru: 'температурный зонд (датчик)',
    },
    {
        pattern: /24 valandų programuojamas patalpos termostatas su radijo bangų dažnio perdavimu ir vieno kanalo signalo priėmėju/gi,
        en: '24-hour programmable wireless RF room thermostat with single-channel receiver',
        pl: 'Programowalny bezprzewodowy termostat pokojowy RF z odbiornikiem 1-kanałowym',
        ru: 'Суточный программируемый радиотермостат с одноканальным приемником',
    },
    {
        pattern: /srovės matavimo įrengimas su dvigubo veikimo PT100 matavimo atvamzdžiais/gi,
        en: 'flow measuring orifice with dual-function PT100 test points',
        pl: 'przyrząd pomiarowy przepływu z króćcami PT100',
        ru: 'измерительная диафрагма расхода с ниппелями PT100',
    },
    {
        pattern: /Gilzė žalvarinė/gi,
        en: 'Brass immersion pocket (thermowell)',
        pl: 'Tuleja zanurzeniowa mosiężna',
        ru: 'Латунная защитная гильза',
    },
    {
        pattern: /maitinimo šaltinis Danfoss link centriniam valdikliui/gi,
        en: 'power supply unit for Danfoss Link central controller',
        pl: 'zasilacz do centralnego sterownika Danfoss Link',
        ru: 'блок питания для центрального контроллера Danfoss Link',
    },
    {
        pattern: /Debito matavimo įrenginys/gi,
        en: 'Fixed-orifice flow measurement device',
        pl: 'Urządzenie pomiaru przepływu',
        ru: 'Устройство измерения расхода',
    },
    {
        pattern: /šildymo kilimėlis/gi,
        en: 'electric underfloor heating mat',
        pl: 'mata grzewcza podłogowa',
        ru: 'нагревательный мат теплого пола',
    },
    {
        pattern: /Granulių degiklis/gi,
        en: 'Pellet burner',
        pl: 'Palnik pelletowy',
        ru: 'Пеллетная горелка',
    },
    {
        pattern: /Granulių degikliai/gi,
        en: 'Pellet burners',
        pl: 'Palniki pelletowe',
        ru: 'Пеллетные горелки',
    },
    {
        pattern: /su sraigtu ir valdikliu/gi,
        en: 'with auger conveyor and controller',
        pl: 'z podajnikiem ślimakowym i sterownikiem',
        ru: 'со шнеком и контроллером',
    },
    {
        pattern: /Padavimo sraigtas/gi,
        en: 'Pellet feed auger',
        pl: 'Podajnik ślimakowy pelletu',
        ru: 'Шнек подачи пеллет',
    },
    {
        pattern: /Kieto kuro katilas/gi,
        en: 'Solid fuel boiler',
        pl: 'Kocioł na paliwo stałe',
        ru: 'Твердотопливный котел',
    },
    {
        pattern: /Granulinis katilas/gi,
        en: 'Pellet boiler',
        pl: 'Kocioł pelletowy',
        ru: 'Пеллетный котел',
    },
    {
        pattern: /Dujinis pastatomas kondensacinis katilas su įkrovos kaupikliu,?\s*naudojamas priklausomai\s*\/\s*nepriklausomai nuo patalpų oro\.?/gi,
        en: 'Floor-standing gas condensing boiler with storage tank, room-air dependent/independent.',
        pl: 'Stojący gazowy kocioł kondensacyjny z zasobnikiem warstwowym.',
        ru: 'Напольный газовый конденсационный котел с накопительным бойлером.',
    },
    {
        pattern: /kaupiklio talpa/gi,
        en: 'tank capacity',
        pl: 'pojemność zasobnika',
        ru: 'емкость бойлера',
    },
    {
        pattern: /Šilumos siurblys oras\s*[-–—]\s*vanduo/gi,
        en: 'Air-to-water heat pump',
        pl: 'Pompa ciepła powietrze–woda',
        ru: 'Тепловой насос воздух–вода',
    },
    {
        pattern: /kanalinis \(Duct\) šilumos siurblys\s*[-–—]\s*kondicionierius/gi,
        en: 'ducted heat pump air conditioner',
        pl: 'kanałowa pompa ciepła / klimatyzator (Duct)',
        ru: 'канальный тепловой насос–кондиционер (Duct)',
    },
    {
        pattern: /ŠVOK ir šilumos siurblių automatikos bei montavimo priedas/gi,
        en: 'HVAC & heat pump automation and mounting accessory',
        pl: 'Akcesorium automatyki i montażu HVAC / pomp ciepła',
        ru: 'Аксессуар автоматики и монтажа ОВиК и тепловых насосов',
    },
    {
        pattern: /MRV VRF sistemos vidinis blokas/gi,
        en: 'MRV VRF system indoor unit',
        pl: 'jednostka wewnętrzna systemu MRV VRF',
        ru: 'внутренний блок системы MRV VRF',
    },
    {
        pattern: /plokščias dviejų bakų elektrinis vandens šildytuvas \(boileris\)/gi,
        en: 'flat dual-tank electric water heater (boiler)',
        pl: 'płaski dwuzbiornikowy elektryczny podgrzewacz wody (bojler)',
        ru: 'плоский двухбаковый электрический водонагреватель (бойлер)',
    },
    {
        pattern: /kompaktiškas elektrinis vandens šildytuvas \(boileris\)/gi,
        en: 'compact electric water heater (boiler)',
        pl: 'kompaktowy elektryczny podgrzewacz wody (bojler)',
        ru: 'компактный электрический водонагреватель (бойлер)',
    },
    {
        pattern: /Tūrinis vandens šildytuvas/gi,
        en: 'Storage water heater',
        pl: 'Pojemnościowy podgrzewacz wody',
        ru: 'Емкостный водонагреватель',
    },
    {
        pattern: /Vandens šildytuvas/gi,
        en: 'Water heater',
        pl: 'Podgrzewacz wody',
        ru: 'Водонагреватель',
    },
    {
        pattern: /Oro kondicionierius/gi,
        en: 'Air conditioner',
        pl: 'Klimatyzator',
        ru: 'Кондиционер',
    },
    {
        pattern: /Akumuliacinė talpa/gi,
        en: 'Buffer tank',
        pl: 'Zbiornik buforowy',
        ru: 'Аккумуляционная (буферная) емкость',
    },
    {
        pattern: /Kuro talpa\s*[-–—]\s*bunkeris/gi,
        en: 'Pellet fuel hopper tank',
        pl: 'Zasobnik paliwa – bunkier',
        ru: 'Топливный бункер для пеллет',
    },
    {
        pattern: /Talpa granulėms/gi,
        en: 'Pellet hopper tank',
        pl: 'Zasobnik na pellet',
        ru: 'Емкость (бункер) для пеллет',
    },
    {
        pattern: /išsiplėtimo indas disko formos pakabinamas,?\s*su butyl gumos kamera/gi,
        en: 'wall-mounted disc expansion vessel with butyl bladder',
        pl: 'wiszące dyskowe naczynie wzbiorcze z membraną butylową',
        ru: 'подвесной дисковый расширительный бак с бутиловой мембраной',
    },
    {
        pattern: /išsiplėtimo indas su butyl gumos kamera/gi,
        en: 'expansion vessel with butyl bladder',
        pl: 'naczynie wzbiorcze z membraną butylową',
        ru: 'расширительный бак с бутиловой мембраной',
    },
    {
        pattern: /Plėtimosi indas/gi,
        en: 'Expansion vessel',
        pl: 'Naczynie wzbiorcze',
        ru: 'Расширительный бак',
    },
    {
        pattern: /išsiplėtimo indas/gi,
        en: 'expansion vessel',
        pl: 'naczynie wzbiorcze',
        ru: 'расширительный бак',
    },
    {
        pattern: /išsiplėtim\b/gi,
        en: 'expansion vessel',
        pl: 'naczynie wzbiorcze',
        ru: 'расширительный бак',
    },
    {
        pattern: /antifrizui iki/gi,
        en: 'glycol up to',
        pl: 'glikol do',
        ru: 'антифриз до',
    },
    {
        pattern: /balansinis srauto reguliavimo vožtuvas su įstrižu kotu su užsisandarinančiu matavimo atvamzdžiu su lituojamu antgaliu/gi,
        en: 'balancing flow control valve with inclined stem, self-sealing measuring nipples and solder tailpiece',
        pl: 'równoważący zawór regulacji przepływu ze skośnym trzpieniem, samouszczelniającymi króćcami pomiarowymi i końcówką do lutowania',
        ru: 'балансировочный клапан регулирования потока с наклонным штоком, самоуплотняющимися ниппелями и патрубком под пайку',
    },
    {
        pattern: /balansinis srauto reguliavimo vožtuvas su įstrižu kotu su užsisandarinančiu matavimo atvamzdžiu su flanšais/gi,
        en: 'flanged balancing flow control valve with inclined stem and self-sealing test points',
        pl: 'kołnierzowy zawór równoważący ze skośnym trzpieniem i króćcami pomiarowymi',
        ru: 'фланцевый балансировочный клапан с наклонным штоком и измерительными ниппелями',
    },
    {
        pattern: /balansinis srauto reguliavimo vožtuvas/gi,
        en: 'balancing flow control valve',
        pl: 'równoważący zawór regulacji przepływu',
        ru: 'балансировочный клапан регулирования потока',
    },
    {
        pattern: /Balansinis vožtuvas/gi,
        en: 'Balancing valve',
        pl: 'Zawór równoważący',
        ru: 'Балансировочный клапан',
    },
    {
        pattern: /nerūdijančio plieno grindinio šildymo kolektorius su automatiniais balansiniais ir reguliavimo vožtuvais/gi,
        en: 'stainless steel underfloor heating manifold with automatic balancing & control valves',
        pl: 'rozdzielacz ogrzewania podłogowego ze stali nierdzewnej z automatycznymi zaworami równoważącymi',
        ru: 'коллектор теплого пола из нержавеющей стали с автоматическими балансировочными клапанами',
    },
    {
        pattern: /Grindinio šildymo kolektorius su srauto matuokliais/gi,
        en: 'Underfloor heating manifold with flowmeters',
        pl: 'Rozdzielacz ogrzewania podłogowego z rotametrami',
        ru: 'Коллектор теплого пола с расходомерами',
    },
    {
        pattern: /Grindinio šildymo kolektorius be srauto matuoklių/gi,
        en: 'Underfloor heating manifold without flowmeters',
        pl: 'Rozdzielacz ogrzewania podłogowego bez rotametrów',
        ru: 'Коллектор теплого пола без расходомеров',
    },
    {
        pattern: /grindinio šildymo kolektorius su debitomačiais/gi,
        en: 'underfloor heating manifold with flowmeters',
        pl: 'rozdzielacz ogrzewania podłogowego z przepływomierzami',
        ru: 'коллектор теплого пола с расходомерами',
    },
    {
        pattern: /Kolektorius su debitomačiais/gi,
        en: 'Manifold with flowmeters',
        pl: 'Rozdzielacz z przepływomierzami',
        ru: 'Коллектор с расходомерами',
    },
    {
        pattern: /komplekte nuorintojas,?\s*išleidėjas\s*,?\s*laikikliai,?\s*pajungimas/gi,
        en: 'includes air vent, drain valve, brackets, connection',
        pl: 'w zestawie odpowietrznik, zawór spustowy, uchwyty, przyłącze',
        ru: 'в комплекте воздухоотводчик, сливной кран, кронштейны, подключение',
    },
    {
        pattern: /patalpos temperatūros reguliavimui su K galvute,?\s*su Automatine Srauto Ribojimo \(ASR\) funkcija/gi,
        en: 'room temperature control box with K-head and Automatic Flow Limitation (AFC)',
        pl: 'regulacja temperatury pomieszczenia z głowicą K i automatycznym ograniczeniem przepływu (AFC)',
        ru: 'бокс регулирования температуры помещения с термоголовкой K и автоматическим ограничением потока (AFC)',
    },
    {
        pattern: /patalpos temperatūros reguliav/gi,
        en: 'room temperature control',
        pl: 'regulacja temperatury pomieszczenia',
        ru: 'регулирование температуры помещения',
    },
    {
        pattern: /Termostatinis\s*[-–—]\s*automatinis vožtuvas/gi,
        en: 'Automatic thermostatic valve',
        pl: 'Termostatyczny zawór automatyczny',
        ru: 'Термостатический автоматический клапан',
    },
    {
        pattern: /Termostatinis vožtuvas ypač mažo pasipriešinimo tiesioginis/gi,
        en: 'Low-resistance straight thermostatic valve',
        pl: 'Zawór termostatyczny prosty o niskim oporze',
        ru: 'Термостатический клапан прямой повышенной пропускной способности',
    },
    {
        pattern: /Termostatinis vožtuvas ypač mažo pasipriešinimo ties/gi,
        en: 'Low-resistance straight thermostatic valve',
        pl: 'Zawór termostatyczny prosty o niskim oporze',
        ru: 'Термостатический клапан прямой малого сопротивления',
    },
    {
        pattern: /Termostatinis vožtuvas/gi,
        en: 'Thermostatic valve',
        pl: 'Zawór termostatyczny',
        ru: 'Термостатический клапан',
    },
    {
        pattern: /Termostatinė galvutė/gi,
        en: 'Thermostatic head',
        pl: 'Głowica termostatyczna',
        ru: 'Термостатическая головка',
    },
    {
        pattern: /Termostatinė galva/gi,
        en: 'Thermostatic head',
        pl: 'Głowica termostatyczna',
        ru: 'Термостатическая головка',
    },
    {
        pattern: /Termostatinis elementas/gi,
        en: 'Thermostatic sensor element',
        pl: 'Element termostatyczny',
        ru: 'Термостатический элемент',
    },
    {
        pattern: /Grįžtamo srauto vožtuvas/gi,
        en: 'Return lockshield valve',
        pl: 'Zawór powrotny odcinający',
        ru: 'Запорно-присоединительный клапан обратного потока',
    },
    {
        pattern: /Trieigis srauto skirstymo vožtuvas/gi,
        en: '3-way flow diverting valve',
        pl: 'Trójdrogowy zawór rozdzielający',
        ru: 'Трехходовой распределительный клапан',
    },
    {
        pattern: /termostatiškai valdomas maišymo vožtuvas/gi,
        en: 'thermostatic mixing valve',
        pl: 'termostatyczny zawór mieszający',
        ru: 'термостатический смесительный клапан',
    },
    {
        pattern: /diferencinis persipylimo vožtuvas/gi,
        en: 'differential bypass valve',
        pl: 'zawór nadmiarowo-upustowy',
        ru: 'дифференциальный перепускной клапан',
    },
    {
        pattern: /slėgio perkričio reguliatorius/gi,
        en: 'differential pressure controller',
        pl: 'regulator różnicy ciśnień',
        ru: 'регулятор перепада давления',
    },
    {
        pattern: /srovės matavimo prietaisas su užsisandarinančiais matavimo antgaliais/gi,
        en: 'flow measuring orifice with self-sealing test points',
        pl: 'przyrząd pomiaru przepływu z króćcami pomiarowymi',
        ru: 'прибор измерения расхода с самоуплотняющимися ниппелями',
    },
    {
        pattern: /Cirkuliacinis siurblys/gi,
        en: 'Circulation pump',
        pl: 'Pompa obiegowa',
        ru: 'Циркуляционный насос',
    },
    {
        pattern: /Grindų šildymo valdiklis/gi,
        en: 'Underfloor heating master controller',
        pl: 'Sterownik ogrzewania podłogowego',
        ru: 'Контроллер теплого пола',
    },
    {
        pattern: /galima jungti (\d+) Danfoss pavarų/gi,
        en: 'supports $1 Danfoss actuators',
        pl: 'obsługa $1 siłowników Danfoss',
        ru: 'подключение до $1 приводов Danfoss',
    },
    {
        pattern: /Valdymo pultas šilumos siurbliams/gi,
        en: 'Control panel for heat pumps',
        pl: 'Panel sterowania do pomp ciepła',
        ru: 'Пульт управления для тепловых насосов',
    },
    {
        pattern: /Kambarinis termostatas/gi,
        en: 'Room thermostat',
        pl: 'Termostat pokojowy',
        ru: 'Комнатный термостат',
    },
    {
        pattern: /nuotolinis valdymas,?\s*belaidis/gi,
        en: 'wireless remote control unit',
        pl: 'zdalne sterowanie bezprzewodowe',
        ru: 'беспроводной пульт дистанционного управления',
    },
    {
        pattern: /Elektroterminė pavara/gi,
        en: 'Electrothermal actuator',
        pl: 'Siłownik elektrotermiczny',
        ru: 'Электротермический привод',
    },
    {
        pattern: /Kuro purkštukas/gi,
        en: 'Oil burner nozzle',
        pl: 'Dysza paliwowa',
        ru: 'Топливная форсунка',
    },
    {
        pattern: /oro separatorius/gi,
        en: 'air separator',
        pl: 'separator powietrza',
        ru: 'сепаратор воздуха',
    },
    {
        pattern: /montavimo apdaila/gi,
        en: 'mounting trim plate',
        pl: 'rozeta maskująca montażowa',
        ru: 'монтажная декоративная накладка',
    },
    {
        pattern: /Adatiniai antgaliai/gi,
        en: 'Measuring needle nipples',
        pl: 'Króćce pomiarowe igłowe',
        ru: 'Игольчатые измерительные ниппели',
    },
    {
        pattern: /ventilio korpusas/gi,
        en: 'valve body',
        pl: 'korpus zaworu',
        ru: 'корпус клапана',
    },
    {
        pattern: /jungiamasis antgalis su uždarymo funkcija/gi,
        en: 'shut-off tailpiece fitting',
        pl: 'króciec przyłączeniowy z funkcją odcięcia',
        ru: 'присоединительный патрубок с функцией перекрытия',
    },
    {
        pattern: /srieginis antgalis,?\s*srieginė jungtis/gi,
        en: 'threaded tailpiece, threaded union',
        pl: 'króciec gwintowany, złączka gwintowana',
        ru: 'резьбовой патрубок, резьбовое соединение',
    },
    {
        pattern: /Antgalis plokščiu sandarinimu/gi,
        en: 'Flat-sealing tailpiece union',
        pl: 'Króciec z płaskim uszczelnieniem',
        ru: 'Патрубок с плоским уплотнением',
    },
    {
        pattern: /Impulsinis vamzdelis/gi,
        en: 'Impulse capillary tube',
        pl: 'Rurka impulsowa',
        ru: 'Импульсная трубка',
    },
    {
        pattern: /Distancinio montavimo el\.,?\s*temp\.\s*ribos/gi,
        en: 'Remote dial thermostatic sensor, temp. range',
        pl: 'Czujnik zdalny, zakres temp.',
        ru: 'Выносной регулятор, диапазон темп.',
    },
    {
        pattern: /Įmontuotas daviklis,?\s*skirtas tiesioginiam prijungimui prie apatinio jungimo radiatorių su M30x1[.,]5 jungtimi/gi,
        en: 'Built-in sensor head for bottom-connection radiators with M30x1.5 connection',
        pl: 'Głowica z czujnikiem wbudowanym do grzejników dolnozasilanych M30x1.5',
        ru: 'Встроенный датчик для радиаторов с нижним подключением M30x1.5',
    },
    {
        pattern: /Standartinis,?\s*dujinis užpildas,?\s*distancinis daviklis iki/gi,
        en: 'Standard gas-filled thermostatic sensor, remote sensor up to',
        pl: 'Standardowa głowica gazowa, czujnik zdalny do',
        ru: 'Стандартный газоконденсатный элемент, выносной датчик до',
    },
    {
        pattern: /termostatu jungiama grandinės fazė/gi,
        en: 'thermostat-switched phase relay',
        pl: 'faza obwodu przełączana termostatem',
        ru: 'коммутируемая термостатом фаза цепи',
    },
    {
        pattern: /jungtis iš kairės rad\.\s*pusės/gi,
        en: 'left-hand radiator connection',
        pl: 'przyłącze z lewej strony grzejnika',
        ru: 'подключение с левой стороны радиатора',
    },
    {
        pattern: /jungtis iš dešinės rad\.\s*pusės/gi,
        en: 'right-hand radiator connection',
        pl: 'przyłącze z prawej strony grzejnika',
        ru: 'подключение с правой стороны радиатора',
    },
    {
        pattern: /su išankstiniu nustatymu/gi,
        en: 'with pre-setting',
        pl: 'z nastawą wstępną',
        ru: 'с преднастройкой',
    },
    {
        pattern: /be išankstinio nustatymo/gi,
        en: 'without pre-setting',
        pl: 'bez nastawy wstępnej',
        ru: 'без преднастройки',
    },
    {
        pattern: /išankstinis nustatymas/gi,
        en: 'pre-setting range',
        pl: 'nastawa wstępna',
        ru: 'преднастройка',
    },
    {
        pattern: /su oro nuorintoju/gi,
        en: 'with air vent',
        pl: 'z odpowietrznikiem',
        ru: 'с воздухоотводчиком',
    },
    {
        pattern: /be antgalio drenažui/gi,
        en: 'without drain cock',
        pl: 'bez zaworu spustowego',
        ru: 'без дренажного крана',
    },
    {
        pattern: /su drenažu/gi,
        en: 'with drain port',
        pl: 'z odwodnieniem',
        ru: 'с дренажем',
    },
    {
        pattern: /su nuline padėtimi/gi,
        en: 'with zero shut-off position',
        pl: 'z pozycją zerową',
        ru: 'с нулевым положением',
    },
    {
        pattern: /su įmontuotu jutikliu/gi,
        en: 'with built-in sensor',
        pl: 'z wbudowanym czujnikiem',
        ru: 'со встроенным датчиком',
    },
    {
        pattern: /su trimis antgaliais/gi,
        en: 'with 3 union tailpieces',
        pl: 'z trzema króćcami',
        ru: 'с тремя патрубками',
    },
    {
        pattern: /su adapteriu/gi,
        en: 'with adapter',
        pl: 'z adapterem',
        ru: 'с адаптером',
    },
    {
        pattern: /dvigubai kampinis/gi,
        en: 'double-angle',
        pl: 'podwójnie kątowy',
        ru: 'двухугловой',
    },
    {
        pattern: /nikeliuotas žalvaris/gi,
        en: 'nickel-plated brass',
        pl: 'mosiądz niklowany',
        ru: 'никелированная латунь',
    },
    {
        pattern: /vario ir alavo lydinys/gi,
        en: 'gunmetal / bronze alloy',
        pl: 'stop miedzi i cyny (brąz)',
        ru: 'бронзовый сплав',
    },
    {
        pattern: /nerūdijantis plienas/gi,
        en: 'stainless steel',
        pl: 'stal nierdzewna',
        ru: 'нержавеющая сталь',
    },
    {
        pattern: /nerūd\.?\s*pl\.?/gi,
        en: 'stainless steel',
        pl: 'stal nierdz.',
        ru: 'нерж. сталь',
    },
    {
        pattern: /su išoriniu sriegiu/gi,
        en: 'with male thread',
        pl: 'z gwintem zewnętrznym',
        ru: 'с наружной резьбой',
    },
    {
        pattern: /su vidiniu sriegiu/gi,
        en: 'with female thread',
        pl: 'z gwintem wewnętrznym',
        ru: 'с внутренней резьбой',
    },
    {
        pattern: /išoriniu sriegiu/gi,
        en: 'male thread',
        pl: 'gwint zewnętrzny',
        ru: 'наружная резьба',
    },
    {
        pattern: /vidiniu sriegiu/gi,
        en: 'female thread',
        pl: 'gwint wewnętrzny',
        ru: 'внутренняя резьба',
    },
    {
        pattern: /Išorinis sriegis/gi,
        en: 'Male thread',
        pl: 'Gwint zewnętrzny',
        ru: 'Наружная резьба',
    },
    {
        pattern: /vidinis sriegis/gi,
        en: 'female thread',
        pl: 'gwint wewnętrzny',
        ru: 'внутренняя резьба',
    },
    {
        pattern: /išor\.\s*sriegis/gi,
        en: 'male thread',
        pl: 'gwint zewn.',
        ru: 'нар. резьба',
    },
    {
        pattern: /vidiniu\/išoriniu sriegiu/gi,
        en: 'female/male thread',
        pl: 'gwint wewn./zewn.',
        ru: 'внутр./нар. резьба',
    },
    {
        pattern: /vidus\/išorė/gi,
        en: 'female/male',
        pl: 'wewn./zewn.',
        ru: 'внутр./нар.',
    },
    {
        pattern: /vid\.\/išor\./gi,
        en: 'F/M',
        pl: 'W/Z',
        ru: 'В/Н',
    },
    {
        pattern: /Iš\.\/vid\./gi,
        en: 'M/F',
        pl: 'Z/W',
        ru: 'Н/В',
    },
    {
        pattern: /Jungimas iš sienos/gi,
        en: 'Wall connection',
        pl: 'Przyłącze ze ściany',
        ru: 'Подключение из стены',
    },
    {
        pattern: /Radiatoriaus jungtis/gi,
        en: 'Radiator connection',
        pl: 'Przyłącze grzejnika',
        ru: 'Подключение радиатора',
    },
    {
        pattern: /sistemos jungtis/gi,
        en: 'system connection',
        pl: 'przyłącze instalacji',
        ru: 'подключение к системе',
    },
    {
        pattern: /dvivamzdėms sistemoms/gi,
        en: 'for two-pipe systems',
        pl: 'do instalacji dwururowych',
        ru: 'для двухтрубных систем',
    },
    {
        pattern: /dėžutė vožtuvui/gi,
        en: 'wall box for valve',
        pl: 'skrzynka podtynkowa zaworu',
        ru: 'монтажный бокс для клапана',
    },
    {
        pattern: /rutulinis ventilis/gi,
        en: 'ball valve',
        pl: 'zawór kulowy',
        ru: 'шаровой кран',
    },
    {
        pattern: /Kūginė jungtis/gi,
        en: 'Compression cone fitting',
        pl: 'Złączka stożkowa zaciskowa',
        ru: 'Конусное соединение',
    },
    {
        pattern: /vamzdžio skersmuo/gi,
        en: 'pipe diameter',
        pl: 'średnica rury',
        ru: 'диаметр трубы',
    },
    {
        pattern: /Vamzdžio matmenys/gi,
        en: 'Pipe dimensions',
        pl: 'Wymiary rury',
        ru: 'Размеры трубы',
    },
    {
        pattern: /Nuorintojas automatinis/gi,
        en: 'Automatic air vent',
        pl: 'Odpowietrznik automatyczny',
        ru: 'Автоматический воздухоотводчик',
    },
    {
        pattern: /Apsauga nuo vagystės/gi,
        en: 'Anti-theft protection ring',
        pl: 'Zabezpieczenie przed kradzieżą',
        ru: 'Защита от кражи',
    },
    {
        pattern: /maks\.\s*dif\.\s*slėgis/gi,
        en: 'max. diff. pressure',
        pl: 'maks. ciśnienie różnicowe',
        ru: 'макс. диф. давление',
    },
    {
        pattern: /temp\.\s*ribos/gi,
        en: 'temp. range',
        pl: 'zakres temp.',
        ru: 'диапазон темп.',
    },
    {
        pattern: /kap\.\s*vamzdelis/gi,
        en: 'capillary tube',
        pl: 'kapilara',
        ru: 'капиллярная трубка',
    },
    {
        pattern: /Alkūnė redukuota/gi,
        en: 'Reducing elbow',
        pl: 'Kolano redukcyjne',
        ru: 'Угольник редукционный',
    },
    {
        pattern: /Alkūnė pres\.?\s*su/gi,
        en: 'Press elbow with',
        pl: 'Kolano zaprasowywane z',
        ru: 'Пресс-угольник с',
    },
    {
        pattern: /Redukcinis nipelis/gi,
        en: 'Reducing nipple',
        pl: 'Nypel redukcyjny',
        ru: 'Ниппель редукционный',
    },
    {
        pattern: /Redukuotas nipelis/gi,
        en: 'Reducing nipple',
        pl: 'Nypel redukcyjny',
        ru: 'Ниппель редукционный',
    },
    {
        pattern: /Redukcinė mova/gi,
        en: 'Reducing coupling',
        pl: 'Mufa redukcyjna',
        ru: 'Муфта редукционная',
    },
    {
        pattern: /Jungtis išardoma,?\s*kampinė/gi,
        en: 'Union elbow fitting',
        pl: 'Śrubunek kątowy',
        ru: 'Разъемное угловое соединение',
    },
    {
        pattern: /Lenkimo spiruoklė/gi,
        en: 'Pipe bending spring',
        pl: 'Sprężyna do gięcia rur',
        ru: 'Пружина для гибки труб',
    },
    {
        pattern: /Priešgaisrinė apkaba/gi,
        en: 'Fire-stop pipe collar',
        pl: 'Obejma przeciwpożarowa',
        ru: 'Противопожарная манжета',
    },
    {
        pattern: /raudona rank\./gi,
        en: 'red handle',
        pl: 'czerwona rączka',
        ru: 'красная рукоятка',
    },
    {
        pattern: /mėlyna rank\./gi,
        en: 'blue handle',
        pl: 'niebieska rączka',
        ru: 'синяя рукоятка',
    },
    {
        pattern: /ŠVOK ir santechnikos mazgo elementas,?\s*montuojamas pagal sistemos projektą/gi,
        en: 'Hydronic & HVAC assembly component installed per system specification',
        pl: 'Element węzła instalacji HVAC i sanitarnej, montowany zgodnie z projektem',
        ru: 'Компонент узла ОВиК и сантехники, монтируемый по проекту системы',
    },
    {
        pattern: /ŠVOK ir santechnikos mazgo elementas/gi,
        en: 'Hydronic & HVAC assembly component',
        pl: 'Element węzła instalacji HVAC i sanitarnej',
        ru: 'Компонент инженерного узла ОВиК и сантехники',
    },
    {
        pattern: /pagal sistemos projektą/gi,
        en: 'per system specification',
        pl: 'zgodnie z projektem instalacji',
        ru: 'по проекту системы',
    },
    {
        pattern: /\bmontuojamas\b/gi,
        en: 'installed',
        pl: 'montowany',
        ru: 'монтируемый',
    },
    {
        pattern: /\bpaskirtis\b/gi,
        en: 'application',
        pl: 'zastosowanie',
        ru: 'назначение',
    },
    {
        pattern: /\bsuderinamumas\b/gi,
        en: 'compatibility',
        pl: 'kompatybilność',
        ru: 'совместимость',
    },
    {
        pattern: /su PVM/gi,
        en: 'incl. VAT',
        pl: 'z VAT',
        ru: 'с НДС',
    },
    {
        pattern: /be PVM/gi,
        en: 'excl. VAT',
        pl: 'bez VAT',
        ru: 'без НДС',
    },
];

// Single-word / short-token technical HVAC vocabulary replacements (Unicode-safe boundaries)
const WORD_RULES: PhraseRule[] = [
    { pattern: /Kolektorius/g, en: 'Manifold', pl: 'Rozdzielacz', ru: 'Коллектор' },
    { pattern: /kolektorius/g, en: 'manifold', pl: 'rozdzielacz', ru: 'коллектор' },
    { pattern: /Pavara/g, en: 'Actuator', pl: 'Siłownik', ru: 'Привод' },
    { pattern: /pavara/g, en: 'actuator', pl: 'siłownik', ru: 'привод' },
    { pattern: /pavaros/gi, en: 'actuators', pl: 'siłowniki', ru: 'приводы' },
    { pattern: /Valdiklis/g, en: 'Controller', pl: 'Sterownik', ru: 'Контроллер' },
    { pattern: /valdiklis/g, en: 'controller', pl: 'sterownik', ru: 'контроллер' },
    { pattern: /Vožtuvas/g, en: 'Valve', pl: 'Zawór', ru: 'Клапан' },
    { pattern: /vožtuvas/g, en: 'valve', pl: 'zawór', ru: 'клапан' },
    { pattern: /vožtuvui/gi, en: 'for valve', pl: 'do zaworu', ru: 'для клапана' },
    { pattern: /Ventilis/g, en: 'Valve', pl: 'Zawór', ru: 'Вентиль' },
    { pattern: /ventilis/g, en: 'valve', pl: 'zawór', ru: 'вентиль' },
    { pattern: /Alkūnė/g, en: 'Elbow', pl: 'Kolano', ru: 'Угольник' },
    { pattern: /alkūnė/g, en: 'elbow', pl: 'kolano', ru: 'угольник' },
    { pattern: /Trišakis/g, en: 'Tee fitting', pl: 'Trójnik', ru: 'Тройник' },
    { pattern: /trišakis/g, en: 'tee fitting', pl: 'trójnik', ru: 'тройник' },
    { pattern: /Perėjimas/g, en: 'Transition adapter', pl: 'Przejście', ru: 'Переходник' },
    { pattern: /perėjimas/g, en: 'transition adapter', pl: 'przejście', ru: 'переходник' },
    { pattern: /Redukcija/g, en: 'Reducer', pl: 'Redukcja', ru: 'Редукция' },
    { pattern: /redukcija/g, en: 'reducer', pl: 'redukcja', ru: 'редукция' },
    { pattern: /Mova/g, en: 'Coupling', pl: 'Mufa', ru: 'Муфта' },
    { pattern: /mova/g, en: 'coupling', pl: 'mufa', ru: 'муфта' },
    { pattern: /Aklė/g, en: 'End cap / plug', pl: 'Zaślepka', ru: 'Заглушка' },
    { pattern: /aklė/g, en: 'end cap / plug', pl: 'zaślepka', ru: 'заглушка' },
    { pattern: /Prailgintojas/g, en: 'Extension piece', pl: 'Przedłużka', ru: 'Удлинитель' },
    { pattern: /Izoliacija/g, en: 'Thermal insulation shell', pl: 'Izolacja', ru: 'Теплоизоляция' },
    { pattern: /tiesioginis/gi, en: 'straight', pl: 'prosty', ru: 'прямой' },
    { pattern: /tiesus/gi, en: 'straight', pl: 'prosty', ru: 'прямой' },
    { pattern: /kampinis/gi, en: 'angle', pl: 'kątowy', ru: 'угловой' },
    { pattern: /ašinis/gi, en: 'axial', pl: 'osiowy', ru: 'осевой' },
    { pattern: /presuojamas/gi, en: 'press-fit', pl: 'zaprasowywany', ru: 'пресс-соединение' },
    { pattern: /nikeliuotas/gi, en: 'nickel-plated', pl: 'niklowany', ru: 'никелированный' },
    { pattern: /nikeliuota/gi, en: 'nickel-plated', pl: 'niklowana', ru: 'никелированная' },
    { pattern: /bronza/gi, en: 'bronze', pl: 'brąz', ru: 'бронза' },
    { pattern: /žalv\./gi, en: 'brass', pl: 'mosiądz', ru: 'латунь' },
    { pattern: /žalvaris/gi, en: 'brass', pl: 'mosiądz', ru: 'латунь' },
    { pattern: /sklende/gi, en: 'shut-off valve', pl: 'zaworem odcinającym', ru: 'запорным вентилем' },
    { pattern: /maitinimas/gi, en: 'supply', pl: 'zasilanie', ru: 'питание' },
    { pattern: /(\d+)[- ]*zonų/gi, en: '$1-zone', pl: '$1-strefowy', ru: '$1-зонный' },
    { pattern: /(\d+)\s*(?:žiedų|žiedai)/gi, en: '$1 loops', pl: '$1 obwodów', ru: '$1 контуров' },
    { pattern: /(\d+)(?:-[a-ząčęėįšųūž]+)?\s*(?:atšakų|atšakos)/gi, en: '$1 branches', pl: '$1 obwodów', ru: '$1 выходов' },
    { pattern: /(\d+)-pozicinė/gi, en: '$1-point', pl: '$1-punktowy', ru: '$1-точечный' },
    { pattern: /atjungiamas/gi, en: 'isolatable', pl: 'z odcięciem', ru: 'отключаемый' },
    { pattern: /termostatas/gi, en: 'thermostat', pl: 'termostat', ru: 'термостат' },
    { pattern: /\biki\b/gi, en: 'up to', pl: 'do', ru: 'до' },
    { pattern: /sriegio jungtis/gi, en: 'threaded fitting', pl: 'złączka gwintowana', ru: 'резьбовое соединение' },
    { pattern: /srieginė jungtis/gi, en: 'threaded union', pl: 'złączka gwintowana', ru: 'резьбовое соединение' },
    { pattern: /virinama jungtis/gi, en: 'weld connection', pl: 'przyłącze spawane', ru: 'приварное соединение' },
    { pattern: /flanšinis jungimas/gi, en: 'flanged connection', pl: 'połączenie kołnierzowe', ru: 'фланцевое соединение' },
    { pattern: /jungtis/gi, en: 'connection', pl: 'przyłącze', ru: 'соединение' },
    { pattern: /spalva/gi, en: 'color', pl: 'kolor', ru: 'цвет' },
    { pattern: /balta\b/gi, en: 'white', pl: 'biała', ru: 'белый' },
    { pattern: /baltas\b/gi, en: 'white', pl: 'biały', ru: 'белый' },
    { pattern: /Ištisinė/gi, en: 'Solid cone', pl: 'Stożek pełny', ru: 'Сплошной распыл' },
    { pattern: /įmontuojamas/gi, en: 'built-in', pl: 'do zabudowy', ru: 'встраиваемый' },
    { pattern: /pakuotė/gi, en: 'pack of', pl: 'opakowanie', ru: 'упаковка' },
    { pattern: /(\d+)\s*vnt\.?/gi, en: '$1 pcs', pl: '$1 szt.', ru: '$1 шт.' },
    { pattern: /(\d+)\s*ltr\.?/gi, en: '$1 L', pl: '$1 L', ru: '$1 л' },
    { pattern: /Standartinis/g, en: 'Standard', pl: 'Standardowy', ru: 'Стандартный' },
    { pattern: /standartinis/g, en: 'standard', pl: 'standardowy', ru: 'стандартный' },
    { pattern: /šilumos siurblys/gi, en: 'heat pump', pl: 'pompa ciepła', ru: 'тепловой насос' },
    { pattern: /šilumos siurbliai/gi, en: 'heat pumps', pl: 'pompy ciepła', ru: 'тепловые насосы' },
    { pattern: /katilas/gi, en: 'boiler', pl: 'kocioł', ru: 'котел' },
    { pattern: /degiklis/gi, en: 'burner', pl: 'palnik', ru: 'горелка' },
    { pattern: /siurblys/gi, en: 'pump', pl: 'pompa', ru: 'насос' },
    { pattern: /boileris/gi, en: 'water heater', pl: 'bojler', ru: 'бойлер' },
    { pattern: /talpa/gi, en: 'tank', pl: 'zasobnik', ru: 'емкость' },
    { pattern: /indas/gi, en: 'vessel', pl: 'naczynie', ru: 'бак' },
    { pattern: /tenas/gi, en: 'heating element', pl: 'grzałka', ru: 'ТЭН' },
];

export function localizeProductTitle(title: string, locale: string): string {
    const loc = toLoc(locale);
    if (!title || loc === 'lt') return title;

    let out = title;
    for (const rule of TECHNICAL_PHRASE_RULES) {
        out = out.replace(rule.pattern, rule[loc]);
    }
    for (const rule of WORD_RULES) {
        out = out.replace(rule.pattern, rule[loc]);
    }
    return out;
}

const TECH_CHIP_MAP: Record<string, Record<Exclude<SupportedLocale, 'lt'>, string>> = {
    'Dešininė (R)': { en: 'Right-hand (R)', pl: 'Prawa (R)', ru: 'Правая (R)' },
    'Kairinė (L)': { en: 'Left-hand (L)', pl: 'Lewa (L)', ru: 'Левая (L)' },
    Termostatinis: { en: 'Thermostatic', pl: 'Termostatyczny', ru: 'Термостатический' },
    Kolektorius: { en: 'Manifold', pl: 'Rozdzielacz', ru: 'Коллектор' },
    Hidronika: { en: 'Hydronics', pl: 'Hydronika', ru: 'Гидроника' },
    'ŠVOK standartas': { en: 'HVAC Standard', pl: 'Standard HVAC', ru: 'Стандарт ОВиК' },
    'EN / ISO standartas': { en: 'EN / ISO Standard', pl: 'Standard EN / ISO', ru: 'Стандарт EN / ISO' },
};

export function localizeTechChip(chip: string, locale: string): string {
    const loc = toLoc(locale);
    const trimmed = (chip || '').trim();
    if (!trimmed || loc === 'lt') return trimmed;
    if (TECH_CHIP_MAP[trimmed]) return TECH_CHIP_MAP[trimmed][loc];
    return trimmed;
}

export function localizeProductHook(
    hook: string,
    product: { title: string; sku: string; brand: string; category: string },
    locale: string,
): string {
    const loc = toLoc(locale);
    if (loc === 'lt') {
        return hook || `${product.brand} inžinerinis mazgas (${product.sku}).`;
    }
    const locTitle = localizeProductTitle(product.title, loc);
    const locCat = localizeCategoryLabel(product.category, loc);
    if (loc === 'en') {
        return `${product.brand} precision engineering component (${product.sku}) for ${locCat.toLowerCase()}.`;
    }
    if (loc === 'pl') {
        return `Komponent inżynieryjny ${product.brand} (${product.sku}) – ${locTitle.slice(0, 90)}.`;
    }
    return `Инженерный узел ${product.brand} (${product.sku}) — категория «${locCat}».`;
}

export function localizeProductUxGuide(
    uxGuide: ProductUxGuide,
    product: { title: string; sku: string; brand: string },
    locale: string,
): ProductUxGuide {
    const loc = toLoc(locale);
    if (loc === 'lt') return uxGuide;

    const locTitle = localizeProductTitle(product.title, loc);

    if (loc === 'en') {
        return {
            ...uxGuide,
            subtypeTitle: `${product.brand} Hydronic & HVAC Assembly (${product.sku})`,
            subtypeBadge: `${product.brand} · EN 12828`,
            whatYouGet: [
                `${locTitle} (${product.sku}) in original ${product.brand} factory packaging`,
                'Factory-calibrated brass / stainless housing with integrated EPDM / NBR seals',
                'Technical datasheet and hydraulic mounting parameters according to EN 12828',
            ],
            whatYouNeed: [
                'Matching threaded union or compression adapter sized to your pipe diameter (DN15 / DN20 / DN25)',
                'Calibrated spanner or torque wrench for thread/union tightening without housing distortion',
                'System shut-off and air-bleeding check before commissioning the circuit',
            ],
            steps: [
                {
                    title: 'Verify thread & nominal diameter (DN)',
                    detail: `Confirm that ${product.sku} connection matches the supply/return pipework and flow direction arrow.`,
                },
                {
                    title: 'Mount the body onto the isolated branch',
                    detail: 'Depressurise the heating circuit, fit the union tailpiece and tighten to factory torque.',
                },
                {
                    title: 'Set hydraulic pre-setting / control parameter',
                    detail: 'Adjust the flow scale (Kvs / l/h) or controller setting according to room or boiler loop load.',
                },
                {
                    title: 'Pressurise, bleed air & verify tightness',
                    detail: 'Refill the loop, vent trapped air and verify leak-free operation under operating temperature.',
                },
            ],
            proTip: `When installing ${product.brand} (${product.sku}), never wind hemp onto flat gasket seats or Eurocone O-ring cones — seal only tapered pipe threads.`,
            commonMistake: 'Installing the valve against the cast flow-direction arrow on the body.',
            selfCheck: [
                `Does the connection size and DN of ${product.sku} match your manifold, boiler or radiator port?`,
                'Have you added matching union fittings, actuators or thermostatic heads to your cart?',
                'Is the operating pressure (PN) and temperature rating suitable for your heating circuit?',
            ],
            safetyNote: 'Always isolate the circulation pump and relieve pressure before installation.',
        };
    }

    if (loc === 'pl') {
        return {
            ...uxGuide,
            subtypeTitle: `Zespół inżynieryjny HVAC ${product.brand} (${product.sku})`,
            subtypeBadge: `${product.brand} · EN 12828`,
            whatYouGet: [
                `${locTitle} (${product.sku}) w oryginalnym opakowaniu fabrycznym ${product.brand}`,
                'Fabrycznie skalibrowany korpus z uszczelnieniem EPDM / NBR zgodny z normą EN 12828',
                'Specyfikacja techniczna oraz parametry hydrauliczne montażu',
            ],
            whatYouNeed: [
                'Odpowiednie śrubunki lub złączki Eurokonus dopasowane do średnicy rury (DN15 / DN20 / DN25)',
                'Klucz płaski do bezpiecznego dokręcenia śrubunków bez uszkodzenia korpusu',
                'Zawór odcinający oraz odpowietrznik na obsługiwanym obiegu grzewczym',
            ],
            steps: [
                {
                    title: 'Sprawdź gwint i średnicę nominalną (DN)',
                    detail: `Upewnij się, że przyłącze ${product.sku} odpowiada średnicy rurociągu oraz kierunkowi przepływu.`,
                },
                {
                    title: 'Zamontuj korpus na odciętym odcinku instalacji',
                    detail: 'Spuść ciśnienie w obiegu, zamontuj półśrubunek i dokręć nakrętkę z wyczuciem.',
                },
                {
                    title: 'Ustaw nastawę wstępną (Kvs / l/h)',
                    detail: 'Dobierz nastawę przepływu lub parametr sterownika zgodnie z mocą grzejnika lub pętli.',
                },
                {
                    title: 'Napełnij obieg, odpowietrz i sprawdź szczelność',
                    detail: 'Uruchom obieg na roboczej temperaturze i skontroluj szczelność wszystkich połączeń.',
                },
            ],
            proTip: `Podczas montażu ${product.brand} (${product.sku}) nie nawijaj pakuł na płaskie uszczelki ani stożki z O-ringiem — uszczelniaj wyłącznie gwinty rurowe.`,
            commonMistake: 'Montaż zaworu niezgodnie ze strzałką kierunku przepływu wytłoczoną na korpusie.',
            selfCheck: [
                `Czy średnica przyłącza ${product.sku} pasuje do Twojego rozdzielacza, kotła lub grzejnika?`,
                'Czy dodałeś do koszyka pasującą głowicę termostatyczną, siłownik lub złączki?',
                'Czy ciśnienie nominalne (PN) i temperatura pracy odpowiadają parametrom instalacji?',
            ],
            safetyNote: 'Przed montażem zawsze wyłącz pompę obiegową i zredukuj ciśnienie w instalacji.',
        };
    }

    return {
        ...uxGuide,
        subtypeTitle: `Инженерный узел ОВиК ${product.brand} (${product.sku})`,
        subtypeBadge: `${product.brand} · EN 12828`,
        whatYouGet: [
            `${locTitle} (${product.sku}) в оригинальной заводской упаковке ${product.brand}`,
            'Заводской корпус из латуни / бронзы / нерж. стали со штатными уплотнениями EPDM',
            'Технический паспорт и гидравлические параметры подключения по EN 12828',
        ],
        whatYouNeed: [
            'Ответные резьбовые сгоны или фитинги Евроконус под диаметр трубы (DN15 / DN20 / DN25)',
            'Рожковый ключ для аккуратной затяжки накидных гаек без перекоса корпуса',
            'Запорная арматура и воздухоотводчик на обслуживаемом контуре отопления',
        ],
        steps: [
            {
                title: 'Проверьте резьбу и номинальный диаметр (DN)',
                detail: `Убедитесь, что присоединение ${product.sku} соответствует трубопроводу и стрелке направления потока.`,
            },
            {
                title: 'Установите узел на перекрытый участок контура',
                detail: 'Сбросьте давление в ветке, установите полусгон и равномерно затяните накидную гайку.',
            },
            {
                title: 'Выставьте преднастройку потока (Kvs / л/ч)',
                detail: 'Установите расчетное значение на шкале клапана или контроллера по мощности контура.',
            },
            {
                title: 'Заполните систему, удалите воздух и проверьте герметичность',
                detail: 'Запустите циркуляцию в рабочем температурном режиме и проверьте отсутствие протечек.',
            },
        ],
        proTip: `При монтаже ${product.brand} (${product.sku}) не наматывайте лен на плоские прокладки и конусы с O-кольцом — герметизируйте только резьбовые хвостовики.`,
        commonMistake: 'Установка клапана против стрелки направления потока на корпусе.',
        selfCheck: [
            `Соответствует ли резьба и диаметр ${product.sku} вашему коллектору, котлу или радиатору?`,
            'Добавили ли вы в корзину совместимую термоголовку, сервопривод или ответные фитинги?',
            'Подходит ли номинальное давление (PN) и температура для вашей системы отопления?',
        ],
        safetyNote: 'Перед началом работ отключите циркуляционный насос и сбросьте давление в контуре.',
    };
}

export function localizeProductFaqItems(
    faqItems: ProductFaqItem[],
    product: { title: string; sku: string; brand: string; category: string; priceEur: number },
    locale: string,
): ProductFaqItem[] {
    const loc = toLoc(locale);
    if (loc === 'lt') return faqItems;

    const locTitle = localizeProductTitle(product.title, loc);
    const locCat = localizeCategoryLabel(product.category, loc);
    const priceFormatted = `${product.priceEur.toFixed(2).replace('.', ',')} €`;

    if (loc === 'en') {
        return [
            {
                question: `Will ${locTitle} (${product.sku}) fit my existing heating system?`,
                answer: `Yes, this ${product.brand} unit (SKU ${product.sku}, category: ${locCat}) is manufactured to European EN 12828 hydronic standards. Verify the connection thread or nominal size (e.g. DN15 1/2", DN20 3/4", M30×1.5 or Danfoss RA Click) — our engineering advisor Vytautas lists directly compatible mating components on this page.`,
            },
            {
                question: `How does ${product.brand} ${product.sku} differ from budget alternatives?`,
                answer: `Genuine ${product.brand} components use corrosion-resistant alloys (DZR brass, bronze or stainless steel) and calibrated flow paths, preventing valve sticking, water-hammer noise and premature seal leaks over 10+ heating seasons.`,
            },
            {
                question: `What mating fittings are needed to install ${product.sku} in one visit?`,
                answer: `When installing ${locTitle} (${product.sku}, retail price ${priceFormatted}), check whether you need matching union tailpieces, Eurocone adapters, a mating thermostatic head or actuator. See the compatible parts section above.`,
            },
            {
                question: `How to avoid the most common installation mistake with ${product.sku}?`,
                answer: `Always observe the flow-direction arrow on the housing, depressurise the loop before fitting, and never apply hemp or tape onto flat union gaskets or O-ring cones.`,
            },
        ];
    }

    if (loc === 'pl') {
        return [
            {
                question: `Czy ${locTitle} (${product.sku}) będzie pasować do mojej instalacji grzewczej?`,
                answer: `Tak, produkt ${product.brand} (kod SKU ${product.sku}, kategoria: ${locCat}) jest wykonany zgodnie z europejskimi normami HVAC EN 12828. Przed montażem sprawdź gwint lub średnicę przyłączeniową (np. DN15 1/2", DN20 3/4", M30×1,5 lub Danfoss RA Click).`,
            },
            {
                question: `Czym ${product.brand} ${product.sku} różni się od tańszych zamienników?`,
                answer: `Oryginalna armatura ${product.brand} zapewnia dokładną charakterystykę przepływu (Kvs), odporność na korozję oraz pełną dostępność części zamiennych z magazynu w Kownie.`,
            },
            {
                question: `Jakie dodatkowe elementy są potrzebne do montażu ${product.sku}?`,
                answer: `Przy montażu ${locTitle} (${product.sku}, cena ${priceFormatted}) warto od razu dobrać pasujące śrubunki, złączki Eurokonus, głowicę termostatyczną lub siłownik z sekcji rekomendowanych produktów.`,
            },
            {
                question: `Jak uniknąć najczęstszego błędu podczas montażu ${product.sku}?`,
                answer: `Montuj element zgodnie ze strzałką kierunku przepływu przy wyłączonej pompie obiegowej i nie stosuj pakuł na płaskich uszczelkach ani złączach stożkowych z O-ringiem.`,
            },
        ];
    }

    return [
        {
            question: `Подойдет ли ${locTitle} (${product.sku}) к моей системе отопления?`,
            answer: `Да, изделие ${product.brand} (код ${product.sku}, категория: «${locCat}») спроектировано по европейским стандартам ОВиК EN 12828. Перед монтажом сверьте присоединительную резьбу или диаметр (DN15 1/2", DN20 3/4", M30×1,5 или Danfoss RA Click).`,
        },
        {
            question: `Чем ${product.brand} ${product.sku} отличается от бюджетных аналогов?`,
            answer: `Оригинальная арматура ${product.brand} отличается точной гидравлической характеристикой (Kvs), стойкостью к коррозии и 10+ летней поддержкой запчастями со склада в Каунасе.`,
        },
        {
            question: `Какие сопутствующие детали нужны для монтажа ${product.sku}?`,
            answer: `При установке ${locTitle} (${product.sku}, цена ${priceFormatted}) рекомендуем сразу проверить наличие ответных сгонов, адаптеров Евроконус, совместимой термоголовки или сервопривода в блоке совместимости.`,
        },
        {
            question: `Как избежать частой ошибки при установке узла ${product.sku}?`,
            answer: `Соблюдайте направление стрелки потока на корпусе, проводите монтаж при отключенном насосе и не подматывайте лен на плоские прокладки и конусные соединения с O-кольцом.`,
        },
    ];
}

export function localizeCompatibilityData(
    compat: { roleLabelLt: string; bundleExplanation: string; sku: string; brand: string },
    locale: string,
): { roleLabel: string; bundleExplanation: string } {
    const loc = toLoc(locale);
    if (loc === 'lt') {
        return {
            roleLabel: compat.roleLabelLt,
            bundleExplanation: compat.bundleExplanation,
        };
    }
    if (loc === 'en') {
        return {
            roleLabel: localizeProductTitle(compat.roleLabelLt, 'en') || 'Hydronic system node',
            bundleExplanation: `Verified mating components for ${compat.brand} (${compat.sku}) matched by connection standard (DN / thread / M30×1.5 / RA Click) and hydraulic compatibility.`,
        };
    }
    if (loc === 'pl') {
        return {
            roleLabel: localizeProductTitle(compat.roleLabelLt, 'pl') || 'Węzeł instalacji grzewczej',
            bundleExplanation: `Zweryfikowane elementy współpracujące dla ${compat.brand} (${compat.sku}), dobrane według standardu przyłącza (DN / gwint / M30×1,5 / RA Click).`,
        };
    }
    return {
        roleLabel: localizeProductTitle(compat.roleLabelLt, 'ru') || 'Узел системы отопления',
        bundleExplanation: `Проверенные совместимые комплектующие для ${compat.brand} (${compat.sku}), подобранные по стандарту резьбы и гидравлическим параметрам.`,
    };
}

export function localizePairingReason(
    reasonLt: string,
    relationType: string,
    locale: string,
): string {
    const loc = toLoc(locale);
    if (loc === 'lt') return reasonLt;
    if (loc === 'en') {
        if (relationType === 'essential_pair') {
            return 'Direct mechanical & thread match for complete assembly.';
        }
        if (relationType === 'system_completion') {
            return 'Recommended companion component for the same hydronic loop.';
        }
        return 'Compatible engineering alternative with matching connection standard.';
    }
    if (loc === 'pl') {
        if (relationType === 'essential_pair') {
            return 'Bezpośrednie dopasowanie gwintu i standardu przyłącza.';
        }
        if (relationType === 'system_completion') {
            return 'Zalecany element uzupełniający tego samego obiegu grzewczego.';
        }
        return 'Kompatybilna alternatywa inżynieryjna o tych samych parametrach.';
    }
    if (relationType === 'essential_pair') {
        return 'Прямая совместимость по резьбе и посадочному стандарту.';
    }
    if (relationType === 'system_completion') {
        return 'Рекомендуемый компонент для полной комплектации контура.';
    }
    return 'Совместимая инженерная альтернатива с аналогичными параметрами.';
}
